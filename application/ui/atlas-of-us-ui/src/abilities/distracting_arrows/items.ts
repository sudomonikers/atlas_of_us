import { seeded, shuffled } from '../test_kit';
import { TIMED } from '../timed';

export interface Arrows {
  left: boolean; //which way the middle one points
  same: boolean; //whether the ones around it point the same way
}

function arrows(seed: number, count: number): Arrows[] {
  const random = seeded(seed);
  return shuffled(random, Array.from({ length: count }, (_, i) => ({ left: i % 2 === 0, same: i % 4 < 2 })));
}

export const ARROWS_PRACTICE = arrows(11, 8);
export const ARROWS = arrows(2026, TIMED.flanker.count);
