import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Layers, type Layer } from '../layers';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Cabin is cut from coloured paper and seen from straight above: the friends are paper shoulders and heads round a
// big wooden table, with the snack counter along the top wall, the stone fireplace on the right and snow at the
// window. Every part casts a soft shadow, as if it's been laid on the floor of the room, and speech is paper bubbles.
// A cue names a room and the parts to show: a new room is laid down, and new parts in the same room drop in after it.
// The wall clock keeps the time, and while the real clock runs, its hands go round from nine to ten. Everything is SVG
// in a fixed 1600x900 space, scaled to cover the screen, kept to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
const VIEW = `0 0 ${W} ${H}`;
type Pt = [number, number];

const INK = '#2a2226';
const PAPER = '#f6efe1';
const WHITE = '#ffffff';
const FLOOR = '#c4935f';
const BOARD_LINE = '#b3834f';
const LOG = '#6b4528';
const RUG = '#8c2f2f';
const RUG_EDGE = '#d8ad55';
const WOOD = '#8a5634';
const WOOD_DARK = '#6a3f25';
const COUNTER = '#d9c29a';
const STONE = '#8e8a84';
const STONE_DARK = '#6b6863';
const GOLD = '#e2b04c';
const PINE = '#2b6b4a';
const PINE_DARK = '#1f5038';
const RED = '#c7363f';
const GLASS = '#a9cfe0';
const DUSK = '#1d2850';
const TEAR = '#6cb6ea';
const FLAME = '#f08a2c';
const CHILI = '#9c3b22';
const NIGHT_FLOOR = '#2a3454';
const NIGHT_WALL = '#18203b';
const SERIF = 'Georgia, "Times New Roman", serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//a paper shape, or a stroke when it has a line colour; lettering; or a group of either, moved by an svg transform
type Shape = { d: string; fill: string; line?: string; w?: number; op?: number; cls?: string };
type Words = { text: string; x: number; y: number; size: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; font?: string; italic?: boolean; weight?: number; op?: number; cls?: string };
type Group = { t: string; items: Item[]; cls?: string };
type Item = Shape | Words | Group;

const r1 = (n: number) => Math.round(n * 10) / 10;
const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map(r1).join(' ')).join(' L ')}`;
const poly = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const circle = (x: number, y: number, r: number) => `M ${r1(x - r)} ${r1(y)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellipse = (x: number, y: number, rx: number, ry: number) => `M ${r1(x - rx)} ${r1(y)} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
//a star, or a pine tree seen from above when it has many points
const star = (x: number, y: number, ro: number, ri: number, n: number, turn = 0) =>
  poly(...Array.from({ length: n * 2 }, (_, i): Pt => {
    const a = ((i * Math.PI) / n) + turn - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    return [x + r * Math.cos(a), y + r * Math.sin(a)];
  }));
const say = (text: string, x: number, y: number, size: number, more: Partial<Words> = {}): Words => ({ text, x, y, size, ...more });
const at = (x: number, y: number, a = 0, s = 1) => `translate(${x} ${y}) rotate(${a}) scale(${s})`;
//the angle a person at from must turn to face to
const face = ([x0, y0]: Pt, [x1, y1]: Pt) => (Math.atan2(-(x1 - x0), y1 - y0) * 180) / Math.PI;

//a speech bubble with its tail pointing at tail
function bubble(x: number, y: number, w: number, lines: string[], tail: Pt, size = 30): Item[] {
  const h = lines.length * size * 1.2 + size * 0.9;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return [
    { d: poly([cx - 20, cy], [cx + 20, cy], tail), fill: WHITE },
    { d: round(x, y, w, h, 24), fill: WHITE },
    ...lines.map((l, i) => say(l, cx, y + size * 1.15 + i * size * 1.2, size, { anchor: 'middle', font: HAND, fill: INK, weight: 700 })),
  ];
}

//a thought bubble: a cloud of paper, with two small puffs trailing back to from
function thought(x: number, y: number, r: number, from: Pt, inside: Item[] = []): Item[] {
  const [fx, fy] = from;
  return [
    { d: circle(fx + (x - fx) * 0.3, fy + (y - fy) * 0.3, r * 0.12), fill: PAPER },
    { d: circle(fx + (x - fx) * 0.55, fy + (y - fy) * 0.55, r * 0.2), fill: PAPER },
    { d: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => circle(x + Math.cos((i * Math.PI) / 4) * r * 0.72, y + Math.sin((i * Math.PI) / 4) * r * 0.6, r * 0.42)).join(' ') + circle(x, y, r * 0.8), fill: PAPER },
    ...inside,
  ];
}

//a tear, falling
const tear = (x: number, y: number, s = 1, delay = 0): Item => ({ t: `translate(${x} ${y}) scale(${s})`, cls: `cb-drip${delay ? ' cb-late' : ''}`, items: [{ d: 'M 0 -14 Q 10 0 7 6 A 8 8 0 1 1 -7 6 Q -10 0 0 -14 Z', fill: TEAR }] });
const heart = (x: number, y: number, s: number, fill = RED): Item => ({ t: `translate(${x} ${y}) scale(${s})`, cls: 'cb-bob', items: [{ d: 'M 0 10 C -14 0 -14 -12 -6 -12 C -2 -12 0 -9 0 -7 C 0 -9 2 -12 6 -12 C 14 -12 14 0 0 10 Z', fill }] });
const sparkle = (x: number, y: number, s: number, fill = GOLD): Item => ({ t: `translate(${x} ${y}) scale(${s})`, cls: 'cb-twinkle', items: [{ d: star(0, 0, 14, 4, 4), fill }] });
//a scatter of stars or snowflakes, all in one path
const starField = (n: number, seed: number, size: number, box: [number, number, number, number]) =>
  Array.from({ length: n }, (_, i) => {
    const rx = Math.abs(Math.sin(i * 12.9898 + seed) * 43758.5453) % 1;
    const ry = Math.abs(Math.sin(i * 78.233 + seed) * 12345.6789) % 1;
    return star(box[0] + rx * (box[2] - box[0]), box[1] + ry * (box[3] - box[1]), size, size * 0.4, 5);
  }).join(' ');
//boards running across the floor
const boards = (x0: number, x1: number, y0: number, y1: number, gap: number) =>
  Array.from({ length: Math.ceil((y1 - y0) / gap) }, (_, i) => line([x0, y0 + i * gap], [x1, y0 + i * gap])).join(' ');
//flames, seen from above, flickering
const flames = (x: number, y: number, s: number): Group => ({
  t: at(x, y, 0, s),
  cls: 'cb-flicker',
  items: [{ d: star(0, 0, 46, 22, 7), fill: FLAME }, { d: star(0, 0, 28, 14, 6, 0.3), fill: GOLD }, { d: circle(0, 0, 10), fill: '#fff2b0' }],
});

// ---------------------------------------------------------------------------
// people, seen from above: paper shoulders and a head. Drawn facing down the page, then turned with a, so a person at
// a = 0 faces down, 180 faces up, -90 faces right and 90 faces left
// ---------------------------------------------------------------------------

type Who = { shirt: string; hair: string; skin: string; hat?: string; bald?: boolean; curly?: boolean };
const YOU: Who = { shirt: '#cf3b3b', hair: '#4e3426', skin: '#efc8a5' };
const ROSA: Who = { shirt: '#e48aa3', hair: '#2a1d18', skin: '#c48c62', curly: true };
const JUN: Who = { shirt: '#2f8f8a', hair: '#151515', skin: '#e8c39c' };
const MAYA: Who = { shirt: '#7a5aa6', hair: '#e2c792', skin: '#efc8a5' };
const CAL: Who = { shirt: '#2f3f66', hair: '#b5612e', skin: '#efc8a5', hat: '#d8a83a' };

//where each pose puts the hands: shoulder to hand, left then right
type Pose = 'table' | 'side' | 'phone' | 'hug' | 'reach' | 'carry';
const ARMS: Record<Pose, [Pt, Pt][]> = {
  table: [[[-30, 4], [-24, 44]], [[30, 4], [24, 44]]],
  side: [[[-36, 4], [-42, 24]], [[36, 4], [42, 24]]],
  phone: [[[-30, 4], [-24, 44]], [[32, 2], [24, -6]]],
  hug: [[[-34, 6], [-12, 54]], [[34, 6], [12, 54]]],
  reach: [[[-26, 6], [-6, 88]], [[26, 6], [6, 88]]],
  carry: [[[-32, 6], [-26, 40]], [[32, 6], [26, 40]]],
};

//held is drawn under the hands, in the person's own frame. A hat is a knitted one, seen from above
function person([x, y]: Pt, a: number, who: Who, pose: Pose = 'table', held: Item[] = []): Group {
  const items: Item[] = [...held];
  for (const [s, h] of ARMS[pose]) items.push({ d: line(s, h), fill: 'none', line: who.shirt, w: 15 }, { d: circle(h[0], h[1], 8), fill: who.skin });
  items.push({ d: ellipse(0, 0, 42, 20), fill: who.shirt });
  items.push({ d: circle(0, -2, 21), fill: who.skin });
  if (who.hat) items.push({ d: circle(0, -6, 21), fill: who.hat }, { d: circle(0, -6, 6), fill: PAPER });
  else if (who.curly) items.push({ d: [180, 210, 240, 270, 300, 330, 360].map((d) => circle(14 * Math.cos((d * Math.PI) / 180), -6 + 14 * Math.sin((d * Math.PI) / 180), 8)).join(' ') + circle(0, -8, 16), fill: who.hair });
  else items.push({ d: circle(0, -8, 19), fill: who.hair });
  if (pose === 'phone') items.push({ d: round(16, -20, 11, 22, 3), fill: INK });
  return { t: at(x, y, a), items };
}

//a wooden chair, its back behind whoever sits in it
const chair = ([x, y]: Pt, a: number): Group => ({ t: at(x, y, a), items: [{ d: round(-30, -44, 60, 12, 5), fill: WOOD_DARK }, { d: round(-27, -30, 54, 52, 8), fill: WOOD }] });

// ---------------------------------------------------------------------------
// the rooms and what's in them, each in painter's order. Parts starting with _ are always shown. FLAT parts are light
// and dark, so they don't cast a shadow
// ---------------------------------------------------------------------------

type Room = 'cover' | 'lodge' | 'bunks' | 'card';
const FLAT = new Set(['night', 'beams', 'glow', 'sun', 'moon']);

//the main room: log walls, the snack counter along the top, the window on the left of it, the front door in the left
//wall, the stone fireplace in the right wall with the rug in front of it, and the big table in the middle
const WINDOW: [number, number] = [200, 500];
const DOOR: [number, number] = [380, 500]; //top and bottom of the door, in the left wall
const FIRE: Pt = [1470, 430];
const SEAT: Record<string, [Pt, number]> = {
  rosa: [[520, 252], 0],
  you: [[720, 252], 0],
  jun: [[600, 548], 180],
  maya: [[820, 548], 180],
  cal: [[1052, 400], 90],
};
const placeOf = (seat: string, out = 92): Pt => {
  const [[x, y], a] = SEAT[seat];
  const rad = (a * Math.PI) / 180;
  return [x - Math.sin(rad) * out, y + Math.cos(rad) * out];
};
const seated = (seat: string, who: Who, pose: Pose = 'table') => person(SEAT[seat][0], SEAT[seat][1], who, pose);
const bowl = ([x, y]: Pt): Item[] => [{ d: circle(x, y, 28), fill: WHITE }, { d: circle(x, y, 20), fill: CHILI }, { d: circle(x - 5, y - 4, 5) + circle(x + 6, y + 3, 4), fill: '#f3e6c4' }];
const FOUR = ['rosa', 'you', 'jun', 'maya'];
//on the rug by the fire, everyone turned toward it
const RUG_SPOT: Record<string, Pt> = { you: [1190, 430], rosa: [1230, 315], jun: [1240, 548], maya: [1340, 255], cal: [1345, 610] };
const byFire = (seat: string, who: Who) => person(RUG_SPOT[seat], face(RUG_SPOT[seat], FIRE), who, 'table');

const LODGE: Record<string, Item[]> = {
  _floor: [
    { d: rect(0, 0, W, H), fill: FLOOR },
    { d: boards(0, W, 120, H, 44), fill: 'none', line: BOARD_LINE, w: 3 },
    { d: rect(0, 0, W, 84), fill: LOG },
    { d: rect(0, 0, 60, H), fill: LOG },
    { d: rect(W - 60, 0, 60, H), fill: LOG },
    { d: [20, 44, 68].map((y) => line([0, y], [W, y])).join(' '), fill: 'none', line: '#57381f', w: 3 },
    { d: rect(WINDOW[0], 30, WINDOW[1] - WINDOW[0], 46), fill: GLASS },
    { d: starField(14, 2, 5, [WINDOW[0] + 8, 36, WINDOW[1] - 8, 70]), fill: WHITE },
    { d: rect((WINDOW[0] + WINDOW[1]) / 2 - 4, 30, 8, 46), fill: PAPER },
    { d: rect(16, DOOR[0], 44, DOOR[1] - DOOR[0]), fill: WOOD_DARK },
    { d: circle(50, (DOOR[0] + DOOR[1]) / 2, 6), fill: GOLD },
  ],
  _counter: [
    { d: rect(620, 84, 600, 104), fill: COUNTER },
    { d: rect(620, 180, 600, 8), fill: '#bfa57a' },
  ],
  _fireplace: [
    { d: round(W - 200, 290, 150, 280, 10), fill: STONE },
    { d: [310, 350, 390, 430, 470, 510, 550].map((y) => line([W - 200, y], [W - 50, y])).join(' '), fill: 'none', line: STONE_DARK, w: 3 },
    { d: round(W - 170, 340, 100, 180, 8), fill: '#2b2220' },
    { d: round(W - 160, 400, 80, 18, 8) + round(W - 156, 438, 72, 18, 8), fill: WOOD_DARK },
    flames(FIRE[0] - 10, FIRE[1] - 4, 1),
  ],
  _rug: [{ d: ellipse(1290, 430, 170, 150), fill: RUG_EDGE }, { d: ellipse(1290, 430, 156, 136), fill: RUG }],
  _chairs: Object.values(SEAT).map(([p, a]) => chair(p, a)),
  _table: [
    { d: round(400, 300, 600, 200, 16), fill: WOOD },
    { d: [340, 380, 420, 460].map((y) => line([410, y], [990, y])).join(' '), fill: 'none', line: WOOD_DARK, w: 2 },
  ],
  chips: [
    ...[[660, '#e9c33a'], [740, RED], [820, '#3b6db3']].flatMap(([x, c]): Shape[] => [
      { d: round(x as number, 100, 66, 72, 12), fill: c as string },
      { d: circle((x as number) + 33, 136, 16), fill: PAPER },
    ]),
  ],
  candy: [{ d: round(920, 96, 120, 84, 22), fill: '#8a3fb8' }, { d: star(980, 138, 22, 10, 5), fill: GOLD }, { d: circle(944, 112, 7) + circle(1018, 160, 7) + circle(1012, 112, 6), fill: '#e86aa0' }],
  candy_low: [{ d: round(940, 112, 76, 60, 16), fill: '#8a3fb8' }, { d: star(978, 142, 14, 6, 5), fill: GOLD }],
  wrappers: [{ d: star(900, 160, 11, 5, 6) + star(1070, 120, 10, 5, 6, 0.3) + star(1080, 164, 9, 4, 6, 0.6) + star(760, 330, 10, 4, 6) + star(690, 360, 9, 4, 6, 0.4), fill: '#c97ae0' }],
  cheese: [{ d: round(1090, 100, 110, 76, 10), fill: '#b98454' }, { d: poly([1104, 112], [1140, 112], [1104, 150]) + poly([1150, 164], [1188, 164], [1188, 124]), fill: '#f1cf5b' }],
  cards: [...[[660, 400, -8], [700, 410, 10], [740, 396, 4], [780, 404, -12]].map(([x, y, a]): Group => ({ t: at(x, y, a), items: [{ d: round(-16, -22, 32, 44, 4), fill: WHITE }, { d: star(0, 0, 8, 3, 4), fill: a > 0 ? RED : INK }] }))],
  bowls: [...FOUR.flatMap((s) => bowl(placeOf(s))), { d: round(660, 382, 90, 36, 8), fill: '#e7b65a' }, { d: line([690, 382], [690, 418]) + line([720, 382], [720, 418]), fill: 'none', line: '#c99a40', w: 3 }],
  pancakes: [...FOUR.flatMap((s) => { const [x, y] = placeOf(s); return [{ d: circle(x, y, 28), fill: WHITE } as Shape, { d: circle(x, y, 20), fill: '#e2a95a' } as Shape, { d: circle(x, y, 7), fill: '#f6e7a8' } as Shape]; })],
  rosa: [seated('rosa', ROSA)],
  you: [seated('you', YOU)],
  you_phone: [seated('you', YOU, 'phone')],
  jun: [seated('jun', JUN)],
  maya: [seated('maya', MAYA)],
  cal: [seated('cal', CAL)],
  cal_spot: [
    { d: circle(SEAT.cal[0][0], SEAT.cal[0][1] - 4, 62), fill: 'none', line: GOLD, w: 5, cls: 'cb-march' },
    say('?', SEAT.cal[0][0], SEAT.cal[0][1] + 12, 48, { anchor: 'middle', font: SERIF, fill: GOLD, weight: 700 }),
  ],
  you_counter: [person([980, 250], 180, YOU, 'reach')],
  jun_bubble: [...bubble(90, 330, 300, ['Next year:', 'somewhere new?'], [560, 540])],
  looks: [
    ...(['rosa', 'jun', 'maya'] as const).map((s): Shape => ({ d: line(SEAT[s][0], [720, 266]), fill: 'none', line: PAPER, w: 4, op: 0.85, cls: 'cb-march' })),
    ...bubble(790, 96, 140, ['. . .'], [740, 230]),
  ],
  napkin: [{ t: at(880, 400, 6), items: [{ d: rect(-70, -56, 140, 112), fill: WHITE }, ...['LISBON?', 'KYOTO?', 'OAXACA?'].map((c, i) => say(c, 0, -22 + i * 28, 20, { anchor: 'middle', font: HAND, fill: INK, weight: 700 }))] }, heart(820, 300, 1.2), sparkle(960, 330, 1.1)],
  clink: [sparkle(610, 230, 1.5), sparkle(640, 330, 1.3), say('Cheers!', 620, 140, 40, { anchor: 'middle', font: HAND, fill: INK, weight: 700 })],
  night: [{ d: rect(0, 0, W, H), fill: DUSK, op: 0.45 }, { d: rect(WINDOW[0], 30, WINDOW[1] - WINDOW[0], 46), fill: '#0d1430', op: 0.85 }, { d: starField(22, 7, 5, [WINDOW[0] + 6, 34, WINDOW[1] - 6, 72]), fill: WHITE, cls: 'cb-snow' }],
  glow: [{ d: ellipse(FIRE[0] - 60, FIRE[1], 340, 300), fill: '#ffb347', op: 0.18 }],
  voicemail: [...bubble(560, 96, 470, ["Hey, it's Cal!", 'Leave a message.'], [720, 230], 28)],
  crash: [
    ...thought(1150, 150, 80, [760, 230], [
      { d: line([1090, 190], [1150, 120], [1210, 190]), fill: 'none', line: WHITE, w: 10 },
      { t: at(1150, 150, 150, 0.6), items: [{ d: round(-54, -18, 108, 36, 12), fill: '#3b6db3' }, { d: circle(-32, 20, 11) + circle(32, 20, 11), fill: INK }] },
      { d: circle(1110, 118, 8), fill: '#3a7bff', cls: 'cb-blink' },
    ]),
  ],
  hold: [...bubble(820, 96, 420, ['♪  please hold  ♫'], [760, 230], 30)],
  calm: [...bubble(800, 96, 380, ["He's fine. Deal me in."], [760, 230], 28)],
  text: [{ t: at(1010, 210, 4), items: [{ d: round(-110, -70, 220, 140, 18), fill: INK }, { d: round(-96, -56, 192, 112, 10), fill: '#e8eef4' }, { d: round(-80, -40, 160, 44, 14), fill: '#3b8cf0' }, say('Where ARE you?', 0, -12, 22, { anchor: 'middle', font: SERIF, fill: WHITE, weight: 700 }), say('Not delivered', 0, 40, 18, { anchor: 'middle', font: SERIF, fill: RED, italic: true })] }],
  pulse: [
    { d: circle(720, 248, 64), fill: 'none', line: '#ff8a8a', w: 5, cls: 'cb-pulse' },
    { d: circle(720, 248, 64), fill: 'none', line: '#ff8a8a', w: 5, cls: 'cb-pulse cb-late' },
  ],
  //Rosa at the window, and you with her
  rosa_window: [person([350, 130], 180, ROSA, 'side')],
  you_near: [person([520, 220], face([520, 220], [350, 130]), YOU, 'side')],
  rosa_held: [person([350, 130], 0, ROSA, 'hug')],
  you_hug: [person([350, 196], 180, YOU, 'hug')],
  maya_hug: [person([350, 196], 180, MAYA, 'hug')],
  rosa_sit: [seated('rosa', ROSA, 'reach')],
  you_beside: [person([620, 252], 0, YOU, 'reach')],
  tissues: [{ d: round(540, 330, 64, 40, 6), fill: '#9fd0e0' }, { d: 'M 560 332 q 12 -26 24 0', fill: WHITE }],
  tears: [tear(330, 150, 1.2), tear(372, 148, 1.2, 0.6)],
  tears_both: [tear(320, 170, 1.2), tear(380, 166, 1.2, 0.6), tear(330, 220, 1.1, 0.3), tear(372, 224, 1.1, 0.9)],
  sweat: [tear(752, 236, 1.3), ...bubble(780, 96, 200, ['Um...'], [740, 230])],
  you_cocoa: [person([760, 250], 180, YOU, 'carry')],
  steam: [{ d: 'M 750 160 q -12 -20 0 -40 q 12 -20 0 -40 M 776 164 q -12 -20 0 -40 q 12 -20 0 -36', fill: 'none', line: WHITE, w: 7, op: 0.85, cls: 'cb-steam' }],
  beams: [{ t: 'translate(0 0)', cls: 'cb-sweep', items: [{ d: poly([260, 80], [440, 80], [960, 700], [560, 760]), fill: '#fff4c2', op: 0.32 }] }],
  //Cal at the door
  cal_in: [person([120, 440], -90, CAL, 'carry', [{ d: round(-30, 30, 60, 40, 10), fill: '#5b4a3a' }])],
  crowd: [
    person([300, 330], face([300, 330], [120, 440]), YOU, 'side'),
    person([330, 470], face([330, 470], [120, 440]), JUN, 'side'),
    person([260, 580], face([260, 580], [120, 440]), MAYA, 'side'),
  ],
  rosa_by: [person([230, 420], 90, ROSA, 'side')],
  sorry: [...bubble(160, 110, 320, ['Sorry! Sorry!'], [130, 410])],
  cal_hug: [person([120, 440], -90, CAL, 'hug')],
  rosa_hug: [person([186, 440], 90, ROSA, 'hug')],
  dropped: [{ d: round(110, 540, 70, 48, 10), fill: '#5b4a3a' }],
  love: [heart(150, 330, 1.6), heart(190, 300, 1.1, '#e86aa0')],
  relief_tears: [tear(170, 400, 1.2), tear(176, 470, 1.2, 0.6)],
  //everyone on the rug by the fire
  circle: [byFire('you', YOU), byFire('rosa', ROSA), byFire('jun', JUN), byFire('maya', MAYA), byFire('cal', CAL)],
  maya_bubble: [...bubble(760, 110, 440, ['Does any religion', 'actually have it right?'], [1330, 240])],
  talk: [
    { d: 'M 1120 300 q 20 -30 40 0 t 40 0', fill: 'none', line: PAPER, w: 5, cls: 'cb-bob' },
    { d: 'M 1180 600 q 20 -30 40 0 t 40 0', fill: 'none', line: PAPER, w: 5, cls: 'cb-bob' },
    sparkle(1270, 430, 1.2),
  ],
  sun: [{ d: rect(0, 0, W, H), fill: '#fff4c2', op: 0.14 }, { d: poly([WINDOW[0], 80], [WINDOW[1], 80], [800, 600], [300, 640]), fill: '#fff4c2', op: 0.22 }],
};

//the bunk room at night: your bunk against the top wall, you awake in it, the alarm clock on the shelf, moonlight on
//the floor, and Cal snoring through the right-hand wall
const BUNKS: Record<string, Item[]> = {
  _room: [
    { d: rect(0, 0, W, H), fill: NIGHT_FLOOR },
    { d: rect(0, 0, W, 84), fill: NIGHT_WALL },
    { d: rect(W - 140, 0, 140, H), fill: NIGHT_WALL },
    { d: rect(0, 0, 60, H), fill: NIGHT_WALL },
    { d: rect(260, 30, 240, 46), fill: '#0d1430' },
    { d: starField(9, 3, 4, [270, 36, 490, 70]), fill: '#e8ecff' },
    { d: round(640, 84, 280, 400, 14), fill: '#4a3a5a' },
    { d: round(656, 96, 248, 84, 22), fill: '#c9d2e6' },
    { d: round(650, 196, 260, 280, 18), fill: '#3d5f9a' },
    { d: [230, 290, 350, 410].map((y) => line([660, y], [900, y])).join(' ') + [720, 790, 860].map((x) => line([x, 206], [x, 466])).join(' '), fill: 'none', line: '#2f4d82', w: 4 },
    { d: round(650, 196, 260, 40, 14), fill: '#e3e8f2' },
    { d: circle(780, 140, 23), fill: '#efc8a5' },
    { d: circle(780, 127, 21), fill: YOU.hair },
    { d: circle(771, 148, 3.5) + circle(789, 148, 3.5), fill: INK },
    { d: line([712, 210], [700, 290]) + line([848, 210], [860, 290]), fill: 'none', line: '#9fb3d9', w: 16 },
    { d: round(950, 96, 110, 90, 8), fill: '#5a4636' },
    { d: round(966, 108, 78, 34, 6), fill: '#141414' },
    say('02:14', 1005, 134, 24, { anchor: 'middle', font: SERIF, fill: '#ff5a4a', weight: 700 }),
    { d: round(380, 560, 260, 120, 14), fill: '#4a3a5a' },
  ],
  moon: [{ d: poly([260, 80], [500, 80], [700, 700], [380, 760]), fill: '#c9d8ff', op: 0.12 }],
  zzz: [
    say('Z', 1400, 300, 40, { font: SERIF, fill: '#e8ecff', italic: true, cls: 'cb-float' }),
    say('z', 1430, 250, 32, { font: SERIF, fill: '#e8ecff', italic: true, cls: 'cb-float cb-late' }),
    say('z', 1450, 210, 26, { font: SERIF, fill: '#e8ecff', italic: true, cls: 'cb-float' }),
  ],
  fears: [
    ...thought(430, 190, 80, [740, 150], [{ t: at(430, 186, 0), items: [{ d: round(-40, -14, 80, 28, 10), fill: '#3b6db3' }, { d: round(-20, -26, 40, 18, 6), fill: '#2b5596' }, { d: circle(-24, 16, 9) + circle(24, 16, 9), fill: INK }] }]),
    ...thought(440, 400, 72, [700, 240], [{ d: rect(410, 390, 60, 20) + rect(430, 370, 20, 60), fill: RED }]),
    ...thought(1150, 180, 76, [820, 150], [{ d: line([1120, 160], [1180, 200]) + line([1120, 200], [1180, 160]) + line([1114, 180], [1186, 180]) + line([1130, 150], [1170, 210]), fill: 'none', line: INK, w: 5 }, { d: circle(1150, 180, 16), fill: INK }]),
    ...thought(1150, 400, 72, [860, 240], [{ d: round(1130, 370, 40, 64, 8), fill: INK }, { d: round(1136, 378, 28, 44, 4), fill: '#8ab4ff' }, { d: 'M 1180 386 q 12 16 0 32 M 1192 378 q 18 24 0 48', fill: 'none', line: INK, w: 4 }]),
    ...thought(1310, 110, 62, [880, 140], [{ d: circle(1310, 110, 26), fill: GOLD }, say('$', 1310, 122, 32, { anchor: 'middle', font: SERIF, fill: '#8a6420', weight: 700 })]),
  ],
};

//flat pages: the cover, a cabin in the snow from above, and the questions and Jun's postcard on a plaid blanket
const COVER: Record<string, Item[]> = {
  _cover: [
    { d: rect(0, 0, W, H), fill: '#eef2f6' },
    { d: starField(40, 1, 9, [20, 20, W - 20, H - 20]), fill: '#cfd9e4' },
    ...[[200, 180], [330, 520], [1300, 160], [1420, 480], [1180, 620], [420, 300]].flatMap(([x, y]): Shape[] => [
      { d: star(x, y, 70, 40, 8), fill: PINE_DARK },
      { d: star(x, y, 48, 28, 8, 0.4), fill: PINE },
    ]),
    say('The Cabin', 800, 196, 104, { anchor: 'middle', font: SERIF, fill: LOG, italic: true }),
  ],
  roof: [
    { d: poly([600, 300], [1000, 300], [1000, 600], [600, 600]), fill: '#7a2f2a' },
    { d: line([600, 450], [1000, 450]), fill: 'none', line: '#5a201c', w: 8 },
    { d: poly([600, 300], [1000, 300], [960, 340], [640, 340]) + poly([600, 600], [1000, 600], [960, 560], [640, 560]), fill: WHITE, op: 0.9 },
    { d: round(880, 360, 50, 50, 6), fill: STONE },
    { t: 'translate(0 0)', cls: 'cb-steam', items: [{ d: 'M 905 350 q -20 -30 0 -60 q 20 -30 0 -60', fill: 'none', line: '#cfd9e4', w: 10 }] },
  ],
};

const CARD: Record<string, Item[]> = {
  _blanket: [
    { d: rect(0, 0, W, H), fill: '#8c2f2f' },
    { d: Array.from({ length: 12 }, (_, i) => rect(i * 140 + 40, 0, 40, H)).join(' ') + Array.from({ length: 7 }, (_, i) => rect(0, i * 140 + 40, W, 40)).join(' '), fill: '#5a1d1d', op: 0.5 },
  ],
  notepad: [
    {
      t: at(800, 330, -3),
      items: [
        { d: poly([-300, -170], [260, -170], [320, -110], [320, 110], [260, 170], [-300, 170]), fill: PAPER },
        { d: circle(270, 0, 16), fill: '#8c2f2f' },
        say('A few questions', -10, -20, 76, { anchor: 'middle', font: SERIF, fill: INK, italic: true }),
        say('about you', -10, 70, 76, { anchor: 'middle', font: SERIF, fill: INK, italic: true }),
      ],
    },
  ],
  postcard: [
    {
      t: at(640, 330, -5),
      items: [
        { d: rect(-260, -170, 520, 340), fill: WHITE },
        { d: rect(-240, -150, 480, 300), fill: '#f2a65a' },
        { d: poly([-240, 150], [-240, 40], [-190, 40], [-190, -10], [-130, -10], [-130, 60], [-70, 60], [-70, -60], [-20, -60], [-20, 20], [40, 20], [40, -30], [110, -30], [110, 70], [170, 70], [170, 0], [240, 0], [240, 150]), fill: '#3a4d6b' },
        { d: circle(150, -90, 34), fill: '#ffe08a' },
      ],
    },
    { t: at(1090, 340, 7), items: [{ d: rect(-170, -110, 340, 220), fill: PAPER }, say('Just saying.', 0, -10, 44, { anchor: 'middle', font: HAND, fill: INK, weight: 700 }), say('-J', 90, 60, 40, { anchor: 'middle', font: HAND, fill: RED, weight: 700 })] },
  ],
};

const ART: Record<Room, Record<string, Item[]>> = { cover: COVER, lodge: LODGE, bunks: BUNKS, card: CARD };

//where the wall clock hangs, in the rooms that have one
const CLOCK_AT: Partial<Record<Room, Pt>> = { lodge: [580, 46] };

// ---------------------------------------------------------------------------
// the cues
// ---------------------------------------------------------------------------

type Bed = 'table' | 'tick' | 'room' | 'wind';
type Mix = Partial<Record<Bed, number>>;

interface Cue {
  room: Room;
  time?: number; //the wall clock, in hours, whenever the real clock isn't running
  parts: string[];
  mix: Mix;
}

const FRIENDS: Mix = { table: 0.6, wind: 0.2 };
const WAITING: Mix = { tick: 0.55, wind: 0.5, table: 0.1 };
const LATE: Mix = { wind: 0.4, room: 0.4 };
const NIGHT: Mix = { wind: 0.6 };
const QUIET: Mix = { room: 0.45 };

const SNACKS = ['chips', 'candy', 'cheese'];
const AT_TABLE = [...FOUR, 'cal_spot', ...SNACKS];
const DINNER = [...AT_TABLE, 'bowls'];
const WAIT = ['rosa', 'jun', 'maya', 'cal_spot', 'night', ...SNACKS];
const LATE_NIGHT = ['night', 'glow'];

const cues: Record<string, Cue> = {
  title_card: { room: 'cover', parts: ['roof'], mix: { wind: 0.5 } },
  cabin: { room: 'lodge', time: 17.5, parts: [...FOUR, ...SNACKS], mix: FRIENDS },
  cabin_friends: { room: 'lodge', time: 17.6, parts: AT_TABLE, mix: FRIENDS },
  snacks: { room: 'lodge', time: 18, parts: [...AT_TABLE, 'cards'], mix: FRIENDS },
  snacks_gone: { room: 'lodge', time: 18.5, parts: ['rosa', 'jun', 'maya', 'cal_spot', 'chips', 'candy_low', 'cheese', 'wrappers', 'you_counter', 'cards'], mix: FRIENDS },
  snacks_some: { room: 'lodge', time: 18.5, parts: [...AT_TABLE, 'cards'], mix: FRIENDS },
  dinner: { room: 'lodge', time: 19, parts: DINNER, mix: FRIENDS },
  jun_idea: { room: 'lodge', time: 19.3, parts: [...DINNER, 'jun_bubble'], mix: FRIENDS },
  looks: { room: 'lodge', time: 19.3, parts: [...DINNER, 'looks'], mix: QUIET },
  napkin: { room: 'lodge', time: 19.4, parts: [...DINNER, 'napkin'], mix: FRIENDS },
  clink: { room: 'lodge', time: 19.4, parts: [...DINNER, 'clink'], mix: FRIENDS },
  window: { room: 'lodge', time: 21, parts: [...WAIT, 'you'], mix: WAITING },
  voicemail: { room: 'lodge', time: 21, parts: [...WAIT, 'you_phone', 'voicemail'], mix: WAITING },
  crash: { room: 'lodge', parts: [...WAIT, 'you', 'crash'], mix: WAITING },
  hold: { room: 'lodge', parts: [...WAIT, 'you_phone', 'hold'], mix: WAITING },
  calm: { room: 'lodge', parts: [...WAIT, 'you', 'cards', 'calm'], mix: WAITING },
  text: { room: 'lodge', parts: [...WAIT, 'you_phone', 'text'], mix: WAITING },
  inside: { room: 'lodge', parts: [...WAIT, 'you', 'pulse'], mix: { tick: 0.7, wind: 0.4 } },
  rosa_cry: { room: 'lodge', time: 21.75, parts: ['jun', 'maya', 'cal_spot', 'night', 'rosa_window', 'you_near', 'tears'], mix: WAITING },
  cry: { room: 'lodge', time: 21.8, parts: ['jun', 'maya', 'cal_spot', 'night', 'rosa_held', 'you_hug', 'tears_both'], mix: WAITING },
  hand: { room: 'lodge', time: 21.8, parts: ['jun', 'maya', 'cal_spot', 'night', 'rosa_sit', 'you_beside', 'tissues'], mix: WAITING },
  awkward: { room: 'lodge', time: 21.8, parts: ['jun', 'cal_spot', 'night', 'rosa_held', 'maya_hug', 'you', 'sweat'], mix: WAITING },
  cocoa: { room: 'lodge', time: 21.8, parts: ['jun', 'maya', 'cal_spot', 'night', 'rosa_window', 'you_cocoa', 'steam'], mix: WAITING },
  headlights: { room: 'lodge', time: 22, parts: ['rosa', 'jun', 'maya', 'you', 'cal_spot', 'night', 'beams'], mix: WAITING },
  cal_in: { room: 'lodge', time: 22, parts: ['night', 'crowd', 'rosa_by', 'cal_in', 'sorry'], mix: LATE },
  hug: { room: 'lodge', time: 22, parts: ['night', 'crowd', 'cal_hug', 'rosa_hug', 'dropped', 'love'], mix: LATE },
  rosa_relief: { room: 'lodge', time: 22, parts: ['night', 'crowd', 'cal_hug', 'rosa_hug', 'dropped', 'relief_tears'], mix: LATE },
  fire: { room: 'lodge', time: 25, parts: [...LATE_NIGHT, 'circle'], mix: LATE },
  fire_question: { room: 'lodge', time: 25, parts: [...LATE_NIGHT, 'circle', 'maya_bubble'], mix: QUIET },
  fire_talk: { room: 'lodge', time: 25.2, parts: [...LATE_NIGHT, 'circle', 'talk'], mix: LATE },
  bunks: { room: 'bunks', parts: ['moon', 'zzz'], mix: NIGHT },
  fears: { room: 'bunks', parts: ['moon', 'zzz', 'fears'], mix: NIGHT },
  morning: { room: 'lodge', time: 9.5, parts: [...FOUR, 'cal', 'pancakes', 'cards', 'sun'], mix: { table: 0.6 } },
  questions: { room: 'card', parts: ['notepad'], mix: QUIET },
  goodbye: { room: 'card', parts: ['postcard'], mix: QUIET },
};

const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS: Record<Bed, string> = {
  table: new URL('./sounds/table.m4a', import.meta.url).href,
  tick: new URL('./sounds/tick.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  wind: new URL('./sounds/wind.m4a', import.meta.url).href,
};

const shot = (name: string, volume: number, delay: number): OneShot => ({ src: new URL(`./sounds/${name}.m4a`, import.meta.url).href, volume, delay });
const ONE_SHOTS: Record<string, OneShot> = {
  window: shot('chime', 0.6, 0.6),
  headlights: shot('car', 0.7, 1.2),
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.2; //seconds

// ---------------------------------------------------------------------------

const GAP = 0.25; //seconds between one part dropping in and the next

interface Shown {
  cue: Cue;
  visit: number; //counts rooms laid down, so going back to the same room lays it down again
  starts: Record<string, number>; //when each part drops in, from when it first appears
}

//parts already down in the same room stay put; anything new drops in after them, and a new room brings all its parts in
function turn(prev: Shown | undefined, cue: Cue): Shown {
  const kept = prev && prev.cue.room === cue.room ? prev : undefined;
  const fresh = cue.parts.filter((p) => !kept?.cue.parts.includes(p));
  const starts = Object.fromEntries(fresh.map((p, i) => [p, (kept ? 0.1 : 0.4) + i * GAP]));
  return kept ? { cue, visit: kept.visit, starts: { ...kept.starts, ...starts } } : { cue, visit: (prev?.visit ?? 0) + 1, starts };
}

function draw(item: Item, i: number): ReactNode {
  if ('items' in item)
    return (
      <g key={i} transform={item.t}>
        <g className={item.cls}>{item.items.map(draw)}</g>
      </g>
    );
  if ('text' in item)
    return (
      <text key={i} x={item.x} y={item.y} textAnchor={item.anchor} fill={item.fill ?? INK} opacity={item.op} className={item.cls} style={{ fontFamily: item.font ?? SERIF, fontSize: item.size, fontStyle: item.italic ? 'italic' : undefined, fontWeight: item.weight }}>
        {item.text}
      </text>
    );
  return <path key={i} d={item.d} fill={item.fill} stroke={item.line} strokeWidth={item.w} strokeLinecap="round" strokeLinejoin="round" opacity={item.op} className={item.cls} />;
}

//the wall clock, its hands turned by the hour. Angles keep counting past twelve so the hands always go forwards
function WallClock({ at: [x, y], time }: { at: Pt; time: number }) {
  const hand = (deg: number, len: number, w: number) => (
    <line x1={0} y1={0} x2={0} y2={-len} stroke={INK} strokeWidth={w} strokeLinecap="round" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `rotate(${deg}deg)`, transition: 'transform 1s linear' }} />
  );
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#cb-shadow)">
      <circle r={44} fill={GOLD} />
      <circle r={37} fill={PAPER} />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={Math.sin((i * Math.PI) / 6) * 30} cy={-Math.cos((i * Math.PI) / 6) * 30} r={i % 3 ? 2 : 3.5} fill={INK} />
      ))}
      {hand(time * 30, 18, 6)}
      {hand(time * 360, 28, 4)}
      <circle r={4} fill={RED} />
    </g>
  );
}

//whether anything in it animates for as long as it's on screen
const moves = (item: Item): boolean => !!item.cls || ('items' in item && item.items.some(moves));

//each part is a layer: the ones with something moving in them get svgs of their own, so the shadow filter under the
//rest of the room isn't redrawn every frame
function Scene({ shown, time }: { shown: Shown; time: number }) {
  const { cue, starts } = shown;
  const art = ART[cue.room];
  const clockAt = CLOCK_AT[cue.room];
  const layers: Layer[] = Object.entries(art)
    .filter(([part]) => part.startsWith('_') || cue.parts.includes(part))
    .map(([part, items]) => {
      const shadow = FLAT.has(part) ? undefined : 'url(#cb-shadow)';
      return {
        key: part,
        moving: items.some(moves) ? part : undefined,
        node: part.startsWith('_') ? (
          <g filter={shadow}>{items.map(draw)}</g>
        ) : (
          <g filter={shadow}>
            <g className="cb-pop" style={{ animationDelay: `${starts[part] ?? 0}s` }}>
              {items.map(draw)}
            </g>
          </g>
        ),
      };
    });
  //the hands move every second while the real clock runs
  if (clockAt) layers.push({ key: 'clock', moving: 'clock', node: <WallClock at={clockAt} time={time} /> });
  return <Layers viewBox={VIEW} layers={layers} className="cb-in" />;
}

function PaperCabin({ animation, clock }: { animation: string; clock?: number }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [shown, setShown] = useState<Shown>(() => turn(undefined, cues[first]));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setShown((v) => turn(v, cues[animation]));
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Cabin has no cue for the animation "${animation}"`);
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
    sound.current?.mix(cues[active].mix);
    const oneShot = ONE_SHOTS[active];
    if (oneShot) sound.current?.play(oneShot);
  }, [active]);

  //while the real clock runs, the wall clock's hands go round from nine to ten
  const time = clock === undefined ? (shown.cue.time ?? 21) : 22 - clock;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={VIEW} aria-hidden>
        <defs>
          <filter id="cb-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="3" dy="6" stdDeviation="3" floodColor="#1a1014" floodOpacity="0.35" />
          </filter>
        </defs>
      </svg>
      <Scene key={`${shown.cue.room}-${shown.visit}`} shown={shown} time={time} />
    </div>
  );
}

//a new room is laid down like a sheet of paper, and new parts drop onto it
const keyframes = `
.cb-in {
  animation: cb-in 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes cb-in {
  from { transform: translateY(-30px); opacity: 0; }
}
.cb-pop {
  transform-box: fill-box;
  transform-origin: center;
  animation: cb-pop 0.4s cubic-bezier(0.3, 1.4, 0.5, 1) both;
}
@keyframes cb-pop {
  from { transform: translateY(-16px) scale(1.08); opacity: 0; }
}
.cb-flicker {
  transform-box: fill-box;
  transform-origin: center;
  animation: cb-flicker 0.35s ease-in-out infinite alternate;
}
@keyframes cb-flicker {
  to { transform: scale(0.88) rotate(8deg); opacity: 0.8; }
}
.cb-drip {
  animation: cb-drip 1.4s ease-in infinite;
}
@keyframes cb-drip {
  from { transform: translateY(-6px); opacity: 0; }
  30% { opacity: 1; }
  to { transform: translateY(18px); opacity: 0; }
}
.cb-late {
  animation-delay: 0.6s;
}
.cb-bob {
  animation: cb-bob 1.2s ease-in-out infinite alternate;
}
@keyframes cb-bob {
  to { transform: translateY(-6px); }
}
.cb-twinkle {
  transform-box: fill-box;
  transform-origin: center;
  animation: cb-twinkle 0.9s ease-in-out infinite alternate;
}
@keyframes cb-twinkle {
  from { transform: scale(0.6) rotate(0deg); }
  to { transform: scale(1.1) rotate(20deg); }
}
.cb-march {
  stroke-dasharray: 12 12;
  animation: cb-march 1s linear infinite;
}
@keyframes cb-march {
  to { stroke-dashoffset: -48; }
}
.cb-blink {
  animation: cb-blink 0.7s steps(1) infinite;
}
@keyframes cb-blink {
  50% { opacity: 0.15; }
}
.cb-pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: cb-pulse 1.2s ease-out infinite;
}
@keyframes cb-pulse {
  from { transform: scale(0.6); opacity: 1; }
  to { transform: scale(1.5); opacity: 0; }
}
.cb-sweep {
  transform-box: view-box;
  transform-origin: 350px 80px;
  animation: cb-sweep 2.4s ease-in-out infinite alternate;
}
@keyframes cb-sweep {
  from { transform: rotate(-28deg); }
  to { transform: rotate(18deg); }
}
.cb-steam {
  animation: cb-steam 1.6s ease-in-out infinite;
}
@keyframes cb-steam {
  from { transform: translateY(8px); opacity: 0; }
  40% { opacity: 0.85; }
  to { transform: translateY(-14px); opacity: 0; }
}
.cb-snow {
  animation: cb-snow 2.2s linear infinite;
}
@keyframes cb-snow {
  from { transform: translateY(-4px); }
  to { transform: translateY(4px); }
}
.cb-float {
  animation: cb-float 2.6s ease-in-out infinite;
}
@keyframes cb-float {
  from { transform: translate(0, 10px); opacity: 0; }
  40% { opacity: 1; }
  to { transform: translate(14px, -24px); opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: FLOOR,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
};

export default PaperCabin;
