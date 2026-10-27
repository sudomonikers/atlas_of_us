import type { CSSProperties } from 'react';

//something's levels as rising steps, filled up to the one reached
export function LevelSteps({ rank, total }: { rank: number; total: number }) {
  return (
    <span style={styles.steps} role="img" aria-label={`Level ${rank} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ ...styles.step, height: 6 + i * 3, ...(i < rank ? styles.reached : {}) }} />
      ))}
    </span>
  );
}

const styles: Record<string, CSSProperties> = {
  steps: {
    display: 'inline-flex',
    alignItems: 'flex-end',
    gap: 3,
  },
  step: {
    width: 8,
    background: 'var(--ivory-white)',
    border: '2px solid var(--gunmetal-black)',
    borderRadius: 3,
  },
  reached: {
    background: 'var(--brown-red)',
  },
};
