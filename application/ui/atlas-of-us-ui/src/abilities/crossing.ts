import type { Point } from './pose';
import { countIn, holding, tenths } from './pose_kit';
import type { Watched, Watcher } from './pose_tests';

//a hand going from one side of the picture to the other, watched close up from across the table by the hand model.
//Two lines split the picture in three. Once the hands are in place and have kept still a moment, it counts them in, and
//from then on it counts each time a hand turns up on the other side of the lines from the last time, which doesn't
//need to know which hand is which, or to see a fast hand that's a blur between the lines. The clock stops at the last
//one. It gives up without a time if the hand rests too long between crossings, or it takes longer than limit seconds
export interface Crossing {
  lines: [number, number]; //where the lines are, across the picture from 0 to 1
  rest: boolean; //whether the other hand rests between the lines, rather than out of sight
  crossings: number; //how many times across it takes
  idle?: number; //the longest a hand can stay put between crossings, in ms
  place: string; //how to put the hands at the start
  left: (crossed: number) => string | undefined; //how much is left, for the corner
  halfway?: number; //the crossing to say halfway at
  done: (seconds: number) => string; //the result, said out loud
}

//the middle of a hand, across the picture from 0 to 1: its wrist and the knuckles at the base of each finger
const palm = (hand: Point[], width: number) => [0, 5, 9, 13, 17].reduce((s, i) => s + hand[i].x, 0) / 5 / width;

export function crossing(test: Crossing, limit: number): Watcher {
  const { lines: marks } = test;
  //which side a hand is on: -1 left of the lines, 1 right of them, and 0 between them
  const side = (x: number): number => (x < marks[0] ? -1 : x > marks[1] ? 1 : 0);
  const held = holding();
  const count_in = countIn();
  let settled: number[] = []; //where the hands were when they last settled, left to right
  let on = 0; //the side the hand was last seen on
  let crossed = 0;
  let last = 0; //the last frame with a crossing, or the start
  let done: Watched | undefined;
  const giveUp = (why: string, value: number): Watched => (done = { phase: 'done', value, message: why, marks, cue: { say: `${why} Let's try that again.` } });
  return {
    feed({ hands = [], width = 1 }, at) {
      if (done) return { ...done, cue: undefined };
      const xs = hands.map((h) => palm(h, width)).sort((a, b) => a - b);
      const sides = xs.map(side);
      if (!count_in.starts) {
        if (!xs.length || (test.rest && xs.length < 2)) {
          held('still', false, at);
          const message = xs.length ? 'I can only see one hand. Move the camera back until I can see both.' : test.rest ? 'Move the camera until I can see both your hands.' : 'Move the camera until I can see your hand.';
          return { phase: 'setup', value: 0, marks, message };
        }
        const placed = test.rest ? sides.includes(0) && sides.some((s) => s !== 0) : sides.some((s) => s !== 0);
        //kept still: no hand has moved far from where they settled
        const still = settled.length === xs.length && xs.every((x, i) => Math.abs(x - settled[i]) < 0.04);
        if (!still) settled = xs;
        if (held('still', placed && still, at) < 1000) return { phase: 'ready', value: 0, marks, message: placed ? 'Keep still.' : test.place };
        on = sides.find((s) => s !== 0)!;
        count_in.begin(at);
        last = count_in.starts;
      }
      const counting = count_in.step(at);
      if (counting) return { ...counting, marks };

      const value = tenths(at - count_in.starts);
      if (value >= limit) return giveUp(`That's taken over ${limit} seconds, so I stopped there.`, value);
      if (test.idle && at - last > test.idle) return giveUp(crossed ? "Your hand stayed put for a few seconds, so I stopped." : "I didn't see you start, so I stopped.", value);
      const moved = sides.includes(-on);
      if (moved) {
        on = -on;
        crossed += 1;
        last = at;
      }
      if (crossed === test.crossings) {
        const said = test.done(value);
        done = { phase: 'done', value, message: said, marks, cue: { beep: 'stop', say: `Done. ${said}` } };
        return done;
      }
      const going: Watched = { phase: 'going', value, corner: test.left(crossed), marks, message: '' };
      return moved && crossed === test.halfway ? { ...going, cue: { say: 'Halfway.' } } : going;
    },
  };
}
