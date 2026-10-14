import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Vanishing Act is a 1930s rubber-hose cartoon drawn on a 2D canvas: sepia ink and paint, fat wobbly outlines,
// noodle arms with white gloves and pie-cut eyes. Every line is drawn a few times with a different tremble and the
// versions are cycled so the lines boil, and everything moves in 12fps steps like hand-drawn cels, bouncing on one beat.
// Sets are painted once per beat and boil, and the cast is drawn live on top. Film grain, scratches, flicker and gate
// weave go over everything, and sets change with an iris wipe. Scenes are drawn in a fixed 1600x900 space.

const W = 1600;
const H = 900;
const FPS = 12; //the animation steps like hand-drawn cels
const BOILS = 3; //how many versions of each line there are
const BOIL_FPS = 8;
const BEAT = 1.1; //bounces a second
const IRIS = 1; //seconds for the iris to close on one set and open on the next
const LINE = 5;
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const BLACK = '#0d0a08';
const INK = '#17120e';
const DEEP = '#342c24';
const DARK = '#5e5243';
const MID = '#a8987a';
const LIGHT = '#d9cbaa';
const PAPER = '#f1e6cc';
const WHITE = '#fbf6e8';

const SERIF = 'Georgia, "Times New Roman", serif';
const DECO = 'Futura, "Century Gothic", "Avenir Next", sans-serif';
const HAND = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'card' | 'stage' | 'notebook' | 'greenroom' | 'wings' | 'backstage' | 'corridor' | 'dressing' | 'poster' | 'paper' | 'postcard';

interface Cue {
  set: SetId;
  beat?: string;
  x?: number; //what to keep in frame when the screen is narrower than the scene
}

const cues: Record<string, Cue> = {
  title_card: { set: 'card' },
  the_end: { set: 'card', beat: 'end' },
  house: { set: 'stage' },
  your_act: { set: 'stage', beat: 'you', x: 880 },
  marvello_act: { set: 'stage', beat: 'marvello', x: 600 },
  mirror: { set: 'stage', beat: 'mirror', x: 480 },
  painting: { set: 'stage', beat: 'painting', x: 1100 },
  ovation: { set: 'stage', beat: 'ovation' },
  bow_beside: { set: 'stage', beat: 'beside' },
  bow_tell: { set: 'stage', beat: 'tell', x: 880 },
  bow_tell_band: { set: 'stage', beat: 'band', x: 880 },
  notebook: { set: 'notebook' },
  green_room: { set: 'greenroom' },
  wings: { set: 'wings', x: 600 },
  wings_ovation: { set: 'wings', beat: 'ovation', x: 600 },
  spotlight: { set: 'wings', beat: 'spot', x: 440 },
  wings_dark: { set: 'wings', beat: 'dark', x: 440 },
  backstage: { set: 'backstage' },
  fitch: { set: 'backstage', beat: 'fitch', x: 900 },
  dot: { set: 'backstage', beat: 'dot', x: 500 },
  fitch_laugh: { set: 'backstage', beat: 'laugh', x: 620 },
  corridor: { set: 'corridor', x: 880 },
  corridor_shrug: { set: 'corridor', beat: 'shrug', x: 880 },
  corridor_empty: { set: 'corridor', beat: 'empty' },
  dressing_room: { set: 'dressing', x: 640 },
  knock: { set: 'dressing', beat: 'knock', x: 1100 },
  doorway: { set: 'dressing', beat: 'door', x: 1100 },
  doorway_thanks: { set: 'dressing', beat: 'thanks', x: 1000 },
  poster_marvello: { set: 'poster' },
  poster_both: { set: 'poster', beat: 'both' },
  paper_stuck: { set: 'paper', beat: 'stuck' },
  paper_war: { set: 'paper', beat: 'war' },
  postcard: { set: 'postcard' },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let random = seeded(1); //layout, like where the stars go: the same in every boil
let wobble = seeded(1); //the tremble in every line: different in each boil
let time = 0; //the scene's clock, stepped to whole cels

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

const ring = (x: number, y: number, rx: number, ry: number, turn = 0, n = 16): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const [px, py] = [Math.cos(a) * rx, Math.sin(a) * ry];
    return [x + px * Math.cos(turn) - py * Math.sin(turn), y + px * Math.sin(turn) + py * Math.cos(turn)];
  });

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const flip = (pts: Pt[], about = 0): Pt[] => pts.map(([x, y]) => [2 * about - x, y]);
const shake = (pts: Pt[], a = 2.2): Pt[] => pts.map(([x, y]) => [x + (wobble() - 0.5) * 2 * a, y + (wobble() - 0.5) * 2 * a]);

//a smooth path through the midpoints, so every shape comes out rounded and soft
function curve(c: Ctx, p: Pt[], closed: boolean) {
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  c.beginPath();
  if (closed) {
    c.moveTo(...mid(p[p.length - 1], p[0]));
    p.forEach((q, i) => c.quadraticCurveTo(q[0], q[1], ...mid(q, p[(i + 1) % p.length])));
    c.closePath();
    return;
  }
  c.moveTo(...p[0]);
  for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], ...mid(p[i], p[i + 1]));
  c.lineTo(...p[p.length - 1]);
}

function ink(c: Ctx, width: number, color = INK) {
  c.lineWidth = width;
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}

//a soft shape, painted and outlined
function blob(c: Ctx, pts: Pt[], fill: string, line = LINE) {
  curve(c, shake(pts), true);
  c.fillStyle = fill;
  c.fill();
  if (line) ink(c, line);
}

//a hard-edged shape, for sets and props
function box(c: Ctx, pts: Pt[], fill: string, line = LINE) {
  const p = shake(pts);
  c.beginPath();
  p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (line) ink(c, line);
}

const stroke = (c: Ctx, pts: Pt[], width: number, color = INK) => {
  curve(c, shake(pts), false);
  ink(c, width, color);
};

const outline = (c: Ctx, pts: Pt[], width: number, color = INK) => {
  curve(c, shake(pts), true);
  ink(c, width, color);
};

//a rubber hose: a soft tube with no elbow, outlined
function hose(c: Ctx, pts: Pt[], width: number, fill: string) {
  const p = shake(pts);
  curve(c, p, false);
  ink(c, width + LINE * 2);
  curve(c, p, false);
  ink(c, width, fill);
}

const dot = (c: Ctx, x: number, y: number, r: number, color: string) => {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
};

const glow = (c: Ctx, x: number, y: number, r: number, alpha: number) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,246,222,${alpha})`);
  g.addColorStop(1, 'rgba(255,246,222,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};

function words(c: Ctx, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'center', turn = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.font = font;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}

//draws in a local space moved to (x, y), scaled and turned
function at(c: Ctx, x: number, y: number, s: number, draw: () => void, turn = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.scale(s, s);
  draw();
  c.restore();
}

const star = (c: Ctx, x: number, y: number, r: number, fill = WHITE) =>
  box(c, Array.from({ length: 10 }, (_, i): Pt => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const k = i % 2 ? r * 0.45 : r;
    return [x + Math.cos(a) * k, y + Math.sin(a) * k];
  }), fill, 2.5);

function note(c: Ctx, x: number, y: number) {
  blob(c, ring(x, y, 11, 8, -0.4, 10), INK, 0);
  stroke(c, [[x + 9, y - 2], [x + 10, y - 50]], 4);
  stroke(c, [[x + 10, y - 50], [x + 26, y - 36], [x + 24, y - 22]], 4);
}

function bricks(c: Ctx, bottom: number) {
  box(c, rect(-50, -50, W + 100, bottom + 50), DARK, 0);
  for (let row = 0, y = 0; y < bottom; row++, y += 40) {
    stroke(c, [[-50, y], [W + 50, y]], 3, DEEP);
    for (let x = (row % 2) * 45; x < W; x += 90) stroke(c, [[x, y], [x, y + 40]], 3, DEEP);
  }
}

function boards(c: Ctx, top: number, color = MID) {
  box(c, rect(-50, top, W + 100, H - top + 50), color);
  for (let y = top + 30; y < H; y += 40 + (y - top) * 0.3) stroke(c, [[-50, y], [W + 50, y]], 2.5, DARK);
}

// ---------------------------------------------------------------------------
// the cast. Each is drawn about their feet, bouncing on the beat
// ---------------------------------------------------------------------------

function bouncy(c: Ctx, x: number, y: number, s: number, hop: number, draw: () => void) {
  const b = Math.abs(Math.sin(time * Math.PI * BEAT));
  const squash = 1 + (0.5 - b) * 0.05 * Math.sign(hop);
  c.save();
  c.translate(x, y - b * hop * s);
  c.scale(s * squash, s / squash);
  draw();
  c.restore();
}

//lean the upper body about the hips
const bend = (c: Ctx, a: number, hips: number) => {
  c.translate(0, -hips);
  c.rotate(a);
  c.translate(0, hips);
};

//a blink now and then, at a different moment for everyone
const blinking = (who: number) => ((time + rand(who) * 4) % 4 < 0.15 ? 1 : 0);

//a pie-cut eye: a tall white oval with a black pupil, a wedge cut out of it. lid closes it from the top, 0 to 1
function eye(c: Ctx, x: number, y: number, rx: number, ry: number, [lx, ly]: Pt = [0, 0], lid = 0, skin = PAPER) {
  const e = shake(ring(x, y, rx, ry, 0, 12), 1);
  curve(c, e, true);
  c.fillStyle = WHITE;
  c.fill();
  c.save();
  c.clip();
  const [px, py] = [x + lx * rx * 0.4, y + ry * 0.2 + ly * ry * 0.3];
  c.fillStyle = INK;
  c.beginPath();
  c.ellipse(px, py, rx * 0.58, ry * 0.58, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = WHITE;
  c.beginPath();
  c.moveTo(px, py);
  c.arc(px, py, rx * 0.6, -2.3, -1.6);
  c.closePath();
  c.fill();
  if (lid > 0) {
    c.fillStyle = skin;
    c.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, (ry * 2 + 4) * lid);
  }
  c.restore();
  curve(c, e, true);
  ink(c, 3.5);
  if (lid > 0) stroke(c, [[x - rx, y - ry + ry * 2 * lid], [x + rx, y - ry + ry * 2 * lid]], 3.5);
}

//a puffy four-fingered glove, the fingers pointing along turn
function glove(c: Ctx, x: number, y: number, turn: number) {
  at(c, x, y, 1, () => {
    for (const a of [-0.55, 0, 0.55]) blob(c, ring(Math.cos(a) * 15, Math.sin(a) * 15, 10, 6.5, a, 10), WHITE, 3.5);
    blob(c, ring(2, 0, 15, 14, 0, 12), WHITE, 3.5);
    blob(c, ring(-14, 0, 6, 13, 0, 10), WHITE, 3.5);
  }, turn);
}

//a noodle arm, with a glove where it ends
function arm(c: Ctx, pts: Pt[], fill: string, width = 15) {
  hose(c, pts, width, fill);
  const [[ax, ay], [bx, by]] = pts.slice(-2);
  glove(c, bx, by, Math.atan2(by - ay, bx - ax));
}

const shoe = (c: Ctx, x: number, y: number, dir: number) => {
  blob(c, ring(x + dir * 8, y, 27, 13), INK, 0);
  dot(c, x + dir * 18, y - 5, 4, DARK);
};

function topHat(c: Ctx, x: number, y: number, turn = 0, s = 1) {
  at(c, x, y, s, () => {
    box(c, [[-28, 0], [-24, -82], [24, -82], [28, 0]], DEEP);
    box(c, [[-28, 0], [-27, -16], [27, -16], [28, 0]], MID, 3.5);
    blob(c, ring(0, 0, 46, 9), DEEP);
  }, turn);
}

function bowler(c: Ctx, x: number, y: number, turn = 0) {
  at(c, x, y, 1, () => {
    blob(c, [[-36, 0], [-30, -30], [0, -40], [30, -30], [36, 0]], INK, 0);
    box(c, [[-35, -2], [-34, -9], [34, -9], [35, -2]], DARK, 0);
    blob(c, ring(0, 0, 48, 8), INK, 0);
  }, turn);
}

type MarvelloPose = 'stand' | 'present' | 'bow' | 'grin' | 'shrug' | 'hat' | 'laugh' | 'thanks';

const MARVELLO_ARMS: Record<MarvelloPose, [Pt[], Pt[]]> = {
  stand: [[[-44, -226], [-56, -170], [-52, -122]], [[44, -226], [56, -170], [52, -122]]],
  present: [[[-44, -226], [-90, -214], [-128, -200]], [[44, -226], [86, -270], [104, -334]]],
  bow: [[[-44, -226], [-60, -180], [-36, -146]], [[44, -226], [96, -190], [124, -140]]],
  grin: [[[-44, -226], [-86, -190], [-60, -150]], [[44, -226], [86, -190], [60, -150]]],
  shrug: [[[-44, -226], [-96, -216], [-112, -268]], [[44, -226], [96, -216], [112, -268]]],
  hat: [[[-44, -226], [-58, -180], [-28, -164]], [[44, -226], [58, -180], [28, -164]]],
  laugh: [[[-44, -226], [-76, -176], [-36, -150]], [[44, -226], [76, -176], [36, -150]]],
  thanks: [[[-44, -226], [-86, -190], [-60, -150]], [[44, -226], [110, -204], [160, -196]]],
};

//the Great Marvello: a pear in a tailcoat and cape, with a top hat and a waxed moustache. About 430 tall
function marvello(c: Ctx, x: number, y: number, s: number, pose: MarvelloPose) {
  bouncy(c, x, y, s, pose === 'hat' ? 3 : 8, () => {
    for (const d of [-1, 1]) {
      hose(c, [[18 * d, -110], [22 * d, -60], [30 * d, -16]], 22, DEEP);
      shoe(c, 34 * d, -10, d);
    }
    if (pose === 'bow') bend(c, 0.55, 110);
    if (pose === 'laugh') bend(c, -0.14, 110);
    blob(c, [[-46, -236], [-102, -104], [-50, -92], [0, -100], [50, -92], [102, -104], [46, -236]], DARK);
    blob(c, [[0, -252], [46, -240], [68, -180], [62, -120], [34, -98], [-34, -98], [-62, -120], [-68, -180], [-46, -240]], DEEP);
    blob(c, [[-20, -246], [0, -150], [20, -246]], WHITE, 3.5);
    for (const d of [-1, 1]) blob(c, [[0, -238], [20 * d, -250], [20 * d, -226]], INK, 0);
    for (const by of [-200, -176]) dot(c, 0, by, 4, INK);
    if (pose === 'hat') topHat(c, 0, -164, Math.PI);
    const [left, right] = MARVELLO_ARMS[pose];
    arm(c, left, DEEP, 16);
    arm(c, right, DEEP, 16);
    if (pose === 'bow') topHat(c, 140, -128, 2.2, 0.9);

    //the head
    const hy = -296;
    for (const d of [-1, 1]) blob(c, ring(42 * d, hy, 9, 13), PAPER, 4);
    blob(c, ring(0, hy, 42, 48), PAPER);
    if (pose === 'bow' || pose === 'hat') {
      blob(c, [[-40, hy - 14], [-32, hy - 42], [0, hy - 50], [32, hy - 42], [40, hy - 14], [22, hy - 30], [-22, hy - 30]], INK, 0);
      stroke(c, [[0, hy - 48], [2, hy - 30]], 3, PAPER);
    }
    const look: Pt = pose === 'present' ? [0.6, -0.6] : pose === 'hat' ? [0, 0.8] : pose === 'bow' ? [0, 0.6] : [0, 0];
    const lid = pose === 'hat' ? 0.4 : pose === 'laugh' ? 0.55 : blinking(1);
    for (const d of [-1, 1]) {
      eye(c, 14 * d, hy - 14, 11, 16, look, lid);
      const lift = pose === 'shrug' ? 10 : pose === 'hat' ? -2 : 0;
      stroke(c, [[24 * d, hy - 36 - lift + (pose === 'hat' ? 6 : 0)], [14 * d, hy - 42 - lift], [4 * d, hy - 38 - lift]], 4);
    }
    if (pose === 'laugh') {
      blob(c, ring(0, hy + 32, 18, 15), INK, 0);
      blob(c, ring(0, hy + 40, 10, 5), MID, 0);
    } else if (pose === 'hat') stroke(c, [[-14, hy + 32], [-5, hy + 27], [5, hy + 32], [14, hy + 27]], 4);
    else blob(c, [[-28, hy + 18], [0, hy + 42], [28, hy + 18], [0, hy + 28]], INK, 0);
    blob(c, ring(0, hy + 4, 10, 8), DARK, 3.5);
    for (const d of [-1, 1]) stroke(c, [[0, hy + 14], [18 * d, hy + 10], [32 * d, hy + 16], [38 * d, hy + 6], [31 * d, hy + 1]], 7);
    if (pose !== 'bow' && pose !== 'hat') topHat(c, 0, hy - 34, pose === 'laugh' ? -0.25 : 0.06);
  });
}

type YouPose = 'stand' | 'cards' | 'bow' | 'point' | 'glum' | 'shock' | 'shake' | 'shadow';

const YOUR_ARMS: Record<Exclude<YouPose, 'shadow'>, [Pt[], Pt[]]> = {
  stand: [[[-46, -188], [-60, -150], [-56, -112]], [[46, -188], [60, -150], [56, -112]]],
  glum: [[[-46, -188], [-58, -150], [-50, -110]], [[46, -188], [58, -150], [50, -110]]],
  shock: [[[-46, -188], [-80, -212], [-50, -246]], [[46, -188], [80, -212], [50, -246]]],
  cards: [[[-46, -188], [-60, -150], [-56, -112]], [[46, -188], [86, -214], [96, -256]]],
  bow: [[[-46, -188], [-64, -140], [-40, -112]], [[46, -188], [70, -150], [60, -110]]],
  point: [[[-46, -188], [-72, -150], [-50, -118]], [[46, -188], [110, -226], [150, -262]]],
  shake: [[[-46, -188], [-72, -150], [-50, -118]], [[46, -188], [100, -170], [136, -170]]],
};

//you: round, in a waistcoat and a bowler. About 330 tall. In the dark, only your eyes show
function you(c: Ctx, x: number, y: number, s: number, pose: YouPose, hat = true) {
  if (pose === 'shadow') {
    bouncy(c, x, y, s, 0, () => {
      for (const d of [-1, 1]) eye(c, 14 * d, -262, 10, 15, [0.6, 0], blinking(5), INK);
    });
    return;
  }
  bouncy(c, x, y, s, pose === 'glum' ? 2 : 7, () => {
    for (const d of [-1, 1]) {
      hose(c, [[16 * d, -92], [18 * d, -50], [22 * d, -14]], 20, DARK);
      shoe(c, 28 * d, -10, d);
    }
    if (pose === 'bow') bend(c, 0.5, 92);
    blob(c, [[0, -206], [44, -196], [60, -150], [52, -100], [0, -86], [-52, -100], [-60, -150], [-44, -196]], MID);
    blob(c, [[-16, -204], [0, -184], [16, -204]], WHITE, 3);
    for (const by of [-168, -144, -120]) dot(c, 0, by, 3.5, INK);
    stroke(c, [[-12, -140], [18, -128], [40, -140]], 2.5);
    const [left, right] = YOUR_ARMS[pose];
    if (pose === 'cards') for (let k = -2; k <= 2; k++) box(c, rect(-10, -34, 20, 30).map(([px, py]): Pt => {
      const a = k * 0.3;
      return [96 + px * Math.cos(a) - py * Math.sin(a), -262 + px * Math.sin(a) + py * Math.cos(a)];
    }), WHITE, 3);
    arm(c, left, WHITE, 14);
    arm(c, right, WHITE, 14);

    for (const d of [-1, 1]) blob(c, ring(46 * d, -252, 8, 12), PAPER, 4);
    blob(c, ring(0, -250, 46, 44), PAPER);
    const big = pose === 'shock' ? 4 : 0;
    const lid = pose === 'glum' ? 0.45 : pose === 'bow' ? 0.5 : blinking(2);
    const look: Pt = pose === 'glum' ? [0.3, 0.6] : pose === 'point' ? [0.8, -0.2] : [0, 0];
    for (const d of [-1, 1]) {
      eye(c, 14 * d, -262, 10 + big / 2, 15 + big, look, lid);
      if (pose === 'point') stroke(c, [[24 * d, -286], [6 * d, -278]], 4);
      if (pose === 'glum') stroke(c, [[24 * d, -278], [6 * d, -284]], 4);
    }
    blob(c, ring(0, -244, 7, 6), DARK, 3);
    if (pose === 'shock') blob(c, ring(0, -222, 8, 11), INK, 0);
    else if (pose === 'glum') stroke(c, [[-14, -220], [0, -227], [14, -220]], 4);
    else if (pose === 'point') stroke(c, [[-12, -224], [12, -224]], 4);
    else stroke(c, [[-14, -228], [0, -220], [14, -228]], 4);
    if (hat) bowler(c, 0, -282, pose === 'shock' ? -0.2 : 0);
  });
}

//Pip the rabbit, sitting
function pip(c: Ctx, x: number, y: number, s: number, wave = false) {
  bouncy(c, x, y, s, 12, () => {
    const sway = Math.sin(time * 5) * 6;
    for (const d of [-1, 1]) hose(c, [[10 * d, -96], [14 * d + sway * 0.5, -136], [18 * d + sway, -172]], 16, WHITE);
    blob(c, ring(0, -34, 34, 32), WHITE);
    for (const d of [-1, 1]) blob(c, ring(20 * d, -4, 16, 7), WHITE, 4);
    if (wave) arm(c, [[24, -50], [48, -80], [52 + sway, -112]], WHITE, 10);
    blob(c, ring(0, -84, 28, 26), WHITE);
    for (const d of [-1, 1]) {
      eye(c, 9 * d, -92, 7, 10, [0, 0], blinking(9), WHITE);
      stroke(c, [[8 * d, -74], [30 * d, -78]], 2);
      stroke(c, [[8 * d, -70], [30 * d, -68]], 2);
    }
    dot(c, 0, -76, 4.5, DARK);
    stroke(c, [[-6, -66], [0, -70], [6, -66]], 2.5);
  });
}

//Mr. Fitch: a barrel in a checked waistcoat and a bowler, chewing a cigar. About 290 tall
function fitch(c: Ctx, x: number, y: number, s: number, laugh = false) {
  bouncy(c, x, y, s, laugh ? 10 : 5, () => {
    for (const d of [-1, 1]) {
      hose(c, [[20 * d, -70], [22 * d, -40], [26 * d, -12]], 22, DEEP);
      shoe(c, 32 * d, -10, d);
    }
    if (laugh) bend(c, -0.14, 70);
    const belly = shake(ring(0, -140, 78, 76));
    curve(c, belly, true);
    c.fillStyle = LIGHT;
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = MID;
    for (let k = -80; k < 80; k += 22) {
      c.fillRect(k, -220, 6, 160);
      c.fillRect(-80, -140 + k, 160, 6);
    }
    c.restore();
    curve(c, belly, true);
    ink(c, LINE);
    for (const d of [-1, 1]) blob(c, [[-58 * d, -198], [-82 * d, -140], [-72 * d, -78], [-40 * d, -70], [-26 * d, -182]], DARK);
    if (laugh) for (const d of [-1, 1]) arm(c, [[62 * d, -176], [86 * d, -130], [40 * d, -110]], DARK, 16);
    else {
      arm(c, [[-62, -170], [-92, -130], [-70, -100]], DARK, 16);
      arm(c, [[62, -176], [84, -210], [44, -230]], DARK, 16);
    }
    blob(c, ring(0, -236, 42, 38), PAPER);
    for (const d of [-1, 1]) eye(c, 13 * d, -250, 8, 11, [0.5, 0], laugh ? 0.7 : blinking(3));
    if (laugh) blob(c, ring(0, -204, 15, 11), INK, 0);
    else box(c, [[12, -214], [62, -226], [64, -217], [14, -205]], MID, 3);
    blob(c, ring(0, -234, 11, 9), DARK, 3.5);
    blob(c, [[-36, -220], [0, -230], [36, -220], [22, -208], [0, -214], [-22, -208]], INK, 0);
    bowler(c, 0, -266, laugh ? -0.3 : 0.1);
  });
}

//Dot the stagehand: overalls, rolled sleeves, a bob, and a cap on backwards. About 300 tall
function dotHand(c: Ctx, x: number, y: number, s: number, whisper = false) {
  bouncy(c, x, y, s, 7, () => {
    for (const d of [-1, 1]) {
      hose(c, [[14 * d, -96], [16 * d, -50], [18 * d, -14]], 22, MID);
      shoe(c, 24 * d, -10, d);
    }
    blob(c, [[0, -200], [38, -192], [46, -130], [44, -90], [-44, -90], [-46, -130], [-38, -192]], WHITE);
    box(c, [[-30, -160], [30, -160], [44, -90], [-44, -90]], MID);
    for (const d of [-1, 1]) stroke(c, [[26 * d, -160], [32 * d, -196]], 6, MID);
    arm(c, [[-38, -186], [-66, -150], [-44, -112]], WHITE, 13);
    arm(c, whisper ? [[38, -186], [62, -212], [30, -232]] : [[38, -186], [66, -150], [44, -112]], WHITE, 13);
    blob(c, ring(0, -252, 50, 46), INK, 0);
    blob(c, ring(0, -240, 38, 38), PAPER);
    blob(c, [[-40, -250], [-22, -276], [22, -276], [40, -250], [0, -262]], INK, 0);
    blob(c, [[-38, -272], [-30, -296], [0, -304], [30, -296], [38, -272]], DARK);
    blob(c, ring(-46, -274, 18, 6), DARK, 4);
    for (const d of [-1, 1]) {
      eye(c, 12 * d, -246, 9, 13, [-0.7, 0], blinking(4));
      for (const k of [0, 1]) dot(c, 22 * d + k * 5, -228 + k * 3, 2, DARK);
    }
    if (whisper) blob(c, ring(-4, -218, 6, 7), INK, 0);
    else stroke(c, [[-14, -222], [0, -218], [12, -224]], 3.5);
  });
}

function seal(c: Ctx, x: number, y: number) {
  const bob = Math.abs(Math.sin(time * Math.PI * BEAT)) * 16;
  blob(c, [[x - 70, y], [x - 30, y - 70], [x + 10, y - 140], [x + 30, y - 150], [x + 44, y - 120], [x + 40, y - 60], [x + 60, y]], DARK);
  blob(c, ring(x - 20, y - 6, 30, 10, -0.3), DARK, 4);
  eye(c, x + 26, y - 128, 6, 8, [0.4, -0.6], 0, DARK);
  dot(c, x + 46, y - 132, 5, INK);
  const bx = x + 50;
  const by = y - 186 - bob;
  blob(c, ring(bx, by, 28, 28), WHITE);
  c.save();
  curve(c, ring(bx, by, 26, 26), true);
  c.clip();
  c.fillStyle = MID;
  for (const k of [-1, 1]) c.fillRect(bx - 30, by - 4 + k * 14, 60, 8);
  c.fillStyle = DARK;
  c.fillRect(bx - 30, by - 4, 60, 8);
  c.restore();
}

//three chorus girls, kicking in turn
function dancers(c: Ctx, x: number, y: number, s: number) {
  for (let i = 0; i < 3; i++) {
    at(c, x + i * 110 * s, y, s, () => {
      const kick = Math.max(0, Math.sin(time * Math.PI * BEAT * 2 + i * 2));
      hose(c, [[-8, -100], [-10, -50], [-12, -6]], 14, LIGHT);
      hose(c, [[8, -100], [8 + kick * 50, -60 - kick * 40], [10 + kick * 90, -20 - kick * 110]], 14, LIGHT);
      shoe(c, -16, -6, -1);
      blob(c, [[-40, -96], [0, -120], [40, -96], [20, -92], [0, -100], [-20, -92]], WHITE);
      blob(c, [[-18, -100], [-20, -160], [20, -160], [18, -100]], MID);
      arm(c, [[-18, -150], [-40, -170], [-50, -200]], PAPER, 10);
      arm(c, [[18, -150], [40, -170], [50, -200]], PAPER, 10);
      blob(c, ring(0, -192, 24, 24), PAPER);
      blob(c, [[-26, -190], [-22, -216], [22, -216], [26, -190], [0, -204]], INK, 0);
      for (const d of [-1, 1]) eye(c, 8 * d, -190, 5, 8, [0, 0], blinking(20 + i));
    });
  }
}

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

//the Mirror Walk's mirror on its stand. Its glass is centered 260 above the stand's feet
function mirrorProp(c: Ctx) {
  for (const d of [-1, 1]) hose(c, [[50 * d, 0], [0, -120]], 10, DARK);
  blob(c, Array.from({ length: 28 }, (_, i): Pt => {
    const a = (i / 28) * Math.PI * 2;
    const k = i % 2 ? 1 : 1.08;
    return [Math.cos(a) * 96 * k, -260 + Math.sin(a) * 152 * k];
  }), MID);
  blob(c, ring(0, -260, 78, 132), LIGHT);
  for (const k of [0, 1]) stroke(c, [[-40 + k * 26, -330 + k * 30], [10 + k * 26, -380 + k * 30]], 5, WHITE);
  blob(c, [[-30, -414], [0, -450], [30, -414]], MID);
}

//the painting the magician climbs out of, on its easel: a gilt frame round a sunny hill
function frameProp(c: Ctx) {
  for (const [a, b] of [[-90, -60], [90, 60], [0, 10]] as Pt[]) hose(c, [[a, 0], [b, -440]], 10, DARK);
  box(c, rect(-140, -440, 280, 310), MID);
  box(c, rect(-112, -412, 224, 254), WHITE);
  blob(c, [[-112, -220], [-40, -270], [40, -250], [112, -230], [112, -158], [-112, -158]], LIGHT, 3.5);
  blob(c, ring(60, -350, 24, 24), PAPER, 3.5);
  for (const d of [-1, 1]) dot(c, 60 + 7 * d, -354, 3, INK);
  stroke(c, [[50, -342], [60, -336], [70, -342]], 3);
  hose(c, [[-50, -250], [-48, -300]], 8, DARK);
  blob(c, ring(-48, -310, 26, 20), MID, 3.5);
  for (const [x, y] of [[-140, -440], [140, -440], [-140, -130], [140, -130]]) blob(c, ring(x, y, 16, 16), LIGHT, 3.5);
}

//a magician's hat sitting upside down, open end up
function magicHat(c: Ctx, x: number, y: number, s: number) {
  at(c, x, y, s, () => {
    box(c, [[-36, 0], [-32, 76], [32, 76], [36, 0]], DEEP);
    box(c, [[-35, 50], [-33, 64], [33, 64], [35, 50]], MID, 3.5);
    blob(c, ring(0, 0, 56, 12), DEEP);
    blob(c, ring(0, 0, 38, 7), INK, 0);
  });
}

// ---------------------------------------------------------------------------
// sets, painted once per beat and boil
// ---------------------------------------------------------------------------

function cardScene(c: Ctx, beat?: string) {
  box(c, rect(-50, -50, W + 100, H + 100), INK, 0);
  if (beat === 'end') {
    for (let r = 620, k = 0; r > 210; r -= 58, k++) outline(c, ring(800, 330, r, r, 0, 28), 7, k % 2 ? MID : DARK);
    blob(c, ring(800, 330, 210, 210, 0, 28), DEEP, 7);
    words(c, 'The End', 800, 365, `italic bold 112px ${SERIF}`, PAPER);
    return;
  }
  outline(c, rect(110, 40, 1380, 620), 6, PAPER);
  outline(c, rect(132, 62, 1336, 576), 2.5, PAPER);
  for (const [x, y, dx, dy] of [[132, 62, 1, 1], [1468, 62, -1, 1], [132, 638, 1, -1], [1468, 638, -1, -1]]) {
    stroke(c, [[x, y + 70 * dy], [x + 30 * dx, y + 30 * dy], [x + 70 * dx, y]], 4, PAPER);
    blob(c, ring(x + 36 * dx, y + 36 * dy, 9, 9), PAPER, 0);
  }
  words(c, 'THE STOLEN IDEA', 800, 180, `600 34px ${DECO}`, LIGHT);
  words(c, 'The Vanishing Act', 800, 320, `italic bold 118px ${SERIF}`, PAPER);
  stroke(c, [[460, 368], [630, 392], [800, 362], [970, 392], [1140, 368]], 5, PAPER);
}

function proscenium(c: Ctx) {
  for (const x of [100, 1410]) {
    box(c, rect(x, 40, 90, 640), MID);
    for (const k of [22, 45, 68]) stroke(c, [[x + k, 120], [x + k, 650]], 3, DARK);
    blob(c, [[x - 12, 120], [x + 45, 90], [x + 102, 120], [x + 45, 132]], LIGHT);
  }
  box(c, rect(100, 16, 1400, 64), MID);
  blob(c, [[700, 70], [730, 4], [800, -16], [870, 4], [900, 70]], LIGHT);
  words(c, 'BIJOU', 800, 52, `bold 30px ${DECO}`, DEEP);
  const drape: Pt[] = [[190, 70], [370, 70], [336, 240], [262, 410], [302, 540], [262, 668], [190, 668]];
  for (const side of [drape, flip(drape, 800)]) blob(c, side, DARK);
  for (const x of [214, 1386]) {
    const d = x < 800 ? 1 : -1;
    stroke(c, [[x, 90], [x + 20 * d, 380], [x, 660]], 4);
    stroke(c, [[x + 46 * d, 90], [x + 60 * d, 260], [x + 34 * d, 410]], 4);
    blob(c, ring(x + 70 * d, 420, 26, 13), MID, 4);
    blob(c, [[x + 70 * d, 430], [x + 60 * d, 480], [x + 80 * d, 480]], LIGHT, 3);
  }
  const valance: Pt[] = [[190, 60], [1410, 60]];
  for (let i = 0; i <= 20; i++) valance.push([1410 - i * 61, i % 2 ? 182 : 138]);
  blob(c, valance, MID);
  for (let i = 1; i < 20; i += 2) blob(c, ring(1410 - i * 61, 196, 6, 11), LIGHT, 3);
  box(c, [[100, 668], [1500, 668], [1560, 722], [40, 722]], MID);
  for (let x = 200; x <= 1400; x += 100) blob(c, ring(x, 674, 24, 9), INK, 0);
  box(c, rect(-50, 722, W + 100, 300), INK, 0);
  box(c, rect(-50, 716, W + 100, 12), DARK, 0);
}

function stageScene(c: Ctx, beat?: string) {
  box(c, rect(-50, -50, W + 100, H + 100), DEEP, 0);
  if (!beat) {
    //the house curtain, down
    box(c, rect(190, 60, 1220, 560), DARK, 0);
    for (let x = 220; x < 1400; x += 60) {
      stroke(c, [[x, 70], [x + 10, 300], [x - 6, 610]], 5);
      stroke(c, [[x + 24, 70], [x + 30, 300], [x + 20, 610]], 3, MID);
    }
    stroke(c, [[800, 70], [800, 612]], 6);
    blob(c, ring(800, 330, 90, 100), MID);
    blob(c, ring(800, 330, 70, 80), DARK);
    words(c, 'B', 800, 362, `bold 92px ${SERIF}`, LIGHT);
  } else {
    //a painted night sky behind the act, with a moon that watches
    box(c, rect(190, 110, 1220, 480), DARK, 0);
    for (let i = 0; i < 24; i++) star(c, 230 + random() * 1140, 210 + random() * 260, 6 + random() * 9);
    //a crescent, fat on the left: round the outside one way, back round a smaller circle set to the right
    const moon: Pt[] = [
      ...Array.from({ length: 12 }, (_, i): Pt => [Math.cos(1.27 + (i / 11) * 3.74) * 62, Math.sin(1.27 + (i / 11) * 3.74) * 62]),
      ...Array.from({ length: 10 }, (_, i): Pt => [28 + Math.cos(4.4 - (i / 9) * 2.5) * 50, Math.sin(4.4 - (i / 9) * 2.5) * 50]),
    ];
    at(c, 1240, 260, 1, () => {
      blob(c, moon, LIGHT);
      eye(c, -38, -14, 6, 9, [0.5, 0.4], 0, LIGHT);
      stroke(c, [[-46, 20], [-36, 26], [-28, 18]], 3.5);
    });
  }
  box(c, [[190, 560], [1410, 560], [1480, 668], [120, 668]], LIGHT);
  for (let i = 0; i <= 16; i++) {
    const fx = 190 + (i * 1220) / 16;
    stroke(c, [[fx, 562], [800 + (fx - 800) * 1.12, 666]], 2.5, MID);
  }
  if (beat === 'you') {
    box(c, [[930, 520], [1130, 520], [1110, 540], [950, 540]], DARK);
    for (const x of [960, 1100]) box(c, rect(x - 5, 540, 10, 66), DARK);
  } else if (beat) {
    at(c, 430, 600, 1, () => mirrorProp(c));
    at(c, 1170, 600, 1, () => frameProp(c));
  }
  proscenium(c);
}

function notebookScene(c: Ctx) {
  box(c, rect(-50, -50, W + 100, H + 100), DARK, 0);
  for (let i = 0; i < 14; i++) stroke(c, [[-50, i * 70 + random() * 20], [800, i * 70 + 30], [W + 50, i * 70 + random() * 20]], 3, DEEP);
  at(c, 800, 370, 1, () => {
    blob(c, [[-650, -310], [-20, -296], [-10, 330], [-640, 320]], PAPER);
    blob(c, [[20, -296], [650, -310], [640, 320], [10, 330]], PAPER);
    stroke(c, [[0, -300], [0, 330]], 6, DARK);
    for (let y = -220; y < 310; y += 36) {
      stroke(c, [[-610, y], [-40, y + 4]], 1.5, MID);
      stroke(c, [[40, y + 4], [610, y]], 1.5, MID);
    }
    words(c, 'The Mirror Walk', -590, -240, `bold 56px ${HAND}`, INK, 'left', -0.02);
    stroke(c, [[-590, -222], [-200, -228]], 3);
    stroke(c, [[-580, -210], [-220, -214]], 2);
    outline(c, rect(-570, -140, 500, 230), 3);
    outline(c, ring(-480, -30, 36, 66), 3);
    outline(c, rect(-210, -110, 96, 120), 3);
    c.save();
    c.setLineDash([12, 12]);
    stroke(c, [[-480, 40], [-420, 150], [-260, 160], [-162, 20]], 3, DARK);
    c.restore();
    stroke(c, [[-180, 34], [-162, 20], [-150, 44]], 3, DARK);
    words(c, 'trapdoor!', -340, 210, `36px ${HAND}`, DARK, 'center', -0.03);
    words(c, 'mirror', -480, -110, `30px ${HAND}`, DARK);
    outline(c, rect(150, -220, 300, 230), 4);
    outline(c, rect(176, -194, 248, 178), 2.5);
    for (const [x, y] of [[150, -220], [450, -220], [150, 10], [450, 10]]) outline(c, ring(x, y, 16, 16), 3);
    outline(c, ring(300, -130, 18, 18), 3);
    stroke(c, [[300, -112], [300, -60], [270, -20]], 3);
    stroke(c, [[300, -60], [330, -20]], 3);
    stroke(c, [[300, -96], [350, -120]], 3);
    words(c, 'frame: GILT!!', 120, 90, `34px ${HAND}`, INK, 'left', -0.02);
    words(c, 'glass must ripple. silk?', 120, 160, `32px ${HAND}`, INK, 'left', 0.01);
    words(c, 'Pip in the hat after?', 120, 230, `32px ${HAND}`, INK, 'left', -0.01);
  });
  outline(c, ring(1340, 760, 90, 80), 6, DEEP);
  at(c, 1250, 720, 1, () => {
    box(c, rect(-180, -12, 300, 24), MID);
    box(c, [[120, -12], [170, 0], [120, 12]], LIGHT);
    dot(c, 166, 0, 4, INK);
  }, -0.5);
}

function greenroomScene(c: Ctx) {
  box(c, rect(-50, -50, W + 100, H + 100), LIGHT, 0);
  for (let x = 0; x < W; x += 80) box(c, rect(x, -50, 26, 700), PAPER, 0);
  box(c, rect(620, 90, 360, 230), WHITE);
  words(c, 'BIJOU', 800, 170, `bold 52px ${DECO}`, INK);
  words(c, 'ELEVEN ACTS', 800, 230, `600 30px ${DECO}`, DARK);
  words(c, 'TWICE NIGHTLY', 800, 280, `600 30px ${DECO}`, DARK);
  boards(c, 650, DARK);
  for (const x of [330, 1270]) box(c, rect(x - 10, 600, 20, 140), DEEP);
  box(c, [[260, 560], [1340, 560], [1380, 620], [220, 620]], MID);
  for (const x of [640, 980]) {
    blob(c, [[x - 28, 500], [x + 28, 500], [x + 22, 554], [x - 22, 554]], WHITE);
    outline(c, ring(x + 34, 524, 12, 14), 5);
    blob(c, ring(x, 556, 40, 7), WHITE, 3.5);
  }
  box(c, [[720, 534], [880, 530], [890, 570], [710, 574]], PAPER, 3.5);
  stroke(c, [[800, 532], [800, 572]], 2.5);
  for (let k = 0; k < 3; k++) stroke(c, [[730, 544 + k * 9], [790, 543 + k * 9]], 1.5, MID);
}

function wingsScene(c: Ctx, beat?: string) {
  box(c, rect(-50, -50, W + 100, H + 100), DEEP, 0);
  box(c, rect(880, 60, 780, 520), DARK, 0);
  for (let i = 0; i < 12; i++) star(c, 960 + random() * 600, 120 + random() * 300, 5 + random() * 7);
  box(c, [[880, 560], [1660, 540], [1660, 720], [880, 720]], LIGHT);
  for (let x = 900; x < 1660; x += 70) stroke(c, [[x, 556], [x - 30, 720]], 2.5, MID);
  blob(c, [[1500, 30], [1660, 30], [1660, 720], [1540, 720], [1570, 380]], DARK);
  boards(c, 700, DEEP);
  for (let i = 0; i < 6; i++) stroke(c, [[110 + i * 34, -50], [110 + i * 34 + random() * 10, 520]], 3, MID);
  box(c, rect(80, 510, 260, 22), MID);
  for (let i = 0; i < 6; i++) box(c, rect(102 + i * 34, 498, 10, 48), LIGHT, 3);
  stroke(c, [[640, -50], [640, 250]], 3, MID);
  blob(c, [[600, 250], [680, 250], [700, 330], [640, 350], [580, 330]], MID);
  words(c, 'SAND', 640, 314, `bold 20px ${DECO}`, INK);
  box(c, rect(470, 180, 110, 44), INK);
  words(c, 'STAND BY', 525, 210, `bold 16px ${DECO}`, beat === 'spot' ? WHITE : DARK);
  blob(c, [[760, -50], [930, -50], [900, 300], [940, 720], [760, 740]], DARK);
  for (const x of [790, 840, 880]) stroke(c, [[x, -40], [x + 10, 380], [x, 720]], 4);
  if (beat === 'spot' || beat === 'dark') {
    c.fillStyle = 'rgba(13,10,8,0.45)';
    c.fillRect(-50, -50, 820, H + 100);
  }
}

function backstageScene(c: Ctx) {
  bricks(c, 700);
  boards(c, 700);
  box(c, rect(1380, 250, 190, 450), DEEP);
  box(c, rect(1430, 300, 90, 70), LIGHT);
  box(c, rect(1395, 200, 160, 40), WHITE);
  words(c, 'STAGE DOOR', 1475, 228, `bold 22px ${DECO}`, INK);
  stroke(c, [[60, 200], [380, 200]], 8, DARK);
  for (let i = 0; i < 5; i++) {
    const x = 90 + i * 64;
    stroke(c, [[x, 200], [x, 222]], 3);
    blob(c, [[x - 22, 222], [x + 22, 222], [x + 36, 420], [x - 36, 420]], [WHITE, MID, LIGHT][i % 3]);
  }
  box(c, rect(560, 110, 240, 80), WHITE);
  words(c, 'QUIET!', 680, 168, `bold 50px ${DECO}`, INK);
  for (const [x, y, w, h] of [[1020, 580, 160, 120], [1180, 600, 140, 100], [1060, 470, 120, 110]]) {
    box(c, rect(x, y, w, h), LIGHT);
    stroke(c, [[x, y], [x + w, y + h]], 3, DARK);
    stroke(c, [[x + w, y], [x, y + h]], 3, DARK);
  }
  hose(c, [[1120, 470], [1130, 420], [1170, 400], [1200, 420]], 22, MID);
  blob(c, ring(1214, 388, 34, 28, -0.6), MID);
  blob(c, ring(1220, 382, 20, 16, -0.6), DEEP, 0);
}

function corridorScene(c: Ctx) {
  box(c, [[-50, -50], [W + 50, -50], [1000, 270], [600, 270]], DEEP);
  box(c, [[-50, -50], [600, 270], [600, 500], [-50, H + 50]], LIGHT);
  box(c, [[W + 50, -50], [1000, 270], [1000, 500], [W + 50, H + 50]], LIGHT);
  const floor: Pt[] = [[-50, H + 50], [W + 50, H + 50], [1000, 500], [600, 500]];
  box(c, floor, MID);
  //boards running away from you, kept on the floor
  c.save();
  c.beginPath();
  floor.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.clip();
  for (let i = -8; i <= 8; i++) stroke(c, [[800 + i * 25, 500], [800 + i * 260, H + 50]], 2.5, DARK);
  c.restore();
  box(c, rect(600, 270, 400, 230), DARK);
  box(c, rect(760, 330, 80, 170), LIGHT);
  stroke(c, [[-50, 600], [600, 440]], 4, MID);
  stroke(c, [[W + 50, 600], [1000, 440]], 4, MID);
  box(c, [[150, 150], [320, 222], [320, 590], [150, 660]], DARK);
  box(c, [[440, 238], [520, 262], [520, 470], [440, 492]], DARK);
  box(c, [[1080, 262], [1160, 238], [1160, 492], [1080, 470]], DARK);
  box(c, [[1180, 190], [1390, 110], [1390, 700], [1180, 610]], DEEP);
  star(c, 1286, 250, 58, WHITE);
  words(c, 'M', 1286, 270, `bold 40px ${SERIF}`, INK);
  dot(c, 1210, 420, 9, LIGHT);
  for (const [x, y] of LAMPS) blob(c, [[x - 16, y], [x + 16, y], [x + 8, y + 26], [x - 8, y + 26]], MID, 4);
}
const LAMPS: Pt[] = [[90, 220], [470, 300], [1130, 300], [1510, 220]];

const BULBS: Pt[] = [
  ...Array.from({ length: 5 }, (_, i): Pt => [230 + i * 85, 130]),
  ...Array.from({ length: 3 }, (_, i): Pt => [208, 200 + i * 80]),
  ...Array.from({ length: 3 }, (_, i): Pt => [592, 200 + i * 80]),
];

function dressingScene(c: Ctx, beat?: string) {
  box(c, rect(-50, -50, W + 100, 760), LIGHT, 0);
  for (let y = 30; y < 700; y += 70) for (let x = (y % 140) / 2; x < W; x += 70) blob(c, ring(x, y, 6, 9, 0, 8), MID, 0);
  boards(c, 700);
  box(c, rect(196, 116, 408, 330), MID);
  box(c, rect(232, 156, 336, 250), WHITE);
  for (const k of [0, 1]) stroke(c, [[300 + k * 40, 360], [420 + k * 40, 200]], 6, PAPER);
  for (const [x, y] of BULBS) blob(c, ring(x, y, 13, 13, 0, 10), PAPER, 3.5);
  box(c, [[150, 470], [660, 470], [670, 500], [140, 500]], DARK);
  for (const x of [170, 630]) box(c, rect(x - 8, 500, 16, 200), DEEP);
  for (const [x, h] of [[240, 30], [290, 46], [340, 24]]) blob(c, rect(x - 16, 470 - h, 32, h), [WHITE, MID, PAPER][x % 3]);
  blob(c, ring(1000, 170, 58, 58, 0, 20), WHITE);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    dot(c, 1000 + Math.cos(a) * 44, 170 + Math.sin(a) * 44, i % 3 ? 2.5 : 5, INK);
  }
  stroke(c, [[860, 230], [860, 700]], 8, DEEP);
  blob(c, [[820, 250], [900, 250], [920, 520], [800, 520]], DARK);
  box(c, rect(870, 340, 40, 54), PAPER, 3);
  if (beat === 'door' || beat === 'thanks') {
    box(c, rect(1150, 200, 230, 500), PAPER);
    box(c, [[1150, 640], [1380, 640], [1380, 700], [1150, 700]], MID, 0);
    box(c, [[1380, 200], [1470, 168], [1470, 732], [1380, 700]], DEEP);
  } else if (beat !== 'knock') door(c, 0);
}

function door(c: Ctx, dx: number) {
  box(c, rect(1150 + dx, 200, 230, 500), DEEP);
  outline(c, rect(1180 + dx, 230, 170, 180), 3, DARK);
  outline(c, rect(1180 + dx, 450, 170, 220), 3, DARK);
  dot(c, 1350 + dx, 450, 10, MID);
}

function posterScene(c: Ctx, beat?: string) {
  bricks(c, H + 50);
  at(c, 800, 360, 1, () => {
    box(c, rect(-330, -330, 660, 660), PAPER);
    outline(c, rect(-302, -302, 604, 604), 6);
    outline(c, rect(-284, -284, 568, 568), 2.5);
    words(c, 'THE BIJOU CIRCUIT PRESENTS', 0, -236, `600 22px ${DECO}`, DARK);
    words(c, 'THE GREAT', 0, -176, `bold 44px ${DECO}`, INK);
    words(c, 'MARVELLO', 0, -86, `bold 104px ${DECO}`, INK);
    if (beat === 'both') words(c, 'and partner', 0, -60, `italic 11px ${SERIF}`, DARK);
    at(c, 0, 160, 0.5, () => mirrorProp(c));
    for (const [x, y] of [[-120, 0], [130, -20], [-90, 100], [110, 110]]) star(c, x, y, 14, LIGHT);
    blob(c, [[-270, 170], [270, 170], [250, 236], [-250, 236]], DARK);
    words(c, 'THE MIRROR WALK', 0, 218, `bold 42px ${DECO}`, PAPER);
    words(c, 'FORTY CITIES · TWICE NIGHTLY', 0, 280, `600 22px ${DECO}`, INK);
    box(c, [[250, -330], [330, -330], [330, -250]], DARK, 0);
    for (const y of [-120, 40]) stroke(c, [[-330, y], [-100, y + 30], [330, y - 10]], 2, MID);
  }, -0.02);
}

//the rays a spinning newspaper lands on
function paperScene(c: Ctx) {
  box(c, rect(-50, -50, W + 100, H + 100), DEEP, 0);
  for (let i = 0; i < 24; i += 2) {
    const [a, b] = [(i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2];
    box(c, [[800, 380], [800 + Math.cos(a) * 1400, 380 + Math.sin(a) * 1400], [800 + Math.cos(b) * 1400, 380 + Math.sin(b) * 1400]], DARK, 0);
  }
}

const SHEET_W = 1000;
const SHEET_H = 660;
const HEADLINES: Record<string, [string, string]> = {
  stuck: ['MAGICIAN STUCK IN MIRROR', 'Wedged nine minutes. Crowd calls it his best act yet'],
  war: ['THE GREAT MIRROR WAR', 'Two magicians, one trick, forty cities'],
};

function sheetScene(c: Ctx, beat = 'stuck') {
  box(c, rect(8, 8, SHEET_W - 16, SHEET_H - 16), PAPER);
  words(c, 'The Daily Clarion', SHEET_W / 2, 96, `bold 72px ${SERIF}`, INK);
  stroke(c, [[40, 120], [SHEET_W - 40, 120]], 4);
  words(c, 'PITTSBURGH  ·  SUMMER, 1932  ·  TWO CENTS', SHEET_W / 2, 148, `600 18px ${DECO}`, DARK);
  stroke(c, [[40, 162], [SHEET_W - 40, 162]], 2);
  const [head, sub] = HEADLINES[beat];
  words(c, head, SHEET_W / 2, 232, `bold 66px ${SERIF}`, INK);
  words(c, sub, SHEET_W / 2, 276, `italic 26px ${SERIF}`, DARK);
  box(c, rect(40, 300, 420, 320), LIGHT, 3.5);
  for (let y = 310; y < 620; y += 18) for (const x of [500, 740]) stroke(c, [[x, y], [x + 120 + random() * 100, y]], 2, MID);
  c.save();
  c.beginPath();
  c.rect(40, 300, 420, 320);
  c.clip();
  if (beat === 'stuck') {
    at(c, 250, 640, 0.75, () => {
      mirrorProp(c);
      for (const d of [-1, 1]) {
        hose(c, [[16 * d, -200], [40 * d, -150], [70 * d, -130]], 20, DEEP);
        shoe(c, 80 * d, -128, d);
      }
    });
  } else {
    for (const [x, d] of [[140, 1], [360, -1]]) at(c, x, 620, 0.55, () => mirrorProp(c), d * 0.15);
    box(c, [[240, 380], [280, 440], [250, 450], [270, 520], [220, 440], [250, 430]], WHITE, 3);
  }
  c.restore();
}

function postcardScene(c: Ctx) {
  box(c, rect(-50, -50, W + 100, H + 100), MID, 0);
  for (let i = 0; i < 16; i++) stroke(c, [[-50, i * 60], [700, i * 60 + 20 * Math.sin(i)], [W + 50, i * 60]], 2.5, DARK);
  at(c, 470, 430, 1, () => {
    box(c, rect(-300, -190, 600, 380), WHITE);
    box(c, rect(-280, -170, 560, 220), LIGHT, 3);
    box(c, rect(-280, 50, 560, 100), MID, 3);
    box(c, [[-280, 30], [100, 30], [100, 50], [-280, 50]], DARK, 3);
    outline(c, ring(180, -40, 80, 80, 0, 20), 4);
    for (let i = 0; i < 6; i++) stroke(c, [[180, -40], [180 + Math.cos(i) * 80, -40 + Math.sin(i) * 80]], 2.5);
    words(c, 'GREETINGS FROM ATLANTIC CITY', 0, -120, `bold 28px ${DECO}`, INK);
  }, -0.12);
  at(c, 920, 360, 1, () => {
    box(c, rect(-340, -210, 680, 420), PAPER);
    stroke(c, [[40, -180], [40, 180]], 2.5, MID);
    box(c, rect(210, -180, 100, 120), WHITE, 3);
    topHat(c, 260, -86, 0, 0.5);
    outline(c, ring(180, -110, 62, 62), 3, DARK);
    words(c, 'ATLANTIC CITY', 180, -104, `bold 13px ${DECO}`, DARK);
    for (let k = 0; k < 3; k++) stroke(c, [[230, -40 + k * 14], [300, -46 + k * 14], [330, -38 + k * 14]], 2.5, DARK);
    for (let k = 0; k < 4; k++) stroke(c, [[80, 40 + k * 40], [310, 40 + k * 40]], 2, MID);
    words(c, 'No hard feelings,', -310, -90, `40px ${HAND}`, INK, 'left', -0.03);
    words(c, 'eh?', -300, -36, `40px ${HAND}`, INK, 'left', -0.03);
    words(c, 'Your pal,', -300, 70, `36px ${HAND}`, INK, 'left', -0.02);
    words(c, 'the Great M.', -260, 124, `bold 44px ${HAND}`, INK, 'left', -0.05);
    stroke(c, [[-270, 144], [-120, 152], [0, 130], [-60, 120]], 3);
  }, 0.05);
}

const PAINT: Record<SetId, (c: Ctx, beat?: string) => void> = {
  card: cardScene,
  stage: stageScene,
  notebook: notebookScene,
  greenroom: greenroomScene,
  wings: wingsScene,
  backstage: backstageScene,
  corridor: corridorScene,
  dressing: dressingScene,
  poster: posterScene,
  paper: paperScene,
  postcard: postcardScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//paintings are made once per beat and boil and kept, dropping the oldest past a limit
const paintings = new Map<string, HTMLCanvasElement>();
function painted(key: string, boil: number, w: number, h: number, paint: (c: Ctx) => void) {
  const id = `${key}:${boil}`;
  let el = paintings.get(id);
  if (!el) {
    const [saveRandom, saveWobble, saveTime] = [random, wobble, time];
    random = seeded(hash(key));
    wobble = seeded(hash(id));
    time = 0;
    let c: Ctx;
    [el, c] = canvas2d(w, h);
    paint(c);
    [random, wobble, time] = [saveRandom, saveWobble, saveTime];
    paintings.set(id, el);
    if (paintings.size > 30) paintings.delete(paintings.keys().next().value!);
  }
  return el;
}

// ---------------------------------------------------------------------------
// what moves on top of the sets
// ---------------------------------------------------------------------------

//the house, in silhouette along the bottom of the screen
function audience(c: Ctx, mood: 'still' | 'cheer' | 'sleep') {
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 14; i++) {
      const k = i + row * 20;
      const x = 40 + i * 118 + row * 58 + rand(k) * 24;
      const hop = mood === 'cheer' ? Math.abs(Math.sin(time * 7 + k * 1.7)) * 30 : 0;
      const y = 820 + row * 70 - hop;
      const fill = row ? INK : DEEP;
      if (mood === 'cheer' && rand(k + 5) > 0.5) for (const d of [-1, 1]) arm(c, [[x + 30 * d, y + 40], [x + 50 * d, y - 20], [x + 44 * d, y - 70]], fill, 12);
      blob(c, ring(x, y, 44, 50), fill, 0);
      if (rand(k + 9) > 0.55) bowler(c, x, y - 34, 0);
      else for (const d of [-1, 1]) blob(c, ring(x + 44 * d, y, 8, 12), fill, 0);
      if (mood === 'sleep' && rand(k + 3) > 0.7) {
        const up = (time * 0.6 + rand(k)) % 1;
        words(c, 'z', x + 30 + up * 30, y - 60 - up * 90, `bold ${20 + up * 20}px ${SERIF}`, LIGHT);
      }
    }
  }
}

//flowers thrown from the house, arcing onto the stage
function flowers(c: Ctx) {
  for (let i = 0; i < 6; i++) {
    const u = (time * 0.7 + rand(i)) % 1;
    const [x0, x1] = [200 + rand(i + 1) * 1200, 600 + rand(i + 2) * 400];
    const [x, y] = [x0 + (x1 - x0) * u, 800 - 700 * u + 600 * u * u];
    at(c, x, y, 1, () => {
      for (let k = 0; k < 5; k++) blob(c, ring(Math.cos(k * 1.26) * 10, Math.sin(k * 1.26) * 10, 9, 9, 0, 8), WHITE, 3);
      dot(c, 0, 0, 6, MID);
    }, u * 8);
  }
}

function footlights(c: Ctx) {
  for (let x = 200; x <= 1400; x += 100) glow(c, x, 664, 90, 0.22 + rand(Math.floor(time * FPS) + x) * 0.06);
}

function stageLive(c: Ctx, beat?: string) {
  footlights(c);
  if (!beat) audience(c, 'still');
  if (beat === 'you') {
    you(c, 760, 600, 0.85, 'cards');
    pip(c, 980, 432 - Math.abs(Math.sin(time * 2)) * 30, 0.55);
    magicHat(c, 980, 432, 1.1);
    audience(c, 'sleep');
  }
  if (beat === 'marvello') {
    glow(c, 640, 420, 260, 0.2);
    marvello(c, 640, 600, 0.8, 'present');
    audience(c, 'still');
  }
  if (beat === 'mirror') {
    c.save();
    curve(c, ring(430, 340, 78, 132), true);
    c.clip();
    for (let k = 0; k < 4; k++) {
      const r = ((time * 0.8 + k / 4) % 1) * 150;
      outline(c, ring(430, 340, r * 0.6, r, 0, 14), 4, WHITE);
    }
    c.restore();
    for (let i = 0; i < 6; i++) if (rand(Math.floor(time * FPS) + i * 31) > 0.5) star(c, 430 + (rand(i) - 0.5) * 240, 340 + (rand(i + 7) - 0.5) * 320, 10, WHITE);
    audience(c, 'still');
  }
  if (beat === 'painting') {
    marvello(c, 1060, 610, 0.8, 'bow');
    audience(c, 'still');
  }
  if (beat === 'ovation') {
    glow(c, 800, 420, 280, 0.2);
    marvello(c, 800, 600, 0.8, 'bow');
    flowers(c);
    audience(c, 'cheer');
  }
  if (beat === 'beside') {
    glow(c, 800, 420, 320, 0.2);
    you(c, 700, 600, 0.78, 'bow');
    marvello(c, 890, 600, 0.8, 'bow');
    audience(c, 'cheer');
  }
  if (beat === 'tell' || beat === 'band') {
    marvello(c, 1060, 600, 0.8, 'laugh');
    glow(c, 780, 480, 240, 0.2);
    you(c, 780, 704, 0.95, 'point');
    audience(c, 'still');
  }
  if (beat === 'band') {
    const slide = Math.abs(Math.sin(time * 4)) * 90;
    box(c, rect(1180 - slide, 700, 260, 14), MID, 4);
    blob(c, ring(1460, 700, 40, 46, 0.4), MID);
    for (let i = 0; i < 6; i++) {
      const u = (time * 0.5 + i / 6) % 1;
      note(c, 1200 + (rand(i) - 0.5) * 900 + Math.sin(u * 9 + i) * 30, 720 - u * 500);
    }
  }
}

function wingsLive(c: Ctx, beat?: string) {
  glow(c, 525, 202, 90, beat === 'spot' ? 0.45 : 0.15);
  const pose: MarvelloPose = beat === 'ovation' || beat === 'dark' ? 'bow' : 'present';
  marvello(c, 1260, 566, 0.5, pose);
  if (beat === 'ovation') for (let i = 0; i < 3; i++) {
    const u = (time * 0.7 + i / 3) % 1;
    blob(c, ring(1100 + i * 140 + u * 80, 300 + 300 * u * u - 200 * u, 10, 10, 0, 8), WHITE, 3);
  }
  const yours: Record<string, YouPose> = { ovation: 'glum', spot: 'shock', dark: 'shadow' };
  you(c, 420, 720, 1, yours[beat ?? ''] ?? 'stand');
  if (beat === 'spot') {
    c.save();
    c.fillStyle = 'rgba(255,246,222,0.2)';
    c.beginPath();
    [[1520, -50], [1620, -50], [600, 760], [240, 760]].forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.fill();
    c.restore();
    glow(c, 420, 520, 300, 0.35);
  }
}

function hangingBulb(c: Ctx, x: number) {
  const a = Math.sin(time * 1.6) * 0.08;
  const [bx, by] = [x + Math.sin(a) * 200, Math.cos(a) * 200];
  stroke(c, [[x, -50], [bx, by]], 3);
  glow(c, bx, by + 14, 200, 0.3);
  blob(c, ring(bx, by + 14, 14, 18, 0, 10), WHITE, 3.5);
}

function backstageLive(c: Ctx, beat?: string) {
  hangingBulb(c, 880);
  seal(c, 1290, 690);
  if (!beat) {
    dancers(c, 640, 640, 0.6);
    marvello(c, 1000, 640, 0.55, 'grin');
    fitch(c, 1120, 640, 0.6);
    you(c, 300, 760, 0.95, 'glum');
  }
  if (beat === 'fitch') {
    you(c, 300, 760, 0.95, 'glum');
    fitch(c, 880, 740, 1);
    marvello(c, 1120, 740, 0.85, 'grin');
  }
  if (beat === 'dot') {
    marvello(c, 1050, 660, 0.65, 'grin');
    fitch(c, 920, 660, 0.7);
    you(c, 380, 760, 0.95, 'glum');
    dotHand(c, 600, 760, 0.95, true);
  }
  if (beat === 'laugh') {
    you(c, 380, 760, 0.95, 'shock');
    fitch(c, 680, 760, 1, true);
    marvello(c, 1080, 740, 0.85, 'laugh');
  }
  //cigar smoke
  if (beat === 'fitch') {
    const [x, y] = [944, 516];
    for (let i = 0; i < 4; i++) {
      const u = (time * 0.4 + i / 4) % 1;
      c.save();
      c.globalAlpha = 0.6 * (1 - u);
      blob(c, ring(x + Math.sin(u * 6 + i) * 20, y - u * 200, 14 + u * 30, 12 + u * 24, 0, 10), LIGHT, 0);
      c.restore();
    }
  }
}

function corridorLive(c: Ctx, beat?: string) {
  for (const [x, y] of LAMPS) glow(c, x, y + 30, 140, 0.25);
  if (beat === 'empty') {
    for (let i = 0; i < 5; i++) {
      const u = (time * 0.3 + i / 5) % 1;
      note(c, 1000 - u * 220 + Math.sin(u * 12) * 20, 520 - u * 160);
    }
  } else marvello(c, 900, 740, 1, beat === 'shrug' ? 'shrug' : 'grin');
  you(c, 320, 860, 1.15, 'glum');
}

function dressingLive(c: Ctx, beat: string | undefined, since: number) {
  for (const [x, y] of BULBS) glow(c, x, y, 50, 0.4 + rand(Math.floor(time * FPS) + x) * 0.1);
  const a = time * 0.1;
  stroke(c, [[1000, 170], [1000 + Math.sin(a) * 40, 170 - Math.cos(a) * 40]], 5);
  stroke(c, [[1000, 170], [1000 + Math.sin(a / 12) * 26, 170 - Math.cos(a / 12) * 26]], 7);
  pip(c, 470, 470, 0.6);
  if (!beat) you(c, 640, 740, 1, 'stand');
  if (beat === 'knock') {
    const rattle = since < 1.6 && Math.floor(time * FPS) % 2 ? 6 : 0;
    door(c, rattle);
    if (since < 1.6) words(c, 'KNOCK!', 1260 + rattle * 2, 160, `bold ${54 + rattle * 3}px ${DECO}`, INK, 'center', -0.1);
    you(c, 640, 740, 1, 'shock');
  }
  if (beat === 'door') {
    marvello(c, 1265, 705, 0.85, 'hat');
    you(c, 700, 740, 1, 'stand');
  }
  if (beat === 'thanks') {
    marvello(c, 1180, 730, 0.9, 'thanks');
    you(c, 860, 740, 1, 'shake', false);
    const u = Math.min(1, since / 1.2);
    bowler(c, 860 + u * 140, 420 - Math.sin(u * Math.PI) * 280 + u * 180, u * 9);
  }
}

function paperLive(c: Ctx, beat: string | undefined, since: number, boil: number) {
  const u = Math.min(1, since / 1.1);
  const sheet = painted(`sheet:${beat}`, boil, SHEET_W, SHEET_H, (p) => sheetScene(p, beat));
  at(c, 800, 380, 0.02 + u * 0.98, () => c.drawImage(sheet, -SHEET_W / 2, -SHEET_H / 2), (1 - u) * Math.PI * 6 - 0.05);
}

//the soft-edged cloud a memory is framed in
function memory(c: Ctx) {
  c.save();
  c.beginPath();
  c.rect(-50, -50, W + 100, H + 100);
  curve(c, shake(Array.from({ length: 30 }, (_, i): Pt => {
    const a = (i / 30) * Math.PI * 2;
    const k = i % 2 ? 1 : 1.06;
    return [800 + Math.cos(a) * 740 * k, 390 + Math.sin(a) * 430 * k];
  })), true);
  c.fillStyle = BLACK;
  c.fill('evenodd');
  c.restore();
}

function live(c: Ctx, cue: Cue, since: number, boil: number) {
  const { set, beat } = cue;
  if (set === 'card') {
    if (beat === 'end') pip(c, 1080, 560, 1.1, true);
    else {
      pip(c, 800, 600 - 40 - Math.abs(Math.sin(time * 3)) * 40, 1.1);
      magicHat(c, 800, 600, 1.5);
      for (let i = 0; i < 5; i++) if (rand(Math.floor(time * 4) + i * 13) > 0.4) star(c, 620 + rand(i) * 360, 440 + rand(i + 3) * 120, 12, WHITE);
    }
  }
  if (set === 'stage') stageLive(c, beat);
  if (set === 'greenroom') {
    for (const x of [640, 980]) for (let i = 0; i < 3; i++) {
      const u = (time * 0.5 + i / 3) % 1;
      stroke(c, [[x - 6 + i * 6, 490 - u * 80], [x + 6 + Math.sin(u * 8) * 10, 470 - u * 80], [x + i * 6, 450 - u * 80]], 3, WHITE);
    }
    you(c, 420, 700, 0.95, 'stand');
    marvello(c, 1170, 700, 0.85, 'grin');
    memory(c);
  }
  if (set === 'wings') wingsLive(c, beat);
  if (set === 'backstage') backstageLive(c, beat);
  if (set === 'corridor') corridorLive(c, beat);
  if (set === 'dressing') dressingLive(c, beat, since);
  if (set === 'paper') paperLive(c, beat, since, boil);
}

// ---------------------------------------------------------------------------
// the film: flicker, dust, scratches and the vignette
// ---------------------------------------------------------------------------

let vignette: HTMLCanvasElement | undefined;
function makeVignette() {
  const [el, c] = canvas2d(W, H);
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, 'rgba(13,10,8,0)');
  g.addColorStop(1, 'rgba(13,10,8,0.75)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  return el;
}

function film(c: Ctx, t: number) {
  const f = Math.floor(t * FPS);
  c.fillStyle = `rgba(20,14,8,${0.04 + rand(f) * 0.08})`;
  c.fillRect(-50, -50, W + 100, H + 100);
  for (let i = 0; i < 50; i++) {
    const k = f * 97 + i;
    c.globalAlpha = 0.5;
    dot(c, rand(k) * W, rand(k + 1) * H, 0.8 + rand(k + 2) * 2.6, rand(k + 3) > 0.5 ? INK : WHITE);
  }
  if (rand(f * 13) > 0.85) {
    const [x, y] = [rand(f + 4) * W, rand(f + 5) * H];
    c.beginPath();
    c.moveTo(x, y);
    c.bezierCurveTo(x + 30, y - 40, x - 20, y - 60, x + 10, y - 110);
    ink(c, 1.5);
  }
  for (let i = 0; i < 2; i++) {
    if (rand(Math.floor(t * 3) + i * 11) < 0.4) continue;
    c.globalAlpha = 0.25;
    c.fillStyle = PAPER;
    c.fillRect(rand(i + 50) * W + Math.sin(t * 0.7 + i * 3) * 120, -50, 1.5, H + 100);
  }
  c.globalAlpha = 1;
  c.drawImage((vignette ??= makeVignette()), 0, 0);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  walla: new URL('./sounds/walla.m4a', import.meta.url).href,
  backstage: new URL('./sounds/backstage.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  clock: new URL('./sounds/clock.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'stage') return { walla: beat ? 0.25 : 0.6 };
  if (set === 'wings') return { walla: 0.3, room: 0.3 };
  if (set === 'backstage') return { backstage: 0.7 };
  if (set === 'corridor') return { room: 0.6, backstage: 0.15 };
  if (set === 'card') return {};
  if (set === 'poster' || set === 'paper') return { room: 0.25 };
  return { room: 0.45, clock: 0.3 };
}

const HARP = new URL('./sounds/harp.m4a', import.meta.url).href;
const APPLAUSE = new URL('./sounds/applause.m4a', import.meta.url).href;
const BOING = new URL('./sounds/boing.m4a', import.meta.url).href;
const POP = new URL('./sounds/pop.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  title_card: { src: HARP, volume: 0.5, delay: 0.3 },
  your_act: { src: new URL('./sounds/cards.m4a', import.meta.url).href, volume: 0.8, delay: 0.4 },
  mirror: { src: HARP, volume: 0.7 },
  painting: { src: POP, volume: 0.8, delay: 0.2 },
  ovation: { src: APPLAUSE, volume: 0.8 },
  wings_ovation: { src: APPLAUSE, volume: 0.45 },
  spotlight: { src: BOING, volume: 0.6 },
  wings_dark: { src: new URL('./sounds/flop.m4a', import.meta.url).href, volume: 0.6 },
  bow_tell_band: { src: BOING, volume: 0.6 },
  dressing_room: { src: new URL('./sounds/chime.m4a', import.meta.url).href, volume: 0.45, delay: 0.5 },
  knock: { src: new URL('./sounds/knock.m4a', import.meta.url).href, volume: 0.9 },
  doorway_thanks: { src: BOING, volume: 0.6, delay: 0.2 },
  paper_stuck: { src: new URL('./sounds/stuck.m4a', import.meta.url).href, volume: 0.7, delay: 1.1 },
  paper_war: { src: POP, volume: 0.8, delay: 1.1 },
  the_end: { src: HARP, volume: 0.5, delay: 0.5 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function VanishingAct({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Vanishing Act has no cue for the animation "${animation}"`);
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
      const t = now / 1000;
      const cel = Math.floor(t * FPS);
      time = cel / FPS;
      const boil = Math.floor(t * BOIL_FPS) % BOILS;
      const since = (now - at) / 1000;

      //scaled to cover the screen, keeping the cue's focus in frame, and weaving a little in the gate
      const k = Math.max(sw / W, sh / H);
      const [wx, wy] = [(rand(cel) - 0.5) * 3, (rand(cel + 7) - 0.5) * 3];
      const view = (q: Cue) => {
        const ox = Math.min(0, Math.max(sw - W * k, sw / 2 - (q.x ?? W / 2) * k));
        c.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ox + wx * k), dpr * ((sh - H * k) / 2 + wy * k));
      };
      const draw = (q: Cue, shownFor: number) => {
        c.drawImage(painted(`${q.set}:${q.beat ?? ''}`, boil, W, H, (p) => PAINT[q.set](p, q.beat)), 0, 0);
        wobble = seeded(boil * 7919 + 13);
        live(c, q, shownFor, boil);
      };

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = BLACK;
      c.fillRect(0, 0, el.width, el.height);
      const iris = prev.set !== cue.set && since < IRIS;
      const closing = iris && since < IRIS / 2;
      const q = closing ? prev : cue;
      view(q);
      if (iris) {
        const r = closing ? 1 - ease(since / (IRIS / 2)) : ease((since - IRIS / 2) / (IRIS / 2));
        c.save();
        c.beginPath();
        c.arc(W / 2, H * 0.42, Math.max(0.01, r * 1000), 0, Math.PI * 2);
        c.clip();
        draw(q, closing ? since + 60 : since - IRIS / 2);
        c.restore();
      } else draw(q, prev.set !== cue.set ? since - IRIS / 2 : since);
      film(c, t);
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
    sound.current?.mix(mixFor(cues[active]));
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
    background: BLACK,
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
};

export default VanishingAct;
