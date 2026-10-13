import type { CSSProperties } from 'react';

interface ProgressMeterProps {
  done: number;
  total: number;
  label: string; //shown after the count, e.g. "complete" for "3 / 12 complete"
}

//a hand-drawn progress bar with a count beside it, filling the width of its container
export function ProgressMeter({ done, total, label }: ProgressMeterProps) {
  return (
    <div style={styles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div style={styles.track} className="comic-meter">
        <div className="comic-meter-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <span style={styles.label}>
        {done} / {total} {label}
      </span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  meter: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  track: {
    flex: 1,
  },
  label: {
    fontFamily: 'var(--font-comic)',
    fontSize: 26,
    letterSpacing: 1,
    whiteSpace: 'nowrap',
  },
};
