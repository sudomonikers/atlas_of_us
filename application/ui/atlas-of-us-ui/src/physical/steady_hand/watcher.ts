import type { Point } from '../pose';
import { countIn, dist, holding } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//holding a hand up at arm's length as still as possible for some seconds, watched from in front by the hand model.
//Once it can see a hand big enough to measure, kept roughly in one place for a moment, it counts them in. Then it follows the
//middle of the hand, the average of all its points, which the model's small guesses either way mostly cancel out
//in. The result is how far that wandered from where it was on average, in millimeters, measured against the length
//of the hand from the wrist to the knuckle of the middle finger, which is about HAND_MM in an adult
const HAND_MM = 100;

//the middle of a hand, the average of all its points, and its length from the wrist to the middle finger's knuckle
const hold = (hand: Point[]) => ({
  x: hand.reduce((s, p) => s + p.x, 0) / hand.length,
  y: hand.reduce((s, p) => s + p.y, 0) / hand.length,
  size: dist(hand[0], hand[9]),
});

export function steadyHand(seconds: number): Watcher {
  const held = holding();
  const count_in = countIn();
  let settled: { x: number; y: number } | undefined; //where the hand was when it last settled
  const path: { x: number; y: number; size: number }[] = []; //where the hand was in each frame since the clock started
  let missing = 0; //since when the hand couldn't be seen
  let done: Watched | undefined;
  //how far the hand has wandered from where it was on average, in millimeters
  const wander = () => {
    if (!path.length) return 0;
    const x = path.reduce((s, p) => s + p.x, 0) / path.length;
    const y = path.reduce((s, p) => s + p.y, 0) / path.length;
    const size = path.reduce((s, p) => s + p.size, 0) / path.length;
    const away = path.reduce((s, p) => s + Math.hypot(p.x - x, p.y - y), 0) / path.length;
    return Math.round((away / size) * HAND_MM * 10) / 10;
  };
  return {
    feed({ hands = [], width = 1 }, at) {
      if (done) return { ...done, cue: undefined };
      //the biggest hand in the picture, as the nearest
      const hand = hands.map(hold).sort((a, b) => b.size - a.size)[0];
      if (!count_in.starts) {
        if (!hand) {
          held('still', false, at);
          return { phase: 'setup', value: 0, message: 'Hold your arm out toward the camera with your palm facing it.' };
        }
        if (hand.size < width * 0.05) {
          held('still', false, at);
          return { phase: 'setup', value: 0, message: 'Come a little closer to the camera.' };
        }
        const still = !!settled && Math.hypot(hand.x - settled.x, hand.y - settled.y) < hand.size * 0.5;
        if (!still) settled = hand;
        if (held('still', still, at) < 1000) return { phase: 'ready', value: 0, message: 'Hold your hand still where it is.' };
        count_in.begin(at);
      }
      const counting = count_in.step(at);
      if (counting) return counting;

      const left = seconds - (at - count_in.starts) / 1000;
      if (left <= 0) {
        const mm = wander();
        done = { phase: 'done', value: mm, message: `Your hand wandered ${mm} mm on average.`, cue: { beep: 'stop', say: `Done. Your hand wandered ${mm} millimeters on average.` } };
        return done;
      }
      const corner = `${Math.ceil(left)} s left`;
      if (!hand) {
        missing ||= at;
        if (at - missing > 1000) {
          done = { phase: 'done', value: 0, message: 'I lost sight of your hand.', cue: { say: "I lost sight of your hand. Let's try that again." } };
          return done;
        }
        return { phase: 'going', value: wander(), corner, message: '' };
      }
      missing = 0;
      path.push(hand);
      return { phase: 'going', value: wander(), corner, message: '' };
    },
  };
}
