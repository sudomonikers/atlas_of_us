import { request } from '../auth/api';

export type SkillStatus = 'stub' | 'filling' | 'ready' | 'failed';

export interface SkillRef {
  id: string;
  name: string;
  status: SkillStatus;
}

//a skill as search and the gates show it, with the broader skills it's a kind of
export interface SkillSummary {
  id: string;
  name: string;
  description: string | null;
  status: SkillStatus;
  broader: SkillRef[];
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
  traits: TraitRequirement[]; //the personality it takes, written on this level itself. Lower levels' carry up to it
  skills: SkillRequirement[]; //the other skills it needs, written on this level itself. Lower levels' carry up to it
  topics: TopicRequirement[]; //the levels of topics it needs knowledge of, written on this level itself. Lower levels' carry up to it
}

//a personality trait a level takes. `level` is where on the trait it pulls, above 0.5 for more of it and below for less
export interface TraitRequirement {
  name: string;
  level: number;
  strength: number; //how much it matters, 0 to 1
  reason: string;
}

//a level of another skill a level needs
export interface SkillRequirement extends SkillRef {
  rank: number; //the level of it that's needed
  strength: number; //how essential it is, 0 to 1
  reason: string;
}

//a level of a topic a level needs knowledge of
export interface TopicRequirement {
  id: string;
  name: string;
  status: SkillStatus; //topics go stub, filling, ready or failed, the same as skills
  rank: number; //the Bloom level of it that's needed, 1 (Remember) to 6 (Create)
  strength: number; //how essential it is, 0 to 1
  reason: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  aliases: string[];
  status: SkillStatus;
  levels: Level[]; //Novice to Expert
}

//what came of asking for a skill we don't have
export type AskOutcome =
  | { outcome: 'not_a_skill'; kind: 'personality' | 'topic' | 'physical_attribute' | 'other'; name: string } //it belongs to another module
  | { outcome: 'rejected'; reason: string } //nonsense, or a slur
  | { outcome: 'existing'; skill: SkillSummary } //a skill we already have
  | { outcome: 'created'; skill: SkillSummary }; //a new stub, ready to be opened

//the closest skills to what was typed, each with its broader skills
export const searchSkills = (q: string) => request<SkillSummary[]>('GET', `/skills/search?q=${encodeURIComponent(q)}`);

//runs the gates and the resolver on what the user typed
export const askForSkill = (query: string) => request<AskOutcome>('POST', '/skills', { query });

export const getSkill = (id: string) => request<Skill>('GET', `/skills/${encodeURIComponent(id)}`);

//asks for a stub or failed skill to be filled. Anything else is left as it is, so it's safe to call on every open, then
//poll getSkill until it's ready
export const requestFill = (id: string) => request<{ status: SkillStatus }>('POST', `/skills/${encodeURIComponent(id)}/fill`);

//a skill linked to another. A prerequisite carries how essential the strongest link between their levels is, 0 to 1
export interface Neighbor extends SkillRef {
  strength?: number;
}

//a page of the skills linked to a skill one way, and how many are linked that way in all
export interface Group {
  skills: Neighbor[];
  total: number;
}

//the ways skills link, and the ones that come a page at a time
export type GroupName = 'broader' | 'narrower' | 'needs' | 'leads_to' | 'similar';
export type PagedGroup = Exclude<GroupName, 'similar'>;

export interface Neighbors {
  skill: SkillRef & { description: string | null };
  broader: Group; //the skills it's a kind of
  narrower: Group; //the skills that are kinds of it
  needs: Group; //skills its levels require
  leads_to: Group; //skills whose levels require its levels
  similar: Group; //the closest skills by meaning, other than its broader and narrower ones
  traits: TraitLink[]; //every personality trait its levels take, strongest first
}

//a personality trait a skill's levels take, with how much the strongest of them matters, 0 to 1
export interface TraitLink {
  id: string;
  name: string;
  strength: number;
}

//the skills around a skill: the first page of each way it links, and the skill itself without its levels
export const getNeighbors = (id: string) => request<Neighbors>('GET', `/skills/${encodeURIComponent(id)}/neighbors`);

//the next page of one way a skill links, from `skip`
export const getNeighborPage = (id: string, group: PagedGroup, skip: number) =>
  request<Group>('GET', `/skills/${encodeURIComponent(id)}/neighbors/${group}?skip=${skip}`);

//a personality trait and a page of the skills whose levels take it, strongest first, with how many take it in all
export interface TraitSkills {
  trait: { id: string; name: string; description: string | null; domain: string | null };
  skills: Neighbor[];
  total: number;
}

//the skills that take a trait, from `skip`. The route belongs to the Personality module
export const getTraitSkills = (id: string, skip = 0) =>
  request<TraitSkills>('GET', `/personality/traits/${encodeURIComponent(id)}/skills?skip=${skip}`);
