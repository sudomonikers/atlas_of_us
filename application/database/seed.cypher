// =============================================================================
// Atlas of Me — Layer 0 seed (registry / meta-schema)
// Spec: documentation/data_model.md
//
// Idempotent: safe to re-run. Registry nodes MERGE on name and SET everything
// else, so edits here overwrite what is in the graph. CAN_INITIATE wiring is
// rebuilt from scratch on every run.
//
// Legality is defined on the outgoing side only: a NodeType's CAN_INITIATE edge
// lists the target types it may point at. There is no incoming-side wiring.
//
// NodeTypes list the properties their instances carry (not validated).
//
// Edges are validated in two steps:
//   1. every edge property must match its regex on the RelType
//      (RelType.properties[i] is checked by RelType.validations[i])
//   2. a property named `value` must also match the target node's `validation`
//      (today only Attribute nodes carry one)
// A relationship with no properties has two empty lists.
//
// Sections:
//   0. retired schema cleanup
//   1. constraints
//   2. NodeTypes
//   3. RelTypes
//   4. wiring (CAN_INITIATE {targets})
//   5. vector indexes
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Retired schema — removed from the registry on every run
//      Trait     → split into PersonalityTrait, PhysicalTrait, Condition
//      Belief    → Idea (believing is an edge, not a node type)
//      Asset     → Entity (possession is an OWNS edge)
//      Knowledge → Topic (covers tastes as well as understanding)
// -----------------------------------------------------------------------------

DROP CONSTRAINT trait_id_unique       IF EXISTS;
DROP CONSTRAINT trait_name_unique     IF EXISTS;
DROP CONSTRAINT belief_id_unique      IF EXISTS;
DROP CONSTRAINT belief_name_unique    IF EXISTS;
DROP CONSTRAINT asset_id_unique       IF EXISTS;
DROP CONSTRAINT knowledge_id_unique   IF EXISTS;
DROP CONSTRAINT knowledge_name_unique IF EXISTS;

DROP INDEX Trait_vec     IF EXISTS;
DROP INDEX Belief_vec    IF EXISTS;
DROP INDEX Knowledge_vec IF EXISTS;

MATCH (n:NodeType) WHERE n.name IN ['Trait', 'Belief', 'Asset', 'Knowledge']
DETACH DELETE n;


// -----------------------------------------------------------------------------
// 1. Constraints (Community edition: uniqueness only)
// -----------------------------------------------------------------------------

// Layer 0
CREATE CONSTRAINT nodetype_name_unique IF NOT EXISTS FOR (n:NodeType) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT reltype_name_unique  IF NOT EXISTS FOR (n:RelType)  REQUIRE n.name IS UNIQUE;

// Layer 1 — uuid key + name unique per label
CREATE CONSTRAINT skill_id_unique              IF NOT EXISTS FOR (n:Skill)            REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT skill_name_unique            IF NOT EXISTS FOR (n:Skill)            REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT topic_id_unique              IF NOT EXISTS FOR (n:Topic)            REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT topic_name_unique            IF NOT EXISTS FOR (n:Topic)            REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT pursuit_id_unique            IF NOT EXISTS FOR (n:Pursuit)          REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT pursuit_name_unique          IF NOT EXISTS FOR (n:Pursuit)          REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT personalitytrait_id_unique   IF NOT EXISTS FOR (n:PersonalityTrait) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT personalitytrait_name_unique IF NOT EXISTS FOR (n:PersonalityTrait) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT physicaltrait_id_unique      IF NOT EXISTS FOR (n:PhysicalTrait)    REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT physicaltrait_name_unique    IF NOT EXISTS FOR (n:PhysicalTrait)    REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT condition_id_unique          IF NOT EXISTS FOR (n:Condition)        REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT condition_name_unique        IF NOT EXISTS FOR (n:Condition)        REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT idea_id_unique               IF NOT EXISTS FOR (n:Idea)             REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT idea_name_unique             IF NOT EXISTS FOR (n:Idea)             REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT community_id_unique          IF NOT EXISTS FOR (n:Community)        REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT community_name_unique        IF NOT EXISTS FOR (n:Community)        REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT goal_id_unique               IF NOT EXISTS FOR (n:Goal)             REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT goal_name_unique             IF NOT EXISTS FOR (n:Goal)             REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT attribute_id_unique          IF NOT EXISTS FOR (n:Attribute)        REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT attribute_name_unique        IF NOT EXISTS FOR (n:Attribute)        REQUIRE n.name IS UNIQUE;

// Layer 2
CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE;

// Layer 3 — uuid key only; names are not unique among particulars
CREATE CONSTRAINT organization_id_unique IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT place_id_unique        IF NOT EXISTS FOR (n:Place)        REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT entity_id_unique       IF NOT EXISTS FOR (n:Entity)       REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 2. NodeTypes
// -----------------------------------------------------------------------------

UNWIND [

  // ---- Layer 1: domain concepts (universals, vectorised) ----
  { name: 'Skill', layer: 1,
    description: "an ability: something a person is capable of doing, e.g. chess, archery, public speaking.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Topic', layer: 1,
    description: "a subject, field or genre a person can understand or have a taste for, e.g. opening theory, french history, science fiction, jazz.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Pursuit', layer: 1,
    description: "something a person actually does as an ongoing part of their life: a hobby, practice, lifestyle, vocation or role, e.g. running, gardening, veganism, nursing, parenting.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'PersonalityTrait', layer: 1,
    description: "a stable characteristic of personality or temperament, e.g. patience, boldness, conscientiousness.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'PhysicalTrait', layer: 1,
    description: "a graded physical characteristic or capacity of the body, e.g. steady hands, flexibility, endurance. a measurable fact with a value (height, eye color) is an attribute instead.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Condition', layer: 1,
    description: "a lasting health, medical, neurological or psychological condition, e.g. asthma, adhd, colorblindness.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Idea', layer: 1,
    description: "a proposition, principle, value or ideology a person can believe, reject, value or understand, e.g. hard work pays off, family, stoicism, free will.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Community', layer: 1,
    description: "a category of people a person can belong to or identify with, as opposed to a particular organization, e.g. mexican-americans, catholics, veterans, gamers.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Goal', layer: 1,
    description: "something a person wants to achieve or become, e.g. run a marathon, become a concert pianist.",
    properties: ['id', 'name', 'description', 'vector', 'aliases'] },

  { name: 'Attribute', layer: 1,
    description: "a static fact about a person, e.g. height, eye color. its validation regex is what the value on every edge pointing at it must match.",
    properties: ['id', 'name', 'description', 'vector', 'aliases', 'validation'] },

  // ---- Layer 2: the person ----
  { name: 'Person', layer: 2,
    description: "an actual individual. holds only an id and a name: a person is their web of relationships.",
    properties: ['id', 'name'] },

  // ---- Layer 3: world particulars ----
  { name: 'Organization', layer: 3,
    description: "a particular organization or group, e.g. a company, a church, a sports team.",
    properties: ['id', 'name', 'description'] },

  { name: 'Place', layer: 3,
    description: "a particular location, e.g. a city, a country, a home.",
    properties: ['id', 'name', 'description'] },

  { name: 'Entity', layer: 3,
    description: "a catch-all for any particular thing that is not a person, organization or place, including things that can be owned, e.g. a house, a car, a pet dog, wolves, the ocean.",
    properties: ['id', 'name', 'description'] }

] AS nt
MERGE (n:NodeType {name: nt.name})
SET n.description = nt.description,
    n.layer       = nt.layer,
    n.properties  = nt.properties
REMOVE n.validations;


// -----------------------------------------------------------------------------
// 3. RelTypes
// -----------------------------------------------------------------------------

WITH
  '^[^A-Z]+$'                                               AS text,    // non-empty, lowercase
  '^(0([.][0-9]+)?|1([.]0+)?)$'                             AS unit,    // float 0.0–1.0
  '^(true|false)$'                                          AS bool,
  '^(novice|advanced beginner|competent|proficient|expert)$' AS dreyfus,
  '^(remember|understand|apply|analyze|evaluate|create)$'   AS bloom,
  '^.+$'                                                    AS any      // narrowed by the target's validation
UNWIND [

  // ---- Person → Layer-1 concept ----
  { name: 'HAS_SKILL', valence: 'neutral',
    description: "a person has a skill. proficiency follows the dreyfus model.",
    contract: [['proficiency', dreyfus]] },

  { name: 'UNDERSTANDS', valence: 'neutral',
    description: "a person understands a topic or an idea, whether or not they believe it. depth follows bloom's taxonomy.",
    contract: [['depth', bloom]] },

  { name: 'PURSUES', valence: 'neutral',
    description: "a person does a pursuit as an ongoing part of their life. commitment is how central it is to them.",
    contract: [['commitment', unit]] },

  { name: 'HAS_TRAIT', valence: 'neutral',
    description: "a person has a personality or physical trait. level is how strongly it shows.",
    contract: [['level', unit]] },

  { name: 'HAS_CONDITION', valence: 'neutral',
    description: "a person has a health condition. severity is how strongly it affects them.",
    contract: [['severity', unit]] },

  { name: 'BELIEVES', valence: 'positive',
    description: "a person holds an idea to be true. conviction is how firmly.",
    contract: [['conviction', unit]] },

  { name: 'REJECTS', valence: 'negative',
    description: "a person holds an idea to be false. conviction is how firmly.",
    contract: [['conviction', unit]] },

  { name: 'VALUES', valence: 'positive',
    description: "a person treats an idea as important in how they live and choose. priority is how much weight it carries.",
    contract: [['priority', unit]] },

  { name: 'DESIRES', valence: 'positive',
    description: "a person wants to achieve a goal. intensity is how much; motivation is why, in their words.",
    contract: [['intensity', unit], ['motivation', text]] },

  { name: 'HAS_ATTRIBUTE', valence: 'neutral',
    description: "a person has a value for an attribute. the value must match the validation regex on the target attribute node.",
    contract: [['value', any]] },

  // ---- Person → anything (emotions and sentiments) ----
  // Grounded in plutchik's wheel (primaries and dyads), restricted to stable,
  // object-directed attitudes; plus like/dislike and the self-conscious pair
  // pride/shame. Every one carries intensity.
  { name: 'LIKES',         valence: 'positive', description: "a person likes something.",                                    contract: [['intensity', unit]] },
  { name: 'DISLIKES',      valence: 'negative', description: "a person dislikes something.",                                 contract: [['intensity', unit]] },
  { name: 'LOVES',         valence: 'positive', description: "a person loves something or someone (joy + trust).",           contract: [['intensity', unit]] },
  { name: 'HATES',         valence: 'negative', description: "a person hates something or someone.",                         contract: [['intensity', unit]] },
  { name: 'ENJOYS',        valence: 'positive', description: "a person takes pleasure in something (joy).",                  contract: [['intensity', unit]] },
  { name: 'TRUSTS',        valence: 'positive', description: "a person trusts someone or something (trust).",                contract: [['intensity', unit]] },
  { name: 'DISTRUSTS',     valence: 'negative', description: "a person distrusts someone or something.",                     contract: [['intensity', unit]] },
  { name: 'FEARS',         valence: 'negative', description: "a person is afraid of something or someone (fear).",           contract: [['intensity', unit]] },
  { name: 'ANXIOUS_ABOUT', valence: 'negative', description: "a person feels ongoing unease about something (fear + anticipation).", contract: [['intensity', unit]] },
  { name: 'ADMIRES',       valence: 'positive', description: "a person looks up to someone or something.",                   contract: [['intensity', unit]] },
  { name: 'ENVIES',        valence: 'negative', description: "a person wants what someone else has.",                        contract: [['intensity', unit]] },
  { name: 'RESENTS',       valence: 'negative', description: "a person holds lasting anger toward someone (anger).",         contract: [['intensity', unit]] },
  { name: 'DESPISES',      valence: 'negative', description: "a person holds contempt for someone or something (disgust + anger).", contract: [['intensity', unit]] },
  { name: 'DISGUSTED_BY',  valence: 'negative', description: "a person is repulsed by something or someone (disgust).",      contract: [['intensity', unit]] },
  { name: 'SADDENED_BY',   valence: 'negative', description: "a person is saddened by something or someone (sadness).",      contract: [['intensity', unit]] },
  { name: 'CURIOUS_ABOUT', valence: 'positive', description: "a person is drawn to explore something (anticipation).",       contract: [['intensity', unit]] },
  { name: 'PROUD_OF',      valence: 'positive', description: "a person takes pride in something or someone.",                contract: [['intensity', unit]] },
  { name: 'ASHAMED_OF',    valence: 'negative', description: "a person feels shame about something or someone.",             contract: [['intensity', unit]] },

  // ---- Layer-1 concept → Layer-1 concept (authored by the edge-building job) ----
  { name: 'REQUIRES', valence: 'neutral',
    description: "directional, weighted prerequisite: the source concept needs the target. weight is how strongly; never a hard gate.",
    contract: [['weight', unit]] },

  { name: 'SIMILAR_TO', valence: 'neutral',
    description: "symmetric, weighted similarity: knowing one eases the other. stored in one direction, always queried undirected.",
    contract: [['weight', unit]] },

  // ---- World (Layer 2/3 particular → particular) ----
  { name: 'MARRIED_TO', valence: 'neutral',
    description: "two people are married. stored in one direction, queried undirected.",
    contract: [] },

  { name: 'PARENT_OF', valence: 'neutral',
    description: "a person is the parent of another person.",
    contract: [] },

  { name: 'FRIEND_OF', valence: 'positive',
    description: "two people are friends. stored in one direction, queried undirected. closeness is how close.",
    contract: [['closeness', unit]] },

  { name: 'KNOWS', valence: 'neutral',
    description: "a person knows another person. closeness is how well.",
    contract: [['closeness', unit]] },

  { name: 'WORKS_AT', valence: 'neutral',
    description: "a person works at an organization.",
    contract: [['title', text], ['role', text]] },

  { name: 'MEMBER_OF', valence: 'neutral',
    description: "a person is a member of an organization.",
    contract: [] },

  { name: 'LEADS', valence: 'neutral',
    description: "a person leads or runs an organization.",
    contract: [] },

  { name: 'IDENTIFIES_WITH', valence: 'positive',
    description: "a person sees a community, organization or place as part of who they are. strength is how strongly.",
    contract: [['strength', unit]] },

  { name: 'LIVES_IN', valence: 'neutral',
    description: "a person lives in a place. primary marks their main residence.",
    contract: [['primary', bool]] },

  { name: 'OWNS', valence: 'neutral',
    description: "a person or organization owns an entity, place or organization. stake is the fraction owned.",
    contract: [['stake', unit]] }

] AS rt
MERGE (r:RelType {name: rt.name})
SET r.description = rt.description,
    r.valence     = rt.valence,
    r.properties  = [c IN rt.contract | c[0]],
    r.validations = [c IN rt.contract | c[1]];


// -----------------------------------------------------------------------------
// 4. Wiring — [source NodeType, RelType, [allowed target NodeTypes]]
//    Anything not listed here is illegal.
// -----------------------------------------------------------------------------

// CAN_RECEIVE is retired; it is still matched here so old copies get removed.
MATCH (:NodeType)-[w:CAN_INITIATE|CAN_RECEIVE]->(:RelType)
DELETE w;

UNWIND [

  // ---- Person → Layer-1 concept ----
  ['Person', 'HAS_SKILL',     ['Skill']],
  ['Person', 'UNDERSTANDS',   ['Topic', 'Idea']],
  ['Person', 'PURSUES',       ['Pursuit']],
  ['Person', 'HAS_TRAIT',     ['PersonalityTrait', 'PhysicalTrait']],
  ['Person', 'HAS_CONDITION', ['Condition']],
  ['Person', 'BELIEVES',      ['Idea']],
  ['Person', 'REJECTS',       ['Idea']],
  ['Person', 'VALUES',        ['Idea']],
  ['Person', 'DESIRES',       ['Goal']],
  ['Person', 'HAS_ATTRIBUTE', ['Attribute']],

  // ---- Person → anything (emotions and sentiments) ----
  ['Person', 'LIKES',         ['Skill', 'Topic', 'Pursuit', 'PersonalityTrait', 'PhysicalTrait', 'Idea', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'DISLIKES',      ['Skill', 'Topic', 'Pursuit', 'PersonalityTrait', 'PhysicalTrait', 'Idea', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'LOVES',         ['Skill', 'Topic', 'Pursuit', 'Idea', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'HATES',         ['Skill', 'Topic', 'Pursuit', 'Idea', 'Condition', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'ENJOYS',        ['Skill', 'Topic', 'Pursuit', 'Place', 'Entity']],
  ['Person', 'TRUSTS',        ['Community', 'Person', 'Organization', 'Entity']],
  ['Person', 'DISTRUSTS',     ['Idea', 'Community', 'Person', 'Organization', 'Entity']],
  ['Person', 'FEARS',         ['Skill', 'Pursuit', 'Condition', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'ANXIOUS_ABOUT', ['Skill', 'Pursuit', 'Goal', 'Condition', 'Person', 'Organization', 'Entity']],
  ['Person', 'ADMIRES',       ['Skill', 'Pursuit', 'PersonalityTrait', 'PhysicalTrait', 'Idea', 'Community', 'Person', 'Organization']],
  ['Person', 'ENVIES',        ['Person']],
  ['Person', 'RESENTS',       ['Community', 'Person', 'Organization']],
  ['Person', 'DESPISES',      ['PersonalityTrait', 'Idea', 'Community', 'Person', 'Organization', 'Entity']],
  ['Person', 'DISGUSTED_BY',  ['PersonalityTrait', 'Idea', 'Person', 'Entity']],
  ['Person', 'SADDENED_BY',   ['Condition', 'Person', 'Organization', 'Entity']],
  ['Person', 'CURIOUS_ABOUT', ['Skill', 'Topic', 'Pursuit', 'Idea', 'Community', 'Place', 'Entity']],
  ['Person', 'PROUD_OF',      ['Skill', 'Topic', 'Pursuit', 'PersonalityTrait', 'PhysicalTrait', 'Attribute', 'Community', 'Person', 'Organization', 'Place', 'Entity']],
  ['Person', 'ASHAMED_OF',    ['Skill', 'Pursuit', 'PersonalityTrait', 'PhysicalTrait', 'Condition', 'Attribute', 'Community', 'Person']],

  // ---- Layer-1 learning edges ----
  ['Skill',   'REQUIRES',   ['Skill', 'Topic', 'PersonalityTrait', 'PhysicalTrait', 'Attribute']],
  ['Topic',   'REQUIRES',   ['Topic', 'Skill', 'Idea']],
  ['Pursuit', 'REQUIRES',   ['Pursuit', 'Skill', 'Topic', 'PersonalityTrait', 'PhysicalTrait', 'Attribute']],
  ['Idea',    'REQUIRES',   ['Idea', 'Topic']],
  ['Goal',    'REQUIRES',   ['Goal', 'Pursuit', 'Skill', 'Topic', 'PersonalityTrait', 'PhysicalTrait', 'Attribute']],

  ['Skill',            'SIMILAR_TO', ['Skill']],
  ['Topic',            'SIMILAR_TO', ['Topic']],
  ['Pursuit',          'SIMILAR_TO', ['Pursuit']],
  ['PersonalityTrait', 'SIMILAR_TO', ['PersonalityTrait']],
  ['PhysicalTrait',    'SIMILAR_TO', ['PhysicalTrait']],
  ['Condition',        'SIMILAR_TO', ['Condition']],
  ['Idea',             'SIMILAR_TO', ['Idea']],
  ['Community',        'SIMILAR_TO', ['Community']],
  ['Goal',             'SIMILAR_TO', ['Goal']],
  ['Attribute',        'SIMILAR_TO', ['Attribute']],

  // ---- World ----
  ['Person',       'MARRIED_TO',      ['Person']],
  ['Person',       'PARENT_OF',       ['Person']],
  ['Person',       'FRIEND_OF',       ['Person']],
  ['Person',       'KNOWS',           ['Person']],
  ['Person',       'WORKS_AT',        ['Organization']],
  ['Person',       'MEMBER_OF',       ['Organization']],
  ['Person',       'LEADS',           ['Organization']],
  ['Person',       'IDENTIFIES_WITH', ['Community', 'Organization', 'Place']],
  ['Person',       'LIVES_IN',        ['Place']],
  ['Person',       'OWNS',            ['Entity', 'Place', 'Organization']],
  ['Organization', 'OWNS',            ['Entity', 'Place', 'Organization']]

] AS rule
MATCH (src:NodeType {name: rule[0]})
MATCH (rel:RelType  {name: rule[1]})
MERGE (src)-[ci:CAN_INITIATE]->(rel)
SET ci.targets = rule[2];

// Sanity check — should return no rows. Any row is a target named in the wiring
// with no matching NodeType, or a RelType nothing can initiate.
MATCH (:NodeType)-[ci:CAN_INITIATE]->(r:RelType)
UNWIND ci.targets AS targetName
WITH r, targetName
WHERE NOT EXISTS { MATCH (:NodeType {name: targetName}) }
RETURN 'unknown target' AS problem, r.name AS relType, targetName AS detail
UNION
MATCH (r:RelType)
WHERE NOT EXISTS { MATCH (:NodeType)-[:CAN_INITIATE]->(r) }
RETURN 'uninitiable reltype' AS problem, r.name AS relType, null AS detail;


// -----------------------------------------------------------------------------
// 5. Vector indexes — one per Layer-1 label, named <Label>_vec
//    TODO: set vector.dimensions (and confirm the similarity function) once
//    the embedding model is chosen.
// -----------------------------------------------------------------------------

CREATE VECTOR INDEX Skill_vec IF NOT EXISTS
FOR (n:Skill) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Topic_vec IF NOT EXISTS
FOR (n:Topic) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Pursuit_vec IF NOT EXISTS
FOR (n:Pursuit) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX PersonalityTrait_vec IF NOT EXISTS
FOR (n:PersonalityTrait) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX PhysicalTrait_vec IF NOT EXISTS
FOR (n:PhysicalTrait) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Condition_vec IF NOT EXISTS
FOR (n:Condition) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Idea_vec IF NOT EXISTS
FOR (n:Idea) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Community_vec IF NOT EXISTS
FOR (n:Community) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Goal_vec IF NOT EXISTS
FOR (n:Goal) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };

CREATE VECTOR INDEX Attribute_vec IF NOT EXISTS
FOR (n:Attribute) ON n.vector
OPTIONS { indexConfig: { `vector.dimensions`: 1536, `vector.similarity_function`: 'cosine' } };
