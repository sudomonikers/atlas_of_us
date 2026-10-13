import { useEffect, useRef, useState, type CSSProperties } from 'react';

// The Archive is painted on a 2D canvas in an opaque gouache style: every shape is a flat base coat
// covered in short chunky brush strokes of slightly different tones, with a broken dry-brush edge.
// Paintings are made once per set and beat and kept. The sky is painted live underneath them, through the
// dome's slit and above the hill, so it can lighten toward dawn as the scenario's clock runs down.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const INK = '#26304e';
const SET_FADE = 0.9; //seconds to crossfade between paintings
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'hill' | 'dome' | 'desk' | 'letter' | 'sketchbook' | 'orrery' | 'plates';

interface Cue {
  set: SetId;
  beat?: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'hill', card: ['The Archive', 'The Night Observatory'] },
  hill_wide: { set: 'hill' },
  hill_door: { set: 'hill', beat: 'door' },
  dome_wide: { set: 'dome' },
  crates_labelled: { set: 'dome', beat: 'labelled' },
  crates_filling: { set: 'dome', beat: 'filling' },
  crates_done: { set: 'dome', beat: 'done' },
  letter_found: { set: 'desk', beat: 'letter' },
  letter_open: { set: 'letter' },
  sketchbook_closed: { set: 'desk', beat: 'sketchbook' },
  sketchbook_open: { set: 'sketchbook' },
  sketch_lantern: { set: 'sketchbook' },
  sketch_heron: { set: 'sketchbook', beat: 'heron' },
  sketch_chairs: { set: 'sketchbook', beat: 'chairs' },
  sketch_comet: { set: 'sketchbook', beat: 'comet' },
  orrery: { set: 'orrery' },
  orrery_close: { set: 'orrery', beat: 'dials' },
  orrery_comet: { set: 'orrery', beat: 'comet' },
  plates: { set: 'plates' },
  dawn_done: { set: 'dome', beat: 'grey' },
  dawn_late: { set: 'dome', beat: 'late' },
  dawn_hale: { set: 'dome', beat: 'hale' },
  dawn_dome: { set: 'dome', beat: 'sunrise' },
  hill_dawn: { set: 'hill', beat: 'dawn' },
};
const FIRST_CUE = 'title_card';

//how far toward sunrise each beat's sky is, 0 to 1, before the clock has a say
const DAWN: Record<string, number> = { grey: 0.62, late: 1, hale: 1, sunrise: 1, dawn: 1 };
const dawnOf = (cue: Cue) => DAWN[cue.beat ?? ''] ?? 0;

// ---------------------------------------------------------------------------
// shapes
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

//a fixed per-index random for the live layer
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const toRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, u: number) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * u).toString(16).padStart(2, '0')).join('');
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

const densify = (points: Pt[], step = 30): Pt[] =>
  points.flatMap(([ax, ay], i) => {
    const [bx, by] = points[(i + 1) % points.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    return Array.from({ length: n }, (_, k): Pt => [ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  });

const arc = (x: number, y: number, rx: number, ry: number, from: number, to: number, n = 16): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
  });

const bend = ([ax, ay]: Pt, [bx, by]: Pt, [cx, cy]: Pt, n = 10): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
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

//a rolling horizon by midpoint displacement, closed down to the bottom
function ridge(x0: number, x1: number, y: number, height: number, rough: number, bottom = H + 20): Pt[] {
  let points: Pt[] = [[x0, y - random() * height], [x1, y - random() * height]];
  for (let d = 0, amp = height; d < 6; d++, amp *= rough) {
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

function deform(points: Pt[], spread: number): Pt[] {
  return points.flatMap(([ax, ay], i): Pt[] => {
    const [bx, by] = points[(i + 1) % points.length];
    const len = Math.hypot(bx - ax, by - ay) * spread;
    return [[ax, ay], [(ax + bx) / 2 + gauss() * len, (ay + by) / 2 + gauss() * len]];
  });
}

const trace = (c: Ctx, points: Pt[]) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

// ---------------------------------------------------------------------------
// gouache
// ---------------------------------------------------------------------------

//one brush stroke: a flat-ended dab, a little ragged at the tail
function dab(c: Ctx, x: number, y: number, len: number, wide: number, turn: number, color: string, alpha: number) {
  const [dx, dy] = [(Math.cos(turn) * len) / 2, (Math.sin(turn) * len) / 2];
  const [nx, ny] = [(-Math.sin(turn) * wide) / 2, (Math.cos(turn) * wide) / 2];
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - dx * 0.8 + nx, y - dy * 0.8 + ny);
  c.lineTo(x + dx * 0.85 + nx, y + dy * 0.85 + ny);
  c.lineTo(x + dx, y + dy);
  c.lineTo(x + dx * 0.9 - nx * 0.9, y + dy * 0.9 - ny * 0.9);
  c.lineTo(x - dx * 0.75 - nx * 0.8, y - dy * 0.75 - ny * 0.8);
  c.lineTo(x - dx, y - dy + ny * 0.3);
  c.closePath();
  c.fill();
}

//a slightly lighter or darker, warmer or cooler take on a color, for the strokes over a base coat
const tone = ([r, g, b]: [number, number, number], vary: number) => {
  const k = (random() - 0.5) * 2 * vary;
  const warm = gauss() * vary * 40;
  const to = k > 0 ? 255 : 0;
  const f = Math.abs(k);
  return `rgb(${r + (to - r) * f + warm | 0},${g + (to - g) * f | 0},${b + (to - b) * f - warm | 0})`;
};

interface Stroke {
  size?: number; //how long the strokes are
  turn?: number; //which way they mostly run
  vary?: number; //how much their tone wanders from the base
  edge?: boolean; //a broken dry-brush outline
}

//the core of the look: a flat opaque coat, then strokes over it clipped to the shape, then a ragged edge
function paint(c: Ctx, points: Pt[], color: string, { size = 24, turn = -0.3, vary = 0.07, edge = true }: Stroke = {}) {
  const shape = deform(densify(points, 26), 0.06);
  const rgb = toRgb(color);
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  c.save();
  c.globalAlpha = 1;
  c.fillStyle = color;
  trace(c, shape);
  c.fill();
  c.clip();
  const n = Math.min(1800, (((x1 - x0) * (y1 - y0)) / (size * size)) * 1.4);
  for (let i = 0; i < n; i++) {
    const len = size * (0.7 + random() * 0.9);
    dab(c, x0 + random() * (x1 - x0), y0 + random() * (y1 - y0), len, len * (0.3 + random() * 0.2), turn + gauss() * 0.3, tone(rgb, vary), 0.45 + random() * 0.45);
  }
  c.restore();
  if (edge) {
    c.save();
    for (let i = 0; i < shape.length; i += 2) {
      const [[ax, ay], [bx, by]] = [shape[i], shape[(i + 1) % shape.length]];
      dab(c, ax, ay, size * 0.5, size * 0.16, Math.atan2(by - ay, bx - ax), tone(rgb, vary), 0.7);
    }
    c.restore();
  }
}

//a few loose strokes in a line, for wood grain, seams and the like
const line = (c: Ctx, points: Pt[], width: number, color: string, alpha = 0.85) => {
  c.save();
  c.globalAlpha *= alpha;
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

const dot = (c: Ctx, x: number, y: number, r: number, color: string, alpha = 1) => {
  c.save();
  c.globalAlpha *= alpha;
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

//words written by hand on paper or chalked on wood
function write(c: Ctx, text: string, x: number, y: number, size: number, color: string, turn = 0, font = 'italic', align: CanvasTextAlign = 'left') {
  c.save();
  c.translate(x, y);
  c.rotate(turn);
  c.font = `${font} ${size}px Georgia, "Times New Roman", serif`;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.restore();
}

// ---------------------------------------------------------------------------
// the sky, painted live under the hill and the dome
// ---------------------------------------------------------------------------

const NIGHT = ['#10153a', '#151b46', '#1b2352', '#222c5e', '#2b376b', '#354277', '#3f4c80'];
const TWILIGHT = ['#232a5e', '#34397a', '#4d4a8e', '#6c5a9c', '#8e6aa0', '#b07a9e', '#cc8e98'];
const SUNRISE = ['#5b78b4', '#7f92c4', '#a8a8c8', '#d4b4b4', '#eec0a0', '#f6cf96', '#fadfa0'];
const HORIZON = 700;

//every band gets its own wobbly lower edge, fixed so it doesn't crawl
const BANDS = NIGHT.map((_, i) => {
  const y = ((i + 1) * HORIZON) / NIGHT.length;
  return [...Array.from({ length: 33 }, (_, k): Pt => [-50 + k * 53, y + (rand(i * 40 + k) - 0.5) * 26]), [W + 50, -50], [-50, -50]] as Pt[];
});

let skyTexture: HTMLCanvasElement | undefined;
const texture = () => {
  if (!skyTexture) {
    random = seeded(99);
    const [el, c] = canvas2d(W, HORIZON + 40);
    for (let i = 0; i < 1600; i++) {
      const len = 30 + random() * 50;
      dab(c, random() * W, random() * (HORIZON + 40), len, len * 0.35, -0.25 + gauss() * 0.2, random() > 0.5 ? '#ffffff' : '#000000', 0.03 + random() * 0.04);
    }
    skyTexture = el;
  }
  return skyTexture;
};

function sky(c: Ctx, dawn: number, t: number, moon: boolean) {
  const [from, to, u]: [string[], string[], number] = dawn < 0.5 ? [NIGHT, TWILIGHT, dawn * 2] : [TWILIGHT, SUNRISE, dawn * 2 - 1];
  c.fillStyle = mix(from[0], to[0], u);
  c.fillRect(0, 0, W, H);
  //drawn bottom up, so each band's wobbly edge laps over the one below
  for (let i = BANDS.length - 1; i >= 0; i--) {
    c.fillStyle = mix(from[i], to[i], u);
    trace(c, BANDS[i]);
    c.fill();
  }
  c.drawImage(texture(), 0, 0);
  if (dawn > 0.45) glow(c, 1100, HORIZON, 520, '255,200,140', (dawn - 0.45) * 0.7);
  const shine = Math.max(0, 1 - dawn * 1.5);
  if (moon && shine > 0) {
    glow(c, 430, 170, 150, '230,230,255', 0.18 * shine);
    dot(c, 430, 170, 44, '#f3ecd6', shine);
    dot(c, 418, 160, 9, '#d9d0bc', shine * 0.7);
    dot(c, 444, 186, 6, '#d9d0bc', shine * 0.6);
  }
  for (let i = 0; i < 170; i++) {
    const a = shine * (0.55 + 0.45 * Math.sin(t * (1 + rand(i + 2) * 2) + i));
    if (a <= 0.02) continue;
    const [x, y, r] = [rand(i) * W, rand(i + 500) * (HORIZON - 80), 0.8 + rand(i + 900) * 2.2];
    dot(c, x, y, r, '#f6efd8', a);
    if (r > 2.6) {
      line(c, [[x - r * 3, y], [x + r * 3, y]], 1, '#f6efd8', a * 0.6);
      line(c, [[x, y - r * 3], [x, y + r * 3]], 1, '#f6efd8', a * 0.6);
    }
  }
}

// ---------------------------------------------------------------------------
// people, only ever small
// ---------------------------------------------------------------------------

//Mr. Hale in his coat and hat, holding a torch at night
function hale(c: Ctx, x: number, y: number, s: number, torch: boolean) {
  if (torch) {
    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = '#ffe2a0';
    trace(c, [[x + 22 * s, y - 70 * s], [x + 140 * s, y + 4 * s], [x + 30 * s, y + 14 * s]]);
    c.fill();
    c.restore();
  }
  paint(c, [[x - 24 * s, y], [x - 18 * s, y - 80 * s], [x - 10 * s, y - 92 * s], [x + 10 * s, y - 92 * s], [x + 18 * s, y - 80 * s], [x + 24 * s, y]], '#3d3442', { size: 8 * s });
  paint(c, limb([[x + 14 * s, y - 84 * s], [x + 22 * s, y - 64 * s], [x + 26 * s, y - 70 * s]], 9 * s), '#3d3442', { size: 6 * s });
  if (torch) dot(c, x + 28 * s, y - 70 * s, 4 * s, '#fff4c8');
  paint(c, ellipse(x, y - 104 * s, 11 * s, 13 * s), '#d9b394', { size: 5 * s, edge: false });
  paint(c, ellipse(x, y - 114 * s, 19 * s, 4 * s), '#2a2430', { size: 5 * s });
  paint(c, rect(x - 11 * s, y - 128 * s, 22 * s, 14 * s), '#2a2430', { size: 5 * s });
}

//you, walking away down the hill with a box under your arm
function walker(c: Ctx, x: number, y: number, s: number) {
  paint(c, [[x - 14 * s, y], [x - 12 * s, y - 60 * s], [x + 12 * s, y - 60 * s], [x + 14 * s, y]], '#5a4a5e', { size: 6 * s });
  paint(c, ellipse(x, y - 70 * s, 9 * s, 10 * s), '#3a2c2c', { size: 4 * s });
  paint(c, rect(x + 6 * s, y - 50 * s, 22 * s, 18 * s), '#b48a58', { size: 5 * s });
}

// ---------------------------------------------------------------------------
// paintings, made once per set and beat
// ---------------------------------------------------------------------------

function hillScene(c: Ctx, beat?: string) {
  const day = beat === 'dawn';
  const [near, far, farther] = day ? ['#4c5a56', '#56607a', '#6a6f8e'] : ['#1e2c44', '#1a2142', '#222a52'];
  paint(c, ridge(-50, W + 50, 610, 50, 0.5), farther, { size: 34, turn: 0 });
  paint(c, ridge(-50, W + 50, 650, 40, 0.5), far, { size: 34, turn: 0 });
  //the town in the valley
  if (!day)
    for (let i = 0; i < 70; i++) {
      const [x, y] = [120 + random() * 700, 650 + random() * 80];
      glow(c, x, y, 10, '255,200,120', 0.4);
      dot(c, x, y, 1.6, '#ffd890');
    }
  paint(c, [[-50, H + 20], [-50, 770], [300, 700], [600, 610], [850, 548], [1100, 536], [1350, 566], [W + 50, 630], [W + 50, H + 20]], near, { size: 30, turn: -0.1 });
  for (let i = 0; i < 60; i++) {
    const [x, y] = [random() * W, 600 + random() * 300];
    dab(c, x, y, 40, 12, -0.15, day ? '#62705e' : '#2b3c58', 0.5);
  }
  c.globalAlpha = 1;
  //cypress trees either side of the observatory
  for (const [x, h] of [[845, 150], [878, 110], [1225, 170], [1260, 120]])
    paint(c, [[x, 560 - h], [x + 18, 560 - h * 0.6], [x + 22, 560], [x - 22, 560], [x - 18, 560 - h * 0.6]], day ? '#2e3e38' : '#121a2e', { size: 12, turn: -1.5 });
  //the observatory: a drum with a dome on top
  const [drum, drumShade, dome, domeShade] = day ? ['#ead6b6', '#c9ae98', '#b8b0b8', '#958ca0'] : ['#c9bea8', '#9a9090', '#8e9bb0', '#67728c'];
  paint(c, rect(930, 400, 240, 145), drum, { size: 14, turn: -1.5 });
  paint(c, rect(1110, 400, 60, 145), drumShade, { size: 12, turn: -1.5 });
  paint(c, [...arc(1050, 404, 138, 128, Math.PI, Math.PI * 2, 24)], dome, { size: 16, turn: -0.6 });
  paint(c, [...arc(1050, 404, 138, 128, Math.PI * 1.62, Math.PI * 2, 12), [1050 + 40, 404]], domeShade, { size: 14, turn: -0.6 });
  for (const k of [-0.6, -0.3, 0.3, 0.6]) line(c, bend([1050 + k * 138, 404], [1050 + k * 120, 300], [1050 + k * 30, 278]), 2, '#4e5670', 0.5);
  paint(c, limb([[1046, 282], [1048, 340], [1050, 400]], 24), '#1b1e38', { size: 8, turn: -1.5 });
  paint(c, rect(915, 396, 270, 12), '#5a4a42', { size: 10, turn: 0 });
  //a door spilling lamplight, and one round window
  paint(c, rect(962, 456, 50, 88), day ? '#5a4638' : '#f2c16c', { size: 10, turn: -1.5 });
  paint(c, ellipse(1118, 452, 15, 15), day ? '#7a8496' : '#f6cd78', { size: 6 });
  if (!day) {
    glow(c, 987, 560, 140, '255,190,110', 0.35);
    glow(c, 1118, 452, 50, '255,200,120', 0.3);
  }
  //the path down the hill
  paint(c, limb([[987, 548], [900, 592], [760, 642], [620, 720], [520, 800], [430, 920]], 20, 120), day ? '#a89a8e' : '#3c4664', { size: 20, turn: 0.5 });
  for (let i = 0; i < 160; i++) {
    const x = random() * W;
    const y = 830 + random() * 80;
    dab(c, x, y, 30 + random() * 30, 6, -1.3 + gauss() * 0.3, day ? '#3a4a3a' : '#0f1626', 0.8);
  }
  c.globalAlpha = 1;
  if (beat === 'door') hale(c, 925, 552, 0.9, true);
  if (day) walker(c, 560, 770, 1.1);
}

//every set has the observatory's things in it, lit by the lamp at night and the sun at dawn
const DOME_BEATS: Record<string, { crates: 'empty' | 'labelled' | 'filling' | 'done'; light: number; hale?: boolean }> = {
  '': { crates: 'empty', light: 0 },
  labelled: { crates: 'labelled', light: 0 },
  filling: { crates: 'filling', light: 0 },
  done: { crates: 'done', light: 0 },
  grey: { crates: 'done', light: 0.45 },
  late: { crates: 'filling', light: 1 },
  hale: { crates: 'done', light: 1, hale: true },
  sunrise: { crates: 'done', light: 1 },
};

const SPINES = ['#7a3b2e', '#2f4a5e', '#8a6a3a', '#3e5a40', '#6b4a6a', '#a8875a', '#5a2f3a'];

function shelves(c: Ctx, x0: number, x1: number, rows: number[], full: number, lit: (hex: string) => string) {
  paint(c, rect(x0 - 14, rows[0] - 70, x1 - x0 + 28, rows[rows.length - 1] - rows[0] + 90), lit('#3e2c24'), { size: 18 });
  for (const y of rows) {
    for (let x = x0; x < x1 - 12; ) {
      const w = 12 + random() * 9;
      if (random() < full) {
        const h = 42 + random() * 18;
        paint(c, rect(x, y - h, w - 2, h), lit(SPINES[Math.floor(random() * SPINES.length)]), { size: 6, turn: -1.5, edge: false });
        line(c, [[x + 3, y - h + 8], [x + w - 5, y - h + 8]], 2, lit('#d8b870'), 0.5);
      }
      x += w;
    }
    paint(c, rect(x0 - 14, y, x1 - x0 + 28, 10), lit('#5c4232'), { size: 12, turn: 0 });
  }
}

function crate(c: Ctx, x: number, y: number, w: number, h: number, state: string, label: string, lit: (hex: string) => string) {
  const d = h * 0.32;
  paint(c, [[x, y], [x + w, y], [x + w + d * 0.6, y - d], [x + d * 0.6, y - d]], lit(state === 'done' ? '#c09062' : '#2a1e18'), { size: 10, turn: 0 });
  if (state === 'filling')
    for (let i = 0; i < 9; i++) paint(c, rect(x + 10 + i * ((w - 20) / 9), y - d * 0.7 - random() * 18, (w - 30) / 9, d + 18), lit(SPINES[i % SPINES.length]), { size: 6, turn: -1.5, edge: false });
  paint(c, rect(x, y, w, h), lit('#a27a4e'), { size: 14, turn: 0 });
  paint(c, [[x + w, y], [x + w + d * 0.6, y - d], [x + w + d * 0.6, y + h - d], [x + w, y + h]], lit('#7a5838'), { size: 10, turn: -1.5 });
  for (let k = 1; k < 3; k++) line(c, [[x + 4, y + (h * k) / 3], [x + w - 4, y + (h * k) / 3]], 2, lit('#5c3e26'), 0.7);
  if (state === 'done') for (const k of [0.1, 0.9]) line(c, [[x + w * k + d * 0.3, y - d * 0.5 - 2], [x + w * k + d * 0.3 + 1, y - d * 0.5 + 2]], 3, '#2a2420', 0.8);
  if (state !== 'empty') {
    write(c, label, x + w / 2, y + h * 0.62, h * 0.3, 'rgba(250,246,236,0.9)', -0.03, 'bold', 'center');
    write(c, label, x + w / 2 + 1, y + h * 0.62 + 1, h * 0.3, 'rgba(250,246,236,0.35)', -0.03, 'bold', 'center');
  }
}

function domeScene(c: Ctx, beat?: string) {
  const { crates, light, hale: atDoor } = DOME_BEATS[beat ?? ''];
  const lit = (hex: string) => mix(hex, mix(hex, '#ffd8a8', 0.55), light);

  //the inside of the dome, ribs curving up to the slit
  paint(c, rect(-50, -50, W + 100, 540), lit('#2b2947'), { size: 40, turn: -0.9 });
  for (const k of [-4, -3, -2, -1, 1, 2, 3, 4])
    paint(c, limb(bend([800 + k * 210, 470], [800 + k * 170, 160], [800 + k * 36, -60]), 20, 12), lit('#1f1e36'), { size: 12, turn: -1.4 });
  //cut the slit out, so the live sky shows through it
  c.globalCompositeOperation = 'destination-out';
  trace(c, deform(densify([[706, -60], [894, -60], [878, 446], [722, 446]], 40), 0.04));
  c.fill();
  c.globalCompositeOperation = 'source-over';
  for (const side of [-1, 1]) paint(c, limb([[800 + side * 96, -60], [800 + side * 80, 446]], 22), lit('#4f3d33'), { size: 12, turn: -1.5 });

  //the base ring, the round wall and the shelves on it
  paint(c, rect(-50, 440, W + 100, 46), lit('#5a4334'), { size: 20, turn: 0 });
  for (let x = 20; x < W; x += 60) dot(c, x, 462, 3, '#2a1f1a', 0.8);
  paint(c, rect(-50, 486, W + 100, 260), lit('#352c48'), { size: 32, turn: -0.2 });
  const full = { empty: 0.95, labelled: 0.95, filling: 0.5, done: 0.12 }[crates];
  shelves(c, 190, 590, [570, 640, 712], full, lit);
  shelves(c, 1030, 1220, [570, 640, 712], full * 0.8, lit);

  //the door, open to the morning when Mr. Hale is back
  paint(c, rect(1262, 500, 130, 238), atDoor ? '#fbe6bc' : lit('#4b382e'), { size: 14, turn: -1.5 });
  if (atDoor) {
    hale(c, 1326, 738, 1.6, false);
    c.save();
    c.globalAlpha = 0.25;
    c.fillStyle = '#ffe2b0';
    trace(c, [[1262, 738], [1392, 738], [1300, 900], [1010, 900]]);
    c.fill();
    c.restore();
  } else for (const y of [520, 630]) paint(c, rect(1282, y, 90, 90), lit('#5a4436'), { size: 10, turn: -1.5, edge: false });

  //the floor, planks running toward the telescope
  paint(c, rect(-50, 738, W + 100, 220), lit('#3e3040'), { size: 34, turn: 0 });
  for (let k = -9; k <= 9; k++) line(c, [[800 + k * 70, 738], [800 + k * 170, H + 20]], 2, lit('#2a2030'), 0.5);

  //the telescope on its pier, pointing up through the slit
  paint(c, [[740, 790], [760, 600], [840, 600], [860, 790]], lit('#4c4560'), { size: 14, turn: -1.5 });
  paint(c, ellipse(800, 600, 52, 16), lit('#5e5674'), { size: 10 });
  const tube = limb([[640, 640], [760, 470], [905, 190]], 92, 80);
  paint(c, tube, lit('#c8ad7c'), { size: 18, turn: -1.1 });
  paint(c, limb([[650, 662], [770, 494], [916, 214]], 26, 22), lit('#8f7650'), { size: 10, turn: -1.1, edge: false });
  for (const u of [0.25, 0.55, 0.85]) {
    const [x, y] = [640 + (905 - 640) * u, 640 + (190 - 640) * u];
    paint(c, limb([[x - 44, y - 22], [x + 44, y + 22]], 14), lit('#7a5e3a'), { size: 8 });
  }
  paint(c, ellipse(906, 190, 44, 18, -0.5), lit('#2c2630'), { size: 8 });
  paint(c, limb([[640, 640], [612, 684]], 30, 22), lit('#3a3036'), { size: 8 });

  //the desk and its lamp
  paint(c, [[120, 690], [610, 690], [650, 730], [100, 730]], lit('#6a4834'), { size: 18, turn: 0 });
  paint(c, rect(100, 730, 550, 76), lit('#4a3226'), { size: 18, turn: 0 });
  for (const x of [120, 610]) paint(c, rect(x, 806, 24, 100), lit('#3a281e'), { size: 8, turn: -1.5 });
  paint(c, ellipse(250, 690, 34, 10), lit('#9a7a42'), { size: 8 });
  paint(c, limb([[250, 690], [250, 620]], 7), lit('#9a7a42'), { size: 6 });
  paint(c, [...arc(250, 622, 70, 40, Math.PI, Math.PI * 2, 12)], '#2f6a4a', { size: 10, turn: 0 });
  if (light < 1) glow(c, 250, 650, 300, '255,196,110', 0.4 * (1 - light));
  for (let i = 0; i < 7; i++) paint(c, tilted(360 + random() * 220, 676 + random() * 14, 70, 44, gauss() * 0.3), lit('#e6d8b6'), { size: 8, edge: false });
  if (crates === 'empty' || crates === 'labelled')
    for (let i = 0; i < 14; i++) paint(c, tilted(300 + random() * 1000, 790 + random() * 90, 60, 40, random() * 3), lit('#d8c8a6'), { size: 8, edge: false });

  //crates, and what's in them so far
  const labels = ['1980s', '1990s', '2000s', 'Plates'];
  [[700, 790, 170, 96], [905, 806, 170, 96], [1110, 790, 170, 96], [1300, 812, 170, 96]].forEach(([x, y, w, h], i) => {
    if (crates === 'empty' && i === 3) return;
    crate(c, x, y, w, h, crates, labels[i], lit);
  });

  if (light > 0) {
    //the sun coming in through the slit and across the floor
    c.save();
    c.globalAlpha = 0.18 * light;
    c.fillStyle = '#ffd6a0';
    trace(c, [[730, 446], [870, 446], [1180, H + 20], [520, H + 20]]);
    c.fill();
    c.restore();
  }
}

//the desk up close, under the lamp
function deskTop(c: Ctx) {
  paint(c, rect(-50, -50, W + 100, 440), '#2a2844', { size: 36, turn: -0.4 });
  shelves(c, 120, 1480, [300], 0.85, (hex) => hex);
  paint(c, rect(-50, 380, W + 100, 560), '#5e3f2e', { size: 44, turn: 0, vary: 0.05 });
  for (let i = 0; i < 26; i++) {
    const y = 400 + random() * 500;
    line(c, Array.from({ length: 12 }, (_, k): Pt => [-50 + k * 150, y + Math.sin(k * 0.9 + i) * 8]), 2, '#4a3022', 0.5);
  }
  //the lamp in the corner
  paint(c, ellipse(260, 520, 70, 20), '#9a7a42', { size: 10 });
  paint(c, limb([[260, 520], [262, 290]], 12), '#9a7a42', { size: 6 });
  paint(c, [...arc(262, 296, 150, 80, Math.PI, Math.PI * 2, 16)], '#2f6a4a', { size: 16, turn: 0 });
  paint(c, [...arc(262, 296, 150, 80, Math.PI * 1.1, Math.PI * 1.35, 6), [200, 290]], '#5a9a72', { size: 10, turn: 0, edge: false });
  dot(c, 262, 306, 18, '#fff1c4');
  glow(c, 330, 460, 640, '255,196,110', 0.38);
}

function logbook(c: Ctx) {
  paint(c, [[540, 500], [1180, 470], [1210, 830], [520, 850]], '#3a2a22', { size: 16, turn: 0 });
  paint(c, [[560, 510], [860, 494], [866, 820], [548, 836]], '#e9dcbc', { size: 18, turn: 0, edge: false });
  paint(c, [[866, 494], [1166, 484], [1190, 812], [866, 820]], '#efe3c6', { size: 18, turn: 0, edge: false });
  line(c, [[866, 494], [866, 820]], 4, '#a08a6a', 0.6);
  for (let k = 0; k < 13; k++) {
    for (const [x0, x1] of [[580, 840], [886, 1160]]) {
      const y = 570 + k * 19 - (x0 > 800 ? 8 : 0);
      line(c, [[x0, y], [x1, y - 6]], 1, '#9ab0c8', 0.6);
      if (random() > 0.25) line(c, Array.from({ length: 8 }, (_, j): Pt => [x0 + 10 + j * (14 + random() * 10), y - 5 + Math.sin(j * 2.3 + k) * 3]), 1.5, INK, 0.55);
    }
  }
  write(c, '1986', 640, 548, 34, INK, -0.04);
}

function deskScene(c: Ctx, beat?: string) {
  deskTop(c);
  logbook(c);
  if (beat === 'letter') {
    const env = tilted(1000, 660, 380, 230, 0.12);
    paint(c, env, '#f1e6cc', { size: 14, turn: 0.1, edge: false });
    line(c, [env[0], [1000 + 6, 660 + 10], env[1]], 2, '#c8b894', 0.8);
    paint(c, tilted(1140, 600, 50, 60, 0.12), '#a04a3a', { size: 6, edge: false });
    write(c, 'Ottilie', 940, 690, 38, INK, 0.12);
    write(c, 'The Observatory, on the hill', 920, 730, 22, INK, 0.12);
  }
  if (beat === 'sketchbook') {
    paint(c, tilted(880, 640, 520, 380, -0.08), '#6e3c2a', { size: 18, turn: -0.1 });
    paint(c, tilted(640, 660, 40, 380, -0.08), '#4e2a1e', { size: 10, turn: -1.6, edge: false });
    for (let i = 0; i < 9; i++) line(c, Array.from({ length: 5 }, (_, j): Pt => [720 + random() * 360 + j * 14, 480 + random() * 300 + gauss() * 10]), 1.2, '#9a6a52', 0.6);
    const star = Array.from({ length: 10 }, (_, i): Pt => {
      const r = i % 2 ? 14 : 34;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      return [900 + Math.cos(a) * r, 620 + Math.sin(a) * r];
    });
    paint(c, star, '#d8a84a', { size: 6, edge: false });
  }
  //a pen and an inkwell
  paint(c, ellipse(1340, 560, 46, 20), '#20202e', { size: 8 });
  paint(c, limb([[1240, 820], [1420, 700]], 10, 6), '#2a2a3a', { size: 8 });
}

const LETTER = [
  'Ottie,',
  "I'm writing this on the train, so forgive the hand.",
  'I keep thinking about the hill. The whole town asleep,',
  'and the two of us on the roof of that ridiculous dome,',
  'passing the eyepiece back and forth.',
  'You said it looked like a smudge of chalk.',
  "I said it was the best thing I'd ever seen.",
  "I wasn't talking about the comet.",
  "I can't stay, and you can't leave.",
  "I'll meet you on the hill when it comes back.",
  '                                            M.',
];

function letterScene(c: Ctx) {
  deskTop(c);
  const sheet = tilted(800, 470, 900, 800, -0.04);
  paint(c, sheet, '#efe2c4', { size: 26, turn: 0, vary: 0.04 });
  //where it's been folded in three for forty years
  for (const k of [-1, 1]) {
    const y = 470 + (k * 800) / 6;
    paint(c, tilted(800 + k * 10, y, 880, 6, -0.04), '#d8c8a4', { size: 8, turn: 0, edge: false });
  }
  LETTER.forEach((text, i) => write(c, text, 410 + i * 3, 160 + i * 56, i ? 30 : 36, INK, -0.04));
}

//constellations Ottilie made up, in page coordinates 0 to 1
interface Constellation {
  name: string;
  note?: string;
  stars: Pt[];
  links: [number, number][];
  figure?: (c: Ctx, at: (p: Pt) => Pt, s: number) => void; //the faint painted creature under the stars
}

const CONSTELLATIONS: Record<string, Constellation> = {
  lantern: {
    name: 'The Lantern-Bearer',
    note: 'for the walk home',
    stars: [[0.3, 0.24], [0.36, 0.4], [0.33, 0.58], [0.26, 0.82], [0.42, 0.82], [0.5, 0.44], [0.66, 0.42], [0.72, 0.5]],
    links: [[0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [5, 6], [6, 7]],
    figure: (c, at, s) => {
      paint(c, ellipse(...at([0.3, 0.22]), 18 * s, 20 * s), '#5e72aa', { size: 8, edge: false });
      paint(c, limb([at([0.33, 0.3]), at([0.36, 0.45]), at([0.33, 0.82])], 50 * s, 80 * s), '#5e72aa', { size: 10, edge: false });
      paint(c, limb([at([0.36, 0.4]), at([0.52, 0.44]), at([0.66, 0.42])], 14 * s), '#5e72aa', { size: 6, edge: false });
      glow(c, ...at([0.72, 0.52]), 70 * s, '255,214,140', 0.5);
    },
  },
  heron: {
    name: 'The Heron Asleep',
    stars: [[0.52, 0.16], [0.6, 0.22], [0.58, 0.32], [0.48, 0.4], [0.47, 0.5], [0.56, 0.58], [0.74, 0.6], [0.82, 0.68], [0.6, 0.7], [0.62, 0.92]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [5, 8], [8, 6], [8, 9]],
    figure: (c, at, s) => {
      paint(c, ellipse(...at([0.64, 0.63]), 90 * s, 40 * s, 0.15), '#5e72aa', { size: 10, edge: false });
      paint(c, limb([at([0.52, 0.16]), at([0.6, 0.24]), at([0.48, 0.4]), at([0.5, 0.56])], 22 * s, 30 * s), '#5e72aa', { size: 8, edge: false });
      paint(c, limb([at([0.52, 0.16]), at([0.38, 0.2])], 10 * s, 2), '#5e72aa', { size: 6, edge: false });
      line(c, [at([0.62, 0.7]), at([0.62, 0.92])], 4 * s, '#5e72aa', 0.9);
    },
  },
  chairs: {
    name: 'The Two Chairs',
    stars: [[0.18, 0.36], [0.18, 0.6], [0.36, 0.6], [0.18, 0.8], [0.36, 0.8], [0.62, 0.36], [0.62, 0.6], [0.8, 0.6], [0.62, 0.8], [0.8, 0.8]],
    links: [[0, 1], [1, 2], [1, 3], [2, 4], [5, 6], [6, 7], [6, 8], [7, 9]],
    figure: (c, at, s) => {
      for (const dx of [0, 0.44]) {
        paint(c, rect(...at([0.16 + dx, 0.34]), 16 * s, 160 * s), '#5e72aa', { size: 8, edge: false });
        paint(c, rect(...at([0.16 + dx, 0.58]), 120 * s, 16 * s), '#5e72aa', { size: 8, edge: false });
      }
    },
  },
  comet: {
    name: '',
    stars: [[0.22, 0.28], ...Array.from({ length: 14 }, (_, i): Pt => [0.26 + i * 0.05, 0.3 + (i * 0.05) ** 1.6 * 1.4])],
    links: [],
  },
};

const PAGES: Record<string, [string, string?]> = {
  '': ['lantern', 'heron'],
  heron: ['heron', 'chairs'],
  chairs: ['chairs', 'comet'],
  comet: ['comet'],
};

function page(c: Ctx, x: number, y: number, w: number, h: number, which?: string) {
  if (!which) {
    for (let i = 0; i < 6; i++) dot(c, x + 60 + random() * (w - 120), y + 80 + random() * (h - 200), 1.6, '#8a8070', 0.6);
    return;
  }
  const { name, note, stars, links, figure } = CONSTELLATIONS[which];
  const [px, py, pw, ph] = [x + 40, y + 40, w - 80, h - 170];
  paint(c, rect(px, py, pw, ph), '#1e2a5a', { size: 22, turn: -0.4, vary: 0.08 });
  const at = ([u, v]: Pt): Pt => [px + u * pw, py + v * ph];
  figure?.(c, at, pw / 400);
  for (const [a, b] of links) line(c, [at(stars[a]), at(stars[b])], 2, '#e8dcb8', 0.6);
  stars.forEach((p, i) => {
    const r = which === 'comet' ? Math.max(1.2, 7 - i * 0.45) : 4 + (i % 3) * 1.5;
    if (which === 'comet' && i === 0) glow(c, ...at(p), 40, '220,230,255', 0.5);
    dot(c, ...at(p), r, '#f6efd8');
  });
  write(c, name || '?', x + w / 2, y + h - 80, 34, INK, -0.01, 'italic', 'center');
  if (note) write(c, note, x + w / 2, y + h - 40, 22, INK, -0.01, 'italic', 'center');
}

function sketchbookScene(c: Ctx, beat?: string) {
  deskTop(c);
  paint(c, rect(200, 70, 1200, 800), '#5e3426', { size: 20, turn: 0 });
  paint(c, rect(230, 92, 560, 760), '#eadfc2', { size: 22, turn: -1.5, vary: 0.04, edge: false });
  paint(c, rect(810, 92, 560, 760), '#efe4c8', { size: 22, turn: -1.5, vary: 0.04, edge: false });
  const gutter = c.createLinearGradient(760, 0, 840, 0);
  gutter.addColorStop(0, 'rgba(80,50,30,0)');
  gutter.addColorStop(0.5, 'rgba(80,50,30,0.35)');
  gutter.addColorStop(1, 'rgba(80,50,30,0)');
  c.fillStyle = gutter;
  c.fillRect(760, 92, 80, 760);
  const [left, right] = PAGES[beat ?? ''];
  page(c, 230, 92, 560, 760, left);
  page(c, 810, 92, 560, 760, right);
}

function orreryScene(c: Ctx, beat?: string) {
  paint(c, rect(-50, -50, W + 100, 700), '#22203a', { size: 40, turn: -0.4 });
  shelves(c, 120, 1480, [360], 0.7, (hex) => mix(hex, '#22203a', 0.4));
  paint(c, rect(-50, 640, W + 100, 300), '#5e3f2e', { size: 44, turn: 0, vary: 0.05 });
  glow(c, 200, 300, 700, '255,196,110', 0.3);
  if (beat === 'dials') {
    //the date plate up close, and her note taped under it
    paint(c, rect(280, 230, 1040, 440), '#b8904a', { size: 22, turn: 0 });
    paint(c, rect(310, 260, 980, 380), '#a07c3c', { size: 18, turn: 0, edge: false });
    [['DIES', '28'], ['MENSIS', 'VII'], ['ANNUS', '2061']].forEach(([label, value], i) => {
      const x = 500 + i * 300;
      paint(c, ellipse(x, 470, 116, 116), '#6a4e26', { size: 12 });
      paint(c, ellipse(x, 470, 100, 100), '#f0e4c4', { size: 14, edge: false });
      write(c, label, x, 330, 26, '#3a2a14', 0, 'bold', 'center');
      write(c, value, x, 500, 76, '#2a2018', 0, 'bold', 'center');
    });
    paint(c, tilted(1150, 720, 420, 130, 0.06), '#f1e6cc', { size: 12, edge: false });
    for (const x of [980, 1310]) paint(c, tilted(x, 668, 90, 34, 0.5), '#e8dcaa', { size: 8, edge: false });
    write(c, '76 years. Same as before.', 1150, 735, 34, INK, 0.06, 'italic', 'center');
    return;
  }
  if (beat === 'comet') {
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      dab(c, 1260 - u * 900 + gauss() * 20, 150 + u * 60 + gauss() * 30 * u, 120, 20 + 40 * u, 0.06, '#cfe0ff', 0.12 * (1 - u));
    }
    c.globalAlpha = 1;
    glow(c, 1260, 150, 120, '220,232,255', 0.7);
    dot(c, 1260, 150, 10, '#ffffff');
  }
  //the stand, the sun on its post, the rings and the planets
  paint(c, [[620, 640], [980, 640], [940, 720], [660, 720]], '#8a6a3a', { size: 14, turn: 0 });
  paint(c, ellipse(800, 640, 180, 38), '#b8904a', { size: 14 });
  paint(c, rect(740, 660, 120, 36), '#6a4e26', { size: 8, edge: false });
  write(c, '28 · VII · 2061', 800, 685, 16, '#f0e4c4', 0, 'bold', 'center');
  paint(c, limb([[800, 640], [800, 400]], 12), '#a07c3c', { size: 6 });
  const rings = [130, 200, 275, 350];
  const planets: [number, string, number][] = [[0.6, '#b8a088', 9], [2.4, '#d8b878', 13], [4.1, '#5a86b0', 14], [5.3, '#c0603a', 11]];
  rings.forEach((r) => line(c, ellipse(800, 400, r, r * 0.26, 0, 60).concat([[800 + r, 400]]), 2.5, '#b8904a', 0.9));
  line(c, ellipse(980, 400, 520, 90, -0.08, 80).concat([[1500, 358]]), 1.5, '#d8c8a0', 0.5);
  planets.forEach(([a, color, r], i) => {
    const [x, y] = [800 + Math.cos(a) * rings[i], 400 + Math.sin(a) * rings[i] * 0.26];
    line(c, [[800, 400], [x, y]], 2, '#a07c3c', 0.9);
    paint(c, ellipse(x, y - r, r, r), color, { size: 4, edge: false });
    dot(c, x - r * 0.3, y - r * 1.3, r * 0.3, '#ffffff', 0.5);
  });
  paint(c, ellipse(1480, 360, 7, 7), '#e8eef8', { size: 3, edge: false });
  line(c, [[1488, 356], [1530, 344]], 3, '#e8eef8', 0.5);
  paint(c, ellipse(800, 380, 48, 48), '#e8b84a', { size: 10 });
  dot(c, 784, 364, 12, '#fff2c0', 0.7);
}

function platesScene(c: Ctx) {
  deskTop(c);
  //the crate of plates standing on edge
  paint(c, rect(160, 560, 1280, 400), '#8a6440', { size: 26, turn: 0 });
  paint(c, rect(200, 520, 1200, 120), '#2a1e18', { size: 20, turn: 0, edge: false });
  for (let x = 220; x < 1380; x += 9 + random() * 4) paint(c, tilted(x, 560, 5, 90, 0.18 + gauss() * 0.05), random() > 0.5 ? '#8ea0b4' : '#6e7e92', { size: 4, edge: false });
  for (let k = 1; k < 3; k++) line(c, [[170, 640 + k * 90], [1430, 640 + k * 90]], 3, '#5c3e26', 0.7);
  //one held up to the lamp: a negative, so the stars are black on clear glass
  const plate = tilted(980, 300, 440, 340, 0.05);
  paint(c, plate, '#20283a', { size: 12 });
  paint(c, tilted(980, 300, 404, 304, 0.05), '#dfe2da', { size: 16, edge: false, vary: 0.03 });
  for (let i = 0; i < 160; i++) dot(c, 790 + random() * 380, 160 + random() * 280, 0.6 + random() ** 3 * 4, '#1a1a22', 0.8);
  write(c, '1986.III.12', 1060, 438, 22, '#3a2a2a', 0.05);
  for (const [x, y] of [[770, 470], [1180, 450]]) {
    paint(c, ellipse(x, y, 46, 30, -0.4), '#e0b896', { size: 8 });
    for (let k = 0; k < 3; k++) paint(c, limb([[x - 20 + k * 18, y - 20], [x - 22 + k * 18, y - 64]], 18, 14), '#e8c4a2', { size: 6 });
  }
}

const PAINT: Record<SetId, (c: Ctx, beat?: string) => void> = {
  hill: hillScene,
  dome: domeScene,
  desk: deskScene,
  letter: letterScene,
  sketchbook: sketchbookScene,
  orrery: orreryScene,
  plates: platesScene,
};

const hash = (text: string) => [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

//paintings are slow to make, so each is made once and kept, dropping the oldest past a limit
const paintings = new Map<string, HTMLCanvasElement>();
function painting(cue: Cue) {
  const key = `${cue.set}:${cue.beat ?? ''}`;
  let painted = paintings.get(key);
  if (!painted) {
    random = seeded(hash(key));
    const [el, c] = canvas2d(W, H);
    PAINT[cue.set](c, cue.beat);
    painted = el;
    paintings.set(key, el);
    if (paintings.size > 10) paintings.delete(paintings.keys().next().value!);
  }
  return painted;
}

// ---------------------------------------------------------------------------
// what moves on top of the paintings
// ---------------------------------------------------------------------------

function live(c: Ctx, cue: Cue, t: number, dawn: number) {
  const flicker = 0.85 + 0.1 * Math.sin(t * 7) + 0.05 * Math.sin(t * 23);
  if (cue.set === 'hill' && dawn < 0.5) {
    for (let i = 0; i < 70; i++) if (rand(i + 40) > 0.85) glow(c, 120 + rand(i) * 700, 650 + rand(i + 9) * 80, 14, '255,210,140', 0.3 + 0.3 * Math.sin(t * 2 + i));
    glow(c, 987, 500, 90, '255,190,110', 0.15 * flicker);
    //fireflies over the grass
    for (let i = 0; i < 14; i++) {
      const x = 200 + rand(i) * 1200 + Math.sin(t * 0.5 + i) * 40;
      const y = 700 + rand(i + 3) * 160 + Math.sin(t * 0.8 + i * 2) * 20;
      glow(c, x, y, 12, '220,255,150', 0.5 * Math.max(0, Math.sin(t * 1.3 + i * 1.7)));
    }
  }
  if (cue.set === 'dome') {
    if (dawn < 0.9) glow(c, 250, 650, 200, '255,190,110', 0.1 * flicker * (1 - dawn));
    //dust turning in the light
    for (let i = 0; i < 30; i++) {
      const x = dawn > 0.5 ? 700 + rand(i) * 350 + Math.sin(t * 0.3 + i) * 30 : 160 + rand(i) * 260;
      const y = (dawn > 0.5 ? 460 : 560) + ((rand(i + 5) * 300 + t * 6) % 300);
      dot(c, x, y, 1.4, '#fff2d0', 0.4 * Math.abs(Math.sin(t * 0.7 + i)));
    }
  }
  if (cue.set === 'desk' || cue.set === 'letter' || cue.set === 'sketchbook' || cue.set === 'plates') glow(c, 330, 460, 500, '255,190,110', 0.08 * flicker);
  if (cue.set === 'plates') glow(c, 980, 300, 260, '255,240,200', 0.12 * flicker);
  if (cue.set === 'orrery' && cue.beat !== 'dials') {
    glow(c, 800, 380, 110, '255,214,120', 0.2 + 0.08 * Math.sin(t * 1.5));
    if (cue.beat === 'comet') glow(c, 1260, 150, 70, '220,232,255', 0.3 + 0.2 * Math.sin(t * 2));
  }
}

function drawScene(c: Ctx, cue: Cue, t: number, clock?: number) {
  const dawn = clock === undefined ? dawnOf(cue) : Math.max(dawnOf(cue), 1 - clock);
  if (cue.set === 'hill' || cue.set === 'dome') sky(c, dawn, t, cue.set === 'hill');
  c.drawImage(painting(cue), 0, 0);
  live(c, cue, t, dawn);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  crickets: new URL('./sounds/crickets.m4a', import.meta.url).href,
  wind: new URL('./sounds/wind.m4a', import.meta.url).href,
  ticking: new URL('./sounds/ticking.m4a', import.meta.url).href,
  dawn: new URL('./sounds/dawn.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//the ticking comes in while the clock runs and grows louder as it runs down
function mixFor(cue: Cue, clock?: number): Partial<Record<Bed, number>> {
  const ticking = clock === undefined ? 0 : 0.2 + 0.4 * (1 - clock);
  const morning = dawnOf(cue) > 0.5;
  if (cue.set === 'hill') return morning ? { dawn: 0.6, wind: 0.15 } : { crickets: 0.7, wind: 0.15 };
  if (cue.set === 'dome') return morning ? { dawn: 0.45, wind: 0.2 } : { wind: 0.45, crickets: 0.2, ticking };
  return { wind: 0.3, crickets: 0.12, ticking };
}

interface OneShot {
  src: string;
  volume: number;
  delay?: number;
}

const PAGE = new URL('./sounds/page_turn.m4a', import.meta.url).href;
const CRATE = new URL('./sounds/crate.m4a', import.meta.url).href;
const GEARS = new URL('./sounds/gears.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  letter_open: { src: PAGE, volume: 0.7 },
  sketchbook_open: { src: new URL('./sounds/flip.m4a', import.meta.url).href, volume: 0.6 },
  sketch_heron: { src: PAGE, volume: 0.6 },
  sketch_chairs: { src: PAGE, volume: 0.6 },
  sketch_comet: { src: PAGE, volume: 0.6 },
  orrery: { src: GEARS, volume: 0.5, delay: 0.4 },
  orrery_close: { src: GEARS, volume: 0.35 },
  plates: { src: CRATE, volume: 0.6 },
  crates_labelled: { src: CRATE, volume: 0.5 },
  crates_done: { src: CRATE, volume: 0.6 },
  dawn_late: { src: new URL('./sounds/chimes.m4a', import.meta.url).href, volume: 0.7 },
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
    mix(cue: Cue, clock?: number) {
      const levels = mixFor(cue, clock);
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

function TheArchive({ animation, clock }: { animation: string; clock?: number }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Archive has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active] });
  const clockLeft = useRef(clock);
  const sound = useRef<ReturnType<typeof createSoundscape> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const [grainCanvas, g] = canvas2d(200, 200);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(40,30,50,${Math.random() * 0.5})`;
      g.fillRect(Math.random() * 200, Math.random() * 200, 1.3, 1.3);
    }
    const grain = c.createPattern(grainCanvas, 'repeat')!;
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
        drawScene(c, prev, t, clockLeft.current);
        c.globalAlpha = ease(since / SET_FADE);
      }
      drawScene(c, cue, t, clockLeft.current);
      c.globalAlpha = 1;

      //paper grain and a dark vignette over everything
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalAlpha = 0.1;
      c.fillStyle = grain;
      c.fillRect(0, 0, sw, sh);
      c.globalAlpha = 1;
      const v = c.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.45, sw / 2, sh / 2, Math.max(sw, sh) * 0.8);
      v.addColorStop(0, 'rgba(16,14,30,0)');
      v.addColorStop(1, 'rgba(16,14,30,0.35)');
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
    shown.current = { cue: cues[active], at: performance.now(), prev: shown.current.cue };
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  useEffect(() => {
    clockLeft.current = clock;
    sound.current?.mix(cues[active], clock);
  }, [active, clock]);

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
    background: '#151a3e',
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
    background: 'radial-gradient(ellipse at center, rgba(16,20,52,0.6) 0%, rgba(16,20,52,0) 70%)',
    color: '#f6ecd2',
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

export default TheArchive;
