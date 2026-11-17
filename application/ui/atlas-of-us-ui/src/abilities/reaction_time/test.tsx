import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { brownRed, gunmetal } from '../../shared_components/palette';
import { painted, pause, type Phase, PRACTICE } from '../reactions';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { mean, since, testStyles, useCountIn } from '../test_kit';

//how many tries count
const SIMPLE_TRIES = 30;

//the fastest press that's a reaction rather than a guess, and the slowest that still counts, in ms. As in the studies
//the norms come from
const SIMPLE_WINDOW = [110, 1000];

//press as soon as a target appears, after a random wait. Pressing during the wait starts that try again
export function SimpleReaction({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [note, setNote] = useState('');
  const [count, setCount] = useState(0); //tries done, practice included
  const [counted, setCounted] = useState(0);
  const times = useRef<number[]>([]);
  const parts = useRef<Part[]>([]); //each try after the practice, as it went
  const shownAt = useRef(0);
  const timer = useRef(0);

  const next = useCallback(() => {
    setPhase('waiting');
    timer.current = window.setTimeout(() => {
      setPhase('shown');
      shownAt.current = 0;
      painted((t) => (shownAt.current = t));
    }, pause(1000, 2000));
  }, []);
  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  const press = useCallback(() => {
    if (phase === 'ready') return countIn(next);
    if (phase === 'waiting') {
      clearTimeout(timer.current);
      setNote('Too soon. Wait for the target.');
      if (count >= PRACTICE) parts.current.push({ label: '-', right: false, note: 'Pressed before the circle showed, so that try started again' });
      return next();
    }
    if (phase !== 'shown' || !shownAt.current) return;
    const time = since(shownAt.current);
    const done = count + 1;
    setCount(done);
    const ms = Math.round(time);
    const label = `${parts.current.filter((p) => p.label !== '-').length + 1}`;
    if (done > PRACTICE)
      parts.current.push(
        time < SIMPLE_WINDOW[0]
          ? { label, right: false, note: `${ms} ms, too soon to be a reaction, so it didn't count` }
          : time > SIMPLE_WINDOW[1]
            ? { label, right: false, note: `${ms} ms, too slow to count` }
            : { label, right: true, note: `${ms} ms` },
      );
    if (time < SIMPLE_WINDOW[0]) setNote('That was a guess, so it doesn\'t count.');
    else if (time > SIMPLE_WINDOW[1]) setNote('Too slow to count. Stay ready.');
    else {
      setNote(`${Math.round(time)} ms`);
      if (done > PRACTICE) times.current.push(time);
      setCounted(times.current.length);
    }
    if (times.current.length >= SIMPLE_TRIES) {
      setPhase('done');
      const ms = Math.round(mean(times.current));
      onDone(ms, {
        how: `Your score is your average time over the ${SIMPLE_TRIES} tries that counted, so lower is better: ${ms} ms. A press under ${SIMPLE_WINDOW[0]} ms is a guess and one over ${SIMPLE_WINDOW[1]} ms is too slow, and neither counts, so those tries were taken again.`,
        parts: parts.current,
      });
    } else next();
  }, [phase, count, next, onDone, countIn]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      press();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [press]);

  const practice = count < PRACTICE;
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          When the red circle appears, press the space bar or tap the box as fast as you can. The first {PRACTICE} are
          practice, then {SIMPLE_TRIES} count. Sit comfortably with a finger ready.
        </p>
      }
    >
      <button type="button" style={styles.arena} onPointerDown={press} aria-label="The reaction box">
        {phase === 'ready' && <span style={styles.prompt}>Tap here or press space to start</span>}
        {phase === 'shown' && <span style={styles.target} />}
        {phase === 'done' && <span style={styles.prompt}>Done</span>}
      </button>
      <p style={styles.status} aria-live="polite">
        {phase === 'ready' ? '' : practice ? `Practice ${Math.min(count + 1, PRACTICE)} of ${PRACTICE}` : `${counted} of ${SIMPLE_TRIES}`}
        {note && ` · ${note}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  ...testStyles,
  target: {
    width: 90,
    height: 90,
    background: brownRed,
    border: `4px solid ${gunmetal}`,
    borderRadius: '50%',
  },
};
