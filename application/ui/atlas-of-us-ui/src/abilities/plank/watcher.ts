import { angle, holding, nearSide, tenths, tilt } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//a forearm plank, watched from the side. The clock starts once the body is straight and level, and stops when the hips
//sag or rise, a knee bends, or they come out of it
export function plank(limit: number): Watcher {
  const held = holding();
  let started = 0;
  let said = 0;
  let done: Watched | undefined;
  const stop = (at: number, why: string): Watched => {
    const seconds = Math.min(limit, tenths(at - started));
    done = { phase: 'done', value: seconds, message: why, cue: { beep: 'stop', say: `${why} ${seconds} seconds.` } };
    return done;
  };
  return {
    feed({ body = null }, at) {
      if (done) return { ...done, cue: undefined };
      if (started && at - started >= limit * 1000) return stop(at, "Time's up.");
      const side = body && nearSide(body);
      if (!side || [side.shoulder, side.hip, side.knee, side.ankle].some((p) => p.seen < 0.4)) {
        const gone = held('lost', true, at);
        if (started && gone > 1000) return stop(at - gone, 'I lost sight of you.');
        return started ? { phase: 'going', value: tenths(at - started), message: '' } : { phase: 'setup', value: 0, message: 'Move so I can see all of you from the side.' };
      }
      held('lost', false, at);
      const hip = angle(side.shoulder, side.hip, side.ankle);
      const knee = angle(side.hip, side.knee, side.ankle);
      const level = tilt(side.shoulder, side.ankle) < 35;
      const straight = hip > 155 && knee > 150 && level;

      if (!started) {
        const ready = held('start', straight, at);
        if (ready > 500) {
          started = at - ready;
          return { phase: 'going', value: 0, message: '', cue: { beep: 'start' } };
        }
        return { phase: 'ready', value: 0, message: level ? 'Straighten out from your head to your heels.' : "Get into your plank and I'll start the clock." };
      }
      const bent = held('bent', !straight, at);
      if (bent > 600) {
        //the hips are below the line from shoulders to ankles when they sag
        const line = side.shoulder.y + ((side.ankle.y - side.shoulder.y) * (side.hip.x - side.shoulder.x)) / (side.ankle.x - side.shoulder.x || 1);
        const why = !level ? 'You came out of your plank.' : knee <= 150 ? 'A knee bent.' : side.hip.y > line ? 'Your hips sagged.' : 'Your hips went up.';
        return stop(at - bent, why);
      }
      const seconds = tenths(at - started);
      if (Math.floor(seconds / 30) > said) {
        said = Math.floor(seconds / 30);
        return { phase: 'going', value: seconds, message: '', cue: { say: `${said * 30} seconds.` } };
      }
      return { phase: 'going', value: seconds, message: '' };
    },
  };
}
