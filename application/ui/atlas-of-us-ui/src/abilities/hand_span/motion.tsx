import { BLUE, INK, line, ORANGE, type Pt } from '../../shared_components/story/ink';
import { SKIN, ease, mix, type Motion } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

//each finger: where it leaves the palm, its angle from straight up closed and spread, and its length
const FINGERS: { at: Pt; from: number; to: number; long: number }[] = [
  { at: [250, 262], from: -55, to: -88, long: 62 },
  { at: [272, 200], from: -8, to: -24, long: 74 },
  { at: [298, 192], from: 0, to: -4, long: 82 },
  { at: [324, 198], from: 8, to: 16, long: 76 },
  { at: [346, 212], from: 16, to: 40, long: 60 },
];
const tip = ({ at, from, to, long }: (typeof FINGERS)[number], spread: number): Pt => {
  const a = (mix(from, to, spread) * Math.PI) / 180;
  return [at[0] + long * Math.sin(a), at[1] - long * Math.cos(a)];
};

export const handSpan: Motion = {
  label: 'A hand spreading its fingers as wide as they go over a ruler, measured from the tip of the thumb to the tip of the little finger',
  period: 4.4,
  still: 3,
  draw: (time) => {
    const spread = ease(Math.min(1, time / 1.6));
    const tips = FINGERS.map((f) => tip(f, spread));
    const [thumb, , , , little] = tips;
    //the ruler's ends, square to it, at the two tips
    const along = Math.atan2(little[1] - thumb[1], little[0] - thumb[0]);
    const tick = (p: Pt) => line([p[0] - 9 * Math.sin(along), p[1] + 9 * Math.cos(along)], [p[0] + 9 * Math.sin(along), p[1] - 9 * Math.cos(along)]);
    return (
      <g>
        {FINGERS.map((f, i) => (
          <g key={i}>
            <path d={line(f.at, tips[i])} stroke={INK} strokeWidth={30} strokeLinecap="round" />
            <path d={line(f.at, tips[i])} stroke={SKIN} strokeWidth={20} strokeLinecap="round" />
          </g>
        ))}
        <ellipse cx={298} cy={262} rx={60} ry={64} fill={SKIN} stroke={INK} strokeWidth={6} />
        {time > 1.7 && (
          <g>
            <Ink d={line(thumb, little)} c={ORANGE} w={5} />
            <Ink d={tick(thumb) + ' ' + tick(little)} c={ORANGE} w={4} />
            <Say x={298} y={360} text="hand span" size={30} c={BLUE} />
          </g>
        )}
      </g>
    );
  },
};
