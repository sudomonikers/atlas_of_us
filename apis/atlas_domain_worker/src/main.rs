use aws_lambda_events::event::sqs::SqsEvent;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use tracing_subscriber::EnvFilter;

use atlas_domain_worker::{handle_sqs_event, Config};

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    tracing::info!("Starting domain worker Lambda");

    // Load configuration
    let config = Config::from_env().map_err(|e| {
        tracing::error!("Failed to load configuration: {}", e);
        Box::new(e) as Box<dyn std::error::Error + Send + Sync>
    })?;

    tracing::info!("Configuration loaded successfully");

    // Run the Lambda handler
    run(service_fn(|event: LambdaEvent<SqsEvent>| {
        let config = config.clone();
        async move { handle_sqs_event(event, &config).await }
    }))
    .await
}
