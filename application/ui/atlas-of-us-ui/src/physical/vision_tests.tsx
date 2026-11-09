import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { COLOUR_HUES, COLOUR_TRIES, SIDE_ANGLES, SIDE_FLASHES, SIDE_PRACTICE } from './puzzles';
import type { TestProps } from './self_tests';
import { Frame } from './test_frame';
import { chance, testStyles } from './test_kit';
import { gunmetal } from '../shared_components/palette';

// ---------------------------------------------------------------------------------------------------------------------
// Sizing the screen with a bank card, so the tests can draw things a true size
// ---------------------------------------------------------------------------------------------------------------------

//a bank card's short edge, which fits across a phone, in mm (ISO/IEC 7810 ID-1, the size of bank, credit and most ID
//cards)
const CARD_SHORT = 53.98;
//where the card's size on this screen is remembered, so it only needs measuring once
const CARD_KEY = 'atlas-card-px';

function rememberedCard(): number {
  try {
    const px = Number(localStorage.getItem(CARD_KEY));
    if (px > 0) return px;
  } catch {
    //no storage, so it's measured again
  }
  return 204; //53.98 mm on a 96 dpi screen
}

//the step that sizes the screen: the css px to a mm, once the box matches a card
function CardSizing({ onSized }: { onSized: (pxPerMm: number) => void }) {
  const [cardPx, setCardPx] = useState(rememberedCard);
  const done = () => {
    try {
      localStorage.setItem(CARD_KEY, String(cardPx));
    } catch {
      //it's measured again next time
    }
    onSized(cardPx / CARD_SHORT);
  };
  return (
    <div style={styles.sizing}>
      <p style={testStyles.text}>
        First, size the screen so things come out true. Hold a bank card (or any card that size, like a driving licence)
        upright and flat against the screen, and slide until the box is as wide as the card's short edge. Keep the page
        zoom as it is until you're done.
      </p>
      <div style={{ ...styles.card, width: cardPx }} />
      <input type="range" min={100} max={600} value={cardPx} aria-label="The box's width" style={styles.slider} onChange={(e) => setCardPx(Number(e.target.value))} />
      <button type="button" className="comic-lift" style={testStyles.primary} onClick={done}>
        It matches
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Eye charts, far and near
// ---------------------------------------------------------------------------------------------------------------------

//how many letters each line has and how many of them have to be right to pass it
const PER_LINE = 5;
const TO_PASS = 3;
//what's recorded when not even the top line can be read, as NHANES records worse than 20/200
const BELOW_CHART = 400;
//the fewest screen pixels an E can be drawn in and still be an E
const SHARPEST = 5;

type Way = 'up' | 'right' | 'down' | 'left';
const WAYS: Way[] = ['up', 'right', 'down', 'left'];
const TURN: Record<Way, number> = { right: 0, down: 90, left: 180, up: 270 };
const KEYS: Record<string, Way> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };

//how tall an E for a Snellen line is on the screen, in css px: 20/20's E is 5 minutes of arc tall from where you are
const eHeight = (line: number, pxPerMm: number, viewing: number) => pxPerMm * viewing * Math.tan(((5 / 60) * (line / 20) * Math.PI) / 180);

interface ChartProps extends TestProps {
  viewing: number; //how far from the screen, in mm
  lines: number[]; //the lines of the chart, as the bottom of the Snellen fraction, largest first
  where: ReactNode; //how to stand or hold the screen, and how to answer
}

//read the way an E points, line by line until a line can't be read. The screen is first sized with a bank card, so
//the letters are true to size, and lines too small for the screen to draw are left off. The score is the smallest line
//with most of it right
function EyeChart({ viewing, lines, where, onDone, onCancel }: ChartProps) {
  const [phase, setPhase] = useState<'size' | 'stand' | 'chart' | 'done'>('size');
  const [pxPerMm, setPxPerMm] = useState(1);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0); //letters shown on this line
  const [way, setWay] = useState<Way>('right');
  const right = useRef(0);
  const best = useRef<number | null>(null);
  const chart = lines.filter((l) => eHeight(l, pxPerMm, viewing) * window.devicePixelRatio >= SHARPEST);

  const show = (previous: Way) => setWay(WAYS.filter((w) => w !== previous)[Math.floor(chance() * 3)]);

  const start = () => {
    right.current = 0;
    best.current = null;
    setLine(0);
    setShown(0);
    show(way);
    setPhase('chart');
  };

  const answer = (said: Way | null) => {
    if (phase !== 'chart') return;
    if (said === way) right.current += 1;
    const seen = shown + 1;
    if (seen < PER_LINE) {
      setShown(seen);
      return show(way);
    }
    const passed = right.current >= TO_PASS;
    if (passed) best.current = chart[line];
    if (passed && line < chart.length - 1) {
      right.current = 0;
      setLine(line + 1);
      setShown(0);
      return show(way);
    }
    setPhase('done');
    onDone(best.current ?? BELOW_CHART);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const said = KEYS[e.key];
      if (!said || phase !== 'chart') return;
      e.preventDefault();
      answer(said);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const size = eHeight(chart[line] ?? lines[0], pxPerMm, viewing);
  const smallest = chart[chart.length - 1];
  return (
    <Frame onCancel={onCancel} intro={phase === 'size' ? null : <p style={testStyles.text}>{where}</p>}>
      {phase === 'size' && <CardSizing onSized={(px) => { setPxPerMm(px); setPhase('stand'); }} />}
      {phase === 'stand' && (
        <div style={{ ...testStyles.arena, flexDirection: 'column', gap: 10 }}>
          {smallest !== lines[lines.length - 1] && (
            <p style={testStyles.text}>This screen can draw letters down to 20/{smallest} from there, so it can't measure sharper sight than that.</p>
          )}
          <button type="button" className="comic-lift" style={testStyles.primary} onClick={start}>
            Start the chart
          </button>
        </div>
      )}
      {phase === 'chart' && (
        <>
          <div style={{ ...testStyles.arena, minHeight: Math.max(180, size + 40), cursor: 'default' }} aria-label="The letter">
            <svg width={size} height={size} viewBox="0 0 5 5" style={{ transform: `rotate(${TURN[way]}deg)` }} aria-hidden="true">
              <rect x={0} y={0} width={1} height={5} fill="#000" />
              <rect x={0} y={0} width={5} height={1} fill="#000" />
              <rect x={0} y={2} width={5} height={1} fill="#000" />
              <rect x={0} y={4} width={5} height={1} fill="#000" />
            </svg>
          </div>
          <div style={styles.ways}>
            {WAYS.map((w) => (
              <button key={w} type="button" className="comic-lift" style={testStyles.choice} onPointerDown={() => answer(w)}>
                {w[0].toUpperCase() + w.slice(1)}
              </button>
            ))}
            <button type="button" className="comic-lift" style={testStyles.choice} onPointerDown={() => answer(null)}>
              Can't tell
            </button>
          </div>
        </>
      )}
      {phase === 'done' && (
        <div style={testStyles.arena}>
          <span style={testStyles.prompt}>Done</span>
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'chart' && `Line 20/${chart[line]} · letter ${shown + 1} of ${PER_LINE}`}
      </p>
    </Frame>
  );
}

//far vision, from 3 metres
export function FarChart(props: TestProps) {
  return (
    <EyeChart
      {...props}
      viewing={3000}
      lines={[200, 100, 70, 50, 40, 30, 25, 20, 15, 10]}
      where="Put the screen at eye height and stand 3 metres (10 feet) back, wearing your usual glasses or contacts, with both eyes open. For each E, say which way its arms point. Someone near the screen taps it for you, or use the arrow keys on a keyboard you can reach. If you can't tell, guess."
    />
  );
}

//near vision, at 40 cm
export function NearChart(props: TestProps) {
  return (
    <EyeChart
      {...props}
      viewing={400}
      lines={[200, 100, 70, 50, 40, 30, 25, 20, 15]}
      where="Hold the screen 40 cm (16 inches) from your eyes, about the length from your elbow to your fingertips, wearing your usual reading glasses if you use them, with both eyes open. For each E, tap which way its arms point, or use the arrow keys. If you can't tell, guess."
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Odd colour out
// ---------------------------------------------------------------------------------------------------------------------

//how many tiles, the hue difference to start from, and how it changes after a right and a wrong answer
const TILES = 16;
const START_DIFFERENCE = 40;
const EASIER = 1.5;
const HARDER = 0.75;
//how many of the last tries the score is worked out from
const SCORED_TRIES = 12;

//visual colour discrimination: pick the tile a slightly different colour from the rest, as the difference shrinks after
//each right answer and grows after a wrong one. The score is the typical difference over the last tries, in degrees of
//hue
export function OddColourOut({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [difference, setDifference] = useState(START_DIFFERENCE);
  const [odd, setOdd] = useState(0);
  const [sign, setSign] = useState(1);
  const tried = useRef<number[]>([]);

  const next = (i: number) => {
    setAt(i);
    setOdd(Math.floor(chance() * TILES));
    setSign(chance() < 0.5 ? -1 : 1);
  };

  const pick = (tile: number) => {
    tried.current.push(difference);
    const nextDifference = Math.min(120, Math.max(0.5, difference * (tile === odd ? HARDER : EASIER)));
    if (at + 1 < COLOUR_TRIES) {
      setDifference(nextDifference);
      return next(at + 1);
    }
    setPhase('done');
    const last = tried.current.slice(-SCORED_TRIES);
    onDone(Math.round(Math.exp(last.reduce((s, d) => s + Math.log(d), 0) / last.length) * 10) / 10);
  };

  const hue = COLOUR_HUES[at];
  const colour = (h: number) => `oklch(0.72 0.12 ${((h % 360) + 360) % 360})`;
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          One tile is a slightly different colour from the rest. Tap it. It gets harder each time you're right. Turn off
          any night mode or blue-light filter first, and turn the brightness up. {COLOUR_TRIES} goes.
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
              style={{ ...styles.tile, background: colour(i === odd ? hue + sign * difference : hue) }}
              onClick={() => pick(i)}
            />
          ))}
        </div>
      ) : (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => {
              tried.current = [];
              setDifference(START_DIFFERENCE);
              next(0);
              setPhase('running');
            }}>
              Start
            </button>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'running' && `${at + 1} of ${COLOUR_TRIES}`}
      </p>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Side vision
// ---------------------------------------------------------------------------------------------------------------------

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
  const [phase, setPhase] = useState<'size' | 'ready' | 'practice' | 'between' | 'timed' | 'done'>('size');
  const [pxPerMm, setPxPerMm] = useState(1);
  const [flash, setFlash] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const live = useRef({ phase: 'size', at: 0, flashed: false, answered: true, hits: 0, falseAlarms: 0 });
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
    live.current = { phase: to, at: 0, flashed: false, answered: true, hits: 0, falseAlarms: 0 };
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
    if (l.phase === 'practice') setNote(shown === null ? (side === null ? 'Right, there was none.' : 'There was no flash that time.') : hit ? 'Seen.' : 'Missed it.');
    if (l.at + 1 < items.length) return run(l.at + 1);
    leaveFullscreen();
    if (l.phase === 'practice') {
      l.phase = 'between';
      return setPhase('between');
    }
    l.phase = 'done';
    setPhase('done');
    onDone(Math.max(0, l.hits - l.falseAlarms));
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
    <Frame
      onCancel={onCancel}
      intro={
        phase === 'size' ? null : (
          <p style={testStyles.text}>
            Sit with your eyes 25 cm (10 inches) from the middle of the screen, about a hand's span, and keep looking at
            the dot in the middle the whole time. Small flashes appear off to the left or right. Press the left or right
            arrow key, or tap that side of the screen, when you see one. Sometimes there's none, so don't guess. A few to
            practise, then {SIDE_FLASHES.length}.
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
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => void begin(phase === 'ready' ? 'practice' : 'timed')}>
              {phase === 'ready' ? 'Start the practice' : `Start: ${SIDE_FLASHES.length} flashes`}
            </button>
          ) : (
            <p style={testStyles.text}>
              This screen isn't wide enough: it needs to be about {Math.ceil((reach * 2) / pxPerMm / 10)} cm across. Try a
              laptop or desktop screen, with the window as wide as it goes.
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
  sizing: {
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    overflowX: 'auto',
  },
  card: {
    flexShrink: 0,
    height: 90,
    background: 'var(--pale-cinnamon)',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  slider: {
    width: '100%',
    maxWidth: 520,
  },
  ways: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: 10,
  },
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
