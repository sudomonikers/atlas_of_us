import { seeded } from '../test_kit';

//the seconds before the time on target counts, to settle in
export const LEAD = 3;

export function drift(seed: number) {
  const random = seeded(seed);
  const waves = Array.from({ length: 6 }, () => ({ speed: 0.25 + random() * 0.9, phase: random() * Math.PI * 2 }));
  return (seconds: number): [number, number] => [
    0.5 + 0.28 * Math.sin(waves[0].speed * seconds + waves[0].phase) + 0.1 * Math.sin(waves[1].speed * 2.3 * seconds + waves[1].phase) + 0.05 * Math.sin(waves[2].speed * 3.7 * seconds + waves[2].phase),
    0.5 + 0.28 * Math.sin(waves[3].speed * seconds + waves[3].phase) + 0.1 * Math.sin(waves[4].speed * 2.9 * seconds + waves[4].phase) + 0.05 * Math.sin(waves[5].speed * 4.1 * seconds + waves[5].phase),
  ];
}

export const TRACKING_PATH = drift(2026);
