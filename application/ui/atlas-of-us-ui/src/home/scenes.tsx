import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const skin = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';

//the pivot for an arm that swings from his right shoulder
const RIGHT: CSSProperties = { transformBox: 'view-box', transformOrigin: '72px 68px' };

const Limb = ({ d, w = 15 }: { d: string; w?: number }) => (
  <>
    <path d={d} fill="none" strokeWidth={w} />
    <path d={d} fill="none" style={{ stroke: skin }} strokeWidth={w - 5.5} />
  </>
);

const Hand = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r="5.5" style={{ fill: skin }} />;

const HIP = (
  <>
    <Limb d="M28 68 C14 78 18 92 30 92" />
    <Hand x={30} y={92} />
  </>
);

//Atlas, kneeling, as in the mascot. Arms go behind him so a moving arm's shoulder stays hidden; props go in front
const Atlas = ({ back, front, head }: { back: ReactNode; front?: ReactNode; head?: string }) => (
  <g style={{ stroke: gunmetal }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-30 119 L130 119" fill="none" strokeWidth="2" opacity="0.4" />
    {back}
    <Limb d="M40 100 L40 116 L20 116 M60 100 L82 96 L83 116" />
    <path d="M14 117 L21 117 M78 117 L89 117" fill="none" style={{ stroke: cinnamon }} strokeWidth="3.5" />
    <path d="M23 66 C23 80 33 90 37 94 L63 94 C67 90 77 80 77 66 C64 58 36 58 23 66 Z" style={{ fill: skin }} />
    <path d="M52 73 C58 77 66 76 72 71" fill="none" strokeWidth="2" />
    <path d="M24 66 L40 62 L66 92 L52 94 Z" style={{ fill: ivory }} />
    <path d="M35 93 L65 93 L68 105 L32 105 Z" style={{ fill: ivory }} />
    <path d="M43 94 L41 104 M50 94 L50 104 M57 94 L59 104" fill="none" strokeWidth="2" />
    <path d="M36 92 L64 92" fill="none" style={{ stroke: brownRed }} strokeWidth="4" />
    <g className={head}>
      <circle cx="50" cy="59" r="11" style={{ fill: skin }} />
      <path d="M39 56 C36 43 64 43 61 56 C56 51 44 51 39 56 Z" style={{ fill: cinnamon }} />
      <path d="M39 59 C39 77 61 77 61 59 C57 69 43 69 39 59 Z" style={{ fill: cinnamon }} />
      <path d="M40 51 C46 48 54 48 60 51" fill="none" style={{ stroke: brownRed }} strokeWidth="3" />
      <path d="M42 54 L47 55.5 M58 54 L53 55.5" fill="none" strokeWidth="2.5" />
      <g className="comic-blink" style={{ fill: gunmetal, stroke: 'none' }}>
        <ellipse cx="45" cy="59" rx="2" ry="3" />
        <ellipse cx="55" cy="59" rx="2" ry="3" />
      </g>
      <path d="M45 63.5 C48 65.5 52 65.5 55 63.5" fill="none" strokeWidth="2.5" />
    </g>
    {front}
  </g>
);

const Heart = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 8 C-10 2 -9 -7 -3 -6 C-1 -6 0 -4 0 -3 C0 -4 1 -6 3 -6 C9 -7 10 2 0 8Z"
    style={{ fill: brownRed }}
    strokeWidth={2 / s}
  />
);

//every part of a person we map, with Atlas acting it out
const LAYERS: { name: string; note: string; scene: ReactNode }[] = [
  {
    name: 'Personality',
    note: "How you tick. We map you across the full spectrum of human personality (based on the last ~100 years of Psychology) by dropping you into situations and asking you what you would do in each situation and WHY.",
    scene: (
      <Atlas
        back={
          <>
            {HIP}
            <Limb d="M72 68 C86 80 70 84 60 72" />
          </>
        }
        front={
          <>
            <Hand x={59} y={71} />
            <circle className="scene-pop" cx="68" cy="42" r="2.5" style={{ fill: '#fff' }} strokeWidth={2} />
            <circle className="scene-pop" cx="76" cy="32" r="4" style={{ fill: '#fff', animationDelay: '0.2s' }} strokeWidth={2} />
            <g className="scene-pop" style={{ animationDelay: '0.4s' }}>
              <path d="M78 18 C72 8 82 -2 92 2 C98 -6 112 -4 114 6 C124 8 122 24 112 24 C108 32 92 32 88 26 C78 28 72 22 78 18Z" style={{ fill: '#fff' }} strokeWidth={2.5} />
              <g className="scene-beat">
                <Heart x={97} y={13} s={1.1} />
              </g>
            </g>
          </>
        }
      />
    ),
  },
  {
    name: 'What you know',
    note: 'There are an infinite number of things you could know about in this world, but each person has their own unique set of things they understand. We help you figure out your specific set as well as the things you might be missing. After all - you might be capable of a million different things, but that capability is wasted if you don\'t know about it!',
    scene: (
      <Atlas
        head="scene-read"
        back={
          <>
            <Limb d="M28 68 C20 80 26 88 32 86" />
            <Limb d="M72 68 C80 80 74 88 68 86" />
          </>
        }
        front={
          <>
            <path d="M28 78 Q40 72 50 79 Q60 72 72 78 V96 Q60 90 50 97 Q40 90 28 96Z" style={{ fill: paleBlue }} />
            <path d="M34 82 Q40 79 46 83 M34 87 Q40 84 46 88 M54 83 Q60 79 66 82 M54 88 Q60 84 66 87" fill="none" strokeWidth={1.5} />
            <path className="scene-flip" d="M50 79 Q60 72 72 78 V96 Q60 90 50 97Z" style={{ fill: '#fff' }} strokeWidth={2.5} />
            <Hand x={30} y={88} />
            <Hand x={70} y={88} />
          </>
        }
      />
    ),
  },
  {
    name: 'What you can do',
    note: 'Every skill from cooking to coding, measured from fumbling novice to effortless expert. The specific combination of different skills is unique to almost everyone, and shapes the possibilities of life!',
    scene: (
      <Atlas
        back={HIP}
        front={
          <>
            <path d="M80 98 H112 Q108 104 102 104 V112 H108 V119 H84 V112 H90 V104 Q84 103 80 98Z" style={{ fill: gunmetal }} />
            <g className="scene-hammer" style={RIGHT}>
              <Limb d="M72 68 C80 74 84 80 86 86" />
              <path d="M86 86 L100 88" fill="none" strokeWidth={6} />
              <path d="M86 86 L100 88" fill="none" style={{ stroke: cinnamon }} strokeWidth={2.5} />
              <rect x="97" y="80" width="9" height="18" rx="2" transform="rotate(8 101 89)" style={{ fill: blue }} />
              <Hand x={86} y={86} />
            </g>
            <path className="scene-spark" d="M96 92 L90 86 M106 90 L112 84 M100 90 L100 82 M110 96 L118 94" fill="none" style={{ stroke: brownRed }} strokeWidth={2.5} />
          </>
        }
      />
    ),
  },
  {
    name: 'Your body',
    note: 'Each person has a set of innate abilities that gates what they can and cannot do, and indicates performing better or wose in different situations. We measure almost all of them to give you a clear picture of what you would be good at.',
    scene: (
      <Atlas
        back={
          <g className="scene-lift">
            <Limb d="M28 68 C16 56 20 42 26 34" />
            <Limb d="M72 68 C84 56 80 42 74 34" />
            <path d="M-4 32 H104" fill="none" strokeWidth={4} />
            <rect x="0" y="20" width="8" height="24" rx="2" style={{ fill: brownRed }} />
            <rect x="-7" y="24" width="6" height="16" rx="2" style={{ fill: brownRed }} />
            <rect x="92" y="20" width="8" height="24" rx="2" style={{ fill: brownRed }} />
            <rect x="101" y="24" width="6" height="16" rx="2" style={{ fill: brownRed }} />
            <Hand x={26} y={32} />
            <Hand x={74} y={32} />
          </g>
        }
        front={<path className="scene-sweat" d="M64 47 C61.5 51 62 53 64 53 C66 53 66.5 51 64 47 Z" style={{ fill: paleBlue }} strokeWidth="1.5" />}
      />
    ),
  }
];

//Atlas acting out each part of a person we map, one at a time. Moves on every few seconds, or click through
export function Scenes() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + LAYERS.length) % LAYERS.length);

  useEffect(() => {
    const t = setTimeout(() => setI((i + 1) % LAYERS.length), 10000);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <div style={styles.scenes}>
      <svg key={i} viewBox="-36 -26 176 150" style={styles.stage} className="comic-pop" aria-hidden>
        {LAYERS[i].scene}
      </svg>

      <div style={styles.panel}>
        <div key={i} className="comic-pop" style={styles.card}>
          <span style={styles.count}>
            {i + 1} of {LAYERS.length}
          </span>
          <h3 style={styles.name}>{LAYERS[i].name}</h3>
          <p style={styles.text}>{LAYERS[i].note}</p>
        </div>
        <div style={styles.controls}>
          <button className="comic-lift" style={styles.arrow} aria-label="Previous" onClick={() => go(i - 1)}>
            ◀
          </button>
          <div style={styles.row}>
            {LAYERS.map((l, n) => (
              <button
                key={l.name}
                aria-label={l.name}
                style={n === i ? { ...styles.dot, background: brownRed, color: ivory } : styles.dot}
                onClick={() => go(n)}
              >
                {n + 1}
              </button>
            ))}
          </div>
          <button className="comic-lift" style={styles.arrow} aria-label="Next" onClick={() => go(i + 1)}>
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  scenes: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px 32px',
  },
  stage: {
    flex: '1 1 220px',
    maxWidth: 400,
    overflow: 'visible',
  },
  panel: {
    flex: '1 1 240px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    minHeight: 192,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  count: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    lineHeight: '32px',
    color: brownRed,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 'clamp(30px, 4.5vw, 40px)',
    letterSpacing: 1,
    lineHeight: 1.4,
    color: blue,
  },
  text: {
    margin: 0,
    fontSize: 20,
    lineHeight: '32px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  arrow: {
    flex: '0 0 auto',
    padding: '2px 12px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontSize: 18,
    color: gunmetal,
  },
  row: {
    flex: '1 1 auto',
    minWidth: 0,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 26,
    height: 26,
    padding: 0,
    display: 'grid',
    placeItems: 'center',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '50%',
    fontFamily: comic,
    fontSize: 14,
    lineHeight: 1,
    color: brownRed,
    cursor: 'pointer',
  },
};
