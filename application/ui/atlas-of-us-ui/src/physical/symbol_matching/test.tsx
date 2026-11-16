import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { comic, gunmetal } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Phase, Starter } from '../starter';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountdown, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { SYMBOL_KEY, SYMBOL_PRACTICE, SYMBOL_RUN, SYMBOLS } from './items';

function Symbol({ index, size }: { index: number; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d={SYMBOLS[index]} fill="none" stroke={gunmetal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

//perceptual speed: press the digit that goes with each symbol, using the key, as many as you can in 90 seconds
export function SymbolMatching({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [note, setNote] = useState('');
  const right = useRef(0);
  const misses = useRef<{ at: number; pressed: number }[]>([]); //the ones that count that were wrong
  const finished = useRef(false);
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    const wrong = misses.current.length;
    onDone(right.current, {
      how: `One point for each symbol matched right in ${clock(TIMED.symbols.seconds)}: ${right.current}. Wrong ones don't take points away, they just use up time.`,
      right: right.current,
      wrong,
      parts: misses.current.map(({ at, pressed }) => ({ label: `${at + 1}`, right: false, note: `You pressed ${pressed}, it was ${SYMBOL_KEY[SYMBOL_RUN[at]]}` })),
    });
  };
  const left = useCountdown(TIMED.symbols.seconds, phase === 'timed', finish);
  const run = phase === 'practice' ? SYMBOL_PRACTICE : SYMBOL_RUN;

  const press = (digit: number) => {
    if (phase !== 'practice' && phase !== 'timed') return;
    const correct = SYMBOL_KEY[run[at]] === digit;
    if (phase === 'practice') {
      setNote(correct ? 'Right.' : `That one is ${SYMBOL_KEY[run[at]]}.`);
      if (at + 1 < run.length) setAt(at + 1);
      else {
        setAt(0);
        setPhase('between');
      }
      return;
    }
    if (correct) right.current += 1;
    else misses.current.push({ at, pressed: digit });
    if (at + 1 < run.length) setAt(at + 1);
    else finish();
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const digit = Number(e.key);
      if (digit >= 1 && digit <= 9) {
        e.preventDefault();
        press(digit);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          The key at the top pairs each of nine symbols with a digit. When a symbol appears in the middle, find it in
          the key and press its digit – on your keyboard or by tapping the buttons. You'll start with a few
          practice ones, where I'll tell you if you got each right. Then you have {clock(TIMED.symbols.seconds)} to
          match as many as you can, and only the right ones count, so go quickly but carefully. You'll soon start to
          remember some of the pairs, and that's fine.
        </p>
      }
    >
      <div style={styles.key} aria-label="The key">
        {SYMBOL_KEY.map((digit, i) => (
          <div key={i} style={styles.keyCell}>
            <Symbol index={i} size={26} />
            <span style={styles.keyDigit}>{digit}</span>
          </div>
        ))}
      </div>
      {asking ? (
        <>
          <div style={{ ...testStyles.arena, cursor: 'default' }}>
            <Symbol index={run[at]} size={90} />
          </div>
          <div style={styles.digits}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} type="button" className="comic-lift" style={styles.digit} onPointerDown={() => press(d)}>
                {d}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Starter phase={phase} label={`Start: ${clock(TIMED.symbols.seconds)}`} onStart={() => countIn(() => setPhase(phase === 'ready' ? 'practice' : 'timed'))} />
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice · ${note}`}
        {phase === 'between' && 'Practice done.'}
        {phase === 'timed' && `${clock(left)} left`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  key: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: 2,
    padding: 4,
    background: gunmetal,
    borderRadius: 8,
  },
  keyCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '4px 0',
    background: '#fff',
  },
  keyDigit: {
    fontFamily: comic,
    fontSize: 18,
  },
  digits: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: 4,
  },
  digit: {
    ...testStyles.choice,
    padding: '12px 0',
    fontFamily: comic,
    fontSize: 20,
  },
};
