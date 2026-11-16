import type { Crossing } from '../crossing';

//flipping a row of 10 coins that runs between the lines, from a start outside one line, then sweeping the hand out
//past the other once the last is flipped
export const coinTurning: Crossing = {
  lines: [0.25, 0.75],
  rest: false,
  crossings: 1,
  place: 'Lay the row of coins between the lines, and rest your hand just outside the line at one end.',
  left: () => undefined,
  done: (s) => `All 10 coins turned in ${s} seconds.`,
};
