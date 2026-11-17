import { between, seeded, shuffled } from '../test_kit';

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
