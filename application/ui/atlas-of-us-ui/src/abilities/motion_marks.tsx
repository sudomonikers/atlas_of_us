import { HAND, INK } from '../shared_components/story/ink';

// The marker strokes the animations are drawn with: a line, a wash of color, and handwriting.

export const Ink = ({ d, c = INK, w = 6, op }: { d: string; c?: string; w?: number; op?: number }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op} />
);
export const Fill = ({ d, c, op = 0.3 }: { d: string; c: string; op?: number }) => <path d={d} fill={c} fillOpacity={op} />;
export const Say = ({ x, y, text, size = 30, c = INK, anchor = 'middle' }: { x: number; y: number; text: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} fill={c} fontFamily={HAND} fontSize={size} textAnchor={anchor}>
    {text}
  </text>
);
