import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { askForReport, DOMAINS, getReport, type Report, type ReportState } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { canSpend, cost, refreshCredits, useCredits } from '../credits/api';
import { GetCredits } from '../credits/get_credits';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const comic = 'var(--font-comic)';
const ivory = 'var(--ivory-white)';

//how often a report being written is checked on, and for how long before saying it's taking a while
const CHECK_EVERY = 4000;
const CHECK_FOR = 120_000;

const written = (at: string) => new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

//the user's report at the top of My Personality: written only when they ask, once they've finished and been scored on
//every chapter, and written again when they ask after their scores change. onWritten is called when a new one is in
export function ReportPanel({ onWritten }: { onWritten: () => void }) {
  const [state, setState] = useState<ReportState>();
  const [error, setError] = useState<string>();
  const [asking, setAsking] = useState(false);
  const [slow, setSlow] = useState(false);
  const credits = useCredits();

  useEffect(() => {
    getReport().then(setState, (e: Error) => setError(e.message));
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
  const latest = useRef(onWritten);
  useEffect(() => {
    latest.current = onWritten;
  });
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
      getReport().then((next) => {
        setState(next);
        if (!next.writing && !next.failed) latest.current();
      }, () => {});
    }, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [writing]);

  const ask = () => {
    setAsking(true);
    setError(undefined);
    askForReport()
      .then(setState, (e: Error) => setError(e.message))
      .finally(() => {
        setAsking(false);
        refreshCredits();
      });
  };

  if (!state) return error ? <AtlasError message={error} /> : null;
  const { report, stale, failed, enough } = state;
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
  const status = writing ? (
    slow ? (
      <p style={styles.note}>This is taking longer than usual. Check back in a bit.</p>
    ) : (
      <Thinking label={report ? 'Rewriting your report' : 'Writing up your report'} />
    )
  ) : failed && enough ? (
    <>
      <p style={styles.note}>I couldn't write it just now. Try again in a moment.</p>
      {button('Try again')}
    </>
  ) : !report ? (
    enough ? (
      <>
        <p style={styles.note}>You've finished every chapter and I've scored them all. I can write up your full report.</p>
        {button('Write my report')}
      </>
    ) : (
      <p style={styles.note}>Finish every chapter and have me score them, and I can write up your full report.</p>
    )
  ) : stale && enough ? (
    <>
      <p style={styles.note}>Your scores have changed since I wrote this.</p>
      {button('Update my report')}
    </>
  ) : (
    state.written_at && <p style={styles.small}>Written {written(state.written_at)}.</p>
  );

  return (
    <section style={styles.panel} className="comic-panel" aria-label="Your report">
      {report ? (
        <PersonalityReport report={report} />
      ) : (
        //before there's a report, what one is, so it's worth asking for
        <div style={styles.pitch}>
          <h2 style={styles.pitchTitle}>Your full report</h2>
          <p style={styles.pitchText}>
            Everything I've learned about you, written up in one place: a headline that sums you up, how your traits play off each other, a paragraph on each of
            the five big parts of your personality, as well as your strengths and weaknesses.
          </p>
        </div>
      )}
      <div style={styles.status}>
        {status}
        {error && <AtlasError message={error} />}
      </div>
    </section>
  );
}

//the written report on all of someone's traits, on My Personality and their profile
export function PersonalityReport({ report }: { report: Report }) {
  const domains = DOMAINS.flatMap((d) => report.domains.filter((r) => r.key === d.key).map((r) => ({ ...r, title: d.title })));

  return (
    <div style={styles.report}>
      <h3 style={styles.headline}>{report.headline}</h3>
      {report.overview.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} style={styles.paragraph}>
          {paragraph}
        </p>
      ))}
      {domains.map((d) => (
        <p key={d.key} style={styles.paragraph}>
          <strong style={styles.domain}>{d.title}.</strong> {d.text}
        </p>
      ))}
      <div style={styles.lists}>
        <div style={styles.list}>
          <h4 style={styles.listTitle}>Strengths</h4>
          <ul style={styles.items}>
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div style={styles.list}>
          <h4 style={styles.listTitle}>Watch out for</h4>
          <ul style={styles.items}>
            {report.watch_outs.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    padding: '22px 28px 18px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  pitch: {
    marginBottom: 16,
  },
  pitchTitle: {
    margin: '0 0 8px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 36,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  pitchText: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.4,
  },
  status: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  note: {
    margin: 0,
    flex: '1 1 320px',
    fontSize: 19,
    lineHeight: 1.4,
  },
  small: {
    margin: 0,
    fontSize: 14,
    opacity: 0.75,
  },
  button: {
    padding: '8px 28px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 28,
    letterSpacing: 1.5,
    cursor: 'pointer',
  },
  report: {
    marginBottom: 24,
    fontSize: 19,
    lineHeight: 1.35,
  },
  headline: {
    marginBottom: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.1,
    color: blue,
  },
  paragraph: {
    margin: '0 0 12px',
  },
  domain: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 22,
    letterSpacing: 0.5,
    color: brownRed,
  },
  //side by side, stacking on narrow screens
  lists: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 40px',
    marginTop: 8,
  },
  list: {
    flex: '1 1 280px',
  },
  listTitle: {
    paddingBottom: 4,
    borderBottom: `3px solid ${gunmetal}`,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  items: {
    margin: '8px 0 0',
    paddingLeft: 22,
  },
};
