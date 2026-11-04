import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { scoreAnswers, today, type Reading } from './api';
import { TIMED } from './puzzles';
import type { TestProps } from './self_tests';
import { Frame } from './test_frame';
import { clock, gunmetal, ivory, testStyles, useCountdown } from './test_kit';
import { AtlasError } from '../shared_components/atlas-error';

interface IdeaTestProps extends TestProps {
  intro: ReactNode;
  seconds: number;
  placeholder: string;
  counted: string; //what the answers that counted are called, such as "Animals counted"
}

//type as many answers as you can before the time's up, each one sent with Enter. The api scores them and records the
//reading, and the answers that counted are shown until the person is done with them
function IdeaTest({ intro, seconds, placeholder, counted, measurement, onSaved, onCancel }: IdeaTestProps) {
  const [phase, setPhase] = useState<'ready' | 'typing' | 'scoring' | 'done'>('ready');
  const [typed, setTyped] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [kept, setKept] = useState<string[]>([]);
  const [saved, setSaved] = useState<Reading>();
  const [error, setError] = useState<string>();
  const all = useRef<string[]>([]);
  const pending = useRef('');

  const score = () => {
    setPhase('scoring');
    setError(undefined);
    scoreAnswers(measurement, all.current, today()).then(
      ({ reading, counted }) => {
        setKept(counted);
        setSaved(reading);
        setPhase('done');
      },
      (e) => {
        setError(e instanceof Error ? e.message : String(e));
        setPhase('done');
      },
    );
  };
  const over = () => {
    if (pending.current.trim()) all.current = [...all.current, pending.current.trim()];
    score();
  };
  const left = useCountdown(seconds, phase === 'typing', over);

  const add = () => {
    const answer = typed.trim();
    if (!answer) return;
    all.current = [...all.current, answer];
    setAnswers(all.current);
    setTyped('');
    pending.current = '';
  };

  return (
    <Frame onCancel={onCancel} intro={intro}>
      {phase === 'ready' && (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => {
            all.current = [];
            setAnswers([]);
            setPhase('typing');
          }}>
            Start: {clock(seconds)}
          </button>
        </div>
      )}
      {phase === 'typing' && (
        <>
          <form
            style={styles.row}
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <input
              aria-label="Your answer"
              style={styles.input}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              placeholder={placeholder}
              value={typed}
              maxLength={80}
              onChange={(e) => {
                setTyped(e.target.value);
                pending.current = e.target.value;
              }}
            />
            <button type="submit" className="comic-lift" style={testStyles.primary}>
              Add
            </button>
          </form>
          <ol style={styles.list}>
            {answers.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </>
      )}
      {phase === 'scoring' && (
        <div style={testStyles.arena}>
          <span style={testStyles.prompt}>Scoring your answers...</span>
        </div>
      )}
      {phase === 'done' &&
        (error ? (
          <>
            <AtlasError message={error} />
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={score}>
              Try scoring them again
            </button>
          </>
        ) : (
          <>
            <div style={styles.counted}>
              <strong>{counted} ({kept.length}):</strong> {kept.length ? kept.join(', ') : 'none'}
            </div>
            {saved && (
              <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => onSaved(saved)}>
                Done
              </button>
            )}
          </>
        ))}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'typing' && `${answers.length} so far · ${clock(left)} left`}
      </p>
    </Frame>
  );
}

//fluency of ideas: type as many different animals as you can in a minute
export function AnimalNaming(props: TestProps) {
  return (
    <IdeaTest
      {...props}
      seconds={TIMED.animals.seconds}
      placeholder="An animal, then Enter"
      counted="Animals counted"
      intro={
        <p style={testStyles.text}>
          Type as many different animals as you can think of in {clock(TIMED.animals.seconds)}, pressing Enter after each
          one. Any kind counts: wild, farm, pets, birds, fish, insects. Spelling doesn't matter, but repeats don't count.
        </p>
      }
    />
  );
}

//originality: list uses for a brick, scored on how unusual the most unusual ones are
export function BrickUses(props: TestProps) {
  return (
    <IdeaTest
      {...props}
      seconds={TIMED.uses.seconds}
      placeholder="A use for a brick, then Enter"
      counted="Uses kept"
      intro={
        <p style={testStyles.text}>
          List as many different uses for an ordinary brick as you can in {clock(TIMED.uses.seconds)}, pressing Enter after
          each. Go for unusual, clever ideas, not just the obvious ones: you're scored on how unusual your three best are.
          A few words each is enough.
        </p>
      }
    />
  );
}

const styles: Record<string, CSSProperties> = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  input: {
    ...testStyles.input,
    flex: '1 1 200px',
    width: 'auto',
    letterSpacing: 0,
    fontSize: 18,
  },
  list: {
    margin: 0,
    padding: '8px 8px 8px 32px',
    minHeight: 80,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    columns: '2 140px',
    fontSize: 15,
  },
  counted: {
    padding: 10,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 1.45,
  },
};
