use neo4rs::Graph;

//shared state every layer router can grab from
#[derive(Clone)]
pub struct AppState {
    pub graph: Graph,
    // add more shared resources here later
}
