# Topics Import

Seeds the topics graph from a taxonomy (`documentation/architecture/topics.md`, "Where topics come from") by asking the
atlas api for each topic, the way a user asks for a topic we don't have (`POST /api/topics`). The api's gates name and
screen it, its resolver decides whether we already have it, and it creates the stub and publishes `TopicCreated`. The
import only reads its files, so a run exercises the api and the events end to end.

There are three sources, each with its own data folder:

| Source | Folder | What it asks for |
|---|---|---|
| `esco` | `data/` | ESCO's knowledge entries and the fields of study they're filed under |
| `vital` | `data/vital/` | Wikipedia's Level 4 vital articles that are subjects, each with its `prominence` |
| `list` | `lists/<name>/` | The topic names in `names.txt`, one a line, a list we wrote |

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

## Getting the vital articles
The import reads the wikitext of the Level 4 subject pages, `Wikipedia:Vital articles/Level 4/<subject>`, each saved as
`data/vital/<subject>.wiki`. People isn't read, since every article on it is a person:

```sh
mkdir -p data/vital && for s in Philosophy_and_religion Mathematics Physical_sciences Biology_and_health_sciences \
  Society_and_social_sciences History Technology Arts Everyday_life Geography; do
  curl -sfL -A "AtlasOfUsTopicsImport/0.1 (https://atlas-of-us.com)" -o data/vital/$s.wiki \
    "https://en.wikipedia.org/w/index.php?title=Wikipedia:Vital_articles/Level_4/$s&action=raw"
done
```

The lists are Wikipedia's, CC BY-SA 4.0, and ask for credit wherever they're shown. The import takes only the article
titles and their levels.

Every article on a Level 4 page is listed with its level: Levels 1 to 3 are marked, and the rest are Level 4. That level
is the topic's `prominence`, and when two articles resolve to one topic it keeps the most prominent. The articles are
asked for most prominent first, in the pages' order within a level, which puts broader subjects first.

An article is a subject unless it's one of these, which belong to other graphs:

| Left out | How it's found |
|---|---|
| Places | Every Geography section apart from its sections of subjects: Basics: General, Cartography, Earth, Urban studies and planning, and Land relief: General |
| Specific works | An italic title, the way Wikipedia writes the titles of works. Biology also puts genera and species in italics, so it isn't checked there |
| Specific things | Sections whose heading starts with Specific, Historical cities, Companies, International organizations, Educational institutions or Libraries, and Cultural venues apart from its general section |

A dry run prints how many were left out for each, and how many subjects there are at each prominence. A few specific
things in sections of subjects still come through, such as famous bridges and sports leagues.

## Lists
A list is ours: `lists/<name>/names.txt`, one topic name a line, with blank lines and lines starting with `#` left out.
Each collection's topics start as a list (see `documentation/architecture/collections.md`). A run's
`results.jsonl` says which topic each name became, by its id, and the collection's seed is written from it.

```sh
cargo run --release -- list lists/life_knowledge
```

## Running it
The topics migration (`application/database/migrations/003_topics_indexes.cypher`) has to be run first.

```sh
# check the counts without asking for anything
cargo run --release -- vital data/vital --dry-run

# ask for the first 50, to try it
cargo run --release -- vital data/vital --limit 50

# ask for the rest
cargo run --release -- vital data/vital
```

ESCO runs the same way, with `esco data`.

| Variable | |
|---|---|
| `ATLAS_API_URL` | The api. Defaults to `https://atlas-of-us.com` |
| `ATLAS_TOKEN` | A login token for the account it asks as: the `x-atlas-token` the ui sends, valid for 24 hours. When it expires mid-run, the run stops, and a rerun with a new token picks up where it left off. The vital import sets each topic's prominence, which takes an admin's token |

- From ESCO, it asks for two kinds of entry:
  - **Fields of study:** the 128 groups ESCO files its knowledge under, from ISCED-F, such as "philosophy and ethics"
    and "physics".
  - **Knowledge entries:** the 3,059 "knowledge" entries, such as "French history" and "types of barley". ESCO's
    "skill/competence" entries belong to the skills import.
  Labels that appear as both are asked for once, which leaves 3,169.
- ESCO's broader topics are asked for before narrower ones, starting with the broad fields, so the resolver can find
  the topics a narrower one is a subtopic of.
- It sends 3 requests a second (`--rate` changes it), under the waf's limit of 1000 per ip every 5 minutes. ESCO's 3,169
  take about 20 minutes, and the 6,397 vital subjects about 40. A rate limited request waits a minute and tries again, and a server error is retried a few
  times.
- Every answer is appended to `results.jsonl` in the source's folder (the label and the api's outcome: `created`, `existing`,
  `not_a_topic` or `rejected`). Labels already in it are skipped, so a rerun asks only for what's left, including
  anything that failed. It ends with a count of each outcome.
- Each request is one or two Haiku calls and an embedding in the api, so ESCO costs on the order of $6 to $9 of Bedrock,
  and the vital subjects $12 to $18.
