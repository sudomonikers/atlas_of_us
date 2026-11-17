import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AtlasError } from './atlas-error';
import { canSpend, cost, refreshCredits, useCredits } from '../credits/api';
import { GetCredits } from '../credits/get_credits';
import { Thinking } from './thinking';
import { brownRed, comic, gunmetal, ivory } from './palette';

//how often a write-up being written is checked on, and for how long before saying it's taking a while
const CHECK_EVERY = 4000;
const CHECK_FOR = 120_000;

//a write-up Atlas writes when the person asks, and where it's at
export interface WriteUpState<T> {
  summary: T | null;
  written_at: string | null;
  stale: boolean; //whether anything it was written from has changed since
  writing: boolean;
  failed: boolean; //whether the last one asked for couldn't be written
  enough: boolean; //whether there's enough to write about yet
}

//what the panel says while the write-up is missing, being written or out of date
export interface WriteUpWords {
  label: string; //what the write-up is, for screen readers
  finding: string; //while it's loading
  writing: string; //while the first one is written
  rewriting: string; //while a new one is written over the last
  enough: string; //when there's enough for the first one
  notEnough: string; //when there isn't yet
  changed: string; //when what it was written from has changed
}

const written = (at: string) => new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

//one of Atlas's write-ups of the logged in user: written on their asking for a credit, once there's enough to write
//about, and written again when they ask after what it was written from changes
export function WriteUpPanel<T>({ get, ask, render, words }: { get: () => Promise<WriteUpState<T>>; ask: () => Promise<WriteUpState<T>>; render: (summary: T) => ReactNode; words: WriteUpWords }) {
  const [state, setState] = useState<WriteUpState<T>>();
  const [error, setError] = useState<string>();
  const [asking, setAsking] = useState(false);
  const [slow, setSlow] = useState(false);
  const credits = useCredits();
  const getLatest = useRef(get);
  useEffect(() => {
    getLatest.current = get;
  });

  useEffect(() => {
    getLatest.current().then(setState, (e: Error) => setError(e.message));
  }, []);

  //while it's being written, check on it until it's done or it's taking too long
  const writing = !!state?.writing;
  //a write spends a credit, and one that fails gives it back, so the balance is read again once it's done either way
  const loaded = !!state;
  const gaveUp = !!state?.failed;
  useEffect(() => {
    if (loaded && !writing) refreshCredits();
  }, [loaded, writing, gaveUp]);
  const started = useRef(0);
  useEffect(() => {
    if (!writing) return;
    started.current = Date.now();
    setSlow(false);
    const timer = setInterval(() => {
      if (Date.now() - started.current > CHECK_FOR) {
        setSlow(true);
        clearInterval(timer);
        return;
      }
      getLatest.current().then(setState, () => {});
    }, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [writing]);

  const askForIt = () => {
    setAsking(true);
    setError(undefined);
    ask()
      .then(setState, (e: Error) => setError(e.message))
      .finally(() => {
        setAsking(false);
        refreshCredits();
      });
  };

  if (!state) return <section style={styles.panel}>{error ? <AtlasError message={error} /> : <Thinking label={words.finding} />}</section>;
  const { summary, stale, failed, enough } = state;
  //each write costs a credit, unless they're subscribed
  const button = (label: string) =>
    canSpend(credits) ? (
      <button className="comic-lift" style={styles.button} disabled={asking} onClick={askForIt}>
        {label}
        {cost(credits)}
      </button>
    ) : (
      <GetCredits buttonStyle={styles.button} />
    );

  return (
    <section style={styles.panel} aria-label={words.label}>
      {summary && render(summary)}
      <div style={styles.status}>
        {writing ? (
          slow ? (
            <p style={styles.note}>This is taking longer than usual. Check back in a bit.</p>
          ) : (
            <Thinking label={summary ? words.rewriting : words.writing} />
          )
        ) : failed ? (
          <>
            <p style={styles.note}>I couldn't write it just now. Try again in a moment.</p>
            {button('Try again')}
          </>
        ) : !summary ? (
          enough ? (
            <>
              <p style={styles.note}>{words.enough}</p>
              {button('Write my summary')}
            </>
          ) : (
            <p style={styles.note}>{words.notEnough}</p>
          )
        ) : stale && enough ? (
          <>
            <p style={styles.note}>{words.changed}</p>
            {button('Update my summary')}
          </>
        ) : (
          state.written_at && <p style={styles.small}>Written {written(state.written_at)}.</p>
        )}
        {error && <AtlasError message={error} />}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '24px 28px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  status: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  note: {
    margin: 0,
    flex: '1 1 260px',
    fontSize: 17,
    lineHeight: 1.4,
  },
  small: {
    margin: 0,
    fontSize: 14,
    opacity: 0.75,
  },
  button: {
    padding: '6px 18px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
};
