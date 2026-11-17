import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { askForSummary, CATEGORIES, getSummary, type AbilitiesSummary, type SummaryState } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { canSpend, cost, refreshCredits, useCredits } from '../credits/api';
import { GetCredits } from '../credits/get_credits';
import { Thinking } from '../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//how often a summary being written is checked on, and for how long before saying it's taking a while
const CHECK_EVERY = 4000;
const CHECK_FOR = 120_000;

//the summary Atlas writes of everything someone has added to Abilities, on Your results and their profile
export function SummaryText({ summary }: { summary: AbilitiesSummary }) {
  const areas = CATEGORIES.flatMap((c) => summary.areas.filter((a) => a.key === c.id).map((a) => ({ ...a, label: c.label })));
  const lists = [
    { title: 'Strengths', items: summary.strengths },
    { title: 'Worth working on', items: summary.work_on },
    { title: 'Working around', items: summary.working_around },
  ].filter((l) => l.items.length);

  return (
    <div style={styles.text}>
      <h3 style={styles.headline}>{summary.headline}</h3>
      {summary.overview.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} style={styles.paragraph}>
          {paragraph}
        </p>
      ))}
      {areas.map((a) => (
        <p key={a.key} style={styles.paragraph}>
          <strong style={styles.area}>{a.label}.</strong> {a.text}
        </p>
      ))}
      <div style={styles.lists}>
        {lists.map((l) => (
          <div key={l.title} style={styles.list}>
            <h4 style={styles.listTitle}>{l.title}</h4>
            <ul style={styles.items}>
              {l.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const written = (at: string) => new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

//the user's summary at the top of Your results: written on their asking, once there's enough to write about, and
//written again when they ask after their results change
export function SummaryPanel() {
  const [state, setState] = useState<SummaryState>();
  const [error, setError] = useState<string>();
  const [asking, setAsking] = useState(false);
  const [slow, setSlow] = useState(false);
  const credits = useCredits();

  useEffect(() => {
    getSummary().then(setState, (e: Error) => setError(e.message));
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
      getSummary().then(setState, () => {});
    }, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [writing]);

  const ask = () => {
    setAsking(true);
    setError(undefined);
    askForSummary()
      .then(setState, (e: Error) => setError(e.message))
      .finally(() => {
        setAsking(false);
        refreshCredits();
      });
  };

  if (!state) return <section style={styles.panel}>{error ? <AtlasError message={error} /> : <Thinking label="Finding your summary" />}</section>;
  const { summary, stale, failed, enough } = state;
  //each write costs a credit, unless they're subscribed
  const button = (label: string) =>
    canSpend(credits) ? (
      <button className="comic-lift" style={styles.button} disabled={asking} onClick={ask}>
        {label}
        {cost(credits)}
      </button>
    ) : (
      <GetCredits buttonStyle={styles.button} />
    );

  return (
    <section style={styles.panel} aria-label="Your summary">
      {summary && <SummaryText summary={summary} />}
      <div style={styles.status}>
        {writing ? (
          slow ? (
            <p style={styles.note}>This is taking longer than usual. Check back in a bit.</p>
          ) : (
            <Thinking label={summary ? 'Rewriting it with your latest results' : 'Writing up your summary'} />
          )
        ) : failed ? (
          <>
            <p style={styles.note}>I couldn't write it just now. Try again in a moment.</p>
            {button('Try again')}
          </>
        ) : !summary ? (
          enough ? (
            <>
              <p style={styles.note}>I have enough to write up what your results say about you as a whole.</p>
              {button('Write my summary')}
            </>
          ) : (
            <p style={styles.note}>Add a few more results and I'll write up the whole picture. The chapters below are a good place to start.</p>
          )
        ) : stale && enough ? (
          <>
            <p style={styles.note}>Your results have changed since I wrote this.</p>
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
  text: {
    fontSize: 19,
    lineHeight: 1.4,
  },
  headline: {
    margin: '0 0 12px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.15,
  },
  paragraph: {
    margin: '0 0 12px',
  },
  area: {
    fontFamily: comic,
    fontWeight: 400,
    letterSpacing: 1,
  },
  lists: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: '8px 24px',
    marginTop: 8,
  },
  list: {
    minWidth: 0,
  },
  listTitle: {
    margin: '0 0 4px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
  },
  items: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 17,
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
