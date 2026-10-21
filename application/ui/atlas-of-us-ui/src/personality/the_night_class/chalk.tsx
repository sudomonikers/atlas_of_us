import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Night Class is drawn in chalk on Room 14's blackboard. Lines are drawn stroke by stroke, with a faint halo of chalk
// dust round each one, shapes are coloured in as soft smudges, and writing is chalked on left to right. A grain of board
// shows through all of it, and old wiped-off chalk ghosts the board behind. The player is always in yellow. A cue names a
// page and the parts of it to show: parts already up stay put, new ones are drawn after them, and turning to a new page
// wipes the old one off. Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep to
// the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  board: '#26332d',
  white: '#efede4',
  yellow: '#f5e17c',
  pink: '#f3a5b6',
  blue: '#93cbe4',
  green: '#a9dba0',
  orange: '#f6b47b',
};
type Chalk = Exclude<keyof typeof C, 'board'>;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'board' | 'room' | 'ship' | 'self' | 'talk' | 'corridor' | 'pair' | 'door' | 'car_park';

interface Cue {
  page: Page;
  parts: string[]; //drawn in this order
  card?: [kicker: string, name: string];
  mix?: Partial<Record<Bed, number>>; //in place of the page's sound
}

const ROOM = ['window', 'clock', 'table', 'class', 'you', 'bea', 'clive', 'tin'];
const SHIPS = ['sea', 'ship_a', 'new_planks', 'ship_b', 'captions'];
const PAIR = ['table', 'you', 'bea', 'tea', 'handout'];
const DOOR = ['house', 'friend', 'man', 'knock', 'kant'];
const ARGUING = { room: 0.4, rain: 0.35, murmur: 0.45 };

const cues: Record<string, Cue> = {
  title_card: { page: 'board', parts: ['date', 'doodles'], card: ['Room 14, Wednesdays, 7pm', 'The Night Class'] },
  notice: { page: 'board', parts: ['date', 'heading', 'syllabus'] },
  room: { page: 'room', parts: ROOM },
  margaret: { page: 'room', parts: [...ROOM, 'margaret'] },
  ship: { page: 'ship', parts: ['sea', 'ship_a', 'new_planks', 'pile'] },
  ship_two: { page: 'ship', parts: SHIPS },
  vote_new: { page: 'ship', parts: [...SHIPS, 'tick_a'] },
  vote_old: { page: 'ship', parts: [...SHIPS, 'tick_b'] },
  vote_both: { page: 'ship', parts: [...SHIPS, 'both'] },
  vote_shrug: { page: 'ship', parts: [...SHIPS, 'shrug'] },
  self: { page: 'self', parts: ['kid', 'arrow', 'cells', 'adult'] },
  self_same: { page: 'self', parts: ['kid', 'arrow', 'cells', 'adult', 'same'] },
  clive: { page: 'talk', parts: ['clive_body', 'clive_arm', 'you'] },
  clive_talk: { page: 'talk', parts: ['clive_body', 'clive_arm', 'you', 'bubble'] },
  clive_wrong: { page: 'talk', parts: ['clive_body', 'clive_arm', 'you', 'bubble', 'backwards', 'nods'], mix: { room: 0.4, rain: 0.3, murmur: 0.3 } },
  clive_stopped: { page: 'talk', parts: ['clive_body', 'you_up', 'your_bubble'] },
  clive_on: { page: 'talk', parts: ['clive_body', 'clive_arm', 'you', 'bubble_more', 'dots'] },
  break: { page: 'corridor', parts: ['sign', 'counter', 'urn', 'mugs', 'tin', 'clive'] },
  pair: { page: 'pair', parts: PAIR },
  pair_lost: { page: 'pair', parts: [...PAIR, 'lost'] },
  pair_drawn: { page: 'pair', parts: [...PAIR, 'sketch', 'aha'] },
  pair_sheet: { page: 'pair', parts: [...PAIR, 'filled'] },
  door: { page: 'door', parts: DOOR.slice(0, 4) },
  door_kant: { page: 'door', parts: DOOR },
  line: { page: 'door', parts: [...DOOR, 'axis'], mix: ARGUING },
  cross_always: { page: 'door', parts: [...DOOR, 'axis', 'cross_always'], mix: ARGUING },
  cross_few: { page: 'door', parts: [...DOOR, 'axis', 'cross_few'], mix: ARGUING },
  cross_depends: { page: 'door', parts: [...DOOR, 'axis', 'cross_depends'], mix: ARGUING },
  cross_agree: { page: 'door', parts: [...DOOR, 'axis', 'cross_agree'], mix: ARGUING },
  bea: { page: 'room', parts: [...ROOM, 'margaret', 'bea_hand'] },
  bea_star: { page: 'room', parts: [...ROOM, 'margaret', 'bea_hand', 'quote'] },
  car_park: { page: 'car_park', parts: ['rain', 'ground', 'college', 'lamp', 'cars', 'group', 'you'] },
  homework: { page: 'board', parts: ['date', 'hw', 'hw_q', 'clock9'], mix: { room: 0.35, clock: 0.45 } },
  goodbye: { page: 'board', parts: ['date', 'doodles'], card: ['See you next Wednesday', 'The Night Class'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: chalk lines, smudged-in shapes and writing
type Item =
  | { fill: Chalk; d: string; o?: number; cls?: string }
  | { line: Chalk; d: string; w?: number; o?: number; dash?: string; cls?: string }
  | { text: string; c: Chalk; x: number; y: number; size: number; anchor?: 'start' | 'middle'; cls?: string };

const GAP = 0.1; //seconds between one stroke starting and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
//a wavy line from x1 to x2
const wave = (x1: number, x2: number, y: number, amp: number, step: number) =>
  `M ${x1} ${y} q ${step / 2} ${-amp} ${step} 0${` t ${step} 0`.repeat(Math.max(0, Math.floor((x2 - x1) / step) - 1))}`;
const star = (x: number, y: number, r: number) =>
  shape(...Array.from({ length: 10 }, (_, i): Pt => [x + Math.sin((i * Math.PI) / 5) * (i % 2 ? r * 0.45 : r), y - Math.cos((i * Math.PI) / 5) * (i % 2 ? r * 0.45 : r)]));
const words = (c: Chalk, text: string, x: number, y: number, size: number, anchor?: 'start'): Item => ({ c, text, x, y, size, anchor });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a chalk person: a round head on a rounded body, feet at (x, y), outlined and smudged in
function body(x: number, y: number, h: number) {
  const r = h * 0.15;
  const top = y - (h - 2 * r - 5);
  return `M ${x - h * 0.21} ${y} Q ${x - h * 0.23} ${top} ${x} ${top} Q ${x + h * 0.23} ${top} ${x + h * 0.21} ${y} Z ${circle(x, y - (h - r), r)}`;
}
const person = (x: number, y: number, h: number, c: Chalk): Item[] => [
  { fill: c, d: body(x, y, h) },
  { line: c, d: body(x, y, h) },
];
//head and shoulders, sitting behind a table at y
function shoulders(x: number, y: number, h: number) {
  return `M ${x - h * 0.3} ${y} Q ${x - h * 0.3} ${y - h * 0.45} ${x} ${y - h * 0.45} Q ${x + h * 0.3} ${y - h * 0.45} ${x + h * 0.3} ${y} ${circle(x, y - h * 0.72, h * 0.22)}`;
}
const bust = (x: number, y: number, h: number, c: Chalk): Item[] => [
  { fill: c, d: shoulders(x, y, h) },
  { line: c, d: shoulders(x, y, h) },
];

//a sailing ship sitting at (x, y), s times full size
function ship(x: number, y: number, s: number, c: Chalk): Item[] {
  const p = (dx: number, dy: number): Pt => [x + dx * s, y + dy * s];
  const hull = `M ${p(-180, -90).join(' ')} L ${p(200, -90).join(' ')} Q ${p(160, 0).join(' ')} ${p(0, 0).join(' ')} Q ${p(-150, 0).join(' ')} ${p(-180, -90).join(' ')} Z`;
  const sails = `${shape(p(8, -370), p(170, -120), p(8, -120))} ${shape(p(-8, -340), p(-140, -120), p(-8, -120))}`;
  return [
    { fill: c, d: hull, o: 0.14 },
    { line: c, d: hull },
    { line: c, d: `${line(p(0, -90), p(0, -390))} ${shape(p(0, -390), p(50, -375), p(0, -360))}`, w: 4 },
    { fill: c, d: sails, o: 0.1 },
    { line: c, d: sails, w: 4 },
    { line: c, d: `${line(p(-165, -62), p(186, -62))} ${line(p(-128, -32), p(150, -32))}`, w: 3, o: 0.7 },
  ];
}

//a mug with steam coming off it
const mug = (x: number, y: number, c: Chalk): Item[] => [
  { line: c, d: `${round(x, y, 60, 50, 8)} M ${x + 60} ${y + 10} q 22 0 22 15 t -22 15`, w: 4 },
  { line: 'white', d: `M ${x + 18} ${y - 10} q -10 -15 0 -30 t 0 -30 M ${x + 42} ${y - 10} q -10 -15 0 -30 t 0 -30`, w: 3, o: 0.5, cls: 'ch-sway' },
];

//someone under an umbrella, feet at (x, y)
const brolly = (x: number, y: number, h: number, c: Chalk): Item[] => [
  ...person(x, y, h, c),
  { fill: c, d: `M ${x - 90} ${y - h + 10} Q ${x} ${y - h - 110} ${x + 90} ${y - h + 10} Z`, o: 0.12 },
  { line: c, d: `M ${x - 90} ${y - h + 10} Q ${x} ${y - h - 110} ${x + 90} ${y - h + 10} Z ${line([x + 34, y - h + 4], [x + 34, y - h + 90])}`, w: 4 },
];

//diagonal streaks of rain over a box
const rain = (x: number, y: number, w: number, h: number, n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const [rx, ry] = [x + rand(i + seed) * w, y + rand(i + seed + 50) * h];
    return line([rx, ry], [rx - 8, ry + 26]);
  }).join(' ');

//a car parked side on, its front bumper at x
const car = (x: number) =>
  `M ${x} 510 v -36 q 0 -10 10 -12 l 34 -6 l 34 -32 h 90 l 38 32 l 30 6 q 10 2 10 12 v 36 Z ${circle(x + 54, 510, 20)} ${circle(x + 196, 510, 20)}`;

//a cross on the line from ALWAYS WRONG to IT DEPENDS
const cross = (x: number, s: number) => `M ${x - s} ${600 - s} L ${x + s} ${600 + s} M ${x + s} ${600 - s} L ${x - s} ${600 + s}`;
const mine = (x: number): Item[] => [{ line: 'yellow', d: cross(x, 24), w: 9 }];

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const BUBBLE = `${round(380, 50, 660, 290, 60)} ${line([1040, 230], [1090, 270], [1040, 290])}`;
const SCRIBBLE = (y: number): Item => ({ line: 'white', d: wave(440, 980, y, 12, 40), w: 3, o: 0.6 });
const HANDOUT = shape([660, 110], [940, 100], [950, 400], [670, 410]);

const ART: Record<Page, Record<string, Item[]>> = {
  board: {
    date: [words('white', 'Wed 14th January', 90, 80, 40, 'start'), { line: 'white', d: line([90, 96], [380, 96]), w: 3 }],
    doodles: [
      words('pink', '?', 250, 540, 150),
      ...ship(1330, 580, 0.4, 'blue'),
      { line: 'yellow', d: star(1400, 170, 44), w: 4 },
      { line: 'green', d: `${wave(170, 410, 210, 30, 80)} ${line([395, 195], [410, 210], [392, 222])}`, w: 4 },
    ],
    heading: [words('yellow', 'BIG QUESTIONS', 800, 170, 100), { line: 'yellow', d: wave(560, 1040, 200, 8, 40), w: 4 }],
    syllabus: [
      'Wk 1  The Ship of Theseus',
      'Wk 2  Is it ever right to lie?',
      'Wk 3  Do we have free will?',
      'Wk 4  What is a mind?',
      'Wk 5  Can a machine think?',
    ].map((topic, i) => words('white', topic, 560, 280 + i * 62, 44, 'start')),
    hw: [words('pink', 'HOMEWORK', 800, 170, 90), { line: 'pink', d: line([600, 196], [1000, 196]), w: 4 }],
    hw_q: [words('white', 'Are you the same person', 800, 300, 60), words('white', 'who walked in at seven?', 800, 380, 60)],
    clock9: [{ line: 'white', d: `${circle(1300, 520, 60)} ${line([1300, 520], [1262, 520])} ${line([1300, 520], [1300, 472])}`, w: 4 }],
  },

  room: {
    window: [
      { fill: 'blue', d: rect(60, 60, 260, 300), o: 0.08 },
      { line: 'white', d: `${rect(60, 60, 260, 300)} ${line([190, 60], [190, 360])} ${line([60, 210], [320, 210])}`, w: 5 },
      { line: 'blue', d: rain(70, 70, 240, 270, 26, 1), w: 2, o: 0.6, cls: 'ch-fall' },
    ],
    clock: [{ line: 'white', d: `${circle(500, 120, 50)} ${line([500, 120], [485, 146])} ${line([500, 120], [500, 82])}`, w: 4 }],
    table: [{ line: 'white', d: `${line([120, 480], [1260, 480])} ${line([120, 496], [1260, 496])} ${line([150, 496], [150, 600])} ${line([1230, 496], [1230, 600])}`, w: 5 }],
    class: ([[200, 'white'], [330, 'green'], [460, 'pink'], [850, 'white'], [1100, 'green']] as [number, Chalk][]).flatMap(([x, c]) => bust(x, 480, 150, c)),
    you: bust(590, 480, 160, 'yellow'),
    bea: bust(720, 480, 140, 'blue'),
    clive: bust(980, 480, 170, 'orange'),
    tin: [{ line: 'white', d: `${rect(1170, 446, 70, 34)} ${ellipse(1205, 446, 35, 8)}`, w: 3 }],
    margaret: [
      { line: 'white', d: rect(1240, 70, 330, 220), w: 4, o: 0.7 },
      words('white', '?', 1405, 210, 90),
      ...person(1420, 640, 300, 'green'),
      { line: 'green', d: line([1385, 420], [1330, 285]), w: 7 },
    ],
    bea_hand: [{ line: 'blue', d: `${line([745, 420], [770, 300])} ${circle(772, 288, 12)}`, w: 6 }],
    quote: [words('white', "What if you've got him wrong?", 840, 110, 46), { line: 'yellow', d: star(1165, 96, 30), w: 4 }],
  },

  ship: {
    sea: [{ line: 'blue', d: `${wave(60, 1540, 430, 14, 60)} ${wave(90, 1520, 470, 10, 60)}`, w: 4, o: 0.8 }],
    ship_a: ship(450, 440, 1, 'white'),
    new_planks: [
      { line: 'pink', d: `${line([330, 378], [410, 378])} ${line([490, 378], [580, 378])} ${line([370, 408], [470, 408])} ${line([510, 408], [590, 408])}`, w: 6 },
    ],
    pile: Array.from({ length: 8 }, (_, i): Item => {
      const [x, y, a] = [1050 + rand(i) * 200, 395 + rand(i + 9) * 30, (rand(i + 4) - 0.5) * 0.5];
      return { line: 'white', d: line([x - 60, y - a * 60], [x + 60, y + a * 60]), w: 7, o: 0.8 };
    }),
    ship_b: ship(1150, 440, 1, 'orange'),
    captions: [words('white', 'A: it kept sailing', 450, 520, 38), words('white', 'B: the old planks', 1150, 520, 38)],
    tick_a: [{ line: 'yellow', d: 'M 400 585 l 25 28 l 55 -60', w: 9 }, words('yellow', 'ME', 520, 612, 36)],
    tick_b: [{ line: 'yellow', d: 'M 1100 585 l 25 28 l 55 -60', w: 9 }, words('yellow', 'ME', 1220, 612, 36)],
    both: [words('yellow', '?', 800, 360, 200), { line: 'yellow', d: 'M 740 250 q -40 -60 -110 -40 M 860 250 q 40 -60 110 -40', w: 4 }],
    shrug: [words('yellow', 'DOES IT MATTER?', 800, 110, 52), { line: 'yellow', d: line([600, 130], [1000, 130]), w: 4 }],
  },

  self: {
    kid: [{ line: 'white', d: rect(230, 110, 300, 330), w: 6 }, ...person(380, 420, 200, 'white'), words('white', 'AGE 7', 380, 500, 40)],
    arrow: [{ line: 'white', d: `${line([600, 300], [1000, 300])} ${line([970, 280], [1000, 300], [970, 320])}`, w: 5 }],
    cells: [{ line: 'green', d: Array.from({ length: 10 }, (_, i) => circle(620 + i * 38, 300 + (i % 2 ? -40 : 40), 8 + rand(i) * 6)).join(' '), w: 3 }],
    adult: [...person(1150, 600, 380, 'yellow'), words('yellow', 'NOW', 1320, 300, 44)],
    same: [words('pink', 'SAME?', 800, 200, 80), words('white', 'what stays the same?', 800, 420, 40)],
  },

  talk: {
    clive_body: person(1150, 660, 440, 'orange'),
    clive_arm: [{ line: 'orange', d: `${line([1215, 340], [1300, 156])} ${circle(1305, 140, 18)}`, w: 9 }],
    you: person(260, 660, 260, 'yellow'),
    bubble: [{ fill: 'white', d: BUBBLE, o: 0.05 }, { line: 'white', d: BUBBLE, w: 4 }, words('white', '"With respect..."', 710, 130, 48), SCRIBBLE(190)],
    backwards: [
      { line: 'yellow', d: `${line([440, 250], [670, 250])} ${line([650, 236], [670, 250], [650, 264])}`, w: 5 },
      words('yellow', 'what you said', 555, 300, 30),
      { line: 'pink', d: `${line([980, 250], [750, 250])} ${line([770, 236], [750, 250], [770, 264])}`, w: 5 },
      words('pink', 'what he heard', 865, 300, 30),
    ],
    nods: [500, 620, 740, 860].map((x, i): Item => ({ ...bust(x, 660, 110, i % 2 ? 'white' : 'green')[1], cls: 'ch-nod' })),
    you_up: person(300, 660, 340, 'yellow'),
    your_bubble: [
      { line: 'yellow', d: `${round(420, 160, 520, 150, 50)} ${line([480, 310], [380, 345], [530, 310])}`, w: 4 },
      words('yellow', '"Actually, I said..."', 680, 255, 46),
    ],
    bubble_more: [{ fill: 'white', d: BUBBLE, o: 0.05 }, { line: 'white', d: BUBBLE, w: 4 }, words('white', '"And another thing..."', 710, 130, 48), SCRIBBLE(190), SCRIBBLE(240), SCRIBBLE(290)],
    dots: [{ ...words('yellow', '. . .', 260, 370, 60), cls: 'ch-blink' }],
  },

  corridor: {
    sign: [{ line: 'pink', d: rect(870, 70, 560, 64), w: 3 }, words('pink', 'NO FOOD OR DRINK IN ROOM 14', 1150, 114, 38)],
    counter: [{ line: 'white', d: `${line([120, 480], [1000, 480])} ${line([150, 480], [150, 620])} ${line([970, 480], [970, 620])}`, w: 5 }],
    urn: [
      { fill: 'white', d: round(300, 220, 150, 260, 30), o: 0.1 },
      { line: 'white', d: `${round(300, 220, 150, 260, 30)} ${rect(320, 200, 110, 20)} ${line([450, 420], [480, 420], [480, 440])}`, w: 4 },
      words('white', 'HOT', 375, 360, 34),
    ],
    mugs: [560, 660, 760].flatMap((x, i) => mug(x, 430, (['blue', 'pink', 'green'] as Chalk[])[i])),
    tin: [
      { line: 'white', d: `${rect(850, 440, 120, 40)} ${ellipse(930, 420, 62, 12)}`, w: 3 },
      { fill: 'white', d: Array.from({ length: 7 }, (_, i) => circle(866 + rand(i) * 90, 452 + rand(i + 3) * 20, 3)).join(' '), o: 0.6 },
    ],
    clive: [...person(1250, 640, 380, 'orange'), { line: 'yellow', d: circle(1305, 330, 22), w: 4 }],
  },

  pair: {
    table: [{ line: 'white', d: `${line([180, 500], [1420, 500])} ${line([180, 516], [1420, 516])} ${line([220, 516], [220, 620])} ${line([1380, 516], [1380, 620])}`, w: 5 }],
    you: bust(480, 500, 280, 'yellow'),
    bea: bust(1120, 500, 260, 'blue'),
    tea: [...mug(620, 450, 'pink'), ...mug(900, 450, 'green')],
    handout: [{ fill: 'white', d: HANDOUT, o: 0.07 }, { line: 'white', d: HANDOUT, w: 4 }, words('white', 'EXERCISE 2', 805, 160, 34)],
    lost: [
      { line: 'blue', d: `${ellipse(1320, 165, 150, 85)} ${circle(1200, 268, 12)} ${circle(1176, 298, 8)}`, w: 4 },
      ...ship(1280, 220, 0.28, 'blue'),
      words('pink', '?', 1400, 200, 80),
    ],
    sketch: ship(805, 345, 0.4, 'yellow'),
    aha: [words('yellow', '!', 1200, 230, 100)],
    filled: [{ line: 'white', d: Array.from({ length: 7 }, (_, i) => line([690, 205 + i * 28], [790 + rand(i) * 130, 205 + i * 28])).join(' '), w: 3, o: 0.7 }],
  },

  door: {
    house: [{ line: 'white', d: `${line([80, 520], [1520, 520])} ${line([640, 220], [640, 100], [1460, 100], [1460, 520])} ${line([610, 110], [1050, 20], [1490, 110])} ${shape([640, 220], [700, 250], [700, 500], [640, 520])}`, w: 5 }],
    friend: [
      { line: 'white', d: 'M 1050 520 V 400 q 0 -40 40 -40 H 1340 q 40 0 40 40 V 520', w: 5 },
      { fill: 'green', d: circle(1300, 345, 34) },
      { line: 'green', d: circle(1300, 345, 34), w: 4 },
    ],
    man: [
      ...person(470, 520, 300, 'white'),
      { line: 'white', d: `${line([418, 232], [522, 232])} ${rect(442, 196, 56, 36)}`, w: 5 },
      { line: 'white', d: `${shape([548, 400], [592, 382], [552, 410])} ${line([530, 406], [548, 400])}`, w: 4 },
    ],
    knock: [words('pink', 'KNOCK KNOCK', 260, 330, 46), { line: 'pink', d: 'M 600 300 q 12 15 0 30 M 615 290 q 18 25 0 50', w: 4 }],
    kant: [words('yellow', 'KANT: NEVER LIE.', 260, 110, 44), { line: 'yellow', d: `${circle(500, 92, 28)} ${circle(468, 104, 10)} ${circle(532, 104, 10)}`, w: 4 }],
    axis: [
      { line: 'white', d: `${line([250, 600], [1350, 600])} ${line([250, 584], [250, 616])} ${line([1350, 584], [1350, 616])}`, w: 5 },
      words('white', 'ALWAYS WRONG', 250, 572, 34),
      words('white', 'IT DEPENDS', 1350, 572, 34),
      { line: 'white', d: [470, 640, 760, 980, 1180, 1290].map((x) => cross(x, 13)).join(' '), w: 4, o: 0.7 },
      { line: 'orange', d: cross(275, 13), w: 5 },
    ],
    cross_always: mine(320),
    cross_few: mine(530),
    cross_depends: mine(1080),
    cross_agree: mine(1470),
  },

  car_park: {
    rain: [
      { line: 'blue', d: rain(0, 0, W, 640, 70, 11), w: 2, o: 0.5, cls: 'ch-fall' },
      { line: 'blue', d: rain(0, 0, W, 640, 70, 23), w: 2, o: 0.5, cls: 'ch-fall ch-late' },
    ],
    ground: [{ line: 'white', d: line([60, 520], [1560, 520]), w: 4 }],
    college: [
      { line: 'white', d: `${rect(90, 140, 760, 340)} ${Array.from({ length: 18 }, (_, i) => rect(130 + (i % 6) * 120, 180 + Math.floor(i / 6) * 95, 70, 60)).join(' ')}`, w: 3 },
      { fill: 'yellow', d: `${rect(370, 275, 70, 60)} ${rect(610, 180, 70, 60)}`, o: 0.35 },
      words('yellow', 'ROOM 14', 405, 110, 32),
      { line: 'yellow', d: `${line([405, 122], [405, 262])} ${line([393, 248], [405, 262], [417, 248])}`, w: 3 },
    ],
    lamp: [
      { fill: 'yellow', d: shape([1280, 150], [1340, 150], [1450, 520], [1170, 520]), o: 0.07 },
      { line: 'white', d: `${line([1250, 520], [1250, 130], [1310, 130])} ${shape([1286, 130], [1334, 130], [1342, 150], [1278, 150])}`, w: 5 },
    ],
    cars: [{ line: 'white', d: `${car(960)} ${car(1340)}`, w: 4, o: 0.8 }],
    group: ([[200, 'white'], [340, 'blue'], [480, 'orange'], [620, 'green']] as [number, Chalk][]).flatMap(([x, c]) => brolly(x, 640, 230, c)),
    you: brolly(800, 640, 240, 'yellow'),
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

//lines draw themselves along their length, with a wider, fainter pass underneath for the chalk dust
function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g>
      {items.map((item, i) => {
        const delay = { animationDelay: `${start + i * GAP}s` };
        let mark;
        if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]} className="ch-write" style={{ ...styles.type, fontSize: item.size, ...delay }}>
              {item.text}
            </text>
          );
        } else if ('line' in item) {
          const stroke = { d: item.d, fill: 'none', stroke: C[item.line], strokeLinecap: 'round', strokeLinejoin: 'round', style: delay } as const;
          mark = item.dash ? (
            <path {...stroke} className="ch-smudge" strokeWidth={item.w ?? 5} strokeOpacity={item.o ?? 0.92} strokeDasharray={item.dash} />
          ) : (
            <>
              <path {...stroke} className="ch-draw" pathLength={1} strokeWidth={(item.w ?? 5) * 2.6} strokeOpacity={0.1} />
              <path {...stroke} className="ch-draw" pathLength={1} strokeWidth={item.w ?? 5} strokeOpacity={item.o ?? 0.92} />
            </>
          );
        } else {
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 0.16} className="ch-smudge" style={delay} />;
        }
        return (
          <g key={i} className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
            {mark}
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

//new parts are drawn one after another; on a fresh page they wait for the old one to be wiped
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t += ART[page][part].length * GAP + 0.15;
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

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'ch-wipe' : undefined}>
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

//chalk that was wiped off long ago, never quite gone
const GHOSTS = Array.from({ length: 9 }, (_, i) => ellipse(100 + rand(i) * 1400, 80 + rand(i + 30) * 500, 160 + rand(i + 5) * 220, 40 + rand(i + 7) * 60)).join(' ');

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  clock: new URL('./sounds/clock.m4a', import.meta.url).href,
  murmur: new URL('./sounds/murmur.m4a', import.meta.url).href,
  night: new URL('./sounds/night.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the hum of an old classroom with rain on the windows, the corridor at the break, and the car park after
const QUIET = { room: 0.45, rain: 0.45, clock: 0.3 };
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  board: { room: 0.4, rain: 0.35 },
  room: { room: 0.45, rain: 0.5, clock: 0.35 },
  ship: QUIET,
  self: QUIET,
  talk: { room: 0.4, rain: 0.35, murmur: 0.15 },
  corridor: { murmur: 0.85, room: 0.3 },
  pair: { murmur: 0.45, room: 0.35, rain: 0.35 },
  door: QUIET,
  car_park: { night: 0.9 },
};

const CHALK: OneShot = { src: new URL('./sounds/chalk.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 };
const ONE_SHOTS: Record<string, OneShot> = {
  ...Object.fromEntries(
    ['notice', 'ship', 'ship_two', 'vote_new', 'vote_old', 'vote_both', 'vote_shrug', 'self_same', 'line', 'cross_always', 'cross_few', 'cross_depends', 'cross_agree', 'bea_star', 'homework'].map((cue) => [cue, CHALK]),
  ),
  door: { src: new URL('./sounds/knock.m4a', import.meta.url).href, volume: 0.7, delay: 0.8 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Chalkboard({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Night Class has no cue for the animation "${animation}"`);
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
          <pattern id="ch-grain" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="3" r="1.2" fill={C.board} />
            <circle cx="6.5" cy="7" r="0.8" fill={C.board} />
            <circle cx="7" cy="1.5" r="0.6" fill={C.board} />
          </pattern>
          <pattern id="ch-grain2" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
            <circle cx="4" cy="9" r="1.4" fill={C.board} />
            <circle cx="10" cy="3" r="0.9" fill={C.board} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={C.board} />
        <path d={GHOSTS} fill={C.white} fillOpacity={0.035} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
        <rect width={W} height={H} fill="url(#ch-grain)" opacity={0.6} pointerEvents="none" />
        <rect width={W} height={H} fill="url(#ch-grain2)" opacity={0.5} pointerEvents="none" />
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
.ch-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ch-draw 0.7s ease-in-out both;
}
@keyframes ch-draw {
  from { stroke-dashoffset: 1; opacity: 0; }
  5% { opacity: 1; }
  to { stroke-dashoffset: 0; opacity: 1; }
}
.ch-smudge {
  animation: ch-smudge 0.8s ease-out both;
}
@keyframes ch-smudge {
  from { opacity: 0; }
}
.ch-write {
  animation: ch-write 0.8s ease-out both;
}
@keyframes ch-write {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  10% { opacity: 1; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
.ch-wipe {
  animation: ch-wipe 0.6s ease-in forwards;
}
@keyframes ch-wipe {
  to { opacity: 0; transform: translateX(-40px); }
}
.ch-sway {
  animation: ch-sway 3s ease-in-out infinite;
}
@keyframes ch-sway {
  50% { transform: translateY(-6px); }
}
.ch-nod {
  animation: ch-nod 1.1s ease-in-out infinite;
}
@keyframes ch-nod {
  50% { transform: translateY(5px); }
}
.ch-blink {
  animation: ch-blink 1.6s ease-in-out infinite;
}
@keyframes ch-blink {
  50% { opacity: 0.3; }
}
.ch-fall {
  animation: ch-fall 0.8s linear infinite;
}
.ch-late {
  animation-delay: -0.4s;
}
@keyframes ch-fall {
  from { transform: translate(6px, -20px); opacity: 0; }
  50% { opacity: 1; }
  to { transform: translate(-6px, 20px); opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.board,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: 'var(--font-hand)',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: 'var(--font-hand)',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 30,
    color: C.yellow,
    borderBottom: `3px solid ${C.yellow}`,
    padding: '0 10px 4px',
    opacity: 0.9,
  },
  name: {
    fontSize: 140,
    lineHeight: 1.1,
    color: C.white,
    opacity: 0.92,
    textShadow: `0 0 10px ${C.white}55`,
  },
};

export default Chalkboard;
