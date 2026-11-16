import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { type Phase, Starter } from '../starter';
import { Frame } from '../test_frame';
import { chance, mean, now, since, testStyles, useCountIn } from '../test_kit';
import { type Arrows, ARROWS, ARROWS_PRACTICE } from './items';

//the slowest answer that counts, and the share that have to be right for the score to count
const ARROW_WINDOW = [150, 2000];
const ARROW_ACCURACY = 0.75;

const row = (a: Arrows) => {
  const middle = a.left ? '<' : '>';
  const side = a.same ? middle : a.left ? '>' : '<';
  return [side, side, middle, side, side].join(' ');
};

//selective attention: say which way the middle arrow points, ignoring the ones around it. The score is how much slower
//the right answers are when the others point the other way
export function DistractingArrows({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(false);
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState(false);
  //kept in a ref as well as state, since a timer can answer for the person (too slow) as well as a press
  const live = useRef({ phase: 'ready' as Phase, at: 0, shownAt: 0, answered: true });
  const times = useRef({ same: [] as number[], other: [] as number[], wrong: 0, parts: [] as Part[] });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = phase === 'practice' ? ARROWS_PRACTICE : ARROWS;
  const to = (p: Phase) => {
    live.current.phase = p;
    setPhase(p);
  };

  const show = (i: number) => {
    setShown(false);
    setAt(i);
    live.current.at = i;
    live.current.answered = true;
    timer.current = window.setTimeout(() => {
      setShown(true);
      live.current.shownAt = now();
      live.current.answered = false;
      timer.current = window.setTimeout(() => respond(null), ARROW_WINDOW[1]);
    }, 500 + chance() * 400);
  };

  const begin = (next: 'practice' | 'timed') => {
    times.current = { same: [], other: [], wrong: 0, parts: [] };
    setFailed(false);
    setNote('');
    to(next);
    show(0);
  };

  //an answer: true for left, false for right, null for none in time
  const respond = (left: boolean | null) => {
    if (live.current.answered) return;
    live.current.answered = true;
    clearTimeout(timer.current);
    const { phase, at: i } = live.current;
    const list = phase === 'practice' ? ARROWS_PRACTICE : ARROWS;
    const a = list[i];
    const time = since(live.current.shownAt);
    const correct = left === a.left && time >= ARROW_WINDOW[0];
    if (phase === 'practice') setNote(left === null ? 'Too slow.' : correct ? 'Right.' : 'Wrong way.');
    else {
      if (correct) (a.same ? times.current.same : times.current.other).push(time);
      else times.current.wrong += 1;
      const kind = a.same ? 'Others the same way' : 'Others the other way';
      const ms = Math.round(time);
      times.current.parts.push({
        label: `${i + 1}`,
        right: correct,
        note: `${kind}: ${left === null ? 'no press in time' : correct ? `${ms} ms` : time < ARROW_WINDOW[0] ? `${ms} ms, too soon to be a reaction` : 'wrong way'}`,
      });
    }
    if (i + 1 < list.length) return show(i + 1);
    setShown(false);
    if (phase === 'practice') return to('between');
    to('done');
    const { same, other, wrong } = times.current;
    if ((list.length - wrong) / list.length < ARROW_ACCURACY || !same.length || !other.length) return setFailed(true);
    const score = Math.round(mean(other) - mean(same));
    onDone(score, {
      how: `Your score is how much slower you were when the arrows around the middle one pointed the other way, so lower is better. Only right answers are timed: ${Math.round(mean(other))} ms with them the other way, less ${Math.round(mean(same))} ms with them the same way, is ${score} ms.`,
      parts: times.current.parts,
    });
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' || e.key === 'ArrowLeft') respond(true);
      else if (e.code === 'KeyJ' || e.key === 'ArrowRight') respond(false);
      else return;
      e.preventDefault();
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
          A row of five arrows appears, and your job is to say which way the <strong>middle</strong> one points. Press F
          or the left arrow key for left and J or the right arrow key for right – or tap the buttons. The arrows on
          either side sometimes point the same way as the middle one and sometimes the opposite way to throw you off, so
          keep your eyes on the middle. Answer as quickly as you can while still getting them right. You'll start with a
          few practice rows, then there are {ARROWS.length} that count.
        </p>
      }
    >
      {asking ? (
        <>
          <div style={{ ...testStyles.arena, cursor: 'default' }}>
            <span style={styles.arrows}>{shown ? row(list[at]) : '+'}</span>
          </div>
          <div style={styles.pair}>
            <button type="button" className="comic-lift" style={testStyles.choice} onPointerDown={() => respond(true)}>
              Left (F)
            </button>
            <button type="button" className="comic-lift" style={testStyles.choice} onPointerDown={() => respond(false)}>
              Right (J)
            </button>
          </div>
        </>
      ) : failed ? (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => begin('timed')}>
            Too many wrong to count. Try again
          </button>
        </div>
      ) : (
        <Starter phase={phase} label={`Start: ${ARROWS.length} rows`} onStart={() => countIn(() => begin(phase === 'ready' ? 'practice' : 'timed'))} />
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
  arrows: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 700,
    fontSize: 'clamp(36px, 10vw, 60px)',
    letterSpacing: 2,
    whiteSpace: 'pre',
  },
  pair: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
};
