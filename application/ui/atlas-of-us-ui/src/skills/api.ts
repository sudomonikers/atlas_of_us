import { request } from '../auth/api';
import { evidenceApi, type Evidence } from '../shared_components/evidence_api';

export type SkillStatus = 'stub' | 'filling' | 'ready' | 'failed';

//a skill's five levels, the Dreyfus model, by rank
export const LEVEL_NAMES = ['Novice', 'Advanced Beginner', 'Competent', 'Proficient', 'Expert'];

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

//a skill on the map of every skill, with the ids of the broader skills it's a kind of
export interface MapSkill extends SkillRef {
  broader: string[];
}

//every skill, for the Skills Explorer's map
export const getSkillMap = () => request<MapSkill[]>('GET', '/skills/map');

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
  topics: TopicLink[]; //every topic its levels need knowledge of, strongest first
}

//a topic a skill's levels need, with how essential the strongest of those links is, 0 to 1, and the deepest Bloom
//level of it any level needs, 1 (Remember) to 6 (Create)
export interface TopicLink {
  id: string;
  name: string;
  status: SkillStatus;
  strength: number;
  rank: number;
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

//where the logged in user is with a skill: the Dreyfus level they've reached (ACHIEVED), if they've placed themselves
//on it, when they got there if they said, and their evidence for it
export interface Achievement {
  rank: number | null; //1 (Novice) to 5 (Expert)
  achieved_on: string | null; //YYYY-MM-DD
  evidence: Evidence[]; //oldest first
}

//a skill someone has placed themselves on, with the level they've reached, when, and their evidence
export interface AchievedSkill {
  skill: SkillRef;
  rank: number;
  achieved_on: string | null; //YYYY-MM-DD
  updated_at: string;
  evidence: Evidence[];
}

const achievementPath = (id: string) => `/skills/${encodeURIComponent(id)}/achievement`;

export const getAchievement = (id: string) => request<Achievement>('GET', achievementPath(id));

//places the logged in user at one of a ready skill's levels, in place of any they were at before, with when they got
//there if they say
export const setAchievement = (id: string, rank: number, achievedOn: string | null) =>
  request<void>('PUT', achievementPath(id), { rank, achieved_on: achievedOn });

//takes the logged in user off a skill, with all their evidence for it
export const removeAchievement = (id: string) => request<void>('DELETE', achievementPath(id));

//adding the logged in user's evidence about a skill, once they've placed themselves on it
export const skillEvidence = (id: string) => evidenceApi(`/skills/${encodeURIComponent(id)}`);

//every skill the logged in user has placed themselves on, highest level first
export const getAchievements = () => request<AchievedSkill[]>('GET', '/skills/achievements');

//when someone reached a level, YYYY-MM-DD, as a month and year, e.g. March 2024
export function monthYear(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
