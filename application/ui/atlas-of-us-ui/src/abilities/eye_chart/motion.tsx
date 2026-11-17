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

//the tumbling E's of the reading chart, each smaller, which way its arms point in degrees from the right, and the key
//for that way on the pad, across and down from its middle
const READ_EACH = 1.2;
const READ: { size: number; turn: number; key: [number, number] }[] = [
  { size: 72, turn: 0, key: [1, 0] },
  { size: 52, turn: 270, key: [0, -1] },
  { size: 36, turn: 180, key: [-1, 0] },
  { size: 24, turn: 90, key: [0, 1] },
];
const PHONE = { x: 340, y: 40, w: 160, h: 300 };
const PAD: [number, number] = [420, 270];

export const readingChart: Motion = {
  label: 'A phone held 40 cm from an eye, showing an E that gets smaller each time, and the arrow for the way its arms point tapped',
  period: READ.length * READ_EACH,
  still: 0.9,
  draw: (time) => {
    const { size, turn, key } = READ[Math.floor(time / READ_EACH)];
    const t = time % READ_EACH;
    const pressed = t > 0.75 && t < 1.05;
    const blink = time % 2.4 > 2.28 ? 0.15 : 1;
    const u = size / 5;
    const e = `M 0 0 h ${5 * u} v ${u} h ${-4 * u} v ${u} h ${4 * u} v ${u} h ${-4 * u} v ${u} h ${4 * u} v ${u} h ${-5 * u} Z`;
    const eye = 'M 60 180 Q 130 124 200 180 Q 130 236 60 180 Z';
    return (
      <g>
        <g transform={`translate(0 ${180 * (1 - blink)}) scale(1 ${blink})`}>
          <Fill d={eye} c="#fff" op={1} />
          <circle cx={146} cy={178} r={24} fill={BLUE} fillOpacity={0.55} stroke={INK} strokeWidth={4} />
          <circle cx={154} cy={178} r={10} fill={INK} />
          <Ink d={eye} w={5} />
        </g>
        <path d="M 210 172 L 380 130" fill="none" stroke={GRAY} strokeWidth={3} strokeDasharray="8 10" />
        <Ink d={line([130, 362], [PHONE.x + PHONE.w / 2, 362]) + ' ' + line([130, 350], [130, 374]) + ' ' + line([PHONE.x + PHONE.w / 2, 350], [PHONE.x + PHONE.w / 2, 374])} c={RED} w={4} />
        <Say x={(130 + PHONE.x + PHONE.w / 2) / 2} y={350} text="40 cm" size={30} c={RED} />

        <Fill d={rect(PHONE.x, PHONE.y, PHONE.w, PHONE.h)} c="#fff" op={1} />
        <Ink d={rect(PHONE.x, PHONE.y, PHONE.w, PHONE.h)} w={7} />
        <Ink d={line([PHONE.x + 60, PHONE.y + 16], [PHONE.x + 100, PHONE.y + 16])} c={GRAY} w={4} />
        <g transform={`translate(420 130) rotate(${turn}) translate(${-size / 2} ${-size / 2})`}>
          <path d={e} fill={INK} />
        </g>
        {([[1, 0], [0, -1], [-1, 0], [0, 1]] as [number, number][]).map(([kx, ky]) => {
          const [x, y] = [PAD[0] + kx * 38, PAD[1] + ky * 38];
          const on = pressed && kx === key[0] && ky === key[1];
          return (
            <g key={`${kx}${ky}`}>
              <Fill d={rect(x - 16, y - 16, 32, 32)} c={on ? BLUE : '#fff'} op={on ? 0.4 : 1} />
              <Ink d={rect(x - 16, y - 16, 32, 32)} w={3.5} />
              <path d={`M ${x - kx * 6 + ky * 7} ${y - ky * 6 - kx * 7} L ${x - kx * 6 - ky * 7} ${y - ky * 6 + kx * 7} L ${x + kx * 8} ${y + ky * 8} Z`} fill={INK} />
            </g>
          );
        })}
      </g>
    );
  },
};
