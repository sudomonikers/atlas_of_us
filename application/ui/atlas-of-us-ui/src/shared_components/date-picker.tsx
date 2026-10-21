import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';

interface DatePickerProps {
  value: string; //YYYY-MM-DD, or '' until a whole, real date is entered
  onChange: (value: string) => void;
  labelId: string; //id of the visible label
}

//a MM/DD/YYYY box that can be typed in, with a calendar to pick from instead. Stands in for
//<input type="date">, whose picker is drawn by the browser and can't be styled
export function DatePicker({ value, onChange, labelId }: DatePickerProps) {
  const [text, setText] = useState(() => (value ? toTyped(fromIso(value)) : ''));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useDismiss(rootRef, open, () => setOpen(false));

  const problem = dateProblem(text);
  //stops the form submitting, and is what the browser says when it does
  useEffect(() => inputRef.current?.setCustomValidity(problem), [problem]);

  const type = (raw: string) => {
    const next = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? toTyped(fromIso(raw)) : formatTyped(raw); //autofill can hand us YYYY-MM-DD
    setText(next);
    onChange(dateProblem(next) ? '' : toIso(parseTyped(next)!));
  };
  const pick = (date: Date) => {
    setText(toTyped(date));
    onChange(toIso(date));
    setOpen(false);
    inputRef.current?.focus();
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} style={styles.dateRow}>
      <input
        ref={inputRef}
        style={styles.dateText}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="MM/DD/YYYY"
        aria-labelledby={labelId}
        aria-invalid={!!problem && text.length === 10}
        required
        value={text}
        onChange={(e) => type(e.target.value)}
      />
      <button
        ref={triggerRef}
        type="button"
        className="comic-lift"
        style={styles.calendarButton}
        aria-label="Pick from a calendar"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarIcon />
      </button>
      {open && <Calendar selected={parseTyped(text)} onPick={pick} onClose={close} />}
      {/* only once it's all typed, so it doesn't nag halfway through */}
      {problem && text.length === 10 && <span style={styles.dateError}>{problem}</span>}
    </div>
  );
}

//a month of days to pick from, with month and year dropdowns since birthdays are usually decades back.
//Keyboard: arrows move a day/week, Home/End the start/end of the week, Page Up/Down a month
//(+ Shift for a year), Enter picks, Escape closes
function Calendar({ selected, onPick, onClose }: { selected?: Date; onPick: (date: Date) => void; onClose: () => void }) {
  const today = startOfToday();
  const [cursor, setCursor] = useState(() => clampDate(selected ?? new Date(today.getFullYear() - 25, today.getMonth(), 1)));
  const focusCursor = useRef(true); //move focus to the cursor's day after it changes, unless a dropdown moved it
  const gridRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!focusCursor.current) return;
    gridRef.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }, [cursor]);

  const move = (date: Date, focus = true) => {
    focusCursor.current = focus;
    setCursor(clampDate(date));
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  //always 6 weeks, so the popover doesn't change height between months
  const days = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - first.getDay() + i));
  const years = Array.from({ length: today.getFullYear() - MIN_YEAR + 1 }, (_, i) => today.getFullYear() - i);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = cursor.getDate();
    const keys: Record<string, () => Date> = {
      ArrowLeft: () => new Date(year, month, d - 1),
      ArrowRight: () => new Date(year, month, d + 1),
      ArrowUp: () => new Date(year, month, d - 7),
      ArrowDown: () => new Date(year, month, d + 7),
      Home: () => new Date(year, month, d - cursor.getDay()),
      End: () => new Date(year, month, d + 6 - cursor.getDay()),
      PageUp: () => addMonths(cursor, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(cursor, e.shiftKey ? 12 : 1),
    };
    if (!keys[e.key]) return;
    e.preventDefault();
    move(keys[e.key]());
  };

  return (
    <div
      role="dialog"
      aria-label="Pick a date"
      style={styles.calendar}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        onClose();
      }}
    >
      <div style={styles.calendarHeader}>
        <button
          type="button"
          style={styles.monthStep}
          aria-label="Previous month"
          disabled={year === MIN_YEAR && month === 0}
          onClick={() => move(addMonths(cursor, -1), false)}
        >
          ‹
        </button>
        <select style={styles.calendarSelect} aria-label="Month" value={month} onChange={(e) => move(setMonth(cursor, year, +e.target.value), false)}>
          {MONTHS.map((name, i) => (
            <option key={name} value={i} disabled={year === today.getFullYear() && i > today.getMonth()}>
              {name}
            </option>
          ))}
        </select>
        <select style={styles.calendarSelect} aria-label="Year" value={year} onChange={(e) => move(setMonth(cursor, +e.target.value, month), false)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={styles.monthStep}
          aria-label="Next month"
          disabled={year === today.getFullYear() && month === today.getMonth()}
          onClick={() => move(addMonths(cursor, 1), false)}
        >
          ›
        </button>
      </div>

      <div style={styles.weekdays} aria-hidden>
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div ref={gridRef} role="group" aria-label={`${MONTHS[month]} ${year}`} id={id} style={styles.days} onKeyDown={onKeyDown}>
        {days.map((day) => {
          const inMonth = day.getMonth() === month;
          const isCursor = sameDay(day, cursor);
          const isSelected = !!selected && sameDay(day, selected);
          const disabled = day > today || day.getFullYear() < MIN_YEAR;
          return (
            <button
              key={day.getTime()}
              type="button"
              tabIndex={isCursor ? 0 : -1} //one tab stop for the whole grid; arrows move within it
              disabled={disabled}
              aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={isSelected}
              aria-current={sameDay(day, today) ? 'date' : undefined}
              style={{
                ...styles.day,
                ...(inMonth ? undefined : styles.dayOutside),
                ...(isCursor ? styles.dayCursor : undefined),
                ...(sameDay(day, today) ? styles.dayToday : undefined),
                ...(isSelected ? styles.daySelected : undefined),
                ...(disabled ? styles.dayDisabled : undefined),
              }}
              onPointerEnter={() => inMonth && !disabled && !isCursor && move(day, false)} //highlight follows the pointer
              onClick={() => onPick(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth="3" />
    </svg>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MIN_YEAR = 1900;

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toTyped = (date: Date) => `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
//local midnight, so dates never slip a day across time zones the way new Date('YYYY-MM-DD') (UTC) can
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const sameDay = (a: Date, b: Date) => toIso(a) === toIso(b);
const clampDate = (date: Date) => {
  const today = startOfToday();
  return date > today ? today : date.getFullYear() < MIN_YEAR ? new Date(MIN_YEAR, 0, 1) : date;
};
//the same day in another month, or that month's last day if it's shorter (Jan 31 → Feb 28)
const setMonth = (date: Date, year: number, month: number) =>
  new Date(year, month, Math.min(date.getDate(), new Date(year, month + 1, 0).getDate()));
const addMonths = (date: Date, n: number) => setMonth(date, date.getFullYear(), date.getMonth() + n);

//adds the slashes while typing. A slash typed after one digit pads it, so 4/ means April
function formatTyped(raw: string) {
  const parts = raw.split('/');
  const digits = parts
    .map((part, i) => {
      const d = part.replace(/\D/g, '');
      return i < 2 && i < parts.length - 1 && d.length === 1 ? `0${d}` : d;
    })
    .join('')
    .slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

//MM/DD/YYYY to a date, or undefined unless it's a whole, real date (no 02/30)
function parseTyped(text: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return undefined;
  const [month, day, year] = [+match[1], +match[2], +match[3]];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}

//what's wrong with a typed date, or '' if nothing. Empty is left to required
function dateProblem(text: string) {
  if (!text) return '';
  const date = parseTyped(text);
  if (!date) return "That's not a date I recognize. Try MM/DD/YYYY, like 04/27/1994.";
  if (date > startOfToday()) return "Born in the future? Bold. Try a date that's already happened.";
  if (date.getFullYear() < MIN_YEAR) return `Your birthday has to be after ${MIN_YEAR}.`;
  return '';
}

//calls onDismiss for a pointer down anywhere outside ref while open
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) dismiss.current();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [ref, open]);
}

/* ---------------------------------------------------------------------------------------------
 * styles
 * ------------------------------------------------------------------------------------------- */

const gunmetal = 'var(--gunmetal-black)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const rounded = '14px 8px 16px 10px / 8px 16px 10px 14px';

const box: CSSProperties = {
  background: ivory,
  color: gunmetal,
  border: `3px solid ${gunmetal}`,
  borderRadius: rounded,
  outlineColor: brownRed,
};

const styles: Record<string, CSSProperties> = {
  dateRow: {
    position: 'relative',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateText: {
    ...box,
    flex: 1,
    minWidth: 0,
    padding: '8px 12px',
    fontSize: 20,
    fontVariantNumeric: 'tabular-nums',
  },
  calendarButton: {
    ...box,
    display: 'grid',
    placeItems: 'center',
    padding: '0 10px',
    background: 'var(--pale-blue)',
    boxShadow: `2px 3px 0 ${gunmetal}`,
  },
  dateError: {
    flexBasis: '100%',
    fontSize: 15,
    color: brownRed,
  },
  calendar: {
    ...box,
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    zIndex: 20,
    width: 'min(320px, calc(100vw - 48px))',
    padding: 10,
    background: '#fff',
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  calendarSelect: {
    ...box,
    flex: 1,
    minWidth: 0,
    padding: '4px 6px',
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  monthStep: {
    ...box,
    width: 34,
    height: 34,
    flexShrink: 0,
    padding: 0,
    fontSize: 24,
    lineHeight: 1,
    cursor: 'pointer',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: comic,
    fontSize: 16,
    letterSpacing: 0.5,
    color: 'var(--air-force-blue)',
  },
  days: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 3,
  },
  day: {
    aspectRatio: '1',
    padding: 0,
    background: 'none',
    color: gunmetal,
    border: '2px solid transparent',
    borderRadius: '50% 45% 50% 40% / 45% 50% 40% 50%',
    outlineColor: brownRed,
    fontSize: 17,
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
  },
  dayOutside: {
    opacity: 0.4,
  },
  dayCursor: {
    background: 'var(--pale-blue)',
  },
  dayToday: {
    borderColor: 'var(--air-force-blue)',
  },
  dayDisabled: {
    opacity: 0.2,
    cursor: 'default',
  },
  daySelected: {
    background: brownRed,
    borderColor: gunmetal,
    color: ivory,
  },
};
