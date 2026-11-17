import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { blue, cinnamon } from '../../shared_components/palette';
import { painted, pause, type Phase, PRACTICE } from '../reactions';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { chance, mean, since, testStyles, useCountIn } from '../test_kit';

//how many tries count
const CHOICE_TRIES = 40;

const CHOICE_WINDOW = [150, 1250];
//how long a choice reaction's letter stays up, in ms
const CHOICE_SHOWN = 200;
//the share of choice reactions that have to be right for the time to count
const CHOICE_ACCURACY = 0.7;

//a blue P, or a decoy: an orange F, a blue F or an orange P
interface Stimulus {
  letter: 'P' | 'F';
  color: 'blue' | 'orange';
}

const target = (s: Stimulus) => s.letter === 'P' && s.color === 'blue';

//the next stimulus: a blue P four times in ten, each decoy twice in ten
function draw(): Stimulus {
  const r = chance();
  if (r < 0.4) return { letter: 'P', color: 'blue' };
  if (r < 0.6) return { letter: 'F', color: 'orange' };
  if (r < 0.8) return { letter: 'F', color: 'blue' };
  return { letter: 'P', color: 'orange' };
}

//press one button for a blue P and the other for anything else, as fast as you can while getting it right. The tries
//are kept in refs, since a timer can answer for the person (a miss) as well as a press
export function ChoiceReaction({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [stimulus, setStimulus] = useState<Stimulus>();
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState({ tries: 0, counted: 0 });
  const [failed, setFailed] = useState(false);
  const live = useRef({ phase: 'ready' as Phase, stimulus: null as Stimulus | null, shownAt: 0, tries: 0, counted: 0, right: [] as number[], parts: [] as Part[] });
  const timers = useRef<number[]>([]);

  const clear = () => timers.current.splice(0).forEach(clearTimeout);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const to = (phase: Phase) => {
    live.current.phase = phase;
    setPhase(phase);
  };

  const next = () => {
    clear();
    to('waiting');
    setVisible(false);
    timers.current.push(window.setTimeout(() => {
      const s = draw();
      live.current.stimulus = s;
      live.current.shownAt = 0;
      setStimulus(s);
      to('shown');
      setVisible(true);
      painted((t) => (live.current.shownAt = t));
      timers.current.push(window.setTimeout(() => setVisible(false), CHOICE_SHOWN));
      timers.current.push(window.setTimeout(() => respond(null), CHOICE_WINDOW[1]));
    }, pause(1000, 1500)));
  };

  //an answer: true for the blue P button, false for anything else, null for none in time
  const respond = (saidTarget: boolean | null) => {
    const t = live.current;
    if (t.phase !== 'shown' || !t.stimulus || (saidTarget !== null && !t.shownAt)) return;
    clear();
    const time = since(t.shownAt);
    const practice = t.tries < PRACTICE;
    const guess = saidTarget !== null && time < CHOICE_WINDOW[0];
    const right = saidTarget === target(t.stimulus);
    setNote(saidTarget === null ? 'Too slow.' : guess ? "That was a guess, so it doesn't count." : right ? `${Math.round(time)} ms` : 'Wrong one.');
    t.tries += 1;
    const shown = `${t.stimulus.color} ${t.stimulus.letter}`;
    if (!practice) {
      const label = `${t.parts.length + 1}`;
      t.parts.push(
        saidTarget === null
          ? { label, right: false, note: `A ${shown}: no press in time` }
          : guess
            ? { label, note: `A ${shown}: pressed after ${Math.round(time)} ms, too soon to be a reaction, so it didn't count` }
            : right
              ? { label, right: true, note: `A ${shown}: ${Math.round(time)} ms` }
              : { label, right: false, note: `A ${shown}: you pressed ${saidTarget ? 'blue P' : 'anything else'}` },
      );
    }
    if (!practice && !guess) {
      t.counted += 1;
      if (right) t.right.push(time);
    }
    setProgress({ tries: t.tries, counted: t.counted });
    if (t.counted < CHOICE_TRIES) return next();
    to('done');
    if (t.right.length / t.counted < CHOICE_ACCURACY) setFailed(true);
    else {
      const ms = Math.round(mean(t.right));
      onDone(ms, {
        how: `Your score is your average time on the ones you got right, so lower is better: ${ms} ms. Wrong ones and misses aren't in the average, but if fewer than ${Math.round(CHOICE_ACCURACY * 100)}% are right the run doesn't count.`,
        parts: t.parts,
      });
    }
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') respond(true);
      else if (e.code === 'KeyJ') respond(false);
      else if (e.code === 'Space' && live.current.phase === 'ready') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const again = () => {
    live.current = { phase: 'ready', stimulus: null, shownAt: 0, tries: 0, counted: 0, right: [], parts: [] };
    setProgress({ tries: 0, counted: 0 });
    setFailed(false);
    setNote('');
    setPhase('ready');
  };

  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          A letter flashes up. If it's a <strong style={{ color: blue }}>blue P</strong>, press F or the left button. For
          anything else, press J or the right button. Be quick, but get it right: the time only counts the ones you get
          right. {PRACTICE} practice, then {CHOICE_TRIES} that count.
        </p>
      }
    >
      <div style={styles.arena} aria-label="The letter box">
        {phase === 'ready' && (
          <button type="button" className="comic-lift" style={styles.primary} onClick={() => countIn(next)}>
            Start
          </button>
        )}
        {phase === 'shown' && visible && stimulus && (
          <span style={{ ...styles.letter, color: stimulus.color === 'blue' ? blue : cinnamon }}>{stimulus.letter}</span>
        )}
        {phase === 'done' && <span style={styles.prompt}>{failed ? 'Too many wrong to count' : 'Done'}</span>}
      </div>
      {(phase === 'waiting' || phase === 'shown') && (
        <div style={styles.choices}>
          <button type="button" className="comic-lift" style={styles.choice} onPointerDown={() => respond(true)}>
            Blue P (F)
          </button>
          <button type="button" className="comic-lift" style={styles.choice} onPointerDown={() => respond(false)}>
            Anything else (J)
          </button>
        </div>
      )}
      {failed && (
        <button type="button" className="comic-lift" style={styles.primary} onClick={again}>
          Try again
        </button>
      )}
      <p style={styles.status} aria-live="polite">
        {phase === 'ready' || phase === 'done' ? '' : progress.tries < PRACTICE ? `Practice ${progress.tries + 1} of ${PRACTICE}` : `${progress.counted} of ${CHOICE_TRIES}`}
        {note && ` · ${note}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  ...testStyles,
  letter: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 700,
    fontSize: 96,
    lineHeight: 1,
  },
  choices: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
};
