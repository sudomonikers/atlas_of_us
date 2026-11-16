import type { Point } from '../pose';
import { holding, P, seen, tenths, torso } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//a point followed smoothly from frame to frame, so the model's small guesses either way don't read as movement
function smoothed(weight = 0.35) {
  let at: Point | undefined;
  return (p: Point): Point => (at = at ? { x: at.x + (p.x - at.x) * weight, y: at.y + (p.y - at.y) * weight, seen: p.seen } : p);
}

//standing on one leg with the arms crossed and the eyes closed, for up to limit seconds. The clock starts when a foot
//comes up with the arms crossed, and stops when the foot comes down, the standing foot moves, the arms uncross, or the
//time is up. Each has to be clear and last a moment, since everyone wobbles, and the ankles are followed smoothly
export function oneLeg(limit: number): Watcher {
  const held = holding();
  const ankles = { [P.leftAnkle]: smoothed(), [P.rightAnkle]: smoothed() } as Record<number, (p: Point) => Point>;
  let started = 0;
  let standing: number = P.leftAnkle;
  let standX = 0;
  let done: Watched | undefined;
  let lost = 0;
  const stop = (at: number, why: string): Watched => {
    const seconds = Math.min(limit, tenths(at - started));
    done = { phase: 'done', value: seconds, message: why, cue: { beep: 'stop', say: `${why} ${seconds} seconds.` } };
    return done;
  };
  return {
    feed({ body = null }, at) {
      if (done) return { ...done, cue: undefined };
      if (started && at - started >= limit * 1000) return stop(at, "Time's up.");
      if (!body || !seen(body, [P.leftShoulder, P.rightShoulder, P.leftHip, P.rightHip, P.leftWrist, P.rightWrist]) || !seen(body, [P.leftAnkle, P.rightAnkle], 0.3)) {
        if (!started) return { phase: 'setup', value: 0, message: 'Step back until I can see you from head to toe.' };
        lost ||= at;
        return at - lost > 1500 ? stop(lost, 'I lost sight of you.') : { phase: 'going', value: tenths(at - started), message: '' };
      }
      lost = 0;
      const t = torso(body);
      const [ls, rs, lw, rw] = [body[P.leftShoulder], body[P.rightShoulder], body[P.leftWrist], body[P.rightWrist]];
      const hipY = (body[P.leftHip].y + body[P.rightHip].y) / 2;
      const crossed = (lw.x - rw.x) * (ls.x - rs.x) < 0 && lw.y < hipY && rw.y < hipY;
      const foot = { [P.leftAnkle]: ankles[P.leftAnkle](body[P.leftAnkle]), [P.rightAnkle]: ankles[P.rightAnkle](body[P.rightAnkle]) } as Record<number, Point>;
      const lift = Math.abs(foot[P.leftAnkle].y - foot[P.rightAnkle].y) / t;

      if (!started) {
        const lifted = held('start', crossed && lift > 0.15, at);
        if (lifted > 300) {
          started = at - lifted; //from when the foot came up, not when that was sure
          standing = foot[P.leftAnkle].y > foot[P.rightAnkle].y ? P.leftAnkle : P.rightAnkle;
          standX = foot[standing].x;
          return { phase: 'going', value: 0, message: '', cue: { beep: 'start' } };
        }
        return { phase: 'ready', value: 0, message: crossed ? "Close your eyes and lift one foot when you're ready to begin." : 'Cross your arms over your chest.' };
      }
      //each stops the clock from when it happened, not when that was sure
      const down = held('down', lift < 0.04, at);
      if (down > 400) return stop(at - down, 'Your foot touched down.');
      const moved = held('moved', Math.abs(foot[standing].x - standX) / t > 0.45, at);
      if (moved > 500) return stop(at - moved, 'Your standing foot moved.');
      const uncrossed = held('uncrossed', !crossed, at);
      if (uncrossed > 700) return stop(at - uncrossed, 'Your arms uncrossed.');
      return { phase: 'going', value: tenths(at - started), message: '' };
    },
  };
}
