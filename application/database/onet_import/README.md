# O*NET Import

Writes `../onet_occupations_seed.cypher`, the Occupations graph (`documentation/data_model/occupations/`): every
occupation O*NET rates, with what it takes across the Atlas, and an embedding of each, which skills find the
occupations like them by, to ground what their levels take.

- **Abilities:** the level and importance of each of the Atlas's abilities.
- **Knowledge:** the Bloom level of each topic it takes.
- **Skills:** the Dreyfus level of each skill it takes.
- **Work styles:** the importance of the personality trait each work style is.
- **Physical demands:** how often the work has people in each, and the body functions and parts each strains.

The seed is generated, so run this again on a newer O*NET release rather than editing it.

## Getting O*NET
The import reads seven files from O*NET 30.0's text download. Download them into `data/`, which git ignores:

```sh
mkdir -p data && for f in "Occupation Data.txt" "Alternate Titles.txt" "Abilities.txt" "Knowledge.txt" "Skills.txt" "Work Styles.txt" "Work Context.txt"; do
  curl -sfLo "data/$f" "https://www.onetcenter.org/dl_files/database/db_30_0_text/${f// /%20}"
done
```

O*NET is by the U.S. Department of Labor, Employment and Training Administration, under CC BY 4.0, and asks for credit
wherever the data is shown.

## Running it
It embeds each occupation on Bedrock, so it needs AWS credentials that can call it, in `us-east-1` unless `AWS_REGION`
says otherwise. A run takes about half a minute.

```sh
cargo run --release -- data ../onet_occupations_seed.cypher
```

Then run `migrations/006_occupations.cypher` and `018_work_demands.cypher`, for the constraints and the vector index,
then `abilities_seed.cypher`, for each ability's `anchorLevels`, `abilities_functions_seed.cypher` and
`abilities_anatomy_seed.cypher`, for the body functions and parts the demands strain, and `personality_seed.cypher`, for
the traits, then the occupations seed.

- **Levels:** O*NET rates each ability's level on 0 to 7, and the seed keeps it over 7. A level O*NET marks not relevant
  is 0.
- **Importance:** O*NET rates it 1 to 5, and the seed keeps it from 0 to 1.
- **Left out:** ratings O*NET recommends suppressing, occupations it doesn't rate on abilities, and its six verbal and
  quantitative abilities, which are skills in the Atlas.
- **Alternate titles:** up to 12 per occupation, in O*NET's order, for finding it by meaning.
- **Embeddings:** from the same text and model as a skill's (`atlas-shared`), with its title, description and alternate
  titles, rounded to 5 places.
- **Knowledge and skills:** a knowledge area or skill rated at least "important", 3 of O*NET's 5, is one the occupation
  takes. Its level, over 7, as a share of the 6 Bloom levels or 5 Dreyfus levels, to the nearest, is the level it takes.
  When two of O*NET's elements are one topic or skill, the more important one counts.
- **Work styles:** every one an occupation is rated on, with its importance.

## Links
`links.tsv` names what each of O*NET's 33 knowledge areas, 35 skills and 16 work styles is in the Atlas, one row for
each:

| Column | |
|---|---|
| `kind` | `topic`, `skill` or `trait` |
| `element` | O*NET's element id |
| `onet name` | O*NET's name for it |
| `atlas name` | The topic, skill or personality trait's name |
| `opposite` | `yes` when the work style is the trait's low end |

A knowledge area can have a row for each of the topics it is ("Law and Government" is Law and Government). The seed
links by name, so every topic and skill named here has to be in the graph first, or its links are left out. To name one
that isn't, ask for it in the app or through the api, and use the name it comes back with.

## Physical demands
`demands.tsv` names the 19 elements of O*NET's Work Context that are physical demands, each with its name in the Atlas
and its `group`: `position`, `environment` or `hazard`. Work Context rates how often on 1 (never) to 5 (continually, or
every day), and the seed keeps it from 0 to 1, for every occupation rated on it.

`strains.tsv` names the body functions (by ICF code) and parts (by FMA id) each demand strains, one row each. The anatomy
keeps a left and right limb apart from the general one, so a demand on the knees names the knee joint and both knees.

