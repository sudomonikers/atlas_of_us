import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { now, since, testStyles, useCountIn } from '../test_kit';
import { useFrames } from '../use_frames';
import { TIMING_PRACTICE, TIMINGS } from './items';

//where the dot starts and where the line is, and where the cover starts on a try with the end hidden, out of 100
const FROM = 5;
const LINE = 82;
const COVER = 55;
//the error counted for no press, in ms
const MISSED = 1000;

//rate control: stop a moving dot on the line, some tries with the end of its path hidden. The score is how far off the
//presses are on average, in ms
export function Timing({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [moving, setMoving] = useState(false);
  const [x, setX] = useState(FROM);
  const [note, setNote] = useState('');
  const live = useRef({ started: 0, pressed: true });
  const errors = useRef<number[]>([]);
  const parts = useRef<Part[]>([]); //each one that counts, as it went
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = phase === 'practice' ? TIMING_PRACTICE : TIMINGS;
  const trial = list[at];

  const launch = () => {
    setX(FROM);
    setMoving(false);
    live.current.pressed = true;
    timer.current = window.setTimeout(() => {
      live.current = { started: now(), pressed: false };
      setMoving(true);
    }, 800);
  };

  const begin = (to: 'practice' | 'timed') => {
    errors.current = [];
    parts.current = [];
    setAt(0);
    setNote('');
    setPhase(to);
    launch();
  };

  const stop = () => {
    if (live.current.pressed || !moving) return;
    live.current.pressed = true;
    setMoving(false);
    const off = since(live.current.started) - trial.seconds * 1000;
    settle(off);
  };

  const settle = (off: number) => {
    const error = Math.min(MISSED, Math.abs(off));
    if (phase === 'practice') setNote(Math.abs(off) >= MISSED ? 'Missed it.' : `${Math.round(Math.abs(off))} ms ${off < 0 ? 'early' : 'late'}.`);
    else {
      errors.current.push(error);
      const ms = Math.round(Math.abs(off));
      parts.current.push({ label: `${parts.current.length + 1}`, note: ms >= MISSED ? `Missed, counted as ${MISSED} ms off` : `${ms} ms ${off < 0 ? 'early' : 'late'}` });
    }
    timer.current = window.setTimeout(() => {
      if (at + 1 < list.length) {
        setAt(at + 1);
        return launch();
      }
      if (phase === 'practice') return setPhase('between');
      setPhase('done');
      const ms = Math.round(errors.current.reduce((s, e) => s + e, 0) / errors.current.length);
      onDone(ms, {
        how: `Your score is how far off you were on average, early or late, so lower is better: ${ms} ms. A miss counts as ${MISSED} ms off.`,
        parts: parts.current,
      });
    }, 900);
  };

  useFrames(moving, (t) => {
    const share = t / trial.seconds;
    setX(FROM + (LINE - FROM) * share);
    if (t * 1000 > trial.seconds * 1000 + MISSED && !live.current.pressed) {
      live.current.pressed = true;
      setMoving(false);
      settle(MISSED);
    }
  });

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) stop();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          A dot moves toward the line at different speeds. Press the space bar or Stop the moment it reaches the line.
          On some tries the end of its path is covered, so you'll have to judge when it gets there. You'll get three to
          practice, then {TIMINGS.length} that count.
        </p>
      }
    >
      {asking ? (
        <>
          <svg viewBox="0 0 100 24" style={styles.track} aria-label="The track">
            <rect width={100} height={24} fill={ivory} />
            <line x1={LINE} y1={2} x2={LINE} y2={22} stroke={brownRed} strokeWidth={0.8} />
            <circle cx={x} cy={12} r={2.6} fill={gunmetal} />
            {trial.hidden && <rect x={COVER} y={0} width={LINE - COVER} height={24} fill="#cfcfcf" />}
            {trial.hidden && <line x1={LINE} y1={2} x2={LINE} y2={22} stroke={brownRed} strokeWidth={0.8} />}
          </svg>
          <button type="button" className="comic-lift" style={{ ...testStyles.choice, padding: '22px 10px' }} onPointerDown={stop}>
            Stop
          </button>
        </>
      ) : (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(() => begin(phase === 'ready' ? 'practice' : 'timed'))}>
              {phase === 'ready' ? 'Start the practice' : `Start: ${TIMINGS.length} tries`}
            </button>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${list.length}${note ? ` · ${note}` : ''}`}
        {phase === 'between' && 'Practice done.'}
        {phase === 'timed' && `${at + 1} of ${list.length}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  track: {
    width: '100%',
    border: `3px solid ${gunmetal}`,
    borderRadius: 10,
  },
};
