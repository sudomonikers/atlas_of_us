use neo4rs::Graph;

use crate::events::Bus;

//shared state every layer router can grab from
#[derive(Clone)]
pub struct AppState {
    pub graph: Graph,
    pub s3: aws_sdk_s3::Client,
    pub ses: aws_sdk_sesv2::Client,
    pub jobs: Option<(aws_sdk_lambda::Client, String)>, //atlas-jobs and its function name. None when JOBS_FUNCTION isn't set
    pub bus: Option<Bus>, //the atlas-events bus. None when EVENT_BUS_NAME isn't set
    pub bedrock: aws_sdk_bedrockruntime::Client,
    pub evidence_bucket: Option<String>, //where files people give as evidence go. None when EVIDENCE_BUCKET isn't set
    pub http: reqwest::Client, //for outside apis, such as the ontology search conditions are looked up in
    // add more shared resources here later
}
