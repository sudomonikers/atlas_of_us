import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// Signboard paints the wedding like a Lagos sign-writer's board: flat enamel colours, a thick black outline round
// everything, a stripe of white gloss on the curves, block lettering with a drop shadow, and a green-white-green frame
// with a bolt in each corner. Every cue is a board painted once and kept. A new set slides in from the right like a
// board being swapped on a wall, and a new beat on the same set cross-fades. Dancers, falling naira notes, bulbs,
// phone lights, candles and generator smoke move on top.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const SWAP = 0.75; //seconds a new board takes to slide in
const BEAT_FADE = 0.45; //seconds to cross-fade a new beat on the same set
const BORDER = 34; //the painted frame round every board
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = '#1b1410';
const WHITE = '#fbf7ee';
const CREAM = '#f3e4c0';
const CORAL = '#ef6f5a';
const CORAL_DARK = '#b8473a';
const GOLD = '#e8b030';
const GREEN = '#0f8a4c';
const GREEN_DARK = '#0b5a32';
const SKY = '#58b7e0';
const SKY_PALE = '#a9dcf0';
const YELLOW = '#f5c518';
const BLUE = '#2f5fa8';
const PURPLE = '#6a3d8f';
const RED = '#d23b2e';
const WOOD = '#8a5532';
const WOOD_DARK = '#5e3720';
const WALL = '#f0d9a8';
const NIGHT = '#141a33';
const SKINS = ['#6b3e26', '#7d4a2e', '#8a5536', '#5a321e', '#734229'];
const SIGN = 'Impact, "Arial Black", "Helvetica Neue", sans-serif';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'street' | 'tailor' | 'hall' | 'stage' | 'doors' | 'dark' | 'yard' | 'book' | 'night';

interface Cue {
  set: SetId;
  beat: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'street', beat: 'title', card: ['A Wedding in Lagos', 'The Owambe'] },
  lagos_morning: { set: 'street', beat: 'morning' },
  fabric: { set: 'tailor', beat: 'lace' },
  tailor: { set: 'tailor', beat: 'shop' },
  hall_wide: { set: 'hall', beat: 'wide' },
  hall_food: { set: 'hall', beat: 'food' },
  mc: { set: 'stage', beat: 'mc' },
  mic_you: { set: 'stage', beat: 'you' },
  backstage: { set: 'doors', beat: 'fight' },
  entrance: { set: 'hall', beat: 'entrance' },
  dance_floor: { set: 'hall', beat: 'dance' },
  spraying: { set: 'hall', beat: 'spray' },
  grandma: { set: 'hall', beat: 'grandma' },
  blackout: { set: 'dark', beat: 'dark' },
  phones: { set: 'dark', beat: 'phones' },
  candles: { set: 'dark', beat: 'candles' },
  generator: { set: 'yard', beat: 'generator' },
  lights_back: { set: 'hall', beat: 'back' },
  cake: { set: 'hall', beat: 'cake' },
  guestbook: { set: 'book', beat: 'book' },
  late_night: { set: 'night', beat: 'night' },
  the_end: { set: 'night', beat: 'end' },
};
const FIRST_CUE = 'title_card';

//hall beats with the floor cleared and people dancing on it
const DANCING = new Set(['entrance', 'dance', 'spray', 'grandma', 'back']);

// ---------------------------------------------------------------------------
// the brush
// ---------------------------------------------------------------------------

//a fixed per-index random, so boards and the live layer come out the same every time
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function canvas2d(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return [el, el.getContext('2d')!];
}

function poly(c: Ctx, points: Pt[], fill: string | CanvasPattern, width = 4) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (width) {
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function oval(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasPattern, width = 4) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (width) {
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

//the stripe of white gloss a sign-writer puts down the lit side of every shape
function shine(c: Ctx, x0: number, y0: number, x1: number, y1: number, width = 5) {
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.lineCap = 'round';
  c.lineWidth = width;
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.stroke();
}

//block capitals with a black outline and a drop shadow, the way every shop front in Lagos is lettered
function letter(c: Ctx, text: string, x: number, y: number, size: number, fill: string, shadow = INK, maxWidth?: number) {
  c.font = `${size}px ${SIGN}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.fillStyle = shadow;
  c.fillText(text, x + size * 0.07, y + size * 0.07, maxWidth);
  c.lineWidth = size * 0.12;
  c.strokeStyle = INK;
  c.strokeText(text, x, y, maxWidth);
  c.fillStyle = fill;
  c.fillText(text, x, y, maxWidth);
}

//a lettered board, as nailed above a shop
function signboard(c: Ctx, x: number, y: number, w: number, h: number, ground: string, lines: [string, number, string][]) {
  poly(c, rect(x, y, w, h), ground, 5);
  poly(c, rect(x + 8, y + 8, w - 16, h - 16), ground, 2);
  const step = h / (lines.length + 1);
  lines.forEach(([text, size, fill], i) => letter(c, text, x + w / 2, y + step * (i + 1), size, fill, INK, w - 40));
}

//lace: gold thread flowers dotted over the cloth, as a pattern so any shape can be filled with it
const laces = new Map<string, CanvasPattern>();
function lace(c: Ctx, ground: string, thread = GOLD) {
  const key = ground + thread;
  if (!laces.has(key)) {
    const [el, t] = canvas2d(24, 24);
    t.fillStyle = ground;
    t.fillRect(0, 0, 24, 24);
    t.fillStyle = thread;
    for (const [x, y] of [[6, 6], [18, 18]] as Pt[]) {
      for (let k = 0; k < 4; k++) {
        t.beginPath();
        t.arc(x + Math.cos((k * Math.PI) / 2) * 2.6, y + Math.sin((k * Math.PI) / 2) * 2.6, 1.5, 0, Math.PI * 2);
        t.fill();
      }
    }
    laces.set(key, c.createPattern(el, 'repeat')!);
  }
  return laces.get(key)!;
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

type Head = 'gele' | 'fila' | 'bare';
type Arms = 'down' | 'up' | 'wave' | 'hips' | 'hold' | 'cross' | 'pull';
type Face = 'smile' | 'cross' | 'open';

interface Guest {
  x: number;
  y: number; //where their feet are
  s: number;
  skin: string;
  robe: string;
  head: Head;
  headColor: string;
  arms?: Arms;
  face?: Face;
  laced?: boolean;
}

function person(c: Ctx, g: Guest) {
  const { x, y, s, skin, robe, head, headColor, arms = 'down', face = 'smile', laced = true } = g;
  const top = y - 150 * s;
  const headY = y - 180 * s;
  const fill = laced ? lace(c, robe) : robe;

  //arms first, so the robe's shoulders sit over them
  const reach = (side: 1 | -1): [Pt, Pt] => {
    const pose = arms === 'wave' ? (side === 1 ? 'up' : 'down') : arms === 'pull' ? (side === 1 ? 'up' : 'hips') : arms;
    const sx = x + side * 30 * s;
    if (pose === 'up') return [[sx + side * 26 * s, top - 30 * s], [sx + side * 22 * s, top - 82 * s]];
    if (pose === 'hips') return [[sx + side * 34 * s, top + 44 * s], [sx + side * 12 * s, top + 74 * s]];
    if (pose === 'hold') return [[sx + side * 14 * s, top + 52 * s], [x + side * 16 * s, top + 60 * s]];
    if (pose === 'cross') return [[sx + side * 8 * s, top + 56 * s], [x - side * 22 * s, top + 44 * s]];
    return [[sx + side * 14 * s, top + 52 * s], [sx + side * 18 * s, top + 96 * s]];
  };
  for (const side of [-1, 1] as const) {
    const [elbow, hand] = reach(side);
    c.beginPath();
    c.moveTo(x + side * 28 * s, top + 8 * s);
    c.lineTo(...elbow);
    c.lineTo(...hand);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = 22 * s;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 14 * s;
    c.strokeStyle = robe;
    c.stroke();
    oval(c, hand[0], hand[1], 8 * s, 8 * s, skin, 3 * s);
  }

  poly(c, [[x - 34 * s, top], [x + 34 * s, top], [x + 54 * s, y], [x - 54 * s, y]], fill, 4 * s);
  shine(c, x - 26 * s, top + 16 * s, x - 40 * s, y - 20 * s, 4 * s);

  //the gele goes behind the head, the fila on top of it
  if (head === 'gele') {
    const points: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      const r = (i % 2 ? 46 : 62) * s;
      points.push([x + Math.cos(a) * r, headY - 10 * s + Math.sin(a) * r * 0.8]);
    }
    points.push([x + 26 * s, headY + 4 * s], [x - 26 * s, headY + 4 * s]);
    poly(c, points, headColor, 4 * s);
    c.beginPath();
    for (let i = 1; i < 8; i += 2) {
      c.moveTo(x, headY - 6 * s);
      c.lineTo(...points[i]);
    }
    c.lineWidth = 2.5 * s;
    c.strokeStyle = INK;
    c.stroke();
  }
  oval(c, x, headY, 24 * s, 27 * s, skin, 4 * s);
  if (head === 'bare') {
    c.beginPath();
    c.arc(x, headY - 4 * s, 24 * s, Math.PI * 1.05, Math.PI * 1.95);
    c.lineWidth = 9 * s;
    c.strokeStyle = INK;
    c.stroke();
  }
  if (head === 'fila') poly(c, [[x - 25 * s, headY - 14 * s], [x + 25 * s, headY - 14 * s], [x + 34 * s, headY - 38 * s], [x - 8 * s, headY - 46 * s]], headColor, 4 * s);

  //the face, kept to a sign-writer's few strokes
  c.fillStyle = INK;
  for (const side of [-1, 1]) {
    c.beginPath();
    c.arc(x + side * 9 * s, headY - 1 * s, 3 * s, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.lineWidth = 3 * s;
  c.strokeStyle = INK;
  c.lineCap = 'round';
  if (face === 'smile') c.arc(x, headY + 6 * s, 10 * s, Math.PI * 0.15, Math.PI * 0.85);
  if (face === 'cross') {
    c.moveTo(x - 8 * s, headY + 14 * s);
    c.lineTo(x + 8 * s, headY + 14 * s);
    c.moveTo(x - 15 * s, headY - 12 * s);
    c.lineTo(x - 4 * s, headY - 8 * s);
    c.moveTo(x + 15 * s, headY - 12 * s);
    c.lineTo(x + 4 * s, headY - 8 * s);
  }
  c.stroke();
  if (face === 'open') oval(c, x, headY + 13 * s, 5 * s, 6 * s, INK, 0);
}

//a crowd of guests in the family coral, with the odd guest in their own colours
const OUTFITS: [string, string][] = [
  [CORAL, GOLD],
  [CORAL, CORAL_DARK],
  [CORAL, GOLD],
  [PURPLE, GOLD],
  [CORAL, GOLD],
  [BLUE, WHITE],
  [CORAL, GOLD],
  [GREEN, GOLD],
];
function guest(i: number, x: number, y: number, s: number, arms: Arms = 'down'): Guest {
  const [robe, headColor] = OUTFITS[i % OUTFITS.length];
  return { x, y, s, skin: SKINS[i % SKINS.length], robe, head: i % 3 === 1 ? 'fila' : 'gele', headColor, arms };
}

const TOLU: Omit<Guest, 'x' | 'y' | 's'> = { skin: SKINS[1], robe: WHITE, head: 'gele', headColor: GOLD };
const EMEKA: Omit<Guest, 'x' | 'y' | 's'> = { skin: SKINS[3], robe: CREAM, head: 'fila', headColor: RED };
const BISI: Omit<Guest, 'x' | 'y' | 's'> = { skin: SKINS[2], robe: CORAL, head: 'gele', headColor: CORAL_DARK };
const GRANDMA: Omit<Guest, 'x' | 'y' | 's'> = { skin: SKINS[4], robe: CORAL, head: 'gele', headColor: GOLD };

// ---------------------------------------------------------------------------
// the street, and the tailor
// ---------------------------------------------------------------------------

function sky(c: Ctx, bottom: number) {
  //painted sky in three flat bands, the way a sign-writer does it
  poly(c, rect(0, 0, W, bottom), SKY, 0);
  poly(c, rect(0, bottom * 0.55, W, bottom * 0.45), '#7cc6e6', 0);
  poly(c, rect(0, bottom * 0.8, W, bottom * 0.2), SKY_PALE, 0);
}

function sun(c: Ctx, x: number, y: number, r: number) {
  c.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    c.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2);
    c.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6);
  }
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.strokeStyle = GOLD;
  c.stroke();
  oval(c, x, y, r, r, YELLOW, 5);
  shine(c, x - r * 0.5, y - r * 0.3, x - r * 0.2, y - r * 0.65, 6);
}

function building(c: Ctx, x: number, w: number, top: number, wall: string, sign?: [string, string, string]) {
  poly(c, rect(x, top, w, 640 - top), wall, 5);
  poly(c, rect(x - 10, top - 14, w + 20, 18), WOOD_DARK, 4);
  for (let fy = top + 40; fy < 520; fy += 110) {
    for (let fx = x + 30; fx < x + w - 60; fx += 90) {
      poly(c, rect(fx, fy, 50, 60), SKY_PALE, 4);
      c.beginPath();
      for (let k = 1; k < 4; k++) {
        c.moveTo(fx + k * 12.5, fy);
        c.lineTo(fx + k * 12.5, fy + 60);
      }
      c.lineWidth = 3;
      c.strokeStyle = INK;
      c.stroke();
    }
  }
  if (sign) signboard(c, x + 16, 520, w - 32, 90, sign[0], [[sign[1], 30, WHITE], [sign[2], 22, YELLOW]]);
}

//a yellow danfo bus with its black stripes, its slogan, and somebody hanging out of the door
function danfo(c: Ctx, x: number, y: number) {
  poly(c, [[x, y - 120], [x + 330, y - 120], [x + 360, y - 70], [x + 360, y - 20], [x, y - 20]], YELLOW, 5);
  poly(c, rect(x, y - 60, 360, 14), INK, 0);
  poly(c, rect(x, y - 40, 360, 8), INK, 0);
  for (let k = 0; k < 4; k++) poly(c, rect(x + 20 + k * 74, y - 108, 58, 40), SKY_PALE, 4);
  poly(c, [[x + 316, y - 108], [x + 340, y - 108], [x + 352, y - 76], [x + 316, y - 76]], SKY_PALE, 4);
  letter(c, 'NO FOOD FOR LAZY MAN', x + 180, y - 126 - 16, 22, RED, INK);
  for (const wx of [x + 70, x + 290]) {
    oval(c, wx, y - 16, 30, 30, INK, 0);
    oval(c, wx, y - 16, 12, 12, '#9a9a9a', 3);
  }
  shine(c, x + 14, y - 112, x + 300, y - 112, 4);
}

function streetScene(c: Ctx, beat: string) {
  sky(c, 640);
  sun(c, beat === 'title' ? 1260 : 1360, 150, beat === 'title' ? 80 : 60);
  building(c, 40, 360, 220, '#e9b98f', [GREEN, 'MAMA TUNDE FASHION', 'ALL KINDS OF STYLES']);
  building(c, 420, 300, 300, '#d9a4c4', [RED, 'BLESSED HANDS', 'BARBING SALON']);
  building(c, 740, 380, 180, WALL, [BLUE, "ALHAJA'S JOLLOF SPOT", 'SMALL CHOPS & DRINKS']);
  building(c, 1140, 420, 260, '#a9d4b4');
  //electricity poles and their tangle of wires
  for (const px of [400, 1130]) {
    poly(c, rect(px - 7, 120, 14, 520), WOOD_DARK, 3);
    poly(c, rect(px - 50, 140, 100, 12), WOOD_DARK, 3);
  }
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    c.moveTo(0, 150 + k * 8);
    c.quadraticCurveTo(400, 190 + k * 8, 400, 146);
    c.quadraticCurveTo(765, 210 + k * 6, 1130, 146);
    c.quadraticCurveTo(1400, 200 + k * 8, W, 160 + k * 8);
  }
  c.lineWidth = 2.5;
  c.strokeStyle = INK;
  c.stroke();
  poly(c, rect(0, 640, W, H - 640), '#6d6a64', 5);
  poly(c, rect(0, 640, W, 22), '#b9b2a2', 4);
  for (let x = 40; x < W; x += 180) poly(c, rect(x, 770, 90, 10), WHITE, 0);
  //people on the pavement, already dressed for somebody's party
  [[230, 0.6], [600, 0.55], [980, 0.6], [1460, 0.58]].forEach(([x, s], i) => person(c, guest(i + 2, x, 660, s, i === 1 ? 'wave' : 'down')));
}

function tailorScene(c: Ctx, beat: string) {
  if (beat === 'lace') {
    poly(c, rect(0, 0, W, H), WOOD, 0);
    for (let y = 30; y < H; y += 70) shine(c, 0, y, W, y + 6, 3);
    //the aso-ebi, folded in its bag, and the gold thread
    poly(c, [[340, 230], [1180, 200], [1260, 700], [300, 740]], '#e9e2d6', 5);
    letter(c, 'ASO-EBI', 780, 300, 64, GOLD, INK);
    for (let k = 0; k < 4; k++) poly(c, [[420 + k * 10, 390 + k * 70], [1160 - k * 6, 370 + k * 70], [1170 - k * 6, 440 + k * 70], [410 + k * 10, 460 + k * 70]], lace(c, k % 2 ? CORAL : '#f27d69'), 4);
    for (let x = 430; x < 1170; x += 26) oval(c, x, 680, 10, 10, CORAL, 3);
    oval(c, 1320, 520, 70, 90, GOLD, 5);
    oval(c, 1320, 520, 24, 30, WOOD_DARK, 4);
    shine(c, 1280, 470, 1290, 560, 6);
    return;
  }
  poly(c, rect(0, 0, W, H), '#7fb8a8', 0);
  //bolts of cloth up to the ceiling
  const bolts = [CORAL, GOLD, PURPLE, BLUE, RED, GREEN, YELLOW, WHITE, CORAL_DARK, SKY];
  for (let row = 0; row < 3; row++) {
    poly(c, rect(80, 170 + row * 150, 620, 16), WOOD_DARK, 4);
    for (let k = 0; k < 8; k++) poly(c, rect(96 + k * 74, 70 + row * 150, 62, 100), lace(c, bolts[(k + row * 3) % bolts.length], WHITE), 4);
  }
  signboard(c, 820, 60, 680, 150, GREEN, [['MAMA TUNDE FASHION', 52, WHITE], ['ALL KINDS OF STYLES . QUICK QUICK', 28, YELLOW]]);
  //the radio, and a sewing machine on the table
  poly(c, rect(1260, 270, 180, 110), RED, 5);
  oval(c, 1310, 325, 32, 32, INK, 0);
  poly(c, rect(1360, 300, 60, 14), WHITE, 3);
  poly(c, rect(0, 640, W, H - 640), WOOD, 5);
  person(c, { x: 1000, y: 740, s: 1.9, skin: SKINS[4], robe: PURPLE, head: 'gele', headColor: YELLOW, arms: 'hold' });
  //the tape measure round her neck
  c.beginPath();
  c.moveTo(950, 455);
  c.quadraticCurveTo(1000, 520, 1050, 455);
  c.moveTo(955, 460);
  c.lineTo(940, 610);
  c.moveTo(1045, 460);
  c.lineTo(1060, 600);
  c.lineWidth = 12;
  c.strokeStyle = YELLOW;
  c.stroke();
  poly(c, rect(0, 660, W, 30), WOOD_DARK, 4);
  poly(c, [[200, 660], [460, 660], [460, 560], [380, 520], [240, 520], [240, 600], [200, 600]], INK, 4);
  shine(c, 250, 540, 370, 535, 5);
  letter(c, 'SINGER', 330, 575, 22, GOLD, INK);
  poly(c, [[520, 690], [760, 640], [800, 700], [560, 740]], lace(c, CORAL), 4);
}

// ---------------------------------------------------------------------------
// the hall
// ---------------------------------------------------------------------------

//white and gold cloth swagged across the ceiling, and the bulbs strung under it
function swags(c: Ctx) {
  for (let x = 0; x < W; x += 200) {
    c.beginPath();
    c.moveTo(x, 0);
    c.quadraticCurveTo(x + 100, 150, x + 200, 0);
    c.closePath();
    c.fillStyle = x % 400 ? WHITE : GOLD;
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.stroke();
  }
}

const BULBS: Pt[] = Array.from({ length: 34 }, (_, i) => {
  const x = (i + 0.5) * (W / 34);
  return [x, 120 + Math.sin((x / W) * Math.PI * 4) * 22];
});

function stage(c: Ctx) {
  poly(c, rect(420, 210, 760, 250), '#5b2a5e', 5);
  letter(c, 'TOLU & EMEKA', 800, 250, 46, GOLD, INK);
  letter(c, '#TEforever', 800, 300, 24, WHITE, INK);
  poly(c, rect(400, 440, 800, 40), WOOD, 5);
  //the band: talking drum, guitar, keyboard
  person(c, { ...guest(5, 520, 440, 0.75, 'hold'), head: 'fila', headColor: WHITE });
  oval(c, 545, 380, 22, 34, WOOD, 4);
  person(c, { ...guest(3, 700, 440, 0.75, 'hold'), head: 'fila' });
  poly(c, [[660, 375], [760, 345], [764, 356], [664, 386]], RED, 4);
  person(c, { ...guest(7, 1080, 440, 0.75, 'hold'), head: 'bare' });
  poly(c, rect(1010, 380, 140, 24), INK, 3);
  poly(c, rect(1018, 382, 124, 8), WHITE, 0);
}

function table(c: Ctx, x: number, y: number, s: number, seat: number) {
  for (let k = 0; k < 3; k++) person(c, guest(seat + k, x + (k - 1) * 70 * s, y + 40 * s, 0.8 * s));
  oval(c, x, y, 130 * s, 34 * s, WHITE, 4);
  poly(c, [[x - 130 * s, y], [x + 130 * s, y], [x + 120 * s, y + 80 * s], [x - 120 * s, y + 80 * s]], WHITE, 4);
  shine(c, x - 100 * s, y + 20 * s, x - 90 * s, y + 70 * s);
  oval(c, x, y - 16 * s, 16 * s, 26 * s, GOLD, 3);
}

function hallScene(c: Ctx, beat: string) {
  poly(c, rect(0, 0, W, H), '#e8cfa0', 0);
  for (let x = 0; x < W; x += 80) poly(c, rect(x, 150, 40, 330), '#e2c690', 0);
  swags(c);
  stage(c);
  poly(c, rect(0, 480, W, H - 480), '#c9b48c', 5);
  for (let y = 520; y < H; y += 60) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(27,20,16,0.35)';
    c.stroke();
  }
  const floorClear = DANCING.has(beat) || beat === 'cake';
  //tables round the edge, and across the middle until the floor is cleared
  const spots: [number, number, number][] = floorClear
    ? [[140, 560, 0.8], [1460, 560, 0.8], [110, 760, 1.05], [1490, 760, 1.05]]
    : [[220, 560, 0.8], [620, 560, 0.8], [1000, 560, 0.8], [1400, 560, 0.8], [380, 760, 1.1], [1220, 760, 1.1]];
  spots.forEach(([x, y, s], i) => table(c, x, y, s, i * 3));
  if (beat === 'food') {
    person(c, { x: 820, y: 960, s: 2.3, skin: SKINS[0], robe: WHITE, head: 'bare', headColor: WHITE, arms: 'hold', laced: false });
    oval(c, 820, 590, 190, 40, '#d8d8d8', 5);
    for (let k = 0; k < 7; k++) oval(c, 700 + k * 40, 570 - (k % 2) * 14, 22, 18, k % 3 ? '#e07b28' : '#c8892e', 3);
  }
  if (beat === 'cake') {
    person(c, { ...TOLU, x: 600, y: 620, s: 1.15, arms: 'hold' });
    person(c, { ...EMEKA, x: 1000, y: 620, s: 1.15, arms: 'hold' });
    const tiers = [[260, 70], [220, 64], [180, 58], [140, 52], [100, 46]];
    let top = 860;
    tiers.forEach(([w, h], i) => {
      top -= h;
      poly(c, rect(800 - w / 2, top, w, h), i % 2 ? GOLD : WHITE, 5);
      for (let x = 800 - w / 2 + 14; x < 800 + w / 2; x += 26) oval(c, x, top + 6, 7, 7, CORAL, 2);
    });
    //the skyline of Lagos in sugar on the top tier
    poly(c, [[750, top], [750, top - 50], [770, top - 50], [770, top - 90], [790, top - 90], [790, top - 30], [815, top - 30], [815, top - 70], [835, top - 70], [835, top - 40], [850, top - 40], [850, top]], WHITE, 3);
  }
}

function stageScene(c: Ctx, beat: string) {
  poly(c, rect(0, 0, W, H), '#3a1d3c', 0);
  swags(c);
  if (beat === 'mc') {
    stage(c);
    c.beginPath();
    c.moveTo(780, 0);
    c.lineTo(620, 900);
    c.lineTo(1100, 900);
    c.lineTo(860, 0);
    c.fillStyle = 'rgba(255,240,180,0.18)';
    c.fill();
    poly(c, rect(0, 640, W, H - 640), WOOD, 5);
    person(c, { x: 820, y: 940, s: 2.2, skin: SKINS[3], robe: BLUE, head: 'fila', headColor: BLUE, arms: 'wave', face: 'open' });
    poly(c, rect(908, 360, 22, 60), INK, 3);
    oval(c, 919, 350, 20, 20, '#9a9a9a', 4);
    letter(c, 'MC GBENGA', 300, 760, 60, YELLOW, RED);
    return;
  }
  //four hundred faces turning round, and the microphone in your hand
  for (let row = 0; row < 4; row++) {
    const s = 0.5 + row * 0.22;
    const y = 360 + row * 150;
    for (let k = 0; k < 9 - row; k++) person(c, { ...guest(row * 9 + k, 90 + (k + (row % 2) * 0.5) * (1500 / (9 - row)), y, s), face: k % 3 ? 'smile' : 'open' });
  }
  c.fillStyle = 'rgba(255,240,180,0.12)';
  c.beginPath();
  c.ellipse(800, 900, 900, 320, 0, Math.PI, Math.PI * 2);
  c.fill();
  poly(c, [[1180, 900], [1250, 700], [1330, 720], [1300, 900]], lace(c, CORAL), 5);
  oval(c, 1270, 690, 46, 40, SKINS[1], 5);
  poly(c, [[1240, 690], [1220, 560], [1250, 552], [1278, 690]], INK, 4);
  oval(c, 1228, 545, 30, 30, '#9a9a9a', 5);
  shine(c, 1214, 534, 1226, 524, 5);
}

function doorsScene(c: Ctx) {
  poly(c, rect(0, 0, W, H), '#d9c7a0', 0);
  //the double doors to the hall, gold handles, and the music leaking under them
  poly(c, rect(560, 90, 480, 620), WOOD, 6);
  poly(c, rect(580, 110, 210, 580), WOOD_DARK, 4);
  poly(c, rect(810, 110, 210, 580), WOOD_DARK, 4);
  oval(c, 770, 420, 12, 30, GOLD, 4);
  oval(c, 830, 420, 12, 30, GOLD, 4);
  shine(c, 600, 130, 600, 660, 5);
  poly(c, rect(0, 710, W, H - 710), '#a99a7a', 5);
  person(c, { ...TOLU, x: 420, y: 860, s: 2.0, arms: 'up', face: 'open' });
  person(c, { ...BISI, x: 1190, y: 860, s: 2.1, arms: 'cross', face: 'cross' });
}

// ---------------------------------------------------------------------------
// the dark, the yard, the book and the night
// ---------------------------------------------------------------------------

function darkScene(c: Ctx, beat: string) {
  poly(c, rect(0, 0, W, H), '#07080f', 0);
  if (beat === 'dark') return;
  //only the outlines of the room, where a little light is falling
  c.globalAlpha = beat === 'candles' ? 0.5 : 0.3;
  for (const x of [300, 800, 1300]) table(c, x, 620, 1, x);
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(7,8,15,0.55)';
  c.fillRect(0, 0, W, H);
}

function yardScene(c: Ctx) {
  poly(c, rect(0, 0, W, H), NIGHT, 0);
  poly(c, rect(0, 120, W, 520), '#3b3f52', 5);
  for (let x = 30; x < W; x += 150) poly(c, rect(x, 220, 80, 100), '#20253a', 4);
  poly(c, rect(0, 640, W, H - 640), '#2d2a26', 5);
  //the generator, and Uncle Femi at war with it
  poly(c, rect(700, 470, 380, 230), GREEN, 6);
  poly(c, rect(720, 490, 180, 110), GREEN_DARK, 4);
  letter(c, 'MIKANO', 990, 540, 34, YELLOW, INK);
  poly(c, rect(1030, 410, 26, 70), '#555', 4);
  for (const wx of [740, 1040]) oval(c, wx, 712, 26, 26, INK, 0);
  shine(c, 716, 486, 1060, 486, 5);
  person(c, { x: 560, y: 820, s: 1.7, skin: SKINS[2], robe: WHITE, head: 'fila', headColor: CORAL, arms: 'pull', face: 'cross' });
  c.beginPath();
  c.moveTo(613, 405);
  c.lineTo(730, 560);
  c.lineWidth = 3;
  c.strokeStyle = WHITE;
  c.stroke();
}

function bookScene(c: Ctx) {
  poly(c, rect(0, 0, W, H), lace(c, CORAL), 0);
  poly(c, [[230, 150], [800, 190], [1370, 150], [1400, 790], [800, 830], [200, 790]], '#8a2f3c', 6);
  poly(c, [[260, 170], [790, 205], [790, 805], [240, 770]], CREAM, 4);
  poly(c, [[810, 205], [1340, 170], [1360, 770], [810, 805]], CREAM, 4);
  letter(c, 'TO OPEN IN TEN YEARS', 520, 250, 30, GOLD, INK);
  //other guests' notes, scribbled in, and an empty page for yours
  c.beginPath();
  for (let line = 0; line < 10; line++) {
    const y = 310 + line * 44;
    let x = 300;
    while (x < 740) {
      const w = 30 + rand(line * 13 + x) * 70;
      c.moveTo(x, y);
      c.lineTo(Math.min(740, x + w), y + (rand(x) - 0.5) * 4);
      x += w + 14;
    }
  }
  c.lineWidth = 3;
  c.strokeStyle = BLUE;
  c.stroke();
  c.beginPath();
  for (let y = 300; y < 760; y += 44) {
    c.moveTo(850, y);
    c.lineTo(1320, y - 6);
  }
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(27,20,16,0.3)';
  c.stroke();
  poly(c, [[1180, 640], [1440, 380], [1462, 400], [1202, 660]], GOLD, 4);
  poly(c, [[1180, 640], [1202, 660], [1170, 672]], INK, 3);
}

function nightScene(c: Ctx) {
  poly(c, rect(0, 0, W, H), NIGHT, 0);
  oval(c, 1340, 140, 56, 56, CREAM, 4);
  oval(c, 1364, 128, 50, 50, NIGHT, 0);
  poly(c, rect(200, 300, 1000, 360), '#7a5b7d', 6);
  letter(c, 'GRACELAND EVENT CENTRE', 700, 350, 44, GOLD, INK);
  for (let k = 0; k < 5; k++) poly(c, rect(260 + k * 190, 420, 110, 150), '#ffd77a', 4);
  for (const [x, h] of [[100, 420], [1330, 380], [1500, 460]] as Pt[]) {
    poly(c, rect(x - 10, 660 - h, 20, h), WOOD, 4);
    for (let k = 0; k < 6; k++) {
      const a = Math.PI * (1.1 + k * 0.17);
      poly(c, [[x, 660 - h], [x + Math.cos(a) * 130, 660 - h + Math.sin(a) * 60 + 40], [x + Math.cos(a) * 120, 660 - h + Math.sin(a) * 60 + 64]], GREEN_DARK, 3);
    }
  }
  poly(c, rect(0, 660, W, H - 660), '#26232a', 5);
  for (const [x, color] of [[300, RED], [700, BLUE], [1050, WHITE]] as [number, string][]) {
    poly(c, [[x, 760], [x + 40, 710], [x + 210, 710], [x + 250, 760], [x + 250, 800], [x, 800]], color, 5);
    for (const wx of [x + 50, x + 200]) oval(c, wx, 800, 22, 22, INK, 0);
  }
  poly(c, rect(1260, 590, 160, 90), GREEN, 5);
}

const BACKDROP: Record<SetId, (c: Ctx, beat: string) => void> = {
  street: streetScene,
  tailor: tailorScene,
  hall: hallScene,
  stage: stageScene,
  doors: doorsScene,
  dark: darkScene,
  yard: yardScene,
  book: bookScene,
  night: nightScene,
};

//the green-white-green frame round every board, with a bolt in each corner
let frameCanvas: HTMLCanvasElement | undefined;
function frame() {
  if (frameCanvas) return frameCanvas;
  const [el, c] = canvas2d(W, H);
  c.fillStyle = GREEN;
  c.fillRect(0, 0, W, H);
  c.clearRect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);
  c.lineWidth = 10;
  c.strokeStyle = WHITE;
  c.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, H - BORDER);
  c.lineWidth = 5;
  c.strokeStyle = INK;
  c.strokeRect(BORDER - 2, BORDER - 2, W - BORDER * 2 + 4, H - BORDER * 2 + 4);
  c.strokeRect(2, 2, W - 4, H - 4);
  for (const [x, y] of [[BORDER / 2, BORDER / 2], [W - BORDER / 2, BORDER / 2], [BORDER / 2, H - BORDER / 2], [W - BORDER / 2, H - BORDER / 2]] as Pt[]) {
    oval(c, x, y, 9, 9, '#b9b2a2', 3);
  }
  frameCanvas = el;
  return el;
}

//each board is painted once, the first time its cue comes up
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(cue: Cue) {
  const key = `${cue.set}:${cue.beat}`;
  if (!backdrops.has(key)) {
    const [el, c] = canvas2d(W, H);
    BACKDROP[cue.set](c, cue.beat);
    backdrops.set(key, el);
  }
  return backdrops.get(key)!;
}

// ---------------------------------------------------------------------------
// the live layer
// ---------------------------------------------------------------------------

function glow(c: Ctx, x: number, y: number, r: number, color: string, strength: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('ALPHA', String(strength)));
  g.addColorStop(1, color.replace('ALPHA', '0'));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function bulbs(c: Ctx, t: number, bright = 1) {
  c.beginPath();
  BULBS.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.lineWidth = 2;
  c.strokeStyle = INK;
  c.stroke();
  BULBS.forEach(([x, y], i) => {
    const on = 0.7 + 0.3 * Math.sin(t * 3 + i * 1.7);
    glow(c, x, y + 8, 26, 'rgba(255,214,120,ALPHA)', 0.5 * on * bright);
    oval(c, x, y + 8, 7, 9, i % 3 ? '#ffe39a' : '#fff2c9', 2);
  });
}

//the dance floor: the couple in the middle, everyone else bobbing round them
function dancers(c: Ctx, t: number, beat: string) {
  const crowd: Guest[] = [];
  for (let k = 0; k < 9; k++) {
    const x = 330 + k * 118 + (k % 2) * 20;
    crowd.push(guest(k + 4, x, 640 + (k % 2) * 30, 0.85, k % 3 === 0 ? 'up' : k % 3 === 1 ? 'wave' : 'hips'));
  }
  const front = [guest(1, 420, 860, 1.2, 'up'), guest(6, 1180, 860, 1.2, 'wave')];
  const couple: Guest[] = beat === 'grandma' ? [] : [
    { ...TOLU, x: 730, y: 760, s: 1.15, arms: beat === 'entrance' ? 'up' : 'wave' },
    { ...EMEKA, x: 880, y: 760, s: 1.15, arms: 'up' },
  ];
  [...crowd, ...couple, ...front].forEach((g, i) => {
    const bob = Math.abs(Math.sin(t * 4.2 + i * 0.9)) * 12 * g.s;
    const sway = Math.sin(t * 2.1 + i) * 6 * g.s;
    person(c, { ...g, x: g.x + sway, y: g.y - bob });
  });
  if (beat === 'grandma') {
    const bob = Math.abs(Math.sin(t * 3.4)) * 14;
    person(c, { ...GRANDMA, x: 800, y: 980 - bob, s: 2.2, arms: 'wave' });
    //her fan of notes
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI * 0.85 + k * 0.12 + Math.sin(t * 3) * 0.05;
      c.save();
      c.translate(900, 440 - bob);
      c.rotate(a + Math.PI / 2);
      poly(c, rect(-16, -70, 32, 70), k % 2 ? '#7fb069' : '#d98fa0', 2.5);
      c.restore();
    }
  }
}

function naira(c: Ctx, t: number, n: number, x0: number, x1: number) {
  for (let i = 0; i < n; i++) {
    const fall = (t * (0.12 + rand(i) * 0.1) + rand(i + 50)) % 1;
    const x = x0 + rand(i + 9) * (x1 - x0) + Math.sin(t * 2 + i) * 30;
    const y = -40 + fall * (H + 40);
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(t * 3 + i) * 0.9);
    poly(c, rect(-22, -10, 44, 20), i % 3 ? '#7fb069' : '#d98fa0', 2);
    c.restore();
  }
}

function drawLive(c: Ctx, { set, beat }: Cue, t: number) {
  if (set === 'street') {
    //a danfo crawling through the morning traffic
    const x = ((t * 70) % (W + 500)) - 420;
    danfo(c, x, 760);
  }
  if (set === 'tailor' && beat === 'shop') {
    c.font = `40px ${SIGN}`;
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.25 + i / 4) % 1;
      c.globalAlpha = 1 - p;
      letter(c, i % 2 ? '♪' : '♫', 1340 + Math.sin(t + i * 2) * 30, 260 - p * 200, 40, YELLOW);
    }
    c.globalAlpha = 1;
  }
  if (set === 'hall') {
    if (DANCING.has(beat)) dancers(c, t, beat);
    if (beat === 'spray' || beat === 'grandma' || beat === 'back') naira(c, t, beat === 'spray' ? 30 : 16, 400, 1200);
    bulbs(c, t, beat === 'back' ? 1.6 : 1);
  }
  if (set === 'stage') bulbs(c, t, 0.7);
  if (set === 'dark') {
    if (beat === 'phones') {
      for (let i = 0; i < 46; i++) {
        const x = 80 + rand(i) * 1440 + Math.sin(t * 1.4 + i) * 22;
        const y = 380 + rand(i + 3) * 420;
        glow(c, x, y, 50, 'rgba(220,235,255,ALPHA)', 0.35);
        poly(c, rect(x - 5, y - 9, 10, 18), '#e8f1ff', 0);
      }
    }
    if (beat === 'candles') {
      for (let i = 0; i < 18; i++) {
        const x = 120 + (i % 9) * 170 + rand(i) * 40;
        const y = 560 + Math.floor(i / 9) * 160;
        const f = 0.8 + 0.2 * Math.sin(t * 9 + i * 3) * Math.sin(t * 5.3 + i);
        glow(c, x, y - 30, 110, 'rgba(255,190,90,ALPHA)', 0.4 * f);
        poly(c, rect(x - 6, y - 20, 12, 28), CREAM, 2);
        oval(c, x, y - 30, 5, 10 * f, '#ffd36a', 0);
      }
    }
  }
  if (set === 'yard') {
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.3 + i / 6) % 1;
      c.globalAlpha = 0.5 * (1 - p);
      oval(c, 1043 + Math.sin(t + i) * 20 + p * 40, 400 - p * 300, 20 + p * 50, 16 + p * 40, '#8a8a92', 0);
    }
    c.globalAlpha = 1;
  }
  if (set === 'night') {
    for (let i = 0; i < 40; i++) {
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.2 + i * 2.3));
      oval(c, rand(i) * W, rand(i + 7) * 260, 2.5, 2.5, CREAM, 0);
    }
    c.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.25 + i / 4) % 1;
      c.globalAlpha = 0.4 * (1 - p);
      oval(c, 1400 + p * 30, 580 - p * 200, 14 + p * 30, 12 + p * 24, '#8a8a92', 0);
    }
    c.globalAlpha = 1;
  }
}

function drawPanel(c: Ctx, cue: Cue, t: number) {
  c.drawImage(backdrop(cue), 0, 0);
  drawLive(c, cue, t);
  c.drawImage(frame(), 0, 0);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  crowd: new URL('./sounds/crowd.m4a', import.meta.url).href,
  music: new URL('./sounds/music.m4a', import.meta.url).href,
  generator: new URL('./sounds/generator.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'street') return { street: beat === 'title' ? 0.35 : 0.55 };
  if (set === 'tailor') return { street: 0.25, music: 0.15 };
  if (set === 'hall') return { crowd: beat === 'wide' || beat === 'food' ? 0.5 : 0.35, music: DANCING.has(beat) ? 0.75 : 0.4 };
  if (set === 'stage') return { crowd: beat === 'you' ? 0.15 : 0.4, music: 0.25 };
  if (set === 'doors') return { music: 0.2, crowd: 0.2 };
  if (set === 'dark') return { crowd: beat === 'dark' ? 0.15 : 0.3 };
  if (set === 'yard') return { street: 0.3 };
  if (set === 'book') return { crowd: 0.2, music: 0.3, generator: 0.1 };
  return { street: beat === 'end' ? 0.2 : 0.35, generator: 0.25, music: beat === 'end' ? 0 : 0.12 };
}

const CHEER: OneShot = { src: new URL('./sounds/cheer.m4a', import.meta.url).href, volume: 0.6, delay: 0.3 };
const ONE_SHOTS: Record<string, OneShot> = {
  lagos_morning: { src: new URL('./sounds/horn.m4a', import.meta.url).href, volume: 0.4, delay: 0.8 },
  entrance: CHEER,
  lights_back: CHEER,
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.2; //seconds, short so the power cut is sudden

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function Signboard({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Signboard has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active] });
  const sound = useRef<Soundscape<Bed> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      if (el.width !== Math.round(sw * dpr) || el.height !== Math.round(sh * dpr)) {
        el.width = Math.round(sw * dpr);
        el.height = Math.round(sh * dpr);
      }
      const { cue, at, prev } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      if (prev.set !== cue.set && since < SWAP) {
        //the new board slides in from the right over the old one
        const x = W * (1 - ease(since / SWAP));
        drawPanel(c, prev, t);
        c.save();
        c.translate(x, 0);
        c.fillStyle = 'rgba(27,20,16,0.35)';
        c.fillRect(-24, 0, 24, H);
        drawPanel(c, cue, t);
        c.restore();
      } else {
        if (prev !== cue && prev.set === cue.set && since < BEAT_FADE) {
          drawPanel(c, prev, t);
          c.globalAlpha = ease(since / BEAT_FADE);
        }
        drawPanel(c, cue, t);
        c.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const next = cues[active];
    shown.current = { cue: next, at: now, prev: shown.current.cue };
    sound.current?.mix(mixFor(next));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const card = cues[active].card;
  return (
    <div style={styles.scene}>
      <canvas ref={canvas} style={styles.canvas} />
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

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: NIGHT,
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 260,
    fontFamily: SIGN,
    color: INK,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 4,
    textTransform: 'uppercase',
    padding: '6px 22px',
    background: YELLOW,
    border: `4px solid ${INK}`,
    boxShadow: `5px 5px 0 ${INK}`,
  },
  name: {
    fontSize: 92,
    padding: '4px 44px 10px',
    color: WHITE,
    background: GREEN,
    border: `6px solid ${INK}`,
    boxShadow: `8px 8px 0 ${INK}`,
    textShadow: `4px 4px 0 ${INK}`,
    outline: `4px solid ${WHITE}`,
    outlineOffset: -14,
  },
};

export default Signboard;
