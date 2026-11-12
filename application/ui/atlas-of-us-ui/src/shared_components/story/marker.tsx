import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Layers, Sheet, type Layer } from '../../personality/layers';
import { BLUE, BOARD, circle, GRAY, GREEN, GROUND, H, HAND, INK, line, ORANGE, pts, RED, rect, shape, VIEW, W, type Cue, type Pt } from './ink';

// The whiteboard the stories that open a module are drawn on, in marker. Every line draws itself on as if someone is
// sketching it while they talk, and fills go on like a highlighter after. A cue names a board and the parts on it: a new
// board wipes clean and starts over, and parts new to the same board draw on after what's already there. Everything is
// SVG in a fixed 1600x900 space, scaled to cover the screen, kept to the top two thirds, clear of the text box.

//a marker stroke that draws itself on
export const Ink = ({ d, c = INK, w = 7, dash }: { d: string; c?: string; w?: number; dash?: boolean }) => (
  <path d={d} pathLength={1} className={dash ? 'wb-fade' : 'wb-draw'} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ? '0.012 0.018' : undefined} />
);
//a highlighter wash under the ink
export const Wash = ({ d, c, op = 0.28 }: { d: string; c: string; op?: number }) => <path d={d} className="wb-fade" fill={c} fillOpacity={op} />;
//marker lettering
export const Say = ({ x, y, text, size = 44, c = INK, anchor = 'middle' }: { x: number; y: number; text: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} className="wb-fade" fill={c} fontFamily={HAND} fontSize={size} textAnchor={anchor}>
    {text}
  </text>
);

// ---------------------------------------------------------------------------
// people. Drawn facing the viewer with the feet on 0, about 300 tall, then placed and scaled
// ---------------------------------------------------------------------------

//elbow and hand, left then right; knee and foot, left then right
type Pose = { arms: [Pt, Pt][]; legs?: [Pt, Pt][] };
const STAND_LEGS: [Pt, Pt][] = [[[-14, -64], [-22, 0]], [[14, -64], [22, 0]]];
const POSES: Record<string, Pose> = {
  stand: { arms: [[[-34, -170], [-38, -118]], [[34, -170], [38, -118]]] },
  shrug: { arms: [[[-58, -196], [-74, -236]], [[58, -196], [74, -236]]] },
  think: { arms: [[[-24, -168], [14, -176]], [[40, -178], [12, -240]]] },
  shoot: { arms: [[[-26, -286], [-4, -340]], [[28, -288], [8, -342]]] },
  cheer: { arms: [[[-60, -268], [-86, -320]], [[60, -268], [86, -320]]] },
  catch: { arms: [[[-36, -170], [-40, -118]], [[56, -262], [70, -318]]] },
  dribble: { arms: [[[-48, -178], [-70, -150]], [[44, -170], [62, -120]]], legs: [[[-22, -62], [-36, 0]], [[20, -62], [34, 0]]] },
  fumble: { arms: [[[-60, -214], [-50, -270]], [[56, -186], [92, -196]]] },
  run: { arms: [[[30, -196], [56, -222]], [[-28, -178], [-42, -140]]], legs: [[[32, -78], [16, -14]], [[-22, -58], [-62, -16]]] },
  step: { arms: [[[-38, -176], [-56, -132]], [[40, -176], [60, -136]]], legs: [[[-14, -64], [-22, 0]], [[34, -100], [40, -50]]] },
  hold: { arms: [[[-36, -176], [-14, -158]], [[36, -176], [14, -158]]] }, //both hands together in front, holding something small
  point: { arms: [[[-34, -170], [-38, -118]], [[72, -214], [118, -230]]] }, //pointing off to the right
  wave: { arms: [[[-34, -170], [-38, -118]], [[62, -250], [70, -306]]] },
  phone: { arms: [[[-34, -170], [-38, -118]], [[40, -184], [22, -252]]] }, //a phone held to the ear
};

//a standing figure. wide is how broad the shoulders are
export function Person({ x, c, pose = 'stand', s = 1, wide = 30, hair = INK, flip, y = GROUND }: { x: number; c: string; pose?: string; s?: number; wide?: number; hair?: string; flip?: boolean; y?: number }) {
  const { arms, legs = STAND_LEGS } = POSES[pose];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Wash d={shape([-wide, -226], [wide, -226], [20, -126], [-20, -126])} c={c} op={0.35} />
      <Ink d={shape([-wide, -226], [wide, -226], [20, -126], [-20, -126])} c={c} />
      {legs.map(([knee, foot], i) => <Ink key={`l${i}`} d={line([i ? 12 : -12, -128], knee, foot)} />)}
      {arms.map(([elbow, hand], i) => <Ink key={`a${i}`} d={line([i ? wide : -wide, -222], elbow, hand)} />)}
      <Ink d={line([0, -244], [0, -226])} />
      <Ink d={circle(0, -270, 26)} />
      <path d="M -26 -276 Q -24 -302 0 -298 Q 24 -302 26 -276 Q 12 -290 -26 -276 Z" fill={hair} className="wb-fade" />
      <circle cx={-9} cy={-268} r={3.5} fill={INK} className="wb-fade" />
      <circle cx={9} cy={-268} r={3.5} fill={INK} className="wb-fade" />
      <Ink d="M -9 -256 Q 0 -249 9 -256" w={4} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// things any story can use
// ---------------------------------------------------------------------------

//a speech bubble with its tail at tail, coming off the bottom edge on the side nearest it
export const Bubble = ({ x, y, w, text, tail, c = INK, size = 34 }: { x: number; y: number; w: number; text: string; tail: Pt; c?: string; size?: number }) => {
  const base = Math.min(Math.max(tail[0], x + 50), x + w - 50);
  return (
    <g>
      <Ink d={`M ${x + 20} ${y} h ${w - 40} q 20 0 20 20 v 36 q 0 20 -20 20 H ${base + 18} L ${tail[0]} ${tail[1]} L ${base - 18} ${y + 76} H ${x + 20} q -20 0 -20 -20 v -36 q 0 -20 20 -20 Z`} c={c} w={5} />
      <Say x={x + w / 2} y={y + 50} text={text} size={size} c={c} />
    </g>
  );
};

//a thought cloud, bumps round an ellipse, with two puffs trailing back to from
function cloud(x: number, y: number, rx: number, ry: number, bumps = 11) {
  const at = (i: number): Pt => [x + rx * Math.cos((i / bumps) * 2 * Math.PI), y + ry * Math.sin((i / bumps) * 2 * Math.PI)];
  const r = Math.round((Math.PI * (rx + ry)) / bumps / 1.6);
  return `M ${pts(at(0))} ${Array.from({ length: bumps }, (_, i) => `A ${r} ${r} 0 0 1 ${pts(at(i + 1))}`).join(' ')} Z`;
}
export const Thought = ({ x, y, r, from, children }: { x: number; y: number; r: number; from: Pt; children?: ReactNode }) => (
  <g>
    {[[40, 8], [90, 14]].map(([along, size]) => {
      const k = along / Math.hypot(x - from[0], y - from[1]);
      return <Ink key={along} d={circle(from[0] + (x - from[0]) * k, from[1] + (y - from[1]) * k, size)} w={4} />;
    })}
    <Wash d={cloud(x, y, r, r * 0.62)} c={BOARD} op={1} />
    <Ink d={cloud(x, y, r, r * 0.62)} w={5} />
    {children}
  </g>
);

export const Question = ({ x, y, c = INK, size = 110 }: { x: number; y: number; c?: string; size?: number }) => <Say x={x} y={y} text="?" size={size} c={c} />;

export const Spark = ({ x, y, c = ORANGE, s = 1 }: { x: number; y: number; c?: string; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="wb-twinkle">
      <Ink d={`${line([0, -26], [0, 26])} ${line([-26, 0], [26, 0])} ${line([-14, -14], [14, 14])} ${line([-14, 14], [14, -14])}`} c={c} w={5} />
    </g>
  </g>
);

//where someone stands on a few things: a bar for them, a tick for what it takes, and the gap in red
export const Bars = ({ x, y, rows }: { x: number; y: number; rows: [string, number, number][] }) => (
  <g>
    {rows.map(([label, value, need], i) => {
      const top = y + i * 78;
      return (
        <g key={label}>
          <Say x={x} y={top + 32} text={label} size={36} anchor="start" />
          <Ink d={rect(x + 280, top + 6, 360, 34)} c={GRAY} w={4} />
          <Wash d={rect(x + 280, top + 6, 360 * value, 34)} c={value >= need ? GREEN : GRAY} op={0.6} />
          {value < need && <Wash d={rect(x + 280 + 360 * value, top + 6, 360 * (need - value), 34)} c={RED} op={0.35} />}
          <Ink d={line([x + 280 + 360 * need, top - 6], [x + 280 + 360 * need, top + 52])} c={value >= need ? GREEN : RED} w={6} />
        </g>
      );
    })}
  </g>
);

//a checklist, ticked off up to done
export const List = ({ x, y, items, done = 0, c = INK }: { x: number; y: number; items: string[]; done?: number; c?: string }) => (
  <g>
    {items.map((item, i) => (
      <g key={item}>
        <Ink d={rect(x, y + i * 70, 40, 40)} c={c} w={5} />
        {i < done && <Ink d={line([x + 6, y + i * 70 + 20], [x + 18, y + i * 70 + 34], [x + 46, y + i * 70 - 6])} c={GREEN} w={7} />}
        <Say x={x + 64} y={y + i * 70 + 34} text={item} size={38} anchor="start" />
      </g>
    ))}
  </g>
);

//a card with a heading and a few lines, for something noted or a skill's page
export const Card = ({ x, y, w, title, lines, c = INK }: { x: number; y: number; w: number; title: string; lines: string[]; c?: string }) => (
  <g>
    <Wash d={rect(x, y, w, 80 + lines.length * 52)} c={c} op={0.08} />
    <Ink d={rect(x, y, w, 80 + lines.length * 52)} c={c} w={5} />
    <Say x={x + 28} y={y + 54} text={title} size={42} c={c} anchor="start" />
    {lines.map((l, i) => <Say key={l} x={x + 36} y={y + 110 + i * 52} text={l} size={34} anchor="start" />)}
  </g>
);

export const Window = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Ink d={rect(x, y, 240, 280)} />
    <Ink d={line([x + 120, y], [x + 120, y + 280]) + ' ' + line([x, y + 140], [x + 240, y + 140])} w={5} />
    <Ink d={Array.from({ length: 7 }, (_, i) => line([x + 24 + i * 32, y + 30 + (i % 3) * 60], [x + 14 + i * 32, y + 70 + (i % 3) * 60])).join(' ')} c={BLUE} w={3} />
  </g>
);

// ---------------------------------------------------------------------------
// the board
// ---------------------------------------------------------------------------

function Board({ cue }: { cue: Cue }) {
  //parts new to the board draw on one after another; a part keeps its delay for good, since changing it would
  //rewind its animation and draw it again
  const [order] = useState(() => new Map<string, number>());
  let fresh = 0;
  for (const p of cue.parts) if (!order.has(p.key)) order.set(p.key, fresh++);
  const layers: Layer[] = cue.parts.map((p) => ({
    key: p.key,
    moving: p.moving ? p.key : undefined,
    node: <g style={{ '--d': `${(order.get(p.key) ?? 0) * 0.35}s` } as CSSProperties}>{p.node}</g>,
  }));
  return <Layers viewBox={VIEW} layers={layers} className="wb-wipe" />;
}

//the whiteboard behind a story, showing the cue for animation. An animation it has no cue for, or none at all during
//an interlude, holds the cue before it. story names it in the warning for a missing cue
export function Whiteboard({ cues, first, animation, story }: { cues: Record<string, Cue>; first: string; animation?: string; story: string }) {
  const [cue, setCue] = useState(cues[animation ?? ''] ?? cues[first]);
  const [last, setLast] = useState(animation);
  if (animation !== last) {
    setLast(animation);
    if (animation && cues[animation]) setCue(cues[animation]);
  }
  useEffect(() => {
    if (animation && !cues[animation]) console.warn(`${story} has no cue for the animation "${animation}"`);
  }, [animation, cues, story]);

  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Sheet viewBox={VIEW}>
        <rect width={W} height={H} fill={BOARD} />
        {/* ghosts of old drawings never quite wiped off */}
        <path d="M 120 120 q 200 -60 380 20 M 1180 700 q 140 40 300 -30 M 220 760 l 120 -40 M 1320 90 q 60 60 140 20" stroke="#e7e8e3" strokeWidth={14} fill="none" strokeLinecap="round" />
        <rect x={10} y={10} width={W - 20} height={H - 20} rx={10} fill="none" stroke="#c9ccd0" strokeWidth={14} />
      </Sheet>
      <Board key={cue.board} cue={cue} />
    </div>
  );
}

const keyframes = `
.wb-wipe {
  animation: wb-wipe 0.4s ease-out both;
}
@keyframes wb-wipe {
  from { opacity: 0; transform: translateX(-24px); }
}
.wb-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: wb-draw 0.7s ease-in-out var(--d, 0s) forwards;
}
@keyframes wb-draw {
  to { stroke-dashoffset: 0; }
}
.wb-fade {
  opacity: 0;
  animation: wb-fade 0.5s ease-out calc(var(--d, 0s) + 0.4s) forwards;
}
@keyframes wb-fade {
  to { opacity: 1; }
}
.wb-twinkle {
  transform-box: fill-box;
  transform-origin: center;
  animation: wb-twinkle 0.9s ease-in-out infinite alternate;
}
@keyframes wb-twinkle {
  from { transform: scale(0.6) rotate(0deg); }
  to { transform: scale(1.1) rotate(20deg); }
}
.wb-beat {
  transform-box: fill-box;
  transform-origin: center;
  animation: wb-beat 0.7s ease-in-out infinite;
}
@keyframes wb-beat {
  40% { transform: scale(1.18); }
}
.wb-bounce {
  animation: wb-bounce 0.5s cubic-bezier(0.5, 0, 0.5, 1) infinite alternate;
}
@keyframes wb-bounce {
  from { transform: translateY(-110px); }
}
.wb-drift {
  animation: wb-drift 2.4s ease-in-out infinite;
}
@keyframes wb-drift {
  from { transform: translate(0, 20px); opacity: 0; }
  30% { opacity: 1; }
  to { transform: translate(30px, -40px); opacity: 0; }
}
.wb-steam {
  animation: wb-steam 2s ease-in-out infinite;
}
@keyframes wb-steam {
  from { transform: translateY(10px); opacity: 0; }
  40% { opacity: 1; }
  to { transform: translateY(-50px); opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: BOARD,
    overflow: 'hidden',
  },
};
