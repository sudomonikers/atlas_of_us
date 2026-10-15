// =============================================================================
// Atlas of Us — Personality sub-graph seed
// Spec: documentation/data_model/personality/personality.md
//
// One static PersonalityTrait node per trait, carrying only name + description.
// A Person links to every trait with HAS_PERSONALITY_TRAIT {value}, a float
// 0.0–1.0 for how much of that trait they have. Each trait is a single scale,
// so a low value is its opposite (low Gregariousness = prefers solitude) and
// opposites are not separate nodes.
//
// Traits:
//   1. Big Five facets (IPIP-NEO, 6 per domain), under their standard names.
//      The domain lives in the description prefix, e.g.
//      "conscientiousness facet: ...".
//   2. Additional traits that are part of the human experience but not
//      contained in the Big Five.
//
// Idempotent: safe to re-run. MERGE on name, description overwritten from this
// file on every run.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT personalitytrait_name_unique IF NOT EXISTS
FOR (n:PersonalityTrait) REQUIRE n.name IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Big Five facets
// -----------------------------------------------------------------------------

UNWIND [

  // ---- openness ----
  { name: "Imagination",
    description: "openness facet: a rich inner world and a tendency to daydream and invent." },
  { name: "Artistic Interests",
    description: "openness facet: being moved by art, music, beauty and nature." },
  { name: "Emotionality",
    description: "openness facet: noticing, valuing and putting words to one's own emotions." },
  { name: "Adventurousness",
    description: "openness facet: eagerness to try new activities, foods and places. low prefers the familiar." },
  { name: "Intellect",
    description: "openness facet: love of ideas, puzzles and abstract thinking." },
  { name: "Liberalism",
    description: "openness facet: readiness to question authority, tradition and convention. low is traditional." },

  // ---- conscientiousness ----
  { name: "Self-Efficacy",
    description: "conscientiousness facet: belief in one's own ability to get things done." },
  { name: "Orderliness",
    description: "conscientiousness facet: liking structure, plans and neatness." },
  { name: "Dutifulness",
    description: "conscientiousness facet: keeping promises and following rules and obligations." },
  { name: "Achievement-Striving",
    description: "conscientiousness facet: ambition: setting big goals and working hard to get ahead." },
  { name: "Self-Discipline",
    description: "conscientiousness facet: starting and finishing tasks despite boredom or distraction." },
  { name: "Cautiousness",
    description: "conscientiousness facet: thinking things through before acting. low is impulsive." },

  // ---- extraversion ----
  { name: "Friendliness",
    description: "extraversion facet: making friends easily and showing warmth and affection openly." },
  { name: "Gregariousness",
    description: "extraversion facet: preferring company and crowds to being alone." },
  { name: "Assertiveness",
    description: "extraversion facet: speaking up, taking charge and leading groups." },
  { name: "Activity Level",
    description: "extraversion facet: living at a fast, busy, energetic tempo." },
  { name: "Excitement-Seeking",
    description: "extraversion facet: craving stimulation, risk and intensity." },
  { name: "Cheerfulness",
    description: "extraversion facet: readily feeling joy, enthusiasm and fun." },

  // ---- agreeableness ----
  { name: "Trust",
    description: "agreeableness facet: assuming others are honest and well-intentioned. low is suspicious." },
  { name: "Morality",
    description: "agreeableness facet: being frank and genuine rather than manipulative." },
  { name: "Altruism",
    description: "agreeableness facet: finding satisfaction in helping others." },
  { name: "Cooperation",
    description: "agreeableness facet: avoiding confrontation and being willing to compromise." },
  { name: "Modesty",
    description: "agreeableness facet: not wanting to be the center of attention or to seem superior." },
  { name: "Sympathy",
    description: "agreeableness facet: feeling for others and being moved by their suffering." },

  // ---- neuroticism ----
  { name: "Anxiety",
    description: "neuroticism facet: a disposition to worry and feel nervous." },
  { name: "Anger",
    description: "neuroticism facet: being quick to anger and frustration." },
  { name: "Depression",
    description: "neuroticism facet: a disposition toward sadness and discouragement." },
  { name: "Self-Consciousness",
    description: "neuroticism facet: sensitivity to what others think; easily embarrassed." },
  { name: "Immoderation",
    description: "neuroticism facet: difficulty resisting cravings and urges." },
  { name: "Vulnerability",
    description: "neuroticism facet: feeling overwhelmed and panicky under pressure. low is steady in a crisis." }

] AS t
MERGE (n:PersonalityTrait {name: t.name})
SET n.description = t.description;


// -----------------------------------------------------------------------------
// 2. Additional traits
// -----------------------------------------------------------------------------

UNWIND [

  { name: "Patience",
    description: "Tolerating delay, difficulty or slowness without frustration." },
  { name: "Resilience",
    description: "Recovering from setbacks and persisting through hardship." },
  { name: "Optimism",
    description: "Expecting good outcomes. low is pessimistic." },
  { name: "Perfectionism",
    description: "Holding oneself or one's work to exacting, sometimes unforgiving standards." },
  { name: "Competitiveness",
    description: "Wanting to win and measuring oneself against others." },
  { name: "Stubbornness",
    description: "Holding to one's position or course despite pressure and good reasons to change." },
  { name: "Independence",
    description: "Preferring to decide and do things for oneself rather than rely on others." },
  { name: "Boldness",
    description: "Taking social or physical risks despite fear, for something one wants." },
  { name: "Playfulness",
    description: "Bringing humor, lightness and fun to situations." },
  { name: "Sensory Sensitivity",
    description: "Being strongly affected by noise, light, crowds and other sensations." },
  { name: "Decisiveness",
    description: "Making up one's mind quickly and sticking with it, without long deliberation or second-guessing. low is indecisive." },
  { name: "Adaptability",
    description: "Adjusting comfortably to change, new circumstances and the unexpected." },
  { name: "Fairness",
    description: "Refusing to cheat, exploit or take advantage of others, even when it would pay off." }

] AS t
MERGE (n:PersonalityTrait {name: t.name})
SET n.description = t.description;