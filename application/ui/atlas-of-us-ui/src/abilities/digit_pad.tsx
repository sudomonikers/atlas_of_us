import { type CSSProperties, useEffect } from 'react';
import { comic, gunmetal } from '../shared_components/palette';
import { DIGITS } from './spoken_digits';
import { testStyles } from './test_kit';

//the three digits typed so far and the keys to type them, which the keyboard's digits and Backspace press too while
//it's asking
export function DigitPad({ typed, asking, onPress }: { typed: number[]; asking: boolean; onPress: (d: number | 'back') => void }) {
  useEffect(() => {
    if (!asking) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        return onPress('back');
      }
      const d = Number(e.key);
      if (DIGITS.includes(d)) onPress(d);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <>
      <div style={styles.typed} aria-label="Your digits">
        {[0, 1, 2].map((i) => (
          <span key={i} style={styles.slot}>
            {typed[i] ?? ''}
          </span>
        ))}
      </div>
      <div style={styles.pad} role="group" aria-label="Digits">
        {DIGITS.map((d) => (
          <button key={d} type="button" className="comic-lift" style={styles.key} onClick={() => onPress(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="comic-lift" style={{ ...styles.key, ...styles.back }} onClick={() => onPress('back')} aria-label="Delete">
          Delete
        </button>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  typed: {
    display: 'flex',
    gap: 10,
  },
  slot: {
    width: 44,
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 10,
    fontFamily: comic,
    fontSize: 30,
  },
  pad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 64px)',
    gap: 8,
  },
  key: {
    ...testStyles.choice,
    padding: '10px 0',
    fontFamily: comic,
    fontSize: 22,
  },
  back: {
    fontFamily: 'inherit',
    fontSize: 14,
  },
};
