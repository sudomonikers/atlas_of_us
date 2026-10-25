//asks the atlas api for skills, as a logged in user would. The api runs its gates and resolver on each one, creates the
//stubs, and publishes SkillCreated
use std::time::Duration;

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

use crate::BoxError;

pub struct Api {
    http: reqwest::Client,
    base: String,
    token: String,
}

//how many times a request is tried before it's left for the next run
const TRIES: u32 = 4;
//how long to wait when the waf rate limits us. Its window is 5 minutes (infrastructure/waf.tf)
const RATE_LIMITED_WAIT: Duration = Duration::from_secs(60);
pub const TOKEN_EXPIRED: &str = "the token expired. Get a new one and rerun, which picks up where this left off";

impl Api {
    //`token` is a login token (x-atlas-token), such as one copied from the ui. It's checked with GET /api/auth/me
    pub async fn new(base: &str, token: &str) -> Result<Api, BoxError> {
        let http = reqwest::Client::builder().timeout(Duration::from_secs(90)).build()?;
        let api = Api { http, base: base.trim_end_matches('/').to_string(), token: token.trim().to_string() };
        let response = api.http.get(format!("{}/api/auth/me", api.base)).header("x-atlas-token", &api.token).send().await?;
        let status = response.status();
        if !status.is_success() {
            return Err(format!("the token wasn't accepted ({status}): {}", response.text().await.unwrap_or_default()).into());
        }
        Ok(api)
    }

    //asks for one skill (POST /api/skills) and returns the api's outcome: created, existing, not_a_skill or rejected.
    //Rate limits wait out the waf's window, and server errors are retried
    pub async fn ask(&self, label: &str) -> Result<Value, BoxError> {
        let body = json!({"query": label}).to_string();
        //cloudfront signs requests to the lambda's function url, and a signed POST needs the hash of its body
        let hash: String = Sha256::digest(body.as_bytes()).iter().map(|b| format!("{b:02x}")).collect();
        let mut tries = 0;
        loop {
            tries += 1;
            let sent = self.http.post(format!("{}/api/skills", self.base))
                .header("x-atlas-token", &self.token)
                .header("content-type", "application/json")
                .header("x-amz-content-sha256", &hash)
                .body(body.clone())
                .send().await;
            let failure = match sent {
                Ok(response) if response.status().is_success() => return Ok(response.json().await?),
                Ok(response) if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS => {
                    tracing::warn!("rate limited, waiting {RATE_LIMITED_WAIT:?}");
                    tokio::time::sleep(RATE_LIMITED_WAIT).await;
                    tries -= 1; //waiting out the limit isn't a failed try
                    continue;
                }
                Ok(response) if response.status().is_server_error() => format!("{}: {}", response.status(), response.text().await.unwrap_or_default()),
                Ok(response) if response.status() == reqwest::StatusCode::UNAUTHORIZED => {
                    return Err(TOKEN_EXPIRED.into());
                }
                Ok(response) => return Err(format!("{}: {}", response.status(), response.text().await.unwrap_or_default()).into()),
                Err(e) => e.to_string(),
            };
            if tries >= TRIES {
                return Err(failure.into());
            }
            let wait = Duration::from_secs(2u64.pow(tries));
            tracing::warn!(label, "{failure}, retrying in {wait:?}");
            tokio::time::sleep(wait).await;
        }
    }
}
