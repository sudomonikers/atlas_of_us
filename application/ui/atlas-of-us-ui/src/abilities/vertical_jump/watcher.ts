import type { Point } from '../pose';
import { P, seen, torso } from '../pose_kit';
import type { Watched, Watcher } from '../pose_tests';

//three jumps straight up, each measured from how long the toes are off the ground: a body in the air for t seconds
//rose g t² / 8. Before each jump they stand still for a moment, so it knows where the floor is, and it says each
//height out loud. Their best is the result. A jump is noticed once the toes are clearly up, and timed from a parabola
//through where the toes were in every frame in the air, which is the path anything thrown up follows: where it meets
//the floor at each end is when they left it and landed, between frames. With too few frames to draw one through, it's
//timed from halfway between the frames either side of leaving and landing
const JUMPS = 3;

//where the parabola nearest some points, of height against time in ms, is at 0 on the way up and the way down
function landings(points: [number, number][]): [number, number] | null {
  if (points.length < 5) return null;
  const start = points[0][0];
  const xs = points.map(([at]) => (at - start) / 1000);
  const ys = points.map(([, y]) => y);
  const sum = (f: (x: number, y: number) => number) => xs.reduce((s, x, i) => s + f(x, ys[i]), 0);
  //the least squares fit of y = a x² + b x + c
  const [n, x1, x2, x3, x4] = [points.length, sum((x) => x), sum((x) => x * x), sum((x) => x ** 3), sum((x) => x ** 4)];
  const [y0, y1, y2] = [sum((_, y) => y), sum((x, y) => x * y), sum((x, y) => x * x * y)];
  const det = (m: number[][]) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const m = [[x4, x3, x2], [x3, x2, x1], [x2, x1, n]];
  const d = det(m);
  if (!d) return null;
  const a = det([[y2, x3, x2], [y1, x2, x1], [y0, x1, n]]) / d;
  const b = det([[x4, y2, x2], [x3, y1, x1], [x2, y0, n]]) / d;
  const c = det([[x4, x3, y2], [x3, x2, y1], [x2, x1, y0]]) / d;
  const disc = b * b - 4 * a * c;
  if (a >= 0 || disc <= 0) return null;
  const roots = [(-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a)].sort((p, q) => p - q);
  return [start + roots[0] * 1000, start + roots[1] * 1000];
}
//where the bottom of the feet are: the lowest point of each foot the camera can make out, its ankle, heel or toes,
//between the two feet. Standing flat that's the heel or toes, and in the moment of leaving the floor it's the toes,
//which are the last to leave. Null when either foot can't be made out
function soles(body: Point[]): number | null {
  const lowest = (points: number[]) => {
    const ys = points.filter((p) => body[p].seen >= 0.2).map((p) => body[p].y);
    return ys.length ? Math.max(...ys) : null;
  };
  const left = lowest([P.leftAnkle, P.leftHeel, P.leftToes]);
  const right = lowest([P.rightAnkle, P.rightHeel, P.rightToes]);
  return left === null || right === null ? null : (left + right) / 2;
}

export function jump(): Watcher {
  let still: { at: number; y: number }[] = []; //the toes' height over the last moment, while finding the floor
  let floor: number | undefined;
  let lastDown = 0; //the last frame the toes were on the floor
  let lastUp = 0; //the last frame they were off it
  let off = 0; //when they left it
  let firstOff = 0; //the first frame of the toes leaving the floor, before it's clear it's a jump
  let rising: [number, number][] = []; //the toes' height in each frame since they left the floor
  let missing = 0; //since when the feet couldn't be made out
  let lostFeet = false; //whether it lost them while it knew where the floor was, until it finds the floor again
  const heights: number[] = [];
  let done: Watched | undefined;
  const best = () => (heights.length ? Math.max(...heights) : 0);
  const again = () => {
    floor = undefined;
    still = [];
    firstOff = 0;
    rising = [];
  };
  const waiting = (): Watched => ({
    phase: 'ready',
    value: best(),
    message: floor === undefined ? (heights.length ? `Stand still for jump ${heights.length + 1} of ${JUMPS}.` : 'Stand still so I can find the floor.') : 'Jump when you\'re ready.',
  });
  return {
    feed({ body = null }, at) {
      if (done) return { ...done, cue: undefined };
      const toes = body && seen(body, [P.leftShoulder, P.rightShoulder, P.leftHip, P.rightHip], 0.4) ? soles(body) : null;
      if (toes === null || !body) {
        //a few frames where the feet blur or the model is unsure don't lose the floor, or a jump under way
        missing ||= at;
        if (off && at - missing < 1500) return { phase: 'going', value: best(), message: '' };
        if (floor !== undefined && at - missing < 1000) return waiting();
        if (floor !== undefined || off) lostFeet = true;
        off = 0;
        again();
        return {
          phase: heights.length ? 'ready' : 'setup',
          value: best(),
          message: lostFeet ? 'I lost sight of your feet. Step back so I can see all of you, feet included.' : 'Step back until I can see you from head to toe, feet included.',
        };
      }
      missing = 0;
      const t = torso(body);

      //the floor: where the toes rest once they've stayed put for a moment
      if (floor === undefined) {
        still = [...still.filter((s) => at - s.at < 600), { at, y: toes }];
        const ys = still.map((s) => s.y);
        if (at - still[0].at >= 500 && Math.max(...ys) - Math.min(...ys) < 0.03 * t) {
          floor = ys.reduce((a, b) => a + b, 0) / ys.length;
          lastDown = at;
          lostFeet = false;
        }
        return waiting();
      }

      const up = (floor - toes) / t; //how far the toes are above the floor, in torsos
      const atFloor = up < 0.02;
      if (!off) {
        if (atFloor) {
          lastDown = at;
          firstOff = 0;
          rising = [];
        } else {
          firstOff ||= at;
          rising.push([at, up]);
        }
        if (up > 0.08) {
          off = (lastDown + firstOff) / 2; //halfway from the last frame at the floor to the first one off it
          lastUp = at;
          return { phase: 'going', value: best(), message: '' };
        }
        //standing somewhere else now, so find the floor again
        if (up < -0.15) again();
        return waiting();
      }
      if (!atFloor) {
        lastUp = at;
        rising.push([at, up]);
        if (at - off > 1500) {
          off = 0;
          again();
        }
        return { phase: 'going', value: best(), message: '' };
      }
      //the parabola's ends, as long as they fall where leaving and landing could have been
      const ends = landings(rising);
      const fits = !!ends && ends[0] >= lastDown - 5 && ends[0] <= firstOff + 5 && ends[1] >= lastUp - 5 && ends[1] <= at + 5;
      const flight = (fits ? ends![1] - ends![0] : (lastUp + at) / 2 - off) / 1000;
      off = 0;
      again();
      if (flight < 0.15 || flight > 1) return { ...waiting(), cue: { say: "That didn't look like a jump. Let's try that one again." } };
      const height = Math.round(((9.81 * flight * flight) / 8) * 1000) / 10;
      heights.push(height);
      if (heights.length === JUMPS) {
        done = { phase: 'done', value: best(), message: `Your best jump was ${best()} centimeters.`, cue: { beep: 'stop', say: `${height} centimeters. Your best jump was ${best()} centimeters.` } };
        return done;
      }
      return { ...waiting(), cue: { say: `${height} centimeters.` } };
    },
  };
}
