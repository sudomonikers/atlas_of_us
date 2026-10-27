//the topics sub-graph. See documentation/architecture/topics.md
pub mod resolver;

//the six levels of Bloom's taxonomy every topic has, by rank
pub const BLOOM_LEVELS: [&str; 6] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
