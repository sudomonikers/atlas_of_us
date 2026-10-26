//code atlas-api and atlas-jobs both run, so there is one copy of it. See documentation/ADRs/atlas_shared_crate.md
pub mod bedrock;
pub mod events;
pub mod skills;

pub type BoxError = Box<dyn std::error::Error + Send + Sync>;
