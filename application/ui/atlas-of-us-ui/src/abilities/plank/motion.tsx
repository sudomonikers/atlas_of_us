import { Clock, Floor } from '../body_marks';
import type { Motion, Pose } from '../motion_kit';

export const plank: Motion = {
  label: 'Someone holding a plank on their forearms while a stopwatch runs',
  period: 10,
  still: 4,
  figure: {
    view: 'side',
    frames: Array.from({ length: 34 }, (_, i): [number, Pose] => [i * 0.3, { x: 261.5, y: 318 + (i % 2) * 1.2, t: 106.1, h: -16, an: [0, 90], af: [0, 90], ln: [-73.9, -73.9], lf: [-73.9, -73.9] }]),
  },
  under: () => <Floor />,
  draw: (time) => <Clock x={480} y={110} seconds={time} />,
};
