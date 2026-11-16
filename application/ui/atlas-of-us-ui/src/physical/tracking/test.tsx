import { type CSSProperties, type PointerEvent, useRef, useState } from 'react';
import { blue, brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { useFrames } from '../use_frames';
import { LEAD, TRACKING_PATH } from './items';

//the dot's size, as a share of the box's width
const DOT = 0.045;

interface PursuitProps {
  path: (seconds: number) => [number, number];
  seconds: number; //how long it counts for, after the lead
  onStart?: () => void; //when the dot starts moving
  onFinish: (share: number) => void; //the share of the time on the dot, 0 to 100
}

//a box with a dot drifting around it, and the time the pointer is on it. It starts when the pointer is put on the dot
export function Pursuit({ path, seconds, onStart, onFinish }: PursuitProps) {
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
  const [counting, countIn] = useCountIn();
  const [started, setStarted] = useState(false);
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Keep the mouse pointer – or your finger – on the dot as it drifts around. It turns blue while you're on it.
          The first few seconds are to settle in, then {TIMED.tracking.seconds} seconds count.
        </p>
      }
    >
      {started ? (
        <Pursuit path={TRACKING_PATH} seconds={TIMED.tracking.seconds} onFinish={(share) =>
            onDone(share, { how: `Your score is how much of the ${TIMED.tracking.seconds} seconds you kept the pointer on the dot: ${share}%.` })
          } />
      ) : (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(() => setStarted(true))}>
            Start
          </button>
        </div>
      )}
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  //as wide as the test, or as wide as fits the height of the screen with the instructions and controls around it,
  //keeping its shape
  pursuit: {
    position: 'relative',
    width: 'min(100%, max(240px, calc((100cqh - 320px) * 4 / 3)))',
    margin: '0 auto',
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
};
