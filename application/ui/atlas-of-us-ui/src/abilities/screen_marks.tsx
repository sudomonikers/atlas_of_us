import type { ReactNode } from 'react';
import { BLUE, BOARD, GRAY, GREEN, INK, ORANGE, RED, circle, line, rect, shape, type Pt } from '../shared_components/story/ink';
import { Fill, Ink, Say } from './motion_marks';

// What the animations of the tests played on a screen are drawn with: the screen, a pointer, buttons, a box being
// typed in, and the things the tests show.

//the screen the test is on, with what's on it
export const Screen = ({ children }: { children: ReactNode }) => (
  <g>
    <Fill d={rect(40, 18, 520, 330)} c={BOARD} op={1} />
    <Ink d={rect(40, 18, 520, 330)} w={7} />
    <Ink d={line([270, 348], [262, 382]) + ' ' + line([330, 348], [338, 382]) + ' ' + line([230, 384], [370, 384])} w={6} />
    {children}
  </g>
);

//a mouse pointer, its tip at a point
export const Pointer = ({ at: [x, y] }: { at: Pt }) => (
  <path d={`M ${x} ${y} l 0 30 l 8 -8 l 7 15 l 6 -3 l -7 -14 l 12 -1 Z`} fill="#fff" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
);

//a button, pressed in when it's on
export const Button = ({ x, y, w, label, on, c = BLUE }: { x: number; y: number; w: number; label: string; on?: boolean; c?: string }) => (
  <g>
    <Fill d={rect(x, y, w, 40)} c={on ? c : '#fff'} op={on ? 0.35 : 1} />
    <Ink d={rect(x, y, w, 40)} w={4} />
    <Say x={x + w / 2} y={y + 29} text={label} size={24} />
  </g>
);

//a box being typed in, with a tick once what's typed is right
export const Typing = ({ x, y, w, text, right }: { x: number; y: number; w: number; text: string; right?: boolean }) => (
  <g>
    <Fill d={rect(x, y, w, 52)} c="#fff" op={1} />
    <Ink d={rect(x, y, w, 52)} w={4} />
    <Say x={x + 14} y={y + 38} text={text} size={34} anchor="start" />
    {right && <Ink d={line([x + w + 18, y + 26], [x + w + 30, y + 40], [x + w + 52, y + 10])} c={GREEN} w={7} />}
  </g>
);

//a figure of a puzzle: a circle, square, triangle or diamond
function figure(kind: number, x: number, y: number, r: number): string {
  if (kind === 0) return circle(x, y, r);
  if (kind === 1) return rect(x - r, y - r, 2 * r, 2 * r);
  if (kind === 2) return shape([x, y - r], [x + r, y + r * 0.8], [x - r, y + r * 0.8]);
  return shape([x, y - r * 1.2], [x + r, y], [x, y + r * 1.2], [x - r, y]);
}
//how many of a figure, side by side in a cell, filled with a color
export const Figures = ({ kind, count, x, y, c = INK, r = 8 }: { kind: number; count: number; x: number; y: number; c?: string; r?: number }) => (
  <g>
    {Array.from({ length: count }, (_, i) => (
      <path key={i} d={figure(kind, x + (i - (count - 1) / 2) * r * 2.7, y, r)} fill={c} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    ))}
  </g>
);

//a shape of five blocks, as cells across and down, turned and maybe mirrored, centered on a point
const P_BLOCKS: Pt[] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
export const Blocks = ({ x, y, size, turn, mirror, c = BLUE }: { x: number; y: number; size: number; turn: number; mirror?: boolean; c?: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${mirror ? -1 : 1} 1) translate(${-size} ${-1.5 * size})`}>
    {P_BLOCKS.map(([cx, cy]) => (
      <path key={`${cx}${cy}`} d={rect(cx * size, cy * size, size, size)} fill={c} fillOpacity={0.3} stroke={INK} strokeWidth={3} />
    ))}
  </g>
);

//an arrow pointing left or right
export const Arrow = ({ x, y, left, c = INK }: { x: number; y: number; left: boolean; c?: string }) => {
  const k = left ? -1 : 1;
  return <Ink d={line([x - 18 * k, y], [x + 18 * k, y]) + ' ' + line([x + 4 * k, y - 14], [x + 18 * k, y], [x + 4 * k, y + 14])} c={c} w={6} />;
};

//a card of card sorting: one to four of a shape in a color
const CARD_COLORS = [RED, GREEN, ORANGE, BLUE];
function cardShape(kind: number, x: number, y: number, r: number): string {
  if (kind === 0) return shape([x, y - r], [x + r, y + r * 0.8], [x - r, y + r * 0.8]);
  if (kind === 1) {
    const at = Array.from({ length: 10 }, (_, i): Pt => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const d = i % 2 ? r * 0.45 : r;
      return [x + d * Math.cos(a), y + d * Math.sin(a)];
    });
    return shape(...at);
  }
  if (kind === 2) return shape([x - r / 3, y - r], [x + r / 3, y - r], [x + r / 3, y - r / 3], [x + r, y - r / 3], [x + r, y + r / 3], [x + r / 3, y + r / 3], [x + r / 3, y + r], [x - r / 3, y + r], [x - r / 3, y + r / 3], [x - r, y + r / 3], [x - r, y - r / 3], [x - r / 3, y - r / 3]);
  return circle(x, y, r);
}
export const SortCard = ({ x, y, color, kind, count }: { x: number; y: number; color: number; kind: number; count: number }) => (
  <g>
    <Fill d={rect(x - 34, y - 46, 68, 92)} c="#fff" op={1} />
    <Ink d={rect(x - 34, y - 46, 68, 92)} w={4} />
    {Array.from({ length: count }, (_, i) => {
      const spots: Pt[][] = [[[0, 0]], [[0, -18], [0, 18]], [[0, -26], [0, 0], [0, 26]], [[-14, -18], [14, -18], [-14, 18], [14, 18]]];
      const [dx, dy] = spots[count - 1][i];
      return <path key={i} d={cardShape(kind, x + dx, y + dy, 10)} fill={CARD_COLORS[color]} stroke={INK} strokeWidth={2} />;
    })}
  </g>
);

//headphones from the front, the middle of the band's ends at a point
export const Headphones = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Ink d={`M ${x - 52} ${y} Q ${x - 58} ${y - 62} ${x} ${y - 62} Q ${x + 58} ${y - 62} ${x + 52} ${y}`} w={7} />
    {[-1, 1].map((k) => (
      <g key={k}>
        <Fill d={rect(x + k * 53 - 15, y - 2, 30, 52)} c={ORANGE} op={0.6} />
        <Ink d={rect(x + k * 53 - 15, y - 2, 30, 52)} w={5} />
      </g>
    ))}
  </g>
);

//sound spreading out to one side of a point, -1 left and 1 right, its waves moving out as the beat goes from 0 to 1
export const Waves = ({ x, y, k, beat, op = 1, c = BLUE }: { x: number; y: number; k: -1 | 1; beat: number; op?: number; c?: string }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const out = (i + beat) % 3;
      const r = 18 + 16 * out;
      return <Ink key={i} d={`M ${x + k * r * 0.6} ${y - r * 0.8} A ${r} ${r} 0 0 ${k > 0 ? 1 : 0} ${x + k * r * 0.6} ${y + r * 0.8}`} c={c} w={4} op={op * (1 - out / 3)} />;
    })}
  </g>
);

//someone from the shoulders up, a man or a woman, their mouth open while talking, their shoulders a color
export const Talker = ({ x, y, woman, talking, c = GRAY }: { x: number; y: number; woman?: boolean; talking?: boolean; c?: string }) => (
  <g>
    <Fill d={`M ${x - 44} ${y + 74} Q ${x - 42} ${y + 34} ${x} ${y + 34} Q ${x + 42} ${y + 34} ${x + 44} ${y + 74} Z`} c={c} op={0.35} />
    <Ink d={`M ${x - 44} ${y + 74} Q ${x - 42} ${y + 34} ${x} ${y + 34} Q ${x + 42} ${y + 34} ${x + 44} ${y + 74}`} w={5} />
    <Fill d={circle(x, y, 28)} c={BOARD} op={1} />
    <Ink d={circle(x, y, 28)} w={5} />
    <Ink d={woman ? `M ${x - 30} ${y + 28} Q ${x - 38} ${y - 40} ${x} ${y - 30} Q ${x + 38} ${y - 40} ${x + 30} ${y + 28}` : `M ${x - 26} ${y - 8} Q ${x} ${y - 44} ${x + 26} ${y - 8}`} w={8} />
    <circle cx={x - 9} cy={y - 2} r={3.3} fill={INK} />
    <circle cx={x + 9} cy={y - 2} r={3.3} fill={INK} />
    {talking ? <ellipse cx={x} cy={y + 13} rx={7} ry={6} fill={INK} /> : <Ink d={line([x - 7, y + 13], [x + 7, y + 13])} w={3.5} />}
  </g>
);

//a speech bubble, an oval with its tail pointing to who's speaking
export const Bubble = ({ x, y, rx, ry, to, c = INK, w = 5 }: { x: number; y: number; rx: number; ry: number; to: Pt; c?: string; w?: number }) => {
  const oval = `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  //the tail leaves the bottom of the oval on the side toward who's speaking
  const bx = Math.max(-rx * 0.6, Math.min(rx * 0.6, (to[0] - x) * 0.7));
  const at = (dx: number) => y + ry * Math.sqrt(1 - ((bx + dx) / rx) ** 2) - 5;
  const base: [Pt, Pt] = [[x + bx - 14, at(-14)], [x + bx + 14, at(14)]];
  return (
    <g>
      <Fill d={oval} c="#fff" op={1} />
      <Ink d={oval} c={c} w={w} />
      <Fill d={shape(base[0], to, base[1])} c="#fff" op={1} />
      <Ink d={line(base[0], to, base[1])} c={c} w={w} />
    </g>
  );
};

//a flash or a burst of sound: a spot with lines bursting out of it
export const Burst = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Fill d={circle(x, y, 16)} c={ORANGE} op={0.75} />
    <Ink d={circle(x, y, 16)} w={4} />
    <Ink
      d={Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return line([x + 24 * Math.cos(a), y + 24 * Math.sin(a)], [x + 34 * Math.cos(a), y + 34 * Math.sin(a)]);
      }).join(' ')}
      w={4}
    />
  </g>
);
