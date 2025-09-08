use axum::{
    body::Body,
    extract::{Multipart, Query},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};

use super::{
    embedding::generate_embedding,
    s3::{S3ObjectParams, UploadParams, get_s3_object, upload_object_to_s3},
};

#[derive(Debug, Deserialize)]
pub struct CreateEmbeddingFromTextParams {
    pub text: String,
}

#[derive(Debug, Serialize)]
pub struct EmbeddingResponse {
    pub embedding: Vec<f64>,
}

pub async fn return_s3_object(
    Query(params): Query<S3ObjectParams>,
) -> Result<axum::response::Response<Body>, StatusCode> {
    match get_s3_object(params).await {
        Ok((data, content_type)) => {
            let response = axum::response::Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", content_type)
                .header("Cache-Control", "public, max-age=3600")
                .body(Body::from(data))
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(response)
        }
        Err(e) => {
            tracing::error!("Error getting S3 object: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn upload_s3_object(
    Query(params): Query<UploadParams>,
    mut multipart: Multipart,
) -> Result<String, StatusCode> {
    let mut file_data = Vec::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        if field.name() == Some("file") {
            let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
            file_data = data.to_vec();
            break;
        }
    }

    if file_data.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    match upload_object_to_s3(params, file_data).await {
        Ok(_) => Ok("File uploaded successfully".to_string()),
        Err(e) => {
            tracing::error!("Error uploading to S3: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_embedding_from_text(
    Json(params): Json<CreateEmbeddingFromTextParams>,
) -> Result<Json<EmbeddingResponse>, StatusCode> {
    match generate_embedding(&params.text).await {
        Ok(embedding) => Ok(Json(EmbeddingResponse { embedding })),
        Err(e) => {
            tracing::error!("Error generating embedding: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
