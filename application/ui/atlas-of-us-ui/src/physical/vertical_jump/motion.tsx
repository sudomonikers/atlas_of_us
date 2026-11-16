import { BLUE, line, RED } from '../../shared_components/story/ink';
import { Floor, Wall } from '../body_marks';
import { GY, type Motion, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

export const jump: Motion = {
  label: 'Someone beside a wall reaching up to mark it, then jumping and marking it again higher up',
  period: 3.4,
  still: 1.15,
  figure: {
    view: 'front',
    frames: [
      [0, { ...STAND, an: [160, 160], ln: { to: [314, GY], bend: -1 }, lf: { to: [286, GY], bend: 1 } }],
      [0.7, { ...STAND, an: [160, 160], ln: { to: [314, GY], bend: -1 }, lf: { to: [286, GY], bend: 1 } }],
      [1.1, { ...STAND, y: 272, an: [22, 12], af: [-22, -12], ln: { to: [314, GY], bend: -1 }, lf: { to: [286, GY], bend: 1 } }],
      [1.45, { ...STAND, y: 194, an: [160, 160], af: [-20, -10], ln: { to: [314, GY - 40], bend: -1 }, lf: { to: [286, GY - 40], bend: 1 } }],
      [1.8, { ...STAND, y: 266, an: [22, 12], af: [-22, -12], ln: { to: [314, GY], bend: -1 }, lf: { to: [286, GY], bend: 1 } }],
      [2.4, { ...STAND, ln: { to: [314, GY], bend: -1 }, lf: { to: [286, GY], bend: 1 } }],
    ],
  },
  under: () => <><Floor /><Wall x={372} side={1} /></>,
  draw: (time) => (
    <g>
      {time > 0.3 && <Ink d={line([350, 62], [372, 62])} c={BLUE} w={6} />}
      {time > 1.45 && <Ink d={line([350, 22], [372, 22])} c={RED} w={6} />}
      {time > 1.45 && <Say x={440} y={50} text="how high" size={30} c={RED} />}
      {time > 1.45 && <Ink d={line([392, 24], [392, 60])} c={RED} w={3} />}
    </g>
  ),
};
