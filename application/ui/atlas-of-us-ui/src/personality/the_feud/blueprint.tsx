import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Feud is drawn as a set of architect's blueprints for two semi-detached houses: white lines on cyanotype blue,
// faint construction lines, hatching for anything solid, and dimension lines for the metre everyone is arguing about.
// People are the little scale figures architects put in their drawings. The player, and anything they do, is marked up
// in red pen; the highlighter yellow is for the disputed strip, lit windows and the planning notice. Lines are drafted on
// as if by a plotter, fills and lettering ink in after. A cue names a sheet and the parts of it to show: parts already up
// stay put, new ones are drawn after them, and turning to a new sheet fades the old one out. Everything is SVG in a fixed
// 1600x900 space, scaled to cover the screen. The drawings keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  paper: '#1c4f8c',
  white: '#eef4ff',
  faint: '#93b4dd',
  red: '#ff6a5c',
  yellow: '#ffd95e',
};
type Ink = Exclude<keyof typeof C, 'paper'>;
type Fill = Ink | 'paper' | 'hatch' | 'hatch_red' | 'hatch_yellow';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'plan' | 'garden' | 'front';

interface Cue {
  page: Page;
  parts: string[]; //drawn in this order
  card?: [kicker: string, name: string];
}

const SHEET: Record<Page, string> = {
  plan: 'SITE PLAN · 14 & 16 ORCHARD CLOSE · 1:100',
  garden: 'SECTION A–A · REAR GARDENS · 1:50',
  front: 'FRONT ELEVATION · ORCHARD CLOSE · 1:50',
};

const PLAN = ['plots', 'houses', 'old_line', 'new_line', 'tree', 'labels'];
const SPRING = ['ground', 'house_you', 'house_him', 'tree', 'blossom', 'fence'];
const APRIL = [...SPRING, 'old_fence', 'dim'];
const JUNE = ['ground', 'house_you', 'house_him', 'tree', 'leaves', 'fence', 'old_fence', 'camera', 'clippings'];
const DAY = ['street', 'fronts', 'bins', 'lamp'];
const NIGHT = [...DAY, 'night', 'notice', 'falling'];

const cues: Record<string, Cue> = {
  title_card: { page: 'plan', parts: [...PLAN, 'strip', 'dim'], card: ['A Saturday in April', 'The Feud'] },
  hammering: { page: 'garden', parts: [...SPRING, 'graham_hammer', 'bang'] },
  new_fence: { page: 'garden', parts: [...SPRING, 'graham_hammer', 'fence_label'] },
  metre: { page: 'garden', parts: [...SPRING, 'graham_hammer', 'fence_label', 'old_fence', 'dim', 'you'] },
  graham_plans: { page: 'garden', parts: [...APRIL, 'you', 'graham', 'callout', 'say_plans'] },
  graham_push: { page: 'garden', parts: [...APRIL, 'you', 'graham_close', 'callout_close', 'say_moving'] },
  fence_straight: { page: 'garden', parts: [...APRIL, 'you', 'graham_hammer', 'bang', 'callout_close', 'say_see'] },
  fence_calm: { page: 'garden', parts: [...APRIL, 'you', 'graham', 'callout', 'say_loft'] },
  fence_fine: { page: 'garden', parts: [...APRIL, 'you', 'graham_close', 'callout_close', 'say_sensible'] },
  fence_temper: { page: 'garden', parts: [...APRIL, 'you', 'shout', 'graham_folded', 'hush', 'callout', 'say_finished'] },
  deeds: { page: 'plan', parts: [...PLAN, 'thick', 'deeds'] },
  pat: { page: 'front', parts: [...DAY, 'you_bins', 'pat'] },
  pat_says: { page: 'front', parts: [...DAY, 'notice', 'you_bins', 'pat', 'callout_pat', 'say_planning'] },
  why_honest: { page: 'plan', parts: [...PLAN, 'thick', 'deeds', 'query'] },
  why_extension: { page: 'plan', parts: [...PLAN, 'thick', 'extension', 'query_ext'] },
  why_trying: { page: 'front', parts: [...DAY, 'notice', 'you_bins', 'pat', 'callout_pat', 'say_parking'] },
  why_sorted: { page: 'front', parts: [...DAY, 'notice', 'you_bins', 'pat', 'callout_pat', 'say_metre'] },
  letter: { page: 'front', parts: [...DAY, 'notice', 'you_his', 'letter'] },
  reply: { page: 'front', parts: [...DAY, 'notice', 'you_door', 'reply'] },
  camera: { page: 'garden', parts: [...JUNE, 'you'] },
  war_solicitor: { page: 'garden', parts: [...JUNE, 'you', 'letters'] },
  war_mediate: { page: 'front', parts: [...DAY, 'notice', 'you_his', 'graham_his', 'callout_his', 'say_think'] },
  war_back: { page: 'garden', parts: [...JUNE, 'camera_you', 'back_forth', 'you'] },
  war_let_go: { page: 'garden', parts: [...JUNE, 'fruit', 'sapling', 'you'] },
  knock: { page: 'front', parts: [...NIGHT, 'knock'] },
  graham_door: { page: 'front', parts: [...NIGHT, 'you_door', 'graham_step'] },
  graham_asks: { page: 'front', parts: [...NIGHT, 'you_door', 'graham_key', 'callout', 'say_ask'] },
  notice: { page: 'front', parts: [...NIGHT, 'you_door', 'graham_key', 'notice_ring'] },
  favour_yes: { page: 'front', parts: [...NIGHT, 'you_key', 'graham_step', 'cat', 'callout', 'say_mabel'] },
  favour_deal: { page: 'front', parts: [...NIGHT, 'you_key', 'graham_step', 'callout', 'say_back'] },
  favour_no: { page: 'front', parts: [...NIGHT, 'door_shut', 'graham_away'] },
  favour_object: { page: 'front', parts: [...NIGHT, 'door_shut', 'objection'] },
  spring: { page: 'garden', parts: APRIL },
  homework: { page: 'plan', parts: [...PLAN, 'strip', 'you_dot'] },
  goodbye: { page: 'front', parts: [...DAY, 'jar'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: drafted lines, filled shapes and lettering. dashed lines ink in rather than draw. raw items
//skip the ink filter, for anything that moves all the time
type Item =
  | { line: Ink; d: string; w?: number; dash?: boolean; o?: number; cls?: string; raw?: boolean }
  | { fill: Fill; d: string; o?: number; cls?: string; raw?: boolean }
  | { text: string; c: Ink; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; o?: number };

const GAP = 0.05; //seconds between one item starting to draw and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.map((n) => +n.toFixed(1)).join(' ')).join(' L ')}`;
const shape = (...pts: Pt[]) => `${line(...pts)} Z`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) =>
  `M ${+(x - r).toFixed(1)} ${+y.toFixed(1)} a ${+r.toFixed(1)} ${+r.toFixed(1)} 0 1 0 ${+(2 * r).toFixed(1)} 0 a ${+r.toFixed(1)} ${+r.toFixed(1)} 0 1 0 ${+(-2 * r).toFixed(1)} 0`;
const words = (c: Ink, text: string, x: number, y: number, size: number, anchor?: 'start' | 'end'): Item => ({ c, text, x, y, size, anchor });

//pseudo-random but fixed, so a sheet always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a shape drawn as a filled outline, so it hides whatever is behind it
const solid = (ink: Ink, d: string, fill: Fill = 'paper', w = 3): Item[] => [
  { fill, d },
  { line: ink, d, w },
];

//a scale figure, feet at y and h tall, facing right (dir 1) or left (-1). Graham wears a flat cap, Lorna has a bun
type Arms = 'down' | 'out' | 'up' | 'folded';
function person(x: number, y: number, h: number, ink: Ink, { dir = 1, arms = 'down' as Arms, fill = 'paper' as Fill, cap = false, bun = false, skirt = false } = {}) {
  const u = h / 100;
  const P = (dx: number, dy: number): Pt => [x + dx * u * dir, y - dy * u];
  const S = (...pts: Pt[]) => shape(...pts.map(([a, b]) => P(a, b)));
  const body = skirt
    ? S([-12, 82], [12, 82], [14, 50], [20, 22], [6, 22], [6, 0], [2, 0], [2, 22], [-2, 22], [-2, 0], [-6, 0], [-6, 22], [-20, 22], [-14, 50])
    : S([-12, 82], [12, 82], [14, 42], [11, 0], [3, 0], [1, 38], [-1, 38], [-3, 0], [-11, 0], [-14, 42]);
  const down = (s: number) => S([11 * s, 80], [17 * s, 76], [20 * s, 46], [14 * s, 46], [11 * s, 70]);
  const upper = (s: number) => S([11 * s, 80], [17 * s, 76], [17 * s, 60], [11 * s, 60]);
  const front = {
    down: [down(1)],
    out: [S([10, 80], [16, 77], [44, 66], [42, 59], [12, 68])],
    up: [S([10, 80], [16, 78], [31, 104], [25, 107]), S([27, 104], [29, 104], [29, 121], [27, 121]), S([20, 120], [36, 120], [36, 127], [20, 127])],
    folded: [upper(1), S([-17, 68], [17, 68], [17, 58], [-17, 58])],
  }[arms];
  const [hx, hy] = P(0, 91);
  const ds = [arms === 'folded' ? upper(-1) : down(-1), body, ...front, circle(hx, hy, 7 * u)];
  if (cap) ds.push(`M ${P(-7.5, 92).join(' ')} A ${7.5 * u} ${7.5 * u} 0 0 ${dir === 1 ? 1 : 0} ${P(7.5, 92).join(' ')} L ${P(13, 92).join(' ')} Z`);
  if (bun) ds.push(circle(...P(-6, 97), 3.5 * u));
  return ds.flatMap((d) => solid(ink, d, fill));
}

//a drawing note: a box of lettering with a leader line out to tip
const callout = (x: number, y: number, w: number, h: number, tip: Pt, ink: Ink = 'white'): Item[] => {
  const from: Pt = [Math.min(Math.max(tip[0], x + 20), x + w - 20), tip[1] > y + h ? y + h : y];
  return [{ fill: 'paper', d: rect(x, y, w, h), o: 0.9 }, { line: ink, d: rect(x, y, w, h), w: 3 }, { line: ink, d: line(from, tip), w: 2 }, { fill: ink, d: circle(tip[0], tip[1], 5) }];
};

//a dimension line between x1 and x2, with the architect's slash ticks
const dim = (x1: number, x2: number, y: number, label: string, ink: Ink): Item[] => [
  { line: ink, d: `M ${x1} ${y - 18} V ${y + 18} M ${x2} ${y - 18} V ${y + 18} M ${x1} ${y} H ${x2} M ${x1 - 8} ${y + 8} l 16 -16 M ${x2 - 8} ${y + 8} l 16 -16`, w: 3 },
  words(ink, label, (x1 + x2) / 2, y - 14, 28),
];

//a tree's crown: bumps around an ellipse, like the template architects draw them with
const crown = (cx: number, cy: number, rx: number, ry: number, n: number) => {
  const pts = Array.from({ length: n }, (_, i): Pt => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
  return `${line(pts[0])} ${pts.map((_, i) => {
    const [a, b] = [pts[i], pts[(i + 1) % n]];
    const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.62;
    return `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${b.map((v) => v.toFixed(1)).join(' ')}`;
  }).join(' ')} Z`;
};

//n dots scattered through an ellipse, for blossom and fruit
const dots = (cx: number, cy: number, rx: number, ry: number, n: number, r: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const [a, d] = [rand(seed + i) * 2 * Math.PI, Math.sqrt(rand(seed + i + 100)) * 0.85];
    return circle(cx + rx * d * Math.cos(a), cy + ry * d * Math.sin(a), r);
  }).join(' ');

//a tree with its trunk at x, standing on the ground at y
const tree = (x: number, y: number, s: number, ink: Ink): Item[] => [
  { line: ink, d: `M ${x} ${y} V ${y - 150 * s} M ${x} ${y - 110 * s} L ${x - 40 * s} ${y - 170 * s} M ${x} ${y - 140 * s} L ${x + 45 * s} ${y - 195 * s}`, w: 6 * s },
  { line: ink, d: crown(x - 10 * s, y - 250 * s, 130 * s, 100 * s, 14), w: 3 },
];

const envelope = (ink: Ink, x: number, y: number, w: number, h: number, fill: Fill = 'paper'): Item[] => [
  ...solid(ink, rect(x, y, w, h), fill),
  { line: ink, d: line([x, y], [x + w / 2, y + h * 0.55], [x + w, y]), w: 3 },
];

//a curved arrow from a to b, bending through c
const arrow = (ink: Ink, a: Pt, c: Pt, b: Pt): Item => {
  const t = Math.atan2(b[1] - c[1], b[0] - c[0]);
  const head = (s: number): Pt => [b[0] - 18 * Math.cos(t + s), b[1] - 18 * Math.sin(t + s)];
  return { line: ink, d: `M ${a.join(' ')} Q ${c.join(' ')} ${b.join(' ')} ${line(head(0.45), b, head(-0.45))}`, w: 4 };
};

//windows with glazing bars
const pane = (x: number, y: number, w: number, h: number): Item => ({ line: 'white', d: `${rect(x, y, w, h)} M ${x + w / 2} ${y} V ${y + h} M ${x} ${y + h * 0.4} H ${x + w}`, w: 3 });

//falling leaves, n of them over the box from x1 to x2
const falling = (x1: number, x2: number, n: number): Item[] =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = [x1 + rand(i + 400) * (x2 - x1), 20 + rand(i + 500) * 380];
    return { fill: 'faint' as Fill, d: `M ${x.toFixed(0)} ${y.toFixed(0)} q 9 -9 18 0 q -9 9 -18 0 Z`, o: 0.8, cls: `fd-fall fd-fall-${i % 3}`, raw: true };
  });

// ---------------------------------------------------------------------------
// the sheets
// ---------------------------------------------------------------------------

const GROUND = 580;
const FIGURE = 280; //garden figures; the front elevation is drawn a bit smaller
const GRAHAM = { dir: -1 as const, cap: true };

const ART: Record<Page, Record<string, Item[]>> = {
  plan: {
    plots: [{ line: 'white', d: rect(200, 80, 1200, 490), w: 4 }],
    houses: [
      ...solid('white', rect(260, 440, 470, 130), 'hatch'),
      ...solid('white', rect(870, 440, 470, 130), 'hatch'),
      words('white', 'NO. 14', 495, 515, 30),
      words('white', 'NO. 16', 1105, 515, 30),
    ],
    old_line: [{ line: 'faint', d: line([800, 80], [800, 440]), w: 3, dash: true }],
    new_line: [{ line: 'white', d: `${line([720, 80], [720, 440])} ${Array.from({ length: 7 }, (_, i) => rect(714, 90 + i * 55, 12, 12)).join(' ')}`, w: 5 }],
    tree: [
      { line: 'white', d: crown(765, 210, 75, 75, 10), w: 3 },
      { line: 'white', d: 'M 755 200 l 20 20 M 775 200 l -20 20', w: 3 },
    ],
    labels: [
      words('faint', 'BACKYARD', 460, 260, 26),
      words('faint', 'BACKYARD', 1100, 260, 26),
      { line: 'white', d: `${shape([1490, 110], [1508, 170], [1490, 158], [1472, 170])} M 1490 110 V 190`, w: 3 },
      words('white', 'N', 1490, 100, 26),
    ],
    strip: [{ fill: 'hatch_yellow', d: rect(720, 80, 80, 360) }, { line: 'yellow', d: rect(720, 80, 80, 360), w: 2 }],
    dim: dim(720, 800, 50, '1.00 M', 'red'),
    thick: [{ fill: 'white', d: rect(716, 70, 90, 380), o: 0.45 }],
    deeds: [...callout(940, 110, 360, 110, [806, 160]), words('white', 'SURVEY · 1962', 1120, 158, 30), words('faint', 'SCALE 1:2500', 1120, 198, 22)],
    query: [words('red', '?', 761, 380, 110)],
    extension: [{ line: 'yellow', d: rect(800, 300, 260, 140), w: 3, dash: true }, words('yellow', 'PROPOSED ADDITION', 930, 375, 20)],
    query_ext: [{ line: 'red', d: circle(800, 300, 34), w: 4 }, words('red', '?', 860, 280, 80)],
    you_dot: [{ fill: 'red', d: circle(460, 330, 16) }, words('red', 'YOU', 460, 300, 30)],
  },

  garden: {
    ground: [
      { line: 'white', d: line([0, GROUND], [W, GROUND]), w: 5 },
      { fill: 'hatch', d: rect(0, GROUND, W, 30), o: 0.6 },
    ],
    house_you: [
      ...solid('white', rect(-10, 90, 210, 490), 'paper', 4),
      pane(40, 160, 110, 130),
      { line: 'white', d: rect(70, 360, 90, 220), w: 3 },
      words('white', '14', 115, 340, 30),
    ],
    house_him: [
      ...solid('white', rect(1400, 90, 210, 490), 'paper', 4),
      pane(1450, 160, 110, 130),
      { line: 'white', d: rect(1440, 360, 90, 220), w: 3 },
      words('white', '16', 1485, 340, 30),
    ],
    tree: tree(775, GROUND, 1, 'white'),
    blossom: [{ fill: 'white', d: dots(765, 330, 120, 90, 26, 6, 11), o: 0.9 }],
    leaves: [{ fill: 'hatch', d: crown(765, 330, 130, 100, 14) }],
    fruit: [{ fill: 'yellow', d: dots(765, 330, 120, 90, 16, 9, 31) }],
    fence: [...solid('white', rect(632, 292, 16, 288), 'hatch'), { line: 'white', d: rect(628, 286, 24, 8), w: 3 }],
    fence_label: [words('white', 'NEW FENCE · 1.8 M', 520, 130, 24), { line: 'white', d: line([560, 142], [636, 286]), w: 2 }],
    old_fence: [{ line: 'faint', d: rect(792, 300, 16, 280), w: 3, dash: true }, words('faint', 'OLD LINE', 816, 520, 20, 'start')],
    dim: dim(640, 800, 555, '1.00 M', 'red'),
    you: person(520, GROUND, FIGURE, 'red', { fill: 'hatch_red' }),
    shout: [{ line: 'red', d: 'M 580 280 l 30 -16 M 586 310 l 40 0 M 580 340 l 30 16 M 460 280 l -30 -16 M 454 310 l -40 0', w: 4, cls: 'fd-shake', raw: true }],
    graham: person(980, GROUND, FIGURE, 'white', GRAHAM),
    graham_close: person(700, GROUND, FIGURE, 'white', GRAHAM),
    graham_folded: person(980, GROUND, FIGURE, 'white', { ...GRAHAM, arms: 'folded' }),
    graham_hammer: person(700, GROUND, FIGURE, 'white', { ...GRAHAM, arms: 'up' }),
    bang: [{ line: 'white', d: 'M 600 300 l -30 -20 M 596 330 l -40 0 M 600 360 l -30 20', w: 4, cls: 'fd-shake', raw: true }],
    callout: callout(860, 40, 560, 100, [990, 296]),
    callout_close: callout(860, 40, 560, 100, [712, 296]),
    say_plans: [words('white', 'ALWAYS IN THE WRONG PLACE', 1140, 104, 32)],
    say_moving: [words('white', "I'M NOT MOVING IT", 1140, 106, 40)],
    say_see: [words('white', "WE'LL SEE", 1140, 106, 44)],
    say_loft: [words('white', "THEY'RE IN THE ATTIC", 1140, 106, 38)],
    say_sensible: [words('white', "KNEW YOU'D BE REASONABLE", 1140, 104, 34)],
    say_finished: [words('white', 'FINISHED?', 1140, 106, 44)],
    hush: [words('faint', 'NO. 20: MOWER OFF', 230, 130, 20, 'start')],
    camera: [
      { fill: 'yellow', d: shape([1350, 205], [180, GROUND], [620, GROUND]), o: 0.12 },
      ...solid('white', rect(1350, 188, 50, 32)),
      { line: 'white', d: circle(1350, 204, 9), w: 3 },
      { fill: 'yellow', d: circle(1390, 196, 4), cls: 'fd-blink', raw: true },
    ],
    camera_you: [
      { fill: 'red', d: shape([250, 205], [1000, GROUND], [1380, GROUND]), o: 0.1 },
      ...solid('red', rect(200, 188, 50, 32), 'hatch_red'),
      { line: 'red', d: circle(250, 204, 9), w: 3 },
    ],
    clippings: [{ line: 'faint', d: Array.from({ length: 9 }, (_, i) => `M ${300 + i * 34 + rand(i) * 10} 576 l 8 -10 l 6 8 l 8 -12`).join(' '), w: 2 }],
    back_forth: [arrow('red', [470, 250], [640, 120], [880, 240]), arrow('white', [900, 280], [660, 170], [480, 280])],
    letters: [
      ...envelope('red', 250, 160, 120, 76, 'hatch_red'),
      ...envelope('white', 300, 110, 120, 76),
      ...envelope('red', 390, 150, 120, 76, 'hatch_red'),
      ...envelope('white', 450, 100, 120, 76),
      words('red', '$340', 300, 290, 40),
    ],
    sapling: [...tree(330, GROUND, 0.45, 'red'), { fill: 'hatch_red', d: crown(325, GROUND - 112, 58, 45, 10) }],
  },

  front: {
    street: [
      { line: 'white', d: line([0, GROUND], [W, GROUND]), w: 5 },
      { line: 'faint', d: line([0, GROUND + 22], [W, GROUND + 22]), w: 3 },
    ],
    fronts: [
      { line: 'white', d: `${rect(140, 70, 1320, 510)} M 800 70 V ${GROUND} M 110 70 H 1490`, w: 4 },
      pane(200, 330, 240, 160),
      pane(200, 110, 240, 140),
      pane(500, 110, 200, 140),
      pane(1160, 330, 240, 160),
      pane(1160, 110, 240, 140),
      pane(900, 110, 200, 140),
      { line: 'white', d: `${rect(560, 290, 120, 290)} ${rect(920, 290, 120, 290)} ${rect(595, 450, 50, 12)} ${rect(955, 450, 50, 12)}`, w: 3 },
      words('white', '14', 620, 276, 28),
      words('white', '16', 980, 276, 28),
    ],
    bins: [...solid('white', `${rect(46, 476, 74, 98)} ${rect(42, 466, 82, 12)}`, 'hatch'), { line: 'white', d: circle(58, 574, 8), w: 3 }],
    lamp: [{ line: 'white', d: `M 1530 ${GROUND} V 150 Q 1530 120 1495 120`, w: 6 }, ...solid('white', shape([1470, 116], [1510, 116], [1504, 132], [1476, 132]))],
    notice: [...solid('yellow', rect(1508, 330, 44, 60), 'hatch_yellow', 3), words('yellow', 'PERMIT', 1530, 318, 14)],
    night: [
      { fill: 'yellow', d: rect(202, 332, 236, 156), o: 0.25 },
      { fill: 'yellow', d: rect(1162, 112, 236, 136), o: 0.25 },
      { fill: 'yellow', d: shape([1478, 132], [1502, 132], [1580, GROUND], [1400, GROUND]), o: 0.12 },
      { fill: 'white', d: circle(1300, 34, 18) },
      { fill: 'paper', d: circle(1310, 28, 16) },
    ],
    falling: falling(900, 1600, 9),
    you_bins: person(220, GROUND, 250, 'red', { fill: 'hatch_red' }),
    pat: person(420, GROUND, 240, 'white', { dir: -1, bun: true, skirt: true, fill: 'hatch' }),
    you_door: person(620, GROUND, 250, 'red', { fill: 'hatch_red' }),
    you_key: [...person(620, GROUND, 250, 'red', { fill: 'hatch_red', arms: 'out' }), { line: 'red', d: `${circle(736, 424, 9)} M 745 424 h 22 v 8 M 760 424 v 7`, w: 3 }],
    you_his: person(850, GROUND, 250, 'red', { fill: 'hatch_red' }),
    graham_step: person(770, GROUND, 250, 'white', GRAHAM),
    graham_key: [...person(770, GROUND, 250, 'white', { ...GRAHAM, arms: 'out' }), { line: 'yellow', d: `${circle(660, 424, 9)} M 651 424 h -22 v 8 M 636 424 v 7`, w: 3 }],
    graham_his: person(985, GROUND, 250, 'white', { ...GRAHAM, arms: 'folded' }),
    graham_away: person(1330, GROUND, 250, 'white', { cap: true }),
    callout: callout(820, 150, 560, 100, [780, 320]),
    callout_pat: callout(300, 140, 600, 100, [430, 334]),
    callout_his: callout(1060, 150, 420, 100, [995, 320]),
    say_planning: [words('white', "HE'S PUT IN FOR PLANNING", 600, 202, 32)],
    say_parking: [words('white', 'SAME ABOUT PARKING', 600, 204, 38)],
    say_metre: [words('white', 'THREE FEET IS THREE FEET', 600, 204, 38)],
    say_ask: [words('white', 'NOBODY ELSE TO ASK', 1100, 214, 38)],
    say_mabel: [words('white', "SHE'S CALLED MABEL", 1100, 214, 38)],
    say_back: [words('white', "WHEN I'M BACK", 1100, 214, 40)],
    say_think: [words('white', "I'LL THINK ABOUT IT", 1270, 214, 34)],
    letter: [...envelope('red', 945, 380, 70, 44, 'hatch_red'), arrow('red', [880, 330], [940, 330], [976, 374])],
    reply: [
      ...envelope('white', 700, 520, 70, 44),
      ...callout(820, 150, 600, 100, [770, 520]),
      words('white', 'TALK TO MY LAWYER', 1120, 214, 36),
    ],
    knock: [
      { line: 'white', d: 'M 700 400 q 12 14 0 28 M 718 390 q 18 24 0 48 M 736 380 q 24 34 0 68', w: 4, cls: 'fd-shake', raw: true },
      words('white', 'KNOCK KNOCK', 760, 370, 24, 'start'),
    ],
    notice_ring: [{ line: 'yellow', d: circle(1530, 360, 70), w: 4 }, ...callout(1060, 150, 380, 100, [1470, 330], 'yellow'), words('yellow', 'OBJECTIONS CLOSE FRIDAY', 1250, 212, 26)],
    cat: [
      { line: 'white', d: `${circle(1280, 430, 22)} M 1262 418 l 4 -22 l 10 14 M 1298 418 l -4 -22 l -10 14 ${shape([1258, 450], [1302, 450], [1316, 488], [1244, 488])} M 1316 486 q 30 0 24 -40`, w: 3 },
      words('white', 'MABEL', 1280, 386, 18),
    ],
    door_shut: [{ fill: 'hatch', d: rect(560, 290, 120, 290) }],
    objection: [
      ...solid('red', rect(1280, 250, 150, 200), 'paper'),
      ...solid('red', rect(1260, 270, 150, 200), 'paper'),
      words('red', 'OBJECTION', 1335, 310, 22),
      { line: 'red', d: Array.from({ length: 7 }, (_, i) => `M 1278 ${336 + i * 18} h ${100 + rand(i + 60) * 14}`).join(' '), w: 2 },
      arrow('red', [1414, 330], [1470, 310], [1504, 346]),
    ],
    jar: [
      { fill: 'yellow', d: circle(622, 552, 60), o: 0.15 },
      ...solid('yellow', rect(600, 534, 44, 46), 'hatch_yellow'),
      ...solid('yellow', rect(596, 524, 52, 12)),
      words('yellow', 'PLUM', 622, 506, 20),
    ],
  },
};

// ---------------------------------------------------------------------------
// a sheet, and its parts
// ---------------------------------------------------------------------------

const FILLS: Record<Fill, string> = { ...C, hatch: 'url(#fd-hatch)', hatch_red: 'url(#fd-hatch-red)', hatch_yellow: 'url(#fd-hatch-yellow)' };

//lines are drafted on from one end; dashed lines, fills and lettering ink in
function Mark({ item, delay }: { item: Item; delay: number }) {
  const style = { animationDelay: `${delay}s` };
  if ('text' in item) {
    return (
      <text className="fd-in" style={{ ...style, ...styles.type, fontSize: item.size }} x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]} fillOpacity={item.o ?? 1}>
        {item.text}
      </text>
    );
  }
  if ('line' in item) {
    return (
      <path
        className={item.dash ? 'fd-in' : 'fd-draw'}
        style={style}
        d={item.d}
        pathLength={item.dash ? undefined : 1}
        fill="none"
        stroke={C[item.line]}
        strokeWidth={item.w ?? 3}
        strokeOpacity={item.o ?? 1}
        strokeDasharray={item.dash ? '14 10' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  return <path className="fd-in" style={style} d={item.d} fill={FILLS[item.fill]} fillOpacity={item.o ?? 1} />;
}

function Part({ items, start }: { items: Item[]; start: number }) {
  const layer = (raw: boolean) =>
    items.map((item, i) =>
      ('raw' in item && !!item.raw) !== raw ? null : (
        <g key={i} className={'cls' in item ? item.cls : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <Mark item={item} delay={start + i * GAP} />
        </g>
      ),
    );
  return (
    <g>
      <g filter="url(#fd-ink)">{layer(false)}</g>
      {layer(true)}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many sheet turns so far, so coming back to a sheet draws it afresh
  starts: Record<string, number>; //when each part began drawing, in seconds after it appeared
}

//new parts are drawn one after another; on a fresh sheet they wait for the old one to fade
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t += ART[page][part].length * GAP + 0.1;
  }
  return starts;
}

function turn(shown: Shown, cue: Cue): { now: Shown; prev?: Shown } {
  if (cue.page === shown.cue.page) {
    const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
    return { now: { ...shown, cue, starts: { ...shown.starts, ...startTimes(added, cue.page, 0.1) } } };
  }
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, cue.page, 0.6) }, prev: shown };
}

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'fd-fade' : undefined}>
      <text className="fd-in" style={{ ...styles.type, fontSize: 18, animationDelay: '0.4s' }} x={48} y={50} fill={C.faint} letterSpacing={3}>
        {SHEET[shown.cue.page]}
      </text>
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  birds: new URL('./sounds/birds.m4a', import.meta.url).href,
  street: new URL('./sounds/street.m4a', import.meta.url).href,
  room: new URL('./sounds/room.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//birdsong in the gardens, the close out front (quieter after dark), and a still room while you pore over the plans
function mixFor(cue: Cue): Partial<Record<Bed, number>> {
  if (cue.page === 'plan') return { room: 0.7 };
  if (cue.page === 'garden') return { birds: 0.8 };
  return cue.parts.includes('night') ? { street: 0.7 } : { street: 0.5, birds: 0.35 };
}

const HAMMER: OneShot = { src: new URL('./sounds/hammer.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 };
const KNOCK: OneShot = { src: new URL('./sounds/knock.m4a', import.meta.url).href, volume: 0.8, delay: 0.5 };
const ONE_SHOTS: Record<string, OneShot> = { hammering: HAMMER, fence_straight: HAMMER, knock: KNOCK };

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2; //seconds

// ---------------------------------------------------------------------------

function Blueprint({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, cues[first].page, 0.6) },
  }));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setView((v) => {
        const next = turn(v.now, cues[animation]);
        return { now: next.now, prev: next.prev ?? v.prev };
      });
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Feud has no cue for the animation "${animation}"`);
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
    sound.current?.mix(mixFor(cues[active]));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { now, prev } = view;
  const { card } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="fd-ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" result="ink" />
            <feGaussianBlur in="ink" stdDeviation="1.6" result="bleed" />
            <feMerge>
              <feMergeNode in="bleed" />
              <feMergeNode in="ink" />
            </feMerge>
          </filter>
          <filter id="fd-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="9" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.2 -0.6" />
          </filter>
          <pattern id="fd-grid" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M 40 0 V 200 M 80 0 V 200 M 120 0 V 200 M 160 0 V 200 M 0 40 H 200 M 0 80 H 200 M 0 120 H 200 M 0 160 H 200" stroke={C.white} strokeWidth="1" strokeOpacity="0.5" fill="none" />
            <path d="M 0.5 0 V 200 M 0 0.5 H 200" stroke={C.white} strokeWidth="2" fill="none" />
          </pattern>
          {(['white', 'red', 'yellow'] as const).map((ink) => (
            <pattern key={ink} id={ink === 'white' ? 'fd-hatch' : `fd-hatch-${ink}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="12" height="12" fill={C.paper} />
              <path d="M 0 0 V 12" stroke={C[ink]} strokeWidth="2" strokeOpacity="0.7" />
            </pattern>
          ))}
          <radialGradient id="fd-vignette" cx="0.5" cy="0.4" r="0.75">
            <stop offset="0.55" stopColor="#0b2546" stopOpacity="0" />
            <stop offset="1" stopColor="#0b2546" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={C.paper} />
        <rect width={W} height={H} fill="url(#fd-grid)" opacity={0.08} />
        <rect width={W} height={H} filter="url(#fd-grain)" opacity={0.12} />
        <rect x={24} y={20} width={W - 48} height={H - 40} fill="none" stroke={C.faint} strokeWidth={2} strokeOpacity={0.5} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
        <rect width={W} height={H} fill="url(#fd-vignette)" pointerEvents="none" />
      </svg>

      <div style={{ ...styles.card, opacity: card ? 1 : 0 }}>
        {card && (
          <div style={styles.block}>
            <div style={styles.kicker}>{card[0]}</div>
            <div style={styles.name}>{card[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.fd-draw {
  stroke-dasharray: 1;
  animation: fd-draw 0.7s ease-in-out both;
}
@keyframes fd-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
.fd-in {
  animation: fd-in 0.5s ease-out both;
}
@keyframes fd-in {
  from { opacity: 0; }
}
.fd-fade {
  animation: fd-fade 0.6s ease-in forwards;
}
@keyframes fd-fade {
  to { opacity: 0; }
}
.fd-shake {
  animation: fd-shake 0.4s linear infinite;
}
@keyframes fd-shake {
  25% { transform: translate(-3px, 1px); }
  75% { transform: translate(3px, -1px); }
}
.fd-blink {
  animation: fd-blink 1.6s steps(1) infinite;
}
@keyframes fd-blink {
  50% { opacity: 0.15; }
}
.fd-fall {
  animation: fd-fall 7s linear infinite;
}
.fd-fall-1 { animation-duration: 9s; animation-delay: -3s; }
.fd-fall-2 { animation-duration: 11s; animation-delay: -6s; }
@keyframes fd-fall {
  from { transform: translate(0, -40px) rotate(0deg); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  to { transform: translate(-120px, 180px) rotate(240deg); opacity: 0; }
}
`;

const LETTERING = "'Avenir Next Condensed', Futura, 'Arial Narrow', 'Helvetica Neue', sans-serif";

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.paper,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: LETTERING,
    fontWeight: 600,
    letterSpacing: 2,
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: LETTERING,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  block: {
    textAlign: 'center',
    padding: '18px 44px 22px',
    background: `${C.paper}e6`,
    border: `3px double ${C.white}`,
    outline: `1px solid ${C.faint}`,
    outlineOffset: 6,
  },
  kicker: {
    fontSize: 20,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: C.faint,
    borderBottom: `1px solid ${C.faint}`,
    paddingBottom: 8,
  },
  name: {
    fontSize: 108,
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: 10,
    textTransform: 'uppercase',
    color: C.white,
    textShadow: `0 0 14px ${C.white}55`,
  },
};

export default Blueprint;
