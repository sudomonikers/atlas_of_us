import { useEffect, useState, type CSSProperties } from 'react';
import { capitalised, type Ability, type Conditions, type Impairment, type Impairments, type Measurement, type PartSummary } from './api';
import { HUMAN_BODY, heat, meshesOf, type Body, type Light } from './body_parts';
import { ImpairmentForm } from './impairment_form';
import { PartPanel } from './part_panel';
import { Checkbox } from '../shared_components/checkbox';
import { SearchField } from '../shared_components/search_field';
import { matchesAll, searchWords } from '../shared_components/search';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//the most search results shown at once
const MAX_RESULTS = 20;

interface BodyMapProps {
  anatomy: PartSummary[];
  body: Body;
  impairments: Impairments;
  conditions: Conditions;
  measurements: Map<string, Measurement>; //every measurement, with the user's readings, by id
  abilities: Ability[];
  picked: string | undefined; //the id of the part open, picked here or on the 3D body
  onPick: (id: string) => void;
  onImpaired: (saved: Impairment, abilities: Ability[]) => void; //with the user's abilities, which impairments hold back
  onLight: (light: Light) => void;
}

//the body to explore and learn from: pick any part on the 3D body or here to light it up and read all about it, pick a
//whole system, or search for a part by name, with where the user stands on their abilities drawn on it if they like
export default function BodyMap({ anatomy, body, impairments, conditions, measurements, abilities, picked, onPick, onImpaired, onLight }: BodyMapProps) {
  const [version, setVersion] = useState(0); //goes up when the user notes something, so the open part reloads
  const [noting, setNoting] = useState(false);
  const [results, setResults] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    onLight({ lit: picked ? meshesOf(body, [picked]) : undefined, tints: results ? heat(abilities, body) : undefined });
  }, [picked, results, abilities, body, onLight]);

  const root = body.byFma.get(HUMAN_BODY);
  const systems = anatomy.filter((p) => root && p.wholes.includes(root.id));
  const part = picked ? body.byId.get(picked) : undefined;
  const mine = new Map(impairments.impairments.map((i) => [i.id, i]));
  const myConditions = new Set(conditions.mine.map((m) => m.id));
  const pick = (id: string) => {
    setNoting(false);
    onPick(id);
  };
  const saved = (impairment: Impairment, abilities: Ability[]) => {
    onImpaired(impairment, abilities);
    setNoting(false);
    setVersion((v) => v + 1);
  };

  //every word of the search has to be in its name or another name for it
  const words = searchWords(query);
  const found = words.length ? anatomy.filter((p) => matchesAll(words, [p.name, ...p.synonyms])) : [];

  return (
    <>
      <Checkbox checked={results} onChange={setResults} label="Show where I stand on my abilities" />

      {part ? (
        noting ? (
          <ImpairmentForm part={{ id: part.id, name: capitalised(part.name) }} structure impairment={mine.get(part.id) ?? null} onSaved={saved} onCancel={() => setNoting(false)} />
        ) : (
          <PartPanel key={`${part.id}-${version}`} id={part.id} myConditions={myConditions} measurements={measurements} onPick={pick} onNote={() => setNoting(true)} />
        )
      ) : (
        <p style={styles.text}>Nothing picked yet. Try clicking the heart, or pick a system below.</p>
      )}

      <section style={styles.section}>
        <h2 style={styles.heading}>Systems and regions</h2>
        <div style={styles.chips}>
          {systems.map((s) => (
            <button key={s.id} className="comic-lift" style={picked === s.id ? { ...styles.chip, ...styles.chipOn } : styles.chip} onClick={() => pick(s.id)}>
              {capitalised(s.name)}
            </button>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.heading}>Find a part</h2>
        <SearchField id="anatomy-search" query={query} onQuery={setQuery} placeholder="Femur, retina, biceps, vagus nerve..." />
        {words.length > 0 && !found.length && <p style={styles.text}>Nothing by that name. Try another word.</p>}
        <div style={styles.chips}>
          {found.slice(0, MAX_RESULTS).map((p) => (
            <button key={p.id} className="comic-lift" style={styles.part} onClick={() => pick(p.id)}>
              {capitalised(p.name)}
            </button>
          ))}
        </div>
        {found.length > MAX_RESULTS && <p style={styles.small}>And {found.length - MAX_RESULTS} more. Add a word to narrow it down.</p>}
      </section>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 26,
    letterSpacing: 1,
    color: brownRed,
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
    alignItems: 'center',
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
  part: {
    padding: '2px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    font: 'inherit',
    fontSize: 14,
    textAlign: 'left',
    cursor: 'pointer',
  },
};
