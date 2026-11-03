//the ICD-API, which has each ICF category's definition, inclusions and exclusions. It takes OAuth client credentials
//from an account at icd.who.int/icdapi. See https://icd.who.int/docs/icd-api/APIDoc-Version2
use std::{env, thread, time::Duration};

use reqwest::{StatusCode, blocking::Client};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::BoxError;

const TOKEN_URL: &str = "https://icdaccessmanagement.who.int/connect/token";
//a pause between requests, to go easy on WHO's servers
const PAUSE: Duration = Duration::from_millis(200);

//what WHO says a category covers
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Definition {
    pub code: String,
    pub definition: Option<String>,
    pub inclusions: Vec<String>,
    pub exclusions: Vec<String>,
}

pub struct Api {
    client: Client,
    release: String,
    token: Option<String>,
}

impl Api {
    pub fn new(release: &str) -> Self {
        Api { client: Client::new(), release: release.to_string(), token: None }
    }

    fn token(&mut self) -> Result<String, BoxError> {
        if let Some(token) = &self.token {
            return Ok(token.clone());
        }
        let id = env::var("ICD_CLIENT_ID").map_err(|_| "set ICD_CLIENT_ID and ICD_CLIENT_SECRET to your ICD-API access keys")?;
        let secret = env::var("ICD_CLIENT_SECRET").map_err(|_| "set ICD_CLIENT_SECRET to your ICD-API client secret")?;
        let response: Value = self.client.post(TOKEN_URL)
            .form(&[("grant_type", "client_credentials"), ("scope", "icdapi_access"), ("client_id", &id), ("client_secret", &secret)])
            .send()?
            .error_for_status()?
            .json()?;
        let token = response["access_token"].as_str().ok_or("the ICD-API gave no access token")?.to_string();
        self.token = Some(token.clone());
        Ok(token)
    }

    //a category's definition, from its entity in the release's ICF linearization. A token lasts an hour, so an expired
    //one is replaced and the request tried again
    pub fn definition(&mut self, code: &str, entity: &str) -> Result<Definition, BoxError> {
        let url = format!("https://id.who.int/icd/release/11/{}/icf/{entity}", self.release);
        for _ in 0..2 {
            let token = self.token()?;
            thread::sleep(PAUSE);
            let response = self.client.get(&url)
                .bearer_auth(token)
                .header("Accept", "application/json")
                .header("Accept-Language", "en")
                .header("API-Version", "v2")
                .send()?;
            if response.status() == StatusCode::UNAUTHORIZED {
                self.token = None;
                continue;
            }
            let entity: Value = response.error_for_status()?.json()?;
            let labels = |field: &str| entity[field].as_array().map(|items| {
                items.iter().filter_map(|i| i["label"]["@value"].as_str().map(str::to_string)).collect()
            }).unwrap_or_default();
            return Ok(Definition {
                code: code.to_string(),
                definition: entity["definition"]["@value"].as_str().map(str::to_string),
                inclusions: labels("inclusion"),
                exclusions: labels("exclusion"),
            });
        }
        Err(format!("the ICD-API turned down the access keys for {code}").into())
    }
}
