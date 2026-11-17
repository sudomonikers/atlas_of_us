import type { Point } from './pose';
import type { Watched } from './pose_tests';
import { COUNT_IN } from './test_kit';

//the model's 33 points, by index. These are the ones the tests use
export const P = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftToes: 31,
  rightToes: 32,
} as const;

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, seen: Math.min(a.seen, b.seen) });
//the angle at b, from a to c, in degrees
export const angle = (a: Point, b: Point, c: Point) => {
  const turn = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  const d = Math.abs((turn * 180) / Math.PI) % 360;
  return d > 180 ? 360 - d : d;
};
//how far a line is from level, in degrees
export const tilt = (a: Point, b: Point) => {
  const d = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
  return d > 90 ? 180 - d : d;
};
export const seen = (body: Point[], points: number[], enough = 0.5) => points.every((p) => body[p].seen >= enough);
export const torso = (body: Point[]) => dist(mid(body[P.leftShoulder], body[P.rightShoulder]), mid(body[P.leftHip], body[P.rightHip]));
export const tenths = (ms: number) => Math.floor(ms / 100) / 10;

//the side of the body facing the camera, for a test watched from the side: its shoulder, elbow, wrist, hip, knee and ankle
export function nearSide(body: Point[]) {
  const left = [P.leftShoulder, P.leftElbow, P.leftWrist, P.leftHip, P.leftKnee, P.leftAnkle];
  const right = [P.rightShoulder, P.rightElbow, P.rightWrist, P.rightHip, P.rightKnee, P.rightAnkle];
  const sum = (ps: number[]) => ps.reduce((s, p) => s + body[p].seen, 0);
  const [shoulder, elbow, wrist, hip, knee, ankle] = (sum(left) >= sum(right) ? left : right).map((p) => body[p]);
  return { shoulder, elbow, wrist, hip, knee, ankle };
}

//how long something has been true, so a flicker in one frame doesn't start or stop a test
export function holding() {
  const since = new Map<string, number>();
  return (key: string, now: boolean, at: number) => {
    if (!now) {
      since.delete(key);
      return 0;
    }
    if (!since.has(key)) since.set(key, at);
    return at - since.get(key)!;
  };
}

//a count down out loud from COUNT_IN, then "Go!", for a test that starts on the clock. It's begun once the person is
//in place, and until it's over each frame gets where it's up to
export function countIn() {
  let starts = 0; //when the clock starts, once it's begun
  let said = 0; //the last number said
  return {
    get starts() {
      return starts;
    },
    begin(at: number) {
      starts = at + COUNT_IN * 1000;
    },
    //the count while it's under way, and the go on the frame it ends. Nothing after that
    step(at: number): Watched | undefined {
      if (at < starts) {
        const number = Math.ceil((starts - at) / 1000);
        const now: Watched = { phase: 'ready', value: 0, message: 'Get ready...', countIn: number };
        if (number === said) return now;
        said = number;
        return { ...now, cue: { beep: 'rep', say: String(number) } };
      }
      if (said) {
        said = 0;
        return { phase: 'going', value: 0, message: '', cue: { beep: 'start', say: 'Go!' } };
      }
    },
  };
}
