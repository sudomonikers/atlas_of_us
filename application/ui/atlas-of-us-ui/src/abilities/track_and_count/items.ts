import { seeded } from '../test_kit';
import { TIMED } from '../timed';
import { drift } from '../tracking/items';

export const TRACK_COUNT_PATH = drift(7);

//the beeps of Track and Count: when each starts, in seconds from the start, and whether it's high
function beeps(seed: number, seconds: number) {
  const random = seeded(seed);
  const out: { at: number; high: boolean }[] = [];
  for (let at = 2 + random() * 1.5; at < seconds - 1; at += 1.2 + random() * 1.6) out.push({ at, high: random() < 0.5 });
  return out;
}

export const BEEPS = beeps(2026, TIMED.trackCount.seconds);
