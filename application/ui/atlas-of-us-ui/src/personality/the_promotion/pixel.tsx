import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Layers, Sheet, type Layer } from '../layers';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Promotion is played as an old 16-bit office game: chunky pixel rooms seen side-on, like a point-and-click
// adventure, under a bar giving the day, the time and the place. Everyone is built from the same blocky body in their
// own colours, and you're the one in the orange jumper. Game touches carry the story: a NEW QUEST banner when the job
// goes up, name tags and a VS for the rivalry, pixel speech bubbles, ! marks when everyone turns to look at you, and
// confetti when Priya gets it. A cue names a room, the day and time, and the parts to show: a new room steps up from
// black, and new parts in the same room blink in after it. Everything is SVG in a fixed 1600x900 space, drawn on an
// 8px grid and scaled to cover the screen, and the people keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
const VIEW = `0 0 ${W} ${H}`;
const C = 8; //screen pixels to an art pixel
type Dir = 1 | -1;

//the Sweetie 16 palette
const INK = '#1a1c2c';
const PLUM = '#5d275d';
const RED = '#b13e53';
const ORANGE = '#ef7d57';
const YELLOW = '#ffcd75';
const LIME = '#a7f070';
const GREEN = '#38b764';
const TEAL = '#257179';
const NAVY = '#29366f';
const BLUE = '#3b5dc9';
const SKY = '#41a6f6';
const CYAN = '#73eff7';
const WHITE = '#f4f4f4';
const SILVER = '#94b0c2';
const SLATE = '#566c86';
const DUSK = '#333c57';
//and the few it's missing
const WOOD = '#a0663c';
const WOOD_D = '#6e4228';
const CREAM = '#efe4c8';
const CORK = '#c8935a';
const SKIN_1 = '#f3c6a0';
const SKIN_2 = '#c98b60';
const SKIN_3 = '#8e5a3c';
const GINGER = '#c45a2c';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//everything is blocks: x, y, w, h in screen pixels, a colour, and a class for anything that moves
type Item = { r: [number, number, number, number]; c: string; cls?: string; op?: number };
type Rect = [number, number, number, number, string, string?];

//a block in art pixels, or in screen pixels for anything finer, like lettering
const px = (x: number, y: number, w: number, h: number, c: string, cls?: string, op?: number): Item => ({ r: [x * C, y * C, w * C, h * C], c, cls, op });
const fine = (x: number, y: number, w: number, h: number, c: string, cls?: string): Item => ({ r: [x, y, w, h], c, cls });

//blocks drawn facing right from x, gy in art pixels; facing left mirrors them about x
const piece = (x: number, gy: number, dir: Dir, rects: Rect[]): Item[] =>
  rects.map(([dx, dy, w, h, c, cls]) => px(x + (dir === 1 ? dx : -dx - w), gy + dy, w, h, c, cls));

//a colour mixed towards white (k > 0) or black (k < 0)
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

//pseudo-random but fixed, so the rooftops and the confetti fall the same way every time
const rand = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

//a little picture from rows of letters, each letter a colour from pal and anything else see-through, s screen pixels
//to one of its pixels. Its pixels never overlap, so they're sorted by colour into as few shapes as possible
function sprite(x: number, y: number, rows: string[], pal: Record<string, string>, s = C, cls?: string, flip = false): Item[] {
  const out: Item[] = [];
  rows.forEach((row, j) => {
    const line = flip ? [...row].reverse().join('') : row;
    for (let i = 0; i < line.length; ) {
      let k = i;
      while (k < line.length && line[k] === line[i]) k++;
      if (pal[line[i]]) out.push(fine(x + i * s, y + j * s, (k - i) * s, s, pal[line[i]], cls));
      i = k;
    }
  });
  return out.sort((a, b) => (a.c < b.c ? -1 : a.c > b.c ? 1 : 0));
}

//a 3x5 pixel font, each glyph its five rows run together
const FONT: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000',
  '!': '010010010000010', '?': '110001010000010', "'": '010010000000000', '-': '000000111000000', '"': '101101000000000',
  '/': '001001010100100', '>': '100010001010100', _: '000000000000111', '·': '000000010000000',
};

//lettering, s screen pixels to a font pixel, lines split on \n
function words(text: string, x: number, y: number, s: number, c: string, cls?: string): Item[] {
  return text.split('\n').flatMap((line, j) =>
    [...line.toUpperCase()].flatMap((ch, i) => {
      const g = FONT[ch] ?? FONT[' '];
      return sprite(x + i * 4 * s, y + j * 7 * s, [0, 3, 6, 9, 12].map((n) => g.slice(n, n + 3)), { 1: c }, s, cls);
    }),
  );
}
const wide = (text: string, s: number) => (Math.max(...text.split('\n').map((l) => l.length)) * 4 - 1) * s;
const centred = (text: string, cx: number, y: number, s: number, c: string, cls?: string) =>
  text.split('\n').flatMap((line, j) => words(line, cx - wide(line, s) / 2, y + j * 7 * s, s, c, cls));

//a speech bubble with its top left at x, y in screen pixels, and its tail on the left or right of its bottom edge
function bubble(x: number, y: number, text: string, tail: 'l' | 'r' = 'l', s = 4): Item[] {
  const p = 3 * s;
  const w = wide(text, s) + 2 * p;
  const h = text.split('\n').length * 7 * s - 2 * s + 2 * p;
  const tx = tail === 'l' ? x + 3 * s : x + w - 7 * s;
  return [
    fine(x + s, y, w - 2 * s, h, INK, 'pp-bob'),
    fine(x, y + s, w, h - 2 * s, INK, 'pp-bob'),
    fine(x + s, y + s, w - 2 * s, h - 2 * s, WHITE, 'pp-bob'),
    ...sprite(tx, y + h - s, ['kwwk', 'kwk.', 'kk..', 'k...'], { k: INK, w: WHITE }, s, 'pp-bob', tail === 'r'),
    ...words(text, x + p, y + p, s, INK, 'pp-bob'),
  ];
}

//a name tag, centred on cx
function tag(cx: number, y: number, text: string, c: string, ink = WHITE, cls?: string): Item[] {
  const w = wide(text, 3) + 16;
  return [fine(cx - w / 2 - 4, y - 4, w + 8, 35, INK, cls), fine(cx - w / 2, y, w, 27, c, cls), ...words(text, cx - w / 2 + 8, y + 6, 3, ink, cls)];
}

//a dashed outline, in screen pixels
function dashes(x0: number, y0: number, x1: number, y1: number, c: string, cls?: string): Item[] {
  const out: Item[] = [];
  for (let x = x0; x < x1; x += 24) out.push(fine(x, y0, Math.min(16, x1 - x), 4, c, cls), fine(x, y1 - 4, Math.min(16, x1 - x), 4, c, cls));
  for (let y = y0; y < y1; y += 24) out.push(fine(x0, y, 4, Math.min(16, y1 - y), c, cls), fine(x1 - 4, y, 4, Math.min(16, y1 - y), c, cls));
  return out;
}

//marks, at x, y in art pixels
const bang = (x: number, y: number) => sprite(x * C, y * C, ['.kk.', 'kyyk', 'kyyk', 'kyyk', 'kyyk', '.kk.', 'kyyk', '.kk.'], { k: INK, y: YELLOW }, 4, 'pp-bob');
const sweat = (x: number, y: number) => sprite(x * C, y * C, ['..k..', '.kck.', 'kccck', 'kccck', '.kkk.'], { k: INK, c: CYAN }, 4, 'pp-bob');
const sparkle = (x: number, y: number) => sprite(x * C, y * C, ['..y..', '..y..', 'yy.yy', '..y..', '..y..'], { y: YELLOW }, 4, 'pp-twinkle');
const tick = (x: number, y: number) => sprite(x * C, y * C, ['.....g', '....gg', 'g..gg.', 'gggg..', '.gg...'], { g: GREEN }, 4, 'pp-bob');

// ---------------------------------------------------------------------------
// people: one blocky body, 27 art pixels tall standing, with its feet at gy
// ---------------------------------------------------------------------------

interface Look {
  skin: string;
  hair: string;
  top: string;
  legs: string;
  style: 'short' | 'long' | 'bun' | 'bald';
  glasses?: boolean;
}

const YOU: Look = { skin: SKIN_1, hair: WOOD_D, top: ORANGE, legs: NAVY, style: 'short' };
const PRIYA: Look = { skin: SKIN_2, hair: INK, top: TEAL, legs: DUSK, style: 'long' };
const PRIYA_COAT: Look = { ...PRIYA, top: RED };
const JOAN: Look = { skin: SKIN_1, hair: SILVER, top: PLUM, legs: INK, style: 'bun', glasses: true };
const TOM: Look = { skin: SKIN_3, hair: INK, top: GREEN, legs: NAVY, style: 'short' };
const DAVE: Look = { skin: SKIN_1, hair: GINGER, top: SKY, legs: DUSK, style: 'bald', glasses: true };
const BEV: Look = { skin: SKIN_1, hair: YELLOW, top: BLUE, legs: INK, style: 'long' };
const SAM: Look = { skin: SKIN_2, hair: DUSK, top: YELLOW, legs: SLATE, style: 'short' };
const RIDER: Look = { skin: SKIN_3, hair: SILVER, top: SLATE, legs: INK, style: 'bald' };

type Pose = 'stand' | 'walk' | 'point' | 'wave' | 'clap' | 'hold' | 'sit' | 'type' | 'sit_hold' | 'sit_wave' | 'sit_phone';
type Face = 'smile' | 'sad' | 'blush';

//a seated body sits on a seat 3 above gy, so it needs a chair, sofa or bus seat drawn under it. A slumped one drops
//its head onto its shoulders
function figure(x: number, gy: number, who: Look, pose: Pose, dir: Dir = 1, face?: Face, slump = false): Item[] {
  const seated = pose === 'type' || pose.startsWith('sit');
  const t = seated ? -21 : -26; //the top of the head, sitting up straight
  const ht = t + (slump ? 2 : 0);
  const hx = slump ? 1 : 0;
  const { skin, hair, legs } = who;
  const sleeve = shade(who.top, -0.2);
  const r: Rect[] = [];

  if (seated) r.push([-2, -5, 8, 2, legs], [3, -3, 3, 2, legs], [3, -1, 4, 1, INK]);
  else {
    const step = pose === 'walk' ? 1 : 0;
    r.push([-3 - step, t + 16, 3, -17 - t, shade(legs, -0.25)], [step, t + 16, 3, -17 - t, legs], [-3 - 2 * step, -1, 3, 1, INK], [step, -1, 4, 1, INK]);
  }
  r.push([-4, t + 7, 8, 9, who.top], [-4, t + 7, 1, 9, sleeve]);
  if (who.style === 'long') r.push([-4 + hx, ht + 1, 2, 10, hair]);

  switch (pose) {
    case 'point':
      r.push([0, t + 8, 2, 2, sleeve], [2, t + 8, 5, 2, sleeve], [7, t + 8, 2, 2, skin]);
      break;
    case 'wave':
    case 'sit_wave':
      r.push([2, t + 7, 2, 2, sleeve], [4, t + 1, 2, 7, sleeve], [4, t - 1, 2, 2, skin]);
      break;
    case 'clap':
      r.push([-1, t + 8, 2, 3, sleeve], [0, t + 10, 4, 2, sleeve], [4, t + 9, 2, 3, skin, 'pp-clap']);
      break;
    case 'hold':
      r.push([-1, t + 8, 2, 4, sleeve], [0, t + 11, 5, 2, sleeve], [5, t + 11, 2, 2, skin]);
      break;
    case 'type':
      r.push([-1, t + 8, 2, 3, sleeve], [0, t + 10, 7, 2, sleeve], [7, t + 10, 2, 2, skin, 'pp-type']);
      break;
    case 'sit':
      r.push([-1, t + 8, 2, 5, sleeve], [0, t + 12, 4, 2, sleeve], [4, t + 12, 2, 2, skin]);
      break;
    case 'sit_hold':
      r.push([-1, t + 8, 2, 3, sleeve], [0, t + 10, 5, 2, sleeve], [5, t + 9, 2, 2, skin]);
      break;
    case 'sit_phone':
      r.push([-1, t + 8, 2, 3, sleeve], [0, t + 10, 5, 2, sleeve], [5, t + 9, 2, 2, skin], [6, t + 6, 1, 4, INK], [5, t + 6, 1, 3, CYAN, 'pp-glow']);
      break;
    default:
      r.push([-1, t + 8, 2, 6, sleeve], [-1, t + 14, 2, 1, skin]);
  }

  r.push([-3 + hx, ht, 7, 7, skin]);
  if (who.style === 'bald') r.push([-3 + hx, ht + 2, 1, 3, hair]);
  else r.push([-3 + hx, ht - 1, 7, 2, hair], [-3 + hx, ht + 1, 2, 2, hair]);
  if (who.style === 'long') r.push([-4 + hx, ht, 2, 4, hair]);
  if (who.style === 'bun') r.push([-5 + hx, ht - 1, 2, 3, hair]);
  r.push([1 + hx, ht + (face === 'sad' ? 4 : 3), 1, 1, INK]);
  if (who.glasses) r.push([hx, ht + 3, 3, 1, INK], [-1 + hx, ht + 3, 1, 1, INK]);
  if (face === 'smile') r.push([1 + hx, ht + 5, 2, 1, RED]);
  if (face === 'blush') r.push([2 + hx, ht + 4, 2, 1, ORANGE]);
  return piece(x, gy, dir, r);
}

// ---------------------------------------------------------------------------
// furniture
// ---------------------------------------------------------------------------

//a desk or table with its top 9 above gy, and an office chair for someone sitting at x
const desk = (x0: number, x1: number, gy: number): Item[] => [px(x0, gy - 9, x1 - x0, 1, WOOD), px(x0, gy - 8, x1 - x0, 1, WOOD_D), px(x0 + 1, gy - 7, 1, 7, DUSK), px(x1 - 2, gy - 7, 1, 7, DUSK)];
const chair = (x: number, gy: number, dir: Dir, c = DUSK): Item[] => piece(x, gy, dir, [[-6, -14, 2, 11, c], [-5, -3, 8, 1, c], [-2, -2, 2, 1, INK], [-5, -1, 8, 1, INK]]);
//a monitor on a desk, its screen on the side it faces
const monitor = (x: number, gy: number, dir: Dir): Item[] => piece(x, gy, dir, [[-1, -10, 4, 1, DUSK], [0, -12, 2, 2, DUSK], [-1, -18, 4, 6, DUSK], [2, -17, 1, 4, CYAN, 'pp-glow']]);
const keyboard = (x: number, gy: number) => px(x, gy - 10, 4, 1, SILVER);

//a window with rooftops along the bottom, lit up at night
function pane(x: number, y: number, w: number, h: number, night = false): Item[] {
  const out: Item[] = [px(x - 1, y - 1, w + 2, h + 2, WHITE), px(x, y, w, h, night ? NAVY : SKY)];
  if (night) out.push(...sprite((x + w - 9) * C, (y + 2) * C, ['.yy', 'yy.', 'yy.', '.yy'], { y: YELLOW }));
  else out.push(px(x + 3, y + 4, 7, 1, WHITE), px(x + 5, y + 3, 3, 1, WHITE), px(x + w - 12, y + 7, 8, 1, WHITE), px(x + w - 10, y + 6, 3, 1, WHITE));
  for (let bx = x; bx < x + w; ) {
    const bw = Math.min(3 + Math.floor(rand(bx) * 5), x + w - bx);
    const bh = 4 + Math.floor(rand(bx + 99) * (h / 2));
    out.push(px(bx, y + h - bh, bw, bh, night ? DUSK : SILVER));
    for (let wy = y + h - bh + 1; wy < y + h - 1; wy += 2)
      for (let wx = bx + 1; wx < bx + bw - 1; wx += 2) if (rand(wx * 7 + wy) > (night ? 0.55 : 0.7)) out.push(px(wx, wy, 1, 1, night ? YELLOW : SLATE));
    bx += bw;
  }
  out.push(px(x + Math.floor(w / 2), y, 1, h, WHITE), px(x - 2, y + h + 1, w + 4, 1, SILVER));
  return out;
}

const ceiling = (c = DUSK, light = YELLOW): Item[] => [px(0, 7, 200, 3, c), ...[20, 60, 100, 140, 180].map((x) => px(x - 6, 9, 12, 1, light))];

const PLANT = ['..g.g..', '.gglgg.', 'gglggl.', '.glggg.', 'ggglgg.', '.ggggg.', '...g...', '.ooooo.', '.ooooo.', '..ooo..', '..ooo..'];
const plant = (x: number, y: number) => sprite(x * C, y * C, PLANT, { g: GREEN, l: LIME, o: ORANGE });
const ROBIN = ['....bbbb....', '...bbbbbb...', '..bbbkbbbo..', '..bbrrrbb...', '.bbrrrrrbb..', '.bbrrrrrbbb.', 'bbbbrrrbbbbb', '.bbbbbbbbb..', '.....l.l....', '....ll.ll...'];
const robin = (x: number, y: number, s: number) => sprite(x, y, ROBIN, { b: '#8a5a3c', r: ORANGE, k: INK, o: YELLOW, l: INK }, s);
const CAKE_PAL = { f: ORANGE, r: SKY, w: WHITE, s: YELLOW, j: RED };
const CAT_PAL = { o: ORANGE, d: GINGER, k: INK };

// ---------------------------------------------------------------------------
// the rooms and what's in them, each in painter's order. Parts starting with _ are always shown
// ---------------------------------------------------------------------------

type Room = 'cover' | 'studio' | 'kitchen' | 'office' | 'screen' | 'home' | 'bus' | 'back' | 'card';

const PLACE: Record<Room, string> = { cover: '', studio: 'THE STUDIO', kitchen: 'THE KITCHEN', office: "JOAN'S OFFICE", screen: 'YOUR DESK', home: 'HOME', bus: 'THE BUS HOME', back: '', card: '' };
const WALL_CLOCK: Partial<Record<Room, [number, number]>> = { studio: [96, 21], home: [96, 21] };

//the studio: open plan, your desk and Priya's pushed together in the middle, Tom's at the back, the loo on the right
const GY = 70; //the main desks
const TOM_GY = 62; //Tom's, at the back
const FRONT = 73; //people standing in front of the desks
const REAR = 64; //and behind them
const CONFETTI = Array.from({ length: 28 }, (_, i) =>
  px(104 + Math.floor(rand(i) * 64), 28 + Math.floor(rand(i + 50) * 18), 1, 1, [RED, YELLOW, LIME, SKY, ORANGE, CYAN, PLUM][i % 7], `pp-fall${(i % 3) + 1}`),
);

const STUDIO: Record<string, Item[]> = {
  _room: [
    ...ceiling(),
    px(0, 10, 200, 44, CREAM),
    px(0, 54, 200, 2, WOOD_D),
    px(0, 56, 200, 57, SLATE),
    ...[59, 63, 68, 74].map((y) => px(0, y, 200, 1, shade(SLATE, -0.12))),
    ...pane(12, 14, 34, 24),
    ...pane(152, 14, 26, 24),
    ...centred('PEMBERTON CARDS', 70 * C, 96, 3, WOOD_D),
    px(54, 15, 32, 19, WOOD_D),
    px(55, 16, 30, 17, CORK),
    ...[RED, YELLOW, SKY, GREEN, ORANGE, PLUM, CYAN, LIME].flatMap((c, i) => {
      const x = 56 + (i % 4) * 7;
      const y = 17 + Math.floor(i / 4) * 8;
      return [px(x, y, 5, 6, c), px(x + 2, y + 2, 1, 2, WHITE), px(x + 2, y - 1, 1, 1, RED)];
    }),
    px(106, 15, 36, 22, SILVER),
    px(107, 16, 34, 20, WHITE),
    px(105, 37, 38, 1, SILVER),
    px(110, 19, 14, 1, BLUE),
    px(110, 22, 20, 1, BLUE),
    px(110, 25, 10, 1, RED),
    px(130, 28, 2, 5, GREEN),
    px(133, 26, 2, 7, GREEN),
    px(136, 24, 2, 9, GREEN),
    ...plant(0, 45),
    px(168, 40, 6, 5, CYAN),
    px(167, 45, 8, 11, WHITE),
    px(169, 47, 1, 1, RED),
    px(183, 21, 15, 35, WOOD_D),
    px(184, 22, 13, 34, WOOD),
    px(187, 25, 7, 4, WHITE),
    ...words('WC', 188 * C + 1, 26 * C - 2, 3, INK),
    px(185, 38, 2, 1, YELLOW),
    px(193, 36, 2, 1, GREEN),
  ],
  board_easter: [
    px(107, 16, 34, 20, WHITE),
    ...words('EASTER', 110 * C, 18 * C, 4, BLUE),
    ...[PLUM, SKY, LIME, ORANGE].flatMap((c, i) => sprite((111 + i * 7) * C, 28 * C, ['.cc.', 'cccc', 'cyyc', 'cccc', '.cc.'], { c, y: YELLOW })),
  ],
  door_engaged: [px(193, 36, 2, 1, RED, 'pp-blink'), ...tag(190 * C, 16 * C, 'ENGAGED', RED)],
  margaret_cake: figure(100, REAR, JOAN, 'stand', -1, 'smile'),
  margaret_wave: figure(100, REAR, JOAN, 'wave', 1, 'smile'),
  priya_point: figure(150, REAR, PRIYA, 'point', -1, 'smile'),
  you_leave: figure(176, REAR, YOU, 'walk', 1, 'sad', true),
  _desks: [
    ...desk(22, 46, TOM_GY),
    ...monitor(36, TOM_GY, -1),
    keyboard(23, TOM_GY),
    ...chair(16, TOM_GY, 1),
    ...desk(78, 122, GY),
    ...monitor(86, GY, -1),
    ...monitor(113, GY, 1),
    keyboard(79, GY),
    keyboard(117, GY),
    px(92, GY - 10, 5, 1, WHITE),
    px(93, GY - 10, 2, 1, ORANGE),
    px(108, GY - 11, 2, 2, YELLOW),
    ...chair(72, GY, 1),
    ...chair(128, GY, -1),
  ],
  you_type: figure(72, GY, YOU, 'type', 1),
  you_sit: figure(72, GY, YOU, 'sit', 1),
  you_slump: figure(72, GY, YOU, 'sit', 1, 'smile', true),
  priya_type: figure(128, GY, PRIYA, 'type', -1),
  tom_type: figure(16, TOM_GY, TOM, 'type', 1),
  tom_sit: figure(16, TOM_GY, TOM, 'sit', 1),
  cake: [px(95, GY - 10, 12, 1, WHITE), ...sprite(96 * C, (GY - 16) * C, ['..f....f..', '..r....r..', 'wwwwwwwwww', 'ssssssssss', 'jjjjjjjjjj', 'ssssssssss'], CAKE_PAL)],
  cake_eaten: [px(95, GY - 10, 12, 1, WHITE), ...sprite(96 * C, (GY - 14) * C, ['wwww', 'ssss', 'jjjj', 'ssss'], CAKE_PAL), px(102, GY - 11, 1, 1, YELLOW), px(104, GY - 11, 1, 1, YELLOW)],
  crowd_stand: [...figure(44, FRONT, SAM, 'stand', 1), ...figure(140, FRONT, TOM, 'stand', -1), ...figure(158, FRONT, BEV, 'stand', -1)],
  crowd_clap: [...figure(44, FRONT, SAM, 'clap', 1, 'smile'), ...figure(140, FRONT, TOM, 'clap', -1, 'smile'), ...figure(158, FRONT, BEV, 'clap', -1, 'smile')],
  priya_stand: figure(120, FRONT, PRIYA, 'stand', -1),
  priya_promo: figure(120, FRONT, PRIYA, 'stand', -1, 'smile'),
  priya_coat: figure(56, FRONT, PRIYA_COAT, 'wave', 1, 'smile'),
  you_stand: figure(62, FRONT, YOU, 'stand', 1),
  you_clap: figure(62, FRONT, YOU, 'clap', 1),
  you_slice: [...figure(62, FRONT, YOU, 'hold', 1, 'smile'), ...sprite(68 * C, (FRONT - 18) * C, ['www', 'sss', 'jjj', 'sss'], CAKE_PAL)],
  tags: [...tag(72.5 * C, 41 * C, 'YOU', ORANGE, INK), ...tag(128.5 * C, 41 * C, 'PRIYA', TEAL)],
  vs: [...centred('VS', 806, 334, 8, INK), ...centred('VS', 800, 328, 8, RED)],
  promo_tag: tag(120.5 * C, 39 * C, 'PROMOTED!', YELLOW, INK, 'pp-bob'),
  confetti: CONFETTI,
  looks: [...bang(43, 42), ...bang(99, 33), ...bang(119, 42), ...bang(139, 42), ...bang(157, 42)],
  sweat: sweat(66, 47),
  sweat_sit: sweat(77, 50),
  haha: bubble(1032, 296, 'HA HA!', 'r'),
  coat_bubble: bubble(400, 290, "BEFORE SIX?\nYOU'RE A STAR!"),
  easter_bubble: bubble(1004, 216, 'LEAD THE\nEASTER RANGE?', 'r'),
  night: [px(0, 7, 200, 106, INK, undefined, 0.62)],
  glow: [px(76, 51, 7, 8, CYAN, undefined, 0.12), px(83, 53, 1, 4, CYAN, 'pp-glow')],
  queue: bubble(560, 336, '1 FILE\nWAITING', 'r'),
};

//the kitchen: cupboards, the kettle and the fridge, and the noticeboard
const KG = 68;
const KITCHEN: Record<string, Item[]> = {
  _room: [
    ...ceiling(),
    px(0, 10, 200, 22, '#d6e9e2'),
    px(0, 32, 200, 22, WHITE),
    ...[35, 39, 43, 47, 51].map((y) => px(0, y, 200, 1, SILVER)),
    ...Array.from({ length: 50 }, (_, i) => px(i * 4 + (Math.floor(i / 25) % 2) * 2, 32, 1, 22, SILVER, undefined, 0.5)),
    px(0, 54, 200, 2, SLATE),
    ...Array.from({ length: 50 * 15 }, (_, i) => [i % 50, Math.floor(i / 50)])
      .filter(([cx, cy]) => (cx + cy) % 2 === 0)
      .map(([cx, cy]) => px(cx * 4, 56 + cy * 4, 4, 4, '#dfe6ea')),
    px(8, 13, 64, 13, WOOD),
    ...[24, 40, 56].map((x) => px(x, 13, 1, 13, WOOD_D)),
    ...[22, 26, 38, 42, 54, 58].map((x) => px(x, 22, 1, 1, YELLOW)),
    px(6, 41, 70, 2, SILVER),
    px(8, 43, 66, 13, WOOD),
    ...[24, 40, 56].map((x) => px(x, 43, 1, 13, WOOD_D)),
    ...[22, 26, 38, 42, 54, 58].map((x) => px(x, 46, 1, 1, YELLOW)),
    px(46, 41, 12, 1, SLATE),
    px(51, 37, 1, 4, SILVER),
    px(51, 37, 3, 1, SILVER),
    ...sprite(14 * C, 35 * C, ['..kk..', '.kssk.', 'ksssskk', 'kssssk', 'kssssk', 'kkkkkk'], { k: DUSK, s: SILVER }),
    px(28, 39, 2, 2, RED),
    px(31, 39, 2, 2, YELLOW),
    px(34, 39, 2, 2, SKY),
    px(81, 19, 20, 37, SILVER),
    px(82, 20, 18, 35, WHITE),
    px(82, 32, 18, 1, SILVER),
    px(97, 24, 1, 5, DUSK),
    px(97, 35, 1, 7, DUSK),
    px(85, 26, 2, 2, RED),
    px(89, 40, 2, 2, LIME),
    px(85, 36, 5, 4, YELLOW),
    px(112, 14, 68, 29, WOOD_D),
    px(113, 15, 66, 27, CORK),
    px(116, 17, 8, 8, YELLOW),
    px(117, 19, 6, 1, SLATE),
    px(117, 21, 4, 1, SLATE),
    px(169, 18, 7, 9, SKY),
    px(167, 31, 9, 7, WHITE),
    px(116, 30, 9, 8, LIME),
    px(119, 16, 1, 1, RED),
    px(172, 17, 1, 1, RED),
  ],
  margaret_pin: figure(124, REAR, JOAN, 'wave', 1),
  notice_paper: [
    px(128, 17, 36, 23, WHITE),
    px(145, 16, 2, 2, RED),
    ...centred('SENIOR\nDESIGNER\nWANTED', 146 * C, 20 * C, 4, INK),
    ...centred('INTERVIEWS NEXT WEEK', 146 * C, 36 * C, 3, RED),
  ],
  you_mug: [...figure(36, KG, YOU, 'hold', 1), px(43, KG - 16, 2, 2, ORANGE)],
  tom_mug: [...figure(58, KG, TOM, 'hold', -1), px(49, KG - 16, 2, 2, GREEN)],
  quest: [fine(556, 76, 488, 72, YELLOW), fine(560, 80, 480, 64, INK), ...centred('NEW QUEST!', 800, 88, 4, YELLOW), ...centred('SENIOR DESIGNER', 800, 116, 4, WHITE)],
  ask_bubble: bubble(240, 250, 'BACK ME UP?'),
  sure_bubble: bubble(452, 286, '...SURE.'),
};

//Joan's office: the studio through a glass wall, her desk, and a window over the town
const OG = 70;
const OFFICE: Record<string, Item[]> = {
  _room: [
    ...ceiling(),
    px(36, 10, 164, 44, '#c9dcc0'),
    px(36, 54, 164, 2, WOOD_D),
    px(0, 56, 200, 57, WOOD),
    ...[59, 63, 68, 74].map((y) => px(0, y, 200, 1, WOOD_D)),
    ...[30, 80, 130, 170].map((x, i) => px(x + (i % 2) * 9, 56 + (i % 3) * 4, 1, 3, WOOD_D)),
    px(0, 10, 36, 46, '#dce9e6'),
    px(0, 46, 36, 10, '#c1d3d8'),
    ...pane(140, 14, 44, 24),
    ...[52, 70, 88].flatMap((x, i) => [px(x, 16, 12, 12, WOOD_D), px(x + 1, 17, 10, 10, WHITE), px(x + 4, 20, 4, 4, [RED, SKY, YELLOW][i])]),
    ...plant(189, 45),
  ],
  tom_glass: [...desk(20, 34, 56), ...monitor(30, 56, -1), ...chair(14, 56, 1), ...figure(14, 56, TOM, 'type', 1)],
  tom_blush: [...desk(20, 34, 56), ...monitor(30, 56, -1), ...chair(14, 56, 1), ...figure(14, 56, TOM, 'sit', 1, 'blush'), ...bang(13, 29)],
  _glass: [
    px(0, 10, 36, 46, '#bfe6ee', undefined, 0.4),
    px(4, 14, 1, 6, WHITE),
    px(6, 13, 1, 3, WHITE),
    px(28, 40, 1, 6, WHITE),
    px(0, 10, 37, 1, SILVER),
    px(0, 55, 37, 1, SILVER),
    ...[12, 24, 36].map((x) => px(x, 10, 1, 46, SILVER)),
    px(33, 32, 1, 4, DUSK),
  ],
  dave: [...chair(164, REAR, -1), ...figure(164, REAR, DAVE, 'sit_hold', -1), px(154, 49, 4, 5, WOOD), px(155, 50, 2, 3, WHITE)],
  _desk: [
    ...desk(78, 124, OG),
    ...chair(72, OG, 1),
    ...chair(130, OG, -1, INK),
    px(106, OG - 11, 9, 2, WOOD_D),
    px(107, OG - 11, 7, 1, YELLOW),
    px(118, OG - 11, 2, 2, WHITE),
    px(95, OG - 10, 6, 1, WHITE),
  ],
  you_sit: figure(72, OG, YOU, 'sit', 1),
  you_hold: [...figure(72, OG, YOU, 'sit_hold', 1, 'smile'), px(79, 54, 9, 6, BLUE), px(80, 55, 3, 4, WHITE), px(84, 55, 3, 4, WHITE), px(81, 56, 1, 2, ORANGE), px(85, 56, 1, 2, SKY)],
  you_wave: figure(72, OG, YOU, 'sit_wave', 1, 'smile'),
  you_slump: figure(72, OG, YOU, 'sit', 1, 'sad', true),
  you_door: figure(44, 73, YOU, 'stand', 1),
  margaret_sit: figure(130, OG, JOAN, 'sit', -1),
  margaret_card: [...figure(130, OG, JOAN, 'sit_hold', -1, 'smile'), px(119, 55, 4, 5, WHITE), px(120, 56, 2, 1, '#8a5a3c'), px(120, 57, 2, 2, ORANGE)],
  margaret_wave: figure(130, OG, JOAN, 'sit_wave', -1, 'smile'),
  margaret_write: [...figure(130, OG, JOAN, 'type', -1), px(118, OG - 10, 5, 1, WHITE)],
  portfolio_desk: [px(95, OG - 11, 9, 2, BLUE), px(95, OG - 11, 9, 1, SKY)],
  robin_popup: [fine(652, 100, 296, 224, YELLOW), fine(656, 104, 288, 216, INK), ...robin(728, 128, 12), ...centred('BEST SELLER', 800, 276, 3, YELLOW)],
  tom_tag: tag(14.5 * C, 29 * C, 'TOM', GREEN),
  beam: [...sparkle(122, 47), ...sparkle(135, 45), ...sparkle(128, 43)],
  stars: [...sparkle(64, 47), ...sparkle(78, 45), ...sparkle(70, 43)],
  nod: tick(129, 44),
  sweat_office: sweat(77, 50),
  why_bubble: bubble(980, 320, 'WHY YOU?'),
  team_bubble: bubble(520, 320, 'TEAM EFFORT!'),
  mine_bubble: bubble(520, 320, 'THAT WAS ME.'),
  best_bubble: bubble(480, 296, "I'M THE BEST\nIN THE BUILDING!"),
  doubt_bubble: bubble(480, 296, "I'M NOT SURE\nI'M READY..."),
  dots_dave: bubble(1290, 276, '...'),
  dots_margaret: bubble(1000, 328, '...'),
  long_dots: bubble(718, 296, '. . . . .'),
  tell_bubble: bubble(330, 268, 'OFF EARLY\nAGAIN, THEN.'),
};

//the screen of your computer, with Priya's portfolio open on it
const SCREEN: Record<string, Item[]> = {
  _room: [
    px(0, 7, 200, 59, DUSK),
    px(0, 66, 200, 47, WOOD),
    px(0, 66, 200, 1, WOOD_D),
    px(96, 64, 8, 3, SLATE),
    px(90, 67, 20, 1, SLATE),
    px(22, 9, 156, 55, INK),
    px(25, 12, 150, 49, '#dfe7ee'),
    px(25, 12, 150, 3, SLATE),
    ...words('PRIYA_PORTFOLIO_FINAL.PDF', 27 * C, 12 * C + 7, 2, WHITE),
    px(167, 13, 1, 1, GREEN),
    px(169, 13, 1, 1, YELLOW),
    px(171, 13, 1, 1, RED),
    px(25, 15, 7, 43, SILVER),
    ...[17, 22, 27, 32].map((y) => px(27, y, 3, 3, SLATE)),
    px(32, 15, 143, 43, '#c5ced8'),
    px(64, 18, 80, 37, TEAL),
    ...sprite(70 * C, 22 * C, ['.yyy..', 'yyy...', 'yy....', 'yy....', 'yyy...', '.yyy..'], { y: YELLOW }),
    ...Array.from({ length: 14 }, (_, i) => px(68 + Math.floor(rand(i + 7) * 72), 20 + Math.floor(rand(i + 31) * 32), 1, 1, WHITE)),
    ...centred('SWEET\nDREAMS', 640, 34 * C, 6, WHITE),
    px(25, 58, 150, 3, NAVY),
    px(26, 58, 6, 3, GREEN),
    px(50, 72, 100, 4, SILVER),
    px(152, 66, 6, 7, RED),
    px(158, 68, 2, 3, RED),
  ],
  trim_bad: dashes(552, 184, 1112, 400, RED, 'pp-blink'),
  trim_ok: dashes(512, 144, 1152, 440, GREEN),
  warn: [
    px(96, 30, 72, 22, INK),
    px(97, 31, 70, 20, WHITE),
    px(97, 31, 70, 3, YELLOW),
    ...words('WARNING', 99 * C, 31 * C + 5, 3, INK),
    ...sprite(99 * C, 36 * C, ['.kk.', 'kyyk', 'kyyk', 'kyyk', 'kyyk', '.kk.', 'kyyk', '.kk.'], { k: INK, y: YELLOW }, 4),
    ...words('WRONG PAGE SIZE.\nEDGES WILL BE CUT.', 103 * C, 36 * C, 3, INK),
    px(140, 46, 12, 4, SILVER),
    ...words('FIX', 142 * C + 2, 47 * C, 3, INK),
    px(154, 46, 12, 4, SILVER),
    ...words('SEND', 155 * C + 2, 47 * C, 3, INK),
  ],
  sent: [
    px(110, 22, 58, 14, INK),
    px(111, 23, 56, 12, WHITE),
    px(111, 23, 56, 3, GREEN),
    ...words('DONE', 113 * C, 23 * C + 5, 3, WHITE),
    ...sprite(113 * C, 28 * C, ['.....g', '....gg', 'g..gg.', 'gggg..', '.gg...'], { g: GREEN }, 6),
    ...words('SENT TO PRINTER', 119 * C, 29 * C, 3, INK),
  ],
  email: [
    px(30, 24, 64, 28, INK),
    px(31, 25, 62, 26, WHITE),
    px(31, 25, 62, 3, BLUE),
    ...words('NEW MESSAGE', 33 * C, 25 * C + 5, 3, WHITE),
    ...words('TO: PRIYA', 33 * C, 30 * C, 3, SLATE),
    px(33, 33, 58, 1, SILVER),
    ...words('FIXED YOUR MARGINS.\nGOOD LUCK MONDAY!', 33 * C, 35 * C, 3, INK),
    px(80, 45, 11, 4, GREEN),
    ...words('SENT', 81 * C + 4, 46 * C, 3, WHITE),
  ],
};

//your flat at night: the telly, the table, the sofa, and the cat
const HG = 70;
const HOME: Record<string, Item[]> = {
  _room: [
    ...ceiling(DUSK, shade(YELLOW, -0.3)),
    px(0, 10, 200, 44, '#3e2f5b'),
    px(0, 54, 200, 2, WOOD_D),
    px(0, 56, 200, 57, '#7a4a2c'),
    ...[59, 63, 68, 74].map((y) => px(0, y, 200, 1, WOOD_D)),
    px(58, 17, 16, 12, WOOD_D),
    px(59, 18, 14, 10, TEAL),
    ...sprite(59 * C, 22 * C, ['.....w........', '....www...w...', '...wwwww.www..', '..ggggggggggg.', 'gggggggggggggg', 'gggggggggggggg'], { w: WHITE, g: GREEN }),
    px(113, 12, 54, 1, WOOD_D),
    ...pane(121, 15, 38, 22, true),
    px(115, 12, 5, 30, RED),
    px(160, 12, 5, 30, RED),
    px(6, 62, 30, 8, WOOD_D),
    px(10, 47, 22, 15, INK),
    px(11, 48, 20, 13, DUSK),
    px(19, 61, 4, 1, INK),
    px(127, 58, 4, 14, TEAL),
    px(130, 52, 48, 14, TEAL),
    px(130, 66, 48, 4, '#2f8a94'),
    px(177, 58, 4, 14, TEAL),
    px(130, 70, 48, 2, WOOD_D),
    ...desk(60, 104, HG),
    ...chair(54, HG, 1),
    ...sprite(97 * C, (HG - 15) * C, ['.yyy.', 'yyyyy', '..k..', '..k..', '..k..', '.kkk.'], { y: YELLOW, k: INK }),
  ],
  tv_on: [px(11, 48, 20, 13, BLUE, 'pp-glow'), px(13, 50, 7, 4, CYAN, 'pp-glow'), px(22, 54, 7, 5, LIME, 'pp-glow'), px(14, 56, 5, 3, YELLOW)],
  portfolio: [px(76, HG - 11, 10, 2, BLUE), px(76, HG - 11, 10, 1, SKY)],
  papers_mess: [
    ...Array.from({ length: 9 }, (_, i) => px(62 + Math.floor(rand(i + 3) * 36), HG - 10, 3, 1, i % 3 ? WHITE : YELLOW)),
    ...Array.from({ length: 7 }, (_, i) => px(60 + Math.floor(rand(i + 13) * 50), HG + 1 + Math.floor(rand(i + 23) * 4), 3, 1, WHITE)),
    px(88, HG - 12, 2, 2, WHITE),
    px(64, HG - 12, 2, 2, RED),
    px(66, HG - 12, 2, 2, WHITE),
  ],
  prints_neat: [px(64, HG - 12, 8, 3, WHITE), px(64, HG - 11, 8, 1, SILVER), px(65, HG - 12, 6, 1, ORANGE)],
  cat_sit: sprite(88 * C, (HG - 17) * C, ['o...o..', 'oo.oo..', 'okoko..', 'ooooo..', '.ooo...', '.oooo.o', 'odoodoo', 'oooooo.'], CAT_PAL),
  cat_sleep: sprite(76 * C, (HG - 15) * C, ['.o.o......', 'okoooodod.', 'oooooooooo', '.oooooooo.'], CAT_PAL),
  zz: [...words('Z', 86 * C, 50 * C, 3, WHITE, 'pp-zz'), ...words('Z', 88 * C, 47 * C, 4, WHITE, 'pp-zz pp-late')],
  you_work: figure(54, HG, YOU, 'type', 1),
  you_talk: figure(72, 74, YOU, 'point', 1, 'smile'),
  polish_bubble: bubble(520, 290, "...AND THAT'S\nWHY IT'S ME!"),
  you_sofa_folio: [...figure(152, 69, YOU, 'sit_hold', -1), px(141, 55, 4, 5, BLUE), px(142, 56, 2, 3, WHITE)],
  you_sofa_game: [...figure(152, 69, YOU, 'sit_hold', -1, 'smile'), px(143, 57, 3, 2, DUSK), px(143, 57, 1, 1, RED)],
};

//the top deck of the bus home, in the rain
const BUS_GY = 70;
const busSeat = (x: number): Item[] =>
  piece(x, BUS_GY, -1, [[-8, -18, 4, 16, RED], [-6, -3, 9, 2, RED], [-8, -18, 4, 1, shade(RED, 0.3)], [-1, -1, 2, 1, INK], [-7, -15, 1, 1, YELLOW], [-5, -12, 1, 1, YELLOW], [-7, -9, 1, 1, YELLOW], [-5, -6, 1, 1, YELLOW], [-3, -3, 1, 1, YELLOW], [1, -3, 1, 1, YELLOW]]);
const BUS: Record<string, Item[]> = {
  _room: [
    px(0, 7, 200, 4, SILVER),
    px(0, 11, 200, 1, YELLOW),
    px(0, 12, 200, 44, DUSK),
    px(0, 36, 200, 20, NAVY),
    ...[6, 62, 118, 174].flatMap((x) => [
      px(x - 1, 14, 50, 22, SILVER),
      px(x, 15, 48, 20, '#151a33'),
      ...Array.from({ length: 5 }, (_, i) => px(x + 2 + Math.floor(rand(x + i) * 42), 18 + Math.floor(rand(x + i + 9) * 12), 2, 2, i % 2 ? YELLOW : ORANGE, 'pp-glow')),
      ...Array.from({ length: 9 }, (_, i) => px(x + 2 + Math.floor(rand(x * 3 + i) * 44), 17 + Math.floor(rand(x * 5 + i) * 11), 1, 3, CYAN, 'pp-rain')),
    ]),
    px(0, 56, 200, 57, SLATE),
    ...Array.from({ length: 40 }, (_, i) => px(i * 5 + 2, 58 + (i % 3) * 4, 1, 1, shade(SLATE, -0.2))),
    px(57, 11, 1, 62, YELLOW),
    px(135, 11, 1, 62, YELLOW),
    px(56, 40, 3, 2, RED),
    ...[18, 44, 70, 96, 122, 148, 174].flatMap(busSeat),
  ],
  sleeper: figure(148, BUS_GY, RIDER, 'sit', -1, undefined, true),
  you_phone: figure(96, BUS_GY, YOU, 'sit_phone', -1, 'sad'),
  mum_bubble: bubble(512, 308, 'MOM: HOW DID\nIT GO?', 'r'),
};

//the title screen
const COVER: Record<string, Item[]> = {
  _room: [
    px(0, 0, 200, 113, NAVY),
    ...Array.from({ length: 40 }, (_, i) => px(Math.floor(rand(i) * 200), Math.floor(rand(i + 77) * 70), 1, 1, i % 4 ? WHITE : CYAN, i % 3 ? undefined : 'pp-twinkle')),
    px(0, 72, 200, 41, DUSK),
  ],
  title: [...centred('THE', 800, 68, 6, YELLOW), ...centred('PROMOTION', 808, 120, 14, INK), ...centred('PROMOTION', 800, 112, 14, ORANGE)],
  start: centred('PRESS START', 800, 224, 4, WHITE, 'pp-blink'),
  stairs: [
    ...Array.from({ length: 8 }, (_, i) => [px(70 + i * 6, 69 - i * 3, 6, 3 + i * 3, SLATE), px(70 + i * 6, 69 - i * 3, 6, 1, SILVER)]).flat(),
    px(118, 48, 14, 24, SLATE),
    px(118, 48, 14, 1, SILVER),
    px(120, 33, 10, 15, WOOD_D),
    px(121, 34, 8, 14, WOOD),
    px(127, 41, 1, 1, YELLOW),
    ...sprite(122 * C, 25 * C, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'], { y: YELLOW }, C, 'pp-twinkle'),
    ...words('SENIOR\nDESIGNER', 133 * C, 37 * C, 3, YELLOW),
  ],
  racers: [...figure(56, 72, PRIYA, 'walk', 1), ...figure(66, 72, YOU, 'walk', 1)],
};

//the pause menu, for the questions about you
const BACK: Record<string, Item[]> = {
  _room: [px(0, 0, 200, 113, NAVY)],
  menu: [
    px(64, 14, 72, 44, WHITE),
    px(65, 15, 70, 42, INK),
    ...centred('PAUSED', 800, 15 * C + 20, 6, YELLOW),
    px(70, 26, 60, 1, SLATE),
    ...words('RESUME', 80 * C, 31 * C, 5, SLATE),
    ...words('ABOUT YOU', 80 * C, 38 * C, 5, WHITE),
    ...words('QUIT GAME', 80 * C, 45 * C, 5, SLATE),
    ...words('>', 75 * C, 38 * C, 5, YELLOW, 'pp-blink'),
  ],
};

//the robin card on your desk, open, with Priya's note
const CARD: Record<string, Item[]> = {
  _room: [px(0, 0, 200, 113, WOOD), ...Array.from({ length: 14 }, (_, i) => px(Math.floor(rand(i) * 150), 4 + i * 8, 20 + Math.floor(rand(i + 5) * 40), 1, WOOD_D))],
  card: [
    px(38, 14, 124, 52, WOOD_D),
    px(36, 12, 62, 52, NAVY),
    ...Array.from({ length: 24 }, (_, i) => px(38 + Math.floor(rand(i + 40) * 58), 14 + Math.floor(rand(i + 90) * 30), 1, 1, WHITE)),
    px(36, 52, 62, 12, WHITE),
    ...robin(440, 196, 16),
    ...centred("SEASON'S GREETINGS", 536, 468, 3, NAVY),
    px(98, 12, 62, 52, '#ebe6d8'),
    px(97, 12, 2, 52, SILVER),
    ...centred("COULDN'T HAVE\nDONE IT\nWITHOUT YOU.\n\nDRINKS FRIDAY?\nP X", 1032, 156, 5, NAVY),
  ],
};

const ART: Record<Room, Record<string, Item[]>> = { cover: COVER, studio: STUDIO, kitchen: KITCHEN, office: OFFICE, screen: SCREEN, home: HOME, bus: BUS, back: BACK, card: CARD };

// ---------------------------------------------------------------------------
// the cues
// ---------------------------------------------------------------------------

type Bed = 'studio' | 'quiet' | 'home' | 'bus' | 'rain';
type Mix = Partial<Record<Bed, number>>;

interface Cue {
  room: Room;
  day?: string; //the day and time in the bar across the top, and on any clock in the room
  parts: string[];
  mix: Mix;
}

const WORK: Mix = { studio: 0.7 };
const PARTY: Mix = { studio: 0.85 };
const KETTLE: Mix = { quiet: 0.6, studio: 0.3 };
const SHUT: Mix = { quiet: 0.7 };
const FLAT: Mix = { home: 0.7 };
const MONITOR: Mix = { studio: 0.45 };

const INTERVIEW = ['dave', 'margaret_sit'];
const CROWD = ['margaret_cake', 'cake', 'crowd_stand', 'priya_stand'];

const cues: Record<string, Cue> = {
  title_card: { room: 'cover', parts: ['title', 'start', 'stairs', 'racers'], mix: { studio: 0.25 } },
  studio: { room: 'studio', day: 'MON 09:12', parts: ['you_type', 'priya_type', 'tom_type'], mix: WORK },
  notice: { room: 'kitchen', day: 'MON 10:30', parts: ['margaret_pin', 'notice_paper', 'you_mug', 'quest'], mix: KETTLE },
  rivals: { room: 'studio', day: 'MON 12:45', parts: ['you_type', 'priya_type', 'tom_type', 'tags', 'vs'], mix: WORK },
  robins: { room: 'office', day: 'WED 11:00', parts: ['tom_glass', 'you_sit', 'margaret_card', 'robin_popup'], mix: SHUT },
  tom: { room: 'office', day: 'WED 11:00', parts: ['tom_glass', 'you_sit', 'margaret_card', 'tom_tag'], mix: SHUT },
  credit_tom: { room: 'office', day: 'WED 11:02', parts: ['tom_blush', 'you_sit', 'margaret_wave'], mix: SHUT },
  credit_team: { room: 'office', day: 'WED 11:02', parts: ['tom_glass', 'you_sit', 'margaret_write', 'team_bubble'], mix: SHUT },
  credit_mine: { room: 'office', day: 'WED 11:02', parts: ['tom_glass', 'you_sit', 'margaret_card', 'beam', 'mine_bubble'], mix: SHUT },
  credit_ask: { room: 'kitchen', day: 'WED 15:20', parts: ['you_mug', 'tom_mug', 'ask_bubble', 'sure_bubble'], mix: KETTLE },
  priya_coat: { room: 'studio', day: 'FRI 16:30', parts: ['you_sit', 'tom_type', 'priya_coat', 'coat_bubble'], mix: WORK },
  file: { room: 'screen', day: 'FRI 16:32', parts: ['trim_bad', 'warn'], mix: MONITOR },
  file_fix: { room: 'screen', day: 'FRI 16:40', parts: ['trim_ok', 'email', 'sent'], mix: MONITOR },
  file_send: { room: 'screen', day: 'FRI 16:33', parts: ['trim_bad', 'sent'], mix: MONITOR },
  file_slip: { room: 'studio', day: 'FRI 18:01', parts: ['night', 'glow', 'queue'], mix: { quiet: 0.35 } },
  file_tell: { room: 'office', day: 'FRI 16:45', parts: ['margaret_sit', 'you_door', 'tell_bubble', 'dots_margaret'], mix: SHUT },
  weekend: { room: 'home', day: 'SAT 20:00', parts: ['portfolio', 'cat_sit'], mix: FLAT },
  prep_all: { room: 'home', day: 'SUN 02:00', parts: ['portfolio', 'papers_mess', 'you_work'], mix: FLAT },
  prep_polish: { room: 'home', day: 'SAT 21:00', parts: ['prints_neat', 'cat_sit', 'you_talk', 'polish_bubble'], mix: FLAT },
  prep_sunday: { room: 'home', day: 'SUN 21:30', parts: ['tv_on', 'you_sofa_folio'], mix: FLAT },
  prep_none: { room: 'home', day: 'SUN 18:00', parts: ['tv_on', 'portfolio', 'cat_sleep', 'zz', 'you_sofa_game'], mix: FLAT },
  interview: { room: 'office', day: 'MON 10:00', parts: [...INTERVIEW, 'you_sit'], mix: SHUT },
  why: { room: 'office', day: 'MON 10:00', parts: [...INTERVIEW, 'you_sit', 'why_bubble'], mix: SHUT },
  pitch_boast: { room: 'office', day: 'MON 10:05', parts: [...INTERVIEW, 'you_wave', 'stars', 'best_bubble', 'dots_dave'], mix: SHUT },
  pitch_plain: { room: 'office', day: 'MON 10:05', parts: [...INTERVIEW, 'you_hold', 'nod'], mix: SHUT },
  pitch_quiet: { room: 'office', day: 'MON 10:05', parts: [...INTERVIEW, 'you_sit', 'portfolio_desk', 'long_dots'], mix: SHUT },
  pitch_doubt: { room: 'office', day: 'MON 10:05', parts: [...INTERVIEW, 'you_slump', 'sweat_office', 'doubt_bubble'], mix: SHUT },
  cake: { room: 'studio', day: 'FRI 15:00', parts: [...CROWD, 'you_stand'], mix: PARTY },
  announce: { room: 'studio', day: 'FRI 15:00', parts: ['margaret_wave', 'cake', 'crowd_clap', 'priya_promo', 'you_clap', 'promo_tag', 'confetti'], mix: PARTY },
  eyes: { room: 'studio', day: 'FRI 15:01', parts: [...CROWD, 'you_stand', 'looks', 'sweat'], mix: PARTY },
  news_clap: { room: 'studio', day: 'FRI 16:55', parts: ['cake_eaten', 'crowd_stand', 'priya_promo', 'you_slice', 'haha'], mix: PARTY },
  news_smile: { room: 'studio', day: 'FRI 16:10', parts: ['cake_eaten', 'you_slump', 'sweat_sit'], mix: WORK },
  news_loos: { room: 'studio', day: 'FRI 15:05', parts: ['door_engaged', ...CROWD], mix: PARTY },
  news_home: { room: 'studio', day: 'FRI 15:02', parts: [...CROWD, 'you_leave'], mix: PARTY },
  bus: { room: 'bus', day: 'FRI', parts: ['sleeper', 'you_phone', 'mum_bubble'], mix: { bus: 0.6, rain: 0.45 } },
  later: { room: 'studio', day: 'MON 09:30', parts: ['board_easter', 'priya_point', 'you_sit', 'tom_sit', 'easter_bubble'], mix: WORK },
  homework: { room: 'back', parts: ['menu'], mix: { quiet: 0.3 } },
  goodbye: { room: 'card', parts: ['card'], mix: { studio: 0.35 } },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS: Record<Bed, string> = {
  studio: new URL('./sounds/studio.m4a', import.meta.url).href,
  quiet: new URL('./sounds/quiet.m4a', import.meta.url).href,
  home: new URL('./sounds/home.m4a', import.meta.url).href,
  bus: new URL('./sounds/bus.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
};

const shot = (name: string, volume: number, delay: number): OneShot => ({ src: new URL(`./sounds/${name}.m4a`, import.meta.url).href, volume, delay });
const ONE_SHOTS: Record<string, OneShot> = {
  title_card: shot('start', 0.5, 0.4),
  notice: shot('quest', 0.6, 1.2),
  announce: shot('clap', 0.6, 0.3),
  goodbye: shot('life', 0.45, 0.5),
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.2; //seconds

// ---------------------------------------------------------------------------

const GAP = 0.25; //seconds between one part blinking in and the next

//each part's blocks, merged into one shape wherever neighbours in painter's order share a colour
type Run = { d: string; c: string; cls?: string; op?: number };
function runs(items: Item[]): Run[] {
  const out: Run[] = [];
  for (const { r: [x, y, w, h], c, cls, op } of items) {
    const d = `M${x} ${y}h${w}v${h}h${-w}z`;
    const last = out[out.length - 1];
    if (last && last.c === c && last.cls === cls && last.op === op) last.d += d;
    else out.push({ d, c, cls, op });
  }
  return out;
}
const DRAWN = Object.fromEntries((Object.entries(ART) as [Room, Record<string, Item[]>][]).map(([room, parts]) => [room, Object.entries(parts).map(([part, items]) => [part, runs(items)] as const)])) as Record<
  Room,
  (readonly [string, Run[]])[]
>;

interface Shown {
  cue: Cue;
  visit: number; //counts rooms cut to, so coming back to the same room steps it in again
  starts: Record<string, number>; //when each part blinks in, from when it first appears
}

//parts already up in the same room stay put; anything new blinks in after them, and a new room brings all its parts in
function turn(prev: Shown | undefined, cue: Cue): Shown {
  const kept = prev && prev.cue.room === cue.room ? prev : undefined;
  const fresh = cue.parts.filter((p) => !kept?.cue.parts.includes(p));
  const starts = Object.fromEntries(fresh.map((p, i) => [p, (kept ? 0.1 : 0.4) + i * GAP]));
  return kept ? { cue, visit: kept.visit, starts: { ...kept.starts, ...starts } } : { cue, visit: (prev?.visit ?? 0) + 1, starts };
}

const draw = ({ d, c, cls, op }: Run, i: number) => <path key={i} d={d} fill={c} className={cls} opacity={op} />;

//pixels stay hard edged
const crisp = (content: ReactNode) => <g shapeRendering="crispEdges">{content}</g>;

//each part is a layer, and the ones with something moving in them get svgs of their own
function Panel({ shown }: { shown: Shown }) {
  const { cue, starts } = shown;
  const layers: Layer[] = DRAWN[cue.room]
    .filter(([part]) => part.startsWith('_') || cue.parts.includes(part))
    .map(([part, shapes]) => ({
      key: part,
      moving: shapes.some((shape) => shape.cls) ? part : undefined,
      node: part.startsWith('_') ? (
        <g>{shapes.map(draw)}</g>
      ) : (
        <g className="pp-pop" style={{ animationDelay: `${starts[part] ?? 0}s` }}>
          {shapes.map(draw)}
        </g>
      ),
    }));
  layers.push({ key: 'clock', node: <Clock cue={cue} /> });
  return <Layers viewBox={VIEW} layers={layers} wrap={crisp} className="pp-in" />;
}

//a wall clock showing the cue's time, or the time in the corner of the screen
function Clock({ cue }: { cue: Cue }) {
  const time = cue.day?.match(/(\d\d):(\d\d)/);
  if (!time) return null;
  const [h, m] = [Number(time[1]), Number(time[2])];
  let items: Item[] = [];
  if (cue.room === 'screen') items = words(time[0], 163 * C, 58 * C + 5, 3, WHITE);
  const at = WALL_CLOCK[cue.room];
  if (at) {
    const [cx, cy] = at;
    const hand = (turns: number, length: number, c: string) =>
      Array.from({ length }, (_, i) => px(cx + Math.round((i + 1) * Math.sin(turns * 2 * Math.PI)), cy - Math.round((i + 1) * Math.cos(turns * 2 * Math.PI)), 1, 1, c));
    items = [
      ...sprite((cx - 4) * C, (cy - 4) * C, ['..kkkkk..', '.kwwwwwk.', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', '.kwwwwwk.', '..kkkkk..'], { k: INK, w: WHITE }),
      ...hand(m / 60, 3, SLATE),
      ...hand(((h % 12) + m / 60) / 12, 2, INK),
      px(cx, cy, 1, 1, RED),
    ];
  }
  return <g>{runs(items).map(draw)}</g>;
}

//the bar across the top: the day, the time and the place
function Hud({ cue }: { cue: Cue }) {
  if (!cue.day) return null;
  return (
    <g>
      <rect width={W} height={56} fill={INK} />
      <rect y={52} width={W} height={4} fill={DUSK} />
      {runs(centred(`${cue.day}  ·  ${PLACE[cue.room]}`, 800, 18, 4, WHITE)).map(draw)}
    </g>
  );
}

function PixelOffice({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Promotion has no cue for the animation "${animation}"`);
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

  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Panel key={`${shown.cue.room}-${shown.visit}`} shown={shown} />
      <Sheet viewBox={VIEW}>{crisp(<Hud cue={shown.cue} />)}</Sheet>
    </div>
  );
}

//a new room steps up from black, and new parts blink in, like an old console
const keyframes = `
.pp-in {
  animation: pp-in 0.4s steps(4) both;
}
@keyframes pp-in {
  from { opacity: 0; }
}
.pp-pop {
  animation: pp-pop 0.3s steps(1) both;
}
@keyframes pp-pop {
  from { opacity: 0; }
  50% { opacity: 1; }
  75% { opacity: 0; }
}
.pp-blink {
  animation: pp-blink 1s steps(1) infinite;
}
@keyframes pp-blink {
  50% { opacity: 0; }
}
.pp-twinkle {
  animation: pp-blink 0.8s steps(1) infinite;
}
.pp-bob {
  animation: pp-bob 0.9s steps(1) infinite;
}
@keyframes pp-bob {
  50% { transform: translateY(-4px); }
}
.pp-type {
  animation: pp-type 0.24s steps(1) infinite;
}
@keyframes pp-type {
  50% { transform: translateY(-8px); }
}
.pp-clap {
  animation: pp-clap 0.3s steps(1) infinite;
}
@keyframes pp-clap {
  50% { transform: translateX(-8px); }
}
.pp-glow {
  animation: pp-glow 2.6s steps(1) infinite;
}
@keyframes pp-glow {
  40% { opacity: 0.7; }
  60% { opacity: 1; }
  85% { opacity: 0.8; }
}
.pp-rain {
  animation: pp-rain 0.9s steps(6) infinite;
}
@keyframes pp-rain {
  from { transform: translateY(-16px); opacity: 0; }
  30% { opacity: 1; }
  to { transform: translateY(24px); opacity: 0; }
}
.pp-fall1, .pp-fall2, .pp-fall3 {
  animation: pp-fall 1.6s steps(8) infinite;
}
.pp-fall2 { animation-duration: 1.3s; animation-delay: -0.5s; }
.pp-fall3 { animation-duration: 1.9s; animation-delay: -1.1s; }
@keyframes pp-fall {
  from { transform: translateY(-24px); }
  to { transform: translateY(72px); opacity: 0; }
}
.pp-zz {
  animation: pp-zz 2s steps(4) infinite;
}
.pp-late {
  animation-delay: -1s;
}
@keyframes pp-zz {
  from { transform: translate(0, 0); opacity: 0; }
  25% { opacity: 1; }
  to { transform: translate(8px, -24px); opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: INK,
    overflow: 'hidden',
  },
};

export default PixelOffice;
