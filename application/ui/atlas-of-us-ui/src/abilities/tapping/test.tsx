import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { brownRed, comic } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { useFrames } from '../use_frames';

//wrist-finger speed: tap as fast as you can for 10 seconds, three times. The score is the best try. The time left
//counts down from the first tap
export function Tapping({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'waiting' | 'tapping' | 'rest' | 'done'>('waiting');
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState<number>(TIMED.tapping.seconds);
  useFrames(phase === 'tapping', (seconds) => setLeft(Math.max(0, TIMED.tapping.seconds - seconds)));
  const [tries, setTries] = useState<number[]>([]);
  const count = useRef(0);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    if (phase === 'rest' || phase === 'done') return;
    if (phase === 'waiting') {
      count.current = 0;
      setPhase('tapping');
      timer.current = window.setTimeout(() => {
        const done = [...tries, count.current];
        setTries(done);
        if (done.length < TIMED.tapping.tries) return setPhase('rest');
        setPhase('done');
        const best = Math.max(...done);
        onDone(best, {
          how: `You had ${done.length} tries of ${TIMED.tapping.seconds} seconds each, and your score is the best one: ${best} taps.`,
          parts: done.map((n, i) => ({ label: `Try ${i + 1}`, note: `${n} taps${n === best ? ', your best' : ''}` })),
        });
      }, TIMED.tapping.seconds * 1000);
    }
    count.current += 1;
    setTaps(count.current);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) tap();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Tap the box or the space bar as fast as you can with one finger – the one you'd point with. The clock starts
          at your first tap and runs {TIMED.tapping.seconds} seconds. You get {TIMED.tapping.tries} tries, and your best
          one counts.
        </p>
      }
    >
      <button type="button" style={testStyles.arena} onPointerDown={tap} aria-label="The tapping box" disabled={phase === 'rest' || phase === 'done'}>
        <span style={styles.big}>
          {phase === 'waiting' ? 'Tap to start' : phase === 'tapping' ? taps : phase === 'rest' ? `${taps} taps` : 'Done'}
        </span>
        <span style={styles.clock}>{phase === 'tapping' ? `${left.toFixed(1)} s left` : `${TIMED.tapping.seconds}.0 s`}</span>
      </button>
      {phase === 'rest' && (
        <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => { setTaps(0); setLeft(TIMED.tapping.seconds); setPhase('waiting'); }}>
          Ready for try {tries.length + 1}
        </button>
      )}
      <p style={testStyles.status} aria-live="polite">
        {tries.length ? `Tries: ${tries.join(', ')}` : ''}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  big: {
    fontFamily: comic,
    fontSize: 40,
    letterSpacing: 1,
  },
  //the time left, in the corner of the tapping box
  clock: {
    position: 'absolute',
    top: 10,
    right: 14,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
    fontVariantNumeric: 'tabular-nums',
  },
};
