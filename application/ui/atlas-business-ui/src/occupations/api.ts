import { request } from '../api';

//GET /api/occupations/..., see application/apis/atlas-api/src/domains/occupations

export interface OccupationRef {
  id: string;
  title: string;
  description: string;
}

//an occupation in the closest list. closeness and coverage are 0 to 1
export interface Close extends OccupationRef {
  closeness: number;
  coverage: number; //the share of what the work takes that's measured for them
  met: number; //requirements they meet
  requirements: number;
}

export interface Closest {
  topics: number; //topics they've placed themselves on
  skills: number;
  abilities: boolean; //whether any ability has been measured
  personality: boolean;
  occupations: Close[];
}

//a topic (Bloom levels 1 to 6) or skill (Dreyfus levels 1 to 5) the work takes, to `rank`, with their own level
export interface LevelRequirement {
  id: string;
  name: string;
  status: string;
  rank: number;
  importance: number;
  yours: number | null;
  score: number | null; //null until they're on any topic, or any skill
}

//an ability the work takes, at `level` from 0 to 1, with where they stand on it from 0 to 1
export interface AbilityRequirement {
  id: string;
  name: string;
  level: number;
  importance: number;
  yours: number | null;
  score: number | null;
}

//a trait that matters to the work, pulled toward `target` (toward its low end when `opposite`), with their score on it
export interface TraitRequirement {
  name: string;
  importance: number;
  opposite: boolean;
  target: number;
  yours: number | null;
  score: number | null;
}

//a physical demand of the work, and how often it has people in it, 0 (never) to 1 (continually, or every day). For
//the logged in user, `noted` is the impairments and conditions they've noted that it strains, when it's often
export interface Demand {
  name: string;
  group: 'position' | 'environment' | 'hazard';
  frequency: number;
  noted: string[];
}

//the parts of what an occupation takes, which the Atlas works out for an occupation someone added
export type Part = 'abilities' | 'knowledge' | 'skills' | 'personality';

export interface Occupation {
  id: string;
  onet_soc: string | null; //null for an occupation someone added
  status: 'filling' | 'ready' | 'failed';
  pending: Part[]; //the parts still being worked out
  failed: Part[]; //the parts that couldn't be
  title: string;
  description: string;
  alternate_titles: string[];
  knowledge: LevelRequirement[];
  skills: LevelRequirement[];
  abilities: AbilityRequirement[];
  traits: TraitRequirement[];
  demands: Demand[];
  closeness: number | null; //null when no one is logged in
  coverage: number | null;
}

export const searchOccupations = (q: string) => request<OccupationRef[]>('GET', `/occupations/search?q=${encodeURIComponent(q)}`);
export const getClosest = () => request<Closest>('GET', '/occupations/closest');
//what came of asking for an occupation we don't have (POST /api/occupations)
export type AskOutcome =
  | { outcome: 'created' | 'existing'; occupation: OccupationRef }
  | { outcome: 'not_an_occupation'; kind: string; name: string }
  | { outcome: 'rejected'; reason: string };

export const askForOccupation = (query: string) => request<AskOutcome>('POST', '/occupations', { query });
export const getOccupation = (id: string) => request<Occupation>('GET', `/occupations/${encodeURIComponent(id)}`);

export const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
export const DREYFUS_LEVELS = ['Novice', 'Advanced Beginner', 'Competent', 'Proficient', 'Expert'];

//O*NET's answers for how often, by the nearest of its five points: time in a position, or how often for the rest
const TIME = ['Never', 'Less than half the time', 'About half the time', 'More than half the time', 'Almost all the time'];
const OFTEN = ['Never', 'Once a year or more', 'Once a month or more', 'Once a week or more', 'Every day'];
export const howOften = (d: Demand) => (d.group === 'position' ? TIME : OFTEN)[Math.round(d.frequency * 4)];

export const percent = (n: number) => `${Math.round(n * 100)}%`;
