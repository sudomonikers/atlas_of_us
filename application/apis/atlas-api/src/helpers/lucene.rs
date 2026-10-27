//queries for neo4j's full-text indexes, which take lucene syntax

//turns what was typed into a full-text query that matches each word as a prefix, or with a typo once it's long enough
//to tell, and needs every word to match, so "wine tasting" leaves out "Software Testing". Everything but letters and digits is dropped, so nothing typed can be read as lucene syntax. None when
//nothing searchable is left
pub fn query(typed: &str) -> Option<String> {
    let terms: Vec<String> = typed.split_whitespace()
        .map(|word| word.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase())
        .filter(|word| !word.is_empty())
        .map(|word| if word.chars().count() >= 4 { format!("({word}* OR {word}~1)") } else { format!("{word}*") })
        .collect();
    (!terms.is_empty()).then(|| terms.join(" AND "))
}
