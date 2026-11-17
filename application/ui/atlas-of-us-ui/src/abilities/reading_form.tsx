import { useCallback, useState, type CSSProperties } from 'react';
import { addReading, fromToes, today, TOES, type Measurement, type Recorded } from './api';
import { Countdown, Stopwatch } from './home_timer';
import { AtlasError } from '../shared_components/atlas-error';
import { DatePicker, type DateMessages } from '../shared_components/date-picker';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { useSave } from '../shared_components/use_save';

const MEASURED_MESSAGES: DateMessages = {
  future: "That's still to come. Pick the day you measured it.",
  tooEarly: (year) => `That's a long time ago. Try a date after ${year}.`,
};

interface ReadingFormProps {
  measurement: Measurement;
  onSaved: (recorded: Recorded) => void;
  onCancel: () => void;
  cancel?: string; //what the button that leaves without saving says
}

//VO2 max from how far someone ran in 12 minutes, in meters, by Cooper's formula
const cooper = (meters: number) => Math.round(((meters - 504.9) / 44.73) * 10) / 10;

//works a VO2 max reading out from a 12 minute run, for anyone without a watch that estimates it
function TwelveMinuteRun({ onWorkedOut }: { onWorkedOut: (vo2: number) => void }) {
  const [distance, setDistance] = useState('');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const work = (typed: string, per: 'km' | 'mi') => {
    const value = Number(typed);
    if (typed && Number.isFinite(value) && value > 0) onWorkedOut(cooper(value * (per === 'km' ? 1000 : 1609.34)));
  };
  return (
    <div style={styles.helper}>
      <label style={styles.helperLabel} htmlFor="twelve-minute-run">
        No watch? Run as far as you can in 12 minutes on flat ground, and put in how far you got.
      </label>
      <div style={styles.row}>
        <input
          id="twelve-minute-run"
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={distance}
          onChange={(e) => {
            setDistance(e.target.value);
            work(e.target.value, unit);
          }}
        />
        <select
          style={styles.input}
          aria-label="Distance unit"
          value={unit}
          onChange={(e) => {
            const per = e.target.value as 'km' | 'mi';
            setUnit(per);
            work(distance, per);
          }}
        >
          <option value="km">km</option>
          <option value="mi">miles</option>
        </select>
      </div>
    </div>
  );
}

//a one-rep max from a weight lifted for reps, by Epley's formula, in kilograms to the nearest half
const KG_PER_LB = 0.45359237;
const oneRepMax = (weight: number, reps: number) => Math.round(weight * (reps > 1 ? 1 + reps / 30 : 1) * 2) / 2;

//works a one-rep max out from a weight in kilograms or pounds and how many reps it was lifted for, for anyone who hasn't
//tested a true max or lifts in pounds
function RepMax({ onWorkedOut }: { onWorkedOut: (kg: number) => void }) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [reps, setReps] = useState('1');
  const work = (w: string, u: 'kg' | 'lb', r: string) => {
    const kg = Number(w) * (u === 'lb' ? KG_PER_LB : 1);
    const n = Math.round(Number(r));
    if (w && kg > 0 && n >= 1 && n <= 12) onWorkedOut(oneRepMax(kg, n));
  };
  return (
    <div style={styles.helper}>
      <label style={styles.helperLabel} htmlFor="rep-max-weight">
        Lift in pounds, or only know a weight you did for a few reps? Put it in here and I'll work out your one-rep max.
      </label>
      <div style={styles.row}>
        <input
          id="rep-max-weight"
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            work(e.target.value, unit, reps);
          }}
        />
        <select
          style={styles.input}
          aria-label="Weight unit"
          value={unit}
          onChange={(e) => {
            const u = e.target.value as 'kg' | 'lb';
            setUnit(u);
            work(weight, u, reps);
          }}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
        <span>for</span>
        <input
          style={{ ...styles.input, width: 60 }}
          type="number"
          inputMode="numeric"
          min={1}
          max={12}
          aria-label="Reps"
          value={reps}
          onChange={(e) => {
            setReps(e.target.value);
            work(weight, unit, e.target.value);
          }}
        />
        <span>{reps === '1' ? 'rep' : 'reps'}</span>
      </div>
    </div>
  );
}

//records a reading of a measurement and the day it was taken. A timed home test has a stopwatch that fills in the
//reading, and a home test of how many in a set time a countdown
export function ReadingForm({ measurement, onSaved, onCancel, cancel = 'Cancel' }: ReadingFormProps) {
  const [typed, setTyped] = useState('');
  const [past, setPast] = useState(true); //for sit and reach, whether they reached past their toes or stopped short
  const [date, setDate] = useState(today);
  const { saving, error, setError, run } = useSave();
  const { id, min, max, unit, test, timer } = measurement;
  const shown = unit === '20/x' ? '20/' : '';

  const stopped = useCallback((seconds: number) => setTyped(String(seconds)), []);
  const toes = fromToes(measurement.name);
  const save = () => {
    const entered = Number(typed);
    const value = toes ? TOES + (past ? entered : -entered) : entered;
    if (!typed || !Number.isFinite(entered) || (toes && entered < 0)) {
      setError('Enter a number.');
      return;
    }
    if (value < min || value > max) {
      setError(toes ? `That's further than the comparison goes. Enter up to ${past ? max - TOES : TOES - min} cm.` : `Enter a number between ${min} and ${max}.`);
      return;
    }
    if (!date) {
      setError('Pick the day you measured it.');
      return;
    }
    run(addReading(id, value, date), onSaved);
  };

  return (
    <form
      style={styles.form}
      aria-label={`A new ${measurement.name.toLowerCase()} reading`}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {test === 'home' && unit === 's' && <Stopwatch onStop={stopped} limit={max} />}
      {test === 'home' && timer !== null && <Countdown seconds={timer} />}
      {measurement.name === 'VO2 Max' && <TwelveMinuteRun onWorkedOut={(vo2) => setTyped(String(vo2))} />}
      {measurement.name === 'Squat One-Rep Max' && <RepMax onWorkedOut={(kg) => setTyped(String(kg))} />}
      <label style={styles.question} htmlFor={`reading-${id}`}>
        {toes ? 'How far did your fingertips reach?' : 'What did you measure?'}
      </label>
      {toes && (
        <div style={styles.row} role="group" aria-label="Past or short of your toes">
          {[true, false].map((p) => (
            <button key={String(p)} type="button" className="comic-lift" style={past === p ? styles.primary : styles.secondary} aria-pressed={past === p} onClick={() => setPast(p)}>
              {p ? 'Past my toes' : 'Short of my toes'}
            </button>
          ))}
        </div>
      )}
      <div style={styles.row}>
        {shown && <span>{shown}</span>}
        <input
          id={`reading-${id}`}
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={toes ? 0 : min}
          max={toes ? undefined : max}
          step="any"
          required
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        {!shown && <span>{unit}</span>}
      </div>
      <p style={styles.question} id={`reading-on-${id}`}>
        When?
      </p>
      <DatePicker value={date} onChange={setDate} labelId={`reading-on-${id}`} messages={MEASURED_MESSAGES} />
      {error && <AtlasError message={error} />}
      <div style={styles.buttons}>
        <button type="submit" className="comic-lift" style={styles.primary} disabled={saving}>
          Save
        </button>
        <button type="button" className="comic-lift" style={styles.secondary} disabled={saving} onClick={onCancel}>
          {cancel}
        </button>
      </div>
    </form>
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
  helper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '8px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  helperLabel: {
    fontSize: 14,
    lineHeight: 1.4,
  },
  question: {
    margin: 0,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
  },
  input: {
    width: 110,
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
