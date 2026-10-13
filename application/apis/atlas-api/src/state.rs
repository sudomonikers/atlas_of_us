use neo4rs::Graph;

//shared state every layer router can grab from
#[derive(Clone)]
pub struct AppState {
    pub graph: Graph,
    pub s3: aws_sdk_s3::Client,
    pub ses: aws_sdk_sesv2::Client,
    // add more shared resources here later
}
