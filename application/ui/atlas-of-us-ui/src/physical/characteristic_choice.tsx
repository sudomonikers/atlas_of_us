import { useState, type CSSProperties, type ReactNode } from 'react';
import { getMeasurements, setMe, type Ability, type Characteristic, type Me, type Measurements } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Dots } from '../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//a few choices to pick one of, for one of the user's own physical attributes. The pick shows as soon as it's made,
//while it's saved
function Choose<T>({ choices, current, label, save, children }: {
  choices: { value: T; label: string }[];
  current: T;
  label: string; //what the group of choices is, for screen readers
  save: (value: T) => Promise<unknown>;
  children?: ReactNode; //a note under the choices
}) {
  const [saving, setSaving] = useState<{ value: T }>(); //the choice being saved, when one is
  const [error, setError] = useState<string>();
  const shown = saving ? saving.value : current;

  const pick = (value: T) => {
    setSaving({ value });
    setError(undefined);
    save(value)
      .catch((e) => setError(failure(e)))
      .finally(() => setSaving(undefined));
  };

  return (
    <>
      <div style={styles.choices} role="group" aria-label={label}>
        {choices.map((c) => (
          <button
            key={c.label}
            className="comic-lift"
            style={shown === c.value ? { ...styles.choice, ...styles.picked } : styles.choice}
            aria-pressed={shown === c.value}
            disabled={!!saving}
            onClick={() => shown !== c.value && pick(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {saving && (
        <p style={styles.how} aria-live="polite">
          Saving
          <Dots />
        </p>
      )}
      {error && <AtlasError message={error} />}
      {children}
    </>
  );
}

//one of the user's characteristics, such as their sex, which hand they use or their blood type, picked from its
//choices. Their sex decides who their readings are compared with, so it can be left unsaid to be compared with
//everyone, and a change gives back their abilities, worked out again, and the measurements are loaded again
export function CharacteristicChoice({ characteristic, onMe, onMeasurements }: {
  characteristic: Characteristic;
  onMe: (me: Me) => void;
  onMeasurements: (data: Measurements, abilities: Ability[]) => void;
}) {
  const { id, name, choices, value } = characteristic;
  const sex = name === 'Sex';
  const save = (picked: string | null) =>
    setMe({ characteristics: { [id]: picked } }).then(({ me, abilities }) => {
      onMe(me);
      return abilities && getMeasurements().then((data) => onMeasurements(data, abilities));
    });
  return (
    <Choose
      label={name}
      current={value}
      choices={[...choices.map((c) => ({ value: c as string | null, label: c })), ...(sex ? [{ value: null, label: 'Compare me with everyone' }] : [])]}
      save={save}
    >
      {sex && (
        <p style={styles.how}>
          This decides who you're compared with. Most comparisons come from NHANES, the US national health survey run by the
          CDC, so they describe people in the United States.
        </p>
      )}
    </Choose>
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
