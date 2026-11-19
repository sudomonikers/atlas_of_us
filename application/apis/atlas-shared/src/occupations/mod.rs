//the occupations sub-graph. See documentation/architecture/occupations.md
pub mod resolver;

//the four parts of what an occupation takes, each worked out by its own module's job when someone adds an occupation.
//`<part>At` is set on the occupation when its part is done, and `<part>FailedAt` when it couldn't be
pub const PARTS: [&str; 4] = ["abilities", "knowledge", "skills", "personality"];
