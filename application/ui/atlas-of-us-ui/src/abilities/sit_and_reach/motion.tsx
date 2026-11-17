import { line, ORANGE, RED } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

export const sitReach: Motion = {
  label: 'Someone sitting with straight legs, reaching forward along a ruler past their toes',
  period: 3.6,
  still: 1.6,
  figure: {
    view: 'side',
    frames: [
      [0, { x: 220, y: 340, t: 172, an: { to: [288, 322], bend: 1 }, af: { to: [282, 324], bend: 1 }, ln: [90, 90], lf: [90, 90] }],
      [1, { x: 220, y: 340, t: 124, h: -16, an: { to: [376, 318], bend: 1 }, af: { to: [370, 320], bend: 1 }, ln: [90, 90], lf: [90, 90] }],
      [2.4, { x: 220, y: 340, t: 124, h: -16, an: { to: [376, 318], bend: 1 }, af: { to: [370, 320], bend: 1 }, ln: [90, 90], lf: [90, 90] }],
    ],
  },
  under: () => (
    <g>
      <Floor />
      <Ink d={line([260, GY - 2], [470, GY - 2])} c={ORANGE} w={6} />
      <Ink d={Array.from({ length: 15 }, (_, i) => line([260 + i * 15, GY - 2], [260 + i * 15, GY - (i % 2 ? 10 : 16)])).join(' ')} c={ORANGE} w={3} />
      <Ink d={line([340, GY - 2], [340, GY - 34])} c={RED} w={5} />
      <Say x={340} y={GY + 30} text="toes" size={24} c={RED} />
    </g>
  ),
};
