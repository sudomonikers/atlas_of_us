import { seeded } from '../test_kit';

//how many tries count and how many are practice
export const SHIFT_TRIES = 30;
export const SHIFT_PRACTICE_TRIES = 3;
//how far the sound shifts, as the change in how much sooner it reaches one ear than the other, in microseconds: where
//the tries that count start, the practice's, and how far it can go. 700 is about as far as a head's width allows
export const SHIFT_START = 300;
export const SHIFT_PRACTICE = 600;
export const SHIFT_SMALLEST = 2;
export const SHIFT_LARGEST = 700;
//how the shift changes: smaller after a right answer, bigger after a wrong one. Until the first miss every right
//answer makes it smaller, to find their level quickly, and after that it takes two right in a row, so it settles where
//they get about 7 in 10 right
export const SHIFT_HARDER = 0.7;
export const SHIFT_EASIER = 1 / 0.7;

//which way the sound moves in each try, the same for everyone
const ways = (seed: number, count: number): ('left' | 'right')[] => {
  const random = seeded(seed);
  return Array.from({ length: count }, () => (random() < 0.5 ? 'left' : 'right'));
};
export const SHIFT_PRACTICE_WAYS = ways(5, SHIFT_PRACTICE_TRIES);
export const SHIFT_WAYS = ways(2028, SHIFT_TRIES);
