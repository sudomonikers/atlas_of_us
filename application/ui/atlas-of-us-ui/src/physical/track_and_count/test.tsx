import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { LEAD } from '../tracking/items';
import { Pursuit } from '../tracking/test';
import { BEEPS, TRACK_COUNT_PATH } from './items';

//a short beep, high or low, at a time on the audio clock
function beep(audio: AudioContext, at: number, high: boolean) {
  const tone = audio.createOscillator();
  const gain = audio.createGain();
  tone.frequency.value = high ? 1100 : 500;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.25, at + 0.01);
  gain.gain.setValueAtTime(0.25, at + 0.14);
  gain.gain.linearRampToValueAtTime(0, at + 0.16);
  tone.connect(gain).connect(audio.destination);
  tone.start(at);
  tone.stop(at + 0.2);
}

//time sharing: keep the pointer on a drifting dot while counting the high beeps. Half the score is the tracking, half
//the count
export function TrackAndCount({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'running' | 'counting' | 'done'>('ready');
  const [said, setSaid] = useState('');
  const audio = useRef<AudioContext | null>(null);
  const tracked = useRef(0);
  useEffect(() => () => void audio.current?.close(), []);

  const ear = () => {
    audio.current ??= new AudioContext();
    return audio.current;
  };
  const sample = (high: boolean) => {
    const a = ear();
    beep(a, a.currentTime + 0.05, high);
  };
  const start = () => {
    const a = ear();
    for (const b of BEEPS) beep(a, a.currentTime + LEAD + b.at, b.high);
  };
  const highs = BEEPS.filter((b) => b.high).length;

  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          This one asks you to do two things at once for {clock(TIMED.trackCount.seconds)}. Keep the pointer – or your
          finger – on the dot as it drifts around, and at the same time count the <strong>high</strong> beeps in your
          head while ignoring the low ones. Make sure your sound is on. When the time's up I'll ask how many high beeps
          you heard. Half your score is how well you stayed on the dot and half is how close your count is, so try not
          to let either one slip.
        </p>
      }
    >
      {phase === 'ready' && (
        <div style={{ ...testStyles.arena, flexDirection: 'column', gap: 10, cursor: 'default' }}>
          <div style={styles.row}>
            <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => sample(true)}>
              Hear a high beep
            </button>
            <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => sample(false)}>
              Hear a low beep
            </button>
          </div>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => { ear(); countIn(() => setPhase('running')); }}>
            Start
          </button>
        </div>
      )}
      {phase === 'running' && (
        <Pursuit
          path={TRACK_COUNT_PATH}
          seconds={TIMED.trackCount.seconds}
          onStart={start}
          onFinish={(share) => {
            tracked.current = share;
            setPhase('counting');
          }}
        />
      )}
      {phase === 'counting' && (
        <form
          style={styles.row}
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(said);
            if (said.trim() === '' || !Number.isFinite(n)) return;
            const counted = Math.max(0, 100 - (100 * Math.abs(n - highs)) / highs);
            const onDot = Math.round(tracked.current);
            const score = Math.round((tracked.current + counted) / 2);
            const off = Math.abs(n - highs);
            setPhase('done');
            onDone(score, {
              how: `Your score is the average of two halves out of 100: how much of the time you stayed on the dot, and how close your count was, losing ${Math.round(100 / highs)} points for each beep it was off. (${onDot} + ${Math.round(counted)}) / 2 = ${score}.`,
              parts: [
                { label: 'The dot', note: `You were on it ${onDot}% of the time: ${onDot} points` },
                {
                  label: 'The count',
                  right: off === 0,
                  note: `You counted ${n} high beeps and there were ${highs}${off ? `, ${off} off` : ''}: ${Math.round(counted)} points`,
                },
              ],
            });
          }}
        >
          <label style={testStyles.text} htmlFor="track-count">How many high beeps?</label>
          <input id="track-count" style={testStyles.input} inputMode="numeric" autoFocus value={said} onChange={(e) => setSaid(e.target.value.replace(/\D/g, ''))} />
          <button type="submit" className="comic-lift" style={testStyles.primary}>That's it</button>
        </form>
      )}
      {phase === 'done' && (
        <div style={testStyles.arena}>
          <span style={testStyles.prompt}>Done</span>
        </div>
      )}
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
};
