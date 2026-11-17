import { between, seeded } from '../test_kit';
import { TIMED } from '../timed';

export interface Card {
  color: number;
  shape: number;
  number: number; //1 to 4
}

export type SortRule = 'color' | 'shape' | 'number';
export const SORT_RULES: SortRule[] = ['color', 'shape', 'number'];
//the four cards sorted onto: one red triangle, two green stars, three yellow crosses, four blue circles
export const KEY_CARDS: Card[] = [0, 1, 2, 3].map((i) => ({ color: i, shape: i, number: i + 1 }));
//how many right in a row before the rule changes
export const RUN_TO_CHANGE = 6;

//cards that match no key card on more than one thing, so it's always clear which rule a sort follows
function cards(seed: number, count: number): Card[] {
  const random = seeded(seed);
  const out: Card[] = [];
  while (out.length < count) {
    const c = { color: between(random, 0, 3), shape: between(random, 0, 3), number: between(random, 1, 4) };
    const clear = KEY_CARDS.every((k) => Number(k.color === c.color) + Number(k.shape === c.shape) + Number(k.number === c.number) <= 1);
    if (clear) out.push(c);
  }
  return out;
}

export const CARDS_PRACTICE = cards(11, 4);
export const CARDS = cards(2026, TIMED.cards.count);
