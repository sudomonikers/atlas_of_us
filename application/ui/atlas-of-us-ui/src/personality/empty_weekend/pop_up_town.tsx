import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Pop-Up Town is a children's pop-up book lying open on a table, drawn on a 2D canvas. Each spread is a printed
// page with flaps of card standing up from it, every flap cut from a few flat colours with a pale cut edge, a fleck of
// paper grain and a hard shadow on whatever stands behind it. Flaps fold flat around the line they're glued along.
// When the set changes the flaps fold down, the page turns, and the new flaps spring up, back to front. Pages and
// flaps are painted once per beat and kept; the cast, waves, wheels and weather move live on their flaps.
// Night and weather tint the card, while lamps and lit windows are painted after the tint so they still glow.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const GUTTER = W / 2;
const PAGE: [number, number, number, number] = [40, 30, 1520, 842]; //x, y, w, h of the open pages
const FOLD = 0.4; //seconds for the old flaps to fold flat
const TURN = 0.7; //seconds for the page to turn
const POP = 0.55; //seconds for each new flap to spring up
const STAGGER = 0.1; //seconds between flaps, back to front
const FADE = 0.35; //seconds to cross between beats on the same spread
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
type Tint = [string, number];
type Paint = (c: Ctx) => void;
type Live = (c: Ctx, t: number) => void;

const INK = '#2d2a32';
const TABLE = '#4a3226';
const CREAM = '#f5ecd7';
const EDGE = 'rgba(255,251,240,0.85)';
const SHADOW = 'rgba(70,45,25,0.28)';
const WHITE = '#fbf7ec';
const TEAL = '#3f7f86';
const COVER = '#24585c';
const SEA = '#5d9fb0';
const FOAM = '#e9f2ee';
const SAND = '#e8cd96';
const GRASS = '#93b56c';
const MOSS = '#5e8a50';
const GORSE = '#e9c13f';
const RED = '#d4553f';
const CORAL = '#ee8b6a';
const MUSTARD = '#e8b443';
const PINK = '#f1b3a5';
const BROWN = '#7b5337';
const WOOD = '#b07c4f';
const STONE = '#bdb4a3';
const SLATE = '#5b6378';
const SKIN = '#f2c7a1';
const GREY = '#a5abb0';
const PURPLE = '#7d5f8e';
const NAVY = '#2f3f5c';
const LEMON = '#f3d548';
const GOLD = '#d9ae4f';
const LIT = '#ffd98a';
const BRASS = '#c9a24a';
const SHOE = '#3a2d2a';

const SERIF = 'Georgia, "Times New Roman", serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'cover' | 'harbour' | 'room' | 'map' | 'cliff' | 'hall' | 'bookshop' | 'pub' | 'notebook' | 'pier';

interface Cue {
  set: SetId;
  beat?: string;
  x?: number; //what to keep in frame when the screen is narrower than the scene
}

const cues: Record<string, Cue> = {
  title_card: { set: 'cover', x: 1190 },
  the_end: { set: 'cover', beat: 'end', x: 1190 },
  arrival: { set: 'harbour', beat: 'train', x: 450 },
  harbour: { set: 'harbour', x: 700 },
  gull: { set: 'harbour', beat: 'gull', x: 720 },
  phone_drop: { set: 'harbour', beat: 'drop', x: 740 },
  phone_gone: { set: 'harbour', beat: 'gone', x: 760 },
  regatta: { set: 'harbour', beat: 'regatta', x: 760 },
  rain: { set: 'harbour', beat: 'rain', x: 760 },
  night_beach: { set: 'harbour', beat: 'beach', x: 900 },
  monday: { set: 'harbour', beat: 'dawn', x: 450 },
  room: { set: 'room', beat: 'landlady', x: 450 },
  room_night: { set: 'room', beat: 'night', x: 950 },
  room_morning: { set: 'room', beat: 'morning', x: 1000 },
  lie_in: { set: 'room', beat: 'lie_in', x: 950 },
  sunday: { set: 'room', beat: 'sunday', x: 950 },
  night_in: { set: 'room', beat: 'night_in', x: 1100 },
  packed: { set: 'room', beat: 'packed', x: 800 },
  clock: { set: 'room', beat: 'packed', x: 800 },
  map: { set: 'map' },
  cliff: { set: 'cliff', x: 900 },
  painting: { set: 'hall' },
  painting_teacher: { set: 'hall', beat: 'teacher', x: 900 },
  bookshop: { set: 'bookshop', x: 800 },
  agnes: { set: 'bookshop', beat: 'agnes', x: 1100 },
  reading: { set: 'bookshop', beat: 'reading', x: 500 },
  quiz_win: { set: 'pub', beat: 'win', x: 800 },
  quiz_company: { set: 'pub', beat: 'company', x: 800 },
  notebook: { set: 'notebook' },
  my_list: { set: 'notebook', beat: 'list', x: 1000 },
  pier: { set: 'pier', x: 820 },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// card and print
// ---------------------------------------------------------------------------

//a fixed per-index random, so layouts come out the same every time
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - (1 - clamp(x)) ** 3;
const spring = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2);

function canvas2d(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return [el, el.getContext('2d')!];
}

function poly(pts: Pt[]) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}
function oval(x: number, y: number, rx: number, ry = rx, turn = 0) {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2);
  return p;
}
function box(x: number, y: number, w: number, h: number, r = 0) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
//several shapes cut as one piece of card
function join(...parts: Path2D[]) {
  const p = new Path2D();
  parts.forEach((q) => p.addPath(q));
  return p;
}
//a hill or a beach: a smooth top edge filled down to the bottom
function ground(top: Pt[], bottom: number) {
  const p = new Path2D();
  p.moveTo(top[0][0], bottom);
  p.lineTo(...top[0]);
  for (let i = 1; i < top.length - 1; i++) {
    p.quadraticCurveTo(top[i][0], top[i][1], (top[i][0] + top[i + 1][0]) / 2, (top[i][1] + top[i + 1][1]) / 2);
  }
  p.lineTo(...top[top.length - 1]);
  p.lineTo(top[top.length - 1][0], bottom);
  p.closePath();
  return p;
}
//a strip of sea with pointed crests
function waves(x0: number, x1: number, y: number, amp: number, len: number, phase: number, bottom: number) {
  const p = new Path2D();
  p.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += 8) p.lineTo(x, y + Math.abs(Math.sin((x / len) * Math.PI + phase)) * amp);
  p.lineTo(x1, bottom);
  p.closePath();
  return p;
}

let grain: HTMLCanvasElement | undefined;
const patterns = new WeakMap<Ctx, CanvasPattern>();
function grainOf(c: Ctx) {
  grain ??= (() => {
    const [el, g] = canvas2d(160, 160);
    const img = g.createImageData(160, 160);
    for (let i = 0; i < 160 * 160; i++) {
      const light = rand(i) > 0.5;
      img.data.set(light ? [255, 252, 240] : [90, 60, 30], i * 4);
      img.data[i * 4 + 3] = rand(i + 0.5) * 26;
    }
    g.putImageData(img, 0, 0);
    return el;
  })();
  if (!patterns.has(c)) patterns.set(c, c.createPattern(grain, 'repeat')!);
  return patterns.get(c)!;
}

//a piece of card: its shadow on whatever is behind, the colour, the grain, and the pale cut edge
function cut(c: Ctx, p: Path2D, fill: string, lift = 1) {
  if (lift) {
    c.save();
    c.translate(4 * lift, 6 * lift);
    c.fillStyle = SHADOW;
    c.fill(p);
    c.restore();
  }
  c.fillStyle = fill;
  c.fill(p);
  c.fillStyle = grainOf(c);
  c.fill(p);
  c.lineWidth = 1.5;
  c.strokeStyle = EDGE;
  c.stroke(p);
}
//ink printed onto the card
function print(c: Ctx, p: Path2D, fill: string) {
  c.fillStyle = fill;
  c.fill(p);
}
function line(c: Ctx, pts: Pt[], width: number, color: string, dash: number[] = []) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.setLineDash(dash);
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = color;
  c.stroke();
  c.setLineDash([]);
}
function write(c: Ctx, text: string, x: number, y: number, size: number, color: string, font = HAND, turn = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.font = `${size}px ${font}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}
function tintOver(c: Ctx, [color, alpha]: Tint) {
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(0, 0, W, H);
  c.restore();
}
//light that only adds, for lamps and sunbeams
function light(c: Ctx, x: number, y: number, r: number, color: string) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}
//sky or water in soft horizontal bands, the way a printed backdrop is laid
function bands(c: Ctx, colors: string[], y0: number, y1: number, phase = 0) {
  const step = (y1 - y0) / colors.length;
  colors.forEach((color, i) => print(c, waves(0, W, y0 + i * step - 6, 6, 260, phase + i, y1), color));
}

// ---------------------------------------------------------------------------
// the book on the table
// ---------------------------------------------------------------------------

let table: HTMLCanvasElement | undefined;
function makeTable() {
  const [el, c] = canvas2d(W, H);
  c.fillStyle = TABLE;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const y = rand(i) * H;
    line(c, [[0, y], [W * 0.3, y + 6], [W * 0.7, y - 4], [W, y + 3]], 1 + rand(i + 1) * 2, `rgba(20,10,5,${0.12 + rand(i + 2) * 0.15})`);
  }
  for (let y = 150; y < H; y += 225) line(c, [[0, y], [W, y]], 3, 'rgba(15,8,4,0.5)');
  return el;
}

//the open book: cloth boards, the stack of pages at the edges, and the paper
function book(c: Ctx) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,0.45)';
  c.shadowBlur = 30;
  c.shadowOffsetY = 12;
  print(c, box(20, 14, W - 40, H - 28, 10), COVER);
  c.restore();
  for (let i = 0; i < 4; i++) print(c, box(30 - i * 2 + 4, 24 + i, W - 60 + i * 4 - 8, H - 48 - i * 2, 4), i % 2 ? '#e2d7bf' : '#efe5cf');
  print(c, box(...PAGE), CREAM);
  c.fillStyle = grainOf(c);
  c.fillRect(...PAGE);
}
function gutter(c: Ctx) {
  const g = c.createLinearGradient(GUTTER - 70, 0, GUTTER + 70, 0);
  g.addColorStop(0, 'rgba(80,55,30,0)');
  g.addColorStop(0.5, 'rgba(80,55,30,0.3)');
  g.addColorStop(1, 'rgba(80,55,30,0)');
  c.fillStyle = g;
  c.fillRect(GUTTER - 70, PAGE[1], 140, PAGE[3]);
}
//a printed page: the set's backdrop on the paper, kept inside the page
const spreadPage =
  (backdrop: Paint): Paint =>
  (c) => {
    book(c);
    c.save();
    c.beginPath();
    c.rect(...PAGE);
    c.clip();
    backdrop(c);
    c.restore();
    gutter(c);
  };

// ---------------------------------------------------------------------------
// the cast: paper dolls with brass pins at the shoulders
// ---------------------------------------------------------------------------

interface Look {
  coat: string;
  skin: string;
  hair: string;
  legs: string;
  style: 'short' | 'bun' | 'long' | 'cap' | 'bald';
  scarf?: string;
  beard?: string;
  glasses?: boolean;
  apron?: boolean;
  wide?: number;
}

interface Pose {
  arms?: [number, number]; //right and left arm, radians out from hanging straight down
  sit?: boolean;
  talk?: boolean;
  shut?: boolean; //eyes
  hold?: [Paint?, Paint?]; //drawn in each hand, turning with the arm
}

const YOU: Look = { coat: TEAL, skin: SKIN, hair: BROWN, legs: NAVY, scarf: MUSTARD, style: 'short' };
const PENHALLOW: Look = { coat: RED, skin: '#f0c09a', hair: '#ddd8d0', legs: '#7a4038', style: 'bun', apron: true, wide: 1.35 };
const AGNES: Look = { coat: PURPLE, skin: '#eec3a2', hair: '#d4cfc8', legs: '#4a3f55', style: 'long', glasses: true };
const BLIGH: Look = { coat: MUSTARD, skin: '#e9b28e', hair: '#8b6a4f', legs: BROWN, style: 'bald', beard: '#8b6a4f' };

//a passer-by, the same for the same number
function extra(i: number): Look {
  const pick = <T,>(xs: T[], k: number) => xs[Math.floor(rand(i * 7 + k) * xs.length)];
  return {
    coat: pick([CORAL, MUSTARD, SEA, PINK, MOSS, RED, PURPLE, '#e7d9b6'], 1),
    skin: pick([SKIN, '#d9a27c', '#a8704c', '#f5d2b5', '#7c4f36'], 2),
    hair: pick([BROWN, INK, '#c9773e', '#e8d39a', GREY], 3),
    legs: pick([NAVY, SLATE, BROWN, INK], 4),
    style: pick(['short', 'bun', 'long', 'cap', 'bald'] as const, 5),
    wide: 0.9 + rand(i * 7 + 6) * 0.4,
  };
}

//standing with the feet at x, y. The doll is about 255 tall at scale 1
function person(c: Ctx, x: number, y: number, s: number, look: Look, pose: Pose = {}) {
  const w = look.wide ?? 1;
  c.save();
  c.translate(x, y);
  c.scale(s, Math.abs(s));
  const hip = pose.sit ? -88 : -72;
  if (pose.sit) {
    cut(c, box(-34, -100, 96, 26, 12), look.legs, 0.5);
    cut(c, box(-14, -98, 96, 24, 12), look.legs, 0.5);
    cut(c, box(58, -96, 22, 92, 8), look.legs, 0.5);
    cut(c, oval(78, -4, 18, 8), SHOE, 0.3);
  } else {
    for (const side of [-1, 1]) {
      cut(c, box(side * 15 - 11, -80, 22, 78, 8), look.legs, 0.5);
      cut(c, oval(side * 17, -4, 16, 8), SHOE, 0.3);
    }
  }
  cut(c, poly([[-30 * w, hip - 108], [30 * w, hip - 108], [44 * w, hip + 6], [-44 * w, hip + 6]]), look.coat);
  if (look.apron) print(c, poly([[-24 * w, hip - 70], [24 * w, hip - 70], [32 * w, hip + 4], [-32 * w, hip + 4]]), WHITE);
  print(c, box(-3, hip - 100, 6, 80), 'rgba(0,0,0,0.08)');
  //the head
  const hy = hip - 145;
  cut(c, box(-10, hy + 20, 20, 24), look.skin, 0.3);
  if (look.style === 'long') cut(c, box(-40, hy - 30, 80, 92, 34), look.hair, 0.5);
  cut(c, oval(0, hy, 33, 36), look.skin);
  if (look.style === 'short') cut(c, join(oval(0, hy - 22, 34, 20), oval(-24, hy - 10, 12, 16)), look.hair, 0.3);
  if (look.style === 'bun') cut(c, join(oval(0, hy - 24, 32, 16), oval(0, hy - 48, 16)), look.hair, 0.3);
  if (look.style === 'long') cut(c, oval(0, hy - 24, 34, 18), look.hair, 0.2);
  if (look.style === 'cap') cut(c, join(oval(0, hy - 24, 34, 16), box(-6, hy - 26, 50, 10, 5)), look.hair, 0.3);
  if (look.beard) cut(c, join(oval(0, hy + 22, 30, 22), oval(0, hy + 6, 30, 8)), look.beard, 0.3);
  const eyes = pose.shut ? (ex: number) => line(c, [[ex - 6, hy - 2], [ex + 6, hy - 2]], 3, INK) : (ex: number) => print(c, oval(ex, hy - 3, 4.5), INK);
  eyes(-12);
  eyes(12);
  if (look.glasses) for (const ex of [-12, 12]) line(c, [[ex + 10, hy - 3], ...Array.from({ length: 13 }, (_, i): Pt => [ex + Math.cos((i / 12) * Math.PI * 2) * 10, hy - 3 + Math.sin((i / 12) * Math.PI * 2) * 10])], 2, INK);
  print(c, oval(-20, hy + 10, 7, 5), 'rgba(230,110,100,0.35)');
  print(c, oval(20, hy + 10, 7, 5), 'rgba(230,110,100,0.35)');
  if (pose.talk) print(c, oval(0, hy + 16, 7, 6), '#8a3a34');
  else if (!look.beard) line(c, [[-7, hy + 14], [0, hy + 18], [7, hy + 14]], 2.5, INK);
  if (look.scarf) cut(c, join(box(-26, hy + 32, 52, 16, 8), box(8, hy + 40, 16, 50, 6)), look.scarf, 0.4);
  //the arms, pinned at the shoulders
  const [right, left] = pose.arms ?? [0.12, 0.12];
  ([[-1, right, pose.hold?.[0]], [1, left, pose.hold?.[1]]] as const).forEach(([side, angle, held]) => {
    c.save();
    c.translate(side * 30 * w, hip - 98);
    c.rotate(-side * angle);
    cut(c, box(-9, 0, 18, 78, 9), look.coat, 0.5);
    cut(c, oval(0, 84, 10), look.skin, 0.3);
    if (held) {
      c.translate(0, 86);
      held(c);
    }
    c.restore();
    print(c, oval(side * 30 * w, hip - 92, 4), BRASS);
  });
  c.restore();
}

//lying down with the head to the right, the feet at x, y
function lying(c: Ctx, x: number, y: number, s: number, pose: Pose = {}) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.PI / 2);
  person(c, 0, 0, s, YOU, pose);
  c.restore();
}

function gull(c: Ctx, x: number, y: number, s: number, flap: number, dir = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  if (!flap) for (const lx of [-6, 6]) line(c, [[lx, 12], [lx, 30]], 3, MUSTARD);
  cut(c, poly([[-26, -4], [-58, -14], [-54, 8]]), WHITE, 0.5);
  print(c, poly([[-50, -12], [-58, -14], [-55, 6]]), INK);
  cut(c, oval(0, 0, 34, 17), WHITE, 0.5);
  cut(c, oval(28, -16, 14), WHITE, 0.4);
  print(c, poly([[38, -18], [60, -12], [38, -9]]), MUSTARD);
  print(c, oval(32, -20, 2.8), INK);
  c.translate(-4, -6);
  c.rotate(-0.4 - flap * 0.9);
  cut(c, poly([[0, 0], [-6, -50], [-44, -30], [-30, -2]]), GREY, 0.5);
  print(c, poly([[-6, -50], [-20, -42], [-12, -30]]), INK);
  c.restore();
}

function sheep(c: Ctx, x: number, y: number, s: number, dir = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  for (const lx of [-20, -8, 12, 22]) cut(c, box(lx, -18, 7, 22, 3), INK, 0.3);
  cut(c, join(...Array.from({ length: 9 }, (_, i) => oval(Math.cos(i * 0.7) * 28, -36 + Math.sin(i * 0.7) * 14, 15))), WHITE);
  cut(c, oval(40, -40, 11, 15, -0.4), INK, 0.4);
  c.restore();
}

//a pane of glass in a lamp or a window, painted after the tint so it glows
const glowBox = (c: Ctx, x: number, y: number, w: number, h: number) => {
  print(c, box(x, y, w, h, 2), LIT);
  light(c, x + w / 2, y + h / 2, Math.max(w, h) * 1.6, 'rgba(255,200,110,0.35)');
};

function house(c: Ctx, [x, base, w, h, wall, roof]: House) {
  cut(c, poly([[x, base], [x, base - h], [x + w, base - h], [x + w, base]]), wall, 0.6);
  cut(c, poly([[x - 6, base - h + 6], [x + w / 2, base - h - w * 0.4], [x + w + 6, base - h + 6]]), roof, 0.5);
  print(c, box(x + w / 2 - 7, base - 22, 14, 22, 3), BROWN);
}
type House = [number, number, number, number, string, string];
const windowsOf = ([x, base, w, h]: House): [number, number][] => [[x + w * 0.18, base - h * 0.75], [x + w * 0.62, base - h * 0.75]];

function boat(c: Ctx, x: number, y: number, s: number, hull: string, sail: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  cut(c, poly([[4, -10], [4, -110], [64, -14]]), sail, 0.5);
  cut(c, poly([[-4, -16], [-4, -96], [-50, -16]]), WHITE, 0.5);
  line(c, [[0, -12], [0, -118]], 4, BROWN);
  cut(c, poly([[-70, -14], [72, -14], [52, 12], [-54, 12]]), hull, 0.5);
  c.restore();
}

function bathtub(c: Ctx, x: number, y: number, s: number, look: Look, flag: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  line(c, [[30, -40], [30, -120]], 3, BROWN);
  cut(c, poly([[30, -118], [72, -106], [30, -94]]), flag, 0.4);
  person(c, -4, 10, 0.5, look, { arms: [2.4, 0.6] });
  cut(c, join(box(-70, -32, 140, 44, 22), oval(-70, -32, 10, 6), oval(70, -32, 10, 6)), WHITE, 0.6);
  print(c, box(-70, -26, 140, 6), 'rgba(90,120,140,0.25)');
  c.restore();
}

// ---------------------------------------------------------------------------
// the spreads
// ---------------------------------------------------------------------------

interface Layer {
  base: number; //the line the flap is glued along, and folds flat around
  key?: string; //the flap is painted once per key, which defaults to the spread's
  paint?: Paint;
  glow?: Paint; //painted after the tint, for lamps and lit windows
  live?: Live;
}

interface Spread {
  key?: string; //defaults to the beat
  page: Paint;
  layers: Layer[];
  tint?: Tint;
  after?: Live; //over everything once the flaps are up: weather and light
}

// --- the harbour --------------------------------------------------------------

type Time = 'dusk' | 'day' | 'rain' | 'night' | 'dawn';
const TIMES: Record<Time, { sky: string[]; sea: [string, string]; tint?: Tint }> = {
  dusk: { sky: ['#6f6a9a', '#b47c9a', '#e9967a', '#f6c27a'], sea: ['#6a87a3', '#86a1b5'], tint: ['#8a4a70', 0.16] },
  day: { sky: ['#8fc3d6', '#a9d2df', '#c6e2e6', '#e3efe9'], sea: [SEA, '#86c0c0'] },
  rain: { sky: ['#6d7b85', '#7f8c94', '#94a0a6', '#a9b3b6'], sea: ['#6b7f86', '#86979b'], tint: ['#4e5d66', 0.3] },
  night: { sky: ['#1d2440', '#26305a', '#303d6c', '#3b4a7a'], sea: ['#2b3c62', '#3e5280'], tint: ['#1b2550', 0.55] },
  dawn: { sky: ['#a5a9c9', '#e3b6b8', '#f6d0a8', '#fbe6bf'], sea: ['#8ea6bd', '#b5c3cf'], tint: ['#c78f8f', 0.12] },
};
const timeOf = (beat: string): Time =>
  beat === 'regatta' ? 'day' : beat === 'rain' ? 'rain' : beat === 'beach' ? 'night' : beat === 'dawn' ? 'dawn' : 'dusk';

const HOUSES: House[] = [
  [70, 300, 64, 54, CORAL, NAVY],
  [160, 272, 58, 52, WHITE, RED],
  [244, 266, 66, 58, '#9cc5c1', BROWN],
  [336, 276, 60, 50, MUSTARD, SLATE],
  [440, 312, 64, 54, PINK, NAVY],
  [546, 350, 56, 46, WHITE, RED],
];
const TRACK = 410;

function train(c: Ctx, front: number, t: number, moving: boolean) {
  c.save();
  c.beginPath();
  c.rect(...PAGE);
  c.clip();
  for (let i = 0; i < 2; i++) {
    const x = front - 120 - i * 92;
    cut(c, box(x - 80, TRACK - 44, 84, 36, 4), MUSTARD, 0.5);
    for (let k = 0; k < 3; k++) print(c, box(x - 70 + k * 26, TRACK - 38, 16, 14, 2), LIT);
    for (const wx of [x - 64, x - 12]) cut(c, oval(wx, TRACK - 6, 8), INK, 0.3);
  }
  cut(c, join(box(front - 118, TRACK - 40, 100, 32, 6), box(front - 118, TRACK - 64, 40, 30, 3), box(front - 40, TRACK - 64, 12, 26, 2)), RED, 0.5);
  for (const wx of [front - 100, front - 64, front - 30]) cut(c, oval(wx, TRACK - 6, 10), INK, 0.3);
  if (moving) for (let i = 0; i < 4; i++) {
    const u = (t * 0.8 + i / 4) % 1;
    cut(c, oval(front - 34 - u * 60, TRACK - 76 - u * 60, 10 + u * 16), 'rgba(250,247,236,0.9)', 0);
  }
  c.restore();
}

function harbour(beat: string): Spread {
  const time = timeOf(beat);
  const { sky, sea, tint } = TIMES[time];
  const dark = time !== 'day';
  const lit = time === 'night' || time === 'dusk' || time === 'rain';
  return {
    key: time,
    tint,
    page: spreadPage((c) => {
      bands(c, sky, 30, 470);
      if (time === 'night') {
        for (let i = 0; i < 60; i++) print(c, oval(rand(i) * W, 40 + rand(i + 1) * 300, 1.5 + rand(i + 2) * 2), '#f3ecd0');
        print(c, oval(1150, 150, 44), '#f3ecd0');
      } else print(c, oval(time === 'dusk' ? 980 : 300, time === 'day' ? 140 : 400, time === 'day' ? 50 : 80), time === 'day' ? '#fff1b8' : '#fbe3a1');
      if (time === 'day' || time === 'dusk') for (const [x, y] of [[500, 120], [1250, 90], [880, 210]]) print(c, join(oval(x, y, 60, 18), oval(x + 30, y - 12, 34, 20), oval(x - 34, y - 6, 26, 14)), 'rgba(255,250,240,0.6)');
      bands(c, [sea[1], sea[0]], 430, H, 2);
      if (time === 'night') for (let i = 0; i < 9; i++) print(c, box(1100 + rand(i) * 100 - i * 4, 450 + i * 14, 60 + rand(i + 3) * 60, 3), 'rgba(243,236,208,0.6)');
    }),
    layers: [
      {
        //the hills: the town and the station on the left, the lighthouse on the cliff to the right
        base: 460,
        paint: (c) => {
          cut(c, ground([[40, 250], [200, 215], [380, 225], [540, 290], [680, 380], [790, 460]], 460), GRASS);
          print(c, box(40, TRACK, 470, 14), STONE);
          line(c, [[40, TRACK], [500, TRACK]], 3, SLATE);
          HOUSES.forEach((h) => house(c, h));
          cut(c, join(box(380, TRACK - 52, 86, 52), poly([[372, TRACK - 50], [423, TRACK - 78], [474, TRACK - 50]])), WHITE, 0.5);
          write(c, 'GULLHAVEN', 423, TRACK - 30, 13, INK, SERIF);
          cut(c, ground([[1060, 460], [1160, 390], [1250, 300], [1380, 255], [1560, 245]], 460), '#8fae6a');
          print(c, poly([[1060, 460], [1160, 390], [1215, 340], [1240, 460]]), STONE);
          cut(c, poly([[1420, 252], [1428, 120], [1452, 120], [1460, 252]]), WHITE, 0.6);
          for (const y of [150, 200]) print(c, poly([[1424, y + 22], [1427, y], [1453, y], [1456, y + 22]]), RED);
          cut(c, join(box(1416, 114, 48, 8), poly([[1424, 96], [1440, 76], [1456, 96]])), RED, 0.4);
          print(c, box(1428, 96, 24, 18), dark ? INK : '#cfe3e8');
        },
        glow: (c) => {
          if (!lit) return;
          HOUSES.forEach((h, i) => windowsOf(h).forEach(([x, y], k) => rand(i * 3 + k) > 0.3 && glowBox(c, x, y, 11, 11)));
          glowBox(c, 1428, 96, 24, 18);
        },
        live: (c, t) => {
          if (beat === 'train') train(c, 120 + 330 * ease(t / 3.5), t, t < 3.5);
          else if (beat === 'dawn') train(c, 450 - 900 * ease((t - 0.8) / 5) ** 2, t, t > 0.8);
          else train(c, 450, t, false);
        },
      },
      {
        //the sea beyond the harbour, with boats on it
        base: 540,
        paint: (c) => cut(c, waves(40, 1560, 478, 12, 80, 0, 540), sea[0], 0.6),
        live: (c, t) => {
          if (beat === 'regatta') {
            const racers: [number, string][] = [[0, RED], [1, MUSTARD], [2, TEAL], [3, PURPLE]];
            for (const [i, flag] of racers) {
              const x = 160 + ((t * (36 + i * 7) + i * 330) % 1400);
              bathtub(c, x, 512 + Math.sin(t * 2 + i) * 4, 0.9, extra(i + 20), flag);
            }
          } else {
            boat(c, 880, 510 + Math.sin(t * 1.3) * 4, 0.8, RED, WHITE);
            if (time !== 'night') boat(c, 1300, 506 + Math.sin(t * 1.1 + 2) * 4, 0.6, NAVY, MUSTARD);
          }
        },
      },
      {
        //the quay
        base: 612,
        paint: (c) => {
          cut(c, join(poly([[40, 545], [1040, 545], [1072, 562], [40, 562]]), box(40, 560, 1032, 52)), STONE, 0.8);
          for (let r = 0; r < 2; r++) for (let x = 40 + (r % 2) * 40; x < 1060; x += 80) line(c, [[x, 562 + r * 26], [x, 588 + r * 26]], 2, 'rgba(70,60,50,0.35)');
          line(c, [[40, 588], [1070, 588]], 2, 'rgba(70,60,50,0.35)');
          for (const x of [180, 880]) cut(c, join(box(x, 520, 26, 32, 6), oval(x + 13, 520, 17, 7)), SLATE, 0.5);
          for (const [x, y] of [[80, 512], [140, 512], [110, 478]]) {
            cut(c, box(x, y, 56, 36, 10), BROWN, 0.5);
            for (let k = 1; k < 4; k++) line(c, [[x + k * 14, y + 3], [x + k * 14, y + 33]], 1.5, 'rgba(255,240,210,0.5)');
          }
          cut(c, join(box(997, 390, 8, 160), poly([[984, 392], [1018, 392], [1012, 362], [990, 362]])), INK, 0.6);
          if (beat === 'regatta') {
            line(c, [[60, 400], [500, 450], [1000, 390]], 2, INK);
            for (let i = 0; i < 20; i++) {
              const x = 80 + i * 46;
              const y = x < 500 ? 400 + ((x - 60) / 440) * 50 : 450 - ((x - 500) / 500) * 60;
              cut(c, poly([[x - 14, y], [x + 14, y], [x, y + 30]]), [RED, MUSTARD, TEAL, WHITE][i % 4], 0.3);
            }
            [130, 250, 360, 470, 900, 960].forEach((x, i) => person(c, x, 548, 0.72, extra(i), { arms: i % 2 ? [2.6, 0.2] : [0.2, 0.3] }));
          }
        },
        glow: (c) => lit && glowBox(c, 992, 366, 18, 24),
        live: (c, t) => {
          const phone: Paint = (p) => {
            cut(p, box(-9, -4, 18, 30, 4), INK, 0.3);
            print(p, box(-6, -1, 12, 22, 2), '#9fd3e6');
          };
          if (beat === '') person(c, 700, 548, 0.95, YOU, { arms: [0.12, 0.4], hold: [undefined, (p) => cut(p, box(-24, 0, 48, 34, 5), BROWN, 0.4)] });
          if (beat === 'gull') {
            person(c, 700, 548, 0.95, YOU, { arms: [1.1, 0.12], hold: [phone] });
            const land = ease(t / 0.9);
            gull(c, 605 - (1 - land) * 300, 392 - (1 - land) * 200, 0.6, land < 1 ? Math.sin(t * 18) : 0, 1);
          }
          if (beat === 'drop') {
            person(c, 700, 548, 0.95, YOU, { arms: [2.5, 2.5], talk: true });
            const u = clamp(t / 0.8);
            c.save();
            c.translate(600 + u * 170, 422 + u * u * 246);
            c.rotate(u * 7);
            phone(c);
            c.restore();
            gull(c, 605 - t * 260, 392 - t * 200, 0.6, Math.sin(t * 18), -1);
          }
          if (beat === 'gone') person(c, 700, 548, 0.95, YOU, { arms: [0.05, 0.05] });
          if (beat === 'regatta') person(c, 700, 548, 0.95, YOU, {
            arms: [2.3 + Math.sin(t * 5) * 0.25, 0.9],
            hold: [
              (p) => {
                line(p, [[0, 10], [0, -90]], 3, BROWN);
                cut(p, poly([[0, -90], [40 + Math.sin(t * 9) * 6, -78], [0, -62]]), RED, 0.3);
              },
              (p) => cut(p, join(poly([[-10, 0], [10, 0], [0, 30]]), oval(0, -6, 12)), PINK, 0.3),
            ],
          });
          if (beat === 'rain') person(c, 560 + Math.min(t, 12) * 30, 548 - Math.abs(Math.sin(t * 6)) * 6, 0.95, YOU, { arms: [2.9, 2.9], hold: [(p) => cut(p, box(-50, -10, 100, 16, 6), TEAL, 0.3)] });
        },
      },
      {
        //the water in the harbour, sliding back and forth like a pull-tab
        base: 724,
        live: (c, t) => {
          cut(c, waves(40, 1560, 628, 9, 60, t * 1.4, 724), sea[1], 0.6);
          if (beat === 'drop' || beat === 'gone') {
            const at = beat === 'drop' ? t - 0.8 : t + 3;
            if (at > 0) {
              for (let k = 0; k < 3; k++) {
                const r = ((at + k * 0.6) % 1.8) * 50;
                c.save();
                c.globalAlpha *= 1 - r / 90;
                c.beginPath();
                c.ellipse(770, 668, r, r * 0.25, 0, 0, Math.PI * 2);
                c.lineWidth = 3;
                c.strokeStyle = FOAM;
                c.stroke();
                c.restore();
              }
              if (at < 0.5) for (let i = 0; i < 6; i++) print(c, oval(770 + (i - 2.5) * 14 * (1 + at * 3), 660 - Math.sin((at / 0.5) * Math.PI) * (30 + rand(i) * 30), 5), FOAM);
            }
          }
          cut(c, waves(40, 1560, 660, 8, 50, -t * 1.8, 724), sea[0], 0.8);
        },
      },
      {
        //the beach in front
        base: 884,
        paint: (c) => {
          cut(c, ground([[40, 724], [320, 706], [700, 726], [1100, 700], [1560, 716]], 884), SAND, 1.2);
          for (let i = 0; i < 40; i++) print(c, oval(60 + rand(i) * 1480, 760 + rand(i + 1) * 110, 6 + rand(i + 2) * 10, 4 + rand(i + 3) * 6), rand(i + 4) > 0.5 ? STONE : GREY);
          cut(c, poly(Array.from({ length: 10 }, (_, i): Pt => [1260 + Math.cos(i * 0.628 - 1.57) * (i % 2 ? 9 : 24), 800 + Math.sin(i * 0.628 - 1.57) * (i % 2 ? 9 : 24)])), CORAL, 0.4);
          cut(c, join(poly([[280, 780], [330, 780], [322, 830], [288, 830]])), RED, 0.6);
          line(c, [[350, 840], [380, 760]], 5, BROWN);
          cut(c, poly([[372, 760], [392, 762], [396, 728], [376, 724]]), MUSTARD, 0.4);
        },
        live: (c, t) => beat === 'beach' && person(c, 900, 840, 1.05, YOU, { arms: [0.3 + Math.sin(t) * 0.05, 0.3] }),
      },
    ],
    after: (c, t) => {
      if (time !== 'day') {
        const a = t * 0.9;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.12 + Math.abs(Math.cos(a)) * 0.18;
        c.fillStyle = '#ffe6a0';
        c.beginPath();
        c.moveTo(1440, 105);
        c.lineTo(1440 + Math.cos(a) * 900, 105 + Math.sin(a) * 70 - 40);
        c.lineTo(1440 + Math.cos(a) * 900, 105 + Math.sin(a) * 70 + 40);
        c.fill();
        c.restore();
      }
      if (time === 'rain') rain(c, t, ...PAGE);
    },
  };
}

function rain(c: Ctx, t: number, x: number, y: number, w: number, h: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let i = 0; i < 140; i++) {
    const rx = x + ((rand(i) * w + t * 120) % w);
    const ry = y + ((rand(i + 0.3) * h + t * (700 + rand(i + 0.6) * 300)) % h);
    line(c, [[rx, ry], [rx - 6, ry + 22]], 2, 'rgba(235,242,248,0.6)');
  }
  c.restore();
}

// --- the room above the bakery -----------------------------------------------

function quilt(c: Ctx, x: number, y: number, w: number, h: number) {
  cut(c, box(x, y, w, h, 10), CORAL, 0.6);
  const cols = Math.round(w / 48);
  for (let i = 0; i < cols; i++) for (let k = 0; k < 2; k++) if ((i + k) % 2) print(c, box(x + i * (w / cols), y + k * (h / 2), w / cols, h / 2), [MUSTARD, '#9cc5c1', PINK][i % 3]);
  line(c, [[x, y + h / 2], [x + w, y + h / 2]], 1.5, 'rgba(255,250,240,0.7)', [6, 6]);
}

function room(beat: string): Spread {
  const dark = ['night', 'night_in', 'packed'].includes(beat);
  const packed = beat === 'packed';
  const NIGHT: Tint = ['#18204a', 0.55];
  const inBed = beat === 'night' || beat === 'lie_in';
  return {
    key: dark ? 'dark' : 'light',
    tint: dark ? NIGHT : undefined,
    page: spreadPage((c) => {
      print(c, box(...PAGE), '#f3dccb');
      for (let y = 40; y < 760; y += 64) for (let x = 40 + ((y / 64) % 2) * 32; x < 1560; x += 64) {
        for (let k = 0; k < 4; k++) print(c, oval(x + Math.cos(k * 1.57) * 6, y + Math.sin(k * 1.57) * 6, 5), '#e5ac9c');
        print(c, oval(x, y, 3), MUSTARD);
      }
      print(c, box(40, 740, 1520, 140), WOOD);
      for (let y = 760; y < 880; y += 30) line(c, [[40, y], [1560, y]], 2, 'rgba(70,40,20,0.3)');
      if (dark) tintOver(c, NIGHT);
    }),
    layers: [
      {
        //the walls: the sloping ceiling, the door with the map pinned to it, and the window
        base: 640,
        paint: (c) => {
          cut(c, poly([[40, 30], [640, 30], [40, 330]]), '#d9b48f', 0.8);
          line(c, [[40, 200], [380, 30]], 10, 'rgba(120,80,50,0.4)');
          cut(c, box(170, 228, 214, 412, 4), WOOD, 0.8);
          for (const [y, h] of [[250, 160], [430, 190]]) print(c, box(190, y, 174, h, 4), 'rgba(80,50,30,0.18)');
          cut(c, oval(350, 446, 9), BRASS, 0.3);
          cut(c, box(206, 270, 140, 110), '#efe2c0', 0.4);
          line(c, [[220, 350], [260, 330], [290, 340], [330, 300]], 2, BROWN);
          print(c, oval(276, 273, 6), RED);
          cut(c, box(560, 220, 90, 70, 3), BROWN, 0.5);
          print(c, box(568, 228, 74, 54), '#cfe3e8');
          print(c, poly([[580, 270], [632, 270], [624, 280], [588, 280]]), RED);
          cut(c, box(850, 160, 340, 300, 6), WHITE, 0.8);
          print(c, box(866, 176, 308, 268), dark ? '#26305a' : '#a9d2df');
          print(c, box(866, 360, 308, 84), dark ? '#2b3c62' : SEA);
          line(c, [[1020, 176], [1020, 444]], 8, WHITE);
          line(c, [[866, 310], [1174, 310]], 8, WHITE);
          for (const [x, flip] of [[830, 1], [1210, -1]] as const) cut(c, poly([[x, 140], [x + flip * 70, 140], [x + flip * 40, 300], [x + flip * 60, 480], [x, 480]]), MUSTARD, 0.7);
          cut(c, box(830, 456, 380, 18, 4), WHITE, 0.6);
        },
        glow: (c) => dark && print(c, oval(1100, 230, 26), '#f3ecd0'),
        live: (c, t) => {
          if (beat === 'landlady') person(c, 280, 640, 1, PENHALLOW, { arms: [0.4, 1.2 + Math.sin(t * 4) * 0.15], talk: Math.floor(t * 5) % 2 === 0 });
          if (beat === 'morning') gull(c, 1120, 440, 0.55, Math.floor(t * 0.5) % 3 === 0 ? Math.sin(t * 16) : 0, -1);
        },
      },
      {
        //the bed, the bedside table and its lamp
        base: 748,
        key: `${dark}:${packed}`,
        paint: (c) => {
          cut(c, join(box(1210, 470, 44, 278, 8), oval(1232, 470, 26, 18)), BROWN, 0.8);
          cut(c, box(760, 580, 48, 168, 6), BROWN, 0.8);
          cut(c, box(770, 620, 470, 70, 10), WHITE, 0.6);
          cut(c, oval(1140, 610, 62, 26), WHITE, 0.4);
          quilt(c, 780, 630, 320, 92);
          cut(c, box(1290, 610, 150, 138, 6), WOOD, 0.8);
          line(c, [[1300, 660], [1430, 660]], 2, 'rgba(70,40,20,0.4)');
          cut(c, oval(1365, 680, 7), BRASS, 0.3);
          cut(c, join(box(1356, 540, 18, 70), oval(1365, 608, 34, 8)), BRASS, 0.5);
          cut(c, poly([[1320, 540], [1410, 540], [1390, 470], [1340, 470]]), MUSTARD, 0.6);
          if (packed) {
            cut(c, box(470, 640, 150, 108, 10), BROWN, 0.8);
            for (const x of [500, 580]) line(c, [[x, 640], [x, 748]], 6, '#5a3a24');
            cut(c, box(528, 620, 34, 24, 8), '#5a3a24', 0.3);
            cut(c, oval(560, 700, 16, 12), CORAL, 0.2);
          }
        },
        glow: (c) => {
          if (!dark) return;
          print(c, poly([[1322, 538], [1408, 538], [1388, 472], [1342, 472]]), LIT);
          light(c, 1365, 520, 260, 'rgba(255,190,100,0.45)');
        },
        live: (c, t) => {
          if (beat === 'landlady') person(c, 600, 748, 1.05, YOU, { arms: [0.12, 0.4], hold: [undefined, (p) => cut(p, box(-24, 0, 48, 34, 5), BROWN, 0.4)] });
          if (beat === 'morning') person(c, 980, 748, 1.05, YOU, { arms: [2.7 + Math.sin(t * 1.5) * 0.15, 2.7 + Math.sin(t * 1.5) * 0.15], shut: true });
          if (inBed) {
            lying(c, 860, 630, 1.15, { shut: beat === 'lie_in' && Math.floor(t / 3) % 2 === 0 });
            quilt(c, 780, 640, 300, 86);
          }
          if (beat === 'sunday') person(c, 840, 748, 1.05, YOU, { sit: true, arms: [0.6, 0.12], hold: [(p) => cut(p, box(-20, -10, 40, 52, 3), RED, 0.3)] });
          if (beat === 'night_in') {
            person(c, 1160, 700, -1.05, YOU, { sit: true, arms: [0.9, 0.9], hold: [(p) => cut(p, box(-26, -6, 52, 38, 3), PURPLE, 0.3)] });
            quilt(c, 820, 640, 290, 82);
          }
          if (packed) person(c, 860, 748, 1.05, YOU, { sit: true, arms: [0.3, 0.3] });
        },
      },
      {
        //the rug and slippers at the front
        base: 884,
        paint: (c) => {
          cut(c, oval(760, 830, 300, 46), CORAL, 0.6);
          print(c, oval(760, 830, 230, 34), MUSTARD);
          print(c, oval(760, 830, 150, 22), '#9cc5c1');
          for (const x of [1100, 1150]) cut(c, oval(x, 840, 22, 12, -0.2), PINK, 0.5);
        },
      },
    ],
    after: (c, t) => {
      if (dark) return;
      const drift = beat === 'lie_in' ? Math.sin(t * 0.15) * 80 : 0;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,236,170,0.12)';
      c.fill(poly([[870, 180], [1170, 180], [900 + drift, 880], [460 + drift, 880]]));
      c.restore();
    },
  };
}

// --- the map on the door -----------------------------------------------------

const COAST: Pt[] = [[140, 700], [400, 690], [560, 640], [700, 610], [820, 650], [960, 600], [1080, 560], [1200, 430], [1300, 340], [1460, 300]];

function lighthouse(c: Ctx, x: number, base: number, s: number) {
  c.save();
  c.translate(x, base);
  c.scale(s, s);
  cut(c, poly([[-20, 0], [-12, -130], [12, -130], [20, 0]]), WHITE, 0.6);
  for (const y of [-30, -80]) print(c, poly([[-18, y + 22], [-15, y], [15, y], [18, y + 22]]), RED);
  cut(c, join(box(-24, -136, 48, 8), poly([[-14, -154], [0, -176], [14, -154]])), RED, 0.4);
  print(c, box(-12, -154, 24, 18), LIT);
  c.restore();
}

function map(): Spread {
  const POPS: [number, Paint][] = [
    [272, (c) => lighthouse(c, 1260, 272, 0.75)],
    [330, (c) => {
      cut(c, join(box(390, 270, 100, 60), poly([[380, 272], [440, 236], [500, 272]]), box(476, 220, 22, 60), poly([[472, 222], [487, 196], [502, 222]])), STONE, 0.5);
      print(c, box(430, 300, 20, 30, 10), BROWN);
    }],
    [474, (c) => {
      house(c, [600, 474, 80, 60, CREAM, RED]);
      line(c, [[690, 474], [690, 400]], 3, INK);
      cut(c, poly([[690, 400], [730, 412], [690, 424]]), RED, 0.3);
    }],
    [600, (c) => {
      boat(c, 760, 600, 0.35, RED, WHITE);
      boat(c, 820, 596, 0.3, NAVY, MUSTARD);
    }],
    [700, (c) => {
      cut(c, box(1100, 690, 200, 10), WOOD, 0.4);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        line(c, [[1250, 640], [1250 + Math.cos(a) * 40, 640 + Math.sin(a) * 40]], 2, INK);
      }
      line(c, Array.from({ length: 25 }, (_, i): Pt => [1250 + Math.cos(i * 0.262) * 40, 640 + Math.sin(i * 0.262) * 40]), 4, RED);
      line(c, [[1226, 690], [1250, 640], [1274, 690]], 4, INK);
    }],
  ];
  return {
    page: spreadPage((c) => {
      print(c, box(...PAGE), WOOD);
      for (let x = 40; x < 1560; x += 130) line(c, [[x, 30], [x, 872]], 3, 'rgba(70,40,20,0.35)');
    }),
    layers: [
      {
        //the map itself, drawn by Mrs. Penhallow
        base: 860,
        paint: (c) => {
          const edge: Pt[] = [];
          for (let i = 0; i <= 40; i++) edge.push([140 + i * 33, 60 + rand(i) * 8]);
          for (let i = 0; i <= 24; i++) edge.push([1460 + rand(i + 50) * 8, 60 + i * 33]);
          for (let i = 40; i >= 0; i--) edge.push([140 + i * 33, 852 + rand(i + 100) * 8]);
          for (let i = 24; i >= 0; i--) edge.push([132 + rand(i + 150) * 8, 60 + i * 33]);
          const paper = poly(edge);
          cut(c, paper, '#efe2c0', 1);
          c.save();
          c.clip(paper);
          const sea = new Path2D();
          sea.moveTo(140, 870);
          COAST.forEach(([x, y]) => sea.lineTo(x, y));
          sea.lineTo(1480, 870);
          sea.closePath();
          print(c, sea, '#bcd6d6');
          line(c, COAST, 3, BROWN);
          for (let i = 0; i < 26; i++) {
            const [x, y] = [300 + rand(i) * 1150, 700 + rand(i + 1) * 140];
            if (y > 640 + (x - 140) * -0.15) line(c, [[x, y], [x + 8, y - 5], [x + 16, y], [x + 24, y - 5]], 2, '#6f9aa0');
          }
          c.restore();
          line(c, [[640, 470], [760, 380], [940, 340], [1080, 300], [1250, 270]], 3, BROWN, [8, 10]);
          line(c, [[620, 460], [520, 380], [450, 330]], 3, BROWN, [8, 10]);
          write(c, 'Gullhaven', 330, 140, 64, BROWN);
          line(c, [[200, 180], [300, 172], [460, 182]], 3, BROWN);
          write(c, 'drawn by Mrs. P', 330, 206, 24, BROWN);
          write(c, "St Bart's Hall", 440, 360, 26, INK);
          write(c, 'painting class, 10am', 440, 390, 22, RED);
          write(c, 'Bakery (you are here!)', 650, 504, 24, INK);
          write(c, 'Ebb & Flow Books', 920, 410, 22, INK);
          write(c, 'The Anchor', 1000, 470, 22, INK);
          write(c, 'quiz Saturday!', 1000, 496, 20, RED);
          write(c, 'cliff path', 1000, 296, 22, INK, HAND, -0.2);
          write(c, 'Lighthouse', 1260, 302, 22, INK);
          write(c, "REGATTA! 10 o'clock", 780, 646, 26, RED);
          write(c, 'Pier', 1180, 726, 24, INK);
          write(c, '...or stay in bed?', 330, 560, 28, INK, HAND, -0.08);
          cut(c, join(box(270, 590, 110, 20, 6), box(270, 576, 18, 40, 4), oval(296, 584, 14, 8)), '#9cc5c1', 0.3);
          line(c, [[400, 560], [520, 520], [580, 480]], 2.5, INK);
          const star: Pt[] = Array.from({ length: 8 }, (_, i) => [1360 + Math.cos(i * 0.785 - 1.57) * (i % 2 ? 14 : 50), 780 + Math.sin(i * 0.785 - 1.57) * (i % 2 ? 14 : 50)]);
          print(c, poly(star), BROWN);
          write(c, 'N', 1360, 712, 24, BROWN, SERIF);
          for (const [x, y] of [[150, 70], [1450, 70], [150, 840], [1450, 840]]) print(c, box(x - 40, y - 14, 80, 28), 'rgba(240,232,200,0.7)');
        },
      },
      ...POPS.map(([base, paint]): Layer => ({ base, paint })),
    ],
  };
}

// --- the cliff path ----------------------------------------------------------

function cliff(): Spread {
  return {
    page: spreadPage((c) => {
      bands(c, ['#8fc3d6', '#a9d2df', '#c6e2e6', '#e3efe9'], 30, 400);
      for (const [x, y] of [[420, 110], [1100, 80], [1400, 200]]) print(c, join(oval(x, y, 70, 20), oval(x + 30, y - 14, 40, 22), oval(x - 40, y - 6, 30, 16)), 'rgba(255,255,255,0.7)');
      bands(c, ['#9cc9c9', '#7fb5bb', '#6aa4af', SEA], 380, H, 1);
      for (let i = 0; i < 30; i++) {
        const [x, y] = [600 + rand(i) * 950, 420 + rand(i + 1) * 440];
        line(c, [[x, y], [x + 10, y - 5], [x + 20, y]], 2, 'rgba(255,255,255,0.5)');
      }
    }),
    layers: [
      { base: 470, paint: (c) => cut(c, ground([[1150, 470], [1250, 420], [1400, 398], [1560, 410]], 470), '#a8bb93', 0.6) },
      {
        //the headland, its rock face dropping to the sea
        base: 884,
        paint: (c) => {
          const top: Pt[] = [[40, 400], [300, 392], [600, 410], [900, 425], [1060, 440], [1130, 480], [1160, 580], [1185, 720], [1200, 884]];
          cut(c, ground(top, 884), GRASS, 1.2);
          print(c, poly([[1060, 440], [1130, 480], [1160, 580], [1185, 720], [1200, 884], [1100, 884], [1080, 700], [1040, 540]]), STONE);
          for (let i = 0; i < 6; i++) line(c, [[1050 + i * 4, 520 + i * 60], [1150 + i * 8, 540 + i * 60]], 2, 'rgba(80,70,60,0.35)');
          line(c, [[200, 880], [520, 770], [300, 660], [700, 570], [540, 490], [900, 432]], 12, SAND, [2, 0]);
          for (const [x, y] of [[150, 520], [420, 600], [800, 520], [660, 720], [960, 620]]) {
            cut(c, join(oval(x, y, 50, 30), oval(x - 34, y + 8, 30, 22), oval(x + 36, y + 6, 30, 22)), MOSS, 0.6);
            for (let k = 0; k < 10; k++) print(c, oval(x + (rand(x + k) - 0.5) * 100, y + (rand(y + k) - 0.5) * 40, 4), GORSE);
          }
          sheep(c, 320, 560, 1);
          sheep(c, 560, 650, 0.9, -1);
          sheep(c, 880, 760, 1.1);
          lighthouse(c, 700, 420, 1.4);
        },
        live: (c, t) => {
          person(c, 990, 440, 0.8, YOU, { arms: [0.35, 0.3 + Math.sin(t * 3) * 0.05] });
          //the scarf streaming in the wind
          c.save();
          c.translate(1000, 440 - 0.8 * 186);
          cut(c, poly([[0, 0], [60, -6 + Math.sin(t * 9) * 8], [90, 4 + Math.sin(t * 9 + 1) * 10], [56, 14], [0, 14]]), MUSTARD, 0.3);
          c.restore();
          for (let i = 0; i < 5; i++) print(c, oval(1230 + i * 70 + Math.sin(t * 2 + i) * 10, 868 + Math.sin(t * 3 + i) * 4, 40, 10), FOAM);
        },
      },
      {
        //tufts of grass and sea pinks at the front, bending in the wind
        base: 884,
        live: (c, t) => {
          for (let i = 0; i < 46; i++) {
            const x = 50 + rand(i) * 1100;
            const h = 30 + rand(i + 1) * 50;
            const bend = Math.sin(t * 2.2 + x * 0.01) * 14;
            print(c, poly([[x - 5, 884], [x + 5, 884], [x + bend, 884 - h]]), i % 3 ? MOSS : GRASS);
            if (i % 5 === 0) print(c, oval(x + bend, 884 - h, 7), PINK);
          }
        },
      },
    ],
    after: (c, t) => {
      for (let i = 0; i < 2; i++) {
        const a = t * 0.45 + i * 2.5;
        gull(c, 1300 + Math.cos(a) * 200, 200 + Math.sin(a) * 60 + i * 40, 0.55, Math.sin(t * 7 + i), Math.sin(a) > 0 ? -1 : 1);
      }
    },
  };
}

// --- the painting class --------------------------------------------------------

function easel(c: Ctx, x: number, base: number, s: number, picture: Paint) {
  c.save();
  c.translate(x, base);
  c.scale(s, s);
  line(c, [[-60, 0], [0, -330]], 8, WOOD);
  line(c, [[60, 0], [0, -330]], 8, WOOD);
  line(c, [[0, 0], [0, -300]], 6, '#8b5e3a');
  cut(c, box(-90, -300, 180, 190, 3), WHITE, 0.8);
  c.translate(0, -205);
  picture(c);
  c.restore();
}

function hall(beat: string): Spread {
  return {
    key: '',
    page: spreadPage((c) => {
      print(c, box(...PAGE), '#cfe0c8');
      for (const x of [240, 1160]) {
        print(c, join(box(x, 160, 200, 300), oval(x + 100, 160, 100)), WHITE);
        print(c, join(box(x + 14, 170, 172, 276), oval(x + 100, 170, 86)), '#bfe0ea');
        line(c, [[x + 100, 84], [x + 100, 446]], 6, WHITE);
      }
      print(c, box(40, 600, 1520, 280), '#a8744a');
      for (let x = 40; x < 1560; x += 90) line(c, [[x, 600], [x, 880]], 2, 'rgba(70,40,20,0.3)');
      cut(c, box(650, 110, 300, 90, 4), WHITE, 0.5);
      write(c, 'Gullhaven Art Club', 800, 155, 32, RED);
    }),
    layers: [
      {
        //the class at their easels behind the table
        base: 704,
        key: '',
        paint: (c) => {
          person(c, 300, 700, 0.85, { ...extra(3), style: 'cap', coat: '#7f9a6e' }, { arms: [1.2, 0.2] });
          easel(c, 420, 700, 0.7, (p) => cut(p, oval(0, 0, 40, 30), LEMON, 0.3));
          person(c, 1310, 700, 0.85, { ...extra(5), style: 'bun', coat: CORAL }, { arms: [0.2, 1.1] });
          easel(c, 1180, 700, 0.7, (p) => {
            cut(p, oval(-20, 10, 30, 22), LEMON, 0.3);
            cut(p, oval(24, 0, 30, 22), LEMON, 0.3);
          });
        },
      },
      {
        //the table and the bowl of lemons
        base: 770,
        key: '',
        paint: (c) => {
          for (const x of [650, 950]) cut(c, box(x - 8, 600, 16, 170), BROWN, 0.6);
          cut(c, box(600, 580, 400, 40, 4), WHITE, 0.8);
          for (let x = 600; x < 1000; x += 40) print(c, box(x, 580, 20, 40), 'rgba(212,85,63,0.5)');
          for (const [x, y] of [[760, 540], [800, 528], [840, 542], [785, 512]]) cut(c, oval(x, y, 26, 20, 0.3), LEMON, 0.4);
          cut(c, oval(820, 500, 16, 7, -0.5), MOSS, 0.3);
          cut(c, poly([[720, 548], [880, 548], [860, 584], [740, 584]]), '#4f7fb0', 0.6);
        },
      },
      {
        //your easel, you, and Mr. Bligh
        base: 884,
        key: '',
        paint: (c) => {
          easel(c, 470, 884, 1.15, (p) => {
            print(p, oval(0, 0, 60, 50), LEMON);
            for (let i = 0; i < 6; i++) line(p, Array.from({ length: 12 }, (_, k): Pt => [Math.cos(k * 0.5 + i) * (20 + k * 6), Math.sin(k * 0.5 + i) * (16 + k * 5)]), 4, i % 2 ? CORAL : MUSTARD);
            for (let i = 0; i < 9; i++) print(p, oval((rand(i) - 0.5) * 160, (rand(i + 9) - 0.5) * 160, 6), [PINK, TEAL, RED][i % 3]);
          });
          for (let i = 0; i < 7; i++) print(c, oval(300 + rand(i) * 900, 850 + rand(i + 2) * 25, 10 + rand(i + 4) * 10, 5), [LEMON, CORAL, TEAL][i % 3]);
        },
        live: (c, t) => {
          person(c, 720, 870, 1.1, YOU, { arms: [1.5 + Math.sin(t * 4) * 0.25, 0.4], hold: [(p) => line(p, [[0, 0], [0, -46]], 5, BROWN)] });
          const teaching = beat === 'teacher';
          person(c, 1080, 870, 1.1, BLIGH, {
            arms: teaching ? [1.6 + Math.sin(t * 3) * 0.2, 0.3] : [0.3, 0.9],
            talk: teaching && Math.floor(t * 5) % 2 === 0,
            hold: [undefined, (p) => cut(p, join(oval(0, 0, 36, 24), oval(0, 0, 6)), '#e7d9b6', 0.3)],
          });
        },
      },
    ],
    after: (c) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,250,220,0.09)';
      for (const x of [240, 1160]) c.fill(poly([[x, 160], [x + 200, 160], [x + 380, 880], [x + 80, 880]]));
      c.restore();
    },
  };
}

// --- the bookshop ----------------------------------------------------------------

function shelves(c: Ctx, x0: number, x1: number, seed: number) {
  cut(c, box(x0, 80, x1 - x0, 640, 4), BROWN, 1);
  for (let y = 100; y < 700; y += 120) {
    print(c, box(x0 + 16, y, x1 - x0 - 32, 104), '#4f3424');
    let x = x0 + 18;
    for (let i = 0; x < x1 - 40; i++) {
      const k = seed + y + i;
      const w = 14 + rand(k) * 20;
      const h = 70 + rand(k + 1) * 30;
      const lean = rand(k + 2) > 0.92 ? 0.15 : 0;
      c.save();
      c.translate(x, y + 104);
      c.rotate(lean);
      print(c, box(0, -h, w, h, 2), [RED, MUSTARD, TEAL, PURPLE, MOSS, CORAL, NAVY, CREAM][Math.floor(rand(k + 3) * 8)]);
      print(c, box(2, -h + 12, w - 4, 4), 'rgba(255,240,200,0.5)');
      c.restore();
      x += w + 2 + lean * 40;
    }
    print(c, box(x0 + 10, y + 104, x1 - x0 - 20, 14), WOOD);
  }
}

function bookshop(beat: string): Spread {
  const reading = beat === 'reading';
  const talking = beat === 'agnes';
  return {
    key: '',
    tint: ['#4e5d66', 0.12],
    page: spreadPage((c) => {
      print(c, box(...PAGE), '#6b4a35');
      for (let x = 40; x < 1560; x += 70) line(c, [[x, 30], [x, 872]], 2, 'rgba(30,15,5,0.3)');
      print(c, box(600, 130, 400, 340), WHITE);
      print(c, box(614, 144, 372, 312), '#8b979e');
      print(c, box(614, 380, 372, 76), '#6f7f86');
      c.save();
      c.translate(800, 200);
      c.scale(-1, 1);
      write(c, 'EBB & FLOW', 0, 0, 38, 'rgba(233,180,67,0.8)', SERIF);
      c.restore();
      line(c, [[800, 144], [800, 456]], 8, WHITE);
      print(c, box(40, 760, 1520, 120), '#5a3a28');
    }),
    layers: [
      {
        //the shelves, with Agnes in front of them behind her counter
        base: 720,
        paint: (c) => {
          shelves(c, 60, 540, 0);
          shelves(c, 1060, 1540, 500);
          line(c, [[420, 720], [520, 90]], 8, WOOD);
          line(c, [[480, 720], [580, 90]], 8, WOOD);
          for (let i = 1; i < 8; i++) line(c, [[420 + i * 12.5, 720 - i * 79], [480 + i * 12.5, 720 - i * 79]], 6, WOOD);
        },
        live: (c, t) => {
          const knit = Math.sin(t * 6) * 0.15;
          person(c, 1250, 650, 1, AGNES, {
            arms: talking ? [0.9 + Math.sin(t * 3) * 0.3, 0.5] : [0.8 + knit, 0.8 - knit],
            talk: talking && Math.floor(t * 5) % 2 === 0,
            hold: [(p) => line(p, [[0, 0], [24, -36]], 3, GREY), (p) => line(p, [[0, 0], [-24, -36]], 3, GREY)],
          });
        },
      },
      {
        //the counter: the till, the kettle, and the cat asleep on a pile of books
        base: 800,
        paint: (c) => {
          cut(c, box(1060, 580, 430, 220, 4), WOOD, 1);
          for (const x of [1080, 1230, 1380]) print(c, box(x, 610, 90, 160, 4), 'rgba(70,40,20,0.2)');
          cut(c, join(box(1120, 520, 90, 60, 6), box(1130, 494, 70, 30, 4)), BRASS, 0.6);
          cut(c, join(box(1390, 530, 64, 50, 18), poly([[1450, 545], [1476, 530], [1452, 560]])), RED, 0.6);
          for (let i = 0; i < 4; i++) cut(c, box(1270 - i * 3, 556 - i * 22, 96 + i * 4, 22, 2), [TEAL, MUSTARD, PURPLE, CORAL][i], 0.3);
          cut(c, join(oval(1316, 480, 46, 22), oval(1350, 468, 18)), '#e39a4c', 0.5);
          print(c, poly([[1338, 458], [1342, 440], [1352, 454]]), '#e39a4c');
          print(c, poly([[1356, 454], [1364, 438], [1366, 456]]), '#e39a4c');
          line(c, [[1344, 470], [1350, 472]], 2, INK);
          line(c, [[1356, 470], [1362, 472]], 2, INK);
        },
        live: (c, t) => {
          for (let i = 0; i < 4; i++) {
            const u = (t * 0.5 + i / 4) % 1;
            c.globalAlpha = 1 - u;
            print(c, oval(1470 + Math.sin(u * 6 + i) * 8, 520 - u * 120, 8 + u * 14), WHITE);
          }
          c.globalAlpha = 1;
          line(c, [[1270, 486], [1250, 470 + Math.sin(t * 2) * 12], [1244, 446 + Math.sin(t * 2 + 1) * 14]], 9, '#e39a4c');
        },
      },
      {
        //the armchair and the piles of books on the floor
        base: 884,
        paint: (c) => {
          cut(c, join(box(240, 500, 300, 260, 50), box(220, 640, 340, 150, 30)), MOSS, 1);
          cut(c, box(270, 680, 280, 70, 20), '#6f9a5e', 0.4);
          cut(c, box(200, 610, 70, 190, 30), MOSS, 0.8);
          for (const [x, n] of [[700, 6], [960, 4]]) for (let i = 0; i < n; i++) cut(c, box(x - (i % 2) * 6, 860 - i * 24, 120, 24, 2), [RED, TEAL, MUSTARD, PURPLE, CREAM, CORAL][i], 0.4);
        },
        live: (c, t) => {
          if (reading) {
            person(c, 360, 790, 1, YOU, { sit: true, arms: [0.9, 0.9], hold: [(p) => cut(p, join(box(-30, -8, 30, 40, 2), box(0, -8, 30, 40, 2)), CREAM, 0.3)] });
            cut(c, box(520, 610, 70, 190, 30), MOSS, 0.8);
          } else {
            person(c, 820, 860, 1.05, YOU, { arms: [talking ? 0.4 : 0.15, 0.15] });
            for (let i = 0; i < 3; i++) {
              const u = (t * 0.9 + i / 3) % 1;
              print(c, oval(790 + i * 28, 700 + u * 160, 4, 6), '#9fd3e6');
            }
          }
        },
      },
    ],
    after: (c, t) => rain(c, t, 614, 144, 372, 312),
  };
}

// --- the Anchor --------------------------------------------------------------------

function pub(beat: string): Spread {
  const won = beat === 'win';
  const TEAM: [number, Look][] = [
    [560, { ...extra(8), style: 'long', coat: MUSTARD }],
    [690, AGNES],
    [820, YOU],
    [950, { ...extra(9), style: 'cap', coat: NAVY, beard: GREY }],
  ];
  return {
    key: '',
    tint: ['#6a3a20', 0.12],
    page: spreadPage((c) => {
      print(c, box(...PAGE), '#41615c');
      print(c, box(40, 520, 1520, 360), '#6b4630');
      for (let x = 40; x < 1560; x += 120) print(c, box(x + 12, 540, 96, 300, 6), 'rgba(40,20,10,0.25)');
      cut(c, box(1140, 110, 330, 220, 6), '#2c3430', 0.6);
      write(c, 'QUIZ NIGHT', 1305, 160, 42, WHITE);
      write(c, 'tonight 8pm', 1305, 210, 28, WHITE);
      write(c, 'winners get', 1305, 254, 24, 'rgba(255,255,255,0.75)');
      write(c, 'a cake!', 1305, 286, 24, 'rgba(255,255,255,0.75)');
      c.lineWidth = 10;
      c.strokeStyle = WOOD;
      c.beginPath();
      c.arc(300, 220, 80, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 8; i++) line(c, [[300, 220], [300 + Math.cos(i * 0.785) * 110, 220 + Math.sin(i * 0.785) * 110]], 8, WOOD);
    }),
    layers: [
      {
        //the bar and the bottles, with the team standing at their table
        base: 610,
        key: '',
        paint: (c) => {
          cut(c, box(60, 300, 480, 12), WOOD, 0.4);
          for (let i = 0; i < 12; i++) cut(c, join(box(80 + i * 38, 238, 24, 62, 6), box(88 + i * 38, 218, 8, 24)), [MOSS, '#8b3a2e', MUSTARD, TEAL][i % 4], 0.3);
          for (const x of [200, 260, 320]) cut(c, join(box(x, 380, 14, 50, 4), oval(x + 7, 380, 12, 6)), BRASS, 0.4);
          cut(c, box(40, 430, 560, 180, 4), '#7a4a33', 1);
          cut(c, box(30, 420, 580, 20, 4), '#5a3424', 0.4);
        },
        live: (c, t) => {
          TEAM.forEach(([x, look], i) => {
            const bob = Math.abs(Math.sin(t * 5 + i)) * (won ? 10 : 6);
            const cheer = won ? [2.5 + Math.sin(t * 6 + i) * 0.2, 2.5] : [0.4, 0.9 + Math.sin(t * 4 + i) * 0.2];
            const crying = won && look === AGNES;
            person(c, x, 720 - bob, 0.95, look, {
              arms: crying ? [2.1, 0.4] : (cheer as [number, number]),
              talk: Math.floor(t * 4 + i) % 2 === 0,
              shut: crying || (!won && Math.floor(t * 2 + i) % 3 === 0),
              hold: crying ? [(p) => cut(p, box(-14, -8, 28, 24, 4), WHITE, 0.2)] : undefined,
            });
          });
          person(c, 1360, 610, 0.9, { ...extra(11), style: 'bald', beard: INK, coat: RED }, { arms: [0.9, 0.2], talk: Math.floor(t * 3) % 2 === 0, hold: [(p) => cut(p, box(-14, -20, 28, 36, 2), WHITE, 0.2)] });
          line(c, [[1440, 610], [1430, 420]], 4, INK);
          cut(c, oval(1428, 410, 10, 14), SLATE, 0.3);
        },
      },
      {
        //the table, with whatever the team won on it
        base: 820,
        key: beat,
        paint: (c) => {
          cut(c, join(box(800, 650, 40, 170, 4), oval(820, 818, 80, 12)), '#5a3424', 0.8);
          cut(c, oval(820, 640, 300, 44), WOOD, 1);
          for (const x of [620, 700, 940, 1010]) {
            cut(c, box(x - 18, 570, 36, 60, 4), '#c98b2c', 0.4);
            print(c, oval(x, 572, 18, 7), WHITE);
          }
          cut(c, box(760, 620, 110, 34, 2), WHITE, 0.2);
          if (won) {
            cut(c, join(poly([[790, 600], [850, 600], [834, 640], [806, 640]]), box(808, 638, 24, 14), box(796, 650, 48, 10)), BRASS, 0.5);
            write(c, '3rd', 820, 616, 18, INK, SERIF);
          } else cut(c, join(oval(820, 616, 16, 24), box(816, 636, 8, 60)), WOOD, 0.5);
        },
      },
    ],
    after: (c, t) => {
      for (let i = 0; i < 26; i++) {
        const x = 60 + i * 58;
        const y = 70 + Math.sin((i / 25) * Math.PI) * 60;
        print(c, oval(x, y, 7, 9), [LIT, CORAL, '#9fd3e6', '#c9e29a'][i % 4]);
        if (rand(i + Math.floor(t * 2)) > 0.3) light(c, x, y, 26, 'rgba(255,210,140,0.35)');
      }
    },
  };
}

// --- the funfair on the pier -----------------------------------------------------

function pier(): Spread {
  const bulbs = (c: Ctx, pts: Pt[], t: number) =>
    pts.forEach(([x, y], i) => {
      const on = (i + Math.floor(t * 4)) % 3 !== 0;
      print(c, oval(x, y, 5), on ? LIT : '#c9a67a');
      if (on) light(c, x, y, 18, 'rgba(255,210,140,0.4)');
    });
  const CROWD: [number, number, number][] = [[120, 870, 1.05], [250, 860, 0.95], [390, 878, 1.1], [540, 866, 1], [680, 874, 0.98], [980, 870, 1.05], [1120, 862, 0.95], [1260, 876, 1.1], [1420, 866, 1]];
  return {
    tint: ['#f0a050', 0.08],
    page: spreadPage((c) => {
      bands(c, ['#f4c58e', '#f7d7a0', '#f9e4b4', '#fbeec8'], 30, 460);
      print(c, oval(1380, 360, 70), '#fff1c8');
      bands(c, ['#9cc4c0', '#7fb0b5'], 440, H, 3);
    }),
    layers: [
      {
        //the helter-skelter and the big wheel
        base: 560,
        paint: (c) => {
          const tower = poly([[250, 560], [272, 200], [328, 200], [350, 560]]);
          cut(c, tower, WHITE, 0.8);
          c.save();
          c.clip(tower);
          for (let y = 140; y < 600; y += 60) print(c, poly([[200, y], [400, y - 60], [400, y - 30], [200, y + 30]]), RED);
          c.restore();
          cut(c, poly([[250, 206], [300, 120], [350, 206]]), MUSTARD, 0.6);
          line(c, [[300, 120], [300, 84]], 3, INK);
          cut(c, poly([[300, 84], [336, 94], [300, 104]]), RED, 0.3);
          line(c, [[1090, 560], [1200, 300], [1310, 560]], 14, SLATE);
        },
        live: (c, t) => {
          const a = t * 0.25;
          c.lineWidth = 12;
          c.strokeStyle = WHITE;
          c.beginPath();
          c.arc(1200, 300, 200, 0, Math.PI * 2);
          c.stroke();
          for (let i = 0; i < 8; i++) {
            const q = a + (i / 8) * Math.PI * 2;
            const [x, y] = [1200 + Math.cos(q) * 200, 300 + Math.sin(q) * 200];
            line(c, [[1200, 300], [x, y]], 4, WHITE);
            cut(c, box(x - 22, y, 44, 34, 8), [RED, TEAL, MUSTARD, PURPLE][i % 4], 0.4);
          }
          cut(c, oval(1200, 300, 18), RED, 0.4);
          bulbs(c, Array.from({ length: 24 }, (_, i): Pt => [1200 + Math.cos(a + i * 0.2618) * 200, 300 + Math.sin(a + i * 0.2618) * 200]), t);
        },
      },
      {
        //the deck, the railings and the stalls
        base: 660,
        paint: (c) => {
          for (let x = 60; x < 1560; x += 60) line(c, [[x, 560], [x, 610]], 5, WHITE);
          line(c, [[40, 560], [1560, 560]], 6, WHITE);
          cut(c, box(40, 600, 1520, 60), WOOD, 0.6);
          for (let x = 40; x < 1560; x += 40) line(c, [[x, 600], [x, 660]], 1.5, 'rgba(70,40,20,0.35)');
          for (const [x, w, stripe, sign] of [[480, 320, RED, 'DOUGHNUTS'], [1310, 230, PINK, 'CANDY FLOSS']] as const) {
            cut(c, box(x, 430, w, 170, 4), CREAM, 0.8);
            cut(c, join(box(x - 14, 400, w + 28, 40), ...Array.from({ length: Math.floor((w + 28) / 36) }, (_, i) => oval(x - 14 + 18 + i * 36, 440, 18, 12))), WHITE, 0.6);
            for (let i = 0; i < (w + 28) / 36; i += 2) print(c, box(x - 14 + i * 36, 400, 36, 40), stripe);
            write(c, sign, x + w / 2, 370, 30, RED, SERIF);
          }
        },
        live: (c, t) => {
          bulbs(c, Array.from({ length: 10 }, (_, i): Pt => [490 + i * 33, 462]), t);
          bulbs(c, Array.from({ length: 8 }, (_, i): Pt => [1316 + i * 31, 462]), t + 0.5);
        },
      },
      {
        //the crowd, and you in the middle of it
        base: 884,
        live: (c, t) => {
          CROWD.forEach(([x, y, s], i) => {
            const bob = Math.abs(Math.sin(t * 3 + i * 1.7)) * 8;
            person(c, x, y - bob, s, extra(i + 30), { arms: i % 3 ? [0.3, 0.2] : [2.4, 0.3], talk: i % 2 === 0 && Math.floor(t * 3 + i) % 2 === 0 });
          });
          person(c, 820, 850, 1.08, YOU, { arms: [1.2, 0.15], hold: [(p) => {
            line(p, [[0, 0], [0, -60]], 3, WHITE);
            cut(p, join(oval(0, -80, 26), oval(-14, -94, 18), oval(14, -96, 18)), PINK, 0.3);
          }] });
        },
      },
    ],
  };
}

// --- the notebook ----------------------------------------------------------------

function notebook(beat: string): Spread {
  const ITEMS = ['Swim in the sea', 'Eat a whole crab', 'Learn one song on the harmonica', 'Be nice to the gull'];
  return {
    key: '',
    page: spreadPage((c) => {
      print(c, box(...PAGE), WOOD);
      for (let y = 30; y < 880; y += 90) line(c, [[40, y], [1560, y]], 3, 'rgba(70,40,20,0.35)');
    }),
    layers: [
      {
        base: 870,
        key: beat,
        paint: (c) => {
          for (const x of [250, 800]) {
            cut(c, box(x, 90, 550, 770, 6), '#fbf6e6', 1);
            for (let y = 240; y < 840; y += 50) line(c, [[x + 10, y], [x + 540, y]], 1.5, 'rgba(90,140,190,0.45)');
            line(c, [[x + 80, 100], [x + 80, 850]], 1.5, 'rgba(212,85,63,0.6)');
          }
          for (let y = 120; y < 850; y += 46) line(c, [[786, y], [814, y]], 5, GREY);
          write(c, 'THINGS TO DO', 540, 150, 40, INK);
          write(c, 'THIS WEEKEND', 540, 200, 40, INK);
          ITEMS.forEach((item, i) => {
            const y = 280 + i * 100;
            write(c, item, 545, y, item.length > 20 ? 28 : 34, INK);
            line(c, [[370, y + 4], [720, y - 2]], 3, INK);
            line(c, [[300, y], [312, y + 12], [334, y - 14]], 4, MOSS);
          });
          line(c, [[600, 720], [630, 700], [650, 720], [670, 700], [700, 720]], 3, INK);
          print(c, oval(650, 740, 30, 14), 'rgba(160,160,160,0.3)');
          if (beat === 'list') write(c, 'My list:', 960, 170, 44, TEAL);
        },
        live: (c, t) => {
          if (beat !== 'list') {
            c.save();
            c.translate(1100, 560);
            c.rotate(-0.6);
            cut(c, join(box(-160, -10, 300, 20, 3), poly([[140, -10], [180, 0], [140, 10]])), MUSTARD, 0.6);
            print(c, poly([[164, -4], [180, 0], [164, 4]]), INK);
            c.restore();
            return;
          }
          //your pencil scrawling down the page
          const pts: Pt[] = [];
          const span = Math.min(t * 120, 1300);
          for (let d = 0; d < span; d += 4) {
            const row = Math.floor(d / 340);
            const x = 900 + (d % 340);
            pts.push([x + Math.sin(d * 0.3) * 6, 280 + row * 100 + Math.cos(d * 0.45) * 8]);
          }
          for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][0] - pts[i - 1][0]) < 30) line(c, [pts[i - 1], pts[i]], 2.5, TEAL);
          const [px, py] = pts[pts.length - 1] ?? [900, 280];
          c.save();
          c.translate(px, py);
          c.rotate(-1);
          cut(c, join(box(20, -8, 260, 16, 3), poly([[20, -8], [0, 0], [20, 8]])), MUSTARD, 0.6);
          print(c, poly([[8, -3], [0, 0], [8, 3]]), INK);
          c.restore();
        },
      },
    ],
  };
}

// --- the cover ---------------------------------------------------------------------

function cover(beat: string): Spread {
  return {
    page: (c) => {
      c.save();
      c.shadowColor = 'rgba(0,0,0,0.5)';
      c.shadowBlur = 30;
      c.shadowOffsetY = 14;
      print(c, box(820, 40, 740, 830, 10), '#efe5cf');
      c.restore();
      print(c, box(824, 44, 720, 820, 8), COVER);
      c.fillStyle = grainOf(c);
      c.fillRect(824, 44, 720, 820);
      c.strokeStyle = GOLD;
      c.lineWidth = 3;
      c.strokeRect(860, 80, 648, 748);
      write(c, 'The Empty', 1184, 230, 78, GOLD, SERIF);
      write(c, 'Weekend', 1184, 320, 78, GOLD, SERIF);
      c.save();
      c.translate(1184, 560);
      line(c, [[-22, 0], [-14, -140], [14, -140], [22, 0]], 3, GOLD);
      line(c, [[-20, -168], [0, -190], [20, -168], [-20, -168]], 3, GOLD);
      line(c, [[-12, -140], [-12, -168]], 3, GOLD);
      line(c, [[12, -140], [12, -168]], 3, GOLD);
      for (let k = 0; k < 3; k++) line(c, Array.from({ length: 30 }, (_, i): Pt => [-200 + i * 14, 30 + k * 26 + Math.abs(Math.sin(i * 0.5 + k)) * 12]), 3, GOLD);
      line(c, [[90, -120], [110, -132], [130, -120], [150, -132], [170, -120]], 3, GOLD);
      c.restore();
      write(c, 'A Pop-Up Book', 1184, 770, 30, GOLD, SERIF);
      //on the table: the ticket and a mug of tea
      c.save();
      c.translate(420, 600);
      c.rotate(-0.12);
      cut(c, box(-150, -60, 300, 120, 6), '#f1e4c4', 1);
      write(c, 'GULLHAVEN', 0, -24, 34, INK, SERIF);
      write(c, beat === 'end' ? 'RETURN' : 'SINGLE', 0, 22, 26, RED, SERIF);
      line(c, [[-130, -54], [130, -54]], 2, RED);
      c.restore();
      cut(c, join(box(270, 240, 110, 120, 12), oval(325, 360, 55, 12)), CORAL, 1);
      c.lineWidth = 14;
      c.strokeStyle = CORAL;
      c.beginPath();
      c.arc(386, 300, 26, -Math.PI / 2, Math.PI / 2);
      c.stroke();
      print(c, oval(325, 242, 55, 12), '#8b5a36');
    },
    layers: [],
    after: (c, t) => {
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.3 + i / 3) % 1;
        c.globalAlpha = (1 - u) * 0.6;
        line(c, Array.from({ length: 8 }, (_, k): Pt => [310 + i * 16 + Math.sin(k + t * 2 + i) * 8, 220 - u * 60 - k * 12]), 4, WHITE);
      }
      c.globalAlpha = 1;
    },
  };
}

const SETS: Record<SetId, (beat: string) => Spread> = { cover, harbour, room, map, cliff, hall, bookshop, pub, notebook, pier };

// ---------------------------------------------------------------------------
// drawing a spread
// ---------------------------------------------------------------------------

//every painted page and flap, kept until they haven't been used for a while
const kept = new Map<string, HTMLCanvasElement>();
function painted(key: string, paint: Paint, tint?: Tint, glow?: Paint) {
  let el = kept.get(key);
  if (el) kept.delete(key);
  else {
    const [made, c] = canvas2d(W, H);
    paint(c);
    if (tint) tintOver(c, tint);
    glow?.(c);
    el = made;
    if (kept.size >= 24) kept.delete(kept.keys().next().value!);
  }
  kept.set(key, el);
  return el;
}

//pages aren't tinted: each backdrop is printed in its own light
const pageOf = (q: Cue, spread = SETS[q.set](q.beat ?? '')) => painted(`${q.set}:${spread.key ?? q.beat ?? ''}:page`, spread.page);

let scratch: [HTMLCanvasElement, Ctx] | undefined;

//the page, then each flap folded up by fold(i) around its base, with its live things moving on it
function drawSpread(c: Ctx, q: Cue, t: number, fold: (i: number) => number) {
  const spread = SETS[q.set](q.beat ?? '');
  c.drawImage(pageOf(q, spread), 0, 0);
  let up = 1;
  spread.layers.forEach((layer, i) => {
    const f = fold(i);
    up = Math.min(up, f);
    if (f <= 0.01) return;
    c.save();
    c.translate(0, layer.base);
    c.scale(1, f);
    c.translate(0, -layer.base);
    if (layer.paint) c.drawImage(painted(`${q.set}:${layer.key ?? spread.key ?? q.beat ?? ''}:${i}`, layer.paint, spread.tint, layer.glow), 0, 0);
    if (layer.live && spread.tint) {
      //live things are drawn apart and tinted like the card around them
      const [el, s] = (scratch ??= canvas2d(W, H));
      s.clearRect(0, 0, W, H);
      layer.live(s, t);
      tintOver(s, spread.tint);
      c.drawImage(el, 0, 0);
    } else layer.live?.(c, t);
    c.restore();
  });
  if (spread.after && up > 0.99) spread.after(c, t);
}

//the old right-hand page swings over the gutter, showing the back of the new left-hand page as it lands
function turnPage(c: Ctx, from: Cue, to: Cue, p: number) {
  const [a, b] = [pageOf(from), pageOf(to)];
  c.drawImage(b, 0, 0);
  c.drawImage(a, 0, 0, GUTTER, H, 0, 0, GUTTER, H);
  const w = Math.cos(ease(p) * Math.PI) * GUTTER;
  if (Math.abs(w) < 1) return;
  if (w > 0) c.drawImage(a, GUTTER, 0, GUTTER, H, GUTTER, 0, w, H);
  else c.drawImage(b, 0, 0, GUTTER, H, GUTTER + w, 0, -w, H);
  c.fillStyle = `rgba(60,40,20,${0.3 * (1 - Math.abs(w) / GUTTER)})`;
  c.fillRect(Math.min(GUTTER, GUTTER + w), PAGE[1], Math.abs(w), PAGE[3]);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  harbour: new URL('./sounds/harbour.m4a', import.meta.url).href,
  town: new URL('./sounds/town.m4a', import.meta.url).href,
  pub: new URL('./sounds/pub.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  surf: new URL('./sounds/surf.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'harbour') {
    if (beat === 'regatta') return { harbour: 0.35, town: 0.55 };
    if (beat === 'rain') return { rain: 0.6, harbour: 0.25 };
    if (beat === 'beach') return { surf: 0.45 };
    return { harbour: 0.6 };
  }
  if (set === 'room') return ['night', 'night_in', 'packed'].includes(beat ?? '') ? { room: 0.5 } : { room: 0.45, harbour: 0.15 };
  if (set === 'cliff') return { surf: 0.6 };
  if (set === 'bookshop') return { rain: 0.45, room: 0.3 };
  if (set === 'pub') return { pub: 0.6 };
  if (set === 'pier') return { town: 0.7, surf: 0.25 };
  if (set === 'cover') return {};
  return { room: 0.4 };
}

const PAGE_TURN: OneShot = { src: new URL('./sounds/page.m4a', import.meta.url).href, volume: 0.7, delay: FOLD };
const ONE_SHOTS: Record<string, OneShot> = {
  phone_drop: { src: new URL('./sounds/plop.m4a', import.meta.url).href, volume: 0.9, delay: 0.75 },
  reading: { src: new URL('./sounds/flip.m4a', import.meta.url).href, volume: 0.6, delay: 0.3 },
  my_list: { src: new URL('./sounds/pencil.m4a', import.meta.url).href, volume: 0.7, delay: 0.2 },
  sunday: { src: new URL('./sounds/bells.m4a', import.meta.url).href, volume: 0.6 },
  clock: { src: new URL('./sounds/clock.m4a', import.meta.url).href, volume: 0.6, delay: 0.2 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function PopUpTown({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Pop-Up Town has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active] });
  const sound = useRef<Soundscape<Bed> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;

    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      if (el.width !== Math.round(sw * dpr) || el.height !== Math.round(sh * dpr)) {
        el.width = Math.round(sw * dpr);
        el.height = Math.round(sh * dpr);
      }
      const { cue, at, prev } = shown.current;
      const since = (now - at) / 1000;

      //scaled to cover the screen, keeping the cue's focus in frame, and easing across when the focus moves
      const k = Math.max(sw / W, sh / H);
      const focus = (q: Cue) => Math.min(0, Math.max(sw - W * k, sw / 2 - (q.x ?? W / 2) * k));
      const ox = focus(prev) + (focus(cue) - focus(prev)) * ease(since / 1.2);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = TABLE;
      c.fillRect(0, 0, el.width, el.height);
      c.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, (dpr * (sh - H * k)) / 2);
      c.drawImage((table ??= makeTable()), 0, 0);

      if (prev.set !== cue.set && since < FOLD + TURN) {
        if (since < FOLD) {
          const n = SETS[prev.set](prev.beat ?? '').layers.length;
          drawSpread(c, prev, since + 60, (i) => 1 - ease((since - (n - 1 - i) * 0.05) / (FOLD - 0.15)));
        } else turnPage(c, prev, cue, (since - FOLD) / TURN);
        return;
      }
      const t = prev.set !== cue.set ? since - FOLD - TURN : since;
      const popping = prev.set !== cue.set ? (i: number) => spring((t - i * STAGGER) / POP) : () => 1;
      if (prev.set === cue.set && prev !== cue && since < FADE) {
        drawSpread(c, prev, since + 60, () => 1);
        c.globalAlpha = ease(since / FADE);
        drawSpread(c, cue, t, popping);
        c.globalAlpha = 1;
      } else drawSpread(c, cue, t, popping);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const prev = shown.current.cue;
    const cue = cues[active];
    shown.current = { cue, at: performance.now(), prev };
    sound.current?.mix(mixFor(cue));
    if (prev.set !== cue.set) sound.current?.play(PAGE_TURN);
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  return (
    <div style={styles.scene}>
      <canvas ref={canvas} style={styles.canvas} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: TABLE,
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
};

export default PopUpTown;
