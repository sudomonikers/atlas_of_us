import { useState, type CSSProperties } from 'react';
import { MAX_PRACTICE_HOURS, setPractice } from './api';
import { AtlasError } from '../shared_components/atlas-error';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

interface PracticeFormProps {
  skillId: string;
  hours: number | null; //how many hours a week they've said they practice it, if they have
  onSaved: (hours: number) => void;
  onCancel: () => void;
}

//sets how many hours a week the user practices a skill they're on, or that they don't practice it now
export function PracticeForm({ skillId, hours, onSaved, onCancel }: PracticeFormProps) {
  const [typed, setTyped] = useState(hours ? String(hours) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = (value: number) => {
    if (!Number.isFinite(value) || value < 0 || value > MAX_PRACTICE_HOURS) {
      setError(`Pick between 0 and ${MAX_PRACTICE_HOURS} hours a week.`);
      return;
    }
    setSaving(true);
    setError(undefined);
    setPractice(skillId, value).then(
      () => {
        setSaving(false);
        onSaved(value);
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return (
    <form
      style={styles.form}
      aria-label="Your practice"
      onSubmit={(e) => {
        e.preventDefault();
        save(Number(typed));
      }}
    >
      <label style={styles.question} htmlFor={`practice-${skillId}`}>
        How many hours a week do you practice it?
      </label>
      <div style={styles.when}>
        <input
          id={`practice-${skillId}`}
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_PRACTICE_HOURS}
          step={0.5}
          required
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        <span>hours a week</span>
      </div>
      {error && <AtlasError message={error} />}
      <div style={styles.buttons}>
        <button type="submit" className="comic-lift" style={styles.primary} disabled={saving}>
          Save
        </button>
        <button type="button" className="comic-lift" style={styles.secondary} disabled={saving} onClick={() => save(0)}>
          I don't practice it now
        </button>
        <button type="button" className="comic-lift" style={styles.secondary} disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
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
  question: {
    margin: 0,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  when: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
  },
  input: {
    width: 90,
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
