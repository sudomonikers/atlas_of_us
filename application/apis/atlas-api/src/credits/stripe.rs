//the few calls to Stripe that buying credits needs, over its REST api. Checkout and the billing portal are Stripe's own
//hosted pages, so no card details ever reach us. What's for sale is set up in Stripe, not here: the pack and the
//subscription are the active prices with the lookup keys below, and the pack's price says how many credits it is in its
//metadata, so a price is changed in Stripe alone, by moving its lookup key to a new one
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use serde::Deserialize;
use serde::de::DeserializeOwned;
use tokio::sync::Mutex;

use crate::helpers::jobs::BoxError;

const API: &str = "https://api.stripe.com/v1";
const VERSION: &str = "2025-03-31.basil"; //the api version the shapes below are read in

//the lookup keys of the prices on sale
pub const PACK: &str = "credits_pack";
pub const SUBSCRIPTION: &str = "unlimited_monthly";

//how long the prices are kept before they're read from Stripe again, so a change there shows within it
const PRICES_FOR: Duration = Duration::from_secs(600);

//Stripe. None on AppState when STRIPE_SECRET_KEY isn't set
#[derive(Clone)]
pub struct Stripe {
    http: reqwest::Client,
    key: String,
    pub app_url: String, //where checkout and the portal send people back to
    prices: Arc<Mutex<Option<(Instant, Prices)>>>, //the prices on sale, as last read
}

#[derive(Deserialize, Clone)]
pub struct Price {
    pub id: String,
    pub unit_amount: i64, //in the currency's smallest unit, such as cents
    pub currency: String,
    #[serde(default)]
    metadata: HashMap<String, String>,
}

impl Price {
    //how many credits it buys, from its metadata. Only the pack's has them
    pub fn credits(&self) -> Option<i64> {
        self.metadata.get("credits")?.parse().ok()
    }
}

//the pack and the subscription
#[derive(Clone)]
pub struct Prices {
    pub pack: Price,
    pub subscription: Price,
}

#[derive(Deserialize)]
struct List<T> {
    data: Vec<T>,
}

#[derive(Deserialize)]
struct LookedUp {
    lookup_key: Option<String>,
    #[serde(flatten)]
    price: Price,
}

#[derive(Deserialize)]
pub struct CheckoutSession {
    pub id: String,
    pub url: Option<String>,
    pub status: Option<String>, //open, complete or expired
    pub client_reference_id: Option<String>,
    pub customer: Option<String>,
    pub subscription: Option<Subscription>, //expanded when read back
    line_items: Option<List<LineItem>>, //expanded when read back
}

#[derive(Deserialize)]
struct LineItem {
    quantity: Option<i64>,
    price: Option<Price>,
}

impl CheckoutSession {
    //how many credits it bought, from the prices it was paid at, whatever they say now
    pub fn credits(&self) -> i64 {
        self.line_items.iter().flat_map(|l| &l.data)
            .map(|i| i.quantity.unwrap_or(1) * i.price.as_ref().and_then(Price::credits).unwrap_or(0))
            .sum()
    }
}

#[derive(Deserialize)]
pub struct Subscription {
    pub id: String,
    pub status: String,
    items: List<Item>,
}

#[derive(Deserialize)]
struct Item {
    current_period_end: i64,
}

impl Subscription {
    //when what they've paid for runs out, in unix seconds
    pub fn period_end(&self) -> Option<i64> {
        self.items.data.iter().map(|i| i.current_period_end).max()
    }

    //whether it's still being paid for
    pub fn live(&self) -> bool {
        matches!(self.status.as_str(), "active" | "trialing")
    }
}

#[derive(Deserialize)]
struct Portal {
    url: String,
}

//a Stripe api error, which says what was wrong
#[derive(Deserialize)]
struct Failure {
    error: FailureDetail,
}

#[derive(Deserialize)]
struct FailureDetail {
    message: Option<String>,
}

impl Stripe {
    pub fn new(http: reqwest::Client, key: String, app_url: String) -> Self {
        Self { http, key, app_url, prices: Arc::new(Mutex::new(None)) }
    }

    async fn send<T: DeserializeOwned>(&self, request: reqwest::RequestBuilder) -> Result<T, BoxError> {
        let res = request.bearer_auth(&self.key).header("Stripe-Version", VERSION).send().await?;
        if !res.status().is_success() {
            let status = res.status();
            let message = res.json::<Failure>().await.ok().and_then(|f| f.error.message).unwrap_or_default();
            return Err(format!("stripe answered {status}: {message}").into());
        }
        Ok(res.json().await?)
    }

    //the pack and the subscription, by their lookup keys. A pack whose price doesn't say how many credits it is isn't
    //for sale
    pub async fn prices(&self) -> Result<Prices, BoxError> {
        let mut kept = self.prices.lock().await;
        if let Some((at, prices)) = kept.as_ref() && at.elapsed() < PRICES_FOR {
            return Ok(prices.clone());
        }
        let found: List<LookedUp> = self.send(self.http.get(format!("{API}/prices"))
            .query(&[("lookup_keys[]", PACK), ("lookup_keys[]", SUBSCRIPTION), ("active", "true")])).await?;
        let mut by_key: HashMap<String, Price> = found.data.into_iter()
            .filter_map(|p| Some((p.lookup_key?, p.price))).collect();
        let pack = by_key.remove(PACK).ok_or_else(|| format!("no active price has the lookup key {PACK}"))?;
        let subscription = by_key.remove(SUBSCRIPTION).ok_or_else(|| format!("no active price has the lookup key {SUBSCRIPTION}"))?;
        if pack.credits().is_none() {
            return Err(format!("the {PACK} price has no credits in its metadata").into());
        }
        let prices = Prices { pack, subscription };
        *kept = Some((Instant::now(), prices.clone()));
        Ok(prices)
    }

    //a checkout for the pack (mode payment) or the subscription (mode subscription), tied to the person by
    //client_reference_id, and to their Stripe customer when they have one
    pub async fn create_checkout(&self, person_id: &str, subscription: bool, customer: Option<&str>) -> Result<CheckoutSession, BoxError> {
        let prices = self.prices().await?;
        let (mode, price) = if subscription { ("subscription", prices.subscription.id) } else { ("payment", prices.pack.id) };
        let success = format!("{}/credits?checkout={{CHECKOUT_SESSION_ID}}", self.app_url);
        let cancel = format!("{}/credits", self.app_url);
        let mut form = vec![
            ("mode", mode.to_string()),
            ("line_items[0][price]", price),
            ("line_items[0][quantity]", "1".to_string()),
            ("client_reference_id", person_id.to_string()),
            ("success_url", success),
            ("cancel_url", cancel),
        ];
        match customer {
            Some(customer) => form.push(("customer", customer.to_string())),
            //a pack bought before they have a customer makes one, so a later subscription and the portal reuse it
            None if !subscription => form.push(("customer_creation", "always".to_string())),
            None => {}
        }
        self.send(self.http.post(format!("{API}/checkout/sessions")).form(&form)).await
    }

    //a checkout, with what was bought in it and the subscription it started
    pub async fn checkout(&self, id: &str) -> Result<CheckoutSession, BoxError> {
        self.send(self.http.get(format!("{API}/checkout/sessions/{id}"))
            .query(&[("expand[]", "subscription"), ("expand[]", "line_items")])).await
    }

    pub async fn subscription(&self, id: &str) -> Result<Subscription, BoxError> {
        self.send(self.http.get(format!("{API}/subscriptions/{id}"))).await
    }

    //Stripe's page for managing or canceling a subscription
    pub async fn portal(&self, customer: &str) -> Result<String, BoxError> {
        let form = [("customer", customer.to_string()), ("return_url", format!("{}/credits", self.app_url))];
        let portal: Portal = self.send(self.http.post(format!("{API}/billing_portal/sessions")).form(&form)).await?;
        Ok(portal.url)
    }
}
