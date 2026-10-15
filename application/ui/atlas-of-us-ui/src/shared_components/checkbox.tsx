import type { CSSProperties } from 'react';

const gunmetal = 'var(--gunmetal-black)';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; //shown beside the box
  disabled?: boolean;
}

//a hand-drawn checkbox: a wobbly inked box that gets a scrawled tick when checked
export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <button role="checkbox" aria-checked={checked} disabled={disabled} style={styles.checkbox} onClick={() => onChange(!checked)}>
      <span style={styles.box}>
        <svg viewBox="0 0 24 24" style={{ ...styles.tick, ...(checked ? styles.tickOn : {}) }} aria-hidden>
          <path d="M4 13 C6 15 8 17 10 20 C13 13 17 7 21 3" fill="none" stroke="var(--brown-red)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  //reset so only the box and its label show
  checkbox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: 0,
    background: 'none',
    border: 'none',
    color: gunmetal,
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'left',
    cursor: 'pointer',
  },
  box: {
    width: 28,
    height: 28,
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--ivory-white)',
    border: `3px solid ${gunmetal}`,
    borderRadius: '9px 6px 10px 5px / 6px 10px 5px 9px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    boxSizing: 'border-box',
  },
  //the tick overshoots the box a little, like it was scribbled in a hurry
  tick: {
    width: 30,
    height: 30,
    marginTop: -6,
    marginRight: -6,
    scale: '0',
    transition: 'scale 220ms var(--bounce)',
  },
  tickOn: {
    scale: '1',
  },
};
