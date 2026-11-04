import { useEffect, useState, type CSSProperties } from 'react';
import { GROUPS, getMeasurements, setMe, type Measurements as MeasurementList, type NormSex, type Reading } from './api';
import { MeasurementCard } from './measurement_card';
import { AtlasError } from '../shared_components/atlas-error';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the groups a person can be compared with
const COMPARE: { sex: NormSex | null; label: string }[] = [
  { sex: 'female', label: 'Women' },
  { sex: 'male', label: 'Men' },
  { sex: null, label: 'Everyone' },
];

//the user's measurements, each with where they sit among people of their sex and age, and who they're compared with.
//`focus` is a measurement to scroll to once they're loaded
export default function Measurements({ focus }: { focus?: string }) {
  const [data, setData] = useState<MeasurementList>();
  const [error, setError] = useState<string>();
  const [compareError, setCompareError] = useState<string>();

  const load = () => getMeasurements().then(setData, (e) => setError(e instanceof Error ? e.message : String(e)));
  useEffect(() => {
    load();
  }, []);

  //a change of comparison changes every percentile, so the measurements are loaded again
  const compare = (sex: NormSex | null) => {
    setCompareError(undefined);
    setMe({ norm_sex: sex }).then(load, (e) => setCompareError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    if (data && focus) document.getElementById(`measurement-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [data, focus]);
  const changed = (id: string, readings: Reading[]) =>
    setData((d) => d && { ...d, measurements: d.measurements.map((m) => (m.id === id ? { ...m, readings } : m)) });

  if (error) return <AtlasError message={error} />;
  if (!data) return <Thinking label="Getting out the tape measure" />;
  return (
    <>
      <section style={styles.compare} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Compare me with</h2>
        <p style={styles.text}>
          Bodies differ a lot between men and women, so you're compared with people of the same sex and age. This is only
          used to pick who you're compared with.
        </p>
        <div style={styles.choices} role="group" aria-label="Compare me with">
          {COMPARE.map((c) => (
            <button
              key={c.label}
              className="comic-lift"
              style={data.norm_sex === c.sex ? { ...styles.choice, ...styles.picked } : styles.choice}
              aria-pressed={data.norm_sex === c.sex}
              onClick={() => data.norm_sex !== c.sex && compare(c.sex)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {compareError && <AtlasError message={compareError} />}
      </section>

      {GROUPS.map((g) => {
        const measurements = data.measurements.filter((m) => m.group === g.id);
        return (
          !!measurements.length && (
            <section key={g.id} style={styles.group}>
              <h2 style={styles.groupHeading} className="comic-title">
                {g.label}
              </h2>
              <div style={styles.grid}>
                {measurements.map((m) => (
                  <MeasurementCard key={m.id} measurement={m} onChanged={(readings) => changed(m.id, readings)} />
                ))}
              </div>
            </section>
          )
        );
      })}
      {!data.measurements.length && <p style={styles.how}>There's nothing to measure yet.</p>}

      <p style={styles.how}>
        Only you can see your measurements. Most comparisons come from NHANES, the US national health survey run by the
        CDC, so they describe people in the United States. The tests you take yourself are compared with the studies each
        one names. What you record here also works out where you stand on your abilities.
      </p>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  compare: {
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
  how: {
    maxWidth: 1100,
    margin: '0 auto 16px',
    fontSize: 15,
    lineHeight: 1.5,
  },
};
