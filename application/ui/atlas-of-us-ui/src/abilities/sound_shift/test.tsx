import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { blue, brownRed, comic } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Speaker } from '../speaker';
import { Frame } from '../test_frame';
import { chance, testStyles } from '../test_kit';
import {
  SHIFT_EASIER,
  SHIFT_HARDER,
  SHIFT_LARGEST,
  SHIFT_PRACTICE,
  SHIFT_PRACTICE_WAYS,
  SHIFT_SMALLEST,
  SHIFT_START,
  SHIFT_TRIES,
  SHIFT_WAYS,
} from './items';

// Sound localization: telling which way a sound moved, from how much sooner it reaches one ear than the other, the
// main way people tell left from right. With headphones on, two bursts of noise play, the first a little to one side
// and the second a little to the other, and they say whether it moved left or right. The shift gets smaller as they
// get it right and bigger as they miss, and the score is the typical shift over the last tries, in microseconds

//how many of the last tries the score is worked out from
const SCORED_TRIES = 16;
//each burst: how long it lasts and how long it eases in and out, the quiet between the two and before each try, and
//how long a practice answer is shown, in seconds
const BURST = 0.3;
const EASE = 0.02;
const GAP = 0.25;
const BEFORE = 0.5;
const SHOWN = 1.6;
//the pitches the noise is made of, in Hz: low ones, where the timing between the ears is heard best
const LOW = 200;
const HIGH = 1400;
//how loud the noise plays, as the RMS of its samples
const LEVEL = 0.06;

type Way = 'left' | 'right';
type Phase = 'phones' | 'practice' | 'between' | 'timed' | 'done';

//a burst of noise from somewhere between the ears: how much sooner it reaches the right ear than the left, in
//microseconds, so to the right when above 0, or in one ear only. It's a sum of tones at random phases, each delayed
//exactly in each ear, so any delay, however small, is exact
function burst(audio: AudioContext, sooner: number, only?: Way): AudioBuffer {
  const rate = audio.sampleRate;
  const length = Math.round(BURST * rate);
  const buffer = audio.createBuffer(2, length, rate);
  const [left, right] = [buffer.getChannelData(0), buffer.getChannelData(1)];
  const delays = [sooner / 2e6, -sooner / 2e6]; //left ear later, right ear sooner, in seconds
  for (let f = LOW; f <= HIGH; f += 1 / BURST) {
    const step = (2 * Math.PI * f) / rate;
    const [c, s] = [Math.cos(step), Math.sin(step)];
    const phase = chance() * 2 * Math.PI;
    [left, right].forEach((channel, ear) => {
      const start = phase - 2 * Math.PI * f * delays[ear];
      let [x, y] = [Math.cos(start), Math.sin(start)];
      for (let i = 0; i < length; i++) {
        channel[i] += y;
        [x, y] = [x * c - y * s, x * s + y * c];
      }
    });
  }
  const rms = Math.sqrt(left.reduce((sum, v) => sum + v * v, 0) / length);
  const ease = Math.round(EASE * rate);
  for (let i = 0; i < length; i++) {
    const edge = Math.min(i, length - 1 - i);
    const gain = (LEVEL / rms) * (edge < ease ? 0.5 - 0.5 * Math.cos((Math.PI * edge) / ease) : 1);
    left[i] = only === 'right' ? 0 : left[i] * gain;
    right[i] = only === 'left' ? 0 : right[i] * gain;
  }
  return buffer;
}

export function SoundShift({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('phones');
  const [at, setAt] = useState(0);
  const [told, setTold] = useState<{ right: boolean; way: Way } | null>(null); //after a practice answer
  const [playing, setPlaying] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const timers = useRef<number[]>([]);
  const answering = useRef(false);
  const shift = useRef(SHIFT_START);
  const stair = useRef({ missed: false, run: 0 });
  const tried = useRef<{ shift: number; answer: Way; right: boolean }[]>([]);

  const later = (ms: number, then: () => void) => timers.current.push(window.setTimeout(then, ms));
  const hush = () => {
    sources.current.forEach((s) => s.stop());
    sources.current = [];
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  };
  useEffect(
    () => () => {
      sources.current.forEach((s) => s.stop());
      timers.current.forEach(clearTimeout);
      if (audio.current?.state !== 'closed') void audio.current?.close();
    },
    [],
  );

  //bursts, one after another with a quiet moment between them, booming the speaker until the last has finished
  const play = (bursts: (a: AudioContext) => AudioBuffer[]) => {
    audio.current ??= new AudioContext();
    const a = audio.current;
    void a.resume();
    const all = bursts(a);
    const start = a.currentTime + 0.05;
    all.forEach((buffer, i) => {
      const source = a.createBufferSource();
      source.buffer = buffer;
      source.connect(a.destination);
      source.start(start + i * (BURST + GAP));
      sources.current.push(source);
    });
    setPlaying(true);
    later((all.length * (BURST + GAP) + 0.1) * 1000, () => setPlaying(false));
  };

  const oneEar = (way: Way) => {
    hush();
    play((a) => [burst(a, 0, way)]);
  };

  //a try, after a quiet moment: the sound a little to one side, then as far to the other, moving the way given
  const move = (way: Way, by: number) => {
    answering.current = true;
    const toward = way === 'right' ? 1 : -1;
    later(BEFORE * 1000, () => play((a) => [burst(a, (-toward * by) / 2), burst(a, (toward * by) / 2)]));
  };

  const begin = (practice: boolean) => {
    hush();
    setAt(0);
    if (practice) {
      setPhase('practice');
      return move(SHIFT_PRACTICE_WAYS[0], SHIFT_PRACTICE);
    }
    shift.current = SHIFT_START;
    stair.current = { missed: false, run: 0 };
    tried.current = [];
    setPhase('timed');
    move(SHIFT_WAYS[0], SHIFT_START);
  };

  const finish = () => {
    setPhase('done');
    const last = tried.current.slice(-SCORED_TRIES);
    const score = Math.round(Math.exp(last.reduce((sum, t) => sum + Math.log(t.shift), 0) / last.length) * 10) / 10;
    const from = SHIFT_TRIES - last.length;
    onDone(score, {
      how: `The shift got smaller as you heard which way the sound moved and bigger when you missed, until it settled at about the smallest you can hear. It's measured as the change in how much sooner the sound reaches one ear than the other, in microseconds. The first ${from} tries find that level, and your score is the average shift over the last ${last.length}, so lower is better: ${score}.`,
      parts: tried.current.map((t, i) => ({
        label: `${i + 1}`,
        right: t.right,
        note: `Shifted ${Math.round(t.shift * 10) / 10} microseconds to the ${SHIFT_WAYS[i]}, you said ${t.answer}${i >= from ? ', counted in your score' : ', finding your level'}`,
      })),
    });
  };

  const answer = (way: Way) => {
    if (!answering.current) return;
    answering.current = false;
    if (phase === 'practice') {
      const moved = SHIFT_PRACTICE_WAYS[at];
      setTold({ right: way === moved, way: moved });
      return later(SHOWN * 1000, () => {
        setTold(null);
        if (at + 1 >= SHIFT_PRACTICE_WAYS.length) return setPhase('between');
        setAt(at + 1);
        move(SHIFT_PRACTICE_WAYS[at + 1], SHIFT_PRACTICE);
      });
    }
    const right = way === SHIFT_WAYS[at];
    tried.current.push({ shift: shift.current, answer: way, right });
    const s = stair.current;
    let factor = 1;
    if (!right) {
      s.missed = true;
      s.run = 0;
      factor = SHIFT_EASIER;
    } else if (!s.missed || ++s.run >= 2) {
      s.run = 0;
      factor = SHIFT_HARDER;
    }
    shift.current = Math.min(SHIFT_LARGEST, Math.max(SHIFT_SMALLEST, shift.current * factor));
    if (at + 1 >= SHIFT_TRIES) return finish();
    setAt(at + 1);
    later(300, () => move(SHIFT_WAYS[at + 1], shift.current));
  };

  useEffect(() => {
    if (phase !== 'practice' && phase !== 'timed') return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        answer(e.key === 'ArrowLeft' ? 'left' : 'right');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          {phase === 'phones'
            ? "Put on headphones or earbuds in a quiet room. Play the sound in each ear to check they're the right way around, and set your volume so it's comfortable."
            : `You'll hear two short bursts of noise. Say whether the sound moved left or right between them, with the buttons or your arrow keys. It gets harder as you get them right, so expect plenty to be hard to hear – a best guess is fine. ${SHIFT_PRACTICE_WAYS.length} practice tries, then ${SHIFT_TRIES} that count.`}
        </p>
      }
    >
      {phase === 'phones' && (
        <div style={styles.stage}>
          <Speaker booming={playing} />
          <div style={styles.row}>
            <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => oneEar('left')}>
              Play in my left ear
            </button>
            <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => oneEar('right')}>
              Play in my right ear
            </button>
          </div>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => begin(true)}>
            They're the right way around
          </button>
        </div>
      )}
      {phase === 'between' && (
        <div style={styles.stage}>
          <Speaker booming={false} />
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => begin(false)}>
            Start: {SHIFT_TRIES} tries
          </button>
        </div>
      )}
      {asking && (
        <div style={styles.stage}>
          <Speaker booming={playing} style={styles.small} />
          <span style={styles.ask}>Which way did it move?</span>
          <div style={styles.row} role="group" aria-label="Which way">
            <button type="button" className="comic-lift" style={styles.way} onClick={() => answer('left')}>
              ◀ Left
            </button>
            <button type="button" className="comic-lift" style={styles.way} onClick={() => answer('right')}>
              Right ▶
            </button>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div style={{ ...testStyles.arena, minHeight: 300 }}>
          <span style={testStyles.prompt}>Done</span>
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && !told && `Practice ${at + 1} of ${SHIFT_PRACTICE_WAYS.length}`}
        {phase === 'practice' && told && (
          <span style={{ ...styles.verdict, color: told.right ? blue : brownRed }}>
            {told.right ? 'Right' : `It moved ${told.way}. If it sounded the other way, check your headphones are the right way around`}
          </span>
        )}
        {phase === 'between' && 'Practice done. Now the ones that count.'}
        {phase === 'timed' && `${at + 1} of ${SHIFT_TRIES}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  stage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  small: {
    width: 'min(100%, 200px)',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ask: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
  },
  way: {
    ...testStyles.choice,
    minWidth: 120,
    fontFamily: comic,
    fontSize: 22,
  },
  verdict: {
    fontFamily: comic,
    letterSpacing: 1,
  },
};
