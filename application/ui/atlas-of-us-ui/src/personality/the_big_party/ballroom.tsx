import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Big Party is a dark ballroom under a mirror ball. Everyone is a flat silhouette cut from coloured card, lit by
// pools of pink, teal and gold stage light, with the mirror ball's flecks drifting over everything. The player is
// always the gold one. A cue names a page and the parts of it to show: parts already on the page stay put, new ones
// fade in after them, and turning to a new page fades the old one out. Lights-up at the end is a pale wash over it all.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep to the top two thirds,
// clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  night: '#1a1230',
  wall: '#2c1e47',
  side: '#241940',
  floor: '#221838',
  shadow: '#0d0918',
  plum: '#4a3270',
  wine: '#7a2f63',
  brick: '#5a2a3a',
  gold: '#ffbe4d',
  pink: '#ff5c8a',
  teal: '#3fd0cf',
  cream: '#fbeedb',
  green: '#4fe08f',
};
type Colour = keyof typeof C;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'invite' | 'street' | 'steps' | 'room' | 'floor' | 'corner' | 'stage' | 'corridor' | 'keepsakes';

interface Cue {
  page: Page;
  parts: string[]; //faded in in this order
  light?: 'up'; //the big lights on at the end of the night
  card?: [kicker: string, name: string];
  mix?: Partial<Record<Bed, number>>; //in place of the page's sound, when the room changes under the same picture
}

const ROOM = ['hall', 'stage', 'bar', 'crowd', 'dani'];
const STAGE = ['stage', 'band', 'crowd'];
const CORNER = ['room', 'priya'];

const cues: Record<string, Cue> = {
  title_card: { page: 'invite', parts: ['confetti', 'balloons'], card: ['Dani turns forty', 'The Big Party'] },
  invite: { page: 'invite', parts: ['confetti', 'balloons', 'card'] },
  street: { page: 'street', parts: ['sky', 'building'] },
  stairs: { page: 'street', parts: ['sky', 'building', 'sign', 'you'] },
  room: { page: 'room', parts: [...ROOM, 'you_door'] },
  room_group: { page: 'room', parts: [...ROOM, 'group', 'you_group'] },
  room_dani: { page: 'room', parts: [...ROOM, 'you_dani'] },
  room_wall: { page: 'room', parts: [...ROOM, 'you_wall'] },
  outside: { page: 'steps', parts: ['sky', 'steps', 'you'] },
  room_film: { page: 'room', parts: [...ROOM, 'film'] },
  room_bar: { page: 'room', parts: [...ROOM, 'film', 'bar_man'] },
  room_all: { page: 'room', parts: [...ROOM, 'film', 'bar_man', 'sparkles'] },
  band_on: { page: 'room', parts: ['hall', 'stage', 'band', 'bar', 'crowd', 'sparkles'], mix: { crowd: 0.55, band: 0.4 } },
  dance: { page: 'floor', parts: ['floor', 'sparkles', 'dancers'] },
  dancing: { page: 'floor', parts: ['floor', 'sparkles', 'dancers', 'you'] },
  corner_priya: { page: 'corner', parts: CORNER },
  corner_man: { page: 'corner', parts: [...CORNER, 'man'] },
  priya: { page: 'corner', parts: [...CORNER, 'you_priya'] },
  leonard: { page: 'corner', parts: [...CORNER, 'leonard'] },
  stage: { page: 'stage', parts: STAGE },
  spotlight: { page: 'stage', parts: [...STAGE, 'spotlight'] },
  on_stage: { page: 'stage', parts: [...STAGE, 'you_up'] },
  in_the_light: { page: 'stage', parts: [...STAGE, 'you_up', 'beam'] },
  others_up: { page: 'stage', parts: [...STAGE, 'others'] },
  queue: { page: 'corridor', parts: ['corridor', 'queue'] },
  lights_up: { page: 'room', parts: ['hall', 'stage', 'bar', 'mess', 'stragglers'], light: 'up', mix: { crowd: 0.25 } },
  keepsakes: { page: 'keepsakes', parts: ['wristband', 'photos', 'popper'] },
  goodbye: { page: 'invite', parts: ['confetti', 'balloons'], card: ['Happy birthday, Dani', 'The Big Party'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: flat shapes, lines, type, and soft pools of stage light
type Item =
  | { fill: Colour; d: string; o?: number; glow?: boolean; cls?: string }
  | { line: Colour; d: string; w?: number; o?: number; glow?: boolean; cls?: string }
  | { text: string; c: Colour; x: number; y: number; size: number; glow?: boolean }
  | { pool: Colour; x: number; y: number; rx: number; ry: number; o?: number; cls?: string };

const GAP = 0.06; //seconds between one item fading in and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const pill = (x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  return `M ${x + r} ${y} H ${x + w - r} a ${r} ${r} 0 0 1 0 ${h} H ${x + r} a ${r} ${r} 0 0 1 0 ${-h} Z`;
};
const words = (c: Colour, text: string, x: number, y: number, size: number, glow = false): Item => ({ c, text, x, y, size, glow });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a cut-out person: a round head on a rounded body, feet at (x, y)
function body(x: number, y: number, h: number) {
  const r = h * 0.15;
  const top = y - h + 2 * r + 5;
  return `M ${x - h * 0.21} ${y} Q ${x - h * 0.23} ${top} ${x} ${top} Q ${x + h * 0.23} ${top} ${x + h * 0.21} ${y} Z ${circle(x, y - h + r, r)}`;
}
const person = (x: number, y: number, h: number, fill: Colour, cls?: string): Item => ({ fill, d: body(x, y, h), cls });
//both arms up, for dancing
const arms = (x: number, y: number, h: number, c: Colour, cls?: string): Item => ({
  line: c,
  d: `${line([x - h * 0.15, y - h * 0.62], [x - h * 0.3, y - h * 0.98])} ${line([x + h * 0.15, y - h * 0.62], [x + h * 0.3, y - h * 0.98])}`,
  w: h * 0.08,
  cls,
});

//rows of people, smaller towards the back, one path per colour. gap leaves room for someone in the front row
function crowd(rows: [y: number, scale: number][], from: number, to: number, gap?: [number, number], cls?: string): Item[] {
  const fills: Colour[] = ['shadow', 'plum', 'wine'];
  const paths: Partial<Record<Colour, string>> = {};
  rows.forEach(([y, s], row) => {
    for (let i = 0, x = from + row * 17; x < to; i++, x += (60 + rand(i + row * 40) * 40) * s) {
      if (gap && row === rows.length - 1 && x > gap[0] && x < gap[1]) continue;
      const fill = fills[Math.floor(rand(i * 3 + row) * 3)];
      paths[fill] = `${paths[fill] ?? ''} ${body(x, y - rand(i + row * 9) * 10 * s, (140 + rand(i * 5 + row) * 40) * s)}`;
    }
  });
  return (Object.entries(paths) as [Colour, string][]).map(([fill, d]): Item => ({ fill, d, cls }));
}

//the mirror ball's flecks of light, scattered over the whole picture
const SPARKLES: Item[] = (['cream', 'pink', 'teal', 'gold'] as Colour[]).map((fill, k) => ({
  fill,
  d: Array.from({ length: 16 }, (_, i) => rect(rand(i + k * 50) * W, rand(i * 7 + k * 13) * 620, 7, 7)).join(' '),
  o: 0.85,
  cls: k % 2 ? 'bp-drift' : 'bp-drift-back',
}));

function mirrorBall(x: number, y: number, r: number): Item[] {
  const chords = [-0.66, -0.33, 0, 0.33, 0.66].map((k) => {
    const half = r * Math.sqrt(1 - k * k);
    return line([x - half, y + k * r], [x + half, y + k * r]);
  });
  return [
    { line: 'cream', d: line([x, 0], [x, y - r]), w: 3, o: 0.6 },
    { fill: 'cream', d: circle(x, y, r), o: 0.75 },
    { line: 'plum', d: `${chords.join(' ')} ${ellipse(x, y, r * 0.35, r)} ${ellipse(x, y, r * 0.72, r)}`, w: 2 },
    { fill: 'cream', d: `${circle(x - r * 0.4, y - r * 0.4, 6)} ${circle(x + r * 0.3, y + r * 0.1, 4)}`, glow: true, cls: 'bp-twinkle' },
  ];
}

//flags hung along a string
function bunting(from: Pt, mid: Pt, to: Pt, count: number): Item[] {
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [u * u * from[0] + 2 * u * t * mid[0] + t * t * to[0], u * u * from[1] + 2 * u * t * mid[1] + t * t * to[1]];
  };
  const flags: Partial<Record<Colour, string>> = {};
  const fills: Colour[] = ['pink', 'gold', 'teal'];
  for (let i = 0; i < count; i++) {
    const [x, y] = at((i + 0.5) / count);
    const fill = fills[i % 3];
    flags[fill] = `${flags[fill] ?? ''} ${shape([x - 15, y], [x + 15, y], [x, y + 34])}`;
  }
  return [
    { line: 'cream', d: `M ${from.join(' ')} Q ${mid.join(' ')} ${to.join(' ')}`, w: 2, o: 0.5 },
    ...(Object.entries(flags) as [Colour, string][]).map(([fill, d]): Item => ({ fill, d, o: 0.85, cls: 'bp-sway' })),
  ];
}

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const BALLOONS: [x: number, y: number, r: number, fill: Colour][] = [
  [250, 250, 70, 'pink'],
  [400, 170, 60, 'teal'],
  [1220, 190, 70, 'gold'],
  [1370, 280, 60, 'pink'],
  [1110, 340, 48, 'teal'],
];
const UPPER_WINDOWS = [360, 560, 920, 1120];
const PARQUET = Array.from({ length: 17 }, (_, i) => line([i * 100, 440], [800 + (i * 100 - 800) * 2.2, H])).join(' ');
const TILES = (['pink', 'teal', 'gold'] as Colour[]).map((fill, k): Item => {
  const d = [];
  for (let row = 0; row < 4; row++) {
    const y0 = 400 + row * 60;
    const w0 = 1100 + row * 180;
    const w1 = w0 + 180;
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 3 !== k) continue;
      const x = (w: number, c: number) => 800 - w / 2 + (w / 8) * c;
      d.push(shape([x(w0, col), y0], [x(w0, col + 1), y0], [x(w1, col + 1), y0 + 60], [x(w1, col), y0 + 60]));
    }
  }
  return { fill, d: d.join(' '), o: 0.4, cls: `bp-flicker-${k}` };
});
const DANCERS: [x: number, y: number, h: number, fill: Colour][] = [
  [180, 520, 150, 'plum'],
  [330, 560, 170, 'wine'],
  [480, 500, 130, 'shadow'],
  [600, 590, 180, 'plum'],
  [1000, 590, 180, 'wine'],
  [1120, 505, 130, 'plum'],
  [1260, 560, 170, 'shadow'],
  [1420, 520, 150, 'wine'],
];

const ART: Record<Page, Record<string, Item[]>> = {
  invite: {
    confetti: (['pink', 'teal', 'gold', 'cream'] as Colour[]).map((fill, k) => ({
      fill,
      d: Array.from({ length: 14 }, (_, i) => rect(rand(i + k * 30) * W, rand(i * 3 + k * 7) * 640, 10, 6)).join(' '),
      o: 0.8,
      cls: 'bp-twinkle',
    })),
    balloons: BALLOONS.flatMap(([x, y, r, fill]): Item[] => [
      { line: 'cream', d: `M ${x} ${y + r} q 24 80 -6 150 t 10 130`, w: 2, o: 0.6, cls: 'bp-float' },
      { fill, d: `${ellipse(x, y, r * 0.85, r)} ${shape([x - 9, y + r + 10], [x + 9, y + r + 10], [x, y + r - 4])}`, o: 0.95, cls: 'bp-float' },
      { fill: 'cream', d: ellipse(x - r * 0.35, y - r * 0.4, r * 0.14, r * 0.24), o: 0.5, cls: 'bp-float' },
    ]),
    card: [
      { fill: 'cream', d: shape([550, 140], [1050, 132], [1056, 512], [556, 520]), o: 1 },
      { line: 'pink', d: shape([572, 160], [1030, 153], [1035, 492], [577, 499]), w: 4 },
      words('teal', "YOU'RE INVITED", 805, 210, 30),
      words('pink', '40', 805, 400, 200),
      words('plum', "DANI'S BIG ONE", 805, 448, 32),
      words('wine', 'SAT · 8PM · THE OLD BALLROOM', 805, 482, 20),
    ],
  },

  street: {
    sky: [
      { fill: 'cream', d: Array.from({ length: 40 }, (_, i) => circle(rand(i) * W, rand(i + 99) * 300, 1.5 + rand(i + 7) * 2)).join(' '), o: 0.7, cls: 'bp-twinkle' },
      { fill: 'cream', d: circle(1420, 100, 44), o: 0.9 },
    ],
    building: [
      { fill: 'brick', d: rect(300, 130, 1000, 480), o: 1 },
      { fill: 'wine', d: rect(280, 112, 1040, 26), o: 1 },
      words('gold', 'THE OLD BALLROOM', 800, 184, 34),
      { fill: 'gold', d: UPPER_WINDOWS.map((x) => `M ${x} 380 V 270 A 60 60 0 0 1 ${x + 120} 270 V 380 Z`).join(' '), o: 0.85, glow: true },
      { fill: 'gold', d: circle(800, 290, 48), o: 0.85, glow: true },
      { fill: 'shadow', d: UPPER_WINDOWS.map((x, i) => `${body(x + 40, 381, 90 + rand(i) * 20)} ${body(x + 85, 381, 80 + rand(i + 4) * 20)}`).join(' '), cls: 'bp-bob' },
      { fill: 'teal', d: `${rect(340, 450, 330, 120)} ${rect(930, 450, 330, 120)}`, o: 0.45, glow: true },
      { fill: 'cream', d: [380, 420, 460, 1000, 1040].map((x) => `${ellipse(x, 548, 9, 20)} ${circle(x, 522, 6)}`).join(' '), o: 0.6 },
      words('pink', 'BOWL', 505, 432, 60, true),
      { fill: 'gold', d: rect(740, 450, 120, 160), o: 0.95, glow: true },
      { fill: 'floor', d: rect(0, 610, W, 60), o: 1 },
      { pool: 'gold', x: 800, y: 625, rx: 260, ry: 50, o: 0.7 },
    ],
    sign: [
      { line: 'cream', d: `${line([665, 610], [690, 520])} ${line([715, 610], [690, 520])}`, w: 4 },
      { fill: 'cream', d: rect(645, 515, 90, 70), o: 1 },
      words('wine', 'BAND', 690, 543, 20),
      words('pink', '8:30', 690, 572, 24),
    ],
    you: [person(935, 612, 170, 'gold')],
  },

  steps: {
    sky: [{ fill: 'cream', d: Array.from({ length: 30 }, (_, i) => circle(1100 + rand(i) * 500, rand(i + 50) * 250, 1.5 + rand(i + 3) * 2)).join(' '), o: 0.7, cls: 'bp-twinkle' }],
    steps: [
      { fill: 'brick', d: rect(0, 60, 1100, 560), o: 1 },
      { fill: 'gold', d: rect(150, 110, 200, 120), o: 0.85, glow: true },
      { fill: 'shadow', d: `${body(200, 231, 90)} ${body(260, 231, 100)} ${body(310, 231, 80)}`, cls: 'bp-bob' },
      { fill: 'gold', d: rect(420, 240, 200, 320), o: 0.9, glow: true },
      { line: 'wine', d: [0, 1, 2, 3, 4, 5].map((i) => line([440, 300 + i * 45], [600, 300 + i * 45])).join(' '), w: 5, o: 0.6 },
      { fill: 'plum', d: `${rect(380, 560, 280, 18)} ${rect(360, 578, 320, 18)} ${rect(340, 596, 360, 18)}`, o: 1 },
      { fill: 'floor', d: rect(0, 612, W, 60), o: 1 },
      { line: 'shadow', d: `${line([1300, 612], [1300, 210])} M 1300 210 q 0 -30 40 -30`, w: 10 },
      { fill: 'cream', d: rect(1325, 178, 40, 20), o: 0.95, glow: true },
      { pool: 'gold', x: 1345, y: 260, rx: 170, ry: 170, o: 0.5 },
      { pool: 'gold', x: 520, y: 600, rx: 260, ry: 60, o: 0.6 },
    ],
    you: [person(770, 612, 168, 'gold')],
  },

  room: {
    hall: [
      { fill: 'wall', d: rect(0, 0, W, 440), o: 1 },
      { fill: 'night', d: [640, 800, 960].map((x) => `M ${x - 55} 360 V 175 A 55 55 0 0 1 ${x + 55} 175 V 360 Z`).join(' '), o: 1 },
      { line: 'teal', d: [640, 800, 960].map((x) => line([x - 30, 330], [x + 20, 200])).join(' '), w: 3, o: 0.35 },
      { fill: 'pink', d: pill(110, 28, 440, 58), o: 0.95 },
      words('cream', 'HAPPY 40TH, DANI!', 330, 69, 32),
      ...bunting([560, 40], [1080, 150], [W, 40], 16),
      { fill: 'floor', d: rect(0, 440, W, H - 440), o: 1 },
      { line: 'plum', d: PARQUET, w: 2, o: 0.5 },
      ...mirrorBall(800, 95, 40),
    ],
    stage: [
      { fill: 'wine', d: rect(40, 130, 460, 190), o: 0.8 },
      { line: 'shadow', d: [100, 170, 240, 310, 380, 450].map((x) => line([x, 135], [x, 318])).join(' '), w: 3, o: 0.5 },
      { fill: 'shadow', d: `${rect(80, 250, 60, 68)} ${rect(430, 250, 54, 68)}`, o: 1 },
      { fill: 'plum', d: `${circle(270, 286, 32)} ${ellipse(220, 262, 20, 8)} ${ellipse(320, 262, 20, 8)}`, o: 1 },
      { line: 'cream', d: `${line([180, 318], [180, 250])} ${line([360, 318], [360, 250])}`, w: 3, o: 0.5 },
      { fill: 'plum', d: rect(40, 318, 460, 14), o: 1 },
      { fill: 'shadow', d: rect(40, 332, 460, 108), o: 1 },
    ],
    band: [
      { pool: 'pink', x: 180, y: 260, rx: 110, ry: 150, o: 0.8, cls: 'bp-flicker-0' },
      { pool: 'teal', x: 370, y: 260, rx: 110, ry: 150, o: 0.8, cls: 'bp-flicker-1' },
      person(180, 320, 120, 'wine', 'bp-bob'),
      person(270, 300, 95, 'shadow', 'bp-bob-off'),
      person(370, 320, 120, 'plum', 'bp-bob'),
    ],
    bar: [
      { fill: 'gold', d: rect(1200, 270, 380, 8), o: 0.5 },
      { fill: 'teal', d: [1220, 1260, 1300, 1420, 1460, 1520].map((x, i) => `${rect(x, 270 - 50 - (i % 2) * 14, 18, 50 + (i % 2) * 14)} ${rect(x + 5, 270 - 66 - (i % 2) * 14, 8, 18)}`).join(' '), o: 0.55 },
      person(1390, 470, 150, 'teal'),
      { fill: 'wine', d: rect(1180, 440, 420, 130), o: 1 },
      { fill: 'gold', d: rect(1170, 430, 440, 14), o: 0.8 },
    ],
    crowd: crowd(
      [
        [470, 0.5],
        [510, 0.65],
        [560, 0.85],
        [612, 1],
      ],
      540,
      1170,
      [700, 900],
    ),
    dani: [
      { pool: 'pink', x: 820, y: 420, rx: 120, ry: 70, o: 0.8 },
      { fill: 'shadow', d: [740, 775, 865, 900].map((x, i) => body(x, 474 + (i % 2) * 6, 80)).join(' ') },
      person(820, 470, 95, 'pink'),
    ],
    you_door: [person(800, 640, 190, 'gold')],
    group: [person(320, 625, 175, 'wine'), person(520, 630, 180, 'plum'), person(600, 610, 150, 'shadow')],
    you_group: [person(420, 640, 180, 'gold')],
    you_dani: [person(800, 600, 150, 'gold')],
    you_wall: [person(1110, 630, 180, 'gold'), { fill: 'cream', d: `${shape([1140, 520], [1166, 520], [1160, 548], [1146, 548])} ${rect(1151, 548, 4, 18)}`, o: 0.9 }],
    film: [
      { fill: 'cream', d: ellipse(380, 590, 130, 26), o: 0.75 },
      person(280, 600, 120, 'shadow'),
      person(480, 600, 120, 'plum'),
      person(330, 575, 100, 'wine'),
      person(430, 575, 100, 'shadow'),
      { fill: 'cream', d: `${pill(410, 400, 170, 60)} ${shape([440, 455], [470, 455], [430, 480])}`, o: 0.95 },
      words('pink', '1999!!', 495, 442, 32),
    ],
    bar_man: [person(1290, 630, 180, 'plum'), { line: 'plum', d: line([1312, 520], [1345, 440]), w: 15 }],
    sparkles: SPARKLES,
    mess: [
      { fill: 'pink', d: `${ellipse(300, 620, 30, 24)} ${ellipse(980, 640, 26, 20)}`, o: 0.8 },
      { fill: 'teal', d: `${ellipse(620, 600, 24, 20)} ${ellipse(1460, 620, 28, 22)}`, o: 0.8 },
      { fill: 'cream', d: [420, 470, 760, 840, 1100].map((x, i) => rect(x, 590 + (i % 3) * 18, 14, 18)).join(' '), o: 0.7 },
      { line: 'gold', d: 'M 500 640 q 40 -20 80 0 t 80 0 M 1150 600 q 30 -16 60 0 t 60 0', w: 4, o: 0.8 },
    ],
    stragglers: [
      person(700, 620, 170, 'wine'),
      person(770, 625, 160, 'plum'),
      person(1300, 610, 165, 'shadow'),
      { line: 'cream', d: line([1330, 520], [1380, 612]), w: 6, o: 0.8 },
      { fill: 'cream', d: shape([1365, 605], [1405, 600], [1410, 620], [1370, 622]), o: 0.8 },
    ],
  },

  floor: {
    floor: [
      { fill: 'wall', d: rect(0, 0, W, 400), o: 1 },
      { fill: 'floor', d: rect(0, 400, W, H - 400), o: 1 },
      ...TILES,
      ...mirrorBall(800, 110, 50),
      { pool: 'pink', x: 300, y: 380, rx: 260, ry: 200, o: 0.5, cls: 'bp-flicker-0' },
      { pool: 'teal', x: 1300, y: 380, rx: 260, ry: 200, o: 0.5, cls: 'bp-flicker-1' },
    ],
    sparkles: SPARKLES,
    dancers: DANCERS.flatMap(([x, y, h, fill], i): Item[] => {
      const cls = i % 2 ? 'bp-bob' : 'bp-bob-off';
      return i % 3 ? [arms(x, y, h, fill, cls), person(x, y, h, fill, cls)] : [person(x, y, h, fill, cls)];
    }),
    you: [arms(800, 640, 190, 'gold', 'bp-bob'), person(800, 640, 190, 'gold', 'bp-bob')],
  },

  corner: {
    room: [
      { fill: 'wall', d: shape([0, 0], [1000, 0], [1000, 450], [0, 520]), o: 1 },
      { fill: 'side', d: shape([1000, 0], [W, 0], [W, 600], [1000, 450]), o: 1 },
      { fill: 'floor', d: shape([0, 520], [1000, 450], [W, 600], [W, H], [0, H]), o: 1 },
      { pool: 'pink', x: 200, y: 380, rx: 240, ry: 160, o: 0.45, cls: 'bp-flicker-0' },
      ...crowd(
        [
          [470, 0.45],
          [500, 0.55],
        ],
        20,
        380,
        undefined,
        'bp-bob',
      ),
      { fill: 'shadow', d: shape([1180, 230], [1320, 210], [1320, 575], [1180, 515]), o: 1 },
      { line: 'plum', d: line([1200, 380], [1300, 372]), w: 6 },
      { fill: 'green', d: rect(1195, 150, 110, 40), o: 0.9, glow: true },
      words('night', 'EXIT', 1250, 180, 26),
      { pool: 'green', x: 1250, y: 175, rx: 140, ry: 70, o: 0.5 },
      { fill: 'plum', d: `${rect(500, 520, 130, 16)} ${rect(612, 410, 16, 126)} ${rect(505, 536, 10, 70)} ${rect(615, 536, 10, 70)}`, o: 1 },
      { fill: 'cream', d: `${ellipse(720, 505, 50, 12)} ${rect(716, 505, 8, 100)}`, o: 0.5 },
      { fill: 'teal', d: rect(708, 470, 18, 32), o: 0.7 },
    ],
    priya: [{ fill: 'teal', d: body(560, 528, 120), o: 0.75 }],
    man: [person(1130, 610, 185, 'plum'), { line: 'cream', d: 'M 1118 470 l 12 40 l 12 -40', w: 3, o: 0.7 }, { fill: 'cream', d: ellipse(1172, 515, 26, 7), o: 0.9 }],
    you_priya: [person(440, 612, 175, 'gold')],
    leonard: [
      person(1130, 610, 185, 'plum'),
      { line: 'cream', d: 'M 1118 470 l 12 40 l 12 -40', w: 3, o: 0.7 },
      person(1030, 612, 180, 'gold'),
      { fill: 'cream', d: ellipse(1060, 515, 26, 7), o: 0.9 },
    ],
  },

  stage: {
    stage: [
      { fill: 'night', d: rect(200, 70, 1200, 410), o: 1 },
      { line: 'plum', d: line([200, 105], [1400, 105]), w: 10 },
      { fill: 'shadow', d: [360, 600, 1000, 1240].map((x) => rect(x - 20, 106, 40, 30)).join(' '), o: 1 },
      { fill: 'wine', d: `${shape([0, 0], [270, 0], [200, 640], [0, 640])} ${shape([W, 0], [1330, 0], [1400, 640], [W, 640])}`, o: 1 },
      { line: 'shadow', d: [60, 130, 200, 1400, 1470, 1540].map((x) => line([x, 0], [x + (x < 800 ? -10 : 10), 640])).join(' '), w: 4, o: 0.5 },
      { fill: 'wine', d: `M 0 0 H ${W} V 60 ${Array.from({ length: 16 }, (_, i) => `Q ${W - i * 100 - 50} 100 ${W - (i + 1) * 100} 60`).join(' ')} Z`, o: 1 },
      { fill: 'shadow', d: `${rect(270, 380, 90, 92)} ${rect(1240, 380, 90, 92)}`, o: 1 },
      { fill: 'plum', d: rect(160, 472, 1280, 22), o: 1 },
      { fill: 'shadow', d: rect(160, 494, 1280, 160), o: 1 },
      { pool: 'pink', x: 560, y: 300, rx: 200, ry: 260, o: 0.6, cls: 'bp-flicker-0' },
      { pool: 'teal', x: 1040, y: 300, rx: 200, ry: 260, o: 0.6, cls: 'bp-flicker-1' },
    ],
    band: [
      { fill: 'shadow', d: rect(690, 380, 220, 92), o: 1 },
      person(800, 380, 110, 'plum', 'bp-bob-off'),
      { fill: 'cream', d: circle(800, 420, 40), o: 0.25 },
      words('pink', '40', 800, 433, 34),
      person(560, 472, 190, 'plum', 'bp-bob'),
      { fill: 'gold', d: `${ellipse(580, 420, 34, 24)} M 590 410 L 660 360 L 668 368 L 600 420 Z`, o: 0.7, cls: 'bp-bob' },
      person(1040, 472, 190, 'wine', 'bp-bob'),
      { fill: 'teal', d: `${ellipse(1020, 420, 34, 24)} M 1010 410 L 940 350 L 932 358 L 1000 420 Z`, o: 0.7, cls: 'bp-bob' },
      person(800, 472, 200, 'pink'),
      { line: 'cream', d: `${line([850, 472], [850, 340])} ${line([850, 340], [820, 330])}`, w: 4, o: 0.8 },
    ],
    crowd: [
      ...crowd(
        [
          [640, 0.8],
          [690, 1],
        ],
        -20,
        W + 40,
        undefined,
        'bp-bob',
      ),
    ],
    spotlight: [{ fill: 'cream', d: `${shape([1300, -20], [680, 660], [960, 660])}`, o: 0.18, cls: 'bp-sweep' }],
    you_up: [person(1190, 472, 180, 'gold', 'bp-bob'), { line: 'gold', d: `${circle(1240, 360, 20)}`, w: 6, cls: 'bp-bob' }],
    beam: [
      { fill: 'cream', d: shape([1300, -20], [1080, 480], [1300, 480]), o: 0.2 },
      { pool: 'cream', x: 1190, y: 478, rx: 130, ry: 22, o: 0.8 },
    ],
    others: [
      person(380, 472, 170, 'teal', 'bp-bob'),
      person(470, 472, 180, 'wine', 'bp-bob-off'),
      person(1150, 472, 175, 'plum', 'bp-bob'),
      person(1235, 472, 165, 'teal', 'bp-bob-off'),
      person(1320, 472, 95, 'wine'),
      { line: 'wine', d: line([1265, 470], [1375, 470]), w: 14 },
    ],
  },

  corridor: {
    corridor: [
      { fill: 'wall', d: rect(600, 150, 400, 330), o: 1 },
      { fill: 'side', d: `${shape([0, 0], [600, 150], [600, 480], [0, 680])} ${shape([W, 0], [1000, 150], [1000, 480], [W, 680])}`, o: 1 },
      { fill: 'floor', d: shape([0, 680], [600, 480], [1000, 480], [W, 680], [W, H], [0, H]), o: 1 },
      { fill: 'cream', d: `${shape([520, 20], [1080, 20], [1040, 60], [560, 60])} ${shape([590, 100], [1010, 100], [990, 120], [610, 120])}`, o: 0.8, glow: true, cls: 'bp-flicker-2' },
      { fill: 'shadow', d: rect(740, 260, 120, 220), o: 1 },
      { fill: 'cream', d: rect(700, 180, 200, 44), o: 0.95 },
      words('night', 'RESTROOMS', 800, 212, 28),
      words('teal', '♪', 1180, 300, 70, true),
      words('pink', '♫', 1320, 420, 80, true),
    ],
    queue: [
      person(745, 500, 110, 'shadow'),
      person(700, 525, 130, 'wine'),
      person(630, 560, 160, 'plum'),
      person(530, 600, 190, 'shadow'),
      person(410, 650, 215, 'gold'),
    ],
  },

  keepsakes: {
    wristband: [
      { fill: 'pink', d: pill(240, 260, 440, 74), o: 0.95 },
      { fill: 'cream', d: circle(640, 297, 12), o: 0.9 },
      words('cream', 'DANI · 40 · VIP', 440, 308, 32),
    ],
    photos: [
      { fill: 'cream', d: rect(780, 110, 210, 490), o: 1 },
      { fill: 'night', d: [0, 1, 2].map((i) => rect(796, 126 + i * 156, 178, 140)).join(' '), o: 1 },
      { fill: 'plum', d: [0, 1, 2].map((i) => body(850, 266 + i * 156, 110)).join(' ') },
      { fill: 'gold', d: [0, 1, 2].map((i) => body(920, 266 + i * 156, 115)).join(' ') },
    ],
    popper: [
      { fill: 'gold', d: shape([1180, 560], [1230, 420], [1290, 460]), o: 0.95 },
      { line: 'pink', d: 'M 1250 430 q 30 -80 90 -100 t 60 -90', w: 6 },
      { line: 'teal', d: 'M 1260 440 q 70 -40 120 -20 t 90 -40', w: 6 },
      { fill: 'cream', d: Array.from({ length: 12 }, (_, i) => rect(1300 + rand(i) * 220, 200 + rand(i + 20) * 240, 10, 6)).join(' '), o: 0.9, cls: 'bp-twinkle' },
    ],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g>
      {items.map((item, i) => {
        let mark;
        if ('pool' in item) {
          mark = <ellipse cx={item.x} cy={item.y} rx={item.rx} ry={item.ry} fill={`url(#bp-pool-${item.pool})`} opacity={item.o ?? 0.7} style={styles.screen} className={item.cls} />;
        } else if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor="middle" fill={C[item.c]} filter={item.glow ? 'url(#bp-glow)' : undefined} style={{ ...styles.type, fontSize: item.size }}>
              {item.text}
            </text>
          );
        } else if ('line' in item) {
          mark = (
            <path
              d={item.d}
              fill="none"
              stroke={C[item.line]}
              strokeWidth={item.w ?? 6}
              strokeOpacity={item.o ?? 1}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={item.glow ? 'url(#bp-glow)' : undefined}
              className={item.cls}
            />
          );
        } else {
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 0.95} filter={item.glow ? 'url(#bp-glow)' : undefined} className={item.cls} />;
        }
        return (
          <g key={i} className="bp-in" style={{ animationDelay: `${start + i * GAP}s` }}>
            {mark}
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
    <g className={leaving ? 'bp-leave' : undefined}>
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
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  crowd: new URL('./sounds/crowd.m4a', import.meta.url).href,
  band: new URL('./sounds/band.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the party through the walls from outside, the room's chatter before the band, and the band once they start
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  invite: { street: 0.5, band: 0.05 },
  street: { street: 1, crowd: 0.12, band: 0.12 },
  steps: { street: 0.9, band: 0.12 },
  room: { crowd: 0.75, band: 0.08 },
  floor: { band: 0.5, crowd: 0.4 },
  corner: { band: 0.35, crowd: 0.45 },
  stage: { band: 0.55, crowd: 0.5 },
  corridor: { band: 0.2, crowd: 0.2 },
  keepsakes: { street: 0.5 },
};

const CHEER: OneShot = { src: new URL('./sounds/cheer.m4a', import.meta.url).href, volume: 0.6, delay: 0.4 };
const ONE_SHOTS: Record<string, OneShot> = {
  room_wall: { src: new URL('./sounds/pour.m4a', import.meta.url).href, volume: 1, delay: 0.3 },
  band_on: CHEER,
  stage: { src: new URL('./sounds/hooray.m4a', import.meta.url).href, volume: 0.9, delay: 1.5 },
  in_the_light: CHEER,
  others_up: CHEER,
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Ballroom({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Big Party has no cue for the animation "${animation}"`);
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
  const { card, light } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="bp-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {(Object.keys(C) as Colour[]).map((c) => (
            <radialGradient key={c} id={`bp-pool-${c}`}>
              <stop offset="0%" stopColor={C[c]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={C[c]} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        <rect width={W} height={H} fill={C.night} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
      </svg>

      <div style={{ ...styles.lightsUp, opacity: light === 'up' ? 1 : 0 }} />
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
.bp-in {
  opacity: 0;
  animation: bp-in 0.5s ease-out forwards;
}
@keyframes bp-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.bp-leave {
  animation: bp-leave 0.5s ease forwards;
}
@keyframes bp-leave {
  to { opacity: 0; }
}
.bp-float {
  animation: bp-float 4s ease-in-out infinite;
}
@keyframes bp-float {
  50% { transform: translateY(-12px); }
}
/* about the band's tempo, 118 beats a minute */
.bp-bob, .bp-bob-off {
  animation: bp-bob 0.51s ease-in-out infinite;
}
.bp-bob-off {
  animation-delay: -0.25s;
}
@keyframes bp-bob {
  50% { transform: translateY(-7px); }
}
.bp-sway {
  transform-box: fill-box;
  transform-origin: top center;
  animation: bp-sway 3s ease-in-out infinite;
}
@keyframes bp-sway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
.bp-drift {
  animation: bp-drift 14s linear infinite alternate, bp-twinkle 1.7s ease-in-out infinite;
}
.bp-drift-back {
  animation: bp-drift 14s linear infinite alternate-reverse, bp-twinkle 2.3s ease-in-out infinite;
}
@keyframes bp-drift {
  from { transform: translateX(-90px); }
  to { transform: translateX(90px); }
}
.bp-twinkle {
  animation: bp-twinkle 2s ease-in-out infinite;
}
@keyframes bp-twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.bp-flicker-0, .bp-flicker-1, .bp-flicker-2 {
  animation: bp-flicker 1.02s ease-in-out infinite;
}
.bp-flicker-1 {
  animation-delay: -0.34s;
}
.bp-flicker-2 {
  animation-delay: -0.68s;
}
@keyframes bp-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
.bp-sweep {
  transform-box: view-box;
  transform-origin: 1300px 0;
  animation: bp-sweep 2.6s ease-in-out infinite alternate;
}
@keyframes bp-sweep {
  from { transform: rotate(-14deg); }
  to { transform: rotate(16deg); }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.night,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  screen: {
    mixBlendMode: 'screen',
  },
  type: {
    fontFamily: 'var(--font-comic)',
    letterSpacing: 1,
  },
  lightsUp: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    mixBlendMode: 'screen',
    background: 'rgba(255, 244, 220, 0.32)',
    transition: 'opacity 1.5s ease',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: C.cream,
    fontFamily: 'var(--font-comic)',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.pink,
  },
  name: {
    fontSize: 120,
    letterSpacing: 4,
    lineHeight: 1,
    textShadow: `0 0 24px ${C.pink}`,
  },
};

export default Ballroom;
