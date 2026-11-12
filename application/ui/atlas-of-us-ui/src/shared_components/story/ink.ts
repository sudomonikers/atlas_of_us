import type { ReactNode } from 'react';

// The marker the stories that open a module are drawn in: the board's space and colours, the paths it draws, and the
// cues that say what's on the board. The drawing itself is in marker.tsx.

export const W = 1600;
export const H = 900;
export const VIEW = `0 0 ${W} ${H}`;
export const GROUND = 620;
export type Pt = [number, number];

export const BOARD = '#fbfbf6';
export const INK = '#23303b';
export const RED = '#d2453b';
export const BLUE = '#2f6db5';
export const PURPLE = '#7b55b0';
export const GREEN = '#2f9a5a';
export const ORANGE = '#e8862a';
export const GRAY = '#8d99a5';
export const HAND = '"Patrick Hand", "Comic Sans MS", cursive';

export const pts = (...p: Pt[]) => p.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(' L ');
export const line = (...p: Pt[]) => `M ${pts(...p)}`;
export const shape = (...p: Pt[]) => `${line(...p)} Z`;
export const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
export const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;

// ---------------------------------------------------------------------------
// cues: the board, and every part on it by key. Parts already up stay put; new ones draw on in order
// ---------------------------------------------------------------------------

export interface Part {
  key: string;
  node: ReactNode;
  moving?: boolean; //loops forever, so it gets an svg of its own
}
export interface Cue {
  board: string;
  parts: Part[];
}
export const part = (key: string, node: ReactNode, moving?: boolean): Part => ({ key, node, moving });
