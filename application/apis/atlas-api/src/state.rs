use neo4rs::Graph;

//shared state every layer router can grab from
#[derive(Clone)]
pub struct AppState {
    pub graph: Graph,
    pub s3: aws_sdk_s3::Client,
    pub ses: aws_sdk_sesv2::Client,
    pub jobs_queue: Option<(aws_sdk_sqs::Client, String)>, //the queue atlas-jobs works through, and its url. None when JOBS_QUEUE_URL isn't set
    // add more shared resources here later
}
