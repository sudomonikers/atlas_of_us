import { type CSSProperties } from 'react';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//one question or round of a test, as it went: what it was, whether it counted for or against the score, and what
//happened
export interface Part {
  label: string;
  right?: boolean; //unset for a round that's a measure rather than right or wrong
  note: string;
}

//how a test worked out its score, shown once it's done: the rule and the sum, and each part that went into it
export interface Scored {
  how: string;
  parts?: Part[];
  right?: number; //how many were right and wrong, when the parts are only some of them, such as only the mistakes
  wrong?: number;
}

//a part's look: right in blue, wrong in red, a measure plain
const LOOK = (right?: boolean) => (right === undefined ? { tag: '', ink: gunmetal } : right ? { tag: 'Right', ink: blue } : { tag: 'Wrong', ink: brownRed });

//how a test just taken was scored, under its score
export function ScoredView({ scored }: { scored: Scored }) {
  const { parts = [] } = scored;
  const right = scored.right ?? parts.filter((p) => p.right === true).length;
  const wrong = scored.wrong ?? parts.filter((p) => p.right === false).length;
  return (
    <section style={styles.box} aria-label="How you were scored">
      <h3 style={styles.title}>How you were scored</h3>
      <p style={styles.how}>{scored.how}</p>
      {right + wrong > 0 && (
        <p style={styles.tally}>
          <span style={{ color: blue }}>{right} right</span> · <span style={{ color: brownRed }}>{wrong} wrong</span>
        </p>
      )}
      {!!parts.length && (
        <ol style={styles.parts}>
          {parts.map((p, i) => {
            const look = LOOK(p.right);
            return (
              <li key={i} style={{ ...styles.part, borderLeftColor: look.ink }}>
                <span style={styles.label}>{p.label}</span>
                {look.tag && <span style={{ ...styles.tag, color: look.ink, borderColor: look.ink }}>{look.tag}</span>}
                <span style={styles.note}>{p.note}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  box: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  title: {
    margin: 0,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 0.5,
    color: brownRed,
  },
  how: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.4,
  },
  tally: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
  },
  parts: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 260,
    overflowY: 'auto',
  },
  part: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '2px 8px',
    padding: '3px 8px',
    background: '#fff',
    borderLeft: '4px solid',
    borderRadius: 4,
    fontSize: 14,
  },
  label: {
    fontWeight: 700,
    minWidth: 56,
  },
  tag: {
    padding: '0 6px',
    border: '1.5px solid',
    borderRadius: 999,
    fontSize: 12,
  },
  note: {
    flex: '1 1 160px',
  },
};
