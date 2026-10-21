import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Night Market is a block print from an old storybook: cream ink on night-blue paper, shapes shaded with fine
// hatching, lanterns in gold, under a sky of stars. The player is always in red, and so is anything they do: a parcel
// bought, footprints walking away, silver handed over. A cue names a page and the parts of it to show: parts already up
// stay put, new ones are printed after them, top to bottom, and turning to a new page lifts the old one off. Everything
// is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep to the top two thirds, clear of the
// text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  paper: '#1b2034',
  ink: '#eee3c4',
  red: '#e0614f',
  gold: '#e3b450',
  blue: '#8aa0c4',
  brown: '#b88d5f',
};
type Ink = Exclude<keyof typeof C, 'paper'>;
const INKS = Object.keys(C).filter((k) => k !== 'paper') as Ink[];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'title' | 'hill' | 'purse' | 'market' | 'stall' | 'game' | 'fountain' | 'coach' | 'road' | 'journal';

interface Cue {
  page: Page;
  parts: string[]; //printed in this order
  card?: [kicker: string, name: string];
}

const STALL = ['lantern', 'counter', 'thing', 'keeper', 'tag'];
const GAME = ['barrel', 'barker', 'crowd', 'cups', 'winner', 'sign'];
const FOUNTAIN = ['moon', 'closed', 'fountain', 'tam', 'cut'];
const COACH = ['sky', 'inn', 'coach', 'horse', 'queue', 'seats'];

const cues: Record<string, Cue> = {
  title_card: { page: 'title', parts: ['plate', 'string', 'moon'], card: ['A town on market night', 'The Night Market'] },
  hill: { page: 'hill', parts: ['moon', 'hills', 'town', 'you'] },
  purse: { page: 'purse', parts: ['pouch', 'ten'] },
  fare: { page: 'purse', parts: ['pouch', 'ten', 'split'] },
  market: { page: 'market', parts: ['lights', 'stalls', 'crowd'] },
  stall: { page: 'stall', parts: ['lantern', 'counter', 'thing'] },
  stall_price: { page: 'stall', parts: STALL },
  stall_bought: { page: 'stall', parts: [...STALL, 'parcel'] },
  stall_later: { page: 'stall', parts: [...STALL, 'midnight', 'steps'] },
  stall_left: { page: 'stall', parts: [...STALL, 'steps'] },
  stall_haggled: { page: 'stall', parts: [...STALL, 'haggle', 'parcel'] },
  barker: { page: 'game', parts: ['barrel', 'barker', 'crowd'] },
  cups: { page: 'game', parts: ['barrel', 'barker', 'crowd', 'cups'] },
  winner: { page: 'game', parts: ['barrel', 'barker', 'crowd', 'cups', 'winner'] },
  rules: { page: 'game', parts: GAME },
  game_found: { page: 'game', parts: [...GAME, 'stake', 'lifted'] },
  game_lost: { page: 'game', parts: [...GAME, 'stake', 'lifted', 'rule3', 'take'] },
  game_rule: { page: 'game', parts: [...GAME, 'rule3'] },
  game_watched: { page: 'game', parts: [...GAME, 'tally', 'plant'] },
  game_passed: { page: 'game', parts: [...GAME, 'steps'] },
  fountain: { page: 'fountain', parts: ['moon', 'closed', 'fountain'] },
  tam: { page: 'fountain', parts: FOUNTAIN },
  tam_purse: { page: 'fountain', parts: [...FOUNTAIN, 'you'] },
  tam_given: { page: 'fountain', parts: [...FOUNTAIN, 'you', 'given'] },
  tam_watch: { page: 'fountain', parts: [...FOUNTAIN, 'you', 'watchman', 'bread'] },
  tam_left: { page: 'fountain', parts: [...FOUNTAIN, 'steps'] },
  coach: { page: 'coach', parts: ['sky', 'inn', 'coach', 'horse', 'breath'] },
  line: { page: 'coach', parts: COACH },
  urgent: { page: 'coach', parts: [...COACH, 'coachman'] },
  line_noon: { page: 'coach', parts: [...COACH, 'coachman', 'noon'] },
  line_aboard: { page: 'coach', parts: [...COACH, 'coachman', 'aboard'] },
  road: { page: 'road', parts: ['sun', 'hills', 'road', 'carriage'] },
  homework: { page: 'journal', parts: ['book', 'rules', 'own'] },
  goodbye: { page: 'title', parts: ['plate', 'string', 'moon'], card: ['Home by nightfall', 'The Night Market'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: printed lines, hatched shapes, solid shapes (paper, to cover what's behind) and lettering.
//t is an svg transform, for anything printed at an angle
type Item =
  | { line: Ink; d: string; w?: number; o?: number; cls?: string; t?: string; dash?: string }
  | { hatch: Ink; d: string; cross?: boolean; o?: number; cls?: string; t?: string }
  | { fill: keyof typeof C; d: string; o?: number; cls?: string; t?: string }
  | { text: string; c: Ink; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; ls?: number; cls?: string; t?: string };

const GAP = 0.08; //seconds between one item starting to print and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const words = (c: Ink, text: string, x: number, y: number, size: number, anchor?: 'start' | 'end'): Item => ({ c, text, x, y, size, anchor });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a cut shape: paper underneath to cover what's behind, hatched, then outlined
const engrave = (d: string, c: Ink, w = 4, cross = false): Item[] => [
  { fill: 'paper', d },
  { hatch: c, d, cross },
  { line: c, d, w },
];
//a blank shape: paper, outlined
const blank = (d: string, c: Ink = 'ink', w = 4): Item[] => [
  { fill: 'paper', d },
  { line: c, d, w },
];
const tilt = (items: Item[], t: string) => items.map((it) => ({ ...it, t }));

//head and shoulders, the shoulders' bottom edge at y
function shoulders(x: number, y: number, h: number) {
  return `M ${x - h * 0.3} ${y} Q ${x - h * 0.3} ${y - h * 0.45} ${x} ${y - h * 0.45} Q ${x + h * 0.3} ${y - h * 0.45} ${x + h * 0.3} ${y} Z ${circle(x, y - h * 0.72, h * 0.22)}`;
}
const bust = (x: number, y: number, h: number, c: Ink, cross = c === 'red') => engrave(shoulders(x, y, h), c, 5, cross);

const coin = (x: number, y: number, r: number): Item[] => [...engrave(circle(x, y, r), 'gold', 3), { line: 'gold', d: circle(x, y, r * 0.72), w: 2 }];
const crescent = (x: number, y: number, r: number): Item[] => {
  const d = `M ${x} ${y - r} a ${r} ${r} 0 1 0 ${r * 0.85} ${r * 1.55} a ${r * 0.8} ${r * 0.8} 0 1 1 ${-r * 0.85} ${-r * 1.55} Z`;
  return [{ hatch: 'gold', d }, { line: 'gold', d, w: 3 }];
};
//a paper lantern hanging from (x, y), glowing
const lantern = (x: number, y: number, s = 1): Item[] => [
  { fill: 'gold', d: circle(x, y + 22 * s, 50 * s), o: 0.12 },
  ...engrave(round(x - 16 * s, y, 32 * s, 44 * s, 10 * s), 'gold', 3),
  { line: 'gold', d: `${line([x - 20 * s, y], [x + 20 * s, y])} ${line([x - 14 * s, y + 44 * s], [x + 14 * s, y + 44 * s])}`, w: 3 },
];
//a market stall from x, w wide: a striped awning on poles over a counter
const stall = (x: number, w: number, c: Ink): Item[] => [
  { line: 'brown', d: `${line([x + 12, 430], [x + 12, 250])} ${line([x + w - 12, 430], [x + w - 12, 250])}`, w: 7 },
  ...engrave(shape([x - 24, 260], [x + w + 24, 260], [x + w, 190], [x, 190]), c, 4, true),
  { line: c, d: Array.from({ length: Math.round(w / 60) }, (_, i) => line([x + 30 + i * 60, 190], [x + 10 + i * 60, 260])).join(' '), w: 3 },
  ...engrave(rect(x, 430, w, 110), 'brown'),
];
//pitched-roof houses from x1 to x2, standing on y, with lit windows
function houses(x1: number, x2: number, y: number, seed: number): Item[] {
  let roofs = `M ${x1} ${y}`;
  let windows = '';
  for (let x = x1, i = seed; x < x2; i++) {
    const w = 70 + rand(i) * 60;
    const top = y - 60 - rand(i + 20) * 70;
    const end = Math.min(x2, x + w);
    roofs += ` L ${x} ${top} L ${(x + end) / 2} ${top - 40} L ${end} ${top}`;
    if (rand(i + 40) > 0.35) windows += ` ${rect((x + end) / 2 - 9, top + 20, 18, 22)}`;
    x = end;
  }
  const d = `${roofs} L ${x2} ${y} Z`;
  return [{ fill: 'paper', d }, { hatch: 'blue', d, o: 0.7 }, { line: 'blue', d, w: 3 }, { fill: 'gold', d: windows }];
}
//footprints walking from one point to another
const steps = (from: Pt, to: Pt, n = 7): Item[] => [
  {
    fill: 'red',
    d: Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return ellipse(from[0] + (to[0] - from[0]) * t + (i % 2 ? 14 : -14), from[1] + (to[1] - from[1]) * t, 9, 14);
    }).join(' '),
    o: 0.9,
  },
];
const cup = (x: number, y: number) => engrave(shape([x - 42, y], [x + 42, y], [x + 28, y - 84], [x - 28, y - 84]), 'brown', 4);
const arrow = (from: Pt, to: Pt): Item => {
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = (da: number): Pt => [to[0] - 26 * Math.cos(a + da), to[1] - 26 * Math.sin(a + da)];
  return { line: 'red', d: `${line(from, to)} ${line(head(0.5), to, head(-0.5))}`, w: 5 };
};
//the night sky every page is printed under
const STARS = Array.from({ length: 70 }, (_, i) => circle(60 + rand(i) * (W - 120), 60 + rand(i + 100) * 340, 1.5 + rand(i + 200) * 2)).join(' ');

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const POUCH = 'M 400 230 Q 280 320 300 440 Q 320 540 450 540 Q 580 540 600 440 Q 620 320 500 230 Z';
const BOOK = `M 160 100 Q 480 70 800 110 L 800 600 Q 480 570 160 600 Z M 800 110 Q 1120 70 1440 100 L 1440 600 Q 1120 570 800 600 Z`;
const STRING = 'M 60 110 Q 430 250 800 120 Q 1170 250 1540 110';
const SIGN: Pt = [1430, 90];
const QUEUE = Array.from({ length: 14 }, (_, i) => 1440 - i * 70); //front of the line first; the player is last

const ART: Record<Page, Record<string, Item[]>> = {
  title: {
    plate: [...blank(round(200, 90, 1200, 520, 30), 'ink', 4), { line: 'ink', d: round(222, 112, 1156, 476, 20), w: 1.5 }],
    string: [{ line: 'ink', d: 'M 222 150 Q 500 260 800 160 Q 1100 260 1378 150', w: 2 }, ...[360, 560, 800, 1040, 1240].flatMap((x, i) => lantern(x, [194, 212, 160, 212, 194][i], 0.8))],
    moon: crescent(1250, 470, 50),
  },

  hill: {
    moon: crescent(1360, 150, 60),
    hills: [...engrave('M 0 640 Q 300 420 700 520 Q 1100 380 1600 500 L 1600 900 L 0 900 Z', 'blue', 3)],
    town: houses(560, 1240, 470, 7),
    you: bust(300, 640, 320, 'red'),
  },

  purse: {
    pouch: [...engrave(POUCH, 'brown', 5), { line: 'ink', d: 'M 390 250 Q 450 280 510 250 M 450 266 q -30 -60 -70 -50 M 450 266 q 30 -60 70 -50', w: 4 }],
    ten: [...Array.from({ length: 10 }, (_, i) => coin(720 + i * 80, 330, 32)).flat(), { ...words('ink', 'TEN SILVER', 1080, 250, 34), ls: 6 }],
    split: [
      { line: 'ink', d: 'M 690 390 q 0 24 24 24 H 900 q 20 0 20 18 q 0 -18 20 -18 H 1146 q 24 0 24 -24', w: 3 },
      { ...words('ink', 'THE COACH HOME', 920, 490, 26), ls: 4 },
      { line: 'red', d: 'M 1210 390 q 0 24 24 24 H 1310 q 20 0 20 18 q 0 -18 20 -18 H 1426 q 24 0 24 -24', w: 3 },
      { ...words('red', 'TO SPARE', 1330, 490, 26), ls: 4 },
    ],
  },

  market: {
    lights: [{ line: 'ink', d: STRING, w: 2 }, ...[200, 420, 640, 960, 1180, 1400].flatMap((x, i) => lantern(x, [158, 196, 150, 150, 196, 158][i]))],
    stalls: [...stall(110, 360, 'red'), ...stall(620, 360, 'blue'), ...stall(1130, 360, 'gold')],
    crowd: [180, 330, 520, 700, 880, 1060, 1250, 1420].flatMap((x, i) => bust(x, 640, 150 + rand(i) * 50, (['blue', 'ink', 'brown'] as Ink[])[i % 3], false)),
  },

  stall: {
    lantern: lantern(800, 90, 1.6),
    counter: stall(380, 840, 'blue'),
    thing: [
      { line: 'gold', d: Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.1 + i * 0.1); return line([800 + 150 * Math.cos(a), 400 + 150 * Math.sin(a)], [800 + 210 * Math.cos(a), 400 + 210 * Math.sin(a)]); }).join(' '), w: 3, cls: 'nm-glow' },
      ...engrave('M 690 430 Q 690 300 800 290 Q 910 300 910 430 Z', 'gold', 4, true),
    ],
    keeper: bust(1360, 600, 300, 'brown'),
    tag: [...blank(`${round(1000, 470, 150, 60, 10)} ${line([1075, 470], [1075, 440])}`, 'ink', 3), words('ink', '4 SILVER', 1075, 510, 24)],
    parcel: [...engrave(rect(500, 350, 140, 80), 'brown', 4), { line: 'red', d: `${line([570, 350], [570, 430])} ${line([500, 390], [640, 390])} M 570 350 q -30 -36 -50 -10 q 20 18 50 10 q 30 -36 50 -10 q -20 18 -50 10`, w: 4 }],
    midnight: [...crescent(200, 160, 50), { ...words('ink', 'TILL MIDNIGHT', 200, 270, 26), ls: 4 }],
    steps: steps([760, 620], [160, 480]),
    haggle: [{ line: 'red', d: line([1010, 480], [1140, 520]), w: 5 }, words('red', '3', 1180, 512, 44)],
  },

  game: {
    barrel: [...engrave('M 660 380 Q 640 470 660 560 L 940 560 Q 960 470 940 380 Z', 'brown', 4), { line: 'ink', d: 'M 652 420 Q 800 432 948 420 M 652 520 Q 800 532 948 520', w: 4 }, ...blank(ellipse(800, 380, 140, 22), 'brown', 4)],
    barker: [...bust(1170, 600, 380, 'blue', true), ...engrave(`${rect(1110, 270, 120, 70)} ${rect(1080, 334, 180, 14)}`, 'ink', 3)],
    crowd: [130, 260].flatMap((x, i) => bust(x, 620, 220 - i * 20, i ? 'brown' : 'ink', false)),
    cups: [...cup(700, 380), ...cup(800, 380), ...cup(900, 380)],
    winner: [...bust(420, 610, 260, 'gold', false), ...coin(500, 460, 18), ...coin(520, 440, 18)],
    sign: [
      { line: 'brown', d: line([SIGN[0], SIGN[1] + 200], [SIGN[0], 420]), w: 7 },
      ...blank(rect(SIGN[0] - 110, SIGN[1], 220, 200), 'brown', 4),
      { ...words('ink', 'RULES', SIGN[0], SIGN[1] + 40, 26), ls: 4 },
      ...[1, 2, 3].flatMap((n): Item[] => [words('ink', `${n}.`, SIGN[0] - 80, SIGN[1] + 46 + n * 40, 20, 'start'), { line: 'ink', d: line([SIGN[0] - 50, SIGN[1] + 40 + n * 40], [SIGN[0] + 80, SIGN[1] + 40 + n * 40]), w: 2, o: 0.5 }]),
    ],
    stake: [...coin(770, 470, 22), ...coin(830, 470, 22)],
    lifted: [{ fill: 'paper', d: shape([655, 382], [745, 382], [730, 290], [670, 290]) }, ...cup(700, 300), ...engrave(circle(700, 372, 9), 'gold', 2)],
    rule3: [{ line: 'red', d: line([SIGN[0] - 90, SIGN[1] + 170], [SIGN[0] + 90, SIGN[1] + 170]), w: 4 }, { ...words('red', 'FIRST ROUND: HOUSE KEEPS THE STAKE', SIGN[0] - 10, SIGN[1] + 240, 15), ls: 1 }],
    take: [arrow([860, 470], [1040, 470])],
    tally: [{ line: 'red', d: `${[0, 1, 2, 3].map((i) => line([200 + i * 22, 120], [200 + i * 22, 190])).join(' ')} ${line([186, 176], [278, 132])} ${line([310, 120], [310, 190])}`, w: 5 }, { ...words('red', 'NO WINS', 250, 240, 26), ls: 4 }],
    plant: [{ line: 'red', d: circle(420, 470, 150), w: 4, dash: '14 12' }],
    steps: steps([560, 620], [100, 460]),
  },

  fountain: {
    moon: crescent(1380, 140, 56),
    closed: [140, 470, 1100].flatMap((x): Item[] => [{ hatch: 'blue', d: rect(x, 230, 300, 170), o: 0.35 }, { line: 'blue', d: `${rect(x, 230, 300, 170)} ${[1, 2, 3, 4].map((i) => line([x, 230 + i * 34], [x + 300, 230 + i * 34])).join(' ')}`, w: 2, o: 0.6 }]),
    fountain: [
      ...engrave(`${rect(560, 470, 480, 90)}`, 'ink', 4),
      ...blank(ellipse(800, 470, 240, 36), 'ink', 4),
      ...engrave(rect(784, 330, 32, 140), 'ink', 3),
      ...blank(ellipse(800, 330, 90, 16), 'ink', 3),
      { line: 'blue', d: 'M 720 334 q -30 50 -40 130 M 880 334 q 30 50 40 130 M 760 338 q -14 50 -16 126 M 840 338 q 14 50 16 126', w: 3, cls: 'nm-flow' },
    ],
    tam: [...engrave(round(1060, 560, 220, 60, 20), 'brown', 3), ...tilt(bust(1170, 580, 290, 'blue', false), 'rotate(10 1170 580)')],
    cut: [{ line: 'ink', d: 'M 1300 520 q 20 30 0 60 M 1324 520 q -20 30 0 60', w: 3 }],
    you: [...bust(380, 620, 320, 'red'), ...engrave('M 490 420 Q 470 470 500 500 L 560 500 Q 590 470 570 420 Z', 'brown', 3)],
    given: [...coin(720, 250, 22), ...coin(820, 230, 22), ...coin(920, 250, 22), arrow([620, 290], [1040, 290])],
    watchman: [...bust(1420, 600, 300, 'ink', false), ...lantern(1520, 330, 1.1)],
    bread: engrave('M 860 450 Q 900 410 960 430 Q 990 450 960 460 L 870 462 Z', 'brown', 3),
    steps: steps([520, 620], [80, 480]),
  },

  coach: {
    sky: [{ line: 'gold', d: [0, 1, 2, 3].map((i) => line([80, 380 - i * 40], [1520, 380 - i * 40])).join(' '), w: 2, o: 0.25 }],
    inn: [
      ...blank(rect(80, 220, 320, 340), 'ink', 4),
      ...engrave(shape([60, 230], [240, 120], [420, 230]), 'brown', 4, true),
      { fill: 'gold', d: `${rect(120, 280, 60, 70)} ${rect(300, 280, 60, 70)} ${rect(120, 420, 60, 70)}`, o: 0.85 },
      ...blank(rect(300, 400, 60, 160), 'ink', 3),
    ],
    coach: [
      ...engrave(round(560, 300, 380, 200, 30), 'brown', 5),
      ...blank(`${rect(600, 330, 120, 80)} ${rect(780, 330, 120, 80)}`, 'ink', 3),
      ...[640, 860].flatMap((x): Item[] => [...blank(circle(x, 540, 58), 'ink', 5), { line: 'ink', d: Array.from({ length: 6 }, (_, i) => line([x + 54 * Math.cos(i * 0.5236), 540 + 54 * Math.sin(i * 0.5236)], [x - 54 * Math.cos(i * 0.5236), 540 - 54 * Math.sin(i * 0.5236)])).join(' '), w: 2 }]),
    ],
    horse: [
      ...engrave(`${ellipse(1160, 420, 120, 55)} ${shape([1240, 400], [1290, 300], [1318, 312], [1282, 420])} ${shape([1290, 300], [1350, 322], [1344, 346], [1296, 332])}`, 'ink', 4),
      { line: 'ink', d: `${line([1070, 455], [1066, 560])} ${line([1100, 466], [1104, 560])} ${line([1220, 466], [1216, 560])} ${line([1250, 455], [1258, 560])} ${line([940, 420], [1040, 420])}`, w: 6 },
    ],
    breath: [{ line: 'ink', d: 'M 1360 330 q 30 -10 50 6 q 20 14 46 0 M 1364 350 q 30 -6 54 10', w: 3, o: 0.5, cls: 'nm-flow' }],
    queue: QUEUE.flatMap((x, i) => bust(x, 640, 130 + rand(i + 5) * 30, i === 13 ? 'red' : (['blue', 'ink', 'brown'] as Ink[])[i % 3])),
    seats: [...blank(rect(1340, 110, 200, 110), 'ink', 3), { ...words('ink', '12 SEATS', 1440, 160, 28), ls: 3 }, words('gold', 'AT DAWN', 1440, 200, 20)],
    coachman: [...engrave(rect(900, 250, 80, 50), 'brown', 3), ...bust(940, 260, 130, 'ink', false), ...engrave(`${rect(910, 120, 60, 36)} ${rect(894, 152, 92, 10)}`, 'ink', 2)],
    noon: [...blank(rect(1090, 110, 220, 90), 'ink', 3), { ...words('red', 'NEXT COACH', 1200, 148, 22), ls: 3 }, { ...words('red', 'NOON', 1200, 184, 26), ls: 4 }],
    aboard: [...blank(rect(600, 330, 120, 80), 'ink', 3), ...bust(660, 410, 90, 'red'), { fill: 'paper', d: rect(QUEUE[13] - 48, 500, 96, 150) }],
  },

  road: {
    sun: [{ fill: 'gold', d: 'M 600 520 a 200 200 0 0 1 400 0 Z', o: 0.25 }, { line: 'gold', d: `M 600 520 a 200 200 0 0 1 400 0 ${Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1 + (i + 1) / 10); return line([800 + 230 * Math.cos(a), 520 + 230 * Math.sin(a)], [800 + 300 * Math.cos(a), 520 + 300 * Math.sin(a)]); }).join(' ')}`, w: 4 }],
    hills: engrave('M 0 560 Q 400 440 800 520 Q 1200 440 1600 540 L 1600 900 L 0 900 Z', 'blue', 3),
    road: [{ fill: 'paper', d: 'M 640 900 Q 700 700 900 620 Q 1000 580 820 540 L 840 540 Q 1040 590 960 640 Q 800 720 860 900 Z' }, { line: 'ink', d: 'M 640 900 Q 700 700 900 620 Q 1000 580 820 540 M 860 900 Q 800 720 960 640 Q 1040 590 840 540', w: 3 }],
    carriage: [...engrave(round(880, 560, 90, 50, 10), 'brown', 3), ...blank(`${circle(895, 616, 14)} ${circle(955, 616, 14)}`, 'ink', 3), ...engrave(ellipse(1010, 590, 30, 14), 'ink', 2)],
  },

  journal: {
    book: [...blank(BOOK, 'ink', 3), { hatch: 'ink', d: `${shape([780, 108], [800, 110], [800, 600], [780, 598])} ${shape([800, 110], [820, 108], [820, 598], [800, 600])}`, o: 0.6 }],
    rules: [{ line: 'blue', d: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => line([200, 170 + i * 48], [760, 170 + i * 48])).join(' '), w: 1.5, o: 0.45 }],
    own: [
      words('ink', 'Your own', 1110, 256, 44),
      words('ink', 'story', 1110, 316, 44),
      { line: 'ink', d: `${shape([1140, 520], [1340, 330], [1360, 350], [1160, 540])} ${line([1140, 520], [1124, 556], [1160, 540])}`, w: 4 },
    ],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

//every item is printed top to bottom, as if under a roller
function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g>
      {items.map((item, i) => {
        const style = { animationDelay: `${start + i * GAP}s` };
        let mark;
        if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]} letterSpacing={item.ls} style={{ ...styles.type, fontSize: item.size }}>
              {item.text}
            </text>
          );
        } else if ('line' in item) {
          mark = <path d={item.d} fill="none" stroke={C[item.line]} strokeWidth={item.w ?? 4} strokeOpacity={item.o ?? 0.95} strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />;
        } else if ('hatch' in item) {
          mark = <path d={item.d} fill={`url(#nm-${item.cross ? 'x' : 'h'}-${item.hatch})`} fillOpacity={item.o ?? 1} />;
        } else {
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 1} />;
        }
        return (
          <g key={i} className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <g className="nm-print" style={style} transform={item.t}>
              {mark}
            </g>
          </g>
        );
      })}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page prints it afresh
  starts: Record<string, number>; //when each part began printing, in seconds after it appeared
}

//new parts are printed one after another; on a fresh page they wait for the old one to lift off
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t += ART[page][part].length * GAP + 0.12;
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
    <g className={leaving ? 'nm-lift' : undefined}>
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
  market: new URL('./sounds/market.m4a', import.meta.url).href,
  night: new URL('./sounds/night.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the busy square on market night, and the quiet once the stalls pack up
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  title: { night: 0.4, market: 0.15 },
  hill: { night: 0.5 },
  purse: { night: 0.5 },
  market: { market: 0.8 },
  stall: { market: 0.6 },
  game: { market: 0.8 },
  fountain: { night: 0.6, market: 0.1 },
  coach: { night: 0.5 },
  road: { night: 0.35 },
  journal: { night: 0.3 },
};

const COINS: OneShot = { src: new URL('./sounds/coins.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 };
const ONE_SHOTS: Record<string, OneShot> = Object.fromEntries(['purse', 'stall_bought', 'stall_haggled', 'game_found', 'tam_given'].map((cue) => [cue, COINS]));

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Woodcut({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Night Market has no cue for the animation "${animation}"`);
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
    sound.current?.mix(MIX[cues[active].page]);
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
          {INKS.map((ink) => (
            <g key={ink}>
              <pattern id={`nm-h-${ink}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
                <line x1="0" y1="0" x2="0" y2="6" stroke={C[ink]} strokeWidth="1.5" />
              </pattern>
              <pattern id={`nm-x-${ink}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
                <path d="M 0 0 V 6 M 0 3 H 6" stroke={C[ink]} strokeWidth="1.3" />
              </pattern>
            </g>
          ))}
        </defs>
        <rect width={W} height={H} fill={C.paper} />
        <path d={STARS} fill={C.ink} fillOpacity={0.55} className="nm-twinkle" />
        <rect x={24} y={24} width={W - 48} height={H - 48} fill="none" stroke={C.ink} strokeWidth={2} strokeOpacity={0.6} />
        <rect x={36} y={36} width={W - 72} height={H - 72} fill="none" stroke={C.ink} strokeWidth={1} strokeOpacity={0.4} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
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
.nm-print {
  animation: nm-print 0.7s ease-out both;
}
@keyframes nm-print {
  from { clip-path: inset(0 0 100% 0); opacity: 0; }
  20% { opacity: 1; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
.nm-lift {
  animation: nm-lift 0.5s ease-in forwards;
}
@keyframes nm-lift {
  to { opacity: 0; transform: translateY(-30px); }
}
.nm-glow {
  animation: nm-glow 2s ease-in-out infinite;
}
@keyframes nm-glow {
  50% { opacity: 0.35; }
}
.nm-flow {
  animation: nm-flow 1.6s ease-in-out infinite;
}
@keyframes nm-flow {
  50% { transform: translateY(5px); opacity: 0.6; }
}
.nm-twinkle {
  animation: nm-twinkle 4s ease-in-out infinite;
}
@keyframes nm-twinkle {
  50% { fill-opacity: 0.3; }
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
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: "Georgia, 'Times New Roman', serif",
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 22,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.gold,
    borderBottom: `2px solid ${C.gold}`,
    padding: '0 10px 6px',
  },
  name: {
    fontSize: 110,
    lineHeight: 1.15,
    letterSpacing: 6,
    color: C.ink,
    textShadow: `1px 1px 0 ${C.paper}, 2px 2px 0 ${C.ink}33`,
  },
};

export default Woodcut;
