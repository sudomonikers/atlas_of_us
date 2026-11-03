# Conditions Import

Writes `../physical_conditions_seed.cypher`: the conditions chosen in `src/picks.rs`, common ones a person would know
they have, each with its name, definition and other names from Mondo or HPO, the broader conditions in the seed it's a
kind of, and the body functions and structures it affects. The seed is generated, so change this and run it again
rather than editing it.

## Getting Mondo and HPO
Download both in OBO format into `data/`, which git ignores:

```sh
mkdir -p data && curl -sfLo data/mondo.obo https://purl.obolibrary.org/obo/mondo.obo \
  && curl -sfLo data/hp.obo https://purl.obolibrary.org/obo/hp.obo
```

Mondo is CC BY 4.0. HPO is free to use as long as its terms aren't changed and HPO is credited wherever they're shown.

## Running it
It checks the body functions and structures in `src/picks.rs` against WHO's ICF tabulation, which the ICF import
downloads:

```sh
cargo run --release -- data ../icf_import/data/SimpleTabulation-ICF-en.txt ../physical_conditions_seed.cypher
```

Then run the seed against the database, after `physical_body_seed.cypher`, since conditions link to body functions and
structures.

- **What's in it:** 191 diseases from Mondo and 71 features from HPO. Each concept is in once, from whichever ontology
  names it best: diseases from Mondo, and features such as joint hypermobility or tinnitus from HPO.
- **Checks:** every id has to be in its ontology, not obsolete, and under human disease (`MONDO:0700096`) or
  phenotypic abnormality (`HP:0000118`), and every code has to be a body function or structure.
- **How they nest:** a condition is a SUBTYPE_OF the nearest conditions in the seed that the ontology puts above it,
  and carries the ids of every class above it in its ontology as `ancestors`, which places conditions people add later.
