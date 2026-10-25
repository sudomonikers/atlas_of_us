import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Layers, Sheet, type Layer } from '../layers';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Houseguest happens in one flat, drawn as an isometric dollhouse with the front walls taken away: an open-plan
// kitchen and living room on the left, your bedroom through a door on the right. The people are wooden peg dolls; you're
// the one in red. A cue names the time of day and the parts to show. Parts already in place stay put, new ones drop in
// one after another like pieces being set into the dollhouse, and anything no longer in the cue lifts out. The time of
// day tints the house, and lamps glow on top of the tint. Notes and messages are shown big, in callouts at the sides.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The house keeps to the top two thirds, clear
// of the text box.

const W = 1600;
const H = 900;
const VIEW = `0 0 ${W} ${H}`;
type Pt = [number, number];
type P3 = [number, number, number];

//one unit is about a foot and a half. x runs along the back right wall, y along the back left wall, z up
const S = 50;
const OX = 740;
const OY = 190;
const WALL = 2.6; //the back walls
const CUT = 1.4; //the inside wall, sliced through like a cutaway
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * 0.866 * S, OY + (x + y) * 0.5 * S - z * S];

const C = {
  wall: '#f1e4d1',
  cut: '#6e5848',
  slab: '#9a6f48',
  floor: '#dcb98f',
  plank: '#c9a275',
  tile: '#e8ece9',
  carpet: '#a9bfcc',
  rug: '#7fa39b',
  rug2: '#a9c4bc',
  mat: '#b0884f',
  wood: '#b9875a',
  woodDark: '#8a5f3c',
  door: '#c99a6a',
  frame: '#f8f4ec',
  glass: '#cfe6ef',
  curtain: '#e8c27a',
  counter: '#7e9aa6',
  worktop: '#e9e2d4',
  steel: '#b4bec2',
  fridge: '#eef2f1',
  kettle: '#8fc1b5',
  dark: '#3a3540',
  black: '#2a2a2e',
  sofa: '#5f7f8f',
  cushion: '#6f91a1',
  lampShade: '#f3d9a4',
  metal: '#8b8f96',
  brass: '#c9a24a',
  white: '#f6f4ef',
  pillow: '#fbf8f2',
  duvet: '#e9b9a4', //yours
  duvetR: '#9fb59a', //the one on the sofa bed
  paper: '#fffdf6',
  envelope: '#f3ead8',
  cardboard: '#c8a272',
  ink: '#2b2420',
  red: '#e0533d', //you, and nothing else
  mustard: '#d9a33a', //Rory
  blue: '#5b7fb8',
  teal: '#4f9a95',
  pink: '#e3a0a8',
  green: '#6f9a5f',
  leaf: '#86b26f',
  pot: '#c97d5a',
};

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Time = 'day' | 'evening' | 'night' | 'dawn';

interface Cue {
  time: Time;
  parts: string[]; //dropped in in this order
  card?: [kicker: string, name: string];
}

const FLAT = ['house', 'kitchen', 'table', 'living', 'sofa_arm', 'lamp', 'partition', 'bedroom'];
const OPEN = [...FLAT, 'door_open'];
const MESS = ['sofa_bed', 'clothes', 'towels', 'mugs_coffee', 'takeaway'];
const LATE = [...OPEN, 'bags_door', 'sofa_bed', 'glow_moon', 'phone_down'];

const cues: Record<string, Cue> = {
  title_card: { time: 'day', parts: OPEN, card: ['One week in March', 'The Houseguest'] },
  message: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'you_sofa', 'phone', 'glow_phone', 'call_priya'] },
  arrival: { time: 'night', parts: [...OPEN, 'glow_lamp', 'front_open', 'glow_hall', 'rory_door', 'bags_door', 'you_greet'] },
  rory_hello: { time: 'night', parts: [...OPEN, 'glow_lamp', 'bags_door', 'rory_in', 'you_greet'] },
  mess: { time: 'day', parts: [...OPEN, 'bags_door', ...MESS, 'you_mess'] },
  your_room: { time: 'day', parts: [...OPEN, 'bags_door', ...MESS, 'you_room'] },
  mess_tidy: { time: 'day', parts: [...OPEN, 'bags_door', 'sofa_bed', 'drainer', 'airer', 'you_sink', 'rory_in'] },
  mess_ask: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'bags_door', 'sofa_bed', 'mugs_coffee', 'heap', 'rory_by', 'you_mess'] },
  mess_leave: { time: 'day', parts: [...OPEN, 'bags_door', ...MESS, 'mess_more', 'you_bed'] },
  mess_pile: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'bags_door', 'sofa_bed', 'mugs_coffee', 'takeaway', 'pile', 'rory_by', 'you_mess'] },
  evening: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'glow_kitchen', 'bags_door', 'rory_cook', 'you_front'] },
  rory_kettle: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'glow_kitchen', 'bags_door', 'rory_cook', 'you_front', 'steam'] },
  your_door: { time: 'evening', parts: [...OPEN, 'glow_lamp', 'glow_kitchen', 'bags_door', 'rory_cook', 'steam', 'you_room'] },
  eve_yes: { time: 'night', parts: [...OPEN, 'glow_lamp', 'glow_tv', 'bags_door', 'plates', 'you_sofa', 'rory_sofa'] },
  eve_tea: { time: 'evening', parts: [...OPEN, 'glow_kitchen', 'bags_door', 'mugs_table', 'rory_stool', 'you_stool'] },
  eve_door: { time: 'night', parts: [...FLAT, 'door_shut', 'glow_kitchen', 'bags_door', 'rory_sink', 'glow_bedside', 'you_bed'] },
  eve_out: { time: 'night', parts: [...OPEN, 'glow_lamp', 'bags_door', 'sofa_bed', 'rory_asleep', 'you_front'] },
  late: { time: 'night', parts: [...LATE, 'rory_down', 'you_sink'] },
  rory_opens: { time: 'night', parts: [...LATE, 'rory_down', 'you_by_table'] },
  rory_cries: { time: 'night', parts: [...LATE, 'rory_cry', 'you_by_table'] },
  night_stay: { time: 'dawn', parts: [...OPEN, 'bags_door', 'sofa_bed', 'glow_dawn', 'mugs_table', 'rory_stool', 'you_stool'] },
  night_fix: { time: 'night', parts: [...OPEN, 'bags_door', 'sofa_bed', 'glow_kitchen', 'mugs_table', 'envelope', 'rory_stool', 'you_stool', 'call_list'] },
  night_kind: { time: 'night', parts: [...LATE, 'rory_down', 'glow_hall', 'you_room'] },
  night_bed: { time: 'night', parts: [...FLAT, 'door_shut', 'bags_door', 'sofa_bed', 'glow_moon', 'phone_down', 'rory_down', 'you_lie'] },
  note: { time: 'day', parts: [...OPEN, 'drainer', 'note', 'call_note'] },
  homework: { time: 'day', parts: OPEN },
  goodbye: { time: 'day', parts: [...OPEN, 'postcard', 'call_postcard'] },
};
const FIRST_CUE = 'title_card';

//the sky behind the house, and the tint over it
const SKY: Record<Time, string> = { day: '#dfeaec', evening: '#efc6a4', night: '#2c3358', dawn: '#e2c3cf' };
const TINT: Record<Time, string> = { day: '#ffffff', evening: '#f3d6bd', night: '#58609a', dawn: '#d6c8dc' };

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: shapes and lines, lettering, and pools of light. cls is for anything that moves
type Item =
  | { d: string; fill?: string; stroke?: string; w?: number; op?: number; dash?: string; cls?: string }
  | { text: string; x: number; y: number; size: number; c: string; hand?: boolean; bold?: boolean; anchor?: 'start' | 'end' }
  | { glow: 'warm' | 'cool' | 'dawn'; x: number; y: number; r: number; cls?: string };

const PART_GAP = 0.18; //seconds between one part dropping in and the next
const EDGE = 'rgba(70, 48, 32, 0.35)';

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map((n) => +n.toFixed(1)).join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const circle = (x: number, y: number, r: number) => ellipse(x, y, r, r);
const stroke = (c: string, d: string, w = 2, cls?: string): Item => ({ d, stroke: c, w, cls });
const words = (text: string, x: number, y: number, size: number, more: Partial<{ c: string; hand: boolean; bold: boolean; anchor: 'start' | 'end' }> = {}): Item => ({ text, x, y, size, c: C.ink, ...more });
const glow = (kind: 'warm' | 'cool' | 'dawn', [x, y]: Pt, r: number, cls?: string): Item => ({ glow: kind, x, y, r, cls });

//a colour lightened (k > 0) or darkened (k < 0)
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

const face = (pts: P3[], fill: string): Item => ({ d: poly(...pts.map((p) => P(...p))), fill, stroke: EDGE, w: 0.8 });
//a block, x..x+w by y..y+d by z..z+h. The light comes from the back left, so the right-facing side is darkest
const box = (x: number, y: number, z: number, w: number, d: number, h: number, c: string): Item[] => [
  face([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], shade(c, -0.1)),
  face([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], shade(c, -0.24)),
  face([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c),
];
//a wall, its top sliced through
const wall = (x: number, y: number, w: number, d: number, h: number): Item[] => [...box(x, y, 0, w, d, h, C.wall).slice(0, 2), face([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]], C.cut)];
//flat on the floor or a tabletop at height z
const flat = (x: number, y: number, w: number, d: number, z: number, c: string) => face([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], c);
//flat on the back right wall (y = 0) or the back left wall (x = 0), shaded like the wall
const onBack = (x: number, z: number, w: number, h: number, c: string) => face([[x, 0, z], [x + w, 0, z], [x + w, 0, z + h], [x, 0, z + h]], shade(c, -0.1));
const onLeft = (y: number, z: number, d: number, h: number, c: string) => face([[0, y, z], [0, y + d, z], [0, y + d, z + h], [0, y, z + h]], shade(c, -0.24));
//something round, standing at x, y
const cyl = (x: number, y: number, z: number, r: number, h: number, c: string): Item[] => {
  const [cx, by] = P(x, y, z);
  const ty = by - h * S;
  const rx = r * S * 1.2247;
  const ry = r * S * 0.7071;
  return [
    { d: `M ${cx - rx} ${ty} L ${cx - rx} ${by} A ${rx} ${ry} 0 0 0 ${cx + rx} ${by} L ${cx + rx} ${ty} Z`, fill: shade(c, -0.18), stroke: EDGE, w: 0.8 },
    { d: ellipse(cx, ty, rx, ry), fill: c, stroke: EDGE, w: 0.8 },
  ];
};

//a peg doll standing (or sitting) at x, y, z, facing screen right (dir 1) or left (-1). Lying down, it's just a head on
//the pillow; whoever draws the bed draws the duvet over the rest
type Pose = 'stand' | 'sit' | 'down' | 'cry' | 'lie';
interface Look {
  top: string;
  legs: string;
  hair: string;
  skin: string;
  curls?: boolean;
}

function peg(x: number, y: number, z: number, { top, legs, hair, skin, curls }: Look, pose: Pose = 'stand', dir = 1): Item[] {
  const [sx, sy] = P(x, y, z);
  const out: Item[] = [];
  let hx = sx;
  let hy = sy - 4;
  if (pose !== 'lie') {
    const seated = pose !== 'stand';
    const t = sy - (seated ? 30 : 50);
    //lap and shins, down to the floor
    if (seated) out.push(stroke(legs, `M ${sx} ${sy - 5} L ${sx + dir * 15} ${sy - 3} L ${sx + dir * 17} ${sy + z * S - 3}`, 10));
    const body = (bottom: number) => `M ${sx - 11} ${bottom} L ${sx - 10} ${t + 9} Q ${sx - 10} ${t} ${sx} ${t} Q ${sx + 10} ${t} ${sx + 10} ${t + 9} L ${sx + 11} ${bottom} Q ${sx} ${bottom + 5} ${sx - 11} ${bottom} Z`;
    if (!seated) out.push({ d: body(sy), fill: legs });
    out.push({ d: body(seated ? sy : sy - 18), fill: top });
    out.push({ d: `M ${sx + 3} ${sy + 3} L ${sx + 4} ${t + 1} Q ${sx + 10} ${t + 1} ${sx + 10} ${t + 9} L ${sx + 11} ${sy} Z`, fill: '#000', op: 0.12 });
    hy = t - 10;
    if (pose === 'down' || pose === 'cry') {
      hy += 4;
      hx += dir * 3;
    }
  }
  out.push({ d: circle(hx, hy, 11), fill: skin });
  out.push({ d: `M ${hx - 11.5} ${hy + 1} A 11.5 11.5 0 0 1 ${hx + 11.5} ${hy + 1} Q ${hx + dir * 3} ${hy - 6} ${hx - 11.5} ${hy + 1} Z`, fill: hair });
  out.push({ d: circle(hx - dir * 7, hy - 1, 6), fill: hair });
  if (curls) for (const [cx, cy] of [[-9, -6], [-3, -11], [4, -11], [9, -6]]) out.push({ d: circle(hx + cx, hy + cy, 4.5), fill: hair });
  if (pose === 'stand' || pose === 'sit') {
    out.push({ d: `${circle(hx + dir * 2.5, hy + 2, 1.5)} ${circle(hx + dir * 7.5, hy + 2, 1.5)}`, fill: C.ink });
  } else {
    out.push(stroke(C.ink, `M ${hx + dir * 1} ${hy + 3} q ${dir * 2} 1.5 ${dir * 4} 0 M ${hx + dir * 6} ${hy + 3} q ${dir * 2} 1.5 ${dir * 4} 0`, 1.4));
  }
  out.push({ d: circle(hx + dir * 6, hy + 6.5, 2.6), fill: '#e9897a', op: 0.5 });
  if (pose === 'cry') {
    const tear = (tx: number, ty: number) => `M ${tx} ${ty} q -2.5 4 0 5 q 2.5 -1 0 -5 Z`;
    out.push({ d: tear(hx + dir * 4, hy + 6), fill: '#7cc0e8', cls: 'hg-tear' });
    out.push({ d: tear(hx + dir * 9, hy + 6), fill: '#7cc0e8', cls: 'hg-tear hg-tear-1' });
  }
  return out;
}

const YOU: Look = { top: C.red, legs: '#3d4a66', hair: '#5a3b26', skin: '#f1c9a5' };
const RORY: Look = { top: C.mustard, legs: '#6b6f78', hair: '#2b2420', skin: '#c98e64', curls: true };

//a card at the side of the screen, pointing at something in the house
function callout(at: Pt, x: number, y: number, w: number, h: number, fill: string, inside: Item[]): Item[] {
  const [tx, ty] = at;
  const ex = tx < x ? x : x + w;
  const ey = Math.min(Math.max(ty, y + 24), y + h - 24);
  return [
    { d: circle(tx, ty, 14), stroke: C.ink, w: 2 },
    { d: line([tx + Math.sign(ex - tx) * 14, ty], [ex, ey]), stroke: C.ink, w: 1.5, dash: '5 4' },
    { d: rect(x + 4, y + 7, w, h), fill: '#000', op: 0.16 },
    { d: rect(x, y, w, h), fill, stroke: EDGE, w: 1 },
    ...inside,
  ];
}

//three wisps rising from x, y
const steam = ([x, y]: Pt): Item[] =>
  [-6, 0, 6].map((dx, i) => ({ d: `M ${x + dx} ${y} q -5 -8 0 -16 t 0 -16`, stroke: '#ffffff', w: 2.5, op: 0.85, cls: `hg-steam hg-steam-${i}` }));

//pseudo-random but fixed, so the stars always come out the same
const rand = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ---------------------------------------------------------------------------
// the house, back to front
// ---------------------------------------------------------------------------

const PHONE = P(0.62, 4.35, 0.5);
const ON_TABLE = 0.852;

const ART: Record<string, Item[]> = {
  house: [
    ...box(-0.25, -0.25, -0.35, 10.25, 7.25, 0.35, C.slab),
    flat(0, 0, 6.5, 7, 0, C.floor),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => stroke(C.plank, line(P(0, i / 2), P(6.5, i / 2)), 1)),
    flat(0, 0, 4.6, 1.6, 0.002, C.tile),
    ...[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((x) => stroke('#cdd5d2', line(P(x, 0, 0.002), P(x, 1.6, 0.002)), 1)),
    ...[0.4, 0.8, 1.2].map((y) => stroke('#cdd5d2', line(P(0, y, 0.002), P(4.6, y, 0.002)), 1)),
    flat(6.5, 0, 3.5, 7, 0, C.carpet),
    ...wall(-0.25, -0.25, 10.25, 0.25, WALL),
    ...wall(-0.25, 0, 0.25, 7, WALL),
    //the living room window, with curtains
    onBack(4.8, 1.0, 1.2, 1.1, C.frame),
    onBack(4.88, 1.08, 1.04, 0.94, C.glass),
    stroke(C.frame, line(P(5.4, 0, 1.08), P(5.4, 0, 2.02)), 3),
    ...box(4.72, 0, 0.96, 1.36, 0.12, 0.05, C.frame),
    onBack(4.5, 0.85, 0.3, 1.4, C.curtain),
    onBack(6.0, 0.85, 0.3, 1.4, C.curtain),
    //your window
    onBack(7.9, 1.35, 1.0, 0.95, C.frame),
    onBack(7.98, 1.43, 0.84, 0.79, C.glass),
    stroke(C.frame, line(P(8.4, 0, 1.43), P(8.4, 0, 2.22)), 3),
    //a picture over the sofa
    onLeft(4.3, 1.45, 1.0, 0.7, C.frame),
    onLeft(4.38, 1.53, 0.84, 0.54, C.glass),
    onLeft(4.38, 1.53, 0.84, 0.22, C.leaf),
    //the front door, coats, and the doormat
    onLeft(1.25, 0, 1.1, 2.08, C.frame),
    onLeft(1.3, 0, 1.0, 2.0, C.door),
    onLeft(1.42, 1.12, 0.76, 0.72, shade(C.door, 0.15)),
    onLeft(1.42, 0.2, 0.76, 0.72, shade(C.door, 0.15)),
    { d: circle(...P(0, 2.15, 1.0), 3), fill: C.brass },
    stroke(C.woodDark, line(P(0, 2.55, 1.75), P(0, 3.25, 1.75)), 3),
    onLeft(2.65, 1.0, 0.36, 0.72, C.blue),
    flat(0.05, 1.35, 0.7, 0.9, 0.004, C.mat),
    //rugs
    flat(1.6, 3.5, 2.9, 3.0, 0.004, C.rug),
    flat(1.75, 3.65, 2.6, 2.7, 0.005, C.rug2),
    flat(1.9, 3.8, 2.3, 2.4, 0.006, C.rug),
    flat(7.6, 3.0, 1.8, 1.8, 0.004, C.pink),
  ],
  postcard: [flat(0.22, 1.55, 0.45, 0.3, 0.006, C.paper), flat(0.24, 1.58, 0.1, 0.1, 0.007, C.teal)],
  front_open: [onLeft(1.3, 0, 1.0, 2.0, '#4a4658'), ...box(0, 1.3, 0, 0.9, 0.08, 2.0, C.door)],
  kitchen: [
    ...box(0, 0, 0, 3.6, 0.9, 1.0, C.counter),
    ...[0.9, 1.8, 2.7].map((x) => stroke(shade(C.counter, -0.35), line(P(x, 0.9, 0.08), P(x, 0.9, 0.92)), 1.2)),
    ...box(0, 0, 1.0, 3.62, 0.95, 0.1, C.worktop),
    flat(0.2, 0.15, 0.9, 0.6, 1.101, C.dark),
    ...[[0.42, 0.32], [0.86, 0.32], [0.42, 0.6], [0.86, 0.6]].map(([x, y]) => stroke('#6b6670', ellipse(...P(x, y, 1.102), 9, 5), 1.5)),
    flat(1.75, 0.18, 0.75, 0.55, 1.101, C.steel),
    flat(1.81, 0.24, 0.63, 0.43, 1.102, shade(C.steel, -0.2)),
    stroke(C.steel, line(P(2.12, 0.08, 1.1), P(2.12, 0.08, 1.38), P(2.12, 0.26, 1.38)), 3),
    ...box(0, 0, 1.65, 3.6, 0.42, 0.65, C.counter),
    ...[0.9, 1.8, 2.7].map((x) => stroke(shade(C.counter, -0.35), line(P(x, 0.42, 1.7), P(x, 0.42, 2.25)), 1.2)),
    ...cyl(1.4, 0.55, 1.1, 0.13, 0.26, C.kettle),
    ...box(3.65, 0, 0, 0.85, 0.85, 2.0, C.fridge),
    stroke(shade(C.fridge, -0.3), line(P(3.65, 0.85, 1.3), P(4.5, 0.85, 1.3)), 1.2),
    stroke(C.steel, line(P(3.78, 0.85, 1.4), P(3.78, 0.85, 1.75)), 2.5),
    stroke(C.steel, line(P(3.78, 0.85, 0.9), P(3.78, 0.85, 1.2)), 2.5),
    //a plant by the window
    ...cyl(6.05, 0.5, 0, 0.2, 0.35, C.pot),
    { d: circle(...P(6.05, 0.5, 0.95), 14), fill: C.leaf },
    { d: circle(P(6.05, 0.5, 0.75)[0] - 12, P(6.05, 0.5, 0.75)[1], 10), fill: C.green },
    { d: circle(P(6.05, 0.5, 0.75)[0] + 11, P(6.05, 0.5, 0.75)[1] - 2, 11), fill: C.green },
  ],
  drainer: [
    flat(2.6, 0.2, 0.75, 0.5, 1.102, shade(C.steel, 0.3)),
    ...[0, 1, 2].flatMap((i) => box(2.68 + i * 0.12, 0.25, 1.1, 0.03, 0.4, 0.3, C.white)),
    ...cyl(3.15, 0.35, 1.1, 0.08, 0.14, C.mustard),
    ...cyl(3.2, 0.6, 1.1, 0.08, 0.14, C.teal),
  ],
  steam: steam(P(1.4, 0.55, 1.42)),
  airer: [
    ...[[4.55, 1.3], [5.6, 1.3], [4.55, 1.6], [5.6, 1.6]].map(([x, y]) => stroke(C.steel, line(P(x, y, 0), P(x, y, 1.05)), 2)),
    stroke(C.steel, line(P(4.55, 1.45, 1.05), P(5.6, 1.45, 1.05)), 2),
    ...box(4.6, 1.42, 0.55, 0.95, 0.04, 0.5, C.teal),
    ...box(4.7, 1.5, 0.62, 0.5, 0.04, 0.42, C.pillow),
  ],
  you_sink: peg(2.0, 1.25, 0, YOU, 'stand', 1),
  rory_sink: peg(2.0, 1.25, 0, RORY, 'stand', 1),
  rory_cook: peg(1.3, 1.25, 0, RORY, 'stand', -1),
  rory_door: peg(0.12, 1.8, 0, RORY, 'stand', 1),
  bags_door: [
    ...box(0.15, 2.45, 0, 0.6, 0.32, 0.3, C.teal),
    stroke(shade(C.teal, -0.4), `M ${P(0.3, 2.61, 0.3).join(' ')} q 7 -12 14 -2`, 2.5),
    (([bx, by]) => ({ d: `M ${bx - 16} ${by} Q ${bx - 20} ${by - 26} ${bx - 4} ${by - 30} L ${bx - 2} ${by - 38} L ${bx + 3} ${by - 30} Q ${bx + 20} ${by - 24} ${bx + 15} ${by} Q ${bx} ${by + 6} ${bx - 16} ${by} Z`, fill: '#2f3136' }))(P(0.55, 3.05)),
    //the guitar, leaning on the wall
    (([gx, gy]) => stroke(C.woodDark, line([gx - 1, gy - 40], [gx - 6, gy - 84]), 5))(P(0.15, 3.35)),
    (([gx, gy]) => ({ d: `${circle(gx, gy - 14, 14)} ${circle(gx - 1, gy - 34, 10)}`, fill: C.wood }))(P(0.15, 3.35)),
    (([gx, gy]) => ({ d: circle(gx - 0.5, gy - 22, 4), fill: C.ink }))(P(0.15, 3.35)),
  ],
  rory_in: peg(0.85, 1.85, 0, RORY, 'stand', 1),
  you_front: peg(0.85, 1.85, 0, YOU, 'stand', 1),
  you_greet: peg(1.3, 2.0, 0, YOU, 'stand', -1),
  table: [
    ...[[2.25, 2.45], [3.3, 2.45], [2.25, 3.3], [3.3, 3.3]].flatMap(([x, y]) => box(x, y, 0, 0.07, 0.07, 0.78, C.woodDark)),
    ...box(2.2, 2.4, 0.78, 1.2, 1.0, 0.07, C.wood),
    ...cyl(3.75, 2.9, 0, 0.2, 0.46, C.wood),
    ...cyl(2.8, 3.85, 0, 0.2, 0.46, C.wood),
  ],
  mugs_table: [...cyl(2.95, 3.1, 0.85, 0.08, 0.15, C.white), ...cyl(3.2, 2.7, 0.85, 0.08, 0.15, C.teal), ...steam(P(2.95, 3.1, 1.05)), ...steam(P(3.2, 2.7, 1.05))],
  phone_down: [flat(3.0, 2.55, 0.12, 0.24, ON_TABLE, C.black)],
  envelope: [
    flat(2.4, 2.6, 0.5, 0.32, ON_TABLE, C.envelope),
    stroke(shade(C.envelope, -0.3), line(P(2.4, 2.6, ON_TABLE), P(2.65, 2.76, ON_TABLE), P(2.9, 2.6, ON_TABLE)), 1),
  ],
  note: [flat(2.55, 2.75, 0.32, 0.24, ON_TABLE, C.paper), stroke(C.ink, line(P(2.6, 2.82, ON_TABLE), P(2.8, 2.82, ON_TABLE)), 1), stroke(C.ink, line(P(2.6, 2.9, ON_TABLE), P(2.75, 2.9, ON_TABLE)), 1)],
  rory_stool: peg(3.75, 2.9, 0.46, RORY, 'sit', -1),
  rory_down: peg(3.75, 2.9, 0.46, RORY, 'down', -1),
  rory_cry: peg(3.75, 2.9, 0.46, RORY, 'cry', -1),
  you_stool: peg(2.8, 3.85, 0.46, YOU, 'sit', 1),
  you_by_table: peg(3.4, 3.95, 0, YOU, 'stand', -1),
  living: [
    ...box(0, 3.6, 0, 1.1, 0.25, 0.8, C.sofa),
    ...box(0, 3.85, 0, 1.1, 1.9, 0.5, C.sofa),
    stroke(shade(C.sofa, -0.3), line(P(0.32, 4.8, 0.5), P(1.1, 4.8, 0.5)), 1.2),
    ...box(0, 3.85, 0.5, 0.32, 1.9, 0.6, C.cushion),
    ...box(2.9, 4.2, 0, 1.1, 1.2, 0.42, C.wood),
    ...box(5.75, 4.0, 0, 0.55, 1.6, 0.45, C.woodDark),
    ...box(6.0, 4.15, 0.47, 0.08, 1.3, 0.75, C.black),
  ],
  towels: [
    face([[4.5, 3.0, 0.01], [5.25, 2.9, 0.01], [5.4, 3.45, 0.01], [4.6, 3.6, 0.01]], C.teal),
    stroke(C.pillow, line(P(4.55, 3.3, 0.01), P(5.32, 3.18, 0.01)), 3),
    face([[1.0, 6.4, 0.01], [1.6, 6.3, 0.01], [1.7, 6.75, 0.01], [1.05, 6.85, 0.01]], C.pillow),
  ],
  sofa_bed: [
    ...box(2.5, 3.9, 0, 0.08, 0.08, 0.5, C.metal),
    ...box(2.5, 5.65, 0, 0.08, 0.08, 0.5, C.metal),
    ...box(0.32, 3.85, 0.5, 2.3, 1.9, 0.12, C.white),
    ...box(0.36, 4.2, 0.62, 0.45, 0.8, 0.12, C.pillow),
    ...box(0.9, 3.9, 0.62, 1.7, 1.8, 0.08, C.duvetR),
    stroke(shade(C.duvetR, -0.25), line(P(1.6, 3.9, 0.7), P(1.5, 5.7, 0.7)), 1.5),
  ],
  clothes: [...box(0.2, 4.05, 0.7, 0.14, 0.42, 0.46, C.blue), ...box(0.2, 5.05, 0.78, 0.14, 0.5, 0.36, C.mustard)],
  rory_asleep: [...peg(0.6, 4.62, 0.74, RORY, 'lie', 1), ...box(0.95, 4.15, 0.7, 1.5, 1.0, 0.12, C.duvetR)],
  you_sofa: peg(0.62, 4.35, 0.5, YOU, 'sit', 1),
  phone: [{ d: rect(PHONE[0] + 13, PHONE[1] - 24, 8, 12), fill: C.black }, { d: rect(PHONE[0] + 14.5, PHONE[1] - 22.5, 5, 9), fill: '#bfe3ff' }],
  rory_sofa: peg(0.62, 5.25, 0.5, RORY, 'sit', 1),
  sofa_arm: box(0, 5.75, 0, 1.1, 0.25, 0.8, C.sofa),
  lamp: [
    ...cyl(0.45, 6.45, 0, 0.17, 0.04, C.metal),
    stroke(C.metal, line(P(0.45, 6.45, 0.04), P(0.45, 6.45, 1.5)), 3),
    ...cyl(0.45, 6.45, 1.45, 0.27, 0.35, C.lampShade),
  ],
  pile: [
    ...[C.teal, C.mustard, C.blue, C.pillow].flatMap((c, i) => box(1.3, 6.15, i * 0.1, 0.6, 0.45, 0.1, c)),
    flat(1.45, 6.25, 0.2, 0.2, 0.401, '#f4d35e'),
  ],
  heap: (([cx, cy]) =>
    ([[-14, -8, 12, C.blue], [8, -6, 13, C.mustard], [-2, -20, 12, C.teal], [16, -18, 9, C.pillow], [-6, -32, 8, C.pink]] as const).map(([dx, dy, r, c]) => ({
      d: circle(cx + dx, cy + dy, r),
      fill: c,
      stroke: EDGE,
      w: 0.8,
    })))(P(1.65, 6.4)),
  rory_by: peg(2.3, 6.8, 0, RORY, 'stand', -1),
  mugs_coffee: [
    ...cyl(3.1, 4.45, 0.42, 0.08, 0.14, C.white),
    ...cyl(3.45, 4.4, 0.42, 0.08, 0.14, C.pink),
    ...cyl(3.2, 4.9, 0.42, 0.08, 0.14, C.teal),
    ...cyl(3.7, 4.8, 0.42, 0.08, 0.14, C.white),
    ...cyl(3.7, 4.8, 0.56, 0.08, 0.14, C.mustard),
    ...cyl(3.7, 4.8, 0.7, 0.08, 0.14, C.blue),
  ],
  takeaway: [...box(3.1, 5.0, 0.42, 0.35, 0.28, 0.18, C.white), ...box(3.55, 5.05, 0.42, 0.3, 0.25, 0.15, C.white), stroke(C.wood, line(P(3.2, 5.1, 0.62), P(3.5, 4.95, 0.75)), 1.5)],
  mess_more: [
    ...box(2.4, 5.6, 0, 0.8, 0.8, 0.06, C.cardboard),
    ...box(2.45, 5.55, 0.06, 0.8, 0.8, 0.06, C.cardboard),
    ...cyl(3.85, 4.4, 0.42, 0.06, 0.16, C.green),
    ...cyl(3.4, 5.25, 0.42, 0.06, 0.16, C.green),
    face([[4.2, 5.0, 0.01], [4.8, 4.9, 0.01], [4.9, 5.4, 0.01], [4.25, 5.5, 0.01]], C.blue),
    face([[2.0, 4.3, 0.01], [2.4, 4.2, 0.01], [2.5, 4.5, 0.01], [2.05, 4.6, 0.01]], C.pink),
    ...cyl(4.4, 4.3, 0, 0.08, 0.14, C.pink),
    ...cyl(5.9, 4.3, 0.45, 0.08, 0.14, C.white),
  ],
  plates: [...cyl(3.2, 4.55, 0.42, 0.17, 0.05, C.white), ...cyl(3.6, 5.0, 0.42, 0.17, 0.05, C.white), { d: ellipse(...P(3.2, 4.55, 0.47), 10, 5), fill: C.curtain }, { d: ellipse(...P(3.6, 5.0, 0.47), 10, 5), fill: C.curtain }],
  you_mess: peg(4.6, 5.8, 0, YOU, 'stand', -1),
  partition: [...wall(6.5, 0, 0.2, 2.9, CUT), ...wall(6.5, 3.9, 0.2, 3.1, CUT)],
  bedroom: [
    ...box(6.8, 0.05, 0, 0.5, 0.5, 0.6, C.wood),
    ...cyl(7.05, 0.3, 0.6, 0.06, 0.22, C.metal),
    ...cyl(7.05, 0.3, 0.8, 0.16, 0.2, C.lampShade),
    ...box(7.4, 0, 0, 2.0, 0.12, 1.2, C.wood),
    ...box(7.4, 0.12, 0, 2.0, 2.4, 0.32, C.wood),
    ...box(7.45, 0.15, 0.32, 1.9, 2.3, 0.25, C.white),
    ...box(7.6, 0.22, 0.57, 0.8, 0.45, 0.13, C.pillow),
    ...box(8.5, 0.22, 0.57, 0.8, 0.45, 0.13, C.pillow),
    ...box(7.42, 0.8, 0.57, 1.96, 1.75, 0.12, C.duvet),
    ...box(9.45, 3.2, 0, 0.55, 1.3, 0.75, C.white),
    ...box(9.55, 3.5, 0.75, 0.3, 0.4, 0.03, C.metal),
    ...cyl(9.05, 3.85, 0, 0.18, 0.45, C.teal),
    ...box(6.7, 4.6, 0, 0.3, 1.6, 1.3, C.wood),
    ...[0.15, 0.75].flatMap((z) =>
      [C.blue, C.pink, C.green, C.curtain, C.teal, C.white, C.cut].map((c, i) =>
        face([[7.0, 4.68 + i * 0.2, z], [7.0, 4.84 + i * 0.2, z], [7.0, 4.84 + i * 0.2, z + 0.4], [7.0, 4.68 + i * 0.2, z + 0.4]], shade(c, -0.15)),
      ),
    ),
  ],
  door_shut: [...box(6.54, 2.9, 0, 0.12, 1.0, CUT, C.door), { d: circle(...P(6.66, 3.75, 0.7), 2.5), fill: C.brass }],
  door_open: box(6.7, 2.9, 0, 0.95, 0.08, CUT, C.door),
  you_lie: [...peg(8.0, 0.5, 0.7, YOU, 'lie', 1), ...box(7.6, 1.0, 0.69, 1.4, 1.0, 0.12, C.duvet)],
  you_bed: peg(8.4, 2.3, 0.69, YOU, 'sit', -1),
  you_room: peg(7.25, 3.45, 0, YOU, 'stand', 1),

  //on top of the tint
  glow_lamp: [glow('warm', P(0.45, 6.45, 1.6), 170)],
  glow_phone: [glow('cool', [PHONE[0] + 17, PHONE[1] - 18], 50)],
  glow_hall: [glow('warm', P(0, 1.8, 2.15), 130)],
  glow_kitchen: [glow('warm', P(1.8, 0.5, 1.4), 190)],
  glow_tv: [glow('cool', P(6.0, 4.8, 0.9), 160, 'hg-flicker')],
  glow_bedside: [glow('warm', P(7.05, 0.3, 0.9), 130)],
  glow_moon: [glow('cool', P(5.4, 0, 1.55), 140)],
  glow_dawn: [glow('dawn', P(5.4, 0, 1.55), 230)],
  call_priya: callout([PHONE[0] + 17, PHONE[1] - 18], 80, 110, 390, 180, C.paper, [
    words('Sana', 104, 148, 20, { anchor: 'start', bold: true }),
    words('Huge favor. My friend Rory needs', 104, 182, 17, { anchor: 'start' }),
    words('somewhere to stay for a week. Rough', 104, 206, 17, { anchor: 'start' }),
    words('patch. Could they crash on your couch?', 104, 230, 17, { anchor: 'start' }),
    words("They're really sweet, I promise!", 104, 254, 17, { anchor: 'start' }),
  ]),
  call_list: callout(P(2.65, 2.76, ON_TABLE), 1170, 130, 350, 210, C.envelope, [
    stroke(shade(C.envelope, -0.25), line([1170, 130], [1345, 195], [1520, 130]), 1.5),
    words('1. apartment listings', 1196, 245, 25, { anchor: 'start', hand: true }),
    words('2. call Mel in Portland', 1196, 280, 25, { anchor: 'start', hand: true }),
    words('3. lawyer (free consult)', 1196, 315, 25, { anchor: 'start', hand: true }),
  ]),
  call_note: callout(P(2.71, 2.87, ON_TABLE), 1170, 140, 340, 180, C.paper, [
    words('Thanks for having me.', 1194, 196, 27, { anchor: 'start', hand: true }),
    words('Sorry about the mess.', 1194, 238, 27, { anchor: 'start', hand: true }),
    words('-R', 1194, 286, 27, { anchor: 'start', hand: true }),
  ]),
  call_postcard: callout(P(0.45, 1.7), 70, 100, 420, 240, C.paper, [
    words('GREETINGS FROM PORTLAND', 94, 134, 14, { anchor: 'start', bold: true, c: C.teal }),
    words("Kettle's on,", 94, 196, 30, { anchor: 'start', hand: true }),
    words('whenever.', 94, 238, 30, { anchor: 'start', hand: true }),
    words('-R', 94, 290, 30, { anchor: 'start', hand: true }),
    stroke(EDGE, line([300, 150], [300, 320]), 1.5),
    { d: rect(410, 116, 56, 66), fill: C.teal, stroke: C.white, w: 3, dash: '4 3' },
    ...[230, 268, 306].map((y) => stroke(EDGE, line([320, y], [466, y]), 1.5)),
  ]),
};
const ORDER = Object.keys(ART);
const onTop = (part: string) => part.startsWith('glow_') || part.startsWith('call_');

//the outline of the whole house, for the tint
const SILHOUETTE = poly(P(-0.25, -0.25, WALL), P(10, -0.25, WALL), P(10, -0.25, -0.35), P(10, 7, -0.35), P(-0.25, 7, -0.35), P(-0.25, 7, WALL));
const FOOTPRINT = poly(P(-0.25, -0.25, -0.65), P(10, -0.25, -0.65), P(10, 7, -0.65), P(-0.25, 7, -0.65));
const STARS = Array.from({ length: 40 }, (_, i) => [rand(i) * W, rand(i + 100) * 300, 0.8 + rand(i + 200) * 1.6]);

// ---------------------------------------------------------------------------
// a cue, and its parts
// ---------------------------------------------------------------------------

function Mark({ item }: { item: Item }) {
  if ('text' in item) {
    return (
      <text style={{ fontFamily: item.hand ? HAND : SANS, fontWeight: item.bold ? 700 : 400, letterSpacing: item.bold ? 1 : 0 }} x={item.x} y={item.y} fontSize={item.size} textAnchor={item.anchor ?? 'middle'} fill={item.c}>
        {item.text}
      </text>
    );
  }
  if ('glow' in item) return <ellipse className={item.cls} cx={item.x} cy={item.y} rx={item.r} ry={item.r * 0.8} fill={`url(#hg-${item.glow})`} />;
  return (
    <path
      className={item.cls}
      style={item.cls ? { transformBox: 'fill-box', transformOrigin: 'center' } : undefined}
      d={item.d}
      fill={item.fill ?? 'none'}
      stroke={item.stroke}
      strokeWidth={item.w}
      strokeDasharray={item.dash}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={item.op}
    />
  );
}

interface Shown {
  cue: Cue;
  starts: Record<string, number>; //when each part dropped in, in seconds after it appeared
}

//new parts drop in one after another, a beat after anything leaving has lifted out
function startTimes(parts: string[], from: number) {
  return Object.fromEntries(parts.map((part, i) => [part, from + i * PART_GAP]));
}

function turn(shown: Shown, cue: Cue): Shown {
  const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
  const leaving = shown.cue.parts.some((p) => !cue.parts.includes(p));
  return { cue, starts: { ...shown.starts, ...startTimes(added, leaving ? 0.35 : 0.1) } };
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  fridge: new URL('./sounds/fridge.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//a quiet flat by day; at night, mostly the fridge
function mixFor(cue: Cue): Partial<Record<Bed, number>> {
  if (cue.time === 'night' || cue.time === 'dawn') return { fridge: 0.55, room: 0.25 };
  return { room: 0.7 };
}

const DOOR: OneShot = { src: new URL('./sounds/door.m4a', import.meta.url).href, volume: 0.6, delay: 1 };
const ONE_SHOTS: Record<string, OneShot> = {
  message: { src: new URL('./sounds/message.m4a', import.meta.url).href, volume: 0.5, delay: 1.2 },
  arrival: { src: new URL('./sounds/bell.m4a', import.meta.url).href, volume: 0.7, delay: 0.4 },
  mess_tidy: { src: new URL('./sounds/plates.m4a', import.meta.url).href, volume: 0.7, delay: 1 },
  eve_door: DOOR,
  night_bed: DOOR,
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Dollhouse({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Cue }>(() => ({ now: { cue: cues[first], starts: startTimes(cues[first].parts, 0.3) } }));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setView((v) => ({ now: turn(v.now, cues[animation]), prev: v.now.cue }));
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Houseguest has no cue for the animation "${animation}"`);
  }, [animation]);

  const sound = useRef<Soundscape<Bed> | null>(null);
  useEffect(() => {
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;
    return () => {
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    sound.current?.mix(mixFor(cues[active]));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { now, prev } = view;
  const { time, parts, card } = now.cue;
  const leaving = prev ? prev.parts.filter((p) => !parts.includes(p)) : [];
  //each part is a layer: the ones with something moving get svgs of their own, and pools of light screen onto the house
  const layer = (top: boolean): Layer[] =>
    ORDER.filter((p) => onTop(p) === top && (parts.includes(p) || leaving.includes(p))).map((p) => {
      const on = parts.includes(p);
      const glow = p.startsWith('glow_');
      return {
        key: p,
        moving: ART[p].some((item) => 'cls' in item && item.cls) ? p : undefined,
        blend: glow ? 'screen' : undefined,
        node: (
          <g className={on ? (top ? 'hg-fade' : 'hg-drop') : 'hg-lift'} style={{ animationDelay: on ? `${now.starts[p]}s` : '0s', mixBlendMode: glow ? 'screen' : undefined }}>
            {ART[p].map((item, i) => (
              <Mark key={i} item={item} />
            ))}
          </g>
        ),
      };
    });
  //the evening and night tint multiplies onto the house, between the rooms and what sits on top of them
  const tint: Layer = {
    key: 'tint',
    blend: 'multiply',
    node: <path d={SILHOUETTE} style={{ fill: TINT[time], transition: 'fill 1.5s ease' }} />,
  };
  const night = time === 'night';
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="hg-warm">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hg-cool">
            <stop offset="0" stopColor="#a8c6ff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#a8c6ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hg-dawn">
            <stop offset="0" stopColor="#ffc7b5" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffc7b5" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hg-vignette" cx="0.5" cy="0.4" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.25" />
          </radialGradient>
          <filter id="hg-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <rect width={W} height={H} style={{ fill: SKY[time], transition: 'fill 1.5s ease' }} />
        <g style={{ opacity: night ? 1 : 0, transition: 'opacity 1.5s ease' }}>
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#f4f1de" />
          ))}
          <circle cx={1390} cy={110} r={26} fill="#f4f1de" />
          <circle cx={1402} cy={102} r={22} fill={SKY.night} />
        </g>
        <circle cx={1390} cy={110} r={38} style={{ fill: time === 'evening' ? '#f6a46a' : '#fff6dc', opacity: night ? 0 : 0.9, transition: 'fill 1.5s ease, opacity 1.5s ease' }} />
        <path d={FOOTPRINT} fill="#2b1d10" opacity={0.3} filter="url(#hg-blur)" />
      </svg>
      <Layers viewBox={VIEW} layers={[...layer(false), tint, ...layer(true)]} />
      <Sheet viewBox={VIEW}>
        <rect width={W} height={H} fill="url(#hg-vignette)" />
      </Sheet>

      <div style={{ ...styles.card, opacity: card ? 1 : 0 }}>
        {card && (
          <div style={styles.mat}>
            <div style={styles.kicker}>{card[0]}</div>
            <div style={styles.name}>{card[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.hg-drop {
  animation: hg-drop 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) backwards;
}
@keyframes hg-drop {
  from { opacity: 0; transform: translateY(-36px); }
  30% { opacity: 1; }
}
.hg-fade {
  animation: hg-fade 1s ease backwards;
}
@keyframes hg-fade {
  from { opacity: 0; }
}
.hg-lift {
  animation: hg-lift 0.4s ease-in forwards;
}
@keyframes hg-lift {
  to { opacity: 0; transform: translateY(-18px); }
}
.hg-steam {
  animation: hg-steam 2.4s ease-out infinite;
}
.hg-steam-1 { animation-delay: -0.8s; }
.hg-steam-2 { animation-delay: -1.6s; }
@keyframes hg-steam {
  from { opacity: 0; transform: translateY(6px); }
  30% { opacity: 0.85; }
  to { opacity: 0; transform: translateY(-14px); }
}
.hg-tear {
  animation: hg-tear 1.6s ease-in infinite;
}
.hg-tear-1 { animation-delay: -0.8s; }
@keyframes hg-tear {
  from { opacity: 0; transform: translateY(0); }
  20% { opacity: 1; }
  to { opacity: 0; transform: translateY(16px); }
}
.hg-flicker {
  animation: hg-flicker 2.2s steps(1) infinite;
}
@keyframes hg-flicker {
  30% { opacity: 0.7; }
  45% { opacity: 1; }
  70% { opacity: 0.8; }
}
`;

const SANS = "'Avenir Next', 'Futura', 'Century Gothic', 'Segoe UI', sans-serif";
const HAND = "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive";

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: SKY.day,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  //a coir doormat
  mat: {
    textAlign: 'center',
    padding: '20px 56px 26px',
    color: '#3e2814',
    background: '#b48a52',
    backgroundImage: 'repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.09) 0 2px, transparent 2px 5px), repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.07) 0 2px, transparent 2px 6px)',
    border: '10px solid #6e4b2a',
    borderRadius: 14,
    boxShadow: '0 8px 22px rgba(43, 29, 16, 0.4)',
  },
  kicker: {
    fontFamily: SANS,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 4,
    textTransform: 'uppercase',
    paddingBottom: 4,
  },
  name: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 80,
    fontWeight: 700,
    lineHeight: 1.05,
  },
};

export default Dollhouse;
