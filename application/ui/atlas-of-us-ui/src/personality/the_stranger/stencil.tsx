import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Layers, type Layer } from '../layers';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Stranger is sprayed through stencils onto the concrete wall by the station, like street art: flat black for most
// things, grey and amber where a second stencil went on, white for highlights. The player is always in red, and so is
// anything they do. Every shape has the rough edge of paint through card, a fine mist of overspray around it, and the
// odd drip; the gaps between head, body and legs are the bridges that hold a stencil together. A cue names a page and
// the parts of it to show: parts already up stay put, new ones are sprayed after them, and turning to a new page fades
// the old one off the wall. Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep
// to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
const VIEW = `0 0 ${W} ${H}`;
type Pt = [number, number];

const C = {
  wall: '#c9c3b6',
  black: '#1d1d1f',
  red: '#d7262e',
  amber: '#f0a12a',
  white: '#f4f1ea',
  grey: '#6e6f73',
};
type Ink = Exclude<keyof typeof C, 'wall'>;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'title' | 'street' | 'doorway' | 'flat';

interface Cue {
  page: Page;
  parts: string[]; //sprayed in this order
  card?: [kicker: string, name: string];
}

const STREET = ['kerb', 'station', 'atm', 'lamp', 'step'];
const WET = [...STREET, 'rain'];
const COLD = [...STREET, 'frost'];
const DOORWAY = ['columns', 'sign', 'doorway', 'cardboard', 'bag', 'rain'];
const FLAT = ['window', 'rain', 'sofa', 'telly', 'you'];

const cues: Record<string, Cue> = {
  title_card: { page: 'title', parts: ['lamp', 'man', 'rain'], card: ['A Wednesday in November', 'The Stranger'] },
  station: { page: 'street', parts: [...WET, 'you_door'] },
  man: { page: 'street', parts: [...WET, 'you', 'man'] },
  ask: { page: 'street', parts: [...WET, 'you', 'man', 'bubble', 'say_fare'] },
  pockets: { page: 'street', parts: [...WET, 'you', 'man', 'bubble', 'say_fare', 'pockets'] },
  give: { page: 'street', parts: [...WET, 'you', 'man', 'coins', 'bubble', 'say_bless'] },
  ticket: { page: 'street', parts: [...WET, 'you', 'man', 'ticket'] },
  questions: { page: 'street', parts: [...WET, 'you', 'man', 'questions'] },
  walk: { page: 'street', parts: [...WET, 'you_away', 'man', 'bubble', 'say_lying'] },
  rough: { page: 'doorway', parts: [...DOORWAY, 'wallet'] },
  rough_sister: { page: 'doorway', parts: [...DOORWAY, 'house'] },
  rough_crowd: { page: 'street', parts: [...WET, 'you', 'man', 'crowd'] },
  rough_ask: { page: 'street', parts: [...WET, 'you', 'man', 'bubble', 'say_story'] },
  rough_leave: { page: 'street', parts: [...WET, 'you_away', 'man', 'crowd'] },
  rough_food: { page: 'street', parts: [...WET, 'you', 'man', 'food'] },
  rough_doubt: { page: 'street', parts: [...WET, 'you', 'man', 'bubble', 'say_rain'] },
  home: { page: 'flat', parts: FLAT },
  home_leah: { page: 'flat', parts: [...FLAT, 'leah', 'bubble', 'say_sept'] },
  home_rain: { page: 'flat', parts: [...FLAT, 'leah', 'temp'] },
  doubt_maybe: { page: 'flat', parts: [...FLAT, 'leah', 'temp', 'maybe'] },
  doubt_line: { page: 'flat', parts: [...FLAT, 'leah', 'temp', 'lesson'] },
  doubt_doorway: { page: 'flat', parts: [...FLAT, 'leah', 'temp', 'still'] },
  doubt_telly: { page: 'flat', parts: [...FLAT, 'leah', 'temp', 'telly_on'] },
  again: { page: 'street', parts: [...COLD, 'you_door'] },
  again_man: { page: 'street', parts: [...COLD, 'you_door', 'man', 'stranger'] },
  again_cough: { page: 'street', parts: [...COLD, 'you_door', 'man_sitting', 'cough'] },
  again_ask: { page: 'street', parts: [...COLD, 'man_sitting', 'you', 'bubble_low', 'say_better'] },
  again_shelter: { page: 'street', parts: [...COLD, 'man_sitting', 'you', 'shelter'] },
  again_sister: { page: 'street', parts: [...COLD, 'man_sitting', 'you', 'bubble_low', 'say_sister'] },
  again_avoid: { page: 'street', parts: [...COLD, 'man_sitting', 'cough', 'exit'] },
  empty: { page: 'street', parts: COLD },
  homework: { page: 'title', parts: ['lamp', 'you', 'ask'] },
  goodbye: { page: 'street', parts: [...COLD, 'blanket'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: sprayed shapes, sprayed lines, stencilled lettering and drips. t is an svg transform, for
//anything sprayed at an angle. raw items skip the spray filters, for anything that moves all the time
type Item =
  | { paint: Ink; d: string; o?: number; cls?: string; t?: string; raw?: boolean }
  | { line: Ink; d: string; w?: number; o?: number; cls?: string; t?: string; raw?: boolean }
  | { text: string; c: Ink; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; ls?: number; o?: number; t?: string }
  | { drip: Ink; x: number; y: number; len: number };

const GAP = 0.07; //seconds between one item starting to spray and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const words = (c: Ink, text: string, x: number, y: number, size: number, ls = 2): Item => ({ c, text, x, y, size, ls });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//n drips of paint running down from y, somewhere between x1 and x2
const drips = (c: Ink, x1: number, x2: number, y: number, n: number, seed: number): Item[] =>
  Array.from({ length: n }, (_, i) => ({ drip: c, x: Math.round(x1 + rand(seed + i) * (x2 - x1)), y, len: Math.round(14 + rand(seed + i + 50) * 40) }));

//a figure is a few separate shapes, so overlaps always join up. The man gets a woolly hat and a beard
const paint = (c: Ink, ds: string[], o?: number): Item[] => ds.map((d) => ({ paint: c, d, o }));
const hatAndBeard = ([hx, hy]: Pt, u: number) => [
  `M ${hx - 8 * u} ${hy - u} A ${8 * u} ${8 * u} 0 0 1 ${hx + 8 * u} ${hy - u} Z`,
  shape([hx - 6 * u, hy + u], [hx + 6 * u, hy + u], [hx + 3 * u, hy + 8 * u], [hx - 3 * u, hy + 8 * u]),
];

//standing, feet at y and h tall. head is the head's radius in hundredths of h: bigger for a hood
function standing(x: number, y: number, h: number, { coat = false, man = false, head = 7 } = {}) {
  const u = h / 100;
  const P = (dx: number, dy: number): Pt => [x + dx * u, y - dy * u];
  const hem = coat ? 26 : 42;
  const ds = [
    circle(x, y - 90 * u, head * u),
    shape(P(-12, 81), P(12, 81), P(17, 76), P(20, 46), P(15, 45), P(12, 70), P(14, hem), P(-14, hem), P(-12, 70), P(-15, 45), P(-20, 46), P(-17, 76)),
    shape(P(-11, hem - 1), P(-2, hem - 1), P(-3, 0), P(-11, 0)),
    shape(P(2, hem - 1), P(11, hem - 1), P(11, 0), P(3, 0)),
  ];
  return man ? [...ds, ...hatAndBeard([x, y - 90 * u], u)] : ds;
}

//sitting on something at height s, facing right (dir 1) or left (-1)
function seated(x: number, s: number, h: number, dir: 1 | -1, man = false) {
  const u = h / 100;
  const P = (dx: number, dy: number): Pt => [x + dx * u * dir, s - dy * u];
  const head = P(3, 57);
  const ds = [
    circle(head[0], head[1], 7 * u),
    shape(P(-10, 48), P(11, 48), P(12, 2), P(-10, 0)),
    shape(P(9, 46), P(14, 44), P(28, 16), P(23, 13)),
    shape(P(0, 13), P(30, 12), P(30, 0), P(0, 0)),
    shape(P(24, -1), P(31, -1), P(31, -28), P(24, -28)),
  ];
  return man ? [...ds, ...hatAndBeard(head, u)] : ds;
}

//a white speech bubble with its tail pointing at tip
const bubble = (x: number, y: number, w: number, h: number, tip: Pt): Item[] => {
  const [a, b]: Pt[] = [
    [tip[0] - 30, y + h - 3],
    [tip[0] + 16, y + h - 3],
  ];
  return [
    { paint: 'white', d: round(x, y, w, h, 40) },
    { line: 'black', d: round(x, y, w, h, 40), w: 6 },
    { paint: 'white', d: shape(a, b, tip) },
    { line: 'black', d: line(a, tip, b), w: 6 },
  ];
};

//falling rain, n strokes over the box from x1,y1 to x2,y2
const rain = (x1: number, y1: number, x2: number, y2: number, n: number, len: number): Item => ({
  line: 'white',
  d: Array.from({ length: n }, (_, i) => {
    const [x, y] = [x1 + rand(i) * (x2 - x1), y1 + rand(i + 300) * (y2 - y1 - len)];
    return line([+x.toFixed(1), +y.toFixed(1)], [+(x - len / 4).toFixed(1), +(y + len).toFixed(1)]);
  }).join(' '),
  w: 2.5,
  o: 0.6,
  cls: len > 20 ? 'st-fall' : 'st-trickle',
  raw: true,
});

//the streetlamp: a pole at x, its head at hx, and a pool of amber light under it
const lamp = (x: number, hx: number, top: number, s: number): Item[] => [
  { paint: 'amber', d: circle(hx, top + 40 * s, 150 * s), o: 0.22 },
  { paint: 'amber', d: shape([hx - 20 * s, top + 22 * s], [hx + 20 * s, top + 22 * s], [hx + 180 * s, 600], [hx - 180 * s, 600]), o: 0.12 },
  { line: 'black', d: `${line([x, 600], [x, top + 50 * s])} M ${x} ${top + 50 * s} Q ${x} ${top} ${hx + 20 * s} ${top}`, w: 14 * s },
  { paint: 'black', d: shape([hx - 34 * s, top - 2], [hx + 30 * s, top - 2], [hx + 20 * s, top + 22 * s], [hx - 24 * s, top + 22 * s]) },
];

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const ARCH = 'M 170 600 V 310 A 130 130 0 0 1 430 310 V 600 Z';
const FROST = Array.from({ length: 28 }, (_, i) => {
  const [x, y, r] = [40 + rand(i + 700) * 1520, 30 + rand(i + 800) * 520, 5 + rand(i + 900) * 6];
  return `M ${(x - r).toFixed(1)} ${y.toFixed(1)} h ${(2 * r).toFixed(1)} M ${x.toFixed(1)} ${(y - r).toFixed(1)} v ${(2 * r).toFixed(1)} M ${(x - r * 0.7).toFixed(1)} ${(y - r * 0.7).toFixed(1)} l ${(1.4 * r).toFixed(1)} ${(1.4 * r).toFixed(1)}`;
}).join(' ');

const ART: Record<Page, Record<string, Item[]>> = {
  title: {
    lamp: lamp(1420, 1300, 100, 1.4),
    man: paint('black', standing(1290, 600, 430, { coat: true, man: true })),
    rain: [rain(0, 0, W, 600, 90, 34)],
    you: paint('red', standing(1290, 600, 430)),
    ask: [{ ...words('red', '?', 560, 540, 420, 0) }, ...drips('red', 470, 640, 520, 4, 41)],
  },

  street: {
    kerb: [
      { line: 'black', d: line([40, 600], [1560, 600]), w: 8 },
      { line: 'black', d: line([40, 624], [1560, 624]), w: 3, o: 0.5 },
    ],
    station: [
      { line: 'black', d: 'M 80 600 V 140 M 800 140 V 600', w: 10 },
      { paint: 'black', d: rect(60, 108, 760, 34) },
      { ...words('white', 'STATION', 440, 135, 26), ls: 10 },
      ...drips('black', 70, 810, 142, 7, 1),
      { line: 'black', d: `${rect(520, 180, 220, 80)} M 593 180 V 260 M 667 180 V 260`, w: 6 },
      { paint: 'black', d: ARCH, o: 0.92 },
    ],
    atm: [
      { paint: 'grey', d: rect(560, 300, 130, 130) },
      { paint: 'black', d: rect(578, 318, 94, 50) },
      { line: 'black', d: `${rect(560, 300, 130, 130)} M 590 386 h 70 M 590 404 h 70`, w: 5 },
      words('black', 'ATM', 625, 290, 24, 6),
    ],
    lamp: lamp(1500, 1450, 130, 1),
    step: [
      { paint: 'grey', d: rect(500, 556, 340, 44), o: 0.8 },
      { line: 'black', d: line([500, 556], [840, 556]), w: 5 },
    ],
    rain: [rain(0, 0, W, 600, 80, 34)],
    frost: [{ line: 'white', d: FROST, w: 2.5, o: 0.8, cls: 'st-twinkle', raw: true }],
    you: paint('red', standing(1120, 590, 420)),
    you_away: paint('red', standing(1430, 590, 360)),
    you_door: paint('red', standing(300, 590, 380)),
    man: [...paint('black', standing(860, 590, 440, { coat: true, man: true })), ...drips('black', 810, 910, 476, 2, 7)],
    man_sitting: paint('black', seated(700, 556, 270, 1, true)),
    stranger: paint('grey', standing(1080, 590, 420)),
    crowd: [...paint('grey', standing(320, 590, 400, { head: 9 }), 0.85), ...paint('grey', standing(1340, 590, 380, { head: 9 }), 0.85)].map((it) => ({ ...it, cls: 'st-pass' })),
    bubble: bubble(600, 30, 560, 120, [850, 165]),
    bubble_low: bubble(440, 180, 560, 120, [690, 360]),
    say_fare: [words('black', 'BUS FARE HOME?', 880, 106, 44)],
    say_bless: [words('black', 'GOD BLESS YOU', 880, 106, 44)],
    say_lying: [words('black', "I'M NOT LYING", 880, 106, 44)],
    say_story: [words('black', 'JOB. APARTMENT. COUCHES.', 880, 106, 44)],
    say_rain: [words('black', 'STILL RAINING ON ME', 880, 106, 38)],
    say_better: [words('black', 'BEEN BETTER', 720, 256, 44)],
    say_sister: [words('black', 'SHE CHANGED HER MIND', 720, 256, 36)],
    pockets: [
      { paint: 'white', d: `${shape([790, 395], [815, 395], [806, 420])} ${shape([905, 395], [930, 395], [914, 420])}` },
      { paint: 'white', d: rect(735, 380, 50, 66), t: 'rotate(-12 760 413)' },
      { line: 'black', d: 'M 744 396 h 32 M 744 410 h 32 M 744 424 h 32', w: 3, t: 'rotate(-12 760 413)' },
      { paint: 'amber', d: rect(942, 378, 14, 26) },
    ],
    coins: [985, 1000, 1015].flatMap((x, i): Item[] => [
      { paint: 'amber', d: circle(x, 392 - i * 6, 13) },
      { line: 'black', d: circle(x, 392 - i * 6, 13), w: 2 },
    ]),
    ticket: [
      { paint: 'red', d: rect(930, 335, 120, 56), t: 'rotate(-10 990 363)' },
      { ...words('white', 'BUS 59', 990, 371, 24), t: 'rotate(-10 990 363)' },
    ],
    questions: [words('red', '?', 1060, 190, 80, 0), words('red', '?', 1140, 130, 100, 0), words('red', '?', 1215, 200, 70, 0), ...drips('red', 1120, 1160, 140, 2, 13)],
    food: [
      { paint: 'amber', d: shape([985, 360], [1015, 360], [1011, 402], [989, 402]) },
      { line: 'black', d: 'M 982 360 h 36', w: 4 },
      { line: 'white', d: 'M 993 348 q -6 -12 0 -24 M 1007 348 q 6 -12 0 -24', w: 3, cls: 'st-rise', raw: true },
      { paint: 'amber', d: 'M 920 408 a 32 22 0 0 1 64 0 Z' },
      { line: 'black', d: 'M 926 400 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6', w: 2 },
    ],
    cough: [{ line: 'black', d: 'M 748 386 q 10 10 0 20 M 764 378 q 14 16 0 34 M 780 370 q 18 22 0 48', w: 4, cls: 'st-shake', raw: true }],
    shelter: [
      { paint: 'red', d: round(980, 50, 420, 120, 16) },
      words('white', 'NIGHT SHELTER', 1190, 104, 36, 3),
      words('white', 'MILL RD · 10 MIN →', 1190, 148, 24, 3),
      ...drips('red', 1000, 1380, 168, 4, 21),
    ],
    exit: [
      { paint: 'red', d: shape([860, 250], [940, 190], [940, 225], [1300, 225], [1300, 275], [940, 275], [940, 310]) },
      words('white', 'OTHER EXIT', 1120, 261, 30, 3),
      ...drips('red', 950, 1290, 274, 3, 31),
    ],
    blanket: [
      { paint: 'grey', d: rect(640, 510, 150, 14) },
      { paint: 'amber', d: rect(640, 524, 150, 16) },
      { paint: 'grey', d: rect(640, 540, 150, 16) },
    ],
  },

  doorway: {
    columns: [330, 1080].flatMap((x): Item[] => [
      { paint: 'black', d: `${rect(x, 200, 90, 380)} ${rect(x - 15, 180, 120, 20)} ${rect(x - 15, 580, 120, 20)}` },
      { line: 'grey', d: `M ${x + 30} 210 V 570 M ${x + 60} 210 V 570`, w: 4 },
    ]),
    sign: [
      { line: 'black', d: rect(270, 120, 960, 56), w: 8 },
      { ...words('black', 'THE COUNTY BANK · 1891', 750, 162, 32, 6), o: 0.7 },
    ],
    doorway: [{ paint: 'black', d: rect(470, 200, 560, 400), o: 0.88 }, ...drips('black', 480, 1020, 600, 3, 51)],
    cardboard: [{ paint: 'amber', d: shape([500, 560], [1000, 560], [1030, 600], [470, 600]) }],
    bag: [
      { paint: 'grey', d: round(540, 500, 420, 75, 36) },
      { line: 'white', d: 'M 660 506 V 568 M 820 506 V 568', w: 4 },
    ],
    wallet: [
      { line: 'white', d: rect(720, 330, 80, 56), w: 5, t: 'rotate(-15 760 358)' },
      { line: 'white', d: 'M 820 330 h 60 M 830 360 h 90 M 820 390 h 60', w: 4, cls: 'st-whoosh', raw: true },
    ],
    house: [
      ...[circle(1390, 300, 120), circle(1240, 440, 18), circle(1205, 490, 11)].flatMap((d): Item[] => [
        { paint: 'white', d },
        { line: 'black', d, w: 5 },
      ]),
      { paint: 'black', d: `${shape([1325, 322], [1390, 262], [1455, 322])} ${rect(1340, 322, 100, 66)}` },
      { paint: 'white', d: rect(1378, 350, 24, 38) },
      words('black', 'RIVERSIDE', 1390, 245, 26, 4),
    ],
    rain: [rain(0, 0, W, 600, 80, 34)],
  },

  flat: {
    window: [
      { paint: 'black', d: rect(140, 90, 420, 300) },
      { line: 'grey', d: 'M 350 90 V 390 M 140 240 H 560', w: 8 },
      { line: 'black', d: rect(140, 90, 420, 300), w: 10 },
    ],
    rain: [rain(150, 100, 550, 380, 22, 16)],
    temp: [words('white', '2°', 245, 362, 70, 0)],
    sofa: [
      { paint: 'grey', d: `${round(700, 360, 760, 140, 30)} ${rect(700, 480, 760, 60)}` },
      { paint: 'grey', d: `${round(660, 420, 70, 170, 24)} ${round(1430, 420, 70, 170, 24)}` },
      { line: 'black', d: 'M 720 540 V 590 M 1440 540 V 590', w: 10 },
    ],
    telly: [
      { paint: 'black', d: rect(178, 438, 284, 124), o: 0.9 },
      { line: 'black', d: round(160, 420, 320, 160, 10), w: 10 },
      { paint: 'black', d: rect(290, 580, 60, 14) },
    ],
    telly_on: [
      { paint: 'amber', d: rect(178, 438, 284, 124), o: 0.7, cls: 'st-flicker', raw: true },
      words('white', 'QUIZ', 320, 515, 44, 6),
    ],
    you: paint('red', seated(900, 500, 320, 1)),
    leah: paint('black', seated(1250, 500, 330, -1)),
    bubble: bubble(840, 50, 640, 130, [1235, 280]),
    say_sept: [words('black', 'HE ASKED ME IN SEPTEMBER', 1160, 128, 34)],
    maybe: [words('red', 'MAYBE', 1080, 230, 96, 8), ...drips('red', 900, 1260, 236, 4, 61)],
    lesson: [words('red', 'LESSON LEARNED', 1080, 230, 80, 4), ...drips('red', 800, 1360, 236, 4, 71)],
    still: [words('red', 'STILL OUT THERE', 1080, 230, 72, 4), ...drips('red', 760, 1400, 236, 4, 81)],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

function Mark({ item }: { item: Exclude<Item, { drip: Ink }> }) {
  if ('text' in item) {
    return (
      <text x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]} fillOpacity={item.o ?? 1} letterSpacing={item.ls} style={{ ...styles.type, fontSize: item.size }}>
        {item.text}
      </text>
    );
  }
  if ('line' in item) {
    return <path d={item.d} fill="none" stroke={C[item.line]} strokeWidth={item.w ?? 4} strokeOpacity={item.o ?? 1} strokeLinecap="round" strokeLinejoin="round" />;
  }
  return <path d={item.d} fill={C[item.paint]} fillOpacity={item.o ?? 1} />;
}

//every item is sprayed on left to right, one after another. Shapes get a mist of overspray behind them, and drips run
//down once the paint is on
function Part({ items, start }: { items: Item[]; start: number }) {
  const layer = (keep: (item: Item) => boolean) =>
    items.map((item, i) => {
      if (!keep(item)) return null;
      const delay = start + i * GAP;
      if ('drip' in item) {
        return (
          <path
            key={i}
            d={line([item.x, item.y], [item.x, item.y + item.len])}
            pathLength={1}
            className="st-drip"
            stroke={C[item.drip]}
            strokeWidth={5}
            strokeLinecap="round"
            style={{ animationDelay: `${delay + 0.6}s` }}
          />
        );
      }
      return (
        <g key={i} className={'cls' in item ? item.cls : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <g className="st-spray" style={{ animationDelay: `${delay}s` }} transform={item.t}>
            <Mark item={item} />
          </g>
        </g>
      );
    });
  const raw = (item: Item) => 'raw' in item && !!item.raw;
  return (
    <g>
      <g filter="url(#st-mist)" opacity={0.4}>
        {layer((item) => 'paint' in item && !raw(item))}
      </g>
      <g filter="url(#st-edge)">{layer((item) => !raw(item))}</g>
      {layer(raw)}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page sprays it afresh
  starts: Record<string, number>; //when each part began spraying, in seconds after it appeared
}

//new parts are sprayed one after another; on a fresh page they wait for the old one to fade
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
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, cue.page, 0.6) }, prev: shown };
}

//each part is a layer, and the ones with something moving in them get svgs of their own, so the spray filters on the
//rest of the wall aren't worked out again every frame
function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  const layers: Layer[] = shown.cue.parts.map((part) => {
    const items = ART[shown.cue.page][part];
    return {
      key: part,
      moving: items.some((item) => 'cls' in item && item.cls) ? part : undefined,
      node: <Part items={items} start={shown.starts[part] ?? 0} />,
    };
  });
  return <Layers viewBox={VIEW} layers={layers} className={leaving ? 'st-fade' : undefined} />;
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  station: new URL('./sounds/station.m4a', import.meta.url).href,
  window: new URL('./sounds/window.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//rain on the street, the station entrance on a dry night, and rain on the flat's window
function mixFor(cue: Cue): Partial<Record<Bed, number>> {
  if (cue.page === 'flat') return { window: 0.7 };
  if (cue.page === 'street') return cue.parts.includes('rain') ? { rain: 0.8, station: 0.25 } : { station: 0.7 };
  return { rain: 0.6 };
}

const COINS: OneShot = { src: new URL('./sounds/coins.m4a', import.meta.url).href, volume: 0.6, delay: 0.8 };
const BEEP: OneShot = { src: new URL('./sounds/beep.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 };
const ONE_SHOTS: Record<string, OneShot> = { give: COINS, ticket: BEEP, rough_food: BEEP };

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Stencil({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, cues[first].page, 0.6) },
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
    if (!cues[animation]) console.warn(`The Stranger has no cue for the animation "${animation}"`);
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
  const { card } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="st-edge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="st-mist" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 -1.2" result="dots" />
            <feComposite in="blur" in2="dots" operator="in" />
          </filter>
          <filter id="st-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -0.55" />
          </filter>
          <pattern id="st-brick" width="120" height="60" patternUnits="userSpaceOnUse">
            <path d="M 0 0.5 H 120 M 0 30.5 H 120 M 0.5 0 V 30 M 60.5 30 V 60" stroke={C.black} strokeWidth="1.5" fill="none" />
          </pattern>
          <linearGradient id="st-grime" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.black} stopOpacity="0.12" />
            <stop offset="0.25" stopColor={C.black} stopOpacity="0" />
            <stop offset="0.7" stopColor={C.black} stopOpacity="0" />
            <stop offset="1" stopColor={C.black} stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={C.wall} />
        <rect width={W} height={H} fill="url(#st-brick)" opacity={0.07} />
        <rect width={W} height={H} filter="url(#st-grain)" opacity={0.3} />
        <rect width={W} height={H} fill="url(#st-grime)" />
      </svg>
      {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
      <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />

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
.st-spray {
  animation: st-spray 0.45s ease-out both;
}
@keyframes st-spray {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  30% { opacity: 1; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
.st-drip {
  fill: none;
  stroke-dasharray: 1;
  animation: st-drip 2.5s ease-out both;
}
@keyframes st-drip {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
.st-fade {
  animation: st-fade 0.6s ease-in forwards;
}
@keyframes st-fade {
  to { opacity: 0; }
}
.st-fall {
  animation: st-fall 0.7s linear infinite;
}
@keyframes st-fall {
  from { transform: translate(0, -30px); }
  to { transform: translate(-12px, 30px); }
}
.st-trickle {
  animation: st-trickle 1.6s linear infinite;
}
@keyframes st-trickle {
  from { transform: translateY(-6px); opacity: 0.3; }
  50% { opacity: 1; }
  to { transform: translateY(6px); opacity: 0.3; }
}
.st-twinkle {
  animation: st-twinkle 3s ease-in-out infinite;
}
@keyframes st-twinkle {
  50% { opacity: 0.35; }
}
.st-pass {
  animation: st-pass 6s ease-in-out infinite alternate;
}
@keyframes st-pass {
  to { transform: translateX(24px); }
}
.st-rise {
  animation: st-rise 2s ease-in-out infinite;
}
@keyframes st-rise {
  from { transform: translateY(4px); opacity: 0.2; }
  50% { opacity: 1; }
  to { transform: translateY(-8px); opacity: 0; }
}
.st-shake {
  animation: st-shake 0.5s linear infinite;
}
@keyframes st-shake {
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.st-whoosh {
  animation: st-whoosh 1.2s ease-in infinite;
}
@keyframes st-whoosh {
  from { transform: translateX(-20px); opacity: 0; }
  40% { opacity: 1; }
  to { transform: translateX(40px); opacity: 0; }
}
.st-flicker {
  animation: st-flicker 1.4s steps(1) infinite;
}
@keyframes st-flicker {
  30% { opacity: 0.8; }
  60% { opacity: 1; }
  80% { opacity: 0.85; }
}
`;

const STENCIL = "Stencil, 'Stencil Std', 'Arial Black', Impact, sans-serif";

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.wall,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: STENCIL,
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: STENCIL,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 22,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.white,
    background: C.red,
    padding: '6px 14px',
  },
  name: {
    fontSize: 120,
    lineHeight: 1.15,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.black,
    textShadow: `0 0 18px ${C.black}55`,
  },
};

export default Stencil;
