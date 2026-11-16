import { type CSSProperties, type PointerEvent, useRef, useState } from 'react';
import { blue, brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountdown, useCountIn } from '../test_kit';
import { TIMED } from '../timed';

// Fluency of ideas without words: as many different designs as someone can make in a minute, each joining five dots
// with four straight lines. It's scored by counting, so there's nothing to judge: two designs are the same when they
// join the same pairs of dots. Each new line has to start or end on a dot the design already uses, so every design is
// one connected shape, as in the Ruff Figural Fluency and D-KEFS Design Fluency tests it follows.

//the five dots, as a pentagon, so no three are ever in a line and a line can't pass through a dot on its way
const DOTS: [number, number][] = Array.from({ length: 5 }, (_, i) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return [50 + 38 * Math.cos(a), 54 + 38 * Math.sin(a)];
});
//how many lines make a design, and how many designs to practice
const LINES = 4;
const PRACTICE = 2;
//how near a dot, in the box's units, a press has to be to land on it
const REACH = 14;

type Line = [number, number];
//a design, as the pairs of dots it joins, whichever way round each was drawn and in whatever order
const keyOf = (lines: Line[]) =>
  lines
    .map(([a, b]) => (a < b ? `${a}${b}` : `${b}${a}`))
    .sort()
    .join(' ');

//five dots with lines between them, the dot a line is being drawn from, and the line following the pointer from it
function Drawing({ lines, picked, rubber }: { lines: Line[]; picked?: number | null; rubber?: [number, number] | null }) {
  return (
    <g>
      {lines.map(([a, b], i) => (
        <line key={i} x1={DOTS[a][0]} y1={DOTS[a][1]} x2={DOTS[b][0]} y2={DOTS[b][1]} stroke={blue} strokeWidth={4} strokeLinecap="round" />
      ))}
      {picked !== undefined && picked !== null && rubber && (
        <line x1={DOTS[picked][0]} y1={DOTS[picked][1]} x2={rubber[0]} y2={rubber[1]} stroke={blue} strokeWidth={3} strokeDasharray="4 4" strokeLinecap="round" />
      )}
      {DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === picked ? 6.5 : 5} fill={i === picked ? brownRed : gunmetal} />
      ))}
    </g>
  );
}

//a design made, small
const Made = ({ lines }: { lines: Line[] }) => (
  <svg viewBox="0 0 100 100" width={44} height={44} style={{ display: 'block' }} aria-hidden="true">
    <Drawing lines={lines} />
  </svg>
);

//fluency of ideas: make as many different designs as you can in a minute, each joining five dots with four lines. A
//line is drawn by dragging from one dot to another, or tapping one and then the other. Repeats don't count
export function DesignFluency({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [lines, setLines] = useState<Line[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [rubber, setRubber] = useState<[number, number] | null>(null);
  const [made, setMade] = useState<Line[][]>([]); //the designs made so far, in order, repeats included
  const [note, setNote] = useState('');
  const dragging = useRef(false);
  const box = useRef<SVGSVGElement>(null);

  //the different designs made, from the ones made so far
  const different = (designs: Line[][]) => new Set(designs.map(keyOf)).size;

  const finish = () => {
    setPhase('done');
    const keys = made.map(keyOf);
    const score = different(made);
    onDone(score, {
      how: `One point for each different design you made in ${TIMED.designs.seconds} seconds: ${score}. A design joining the same dots as one before counts once, whatever order its lines were drawn in.`,
      parts: keys.map((k, i) => {
        const first = keys.indexOf(k);
        return { label: `${i + 1}`, right: first === i, note: first === i ? 'A new design' : `The same as design ${first + 1}` };
      }),
    });
  };
  const left = useCountdown(TIMED.designs.seconds, phase === 'timed', finish);

  const begin = (to: 'practice' | 'timed') =>
    countIn(() => {
      setLines([]);
      setMade([]);
      setPicked(null);
      setNote('');
      setPhase(to);
    });

  //a line between two dots, if it can go in: not one already drawn, and touching the design so far
  const draw = (a: number, b: number) => {
    if (a === b) return;
    const key = keyOf([[a, b]]);
    if (lines.some((l) => keyOf([l]) === key)) return setNote('That line is already in.');
    if (lines.length && !lines.some(([x, y]) => [x, y].includes(a) || [x, y].includes(b))) {
      return setNote('Each new line has to start or end on a dot your design already uses.');
    }
    const next: Line[] = [...lines, [a, b]];
    if (next.length < LINES) {
      setLines(next);
      return setNote('');
    }
    //the fourth line finishes the design, and a fresh box takes its place
    const repeat = made.some((d) => keyOf(d) === keyOf(next));
    const all = [...made, next];
    setMade(all);
    setLines([]);
    setNote(repeat ? "You've made that one already, so it doesn't count." : '');
    if (phase === 'practice' && all.length >= PRACTICE) {
      setMade([]);
      setPhase('between');
    }
  };

  //the dot nearest a point on the screen, if it's near enough
  const at = (e: PointerEvent<SVGSVGElement>): { dot: number | null; point: [number, number] } => {
    const r = box.current!.getBoundingClientRect();
    const point: [number, number] = [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
    let dot: number | null = null;
    let nearest = REACH;
    DOTS.forEach(([x, y], i) => {
      const d = Math.hypot(x - point[0], y - point[1]);
      if (d < nearest) {
        nearest = d;
        dot = i;
      }
    });
    return { dot, point };
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    const { dot, point } = at(e);
    if (dot === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    //a second tap finishes the line from the first
    if (picked !== null && dot !== picked) {
      draw(picked, dot);
      setPicked(null);
      return;
    }
    setPicked(dot);
    setRubber(point);
    dragging.current = true;
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) setRubber(at(e).point);
  };
  const up = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setRubber(null);
    const { dot } = at(e);
    //let go on another dot, it's a line; let go where it began, the dot stays picked for a tap on the next one
    if (dot !== null && picked !== null && dot !== picked) {
      draw(picked, dot);
      setPicked(null);
    }
  };

  const drawing = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Make as many different designs as you can by joining the five dots in the box with exactly four straight
          lines. Draw a line by dragging from one dot to another, or by tapping one dot and then the other. Each new line
          has to start or end on a dot your design already uses, so the four lines make one connected shape. As soon as
          the fourth line goes in, the design is done and a fresh box appears. Your designs stay in view below, and a
          design you've already made doesn't count again, so try to make each one different. You'll make {PRACTICE}{' '}
          designs to practice, then you have {clock(TIMED.designs.seconds)} to make as many as you can.
        </p>
      }
    >
      {drawing ? (
        <>
          <div style={styles.stage}>
            <svg ref={box} viewBox="0 0 100 100" style={styles.box} onPointerDown={down} onPointerMove={move} onPointerUp={up} role="img" aria-label="Five dots to join with four lines">
              <Drawing lines={lines} picked={picked} rubber={rubber} />
            </svg>
            <div style={styles.tools}>
              <span style={styles.lines}>
                {lines.length} of {LINES} lines
              </span>
              <button type="button" className="comic-lift" style={testStyles.secondary} disabled={!lines.length} onClick={() => setLines(lines.slice(0, -1))}>
                Undo a line
              </button>
            </div>
          </div>
          {!!made.length && (
            <div style={styles.made} aria-label="Your designs so far">
              {made.map((d, i) => (
                <div key={i} style={made.findIndex((e) => keyOf(e) === keyOf(d)) < i ? styles.repeat : styles.design}>
                  <Made lines={d} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => begin(phase === 'ready' ? 'practice' : 'timed')}>
              {phase === 'ready' ? 'Start the practice' : `Start: ${clock(TIMED.designs.seconds)}`}
            </button>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice design ${made.length + 1} of ${PRACTICE}${note ? ` · ${note}` : ''}`}
        {phase === 'between' && 'Practice done. Now as many different designs as you can.'}
        {phase === 'timed' && `${different(made)} different so far · ${clock(left)} left${note ? ` · ${note}` : ''}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  stage: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  box: {
    width: 'min(100%, 300px)',
    aspectRatio: '1',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
  },
  tools: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  lines: {
    fontSize: 15,
  },
  made: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  design: {
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
  },
  //a design made before, which doesn't count again
  repeat: {
    background: '#fff',
    border: `2px dashed ${brownRed}`,
    borderRadius: 8,
    opacity: 0.5,
  },
};
