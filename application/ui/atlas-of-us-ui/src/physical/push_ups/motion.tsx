import { BLUE, circle, RED } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion, type Pose, steps } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';

export const pushUp: Motion = {
  label: 'Someone doing push-ups, lowering their chest to a rolled towel',
  period: 4.2,
  still: 0,
  figure: {
    view: 'side',
    frames: steps(0.7, [0, 1, 0, 1, 0, 1].map((down) => (down
      ? { x: 265, y: 337, t: 96.6, h: -14, an: { to: [330, GY], bend: 1 }, af: { to: [336, GY], bend: 1 }, ln: [-83.4, -83.4], lf: [-83.4, -83.4] }
      : { x: 253, y: 297, t: 117.4, h: -14, an: { to: [330, GY], bend: 1 }, af: { to: [336, GY], bend: 1 }, ln: [-62.6, -62.6], lf: [-62.6, -62.6] }) as Pose)),
  },
  under: () => (
    <g>
      <Floor />
      <Fill d={circle(352, GY - 7, 8)} c={BLUE} op={0.4} />
      <Ink d={circle(352, GY - 7, 8)} c={BLUE} w={4} />
    </g>
  ),
  draw: (time) => <Say x={480} y={110} text={`${Math.min(3, Math.floor((time + 0.35) / 1.4))}`} size={64} c={RED} />,
};
