import type { CSSProperties } from 'react';
import { blue, brownRed, comic, gunmetal } from './palette';

//a part of the person the write-up has a paragraph on, such as a personality domain or an area of abilities
export interface ReportSection {
  key: string;
  label: string;
  text: string;
}

//a short list under the paragraphs, such as their strengths
export interface ReportList {
  title: string;
  items: string[];
}

//something Atlas wrote up about someone: a headline, an overview, a paragraph on each part of them, then lists side
//by side. The personality report and the abilities summary are both shown with it
export function WrittenReport({ headline, overview, sections, lists }: { headline: string; overview: string; sections: ReportSection[]; lists: ReportList[] }) {
  return (
    <div style={styles.report}>
      <h3 style={styles.headline}>{headline}</h3>
      {overview.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i} style={styles.paragraph}>
          {paragraph}
        </p>
      ))}
      {sections.map((s) => (
        <p key={s.key} style={styles.paragraph}>
          <strong style={styles.section}>{s.label}.</strong> {s.text}
        </p>
      ))}
      <div style={styles.lists}>
        {lists
          .filter((l) => l.items.length)
          .map((l) => (
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
  section: {
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
