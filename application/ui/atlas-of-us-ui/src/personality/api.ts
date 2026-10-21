import { request } from '../auth/api';
import { getProfile } from '../profile/api';

export interface ScenarioQuestion {
  id: string;
  key: string; //the prompt id in the scenario's script
  prompt: string;
}

export interface SavedAnswer {
  scenario: string; //scenario name, e.g. 'the_feud'
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
  answers: number; //how many answers show the trait. Under 3 is an early read
}

//every trait we measure
export const getTraits = () => request<TraitInfo[]>('GET', '/personality/traits');

export interface Shift {
  trait: string; //the trait's name
  evidence: string; //the llm's reason
  level: number; //where the answer puts them, 0 (the low end) to 1 (the high end), 0.5 is typical
  weight: number; //how strongly the answer shows it, 0 to 1
}

//the person contesting one piece of evidence: explaining their answer, or saying the scorer got it wrong
export interface Contest {
  trait: string;
  kind: 'explain' | 'wrong';
  message: string;
  at: string; //when they sent it
  status: 'pending' | 'accepted' | 'rejected';
  reply?: string; //the reviewer's answer
  before?: Shift; //the evidence before an accepted contest changed it
  after?: Shift;
  removed?: boolean; //the reviewer found the answer doesn't show the trait, so the evidence no longer counts
}

export interface AnswerEvidence {
  id: string; //the answer's id
  scenario: string; //the scenario's title
  question: string;
  answer: string;
  reasoning: string | null;
  shifts: Shift[];
  contests: Contest[]; //oldest first
}

//every scored answer and how it moved the person's traits. Only the logged in user's own are allowed
export const getPersonEvidence = (personId: string) =>
  request<AnswerEvidence[]>('GET', `/personality/people/${encodeURIComponent(personId)}/evidence`);

//how many times the api lets one piece of evidence be contested
export const MAX_CONTESTS_PER_EVIDENCE = 3;

//contests one piece of evidence. It's reviewed in the background, and its outcome shows up in the evidence
export const contestEvidence = (answer_id: string, trait: string, kind: Contest['kind'], message: string) =>
  request<void>('POST', '/personality/contests', { answer_id, trait, kind, message });

//where being high or low on a domain or trait helps, and what to watch out for at each end
export interface Breakdown {
  overview: string | null;
  high_good: string[];
  low_good: string[];
  high_watch: string[];
  low_watch: string[];
}

export interface DomainTrait extends Breakdown {
  id: string;
  name: string;
  description: string | null;
  interactions: { name: string; description: string }[]; //name is the other trait's
}

export interface Domain extends Breakdown {
  key: string;
  name: string;
  traits: DomainTrait[];
}

export interface PersonalityModel {
  name: string | null;
  overview: string | null;
  history: string | null;
  limits: string | null;
  our_take: string | null;
  domains: Domain[];
}

//the personality model, its domains and every trait
export const getModel = () => request<PersonalityModel>('GET', '/personality/model');

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
  answer_id: string;
  trait: string;
  scenario: string;
  question: string;
  answer: string;
  reasoning?: string;
  level: number; //where the answer puts them, 0 (the low end) to 1 (the high end), 0.5 is typical
  weight: number; //how strongly the answer shows it, 0 to 1
  evidence: string; //the llm's reason
  contests: Contest[]; //the person's contests of this evidence, oldest first
  dropped?: boolean; //a rescore since the contests found nothing for the trait in this answer, so only they are left
}

//the Big Five domains. Keys match the api's PersonalityDomain keys
export const DOMAINS = [
  { key: 'openness', title: 'Openness', blurb: 'How you take in ideas, art, feelings and new experiences.' },
  { key: 'conscientiousness', title: 'Conscientiousness', blurb: 'How you organize yourself and follow through.' },
  { key: 'extraversion', title: 'Extraversion', blurb: 'Where you get your energy, and how much of it you show.' },
  { key: 'agreeableness', title: 'Agreeableness', blurb: 'How you treat other people and handle conflict.' },
  { key: 'neuroticism', title: 'Neuroticism', blurb: 'How strongly you react to stress and bad feelings.' },
];

//the written report on all of someone's traits, once they've finished every scenario
export interface Report {
  headline: string;
  overview: string; //paragraphs separated by blank lines
  domains: { key: string; text: string }[]; //key is a DOMAINS key
  strengths: string[];
  watch_outs: string[];
}

//someone's measured traits and report, as their profile shows them
export interface PersonPersonality {
  traits: TraitScore[]; //only the measured ones
  report: Report | null;
  report_at: string | null; //when the report was last written
}

//every trait, with the user's value where one has been measured and the answers behind it, and their report
export async function fetchTraits(personId: string, username: string): Promise<{ traits: Trait[] } & Omit<PersonPersonality, 'traits'>> {
  const [all, { personality: mine }, evidence] = await Promise.all([getTraits(), getProfile(username), getPersonEvidence(personId)]);
  const scores = new Map(mine.traits.map((t) => [t.id, t]));
  const contributions = evidence.flatMap(({ id, shifts, contests, reasoning, ...answer }) => {
    const base = { ...answer, answer_id: id, reasoning: reasoning ?? undefined };
    const contested = (trait: string) => contests.filter((c) => c.trait === trait);
    //a contest's trait can go missing from the answer when it's rescored, and its history still shows
    const dropped = [...new Set(contests.map((c) => c.trait))].filter((trait) => !shifts.some((s) => s.trait === trait));
    return [
      ...shifts.map((s) => ({ ...base, ...s, contests: contested(s.trait) })),
      ...dropped.map((trait) => ({
        ...base,
        trait,
        level: 0.5,
        weight: 0,
        evidence: 'Since your contest, this answer no longer counts toward this trait.',
        contests: contested(trait),
        dropped: true,
      })),
    ];
  });
  const traits = all.map((t) => {
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
  return { traits, report: mine.report, report_at: mine.report_at };
}
