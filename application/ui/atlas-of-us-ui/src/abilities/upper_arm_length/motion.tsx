import { BLUE, line, ORANGE } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { ease, type Motion, type Pose, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

//the near arm hanging, bent at the elbow so the forearm points out, as it's measured
const BENT: Pose = { ...STAND, an: [0, 90] };
const SHOULDER: [number, number] = [326, 144];
const ELBOW_Y = 198;

export const upperArm: Motion = {
  label: 'Someone with one elbow bent at a right angle while a tape measures from the top of the shoulder to the elbow',
  period: 4,
  still: 2.6,
  figure: { view: 'front', frames: [[0, BENT]] },
  under: () => <Floor />,
  draw: (time) => {
    const x = SHOULDER[0] + 22;
    const end = SHOULDER[1] + (ELBOW_Y - SHOULDER[1]) * ease(Math.min(1, time / 1.4));
    return (
      <g>
        <Ink d={line([x, SHOULDER[1]], [x, end])} c={ORANGE} w={5} />
        <Ink d={line([x - 8, SHOULDER[1]], [x + 8, SHOULDER[1]])} c={ORANGE} w={4} />
        {time > 1.4 && <Ink d={line([x - 8, ELBOW_Y], [x + 8, ELBOW_Y])} c={ORANGE} w={4} />}
        {time > 1.4 && <Say x={460} y={170} text="shoulder to elbow" size={28} c={BLUE} />}
      </g>
    );
  },
};
