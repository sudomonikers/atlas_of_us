import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Portrait is painted in loose oils: every wall, face and floorboard is laid down as short, thick brushstrokes in
// a few tints of one colour, like a painting seen close up. You're the sitter, so for most of the scene you see what
// a sitter sees: Nell peering round the back of her canvas, and never the front. You're never drawn, and neither is
// the portrait: it goes face in against the wall to dry. A cue names a view and the parts to show: a new view washes in, and new parts in the same view fade in after
// it. The brushwork is seeded, so it lands the same way every time. Everything is SVG in a fixed 1600x900 space,
// scaled to cover the screen, kept to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const INK = '#2b2420';
const PENCIL = '#5a544c';
const WHITE = '#fbf7ee';
const LINEN = ['#d8c79f', '#c4b086', '#e6d8b4'];
const WOOD = ['#9a7046', '#7f5a36', '#b0844f'];
const WOOD_DARK = '#5e4128';
const WALL = ['#c8913f', '#d8a652', '#b47f35', '#e0b868'];
const FLOOR = ['#6b4a32', '#7d573a', '#57392a', '#8a6544'];
const SKY = ['#8fa3b3', '#a9bac6', '#7b8fa0', '#c2ccd2'];
const ROOFS = ['#4d5a6a', '#3f4a59', '#5f6c7b'];
const SMOCK = ['#3f7f7a', '#4f948d', '#326763'];
const SKIN = ['#e8bf9a', '#f2d1b1', '#d9a37d'];
const NELL_HAIR = ['#e6e0d6', '#fbf8f2', '#cbc3b7'];
const GILT = ['#c9a043', '#e3c066', '#9f7b2c'];
const GREEN = ['#3e5a4c', '#4b6b5a', '#33493e', '#587a66'];
const KRAFT = ['#b88a58', '#c99c69', '#a57a4b'];
const COIR = ['#a87c45', '#c09358', '#8d6537'];
const GLASS = '#b9cdd3';
const RED = '#b23a2a';
const STEAM = '#fffaf0';
const SERIF = 'Georgia, "Times New Roman", serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//a shape, or a stroke when it has a line colour; lettering; or a group of either, moved by an svg transform
type Shape = { d: string; fill: string; line?: string; w?: number; op?: number; cls?: string };
type Words = { text: string; x: number; y: number; size: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; font?: string; italic?: boolean; op?: number };
type Group = { t: string; items: Item[]; cls?: string; clip?: { id: string; d: string } };
type Item = Shape | Words | Group;

const r1 = (n: number) => Math.round(n * 10) / 10;
const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map(r1).join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${r1(x - rx)} ${r1(y)} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const circle = (x: number, y: number, r: number) => ellipse(x, y, r, r);
const stroke = (d: string, color: string, w: number, more: Partial<Shape> = {}): Shape => ({ d, fill: 'none', line: color, w, ...more });
const group = (t: string, items: Item[], cls?: string): Group => ({ t, items, cls });
//a group cut to a shape, so brushstrokes stop at the edge of a painting
let clips = 0;
const clipped = (d: string, items: Item[]): Group => ({ t: 'translate(0 0)', items, clip: { id: `pt-clip-${clips++}`, d } });
//a light that breathes. The glow is on a group round it, so the light keeps its own opacity
const glow = (d: string, fill: string, op: number): Item => group('translate(0 0)', [{ d, fill, op }], 'pt-glow');

//a small seeded random number generator (mulberry32), so the brushwork is the same on every visit
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

//where brushwork goes: a box, an oval, or a polygon
type Area = { box: [number, number, number, number] } | { oval: [number, number, number, number] } | { poly: Pt[] };
const outline = (a: Area) => ('box' in a ? rect(...a.box) : 'oval' in a ? ellipse(...a.oval) : poly(...a.poly));
function bounds(a: Area): [number, number, number, number] {
  if ('box' in a) return [a.box[0], a.box[1], a.box[0] + a.box[2], a.box[1] + a.box[3]];
  if ('oval' in a) return [a.oval[0] - a.oval[2], a.oval[1] - a.oval[3], a.oval[0] + a.oval[2], a.oval[1] + a.oval[3]];
  const xs = a.poly.map((p) => p[0]);
  const ys = a.poly.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function inside(a: Area, [x, y]: Pt) {
  if ('box' in a) return true;
  if ('oval' in a) return ((x - a.oval[0]) / a.oval[2]) ** 2 + ((y - a.oval[1]) / a.oval[3]) ** 2 <= 1;
  let hit = false;
  for (let i = 0, j = a.poly.length - 1; i < a.poly.length; j = i++) {
    const [xi, yi] = a.poly[i];
    const [xj, yj] = a.poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

type Brush = { len?: number; w?: number; angle?: number; wobble?: number; op?: number; seed?: number };

//n short, slightly curved brushstrokes over an area, about len long and w wide, laid at angle degrees give or take
//wobble, in turns of each colour. Each colour is one path, so a whole wall is only a few elements
function strokes(a: Area, colors: string[], n: number, { len = 30, w = 10, angle = 0, wobble = 25, op = 0.85, seed = 1 }: Brush = {}): Shape[] {
  const rand = random(seed);
  const [x0, y0, x1, y1] = bounds(a);
  const paths: string[][] = colors.map(() => []);
  for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
    const [x, y]: Pt = [x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0)];
    if (!inside(a, [x, y])) continue;
    const t = ((angle + (rand() - 0.5) * 2 * wobble) * Math.PI) / 180;
    const l = len * (0.6 + rand() * 0.8);
    const [dx, dy] = [(Math.cos(t) * l) / 2, (Math.sin(t) * l) / 2];
    const bend = (rand() - 0.5) * l * 0.3;
    paths[i % colors.length].push(`M ${r1(x - dx)} ${r1(y - dy)} Q ${r1(x - Math.sin(t) * bend)} ${r1(y + Math.cos(t) * bend)} ${r1(x + dx)} ${r1(y + dy)}`);
    i++;
  }
  return colors.map((c, k) => stroke(paths[k].join(' '), c, w, { op })).filter((s) => s.d);
}

//an area filled with its first colour, then brushed over with the rest. n defaults to how big the area is
function daub(a: Area, [base, ...tints]: string[], brush: Brush & { n?: number } = {}): Shape[] {
  const [x0, y0, x1, y1] = bounds(a);
  const len = brush.len ?? 30;
  const n = brush.n ?? Math.round(((x1 - x0) * (y1 - y0)) / (len * len * 0.5));
  return [{ d: outline(a), fill: base }, ...strokes(a, tints, n, brush)];
}

// ---------------------------------------------------------------------------
// things in the studio
// ---------------------------------------------------------------------------

//the back of a canvas: raw linen, and the wooden stretcher bars it's pulled over, crossed in the middle on big ones
function canvasBack(x: number, y: number, w: number, h: number, seed = 1): Item[] {
  const b = Math.max(14, Math.min(w, h) * 0.05);
  const bars: [number, number, number, number][] = [[x, y, w, b], [x, y + h - b, w, b], [x, y, b, h], [x + w - b, y, b, h]];
  if (w > 300) bars.push([x + w / 2 - b / 2, y, b, h], [x, y + h / 2 - b / 2, w, b]);
  return [
    ...daub({ box: [x, y, w, h] }, LINEN, { len: 20, w: 2.5, angle: 0, wobble: 90, op: 0.6, seed }),
    ...bars.flatMap((bar, i) => daub({ box: bar }, WOOD, { len: 40, w: 4, angle: bar[2] > bar[3] ? 0 : 90, wobble: 3, seed: seed + i })),
  ];
}

//a gilt frame round a picture drawn in a w x h space, scaled by s
function framed(x: number, y: number, w: number, h: number, s: number, picture: Item[], seed = 1): Group {
  const [fw, fh, b] = [w * s, h * s, 18 + 6 * s];
  return group(`translate(${x} ${y})`, [
    ...daub({ box: [-b, -b, fw + 2 * b, fh + 2 * b] }, GILT, { len: 16, w: 5, wobble: 90, seed }),
    { d: rect(-6, -6, fw + 12, fh + 12), fill: '#5a4320' },
    group(`scale(${s})`, picture),
  ]);
}

//rain running down a pane, as two sheets of streaks taking turns, so it never stops
function rain(x: number, y: number, w: number, h: number, seed = 1): Item[] {
  return [0, 1].map((k) => group('translate(0 0)', strokes({ box: [x, y, w, h - 70] }, ['#dfe7ec', '#c3d0d8'], Math.round((w * h) / 2600), { len: 26, w: 2.5, angle: 98, wobble: 4, op: 0.7, seed: seed + k }), `pt-rain${k ? ' pt-late' : ''}`));
}

//a window onto wet rooftops: sky, chimneys, a lit window far off, glazing bars and rain
function pane(x: number, y: number, w: number, h: number, seed = 1): Item[] {
  const roof = y + h * 0.72;
  const tops: Pt[] = [[x, roof], [x + w * 0.12, roof - h * 0.06], [x + w * 0.12, roof - h * 0.14], [x + w * 0.18, roof - h * 0.14], [x + w * 0.18, roof - h * 0.08], [x + w * 0.45, roof + h * 0.02], [x + w * 0.62, roof - h * 0.1], [x + w * 0.66, roof - h * 0.2], [x + w * 0.71, roof - h * 0.2], [x + w * 0.71, roof - h * 0.13], [x + w, roof - h * 0.04], [x + w, y + h], [x, y + h]];
  const bar = Math.max(10, w * 0.035);
  return [
    { d: rect(x - bar, y - bar, w + 2 * bar, h + 2 * bar), fill: WOOD_DARK },
    ...daub({ box: [x, y, w, h] }, SKY, { len: Math.max(24, w / 8), w: Math.max(8, w / 30), angle: -60, wobble: 30, seed }),
    ...daub({ poly: tops }, ROOFS, { len: 22, w: 7, angle: 0, wobble: 20, seed: seed + 1 }),
    { d: rect(x + w * 0.3, roof + h * 0.08, w * 0.05, h * 0.06), fill: '#f2c35a' },
    ...rain(x, y, w, h, seed + 2),
    { d: rect(x + w / 2 - bar / 2, y, bar, h), fill: WOOD_DARK },
    { d: rect(x, y + h * 0.48, w, bar), fill: WOOD_DARK },
  ];
}

//steam curling up from a mug
const steam = (x: number, y: number, s = 1): Item =>
  group(`translate(${x} ${y}) scale(${s})`, [stroke('M 0 0 C -14 -20 14 -36 0 -56 C -12 -72 8 -86 0 -100', STEAM, 7, { op: 0.75 }), stroke('M 22 -10 C 10 -28 32 -42 20 -62', STEAM, 5, { op: 0.6 })], 'pt-steam');

function mug(x: number, y: number, color: string): Item[] {
  return [stroke(`M ${x + 34} ${y + 14} q 22 4 0 30`, color, 8), ...daub({ box: [x - 34, y, 68, 66] }, [color, WHITE], { len: 18, w: 4, angle: 90, n: 10 }), steam(x - 8, y - 6)];
}

// ---------------------------------------------------------------------------
// portraits, painted in a 200 x 260 space: a background, shoulders, a head, hair and a face
// ---------------------------------------------------------------------------

type Bust = {
  bg: string[];
  top: string[];
  skin: string[];
  hair: string[];
  style: 'short' | 'bun' | 'long' | 'curly' | 'bald';
  mouth: 'smile' | 'half' | 'flat';
  scar?: boolean;
  pearls?: boolean;
  glasses?: boolean;
  beard?: boolean;
  seed: number;
};

function bust(o: Bust): Item[] {
  const s = o.seed;
  const brow = o.hair[2] ?? o.hair[0];
  const items: Item[] = [
    ...daub({ box: [0, 0, 200, 260] }, o.bg, { len: 40, w: 14, angle: -30, wobble: 40, op: 0.7, seed: s }),
    ...(o.style === 'long' ? daub({ poly: [[50, 90], [150, 90], [160, 210], [40, 210]] }, o.hair, { len: 30, w: 8, angle: 90, wobble: 10, seed: s + 1 }) : []),
    ...daub({ poly: [[8, 262], [18, 210], [62, 184], [138, 184], [182, 210], [192, 262]] }, o.top, { len: 30, w: 10, angle: 15, wobble: 30, seed: s + 2 }),
    ...daub({ box: [86, 150, 28, 38] }, o.skin, { len: 10, w: 5, angle: 0, n: 8, seed: s + 3 }),
    ...daub({ oval: [100, 115, 45, 56] }, o.skin, { len: 12, w: 6, angle: 0, wobble: 40, seed: s + 4 }),
    { d: circle(76, 132, 10), fill: '#e0806a', op: 0.25 },
    { d: circle(124, 132, 10), fill: '#e0806a', op: 0.25 },
  ];
  if (o.style === 'short' || o.style === 'long') items.push(...daub({ poly: [[52, 112], [56, 72], [80, 56], [124, 56], [146, 74], [150, 112], [134, 86], [96, 80], [66, 92]] }, o.hair, { len: 20, w: 7, angle: 20, wobble: 40, seed: s + 5 }));
  if (o.style === 'bun') items.push(...daub({ poly: [[54, 106], [58, 74], [84, 58], [120, 58], [144, 76], [148, 106], [124, 82], [76, 82]] }, o.hair, { len: 16, w: 6, angle: 0, wobble: 30, seed: s + 5 }), ...daub({ oval: [100, 44, 20, 16] }, o.hair, { len: 12, w: 5, wobble: 90, seed: s + 6 }));
  if (o.style === 'curly') items.push(...[[62, 92], [72, 70], [92, 58], [114, 58], [132, 70], [140, 92], [100, 70]].flatMap(([x, y], i) => daub({ oval: [x, y, 18, 16] }, o.hair, { len: 10, w: 5, wobble: 90, n: 10, seed: s + 5 + i })));
  if (o.style === 'bald') items.push(...daub({ oval: [57, 112, 7, 16] }, o.hair, { len: 8, w: 4, angle: 90, n: 6 }), ...daub({ oval: [143, 112, 7, 16] }, o.hair, { len: 8, w: 4, angle: 90, n: 6 }));
  if (o.beard) items.push(...daub({ poly: [[58, 120], [66, 150], [100, 176], [134, 150], [142, 120], [126, 146], [74, 146]] }, o.hair, { len: 12, w: 5, angle: 90, wobble: 30, seed: s + 7 }));
  items.push(
    stroke(line([78, 101], [92, 98]), brow, 4),
    stroke(line([108, 98], [122, 101]), brow, 4),
    { d: ellipse(85, 112, 5, 3.5), fill: INK },
    { d: ellipse(115, 112, 5, 3.5), fill: INK },
    stroke('M 100 112 L 96 134 L 104 136', '#b07a5c', 3),
    stroke({ smile: 'M 86 150 Q 100 161 114 150', half: 'M 88 152 Q 102 156 115 146', flat: 'M 88 153 L 112 153' }[o.mouth], '#a8463e', 4),
  );
  if (o.scar) items.push(stroke('M 112 96 L 120 116 L 128 140', '#c0545a', 4));
  if (o.glasses) items.push(stroke(`${circle(85, 112, 13)} ${circle(115, 112, 13)} M 98 110 L 102 110`, INK, 3));
  if (o.pearls) items.push(...[64, 76, 88, 100, 112, 124, 136].map((x, i): Shape => ({ d: circle(x, 190 + Math.abs(i - 3) * -2, 5), fill: WHITE })));
  return [clipped(rect(0, 0, 200, 260), items)];
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

//Nell's head, close up: white hair in a bun, round glasses, a squint for measuring you, eyes down for a pause
function nellHead(x: number, y: number, s: number, eyes: 'squint' | 'open' | 'down', seed = 70): Group {
  const eye = { squint: 'M -32 4 Q -24 0 -16 4 M 18 2 L 30 2', open: `${circle(-24, 4, 4)} ${circle(24, 4, 4)}`, down: 'M -32 4 Q -24 9 -16 4 M 16 4 Q 24 9 32 4' }[eyes];
  return group(`translate(${x} ${y}) scale(${s})`, [
    ...daub({ oval: [0, 0, 62, 74] }, SKIN, { len: 22, w: 9, angle: 80, wobble: 30, seed }),
    { d: circle(-34, 26, 13), fill: '#e0806a', op: 0.3 },
    { d: circle(34, 26, 13), fill: '#e0806a', op: 0.3 },
    ...daub({ poly: [[-64, 0], [-60, -44], [-30, -70], [30, -70], [60, -44], [64, 0], [44, -36], [-44, -36]] }, NELL_HAIR, { len: 20, w: 7, angle: 0, wobble: 40, seed: seed + 1 }),
    ...daub({ oval: [0, -88, 30, 24] }, NELL_HAIR, { len: 14, w: 6, wobble: 90, seed: seed + 2 }),
    eyes === 'open' ? { d: eye, fill: INK } : stroke(eye, INK, 4),
    stroke(`${circle(-24, 4, 18)} ${circle(24, 4, 18)} M -6 2 L 6 2`, INK, 4),
    stroke('M 0 6 L -4 30 L 5 32', '#b07a5c', 4),
    stroke(eyes === 'down' ? 'M -14 50 Q 0 56 14 50' : 'M -14 50 Q 0 46 14 50', '#a8463e', 5),
  ]);
}

//Nell's shoulders, in her smock, coming round the left of the canvas
const NELL_SHOULDERS: Item[] = [
  ...daub({ poly: [[548, 340], [800, 340], [820, 640], [520, 640]] }, SMOCK, { len: 34, w: 12, angle: 80, wobble: 30, seed: 80 }),
  { d: poly([620, 340], [700, 340], [660, 380]), fill: WHITE },
];

// ---------------------------------------------------------------------------
// the views. A part starting with _ is always there; the others show when a cue names them
// ---------------------------------------------------------------------------

type Room = 'title' | 'studio' | 'easel' | 'palette' | 'gallery' | 'face_in' | 'tea' | 'window' | 'parcel' | 'note';
const FLAT = new Set(['glow', 'light']);

const wall = (h: number, colors = WALL, seed = 3) => daub({ box: [0, 0, W, h] }, colors, { len: 80, w: 20, angle: -20, wobble: 30, op: 0.55, seed });
const floor = (y: number, seed = 4) => daub({ box: [0, y, W, H - y] }, FLOOR, { len: 140, w: 14, angle: 0, wobble: 3, seed });

const TITLE: Record<string, Item[]> = {
  _linen: daub({ box: [0, 0, W, H] }, LINEN, { len: 26, w: 3, wobble: 90, op: 0.6, seed: 1, n: 1600 }),
  swash: strokes({ box: [400, 300, 800, 70] }, ['#c8913f', '#d8a652', '#b47f35'], 40, { len: 260, w: 34, angle: -3, wobble: 3, op: 0.9, seed: 2 }),
  words: [
    { text: 'The Portrait', x: 800, y: 368, size: 120, anchor: 'middle', font: SERIF, italic: true },
    stroke(line([1080, 120], [1300, 250]), RED, 12),
    stroke(line([1300, 250], [1340, 274]), '#c0c4c6', 14),
    stroke('M 1340 274 Q 1370 286 1392 312 Q 1356 304 1334 290 Z', '#d8a652', 10),
  ],
};

const STUDIO: Record<string, Item[]> = {
  _wall: wall(640),
  _floor: floor(620),
  window: [...pane(120, 70, 300, 480, 10), ...daub({ box: [90, 560, 360, 20] }, WOOD, { len: 40, w: 5, wobble: 3 })],
  light: [{ d: poly([130, 640], [430, 640], [780, 900], [150, 900]), fill: '#eef3f6', op: 0.14 }],
  table: [
    ...daub({ box: [560, 500, 250, 20] }, WOOD, { len: 50, w: 6, wobble: 3, seed: 20 }),
    stroke(line([574, 520], [574, 700]), WOOD_DARK, 12),
    stroke(line([796, 520], [796, 700]), WOOD_DARK, 12),
    ...[592, 604, 616, 628].map((x, i) => stroke(line([x, 470], [x - 12 + i * 8, 400]), [RED, '#2f5f8a', '#d9a232', WOOD_DARK][i], 5)),
    { d: rect(584, 446, 54, 56), fill: GLASS, op: 0.7 },
    ...daub({ oval: [720, 488, 48, 16] }, [WHITE, '#3f7f7a', RED, '#d9a232'], { len: 14, w: 5, wobble: 90, n: 16, seed: 21 }),
  ],
  lamp: [stroke(line([760, 0], [760, 96]), INK, 3), { d: poly([730, 120], [790, 120], [774, 96], [746, 96]), fill: '#2f4a44' }, glow(circle(760, 128, 60), '#fff2c4', 0.3)],
  stack: [
    group('translate(1290 330) rotate(-4)', canvasBack(0, 0, 220, 300, 30)),
    group('translate(1360 280) rotate(3)', canvasBack(0, 0, 190, 350, 31)),
    group('translate(1420 380) rotate(-2)', canvasBack(0, 0, 160, 260, 32)),
  ],
  stool: [
    stroke(line([462, 546], [436, 720]), WOOD_DARK, 9),
    stroke(line([498, 546], [524, 720]), WOOD_DARK, 9),
    stroke(line([444, 650], [516, 650]), WOOD_DARK, 7),
    ...daub({ oval: [480, 542, 52, 13] }, WOOD, { len: 20, w: 5, wobble: 3, n: 12 }),
  ],
  nell: [
    ...daub({ poly: [[1140, 280], [1230, 280], [1256, 600], [1130, 600]] }, SMOCK, { len: 24, w: 9, angle: 80, seed: 81 }),
    nellHead(1186, 232, 0.5, 'squint', 82),
    stroke(line([1226, 300], [1252, 250], [1244, 218]), SMOCK[2], 16),
    { d: circle(1244, 214, 9), fill: SKIN[0] },
    stroke(line([1244, 188], [1244, 212]), INK, 6),
  ],
  easel: [
    stroke(line([1008, 150], [900, 740]), WOOD_DARK, 14),
    stroke(line([1008, 150], [1116, 740]), WOOD_DARK, 14),
    ...canvasBack(880, 170, 260, 320, 33),
    ...daub({ box: [1000, 120, 16, 600] }, WOOD, { len: 50, w: 4, angle: 90, wobble: 3 }),
    ...daub({ box: [866, 488, 290, 16] }, WOOD, { len: 50, w: 4, wobble: 3 }),
  ],
};

//close on the easel, from the stool: Nell peering round the back of the canvas
const NELL_MEASURE: Item[] = [
  ...NELL_SHOULDERS,
  nellHead(660, 250, 1, 'squint'),
  group('translate(0 0)', [stroke(line([600, 380], [570, 330]), SMOCK[2], 36), stroke(line([570, 330], [548, 262]), SKIN[2], 26), { d: circle(546, 254, 21), fill: SKIN[0] }, ...daub({ box: [538, 190, 13, 62] }, [INK, '#4a423c'], { len: 10, w: 3, angle: 90, n: 6 })], 'pt-measure'),
];

const EASEL: Record<string, Item[]> = {
  _wall: wall(H, WALL, 5),
  _window: pane(-40, 40, 200, 560, 11),
  light: [{ d: poly([160, 40], [560, 0], [760, 900], [160, 900]), fill: '#eef3f6', op: 0.1 }],
  clock: [
    group('translate(300 150)', [
      ...daub({ oval: [0, 0, 66, 66] }, WOOD, { len: 20, w: 6, wobble: 90, n: 30 }),
      { d: circle(0, 0, 54), fill: '#f3ead6' },
      ...Array.from({ length: 12 }, (_, i): Shape => ({ d: circle(Math.sin((i * Math.PI) / 6) * 44, -Math.cos((i * Math.PI) / 6) * 44, i % 3 ? 2.5 : 4), fill: INK })),
      group('rotate(0)', [stroke(line([0, 0], [0, -26]), INK, 7)], 'pt-spin-slow'),
      group('rotate(0)', [stroke(line([0, 0], [0, -42]), INK, 4)], 'pt-spin'),
      { d: circle(0, 0, 5), fill: RED },
    ]),
  ],
  glow: [320, 240, 160].map((r) => glow(circle(660, 250, r), '#ffe9b0', 0.06)),
  nell_measure: NELL_MEASURE,
  nell_still: [...NELL_SHOULDERS, nellHead(668, 262, 1, 'down', 71)],
  nell_brush: [
    ...NELL_SHOULDERS,
    nellHead(660, 250, 1, 'open', 72),
    group('translate(0 0)', [stroke(line([620, 440], [760, 392]), SKIN[2], 26), { d: circle(764, 390, 21), fill: SKIN[0] }, stroke(line([760, 390], [680, 316]), RED, 9), stroke(line([712, 346], [700, 334]), '#c0c4c6', 11)], 'pt-dab'),
  ],
  smudge: [stroke('M 690 290 q 14 -6 24 2', '#2f5f8a', 7, { op: 0.8 }), stroke('M 624 214 q 8 6 16 2', '#d9a232', 6, { op: 0.8 })],
  _canvas: [
    ...canvasBack(760, 60, 440, 540, 34),
    ...daub({ box: [968, 0, 24, H] }, WOOD, { len: 60, w: 5, angle: 90, wobble: 3 }),
    ...daub({ box: [950, 36, 60, 28] }, [WOOD_DARK, WOOD[0]], { len: 20, w: 4, wobble: 3 }),
    ...daub({ box: [730, 596, 500, 22] }, WOOD, { len: 60, w: 5, wobble: 3 }),
  ],
};

//the palette from above: a ring of paint, a warm skin colour being mixed, and the brush going round in it
const PAINTS = ['#fbf7ee', '#e9c46a', '#f2a530', '#d8432f', '#9c2a3c', '#2f4fa0', '#2f7a5c', '#6b4a32', '#2b2420'];
const PALETTE: Record<string, Item[]> = {
  _table: daub({ box: [0, 0, W, H] }, ['#7f5a36', '#9a7046', '#6e4c2c', '#8a6544'], { len: 220, w: 18, angle: 4, wobble: 3, seed: 40 }),
  _rag: daub({ oval: [1360, 160, 140, 90] }, [WHITE, '#3f7f7a', '#d8432f', '#e9c46a'], { len: 30, w: 16, wobble: 90, seed: 41 }),
  palette: [
    { d: `${ellipse(800, 320, 430, 240)} ${circle(520, 380, 36)}`, fill: '#c99a62' },
    ...strokes({ oval: [800, 320, 410, 220] }, ['#b88a54', '#d6a970'], 60, { len: 160, w: 6, angle: 8, wobble: 4, seed: 42 }),
    { d: circle(520, 380, 36), fill: '#7f5a36' },
    ...PAINTS.flatMap((c, i) => {
      const a = Math.PI * (1.08 + (i * 0.84) / (PAINTS.length - 1));
      return daub({ oval: [800 + Math.cos(a) * 340, 320 + Math.sin(a) * 170, 34, 26] }, [c, c, WHITE], { len: 18, w: 7, wobble: 90, n: 6, op: 0.4, seed: 43 + i });
    }),
    ...strokes({ oval: [860, 380, 150, 70] }, ['#e8bf9a', '#f2d1b1', '#d9a37d', '#c98f6b'], 20, { len: 50, w: 22, angle: 20, wobble: 60, op: 0.95, seed: 52 }),
  ],
  brush: [
    group('translate(0 0)', [
      stroke(line([1260, 80], [890, 362]), RED, 16),
      stroke(line([920, 339], [890, 362]), '#c0c4c6', 18),
      stroke('M 892 360 Q 868 384 858 396', '#d9a37d', 16),
    ], 'pt-swirl'),
  ],
};

//the wall of other sitters: a man with his scar painted in, a woman with her wrinkles painted out, a child, Nell
//young, and somebody's dog
const DOG: Item[] = [clipped(rect(0, 0, 200, 150), [
  ...daub({ box: [0, 0, 200, 150] }, ['#7a8a5a', '#8e9d6a', '#66764a'], { len: 30, w: 10, angle: -30, wobble: 40, seed: 90 }),
  ...daub({ oval: [100, 84, 46, 44] }, ['#a8703c', '#c08850', '#8a5a30'], { len: 14, w: 6, wobble: 60, seed: 91 }),
  ...daub({ oval: [56, 70, 14, 30] }, ['#6e4628', '#5a3a20'], { len: 10, w: 5, angle: 90, n: 8, seed: 92 }),
  ...daub({ oval: [144, 70, 14, 30] }, ['#6e4628', '#5a3a20'], { len: 10, w: 5, angle: 90, n: 8, seed: 93 }),
  { d: ellipse(100, 104, 22, 16), fill: '#e6c8a0' },
  { d: ellipse(100, 96, 8, 6), fill: INK },
  { d: circle(84, 76, 4), fill: INK },
  { d: circle(116, 76, 4), fill: INK },
])];

const GALLERY: Record<string, Item[]> = {
  _wall: wall(H, GREEN, 6),
  _rail: [stroke(line([0, 40], [W, 40]), WOOD_DARK, 10)],
  scar: [framed(150, 120, 200, 260, 1, bust({ bg: ['#7b6a55', '#8e7c64', '#665846'], top: ['#58624a', '#6a7558', '#47503c'], skin: ['#d9a37d', '#e8bf9a', '#c48a66'], hair: ['#2e241e', '#3e322a', '#1f1814'], style: 'short', mouth: 'flat', scar: true, beard: true, seed: 100 }), 101)],
  smooth: [framed(470, 80, 200, 260, 1.05, bust({ bg: ['#4a5d72', '#5d7186', '#3c4d60'], top: ['#7a3b52', '#8e4d64', '#652e43'], skin: ['#f2d1b1', '#f7dcc2', '#e8c2a0'], hair: ['#b9b3ab', '#d0cbc4', '#9e978e'], style: 'bun', mouth: 'smile', pearls: true, seed: 110 }), 111)],
  self: [framed(800, 70, 200, 260, 1.35, bust({ bg: ['#c8913f', '#d8a652', '#b47f35'], top: SMOCK, skin: SKIN, hair: ['#9a3b22', '#b5502e', '#7a2c18'], style: 'long', mouth: 'flat', seed: 120 }), 121), { text: 'N., 1985', x: 935, y: 484, size: 22, anchor: 'middle', font: SERIF, italic: true, fill: '#e3c066' }],
  child: [framed(1170, 100, 200, 260, 0.9, bust({ bg: ['#e2c27a', '#ecd093', '#d1ad62'], top: ['#d65b4a', '#e2705e', '#bf4a3a'], skin: ['#b9805a', '#c99068', '#a26c48'], hair: ['#2a1d16', '#3a2a20', '#1c130e'], style: 'curly', mouth: 'smile', seed: 130 }), 131)],
  dog: [framed(1190, 420, 200, 150, 0.8, DOG, 141)],
};

//Nell wipes her hands, with the canvas off the easel and leaning face in against the wall with the others
const FACE_IN: Record<string, Item[]> = {
  _wall: wall(H, WALL, 7),
  _window: pane(-40, 40, 160, 560, 12),
  _floor: floor(700, 8),
  _easel: [...daub({ box: [800, 0, 22, H] }, WOOD, { len: 60, w: 5, angle: 90, wobble: 3 })],
  nell_rag: [
    ...daub({ poly: [[250, 330], [420, 330], [450, 720], [220, 720]] }, SMOCK, { len: 30, w: 10, angle: 80, seed: 85 }),
    { d: poly([300, 330], [370, 330], [335, 366]), fill: WHITE },
    nellHead(335, 240, 0.85, 'open', 86),
    stroke(line([262, 380], [290, 470]), SMOCK[2], 30),
    stroke(line([408, 380], [380, 470]), SMOCK[2], 30),
    group('translate(0 0)', daub({ oval: [335, 480, 64, 34] }, [WHITE, '#3f7f7a', '#d8432f', '#d9a232'], { len: 18, w: 6, wobble: 90, seed: 87 }), 'pt-wipe'),
  ],
  _ledge: daub({ box: [700, 584, 222, 22] }, WOOD, { len: 60, w: 5, wobble: 3 }),
  _stack: [group('translate(1330 330) rotate(4)', canvasBack(0, 0, 190, 370, 34))],
  leaning: [group('translate(960 250) rotate(-4)', canvasBack(0, 0, 360, 470, 35))],
};

//tea on the bench: Nell from behind, your mug beside her, and the back of the portrait drying against the wall
const TEA: Record<string, Item[]> = {
  _wall: wall(H, WALL, 13),
  _window: pane(70, 70, 260, 440, 14),
  _canvas: [group('translate(640 240) rotate(-3)', canvasBack(0, 0, 320, 420, 38))],
  _bench: daub({ box: [300, 640, 1000, 34] }, WOOD, { len: 80, w: 6, wobble: 3, seed: 15 }),
  your_mug: mug(700, 574, '#d8432f'),
  nell_back: [
    ...daub({ poly: [[860, 660], [872, 520], [920, 488], [1010, 488], [1056, 520], [1070, 660]] }, SMOCK, { len: 26, w: 9, angle: 80, seed: 18 }),
    ...daub({ oval: [964, 434, 48, 56] }, NELL_HAIR, { len: 16, w: 6, angle: 80, wobble: 30, seed: 19 }),
    ...daub({ oval: [964, 386, 24, 20] }, NELL_HAIR, { len: 10, w: 5, wobble: 90, seed: 20 }),
  ],
  steam: [steam(740, 470, 0.9), steam(870, 470, 0.9)],
};

//rain on the studio window, and the rooftops beyond
const WINDOW: Record<string, Item[]> = {
  _wall: wall(H, WALL, 21),
  _window: pane(300, 50, 1000, 530, 22),
  _sill: daub({ box: [240, 590, 1120, 28] }, WOOD, { len: 80, w: 6, wobble: 3, seed: 23 }),
  mug: mug(1180, 524, '#3f7f7a'),
  drops: [0, 1, 2, 3, 4, 5, 6].map((i) => group(`translate(${380 + i * 130 + (i % 2) * 40} ${90 + (i % 3) * 110})`, [{ d: 'M 0 -10 Q 7 0 5 5 A 6 6 0 1 1 -5 5 Q -7 0 0 -10 Z', fill: '#e8eff3', op: 0.8 }, stroke(line([0, -14], [0, -50]), '#e8eff3', 2, { op: 0.4 })], `pt-run pt-run${i % 3}`)),
};

const PARCEL: Record<string, Item[]> = {
  _floor: daub({ box: [0, 0, W, H] }, FLOOR, { len: 160, w: 16, angle: 0, wobble: 3, seed: 24 }),
  _mat: daub({ box: [360, 110, 880, 520] }, COIR, { len: 12, w: 3, angle: 90, wobble: 90, n: 2600, seed: 25 }),
  parcel: [
    group('translate(800 360) rotate(-6)', [
      ...daub({ box: [-260, -170, 520, 340] }, KRAFT, { len: 50, w: 10, angle: 0, wobble: 20, seed: 26 }),
      stroke(line([-260, 0], [260, 0]), '#e9dcc0', 6),
      stroke(line([0, -170], [0, 170]), '#e9dcc0', 6),
      stroke('M 0 0 C -50 -50 -60 10 0 0 C 50 -50 60 10 0 0 M 0 0 L -40 40 M 0 0 L 36 44', '#e9dcc0', 6),
      { d: rect(40, -140, 190, 100), fill: WHITE },
      { text: 'To the sitter', x: 135, y: -96, size: 26, anchor: 'middle', font: HAND, fill: INK },
      stroke(line([64, -70], [206, -70]), PENCIL, 2),
      { d: rect(170, 40, 56, 66), fill: '#c7363f' },
      { d: rect(176, 46, 44, 54), fill: '#e7b04c' },
      stroke(`${circle(150, 80, 30)} M 112 66 q 20 -8 76 0 M 112 82 q 20 -8 76 0`, '#3a3f66', 3, { op: 0.7 }),
      { text: 'HANDLE WITH CARE', x: -130, y: 130, size: 22, anchor: 'middle', font: SERIF, fill: '#b23a2a' },
    ]),
  ],
};

const NOTE: Record<string, Item[]> = {
  _floor: daub({ box: [0, 0, W, H] }, FLOOR, { len: 160, w: 16, angle: 0, wobble: 3, seed: 27 }),
  note: [
    ...canvasBack(330, 30, 940, 570, 36),
    ...daub({ box: [380, 110, 420, 360] }, LINEN, { len: 20, w: 2.5, wobble: 90, op: 0.6, seed: 37 }),
    { text: 'Thank you for sitting.', x: 590, y: 200, size: 38, anchor: 'middle', font: HAND, fill: PENCIL },
    { text: 'You were better company', x: 590, y: 260, size: 38, anchor: 'middle', font: HAND, fill: PENCIL },
    { text: 'than most.', x: 590, y: 320, size: 38, anchor: 'middle', font: HAND, fill: PENCIL },
    { text: 'N.', x: 720, y: 400, size: 46, anchor: 'middle', font: HAND, fill: PENCIL },
    ...daub({ oval: [1180, 520, 16, 12] }, ['#d9a232', '#c8913f'], { len: 8, w: 4, wobble: 90, n: 6 }),
  ],
};

const ART: Record<Room, Record<string, Item[]>> = { title: TITLE, studio: STUDIO, easel: EASEL, palette: PALETTE, gallery: GALLERY, face_in: FACE_IN, tea: TEA, window: WINDOW, parcel: PARCEL, note: NOTE };

// ---------------------------------------------------------------------------
// the cues
// ---------------------------------------------------------------------------

type Bed = 'rain' | 'room' | 'sketch';
type Mix = Partial<Record<Bed, number>>;

interface Cue {
  room: Room;
  parts: string[];
  mix: Mix;
}

const STUDIO_PARTS = ['window', 'light', 'table', 'lamp', 'stack'];
const SITTING: Mix = { rain: 0.5, room: 0.45 };

const cues: Record<string, Cue> = {
  title_card: { room: 'title', parts: ['swash', 'words'], mix: { rain: 0.3 } },
  studio: { room: 'studio', parts: [...STUDIO_PARTS, 'easel'], mix: { rain: 0.7, room: 0.5 } },
  stool: { room: 'studio', parts: [...STUDIO_PARTS, 'stool', 'nell', 'easel'], mix: { rain: 0.6, room: 0.5 } },
  sketch: { room: 'easel', parts: ['light', 'nell_measure'], mix: { ...SITTING, sketch: 0.5 } },
  pause: { room: 'easel', parts: ['light', 'glow', 'nell_still'], mix: { rain: 0.6, room: 0.4 } },
  palette: { room: 'palette', parts: ['palette', 'brush'], mix: { rain: 0.4, room: 0.5 } },
  paint: { room: 'easel', parts: ['light', 'nell_brush', 'smudge'], mix: { ...SITTING, sketch: 0.3 } },
  clock: { room: 'easel', parts: ['light', 'clock', 'nell_brush', 'smudge'], mix: { ...SITTING, sketch: 0.3 } },
  gallery: { room: 'gallery', parts: ['scar', 'smooth', 'self', 'child', 'dog'], mix: { rain: 0.4, room: 0.5 } },
  face_in: { room: 'face_in', parts: ['nell_rag', 'leaning'], mix: { rain: 0.4, room: 0.4 } },
  tea: { room: 'tea', parts: ['your_mug', 'nell_back', 'steam'], mix: { rain: 0.6, room: 0.4 } },
  window: { room: 'window', parts: ['mug', 'drops'], mix: { rain: 0.9, room: 0.3 } },
  parcel: { room: 'parcel', parts: ['parcel'], mix: { room: 0.5 } },
  goodbye: { room: 'note', parts: ['note'], mix: { room: 0.4 } },
};

const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS: Record<Bed, string> = {
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  sketch: new URL('./sounds/sketch.m4a', import.meta.url).href,
};

const shot = (name: string, volume: number, delay: number): OneShot => ({ src: new URL(`./sounds/${name}.m4a`, import.meta.url).href, volume, delay });
const ONE_SHOTS: Record<string, OneShot> = {
  title_card: shot('bells', 0.4, 0.3),
  face_in: shot('harp', 0.5, 1.2),
  parcel: shot('knock', 0.6, 0.4),
  goodbye: shot('bells', 0.3, 0.5),
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.2; //seconds

// ---------------------------------------------------------------------------

const GAP = 0.3; //seconds between one part fading in and the next

interface Shown {
  cue: Cue;
  visit: number; //counts views washed in, so going back to the same view washes it in again
  starts: Record<string, number>; //when each part fades in, from when it first appears
}

//parts already there in the same view stay put; anything new fades in after them, and a new view brings all its parts
function turn(prev: Shown | undefined, cue: Cue): Shown {
  const kept = prev && prev.cue.room === cue.room ? prev : undefined;
  const fresh = cue.parts.filter((p) => !kept?.cue.parts.includes(p));
  const starts = Object.fromEntries(fresh.map((p, i) => [p, (kept ? 0.1 : 0.5) + i * GAP]));
  return kept ? { cue, visit: kept.visit, starts: { ...kept.starts, ...starts } } : { cue, visit: (prev?.visit ?? 0) + 1, starts };
}

function draw(item: Item, i: number): ReactNode {
  if ('items' in item)
    return (
      <g key={i} transform={item.t}>
        {item.clip && (
          <clipPath id={item.clip.id}>
            <path d={item.clip.d} />
          </clipPath>
        )}
        <g className={item.cls} clipPath={item.clip && `url(#${item.clip.id})`}>
          {item.items.map(draw)}
        </g>
      </g>
    );
  if ('text' in item)
    return (
      <text key={i} x={item.x} y={item.y} textAnchor={item.anchor} fill={item.fill ?? INK} opacity={item.op} style={{ fontFamily: item.font ?? SERIF, fontSize: item.size, fontStyle: item.italic ? 'italic' : undefined }}>
        {item.text}
      </text>
    );
  return <path key={i} d={item.d} fill={item.fill} stroke={item.line} strokeWidth={item.w} strokeLinecap="round" strokeLinejoin="round" opacity={item.op} className={item.cls} />;
}

function Scene({ shown }: { shown: Shown }) {
  const { cue, starts } = shown;
  return (
    <g className="pt-in">
      {Object.entries(ART[cue.room])
        .filter(([part]) => part.startsWith('_') || cue.parts.includes(part))
        .map(([part, items]) =>
          part.startsWith('_') ? (
            <g key={part}>{items.map(draw)}</g>
          ) : (
            <g key={part} className={FLAT.has(part) ? 'pt-fade' : 'pt-pop'} style={{ animationDelay: `${starts[part] ?? 0}s` }}>
              {items.map(draw)}
            </g>
          ),
        )}
    </g>
  );
}

function Oils({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Portrait has no cue for the animation "${animation}"`);
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

  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <Scene key={`${shown.cue.room}-${shown.visit}`} shown={shown} />
      </svg>
    </div>
  );
}

//a new view washes in like wet paint, and new parts fade in onto it
const keyframes = `
.pt-in {
  animation: pt-in 0.8s ease-out both;
}
@keyframes pt-in {
  from { opacity: 0; }
}
.pt-pop {
  transform-box: fill-box;
  transform-origin: center;
  animation: pt-pop 0.7s ease-out both;
}
@keyframes pt-pop {
  from { opacity: 0; transform: scale(0.97); }
}
.pt-fade {
  animation: pt-in 1.2s ease-out both;
}
.pt-rain {
  animation: pt-rain 1.2s linear infinite;
}
.pt-late {
  animation-delay: -0.6s;
}
@keyframes pt-rain {
  from { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  to { transform: translateY(60px); opacity: 0; }
}
.pt-run {
  animation: pt-run 5s ease-in infinite;
}
.pt-run1 {
  animation-delay: -1.7s;
}
.pt-run2 {
  animation-delay: -3.4s;
}
@keyframes pt-run {
  from { transform: translateY(0); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  to { transform: translateY(300px); opacity: 0; }
}
.pt-steam {
  animation: pt-steam 2.4s ease-in-out infinite;
}
@keyframes pt-steam {
  from { transform: translateY(10px); opacity: 0; }
  40% { opacity: 0.9; }
  to { transform: translateY(-20px); opacity: 0; }
}
.pt-glow {
  animation: pt-glow 3s ease-in-out infinite alternate;
}
@keyframes pt-glow {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
.pt-measure {
  animation: pt-measure 2.2s ease-in-out infinite;
}
@keyframes pt-measure {
  0%, 60%, 100% { transform: translate(0, 0); }
  70% { transform: translate(4px, -10px); }
  85% { transform: translate(-2px, 6px); }
}
.pt-dab {
  animation: pt-dab 0.9s ease-in-out infinite;
}
@keyframes pt-dab {
  0%, 100% { transform: translate(0, 0); }
  30% { transform: translate(10px, -6px); }
  60% { transform: translate(-2px, 8px); }
}
.pt-swirl {
  animation: pt-swirl 1.6s linear infinite;
}
@keyframes pt-swirl {
  0% { transform: translate(0, 0); }
  25% { transform: translate(18px, 8px); }
  50% { transform: translate(0, 18px); }
  75% { transform: translate(-18px, 8px); }
  100% { transform: translate(0, 0); }
}
.pt-wipe {
  animation: pt-wipe 0.8s ease-in-out infinite alternate;
}
@keyframes pt-wipe {
  to { transform: translate(8px, -4px) rotate(4deg); }
}
.pt-spin {
  animation: pt-spin 2s linear infinite;
}
.pt-spin-slow {
  animation: pt-spin 24s linear infinite;
}
@keyframes pt-spin {
  to { transform: rotate(360deg); }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: WALL[0],
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
};

export default Oils;
