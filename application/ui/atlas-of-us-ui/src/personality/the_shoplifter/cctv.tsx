import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Shoplifter is seen through the shop's own security cameras: four grainy black-and-white feeds, one over the
// till, one down the aisle, one on the door and one in the stockroom, with the camera name and a ticking timestamp in
// the corners, scanlines, and a burst of static whenever the picture cuts to another camera. Each camera is a real
// perspective view of the same little shop, so people get smaller as they walk away. The player is the one in the red
// tracking box, and anyone else the camera catches moving gets an amber MOTION box. A cue names a camera, or all four
// at once, the day and time on the clock, and the parts to show: parts already in shot stay put, new ones flicker in
// after them, and anything no longer in the cue is simply gone, like a jump in low-frame-rate footage. A cue can zoom
// the picture in, play back old footage, or go dark for the night. Everything is SVG in a fixed 1600x900 space,
// scaled to cover the screen. The pictures keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];
type V3 = [number, number, number];

//the greys of the feed, darkest first, with a hint of green
const G = ['#121614', '#232926', '#363d39', '#4b534e', '#626a64', '#7b837c', '#959d96', '#b0b7b0', '#cbd1ca', '#e6eae4', '#f7f9f5'];
const RED = '#ff3b30'; //your tracking box, and nothing else
const AMBER = '#f2c14e';
const OSD = '#f2f5ef';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: shapes and lines, and lettering. m lays it onto a surface, cls is for anything that moves
type Item =
  | { d: string; fill?: string; stroke?: string; w?: number; op?: number; dash?: string; rule?: 'evenodd'; m?: string; cls?: string }
  | { text: string; x: number; y: number; size: number; c: string; bold?: boolean; anchor?: 'start' | 'end'; m?: string };

const EDGE = 'rgba(10, 14, 12, 0.45)';
const PART_GAP = 0.3; //seconds between one part flickering in and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map((n) => +n.toFixed(1)).join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => (pts.length > 2 ? `${line(...pts)} Z` : '');
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const circle = (x: number, y: number, r: number) => ellipse(x, y, r, r);
const words = (text: string, x: number, y: number, size: number, more: Partial<{ c: string; bold: boolean; anchor: 'start' | 'end'; m: string }> = {}): Item => ({ text, x, y, size, c: G[1], ...more });

//a grey lightened (k > 0) or darkened (k < 0)
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

//pseudo-random but fixed, so the shelves are stocked the same every time
const rand = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

//a figure drawn 100 units tall with its feet at 0, facing screen right (dir 1), left (-1) or the camera (0). Seen
//through a security camera, nobody has a face
type Pose = 'stand' | 'reach' | 'point' | 'up' | 'phone' | 'look' | 'mug' | 'bang' | 'run' | 'crouch' | 'sit';
type Dir = 1 | -1 | 0;
interface Look {
  top: string;
  legs: string;
  hair: string;
  skin: string;
  style: 'short' | 'long' | 'bald' | 'cap';
  kind?: 'tabard' | 'blazer' | 'vest';
}

const YOU: Look = { top: G[3], legs: G[1], hair: G[1], skin: G[7], style: 'short', kind: 'tabard' };
const FRANK: Look = { top: G[5], legs: G[2], hair: G[8], skin: G[7], style: 'bald' };
const BOY: Look = { top: G[2], legs: G[1], hair: G[0], skin: G[6], style: 'short', kind: 'blazer' };
const LAD: Look = { top: G[2], legs: G[2], hair: G[6], skin: G[8], style: 'short', kind: 'blazer' };
const LAD2: Look = { top: G[1], legs: G[1], hair: G[1], skin: G[5], style: 'short', kind: 'blazer' };
const GIRL: Look = { top: G[4], legs: G[1], hair: G[1], skin: G[7], style: 'long' };
const COP: Look = { top: G[1], legs: G[0], hair: G[1], skin: G[7], style: 'cap', kind: 'vest' };
const COP2: Look = { ...COP, skin: G[5] };

function figure({ top, legs, hair, skin, style, kind }: Look, pose: Pose, dir: Dir): Item[] {
  const fs = dir || 1;
  const hip = pose === 'sit' ? -30 : pose === 'crouch' ? -24 : -48;
  const lean = pose === 'crouch' ? fs * 8 : pose === 'run' ? fs * 5 : 0;
  const sh = hip - (pose === 'crouch' ? 30 : 34);
  const out: Item[] = [{ d: ellipse(pose === 'sit' ? fs * 8 : 0, 0, 22, 5), fill: G[0], op: 0.3 }];
  const limb = (c: string, w: number, ...pts: Pt[]): Item => ({ d: line(...pts), stroke: c, w });

  //legs
  if (pose === 'sit') out.push(limb(legs, 12, [0, hip], [fs * 16, hip + 1], [fs * 17, -3]));
  else if (pose === 'crouch') out.push(limb(legs, 11, [0, hip], [fs * 15, -17], [fs * 11, -3]));
  else if (pose === 'run') out.push(limb(legs, 9, [-3, hip], [-13, -3]), limb(legs, 9, [3, hip], [14, -7]));
  else out.push(limb(legs, 9, [-5, hip], [-6, -3]), limb(legs, 9, [5, hip], [6, -3]));

  //arms: where each hand goes, through an elbow if it bends
  const L: Pt = [lean - 13, sh + 5];
  const R: Pt = [lean + 13, sh + 5];
  const front = fs > 0 ? R : L;
  const back = fs > 0 ? L : R;
  const down = (s: Pt): Pt[] => [s, [s[0] + Math.sign(s[0] - lean) * 3, hip + 2]];
  let arms: { pts: Pt[]; behind?: boolean; prop?: Item }[];
  const hold = (x: number, y: number, w: number, h: number, c: string): Item => ({ d: rect(x - w / 2, y - h / 2, w, h), fill: c });
  switch (pose) {
    case 'reach':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 32, sh + 15]] }];
      break;
    case 'point':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 37, sh + 3]] }];
      break;
    case 'up':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 22, sh - 6], [fs * 24, sh - 30]] }];
      break;
    case 'phone':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 18, sh + 18], [lean + fs * 9, sh - 9]], prop: hold(lean + fs * 9, sh - 10, 4, 9, G[0]) }];
      break;
    case 'look':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 18, sh + 22], [fs * 20, sh + 8]], prop: hold(fs * 20, sh + 5, 8, 11, G[9]) }];
      break;
    case 'mug':
      arms = [{ pts: down(back), behind: true }, { pts: [front, [fs * 16, sh + 22], [fs * 17, sh + 11]], prop: hold(fs * 18, sh + 9, 8, 9, G[9]) }];
      break;
    case 'bang':
      arms = [{ pts: [L, [lean - 21, sh - 6], [lean - 20, sh - 27]] }, { pts: [R, [lean + 21, sh - 6], [lean + 20, sh - 27]] }];
      break;
    case 'run':
      arms = [{ pts: [back, [-fs * 16, sh + 20]], behind: true }, { pts: [front, [fs * 19, sh + 22]] }];
      break;
    case 'crouch':
      arms = [{ pts: [back, [lean + fs * 12, -8]], behind: true }, { pts: [front, [lean + fs * 22, -5]] }];
      break;
    case 'sit':
      arms = [{ pts: [back, [fs * 10, hip]], behind: true }, { pts: [front, [fs * 16, hip - 2]] }];
      break;
    default:
      arms = [{ pts: down(L) }, { pts: down(R) }];
  }
  //the lads in 'bang' and anyone facing the camera have both arms in front
  const arm = ({ pts, prop }: (typeof arms)[number]): Item[] => [
    limb(top, 7, ...pts),
    { d: circle(...pts[pts.length - 1], 3.5), fill: skin },
    ...(prop ? [prop] : []),
  ];
  if (dir !== 0) out.push(...arms.filter((a) => a.behind).flatMap(arm));

  //body
  const body = `M -12 ${hip} L ${lean - 15} ${sh + 6} Q ${lean - 15} ${sh} ${lean - 9} ${sh} L ${lean + 9} ${sh} Q ${lean + 15} ${sh} ${lean + 15} ${sh + 6} L 12 ${hip} Z`;
  out.push({ d: body, fill: kind === 'vest' ? G[9] : top });
  if (kind === 'tabard') out.push({ d: `M -9 ${hip} L ${lean - 10} ${sh + 4} L ${lean + 10} ${sh + 4} L 9 ${hip} Z`, fill: G[8] });
  if (kind === 'blazer') out.push({ d: `M ${lean - 5} ${sh} L ${lean} ${sh + 13} L ${lean + 5} ${sh} Z`, fill: G[9] }, limb(G[5], 2, [lean, sh + 3], [lean, sh + 14]));
  if (kind === 'vest') out.push(...[13, 23].map((y) => ({ d: rect(lean - 15, sh + y, 30, 3), fill: G[5] })));
  out.push({ d: `M 2 ${hip} L ${lean + 3} ${sh} L ${lean + 9} ${sh} Q ${lean + 15} ${sh} ${lean + 15} ${sh + 6} L 12 ${hip} Z`, fill: '#000', op: 0.15 });
  out.push(...arms.filter((a) => dir === 0 || !a.behind).flatMap(arm));

  //head
  const hx = lean + fs * 2;
  const hy = sh - 12;
  if (style === 'long') out.push({ d: rect(hx - (dir ? 6 + dir * 5 : 11), hy - 2, dir ? 12 : 22, 20), fill: hair });
  out.push({ d: circle(hx, hy, 10), fill: skin });
  if (style === 'bald') out.push({ d: circle(hx - fs * 7, hy + 1, 5), fill: hair });
  else if (style === 'cap') out.push({ d: rect(hx - 11, hy - 14, 22, 9), fill: G[0] }, { d: ellipse(hx + (dir ? fs * 4 : 0), hy - 5, 13, 2.5), fill: G[0] }, { d: circle(hx, hy - 10, 2), fill: G[8] });
  else {
    out.push({ d: `M ${hx - 10.5} ${hy + 1} A 10.5 10.5 0 0 1 ${hx + 10.5} ${hy + 1} Q ${hx + (dir ? fs * 3 : 0)} ${hy - 5} ${hx - 10.5} ${hy + 1} Z`, fill: hair });
    if (dir) out.push({ d: circle(hx - fs * 6, hy, 6), fill: hair });
  }
  out.push({ d: `M ${hx + 2} ${hy - 9} A 10 10 0 0 1 ${hx + 2} ${hy + 10} A 7 10 0 0 0 ${hx + 2} ${hy - 9} Z`, fill: '#000', op: 0.15 });
  return out;
}

//the top of a figure in its own units, for drawing a box round it
const figureTop = (pose: Pose) => (pose === 'sit' ? -86 : pose === 'crouch' ? -78 : pose === 'bang' ? -112 : -104);

// ---------------------------------------------------------------------------
// the cameras
// ---------------------------------------------------------------------------

//the shop is 8m wide and 10m deep: x runs left to right as you come in, y from the front window to the back, z up
const F = 950; //how wide the lens is
const NEAR = 0.3;

function lens(at: V3, look: V3) {
  const yaw = Math.atan2(look[0] - at[0], look[1] - at[1]);
  const pitch = Math.atan2(at[2] - look[2], Math.hypot(look[0] - at[0], look[1] - at[1]));
  const [s, c, sp, cp] = [Math.sin(yaw), Math.cos(yaw), Math.sin(pitch), Math.cos(pitch)];
  //into the camera's own right, up and depth
  const toCam = ([x, y, z]: V3): V3 => {
    const [dx, dy, dz] = [x - at[0], y - at[1], z - at[2]];
    return [dx * c - dy * s, (dx * s + dy * c) * sp + dz * cp, (dx * s + dy * c) * cp - dz * sp];
  };
  const screen = ([X, Y, Z]: V3): Pt => [800 + (F * X) / Z, 450 - (F * Y) / Z];
  const P = (x: number, y: number, z = 0) => screen(toCam([x, y, z]));
  //a flat shape, with anything behind the camera cut off
  const clip = (pts: V3[]): Pt[] => {
    const cam = pts.map(toCam);
    const out: V3[] = [];
    cam.forEach((a, i) => {
      const b = cam[(i + 1) % cam.length];
      if (a[2] >= NEAR) out.push(a);
      if (a[2] >= NEAR !== b[2] >= NEAR) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
      }
    });
    return out.map(screen);
  };
  const facing = (n: V3, p: V3) => n[0] * (at[0] - p[0]) + n[1] * (at[1] - p[1]) + n[2] * (at[2] - p[2]) > 0;
  const face = (rings: V3[][], fill: string, more: Partial<{ op: number; stroke: string }> = {}): Item => ({
    d: rings.map((r) => poly(...clip(r))).join(' '),
    fill,
    stroke: EDGE,
    w: 0.8,
    rule: 'evenodd',
    ...more,
  });
  const seg = (a: V3, b: V3, c: string, w = 1.2): Item => {
    const pts = clip([a, b]);
    return { d: pts.length > 1 ? line(...pts) : '', stroke: c, w };
  };
  //a block, x..x+w by y..y+d by z..z+h, lit from above
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, col: string): Item[] => {
    const [X, Y, Z] = [x + w, y + d, z + h];
    const faces: [V3, V3[], number][] = [
      [[0, -1, 0], [[x, y, z], [X, y, z], [X, y, Z], [x, y, Z]], 0],
      [[0, 1, 0], [[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], -0.2],
      [[-1, 0, 0], [[x, y, z], [x, Y, z], [x, Y, Z], [x, y, Z]], -0.08],
      [[1, 0, 0], [[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], -0.14],
      [[0, 0, 1], [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], 0.12],
    ];
    return faces.filter(([n, pts]) => facing(n, pts[2])).map(([, pts, k]) => face([pts], shade(col, k)));
  };
  //a transform that lays shapes and lettering, in centimetres, onto a surface: o is the top left corner, u runs along
  //it to the right, and down runs down it
  const onto = (o: V3, u: V3, down: V3 = [0, 0, -1]) => {
    const [ox, oy] = P(...o);
    const [ax, ay] = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]);
    const [bx, by] = P(o[0] + down[0], o[1] + down[1], o[2] + down[2]);
    const k = (n: number) => +(n / 100).toFixed(4);
    return `matrix(${k(ax - ox)} ${k(ay - oy)} ${k(bx - ox)} ${k(by - oy)} ${+ox.toFixed(1)} ${+oy.toFixed(1)})`;
  };
  //someone standing at x, y, about tall metres high
  const person = (x: number, y: number, who: Look, pose: Pose = 'stand', dir: Dir = 1, tall = 1.7) => {
    const [fx, fy] = P(x, y);
    const k = (fy - P(x, y, tall)[1]) / 100;
    const m = `matrix(${+k.toFixed(3)} 0 0 ${+k.toFixed(3)} ${+fx.toFixed(1)} ${+fy.toFixed(1)})`;
    const items = figure(who, pose, dir).map((it) => ({ ...it, m }));
    const box: [number, number, number, number] = [fx - 30 * k, fy + figureTop(pose) * k, 60 * k, (6 - figureTop(pose)) * k];
    return { items, box };
  };
  //the inside of a room, whichever of its walls face the camera
  const room = (x0: number, y0: number, x1: number, y1: number, h: number, front = true): Item[] => {
    const walls: [V3, V3[], string][] = [
      [[0, 0, 1], [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], G[5]],
      [[0, 0, -1], [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], G[8]],
      [[1, 0, 0], [[x0, y0, 0], [x0, y1, 0], [x0, y1, h], [x0, y0, h]], G[7]],
      [[-1, 0, 0], [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]], G[7]],
      [[0, -1, 0], [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], G[6]],
      ...(front ? [[[0, 1, 0], [[x0, y0, 0], [x1, y0, 0], [x1, y0, h], [x0, y0, h]], G[7]] as [V3, V3[], string]] : []),
    ];
    const out = walls.filter(([n, pts]) => facing(n, pts[0])).map(([, pts, col]) => face([pts], col));
    //floor tiles, and strip lights on the ceiling
    for (let x = x0 + 0.5; x < x1; x += 0.5) out.push(seg([x, y0, 0.001], [x, y1, 0.001], G[4], 1));
    for (let y = y0 + 0.5; y < y1; y += 0.5) out.push(seg([x0, y, 0.001], [x1, y, 0.001], G[4], 1));
    for (let y = y0 + 2; y < y1; y += 2.5)
      for (let x = x0 + 1; x + 1.2 < x1; x += 2.6) out.push(face([[[x, y, h - 0.01], [x + 1.2, y, h - 0.01], [x + 1.2, y + 0.14, h - 0.01], [x, y + 0.14, h - 0.01]]], G[10], { stroke: G[9] }));
    return out;
  };
  //a shelving unit, stocked on whichever of its long sides face the camera
  const shelves = (x: number, y: number, w: number, d: number, h: number, seed: number, special?: (side: number, along: number, level: number) => string | undefined, levels = [0.12, 0.55, 0.98, 1.4]): Item[] => {
    const out = box(x, y, 0, w, d, h, G[6]);
    for (const side of [x, x + w]) {
      const n: V3 = [side === x ? -1 : 1, 0, 0];
      if (!facing(n, [side, y + d / 2, 1])) continue;
      const sx = side + n[0] * 0.005;
      levels.forEach((z, li) => {
        out.push(seg([sx, y, z], [sx, y + d, z], G[8], 1.5));
        for (let a = y + 0.06, i = 0; a < y + d - 0.12; i++) {
          const r = rand(seed + li * 40 + i);
          const col = special?.(side, a, li) ?? G[2 + Math.floor(r * 7)];
          const pw = col === G[3] || col === G[8] ? 0.09 : 0.16 + r * 0.1;
          const ph = 0.2 + rand(seed + 500 + i + li * 40) * 0.14;
          out.push(face([[[sx, a, z], [sx, a + pw, z], [sx, a + pw, z + ph], [sx, a, z + ph]]], col, { stroke: G[1] }));
          a += pw + 0.03;
        }
      });
    }
    return out;
  };
  return { P, face, seg, box, onto, person, room, shelves, facing };
}

//the four cameras: where each is mounted, and what it's pointed at
const TILL = lens([3.2, 0.3, 2.7], [6.3, 4.6, 0.4]);
const AISLE = lens([3.4, 0.6, 2.7], [3.4, 6.5, 0.3]);
const DOOR = lens([5.4, 4.2, 2.7], [2.4, 0, 0.5]);
const STORE = lens([0.3, 12.3, 2.6], [2.6, 15.6, 0.9]);

type CamId = 'till' | 'aisle' | 'door' | 'store';
const CAMS: Record<CamId, string> = { till: 'CAM 1  REGISTER', aisle: 'CAM 2  AISLE 2', door: 'CAM 3  DOOR', store: 'CAM 4  STOCKROOM' };

//you, in your red tracking box, and anyone else the camera sees moving, in an amber one
function you({ items, box: [x, y, w, h] }: ReturnType<typeof TILL.person>): Item[] {
  const t = Math.min(w, h) * 0.25;
  const corners = `M ${x} ${y + t} V ${y} H ${x + t} M ${x + w - t} ${y} H ${x + w} V ${y + t} M ${x + w} ${y + h - t} V ${y + h} H ${x + w - t} M ${x + t} ${y + h} H ${x} V ${y + h - t}`;
  return [...items, { d: corners, stroke: RED, w: 3 }];
}
function moving({ items, box: [x, y, w, h] }: ReturnType<typeof TILL.person>): Item[] {
  return [...items, { d: rect(x, y, w, h), stroke: AMBER, w: 2, dash: '7 4' }, words('MOTION', x, y - 6, 14, { c: AMBER, anchor: 'start', bold: true })];
}

// ---------------------------------------------------------------------------
// the shop, through each camera, back to front. Parts starting with _ are always in shot
// ---------------------------------------------------------------------------

//the counter runs front to back on the right; the staff side is between it and the wall
const counter = (L: typeof TILL): Item[] => [
  ...L.box(5.6, 1.6, 0, 0.8, 3.0, 1.0, G[5]),
  ...[2.35, 3.1, 3.85].map((y) => L.seg([5.595, y, 0.05], [5.595, y, 0.95], G[3])),
  ...L.box(5.7, 1.75, 1.0, 0.25, 0.4, 0.35, G[8]),
  ...L.box(5.85, 2.75, 1.0, 0.42, 0.45, 0.1, G[2]),
  ...L.box(5.95, 2.85, 1.1, 0.06, 0.25, 0.22, G[1]),
  L.face([[[5.948, 2.88, 1.14], [5.948, 3.07, 1.14], [5.948, 3.07, 1.29], [5.948, 2.88, 1.29]]], G[7]),
  ...L.box(5.75, 3.35, 1.0, 0.1, 0.14, 0.05, G[1]),
  ...L.box(6.15, 3.95, 1.0, 0.2, 0.32, 0.26, G[1]),
];

//the till's sign, stuck to the top of the shelves behind it
const SIGN: Item[] = [
  { d: rect(4, 3, 112, 44), fill: G[10] },
  words('ALL SHOPLIFTERS', 60, 15, 8.5, { bold: true }),
  words('WILL BE REPORTED', 60, 25, 8),
  words('TO THE POLICE.', 60, 34, 8),
  words('NO EXCEPTIONS.', 60, 44, 8.5, { bold: true }),
];
const SIGN_ON = TILL.onto([7.59, 3.82, 2.3], [0, -1, 0]);
const SIGN_AT = TILL.P(7.59, 3.25, 2.08);

//chocolate on the right of aisle 2, plasters and medicine on the left
const stockB = (_side: number, along: number, level: number) => (along < 5.0 && (level === 1 || level === 2) ? (Math.floor(along * 11) % 2 ? G[3] : G[8]) : undefined);
const stockA = (_side: number, along: number, level: number) => (along > 6.2 && along < 7.0 && level >= 2 ? G[10] : undefined);

const fridges = (L: typeof TILL): Item[] => [
  ...L.box(0.3, 9.4, 0, 5.3, 0.6, 2.1, G[7]),
  ...[0, 1, 2, 3].flatMap((i) => {
    const x = 0.4 + i * 1.3;
    return [
      L.face([[[x, 9.395, 0.15], [x + 1.15, 9.395, 0.15], [x + 1.15, 9.395, 1.85], [x, 9.395, 1.85]]], G[2]),
      ...[0.3, 0.72, 1.14, 1.56].flatMap((z, j) => [0, 1, 2, 3, 4].map((k) => L.face([[[x + 0.05 + k * 0.22, 9.39, z], [x + 0.22 + k * 0.22, 9.39, z], [x + 0.22 + k * 0.22, 9.39, z + 0.24], [x + 0.05 + k * 0.22, 9.39, z + 0.24]]], G[5 + Math.floor(rand(i * 30 + j * 6 + k) * 5)], { stroke: G[2] }))),
    ];
  }),
  L.face([[[0.3, 9.39, 1.9], [5.6, 9.39, 1.9], [5.6, 9.39, 2.08], [0.3, 9.39, 2.08]]], G[10]),
];

const ART: Record<CamId, Record<string, Item[]>> = {
  till: {
    _room: [
      ...TILL.room(0, 0, 8, 10, 2.8),
      ...fridges(TILL),
      ...TILL.shelves(2.2, 3.5, 0.6, 5, 1.8, 1, stockA),
      ...TILL.shelves(4.0, 3.5, 0.6, 5, 1.8, 2, stockB),
      //the shelves behind the till
      ...TILL.shelves(7.6, 1.4, 0.4, 3.6, 2.3, 3, undefined, [1.0, 1.42, 1.84]),
      //a poster on the wall
      ...((m) => [{ d: rect(0, 0, 70, 90), fill: G[9], m }, { d: rect(6, 8, 58, 40), fill: G[3], m }, words('LOTTO', 35, 66, 16, { bold: true, m }), words('Tonight', 35, 80, 9, { m })])(TILL.onto([7.99, 5.3, 2.1], [0, 1, 0])),
    ],
    _sign: SIGN.map((it) => ({ ...it, m: SIGN_ON })),
    tape_sign: [rect(-2, -1, 16, 6), rect(106, -1, 16, 6)].map((d) => ({ d, fill: G[10], op: 0.8, m: SIGN_ON })),
    dennis_away: TILL.person(7.05, 6.4, FRANK, 'stand', 1, 1.75).items,
    you_till: you(TILL.person(7.15, 3.9, YOU, 'stand', -1)),
    you_phone: you(TILL.person(7.15, 3.9, YOU, 'phone', -1)),
    you_reach: you(TILL.person(7.15, 3.9, YOU, 'reach', -1)),
    you_look: you(TILL.person(7.15, 3.9, YOU, 'look', -1)),
    dennis_point: TILL.person(7.1, 2.5, FRANK, 'point', -1, 1.75).items,
    dennis_mug: TILL.person(7.1, 2.5, FRANK, 'mug', -1, 1.75).items,
    dennis_tap: TILL.person(7.2, 2.5, FRANK, 'up', 1, 1.75).items,
    _counter: counter(TILL),
    radio: [...TILL.box(5.95, 4.3, 1.0, 0.35, 0.22, 0.2, G[2]), TILL.face([[[6.0, 4.298, 1.04], [6.15, 4.298, 1.04], [6.15, 4.298, 1.16], [6.0, 4.298, 1.16]]], G[4])],
    radio_on: ((p) => [1, 2, 3].map((i) => ({ d: `M ${p[0] - 6 * i} ${p[1] - 12 * i} q ${-10 * i} ${12 * i} 0 ${24 * i}`, stroke: G[10], w: 2, cls: `sl-wave sl-wave-${i}` })))(TILL.P(5.97, 4.29, 1.1)),
    goods: [...TILL.box(5.68, 3.7, 1.0, 0.2, 0.13, 0.08, G[9]), ...TILL.box(5.72, 3.98, 1.0, 0.07, 0.07, 0.15, G[8]), ...TILL.box(5.72, 3.98, 1.15, 0.07, 0.07, 0.04, G[3])],
    sandwich: TILL.box(5.68, 3.7, 1.0, 0.2, 0.13, 0.08, G[9]),
    coins: [[5.72, 3.42], [5.78, 3.5], [5.7, 3.54]].map(([x, y]) => ({ d: ellipse(...TILL.P(x, y, 1.002), 4, 2.4), fill: G[9] })),
    boy_counter: TILL.person(4.9, 3.7, BOY, 'stand', 1, 1.6).items,
    boy_reach: TILL.person(4.9, 3.7, BOY, 'reach', 1, 1.6).items,
    girl_counter: TILL.person(4.9, 3.7, GIRL, 'reach', 1, 1.6).items,
  },

  aisle: {
    _room: [
      ...AISLE.room(0, 0, 8, 10, 2.8),
      ...fridges(AISLE),
      ...AISLE.shelves(2.2, 3.5, 0.6, 5, 1.8, 1, stockA),
      ...AISLE.shelves(4.0, 3.5, 0.6, 5, 1.8, 2, stockB),
      ...((m) => [{ d: rect(0, 0, 80, 18), fill: G[9], m }, words('HEALTH', 40, 14, 13, { bold: true, m })])(AISLE.onto([2.81, 6.2, 2.08], [0, 1, 0])),
      ...((m) => [{ d: rect(0, 0, 80, 18), fill: G[9], m }, words('CANDY', 40, 14, 13, { bold: true, m })])(AISLE.onto([3.99, 4.8, 2.08], [0, -1, 0])),
      ...counter(AISLE),
    ],
    boy_aisle: moving(AISLE.person(3.3, 6.6, BOY, 'reach', -1, 1.6)),
    girl_aisle: moving(AISLE.person(3.55, 4.7, GIRL, 'reach', 1, 1.6)),
  },

  door: {
    //across the road: a launderette with flats over it
    _outside: [
      DOOR.face([[[-6, -10, 0], [12, -10, 0], [12, -10, 8], [-6, -10, 8]]], G[4]),
      ...[3.8, 5.6].flatMap((z) => [-3, -0.5, 2, 4.5, 7].map((x) => DOOR.face([[[x, -9.99, z], [x + 1.3, -9.99, z], [x + 1.3, -9.99, z + 1.1], [x, -9.99, z + 1.1]]], G[2]))),
      DOOR.face([[[0.5, -9.99, 0.3], [5.5, -9.99, 0.3], [5.5, -9.99, 2.4], [0.5, -9.99, 2.4]]], G[1]),
      DOOR.face([[[0.3, -9.98, 2.6], [5.7, -9.98, 2.6], [5.7, -9.98, 3.2], [0.3, -9.98, 3.2]]], G[8]),
      ...((m) => [words('LAUNDROMAT', 270, 45, 40, { bold: true, m })])(DOOR.onto([5.7, -9.97, 3.2], [-1, 0, 0])),
      DOOR.face([[[-6, -10, 0], [12, -10, 0], [12, -3, 0], [-6, -3, 0]]], G[2]),
      ...[-5, -2, 1, 4, 7, 10].map((x) => DOOR.seg([x, -6.5, 0.001], [x + 1.6, -6.5, 0.001], G[8], 2)),
      ...DOOR.box(-6, -3.15, 0, 18, 0.15, 0.12, G[7]),
      DOOR.face([[[-6, -3, 0.12], [12, -3, 0.12], [12, 0, 0.12], [-6, 0, 0.12]]], G[6]),
      ...[-2.1, -1.2, -0.3].map((y) => DOOR.seg([-6, y, 0.121], [12, y, 0.121], G[5])),
      ...DOOR.box(6.2, -2.8, 0, 0.1, 0.1, 4.6, G[2]),
    ],
    lads_off: [DOOR.person(4.3, -2.5, LAD, 'stand', -1).items, DOOR.person(4.7, -2.7, BOY, 'stand', -1, 1.6).items, DOOR.person(5.1, -2.4, LAD2, 'stand', -1).items].flat(),
    mates_off: [DOOR.person(4.3, -2.5, LAD, 'stand', -1).items, DOOR.person(4.9, -2.6, LAD2, 'stand', -1).items].flat(),
    stand: [...DOOR.box(2.8, -1.3, 0.12, 0.6, 0.05, 1.0, G[8]), ...((m) => [words('LATEST', 30, 18, 12, { bold: true, m }), { d: rect(6, 26, 48, 50), fill: G[6], m }])(DOOR.onto([3.4, -1.25, 1.1], [-1, 0, 0]))],
    stand_down: [
      DOOR.face([[[2.6, -1.6, 0.13], [3.2, -1.3, 0.13], [3.6, -2.2, 0.13], [3.0, -2.5, 0.13]]], G[8]),
      ...[[2.2, -1.1], [3.7, -1.2], [4.2, -1.9], [2.5, -2.4], [3.4, -0.9]].map(([x, y], i) => DOOR.face([[[x, y, 0.13], [x + 0.35, y + 0.08 * (i - 2), 0.13], [x + 0.32, y - 0.25, 0.13], [x - 0.03, y - 0.3, 0.13]]], G[9])),
    ],
    pass: [DOOR.face([[[0.8, -0.45, 0.125], [1.0, -0.4, 0.125], [1.03, -0.52, 0.125], [0.83, -0.57, 0.125]]], G[10])],
    you_out_crouch: you(DOOR.person(3.6, -1.6, YOU, 'crouch', -1)),
    boy_out: DOOR.person(2.7, -0.9, BOY, 'stand', -1, 1.6).items,
    you_out: you(DOOR.person(1.85, -1.1, YOU, 'stand', 1)),
    lads: [moving(DOOR.person(2.3, -0.6, LAD, 'stand', 0)), moving(DOOR.person(3.2, -0.7, BOY, 'stand', 0, 1.6)), moving(DOOR.person(4.1, -0.6, LAD2, 'stand', 0))].flat(),
    lads_bang: [moving(DOOR.person(2.3, -0.5, LAD, 'bang', 0)), moving(DOOR.person(3.2, -0.6, BOY, 'look', 1, 1.6)), moving(DOOR.person(4.1, -0.5, LAD2, 'bang', 0))].flat(),
    //the shop front, from inside: the door on the left, the window
    _room: DOOR.room(0, 0, 8, 10, 2.8, false),
    _wall: [
      DOOR.face(
        [
          [[0, 0, 0], [8, 0, 0], [8, 0, 2.8], [0, 0, 2.8]],
          [[0.6, 0, 0], [1.6, 0, 0], [1.6, 0, 2.2], [0.6, 0, 2.2]],
          [[1.9, 0, 0.5], [5.4, 0, 0.5], [5.4, 0, 2.3], [1.9, 0, 2.3]],
        ],
        G[7],
      ),
      ...DOOR.box(1.85, 0, 0.45, 3.6, 0.2, 0.05, G[8]),
      DOOR.seg([3.65, 0, 0.5], [3.65, 0, 2.3], G[2], 5),
      DOOR.face([[[1.9, 0, 0.5], [5.4, 0, 0.5], [5.4, 0, 2.3], [1.9, 0, 2.3]]], G[10], { op: 0.08 }),
      DOOR.face([[[1.95, 0.005, 0.55], [2.6, 0.005, 0.55], [2.6, 0.005, 1.3], [1.95, 0.005, 1.3]]], G[10], { op: 0.85 }),
      DOOR.face([[[4.7, 0.005, 0.55], [5.35, 0.005, 0.55], [5.35, 0.005, 1.1], [4.7, 0.005, 1.1]]], G[10], { op: 0.85 }),
    ],
    door_shut: [DOOR.face([[[0.6, 0, 0], [1.6, 0, 0], [1.6, 0, 2.2], [0.6, 0, 2.2]], [[0.7, 0, 0.15], [1.5, 0, 0.15], [1.5, 0, 2.1], [0.7, 0, 2.1]]], G[2]), DOOR.face([[[0.7, 0, 0.15], [1.5, 0, 0.15], [1.5, 0, 2.1], [0.7, 0, 2.1]]], G[10], { op: 0.1 }), DOOR.seg([0.75, 0.02, 1.05], [1.45, 0.02, 1.05], G[8], 4)],
    door_closed: [
      DOOR.face([[[0.6, 0, 0], [1.6, 0, 0], [1.6, 0, 2.2], [0.6, 0, 2.2]], [[0.7, 0, 0.15], [1.5, 0, 0.15], [1.5, 0, 2.1], [0.7, 0, 2.1]]], G[2]),
      DOOR.face([[[0.7, 0, 0.15], [1.5, 0, 0.15], [1.5, 0, 2.1], [0.7, 0, 2.1]]], G[10], { op: 0.1 }),
      ...((m) => [{ d: rect(0, 0, 44, 16), fill: G[9], m }, words('CLOSED', 22, 12, 10, { bold: true, m })])(DOOR.onto([1.32, 0.02, 1.7], [-1, 0, 0])),
    ],
    door_open: [DOOR.face([[[0.6, 0, 0], [0.86, 0.97, 0], [0.86, 0.97, 2.2], [0.6, 0, 2.2]]], G[2]), DOOR.face([[[0.63, 0.1, 0.15], [0.83, 0.87, 0.15], [0.83, 0.87, 2.1], [0.63, 0.1, 2.1]]], G[9], { op: 0.35 })],
    _inside: [DOOR.face([[[0.4, 0.2, 0.004], [1.8, 0.2, 0.004], [1.8, 1.0, 0.004], [0.4, 1.0, 0.004]]], G[3]), ...counter(DOOR), ...DOOR.shelves(2.2, 3.5, 0.6, 5, 1.8, 1, stockA)],
    boy_enter: moving(DOOR.person(1.4, 1.1, BOY, 'run', -1, 1.6)),
    boy_run: moving(DOOR.person(1.1, 0.35, BOY, 'run', 1, 1.6)),
    crate_boy: [...DOOR.box(1.95, 0.55, 0, 0.45, 0.35, 0.4, G[6]), ...DOOR.person(2.15, 0.75, BOY, 'sit', 1, 1.6).items],
    police: [DOOR.person(1.05, 1.5, COP, 'stand', -1, 1.8).items, DOOR.person(1.55, 2.1, COP2, 'stand', -1, 1.8).items].flat(),
    dennis_window: DOOR.person(3.1, 1.2, FRANK, 'mug', 1, 1.75).items,
  },

  store: {
    _room: [
      ...STORE.room(0, 12, 4, 16, 2.6),
      STORE.face([[[1.6, 15.99, 0], [2.6, 15.99, 0], [2.6, 15.99, 2.1], [1.6, 15.99, 2.1]]], G[3]),
      STORE.seg([1.7, 15.98, 1.0], [2.5, 15.98, 1.0], G[8], 4),
      ...((m) => [{ d: rect(0, 0, 50, 14), fill: G[9], m }, words('FIRE EXIT', 25, 11, 9, { bold: true, m })])(STORE.onto([1.85, 15.98, 2.05], [1, 0, 0])),
      ...STORE.box(3.4, 12.2, 0, 0.6, 3.4, 2.0, G[5]),
      ...[0.1, 0.75, 1.4].flatMap((z, i) => [0, 1, 2, 3].flatMap((j) => STORE.box(3.45, 12.3 + j * 0.8, z, 0.5, 0.65, 0.45, G[6 + ((i + j) % 3)]))),
      ...STORE.box(0.6, 13.6, 0, 0.7, 0.6, 0.5, G[7]),
      ...STORE.box(0.65, 13.65, 0.5, 0.6, 0.5, 0.45, G[6]),
      ...STORE.box(1.5, 14.3, 0, 0.6, 0.5, 0.4, G[8]),
    ],
  },
};
const ORDER = Object.fromEntries(Object.entries(ART).map(([cam, parts]) => [cam, Object.keys(parts)])) as Record<CamId, string[]>;

//shown over the picture rather than in it
const EXPORT: Item[] = [
  { d: rect(990, 300, 540, 180), fill: 'rgba(8, 12, 10, 0.85)', stroke: OSD, w: 2 },
  words('EXPORT CLIP', 1012, 338, 22, { c: OSD, anchor: 'start', bold: true }),
  words('CAM 3  THU NOV 20  15:52:10 - 15:56:41', 1012, 370, 16, { c: OSD, anchor: 'start' }),
  { d: rect(1012, 386, 496, 20), stroke: OSD, w: 1.5 },
  { d: rect(1015, 389, 490, 14), fill: OSD, cls: 'sl-export' },
  words('100%  SAVED TO PHONE', 1012, 434, 16, { c: OSD, anchor: 'start' }),
  words('> SHARE', 1012, 462, 18, { c: AMBER, anchor: 'start', bold: true }),
];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

interface Cue {
  cam: CamId | 'quad';
  day: string;
  clock: string; //hh:mm when the cue starts; the seconds tick on from there
  parts: string[]; //flicker in in this order
  play?: boolean; //old footage, played back
  zoom?: [x: number, y: number, k: number];
  dark?: boolean;
  export?: boolean;
  card?: [kicker: string, name: string];
}

const SAT = 'SAT 15 NOV';
const MON = 'MON 17 NOV';
const THU = 'THU 20 NOV';
const SAT2 = 'SAT 22 NOV';

const cues: Record<string, Cue> = {
  title_card: { cam: 'quad', day: SAT, clock: '16:38', parts: ['door_shut', 'stand'], card: ['4 cameras · recording', 'The Shoplifter'] },
  shop: { cam: 'till', day: SAT, clock: '16:40', parts: ['you_till'] },
  sign: { cam: 'till', day: SAT, clock: '16:41', parts: ['you_till'], zoom: [...SIGN_AT, 2.6] },
  teen_in: { cam: 'door', day: SAT, clock: '16:43', parts: ['stand', 'door_open', 'boy_enter'] },
  pocket: { cam: 'aisle', day: SAT, clock: '16:44', parts: ['boy_aisle'] },
  caught: { cam: 'till', day: SAT, clock: '16:45', parts: ['you_till', 'boy_counter', 'goods'] },
  plea: { cam: 'till', day: SAT, clock: '16:45', parts: ['you_till', 'boy_counter', 'goods'], zoom: [850, 380, 1.5] },
  call: { cam: 'door', day: SAT, clock: '17:31', parts: ['stand', 'door_shut', 'crate_boy', 'police'] },
  ring_dennis: { cam: 'till', day: SAT, clock: '16:46', parts: ['you_phone', 'boy_counter', 'goods'] },
  warn: { cam: 'door', day: SAT, clock: '16:46', parts: ['stand', 'door_open', 'boy_run'] },
  pay: { cam: 'till', day: SAT, clock: '16:46', parts: ['you_reach', 'boy_reach', 'sandwich', 'coins'] },
  tape: { cam: 'aisle', day: SAT, clock: '16:44', parts: ['boy_aisle'], play: true },
  dennis_talks: { cam: 'till', day: MON, clock: '08:15', parts: ['radio', 'dennis_point', 'you_till'] },
  radio: { cam: 'till', day: MON, clock: '08:16', parts: ['radio', 'dennis_mug', 'you_till', 'radio_on'] },
  pol_hard: { cam: 'till', day: MON, clock: '08:18', parts: ['radio', 'dennis_tap', 'you_till', 'tape_sign'] },
  pol_rule: { cam: 'till', day: MON, clock: '08:18', parts: ['radio', 'dennis_tap', 'you_till'] },
  pol_depends: { cam: 'till', day: MON, clock: '08:18', parts: ['radio', 'dennis_away', 'you_till'] },
  pol_help: { cam: 'door', day: MON, clock: '08:21', parts: ['stand', 'door_shut', 'dennis_window'] },
  lads: { cam: 'door', day: THU, clock: '15:52', parts: ['stand', 'door_shut', 'lads'] },
  taunt: { cam: 'door', day: THU, clock: '15:53', parts: ['stand_down', 'door_shut', 'lads_bang'] },
  bus_pass: { cam: 'door', day: THU, clock: '15:54', parts: ['stand_down', 'door_shut', 'lads', 'pass'] },
  taunt_ignore: { cam: 'door', day: THU, clock: '16:04', parts: ['stand_down', 'door_shut', 'lads_off', 'you_out_crouch'] },
  taunt_talk: { cam: 'door', day: THU, clock: '15:58', parts: ['stand_down', 'door_shut', 'mates_off', 'boy_out', 'you_out'] },
  taunt_report: { cam: 'till', day: THU, clock: '16:10', parts: ['you_phone'] },
  taunt_back: { cam: 'till', day: THU, clock: '16:12', parts: ['you_look'], export: true },
  again: { cam: 'aisle', day: SAT2, clock: '16:40', parts: ['girl_aisle'] },
  homework: { cam: 'quad', day: SAT2, clock: '22:10', parts: ['door_closed'], dark: true },
  goodbye: { cam: 'till', day: SAT2, clock: '16:42', parts: ['you_reach', 'girl_counter', 'coins'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// a cue, and its parts
// ---------------------------------------------------------------------------

function Mark({ item }: { item: Item }) {
  if ('text' in item) {
    return (
      <text transform={item.m} style={{ fontFamily: MONO, fontWeight: item.bold ? 700 : 400 }} x={item.x} y={item.y} fontSize={item.size} textAnchor={item.anchor ?? 'middle'} fill={item.c}>
        {item.text}
      </text>
    );
  }
  return (
    <path
      className={item.cls}
      transform={item.m}
      d={item.d}
      fill={item.fill ?? 'none'}
      fillRule={item.rule}
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
  starts: Record<string, number>; //when each part flickered in, in seconds after it appeared
  cut: number; //counts cuts to another camera, so the static plays again
}

//on the same camera, new parts flicker in one after another; a cut to another camera shows everything at once
function turn(shown: Shown, cue: Cue): Shown {
  if (cue.cam !== shown.cue.cam) return { cue, starts: {}, cut: shown.cut + 1 };
  const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
  return { cue, starts: { ...shown.starts, ...Object.fromEntries(added.map((p, i) => [p, 0.2 + i * PART_GAP])) }, cut: shown.cut };
}

function Feed({ cam, now }: { cam: CamId; now: Shown }) {
  return (
    <>
      {ORDER[cam]
        .filter((p) => p.startsWith('_') || now.cue.parts.includes(p))
        .map((p) => (
          <g key={p} className={now.starts[p] !== undefined ? 'sl-pop' : undefined} style={{ animationDelay: `${now.starts[p] ?? 0}s` }}>
            {ART[cam][p].map((item, i) => (
              <Mark key={i} item={item} />
            ))}
          </g>
        ))}
    </>
  );
}

//the quad split, in the top of the screen
const QUAD: [CamId, number, number][] = [
  ['till', 236, 20],
  ['aisle', 804, 20],
  ['door', 236, 343],
  ['store', 804, 343],
];
const CELL: Pt = [560, 315];

//hh:mm plus some seconds, as hh:mm:ss
const stamp = (clock: string, secs: number) => {
  const [h, m] = clock.split(':').map(Number);
  const t = h * 3600 + m * 60 + secs;
  return [Math.floor(t / 3600) % 24, Math.floor(t / 60) % 60, t % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  shop: new URL('./sounds/shop.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the shop, with the street coming through on the door camera, and just the fridges at night
function mixFor(name: string, cue: Cue): Partial<Record<Bed, number>> {
  if (cue.dark) return { shop: 0.2, street: 0.15 };
  if (name.startsWith('taunt_') && cue.cam === 'door') return { street: 0.75, shop: 0.2 };
  if (cue.cam === 'door') return { shop: 0.5, street: 0.45 };
  return { shop: 0.7 };
}

const BELL: OneShot = { src: new URL('./sounds/bell.m4a', import.meta.url).href, volume: 0.5, delay: 0.5 };
const COINS: OneShot = { src: new URL('./sounds/coins.m4a', import.meta.url).href, volume: 0.6, delay: 1.2 };
const ONE_SHOTS: Record<string, OneShot> = {
  teen_in: BELL,
  warn: BELL,
  again: BELL,
  pay: COINS,
  goodbye: COINS,
  tape: { src: new URL('./sounds/static.m4a', import.meta.url).href, volume: 0.5, delay: 0.1 },
  taunt: { src: new URL('./sounds/knock.m4a', import.meta.url).href, volume: 0.8, delay: 0.6 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Cctv({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [now, setNow] = useState<Shown>(() => ({ cue: cues[first], starts: {}, cut: 0 }));
  const [tick, setTick] = useState(0);
  const [cueTick, setCueTick] = useState(0);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setNow((n) => turn(n, cues[animation]));
      setCueTick(tick);
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Shoplifter has no cue for the animation "${animation}"`);
  }, [animation]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
    sound.current?.mix(mixFor(active, cues[active]));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { cue } = now;
  const [zx, zy, zk] = cue.zoom ?? [800, 330, 1];
  const time = `${cue.day}  ${stamp(cue.clock, 7 + tick - cueTick)}`;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="sl-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="4" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="sl-soft">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
          <pattern id="sl-lines" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="2" fill="#000" opacity="0.22" />
          </pattern>
          <radialGradient id="sl-vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="sl-roll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="#050706" />

        {cue.cam === 'quad' ? (
          QUAD.map(([cam, x, y]) => (
            <g key={cam}>
              <svg x={x} y={y} width={CELL[0]} height={CELL[1]} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ filter: 'url(#sl-soft)' }}>
                <Feed cam={cam} now={now} />
              </svg>
              <text x={x + 14} y={y + 30} fontSize={18} fill={OSD} style={styles.osd}>
                {CAMS[cam]}
              </text>
            </g>
          ))
        ) : (
          <g key={`${cue.cam}-${now.cut}`} style={{ filter: 'url(#sl-soft)' }}>
            <g style={{ transform: `translate(${800 - zk * zx}px, ${330 - zk * zy}px) scale(${zk})`, transition: 'transform 1s steps(6)' }}>
              <Feed cam={cue.cam} now={now} />
            </g>
          </g>
        )}

        {cue.dark && <rect width={W} height={H} fill="#000" opacity={0.6} />}
        <rect width={W} height={H} fill="url(#sl-lines)" />
        <rect className="sl-grain" x={-60} y={-60} width={W + 120} height={H + 120} filter="url(#sl-grain)" opacity={0.13} />
        <rect className="sl-roll" width={W} height={160} fill="url(#sl-roll)" />
        {cue.play && <rect className="sl-track" y={560} width={W} height={26} filter="url(#sl-grain)" opacity={0.5} />}
        <rect width={W} height={H} fill="url(#sl-vignette)" />
        <rect key={now.cut} className="sl-cut" x={-60} y={-60} width={W + 120} height={H + 120} filter="url(#sl-grain)" />

        {cue.export && EXPORT.map((item, i) => <Mark key={i} item={item} />)}
        <g fill={OSD} style={styles.osd}>
          {cue.cam === 'quad' ? (
            <text x={800} y={H - 230} fontSize={24} textAnchor="middle">
              {time}
            </text>
          ) : (
            <>
              <text x={70} y={80} fontSize={30}>
                {CAMS[cue.cam]}
              </text>
              <text x={W - 70} y={80} fontSize={30} textAnchor="end">
                {time}
              </text>
              <text x={70} y={120} fontSize={22} fill={cue.play ? AMBER : OSD}>
                {cue.play ? '>> PLAYBACK  x1' : 'LIVE'}
              </text>
              {cue.zoom && (
                <text x={W - 70} y={120} fontSize={22} textAnchor="end">
                  {`ZOOM x${cue.zoom[2].toFixed(1)}`}
                </text>
              )}
            </>
          )}
          {cue.dark && (
            <text x={800} y={H - 200} fontSize={20} textAnchor="middle">
              IR NIGHT MODE
            </text>
          )}
        </g>
      </svg>

      <div style={{ ...styles.card, opacity: cue.card ? 1 : 0 }}>
        {cue.card && (
          <div style={styles.panel}>
            <div style={styles.kicker}>{cue.card[0]}</div>
            <div style={styles.name}>{cue.card[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.sl-pop {
  animation: sl-pop 0.4s steps(1) backwards;
}
@keyframes sl-pop {
  from { opacity: 0; }
  40% { opacity: 0.6; }
  60% { opacity: 0.2; }
  80% { opacity: 1; }
}
.sl-cut {
  animation: sl-cut 0.4s steps(3) forwards;
}
@keyframes sl-cut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.sl-grain {
  animation: sl-grain 0.5s steps(1) infinite;
}
@keyframes sl-grain {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-31px, 17px); }
  40% { transform: translate(23px, -41px); }
  60% { transform: translate(-13px, 29px); }
  80% { transform: translate(37px, 11px); }
}
.sl-roll {
  animation: sl-roll 7s linear infinite;
}
@keyframes sl-roll {
  from { transform: translateY(-160px); }
  to { transform: translateY(${H}px); }
}
.sl-track {
  animation: sl-track 0.6s steps(3) infinite;
}
@keyframes sl-track {
  0% { transform: translateY(0); }
  33% { transform: translateY(-14px); }
  66% { transform: translateY(9px); }
}
.sl-wave {
  animation: sl-wave 1.2s steps(3) infinite;
}
.sl-wave-2 { animation-delay: -0.4s; }
.sl-wave-3 { animation-delay: -0.8s; }
@keyframes sl-wave {
  from { opacity: 0; }
  50% { opacity: 0.9; }
  to { opacity: 0; }
}
.sl-export {
  transform-origin: 1015px 0;
  animation: sl-export 2.5s steps(10) backwards;
  animation-delay: 0.5s;
}
@keyframes sl-export {
  from { transform: scaleX(0); }
}
`;

const MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: '#050706',
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  osd: {
    fontFamily: MONO,
    letterSpacing: 2,
    paintOrder: 'stroke',
    stroke: '#000',
    strokeWidth: 4,
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
  //the recorder's on-screen menu
  panel: {
    textAlign: 'center',
    padding: '18px 44px 22px',
    fontFamily: MONO,
    color: OSD,
    background: 'rgba(8, 12, 10, 0.85)',
    border: `2px solid ${OSD}`,
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 4,
    textTransform: 'uppercase',
    paddingBottom: 6,
  },
  name: {
    fontSize: 64,
    fontWeight: 700,
    letterSpacing: 2,
    lineHeight: 1.05,
  },
};

export default Cctv;
