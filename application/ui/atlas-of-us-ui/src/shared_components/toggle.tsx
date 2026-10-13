import type { CSSProperties } from 'react';

const gunmetal = 'var(--gunmetal-black)';

interface ToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string; //shown beside the switch
  disabled?: boolean;
}

//a hand-drawn on/off switch: a wobbly track whose knob slides across and fills it when on
export function Toggle({ on, onChange, label, disabled }: ToggleProps) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} style={styles.toggle} onClick={() => onChange(!on)}>
      <span style={{ ...styles.track, ...(on ? styles.trackOn : {}) }}>
        <span style={{ ...styles.knob, ...(on ? styles.knobOn : {}) }} />
      </span>
      {label}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  //reset so only the switch and its label show
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: 0,
    background: 'none',
    border: 'none',
    color: gunmetal,
    fontFamily: 'var(--font-comic)',
    fontSize: 22,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  track: {
    position: 'relative',
    width: 56,
    height: 30,
    flex: 'none',
    background: 'var(--ivory-white)',
    border: `3px solid ${gunmetal}`,
    borderRadius: '16px 12px 18px 11px / 12px 18px 11px 16px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    boxSizing: 'border-box',
    transition: 'background 150ms ease-out',
  },
  trackOn: {
    background: 'var(--air-force-blue)',
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    background: 'var(--brown-red)',
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    boxSizing: 'border-box',
    transition: 'translate 220ms var(--bounce)',
  },
  knobOn: {
    translate: '26px 0',
  },
};
