import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { now, since, testStyles } from './test_kit';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//a short beep, higher for the start and the end
function beep(audio: AudioContext, high: boolean) {
  const tone = audio.createOscillator();
  const gain = audio.createGain();
  const at = audio.currentTime;
  tone.frequency.value = high ? 1100 : 660;
  gain.gain.setValueAtTime(0.3, at);
  gain.gain.linearRampToValueAtTime(0, at + (high ? 0.5 : 0.15));
  tone.connect(gain).connect(audio.destination);
  tone.start(at);
  tone.stop(at + 0.55);
}

//a stopwatch for a timed home test, which fills in the reading with the time when it's stopped
export function Stopwatch({ onStop }: { onStop: (seconds: number) => void }) {
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => setShown(since(started.current) / 1000), 100);
    return () => clearInterval(tick);
  }, [running]);

  const toggle = () => {
    if (running) {
      const seconds = Math.round(since(started.current) / 100) / 10;
      setRunning(false);
      setShown(seconds);
      onStop(seconds);
    } else {
      started.current = now();
      setShown(0);
      setRunning(true);
    }
  };

  return (
    <div style={styles.timer}>
      <span style={styles.time} aria-live="off">{shown.toFixed(1)} s</span>
      <button type="button" className="comic-lift" style={running ? styles.stop : testStyles.primary} onClick={toggle}>
        {running ? 'Stop' : shown ? 'Start again' : 'Start the stopwatch'}
      </button>
    </div>
  );
}

//how long to get ready before a countdown starts, in seconds
const GET_READY = 3;

//a countdown for a home test of how many in a set time: three seconds to get ready, a beep to start and one to stop
export function Countdown({ seconds }: { seconds: number }) {
  const [phase, setPhase] = useState<'ready' | 'counting' | 'over'>('ready');
  const [left, setLeft] = useState(seconds + GET_READY);
  const audio = useRef<AudioContext | null>(null);
  const beeped = useRef(new Set<number>());
  useEffect(() => () => void audio.current?.close(), []);

  useEffect(() => {
    if (phase !== 'counting') return;
    const start = now();
    const tick = window.setInterval(() => {
      const remaining = seconds + GET_READY - since(start) / 1000;
      setLeft(Math.max(0, remaining));
      const whole = Math.ceil(remaining);
      if (audio.current && !beeped.current.has(whole) && (whole === seconds || (whole <= 0) || (whole > seconds && whole <= seconds + GET_READY))) {
        beeped.current.add(whole);
        beep(audio.current, whole === seconds || whole <= 0);
      }
      if (remaining <= 0) {
        clearInterval(tick);
        navigator.vibrate?.(400);
        setPhase('over');
      }
    }, 50);
    return () => clearInterval(tick);
  }, [phase, seconds]);

  const start = () => {
    audio.current ??= new AudioContext();
    beeped.current.clear();
    setLeft(seconds + GET_READY);
    setPhase('counting');
  };

  const ready = left > seconds;
  return (
    <div style={styles.timer}>
      <span style={styles.time} aria-live="polite">
        {phase === 'over' ? "Time's up" : phase === 'counting' ? (ready ? `Get ready: ${Math.ceil(left - seconds)}` : `${Math.ceil(left)} s`) : `${seconds} s`}
      </span>
      {phase !== 'counting' && (
        <button type="button" className="comic-lift" style={testStyles.primary} onClick={start}>
          {phase === 'over' ? 'Start again' : 'Start the countdown'}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  timer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  time: {
    minWidth: 110,
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  stop: {
    ...testStyles.primary,
    background: gunmetal,
    color: ivory,
    border: `2px solid ${brownRed}`,
  },
};
