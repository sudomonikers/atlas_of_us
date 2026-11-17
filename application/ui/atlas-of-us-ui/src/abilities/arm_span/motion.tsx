import { BLUE, line, ORANGE } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { type Motion, type Pose, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

//arms straight out to the sides at shoulder height
const SPREAD: Pose = { ...STAND, an: [90, 90], af: [-90, -90] };

export const armSpan: Motion = {
  label: 'Someone lifting their arms straight out to the sides while a tape measures from one fingertip to the other',
  period: 4.4,
  still: 3,
  figure: { view: 'front', frames: [[0, STAND], [1.2, SPREAD], [3.8, SPREAD]] },
  under: () => <Floor />,
  draw: (time, j) => {
    if (time < 1.4 || !j) return null;
    const [right, left] = j.hands;
    const y = right[1] - 22;
    return (
      <g>
        <Ink d={line([left[0], y], [276, y]) + ' ' + line([324, y], [right[0], y])} c={ORANGE} w={5} />
        <Ink d={line([left[0], y - 10], [left[0], y + 10]) + ' ' + line([right[0], y - 10], [right[0], y + 10])} c={ORANGE} w={4} />
        <Say x={300} y={58} text="arm span" size={34} c={BLUE} />
      </g>
    );
  },
};
