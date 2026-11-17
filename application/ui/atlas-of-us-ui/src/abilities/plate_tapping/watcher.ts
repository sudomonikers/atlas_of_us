import type { Crossing } from '../crossing';

//tapping two coasters 80 cm apart in turn with one hand, 25 times each, the other hand flat between them
export const plateTapping: Crossing = {
  lines: [0.4, 0.6],
  rest: true,
  crossings: 50,
  idle: 3000,
  place: 'Put your resting hand between the lines, and your other hand on a coaster outside them.',
  left: (n) => `${50 - n} taps to go`,
  halfway: 25,
  done: (s) => `50 taps in ${s} seconds.`,
};
