import { BLUE, GRAY, INK, line, ORANGE, rect, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';

//the chart's rows, top to bottom: their letters, how big and how far down
const ROWS: { text: string; size: number; y: number }[] = [
  { text: 'E', size: 72, y: 112 },
  { text: 'F P', size: 44, y: 166 },
  { text: 'T O Z', size: 32, y: 210 },
  { text: 'L P E D', size: 24, y: 246 },
  { text: 'P E C F D', size: 18, y: 276 },
  { text: 'E D F C Z P', size: 14, y: 302 },
];
const EACH = 0.9; //how long the pointer stays under each row

export const eyeChart: Motion = {
  label: 'An eye chart with a pointer moving down its rows of shrinking letters, beside an eye reading it and headphones playing a tone',
  period: ROWS.length * EACH,
  still: 3 * EACH + 0.4,
  draw: (time) => {
    const row = Math.min(ROWS.length - 1, Math.floor(time / EACH));
    const { y } = ROWS[row];
    const blink = time % 2.7 > 2.55 ? 0.15 : 1;
    const look = (y - 180) / 12; //the pupil follows the pointer down
    const beat = (time * 1.6) % 1;
    return (
      <g>
        <Fill d={rect(66, 44, 196, 290)} c="#fff" op={1} />
        <Ink d={rect(66, 44, 196, 290)} w={5} />
        {ROWS.map((r, i) => (
          <Say key={r.text} x={164} y={r.y} text={r.text} size={r.size} c={i === row ? INK : GRAY} />
        ))}
        <Ink d={line([100, y + 8], [228, y + 8])} c={RED} w={4} />

        <g transform={`translate(0 ${130 * (1 - blink)}) scale(1 ${blink})`}>
          <Fill d="M 340 130 Q 420 64 500 130 Q 420 196 340 130 Z" c="#fff" op={1} />
          <circle cx={404} cy={130 + look} r={27} fill={BLUE} fillOpacity={0.55} stroke={INK} strokeWidth={4} />
          <circle cx={398} cy={130 + look} r={11} fill={INK} />
          <Ink d="M 340 130 Q 420 64 500 130 Q 420 196 340 130 Z" w={5} />
        </g>

        <Ink d="M 368 298 Q 362 236 420 236 Q 478 236 472 298" w={7} />
        <Fill d={rect(352, 296, 30, 52)} c={ORANGE} op={0.6} />
        <Ink d={rect(352, 296, 30, 52)} w={5} />
        <Fill d={rect(458, 296, 30, 52)} c={ORANGE} op={0.6} />
        <Ink d={rect(458, 296, 30, 52)} w={5} />
        {[0, 1, 2].map((k) => {
          const r = 18 + 16 * ((k + beat) % 3);
          return <Ink key={k} d={`M ${500 + r * 0.6} ${322 - r * 0.8} A ${r} ${r} 0 0 1 ${500 + r * 0.6} ${322 + r * 0.8}`} c={BLUE} w={4} op={1 - ((k + beat) % 3) / 3} />;
        })}
      </g>
    );
  },
};
