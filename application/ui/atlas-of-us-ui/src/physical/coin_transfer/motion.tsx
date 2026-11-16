import { BLUE, INK, ORANGE, type Pt, rect } from '../../shared_components/story/ink';
import { Coin, Reach } from '../body_marks';
import { ease, mix, type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';

export const coinTransfer: Motion = {
  label: 'A hand picking coins up one at a time from a pile and dropping each into a mug',
  period: 1.6,
  still: 0.5,
  draw: (time) => {
    const path: [number, Pt][] = [[0, [210, 250]], [0.25, [210, 256]], [0.75, [400, 168]], [1.0, [400, 176]], [1.6, [210, 250]]];
    const k = path.findIndex(([at]) => at > time);
    const [a0, p0] = path[k - 1];
    const [a1, p1] = path[k];
    const e = ease((time - a0) / (a1 - a0));
    const hand: Pt = [mix(p0[0], p1[0], e), mix(p0[1], p1[1], e)];
    const carrying = time > 0.25 && time < 1.0;
    return (
      <g>
        <Fill d={rect(40, 40, 520, 320)} c={ORANGE} op={0.08} />
        {[[190, 262], [214, 272], [232, 256], [204, 244], [226, 282], [244, 270]].map(([x, y], i) => <Coin key={i} x={x} y={y} />)}
        <circle cx={400} cy={160} r={48} fill={BLUE} fillOpacity={0.2} stroke={INK} strokeWidth={6} />
        <circle cx={400} cy={160} r={34} fill="none" stroke={INK} strokeWidth={4} />
        <Ink d={`M 446 146 Q 486 160 446 178`} w={6} />
        <Reach from={[hand[0] + 140, 460]} to={hand} />
        {carrying && <Coin x={hand[0] - 2} y={hand[1] - 34} />}
        <Say x={90} y={90} text="x 20" size={34} anchor="start" />
      </g>
    );
  },
};
