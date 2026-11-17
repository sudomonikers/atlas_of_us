import type { Crossing } from '../crossing';

//dropping 20 coins one at a time from a pile on one side into a mug on the other. Each coin is there and back,
//apart from the last, which stops the clock as it's over the mug
export const coinTransfer: Crossing = {
  lines: [0.42, 0.58],
  rest: false,
  crossings: 39,
  idle: 6000,
  place: 'Put the coins on one side of the lines and the mug on the other, and rest your hand on the coins.',
  left: (n) => `${20 - Math.ceil(n / 2)} coins to go`,
  done: (s) => `All 20 coins in ${s} seconds.`,
};
