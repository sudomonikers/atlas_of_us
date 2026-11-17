import { BLUE, GRAY, line } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion, type Pose, SEATED, steps } from '../motion_kit';
import { Ink } from '../motion_marks';

export const steady: Motion = {
  label: 'Someone sitting at a laptop holding one arm straight out toward its camera, keeping their hand as still as they can',
  period: 1.2,
  still: 0,
  figure: {
    view: 'side',
    //the hand trembling a little around one spot, the other resting on the table
    frames: steps(0.15, [
      [0, 0],
      [2, -1],
      [-1, 2],
      [1, 1],
      [-2, -1],
      [1, -2],
      [-1, 1],
      [2, 0],
    ].map(([dx, dy]) => ({ ...SEATED, an: { to: [384 + dx, 166 + dy], bend: 1 }, af: { to: [330, 250], bend: 1 } }) as Pose)),
  },
  under: () => (
    <g>
      <Floor />
      <Ink d={line([196, 200], [196, 298], [262, 298]) + ' ' + line([204, 298], [204, GY]) + ' ' + line([254, 298], [254, GY])} c={GRAY} w={6} />
      <Ink d={line([290, 258], [560, 258]) + ' ' + line([300, 258], [300, GY]) + ' ' + line([550, 258], [550, GY])} w={6} />
    </g>
  ),
  //the laptop, with its camera at the top of the screen
  draw: () => (
    <g>
      <Ink d={line([420, 254], [504, 254])} w={7} />
      <Ink d={line([504, 254], [486, 166])} w={7} />
      <circle cx={487} cy={176} r={5} fill={BLUE} />
    </g>
  ),
};
