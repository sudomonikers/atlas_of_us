import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Free Weekend is cross-stitched on cream aida cloth, stretched in an oval embroidery hoop, like a sampler. Filled
// shapes are snapped to the cloth's grid and stitched as little crosses, with the bare cloth showing between them and
// wherever nothing is stitched; outlines, lines and lettering are backstitched on top. The player is always in red
// thread, and nothing else is. A cue names a picture and the parts of it to show: parts already up stay put, new ones are
// stitched in after them, a row at a time from the bottom up, and turning to a new picture fades the old one out.
// Everything is SVG in a fixed 1600x900 space, scaled to cover the screen. The hoop keeps to the top two thirds, clear
// of the text box.

const W = 1600;
const H = 900;
const CELL = 10; //one stitch
const HOOP = { cx: 800, cy: 318, rx: 650, ry: 285 };
type Pt = [number, number];

const C = {
  cloth: '#efe7d3',
  red: '#c9343b',
  navy: '#2e3d66',
  blue: '#5b8cc2',
  sky: '#a9cde3',
  dusk: '#3b3f6e',
  green: '#4c7d48',
  leaf: '#8fb85e',
  yellow: '#efc23f',
  gold: '#e59a3a',
  peach: '#f3c38f',
  brown: '#7a5236',
  tan: '#c69c6d',
  skin: '#efc4a1',
  pink: '#e594a2',
  grey: '#8b8f96',
  white: '#fbf9f2',
  ink: '#2e2826',
};
type Thread = Exclude<keyof typeof C, 'cloth'>;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'flat' | 'move' | 'lake' | 'park';

interface Cue {
  page: Page;
  parts: string[]; //stitched in this order
  card?: [kicker: string, name: string];
}

const ROOM = ['floor', 'window', 'curtains'];
const FRIDAY = [...ROOM, 'night', 'sofa', 'lamp', 'glow'];
const SUNDAY = [...ROOM, 'day', 'sofa', 'lamp', 'fridge', 'list'];
const STREET = ['sun', 'pavement', 'building', 'van', 'sofa_out', 'boxes'];
const LAKE = ['sky', 'sun', 'hills', 'water', 'ripples'];
const PARK = ['trees', 'grass', 'river'];
const GOLD = ['gold', 'sun_low', ...PARK, 'bench'];

const cues: Record<string, Cue> = {
  title_card: { page: 'lake', parts: [...LAKE, 'boat_far'], card: ['A weekend in June', 'The Free Weekend'] },
  friday: { page: 'flat', parts: [...FRIDAY, 'you_sofa'] },
  calendar: { page: 'flat', parts: [...FRIDAY, 'you_sofa', 'calendar'] },
  text_hannah: { page: 'flat', parts: [...FRIDAY, 'you_sofa', 'calendar', 'phone', 'bubble_hannah'] },
  text_leo: { page: 'flat', parts: [...FRIDAY, 'you_sofa', 'calendar', 'phone', 'bubble_hannah', 'bubble_leo'] },
  keep: { page: 'move', parts: [...STREET, 'hannah', 'you_box', 'photo'] },
  half: { page: 'lake', parts: [...LAKE, 'jetty', 'boat_far', 'you_jetty'] },
  ask: { page: 'lake', parts: [...LAKE, 'you_boat', 'leo', 'boat', 'bubble_fun'] },
  bail: { page: 'lake', parts: [...LAKE, 'you_boat', 'leo', 'boat', 'drink', 'buzz'] },
  sunday: { page: 'flat', parts: [...SUNDAY, 'you_stand'] },
  the_list: { page: 'flat', parts: [...SUNDAY, 'you_stand', 'list_ring'] },
  group_chat: { page: 'flat', parts: [...SUNDAY, 'you_stand', 'chat'] },
  sun_busy: { page: 'flat', parts: [...SUNDAY, 'ticks', 'you_gym'] },
  sun_people: { page: 'park', parts: ['sky', 'clouds', ...PARK, 'table', 'friends', 'you_table', 'pints'] },
  sun_alone: { page: 'flat', parts: [...SUNDAY, 'you_sofa', 'headphones'] },
  sun_still: { page: 'flat', parts: [...SUNDAY, 'you_lying', 'mug'] },
  afternoon: { page: 'park', parts: GOLD },
  afternoon_hour: { page: 'park', parts: [...GOLD, 'you_bench'] },
  hour_walk: { page: 'park', parts: [...GOLD, 'heron', 'you_walk'] },
  hour_book: { page: 'park', parts: [...GOLD, 'you_bench', 'book'] },
  hour_drift: { page: 'park', parts: [...GOLD, 'cloud_ship', 'you_grass'] },
  hour_phone: { page: 'park', parts: ['dusk', ...PARK, 'bench', 'lamps', 'you_bench', 'screen'] },
  monday: { page: 'flat', parts: [...ROOM, 'day', 'sofa', 'lamp', 'calendar', 'you_call', 'ring'] },
  homework: { page: 'flat', parts: FRIDAY },
  goodbye: { page: 'park', parts: [...GOLD, 'clouds'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: cross-stitched shapes, backstitched lines and lettering. cls is for anything that moves
type Item =
  | { fill: Thread; d: string; cls?: string }
  | { back: Thread; d: string; w?: number; cls?: string }
  | { text: string; c: Thread; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end' };

const PART_GAP = 0.4; //seconds between one part starting to stitch in and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map((n) => +n.toFixed(1)).join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) =>
  `M ${+(x - r).toFixed(1)} ${+y.toFixed(1)} a ${+r.toFixed(1)} ${+r.toFixed(1)} 0 1 0 ${+(2 * r).toFixed(1)} 0 a ${+r.toFixed(1)} ${+r.toFixed(1)} 0 1 0 ${+(-2 * r).toFixed(1)} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const words = (c: Thread, text: string, x: number, y: number, size: number, anchor?: 'start' | 'end'): Item => ({ c, text, x, y, size, anchor });
const fill = (c: Thread, d: string, cls?: string): Item => ({ fill: c, d, cls });
const back = (c: Thread, d: string, w?: number, cls?: string): Item => ({ back: c, d, w, cls });

//pseudo-random but fixed, so a picture always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a figure, feet at y and h tall standing, facing right (dir 1) or left (-1). Lying down, the feet are at x and the head
//points dir. Sitting, the seat is 30% of h up
type Pose = 'stand' | 'walk' | 'sit' | 'lie' | 'carry' | 'wave' | 'phone';
interface Look {
  top: Thread;
  legs?: Thread;
  hair?: Thread;
  long?: boolean;
}
function person(x: number, y: number, h: number, { top, legs = 'navy', hair = 'brown', long = false }: Look, { dir = 1, pose = 'stand' as Pose } = {}): Item[] {
  const u = h / 100;
  const P = (dx: number, dy: number): Pt => (pose === 'lie' ? [x + dy * u * dir, y - (dx + 20) * u] : [x + dx * u * dir, y - dy * u]);
  const S = (...pts: Pt[]) => shape(...pts.map(([a, b]) => P(a, b)));
  const R = (dx: number, dy: number, r: number) => circle(...P(dx, dy), r * u);
  const tb = pose === 'sit' ? 40 : 46; //top of the legs
  const s = tb + 34; //shoulders
  const hy = s + 14; //middle of the head
  const lower =
    pose === 'walk'
      ? [S([-4, 46], [5, 46], [17, 1], [8, 0], [1, 30], [-6, 0], [-15, 1])]
      : pose === 'sit'
        ? [S([-12, 42], [26, 42], [26, 30], [-12, 30]), S([16, 31], [26, 31], [26, 0], [16, 0])]
        : [S([-12, 0], [-2, 0], [0, 34], [2, 0], [12, 0], [13, 46], [-13, 46])];
  const down = (k: number) => S([12 * k, s], [18 * k, s - 3], [20 * k, s - 34], [14 * k, s - 34], [12 * k, s - 10]);
  const arms: Record<Pose, [rear: string | null, front: string[]]> = {
    stand: [down(-1), [down(1)]],
    lie: [down(-1), [down(1)]],
    carry: [down(-1), [S([10, s], [16, s - 2], [32, s - 16], [29, s - 22], [12, s - 14])]],
    wave: [down(-1), [S([10, s], [16, s - 2], [27, s + 22], [21, s + 24])]],
    phone: [down(-1), [S([12, s], [18, s - 3], [20, s - 18], [14, s - 20]), S([14, s - 21], [20, s - 16], [12, s + 12], [7, s + 9])]],
    walk: [S([-12, s], [-18, s - 3], [-26, s - 30], [-20, s - 32], [-12, s - 10]), [S([12, s], [18, s - 3], [26, s - 30], [20, s - 32], [12, s - 10])]],
    sit: [null, [S([6, s], [14, s - 2], [16, tb + 9], [30, tb + 10], [30, tb + 3], [8, tb + 2])]],
  };
  const [rear, front] = arms[pose];
  return [
    ...(long ? [fill(hair, S([-12, hy + 4], [9, hy + 4], [9, s - 9], [-13, s - 9]))] : []),
    ...(rear ? [fill(top, rear)] : []),
    ...lower.map((d) => fill(legs, d)),
    fill(top, `${S([-14, tb], [14, tb], [13, s], [-13, s])} ${S([-16, s - 3], [16, s - 3], [12, s + 4], [-12, s + 4])}`),
    ...front.map((d) => fill(top, d)),
    fill(hair, R(-1, hy + 2, 9.5)),
    fill('skin', R(2, hy - 1, 8.5)),
    ...(pose === 'phone' ? [fill('ink', S([5, s + 7], [11, s + 7], [11, s + 18], [5, s + 18]))] : []),
  ];
}

const YOU: Look = { top: 'red' };
const BECCA: Look = { top: 'green', hair: 'gold', long: true };
const LEO: Look = { top: 'yellow', hair: 'ink', legs: 'blue' };

//a message bubble with its tail pointing at tip, and a line or two of lettering
const bubble = (x: number, y: number, w: number, h: number, tip: Pt, lines: string[], c: Thread = 'white'): Item[] => {
  const r = 18;
  const outline = `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
  const foot = Math.min(Math.max(tip[0], x + 40), x + w - 60);
  const tail = shape([foot, y + h - 2], [foot + 30, y + h - 2], tip);
  return [fill(c, outline), fill(c, tail), back('grey', outline, 3), ...lines.map((t, i) => words('ink', t, x + 22, y + 34 + i * 30, 23, 'start'))];
};

//a round tree, trunk at x on the ground at y
const tree = (x: number, y: number, s: number, seed: number): Item[] => [
  fill('brown', rect(x - 10 * s, y - 120 * s, 20 * s, 120 * s)),
  fill('green', Array.from({ length: 6 }, (_, i) => circle(x + (rand(seed + i) - 0.5) * 120 * s, y - 170 * s - rand(seed + i + 9) * 90 * s, (50 + rand(seed + i + 20) * 25) * s)).join(' ')),
  fill('leaf', Array.from({ length: 4 }, (_, i) => circle(x + (rand(seed + i + 40) - 0.6) * 90 * s, y - 200 * s - rand(seed + i + 49) * 60 * s, 22 * s)).join(' ')),
];

//a puffy cloud
const cloud = (x: number, y: number, s: number, cls?: string): Item => fill('white', [circle(x, y, 34 * s), circle(x + 40 * s, y - 14 * s, 40 * s), circle(x + 82 * s, y, 32 * s), rect(x, y - 4 * s, 82 * s, 34 * s)].join(' '), cls);

//a boat on the water at y, centred on x
const hull = (x: number, y: number, s: number): Item[] => [
  fill('white', shape([x - 160 * s, y - 40 * s], [x + 170 * s, y - 40 * s], [x + 130 * s, y + 10 * s], [x - 140 * s, y + 10 * s])),
  fill('navy', shape([x - 152 * s, y - 28 * s], [x + 161 * s, y - 28 * s], [x + 155 * s, y - 18 * s], [x - 146 * s, y - 18 * s])),
  back('grey', shape([x - 160 * s, y - 40 * s], [x + 170 * s, y - 40 * s], [x + 130 * s, y + 10 * s], [x - 140 * s, y + 10 * s]), 3),
];

//short glinting dashes on water, from x1 to x2 between y1 and y2
const glints = (x1: number, x2: number, y1: number, y2: number, n: number, c: Thread = 'white'): Item[] =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = [x1 + rand(i + 300) * (x2 - x1), y1 + rand(i + 330) * (y2 - y1)];
    return back(c, `M ${x.toFixed(0)} ${y.toFixed(0)} h ${(20 + rand(i + 360) * 30).toFixed(0)}`, 3, `fw-glint fw-glint-${i % 3}`);
  });

// ---------------------------------------------------------------------------
// the pictures
// ---------------------------------------------------------------------------

const FLOOR = 470;
const FIG = 170;
const GROUND = 500; //the street
const WATER = 330;
const LAWN = 460; //the park

const ART: Record<Page, Record<string, Item[]>> = {
  flat: {
    floor: [
      fill('tan', rect(100, FLOOR, 1400, 200)),
      fill('brown', rect(100, FLOOR - 20, 1400, 20)),
      back('brown', `M 100 ${FLOOR + 50} H 1500 M 100 ${FLOOR + 100} H 1500 M 420 ${FLOOR} v 50 M 880 ${FLOOR} v 50 M 1260 ${FLOOR} v 50 M 640 ${FLOOR + 50} v 50 M 1100 ${FLOOR + 50} v 50`, 3),
    ],
    window: [fill('white', rect(750, 110, 240, 270)), back('grey', rect(750, 110, 240, 270), 3)],
    curtains: [
      fill('blue', `${shape([712, 96], [772, 96], [762, 250], [778, 400], [706, 400], [720, 250])} ${shape([968, 96], [1028, 96], [1020, 250], [1034, 400], [962, 400], [978, 250])}`),
      fill('navy', rect(696, 90, 348, 14)),
      back('navy', 'M 730 110 Q 726 250 722 390 M 750 110 Q 746 250 742 390 M 992 110 Q 996 250 1000 390 M 1012 110 Q 1016 250 1020 390', 2),
    ],
    night: [
      fill('dusk', rect(770, 130, 200, 230)),
      fill('yellow', `${circle(900, 190, 26)}`),
      fill('dusk', circle(912, 182, 22)),
      ...[[800, 160], [835, 225], [940, 260], [810, 300], [880, 320]].map(([x, y], i) => back('yellow', `M ${x - 7} ${y} h 14 M ${x} ${y - 7} v 14`, 2.5, `fw-twinkle fw-glint-${i % 3}`)),
      back('white', 'M 870 130 V 360 M 770 240 H 970', 6),
    ],
    day: [
      fill('sky', rect(770, 130, 200, 230)),
      cloud(800, 200, 0.6),
      fill('yellow', circle(925, 175, 24)),
      back('white', 'M 870 130 V 360 M 770 240 H 970', 6),
    ],
    sofa: [
      fill('green', rect(340, FLOOR - 160, 290, 100)),
      fill('green', `${rect(315, FLOOR - 105, 50, 85)} ${rect(605, FLOOR - 105, 50, 85)}`),
      fill('leaf', rect(355, FLOOR - 70, 260, 50)),
      fill('brown', `${rect(330, FLOOR - 20, 14, 20)} ${rect(626, FLOOR - 20, 14, 20)}`),
      back('green', 'M 485 312 V 395 M 485 400 V 445', 3),
    ],
    lamp: [
      back('ink', `M 270 ${FLOOR - 4} V 262 M 250 ${FLOOR - 4} H 290`, 4),
      fill('yellow', shape([238, 265], [302, 265], [288, 212], [252, 212])),
    ],
    glow: [back('yellow', 'M 228 290 l -18 14 M 312 290 l 18 14 M 270 298 v 26 M 240 302 l -10 24 M 300 302 l 10 24', 3)],
    you_sofa: person(420, FLOOR, FIG, YOU, { pose: 'sit' }),
    phone: [fill('ink', rect(460, FLOOR - 92, 14, 22)), back('sky', rect(462, FLOOR - 90, 10, 16), 2)],
    bubble_hannah: [words('green', 'BECCA', 486, 124, 18, 'start'), ...bubble(476, 132, 290, 60, [470, FLOOR - 96], ['Still OK for 9am tomorrow?'])],
    bubble_leo: [words('gold', 'LEO', 486, 222, 18, 'start'), ...bubble(476, 230, 290, 90, [472, FLOOR - 92], ['Boat on the lake tomorrow!', 'One seat left!'], 'yellow')],
    calendar: [
      fill('white', rect(1060, 140, 120, 150)),
      fill('blue', rect(1060, 140, 120, 34)),
      back('grey', `${rect(1060, 140, 120, 150)} M 1060 210 H 1180 M 1060 250 H 1180 M 1100 174 V 290 M 1140 174 V 290`, 2),
      words('white', 'JUNE', 1120, 165, 18),
      back('red', ellipse(1160, 230, 22, 16), 3.5),
      words('ink', 'H 9am', 1160, 278, 14),
    ],
    fridge: [
      fill('white', rect(1220, 190, 120, 280)),
      back('grey', `${rect(1220, 190, 120, 280)} M 1220 290 H 1340 M 1326 220 v 50 M 1326 310 v 70`, 3),
    ],
    list: [
      fill('yellow', rect(1238, 300, 74, 100)),
      back('ink', 'M 1250 322 h 46 M 1250 342 h 50 M 1250 362 h 40 M 1250 382 h 48', 2),
    ],
    list_ring: [back('red', ellipse(1275, 350, 58, 70), 3.5)],
    ticks: [back('red', 'M 1242 318 l 5 6 l 10 -12 M 1242 338 l 5 6 l 10 -12 M 1242 358 l 5 6 l 10 -12 M 1242 378 l 5 6 l 10 -12', 3)],
    you_stand: person(640, FLOOR, FIG, YOU, { pose: 'phone' }),
    chat: [
      ...bubble(470, 110, 230, 52, [652, 302], ["pub lunch? 1pm"]),
      ...bubble(500, 176, 230, 52, [652, 302], ["who's about??"]),
    ],
    you_gym: [...person(640, FLOOR, FIG, YOU, { pose: 'walk' }), fill('blue', `${rect(590, FLOOR - 100, 60, 34)}`), back('navy', `M 600 ${FLOOR - 100} q 20 -26 40 0`, 3)],
    headphones: [back('ink', 'M 403 324 a 20 24 0 0 1 40 0', 5), fill('ink', `${rect(397, 318, 12, 18)} ${rect(437, 318, 12, 18)}`), back('navy', 'M 490 220 v 40 a 8 7 0 1 1 -6 -6 M 530 190 v 40 a 8 7 0 1 1 -6 -6 M 530 190 l 24 -8 v 40 a 8 7 0 1 1 -6 -6', 3, 'fw-float')],
    you_lying: person(360, FLOOR - 70, FIG, YOU, { pose: 'lie' }),
    mug: [fill('white', rect(660, FLOOR - 30, 26, 30)), back('grey', `M 686 ${FLOOR - 24} a 8 9 0 0 1 0 18`, 3), back('grey', 'M 668 425 q 6 -10 0 -20 M 680 425 q 6 -10 0 -20', 2, 'fw-float')],
    you_call: [...person(560, FLOOR, FIG, YOU, { pose: 'phone' }), fill('brown', rect(510, FLOOR - 82, 30, 40))],
    ring: [back('ink', 'M 600 290 a 24 24 0 0 1 0 34 M 616 278 a 40 40 0 0 1 0 58', 3, 'fw-twinkle')],
  },

  move: {
    sun: [fill('yellow', circle(300, 190, 40)), back('gold', 'M 300 128 v -24 M 300 252 v 24 M 238 190 h -24 M 362 190 h 24 M 256 146 l -16 -16 M 344 146 l 16 -16 M 256 234 l -16 16 M 344 234 l 16 16', 4)],
    pavement: [fill('grey', rect(100, GROUND, 1400, 200)), back('white', `M 100 ${GROUND + 2} H 1500`, 3)],
    building: [
      fill('tan', rect(820, 110, 360, GROUND - 110)),
      fill('sky', [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => rect(850 + c * 115, 140 + r * 110, 70, 70))).join(' ')),
      fill('navy', rect(965, GROUND - 100, 70, 100)),
      back('brown', `${rect(820, 110, 360, GROUND - 110)} M 820 230 H 1180 M 820 340 H 1180`, 3),
      words('ink', '14', 1000, GROUND - 112, 18),
    ],
    van: [
      fill('white', `${rect(440, GROUND - 170, 290, 140)} ${shape([440, GROUND - 120], [440, GROUND - 30], [360, GROUND - 30], [360, GROUND - 90], [390, GROUND - 120])}`),
      fill('sky', shape([382, GROUND - 112], [430, GROUND - 112], [430, GROUND - 82], [370, GROUND - 82])),
      fill('ink', `${circle(410, GROUND - 22, 22)} ${circle(670, GROUND - 22, 22)}`),
      back('grey', `${rect(440, GROUND - 170, 290, 140)} M 440 ${GROUND - 120} L 390 ${GROUND - 120} L 360 ${GROUND - 90} V ${GROUND - 30} H 440`, 3),
      words('blue', 'TRUCK RENTAL', 585, GROUND - 95, 26),
    ],
    sofa_out: [
      fill('pink', `${rect(1130, GROUND - 100, 150, 60)} ${rect(1120, GROUND - 60, 170, 50)}`),
      fill('brown', `${rect(1130, GROUND - 10, 12, 10)} ${rect(1268, GROUND - 10, 12, 10)}`),
    ],
    boxes: [
      fill('gold', `${rect(1140, GROUND - 160, 70, 60)} ${rect(1215, GROUND - 150, 60, 50)} ${rect(1160, GROUND - 210, 60, 50)}`),
      back('brown', `M 1140 ${GROUND - 140} h 70 M 1215 ${GROUND - 132} h 60 M 1160 ${GROUND - 192} h 60`, 3),
    ],
    hannah: person(1080, GROUND, FIG, BECCA, { dir: -1, pose: 'wave' }),
    you_box: [...person(880, GROUND, FIG, YOU, { dir: -1, pose: 'carry' }), fill('gold', rect(800, GROUND - 130, 60, 54)), back('brown', `M 800 ${GROUND - 112} h 60`, 3)],
    photo: [
      fill('white', rect(500, 80, 200, 160)),
      fill('sky', rect(514, 94, 172, 70)),
      fill('green', shape([514, 164], [560, 130], [610, 150], [650, 124], [686, 164])),
      fill('blue', rect(514, 164, 172, 46)),
      fill('white', shape([590, 184], [630, 184], [622, 196], [598, 196])),
      back('grey', rect(500, 80, 200, 160), 2),
    ],
  },

  lake: {
    sky: [fill('sky', rect(100, 0, 1400, WATER))],
    sun: [fill('yellow', circle(1150, 120, 46))],
    hills: [
      fill('leaf', `M 100 ${WATER} L 100 250 Q 300 170 520 240 Q 760 160 1000 230 Q 1250 150 1500 240 L 1500 ${WATER} Z`),
      fill('green', `M 100 ${WATER} L 100 290 Q 380 240 640 290 Q 900 250 1120 300 Q 1320 270 1500 300 L 1500 ${WATER} Z`),
    ],
    water: [fill('blue', rect(100, WATER, 1400, 300))],
    ripples: glints(200, 1400, WATER + 20, 600, 22),
    boat_far: [
      fill('white', shape([1010, 365], [1110, 365], [1098, 380], [1022, 380])),
      fill('yellow', circle(1040, 352, 9)),
      fill('ink', circle(1080, 352, 9)),
    ],
    jetty: [fill('brown', rect(100, 410, 460, 22)), fill('brown', `${rect(160, 432, 14, 70)} ${rect(330, 432, 14, 70)} ${rect(500, 432, 14, 70)}`), back('ink', 'M 100 421 H 560', 2)],
    you_jetty: person(430, 410, FIG, YOU, { dir: 1 }),
    you_boat: person(760, 450, FIG, YOU, { pose: 'sit' }),
    leo: person(1020, 450, FIG, LEO, { dir: -1, pose: 'sit' }),
    boat: hull(880, 470, 1.1),
    drink: [fill('gold', rect(806, 360, 14, 30)), fill('white', rect(806, 356, 14, 6))],
    buzz: [fill('ink', rect(740, 400, 16, 24)), back('red', 'M 726 398 l -10 -6 M 726 412 h -12 M 770 398 l 10 -6 M 770 412 h 12', 3, 'fw-buzz')],
    bubble_fun: [words('green', 'BECCA', 650, 152, 18, 'start'), ...bubble(640, 160, 260, 56, [780, 290], ['Have fun x'])],
  },

  park: {
    sky: [fill('sky', rect(100, 0, 1400, LAWN))],
    gold: [fill('peach', rect(100, 0, 1400, LAWN)), fill('yellow', rect(100, LAWN - 120, 1400, 120))],
    dusk: [fill('dusk', rect(100, 0, 1400, LAWN)), fill('navy', rect(100, LAWN - 120, 1400, 120))],
    sun_low: [fill('gold', circle(470, LAWN - 70, 60))],
    clouds: [cloud(560, 130, 1, 'fw-drift'), cloud(1000, 90, 0.7, 'fw-drift fw-drift-1')],
    trees: [...tree(290, LAWN + 10, 1, 10), ...tree(1280, LAWN + 10, 1.15, 30)],
    grass: [fill('leaf', rect(100, LAWN, 1400, 200)), back('green', Array.from({ length: 26 }, (_, i) => `M ${150 + i * 50 + rand(i) * 20} ${LAWN + 120 + rand(i + 50) * 60} l 4 -12 l 4 12`).join(' '), 2)],
    river: [fill('blue', `M 100 ${LAWN + 40} Q 500 ${LAWN + 20} 800 ${LAWN + 50} T 1500 ${LAWN + 40} V ${LAWN + 100} Q 1100 ${LAWN + 110} 800 ${LAWN + 95} T 100 ${LAWN + 100} Z`), ...glints(200, 1350, LAWN + 55, LAWN + 85, 9)],
    bench: [
      fill('brown', `${rect(780, LAWN - 95, 180, 14)} ${rect(780, LAWN - 70, 180, 14)} ${rect(780, LAWN - 45, 180, 12)}`),
      fill('ink', `${rect(790, LAWN - 34, 10, 34)} ${rect(940, LAWN - 34, 10, 34)}`),
    ],
    heron: [
      fill('grey', `M 600 ${LAWN + 20} q -40 -20 -10 -60 q 30 -10 50 10 q 10 30 -40 50 Z`),
      back('grey', `M 610 ${LAWN - 30} q -10 -30 6 -50`, 6),
      fill('grey', circle(618, LAWN - 84, 9)),
      back('ink', `M 624 ${LAWN - 86} l 28 6 M 596 ${LAWN + 12} v 50 M 610 ${LAWN + 12} v 50`, 3),
    ],
    you_walk: person(1000, LAWN + 25, FIG, YOU, { dir: -1, pose: 'walk' }),
    you_bench: person(860, LAWN, FIG, YOU, { pose: 'sit' }),
    book: [fill('white', shape([890, LAWN - 72], [920, LAWN - 80], [950, LAWN - 72], [950, LAWN - 50], [920, LAWN - 58], [890, LAWN - 50])), back('grey', `M 920 ${LAWN - 80} V ${LAWN - 58}`, 2)],
    you_grass: person(1200, LAWN + 30, FIG, YOU, { dir: -1, pose: 'lie' }),
    cloud_ship: [
      fill('white', `${shape([640, 170], [900, 170], [860, 215], [680, 215])} ${shape([760, 160], [760, 70], [840, 160])} ${shape([745, 160], [745, 90], [690, 160])}`, 'fw-drift'),
    ],
    lamps: [
      back('ink', `M 560 ${LAWN} V 280 M 1120 ${LAWN} V 280`, 6),
      fill('yellow', `${rect(545, 262, 30, 24)} ${rect(1105, 262, 30, 24)}`),
      back('yellow', 'M 540 300 l -18 14 M 580 300 l 18 14 M 1100 300 l -18 14 M 1140 300 l 18 14', 3, 'fw-twinkle'),
    ],
    screen: [fill('sky', rect(888, LAWN - 76, 14, 22)), back('sky', `M 896 ${LAWN - 80} l -14 -26 M 896 ${LAWN - 80} l 10 -28`, 2)],
    table: [
      fill('brown', rect(700, LAWN - 80, 320, 18)),
      fill('brown', `${shape([730, LAWN - 62], [748, LAWN - 62], [720, LAWN], [702, LAWN])} ${shape([972, LAWN - 62], [990, LAWN - 62], [1018, LAWN], [1000, LAWN])}`),
      fill('brown', `${rect(640, LAWN - 44, 120, 12)} ${rect(960, LAWN - 44, 120, 12)}`),
    ],
    friends: [
      ...person(990, LAWN, FIG, { top: 'navy', legs: 'ink', hair: 'ink' }, { dir: -1, pose: 'sit' }),
      ...person(1070, LAWN, FIG, { top: 'pink', hair: 'gold', long: true }, { dir: -1, pose: 'sit' }),
      ...person(1170, LAWN + 10, FIG, { top: 'blue', hair: 'brown' }, { dir: -1, pose: 'wave' }),
    ],
    you_table: person(690, LAWN, FIG, YOU, { pose: 'sit' }),
    pints: [fill('gold', `${rect(760, LAWN - 112, 18, 32)} ${rect(900, LAWN - 112, 18, 32)} ${rect(940, LAWN - 112, 18, 32)}`), fill('white', `${rect(760, LAWN - 116, 18, 6)} ${rect(900, LAWN - 116, 18, 6)} ${rect(940, LAWN - 116, 18, 6)}`)],
  },
};

// ---------------------------------------------------------------------------
// a picture, and its parts
// ---------------------------------------------------------------------------

function Mark({ item }: { item: Item }) {
  if ('text' in item) {
    return (
      <text style={{ ...styles.type, fontSize: item.size }} x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]}>
        {item.text}
      </text>
    );
  }
  const el =
    'fill' in item ? (
      <path d={item.d} fill={C[item.fill]} />
    ) : (
      <path d={item.d} fill="none" stroke={C[item.back]} strokeWidth={item.w ?? 3.5} strokeDasharray="7 2.5" strokeLinecap="round" strokeLinejoin="round" />
    );
  return item.cls ? (
    <g className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
      {el}
    </g>
  ) : (
    el
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a picture stitches it afresh
  starts: Record<string, number>; //when each part began stitching in, in seconds after it appeared
}

//new parts are stitched one after another; on a fresh picture they wait for the old one to fade
function startTimes(parts: string[], from: number) {
  return Object.fromEntries(parts.map((part, i) => [part, from + i * PART_GAP]));
}

function turn(shown: Shown, cue: Cue): { now: Shown; prev?: Shown } {
  if (cue.page === shown.cue.page) {
    const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
    return { now: { ...shown, cue, starts: { ...shown.starts, ...startTimes(added, 0.1) } } };
  }
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, 0.6) }, prev: shown };
}

//cross stitch goes through the grid filter and the stitch mask; backstitch and lettering sit on top
function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  const layer = (crosses: boolean) =>
    shown.cue.parts.map((part) => (
      <g key={part} className="fw-stitch" style={{ animationDelay: `${shown.starts[part] ?? 0}s` }}>
        {ART[shown.cue.page][part]
          .filter((item) => 'fill' in item === crosses)
          .map((item, i) => (
            <Mark key={i} item={item} />
          ))}
      </g>
    ));
  return (
    <g className={leaving ? 'fw-fade' : undefined} clipPath="url(#fw-hoop)">
      <g filter="url(#fw-raise)">
        <g mask="url(#fw-x)">
          <g filter="url(#fw-grid)">{layer(true)}</g>
        </g>
      </g>
      <g filter="url(#fw-raise)">{layer(false)}</g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  lake: new URL('./sounds/lake.m4a', import.meta.url).href,
  park: new URL('./sounds/park.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//a quiet flat, Becca's street, water lapping at the lake, and the river and birds in the park (quieter after dark)
function mixFor(cue: Cue): Partial<Record<Bed, number>> {
  if (cue.page === 'flat') return { room: 0.7 };
  if (cue.page === 'move') return { street: 0.6 };
  if (cue.page === 'lake') return { lake: 0.8 };
  return { park: cue.parts.includes('dusk') ? 0.5 : 0.8 };
}

const MESSAGE: OneShot = { src: new URL('./sounds/message.m4a', import.meta.url).href, volume: 0.5, delay: 0.8 };
const BOX: OneShot = { src: new URL('./sounds/box.m4a', import.meta.url).href, volume: 0.7, delay: 1.5 };
const ONE_SHOTS: Record<string, OneShot> = { text_hannah: MESSAGE, text_leo: MESSAGE, ask: MESSAGE, bail: MESSAGE, group_chat: MESSAGE, keep: BOX };

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Sampler({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, 0.6) },
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
    if (!cues[animation]) console.warn(`The Free Weekend has no cue for the animation "${animation}"`);
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
  const { cx, cy, rx, ry } = HOOP;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          {/* snaps shapes to the cloth: each cell takes the colour at its middle */}
          <filter id="fw-grid" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <feFlood x={CELL / 2 - 1} y={CELL / 2 - 1} width="2" height="2" />
            <feComposite width={CELL} height={CELL} />
            <feTile result="dots" />
            <feComposite in="SourceGraphic" in2="dots" operator="in" />
            <feMorphology operator="dilate" radius={CELL / 2 - 1} />
          </filter>
          {/* one cross per cell; the second leg sits a shade under the first, like real thread */}
          <pattern id="fw-x-cell" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <path d="M 8.3 1.7 L 1.7 8.3" stroke="#cfcfcf" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M 1.7 1.7 L 8.3 8.3" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
          </pattern>
          <mask id="fw-x" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill="url(#fw-x-cell)" />
          </mask>
          <filter id="fw-raise" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="0.6" dy="1.2" stdDeviation="0.6" floodColor="#4a3a28" floodOpacity="0.45" />
          </filter>
          {/* the holes of the aida weave */}
          <pattern id="fw-aida" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect width={CELL} height={CELL} fill={C.cloth} />
            <path d="M 0 5 H 10 M 5 0 V 10" stroke="#fffaf0" strokeWidth="2.5" strokeOpacity="0.5" />
            <rect width="2" height="2" x="-1" y="-1" fill="#c9bb9a" />
            <rect width="2" height="2" x="9" y="9" fill="#c9bb9a" />
            <rect width="2" height="2" x="9" y="-1" fill="#c9bb9a" />
            <rect width="2" height="2" x="-1" y="9" fill="#c9bb9a" />
          </pattern>
          <filter id="fw-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="4" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 1.4 -0.7" />
          </filter>
          <clipPath id="fw-hoop">
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
          </clipPath>
          <radialGradient id="fw-slack" cx="0.5" cy="0.35" r="0.7">
            <stop offset="0.5" stopColor="#5b4630" stopOpacity="0.1" />
            <stop offset="1" stopColor="#3a2b1c" stopOpacity="0.45" />
          </radialGradient>
          <filter id="fw-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#2b1d10" floodOpacity="0.45" />
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#fw-aida)" />
        <rect width={W} height={H} filter="url(#fw-grain)" opacity={0.25} />
        {/* the loose cloth outside the hoop sits in shadow */}
        <path d={`${rect(0, 0, W, H)} ${ellipse(cx, cy, rx, ry)}`} fillRule="evenodd" fill="url(#fw-slack)" />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
        <g filter="url(#fw-shadow)">
          <ellipse cx={cx} cy={cy} rx={rx + 12} ry={ry + 12} fill="none" stroke="#b98a55" strokeWidth={22} />
          <ellipse cx={cx} cy={cy} rx={rx + 18} ry={ry + 18} fill="none" stroke="#e0bd8a" strokeWidth={3} strokeOpacity={0.7} />
          <ellipse cx={cx} cy={cy} rx={rx + 1} ry={ry + 1} fill="none" stroke="#8a6238" strokeWidth={3} />
          <rect x={cx - 26} y={cy - ry - 34} width={52} height={30} rx={4} fill="#b98a55" />
          <rect x={cx - 44} y={cy - ry - 28} width={88} height={14} rx={7} fill="#c9a24a" />
          <circle cx={cx + 50} cy={cy - ry - 21} r={11} fill="#d8b75c" stroke="#9c7c2e" strokeWidth={2} />
        </g>
        {/* the needle, still threaded with red, parked in the cloth */}
        <path d={`M 150 70 L 290 40`} stroke="#b8bcc2" strokeWidth={4} strokeLinecap="round" />
        <path d={`M 284 41 q 40 -10 30 30 t 60 60 q 20 40 -20 70`} stroke={C.red} strokeWidth={3} fill="none" strokeDasharray="12 5" />
      </svg>

      <div style={{ ...styles.card, opacity: card ? 1 : 0 }}>
        {card && (
          <div style={styles.label}>
            <div style={styles.kicker}>{card[0]}</div>
            <div style={styles.name}>{card[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.fw-stitch {
  animation: fw-stitch 0.9s steps(9) backwards;
}
@keyframes fw-stitch {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
.fw-fade {
  animation: fw-fade 0.6s ease-in forwards;
}
@keyframes fw-fade {
  to { opacity: 0; }
}
.fw-glint {
  animation: fw-glint 3s ease-in-out infinite;
}
.fw-glint-1 { animation-delay: -1s; }
.fw-glint-2 { animation-delay: -2s; }
@keyframes fw-glint {
  50% { opacity: 0.1; transform: translateX(6px); }
}
.fw-twinkle {
  animation: fw-twinkle 1.4s steps(1) infinite;
}
@keyframes fw-twinkle {
  50% { opacity: 0.2; }
}
.fw-drift {
  animation: fw-drift 30s linear infinite alternate;
}
.fw-drift-1 { animation-duration: 40s; animation-delay: -12s; }
@keyframes fw-drift {
  from { transform: translateX(-60px); }
  to { transform: translateX(80px); }
}
.fw-float {
  animation: fw-float 2.4s ease-in-out infinite;
}
@keyframes fw-float {
  50% { transform: translateY(-8px); opacity: 0.5; }
}
.fw-buzz {
  animation: fw-buzz 0.3s linear infinite;
}
@keyframes fw-buzz {
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
`;

const LETTERING = "'Trebuchet MS', 'Gill Sans', 'Segoe UI', sans-serif";

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.cloth,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: LETTERING,
    fontWeight: 700,
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: "Georgia, 'Times New Roman', serif",
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  //a woven name label, sewn on with red running stitch
  label: {
    textAlign: 'center',
    padding: '18px 52px 22px',
    background: '#fbf6ea',
    border: `3px dashed ${C.red}`,
    outline: `10px solid #fbf6ea`,
    boxShadow: '0 6px 18px rgba(43, 29, 16, 0.35)',
  },
  kicker: {
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: 2,
    color: C.brown,
    paddingBottom: 6,
  },
  name: {
    fontSize: 84,
    lineHeight: 1.1,
    color: C.red,
    letterSpacing: 1,
  },
};

export default Sampler;
