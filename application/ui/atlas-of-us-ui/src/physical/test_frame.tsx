import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { type Part, type Scored } from './scored';
import { clock, testStyles, useCountdown, useCountIn } from './test_kit';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//the frame every test runs in: the test where the scene's animation was, and what to do, with a way out, in the column
//beside it where the scene's card was. On a narrow screen what to do goes on top. While a test counts down to
//beginning, the count is shown big over the test
export function Frame({ intro, children, onCancel, count = null }: { intro: ReactNode; children: ReactNode; onCancel: () => void; count?: number | null }) {
  return (
    <div style={frameStyles.side}>
      <div style={frameStyles.aside}>
        <div style={{ ...testStyles.intro, ...frameStyles.intro }}>{intro}</div>
        <button type="button" className="comic-lift" style={{ ...testStyles.secondary, alignSelf: 'flex-start' }} onClick={onCancel}>
          Stop
        </button>
      </div>
      <div style={{ ...testStyles.frame, ...frameStyles.play }}>
        {children}
        {count !== null && (
          <div style={frameStyles.count} aria-live="assertive">
            <span key={count} style={frameStyles.number} className="comic-pop">
              {count}
            </span>
            <span style={frameStyles.ready}>Get ready</span>
          </div>
        )}
      </div>
    </div>
  );
}

//one question of a test of items: what's asked, and either the choices with the place of the right one, or, with no
//choices, the number to type, or the word to type when it has one
export interface Item {
  prompt: ReactNode;
  choices?: ReactNode[];
  answer: number;
  word?: string;
  columns?: number; //how many choices to a row, at most
  font?: string; //the font the answer is typed in, when it's not the page's
}

interface ItemTestProps {
  intro: ReactNode;
  practice: Item[]; //tried first, with the answer shown after each
  items: Item[]; //the ones that count
  seconds: number; //the time allowed for the ones that count
  onDone: (right: number, scored: Scored) => void;
  onCancel: () => void;
}

//a choice by its place, as the user sees them: A, B, C...
const letter = (i: number) => String.fromCharCode(65 + i);

//a test of questions with a time limit: a few to practice on, told whether each was right, then the ones that count, one
//after another until they're done or the time's up. The score is how many were right, and any not reached are wrong
export function ItemTest({ intro, practice, items, seconds, onDone, onCancel }: ItemTestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [told, setTold] = useState<{ right: boolean } | null>(null); //after a practice answer
  const [typed, setTyped] = useState('');
  const right = useRef(0);
  const given = useRef<(number | string)[]>([]); //each answer to the ones that count, in order
  const finished = useRef(false);
  const box = useRef<HTMLInputElement>(null);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    const parts = items.map((it, i): Part => {
      const label = `${i + 1}`;
      if (i >= given.current.length) return { label, right: false, note: 'Not reached in time' };
      const said = given.current[i];
      const correct = it.word ? String(said).trim().toLowerCase() === it.word : said === it.answer;
      const shown = (v: number | string) => {
        const c = it.choices?.[Number(v)];
        return !it.choices ? String(v) : typeof c === 'string' ? `"${c}"` : letter(Number(v));
      };
      const answer = it.word ?? it.answer;
      return { label, right: correct, note: correct ? `You said ${shown(said)}` : `You said ${shown(said)}, it was ${shown(answer)}` };
    });
    onDone(right.current, {
      how: `One point for each one right: ${right.current} of ${items.length}. Any not reached before the time ran out count as wrong.${items[0]?.choices && typeof items[0].choices[0] !== 'string' ? ' The letters are the ones in the corners of the choices.' : ''}`,
      parts,
    });
  };
  const left = useCountdown(seconds, phase === 'timed', finish);

  const list = phase === 'practice' ? practice : items;
  const item = list[at];

  const answer = (said: number | string) => {
    const correct = item.word ? String(said).trim().toLowerCase() === item.word : said === item.answer;
    setTyped('');
    if (phase === 'practice') return setTold({ right: correct });
    given.current.push(said);
    if (correct) right.current += 1;
    if (at + 1 < items.length) setAt(at + 1);
    else finish();
  };
  const onward = () => {
    setTold(null);
    if (at + 1 < practice.length) setAt(at + 1);
    else {
      setAt(0);
      setPhase('between');
    }
  };

  const asking = (phase === 'practice' || phase === 'timed') && item;
  //the box to type in is ready for the next answer whenever a question comes up
  useEffect(() => {
    if (asking && !told) box.current?.focus();
  }, [asking, told, at]);
  return (
    <Frame count={counting} onCancel={onCancel} intro={intro}>
      {!asking && (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button
              type="button"
              className="comic-lift"
              style={testStyles.primary}
              onClick={() =>
                countIn(() => {
                  setAt(0);
                  setPhase(phase === 'ready' ? 'practice' : 'timed');
                })
              }
            >
              {phase === 'ready' ? 'Start the practice' : `Start: ${items.length} in ${clock(seconds)}`}
            </button>
          )}
        </div>
      )}
      {asking && (
        <>
          <div style={styles.prompt}>{item.prompt}</div>
          {item.choices ? (
            <div style={{ ...styles.choices, gridTemplateColumns: `repeat(auto-fit, minmax(${item.columns && item.columns > 3 ? 90 : 120}px, 1fr))` }}>
              {item.choices.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="comic-lift"
                  disabled={!!told}
                  aria-label={`Choice ${i + 1}`}
                  style={{ ...styles.choice, ...(told && i === item.answer ? { border: `3px solid ${blue}`, background: ivory, boxShadow: `0 0 0 3px ${blue}` } : {}) }}
                  onClick={() => answer(i)}
                >
                  {typeof c !== 'string' && <span style={styles.letter}>{letter(i)}</span>}
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <form
              style={styles.typed}
              onSubmit={(e) => {
                e.preventDefault();
                if (typed.trim() !== '' && !told) answer(item.word ? typed : Number(typed.trim()));
              }}
            >
              <input
                ref={box}
                aria-label="Your answer"
                style={item.font ? { ...testStyles.input, fontFamily: item.font, fontSize: 28 } : testStyles.input}
                inputMode={item.word ? 'text' : 'numeric'}
                autoComplete="off"
                autoFocus
                value={typed}
                disabled={!!told}
                onChange={(e) => setTyped(item.word ? e.target.value : e.target.value.replace(/[^\d-]/g, ''))}
              />
              <button type="submit" className="comic-lift" style={testStyles.primary} disabled={!!told}>
                That's it
              </button>
            </form>
          )}
          {told && (
            <div style={styles.told}>
              <span>
                {told.right ? 'Right.' : item.choices ? 'Not quite. The right one is outlined.' : `Not quite. It was ${item.word ?? item.answer}.`}
              </span>
              <button type="button" className="comic-lift" style={testStyles.primary} onClick={onward}>
                Next
              </button>
            </div>
          )}
        </>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${practice.length}`}
        {phase === 'between' && `Practice done. Now ${items.length} that count, with ${clock(seconds)} on the clock.`}
        {phase === 'timed' && `${at + 1} of ${items.length} · ${clock(left)} left`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  prompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    overflowX: 'auto',
  },
  choices: {
    display: 'grid',
    gap: 10,
  },
  //a picture choice's letter, in its corner, for telling them apart afterwards
  letter: {
    position: 'absolute',
    top: 4,
    left: 7,
    fontSize: 13,
    fontWeight: 700,
    color: gunmetal,
    opacity: 0.7,
  },
  choice: {
    ...testStyles.choice,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minHeight: 56,
  },
  typed: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  told: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    fontSize: 15,
  },
};

const frameStyles: Record<string, CSSProperties> = {
  //the test and what to do, side by side when there's room, what to do on the right in a column as wide as the scene's
  //card. It comes first, so when they wrap it goes on top
  side: {
    display: 'flex',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 16,
  },
  play: {
    flex: '999 1 440px',
    minWidth: 0,
    position: 'relative',
  },
  aside: {
    flex: '1 1 clamp(300px, 32vw, 460px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  intro: {
    padding: '12px 14px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  //the count, over the test
  count: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    background: 'rgba(255, 253, 240, 0.88)',
    borderRadius: 12,
  },
  number: {
    fontFamily: comic,
    fontSize: 'clamp(80px, 14vw, 160px)',
    lineHeight: 1,
    color: brownRed,
  },
  ready: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
    color: gunmetal,
  },
};
