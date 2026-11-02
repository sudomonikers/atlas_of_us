import { useState, type CSSProperties } from 'react';
import { comparedWith, deleteReading, standing, withUnit, type Measurement, type Reading } from './api';
import { ReadingForm } from './reading_form';
import { AtlasError } from '../shared_components/atlas-error';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//a date as the user reads dates, such as "Oct 30, 2026"
const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

interface MeasurementCardProps {
  measurement: Measurement;
  onChanged: (readings: Reading[]) => void;
}

//a measurement: what it is, the user's latest reading and where it sits among people like them, a form for a new
//reading, and their earlier readings
export function MeasurementCard({ measurement, onChanged }: MeasurementCardProps) {
  const [adding, setAdding] = useState(false);
  const [history, setHistory] = useState(false);
  const [error, setError] = useState<string>();
  const { name, unit, better, description, abilities, ages, readings } = measurement;
  const latest = readings[0];

  const saved = (reading: Reading) => {
    setAdding(false);
    //newest first, by the day it was measured
    onChanged([...readings, reading].sort((a, b) => b.measured_on.localeCompare(a.measured_on)));
  };
  const remove = (id: string) => {
    setError(undefined);
    deleteReading(id).then(
      () => onChanged(readings.filter((r) => r.id !== id)),
      (e) => setError(e instanceof Error ? e.message : String(e)),
    );
  };

  return (
    <article style={styles.card}>
      <h3 style={styles.name}>{name}</h3>
      <p style={styles.description}>{description}</p>
      {!!abilities.length && (
        <div style={styles.chips}>
          Shows {abilities.map((a) => <span key={a} className="comic-chip">{a}</span>)}
        </div>
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

      {adding ? (
        <ReadingForm measurement={measurement} onSaved={saved} onCancel={() => setAdding(false)} />
      ) : (
        <div style={styles.buttons}>
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding(true)}>
            {latest ? 'Add a new reading' : 'Add a reading'}
          </button>
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
    </article>
  );
}

//a hand-drawn line from 0 to 100 with a marker where the reading sits. Where lower is better the line runs the other
//way, so further right is always better, and where neither is better it's only where they sit
function Scale({ percentile, better }: { percentile: number; better: Measurement['better'] }) {
  const at = better === 'lower' ? 100 - percentile : percentile;
  const [left, right] = better === 'neither' ? ['Lower', 'Higher'] : ['Worse', 'Better'];
  return (
    <div style={styles.scale} role="img" aria-label={`${Math.round(at)} out of 100`}>
      <div style={styles.track}>
        <span style={styles.middle} />
        <span style={{ ...styles.marker, left: `${Math.min(Math.max(at, 2), 98)}%` }} className="comic-pop" />
      </div>
      <div style={styles.ends}>
        <span>{left}</span>
        <span>Typical</span>
        <span>{right}</span>
      </div>
    </div>
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
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
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
  scale: {
    flexBasis: '100%',
    marginTop: 6,
  },
  track: {
    position: 'relative',
    height: 14,
    background: `linear-gradient(90deg, ${ivory}, var(--pale-blue))`,
    border: `2px solid ${gunmetal}`,
    borderRadius: '10px 6px 9px 7px / 7px 9px 6px 10px',
  },
  middle: {
    position: 'absolute',
    left: '50%',
    top: -4,
    bottom: -4,
    borderLeft: `2px dashed ${gunmetal}`,
  },
  marker: {
    position: 'absolute',
    top: '50%',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    background: brownRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50%',
    boxSizing: 'border-box',
  },
  ends: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 4,
    fontSize: 12,
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
