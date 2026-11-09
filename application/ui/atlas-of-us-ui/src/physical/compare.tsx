import { useState, type CSSProperties } from 'react';
import { getMeasurements, setMe, type Ability, type Measurements, type NormSex } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Dots } from '../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//the groups a person can be compared with
const COMPARE: { sex: NormSex | null; label: string }[] = [
  { sex: 'female', label: 'Women' },
  { sex: 'male', label: 'Men' },
  { sex: null, label: 'Everyone' },
];

//who the user's measurements are compared with: people of their sex and age, or everyone their age. A change moves
//every percentile, and so where they stand on their abilities: saving it gives back the abilities, and the measurements
//are loaded again. The choice shows as soon as it's made, while that happens
export default function Compare({ data, onChange }: { data: Measurements; onChange: (data: Measurements, abilities: Ability[]) => void }) {
  const [saving, setSaving] = useState<NormSex | null>(); //the choice being saved, undefined when none is
  const [error, setError] = useState<string>();
  const current = saving === undefined ? data.norm_sex : saving;

  const compare = (sex: NormSex | null) => {
    setSaving(sex);
    setError(undefined);
    setMe({ norm_sex: sex })
      .then((abilities) => getMeasurements().then((measurements) => onChange(measurements, abilities)))
      .catch((e) => setError(failure(e)))
      .finally(() => setSaving(undefined));
  };

  return (
    <>
      <div style={styles.choices} role="group" aria-label="Compare me with">
        {COMPARE.map((c) => (
          <button
            key={c.label}
            className="comic-lift"
            style={current === c.sex ? { ...styles.choice, ...styles.picked } : styles.choice}
            aria-pressed={current === c.sex}
            disabled={saving !== undefined}
            onClick={() => current !== c.sex && compare(c.sex)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {saving !== undefined && (
        <p style={styles.how} aria-live="polite">
          Comparing you with {COMPARE.find((c) => c.sex === saving)?.label.toLowerCase()}
          <Dots />
        </p>
      )}
      {error && <AtlasError message={error} />}
      <p style={styles.how}>
        This is only used to pick who you're compared with, and only you can see your measurements. Most comparisons come
        from NHANES, the US national health survey run by the CDC, so they describe people in the United States.
      </p>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  choices: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  choice: {
    padding: '4px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
  },
  picked: {
    background: brownRed,
    color: ivory,
  },
  how: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
  },
};
