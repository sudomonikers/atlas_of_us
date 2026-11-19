//the skills sub-graph. See documentation/architecture/skills.md
pub mod gates;
pub mod resolver;

//the five Dreyfus levels every skill has, by rank
pub const DREYFUS_LEVELS: [&str; 5] = ["Novice", "Advanced Beginner", "Competent", "Proficient", "Expert"];
