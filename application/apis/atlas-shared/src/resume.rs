//what a resume shows a person can do, knows and has achieved: atlas-jobs' resume_import job reads the resume and finds
//these, and the api shows them to the person to change and confirm. See documentation/architecture/resume_import.md
use serde::{Deserialize, Serialize};

//a skill or topic the resume shows, at the level it shows
#[derive(Serialize, Deserialize, Clone)]
pub struct Found {
    pub kind: String, //skill or topic
    pub name: String,
    pub description: String,
    pub rank: i64, //the Dreyfus level, 1 (Novice) to 5 (Expert), or the Bloom level, 1 (Remember) to 6 (Create)
    pub evidence: String, //what in the resume shows it, in a few words
    pub id: Option<String>, //the skill or topic it is, or None for one we don't have yet
}

//something noteworthy the resume shows they did, such as an award, a certification, a publication or a result they
//can point to, with the skills and topics it shows
#[derive(Serialize, Deserialize, Clone)]
pub struct Accomplished {
    pub title: String,
    pub description: String, //what they did and what came of it, in a sentence
    pub year: Option<i64>, //when, if the resume says
    pub shows: Vec<usize>, //the indexes of the skills and topics it shows, in what was found
}

//everything a resume shows, as it's kept on the Person until they confirm it
#[derive(Serialize, Deserialize, Clone)]
pub struct Read {
    pub found: Vec<Found>,
    pub achievements: Vec<Accomplished>,
}
