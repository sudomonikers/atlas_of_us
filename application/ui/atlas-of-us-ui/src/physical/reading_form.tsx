import { useState, type CSSProperties } from 'react';
import { addReading, today, type Measurement, type Recorded } from './api';
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
}

//records a reading of a measurement and the day it was taken. A timed home test has a stopwatch that fills in the
//reading, and a home test of how many in a set time a countdown
export function ReadingForm({ measurement, onSaved, onCancel }: ReadingFormProps) {
  const [typed, setTyped] = useState('');
  const [date, setDate] = useState(today);
  const { saving, error, setError, run } = useSave();
  const { id, min, max, unit, test, timer } = measurement;
  const shown = unit === '20/x' ? '20/' : '';

  const save = () => {
    const value = Number(typed);
    if (!typed || !Number.isFinite(value) || value < min || value > max) {
      setError(`Enter a number between ${min} and ${max}.`);
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
      {test === 'home' && unit === 's' && <Stopwatch onStop={(s) => setTyped(String(s))} />}
      {test === 'home' && timer !== null && <Countdown seconds={timer} />}
      <label style={styles.question} htmlFor={`reading-${id}`}>
        What did you measure?
      </label>
      <div style={styles.row}>
        {shown && <span>{shown}</span>}
        <input
          id={`reading-${id}`}
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
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
          Cancel
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
