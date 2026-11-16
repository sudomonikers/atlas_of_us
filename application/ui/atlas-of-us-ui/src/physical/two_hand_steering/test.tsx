import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';
import { blue, brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { useFrames } from '../use_frames';
import { STEERING_TARGETS } from './items';

//how fast the dot moves, in shares of the box a second, and how close counts as reaching a target
const SPEED = 0.38;
const REACH = 0.055;
type Way = 'up' | 'down' | 'left' | 'right';
const STEER_KEYS: Record<string, Way> = { KeyW: 'up', KeyS: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];

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
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [dot, setDot] = useState<[number, number]>([0.5, 0.5]);
  const [reached, setReached] = useState(0);
  const [left, setLeft] = useState<number>(TIMED.steering.seconds);
  const held = useRef(new Set<Way>());
  const live = useRef({ dot: [0.5, 0.5] as [number, number], reached: 0, last: 0, times: [] as number[] });

  useFrames(phase === 'running', (t) => {
    const l = live.current;
    const dt = t - l.last;
    l.last = t;
    const h = held.current;
    const vx = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0);
    const vy = (h.has('down') ? 1 : 0) - (h.has('up') ? 1 : 0);
    l.dot = [Math.min(1, Math.max(0, l.dot[0] + vx * SPEED * dt)), Math.min(1, Math.max(0, l.dot[1] + vy * SPEED * dt))];
    const target = STEERING_TARGETS[l.reached];
    if (Math.hypot(l.dot[0] - target[0], l.dot[1] - target[1]) < REACH) {
      l.reached += 1;
      l.times.push(t);
    }
    setDot(l.dot);
    setReached(l.reached);
    setLeft(Math.max(0, TIMED.steering.seconds - t));
    if (t >= TIMED.steering.seconds) {
      setPhase('done');
      onDone(l.reached, {
        how: `Your score is how many targets you reached in ${TIMED.steering.seconds} seconds: ${l.reached}.`,
        parts: l.times.map((at, i) => ({ label: `${i + 1}`, note: `Reached at ${at.toFixed(1)} s, ${(at - (l.times[i - 1] ?? 0)).toFixed(1)} s after the one before` })),
      });
    }
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (phase !== 'running') return;
      //no key scrolls the page while it runs, the ones that don't steer included
      if (SCROLL_KEYS.includes(e.code) || STEER_KEYS[e.code]) e.preventDefault();
      const way = STEER_KEYS[e.code];
      if (way) held.current.add(way);
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
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Steer the dot to each target as it appears, using both hands at once: W and S with your left hand for up and
          down, and the left and right arrow keys with your right hand. On a touch screen, use a thumb on each side. You
          need a keyboard or a touch screen. You have {clock(TIMED.steering.seconds)} to reach as many targets as you
          can.
        </p>
      }
    >
      {phase === 'ready' ? (
        <div style={testStyles.arena}>
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(() => {
            live.current = { dot: [0.5, 0.5], reached: 0, last: 0, times: [] };
            held.current.clear();
            setPhase('running');
          })}>
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
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
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
