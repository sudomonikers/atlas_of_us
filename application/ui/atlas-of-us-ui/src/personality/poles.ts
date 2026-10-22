import type { PersonalityTrait } from './personality';

//a word or two for each end of a scale, so a trait can be read at a glance without its description. Neither end is
//meant to sound better than the other
export interface Poles {
  low: string;
  high: string;
}

//keyed by DOMAINS key. The letter is the domain's place in OCEAN, the usual acronym for the Big Five, and stands in
//for it where there's no room for the name
export const DOMAIN_LOOK: Record<string, Poles & { letter: string }> = {
  openness: { letter: 'O', low: 'Practical', high: 'Curious' },
  conscientiousness: { letter: 'C', low: 'Easygoing', high: 'Driven' },
  extraversion: { letter: 'E', low: 'Reserved', high: 'Outgoing' },
  agreeableness: { letter: 'A', low: 'Tough-minded', high: 'Accommodating' },
  neuroticism: { letter: 'N', low: 'Calm', high: 'Sensitive' },
};

//the six facets of each domain, keyed by DOMAINS key
export const DOMAIN_TRAITS: Record<string, PersonalityTrait[]> = {
  openness: ['Imagination', 'Artistic Interests', 'Emotionality', 'Adventurousness', 'Intellect', 'Liberalism'],
  conscientiousness: ['Self-Efficacy', 'Orderliness', 'Dutifulness', 'Achievement-Striving', 'Self-Discipline', 'Cautiousness'],
  extraversion: ['Friendliness', 'Gregariousness', 'Assertiveness', 'Activity Level', 'Excitement-Seeking', 'Cheerfulness'],
  agreeableness: ['Trust', 'Morality', 'Altruism', 'Cooperation', 'Modesty', 'Sympathy'],
  neuroticism: ['Anxiety', 'Anger', 'Depression', 'Self-Consciousness', 'Immoderation', 'Vulnerability'],
};

export const POLES: Record<PersonalityTrait, Poles> = {
  Imagination: { low: 'Grounded', high: 'Dreamy' },
  'Artistic Interests': { low: 'Plain tastes', high: 'Art lover' },
  Emotionality: { low: 'Detached', high: 'In touch' },
  Adventurousness: { low: 'Homebody', high: 'Explorer' },
  Intellect: { low: 'Hands-on', high: 'Cerebral' },
  Liberalism: { low: 'Traditional', high: 'Questioning' },
  'Self-Efficacy': { low: 'Doubtful', high: 'Confident' },
  Orderliness: { low: 'Flexible', high: 'Tidy' },
  Dutifulness: { low: 'Rule bender', high: 'Rule keeper' },
  'Achievement-Striving': { low: 'Content', high: 'Ambitious' },
  'Self-Discipline': { low: 'Distractible', high: 'Persistent' },
  Cautiousness: { low: 'Impulsive', high: 'Careful' },
  Friendliness: { low: 'Reserved', high: 'Warm' },
  Gregariousness: { low: 'Solitary', high: 'Sociable' },
  Assertiveness: { low: 'Quiet', high: 'Takes charge' },
  'Activity Level': { low: 'Unhurried', high: 'Busy' },
  'Excitement-Seeking': { low: 'Low-key', high: 'Thrill seeker' },
  Cheerfulness: { low: 'Serious', high: 'Sunny' },
  Trust: { low: 'Wary', high: 'Trusting' },
  Morality: { low: 'Tactical', high: 'Candid' },
  Altruism: { low: 'Self-focused', high: 'Giving' },
  Cooperation: { low: 'Combative', high: 'Yielding' },
  Modesty: { low: 'Self-assured', high: 'Humble' },
  Sympathy: { low: 'Tough-minded', high: 'Tender' },
  Anxiety: { low: 'Relaxed', high: 'Worried' },
  Anger: { low: 'Even-tempered', high: 'Hot-headed' },
  Depression: { low: 'Buoyant', high: 'Gloomy' },
  'Self-Consciousness': { low: 'Unflappable', high: 'Self-conscious' },
  Immoderation: { low: 'Restrained', high: 'Indulgent' },
  Vulnerability: { low: 'Composed', high: 'Overwhelmed' },
};

//trait names come from the database as plain strings
export const polesOf = (trait: string): Poles | undefined => POLES[trait as PersonalityTrait];

export const domainOf = (trait: string) => Object.keys(DOMAIN_TRAITS).find((key) => DOMAIN_TRAITS[key].includes(trait as PersonalityTrait));
