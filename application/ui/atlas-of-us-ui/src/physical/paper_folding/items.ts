import { between, pick, seeded, shuffled } from '../test_kit';

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
