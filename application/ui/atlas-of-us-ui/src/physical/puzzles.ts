//the items of the Atlas's own reasoning tests, generated from fixed seeds so everyone takes the same test. Their readings
//are compared with each other's, so changing a generator, a seed, a count or a time limit changes the test, and readings
//from before stop being comparable. The counts and time limits match the measurements in the norms seed
//(database/physical_norms_import/src/published.rs)
import { between, pick, seeded, shuffled } from './test_kit';

export const TIMED = {
  matrices: { count: 20, seconds: 600 },
  series: { count: 16, seconds: 480 },
  rotation: { count: 16, seconds: 420 },
  folding: { count: 14, seconds: 420 },
  perspective: { count: 12, seconds: 360 },
  syllogisms: { count: 20, seconds: 420 },
  symbols: { seconds: 90 },
  flanker: { count: 48 },
  cards: { count: 60 },
  words: { count: 20, seconds: 240 },
  hidden: { count: 16, seconds: 360 },
  tapping: { tries: 3, seconds: 10 },
  tracking: { seconds: 45 },
  timing: { count: 20 },
  steering: { seconds: 60 },
  trackCount: { seconds: 60 },
  animals: { seconds: 60 },
  uses: { seconds: 120 },
};

// ---------------------------------------------------------------------------------------------------------------------
// Matrix puzzles: a 3 by 3 grid of figures that change by rules across the rows, with the last one missing
// ---------------------------------------------------------------------------------------------------------------------

//a figure in a cell: which shape (circle, square, triangle or diamond), how many, how big and how dark
export interface Figure {
  shape: number;
  count: number;
  size: number;
  shade: number;
}

export interface Matrix {
  cells: Figure[]; //the first eight cells, row by row
  choices: Figure[];
  answer: number;
}

type Feature = keyof Figure;
const FEATURES: Feature[] = ['shape', 'count', 'size', 'shade'];
const LEVELS: Record<Feature, number[]> = { shape: [0, 1, 2, 3], count: [1, 2, 3], size: [0, 1, 2], shade: [0, 1, 2] };
//how a feature changes: the same everywhere, one value to each row, one value to each column, or each row having all
//three values in turn
type Rule = 'same' | 'rows' | 'columns' | 'rotate';

const key = (f: Figure) => `${f.shape}${f.count}${f.size}${f.shade}`;

function matrix(random: () => number, changing: number, rules: Rule[]): Matrix {
  const varied = shuffled(random, FEATURES).slice(0, changing);
  const plan = FEATURES.map((feature) => {
    const values = shuffled(random, LEVELS[feature]).slice(0, 3);
    const rule: Rule = varied.includes(feature) ? pick(random, rules) : 'same';
    const turn = random() < 0.5 ? 1 : 2; //which way a rotation runs
    return { feature, values, rule, turn };
  });
  const at = (row: number, col: number): Figure => {
    const f = { shape: 0, count: 1, size: 0, shade: 0 };
    for (const { feature, values, rule, turn } of plan) {
      f[feature] = values[rule === 'same' ? 0 : rule === 'rows' ? row : rule === 'columns' ? col : (col + row * turn) % 3];
    }
    return f;
  };
  const cells = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => at(row, col)));
  const answer = cells.pop()!;

  //the wrong choices each change one feature of the right one, the changing features first
  const wrong: Figure[] = [];
  const seen = new Set([key(answer)]);
  const order = [...varied, ...shuffled(random, FEATURES.filter((f) => !varied.includes(f)))];
  for (let tries = 0; wrong.length < 5 && tries < 200; tries++) {
    const feature = order[tries % order.length];
    const other = { ...answer, [feature]: pick(random, LEVELS[feature].filter((v) => v !== answer[feature])) };
    if (tries >= order.length * 3) {
      const second = pick(random, FEATURES.filter((f) => f !== feature));
      other[second] = pick(random, LEVELS[second].filter((v) => v !== answer[second]));
    }
    if (!seen.has(key(other))) {
      seen.add(key(other));
      wrong.push(other);
    }
  }
  const choices = shuffled(random, [answer, ...wrong]);
  return { cells, choices, answer: choices.indexOf(answer) };
}

//how many features change in each puzzle, and by which rules, easiest first
function matrices(seed: number, plan: [number, Rule[]][]): Matrix[] {
  const random = seeded(seed);
  return plan.map(([changing, rules]) => matrix(random, changing, rules));
}

const SIMPLE: Rule[] = ['rows', 'columns'];
const ANY: Rule[] = ['rows', 'columns', 'rotate'];
const HARD: Rule[] = ['rotate', 'rotate', 'rows', 'columns'];

export const MATRIX_PRACTICE = matrices(11, [[1, ['columns']], [2, SIMPLE]]);
export const MATRIX_ITEMS = matrices(2026, [
  ...Array<[number, Rule[]]>(4).fill([1, SIMPLE]),
  ...Array<[number, Rule[]]>(6).fill([2, ANY]),
  ...Array<[number, Rule[]]>(6).fill([3, HARD]),
  ...Array<[number, Rule[]]>(4).fill([4, HARD]),
]);

// ---------------------------------------------------------------------------------------------------------------------
// Number series: work out the rule and type the next number
// ---------------------------------------------------------------------------------------------------------------------

export interface NumberSeries {
  shown: number[];
  answer: number;
}

//each rule makes a series of `length` numbers from random settings, easiest first
const RULES: ((r: () => number) => number[])[] = [
  (r) => { const a = between(r, 2, 9), s = between(r, 1, 20); return Array.from({ length: 7 }, (_, i) => s + a * i); },
  (r) => { const a = between(r, 3, 9), s = between(r, 60, 99); return Array.from({ length: 7 }, (_, i) => s - a * i); },
  (r) => { const s = between(r, 1, 5); return Array.from({ length: 7 }, (_, i) => s * 2 ** i); },
  (r) => { let x = between(r, 1, 10), d = between(r, 1, 3); return Array.from({ length: 7 }, () => { const v = x; x += d++; return v; }); },
  (r) => { const a = between(r, 2, 5), b = between(r, 6, 10); let x = between(r, 1, 10); return Array.from({ length: 7 }, (_, i) => { const v = x; x += i % 2 ? b : a; return v; }); },
  (r) => { const a = between(r, 2, 6), b = between(r, 1, 4); let x = between(r, 1, 9), y = between(r, 40, 60); return Array.from({ length: 8 }, (_, i) => { if (i % 2) { const v = y; y -= b; return v; } const v = x; x += a; return v; }); },
  (r) => { const k = between(r, 1, 4); return Array.from({ length: 6 }, (_, i) => (k + i) ** 2); },
  (r) => { const c = between(r, 1, 4); let x = between(r, 1, 4); return Array.from({ length: 7 }, (_, i) => { const v = x; x = i % 2 ? x + c : x * 2; return v; }); },
  (r) => { const out = [between(r, 1, 4), between(r, 2, 6)]; while (out.length < 7) out.push(out[out.length - 1] + out[out.length - 2]); return out; },
  (r) => { let x = between(r, 3, 12), d = between(r, 1, 3); return Array.from({ length: 7 }, () => { const v = x; x += d; d *= 2; return v; }); },
  (r) => { const a = between(r, 2, 4); let x = between(r, 1, 6); return Array.from({ length: 7 }, (_, i) => { const v = x; x += (i + 1) * a; return v; }); },
  (r) => { const s = between(r, 1, 3); return Array.from({ length: 6 }, (_, i) => s * 3 ** i); },
  (r) => { const a = between(r, 1, 5); let x = between(r, 6, 12); return Array.from({ length: 7 }, (_, i) => { const v = x; x = i % 2 ? x - a : x * 2; return v; }); },
  (r) => { const k = between(r, 1, 3); return Array.from({ length: 6 }, (_, i) => (k + i) ** 3); },
  (r) => { let x = between(r, 1, 3), y = between(r, 1, 9); const c = between(r, 2, 5); return Array.from({ length: 8 }, (_, i) => { if (i % 2) { const v = y; y += c; return v; } const v = x; x *= 2; return v; }); },
  (r) => { let x = between(r, 2, 5); const c = between(r, 1, 3); return Array.from({ length: 6 }, () => { const v = x; x = x * 2 + c; return v; }); },
];

function series(seed: number, rules: number[]): NumberSeries[] {
  const random = seeded(seed);
  return rules.map((i) => {
    const all = RULES[i](random);
    return { shown: all.slice(0, -1), answer: all[all.length - 1] };
  });
}

export const SERIES_PRACTICE = series(11, [0, 2]);
export const SERIES_ITEMS = series(2026, RULES.map((_, i) => i));

// ---------------------------------------------------------------------------------------------------------------------
// Shape rotation: which of four block shapes is the first one turned? The others are its mirror image
// ---------------------------------------------------------------------------------------------------------------------

export type Cube = [number, number, number];
type Matrix3 = number[][];

const multiply = (a: Matrix3, b: Matrix3): Matrix3 => a.map((row) => [0, 1, 2].map((j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));
const apply = (m: Matrix3, [x, y, z]: Cube): Cube => [m[0][0] * x + m[0][1] * y + m[0][2] * z, m[1][0] * x + m[1][1] * y + m[1][2] * z, m[2][0] * x + m[2][1] * y + m[2][2] * z];

//the 24 ways to turn a shape so its blocks stay lined up with the axes
const TURNS: Matrix3[] = (() => {
  const x = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
  const y = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  const out: Matrix3[] = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]];
  for (let i = 0; i < out.length; i++) {
    for (const step of [x, y]) {
      const next = multiply(step, out[i]);
      if (!out.some((m) => m.every((row, r) => row.every((v, c) => v === next[r][c])))) out.push(next);
    }
  }
  return out;
})();

//a shape written the same way wherever it sits, for comparing
const canonical = (cubes: Cube[]) => {
  const min = [0, 1, 2].map((a) => Math.min(...cubes.map((c) => c[a])));
  return cubes.map((c) => c.map((v, a) => v - min[a]).join(',')).sort().join(' ');
};
const sameShape = (a: Cube[], b: Cube[]) => TURNS.some((t) => canonical(a.map((c) => apply(t, c))) === canonical(b));
const mirror = (cubes: Cube[]): Cube[] => cubes.map(([x, y, z]) => [-x, y, z]);

//a shape of blocks in four straight arms, each at a right angle to the last, in all three directions, and different
//from its mirror image
function blocks(random: () => number): Cube[] {
  const axes: Cube[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (;;) {
    const cubes: Cube[] = [[0, 0, 0]];
    let previous: Cube | null = null;
    let ok = true;
    for (const length of [between(random, 2, 3), between(random, 2, 3), between(random, 2, 3), between(random, 1, 2)]) {
      const choices = axes.filter((a) => !previous || a.every((v, i) => v * previous![i] === 0));
      const step = pick(random, choices);
      for (let i = 0; i < length; i++) {
        const last = cubes[cubes.length - 1];
        const next: Cube = [last[0] + step[0], last[1] + step[1], last[2] + step[2]];
        if (cubes.some((c) => c.every((v, j) => v === next[j]))) ok = false;
        cubes.push(next);
      }
      previous = step;
    }
    const spread = [0, 1, 2].every((a) => new Set(cubes.map((c) => c[a])).size > 1);
    if (ok && spread && !sameShape(cubes, mirror(cubes))) return cubes;
  }
}

export interface Rotation {
  target: Cube[];
  choices: Cube[][];
  answer: number;
}

function rotations(seed: number, count: number): Rotation[] {
  const random = seeded(seed);
  return Array.from({ length: count }, () => {
    const shape = blocks(random);
    const turns = shuffled(random, TURNS.slice(1));
    const target = shape.map((c) => apply(turns[0], c));
    const right = shape.map((c) => apply(turns[1], c));
    const mirrored = mirror(shape);
    const wrong = [2, 3, 4].map((i) => mirrored.map((c) => apply(turns[i], c)));
    const choices = shuffled(random, [right, ...wrong]);
    return { target, choices, answer: choices.indexOf(right) };
  });
}

export const ROTATION_PRACTICE = rotations(11, 2);
export const ROTATION_ITEMS = rotations(2026, TIMED.rotation.count);

// ---------------------------------------------------------------------------------------------------------------------
// Paper folding: a square of paper is folded in half one to three times and a hole punched through, then unfolded
// ---------------------------------------------------------------------------------------------------------------------

//which half is folded over onto the other
export type Fold = 'left' | 'right' | 'top' | 'bottom';
//the paper is 4 by 4 squares, and a hole is at the middle of a square, as [column, row]
export const PAPER = 4;
export type Hole = [number, number];
export interface Region {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Folding {
  folds: Fold[];
  punch: Hole;
  choices: Hole[][];
  answer: number;
}

const across = (f: Fold) => f === 'left' || f === 'right';

//the part of the paper left showing after each fold, the whole sheet first
export function regions(folds: Fold[]): Region[] {
  const out: Region[] = [{ x0: 0, x1: PAPER, y0: 0, y1: PAPER }];
  for (const f of folds) {
    const r = { ...out[out.length - 1] };
    const mid = across(f) ? (r.x0 + r.x1) / 2 : (r.y0 + r.y1) / 2;
    if (f === 'left') r.x0 = mid;
    if (f === 'right') r.x1 = mid;
    if (f === 'top') r.y0 = mid;
    if (f === 'bottom') r.y1 = mid;
    out.push(r);
  }
  return out;
}

const holeKey = (holes: Hole[]) => holes.map((h) => h.join(',')).sort().join(' ');

//the holes once the paper's unfolded: each fold, last first, mirrors every hole across its line. `skip` leaves a fold
//out and `wrongWay` mirrors it the other way, which are the mistakes the wrong choices make
function unfold(folds: Fold[], punch: Hole, skip = -1, wrongWay = -1): Hole[] {
  const shown = regions(folds);
  let holes: Hole[] = [punch];
  for (let i = folds.length - 1; i >= 0; i--) {
    if (i === skip) continue;
    const r = shown[i];
    const vertical = across(folds[i]) !== (i === wrongWay);
    const mid = vertical ? (r.x0 + r.x1) / 2 : (r.y0 + r.y1) / 2;
    const mirrored = holes.map(([x, y]): Hole => (vertical ? [2 * mid - 1 - x, y] : [x, 2 * mid - 1 - y]));
    holes = [...holes, ...mirrored].filter(([x, y]) => x >= 0 && y >= 0 && x < PAPER && y < PAPER);
    holes = holes.filter((h, j) => holes.findIndex((o) => o[0] === h[0] && o[1] === h[1]) === j);
  }
  return holes;
}

function foldings(seed: number, counts: number[]): Folding[] {
  const random = seeded(seed);
  return counts.map((count) => {
    const folds: Fold[] = [];
    while (folds.length < count) {
      const r = regions(folds)[folds.length];
      const options: Fold[] = [...(r.x1 - r.x0 >= 2 ? (['left', 'right'] as Fold[]) : []), ...(r.y1 - r.y0 >= 2 ? (['top', 'bottom'] as Fold[]) : [])];
      folds.push(pick(random, options));
    }
    const last = regions(folds)[folds.length];
    const punch: Hole = [between(random, last.x0, last.x1 - 1), between(random, last.y0, last.y1 - 1)];
    const right = unfold(folds, punch);

    //the wrong choices: a fold left out, a fold mirrored the wrong way, or the right holes with one moved
    const wrong: Hole[][] = [];
    const seen = new Set([holeKey(right)]);
    const add = (holes: Hole[]) => {
      if (holes.length && !seen.has(holeKey(holes)) && wrong.length < 4) {
        seen.add(holeKey(holes));
        wrong.push(holes);
      }
    };
    folds.forEach((_, i) => add(unfold(folds, punch, i)));
    folds.forEach((_, i) => add(unfold(folds, punch, -1, i)));
    for (let tries = 0; wrong.length < 4 && tries < 100; tries++) {
      const moved = right.map((h): Hole => [...h]);
      const which = between(random, 0, moved.length - 1);
      const [dx, dy] = pick(random, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      moved[which] = [moved[which][0] + dx, moved[which][1] + dy];
      if (moved.every(([x, y]) => x >= 0 && y >= 0 && x < PAPER && y < PAPER) && new Set(moved.map((h) => h.join())).size === moved.length) add(moved);
    }
    const choices = shuffled(random, [right, ...wrong]);
    return { folds, punch, choices, answer: choices.indexOf(right) };
  });
}

export const FOLDING_PRACTICE = foldings(11, [1, 1]);
export const FOLDING_ITEMS = foldings(2026, [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3]);

// ---------------------------------------------------------------------------------------------------------------------
// Perspective taking: stand at one thing on a map, face a second, and point to a third
// ---------------------------------------------------------------------------------------------------------------------

export interface Landmark {
  name: string;
  x: number; //across the map, 0 to 1
  y: number; //down the map, 0 to 1
}

export const MAP: Landmark[] = [
  { name: 'Bench', x: 0.18, y: 0.24 },
  { name: 'Well', x: 0.74, y: 0.14 },
  { name: 'Flag', x: 0.47, y: 0.47 },
  { name: 'Tent', x: 0.12, y: 0.72 },
  { name: 'Barrel', x: 0.86, y: 0.58 },
  { name: 'Cart', x: 0.56, y: 0.88 },
  { name: 'Lamp', x: 0.4, y: 0.08 },
];

export interface Perspective {
  at: number; //places on the map
  facing: number;
  target: number;
  angle: number; //the right answer: degrees clockwise from straight ahead, -180 to 180
}

//degrees clockwise from one direction to another on the map, -180 to 180
export const turn = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;
const heading = (a: Landmark, b: Landmark) => (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;

function perspectives(seed: number, count: number): Perspective[] {
  const random = seeded(seed);
  const out: Perspective[] = [];
  const used = new Set<string>();
  while (out.length < count) {
    const [at, facing, target] = shuffled(random, MAP.map((_, i) => i)).slice(0, 3);
    const angle = Math.round(turn(heading(MAP[at], MAP[facing]), heading(MAP[at], MAP[target])));
    const id = `${at}${facing}${target}`;
    //nothing nearly straight ahead or behind, and as many to the left as to the right
    const side = angle < 0 ? 'left' : 'right';
    const lefts = out.filter((p) => p.angle < 0).length;
    if (used.has(id) || Math.abs(angle) < 25 || Math.abs(angle) > 165) continue;
    if ((side === 'left' ? lefts : out.length - lefts) >= count / 2) continue;
    used.add(id);
    out.push({ at, facing, target, angle });
  }
  return out;
}

export const PERSPECTIVE_PRACTICE = perspectives(11, 2);
export const PERSPECTIVE_ITEMS = perspectives(2026, TIMED.perspective.count);

// ---------------------------------------------------------------------------------------------------------------------
// Syllogisms: does the conclusion follow from what's given? The words are made up, so only the logic counts
// ---------------------------------------------------------------------------------------------------------------------

export interface Syllogism {
  premises: string[];
  conclusion: string;
  follows: boolean;
}

//made-up things, one and many, all taking "a"
const WORDS: [string, string][] = [
  ['blicket', 'blickets'], ['dax', 'daxes'], ['wug', 'wugs'], ['fep', 'feps'], ['tove', 'toves'], ['glork', 'glorks'],
  ['zib', 'zibs'], ['marn', 'marns'], ['plink', 'plinks'], ['quob', 'quobs'], ['sneeb', 'sneebs'], ['vorp', 'vorps'],
  ['trell', 'trells'], ['gnarf', 'gnarfs'], ['yint', 'yints'], ['lume', 'lumes'],
];

//forms of argument, with {A} to {D} for many and {a} to {d} for one, and whether the conclusion follows. Tib is a
//made-up name for one thing
const FORMS: [string[], string, boolean][] = [
  [['All {A} are {B}.', 'All {B} are {C}.'], 'All {A} are {C}.', true],
  [['All {A} are {B}.', 'All {C} are {B}.'], 'All {A} are {C}.', false],
  [['No {A} are {B}.', 'All {C} are {A}.'], 'No {C} are {B}.', true],
  [['All {A} are {B}.', 'Some {B} are {C}.'], 'Some {A} are {C}.', false],
  [['All {A} are {B}.', 'Some {C} are {A}.'], 'Some {C} are {B}.', true],
  [['Some {A} are {B}.', 'Some {B} are {C}.'], 'Some {A} are {C}.', false],
  [['If something is a {a}, it is a {b}.', 'Tib is a {a}.'], 'Tib is a {b}.', true],
  [['If something is a {a}, it is a {b}.', 'Tib is a {b}.'], 'Tib is a {a}.', false],
  [['No {A} are {B}.', 'Some {C} are {A}.'], 'Some {C} are not {B}.', true],
  [['No {A} are {B}.', 'No {B} are {C}.'], 'No {A} are {C}.', false],
  [['If something is a {a}, it is a {b}.', 'Tib is not a {b}.'], 'Tib is not a {a}.', true],
  [['If something is a {a}, it is a {b}.', 'Tib is not a {a}.'], 'Tib is not a {b}.', false],
  [['All {A} are {B}.', 'No {C} are {B}.'], 'No {C} are {A}.', true],
  [['All {A} are {B}.', 'No {C} are {A}.'], 'No {C} are {B}.', false],
  [['Tib is a {a} or a {b}.', 'Tib is not a {a}.'], 'Tib is a {b}.', true],
  [['All {A} are {B}.'], 'All {B} are {A}.', false],
  [['Some {A} are not {B}.', 'All {C} are {B}.'], 'Some {A} are not {C}.', true],
  [['Some {A} are not {B}.', 'Some {B} are {C}.'], 'Some {A} are not {C}.', false],
  [['All {A} are {B}.', 'All {B} are {C}.', 'No {C} are {D}.'], 'No {A} are {D}.', true],
  [['All {A} are {B}.', 'All {B} are {C}.', 'Some {C} are {D}.'], 'Some {A} are {D}.', false],
];

const PRACTICE_FORMS: [string[], string, boolean][] = [
  [['All {A} are {B}.', 'Tib is a {a}.'], 'Tib is a {b}.', true],
  [['All {A} are {B}.', 'Tib is a {b}.'], 'Tib is a {a}.', false],
];

function syllogisms(seed: number, forms: [string[], string, boolean][]): Syllogism[] {
  const random = seeded(seed);
  return shuffled(random, forms).map(([premises, conclusion, follows]) => {
    const words = shuffled(random, WORDS);
    const fill = (s: string) => s.replace(/\{([ABCDabcd])\}/g, (_, t: string) => {
      const [one, many] = words['abcd'.indexOf(t.toLowerCase())];
      return t === t.toUpperCase() ? many : one;
    });
    return { premises: premises.map(fill), conclusion: fill(conclusion), follows };
  });
}

export const SYLLOGISM_PRACTICE = syllogisms(11, PRACTICE_FORMS);
export const SYLLOGISM_ITEMS = syllogisms(2026, FORMS);

// ---------------------------------------------------------------------------------------------------------------------
// Symbol matching: the digit that goes with each symbol, from a key of nine
// ---------------------------------------------------------------------------------------------------------------------

//nine symbols, drawn in a 20 by 20 box, none of them a letter or a digit
export const SYMBOLS = [
  'M4 4 L16 16 M16 4 L4 16',
  'M10 3 A7 7 0 1 0 10.01 3 M10 8 L10 12',
  'M3 16 L10 4 L17 16',
  'M4 4 H16 V16',
  'M10 3 V17 M3 10 H17 M3 3 L6 3',
  'M4 7 Q10 1 16 7 M4 13 Q10 19 16 13',
  'M4 4 L16 4 L4 16 L16 16',
  'M10 3 L17 10 L10 17 L3 10 Z',
  'M3 10 H17 M6 5 H14 M6 15 H14',
];

//which digit goes with each symbol, and the order the symbols come in: never the same one twice running
function symbolRun(seed: number, length: number) {
  const random = seeded(seed);
  const key = shuffled(random, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const run: number[] = [];
  while (run.length < length) {
    const s = between(random, 0, 8);
    if (s !== run[run.length - 1]) run.push(s);
  }
  return { key, run };
}

export const SYMBOL_KEY = symbolRun(2026, 200).key;
export const SYMBOL_PRACTICE = symbolRun(11, 6).run;
export const SYMBOL_RUN = symbolRun(2026, 200).run;

// ---------------------------------------------------------------------------------------------------------------------
// Distracting arrows: which way the middle arrow points, with the arrows around it pointing the same way or the other
// ---------------------------------------------------------------------------------------------------------------------

export interface Arrows {
  left: boolean; //which way the middle one points
  same: boolean; //whether the ones around it point the same way
}

function arrows(seed: number, count: number): Arrows[] {
  const random = seeded(seed);
  return shuffled(random, Array.from({ length: count }, (_, i) => ({ left: i % 2 === 0, same: i % 4 < 2 })));
}

export const ARROWS_PRACTICE = arrows(11, 8);
export const ARROWS = arrows(2026, TIMED.flanker.count);

// ---------------------------------------------------------------------------------------------------------------------
// Card sorting: sort each card onto one of four by colour, shape or number, by a rule that changes
// ---------------------------------------------------------------------------------------------------------------------

export interface Card {
  colour: number;
  shape: number;
  number: number; //1 to 4
}

export type SortRule = 'colour' | 'shape' | 'number';
export const SORT_RULES: SortRule[] = ['colour', 'shape', 'number'];
//the four cards sorted onto: one red triangle, two green stars, three yellow crosses, four blue circles
export const KEY_CARDS: Card[] = [0, 1, 2, 3].map((i) => ({ colour: i, shape: i, number: i + 1 }));
//how many right in a row before the rule changes
export const RUN_TO_CHANGE = 6;

//cards that match no key card on more than one thing, so it's always clear which rule a sort follows
function cards(seed: number, count: number): Card[] {
  const random = seeded(seed);
  const out: Card[] = [];
  while (out.length < count) {
    const c = { colour: between(random, 0, 3), shape: between(random, 0, 3), number: between(random, 1, 4) };
    const clear = KEY_CARDS.every((k) => Number(k.colour === c.colour) + Number(k.shape === c.shape) + Number(k.number === c.number) <= 1);
    if (clear) out.push(c);
  }
  return out;
}

export const CARDS_PRACTICE = cards(11, 4);
export const CARDS = cards(2026, TIMED.cards.count);

// ---------------------------------------------------------------------------------------------------------------------
// Broken words: read a word with much of it hidden
// ---------------------------------------------------------------------------------------------------------------------

export interface BrokenWord {
  word: string;
  hidden: number[]; //the squares covered, of WORD_COLUMNS by WORD_ROWS
}

export const WORD_COLUMNS = 40;
export const WORD_ROWS = 12;
const WORDS_TO_READ = [
  'garden', 'window', 'bridge', 'candle', 'planet', 'rocket', 'silver', 'winter', 'forest', 'button', 'pencil', 'basket',
  'dragon', 'ladder', 'castle', 'orange', 'hammer', 'pocket', 'island', 'mirror',
];

//each word with a share of it hidden, from `from` of it showing to `to`
function brokenWords(seed: number, words: string[], from: number, to: number): BrokenWord[] {
  const random = seeded(seed);
  const cells = Array.from({ length: WORD_COLUMNS * WORD_ROWS }, (_, i) => i);
  return shuffled(random, words).map((word, i) => {
    const showing = words.length > 1 ? from + ((to - from) * i) / (words.length - 1) : from;
    return { word, hidden: shuffled(random, cells).slice(0, Math.round(cells.length * (1 - showing))) };
  });
}

export const WORDS_PRACTICE = brokenWords(11, ['apple', 'house'], 0.6, 0.5);
export const BROKEN_WORDS = brokenWords(2026, WORDS_TO_READ, 0.5, 0.26);

// ---------------------------------------------------------------------------------------------------------------------
// Hidden shapes: which drawing has the simple shape hidden in it, the same size and the same way up
// ---------------------------------------------------------------------------------------------------------------------

//a line between two neighbouring points of a 5 by 5 grid, across, down or diagonal, written "x1,y1 x2,y2"
export type Stroke = string;
export const GRID = 5;

const stroke = (a: [number, number], b: [number, number]): Stroke => {
  const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
  return `${p[0]},${p[1]} ${q[0]},${q[1]}`;
};
export const ends = (s: Stroke) => s.split(' ').map((p) => p.split(',').map(Number)) as [number, number][];
const STEPS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
const onGrid = ([x, y]: [number, number]) => x >= 0 && y >= 0 && x < GRID && y < GRID;
const moved = (s: Stroke, dx: number, dy: number): Stroke | null => {
  const [a, b] = ends(s);
  const p: [number, number] = [a[0] + dx, a[1] + dy];
  const q: [number, number] = [b[0] + dx, b[1] + dy];
  return onGrid(p) && onGrid(q) ? stroke(p, q) : null;
};
//whether a drawing has the shape in it anywhere, the same way up
const contains = (drawing: Set<Stroke>, shape: Stroke[]) => {
  for (let dx = -GRID; dx <= GRID; dx++) {
    for (let dy = -GRID; dy <= GRID; dy++) {
      if (shape.every((s) => { const m = moved(s, dx, dy); return m !== null && drawing.has(m); })) return true;
    }
  }
  return false;
};

export interface HiddenShape {
  shape: Stroke[];
  choices: Stroke[][];
  answer: number;
}

//strokes added to a drawing until it has `size`, each joined to a point already in it so the shape blends in
function fill(random: () => number, start: Set<Stroke>, size: number) {
  const drawing = new Set(start);
  while (drawing.size < size) {
    const points = [...drawing].flatMap(ends);
    const from = points.length ? pick(random, points) : ([between(random, 0, GRID - 1), between(random, 0, GRID - 1)] as [number, number]);
    const [dx, dy] = pick(random, STEPS);
    const to: [number, number] = [from[0] + dx, from[1] + dy];
    if (onGrid(to)) drawing.add(stroke(from, to));
  }
  return drawing;
}

function hiddenShapes(seed: number, count: number, size: number): HiddenShape[] {
  const random = seeded(seed);
  return Array.from({ length: count }, () => {
    //a shape of four joined strokes within three squares by three
    let shape: Stroke[] = [];
    while (shape.length < 4) {
      shape = [];
      let at: [number, number] = [between(random, 0, 3), between(random, 0, 3)];
      for (let tries = 0; tries < 40 && shape.length < 4; tries++) {
        const [dx, dy] = pick(random, STEPS);
        const to: [number, number] = [at[0] + dx, at[1] + dy];
        const s = stroke(at, to);
        if (to[0] >= 0 && to[1] >= 0 && to[0] <= 3 && to[1] <= 3 && !shape.includes(s)) {
          shape.push(s);
          at = to;
        }
      }
    }
    const [dx, dy] = [between(random, 0, 1), between(random, 0, 1)];
    const placed = shape.map((s) => moved(s, dx, dy)!);
    const right = [...fill(random, new Set(placed), size)];
    const wrong: Stroke[][] = [];
    while (wrong.length < 3) {
      //the shape with one stroke moved, buried the same way, which doesn't have the shape anywhere in it
      const near = new Set(placed);
      near.delete(pick(random, placed));
      const d = fill(random, near, size);
      if (!contains(d, shape)) wrong.push([...d]);
    }
    const choices = shuffled(random, [right, ...wrong]);
    return { shape, choices, answer: choices.indexOf(right) };
  });
}

export const HIDDEN_PRACTICE = hiddenShapes(11, 2, 9);
export const HIDDEN_ITEMS = hiddenShapes(2026, TIMED.hidden.count, 14);

// ---------------------------------------------------------------------------------------------------------------------
// Tracking: the path a drifting dot follows, the same for everyone, as shares of the box's width and height
// ---------------------------------------------------------------------------------------------------------------------

function drift(seed: number) {
  const random = seeded(seed);
  const waves = Array.from({ length: 6 }, () => ({ speed: 0.25 + random() * 0.9, phase: random() * Math.PI * 2 }));
  return (seconds: number): [number, number] => [
    0.5 + 0.28 * Math.sin(waves[0].speed * seconds + waves[0].phase) + 0.1 * Math.sin(waves[1].speed * 2.3 * seconds + waves[1].phase) + 0.05 * Math.sin(waves[2].speed * 3.7 * seconds + waves[2].phase),
    0.5 + 0.28 * Math.sin(waves[3].speed * seconds + waves[3].phase) + 0.1 * Math.sin(waves[4].speed * 2.9 * seconds + waves[4].phase) + 0.05 * Math.sin(waves[5].speed * 4.1 * seconds + waves[5].phase),
  ];
}

export const TRACKING_PATH = drift(2026);
export const TRACK_COUNT_PATH = drift(7);

//the beeps of Track and Count: when each starts, in seconds from the start, and whether it's high
function beeps(seed: number, seconds: number) {
  const random = seeded(seed);
  const out: { at: number; high: boolean }[] = [];
  for (let at = 2 + random() * 1.5; at < seconds - 1; at += 1.2 + random() * 1.6) out.push({ at, high: random() < 0.5 });
  return out;
}

export const BEEPS = beeps(2026, TIMED.trackCount.seconds);

// ---------------------------------------------------------------------------------------------------------------------
// Timing: how long the dot takes to reach the line on each try, in seconds, and whether the end of its path is hidden
// ---------------------------------------------------------------------------------------------------------------------

function timings(seed: number, count: number) {
  const random = seeded(seed);
  return shuffled(random, Array.from({ length: count }, (_, i) => ({ seconds: 0.8 + random() * 1.4, hidden: i % 2 === 1 })));
}

export const TIMING_PRACTICE = timings(11, 3);
export const TIMINGS = timings(2026, TIMED.timing.count);

// ---------------------------------------------------------------------------------------------------------------------
// Two-hand steering: where each target is, as shares of the box's width and height
// ---------------------------------------------------------------------------------------------------------------------

function targets(seed: number, count: number): [number, number][] {
  const random = seeded(seed);
  const out: [number, number][] = [[0.5, 0.5]];
  while (out.length <= count) {
    const t: [number, number] = [0.1 + random() * 0.8, 0.1 + random() * 0.8];
    const [x, y] = out[out.length - 1];
    if (Math.hypot(t[0] - x, t[1] - y) > 0.3) out.push(t);
  }
  return out.slice(1);
}

export const STEERING_TARGETS = targets(2026, 120);

// ---------------------------------------------------------------------------------------------------------------------
// Side vision: where each flash is, in degrees from the middle, minus for left, and null for none
// ---------------------------------------------------------------------------------------------------------------------

export const SIDE_ANGLES = [10, 20, 25, 30];
function flashes(seed: number) {
  const random = seeded(seed);
  const all = SIDE_ANGLES.flatMap((a) => [a, a, a, -a, -a, -a]);
  return shuffled(random, [...all, null, null, null, null] as (number | null)[]);
}

export const SIDE_PRACTICE: (number | null)[] = [20, -20, null, -10];
export const SIDE_FLASHES = flashes(2026);

// ---------------------------------------------------------------------------------------------------------------------
// Odd colour out: the hues the tiles start from, in turn
// ---------------------------------------------------------------------------------------------------------------------

export const COLOUR_TRIES = 30;
export const COLOUR_HUES = (() => {
  const random = seeded(2026);
  return Array.from({ length: COLOUR_TRIES }, (_, i) => ((i * 47 + random() * 20) % 360));
})();
