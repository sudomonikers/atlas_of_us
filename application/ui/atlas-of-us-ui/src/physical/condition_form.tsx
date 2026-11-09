import { useState, type CSSProperties } from 'react';
import { SEVERITIES, capitalised, setMyCondition, type Condition, type MyCondition, type Severity } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Checkbox } from '../shared_components/checkbox';
import { Disclosure } from '../shared_components/disclosure';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { useSave } from '../shared_components/use_save';

interface ConditionFormProps {
  condition: Condition;
  mine: MyCondition | null; //what they've said about it already, if anything
  onSaved: (mine: MyCondition) => void;
  onCancel: () => void;
}

//what a condition is, and how it is for the user: how much it affects them, whether it was diagnosed and whether it's
//under control
export function ConditionForm({ condition, mine, onSaved, onCancel }: ConditionFormProps) {
  const [severity, setSeverity] = useState<Severity | null>(mine?.severity ?? null);
  const [diagnosed, setDiagnosed] = useState(mine?.diagnosed ?? false);
  const [managed, setManaged] = useState(mine?.managed ?? false);
  const { saving, error, run } = useSave();

  const save = () => run(setMyCondition(condition.id, severity, diagnosed, managed), () => onSaved({ id: condition.id, severity, diagnosed, managed }));

  return (
    <div style={styles.form} role="group" aria-label={capitalised(condition.name)}>
      <p style={styles.title}>{capitalised(condition.name)}</p>
      {condition.description && <p style={styles.text}>{condition.description}</p>}
      {!!condition.synonyms.length && (
        <Disclosure label="Other names">
          <p style={styles.small}>{condition.synonyms.join('; ')}</p>
        </Disclosure>
      )}
      <p style={styles.question}>
        How much does it affect you? <span style={styles.optional}>Optional</span>
      </p>
      <div style={styles.choices}>
        {SEVERITIES.map((s) => (
          <button
            key={s.value}
            className="comic-lift"
            style={severity === s.value ? { ...styles.choice, ...styles.picked } : styles.choice}
            aria-pressed={severity === s.value}
            onClick={() => setSeverity(severity === s.value ? null : s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Checkbox checked={diagnosed} onChange={setDiagnosed} label="A doctor or other professional diagnosed it" />
      <Checkbox checked={managed} onChange={setManaged} label="It's under control, with treatment or otherwise" />
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
