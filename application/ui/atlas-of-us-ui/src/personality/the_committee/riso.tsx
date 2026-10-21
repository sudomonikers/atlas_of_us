import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Committee is printed like the festival's own flyer: a risograph, in a few bright inks on cream paper. Inks
// multiply where they overlap, each colour sits a couple of pixels off true like a real riso pass, and a fine grain of
// paper shows through everything. There's no white ink, so anything paper-coloured is the paper, knocked out on top.
// The player is always in pink. A cue names a page and the parts of it to show: parts already on the page stay put, new
// ones fade in after them, and turning to a new page fades the old one out. Everything is SVG in a fixed 1600x900
// space, scaled to cover the screen. The pictures keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  paper: '#f5eedf',
  pink: '#ff48b0',
  teal: '#00838a',
  yellow: '#ffe800',
  blue: '#0078bf',
  orange: '#ff6c2f',
  green: '#00a95c',
  federal: '#3d5588',
  black: '#3a3a42',
};
type Colour = keyof typeof C;

//each ink's pass lands a little off, the same way every time
const SHIFT: Record<Colour, Pt> = {
  paper: [0, 0],
  pink: [3, -2],
  teal: [-2, 2],
  yellow: [2, 3],
  blue: [-3, -1],
  orange: [1, -3],
  green: [-2, -2],
  federal: [2, 1],
  black: [0, 0],
};

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'flyer' | 'hall' | 'chat' | 'pub' | 'desk' | 'street' | 'fridge';

interface Cue {
  page: Page;
  parts: string[]; //faded in in this order
  card?: [kicker: string, name: string];
  mix?: Partial<Record<Bed, number>>; //in place of the page's sound, when the day moves on under the same picture
}

const HALL = ['room', 'chairs', 'urn'];
const STREET = ['sky', 'houses', 'road'];
const SET_UP = [...STREET, 'gazebos', 'bunting'];
const OPEN = [...SET_UP, 'stalls', 'people'];
const NOTES = Array.from({ length: 10 }, (_, i) => `note${i}`);
const FAIR = { street: 0.3, crowd: 0.5, carnival: 0.3 };

const cues: Record<string, Cue> = {
  title_card: { page: 'flyer', parts: ['door', 'sheet', 'sun', 'flags'], card: ['Larch Road Street Festival', 'The Committee'] },
  flyer: { page: 'flyer', parts: ['door', 'sheet', 'sun', 'flags', 'words'] },
  hall: { page: 'hall', parts: [...HALL, 'you'] },
  pat: { page: 'hall', parts: [...HALL, 'you', 'pat'] },
  silence: { page: 'hall', parts: [...HALL, 'you', 'pat', 'dots'] },
  clipboard: { page: 'hall', parts: [...HALL, 'you_up', 'pat', 'clipboard'] },
  whiteboard: { page: 'hall', parts: [...HALL, 'board', 'you_up'] },
  denise: { page: 'hall', parts: [...HALL, 'you', 'board', 'denise'] },
  barry_chair: { page: 'hall', parts: [...HALL, 'you', 'barry'] },
  chat: { page: 'chat', parts: ['room', 'phone', 'header', 'bubbles', 'badge'] },
  chat_home: { page: 'chat', parts: ['room', 'mug', 'phone', 'header', 'bubbles', 'more'] },
  chat_muted: { page: 'chat', parts: ['room', 'phone', 'header', 'bubbles', 'muted'] },
  pub: { page: 'pub', parts: ['bar', 'table', 'you'] },
  pub_late: { page: 'pub', parts: ['bar', 'table', 'you', 'late'] },
  desk: { page: 'desk', parts: ['night', 'clock', 'lamp', 'laptop'] },
  desk_draft: { page: 'desk', parts: ['night', 'clock', 'lamp', 'laptop', 'draft'] },
  desk_done: { page: 'desk', parts: ['night', 'clock', 'lamp', 'laptop', 'neat', 'tick'] },
  desk_sent: { page: 'desk', parts: ['night', 'clock', 'lamp', 'laptop', 'draft', 'sent'] },
  street: { page: 'street', parts: STREET },
  ten_things: { page: 'street', parts: [...STREET, 'mess', 'you_mid', ...NOTES], mix: { street: 0.4, setup: 0.7, generator: 0.6 } },
  sorted: { page: 'street', parts: [...SET_UP, 'you_mid'], mix: { street: 0.5, setup: 0.7, generator: 0.3 } },
  banner: { page: 'street', parts: [...SET_UP, 'banner_bad', 'barry'] },
  banner_redone: { page: 'street', parts: [...SET_UP, 'banner_neat', 'barry'] },
  banner_fixed: { page: 'street', parts: [...SET_UP, 'banner_fixed', 'barry'] },
  stalls: { page: 'street', parts: OPEN, mix: FAIR },
  cakes_down: { page: 'street', parts: [...OPEN, 'cakes_down', 'ade'], mix: FAIR },
  cakes_saved: { page: 'street', parts: [...OPEN, 'cakes_saved', 'ade', 'you_cakes'], mix: FAIR },
  cakes_left: { page: 'street', parts: [...OPEN, 'cakes_down', 'ade', 'you_run'], mix: FAIR },
  festival: { page: 'street', parts: [...SET_UP, 'stalls', 'band', 'crowd'], mix: { crowd: 0.85, carnival: 0.6 } },
  evening: { page: 'street', parts: [...SET_UP, 'stalls', 'band', 'dusk', 'lights', 'dancers'], mix: { crowd: 0.6, carnival: 0.8 } },
  fridge: { page: 'fridge', parts: ['door', 'calendar', 'photo', 'flyer'] },
  goodbye: { page: 'flyer', parts: ['door', 'sheet', 'sun', 'flags'], card: ['Same time next year?', 'The Committee'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: flat shapes, lines and type
type Item =
  | { fill: Colour; d: string; o?: number; cls?: string }
  | { line: Colour; d: string; w?: number; o?: number; dash?: string; cls?: string }
  | { text: string; c: Colour; x: number; y: number; size: number; cls?: string };

const GAP = 0.06; //seconds between one item fading in and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const words = (c: Colour, text: string, x: number, y: number, size: number, cls?: string): Item => ({ c, text, x, y, size, cls });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const INKS: Colour[] = ['teal', 'blue', 'orange', 'green', 'yellow', 'federal'];

//a cut-out person: a round head on a rounded body, feet at (x, y)
function body(x: number, y: number, h: number) {
  const r = h * 0.15;
  const top = y - (h - 2 * r - 5);
  return `M ${x - h * 0.21} ${y} Q ${x - h * 0.23} ${top} ${x} ${top} Q ${x + h * 0.23} ${top} ${x + h * 0.21} ${y} Z ${circle(x, y - (h - r), r)}`;
}
const person = (x: number, y: number, h: number, fill: Colour, cls?: string): Item => ({ fill, d: body(x, y, h), cls });
//someone on a plastic chair: the chair's back and legs behind them
const seated = (x: number, y: number, h: number, fill: Colour): Item[] => [
  { line: 'black', d: `${line([x - h * 0.28, y - h * 0.55], [x - h * 0.28, y + h * 0.3])} ${line([x - h * 0.28, y], [x + h * 0.28, y], [x + h * 0.28, y + h * 0.3])}`, w: 5, o: 0.7 },
  person(x, y, h, fill),
];

//a string of bunting from x1 to x2, sagging in the middle, flags cycling through the inks
function bunting(x1: number, x2: number, y: number, sag: number, n: number, inks: Colour[] = ['pink', 'teal', 'yellow']): Item[] {
  const at = (t: number): Pt => [x1 + (x2 - x1) * t, y + sag * 4 * t * (1 - t)];
  const flags = inks.map((fill, k): Item => ({
    fill,
    d: Array.from({ length: n }, (_, i) => i)
      .filter((i) => i % inks.length === k)
      .map((i) => {
        const [a, b] = [at((i + 0.15) / n), at((i + 0.85) / n)];
        return shape(a, b, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 46]);
      })
      .join(' '),
    o: 0.9,
    cls: 'rs-sway',
  }));
  return [{ line: 'black', d: `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}`, w: 3, o: 0.7 }, ...flags];
}

//a sticky note with a job on it
const note = (i: number, label: string): Item[] => {
  const x = 120 + (i % 5) * 290 + rand(i) * 40;
  const y = 50 + Math.floor(i / 5) * 170 + rand(i + 20) * 30;
  return [
    { fill: i % 2 ? 'pink' : 'yellow', d: shape([x, y], [x + 170, y + 6], [x + 166, y + 120], [x - 4, y + 114]), o: i % 2 ? 0.55 : 0.95 },
    words('black', label, x + 84, y + 72, 28),
  ];
};
const JOBS = ['GENERATOR', 'BUNTING', 'POLES??', 'BAND LOST', 'RAFFLE', 'SIGNS', 'VAN!', 'BINS?', 'TABLES', 'FLOAT'];

//a trestle table under a gazebo
const GAZEBOS = [230, 600, 1000, 1370];

//a little crowd: people of every ink along the road
const crowd = (n: number, seed: number, cls?: string): Item[] =>
  INKS.map((fill, k) => ({
    fill,
    d: Array.from({ length: n }, (_, i) => i)
      .filter((i) => i % INKS.length === k)
      .map((i) => body(40 + (i / n) * 1520 + rand(i + seed) * 40, 600 + rand(i + seed + 9) * 36, 110 + rand(i + seed + 4) * 50))
      .join(' '),
    o: 0.85,
    cls,
  }));

//a cake: a round of sponge with icing on top
const cakes = (spots: Pt[]): Item[] => [
  { fill: 'orange', d: spots.map(([x, y]) => ellipse(x, y, 30, 14)).join(' '), o: 0.7 },
  { fill: 'pink', d: spots.map(([x, y], i) => (i % 2 ? '' : ellipse(x - 2, y - 6, 24, 8))).join(' '), o: 0.9 },
  { fill: 'yellow', d: spots.map(([x, y], i) => (i % 2 ? ellipse(x + 2, y - 6, 24, 8) : '')).join(' '), o: 1 },
];
const DROPPED: Pt[] = Array.from({ length: 9 }, (_, i) => [460 + rand(i + 40) * 280, 590 + rand(i + 50) * 40]);

//the banner over the road, poles either end
const POLES: Item = { line: 'black', d: `${line([140, 520], [140, 70])} ${line([1460, 520], [1460, 70])}`, w: 8 };
const CLOTH: Item = { fill: 'paper', d: shape([150, 70], [1450, 76], [1446, 196], [154, 190]) };
//the letters run downhill, chunk by chunk
const DOWNHILL = (last: string): Item[] => [
  words('teal', 'WELCOME TO', 330, 132, 40),
  words('teal', 'THE LARCH ROAD', 640, 146, 40),
  words('teal', 'STREET', 930, 162, 40),
  words('teal', last, 1200, 178, 40),
  { line: 'teal', d: [300, 390, 600, 720, 900, 1110, 1240].map((x, i) => line([x, 140 + i * 6], [x, 162 + i * 6 + rand(i) * 20])).join(' '), w: 4, o: 0.8 },
];

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 30 }, (_, i) => circle(1130 + rand(i) * 340, 110 + rand(i + 70) * 260, 1.5 + rand(i + 9) * 2)).join(' ');
const HOUSE_INKS: [Colour, number][] = [
  ['pink', 0.3],
  ['yellow', 0.55],
  ['teal', 0.25],
  ['orange', 0.35],
  ['blue', 0.25],
];
const DOOR_INKS: Colour[] = ['teal', 'pink', 'federal', 'green', 'orange'];

const ART: Record<Page, Record<string, Item[]>> = {
  flyer: {
    door: [
      { fill: 'teal', d: rect(0, 0, W, 660), o: 0.45 },
      { line: 'teal', d: `${rect(140, -20, 1320, 700)} ${rect(220, 60, 1160, 560)}`, w: 10, o: 0.6 },
      { fill: 'black', d: round(620, 20, 360, 50, 10), o: 0.8 },
      { fill: 'yellow', d: round(600, 6, 400, 18, 8), o: 1 },
    ],
    sheet: [{ fill: 'paper', d: shape([470, 80], [1130, 66], [1150, 618], [488, 630]) }],
    sun: [
      { fill: 'yellow', d: circle(810, 260, 120), o: 1 },
      { fill: 'pink', d: shape([490, 420], [640, 300], [760, 380], [900, 280], [1140, 420], [1142, 460], [492, 470]), o: 0.8 },
      { fill: 'orange', d: shape([492, 470], [600, 400], [740, 470]), o: 0.7 },
    ],
    flags: bunting(480, 1140, 110, 30, 14),
    words: [
      words('teal', 'LARCH ROAD', 812, 384, 84),
      words('pink', 'STREET FESTIVAL', 816, 460, 62),
      words('black', 'IS BACK! VOLUNTEERS WANTED', 818, 528, 32),
      words('black', "TUES 7PM, ST. ANNE'S", 818, 576, 28),
    ],
  },

  hall: {
    room: [
      { fill: 'yellow', d: rect(0, 0, W, 660), o: 0.35 },
      { fill: 'blue', d: `${rect(70, 60, 170, 300)} ${rect(1360, 60, 170, 300)}`, o: 0.3 },
      { line: 'black', d: `${rect(70, 60, 170, 300)} ${rect(1360, 60, 170, 300)} ${line([155, 60], [155, 360])} ${line([1445, 60], [1445, 360])}`, w: 6, o: 0.6 },
      { fill: 'orange', d: rect(0, 470, W, 190), o: 0.4 },
      { line: 'orange', d: Array.from({ length: 6 }, (_, i) => line([0, 500 + i * 28], [W, 500 + i * 28])).join(' '), w: 2, o: 0.7 },
      { fill: 'orange', d: rect(320, 90, 300, 210), o: 0.75 },
      { fill: 'paper', d: `${rect(345, 110, 90, 110)} ${rect(455, 120, 140, 80)} ${rect(470, 215, 100, 70)} ${rect(350, 235, 90, 50)}` },
      { fill: 'pink', d: [[390, 116], [525, 126], [520, 221], [395, 241]].map(([x, y]) => circle(x, y, 6)).join(' '), o: 1 },
    ],
    chairs: [
      ...[330, 470, 930, 1070].flatMap((x, i) => seated(x, 440, 110, INKS[(i + 2) % INKS.length])),
      ...[250, 400, 550, 850, 1000, 1150].flatMap((x, i) => seated(x, 510 + Math.abs(x - 700) * 0.05, 130, INKS[i % INKS.length])),
    ],
    urn: [
      { fill: 'black', d: `${rect(1200, 430, 300, 14)} ${rect(1215, 444, 10, 120)} ${rect(1475, 444, 10, 120)}`, o: 0.75 },
      { fill: 'teal', d: round(1230, 300, 100, 130, 18), o: 0.85 },
      { fill: 'black', d: `${rect(1250, 285, 60, 20)} ${rect(1325, 380, 26, 10)}`, o: 0.8 },
      { fill: 'paper', d: `${rect(1370, 396, 26, 34)} ${rect(1410, 396, 26, 34)} ${ellipse(1440, 426, 44, 8)}` },
      { fill: 'yellow', d: [1415, 1440, 1465].map((x) => circle(x, 420, 10)).join(' '), o: 1 },
    ],
    you: seated(700, 560, 140, 'pink'),
    you_up: [person(700, 610, 210, 'pink')],
    pat: [
      person(1100, 610, 200, 'green'),
      { fill: 'paper', d: shape([1130, 470], [1200, 462], [1206, 540], [1136, 548]) },
      { line: 'pink', d: [0, 1, 2].map((i) => line([1146, 484 + i * 18], [1192, 480 + i * 18])).join(' '), w: 4 },
    ],
    dots: [
      { fill: 'paper', d: `${round(560, 200, 260, 110, 50)} ${shape([640, 300], [610, 350], [680, 306])}` },
      { line: 'black', d: `${round(560, 200, 260, 110, 50)}`, w: 4, o: 0.7 },
      words('black', '. . .', 690, 278, 70, 'rs-blink'),
      { line: 'black', d: [250, 550, 850, 1150].map((x) => `M ${x + 30} ${370 + Math.abs(x - 700) * 0.05} q -10 -16 0 -32 t 0 -32`).join(' '), w: 3, o: 0.4, cls: 'rs-sway' },
    ],
    clipboard: [
      { fill: 'orange', d: round(520, 60, 310, 400, 16), o: 0.75 },
      { fill: 'paper', d: rect(546, 100, 258, 340) },
      { fill: 'black', d: round(610, 44, 130, 50, 10), o: 0.85 },
      words('pink', 'CHAIR', 675, 170, 48),
      { line: 'black', d: [0, 1, 2, 3, 4].map((i) => line([572, 220 + i * 44], [776, 220 + i * 44])).join(' '), w: 3, o: 0.4 },
    ],
    board: [
      { fill: 'paper', d: rect(280, 60, 620, 300) },
      { line: 'black', d: rect(280, 60, 620, 300), w: 10, o: 0.7 },
      words('pink', 'JOBS', 590, 118, 48),
      ...['BAND', 'FLAGS', 'PROGRAMS', 'RAFFLE', 'SIGNS'].map((job, i) => words('black', job, 430, 166 + i * 40, 30)),
      { line: 'teal', d: [0, 1, 3, 4].map((i) => `M 600 ${156 + i * 40} q 20 -14 40 0 t 40 0 t 40 0`).join(' '), w: 4 },
      words('pink', 'ME!', 680, 246, 34),
    ],
    denise: [
      person(980, 610, 200, 'blue'),
      { line: 'blue', d: line([940, 470], [880, 330]), w: 12 },
    ],
    barry: [
      person(1020, 610, 210, 'orange'),
      { line: 'orange', d: line([1060, 470], [1100, 300]), w: 14 },
    ],
  },

  chat: {
    room: [
      { fill: 'federal', d: rect(0, 0, W, 660), o: 0.35 },
      { fill: 'yellow', d: shape([140, 0], [420, 0], [560, 660], [0, 660], [0, 300]), o: 0.35 },
      { fill: 'orange', d: rect(0, 520, W, 140), o: 0.5 },
    ],
    mug: [
      { fill: 'pink', d: `${round(1150, 410, 110, 120, 14)}`, o: 0.85 },
      { line: 'pink', d: 'M 1260 440 q 40 0 40 30 t -40 30', w: 12 },
      { line: 'black', d: 'M 1180 390 q -12 -20 0 -40 t 0 -40 M 1225 390 q -12 -20 0 -40 t 0 -40', w: 4, o: 0.4, cls: 'rs-sway' },
    ],
    phone: [
      { fill: 'black', d: round(560, 30, 480, 600, 50), o: 0.9 },
      { fill: 'paper', d: round(584, 80, 432, 520, 14) },
    ],
    header: [
      { fill: 'teal', d: rect(584, 80, 432, 70), o: 0.9 },
      words('paper', 'LARCH RD FEST!!!', 800, 128, 34),
    ],
    bubbles: [
      { fill: 'pink', d: `${round(604, 170, 260, 60, 24)} ${round(604, 330, 300, 60, 24)}`, o: 0.45 },
      { fill: 'yellow', d: `${round(736, 250, 260, 60, 24)} ${round(696, 410, 300, 60, 24)}`, o: 0.9 },
      words('black', 'BOUNCE HOUSE??', 734, 211, 26),
      words('black', 'who has the tent key', 866, 291, 22),
      words('black', 'BOUNCE HOUSE!!!', 754, 371, 26),
      words('black', 'pls see my 14 msgs above', 846, 451, 22),
    ],
    badge: [
      { fill: 'pink', d: circle(1030, 50, 46), o: 1, cls: 'rs-pop' },
      words('paper', '80', 1030, 66, 46, 'rs-pop'),
    ],
    more: [
      { fill: 'teal', d: `${round(604, 490, 340, 60, 24)}`, o: 0.35 },
      words('black', 'BOUNCE HOUSE UPDATE', 774, 531, 26),
    ],
    muted: [
      { fill: 'paper', d: circle(800, 340, 150) },
      { line: 'pink', d: circle(800, 340, 150), w: 14 },
      { fill: 'black', d: `M 740 400 Q 740 270 800 270 Q 860 270 860 400 L 880 420 L 720 420 Z ${circle(800, 436, 18)}`, o: 0.8 },
      { line: 'pink', d: line([700, 240], [900, 440]), w: 16 },
    ],
  },

  pub: {
    bar: [
      { fill: 'orange', d: rect(0, 0, W, 660), o: 0.5 },
      { fill: 'black', d: rect(0, 330, W, 330), o: 0.22 },
      { fill: 'black', d: `${rect(940, 90, 560, 14)} ${rect(940, 200, 560, 14)}`, o: 0.6 },
      ...(['green', 'teal', 'yellow', 'pink', 'blue'] as Colour[]).map((fill, k): Item => ({
        fill,
        d: Array.from({ length: 12 }, (_, i) => i)
          .filter((i) => i % 5 === k)
          .map((i) => `${rect(960 + i * 44, i % 2 ? 30 : 140, 24, 60)} ${rect(966 + i * 44, i % 2 ? 14 : 124, 12, 18)}`)
          .join(' '),
        o: 0.85,
      })),
      { fill: 'black', d: rect(880, 300, 720, 60), o: 0.55 },
      { line: 'black', d: line([400, 0], [400, 110]), w: 4, o: 0.7 },
      { fill: 'yellow', d: shape([340, 160], [460, 160], [430, 110], [370, 110]), o: 1 },
      { fill: 'yellow', d: shape([340, 160], [460, 160], [560, 470], [240, 470]), o: 0.25 },
    ],
    table: [
      { fill: 'black', d: `${ellipse(620, 500, 260, 50)} ${rect(606, 500, 28, 130)}`, o: 0.7 },
      ...seated(360, 560, 150, 'teal'),
      ...seated(880, 560, 150, 'blue'),
      person(500, 470, 130, 'green'),
      person(760, 470, 140, 'orange'),
      { fill: 'yellow', d: [470, 550, 690, 770].map((x) => rect(x, 430, 36, 60)).join(' '), o: 0.95 },
      { fill: 'orange', d: [470, 550, 690, 770].map((x) => rect(x, 450, 36, 40)).join(' '), o: 0.6 },
      { fill: 'paper', d: [470, 550, 690, 770].map((x) => rect(x, 430, 36, 12)).join(' ') },
    ],
    you: seated(620, 600, 150, 'pink'),
    late: [
      { fill: 'paper', d: circle(200, 130, 70) },
      { line: 'black', d: `${circle(200, 130, 70)} ${line([200, 130], [200, 80])} ${line([200, 130], [176, 104])}`, w: 6, o: 0.8 },
      { line: 'orange', d: line([800, 340], [840, 220]), w: 14 },
      { fill: 'black', d: [[860, 230], [940, 180], [1010, 250]].map(([x, y]) => `${ellipse(x, y, 16, 12)} ${rect(x + 12, y - 60, 5, 60)}`).join(' '), o: 0.8, cls: 'rs-sway' },
    ],
  },

  desk: {
    night: [
      { fill: 'blue', d: rect(0, 0, W, 660), o: 0.22 },
      { fill: 'federal', d: rect(1120, 80, 380, 320), o: 0.95 },
      { fill: 'paper', d: `${STARS} ${circle(1400, 150, 34)}` },
      { line: 'black', d: `${rect(1120, 80, 380, 320)} ${line([1310, 80], [1310, 400])}`, w: 10, o: 0.7 },
      { fill: 'orange', d: rect(0, 470, W, 190), o: 0.55 },
    ],
    clock: [
      { fill: 'paper', d: circle(260, 140, 70) },
      { line: 'black', d: `${circle(260, 140, 70)} ${line([260, 140], [260, 86])} ${line([260, 140], [262, 100])}`, w: 6, o: 0.8 },
    ],
    lamp: [
      { fill: 'yellow', d: shape([270, 250], [380, 250], [500, 470], [150, 470]), o: 0.35 },
      { fill: 'black', d: `${rect(230, 456, 110, 14)} ${shape([280, 456], [292, 456], [372, 300], [360, 296])}`, o: 0.8 },
      { fill: 'yellow', d: shape([260, 250], [390, 250], [360, 200], [290, 200]), o: 1 },
    ],
    laptop: [
      { fill: 'black', d: round(540, 140, 520, 330, 18), o: 0.9 },
      { fill: 'paper', d: rect(564, 162, 472, 284) },
      { fill: 'black', d: shape([500, 470], [1100, 470], [1140, 500], [460, 500]), o: 0.75 },
    ],
    draft: [
      { fill: 'pink', d: rect(584, 180, 432, 26), o: 0.7 },
      { line: 'black', d: Array.from({ length: 16 }, (_, i) => `${line([586, 222 + i * 13], [700 + rand(i) * 90, 222 + i * 13])}`).join(' '), w: 3, o: 0.5 },
      { fill: 'teal', d: rect(820, 230, 190, 150), o: 0.4 },
      { line: 'teal', d: 'M 830 360 q 40 -80 80 -40 t 90 -80', w: 4 },
      { line: 'black', d: Array.from({ length: 4 }, (_, i) => line([820, 396 + i * 12], [1004 - rand(i + 3) * 60, 396 + i * 12])).join(' '), w: 3, o: 0.5 },
      { line: 'pink', d: ellipse(660, 300, 50, 18), w: 4 },
    ],
    neat: [
      words('teal', 'LARCH RD FESTIVAL', 800, 206, 34),
      { line: 'black', d: Array.from({ length: 7 }, (_, i) => `${line([590, 246 + i * 26], [610, 246 + i * 26])} ${line([630, 246 + i * 26], [760 + rand(i) * 30, 246 + i * 26])}`).join(' '), w: 4, o: 0.6 },
      { fill: 'yellow', d: rect(830, 236, 180, 180), o: 0.8 },
      { line: 'teal', d: 'M 840 400 q 40 -80 80 -40 t 80 -80', w: 6 },
      { fill: 'pink', d: [[880, 300], [960, 360], [950, 270]].map(([x, y]) => circle(x, y, 10)).join(' '), o: 1 },
    ],
    tick: [{ line: 'green', d: 'M 1120 200 l 40 50 l 90 -120', w: 18 }],
    sent: [
      { fill: 'pink', d: shape([1150, 160], [1320, 90], [1240, 220], [1220, 170]), o: 0.9 },
      { line: 'pink', d: 'M 1140 200 q -60 40 -120 10', w: 4, dash: '10 10' },
      words('pink', 'SENT', 1250, 280, 44),
    ],
  },

  street: {
    sky: [
      { fill: 'blue', d: rect(0, 0, W, 300), o: 0.3 },
      { fill: 'yellow', d: circle(1300, 90, 60), o: 1 },
    ],
    houses: [
      ...HOUSE_INKS.map(([fill, o], k): Item => ({ fill, d: Array.from({ length: 8 }, (_, i) => i).filter((i) => i % 5 === k).map((i) => rect(i * 200, 170, 200, 310)).join(' '), o })),
      { fill: 'black', d: `${rect(0, 140, W, 34)} ${[100, 500, 900, 1300].map((x) => rect(x, 100, 50, 40)).join(' ')}`, o: 0.6 },
      { fill: 'federal', d: Array.from({ length: 8 }, (_, i) => `${rect(i * 200 + 30, 210, 55, 70)} ${rect(i * 200 + 115, 210, 55, 70)} ${rect(i * 200 + 30, 330, 75, 80)}`).join(' '), o: 0.45 },
      ...DOOR_INKS.map((fill, k): Item => ({ fill, d: Array.from({ length: 8 }, (_, i) => i).filter((i) => i % 5 === k).map((i) => rect(i * 200 + 125, 330, 50, 150)).join(' '), o: 0.85 })),
    ],
    road: [
      { fill: 'black', d: rect(0, 480, W, 34), o: 0.15 },
      { fill: 'black', d: rect(0, 514, W, 146), o: 0.55 },
      { fill: 'paper', d: Array.from({ length: 8 }, (_, i) => rect(40 + i * 200, 584, 110, 8)).join(' ') },
    ],
    mess: [
      { fill: 'teal', d: `${round(40, 410, 70, 90, 8)} ${round(120, 420, 60, 80, 8)}`, o: 0.85 },
      { fill: 'pink', d: shape([200, 500], [470, 490], [490, 520], [190, 526]), o: 0.8 },
      { line: 'pink', d: 'M 600 470 c 60 -60 120 40 40 50 c -80 10 -10 -90 50 -40 c 60 50 -60 70 -70 10 c -10 -60 90 -50 70 10', w: 5 },
      { line: 'teal', d: 'M 610 490 c 70 -40 90 50 20 40 c -60 -10 0 -70 50 -30', w: 5 },
      { fill: 'orange', d: rect(960, 430, 120, 80), o: 0.85 },
      { fill: 'black', d: `${rect(980, 450, 30, 30)} ${circle(980, 516, 12)} ${circle(1060, 516, 12)}`, o: 0.75 },
      { fill: 'black', d: `${circle(1010, 400, 22)} ${circle(1040, 370, 28)} ${circle(1010, 330, 34)}`, o: 0.25, cls: 'rs-sway' },
      { fill: 'yellow', d: `${rect(1240, 430, 260, 130)} ${rect(1500, 470, 80, 90)}`, o: 0.95 },
      { fill: 'black', d: `${circle(1300, 566, 26)} ${circle(1500, 566, 26)} ${rect(1510, 480, 50, 36)}`, o: 0.8 },
    ],
    you_mid: [person(810, 640, 180, 'pink')],
    ...Object.fromEntries(JOBS.map((job, i) => [`note${i}`, note(i, job)])),
    gazebos: GAZEBOS.flatMap((x): Item[] => [
      { line: 'black', d: `${line([x - 120, 420], [x - 120, 520])} ${line([x + 120, 420], [x + 120, 520])}`, w: 6, o: 0.8 },
      { fill: 'pink', d: shape([x - 140, 420], [x, 350], [x + 140, 420]), o: 0.85 },
      { fill: 'teal', d: rect(x - 140, 418, 280, 22), o: 0.85 },
    ]),
    bunting: [...bunting(0, 800, 40, 24, 12), ...bunting(800, W, 40, 24, 12, ['yellow', 'pink', 'teal'])],
    banner_bad: [POLES, CLOTH, ...DOWNHILL('FESTIVLE')],
    banner_neat: [POLES, CLOTH, words('teal', 'WELCOME TO THE LARCH ROAD STREET FESTIVAL', 800, 150, 44)],
    banner_fixed: [
      POLES,
      CLOTH,
      ...DOWNHILL('FESTIV'),
      { fill: 'pink', d: rect(1262, 140, 90, 50), o: 0.35 },
      words('pink', 'AL', 1306, 182, 44),
    ],
    barry: [
      person(200, 650, 190, 'orange'),
      { line: 'orange', d: line([150, 520], [140, 420]), w: 14 },
    ],
    stalls: GAZEBOS.flatMap((x, i): Item[] => [
      { fill: INKS[i + 1], d: rect(x - 110, 470, 220, 50), o: 0.5 },
      { fill: 'black', d: rect(x - 110, 466, 220, 10), o: 0.7 },
      { fill: INKS[i], d: [0, 1, 2, 3].map((j) => circle(x - 70 + j * 46, 452, 14)).join(' '), o: 0.9 },
    ]),
    people: crowd(9, 3),
    crowd: crowd(22, 11, 'rs-bob'),
    band: [
      { fill: 'yellow', d: rect(640, 520, 320, 50), o: 0.95 },
      { fill: 'black', d: `${circle(680, 580, 20)} ${circle(920, 580, 20)}`, o: 0.8 },
      person(700, 520, 120, 'teal', 'rs-bob'),
      person(800, 520, 120, 'green', 'rs-bob'),
      { fill: 'pink', d: ellipse(900, 490, 34, 30), o: 0.9 },
      person(900, 470, 100, 'blue', 'rs-bob'),
      { fill: 'black', d: [[660, 390], [760, 350], [880, 380]].map(([x, y]) => `${ellipse(x, y, 14, 10)} ${rect(x + 10, y - 50, 5, 50)}`).join(' '), o: 0.75, cls: 'rs-sway' },
    ],
    dusk: [{ fill: 'federal', d: rect(0, 0, W, 660), o: 0.55 }],
    lights: [
      { fill: 'paper', d: Array.from({ length: 32 }, (_, i) => circle(25 + i * 50, 48 + 96 * ((i % 16) / 16) * (1 - (i % 16) / 16), 8)).join(' ') },
      { fill: 'yellow', d: Array.from({ length: 32 }, (_, i) => circle(25 + i * 50, 48 + 96 * ((i % 16) / 16) * (1 - (i % 16) / 16), 8)).join(' '), o: 1, cls: 'rs-blink' },
    ],
    dancers: [...crowd(14, 31, 'rs-dance'), person(1120, 640, 170, 'pink', 'rs-dance')],
    cakes_down: [
      { line: 'black', d: `${line([500, 520], [600, 600], [700, 520])}`, w: 10, o: 0.8 },
      ...cakes(DROPPED),
      words('pink', 'CRASH!', 600, 430, 60, 'rs-pop'),
    ],
    cakes_saved: [
      { fill: 'black', d: `${rect(480, 520, 240, 10)} ${rect(490, 530, 8, 90)} ${rect(702, 530, 8, 90)}`, o: 0.8 },
      ...cakes([520, 570, 620, 670].map((x): Pt => [x, 512])),
      { fill: 'paper', d: shape([520, 380], [700, 372], [706, 450], [524, 456]) },
      words('pink', 'RUSTIC', 612, 430, 44),
    ],
    ade: [person(780, 640, 175, 'teal')],
    you_cakes: [person(420, 640, 180, 'pink')],
    you_run: [
      person(1180, 640, 180, 'pink'),
      { line: 'pink', d: [0, 1, 2].map((i) => line([1050, 520 + i * 30], [1110, 520 + i * 30])).join(' '), w: 6, o: 0.7 },
    ],
  },

  fridge: {
    door: [
      { fill: 'teal', d: rect(0, 0, W, 660), o: 0.25 },
      { fill: 'paper', d: round(260, 20, 1080, 700, 30) },
      { line: 'teal', d: round(260, 20, 1080, 700, 30), w: 8, o: 0.5 },
      { fill: 'black', d: round(1280, 120, 22, 260, 10), o: 0.6 },
    ],
    calendar: [
      { fill: 'pink', d: rect(340, 80, 420, 70), o: 0.85 },
      words('paper', 'JULY', 550, 132, 46),
      { line: 'black', d: `${rect(340, 150, 420, 400)} ${[1, 2, 3, 4, 5, 6].map((i) => line([340 + i * 60, 150], [340 + i * 60, 550])).join(' ')} ${[1, 2, 3, 4].map((i) => line([340, 150 + i * 80], [760, 150 + i * 80])).join(' ')}`, w: 3, o: 0.5 },
      { line: 'pink', d: ellipse(670, 350, 34, 30), w: 6 },
      { fill: 'yellow', d: circle(550, 70, 20), o: 1 },
    ],
    photo: [
      { fill: 'black', d: shape([840, 120], [1150, 140], [1130, 480], [820, 462]), o: 0.12 },
      { fill: 'blue', d: shape([858, 140], [1132, 158], [1118, 380], [844, 364]), o: 0.35 },
      ...bunting(850, 1130, 170, 14, 7),
      { fill: 'pink', d: `${body(920, 372, 90)} ${body(1050, 380, 90)}`, o: 0.6 },
      { fill: 'teal', d: body(990, 376, 110), o: 0.6 },
      { fill: 'orange', d: circle(990, 100, 18), o: 1 },
    ],
    flyer: [
      { fill: 'black', d: shape([1180, 260], [1300, 250], [1310, 430], [1190, 440]), o: 0.1 },
      { fill: 'yellow', d: circle(1244, 310, 34), o: 1 },
      words('teal', 'LARCH RD', 1246, 390, 30),
      { fill: 'green', d: circle(1244, 250, 16), o: 1 },
    ],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

//each mark multiplies onto what's under it, like ink on paper, and paper knocks back out. The blend sits on the group
//that fades in, since that group is what composites onto the page
function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g>
      {items.map((item, i) => {
        let mark;
        let ink: Colour;
        if ('text' in item) {
          ink = item.c;
          mark = (
            <text x={item.x} y={item.y} textAnchor="middle" fill={C[item.c]} style={{ ...styles.type, fontSize: item.size }}>
              {item.text}
            </text>
          );
        } else if ('line' in item) {
          ink = item.line;
          mark = (
            <path
              d={item.d}
              fill="none"
              stroke={C[item.line]}
              strokeWidth={item.w ?? 6}
              strokeOpacity={item.o ?? 1}
              strokeDasharray={item.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        } else {
          ink = item.fill;
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 1} />;
        }
        const [dx, dy] = SHIFT[ink];
        return (
          <g key={i} className="rs-in" style={{ animationDelay: `${start + i * GAP}s`, mixBlendMode: ink === 'paper' ? 'normal' : 'multiply' }}>
            <g className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
              <g transform={`translate(${dx} ${dy})`}>{mark}</g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page fades it in afresh
  starts: Record<string, number>; //when each part began fading in, in seconds after it appeared
}

//new parts fade in one after another; on a fresh page they wait for the old one to fade out
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t += ART[page][part].length * GAP + 0.1;
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
    <g className={leaving ? 'rs-leave' : undefined}>
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
  hall: new URL('./sounds/hall.m4a', import.meta.url).href,
  pub: new URL('./sounds/pub.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  clock: new URL('./sounds/clock.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  setup: new URL('./sounds/setup.m4a', import.meta.url).href,
  generator: new URL('./sounds/generator.m4a', import.meta.url).href,
  crowd: new URL('./sounds/crowd.m4a', import.meta.url).href,
  carnival: new URL('./sounds/carnival.m4a', import.meta.url).href,
  fridge: new URL('./sounds/fridge.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//murmur in the hall, the pub, a quiet house with a clock at midnight, and the street from setting up to the party
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  flyer: { street: 0.4 },
  hall: { hall: 0.8 },
  chat: { room: 0.7, clock: 0.25 },
  pub: { pub: 0.8 },
  desk: { room: 0.6, clock: 0.6 },
  street: { street: 0.7, setup: 0.5 },
  fridge: { fridge: 0.6, clock: 0.2 },
};

const ONE_SHOTS: Record<string, OneShot> = {
  chat: { src: new URL('./sounds/ping.m4a', import.meta.url).href, volume: 0.5, delay: 0.3 },
  cakes_down: { src: new URL('./sounds/crash.m4a', import.meta.url).href, volume: 0.8, delay: 0.3 },
  evening: { src: new URL('./sounds/applause.m4a', import.meta.url).href, volume: 0.4, delay: 1.5 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Riso({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Committee has no cue for the animation "${animation}"`);
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
    const cue = cues[active];
    sound.current?.mix(cue.mix ?? MIX[cue.page]);
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { now, prev } = view;
  const { card } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <pattern id="rs-grain" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={C.paper} />
            <circle cx="5.5" cy="5" r="0.7" fill={C.paper} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={C.paper} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
        <rect width={W} height={H} fill="url(#rs-grain)" opacity={0.45} pointerEvents="none" />
      </svg>

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
.rs-in {
  opacity: 0;
  animation: rs-in 0.5s ease-out forwards;
}
@keyframes rs-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.rs-leave {
  animation: rs-leave 0.5s ease forwards;
}
@keyframes rs-leave {
  to { opacity: 0; }
}
.rs-blink {
  animation: rs-blink 1.6s ease-in-out infinite;
}
@keyframes rs-blink {
  50% { opacity: 0.35; }
}
.rs-sway {
  animation: rs-sway 3s ease-in-out infinite;
}
@keyframes rs-sway {
  50% { transform: translateY(-6px); }
}
.rs-bob {
  animation: rs-bob 0.9s ease-in-out infinite;
}
@keyframes rs-bob {
  50% { transform: translateY(-5px); }
}
.rs-dance {
  animation: rs-dance 0.7s ease-in-out infinite alternate;
}
@keyframes rs-dance {
  from { transform: translateX(-6px); }
  to { transform: translate(6px, -8px); }
}
.rs-pop {
  animation: rs-pop 0.4s ease-out both;
}
@keyframes rs-pop {
  from { transform: scale(0.4); }
  70% { transform: scale(1.15); }
  to { transform: none; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.paper,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: 'var(--font-comic)',
    letterSpacing: 1,
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: C.teal,
    fontFamily: 'var(--font-comic)',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.paper,
    background: C.pink,
    padding: '4px 14px',
  },
  name: {
    fontSize: 120,
    letterSpacing: 4,
    lineHeight: 1,
    mixBlendMode: 'multiply',
    textShadow: `4px 3px 0 ${C.pink}`,
  },
};

export default Riso;
