import { getNeighbors, getSkill, getSkillMap, searchSkills, type Neighbors, type Skill, type SkillRef } from '../skills/api';
import { preloadMap } from '../shared_components/use_map';
import type { Script } from './script';

// What the interludes read from the real Atlas, each kept for as long as the page is open, and read ahead as the story
// opens so each interlude has it by the time it's reached.

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

//starts reading everything the script's interludes show, as the story opens, so each one is there by the time it's
//reached: the skill map, each skill, its levels, and what the graph steps that expand bring on
export function preload(script: Script) {
  preloadMap(getSkillMap);
  for (const section of Object.values(script.sections)) {
    for (const step of section.steps) {
      const stage = 'stage' in step ? step.stage : undefined;
      if (!stage) continue;
      const names = stage.kind === 'skill' ? [stage.skill] : stage.skills;
      for (const name of names) {
        findSkill(name)
          .then((ref) => Promise.all([readSkill(ref.id), stage.kind === 'graph' && stage.expand ? readNeighbors(ref.id) : null]))
          .catch(() => {}); //the step asks again when it's reached, and shows what went wrong then
      }
    }
  }
}
