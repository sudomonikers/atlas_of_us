import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { addReading, comparedWith, deleteReading, standing, today, withUnit, type Ability, type Measurement, type Reading, type Recorded } from './api';
import { ReadingForm } from './reading_form';
import { Scale } from './scale';
import { SelfTest } from './self_tests';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//a date as the user reads dates, such as "Oct 30, 2026"
const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface MeasurementCardProps {
  measurement: Measurement;
  onChanged: (readings: Reading[], abilities: Ability[]) => void; //with the user's abilities, which a reading can move
  stage: HTMLElement | null; //where a test the app runs takes place, front and centre
  onTesting: (testing: boolean) => void; //whether one is running
}

//a measurement, once Atlas has said what it is: the user's latest reading and where it sits among people like them, a
//form for a new reading (or the test that takes one, for a test the app runs, and the steps for one done at home), and
//their earlier readings. A reading from the eye chart can also be typed in, from an optician's test. A test the app runs
//takes the stage while it runs
export function MeasurementCard({ measurement, onChanged, stage, onTesting }: MeasurementCardProps) {
  const [adding, setAdding] = useState<'test' | 'form' | null>(null);
  const [history, setHistory] = useState(false);
  const [error, setError] = useState<string>();
  const { id, unit, better, test, protocol, source, ages, readings } = measurement;
  const latest = readings[0];
  const inApp = !!test && test !== 'home';
  const typedToo = test === 'eye_chart';
  const testing = adding === 'test' && inApp;

  useEffect(() => {
    onTesting(testing);
    return () => onTesting(false);
  }, [testing, onTesting]);

  const saved = ({ reading, abilities }: Recorded) => {
    setAdding(null);
    //newest first, by the day it was measured, and the new one ahead of others from the same day
    onChanged([reading, ...readings].sort((a, b) => b.measured_on.localeCompare(a.measured_on)), abilities);
  };
  //a test the app ran is recorded as taken today
  const tested = (value: number) => {
    setError(undefined);
    addReading(id, value, today()).then(saved, (e) => {
      setAdding(null);
      setError(failure(e));
    });
  };
  const remove = (id: string) => {
    setError(undefined);
    deleteReading(id).then(
      (abilities) => onChanged(readings.filter((r) => r.id !== id), abilities),
      (e) => setError(failure(e)),
    );
  };

  return (
    <article style={styles.card}>
      {test === 'home' && !!protocol.length && (
        <Disclosure label="How to do it at home">
          <ol style={styles.steps}>
            {protocol.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Disclosure>
      )}

      {latest ? (
        <div style={styles.latest}>
          <span style={styles.value}>{withUnit(latest.value, unit)}</span>
          <span style={styles.date}>on {shortDate(latest.measured_on)}</span>
          {latest.percentile !== null && latest.compared_with ? (
            <>
              <Scale percentile={latest.percentile} better={better} />
              <p style={styles.standing}>
                {standing(latest.percentile, better)} {comparedWith(latest.compared_with)}.
              </p>
            </>
          ) : (
            <p style={styles.note}>
              {ages
                ? `There's nothing to compare it with at the age you measured it. The norms cover ages ${ages.from} ${ages.to === null ? 'and over' : `to ${ages.to}`}.`
                : "There's nothing to compare it with yet."}
            </p>
          )}
        </div>
      ) : (
        <p style={styles.note}>Not measured yet.</p>
      )}

      {adding === 'test' && test && test !== 'home' ? (
        stage && createPortal(<SelfTest test={test} measurement={id} onDone={tested} onSaved={saved} onCancel={() => setAdding(null)} />, stage)
      ) : adding ? (
        <ReadingForm measurement={measurement} onSaved={saved} onCancel={() => setAdding(null)} />
      ) : (
        <div style={styles.buttons}>
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding(inApp ? 'test' : 'form')}>
            {inApp ? (latest ? 'Take it again' : 'Take the test') : latest ? 'Add a new reading' : 'Add a reading'}
          </button>
          {typedToo && (
            <button className="comic-lift" style={styles.secondary} onClick={() => setAdding('form')}>
              Type one in
            </button>
          )}
          {readings.length > 1 && (
            <button className="comic-lift" style={styles.secondary} aria-expanded={history} onClick={() => setHistory(!history)}>
              {history ? 'Hide earlier readings' : `Earlier readings (${readings.length - 1})`}
            </button>
          )}
          {readings.length === 1 && (
            <button className="comic-lift" style={styles.secondary} onClick={() => remove(latest.id)}>
              Remove it
            </button>
          )}
        </div>
      )}
      {error && <AtlasError message={error} />}

      {history && readings.length > 1 && (
        <ul style={styles.history}>
          {readings.map((r) => (
            <li key={r.id} style={styles.reading}>
              <span>
                <strong>{withUnit(r.value, unit)}</strong> on {shortDate(r.measured_on)}
                {r.percentile !== null && better !== 'neither' && ` · ${standing(r.percentile, better).toLowerCase().replace(/ of$/, '')}`}
              </span>
              <button className="comic-lift" style={styles.remove} aria-label={`Remove the reading from ${shortDate(r.measured_on)}`} onClick={() => remove(r.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {source && <p style={styles.source}>Compared with: {source}</p>}
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
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
  latest: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 10px',
    marginTop: 4,
  },
  value: {
    fontFamily: comic,
    fontSize: 32,
    letterSpacing: 1,
    color: blue,
  },
  date: {
    fontSize: 14,
  },
  standing: {
    flexBasis: '100%',
    margin: 0,
    fontSize: 15,
  },
  note: {
    flexBasis: '100%',
    margin: 0,
    fontSize: 14,
    fontStyle: 'italic',
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
  history: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
  },
  reading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 6,
    borderBottom: `1px dashed ${gunmetal}`,
  },
  steps: {
    margin: '4px 0 0',
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 14,
    lineHeight: 1.4,
  },
  source: {
    margin: '4px 0 0',
    fontSize: 12,
    lineHeight: 1.4,
  },
  remove: {
    padding: '2px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  },
};
