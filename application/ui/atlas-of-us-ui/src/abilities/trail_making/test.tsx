import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { blue, brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { now, seeded, since, testStyles, useCountIn } from '../test_kit';

//where each circle of a trail goes, as shares of the board's width and height, spread so none crowd each other
function trail(count: number, seed: number): [number, number][] {
  const random = seeded(seed);
  const spots: [number, number][] = [];
  let gap = 0.18;
  while (spots.length < count) {
    let placed = false;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const spot: [number, number] = [0.07 + random() * 0.86, 0.07 + random() * 0.86];
      if (spots.every(([x, y]) => Math.hypot(x - spot[0], y - spot[1]) >= gap)) {
        spots.push(spot);
        placed = true;
      }
    }
    if (!placed) gap *= 0.95;
  }
  return spots;
}

//the label of the circle at a place on a trail: 1, A, 2, B and on
const label = (i: number) => (i % 2 ? String.fromCharCode(65 + (i - 1) / 2) : String(i / 2 + 1));

//the trails: a short one to practice on, and the one that's timed, the same for everyone
const PRACTICE_TRAIL = trail(8, 7);
const TIMED_TRAIL = trail(25, 2026);

//tap the circles in order, switching between numbers and letters: 1, A, 2, B and on to 13. A wrong tap doesn't
//count, and the clock keeps running, as when the examiner points out a slip on paper. Timed from the first circle
export function TrailMaking({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [next, setNext] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const startedAt = useRef(0);
  const timer = useRef(0);
  const slips = useRef<Part[]>([]); //the wrong taps on the trail that counts
  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  const spots = phase === 'practice' ? PRACTICE_TRAIL : TIMED_TRAIL;
  const begin = (to: 'practice' | 'timed') => {
    setNext(0);
    setNote('');
    setPhase(to);
  };

  const tap = (i: number) => {
    if (i < next) return;
    if (i > next) {
      clearTimeout(timer.current);
      setWrong(i);
      timer.current = window.setTimeout(() => setWrong(null), 500);
      setNote(next ? `Not that one. After ${label(next - 1)} comes ${label(next)}.` : 'Start at 1.');
      if (phase === 'timed') slips.current.push({ label: next ? `After ${label(next - 1)}` : 'First', right: false, note: `You tapped ${label(i)}, it was ${label(next)}` });
      return;
    }
    if (i === 0 && phase === 'timed') startedAt.current = now();
    setNote('');
    if (i < spots.length - 1) return setNext(i + 1);
    setNext(spots.length);
    if (phase === 'practice') return setPhase('between');
    setPhase('done');
    const seconds = Math.round(since(startedAt.current) / 100) / 10;
    onDone(seconds, {
      how: `Your score is how long the whole trail took, from tapping 1 to tapping the last circle, so lower is better: ${seconds} seconds. A wrong tap takes nothing off, but the clock keeps running while you find the right one.`,
      right: spots.length,
      wrong: slips.current.length,
      parts: slips.current,
    });
  };

  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          Tap the circles in order, switching back and forth between numbers and letters: 1, then A, then 2, then B, and
          so on up to 13. If you tap the wrong one I'll tell you which comes next, but it costs you time, so go as fast
          as you can without slipping. You'll start with a short practice, then there are 25 circles that count, and the
          clock starts when you tap 1.
        </p>
      }
    >
      {phase === 'ready' || phase === 'between' || phase === 'done' ? (
        <div style={styles.arena}>
          {phase === 'done' ? (
            <span style={styles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={styles.primary} onClick={() => countIn(() => begin(phase === 'ready' ? 'practice' : 'timed'))}>
              {phase === 'ready' ? 'Start the practice' : 'Start the real one'}
            </button>
          )}
        </div>
      ) : (
        <div style={styles.board} aria-label={`Trail of ${spots.length} circles`}>
          <svg style={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {spots.slice(1, next).map(([x, y], i) => (
              <line key={i} x1={spots[i][0] * 100} y1={spots[i][1] * 100} x2={x * 100} y2={y * 100} stroke={gunmetal} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {spots.map(([x, y], i) => (
            <button
              key={i}
              type="button"
              style={{
                ...styles.dot,
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                background: wrong === i ? brownRed : i < next ? blue : '#fff',
                color: wrong === i || i < next ? ivory : gunmetal,
              }}
              onPointerDown={() => tap(i)}
            >
              {label(i)}
            </button>
          ))}
        </div>
      )}
      <p style={styles.status} aria-live="polite">
        {phase === 'practice' ? 'Practice' : phase === 'between' ? 'Practice done. The real one has 25 circles.' : ''}
        {note && `${phase === 'practice' ? ' · ' : ''}${note}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  ...testStyles,
  board: {
    position: 'relative',
    width: '100%',
    maxWidth: 'min(520px, 100cqh - 90px)', //square, and short enough to fit the stage with its status line
    aspectRatio: '1',
    alignSelf: 'center',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    touchAction: 'manipulation',
    userSelect: 'none',
  },
  lines: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  dot: {
    position: 'absolute',
    width: 38,
    height: 38,
    padding: 0,
    transform: 'translate(-50%, -50%)',
    border: `2px solid ${gunmetal}`,
    borderRadius: '50%',
    font: 'inherit',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
