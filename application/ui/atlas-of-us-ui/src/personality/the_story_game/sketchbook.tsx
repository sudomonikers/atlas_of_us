import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Story Game is the narrator's sketchbook, lit by a wood stove. Each page is an ink drawing that draws itself on,
// line by line, then gets a watercolour wash. A cue names a page and the parts of it to show: parts already on the
// page stay put, new ones draw in after them, and turning to a new page fades the old one out.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The drawings keep to the top two thirds,
// clear of the text box.

const W = 1600;
const H = 900;
const PAPER = '#f3ead6';
const INK = '#2a2119';
//the paper's grain and blotches, rendered once from turbulence filters: drawing them live cost the GPU every frame
const PAPER_IMAGE = new URL('./paper.jpg', import.meta.url).href;
type Pt = [number, number];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'blank' | 'shore' | 'notes' | 'beach' | 'strange' | 'gate' | 'town' | 'scroll' | 'ending' | 'desk';

interface Cue {
  page: Page;
  parts: string[]; //drawn in this order
  card?: [kicker: string, name: string];
  dim?: boolean; //the stove burning low
}

const GATE = ['walls', 'door', 'lanterns', 'words'];
const BEACH = ['dock', 'ferryman', 'goat'];

const cues: Record<string, Cue> = {
  title_card: { page: 'blank', parts: [], card: ['A game of make-believe', 'The Story Game'] },
  blank_page: { page: 'blank', parts: ['pen'] },
  once_upon: { page: 'blank', parts: ['pen', 'once'] },
  shore_boat: { page: 'shore', parts: ['sea', 'boat'] },
  shore: { page: 'shore', parts: ['sea', 'boat', 'coast'] },
  shore_unknown: { page: 'shore', parts: ['sea', 'boat', 'coast', 'unknown'] },
  scribbling: { page: 'notes', parts: ['notes'] },
  goat: { page: 'beach', parts: [...BEACH, 'arms', 'hat', 'map'] },
  goat_burp: { page: 'beach', parts: [...BEACH, 'arms', 'hat', 'burp'] },
  goat_ferryman: { page: 'beach', parts: [...BEACH, 'burp', 'doff'] },
  strange: { page: 'strange', parts: ['sky', 'ground'] },
  gate: { page: 'gate', parts: ['walls', 'door'] },
  gate_lanterns: { page: 'gate', parts: GATE },
  gate_red: { page: 'gate', parts: [...GATE, 'red'] },
  gate_gold: { page: 'gate', parts: [...GATE, 'gold'] },
  gate_blue: { page: 'gate', parts: [...GATE, 'blue'] },
  gate_open: { page: 'gate', parts: ['walls', 'lanterns', 'words', 'open'] },
  gate_climb: { page: 'gate', parts: [...GATE, 'rope'] },
  town: { page: 'town', parts: ['houses', 'bunting', 'crowd'] },
  town_poet: { page: 'town', parts: ['houses', 'bunting', 'crowd', 'poet'] },
  scroll_1: { page: 'scroll', parts: ['scroll', 'verse1'] },
  scroll_2: { page: 'scroll', parts: ['scroll', 'verse1', 'verse2'] },
  scroll_3: { page: 'scroll', parts: ['scroll', 'verse1', 'verse2', 'verse3'] },
  scroll_4: { page: 'scroll', parts: ['scroll', 'verse1', 'verse2', 'verse3', 'verse4'] },
  ending: { page: 'ending', parts: ['land'] },
  the_end: { page: 'ending', parts: ['land', 'end'] },
  book_closed: { page: 'desk', parts: ['book', 'cup'] },
  goodbye: { page: 'desk', parts: ['book', 'cup'], dim: true },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: ink lines drawn on in order, handwriting, then washes and lantern light once the ink is down
type Item =
  | { d: string; w?: number; dur?: number; cls?: string }
  | { wash: string; d: string; o?: number; cls?: string }
  | { text: string; x: number; y: number; size: number; middle?: boolean }
  | { glow: Lantern; x: number; y: number; r: number; cls?: string };

type Lantern = 'red' | 'gold' | 'blue';
const LANTERNS: Record<Lantern, string> = { red: '#d1495b', gold: '#e9b949', blue: '#3d7ab8' };

const INK_GAP = 0.2; //seconds between one line starting to draw and the next
const INK_DUR = 0.7;
const CHAR_DUR = 0.045; //handwriting, per letter

//when each item starts, and when the whole part is done
function schedule(items: Item[], start: number) {
  let t = start;
  const at = items.map((item) => {
    if ('wash' in item || 'glow' in item) return -1;
    const begin = t;
    t += 'text' in item ? item.text.length * CHAR_DUR * 0.8 : INK_GAP;
    return begin;
  });
  let wash = t + 0.3;
  const times = at.map((a) => (a >= 0 ? a : (wash += 0.12) - 0.12));
  return { times, end: Math.max(t, wash) };
}

//pseudo-random but fixed, so a drawing always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const wave = (x: number, y: number, w: number, h = 7) => `M ${x} ${y} q ${w / 4} ${-h} ${w / 2} 0 t ${w / 2} 0`;
const bird = (x: number, y: number, s: number) => `M ${x} ${y} q ${s / 2} ${-s / 2} ${s} 0 q ${s / 2} ${-s / 2} ${s} 0`;

function star(x: number, y: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i): Pt => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const k = i % 2 ? r * 0.45 : r;
    return [Math.round(x + Math.cos(a) * k), Math.round(y + Math.sin(a) * k)];
  });
  return shape(...pts);
}

function spiral(x: number, y: number, turns: number, grow: number) {
  const pts = Array.from({ length: turns * 24 }, (_, i): Pt => {
    const a = (i / 24) * Math.PI * 2;
    const r = 3 + grow * a;
    return [Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r)];
  });
  return line(...pts);
}

//a crenellated wall top from x0 to x1 at height y, continuing a path that's already at (x0, y)
function crenels(x0: number, x1: number, y: number) {
  let d = '';
  for (let x = x0; x + 60 <= x1; x += 60) d += ` H ${x + 30} V ${y - 22} H ${x + 60} V ${y}`;
  return `${d} H ${x1}`;
}

//lines of quick handwriting, word by word, as one path so they draw on in reading order
function scribble(x: number, y: number, len: number, seed: number) {
  let d = '';
  let cx = x;
  let n = seed * 100;
  while (cx < x + len) {
    const word = 40 + rand(n++) * 90;
    d += ` M ${cx.toFixed(0)} ${y}`;
    for (let k = 0; k < word; k += 9) {
      const tall = rand(n++) < 0.15;
      d += tall ? ' q 2 -30 5 -2 t 4 0' : ` q 4 ${-(8 + rand(n++) * 8).toFixed(0)} 9 0`;
    }
    cx += word + 22;
  }
  return d.trim();
}

//a figure in a long coat, feet at (x, y)
function person(x: number, y: number, h: number, coat: string, seed: number): Item[] {
  const r = h * 0.13;
  const neck = y - h + r * 2 + 2;
  const body = `M ${x - h * 0.24} ${y} Q ${x - h * 0.2} ${y - h * 0.5} ${x - h * 0.07} ${neck} L ${x + h * 0.07} ${neck} Q ${x + h * 0.2} ${y - h * 0.5} ${x + h * 0.24} ${y} Z`;
  const waving = rand(seed) < 0.4;
  return [
    { d: circle(x, y - h + r, r) },
    { d: body },
    { d: waving ? line([x + h * 0.1, neck + 14], [x + h * 0.28, neck - 26]) : line([x + h * 0.12, neck + 14], [x + h * 0.2, y - h * 0.3]) },
    { d: `${circle(x - r * 0.35, y - h + r * 0.9, 1.5)} ${circle(x + r * 0.35, y - h + r * 0.9, 1.5)}`, w: 2.5 },
    { wash: coat, d: body, o: 0.5 },
  ];
}

const handwriting = (text: string, x: number, y: number, size: number, middle?: boolean): Item => ({ text, x, y, size, middle });

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const SEA = '#7fb3c9';
const LAND = '#9fbf7f';
const WOOD = '#8a5a3c';

const lantern = (x: number, color: Lantern): Item[] => [
  { d: line([x, 262], [x, 278]) },
  { d: shape([x - 10, 278], [x + 10, 278], [x + 14, 288], [x - 14, 288]) },
  { d: `M ${x - 14} 288 L ${x - 16} 326 L ${x + 16} 326 L ${x + 14} 288 M ${x - 8} 333 H ${x + 8}` },
  { wash: LANTERNS[color], d: shape([x - 14, 288], [x - 16, 326], [x + 16, 326], [x + 14, 288]), o: 0.8 },
  { glow: color, x, y: 308, r: 50, cls: 'sg-flicker' },
];

const ARCH = 'M 710 545 V 400 Q 800 300 890 400 V 545';
const TOWN_HOUSES: [x: number, w: number, top: number, roof: string][] = [
  [200, 130, 330, '#c0504d'],
  [360, 150, 360, '#d8a657'],
  [540, 120, 310, '#5b8e7d'],
  [940, 130, 340, '#d8a657'],
  [1100, 150, 300, '#c0504d'],
  [1280, 130, 350, '#5b8e7d'],
];

//points along the bunting's curve
const bunting = (t: number): Pt => {
  const [x0, y0, cx, cy, x1, y1] = [160, 150, 800, 280, 1440, 150];
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};

const POEM = [
  'Out past the last of the lighthouse light,',
  'where the charts give up and the gulls take flight,',
  "there's a door in the sea that the tide forgets,",
  "and it opens for nobody's sorrows or debts.",
  'It opened for you. Did you feel the latch?',
  'Did you hear the dark and the morning match?',
  "So sit, and be welcome, and stay till you're grey.",
  'Or go, if you must. But the door knows the way.',
];
const verse = (i: number): Item[] => [0, 1].map((j) => handwriting(POEM[i * 2 + j], 530, 180 + (i * 2 + j) * 44, 30));

const ART: Record<Page, Record<string, Item[]>> = {
  blank: {
    pen: [
      { d: shape([1180, 150], [1420, 265], [1408, 290], [1168, 175]) },
      { d: line([1340, 226], [1328, 252]) },
      { d: shape([1180, 150], [1168, 175], [1112, 152]) },
      { d: line([1166, 162], [1132, 154]), w: 2 },
      { d: `M 1410 430 L 1480 430 L 1470 360 L 1452 352 L 1452 336 L 1438 336 L 1438 352 L 1420 360 Z` },
      { d: `${circle(1350, 420, 6)} ${circle(1372, 438, 3)}`, w: 2 },
      { wash: '#8c2f39', d: shape([1180, 150], [1420, 265], [1408, 290], [1168, 175]), o: 0.55 },
      { wash: '#2f3e66', d: 'M 1410 430 L 1480 430 L 1470 360 L 1420 360 Z', o: 0.5 },
    ],
    once: [handwriting('Once upon a time,', 230, 250, 68), { d: 'M 230 285 q 200 30 420 -5 t 200 10', w: 2.5 }],
  },

  shore: {
    sea: [
      { d: line([130, 360], [800, 358]) },
      ...[[180, 420, 60], [320, 450, 70], [560, 420, 60], [220, 520, 80], [600, 505, 70], [430, 545, 60]].map(([x, y, w], i) => ({ d: wave(x, y, w), cls: i % 2 ? 'sg-bob' : 'sg-bob-slow' })),
      { d: circle(210, 170, 46) },
      { d: `${shape([210, 112], [220, 170], [210, 228], [200, 170])} ${shape([152, 170], [210, 160], [268, 170], [210, 180])}`, w: 2.5 },
      handwriting('N', 202, 104, 26),
      { wash: SEA, d: shape([130, 362], [800, 362], [720, 560], [130, 560]), o: 0.35 },
    ],
    boat: [
      { d: shape([300, 470], [500, 470], [470, 508], [330, 508]), cls: 'sg-bob-slow' },
      { d: line([400, 470], [400, 300]) },
      { d: 'M 406 312 Q 480 382 408 452 Z' },
      { d: 'M 400 300 l 30 8 l -30 8' },
      { d: `${circle(350, 437, 11)} ${line([350, 448], [346, 470])} ${line([349, 455], [380, 440])}` },
      { wash: '#e9c46a', d: 'M 406 312 Q 480 382 408 452 Z', o: 0.6 },
      { wash: WOOD, d: shape([300, 470], [500, 470], [470, 508], [330, 508]), o: 0.5, cls: 'sg-bob-slow' },
    ],
    coast: [
      { d: 'M 700 560 Q 730 500 790 470 Q 850 445 900 420 Q 960 360 1040 345 Q 1110 290 1200 300 Q 1280 245 1370 262 Q 1430 270 1480 255', dur: 1.6 },
      { d: 'M 980 400 Q 1050 360 1120 380 M 1180 350 Q 1260 310 1330 330', w: 2 },
      { d: 'M 900 420 Q 895 380 910 340 M 910 340 q -30 -5 -50 15 M 910 340 q 30 -10 50 10 M 910 340 q -10 -25 -35 -30 M 910 340 q 15 -25 40 -25' },
      { d: 'M 1010 352 Q 1004 320 1020 290 M 1020 290 q -26 -4 -42 12 M 1020 290 q 26 -8 42 8 M 1020 290 q 12 -22 34 -22' },
      { d: `${bird(560, 190, 24)} ${bird(620, 160, 18)} ${bird(1040, 150, 20)}`, w: 2.5 },
      { wash: LAND, d: 'M 700 560 Q 730 500 790 470 Q 850 445 900 420 Q 960 360 1040 345 Q 1110 290 1200 300 Q 1280 245 1370 262 Q 1430 270 1480 255 L 1480 560 Z', o: 0.4 },
    ],
    unknown: [handwriting('?', 1210, 480, 150), handwriting('terra incognita', 1020, 540, 34)],
  },

  notes: {
    notes: [
      ...[880, 960, 820, 940, 700].map((len, i) => ({ d: scribble(240, 170 + i * 66, len, i + 1), w: 2.5, dur: 1.4 })),
      { d: 'M 1200 420 Q 1290 330 1370 260 Q 1340 360 1220 430 Z M 1200 430 L 1150 480' },
      { wash: '#c9b99b', d: 'M 1200 420 Q 1290 330 1370 260 Q 1340 360 1220 430 Z', o: 0.4 },
    ],
  },

  beach: {
    dock: [
      { d: line([200, 330], [1400, 330]) },
      ...[[260, 380, 60], [480, 360, 70], [1050, 380, 60], [1250, 365, 70], [900, 410, 50]].map(([x, y, w]) => ({ d: wave(x, y, w), cls: 'sg-bob' })),
      { d: shape([230, 500], [380, 500], [360, 530], [250, 530]), cls: 'sg-bob-slow' },
      { d: line([200, 540], [1400, 540]) },
      { d: [260, 400, 540, 680, 960, 1100, 1240].map((x) => line([x, 540], [x + 4, 570])).join(' '), w: 2.5 },
      { wash: SEA, d: shape([200, 332], [1400, 332], [1400, 538], [200, 538]), o: 0.3 },
      { wash: WOOD, d: shape([200, 540], [1400, 540], [1400, 570], [200, 570]), o: 0.4 },
    ],
    ferryman: [
      { d: `${line([590, 540], [598, 470])} ${line([622, 540], [614, 470])}` },
      { d: shape([578, 470], [588, 365], [606, 350], [628, 350], [642, 365], [650, 470]) },
      { d: circle(616, 322, 26) },
      { d: 'M 596 330 Q 600 372 616 384 Q 632 372 636 330' },
      { d: `${circle(607, 316, 2)} ${circle(625, 316, 2)}`, w: 2.5 },
      { wash: '#4f6d8f', d: shape([578, 470], [588, 365], [606, 350], [628, 350], [642, 365], [650, 470]), o: 0.5 },
    ],
    arms: [{ d: `${line([590, 370], [572, 445])} ${line([640, 370], [660, 445])}` }],
    hat: [
      { d: `${line([580, 300], [652, 300])} M 592 300 L 596 268 L 636 268 L 640 300` },
      { wash: '#6b4b3a', d: shape([592, 300], [596, 268], [636, 268], [640, 300]), o: 0.55 },
    ],
    doff: [
      { d: `${line([590, 370], [572, 445])} ${line([640, 370], [684, 326])}` },
      { d: `${line([664, 318], [722, 300])} M 674 314 L 676 284 L 708 276 L 714 305` },
      { d: 'M 600 302 q 16 -14 32 0', w: 2.5 },
      { wash: '#6b4b3a', d: shape([674, 314], [676, 284], [708, 276], [714, 305]), o: 0.55 },
    ],
    goat: [
      { d: 'M 830 470 Q 828 430 885 428 Q 950 426 962 465 Q 960 500 890 502 Q 832 502 830 470 Z' },
      { d: `${line([848, 498], [846, 540])} ${line([866, 500], [868, 540])} ${line([925, 500], [923, 540])} ${line([945, 494], [949, 540])}` },
      { d: 'M 960 452 l 16 -14 M 840 450 Q 815 430 805 408' },
      { d: 'M 805 408 Q 790 396 772 404 Q 758 420 768 438 Q 782 444 796 432 Q 808 420 805 408' },
      { d: 'M 800 402 Q 806 376 828 380 M 792 400 Q 794 378 812 372 M 808 414 L 828 420 M 770 438 l -4 18' },
      { d: `${circle(785, 412, 2)} M 870 450 q 8 6 16 0 M 900 470 q 8 6 16 0 M 920 446 q 8 6 16 0`, w: 2 },
    ],
    map: [
      { d: shape([768, 436], [724, 446], [732, 488], [774, 470]) },
      { d: 'M 736 474 q 10 -12 20 -6 t 14 -10 M 750 450 l 8 8 m 0 -8 l -8 8', w: 2 },
      { wash: '#efe0b8', d: shape([768, 436], [724, 446], [732, 488], [774, 470]), o: 0.8 },
    ],
    burp: [
      { d: 'M 752 420 q -10 -6 -18 0 M 748 404 q -14 -8 -26 0 M 744 388 q -18 -10 -34 0', w: 2.5 },
      { d: shape([760, 540], [780, 530], [786, 540]), w: 2 },
    ],
  },

  strange: {
    sky: [
      { d: 'M 330 125 A 78 78 0 1 0 330 275 A 60 60 0 1 1 330 125 Z' },
      { d: `${circle(272, 185, 3)} M 256 225 q 12 10 26 2`, w: 2.5 },
      { d: 'M 690 230 Q 700 150 810 150 Q 910 150 935 205 L 995 170 L 985 228 L 1005 262 L 935 238 Q 900 285 800 285 Q 705 282 690 230 Z', cls: 'sg-bob-slow', dur: 1.4 },
      { d: `${circle(735, 212, 4)} M 694 238 q 40 16 90 10 M 820 262 q 10 30 40 32 q -10 -20 -16 -34 M 770 152 q -6 -30 -30 -44 M 770 152 q 8 -32 34 -42 M 770 152 l 0 -48`, cls: 'sg-bob-slow' },
      { d: 'M 1270 70 L 1270 190 M 1270 70 q -20 -10 -40 -30 M 1270 70 q 20 -10 46 -24 M 1270 70 l 0 -40' },
      { d: 'M 1200 200 q -20 40 10 70 q 10 40 60 30 q 40 30 80 -5 q 40 -20 20 -60 q 10 -40 -40 -45 q -60 -20 -130 10 Z' },
      ...[[470, 140, 16], [560, 260, 10], [1080, 110, 14], [1460, 190, 12], [640, 420, 9], [1480, 420, 11]].map(([x, y, r]) => ({ d: star(x, y, r), w: 2.5, cls: 'sg-twinkle' })),
      { wash: '#f2c94c', d: 'M 330 125 A 78 78 0 1 0 330 275 A 60 60 0 1 1 330 125 Z', o: 0.6 },
      { wash: '#7d8fc4', d: 'M 690 230 Q 700 150 810 150 Q 910 150 935 205 L 995 170 L 985 228 L 1005 262 L 935 238 Q 900 285 800 285 Q 705 282 690 230 Z', o: 0.45, cls: 'sg-bob-slow' },
      { wash: '#7fb069', d: 'M 1200 200 q -20 40 10 70 q 10 40 60 30 q 40 30 80 -5 q 40 -20 20 -60 q 10 -40 -40 -45 q -60 -20 -130 10 Z', o: 0.5 },
    ],
    ground: [
      { d: 'M 330 560 h 40 v -36 h 40 v -36 h 40 v -36 h 40 v -36 h 40 v -36' },
      { d: 'M 520 384 q -10 -30 25 -32 q 15 -30 50 -12 q 35 -10 40 22 q 25 10 5 30 Z' },
      { d: 'M 860 430 q 40 -30 80 0 q -40 30 -80 0 Z M 940 430 l 22 -16 l 0 32 Z' },
      { d: `${circle(875, 426, 2.5)} M 895 420 q 10 -40 40 -46 q -10 30 -26 46`, w: 2.5 },
      { d: spiral(1100, 470, 3, 6), w: 2.5 },
      { d: `${shape([1320, 540], [1320, 400], [1400, 400], [1400, 540])} ${shape([1320, 400], [1290, 412], [1290, 548], [1320, 540])}` },
      { d: 'M 1335 548 l -40 30 M 1360 548 l 0 34 M 1385 548 l 30 30', w: 2 },
      { wash: '#dfe7ef', d: 'M 520 384 q -10 -30 25 -32 q 15 -30 50 -12 q 35 -10 40 22 q 25 10 5 30 Z', o: 0.8 },
      { wash: '#e07a5f', d: 'M 860 430 q 40 -30 80 0 q -40 30 -80 0 Z', o: 0.55 },
      { wash: '#f6d77a', d: shape([1320, 540], [1320, 400], [1400, 400], [1400, 540]), o: 0.8, cls: 'sg-flicker' },
    ],
  },

  gate: {
    walls: [
      { d: line([140, 545], [1460, 545]) },
      { d: `M 200 545 V 330 ${crenels(200, 640, 330)}`, dur: 1.2 },
      { d: `M 640 545 V 230 ${crenels(640, 960, 230)} V 545`, dur: 1.2 },
      { d: `M 960 330 ${crenels(960, 1400, 330)} V 545`, dur: 1.2 },
      { d: ARCH },
      { d: [[250, 380], [330, 420], [260, 480], [520, 380], [560, 500], [1020, 400], [1150, 460], [1300, 390], [1340, 500], [690, 270], [900, 280]].map(([x, y]) => line([x, y], [x + 40, y])).join(' '), w: 2 },
      { d: line([680, 262], [920, 262]) },
      { wash: '#c9b99b', d: `M 200 545 V 330 H 640 V 230 H 960 V 330 H 1400 V 545 Z`, o: 0.35 },
    ],
    door: [
      { d: [[740, 388], [770, 364], [800, 352], [830, 364], [860, 388]].map(([x, y]) => line([x, y], [x, 545])).join(' '), w: 2.5 },
      { d: `${line([712, 440], [888, 440])} ${line([712, 510], [888, 510])} ${circle(825, 480, 8)}` },
      { wash: WOOD, d: `${ARCH} Z`, o: 0.45 },
    ],
    lanterns: [...lantern(720, 'red'), ...lantern(800, 'gold'), ...lantern(880, 'blue')],
    words: [handwriting('the key hangs under one of us.', 420, 410, 28, true), handwriting('only one of us speaks true.', 420, 450, 28, true)],
    red: [{ glow: 'red', x: 720, y: 308, r: 110, cls: 'sg-flicker' }],
    gold: [{ glow: 'gold', x: 800, y: 308, r: 110, cls: 'sg-flicker' }],
    blue: [{ glow: 'blue', x: 880, y: 308, r: 110, cls: 'sg-flicker' }],
    open: [
      { d: shape([710, 545], [710, 400], [672, 412], [672, 560]) },
      { d: `${circle(800, 346, 6)} ${line([800, 352], [800, 378])} M 800 372 h 8 M 800 364 h 6`, w: 2.5 },
      { wash: '#f6d77a', d: `${ARCH} Z`, o: 0.75 },
      { wash: WOOD, d: shape([710, 545], [710, 400], [672, 412], [672, 560]), o: 0.45 },
    ],
    rope: [
      { d: 'M 462 318 q 8 -14 16 0 l -8 12 M 470 330 Q 462 430 478 545' },
      { d: `${circle(486, 410, 9)} ${line([484, 419], [478, 450])} ${line([482, 425], [470, 415])} ${line([478, 450], [466, 470])} ${line([478, 450], [490, 468])}` },
    ],
  },

  town: {
    houses: [
      ...TOWN_HOUSES.flatMap(([x, w, top, roof]): Item[] => [
        { d: `M ${x} 470 V ${top} H ${x + w} V 470` },
        { d: shape([x - 12, top], [x + w / 2, top - 70], [x + w + 12, top]) },
        { d: `${shape([x + 20, top + 30], [x + 50, top + 30], [x + 50, top + 64], [x + 20, top + 64])} ${line([x + w - 50, 470], [x + w - 50, 420], [x + w - 22, 420], [x + w - 22, 470])}`, w: 2.5 },
        { wash: roof, d: shape([x - 12, top], [x + w / 2, top - 70], [x + w + 12, top]), o: 0.5 },
      ]),
      { d: `M 750 470 V 200 H 850 V 470 M 740 200 L 800 130 L 860 200 ${circle(800, 250, 26)} M 800 250 v -16 M 800 250 l 12 6` },
      { wash: '#c9b99b', d: shape([750, 470], [750, 200], [850, 200], [850, 470]), o: 0.35 },
    ],
    bunting: [
      { d: `M 160 150 Q 800 280 1440 150`, w: 2 },
      ...Array.from({ length: 13 }, (_, i): Item[] => {
        const [x, y] = bunting((i + 1) / 14);
        const flag = shape([x - 14, y], [x + 14, y], [x, y + 32]);
        return [{ d: flag, w: 2 }, { wash: ['#c0504d', '#e9b949', '#3d7ab8'][i % 3], d: flag, o: 0.6 }];
      }).flat(),
    ],
    crowd: [
      ...person(300, 570, 130, '#a26769', 1),
      ...person(410, 570, 150, '#6d8a96', 2),
      ...person(520, 570, 120, '#c08552', 3),
      ...person(640, 570, 140, '#5b8e7d', 4),
      ...person(960, 570, 135, '#8e7dbe', 5),
      ...person(1080, 570, 150, '#c0504d', 6),
      ...person(1200, 570, 125, '#6d8a96', 7),
      ...person(1310, 570, 145, '#a26769', 8),
    ],
    poet: [
      { d: circle(812, 432, 20) },
      { d: circle(796, 410, 10) },
      { d: 'M 770 570 Q 768 510 790 462 L 822 456 Q 846 500 836 570 Z' },
      { d: `${line([820, 476], [850, 474])} ${shape([848, 446], [900, 440], [904, 484], [852, 490])}` },
      { d: `${circle(806, 430, 1.5)} ${circle(818, 430, 1.5)}`, w: 2.5 },
      { wash: '#7b5ea7', d: 'M 770 570 Q 768 510 790 462 L 822 456 Q 846 500 836 570 Z', o: 0.5 },
      { wash: '#efe0b8', d: shape([848, 446], [900, 440], [904, 484], [852, 490]), o: 0.8 },
    ],
  },

  scroll: {
    scroll: [
      { d: `M 470 98 H 1130 M 470 126 H 1130 ${circle(470, 112, 14)} ${circle(1130, 112, 14)}` },
      { d: `${line([490, 126], [490, 540])} ${line([1110, 126], [1110, 540])}` },
      { d: `M 470 540 H 1130 M 470 568 H 1130 ${circle(470, 554, 14)} ${circle(1130, 554, 14)}` },
      { wash: '#efe0b8', d: shape([490, 126], [1110, 126], [1110, 540], [490, 540]), o: 0.55 },
    ],
    verse1: verse(0),
    verse2: verse(1),
    verse3: verse(2),
    verse4: verse(3),
  },

  ending: {
    land: [
      { d: line([140, 330], [1460, 330]) },
      { d: 'M 1190 330 A 60 60 0 0 1 1310 330 M 1250 250 v -30 M 1190 270 l -20 -20 M 1310 270 l 20 -20 M 1170 310 l -30 -6 M 1330 310 l 30 -6', w: 2.5 },
      { d: 'M 140 520 Q 300 400 520 420 Q 640 430 720 470 Q 860 520 1460 520', dur: 1.4 },
      { d: `${circle(420, 380, 9)} ${line([420, 389], [418, 412])} ${line([418, 412], [412, 424])} ${line([418, 412], [426, 424])} M 420 394 l 18 -4 M 420 394 q -14 2 -22 12` },
      ...[[860, 470, 60, 40], [940, 480, 50, 30], [1010, 466, 70, 44], [1100, 482, 50, 30]].map(([x, y, w, h]): Item => ({
        d: `M ${x} ${y + 30} V ${y} L ${x + w / 2} ${y - h} L ${x + w} ${y} V ${y + 30}`,
        w: 2.5,
      })),
      { d: `${shape([960, 372], [1030, 372], [1020, 384], [970, 384])} M 995 372 V 330 M 998 334 Q 1022 350 998 366`, w: 2.5, cls: 'sg-bob-slow' },
      { d: `${bird(600, 200, 22)} ${bird(660, 170, 16)}`, w: 2.5 },
      { wash: '#f4a261', d: shape([140, 120], [1460, 120], [1460, 330], [140, 330]), o: 0.25 },
      { wash: '#e76f51', d: 'M 1190 330 A 60 60 0 0 1 1310 330 Z', o: 0.7 },
      { wash: SEA, d: shape([140, 332], [1460, 332], [1460, 520], [720, 470], [520, 420], [140, 520]), o: 0.3 },
      { wash: LAND, d: 'M 140 520 Q 300 400 520 420 Q 640 430 720 470 Q 860 520 1460 520 L 1460 570 L 140 570 Z', o: 0.4 },
    ],
    end: [handwriting('The End', 800, 230, 110, true), { d: 'M 620 262 q 180 40 360 0', w: 2.5 }],
  },

  desk: {
    book: [
      { d: shape([540, 250], [1000, 220], [1050, 470], [590, 505]), dur: 1.2 },
      { d: 'M 590 505 L 594 525 L 1054 490 L 1050 470 M 600 512 L 1052 478' },
      { d: 'M 760 492 q 6 40 -4 70 l 12 -10 l 8 14 q 4 -40 -2 -76', w: 2.5 },
      { d: shape([660, 300], [920, 282], [940, 380], [680, 398]), w: 2 },
      { wash: '#7a2e2e', d: shape([540, 250], [1000, 220], [1050, 470], [590, 505]), o: 0.5 },
      { wash: '#c9a227', d: 'M 760 492 q 6 40 -4 70 l 12 -10 l 8 14 q 4 -40 -2 -76', o: 0.7 },
    ],
    cup: [
      { d: `${ellipse(1210, 478, 100, 22)}` },
      { d: `${ellipse(1210, 380, 60, 18)} M 1150 380 Q 1155 470 1210 475 Q 1265 470 1270 380 M 1268 400 q 40 0 30 35 q -10 22 -36 18` },
      ...[1185, 1210, 1235].map((x): Item => ({ d: `M ${x} 360 q -12 -25 0 -50 t 0 -50`, w: 2, cls: 'sg-steam' })),
      { wash: '#5b8e7d', d: 'M 1150 380 Q 1155 470 1210 475 Q 1265 470 1270 380 Z', o: 0.5 },
    ],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

function Writing({ text, x, y, size, middle, delay }: { text: string; x: number; y: number; size: number; middle?: boolean; delay: number }) {
  const id = `sg-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const width = text.length * size * 0.42;
  const left = middle ? x - width / 2 : x;
  const sweep = `M ${left - 20} ${y - size * 0.3} H ${left + width + 30}`;
  return (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
        <path
          d={sweep}
          pathLength={1}
          className="sg-ink"
          style={{ stroke: '#fff', strokeWidth: size * 1.5, strokeLinecap: 'butt', animationDelay: `${delay}s`, animationDuration: `${text.length * CHAR_DUR}s`, animationTimingFunction: 'linear' }}
        />
      </mask>
      <text x={x} y={y} mask={`url(#${id})`} textAnchor={middle ? 'middle' : 'start'} style={{ ...styles.writing, fontSize: size }}>
        {text}
      </text>
    </>
  );
}

function Part({ items, start }: { items: Item[]; start: number }) {
  //fixed when the part first appears, so a later cue on the same page doesn't restart it
  const [times] = useState(() => schedule(items, start).times);
  return (
    <g>
      {items.map((item, i) => {
        const delay = `${times[i]}s`;
        if ('text' in item) return <Writing key={i} {...item} delay={times[i]} />;
        if ('glow' in item) {
          return (
            <g key={i} className="sg-wash" style={{ animationDelay: delay }}>
              <circle cx={item.x} cy={item.y} r={item.r} fill={`url(#sg-glow-${item.glow})`} className={item.cls} />
            </g>
          );
        }
        if ('wash' in item) {
          return (
            <g key={i} className={item.cls}>
              <path d={item.d} fill={item.wash} fillOpacity={item.o ?? 0.5} className="sg-wash" filter="url(#sg-bleed)" style={{ animationDelay: delay }} />
            </g>
          );
        }
        return (
          <g key={i} className={item.cls}>
            <path
              d={item.d}
              pathLength={1}
              className="sg-ink"
              style={{ strokeWidth: item.w ?? 3.2, animationDelay: delay, animationDuration: `${item.dur ?? INK_DUR}s` }}
            />
          </g>
        );
      })}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page draws it afresh
  starts: Record<string, number>; //when each part began drawing, in seconds after it appeared
}

//new parts draw one after another; on a fresh page they wait for the old one to fade
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t = schedule(ART[page][part], t).end;
  }
  return starts;
}

function turn(shown: Shown, cue: Cue): { now: Shown; prev?: Shown } {
  if (cue.page === shown.cue.page) {
    const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
    return { now: { ...shown, cue, starts: { ...shown.starts, ...startTimes(added, cue.page, 0.1) } } };
  }
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, cue.page, 0.5) }, prev: shown };
}

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'sg-leave' : undefined} filter="url(#sg-wobble)">
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  stove: new URL('./sounds/stove.m4a', import.meta.url).href,
  shore: new URL('./sounds/shore.m4a', import.meta.url).href,
  town: new URL('./sounds/town.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the stove crackles under everything, with the story's own sounds round it
function mixFor({ page, dim }: Cue): Partial<Record<Bed, number>> {
  if (dim) return { stove: 0.3 };
  if (page === 'shore' || page === 'beach' || page === 'ending') return { shore: 0.45, stove: 0.25 };
  if (page === 'gate' || page === 'town' || page === 'scroll') return { town: 0.5, stove: 0.25 };
  return { stove: 0.5 };
}

const PEN = new URL('./sounds/pen.m4a', import.meta.url).href;
const PAGE_TURN: OneShot = { src: new URL('./sounds/page.m4a', import.meta.url).href, volume: 0.5 };
const ONE_SHOTS: Record<string, OneShot> = {
  once_upon: { src: PEN, volume: 0.45, delay: 0.2 },
  scribbling: { src: PEN, volume: 0.45, delay: 0.5 },
  strange: { src: new URL('./sounds/harp.m4a', import.meta.url).href, volume: 0.4, delay: 0.4 },
  gate_open: { src: new URL('./sounds/gate.m4a', import.meta.url).href, volume: 0.55, delay: 0.3 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

function Sketchbook({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, cues[first].page, 0.5) },
  }));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setView((v) => {
        const next = turn(v.now, cues[animation]);
        return { now: next.now, prev: next.prev ?? v.prev };
      });
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Story Game has no cue for the animation "${animation}"`);
  }, [animation]);

  const sound = useRef<Soundscape<Bed> | null>(null);
  const lastPage = useRef(cues[active].page);
  useEffect(() => {
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;
    return () => {
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const cue = cues[active];
    sound.current?.mix(mixFor(cue));
    if (cue.page !== lastPage.current) sound.current?.play(PAGE_TURN);
    lastPage.current = cue.page;
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { now, prev } = view;
  const card = now.cue.card;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <image href={PAPER_IMAGE} width={W} height={H} preserveAspectRatio="none" />
        <path d={`${circle(1460, 90, 54)} ${circle(1466, 94, 50)}`} fill="none" stroke="#b08850" strokeOpacity={0.18} strokeWidth={5} />
      </svg>

      <svg style={{ ...styles.layer, ...styles.multiply }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="sg-wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="sg-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="12" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          {(Object.keys(LANTERNS) as Lantern[]).map((l) => (
            <radialGradient key={l} id={`sg-glow-${l}`}>
              <stop offset="0" stopColor={LANTERNS[l]} stopOpacity={0.55} />
              <stop offset="1" stopColor={LANTERNS[l]} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
      </svg>

      <div style={styles.stove} className="sg-stove" />
      <div style={{ ...styles.dim, opacity: now.cue.dim ? 1 : 0 }} />
      <div style={{ ...styles.card, opacity: card ? 1 : 0 }}>
        {card && (
          <>
            <div style={styles.kicker}>{card[0]}</div>
            <div style={styles.name}>{card[1]}</div>
          </>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.sg-ink {
  fill: none;
  stroke: ${INK};
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1 2;
  stroke-dashoffset: 1.02;
  opacity: 0;
  animation: sg-draw ${INK_DUR}s ease-out forwards;
}
@keyframes sg-draw {
  from { stroke-dashoffset: 1.02; opacity: 1; }
  to { stroke-dashoffset: 0; opacity: 1; }
}
.sg-wash {
  opacity: 0;
  animation: sg-fade 1.4s ease forwards;
}
@keyframes sg-fade {
  to { opacity: 1; }
}
.sg-leave {
  animation: sg-leave 0.5s ease forwards;
}
@keyframes sg-leave {
  to { opacity: 0; }
}
.sg-bob, .sg-bob-slow {
  transform-box: fill-box;
  animation: sg-bob 3.2s ease-in-out infinite;
}
.sg-bob-slow {
  animation-duration: 5s;
}
@keyframes sg-bob {
  50% { transform: translateY(5px); }
}
.sg-twinkle {
  transform-box: fill-box;
  transform-origin: center;
  animation: sg-twinkle 2.6s ease-in-out infinite;
}
@keyframes sg-twinkle {
  50% { transform: scale(1.25) rotate(12deg); }
}
.sg-flicker {
  animation: sg-flicker 1.9s ease-in-out infinite;
}
@keyframes sg-flicker {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.75; }
  55% { opacity: 0.95; }
  80% { opacity: 0.7; }
}
.sg-steam {
  animation: sg-steam 3.6s ease-in-out infinite;
}
.sg-steam:nth-of-type(2n) {
  animation-delay: -1.2s;
}
@keyframes sg-steam {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(6px, -10px); }
}
.sg-stove {
  animation: sg-stove 2.3s ease-in-out infinite;
}
@keyframes sg-stove {
  0%, 100% { opacity: 1; }
  40% { opacity: 0.8; }
  70% { opacity: 0.92; }
}
@media (prefers-reduced-motion: reduce) {
  .sg-bob, .sg-bob-slow, .sg-twinkle, .sg-flicker, .sg-steam, .sg-stove {
    animation: none;
  }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: PAPER,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  multiply: {
    mixBlendMode: 'multiply',
  },
  writing: {
    fill: INK,
    fontFamily: 'var(--font-hand)',
  },
  //warm light from the stove off to the left, and the edges of the page falling into shadow
  stove: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(ellipse at 0% 100%, rgba(255,140,50,0.28), rgba(255,140,50,0) 55%), radial-gradient(ellipse at center, rgba(60,30,10,0) 55%, rgba(60,30,10,0.35) 100%)',
  },
  dim: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'rgba(30,16,6,0.45)',
    transition: 'opacity 3s ease',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: INK,
    fontFamily: 'var(--font-hand)',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 22,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  name: {
    fontSize: 84,
    letterSpacing: 2,
  },
};

export default Sketchbook;
