import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CATEGORIES, standingBriefly, waitingToCompare, type Ability, type Measurements } from './api';
import { STANDING, heat, hex, meshesOf, standingColor, type Body, type Light } from './body_parts';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

interface ResultsProps {
  abilities: Ability[];
  measurements: Measurements;
  body: Body;
  onLight: (light: Light) => void;
  picked?: string; //the ability open, by id
  onPick: (id?: string) => void;
}

//where the user stands on their abilities, drawn on the body in color, with a way to narrow it to one category and to
//open an ability to see where it lives and what its place comes from
export default function Results({ abilities, measurements, body, onLight, picked, onPick: setPicked }: ResultsProps) {
  const [chosen, setCategory] = useState<Ability['category']>();
  //an ability opened from elsewhere shows among everything, when its category isn't the one chosen
  const pickedCategory = abilities.find((a) => a.id === picked)?.category;
  const category = pickedCategory && chosen !== pickedCategory ? undefined : chosen;
  const shown = useMemo(() => abilities.filter((a) => !category || a.category === category), [abilities, category]);
  const placed = shown.filter((a) => a.value !== null).sort((a, b) => b.value! - a.value!);

  useEffect(() => {
    const ability = abilities.find((a) => a.id === picked);
    onLight(ability ? { lit: meshesOf(body, ability.parts) } : { tints: heat(shown, body) });
  }, [abilities, shown, body, picked, onLight]);

  return (
    <>
      <div style={styles.legend} aria-hidden="true">
        <div style={styles.scale} />
        <div style={styles.ends}>
          <span>Low</span>
          <span>50</span>
          <span>High</span>
        </div>
      </div>

      <div style={styles.chips} role="group" aria-label="Which abilities">
        {[{ id: undefined, label: 'All' }, ...CATEGORIES].map((c) => (
          <button
            key={c.label}
            className="comic-lift"
            style={category === c.id ? { ...styles.chip, ...styles.chipOn } : styles.chip}
            aria-pressed={category === c.id}
            onClick={() => {
              setCategory(c.id);
              setPicked(undefined);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!placed.length && <p style={styles.text}>You haven't measured or rated any of these yet. Take a test or rate yourself and it will show up here.</p>}
      <ul style={styles.list}>
        {placed.map((a) => (
          <li key={a.id}>
            <button className="comic-lift" style={picked === a.id ? { ...styles.row, ...styles.rowOpen } : styles.row} aria-expanded={picked === a.id} onClick={() => setPicked(picked === a.id ? undefined : a.id)}>
              <span
                style={{
                  ...styles.swatch,
                  background: hex(standingColor(a.value!)),
                }}
              />
              <span style={styles.name}>{a.name}</span>
              <span style={styles.value}>{Math.round(a.value! * 100)}</span>
            </button>
            {picked === a.id && <Detail ability={a} />}
          </li>
        ))}
      </ul>
      {shown.length > placed.length && !!placed.length && <p style={styles.small}>{unplaced(shown, measurements)}</p>}
    </>
  );
}

//the abilities showing without a place: the ones waiting on more people to compare their test with, and the rest
function unplaced(shown: Ability[], measurements: Measurements) {
  const waiting = shown.filter((a) => waitingToCompare(a, measurements)).length;
  const untried = shown.filter((a) => a.value === null).length - waiting;
  return [
    waiting && `${waiting} more ${waiting === 1 ? 'is' : 'are'} waiting on more people to compare with.`,
    untried && `${untried} ${waiting ? '' : 'more '}${untried === 1 ? "hasn't" : "haven't"} been measured or rated yet.`,
  ]
    .filter(Boolean)
    .join(' ');
}

//how much practice changes an ability, in words
const PRACTICE = { 'a lot': 'Practice changes this a lot.', some: 'Practice changes this some.', little: 'Practice changes this only a little.' };

//an open ability: what it is, what the user's place on it comes from, how much practice moves it, and tips. It scrolls
//into view when it opens
function Detail({ ability: a }: { ability: Ability }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);
  const from = a.basis.map((b) =>
    b.kind === 'measurement'
      ? `${b.name}${b.standing !== null ? `, ${standingBriefly(b.standing, 'higher')}` : ''}`
      : b.kind === 'rating'
        ? 'Your own rating'
        : `${b.extent ? `A ${b.extent} impairment` : 'An impairment'} in ${b.name.toLowerCase()}`,
  );
  const untested = a.measurements.filter((m) => !m.counted).map((m) => m.name);
  //working around an impairment comes first for someone with one in what it rests on
  const impaired = a.basis.some((b) => b.kind === 'impairment');
  const tips = [...(impaired ? a.tips.filter((t) => t.kind === 'impairment') : []), ...a.tips.filter((t) => t.kind === 'practice')].slice(0, 2);
  return (
    <div ref={ref} style={styles.detail}>
      <p style={styles.text}>{a.description}</p>
      <p style={styles.small}>
        <strong>From:</strong> {from.join('; ')}.{a.confidence !== null && a.confidence < 0.5 && ' An early read, so take it lightly.'}
      </p>
      {a.practice && <p style={styles.small}>{PRACTICE[a.practice]}</p>}
      {!!untested.length && <p style={styles.small}>You could also test it with {untested.join(', ')}.</p>}
      {tips.map((t) => (
        <p key={t.text} style={styles.tip}>
          {t.text}
        </p>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  scale: {
    height: 16,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    background: `linear-gradient(to right, ${hex(STANDING.low)}, ${hex(STANDING.typical)}, ${hex(STANDING.high)})`,
  },
  ends: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  text: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  small: {
    margin: 0,
    fontSize: 13,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '4px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  chipOn: {
    background: brownRed,
    color: ivory,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 12px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    font: 'inherit',
    fontSize: 16,
    textAlign: 'left',
    cursor: 'pointer',
  },
  rowOpen: {
    background: 'var(--pale-red)',
  },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    margin: '6px 4px 10px 12px',
    padding: '4px 0 4px 12px',
    borderLeft: `3px solid ${gunmetal}`,
  },
  tip: {
    margin: 0,
    padding: '4px 10px',
    background: 'var(--pale-blue)',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.4,
  },
  swatch: {
    flex: 'none',
    width: 18,
    height: 18,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
  },
  name: {
    flex: 1,
  },
  value: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
};
