import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Hive is drawn like a 1960s comic on a 2D canvas: flat process colours inside thick ink outlines, shading and
// skies printed as Ben-Day dots, hand-lettered captions and balloons, all on yellowing newsprint.
// Every cue is its own panel, inked once and kept. A new set slides in over the last like the next panel on the page,
// a new beat on the same set cross-fades, and the camera creeps slowly into whichever panel is up.
// Bees, spray, steam, moths, stars and the buzzing phone are drawn live on top.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const SLIDE = 0.55; //seconds a new panel takes to slide in over the last
const BEAT_FADE = 0.45; //seconds to cross-fade a new beat on the same set
const DRIFT = 0.035; //how far the camera creeps into a panel
const DRIFT_TIME = 14; //and how long it takes
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = '#1d1a17';
const PAPER = '#f1e5c6';
const WHITE = '#fbf6e8';
const SKY = '#8fd0e8';
const CYAN = '#3fa7c9';
const YELLOW = '#f7cf3d';
const MUSTARD = '#e3a92b';
const RED = '#d8392e';
const DARK_RED = '#8f1e17';
const PINK = '#f2a3b6';
const MAGENTA = '#c8417a';
const BLUE = '#2f5ea8';
const NAVY = '#24345e';
const GREEN = '#5aa04a';
const LEAF = '#3f7d3a';
const GRASS = '#93bf55';
const SOIL = '#8a5a34';
const WOOD = '#c28d58';
const GRAIN = '#8a5a34';
const SKIN = '#f3bf95';
const GREY = '#a9a49a';
const WALL = '#efdcae';
const LETTERING = '"Bangers", "Comic Sans MS", cursive';
const HAND = '"Patrick Hand", "Comic Sans MS", cursive';

//the panel's inside edge, inset from the page
const PX0 = 22;
const PY0 = 22;
const PX1 = W - 22;
const PY1 = H - 22;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'allotment' | 'letter' | 'phone' | 'hall' | 'outside' | 'dusk';

interface Cue {
  set: SetId;
  beat: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'allotment', beat: 'empty', card: ['Proven Wrong', 'The Hive'] },
  allotment_you: { set: 'allotment', beat: 'you' },
  allotment_dead: { set: 'allotment', beat: 'dead' },
  allotment_walt: { set: 'allotment', beat: 'walt' },
  allotment_pru: { set: 'allotment', beat: 'pru' },
  allotment_spring: { set: 'allotment', beat: 'spring' },
  allotment_spring_walt: { set: 'allotment', beat: 'spring_walt' },
  letter: { set: 'letter', beat: 'first' },
  letter_second: { set: 'letter', beat: 'second' },
  phone_history: { set: 'phone', beat: 'history' },
  phone_confess: { set: 'phone', beat: 'confess' },
  hall_history: { set: 'hall', beat: 'history' },
  hall_seated: { set: 'hall', beat: 'seated' },
  hall_walt: { set: 'hall', beat: 'walt' },
  hall_standing: { set: 'hall', beat: 'standing' },
  outside_walt: { set: 'outside', beat: 'walt' },
  outside_empty: { set: 'outside', beat: 'empty' },
  dusk: { set: 'dusk', beat: 'sunset' },
  dusk_late: { set: 'dusk', beat: 'late' },
  the_end: { set: 'allotment', beat: 'spring_end' },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// ink and dots
// ---------------------------------------------------------------------------

//panels use a seeded random so the same panel always comes out the same
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

function line(c: Ctx, points: Pt[], width: number, color = INK) {
  trace(c, points, false);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = width;
  c.strokeStyle = color;
  c.stroke();
}

//a grid of dots in one colour, set at a screen angle like a printing plate
const tiles = new Map<string, HTMLCanvasElement>();
function dots(c: Ctx, color: string, r = 2.6, step = 10) {
  const key = `${color}:${r}:${step}`;
  let tile = tiles.get(key);
  if (!tile) {
    const [el, t] = canvas2d(step, step);
    t.fillStyle = color;
    for (const [x, y] of [[0, 0], [step, 0], [0, step], [step, step], [step / 2, step / 2]]) {
      t.beginPath();
      t.arc(x, y, r, 0, Math.PI * 2);
      t.fill();
    }
    tile = el;
    tiles.set(key, el);
  }
  const pattern = c.createPattern(tile, 'repeat')!;
  pattern.setTransform(new DOMMatrix().rotate(15));
  return pattern;
}

//a flat shape with an ink line round it. shade prints dots over the part of it right of edge
function ink(c: Ctx, points: Pt[], color: string, width = 5, shade?: string, edge = -1e5) {
  trace(c, points);
  c.fillStyle = color;
  c.fill();
  if (shade) {
    c.save();
    c.clip();
    c.fillStyle = dots(c, shade);
    c.fillRect(edge, -1e5, 2e5, 2e5);
    c.restore();
  }
  if (width) {
    trace(c, points);
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

//a limb, cane or hose: a thick stroke with an ink line either side
function tube(c: Ctx, points: Pt[], width: number, color: string, outline = 4) {
  if (outline) line(c, points, width + outline * 2);
  line(c, points, width, color);
}

//overlapping circles inked as one shape, like a cloud or a bush
function blobs(c: Ctx, circles: [number, number, number][], color: string, shade?: string) {
  c.fillStyle = INK;
  for (const [x, y, r] of circles) {
    trace(c, ellipse(x, y, r + 5, r + 5, 0, 24));
    c.fill();
  }
  c.fillStyle = color;
  for (const [x, y, r] of circles) {
    trace(c, ellipse(x, y, r, r, 0, 24));
    c.fill();
  }
  if (shade) {
    c.fillStyle = dots(c, shade);
    for (const [x, y, r] of circles) {
      trace(c, ellipse(x + r * 0.3, y + r * 0.3, r * 0.7, r * 0.7, 0, 24));
      c.fill();
    }
  }
}

//a sky or a shadow printed as dots that swell from r0 at the top of the box to r1 at the bottom
function dotFade(c: Ctx, x: number, y: number, w: number, h: number, color: string, r0: number, r1: number, step = 14) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = color;
  for (let j = 0, py = y; py < y + h + step; j++, py += step * 0.866) {
    const r = r0 + (r1 - r0) * Math.min(1, Math.max(0, (py - y) / h));
    if (r < 0.3) continue;
    c.beginPath();
    for (let px = x + ((j % 2) * step) / 2; px < x + w + step; px += step) {
      c.moveTo(px + r, py);
      c.arc(px, py, r, 0, Math.PI * 2);
    }
    c.fill();
  }
  c.restore();
}

//a yellow caption box in the corner of a panel
function caption(c: Ctx, text: string, x = PX0 + 24, y = PY0 + 22) {
  c.font = `36px ${LETTERING}`;
  const w = c.measureText(text).width + 40;
  ink(c, rect(x, y, w, 58), YELLOW, 5);
  c.fillStyle = INK;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(text, x + 20, y + 31);
}

//a speech balloon over (x, y) with its tail pointing at (tx, ty)
function balloon(c: Ctx, text: string, x: number, y: number, tx: number, ty: number, size = 44) {
  c.font = `${size}px ${LETTERING}`;
  const w = c.measureText(text).width / 2 + 50;
  const h = size * 0.95;
  //both shapes are outlined before either is filled, so the tail joins the balloon without a seam
  const shapes = [[[x - 26, y + h * 0.6], [tx, ty], [x + 20, y + h * 0.7]] as Pt[], ellipse(x, y, w, h)];
  for (const shape of shapes) line(c, [...shape, shape[0]], 10);
  for (const shape of shapes) ink(c, shape, WHITE, 0);
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x, y + 3);
}

//a sound effect lettered straight onto the panel
function sfx(c: Ctx, text: string, x: number, y: number, size: number, color: string, turn = -0.12) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.font = `${size}px ${LETTERING}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = size * 0.16;
  c.strokeStyle = INK;
  c.strokeText(text, 0, 0);
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}

function wrap(c: Ctx, text: string, width: number) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1];
    if (last && c.measureText(`${last} ${word}`).width > width) lines.push(word);
    else lines[lines.length - 1] = last ? `${last} ${word}` : word;
  }
  return lines;
}

//newsprint: yellowed, with flecks in the pulp. Made once and laid over every panel
let paperCanvas: HTMLCanvasElement | undefined;
function newsprint() {
  if (paperCanvas) return paperCanvas;
  const [el, c] = canvas2d(W, H);
  const r = seeded(11);
  for (let i = 0; i < 5000; i++) {
    c.fillStyle = r() < 0.7 ? 'rgba(90,60,20,0.1)' : 'rgba(255,255,240,0.25)';
    c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  paperCanvas = el;
  return el;
}

// ---------------------------------------------------------------------------
// people: inked once per panel, in the pose the panel needs
// ---------------------------------------------------------------------------

type Who = 'you' | 'walt' | 'pru' | 'dunmore';
type Pose = 'stand' | 'point' | 'hold' | 'read' | 'crossed' | 'spray' | 'offer' | 'hips' | 'sit' | 'sit_crossed';
type Face = 'calm' | 'cross' | 'glum' | 'smile' | 'shock';
type Prop = 'letter' | 'box' | 'plant' | 'wand';
type Limb = [Pt, Pt, Pt];

//each person faces right with their feet at (0, 0). Arms and legs run shoulder/hip, elbow/knee, hand/foot, far one first.
//front puts both arms in front of the body, for folded arms
interface Rig {
  head: Pt;
  tilt: number;
  neck: Pt;
  hip: Pt;
  arms: [Limb, Limb];
  legs: [Limb, Limb];
  front?: boolean;
}

const UP = { head: [10, -296] as Pt, tilt: 0, neck: [4, -258] as Pt, hip: [0, -150] as Pt, legs: [[[-4, -150], [-8, -76], [-12, 0]], [[6, -150], [10, -76], [14, 0]]] as [Limb, Limb] };
const DOWN = { head: [12, -254] as Pt, tilt: 0, neck: [4, -214] as Pt, hip: [0, -104] as Pt, legs: [[[-4, -104], [56, -108], [54, 0]], [[6, -104], [66, -104], [66, 0]]] as [Limb, Limb] };
const FAR_DOWN: Limb = [[-8, -246], [-16, -196], [-12, -146]];

const RIGS: Record<Pose, Rig> = {
  stand: { ...UP, arms: [FAR_DOWN, [[14, -246], [22, -196], [22, -146]]] },
  point: { ...UP, tilt: -0.08, arms: [FAR_DOWN, [[14, -246], [64, -262], [116, -290]]] },
  hold: { ...UP, arms: [[[-8, -246], [12, -198], [44, -204]], [[14, -246], [30, -194], [60, -200]]] },
  read: { ...UP, head: [16, -290], tilt: 0.32, arms: [[[-8, -246], [12, -192], [44, -192]], [[14, -246], [30, -188], [60, -190]]] },
  crossed: { ...UP, front: true, arms: [[[-8, -246], [-4, -196], [40, -208]], [[14, -246], [26, -196], [-4, -210]]] },
  spray: { ...UP, arms: [[[-8, -246], [4, -198], [30, -176]], [[14, -246], [50, -216], [88, -206]]] },
  offer: { ...UP, arms: [FAR_DOWN, [[14, -246], [58, -238], [104, -234]]] },
  hips: { ...UP, arms: [[[-8, -246], [-38, -204], [-12, -164]], [[14, -246], [46, -204], [20, -164]]] },
  sit: { ...DOWN, arms: [[[-8, -204], [22, -150], [52, -120]], [[14, -204], [38, -146], [62, -116]]] },
  sit_crossed: { ...DOWN, front: true, arms: [[[-8, -204], [-4, -156], [40, -166]], [[14, -204], [26, -154], [-4, -168]]] },
};

interface Look {
  top: string;
  shade: string;
  legs: string;
  shoes: string;
  hair: string;
  coat?: boolean; //a coat down to the knees
}

const LOOKS: Record<Who, Look> = {
  you: { top: MUSTARD, shade: '#a8721a', legs: BLUE, shoes: INK, hair: '#4a2f22' },
  walt: { top: '#7b8a3e', shade: '#4f5a22', legs: '#7a5c3a', shoes: INK, hair: WHITE },
  pru: { top: RED, shade: DARK_RED, legs: INK, shoes: GREEN, hair: '#b9b4ac', coat: true },
  dunmore: { top: '#8c5aa0', shade: '#5b3368', legs: NAVY, shoes: INK, hair: '#d9d4cc' },
};

interface Placed {
  who: Who;
  pose: Pose;
  x: number;
  y: number; //where the feet are
  s: number;
  flip?: boolean; //facing left
  face?: Face;
  prop?: Prop;
  tie?: boolean;
  tone?: string; //draws them as a flat silhouette in this colour
}

function person(c: Ctx, { who, pose, x, y, s, flip, face = 'calm', prop, tie, tone }: Placed) {
  const rig = RIGS[pose];
  const look = LOOKS[who];
  const { head, tilt, neck, hip, arms, legs } = rig;
  const col = (color: string) => tone ?? color;
  const shade = (color: string) => (tone ? undefined : color);
  //a point on the head, turned with it
  const at = (dx: number, dy: number): Pt => [head[0] + dx * Math.cos(tilt) - dy * Math.sin(tilt), head[1] + dx * Math.sin(tilt) + dy * Math.cos(tilt)];
  const arm = (l: Limb) => {
    tube(c, l, 18, col(look.top));
    ink(c, ellipse(...l[2], 9, 9), col(SKIN), 4);
  };

  c.save();
  c.translate(x, y);
  c.scale(flip ? -s : s, s);
  for (const l of legs) {
    tube(c, l, 24, col(look.legs));
    ink(c, ellipse(l[2][0] + 9, l[2][1] - 6, 17, 8), col(look.shoes), 4);
  }
  if (!rig.front) arm(arms[0]);
  tube(c, [neck, at(-4, 26)], 14, col(SKIN));
  const body: Pt[] = look.coat
    ? [[neck[0] - 30, neck[1] + 8], [neck[0] + 26, neck[1] + 8], [hip[0] + 38, hip[1] + 78], [hip[0] - 40, hip[1] + 78]]
    : [[neck[0] - 30, neck[1] + 8], [neck[0] + 26, neck[1] + 8], [hip[0] + 26, hip[1] + 8], [hip[0] - 28, hip[1] + 8]];
  ink(c, body, col(look.top), 5, shade(look.shade), hip[0] + 6);
  if (tie && !tone) ink(c, [[neck[0] + 2, neck[1] + 8], [neck[0] + 10, neck[1] + 8], [neck[0] + 13, neck[1] + 70], [neck[0] + 5, neck[1] + 82], [neck[0] - 1, neck[1] + 70]], RED, 3);
  if (who === 'dunmore' && !tone) for (let k = -3; k <= 3; k++) ink(c, ellipse(neck[0] + k * 6, neck[1] + 16 + Math.abs(k) * -1.5, 3.5, 3.5, 0, 10), WHITE, 1.5);
  if (rig.front) arm(arms[0]);

  //the head: ear, hair, face
  ink(c, ellipse(head[0], head[1], 28, 31, tilt), col(SKIN), 5, shade('#d98f63'), head[0] + 14);
  ink(c, ellipse(...at(-8, 2), 6, 9, tilt, 16), col(SKIN), 3.5);
  hair(c, who, at, col);
  if (!tone) features(c, who, at, face);

  if (prop) props(c, prop, arms, col);
  arm(arms[1]);
  c.restore();
}

function hair(c: Ctx, who: Who, at: (dx: number, dy: number) => Pt, col: (color: string) => string) {
  const color = col(LOOKS[who].hair);
  if (who === 'you') ink(c, [at(-31, 8), at(-31, -14), at(-20, -32), at(2, -38), at(22, -33), at(32, -16), at(22, -21), at(14, -14), at(6, -22), at(-6, -14), at(-14, -4), at(-20, 10)], color, 4);
  if (who === 'pru') ink(c, [at(-36, 26), at(-36, -12), at(-24, -34), at(0, -40), at(24, -32), at(33, -14), at(16, -20), at(4, -14), at(-8, -4), at(-12, 26)], color, 4, col('#7f7a72'), -1e5);
  if (who === 'dunmore') {
    ink(c, ellipse(...at(-24, -30), 15, 14, 0, 20), color, 4);
    ink(c, [at(-32, 10), at(-30, -18), at(-12, -36), at(14, -36), at(30, -18), at(14, -22), at(-6, -18), at(-18, -2), at(-20, 14)], color, 4);
  }
  if (who === 'walt') {
    ink(c, [at(-30, 12), at(-31, -6), at(-18, -4), at(-20, 10)], color, 3.5);
    ink(c, [at(-32, -6), at(-26, -28), at(-4, -38), at(22, -33), at(48, -18), at(46, -11), at(20, -14), at(-30, -2)], col('#7a5c3a'), 4, col('#4e3a24'), -1e5);
  }
}

function features(c: Ctx, who: Who, at: (dx: number, dy: number) => Pt, face: Face) {
  c.fillStyle = INK;
  for (const ex of [6, 19]) {
    trace(c, ellipse(...at(ex, -4), face === 'shock' ? 3.6 : 3, face === 'shock' ? 5 : 4.2, 0, 12));
    c.fill();
  }
  const brows: Record<Face, number[]> = { calm: [-15, -16], smile: [-16, -17], cross: [-17, -11], glum: [-11, -17], shock: [-19, -19] };
  const [outer, inner] = brows[face];
  line(c, [at(-1, outer), at(9, inner)], 3.5);
  line(c, [at(15, inner), at(25, outer)], 3.5);
  line(c, [at(27, -2), at(33, 8), at(26, 10)], 3);
  if (face === 'shock') ink(c, ellipse(...at(17, 19), 4, 5, 0, 12), INK, 0);
  else if (face === 'smile') {
    c.beginPath();
    c.moveTo(...at(9, 15));
    c.quadraticCurveTo(...at(16, 25), ...at(25, 15));
    c.stroke();
  } else if (face === 'glum') {
    c.beginPath();
    c.moveTo(...at(10, 21));
    c.quadraticCurveTo(...at(16, 15), ...at(23, 21));
    c.stroke();
  } else line(c, [at(11, 18), at(23, face === 'cross' ? 18 : 17)], 3);

  if (who === 'walt') ink(c, ellipse(...at(19, 11), 12, 5, 0, 16), WHITE, 3);
  if (who === 'pru') {
    for (const ex of [6, 19]) {
      trace(c, ellipse(...at(ex, -4), 7.5, 7.5, 0, 16));
      c.lineWidth = 2.5;
      c.stroke();
    }
  }
  if (who === 'dunmore') line(c, [at(0, -1), at(25, -1)], 2.5);
}

function props(c: Ctx, prop: Prop, arms: [Limb, Limb], col: (color: string) => string) {
  const [hx, hy] = arms[1][2];
  if (prop === 'letter') {
    ink(c, [[hx - 34, hy - 46], [hx + 10, hy - 52], [hx + 16, hy + 8], [hx - 28, hy + 14]], col(WHITE), 3.5);
    for (let k = 0; k < 4; k++) line(c, [[hx - 24, hy - 34 + k * 10], [hx + 4, hy - 38 + k * 10]], 2, col(GREY));
  }
  if (prop === 'box') {
    for (let k = 0; k < 3; k++) ink(c, rect(hx - 50 + k * 14, hy - 44 - k * 4, 34, 30), col(WHITE), 3);
    ink(c, rect(hx - 64, hy - 22, 80, 46), col(WOOD), 4, col(GRAIN), hx - 10);
  }
  if (prop === 'plant') {
    ink(c, [[hx - 18, hy + 30], [hx + 6, hy - 50], [hx + 44, hy - 40], [hx + 6, hy + 34]], col(WHITE), 3.5, col(GREY), -1e5);
    for (const [lx, ly] of [[-6, -62], [20, -70], [36, -58]]) ink(c, ellipse(hx + lx, hy + ly, 12, 7, 0.6, 12), col(GREEN), 3);
    ink(c, ellipse(hx + 14, hy - 80, 13, 13, 0, 16), col(PINK), 3, col(MAGENTA), -1e5);
  }
  if (prop === 'wand') {
    tube(c, [[hx, hy], [hx + 60, hy + 26], [hx + 96, hy + 50]], 5, col(GREY), 2.5);
    ink(c, rect(hx + 92, hy + 44, 14, 12), col(INK), 0);
  }
}

// ---------------------------------------------------------------------------
// the allotment
// ---------------------------------------------------------------------------

//where the bees go in and out, at the front of each hive
const HIVES: Pt[] = [[1110, 612], [1310, 602]];
const BEES: Record<string, number> = { empty: 7, you: 7, dead: 2, walt: 4, pru: 0, spring: 16, spring_walt: 12, spring_end: 16 };

//a hive on its stand: a brood box, two supers and the roof
function hive(c: Ctx, x: number, y: number, tone?: string) {
  const col = (color: string) => tone ?? color;
  const shade = tone ? undefined : '#b8b2a4';
  for (const dx of [-60, 50]) ink(c, rect(x + dx, y - 60, 10, 60), col(WOOD), 4);
  ink(c, rect(x - 84, y - 72, 168, 14), col(WOOD), 4);
  let top = y - 72;
  for (const h of [86, 64, 64]) {
    ink(c, rect(x - 72, top - h, 144, h), col(WHITE), 5, shade, x + 30);
    if (!tone) ink(c, ellipse(x, top - h / 2, 18, 5, 0, 16), '#7d776c', 3);
    top -= h;
  }
  ink(c, rect(x - 86, top - 26, 172, 26), col(GREY), 5, tone ? undefined : '#6f6a62', x + 30);
  if (!tone) ink(c, rect(x - 30, y - 84, 60, 9), INK, 0);
}

function shed(c: Ctx, x: number, y: number, w: number, h: number, color: string, shade: string) {
  ink(c, rect(x, y - h, w, h), color, 5, shade, x + w * 0.7);
  for (let k = x + 22; k < x + w - 8; k += 22) line(c, [[k, y - h + 4], [k, y - 4]], 2, shade);
  ink(c, [[x - 22, y - h + 8], [x + w / 2, y - h - 64], [x + w + 22, y - h + 8]], '#4a4440', 5);
  ink(c, rect(x + w * 0.56, y - h * 0.78, w * 0.3, h * 0.78), shade, 4);
  ink(c, rect(x + w * 0.12, y - h * 0.7, w * 0.28, h * 0.26), SKY, 4, CYAN, -1e5);
  line(c, [[x + w * 0.26, y - h * 0.7], [x + w * 0.26, y - h * 0.44]], 3);
}

function roses(c: Ctx, x: number, y: number) {
  blobs(c, [[x - 40, y - 40, 34], [x, y - 70, 40], [x + 42, y - 38, 32], [x, y - 20, 36]], LEAF, '#25502a');
  for (const [dx, dy] of [[-40, -56], [6, -92], [36, -50], [-8, -32], [26, -14]]) {
    ink(c, ellipse(x + dx, y + dy, 13, 13, 0, 16), RED, 3.5, DARK_RED, -1e5);
    c.beginPath();
    c.arc(x + dx, y + dy, 6, 0.5, 5);
    c.lineWidth = 2;
    c.stroke();
  }
}

function allotmentScene(c: Ctx, beat: string) {
  const spring = beat.startsWith('spring');
  c.fillStyle = SKY;
  c.fillRect(0, 0, W, 520);
  dotFade(c, 0, 0, W, 480, CYAN, 4.5, 0.4);
  blobs(c, [[190, 150, 40], [240, 124, 52], [300, 132, 46], [350, 156, 36], [260, 166, 40]], WHITE);
  blobs(c, [[1050, 110, 34], [1100, 86, 46], [1160, 98, 40], [1200, 120, 30]], WHITE);

  //the far side of the site: a hill, a church spire and a row of other people's sheds
  ink(c, [[-10, 470], [-10, 420], [300, 392], [700, 410], [1100, 380], [1610, 410], [1610, 470]], '#a9cc6a', 5, '#6f9a3c', -1e5);
  ink(c, [[728, 400], [744, 300], [760, 400]], GREY, 4);
  ink(c, rect(722, 400, 44, 30), GREY, 4);
  for (let x = 30; x < 1560; x += 110 + random() * 80) {
    const [w, h, color] = [50 + random() * 40, 34 + random() * 20, pick([RED, BLUE, GREEN, YELLOW, WOOD])];
    ink(c, rect(x, 470 - h, w, h), color, 4);
    ink(c, [[x - 6, 474 - h], [x + w / 2, 452 - h], [x + w + 6, 474 - h]], '#4a4440', 4);
  }
  ink(c, rect(-10, 466, W + 20, 460), GRASS, 0);
  dotFade(c, 0, 470, W, 430, '#5d8f34', 0.4, 3.6);

  //the path up the middle, and the beds on your side of it
  ink(c, [[618, 466], [680, 466], [840, 920], [540, 920]], '#e2cb98', 5, '#b79f72', 760);
  for (let k = 0; k < 3; k++) {
    const y = 520 + k * 60;
    ink(c, [[760 + k * 30, y], [1500, y], [1520, y + 34], [740 + k * 40, y + 34]], SOIL, 4, '#5a3b22', -1e5);
    for (let x = 800 + k * 40; x < 1480; x += 46) {
      if (spring && random() < 0.5) ink(c, ellipse(x, y + 8, 7, 7, 0, 12), pick([YELLOW, PINK, WHITE]), 2.5);
      else line(c, [[x - 7, y + 4], [x, y + 16], [x + 7, y + 4]], 3, GREEN);
    }
  }
  shed(c, 1440, 650, 190, 260, WOOD, GRAIN);
  //bean canes tied in a wigwam
  for (const dx of [-50, -18, 18, 50]) line(c, [[880 + dx, 690], [880, 380]], 5, '#b08a4a');
  blobs(c, [[860, 470, 22], [900, 520, 24], [850, 590, 22], [910, 620, 20], [880, 420, 18]], GREEN, LEAF);
  if (spring) for (const [x, y] of [[870, 500], [905, 580]]) ink(c, ellipse(x, y, 8, 8, 0, 12), RED, 2.5);

  hive(c, 1110, 690);
  hive(c, 1310, 680);
  if (beat === 'dead') {
    for (let i = 0; i < 36; i++) {
      const [x, y] = [1040 + random() * 150, 700 + random() * 50];
      ink(c, ellipse(x, y, 6, 4, random() * 3, 10), random() < 0.5 ? INK : MUSTARD, 1.5);
    }
  }

  //Walt's plot over the fence: his shed, his roses, and a sprayer
  shed(c, -30, 560, 180, 200, GREEN, LEAF);
  for (const x of [230, 370, 510]) roses(c, x, 560);
  if (beat === 'walt') {
    tube(c, [[250, 600], [330, 520], [412, 434]], 4, INK, 0);
    person(c, { who: 'walt', pose: 'spray', prop: 'wand', face: 'calm', x: 320, y: 650, s: 1.05 });
  }
  if (beat === 'spring_walt') person(c, { who: 'walt', pose: 'offer', prop: 'plant', face: 'calm', x: 470, y: 660, s: 1.1 });
  for (let x = -10; x < 590; x += 34) ink(c, [[x, 650], [x, 574], [x + 12, 560], [x + 24, 574], [x + 24, 650]], WHITE, 4, '#c9c2b0', x + 14);
  ink(c, rect(-10, 590, 600, 12), WHITE, 4);

  if (beat === 'you') person(c, { who: 'you', pose: 'stand', x: 900, y: 860, s: 1.45 });
  if (beat === 'dead') person(c, { who: 'you', pose: 'read', face: 'glum', x: 920, y: 860, s: 1.45 });
  if (beat === 'walt') {
    person(c, { who: 'you', pose: 'crossed', face: 'cross', x: 1010, y: 860, s: 1.45, flip: true });
    sfx(c, 'PSSHHT!', 620, 420, 54, WHITE, -0.18);
  }
  if (beat === 'pru') {
    person(c, { who: 'pru', pose: 'hold', prop: 'box', face: 'cross', x: 640, y: 870, s: 1.45 });
    person(c, { who: 'you', pose: 'read', prop: 'letter', face: 'glum', x: 1010, y: 860, s: 1.45, flip: true });
  }
  if (beat === 'spring') person(c, { who: 'you', pose: 'stand', face: 'smile', x: 900, y: 860, s: 1.45 });
  if (beat === 'spring_walt') person(c, { who: 'you', pose: 'stand', face: 'smile', x: 860, y: 860, s: 1.45, flip: true });

  if (beat === 'empty' || beat === 'you') sfx(c, 'bzzz', 1440, 520, 46, YELLOW);
  if (spring) sfx(c, 'BZZZZ!', 1420, 500, 64, YELLOW);
  if (beat === 'spring') caption(c, 'NEXT SPRING...');
}

// ---------------------------------------------------------------------------
// the letter, and the phone
// ---------------------------------------------------------------------------

const LETTER_FOOT: Record<string, string[]> = {
  first: ['Losses typical of untreated varroa.', 'Was this colony treated for mites', 'this year?   J.M.'],
  second: ['Consistent with the first sample.', "Sorry it's not better news.   J.M."],
};

//the kitchen table, and the letter from the National Bee Unit held up close
function letterScene(c: Ctx, beat: string) {
  c.fillStyle = WALL;
  c.fillRect(0, 0, W, 320);
  for (let x = 40; x < W; x += 120) dotFade(c, x, 0, 50, 320, PINK, 3, 3, 12);
  ink(c, rect(1150, 40, 380, 230), SKY, 8, CYAN, -1e5);
  ink(c, rect(1150, 190, 380, 80), GRASS, 0);
  line(c, [[1340, 40], [1340, 270]], 8);
  ink(c, rect(-10, 290, W + 20, 640), WOOD, 5);
  for (let y = 320; y < H; y += 36 + random() * 20) line(c, [[0, y], [W, y + (random() - 0.5) * 20]], 2, GRAIN);
  dotFade(c, 0, 290, W, 610, GRAIN, 0.3, 3.4);

  //seed packets to one side, and a mug
  for (const [x, y, turn, color] of [[200, 420, -0.2, YELLOW], [300, 560, 0.15, PINK], [150, 650, 0.05, GREEN]] as [number, number, number, string][]) {
    c.save();
    c.translate(x, y);
    c.rotate(turn);
    ink(c, rect(-70, -90, 140, 180), color, 5);
    ink(c, rect(-50, -70, 100, 100), WHITE, 3.5);
    blobs(c, [[0, -20, 18]], pick([RED, MUSTARD, MAGENTA]));
    c.restore();
  }
  ink(c, [[1270, 520], [1410, 520], [1400, 680], [1280, 680]], RED, 5, DARK_RED, 1370);
  c.beginPath();
  c.arc(1412, 590, 36, -1.3, 1.3);
  c.lineWidth = 22;
  c.strokeStyle = INK;
  c.stroke();
  c.lineWidth = 12;
  c.strokeStyle = RED;
  c.stroke();
  ink(c, ellipse(1340, 520, 70, 14), '#5a3420', 5);

  //the letter, folded in three, and what it says
  c.save();
  c.translate(800, 520);
  c.rotate(-0.035);
  ink(c, rect(-320, -400, 640, 820), WHITE, 6);
  for (const y of [-130, 140]) dotFade(c, -318, y - 6, 636, 12, GREY, 1.4, 1.4, 8);
  c.save();
  c.translate(-240, -320);
  c.scale(2.2, 2.2);
  bee(c, 0, 0, 1, 0);
  c.restore();
  c.fillStyle = INK;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = 'bold 40px Georgia, "Times New Roman", serif';
  c.fillText('NATIONAL BEE UNIT', -190, -312);
  c.font = 'italic 24px Georgia, "Times New Roman", serif';
  c.fillText('Laboratory diagnosis', -190, -278);
  c.font = '24px Georgia, "Times New Roman", serif';
  c.fillText(`Sample ${beat === 'second' ? '2318' : '2291'}  ·  Plot 9, Fenwick Lane`, -270, -210);
  const rows: [string, string][] = [['Varroa mite', 'SEVERE'], ['Deformed wing virus', 'PRESENT'], ['Pesticide residues', 'NONE DETECTED']];
  rows.forEach(([label, result], i) => {
    const y = -120 + i * 60;
    if (i === 2) ink(c, rect(40, y - 34, 236, 46), 'rgba(247,207,61,0.75)', 0);
    c.font = '26px Georgia, "Times New Roman", serif';
    c.fillStyle = INK;
    c.fillText(label, -270, y);
    c.font = 'bold 26px Georgia, "Times New Roman", serif';
    c.fillText(result, 50, y);
    line(c, [[-270, y + 16], [270, y + 16]], 1.5, GREY);
  });
  c.font = `34px ${HAND}`;
  c.fillStyle = BLUE;
  LETTER_FOOT[beat].forEach((text, i) => c.fillText(text, -250, 120 + i * 44));
  c.restore();

  //your hands holding it
  for (const side of [-1, 1]) {
    const x = 800 + side * 330;
    tube(c, [[x + side * 120, 960], [x + side * 30, 800], [x, 720]], 64, MUSTARD);
    ink(c, ellipse(x, 700, 34, 42, side * 0.3), SKIN, 5, '#d98f63', x + side * 10);
    ink(c, ellipse(x - side * 30, 680, 22, 12, -side * 0.5, 16), SKIN, 4);
  }
  if (beat === 'second') caption(c, 'THURSDAY MORNING...');
}

type Msg = [from: string, text: string];
const THREAD: Record<string, Msg[]> = {
  history: [
    ['you', "It's the SPRAY. Look at them."],
    ['Pru (plot 14)', 'Disgraceful. Ashby wants stopping.'],
    ['Gail (plot 3)', 'Signed! x'],
    ['you', "40 signatures!! Vote's next Thursday. Spread the word"],
  ],
  confess: [
    ['you', "40 signatures!! Vote's next Thursday. Spread the word"],
    ['you', "Test results are back. No pesticide. It was mites, in my own hive, because I didn't treat them. I got this wrong, and I said it loudly. Walt, I'm sorry."],
  ],
};

//your phone held up close, the group chat open, against a pop-art burst
function phoneScene(c: Ctx, beat: string) {
  for (let k = 0; k < 24; k++) {
    const [a0, a1] = [(k / 24) * Math.PI * 2, ((k + 1) / 24) * Math.PI * 2];
    const wedge: Pt[] = [[800, 400], [800 + Math.cos(a0) * 1400, 400 + Math.sin(a0) * 1400], [800 + Math.cos(a1) * 1400, 400 + Math.sin(a1) * 1400]];
    ink(c, wedge, k % 2 ? YELLOW : PINK, 0, k % 2 ? MUSTARD : MAGENTA, -1e5);
  }
  c.fillStyle = INK;
  c.beginPath();
  c.roundRect(560, 30, 480, 1000, 56);
  c.fill();
  c.fillStyle = WHITE;
  c.beginPath();
  c.roundRect(584, 96, 432, 920, 30);
  c.fill();
  ink(c, rect(760, 56, 80, 10), '#3a3530', 0);
  c.fillStyle = INK;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `34px ${LETTERING}`;
  c.fillText('FENWICK LANE ALLOTMENTS', 610, 146);
  c.font = `22px ${HAND}`;
  c.fillText('43 members', 612, 174);
  line(c, [[584, 190], [1016, 190]], 3);

  let y = 214;
  c.font = `27px ${HAND}`;
  for (const [from, text] of THREAD[beat]) {
    const mine = from === 'you';
    const lines = wrap(c, text, 290);
    //the first message in the history has a photo of the dead bees under it
    const photo = beat === 'history' && y === 214;
    const bw = Math.max(Math.max(...lines.map((l) => c.measureText(l).width)) + 34, photo ? 250 : 0);
    const h = lines.length * 31 + 22 + (mine ? 0 : 24) + (photo ? 130 : 0);
    const x = mine ? 996 - bw : 604;
    c.beginPath();
    c.roundRect(x, y, bw, h, 18);
    c.fillStyle = mine ? YELLOW : '#e7e1d3';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = INK;
    c.stroke();
    let ty = y + 34;
    if (!mine) {
      c.font = `22px ${HAND}`;
      c.fillStyle = BLUE;
      c.fillText(from, x + 16, ty - 4);
      ty += 24;
      c.font = `27px ${HAND}`;
    }
    c.fillStyle = INK;
    lines.forEach((l, i) => c.fillText(l, x + 17, ty + i * 31));
    if (photo) {
      const [px, py] = [x + 14, y + h - 140];
      ink(c, rect(px, py, bw - 28, 124), '#7a6a3a', 3);
      for (let i = 0; i < 26; i++) ink(c, ellipse(px + 14 + random() * (bw - 56), py + 14 + random() * 96, 6, 4, random() * 3, 10), random() < 0.5 ? INK : MUSTARD, 1.5);
    }
    y += h + 20;
  }
  if (beat === 'confess') {
    c.font = `22px ${HAND}`;
    c.fillStyle = '#7d776c';
    c.textAlign = 'right';
    c.fillText('Seen by 12', 996, y + 4);
  }

  //your hand round it
  for (let k = 0; k < 3; k++) ink(c, ellipse(566, 560 + k * 80, 28, 36), SKIN, 5, '#d98f63', 570);
  tube(c, [[1240, 1000], [1110, 820], [1036, 700]], 64, SKIN);
  tube(c, [[1400, 1000], [1240, 1000]], 140, MUSTARD);
}

// ---------------------------------------------------------------------------
// the village hall, and outside it
// ---------------------------------------------------------------------------

const HAIRS = ['#4a2f22', '#d9d4cc', '#b9873f', '#2b2622', '#8a4b2a', '#b9b4ac', '#e0c27a'];
const COATS = [BLUE, GREEN, RED, '#8c5aa0', MUSTARD, NAVY, '#7b8a3e', '#5a8fb0'];
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

//someone in the audience from behind: shoulders, then a head that's mostly hair
function backOf(c: Ctx, x: number, y: number, r: number) {
  ink(c, ellipse(x, y + r * 1.7, r * 2, r * 1.1), pick(COATS), 4);
  ink(c, ellipse(x, y, r, r * 1.08), SKIN, 4);
  ink(c, ellipse(x, y - r * 0.16, r * 1.03, r * 0.96), pick(HAIRS), 4);
}

//someone in the audience turned to look at lookX
function faceOf(c: Ctx, x: number, y: number, r: number, lookX: number) {
  ink(c, ellipse(x, y + r * 1.7, r * 2, r * 1.1), pick(COATS), 4);
  ink(c, ellipse(x, y, r, r * 1.1), SKIN, 4, '#d98f63', x + r * 0.4);
  const top = random() < 0.5;
  ink(c, [[x - r * 1.06, y + (top ? -0.1 : 0.5) * r], [x - r * 0.9, y - r * 0.8], [x, y - r * 1.22], [x + r * 0.9, y - r * 0.8], [x + r * 1.06, y + (top ? -0.1 : 0.5) * r], [x + r * 0.6, y - r * 0.45], [x - r * 0.6, y - r * 0.45]], pick(HAIRS), 4);
  const look = Math.max(-1, Math.min(1, (lookX - x) / 300)) * r * 0.3;
  c.fillStyle = INK;
  for (const k of [-0.34, 0.34]) {
    trace(c, ellipse(x + k * r + look, y + r * 0.05, r * 0.09, r * 0.13, 0, 10));
    c.fill();
  }
  line(c, [[x - r * 0.18 + look, y + r * 0.55], [x + r * 0.18 + look, y + r * 0.55]], 2.5);
}

function chairBack(c: Ctx, x: number, y: number, s: number) {
  ink(c, rect(x - 36 * s, y, 72 * s, 50 * s), GREY, 4, '#6f6a62', x + 10 * s);
  for (const dx of [-30, 24]) ink(c, rect(x + dx * s, y + 50 * s, 6 * s, 90 * s), GREY, 3);
}

//the hall from the back of the room: the stage, its curtains and the society's banner
function hallRoom(c: Ctx) {
  c.fillStyle = WALL;
  c.fillRect(0, 0, W, 620);
  dotFade(c, 0, 0, W, 600, '#d9b978', 3.4, 0.5);
  ink(c, rect(-10, 470, W + 20, 140), WOOD, 5, GRAIN, -1e5);
  ink(c, rect(330, 90, 940, 400), '#4a1712', 5);
  for (const side of [-1, 1]) {
    const cx = 800 + side * 470;
    ink(c, [[cx, 90], [cx - side * 230, 90], [cx - side * 170, 280], [cx - side * 140, 490], [cx, 490]], RED, 5, DARK_RED, side < 0 ? 420 : 1080);
    for (let k = 1; k < 4; k++) line(c, [[cx - side * k * 50, 96], [cx - side * k * 42, 484]], 3, DARK_RED);
  }
  ink(c, rect(300, 56, 1000, 60), RED, 5, DARK_RED, -1e5);
  ink(c, rect(450, 140, 700, 74), YELLOW, 5);
  c.font = `46px ${LETTERING}`;
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('FENWICK LANE ALLOTMENT SOCIETY', 800, 180);
  ink(c, rect(300, 490, 1000, 60), WOOD, 5, GRAIN, -1e5);
  ink(c, rect(-10, 600, W + 20, 320), '#c99a62', 5);
  for (let k = -12; k <= 12; k++) line(c, [[800 + k * 40, 600], [800 + k * 170, H]], 2, GRAIN);
  ink(c, ellipse(150, 230, 52, 52), WHITE, 6);
  line(c, [[150, 230], [150, 196]], 5);
  line(c, [[150, 230], [150, 270]], 4);
}

function hallScene(c: Ctx, beat: string) {
  if (beat === 'seated') {
    hallRoom(c);
    person(c, { who: 'dunmore', pose: 'stand', face: 'calm', x: 790, y: 690, s: 0.9 });
    ink(c, rect(540, 470, 520, 70), WHITE, 5, '#d9d4cc', 900);
    ink(c, [[600, 400], [660, 400], [670, 470], [590, 470]], GREY, 4, '#6f6a62', 640);
    //the easel with the motion on it
    for (const dx of [-60, 60]) line(c, [[1180 + dx, 600], [1180, 300]], 8, WOOD);
    ink(c, rect(1090, 300, 180, 150), WHITE, 5);
    c.font = `40px ${LETTERING}`;
    c.fillStyle = RED;
    c.fillText('MOTION 4', 1180, 340);
    c.font = `28px ${LETTERING}`;
    c.fillStyle = INK;
    c.fillText('BAN ON', 1180, 384);
    c.fillText('SPRAYING', 1180, 418);
    for (const [y, r, step] of [[640, 30, 92], [720, 38, 116], [830, 48, 150]]) {
      for (let x = 60 + random() * 40; x < W; x += step + random() * 20) {
        if (Math.abs(x - 690) < step * 0.3) continue;
        backOf(c, x, y, r);
        chairBack(c, x, y + r * 2, r / 36);
      }
    }
  }

  if (beat === 'history') {
    hallRoom(c);
    for (let x = 80; x < W; x += 140) backOf(c, x, 820, 46);
    person(c, { who: 'walt', pose: 'sit_crossed', face: 'cross', x: 1180, y: 900, s: 1.4, flip: true });
    person(c, { who: 'you', pose: 'point', face: 'cross', x: 480, y: 900, s: 1.45 });
    balloon(c, "IT'S THE SPRAY!", 470, 230, 520, 370, 56);
    //the flashback is printed pinker, like an older issue
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#f4c4d2';
    c.fillRect(0, 0, W, H);
    c.restore();
    caption(c, 'JULY...');
  }

  if (beat === 'walt') {
    c.fillStyle = WALL;
    c.fillRect(0, 0, W, H);
    dotFade(c, 0, 0, W, 700, '#d9b978', 3.4, 0.6);
    ink(c, rect(-10, 560, W + 20, 400), WOOD, 5, GRAIN, -1e5);
    ink(c, rect(1020, 90, 380, 260), '#c08a4f', 6, '#8a5a34', -1e5);
    for (const [x, y, color, turn] of [[1060, 120, WHITE, -0.1], [1200, 110, YELLOW, 0.08], [1300, 200, PINK, -0.05], [1090, 240, WHITE, 0.06]] as [number, number, string, number][]) {
      c.save();
      c.translate(x + 50, y + 50);
      c.rotate(turn);
      ink(c, rect(-50, -50, 100, 90), color, 3);
      for (let k = 0; k < 3; k++) line(c, [[-34, -24 + k * 20], [30, -24 + k * 20]], 2, GREY);
      ink(c, ellipse(0, -44, 6, 6, 0, 10), RED, 2);
      c.restore();
    }
    chairBack(c, 790, 560, 2.4);
    person(c, { who: 'walt', pose: 'sit_crossed', face: 'cross', tie: true, x: 760, y: 1010, s: 2.3 });
    faceOf(c, 200, 470, 70, 0);
    faceOf(c, 1420, 500, 64, 1600);
  }

  if (beat === 'standing') {
    //from the stage, looking back down the hall at everyone looking at you
    c.fillStyle = WALL;
    c.fillRect(0, 0, W, H);
    dotFade(c, 0, 0, W, 500, '#d9b978', 3.4, 0.6);
    ink(c, rect(-10, 340, W + 20, 120), WOOD, 5, GRAIN, -1e5);
    ink(c, rect(660, 120, 280, 300), '#7a4b2a', 5, GRAIN, 800);
    line(c, [[800, 120], [800, 420]], 4);
    ink(c, rect(735, 70, 130, 40), GREEN, 4);
    c.font = `30px ${LETTERING}`;
    c.fillStyle = WHITE;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('EXIT', 800, 92);
    ink(c, rect(-10, 450, W + 20, 500), '#c99a62', 5);
    const you = 1010;
    for (let x = 40 + random() * 30; x < W; x += 82) if (Math.abs(x - you) > 60) faceOf(c, x, 440, 26, you);
    person(c, { who: 'you', pose: 'stand', face: 'shock', x: you, y: 760, s: 1.2, flip: true });
    for (let x = 20 + random() * 40; x < W; x += 100) if (Math.abs(x - you) > 70) faceOf(c, x, 560, 33, you);
    for (let x = 60 + random() * 40; x < W; x += 132) faceOf(c, x, 720, 44, you);
  }
}

function outsideScene(c: Ctx, beat: string) {
  c.fillStyle = '#f08a6c';
  c.fillRect(0, 0, W, 700);
  dotFade(c, 0, 0, W, 560, NAVY, 6.5, 0.3);
  //the hall's brick wall, its lit door and the noticeboard
  ink(c, rect(880, 110, 740, 640), '#b0553a', 5, '#7a3424', -1e5);
  for (let y = 130, row = 0; y < 740; y += 30, row++) {
    line(c, [[880, y], [1620, y]], 2, '#7a3424');
    for (let x = 880 + (row % 2) * 40; x < 1620; x += 80) line(c, [[x, y], [x, y + 30]], 2, '#7a3424');
  }
  ink(c, rect(1060, 320, 190, 430), YELLOW, 6, MUSTARD, 1180);
  ink(c, rect(1030, 260, 250, 50), NAVY, 5);
  c.font = `34px ${LETTERING}`;
  c.fillStyle = YELLOW;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('VILLAGE HALL', 1155, 287);
  ink(c, rect(1340, 330, 220, 170), '#c08a4f', 5);
  for (const [x, y, color] of [[1360, 350, WHITE], [1450, 345, YELLOW], [1380, 420, PINK], [1470, 420, WHITE]] as [number, number, string][]) ink(c, rect(x, y, 70, 60), color, 3);

  //the street lamp, the pavement and the bike rack
  ink(c, rect(-10, 740, W + 20, 200), '#9b968c', 5, '#6f6a62', -1e5);
  line(c, [[0, 760], [W, 760]], 4);
  tube(c, [[300, 760], [300, 200]], 16, NAVY);
  ink(c, [[260, 200], [340, 200], [320, 150], [280, 150]], NAVY, 5);
  ink(c, [[268, 200], [332, 200], [322, 250], [278, 250]], YELLOW, 5);
  for (const x of [560, 680, 800]) {
    c.beginPath();
    c.arc(x, 760, 50, Math.PI, 0);
    c.lineWidth = 16;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 8;
    c.strokeStyle = GREY;
    c.stroke();
  }
  if (beat === 'walt') {
    for (const x of [600, 760]) {
      ink(c, ellipse(x, 760, 56, 56), 'rgba(0,0,0,0)', 7);
      ink(c, ellipse(x, 760, 8, 8, 0, 12), INK, 0);
    }
    line(c, [[600, 760], [670, 680], [760, 760], [690, 760], [600, 760]], 9, RED);
    line(c, [[670, 680], [650, 650]], 8);
    line(c, [[690, 760], [730, 660], [760, 650]], 8);
    person(c, { who: 'walt', pose: 'crossed', face: 'cross', tie: true, x: 460, y: 860, s: 1.4 });
    person(c, { who: 'you', pose: 'stand', face: 'glum', x: 1000, y: 870, s: 1.45, flip: true });
    caption(c, 'AFTER THE VOTE...');
  } else person(c, { who: 'you', pose: 'stand', face: 'glum', x: 900, y: 870, s: 1.45, flip: true });
}

// ---------------------------------------------------------------------------
// the hives at dusk
// ---------------------------------------------------------------------------

const SUN: Pt = [500, 560];

function duskScene(c: Ctx, beat: string) {
  const late = beat === 'late';
  const tone = late ? '#121830' : '#3a2140';
  c.fillStyle = late ? '#2c3f73' : '#f7a24f';
  c.fillRect(0, 0, W, H);
  dotFade(c, 0, 0, W, 640, late ? '#141c3c' : MAGENTA, 6, 0.3);
  if (late) {
    ink(c, ellipse(1260, 170, 50, 50), WHITE, 5);
    ink(c, ellipse(1284, 156, 46, 46), '#2c3f73', 0);
  } else {
    ink(c, ellipse(...SUN, 150, 150), YELLOW, 0, RED, -1e5);
    ink(c, ellipse(...SUN, 110, 110), YELLOW, 0);
  }
  //everything on the ground is a cut-out against the sky
  ink(c, [[-10, 640], [400, 600], [900, 620], [1610, 590], [1610, 920], [-10, 920]], tone, 0);
  for (let x = -10; x < W; x += 34) ink(c, [[x, 650], [x, 560], [x + 12, 548], [x + 24, 560], [x + 24, 650]], tone, 0);
  ink(c, rect(-10, 580, W + 20, 12), tone, 0);
  for (const dx of [-50, -18, 18, 50]) line(c, [[300 + dx, 700], [300, 380]], 6, tone);
  blobs(c, [[290, 460, 22], [320, 520, 24], [280, 590, 22], [330, 620, 20]], tone);
  hive(c, 1080, 760, tone);
  hive(c, 1300, 748, tone);
  ink(c, rect(780, 730, 130, 100), tone, 0);
  person(c, { who: 'you', pose: 'sit', x: 790, y: 830, s: 1.6, tone });
  if (late) {
    //the blackbird on a fence post
    ink(c, ellipse(1480, 528, 26, 16, -0.2), tone, 0);
    ink(c, ellipse(1500, 508, 12, 11), tone, 0);
    ink(c, [[1508, 506], [1526, 510], [1508, 514]], MUSTARD, 0);
    ink(c, [[1458, 532], [1420, 520], [1424, 540]], tone, 0);
  }
}

const BACKDROP: Record<SetId, (c: Ctx, beat: string) => void> = {
  allotment: allotmentScene,
  letter: letterScene,
  phone: phoneScene,
  hall: hallScene,
  outside: outsideScene,
  dusk: duskScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//panels are slow to ink, so each is made once and kept, dropping the oldest past a limit
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(cue: Cue) {
  const key = `${cue.set}:${cue.beat}`;
  let made = backdrops.get(key);
  if (!made) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(W, H);
    BACKDROP[cue.set](c, cue.beat);
    //yellow the whole panel like old newsprint, then fleck it
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(newsprint(), 0, 0);
    made = el;
    backdrops.set(key, el);
    if (backdrops.size > 10) backdrops.delete(backdrops.keys().next().value!);
  }
  return made;
}

// ---------------------------------------------------------------------------
// what moves in the panel
// ---------------------------------------------------------------------------

function bee(c: Ctx, x: number, y: number, dir: number, t: number, body = YELLOW) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  const flap = Math.sin(t * 60) * 0.5 + 0.5;
  ink(c, ellipse(-2, -9 - flap * 3, 6, 9 - flap * 4, -0.4, 12), 'rgba(251,246,232,0.85)', 2);
  ink(c, ellipse(0, 0, 11, 7.5, 0, 16), body, 2.5);
  c.fillStyle = INK;
  c.fillRect(-4, -6, 3, 12);
  c.fillRect(2, -6, 3, 12);
  c.restore();
}

//bees out on loops from their hive and back
function bees(c: Ctx, from: Pt[], n: number, t: number, body = YELLOW, reach = 1) {
  for (let i = 0; i < n; i++) {
    const [hx, hy] = from[i % from.length];
    const a = t * (0.5 + rand(i) * 0.6) + rand(i + 9) * 6.28;
    const [rx, ry] = [(60 + rand(i + 3) * 190) * reach, (30 + rand(i + 5) * 120) * reach];
    const x = hx + Math.sin(a) * rx;
    const y = hy - 20 - Math.abs(Math.sin(a * 1.3)) * ry + Math.sin(a * 5) * 8;
    bee(c, x, y, Math.cos(a) >= 0 ? 1 : -1, t + i, body);
  }
}

//the spray drifting off the end of Walt's wand
function mist(c: Ctx, t: number) {
  for (let k = 0; k < 16; k++) {
    const p = (t * 0.6 + k / 16) % 1;
    c.globalAlpha = 1 - p;
    ink(c, ellipse(527 + p * 110 + Math.sin(k * 3 + t) * 10, 488 + p * 40 + Math.cos(k * 2 + t) * 14, 3 + p * 10, 3 + p * 10, 0, 14), WHITE, 1.5);
  }
  c.globalAlpha = 1;
}

function steam(c: Ctx, t: number) {
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    for (let j = 0; j <= 14; j++) {
      const u = j / 14;
      const [x, y] = [1310 + k * 30 + Math.sin(u * 5 + t * 1.6 + k * 2) * 16 * u, 500 - u * 220];
      if (j) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(251,246,232,0.6)';
    c.stroke();
  }
}

//shake lines round the phone, and the buzz, for a moment after it goes off
function buzz(c: Ctx, t: number, since: number) {
  if (since > 1.6) return;
  const shake = Math.sin(t * 70) * 4;
  for (const [x, dir] of [[540, -1], [1060, 1]] as [number, number][]) {
    for (let k = 0; k < 3; k++) line(c, [[x + shake, 300 + k * 60], [x + dir * 40 + shake, 290 + k * 60]], 6);
  }
  sfx(c, 'BZZT!', 1240 + shake, 260, 90, YELLOW, 0.15);
}

function moths(c: Ctx, t: number) {
  for (let i = 0; i < 4; i++) {
    const a = t * (1.8 + rand(i) * 1.4) + i * 2;
    bee(c, 300 + Math.sin(a) * (40 + rand(i + 3) * 40), 230 + Math.cos(a * 1.4) * (30 + rand(i + 4) * 30), Math.cos(a) >= 0 ? 1 : -1, t + i, '#d9d4cc');
  }
}

function stars(c: Ctx, t: number) {
  for (let i = 0; i < 30; i++) {
    const r = 2 + 2.5 * (0.5 + 0.5 * Math.sin(t * (1 + rand(i)) + i));
    const [x, y] = [rand(i + 40) * W, 30 + rand(i + 80) * 420];
    c.fillStyle = WHITE;
    c.beginPath();
    c.moveTo(x, y - r * 2);
    c.lineTo(x + r * 0.5, y);
    c.lineTo(x, y + r * 2);
    c.lineTo(x - r * 0.5, y);
    c.closePath();
    c.fill();
  }
}

//gnats turning over in the last of the sun
function gnats(c: Ctx, t: number) {
  c.fillStyle = INK;
  for (let i = 0; i < 26; i++) {
    const a = t * (0.8 + rand(i) * 0.8) + i;
    c.fillRect(SUN[0] + Math.sin(a) * (40 + rand(i + 1) * 120) + 200, SUN[1] - 120 + Math.cos(a * 1.7) * (30 + rand(i + 2) * 60), 3, 3);
  }
}

function drawLive(c: Ctx, { set, beat }: Cue, t: number, since: number) {
  if (set === 'allotment') bees(c, beat === 'dead' ? [HIVES[1]] : HIVES, BEES[beat] ?? 0, t);
  if (set === 'allotment' && beat === 'walt') mist(c, t);
  if (set === 'letter') steam(c, t);
  if (set === 'phone') buzz(c, t, since);
  if (set === 'outside') moths(c, t);
  if (set === 'dusk' && beat === 'late') stars(c, t);
  if (set === 'dusk' && beat !== 'late') gnats(c, t);
}

//a panel: the inked backdrop with the live layer over it, the camera creeping in, and a heavy ink border
function drawPanel(c: Ctx, cue: Cue, t: number, since: number, drift: number, dx: number) {
  c.save();
  c.translate(dx, 0);
  if (dx > 0) {
    c.fillStyle = 'rgba(29,26,23,0.4)';
    c.fillRect(PX0 - 16, PY0 + 12, PX1 - PX0, PY1 - PY0);
  }
  c.save();
  c.beginPath();
  c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  c.clip();
  const z = 1 + DRIFT * (1 - (1 - Math.min(1, drift / DRIFT_TIME)) ** 2);
  c.translate(800, 380);
  c.scale(z, z);
  c.translate(-800, -380);
  c.drawImage(backdrop(cue), 0, 0);
  drawLive(c, cue, t, since);
  c.restore();
  c.lineWidth = 10;
  c.strokeStyle = INK;
  c.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  c.restore();
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  garden: new URL('./sounds/garden.m4a', import.meta.url).href,
  hive: new URL('./sounds/hive.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  hall: new URL('./sounds/hall.m4a', import.meta.url).href,
  dusk: new URL('./sounds/dusk.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the hum of the hives rises and falls with how many bees are about
function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'allotment') {
    const n = BEES[beat] ?? 0;
    return { garden: 0.5, hive: n ? Math.min(0.6, 0.12 + n * 0.03) : 0 };
  }
  if (set === 'letter') return { room: 0.45, garden: 0.08 };
  if (set === 'phone') return { room: 0.35 };
  if (set === 'hall') return { hall: beat === 'history' ? 0.3 : 0.55 };
  if (set === 'outside') return { dusk: 0.25, hall: 0.1 };
  return beat === 'late' ? { dusk: 0.55 } : { dusk: 0.25, garden: 0.2 };
}

const LETTER = new URL('./sounds/letter.m4a', import.meta.url).href;
const MESSAGE = new URL('./sounds/message.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  letter: { src: LETTER, volume: 0.6, delay: 0.3 },
  letter_second: { src: LETTER, volume: 0.6, delay: 0.3 },
  phone_history: { src: MESSAGE, volume: 0.4, delay: 0.3 },
  phone_confess: { src: MESSAGE, volume: 0.4, delay: 0.3 },
  allotment_pru: { src: new URL('./sounds/gate.m4a', import.meta.url).href, volume: 0.55, delay: 0.2 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function TheHive({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Hive has no cue for the animation "${animation}"`);
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
    //panels inked before the lettering fonts arrive are inked again once they have
    let live = true;
    Promise.all([document.fonts.load(`40px ${LETTERING}`), document.fonts.load(`30px ${HAND}`)])
      .then(() => live && backdrops.clear())
      .catch(() => {});

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
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);
      //a new set slides in over the last panel, a new beat cross-fades over it
      if (prev.set !== cue.set && since < SLIDE) {
        drawPanel(c, prev, t, since, (now - prevSetAt) / 1000, 0);
        drawPanel(c, cue, t, since, since, W * (1 - ease(since / SLIDE)));
      } else {
        const drift = (now - setAt) / 1000;
        if (prev !== cue && prev.set === cue.set && since < BEAT_FADE) {
          drawPanel(c, prev, t, since, drift, 0);
          c.globalAlpha = ease(since / BEAT_FADE);
        }
        drawPanel(c, cue, t, since, drift, 0);
        c.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      live = false;
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
    background: PAPER,
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
    fontFamily: LETTERING,
    color: INK,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 26,
    letterSpacing: 4,
    padding: '6px 18px',
    background: WHITE,
    border: `4px solid ${INK}`,
    transform: 'rotate(2deg)',
  },
  name: {
    fontSize: 84,
    letterSpacing: 3,
    padding: '6px 34px',
    background: YELLOW,
    border: `6px solid ${INK}`,
    boxShadow: `10px 10px 0 ${INK}`,
    transform: 'rotate(-2deg)',
  },
};

export default TheHive;
