import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Festival is a riso-printed festival poster. Each page is flat shapes in three inks, pink, blue and yellow, that
// overprint each other like a riso does, a hair out of register, with halftone dots for shading. A cue names a page
// and the parts of it to show: parts already on the page stay put, new ones print in after them, and turning to a new
// page fades the old one out. Dusk and night are washes over the whole page.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The pictures keep to the top two thirds,
// clear of the text box.

const W = 1600;
const H = 900;
const PAPER = '#f6f0e4';
type Pt = [number, number];

type Ink = 'pink' | 'blue' | 'yellow';
const INKS: Record<Ink, string> = { pink: '#ff48b0', blue: '#0078bf', yellow: '#ffe800' };
//each ink goes through the press on its own pass, so each lands slightly off from the others
const REGISTER: Record<Ink, Pt> = { pink: [3, -2], blue: [-2, 1], yellow: [1, 3] };
//halftone screens sit at different angles so the dots don't moiré
const SCREEN: Record<Ink, number> = { pink: 15, blue: 75, yellow: 45 };

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'poster' | 'city' | 'phone' | 'fountain' | 'map' | 'gallery' | 'quarter' | 'square' | 'cafe' | 'underpass' | 'lanterns' | 'home' | 'keepsakes';

interface Cue {
  page: Page;
  parts: string[]; //printed in this order
  light?: 'dusk' | 'night';
  card?: [kicker: string, name: string];
}

const MAP = ['sheet', 'gallery', 'quarter', 'square', 'cafe'];
const MURAL = ['tunnel', 'mural'];
const CITY = ['sky', 'skyline', 'bunting'];

const cues: Record<string, Cue> = {
  title_card: { page: 'poster', parts: ['rays', 'sun'], card: ['A free afternoon', 'The Festival'] },
  city: { page: 'city', parts: CITY },
  phone: { page: 'phone', parts: ['phone', 'messages'] },
  phone_tour: { page: 'phone', parts: ['phone', 'messages', 'flyer'] },
  fountain_friends: { page: 'fountain', parts: ['fountain', 'friends'] },
  fountain_alone: { page: 'fountain', parts: ['fountain', 'you'] },
  fountain_tour: { page: 'fountain', parts: ['fountain', 'tour'] },
  map: { page: 'map', parts: ['sheet'] },
  map_gallery: { page: 'map', parts: ['sheet', 'gallery'] },
  map_quarter: { page: 'map', parts: ['sheet', 'gallery', 'quarter'] },
  map_square: { page: 'map', parts: ['sheet', 'gallery', 'quarter', 'square'] },
  map_cafe: { page: 'map', parts: MAP },
  map_all: { page: 'map', parts: [...MAP, 'here'] },
  gallery: { page: 'gallery', parts: ['room', 'paintings', 'visitors'] },
  quarter: { page: 'quarter', parts: ['houses', 'washing', 'stalls'] },
  square: { page: 'square', parts: ['stage', 'band', 'crowd'] },
  cafe: { page: 'cafe', parts: ['window', 'parade', 'cup'] },
  underpass: { page: 'underpass', parts: ['tunnel', 'walkers'] },
  mural: { page: 'underpass', parts: [...MURAL, 'walkers'] },
  mural_close: { page: 'underpass', parts: [...MURAL, 'details'] },
  notice: { page: 'underpass', parts: [...MURAL, 'notice'] },
  volunteer: { page: 'underpass', parts: [...MURAL, 'notice', 'volunteer'] },
  signed: { page: 'underpass', parts: [...MURAL, 'notice', 'volunteer', 'tick'] },
  dusk: { page: 'city', parts: CITY, light: 'dusk' },
  dusk_map: { page: 'map', parts: [...MAP, 'lane'], light: 'dusk' },
  gallery_late: { page: 'gallery', parts: ['room', 'paintings', 'quartet'], light: 'dusk' },
  concert: { page: 'square', parts: ['stage', 'band', 'lights', 'crowd'], light: 'night' },
  fireworks: { page: 'square', parts: ['stage', 'band', 'lights', 'crowd', 'fireworks'], light: 'night' },
  lanterns: { page: 'lanterns', parts: ['lane', 'lanterns', 'courtyard'], light: 'night' },
  home: { page: 'home', parts: ['room', 'window', 'firework'], light: 'night' },
  night: { page: 'city', parts: ['skyline', 'bunting', 'sweeper'], light: 'night' },
  keepsakes: { page: 'keepsakes', parts: ['map', 'ticket', 'badge'] },
  goodbye: { page: 'poster', parts: ['rays', 'sun'], light: 'dusk', card: ['Same time next year', 'The Festival'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: solid or halftone shapes, lines, and type, each in one ink
type Item =
  | { ink: Ink; d: string; o?: number; dots?: boolean; evenodd?: boolean; cls?: string }
  | { ink: Ink; stroke: string; w?: number; cls?: string }
  | { ink: Ink; text: string; x: number; y: number; size: number; middle?: boolean };

const GAP = 0.08; //seconds between one item printing and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const pill = (x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  return `M ${x + r} ${y} H ${x + w - r} a ${r} ${r} 0 0 1 0 ${h} H ${x + r} a ${r} ${r} 0 0 1 0 ${-h} Z`;
};
const bird = (x: number, y: number, s: number) => `M ${x} ${y} q ${s / 2} ${-s / 2} ${s} 0 q ${s / 2} ${-s / 2} ${s} 0`;
const words = (ink: Ink, text: string, x: number, y: number, size: number, middle = true): Item => ({ ink, text, x, y, size, middle });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//points along a quadratic curve, for strings of bunting and lanterns
const along = ([x0, y0]: Pt, [cx, cy]: Pt, [x1, y1]: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};

//a riso person: a round head on a rounded body, feet at (x, y)
function person(x: number, y: number, h: number, ink: Ink, head: Ink = ink, cls?: string): Item[] {
  const r = h * 0.15;
  const top = y - h + 2 * r + 5;
  return [
    { ink, d: `M ${x - h * 0.21} ${y} Q ${x - h * 0.23} ${top} ${x} ${top} Q ${x + h * 0.23} ${top} ${x + h * 0.21} ${y} Z`, cls },
    { ink: head, d: circle(x, y - h + r, r), cls },
  ];
}

//a firework: rays out from the middle
function burst(x: number, y: number, r: number, ink: Ink): Item {
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return line([x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35], [x + Math.cos(a) * r, y + Math.sin(a) * r]);
  });
  return { ink, stroke: rays.join(' '), w: 6, cls: 'fe-burst' };
}

//a map pin with a hole in it, its point at (x, y)
const pin = (x: number, y: number) =>
  `M ${x} ${y} C ${x - 26} ${y - 34} ${x - 30} ${y - 70} ${x} ${y - 70} C ${x + 30} ${y - 70} ${x + 26} ${y - 34} ${x} ${y} Z ${circle(x, y - 46, 10)}`;

//flags or lanterns hung along a string, sorted into one path per ink
function hung(from: Pt, mid: Pt, to: Pt, count: number, inks: Ink[], piece: (p: Pt) => string, cls?: string): Item[] {
  const paths: Partial<Record<Ink, string>> = {};
  for (let i = 0; i < count; i++) {
    const ink = inks[i % inks.length];
    paths[ink] = `${paths[ink] ?? ''} ${piece(along(from, mid, to, (i + 0.5) / count))}`;
  }
  const curve = `M ${from.join(' ')} Q ${mid.join(' ')} ${to.join(' ')}`;
  return [{ ink: 'blue', stroke: curve, w: 3 }, ...(Object.entries(paths) as [Ink, string][]).map(([ink, d]): Item => ({ ink, d, cls }))];
}

const flag = ([x, y]: Pt) => shape([x - 16, y], [x + 16, y], [x, y + 38]);
const lantern = ([x, y]: Pt) => `${rect(x - 6, y, 12, 8)} ${ellipse(x, y + 30, 22, 24)}`;

//a crowd seen from behind: rows of heads and shoulders, smaller towards the back
function crowd(): Item[] {
  const inks: Ink[] = ['pink', 'blue', 'yellow'];
  return [
    [470, 0.6],
    [505, 0.75],
    [550, 0.9],
    [605, 1.1],
  ].flatMap(([y, s], row) => {
    const paths: Partial<Record<Ink, string>> = {};
    for (let i = 0, x = 60 + row * 13; x < W; i++, x += (44 + rand(i + row * 40) * 26) * s) {
      const ink = inks[Math.floor(rand(i * 3 + row) * 3)];
      const hy = y - rand(i + row * 9) * 14 * s;
      paths[ink] = `${paths[ink] ?? ''} ${circle(x, hy, 17 * s)} M ${x - 30 * s} ${hy + 70 * s} Q ${x - 28 * s} ${hy + 18 * s} ${x} ${hy + 18 * s} Q ${x + 28 * s} ${hy + 18 * s} ${x + 30 * s} ${hy + 70 * s} Z`;
    }
    return (Object.entries(paths) as [Ink, string][]).map(([ink, d]): Item => ({ ink, d, dots: row < 2, o: 0.9 }));
  });
}

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

const BUILDINGS: [x: number, w: number, top: number][] = [
  [60, 150, 340],
  [220, 120, 250],
  [350, 170, 380],
  [530, 110, 210],
  [650, 160, 310],
  [820, 90, 160],
  [920, 180, 350],
  [1110, 130, 270],
  [1250, 160, 330],
  [1420, 140, 230],
];
const windows = BUILDINGS.flatMap(([x, w, top], b) =>
  Array.from({ length: Math.floor((w - 20) / 34) * Math.floor((560 - top) / 46) }, (_, i) => {
    const cols = Math.floor((w - 20) / 34);
    return rand(b * 50 + i) < 0.55 ? rect(x + 18 + (i % cols) * 34, top + 26 + Math.floor(i / cols) * 46, 14, 20) : '';
  }),
).join(' ');

const HOUSES: [x: number, top: number, w: number, ink: Ink][] = [
  [100, 390, 170, 'pink'],
  [270, 340, 150, 'yellow'],
  [420, 300, 170, 'blue'],
  [940, 260, 150, 'pink'],
  [1090, 300, 170, 'yellow'],
  [1260, 350, 150, 'blue'],
  [1410, 400, 170, 'pink'],
];
const STEPS = `M 600 600 ${Array.from({ length: 9 }, () => 'h 44 v -36').join(' ')} h 44`;

const ROOFTOPS: [x: number, y: number, w: number][] = [
  [1010, 300, 70],
  [1090, 270, 60],
  [1160, 290, 80],
  [1250, 250, 60],
  [1320, 280, 80],
];
const muralBirds = [
  [600, 330, 26],
  [670, 290, 30],
  [750, 260, 32],
  [840, 240, 34],
  [930, 250, 30],
];

const ART: Record<Page, Record<string, Item[]>> = {
  poster: {
    rays: Array.from({ length: 9 }, (_, i): Item => {
      const a0 = Math.PI + (i * 2 * Math.PI) / 18;
      const a1 = a0 + Math.PI / 18;
      return { ink: 'pink', dots: true, d: shape([800, 700], [800 + Math.cos(a0) * 1200, 700 + Math.sin(a0) * 1200], [800 + Math.cos(a1) * 1200, 700 + Math.sin(a1) * 1200]) };
    }),
    sun: [
      { ink: 'yellow', d: circle(800, 700, 300), o: 1 },
      { ink: 'blue', d: rect(0, 640, W, 260), dots: true },
    ],
  },

  city: {
    sky: [
      { ink: 'pink', d: rect(0, 330, W, 270), dots: true, o: 0.7 },
      { ink: 'yellow', d: circle(1270, 210, 95), o: 1 },
    ],
    skyline: [
      { ink: 'blue', d: BUILDINGS.map(([x, w, top]) => rect(x, top, w, 600 - top)).join(' '), o: 0.85 },
      { ink: 'pink', d: `${shape([820, 160], [865, 80], [910, 160])} M 950 350 A 60 60 0 0 1 1070 350 Z` },
      { ink: 'yellow', d: windows },
    ],
    bunting: [...hung([0, 90], [800, 260], [W, 110], 20, ['pink', 'yellow', 'blue'], flag, 'fe-flutter'), ...hung([0, 40], [600, 150], [W, 30], 16, ['yellow', 'blue', 'pink'], flag, 'fe-flutter')],
    sweeper: [
      ...person(760, 600, 160, 'pink', 'yellow'),
      { ink: 'yellow', stroke: line([790, 470], [850, 590]), w: 9 },
      { ink: 'yellow', d: shape([830, 585], [880, 575], [890, 610], [835, 615]) },
      ...(['pink', 'yellow'] as Ink[]).map((ink, k): Item => ({
        ink,
        d: Array.from({ length: 40 }, (_, i) => rect(480 + rand(i + k * 99) * 760, 570 + rand(i * 7 + k) * 40, 9, 6)).join(' '),
      })),
    ],
  },

  phone: {
    phone: [
      { ink: 'blue', stroke: `M 670 40 H 930 Q 980 40 980 90 V 680 H 620 V 90 Q 620 40 670 40 Z`, w: 14 },
      { ink: 'blue', stroke: line([760, 78], [840, 78]), w: 8 },
      { ink: 'yellow', d: rect(640, 100, 320, 560), dots: true, o: 0.6 },
    ],
    messages: [
      { ink: 'pink', d: pill(650, 140, 260, 64), o: 0.9 },
      words('blue', 'FESTIVAL TODAY??', 780, 182, 30),
      { ink: 'pink', d: pill(650, 225, 290, 64), o: 0.9 },
      words('blue', "WE'RE GOING FOR ONE", 795, 267, 28),
      { ink: 'pink', d: pill(650, 310, 160, 64), o: 0.9 },
      words('blue', 'YOU IN?', 730, 352, 30),
      { ink: 'blue', d: pill(840, 420, 100, 50), o: 0.85 },
      { ink: 'yellow', d: `${circle(865, 445, 7)} ${circle(890, 445, 7)} ${circle(915, 445, 7)}`, o: 1, cls: 'fe-typing' },
    ],
    flyer: [
      { ink: 'yellow', d: rect(1090, 120, 330, 440), o: 1 },
      { ink: 'pink', d: rect(1090, 120, 330, 440), dots: true, o: 0.5 },
      words('blue', 'FREE WALKING TOUR', 1255, 180, 36),
      { ink: 'pink', d: 'M 1180 320 A 75 75 0 0 1 1330 320 Q 1305 305 1280 320 Q 1255 305 1230 320 Q 1205 305 1180 320 Z', o: 1 },
      { ink: 'blue', stroke: 'M 1255 320 V 420 q 0 18 -16 18 q -14 0 -14 -14', w: 7 },
      { ink: 'blue', stroke: line([1330, 320], [1330, 350]), w: 3 },
      { ink: 'blue', d: `${ellipse(1330, 366, 26, 14)} ${shape([1352, 366], [1372, 352], [1372, 380])}` },
      words('blue', '1PM · THE FOUNTAIN', 1255, 495, 30),
      words('pink', 'ALL WELCOME', 1255, 535, 24),
    ],
  },

  fountain: {
    fountain: [
      { ink: 'blue', d: rect(0, 560, W, 120), dots: true, o: 0.6 },
      { ink: 'blue', d: `M 520 540 V 585 Q 800 640 1080 585 V 540 Z ${ellipse(800, 540, 280, 46)}`, o: 0.85 },
      { ink: 'yellow', d: ellipse(800, 536, 250, 32), dots: true, o: 0.9 },
      { ink: 'blue', d: rect(785, 380, 30, 160), o: 0.9 },
      { ink: 'pink', d: 'M 690 380 Q 800 450 910 380 Z', o: 0.95 },
      { ink: 'blue', stroke: 'M 800 372 Q 760 230 680 390 M 800 372 Q 840 230 920 390 M 800 372 Q 790 250 760 300 M 800 372 Q 810 250 840 300', w: 5, cls: 'fe-shimmer' },
    ],
    friends: [
      ...person(400, 610, 175, 'pink', 'yellow'),
      ...person(485, 610, 150, 'yellow', 'pink'),
      { ink: 'yellow', stroke: line([520, 520], [548, 462]), w: 10 },
      ...person(570, 610, 185, 'blue', 'pink'),
    ],
    you: person(1100, 610, 170, 'pink', 'yellow'),
    tour: [
      { ink: 'pink', d: 'M 1130 300 A 70 70 0 0 1 1270 300 Q 1247 286 1223 300 Q 1200 286 1177 300 Q 1153 286 1130 300 Z', o: 1 },
      { ink: 'blue', stroke: `${line([1200, 300], [1200, 430])} ${line([1270, 300], [1270, 330])}`, w: 4 },
      { ink: 'yellow', d: `${ellipse(1270, 344, 24, 13)} ${shape([1292, 344], [1310, 332], [1310, 356])}`, o: 1, cls: 'fe-flutter' },
      ...[1000, 1060, 1120, 1200, 1270, 1330, 1390, 1450, 1510].flatMap((x, i) =>
        person(x, 610, x === 1200 ? 185 : 140 + rand(i) * 30, (['blue', 'pink', 'yellow'] as Ink[])[i % 3], (['pink', 'yellow', 'pink'] as Ink[])[i % 3]),
      ),
    ],
  },

  map: {
    sheet: [
      ...[0, 1, 2, 3].map((i): Item => ({ ink: 'yellow', d: rect(280 + i * 260, 60, 260, 520), o: i % 2 ? 0.7 : 1 })),
      { ink: 'blue', d: 'M 280 330 C 500 260 700 420 900 340 S 1200 260 1320 300 L 1320 360 C 1200 320 1100 400 900 400 S 500 330 280 390 Z', dots: true },
      { ink: 'blue', stroke: `${line([340, 120], [1260, 180])} ${line([400, 560], [700, 90])} ${line([760, 580], [980, 80])} ${line([1100, 560], [1180, 90])} M 300 470 Q 800 420 1300 520`, w: 5 },
    ],
    gallery: [{ ink: 'pink', d: pin(500, 250), evenodd: true, o: 1 }, words('blue', 'THE GALLERY', 540, 225, 34, false)],
    quarter: [{ ink: 'blue', d: pin(760, 175), evenodd: true, o: 1 }, words('pink', 'OLD QUARTER', 800, 150, 34, false)],
    square: [{ ink: 'pink', d: pin(1040, 330), evenodd: true, o: 1 }, words('blue', 'MAIN SQUARE', 1080, 305, 34, false)],
    cafe: [{ ink: 'blue', d: pin(640, 525), evenodd: true, o: 1 }, words('pink', 'YOUR CAFÉ', 680, 500, 34, false)],
    here: [{ ink: 'pink', d: `${circle(880, 470, 14)}`, o: 1, cls: 'fe-pulse' }, words('blue', 'YOU ARE HERE', 905, 480, 26, false)],
    lane: [
      { ink: 'pink', d: Array.from({ length: 9 }, (_, i) => circle(780 + i * 22, 140 - i * 6, 5)).join(' '), o: 1 },
      { ink: 'pink', d: `${circle(990, 86, 14)} ${circle(1022, 92, 14)}`, o: 1, cls: 'fe-pulse' },
      words('blue', 'LANTERNS', 1050, 100, 30, false),
    ],
  },

  gallery: {
    room: [
      { ink: 'blue', d: rect(0, 580, W, 120), dots: true, o: 0.6 },
      { ink: 'blue', stroke: line([0, 580], [W, 580]), w: 6 },
      { ink: 'blue', d: `${rect(640, 515, 320, 26)} ${rect(660, 541, 14, 50)} ${rect(926, 541, 14, 50)}`, o: 0.9 },
    ],
    paintings: [
      { ink: 'blue', stroke: rect(180, 110, 440, 320), w: 12 },
      { ink: 'yellow', d: rect(360, 140, 220, 200), o: 1 },
      { ink: 'pink', d: circle(330, 250, 95), o: 0.9 },
      { ink: 'blue', d: shape([200, 410], [420, 230], [600, 410]), dots: true },
      { ink: 'pink', stroke: rect(700, 150, 180, 260), w: 10 },
      { ink: 'yellow', d: rect(712, 162, 156, 236), dots: true },
      { ink: 'blue', stroke: 'M 730 360 q 30 -60 60 -20 t 60 -40', w: 7 },
      ...[0, 1, 2, 3].map((i): Item => ({ ink: (['pink', 'blue'] as Ink[])[i % 2], stroke: rect(960 + i * 110, 140, 70, 80), w: 6 })),
      { ink: 'yellow', d: `${circle(995, 180, 20)} ${rect(1200, 160, 30, 40)}`, o: 1 },
      { ink: 'blue', d: rect(1000, 270, 420, 220), dots: true },
      { ink: 'yellow', stroke: 'M 1020 370 q 25 -20 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 M 1020 420 q 25 -20 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0', w: 6, cls: 'fe-drift' },
      words('blue', 'UNTITLED (SEA)', 1000, 525, 24, false),
    ],
    visitors: [...person(390, 610, 175, 'pink', 'blue'), ...person(1180, 610, 165, 'yellow', 'pink'), ...person(1300, 610, 150, 'blue', 'pink')],
    quartet: [
      ...[560, 690, 820, 950].flatMap((x, i) => person(x, 610, 140, (['pink', 'blue', 'pink', 'blue'] as Ink[])[i], 'yellow')),
      { ink: 'yellow', d: `${ellipse(600, 560, 26, 40)} ${ellipse(990, 560, 26, 40)}`, o: 1 },
      { ink: 'blue', stroke: `${line([600, 520], [612, 450])} ${line([990, 520], [1002, 450])} ${line([700, 520], [740, 470])} ${line([830, 520], [870, 470])}`, w: 4 },
    ],
  },

  quarter: {
    houses: [
      ...HOUSES.flatMap(([x, top, w, ink]): Item[] => [
        { ink, d: rect(x, top, w, 600 - top), o: 0.8 },
        { ink, d: shape([x - 10, top], [x + w / 2, top - 60], [x + w + 10, top]), o: 0.95 },
      ]),
      { ink: 'blue', d: HOUSES.map(([x, top, w]) => `${rect(x + 24, top + 30, 34, 44)} ${rect(x + w - 64, 520, 40, 80)}`).join(' '), o: 0.9 },
      { ink: 'yellow', d: rect(590, 230, 410, 370), dots: true, o: 0.8 },
      { ink: 'blue', stroke: STEPS, w: 6 },
    ],
    washing: [
      { ink: 'blue', stroke: 'M 260 190 Q 700 290 1140 180', w: 3 },
      ...[0.12, 0.28, 0.45, 0.62, 0.8].map((t, i): Item => {
        const [x, y] = along([260, 190], [700, 290], [1140, 180], t);
        const shirt = shape([x - 30, y], [x + 30, y], [x + 42, y + 20], [x + 26, y + 26], [x + 24, y + 70], [x - 24, y + 70], [x - 26, y + 26], [x - 42, y + 20]);
        return { ink: (['pink', 'yellow', 'blue'] as Ink[])[i % 3], d: i % 2 ? rect(x - 26, y, 52, 60) : shirt, cls: 'fe-flutter' };
      }),
    ],
    stalls: [
      { ink: 'blue', d: 'M 380 600 V 500 Q 420 450 460 500 V 600 Z', o: 1 },
      { ink: 'yellow', d: `${circle(495, 582, 20)} ${circle(570, 586, 15)}`, o: 1 },
      { ink: 'pink', d: `${ellipse(532, 584, 16, 18)} ${rect(476, 548, 36, 14)}`, o: 1 },
      { ink: 'pink', d: 'M 1000 540 H 1120 Q 1120 590 1060 592 Q 1000 590 1000 540 Z M 1000 540 Q 1010 490 1060 490 V 540 Z', o: 1 },
      { ink: 'yellow', d: `${rect(1070, 516, 16, 24)} ${rect(1092, 512, 16, 28)}`, o: 1 },
      { ink: 'blue', stroke: `${circle(1020, 606, 14)} ${circle(1100, 606, 14)} M 1120 540 l 30 -24`, w: 5 },
      ...person(1180, 610, 160, 'blue', 'pink'),
    ],
  },

  square: {
    stage: [
      { ink: 'pink', d: rect(560, 180, 480, 200), dots: true },
      { ink: 'pink', d: shape([520, 180], [800, 90], [1080, 180]), o: 1 },
      { ink: 'blue', d: `${rect(540, 380, 520, 70)} ${rect(480, 250, 50, 130)} ${rect(1070, 250, 50, 130)}`, o: 0.9 },
    ],
    band: [
      ...[650, 750, 850, 950].flatMap((x, i) => person(x, 382, 120, (['blue', 'pink'] as Ink[])[i % 2], 'yellow')),
      { ink: 'yellow', d: `${circle(680, 330, 22)} ${circle(880, 330, 22)} ${shape([760, 320], [800, 300], [800, 340])}`, o: 1 },
    ],
    lights: [
      { ink: 'yellow', d: `${shape([620, 185], [440, 640], [700, 640])} ${shape([980, 185], [900, 640], [1160, 640])}`, dots: true, cls: 'fe-flicker' },
    ],
    crowd: [...crowd(), ...person(1250, 585, 75, 'pink', 'yellow', 'fe-bob')],
    fireworks: [burst(300, 160, 110, 'pink'), burst(1300, 140, 120, 'yellow'), burst(1080, 70, 70, 'blue'), burst(520, 80, 70, 'yellow')],
  },

  cafe: {
    window: [
      { ink: 'blue', d: rect(176, 470, 1248, 110), dots: true, o: 0.6 },
      { ink: 'pink', d: Array.from({ length: 10 }, (_, i) => rect(160 + i * 128, 20, 64, 50)).join(' '), o: 1 },
      { ink: 'blue', stroke: `${rect(160, 70, 1280, 510)} ${line([800, 70], [800, 580])}`, w: 16 },
    ],
    parade: [
      ...person(420, 400, 160, 'pink', 'yellow', 'fe-march'),
      { ink: 'blue', stroke: `${line([400, 400], [394, 570])} ${line([440, 400], [446, 570])}`, w: 7, cls: 'fe-march' },
      ...person(640, 570, 150, 'yellow', 'pink', 'fe-march'),
      { ink: 'blue', d: ellipse(680, 520, 32, 22), o: 1, cls: 'fe-march' },
      { ink: 'pink', d: rect(1000, 340, 90, 230), o: 0.95, cls: 'fe-march' },
      { ink: 'yellow', d: `${rect(1000, 390, 90, 30)} ${rect(1000, 460, 90, 30)} ${rect(1010, 300, 70, 40)}`, o: 1, cls: 'fe-march' },
      { ink: 'pink', d: shape([1000, 300], [1045, 260], [1090, 300]), o: 1, cls: 'fe-march' },
      { ink: 'yellow', d: `${shape([1010, 320], [900, 280], [900, 360])} ${shape([1080, 320], [1190, 280], [1190, 360])}`, dots: true, cls: 'fe-flicker' },
    ],
    cup: [
      { ink: 'blue', d: ellipse(1250, 595, 100, 18), o: 0.9 },
      { ink: 'yellow', d: 'M 1190 505 H 1310 Q 1305 590 1250 592 Q 1195 590 1190 505 Z', o: 1 },
      { ink: 'yellow', stroke: 'M 1306 525 q 36 0 28 30 q -6 18 -30 16', w: 8 },
      ...[1225, 1250, 1275].map((x): Item => ({ ink: 'pink', stroke: `M ${x} 490 q -12 -25 0 -50 t 0 -50`, w: 4, cls: 'fe-steam' })),
    ],
  },

  underpass: {
    tunnel: [
      { ink: 'blue', d: `${rect(0, 0, W, 700)} M 120 650 V 200 Q 800 -20 1480 200 V 650 Z`, dots: true, evenodd: true },
      { ink: 'blue', d: shape([120, 600], [1480, 600], [W, 700], [0, 700]), o: 0.6 },
      { ink: 'yellow', d: `${rect(380, 120, 60, 14)} ${rect(770, 80, 60, 14)} ${rect(1160, 120, 60, 14)}`, o: 1, cls: 'fe-flicker' },
    ],
    mural: [
      { ink: 'yellow', d: rect(180, 200, 1240, 390), dots: true, o: 0.8 },
      { ink: 'pink', d: 'M 330 590 Q 320 400 390 380 Q 460 400 450 590 Z', o: 0.95 },
      { ink: 'pink', d: circle(390, 340, 40), o: 0.95 },
      { ink: 'pink', stroke: 'M 430 420 Q 480 390 530 360', w: 14 },
      { ink: 'yellow', d: Array.from({ length: 14 }, (_, i) => circle(545 + rand(i) * 110, 330 + rand(i + 20) * 70, 5)).join(' '), o: 1 },
      { ink: 'blue', stroke: muralBirds.map(([x, y, s]) => bird(x, y, s)).join(' '), w: 6 },
      { ink: 'blue', d: ROOFTOPS.map(([x, y, w]) => `${shape([x, y], [x + w / 2, y - 34], [x + w, y])} ${rect(x + 6, y, w - 12, 590 - y)}`).join(' '), o: 0.85 },
    ],
    walkers: [...person(1240, 650, 175, 'pink', 'yellow', 'fe-walk'), ...person(1380, 650, 165, 'blue', 'pink', 'fe-walk')],
    details: [
      { ink: 'pink', d: rect(1366, 540, 26, 46), o: 1 },
      { ink: 'pink', d: rect(1278, 300, 18, 22), o: 1 },
      { ink: 'pink', stroke: `${circle(866, 262, 6)} M 872 262 h 18 v 8`, w: 4 },
      { ink: 'pink', stroke: `${circle(1379, 562, 44)} ${circle(1287, 311, 34)} ${circle(878, 262, 34)}`, w: 4, cls: 'fe-pulse' },
    ],
    notice: [
      { ink: 'yellow', d: rect(1220, 360, 170, 210), o: 1 },
      words('blue', 'NOTICE', 1305, 410, 38),
      { ink: 'blue', stroke: [440, 470, 500, 530].map((y) => line([1240, y], [1370, y])).join(' '), w: 3 },
      { ink: 'pink', d: `${rect(1206, 352, 40, 16)} ${rect(1364, 352, 40, 16)}`, o: 0.9 },
    ],
    volunteer: [
      ...person(1060, 650, 190, 'blue', 'pink'),
      { ink: 'yellow', d: rect(1092, 520, 60, 80), o: 1 },
      { ink: 'pink', stroke: line([1110, 516], [1134, 516]), w: 6 },
    ],
    tick: [{ ink: 'pink', stroke: 'M 1160 470 l 20 22 l 40 -50', w: 9 }],
  },

  lanterns: {
    lane: [
      { ink: 'pink', d: shape([0, 60], [540, 220], [560, 600], [0, 600]), dots: true, o: 0.9 },
      { ink: 'blue', d: shape([W, 60], [1060, 220], [1040, 600], [W, 600]), dots: true, o: 0.9 },
      { ink: 'yellow', d: circle(800, 380, 210), dots: true, o: 0.7 },
      { ink: 'blue', stroke: [600, 560, 525, 495].map((y, i) => line([560 + i * 20, y], [1040 - i * 20, y])).join(' '), w: 5 },
    ],
    lanterns: [...hung([0, 120], [800, 300], [W, 140], 14, ['yellow', 'pink'], lantern, 'fe-sway'), ...hung([100, 30], [800, 190], [1500, 50], 11, ['pink', 'yellow'], lantern, 'fe-sway')],
    courtyard: [
      { ink: 'blue', stroke: 'M 800 600 V 420 M 800 470 q -40 -30 -80 -40 M 800 450 q 40 -40 90 -50 M 800 430 q -10 -30 -30 -50', w: 8 },
      ...person(690, 610, 150, 'blue', 'pink'),
      { ink: 'yellow', stroke: `${line([700, 520], [750, 490])} ${line([716, 540], [760, 500])}`, w: 6 },
      ...person(920, 610, 150, 'pink', 'yellow'),
      { ink: 'yellow', d: rect(880, 520, 20, 22), o: 1 },
    ],
  },

  home: {
    room: [
      { ink: 'pink', d: 'M 160 600 V 470 Q 160 420 210 420 H 690 Q 740 420 740 470 V 600 Z', o: 0.9 },
      { ink: 'pink', d: `${pill(200, 470, 240, 60)} ${pill(460, 470, 240, 60)}`, dots: true },
      { ink: 'blue', d: `${rect(790, 470, 140, 130)} M 830 470 V 410 Q 830 380 860 380 H 890 Q 910 380 910 400 V 470 Z`, o: 0.9 },
      ...[850, 875].map((x): Item => ({ ink: 'pink', stroke: `M ${x} 370 q -12 -25 0 -50 t 0 -50`, w: 4, cls: 'fe-steam' })),
      { ink: 'yellow', d: shape([280, 200], [400, 200], [430, 290], [250, 290]), o: 1 },
      { ink: 'blue', stroke: line([340, 290], [340, 420]), w: 6 },
    ],
    window: [
      { ink: 'blue', d: rect(1000, 90, 440, 420), dots: true, o: 0.45 },
      { ink: 'blue', d: ROOFTOPS.map(([x, y, w]) => `${shape([x, y + 160], [x + w / 2, y + 126], [x + w, y + 160])} ${rect(x + 6, y + 160, w - 12, 350 - y)}`).join(' '), o: 0.9 },
      { ink: 'blue', stroke: `${rect(1000, 90, 440, 420)} ${line([1220, 90], [1220, 510])}`, w: 14 },
    ],
    firework: [burst(1110, 220, 95, 'pink'), burst(1340, 170, 70, 'yellow')],
  },

  keepsakes: {
    map: [
      { ink: 'yellow', d: shape([280, 200], [680, 170], [710, 520], [310, 550]), o: 1 },
      { ink: 'blue', stroke: `${line([480, 185], [510, 535])} ${line([295, 375], [695, 345])}`, w: 3 },
      { ink: 'pink', d: pin(420, 300), evenodd: true, o: 1 },
    ],
    ticket: [
      { ink: 'pink', d: rect(800, 200, 360, 160), o: 0.9 },
      { ink: 'blue', d: Array.from({ length: 7 }, (_, i) => circle(1090, 215 + i * 22, 5)).join(' '), o: 1 },
      words('blue', 'ADMIT ONE', 945, 290, 46),
      words('yellow', 'CITY ARTS FESTIVAL', 945, 330, 22),
    ],
    badge: [
      { ink: 'blue', d: circle(1180, 480, 95), o: 0.9 },
      { ink: 'yellow', d: circle(1180, 480, 72), o: 1 },
      words('pink', 'I WAS', 1180, 470, 34),
      words('pink', 'THERE', 1180, 508, 34),
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
        const [dx, dy] = REGISTER[item.ink];
        const color = INKS[item.ink];
        let mark;
        if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor={item.middle ? 'middle' : 'start'} fill={color} style={{ ...styles.type, fontSize: item.size }}>
              {item.text}
            </text>
          );
        } else if ('stroke' in item) {
          mark = <path d={item.stroke} fill="none" stroke={color} strokeWidth={item.w ?? 6} strokeLinecap="round" strokeLinejoin="round" className={item.cls} />;
        } else {
          mark = (
            <path
              d={item.d}
              fill={item.dots ? `url(#fe-dots-${item.ink})` : color}
              fillOpacity={item.o ?? 0.9}
              fillRule={item.evenodd ? 'evenodd' : undefined}
              className={item.cls}
            />
          );
        }
        return (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            <g className="fe-print" style={{ animationDelay: `${start + i * GAP}s` }}>
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

//new parts print one after another; on a fresh page they wait for the old one to fade
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
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, cue.page, 0.5) }, prev: shown };
}

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'fe-leave' : undefined} filter="url(#fe-riso)">
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
  festival: new URL('./sounds/festival.m4a', import.meta.url).href,
  square: new URL('./sounds/square.m4a', import.meta.url).href,
  gallery: new URL('./sounds/gallery.m4a', import.meta.url).href,
  quarter: new URL('./sounds/quarter.m4a', import.meta.url).href,
  cafe: new URL('./sounds/cafe.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the festival far off on the poster pages, and each place's own sound when you're in it
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  poster: { festival: 0.4 },
  city: { festival: 0.55 },
  phone: { festival: 0.3 },
  fountain: { square: 0.35, festival: 0.3 },
  map: { festival: 0.45 },
  gallery: { gallery: 0.6 },
  quarter: { quarter: 0.55 },
  square: { square: 0.65 },
  cafe: { cafe: 0.5 },
  underpass: { street: 0.5 },
  lanterns: { cafe: 0.4 },
  home: { street: 0.2 },
  keepsakes: { festival: 0.2 },
};
const mixFor = ({ page, light }: Cue) => (page === 'city' && light === 'night' ? { street: 0.4 } : MIX[page]);

const ONE_SHOTS: Record<string, OneShot> = {
  concert: { src: new URL('./sounds/applause.m4a', import.meta.url).href, volume: 0.5, delay: 0.3 },
  signed: { src: new URL('../the_story_game/sounds/pen.m4a', import.meta.url).href, volume: 0.45, delay: 0.2 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

function Poster({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Festival has no cue for the animation "${animation}"`);
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
  const { card, light } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="fe-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.08 0" />
          </filter>
        </defs>
        <rect width={W} height={H} fill={PAPER} />
        <rect width={W} height={H} filter="url(#fe-grain)" />
      </svg>

      <svg style={{ ...styles.layer, ...styles.multiply }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          {/* riso ink never quite covers: knock tiny specks out of everything printed */}
          <filter id="fe-riso" filterUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="noise" />
            <feColorMatrix in="noise" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4 3" result="specks" />
            <feComposite in="SourceGraphic" in2="specks" operator="in" />
          </filter>
          {(Object.keys(INKS) as Ink[]).map((ink) => (
            <pattern key={ink} id={`fe-dots-${ink}`} width={9} height={9} patternUnits="userSpaceOnUse" patternTransform={`rotate(${SCREEN[ink]})`}>
              <circle cx={4.5} cy={4.5} r={2.6} fill={INKS[ink]} />
            </pattern>
          ))}
        </defs>
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
      </svg>

      <div style={{ ...styles.light, ...styles.dusk, opacity: light === 'dusk' ? 1 : 0 }} />
      <div style={{ ...styles.light, ...styles.night, opacity: light === 'night' ? 1 : 0 }} />
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
.fe-print {
  opacity: 0;
  animation: fe-print 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
}
@keyframes fe-print {
  from { opacity: 0; transform: translate(-10px, 6px); }
  40% { opacity: 1; }
  to { opacity: 1; transform: none; }
}
.fe-leave {
  animation: fe-leave 0.5s ease forwards;
}
@keyframes fe-leave {
  to { opacity: 0; }
}
.fe-flutter, .fe-sway {
  transform-box: fill-box;
  transform-origin: top center;
  animation: fe-sway 2.4s ease-in-out infinite;
}
.fe-sway {
  animation-duration: 4s;
}
@keyframes fe-sway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
.fe-shimmer, .fe-flicker {
  animation: fe-flicker 1.8s ease-in-out infinite;
}
@keyframes fe-flicker {
  0%, 100% { opacity: 1; }
  40% { opacity: 0.7; }
  70% { opacity: 0.9; }
}
.fe-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: fe-pulse 1.6s ease-in-out infinite;
}
@keyframes fe-pulse {
  50% { transform: scale(1.12); }
}
.fe-typing {
  animation: fe-typing 1.2s steps(2) infinite;
}
@keyframes fe-typing {
  50% { opacity: 0.2; }
}
.fe-burst {
  transform-box: fill-box;
  transform-origin: center;
  animation: fe-burst 2.2s ease-out infinite;
}
.fe-burst:nth-of-type(2n) {
  animation-delay: -0.9s;
}
@keyframes fe-burst {
  from { transform: scale(0.2); opacity: 1; }
  80% { opacity: 1; }
  to { transform: scale(1.1); opacity: 0; }
}
.fe-march {
  animation: fe-march 14s linear infinite;
}
@keyframes fe-march {
  from { transform: translateX(-120px); }
  to { transform: translateX(160px); }
}
.fe-walk {
  animation: fe-walk 9s linear infinite;
}
@keyframes fe-walk {
  from { transform: translateX(80px); }
  to { transform: translateX(-260px); }
}
.fe-bob {
  animation: fe-bob 0.9s ease-in-out infinite;
}
@keyframes fe-bob {
  50% { transform: translateY(-6px); }
}
.fe-drift {
  animation: fe-drift 3s ease-in-out infinite;
}
@keyframes fe-drift {
  50% { transform: translateX(12px); }
}
.fe-steam {
  animation: fe-steam 3.6s ease-in-out infinite;
}
@keyframes fe-steam {
  0%, 100% { transform: translate(0, 0); opacity: 0.9; }
  50% { transform: translate(6px, -10px); opacity: 0.5; }
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
  type: {
    fontFamily: 'var(--font-comic)',
    letterSpacing: 1,
  },
  light: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    mixBlendMode: 'multiply',
    transition: 'opacity 3s ease',
  },
  dusk: {
    background: 'linear-gradient(to bottom, rgba(255,120,90,0.35), rgba(150,80,160,0.3))',
  },
  night: {
    background: 'linear-gradient(to bottom, rgba(20,30,90,0.45), rgba(40,30,80,0.3))',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: INKS.blue,
    fontFamily: 'var(--font-comic)',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: INKS.pink,
  },
  name: {
    fontSize: 120,
    letterSpacing: 4,
    lineHeight: 1,
  },
};

export default Poster;
