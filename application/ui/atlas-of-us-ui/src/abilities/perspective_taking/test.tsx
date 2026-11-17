import { type CSSProperties, type PointerEvent, type ReactNode, useRef, useState } from 'react';
import { blue, brownRed, gunmetal, ivory } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, mean, testStyles, useCountdown, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { MAP, type Perspective, PERSPECTIVE_ITEMS, PERSPECTIVE_PRACTICE, turn } from './items';

//how far off an answer not given counts as: what pointing anywhere at random averages
const UNANSWERED = 90;

//each thing on the map drawn small, centered on where it stands, so pointing from one to another is pointing between
//their middles
const LINE = { fill: 'none', stroke: gunmetal, strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const SOLID = { stroke: gunmetal, strokeWidth: 1, strokeLinejoin: 'round' } as const;
const DRAWN: Record<string, ReactNode> = {
  Bench: (
    <>
      <rect x={-6.5} y={-5} width={13} height={2.4} rx={0.6} fill="#c98b5a" {...SOLID} />
      <rect x={-6.5} y={-1} width={13} height={2.4} rx={0.6} fill="#c98b5a" {...SOLID} />
      <path d="M -5 1.4 V 5 M 5 1.4 V 5" {...LINE} />
    </>
  ),
  Well: (
    <>
      <path d="M -5 -1 V -6 M 5 -1 V -6" {...LINE} />
      <path d="M -7 -6 L 0 -10 L 7 -6 Z" fill="#ad2831" {...SOLID} />
      <path d="M -5.5 -1 H 5.5 V 4.5 Q 0 6.5 -5.5 4.5 Z" fill="#9aa3ab" {...SOLID} />
      <path d="M 0 -6 V -2" {...LINE} />
    </>
  ),
  Flag: (
    <>
      <path d="M 0 6 V -7" {...LINE} />
      <path d="M 0 -7 L 7 -4.5 L 0 -2 Z" fill="#d2453b" {...SOLID} />
      <path d="M -2.5 6 H 2.5" {...LINE} />
    </>
  ),
  Tent: (
    <>
      <path d="M -7.5 5 L 0 -6.5 L 7.5 5 Z" fill="#2f9a5a" fillOpacity={0.55} {...SOLID} />
      <path d="M -2.2 5 L 0 0.5 L 2.2 5 Z" fill={gunmetal} />
    </>
  ),
  Barrel: (
    <>
      <path d="M -4 -5.5 Q -5.6 0 -4 5.5 H 4 Q 5.6 0 4 -5.5 Z" fill="#e8862a" fillOpacity={0.7} {...SOLID} />
      <path d="M -4.8 -2 H 4.8 M -4.8 2 H 4.8" {...LINE} />
    </>
  ),
  Cart: (
    <>
      <path d="M 6 -2.5 L 9 -6" {...LINE} />
      <rect x={-6.5} y={-4} width={12.5} height={5.5} rx={0.6} fill="#c98b5a" {...SOLID} />
      <circle cx={-3.5} cy={3.2} r={2.2} fill="#fff" {...SOLID} />
      <circle cx={3.5} cy={3.2} r={2.2} fill="#fff" {...SOLID} />
    </>
  ),
  Lamp: (
    <>
      <path d="M 0 6 V -3.5 M -2.5 6 H 2.5" {...LINE} />
      <path d="M -3 -3.5 H 3 L 2 -8 H -2 Z" fill="#f2c84b" {...SOLID} />
      <path d="M -2.5 -8 H 2.5" {...LINE} />
    </>
  ),
};

function MapView() {
  return (
    <svg viewBox="-10 -12 120 124" style={styles.map} role="img" aria-label={`A map of a ${MAP.map((m) => m.name.toLowerCase()).join(', ')}`}>
      <rect x={-10} y={-12} width={120} height={124} fill={ivory} />
      {MAP.map((m) => (
        <g key={m.name} transform={`translate(${m.x * 100} ${m.y * 100})`}>
          {DRAWN[m.name]}
          <text y={12.5} textAnchor="middle" fontSize={5.5} fontFamily="inherit" fill={gunmetal}>
            {m.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

//a point on the circle, at degrees clockwise from the top
const onCircle = (degrees: number, r: number) => [r * Math.sin((degrees * Math.PI) / 180), -r * Math.cos((degrees * Math.PI) / 180)];

//the circle a person points on: standing at the middle, facing the top
function Pointer({ item, pointed, shown, onPoint }: { item: Perspective; pointed: number | null; shown: boolean; onPoint: (degrees: number) => void }) {
  const point = (e: PointerEvent<SVGSVGElement>) => {
    if (shown || (e.type === 'pointermove' && !e.buttons)) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    onPoint(Math.round((Math.atan2(x, -y) * 180) / Math.PI));
  };
  const line = (degrees: number, color: string) => {
    const [x, y] = onCircle(degrees, 44);
    return <line x1={0} y1={0} x2={x} y2={y} stroke={color} strokeWidth={2.2} strokeLinecap="round" />;
  };
  return (
    <svg viewBox="-60 -60 120 120" style={styles.pointer} onPointerDown={point} onPointerMove={point} role="img" aria-label="Point on the circle">
      <circle cx={0} cy={0} r={44} fill="#fff" stroke={gunmetal} strokeWidth={1.2} />
      <line x1={0} y1={0} x2={0} y2={-44} stroke={gunmetal} strokeWidth={1.2} strokeDasharray="3 2" />
      <text x={0} y={-49} textAnchor="middle" fontSize={7} fill={gunmetal}>{MAP[item.facing].name}</text>
      <text x={0} y={10} textAnchor="middle" fontSize={6} fill={gunmetal}>{MAP[item.at].name}</text>
      <circle cx={0} cy={0} r={2.2} fill={gunmetal} />
      {shown && line(item.angle, blue)}
      {pointed !== null && line(pointed, brownRed)}
    </svg>
  );
}

//spatial orientation: imagine standing at one thing, facing a second, and point to a third. The score is how far off
//the pointing is on average, in degrees
export function PerspectiveTaking({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [pointed, setPointed] = useState<number | null>(null);
  const [told, setTold] = useState<number | null>(null); //how far off a practice answer was
  const errors = useRef<number[]>([]);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const missed = PERSPECTIVE_ITEMS.length - errors.current.length;
    const all = [...errors.current, ...Array<number>(missed).fill(UNANSWERED)];
    setPhase('done');
    const score = Math.round(mean(all));
    onDone(score, {
      how: `Your score is how far off your pointing was on average, in degrees, so lower is better: ${score}. Any not reached before the time ran out count as ${UNANSWERED} degrees off, what pointing at random averages.`,
      parts: PERSPECTIVE_ITEMS.map((p, i) => ({
        label: `${i + 1}`,
        note: `At the ${MAP[p.at].name}, facing the ${MAP[p.facing].name}, to the ${MAP[p.target].name}: ${
          i < errors.current.length ? `${errors.current[i]} degrees off` : `not reached, counted as ${UNANSWERED} off`
        }`,
      })),
    });
  };
  const left = useCountdown(TIMED.perspective.seconds, phase === 'timed', finish);

  const list = phase === 'practice' ? PERSPECTIVE_PRACTICE : PERSPECTIVE_ITEMS;
  const item = list[at];

  const next = () => {
    if (pointed === null) return;
    const off = Math.abs(turn(item.angle, pointed));
    if (phase === 'practice' && told === null) return setTold(off);
    setPointed(null);
    setTold(null);
    if (phase === 'practice') {
      if (at + 1 < PERSPECTIVE_PRACTICE.length) setAt(at + 1);
      else {
        setAt(0);
        setPhase('between');
      }
      return;
    }
    errors.current.push(off);
    if (at + 1 < PERSPECTIVE_ITEMS.length) setAt(at + 1);
    else finish();
  };

  const asking = (phase === 'practice' || phase === 'timed') && item;
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Each question uses the map. Imagine you're standing at the first thing it names, facing the second, and work
          out which way the third would be from there. Then point to it on the circle by tapping or dragging – the top
          of the circle is straight ahead of you. Keep the screen as it is rather than turning it, as the turning has to
          happen in your head. You'll start with two practice questions, and after each one I'll show you the right
          direction. Then come the {TIMED.perspective.count} that count, and you have {clock(TIMED.perspective.seconds)}{' '}
          for them.
        </p>
      }
    >
      {!asking ? (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button
              type="button"
              className="comic-lift"
              style={testStyles.primary}
              onClick={() =>
                countIn(() => {
                  setAt(0);
                  setPhase(phase === 'ready' ? 'practice' : 'timed');
                })
              }
            >
              {phase === 'ready' ? 'Start the practice' : `Start: ${PERSPECTIVE_ITEMS.length} in ${clock(TIMED.perspective.seconds)}`}
            </button>
          )}
        </div>
      ) : (
        <div style={styles.perspective}>
          <MapView />
          <div style={styles.respond}>
            <p style={styles.ask}>
              Standing at the <strong>{MAP[item.at].name}</strong>, facing the <strong>{MAP[item.facing].name}</strong>.
              Point to the <strong>{MAP[item.target].name}</strong>.
            </p>
            <Pointer item={item} pointed={pointed} shown={told !== null} onPoint={setPointed} />
            {told !== null && <p style={testStyles.text}>You were {told} degrees off. The blue line is right.</p>}
            <button type="button" className="comic-lift" style={testStyles.primary} disabled={pointed === null} onClick={next}>
              {told === null && phase === 'practice' ? 'Check it' : 'Next'}
            </button>
          </div>
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${PERSPECTIVE_PRACTICE.length}`}
        {phase === 'between' && `Practice done. Now ${PERSPECTIVE_ITEMS.length} that count, with ${clock(TIMED.perspective.seconds)} on the clock.`}
        {phase === 'timed' && `${at + 1} of ${PERSPECTIVE_ITEMS.length} · ${clock(left)} left`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  perspective: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  map: {
    flex: '1 1 260px',
    maxWidth: 380,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
  },
  respond: {
    flex: '1 1 240px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ask: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  pointer: {
    width: '100%',
    maxWidth: 280,
    touchAction: 'none',
    cursor: 'crosshair',
  },
};
