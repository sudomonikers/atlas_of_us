use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize)]
struct ImageGenerationRequest {
    model: String,
    prompt: String,
    n: u32,
    size: String,
}

#[derive(Debug, Deserialize)]
struct ImageData {
    url: String,
}

#[derive(Debug, Deserialize)]
struct ImageGenerationResponse {
    data: Vec<ImageData>,
}

pub async fn generate_image(text_to_generate_image_from: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let image_generation_endpoint = env::var("IMAGE_GEN_ENDPOINT")
        .map_err(|_| "IMAGE_GEN_ENDPOINT environment variable not set")?;
    let image_generation_api_key = env::var("IMAGE_GEN_API_KEY")
        .map_err(|_| "IMAGE_GEN_API_KEY environment variable not set")?;

    
    let request_body = ImageGenerationRequest {
        model: "dall-e-3".to_string(),
        prompt: text_to_generate_image_from.to_string(),
        n: 1,
        size: "1024x1024".to_string(),
    };

    let client = reqwest::Client::new();
    let response = client
        .post(&image_generation_endpoint)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", image_generation_api_key))
        .json(&request_body)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Image generation endpoint returned status: {}", response.status()).into());
    }

    let image_response: ImageGenerationResponse = response.json().await?;
    
    if image_response.data.is_empty() {
        return Err("No image data in response".into());
    }

    let image_url = &image_response.data[0].url;
    download_image(image_url).await
}

/// Downloads an image from the given URL and returns the image bytes
async fn download_image(image_url: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get(image_url)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("Image download failed with status code: {}", response.status()).into());
    }

    let image_bytes = response.bytes().await?;
    Ok(image_bytes.to_vec())
}