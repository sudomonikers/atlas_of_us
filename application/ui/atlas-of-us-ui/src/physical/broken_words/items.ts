import { seeded, shuffled } from '../test_kit';

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
