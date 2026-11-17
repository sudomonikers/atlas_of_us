import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { gunmetal } from '../../shared_components/palette';
import { CardSizing } from '../card_sizing';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { chance, testStyles, useCountIn } from '../test_kit';
import { SIDE_ANGLES, SIDE_FLASHES, SIDE_PRACTICE } from './items';

//how far from the screen, in mm, the flash's size in degrees, how long it shows and how long to answer, in ms
const SIDE_VIEWING = 250;
const FLASH_SIZE = 1.2;
const FLASH_SHOWN = 200;
const ANSWER_WINDOW = 1300;

const leaveFullscreen = () => {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
};

//peripheral vision: look at the dot in the middle and say which side a flash appears on. The screen goes full screen,
//and has to be wide enough to reach the furthest flash. The score is the flashes seen, less any answers to no flash
export function SideVision({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'size' | 'ready' | 'practice' | 'between' | 'timed' | 'done'>('size');
  const [pxPerMm, setPxPerMm] = useState(1);
  const [flash, setFlash] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const live = useRef({ phase: 'size', at: 0, flashed: false, answered: true, hits: 0, falseAlarms: 0, parts: [] as Part[] });
  const timers = useRef<number[]>([]);
  const clear = () => timers.current.splice(0).forEach(clearTimeout);
  useEffect(() => () => clear(), []);

  const reach = Math.tan((Math.max(...SIDE_ANGLES) * Math.PI) / 180) * SIDE_VIEWING * pxPerMm; //css px from the middle
  const wide = window.innerWidth / 2 >= reach + 10;
  const offset = (deg: number) => Math.sign(deg) * Math.tan((Math.abs(deg) * Math.PI) / 180) * SIDE_VIEWING * pxPerMm;
  const flashPx = Math.tan((FLASH_SIZE * Math.PI) / 180) * SIDE_VIEWING * pxPerMm;

  const run = (i: number) => {
    const l = live.current;
    const items = l.phase === 'practice' ? SIDE_PRACTICE : SIDE_FLASHES;
    l.at = i;
    l.answered = false;
    l.flashed = false;
    timers.current.push(window.setTimeout(() => {
      l.flashed = true;
      setFlash(items[i]);
      timers.current.push(window.setTimeout(() => setFlash(null), FLASH_SHOWN));
      timers.current.push(window.setTimeout(() => answer(null), ANSWER_WINDOW));
    }, 1000 + chance() * 1000));
  };

  const begin = async (to: 'practice' | 'timed') => {
    live.current = { phase: to, at: 0, flashed: false, answered: true, hits: 0, falseAlarms: 0, parts: [] };
    setNote('');
    setPhase(to);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      //runs in the window as it is
    }
    run(0);
  };

  //an answer: -1 for left, 1 for right, null for none in time
  const answer = (side: -1 | 1 | null) => {
    const l = live.current;
    if (l.answered || (l.phase !== 'practice' && l.phase !== 'timed')) return;
    const items = l.phase === 'practice' ? SIDE_PRACTICE : SIDE_FLASHES;
    const shown = items[l.at];
    //a press before the flash, or before the time it would come, is a guess, and doesn't end the try
    if (side !== null && !l.flashed) return;
    l.answered = true;
    clear();
    setFlash(null);
    const hit = side !== null && shown !== null && Math.sign(shown) === side;
    if (side !== null && shown === null) l.falseAlarms += 1;
    if (hit) l.hits += 1;
    if (l.phase === 'timed') {
      const where = shown === null ? 'No flash' : `${Math.abs(shown)} degrees ${shown < 0 ? 'left' : 'right'}`;
      const did = side === null ? 'no press' : `you pressed ${side < 0 ? 'left' : 'right'}`;
      l.parts.push({
        label: `${l.at + 1}`,
        right: shown === null ? side === null : hit,
        note: `${where}: ${did}${shown === null && side !== null ? ', a point off' : ''}`,
      });
    }
    if (l.phase === 'practice') setNote(shown === null ? (side === null ? 'Right, there was none.' : 'There was no flash that time.') : hit ? 'Seen.' : 'Missed it.');
    if (l.at + 1 < items.length) return run(l.at + 1);
    leaveFullscreen();
    if (l.phase === 'practice') {
      l.phase = 'between';
      return setPhase('between');
    }
    l.phase = 'done';
    setPhase('done');
    const score = Math.max(0, l.hits - l.falseAlarms);
    onDone(score, {
      how: `One point for each flash you saw on the right side, and one off for each press when there was no flash: ${l.hits} - ${l.falseAlarms} = ${score}. Some tries have no flash, to catch guessing.`,
      parts: l.parts,
    });
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') answer(-1);
      else if (e.key === 'ArrowRight') answer(1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const running = phase === 'practice' || phase === 'timed';
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        phase === 'size' ? null : (
          <p style={testStyles.text}>
            Sit with your eyes 25 cm (10 inches) from the middle of the screen – about a hand's span – and keep looking
            at the dot in the middle the whole time. Small flashes appear off to the left or right. Press the left or
            right arrow key, or tap that side of the screen, when you see one. Sometimes there's none, so don't guess.
            You'll get a few to practice, then {SIDE_FLASHES.length} that count.
          </p>
        )
      }
    >
      {phase === 'size' && <CardSizing onSized={(px) => { setPxPerMm(px); setPhase('ready'); }} />}
      <div style={running ? styles.full : styles.hidden}>
        {running && (
          <>
            <button type="button" style={styles.stop} onClick={() => { clear(); leaveFullscreen(); onCancel(); }}>
              Stop
            </button>
            <button type="button" aria-label="Left side" style={{ ...styles.half, left: 0 }} onPointerDown={() => answer(-1)} />
            <button type="button" aria-label="Right side" style={{ ...styles.half, right: 0 }} onPointerDown={() => answer(1)} />
            <span style={styles.fixation} />
            {flash !== null && <span style={{ ...styles.flash, width: flashPx, height: flashPx, left: `calc(50% + ${offset(flash)}px)` }} />}
            <span style={styles.fullNote}>{phase === 'practice' ? note || 'Practice' : ''}</span>
          </>
        )}
      </div>
      {(phase === 'ready' || phase === 'between' || phase === 'done') && (
        <div style={{ ...testStyles.arena, flexDirection: 'column', gap: 10 }}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : wide ? (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(() => void begin(phase === 'ready' ? 'practice' : 'timed'))}>
              {phase === 'ready' ? 'Start the practice' : `Start: ${SIDE_FLASHES.length} flashes`}
            </button>
          ) : (
            <p style={testStyles.text}>
              This screen isn't wide enough: it needs to be about {Math.ceil((reach * 2) / pxPerMm / 10)} cm across. Try
              a laptop or desktop screen, with the window as wide as it goes.
            </p>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'between' && 'Practice done.'}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  hidden: {
    display: 'none',
  },
  full: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: '#808080',
    touchAction: 'manipulation',
    userSelect: 'none',
  },
  half: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  fixation: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 10,
    height: 10,
    transform: 'translate(-50%, -50%)',
    background: '#111',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  flash: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  stop: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: '4px 14px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  fullNote: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    pointerEvents: 'none',
  },
};
