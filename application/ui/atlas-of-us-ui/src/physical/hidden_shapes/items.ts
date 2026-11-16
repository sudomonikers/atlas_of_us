import { between, pick, seeded, shuffled } from '../test_kit';
import { TIMED } from '../timed';

//a line between two neighboring points of a 5 by 5 grid, across, down or diagonal, written "x1,y1 x2,y2"
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
