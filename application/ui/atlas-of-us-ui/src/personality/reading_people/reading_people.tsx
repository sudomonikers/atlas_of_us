import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// Reading People is painted on a 2D canvas in a soft watercolor style rather than built in three.js.
// Each scene is painted once into an offscreen canvas from many faint, randomly deformed layers of each shape,
// which gives the bleeding edges of a wash. Only ambient things (rain, lanterns, passing lights) animate on top.
// Close ups of faces and the small things people hold sit in deckled paper panels over the scene.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const LINE = '#3e2630'; //the few brush lines, on faces
const SET_FADE = 0.9; //seconds to crossfade between paintings
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

type Who = 'mei' | 'kenji' | 'sora' | 'ren' | 'kuroda' | 'coworker' | 'oldMan' | 'aoi';
type Hair = 'bob' | 'spiky' | 'ponytail' | 'messy' | 'bun' | 'grey' | 'long' | 'short';
type Mood = 'calm' | 'smile' | 'laugh' | 'cover' | 'grin' | 'soft';
type Arms = 'down' | 'up' | 'wave' | 'out' | 'hold' | 'pat' | 'mouth' | 'behind';
type Held = 'phone' | 'flowers' | 'skewer';

interface Look {
  hair: Hair;
  hairColor: string;
  skin: string;
  top: string;
  bottom: string;
  eyes: string;
}

const PEOPLE: Record<Who, Look> = {
  mei: { hair: 'bob', hairColor: '#3a2630', skin: '#f6e0d2', top: '#cf4636', bottom: '#a8382e', eyes: '#6a3c4c' },
  kenji: { hair: 'spiky', hairColor: '#2e2430', skin: '#efd3bf', top: '#5f6c8c', bottom: '#454b66', eyes: '#3d3550' },
  sora: { hair: 'ponytail', hairColor: '#7a4434', skin: '#f5dccb', top: '#ec8d74', bottom: '#d9735c', eyes: '#7a4a2c' },
  ren: { hair: 'messy', hairColor: '#4a3030', skin: '#f1d7c4', top: '#f4efea', bottom: '#5c5868', eyes: '#5a3a28' },
  kuroda: { hair: 'bun', hairColor: '#2a2128', skin: '#eed5c2', top: '#4f4656', bottom: '#4f4656', eyes: '#2f2a3a' },
  coworker: { hair: 'short', hairColor: '#5b4038', skin: '#ebcdb6', top: '#a9b8a2', bottom: '#6a6470', eyes: '#3a2f2a' },
  oldMan: { hair: 'grey', hairColor: '#dcd6da', skin: '#ebcfb8', top: '#8f8790', bottom: '#716a74', eyes: '#4a4048' },
  aoi: { hair: 'long', hairColor: '#33304a', skin: '#f6e0d0', top: '#b3c4b4', bottom: '#97ab9a', eyes: '#3d5a7a' },
};

interface Pose {
  sit?: boolean;
  arms?: Arms;
  lean?: number; //radians, tipping from the feet
  back?: boolean; //facing away
  held?: Held;
  robe?: boolean; //a long yukata with wide sleeves, and a smaller head
}

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'paper' | 'festival' | 'river' | 'rooftop' | 'train' | 'platform' | 'window';
type Thing = 'phone' | 'texts' | 'flowers' | 'note' | 'laptops';
type Panel = { who: Who; mood: Mood } | { thing: Thing };

interface Cue {
  set: SetId;
  beat?: string; //what the people in the set are doing
  panels?: Panel[]; //close ups, the first top right and the second top left
  card?: [kicker: string, name: string]; //a title card over the scene
}

const cues: Record<string, Cue> = {
  title_card: { set: 'paper', card: ['Four small moments', 'Reading People'] },

  chapter_lanterns: { set: 'festival', card: ['One', 'Lanterns'] },
  festival_wide: { set: 'festival' },
  friends_huddle: { set: 'festival', beat: 'huddle', panels: [{ thing: 'phone' }] },
  friends_laugh: { set: 'festival', beat: 'laugh', panels: [{ who: 'kenji', mood: 'laugh' }, { who: 'sora', mood: 'laugh' }] },
  mei_covers: { set: 'festival', beat: 'cover', panels: [{ who: 'mei', mood: 'cover' }] },
  mei_waves: { set: 'festival', beat: 'wave', panels: [{ who: 'mei', mood: 'smile' }] },
  sora_offers: { set: 'festival', beat: 'offer', panels: [{ who: 'sora', mood: 'smile' }] },
  friends_hold: { set: 'festival', beat: 'offer' },
  walk_home: { set: 'river' },

  chapter_rooftop: { set: 'rooftop', card: ['Two', 'The Rooftop'] },
  rooftop_wide: { set: 'rooftop' },
  rooftop_memory: { set: 'rooftop', panels: [{ thing: 'laptops' }] },
  kuroda_praises: { set: 'rooftop', beat: 'praise', panels: [{ who: 'kuroda', mood: 'smile' }] },
  ren_brags: { set: 'rooftop', beat: 'brag', panels: [{ who: 'ren', mood: 'grin' }] },
  ren_stretches: { set: 'rooftop', beat: 'stretch' },
  ren_hold: { set: 'rooftop', beat: 'stretch', panels: [{ who: 'ren', mood: 'grin' }] },
  kuroda_turns: { set: 'rooftop', beat: 'turn', panels: [{ who: 'kuroda', mood: 'calm' }] },
  kuroda_asks: { set: 'rooftop', beat: 'turn', panels: [{ who: 'kuroda', mood: 'calm' }, { who: 'ren', mood: 'calm' }] },

  chapter_train: { set: 'train', card: ['Three', 'The Last Train'] },
  train_wide: { set: 'train' },
  old_man_flowers: { set: 'train', panels: [{ thing: 'flowers' }] },
  old_man_talks: { set: 'train', beat: 'talk', panels: [{ who: 'oldMan', mood: 'soft' }] },
  old_man_pats: { set: 'train', beat: 'pat', panels: [{ who: 'oldMan', mood: 'smile' }] },
  old_man_hold: { set: 'train', beat: 'pat' },
  old_man_stands: { set: 'train', beat: 'stand' },
  old_man_home: { set: 'train', beat: 'stand', panels: [{ who: 'oldMan', mood: 'soft' }] },
  platform_leaves: { set: 'platform' },
  train_after: { set: 'train', beat: 'gone' },

  chapter_book: { set: 'window', card: ['Four', 'The Borrowed Book'] },
  window_rain: { set: 'window' },
  note_falls: { set: 'window', beat: 'note' },
  note_close: { set: 'window', beat: 'note', panels: [{ thing: 'note' }] },
  phone_buzz: { set: 'window', beat: 'phone' },
  aoi_text: { set: 'window', beat: 'phone', panels: [{ thing: 'texts' }, { who: 'aoi', mood: 'smile' }] },
  note_hold: { set: 'window', beat: 'phone', panels: [{ thing: 'note' }] },
  window_think: { set: 'window', beat: 'note' },
  closing: { set: 'window' },
};

const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// watercolor
// ---------------------------------------------------------------------------

//paintings use a seeded random so the same scene always comes out the same
let random = seeded(1);
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = () => (random() + random() + random() - 1.5) * 1.15;

//a fixed per-index random for the animated layer
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

function canvas2d(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return [el, el.getContext('2d')!];
}

const ellipse = (x: number, y: number, rx: number, ry: number, turn = 0, n = 22): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [px, py] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)];
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

//long edges deform by a lot, so a long flat shape is cut into short edges first to keep its outline steady
const densify = (points: Pt[], step = 40): Pt[] =>
  points.flatMap(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    return Array.from({ length: n }, (_, k): Pt => [ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  });

const arc = (x: number, y: number, rx: number, ry: number, from: number, to: number, n = 12): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
  });

const bend = ([ax, ay]: Pt, [bx, by]: Pt, [cx, cy]: Pt, n = 8): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 1) / n;
    return [(1 - u) ** 2 * ax + 2 * (1 - u) * u * bx + u * u * cx, (1 - u) ** 2 * ay + 2 * (1 - u) * u * by + u * u * cy];
  });

//a line thickened into a shape, narrowing from width to tip
function limb(points: Pt[], width: number, tip = width): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  points.forEach(([x, y], i) => {
    const [ax, ay] = points[Math.max(0, i - 1)];
    const [bx, by] = points[Math.min(points.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const half = (width + ((tip - width) * i) / (points.length - 1)) / 2;
    left.push([x - ((by - ay) / len) * half, y + ((bx - ax) / len) * half]);
    right.push([x + ((by - ay) / len) * half, y - ((bx - ax) / len) * half]);
  });
  return [...left, ...right.reverse()];
}

//a jagged horizon by midpoint displacement, closed down to the bottom
function ridge(x0: number, x1: number, y: number, height: number, rough: number, bottom: number): Pt[] {
  let points: Pt[] = [[x0, y - random() * height], [x1, y - random() * height]];
  for (let d = 0, amp = height; d < 7; d++, amp *= rough) {
    const next: Pt[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [[ax, ay], [bx, by]] = [points[i], points[i + 1]];
      next.push(points[i], [(ax + bx) / 2, (ay + by) / 2 + (random() - 0.5) * amp]);
    }
    next.push(points[points.length - 1]);
    points = next;
  }
  return [...points, [x1, bottom], [x0, bottom]];
}

//rooftops of a city, closed down to the bottom
function skyline(x0: number, x1: number, y: number, low: number, high: number, bottom: number): Pt[] {
  const points: Pt[] = [];
  for (let x = x0; x < x1; ) {
    const w = 40 + random() * 70;
    const h = low + random() * (high - low);
    points.push([x, y - h], [x + w, y - h]);
    x += w;
  }
  return [...points, [x1, bottom], [x0, bottom]];
}

//every edge gets a randomly offset midpoint, depth times over
function deform(points: Pt[], depth: number, spread: number): Pt[] {
  let out = points;
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [];
    out.forEach(([ax, ay], i) => {
      const [bx, by] = out[(i + 1) % out.length];
      const len = Math.hypot(bx - ax, by - ay) * spread;
      next.push([ax, ay], [(ax + bx) / 2 + gauss() * len, (ay + by) / 2 + gauss() * len]);
    });
    out = next;
  }
  return out;
}

const trace = (c: Ctx, points: Pt[]) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

interface Brush {
  layers: number;
  alpha: number;
  spread: number;
}
const SOLID: Brush = { layers: 9, alpha: 0.24, spread: 0.035 };
const SKIN: Brush = { layers: 9, alpha: 0.24, spread: 0.012 };
const THIN: Brush = { layers: 5, alpha: 0.32, spread: 0.02 };
const SOFT: Brush = { layers: 14, alpha: 0.07, spread: 0.1 };
const GLAZE: Brush = { layers: 4, alpha: 0.08, spread: 0.08 };

//the core of the look: a shape laid down as many faint, slightly different layers, pigment pooling at the edge
function wash(c: Ctx, points: Pt[], color: string | CanvasGradient, { layers, alpha, spread }: Brush = SOLID) {
  const base = deform(points, 2, spread);
  c.save();
  c.fillStyle = color;
  c.globalAlpha = alpha;
  for (let i = 0; i < layers; i++) {
    trace(c, deform(base, 2, spread * 0.8));
    c.fill();
  }
  c.strokeStyle = color;
  c.lineWidth = 1.2;
  c.globalAlpha = Math.min(1, alpha * 1.4);
  trace(c, base);
  c.stroke();
  c.restore();
}

//a soft blurred shape, for mist and glows. The shape is drawn off canvas and only its shadow lands
function mist(c: Ctx, points: Pt[], color: string, blur: number) {
  c.save();
  c.shadowColor = color;
  c.shadowBlur = blur;
  c.shadowOffsetX = 5000;
  c.translate(-5000, 0);
  c.fillStyle = '#000';
  trace(c, points);
  c.fill();
  c.restore();
}

//flecks of dry brush scattered around a point
function spatter(c: Ctx, x: number, y: number, rx: number, ry: number, color: string, n: number, size = 1.8) {
  c.save();
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    c.globalAlpha = 0.25 + random() * 0.5;
    c.beginPath();
    c.arc(x + gauss() * rx, y + gauss() * ry, 0.3 + random() * size, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

//flecks along the edge of a shape
function speckle(c: Ctx, points: Pt[], color: string, n: number, spread: number) {
  for (let i = 0; i < n; i++) {
    const [x, y] = points[Math.floor(random() * points.length)];
    spatter(c, x, y, spread, spread, color, 3);
  }
}

const vertical = (c: Ctx, y0: number, y1: number, stops: string[]) => {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach((stop, i) => g.addColorStop(i / (stops.length - 1), stop));
  return g;
};

const sky = (c: Ctx, stops: string[], y0 = 0, y1 = H) => {
  c.fillStyle = vertical(c, y0, y1, stops);
  c.fillRect(0, y0, W, y1 - y0);
};

function cloud(c: Ctx, x: number, y: number, w: number, h: number, color: string, brush = SOFT) {
  for (let i = 0; i < 5; i++)
    wash(c, ellipse(x + (random() - 0.5) * w, y + (random() - 0.5) * h * 0.5, w * (0.22 + random() * 0.2), h * (0.3 + random() * 0.25)), color, brush);
}

function birds(c: Ctx, x: number, y: number, n: number, spread: number) {
  c.save();
  c.strokeStyle = rgba(LINE, 0.7);
  c.lineWidth = 1.3;
  for (let i = 0; i < n; i++) {
    const [bx, by] = [x + gauss() * spread, y + gauss() * spread * 0.4];
    const s = 3 + random() * 4;
    c.beginPath();
    c.moveTo(bx - s, by - s * 0.5);
    c.quadraticCurveTo(bx - s * 0.3, by - s * 0.5, bx, by);
    c.quadraticCurveTo(bx + s * 0.3, by - s * 0.5, bx + s, by - s * 0.6);
    c.stroke();
  }
  c.restore();
}

//faint blotches over the whole painting, like pigment settling into paper
function mottle(c: Ctx, w: number, h: number) {
  for (let i = 0; i < 26; i++) {
    const r = 60 + random() * 180;
    wash(c, ellipse(random() * w, random() * h, r, r * (0.6 + random() * 0.4)), random() > 0.5 ? '#ffffff' : '#b98c90', { layers: 3, alpha: 0.025, spread: 0.15 });
  }
}

const line = (c: Ctx, points: Pt[], width: number, color = LINE, alpha = 0.85) => {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.restore();
};

const glow = (c: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};

// ---------------------------------------------------------------------------
// hair, heads and faces
// ---------------------------------------------------------------------------

//around the center of the head, radius r
function hairShapes({ hair }: Look, r: number, smooth = false): { back?: Pt[]; front: Pt[] } {
  const back: Partial<Record<Hair, Pt[]>> = {
    long: ellipse(0, r * 0.75, r * 1.15, r * 1.6),
    bob: ellipse(0, r * 0.15, r * 1.17, r * 0.98),
    ponytail: ellipse(r * 1.0, -r * 0.2, r * 0.38, r * 0.8, 0.5),
    bun: ellipse(0, -r * 1.05, r * 0.42, r * 0.42),
  };
  if (hair === 'grey') return { front: [...arc(0, 0, r * 1.04, r * 1.04, Math.PI * 1.08, Math.PI * 1.92), ...arc(0, -r * 0.1, r * 0.95, r * 0.6, Math.PI * 1.92, Math.PI * 1.08)] };

  //distant heads get one soft sweep of fringe instead of tufts
  if (smooth) return { back: back[hair], front: [...arc(0, 0, r * 1.06, r * 1.06, Math.PI, Math.PI * 2), ...bend([r * 1.06, r * 0.1], [r * 0.25, -r * 0.65], [-r * 1.06, r * 0.15])] };

  const front: Pt[] = [];
  const points = hair === 'spiky' ? 10 : hair === 'messy' ? 8 : 14;
  for (let i = 0; i <= points; i++) {
    const a = Math.PI + (Math.PI * i) / points;
    const out = r * (hair === 'spiky' && i % 2 ? 1.32 : hair === 'messy' && i % 2 ? 1.18 : 1.06);
    front.push([Math.cos(a) * out, Math.sin(a) * out]);
  }
  //bangs zigzag back across the forehead
  const tufts = hair === 'bun' ? 3 : hair === 'short' ? 4 : 5;
  for (let i = 1; i <= tufts * 2; i++) front.push([r * 1.06 - (r * 2.12 * i) / (tufts * 2), i % 2 ? -r * 0.02 : -r * 0.42]);
  return { back: back[hair], front };
}

//round on top, coming to a soft chin
const headShape = (r: number): Pt[] => [...arc(0, 0, r, r, Math.PI, Math.PI * 2), ...bend([r, 0], [r * 0.95, r * 0.85], [0, r * 1.16]), ...bend([0, r * 1.16], [-r * 0.95, r * 0.85], [-r, 0])];

//a head too small for a face, the way distant figures are painted
function smallHead(c: Ctx, look: Look, r: number, back?: boolean) {
  const hair = hairShapes(look, r, true);
  if (hair.back) wash(c, hair.back, look.hairColor);
  wash(c, headShape(r), look.skin, SKIN);
  if (back) return wash(c, ellipse(0, -r * 0.05, r * 1.06, r * 1.1), look.hairColor);
  for (const side of [-1, 1]) wash(c, ellipse(side * r * 0.55, r * 0.5, r * 0.18, r * 0.09), '#e88c88', GLAZE);
  wash(c, hair.front, look.hairColor);
}

const shut = (mood: Mood) => mood === 'laugh' || mood === 'grin' || mood === 'smile';

function eye(c: Ctx, x: number, y: number, r: number, color: string, wide: number) {
  const [rx, ry] = [r * 0.15 * wide, r * 0.2 * wide];
  wash(c, ellipse(x, y, rx, ry), color, THIN);
  wash(c, ellipse(x, y + ry * 0.2, rx * 0.5, ry * 0.5), LINE, THIN);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath();
  c.arc(x - rx * 0.35, y - ry * 0.35, rx * 0.3, 0, Math.PI * 2);
  c.fill();
  line(c, arc(x, y, rx * 1.2, ry * 1.05, Math.PI * 1.1, Math.PI * 1.9), 3.5);
}

//a close up face for the panels, with shoulders
function face(c: Ctx, who: Who, mood: Mood, r: number) {
  const look = PEOPLE[who];
  wash(c, ellipse(0, r * 2.05, r * 1.65, r * 1.0), look.top);
  wash(c, rect(-r * 0.26, r * 0.7, r * 0.52, r * 0.6), look.skin, SKIN);
  const hair = hairShapes(look, r);
  if (hair.back) wash(c, hair.back, look.hairColor);
  wash(c, headShape(r), look.skin, SKIN);
  wash(c, ellipse(r * 0.55, r * 0.3, r * 0.35, r * 0.65), '#c98078', GLAZE);

  for (const side of [-1, 1]) {
    const [x, y] = [side * r * 0.4, r * 0.3];
    if (shut(mood)) line(c, arc(x, y + r * 0.08, r * 0.15, r * 0.15, Math.PI * 1.15, Math.PI * 1.85), 3);
    else if (mood === 'soft') {
      c.save();
      c.beginPath();
      c.rect(x - r * 0.3, y, r * 0.6, r * 0.4);
      c.clip();
      eye(c, x, y, r, look.eyes, 1);
      c.restore();
      line(c, bend([x - r * 0.19, y + r * 0.01], [x, y - r * 0.06], [x + r * 0.19, y + r * 0.01]), 3);
    } else eye(c, x, y, r, look.eyes, mood === 'cover' ? 1.18 : 1);
    //brows lift in the middle when soft
    const lift = mood === 'soft' ? r * 0.05 : 0;
    line(c, [[x - side * r * 0.15, y - r * 0.3 - lift], ...bend([x - side * r * 0.15, y - r * 0.3 - lift], [x, y - r * 0.37], [x + side * r * 0.16, y - r * 0.3])], 2.2, LINE, 0.6);
    wash(c, ellipse(side * r * 0.6, r * 0.62, r * 0.18, r * 0.09), '#e8807c', { layers: 5, alpha: 0.07, spread: 0.1 });
    if (who === 'oldMan') {
      line(c, arc(x, y, r * 0.24, r * 0.2, 0, Math.PI * 2, 24), 1.6, '#6a5a60', 0.7);
      line(c, [[x + side * r * 0.28, y + r * 0.06], [x + side * r * 0.37, y + r * 0.13]], 1.4, LINE, 0.4);
    }
  }

  const my = r * 0.72;
  if (mood === 'calm') line(c, [[-r * 0.08, my], [r * 0.08, my]], 2.5, LINE, 0.7);
  if (mood === 'smile' || mood === 'soft') line(c, arc(0, my - r * 0.1, r * 0.12, r * 0.12, Math.PI * 0.2, Math.PI * 0.8), 2.5, LINE, 0.7);
  if (mood === 'laugh' || mood === 'grin') {
    const w = mood === 'grin' ? 0.26 : 0.19;
    const mouth: Pt[] = [[-r * w, my - r * 0.05], ...bend([-r * w, my - r * 0.05], [0, my + r * 0.36], [r * w, my - r * 0.05])];
    wash(c, mouth, mood === 'grin' ? '#fbf3ee' : '#b4505a', THIN);
    if (mood === 'grin') wash(c, ellipse(0, my + r * 0.1, r * w * 0.55, r * 0.05), '#b4505a', THIN);
  }
  if (mood === 'cover') {
    wash(c, ellipse(0, r * 0.74, r * 0.36, r * 0.24), look.skin, SKIN);
    for (const x of [-0.12, 0, 0.12]) line(c, [[x * r, r * 0.56], [x * r, r * 0.7]], 1.5, LINE, 0.35);
  }
  if (who === 'oldMan') line(c, [[-r * 0.16, r * 0.27], [r * 0.16, r * 0.27]], 1.6, '#6a5a60', 0.7);
  wash(c, hair.front, look.hairColor);
}

// ---------------------------------------------------------------------------
// bodies and the things they hold
// ---------------------------------------------------------------------------

function bouquet(c: Ctx, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const blooms: Pt[] = [[-22, -38], [22, -36], [0, -50], [-10, -26], [12, -24], [-28, -20], [28, -18]];
  for (const [bx, by] of blooms.slice(0, 5)) line(c, [[0, 10], [bx, by]], 3, '#6f9466', 0.8);
  for (const [bx, by] of blooms) {
    wash(c, ellipse(bx + 2, by + 3, 11, 10), '#b9c2cc', GLAZE);
    wash(c, ellipse(bx, by, 11, 10), '#fbfaf6', THIN);
    wash(c, ellipse(bx, by, 3.5, 3.5), '#eac35c', THIN);
  }
  wash(c, [[-32, -12], [32, -12], [0, 60]], '#e6d4b4', THIN);
  c.restore();
}

function held(c: Ctx, thing: Held, [x, y]: Pt) {
  if (thing === 'flowers') bouquet(c, x, y - 8, 0.55);
  if (thing === 'phone') {
    mist(c, ellipse(x, y - 6, 14, 14), 'rgba(210,235,255,0.9)', 20);
    wash(c, rect(x - 7, y - 16, 14, 22), '#3a2c36', THIN);
  }
  if (thing === 'skewer') {
    line(c, [[x, y], [x + 18, y - 34]], 2.5, '#d9b98a', 1);
    for (let i = 0; i < 3; i++) wash(c, ellipse(x + 8 + i * 4, y - 14 - i * 8, 5, 5), '#b8743f', THIN);
  }
}

//a full figure standing (or sitting) with its feet at x, y. Unscaled it is about 210 tall
function person(c: Ctx, who: Who, x: number, y: number, s: number, pose: Pose = {}) {
  const look = PEOPLE[who];
  const { arms = 'down' } = pose;
  const hip = pose.sit ? -70 : -88;
  const neck = hip - 72;
  const head = neck - (pose.robe ? 20 : 26);
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(pose.lean ?? 0);

  const hanging = (side: number) => arms === 'down' || (side < 0 && arms !== 'hold' && arms !== 'pat' && arms !== 'up');
  if (pose.robe) robe(c, look, neck, hanging);
  else if (pose.sit) {
    wash(c, rect(-24, hip - 6, 48, 24), look.bottom);
    for (const lx of [-20, 4]) wash(c, rect(lx, hip + 14, 16, -hip - 14), look.bottom);
  } else for (const lx of [-19, 3]) wash(c, rect(lx, hip, 16, -hip), look.bottom);
  if (!pose.robe) for (const fx of [-11, 11]) wash(c, ellipse(fx, -3, 11, 5), '#4a3a40', THIN);

  if (!pose.robe) wash(c, [[-22, hip + 8], [-28, neck + 8], [-10, neck - 2], [10, neck - 2], [28, neck + 8], [22, hip + 8]], look.top);
  if (!pose.robe) wash(c, [[6, hip + 8], [16, neck + 4], [28, neck + 8], [22, hip + 8]], '#5a2840', GLAZE);

  const down = (side: number): Pt[] => [[side * 32, hip - 30], [side * 33, hip]];
  const reach: Record<Arms, [Pt[], Pt[]]> = {
    down: [down(-1), down(1)],
    up: [[[-40, neck - 40], [-30, head - 44]], [[40, neck - 40], [30, head - 44]]],
    wave: [down(-1), [[48, neck - 10], [56, neck - 58]]],
    out: [down(-1), [[40, hip - 20], [70, hip - 26]]],
    hold: [[[-30, hip - 22], [-8, hip - 12]], [[30, hip - 22], [8, hip - 12]]],
    pat: [[[-30, hip - 22], [-8, hip - 12]], [[42, hip - 14], [76, hip + 4]]],
    mouth: [down(-1), [[32, hip - 8], [6, head + 16]]],
    behind: [down(-1), [[48, neck - 34], [18, head - 12]]],
  };
  const [left, right] = reach[arms];
  for (const [side, points] of [[-1, left], [1, right]] as [number, Pt[]][]) {
    if (pose.robe && hanging(side)) continue; //hanging sleeves are part of the robe
    wash(c, limb([[side * 24, neck + 10], ...points], pose.robe ? 18 : 13, pose.robe ? 15 : 10), look.top);
    wash(c, ellipse(points[1][0], points[1][1], 6.5, 6.5), look.skin, SKIN);
  }
  if (pose.held) held(c, pose.held, (arms === 'hold' || arms === 'pat' ? left : right)[1]);

  c.translate(0, head);
  smallHead(c, look, pose.robe ? 19 : 25, pose.back);
  c.restore();
}

//a yukata from the neck to the ground, with an obi, a trailing sash and sleeves hanging when the arms are down
function robe(c: Ctx, look: Look, neck: number, hanging: (side: number) => boolean) {
  const obi = neck + 58;
  wash(c, limb(bend([18, obi + 6], [60, obi + 70], [40, -6], 10), 7, 2), rgba(look.bottom, 0.8), SOFT);
  wash(c, [[-20, neck + 6], [-10, neck - 2], [10, neck - 2], [20, neck + 6], [24, obi], [34, -4], [-34, -4], [-24, obi]], look.top);
  wash(c, [[4, neck], [20, neck + 6], [24, obi], [34, -4], [12, -4]], look.bottom, GLAZE);
  line(c, [[-10, neck - 2], [8, obi]], 1.5, '#ffffff', 0.5);
  wash(c, rect(-24, obi - 8, 48, 16), '#f2dcc6', THIN);
  for (const side of [-1, 1])
    if (hanging(side))
      wash(c, [[side * 18, neck + 6], [side * 38, neck + 22], [side * 42, neck + 80], [side * 26, neck + 90], [side * 20, neck + 40]], look.top);
}

//a background person, one flat wash
function passerby(c: Ctx, x: number, y: number, s: number, color: string) {
  wash(c, rect(x - 22 * s, y - 150 * s, 44 * s, 150 * s), color, SOFT);
  wash(c, ellipse(x, y - 178 * s, 24 * s, 24 * s), color, SOFT);
}

// ---------------------------------------------------------------------------
// paintings, made once per set and beat
// ---------------------------------------------------------------------------

function paperScene(c: Ctx) {
  sky(c, ['#a6d2e2', '#cfe4ea', '#f4e8e4', '#f1d8d0']);
  cloud(c, 320, 130, 560, 170, '#ee978a');
  cloud(c, 1050, 100, 640, 150, '#f2b4a8');
  cloud(c, 650, 330, 760, 120, '#f8dcd5');
  cloud(c, 200, 470, 500, 90, '#ef9f92');
  wash(c, ridge(-50, W + 50, 600, 140, 0.55, 760), vertical(c, 460, 700, ['#c9aab4', 'rgba(240,226,226,0)']), SOFT);
  mist(c, rect(-200, 560, W + 400, 110), 'rgba(250,240,236,0.95)', 70);
  const cliff = deform([[1180, H], [1260, 560], [1330, 330], [1420, 150], [1500, 50], [W + 30, -20], [W + 30, H]], 3, 0.05);
  wash(c, cliff, vertical(c, 0, H, ['#9b5a58', '#b48a92', 'rgba(220,200,206,0.2)']), { layers: 12, alpha: 0.12, spread: 0.03 });
  speckle(c, cliff, '#7d4a4c', 140, 18);
  mist(c, rect(1100, 620, 600, 200), 'rgba(248,238,236,0.9)', 80);
  const near = ridge(-50, 1000, 820, 120, 0.5, H + 20);
  wash(c, near, vertical(c, 680, H, ['#c98a86', '#e9cdc6']), { layers: 12, alpha: 0.1, spread: 0.04 });
  speckle(c, near, '#a8605c', 90, 14);
  birds(c, 420, 520, 14, 120);
  birds(c, 1150, 760, 5, 60);
}

//lanterns strung across the festival, shared with the animated glow
const FESTIVAL_LANTERNS = [0, 1].flatMap((row) => {
  const [y0, y1, sag] = row ? [230, 200, 60] : [110, 150, 70];
  return Array.from({ length: 11 }, (_, k) => {
    const u = (k + 1) / 12;
    return { x: u * W, y: y0 + (y1 - y0) * u + sag * 4 * u * (1 - u), r: 20 - row * 4, red: (k + 1 + row) % 3 !== 0, row };
  });
});

//a tiered pagoda, painted as one soft shape in the distance
function pagoda(c: Ctx, x: number, y: number, s: number, color: string) {
  const brush = { layers: 8, alpha: 0.14, spread: 0.03 };
  for (let k = 0; k < 4; k++) {
    const [w, ty] = [(60 - k * 9) * s, y - k * 38 * s];
    wash(c, rect(x - w * 0.55, ty - 26 * s, w * 1.1, 26 * s), color, brush);
    wash(c, [[x - w, ty - 22 * s], [x - w * 0.6, ty - 34 * s], [x + w * 0.6, ty - 34 * s], [x + w, ty - 22 * s], [x + w * 0.7, ty - 28 * s], [x - w * 0.7, ty - 28 * s]], color, brush);
  }
  line(c, [[x, y - 152 * s], [x, y - 200 * s]], 2 * s, color, 0.8);
}

function festivalScene(c: Ctx, beat?: string) {
  //a summer dusk in flat bands, each with its own edge
  const flat = { layers: 8, alpha: 0.22, spread: 0.02 };
  c.fillStyle = '#93bccd';
  c.fillRect(0, 0, W, H);
  for (const [y, color] of [[140, '#a9cccf'], [230, '#c7d8c8'], [310, '#e6dcb8'], [380, '#f2d2a6']] as [number, string][])
    wash(c, densify(ridge(-50, W + 50, y, 30, 0.45, H)), color, flat);
  const crisp = { layers: 8, alpha: 0.18, spread: 0.04 };
  cloud(c, 260, 90, 600, 120, '#f6ecd8', crisp);
  cloud(c, 1200, 70, 620, 110, '#eeb39c', crisp);
  cloud(c, 1350, 250, 460, 60, '#fbf3e4', crisp);
  cloud(c, 180, 280, 420, 60, '#f1c9a6', crisp);
  birds(c, 520, 330, 9, 140);

  //a mountain far behind the town, then green ridges stepping darker toward us
  const peak = deform([[-50, 520], [420, 330], [700, 175], [760, 165], [830, 185], [1150, 340], [W + 50, 470], [W + 50, 560], [-50, 560]], 3, 0.02);
  wash(c, peak, vertical(c, 160, 520, ['#6f8f97', '#88a7a4']), flat);
  wash(c, deform([[640, 230], [700, 175], [760, 165], [830, 185], [880, 240], [830, 225], [790, 250], [740, 222], [690, 248]], 2, 0.02), '#eef2ea', THIN);
  speckle(c, peak.slice(0, Math.floor(peak.length / 2)), '#56747c', 60, 10);
  mist(c, rect(-200, 330, W + 400, 30), 'rgba(240,236,214,0.7)', 26);
  const hills: [number, number, string][] = [[400, 70, '#9fb98f'], [438, 55, '#7f9e74'], [470, 40, '#64835d']];
  hills.forEach(([y, height, color], i) => {
    wash(c, densify(ridge(-50, W + 50, y, height, 0.5, H)), color, flat);
    if (i === 0) {
      pagoda(c, 330, y - 10, 0.75, '#5d6f63');
      spatter(c, 330, y - 30, 120, 30, '#4f6b52', 70);
    }
    mist(c, rect(-200, y + 8, W + 400, 12), 'rgba(240,236,214,0.5)', 16);
  });
  for (const [y, color] of [[612, '#e6d6b6'], [700, '#cdbb98'], [790, '#ab9d7e']] as [number, string][])
    wash(c, densify(ridge(-50, W + 50, y, 18, 0.4, H + 20)), color, flat);

  //stalls glowing under their awnings, softened by the haze
  const stall = { layers: 9, alpha: 0.15, spread: 0.05 };
  for (const [i, x, roof] of [[0, 60, '#cf4636'], [1, 450, '#7884a6'], [2, 860, '#cf4636'], [3, 1260, '#d99a52']] as [number, number, string][]) {
    wash(c, rect(x, 470, 300, 150), '#f6d8bd', stall);
    mist(c, ellipse(x + 150, 545, 150, 70), 'rgba(255,208,140,0.95)', 50);
    for (let k = 0; k < 3; k++) passerby(c, x + 70 + k * 80, 590, 0.32, rgba('#8a5a5a', 0.4 + rand(i * 3 + k) * 0.3));
    for (let s = 0; s < 6; s++) wash(c, [...rect(x - 15 + s * 55, 430, 55, 50).slice(0, 3), ...arc(x + 12.5 + s * 55, 480, 27.5, 20, 0, Math.PI)], s % 2 ? '#fbf1e6' : roof, stall);
    wash(c, rect(x, 588, 300, 40), '#9a6a58', stall);
    mist(c, ellipse(x + 150, 700, 190, 40), 'rgba(255,200,140,0.6)', 60);
  }

  //festival-goers further off, half lost in the haze
  for (let i = 0; i < 14; i++) passerby(c, 30 + i * 62 + rand(i) * 30, 690 + rand(i + 2) * 20, 0.45 + rand(i + 4) * 0.12, rgba('#66735f', 0.35 + rand(i + 6) * 0.25));

  for (const row of [0, 1]) {
    const lanterns = FESTIVAL_LANTERNS.filter((l) => l.row === row);
    line(c, [[0, row ? 230 : 110], ...lanterns.map(({ x, y }): Pt => [x, y]), [W, row ? 200 : 150]], 1.2, '#6a4a4a', 0.4);
    for (const { x, y, r, red } of lanterns) {
      mist(c, ellipse(x, y + r * 1.3, r * 1.4, r * 1.4), red ? 'rgba(240,110,80,0.5)' : 'rgba(250,190,110,0.5)', 30);
      wash(c, ellipse(x, y + r * 1.3, r * 0.9, r), red ? '#d63c2c' : '#ec9a4a', THIN);
      wash(c, ellipse(x - r * 0.25, y + r * 1.1, r * 0.35, r * 0.5), red ? '#f07258' : '#f6c27a', GLAZE);
      wash(c, rect(x - r * 0.3, y + r * 0.25, r * 0.6, r * 0.14), '#3b2a30', THIN);
      wash(c, limb([[x, y + r * 2.3], [x + 2, y + r * 3.4]], 2.5, 0.5), '#c43a2c', THIN);
    }
  }
  spatter(c, 800, 780, 700, 60, '#7a6a50', 320);

  //the friends, in yukata
  const lean = beat === 'huddle' ? 0.08 : 0;
  person(c, 'mei', 990, 800, 1.35, { robe: true, lean, arms: beat === 'cover' ? 'mouth' : beat === 'wave' ? 'wave' : 'down' });
  person(c, 'kenji', 1110, 800, 1.42, { robe: true, arms: 'hold', held: 'phone' });
  person(c, 'sora', 1235, 800, 1.35, { robe: true, lean: -lean, arms: beat === 'offer' ? 'out' : 'down', held: beat === 'offer' ? 'skewer' : undefined });
}

function riverScene(c: Ctx) {
  sky(c, ['#2c3154', '#4b4870', '#86708a', '#c39598'], 0, 540);
  cloud(c, 400, 180, 700, 80, '#6a5878');
  cloud(c, 1200, 300, 600, 70, '#a5808f');
  mist(c, ellipse(1200, 170, 90, 90), 'rgba(255,240,215,0.7)', 90);
  wash(c, ellipse(1200, 170, 56, 56), '#f7efdf', SOLID);
  spatter(c, 800, 120, 700, 90, '#fbf2dc', 120, 1.2);
  const bank = skyline(-20, W + 20, 525, 30, 130, 540);
  wash(c, bank, '#3c3658', { layers: 10, alpha: 0.18, spread: 0.02 });
  for (let i = 0; i < 40; i++) {
    const [x, y] = bank[Math.floor(random() * (bank.length - 2))];
    if (y < 500) wash(c, rect(x + 10 + random() * 30, y + 14 + random() * 30, 8, 10), '#f4c46e', THIN);
  }
  mist(c, rect(-200, 510, W + 400, 50), 'rgba(200,170,190,0.8)', 40);
  sky(c, ['#4a4466', '#2b2a48', '#1d1d36'], 540, H);
  for (let i = 0; i < 16; i++) wash(c, rect(1150 + gauss() * 20, 550 + i * 20, 90 - i * 3, 4), '#f3e3c8', GLAZE);
  wash(c, ridge(-50, 500, 860, 50, 0.5, H + 20), '#1a1a30', SOLID);
}

function rooftopScene(c: Ctx, beat?: string) {
  sky(c, ['#8fc6dc', '#bde0ea', '#eef2ee'], 0, 560);
  cloud(c, 300, 80, 600, 150, '#f09c90');
  cloud(c, 1150, 60, 700, 140, '#f5c0b6');
  cloud(c, 800, 230, 500, 90, '#ffffff');
  cloud(c, 120, 300, 400, 80, '#f8d6cf');
  for (const [i, color, low, high] of [[0, '#cdbcc6', 120, 240], [1, '#a9939f', 70, 170], [2, '#8f7684', 40, 110]] as [number, string, number, number][]) {
    wash(c, skyline(-20, W + 20, 560, low, high, 580), color, { layers: 8, alpha: 0.16, spread: 0.015 });
    mist(c, rect(-200, 520 - i * 10, W + 400, 50), 'rgba(246,238,236,0.85)', 40);
  }
  sky(c, ['#e8dcd6', '#cbb8b2'], 560, H);
  for (let i = 0; i < 10; i++) wash(c, ellipse(random() * W, 620 + random() * 260, 200, 30), '#b49c98', GLAZE);
  line(c, [[0, 470], [W, 470]], 6, '#6e5f6a', 0.7);
  line(c, [[0, 515], [W, 515]], 3, '#6e5f6a', 0.6);
  for (let x = 20; x < W; x += 90) line(c, [[x, 470], [x, 560]], 3, '#6e5f6a', 0.6);
  wash(c, rect(120, 560, 170, 110), '#c8b8b2');

  wash(c, rect(520, 620, 560, 20), '#b07b5e');
  for (const x of [550, 1030]) wash(c, rect(x, 640, 16, 90), '#7d5848');
  person(c, 'coworker', 640, 720, 1.4, { sit: true, arms: 'hold' });
  wash(c, rect(730, 600, 60, 22), '#cf4636', THIN);
  const ren: Pose = beat === 'brag' ? { arms: 'behind' } : beat === 'stretch' ? { arms: 'up' } : { arms: 'hold' };
  person(c, 'ren', 880, 720, 1.4, { sit: true, ...ren });
  wash(c, rect(960, 600, 60, 22), '#6f7fa3', THIN);
  person(c, 'kuroda', 1220, 750, 1.45, { arms: beat === 'praise' ? 'out' : 'down', lean: beat === 'turn' ? -0.04 : 0 });
  birds(c, 900, 200, 6, 160);
}

const TRAIN_WINDOWS = [0, 1, 2, 3].map((i) => 30 + i * 400);

function trainScene(c: Ctx, beat?: string) {
  sky(c, ['#f3e6dc', '#ead6cc']);
  mottle(c, W, H);
  for (let x = 40; x < W; x += 280) wash(c, rect(x, 60, 220, 60), ['#efb3a8', '#c4d2c2', '#ecd6a4'][Math.floor(x / 280) % 3], THIN);
  for (const x of TRAIN_WINDOWS) {
    c.save();
    c.beginPath();
    c.roundRect(x, 150, 340, 290, 18);
    c.clip();
    c.fillStyle = vertical(c, 150, 440, ['#2c3154', '#4d4670', '#7d6383']);
    c.fillRect(x, 150, 340, 290);
    wash(c, ridge(x - 40, x + 380, 400, 60, 0.5, 450), '#2a2846', SOFT);
    mist(c, rect(x - 40, 380, 420, 30), 'rgba(160,130,160,0.6)', 30);
    c.restore();
    c.strokeStyle = 'rgba(150,120,115,0.8)';
    c.lineWidth = 7;
    c.beginPath();
    c.roundRect(x, 150, 340, 290, 18);
    c.stroke();
  }
  line(c, [[0, 40], [W, 40]], 5, '#9e9088', 0.8);
  for (let x = 100; x < W; x += 160) {
    line(c, [[x, 40], [x, 110]], 3, '#7d6e6a', 0.8);
    line(c, arc(x, 122, 12, 12, 0, Math.PI * 2, 20), 3.5, '#7d6e6a', 0.8);
  }
  //a long bench under the windows: a cushion per bay, poles between them, the heater skirt below
  sky(c, ['#c9b3aa', '#a9938c'], 690, H);
  wash(c, densify(rect(-10, 596, W + 20, 96)), '#5e424a');
  for (let x = -10; x < W + 20; x += 24) line(c, [[x, 630], [x, 676]], 2, '#4a3038', 0.35);
  for (const x of TRAIN_WINDOWS) {
    wash(c, densify(rect(x - 16, 458, 372, 104), 30), '#b04c46');
    for (let k = 1; k < 4; k++) line(c, [[x - 16 + k * 93, 466], [x - 16 + k * 93, 556]], 2, '#8a3634', 0.3);
    wash(c, densify(rect(x - 22, 552, 384, 48), 30), '#c66258');
    wash(c, densify(rect(x - 22, 586, 384, 14), 30), '#8a3a38', GLAZE);
  }
  for (const x of [400, 800, 1200]) {
    line(c, [[x, 150], [x, 690]], 7, '#b8acaa', 0.9);
    line(c, [[x - 2, 150], [x - 2, 690]], 2, '#ffffff', 0.5);
  }
  for (let i = 0; i < 8; i++) wash(c, ellipse(random() * W, 720 + random() * 160, 220, 26), '#8f7a76', GLAZE);

  if (beat === 'gone') return wash(c, ellipse(1020, 576, 7, 4), '#fbfaf5', THIN); //one white petal left on the seat
  if (beat === 'stand') person(c, 'oldMan', 1360, 770, 1.55, { arms: 'hold', held: 'flowers' });
  else person(c, 'oldMan', 1000, 690, 1.5, { sit: true, arms: beat === 'pat' ? 'pat' : 'hold', held: 'flowers', lean: beat === 'talk' ? 0.05 : 0 });
}

const PLATFORM_WINDOW: [number, number, number, number, number] = [260, 110, 1080, 520, 30];

//what's outside the door window, wider than the screen so the train can pull away from it
function platformView(c: Ctx) {
  const w = W + 1400;
  c.fillStyle = vertical(c, 110, 470, ['#252a4a', '#4a4670', '#7d6383']);
  c.fillRect(0, 0, w, H);
  spatter(c, w / 2, 220, w / 2, 60, '#fbf2dc', 160, 1.2);
  wash(c, rect(-20, 100, w + 40, 70), '#2a2840', { layers: 6, alpha: 0.25, spread: 0.01 });
  c.fillStyle = vertical(c, 470, 640, ['#a59aa6', '#857a88']);
  c.fillRect(0, 470, w, 170);
  for (let i = 0; i < 12; i++) wash(c, ellipse(random() * w, 500 + random() * 120, 200, 20), '#6e6274', GLAZE);
  line(c, [[0, 636], [w, 636]], 8, '#e3c45a', 0.9);
  c.fillStyle = '#1d1c2c';
  c.fillRect(0, 640, w, 100);
  for (let x = 160; x < w; x += 300) {
    line(c, [[x + 120, 170], [x + 120, 470]], 10, '#3a3650', 0.9);
    line(c, [[x, 170], [x, 200]], 3, '#4a4660', 0.9);
    mist(c, ellipse(x, 260, 110, 150), 'rgba(255,225,165,0.55)', 70);
    wash(c, ellipse(x, 210, 16, 10), '#fff2c8', THIN);
  }
  person(c, 'oldMan', 760, 600, 0.9, { back: true, arms: 'hold' });
}

function platformFrame(c: Ctx) {
  c.fillStyle = vertical(c, 0, H, ['#efe2d6', '#e3d0c6']);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.roundRect(...PLATFORM_WINDOW);
  c.fill('evenodd');
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.roundRect(...PLATFORM_WINDOW);
  c.clip('evenodd');
  mottle(c, W, H);
  c.restore();
  c.save();
  c.beginPath();
  c.roundRect(...PLATFORM_WINDOW);
  c.clip();
  for (let x = 0; x < W; x += 260) wash(c, [[x + 300, 100], [x + 360, 100], [x + 220, 640], [x + 160, 640]], 'rgba(255,255,255,1)', { layers: 3, alpha: 0.03, spread: 0.02 });
  c.restore();
  c.strokeStyle = 'rgba(140,110,108,0.85)';
  c.lineWidth = 10;
  c.beginPath();
  c.roundRect(...PLATFORM_WINDOW);
  c.stroke();
  sky(c, ['#c9b3aa', '#a9938c'], 700, H);
}

function windowScene(c: Ctx, beat?: string) {
  sky(c, ['#efe4de', '#e2d4ce']);
  mottle(c, W, H);
  c.save();
  c.beginPath();
  c.roundRect(240, 60, 1120, 500, 12);
  c.clip();
  sky(c, ['#93a2b8', '#bcc0cc', '#dbd2d4'], 60, 560);
  cloud(c, 500, 140, 700, 120, '#8392aa');
  cloud(c, 1100, 120, 600, 100, '#a29fb4');
  for (const [i, color] of [[0, '#b0aebd'], [1, '#8f8ba2'], [2, '#77728c']] as [number, string][]) {
    const roofs: Pt[] = [];
    for (let x = 200; x < 1400; ) {
      const [w, h] = [60 + random() * 60, 50 + i * 30 + random() * 70];
      roofs.push([x, 560 - h + 20 * i], [x + w / 2, 530 - h + 20 * i], [x + w, 560 - h + 20 * i]);
      x += w;
    }
    wash(c, [...roofs, [1400, 600], [200, 600]], color, { layers: 8, alpha: 0.12, spread: 0.02 });
    mist(c, rect(100, 470 + i * 25, 1400, 40), 'rgba(225,222,230,0.8)', 35);
  }
  c.restore();
  for (const [x, y, w, h] of [[232, 52, 1136, 16], [232, 552, 1136, 16], [232, 52, 16, 516], [1352, 52, 16, 516], [794, 60, 12, 500], [240, 304, 1120, 12]])
    wash(c, rect(x, y, w, h), '#b38e70', THIN);

  sky(c, ['#d6c8c4', '#c3b2ae'], 595, H);
  wash(c, rect(200, 555, 1200, 40), '#c49a72');
  wash(c, [[310, 500], [370, 500], [360, 556], [320, 556]], '#cf7b5c', THIN);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.4;
    wash(c, ellipse(340 + Math.cos(a) * 40, 500 + Math.sin(a) * 40, 30, 11, a), '#7e9c78', THIN);
  }
  wash(c, [[640, 552], [660, 520], [770, 526], [770, 556]], '#fbf8f2', THIN);
  wash(c, [[770, 556], [770, 526], [880, 520], [900, 552]], '#f2ece0', THIN);
  for (let k = 0; k < 4; k++) {
    line(c, [[672 + k * 4, 530 + k * 6], [760, 534 + k * 6]], 1.2, LINE, 0.25);
    line(c, [[780, 534 + k * 6], [870 - k * 4, 530 + k * 6]], 1.2, LINE, 0.25);
  }
  wash(c, rect(1160, 506, 50, 50), '#c9463a');
  line(c, arc(1214, 530, 13, 13, -Math.PI / 2, Math.PI / 2), 5, '#c9463a', 0.9);
  if (beat === 'note' || beat === 'phone') {
    c.save();
    c.translate(950, 545);
    c.rotate(-0.12);
    wash(c, rect(-26, -10, 52, 18), '#fbf6ea', THIN);
    line(c, [[-26, -1], [26, -1]], 1.2, LINE, 0.3);
    c.restore();
  }
  if (beat === 'phone') wash(c, rect(1040, 542, 60, 12), '#3a2c36', THIN);

  //curtains drawn back to either side
  line(c, [[90, 36], [W - 90, 36]], 6, '#8a6a58', 0.8);
  for (const side of [1, -1]) {
    const x = (px: number) => (side > 0 ? px : W - px);
    wash(c, densify([[x(100), 36], [x(330), 36], [x(300), 300], [x(255), 470], [x(290), 650], [x(96), 670], [x(86), 300]], 30), '#dca39b');
    for (const fx of [140, 190, 240]) wash(c, limb([[x(fx), 40], [x(fx + 10), 300], [x(fx * 0.4 + 110), 470], [x(fx * 0.7 + 60), 660]], 6, 10), '#b9706a', GLAZE);
    wash(c, densify(rect(side > 0 ? 236 : W - 300, 458, 64, 18), 16), '#a85e58', THIN);
  }

  //the window seat, with cushions, a blanket and a sleeping cat
  wash(c, densify(rect(170, 690, 1260, 220)), '#c7b0aa');
  wash(c, densify(rect(160, 598, 1280, 96), 30), '#ecdcd2');
  wash(c, densify(rect(160, 676, 1280, 18), 30), '#b89a92', GLAZE);
  wash(c, ellipse(310, 598, 90, 62, -0.2), '#d98f86');
  wash(c, ellipse(1300, 604, 84, 58, 0.25), '#a9b8a0');
  wash(c, densify([[740, 616], [1000, 612], [1024, 700], [996, 800], [780, 806], [756, 700]], 30), '#d9b26a');
  for (const fx of [790, 840, 890, 940, 985]) line(c, [[fx, 620], [fx + 4, 700], [fx - 4, 800]], 3, '#b58c48', 0.45);
  const cat = '#8a8090';
  wash(c, ellipse(1100, 612, 72, 34), cat);
  wash(c, limb([[1166, 622], [1150, 650], [1080, 650], [1040, 640]], 14, 6), cat);
  wash(c, ellipse(1046, 598, 28, 24), cat);
  wash(c, [[1026, 586], [1030, 560], [1044, 580]], cat, THIN);
  wash(c, [[1050, 578], [1064, 558], [1068, 584]], cat, THIN);
  for (const sx of [1036, 1056]) line(c, arc(sx, 600, 5, 4, 0.1, Math.PI - 0.1), 1.6, LINE, 0.7);
  for (const fx of [1090, 1112, 1134]) wash(c, ellipse(fx, 596, 6, 16), '#6e6474', GLAZE);
}

const PAINT: Record<SetId, (c: Ctx, beat?: string) => void> = {
  paper: paperScene,
  festival: festivalScene,
  river: riverScene,
  rooftop: rooftopScene,
  train: trainScene,
  platform: platformFrame,
  window: windowScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//paintings are slow to make, so each is made once and kept, dropping the oldest past a limit
function cached(store: Map<string, HTMLCanvasElement>, limit: number, key: string, w: number, h: number, paint: (c: Ctx) => void) {
  let painted = store.get(key);
  if (!painted) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(w, h);
    paint(c);
    painted = el;
    store.set(key, el);
    if (store.size > limit) store.delete(store.keys().next().value!);
  }
  return painted;
}

const scenes = new Map<string, HTMLCanvasElement>();
const panels = new Map<string, HTMLCanvasElement>();

const scenePainting = (cue: Cue) => cached(scenes, 8, `${cue.set}:${cue.beat ?? ''}`, W, H, (c) => PAINT[cue.set](c, cue.beat));
const platformPainting = () => cached(scenes, 8, 'platform:view', W + 1400, H, platformView);

// ---------------------------------------------------------------------------
// what moves on top of the paintings
// ---------------------------------------------------------------------------

function skyLantern(c: Ctx, x: number, y: number, r: number, t: number, i: number) {
  glow(c, x, y, r * 3, '255,120,90', 0.22);
  for (const k of [0.6, -0.2])
    line(c, [[x + r * k, y + r * 0.4], [x + r * (k + 1.5), y + r * 2 + Math.sin(t + i + k) * r * 0.4], [x + r * (k + 4), y + r * 3.5 + Math.sin(t * 0.8 + i) * r]], 1.4, '#d6463c', 0.45);
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.2, 0, x, y, r);
  g.addColorStop(0, '#f2735a');
  g.addColorStop(1, '#c8352a');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#3b2a30';
  c.fillRect(x - r * 0.3, y - r * 0.95, r * 0.6, r * 0.16);
  c.fillRect(x - r * 0.25, y + r * 0.78, r * 0.5, r * 0.25);
  line(c, [[x, y + r * 1.05], [x, y + r * 1.8]], 1.5, '#d6463c', 0.7);
}

function live(c: Ctx, cue: Cue, t: number, since: number) {
  if (cue.set === 'paper') {
    for (let i = 0; i < 3; i++) {
      const y = H + 100 - ((t * 9 * (1 + i * 0.25) + i * 330) % (H + 250));
      skyLantern(c, [560, 840, 700][i] + Math.sin(t * 0.4 + i) * 14, y, [34, 24, 18][i], t, i);
    }
    for (let i = 0; i < 40; i++) {
      const x = ((rand(i) * W + t * (18 + rand(i + 9) * 25)) % (W + 100)) - 50;
      const y = ((rand(i + 3) * H + t * (22 + rand(i + 5) * 18)) % (H + 100)) - 50;
      c.save();
      c.translate(x, y);
      c.rotate(t * (0.6 + rand(i + 2)) + i);
      c.fillStyle = 'rgba(232,140,140,0.7)';
      c.beginPath();
      c.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  if (cue.set === 'festival') {
    FESTIVAL_LANTERNS.forEach(({ x, y, r }, i) => glow(c, x, y + r * 1.3, r * 3.2, '255,170,110', 0.16 + 0.08 * Math.sin(t * 2 + i)));
    for (let i = 0; i < 2; i++) skyLantern(c, 300 + i * 900 + Math.sin(t * 0.3 + i) * 20, 420 - ((t * 6 + i * 200) % 460), 9, t, i);
    for (let i = 0; i < 24; i++) {
      const y = H - ((t * (12 + rand(i) * 18) + rand(i + 7) * H) % H);
      glow(c, rand(i + 3) * W + Math.sin(t + i) * 20, y, 9, '255,230,160', 0.55);
    }
  }
  if (cue.set === 'river') {
    for (let i = 0; i < 18; i++) line(c, [[1160 + Math.sin(t * 2 + i) * 18, 552 + i * 18], [1230 + Math.sin(t * 2 + i) * 18, 552 + i * 18]], 2, '#fbefd6', 0.25);
    for (let i = 0; i < 14; i++) {
      const x = ((rand(i) * (W + 200) + t * (10 + rand(i + 3) * 8)) % (W + 200)) - 100;
      const y = 570 + rand(i + 5) * 290 + Math.sin(t * 1.5 + i) * 2;
      const s = 0.6 + (y - 570) / 290;
      glow(c, x, y, 60 * s, '255,160,90', 0.35);
      line(c, [[x, y + 14 * s], [x, y + 50 * s]], 10 * s, '#f2a35c', 0.25);
      c.fillStyle = '#f6c17c';
      c.fillRect(x - 13 * s, y - 18 * s, 26 * s, 22 * s);
      c.fillStyle = '#c4452f';
      c.beginPath();
      c.moveTo(x - 17 * s, y - 18 * s);
      c.lineTo(x, y - 30 * s);
      c.lineTo(x + 17 * s, y - 18 * s);
      c.fill();
    }
  }
  if (cue.set === 'rooftop')
    for (let i = 0; i < 3; i++) {
      const x = ((t * 40 + i * 520) % (W + 200)) - 100;
      const y = 140 + i * 40 + Math.sin(t + i) * 15;
      const flap = Math.sin(t * 8 + i) * 5;
      line(c, [[x - 10, y - flap], [x, y], [x + 10, y - flap]], 1.6, LINE, 0.7);
    }
  if (cue.set === 'train') {
    c.save();
    c.beginPath();
    for (const x of TRAIN_WINDOWS) c.roundRect(x + 4, 154, 332, 282, 16);
    c.clip();
    for (let i = 0; i < 36; i++) glow(c, W - ((rand(i) * W + t * 90) % W), 340 + rand(i + 4) * 60, 10, '255,210,140', 0.85);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = 'rgba(30,26,48,0.6)';
      c.fillRect(W + 100 - ((i * 500 + t * 900) % (W + 400)), 150, 18, 290);
    }
    c.restore();
  }
  if (cue.set === 'window') {
    c.save();
    c.beginPath();
    c.roundRect(248, 68, 1104, 484, 10);
    c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1.3;
    c.beginPath();
    for (let i = 0; i < 160; i++) {
      const x = 240 + rand(i) * 1140;
      const y = 40 + ((rand(i + 1) * 540 + t * 700 * (0.8 + rand(i + 2) * 0.4)) % 540);
      c.moveTo(x, y);
      c.lineTo(x - 5, y + 26);
    }
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = 0; i < 50; i++) {
      const slide = rand(i + 8) > 0.8 ? (t * 12 * rand(i)) % 500 : 0;
      c.beginPath();
      c.ellipse(240 + rand(i + 3) * 1120, 60 + ((rand(i + 4) * 500 + slide) % 500), 2 + rand(i + 5) * 3, 2.5 + rand(i + 5) * 4, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    for (let k = 0; k < 3; k++) line(c, Array.from({ length: 10 }, (_, j): Pt => [1172 + k * 13 + Math.sin(t * 2 + j * 0.6 + k) * 5, 498 - j * 9]), 2, '#ffffff', 0.4);
    if (cue.beat === 'phone') glow(c, 1070, 548, 70, '210,235,255', since < 1.6 ? 0.5 + 0.3 * Math.sin(t * 30) : 0.45);
  }
}

//a painting and whatever moves over it
function drawScene(c: Ctx, cue: Cue, t: number, since: number) {
  if (cue.set === 'platform') {
    const pull = Math.min(since, 10) ** 2 * 12; //the train pulls away, faster and faster
    c.save();
    c.beginPath();
    c.roundRect(...PLATFORM_WINDOW);
    c.clip();
    c.drawImage(platformPainting(), -pull, 0);
    c.restore();
  }
  c.drawImage(scenePainting(cue), 0, 0);
  live(c, cue, t, since);
}

// ---------------------------------------------------------------------------
// close up panels, painted at 800x600 on deckled paper
// ---------------------------------------------------------------------------

const PANEL_COLORS: Record<Mood | Thing, string> = {
  calm: '#dce6ec',
  smile: '#f6e0d6',
  laugh: '#f7d8c6',
  cover: '#f4d0d0',
  grin: '#f6dcc4',
  soft: '#e7dfe8',
  phone: '#f2d6c4',
  texts: '#e2eae4',
  flowers: '#e9edeb',
  note: '#efe6d6',
  laptops: '#3a3b58',
};

function thing(c: Ctx, which: Thing) {
  if (which === 'phone') {
    for (let i = 0; i < 6; i++) mist(c, ellipse(random() * 400, random() * 300, 30, 30), 'rgba(240,120,80,0.5)', 40);
    c.save();
    c.translate(210, 160);
    c.rotate(-0.25);
    wash(c, ellipse(-66, 40, 24, 30), PEOPLE.kenji.skin, SKIN);
    wash(c, rect(-60, -110, 120, 220), '#3a2c36');
    const g = c.createLinearGradient(-50, -100, 50, 100);
    g.addColorStop(0, '#a9d4f0');
    g.addColorStop(1, '#f6d2e2');
    c.fillStyle = g;
    c.fillRect(-50, -96, 100, 190);
    wash(c, [[-50, 20], [50, -60], [50, -10], [-50, 70]], '#ffffff', { layers: 4, alpha: 0.18, spread: 0.02 });
    wash(c, ellipse(66, 30, 22, 30), PEOPLE.kenji.skin, SKIN);
    c.restore();
  }
  if (which === 'texts') {
    wash(c, rect(110, 14, 180, 320), '#3a2c36');
    c.fillStyle = '#f8f5f0';
    c.fillRect(120, 28, 160, 300);
    c.fillStyle = '#e8e2e0';
    c.fillRect(120, 40, 160, 34);
    c.fillStyle = LINE;
    c.font = 'bold 15px system-ui, sans-serif';
    c.fillText('Aoi', 186, 62);
    for (const [y, h] of [[88, 76], [174, 58]]) wash(c, rect(130, y, 136, h), '#e6dfe2', THIN);
    c.fillStyle = LINE;
    c.font = '13px system-ui, sans-serif';
    wrap(c, 'Got it back to you finally!! Sorry it took forever.', 140, 108, 118, 17);
    wrap(c, 'It helped more than you know :)', 140, 194, 118, 17);
  }
  if (which === 'flowers') {
    wash(c, limb([[-20, 320], [140, 250]], 46, 40), PEOPLE.oldMan.top);
    wash(c, limb([[420, 320], [262, 246]], 46, 40), PEOPLE.oldMan.top);
    bouquet(c, 200, 140, 2.2);
    wash(c, ellipse(140, 230, 30, 22), PEOPLE.oldMan.skin, SKIN);
    wash(c, ellipse(262, 226, 30, 22), PEOPLE.oldMan.skin, SKIN);
  }
  if (which === 'note') {
    c.save();
    c.translate(200, 150);
    c.rotate(-0.06);
    wash(c, rect(-160, -110, 320, 120), '#fbf6ec', THIN);
    wash(c, rect(-160, 10, 320, 110), '#ece0cc', THIN);
    for (let y = -84; y < 0; y += 26) line(c, [[-150, y + 8], [150, y + 8]], 1.2, '#7a90bc', 0.3);
    c.fillStyle = '#2f3a6b';
    c.font = 'italic 21px Georgia, serif';
    c.fillText("I don't think I've been okay", -140, -66);
    c.fillText('for a while.', -140, -40);
    line(c, Array.from({ length: 24 }, (_, i): Pt => [-140 + i * 11, -12 + Math.sin(i * 1.7) * 4]), 2, '#2f3a6b', 0.55);
    for (let y = 36; y < 110; y += 24) line(c, Array.from({ length: 24 }, (_, i): Pt => [-140 + i * 11, y + Math.sin(i * 1.3 + y) * 3]), 2, '#2f3a6b', 0.14);
    c.restore();
  }
  if (which === 'laptops') {
    mist(c, ellipse(330, 60, 22, 22), 'rgba(255,240,210,0.9)', 30);
    wash(c, ellipse(330, 60, 18, 18), '#fbf3dc', THIN);
    wash(c, ellipse(80, 60, 30, 30), '#efe9e2', THIN);
    line(c, [[80, 60], [80, 40]], 2.5);
    line(c, [[80, 60], [95, 64]], 2.5);
    wash(c, rect(-10, 230, 420, 80), '#5b4a5e');
    for (const x of [80, 230]) {
      mist(c, ellipse(x + 45, 175, 60, 50), 'rgba(180,220,255,0.6)', 50);
      wash(c, rect(x, 130, 90, 70), '#cfe4f6', THIN);
      wash(c, [[x - 10, 230], [x + 100, 230], [x + 90, 200], [x, 200]], '#a7a2b4', THIN);
    }
    for (const x of [190, 345]) wash(c, rect(x, 196, 24, 34), '#ece6de', THIN);
  }
}

const wrap = (c: Ctx, text: string, x: number, y: number, width: number, lineHeight: number) => {
  let row = '';
  for (const word of text.split(' ')) {
    if (row && c.measureText(`${row} ${word}`).width > width) {
      c.fillText(row, x, y);
      row = word;
      y += lineHeight;
    } else row = row ? `${row} ${word}` : word;
  }
  c.fillText(row, x, y);
};

const PANEL_MARGIN = 12;

const panelPainting = (panel: Panel) =>
  cached(panels, 12, JSON.stringify(panel), 800 + PANEL_MARGIN * 2, 600 + PANEL_MARGIN * 2, (c) => {
    c.translate(PANEL_MARGIN, PANEL_MARGIN);
    trace(c, deform(rect(0, 0, 800, 600), 4, 0.006));
    c.clip();
    c.fillStyle = '#fbf6ef';
    c.fillRect(-20, -20, 840, 640);
    c.scale(2, 2);
    const tint = 'who' in panel ? panel.mood : panel.thing;
    wash(c, rect(14, 12, 372, 276), PANEL_COLORS[tint], { layers: 10, alpha: 0.12, spread: 0.04 });
    for (let i = 0; i < 6; i++) wash(c, ellipse(random() * 400, random() * 300, 60 + random() * 80, 40 + random() * 50), PANEL_COLORS[tint], GLAZE);
    if ('who' in panel) {
      c.translate(200, 158);
      face(c, panel.who, panel.mood, 88);
    } else thing(c, panel.thing);
  });

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  festival: new URL('./sounds/festival.m4a', import.meta.url).href,
  wind: new URL('./sounds/rooftop_wind.m4a', import.meta.url).href,
  train: new URL('./sounds/train.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

const MIX: Record<SetId, Partial<Record<Bed, number>>> = {
  paper: {},
  festival: { festival: 0.7 },
  river: { festival: 0.15, wind: 0.2 },
  rooftop: { wind: 0.6 },
  train: { train: 0.7 },
  platform: { train: 0.45 },
  window: { rain: 0.8 },
};

const ONE_SHOTS: Record<string, OneShot> = {
  note_falls: { src: new URL('./sounds/page_turn.m4a', import.meta.url).href, volume: 0.7, delay: 0.4 },
  platform_leaves: { src: new URL('./sounds/train_door.m4a', import.meta.url).href, volume: 0.6 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds


// ---------------------------------------------------------------------------
// the scene
// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function ReadingPeople({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Reading People has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active], prevAt: 0 });
  const sound = useRef<Soundscape<Bed> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const [grainCanvas, g] = canvas2d(200, 200);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(90,60,50,${Math.random() * 0.45})`;
      g.fillRect(Math.random() * 200, Math.random() * 200, 1.3, 1.3);
    }
    const grain = c.createPattern(grainCanvas, 'repeat')!;
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
      const { cue, at, prev, prevAt } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      const fading = prev !== cue && since < SET_FADE;
      if (fading) {
        drawScene(c, prev, t, (now - prevAt) / 1000);
        c.globalAlpha = ease(since / SET_FADE);
      }
      drawScene(c, cue, t, since);
      c.globalAlpha = 1;

      //panels drift in from their side, unless the last cue already showed the same one there
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pw = Math.min(460, sw * (sw < 700 ? 0.46 : 0.34));
      const ph = pw * 0.75;
      cue.panels?.forEach((panel, i) => {
        const same = JSON.stringify(prev.panels?.[i]) === JSON.stringify(panel);
        const p = same ? 1 : ease((since - 0.15 - i * 0.2) / 0.6);
        const side = i ? -1 : 1;
        const x = i ? sw * 0.05 : sw * 0.95 - pw;
        const y = sh * (i ? 0.14 : 0.07);
        const margin = (pw * PANEL_MARGIN) / 800;
        c.save();
        c.globalAlpha = p;
        c.translate(x + pw / 2 + side * (1 - p) * 40, y + ph / 2);
        c.rotate(side * 0.015);
        c.shadowColor = 'rgba(80,45,55,0.28)';
        c.shadowBlur = 24;
        c.shadowOffsetY = 8;
        c.drawImage(panelPainting(panel), -pw / 2 - margin, -ph / 2 - margin, pw + margin * 2, ph + margin * 2);
        c.restore();
      });

      //paper grain and a soft warm vignette over everything
      c.globalAlpha = 0.09;
      c.fillStyle = grain;
      c.fillRect(0, 0, sw, sh);
      c.globalAlpha = 1;
      const v = c.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.45, sw / 2, sh / 2, Math.max(sw, sh) * 0.8);
      v.addColorStop(0, 'rgba(90,50,60,0)');
      v.addColorStop(1, 'rgba(90,50,60,0.22)');
      c.fillStyle = v;
      c.fillRect(0, 0, sw, sh);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const current = shown.current;
    shown.current = { cue: cues[active], at: now, prev: current.cue, prevAt: current.at };
    sound.current?.mix(MIX[cues[active].set]);
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
    background: '#f6efe8',
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
    paddingBottom: 160,
    background: 'radial-gradient(ellipse at center, rgba(248,241,234,0.85) 0%, rgba(248,241,234,0.35) 70%)',
    color: '#5a3038',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  name: {
    fontSize: 64,
    letterSpacing: 2,
  },
};

export default ReadingPeople;
