import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Reading, Test } from './api';
import { Frame } from './test_frame';
import { blue, brownRed, cinnamon, comic, gunmetal, ivory, now, seeded, since, testStyles } from './test_kit';
import { Matrices, PaperFolding, PerspectiveTaking, Rotation, Series, Syllogisms } from './reasoning_tests';
import { BrokenWords, CardSorting, DistractingArrows, HiddenShapes, SymbolMatching } from './attention_tests';
import { Tapping, TrackAndCount, Tracking, Timing, TwoHandSteering } from './motor_tests';
import { FarChart, NearChart, OddColourOut, SideVision } from './vision_tests';
import { AnimalNaming, BrickUses } from './idea_tests';

//how many tries are practice, and how many count
const PRACTICE = 5;
const SIMPLE_TRIES = 30;
const CHOICE_TRIES = 40;
//the fastest press that's a reaction rather than a guess, and the slowest that still counts, in ms. As in the studies
//the norms come from
const SIMPLE_WINDOW = [110, 1000];
const CHOICE_WINDOW = [150, 1250];
//how long a choice reaction's letter stays up, in ms
const CHOICE_SHOWN = 200;
//the share of choice reactions that have to be right for the time to count
const CHOICE_ACCURACY = 0.7;
//how many lists of digits, the length the first one starts at, the longest, and how long each digit shows, in ms
const LISTS = 10;
const FIRST_SPAN = 5;
const LONGEST_SPAN = 14;
const DIGIT_SHOWN = 700;
const DIGIT_GAP = 300;

const pause = (from: number, to: number) => from + Math.random() * (to - from);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export interface TestProps {
  measurement: string; //the measurement's id, for a test scored by the api
  onDone: (value: number) => void; //the score, in the measurement's unit, for the card to record
  onSaved: (reading: Reading) => void; //a reading the api scored and recorded itself
  onCancel: () => void;
}

//one of the tests the app runs, by the measurement's test
export function SelfTest({ test, ...props }: TestProps & { test: Test }) {
  if (test === 'simple_reaction') return <SimpleReaction {...props} />;
  if (test === 'choice_reaction') return <ChoiceReaction {...props} />;
  if (test === 'digit_span') return <DigitSpan {...props} />;
  if (test === 'trail_making') return <TrailMaking {...props} />;
  if (test === 'eye_chart') return <FarChart {...props} />;
  if (test === 'matrices') return <Matrices {...props} />;
  if (test === 'series') return <Series {...props} />;
  if (test === 'rotation') return <Rotation {...props} />;
  if (test === 'paper_folding') return <PaperFolding {...props} />;
  if (test === 'perspective') return <PerspectiveTaking {...props} />;
  if (test === 'syllogisms') return <Syllogisms {...props} />;
  if (test === 'symbols') return <SymbolMatching {...props} />;
  if (test === 'flanker') return <DistractingArrows {...props} />;
  if (test === 'cards') return <CardSorting {...props} />;
  if (test === 'broken_words') return <BrokenWords {...props} />;
  if (test === 'hidden_shapes') return <HiddenShapes {...props} />;
  if (test === 'tapping') return <Tapping {...props} />;
  if (test === 'tracking') return <Tracking {...props} />;
  if (test === 'timing') return <Timing {...props} />;
  if (test === 'steering') return <TwoHandSteering {...props} />;
  if (test === 'track_count') return <TrackAndCount {...props} />;
  if (test === 'near_chart') return <NearChart {...props} />;
  if (test === 'colours') return <OddColourOut {...props} />;
  if (test === 'side_vision') return <SideVision {...props} />;
  if (test === 'animals') return <AnimalNaming {...props} />;
  if (test === 'uses') return <BrickUses {...props} />;
  return null;
}

//the time a target was painted, for timing a reaction from when it could first be seen
function painted(set: (t: number) => void) {
  requestAnimationFrame(() => requestAnimationFrame(() => set(performance.now())));
}

type Phase = 'ready' | 'waiting' | 'shown' | 'done';

//press as soon as a target appears, after a random wait. Pressing during the wait starts that try again
function SimpleReaction({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [note, setNote] = useState('');
  const [count, setCount] = useState(0); //tries done, practice included
  const [counted, setCounted] = useState(0);
  const times = useRef<number[]>([]);
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
    if (phase === 'ready') return next();
    if (phase === 'waiting') {
      clearTimeout(timer.current);
      setNote('Too soon. Wait for the target.');
      return next();
    }
    if (phase !== 'shown' || !shownAt.current) return;
    const time = since(shownAt.current);
    const done = count + 1;
    setCount(done);
    if (time < SIMPLE_WINDOW[0]) setNote('That was a guess, so it doesn\'t count.');
    else if (time > SIMPLE_WINDOW[1]) setNote('Too slow to count. Stay ready.');
    else {
      setNote(`${Math.round(time)} ms`);
      if (done > PRACTICE) times.current.push(time);
      setCounted(times.current.length);
    }
    if (times.current.length >= SIMPLE_TRIES) {
      setPhase('done');
      onDone(Math.round(mean(times.current)));
    } else next();
  }, [phase, count, next, onDone]);

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
    <Frame
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

//a blue P, or a decoy: an orange F, a blue F or an orange P
interface Stimulus {
  letter: 'P' | 'F';
  colour: 'blue' | 'orange';
}

const target = (s: Stimulus) => s.letter === 'P' && s.colour === 'blue';

//the next stimulus: a blue P four times in ten, each decoy twice in ten
function draw(): Stimulus {
  const r = Math.random();
  if (r < 0.4) return { letter: 'P', colour: 'blue' };
  if (r < 0.6) return { letter: 'F', colour: 'orange' };
  if (r < 0.8) return { letter: 'F', colour: 'blue' };
  return { letter: 'P', colour: 'orange' };
}

//press one button for a blue P and the other for anything else, as fast as you can while getting it right. The tries
//are kept in refs, since a timer can answer for the person (a miss) as well as a press
function ChoiceReaction({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [stimulus, setStimulus] = useState<Stimulus>();
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState({ tries: 0, counted: 0 });
  const [failed, setFailed] = useState(false);
  const live = useRef({ phase: 'ready' as Phase, stimulus: null as Stimulus | null, shownAt: 0, tries: 0, counted: 0, right: [] as number[] });
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
    if (!practice && !guess) {
      t.counted += 1;
      if (right) t.right.push(time);
    }
    setProgress({ tries: t.tries, counted: t.counted });
    if (t.counted < CHOICE_TRIES) return next();
    to('done');
    if (t.right.length / t.counted < CHOICE_ACCURACY) setFailed(true);
    else onDone(Math.round(mean(t.right)));
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
    live.current = { phase: 'ready', stimulus: null, shownAt: 0, tries: 0, counted: 0, right: [] };
    setProgress({ tries: 0, counted: 0 });
    setFailed(false);
    setNote('');
    setPhase('ready');
  };

  return (
    <Frame
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
          <button type="button" className="comic-lift" style={styles.primary} onClick={next}>
            Start
          </button>
        )}
        {phase === 'shown' && visible && stimulus && (
          <span style={{ ...styles.letter, color: stimulus.colour === 'blue' ? blue : cinnamon }}>{stimulus.letter}</span>
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

//a list of digits, none repeated until all nine are used, and never the same one twice running
function digits(length: number): string {
  const out: number[] = [];
  let pool: number[] = [];
  while (out.length < length) {
    if (!pool.length) pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const d = pool.pop()!;
    if (d === out[out.length - 1]) pool.unshift(d);
    else out.push(d);
  }
  return out.join('');
}

//remember a list of digits shown one at a time, and type them back. Getting one right makes the next list a digit
//longer, and it takes two misses in a row to make it a digit shorter. The score is the longest list got right
function DigitSpan({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'showing' | 'answering' | 'done'>('ready');
  const [list, setList] = useState('');
  const [shown, setShown] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(0); //lists done
  const length = useRef(FIRST_SPAN);
  const misses = useRef(0);
  const longest = useRef(0);
  const timers = useRef<number[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (phase === 'answering') input.current?.focus();
  }, [phase]);

  const show = () => {
    const next = digits(length.current);
    setList(next);
    setTyped('');
    setPhase('showing');
    [...next].forEach((d, i) => {
      const at = 600 + i * (DIGIT_SHOWN + DIGIT_GAP);
      timers.current.push(window.setTimeout(() => setShown(d), at));
      timers.current.push(window.setTimeout(() => setShown(null), at + DIGIT_SHOWN));
    });
    timers.current.push(window.setTimeout(() => setPhase('answering'), 600 + next.length * (DIGIT_SHOWN + DIGIT_GAP)));
  };

  const answer = () => {
    const right = typed.replace(/\D/g, '') === list;
    if (right) {
      longest.current = Math.max(longest.current, list.length);
      length.current = Math.min(length.current + 1, LONGEST_SPAN);
      misses.current = 0;
      setNote(`Right: ${list.length} digits.`);
    } else {
      misses.current += 1;
      if (misses.current >= 2) {
        length.current = Math.max(length.current - 1, 2);
        misses.current = 0;
      }
      setNote(`Not quite. It was ${list}.`);
    }
    const lists = done + 1;
    setDone(lists);
    if (lists >= LISTS) {
      setPhase('done');
      //no list right still records the shortest that can be recorded
      onDone(Math.max(longest.current, 1));
    } else show();
  };

  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          Digits appear one at a time. When they stop, type them back in the same order. There are {LISTS} lists, and
          each one you get right makes the next one longer. No writing them down.
        </p>
      }
    >
      <div style={styles.arena} aria-live="off">
        {phase === 'ready' && (
          <button type="button" className="comic-lift" style={styles.primary} onClick={show}>
            Start
          </button>
        )}
        {phase === 'showing' && <span style={styles.digit}>{shown ?? ''}</span>}
        {phase === 'answering' && (
          <form
            style={styles.answer}
            onSubmit={(e) => {
              e.preventDefault();
              answer();
            }}
          >
            <label style={styles.text} htmlFor="digit-span-answer">
              What were they?
            </label>
            <input
              id="digit-span-answer"
              ref={input}
              style={styles.input}
              inputMode="numeric"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            <button type="submit" className="comic-lift" style={styles.primary}>
              That's it
            </button>
          </form>
        )}
        {phase === 'done' && <span style={styles.prompt}>Done</span>}
      </div>
      <p style={styles.status} aria-live="polite">
        {phase === 'ready' ? '' : `List ${Math.min(done + 1, LISTS)} of ${LISTS}`}
        {note && ` · ${note}`}
      </p>
    </Frame>
  );
}

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

//the trails: a short one to practise on, and the one that's timed, the same for everyone
const PRACTICE_TRAIL = trail(8, 7);
const TIMED_TRAIL = trail(25, 2026);

//tap the circles in order, switching between numbers and letters: 1, A, 2, B and on to 13. A wrong tap doesn't
//count, and the clock keeps running, as when the examiner points out a slip on paper. Timed from the first circle
function TrailMaking({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [next, setNext] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const startedAt = useRef(0);
  const timer = useRef(0);
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
      return;
    }
    if (i === 0 && phase === 'timed') startedAt.current = now();
    setNote('');
    if (i < spots.length - 1) return setNext(i + 1);
    setNext(spots.length);
    if (phase === 'practice') return setPhase('between');
    setPhase('done');
    onDone(Math.round(since(startedAt.current) / 100) / 10);
  };

  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          Tap the circles in order, switching between numbers and letters: 1, then A, then 2, then B, and on to 13. Go as
          fast as you can without slipping. A short practice first, then 25 circles against the clock, which starts when
          you tap 1.
        </p>
      }
    >
      {phase === 'ready' || phase === 'between' || phase === 'done' ? (
        <div style={styles.arena}>
          {phase === 'done' ? (
            <span style={styles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={styles.primary} onClick={() => begin(phase === 'ready' ? 'practice' : 'timed')}>
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
  target: {
    width: 90,
    height: 90,
    background: brownRed,
    border: `4px solid ${gunmetal}`,
    borderRadius: '50%',
  },
  letter: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 700,
    fontSize: 96,
    lineHeight: 1,
  },
  digit: {
    fontFamily: comic,
    fontSize: 88,
    lineHeight: 1,
    minHeight: 88,
  },
  answer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  choices: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  board: {
    position: 'relative',
    width: '100%',
    maxWidth: 520,
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
