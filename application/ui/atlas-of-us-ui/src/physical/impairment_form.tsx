import { useState, type CSSProperties } from 'react';
import { CHANGES, EXTENTS, setImpairment, type Ability, type Change, type Extent, type Impairment } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//a body function or part, as the form shows it
export interface Impairable {
  id: string;
  name: string;
  description?: string | null;
  includes?: string[];
  excludes?: string[];
}

interface ImpairmentFormProps {
  part: Impairable;
  structure: boolean; //whether it's a body part, which can say how it has changed
  impairment: Impairment | null; //what they've said about it already, if anything
  onSaved: (impairment: Impairment, abilities: Ability[]) => void; //with the user's abilities, which it can hold back
  onCancel: () => void;
}

//what a function or part covers, and how much it's impaired, with how a part has changed
export function ImpairmentForm({ part, structure, impairment, onSaved, onCancel }: ImpairmentFormProps) {
  const [extent, setExtent] = useState<Extent | null>(impairment?.extent ?? null);
  const [change, setChange] = useState<Change | ''>(impairment?.change ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = () => {
    if (!extent) {
      setError('Pick how much.');
      return;
    }
    setSaving(true);
    setError(undefined);
    const kept = structure && change ? change : null;
    setImpairment(part.id, extent, kept).then(
      (abilities) => {
        setSaving(false);
        onSaved({ id: part.id, extent, change: kept }, abilities);
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return (
    <div style={styles.form} role="group" aria-label={`Your ${part.name}`}>
      <p style={styles.title}>{part.name}</p>
      {part.description && <p style={styles.text}>{part.description}</p>}
      {(!!part.includes?.length || !!part.excludes?.length) && (
        <Disclosure label="What it covers">
          {!!part.includes?.length && <p style={styles.small}>Includes: {part.includes.join('; ')}</p>}
          {!!part.excludes?.length && <p style={styles.small}>Doesn't include: {part.excludes.join('; ')}</p>}
        </Disclosure>
      )}
      <p style={styles.question}>How much is it impaired?</p>
      <div style={styles.choices}>
        {EXTENTS.map((e) => (
          <button
            key={e.value}
            className="comic-lift"
            style={extent === e.value ? { ...styles.choice, ...styles.picked } : styles.choice}
            aria-pressed={extent === e.value}
            title={e.detail}
            onClick={() => setExtent(e.value)}
          >
            {e.label}
          </button>
        ))}
      </div>
      {!!extent && <p style={styles.small}>{EXTENTS.find((e) => e.value === extent)!.detail}</p>}
      {structure && (
        <>
          <label style={styles.question} htmlFor={`change-${part.id}`}>
            How has it changed? <span style={styles.optional}>Optional</span>
          </label>
          <select id={`change-${part.id}`} style={styles.select} value={change} onChange={(e) => setChange(e.target.value as Change | '')}>
            <option value="">Not sure</option>
            {CHANGES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </>
      )}
      {error && <AtlasError message={error} />}
      <div style={styles.buttons}>
        <button className="comic-lift" style={styles.primary} disabled={saving} onClick={save}>
          Save
        </button>
        <button className="comic-lift" style={styles.secondary} disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 16px',
    background: '#fff',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 12,
  },
  title: {
    margin: 0,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.45,
  },
  small: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.4,
  },
  question: {
    margin: 0,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  optional: {
    fontFamily: 'inherit',
    fontSize: 13,
    color: gunmetal,
  },
  choices: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    padding: '4px 14px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  picked: {
    background: brownRed,
    color: ivory,
  },
  select: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    padding: '4px 8px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    font: 'inherit',
    fontSize: 15,
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  primary: {
    padding: '4px 14px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  secondary: {
    padding: '4px 14px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
};
