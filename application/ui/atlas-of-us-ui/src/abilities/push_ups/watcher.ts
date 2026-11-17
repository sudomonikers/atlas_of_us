import { angle, holding, nearSide, tilt } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//push-ups, watched from the side. Counting starts once they're down with straight arms, a push-up counts when the arms
//straighten after bending past a right angle, and it stops when they get up or rest too long
export function pushUps(): Watcher {
  const held = holding();
  let going = false;
  let count = 0;
  let bent = false;
  let last = 0;
  let done: Watched | undefined;
  const stop = (why: string): Watched => {
    done = { phase: 'done', value: count, message: why, cue: { beep: 'stop', say: `${why} ${count} push-ups.` } };
    return done;
  };
  return {
    feed({ body = null }, at) {
      if (done) return { ...done, cue: undefined };
      const side = body && nearSide(body);
      if (!side || [side.shoulder, side.elbow, side.wrist, side.hip].some((p) => p.seen < 0.4)) {
        if (going && held('lost', true, at) > 1500) return stop('I lost sight of you.');
        return going ? { phase: 'going', value: count, message: '' } : { phase: 'setup', value: 0, message: 'Move so I can see all of you from the side.' };
      }
      held('lost', false, at);
      const elbow = angle(side.shoulder, side.elbow, side.wrist);
      const down = tilt(side.shoulder, side.hip) < 45;

      if (!going) {
        if (held('start', down && elbow > 150, at) > 400) {
          going = true;
          last = at;
          return { phase: 'going', value: 0, message: '', cue: { beep: 'start' } };
        }
        return { phase: 'ready', value: 0, message: "Get into position with your arms straight and I'll start counting." };
      }
      if (held('up', !down, at) > 1500) return stop(count ? 'You stopped.' : 'You got up.');
      if (at - last > 8000) return stop('You rested for a while, so I stopped there.');
      if (elbow < 100) bent = true;
      if (bent && elbow > 150) {
        bent = false;
        count += 1;
        last = at;
        return { phase: 'going', value: count, message: '', cue: { beep: 'rep', say: String(count) } };
      }
      return { phase: 'going', value: count, message: '' };
    },
  };
}
