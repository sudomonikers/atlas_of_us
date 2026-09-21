// =============================================================================
// Atlas of Me — sample person: andrew
// Spec: documentation/data_model.md
//
// Run AFTER seed.cypher and seed_layer1.cypher. Seeded concepts (attributes,
// personality and physical traits) are MATCHed, so if the seeds haven't run
// those edges are silently skipped.
//
// A fully worked individual that exercises every NodeType and every RelType in
// the registry, so the model can be inspected, queried and validated end to end.
//
// Idempotent: particulars MERGE on fixed sample ids (prefix
// 00000000-0000-4000-a000-), concepts MERGE on name, and edges MERGE on their
// endpoints with properties SET afterwards — re-running updates in place.
//
// In the real app, a new concept would first be matched against <Label>_vec
// and concept-to-concept edges would be written by the edge-building job; both
// are done by hand here.
//
// Sections:
//   1. Layer-1 concepts andrew needs that the starter seed doesn't include
//   2. Layer-1 concept edges (normally authored by the edge-building job)
//   3. Layer-3 particulars: people, organizations, places, entities
//   4. Layer 2: andrew → concepts
//   5. Emotions and sentiments
//   6. World: andrew (and others) → particulars
//   7. Validate every data edge against the registry
//   8. Summary
//
// Teardown (particulars only; concepts are shared and left in place):
//   MATCH (n) WHERE n.id STARTS WITH '00000000-0000-4000-a000-' DETACH DELETE n;
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Layer-1 concepts not in the starter seed
//    ON CREATE only: if another user already created the concept, reuse it as is.
// -----------------------------------------------------------------------------

UNWIND [
  { name: 'chess',                description: "the board game of chess." },
  { name: 'go',                   description: "the board game of go." },
  { name: 'archery',              description: "shooting arrows from a bow at a target." },
  { name: 'software engineering', description: "designing, building and maintaining software systems." },
  { name: 'public speaking',      description: "speaking clearly and persuasively to an audience." },
  { name: 'cooking',              description: "preparing food by combining and heating ingredients." },
  { name: 'spanish',              description: "speaking, reading and writing the spanish language." }
] AS c
MERGE (n:Skill {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'opening theory',        description: "the study of established chess opening sequences." },
  { name: 'bow-and-arrow physics', description: "how bows store energy and how arrows fly." },
  { name: 'distributed systems',   description: "how software runs reliably across many networked machines." },
  { name: 'jazz',                  description: "the jazz music genre." },
  { name: 'science fiction',       description: "the science fiction genre across books, film and tv." },
  { name: 'astronomy',             description: "the study of stars, planets and the universe." }
] AS c
MERGE (n:Topic {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'chess',                 description: "regularly playing chess, casually or competitively." },
  { name: 'archery',               description: "regularly shooting at a range or in the field." },
  { name: 'hiking',                description: "walking trails and mountains for recreation." },
  { name: 'parenting',             description: "raising and caring for a child." },
  { name: 'software engineering',  description: "working as a software engineer." },
  { name: 'coaching youth chess',  description: "teaching chess to children and teenagers." }
] AS c
MERGE (n:Pursuit {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'migraine',           description: "recurring severe headaches, often with sensitivity to light." },
  { name: 'seasonal allergies', description: "allergic reaction to pollen at certain times of year." }
] AS c
MERGE (n:Condition {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'hard work pays off',          description: "effort reliably leads to good outcomes." },
  { name: 'people are basically good',   description: "most people mean well most of the time." },
  { name: 'astrology',                   description: "the positions of celestial bodies shape personality and events." },
  { name: 'family',                      description: "the importance of family and close kin." },
  { name: 'honesty',                     description: "telling the truth and acting without deception." },
  { name: 'lifelong learning',           description: "continuing to learn throughout one's life." },
  { name: 'stoicism',                    description: "the philosophy of accepting what one cannot control and acting virtuously." },
  { name: 'winning at all costs',        description: "victory justifies any means." }
] AS c
MERGE (n:Idea {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'fathers',         description: "men who are parents." },
  { name: 'chess players',   description: "people who play chess." },
  { name: 'irish-americans', description: "americans of irish descent." }
] AS c
MERGE (n:Community {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];

UNWIND [
  { name: 'earn a fide master title', description: "reach the fide master chess title." },
  { name: 'run a half marathon',      description: "complete a 21.1 km race." },
  { name: 'retire early',             description: "stop working for income well before typical retirement age." }
] AS c
MERGE (n:Goal {name: c.name})
ON CREATE SET n.id = randomUUID(), n.description = c.description, n.aliases = [];


// -----------------------------------------------------------------------------
// 2. Layer-1 concept edges (normally authored by the edge-building job)
// -----------------------------------------------------------------------------

UNWIND [
  { from: ['Skill',   'chess'],                    to: ['Topic',            'opening theory'],           weight: 0.8 },
  { from: ['Skill',   'chess'],                    to: ['PersonalityTrait', 'patience'],                 weight: 0.5 },
  { from: ['Skill',   'archery'],                  to: ['PhysicalTrait',    'steady hands'],             weight: 0.7 },
  { from: ['Skill',   'archery'],                  to: ['Topic',            'bow-and-arrow physics'],    weight: 0.4 },
  { from: ['Pursuit', 'coaching youth chess'],     to: ['Skill',            'chess'],                    weight: 0.9 },
  { from: ['Pursuit', 'coaching youth chess'],     to: ['PersonalityTrait', 'patience'],                 weight: 0.7 },
  { from: ['Pursuit', 'software engineering'],     to: ['Skill',            'software engineering'],     weight: 0.9 },
  { from: ['Pursuit', 'software engineering'],     to: ['Topic',            'distributed systems'],      weight: 0.4 },
  { from: ['Goal',    'earn a fide master title'], to: ['Skill',            'chess'],                    weight: 0.9 },
  { from: ['Goal',    'earn a fide master title'], to: ['Pursuit',          'chess'],                    weight: 0.8 },
  { from: ['Goal',    'run a half marathon'],      to: ['PhysicalTrait',    'cardiovascular endurance'], weight: 0.8 }
] AS e
MATCH (a) WHERE e.from[0] IN labels(a) AND a.name = e.from[1]
MATCH (b) WHERE e.to[0]   IN labels(b) AND b.name = e.to[1]
MERGE (a)-[r:REQUIRES]->(b)
SET r.weight = e.weight;

UNWIND [
  { from: ['Skill',            'chess'],    to: ['Skill',            'go'],              weight: 0.4 },
  { from: ['PersonalityTrait', 'patience'], to: ['PersonalityTrait', 'self-discipline'], weight: 0.5 }
] AS e
MATCH (a) WHERE e.from[0] IN labels(a) AND a.name = e.from[1]
MATCH (b) WHERE e.to[0]   IN labels(b) AND b.name = e.to[1]
MERGE (a)-[r:SIMILAR_TO]->(b)
SET r.weight = e.weight;


// -----------------------------------------------------------------------------
// 3. Layer-3 particulars (and the people in andrew's life)
// -----------------------------------------------------------------------------

UNWIND [
  { id: '00000000-0000-4000-a000-000000000001', name: 'andrew' },
  { id: '00000000-0000-4000-a000-000000000002', name: 'lulu' },         // wife
  { id: '00000000-0000-4000-a000-000000000003', name: 'maya' },         // daughter
  { id: '00000000-0000-4000-a000-000000000004', name: 'carol' },        // mother
  { id: '00000000-0000-4000-a000-000000000005', name: 'sam' },          // best friend
  { id: '00000000-0000-4000-a000-000000000006', name: 'priya' },        // neighbor
  { id: '00000000-0000-4000-a000-000000000007', name: 'mr. okafor' },   // high school chess coach
  { id: '00000000-0000-4000-a000-000000000008', name: 'grandpa joe' }   // maternal grandfather, deceased
] AS p
MERGE (n:Person {id: p.id})
SET n.name = p.name;

UNWIND [
  { id: '00000000-0000-4000-a000-000000000101', name: 'ridgeline software', description: "the software company andrew works for." },
  { id: '00000000-0000-4000-a000-000000000102', name: 'denver chess club',  description: "a chess club in denver." },
  { id: '00000000-0000-4000-a000-000000000103', name: 'tuesday night chess', description: "a weekly casual chess meetup andrew started." },
  { id: '00000000-0000-4000-a000-000000000104', name: 'bramblecorp',        description: "andrew's former employer." },
  { id: '00000000-0000-4000-a000-000000000105', name: 'summit holdings',    description: "the investment firm that owns most of ridgeline software." }
] AS o
MERGE (n:Organization {id: o.id})
SET n.name = o.name, n.description = o.description;

UNWIND [
  { id: '00000000-0000-4000-a000-000000000201', name: 'colorado',             description: "the us state." },
  { id: '00000000-0000-4000-a000-000000000202', name: 'denver',               description: "the city in colorado." },
  { id: '00000000-0000-4000-a000-000000000203', name: 'the house on elm street', description: "andrew and lulu's home in denver." },
  { id: '00000000-0000-4000-a000-000000000204', name: 'grand lake cabin',     description: "a cabin in the mountains andrew and lulu share." },
  { id: '00000000-0000-4000-a000-000000000205', name: 'las vegas',            description: "the city in nevada." },
  { id: '00000000-0000-4000-a000-000000000206', name: 'japan',                description: "the country." }
] AS pl
MERGE (n:Place {id: pl.id})
SET n.name = pl.name, n.description = pl.description;

UNWIND [
  { id: '00000000-0000-4000-a000-000000000301', name: 'biscuit',                  description: "andrew's golden retriever." },
  { id: '00000000-0000-4000-a000-000000000302', name: 'the blue hatchback',       description: "andrew's car." },
  { id: '00000000-0000-4000-a000-000000000303', name: 'sharks',                   description: "sharks, the animal." },
  { id: '00000000-0000-4000-a000-000000000304', name: 'cilantro',                 description: "the herb." },
  { id: '00000000-0000-4000-a000-000000000305', name: 'self-driving cars',        description: "autonomous vehicles." },
  { id: '00000000-0000-4000-a000-000000000306', name: "grandpa joe's chess set",  description: "a wooden chess set andrew inherited." },
  { id: '00000000-0000-4000-a000-000000000307', name: 'the ocean',                description: "the sea." }
] AS en
MERGE (n:Entity {id: en.id})
SET n.name = en.name, n.description = en.description;


// -----------------------------------------------------------------------------
// 4. Layer 2 — andrew → concepts
// -----------------------------------------------------------------------------

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'chess',                proficiency: 'expert' },
  { name: 'archery',              proficiency: 'advanced beginner' },
  { name: 'software engineering', proficiency: 'proficient' },
  { name: 'cooking',              proficiency: 'competent' },
  { name: 'spanish',              proficiency: 'advanced beginner' },
  { name: 'public speaking',      proficiency: 'novice' }
] AS s
MATCH (n:Skill {name: s.name})
MERGE (andrew)-[r:HAS_SKILL]->(n)
SET r.proficiency = s.proficiency;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Topic', name: 'opening theory',        depth: 'analyze' },
  { label: 'Topic', name: 'distributed systems',   depth: 'create' },
  { label: 'Topic', name: 'bow-and-arrow physics', depth: 'understand' },
  { label: 'Topic', name: 'astronomy',             depth: 'remember' },
  { label: 'Idea',  name: 'stoicism',              depth: 'apply' },
  { label: 'Idea',  name: 'astrology',             depth: 'understand' }   // understands it, rejects it
] AS u
MATCH (n) WHERE u.label IN labels(n) AND n.name = u.name
MERGE (andrew)-[r:UNDERSTANDS]->(n)
SET r.depth = u.depth;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'parenting',            commitment: 0.95 },
  { name: 'chess',                commitment: 0.8 },
  { name: 'software engineering', commitment: 0.7 },
  { name: 'archery',              commitment: 0.5 },
  { name: 'hiking',               commitment: 0.4 },
  { name: 'coaching youth chess', commitment: 0.3 }
] AS p
MATCH (n:Pursuit {name: p.name})
MERGE (andrew)-[r:PURSUES]->(n)
SET r.commitment = p.commitment;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'PersonalityTrait', name: 'patience',                 level: 0.8 },
  { label: 'PersonalityTrait', name: 'intellectual curiosity',   level: 0.85 },
  { label: 'PersonalityTrait', name: 'extraversion',             level: 0.35 },
  { label: 'PersonalityTrait', name: 'conscientiousness',        level: 0.7 },
  { label: 'PersonalityTrait', name: 'neuroticism',              level: 0.3 },
  { label: 'PersonalityTrait', name: 'empathy',                  level: 0.6 },
  { label: 'PersonalityTrait', name: 'competitiveness',          level: 0.75 },
  { label: 'PersonalityTrait', name: 'stubbornness',             level: 0.65 },
  { label: 'PhysicalTrait',    name: 'steady hands',             level: 0.7 },
  { label: 'PhysicalTrait',    name: 'hand-eye coordination',    level: 0.7 },
  { label: 'PhysicalTrait',    name: 'visual acuity',            level: 0.9 },
  { label: 'PhysicalTrait',    name: 'strength',                 level: 0.55 },
  { label: 'PhysicalTrait',    name: 'cardiovascular endurance', level: 0.5 },
  { label: 'PhysicalTrait',    name: 'flexibility',              level: 0.2 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND n.name = t.name
MERGE (andrew)-[r:HAS_TRAIT]->(n)
SET r.level = t.level;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'migraine',           severity: 0.4 },
  { name: 'seasonal allergies', severity: 0.3 }
] AS c
MATCH (n:Condition {name: c.name})
MERGE (andrew)-[r:HAS_CONDITION]->(n)
SET r.severity = c.severity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'hard work pays off',        conviction: 0.8 },
  { name: 'people are basically good', conviction: 0.6 }
] AS b
MATCH (n:Idea {name: b.name})
MERGE (andrew)-[r:BELIEVES]->(n)
SET r.conviction = b.conviction;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
MATCH (n:Idea {name: 'astrology'})
MERGE (andrew)-[r:REJECTS]->(n)
SET r.conviction = 0.9;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'family',            priority: 0.95 },
  { name: 'honesty',           priority: 0.9 },
  { name: 'lifelong learning', priority: 0.7 }
] AS v
MATCH (n:Idea {name: v.name})
MERGE (andrew)-[r:VALUES]->(n)
SET r.priority = v.priority;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'earn a fide master title', intensity: 0.6, motivation: "to prove to myself i can still improve after thirty-five." },
  { name: 'run a half marathon',      intensity: 0.4, motivation: "my doctor said cardio would help with the migraines." },
  { name: 'retire early',             intensity: 0.5, motivation: "more time with maya before she leaves home." }
] AS g
MATCH (n:Goal {name: g.name})
MERGE (andrew)-[r:DESIRES]->(n)
SET r.intensity = g.intensity, r.motivation = g.motivation;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { name: 'height',             value: 195 },
  { name: 'weight',             value: 92.5 },
  { name: 'arm span',           value: 199 },
  { name: 'shoe size',          value: 47 },
  { name: 'date of birth',      value: '1989-06-14' },
  { name: 'eye color',          value: 'blue' },
  { name: 'natural hair color', value: 'brown' },
  { name: 'hair texture',       value: 'wavy' },
  { name: 'skin type',          value: 'ii' },
  { name: 'blood type',         value: 'o+' },
  { name: 'sex',                value: 'male' },
  { name: 'gender identity',    value: 'man' },
  { name: 'sexual orientation', value: 'straight' },
  { name: 'chronotype',         value: 'evening' },
  { name: 'handedness',         value: 'right' },
  { name: 'footedness',         value: 'right' },
  { name: 'dominant eye',       value: 'left' },      // cross-dominant: matters for archery
  { name: 'first language',     value: 'english' }
] AS a
MATCH (n:Attribute {name: a.name})
MERGE (andrew)-[r:HAS_ATTRIBUTE]->(n)
SET r.value = a.value;


// -----------------------------------------------------------------------------
// 5. Emotions and sentiments
//    Targets span layers, so each is addressed by label plus id (particulars)
//    or name (concepts).
// -----------------------------------------------------------------------------

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Topic',        name: 'jazz',                                     intensity: 0.7 },
  { label: 'Organization', id: '00000000-0000-4000-a000-000000000102',       intensity: 0.8 },
  { label: 'Person',       id: '00000000-0000-4000-a000-000000000006',       intensity: 0.5 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:LIKES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Place', id: '00000000-0000-4000-a000-000000000205', intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:DISLIKES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person',  id: '00000000-0000-4000-a000-000000000002', intensity: 1.0 },
  { label: 'Person',  id: '00000000-0000-4000-a000-000000000003', intensity: 1.0 },
  { label: 'Entity',  id: '00000000-0000-4000-a000-000000000301', intensity: 0.9 },
  { label: 'Place',   id: '00000000-0000-4000-a000-000000000204', intensity: 0.8 },
  { label: 'Topic',   name: 'science fiction',                   intensity: 0.75 },
  { label: 'Pursuit', name: 'chess',                             intensity: 0.85 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:LOVES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Condition', name: 'migraine', intensity: 0.8 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:HATES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Pursuit', name: 'hiking',                               intensity: 0.7 },
  { label: 'Skill',   name: 'cooking',                              intensity: 0.6 },
  { label: 'Entity',  id: '00000000-0000-4000-a000-000000000307',   intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:ENJOYS]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person', id: '00000000-0000-4000-a000-000000000002', intensity: 0.95 },
  { label: 'Person', id: '00000000-0000-4000-a000-000000000005', intensity: 0.85 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:TRUSTS]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Entity', id: '00000000-0000-4000-a000-000000000305', intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:DISTRUSTS]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Entity', id: '00000000-0000-4000-a000-000000000303', intensity: 0.5 },
  { label: 'Skill',  name: 'public speaking',                   intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:FEARS]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Goal',    name: 'retire early',                        intensity: 0.4 },
  { label: 'Pursuit', name: 'parenting',                           intensity: 0.5 },
  { label: 'Person',  id: '00000000-0000-4000-a000-000000000004',  intensity: 0.5 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:ANXIOUS_ABOUT]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person',           id: '00000000-0000-4000-a000-000000000007', intensity: 0.8 },
  { label: 'PersonalityTrait', name: 'resilience',                        intensity: 0.7 },
  { label: 'Idea',             name: 'stoicism',                          intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:ADMIRES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person', id: '00000000-0000-4000-a000-000000000005', intensity: 0.3 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:ENVIES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Organization', id: '00000000-0000-4000-a000-000000000104', intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:RESENTS]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Idea', name: 'winning at all costs', intensity: 0.7 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:DESPISES]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Entity', id: '00000000-0000-4000-a000-000000000304', intensity: 0.5 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:DISGUSTED_BY]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person', id: '00000000-0000-4000-a000-000000000008', intensity: 0.6 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:SADDENED_BY]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Topic', name: 'astronomy',                           intensity: 0.7 },
  { label: 'Place', id: '00000000-0000-4000-a000-000000000206',  intensity: 0.5 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:CURIOUS_ABOUT]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Person', id: '00000000-0000-4000-a000-000000000003', intensity: 0.95 },
  { label: 'Skill',  name: 'chess',                             intensity: 0.8 },
  { label: 'Entity', id: '00000000-0000-4000-a000-000000000306', intensity: 0.7 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:PROUD_OF]->(n) SET r.intensity = t.intensity;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Attribute', name: 'weight', intensity: 0.3 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:ASHAMED_OF]->(n) SET r.intensity = t.intensity;


// -----------------------------------------------------------------------------
// 6. World — particular → particular (and Person → Community)
// -----------------------------------------------------------------------------

// family
MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
MATCH (lulu:Person   {id: '00000000-0000-4000-a000-000000000002'})
MATCH (maya:Person   {id: '00000000-0000-4000-a000-000000000003'})
MATCH (carol:Person  {id: '00000000-0000-4000-a000-000000000004'})
MATCH (joe:Person    {id: '00000000-0000-4000-a000-000000000008'})
MERGE (andrew)-[:MARRIED_TO]->(lulu)
MERGE (andrew)-[:PARENT_OF]->(maya)
MERGE (lulu)-[:PARENT_OF]->(maya)
MERGE (carol)-[:PARENT_OF]->(andrew)
MERGE (joe)-[:PARENT_OF]->(carol);

// friends and acquaintances
MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { id: '00000000-0000-4000-a000-000000000005', closeness: 0.85 }
] AS f
MATCH (n:Person {id: f.id})
MERGE (andrew)-[r:FRIEND_OF]->(n) SET r.closeness = f.closeness;

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { id: '00000000-0000-4000-a000-000000000006', closeness: 0.4 },
  { id: '00000000-0000-4000-a000-000000000007', closeness: 0.6 }
] AS k
MATCH (n:Person {id: k.id})
MERGE (andrew)-[r:KNOWS]->(n) SET r.closeness = k.closeness;

// organizations
MATCH (andrew:Person      {id: '00000000-0000-4000-a000-000000000001'})
MATCH (ridgeline:Organization {id: '00000000-0000-4000-a000-000000000101'})
MATCH (club:Organization      {id: '00000000-0000-4000-a000-000000000102'})
MATCH (tuesday:Organization   {id: '00000000-0000-4000-a000-000000000103'})
MATCH (summit:Organization    {id: '00000000-0000-4000-a000-000000000105'})
MERGE (andrew)-[w:WORKS_AT]->(ridgeline)
SET w.title = 'senior software engineer', w.role = 'backend engineer'
MERGE (andrew)-[:MEMBER_OF]->(club)
MERGE (andrew)-[:LEADS]->(tuesday)
MERGE (summit)-[s:OWNS]->(ridgeline)
SET s.stake = 0.6;

// identity
MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Community',    name: 'fathers',                             strength: 0.8 },
  { label: 'Community',    name: 'chess players',                       strength: 0.7 },
  { label: 'Community',    name: 'irish-americans',                     strength: 0.3 },
  { label: 'Place',        id: '00000000-0000-4000-a000-000000000201',  strength: 0.7 },
  { label: 'Organization', id: '00000000-0000-4000-a000-000000000102',  strength: 0.5 }
] AS t
MATCH (n) WHERE t.label IN labels(n) AND CASE WHEN t.id IS NOT NULL THEN n.id = t.id ELSE n.name = t.name END
MERGE (andrew)-[r:IDENTIFIES_WITH]->(n) SET r.strength = t.strength;

// home
MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { id: '00000000-0000-4000-a000-000000000203', primary: true },
  { id: '00000000-0000-4000-a000-000000000204', primary: false }
] AS l
MATCH (n:Place {id: l.id})
MERGE (andrew)-[r:LIVES_IN]->(n) SET r.primary = l.primary;

// possessions
MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})
UNWIND [
  { label: 'Place',        id: '00000000-0000-4000-a000-000000000203', stake: 0.5 },    // house, shared with lulu
  { label: 'Place',        id: '00000000-0000-4000-a000-000000000204', stake: 0.5 },    // cabin, shared with lulu
  { label: 'Entity',       id: '00000000-0000-4000-a000-000000000302', stake: 1.0 },    // car
  { label: 'Entity',       id: '00000000-0000-4000-a000-000000000301', stake: 1.0 },    // biscuit
  { label: 'Entity',       id: '00000000-0000-4000-a000-000000000306', stake: 1.0 },    // chess set
  { label: 'Organization', id: '00000000-0000-4000-a000-000000000101', stake: 0.001 }   // employee equity
] AS o
MATCH (n) WHERE o.label IN labels(n) AND n.id = o.id
MERGE (andrew)-[r:OWNS]->(n) SET r.stake = o.stake;

MATCH (lulu:Person {id: '00000000-0000-4000-a000-000000000002'})
UNWIND ['00000000-0000-4000-a000-000000000203', '00000000-0000-4000-a000-000000000204'] AS placeId
MATCH (n:Place {id: placeId})
MERGE (lulu)-[r:OWNS]->(n) SET r.stake = 0.5;

// lulu shares a pursuit node with andrew — the same concept, two people
MATCH (lulu:Person {id: '00000000-0000-4000-a000-000000000002'})
MATCH (n:Pursuit {name: 'parenting'})
MERGE (lulu)-[r:PURSUES]->(n) SET r.commitment = 0.9;


// -----------------------------------------------------------------------------
// 7. Validate every data edge against the registry
//    Should return no rows. Checks, per edge:
//      legal          — the source NodeType CAN_INITIATE this RelType toward the target type
//      invalidProps   — contract properties that are missing or fail their regex
//      unknownProps   — properties on the edge that the RelType doesn't declare
//      invalidValue   — a `value` that fails the target node's own validation
// -----------------------------------------------------------------------------

MATCH (a)-[r]->(b)
WHERE NOT a:NodeType AND NOT a:RelType
WITH a, r, b, head(labels(a)) AS sourceType, head(labels(b)) AS targetType, type(r) AS relType
OPTIONAL MATCH (:NodeType {name: sourceType})-[ci:CAN_INITIATE]->(rt:RelType {name: relType})
WITH a, r, b, sourceType, targetType, relType, rt,
     (ci IS NOT NULL AND targetType IN ci.targets) AS legal
WITH a, r, b, sourceType, targetType, relType, legal,
     CASE WHEN rt IS NULL THEN [] ELSE
       [i IN range(0, size(rt.properties) - 1)
          WHERE r[rt.properties[i]] IS NULL
             OR NOT toString(r[rt.properties[i]]) =~ rt.validations[i]
          | rt.properties[i]]
     END AS invalidProps,
     CASE WHEN rt IS NULL THEN keys(r) ELSE [k IN keys(r) WHERE NOT k IN rt.properties] END AS unknownProps,
     (r.value IS NOT NULL AND b.validation IS NOT NULL AND NOT toString(r.value) =~ b.validation) AS invalidValue
WHERE NOT legal OR size(invalidProps) > 0 OR size(unknownProps) > 0 OR invalidValue
RETURN sourceType, coalesce(a.name, a.id) AS source, relType, targetType, coalesce(b.name, b.id) AS target,
       legal, invalidProps, unknownProps, invalidValue;


// -----------------------------------------------------------------------------
// 8. Summary — andrew's edges by relationship type
// -----------------------------------------------------------------------------

MATCH (andrew:Person {id: '00000000-0000-4000-a000-000000000001'})-[r]->(n)
RETURN type(r) AS relType, count(*) AS edges, collect(n.name) AS targets
ORDER BY relType;
