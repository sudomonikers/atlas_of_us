import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Paper Lantern is a shadow-puppet play on a 2D canvas. A candle burns behind a paper screen set in a little
// wooden theatre, and everything on the screen is a black leather cut-out pressed against it: the scenery is cut
// with holes and coloured gels where light gets through, and the puppets are jointed figures moved on rods.
// Each backdrop is made once per set and beat, and each puppet once per pose. Puppets sway on their rods, steam,
// rain and river light are drawn live, and the candle flickers over all of it.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const OUT = 0.35; //seconds the light takes to drop between sets
const IN = 0.6; //and to come back up
const BEAT_FADE = 0.5; //seconds to crossfade a change of pose
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const SHADOW = '#140c07';
const WOOD = '#2b170c';
const CURTAIN = '#4d1611';
const RED = 'rgba(200,48,30,0.62)';
const GOLD = 'rgba(250,176,52,0.5)';
const TEAL = 'rgba(36,128,126,0.58)';
const PALE = 'rgba(214,232,244,0.55)';

//the paper screen inside the theatre's frame
const SX0 = 70;
const SY0 = 46;
const SX1 = 1530;
const SY1 = 840;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'street' | 'table' | 'memory' | 'bridge' | 'phone';

interface Cue {
  set: SetId;
  beat?: string;
  light?: number; //how bright the candle is, 1 unless it's burning down
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'street', beat: 'empty', card: ['Let Down', 'The Paper Lantern'] },
  street: { set: 'street' },
  street_juno: { set: 'street', beat: 'juno' },
  phone_cancels: { set: 'phone', beat: 'cancels' },
  phone_sent: { set: 'phone', beat: 'sent' },
  phone_reply: { set: 'phone', beat: 'reply' },
  table_quiet: { set: 'table', beat: 'quiet' },
  table_talk: { set: 'table', beat: 'talk' },
  table_laugh: { set: 'table', beat: 'laugh' },
  table_hand: { set: 'table', beat: 'hand' },
  memory: { set: 'memory' },
  bridge: { set: 'bridge' },
  bridge_apart: { set: 'bridge', beat: 'apart' },
  candle_out: { set: 'table', beat: 'empty', light: 0.45 },
  the_end: { set: 'table', beat: 'empty', light: 0 },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------

//backdrops use a seeded random so the same scene always comes out the same
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

const ellipse = (x: number, y: number, rx: number, ry: number, turn = 0, n = 32): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [px, py] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)];
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

const lerp = ([ax, ay]: Pt, [bx, by]: Pt, k: number): Pt => [ax + (bx - ax) * k, ay + (by - ay) * k];

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

const trace = (c: Ctx, points: Pt[]) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

const glow = (c: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};

// ---------------------------------------------------------------------------
// leather: black cut-outs with holes and gels where the light gets through
// ---------------------------------------------------------------------------

function fill(c: Ctx, points: Pt[]) {
  c.fillStyle = SHADOW;
  trace(c, points);
  c.fill();
}

//cuts whatever draw() fills or strokes out of the leather
function punch(c: Ctx, draw: () => void) {
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  c.strokeStyle = '#000';
  draw();
  c.restore();
}

//a hole with a sheet of coloured gel stretched over it
function gel(c: Ctx, points: Pt[], color: string) {
  punch(c, () => {
    trace(c, points);
    c.fill();
  });
  c.fillStyle = color;
  trace(c, points);
  c.fill();
}

function punchText(c: Ctx, text: string, x: number, y: number, size: number) {
  punch(c, () => {
    c.font = `bold ${size}px Georgia, "Times New Roman", serif`;
    c.textAlign = 'center';
    c.fillText(text, x, y);
  });
}

//cut-outs are made on their own sheet so holes only go through the leather, then laid on the screen.
//Pieces further from the screen throw softer, fainter shadows
function layer(c: Ctx, draw: (l: Ctx) => void, blur = 0, alpha = 1) {
  const [el, l] = canvas2d(W, H);
  draw(l);
  c.save();
  c.globalAlpha = alpha;
  if (blur) c.filter = `blur(${blur}px)`;
  c.drawImage(el, 0, 0);
  c.restore();
}

//a paper lantern: ribs over a coloured gel, with a cap, a foot and a tassel
function lantern(c: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  fill(c, ellipse(x, y, rx, ry));
  gel(c, ellipse(x, y, rx * 0.84, ry * 0.8), color);
  c.strokeStyle = SHADOW;
  c.lineWidth = Math.max(1.5, rx * 0.06);
  for (const k of [0.3, 0.62]) {
    trace(c, ellipse(x, y, rx * k, ry * 0.8));
    c.stroke();
  }
  fill(c, rect(x - rx * 0.45, y - ry * 1.1, rx * 0.9, ry * 0.2));
  fill(c, rect(x - rx * 0.45, y + ry * 0.9, rx * 0.9, ry * 0.2));
  fill(c, limb([[x, y + ry], [x + 2, y + ry * 1.5]], rx * 0.1, rx * 0.3));
}

//a window of gel behind a wooden lattice
function lattice(c: Ctx, x: number, y: number, w: number, h: number, color: string, cell: number) {
  fill(c, rect(x, y, w, h));
  gel(c, rect(x + 8, y + 8, w - 16, h - 16), color);
  for (let k = x + 8 + cell; k < x + w - 12; k += cell) fill(c, rect(k - 2, y, 4, h));
  for (let k = y + 8 + cell; k < y + h - 12; k += cell) fill(c, rect(x, k - 2, w, 4));
}

// ---------------------------------------------------------------------------
// the theatre: the lit screen and the wooden frame around it, made once
// ---------------------------------------------------------------------------

let paperCanvas: HTMLCanvasElement | undefined;
function paper() {
  if (paperCanvas) return paperCanvas;
  random = seeded(7);
  const [el, c] = canvas2d(W, H);
  //the candle sits low behind the middle of the screen
  const g = c.createRadialGradient(800, 640, 0, 800, 640, 1000);
  g.addColorStop(0, '#ffe4ac');
  g.addColorStop(0.35, '#f2b866');
  g.addColorStop(0.75, '#c27534');
  g.addColorStop(1, '#5c2a10');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  //fibres in the paper, the seams where sheets were glued, and a few old stains
  c.strokeStyle = 'rgba(110,60,20,0.06)';
  c.lineWidth = 1;
  for (let i = 0; i < 3000; i++) {
    const [x, y, a, l] = [random() * W, random() * H, (random() - 0.5) * 0.6, 6 + random() * 18];
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  for (const x of [560, 1050]) {
    c.fillStyle = 'rgba(120,60,20,0.08)';
    c.fillRect(x, 0, 6, H);
  }
  for (let i = 0; i < 6; i++) glow(c, random() * W, random() * H, 60 + random() * 120, '120,60,20', 0.05);
  paperCanvas = el;
  return el;
}

let frameCanvas: HTMLCanvasElement | undefined;
function theatre() {
  if (frameCanvas) return frameCanvas;
  const [el, c] = canvas2d(W, H);
  const wood = c.createLinearGradient(0, 0, 0, H);
  wood.addColorStop(0, '#3a2112');
  wood.addColorStop(1, WOOD);
  c.fillStyle = wood;
  c.fillRect(0, 0, W, H);
  c.clearRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
  //carved mouldings round the screen
  c.strokeStyle = '#5a361d';
  c.lineWidth = 6;
  c.strokeRect(SX0 - 12, SY0 - 12, SX1 - SX0 + 24, SY1 - SY0 + 24);
  c.strokeStyle = '#1a0d06';
  c.lineWidth = 4;
  c.strokeRect(SX0 - 3, SY0 - 3, SX1 - SX0 + 6, SY1 - SY0 + 6);
  for (const [x, y] of [[SX0 - 34, SY0 - 22], [SX1 + 34, SY0 - 22], [SX0 - 34, SY1 + 22], [SX1 + 34, SY1 + 22]]) {
    c.fillStyle = '#5a361d';
    trace(c, ellipse(x, y, 16, 16));
    c.fill();
    c.fillStyle = '#1a0d06';
    trace(c, ellipse(x, y, 7, 7));
    c.fill();
  }

  //the valance and the side drapes, in front of the screen and unlit
  const cloth = c.createLinearGradient(0, 0, 0, 440);
  cloth.addColorStop(0, CURTAIN);
  cloth.addColorStop(1, '#2a0907');
  c.fillStyle = cloth;
  for (const side of [-1, 1]) {
    const x = side < 0 ? SX0 - 14 : SX1 + 14;
    trace(c, [[x, 0], [x - side * 120, 0], [x - side * 70, 150], [x - side * 22, 380], [x, 420]]);
    c.fill();
  }
  c.beginPath();
  c.moveTo(SX0 - 20, 0);
  c.lineTo(SX1 + 20, 0);
  c.lineTo(SX1 + 20, 84);
  const scallops = 12;
  const step = (SX1 - SX0 + 40) / scallops;
  for (let k = scallops; k > 0; k--) c.quadraticCurveTo(SX0 - 20 + (k - 0.5) * step, 128, SX0 - 20 + (k - 1) * step, 84);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = 3;
  for (let k = 0; k <= scallops; k++) {
    const x = SX0 - 20 + k * step;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, 84);
    c.stroke();
    trace(c, ellipse(x, 98, 5, 12));
    c.fillStyle = '#b07a2c';
    c.fill();
  }
  //gold tie-backs on the drapes
  for (const x of [SX0 + 30, SX1 - 30]) {
    c.fillStyle = '#b07a2c';
    trace(c, ellipse(x, 300, 26, 7, x < 800 ? 0.4 : -0.4));
    c.fill();
  }

  //the ledge the puppeteers lean on
  c.fillStyle = '#4a2a16';
  c.fillRect(0, SY1 + 4, W, 8);
  frameCanvas = el;
  return el;
}

// ---------------------------------------------------------------------------
// puppets: jointed leather figures, cut and baked once per pose
// ---------------------------------------------------------------------------

type Who = 'you' | 'juno';
type Pose = 'stand' | 'walk' | 'pockets' | 'wave' | 'sit' | 'reach' | 'slump' | 'prop' | 'laugh' | 'hold' | 'curl';

//each puppet faces right with its feet at (0, 0). Arms and legs run shoulder/hip, elbow/knee, hand/foot, far one first
interface Rig {
  head: Pt;
  tilt: number;
  neck: Pt;
  hip: Pt;
  arms: Pt[][];
  legs: Pt[][];
}

const STAND_LEGS: Pt[][] = [[[0, -150], [-4, -76], [-6, 0]], [[4, -150], [8, -76], [10, 0]]];
const WALK_LEGS: Pt[][] = [[[0, -150], [-24, -78], [-44, 0]], [[4, -150], [22, -80], [40, 0]]];
const SEAT_LEGS: Pt[][] = [[[0, -112], [62, -114], [60, 0]], [[4, -112], [68, -112], [70, 0]]];
const TABLE_ARMS: Pt[][] = [[[4, -214], [26, -174], [66, -176]], [[8, -214], [32, -172], [74, -174]]];

const RIGS: Record<Pose, Rig> = {
  stand: { head: [8, -292], tilt: 0, neck: [4, -258], hip: [0, -150], legs: STAND_LEGS, arms: [[[2, -248], [-6, -196], [-2, -140]], [[6, -248], [12, -194], [18, -140]]] },
  walk: { head: [12, -290], tilt: 0.05, neck: [6, -258], hip: [0, -150], legs: WALK_LEGS, arms: [[[2, -248], [-18, -198], [-26, -146]], [[6, -248], [22, -198], [38, -150]]] },
  pockets: { head: [22, -280], tilt: 0.35, neck: [12, -254], hip: [0, -150], legs: [[[0, -150], [-14, -78], [-26, 0]], [[4, -150], [14, -80], [24, 0]]], arms: [[[6, -244], [-6, -196], [10, -160]], [[10, -244], [4, -196], [22, -160]]] },
  wave: { head: [10, -292], tilt: -0.05, neck: [6, -258], hip: [0, -150], legs: WALK_LEGS, arms: [[[2, -248], [-16, -198], [-20, -146]], [[6, -248], [30, -288], [34, -340]]] },
  sit: { head: [12, -256], tilt: 0, neck: [6, -224], hip: [0, -112], legs: SEAT_LEGS, arms: TABLE_ARMS },
  reach: { head: [38, -246], tilt: 0.1, neck: [28, -216], hip: [0, -112], legs: SEAT_LEGS, arms: [TABLE_ARMS[0], [[30, -210], [100, -180], [176, -174]]] },
  slump: { head: [52, -222], tilt: 0.55, neck: [30, -206], hip: [0, -112], legs: SEAT_LEGS, arms: [[[26, -200], [44, -172], [84, -176]], [[30, -200], [50, -170], [90, -174]]] },
  prop: { head: [40, -244], tilt: 0.2, neck: [22, -216], hip: [0, -112], legs: SEAT_LEGS, arms: [[[18, -206], [44, -172], [84, -176]], [[24, -206], [86, -176], [58, -222]]] },
  laugh: { head: [12, -258], tilt: -0.25, neck: [6, -224], hip: [0, -112], legs: SEAT_LEGS, arms: TABLE_ARMS },
  hold: { head: [42, -236], tilt: 0.3, neck: [24, -212], hip: [0, -112], legs: SEAT_LEGS, arms: [[[20, -204], [44, -172], [84, -176]], [[24, -206], [80, -176], [134, -174]]] },
  curl: { head: [70, -120], tilt: 0.9, neck: [44, -118], hip: [0, -28], legs: [[[0, -28], [56, -92], [78, -2]], [[4, -28], [62, -96], [86, -2]]], arms: [[[42, -110], [66, -74], [66, -100]], [[46, -110], [74, -70], [70, -96]]] },
};

function puppet(c: Ctx, who: Who, pose: Pose) {
  const { head, tilt, neck, hip, arms, legs } = RIGS[pose];
  //a point on the head, turned with it
  const at = (dx: number, dy: number): Pt => [head[0] + dx * Math.cos(tilt) - dy * Math.sin(tilt), head[1] + dx * Math.sin(tilt) + dy * Math.cos(tilt)];
  const leg = (points: Pt[]) => {
    fill(c, limb(points, 20, 15));
    const [x, y] = points[2];
    fill(c, [[x - 6, y - 8], [x + 18, y - 4], [x + 18, y + 2], [x - 8, y + 2]]);
  };
  const arm = (points: Pt[]) => {
    fill(c, limb(points, 14, 10));
    fill(c, ellipse(...points[2], 8, 9));
  };

  leg(legs[0]);
  arm(arms[0]);
  const mid: Pt = [(neck[0] + hip[0]) / 2 - 8, (neck[1] + hip[1]) / 2];
  fill(c, limb([neck, mid, hip], 44, 40));
  //a panel cut down the front of the coat, with gel behind and a pattern left standing over it
  const panel = limb([lerp(neck, hip, 0.18), mid, lerp(neck, hip, 0.88)], 26, 22);
  gel(c, panel, who === 'you' ? RED : TEAL);
  c.save();
  trace(c, panel);
  c.clip();
  c.strokeStyle = SHADOW;
  c.lineWidth = who === 'you' ? 2.5 : 3.5;
  c.beginPath();
  for (let k = -300; k < 300; k += who === 'you' ? 11 : 10) {
    if (who === 'you') {
      c.moveTo(k - 150, hip[1] + 40);
      c.lineTo(k + 150, hip[1] - 260);
      c.moveTo(k + 150, hip[1] + 40);
      c.lineTo(k - 150, hip[1] - 260);
    } else {
      c.moveTo(-200, hip[1] - k);
      c.lineTo(300, hip[1] - k);
    }
  }
  c.stroke();
  c.restore();
  leg(legs[1]);
  fill(c, limb([neck, at(-2, 18)], 16));

  fill(c, ellipse(head[0], head[1], 22, 26, tilt));
  fill(c, [at(16, -6), at(30, 4), at(16, 12)]);
  if (who === 'juno') {
    //her hood up, and a scarf trailing behind
    fill(c, ellipse(...at(-6, -2), 31, 33, tilt));
    fill(c, [at(-28, -16), at(-46, 8), at(-26, 14)]);
    fill(c, ellipse(neck[0], neck[1] + 4, 20, 11));
    fill(c, limb([neck, [neck[0] - 18, neck[1] + 28], [neck[0] - 26, neck[1] + 66]], 14, 9));
    punch(c, () => {
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(...at(-4, -2), 25, tilt - 1.4, tilt + 1.4);
      c.stroke();
    });
  } else {
    fill(c, [at(-8, -22), at(8, -40), at(22, -28), at(6, -20)]);
  }
  punch(c, () => {
    trace(c, ellipse(...at(9, -4), 4.5, 2.2, tilt));
    c.fill();
  });
  arm(arms[1]);

  //rivets at the near elbow and knee, where the pieces are pinned together
  for (const [x, y] of [arms[1][1], legs[1][1]]) {
    punch(c, () => {
      trace(c, ellipse(x, y, 5, 5));
      c.fill();
    });
    fill(c, ellipse(x, y, 2.4, 2.4));
  }
}

//the box every pose fits in, in puppet units
const BOX = { left: 130, top: 370, w: 360, h: 400 };
const RES = 2; //sprites are cut at twice their size so they stay crisp on high density screens

const sprites = new Map<string, HTMLCanvasElement>();
function sprite(who: Who, pose: Pose, s: number) {
  const key = `${who}:${pose}:${s}`;
  let el = sprites.get(key);
  if (!el) {
    const [made, c] = canvas2d(Math.ceil(BOX.w * s * RES), Math.ceil(BOX.h * s * RES));
    c.scale(s * RES, s * RES);
    c.translate(BOX.left, BOX.top);
    puppet(c, who, pose);
    el = made;
    sprites.set(key, el);
  }
  return el;
}

interface Placed {
  who: Who;
  pose: Pose;
  x: number;
  y: number; //where the feet are
  s: number;
  flip?: boolean; //facing left
}

const JUNO_AT_TABLE: Record<string, Pose> = { quiet: 'slump', talk: 'prop', laugh: 'laugh', hand: 'hold' };

//the bridge deck rises to its middle
const deckY = (x: number) => 420 + 0.0005 * (x - 800) ** 2;

function cast({ set, beat }: Cue): Placed[] {
  if (set === 'street' && beat !== 'empty') {
    const you: Placed = { who: 'you', pose: 'stand', x: 1060, y: 720, s: 1.2, flip: true };
    return beat === 'juno' ? [you, { who: 'juno', pose: 'pockets', x: 560, y: 720, s: 1.2 }] : [you];
  }
  if (set === 'table' && beat !== 'empty') {
    return [
      { who: 'you', pose: beat === 'hand' ? 'reach' : 'sit', x: 560, y: 790, s: 1.55 },
      { who: 'juno', pose: JUNO_AT_TABLE[beat ?? 'quiet'], x: 1040, y: 790, s: 1.55, flip: true },
    ];
  }
  if (set === 'memory') return [{ who: 'you', pose: 'curl', x: 700, y: 760, s: 1.8, flip: true }];
  if (set === 'bridge') {
    return beat === 'apart'
      ? [{ who: 'you', pose: 'stand', x: 760, y: deckY(760), s: 0.95 }, { who: 'juno', pose: 'wave', x: 1330, y: deckY(1330), s: 0.95 }]
      : [{ who: 'you', pose: 'walk', x: 720, y: deckY(720), s: 0.95 }, { who: 'juno', pose: 'pockets', x: 830, y: deckY(830), s: 0.95 }];
  }
  return [];
}

//a puppet swaying a little on its rods, which run down off the bottom of the screen
function drawPuppet(c: Ctx, { who, pose, x, y, s, flip }: Placed, t: number) {
  const { hip, arms, neck } = RIGS[pose];
  const phase = x * 0.01;
  c.save();
  c.translate(x, y + Math.sin(t * 1.1 + phase) * 1.5);
  c.scale(flip ? -s : s, s);
  c.translate(hip[0], hip[1]);
  c.rotate(Math.sin(t * 0.8 + phase) * 0.012);
  c.translate(-hip[0], -hip[1]);
  c.drawImage(sprite(who, pose, s), -BOX.left, -BOX.top, BOX.w, BOX.h);
  c.strokeStyle = SHADOW;
  c.lineWidth = 2.5 / s;
  for (const [px, py] of [arms[1][2], neck]) {
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px - 60, py + 800 / s);
    c.stroke();
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// backdrops, made once per set and beat
// ---------------------------------------------------------------------------

//outside the Paper Lantern at night
function streetScene(c: Ctx) {
  glow(c, 330, 190, 150, '255,246,225', 0.6);
  //the rooftops across the street, further back
  layer(
    c,
    (l) => {
      for (let x = 40; x < 1200; ) {
        const [w, top] = [90 + random() * 130, 300 + random() * 160];
        fill(l, rect(x, top, w, 760 - top));
        if (random() < 0.5) fill(l, [[x - 10, top + 2], [x + w / 2, top - 50 - random() * 30], [x + w + 10, top + 2]]);
        if (random() < 0.6) fill(l, rect(x + w * 0.7, top - 70, 18, 70));
        for (let wy = top + 30; wy < 640; wy += 60) for (let wx = x + 16; wx < x + w - 30; wx += 44) if (random() < 0.3) gel(l, rect(wx, wy, 20, 28), GOLD);
        x += w + random() * 10;
      }
    },
    3,
    0.5,
  );
  layer(c, (l) => {
    fill(l, rect(0, 712, W, 200));
    //a low wall, and a cat on it
    fill(l, rect(40, 630, 400, 90));
    punch(l, () => {
      for (let row = 0; row < 3; row++) {
        l.fillRect(40, 656 + row * 28, 400, 3);
        for (let x = 60 + (row % 2) * 25; x < 440; x += 50) l.fillRect(x, 630 + row * 28, 3, 26);
      }
    });
    fill(l, ellipse(330, 600, 34, 30));
    fill(l, ellipse(362, 562, 16, 15));
    fill(l, [[350, 554], [354, 534], [362, 550]]);
    fill(l, [[364, 550], [372, 532], [376, 552]]);
    fill(l, limb([[300, 618], [280, 650], [286, 690]], 8, 5));

    //the lamp post
    fill(l, limb([[180, 712], [180, 300]], 14, 10));
    fill(l, limb([[180, 310], [238, 300]], 6));
    fill(l, rect(235, 300, 2, 14));
    lantern(l, 236, 340, 22, 28, GOLD);

    //a string of lanterns across the street
    l.strokeStyle = SHADOW;
    l.lineWidth = 3;
    l.beginPath();
    for (let u = 0; u <= 1.001; u += 0.02) {
      const [x, y] = [SX0 + u * 1080, 170 + u * 90 + Math.sin(u * Math.PI) * 70];
      if (u) l.lineTo(x, y);
      else l.moveTo(x, y);
    }
    l.stroke();
    for (let k = 1; k < 10; k++) {
      const u = k / 10;
      const [x, y] = [SX0 + u * 1080, 170 + u * 90 + Math.sin(u * Math.PI) * 70];
      fill(l, rect(x - 1, y, 2, 16));
      lantern(l, x, y + 38, 16, 21, k % 2 ? RED : GOLD);
    }

    //the Paper Lantern: its eaves, sign, window, door curtain and the big lantern by the door
    fill(l, rect(1130, 250, 500, 470));
    fill(l, rect(1100, 214, 520, 40));
    fill(l, [[1100, 214], [1066, 192], [1100, 254]]);
    for (const x of [1170, 1460]) fill(l, rect(x, 254, 3, 40));
    fill(l, rect(1150, 290, 330, 70));
    punchText(l, 'THE PAPER LANTERN', 1315, 336, 28);
    lattice(l, 1300, 400, 190, 170, GOLD, 34);
    gel(l, rect(1170, 470, 96, 242), 'rgba(255,200,120,0.35)');
    for (let k = 0; k < 3; k++) fill(l, rect(1166 + k * 35, 466, 31, 86));
    gel(l, ellipse(1218, 506, 12, 12), RED);
    fill(l, rect(1104, 254, 2, 52));
    lantern(l, 1105, 350, 36, 48, RED);
  });
}

//a lidded bowl sitting at (x, y)
function bowl(c: Ctx, x: number, y: number) {
  fill(c, Array.from({ length: 17 }, (_, i): Pt => [x + Math.cos((i / 16) * Math.PI) * 46, y - 30 + Math.sin((i / 16) * Math.PI) * 26]));
  fill(c, ellipse(x, y - 30, 46, 5));
  fill(c, rect(x - 16, y - 6, 32, 6));
  punch(c, () => {
    for (let k = -3; k <= 3; k++) {
      trace(c, ellipse(x + k * 11, y - 18 + Math.abs(k) * 0.6, 3, 3));
      c.fill();
    }
  });
}

//inside the Paper Lantern: a table for two under a big red lantern
function tableScene(c: Ctx, beat?: string) {
  //shelves of jars and bottles on the back wall, further off
  layer(
    c,
    (l) => {
      l.strokeStyle = SHADOW;
      l.lineWidth = 18;
      l.beginPath();
      l.arc(800, 330, 210, 0, Math.PI * 2);
      l.stroke();
      l.lineWidth = 6;
      for (let k = -2; k <= 2; k++) {
        l.beginPath();
        l.moveTo(800 + k * 70, 120);
        l.lineTo(800 + k * 70, 540);
        l.moveTo(590, 330 + k * 70);
        l.lineTo(1010, 330 + k * 70);
        l.stroke();
      }
      for (const [x0, x1] of [[SX0, 470], [1130, SX1]]) {
        for (const y of [260, 420]) {
          fill(l, rect(x0, y, x1 - x0, 10));
          for (let x = x0 + 20; x < x1 - 40; x += 40 + random() * 30) {
            const [w, h] = [18 + random() * 22, 30 + random() * 50];
            fill(l, rect(x, y - h, w, h));
            if (random() < 0.5) fill(l, rect(x + w / 2 - 4, y - h - 18, 8, 18));
            else fill(l, rect(x - 3, y - h - 6, w + 6, 6));
          }
        }
      }
    },
    2.5,
    0.45,
  );
  layer(c, (l) => {
    fill(l, rect(799, 0, 2, 124));
    lantern(l, 800, 210, 64, 82, RED);
    for (const x of [330, 1270]) {
      fill(l, rect(x - 1, 0, 2, 110));
      lantern(l, x, 150, 26, 34, GOLD);
    }
    fill(l, rect(0, 790, W, 120));

    //the two chairs
    for (const side of [-1, 1]) {
      const x = side < 0 ? 560 : 1040;
      fill(l, rect(x - 60, 612, 120, 12));
      fill(l, rect(x - side * 58 - 6, 400, 12, 224));
      fill(l, rect(x - side * 58 - 10, 396, 20, 10));
      for (const dx of [-54, 44]) fill(l, rect(x + dx, 620, 10, 170));
    }
    //the table and what's on it
    fill(l, rect(612, 520, 376, 18));
    fill(l, rect(626, 538, 348, 10));
    for (const x of [640, 944]) fill(l, rect(x, 538, 16, 252));
    fill(l, rect(640, 720, 320, 8));
    bowl(l, 700, 520);
    bowl(l, 900, 520);
    fill(l, ellipse(800, 488, 34, 30));
    fill(l, ellipse(800, 460, 16, 6));
    fill(l, ellipse(800, 452, 8, 6));
    fill(l, limb([[828, 494], [850, 478], [862, 462]], 10, 6));
    l.strokeStyle = SHADOW;
    l.lineWidth = 7;
    l.beginPath();
    l.arc(770, 486, 16, 1.9, 4.4);
    l.stroke();
    punch(l, () => {
      for (let k = 0; k < 8; k++) {
        trace(l, ellipse(800 + Math.cos((k / 8) * Math.PI * 2) * 18, 490 + Math.sin((k / 8) * Math.PI * 2) * 14, 3, 3));
        l.fill();
      }
    });
    if (beat === 'empty') {
      //chopsticks laid across the empty bowls
      fill(l, limb([[652, 486], [748, 482]], 4, 3));
      fill(l, limb([[852, 482], [948, 486]], 4, 3));
    } else {
      fill(l, limb([[712, 494], [744, 420]], 4, 3));
      fill(l, limb([[720, 494], [756, 424]], 4, 3));
      fill(l, limb([[888, 494], [856, 420]], 4, 3));
      fill(l, limb([[880, 494], [844, 424]], 4, 3));
    }
  });
}

//a memory: a room on a rainy night, the light gone cold
function memoryScene(c: Ctx) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = '#93a9cf';
  c.fillRect(0, 0, W, H);
  c.restore();
  layer(c, (l) => {
    fill(l, rect(0, 760, W, 150));
    //the window, its curtain and a plant on the sill
    fill(l, rect(250, 116, 480, 8));
    fill(l, rect(300, 140, 380, 340));
    gel(l, rect(316, 156, 348, 308), PALE);
    fill(l, rect(486, 156, 8, 308));
    fill(l, rect(316, 306, 348, 8));
    fill(l, rect(284, 476, 412, 14));
    fill(l, [[270, 124], [334, 124], [318, 300], [304, 470], [292, 600], [258, 600], [266, 400]]);
    fill(l, [[600, 476], [640, 476], [632, 440], [608, 440]]);
    for (let k = 0; k < 6; k++) fill(l, limb([[620, 442], [600 + k * 9, 400 - (k % 3) * 18], [586 + k * 13, 380 - (k % 2) * 30]], 6, 2));

    //the bed
    fill(l, rect(1380, 420, 22, 340));
    fill(l, rect(760, 580, 640, 46));
    fill(l, ellipse(1300, 566, 72, 22));
    fill(l, [[760, 580], [1300, 580], [1290, 704], [1180, 690], [1060, 708], [940, 692], [820, 706], [770, 690]]);
    for (const x of [780, 1360]) fill(l, rect(x, 626, 16, 134));
  });
}

//walking home over the river
function bridgeScene(c: Ctx) {
  glow(c, 1250, 170, 120, '255,246,225', 0.55);
  //the far side of the river, and a pagoda over the roofs
  layer(
    c,
    (l) => {
      for (let x = 260; x < SX1; ) {
        const [w, top] = [70 + random() * 100, 560 + random() * 70];
        fill(l, rect(x, top, w, 760 - top));
        for (let wx = x + 12; wx < x + w - 20; wx += 30) if (random() < 0.35) gel(l, rect(wx, top + 18, 14, 18), GOLD);
        x += w + random() * 30;
      }
      for (let k = 0; k < 5; k++) {
        const [y, w] = [600 - k * 64, 150 - k * 22];
        fill(l, rect(1080 - w / 3, y - 50, (w * 2) / 3, 50));
        fill(l, [[1080 - w / 2 - 20, y - 40], [1080 - w / 2, y - 54], [1080 + w / 2, y - 54], [1080 + w / 2 + 20, y - 40]]);
      }
      fill(l, limb([[1080, 290], [1080, 230]], 6, 2));
    },
    3,
    0.45,
  );
  layer(c, (l) => {
    //the river, with rows of ripples cut through it
    fill(l, rect(0, 712, W, 200));
    punch(l, () => {
      for (let y = 726; y < 900; y += 16) {
        for (let x = random() * 80; x < W; x += 60 + random() * 90) {
          const w = 20 + random() * 50;
          l.beginPath();
          l.ellipse(x, y, w, 1.6, 0, 0, Math.PI * 2);
          l.fill();
        }
      }
    });

    //the bridge: an arched deck, its railings, and lanterns on every fourth post
    const body: Pt[] = [];
    for (let x = 150; x <= 1450; x += 20) body.push([x, deckY(x)]);
    body.push([1450, 712], [1330, 712]);
    for (let x = 1330; x >= 270; x -= 20) body.push([x, 712 - 250 * (1 - ((x - 800) / 530) ** 2)]);
    body.push([270, 712], [150, 712]);
    fill(l, body);
    punch(l, () => {
      for (let x = 180; x < 1430; x += 30) {
        trace(l, ellipse(x, deckY(x) + 14, 3.5, 3.5));
        l.fill();
      }
    });
    const rail = (dy: number): Pt[] => Array.from({ length: 66 }, (_, i): Pt => [160 + i * 20, deckY(160 + i * 20) - dy]);
    fill(l, limb(rail(52), 6));
    fill(l, limb(rail(26), 3));
    for (let i = 0, x = 165; x < 1440; i++, x += 65) {
      fill(l, rect(x - 3, deckY(x) - 54, 6, 54));
      if (i % 4 === 2) lantern(l, x, deckY(x) - 76, 13, 17, GOLD);
    }

    //a willow on the bank
    fill(l, limb([[110, 712], [130, 520], [170, 300], [220, 210]], 40, 16));
    fill(l, limb([[160, 340], [260, 240], [330, 200]], 14, 6));
    l.strokeStyle = SHADOW;
    l.lineWidth = 2.2;
    for (let i = 0; i < 60; i++) {
      const [x, y, len, dir] = [60 + random() * 330, 180 + random() * 80, 260 + random() * 260, random() < 0.5 ? -1 : 1];
      const [ex, ey] = [x + dir * 14 + (random() - 0.5) * 20, y + len];
      l.beginPath();
      l.moveTo(x, y);
      l.quadraticCurveTo(x + dir * 30, y + 20, ex, ey);
      l.stroke();
      for (let k = 0.2; k < 1; k += 0.06) {
        const [lx, ly] = [x + (ex - x) * k + dir * 30 * 2 * k * (1 - k), y + (ey - y) * k];
        fill(l, ellipse(lx + (k * 100 % 2 < 1 ? 4 : -4), ly, 2.5, 7, k * 100 % 2 < 1 ? -0.4 : 0.4, 8));
      }
    }
  });
}

type Msg = [from: Who, text: string];
const THREAD: Record<string, Msg[]> = {
  cancels: [
    ['juno', "so sorry, can't make tonight"],
    ['juno', 'rain check? not feeling great'],
    ['juno', 'not up to it this week. next time x'],
  ],
  sent: [
    ['juno', 'not up to it this week. next time x'],
    ['you', 'how are you doing?'],
    ['you', 'saw a dog in a raincoat and thought of you'],
    ['you', 'thinking of you x'],
  ],
  reply: [
    ['you', 'saw a dog in a raincoat and thought of you'],
    ['you', 'thinking of you x'],
    ['juno', 'sorry. rough week. I booked a doctor. thank you for not giving up on me x'],
  ],
};

function wrap(c: Ctx, text: string, width: number) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const line = lines[lines.length - 1];
    if (line && c.measureText(`${line} ${word}`).width > width) lines.push(word);
    else lines[lines.length - 1] = line ? `${line} ${word}` : word;
  }
  return lines;
}

//your phone held up to the screen, the messages between you and Juno on it
function phoneScene(c: Ctx, beat?: string) {
  layer(
    c,
    (l) => {
      for (let i = 0; i < 9; i++) lantern(l, SX0 + random() * 1460, 120 + random() * 500, 40 + random() * 40, 54 + random() * 50, i % 2 ? RED : GOLD);
    },
    10,
    0.35,
  );
  layer(c, (l) => {
    fill(l, [[540, 960], [560, 780], [620, 760], [980, 760], [1060, 800], [1100, 960]]);
    l.fillStyle = SHADOW;
    l.beginPath();
    l.roundRect(590, 70, 420, 900, 50);
    l.fill();
    punch(l, () => {
      l.beginPath();
      l.roundRect(612, 128, 376, 860, 30);
      l.fill();
    });
    l.fillStyle = PALE;
    l.beginPath();
    l.roundRect(612, 128, 376, 860, 30);
    l.fill();
    punch(l, () => {
      l.beginPath();
      l.roundRect(760, 94, 80, 8, 4);
      l.fill();
    });
    fill(l, ellipse(660, 172, 24, 24));
    l.fillStyle = SHADOW;
    l.font = 'bold 28px "Helvetica Neue", Arial, sans-serif';
    l.textAlign = 'left';
    l.fillText('Juno', 700, 182);
    l.fillRect(612, 216, 376, 3);

    //messages stack up from the bottom, like a chat
    l.save();
    l.beginPath();
    l.rect(612, 222, 376, 540);
    l.clip();
    l.font = '24px "Helvetica Neue", Arial, sans-serif';
    const laid = THREAD[beat ?? 'cancels'].map(([from, text]) => ({ from, lines: wrap(l, text, 250) }));
    let y = 700 - laid.reduce((sum, { lines }) => sum + lines.length * 30 + 48, 0);
    for (const { from, lines } of laid) {
      const w = Math.max(...lines.map((line) => l.measureText(line).width)) + 32;
      const h = lines.length * 30 + 22;
      const x = from === 'juno' ? 632 : 968 - w;
      l.beginPath();
      l.roundRect(x, y, w, h, 18);
      if (from === 'juno') {
        l.fillStyle = SHADOW;
        l.fill();
        punch(l, () => {
          l.font = '24px "Helvetica Neue", Arial, sans-serif';
          lines.forEach((line, i) => l.fillText(line, x + 16, y + 32 + i * 30));
        });
      } else {
        l.strokeStyle = SHADOW;
        l.lineWidth = 3;
        l.stroke();
        l.fillStyle = SHADOW;
        lines.forEach((line, i) => l.fillText(line, x + 16, y + 32 + i * 30));
      }
      y += h + 26;
    }
    if (beat === 'sent') {
      l.fillStyle = SHADOW;
      l.font = 'bold 18px "Helvetica Neue", Arial, sans-serif';
      l.textAlign = 'right';
      l.fillText('Read', 966, y - 6);
    }
    l.restore();

    //your hand round it: fingers down one side, thumb up the other
    for (let k = 0; k < 3; k++) fill(l, ellipse(590, 560 + k * 74, 26, 34));
    fill(l, limb([[1200, 960], [1090, 760], [1010, 640]], 76, 54));
  });
}

const BACKDROP: Record<SetId, (c: Ctx, beat?: string) => void> = {
  street: streetScene,
  table: tableScene,
  memory: memoryScene,
  bridge: bridgeScene,
  phone: phoneScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//backdrops are slow to make, so each is made once and kept, dropping the oldest past a limit
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(cue: Cue) {
  const key = `${cue.set}:${cue.beat ?? ''}`;
  let made = backdrops.get(key);
  if (!made) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(W, H);
    c.drawImage(paper(), 0, 0);
    BACKDROP[cue.set](c, cue.beat);
    made = el;
    backdrops.set(key, el);
    if (backdrops.size > 12) backdrops.delete(backdrops.keys().next().value!);
  }
  return made;
}

// ---------------------------------------------------------------------------
// what moves on the screen
// ---------------------------------------------------------------------------

//steam curling up off the bowls
function steam(c: Ctx, t: number) {
  for (const bx of [700, 900]) {
    const g = c.createLinearGradient(0, 488, 0, 300);
    g.addColorStop(0, 'rgba(20,12,7,0.16)');
    g.addColorStop(1, 'rgba(20,12,7,0)');
    c.strokeStyle = g;
    for (let k = 0; k < 3; k++) {
      c.lineWidth = 12 - k * 3;
      c.beginPath();
      for (let j = 0; j <= 14; j++) {
        const u = j / 14;
        const [x, y] = [bx + (k - 1) * 14 + Math.sin(u * 5 + t * 1.4 + k * 2 + bx) * 14 * u, 488 - u * 188];
        if (j) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
    }
  }
}

//rain running down the window
function windowRain(c: Ctx, t: number) {
  c.save();
  c.beginPath();
  c.rect(316, 156, 348, 308);
  c.clip();
  c.strokeStyle = 'rgba(20,28,44,0.3)';
  c.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const x = 316 + rand(i) * 348;
    const y = 156 + ((rand(i + 50) * 340 + t * 380 * (0.6 + rand(i + 90) * 0.6)) % 340) - 20;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 3, y + 26);
    c.stroke();
  }
  c.restore();
}

//the bridge lanterns, shivering in the water
function reflections(c: Ctx, t: number) {
  c.fillStyle = 'rgba(250,176,52,0.4)';
  for (let x = 165, i = 0; x < 1440; i++, x += 65) {
    if (i % 4 !== 2) continue;
    for (let j = 0; j < 7; j++) {
      const w = 34 - j * 4 + Math.sin(t * 2.2 + j * 1.7 + x) * 9;
      c.globalAlpha = 1 - j / 7;
      c.fillRect(x - w / 2 + Math.sin(t * 1.3 + j + x) * 5, 730 + j * 18, w, 4);
    }
  }
  c.globalAlpha = 1;
}

function drawScene(c: Ctx, cue: Cue, t: number, sway: number) {
  c.drawImage(backdrop(cue), 0, 0);
  if (cue.set === 'table' && cue.beat !== 'empty') steam(c, t);
  if (cue.set === 'memory') windowRain(c, t);
  if (cue.set === 'bridge') reflections(c, t);
  //the shadows lean a little as the flame moves
  c.save();
  c.translate(sway, 0);
  for (const placed of cast(cue)) drawPuppet(c, placed, t);
  c.restore();
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  flame: new URL('./sounds/flame.m4a', import.meta.url).href,
  walla: new URL('./sounds/walla.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  river: new URL('./sounds/river.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the candle crackles under everything
function mixFor({ set, beat, light = 1 }: Cue): Partial<Record<Bed, number>> {
  if (light < 1) return { flame: 0.35 * light };
  if (set === 'street') return { street: 0.55, flame: 0.2 };
  if (set === 'table') return { walla: 0.6, flame: 0.2 };
  if (set === 'memory') return { rain: 0.65, flame: 0.15 };
  if (set === 'bridge') return { river: 0.6, street: 0.12, flame: 0.15 };
  return { flame: beat === 'reply' ? 0.3 : 0.25 };
}

const MESSAGE = new URL('./sounds/message.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  table_quiet: { src: new URL('./sounds/bowls.m4a', import.meta.url).href, volume: 0.45, delay: 0.4 },
  phone_cancels: { src: MESSAGE, volume: 0.5, delay: 0.5 },
  phone_sent: { src: new URL('./sounds/send.m4a', import.meta.url).href, volume: 0.6, delay: 0.4 },
  phone_reply: { src: MESSAGE, volume: 0.5, delay: 0.5 },
  candle_out: { src: new URL('./sounds/blow.m4a', import.meta.url).href, volume: 0.6, delay: 0.3 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const flicker = (t: number) => 0.5 * Math.sin(t * 7.3) + 0.3 * Math.sin(t * 13.1 + 1) + 0.2 * Math.sin(t * 2.9 + 2);

function PaperLantern({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Paper Lantern has no cue for the animation "${animation}"`);
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
    let light = shown.current.cue.light ?? 1;
    let last = performance.now();
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
      light += ((cue.light ?? 1) - light) * Math.min(1, ((now - last) / 1000) * 1.2);
      last = now;
      const f = flicker(t);

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      //a change of set drops the light, swaps the scenery in the dark and brings the light back up
      let dim = 0;
      if (prev.set !== cue.set && since < OUT + IN) {
        drawScene(c, since < OUT ? prev : cue, t, f * 1.5);
        dim = since < OUT ? since / OUT : 1 - (since - OUT) / IN;
      } else {
        if (prev !== cue && since < BEAT_FADE) {
          drawScene(c, prev, t, f * 1.5);
          c.globalAlpha = ease(since / BEAT_FADE);
        }
        drawScene(c, cue, t, f * 1.5);
        c.globalAlpha = 1;
      }
      c.fillStyle = `rgba(30,12,2,${0.07 + 0.05 * f})`;
      c.fillRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
      const dark = 1 - light * (1 - dim);
      if (dark > 0.002) {
        c.fillStyle = `rgba(6,3,1,${dark})`;
        c.fillRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
      }
      c.drawImage(theatre(), 0, 0);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    shown.current = { cue: cues[active], at: performance.now(), prev: shown.current.cue };
    sound.current?.mix(mixFor(cues[active]));
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
    background: WOOD,
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
    paddingBottom: 260,
    background: 'radial-gradient(ellipse at center, rgba(20,12,7,0.6) 0%, rgba(20,12,7,0) 65%)',
    color: '#ffe9c4',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  name: {
    fontSize: 64,
    letterSpacing: 2,
  },
};

export default PaperLantern;
