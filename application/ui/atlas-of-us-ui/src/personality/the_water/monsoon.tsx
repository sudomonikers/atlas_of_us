import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// Monsoon is painted like a Kalamkari cloth on a 2D canvas: natural dyes (madder red, indigo, turmeric, iron black)
// laid by hand on unbleached cotton, every shape drawn with a kalam pen in a slightly wavering black line with a cream
// reserve round it, and the insides filled with dots, checks, flowers and scalloped waves. A temple border runs round it.
// Every cue is a cloth painted once and kept. A new set unrolls down over the last like a scroll, a new beat on the same
// set cross-fades, and the camera creeps slowly in. Rain, ripples, flames, torchlight, lightning and birds move on top.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const UNROLL = 0.9; //seconds a new cloth takes to unroll over the last
const BEAT_FADE = 0.5; //seconds to cross-fade a new beat on the same set
const DRIFT = 0.03; //how far the camera creeps into a cloth
const DRIFT_TIME = 16; //and how long it takes
const BORDER = 46; //the temple border round every cloth
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = '#221a14';
const CLOTH = '#eadcb8';
const CREAM = '#f4ead0';
const MADDER = '#a3362b';
const MADDER_DARK = '#6e2019';
const ROSE = '#cf7a5c';
const INDIGO = '#2b3c6b';
const INDIGO_DEEP = '#18223e';
const INDIGO_PALE = '#8a9bc0';
const TURMERIC = '#d9a23a';
const OCHRE = '#b47a32';
const GREEN = '#5d7a48';
const GREEN_DARK = '#3b5130';
const BROWN = '#76482a';
const STEEL = '#9a978f';
const MUD = '#86613c';
const SERIF = 'Georgia, "Times New Roman", serif';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'street' | 'landing' | 'flat' | 'flood' | 'wade' | 'shop' | 'window' | 'after' | 'terrace';

interface Cue {
  set: SetId;
  beat: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'street', beat: 'title', card: ['The Water', 'Monsoon'] },
  street_rain: { set: 'street', beat: 'rain' },
  street_flood: { set: 'street', beat: 'flood' },
  landing_knock: { set: 'landing', beat: 'knock' },
  flat_night: { set: 'flat', beat: 'night' },
  flat_sleep: { set: 'flat', beat: 'sleep' },
  flood_morning: { set: 'flood', beat: 'morning' },
  flood_faisal: { set: 'flood', beat: 'faisal' },
  flood_boat: { set: 'flood', beat: 'boat' },
  flood_boat_leaving: { set: 'flood', beat: 'leaving' },
  wade_alone: { set: 'wade', beat: 'alone' },
  wade_together: { set: 'wade', beat: 'together' },
  shop: { set: 'shop', beat: 'kumar' },
  window_rajan: { set: 'window', beat: 'rajan' },
  after_mud: { set: 'after', beat: 'mud' },
  terrace_tiffin: { set: 'terrace', beat: 'tiffin' },
  terrace_books: { set: 'terrace', beat: 'books' },
  the_end: { set: 'terrace', beat: 'end' },
};
const FIRST_CUE = 'title_card';

//where the water comes up to in each set
const WATER: Partial<Record<SetId, number>> = { flood: 590, wade: 570, shop: 650, window: 700 };

// ---------------------------------------------------------------------------
// the kalam and the dyes
// ---------------------------------------------------------------------------

//cloths use a seeded random so the same cloth always comes out the same
let random = seeded(1);
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

//a fixed per-index random for the live layer
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

const ellipse = (x: number, y: number, rx: number, ry: number, turn = 0, n = 36): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [px, py] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)];
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

const trace = (c: Ctx, points: Pt[], close = true) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
};

//a hand-drawn line never runs quite straight: long edges are broken up and every point nudged a little
function waver(points: Pt[], close: boolean): Pt[] {
  const out: Pt[] = [];
  const n = points.length;
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26));
    for (let k = 0; k < steps; k++) out.push([x0 + ((x1 - x0) * k) / steps + (random() - 0.5) * 1.8, y0 + ((y1 - y0) * k) / steps + (random() - 0.5) * 1.8]);
  }
  if (!close) out.push(points[n - 1]);
  return out;
}

function line(c: Ctx, points: Pt[], width: number, color = INK) {
  trace(c, waver(points, false), false);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}

//a dyed shape: the colour laid a hair off the line, then a black kalam line with a cream reserve either side of it
function ink(c: Ctx, points: Pt[], color: string, width = 4, fill?: CanvasPattern) {
  const p = waver(points, true);
  c.save();
  c.translate(1.6, 1.2);
  trace(c, p);
  c.fillStyle = color;
  c.fill();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.restore();
  if (!width) return;
  trace(c, p);
  c.lineJoin = 'round';
  c.lineWidth = width + 5;
  c.strokeStyle = CREAM;
  c.stroke();
  c.lineWidth = width;
  c.strokeStyle = INK;
  c.stroke();
}

//a limb, pole or rope: a thick stroke with a kalam line either side
function tube(c: Ctx, points: Pt[], width: number, color: string, outline = 3.5) {
  if (outline) line(c, points, width + outline * 2);
  line(c, points, width, color);
}

//overlapping circles inked as one shape, like a cloud or a bush
function blobs(c: Ctx, circles: [number, number, number][], color: string, fill?: CanvasPattern) {
  for (const [width, style] of [[11, CREAM], [7, INK]] as const) {
    c.fillStyle = style;
    for (const [x, y, r] of circles) {
      trace(c, ellipse(x, y, r + width / 2, r + width / 2, 0, 24));
      c.fill();
    }
  }
  for (const style of fill ? [color, fill] : [color]) {
    c.fillStyle = style;
    for (const [x, y, r] of circles) {
      trace(c, ellipse(x, y, r, r, 0, 24));
      c.fill();
    }
  }
}

//the small repeats painted inside shapes
type Kind = 'dots' | 'flowers' | 'dash' | 'checks' | 'stripes' | 'waves' | 'curls';
const tiles = new Map<string, HTMLCanvasElement>();
function pattern(c: Ctx, kind: Kind, color: string) {
  const key = `${kind}:${color}`;
  let tile = tiles.get(key);
  if (!tile) {
    const size = { dots: 16, flowers: 34, dash: 18, checks: 22, stripes: 14, waves: 44, curls: 60 }[kind];
    const [el, t] = canvas2d(size, size);
    t.fillStyle = color;
    t.strokeStyle = color;
    t.lineCap = 'round';
    const dot = (x: number, y: number, r: number) => {
      t.beginPath();
      t.arc(x, y, r, 0, Math.PI * 2);
      t.fill();
    };
    if (kind === 'dots') for (const [x, y] of [[4, 4], [12, 12]]) dot(x, y, 1.8);
    if (kind === 'flowers') {
      for (let k = 0; k < 5; k++) dot(17 + Math.cos((k / 5) * 6.28) * 5, 17 + Math.sin((k / 5) * 6.28) * 5, 2.2);
      dot(17, 17, 1.6);
      dot(0, 0, 1.4);
      dot(34, 34, 1.4);
    }
    if (kind === 'dash') {
      t.lineWidth = 2;
      t.beginPath();
      t.moveTo(4, 12);
      t.lineTo(10, 6);
      t.stroke();
    }
    if (kind === 'checks') {
      t.globalAlpha = 0.7;
      t.fillRect(0, 7, size, 4);
      t.fillRect(7, 0, 4, size);
      t.globalAlpha = 1;
      t.fillRect(0, 16, size, 1.5);
      t.fillRect(16, 0, 1.5, size);
    }
    if (kind === 'stripes') t.fillRect(0, 0, 4, size);
    if (kind === 'waves') {
      //rows of scallops, the way water is drawn on the old cloths
      t.lineWidth = 2;
      for (const [x, y] of [[0, 22], [22, 44], [44, 22], [22, 0], [0, 44], [44, 44]]) {
        for (const r of [8, 14]) {
          t.beginPath();
          t.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95);
          t.stroke();
        }
      }
    }
    if (kind === 'curls') {
      t.lineWidth = 2;
      t.beginPath();
      for (let a = 0; a < 9; a += 0.2) t.lineTo(30 + Math.cos(a) * a * 2, 30 + Math.sin(a) * a * 2);
      t.stroke();
    }
    tile = el;
    tiles.set(key, el);
  }
  return c.createPattern(tile, 'repeat')!;
}

//the plain cotton under the dye: the weave, a few slubs, and the unevenness of a hand-dyed ground. Made once
let weaveCanvas: HTMLCanvasElement | undefined;
function weave() {
  if (weaveCanvas) return weaveCanvas;
  const [el, c] = canvas2d(W, H);
  const r = seeded(17);
  c.fillStyle = 'rgba(80,50,20,0.05)';
  for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
  c.fillStyle = 'rgba(80,50,20,0.035)';
  for (let x = 0; x < W; x += 3) c.fillRect(x, 0, 1, H);
  for (let i = 0; i < 500; i++) {
    c.fillStyle = r() < 0.6 ? 'rgba(90,60,25,0.12)' : 'rgba(255,250,235,0.2)';
    c.fillRect(r() * W, r() * H, 6 + r() * 26, 1.5);
  }
  for (let i = 0; i < 24; i++) {
    const [x, y, rad] = [r() * W, r() * H, 80 + r() * 200];
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(120,80,40,0.07)');
    g.addColorStop(1, 'rgba(120,80,40,0)');
    c.fillStyle = g;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  weaveCanvas = el;
  return el;
}

//the temple border: madder with a row of little towers, an indigo rule, and dots. Made once, with a clear middle
let frameCanvas: HTMLCanvasElement | undefined;
function frame() {
  if (frameCanvas) return frameCanvas;
  random = seeded(23);
  const [el, c] = canvas2d(W, H);
  c.fillStyle = MADDER;
  c.fillRect(0, 0, W, H);
  const b = BORDER;
  //the towers point inward from every edge
  for (const [x0, y0, x1, y1, nx, ny] of [[b, b, W - b, b, 0, 1], [b, H - b, W - b, H - b, 0, -1], [b, b, b, H - b, 1, 0], [W - b, b, W - b, H - b, -1, 0]]) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.round(len / 34);
    for (let k = 0; k < n; k++) {
      const u0 = k / n;
      const u1 = (k + 1) / n;
      const [ax, ay] = [x0 + (x1 - x0) * u0, y0 + (y1 - y0) * u0];
      const [bx, by] = [x0 + (x1 - x0) * u1, y0 + (y1 - y0) * u1];
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
      const tip: Pt = [mx - nx * 26, my - ny * 26];
      c.fillStyle = CREAM;
      trace(c, [[ax - nx * 4, ay - ny * 4], tip, [bx - nx * 4, by - ny * 4]]);
      c.fill();
      c.fillStyle = TURMERIC;
      c.beginPath();
      c.arc(tip[0] + nx * 10, tip[1] + ny * 10, 3.5, 0, Math.PI * 2);
      c.fill();
    }
  }
  for (const [inset, width, color] of [[b, 5, INK], [b - 3, 3, INDIGO], [10, 3, INK]] as [number, number, string][]) {
    c.lineWidth = width;
    c.strokeStyle = color;
    c.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  }
  c.fillStyle = CREAM;
  for (let x = 20; x < W; x += 18) {
    for (const y of [20, H - 20]) {
      c.beginPath();
      c.arc(x, y, 2, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.globalCompositeOperation = 'multiply';
  c.drawImage(weave(), 0, 0);
  c.clearRect(b, b, W - b * 2, H - b * 2);
  frameCanvas = el;
  return el;
}

//a cream band painted across the top of a cloth, the way the old cloths name their scenes
function caption(c: Ctx, text: string) {
  c.font = `italic 34px ${SERIF}`;
  const w = c.measureText(text).width + 60;
  ink(c, rect(BORDER + 30, BORDER + 24, w, 56), CREAM, 4);
  line(c, [[BORDER + 40, BORDER + 34], [BORDER + 20 + w, BORDER + 34]], 2, MADDER);
  line(c, [[BORDER + 40, BORDER + 70], [BORDER + 20 + w, BORDER + 70]], 2, MADDER);
  c.fillStyle = INK;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(text, BORDER + 60, BORDER + 54);
}

// ---------------------------------------------------------------------------
// people: painted once per cloth, in the pose the cloth needs
// ---------------------------------------------------------------------------

type Who = 'you' | 'selvi' | 'arun' | 'paati' | 'faisal' | 'rajan' | 'muthu' | 'rower' | 'kumar';
type Pose = 'stand' | 'hold' | 'carry' | 'offer' | 'row' | 'sweep' | 'sit';
type Face = 'calm' | 'worried' | 'smile' | 'shut';
type Prop = 'cooker' | 'bag' | 'photo' | 'torch' | 'can' | 'tiffin' | 'book' | 'broom' | 'oar' | 'phone';
type Limb = [Pt, Pt, Pt];

//each person faces right with their feet (or, sitting, their seat) at (0, 0). Arms run shoulder, elbow, hand, far one first
interface Rig {
  head: Pt;
  tilt: number;
  neck: Pt;
  hip: Pt;
  arms: [Limb, Limb];
  seated?: boolean;
}

const UP = { head: [10, -296] as Pt, tilt: 0, neck: [4, -258] as Pt, hip: [0, -150] as Pt };
const FAR_DOWN: Limb = [[-8, -246], [-16, -196], [-12, -146]];

const RIGS: Record<Pose, Rig> = {
  stand: { ...UP, arms: [FAR_DOWN, [[14, -246], [22, -196], [22, -146]]] },
  hold: { ...UP, arms: [[[-8, -246], [12, -198], [44, -204]], [[14, -246], [30, -194], [60, -200]]] },
  carry: { ...UP, arms: [FAR_DOWN, [[14, -246], [44, -286], [40, -336]]] },
  offer: { ...UP, arms: [FAR_DOWN, [[14, -246], [58, -232], [104, -226]]] },
  row: { ...UP, tilt: 0.12, arms: [[[-8, -246], [24, -214], [56, -196]], [[14, -246], [42, -206], [76, -184]]] },
  sweep: { ...UP, head: [22, -284], tilt: 0.3, neck: [12, -248], arms: [[[0, -238], [30, -196], [56, -168]], [[18, -238], [46, -190], [70, -150]]] },
  sit: { head: [10, -196], tilt: 0, neck: [4, -158], hip: [0, -48], seated: true, arms: [[[-8, -146], [2, -100], [40, -66]], [[14, -146], [30, -98], [62, -70]]] },
};

type Wrap = 'saree' | 'veshti' | 'lungi' | 'pants' | 'shorts';

interface Look {
  skin: string;
  hair: string;
  top: string;
  topPattern?: [Kind, string];
  wrap: Wrap;
  low: string;
  lowPattern?: [Kind, string];
  edge?: string; //the woven border along a saree or veshti
  bare?: boolean; //a sleeveless vest
  size?: number;
}

const LOOKS: Record<Who, Look> = {
  you: { skin: '#8a5532', hair: INK, top: INDIGO, topPattern: ['dots', CREAM], wrap: 'pants', low: OCHRE },
  selvi: { skin: '#7b4a2a', hair: INK, top: TURMERIC, wrap: 'saree', low: MADDER, lowPattern: ['flowers', TURMERIC], edge: TURMERIC },
  arun: { skin: '#9a6038', hair: INK, top: GREEN, topPattern: ['stripes', CREAM], wrap: 'shorts', low: INDIGO, size: 0.62 },
  paati: { skin: '#6e4224', hair: '#d8d2c4', top: MADDER_DARK, wrap: 'saree', low: GREEN_DARK, lowPattern: ['dots', TURMERIC], edge: MADDER },
  faisal: { skin: '#a06a40', hair: INK, top: TURMERIC, topPattern: ['dash', OCHRE], wrap: 'pants', low: INDIGO_DEEP },
  rajan: { skin: '#6a3e22', hair: '#ece6d6', top: CREAM, topPattern: ['stripes', '#e2d6b8'], wrap: 'veshti', low: CREAM, edge: TURMERIC },
  muthu: { skin: '#5a341c', hair: INK, top: CREAM, wrap: 'lungi', low: MADDER, lowPattern: ['checks', INDIGO], bare: true },
  rower: { skin: '#6b3f22', hair: INK, top: '#c9b48a', wrap: 'lungi', low: INDIGO, lowPattern: ['checks', CREAM], bare: true },
  kumar: { skin: '#80502c', hair: '#8a8478', top: TURMERIC, wrap: 'pants', low: BROWN },
};

interface Placed {
  who: Who;
  pose: Pose;
  x: number;
  y: number;
  s: number;
  flip?: boolean; //facing left
  face?: Face;
  prop?: Prop;
  turn?: number; //radians, for someone lying down
}

function person(c: Ctx, { who, pose, x, y, s, flip, face = 'calm', prop, turn = 0 }: Placed) {
  const rig = RIGS[pose];
  const look = LOOKS[who];
  const { head, tilt, neck, hip, arms } = rig;
  const k = s * (look.size ?? 1);
  const fill = (spec?: [Kind, string]) => spec && pattern(c, ...spec);
  //a point on the head, turned with it
  const at = (dx: number, dy: number): Pt => [head[0] + dx * Math.cos(tilt) - dy * Math.sin(tilt), head[1] + dx * Math.sin(tilt) + dy * Math.cos(tilt)];
  const arm = (l: Limb) => {
    tube(c, [l[0], l[1]], 17, look.bare ? look.skin : look.top);
    tube(c, [l[1], l[2]], 14, look.skin);
    ink(c, ellipse(...l[2], 9, 8), look.skin, 3);
  };

  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.scale(flip ? -k : k, k);

  //what they're wearing below the waist
  const [hx, hy] = hip;
  if (rig.seated) {
    ink(c, ellipse(26, -24, 66, 26), look.low, 4, fill(look.lowPattern));
    if (look.edge) line(c, [[-30, -6], [26, 0], [84, -10]], 6, look.edge);
    ink(c, ellipse(84, -10, 13, 7), look.skin, 3);
  } else if (look.wrap === 'saree' || look.wrap === 'veshti') {
    ink(c, [[hx - 30, hy - 8], [hx + 30, hy - 8], [hx + 42, -10], [hx - 40, -10]], look.low, 4, fill(look.lowPattern));
    if (look.edge) ink(c, [[hx - 40, -10], [hx + 42, -10], [hx + 41, -26], [hx - 39, -26]], look.edge, 2.5);
    for (const d of [6, 14, 22]) line(c, [[hx + d, hy + 30], [hx + d + 6, -28]], 2);
    for (const fx of [-14, 18]) ink(c, ellipse(fx, -4, 14, 6), look.skin, 3);
  } else if (look.wrap === 'lungi') {
    ink(c, [[hx - 30, hy - 8], [hx + 30, hy - 8], [hx + 34, -80], [hx - 32, -80]], look.low, 4, fill(look.lowPattern));
    for (const [kx, fx] of [[-8, -12], [10, 14]]) {
      tube(c, [[kx, -80], [fx, -4]], 16, look.skin);
      ink(c, ellipse(fx + 8, -4, 15, 6), look.skin, 3);
    }
  } else {
    for (const [kx, fx] of [[-8, -12], [10, 14]]) {
      if (look.wrap === 'shorts') {
        tube(c, [[kx * 0.5, hy], [kx, -90]], 26, look.low);
        tube(c, [[kx, -90], [fx, -6]], 15, look.skin);
      } else tube(c, [[kx * 0.5, hy], [kx, -76], [fx, -6]], 24, look.low);
      ink(c, ellipse(fx + 9, -5, 16, 7), INK, 3);
    }
  }

  if (prop === 'bag') ink(c, rect(neck[0] - 62, neck[1] + 14, 36, 76), INDIGO, 4, pattern(c, 'dots', TURMERIC));
  if (who === 'selvi') tube(c, [at(-26, 8), [neck[0] - 30, neck[1] + 40], [neck[0] - 34, hip[1] + 10]], 11, INK, 2);
  arm(arms[0]);
  tube(c, [neck, at(-4, 26)], 14, look.skin);
  ink(c, [[neck[0] - 28, neck[1] + 8], [neck[0] + 24, neck[1] + 8], [hx + 26, hy + 6], [hx - 28, hy + 6]], look.top, 4, fill(look.topPattern));
  if (look.wrap === 'saree') {
    //the pallu, from the waist up across the chest and over the far shoulder
    ink(c, [[hx + 26, hy + 2], [hx + 6, hy + 6], [neck[0] - 32, neck[1] + 18], [neck[0] - 14, neck[1] + 6]], look.low, 3.5, fill(look.lowPattern));
    if (look.edge) line(c, [[hx + 22, hy], [neck[0] - 16, neck[1] + 10]], 5, look.edge);
  }
  if (prop === 'bag') line(c, [[neck[0] - 20, neck[1] + 10], [neck[0] + 8, hy - 10]], 5, TURMERIC);

  //the head: ear, hair, face
  ink(c, ellipse(head[0], head[1], 27, 31, tilt), look.skin, 4);
  ink(c, ellipse(...at(-7, 2), 6, 9, tilt, 14), look.skin, 3);
  if (who === 'selvi' || who === 'paati') ink(c, ellipse(...at(-7, 13), 3.4, 3.4, 0, 10), TURMERIC, 1.5);
  hair(c, who, at);
  features(c, who, at, face);

  if (prop) props(c, prop, arms);
  arm(arms[1]);
  if (prop === 'photo' || prop === 'tiffin') props(c, prop, arms, true);
  c.restore();
}

function hair(c: Ctx, who: Who, at: (dx: number, dy: number) => Pt) {
  const color = LOOKS[who].hair;
  if (who === 'you' || who === 'faisal' || who === 'rower')
    ink(c, [at(-30, 6), at(-30, -14), at(-18, -32), at(4, -37), at(24, -31), at(31, -17), at(16, -20), at(0, -18), at(-12, -8), at(-18, 8)], color, 3.5);
  if (who === 'arun') ink(c, [at(-30, 6), at(-32, -16), at(-22, -34), at(-8, -32), at(2, -42), at(12, -34), at(26, -36), at(32, -16), at(14, -20), at(-4, -14), at(-18, 8)], color, 3.5);
  if (who === 'selvi') ink(c, [at(-31, 14), at(-30, -14), at(-16, -33), at(6, -37), at(26, -29), at(30, -19), at(10, -23), at(-8, -17), at(-18, 0), at(-22, 16)], color, 3.5);
  if (who === 'paati') {
    ink(c, ellipse(...at(-31, -4), 13, 12, 0, 18), color, 3.5);
    ink(c, [at(-30, 10), at(-30, -14), at(-16, -33), at(6, -36), at(26, -28), at(29, -18), at(10, -22), at(-8, -16), at(-18, 0), at(-21, 12)], color, 3.5);
  }
  if (who === 'faisal') ink(c, [at(-8, 14), at(2, 28), at(18, 34), at(31, 25), at(26, 19), at(12, 22), at(2, 10)], color, 3);
  if (who === 'rajan' || who === 'kumar') ink(c, [at(-28, 10), at(-30, -8), at(-22, -18), at(-14, -6), at(-16, 8)], color, 3);
  if (who === 'muthu') {
    //a towel tied round the head
    ink(c, ellipse(...at(-33, -12), 9, 12, 0, 14), CREAM, 3, pattern(c, 'stripes', MADDER));
    ink(c, [at(-31, -2), at(-28, -26), at(-2, -40), at(24, -34), at(32, -16), at(4, -22), at(-24, -2)], CREAM, 3.5, pattern(c, 'stripes', MADDER));
  }
}

//the long eye of a temple painting, drawn whole even though the face is in profile
function features(c: Ctx, who: Who, at: (dx: number, dy: number) => Pt, face: Face) {
  if (face === 'shut') line(c, [at(8, -3), at(16, 1), at(25, -3)], 2.5);
  else {
    ink(c, [at(5, -4), at(15, -10), at(27, -5), at(15, 0)], CREAM, 2);
    c.fillStyle = INK;
    trace(c, ellipse(...at(20, -5), 3.2, 3.6, 0, 12));
    c.fill();
  }
  const brow: Record<Face, Pt[]> = {
    calm: [at(4, -14), at(15, -18), at(27, -13)],
    smile: [at(4, -15), at(15, -19), at(27, -14)],
    shut: [at(4, -13), at(15, -16), at(27, -12)],
    worried: [at(4, -15), at(16, -17), at(26, -20)],
  };
  line(c, brow[face], 2.5);
  line(c, [at(28, -10), at(36, 8), at(28, 11)], 2.5);
  if (face === 'smile') line(c, [at(16, 18), at(22, 22), at(28, 18)], 2.5);
  else if (face === 'worried') line(c, [at(17, 21), at(22, 18), at(27, 20)], 2.5);
  else line(c, [at(18, 19), at(27, 19)], 2.5);
  if (who === 'selvi' || who === 'paati') ink(c, ellipse(...at(25, -21), 2.8, 2.8, 0, 10), MADDER, 0);
  if (who === 'rajan') {
    c.lineWidth = 2;
    c.strokeStyle = INK;
    trace(c, ellipse(...at(17, -5), 11, 9, 0, 18));
    c.stroke();
    line(c, [at(6, -6), at(-6, -4)], 2);
  }
  if (who === 'rajan' || who === 'kumar' || who === 'muthu') ink(c, [at(21, 13), at(32, 12), at(30, 17), at(21, 16)], who === 'rajan' ? '#ece6d6' : INK, 1.5);
}

function props(c: Ctx, prop: Prop, arms: [Limb, Limb], front = false) {
  const [hx, hy] = arms[1][2];
  if (prop === 'cooker') {
    ink(c, rect(hx - 14, hy - 40, 58, 44), STEEL, 3.5);
    ink(c, ellipse(hx + 15, hy - 40, 30, 7), '#c8c5bd', 3);
    ink(c, rect(hx + 10, hy - 56, 10, 12), INK, 0);
    tube(c, [[hx + 40, hy - 40], [hx + 84, hy - 44]], 8, INK, 0);
  }
  if (prop === 'photo' && front) {
    ink(c, rect(hx - 14, hy - 62, 44, 56), BROWN, 3.5);
    ink(c, rect(hx - 6, hy - 54, 28, 40), CREAM, 2);
    ink(c, ellipse(hx + 8, hy - 40, 7, 8, 0, 12), '#6a5a48', 0);
    ink(c, [[hx - 2, hy - 18], [hx + 18, hy - 18], [hx + 14, hy - 30], [hx + 2, hy - 30]], '#6a5a48', 0);
  }
  if (prop === 'torch') {
    tube(c, [[hx - 6, hy], [hx + 30, hy - 6]], 12, INK, 0);
    ink(c, ellipse(hx + 31, hy - 6, 4, 8, -0.15, 10), CREAM, 1.5);
  }
  if (prop === 'can') {
    ink(c, [[hx - 22, hy - 40], [hx + 30, hy - 40], [hx + 34, hy + 34], [hx - 26, hy + 34]], INDIGO_PALE, 4, pattern(c, 'stripes', '#a7b5d2'));
    ink(c, rect(hx - 4, hy - 52, 16, 12), INDIGO, 2.5);
  }
  if (prop === 'tiffin' && front) {
    for (let k = 0; k < 3; k++) {
      ink(c, rect(hx - 10, hy - 4 - k * 24, 50, 24), STEEL, 3);
      line(c, [[hx - 8, hy - 4 - k * 24 + 4], [hx + 38, hy - 4 - k * 24 + 4]], 1.5, CREAM);
    }
    line(c, [[hx - 6, hy - 76], [hx + 15, hy - 100], [hx + 36, hy - 76]], 4);
  }
  if (prop === 'book') {
    ink(c, [[hx - 34, hy - 10], [hx, hy - 4], [hx, hy - 50], [hx - 32, hy - 56]], CREAM, 3);
    ink(c, [[hx, hy - 4], [hx + 34, hy - 10], [hx + 36, hy - 56], [hx, hy - 50]], CREAM, 3);
    for (let k = 1; k < 4; k++) line(c, [[hx + 6, hy - 50 + k * 10], [hx + 28, hy - 54 + k * 10]], 1.5, OCHRE);
  }
  if (prop === 'broom') {
    tube(c, [[hx - 20, hy - 30], [hx + 70, -14]], 7, OCHRE, 2.5);
    ink(c, [[hx + 56, -24], [hx + 120, -2], [hx + 122, 0], [hx + 40, 0]], TURMERIC, 3, pattern(c, 'dash', BROWN));
  }
  if (prop === 'oar') {
    tube(c, [[hx - 50, hy - 80], [hx + 90, hy + 220]], 8, BROWN, 3);
    ink(c, ellipse(hx + 96, hy + 236, 12, 30, -0.45, 16), BROWN, 3);
  }
  if (prop === 'phone') {
    ink(c, [[hx - 18, hy - 54], [hx + 18, hy - 54], [hx + 22, hy + 2], [hx - 22, hy + 2]], 'rgba(244,234,208,0.8)', 2.5);
    ink(c, rect(hx - 9, hy - 44, 18, 32), INK, 0);
  }
}

// ---------------------------------------------------------------------------
// the street, its houses, and the water
// ---------------------------------------------------------------------------

//a grilled window: a painted frame, glass lit or dark, and the iron bars every house here has
function grilled(c: Ctx, x: number, y: number, w: number, h: number, glass: string) {
  ink(c, rect(x, y, w, h), glass, 4);
  for (let gx = x + 14; gx < x + w - 6; gx += 16) line(c, [[gx, y + 4], [gx, y + h - 4]], 2.5);
  line(c, [[x + 4, y + h * 0.35], [x + w - 4, y + h * 0.35]], 2.5);
  for (let gx = x + 14; gx < x + w - 14; gx += 32) {
    c.beginPath();
    c.arc(gx + 8, y + h * 0.35, 7, Math.PI, 0);
    c.lineWidth = 2;
    c.strokeStyle = INK;
    c.stroke();
  }
}

//a flat-roofed house: plastered walls, a parapet, a door, grilled windows and an optional balcony
function house(c: Ctx, x: number, w: number, floors: number, wall: string, trim: string, glass: string, balcony = false) {
  const ground = 700;
  const top = ground - floors * 230;
  ink(c, rect(x, top, w, floors * 230), wall, 4.5, pattern(c, 'dots', trim));
  ink(c, rect(x - 12, top - 26, w + 24, 26), trim, 4);
  for (let f = 0; f < floors; f++) {
    const fy = ground - (f + 1) * 230;
    if (f) ink(c, rect(x - 8, fy + 222, w + 16, 14), trim, 3.5);
    grilled(c, x + 40, fy + 70, 120, 100, glass);
    if (f === 0) ink(c, rect(x + w - 150, fy + 60, 100, 170), BROWN, 4, pattern(c, 'stripes', '#5e3820'));
    else grilled(c, x + w - 170, fy + 70, 120, 100, glass);
  }
  if (balcony) ink(c, rect(x + w - 240, ground - 238, 270, 16), trim, 4);
}

//a balcony railing, painted after whoever's standing on it
function railing(c: Ctx, x: number, w: number, y: number) {
  ink(c, rect(x, y - 60, w, 8), INK, 0);
  for (let rx = x + 10; rx < x + w; rx += 18) line(c, [[rx, y - 56], [rx, y]], 3);
  line(c, [[x, y - 30], [x + w, y - 30]], 3);
}

function palm(c: Ctx, x: number, y: number, h: number, color = GREEN, trunk = BROWN) {
  const top: Pt = [x + h * 0.14, y - h];
  tube(c, [[x, y], [x + h * 0.08, y - h * 0.5], top], 22, trunk);
  for (let k = 1; k < 9; k++) line(c, [[x + h * 0.012 * k - 10, y - (h * k) / 9], [x + h * 0.012 * k + 12, y - (h * k) / 9 - 4]], 2, CREAM);
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI + (k / 6) * Math.PI + (random() - 0.5) * 0.2;
    const [ex, ey] = [top[0] + Math.cos(a) * 170, top[1] + Math.sin(a) * 70 + 50];
    const [mx, my] = [top[0] + Math.cos(a) * 90, top[1] + Math.sin(a) * 90 - 10];
    ink(c, [top, [mx, my - 14], [ex, ey], [mx, my + 14]], color, 3.5, pattern(c, 'dash', CREAM));
  }
  for (const [dx, dy] of [[-10, 14], [10, 16], [0, 26]]) ink(c, ellipse(top[0] + dx, top[1] + dy, 10, 10, 0, 14), OCHRE, 3);
}

//an electric pole and its wires, sagging off both edges
function pole(c: Ctx, x: number, crows = 0) {
  tube(c, [[x, 720], [x, 150]], 14, STEEL);
  ink(c, rect(x - 60, 170, 120, 12), STEEL, 3);
  for (const dy of [0, 26]) {
    for (const [x0, x1] of [[0, x - 50], [x + 50, W]]) {
      const pts: Pt[] = Array.from({ length: 12 }, (_, i) => {
        const u = i / 11;
        return [x0 + (x1 - x0) * u, 176 + dy + Math.sin(u * Math.PI) * 40];
      });
      line(c, pts, 2);
    }
  }
  for (let k = 0; k < crows; k++) crow(c, x + 120 + k * 70, 214 + Math.sin((120 + k * 70) / 400) * 8, 1);
}

function crow(c: Ctx, x: number, y: number, s: number) {
  ink(c, ellipse(x, y - 14 * s, 14 * s, 10 * s, -0.2, 14), INK, 0);
  ink(c, ellipse(x + 12 * s, y - 26 * s, 7 * s, 7 * s, 0, 12), INK, 0);
  ink(c, [[x + 18 * s, y - 28 * s], [x + 28 * s, y - 25 * s], [x + 18 * s, y - 23 * s]], INK, 0);
  ink(c, [[x - 12 * s, y - 12 * s], [x - 28 * s, y - 4 * s], [x - 10 * s, y - 6 * s]], INK, 0);
}

//the far-off tower of a temple, tier on tier
function gopuram(c: Ctx, x: number, y: number, s: number, color: string, trim: string) {
  for (let k = 0; k < 6; k++) {
    const [w0, w1] = [(130 - k * 18) * s, (130 - (k + 1) * 18) * s];
    const [y0, y1] = [y - k * 40 * s, y - (k + 1) * 40 * s];
    ink(c, [[x - w0 / 2, y0], [x + w0 / 2, y0], [x + w1 / 2, y1], [x - w1 / 2, y1]], color, 3, pattern(c, 'dots', trim));
  }
  ink(c, [[x - 30 * s, y - 240 * s], [x + 30 * s, y - 240 * s], [x + 20 * s, y - 272 * s], [x - 20 * s, y - 272 * s]], color, 3);
  for (const dx of [-14, 0, 14]) line(c, [[x + dx * s, y - 272 * s], [x + dx * s, y - 290 * s]], 3);
}

//rain clouds drawn as rows of curls
function clouds(c: Ctx, y: number, color: string, trim: string) {
  const circles: [number, number, number][] = [];
  for (let x = 0; x < W + 80; x += 70 + random() * 40) circles.push([x, y + (random() - 0.5) * 30, 50 + random() * 30]);
  blobs(c, circles, color, pattern(c, 'curls', trim));
}

//water: a wavering top edge and scallops all the way down
function water(c: Ctx, y: number, color = INDIGO, trim = INDIGO_PALE, x0 = 0, x1 = W) {
  const top: Pt[] = [];
  for (let x = x1; x >= x0; x -= 40) top.push([x, y + Math.sin(x / 60) * 5]);
  ink(c, [[x0, H + 10], [x1, H + 10], ...top], color, 4, pattern(c, 'waves', trim));
}

function sun(c: Ctx, x: number, y: number, r: number) {
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    ink(c, [[x + Math.cos(a - 0.12) * r, y + Math.sin(a - 0.12) * r], [x + Math.cos(a) * (r + 34), y + Math.sin(a) * (r + 34)], [x + Math.cos(a + 0.12) * r, y + Math.sin(a + 0.12) * r]], MADDER, 3);
  }
  ink(c, ellipse(x, y, r, r), TURMERIC, 4, pattern(c, 'flowers', OCHRE));
}

function streetScene(c: Ctx, beat: string) {
  const lit = beat !== 'flood';
  c.fillStyle = INDIGO_DEEP;
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'dots', '#24305a');
  c.fillRect(0, 0, W, H);
  clouds(c, 70, INDIGO, '#45568a');
  ink(c, rect(-10, 700, W + 20, 220), '#3a2a22', 0, pattern(c, 'dots', '#4c3a2e'));
  //your building on the left, Rajan sir's house across from it
  house(c, 110, 520, 2, '#8e6a3e', '#6e4f2c', lit ? TURMERIC : INDIGO_DEEP, true);
  railing(c, 390, 270, 462);
  house(c, 1010, 430, 1, '#7a5a6a', '#5e4252', lit ? TURMERIC : INDIGO_DEEP);
  palm(c, 820, 700, 470, GREEN_DARK, '#5a3a22');
  pole(c, 720);
  for (const [x0, x1] of [[60, 640], [960, 1520]]) {
    ink(c, rect(x0, 630, x1 - x0, 70), '#6e5a4a', 4, pattern(c, 'dots', '#584638'));
    ink(c, rect(x0 + 200, 610, 120, 90), INK, 0);
    for (let gx = x0 + 208; gx < x0 + 320; gx += 14) line(c, [[gx, 612], [gx, 698]], 3, STEEL);
  }
  if (lit) ink(c, ellipse(720, 230, 22, 12), TURMERIC, 3);
  if (beat === 'rain') water(c, 750, INDIGO, '#5a6c9c');
  if (beat === 'flood') water(c, 610, INDIGO, '#5a6c9c');
}

// ---------------------------------------------------------------------------
// the landing, and your flat at night
// ---------------------------------------------------------------------------

const LANDING_WINDOW: [number, number, number, number] = [600, 150, 170, 150];
const FLAT_WINDOW: [number, number, number, number] = [1000, 150, 240, 200];

function landingScene(c: Ctx) {
  c.fillStyle = '#4a2a20';
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'flowers', '#5e3628');
  c.fillRect(0, 0, W, 700);
  grilled(c, ...LANDING_WINDOW, INDIGO_DEEP);
  ink(c, rect(-10, 700, W + 20, 220), '#6e2a20', 4, pattern(c, 'dots', '#83392c'));
  //the stairs going down on the left, and the water a few steps from the bottom
  for (let k = 0; k < 6; k++) ink(c, rect(420 - (k + 1) * 64, 700 + k * 26, 64, 220), '#5e2620', 3.5);
  water(c, 800, INDIGO, '#5a6c9c', 0, 220);
  line(c, [[440, 470], [80, 640]], 8, BROWN);
  for (let k = 0; k < 6; k++) line(c, [[420 - k * 64, 480 + k * 30], [420 - k * 64, 700 + k * 26]], 3);
  //your door, open, on the right
  ink(c, rect(1330, 120, 260, 600), '#1c1410', 0);
  ink(c, rect(1310, 110, 40, 600), BROWN, 4, pattern(c, 'stripes', '#5e3820'));
  ink(c, rect(1330, 100, 240, 26), BROWN, 4);
  for (const [x, rx] of [[560, 70], [720, 60], [880, 80]]) ink(c, ellipse(x + 10, 836, rx, 14), INDIGO, 3, pattern(c, 'waves', '#5a6c9c'));
  person(c, { who: 'paati', pose: 'hold', prop: 'photo', face: 'worried', x: 560, y: 830, s: 1.4 });
  person(c, { who: 'arun', pose: 'stand', prop: 'bag', face: 'worried', x: 720, y: 830, s: 1.4 });
  person(c, { who: 'selvi', pose: 'hold', prop: 'cooker', face: 'worried', x: 880, y: 830, s: 1.4 });
  person(c, { who: 'you', pose: 'hold', prop: 'torch', face: 'worried', x: 1250, y: 840, s: 1.45, flip: true });
}

function flatScene(c: Ctx, beat: string) {
  const asleep = beat === 'sleep';
  c.fillStyle = '#2c2a48';
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'flowers', '#3d3a5e');
  c.fillRect(0, 0, W, 620);
  ink(c, rect(-10, 620, W + 20, 300), '#6e2a20', 4, pattern(c, 'dots', '#83392c'));
  //the steel cupboard, a calendar, the window and the kitchen door
  ink(c, rect(80, 200, 210, 440), '#6c6a66', 4.5);
  line(c, [[185, 210], [185, 630]], 3);
  ink(c, rect(196, 380, 8, 50), CREAM, 2);
  ink(c, rect(420, 160, 130, 170), CREAM, 4);
  ink(c, rect(430, 170, 110, 70), MADDER, 3);
  ink(c, ellipse(485, 214, 22, 12), ROSE, 2.5);
  for (let k = 0; k < 4; k++) line(c, [[430, 254 + k * 18], [540, 254 + k * 18]], 1.5, OCHRE);
  grilled(c, ...FLAT_WINDOW, INDIGO_DEEP);
  ink(c, rect(1330, 180, 240, 460), '#1c1410', 4);
  ink(c, rect(1340, 430, 230, 30), '#3a3632', 3);
  ink(c, rect(1380, 404, 110, 26), STEEL, 3);
  ink(c, [[1320, 560], [1390, 560], [1400, 660], [1310, 660]], CREAM, 3.5, pattern(c, 'dots', MADDER));
  for (const x of [1220, 1270]) ink(c, [[x - 20, 600], [x + 20, 600], [x + 22, 660], [x - 22, 660]], INDIGO_PALE, 3, pattern(c, 'stripes', '#a7b5d2'));
  //the candle on a steel plate, and everyone round it
  ink(c, ellipse(800, 712, 62, 16), STEEL, 3.5);
  ink(c, rect(792, asleep ? 680 : 660, 16, asleep ? 30 : 50), CREAM, 3);
  person(c, { who: 'paati', pose: 'sit', face: asleep ? 'shut' : 'worried', x: 330, y: 770, s: 1.3 });
  if (asleep) person(c, { who: 'arun', pose: 'stand', face: 'shut', x: 600, y: 736, s: 1.3, turn: -Math.PI / 2 });
  else person(c, { who: 'arun', pose: 'sit', face: 'calm', x: 470, y: 770, s: 1.3 });
  person(c, { who: 'you', pose: 'sit', face: asleep ? 'calm' : 'worried', x: 610, y: 790, s: 1.3 });
  person(c, { who: 'selvi', pose: 'sit', face: asleep ? 'shut' : 'calm', x: 1000, y: 780, s: 1.3, flip: true });
  person(c, { who: 'faisal', pose: 'sit', prop: asleep ? undefined : 'torch', face: asleep ? 'shut' : 'smile', x: 1160, y: 800, s: 1.3, flip: true });
  ink(c, rect(1030, 806, 50, 24), TURMERIC, 3, pattern(c, 'stripes', MADDER));
}

// ---------------------------------------------------------------------------
// the flooded street by day, and the walk through it
// ---------------------------------------------------------------------------

function boat(c: Ctx, x: number, y: number, s: number, passengers: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  if (passengers) for (let k = 0; k < passengers; k++) {
    const px = -130 + k * 70;
    ink(c, ellipse(px, -40, 26, 30), [MADDER, GREEN, INDIGO, TURMERIC][k % 4], 3);
    ink(c, ellipse(px + 4, -86, 17, 19), ['#7b4a2a', '#9a6038', '#6a3e22', '#8a5532'][k % 4], 3);
    ink(c, ellipse(px, -96, 17, 10), k === 3 ? '#ece6d6' : INK, 2.5);
  }
  //a fishing boat with its prow and stern raised, painted the way they paint them on the coast
  ink(c, [[-240, -70], [-190, -20], [190, -20], [250, -80], [230, 10], [160, 40], [-160, 40], [-226, 0]], MADDER, 5, pattern(c, 'flowers', TURMERIC));
  ink(c, [[-200, -10], [200, -10], [186, 8], [-186, 8]], TURMERIC, 3);
  ink(c, ellipse(-190, -26, 14, 8), CREAM, 2.5);
  ink(c, ellipse(-186, -26, 5, 5, 0, 10), INK, 0);
  c.restore();
}

function floodScene(c: Ctx, beat: string) {
  c.fillStyle = '#a6b0c6';
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'dash', '#8f9ab4');
  c.fillRect(0, 0, W, 500);
  clouds(c, 60, '#c3cad9', '#8f9ab4');
  house(c, 70, 540, 2, '#d8b678', OCHRE, INDIGO);
  house(c, 1000, 470, 1, '#cfa3a0', ROSE, INDIGO);
  palm(c, 850, 700, 500);
  pole(c, 690, beat === 'leaving' ? 0 : 3);
  //an autorickshaw drowned to its roof
  ink(c, [[700, 590], [720, 530], [860, 524], [890, 590]], INK, 4);
  line(c, [[716, 546], [872, 540]], 8, TURMERIC);

  //on your balcony
  if (beat === 'faisal') {
    person(c, { who: 'you', pose: 'stand', face: 'worried', x: 470, y: 462, s: 0.8 });
    person(c, { who: 'faisal', pose: 'offer', face: 'worried', x: 580, y: 462, s: 0.8, flip: true });
  }
  if (beat === 'boat') {
    person(c, { who: 'paati', pose: 'stand', face: 'worried', x: 430, y: 462, s: 0.8 });
    person(c, { who: 'arun', pose: 'stand', prop: 'bag', face: 'smile', x: 500, y: 462, s: 0.8 });
    person(c, { who: 'selvi', pose: 'stand', face: 'calm', x: 560, y: 462, s: 0.8 });
  }
  ink(c, rect(370, 462, 270, 16), OCHRE, 4);
  railing(c, 370, 270, 462);

  water(c, WATER.flood!);
  if (beat === 'boat') {
    person(c, { who: 'rower', pose: 'sit', face: 'calm', x: 690, y: 620, s: 0.9 });
    person(c, { who: 'muthu', pose: 'row', prop: 'oar', face: 'calm', x: 1010, y: 610, s: 0.95, flip: true });
    boat(c, 860, 650, 1, 0);
  }
  if (beat === 'leaving') {
    boat(c, 1300, 640, 0.6, 4);
    person(c, { who: 'muthu', pose: 'row', prop: 'oar', x: 1430, y: 616, s: 0.55 });
  }
  if (beat === 'morning') caption(c, 'Morning');
}

function wadeScene(c: Ctx, beat: string) {
  c.fillStyle = '#b3bccf';
  c.fillRect(0, 0, W, H);
  clouds(c, 50, '#cdd3e0', '#97a2bb');
  gopuram(c, 1240, 470, 1, '#b8a48a', '#8e7a60');
  //the far side of the road, half under
  for (let x = 40; x < W; x += 230 + random() * 60) {
    const h = 160 + random() * 120;
    ink(c, rect(x, 560 - h, 200, h + 40), pick(['#d8b678', '#cfa3a0', '#a9c0a0', '#d9cdb0']), 4, pattern(c, 'dots', OCHRE));
    grilled(c, x + 50, 600 - h + 30, 100, 70, INDIGO);
  }
  palm(c, 300, 600, 420);
  palm(c, 1460, 600, 380);
  pole(c, 960, 2);
  if (beat === 'alone') person(c, { who: 'you', pose: 'carry', prop: 'phone', face: 'worried', x: 800, y: 900, s: 1.35 });
  else {
    person(c, { who: 'you', pose: 'carry', prop: 'phone', face: 'worried', x: 620, y: 900, s: 1.35 });
    person(c, { who: 'faisal', pose: 'hold', face: 'smile', x: 1000, y: 900, s: 1.35, flip: true });
    line(c, [[700, 640], [800, 620], [920, 630]], 4, CREAM);
  }
  water(c, WATER.wade!);
  for (const x of beat === 'alone' ? [800] : [620, 1000]) {
    c.lineWidth = 3;
    c.strokeStyle = '#a7b5d2';
    for (const r of [60, 90]) {
      trace(c, ellipse(x + 10, WATER.wade! + 8, r, r * 0.18));
      c.stroke();
    }
  }
}

function shopScene(c: Ctx) {
  c.fillStyle = '#d6a75a';
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'flowers', '#c4924a');
  c.fillRect(0, 0, W, H);
  //the board: in English and in Tamil
  ink(c, rect(300, 80, 1000, 130), MADDER, 5, pattern(c, 'dots', MADDER_DARK));
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = CREAM;
  c.font = `bold 58px ${SERIF}`;
  c.fillText('KUMAR STORES', 800, 126);
  c.fillStyle = TURMERIC;
  c.font = `36px ${SERIF}`;
  c.fillText('குமார் ஸ்டோர்ஸ்', 800, 182);
  //the shutter half up, and the shop behind it
  ink(c, rect(340, 236, 920, 430), '#2a1e18', 4);
  for (let y = 250; y < 660; y += 70) {
    ink(c, rect(360, y + 40, 880, 10), BROWN, 2.5);
    for (let x = 370 + random() * 20; x < 1220; x += 40 + random() * 20)
      ink(c, rect(x, y + 40 - 26 - random() * 10, 26, 30), pick([MADDER, TURMERIC, GREEN, INDIGO_PALE, CREAM, ROSE]), 2.5);
  }
  ink(c, rect(330, 220, 940, 150), STEEL, 4.5);
  for (let y = 232; y < 370; y += 14) line(c, [[334, y], [1266, y]], 2, '#6c6a66');
  //bananas hanging from the shutter
  for (let k = 0; k < 7; k++) ink(c, ellipse(420 + (k % 3) * 18, 400 + Math.floor(k / 3) * 24, 9, 22, 0.3, 14), '#b8b048', 2.5);
  person(c, { who: 'kumar', pose: 'offer', prop: 'can', face: 'smile', x: 760, y: 900, s: 1.3 });
  for (let k = 0; k < 4; k++) ink(c, [[440 + (k % 2) * 60, 520 - Math.floor(k / 2) * 76], [490 + (k % 2) * 60, 520 - Math.floor(k / 2) * 76], [494 + (k % 2) * 60, 594 - Math.floor(k / 2) * 76], [436 + (k % 2) * 60, 594 - Math.floor(k / 2) * 76]], INDIGO_PALE, 3, pattern(c, 'stripes', '#a7b5d2'));
  ink(c, rect(330, 600, 940, 70), OCHRE, 4.5, pattern(c, 'flowers', BROWN));
  person(c, { who: 'you', pose: 'hold', face: 'calm', x: 1200, y: 960, s: 1.35, flip: true });
  water(c, WATER.shop!);
}

function windowScene(c: Ctx) {
  c.fillStyle = '#d8b46a';
  c.fillRect(0, 0, W, H);
  c.fillStyle = pattern(c, 'flowers', '#c39a50');
  c.fillRect(0, 0, W, H);
  //the room inside: books, his wife's photo with its garland, and the water already in
  ink(c, rect(360, 110, 880, 580), '#3b2c2a', 5);
  ink(c, rect(400, 150, 300, 420), BROWN, 4);
  for (let k = 0; k < 4; k++) {
    const y = 150 + k * 105;
    ink(c, rect(400, y + 96, 300, 10), '#5e3820', 2.5);
    for (let x = 410; x < 690; x += 16 + random() * 10) ink(c, rect(x, y + 30 + random() * 20, 14, 66 - random() * 20), pick([MADDER, INDIGO, GREEN, TURMERIC, CREAM, ROSE]), 2);
  }
  ink(c, rect(960, 170, 150, 180), BROWN, 4);
  ink(c, rect(976, 186, 118, 148), CREAM, 2.5);
  ink(c, ellipse(1035, 240, 26, 30), '#6a5a48', 0);
  ink(c, [[990, 334], [1080, 334], [1066, 290], [1004, 290]], '#6a5a48', 0);
  for (let k = 0; k <= 16; k++) {
    const a = Math.PI * (k / 16);
    ink(c, ellipse(1035 - Math.cos(a) * 82, 180 + Math.sin(a) * 110, 9, 9, 0, 12), k % 2 ? TURMERIC : MADDER, 2);
  }
  ink(c, rect(640, 630, 300, 24), BROWN, 4);
  person(c, { who: 'rajan', pose: 'carry', prop: 'book', face: 'worried', x: 800, y: 632, s: 1.15, flip: true });
  water(c, 660, INDIGO, '#5a6c9c', 362, 1238);
  //the window's shutters, its grill and the sill
  for (const x of [270, 1240]) ink(c, rect(x, 110, 90, 580), INDIGO, 4, pattern(c, 'flowers', INDIGO_PALE));
  for (let gx = 400; gx < 1230; gx += 44) line(c, [[gx, 114], [gx, 686]], 5);
  line(c, [[364, 300], [1236, 300]], 5);
  for (let gx = 400; gx < 1200; gx += 88) {
    c.beginPath();
    c.arc(gx + 22, 300, 20, Math.PI, 0);
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.stroke();
  }
  ink(c, rect(250, 686, 1100, 22), '#a89a84', 4);
  water(c, WATER.window!);
}

// ---------------------------------------------------------------------------
// after the water, and the terrace
// ---------------------------------------------------------------------------

function afterScene(c: Ctx) {
  c.fillStyle = '#ecd59a';
  c.fillRect(0, 0, W, H);
  sun(c, 1320, 170, 64);
  house(c, 70, 540, 2, '#d8b678', OCHRE, INDIGO, true);
  railing(c, 370, 270, 462);
  house(c, 1000, 470, 1, '#cfa3a0', ROSE, INDIGO);
  palm(c, 850, 700, 500);
  pole(c, 690, 4);
  //the brown line the water left on every wall
  c.fillStyle = 'rgba(110,70,40,0.35)';
  c.fillRect(0, 570, W, 140);
  for (let x = 0; x < W; x += 30) line(c, [[x, 570 + Math.sin(x / 50) * 4], [x + 30, 570 + Math.sin((x + 30) / 50) * 4]], 6, BROWN);
  ink(c, rect(-10, 700, W + 20, 220), MUD, 4, pattern(c, 'dots', BROWN));
  //what came out of the houses
  ink(c, [[640, 700], [700, 470], [790, 480], [740, 700]], CREAM, 4, pattern(c, 'stripes', MADDER));
  ink(c, rect(900, 520, 90, 180), '#e6e0d0', 4);
  line(c, [[904, 590], [986, 590]], 3);
  ink(c, rect(1120, 760, 240, 60), '#c9b48a', 3);
  for (let k = 0; k < 6; k++) ink(c, rect(1130 + k * 38, 770 - random() * 8, 30, 40), pick([MADDER, INDIGO, GREEN, TURMERIC]), 2.5);
  person(c, { who: 'selvi', pose: 'sweep', prop: 'broom', face: 'calm', x: 380, y: 840, s: 1.35 });
  person(c, { who: 'you', pose: 'stand', face: 'calm', x: 1000, y: 850, s: 1.35, flip: true });
}

const BANDS: Record<string, string[]> = {
  evening: ['#b4452e', '#c9643e', '#d98a4a', '#e4ad5a', '#edcd88'],
  end: ['#18223e', '#24305a', '#3a3e6a', '#7a4a5a', '#c47a52'],
};

function terraceScene(c: Ctx, beat: string) {
  const bands = BANDS[beat === 'end' ? 'end' : 'evening'];
  bands.forEach((color, i) => {
    c.fillStyle = color;
    c.fillRect(0, i * 110, W, 120);
    c.fillStyle = pattern(c, 'dots', bands[Math.max(0, i - 1)]);
    c.fillRect(0, i * 110, W, 30);
  });
  if (beat !== 'end') sun(c, 280, 470, 70);
  //the city's rooftops, water tanks and a temple tower
  const far = beat === 'end' ? '#2a2a48' : '#7a4a4a';
  gopuram(c, 1060, 520, 0.9, far, beat === 'end' ? '#3a3a5a' : '#8a5a5a');
  for (let x = 0; x < W; x += 140 + random() * 80) {
    const h = 40 + random() * 70;
    ink(c, rect(x, 520 - h, 120, h + 20), far, 3);
    if (random() < 0.5) ink(c, rect(x + 30, 490 - h, 40, 32), INK, 2.5);
  }
  palm(c, 1500, 540, 300, beat === 'end' ? '#2a3a2a' : GREEN_DARK, beat === 'end' ? '#2a2020' : BROWN);
  ink(c, rect(-10, 520, W + 20, 90), '#d6c49c', 4, pattern(c, 'dots', OCHRE));
  ink(c, rect(-10, 600, W + 20, 320), '#cdbf9e', 4, pattern(c, 'dots', '#b8a882'));
  //the black water tank, and a saree drying on the line
  ink(c, rect(1290, 350, 150, 220), INK, 4);
  for (let y = 380; y < 560; y += 40) line(c, [[1294, y], [1436, y]], 2, '#3a3632');
  line(c, [[100, 330], [1280, 360]], 2.5);
  ink(c, [[300, 334], [760, 345], [770, 470], [310, 452]], MADDER, 3.5, pattern(c, 'flowers', TURMERIC));
  ink(c, [[310, 430], [770, 448], [770, 470], [310, 452]], TURMERIC, 2.5);
  ink(c, [[880, 348], [990, 351], [994, 440], [884, 436]], CREAM, 3, pattern(c, 'stripes', INDIGO_PALE));
  //the books laid out to dry
  for (let row = 0; row < 3; row++) {
    for (let x = 100 + row * 30; x < 1500; x += 120 + random() * 30) {
      const y = 660 + row * 70;
      if (beat !== 'tiffin' && x > 420 && x < 900 && row < 2) continue;
      ink(c, [[x, y], [x + 40, y + 6], [x + 40, y + 46], [x, y + 40]], CREAM, 2.5);
      ink(c, [[x + 40, y + 6], [x + 80, y], [x + 80, y + 40], [x + 40, y + 46]], CREAM, 2.5);
      line(c, [[x - 2, y + 42], [x + 40, y + 50], [x + 82, y + 42]], 5, pick([MADDER, INDIGO, GREEN, TURMERIC]));
    }
  }
  if (beat === 'tiffin') {
    person(c, { who: 'rajan', pose: 'sit', prop: 'book', face: 'calm', x: 180, y: 640, s: 0.8 });
    person(c, { who: 'arun', pose: 'sit', face: 'calm', x: 290, y: 640, s: 0.8, flip: true });
    person(c, { who: 'you', pose: 'stand', face: 'smile', x: 660, y: 850, s: 1.35 });
    person(c, { who: 'selvi', pose: 'offer', prop: 'tiffin', face: 'smile', x: 960, y: 850, s: 1.35, flip: true });
  } else {
    person(c, { who: 'rajan', pose: 'sit', prop: 'book', face: 'smile', x: 560, y: 800, s: 1.3 });
    person(c, { who: 'arun', pose: 'sit', prop: 'book', face: 'smile', x: 860, y: 800, s: 1.3, flip: true });
  }
}

const BACKDROP: Record<SetId, (c: Ctx, beat: string) => void> = {
  street: streetScene,
  landing: landingScene,
  flat: flatScene,
  flood: floodScene,
  wade: wadeScene,
  shop: shopScene,
  window: windowScene,
  after: afterScene,
  terrace: terraceScene,
};

const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//cloths are slow to paint, so each is made once and kept, dropping the oldest past a limit
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(cue: Cue) {
  const key = `${cue.set}:${cue.beat}`;
  let made = backdrops.get(key);
  if (!made) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(W, H);
    BACKDROP[cue.set](c, cue.beat);
    //dye soaks into cotton: warm the whole cloth, then lay the weave over it
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = CLOTH;
    c.fillRect(0, 0, W, H);
    c.drawImage(weave(), 0, 0);
    c.globalCompositeOperation = 'source-over';
    made = el;
    backdrops.set(key, el);
    if (backdrops.size > 10) backdrops.delete(backdrops.keys().next().value!);
  }
  return made;
}

// ---------------------------------------------------------------------------
// what moves on the cloth
// ---------------------------------------------------------------------------

function rain(c: Ctx, t: number, n: number, color: string, clip?: [number, number, number, number]) {
  c.save();
  if (clip) {
    c.beginPath();
    c.rect(...clip);
    c.clip();
  }
  c.strokeStyle = color;
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const y = (rand(i) * H + t * (700 + rand(i + 3) * 300)) % (H + 40) - 20;
    const x = (rand(i + 7) * (W + 200) + y * 0.18) % (W + 200) - 100;
    c.moveTo(x, y);
    c.lineTo(x + 5, y + 26);
  }
  c.stroke();
  c.restore();
}

//little scallops riding along the top of the water
function ripples(c: Ctx, t: number, y: number, color = '#a7b5d2') {
  c.strokeStyle = color;
  c.lineWidth = 2.5;
  for (let i = 0; i < 26; i++) {
    const x = ((rand(i) * W + t * (10 + rand(i + 2) * 14)) % (W + 80)) - 40;
    const dy = 14 + rand(i + 5) * 120 + Math.sin(t * 1.4 + i) * 3;
    c.beginPath();
    c.arc(x, y + dy, 12 + rand(i + 9) * 10, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  }
}

//candle and torch light, flickering
function glow(c: Ctx, x: number, y: number, r: number, t: number, strength = 0.32) {
  const f = 0.85 + 0.1 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23);
  const g = c.createRadialGradient(x, y, 0, x, y, r * f);
  g.addColorStop(0, `rgba(255,200,110,${strength * f})`);
  g.addColorStop(0.5, `rgba(240,150,70,${strength * 0.35 * f})`);
  g.addColorStop(1, 'rgba(240,150,70,0)');
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

function flame(c: Ctx, x: number, y: number, t: number, s: number) {
  const sway = Math.sin(t * 5) * 3 + Math.sin(t * 13) * 1.5;
  const h = (30 + Math.sin(t * 11) * 4) * s;
  trace(c, [[x - 8 * s, y], [x - 7 * s, y - h * 0.4], [x + sway, y - h], [x + 7 * s, y - h * 0.4], [x + 8 * s, y]]);
  c.fillStyle = TURMERIC;
  c.fill();
  c.lineWidth = 2.5;
  c.strokeStyle = INK;
  c.stroke();
  trace(c, ellipse(x, y - 8 * s, 3.5 * s, 7 * s, 0, 12));
  c.fillStyle = CREAM;
  c.fill();
}

//a flash as the cue comes up, then now and again, with a bolt painted across the clouds at the brightest
function lightning(c: Ctx, since: number) {
  const age = since % 9;
  const a = Math.max(0, 1 - age / 0.5) * (age < 0.08 || (age > 0.16 && age < 0.26) ? 1 : 0.5);
  if (a <= 0) return;
  c.fillStyle = `rgba(244,234,208,${0.35 * a})`;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = a;
  const bolt: Pt[] = [[1180, 60], [1150, 160], [1190, 170], [1130, 300], [1160, 305], [1110, 420]];
  for (const [width, color] of [[14, INK], [6, CREAM]] as const) {
    trace(c, bolt, false);
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.strokeStyle = color;
    c.stroke();
  }
  c.globalAlpha = 1;
}

//a plastic chair and a slipper drifting slowly down the street
function debris(c: Ctx, t: number, y: number) {
  const x = ((t * 16) % (W + 400)) - 200;
  const bob = Math.sin(t * 1.3) * 4;
  c.save();
  c.translate(x, y + 20 + bob);
  c.rotate(Math.sin(t * 0.3) * 0.4);
  trace(c, [[-40, 0], [-34, -60], [30, -60], [36, 0]]);
  c.fillStyle = '#4f8f6a';
  c.fill();
  c.lineWidth = 3.5;
  c.strokeStyle = INK;
  c.stroke();
  c.restore();
  const sx = ((t * 11 + 700) % (W + 400)) - 200;
  trace(c, ellipse(sx, y + 70 + Math.sin(t * 1.7) * 3, 22, 8, 0.1, 16));
  c.fillStyle = MADDER;
  c.fill();
  c.stroke();
}

function crows(c: Ctx, t: number) {
  for (let i = 0; i < 3; i++) {
    const x = ((t * (60 + rand(i) * 30) + rand(i + 4) * W) % (W + 200)) - 100;
    const y = 120 + rand(i + 8) * 160 + Math.sin(t + i) * 10;
    const flap = Math.sin(t * 9 + i * 2) * 14;
    line(c, [[x - 26, y - flap], [x, y], [x + 26, y - flap]], 5);
  }
}

function stars(c: Ctx, t: number) {
  for (let i = 0; i < 26; i++) {
    const r = 2 + 2 * (0.5 + 0.5 * Math.sin(t * (1 + rand(i)) + i));
    const [x, y] = [BORDER + rand(i + 40) * (W - BORDER * 2), BORDER + 20 + rand(i + 80) * 300];
    c.fillStyle = CREAM;
    trace(c, [[x, y - r * 2], [x + r * 0.6, y], [x, y + r * 2], [x - r * 0.6, y]]);
    c.fill();
  }
}

function drawLive(c: Ctx, { set, beat }: Cue, t: number, since: number) {
  if (set === 'street') {
    if (beat === 'flood') lightning(c, since);
    rain(c, t, 160, 'rgba(244,234,208,0.5)');
    if (beat !== 'title') ripples(c, t, beat === 'flood' ? 610 : 750, '#5a6c9c');
  }
  if (set === 'landing') {
    rain(c, t, 30, 'rgba(244,234,208,0.5)', LANDING_WINDOW);
    glow(c, 1150, 560, 620, t);
  }
  if (set === 'flat') {
    const sleep = beat === 'sleep';
    rain(c, t, 40, 'rgba(244,234,208,0.5)', FLAT_WINDOW);
    flame(c, 800, sleep ? 680 : 660, t, sleep ? 0.7 : 1);
    glow(c, 800, 640, sleep ? 460 : 640, t, sleep ? 0.24 : 0.32);
  }
  if (set === 'flood') {
    rain(c, t, 70, 'rgba(43,60,107,0.35)');
    ripples(c, t, WATER.flood!);
    if (beat === 'morning') debris(c, t, WATER.flood!);
  }
  if (set === 'wade') {
    rain(c, t, 60, 'rgba(43,60,107,0.35)');
    ripples(c, t, WATER.wade!);
  }
  if (set === 'shop') ripples(c, t, WATER.shop!);
  if (set === 'window') {
    rain(c, t, 40, 'rgba(43,60,107,0.3)');
    ripples(c, t, WATER.window!);
  }
  if (set === 'after') crows(c, t);
  if (set === 'terrace') {
    if (beat === 'end') stars(c, t);
    else crows(c, t * 0.6);
  }
}

//a roll of cloth: the backdrop and live layer, the camera creeping in, and the temple border
function drawPanel(c: Ctx, cue: Cue, t: number, since: number, drift: number) {
  c.save();
  const z = 1 + DRIFT * (1 - (1 - Math.min(1, drift / DRIFT_TIME)) ** 2);
  c.translate(800, 420);
  c.scale(z, z);
  c.translate(-800, -420);
  c.drawImage(backdrop(cue), 0, 0);
  drawLive(c, cue, t, since);
  c.restore();
  c.drawImage(frame(), 0, 0);
}

//the rolled-up end of a cloth as it unrolls down over the last one
function roll(c: Ctx, y: number) {
  c.fillStyle = 'rgba(34,26,20,0.3)';
  c.fillRect(0, y, W, 18);
  const g = c.createLinearGradient(0, y - 22, 0, y + 22);
  g.addColorStop(0, '#8a6a44');
  g.addColorStop(0.45, CLOTH);
  g.addColorStop(1, '#7a5a38');
  c.fillStyle = g;
  c.fillRect(0, y - 22, W, 44);
  c.fillStyle = MADDER;
  c.fillRect(0, y - 8, W, 10);
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.strokeRect(-4, y - 22, W + 8, 44);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  storm: new URL('./sounds/storm.m4a', import.meta.url).href,
  indoors: new URL('./sounds/indoors.m4a', import.meta.url).href,
  drizzle: new URL('./sounds/drizzle.m4a', import.meta.url).href,
  water: new URL('./sounds/water.m4a', import.meta.url).href,
  morning: new URL('./sounds/morning.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'street') return { storm: beat === 'title' ? 0.4 : 0.6 };
  if (set === 'landing') return { storm: 0.25, indoors: 0.35 };
  if (set === 'flat') return { indoors: beat === 'sleep' ? 0.4 : 0.55 };
  if (set === 'flood') return { drizzle: 0.4, water: 0.35 };
  if (set === 'wade') return { water: 0.6, drizzle: 0.3 };
  if (set === 'shop' || set === 'window') return { water: 0.4, drizzle: 0.2 };
  if (set === 'after') return { morning: 0.5 };
  return { morning: beat === 'end' ? 0.15 : 0.3 };
}

const WADE = new URL('./sounds/wade.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  street_flood: { src: new URL('./sounds/thunder.m4a', import.meta.url).href, volume: 0.7 },
  landing_knock: { src: new URL('./sounds/knock.m4a', import.meta.url).href, volume: 0.6, delay: 0.4 },
  wade_alone: { src: WADE, volume: 0.5, delay: 0.3 },
  wade_together: { src: WADE, volume: 0.5, delay: 0.3 },
  flood_boat: { src: new URL('./sounds/boat.m4a', import.meta.url).href, volume: 0.5, delay: 0.3 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function Monsoon({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Monsoon has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  //setAt is when the current set came up, so the camera keeps creeping across beats on the same set
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active], setAt: 0, prevSetAt: 0 });
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
      const { cue, at, prev, setAt, prevSetAt } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      //a new set unrolls down over the last cloth, a new beat cross-fades over it
      if (prev.set !== cue.set && since < UNROLL) {
        drawPanel(c, prev, t, since, (now - prevSetAt) / 1000);
        const edge = (H + 30) * ease(since / UNROLL);
        c.save();
        c.beginPath();
        c.rect(0, 0, W, edge);
        c.clip();
        drawPanel(c, cue, t, since, since);
        c.restore();
        roll(c, edge);
      } else {
        const drift = (now - setAt) / 1000;
        if (prev !== cue && prev.set === cue.set && since < BEAT_FADE) {
          drawPanel(c, prev, t, since, drift);
          c.globalAlpha = ease(since / BEAT_FADE);
        }
        drawPanel(c, cue, t, since, drift);
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
    const { cue, setAt } = shown.current;
    const next = cues[active];
    shown.current = { cue: next, at: now, prev: cue, setAt: next.set === cue.set && setAt ? setAt : now, prevSetAt: setAt };
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
    background: INDIGO_DEEP,
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
    fontFamily: SERIF,
    color: INK,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 24,
    letterSpacing: 6,
    textTransform: 'uppercase',
    padding: '6px 22px',
    background: CREAM,
    border: `3px solid ${INK}`,
    outline: `3px solid ${CREAM}`,
  },
  name: {
    fontSize: 84,
    fontStyle: 'italic',
    padding: '4px 44px 10px',
    color: CREAM,
    background: MADDER,
    border: `5px solid ${INK}`,
    outline: `4px solid ${TURMERIC}`,
    outlineOffset: -14,
  },
};

export default Monsoon;
