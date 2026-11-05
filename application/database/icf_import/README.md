# ICF Import

Writes `../physical_functions_seed.cypher`: the body functions of the WHO's International Classification of Functioning,
Disability and Health (ICF), each with its definition, inclusions and exclusions, how they nest, and how they link to
abilities, measurements and the Big Five (`src/links.rs`). The seed is generated, so change this and run it again rather than editing
it.

## Getting ICF
The functions come from the WHO's simple tabulation of the ICF release. Download it into `data/`, which git ignores:

```sh
mkdir -p data && curl -sfLo data/icf.zip https://icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICF-en.zip \
  && unzip -o -j data/icf.zip SimpleTabulation-ICF-en.txt -d data && rm data/icf.zip
```

The definitions come from the ICD-API. Register at [icd.who.int/icdapi](https://icd.who.int/icdapi), and under "View API
access key(s)" get a client id and secret.

ICF is (c) World Health Organization, licensed under CC BY-ND 3.0 IGO: it can be used commercially as long as the codes
and titles aren't changed and the WHO is credited wherever they're shown.

## Running it
Put the keys in `.env`, which git ignores, as `export ICD_CLIENT_ID=...` and `export ICD_CLIENT_SECRET=...`, then:

```sh
source .env && cargo run --release -- data ../physical_functions_seed.cypher
```

Then run the seed against the database, after `physical_abilities_seed.cypher`, `physical_norms_seed.cypher`,
`personality_seed.cypher` and `personality_explore_seed.cypher`, since functions link to abilities, measurements and
the Big Five domains and traits.

- **What's in it:** the 346 body functions (b) of release 2026-01, leaving out the residual "other specified" and
  "unspecified" categories. The parts of the body come from the anatomy import, activities and participation (d)
  overlap Skills, and environmental factors (e) aren't part of the body.
- **Definitions:** one request per function, five a second. Each answer is appended to `data/definitions.jsonl`, and
  functions already in it are skipped, so a rerun asks only for what's left and needs no keys once it has them all.
- **Another release:** `--release YYYY-MM` asks the ICD-API for that release's definitions. Download the same release's
  tabulation, and delete `data/definitions.jsonl` so every definition is asked for again.
