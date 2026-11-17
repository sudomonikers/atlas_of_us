import { DIGITS } from '../spoken_digits';
import { seeded } from '../test_kit';

//how many rounds count, as in the published digits-in-noise test, and how many practice rounds come first
export const NOISE_ROUNDS = 24;
//the level of his voice against the noise, in dB: where it starts, how far each round moves it, and how far it can go.
//A round with all three digits right makes it 2 quieter and a miss 2 louder, so it settles where they get half the
//rounds right, as in the published test
export const NOISE_START = 0;
export const NOISE_STEP = 2;
export const NOISE_LOWEST = -24;
export const NOISE_HIGHEST = 12;

//three different digits for each round
function triplets(seed: number, count: number): number[][] {
  const random = seeded(seed);
  return Array.from({ length: count }, () => {
    const left = [...DIGITS];
    return [0, 1, 2].map(() => left.splice(Math.floor(random() * left.length), 1)[0]);
  });
}

export const NOISE_PRACTICE = triplets(11, 2);
export const NOISE_ITEMS = triplets(2027, NOISE_ROUNDS);
