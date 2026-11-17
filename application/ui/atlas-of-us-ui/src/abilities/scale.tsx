import type { CSSProperties } from 'react';
import type { Measurement } from './api';
import { brownRed, gunmetal, ivory } from '../shared_components/palette';

//a hand-drawn line from 0 to 100 with a marker where the reading sits. Where lower is better the line runs the other
//way, so further right is always better, and where neither is better it's only where they sit
export function Scale({ percentile, better }: { percentile: number; better: Measurement['better'] }) {
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
};
