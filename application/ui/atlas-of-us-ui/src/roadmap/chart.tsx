import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { Mascot } from '../shared_components/mascot';

const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const sand = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';
const ink: CSSProperties = { stroke: gunmetal, strokeLinejoin: 'round', strokeLinecap: 'round' };

const Thick = ({ d, w = 14, color }: { d: string; w?: number; color: string }) => (
  <>
    <path d={d} fill="none" strokeWidth={w} />
    <path d={d} fill="none" style={{ stroke: color }} strokeWidth={w - 5} />
  </>
);

const Eye = ({ x, y, r = 5 }: { x: number; y: number; r?: number }) => (
  <g className="comic-blink">
    <circle cx={x} cy={y} r={r} style={{ fill: '#fff' }} strokeWidth={2} />
    <circle cx={x + 1} cy={y + 1} r={r / 2.2} style={{ fill: gunmetal }} stroke="none" />
  </g>
);

//waves in front of whatever is coming up out of the sea
const Waves = ({ y, w }: { y: number; w: number }) => {
  const crest = `M0 ${y} ${'q10 -9 20 0 '.repeat(Math.ceil(w / 20))}`;
  return (
    <>
      <path d={`${crest}V${y + 40} H0Z`} style={{ fill: paleBlue }} stroke="none" />
      <path d={crest} fill="none" strokeWidth={3} />
    </>
  );
};

const STOPS = [
  {
    title: 'Your personality',
    icon: 'flag',
    body: "Personality tests are broken: a vague statement, five buttons, and nobody ever asks why. So we drop you into situations instead. A shipwreck, a party full of strangers, a ferry with one seat left. You decide what to do, tell us why, and we map you across the Big Five and the parts of being human it leaves out.",
  },
  { title: 'What you know', icon: 'books', body: 'A map of every idea people hold, true, disputed or flat-out wrong, and how deeply you hold each one.' },
  { title: 'What you can do', icon: 'anvil', body: 'Every skill from cooking to coding, measured from fumbling novice to effortless expert.' },
  { title: 'Your body', icon: 'mountain', body: 'The physical you, because what you can become depends on what you have to work with.' },
  { title: 'Your people', icon: 'huts', body: 'Friends, family, the places you work and the circles you move in.' },
  { title: 'Your stuff', icon: 'chest', body: "The things you own and use, which say more about you than you'd think." },
  { title: 'Your world', icon: 'volcano', body: "The places, events and works of art that make up the world you're living in." },
];

const COAST = 'M28 84 C14 58 40 30 78 36 C98 18 140 20 160 40 C186 50 192 86 170 104 C158 128 120 132 96 122 C70 134 36 118 28 84Z';

//landmarks, drawn around the middle of an island
const ICONS: Record<string, ReactNode> = {
  flag: (
    <>
      <path d="M58 92 l9 -10 l9 10 M122 98 l8 -9 l8 9 M130 70 l7 -8 l7 8" fill="none" strokeWidth={2.5} />
      <path d="M100 92 V36" fill="none" strokeWidth={4} />
      <path d="M100 38 C112 32 122 46 136 40 L134 62 C120 68 112 54 100 60Z" style={{ fill: brownRed }} strokeWidth={3} />
      <path d="M92 94 C96 88 104 88 108 94Z" style={{ fill: cinnamon }} strokeWidth={3} />
    </>
  ),
  books: (
    <g strokeWidth={3}>
      <rect x="74" y="80" width="52" height="12" rx="2" style={{ fill: blue }} />
      <rect x="80" y="68" width="44" height="12" rx="2" style={{ fill: brownRed }} transform="rotate(-4 100 74)" />
      <rect x="76" y="56" width="46" height="12" rx="2" style={{ fill: cinnamon }} transform="rotate(3 100 62)" />
      <path d="M102 56 V40 L112 48" fill="none" />
    </g>
  ),
  anvil: (
    <g strokeWidth={3}>
      <path d="M70 60 H128 C128 68 120 72 112 72 V82 H122 V92 H80 V82 H90 V72 C78 72 70 68 70 60Z" style={{ fill: gunmetal }} />
      <path d="M80 64 H118" style={{ stroke: ivory }} strokeWidth={2} />
      <path d="M118 30 L136 48 M110 38 L126 22 L134 30 L118 46Z" style={{ fill: cinnamon }} />
    </g>
  ),
  mountain: (
    <g strokeWidth={3}>
      <path d="M62 96 L92 44 L106 64 L116 52 L142 96Z" style={{ fill: blue }} />
      <path d="M84 58 L92 44 L100 55 L95 52 L90 60Z" style={{ fill: ivory }} />
    </g>
  ),
  huts: (
    <g strokeWidth={3}>
      <rect x="66" y="70" width="28" height="22" style={{ fill: sand }} />
      <path d="M60 72 L80 52 L100 72Z" style={{ fill: brownRed }} />
      <rect x="104" y="64" width="30" height="28" style={{ fill: sand }} />
      <path d="M98 66 L119 44 L140 66Z" style={{ fill: cinnamon }} />
      <rect x="114" y="78" width="10" height="14" style={{ fill: gunmetal }} />
    </g>
  ),
  chest: (
    <g strokeWidth={3}>
      <rect x="72" y="64" width="56" height="30" rx="3" style={{ fill: cinnamon }} />
      <path d="M72 64 C72 44 128 44 128 64Z" style={{ fill: cinnamon }} />
      <path d="M72 64 H128 M86 50 V94 M114 50 V94" fill="none" />
      <rect x="94" y="60" width="12" height="14" rx="2" style={{ fill: brownRed }} />
    </g>
  ),
  volcano: (
    <g strokeWidth={3}>
      <path d="M64 96 L88 54 H112 L136 96Z" style={{ fill: cinnamon }} />
      <path d="M88 54 C94 64 100 56 104 66 C108 58 110 62 112 54Z" style={{ fill: brownRed }} />
      <path d="M96 46 C86 46 86 34 96 34 C96 24 112 24 112 34 C122 32 124 44 114 46Z" style={{ fill: ivory }} strokeWidth={2.5} />
    </g>
  ),
  palm: (
    <>
      <Thick d="M104 98 C104 76 96 58 86 46" color={cinnamon} w={11} />
      <g strokeWidth={3} style={{ fill: blue }}>
        <path d="M86 46 C70 30 52 36 44 48 C58 42 72 44 86 46Z" />
        <path d="M86 46 C80 26 98 16 114 22 C102 26 92 34 86 46Z" />
        <path d="M86 46 C104 36 124 44 128 60 C116 50 100 46 86 46Z" />
        <path d="M86 46 C70 44 58 58 60 72 C68 60 76 52 86 46Z" />
      </g>
      <path d="M118 84 L148 108 M148 84 L118 108" style={{ stroke: gunmetal }} strokeWidth={11} />
      <path d="M118 84 L148 108 M148 84 L118 108" style={{ stroke: brownRed }} strokeWidth={6} />
    </>
  ),
};

//an island with a landmark. Uncharted ones are only a dashed guess at a coastline in the fog
function Isle({ charted = false, icon, size = 200 }: { charted?: boolean; icon: string; size?: number }) {
  return (
    <svg viewBox="-12 -12 224 172" width={size} style={{ flex: '0 0 auto', maxWidth: '100%', ...ink }} aria-hidden>
      <path d={COAST} transform="translate(100 78) scale(1.17) translate(-100 -78)" fill="none" strokeWidth={2} strokeDasharray="3 8" opacity={0.45} />
      <path d={COAST} transform="translate(5 6)" style={{ fill: charted ? sand : '#fff', opacity: charted ? 1 : 0.8 }} stroke="none" />
      <path d={COAST} fill="none" strokeWidth={4} strokeDasharray={charted ? undefined : '12 9'} />
      <g opacity={charted ? 1 : 0.55}>{ICONS[icon]}</g>
      {!charted && (
        <text x="160" y="52" style={{ fill: blue, fontFamily: comic, fontSize: 44 }} strokeWidth={2}>
          ?
        </text>
      )}
    </svg>
  );
}

//the dotted trail from one island to the next, drawn from the top left to the bottom right unless flipped
const Trail = ({ flip = false, style }: { flip?: boolean; style?: CSSProperties }) => (
  <svg viewBox="0 0 200 60" preserveAspectRatio="none" height={60} style={{ display: 'block', ...style }} aria-hidden>
    <path
      d={flip ? 'M200 0 C200 40 0 20 0 60' : 'M0 0 C0 40 200 20 200 60'}
      fill="none"
      style={{ stroke: brownRed }}
      strokeWidth={4}
      strokeDasharray="2 9"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

const Compass = () => (
  <svg viewBox="-52 -66 104 118" className="chart-compass" style={ink} aria-hidden>
    <g strokeWidth={2.5}>
      <circle r={44} style={{ fill: ivory }} />
      <circle r={36} fill="none" strokeWidth={1.5} strokeDasharray="3 4" />
      <path d="M0 -40 L7 -7 L40 0 L7 7 L0 40 L-7 7 L-40 0 L-7 -7Z" style={{ fill: sand }} />
      <path d="M22 -22 L4 -4 L22 22 L-4 4 L-22 22 L4 -4 M-22 -22 L-4 -4" fill="none" strokeWidth={1.5} />
      <path d="M0 -43 C-4 -47 -11 -50 -11 -56 C-11 -61 -4 -62 0 -57 C4 -62 11 -61 11 -56 C11 -50 4 -47 0 -43Z" style={{ fill: brownRed }} />
      <g className="atlas-compass">
        <path d="M-6 0 L0 -32 L6 0Z" style={{ fill: brownRed }} />
        <path d="M-6 0 L0 32 L6 0Z" style={{ fill: '#fff' }} />
      </g>
      <circle r={4} style={{ fill: gunmetal }} />
    </g>
  </svg>
);

const MONSTERS = [
  {
    name: 'The Moodweed',
    body: "Your mood today. A bad night's sleep isn't who you are.",
    art: (
      <>
        <path d="M70 40 C66 24 78 20 74 8 M82 38 C86 24 96 24 92 10" fill="none" style={{ stroke: blue }} strokeWidth={5} />
        <path d="M46 100 C42 56 62 36 80 36 C98 36 118 56 114 100Z" style={{ fill: cinnamon }} strokeWidth={3} />
        <path d="M60 62 C64 67 70 67 74 62 M88 62 C92 67 98 67 102 62 M72 80 C76 76 84 76 88 80" fill="none" strokeWidth={3} />
        <g className="atlas-bob" style={{ fill: blue, fontFamily: comic, fontSize: 20 }} stroke="none">
          <text x="116" y="40">z</text>
          <text x="130" y="24" fontSize={14}>z</text>
        </g>
      </>
    ),
  },
  {
    name: 'The Memory Kraken',
    body: "Your history. It shaped you, and we'll chart it one day.",
    art: (
      <>
        <Thick d="M28 100 C24 70 46 62 42 44 C40 34 28 36 30 44" color={brownRed} />
        <Thick d="M132 100 C138 74 116 62 124 40" color={brownRed} />
        <rect x="110" y="16" width="30" height="26" rx="2" transform="rotate(10 125 29)" style={{ fill: ivory }} strokeWidth={3} />
        <path d="M116 36 L122 28 L127 33 L131 27 L136 36" transform="rotate(10 125 29)" fill="none" strokeWidth={2} />
        <path d="M54 100 C52 62 108 62 106 100Z" style={{ fill: brownRed }} strokeWidth={3} />
        <circle cx="36" cy="70" r="2.5" style={{ fill: paleRed }} stroke="none" />
        <circle cx="130" cy="78" r="2.5" style={{ fill: paleRed }} stroke="none" />
        <Eye x={70} y={80} />
        <Eye x={90} y={80} />
      </>
    ),
  },
  {
    name: 'The Fibbing Serpent',
    body: "Lies, including the ones we tell ourselves. We'll gently point them out.",
    art: (
      <>
        <Thick d="M14 100 C18 66 44 66 48 100" color={blue} w={18} />
        <Thick d="M62 100 C66 60 92 60 96 100" color={blue} w={18} />
        <Thick d="M108 100 C106 80 110 68 120 60" color={blue} w={18} />
        <circle cx="124" cy="52" r="17" style={{ fill: blue }} strokeWidth={3} />
        <path d="M138 50 L160 44 L139 58Z" style={{ fill: blue }} strokeWidth={3} />
        <path d="M116 64 C120 68 126 68 130 64" fill="none" strokeWidth={2.5} />
        <Eye x={126} y={46} r={4.5} />
      </>
    ),
  },
];

//where the Atlas is headed, as an explorer's sea chart. Personality is the one island we've charted
export function Chart() {
  return (
    <section style={styles.sea}>
      <Compass />
      <div style={styles.cartouche}>
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={styles.ribbon} aria-hidden>
          <g style={ink} strokeWidth={4}>
            <path d="M44 22 L6 28 L22 54 L6 84 L50 80Z M44 22 L50 80 L60 70Z" style={{ fill: cinnamon }} vectorEffect="non-scaling-stroke" />
            <path d="M356 22 L394 28 L378 54 L394 84 L350 80Z M356 22 L350 80 L340 70Z" style={{ fill: cinnamon }} vectorEffect="non-scaling-stroke" />
            <path d="M40 14 Q200 2 360 14 L352 76 Q200 64 48 76Z" style={{ fill: sand }} vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        <h1 style={styles.title} className="comic-title">
          The Road Ahead
        </h1>
      </div>
      <div style={styles.guide}>
        <Mascot />
        <div style={styles.bubble} className="comic-bubble comic-pop">
          Nobody has ever mapped a whole person. Not your personality, not your skills, not your people. <em>All</em> of it.
          Here's our chart so far.
        </div>
      </div>

      {STOPS.map((s, i) => (
        <Fragment key={s.title}>
          {i > 0 && <Trail flip={i % 2 === 0} style={styles.trail} />}
          <div style={{ ...styles.row, flexDirection: i % 2 ? 'row-reverse' : 'row' }}>
            <Isle charted={!i} icon={s.icon} />
            <div style={{ ...styles.note, ...styles.label, rotate: `${i % 2 ? 0.6 : -0.6}deg` }}>
              <span style={{ ...styles.stamp, color: i ? blue : brownRed }} className="comic-stamp">
                {i ? 'Uncharted' : 'You are here'}
              </span>
              <h2 style={styles.heading}>{s.title}</h2>
              <p style={styles.text}>{s.body}</p>
            </div>
          </div>
        </Fragment>
      ))}

      <Trail flip={STOPS.length % 2 === 0} style={STOPS.length % 2 ? { margin: '0 50% 0 100px' } : { margin: '0 100px 0 50%' }} />
      <div style={styles.destination}>
        <Isle charted icon="palm" size={280} />
        <div style={{ ...styles.note, ...styles.destination }}>
          <span style={{ ...styles.stamp, color: brownRed }} className="comic-stamp">
            X marks the spot
          </span>
          <h2 style={{ ...styles.heading, fontSize: 'clamp(36px, 6vw, 56px)' }}>Who you could become</h2>
          <p style={styles.text}>
            Once we've mapped everything a human can be, and exactly where you stand on it, we can show you every road out from
            here. Real ones, grounded in who you actually are: which come naturally, which will be a climb, and the steps to get
            there.
          </p>
          <p style={styles.big}>If you've got dreams, we'll show you the way. If you don't, we'll give you some.</p>
        </div>
      </div>

      <div style={styles.edge}>
        <svg viewBox="0 0 400 70" style={styles.dragons} aria-label="Here be dragons">
          <path id="dragon-arc" d="M30 62 Q200 0 370 62" fill="none" />
          <text style={{ fill: brownRed, stroke: gunmetal, fontFamily: comic, fontSize: 40, letterSpacing: 3 }} strokeWidth={1}>
            <textPath href="#dragon-arc" startOffset="50%" textAnchor="middle">
              Here be dragons
            </textPath>
          </text>
        </svg>
        <p style={{ ...styles.note, ...styles.text, width: 'fit-content', margin: '0 auto' }}>Off the edge of the map, the things we don't chart yet.</p>
        <div style={styles.monsters}>
          {MONSTERS.map((m, i) => (
            <figure key={m.name} style={styles.monster}>
              <svg viewBox="0 0 160 120" style={{ width: '100%', ...ink }} aria-hidden>
                <g className="atlas-bob" style={{ animationDelay: `${i * -1}s` }}>
                  {m.art}
                </g>
                <Waves y={98} w={160} />
              </svg>
              <figcaption style={{ ...styles.note, marginTop: -4 }}>
                <strong style={styles.name}>{m.name}</strong>
                <p style={styles.text}>{m.body}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const WAVES = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='40'%3E%3Cpath d='M8 12 q6 -5 12 0 t12 0 M40 32 q6 -5 12 0 t12 0' fill='none' stroke='%236a8eae' stroke-opacity='0.35' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`;

const styles: Record<string, CSSProperties> = {
  sea: {
    position: 'relative',
    maxWidth: 1000,
    margin: '40px auto 0',
    padding: '48px clamp(16px, 4vw, 48px) 40px',
    background: `${WAVES}, var(--pale-blue)`,
    border: `4px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `6px 8px 0 ${gunmetal}`,
  },
  cartouche: {
    position: 'relative',
    maxWidth: 640,
    margin: '0 auto 36px',
    padding: '22px 15% 30px',
  },
  ribbon: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  title: {
    position: 'relative',
    fontSize: 'clamp(36px, 7vw, 76px)',
    textAlign: 'center',
  },
  guide: {
    maxWidth: 760,
    margin: '0 auto 40px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    flex: '1 1 260px',
    '--tilt': '-1deg',
  } as CSSProperties,
  trail: {
    margin: '0 100px',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 28px',
  },
  //a scrap of paper pinned to the chart, so text stays readable over the waves
  note: {
    padding: '12px 16px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `4px 5px 0 rgba(57, 61, 63, 0.25)`,
  },
  label: {
    flex: '1 1 260px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stamp: {
    alignSelf: 'flex-start',
    fontSize: 16,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 'clamp(28px, 4.5vw, 36px)',
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.35,
  },
  big: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.3,
    color: blue,
  },
  destination: {
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    textAlign: 'center',
  },
  edge: {
    margin: '56px -8px 0',
    paddingTop: 28,
    borderTop: `4px dashed ${gunmetal}`,
  },
  dragons: {
    display: 'block',
    width: 'min(100%, 460px)',
    margin: '0 auto',
  },
  monsters: {
    marginTop: 20,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
  },
  monster: {
    margin: 0,
    textAlign: 'center',
  },
  name: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
};
