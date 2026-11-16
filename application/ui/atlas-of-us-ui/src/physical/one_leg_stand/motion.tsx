import { Clock, Floor } from '../body_marks';
import { type Motion, type Pose, STAND } from '../motion_kit';

export const oneLeg: Motion = {
  label: 'Someone balancing on one leg with their arms crossed and their eyes closed',
  period: 8,
  still: 2,
  figure: {
    view: 'front',
    eyes: 'closed',
    frames: [0, 1, 2, 3].map((i): [number, Pose] => [
      i * 2,
      {
        ...STAND,
        x: 300 + [0, 3, -1, -3][i],
        t: 180 + [0, -2, 1, 2][i],
        an: { to: [282, 176], bend: -1 },
        af: { to: [318, 172], bend: 1 },
        ln: [2 + [0, -1, 0, 1][i], 0],
        lf: { to: [302, 326], bend: 1 },
      },
    ]),
  },
  under: () => <Floor />,
  draw: (time) => <Clock x={480} y={110} seconds={time} />,
};
