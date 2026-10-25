import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Layers, Sheet, type Layer } from '../layers';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Emergency is told on a fire safety card, the kind tucked in a seat pocket: a laminated card with a red header,
// numbered panels and captions in capitals, flat isometric rooms, faceless people in plain colours, ISO signs and
// thick red arrows. You're always the one in yellow. A cue names a room, its panel number and caption, and the parts
// to show: a new panel slides in, and new parts in the same panel pop in after it. While the real clock runs, smoke
// fills the panel. Everything is SVG in a fixed 1600x900 space, scaled to cover the screen, and the people keep to
// the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
const VIEW = `0 0 ${W} ${H}`;
type Pt = [number, number];
type V = [number, number, number];

const INK = '#1f2024';
const CARD = '#f2ecdc';
const PANEL = '#fbf8ef';
const SEAT = '#28323e';
const RED = '#c8262c';
const YELLOW = '#f2c12e';
const GREEN = '#2a8a52';
const BLUE = '#3b6ea8';
const WHITE = '#ffffff';
const SKIN = '#e6bb93';
const TROUSERS = '#414a5a';
const WALL_L = '#ece6d6';
const WALL_R = '#ddd5c0';
const WALL_TOP = '#bdb39e';
const DARK = '#3a3f47';
const STEEL = '#a8b0b8';
const UNIT = '#8fa8bd';
const WORKTOP = '#ebe6da';
const WOOD = '#c58f58';
const NIGHT = '#33435f';
const GLASS = '#bcd9e8';
const SMOKE = '#80868d';
const FLAME = '#ec5a24';
const FLAME_IN = '#f7c843';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//a shape, outlined in ink when it's filled, or a stroke when it has a line colour; or lettering. t is an svg transform
type Shape = { d: string; fill?: string; line?: string; w?: number; dash?: string; cls?: string; t?: string };
type Words = { text: string; x: number; y: number; size: number; fill?: string; weight?: number; anchor?: 'start' | 'middle' | 'end'; font?: string; t?: string };
type Item = Shape | Words;

const r1 = (n: number) => Math.round(n * 10) / 10;
const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map(r1).join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const circle = (x: number, y: number, r: number) => `M ${r1(x - r)} ${r1(y)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${r1(x - rx)} ${r1(y)} a ${r1(rx)} ${r1(ry)} 0 1 0 ${r1(2 * rx)} 0 a ${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-2 * rx)} 0`;
const say = (text: string, x: number, y: number, size: number, more: Partial<Words> = {}): Words => ({ text, x, y, size, ...more });

//a colour mixed towards white (k > 0) or black (k < 0)
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

//a flame standing on x, y: three tongues in orange round a yellow heart, flickering
const flameD = (x: number, y: number, w: number, h: number) =>
  `M ${r1(x - w / 2)} ${y} C ${r1(x - w / 2)} ${r1(y - h * 0.4)} ${r1(x - w * 0.32)} ${r1(y - h * 0.5)} ${r1(x - w * 0.26)} ${r1(y - h * 0.82)} ` +
  `C ${r1(x - w * 0.1)} ${r1(y - h * 0.6)} ${r1(x - w * 0.06)} ${r1(y - h * 0.72)} ${r1(x)} ${r1(y - h)} ` +
  `C ${r1(x + w * 0.1)} ${r1(y - h * 0.66)} ${r1(x + w * 0.2)} ${r1(y - h * 0.6)} ${r1(x + w * 0.3)} ${r1(y - h * 0.78)} ` +
  `C ${r1(x + w * 0.36)} ${r1(y - h * 0.5)} ${r1(x + w / 2)} ${r1(y - h * 0.4)} ${r1(x + w / 2)} ${y} Z`;
const flame = (x: number, y: number, w: number, h: number): Item[] => [
  { d: flameD(x, y, w, h), fill: FLAME, cls: 'ec-flame' },
  { d: flameD(x, y, w * 0.55, h * 0.6), fill: FLAME_IN, line: 'none', cls: 'ec-flame' },
];

//a puffy cloud: the circles outlined together, so it reads as one shape
const PUFFS: [number, number, number][] = [[-0.36, 0.08, 0.26], [-0.12, -0.12, 0.33], [0.18, -0.06, 0.3], [0.4, 0.1, 0.22], [0.04, 0.14, 0.3]];
const cloud = ([x, y]: Pt, w: number, fill = SMOKE, cls = 'ec-smoke'): Item[] => {
  const d = PUFFS.map(([dx, dy, r]) => circle(x + dx * w, y + dy * w, r * w)).join(' ');
  return [{ d, fill: INK, line: INK, w: 6, cls }, { d, fill, line: 'none', cls }];
};

//a thick arrow along two or three points, curved through the middle one
const arrow = (pts: Pt[], color = RED, w = 12): Item[] => {
  const [a, b, c] = pts;
  const end = c ?? b;
  const from = c ? b : a;
  const d = c ? `M ${a.join(' ')} Q ${b.join(' ')} ${c.join(' ')}` : line(a, b);
  const ang = Math.atan2(end[1] - from[1], end[0] - from[0]);
  const s = w * 2.2;
  const tip: Pt = [end[0] + Math.cos(ang) * s * 0.6, end[1] + Math.sin(ang) * s * 0.6];
  const side = (k: number): Pt => [end[0] + Math.cos(ang + k) * s * 0.7, end[1] + Math.sin(ang + k) * s * 0.7];
  return [{ d, line: INK, w: w + 6 }, { d, line: color, w }, { d: poly(tip, side(Math.PI / 2), side(-Math.PI / 2)), fill: color }];
};

//a jagged burst, with a word in it
const burst = (x: number, y: number, r: number, word: string, fill = YELLOW, size = r * 0.5, cls = 'ec-bang'): Item[] => {
  const pts: Pt[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const k = i % 2 ? 0.66 : 1;
    return [x + Math.cos(a) * r * k * 1.25, y + Math.sin(a) * r * k];
  });
  return [{ d: poly(...pts), fill, cls }, say(word, x, y + size * 0.36, size, { weight: 900 })];
};

//a speech bubble with its tail pointing down and left
const bubble = (x: number, y: number, w: number, word: string): Item[] => [
  { d: `${round(x, y, w, 64, 26)} M ${x + 30} ${y + 62} l -16 30 l 40 -30`, fill: WHITE },
  { d: `M ${x + 33} ${y + 60} h 22`, line: WHITE, w: 6 },
  say(word, x + w / 2, y + 42, 28, { weight: 900 }),
];

// ---------------------------------------------------------------------------
// signs, drawn in a 100-unit box at x, y, s wide
// ---------------------------------------------------------------------------

const at = (x: number, y: number, s: number) => `translate(${x} ${y}) scale(${s / 100})`;

function warnSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: 'M 50 6 L 96 88 L 4 88 Z', fill: YELLOW, w: 7, t },
    { d: flameD(50, 80, 34, 50), fill: INK, line: 'none', t },
  ];
}
function alarmSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: round(0, 0, 100, 100, 8), fill: RED, w: 4, t },
    { d: 'M 34 66 Q 34 32 50 30 Q 66 32 66 66 L 72 72 L 28 72 Z', fill: WHITE, line: 'none', t },
    { d: circle(50, 78, 5), fill: WHITE, line: 'none', t },
    { d: 'M 20 38 Q 12 52 20 66 M 80 38 Q 88 52 80 66', line: WHITE, w: 5, t },
  ];
}
function blanketSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: round(0, 0, 100, 100, 8), fill: RED, w: 4, t },
    { d: `${rect(30, 24, 40, 22)} ${rect(22, 50, 56, 36)}`, fill: WHITE, line: 'none', t },
    { d: 'M 38 24 V 12 M 62 24 V 12', line: WHITE, w: 6, t },
  ];
}
function phoneSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: round(0, 0, 100, 100, 8), fill: RED, w: 4, t },
    { d: 'M 24 26 Q 30 18 38 24 L 44 36 Q 40 44 46 52 L 52 58 Q 60 64 66 60 L 78 68 Q 82 78 72 82 Q 44 80 26 58 Q 18 42 24 26 Z', fill: WHITE, line: 'none', t },
  ];
}
function exitSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: round(0, 0, 160, 100, 8), fill: GREEN, w: 4, t },
    { d: rect(96, 14, 46, 74), line: WHITE, w: 6, t },
    { d: circle(58, 22, 8), fill: WHITE, line: 'none', t },
    { d: 'M 54 34 L 46 58 M 52 38 L 38 48 M 52 38 L 66 46 M 46 58 L 34 72 L 26 84 M 46 58 L 58 70 L 54 86', line: WHITE, w: 9, t },
    { d: 'M 112 52 L 130 52 M 122 44 L 130 52 L 122 60', line: WHITE, w: 5, t },
  ];
}
function tickSign(x: number, y: number, s: number): Item[] {
  const t = at(x, y, s);
  return [
    { d: circle(50, 50, 46), fill: GREEN, w: 4, t },
    { d: 'M 28 52 L 44 68 L 74 34', line: WHITE, w: 12, t },
  ];
}
const callout = (x: number, y: number, n: string): Item[] => [{ d: circle(x, y, 22), fill: RED, w: 3 }, say(n, x, y + 9, 26, { fill: WHITE, weight: 900 })];

// ---------------------------------------------------------------------------
// people: faceless, in plain colours, posed in centimetres from the feet, facing right
// ---------------------------------------------------------------------------

type Pose = { head: Pt; torso: Pt[]; legs: Pt[][]; arms: Pt[][] };
interface Who {
  shirt: string;
  legs?: string;
  helmet?: boolean;
}

const YOU: Who = { shirt: YELLOW };
const FEMI: Who = { shirt: GREEN };
const TESS: Who = { shirt: BLUE };
const SIS: Who = { shirt: '#8461b0' };
const IVY: Who = { shirt: '#e07a95', legs: '#9fb3c4' };
const NELL_COAT: Who = { shirt: '#6f675e', legs: '#9fb3c4' };
const OKAFOR: Who = { shirt: '#8b6b4a' };
const TEAL: Who = { shirt: '#3c9c9c' };
const GREY: Who = { shirt: '#8f98a3' };
const FIREFIGHTER: Who = { shirt: '#2c3a52', legs: '#2c3a52', helmet: true };

const LEGS: Pt[][] = [[[-5, -92], [-6, -48], [-7, -3]], [[5, -92], [6, -48], [7, -3]]];
const ARMS_DOWN: Pt[] = [[-11, -130], [-16, -106], [-16, -84]];
const UP = { head: [0, -154] as Pt, torso: [[0, -132], [0, -96]] as Pt[], legs: LEGS };
const SAT = { head: [0, -112] as Pt, torso: [[0, -90], [0, -58]] as Pt[], legs: [[[-6, -52], [-8, -30], [-8, -3]], [[6, -52], [8, -30], [8, -3]]] as Pt[][] };
const POSES = {
  stand: { ...UP, arms: [ARMS_DOWN, [[11, -130], [16, -106], [16, -84]]] },
  startle: { ...UP, legs: [[[-5, -92], [-10, -48], [-13, -3]], [[5, -92], [10, -48], [13, -3]]], arms: [[[-11, -130], [-28, -138], [-34, -158]], [[11, -130], [28, -138], [34, -158]]] },
  hold: { ...UP, arms: [[[-9, -128], [6, -106], [32, -110]], [[11, -128], [24, -104], [40, -108]]] },
  throw: { head: [8, -150], torso: [[5, -128], [0, -94]], legs: [[[-5, -92], [-16, -50], [-26, -3]], [[5, -92], [18, -50], [24, -3]]], arms: [[[-6, -126], [16, -130], [40, -142]], [[12, -126], [32, -132], [54, -146]]] },
  reach: { ...UP, arms: [ARMS_DOWN, [[11, -130], [34, -126], [56, -124]]] },
  point: { ...UP, arms: [ARMS_DOWN, [[11, -130], [32, -142], [52, -156]]] },
  ears: { ...UP, legs: [[[-4, -92], [-3, -48], [-2, -3]], [[4, -92], [3, -48], [2, -3]]], arms: [[[-11, -130], [-28, -140], [-14, -153]], [[11, -130], [28, -140], [14, -153]]] },
  run: { head: [10, -152], torso: [[6, -130], [0, -94]], legs: [[[-3, -92], [-22, -60], [-36, -26]], [[3, -92], [24, -54], [20, -3]]], arms: [[[0, -126], [-20, -110], [-26, -92]], [[8, -126], [26, -116], [40, -128]]] },
  walk: { head: [3, -154], torso: [[2, -132], [0, -96]], legs: [[[-3, -92], [-12, -48], [-18, -3]], [[3, -92], [12, -48], [18, -3]]], arms: [[[-9, -130], [-18, -108], [-22, -88]], [[9, -130], [18, -108], [24, -88]]] },
  sit: { ...SAT, arms: [[[-11, -88], [-17, -68], [-10, -58]], [[11, -88], [17, -68], [10, -58]]] },
  eat: { ...SAT, arms: [[[-11, -88], [-17, -68], [-10, -58]], [[11, -88], [20, -74], [6, -104]]] },
  hug: { head: [0, -106], torso: [[0, -86], [0, -56]], legs: [[[-6, -52], [-8, -70], [-8, -3]], [[6, -52], [8, -70], [8, -3]]], arms: [[[-11, -84], [-16, -68], [-4, -64]], [[11, -84], [16, -68], [4, -64]]] },
  comfort: { ...SAT, arms: [[[-11, -88], [-28, -96], [-42, -90]], [[11, -88], [17, -68], [10, -58]]] },
} satisfies Record<string, Pose>;
type PoseName = keyof typeof POSES;

const K = 0.92; //centimetres to pixels, matching the rooms' scale

function figure([x, y]: Pt, pose: Pose, who: Who, flip = false, cls?: string): Item[] {
  const t = `translate(${r1(x)} ${r1(y)}) scale(${flip ? -K : K} ${K})`;
  const strokes = (lines: Pt[][]) => lines.map((l) => line(...l)).join(' ');
  const legs = strokes(pose.legs);
  const torso = line(...pose.torso);
  const arms = strokes(pose.arms);
  const hands = pose.arms.map((a) => circle(a[a.length - 1][0], a[a.length - 1][1], 5)).join(' ');
  const [hx, hy] = pose.head;
  return [
    { d: legs, line: INK, w: 18, t, cls },
    { d: torso, line: INK, w: 36, t, cls },
    { d: legs, line: who.legs ?? TROUSERS, w: 12, t, cls },
    { d: torso, line: who.shirt, w: 30, t, cls },
    { d: circle(hx, hy, 13), fill: SKIN, w: 3, t, cls },
    ...(who.helmet ? [{ d: `M ${hx - 15} ${hy + 1} Q ${hx - 15} ${hy - 19} ${hx} ${hy - 19} Q ${hx + 15} ${hy - 19} ${hx + 15} ${hy + 1} L ${hx + 21} ${hy + 4} L ${hx - 21} ${hy + 4} Z`, fill: YELLOW, w: 3, t, cls }] : []),
    { d: arms, line: INK, w: 16, t, cls },
    { d: arms, line: who.shirt, w: 10, t, cls },
    { d: hands, fill: SKIN, w: 3, t, cls },
  ];
}

// ---------------------------------------------------------------------------
// rooms: isometric, in metres, with the back corner at ox, oy
// ---------------------------------------------------------------------------

const S = 92; //pixels per metre
const ISO_X = S * 0.866;
const ISO_Y = S * 0.5;

function iso(ox: number, oy: number) {
  const P = (x: number, y: number, z = 0): Pt => [ox + (x - y) * ISO_X, oy + (x + y) * ISO_Y - z * S];
  const face = (...vs: V[]) => poly(...vs.map((v) => P(...v)));
  const path = (...vs: V[]) => line(...vs.map((v) => P(...v)));
  //a box from x, y, z, dx by dy by dz: its top, its face towards the bottom left, and its darker face towards the bottom right
  const box = (x: number, y: number, z: number, dx: number, dy: number, dz: number, c: string): Shape[] => [
    { d: face([x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]), fill: c, w: 2.5 },
    { d: face([x + dx, y, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x + dx, y, z + dz]), fill: shade(c, -0.16), w: 2.5 },
    { d: face([x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]), fill: shade(c, 0.14), w: 2.5 },
  ];
  //a flat rectangle on the right-hand wall (y fixed), the left-hand wall (x fixed), or the floor (z fixed)
  const onR = (x0: number, x1: number, z0: number, z1: number, c: string, y = 0): Shape => ({ d: face([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]), fill: c, w: 2.5 });
  const onL = (y0: number, y1: number, z0: number, z1: number, c: string, x = 0): Shape => ({ d: face([x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]), fill: c, w: 2.5 });
  const onF = (x0: number, y0: number, x1: number, y1: number, c: string, z = 0): Shape => ({ d: face([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]), fill: c, w: 2.5 });
  //a flat circle lying on a surface, as the ellipse it makes, and an upright cylinder standing on one
  const disc = (x: number, y: number, z: number, r: number, c: string): Shape => ({ d: ellipse(...P(x, y, z), r * S * 1.2247, r * S * 0.7071), fill: c, w: 2.5 });
  const cyl = (x: number, y: number, z: number, r: number, h: number, c: string, top = shade(c, 0.15)): Item[] => {
    const [cx, cy] = P(x, y, z);
    const rx = r1(r * S * 1.2247);
    const ry = r1(r * S * 0.7071);
    const hh = h * S;
    return [
      { d: `M ${r1(cx - rx)} ${r1(cy - hh)} L ${r1(cx - rx)} ${r1(cy)} A ${rx} ${ry} 0 0 0 ${r1(cx + rx)} ${r1(cy)} L ${r1(cx + rx)} ${r1(cy - hh)} Z`, fill: c, w: 2.5 },
      { d: ellipse(cx, cy - hh, rx, ry), fill: top, w: 2.5 },
    ];
  };
  const fig = (x: number, y: number, pose: PoseName, who: Who, flip = false, z = 0, cls?: string) => figure(P(x, y, z), POSES[pose], who, flip, cls);
  //the floor with its tiles, the two back walls cut off at hw, and the cut edges on top
  const shell = (X: number, Y: number, hw: number, floor: string, tile = 0.5): Item[] => {
    const T = 0.12;
    const tiles = [
      ...Array.from({ length: Math.ceil(X / tile) - 1 }, (_, i) => path([(i + 1) * tile, 0, 0], [(i + 1) * tile, Y, 0])),
      ...Array.from({ length: Math.ceil(Y / tile) - 1 }, (_, i) => path([0, (i + 1) * tile, 0], [X, (i + 1) * tile, 0])),
    ].join(' ');
    return [
      onF(0, 0, X, Y, floor),
      { d: tiles, line: shade(floor, -0.12), w: 1.5 },
      onL(0, Y, 0, hw, WALL_L),
      onR(0, X, 0, hw, WALL_R),
      { d: path([0, Y, 0.1], [0, 0, 0.1], [X, 0, 0.1]), line: shade(WALL_R, -0.3), w: 2 },
      { d: face([-T, -T, hw], [X, -T, hw], [X, 0, hw], [0, 0, hw], [0, Y, hw], [-T, Y, hw]), fill: WALL_TOP, w: 2.5 },
      { d: face([X, -T, 0], [X, 0, 0], [X, 0, hw], [X, -T, hw]), fill: shade(WALL_TOP, -0.12), w: 2.5 },
      { d: face([-T, Y, 0], [0, Y, 0], [0, Y, hw], [-T, Y, hw]), fill: shade(WALL_TOP, -0.12), w: 2.5 },
    ];
  };
  return { P, face, path, box, onR, onL, onF, disc, cyl, fig, shell };
}

//the night outside a window on the right-hand wall, with its frame, glazing bar and sill
const windowR = (r: ReturnType<typeof iso>, x0: number, x1: number, z0: number, z1: number): Item[] => [
  r.onR(x0, x1, z0, z1, WHITE),
  r.onR(x0 + 0.07, x1 - 0.07, z0 + 0.07, z1 - 0.07, NIGHT),
  { d: r.path([(x0 + x1) / 2, 0, z0 + 0.07], [(x0 + x1) / 2, 0, z1 - 0.07]), line: WHITE, w: 4 },
  ...r.box(x0 - 0.05, 0, z0 - 0.04, x1 - x0 + 0.1, 0.1, 0.04, WHITE),
];
//the same window with its right-hand pane swung open, and air coming in
const windowOpen = (r: ReturnType<typeof iso>, x0: number, x1: number, z0: number, z1: number): Item[] => {
  const xm = (x0 + x1) / 2;
  const [a, b] = [r.P(x1 - 0.1, 0.35, (z0 + z1) / 2), r.P(x1 - 0.4, 0.75, (z0 + z1) / 2 - 0.1)];
  return [
    r.onR(xm, x1 - 0.07, z0 + 0.07, z1 - 0.07, shade(NIGHT, -0.3)),
    { d: r.face([xm, 0, z0 + 0.07], [xm, 0.42, z0 + 0.07], [xm, 0.42, z1 - 0.07], [xm, 0, z1 - 0.07]), fill: GLASS, w: 2.5 },
    { d: `M ${a[0]} ${a[1]} q -20 -18 -40 0 t -40 0 M ${b[0]} ${b[1]} q -20 -18 -40 0 t -40 0`, line: '#7fb6d8', w: 5, cls: 'ec-breeze' },
  ];
};

// ---------------------------------------------------------------------------
// the rooms and what's in them, each in painter's order. Parts starting with _ are always shown
// ---------------------------------------------------------------------------

type Room = 'cover' | 'dining' | 'kitchen' | 'stairs' | 'street' | 'back';

//the kitchen: units along the right-hand wall with the hob in the middle, the fridge-freezer on the left-hand wall,
//the door through to the hall beyond it, and a window at the far end
const k = iso(740, 362);
const PAN = k.P(1.72, 0.44, 1.0);
const DOOR_K = k.P(0, 2.22, 1.3);
const ALARM_K = k.P(3.3, 0, 2.0);
const OVEN = k.P(1.9, 0.62, 0.45);
const WINDOW_K = k.P(3.875, 0, 1.4);
const hand = (r: ReturnType<typeof iso>, x: number, y: number, flip: boolean): Pt => {
  const [px, py] = r.P(x, y);
  return [px + (flip ? -38 : 38) * K, py - 108 * K];
};
const lambTin = ([x, y]: Pt): Item[] => [
  { d: `M ${x - 34} ${y - 6} h 68 l -6 16 h -56 Z`, fill: STEEL },
  { d: ellipse(x, y - 10, 24, 11), fill: '#7a4a2a' },
];

const KITCHEN: Record<string, Item[]> = {
  _room: [
    ...k.shell(4.4, 2.8, 2.2, '#cfd6dc'),
    k.onL(1.85, 2.6, 0, 1.95, '#59606a'),
    ...windowR(k, 3.5, 4.25, 0.95, 1.85),
    ...k.box(0.5, 0, 1.45, 2.7, 0.35, 0.62, UNIT),
    { d: [1.175, 1.85, 2.525].map((x) => k.path([x, 0.35, 1.47], [x, 0.35, 2.05])).join(' '), line: INK, w: 2 },
    { d: circle(...ALARM_K, 9), fill: WHITE, w: 2.5 },
    { d: circle(ALARM_K[0], ALARM_K[1], 2.5), fill: RED, line: 'none' },
    ...k.box(0, 0.78, 0, 0.66, 0.66, 1.85, '#eef1f3'),
    { d: `${k.path([0.66, 0.78, 0.75], [0.66, 1.44, 0.75])} ${k.path([0.66, 1.34, 0.9], [0.66, 1.34, 1.25])} ${k.path([0.66, 1.34, 0.45], [0.66, 1.34, 0.65])}`, line: INK, w: 3 },
    ...k.box(0, 0, 0, 3.4, 0.62, 0.86, UNIT),
    { d: [0.75, 1.5, 2.3, 2.85].map((x) => k.path([x, 0.62, 0.04], [x, 0.62, 0.84])).join(' '), line: INK, w: 2 },
    { d: k.face([1.55, 0.62, 0.08], [2.25, 0.62, 0.08], [2.25, 0.62, 0.78], [1.55, 0.62, 0.78]), fill: DARK, w: 2.5 },
    { d: k.face([1.63, 0.62, 0.16], [2.17, 0.62, 0.16], [2.17, 0.62, 0.6], [1.63, 0.62, 0.6]), fill: '#6b4f33', w: 2 },
    { d: k.path([1.6, 0.62, 0.7], [2.2, 0.62, 0.7]), line: STEEL, w: 5 },
    ...k.box(-0.02, 0, 0.86, 3.46, 0.66, 0.05, WORKTOP),
    k.onF(0.3, 0.1, 0.95, 0.5, STEEL, 0.91),
    k.onF(0.36, 0.15, 0.89, 0.45, shade(STEEL, -0.25), 0.91),
    { d: k.path([0.62, 0.05, 0.91], [0.62, 0.05, 1.12], [0.62, 0.22, 1.12]), line: INK, w: 10 },
    { d: k.path([0.62, 0.05, 0.91], [0.62, 0.05, 1.12], [0.62, 0.22, 1.12]), line: STEEL, w: 5 },
    ...k.cyl(1.15, 0.32, 0.91, 0.07, 0.2, GLASS, '#7fb6d8'),
    k.onF(1.55, 0.08, 2.25, 0.56, DARK, 0.912),
    ...[[1.72, 0.2], [2.08, 0.2], [2.08, 0.44]].map(([x, y]) => ({ ...k.disc(x, y, 0.912, 0.08, 'none'), line: '#767c84', w: 2 })),
    { d: [1.65, 1.8, 2.0, 2.15].map((x) => circle(...k.P(x, 0.66, 0.885), 3.5)).join(' '), fill: INK, line: 'none' },
    ...k.cyl(1.72, 0.44, 0.91, 0.15, 0.09, STEEL, '#d9a53a'),
    { d: line(k.P(1.72, 0.6, 0.97), k.P(1.72, 0.95, 1.0)), line: INK, w: 7 },
  ],
  window_open: windowOpen(k, 3.5, 4.25, 0.95, 1.85),
  burnt: k.cyl(1.72, 0.44, 0.91, 0.15, 0.09, '#2b2b2b', '#151515'),
  heat: [{ d: [-14, 0, 14].map((dx) => `M ${PAN[0] + dx} ${PAN[1] - 14} q 7 -10 0 -20 q -7 -10 0 -20`).join(' '), line: '#9aa0a6', w: 3, cls: 'ec-smoke' }],
  fire: [...flame(PAN[0] - 20, PAN[1], 40, 70), ...flame(PAN[0] + 18, PAN[1], 44, 82), ...flame(PAN[0], PAN[1] + 2, 60, 104)],
  tray: k.box(1.52, 0.24, 1.0, 0.42, 0.42, 0.03, '#9aa3ad'),
  puff: cloud([PAN[0], PAN[1] - 60], 70, '#a9aeb3'),
  oven_smoke: [...cloud([OVEN[0] + 10, OVEN[1] - 40], 50, '#a9aeb3'), ...cloud([OVEN[0] + 34, OVEN[1] - 84], 40, '#a9aeb3')],
  you_freezer: k.fig(2.7, 1.0, 'stand', YOU),
  you_startle: k.fig(1.0, 1.75, 'startle', YOU),
  you_hold: k.fig(2.6, 0.95, 'hold', YOU, true),
  femi_hold: k.fig(2.6, 0.95, 'hold', FEMI, true),
  you_stand: k.fig(1.6, 1.7, 'stand', YOU),
  okafor: k.fig(0.3, 2.25, 'stand', OKAFOR),
  femi_door: k.fig(0.35, 2.25, 'reach', FEMI, true),
  jo_window: k.fig(3.85, 0.75, 'point', TESS),
  sis_window: k.fig(3.85, 0.75, 'point', SIS),
  you_oven: [...k.fig(2.4, 1.2, 'hold', YOU, true), ...lambTin(hand(k, 2.4, 1.2, true))],
  femi_oven: [...k.fig(2.4, 1.2, 'hold', FEMI, true), ...lambTin(hand(k, 2.4, 1.2, true))],
  you_run: [
    { d: `M ${WINDOW_K[0] - 20} ${WINDOW_K[1] + 30} Q 800 250 ${DOOR_K[0] + 10} ${DOOR_K[1] + 40} Q 700 470 ${OVEN[0]} ${OVEN[1] + 10} Q 960 420 ${WINDOW_K[0] - 20} ${WINDOW_K[1] + 30}`, line: RED, w: 6, dash: '16 12', cls: 'ec-march' },
    ...k.fig(1.8, 1.6, 'run', YOU),
    ...burst(hand(k, 1.8, 1.6, false)[0] + 10, hand(k, 1.8, 1.6, false)[1] - 32, 26, 'OW!', '#f39a7a', 16),
  ],
  you_ears: k.fig(0.6, 2.05, 'ears', YOU),
  jo_steer: k.fig(1.15, 2.3, 'reach', TESS, true),
  smoke: [
    ...cloud(k.P(1.0, 1.2, 2.05), 190),
    ...cloud(k.P(2.8, 0.8, 2.15), 210),
    ...cloud(k.P(1.9, 0.5, 1.9), 220),
    ...cloud(k.P(2.0, 1.7, 1.75), 160),
  ],
  smoke_thick: [
    ...cloud(k.P(0.6, 1.0, 1.4), 220, '#6c7279'),
    ...cloud(k.P(3.5, 1.0, 1.35), 230, '#6c7279'),
    ...cloud(k.P(1.4, 2.0, 1.1), 270, '#6c7279'),
    ...cloud(k.P(3.0, 1.9, 0.9), 250, '#6c7279'),
  ],
  alarm: [{ d: [16, 28, 40].map((r) => `M ${ALARM_K[0] - r} ${ALARM_K[1] - r * 0.8} q ${-r * 0.5} ${r * 0.8} 0 ${r * 1.6} M ${ALARM_K[0] + r} ${ALARM_K[1] - r * 0.8} q ${r * 0.5} ${r * 0.8} 0 ${r * 1.6}`).join(' '), line: RED, w: 5, cls: 'ec-pulse' }],
  bang: [...burst(DOOR_K[0] - 70, DOOR_K[1] - 30, 54, 'BANG!'), ...burst(DOOR_K[0] - 40, DOOR_K[1] + 60, 40, 'BANG!', YELLOW, 18)],
  callouts: [...callout(ALARM_K[0] + 50, ALARM_K[1] - 40, '1'), ...callout(DOOR_K[0] - 150, DOOR_K[1] - 70, '2'), ...callout(OVEN[0] - 40, OVEN[1] + 20, '3')],
  ticks: [...tickSign(WINDOW_K[0] + 40, WINDOW_K[1] - 120, 50), ...tickSign(OVEN[0] - 70, OVEN[1] - 10, 50), ...tickSign(DOOR_K[0] - 110, DOOR_K[1] - 120, 50)],
  surprise: burst(k.P(1.0, 1.75)[0] + 20, k.P(1.0, 1.75)[1] - 188, 28, '!', YELLOW, 34),
  arrow_tray: arrow([[PAN[0] + 4, PAN[1] - 150], [PAN[0] + 4, PAN[1] - 50]]),
  warn: warnSign(1250, 220, 200),
  tick: tickSign(1270, 220, 170),
  exit: exitSign(1240, 240, 160),
};

//the dining room: six round the table, a window with curtains, a picture on the wall
const d = iso(760, 350);
const BACK_ROW: [number, Who][] = [[1.35, TESS], [2.1, TEAL], [2.85, FEMI]];
const FRONT_ROW: [number, Who][] = [[1.35, SIS], [2.1, YOU], [2.85, GREY]];
const plate = (x: number, y: number) => [d.disc(x, y, 0.755, 0.13, WHITE), d.disc(x, y, 0.756, 0.08, '#efe9dd')];

const DINING: Record<string, Item[]> = {
  _room: [
    ...d.shell(4.2, 3.0, 2.2, '#d8c3a0', 0.3),
    ...windowR(d, 2.5, 3.5, 0.9, 1.9),
    d.onR(2.28, 2.52, 0.75, 2.0, '#b5473a'),
    d.onR(3.48, 3.72, 0.75, 2.0, '#b5473a'),
    d.onL(0.9, 1.7, 1.15, 1.75, WOOD),
    d.onL(0.97, 1.63, 1.21, 1.69, '#9cc3a6'),
    { d: d.path([0, 1.0, 1.3], [0, 1.25, 1.5], [0, 1.4, 1.38], [0, 1.6, 1.58]), line: '#5f8f6c', w: 3 },
  ],
  breeze: [{ d: `M ${d.P(3.0, 0.3, 1.6).join(' ')} q -24 -16 -48 0 t -48 0 M ${d.P(3.2, 0.5, 1.3).join(' ')} q -24 -16 -48 0 t -48 0`, line: '#7fb6d8', w: 5, cls: 'ec-breeze' }],
  chairs_back: BACK_ROW.flatMap(([x]) => [...d.box(x - 0.2, 0.42, 0.45, 0.4, 0.05, 0.55, WOOD), ...d.box(x - 0.2, 0.52, 0, 0.4, 0.4, 0.45, WOOD)]),
  back_row: BACK_ROW.flatMap(([x, who]) => d.fig(x, 0.72, 'sit', who)),
  table: [
    ...[[0.95, 1.05], [3.2, 1.05], [0.95, 1.9], [3.2, 1.9]].flatMap(([x, y]) => d.box(x, y, 0, 0.06, 0.06, 0.7, shade(WOOD, -0.1))),
    ...d.box(0.85, 1.0, 0.7, 2.5, 1.0, 0.05, WOOD),
  ],
  food: [
    ...BACK_ROW.flatMap(([x]) => plate(x, 1.22)),
    ...FRONT_ROW.flatMap(([x]) => plate(x, 1.78)),
    d.disc(2.1, 1.5, 0.755, 0.24, WHITE),
    { d: ellipse(...d.P(2.1, 1.5, 0.8), 30, 16), fill: '#8a5530' },
    ...[0.9, 3.0].flatMap((x) => d.cyl(x + 0.3, 1.5, 0.755, 0.03, 0.18, WHITE)),
    ...[0.9, 3.0].flatMap((x) => flame(d.P(x + 0.3, 1.5, 0.94)[0], d.P(x + 0.3, 1.5, 0.94)[1], 10, 18)),
    ...[[1.65, 1.15], [2.55, 1.15], [1.65, 1.85], [2.55, 1.85]].flatMap(([x, y]) => d.cyl(x, y, 0.755, 0.035, 0.12, GLASS, '#d9c2e0')),
  ],
  chips: [
    ...[...BACK_ROW.map(([x]): Pt => [x, 1.22]), ...FRONT_ROW.map(([x]): Pt => [x, 1.78])].flatMap(([x, y]) => [
      d.onF(x - 0.16, y - 0.12, x + 0.16, y + 0.12, WHITE, 0.756),
      { d: [-0.08, -0.02, 0.04, 0.09].map((dx, i) => d.path([x + dx, y - 0.05, 0.77], [x + dx + 0.03, y + 0.06 - i * 0.02, 0.77])).join(' '), line: FLAME_IN, w: 4 },
    ]),
  ],
  front_seats: FRONT_ROW.flatMap(([x]) => d.box(x - 0.2, 2.1, 0, 0.4, 0.4, 0.45, WOOD)),
  front_row: FRONT_ROW.flatMap(([x, who]) => d.fig(x, 2.3, x === 2.1 ? 'sit' : 'eat', who)),
  laugh: [
    say('HA HA!', d.P(1.35, 0.72, 1.5)[0] - 10, d.P(1.35, 0.72, 1.5)[1], 26, { weight: 900, fill: BLUE }),
    say('HA!', d.P(2.85, 0.72, 1.5)[0] + 30, d.P(2.85, 0.72, 1.5)[1] - 10, 24, { weight: 900, fill: GREEN }),
    say('HA!', d.P(1.35, 2.3, 1.5)[0] - 40, d.P(1.35, 2.3, 1.5)[1], 22, { weight: 900, fill: '#8461b0' }),
  ],
};

//the landing outside your flat: your door on the right-hand wall, the stairs up to Ivy's along the left
const s = iso(760, 392);
const STEPS = 8;
const NELL_AT = s.P(0.3, 1.45, 0.3);

const STAIRS: Record<string, Item[]> = {
  _room: [
    ...s.shell(3.4, 2.4, 2.6, '#c4c9c4', 0.4),
    s.onR(1.62, 2.68, 0, 2.12, WHITE),
    s.onR(1.7, 2.6, 0, 2.05, '#5d6168'),
    s.onR(2.85, 3.05, 1.35, 1.5, '#d8c7a0'),
    say('2', ...s.P(2.95, 0, 1.385), 14, { weight: 900 }),
    s.onR(0.3, 1.2, 1.2, 1.75, '#c49a6c'),
    s.onR(0.4, 0.7, 1.35, 1.65, WHITE),
    s.onR(0.8, 1.1, 1.28, 1.55, '#f4e27a'),
    s.onF(1.75, 0.08, 2.55, 0.6, '#8a6f4e'),
    ...Array.from({ length: STEPS }, (_, n) => STEPS - 1 - n).flatMap((i) => s.box(0, 2.4 - (i + 1) * 0.28, 0, 1.05, 0.28, (i + 1) * 0.2, '#b8aa94')),
  ],
  smoke_door: [...cloud(s.P(2.15, 0.05, 2.15), 110, '#9aa0a6'), ...cloud(s.P(2.6, 0.2, 2.5), 80, '#9aa0a6')],
  nell: s.fig(0.3, 1.45, 'hug', IVY, false, 0.3, 'ec-shake'),
  nell_still: s.fig(0.3, 1.45, 'hug', IVY, false, 0.3),
  nell_coat: [...s.fig(0.3, 1.45, 'hug', NELL_COAT, false, 0.3), { d: rect(NELL_AT[0] + 2, NELL_AT[1] - 70, 10, 16), fill: GLASS }],
  you_sit: s.fig(0.75, 1.45, 'comfort', YOU, false, 0.3),
  jo_sit: s.fig(0.75, 1.45, 'comfort', TESS, false, 0.3),
  _rail: [
    { d: Array.from({ length: STEPS }, (_, i) => s.path([1.05, 2.4 - (i + 0.5) * 0.28, (i + 1) * 0.2], [1.05, 2.4 - (i + 0.5) * 0.28, (i + 1) * 0.2 + 0.85])).join(' '), line: INK, w: 3 },
    { d: s.path([1.05, 2.4, 0.95], [1.05, 0.04, 0.95 + STEPS * 0.2 * (2.36 / 2.24)]), line: INK, w: 9 },
    { d: s.path([1.05, 2.4, 0.95], [1.05, 0.04, 0.95 + STEPS * 0.2 * (2.36 / 2.24)]), line: WOOD, w: 5 },
  ],
  you_door: s.fig(2.15, 0.5, 'stand', YOU),
  you_go: s.fig(1.9, 0.9, 'walk', YOU),
  you_tell: s.fig(1.6, 1.4, 'reach', YOU, true),
  breath: [{ d: [0, 1, 2].map((i) => `M ${NELL_AT[0] + 22 + i * 10} ${NELL_AT[1] - 118 + i * 4} q 8 -6 0 -12 q -8 -6 0 -12`).join(' '), line: '#8fa3b8', w: 3, cls: 'ec-pulse' }],
  count: [{ d: round(NELL_AT[0] - 250, NELL_AT[1] - 200, 190, 60, 30), fill: WHITE }, say('IN 4 · OUT 4', NELL_AT[0] - 155, NELL_AT[1] - 160, 24, { weight: 900, fill: BLUE })],
  bubble: bubble(NELL_AT[0] + 150, NELL_AT[1] - 230, 210, "IT'S FINE!"),
};

//the street: the front of your building, the pavement, and a fire engine at the kerb
const st = iso(670, 345);
const STREET: Record<string, Item[]> = {
  _room: [
    st.onF(0, 0, 6, 1.15, '#c9c6bf'),
    { d: [1, 2, 3, 4, 5].map((x) => st.path([x, 0, 0], [x, 1.15, 0])).join(' '), line: '#aaa79f', w: 1.5 },
    ...st.box(0, 1.15, 0, 6, 0.12, 0.12, '#9a978f'),
    st.onF(0, 1.27, 6, 2.6, '#5b5f66'),
    { d: [0.2, 1.4, 2.6, 3.8, 5.0].map((x) => st.path([x, 2.2, 0], [x + 0.7, 2.2, 0])).join(' '), line: WHITE, w: 4 },
    st.onR(0, 6, 0, 2.4, '#b8775a'),
    { d: [0.4, 0.8, 1.2, 1.6, 2.0].map((z) => st.path([0, 0, z], [6, 0, z])).join(' '), line: '#a1654b', w: 1.5 },
    { d: st.face([-0.1, -0.12, 2.4], [6, -0.12, 2.4], [6, 0, 2.4], [-0.1, 0, 2.4]), fill: WALL_TOP, w: 2.5 },
    st.onR(2.2, 2.9, 0, 2.0, '#2f4a6b'),
    ...[[0.5, 1.5], [3.5, 4.5], [4.9, 5.7]].map(([x0, x1]) => st.onR(x0, x1, 0.8, 1.7, '#f3d27a')),
    { d: st.path([5.6, 0.9, 0], [5.6, 0.9, 2.3]), line: INK, w: 5 },
    { d: circle(...st.P(5.6, 0.9, 2.35), 12), fill: '#fff3b0' },
  ],
  smoke: [...cloud(st.P(3.0, -0.2, 2.6), 160), ...cloud(st.P(4.1, -0.3, 2.9), 120)],
  crowd: [
    ...st.fig(0.2, 0.85, 'stand', NELL_COAT),
    ...st.fig(0.6, 0.6, 'stand', YOU),
    ...st.fig(1.0, 0.8, 'stand', TESS),
    ...st.fig(1.3, 0.55, 'stand', SIS),
    ...st.fig(1.5, 0.35, 'stand', OKAFOR),
    ...st.fig(1.7, 0.85, 'stand', FEMI),
  ],
  firefighter: [
    ...st.fig(2.6, 0.3, 'hold', FIREFIGHTER, true),
    ...st.cyl(2.48, 0.05, 1.12, 0.1, 0.06, '#2b2b2b', '#151515'),
  ],
  engine: [
    ...st.box(2.8, 1.45, 0.3, 2.3, 1.0, 1.3, RED),
    ...st.box(5.1, 1.45, 0.3, 0.9, 1.0, 1.05, RED),
    st.onR(5.25, 5.85, 0.85, 1.25, GLASS, 2.45),
    { d: st.face([6, 1.55, 0.8], [6, 2.35, 0.8], [6, 2.35, 1.25], [6, 1.55, 1.25]), fill: GLASS, w: 2.5 },
    st.onR(2.8, 6, 0.55, 0.65, YELLOW, 2.45),
    { d: [3.4, 4.0, 4.6].map((x) => st.path([x, 2.45, 0.7], [x, 2.45, 1.5])).join(' '), line: shade(RED, -0.3), w: 2 },
    { d: `${st.path([2.9, 1.7, 1.62], [5.0, 1.7, 1.62])} ${st.path([2.9, 2.2, 1.62], [5.0, 2.2, 1.62])} ${[3.1, 3.4, 3.7, 4.0, 4.3, 4.6, 4.9].map((x) => st.path([x, 1.7, 1.62], [x, 2.2, 1.62])).join(' ')}`, line: '#d9dde1', w: 4 },
    ...[3.3, 4.6, 5.55].map((x) => ({ d: poly(...Array.from({ length: 16 }, (_, i): Pt => st.P(x + Math.cos((i / 16) * Math.PI * 2) * 0.28, 2.45, 0.3 + Math.sin((i / 16) * Math.PI * 2) * 0.28))), fill: INK })),
  ],
  lights: [...st.box(5.3, 1.6, 1.35, 0.18, 0.2, 0.1, '#4a8fe0'), ...st.box(5.3, 2.1, 1.35, 0.18, 0.2, 0.1, '#4a8fe0')].map((it) => ({ ...it, cls: 'ec-blink' })),
};

//flat pages, drawn straight onto the panel: the cover, the card's last page, and the back
const COVER: Record<string, Item[]> = {
  sign: warnSign(250, 190, 320),
  title: [say('THE EMERGENCY', 630, 300, 86, { anchor: 'start', weight: 900 })],
  strap: [
    say('Safety instructions for hosting a dinner', 634, 362, 36, { anchor: 'start', weight: 600 }),
    say('PLEASE READ BEFORE YOU START COOKING', 634, 414, 26, { anchor: 'start', weight: 900, fill: RED }),
  ],
  row: [...alarmSign(634, 456, 90), ...blanketSign(744, 456, 90), ...phoneSign(854, 456, 90), ...exitSign(964, 456, 90)],
  blanket: [
    { d: `${round(470, 160, 40, 60, 6)} ${round(630, 160, 40, 60, 6)}`, fill: INK },
    { d: round(420, 200, 300, 380, 22), fill: RED, w: 5 },
    { d: round(456, 290, 228, 130, 10), fill: WHITE, w: 3 },
    say('FIRE', 570, 346, 46, { weight: 900, fill: RED }),
    say('BLANKET', 570, 398, 40, { weight: 900, fill: RED }),
    say('PULL TAPES DOWN', 570, 470, 22, { weight: 800, fill: WHITE }),
  ],
  note: [
    { d: rect(0, 0, 380, 230), fill: WHITE, w: 3, t: 'translate(800 250) rotate(-5)' },
    { d: [70, 120, 170].map((y) => `M 30 ${y} H 350`).join(' '), line: '#b9cde0', w: 2, t: 'translate(800 250) rotate(-5)' },
    say('For next time.', 190, 104, 44, { font: HAND, fill: BLUE, t: 'translate(800 250) rotate(-5)' }),
    say('-Ivy', 230, 164, 44, { font: HAND, fill: BLUE, t: 'translate(800 250) rotate(-5)' }),
  ],
};
const TILES: [string, (x: number, y: number, s: number) => Item[]][] = [
  ['RAISE THE ALARM', alarmSign],
  ['SMOTHER THE FLAMES', blanketSign],
  ['GET EVERYONE OUT', exitSign],
  ['CALL 911', phoneSign],
];
const BACK: Record<string, Item[]> = {
  tiles: TILES.flatMap(([label, sign], i) => {
    const cx = 260 + i * 360;
    const wide = sign === exitSign;
    return [...sign(cx - (wide ? 112 : 70), 230, 140), say(label, cx, 440, 28, { weight: 900 })];
  }),
};

const ART: Record<Room, Record<string, Item[]>> = { cover: COVER, dining: DINING, kitchen: KITCHEN, stairs: STAIRS, street: STREET, back: BACK };

// ---------------------------------------------------------------------------
// the cues
// ---------------------------------------------------------------------------

type Bed = 'dinner' | 'sizzle' | 'fire' | 'alarm' | 'kitchen';
type Mix = Partial<Record<Bed, number>>;

interface Cue {
  room: Room;
  n?: number; //the panel's number; a new number, or a new room, turns to a new panel
  caption?: string;
  parts: string[];
  mix: Mix;
}

const PARTY: Mix = { dinner: 0.7 };
const HOT: Mix = { sizzle: 0.6, dinner: 0.3 };
const BLAZE: Mix = { fire: 0.85, sizzle: 0.4, dinner: 0.15 };
const OUT: Mix = { kitchen: 0.6, sizzle: 0.15 };
const ALARM: Mix = { alarm: 0.55, kitchen: 0.4 };
const LANDING: Mix = { alarm: 0.2, kitchen: 0.35 };
const QUIET: Mix = { kitchen: 0.5 };

const TABLE = ['chairs_back', 'back_row', 'table', 'food', 'front_seats', 'front_row'];

const cues: Record<string, Cue> = {
  title_card: { room: 'cover', parts: ['sign', 'title', 'strap', 'row'], mix: { dinner: 0.3 } },
  dinner: { room: 'dining', n: 1, caption: 'ENJOY YOUR MEAL', parts: TABLE, mix: PARTY },
  guests: { room: 'dining', n: 1, caption: 'ENJOY YOUR MEAL', parts: [...TABLE, 'laugh'], mix: PARTY },
  pan: { room: 'kitchen', n: 2, caption: 'NEVER LEAVE HOT OIL UNATTENDED', parts: ['you_freezer', 'heat', 'warn'], mix: HOT },
  fire: { room: 'kitchen', n: 3, caption: 'IF THE PAN CATCHES FIRE', parts: ['fire', 'you_startle', 'surprise', 'warn'], mix: BLAZE },
  lid: { room: 'kitchen', n: 4, caption: 'HEAT OFF. COVER THE PAN.', parts: ['tray', 'puff', 'you_hold', 'arrow_tray', 'tick'], mix: OUT },
  femi: { room: 'kitchen', n: 4, caption: 'HEAT OFF. COVER THE PAN.', parts: ['tray', 'puff', 'you_startle', 'femi_hold', 'arrow_tray', 'tick'], mix: OUT },
  smoke: { room: 'kitchen', n: 5, caption: 'SMOKE RISES. KEEP LOW.', parts: ['tray', 'smoke', 'you_stand'], mix: QUIET },
  three: { room: 'kitchen', n: 5, caption: 'ALARM. DOOR. OVEN.', parts: ['tray', 'smoke', 'you_stand', 'alarm', 'bang', 'oven_smoke', 'callouts'], mix: ALARM },
  steady: { room: 'kitchen', n: 6, caption: 'ONE THING AT A TIME', parts: ['window_open', 'tray', 'okafor', 'you_oven', 'smoke', 'alarm', 'ticks'], mix: ALARM },
  jobs: { room: 'kitchen', n: 6, caption: 'GIVE EVERYONE A JOB', parts: ['window_open', 'tray', 'femi_door', 'jo_window', 'you_oven', 'smoke', 'alarm'], mix: ALARM },
  scramble: { room: 'kitchen', n: 6, caption: 'EVERYTHING AT ONCE', parts: ['window_open', 'tray', 'oven_smoke', 'you_run', 'smoke', 'alarm'], mix: ALARM },
  stuck: { room: 'kitchen', n: 6, caption: 'LET OTHERS HELP', parts: ['window_open', 'tray', 'sis_window', 'femi_oven', 'you_ears', 'jo_steer', 'smoke', 'alarm'], mix: ALARM },
  nell: { room: 'stairs', n: 7, caption: 'CHECK ON EVERYONE', parts: ['smoke_door', 'nell', 'you_door'], mix: LANDING },
  nell_panic: { room: 'stairs', n: 7, caption: 'CHECK ON EVERYONE', parts: ['smoke_door', 'nell', 'you_door', 'breath'], mix: LANDING },
  sit: { room: 'stairs', n: 8, caption: 'IN FOR FOUR. OUT FOR FOUR.', parts: ['nell_still', 'you_sit', 'count'], mix: LANDING },
  water: { room: 'stairs', n: 8, caption: 'KEEP THEM WARM', parts: ['nell_coat', 'you_go'], mix: LANDING },
  jo_nell: { room: 'stairs', n: 8, caption: 'ASK FOR HELP', parts: ['smoke_door', 'nell_still', 'jo_sit', 'you_go'], mix: LANDING },
  tell: { room: 'stairs', n: 8, caption: "IT'S OUT. IT'S FINE.", parts: ['smoke_door', 'nell', 'breath', 'you_tell', 'bubble'], mix: LANDING },
  clear: { room: 'kitchen', n: 9, caption: 'ALL CLEAR', parts: ['window_open', 'burnt', 'tray', 'you_stand', 'tick'], mix: QUIET },
  late: { room: 'kitchen', n: 9, caption: 'GET OUT AND STAY OUT', parts: ['tray', 'smoke', 'smoke_thick', 'alarm', 'exit'], mix: { alarm: 0.8, kitchen: 0.3 } },
  engine: { room: 'street', n: 10, caption: 'CALL 911', parts: ['smoke', 'crowd', 'firefighter', 'engine', 'lights'], mix: { kitchen: 0.25 } },
  chips: { room: 'dining', n: 1, caption: 'ENJOY YOUR MEAL (AGAIN)', parts: ['breeze', 'chairs_back', 'back_row', 'table', 'chips', 'front_seats', 'front_row'], mix: { dinner: 0.45 } },
  homework: { room: 'back', caption: 'NOW, ABOUT YOU', parts: ['tiles'], mix: { kitchen: 0.3 } },
  goodbye: { room: 'cover', caption: 'FOR NEXT TIME', parts: ['blanket', 'note'], mix: { kitchen: 0.3 } },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS: Record<Bed, string> = {
  dinner: new URL('./sounds/dinner.m4a', import.meta.url).href,
  sizzle: new URL('./sounds/sizzle.m4a', import.meta.url).href,
  fire: new URL('./sounds/fire.m4a', import.meta.url).href,
  alarm: new URL('./sounds/alarm.m4a', import.meta.url).href,
  kitchen: new URL('./sounds/kitchen.m4a', import.meta.url).href,
};

const shot = (name: string, volume: number, delay: number): OneShot => ({ src: new URL(`./sounds/${name}.m4a`, import.meta.url).href, volume, delay });
const ONE_SHOTS: Record<string, OneShot> = {
  three: shot('knock', 0.8, 1.2),
  nell_panic: shot('breath', 0.6, 0.3),
  engine: shot('siren', 0.7, 0.2),
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.2; //seconds

// ---------------------------------------------------------------------------

const GAP = 0.25; //seconds between one part popping in and the next

interface Shown {
  cue: Cue;
  visit: number; //counts panels turned to, so going back to the same panel slides it in again
  starts: Record<string, number>; //when each part pops in, from when it first appears
}

const panelOf = (cue: Cue) => `${cue.room}-${cue.n ?? cue.caption}`;

//parts already up in the same panel stay put; anything new pops in after them, and a new panel brings all its parts in
function turn(prev: Shown | undefined, cue: Cue): Shown {
  const kept = prev && panelOf(prev.cue) === panelOf(cue) ? prev : undefined;
  const fresh = cue.parts.filter((p) => !kept?.cue.parts.includes(p));
  const starts = Object.fromEntries(fresh.map((p, i) => [p, (kept ? 0.1 : 0.4) + i * GAP]));
  return kept ? { cue, visit: kept.visit, starts: { ...kept.starts, ...starts } } : { cue, visit: (prev?.visit ?? 0) + 1, starts };
}

function draw(item: Item, i: number) {
  if ('text' in item) {
    return (
      <text key={i} x={item.x} y={item.y} transform={item.t} textAnchor={item.anchor ?? 'middle'} fill={item.fill ?? INK} style={{ fontFamily: item.font ?? SANS, fontWeight: item.weight ?? 400, fontSize: item.size }}>
        {item.text}
      </text>
    );
  }
  const stroke = item.line ?? (item.fill ? INK : 'none');
  const path = <path key={item.t ? undefined : i} d={item.d} fill={item.fill ?? 'none'} stroke={stroke} strokeWidth={item.w ?? 3} strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" className={item.cls} />;
  //a part's own transform goes on a group, so an animation on the path doesn't replace it
  return item.t ? (
    <g key={i} transform={item.t}>
      {path}
    </g>
  ) : (
    path
  );
}

//each part is a layer, and the ones with something moving in them get svgs of their own
function Panel({ shown }: { shown: Shown }) {
  const { cue, starts } = shown;
  const art = ART[cue.room];
  const layers: Layer[] = Object.entries(art)
    .filter(([part]) => part.startsWith('_') || cue.parts.includes(part))
    .map(([part, items]) => ({
      key: part,
      moving: items.some((item) => 'cls' in item && item.cls) ? part : undefined,
      node: part.startsWith('_') ? (
        <g>{items.map(draw)}</g>
      ) : (
        <g className="ec-pop" style={{ animationDelay: `${starts[part] ?? 0}s` }}>
          {items.map(draw)}
        </g>
      ),
    }));
  return <Layers viewBox={VIEW} layers={layers} className="ec-in" />;
}

//the laminated card: a red header, and the panel's frame
function Card() {
  return (
    <g>
      <rect width={W} height={H} fill={SEAT} />
      <path d={round(28, 16, 1544, 868, 28)} fill={CARD} stroke={INK} strokeWidth={4} />
      <path d={`M 28 92 V 44 Q 28 16 56 16 H 1544 Q 1572 16 1572 44 V 92 Z`} fill={RED} stroke={INK} strokeWidth={4} />
      <path d={flameD(268, 74, 30, 44)} fill={WHITE} />
      <text x={300} y={68} fill={WHITE} style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 2 }}>
        IN CASE OF FIRE
      </text>
      <text x={1320} y={66} textAnchor="end" fill={WHITE} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 2 }}>
        FLAT 2 · SAFETY CARD
      </text>
      <path d={round(64, 112, 1472, 760, 16)} fill={PANEL} stroke={INK} strokeWidth={4} />
    </g>
  );
}

//the panel's number and caption on a tab, top left
function Caption({ cue }: { cue: Cue }) {
  if (!cue.caption) return null;
  const x = cue.n === undefined ? 96 : 152;
  return (
    <g>
      <path d={round(72, 120, x - 48 + cue.caption.length * 23, 80, 12)} fill={PANEL} stroke={INK} strokeWidth={3} />
      {cue.n !== undefined && (
        <>
          <circle cx={108} cy={160} r={28} fill={INK} />
          <text x={108} y={172} textAnchor="middle" fill={WHITE} style={{ fontFamily: SANS, fontWeight: 900, fontSize: 32 }}>
            {cue.n}
          </text>
        </>
      )}
      <text x={x} y={172} fill={INK} style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>
        {cue.caption}
      </text>
    </g>
  );
}

function SafetyCard({ animation, clock }: { animation: string; clock?: number }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [shown, setShown] = useState<Shown>(() => turn(undefined, cues[first]));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setShown((v) => turn(v, cues[animation]));
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Emergency has no cue for the animation "${animation}"`);
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
    sound.current?.mix(cues[active].mix);
    const oneShot = ONE_SHOTS[active];
    if (oneShot) sound.current?.play(oneShot);
  }, [active]);

  //smoke thickens over the panel as the clock runs down
  const haze = clock === undefined ? 0 : (1 - clock) * 0.55;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Sheet viewBox={VIEW}>
        <Card />
      </Sheet>
      <Panel key={`${panelOf(shown.cue)}-${shown.visit}`} shown={shown} />
      {/* faded as a whole svg, which the browser can do without redrawing it */}
      <Sheet viewBox={VIEW} style={{ opacity: haze, transition: 'opacity 1s linear' }}>
        <path d={round(66, 114, 1468, 756, 14)} fill={SMOKE} />
      </Sheet>
      <Sheet viewBox={VIEW}>
        <Caption cue={shown.cue} />
      </Sheet>
    </div>
  );
}

//a new panel slides in like the next one along the card, and new parts pop in with a little bounce
const keyframes = `
.ec-in {
  animation: ec-in 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes ec-in {
  from { transform: translateX(60px); opacity: 0; }
}
.ec-pop {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: ec-pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1) both;
}
@keyframes ec-pop {
  from { transform: scale(0.6); opacity: 0; }
}
.ec-flame {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: ec-flame 0.45s ease-in-out infinite alternate;
}
@keyframes ec-flame {
  from { transform: scale(1, 0.88); }
  to { transform: scale(0.94, 1.1); }
}
.ec-smoke {
  animation: ec-smoke 3s ease-in-out infinite alternate;
}
@keyframes ec-smoke {
  to { transform: translate(6px, -10px); }
}
.ec-pulse {
  animation: ec-pulse 1s steps(1) infinite;
}
@keyframes ec-pulse {
  50% { opacity: 0; }
}
.ec-bang {
  transform-box: fill-box;
  transform-origin: center;
  animation: ec-bang 0.5s ease-out infinite alternate;
}
@keyframes ec-bang {
  to { transform: scale(1.1) rotate(4deg); }
}
.ec-shake {
  animation: ec-shake 0.14s linear infinite alternate;
}
@keyframes ec-shake {
  to { transform: translateX(2px); }
}
.ec-breeze {
  animation: ec-breeze 1.6s ease-in-out infinite;
}
@keyframes ec-breeze {
  from { transform: translateX(12px); opacity: 0; }
  50% { opacity: 1; }
  to { transform: translateX(-24px); opacity: 0; }
}
.ec-march {
  animation: ec-march 0.8s linear infinite;
}
@keyframes ec-march {
  to { stroke-dashoffset: -56; }
}
.ec-blink {
  animation: ec-blink 0.6s steps(1) infinite;
}
@keyframes ec-blink {
  50% { fill: #dfeaff; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: SEAT,
    overflow: 'hidden',
  },
};

export default SafetyCard;
