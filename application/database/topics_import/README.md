# Topics Import

Seeds the topics graph with ESCO's knowledge (`documentation/architecture/topics.md`, "The taxonomy: ESCO") by asking
the atlas api for each topic, the way a user asks for a topic we don't have (`POST /api/topics`). The api's gates name
and screen it, its resolver decides whether we already have it, and it creates the stub and publishes `TopicCreated`.
The import only reads the csvs, so a run exercises the api and the events end to end.

Every topic it creates is a stub, with its six Bloom levels empty and no Ideas. A topic is filled when someone needs it.

## Getting ESCO
The import reads Tabiya's csv export of ESCO v1.1.2 (English), from
[tabiya-tech/taxonomy-model-application](https://github.com/tabiya-tech/taxonomy-model-application/tree/main/data-sets/csv/esco-v1.1.2):
`skills.csv`, `skill_groups.csv` and `skill_hierarchy.csv`. Download them into `data/`, which git ignores:

```sh
mkdir -p data && for f in skills.csv skill_groups.csv skill_hierarchy.csv LICENSE; do
  curl -sfo data/$f https://raw.githubusercontent.com/tabiya-tech/taxonomy-model-application/main/data-sets/csv/esco-v1.1.2/$f
done
```

Tabiya's export is CC BY 4.0, and ESCO is reused under the European Commission's reuse policy. Both ask for credit
wherever the data is shown.

## Running it
The topics migration (`application/database/migrations/003_topics_indexes.cypher`) has to be run first.

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

- It asks for two kinds of ESCO entry:
  - **Fields of study:** the 128 groups ESCO files its knowledge under, from ISCED-F, such as "philosophy and ethics"
    and "physics".
  - **Knowledge entries:** the 3,059 "knowledge" entries, such as "French history" and "types of barley". ESCO's
    "skill/competence" entries belong to the skills import.
  Labels that appear as both are asked for once, which leaves 3,169.
- Broader topics are asked for before narrower ones, starting with the broad fields, so the resolver can find the
  topics a narrower one is a subtopic of.
- It sends 3 requests a second (`--rate` changes it), under the waf's limit of 1000 per ip every 5 minutes. All of them
  take about 20 minutes. A rate limited request waits a minute and tries again, and a server error is retried a few
  times.
- Every answer is appended to `data/results.jsonl` (the label and the api's outcome: `created`, `existing`,
  `not_a_topic` or `rejected`). Labels already in it are skipped, so a rerun asks only for what's left, including
  anything that failed. It ends with a count of each outcome.
- Each request is one or two Haiku calls and an embedding in the api, so a full run costs on the order of $6 to $9 of
  Bedrock.
