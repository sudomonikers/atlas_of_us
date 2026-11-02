import { useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, clearGoal, setGoal, type GoalLevel } from './api';
import { AtlasError } from '../shared_components/atlas-error';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//how many years ahead a goal's date can be picked
const YEARS_AHEAD = 10;

const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'long' }));

//the last day of a month, as YYYY-MM-DD, since a goal is by the end of the month picked
function endOf(year: number, month: number) {
  const last = new Date(year, month + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}

interface GoalFormProps {
  skillId: string;
  current: number | null; //the level the user is at, if they've placed themselves on the skill. A goal is above it
  goal: GoalLevel | null; //the goal they have for it now, if any
  onSaved: (goal: GoalLevel | null) => void;
  onCancel: () => void;
}

//sets the level of a skill the user wants to reach, and optionally the month they want to reach it by. Clears a goal
//they already have
export function GoalForm({ skillId, current, goal, onSaved, onCancel }: GoalFormProps) {
  const today = new Date();
  const [rank, setRank] = useState(goal?.rank ?? Math.min((current ?? 0) + 1, LEVEL_NAMES.length));
  const [month, setMonth] = useState(goal?.by ? Number(goal.by.slice(5, 7)) - 1 : -1);
  const [year, setYear] = useState(goal?.by ? Number(goal.by.slice(0, 4)) : -1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const run = (action: () => Promise<void>, then: () => void) => {
    setSaving(true);
    setError(undefined);
    action().then(
      () => {
        setSaving(false);
        then();
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };
  const save = () => {
    if ((month < 0) !== (year < 0)) {
      setError('Pick a month and a year, or neither.');
      return;
    }
    const by = month < 0 ? null : endOf(year, month);
    run(() => setGoal(skillId, rank, by), () => onSaved({ rank, by }));
  };

  return (
    <div style={styles.form} role="group" aria-label="Your goal">
      <p style={styles.question}>Which level do you want to reach?</p>
      <div style={styles.levels}>
        {LEVEL_NAMES.map((name, i) =>
          i + 1 > (current ?? 0) ? (
            <button key={name} className="comic-lift" style={rank === i + 1 ? { ...styles.level, ...styles.levelPicked } : styles.level} aria-pressed={rank === i + 1} onClick={() => setRank(i + 1)}>
              {name}
            </button>
          ) : null,
        )}
      </div>
      <p style={styles.question} id={`goal-by-${skillId}`}>
        By when? <span style={styles.optional}>Optional</span>
      </p>
      <div style={styles.when} aria-labelledby={`goal-by-${skillId}`}>
        <select style={styles.select} aria-label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          <option value={-1}>Month</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i} disabled={year === today.getFullYear() && i < today.getMonth()}>
              {name}
            </option>
          ))}
        </select>
        <select style={styles.select} aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          <option value={-1}>Year</option>
          {Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => today.getFullYear() + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {error && <AtlasError message={error} />}
      <div style={styles.buttons}>
        <button className="comic-lift" style={styles.primary} disabled={saving} onClick={save}>
          Save goal
        </button>
        {goal && (
          <button className="comic-lift" style={styles.secondary} disabled={saving} onClick={() => run(() => clearGoal(skillId), () => onSaved(null))}>
            Clear goal
          </button>
        )}
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
  question: {
    margin: 0,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  optional: {
    fontFamily: 'inherit',
    fontSize: 14,
    letterSpacing: 0,
    color: blue,
  },
  levels: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  level: {
    padding: '4px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  levelPicked: {
    background: blue,
    color: ivory,
  },
  when: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  select: {
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
