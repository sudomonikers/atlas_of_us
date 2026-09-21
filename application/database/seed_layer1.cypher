// =============================================================================
// Atlas of Me — Layer 1 seed (starter domain concepts)
// Spec: documentation/data_model.md
//
// Run AFTER seed.cypher (it relies on the Layer-1 constraints defined there).
//
// Layer 1 grows on its own as people add concepts; this file only gives it a
// sensible starting vocabulary so common concepts share one node from day one.
//
// Idempotent: MERGE on name, id set only on create. description and validation
// are overwritten from this file on every run; aliases are merged, so aliases
// users have added since are kept.
//
// `vector` is deliberately left unset — the embedding job fills it. Until then
// these nodes are invisible to the <Label>_vec duplicate check.
//
// Sections:
//   1. Attributes        — static facts with a value (validation regex)
//   2. PersonalityTraits — big five domains and facets, plus common traits
//   3. PhysicalTraits    — graded capacities of the body
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Attributes
//    `validation` is the regex the `value` on every HAS_ATTRIBUTE edge must match.
// -----------------------------------------------------------------------------

UNWIND [

  // ---- body measurements ----
  { name: 'height', aliases: ['stature'],
    description: "how tall a person is, in centimeters.",
    validation: '^[0-9]{2,3}([.][0-9]+)?$' },

  { name: 'weight', aliases: ['body weight', 'mass'],
    description: "how much a person weighs, in kilograms.",
    validation: '^[0-9]{1,3}([.][0-9]+)?$' },

  { name: 'arm span', aliases: ['wingspan', 'ape index'],
    description: "the distance between a person's fingertips with arms outstretched, in centimeters.",
    validation: '^[0-9]{2,3}([.][0-9]+)?$' },

  { name: 'shoe size', aliases: [],
    description: "a person's shoe size, in eu sizing.",
    validation: '^[0-9]{2}([.]5)?$' },

  // ---- appearance ----
  { name: 'eye color', aliases: ['eye colour'],
    description: "the color of a person's eyes.",
    validation: '^(brown|blue|green|hazel|gray|amber|heterochromia)$' },

  { name: 'natural hair color', aliases: ['hair color', 'hair colour'],
    description: "the color of a person's hair without dye.",
    validation: '^(black|brown|blonde|red|auburn|gray|white)$' },

  { name: 'hair texture', aliases: ['hair type'],
    description: "the natural shape of a person's hair.",
    validation: '^(straight|wavy|curly|coily)$' },

  { name: 'skin type', aliases: ['skin tone', 'fitzpatrick type'],
    description: "a person's skin type on the fitzpatrick scale, from i (always burns, never tans) to vi (never burns).",
    validation: '^(i|ii|iii|iv|v|vi)$' },

  // ---- biology ----
  { name: 'date of birth', aliases: ['birthday', 'birth date', 'age'],
    description: "the date a person was born, as yyyy-mm-dd. age is derived from it.",
    validation: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' },

  { name: 'blood type', aliases: ['blood group'],
    description: "a person's abo blood group and rh factor, e.g. o+ or ab-.",
    validation: '^(a|b|ab|o)[+-]$' },

  { name: 'sex', aliases: ['biological sex', 'sex assigned at birth'],
    description: "a person's biological sex.",
    validation: '^(female|male|intersex)$' },

  { name: 'chronotype', aliases: ['morning or night person', 'sleep type'],
    description: "a person's natural sleep-wake timing.",
    validation: '^(morning|intermediate|evening)$' },

  // ---- laterality ----
  { name: 'handedness', aliases: ['dominant hand'],
    description: "which hand a person naturally favors.",
    validation: '^(left|right|ambidextrous)$' },

  { name: 'footedness', aliases: ['dominant foot'],
    description: "which foot a person naturally favors.",
    validation: '^(left|right|either)$' },

  { name: 'dominant eye', aliases: ['eye dominance'],
    description: "which eye a person's brain favors for visual input, relevant to aiming.",
    validation: '^(left|right|neither)$' },

  // ---- self-described ----
  { name: 'gender identity', aliases: ['gender'],
    description: "a person's gender, in their own words.",
    validation: '^[^A-Z]+$' },

  { name: 'sexual orientation', aliases: ['orientation', 'sexuality'],
    description: "who a person is attracted to, in their own words.",
    validation: '^[^A-Z]+$' },

  { name: 'first language', aliases: ['native language', 'mother tongue'],
    description: "the language a person learned first. ability in any language is a skill.",
    validation: '^[^A-Z]+$' }

] AS a
MERGE (n:Attribute {name: a.name})
ON CREATE SET n.id = randomUUID()
SET n.description = a.description,
    n.validation  = a.validation,
    n.aliases     = a.aliases + [x IN coalesce(n.aliases, []) WHERE NOT x IN a.aliases];


// -----------------------------------------------------------------------------
// 2. PersonalityTraits
//    HAS_TRAIT {level} runs 0.0–1.0, so each trait is one scale: a low level is
//    its opposite (low extraversion = introverted). Opposites are therefore not
//    separate nodes.
//    Structure: big five domains, their ipip-neo facets (a few renamed to avoid
//    colliding with conditions or ideas), hexaco honesty-humility, then common
//    everyday traits.
// -----------------------------------------------------------------------------

UNWIND [

  // ---- big five domains (+ hexaco) ----
  { name: 'openness', aliases: ['openness to experience'],
    description: "big five domain: appetite for novelty, ideas, art and variety. low is conventional and practical." },
  { name: 'conscientiousness', aliases: [],
    description: "big five domain: organization, diligence and self-control. low is easygoing and spontaneous." },
  { name: 'extraversion', aliases: ['extroversion'],
    description: "big five domain: drawing energy from people and stimulation. low is introverted." },
  { name: 'agreeableness', aliases: [],
    description: "big five domain: warmth, cooperation and concern for others. low is competitive and blunt." },
  { name: 'neuroticism', aliases: ['emotional instability'],
    description: "big five domain: tendency toward negative emotion and stress. low is calm and emotionally stable." },
  { name: 'honesty-humility', aliases: ['integrity'],
    description: "hexaco domain: sincerity, fairness and lack of greed or self-importance. low is manipulative or entitled." },

  // ---- openness facets ----
  { name: 'imagination', aliases: ['fantasy'],
    description: "openness facet: a rich inner world and tendency to daydream and invent." },
  { name: 'artistic interest', aliases: ['aesthetic appreciation', 'aesthetics'],
    description: "openness facet: being moved by art, music, beauty and nature." },
  { name: 'emotional awareness', aliases: ['emotionality', 'feelings'],
    description: "openness facet: noticing and valuing one's own emotions." },
  { name: 'adventurousness', aliases: ['novelty seeking'],
    description: "openness facet: eagerness to try new activities, foods and places." },
  { name: 'intellectual curiosity', aliases: ['intellect', 'curiosity', 'inquisitiveness'],
    description: "openness facet: love of ideas, puzzles and abstract thinking." },
  { name: 'openness to values', aliases: ['unconventionality', 'psychological liberalism'],
    description: "openness facet: readiness to question authority, tradition and convention." },

  // ---- conscientiousness facets ----
  { name: 'self-efficacy', aliases: ['competence', 'confidence'],
    description: "conscientiousness facet: belief in one's own ability to get things done." },
  { name: 'orderliness', aliases: ['tidiness', 'organization'],
    description: "conscientiousness facet: liking structure, plans and neatness." },
  { name: 'dutifulness', aliases: ['reliability', 'sense of duty'],
    description: "conscientiousness facet: keeping promises and following rules and obligations." },
  { name: 'achievement striving', aliases: ['ambition', 'drive'],
    description: "conscientiousness facet: working hard toward high standards and goals." },
  { name: 'self-discipline', aliases: ['willpower'],
    description: "conscientiousness facet: starting and finishing tasks despite boredom or distraction." },
  { name: 'cautiousness', aliases: ['deliberation', 'prudence'],
    description: "conscientiousness facet: thinking before acting. low is impulsive." },

  // ---- extraversion facets ----
  { name: 'friendliness', aliases: ['warmth'],
    description: "extraversion facet: making friends easily and showing affection openly." },
  { name: 'gregariousness', aliases: ['sociability'],
    description: "extraversion facet: preferring company and crowds to being alone." },
  { name: 'assertiveness', aliases: [],
    description: "extraversion facet: speaking up, taking charge and leading groups." },
  { name: 'activity level', aliases: ['energy', 'pace'],
    description: "extraversion facet: living at a fast, busy, energetic tempo." },
  { name: 'excitement seeking', aliases: ['thrill seeking', 'sensation seeking'],
    description: "extraversion facet: craving stimulation, risk and intensity." },
  { name: 'cheerfulness', aliases: ['positive emotions', 'exuberance'],
    description: "extraversion facet: readily feeling joy, enthusiasm and fun." },

  // ---- agreeableness facets ----
  { name: 'trustfulness', aliases: ['trusting nature'],
    description: "agreeableness facet: assuming others are honest and well-intentioned." },
  { name: 'sincerity', aliases: ['straightforwardness', 'morality'],
    description: "agreeableness facet: being frank and genuine rather than manipulative." },
  { name: 'altruism', aliases: ['generosity', 'helpfulness'],
    description: "agreeableness facet: finding satisfaction in helping others." },
  { name: 'cooperation', aliases: ['compliance', 'accommodation'],
    description: "agreeableness facet: avoiding confrontation and willing to compromise." },
  { name: 'modesty', aliases: ['humility'],
    description: "agreeableness facet: not wanting to be the center of attention or seem superior." },
  { name: 'empathy', aliases: ['sympathy', 'compassion', 'tender-mindedness'],
    description: "agreeableness facet: feeling for others and being moved by their suffering." },

  // ---- neuroticism facets ----
  { name: 'anxiousness', aliases: ['worry', 'nervousness'],
    description: "neuroticism facet: a disposition to worry. a diagnosed anxiety disorder is a condition." },
  { name: 'irritability', aliases: ['anger', 'hostility', 'temper'],
    description: "neuroticism facet: being quick to anger and frustration." },
  { name: 'melancholy', aliases: ['depressiveness', 'gloominess'],
    description: "neuroticism facet: a disposition toward sadness and discouragement. clinical depression is a condition." },
  { name: 'self-consciousness', aliases: ['shyness', 'embarrassability'],
    description: "neuroticism facet: sensitivity to what others think; easily embarrassed." },
  { name: 'immoderation', aliases: ['impulsiveness', 'indulgence'],
    description: "neuroticism facet: difficulty resisting cravings and urges." },
  { name: 'vulnerability', aliases: ['stress sensitivity'],
    description: "neuroticism facet: feeling overwhelmed and panicky under pressure. low is steady in a crisis." },

  // ---- common everyday traits ----
  { name: 'patience', aliases: [],
    description: "tolerating delay, difficulty or slowness without frustration." },
  { name: 'resilience', aliases: ['grit', 'toughness'],
    description: "recovering from setbacks and persisting through hardship." },
  { name: 'optimism', aliases: ['hopefulness'],
    description: "expecting good outcomes. low is pessimistic." },
  { name: 'perfectionism', aliases: [],
    description: "holding oneself or one's work to exacting, sometimes unforgiving standards." },
  { name: 'competitiveness', aliases: [],
    description: "wanting to win and measuring oneself against others." },
  { name: 'stubbornness', aliases: ['obstinacy', 'strong-willed'],
    description: "holding to one's position or course despite pressure to change." },
  { name: 'independence', aliases: ['self-reliance', 'autonomy'],
    description: "preferring to decide and do things for oneself." },
  { name: 'boldness', aliases: ['courage', 'daring'],
    description: "acting despite fear or social risk." },
  { name: 'playfulness', aliases: ['sense of humor', 'wit'],
    description: "bringing humor, lightness and fun to situations." },
  { name: 'spontaneity', aliases: ['going with the flow'],
    description: "acting on the moment rather than a plan." },
  { name: 'introspection', aliases: ['reflectiveness', 'self-reflection'],
    description: "habitually examining one's own thoughts, motives and feelings." },
  { name: 'sensory sensitivity', aliases: ['highly sensitive person', 'sensitivity'],
    description: "being strongly affected by noise, light, crowds and subtle cues." },
  { name: 'decisiveness', aliases: [],
    description: "making choices quickly and committing to them. low is indecisive." },
  { name: 'loyalty', aliases: ['faithfulness', 'devotion'],
    description: "sticking by people and commitments over time." }

] AS t
MERGE (n:PersonalityTrait {name: t.name})
ON CREATE SET n.id = randomUUID()
SET n.description = t.description,
    n.aliases     = t.aliases + [x IN coalesce(n.aliases, []) WHERE NOT x IN t.aliases];


// -----------------------------------------------------------------------------
// 3. PhysicalTraits
//    Graded capacities of the body, HAS_TRAIT {level} 0.0–1.0. Anything that is a
//    measured value belongs in Attribute; anything diagnosed belongs in Condition.
// -----------------------------------------------------------------------------

UNWIND [

  // ---- fitness ----
  { name: 'strength', aliases: ['muscular strength', 'physical strength'],
    description: "the maximum force a person's muscles can produce." },
  { name: 'grip strength', aliases: ['hand strength'],
    description: "the force a person can exert with their hands." },
  { name: 'explosive power', aliases: ['power', 'jumping ability'],
    description: "producing force quickly, as in jumping, throwing or sprint starts." },
  { name: 'cardiovascular endurance', aliases: ['stamina', 'aerobic fitness', 'cardio'],
    description: "sustaining whole-body effort like running or swimming over time." },
  { name: 'muscular endurance', aliases: [],
    description: "repeating or holding muscular effort without fatiguing." },
  { name: 'speed', aliases: ['sprint speed', 'quickness'],
    description: "how fast a person can move their body from place to place." },
  { name: 'flexibility', aliases: ['suppleness', 'range of motion'],
    description: "how far a person's joints and muscles can comfortably stretch." },
  { name: 'recovery', aliases: ['recovery speed'],
    description: "how quickly a person bounces back from exertion or minor injury." },

  // ---- movement and control ----
  { name: 'balance', aliases: ['stability', 'equilibrium'],
    description: "keeping the body steady, still or in motion." },
  { name: 'agility', aliases: ['nimbleness'],
    description: "changing direction and position quickly and under control." },
  { name: 'coordination', aliases: ['motor coordination', 'gross motor skills'],
    description: "moving several body parts together smoothly and accurately." },
  { name: 'hand-eye coordination', aliases: [],
    description: "guiding the hands precisely using what the eyes see, as in catching or aiming." },
  { name: 'manual dexterity', aliases: ['fine motor control', 'dexterity'],
    description: "small, precise movements of the hands and fingers." },
  { name: 'steady hands', aliases: ['hand steadiness', 'low tremor'],
    description: "holding the hands still without shaking, as in aiming or surgery." },
  { name: 'reaction time', aliases: ['reflexes'],
    description: "how quickly a person responds physically to a stimulus. high level means fast." },
  { name: 'body awareness', aliases: ['proprioception', 'kinesthetic sense'],
    description: "sensing where one's body and limbs are without looking." },

  // ---- senses ----
  { name: 'visual acuity', aliases: ['eyesight', 'vision'],
    description: "how sharply a person can see. diagnosed impairments are conditions." },
  { name: 'night vision', aliases: ['low-light vision'],
    description: "how well a person sees in dim light." },
  { name: 'hearing acuity', aliases: ['hearing'],
    description: "how faint and fine the sounds a person can hear are." },
  { name: 'sense of smell', aliases: ['olfaction'],
    description: "how keenly a person detects and distinguishes smells." },
  { name: 'sense of taste', aliases: ['palate', 'gustation'],
    description: "how keenly a person detects and distinguishes flavors." },
  { name: 'pitch perception', aliases: ['ear for music', 'relative pitch'],
    description: "distinguishing small differences in pitch." },

  // ---- tolerance and voice ----
  { name: 'pain tolerance', aliases: ['pain threshold'],
    description: "how much pain a person can endure before it limits them." },
  { name: 'cold tolerance', aliases: [],
    description: "how well a person copes with cold temperatures." },
  { name: 'heat tolerance', aliases: [],
    description: "how well a person copes with hot temperatures." },
  { name: 'lung capacity', aliases: ['breath control', 'breath holding'],
    description: "how much air a person can hold and how long they can sustain breath." },
  { name: 'vocal range', aliases: ['singing range'],
    description: "how wide a span of pitches a person's voice can produce." }

] AS t
MERGE (n:PhysicalTrait {name: t.name})
ON CREATE SET n.id = randomUUID()
SET n.description = t.description,
    n.aliases     = t.aliases + [x IN coalesce(n.aliases, []) WHERE NOT x IN t.aliases];
