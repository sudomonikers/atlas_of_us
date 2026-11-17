import { circle, GRAY, INK, line, ORANGE, type Pt, RED } from '../shared_components/story/ink';
import { GY, rad, SKIN } from './motion_kit';
import { Ink, Say } from './motion_marks';

export const Floor = () => <Ink d={line([30, GY + 2], [570, GY + 2])} c={GRAY} w={4} />;

//a stopwatch reading the seconds since the loop began
export const Clock = ({ x, y, seconds }: { x: number; y: number; seconds: number }) => (
  <g>
    <Ink d={circle(x, y, 26)} w={5} />
    <Ink d={line([x - 6, y - 32], [x + 6, y - 32])} w={5} />
    <Ink d={line([x, y], [x + 18 * Math.sin(rad(seconds * 30)), y - 18 * Math.cos(rad(seconds * 30))])} c={RED} w={4} />
    <Say x={x} y={y + 58} text={`${Math.floor(seconds)} s`} size={28} />
  </g>
);

//a forearm reaching in from off the table, and the hand at its end, seen from above
export const Reach = ({ from, to, flat }: { from: Pt; to: Pt; flat?: boolean }) => (
  <g>
    <path d={line(from, to)} stroke={INK} strokeWidth={46} strokeLinecap="round" />
    <path d={line(from, to)} stroke={SKIN} strokeWidth={34} strokeLinecap="round" />
    <ellipse cx={to[0]} cy={to[1] - 8} rx={flat ? 30 : 25} ry={flat ? 34 : 27} fill={SKIN} stroke={INK} strokeWidth={6} />
    {flat && <Ink d={[-16, -5, 6, 17].map((dx) => line([to[0] + dx, to[1] - 30], [to[0] + dx, to[1] - 14])).join(' ')} w={3} />}
    <circle cx={to[0] + (to[0] > from[0] ? 24 : -24)} cy={to[1] + 4} r={10} fill={SKIN} stroke={INK} strokeWidth={5} />
  </g>
);

export const Coin = ({ x, y, face, turn = 1 }: { x: number; y: number; face?: string; turn?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.08, Math.abs(turn))} 1)`}>
    <circle r={20} fill={ORANGE} fillOpacity={0.45} stroke={ORANGE} strokeWidth={5} />
    {face && Math.abs(turn) > 0.4 && <Say x={0} y={9} text={face} size={26} c={INK} />}
  </g>
);

//a wall, hatched behind, from the floor up
export const Wall = ({ x, side }: { x: number; side: 1 | -1 }) => (
  <g>
    <Ink d={line([x, GY + 2], [x, 30])} w={6} />
    <Ink d={Array.from({ length: 11 }, (_, i) => line([x, 50 + i * 28], [x + side * 18, 36 + i * 28])).join(' ')} c={GRAY} w={3} />
  </g>
);
