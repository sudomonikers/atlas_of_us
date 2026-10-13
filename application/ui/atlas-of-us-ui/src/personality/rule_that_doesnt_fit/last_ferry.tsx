import { useEffect, useRef, useState, type CSSProperties } from 'react';

// The Last Ferry is printed like a linocut on a 2D canvas: a few flat inks laid over cream paper, each from its
// own block so they never quite line up, with gouge marks cut through them to show the ink or paper beneath.
// Prints are made once per set and beat and kept. Rain, the swinging lamp and the waves are drawn live on top.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const SET_FADE = 0.8; //seconds to crossfade between prints
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const PAPER = '#ece2cc';
const INK = '#1b2127';
const SLATE = '#40566a';
const MIST = '#8c9ca6';
const RUST = '#b24e2b';
const LAMP = '#ecc77e';
const WOOD = '#7a5236';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'dock' | 'ramp' | 'face' | 'phone' | 'clicker' | 'radio' | 'deck' | 'sea';

interface Cue {
  set: SetId;
  beat?: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'dock', card: ["The Rule That Doesn't Fit", 'The Last Ferry'] },
  dock_wide: { set: 'dock' },
  dock_count: { set: 'dock', beat: 'boarding' },
  dock_woman: { set: 'dock', beat: 'woman' },
  ramp_up_aboard: { set: 'dock', beat: 'aboard' },
  ramp_up_alone: { set: 'dock', beat: 'alone' },
  dock_calm: { set: 'dock', beat: 'calm' },
  clicker_120: { set: 'clicker' },
  clicker_121: { set: 'clicker', beat: '121' },
  radio: { set: 'radio' },
  woman_close: { set: 'face' },
  phone: { set: 'phone' },
  phone_call: { set: 'phone', beat: 'call' },
  ramp_talk: { set: 'ramp' },
  coat: { set: 'ramp', beat: 'coat' },
  deck: { set: 'deck' },
  deck_doyle: { set: 'deck', beat: 'doyle' },
  crossing: { set: 'sea' },
  stern_view: { set: 'sea', beat: 'stern' },
  mainland: { set: 'sea', beat: 'mainland' },
  morning: { set: 'sea', beat: 'morning' },
};
const FIRST_CUE = 'title_card';

const raining = (cue: Cue) => cue.set !== 'deck' && cue.beat !== 'calm' && cue.beat !== 'morning';

// ---------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------

//prints use a seeded random so the same scene always comes out the same
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

const ellipse = (x: number, y: number, rx: number, ry: number, turn = 0, n = 28): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [px, py] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)];
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

//a rectangle turned about its center
const tilted = (x: number, y: number, w: number, h: number, turn: number): Pt[] =>
  rect(-w / 2, -h / 2, w, h).map(([px, py]) => [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)]);

const densify = (points: Pt[], step: number): Pt[] =>
  points.flatMap(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    return Array.from({ length: n }, (_, k): Pt => [ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
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

const trace = (c: Ctx, points: Pt[]) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

// ---------------------------------------------------------------------------
// linocut
// ---------------------------------------------------------------------------

//each ink is printed from its own block, so it sits a little off from the others
const REGISTER: Record<string, Pt> = { [SLATE]: [-3, 2], [MIST]: [2, -2], [RUST]: [3, 1], [LAMP]: [-2, -1] };

//a flat area of ink with a slightly chiselled edge
function block(c: Ctx, points: Pt[], color: string) {
  const [dx, dy] = REGISTER[color] ?? [0, 0];
  const chipped = densify(points, 18).map(([x, y]): Pt => [x + dx + gauss() * 1.2, y + dy + gauss() * 1.2]);
  c.fillStyle = color;
  trace(c, chipped);
  c.fill();
}

//one gouge mark: blunt where the tool went in, tapering to a point where it came out
function sliver(c: Ctx, x: number, y: number, len: number, wide: number, turn: number, color: string) {
  const [dx, dy] = [(Math.cos(turn) * len) / 2, (Math.sin(turn) * len) / 2];
  const [nx, ny] = [(-Math.sin(turn) * wide) / 2, (Math.cos(turn) * wide) / 2];
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - dx + nx, y - dy + ny);
  c.quadraticCurveTo(x + nx, y + ny, x + dx, y + dy);
  c.quadraticCurveTo(x - nx, y - ny, x - dx - nx, y - dy - ny);
  c.closePath();
  c.fill();
}

interface Cut {
  turn?: number; //which way the rows run
  gap?: number; //space between rows
  len?: number; //how long each mark is
  wide?: number;
  color?: string; //what shows through the cut
  wave?: number; //how far the rows bend
  fill?: number; //how much of each row is cut, 0 to 1
}

//rows of gouge marks cut through a shape, the texture that makes it read as a print
function cuts(c: Ctx, points: Pt[], { turn = 0, gap = 14, len = 50, wide = 4, color = PAPER, wave = 0, fill = 0.6 }: Cut = {}) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const r = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + len;
  const [ux, uy, vx, vy] = [Math.cos(turn), Math.sin(turn), -Math.sin(turn), Math.cos(turn)];
  c.save();
  trace(c, points);
  c.clip();
  for (let v = -r; v < r; v += gap * (0.8 + random() * 0.4)) {
    for (let u = -r + random() * len; u < r; ) {
      const l = len * (0.5 + random() * 0.8);
      if (random() < fill) {
        const m = u + l / 2;
        const off = wave * Math.sin(m / 110 + v / 40);
        const slope = Math.atan((wave * Math.cos(m / 110 + v / 40)) / 110);
        sliver(c, cx + ux * m + vx * (v + off), cy + uy * m + vy * (v + off), l, wide * (0.6 + random() * 0.6), turn + slope + gauss() * 0.04, color);
      }
      u += l * (1.1 + random() * 0.5);
    }
  }
  c.restore();
}

//a carved outline: marks laid end to end along a path
function carve(c: Ctx, points: Pt[], wide: number, color: string) {
  for (let i = 0; i < points.length - 1; i++) {
    const [[ax, ay], [bx, by]] = [points[i], points[i + 1]];
    sliver(c, (ax + bx) / 2, (ay + by) / 2, Math.hypot(bx - ax, by - ay) * 1.15, wide, Math.atan2(by - ay, bx - ax), color);
  }
}

const dot = (c: Ctx, x: number, y: number, r: number, color: string, alpha = 1) => {
  c.save();
  c.globalAlpha *= alpha;
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

const glow = (c: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};

function letters(c: Ctx, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', turn = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.font = `bold ${size}px Georgia, "Times New Roman", serif`;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}

//specks where the ink didn't take, pressed over the whole print
function grain(c: Ctx) {
  c.save();
  for (let i = 0; i < 3500; i++) {
    c.globalAlpha = 0.12 + random() * 0.22;
    c.fillStyle = PAPER;
    c.fillRect(random() * W, random() * H, 0.8 + random() * 2, 0.8 + random() * 1.4);
  }
  c.restore();
}

//a stormy sky: dark ink with long wind-bent cuts showing the slate under it
function storm(c: Ctx, bottom: number) {
  block(c, rect(-50, -50, W + 100, bottom + 50), INK);
  cuts(c, rect(-50, -50, W + 100, bottom + 50), { turn: -0.06, gap: 22, len: 130, wide: 5, color: SLATE, wave: 22, fill: 0.5 });
  //the sky is lighter down by the horizon, so dark shapes stand out against it
  const low = rect(-50, bottom - 200, W + 100, 200);
  block(c, low, SLATE);
  cuts(c, low, { turn: -0.04, gap: 16, len: 110, wide: 4, color: INK, wave: 10, fill: 0.45 });
}

// ---------------------------------------------------------------------------
// people and boats
// ---------------------------------------------------------------------------

//you, from behind, in the company oilskin. In a jumper once you've given the oilskin away
function deckhand(c: Ctx, x: number, y: number, s: number, jumper = false) {
  const coat = jumper ? SLATE : RUST;
  for (const dx of [-14, 3]) block(c, rect(x + dx * s, y - 40 * s, 11 * s, 40 * s), INK);
  const body: Pt[] = [[x - 24 * s, y - 36 * s], [x - 21 * s, y - 92 * s], [x - 12 * s, y - 100 * s], [x + 12 * s, y - 100 * s], [x + 21 * s, y - 92 * s], [x + 24 * s, y - 36 * s]];
  block(c, body, coat);
  cuts(c, body, { turn: 1.5, gap: Math.min(5 * s, 16), len: Math.min(18 * s, 60), wide: Math.min(1.6 * s, 3), color: jumper ? INK : PAPER, fill: 0.25 });
  if (!jumper) block(c, rect(x - 22 * s, y - 64 * s, 44 * s, 5 * s), MIST);
  block(c, ellipse(x, y - 110 * s, jumper ? 10 * s : 13 * s, jumper ? 12 * s : 15 * s), jumper ? INK : coat);
  if (!jumper && s < 3) carve(c, [[x - 8 * s, y - 120 * s], [x, y - 124 * s], [x + 8 * s, y - 120 * s]], 2 * s, INK);
}

//Nessa, facing you, soaked, her phone lit in her hand. In your oilskin once you've given it to her
function nessa(c: Ctx, x: number, y: number, s: number, oilskin = false) {
  for (const dx of [-11, 2]) block(c, rect(x + dx * s, y - 36 * s, 9 * s, 36 * s), INK);
  const body: Pt[] = [[x - 20 * s, y - 30 * s], [x - 18 * s, y - 90 * s], [x - 10 * s, y - 98 * s], [x + 10 * s, y - 98 * s], [x + 18 * s, y - 90 * s], [x + 20 * s, y - 30 * s]];
  block(c, body, oilskin ? RUST : INK);
  cuts(c, body, { turn: 1.5, gap: Math.min(6 * s, 16), len: Math.min(20 * s, 60), wide: Math.min(1.4 * s, 3), color: oilskin ? PAPER : SLATE, fill: 0.3 });
  block(c, limb([[x + 14 * s, y - 88 * s], [x + 18 * s, y - 64 * s], [x + 6 * s, y - 70 * s]], 8 * s), oilskin ? RUST : INK);
  block(c, rect(x + 2 * s, y - 78 * s, 6 * s, 9 * s), LAMP);
  block(c, ellipse(x, y - 108 * s, 9 * s, 11 * s), PAPER);
  block(c, [...ellipse(x, y - 114 * s, 11 * s, 8 * s).slice(13), [x + 11 * s, y - 92 * s], [x + 7 * s, y - 92 * s], [x + 8 * s, y - 108 * s], [x - 8 * s, y - 108 * s], [x - 7 * s, y - 92 * s], [x - 11 * s, y - 92 * s]], INK);
  if (s > 2) for (const dx of [-3.5, 3.5]) dot(c, x + dx * s, y - 107 * s, 1 * s, INK);
}

function passenger(c: Ctx, x: number, y: number, s: number) {
  block(c, [[x - 12 * s, y], [x - 10 * s, y - 70 * s], [x + 10 * s, y - 70 * s], [x + 12 * s, y]], INK);
  block(c, ellipse(x, y - 80 * s, 8 * s, 9 * s), INK);
  block(c, rect(x + 8 * s, y - 50 * s, 12 * s, 16 * s), SLATE);
}

//the Maid of Calder in profile, from her bow at (x, y) on the waterline
function ferry(c: Ctx, x: number, y: number, s: number, ramp: 'down' | 'up') {
  const hull: Pt[] = [[x, y - 170 * s], [x + 1000 * s, y - 170 * s], [x + 1000 * s, y], [x + 60 * s, y]];
  block(c, hull, INK);
  block(c, [[x + 52 * s, y - 34 * s], [x + 1000 * s, y - 34 * s], [x + 1000 * s, y], [x + 60 * s, y]], RUST);
  cuts(c, hull, { turn: 1.57, gap: 26 * s, len: 60 * s, wide: 2 * s, color: SLATE, fill: 0.25 });
  carve(c, [[x + 1000 * s, y - 168 * s], [x + 2 * s, y - 168 * s], [x + 58 * s, y - 2 * s]], 5 * s, MIST);
  for (let i = 0; i < 14; i++) dot(c, x + (180 + i * 52) * s, y - 128 * s, 5 * s, i % 3 ? PAPER : LAMP);
  letters(c, 'MAID OF CALDER', x + 260 * s, y - 70 * s, 30 * s, PAPER);
  const house: Pt[] = [[x + 140 * s, y - 170 * s], [x + 170 * s, y - 290 * s], [x + 1000 * s, y - 290 * s], [x + 1000 * s, y - 170 * s]];
  block(c, house, PAPER);
  cuts(c, house, { turn: 0, gap: 16 * s, len: 70 * s, wide: 1.5 * s, color: MIST, fill: 0.35 });
  block(c, rect(x + 190 * s, y - 250 * s, 810 * s, 40 * s), INK);
  for (let i = 0; i < 16; i++) if (random() > 0.3) block(c, rect(x + (200 + i * 50) * s, y - 246 * s, 34 * s, 32 * s), LAMP);
  block(c, [[x + 210 * s, y - 290 * s], [x + 230 * s, y - 370 * s], [x + 440 * s, y - 370 * s], [x + 450 * s, y - 290 * s]], PAPER);
  block(c, rect(x + 236 * s, y - 356 * s, 196 * s, 34 * s), LAMP);
  for (let k = 0; k <= 4; k++) block(c, rect(x + (236 + k * 47) * s, y - 358 * s, 5 * s, 38 * s), INK);
  block(c, [[x + 600 * s, y - 290 * s], [x + 620 * s, y - 450 * s], [x + 700 * s, y - 450 * s], [x + 690 * s, y - 290 * s]], RUST);
  block(c, [[x + 618 * s, y - 450 * s], [x + 622 * s, y - 480 * s], [x + 702 * s, y - 480 * s], [x + 700 * s, y - 450 * s]], INK);
  block(c, limb([[x + 330 * s, y - 370 * s], [x + 334 * s, y - 470 * s]], 5 * s), INK);
  if (ramp === 'down') {
    const deck: Pt[] = [[x + 18 * s, y - 72 * s], [x + 70 * s, y - 62 * s], [x - 100 * s, y + 62 * s], [x - 160 * s, y + 50 * s]];
    block(c, deck, MIST);
    cuts(c, deck, { turn: 2.5, gap: 12 * s, len: 30 * s, wide: 3 * s, color: INK, fill: 0.8 });
    carve(c, [deck[1], deck[2]], 5 * s, INK);
    carve(c, [deck[0], deck[3]], 5 * s, PAPER);
  } else {
    block(c, [[x - 14 * s, y - 210 * s], [x + 24 * s, y - 210 * s], [x + 56 * s, y - 30 * s], [x + 18 * s, y - 30 * s]], MIST);
    carve(c, [[x - 14 * s, y - 210 * s], [x + 18 * s, y - 30 * s]], 4 * s, PAPER);
  }
}

// ---------------------------------------------------------------------------
// prints, made once per set and beat
// ---------------------------------------------------------------------------

function dockScene(c: Ctx, beat?: string) {
  const calm = beat === 'calm';
  const gone = beat === 'alone' || beat === 'aboard';
  if (calm) {
    block(c, rect(-50, -50, W + 100, 640), INK);
    for (let i = 0; i < 120; i++) dot(c, random() * W, random() * 480, 0.8 + random() * 2, PAPER, 0.8);
    block(c, ellipse(300, 150, 42, 42), PAPER);
    cuts(c, ellipse(300, 150, 42, 42), { turn: 0.4, gap: 9, len: 20, wide: 2, color: MIST, fill: 0.3 });
  } else storm(c, 600);

  //the headland across the water
  const head: Pt[] = [[-50, 580], [-50, 470], [120, 438], [300, 452], [470, 500], [640, 548], [760, 580]];
  block(c, head, MIST);
  cuts(c, head, { turn: 0.18, gap: 12, len: 44, wide: 3, color: SLATE, fill: 0.35 });

  const sea = rect(-50, 560, W + 100, 400);
  block(c, sea, SLATE);
  cuts(c, sea, { turn: 0, gap: 15, len: 70, wide: 4, color: INK, wave: 6, fill: 0.55 });
  if (gone) cuts(c, [[900, 620], [1400, 590], [1400, 700], [900, 650]], { turn: -0.06, gap: 8, len: 60, wide: 3, color: PAPER, fill: 0.7 });

  ferry(c, gone ? 1290 : 1000, 640, 1, gone ? 'up' : 'down');

  //the quay and the slip running down into the water
  const quay: Pt[] = [[-50, 640], [600, 616], [780, 646], [940, 706], [980, 950], [-50, 950]];
  block(c, quay, WOOD);
  cuts(c, quay, { turn: 0.03, gap: 18, len: 400, wide: 3, color: INK, fill: 0.9 });
  cuts(c, quay, { turn: 0.03, gap: 9, len: 50, wide: 2, color: '#a4774e', fill: 0.3 });
  carve(c, [[600, 618], [780, 648], [940, 708]], 4, INK);
  for (let i = 0; i < 6; i++) block(c, ellipse(150 + random() * 700, 760 + random() * 120, 60 + random() * 60, 6, 0.02), SLATE);
  block(c, rect(548, 590, 22, 34), INK);

  //the ticket office, shut for the night
  block(c, rect(110, 470, 240, 168), PAPER);
  cuts(c, rect(110, 470, 240, 168), { turn: 1.57, gap: 12, len: 50, wide: 2, color: MIST, fill: 0.5 });
  carve(c, [[110, 638], [110, 470], [350, 470], [350, 638]], 4, INK);
  block(c, [[90, 482], [230, 398], [370, 482]], RUST);
  block(c, rect(140, 530, 76, 60), INK);
  block(c, rect(262, 536, 54, 102), INK);
  block(c, rect(136, 492, 120, 26), INK);
  letters(c, 'TICKETS', 196, 512, 18, PAPER, 'center');
  block(c, rect(258, 568, 62, 20), RUST);
  letters(c, 'CLOSED', 289, 583, 12, PAPER, 'center');

  //the lamp post. The lamp itself swings in the wind, so it's drawn live
  block(c, limb([[640, 632], [640, 236]], 12, 8), INK);
  block(c, limb([[636, 240], [704, 240]], 7), INK);

  if (beat === 'boarding' || calm) [[930, 650], [975, 620], [1018, 596]].forEach(([x, y]) => passenger(c, x, y, 0.72));
  if (!gone) deckhand(c, 820, 706, 1);
  if (beat === 'woman') nessa(c, 470, 650, 1);
  if (beat === 'alone') nessa(c, 610, 652, 0.95);
  grain(c);
}

//you and Nessa under the lamp, the ferry's hull behind her
function rampScene(c: Ctx, beat?: string) {
  const hull = rect(-50, -50, W + 100, 640);
  block(c, hull, INK);
  cuts(c, hull, { turn: 1.57, gap: 20, len: 120, wide: 2.5, color: SLATE, fill: 0.3 });
  block(c, rect(-50, 520, W + 100, 70), RUST);
  for (let x = 30; x < W; x += 64) for (const y of [70, 500]) dot(c, x, y, 5, PAPER, 0.8);
  //the name runs along the hull above your head and hers
  letters(c, 'MAID OF CALDER', 560, 236, 96, PAPER);
  cuts(c, rect(550, 140, 1060, 110), { turn: 1.57, gap: 14, len: 70, wide: 3, color: INK, fill: 0.25 });

  const ground = rect(-50, 590, W + 100, 360);
  block(c, ground, MIST);
  cuts(c, ground, { turn: 0.02, gap: 12, len: 80, wide: 3, color: PAPER, fill: 0.4 });
  for (let i = 0; i < 5; i++) {
    const [x, y] = [500 + random() * 900, 700 + random() * 180];
    block(c, ellipse(x, y, 90 + random() * 80, 10), SLATE);
    sliver(c, x, y, 70, 4, 0, LAMP);
  }

  const coat = beat === 'coat';
  nessa(c, 1000, 960, 5.4, coat);
  deckhand(c, 400, 1060, 7, coat);
  grain(c);
}

//Nessa close up, rain running down her face
function faceScene(c: Ctx) {
  const back = rect(-50, -50, W + 100, H + 100);
  block(c, back, SLATE);
  cuts(c, back, { turn: 1.9, gap: 16, len: 70, wide: 3, color: MIST, fill: 0.35 });
  block(c, ellipse(560, 200, 260, 220), LAMP);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    sliver(c, 560 + Math.cos(a) * 170, 200 + Math.sin(a) * 140, 120, 8, a, PAPER);
  }

  //her coat and shoulders
  const coat: Pt[] = [[380, 960], [470, 760], [640, 690], [960, 690], [1130, 760], [1220, 960]];
  block(c, coat, INK);
  cuts(c, coat, { turn: -1.2, gap: 26, len: 90, wide: 4, color: SLATE, wave: 10, fill: 0.45 });
  block(c, [[700, 700], [800, 820], [900, 700], [870, 690], [800, 770], [730, 690]], RUST);

  //neck, then face
  const neck = rect(735, 560, 130, 150);
  block(c, neck, PAPER);
  cuts(c, rect(800, 560, 70, 150), { turn: 1.2, gap: 8, len: 40, wide: 3, color: INK, fill: 0.7 });
  const face = ellipse(800, 420, 128, 166);
  block(c, face, PAPER);
  //the side away from the lamp, shaded with lines left standing
  c.save();
  trace(c, face);
  c.clip();
  cuts(c, rect(820, 250, 140, 360), { turn: -1.15, gap: 9, len: 46, wide: 3.5, color: INK, fill: 0.75 });
  c.restore();

  //wet hair, cut into strands
  const hair: Pt[] = [
    [640, 700], [620, 520], [640, 360], [700, 270], [800, 240], [900, 270], [960, 360], [980, 520], [960, 700],
    [920, 700], [928, 520], [910, 400], [860, 330], [800, 318], [740, 330], [690, 400], [672, 520], [680, 700],
  ];
  block(c, hair, INK);
  cuts(c, hair, { turn: 1.45, gap: 11, len: 90, wide: 3, color: SLATE, wave: 8, fill: 0.6 });

  //eyes, brows, nose and mouth
  for (const [x, flip] of [[748, -1], [858, 1]] as Pt[]) {
    block(c, [[x - 30, 424], [x, 410], [x + 30, 424], [x, 434]], INK);
    dot(c, x - 6 * flip, 420, 4, PAPER);
    sliver(c, x + 4 * flip, 386, 70, 9, flip * 0.12, INK);
  }
  carve(c, [[806, 432], [818, 482], [806, 500]], 5, INK);
  block(c, [[756, 548], [800, 538], [846, 548], [800, 562]], INK);
  sliver(c, 800, 568, 50, 3, 0, RUST);
  grain(c);
}

const MESSAGE = ["Your father's condition", 'has changed. Please come', 'as soon as you can.'];

//a phone in the rain, held in a cupped hand
function phoneScene(c: Ctx, beat?: string) {
  const back = rect(-50, -50, W + 100, H + 100);
  block(c, back, INK);
  cuts(c, back, { turn: 1.9, gap: 18, len: 80, wide: 3, color: SLATE, fill: 0.4 });

  block(c, [[560, 960], [600, 660], [700, 600], [1020, 640], [1080, 780], [1060, 960]], PAPER);
  const phone = tilted(820, 420, 400, 660, -0.06);
  block(c, phone, INK);
  const screen = tilted(820, 420, 350, 590, -0.06);
  block(c, screen, '#dfe4e2');
  //fingers wrapped around the sides
  for (let k = 0; k < 4; k++) block(c, limb([[1060, 540 + k * 70], [1010, 530 + k * 70], [996, 560 + k * 70]], 46, 40), PAPER);
  block(c, limb([[600, 720], [620, 600], [660, 540]], 56, 44), PAPER);
  carve(c, [[1010, 600], [1000, 610]], 3, INK);
  for (let k = 0; k < 4; k++) carve(c, [[1040, 562 + k * 70], [1006, 556 + k * 70]], 3, MIST);

  c.save();
  c.translate(820, 420);
  c.rotate(-0.06);
  letters(c, '21:31', 0, -220, 54, INK, 'center');
  if (beat === 'call') {
    letters(c, 'Mainland General', 0, -90, 30, INK, 'center');
    letters(c, 'Calling...', 0, -50, 24, SLATE, 'center');
    dot(c, 0, 200, 40, RUST);
    sliver(c, 0, 200, 46, 14, 0, PAPER);
  } else {
    letters(c, '+44 7700 900461', -150, -150, 22, SLATE);
    c.fillStyle = SLATE;
    c.beginPath();
    c.roundRect(-158, -128, 316, 128, 20);
    c.fill();
    MESSAGE.forEach((text, i) => letters(c, text, -140, -90 + i * 36, 24, PAPER));
  }
  c.restore();
  //raindrops sitting on the glass
  for (let i = 0; i < 26; i++) {
    const [x, y, r] = [660 + random() * 320, 140 + random() * 560, 3 + random() * 9];
    dot(c, x, y, r, MIST, 0.7);
    sliver(c, x - r * 0.3, y - r * 0.3, r, r * 0.4, -0.8, PAPER);
  }
  grain(c);
}

//the tally counter in your fist
function clickerScene(c: Ctx, beat?: string) {
  const back = rect(-50, -50, W + 100, H + 100);
  block(c, back, SLATE);
  cuts(c, back, { turn: 1.9, gap: 16, len: 80, wide: 3, color: MIST, fill: 0.3 });
  block(c, limb([[1700, 1000], [1300, 800], [1080, 660]], 360, 300), RUST);
  cuts(c, limb([[1700, 1000], [1300, 800], [1080, 660]], 360, 300), { turn: -0.55, gap: 30, len: 120, wide: 4, color: PAPER, fill: 0.3 });

  block(c, ellipse(800, 470, 196, 196), INK);
  const body = ellipse(800, 470, 180, 180);
  block(c, body, MIST);
  for (const r of [150, 120]) carve(c, ellipse(800, 470, r, r, 0, 40).slice(14, 26), 4, PAPER);
  block(c, rect(778, 248, 44, 50), INK);
  block(c, ellipse(800, 248, 46, 18), MIST);
  block(c, rect(680, 424, 240, 92), INK);
  block(c, rect(690, 432, 220, 76), PAPER);
  const count = beat === '121' ? '0121' : '0120';
  [...count].forEach((d, i) => letters(c, d, 717 + i * 55, 494, 64, i === 3 && beat === '121' ? RUST : INK, 'center'));
  for (let k = 1; k < 4; k++) block(c, rect(688 + k * 55, 432, 3, 76), MIST);

  //your fist round it, thumb on the button
  block(c, [[930, 560], [1110, 480], [1190, 640], [1060, 760], [950, 700]], PAPER);
  for (let k = 0; k < 3; k++) carve(c, [[960 + k * 30, 590 + k * 40], [1060 + k * 20, 560 + k * 46]], 3, INK);
  block(c, limb([[1090, 500], [940, 330], [830, 236]], 64, 50), PAPER);
  carve(c, [[1080, 520], [940, 350], [850, 262]], 3, INK);
  grain(c);
}

//looking up at the wheelhouse, the radio in your hand
function radioScene(c: Ctx) {
  storm(c, H);
  const side: Pt[] = [[160, 950], [360, 300], [1500, 230], [1650, 950]];
  block(c, side, PAPER);
  cuts(c, side, { turn: -0.06, gap: 24, len: 120, wide: 2.5, color: MIST, fill: 0.4 });
  carve(c, [[160, 950], [360, 300], [1500, 230], [1650, 950]], 6, INK);
  block(c, [[300, 500], [1560, 430], [1580, 520], [270, 590]], RUST);
  for (let i = 0; i < 8; i++) {
    block(c, ellipse(500 + i * 135, 690 - i * 6, 30, 34), INK);
    block(c, ellipse(500 + i * 135, 690 - i * 6, 18, 22), LAMP);
  }
  const house: Pt[] = [[480, 320], [540, 120], [1280, 80], [1360, 280]];
  block(c, house, PAPER);
  carve(c, [[480, 320], [540, 120], [1280, 80], [1360, 280]], 6, INK);
  block(c, [[540, 200], [1300, 170], [1320, 250], [520, 270]], INK);
  for (let k = 0; k < 6; k++) {
    const x = 560 + k * 124;
    block(c, [[x, 210 - k * 4], [x + 104, 206 - k * 4], [x + 106, 250 - k * 4], [x - 2, 256 - k * 4]], LAMP);
  }
  //the captain, a dark shape in the middle window
  block(c, ellipse(880, 222, 22, 26), INK);
  block(c, [[848, 206], [856, 188], [906, 188], [914, 206]], INK);
  block(c, [[838, 252], [850, 236], [910, 236], [922, 252]], INK);
  for (let x = 480; x < 1380; x += 40) block(c, rect(x, 290 - (x - 480) * 0.045, 4, 40), INK);
  block(c, limb([[470, 300], [1370, 258]], 5), INK);

  //your sleeve and hand, and the radio
  block(c, limb([[-80, 1000], [180, 820], [380, 690]], 230, 170), RUST);
  cuts(c, limb([[-80, 1000], [180, 820], [380, 690]], 230, 170), { turn: -0.6, gap: 26, len: 100, wide: 4, color: PAPER, fill: 0.3 });
  const radio = tilted(470, 560, 110, 250, -0.28);
  block(c, radio, INK);
  block(c, limb([[440, 450], [400, 300]], 14, 10), INK);
  for (let k = 0; k < 5; k++) sliver(c, 485 + k * 4, 590 + k * 16, 60, 4, -0.28, SLATE);
  const hand: Pt[] = [[370, 640], [470, 600], [560, 640], [540, 740], [400, 740]];
  block(c, hand, PAPER);
  carve(c, [...hand, hand[0]], 5, INK);
  for (let k = 0; k < 3; k++) carve(c, [[420 + k * 10, 660 + k * 26], [530 - k * 4, 640 + k * 26]], 3, INK);
  grain(c);
}

//the car deck, everyone waiting to go
function deckScene(c: Ctx, beat?: string) {
  block(c, rect(-50, -50, W + 100, 340), INK);
  for (let k = -6; k <= 6; k++) block(c, limb([[800 + k * 40, 300], [800 + k * 300, -50]], 8, 30), SLATE);
  for (let r = 0; r < 4; r++) for (const side of [-1, 1]) block(c, tilted(800 + side * (90 + r * 150), 240 - r * 70, 60 + r * 40, 8 + r * 4, side * 0.2), PAPER);
  for (const side of [-1, 1]) {
    const wall: Pt[] = [[800 + side * 260, 300], [800 + side * 900, -50], [800 + side * 900, 950], [800 + side * 260, 420]];
    block(c, wall, SLATE);
    cuts(c, wall, { turn: 1.57, gap: 30, len: 80, wide: 3, color: INK, fill: 0.35 });
  }
  const floor: Pt[] = [[540, 420], [1060, 420], [1700, 950], [-100, 950]];
  block(c, floor, MIST);
  cuts(c, floor, { turn: 0, gap: 14, len: 70, wide: 2.5, color: PAPER, fill: 0.3 });
  for (const side of [-1, 1]) block(c, limb([[800 + side * 20, 420], [800 + side * 120, 950]], 4, 14), PAPER);
  block(c, rect(560, 300, 480, 120), INK);
  block(c, rect(600, 330, 400, 90), SLATE);

  //cars in two lanes, nearest last
  const colors = [RUST, PAPER, SLATE, MIST, RUST, INK];
  for (let r = 3; r >= 0; r--) {
    for (const side of [-1, 1]) {
      const s = 0.45 + r * 0.32;
      const [x, y] = [800 + side * (120 + r * 170), 450 + r * 120];
      const w = 300 * s;
      block(c, [[x - w / 2, y], [x - w / 2, y - 60 * s], [x - w / 3, y - 110 * s], [x + w / 3, y - 110 * s], [x + w / 2, y - 60 * s], [x + w / 2, y]], colors[(r * 2 + (side + 1) / 2) % colors.length]);
      block(c, [[x - w / 2.6, y - 62 * s], [x - w / 3.4, y - 100 * s], [x + w / 3.4, y - 100 * s], [x + w / 2.6, y - 62 * s]], INK);
      for (const k of [-1, 1]) dot(c, x + k * w * 0.16, y - 74 * s, 12 * s, PAPER, 0.85);
      for (const k of [-1, 1]) block(c, ellipse(x + k * w * 0.33, y + 4 * s, 26 * s, 22 * s), INK);
    }
  }

  if (beat === 'doyle') {
    //Mr. Doyle, flat cap and white beard, holding out his ticket
    const [x, y, s] = [1180, 960, 4.2];
    const coat: Pt[] = [[x - 26 * s, y], [x - 24 * s, y - 92 * s], [x - 12 * s, y - 102 * s], [x + 12 * s, y - 102 * s], [x + 24 * s, y - 92 * s], [x + 26 * s, y]];
    block(c, coat, MIST);
    cuts(c, coat, { turn: 0.8, gap: 4 * s, len: 6 * s, wide: 1.2 * s, color: SLATE, fill: 0.6 });
    block(c, ellipse(x, y - 116 * s, 12 * s, 14 * s), PAPER);
    block(c, [[x - 12 * s, y - 112 * s], [x + 12 * s, y - 112 * s], [x + 8 * s, y - 96 * s], [x, y - 92 * s], [x - 8 * s, y - 96 * s]], PAPER);
    cuts(c, [[x - 12 * s, y - 112 * s], [x + 12 * s, y - 112 * s], [x, y - 92 * s]], { turn: 1.5, gap: 2 * s, len: 6 * s, wide: 0.8 * s, color: MIST, fill: 0.6 });
    block(c, [[x - 16 * s, y - 122 * s], [x - 12 * s, y - 132 * s], [x + 10 * s, y - 132 * s], [x + 18 * s, y - 124 * s]], INK);
    for (const dx of [-4.5, 4.5]) dot(c, x + dx * s, y - 116 * s, 1.1 * s, INK);
    block(c, limb([[x - 20 * s, y - 88 * s], [x - 34 * s, y - 64 * s], [x - 50 * s, y - 70 * s]], 9 * s), MIST);
    block(c, tilted(x - 60 * s, y - 74 * s, 22 * s, 12 * s, -0.2), PAPER);
    letters(c, 'CALDER', x - 60 * s, y - 72 * s, 3 * s, RUST, 'center', -0.2);
  }
  grain(c);
}

function seaScene(c: Ctx, beat?: string) {
  if (beat === 'morning') {
    //three days on: a flat grey sea under a pale sky
    block(c, rect(-50, -50, W + 100, 600), MIST);
    cuts(c, rect(-50, -50, W + 100, 600), { turn: 0, gap: 18, len: 160, wide: 3, color: PAPER, fill: 0.45 });
    block(c, ellipse(1120, 300, 70, 70), PAPER);
    block(c, [[-50, 560], [-50, 470], [200, 440], [420, 470], [560, 540]], SLATE);
    const sea = rect(-50, 540, W + 100, 420);
    block(c, sea, SLATE);
    cuts(c, sea, { turn: 0, gap: 12, len: 150, wide: 2.5, color: MIST, fill: 0.5 });
    ferry(c, 640, 560, 0.28, 'down');
    grain(c);
    return;
  }
  if (beat === 'mainland') {
    //the mainland slip: the town, the taxi rank, and Nessa running for it
    block(c, rect(-50, -50, W + 100, 520), SLATE);
    cuts(c, rect(-50, -50, W + 100, 520), { turn: -0.05, gap: 22, len: 120, wide: 4, color: INK, wave: 14, fill: 0.4 });
    for (let x = -40; x < W; ) {
      const [w, h] = [100 + random() * 120, 120 + random() * 160];
      block(c, rect(x, 500 - h, w, h + 20), INK);
      block(c, [[x - 6, 500 - h], [x + w / 2, 460 - h], [x + w + 6, 500 - h]], INK);
      for (let wy = 520 - h; wy < 470; wy += 34) for (let wx = x + 14; wx < x + w - 24; wx += 30) if (random() > 0.45) block(c, rect(wx, wy, 14, 18), LAMP);
      x += w + 4;
    }
    const quay = rect(-50, 500, W + 100, 460);
    block(c, quay, MIST);
    cuts(c, quay, { turn: 0.03, gap: 12, len: 70, wide: 2.5, color: PAPER, fill: 0.35 });
    for (let i = 0; i < 6; i++) block(c, ellipse(100 + random() * 1300, 640 + random() * 220, 80 + random() * 60, 7), SLATE);
    block(c, [[180, 640], [210, 570], [280, 548], [420, 548], [470, 590], [520, 600], [520, 650], [180, 650]], INK);
    block(c, rect(300, 528, 64, 20), LAMP);
    letters(c, 'TAXI', 332, 544, 15, INK, 'center');
    for (const x of [240, 450]) block(c, ellipse(x, 652, 26, 24), INK);
    block(c, rect(280, 566, 90, 34), SLATE);
    nessa(c, 640, 680, 1.2);
    ferry(c, 1240, 760, 0.9, 'down');
    grain(c);
    return;
  }
  storm(c, 560);
  if (beat === 'stern') {
    //looking back from the stern: the wake, and the island's slip with one lamp and one figure
    block(c, [[-50, 520], [300, 500], [700, 512], [1100, 506], [1650, 520], [1650, 560], [-50, 560]], INK);
    block(c, rect(780, 470, 4, 44), PAPER);
    dot(c, 786, 470, 4, LAMP);
    block(c, rect(796, 500, 4, 12), PAPER);
    block(c, rect(700, 496, 34, 18), SLATE);
    const sea = rect(-50, 540, W + 100, 420);
    block(c, sea, SLATE);
    cuts(c, sea, { turn: 0, gap: 16, len: 80, wide: 4, color: INK, wave: 8, fill: 0.55 });
    for (let i = 0; i < 80; i++) {
      const u = random();
      const side = random() > 0.5 ? 1 : -1;
      const [x, y] = [800 + side * u * (60 + 700 * u) + gauss() * 30 * u, 540 + u * 340];
      sliver(c, x, y, 40 + u * 110, 2 + u * 6, side * (0.25 - u * 0.15), PAPER);
    }
    block(c, rect(-50, 820, W + 100, 140), INK);
    for (let x = 40; x < W; x += 180) block(c, rect(x, 720, 16, 110), RUST);
    block(c, limb([[-50, 724], [W + 50, 724]], 14), RUST);
    block(c, limb([[-50, 778], [W + 50, 778]], 8), RUST);
    grain(c);
    return;
  }
  //the crossing: big seas, and the ferry small among them
  const swell = rect(-50, 520, W + 100, 440);
  block(c, swell, SLATE);
  ferry(c, 520, 560, 0.5, 'up');
  for (let r = 0; r < 4; r++) {
    const y = 600 + r * 90;
    const wave: Pt[] = [[-50, 960], ...Array.from({ length: 34 }, (_, k): Pt => [-50 + k * 52, y + Math.sin(k * 0.7 + r * 2) * (20 + r * 10)]), [W + 50, 960]];
    block(c, wave, r % 2 ? INK : SLATE);
    cuts(c, wave, { turn: 0, gap: 13, len: 50, wide: 3, color: r % 2 ? SLATE : INK, wave: 10, fill: 0.5 });
    for (let k = 0; k < 34; k++) if (Math.sin(k * 0.7 + r * 2) < -0.6) sliver(c, -50 + k * 52, y + Math.sin(k * 0.7 + r * 2) * (20 + r * 10) + 6, 60, 8, 0.2, PAPER);
  }
  grain(c);
}

const PRINT: Record<SetId, (c: Ctx, beat?: string) => void> = {
  dock: dockScene,
  ramp: rampScene,
  face: faceScene,
  phone: phoneScene,
  clicker: clickerScene,
  radio: radioScene,
  deck: deckScene,
  sea: seaScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//prints are slow to make, so each is made once and kept, dropping the oldest past a limit
const prints = new Map<string, HTMLCanvasElement>();
function print(cue: Cue) {
  const key = `${cue.set}:${cue.beat ?? ''}`;
  let printed = prints.get(key);
  if (!printed) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(W, H);
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    PRINT[cue.set](c, cue.beat);
    printed = el;
    prints.set(key, el);
    if (prints.size > 10) prints.delete(prints.keys().next().value!);
  }
  return printed;
}

// ---------------------------------------------------------------------------
// what moves on top of the prints
// ---------------------------------------------------------------------------

//the lamp hanging from its bracket at (x, y), swinging, and the light it throws
function lamp(c: Ctx, x: number, y: number, s: number, t: number) {
  const a = Math.sin(t * 1.7) * 0.13 + Math.sin(t * 0.6) * 0.05;
  const [hx, hy] = [x + Math.sin(a) * 26 * s, y + Math.cos(a) * 26 * s];
  c.save();
  c.globalAlpha *= 0.16;
  c.fillStyle = LAMP;
  trace(c, [[hx - 12 * s, hy + 8 * s], [hx + 12 * s, hy + 8 * s], [hx + 230 * s - a * 900 * s, hy + 420 * s], [hx - 230 * s - a * 900 * s, hy + 420 * s]]);
  c.fill();
  c.restore();
  glow(c, hx, hy + 10 * s, 70 * s, '236,199,126', 0.45);
  c.strokeStyle = INK;
  c.lineWidth = 2 * s;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(hx, hy);
  c.stroke();
  c.fillStyle = INK;
  trace(c, [[hx - 6 * s, hy - 2 * s], [hx + 6 * s, hy - 2 * s], [hx + 14 * s, hy + 10 * s], [hx - 14 * s, hy + 10 * s]]);
  c.fill();
  dot(c, hx, hy + 12 * s, 6 * s, LAMP);
}

function rain(c: Ctx, t: number, alpha: number) {
  c.save();
  c.globalAlpha *= alpha;
  for (let i = 0; i < 150; i++) {
    const speed = 900 + rand(i) * 500;
    const y = ((rand(i + 300) * 1100 + t * speed) % 1100) - 100;
    const x = ((rand(i + 600) * 1900 - y * 0.32) % 1900 + 1900) % 1900 - 150;
    sliver(c, x, y, 34 + rand(i + 900) * 40, 2.4, 1.88, PAPER);
  }
  c.restore();
}

//crests drifting along the sea between two heights
function crests(c: Ctx, t: number, y0: number, y1: number, n: number, color: string) {
  for (let i = 0; i < n; i++) {
    const y = y0 + rand(i + 40) * (y1 - y0);
    const x = ((rand(i) * 1800 + t * (20 + rand(i + 9) * 30)) % 1800) - 100;
    const show = Math.max(0, Math.sin(t * 0.9 + i * 1.3));
    if (show > 0.1) sliver(c, x, y + Math.sin(t * 1.5 + i) * 4, 30 + show * 40, 3 + show * 3, 0.05, color);
  }
}

function live(c: Ctx, cue: Cue, t: number) {
  const { set, beat } = cue;
  if (set === 'dock') {
    const gone = beat === 'alone' || beat === 'aboard';
    c.save();
    trace(c, [[790, gone ? 590 : 652], [1290, gone ? 590 : 652], [1290, 652], [W + 50, 652], [W + 50, H + 50], [985, H + 50], [944, 712], [780, 652]]);
    if (!gone) {
      c.moveTo(1010, 560);
      [[1080, 572], [906, 712], [830, 700]].forEach(([x, y]) => c.lineTo(x, y));
      c.closePath();
    }
    c.clip('evenodd');
    crests(c, t, gone ? 600 : 660, 880, 30, MIST);
    c.restore();
    lamp(c, 700, 242, 1, t);
  }
  if (set === 'ramp') lamp(c, 800, -10, 3, t);
  if (set === 'face') glow(c, 560, 200, 380, '236,199,126', 0.12 + 0.06 * Math.sin(t * 1.7));
  if (set === 'phone') glow(c, 820, 420, 360, '230,236,236', 0.1 + 0.03 * Math.sin(t * 3));
  if (set === 'radio' && Math.sin(t * 6) > 0) dot(c, 440, 466, 7, RUST);
  if (set === 'deck') for (let r = 0; r < 4; r++) glow(c, 800, 240 - r * 70, 200 + r * 60, '236,226,204', 0.04 + 0.02 * Math.sin(t * 13 + r));
  if (set === 'sea') {
    if (beat === undefined) crests(c, t, 600, 880, 40, PAPER);
    if (beat === 'stern') {
      crests(c, t, 560, 700, 24, MIST);
      glow(c, 786, 474, 30, '236,199,126', 0.4 + 0.15 * Math.sin(t * 1.7));
    }
    if (beat === 'mainland') glow(c, 332, 538, 50, '236,199,126', 0.35 + 0.1 * Math.sin(t * 2));
    if (beat === 'morning') {
      crests(c, t, 560, 860, 18, MIST);
      //gulls wheeling
      for (let i = 0; i < 4; i++) {
        const [x, y] = [300 + i * 260 + Math.sin(t * 0.3 + i) * 80, 200 + i * 30 + Math.cos(t * 0.4 + i * 2) * 30];
        const flap = Math.sin(t * 4 + i) * 6;
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x - 20, y - flap);
        c.quadraticCurveTo(x - 10, y - 10, x, y);
        c.quadraticCurveTo(x + 10, y - 10, x + 20, y - flap);
        c.stroke();
      }
    }
  }
  if (raining(cue)) rain(c, t, set === 'dock' || set === 'sea' ? 0.35 : 0.5);
}

function drawScene(c: Ctx, cue: Cue, t: number) {
  c.drawImage(print(cue), 0, 0);
  live(c, cue, t);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
  harbour: new URL('./sounds/harbour.m4a', import.meta.url).href,
  roof: new URL('./sounds/roof.m4a', import.meta.url).href,
  sea: new URL('./sounds/sea.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'deck') return { roof: 0.7, harbour: 0.15 };
  if (beat === 'calm' || beat === 'morning') return { harbour: 0.55 };
  if (set === 'sea' && beat !== 'mainland') return { sea: 0.7, rain: 0.35 };
  if (set === 'dock' || set === 'sea') return { rain: 0.55, harbour: 0.45 };
  return { rain: 0.7, harbour: 0.25 };
}

interface OneShot {
  src: string;
  volume: number;
  delay?: number;
}

const CLICK = new URL('./sounds/click.m4a', import.meta.url).href;
const CHAIN = new URL('./sounds/chain.m4a', import.meta.url).href;
const HORN = new URL('./sounds/horn.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  dock_woman: { src: new URL('./sounds/thunder.m4a', import.meta.url).href, volume: 0.6 },
  clicker_120: { src: CLICK, volume: 0.8, delay: 0.3 },
  clicker_121: { src: CLICK, volume: 0.8, delay: 0.3 },
  radio: { src: new URL('./sounds/radio.m4a', import.meta.url).href, volume: 0.35 },
  ramp_up_aboard: { src: CHAIN, volume: 0.7 },
  ramp_up_alone: { src: CHAIN, volume: 0.7 },
  crossing: { src: HORN, volume: 0.6, delay: 0.3 },
  stern_view: { src: HORN, volume: 0.45, delay: 0.3 },
  dock_calm: { src: HORN, volume: 0.6, delay: 0.6 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

//browsers only allow audio after the user has interacted with the page, so playback starts on the first key or click
function createSoundscape() {
  const context = new AudioContext();
  const beds = (Object.entries(BEDS) as [Bed, string][]).map(([bed, src]) => {
    const element = new Audio(src);
    element.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(element).connect(gain).connect(context.destination);
    return { bed, element, gain };
  });

  let unlocked = false;
  const stopListening = () => {
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('pointerdown', unlock);
  };
  function unlock() {
    context
      .resume()
      .then(() => Promise.all(beds.map(({ element }) => element.play())))
      .then(() => {
        unlocked = true;
        stopListening();
      })
      .catch(() => {}); //still locked; the next key or click tries again
  }
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);
  unlock();

  const timers = new Set<number>();
  return {
    mix(cue: Cue) {
      const levels = mixFor(cue);
      for (const { bed, gain } of beds) gain.gain.setTargetAtTime((levels[bed] ?? 0) * MASTER_VOLUME, context.currentTime, CROSSFADE / 3);
    },
    play({ src, volume, delay = 0 }: OneShot) {
      if (!unlocked) return;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        const element = new Audio(src);
        element.volume = volume * MASTER_VOLUME;
        element.play().catch(() => {});
      }, delay * 1000);
      timers.add(timer);
    },
    dispose() {
      stopListening();
      timers.forEach((timer) => window.clearTimeout(timer));
      beds.forEach(({ element }) => element.pause());
      context.close();
    },
  };
}

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function LastFerry({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Last Ferry has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active] });
  const sound = useRef<ReturnType<typeof createSoundscape> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const soundscape = createSoundscape();
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
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      if (prev !== cue && since < SET_FADE) {
        drawScene(c, prev, t);
        c.globalAlpha = ease(since / SET_FADE);
      }
      drawScene(c, cue, t);
      c.globalAlpha = 1;
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    shown.current = { cue: cues[active], at: performance.now(), prev: shown.current.cue };
    sound.current?.mix(cues[active]);
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
    background: INK,
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
    background: 'radial-gradient(ellipse at center, rgba(27,33,39,0.65) 0%, rgba(27,33,39,0) 70%)',
    color: PAPER,
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

export default LastFerry;
