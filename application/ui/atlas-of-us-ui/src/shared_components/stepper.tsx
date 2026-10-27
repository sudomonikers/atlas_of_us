import type { CSSProperties, ReactNode } from 'react';

const gunmetal = 'var(--gunmetal-black)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface StepperProps {
  steps: string[]; //each step's name, in order
  current: number; //the index of the step showing
  onBack?: () => void; //shows Back on every step after the first
  busy?: boolean; //disables Back while the step is working
  actions: ReactNode; //the step's own buttons, after Back
  children: ReactNode; //the step itself
}

//one step of several at a time: how far along it is, the step, and Back beside the step's own buttons
export function Stepper({ steps, current, onBack, busy, actions, children }: StepperProps) {
  return (
    <div style={styles.stepper}>
      <div style={styles.progress} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current + 1} aria-valuetext={steps[current]}>
        {steps.map((name, i) => (
          <span key={name} style={{ ...styles.dot, ...(i <= current ? styles.dotDone : {}) }} title={name} />
        ))}
      </div>
      {children}
      <div style={styles.footer}>
        {onBack && current > 0 && (
          <button className="comic-lift" style={styles.back} disabled={busy} onClick={onBack}>
            Back
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  stepper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  progress: {
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 22,
    height: 10,
    background: 'var(--ivory-white)',
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
  },
  dotDone: {
    background: 'var(--brown-red)',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
  },
  back: {
    marginRight: 'auto',
    padding: '4px 14px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 16,
  },
};
