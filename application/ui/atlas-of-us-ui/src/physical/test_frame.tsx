import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { clock, testStyles, useCountdown } from './test_kit';
import { blue, gunmetal, ivory } from '../shared_components/palette';

//the frame every test runs in: what to do, the test itself, and a way out
export function Frame({ intro, children, onCancel }: { intro: ReactNode; children: ReactNode; onCancel: () => void }) {
  return (
    <div style={testStyles.frame}>
      <div style={testStyles.intro}>{intro}</div>
      {children}
      <button type="button" className="comic-lift" style={testStyles.secondary} onClick={onCancel}>
        Stop
      </button>
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
}

interface ItemTestProps {
  intro: ReactNode;
  practice: Item[]; //tried first, with the answer shown after each
  items: Item[]; //the ones that count
  seconds: number; //the time allowed for the ones that count
  onDone: (right: number) => void;
  onCancel: () => void;
}

//a test of questions with a time limit: a few to practise on, told whether each was right, then the ones that count, one
//after another until they're done or the time's up. The score is how many were right, and any not reached are wrong
export function ItemTest({ intro, practice, items, seconds, onDone, onCancel }: ItemTestProps) {
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [told, setTold] = useState<{ right: boolean } | null>(null); //after a practice answer
  const [typed, setTyped] = useState('');
  const right = useRef(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    onDone(right.current);
  };
  const left = useCountdown(seconds, phase === 'timed', finish);

  const list = phase === 'practice' ? practice : items;
  const item = list[at];

  const answer = (said: number | string) => {
    const correct = item.word ? String(said).trim().toLowerCase() === item.word : said === item.answer;
    setTyped('');
    if (phase === 'practice') return setTold({ right: correct });
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
  return (
    <Frame onCancel={onCancel} intro={intro}>
      {!asking && (
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
                aria-label="Your answer"
                style={testStyles.input}
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
  choice: {
    ...testStyles.choice,
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
