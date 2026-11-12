import { getNeighbors, getSkill, getSkillMap, searchSkills, type Neighbors, type Skill, type SkillRef } from '../../skills/api';
import { preloadMap } from '../use_map';

// What the stories that open a module read from the real Atlas, each kept for as long as the page is open, and read
// ahead as a story opens so each interlude has it by the time it's reached.

//each fetch kept for as long as the page is open, by what it's for, so a step finds what an earlier one or the
//preload already read. A fetch that fails is forgotten, so the next ask tries again
function kept<T>(cache: Map<string, Promise<T>>, key: string, fetch: () => Promise<T>) {
  if (!cache.has(key)) {
    const fetching = fetch();
    fetching.catch(() => cache.delete(key));
    cache.set(key, fetching);
  }
  return cache.get(key)!;
}

//a skill by name
const found = new Map<string, Promise<SkillRef>>();
export const findSkill = (name: string) =>
  kept(found, name, () =>
    searchSkills(name).then((results) => {
      const skill = results.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!skill) throw new Error(`${name} isn't in the Atlas yet`);
      return { id: skill.id, name: skill.name, status: skill.status };
    }),
  );

//a skill with its levels, by id. One whose levels aren't written yet is read again next time, since it's changing
const withLevels = new Map<string, Promise<Skill>>();
export const readSkill = (id: string) => {
  const reading = kept(withLevels, id, () => getSkill(id));
  reading.then((s) => s.status !== 'ready' && withLevels.delete(id), () => {});
  return reading;
};

//what a skill links to, by id
const linksOf = new Map<string, Promise<Neighbors>>();
export const readNeighbors = (id: string) => kept(linksOf, id, () => getNeighbors(id));

//a skill a story shows, and whether a step brings on what it links to
export interface Shown {
  name: string;
  expand: boolean;
}

//starts reading everything a story's interludes show, as it opens: the skill map, each skill, its levels, and what
//the steps that expand bring on
export function preloadSkills(shown: Shown[]) {
  preloadMap(getSkillMap);
  for (const { name, expand } of shown) {
    findSkill(name)
      .then((ref) => Promise.all([readSkill(ref.id), expand ? readNeighbors(ref.id) : null]))
      .catch(() => {}); //the step asks again when it's reached, and shows what went wrong then
  }
}

//the ways the skill graph links a skill: to the physical abilities and personality traits it takes, the knowledge it
//needs, the skills it needs, the skills it's a kind of, and the skills like it
export type LinkType = 'able' | 'takes' | 'knows' | 'needs' | 'kind_of' | 'similar';

//names run together as people say them: "a, b and c"
export const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
