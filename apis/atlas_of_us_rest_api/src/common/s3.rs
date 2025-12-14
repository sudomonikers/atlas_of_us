use aws_config::BehaviorVersion;
use aws_sdk_s3::Client;
use aws_smithy_types::byte_stream::ByteStream;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct S3ObjectParams {
    pub bucket: String,
    pub key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadParams {
    pub bucket: String,
    pub key: String,
}

pub async fn get_s3_object(
    params: S3ObjectParams,
) -> Result<(Vec<u8>, String), Box<dyn std::error::Error>> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = Client::new(&config);

    let response = client
        .get_object()
        .bucket(&params.bucket)
        .key(&params.key)
        .send()
        .await
        .map_err(|e| {
            format!(
                "Unable to get object {} from bucket {}: {}",
                params.key, params.bucket, e
            )
        })?;

    let data = response
        .body
        .collect()
        .await
        .map_err(|e| {
            format!(
                "Unable to read object {} from bucket {}: {}",
                params.key, params.bucket, e
            )
        })?
        .into_bytes();

    let content_type = infer::get(&data)
        .map(|kind| kind.mime_type())
        .unwrap_or("application/octet-stream")
        .to_string();

    Ok((data.to_vec(), content_type))
}

pub async fn upload_object_to_s3(
    params: UploadParams,
    file_data: Vec<u8>,
) -> Result<(), Box<dyn std::error::Error>> {
    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    let client = Client::new(&config);

    // Detect content type from the data
    let content_type = infer::get(&file_data)
        .map(|kind| kind.mime_type())
        .unwrap_or("application/octet-stream");

    tracing::info!("File type: {}", content_type);

    let byte_stream = ByteStream::from(file_data.clone());

    client
        .put_object()
        .bucket(&params.bucket)
        .key(&params.key)
        .body(byte_stream)
        .content_type(content_type)
        .content_length(file_data.len() as i64)
        .send()
        .await
        .map_err(|e| {
            format!(
                "Unable to upload object {} to bucket {}: {}",
                params.key, params.bucket, e
            )
        })?;

    Ok(())
}
