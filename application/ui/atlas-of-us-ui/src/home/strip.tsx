import type { CSSProperties, ReactNode } from 'react';
import { Mascot } from '../shared_components/mascot';

const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const skin = 'var(--pale-cinnamon)';
const words: CSSProperties = { fill: gunmetal, stroke: 'none', fontFamily: 'var(--font-hand)' };
const shout: CSSProperties = { stroke: gunmetal, fontFamily: 'var(--font-comic)', letterSpacing: 1 };

const Limb = ({ d, w = 8, color = skin }: { d: string; w?: number; color?: string }) => (
  <>
    <path d={d} fill="none" strokeWidth={w} />
    <path d={d} fill="none" style={{ stroke: color }} strokeWidth={w - 3.5} />
  </>
);

const Arm = ({ d }: { d: string }) => {
  const [x, y] = d.split(' ').slice(-2);
  return (
    <>
      <Limb d={d} />
      <circle cx={x} cy={y} r="3.8" style={{ fill: skin }} strokeWidth="2.5" />
    </>
  );
};

const Eyes = ({ dx = 0, dy = 0, big = false }) => (
  <g className="comic-blink" style={{ fill: gunmetal, stroke: 'none' }}>
    <ellipse cx={4 + dx} cy={-118 + dy} rx={big ? 2.4 : 1.8} ry={big ? 3.4 : 2.8} />
    <ellipse cx={13 + dx} cy={-118 + dy} rx={big ? 2.4 : 1.8} ry={big ? 3.4 : 2.8} />
  </g>
);

const Face = ({ brows, mouth, fill = 'none', eyes = <Eyes /> }: { brows?: string; mouth: string; fill?: string; eyes?: ReactNode }) => (
  <>
    {eyes}
    {brows && <path d={brows} fill="none" strokeWidth="2.2" />}
    <path d={mouth} style={{ fill }} strokeWidth="2.2" />
  </>
);

const FACES = {
  neutral: <Face eyes={<Eyes dx={1} />} mouth="M6 -108 C8 -107 11 -107 13 -108" />,
  smile: <Face brows="M1 -125 L6 -126 M10 -126 L15 -125" mouth="M3 -109 C6 -103 12 -103 15 -109" />,
  grin: <Face brows="M1 -125 L6 -127 M10 -127 L15 -125" mouth="M2 -110 C4 -100 14 -100 16 -110 Z" fill="#fff" />,
  smirk: <Face brows="M1 -124 L6 -124 M9 -127 C11 -129 14 -128 16 -126" mouth="M4 -107 C8 -105 12 -106 15 -111" />,
  eager: <Face eyes={<Eyes big />} brows="M0 -127 L6 -129 M10 -129 L16 -127" mouth="M5 -110 C5 -103 13 -103 13 -110 Z" fill={brownRed} />,
  worried: <Face eyes={<Eyes dx={-2} />} brows="M0 -122 L5 -126 M10 -126 L15 -122" mouth="M4 -107 C6 -109 8 -105 10 -107 C12 -109 13 -106 15 -107" />,
  confused: <Face eyes={<Eyes dy={-1} />} brows="M0 -127 L6 -124 M10 -129 L16 -128" mouth="M5 -107 C7 -109 9 -105 11 -107 C12 -108 13 -107 15 -108" />,
  sad: <Face eyes={<Eyes dy={2} />} brows="M0 -121 L5 -123 M11 -123 L16 -121" mouth="M5 -105 C7 -108 11 -108 13 -105" />,
  determined: <Face brows="M0 -125 L6 -122 M10 -122 L16 -125" mouth="M5 -109 C8 -106 11 -106 14 -110" />,
};

const SWEAT = <path d="M-10 -136 C-13 -131 -12.5 -129 -10 -129 C-7.5 -129 -7 -131 -10 -136 Z" style={{ fill: paleBlue }} strokeWidth="1.5" />;

//the head is a circle of radius 17 at (2, -117), facing right
const HAIR = {
  andrew: 'M-16 -110 L-21 -123 L-15 -128 L-16 -140 L-6 -136 L-2 -146 L5 -138 L12 -145 L14 -134 L23 -134 L19 -121 C15 -127 10 -126 7 -130 C3 -125 -2 -127 -5 -122 C-8 -118 -12 -114 -16 -110 Z',
  luluBack: 'M-4 -137 C-22 -138 -30 -122 -29 -102 C-29 -88 -30 -76 -26 -64 C-18 -66 -10 -68 -4 -70 L14 -86 C20 -94 22 -104 21 -114 C21 -130 10 -138 -4 -137 Z',
  luluTop: 'M-18 -96 C-26 -112 -24 -138 -2 -139 C14 -140 22 -130 20 -116 C14 -126 6 -130 -2 -127 C-8 -120 -10 -108 -18 -96 Z',
  luluShine: 'M-12 -128 C-8 -133 -2 -135 4 -135',
};

//one of the two partygoers, drawn facing right with the feet at the origin. flip turns them to face left,
//lean tips the upper body, and children (things in hand) sit between the body and the front arm
function Person(p: { lulu?: boolean; x: number; y?: number; s?: number; flip?: boolean; lean?: number; arms: [string, string]; face: ReactNode; children?: ReactNode }) {
  const shirt = p.lulu ? brownRed : blue;
  return (
    <g transform={`translate(${p.x} ${p.y ?? 262}) scale(${p.flip ? -(p.s ?? 1) : (p.s ?? 1)} ${p.s ?? 1})`}>
      {p.lulu ? <Limb d="M-7 -40 L-8 -4 M7 -40 L9 -4" /> : <Limb d="M-7 -52 L-8 -4 M7 -52 L9 -4" w={12} color={cinnamon} />}
      <path d="M-16 -1 C-16 -8 -4 -8 -2 -1 Z M3 -1 C3 -8 15 -8 17 -1 Z" style={{ fill: gunmetal }} strokeWidth="2" />
      <g transform={`rotate(${p.lean ?? 0} 0 -52)`}>
        {/* lulu's long hair falls behind her head and shoulders */}
        {p.lulu && <path d={HAIR.luluBack} style={{ fill: gunmetal }} />}
        <Arm d={p.arms[0]} />
        <path
          d={p.lulu ? 'M-14 -98 C-17 -80 -14 -64 -11 -58 L-20 -30 L20 -30 L11 -58 C14 -64 17 -80 14 -98 C5 -103 -5 -103 -14 -98 Z' : 'M-16 -98 C-20 -80 -17 -62 -14 -48 L14 -48 C17 -62 20 -80 16 -98 C6 -104 -6 -104 -16 -98 Z'}
          style={{ fill: shirt }}
        />
        <circle cx="2" cy="-117" r="17" style={{ fill: skin }} />
        <ellipse cx="-11" cy="-114" rx="3" ry="4.5" style={{ fill: skin }} strokeWidth="2" />
        <path d={p.lulu ? HAIR.luluTop : HAIR.andrew} style={{ fill: gunmetal }} />
        {/* a little shine, so it reads as silky */}
        {p.lulu && <path d={HAIR.luluShine} fill="none" style={{ stroke: ivory, opacity: 0.55 }} strokeWidth="1.6" strokeLinecap="round" />}
        {p.face}
        {p.children}
        <Arm d={p.arms[1]} />
      </g>
    </g>
  );
}

const Cup = ({ x, y, r = 0, spill = false }: { x: number; y: number; r?: number; spill?: boolean }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    {spill && <path d="M-4 -12 C-6 -16 -5 -18 -4 -18 C-3 -18 -2 -16 -4 -12 Z M2 -16 C0 -20 1 -22 2 -22 C3 -22 4 -20 2 -16 Z" style={{ fill: paleBlue }} strokeWidth="1.2" />}
    <path d="M-5.5 -7 L5.5 -7 L4 6 L-4 6 Z" style={{ fill: brownRed }} strokeWidth="2" />
    <path d="M-5 -4 L5 -4" style={{ stroke: ivory }} strokeWidth="1.5" />
  </g>
);

//a speech bubble with its tail pointing down at (tx, ty), and a line of text per entry in lines
function Bubble({ x, y, w, tail: [tx, ty], lines, tilt = 0, size = 15 }: { x: number; y: number; w: number; tail: [number, number]; lines: ReactNode[]; tilt?: number; size?: number }) {
  const h = lines.length * size * 1.15 + 12;
  const r = 14;
  const b = Math.min(Math.max(tx - 8, x + r), x + w - r - 14);
  return (
    <g transform={`rotate(${tilt} ${x + w / 2} ${y + h / 2})`}>
      <path
        d={`M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${b + 14} L${tx} ${ty} L${b} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`}
        style={{ fill: '#fff' }}
        strokeWidth="2.5"
      />
      <text y={y + 4 + size} textAnchor="middle" fontSize={size} style={words}>
        {lines.map((l, i) => (
          <tspan key={i} x={x + w / 2} dy={i ? size * 1.15 : 0}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

const Em = ({ children }: { children: ReactNode }) => <tspan style={{ fill: brownRed }}>{children}</tspan>;

const BULBS = [[37, 33], [79, 37], [120, 34], [200, 34], [241, 37], [283, 33]];

//the room: a wall, a wooden floor and, at the party, a string of lights
const Room = ({ wall, lights = true }: { wall: string; lights?: boolean }) => (
  <>
    <rect width="320" height="280" style={{ fill: wall, stroke: 'none' }} />
    <path d="M-5 250 H325 V285 H-5 Z" style={{ fill: skin }} />
    {lights && (
      <>
        <path d="M-5 18 Q80 46 160 20 Q240 46 325 18" fill="none" strokeWidth="1.5" />
        {BULBS.map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r="4" style={{ fill: [brownRed, blue, ivory][i % 3] }} strokeWidth="1.5" />
        ))}
      </>
    )}
  </>
);

const ANDREW = {
  hang: 'M-10 -94 C-15 -80 -15 -66 -13 -56',
  cup: 'M10 -94 C14 -80 18 -72 24 -70',
};
const LULU = {
  hang: 'M-10 -94 C-15 -80 -15 -66 -13 -56',
  hipBack: 'M-10 -94 C-24 -86 -24 -72 -14 -62',
  hipFront: 'M10 -94 C24 -86 24 -72 14 -62',
};

const FOCUS = Array.from({ length: 20 }, (_, i) => {
  const a = (i * Math.PI) / 10;
  return `M${160 + Math.cos(a) * 70} ${140 + Math.sin(a) * 70} L${160 + Math.cos(a) * 260} ${140 + Math.sin(a) * 260}`;
}).join(' ');

const PANELS: { label: string; fill: string; art: ReactNode }[] = [
  {
    label: "Saturday night. A party full of strangers. Andrew stands alone by the snacks. Lulu walks over: Hi! I'm Lulu. So... who are you?",
    fill: 'var(--pale-blue)',
    art: (
      <>
        <Room wall={ivory} />
        <g style={{ fill: paleBlue, stroke: 'none' }}>
          {[[150, 1], [188, 0.85], [292, 1.05], [36, 0.9]].map(([x, s]) => (
            <g key={x} transform={`translate(${x} 252) scale(${s})`}>
              <path d="M-17 0 C-19 -40 -15 -70 0 -72 C15 -70 19 -40 17 0 Z" />
              <circle cy="-86" r="14" />
            </g>
          ))}
        </g>
        <rect x="6" y="206" width="66" height="8" style={{ fill: cinnamon }} strokeWidth="2.5" />
        <path d="M12 214 L12 250 M66 214 L66 250" fill="none" strokeWidth="3" />
        <path d="M20 206 C20 194 46 194 46 206 Z" style={{ fill: '#fff' }} strokeWidth="2.5" />
        <path d="M25 198 L30 194 L33 199 M36 197 L41 194 L42 199" style={{ fill: cinnamon }} strokeWidth="1.5" />
        <Person x={102} s={0.85} arms={[ANDREW.hang, ANDREW.cup]} face={FACES.neutral}>
          <Cup x={26} y={-73} />
        </Person>
        <Person lulu x={244} s={0.85} flip arms={[LULU.hang, 'M10 -94 C20 -102 24 -116 22 -130']} face={FACES.grin} />
        <rect x="8" y="8" width="168" height="40" style={{ fill: paleRed }} strokeWidth="2.5" />
        <text x="16" y="25" fontSize="14" style={{ ...shout, fill: gunmetal, stroke: 'none' }}>
          <tspan>SATURDAY NIGHT.</tspan>
          <tspan x="16" dy="16">A PARTY FULL OF STRANGERS.</tspan>
        </text>
        <Bubble x={176} y={62} w={136} tail={[236, 150]} lines={["Hi! I'm Lulu.", 'So... who are you?']} />
      </>
    ),
  },
  {
    label: "Andrew, confidently: Oh! I'm Andrew. I'm a software engineer. Lulu: No, no. That's your job. Who are you?",
    fill: 'var(--pale-cinnamon)',
    art: (
      <>
        <Room wall={paleBlue} />
        <Person x={88} arms={[ANDREW.hang, 'M10 -94 C22 -94 28 -104 28 -114']} face={FACES.smile}>
          <Cup x={29} y={-118} r={8} />
        </Person>
        <Person lulu x={236} flip arms={[LULU.hipBack, LULU.hipFront]} face={FACES.smirk} />
        <Bubble x={10} y={14} w={156} tail={[92, 124]} lines={["Oh! I'm Andrew.", "I'm a software engineer."]} />
        <Bubble x={150} y={68} w={162} tail={[236, 124]} lines={[<>No, no. That's your <Em>job</Em>.</>, <>Who are <Em>you</Em>?</>]} />
      </>
    ),
  },
  {
    label: 'Lulu leans in, firing off questions: What are you like? What do you know? What can you do? Who do you want to become? Andrew leans back, sweating.',
    fill: 'var(--pale-red)',
    art: (
      <>
        <Room wall={paleRed} />
        <Person x={66} lean={-12} arms={['M-10 -94 C0 -84 14 -88 22 -98', 'M10 -94 C20 -86 28 -92 32 -104']} face={FACES.worried}>
          {SWEAT}
        </Person>
        <Person lulu x={218} flip lean={14} arms={[LULU.hang, 'M10 -94 C22 -96 32 -96 42 -100']} face={FACES.eager} />
        <Bubble x={142} y={10} w={146} tail={[214, 140]} lines={['What are you like?']} tilt={3} />
        <Bubble x={92} y={40} w={150} tail={[212, 140]} lines={['What do you know?']} tilt={-3} />
        <Bubble x={160} y={70} w={146} tail={[210, 140]} lines={['What can you do?']} tilt={2} />
        <Bubble x={86} y={102} w={206} tail={[208, 140]} lines={[<>Who do you want to <Em>become</Em>?!</>]} size={16} tilt={-2} />
      </>
    ),
  },
  {
    label: 'Close up on Andrew, scratching their head, a big question mark floating overhead. Scratch scratch.',
    fill: 'var(--pale-blue)',
    art: (
      <>
        <rect width="320" height="280" style={{ fill: ivory, stroke: 'none' }} />
        <path d={FOCUS} fill="none" style={{ stroke: paleBlue }} strokeWidth="6" />
        <Person x={150} y={372} s={1.9} arms={['M-10 -94 C-24 -88 -30 -78 -30 -66', 'M10 -94 C30 -96 30 -128 12 -136']} face={FACES.confused}>
          <Cup x={-31} y={-70} r={-55} spill />
        </Person>
        <path d="M200 52 C206 46 214 46 218 52 M206 40 C214 34 224 36 228 44" fill="none" strokeWidth="2.5" />
        <text x="232" y="112" fontSize="96" transform="rotate(12 250 80)" style={{ ...shout, fill: ivory }} strokeWidth="3">
          ?
        </text>
        <text x="20" y="54" fontSize="30" transform="rotate(-10 20 54)" style={{ ...shout, fill: brownRed }} strokeWidth="1.2">
          SCRATCH
        </text>
        <text x="44" y="88" fontSize="24" transform="rotate(-6 44 88)" style={{ ...shout, fill: brownRed }} strokeWidth="1.2">
          SCRATCH
        </text>
      </>
    ),
  },
  {
    label: "Andrew slumps: I... honestly have no idea. Lulu grins: Nobody does. That's the fun part.",
    fill: 'var(--pale-cinnamon)',
    art: (
      <>
        <Room wall={paleBlue} />
        <Person x={88} lean={8} arms={['M-10 -94 C-12 -78 -10 -64 -8 -52', 'M10 -94 C14 -78 14 -64 14 -52']} face={FACES.sad}>
          <Cup x={15} y={-46} r={18} />
        </Person>
        <Person lulu x={236} flip arms={[LULU.hipBack, 'M10 -94 C22 -90 26 -98 28 -108']} face={FACES.smirk} />
        <Bubble x={10} y={14} w={150} tail={[90, 124]} lines={['I... honestly', 'have no idea.']} />
        <Bubble x={150} y={62} w={160} tail={[236, 124]} lines={['Nobody does.', <>That's the <Em>fun</Em> part.</>]} />
      </>
    ),
  },
  {
    label: 'Lulu points at Andrew\'s phone: Go figure it out at atlas-of-us.com. Andrew, determined: ...Okay. I will. On a side table, a little statue of Atlas holds up the world.',
    fill: 'var(--pale-red)',
    art: (
      <>
        <Room wall={ivory} />
        <rect x="244" y="200" width="80" height="8" style={{ fill: cinnamon }} strokeWidth="2.5" />
        <path d="M252 208 L252 250 M314 208 L314 250" fill="none" strokeWidth="3" />
        <path d="M254 200 L256 192 L306 192 L308 200 Z" style={{ fill: '#fff' }} strokeWidth="2.5" />
        <g transform="translate(247 109) scale(0.72)">
          <Mascot />
        </g>
        <Person x={72} arms={[ANDREW.hang, 'M10 -94 C16 -82 20 -78 28 -84']} face={FACES.determined}>
          <g transform="translate(31 -92) rotate(-10)">
            <rect x="-7" y="-11" width="14" height="22" rx="2.5" style={{ fill: gunmetal }} strokeWidth="2" />
            <rect x="-4.5" y="-8" width="9" height="15" style={{ fill: paleBlue, stroke: 'none' }} />
            <circle cy="-1" r="3" style={{ fill: blue, stroke: 'none' }} />
          </g>
        </Person>
        <Person lulu x={200} flip arms={[LULU.hang, 'M10 -94 C22 -92 34 -90 46 -94']} face={FACES.smile} />
        <Bubble x={112} y={12} w={196} tail={[200, 124]} lines={['Go figure it out at', <Em>atlas-of-us.com</Em>]} size={17} />
        <Bubble x={8} y={58} w={100} tail={[74, 124]} lines={['...Okay.', 'I will.']} />
      </>
    ),
  },
];

//the home page's comic: Andrew is asked who they are at a party, has no idea, and is sent to find out
export function Strip() {
  return (
    <div style={styles.strip}>
      {PANELS.map((p, i) => (
        <figure key={i} style={{ ...styles.panel, '--panel-fill': p.fill, '--tilt': `${[-0.6, 0.5, -0.4, 0.6, -0.5, 0.4][i]}deg`, animationDelay: `${i * 140}ms` } as CSSProperties} className="comic-panel comic-pop">
          <svg viewBox="0 0 320 280" style={styles.art} role="img" aria-label={p.label}>
            <g style={{ stroke: gunmetal }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {p.art}
            </g>
          </svg>
        </figure>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  strip: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: 24,
  },
  panel: {
    margin: 0,
    borderRadius: 'var(--wobbly)',
  },
  art: {
    display: 'block',
    width: '100%',
    height: 'auto',
    borderRadius: 'var(--wobbly)',
  },
};
