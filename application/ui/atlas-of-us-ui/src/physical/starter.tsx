import { testStyles } from './test_kit';

export type Phase = 'ready' | 'practice' | 'between' | 'timed' | 'done';

//the button that starts the practice or the part that counts, or says it's done
export function Starter({ phase, label, onStart }: { phase: Phase; label: string; onStart: () => void }) {
  return (
    <div style={testStyles.arena}>
      {phase === 'done' ? (
        <span style={testStyles.prompt}>Done</span>
      ) : (
        <button type="button" className="comic-lift" style={testStyles.primary} onClick={onStart}>
          {phase === 'ready' ? 'Start the practice' : label}
        </button>
      )}
    </div>
  );
}
