import { type ReactNode, useEffect, useId, useState } from 'react';
import { BLUE, BOARD, GRAY, GREEN, INK, line, ORANGE, type Pt, RED } from '../shared_components/story/ink';
import { armSpan } from './arm_span/motion';
import { bendTwist } from './bend_twist_touch/motion';
import { bloodPressure } from './blood_pressure/motion';
import { bodyFat } from './body_fat/motion';
import { Floor } from './body_marks';
import { coinTransfer } from './coin_transfer/motion';
import { coinTurning } from './coin_turning/motion';
import { handSpan } from './hand_span/motion';
import { eyeChart, readingChart } from './eye_chart/motion';
import { height } from './height/motion';
import { hexagon } from './hexagon_jump/motion';
import { add, dir, ease, type Figure, GY, type Joints, L, type Limb, mix, type Motion, type Pose, rad, SEATED, STAND, steps } from './motion_kit';
import { Ink } from './motion_marks';
import { oneLeg } from './one_leg_stand/motion';
import { plank } from './plank/motion';
import { plateTapping } from './plate_tapping/motion';
import { pushUp } from './push_ups/motion';
import { pulse } from './resting_heart_rate/motion';
import { SCREEN_MOTIONS } from './screen_motions';
import { sitReach } from './sit_and_reach/motion';
import { soundShift } from './sound_shift/motion';
import { squat } from './squat_one_rep_max/motion';
import { steady } from './steady_hand/motion';
import { upperArm } from './upper_arm_length/motion';
import { upperLeg } from './upper_leg_length/motion';
import { jump } from './vertical_jump/motion';
import { run } from './vo2_max/motion';
import { waist } from './waist_circumference/motion';
import { weight } from './weight/motion';

// Comic animations of someone doing what a scene is about, drawn in the same marker as the stories that open a module.
// A figure is posed by the angle of each part of the body, or by where a hand or foot goes, and moves between poses on a
// loop. The tests done at a table are drawn from above, with just the hands. Each test's animation is in its folder,
// and the ones here show abilities and chapters rather than one test.

const VIEW_W = 600;
const VIEW_H = 400;

//the middle joint and end of a limb reaching from a joint toward a point
function reach(from: Pt, to: Pt, l1: number, l2: number, bend: 1 | -1): [Pt, Pt] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.1), l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const inner = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const mid: Pt = [from[0] + l1 * Math.cos(base + bend * inner), from[1] + l1 * Math.sin(base + bend * inner)];
  const toward = Math.atan2(to[1] - mid[1], to[0] - mid[0]);
  return [mid, [mid[0] + l2 * Math.cos(toward), mid[1] + l2 * Math.sin(toward)]];
}

function limb(from: Pt, spec: Limb, l1: number, l2: number): [Pt, Pt] {
  if (Array.isArray(spec)) {
    const mid = add(from, dir(spec[0]), l1);
    return [mid, add(mid, dir(spec[1]), l2)];
  }
  return reach(from, spec.to, l1, l2, spec.bend);
}

const mixLimb = (a: Limb, b: Limb, p: number): Limb =>
  Array.isArray(a) && Array.isArray(b)
    ? [mix(a[0], b[0], p), mix(a[1], b[1], p)]
    : !Array.isArray(a) && !Array.isArray(b)
      ? { to: [mix(a.to[0], b.to[0], p), mix(a.to[1], b.to[1], p)], bend: a.bend }
      : a;

const mixPose = (a: Pose, b: Pose, p: number): Pose => ({
  x: mix(a.x, b.x, p),
  y: mix(a.y, b.y, p),
  t: mix(a.t, b.t, p),
  h: mix(a.h ?? 0, b.h ?? 0, p),
  an: mixLimb(a.an, b.an, p),
  af: mixLimb(a.af, b.af, p),
  ln: mixLimb(a.ln, b.ln, p),
  lf: mixLimb(a.lf, b.lf, p),
});

//the pose at a moment of the loop, eased between the frames either side of it
function poseAt(frames: [number, Pose][], period: number, time: number): Pose {
  const next = frames.findIndex(([at]) => at > time);
  const [fromAt, from] = frames[next === -1 ? frames.length - 1 : Math.max(0, next - 1)];
  const [toAt, to] = next === -1 ? [period, frames[0][1]] : next === 0 ? frames[0] : frames[next];
  return toAt === fromAt ? from : mixPose(from, to, ease((time - fromAt) / (toAt - fromAt)));
}

//a figure in a pose, and where its joints ended up
function posed(view: Figure['view'], pose: Pose, eyes?: 'closed'): [ReactNode, Joints] {
  const front = view === 'front';
  const hip: Pt = [pose.x, pose.y];
  const up = dir(pose.t);
  const across: Pt = [-up[1], up[0]]; //toward the figure's front from the side, or its right from the front
  const neck = add(hip, up, L.torso);
  const shoulder = add(hip, up, L.shoulder);
  const head = add(add(neck, up, L.neck), dir(pose.t + (pose.h ?? 0)), L.head);
  const sw = front ? 26 : 0;
  const hw = front ? 13 : 0;
  const [elbowN, handN] = limb(add(shoulder, across, sw), pose.an, L.upper, L.fore);
  const [elbowF, handF] = limb(add(shoulder, across, -sw), pose.af, L.upper, L.fore);
  const [kneeN, footN] = limb(add(hip, across, hw), pose.ln, L.thigh, L.shin);
  const [kneeF, footF] = limb(add(hip, across, -hw), pose.lf, L.thigh, L.shin);

  //a foot points forward from the shin from the side, and out from the front
  const foot = (knee: Pt, ankle: Pt, side: number): string => {
    if (front) return line(ankle, [ankle[0] + side * 11, ankle[1] + 2]);
    const shin = Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]);
    return line(ankle, [ankle[0] + 13 * Math.sin(shin + Math.PI / 2), ankle[1] + 13 * Math.cos(shin + Math.PI / 2)]);
  };
  const arm = (s: number, elbow: Pt, hand: Pt) => line(add(shoulder, across, s * sw), elbow, hand);
  const leg = (s: number, knee: Pt, ankle: Pt) => `${line(add(hip, across, s * hw), knee, ankle)} ${foot(knee, ankle, s)}`;

  const body = [add(hip, across, front ? -18 : -13), add(hip, across, front ? 18 : 13), add(neck, across, front ? 31 : 16), add(neck, across, front ? -31 : -16)];
  const torso = `M ${body.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`;

  //the face: hair over the top, and eyes looking forward from the side or out from the front
  const at = (a: number, r: number): Pt => add(add(head, up, Math.cos(rad(a)) * r), across, Math.sin(rad(a)) * r);
  const hair = Array.from({ length: 9 }, (_, i) => at(front ? -70 + i * 17.5 : -110 + i * 17, L.head - 3));
  const eye = (side: number): ReactNode => {
    const c = front ? add(add(head, across, side * 8), up, 2) : add(add(head, across, 10), up, 3);
    return eyes === 'closed' ? (
      <path key={side} d={line(add(c, across, -4), add(c, across, 4))} stroke={INK} strokeWidth={3} strokeLinecap="round" />
    ) : (
      <circle key={side} cx={c[0]} cy={c[1]} r={3.3} fill={INK} />
    );
  };
  const smile = front ? `M ${add(add(head, across, -7), up, -8).join(' ')} Q ${add(head, up, -13).join(' ')} ${add(add(head, across, 7), up, -8).join(' ')}` : '';

  const stroke = { fill: 'none', stroke: INK, strokeWidth: 7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const far = { ...stroke, opacity: front ? 1 : 0.45 };
  const drawn = (
    <g>
      <path d={arm(-1, elbowF, handF)} {...far} />
      <path d={leg(-1, kneeF, footF)} {...far} />
      <path d={leg(1, kneeN, footN)} {...stroke} />
      <path d={torso} fill={RED} fillOpacity={0.35} />
      <path d={torso} {...stroke} />
      <path d={line(neck, add(neck, up, L.neck))} {...stroke} />
      <circle cx={head[0]} cy={head[1]} r={L.head} fill={BOARD} stroke={INK} strokeWidth={7} />
      <path d={line(...hair)} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      {front ? [eye(-1), eye(1)] : eye(1)}
      {smile && <path d={smile} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />}
      <path d={arm(1, elbowN, handN)} {...stroke} />
    </g>
  );
  return [drawn, { hip, neck, shoulder, head, hands: [handN, handF], feet: [footN, footF] }];
}

const MOTIONS = {
  ...SCREEN_MOTIONS,
  hello: {
    label: 'Someone waving hello',
    period: 1.2,
    still: 0,
    figure: { view: 'front', frames: [[0, { ...STAND, an: [135, 168] }], [0.6, { ...STAND, an: [135, 208] }]] },
    under: () => <Floor />,
  },
  living: {
    label: 'Someone in glasses walking along with a cane',
    period: 1.6,
    still: 0,
    figure: {
      view: 'side',
      frames: [
        [0, { x: 284, y: 238, t: 182, an: { to: [338, 246], bend: 1 }, af: [10, 20], ln: [-18, -6], lf: [20, 10] }],
        [0.8, { x: 284, y: 238, t: 182, an: { to: [334, 242], bend: 1 }, af: [-16, -6], ln: [20, 10], lf: [-18, -6] }],
      ],
    },
    under: () => <Floor />,
    draw: (_, j) => {
      if (!j) return null;
      const [hx, hy] = j.hands[0];
      const [x, y] = j.head;
      return (
        <g>
          <Ink d={line([hx - 14, hy - 4], [hx + 2, hy - 4], [hx + 34, GY])} w={6} />
          <circle cx={x + 12} cy={y - 3} r={6.5} fill="none" stroke={INK} strokeWidth={3.5} />
          <Ink d={line([x + 5.5, y - 4], [x - 12, y - 7])} w={3.5} />
        </g>
      );
    },
  },
  screen: {
    label: 'Someone sitting at a laptop, tapping keys as dots appear on the screen',
    period: 1.6,
    still: 0.2,
    figure: {
      view: 'side',
      frames: steps(0.4, [0, 1, 0, 1].map((down) => ({ ...SEATED, an: { to: [322, down ? 252 : 242], bend: 1 }, af: { to: [340, 250], bend: 1 } } as Pose))),
    },
    under: () => (
      <g>
        <Floor />
        <Ink d={line([196, 200], [196, 298], [262, 298]) + ' ' + line([204, 298], [204, GY]) + ' ' + line([254, 298], [254, GY])} c={GRAY} w={6} />
        <Ink d={line([290, 258], [560, 258]) + ' ' + line([300, 258], [300, GY]) + ' ' + line([550, 258], [550, GY])} w={6} />
      </g>
    ),
    draw: (time) => {
      const spot = Math.floor(time / 0.4);
      return (
        <g>
          <Ink d={line([308, 254], [392, 254])} w={7} />
          <Ink d={line([392, 254], [410, 166])} w={7} />
          <circle cx={398 + [6, 2, 9, 4][spot]} cy={[200, 226, 214, 188][spot]} r={6} fill={[RED, BLUE, GREEN, ORANGE][spot]} />
        </g>
      );
    },
  },
  height,
  weight,
  bodyFat,
  pulse,
  run,
  pushUp,
  plank,
  sitReach,
  jump,
  oneLeg,
  hexagon,
  bendTwist,
  coinTransfer,
  coinTurning,
  plateTapping,
  squat,
  steady,
  eyeChart,
  readingChart,
  soundShift,
  waist,
  armSpan,
  upperArm,
  upperLeg,
  handSpan,
  bloodPressure,
} satisfies Record<string, Motion>;

export type MotionName = keyof typeof MOTIONS;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

//the moment of a loop to draw, running on the screen's frames while it's playing, unless motion is reduced
function useLoop(period: number, still: number, playing: boolean) {
  const [time, setTime] = useState(still);
  useEffect(() => {
    if (reduced() || !playing) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((Math.max(0, now - start) / 1000) % period); //the first frame can be stamped a little before start
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [period, playing]);
  return playing ? time : still;
}

//a comic panel of someone doing something, on a loop, or held at its still moment when it isn't playing
export function MotionPanel({ name, playing = true }: { name: MotionName; playing?: boolean }) {
  const motion: Motion = MOTIONS[name];
  const id = useId();
  const time = useLoop(motion.period, motion.still, playing);
  const [figure, joints] = motion.figure ? posed(motion.figure.view, poseAt(motion.figure.frames, motion.period, time), motion.figure.eyes) : [null, undefined];
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={motion.label} style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect x={14} y={14} width={VIEW_W - 22} height={VIEW_H - 22} rx={22} fill={INK} />
      <rect x={6} y={6} width={VIEW_W - 22} height={VIEW_H - 22} rx={22} fill={BOARD} />
      <clipPath id={`motion-${id}`}>
        <rect x={6} y={6} width={VIEW_W - 22} height={VIEW_H - 22} rx={22} />
      </clipPath>
      <g clipPath={`url(#motion-${id})`}>
        {motion.under?.(time, joints)}
        {figure}
        {motion.draw?.(time, joints)}
      </g>
      <rect x={6} y={6} width={VIEW_W - 22} height={VIEW_H - 22} rx={22} fill="none" stroke={INK} strokeWidth={5} />
    </svg>
  );
}
