import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Dare is Kit's action-camera footage: flat, sun-bleached travel-poster pictures with the camera's REC light,
// running timecode and corner marks over the top. Home, at either end of the trip, is off camera: a rainy bedroom and
// a postcard. The player is always the one in red, and Kit the one in blue. A cue names a page and the parts of it to
// show: parts already on the page stay put, new ones fade in after them, and turning to a new page fades the old one out.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep to the top two thirds,
// clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  night: '#16203a',
  navy: '#22325a',
  dusk: '#5b3a6e',
  sky: '#8fd3e8',
  haze: '#cfe9ef',
  sun: '#ffc94a',
  sand: '#f2c88a',
  clay: '#e07a4f',
  rust: '#b4502f',
  brown: '#6e3b2a',
  wood: '#9a5b36',
  green: '#4c9a5f',
  leaf: '#2f6b45',
  river: '#2fb4a6',
  stone: '#cdbda4',
  ink: '#1c1a24',
  cream: '#fff4e2',
  red: '#e8413c',
  blue: '#3b7fd1',
};
type Colour = keyof typeof C;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'postcard' | 'bedroom' | 'town' | 'napkin' | 'bridge' | 'road' | 'plane' | 'keepsakes';
const ON_CAMERA: Page[] = ['town', 'napkin', 'bridge', 'road'];

interface Cue {
  page: Page;
  parts: string[]; //faded in in this order
  card?: [kicker: string, name: string];
  mix?: Partial<Record<Bed, number>>; //in place of the page's sound, when the place changes under the same picture
}

const BRIDGE = ['gorge', 'bridge', 'man'];
const ROAD = ['sky', 'sea', 'road'];

const cues: Record<string, Cue> = {
  title_card: { page: 'postcard', parts: ['card', 'view', 'stamp'], card: ['Two weeks with Kit', 'The Dare'] },
  bedroom: { page: 'bedroom', parts: ['room'] },
  phone: { page: 'bedroom', parts: ['room', 'phone'] },
  packing: { page: 'bedroom', parts: ['room', 'bag_open'] },
  bag_shut: { page: 'bedroom', parts: ['room', 'bag_shut'] },
  bag_messy: { page: 'bedroom', parts: ['room', 'bag_messy'] },
  passport: { page: 'bedroom', parts: ['room', 'passport'] },
  town: { page: 'town', parts: ['sky', 'houses', 'you'] },
  lost: { page: 'town', parts: ['sky', 'houses', 'you_lost'] },
  lost_dark: { page: 'town', parts: ['sky', 'houses', 'dusk', 'you_lost'], mix: { town: 0.3, night: 0.8 } },
  found: { page: 'town', parts: ['sky', 'houses', 'dusk', 'door', 'corn', 'you_found'], mix: { town: 0.45, night: 0.7 } },
  napkin_kit: { page: 'napkin', parts: ['table', 'kit_list'] },
  napkin_both: { page: 'napkin', parts: ['table', 'kit_list', 'leaflets'] },
  bridge: { page: 'bridge', parts: BRIDGE },
  kit_jumps: { page: 'bridge', parts: [...BRIDGE, 'kit_fall'] },
  edge: { page: 'bridge', parts: [...BRIDGE, 'drop', 'you_edge'] },
  harness: { page: 'bridge', parts: [...BRIDGE, 'you_edge', 'ticks'] },
  you_jump: { page: 'bridge', parts: [...BRIDGE, 'you_fall'] },
  filming: { page: 'bridge', parts: [...BRIDGE, 'kit_fall', 'viewfinder'] },
  walk_off: { page: 'bridge', parts: [...BRIDGE, 'you_cliff'] },
  keys: { page: 'road', parts: [...ROAD, 'rails_still', 'parked', 'keys'], mix: { night: 1 } },
  road: { page: 'road', parts: [...ROAD, 'rails', 'bike'] },
  road_steady: { page: 'road', parts: [...ROAD, 'rails', 'bike'] },
  road_fast: { page: 'road', parts: [...ROAD, 'rails_fast', 'bike', 'faster'] },
  flat_out: { page: 'road', parts: [...ROAD, 'rails_flat', 'bike', 'streaks', 'faster'], mix: { bike: 0.65, night: 0.1 } },
  pulled_over: { page: 'road', parts: [...ROAD, 'rails_still', 'station', 'parked'], mix: { night: 1 } },
  plane: { page: 'plane', parts: ['cabin', 'window', 'screen'] },
  keepsakes: { page: 'keepsakes', parts: ['passport', 'photo', 'keyfob'] },
  goodbye: { page: 'postcard', parts: ['card', 'view', 'stamp'], card: ['Same time next year?', 'The Dare'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: flat shapes, lines, type, and soft glows. origin is where a cls animation scales from
type Item =
  | { fill: Colour; d: string; o?: number; cls?: string; origin?: string }
  | { line: Colour; d: string; w?: number; o?: number; dash?: string; cls?: string; origin?: string }
  | { text: string; c: Colour; x: number; y: number; size: number; cls?: string; origin?: string }
  | { glow: Colour; x: number; y: number; rx: number; ry: number; o?: number; cls?: string; origin?: string };

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

//a cut-out person: a round head on a rounded body, feet at (x, y). Upside down, for the bungee, the head hangs below
function body(x: number, y: number, h: number, down = false) {
  const s = down ? -1 : 1;
  const r = h * 0.15;
  const top = y - s * (h - 2 * r - 5);
  return `M ${x - h * 0.21} ${y} Q ${x - h * 0.23} ${top} ${x} ${top} Q ${x + h * 0.23} ${top} ${x + h * 0.21} ${y} Z ${circle(x, y - s * (h - r), r)}`;
}
const person = (x: number, y: number, h: number, fill: Colour, cls?: string): Item => ({ fill, d: body(x, y, h), cls });

//a line of writing in a script the player can't read: loops and dots
const squiggle = (x: number, y: number, w: number) =>
  `M ${x} ${y} ${Array.from({ length: Math.floor(w / 16) }, (_, i) => `q 4 ${rand(i + x) > 0.5 ? -12 : 10} 8 0 t 8 0`).join(' ')}`;

//someone on the end of a bungee rope from the bridge deck, bouncing
const DECK = 232;
const ROPE = 200;
const bungee = (x: number, fill: Colour): Item[] => [
  { line: 'ink', d: line([x, DECK], [x, DECK + ROPE]), w: 3, cls: 'dr-stretch', origin: `${x}px ${DECK}px` },
  { line: fill, d: `${line([x - 8, DECK + ROPE + 30], [x - 26, DECK + ROPE + 70])} ${line([x + 8, DECK + ROPE + 30], [x + 26, DECK + ROPE + 70])}`, w: 6, cls: 'dr-bounce' },
  { fill, d: body(x, DECK + ROPE, 90, true), cls: 'dr-bounce' },
];

//a side-on motorbike, front wheel at x
function motorbike(x: number, y: number): Item[] {
  return [
    { fill: 'ink', d: `${circle(x, y, 34)} ${circle(x - 190, y, 34)}` },
    { fill: 'stone', d: `${circle(x, y, 14)} ${circle(x - 190, y, 14)}` },
    { fill: 'red', d: shape([x - 170, y - 30], [x - 40, y - 46], [x - 10, y - 70], [x + 10, y - 66], [x - 20, y - 20], [x - 150, y - 10]) },
    { fill: 'ink', d: `${shape([x - 200, y - 46], [x - 90, y - 52], [x - 96, y - 38], [x - 196, y - 34])} ${rect(x - 6, y - 92, 8, 30)}` },
    { line: 'stone', d: `${line([x - 4, y - 70], [x, y])} ${line([x - 190, y], [x - 120, y - 24])}`, w: 6 },
    { fill: 'sun', d: circle(x + 12, y - 70, 9) },
  ];
}

//a key on a ring, with a tag
const keyring = (x: number, y: number, s: number, tag: string): Item[] => [
  { line: 'stone', d: circle(x, y, 30 * s), w: 8 * s },
  { fill: 'stone', d: `${circle(x + 70 * s, y + 70 * s, 34 * s)} ${shape([x + 90 * s, y + 90 * s], [x + 190 * s, y + 190 * s], [x + 176 * s, y + 204 * s], [x + 76 * s, y + 104 * s])}`, o: 1 },
  { fill: 'ink', d: circle(x + 62 * s, y + 62 * s, 10 * s) },
  { fill: 'red', d: round(x - 120 * s, y + 10 * s, 110 * s, 64 * s, 10 * s), o: 1 },
  words('cream', tag, x - 65 * s, y + 52 * s, 24 * s),
];

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 50 }, (_, i) => circle(rand(i) * W, rand(i + 70) * 330, 1.2 + rand(i + 9) * 2)).join(' ');
const RAIN = Array.from({ length: 26 }, (_, i) => line([930 + rand(i) * 340, 110 + rand(i + 30) * 280], [924 + rand(i) * 340, 140 + rand(i + 30) * 280])).join(' ');
//rows of hill houses, each row a little lower and nearer than the last
const HOUSES: [y: number, h: number, fill: Colour][] = [
  [380, 90, 'stone'],
  [470, 110, 'sand'],
  [570, 130, 'clay'],
];
//the road's markings and rail posts repeat every 200px, so sliding them one period loops cleanly
const RAILS = `${Array.from({ length: 10 }, (_, i) => rect(i * 200, 506, 10, 30)).join(' ')} ${rect(0, 500, 2000, 8)}`;
const DASHES = Array.from({ length: 10 }, (_, i) => rect(i * 200 + 40, 568, 100, 6)).join(' ');
const rails = (cls?: string): Item[] => [
  { fill: 'stone', d: RAILS, o: 0.8, cls },
  { fill: 'cream', d: DASHES, o: 0.9, cls },
];

const ART: Record<Page, Record<string, Item[]>> = {
  postcard: {
    card: [
      { fill: 'cream', d: shape([260, 70], [1340, 60], [1350, 600], [270, 612]), o: 1 },
      { line: 'clay', d: shape([290, 96], [1316, 87], [1324, 576], [298, 586]), w: 3, dash: '14 10' },
    ],
    view: [
      { fill: 'sky', d: rect(330, 130, 720, 420), o: 1 },
      { fill: 'sun', d: circle(860, 260, 64), o: 1 },
      { fill: 'clay', d: shape([330, 470], [500, 250], [640, 410], [760, 290], [940, 470], [1050, 390], [1050, 470]), o: 1 },
      { fill: 'rust', d: shape([330, 470], [420, 380], [520, 470]), o: 1 },
      { fill: 'river', d: rect(330, 470, 720, 80), o: 1 },
      { line: 'cream', d: [0, 1, 2].map((i) => `M ${380 + i * 230} ${500 + (i % 2) * 22} q 20 -10 40 0 t 40 0`).join(' '), w: 4, o: 0.8, cls: 'dr-shimmer' },
    ],
    stamp: [
      { fill: 'red', d: rect(1140, 120, 130, 160), o: 1 },
      { line: 'cream', d: rect(1150, 130, 110, 140), w: 3, dash: '6 6' },
      { fill: 'sun', d: circle(1205, 200, 34), o: 1 },
      { line: 'ink', d: `${circle(1120, 230, 70)} ${[0, 1, 2, 3].map((i) => `M ${1030} ${180 + i * 26} q 40 -16 80 0 t 80 0`).join(' ')}`, w: 3, o: 0.5 },
    ],
  },

  bedroom: {
    room: [
      { fill: 'night', d: rect(0, 0, W, 640), o: 1 },
      { fill: 'navy', d: rect(0, 560, W, 80), o: 1 },
      { fill: 'ink', d: rect(910, 90, 380, 320), o: 1 },
      { line: 'haze', d: RAIN, w: 2, o: 0.5, cls: 'dr-rain' },
      { line: 'stone', d: `${rect(910, 90, 380, 320)} ${line([1100, 90], [1100, 410])} ${line([910, 250], [1290, 250])}`, w: 12 },
      { glow: 'sun', x: 330, y: 300, rx: 300, ry: 260, o: 0.45 },
      { fill: 'sun', d: `${shape([290, 220], [370, 220], [395, 290], [265, 290])}`, o: 0.95 },
      { fill: 'stone', d: `${rect(326, 290, 8, 120)} ${rect(290, 410, 80, 14)}`, o: 1 },
      { fill: 'blue', d: rect(140, 470, 640, 120), o: 1 },
      { fill: 'cream', d: round(160, 440, 180, 50, 20), o: 1 },
      { fill: 'wood', d: `${rect(120, 400, 30, 200)} ${rect(780, 480, 24, 120)}`, o: 1 },
      { fill: 'clay', d: rect(480, 110, 200, 260), o: 0.9 },
      { fill: 'sun', d: circle(580, 200, 44), o: 1 },
      words('cream', 'GO!', 580, 330, 46),
    ],
    phone: [
      { fill: 'ink', d: round(620, 60, 360, 560, 40), o: 1 },
      { fill: 'cream', d: round(640, 110, 320, 460, 12), o: 1 },
      words('ink', 'KIT', 800, 150, 26),
      { fill: 'blue', d: round(660, 180, 280, 110, 22), o: 1 },
      words('cream', "Don't plan", 800, 228, 32),
      words('cream', 'anything.', 800, 268, 32),
      { fill: 'blue', d: round(660, 310, 240, 70, 22), o: 1 },
      words('cream', 'trust me', 780, 355, 30),
      { fill: 'stone', d: round(760, 420, 180, 70, 22), o: 1 },
      words('ink', 'ok...?', 850, 465, 30),
    ],
    bag_open: [
      { fill: 'ink', d: shape([300, 300], [560, 300], [600, 470], [260, 470]), o: 1 },
      { fill: 'red', d: rect(250, 470, 360, 90), o: 1 },
      { fill: 'cream', d: rect(280, 486, 90, 34), o: 1 },
      { fill: 'sun', d: rect(380, 482, 100, 38), o: 1 },
      { fill: 'green', d: rect(490, 488, 90, 32), o: 1 },
      { fill: 'cream', d: shape([640, 470], [760, 455], [770, 590], [650, 598]), o: 1 },
      { line: 'ink', d: [0, 1, 2, 3].map((i) => line([665, 490 + i * 24], [745, 486 + i * 24])).join(' '), w: 3, o: 0.6 },
    ],
    bag_shut: [
      { fill: 'red', d: round(1220, 400, 170, 220, 18), o: 1 },
      { line: 'ink', d: `M 1270 400 v -40 h 70 v 40 ${line([1250, 440], [1250, 600])} ${line([1360, 440], [1360, 600])}`, w: 8 },
      { fill: 'sun', d: rect(1380, 470, 40, 60), o: 1 },
    ],
    bag_messy: [
      { fill: 'red', d: shape([1220, 410], [1390, 395], [1400, 620], [1210, 620]), o: 1 },
      { fill: 'sun', d: shape([1300, 420], [1380, 340], [1400, 356], [1330, 430]), o: 1 },
      { fill: 'green', d: shape([1230, 430], [1170, 380], [1160, 400], [1222, 450]), o: 1 },
      { fill: 'cream', d: ellipse(1390, 560, 40, 14), o: 1 },
      { line: 'ink', d: 'M 1230 470 q 40 -10 80 6 t 80 -6', w: 6 },
    ],
    passport: [
      { fill: 'rust', d: shape([1240, 590], [1330, 580], [1340, 620], [1250, 628]), o: 1 },
      { fill: 'sun', d: circle(1290, 604, 10), o: 1 },
      { glow: 'sun', x: 1290, y: 604, rx: 120, ry: 40, o: 0.35 },
    ],
  },

  town: {
    sky: [
      { fill: 'dusk', d: rect(0, 0, W, 260), o: 1 },
      { fill: 'clay', d: rect(0, 260, W, 140), o: 1 },
      { fill: 'sun', d: rect(0, 400, W, 220), o: 1 },
      { fill: 'cream', d: circle(1240, 380, 70), o: 0.95 },
    ],
    houses: [
      ...HOUSES.map(([y, h, fill], row): Item => ({
        fill,
        d: Array.from({ length: 9 }, (_, i) => rect(i * 190 + row * 60 - 60 + rand(i + row * 10) * 40, y - h - rand(i * 3 + row) * 40, 150 + rand(i + 5) * 30, h + 160)).join(' '),
        o: 1,
      })),
      { fill: 'brown', d: Array.from({ length: 22 }, (_, i) => `M ${70 + i * 72} ${440 + (i % 3) * 30} v -22 a 12 12 0 0 1 24 0 v 22 Z`).join(' '), o: 0.8 },
      { fill: 'sand', d: rect(0, 560, W, 80), o: 1 },
      { fill: 'cream', d: `${rect(180, 470, 170, 44)} ${rect(1060, 450, 150, 40)} ${rect(1300, 490, 120, 36)}`, o: 1 },
      { line: 'rust', d: `${squiggle(196, 494, 136)} ${squiggle(1074, 472, 120)} ${squiggle(1312, 510, 96)}`, w: 3 },
      { line: 'ink', d: 'M 0 330 Q 400 400 800 340 T 1600 350', w: 2, o: 0.6 },
      { fill: 'red', d: Array.from({ length: 12 }, (_, i) => circle(60 + i * 135, 360 + Math.sin(i * 0.8) * 24, 12)).join(' '), o: 0.9, cls: 'dr-sway' },
      ...motorbike(520, 596).map((item) => ({ ...item, o: 0.9 })),
    ],
    you: [person(800, 610, 170, 'red')],
    you_lost: [
      person(800, 610, 170, 'red'),
      { fill: 'ink', d: round(850, 470, 34, 60, 6), o: 1 },
      { line: 'red', d: line([846, 466], [888, 534]), w: 5 },
      words('ink', '?', 720, 420, 60, 'dr-sway'),
      words('ink', '?', 900, 400, 44, 'dr-sway'),
    ],
    dusk: [
      { fill: 'night', d: rect(0, 0, W, 640), o: 0.6 },
      { fill: 'sun', d: Array.from({ length: 14 }, (_, i) => rect(60 + rand(i) * 1460, 280 + rand(i + 40) * 200, 22, 30)).join(' '), o: 0.9 },
      { fill: 'red', d: Array.from({ length: 12 }, (_, i) => circle(60 + i * 135, 360 + Math.sin(i * 0.8) * 24, 12)).join(' '), o: 1, cls: 'dr-sway' },
      { glow: 'sun', x: 800, y: 360, rx: 900, ry: 30, o: 0.4 },
    ],
    door: [
      { fill: 'blue', d: `M 420 610 V 440 a 60 60 0 0 1 120 0 V 610 Z`, o: 1 },
      { fill: 'sun', d: circle(520, 530, 6), o: 1 },
      { fill: 'cream', d: `${ellipse(380, 590, 34, 18)} ${circle(352, 568, 12)}`, o: 1 },
      { line: 'cream', d: `${line([362, 600], [362, 616])} ${line([400, 600], [400, 616])} M 346 558 q -6 -16 6 -20 M 356 558 q 4 -16 16 -16`, w: 4 },
    ],
    corn: [
      { fill: 'wood', d: `${rect(1050, 520, 160, 50)} ${circle(1070, 590, 18)} ${circle(1190, 590, 18)}`, o: 1 },
      { glow: 'clay', x: 1130, y: 510, rx: 110, ry: 50, o: 0.9, cls: 'dr-flicker' },
      { fill: 'sun', d: [0, 1, 2, 3].map((i) => ellipse(1080 + i * 34, 508, 8, 22)).join(' '), o: 1 },
      person(1270, 612, 160, 'green'),
    ],
    you_found: [person(640, 612, 170, 'red')],
  },

  napkin: {
    table: [
      { fill: 'wood', d: rect(0, 0, W, 660), o: 1 },
      { line: 'brown', d: Array.from({ length: 12 }, (_, i) => `M 0 ${30 + i * 56} q 400 ${rand(i) * 20 - 10} 800 0 t 800 0`).join(' '), w: 3, o: 0.5 },
      { fill: 'cream', d: `${circle(180, 140, 70)} ${circle(1440, 520, 70)}`, o: 1 },
      { fill: 'brown', d: `${circle(180, 140, 50)} ${circle(1440, 520, 50)}`, o: 1 },
      { fill: 'cream', d: ellipse(1440, 130, 110, 70), o: 0.9 },
      { fill: 'sun', d: shape([1380, 130], [1440, 90], [1500, 130], [1440, 160]), o: 1 },
    ],
    kit_list: [
      { fill: 'cream', d: shape([330, 90], [760, 70], [780, 590], [350, 610]), o: 1 },
      words('blue', "KIT'S LIST", 555, 160, 40),
      words('ink', 'CANYONING', 555, 250, 34),
      words('ink', 'CLIFF JUMPING', 555, 320, 34),
      words('red', 'BUNGEE!!!', 555, 400, 44),
      words('ink', 'NIGHT RIDE', 555, 480, 34),
      { line: 'blue', d: 'M 420 420 q 140 30 280 -10', w: 4 },
    ],
    leaflets: [
      { fill: 'sky', d: rect(850, 90, 250, 230), o: 1 },
      { fill: 'ink', d: `${rect(930, 170, 90, 60)} ${rect(1010, 180, 40, 10)}`, o: 1 },
      words('ink', 'COOKING', 975, 290, 28),
      { fill: 'haze', d: rect(1130, 110, 250, 230), o: 1 },
      { fill: 'blue', d: `${shape([1190, 250], [1320, 250], [1300, 280], [1210, 280])} ${shape([1255, 160], [1255, 240], [1310, 240])}`, o: 1 },
      words('ink', 'BOAT TRIP', 1255, 315, 28),
      { fill: 'sand', d: rect(870, 360, 250, 230), o: 1 },
      { fill: 'rust', d: `M 930 520 V 450 h 20 v 16 h 20 v -16 h 20 v 16 h 20 v -16 h 20 v 16 h 20 v -16 h 20 V 520 Z`, o: 1 },
      words('ink', 'OLD FORT', 995, 565, 28),
      { fill: 'river', d: rect(1150, 380, 250, 230), o: 1 },
      { fill: 'red', d: 'M 1210 480 a 65 50 0 0 1 130 0 Z', o: 1 },
      { line: 'cream', d: line([1275, 480], [1275, 550]), w: 5 },
      words('ink', 'BEACH', 1275, 590, 28),
    ],
  },

  bridge: {
    gorge: [
      { fill: 'sky', d: rect(0, 0, W, 640), o: 1 },
      { fill: 'haze', d: shape([300, 300], [520, 150], [700, 260], [900, 120], [1120, 240], [1300, 300]), o: 1 },
      { fill: 'river', d: rect(0, 560, W, 80), o: 1 },
      { line: 'cream', d: Array.from({ length: 8 }, (_, i) => `M ${420 + i * 100} ${585 + (i % 2) * 22} q 15 -8 30 0 t 30 0`).join(' '), w: 3, o: 0.8, cls: 'dr-flow' },
      { fill: 'clay', d: `${shape([0, 240], [340, 240], [380, 330], [350, 450], [400, 560], [420, 640], [0, 640])} ${shape([W, 240], [1260, 240], [1220, 330], [1250, 450], [1200, 560], [1180, 640], [W, 640])}`, o: 1 },
      { line: 'rust', d: `${line([0, 330], [370, 330])} ${line([0, 450], [350, 450])} ${line([W, 330], [1225, 330])} ${line([W, 450], [1250, 450])}`, w: 6, o: 0.6 },
      { fill: 'leaf', d: [60, 140, 220, 1340, 1430, 1520].map((x, i) => circle(x, 210 - (i % 2) * 14, 36)).join(' '), o: 1 },
    ],
    bridge: [
      { fill: 'stone', d: `${rect(548, 236, 30, 330)} ${rect(1022, 236, 30, 330)}`, o: 1 },
      { fill: 'ink', d: rect(0, DECK - 8, W, 12), o: 1 },
      { line: 'ink', d: `${line([340, 170], [1260, 170])} ${Array.from({ length: 11 }, (_, i) => `${line([340 + i * 92, 170], [340 + i * 92, DECK])} ${i < 10 ? line([340 + i * 92, i % 2 ? DECK : 170], [432 + i * 92, i % 2 ? 170 : DECK]) : ''}`).join(' ')}`, w: 5 },
    ],
    man: [
      person(880, DECK - 4, 92, 'green'),
      { fill: 'cream', d: rect(898, DECK - 64, 18, 24), o: 1 },
      { fill: 'blue', d: rect(930, DECK - 34, 40, 30), o: 1 },
    ],
    kit_fall: bungee(720, 'blue'),
    drop: [
      { line: 'cream', d: line([660, DECK + 10], [660, 560]), w: 3, dash: '10 10' },
      words('cream', '200ft', 620, 400, 34),
    ],
    you_edge: [person(780, DECK - 4, 92, 'red')],
    ticks: [
      { fill: 'cream', d: round(1000, 270, 180, 200, 12), o: 1 },
      { line: 'green', d: [0, 1, 2, 3].map((i) => `M 1022 ${312 + i * 40} l 10 12 l 20 -22`).join(' '), w: 5 },
      { line: 'ink', d: [0, 1, 2, 3].map((i) => line([1066, 316 + i * 40], [1156, 316 + i * 40])).join(' '), w: 3, o: 0.5 },
    ],
    you_fall: bungee(760, 'red'),
    viewfinder: [
      { line: 'cream', d: ['M 600 300 h 40 M 600 300 v 40', 'M 840 300 h -40 M 840 300 v 40', 'M 600 560 h 40 M 600 560 v -40', 'M 840 560 h -40 M 840 560 v -40'].join(' '), w: 5 },
      { fill: 'red', d: circle(620, 320, 6), o: 1, cls: 'dr-blink' },
    ],
    you_cliff: [person(200, 240, 92, 'red')],
  },

  road: {
    sky: [
      { fill: 'night', d: rect(0, 0, W, 640), o: 1 },
      { fill: 'cream', d: STARS, o: 0.8, cls: 'dr-blink-slow' },
      { glow: 'cream', x: 1250, y: 150, rx: 160, ry: 160, o: 0.35 },
      { fill: 'cream', d: circle(1250, 150, 54), o: 1 },
    ],
    sea: [
      { fill: 'navy', d: rect(0, 360, W, 140), o: 1 },
      { line: 'cream', d: Array.from({ length: 7 }, (_, i) => line([1250 - 70 + rand(i) * 40, 380 + i * 16], [1250 + 30 + rand(i + 9) * 50, 380 + i * 16])).join(' '), w: 4, o: 0.7, cls: 'dr-shimmer' },
    ],
    road: [
      { fill: 'ink', d: rect(0, 500, W, 140), o: 1 },
      { fill: 'stone', d: rect(0, 632, W, 8), o: 0.4 },
    ],
    rails_still: rails(),
    rails: rails('dr-scroll'),
    rails_fast: rails('dr-scroll dr-fast'),
    rails_flat: rails('dr-scroll dr-flat'),
    bike: (
      [
        { fill: 'cream', d: shape([830, 520], [1500, 470], [1500, 620], [830, 540]), o: 0.18 },
        ...motorbike(820, 596),
        person(700, 556, 130, 'red'),
        { fill: 'red', d: circle(700, 450, 24), o: 1 },
        person(630, 556, 130, 'blue'),
        { fill: 'blue', d: circle(630, 450, 24), o: 1 },
      ] as Item[]
    ).map((item) => ({ ...item, cls: 'dr-rumble' })),
    faster: [
      { line: 'blue', d: `${line([612, 480], [580, 400])} ${line([648, 480], [670, 400])}`, w: 12, cls: 'dr-rumble' },
      words('sun', 'FASTER!', 560, 360, 56, 'dr-shake'),
    ],
    streaks: [{ line: 'cream', d: Array.from({ length: 14 }, (_, i) => line([rand(i) * W, 380 + rand(i + 3) * 240], [rand(i) * W + 160 + rand(i + 5) * 200, 380 + rand(i + 3) * 240])).join(' '), w: 3, o: 0.5, cls: 'dr-streak' }],
    parked: [
      ...motorbike(820, 596),
      { line: 'stone', d: line([700, 600], [680, 630]), w: 5 },
      person(980, 612, 170, 'red'),
      person(1070, 612, 170, 'blue'),
    ],
    keys: keyring(1300, 120, 1.1, 'RENTAL 7'),
    station: [
      { fill: 'stone', d: `${rect(1180, 300, 380, 30)} ${rect(1200, 330, 20, 240)} ${rect(1520, 330, 20, 240)}`, o: 1 },
      { glow: 'cream', x: 1370, y: 360, rx: 240, ry: 90, o: 0.6 },
      { fill: 'sun', d: round(1240, 500, 240, 80, 24), o: 1 },
      { fill: 'ink', d: `${circle(1290, 590, 20)} ${circle(1430, 590, 20)} ${rect(1300, 510, 140, 30)}`, o: 1 },
    ],
  },

  plane: {
    cabin: [
      { fill: 'stone', d: rect(0, 0, W, 640), o: 1 },
      { fill: 'haze', d: rect(0, 0, W, 60), o: 1 },
      { fill: 'navy', d: `${round(900, 120, 300, 520, 60)} ${round(1240, 120, 300, 520, 60)}`, o: 1 },
    ],
    window: [
      { fill: 'cream', d: round(280, 100, 360, 480, 160), o: 1 },
      { fill: 'clay', d: round(310, 130, 300, 420, 140), o: 1 },
      { fill: 'sun', d: rect(310, 330, 300, 80), o: 0.9 },
      { fill: 'cream', d: `${ellipse(380, 440, 90, 26)} ${ellipse(540, 470, 100, 30)} ${ellipse(430, 510, 120, 30)}`, o: 0.95, cls: 'dr-drift' },
      { fill: 'stone', d: shape([380, 400], [610, 360], [610, 400], [440, 420]), o: 1 },
    ],
    screen: [
      { fill: 'ink', d: rect(1000, 220, 120, 90), o: 1 },
      { fill: 'clay', d: shape([1020, 300], [1060, 240], [1100, 300]), o: 1 },
      { fill: 'red', d: `${shape([1050, 255], [1060, 240], [1070, 255])} ${circle(1060, 230, 8)}`, o: 1, cls: 'dr-flicker' },
    ],
  },

  keepsakes: {
    passport: [
      { fill: 'rust', d: shape([220, 160], [600, 140], [620, 560], [240, 580]), o: 1 },
      { fill: 'cream', d: shape([250, 180], [580, 166], [596, 540], [266, 556]), o: 1 },
      { line: 'blue', d: `${circle(350, 280, 50)} ${squiggle(316, 284, 64)}`, w: 4, o: 0.8 },
      { line: 'red', d: `${rect(430, 380, 120, 80)} ${squiggle(440, 424, 96)}`, w: 4, o: 0.8 },
      { line: 'green', d: circle(330, 450, 40), w: 4, o: 0.8 },
    ],
    photo: [
      { fill: 'cream', d: shape([720, 120], [1020, 140], [1000, 520], [700, 500]), o: 1 },
      { fill: 'sky', d: shape([738, 140], [1002, 158], [988, 420], [722, 404]), o: 1 },
      { fill: 'clay', d: `${shape([722, 404], [722, 240], [800, 250], [790, 405])} ${shape([988, 420], [994, 260], [920, 260], [920, 416])}`, o: 1 },
      { line: 'ink', d: line([722, 250], [998, 268]), w: 5 },
      { line: 'ink', d: line([860, 260], [858, 340]), w: 2 },
      { fill: 'red', d: body(858, 340, 50, true), o: 1 },
    ],
    keyfob: keyring(1220, 220, 1, 'RENTAL 7'),
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
        if ('glow' in item) {
          mark = <ellipse cx={item.x} cy={item.y} rx={item.rx} ry={item.ry} fill={`url(#dr-glow-${item.glow})`} opacity={item.o ?? 0.6} style={styles.screen} />;
        } else if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor="middle" fill={C[item.c]} style={{ ...styles.type, fontSize: item.size }}>
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
              strokeDasharray={item.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        } else {
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 0.95} />;
        }
        return (
          <g key={i} className="dr-in" style={{ animationDelay: `${start + i * GAP}s` }}>
            <g className={item.cls} style={item.origin ? { transformBox: 'view-box', transformOrigin: item.origin } : undefined}>
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
    <g className={leaving ? 'dr-leave' : undefined}>
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

//the camera's overlay: REC, a running timecode, and corner marks
function Hud() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={styles.hud}>
      <div style={styles.vignette} />
      <div style={{ ...styles.corner, top: 24, left: 24, borderWidth: '3px 0 0 3px' }} />
      <div style={{ ...styles.corner, top: 24, right: 24, borderWidth: '3px 3px 0 0' }} />
      <div style={{ ...styles.corner, bottom: '34%', left: 24, borderWidth: '0 0 3px 3px' }} />
      <div style={{ ...styles.corner, bottom: '34%', right: 24, borderWidth: '0 3px 3px 0' }} />
      <div style={{ ...styles.readout, left: 48 }}>
        <span className="dr-blink" style={styles.rec}>●</span> REC {pad(Math.floor(seconds / 3600))}:{pad(Math.floor(seconds / 60) % 60)}:{pad(seconds % 60)}
      </div>
      <div style={{ ...styles.readout, right: 48 }}>KIT CAM ▮▮▯</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  town: new URL('./sounds/town.m4a', import.meta.url).href,
  night: new URL('./sounds/night.m4a', import.meta.url).href,
  gorge: new URL('./sounds/gorge.m4a', import.meta.url).href,
  bike: new URL('./sounds/bike.m4a', import.meta.url).href,
  plane: new URL('./sounds/plane.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//rain at home either end, the town's chatter, the river in the gorge, and the bike under the cicadas
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  postcard: { rain: 0.3 },
  bedroom: { rain: 0.6 },
  town: { town: 0.85, night: 0.2 },
  napkin: { town: 0.45 },
  bridge: { gorge: 0.9 },
  road: { bike: 0.35, night: 0.5 },
  plane: { plane: 0.8 },
  keepsakes: { rain: 0.4 },
};

const WHOOSH = new URL('./sounds/whoosh.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  kit_jumps: { src: WHOOSH, volume: 0.6, delay: 1 },
  you_jump: { src: WHOOSH, volume: 0.6, delay: 0.3 },
  filming: { src: WHOOSH, volume: 0.5, delay: 1 },
  road: { src: new URL('./sounds/kickstart.m4a', import.meta.url).href, volume: 0.8, delay: 0 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function KitCam({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Dare has no cue for the animation "${animation}"`);
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
          {(Object.keys(C) as Colour[]).map((c) => (
            <radialGradient key={c} id={`dr-glow-${c}`}>
              <stop offset="0%" stopColor={C[c]} stopOpacity={0.9} />
              <stop offset="100%" stopColor={C[c]} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        <rect width={W} height={H} fill={C.ink} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
      </svg>

      {ON_CAMERA.includes(now.cue.page) && <Hud />}
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
.dr-in {
  opacity: 0;
  animation: dr-in 0.5s ease-out forwards;
}
@keyframes dr-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.dr-leave {
  animation: dr-leave 0.5s ease forwards;
}
@keyframes dr-leave {
  to { opacity: 0; }
}
.dr-blink {
  animation: dr-blink 1s steps(1) infinite;
}
@keyframes dr-blink {
  50% { opacity: 0; }
}
.dr-blink-slow, .dr-shimmer {
  animation: dr-fade 3s ease-in-out infinite;
}
.dr-flicker {
  animation: dr-fade 0.8s ease-in-out infinite;
}
@keyframes dr-fade {
  50% { opacity: 0.4; }
}
.dr-sway {
  animation: dr-sway 3s ease-in-out infinite;
}
@keyframes dr-sway {
  50% { transform: translateY(-6px); }
}
.dr-rain {
  animation: dr-rain 0.7s linear infinite;
}
@keyframes dr-rain {
  from { transform: translateY(-30px); }
  to { transform: translateY(30px); }
}
.dr-flow {
  animation: dr-flow 4s linear infinite;
}
@keyframes dr-flow {
  to { transform: translateX(60px); }
}
.dr-drift {
  animation: dr-drift 6s linear infinite;
}
@keyframes dr-drift {
  from { transform: translateX(60px); }
  to { transform: translateX(-60px); }
}
/* the bungee: the rope stretches from the deck while the jumper drops the same distance */
.dr-bounce {
  animation: dr-bounce 1.4s ease-in-out infinite alternate;
}
@keyframes dr-bounce {
  to { transform: translateY(30px); }
}
.dr-stretch {
  animation: dr-stretch 1.4s ease-in-out infinite alternate;
}
@keyframes dr-stretch {
  to { transform: scaleY(1.15); }
}
/* the road's markings slide one 200px period, quicker the faster the bike */
.dr-scroll {
  animation: dr-scroll 1.2s linear infinite;
}
.dr-scroll.dr-fast {
  animation-duration: 0.5s;
}
.dr-scroll.dr-flat {
  animation-duration: 0.2s;
}
@keyframes dr-scroll {
  to { transform: translateX(-200px); }
}
.dr-rumble {
  animation: dr-rumble 0.25s linear infinite;
}
@keyframes dr-rumble {
  50% { transform: translateY(-2px); }
}
.dr-shake {
  animation: dr-shake 0.3s linear infinite;
}
@keyframes dr-shake {
  25% { transform: translate(-3px, 2px); }
  75% { transform: translate(3px, -2px); }
}
.dr-streak {
  animation: dr-streak 0.4s linear infinite;
}
@keyframes dr-streak {
  from { transform: translateX(300px); }
  to { transform: translateX(-300px); }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.ink,
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
  hud: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    color: C.cream,
    fontFamily: 'monospace',
    fontSize: 18,
    letterSpacing: 2,
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45) 100%)',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderStyle: 'solid',
    borderColor: C.cream,
    opacity: 0.85,
  },
  readout: {
    position: 'absolute',
    top: 40,
  },
  rec: {
    color: C.red,
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
    color: C.cream,
    background: C.rust,
    padding: '4px 14px',
  },
  name: {
    fontSize: 120,
    letterSpacing: 4,
    lineHeight: 1,
    textShadow: `0 4px 0 ${C.rust}, 0 0 24px ${C.ink}`,
  },
};

export default KitCam;
