import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Bad Day is drawn like the Sunday funnies: thick black ink, flat colour printed in Ben-Day dots and slightly out
// of register with the line work, sound effects in big outlined lettering, and speech balloons. The player is the one
// in a solid red jumper, never dotted, so they stand out on every panel. A cue names a page and the parts of it to
// show: parts already up stay put, new ones pop in after them, and turning to a new page knocks the old one off. While
// the clock runs, a watch in the corner counts the fictional minutes from 9:26 to half past. Everything is SVG in a
// fixed 1600x900 space, scaled to cover the screen. The pictures keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  paper: '#f7f0dc',
  black: '#1d1a17',
  red: '#d8392b',
  cyan: '#3a9fd0',
  magenta: '#d9467e',
  yellow: '#f2c230',
  green: '#3fa34d',
  grey: '#6d6a66',
  navy: '#2a3a6b',
  skin: '#f1c39a',
};
type Colour = keyof typeof C;
const DOTTED = Object.keys(C).filter((k) => !['paper', 'black', 'red', 'skin'].includes(k)) as Colour[];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'title' | 'bedroom' | 'car' | 'printer' | 'gary' | 'meeting' | 'call' | 'cafe' | 'home';
type Bed = 'traffic' | 'indicator' | 'office' | 'cafe' | 'home' | 'hold';
type Mix = Partial<Record<Bed, number>>;

interface Cue {
  page: Page;
  parts: string[]; //popped in this order
  card?: [kicker: string, name: string];
  mix?: Mix; //in place of the page's mix
}

const CAR = ['sky', 'road', 'dash', 'driver', 'light'];
const PRINTER = ['wall', 'board', 'you', 'printer'];
const CALL = ['you', 'phone', 'desk'];
const CAFE = ['room', 'you', 'jo', 'table'];
const HOLD: Mix = { office: 0.3, hold: 0.9 };

const cues: Record<string, Cue> = {
  title_card: { page: 'title', parts: ['cloud', 'rain', 'you'], card: ['A comedy of small disasters', 'The Bad Day'] },
  bedroom: { page: 'bedroom', parts: ['window', 'bed', 'you', 'phone', 'shock'] },
  car: { page: 'car', parts: ['sky', 'road', 'dash', 'driver'] },
  car_watch: { page: 'car', parts: ['sky', 'road', 'dash', 'driver', 'watch'] },
  lights: { page: 'car', parts: [...CAR, 'green', 'front'] },
  lights_horn: { page: 'car', parts: [...CAR, 'green', 'front', 'honk', 'creep'] },
  lights_red: { page: 'car', parts: [...CAR, 'red'] },
  printer: { page: 'printer', parts: PRINTER },
  printer_jam: { page: 'printer', parts: [...PRINTER, 'jam', 'clunk'] },
  printer_blank: { page: 'printer', parts: [...PRINTER, 'blank', 'huh'] },
  printer_going: { page: 'printer', parts: [...PRINTER, 'sheet', 'whirr'] },
  gary: { page: 'gary', parts: ['you', 'gary', 'partition', 'mug', 'quick'] },
  gary_more: { page: 'gary', parts: ['you', 'gary', 'partition', 'mug', 'also'] },
  gary_walk: { page: 'gary', parts: ['gary', 'partition', 'mug', 'going', 'trail'] },
  gary_sad: { page: 'gary', parts: ['you', 'gary_sad', 'partition', 'mug'] },
  meeting: { page: 'meeting', parts: ['clock', 'chairs', 'table', 'you', 'email'] },
  call: { page: 'call', parts: [...CALL, 'card'] },
  call_hold: { page: 'call', parts: [...CALL, 'balloon', 'notes', 'queue14'], mix: HOLD },
  call_dropped: { page: 'call', parts: [...CALL, 'beep'] },
  call_queue: { page: 'call', parts: [...CALL, 'balloon', 'notes', 'queue3'], mix: HOLD },
  call_leanne: { page: 'call', parts: [...CALL, 'leanne'] },
  call_four: { page: 'call', parts: [...CALL, 'leanne', 'four'] },
  call_note: { page: 'call', parts: [...CALL, 'leanne', 'note'] },
  call_ended: { page: 'call', parts: ['you', 'desk', 'hung_up', 'stuck'] },
  cafe: { page: 'cafe', parts: CAFE },
  cafe_plate: { page: 'cafe', parts: [...CAFE, 'pasta', 'huh'] },
  cafe_jo: { page: 'cafe', parts: [...CAFE, 'pasta', 'yell'] },
  jo_eat: { page: 'cafe', parts: [...CAFE, 'picked'] },
  jo_risotto: { page: 'cafe', parts: [...CAFE, 'risotto'] },
  jo_manager: { page: 'cafe', parts: [...CAFE, 'risotto', 'chef', 'chef_yell'] },
  home: { page: 'home', parts: ['window', 'rain', 'sofa', 'you'] },
  homework: { page: 'home', parts: ['window', 'rain', 'sofa', 'you', 'thought'] },
  goodbye: { page: 'title', parts: ['sun', 'alarms', 'you_up'], card: ['Tomorrow is another day', 'The Bad Day'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: ink lines, colour (flat or in dots, printed a little out of register) and lettering. A
//sound effect is big yellow lettering outlined in black. t is an svg transform, for anything at an angle
type Item =
  | { ink: string; w?: number; c?: Colour; cls?: string; t?: string }
  | { fill: Colour; d: string; dots?: boolean; cls?: string; t?: string }
  | { text: string; x: number; y: number; size: number; c?: Colour; sfx?: boolean; anchor?: 'start' | 'middle' | 'end'; cls?: string; t?: string };

const GAP = 0.16; //seconds between one part popping in and the next
const OFF = 'translate(5 4)'; //how far out of register the colour is printed

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
//a shouting balloon: n spikes round an ellipse
const jag = (x: number, y: number, rx: number, ry: number, n: number) =>
  poly(...Array.from({ length: n * 2 }, (_, i): Pt => {
    const a = (i * Math.PI) / n;
    const k = i % 2 ? 0.72 : 1;
    return [+(x + rx * k * Math.cos(a)).toFixed(1), +(y + ry * k * Math.sin(a)).toFixed(1)];
  }));
//a cloud, its flat bottom from x to x + 400 at y
const cloud = (x: number, y: number) => `M ${x} ${y} a 70 70 0 0 1 30 -120 a 90 90 0 0 1 160 -40 a 80 80 0 0 1 150 30 a 75 75 0 0 1 60 130 Z`;

//a coloured shape, inked round
const shape = (d: string, c: Colour, dots = false, w = 6): Item[] => [{ fill: c, d, dots }, { ink: d, w }];
const say = (text: string, x: number, y: number, size: number, c: Colour = 'black', anchor?: 'start' | 'end'): Item => ({ text, x, y, size, c, anchor });
const sfx = (text: string, x: number, y: number, size: number, rot: number, cls?: string): Item => ({ text, x, y, size, sfx: true, t: `rotate(${rot} ${x} ${y})`, cls });

//a speech balloon, its tail pointing at tip. The tail's base is covered so the balloon reads as one outline
function balloon(x: number, y: number, w: number, h: number, tip: Pt, lines: string[], size: number): Item[] {
  const bx = Math.min(Math.max(tip[0], x + 60), x + w - 60);
  const tail = poly([bx - 26, y + h - 4], tip, [bx + 26, y + h - 4]);
  return [
    { fill: 'paper', d: round(x, y, w, h, h / 2) },
    { ink: round(x, y, w, h, h / 2), w: 5 },
    { fill: 'paper', d: tail },
    { ink: line([bx - 26, y + h - 1], tip, [bx + 26, y + h - 1]), w: 5 },
    ...lines.map((l, i) => say(l, x + w / 2, y + h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * size * 1.05, size)),
  ];
}

type Mouth = 'flat' | 'o' | 'frown' | 'smile';
function face(x: number, y: number, r: number, mouth: Mouth): Item[] {
  const e = mouth === 'o' ? 0.13 : 0.09;
  const m = y + r * 0.45;
  const mouths: Record<Mouth, Item> = {
    flat: { ink: line([x - r * 0.25, m], [x + r * 0.25, m]), w: 5 },
    o: { fill: 'black', d: circle(x, m, r * 0.14) },
    frown: { ink: `M ${x - r * 0.25} ${m + r * 0.08} Q ${x} ${m - r * 0.15} ${x + r * 0.25} ${m + r * 0.08}`, w: 5 },
    smile: { ink: `M ${x - r * 0.28} ${m - r * 0.05} Q ${x} ${m + r * 0.25} ${x + r * 0.28} ${m - r * 0.05}`, w: 5 },
  };
  return [{ fill: 'black', d: `${circle(x - r * 0.35, y + r * 0.02, r * e)} ${circle(x + r * 0.35, y + r * 0.02, r * e)}` }, mouths[mouth]];
}
//a head of size r at x, y, with a cap of hair unless it's bald
const head = (x: number, y: number, r: number, mouth: Mouth, hair: Colour | null = 'black'): Item[] => [
  ...shape(circle(x, y, r), 'skin'),
  ...(hair ? shape(`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y} Q ${x} ${y - r * 0.45} ${x - r} ${y} Z`, hair, hair !== 'black') : []),
  ...face(x, y, r, mouth),
];
//head and shoulders, h tall, the shoulders' bottom edge at y. Everyone's shirt is dotted but the player's
function person(x: number, y: number, h: number, shirt: Colour, mouth: Mouth, hair: Colour | null = 'black'): Item[] {
  const body = `M ${x - h * 0.3} ${y} Q ${x - h * 0.3} ${y - h * 0.45} ${x} ${y - h * 0.45} Q ${x + h * 0.3} ${y - h * 0.45} ${x + h * 0.3} ${y} Z`;
  return [...shape(body, shirt, shirt !== 'red'), ...head(x, y - h * 0.72, h * 0.22, mouth, hair)];
}
const you = (x: number, y: number, h: number, mouth: Mouth) => person(x, y, h, 'red', mouth);

//a clock face at x, y with its hands at h:m
function clockFace(x: number, y: number, r: number, h: number, m: number): Item[] {
  const at = (turns: number, len: number): Pt => [+(x + len * Math.sin(turns * 2 * Math.PI)).toFixed(1), +(y - len * Math.cos(turns * 2 * Math.PI)).toFixed(1)];
  const ticks = Array.from({ length: 12 }, (_, i) => line(at(i / 12, r * 0.8), at(i / 12, r * 0.92))).join(' ');
  return [...shape(circle(x, y, r), 'paper'), { ink: `${ticks} ${line([x, y], at((h + m / 60) / 12, r * 0.5))} ${line([x, y], at(m / 60, r * 0.78))}`, w: 5 }];
}
const notes = (pts: Pt[], size: number): Item[] => pts.map(([x, y], i) => ({ ...say(i % 2 ? '♫' : '♪', x, y, size), cls: 'bd-float' }));
const speed = (x: number, y: number, dir: 1 | -1): Item => ({ ink: [0, 1, 2].map((i) => line([x, y + i * 50], [x + dir * (90 - i * 20), y + i * 50])).join(' '), w: 5 });

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

//Gary, bald but for two tufts, leaning over the partition
const gary = (mouth: Mouth) => [...person(1120, 580, 430, 'cyan', mouth, null), ...shape(`${ellipse(1027, 262, 14, 28)} ${ellipse(1213, 262, 14, 28)}`, 'grey', true, 4)];
const PRAWNS = (pts: Pt[]) => pts.flatMap(([x, y]): Item[] => shape(`M ${x - 22} ${y} a 22 16 0 1 1 44 0 l -12 0 a 10 8 0 1 0 -20 0 Z`, 'magenta', false, 3));

const ART: Record<Page, Record<string, Item[]>> = {
  title: {
    cloud: shape(cloud(1100, 330), 'grey', true),
    rain: [{ ink: [1140, 1190, 1240, 1290, 1340, 1390, 1440].map((x, i) => line([x, 350 + (i % 2) * 20], [x - 10, 380 + (i % 2) * 20])).join(' '), w: 5, c: 'cyan', cls: 'bd-fall' }],
    you: you(1300, 660, 260, 'frown'),
    sun: [
      { ink: Array.from({ length: 12 }, (_, i) => line([1300 + 110 * Math.cos(i * 0.5236), 230 + 110 * Math.sin(i * 0.5236)], [1300 + 150 * Math.cos(i * 0.5236), 230 + 150 * Math.sin(i * 0.5236)])).join(' '), w: 6, cls: 'bd-pulse' },
      ...shape(circle(1300, 230, 85), 'yellow'),
    ],
    alarms: [1140, 1460].flatMap((x): Item[] => [
      { ink: `M ${x - 44} ${470} l -14 -14 M ${x + 44} ${470} l 14 -14 ${line([x - 30, 590], [x - 40, 604])} ${line([x + 30, 590], [x + 40, 604])}`, w: 6 },
      ...shape(circle(x, 530, 66), 'yellow', true),
      ...clockFace(x, 530, 48, 7, 0),
    ]),
    you_up: you(1300, 660, 260, 'flat'),
  },

  bedroom: {
    window: [
      ...shape(rect(620, 90, 320, 220), 'cyan', true),
      { ink: Array.from({ length: 8 }, (_, i) => line([780 + 60 * Math.cos(i * 0.785), 200 + 60 * Math.sin(i * 0.785)], [780 + 90 * Math.cos(i * 0.785), 200 + 90 * Math.sin(i * 0.785)])).join(' '), w: 5 },
      ...shape(circle(780, 200, 44), 'yellow'),
      { ink: `${rect(620, 90, 320, 220)} ${line([780, 90], [780, 310])} ${line([620, 200], [940, 200])}`, w: 8 },
    ],
    bed: [
      ...shape(round(160, 280, 50, 340, 14), 'yellow', true),
      ...shape(round(200, 440, 820, 90, 10), 'paper'),
      ...shape(ellipse(330, 440, 110, 40), 'paper'),
      ...shape(round(420, 410, 600, 130, 24), 'cyan', true),
    ],
    you: head(330, 380, 64, 'o'),
    phone: [
      ...shape(rect(1080, 440, 200, 180), 'yellow', true),
      ...shape(round(1140, 300, 80, 140, 12), 'black'),
      ...shape(rect(1158, 330, 44, 80), 'paper', false, 3),
      { ink: rect(1166, 356, 28, 46), w: 3 },
      { fill: 'red', d: rect(1170, 394, 20, 5) },
      say('0%', 1180, 286, 34, 'red'),
    ],
    shock: [sfx('?!', 520, 240, 120, -8, 'bd-shake')],
  },

  car: {
    sky: shape(rect(40, 40, 1520, 300), 'cyan', true, 0),
    road: [
      ...shape(poly([740, 340], [860, 340], [1340, 580], [260, 580]), 'grey', true),
      { fill: 'paper', d: [rect(797, 350, 6, 16), rect(795, 385, 10, 26), rect(793, 430, 14, 38), rect(790, 495, 20, 56)].join(' ') },
    ],
    dash: shape(poly([0, 560], [1600, 560], [1600, 900], [0, 900]), 'grey', true),
    //the cab driver, from the back seat
    driver: [
      ...shape(poly([230, 900], [280, 650], [620, 650], [670, 900]), 'navy', false),
      ...shape(circle(450, 560, 105), 'black'),
    ],
    watch: [
      { ink: line([600, 540], [420, 380]), w: 4 },
      ...shape(circle(330, 300, 120), 'paper', false, 7),
      ...shape(round(240, 250, 180, 100, 16), 'yellow', true, 5),
      say('9:26', 330, 324, 76),
    ],
    light: [
      ...shape(rect(1230, 430, 20, 130), 'grey'),
      ...shape(round(1180, 120, 120, 310, 24), 'black'),
      ...[190, 280, 370].flatMap((y): Item[] => shape(circle(1240, y, 36), 'grey', true, 4)),
    ],
    green: [...shape(circle(1240, 370, 36), 'green', false, 4), { ink: 'M 1306 340 l 30 -14 M 1310 372 h 34 M 1306 402 l 30 14', w: 5 }],
    red: [...shape(circle(1240, 190, 36), 'magenta', false, 4), { ink: 'M 1306 160 l 30 -14 M 1310 192 h 34 M 1306 222 l 30 14', w: 5 }],
    front: [
      ...shape(poly([680, 250], [920, 250], [960, 336], [640, 336]), 'paper'),
      ...shape(poly([700, 262], [900, 262], [930, 326], [670, 326]), 'cyan', true, 4),
      ...shape(circle(790, 300, 30), 'grey', true, 4),
      { fill: 'yellow', d: rect(818, 296, 18, 26) },
      ...shape(round(580, 330, 440, 170, 36), 'cyan', true),
      ...shape(rect(600, 362, 60, 34), 'magenta', false, 4),
      ...shape(rect(940, 362, 60, 34), 'magenta', false, 4),
      ...shape(rect(740, 420, 120, 44), 'yellow', false, 4),
      say('HA HA', 800, 452, 32),
      ...shape(rect(610, 498, 60, 40), 'black'),
      ...shape(rect(930, 498, 60, 40), 'black'),
      { ...say('ha ha!', 880, 226, 34), cls: 'bd-bob' },
    ],
    honk: [sfx('HONK!', 400, 220, 130, -10, 'bd-shake')],
    creep: [...[[560, 520, 26], [520, 492, 34], [470, 456, 42]].flatMap(([x, y, r]) => shape(circle(x, y, r), 'grey', true, 4)), say('4 mph', 1080, 520, 44)],
  },

  printer: {
    wall: [{ ink: line([40, 580], [1560, 580]), w: 6 }],
    board: [
      ...shape(rect(110, 110, 280, 170), 'yellow', true),
      ...shape(rect(140, 130, 90, 70), 'paper', false, 3),
      ...shape(rect(260, 150, 100, 90), 'paper', false, 3),
      { fill: 'magenta', d: `${circle(185, 136, 7)} ${circle(310, 156, 7)}` },
    ],
    you: you(330, 680, 420, 'flat'),
    printer: [
      ...shape(poly([700, 190], [1140, 190], [1180, 240], [660, 240]), 'paper'),
      ...shape(round(640, 240, 560, 330, 24), 'grey', true),
      { ink: line([720, 215], [1120, 215]), w: 5 },
      ...shape(rect(1030, 280, 130, 64), 'cyan', true, 4),
      ...shape(rect(680, 380, 480, 150), 'paper', false, 5),
      { ink: line([880, 410], [960, 410]), w: 8 },
      say('1', 710, 420, 30),
    ],
    jam: [
      ...shape(round(620, 70, 600, 84, 18), 'paper', false, 5),
      say('PAPER JAM IN TRAY 2', 920, 128, 46),
      { ...say('ERR', 1095, 326, 40, 'magenta'), cls: 'bd-blink' },
    ],
    clunk: [sfx('CLUNK', 1330, 300, 100, 8)],
    blank: shape(poly([760, 215], [1080, 215], [1060, 90], [780, 90]), 'paper', false, 4),
    huh: [sfx('?', 1260, 200, 150, 10, 'bd-bob')],
    sheet: [
      ...shape(poly([760, 215], [1080, 215], [1060, 90], [780, 90]), 'paper', false, 4),
      { ink: [0, 1, 2, 3].map((i) => line([800 - i * 3, 120 + i * 24], [1040 - i * 3, 120 + i * 24])).join(' '), w: 3, c: 'cyan' },
    ],
    whirr: [sfx('whirr...', 1300, 270, 64, -6, 'bd-bob')],
  },

  gary: {
    you: you(330, 700, 460, 'flat'),
    gary: gary('smile'),
    gary_sad: gary('frown'),
    partition: [...shape(rect(620, 400, 940, 260), 'grey', true), ...shape(rect(606, 386, 968, 22), 'black')],
    mug: [
      { ink: 'M 1364 326 q 36 0 36 26 q 0 26 -36 26', w: 7 },
      ...shape(rect(1290, 308, 74, 80), 'yellow'),
      say('GARY', 1327, 358, 22),
    ],
    quick: balloon(640, 70, 400, 104, [1040, 220], ['Quick one!'], 56),
    also: balloon(560, 60, 470, 150, [1030, 220], ['Also, sorry,', 'also...'], 52),
    going: [...you(200, 700, 460, 'flat'), speed(380, 410, 1)],
    trail: [say('...and another thing', 760, 170, 46)],
  },

  meeting: {
    clock: clockFace(800, 140, 64, 9, 30),
    chairs: [400, 560, 720, 880, 1040, 1200].flatMap((x) => shape(round(x - 50, 290, 100, 150, 20), 'magenta', true, 5)),
    table: shape(poly([300, 420], [1300, 420], [1480, 600], [120, 600]), 'yellow', true),
    you: [...you(260, 660, 420, 'o'), speed(150, 300, -1)],
    email: [
      ...shape(round(1050, 90, 470, 140, 20), 'paper', false, 5),
      ...shape(rect(1080, 128, 80, 56), 'paper', false, 4),
      { ink: line([1080, 128], [1120, 160], [1160, 128]), w: 4 },
      say('Running 40 mins', 1180, 150, 36, 'black', 'start'),
      say('late, sorry!', 1180, 194, 36, 'black', 'start'),
    ],
  },

  call: {
    you: you(420, 660, 440, 'flat'),
    phone: shape(round(506, 250, 46, 110, 14), 'black'),
    desk: shape(rect(40, 580, 1520, 30), 'yellow', true),
    card: [
      ...shape(round(900, 170, 360, 220, 22), 'yellow', true),
      ...shape(rect(940, 226, 64, 48), 'paper', false, 4),
      ...shape(round(905, 270, 350, 80, 12), 'paper', false, 5).map((it) => ({ ...it, t: 'rotate(-12 1080 310)' })),
      { ...say('DECLINED', 1080, 330, 60, 'magenta'), t: 'rotate(-12 1080 310)' },
    ],
    balloon: balloon(640, 70, 600, 100, [560, 250], ['Your call is important to us'], 40),
    notes: notes([[620, 300], [700, 250], [660, 380]], 64),
    queue14: [...shape(circle(1340, 340, 96), 'yellow', true), say('No.', 1340, 304, 34), say('14', 1340, 384, 84)],
    queue3: [...shape(circle(1340, 340, 96), 'yellow', true), say('No.', 1340, 304, 34), say('3', 1340, 384, 84)],
    beep: [say('click.', 640, 230, 40), sfx('BEEEEEP', 960, 220, 110, -6, 'bd-shake')],
    leanne: [
      ...shape(circle(1220, 330, 170), 'paper', false, 8),
      ...person(1220, 498, 300, 'magenta', 'smile', 'yellow'),
      { ink: `M 1150 290 A 72 72 0 0 1 1290 290 M 1150 300 q 0 50 50 56`, w: 6 },
    ],
    four: [...clockFace(170, 150, 64, 4, 2), say('4:02', 170, 270, 46)],
    note: [
      { fill: 'yellow', d: rect(720, 100, 300, 180), t: 'rotate(-5 870 190)' },
      { ink: rect(720, 100, 300, 180), w: 4, t: 'rotate(-5 870 190)' },
      { ...say('NOTE ON', 870, 180, 46), t: 'rotate(-5 870 190)' },
      { ...say('YOUR ACCOUNT', 870, 232, 46), t: 'rotate(-5 870 190)' },
    ],
    hung_up: [...shape(round(700, 534, 130, 46, 12), 'black'), sfx('CLICK!', 780, 470, 84, 6)],
    stuck: notes([[290, 200], [420, 150], [550, 200]], 60),
  },

  cafe: {
    room: [
      ...shape(rect(100, 120, 230, 470), 'yellow', true),
      ...shape(circle(215, 240, 48), 'paper', false, 5),
      ...shape(rect(1310, 120, 210, 150), 'paper', false, 6),
      { ink: `${line([1330, 250], [1415, 150], [1500, 250])} M 1400 166 q 6 -24 26 -34`, w: 4 },
    ],
    you: you(620, 580, 380, 'flat'),
    jo: [
      ...person(1200, 620, 450, 'magenta', 'frown', 'yellow'),
      { ink: 'M 1153 316 h 24 M 1223 316 h 24', w: 4, c: 'magenta' },
      ...shape(rect(1230, 470, 76, 38), 'paper', false, 4),
      say('JO', 1268, 499, 28),
    ],
    table: [
      ...shape(poly([350, 520], [1170, 520], [1150, 640], [370, 640]), 'cyan', true),
      ...shape(ellipse(760, 520, 420, 76), 'cyan', true),
      ...shape(ellipse(760, 506, 140, 34), 'paper', false, 4),
    ],
    pasta: [...shape(ellipse(760, 500, 92, 22), 'yellow', true, 4), ...PRAWNS([[722, 494], [800, 498]])],
    huh: [sfx('?!', 470, 200, 110, -8, 'bd-shake')],
    yell: [...shape(jag(240, 120, 170, 70, 11), 'paper', false, 5), say('JO!!', 240, 142, 64)],
    picked: [...shape(ellipse(760, 500, 50, 14), 'yellow', true, 4), ...PRAWNS([[660, 506], [862, 506]])],
    risotto: [...shape(ellipse(760, 498, 82, 22), 'yellow', false, 4), { fill: 'green', d: `${circle(740, 490, 5)} ${circle(772, 494, 5)} ${circle(758, 504, 5)}` }],
    chef: [
      ...person(330, 640, 420, 'paper', 'frown', null),
      ...shape(round(274, 150, 112, 92, 34), 'paper', false, 6),
    ],
    chef_yell: [...shape(jag(560, 130, 160, 70, 11), 'paper', false, 5), say('JO!', 560, 152, 64)],
  },

  home: {
    window: [
      ...shape(rect(1060, 100, 380, 280), 'navy', true),
      { ink: `${rect(1060, 100, 380, 280)} ${line([1250, 100], [1250, 380])} ${line([1060, 240], [1440, 240])}`, w: 8 },
    ],
    rain: [{ ink: [1090, 1150, 1210, 1290, 1350, 1410].map((x, i) => `${line([x, 120 + (i % 2) * 40], [x - 8, 150 + (i % 2) * 40])} ${line([x - 10, 260 + (i % 2) * 30], [x - 18, 290 + (i % 2) * 30])}`).join(' '), w: 4, c: 'paper', cls: 'bd-fall' }],
    sofa: [
      ...shape(round(160, 300, 860, 150, 40), 'magenta', true),
      ...shape(round(140, 430, 900, 140, 40), 'magenta', true),
      ...shape(round(90, 340, 120, 230, 40), 'magenta', true),
      ...shape(round(970, 340, 120, 230, 40), 'magenta', true),
    ],
    you: [...shape(round(280, 360, 560, 90, 45), 'red'), ...shape(`${ellipse(270, 380, 22, 34)} ${ellipse(296, 420, 22, 34)}`, 'black'), ...head(890, 380, 62, 'flat')],
    thought: [
      ...shape(`${circle(870, 290, 10)} ${circle(840, 250, 16)} ${circle(800, 200, 22)}`, 'paper', false, 4),
      ...shape(cloud(480, 200), 'paper', false, 5),
      say('?', 680, 168, 90),
    ],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

function Mark({ item }: { item: Item }) {
  if ('text' in item) {
    const sfxStyle = item.sfx ? { fill: C.yellow, stroke: C.black, strokeWidth: 5, paintOrder: 'stroke', strokeLinejoin: 'round' as const } : { fill: C[item.c ?? 'black'] };
    return (
      <text x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} transform={item.t} style={{ ...styles.letters, fontSize: item.size, ...sfxStyle }}>
        {item.text}
      </text>
    );
  }
  if ('ink' in item) {
    return <path d={item.ink} transform={item.t} fill="none" stroke={C[item.c ?? 'black']} strokeWidth={item.w ?? 6} strokeLinecap="round" strokeLinejoin="round" />;
  }
  //colour is printed a little out of register with the ink, except paper and black
  const off = item.fill === 'paper' || item.fill === 'black' ? item.t : `${OFF} ${item.t ?? ''}`;
  return (
    <g transform={off}>
      {item.dots && <path d={item.d} fill={C.paper} />}
      <path d={item.d} fill={item.dots ? `url(#bd-dot-${item.fill})` : C[item.fill]} />
    </g>
  );
}

function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g className="bd-pop" style={{ animationDelay: `${start}s`, transformBox: 'fill-box', transformOrigin: 'center' }}>
      {items.map((item, i) => (
        <g key={i} className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <Mark item={item} />
        </g>
      ))}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page draws it afresh
  starts: Record<string, number>; //when each part pops in, in seconds after it appeared
}

//new parts pop in one after another; on a fresh page they wait for the old one to go
const startTimes = (parts: string[], from: number) => Object.fromEntries(parts.map((part, i) => [part, from + i * GAP]));

function turn(shown: Shown, cue: Cue): { now: Shown; prev?: Shown } {
  if (cue.page === shown.cue.page) {
    const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
    return { now: { ...shown, cue, starts: { ...shown.starts, ...startTimes(added, 0.05) } } };
  }
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, 0.35) }, prev: shown };
}

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'bd-out' : undefined}>
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

//the fictional time while the real clock runs: 9:26 when it starts, half past when it runs out
function Watch({ clock }: { clock: number }) {
  const minute = 30 - Math.ceil(clock * 4);
  return (
    <g>
      <rect x={1408} y={36} width={64} height={140} fill={C.black} />
      <rect x={1356} y={64} width={168} height={86} rx={18} fill={C.paper} stroke={C.black} strokeWidth={7} />
      <text x={1440} y={128} textAnchor="middle" fill={minute >= 29 ? C.red : C.black} style={{ ...styles.letters, fontSize: 60 }}>
        9:{minute}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS: Record<Bed, string> = {
  traffic: new URL('./sounds/traffic.m4a', import.meta.url).href,
  indicator: new URL('./sounds/indicator.m4a', import.meta.url).href,
  office: new URL('./sounds/office.m4a', import.meta.url).href,
  cafe: new URL('./sounds/cafe.m4a', import.meta.url).href,
  home: new URL('./sounds/home.m4a', import.meta.url).href,
  hold: new URL('./sounds/hold.m4a', import.meta.url).href,
};

//the street outside, the indicator ticking at the lights, the office, the hold music, the trattoria, rain at home
const MIX: Record<Page, Mix> = {
  title: { home: 0.5 },
  bedroom: { traffic: 0.25 },
  car: { traffic: 0.8, indicator: 0.6 },
  printer: { office: 0.8 },
  gary: { office: 0.8 },
  meeting: { office: 0.4 },
  call: { office: 0.6 },
  cafe: { cafe: 0.8 },
  home: { home: 0.8 },
};

const shot = (name: string, volume: number, delay: number): OneShot => ({ src: new URL(`./sounds/${name}.m4a`, import.meta.url).href, volume, delay });
const ONE_SHOTS: Record<string, OneShot> = {
  lights_horn: shot('horn', 0.6, 0.4),
  printer_jam: shot('boing', 0.6, 0.5),
  call_dropped: shot('whistle', 0.5, 0.5),
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.5; //seconds

// ---------------------------------------------------------------------------

function Funnies({ animation, clock }: { animation: string; clock?: number }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, 0.35) },
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
    if (!cues[animation]) console.warn(`The Bad Day has no cue for the animation "${animation}"`);
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
    const oneShot = ONE_SHOTS[active];
    if (oneShot) sound.current?.play(oneShot);
  }, [active]);

  const { now, prev } = view;
  const { card } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          {DOTTED.map((c) => (
            <pattern key={c} id={`bd-dot-${c}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <circle cx="6" cy="6" r="3.6" fill={C[c]} />
            </pattern>
          ))}
          <pattern id="bd-newsprint" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <circle cx="3.5" cy="3.5" r="1" fill={C.black} fillOpacity={0.06} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={C.paper} />
        <rect width={W} height={H} fill="url(#bd-newsprint)" />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
        {clock !== undefined && <Watch clock={clock} />}
        <rect x={30} y={30} width={W - 60} height={H - 60} rx={8} fill="none" stroke={C.black} strokeWidth={10} />
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
.bd-pop {
  animation: bd-pop 0.35s cubic-bezier(.3,1.6,.5,1) both;
}
@keyframes bd-pop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.bd-out {
  animation: bd-out 0.3s ease-in forwards;
}
@keyframes bd-out {
  to { opacity: 0; transform: translateX(-80px) rotate(-2deg); }
}
.bd-shake {
  animation: bd-shake 0.25s linear infinite;
}
@keyframes bd-shake {
  25% { transform: translate(-4px, 2px); }
  75% { transform: translate(4px, -2px); }
}
.bd-bob {
  animation: bd-bob 1.6s ease-in-out infinite;
}
@keyframes bd-bob {
  50% { transform: translateY(-10px); }
}
.bd-float {
  animation: bd-float 2.2s ease-in-out infinite;
}
.bd-float:nth-child(2n) {
  animation-delay: -1.1s;
}
@keyframes bd-float {
  50% { transform: translate(8px, -16px) rotate(8deg); }
}
.bd-fall {
  animation: bd-fall 0.6s linear infinite;
}
@keyframes bd-fall {
  from { transform: translateY(-10px); }
  to { transform: translateY(10px); }
}
.bd-blink {
  animation: bd-blink 0.9s steps(1) infinite;
}
@keyframes bd-blink {
  50% { opacity: 0; }
}
.bd-pulse {
  animation: bd-pulse 2.4s ease-in-out infinite;
}
@keyframes bd-pulse {
  50% { transform: scale(1.06); }
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
  letters: {
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
    fontFamily: 'var(--font-comic)',
    pointerEvents: 'none',
    transition: 'opacity 0.6s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 3,
    color: C.paper,
    background: C.black,
    padding: '4px 16px',
    transform: 'rotate(-2deg)',
  },
  name: {
    fontSize: 130,
    lineHeight: 1.1,
    letterSpacing: 4,
    color: C.yellow,
    WebkitTextStroke: `4px ${C.black}`,
    textShadow: `6px 6px 0 ${C.red}`,
  },
};

export default Funnies;
