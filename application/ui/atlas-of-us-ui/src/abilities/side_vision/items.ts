import { seeded, shuffled } from '../test_kit';

export const SIDE_ANGLES = [10, 20, 25, 30];
function flashes(seed: number) {
  const random = seeded(seed);
  const all = SIDE_ANGLES.flatMap((a) => [a, a, a, -a, -a, -a]);
  return shuffled(random, [...all, null, null, null, null] as (number | null)[]);
}

export const SIDE_PRACTICE: (number | null)[] = [20, -20, null, -10];
export const SIDE_FLASHES = flashes(2026);
