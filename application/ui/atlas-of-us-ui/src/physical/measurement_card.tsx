import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { addReading, deleteReading, inYourHands, shownReading, standing, standingBriefly, today, type Ability, type Measurement, type Reading, type Recorded } from './api';
import { WATCHED } from './pose_tests';
import { ReadingForm } from './reading_form';
import { Scale } from './scale';
import { type Scored, ScoredView } from './scored';
import { SelfTest } from './self_tests';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//a home test watched through the camera, loaded with the pose model only when one starts
const CameraTest = lazy(() => import('./camera_test'));

//a date as the user reads dates, such as "Oct 30, 2026"
const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface MeasurementCardProps {
  measurement: Measurement;
  hand: string | null; //the hand they use most, left or right, to name in the steps
  onChanged: (readings: Reading[], abilities: Ability[]) => void; //with the user's abilities, which a reading can move
  stage: HTMLElement | null; //where a test the app runs takes place, front and center
  onTesting: (testing: boolean) => void; //whether one is running
  onSkip: () => void; //moves on without recording one
}

//a measurement, once Atlas has said what it is: the user's latest reading and where it sits among people like them, a
//form for a new reading (or the test that takes one, for a test the app runs, and the steps for one done at home), and
//their earlier readings. With nothing recorded yet the form is already out, or the test ready to start, and they can
//skip it. A reading from the eye chart can also be typed in, from an optician's test. A home test the camera can watch
//offers to time or count it for them, and one only the camera can watch starts it. A test the app runs, or the camera
//watches, takes the stage while it runs
export function MeasurementCard({ measurement, hand, onChanged, stage, onTesting, onSkip }: MeasurementCardProps) {
  const [adding, setAdding] = useState<'test' | 'form' | 'camera' | null>(null);
  const [history, setHistory] = useState(false);
  const [error, setError] = useState<string>();
  const [scored, setScored] = useState<Scored>(); //how the test just taken was scored, until it's taken again
  const { id, better, test, protocol, source, ages, readings } = measurement;
  const latest = readings[0];
  const inApp = !!test && test !== 'home';
  const typedToo = test === 'eye_chart' || test === 'hearing'; //a reading from an optician's or a hearing test can be typed in too
  const onlyCamera = test === 'camera';
  const watchable = WATCHED[measurement.name];
  const testing = (adding === 'test' && inApp) || adding === 'camera';
  const asking = !latest && !inApp && adding === null; //nothing recorded yet, so the form is already out

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
  const tested = (value: number, how?: Scored) => {
    setError(undefined);
    addReading(id, value, today()).then((r) => {
      setScored(how);
      saved(r);
    }, (e) => {
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
        <Disclosure label="How to do it at home" defaultOpen={!latest}>
          <ol style={styles.steps}>
            {protocol.map((step) => (
              <li key={step}>{inYourHands(step, hand)}</li>
            ))}
          </ol>
        </Disclosure>
      )}

      {latest ? (
        <div style={styles.latest}>
          <span style={styles.value}>{shownReading(latest.value, measurement)}</span>
          <span style={styles.date}>on {shortDate(latest.measured_on)}</span>
          {latest.percentile !== null && latest.compared_with ? (
            <>
              <Scale percentile={latest.percentile} better={better} />
              <p style={styles.standing}>
                {standing(latest.percentile, better, latest.compared_with)}
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
      ) : null}

      {scored && latest && adding === null && <ScoredView scored={scored} />}

      {watchable && !onlyCamera && adding !== 'camera' && (
        <div style={styles.camera}>
          <p style={styles.cameraText}>
            Doing this on your own? Your camera can {{ s: 'time it', count: 'count it', cm: 'measure it', mm: 'measure it' }[watchable.records]} for you and tell you out loud how you did.
          </p>
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding('camera')}>
            Use my camera
          </button>
        </div>
      )}

      {adding === 'camera' ? (
        stage &&
        createPortal(
          <Suspense fallback={null}>
            <CameraTest measurement={measurement} hand={hand} onDone={tested} onCancel={() => setAdding(null)} />
          </Suspense>,
          stage,
        )
      ) : adding === 'test' && test && test !== 'home' && test !== 'camera' ? (
        stage && createPortal(<SelfTest test={test} measurement={id} onDone={tested} onSaved={saved} onCancel={() => setAdding(null)} />, stage)
      ) : adding || asking ? (
        <ReadingForm measurement={measurement} onSaved={saved} onCancel={asking ? onSkip : () => setAdding(null)} cancel={asking ? 'Skip' : 'Cancel'} />
      ) : (
        <div style={styles.buttons}>
          <button className="comic-lift" style={styles.primary} onClick={() => {
              setScored(undefined);
              setAdding(onlyCamera ? 'camera' : inApp ? 'test' : 'form');
            }}>
            {inApp ? (latest ? 'Take it again' : 'Take the test') : latest ? 'Add a new reading' : 'Add a reading'}
          </button>
          {!latest && (
            <button className="comic-lift" style={styles.secondary} onClick={onSkip}>
              Skip
            </button>
          )}
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
                <strong>{shownReading(r.value, measurement)}</strong> on {shortDate(r.measured_on)}
                {r.percentile !== null && better !== 'neither' && ` · ${standingBriefly(r.percentile, better)}`}
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
  camera: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    padding: '8px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  cameraText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.4,
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
