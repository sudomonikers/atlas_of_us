import { pick, seeded, shuffled } from '../test_kit';

//a figure in a cell: which shape (circle, square, triangle or diamond), how many, how big and what color
export interface Figure {
  shape: number;
  count: number;
  size: number;
  color: number;
}

export interface Matrix {
  cells: Figure[]; //the first eight cells, row by row
  choices: Figure[];
  answer: number;
}

type Feature = keyof Figure;
const FEATURES: Feature[] = ['shape', 'count', 'size', 'color'];
const LEVELS: Record<Feature, number[]> = { shape: [0, 1, 2, 3], count: [1, 2, 3], size: [0, 1, 2], color: [0, 1, 2] };
//how a feature changes: the same everywhere, one value to each row, one value to each column, or each row having all
//three values in turn
type Rule = 'same' | 'rows' | 'columns' | 'rotate';

const key = (f: Figure) => `${f.shape}${f.count}${f.size}${f.color}`;

function matrix(random: () => number, changing: number, rules: Rule[]): Matrix {
  const varied = shuffled(random, FEATURES).slice(0, changing);
  const plan = FEATURES.map((feature) => {
    const values = shuffled(random, LEVELS[feature]).slice(0, 3);
    const rule: Rule = varied.includes(feature) ? pick(random, rules) : 'same';
    const turn = random() < 0.5 ? 1 : 2; //which way a rotation runs
    return { feature, values, rule, turn };
  });
  const at = (row: number, col: number): Figure => {
    const f = { shape: 0, count: 1, size: 0, color: 0 };
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
