import { BLUE, line, ORANGE } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { ease, type Motion, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

//from the crease at the top of the near thigh to the top of the knee
const TOP: [number, number] = [334, 236];
const KNEE_Y = 288;

export const upperLeg: Motion = {
  label: 'Someone standing while a tape measures from the top of their thigh down to their knee',
  period: 4,
  still: 2.6,
  figure: { view: 'front', frames: [[0, { ...STAND, an: [24, 10] }]] },
  under: () => <Floor />,
  draw: (time) => {
    const end = TOP[1] + (KNEE_Y - TOP[1]) * ease(Math.min(1, time / 1.4));
    return (
      <g>
        <Ink d={line(TOP, [TOP[0], end])} c={ORANGE} w={5} />
        <Ink d={line([TOP[0] - 8, TOP[1]], [TOP[0] + 8, TOP[1]])} c={ORANGE} w={4} />
        {time > 1.4 && <Ink d={line([TOP[0] - 8, KNEE_Y], [TOP[0] + 8, KNEE_Y])} c={ORANGE} w={4} />}
        {time > 1.4 && <Say x={450} y={268} text="hip to knee" size={30} c={BLUE} />}
      </g>
    );
  },
};
