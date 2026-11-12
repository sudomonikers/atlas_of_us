# O*NET Import

Writes `../onet_occupations_seed.cypher`: every occupation O*NET rates, the level and importance of each of the Atlas's
abilities it takes (`documentation/data_model/physical_attributes/`), and an embedding of each, which skills find the
occupations like them by, to ground what their levels take (`application/MY_ABILITY_REQUIREMENTS_FLESH_OUT.md`). The seed is generated, so run this
again on a newer O*NET release rather than editing it.

## Getting O*NET
The import reads three files from O*NET 30.0's text download. Download them into `data/`, which git ignores:

```sh
mkdir -p data && for f in "Occupation Data.txt" "Alternate Titles.txt" "Abilities.txt"; do
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

Then run `migrations/006_occupations.cypher`, for the constraints and the vector index, then
`physical_abilities_seed.cypher`, for each ability's `anchorLevels`, then the occupations seed.

- **Levels:** O*NET rates each ability's level on 0 to 7, and the seed keeps it over 7. A level O*NET marks not relevant
  is 0.
- **Importance:** O*NET rates it 1 to 5, and the seed keeps it from 0 to 1.
- **Left out:** ratings O*NET recommends suppressing, occupations it doesn't rate on abilities, and its six verbal and
  quantitative abilities, which are skills in the Atlas.
- **Alternate titles:** up to 12 per occupation, in O*NET's order, for finding it by meaning.
- **Embeddings:** from the same text and model as a skill's (`atlas-shared`), with its title, description and alternate
  titles, rounded to 5 places.
