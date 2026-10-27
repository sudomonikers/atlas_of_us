# Skills Import

Fills the skills graph with ESCO's skills (`documentation/architecture/skills.md`, "The taxonomy: ESCO") by asking the
atlas api for each one, the way a user asks for a skill we don't have (`POST /api/skills`). The api's gates name and
screen it, its resolver decides whether we already have it, and it creates the stub and publishes `SkillCreated`. The
import only reads the csvs, so a run exercises the api and the events end to end.

## Getting ESCO
The import reads Tabiya's csv export of ESCO v1.1.2 (English), from
[tabiya-tech/taxonomy-model-application](https://github.com/tabiya-tech/taxonomy-model-application/tree/main/data-sets/csv/esco-v1.1.2):
`skills.csv` and `skill_hierarchy.csv`. Download them into `data/`, which git ignores:

```sh
mkdir -p data && for f in skills.csv skill_hierarchy.csv LICENSE; do
  curl -sfo data/$f https://raw.githubusercontent.com/tabiya-tech/taxonomy-model-application/main/data-sets/csv/esco-v1.1.2/$f
done
```

Tabiya's export is CC BY 4.0, and ESCO is reused under the European Commission's reuse policy. Both ask for credit
wherever the data is shown.

## Running it
```sh
# check the counts without asking for anything
cargo run --release -- data --dry-run

# ask for the first 50, to try it
cargo run --release -- data --limit 50

# ask for the rest
cargo run --release -- data
```

| Variable | |
|---|---|
| `ATLAS_API_URL` | The api. Defaults to `https://atlas-of-us.com` |
| `ATLAS_TOKEN` | A login token for the account it asks as: the `x-atlas-token` the ui sends, valid for 24 hours. When it expires mid-run, the run stops, and a rerun with a new token picks up where it left off |

- Only ESCO's "skill/competence" entries are asked for. Its "knowledge" entries belong to the Topics sub-graph, and
  `../topics_import/` asks for them.
- Broader skills are asked for before narrower ones, so the resolver can find the skills a narrower one is a kind
  of.
- It sends 3 requests a second (`--rate` changes it), under the waf's limit of 1000 per ip every 5 minutes. All 10,831
  skills take about an hour. A rate limited request waits a minute and tries again, and a server error is retried a
  few times.
- Every answer is appended to `data/results.jsonl` (the label and the api's outcome: `created`, `existing`,
  `not_a_skill` or `rejected`). Labels already in it are skipped, so a rerun asks only for what's left, including
  anything that failed. It ends with a count of each outcome.
- Each request is one or two Haiku calls and an embedding in the api, so a full run costs on the order of $20 to $30 of
  Bedrock.
