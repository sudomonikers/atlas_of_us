//calls to claude on bedrock, shared by every job and event handler
use std::time::Duration;

use aws_sdk_bedrockruntime::{error::DisplayErrorContext, primitives::Blob};
use neo4rs::{Graph, query};

pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

//sends a request to bedrock, retrying while it's throttled, and returns the input of the tool call it replies with.
//Access denied means the budget cutoff (infrastructure/budget.tf) is on, which a BedrockCutoff node tells the ui until a
//call gets through again
pub async fn invoke(graph: &Graph, client: &aws_sdk_bedrockruntime::Client, model: &str, body: serde_json::Value) -> Result<serde_json::Value, BoxError> {
    let body = serde_json::to_vec(&body)?;
    let mut delay = Duration::from_secs(1);
    let output = loop {
        let sent = client.invoke_model().model_id(model).content_type("application/json").body(Blob::new(body.clone())).send().await;
        match sent {
            Err(e) if delay <= Duration::from_secs(32) && e.as_service_error().is_some_and(|e| e.is_throttling_exception()) => {
                tracing::warn!("bedrock throttled us, retrying in {delay:?}");
                tokio::time::sleep(delay).await;
                delay *= 2;
            }
            sent => break sent,
        }
    };
    match &output {
        Ok(_) => graph.run(query("MATCH (c:BedrockCutoff) DELETE c")).await?,
        Err(e) if e.as_service_error().is_some_and(|e| e.is_access_denied_exception()) => graph.run(query("MERGE (:BedrockCutoff)")).await?,
        Err(_) => {}
    }
    let output = output.map_err(|e| DisplayErrorContext(e).to_string())?;
    let response: serde_json::Value = serde_json::from_slice(output.body().as_ref())?;
    //what the call cost: cache reads are the prompt, billed at a tenth of the input price
    let usage = &response["usage"];
    tracing::info!(
        input_tokens = usage["input_tokens"].as_u64(), output_tokens = usage["output_tokens"].as_u64(),
        cache_read_tokens = usage["cache_read_input_tokens"].as_u64(), cache_write_tokens = usage["cache_creation_input_tokens"].as_u64(),
        stop_reason = response["stop_reason"].as_str(), "bedrock responded"
    );
    //a tool call cut off by max_tokens comes back with its input missing or partial
    if response["stop_reason"] == "max_tokens" {
        return Err("bedrock ran out of tokens".into());
    }
    Ok(response["content"].as_array()
        .and_then(|content| content.iter().find(|block| block["type"] == "tool_use"))
        .ok_or("bedrock didn't call its tool")?["input"].clone())
}
