use neo4rs::Graph;

use crate::events::Bus;

//shared state every layer router can grab from
#[derive(Clone)]
pub struct AppState {
    pub graph: Graph,
    pub s3: aws_sdk_s3::Client,
    pub ses: aws_sdk_sesv2::Client,
    pub jobs_queue: Option<(aws_sdk_sqs::Client, String)>, //the queue atlas-jobs works through, and its url. None when JOBS_QUEUE_URL isn't set
    pub bus: Option<Bus>, //the atlas-events bus. None when EVENT_BUS_NAME isn't set
    pub bedrock: aws_sdk_bedrockruntime::Client,
    // add more shared resources here later
}
