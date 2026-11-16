import { type CSSProperties, useRef, useState } from 'react';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { chance, testStyles, useCountIn } from '../test_kit';
import { COLOR_HUES, COLOR_TRIES } from './items';

//how many tiles, the hue difference to start from, and how it changes after a right and a wrong answer
const TILES = 16;
const START_DIFFERENCE = 40;
const EASIER = 1.5;
const HARDER = 0.75;
//how many of the last tries the score is worked out from
const SCORED_TRIES = 12;

//visual color discrimination: pick the tile a slightly different color from the rest, as the difference shrinks after
//each right answer and grows after a wrong one. The score is the typical difference over the last tries, in degrees of
//hue
export function OddColorOut({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [difference, setDifference] = useState(START_DIFFERENCE);
  const [odd, setOdd] = useState(0);
  const [sign, setSign] = useState(1);
  const tried = useRef<number[]>([]);
  const got = useRef<boolean[]>([]); //whether each was spotted

  const next = (i: number) => {
    setAt(i);
    setOdd(Math.floor(chance() * TILES));
    setSign(chance() < 0.5 ? -1 : 1);
  };

  const pick = (tile: number) => {
    tried.current.push(difference);
    got.current.push(tile === odd);
    const nextDifference = Math.min(120, Math.max(0.5, difference * (tile === odd ? HARDER : EASIER)));
    if (at + 1 < COLOR_TRIES) {
      setDifference(nextDifference);
      return next(at + 1);
    }
    setPhase('done');
    const last = tried.current.slice(-SCORED_TRIES);
    const score = Math.round(Math.exp(last.reduce((s, d) => s + Math.log(d), 0) / last.length) * 10) / 10;
    const from = COLOR_TRIES - last.length;
    onDone(score, {
      how: `The colors get closer each time you spot the odd one and further apart each time you miss, until they settle at the closest you can tell apart. Your score is the average difference over the last ${last.length}, so lower is better: ${score}.`,
      parts: tried.current.map((d, i) => ({
        label: `${i + 1}`,
        right: got.current[i],
        note: `A difference of ${Math.round(d * 10) / 10}${i >= from ? ', in the score' : ''}`,
      })),
    });
  };

  const hue = COLOR_HUES[at];
  const color = (h: number) => `oklch(0.72 0.12 ${((h % 360) + 360) % 360})`;
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          One tile is a slightly different color from the rest. Tap it. It gets harder each time you're right. Turn off
          any night mode or blue-light filter first, and turn the brightness up. {COLOR_TRIES} goes.
        </p>
      }
    >
      {phase === 'running' ? (
        <div style={styles.tiles} role="group" aria-label="Tiles">
          {Array.from({ length: TILES }, (_, i) => (
            <button
              key={`${at}-${i}`}
              type="button"
              aria-label={`Tile ${i + 1}`}
              style={{ ...styles.tile, background: color(i === odd ? hue + sign * difference : hue) }}
              onClick={() => pick(i)}
            />
          ))}
        </div>
      ) : (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(() => {
              tried.current = [];
              setDifference(START_DIFFERENCE);
              next(0);
              setPhase('running');
            })}>
              Start
            </button>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'running' && `${at + 1} of ${COLOR_TRIES}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  tiles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  tile: {
    aspectRatio: '1',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};
