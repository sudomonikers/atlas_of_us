import { BLUE, INK, line, RED } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { mix, type Motion, STAND } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';

//the cuff around the near upper arm, and the monitor it's joined to
const CUFF: [[number, number], [number, number]] = [
  [328, 160],
  [332, 188],
];
const SCREEN = { x: 420, y: 140, w: 130, h: 96 };

export const bloodPressure: Motion = {
  label: 'Someone with a blood pressure cuff on their upper arm while the monitor beside them counts down to a reading',
  period: 5,
  still: 4.2,
  figure: { view: 'front', frames: [[0, { ...STAND, an: [6, 70] }]] },
  under: () => <Floor />,
  draw: (time) => {
    const squeeze = time < 3 ? 1 + 0.12 * Math.sin(time * 6) : 1;
    const top = Math.round(time < 3 ? mix(170, 120, time / 3) : 120);
    return (
      <g>
        <path d={line(...CUFF)} stroke={INK} strokeWidth={30 * squeeze} strokeLinecap="round" />
        <path d={line(...CUFF)} stroke={BLUE} strokeWidth={22 * squeeze} strokeLinecap="round" />
        <Ink d={`M 342 174 C 380 174 380 200 ${SCREEN.x} 200`} w={3} />
        <Fill d={`M ${SCREEN.x} ${SCREEN.y} h ${SCREEN.w} v ${SCREEN.h} h ${-SCREEN.w} Z`} c="#fff" op={1} />
        <Ink d={`M ${SCREEN.x} ${SCREEN.y} h ${SCREEN.w} v ${SCREEN.h} h ${-SCREEN.w} Z`} w={4} />
        <Say x={SCREEN.x + SCREEN.w / 2} y={SCREEN.y + 42} text={`${top}`} size={34} c={time < 3 ? INK : RED} />
        {time >= 3 && <Say x={SCREEN.x + SCREEN.w / 2} y={SCREEN.y + 80} text="80" size={28} c={RED} />}
      </g>
    );
  },
};
