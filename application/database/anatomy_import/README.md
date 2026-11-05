# Anatomy Import

Writes `../physical_anatomy_seed.cypher` and the 3D body in `../../ui/atlas-of-us-ui/public/anatomy/`. The seed has every
part of the body BodyParts3D has a model of, and the parts in `src/picks.rs` it hasn't, each with its name, definition
and other names from the Foundational Model of Anatomy (FMA), how they nest, and the body functions they serve. The 3D
body is BodyParts3D's models, simplified so the whole body loads in a browser, one binary glTF file per layer, with
`meshes.json` saying which part each mesh is and which layer it's on. Both are generated, so change this and run it again
rather than editing them.

## Getting the data
Download into `data/`, which git ignores. BodyParts3D's server is slow, so the models can take ten minutes:

```sh
mkdir -p data/bp3d && cd data \
  && curl -sfLo fma.owl http://purl.obolibrary.org/obo/fma.owl \
  && curl -sfLO https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip \
  && cd bp3d && for f in isa_parts_list_e partof_parts_list_e isa_inclusion_relation_list partof_inclusion_relation_list \
     isa_element_parts partof_element_parts; do curl -sfLO "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/$f.txt"; done
```

FMA is CC BY 3.0. BodyParts3D is (c) The Database Center for Life Science, CC BY 4.0. Both are credited wherever
they're shown.

## Running it
It checks the functions in `src/picks.rs` against WHO's ICF tabulation, which the ICF import downloads, and the
measurements against the norms seed:

```sh
cargo run --release -- data ../icf_import/data/SimpleTabulation-ICF-en.txt ../physical_norms_seed.cypher \
  ../physical_anatomy_seed.cypher ../../ui/atlas-of-us-ui/public/anatomy
```

Then run the seed against the database, after `physical_norms_seed.cypher` and `physical_functions_seed.cypher`, since
parts link to functions and measurements link to parts. The 3D
body ships with the site.

- **What's in it:** 3,432 parts with models, from whole systems to single muscles, bones, vessels and nerves, and 56
  without, such as the uterus, the thyroid gland and the knee joint. BodyParts3D's model is a man, so the female
  reproductive organs are among the ones without.
- **Major parts:** `major` marks the 672 parts a condition is linked to: the systems and regions, every kind of organ
  (`MAJOR`, which in FMA covers bones, muscles, joints and named vessels), the extras, and the parts `SERVES` and
  `MEASURES` name, leaving out the left and right copies of a part. Branches of vessels and nerves, and regions of
  organs, aren't major.
- **Measurements:** `MEASURES` in `src/picks.rs` links each measurement to the parts it's a reading of.
- **Topics:** `TOPICS` in `src/picks.rs` links the systems and organs to the topics to learn more about them in, by topic
  name. Topics come from the topics import, so run the seed again after it to link the ones that didn't exist yet.
- **How they nest:** BodyParts3D's part-of and is-a trees, which use FMA ids. Each extra is placed under the nearest
  parts above it in FMA, and `PLACES` in `src/picks.rs` puts the ones FMA doesn't link in their systems.
- **Layers:** a mesh goes on the first layer one of whose classes the part in its header is, or is part of, in FMA
  (`LAYERS`), then on one whose words are in its name (`LAYER_WORDS`), and on organs otherwise.
- **The models:** each mesh keeps about 4% of its triangles, about 320,000 in all and 5 MB across the six files. Change
  `KEEP` and `MAX_ERROR` in `src/models.rs` to trade detail for size. Coordinates are metres with y up and the body
  facing +z.
