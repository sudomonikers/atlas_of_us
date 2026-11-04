import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ARROWS, ARROWS_PRACTICE, BROKEN_WORDS, CARDS, CARDS_PRACTICE, GRID, HIDDEN_ITEMS, HIDDEN_PRACTICE, KEY_CARDS,
  RUN_TO_CHANGE, SORT_RULES, SYMBOLS, SYMBOL_KEY, SYMBOL_PRACTICE, SYMBOL_RUN, TIMED, WORDS_PRACTICE, WORD_COLUMNS,
  WORD_ROWS, ends, type Arrows, type BrokenWord, type Card, type HiddenShape, type Stroke,
} from './puzzles';
import type { TestProps } from './self_tests';
import { Frame, ItemTest, type Item } from './test_frame';
import { blue, brownRed, chance, clock, comic, gunmetal, ivory, now, since, testStyles, useCountdown } from './test_kit';

type Phase = 'ready' | 'practice' | 'between' | 'timed' | 'done';

//the button that starts the practice or the part that counts, or says it's done
function Starter({ phase, label, onStart }: { phase: Phase; label: string; onStart: () => void }) {
  return (
    <div style={testStyles.arena}>
      {phase === 'done' ? (
        <span style={testStyles.prompt}>Done</span>
      ) : (
        <button type="button" className="comic-lift" style={testStyles.primary} onClick={onStart}>
          {phase === 'ready' ? 'Start the practice' : label}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Symbol matching
// ---------------------------------------------------------------------------------------------------------------------

function Symbol({ index, size }: { index: number; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d={SYMBOLS[index]} fill="none" stroke={gunmetal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

//perceptual speed: press the digit that goes with each symbol, using the key, as many as you can in 90 seconds
export function SymbolMatching({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [note, setNote] = useState('');
  const right = useRef(0);
  const finished = useRef(false);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    onDone(right.current);
  };
  const left = useCountdown(TIMED.symbols.seconds, phase === 'timed', finish);
  const run = phase === 'practice' ? SYMBOL_PRACTICE : SYMBOL_RUN;

  const press = (digit: number) => {
    if (phase !== 'practice' && phase !== 'timed') return;
    const correct = SYMBOL_KEY[run[at]] === digit;
    if (phase === 'practice') {
      setNote(correct ? 'Right.' : `That one is ${SYMBOL_KEY[run[at]]}.`);
      if (at + 1 < run.length) setAt(at + 1);
      else {
        setAt(0);
        setPhase('between');
      }
      return;
    }
    if (correct) right.current += 1;
    if (at + 1 < run.length) setAt(at + 1);
    else finish();
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const digit = Number(e.key);
      if (digit >= 1 && digit <= 9) {
        e.preventDefault();
        press(digit);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Each symbol goes with a digit, shown in the key. When a symbol appears, press its digit on the keyboard or tap it.
          A few to practise, then as many as you can in {clock(TIMED.symbols.seconds)}.
        </p>
      }
    >
      <div style={styles.key} aria-label="The key">
        {SYMBOL_KEY.map((digit, i) => (
          <div key={i} style={styles.keyCell}>
            <Symbol index={i} size={26} />
            <span style={styles.keyDigit}>{digit}</span>
          </div>
        ))}
      </div>
      {asking ? (
        <>
          <div style={{ ...testStyles.arena, cursor: 'default' }}>
            <Symbol index={run[at]} size={90} />
          </div>
          <div style={styles.digits}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} type="button" className="comic-lift" style={styles.digit} onPointerDown={() => press(d)}>
                {d}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Starter phase={phase} label={`Start: ${clock(TIMED.symbols.seconds)}`} onStart={() => setPhase(phase === 'ready' ? 'practice' : 'timed')} />
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice · ${note}`}
        {phase === 'between' && 'Practice done.'}
        {phase === 'timed' && `${clock(left)} left`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Distracting arrows
// ---------------------------------------------------------------------------------------------------------------------

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
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(false);
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState(false);
  //kept in a ref as well as state, since a timer can answer for the person (too slow) as well as a press
  const live = useRef({ phase: 'ready' as Phase, at: 0, shownAt: 0, answered: true });
  const times = useRef({ same: [] as number[], other: [] as number[], wrong: 0 });
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
    times.current = { same: [], other: [], wrong: 0 };
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
    else if (correct) (a.same ? times.current.same : times.current.other).push(time);
    else times.current.wrong += 1;
    if (i + 1 < list.length) return show(i + 1);
    setShown(false);
    if (phase === 'practice') return to('between');
    to('done');
    const { same, other, wrong } = times.current;
    if ((list.length - wrong) / list.length < ARROW_ACCURACY || !same.length || !other.length) return setFailed(true);
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    onDone(Math.round(mean(other) - mean(same)));
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
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          A row of five arrows appears. Say which way the <strong>middle</strong> one points: F or the left arrow key for
          left, J or the right arrow key for right, or tap the buttons. The others sometimes point the other way, to
          distract you. Be quick and right. A few to practise, then {ARROWS.length}.
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
        <Starter phase={phase} label={`Start: ${ARROWS.length} rows`} onStart={() => begin(phase === 'ready' ? 'practice' : 'timed')} />
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${list.length}${note ? ` · ${note}` : ''}`}
        {phase === 'between' && 'Practice done.'}
        {phase === 'timed' && `${at + 1} of ${list.length}`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Card sorting
// ---------------------------------------------------------------------------------------------------------------------

const CARD_COLOURS = [brownRed, '#3c8a4e', '#d9a520', blue];
const CARD_COLOUR_NAMES = ['red', 'green', 'yellow', 'blue'];
const CARD_SHAPE_NAMES = ['triangle', 'star', 'cross', 'circle'];

function cardShape(shape: number, x: number, y: number, fill: string, key: number) {
  const line = { fill, stroke: gunmetal, strokeWidth: 1.2 };
  if (shape === 0) return <polygon key={key} points={`${x},${y - 8} ${x + 8},${y + 6} ${x - 8},${y + 6}`} {...line} />;
  if (shape === 1) {
    const points = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 3.6 : 8.5;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
    });
    return <polygon key={key} points={points.join(' ')} {...line} />;
  }
  if (shape === 2) return <path key={key} d={`M${x - 2.5} ${y - 8}h5v5.5h5.5v5h-5.5v5.5h-5v-5.5h-5.5v-5h5.5z`} {...line} />;
  return <circle key={key} cx={x} cy={y} r={7.5} {...line} />;
}

//a card: one to four of a shape in a colour
function CardView({ card }: { card: Card }) {
  const spots: [number, number][][] = [[[25, 35]], [[25, 22], [25, 48]], [[25, 14], [25, 35], [25, 56]], [[14, 22], [36, 22], [14, 48], [36, 48]]];
  return (
    <svg width={56} height={78} viewBox="0 0 50 70" role="img" aria-label={`${card.number} ${CARD_COLOUR_NAMES[card.colour]} ${CARD_SHAPE_NAMES[card.shape]}`}>
      <rect x={1} y={1} width={48} height={68} rx={5} fill="#fff" stroke={gunmetal} strokeWidth={1.5} />
      {spots[card.number - 1].map(([x, y], i) => cardShape(card.shape, x, y, CARD_COLOURS[card.colour], i))}
    </svg>
  );
}

//category flexibility: sort each card onto one of four by a hidden rule, colour, shape or number, worked out from being
//told right or wrong. The rule changes without warning after a run of right answers. The score is how many were right
export function CardSorting({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [note, setNote] = useState<{ right: boolean } | null>(null);
  const state = useRef({ rule: 0, run: 0, right: 0 });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = phase === 'practice' ? CARDS_PRACTICE : CARDS;
  const card = list[at];

  const sort = (onto: number) => {
    if (note || (phase !== 'practice' && phase !== 'timed')) return;
    const s = state.current;
    const rule = SORT_RULES[s.rule % SORT_RULES.length];
    const correct = card[rule] === KEY_CARDS[onto][rule];
    setNote({ right: correct });
    if (phase === 'timed') {
      if (correct) {
        s.right += 1;
        s.run += 1;
        if (s.run >= RUN_TO_CHANGE) {
          s.rule += 1;
          s.run = 0;
        }
      } else s.run = 0;
    }
    timer.current = window.setTimeout(() => {
      setNote(null);
      if (at + 1 < list.length) return setAt(at + 1);
      setAt(0);
      if (phase === 'practice') return setPhase('between');
      setPhase('done');
      onDone(state.current.right);
    }, 700);
  };

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Sort each card onto one of the four at the top by tapping it. There's a rule, by colour, shape or number, but you
          aren't told it: you're only told whether each sort was right. Work it out, and watch out, because it changes
          without warning. In the practice the rule is colour. Then {CARDS.length} cards.
        </p>
      }
    >
      {asking ? (
        <>
          <div style={styles.keyCards}>
            {KEY_CARDS.map((k, i) => (
              <button key={i} type="button" className="comic-lift" style={styles.keyCard} onClick={() => sort(i)} aria-label={`Sort onto card ${i + 1}`}>
                <CardView card={k} />
              </button>
            ))}
          </div>
          <div style={{ ...testStyles.arena, minHeight: 130, cursor: 'default', gap: 16 }}>
            <CardView card={card} />
            {note && <span style={{ ...styles.verdict, color: note.right ? blue : brownRed }}>{note.right ? 'Right' : 'Wrong'}</span>}
          </div>
        </>
      ) : (
        <Starter phase={phase} label={`Start: ${CARDS.length} cards`} onStart={() => {
          state.current = { rule: 0, run: 0, right: 0 };
          setAt(0);
          setPhase(phase === 'ready' ? 'practice' : 'timed');
        }} />
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${list.length}`}
        {phase === 'between' && 'Practice done. From here, work the rule out yourself.'}
        {phase === 'timed' && `Card ${at + 1} of ${list.length}`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Broken words
// ---------------------------------------------------------------------------------------------------------------------

function Broken({ item }: { item: BrokenWord }) {
  const w = 300 / WORD_COLUMNS;
  const h = 90 / WORD_ROWS;
  return (
    <svg viewBox="0 0 300 90" style={styles.word} role="img" aria-label="A word with much of it hidden">
      <rect width={300} height={90} fill={ivory} />
      <text x={150} y={66} textAnchor="middle" fontSize={64} fontFamily="Georgia, 'Times New Roman', serif" fontWeight={700} fill={gunmetal}>
        {item.word.toUpperCase()}
      </text>
      {item.hidden.map((c) => (
        <rect key={c} x={(c % WORD_COLUMNS) * w - 0.2} y={Math.floor(c / WORD_COLUMNS) * h - 0.2} width={w + 0.4} height={h + 0.4} fill={ivory} />
      ))}
    </svg>
  );
}

const wordItem = (b: BrokenWord): Item => ({ prompt: <Broken item={b} />, answer: 0, word: b.word });

//speed of closure: read a word with much of it hidden
export function BrokenWords({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each word has parts of it hidden, more as you go. Type the word. They're all everyday English words. Two to
          practise, then {TIMED.words.count} in {clock(TIMED.words.seconds)}.
        </p>
      }
      practice={WORDS_PRACTICE.map(wordItem)}
      items={BROKEN_WORDS.map(wordItem)}
      seconds={TIMED.words.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Hidden shapes
// ---------------------------------------------------------------------------------------------------------------------

function Strokes({ strokes, size, grid = false }: { strokes: Stroke[]; size: number; grid?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={`-0.5 -0.5 ${GRID} ${GRID}`} aria-hidden="true">
      {grid && Array.from({ length: GRID * GRID }, (_, i) => <circle key={i} cx={i % GRID} cy={Math.floor(i / GRID)} r={0.05} fill="#bbb" />)}
      {strokes.map((s) => {
        const [[x1, y1], [x2, y2]] = ends(s);
        return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} stroke={gunmetal} strokeWidth={0.12} strokeLinecap="round" />;
      })}
    </svg>
  );
}

const hiddenItem = (h: HiddenShape): Item => ({
  prompt: (
    <>
      <Strokes strokes={h.shape} size={110} grid />
      <span style={styles.small}>Which drawing has this shape in it, the same size and the same way up?</span>
    </>
  ),
  choices: h.choices.map((c, i) => <Strokes key={i} strokes={c} size={110} />),
  answer: h.answer,
  columns: 4,
});

//flexibility of closure: find which drawing has a simple shape hidden in it
export function HiddenShapes({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a simple shape. One of the four drawings below has exactly that shape in it, the same size
          and the same way up, among other lines. Pick it. Two to practise, then {TIMED.hidden.count} in{' '}
          {clock(TIMED.hidden.seconds)}.
        </p>
      }
      practice={HIDDEN_PRACTICE.map(hiddenItem)}
      items={HIDDEN_ITEMS.map(hiddenItem)}
      seconds={TIMED.hidden.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  key: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: 2,
    padding: 4,
    background: gunmetal,
    borderRadius: 8,
  },
  keyCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '4px 0',
    background: '#fff',
  },
  keyDigit: {
    fontFamily: comic,
    fontSize: 18,
  },
  digits: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: 4,
  },
  digit: {
    ...testStyles.choice,
    padding: '12px 0',
    fontFamily: comic,
    fontSize: 20,
  },
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
  keyCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  keyCard: {
    display: 'flex',
    justifyContent: 'center',
    padding: 4,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    cursor: 'pointer',
  },
  verdict: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
  },
  word: {
    width: '100%',
    maxWidth: 420,
  },
  small: {
    fontSize: 14,
    textAlign: 'center',
  },
};
