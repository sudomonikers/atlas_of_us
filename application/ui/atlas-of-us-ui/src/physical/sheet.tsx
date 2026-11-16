import { type CSSProperties } from 'react';
import { shownReading, type Ability, type Measurement } from './api';
import { hex, standingColor } from './body_parts';
import { Impaired } from './impaired';
import { Tips } from './tips';
import { plainLabel } from './plain';
import { askedFor, sceneFor } from './tour';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

interface SheetProps {
  abilities: Ability[]; //the category's
  measurements: Measurement[];
  onGo: (scene: string) => void; //back to the scene that asks about an ability
}

//where the user stands on each ability in a category, across the stage over Atlas summing it up: each ability on a card
//with a bar out of 100, a mark at typical, what it means and what it came from, the ones they've done that there's
//nobody to compare with yet, and the ones still to do, each a step back to its scene
export default function Sheet({ abilities, measurements, onGo }: SheetProps) {
  const placed = abilities.filter((a) => a.value !== null).sort((a, b) => b.value! - a.value!);
  //their latest reading of a measurement asked for an ability, when they have one
  const tried = (a: Ability) =>
    askedFor(a)
      .map((s) => measurements.find((m) => m.id === s.id))
      .find((m) => m?.readings.length);
  const waiting = abilities.filter((a) => a.value === null && tried(a));
  const todo = abilities.filter((a) => a.value === null && !tried(a));

  //what a place on an ability came from, in a few words: the latest reading, their own rating, or an impairment
  const from = (a: Ability) => {
    const b = a.basis[0];
    if (!b) return '';
    if (b.kind === 'rating') return 'From your own rating';
    const m = measurements.find((x) => x.name === b.name);
    const latest = m?.readings[0];
    return m && latest ? `From your ${m.name.toLowerCase()}: ${shownReading(latest.value, m)}` : `From your ${b.name.toLowerCase()}`;
  };

  return (
    <>
      {!!placed.length && (
        <section style={styles.section}>
          <h3 style={styles.heading}>Your scores</h3>
          <ul style={styles.list}>
            {placed.map((a) => {
              const score = Math.round(a.value! * 100);
              return (
                <li key={a.id} style={styles.row}>
                  <div style={styles.top}>
                    <span style={styles.name}>{plainLabel(a.name)}</span>
                    <span style={styles.score}>{score}</span>
                  </div>
                  <div style={styles.track} role="img" aria-label={`${score} out of 100, where 50 is typical`}>
                    <span style={{ ...styles.fill, width: `${Math.max(3, score)}%`, background: hex(standingColor(a.value!)) }} />
                    <span style={styles.typical} />
                  </div>
                  <p style={styles.text}>
                    Better than about {score} in 100 people your age. {from(a)}.
                  </p>
                  <Impaired basis={a.basis} />
                  <Tips ability={a} />
                </li>
              );
            })}
          </ul>
          <p style={styles.small}>The mark on each bar is typical: half of people score above it and half below.</p>
        </section>
      )}

      {!!waiting.length && (
        <section style={styles.section}>
          <h3 style={styles.heading}>Done, waiting to compare</h3>
          <ul style={styles.todo}>
            {waiting.map((a) => {
              const m = tried(a)!;
              return (
                <li key={a.id} style={styles.todoRow}>
                  <span>{plainLabel(a.name)}</span>
                  <span style={styles.reading}>{shownReading(m.readings[0].value, m)}</span>
                </li>
              );
            })}
          </ul>
          <p style={styles.small}>
            These are tests made for the Atlas, so you're compared with other people who've taken them. Once enough people your age have, you'll see where you stand.
          </p>
        </section>
      )}

      {!!todo.length && (
        <section style={styles.section}>
          <h3 style={styles.heading}>Not done yet</h3>
          <ul style={styles.todo}>
            {todo.map((a) => (
              <li key={a.id} style={styles.todoRow}>
                <span>{plainLabel(a.name)}</span>
                <button className="comic-lift" style={styles.go} onClick={() => onGo(sceneFor(a))}>
                  Do it now
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p style={styles.small}>The abilities are from O*NET, by the U.S. Department of Labor (CC BY 4.0), in everyday words.</p>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  //the abilities in columns across the stage, each on its own card
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 14,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '12px 14px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: '12px 8px 11px 9px / 9px 11px 8px 12px',
  },
  top: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 17,
  },
  score: {
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
  },
  track: {
    position: 'relative',
    height: 14,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: '10px 6px 9px 7px / 7px 9px 6px 10px',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  typical: {
    position: 'absolute',
    left: '50%',
    top: -2,
    bottom: -2,
    width: 0,
    borderLeft: `3px dashed ${gunmetal}`,
  },
  text: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.4,
  },
  small: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.4,
  },
  todo: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: '4px 28px',
  },
  todoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '6px 0',
    borderBottom: `2px dashed rgba(57, 61, 63, 0.25)`,
    fontSize: 15,
  },
  reading: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  go: {
    padding: '2px 12px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 14,
    cursor: 'pointer',
  },
};
