import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { blue, brownRed, comic, gunmetal } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Phase, Starter } from '../starter';
import { Frame } from '../test_frame';
import { chance, testStyles, useCountIn } from '../test_kit';
import { COLOR_HUES, COLOR_PRACTICE, COLOR_TRIES } from './items';

//how many tiles, and the hue difference the tries that count start from, in degrees
const TILES = 16;
const START_DIFFERENCE = 30;
//how the difference changes: closer after a right answer, further apart after a wrong one. Until the first miss every
//right answer brings it closer, to find their level quickly, and after that it takes two right in a row, so it settles
//where they get about 7 in 10 right
const HARDER = 0.8;
const EASIER = 1.25;
//how many of the last tries the score is worked out from
const SCORED_TRIES = 12;
//how long a practice answer is shown before the next, in ms
const SHOWN_MS = 1100;

//visual color discrimination: pick the tile a slightly different color from the rest. A few easy practice tries show
//the right tile after each answer, then in the tries that count the difference shrinks as they spot it and grows as
//they miss. The score is the typical difference over the last tries, in degrees of hue
export function OddColorOut({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [difference, setDifference] = useState(START_DIFFERENCE);
  const [odd, setOdd] = useState(0);
  const [sign, setSign] = useState(1);
  const [told, setTold] = useState<{ right: boolean } | null>(null); //after a practice answer
  const tried = useRef<number[]>([]);
  const got = useRef<boolean[]>([]); //whether each was spotted
  const stair = useRef({ missed: false, run: 0 });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const next = (i: number) => {
    setAt(i);
    setOdd(Math.floor(chance() * TILES));
    setSign(chance() < 0.5 ? -1 : 1);
  };

  const practicePick = (tile: number) => {
    setTold({ right: tile === odd });
    timer.current = window.setTimeout(() => {
      setTold(null);
      if (at + 1 < COLOR_PRACTICE.length) return next(at + 1);
      setPhase('between');
    }, SHOWN_MS);
  };

  const pick = (tile: number) => {
    if (told) return;
    if (phase === 'practice') return practicePick(tile);
    const right = tile === odd;
    tried.current.push(difference);
    got.current.push(right);
    const s = stair.current;
    let factor = 1;
    if (!right) {
      s.missed = true;
      s.run = 0;
      factor = EASIER;
    } else if (!s.missed || ++s.run >= 2) {
      s.run = 0;
      factor = HARDER;
    }
    if (at + 1 < COLOR_TRIES) {
      setDifference(Math.min(120, Math.max(0.5, difference * factor)));
      return next(at + 1);
    }
    setPhase('done');
    const last = tried.current.slice(-SCORED_TRIES);
    const score = Math.round(Math.exp(last.reduce((sum, d) => sum + Math.log(d), 0) / last.length) * 10) / 10;
    const from = COLOR_TRIES - last.length;
    onDone(score, {
      how: `The colors get closer as you spot the odd tile and further apart when you miss, until they settle at about the closest you can tell apart. The first ${from} tries find that level, and your score is the average difference over the last ${last.length}, in degrees of hue, so lower is better: ${score}.`,
      parts: tried.current.map((d, i) => ({
        label: `${i + 1}`,
        right: got.current[i],
        note: `${Math.round(d * 10) / 10} degrees apart${i >= from ? ', counted in your score' : ', finding your level'}`,
      })),
    });
  };

  const practicing = phase === 'practice';
  const hue = practicing ? COLOR_PRACTICE[at].hue : COLOR_HUES[at];
  const apart = practicing ? COLOR_PRACTICE[at].difference : difference;
  const color = (h: number) => `oklch(0.72 0.12 ${((h % 360) + 360) % 360})`;
  const asking = practicing || phase === 'timed';
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          One tile is a slightly different color from the rest. Tap it. It gets harder as you get them right and easier
          when you miss, so expect plenty to be hard to see – a best guess is fine. Turn off any night mode or
          blue-light filter first, and turn the brightness up. {COLOR_PRACTICE.length} practice tries, then{' '}
          {COLOR_TRIES} that count.
        </p>
      }
    >
      {asking ? (
        <div style={styles.tiles} role="group" aria-label="Tiles">
          {Array.from({ length: TILES }, (_, i) => (
            <button
              key={`${phase}-${at}-${i}`}
              type="button"
              aria-label={`Tile ${i + 1}`}
              style={{
                ...styles.tile,
                background: color(i === odd ? hue + sign * apart : hue),
                ...(told && i === odd ? styles.shown : null),
              }}
              onClick={() => pick(i)}
            />
          ))}
        </div>
      ) : (
        <Starter phase={phase} label={`Start: ${COLOR_TRIES} tries`} onStart={() =>
          countIn(() => {
            tried.current = [];
            got.current = [];
            stair.current = { missed: false, run: 0 };
            setDifference(START_DIFFERENCE);
            next(0);
            setPhase(phase === 'ready' ? 'practice' : 'timed');
          })
        } />
      )}
      <p style={testStyles.status} aria-live="polite">
        {practicing && !told && `Practice ${at + 1} of ${COLOR_PRACTICE.length}`}
        {practicing && told && (
          <span style={{ ...styles.verdict, color: told.right ? blue : brownRed }}>
            {told.right ? 'Right' : "Not that one – it's the one outlined"}
          </span>
        )}
        {phase === 'between' && 'Practice done. Now the ones that count.'}
        {phase === 'timed' && `${at + 1} of ${COLOR_TRIES}`}
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
  //the odd tile, after a practice answer
  shown: {
    outline: `4px solid ${gunmetal}`,
    outlineOffset: 2,
  },
  verdict: {
    fontFamily: comic,
    letterSpacing: 1,
  },
};
