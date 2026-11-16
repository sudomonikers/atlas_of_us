//credits, which pay for the premium features: Atlas's written summaries, such as the physical summary and the personality
//report. Everyone starts with some free, and buys more as a pack, or subscribes for unlimited use while the subscription
//is paid. Buying goes through Stripe Checkout, and a checkout is settled when the person comes back from it, or the next
//time their credits are read if they never did. See documentation/architecture/credits.md
use axum::{Json, Router, extract::State, http::StatusCode, routing::{get, post}};
use neo4rs::{Graph, query};
use serde::{Deserialize, Serialize};

use crate::{auth::AuthUser, state::AppState};

pub mod stripe;
use stripe::Stripe;

//how many credits a new account starts with
pub const FREE_CREDITS: i64 = 3;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_balance))
        .route("/checkout", post(checkout))
        .route("/confirm", post(confirm))
        .route("/portal", post(portal))
}

fn internal(e: impl std::fmt::Display) -> (StatusCode, String) {
    tracing::error!("{e}");
    (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again.".to_string())
}

fn stripe(state: &AppState) -> Result<&Stripe, (StatusCode, String)> {
    state.stripe.as_ref().ok_or_else(|| (StatusCode::SERVICE_UNAVAILABLE, "Buying credits isn't set up here.".to_string()))
}

//a price as it's shown, such as 3.00 usd
#[derive(Serialize)]
struct Price {
    amount: i64, //in the currency's smallest unit, such as cents
    currency: String,
}

//what's for sale
#[derive(Serialize)]
struct ForSale {
    pack_credits: i64,
    pack: Price,
    subscription: Price, //a month
}

#[derive(Serialize)]
pub struct Balance {
    credits: i64,
    subscribed_until: Option<String>, //when their subscription's paid period ends, while it hasn't
    has_customer: bool, //whether they've bought anything, so the portal has something to show
    for_sale: Option<ForSale>, //None when buying isn't set up
}

async fn balance(state: &AppState, person_id: &str) -> Result<Balance, (StatusCode, String)> {
    settle_pending(state, person_id).await;
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN coalesce(p.credits, 0) AS credits,
               CASE WHEN p.subscribedUntil > datetime() THEN toString(p.subscribedUntil) END AS subscribed_until,
               p.stripeCustomerId IS NOT NULL AS has_customer
    ").param("personId", person_id)).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?;
    let for_sale = match &state.stripe {
        Some(stripe) => match stripe.prices().await {
            Ok(prices) => Some(ForSale {
                pack_credits: prices.pack.credits().unwrap_or_default(), //prices() only gives back a pack that has them
                pack: Price { amount: prices.pack.unit_amount, currency: prices.pack.currency },
                subscription: Price { amount: prices.subscription.unit_amount, currency: prices.subscription.currency },
            }),
            Err(e) => {
                tracing::error!("couldn't read the prices from stripe: {e}");
                None
            }
        },
        None => None,
    };
    Ok(Balance {
        credits: row.get("credits").map_err(internal)?,
        subscribed_until: row.get("subscribed_until").map_err(internal)?,
        has_customer: row.get("has_customer").map_err(internal)?,
        for_sale,
    })
}

//the logged in user's credits, and what they can buy
async fn get_balance(State(state): State<AppState>, user: AuthUser) -> Result<Json<Balance>, (StatusCode, String)> {
    Ok(Json(balance(&state, &user.person_id).await?))
}

#[derive(Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
enum Kind {
    Pack,
    Subscription,
}

#[derive(Deserialize)]
struct CheckoutRequest {
    kind: Kind,
}

#[derive(Serialize)]
struct Redirect {
    url: String,
}

//starts a Stripe checkout for a pack or the subscription, and gives back the page to send them to
async fn checkout(State(state): State<AppState>, user: AuthUser, Json(body): Json<CheckoutRequest>) -> Result<Json<Redirect>, (StatusCode, String)> {
    let stripe = stripe(&state)?;
    let mut rows = state.graph.execute(query("
        MATCH (p:Person {id: $personId})
        RETURN p.stripeCustomerId AS customer, coalesce(p.subscribedUntil > datetime(), false) AS subscribed
    ").param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let row = rows.next().await.map_err(internal)?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "That person doesn't exist.".to_string()))?;
    let customer: Option<String> = row.get("customer").map_err(internal)?;
    let subscribed: bool = row.get("subscribed").map_err(internal)?;
    if body.kind == Kind::Subscription && subscribed {
        return Err((StatusCode::BAD_REQUEST, "You're already subscribed.".to_string()));
    }

    let session = stripe.create_checkout(&user.person_id, body.kind == Kind::Subscription, customer.as_deref()).await.map_err(internal)?;
    let url = session.url.ok_or_else(|| internal("stripe made a checkout with no url"))?;
    state.graph.run(query("
        MATCH (p:Person {id: $personId})
        CREATE (p)-[:CHECKED_OUT]->(:Checkout {id: $id, kind: $kind, createdAt: datetime()})
    ")
        .param("personId", user.person_id.as_str())
        .param("id", session.id)
        .param("kind", if body.kind == Kind::Subscription { "subscription" } else { "pack" })
    ).await.map_err(internal)?;
    Ok(Json(Redirect { url }))
}

#[derive(Deserialize)]
struct ConfirmRequest {
    checkout: String, //the Stripe Checkout Session's id, which Stripe sends them back with
}

//settles the checkout they've come back from, and gives back their credits
async fn confirm(State(state): State<AppState>, user: AuthUser, Json(body): Json<ConfirmRequest>) -> Result<Json<Balance>, (StatusCode, String)> {
    settle(&state, stripe(&state)?, &user.person_id, &body.checkout).await.map_err(internal)?;
    Ok(Json(balance(&state, &user.person_id).await?))
}

//Stripe's page for managing or canceling their subscription
async fn portal(State(state): State<AppState>, user: AuthUser) -> Result<Json<Redirect>, (StatusCode, String)> {
    let stripe = stripe(&state)?;
    let mut rows = state.graph.execute(query("MATCH (p:Person {id: $personId}) RETURN p.stripeCustomerId AS customer")
        .param("personId", user.person_id.as_str())).await.map_err(internal)?;
    let customer: Option<String> = rows.next().await.map_err(internal)?.map(|r| r.get("customer")).transpose().map_err(internal)?.flatten();
    let customer = customer.ok_or_else(|| (StatusCode::BAD_REQUEST, "You haven't bought anything yet.".to_string()))?;
    Ok(Json(Redirect { url: stripe.portal(&customer).await.map_err(internal)? }))
}

//adds what a finished checkout bought, once. The checkout must be the person's, both on the graph and at Stripe. One
//that ran out without being paid is dropped, and one still open is left for later
async fn settle(state: &AppState, stripe: &Stripe, person_id: &str, checkout_id: &str) -> Result<(), crate::helpers::jobs::BoxError> {
    let session = stripe.checkout(checkout_id).await?;
    if session.client_reference_id.as_deref() != Some(person_id) {
        return Err(format!("checkout {checkout_id} isn't for person {person_id}").into());
    }
    //the lock is taken before settledAt is read, so two settles of the same checkout can't both add it
    const FIND: &str = "
        MATCH (p:Person {id: $personId})-[:CHECKED_OUT]->(c:Checkout {id: $id})
        SET c.lock = true REMOVE c.lock
        WITH p, c WHERE c.settledAt IS NULL
    ";
    let q = match (session.status.as_deref(), &session.subscription) {
        (Some("complete"), Some(subscription)) => query(&format!("{FIND}
            SET c.settledAt = datetime(), p.stripeCustomerId = $customer, p.stripeSubscriptionId = $subscription,
                p.subscribedUntil = datetime({{epochSeconds: $end}})
        "))
            .param("subscription", subscription.id.as_str())
            .param("end", subscription.period_end().ok_or("the subscription has no period")?),
        (Some("complete"), None) => query(&format!("{FIND}
            SET c.settledAt = datetime(), p.credits = coalesce(p.credits, 0) + $credits,
                p.stripeCustomerId = coalesce($customer, p.stripeCustomerId)
        ")).param("credits", session.credits()),
        (Some("expired"), _) => query(&format!("{FIND} DETACH DELETE c")),
        _ => return Ok(()),
    };
    state.graph.run(q.param("personId", person_id).param("id", checkout_id).param("customer", session.customer)).await?;
    Ok(())
}

//settles any checkout they never came back from, and checks a subscription whose paid period has ended with Stripe,
//which extends it when it's been paid again and ends it when it's been canceled. Stripe being down never stops anyone
//spending what they already have, so this only logs
async fn settle_pending(state: &AppState, person_id: &str) {
    let Some(stripe) = &state.stripe else { return };
    let pending = async {
        let mut rows = state.graph.execute(query("
            MATCH (p:Person {id: $personId})
            OPTIONAL MATCH (p)-[:CHECKED_OUT]->(c:Checkout) WHERE c.settledAt IS NULL
            RETURN collect(c.id) AS open, CASE WHEN p.subscribedUntil <= datetime() THEN p.stripeSubscriptionId END AS lapsed
        ").param("personId", person_id)).await?;
        let Some(row) = rows.next().await? else { return Ok(()) };
        let open: Vec<String> = row.get("open")?;
        let lapsed: Option<String> = row.get("lapsed")?;
        for id in open {
            if let Err(e) = settle(state, stripe, person_id, &id).await {
                tracing::error!("couldn't settle checkout {id}: {e}");
            }
        }
        if let Some(id) = lapsed {
            let subscription = stripe.subscription(&id).await?;
            match subscription.period_end() {
                Some(end) if subscription.live() => {
                    state.graph.run(query("MATCH (p:Person {id: $personId}) SET p.subscribedUntil = datetime({epochSeconds: $end})")
                        .param("personId", person_id).param("end", end)).await?;
                }
                _ if matches!(subscription.status.as_str(), "canceled" | "incomplete_expired") => {
                    state.graph.run(query("MATCH (p:Person {id: $personId}) REMOVE p.stripeSubscriptionId, p.subscribedUntil")
                        .param("personId", person_id)).await?;
                }
                _ => {} //unpaid for now, which Stripe may still collect
            }
        }
        Ok::<_, crate::helpers::jobs::BoxError>(())
    };
    if let Err(e) = pending.await {
        tracing::error!("couldn't settle with stripe: {e}");
    }
}

//spends a credit on a premium feature, unless they're subscribed, and marks it asked for. `feature` is the prefix of
//the feature's properties on the Person, such as physicalSummary: this sets <feature>AskedAt, and <feature>Charged
//when a credit was spent, so refund can give it back. Out of credits is a 402
pub async fn spend(state: &AppState, person_id: &str, feature: &str) -> Result<(), (StatusCode, String)> {
    settle_pending(state, person_id).await;
    //the lock is taken before credits are read, so two asks at once can't spend the same credit
    let mut rows = state.graph.execute(query(&format!("
        MATCH (p:Person {{id: $personId}})
        SET p.lock = true REMOVE p.lock
        WITH p, coalesce(p.subscribedUntil > datetime(), false) AS subscribed
        WHERE subscribed OR coalesce(p.credits, 0) >= 1
        SET p.credits = coalesce(p.credits, 0) - CASE WHEN subscribed THEN 0 ELSE 1 END,
            p.{feature}AskedAt = datetime(), p.{feature}Charged = NOT subscribed
        RETURN p.id AS id
    ")).param("personId", person_id)).await.map_err(internal)?;
    match rows.next().await.map_err(internal)? {
        Some(_) => Ok(()),
        None => Err((StatusCode::PAYMENT_REQUIRED, "You're out of credits. Get more and I'll write it up.".to_string())),
    }
}

//gives back the credit spent on a feature's last ask, when it couldn't be done. Only once, however often it's called
pub async fn refund(graph: &Graph, person_id: &str, feature: &str) -> Result<(), neo4rs::Error> {
    graph.run(query(&format!("
        MATCH (p:Person {{id: $personId}})
        SET p.lock = true REMOVE p.lock
        WITH p WHERE p.{feature}Charged
        SET p.credits = p.credits + 1, p.{feature}Charged = false
    ")).param("personId", person_id)).await
}
