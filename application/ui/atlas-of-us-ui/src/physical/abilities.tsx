import { useEffect, useState, type CSSProperties } from 'react';
import { CATEGORIES, EXTENTS, getAbilities, rateAbility, unrateAbility, type Ability, type Basis } from './api';
import { Scale } from './measurement_card';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';
import { Thinking } from '../shared_components/thinking';

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

//the user's abilities, the capacities that make things easier or harder to learn, with where they stand on each, what
//that comes from, the tests that measure it, and a way to rate themselves on the ones no test covers
export default function Abilities({ onMeasure }: { onMeasure: (measurement: string) => void }) {
  const [abilities, setAbilities] = useState<Ability[]>();
  const [error, setError] = useState<string>();

  const load = () => getAbilities().then(setAbilities, (e) => setError(e instanceof Error ? e.message : String(e)));
  useEffect(() => {
    load();
  }, []);

  if (error) return <AtlasError message={error} />;
  if (!abilities) return <Thinking label="Weighing it all up" />;
  const placed = abilities.filter((a) => a.value !== null).length;
  return (
    <>
      <section style={styles.intro} className="comic-panel comic-pop">
        <h2 style={styles.heading}>What you have to work with</h2>
        <p style={styles.text}>
          Abilities are what make some things easier or harder to learn: strength, eyesight, quick reactions, memory.
          Where you stand on each comes from your measurements and the tests you take, or from your own rating where
          nothing measures it yet, and any impairment you've noted holds back the abilities it touches. Skills show
          which abilities they take, so you can see how yours fit.
        </p>
        <p style={styles.text}>
          {placed ? `You have a place on ${placed} of ${abilities.length}.` : "You don't have a place on any yet. Take a test or rate yourself to start."}
        </p>
      </section>

      {CATEGORIES.map((c) => {
        const group = abilities.filter((a) => a.category === c.id);
        return (
          !!group.length && (
            <section key={c.id} style={styles.group}>
              <h2 style={styles.groupHeading} className="comic-title">
                {c.label}
              </h2>
              <div style={styles.grid}>
                {group.map((a) => (
                  <AbilityCard key={a.id} ability={a} onMeasure={onMeasure} onChanged={load} />
                ))}
              </div>
            </section>
          )
        );
      })}

      <p style={styles.how}>
        Only you can see where you stand. The abilities and their examples are from O*NET, by the U.S. Department of
        Labor (CC BY 4.0).
      </p>
    </>
  );
}

//one ability: what it is, where the user stands and why, the tests that measure it, and their own rating
function AbilityCard({ ability, onMeasure, onChanged }: { ability: Ability; onMeasure: (measurement: string) => void; onChanged: () => void }) {
  const { id, name, description, examples, value, confidence, basis, rating, measurements } = ability;
  const [picked, setPicked] = useState<number | null>(rating);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const measured = measurements.some((m) => m.counted);

  const save = (anchor: number | null) => {
    setSaving(true);
    setError(undefined);
    (anchor === null ? unrateAbility(id) : rateAbility(id, anchor)).then(
      () => {
        setSaving(false);
        onChanged();
      },
      (e) => {
        setSaving(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return (
    <article style={styles.card}>
      <h3 style={styles.name}>{name}</h3>
      <p style={styles.description}>{description}</p>

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

      {!measurements.length && <p style={styles.soon}>A test for this is coming soon. Until then, rate yourself.</p>}
      {!!measurements.length && (
        <div style={styles.tests}>
          {measurements.map((m) => (
            <button key={m.id} className="comic-lift" style={styles.test} onClick={() => onMeasure(m.id)}>
              {m.test && m.test !== 'home' ? `Take the ${m.name.toLowerCase()} test` : `${m.counted ? 'Update' : 'Measure'} your ${m.name.toLowerCase()}`}
            </button>
          ))}
        </div>
      )}

      {examples.length === 3 && (
        <Disclosure label={rating === null ? 'Rate yourself' : 'Change your rating'}>
          <fieldset style={styles.rating}>
            <legend style={styles.question}>Which is the hardest of these you could do?</legend>
            {[...examples.map((e, i) => ({ anchor: i + 1, label: e })), { anchor: 0, label: 'None of these' }].map((o) => (
              <label key={o.anchor} style={styles.option}>
                <input type="radio" name={`rating-${id}`} checked={picked === o.anchor} onChange={() => setPicked(o.anchor)} />
                {o.label}
              </label>
            ))}
            {measured && <p style={styles.small}>Your test results count over your own rating.</p>}
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
        </Disclosure>
      )}
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  intro: {
    maxWidth: 1100,
    margin: '0 auto 36px',
    padding: '22px 26px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-cinnamon)',
    '--tilt': '0.3deg',
  } as CSSProperties,
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  group: {
    maxWidth: 1100,
    margin: '0 auto 36px',
  },
  groupHeading: {
    margin: '0 0 14px',
    fontSize: 'clamp(30px, 5vw, 42px)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 20,
    alignItems: 'start',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '16px 18px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  description: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.4,
  },
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
  soon: {
    alignSelf: 'flex-start',
    margin: 0,
    padding: '2px 10px',
    background: 'var(--pale-cinnamon)',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 10,
    fontSize: 14,
  },
  tests: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  test: {
    padding: '2px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    font: 'inherit',
    fontSize: 14,
    textAlign: 'left',
    cursor: 'pointer',
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
  },
  how: {
    maxWidth: 1100,
    margin: '0 auto 16px',
    fontSize: 15,
    lineHeight: 1.5,
  },
};
