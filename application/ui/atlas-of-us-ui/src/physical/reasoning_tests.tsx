import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import {
  FOLDING_ITEMS, FOLDING_PRACTICE, MAP, MATRIX_ITEMS, MATRIX_PRACTICE, PAPER, PERSPECTIVE_ITEMS, PERSPECTIVE_PRACTICE,
  ROTATION_ITEMS, ROTATION_PRACTICE, SERIES_ITEMS, SERIES_PRACTICE, SYLLOGISM_ITEMS, SYLLOGISM_PRACTICE, TIMED, regions, turn,
  type Cube, type Figure, type Fold, type Folding, type Hole, type Matrix, type Perspective, type Rotation as RotationItem,
} from './puzzles';
import type { TestProps } from './self_tests';
import { Frame, ItemTest, type Item } from './test_frame';
import { clock, mean, testStyles, useCountdown } from './test_kit';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//how dark a figure is: white, grey or black
const SHADES = ['#fff', '#9a9a9a', '#2b2b2b'];
//how big a figure is, as a share of the room it has
const SIZES = [0.55, 0.78, 1];

// ---------------------------------------------------------------------------------------------------------------------
// Matrix puzzles
// ---------------------------------------------------------------------------------------------------------------------

//one shape, centred on a point, with room r around it
function shapeAt(shape: number, x: number, y: number, r: number, fill: string, key: number) {
  const line = { fill, stroke: '#2b2b2b', strokeWidth: 1.5 };
  if (shape === 0) return <circle key={key} cx={x} cy={y} r={r} {...line} />;
  if (shape === 1) return <rect key={key} x={x - r * 0.85} y={y - r * 0.85} width={r * 1.7} height={r * 1.7} {...line} />;
  if (shape === 2) return <polygon key={key} points={`${x},${y - r} ${x + r * 0.95},${y + r * 0.75} ${x - r * 0.95},${y + r * 0.75}`} {...line} />;
  return <polygon key={key} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...line} />;
}

//a cell's figure: one to three of a shape, in a 60 by 60 box
function FigureView({ figure, size = 60 }: { figure: Figure; size?: number }) {
  const { shape, count, shade } = figure;
  const scale = SIZES[figure.size];
  const spots: [number, number, number][] =
    count === 1 ? [[30, 30, 22]] : count === 2 ? [[17, 30, 12], [43, 30, 12]] : [[30, 16, 10.5], [16, 42, 10.5], [44, 42, 10.5]];
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      {spots.map(([x, y, r], i) => shapeAt(shape, x, y, r * scale, SHADES[shade], i))}
    </svg>
  );
}

function MatrixGrid({ matrix }: { matrix: Matrix }) {
  return (
    <div style={styles.grid} role="img" aria-label="A grid of eight figures with the last one missing">
      {[...matrix.cells, null].map((f, i) => (
        <div key={i} style={styles.cell}>
          {f ? <FigureView figure={f} /> : <span style={styles.missing}>?</span>}
        </div>
      ))}
    </div>
  );
}

const matrixItem = (m: Matrix): Item => ({
  prompt: <MatrixGrid matrix={m} />,
  choices: m.choices.map((f, i) => <FigureView key={i} figure={f} size={54} />),
  answer: m.answer,
  columns: 6,
});

//inductive reasoning: pick the figure that completes the grid
export function Matrices({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each grid has figures that change by rules as you go along the rows: the shape, how many, how big or how dark.
          The last one is missing. Work out the rules and pick the figure that fits. Two to practise, then{' '}
          {TIMED.matrices.count} in {clock(TIMED.matrices.seconds)}.
        </p>
      }
      practice={MATRIX_PRACTICE.map(matrixItem)}
      items={MATRIX_ITEMS.map(matrixItem)}
      seconds={TIMED.matrices.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Number series
// ---------------------------------------------------------------------------------------------------------------------

const seriesItem = (s: { shown: number[]; answer: number }): Item => ({
  prompt: <p style={styles.series}>{[...s.shown, '?'].join(',  ')}</p>,
  answer: s.answer,
});

//inductive reasoning: type the next number of a series
export function Series({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each row of numbers follows a rule. Work it out and type the number that comes next. Two to practise, then{' '}
          {TIMED.series.count} in {clock(TIMED.series.seconds)}. No calculator.
        </p>
      }
      practice={SERIES_PRACTICE.map(seriesItem)}
      items={SERIES_ITEMS.map(seriesItem)}
      seconds={TIMED.series.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Shape rotation
// ---------------------------------------------------------------------------------------------------------------------

//the angle the shapes are seen from: turned a little and looked down on
const YAW = (35 * Math.PI) / 180;
const PITCH = (28 * Math.PI) / 180;
const LIGHT = (() => {
  const l = [0.45, 0.75, 0.5];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

const view = ([x, y, z]: number[]): number[] => {
  const x1 = x * Math.cos(YAW) + z * Math.sin(YAW);
  const z1 = -x * Math.sin(YAW) + z * Math.cos(YAW);
  return [x1, y * Math.cos(PITCH) - z1 * Math.sin(PITCH), y * Math.sin(PITCH) + z1 * Math.cos(PITCH)];
};

const SIDES: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

//a shape of blocks drawn in 3D: the faces that show, furthest first, shaded by how they face the light
function Blocks({ cubes, size }: { cubes: Cube[]; size: number }) {
  const filled = new Set(cubes.map((c) => c.join()));
  const centre = [0, 1, 2].map((a) => cubes.reduce((s, c) => s + c[a], 0) / cubes.length);
  const faces: { points: number[][]; depth: number; light: number }[] = [];
  for (const c of cubes) {
    for (const n of SIDES) {
      if (filled.has([c[0] + n[0], c[1] + n[1], c[2] + n[2]].join())) continue;
      const normal = view(n);
      if (normal[2] <= 0.001) continue;
      //the face's corners: the two directions across it, around the point at the middle of the face
      const [u, v] = SIDES.filter((s) => s.every((x, i) => x * n[i] === 0) && s.some((x) => x > 0));
      const middle = [0, 1, 2].map((a) => c[a] - centre[a] + n[a] / 2);
      const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => view([0, 1, 2].map((i) => middle[i] + (u[i] * a + v[i] * b) / 2)));
      faces.push({
        points: corners,
        depth: corners.reduce((s, p) => s + p[2], 0) / 4,
        light: 0.35 + 0.65 * Math.max(0, normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2]),
      });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
  const reach = Math.max(...faces.flatMap((f) => f.points.flatMap((p) => [Math.abs(p[0]), Math.abs(p[1])]))) + 0.3;
  return (
    <svg width={size} height={size} viewBox={`${-reach} ${-reach} ${reach * 2} ${reach * 2}`} aria-hidden="true">
      {faces.map((f, i) => {
        const g = Math.round(90 + 150 * f.light);
        return (
          <polygon
            key={i}
            points={f.points.map((p) => `${p[0]},${-p[1]}`).join(' ')}
            fill={`rgb(${g}, ${g}, ${Math.min(255, g + 12)})`}
            stroke="#2b2b2b"
            strokeWidth={0.05}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

const rotationItem = (r: RotationItem): Item => ({
  prompt: (
    <>
      <Blocks cubes={r.target} size={170} />
      <span style={styles.small}>Which one is this shape turned around?</span>
    </>
  ),
  choices: r.choices.map((c, i) => <Blocks key={i} cubes={c} size={120} />),
  answer: r.answer,
  columns: 4,
});

//visualization: pick the shape that's the first one turned, not its mirror image
export function Rotation({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a shape made of blocks. One of the four below it is the same shape, turned around. The other
          three are its mirror image, which no turning can make the same. Pick the one that matches. Two to practise, then{' '}
          {TIMED.rotation.count} in {clock(TIMED.rotation.seconds)}.
        </p>
      }
      practice={ROTATION_PRACTICE.map(rotationItem)}
      items={ROTATION_ITEMS.map(rotationItem)}
      seconds={TIMED.rotation.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Paper folding
// ---------------------------------------------------------------------------------------------------------------------

const BOX = `-0.4 -0.4 ${PAPER + 0.8} ${PAPER + 0.8}`;

//one step of the folding: the paper as it is, with the half that's folded over shaded and an arrow showing where it goes
function FoldStep({ folds, step }: { folds: Fold[]; step: number }) {
  const shown = regions(folds);
  const r = shown[step];
  const fold = folds[step];
  const stays = step < folds.length ? shown[step + 1] : r;
  const moving = fold && {
    x0: fold === 'left' ? r.x0 : fold === 'right' ? stays.x1 : r.x0,
    x1: fold === 'left' ? stays.x0 : r.x1,
    y0: fold === 'top' ? r.y0 : fold === 'bottom' ? stays.y1 : r.y0,
    y1: fold === 'top' ? stays.y0 : r.y1,
  };
  const centre = (g: { x0: number; x1: number; y0: number; y1: number }) => [(g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2];
  return (
    <svg width={96} height={96} viewBox={BOX} aria-hidden="true">
      <defs>
        <marker id={`arrow-${step}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={brownRed} />
        </marker>
      </defs>
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="none" stroke="#bbb" strokeWidth={0.04} strokeDasharray="0.15 0.12" />
      <rect x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      {moving && (
        <>
          <rect x={moving.x0} y={moving.y0} width={moving.x1 - moving.x0} height={moving.y1 - moving.y0} fill="#ddd" stroke="#2b2b2b" strokeWidth={0.06} />
          <line
            x1={centre(moving)[0]}
            y1={centre(moving)[1]}
            x2={centre(stays)[0]}
            y2={centre(stays)[1]}
            stroke={brownRed}
            strokeWidth={0.1}
            markerEnd={`url(#arrow-${step})`}
          />
        </>
      )}
    </svg>
  );
}

//the folded paper with the hole punched through it
function Punched({ folding }: { folding: Folding }) {
  const r = regions(folding.folds)[folding.folds.length];
  return (
    <svg width={96} height={96} viewBox={BOX} aria-hidden="true">
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="none" stroke="#bbb" strokeWidth={0.04} strokeDasharray="0.15 0.12" />
      <rect x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      <circle cx={folding.punch[0] + 0.5} cy={folding.punch[1] + 0.5} r={0.22} fill="#2b2b2b" />
    </svg>
  );
}

//the whole sheet unfolded, with its holes
function Unfolded({ holes }: { holes: Hole[] }) {
  return (
    <svg width={84} height={84} viewBox={BOX} aria-hidden="true">
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      {holes.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x + 0.5} cy={y + 0.5} r={0.22} fill="#2b2b2b" />
      ))}
    </svg>
  );
}

const foldingItem = (f: Folding): Item => ({
  prompt: (
    <div style={styles.steps} role="img" aria-label={`The paper folded ${f.folds.length} times, then punched`}>
      {f.folds.map((_, i) => (
        <FoldStep key={i} folds={f.folds} step={i} />
      ))}
      <Punched folding={f} />
    </div>
  ),
  choices: f.choices.map((holes, i) => <Unfolded key={i} holes={holes} />),
  answer: f.answer,
  columns: 5,
});

//visualization: where the holes end up when folded paper is punched and unfolded
export function PaperFolding({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          A square of paper is folded, one step at a time from left to right: the grey part folds over along the arrow.
          Then a hole is punched through every layer. Pick how the paper looks unfolded. Two to practise, then{' '}
          {TIMED.folding.count} in {clock(TIMED.folding.seconds)}.
        </p>
      }
      practice={FOLDING_PRACTICE.map(foldingItem)}
      items={FOLDING_ITEMS.map(foldingItem)}
      seconds={TIMED.folding.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Perspective taking
// ---------------------------------------------------------------------------------------------------------------------

//how far off an answer not given counts as: what pointing anywhere at random averages
const UNANSWERED = 90;

function MapView() {
  return (
    <svg viewBox="-8 -6 116 112" style={styles.map} role="img" aria-label="A map of seven things">
      <rect x={-8} y={-6} width={116} height={112} fill={ivory} />
      {MAP.map((m) => (
        <g key={m.name}>
          <circle cx={m.x * 100} cy={m.y * 100} r={2.6} fill={gunmetal} />
          <text x={m.x * 100} y={m.y * 100 + 8} textAnchor="middle" fontSize={5.5} fontFamily="inherit" fill={gunmetal}>
            {m.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

//a point on the circle, at degrees clockwise from the top
const onCircle = (degrees: number, r: number) => [r * Math.sin((degrees * Math.PI) / 180), -r * Math.cos((degrees * Math.PI) / 180)];

//the circle a person points on: standing at the middle, facing the top
function Pointer({ item, pointed, shown, onPoint }: { item: Perspective; pointed: number | null; shown: boolean; onPoint: (degrees: number) => void }) {
  const point = (e: PointerEvent<SVGSVGElement>) => {
    if (shown || (e.type === 'pointermove' && !e.buttons)) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    onPoint(Math.round((Math.atan2(x, -y) * 180) / Math.PI));
  };
  const line = (degrees: number, colour: string) => {
    const [x, y] = onCircle(degrees, 44);
    return <line x1={0} y1={0} x2={x} y2={y} stroke={colour} strokeWidth={2.2} strokeLinecap="round" />;
  };
  return (
    <svg viewBox="-60 -60 120 120" style={styles.pointer} onPointerDown={point} onPointerMove={point} role="img" aria-label="Point on the circle">
      <circle cx={0} cy={0} r={44} fill="#fff" stroke={gunmetal} strokeWidth={1.2} />
      <line x1={0} y1={0} x2={0} y2={-44} stroke={gunmetal} strokeWidth={1.2} strokeDasharray="3 2" />
      <text x={0} y={-49} textAnchor="middle" fontSize={7} fill={gunmetal}>{MAP[item.facing].name}</text>
      <text x={0} y={10} textAnchor="middle" fontSize={6} fill={gunmetal}>{MAP[item.at].name}</text>
      <circle cx={0} cy={0} r={2.2} fill={gunmetal} />
      {shown && line(item.angle, blue)}
      {pointed !== null && line(pointed, brownRed)}
    </svg>
  );
}

//spatial orientation: imagine standing at one thing, facing a second, and point to a third. The score is how far off
//the pointing is on average, in degrees
export function PerspectiveTaking({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [pointed, setPointed] = useState<number | null>(null);
  const [told, setTold] = useState<number | null>(null); //how far off a practice answer was
  const errors = useRef<number[]>([]);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const missed = PERSPECTIVE_ITEMS.length - errors.current.length;
    const all = [...errors.current, ...Array<number>(missed).fill(UNANSWERED)];
    setPhase('done');
    onDone(Math.round(mean(all)));
  };
  const left = useCountdown(TIMED.perspective.seconds, phase === 'timed', finish);

  const list = phase === 'practice' ? PERSPECTIVE_PRACTICE : PERSPECTIVE_ITEMS;
  const item = list[at];

  const next = () => {
    if (pointed === null) return;
    const off = Math.abs(turn(item.angle, pointed));
    if (phase === 'practice' && told === null) return setTold(off);
    setPointed(null);
    setTold(null);
    if (phase === 'practice') {
      if (at + 1 < PERSPECTIVE_PRACTICE.length) setAt(at + 1);
      else {
        setAt(0);
        setPhase('between');
      }
      return;
    }
    errors.current.push(off);
    if (at + 1 < PERSPECTIVE_ITEMS.length) setAt(at + 1);
    else finish();
  };

  const asking = (phase === 'practice' || phase === 'timed') && item;
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Use the map. For each question, imagine you're standing at one thing and facing a second, then point to a third
          by tapping or dragging on the circle, where straight ahead is the top. Don't turn the screen. Two to practise,
          then {TIMED.perspective.count} in {clock(TIMED.perspective.seconds)}.
        </p>
      }
    >
      {!asking ? (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button
              type="button"
              className="comic-lift"
              style={testStyles.primary}
              onClick={() => {
                setAt(0);
                setPhase(phase === 'ready' ? 'practice' : 'timed');
              }}
            >
              {phase === 'ready' ? 'Start the practice' : `Start: ${PERSPECTIVE_ITEMS.length} in ${clock(TIMED.perspective.seconds)}`}
            </button>
          )}
        </div>
      ) : (
        <div style={styles.perspective}>
          <MapView />
          <div style={styles.respond}>
            <p style={styles.ask}>
              Standing at the <strong>{MAP[item.at].name}</strong>, facing the <strong>{MAP[item.facing].name}</strong>.
              Point to the <strong>{MAP[item.target].name}</strong>.
            </p>
            <Pointer item={item} pointed={pointed} shown={told !== null} onPoint={setPointed} />
            {told !== null && <p style={testStyles.text}>You were {told} degrees off. The blue line is right.</p>}
            <button type="button" className="comic-lift" style={testStyles.primary} disabled={pointed === null} onClick={next}>
              {told === null && phase === 'practice' ? 'Check it' : 'Next'}
            </button>
          </div>
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${PERSPECTIVE_PRACTICE.length}`}
        {phase === 'between' && `Practice done. Now ${PERSPECTIVE_ITEMS.length} that count, with ${clock(TIMED.perspective.seconds)} on the clock.`}
        {phase === 'timed' && `${at + 1} of ${PERSPECTIVE_ITEMS.length} · ${clock(left)} left`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Syllogisms
// ---------------------------------------------------------------------------------------------------------------------

const syllogismItem = (s: { premises: string[]; conclusion: string; follows: boolean }): Item => ({
  prompt: (
    <div style={styles.argument}>
      {s.premises.map((p) => (
        <p key={p} style={styles.premise}>{p}</p>
      ))}
      <p style={styles.conclusion}>So: {s.conclusion}</p>
    </div>
  ),
  choices: ['It follows', "It doesn't follow"],
  answer: s.follows ? 0 : 1,
});

//deductive reasoning: does the conclusion have to be true if what's given is?
export function Syllogisms({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question gives a few facts about made-up things, then a conclusion. Take the facts as true, and say whether
          the conclusion has to be true because of them. It follows only if it can't be false. Two to practise, then{' '}
          {TIMED.syllogisms.count} in {clock(TIMED.syllogisms.seconds)}.
        </p>
      }
      practice={SYLLOGISM_PRACTICE.map(syllogismItem)}
      items={SYLLOGISM_ITEMS.map(syllogismItem)}
      seconds={TIMED.syllogisms.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 64px)',
    gap: 4,
    padding: 4,
    background: gunmetal,
    borderRadius: 6,
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    background: '#fff',
  },
  missing: {
    fontFamily: comic,
    fontSize: 34,
    color: brownRed,
  },
  series: {
    margin: 0,
    fontFamily: comic,
    fontSize: 'clamp(20px, 5vw, 30px)',
    letterSpacing: 1,
    textAlign: 'center',
  },
  small: {
    fontSize: 14,
  },
  steps: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  perspective: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  map: {
    flex: '1 1 260px',
    maxWidth: 380,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
  },
  respond: {
    flex: '1 1 240px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ask: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  pointer: {
    width: '100%',
    maxWidth: 280,
    touchAction: 'none',
    cursor: 'crosshair',
  },
  argument: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignSelf: 'stretch',
  },
  premise: {
    margin: 0,
    fontSize: 17,
  },
  conclusion: {
    margin: '6px 0 0',
    fontSize: 17,
    fontWeight: 700,
  },
};
