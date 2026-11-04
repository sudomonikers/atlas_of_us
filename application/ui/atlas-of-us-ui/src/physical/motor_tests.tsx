import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { BEEPS, STEERING_TARGETS, TIMED, TIMINGS, TIMING_PRACTICE, TRACKING_PATH, TRACK_COUNT_PATH } from './puzzles';
import type { TestProps } from './self_tests';
import { Frame } from './test_frame';
import { blue, brownRed, clock, comic, gunmetal, ivory, now, since, testStyles } from './test_kit';

//calls onFrame with the seconds since it started, every frame while running
function useFrames(running: boolean, onFrame: (seconds: number) => void) {
  const frame = useRef(onFrame);
  useEffect(() => {
    frame.current = onFrame;
  });
  useEffect(() => {
    if (!running) return;
    const start = now();
    let id = requestAnimationFrame(function tick() {
      frame.current(since(start) / 1000);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);
}

// ---------------------------------------------------------------------------------------------------------------------
// Tapping
// ---------------------------------------------------------------------------------------------------------------------

//wrist-finger speed: tap as fast as you can for 10 seconds, three times. The score is the best try
export function Tapping({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'waiting' | 'tapping' | 'rest' | 'done'>('waiting');
  const [taps, setTaps] = useState(0);
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
        onDone(Math.max(...done));
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
          Tap the box, or the space bar, as fast as you can with one finger, the one you'd point with. The clock starts at
          your first tap and runs {TIMED.tapping.seconds} seconds. {TIMED.tapping.tries} tries, and your best counts.
        </p>
      }
    >
      <button type="button" style={testStyles.arena} onPointerDown={tap} aria-label="The tapping box" disabled={phase === 'rest' || phase === 'done'}>
        <span style={styles.big}>
          {phase === 'waiting' ? 'Tap to start' : phase === 'tapping' ? taps : phase === 'rest' ? `${taps} taps` : 'Done'}
        </span>
      </button>
      {phase === 'rest' && (
        <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => { setTaps(0); setPhase('waiting'); }}>
          Ready for try {tries.length + 1}
        </button>
      )}
      <p style={testStyles.status} aria-live="polite">
        {tries.length ? `Tries: ${tries.join(', ')}` : ''}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Tracking, and Track and Count
// ---------------------------------------------------------------------------------------------------------------------

//the seconds before the time on target counts, to settle in
const LEAD = 3;
//the dot's size, as a share of the box's width
const DOT = 0.045;

interface PursuitProps {
  path: (seconds: number) => [number, number];
  seconds: number; //how long it counts for, after the lead
  onStart?: () => void; //when the dot starts moving
  onFinish: (share: number) => void; //the share of the time on the dot, 0 to 100
}

//a box with a dot drifting around it, and the time the pointer is on it. It starts when the pointer is put on the dot
function Pursuit({ path, seconds, onStart, onFinish }: PursuitProps) {
  const [phase, setPhase] = useState<'armed' | 'running' | 'done'>('armed');
  const [dot, setDot] = useState(path(0));
  const [on, setOn] = useState(false);
  const [left, setLeft] = useState(seconds + LEAD);
  const pointer = useRef<[number, number] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const tally = useRef({ last: 0, on: 0 });

  const near = ([x, y]: [number, number]) => {
    const p = pointer.current;
    if (!p) return false;
    //in shares of the width, since the box is wider than tall
    return Math.hypot(p[0] - x, (p[1] - y) * 0.75) <= DOT;
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    if (phase === 'armed' && near(path(0))) {
      tally.current = { last: 0, on: 0 };
      setPhase('running');
      onStart?.();
    }
  };

  useFrames(phase === 'running', (t) => {
    const at = path(t);
    const hit = near(at);
    if (t > LEAD && hit) tally.current.on += t - Math.max(tally.current.last, LEAD);
    tally.current.last = t;
    setDot(at);
    setOn(hit);
    setLeft(Math.max(0, seconds + LEAD - t));
    if (t >= seconds + LEAD) {
      setPhase('done');
      onFinish(Math.round((tally.current.on / seconds) * 1000) / 10);
    }
  });

  return (
    <>
      <div ref={box} style={styles.pursuit} onPointerMove={move} onPointerDown={move} aria-label="The tracking box">
        <span
          style={{
            ...styles.dot,
            left: `${dot[0] * 100}%`,
            top: `${dot[1] * 100}%`,
            width: `${DOT * 200}%`,
            background: phase === 'armed' ? ivory : on ? blue : brownRed,
          }}
        />
      </div>
      <p style={testStyles.status} aria-live="polite">
        {phase === 'armed' && 'Put the pointer or your finger on the dot to start.'}
        {phase === 'running' && (left > seconds ? 'Get settled...' : `${clock(left)} left`)}
      </p>
    </>
  );
}

//control precision: keep the pointer on a dot that drifts unpredictably. The score is the share of the time on it
export function Tracking({ onDone, onCancel }: TestProps) {
  const [started, setStarted] = useState(false);
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Keep the mouse pointer, or your finger, on the dot as it drifts around. It turns blue while you're on it. The
          first few seconds are to settle in, then {TIMED.tracking.seconds} seconds count.
        </p>
      }
    >
      {started ? (
        <Pursuit path={TRACKING_PATH} seconds={TIMED.tracking.seconds} onFinish={onDone} />
      ) : (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => setStarted(true)}>
            Start
          </button>
        </div>
      )}
    </Frame>
  );
}

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
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Two things at once, for {clock(TIMED.trackCount.seconds)}: keep the pointer or your finger on the drifting dot,
          and count the <strong>high</strong> beeps in your head, ignoring the low ones. Turn your sound on. You'll be asked
          for the count at the end.
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
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => { ear(); setPhase('running'); }}>
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
            setPhase('done');
            onDone(Math.round((tracked.current + counted) / 2));
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

// ---------------------------------------------------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------------------------------------------------

//where the dot starts and where the line is, and where the cover starts on a try with the end hidden, out of 100
const FROM = 5;
const LINE = 82;
const COVER = 55;
//the error counted for no press, in ms
const MISSED = 1000;

//rate control: stop a moving dot on the line, some tries with the end of its path hidden. The score is how far off the
//presses are on average, in ms
export function Timing({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [moving, setMoving] = useState(false);
  const [x, setX] = useState(FROM);
  const [note, setNote] = useState('');
  const live = useRef({ started: 0, pressed: true });
  const errors = useRef<number[]>([]);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = phase === 'practice' ? TIMING_PRACTICE : TIMINGS;
  const trial = list[at];

  const launch = () => {
    setX(FROM);
    setMoving(false);
    live.current.pressed = true;
    timer.current = window.setTimeout(() => {
      live.current = { started: now(), pressed: false };
      setMoving(true);
    }, 800);
  };

  const begin = (to: 'practice' | 'timed') => {
    errors.current = [];
    setAt(0);
    setNote('');
    setPhase(to);
    launch();
  };

  const stop = () => {
    if (live.current.pressed || !moving) return;
    live.current.pressed = true;
    setMoving(false);
    const off = since(live.current.started) - trial.seconds * 1000;
    settle(off);
  };

  const settle = (off: number) => {
    const error = Math.min(MISSED, Math.abs(off));
    if (phase === 'practice') setNote(Math.abs(off) >= MISSED ? 'Missed it.' : `${Math.round(Math.abs(off))} ms ${off < 0 ? 'early' : 'late'}.`);
    else errors.current.push(error);
    timer.current = window.setTimeout(() => {
      if (at + 1 < list.length) {
        setAt(at + 1);
        return launch();
      }
      if (phase === 'practice') return setPhase('between');
      setPhase('done');
      onDone(Math.round(errors.current.reduce((s, e) => s + e, 0) / errors.current.length));
    }, 900);
  };

  useFrames(moving, (t) => {
    const share = t / trial.seconds;
    setX(FROM + (LINE - FROM) * share);
    if (t * 1000 > trial.seconds * 1000 + MISSED && !live.current.pressed) {
      live.current.pressed = true;
      setMoving(false);
      settle(MISSED);
    }
  });

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) stop();
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
          A dot moves toward the line at different speeds. Press the space bar or Stop the moment it reaches the line. On
          some tries the end of its path is covered, so you'll have to judge when it gets there. Three to practise, then{' '}
          {TIMINGS.length}.
        </p>
      }
    >
      {asking ? (
        <>
          <svg viewBox="0 0 100 24" style={styles.track} aria-label="The track">
            <rect width={100} height={24} fill={ivory} />
            <line x1={LINE} y1={2} x2={LINE} y2={22} stroke={brownRed} strokeWidth={0.8} />
            <circle cx={x} cy={12} r={2.6} fill={gunmetal} />
            {trial.hidden && <rect x={COVER} y={0} width={LINE - COVER} height={24} fill="#cfcfcf" />}
            {trial.hidden && <line x1={LINE} y1={2} x2={LINE} y2={22} stroke={brownRed} strokeWidth={0.8} />}
          </svg>
          <button type="button" className="comic-lift" style={{ ...testStyles.choice, padding: '22px 10px' }} onPointerDown={stop}>
            Stop
          </button>
        </>
      ) : (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => begin(phase === 'ready' ? 'practice' : 'timed')}>
              {phase === 'ready' ? 'Start the practice' : `Start: ${TIMINGS.length} tries`}
            </button>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${list.length}${note ? ` · ${note}` : ''}`}
        {phase === 'between' && 'Practice done.'}
        {phase === 'timed' && `${at + 1} of ${list.length}`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Two-hand steering
// ---------------------------------------------------------------------------------------------------------------------

//how fast the dot moves, in shares of the box a second, and how close counts as reaching a target
const SPEED = 0.38;
const REACH = 0.055;
type Way = 'up' | 'down' | 'left' | 'right';
const STEER_KEYS: Record<string, Way> = { KeyW: 'up', KeyS: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

//a button held down to steer, by mouse or finger, several at once on a touch screen
function Pad({ label, onPress }: { label: string; onPress: (down: boolean) => void }) {
  return (
    <button
      type="button"
      style={styles.pad}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress(true);
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onLostPointerCapture={() => onPress(false)}
    >
      {label}
    </button>
  );
}

//multilimb coordination: steer a dot to targets with both hands at once, one for up and down and the other for left
//and right. The score is how many targets are reached in 60 seconds
export function TwoHandSteering({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [dot, setDot] = useState<[number, number]>([0.5, 0.5]);
  const [reached, setReached] = useState(0);
  const [left, setLeft] = useState<number>(TIMED.steering.seconds);
  const held = useRef(new Set<Way>());
  const live = useRef({ dot: [0.5, 0.5] as [number, number], reached: 0, last: 0 });

  useFrames(phase === 'running', (t) => {
    const l = live.current;
    const dt = t - l.last;
    l.last = t;
    const h = held.current;
    const vx = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    const vy = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0);
    l.dot = [Math.min(1, Math.max(0, l.dot[0] + vx * SPEED * dt)), Math.min(1, Math.max(0, l.dot[1] + vy * SPEED * dt))];
    const target = STEERING_TARGETS[l.reached];
    if (Math.hypot(l.dot[0] - target[0], l.dot[1] - target[1]) < REACH) l.reached += 1;
    setDot(l.dot);
    setReached(l.reached);
    setLeft(Math.max(0, TIMED.steering.seconds - t));
    if (t >= TIMED.steering.seconds) {
      setPhase('done');
      onDone(l.reached);
    }
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const way = STEER_KEYS[e.code];
      if (!way || phase !== 'running') return;
      e.preventDefault();
      held.current.add(way);
    };
    const up = (e: KeyboardEvent) => {
      const way = STEER_KEYS[e.code];
      if (way) held.current.delete(way);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [phase]);

  const press = (way: Way, down: boolean) => {
    if (down) held.current.add(way);
    else held.current.delete(way);
  };

  const target = STEERING_TARGETS[reached];
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Steer the dot to each target as it appears, using both hands at once: W and S with your left hand for up and
          down, and the left and right arrow keys with your right hand. On a touch screen, use a thumb on each side. You
          need a keyboard or a touch screen. {clock(TIMED.steering.seconds)}, as many targets as you can.
        </p>
      }
    >
      {phase === 'ready' ? (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => {
            live.current = { dot: [0.5, 0.5], reached: 0, last: 0 };
            held.current.clear();
            setPhase('running');
          }}>
            Start
          </button>
        </div>
      ) : (
        <>
          <div style={styles.pursuit} aria-label="The steering box">
            {phase === 'running' && target && (
              <span style={{ ...styles.dot, left: `${target[0] * 100}%`, top: `${target[1] * 100}%`, width: `${REACH * 200}%`, background: 'transparent', border: `3px dashed ${blue}` }} />
            )}
            <span style={{ ...styles.dot, left: `${dot[0] * 100}%`, top: `${dot[1] * 100}%`, width: '4%', background: brownRed }} />
          </div>
          <div style={styles.controls}>
            <div style={styles.column}>
              <Pad label="Up (W)" onPress={(down) => press('up', down)} />
              <Pad label="Down (S)" onPress={(down) => press('down', down)} />
            </div>
            <div style={styles.row}>
              <Pad label="Left" onPress={(down) => press('left', down)} />
              <Pad label="Right" onPress={(down) => press('right', down)} />
            </div>
          </div>
        </>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'running' && `${reached} reached · ${clock(left)} left`}
        {phase === 'done' && `Done: ${reached} reached`}
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
  pursuit: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'crosshair',
  },
  dot: {
    position: 'absolute',
    aspectRatio: '1',
    transform: 'translate(-50%, -50%)',
    border: `2px solid ${gunmetal}`,
    borderRadius: '50%',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    width: '100%',
    border: `3px solid ${gunmetal}`,
    borderRadius: 10,
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pad: {
    minWidth: 76,
    padding: '16px 10px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: 12,
    font: 'inherit',
    fontSize: 15,
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'pointer',
  },
};
