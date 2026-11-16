import { between, pick, seeded, shuffled } from '../test_kit';
import { TIMED } from '../timed';

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
