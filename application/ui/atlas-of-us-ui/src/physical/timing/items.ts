import { seeded, shuffled } from '../test_kit';
import { TIMED } from '../timed';

function timings(seed: number, count: number) {
  const random = seeded(seed);
  return shuffled(random, Array.from({ length: count }, (_, i) => ({ seconds: 0.8 + random() * 1.4, hidden: i % 2 === 1 })));
}

export const TIMING_PRACTICE = timings(11, 3);
export const TIMINGS = timings(2026, TIMED.timing.count);
