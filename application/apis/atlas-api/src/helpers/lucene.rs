//queries for neo4j's full-text indexes, which take lucene syntax. Every index is made with the english analyzer, see
//database/migrations/012_search_indexes.cypher

//the words the english analyzer leaves out of what it indexes, which no search could match
const STOP_WORDS: [&str; 33] = [
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on",
    "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with",
];

//turns what was typed into a full-text query that needs every word to match, so "wine tasting" leaves out "Software
//Testing". A word matches as it's typed, which the analyzer stems as it stems what's indexed, so "allergies" finds
//allergy, as a prefix, or with a typo once it's long enough to tell, and two in a long word, as stemming can take a letter or two
//off what's indexed ("diabetis" finds diabetes, indexed as diabet). The words the analyzer leaves out of the index are
//left out, so "theory of mind" still finds Theory of Mind. Everything but letters and digits is dropped, so nothing
//typed can be read as lucene syntax. None when nothing searchable is left
pub fn query(typed: &str) -> Option<String> {
    let terms: Vec<String> = typed.split_whitespace()
        .map(|word| word.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase())
        .filter(|word| !word.is_empty() && !STOP_WORDS.contains(&word.as_str()))
        .map(|word| match word.chars().count() {
            0..=3 => format!("({word} OR {word}*)"),
            4..=7 => format!("({word} OR {word}* OR {word}~1)"),
            _ => format!("({word} OR {word}* OR {word}~2)"),
        })
        .collect();
    (!terms.is_empty()).then(|| terms.join(" AND "))
}
