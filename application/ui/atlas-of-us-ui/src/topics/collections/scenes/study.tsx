import type { CSSProperties } from 'react';

// A study at home for Digital Knowledge, with the board hung on the wall above the desk, drawn the way the rest of the
// Atlas is: flat colors inside thick ink lines. It's SVG in a fixed 1600x900 space, scaled to cover the screen from the
// middle, the same as the classroom. The board covers the middle of the wall, so the bookcase with the router stands at
// the left, the clock and the monitor with its crossed-out password note are at the right, the shelf of books runs
// along the top, and the desk with the keyboard, the mug and the tangle of cables runs along the bottom.

const W = 1600;
const H = 900;
const INK = '#393d3f';
const C = {
  wall: '#dde4ea',
  wallShade: '#c9d3dc',
  wood: '#b07746',
  woodDark: '#8a5a32',
  woodLight: '#c99462',
  floor: '#b9a487',
  floorLine: '#a48f72',
  paper: '#fffdf6',
  screen: '#2f4a5f',
  screenGlow: '#4f7a96',
  plastic: '#f1f1ee',
  plasticShade: '#d9d9d4',
  black: '#4a4f52',
  red: '#c0392b',
  blue: '#3f6fa8',
  green: '#4f9a63',
  yellow: '#e8b93f',
  teal: '#3a8f8a',
  plant: '#5f9a5a',
  pot: '#c46a45',
};

const ink = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const thin = { ...ink, strokeWidth: 3 };
const hair = { ...ink, strokeWidth: 2 };

//the books along the top shelf, as [width, height, color], left to right with gaps between the groups
const SHELF_BOOKS: [number, number, string][] = [
  [26, 62, C.red], [22, 54, C.blue], [30, 66, C.yellow], [24, 58, C.green], [28, 50, C.teal],
  [24, 64, C.blue], [30, 56, C.red], [22, 60, C.woodLight], [26, 66, C.green],
];
//the desk top's height above the floor, and where the floor starts
const DESK_TOP = 610;
const FLOOR = 830;

export function Study() {
  return (
    <svg style={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="study-corners" cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor={C.wallShade} stopOpacity="0" />
          <stop offset="100%" stopColor={C.wallShade} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={C.wall} />
      <rect width={W} height={H} fill="url(#study-corners)" />

      {/* the shelf of books along the top, with a plant and a little speaker */}
      <rect x={0} y={90} width={W} height={14} fill={C.wood} {...ink} />
      {[200, 1400].map((x) => (
        <path key={x} d={`M${x} 104 v24 h-24`} fill="none" stroke={C.woodDark} strokeWidth={8} strokeLinecap="round" />
      ))}
      {[40, 470, 920, 1240].map((start, group) => {
        let x = start;
        return (
          <g key={start}>
            {SHELF_BOOKS.slice(group * 2, group * 2 + 4).map(([w, h, color], i) => {
              const book = <rect key={i} x={x} y={90 - h} width={w} height={h} rx={2} fill={color} {...thin} />;
              x += w + 2;
              return book;
            })}
          </g>
        );
      })}
      {/* a plant trailing over the edge */}
      <g>
        <path d="M720 90 l6 -40 h44 l6 40 z" fill={C.pot} {...thin} />
        <path d="M748 50 q-30 -30 -10 -44 M748 50 q4 -40 24 -42 M748 50 q36 -14 44 6" fill="none" stroke={C.plant} strokeWidth={8} strokeLinecap="round" />
        <path d="M730 90 q-14 40 -4 70 M770 90 q16 30 6 60" fill="none" stroke={C.plant} strokeWidth={6} strokeLinecap="round" />
        <circle cx={726} cy={160} r={7} fill={C.plant} {...hair} />
        <circle cx={776} cy={150} r={7} fill={C.plant} {...hair} />
      </g>
      {/* a little speaker */}
      <g>
        <rect x={1110} y={40} width={60} height={50} rx={8} fill={C.black} {...thin} />
        <circle cx={1140} cy={66} r={14} fill={C.plasticShade} {...hair} />
        <circle cx={1140} cy={66} r={5} fill={C.black} />
      </g>

      {/* the bookcase on the left, with the router and its signal on the middle shelf */}
      <g transform="translate(30 0)">
        <rect x={40} y={170} width={260} height={FLOOR - 170} fill={C.woodLight} {...ink} />
        <rect x={56} y={186} width={228} height={FLOOR - 186} fill={C.woodDark} opacity={0.35} />
        {[330, 500, 670].map((y) => (
          <rect key={y} x={44} y={y} width={252} height={14} fill={C.wood} {...thin} />
        ))}
        {/* books on the top shelf */}
        {[[64, 26, 118, C.blue], [92, 22, 104, C.red], [116, 30, 122, C.green], [148, 24, 98, C.yellow]].map(([x, w, h, color]) => (
          <rect key={x} x={x as number} y={330 - (h as number)} width={w as number} height={h as number} rx={2} fill={color as string} {...thin} />
        ))}
        <path d="M200 330 l40 -92 l22 8 l-40 92 z" fill={C.teal} {...thin} />
        {/* the router, its antennas, its lights and its signal */}
        <rect x={90} y={460} width={160} height={40} rx={8} fill={C.plastic} {...thin} />
        <rect x={98} y={492} width={144} height={8} fill={C.plasticShade} />
        {[110, 230].map((x) => (
          <path key={x} d={`M${x} 462 l${x < 170 ? -12 : 12} -70`} stroke={C.black} strokeWidth={8} strokeLinecap="round" />
        ))}
        {[130, 150, 170, 190, 210].map((x, i) => (
          <circle key={x} cx={x} cy={476} r={5} fill={i === 3 ? C.yellow : C.green} {...hair} />
        ))}
        {[34, 58, 82].map((r) => (
          <path key={r} d={`M${170 - r} ${420 - r * 0.3} q${r} ${-r} ${r * 2} 0`} fill="none" stroke={C.teal} strokeWidth={5} strokeLinecap="round" />
        ))}
        {/* box files and a backup drive on the bottom shelves */}
        {[66, 122, 178].map((x, i) => (
          <g key={x}>
            <rect x={x} y={556} width={48} height={114} rx={3} fill={[C.blue, C.red, C.green][i]} {...thin} />
            <rect x={x + 10} y={572} width={28} height={18} fill={C.paper} {...hair} />
          </g>
        ))}
        <rect x={110} y={736} width={120} height={50} rx={10} fill={C.black} {...thin} />
        <circle cx={212} cy={762} r={5} fill={C.blue} />
        <path d="M110 760 q-40 10 -30 70" fill="none" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
      </g>

      {/* the clock on the right wall */}
      <g transform="translate(-30 0)">
        <circle cx={1440} cy={220} r={62} fill={C.paper} stroke={C.wood} strokeWidth={14} />
        <circle cx={1440} cy={220} r={62} fill="none" {...ink} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <line key={i} x1={1440 + Math.sin(a) * 44} y1={220 - Math.cos(a) * 44} x2={1440 + Math.sin(a) * 52} y2={220 - Math.cos(a) * 52}
              stroke={INK} strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" />
          );
        })}
        <line x1={1440} y1={220} x2={1440} y2={186} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={1440} y1={220} x2={1468} y2={234} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <circle cx={1440} cy={220} r={5} fill={C.red} />
      </g>

      {/* the monitor on the desk at the right, with the crossed-out password note stuck to its edge */}
      <g transform="translate(-30 0)">
        <rect x={1290} y={370} width={260} height={170} rx={10} fill={C.black} {...ink} />
        <rect x={1304} y={384} width={232} height={142} rx={4} fill={C.screen} />
        {/* a login form on the screen */}
        <rect x={1360} y={410} width={120} height={18} rx={4} fill={C.screenGlow} />
        <rect x={1360} y={438} width={120} height={18} rx={4} fill={C.screenGlow} />
        <rect x={1390} y={468} width={60} height={20} rx={6} fill={C.teal} />
        <path d="M1400 540 h40 l12 52 h-64 z" fill={C.black} {...thin} />
        <rect x={1370} y={590} width={100} height={14} rx={4} fill={C.black} {...thin} />
        {/* the sticky note */}
        <g transform="rotate(7 1470 390)">
          <rect x={1416} y={354} width={108} height={72} fill={C.yellow} {...hair} />
          <text x={1470} y={396} textAnchor="middle" fontFamily="'Comic Neue', 'Comic Sans MS', cursive" fontSize={14} fontWeight={700} fill={INK}>
            password123
          </text>
          <line x1={1424} y1={400} x2={1516} y2={382} stroke={C.red} strokeWidth={4} strokeLinecap="round" />
        </g>
      </g>

      {/* the desk */}
      <rect x={330} y={DESK_TOP} width={W - 330} height={22} fill={C.wood} {...ink} />
      <rect x={340} y={DESK_TOP + 22} width={W - 350} height={70} fill={C.woodDark} {...thin} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={360 + i * 300} y={DESK_TOP + 34} width={260} height={46} rx={4} fill={C.wood} {...thin} />
          <rect x={470 + i * 300} y={DESK_TOP + 52} width={40} height={8} rx={4} fill={C.plasticShade} {...hair} />
        </g>
      ))}
      <rect x={360} y={DESK_TOP + 92} width={24} height={FLOOR - DESK_TOP - 92} fill={C.woodDark} {...thin} />
      <rect x={W - 50} y={DESK_TOP + 92} width={24} height={FLOOR - DESK_TOP - 92} fill={C.woodDark} {...thin} />

      {/* on the desk in front of the monitor: the keyboard, the mouse and the mug */}
      <g>
        <rect x={1250} y={DESK_TOP - 18} width={130} height={20} rx={5} fill={C.plastic} {...thin} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={1260 + i * 14.5} y={DESK_TOP - 14} width={10} height={6} rx={1} fill={C.plasticShade} />
        ))}
        <ellipse cx={1404} cy={DESK_TOP - 9} rx={16} ry={10} fill={C.plastic} {...thin} />
        <rect x={1436} y={DESK_TOP - 50} width={42} height={50} rx={6} fill={C.red} {...thin} />
        <path d="M1478 572 q20 0 20 14 q0 12 -20 12" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d="M1448 550 q6 -14 0 -24 M1464 550 q6 -14 0 -24" fill="none" stroke={C.plasticShade} strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* the floor, in boards */}
      <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={C.floor} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 200 + (i % 2) * 60} y1={FLOOR} x2={i * 200 + (i % 2) * 60} y2={H} stroke={C.floorLine} strokeWidth={3} />
      ))}
      <line x1={0} y1={865} x2={W} y2={865} stroke={C.floorLine} strokeWidth={3} />
      <line x1={0} y1={FLOOR} x2={W} y2={FLOOR} {...ink} />

      {/* the power strip on the floor under the desk, with its tangle of cables */}
      <g>
        <rect x={1060} y={FLOOR + 18} width={170} height={28} rx={6} fill={C.plastic} {...thin} />
        {[1088, 1124, 1160, 1196].map((x) => (
          <rect key={x} x={x - 8} y={FLOOR + 24} width={16} height={16} rx={3} fill={C.black} />
        ))}
        <path d={`M1088 ${FLOOR + 24} q-30 -60 30 -100 q30 -20 10 -50`} fill="none" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
        <path d={`M1124 ${FLOOR + 24} q10 -70 -50 -96 q-30 -14 -26 -54`} fill="none" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
        <path d={`M1160 ${FLOOR + 24} q40 -50 110 -70 q40 -12 40 -80`} fill="none" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
        <path d={`M1230 ${FLOOR + 32} h120 q30 0 30 30`} fill="none" stroke={C.black} strokeWidth={5} strokeLinecap="round" />
      </g>
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
