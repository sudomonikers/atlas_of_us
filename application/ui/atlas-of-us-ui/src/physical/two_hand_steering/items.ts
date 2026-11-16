import { seeded } from '../test_kit';

function targets(seed: number, count: number): [number, number][] {
  const random = seeded(seed);
  const out: [number, number][] = [[0.5, 0.5]];
  while (out.length <= count) {
    const t: [number, number] = [0.1 + random() * 0.8, 0.1 + random() * 0.8];
    const [x, y] = out[out.length - 1];
    if (Math.hypot(t[0] - x, t[1] - y) > 0.3) out.push(t);
  }
  return out.slice(1);
}

export const STEERING_TARGETS = targets(2026, 120);
