import { seeded, shuffled } from '../test_kit';
import { TIMED } from '../timed';

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
