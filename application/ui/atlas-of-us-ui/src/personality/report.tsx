import type { CSSProperties } from 'react';
import { DOMAINS, type Report } from './api';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const comic = 'var(--font-comic)';

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
