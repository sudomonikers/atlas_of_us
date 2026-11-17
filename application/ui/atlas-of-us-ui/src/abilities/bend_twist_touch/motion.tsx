import { ORANGE, type Pt, rect, RED } from '../../shared_components/story/ink';
import { Floor, Wall } from '../body_marks';
import { GY, type Motion, steps } from '../motion_kit';
import { Fill, Say } from '../motion_marks';

export const bendTwist: Motion = {
  label: 'Someone bending to touch the floor, then standing and twisting to touch a mark on the wall behind them',
  period: 3.6,
  still: 0.9,
  figure: {
    view: 'side',
    frames: steps(0.45, [0, 1, 0, 2, 0, 1, 0, 2].map((what) => {
      const legs = { ln: { to: [304, GY] as Pt, bend: -1 as const }, lf: { to: [296, GY] as Pt, bend: -1 as const } };
      if (what === 1) return { x: 258, y: 250, t: 58, h: 40, an: { to: [312, GY - 4], bend: -1 }, af: { to: [306, GY - 4], bend: -1 }, ...legs };
      if (what === 2) return { x: 296, y: 234, t: 190, h: -10, an: { to: [196, 148], bend: -1 }, af: { to: [196, 156], bend: -1 }, ...legs };
      return { x: 296, y: 236, t: 180, an: { to: [312, 236], bend: 1 }, af: { to: [290, 240], bend: 1 }, ...legs };
    })),
  },
  under: () => (
    <g>
      <Floor />
      <Wall x={190} side={-1} />
      <Fill d={rect(190, 140, 12, 22)} c={ORANGE} op={0.7} />
    </g>
  ),
  draw: (time) => <Say x={480} y={110} text={`${Math.floor((time + 0.2) / 0.9)}`} size={64} c={RED} />,
};
