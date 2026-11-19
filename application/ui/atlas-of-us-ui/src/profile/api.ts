import { request } from '../auth/api';
import type { PersonPersonality } from '../personality/api';
import type { AbilitiesSummary, Ability } from '../abilities/api';
import type { AchievedSkill } from '../skills/api';
import type { EngagedTopic } from '../topics/api';
import type { WriteUpState } from '../shared_components/write_up_panel';

//everything someone shares about themselves, one entry per part of the Atlas they've been mapped on
export interface Profile {
  username: string;
  first_name: string;
  public: boolean;
  overall: OverallSummary | null; //Atlas's summary of the whole person, once they've asked for it
  personality: PersonPersonality;
  abilities: ProfileAbilities;
  topics: EngagedTopic[]; //the topics they've placed themselves on, deepest first
  skills: AchievedSkill[]; //the skills they've placed themselves on, highest level first
  achievements: Achievement[]; //the noteworthy things they did, the most recent first
}

//something noteworthy someone did, such as an award, a certification or a result they can point to, with the skills
//and topics it demonstrates
export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  demonstrates: { id: string; name: string; kind: 'skill' | 'topic' }[]; //skills first, then topics
}

//what a profile shows of someone's abilities: Atlas's summary, where they stand on each, and the conditions and
//impairments that can affect them. Their measurements stay theirs alone
export interface ProfileAbilities {
  summary: AbilitiesSummary | null; //Atlas's summary of everything they've added to Abilities, once they've asked for it
  placed: PlacedAbility[]; //the abilities they have a place on, by area then name
  conditions_and_impairments: ConditionOrImpairment[]; //their conditions, then their impairments
}

//one of someone's conditions or impairments, with the abilities it can affect
export interface ConditionOrImpairment {
  kind: 'condition' | 'impairment';
  name: string;
  how: string | null; //a condition's severity, or an impairment's extent
  diagnosed: boolean | null; //for a condition
  managed: boolean | null; //for a condition
  affects: string[]; //the names of the abilities it can affect
}

//an ability someone has a place on
export interface PlacedAbility {
  id: string;
  name: string;
  category: Ability['category'];
  value: number; //0 to 1, with 0.5 typical
  confidence: number;
}

//someone's profile at /u/{username}. Private ones 404 for everyone but the owner
export const getProfile = (username: string) => request<Profile>('GET', `/profiles/${encodeURIComponent(username)}`);

//the four parts of the Atlas a profile shows, by the key the overall summary writes about each under
export type Part = 'personality' | 'abilities' | 'topics' | 'skills';

//Atlas's summary of the whole person: how everything they've been mapped on fits together
export interface OverallSummary {
  headline: string;
  overview: string; //two paragraphs, a blank line between them
  parts: { key: Part; text: string }[];
  strengths: string[];
  work_on: string[];
  try_next: string[]; //skills or topics that would suit them
}

//the logged in user's overall summary, and where it's at
export const getOverallSummary = () => request<WriteUpState<OverallSummary>>('GET', '/overall/summary');

//asks for the logged in user's overall summary to be written, from everything they've been mapped on so far
export const askForOverallSummary = () => request<WriteUpState<OverallSummary>>('POST', '/overall/summary');

//a thing someone is linked to, on the graph of everything they're linked to
export interface GraphNode {
  id: string;
  label: string;
  kind: 'person' | 'domain' | 'trait' | 'area' | 'ability' | 'condition' | 'impairment' | 'topic' | 'skill';
  value: number | null; //where they stand, 0 to 1, on a trait or ability
  rank: number | null; //their level in a topic or skill
}

//how two things on it link: to what the person has, what a skill takes, or an ability a condition or impairment can affect
export interface GraphLink {
  from: string;
  to: string;
  kind: 'has' | 'takes_trait' | 'takes_ability' | 'takes_topic' | 'takes_skill' | 'affects';
  weight: number | null; //how much a skill's requirement matters, 0 to 1
}

export interface PersonGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

//the graph of everything someone is linked to. Private profiles 404 for everyone but the owner
export const getGraph = (username: string) => request<PersonGraph>('GET', `/profiles/${encodeURIComponent(username)}/graph`);
