import type { FitItem, FitLink, FitTarget, Standing } from '../shared_components/fit_graph';
import type { AbilityRequirement, Skill } from './api';

//the abilities a level takes, its own and carried up from the levels below it, the most important first
export function carriedUp(skill: Skill, rank: number) {
  const carried = new Map<string, AbilityRequirement>();
  for (const level of [...skill.levels].sort((a, b) => a.rank - b.rank)) {
    if (level.rank > rank) break;
    for (const requirement of level.abilities) carried.set(requirement.name, requirement);
  }
  return [...carried.values()].sort((a, b) => b.strength - a.strength);
}

//how someone fits a few skills at one level, by the abilities they take, for a FitGraph. `scores` is where they stand on
//each ability, 0 to 1, and `affectedBy` what they live with that can affect each one, by ability name. An ability shows
//only when there's something to go on: a score, or something that can affect it. Strengths come first, the strongest at
//the top, then the gaps, then what something they live with can reach
export function abilityFit(skills: Skill[], rank: number, scores: Record<string, number>, affectedBy: Record<string, string[]>) {
  const links: FitLink[] = skills.flatMap((skill) =>
    carriedUp(skill, rank).flatMap((requirement): FitLink[] => {
      const theirs = scores[requirement.name];
      const standing: Standing | undefined = affectedBy[requirement.name]?.length
        ? 'affected'
        : theirs === undefined
          ? undefined
          : theirs >= requirement.level
            ? 'ahead'
            : 'short';
      return standing ? [{ item: requirement.name, target: skill.id, standing, strength: requirement.strength }] : [];
    }),
  );
  const order: Standing[] = ['ahead', 'short', 'affected'];
  const worst = (name: string) => Math.max(...links.filter((l) => l.item === name).map((l) => order.indexOf(l.standing)));
  const items: FitItem[] = [...new Set(links.map((l) => l.item))]
    .sort((a, b) => worst(a) - worst(b) || (scores[b] ?? 0) - (scores[a] ?? 0))
    .map((name) => ({ name, value: scores[name], affectedBy: affectedBy[name]?.join(', ') }));
  const targets: FitTarget[] = skills.map((s) => ({ id: s.id, name: s.name }));
  return { items, targets, links };
}
