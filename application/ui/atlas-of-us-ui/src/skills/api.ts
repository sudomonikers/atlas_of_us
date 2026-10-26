import { request } from '../auth/api';

export type SkillStatus = 'stub' | 'filling' | 'ready' | 'failed';

export interface SkillRef {
  id: string;
  name: string;
}

//a skill as search and the gates show it, with the broader skill it's a specialization of
export interface SkillSummary {
  id: string;
  name: string;
  description: string | null;
  status: SkillStatus;
  parent: SkillRef | null;
}

//one of a skill's five Dreyfus levels. A stub's levels only have a rank and a name
export interface Level {
  rank: number; //1 (Novice) to 5 (Expert)
  name: string;
  description: string | null;
  observable_signs: string[] | null;
  example_evidence: string[] | null;
  version: number | null;
  trust: 'provisional' | 'established' | null;
  next_level: string | null; //what it takes to reach the next level. Missing on Expert and on a stub's levels
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  status: SkillStatus;
  parent: SkillRef | null;
  specializations: SkillRef[];
  levels: Level[]; //Novice to Expert
}

//what came of asking for a skill we don't have
export type AskOutcome =
  | { outcome: 'not_a_skill'; kind: 'personality' | 'topic' | 'physical_attribute' | 'other'; name: string } //it belongs to another module
  | { outcome: 'rejected'; reason: string } //nonsense, or a slur
  | { outcome: 'existing'; skill: SkillSummary } //a skill we already have
  | { outcome: 'created'; skill: SkillSummary }; //a new stub, ready to be opened

//the closest skills to what was typed, each with its broader skill
export const searchSkills = (q: string) => request<SkillSummary[]>('GET', `/skills/search?q=${encodeURIComponent(q)}`);

//runs the gates and the resolver on what the user typed
export const askForSkill = (query: string) => request<AskOutcome>('POST', '/skills', { query });

export const getSkill = (id: string) => request<Skill>('GET', `/skills/${encodeURIComponent(id)}`);

//asks for a stub or failed skill to be filled. Anything else is left as it is, so it's safe to call on every open, then
//poll getSkill until it's ready
export const requestFill = (id: string) => request<{ status: SkillStatus }>('POST', `/skills/${encodeURIComponent(id)}/fill`);
