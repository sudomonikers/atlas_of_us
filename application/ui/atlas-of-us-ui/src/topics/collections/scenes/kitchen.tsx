import type { CSSProperties } from 'react';

// A kitchen wall for Life Knowledge, with the board hung on it as the household's board, drawn the way the rest of the
// Atlas is: flat colors inside thick ink lines. It's SVG in a fixed 1600x900 space, scaled to cover the screen from the
// middle, the same as the classroom. The board covers the middle of the wall, so the fridge stands at the left, the
// corkboard of bills, the calendar and the keys hang at the right, and the cabinets run along the top and bottom.

const W = 1600;
const H = 900;
const INK = '#393d3f';
const C = {
  wall: '#e4ead6',
  wallShade: '#d5ddc4',
  cabinet: '#f4efe2',
  cabinetPanel: '#e9e2cf',
  wood: '#b07746',
  counter: '#8f9ba3',
  counterEdge: '#77838b',
  tile: '#f6f3ea',
  tileLine: '#d9d3c3',
  floorLight: '#ddd0b3',
  floorDark: '#c6b493',
  fridge: '#f8f7f3',
  fridgeShade: '#e6e4dd',
  cork: '#c9a06a',
  paper: '#fffdf6',
  red: '#c0392b',
  blue: '#3f6fa8',
  green: '#4f9a63',
  yellow: '#e8b93f',
  brass: '#c9a23f',
  steel: '#b8bec4',
};

const ink = { stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const thin = { ...ink, strokeWidth: 3 };
const hair = { ...ink, strokeWidth: 2 };

//the upper cabinets along the top, eight doors across
const UPPER_DOORS = 8;
//the base cabinets under the counter, from the fridge to the right edge
const BASE_LEFT = 330;
const BASE_DOORS = 7;

export function Kitchen() {
  const baseWidth = (W - BASE_LEFT) / BASE_DOORS;
  return (
    <svg style={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="kitchen-corners" cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor={C.wallShade} stopOpacity="0" />
          <stop offset="100%" stopColor={C.wallShade} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={C.wall} />
      <rect width={W} height={H} fill="url(#kitchen-corners)" />

      {/* the tiled backsplash above the counter */}
      <rect x={BASE_LEFT} y={470} width={W - BASE_LEFT} height={120} fill={C.tile} />
      {Array.from({ length: 4 }, (_, i) => (
        <line key={`h${i}`} x1={BASE_LEFT} y1={470 + i * 30} x2={W} y2={470 + i * 30} stroke={C.tileLine} strokeWidth={2} />
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <line key={`v${i}`} x1={BASE_LEFT + i * 60} y1={470} x2={BASE_LEFT + i * 60} y2={590} stroke={C.tileLine} strokeWidth={2} />
      ))}

      {/* the upper cabinets along the top */}
      <rect x={0} y={0} width={W} height={92} fill={C.cabinet} />
      {Array.from({ length: UPPER_DOORS }, (_, i) => {
        const w = W / UPPER_DOORS;
        const x = i * w;
        return (
          <g key={i}>
            <rect x={x + 8} y={6} width={w - 16} height={74} rx={4} fill={C.cabinet} {...thin} />
            <rect x={x + 22} y={16} width={w - 44} height={54} rx={3} fill={C.cabinetPanel} {...hair} />
            <circle cx={i % 2 ? x + 20 : x + w - 20} cy={68} r={5} fill={C.brass} {...hair} />
          </g>
        );
      })}
      <rect x={0} y={86} width={W} height={10} fill={C.wood} {...ink} />

      {/* the fridge on the left, with a drawing and a shopping list stuck on it */}
      <g transform="translate(30 0)">
        <rect x={50} y={130} width={240} height={690} rx={14} fill={C.fridge} {...ink} />
        <line x1={50} y1={330} x2={290} y2={330} {...ink} />
        <rect x={262} y={170} width={12} height={110} rx={6} fill={C.steel} {...thin} />
        <rect x={262} y={370} width={12} height={170} rx={6} fill={C.steel} {...thin} />
        <rect x={56} y={790} width={228} height={24} fill={C.fridgeShade} />
        {/* a child's drawing of a house in the sun */}
        <g transform="rotate(-4 140 230)">
          <rect x={86} y={170} width={120} height={110} fill={C.paper} {...thin} />
          <circle cx={180} cy={192} r={12} fill={C.yellow} {...hair} />
          <path d="M108 262 v-34 l26 -22 l26 22 v34 z" fill={C.red} {...hair} />
          <rect x={126} y={240} width={14} height={22} fill={C.blue} {...hair} />
          <path d="M92 270 q30 -8 108 0" fill="none" stroke={C.green} strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle cx={146} cy={168} r={8} fill={C.green} {...hair} />
        {/* the shopping list */}
        <g transform="rotate(3 150 450)">
          <rect x={92} y={380} width={120} height={160} fill={C.paper} {...thin} />
          <rect x={92} y={380} width={120} height={16} fill={C.yellow} {...hair} />
          {[414, 436, 458, 480, 502, 524].map((y, i) => (
            <line key={y} x1={104} y1={y} x2={104 + [86, 64, 92, 50, 76, 58][i]} y2={y} stroke={C.blue} strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>
        <circle cx={150} cy={378} r={8} fill={C.red} {...hair} />
        <rect x={200} y={600} width={34} height={34} rx={6} fill={C.yellow} {...hair} />
        <circle cx={110} cy={640} r={14} fill={C.blue} {...hair} />
      </g>

      {/* the corkboard on the right, with a bill, the calendar, a receipt and a sticky note */}
      <g transform="translate(-40 0)">
        <rect x={1300} y={130} width={250} height={210} rx={6} fill={C.cork} stroke={C.wood} strokeWidth={10} />
        <rect x={1300} y={130} width={250} height={210} rx={6} fill="none" {...ink} />
        {/* a bill with a red stamp */}
        <g transform="rotate(-3 1360 210)">
          <rect x={1318} y={150} width={88} height={118} fill={C.paper} {...thin} />
          <rect x={1318} y={150} width={88} height={14} fill={C.blue} {...hair} />
          {[180, 194, 208, 222].map((y) => (
            <line key={y} x1={1328} y1={y} x2={1394} y2={y} stroke={INK} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
          ))}
          <circle cx={1378} cy={248} r={13} fill="none" stroke={C.red} strokeWidth={4} />
        </g>
        <circle cx={1362} cy={150} r={6} fill={C.red} {...hair} />
        {/* the calendar */}
        <g>
          <rect x={1420} y={146} width={112} height={120} fill={C.paper} {...thin} />
          <rect x={1420} y={146} width={112} height={22} fill={C.red} {...thin} />
          {Array.from({ length: 20 }, (_, i) => {
            const x = 1428 + (i % 5) * 20;
            const y = 176 + Math.floor(i / 5) * 21;
            return <rect key={i} x={x} y={y} width={16} height={16} fill={i === 8 ? C.yellow : 'none'} stroke={INK} strokeWidth={1.5} />;
          })}
        </g>
        <circle cx={1476} cy={146} r={6} fill={C.blue} {...hair} />
        {/* a receipt */}
        <path d="M1340 282 h44 v46 l-5.5 -6 l-5.5 6 l-5.5 -6 l-5.5 6 l-5.5 -6 l-5.5 6 l-5.5 -6 l-5.5 6 z" fill={C.paper} {...hair} />
        <circle cx={1362} cy={284} r={5} fill={C.green} {...hair} />
        {/* a sticky note */}
        <rect x={1446} y={280} width={50} height={46} fill={C.yellow} {...hair} transform="rotate(5 1471 303)" />
      </g>

      {/* the key rack under the corkboard */}
      <g transform="translate(-40 0)">
        <rect x={1330} y={372} width={190} height={22} rx={4} fill={C.wood} {...thin} />
        {[1360, 1405, 1450, 1495].map((x) => (
          <path key={x} d={`M${x} 394 v14 q0 8 8 8`} fill="none" stroke={C.steel} strokeWidth={5} strokeLinecap="round" />
        ))}
        {/* a set of keys on the first hook */}
        <circle cx={1366} cy={424} r={10} fill="none" stroke={C.brass} strokeWidth={4} />
        <path d="M1360 432 l-10 34 l8 2 l2 -6 l5 1 l2 -6" fill={C.brass} {...hair} />
        <path d="M1372 432 l8 30 l-7 3" fill="none" stroke={C.steel} strokeWidth={5} strokeLinecap="round" />
        {/* a lanyard on the third */}
        <path d="M1456 414 q-14 40 0 62 q14 -22 0 -62" fill="none" stroke={C.blue} strokeWidth={5} strokeLinecap="round" />
        <rect x={1446} y={474} width={22} height={16} rx={3} fill={C.paper} {...hair} />
      </g>

      {/* the counter and the base cabinets under it */}
      <rect x={BASE_LEFT - 10} y={590} width={W - BASE_LEFT + 10} height={24} fill={C.counter} {...ink} />
      <rect x={BASE_LEFT - 10} y={606} width={W - BASE_LEFT + 10} height={8} fill={C.counterEdge} />
      <rect x={BASE_LEFT} y={614} width={W - BASE_LEFT} height={206} fill={C.cabinet} />
      {Array.from({ length: BASE_DOORS }, (_, i) => {
        const x = BASE_LEFT + i * baseWidth;
        return (
          <g key={i}>
            <rect x={x + 8} y={624} width={baseWidth - 16} height={44} rx={4} fill={C.cabinet} {...thin} />
            <rect x={x + baseWidth / 2 - 22} y={642} width={44} height={8} rx={4} fill={C.steel} {...hair} />
            <rect x={x + 8} y={678} width={baseWidth - 16} height={132} rx={4} fill={C.cabinet} {...thin} />
            <rect x={x + 22} y={692} width={baseWidth - 44} height={104} rx={3} fill={C.cabinetPanel} {...hair} />
          </g>
        );
      })}

      {/* the kettle and the fruit bowl on the counter at the right */}
      <g transform="translate(-20 0)">
        <path d="M1300 590 l8 -62 q24 -14 48 0 l8 62 z" fill={C.red} {...thin} />
        <path d="M1310 528 q22 -30 44 0" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M1362 550 q22 -4 26 -22" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <circle cx={1332} cy={514} r={5} fill={INK} />
      </g>
      <g>
        <circle cx={1448} cy={560} r={18} fill={C.red} {...thin} />
        <circle cx={1478} cy={556} r={18} fill={C.yellow} {...thin} />
        <circle cx={1508} cy={562} r={16} fill={C.green} {...thin} />
        <path d="M1460 548 q30 -26 66 -6" fill="none" stroke={C.yellow} strokeWidth={10} strokeLinecap="round" />
        <path d="M1460 548 q30 -26 66 -6" fill="none" {...hair} />
        <path d="M1420 568 h120 q-6 22 -60 22 q-54 0 -60 -22 z" fill={C.blue} {...thin} />
      </g>

      {/* the floor, in checked tiles */}
      <rect x={0} y={820} width={W} height={80} fill={C.floorLight} />
      {Array.from({ length: 32 * 2 }, (_, i) => {
        const col = i % 32;
        const row = Math.floor(i / 32);
        return (col + row) % 2 ? null : <rect key={i} x={col * 50} y={820 + row * 40} width={50} height={40} fill={C.floorDark} />;
      })}
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
