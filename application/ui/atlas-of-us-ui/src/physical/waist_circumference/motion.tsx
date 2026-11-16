import { ORANGE } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { ease, type Motion, STAND } from '../motion_kit';
import { Say } from '../motion_marks';

//the waist, halfway between the hips and the bottom of the ribs
const WAIST = { x: 300, y: 210, rx: 27, ry: 7 };

export const waist: Motion = {
  label: 'Someone standing with their arms a little out while a tape measure wraps around their waist',
  period: 4,
  still: 2.4,
  figure: { view: 'front', frames: [[0, { ...STAND, an: [24, 10], af: [-24, -10] }]] },
  under: () => <Floor />,
  draw: (time) => {
    const round = ease(Math.min(1, time / 1.6));
    return (
      <g>
        <ellipse cx={WAIST.x} cy={WAIST.y} rx={WAIST.rx} ry={WAIST.ry} fill="none" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${round} 1`} />
        {time > 1.6 && <Say x={440} y={WAIST.y + 10} text="waist" size={34} c={ORANGE} />}
      </g>
    );
  },
};
