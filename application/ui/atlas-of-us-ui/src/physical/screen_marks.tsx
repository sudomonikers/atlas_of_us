import type { ReactNode } from 'react';
import { BLUE, BOARD, GREEN, INK, ORANGE, RED, circle, line, rect, shape, type Pt } from '../shared_components/story/ink';
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
