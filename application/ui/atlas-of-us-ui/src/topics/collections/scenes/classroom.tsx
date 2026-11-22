import type { CSSProperties } from 'react';

// The classroom wall the whiteboard hangs on, drawn the way the rest of the Atlas is: flat colors inside thick, slightly
// wobbly ink lines. It's SVG in a fixed 1600x900 space, scaled to cover the screen from the middle, so on a narrow
// screen the board hides the middle of the wall and the banner, clock and paneling still show around it. Everything
// that matters sits at the sides and along the top and bottom, clear of the board.

const W = 1600;
const H = 900;
const INK = '#393d3f';
const C = {
  wall: '#efe6cf',
  wallShade: '#e4d9bd',
  rail: '#a86b3c',
  panel: '#c98d58',
  panelDark: '#b07746',
  floor: '#8a5a36',
  floorLine: '#6f4529',
  sky: '#bcd9ec',
  cloud: '#ffffff',
  frame: '#f7f3ea',
  sea: '#a9cfe6',
  land: '#b9d79a',
  red: '#c0392b',
  blue: '#3f6fa8',
  green: '#4f9a63',
  yellow: '#e8b93f',
  paper: '#fffdf6',
};

const ink = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const thin = { ...ink, strokeWidth: 3 };

//the alphabet banner's cards, each a letter in a color, hung edge to edge across the top of the wall
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CARD_COLORS = [C.red, C.blue, C.green, C.yellow];

export function Classroom() {
  return (
    <svg style={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {/* the wall, with a little shading toward the corners */}
      <rect width={W} height={H} fill={C.wall} />
      <rect width={W} height={H} fill="url(#corners)" />
      <defs>
        <radialGradient id="corners" cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor={C.wallShade} stopOpacity="0" />
          <stop offset="100%" stopColor={C.wallShade} stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* the alphabet banner along the top */}
      <path d={`M0 22 Q ${W / 2} 36 ${W} 22`} fill="none" {...thin} />
      {LETTERS.map((letter, i) => {
        const x = 10 + i * (W - 20) / LETTERS.length;
        const w = (W - 20) / LETTERS.length - 8;
        const y = 26 + Math.sin((i / (LETTERS.length - 1)) * Math.PI) * 10;
        const color = CARD_COLORS[i % CARD_COLORS.length];
        return (
          <g key={letter} transform={`rotate(${(i % 3) - 1} ${x + w / 2} ${y})`}>
            <rect x={x} y={y} width={w} height={50} rx={4} fill={C.paper} {...thin} />
            <rect x={x + 4} y={y + 4} width={w - 8} height={8} fill={color} />
            <text x={x + w / 2} y={y + 42} textAnchor="middle" fontFamily="var(--font-comic)" fontSize="28" fill={color}>
              {letter}
            </text>
          </g>
        );
      })}

      {/* a window on the left, with sky and a cloud */}
      <g>
        <rect x={40} y={150} width={210} height={330} rx={6} fill={C.frame} {...ink} />
        <rect x={58} y={168} width={174} height={294} fill={C.sky} {...thin} />
        <path d="M80 250 q12 -22 34 -12 q10 -18 32 -6 q22 -4 22 16 q14 6 4 18 h-86 q-16 -6 -6 -16 z" fill={C.cloud} {...thin} />
        <line x1={145} y1={168} x2={145} y2={462} {...ink} />
        <line x1={58} y1={315} x2={232} y2={315} {...ink} />
        <rect x={30} y={472} width={230} height={16} rx={4} fill={C.frame} {...ink} />
        {/* a plant on the sill */}
        <path d="M120 470 l6 -44 h38 l6 44 z" fill={C.red} {...thin} />
        <path d="M145 428 q-30 -40 -6 -70 q4 34 6 70 q4 -46 36 -60 q-10 40 -36 60" fill={C.green} {...thin} />
      </g>

      {/* a world map poster on the right */}
      <g transform="translate(0 50) rotate(1.5 1430 260)">
        <rect x={1330} y={140} width={220} height={150} fill={C.sea} {...ink} />
        <path d="M1360 178 q22 -14 44 0 q6 22 -10 38 q-18 6 -26 -10 q-14 -10 -8 -28 z" fill={C.land} {...thin} />
        <path d="M1384 222 q14 4 14 22 q-4 26 -14 30 q-8 -22 0 -52 z" fill={C.land} {...thin} />
        <path d="M1440 168 q30 -8 60 4 q20 18 4 30 q-26 4 -34 22 q-18 -4 -22 -22 q-14 -16 -8 -34 z" fill={C.land} {...thin} />
        <path d="M1470 236 q16 -2 22 14 q-6 18 -20 18 q-8 -14 -2 -32 z" fill={C.land} {...thin} />
        <path d="M1510 246 q16 0 18 12 q-6 10 -18 6 z" fill={C.land} {...thin} />
        <circle cx={1340} cy={150} r={5} fill={C.red} stroke={INK} strokeWidth={2} />
        <circle cx={1540} cy={150} r={5} fill={C.red} stroke={INK} strokeWidth={2} />
      </g>

      {/* the clock, on the right under the banner */}
      <g>
        <circle cx={1450} cy={132} r={42} fill={C.paper} {...ink} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line key={i} x1={1450 + Math.sin(a) * 32} y1={132 - Math.cos(a) * 32} x2={1450 + Math.sin(a) * 37} y2={132 - Math.cos(a) * 37}
              stroke={INK} strokeWidth={3} strokeLinecap="round" />
          );
        })}
        <line x1={1450} y1={132} x2={1450} y2={106} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <line x1={1450} y1={132} x2={1470} y2={140} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx={1450} cy={132} r={4} fill={C.red} />
      </g>

      {/* a bookshelf below the map */}
      <g transform="translate(0 50)">
        <rect x={1340} y={330} width={210} height={170} fill={C.panel} {...ink} />
        <line x1={1340} y1={415} x2={1550} y2={415} {...ink} />
        {[
          [1356, 340, 22, 70, C.red], [1380, 350, 18, 60, C.blue], [1400, 344, 24, 66, C.yellow], [1426, 356, 16, 54, C.green],
          [1446, 346, 22, 64, C.blue], [1472, 362, 40, 14, C.red], [1472, 380, 40, 14, C.green], [1472, 398, 40, 12, C.yellow],
          [1356, 426, 26, 68, C.green], [1384, 432, 20, 62, C.yellow], [1406, 428, 24, 66, C.red], [1432, 440, 18, 54, C.blue],
          [1452, 430, 22, 64, C.green],
        ].map(([x, y, w, h, fill], i) => (
          <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} rx={2} fill={fill as string} {...thin} />
        ))}
        {/* a globe on the top shelf */}
        <circle cx={1522} cy={386} r={20} fill={C.sea} {...thin} />
        <path d="M1512 378 q8 -6 14 2 q-2 10 -10 8 z" fill={C.land} stroke={INK} strokeWidth={2} />
        <line x1={1522} y1={406} x2={1522} y2={414} {...thin} />
      </g>

      {/* the wainscot below the chair rail, and the floor */}
      <rect x={0} y={600} width={W} height={220} fill={C.panel} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={20 + i * 178} y={630} width={150} height={160} rx={4} fill={C.panelDark} {...thin} />
      ))}
      <rect x={0} y={584} width={W} height={20} fill={C.rail} {...ink} />
      <rect x={0} y={820} width={W} height={80} fill={C.floor} />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={i * 220 + 60} y1={820} x2={i * 220 + 20} y2={900} stroke={C.floorLine} strokeWidth={3} />
      ))}
      <line x1={0} y1={820} x2={W} y2={820} {...ink} />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  svg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
};
