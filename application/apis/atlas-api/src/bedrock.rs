use aws_sdk_bedrockruntime::{error::DisplayErrorContext, primitives::Blob};
use serde_json::{Value, json};

type BoxError = Box<dyn std::error::Error + Send + Sync>;


pub const SMALL_MODEL: &str = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const EMBEDDING_MODEL: &str = "amazon.titan-embed-text-v2:0";
pub const EMBEDDING_DIMENSIONS: usize = 1024;

async fn invoke(client: &aws_sdk_bedrockruntime::Client, model: &str, body: Value) -> Result<Value, BoxError> {
    let output = client.invoke_model()
        .model_id(model)
        .content_type("application/json")
        .body(Blob::new(serde_json::to_vec(&body)?))
        .send().await
        .map_err(|e| DisplayErrorContext(e).to_string())?;
    Ok(serde_json::from_slice(output.body().as_ref())?)
}

//has the model answer by calling `tool`, whose input_schema is the shape of the answer, and returns that answer for the
//caller to deserialize, which checks its shape. The tool isn't strict: strict mode garbles short strings on Haiku 4.5
pub async fn answer(client: &aws_sdk_bedrockruntime::Client, model: &str, system: &str, tool: Value, content: String) -> Result<Value, BoxError> {
    let name = tool["name"].clone();
    let response = invoke(client, model, json!({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "system": system,
        "tools": [tool],
        "tool_choice": {"type": "tool", "name": name},
        "messages": [{"role": "user", "content": content}],
    })).await?;
    let usage = &response["usage"];
    tracing::info!(
        model, input_tokens = usage["input_tokens"].as_u64(), output_tokens = usage["output_tokens"].as_u64(),
        stop_reason = response["stop_reason"].as_str(), "bedrock responded"
    );
    if response["stop_reason"] == "max_tokens" {
        return Err("bedrock ran out of tokens".into());
    }
    Ok(response["content"].as_array()
        .and_then(|content| content.iter().find(|block| block["type"] == "tool_use"))
        .ok_or("bedrock didn't call its tool")?["input"].clone())
}

//a unit length embedding of `text`, for the vector indexes
pub async fn embed(client: &aws_sdk_bedrockruntime::Client, text: &str) -> Result<Vec<f64>, BoxError> {
    let response = invoke(client, EMBEDDING_MODEL, json!({"inputText": text, "dimensions": EMBEDDING_DIMENSIONS, "normalize": true})).await?;
    let vector: Vec<f64> = serde_json::from_value(response["embedding"].clone())?;
    if vector.len() != EMBEDDING_DIMENSIONS {
        return Err(format!("expected a {EMBEDDING_DIMENSIONS} dimension embedding, got {}", vector.len()).into());
    }
    Ok(vector)
}
