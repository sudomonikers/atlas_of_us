//a candidate a resolver's judge picked. The judge is asked for the candidate's number, and now and then gives its name
//instead ("Noble Gases"), so a name is matched against the candidates' names
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(untagged)]
pub enum Pick {
    Number(i64),
    Text(String),
}

impl Pick {
    //the position of the picked candidate among `names`, None when it picked none (-1), and an error when it matches none
    pub fn index(&self, names: &[&str]) -> Result<Option<usize>, String> {
        let number = match self {
            Pick::Number(number) => *number,
            Pick::Text(text) => match text.trim().parse::<i64>() {
                Ok(number) => number,
                Err(_) => {
                    let text = text.trim();
                    return names.iter().position(|name| name.eq_ignore_ascii_case(text)).map(Some)
                        .ok_or_else(|| format!("the judge picked \"{text}\", which isn't a candidate"));
                }
            },
        };
        if number < 0 {
            return Ok(None);
        }
        usize::try_from(number).ok().filter(|&i| i < names.len()).map(Some)
            .ok_or_else(|| format!("the judge picked candidate {number}, which isn't one"))
    }
}
