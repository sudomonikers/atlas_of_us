import { useState, type CSSProperties } from 'react';
import { FEELINGS, INTENSITIES, setFeelings, type Feeling, type FeelingKind } from './api';
import { AtlasError } from '../shared_components/atlas-error';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the longest a reason can be, as the api allows
const MAX_REASON = 200;

interface FeelingsFormProps {
  skillId: string;
  feelings: Feeling[]; //how they feel about it now
  onSaved: (feelings: Feeling[]) => void;
  onCancel: () => void;
  cancelLabel?: string; //Cancel, unless the form is a step that can be skipped
}

//the intensity picked for a feeling: the closest of INTENSITIES to the one saved
const closest = (intensity: number) =>
  INTENSITIES.reduce((best, { value }) => (Math.abs(value - intensity) < Math.abs(best - intensity) ? value : best), INTENSITIES[1].value);

//sets how the user feels about a skill: any of liking it, disliking it, being bored by it and being intimidated by it,
//each with how strongly and, if they want, why
export function FeelingsForm({ skillId, feelings, onSaved, onCancel, cancelLabel = 'Cancel' }: FeelingsFormProps) {
  const [picked, setPicked] = useState<Map<FeelingKind, Feeling>>(
    () => new Map(feelings.map((f) => [f.kind, { ...f, intensity: closest(f.intensity) }])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const update = (kind: FeelingKind, change: Partial<Feeling> | null) =>
    setPicked((all) => {
      const next = new Map(all);
      if (change === null) next.delete(kind);
      else next.set(kind, { kind, intensity: INTENSITIES[1].value, reason: null, ...all.get(kind), ...change });
      return next;
    });
  const save = () => {
    const chosen = FEELINGS.flatMap(({ kind }) => picked.get(kind) ?? []).map((f) => ({ ...f, reason: f.reason?.trim() || null }));
    setSaving(true);
    setError(undefined);
    setFeelings(skillId, chosen).then(
      () => {
        setSaving(false);
        onSaved(chosen);
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return (
    <div style={styles.form} role="group" aria-label="Your feelings">
      <p style={styles.question}>How do you feel about it?</p>
      <p style={styles.hint}>Pick as many as are true. You can like something and be intimidated by it too.</p>
      <div style={styles.choices}>
        {FEELINGS.map(({ kind, label }) => (
          <button key={kind} className="comic-lift" style={picked.has(kind) ? { ...styles.chip, ...styles.chipPicked } : styles.chip} aria-pressed={picked.has(kind)} onClick={() => update(kind, picked.has(kind) ? null : {})}>
            {label}
          </button>
        ))}
      </div>
      {FEELINGS.filter(({ kind }) => picked.has(kind)).map(({ kind, label }) => {
        const feeling = picked.get(kind)!;
        return (
          <div key={kind} style={styles.feeling}>
            <strong>{label}</strong>
            <div style={styles.choices} role="group" aria-label={`How much: ${label}`}>
              {INTENSITIES.map(({ label: how, value }) => (
                <button key={how} className="comic-lift" style={feeling.intensity === value ? { ...styles.small, ...styles.chipPicked } : styles.small} aria-pressed={feeling.intensity === value} onClick={() => update(kind, { intensity: value })}>
                  {how}
                </button>
              ))}
            </div>
            <input
              style={styles.input}
              aria-label={`Why: ${label}`}
              placeholder="Why? (optional)"
              maxLength={MAX_REASON}
              value={feeling.reason ?? ''}
              onChange={(e) => update(kind, { reason: e.target.value })}
            />
          </div>
        );
      })}
      {error && <AtlasError message={error} />}
      <div style={styles.choices}>
        <button className="comic-lift" style={styles.primary} disabled={saving} onClick={save}>
          Save
        </button>
        <button className="comic-lift" style={styles.secondary} disabled={saving} onClick={onCancel}>
          {cancelLabel}
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
    textAlign: 'left',
  },
  question: {
    margin: 0,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  hint: {
    margin: 0,
    fontSize: 15,
    color: blue,
  },
  choices: {
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
  chipPicked: {
    background: blue,
    color: ivory,
  },
  small: {
    padding: '2px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 14,
    cursor: 'pointer',
  },
  feeling: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingTop: 8,
    borderTop: `2px dotted ${gunmetal}`,
    fontSize: 15,
  },
  input: {
    padding: '4px 8px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    font: 'inherit',
    fontSize: 15,
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
