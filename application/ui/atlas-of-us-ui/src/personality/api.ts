import { request } from '../auth/api';

export interface ScenarioQuestion {
  id: string;
  key: string; //the prompt id in the scenario's script
  prompt: string;
}

export interface SavedAnswer {
  scenario: string; //scenario name, e.g. 'landfall'
  question_id: string;
  question_key: string;
  answer: string;
  reasoning?: string;
  answered_date: string;
}

//the longest answer or reasoning the api keeps, in characters
export const MAX_ANSWER_LENGTH = 2000;

//where a scenario's clock stood when an answer was given
export interface AnswerClock {
  seconds: number; //how long the clock runs in total
  left: number; //whole seconds left when answered, or when the clock stopped if it already had
  ran_out: boolean; //the clock hit zero before the user finished
}

//replaces any earlier answer to the same question. The last answer of a scenario also starts rescoring the user's
//traits in the background, and scored says it did. facets are the traits the question was written to draw out, so the
//scorer knows what the person had a chance to show
export const saveAnswer = (question_id: string, answer: string, reasoning: string | undefined, context: string, facets: string[], clock?: AnswerClock) =>
  request<SavedAnswer & { scored: boolean }>('PUT', '/personality/answers', { question_id, answer, reasoning, context, facets, clock });

//whether the user's traits are still being rescored. No new scenario starts until it's done
export const getScoring = () => request<{ running: boolean }>('GET', '/personality/scoring');

export interface Progress {
  answers: SavedAnswer[]; //every question the logged in user has answered
  questions: Record<string, ScenarioQuestion[]>; //every scenario's questions in the order they're asked, keyed by scenario name
}

//the user's answers, and every scenario's questions to tell in progress from complete
export const getProgress = () => request<Progress>('GET', '/personality/progress');

export interface TraitInfo {
  id: string;
  name: string;
  description: string | null;
  domain: string; //a DOMAINS key
  average: number | null; //everyone's mean value, 0 to 1. Null until someone has been measured on it
}

export interface TraitScore extends Omit<TraitInfo, 'average'> {
  value: number; //how strongly the person has the trait, 0 to 1
  confidence: number; //how much evidence the value is based on, 0 to 1
}

//every trait we measure
export const getTraits = () => request<TraitInfo[]>('GET', '/personality/traits');

export interface Shift {
  trait: string; //the trait's name
  evidence: string; //the llm's reason
  level: number; //where the answer puts them, -1 (the low end) to 1 (the high end), 0 is typical
  weight: number; //how strongly the answer shows it, 0 to 1
}

export interface AnswerEvidence {
  scenario: string; //the scenario's title
  question: string;
  answer: string;
  reasoning: string | null;
  shifts: Shift[];
}

//every scored answer and how it moved the person's traits. Only the logged in user's own are allowed
export const getPersonEvidence = (personId: string) =>
  request<AnswerEvidence[]>('GET', `/personality/people/${encodeURIComponent(personId)}/evidence`);

//where being high or low on a domain or trait helps, and what to watch out for at each end. Lists can be missing
export interface Breakdown {
  overview: string | null;
  high_good: string[] | null;
  low_good: string[] | null;
  high_watch: string[] | null;
  low_watch: string[] | null;
}

export interface ExploreTrait extends Breakdown {
  id: string;
  name: string;
  description: string | null;
  interactions: { name: string; description: string }[]; //name is the other trait's
}

export interface ExploreDomain extends Breakdown {
  key: string;
  name: string;
  traits: ExploreTrait[];
}

export interface Explore {
  model: { name: string; overview: string | null; history: string | null; limits: string | null; our_take: string | null };
  domains: ExploreDomain[];
}

//the Big Five, its domains and every trait, for the Explore tab
export const getExplore = () => request<Explore>('GET', '/personality/explore');

/* ---------------------------------------------------------------------------------------------
 * the My Personality view's traits
 * ------------------------------------------------------------------------------------------- */

export interface Trait {
  id: string;
  name: string;
  domain: string; //a DOMAINS key
  description?: string;
  value?: number; //0 to 1, missing until we've learned enough to measure it
  confidence?: number; //0 to 1, how much evidence the value is based on
  average?: number; //everyone's mean value, 0 to 1
  contributions: Contribution[]; //the answers that moved the value, biggest first
}

export interface Contribution {
  scenario: string;
  question: string;
  answer: string;
  reasoning?: string;
  level: number; //where the answer puts them, -1 (the low end) to 1 (the high end), 0 is typical
  weight: number; //how strongly the answer shows it, 0 to 1
  evidence: string; //the llm's reason
}

//the Big Five domains, then everything else. Keys match the api's PersonalityDomain keys
export const DOMAINS = [
  { key: 'openness', title: 'Openness', blurb: 'How you take in ideas, art, feelings and new experiences.' },
  { key: 'conscientiousness', title: 'Conscientiousness', blurb: 'How you organize yourself and follow through.' },
  { key: 'extraversion', title: 'Extraversion', blurb: 'Where you get your energy, and how much of it you show.' },
  { key: 'agreeableness', title: 'Agreeableness', blurb: 'How you treat other people and handle conflict.' },
  { key: 'neuroticism', title: 'Neuroticism', blurb: 'How strongly you react to stress and bad feelings.' },
  { key: 'other', title: 'Beyond the Big Five', blurb: 'Parts of being human the Big Five leave out.' },
];

export interface Profile {
  username: string;
  first_name: string;
  public: boolean;
  traits: TraitScore[]; //only the measured ones
}

//someone's profile at /u/{username}: their trait scores, never their answers. Private ones 404 for everyone but the owner
export const getProfile = (username: string) => request<Profile>('GET', `/personality/profiles/${encodeURIComponent(username)}`);

//every trait, with the user's value where one has been measured and the answers behind it
export async function fetchTraits(personId: string, username: string): Promise<Trait[]> {
  const [all, mine, evidence] = await Promise.all([getTraits(), getProfile(username), getPersonEvidence(personId)]);
  const scores = new Map(mine.traits.map((t) => [t.id, t]));
  const contributions = evidence.flatMap(({ shifts, reasoning, ...answer }) =>
    shifts.map((s) => ({ ...answer, reasoning: reasoning ?? undefined, trait: s.trait, level: s.level, weight: s.weight, evidence: s.evidence })),
  );
  return all.map((t) => {
    const facet = /^(\w+) facet: (.*)$/s.exec(t.description ?? '');
    const description = facet ? facet[2] : t.description ?? undefined;
    return {
      id: t.id,
      name: t.name,
      domain: t.domain,
      description: description && description[0].toUpperCase() + description.slice(1),
      value: scores.get(t.id)?.value,
      confidence: scores.get(t.id)?.confidence,
      average: t.average ?? undefined,
      contributions: contributions.filter((c) => c.trait === t.name).sort((a, b) => b.weight - a.weight),
    };
  });
}
