import { countIn, holding, P, seen, torso } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//bending to touch the floor and twisting to touch the wall behind, as many times as they can in seconds, watched from
//the front. Once they've stood still in view for a moment it counts them in out loud, and a touch counts each time
//their hands go from below their knees to shoulder height
export function bendTwist(seconds: number): Watcher {
  const held = holding();
  const count_in = countIn();
  let count = 0;
  let low = false;
  let done: Watched | undefined;
  return {
    feed({ body = null }, at) {
      if (done) return { ...done, cue: undefined };
      const starts = count_in.starts;
      if (starts && at - starts >= seconds * 1000) {
        done = { phase: 'done', value: count, message: "Time's up.", cue: { beep: 'stop', say: `Time's up. ${count} touches.` } };
        return done;
      }
      const inView = !!body && seen(body, [P.leftShoulder, P.rightShoulder, P.leftHip, P.rightHip, P.leftKnee, P.rightKnee], 0.4);
      if (!starts) {
        if (!inView) {
          held('still', false, at);
          return { phase: 'setup', value: 0, message: 'Step back until I can see you from head to toe.' };
        }
        if (held('still', true, at) < 1500) return { phase: 'ready', value: 0, message: "Stand facing me with your back to the wall, and I'll count you in." };
        count_in.begin(at);
      }
      const counting = count_in.step(at);
      if (counting) return counting;
      const corner = `${Math.ceil(seconds - (at - count_in.starts) / 1000)} s left`;
      if (!inView || !body) return { phase: 'going', value: count, corner, message: '' };
      const knees = (body[P.leftKnee].y + body[P.rightKnee].y) / 2;
      const chest = (body[P.leftShoulder].y + body[P.rightShoulder].y) / 2 + torso(body) * 0.35;
      const hands = [body[P.leftWrist], body[P.rightWrist]];
      if (hands.every((h) => h.y > knees)) low = true;
      if (low && hands.every((h) => h.y < chest)) {
        low = false;
        count += 1;
        return { phase: 'going', value: count, corner, message: '', cue: { beep: 'rep' } };
      }
      return { phase: 'going', value: count, corner, message: '' };
    },
  };
}
