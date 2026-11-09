import { useState, type CSSProperties } from 'react';
import { EXTENTS, rateAbility, unrateAbility, type Ability, type Basis } from './api';
import { Scale } from './measurement_card';
import { AtlasError } from '../shared_components/atlas-error';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//how sure the user's place on an ability is, in words
function sureness(confidence: number) {
  if (confidence < 0.35) return 'a rough guess';
  if (confidence < 0.6) return 'a fair idea';
  return 'a good idea';
}

//what a place on an ability comes from, in words
function because(b: Basis) {
  if (b.kind === 'rating') return 'your own rating';
  if (b.kind === 'impairment') return `held back by your ${EXTENTS.find((e) => e.value === b.extent)?.label.toLowerCase() ?? ''} impairment in ${b.name.toLowerCase()}`;
  return b.standing === null ? `your ${b.name.toLowerCase()}` : `your ${b.name.toLowerCase()}, better than ${Math.round(b.standing)}% of people`;
}

//an ability no test covers yet: where the user stands and why, and a rating of themselves on its examples, from what
//takes a little of it to what takes a lot. Atlas says what the ability is
export default function Rating({ ability, onChanged }: { ability: Ability; onChanged: (abilities: Ability[]) => void }) {
  const { id, examples, value, confidence, basis, rating } = ability;
  const [picked, setPicked] = useState<number | null>(rating);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = (anchor: number | null) => {
    setSaving(true);
    setError(undefined);
    (anchor === null ? unrateAbility(id) : rateAbility(id, anchor)).then(
      (abilities) => {
        setSaving(false);
        onChanged(abilities);
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return (
    <>
      {value !== null && confidence !== null ? (
        <>
          <Scale percentile={value * 100} better="higher" />
          <p style={styles.standing}>
            About {Math.round(value * 100)} out of 100, where 50 is typical. This is {sureness(confidence)}, from{' '}
            {basis.map(because).join(', and ')}.
          </p>
        </>
      ) : (
        <p style={styles.note}>Nothing says where you stand yet.</p>
      )}

      {examples.length === 3 && (
        <fieldset style={styles.rating}>
          <legend style={styles.question}>Which is the hardest of these you could do?</legend>
          {[...examples.map((e, i) => ({ anchor: i + 1, label: e })), { anchor: 0, label: 'None of these' }].map((o) => (
            <label key={o.anchor} style={styles.option}>
              <input type="radio" name={`rating-${id}`} checked={picked === o.anchor} onChange={() => setPicked(o.anchor)} />
              {o.label}
            </label>
          ))}
          {error && <AtlasError message={error} />}
          <div style={styles.buttons}>
            <button type="button" className="comic-lift" style={styles.primary} disabled={saving || picked === null || picked === rating} onClick={() => save(picked)}>
              Save
            </button>
            {rating !== null && (
              <button type="button" className="comic-lift" style={styles.secondary} disabled={saving} onClick={() => save(null)}>
                Take it back
              </button>
            )}
          </div>
        </fieldset>
      )}
      <p style={styles.small}>The abilities and their examples are from O*NET, by the U.S. Department of Labor (CC BY 4.0).</p>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  standing: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.4,
  },
  note: {
    margin: 0,
    fontSize: 14,
    fontStyle: 'italic',
  },
  small: {
    margin: 0,
    fontSize: 13,
  },
  rating: {
    margin: '4px 0 0',
    padding: 0,
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  question: {
    marginBottom: 4,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 15,
    lineHeight: 1.35,
    cursor: 'pointer',
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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
  },};
