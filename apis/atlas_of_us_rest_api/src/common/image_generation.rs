use serde::Serialize;
use std::env;

#[derive(Debug, Serialize)]
struct ImageGenerationRequest {
    prompt: String,
    width: u32,
    height: u32,
    num_inference_steps: u32,
}

pub async fn generate_image(text_to_generate_image_from: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let image_generation_endpoint = env::var("IMAGE_GEN_ENDPOINT")
        .map_err(|_| "IMAGE_GEN_ENDPOINT environment variable not set")?;

    let request_body = ImageGenerationRequest {
        prompt: text_to_generate_image_from.to_string(),
        width: 1024,
        height: 1024,
        num_inference_steps: 8,
    };

    let client = reqwest::Client::new();
    let response = client
        .post(&image_generation_endpoint)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_default();
        return Err(format!("Image generation failed with status {}: {}", status, error_body).into());
    }

    // Response is PNG image bytes directly
    let image_bytes = response.bytes().await?;
    Ok(image_bytes.to_vec())
}