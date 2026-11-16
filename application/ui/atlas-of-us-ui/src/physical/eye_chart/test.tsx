import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { CardSizing } from '../card_sizing';
import { listen, notListening } from '../listening';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { beep, chance, testStyles, useCountIn } from '../test_kit';

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
//the words that answer out loud, with no for can't tell
const SAID: Record<string, Way | null> = { up: 'up', right: 'right', down: 'down', left: 'left', no: null };

//how tall an E for a Snellen line is on the screen, in css px: 20/20's E is 5 minutes of arc tall from where you are
const eHeight = (line: number, pxPerMm: number, viewing: number) => pxPerMm * viewing * Math.tan(((5 / 60) * (line / 20) * Math.PI) / 180);

interface ChartProps extends TestProps {
  viewing: number; //how far from the screen, in mm
  lines: number[]; //the lines of the chart, as the bottom of the Snellen fraction, largest first
  where: ReactNode; //how to stand or hold the screen, and how to answer
  aloud?: boolean; //whether it can be answered out loud, for a chart read from across the room
}

//read the way an E points, line by line until a line can't be read. The screen is first sized with a bank card, so
//the letters are true to size, and lines too small for the screen to draw are left off. The score is the smallest line
//with most of it right. A chart read from across the room can be answered out loud, saying up, down, left or right, or
//no for can't tell, with a beep for each answer heard
function EyeChart({ viewing, lines, where, aloud, onDone, onCancel }: ChartProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'size' | 'stand' | 'chart' | 'done'>('size');
  const [pxPerMm, setPxPerMm] = useState(1);
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0); //letters shown on this line
  const [way, setWay] = useState<Way>('right');
  const right = useRef(0);
  const best = useRef<number | null>(null);
  const read = useRef<Part[]>([]); //each line read, as it went
  const answers = useRef<string[]>([]); //each answer on the line being read
  const [voice, setVoice] = useState<'off' | 'loading' | 'on' | string>('off'); //anything else is what went wrong
  const [heard, setHeard] = useState<string>();
  const stopListening = useRef<() => void>(undefined);
  const audio = useRef<AudioContext | null>(null);
  const answering = useRef<(said: Way | null) => void>(() => {});
  useEffect(
    () => () => {
      stopListening.current?.();
      void audio.current?.close();
    },
    [],
  );
  const chart = lines.filter((l) => eHeight(l, pxPerMm, viewing) * window.devicePixelRatio >= SHARPEST);

  const show = (previous: Way) => setWay(WAYS.filter((w) => w !== previous)[Math.floor(chance() * 3)]);

  const start = () => {
    right.current = 0;
    best.current = null;
    read.current = [];
    answers.current = [];
    setLine(0);
    setShown(0);
    show(way);
    setPhase('chart');
  };

  const answer = (said: Way | null) => {
    if (phase !== 'chart') return;
    if (said === way) right.current += 1;
    answers.current.push(said === way ? way : said ? `${said}, it was ${way}` : `can't tell, it was ${way}`);
    const seen = shown + 1;
    if (seen < PER_LINE) {
      setShown(seen);
      return show(way);
    }
    const passed = right.current >= TO_PASS;
    if (passed) best.current = chart[line];
    read.current.push({ label: `20/${chart[line]}`, right: passed, note: `${right.current} of ${PER_LINE} right${passed ? '' : `, ${TO_PASS} needed to pass`}: ${answers.current.join('; ')}` });
    answers.current = [];
    if (passed && line < chart.length - 1) {
      right.current = 0;
      setLine(line + 1);
      setShown(0);
      return show(way);
    }
    setPhase('done');
    stopListening.current?.();
    const score = best.current ?? BELOW_CHART;
    onDone(score, {
      how: best.current
        ? `Your score is the smallest line where you got at least ${TO_PASS} of the ${PER_LINE} letters right: 20/${score}. The chart stops at the first line you don't pass.`
        : `Your score is the smallest line where you got at least ${TO_PASS} of the ${PER_LINE} letters right. You didn't pass the top line, so it records worse than 20/200, as 20/${BELOW_CHART}.`,
      parts: read.current,
    });
  };
  useEffect(() => {
    answering.current = answer;
  });

  //listens for answers, then counts in to the chart once it's ready
  const startAloud = () => {
    audio.current ??= new AudioContext();
    setVoice('loading');
    listen(Object.keys(SAID), (word) => {
      setHeard(word);
      if (audio.current) beep(audio.current, false);
      answering.current(SAID[word]);
    }).then(
      (stop) => {
        stopListening.current = stop;
        setVoice('on');
        countIn(start);
      },
      (e) => setVoice(notListening(e)),
    );
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
    <Frame count={counting} onCancel={onCancel} intro={phase === 'size' ? null : <p style={testStyles.text}>{where}</p>}>
      {phase === 'size' && <CardSizing onSized={(px) => { setPxPerMm(px); setPhase('stand'); }} />}
      {phase === 'stand' && (
        <div style={{ ...testStyles.arena, flexDirection: 'column', gap: 10 }}>
          {smallest !== lines[lines.length - 1] && (
            <p style={testStyles.text}>
              This screen can draw letters down to 20/{smallest} from there, so it can't measure sharper sight than
              that.
            </p>
          )}
          {aloud ? (
            <>
              <div style={styles.ways}>
                <button type="button" className="comic-lift" style={testStyles.primary} disabled={voice === 'loading'} onClick={startAloud}>
                  {voice === 'loading' ? 'Getting your microphone ready...' : 'Answer out loud'}
                </button>
                <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => countIn(start)}>
                  Answer by tapping
                </button>
              </div>
              {voice !== 'off' && voice !== 'loading' && voice !== 'on' && <p style={testStyles.text}>{voice}</p>}
            </>
          ) : (
            <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => countIn(start)}>
              Start the chart
            </button>
          )}
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
        {phase === 'chart' && voice === 'on' && ` · Listening${heard ? `, heard "${heard}"` : ''}`}
      </p>
    </Frame>
  );
}

//far vision, from 3 meters
export function FarChart(props: TestProps) {
  return (
    <EyeChart
      {...props}
      viewing={3000}
      lines={[200, 100, 70, 50, 40, 30, 25, 20, 15, 10]}
      aloud
      where="Put the screen at eye height and stand 3 meters (10 feet) back, wearing your usual glasses or contacts, with both eyes open. For each E, say which way its arms point: up, down, left or right. I can listen for you, or someone near the screen can tap it, or use the arrow keys on a keyboard you can reach. If you can't tell, guess – or say no."
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
      where="Hold the screen 40 cm (16 inches) from your eyes – about the length from your elbow to your fingertips – wearing your usual reading glasses if you use them, with both eyes open. For each E, tap which way its arms point, or use the arrow keys. If you can't tell, guess."
    />
  );
}

const styles: Record<string, CSSProperties> = {
  ways: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
    gap: 10,
  },
};
