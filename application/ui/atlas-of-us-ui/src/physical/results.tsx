import { useEffect, useState, type CSSProperties } from 'react';
import { CATEGORIES, type Ability } from './api';
import { STANDING, heat, hex, meshesOf, standingColour, type Body, type Light } from './body_parts';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

interface ResultsProps {
  abilities: Ability[];
  only?: Ability['category']; //shows only the abilities in this category, with no way to change it
  body: Body;
  onLight: (light: Light) => void;
}

//where the user stands on their abilities, drawn on the body in colour, with a way to narrow it to one category and to
//pick an ability to see where it lives
export default function Results({ abilities, only, body, onLight }: ResultsProps) {
  const [chosen, setCategory] = useState<Ability['category']>();
  const category = only ?? chosen;
  const [picked, setPicked] = useState<string>();
  const shown = abilities.filter((a) => !category || a.category === category);
  const placed = shown.filter((a) => a.value !== null).sort((a, b) => b.value! - a.value!);

  useEffect(() => {
    const ability = abilities.find((a) => a.id === picked);
    onLight(
      ability
        ? { lit: meshesOf(body, ability.parts) }
        : {
            tints: heat(
              abilities.filter((a) => !category || a.category === category),
              body,
            ),
          },
    );
  }, [abilities, body, category, picked, onLight]);

  return (
    <>
      <div style={styles.legend} aria-hidden="true">
        <div style={styles.scale} />
        <div style={styles.ends}>
          <span>Behind most</span>
          <span>Typical</span>
          <span>Ahead of most</span>
        </div>
      </div>

      {!only && (
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
      )}

      {!placed.length && <p style={styles.text}>Nothing here has a place yet. Take a test or rate yourself, and it will show up here.</p>}
      <ul style={styles.list}>
        {placed.map((a) => (
          <li key={a.id}>
            <button className="comic-lift" style={picked === a.id ? { ...styles.row, ...styles.rowOpen } : styles.row} aria-pressed={picked === a.id} onClick={() => setPicked(picked === a.id ? undefined : a.id)}>
              <span
                style={{
                  ...styles.swatch,
                  background: hex(standingColour(a.value!)),
                }}
              />
              <span style={styles.name}>{a.name}</span>
              <span style={styles.value}>{Math.round(a.value! * 100)}</span>
            </button>
          </li>
        ))}
      </ul>
      {shown.length > placed.length && !!placed.length && (
        <p style={styles.small}>
          {shown.length - placed.length} more {shown.length - placed.length === 1 ? "doesn't" : "don't"} have a place yet.
        </p>
      )}
    </>
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
