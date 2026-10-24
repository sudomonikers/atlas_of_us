import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Time Study is drawn in Dr. Osei's research notebook: blue ballpoint on graph paper, a red margin, and yellow
// highlighter. The player is always in red, the red pen she hands over: their diary, the parts they circle, a week's
// stressful days. A cue names a page and the parts of it to show: parts already up stay put, new ones are drawn after
// them, top to bottom, and turning to a new page lifts the old one off. Everything is SVG in a fixed 1600x900 space,
// scaled to cover the screen. The pictures keep to the top two thirds, clear of the text box.

const W = 1600;
const H = 900;
type Pt = [number, number];

const C = {
  paper: '#f8f7f1',
  ink: '#25428a',
  red: '#cf3b2c',
  gold: '#f0cc3a',
  blue: '#9db6d8',
  brown: '#8a6a4a',
};
type Ink = Exclude<keyof typeof C, 'paper'>;
const INKS = Object.keys(C).filter((k) => k !== 'paper') as Ink[];

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type Page = 'title' | 'door' | 'office' | 'diary' | 'later' | 'list' | 'effort' | 'week' | 'pockets' | 'folder';

interface Cue {
  page: Page;
  parts: string[]; //drawn in this order
  card?: [kicker: string, name: string];
}

const DIARY = ['sheet', 'bands'];
const WRITTEN = [...DIARY, 'write0', 'write1', 'write2', 'pen'];

const cues: Record<string, Cue> = {
  title_card: { page: 'title', parts: ['clock', 'scribble'], card: ['A study of how you spend your days', 'The Time Study'] },
  door: { page: 'door', parts: ['door', 'sign'] },
  office: { page: 'office', parts: ['window', 'desk', 'osei', 'mugs', 'clock'] },
  diary: { page: 'diary', parts: DIARY },
  diary_days: { page: 'diary', parts: [...DIARY, 'hl0'] },
  diary_evenings: { page: 'diary', parts: [...DIARY, 'write0', 'hl1'] },
  diary_weekend: { page: 'diary', parts: [...DIARY, 'write0', 'write1', 'hl2'] },
  red_pen: { page: 'diary', parts: WRITTEN },
  circled_few: { page: 'diary', parts: [...WRITTEN, 'few'] },
  circled_some: { page: 'diary', parts: [...WRITTEN, 'some'] },
  circled_lots: { page: 'diary', parts: [...WRITTEN, 'lots'] },
  later: { page: 'later', parts: ['drawer', 'notes'] },
  later_done: { page: 'later', parts: ['drawer', 'notes', 'tick'] },
  list: { page: 'list', parts: ['sheet', 'items'] },
  effort: { page: 'effort', parts: ['boxes'] },
  week: { page: 'week', parts: ['days'] },
  week_light: { page: 'week', parts: ['days', 'few'] },
  week_heavy: { page: 'week', parts: ['days', 'many'] },
  pockets: { page: 'pockets', parts: ['keys', 'charger', 'book', 'marks'] },
  folder: { page: 'folder', parts: ['stack', 'clip'] },
  goodbye: { page: 'folder', parts: ['stack', 'clip', 'card'] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

//what a part is made of: pen lines, hatched shapes, solid shapes (paper, to cover what's behind) and lettering.
//t is an svg transform, for anything drawn at an angle
type Item =
  | { line: Ink; d: string; w?: number; o?: number; cls?: string; t?: string }
  | { hatch: Ink; d: string; o?: number; cls?: string; t?: string }
  | { fill: keyof typeof C; d: string; o?: number; cls?: string; t?: string }
  | { text: string; c: Ink; x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'; ls?: number; cls?: string; t?: string };

const GAP = 0.07; //seconds between one item starting to draw and the next

const line = (...pts: Pt[]) => `M ${pts.map((p) => p.join(' ')).join(' L ')}`;
const rect = (x: number, y: number, w: number, h: number) => `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
const circle = (x: number, y: number, r: number) => `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
const round = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const words = (c: Ink, text: string, x: number, y: number, size: number, anchor?: 'start' | 'end'): Item => ({ c, text, x, y, size, anchor });

//pseudo-random but fixed, so a page always comes out the same
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//a pen shape: paper underneath to cover what's behind, then outlined, and hatched if shaded
const pen = (d: string, c: Ink = 'ink', w = 4, shade = false): Item[] => [{ fill: 'paper', d }, ...(shade ? [{ hatch: c, d } as Item] : []), { line: c, d, w }];
//handwriting: n wobbly lines of scribble from x, w wide
const scribble = (x: number, y: number, w: number, n: number, c: Ink, seed: number): Item => ({
  line: c,
  w: 3,
  d: Array.from({ length: n }, (_, j) => {
    const len = j === n - 1 ? w * (0.4 + rand(seed + j) * 0.3) : w * (0.8 + rand(seed + j) * 0.2);
    return `M ${x} ${y + j * 34} ${Array.from({ length: Math.round(len / 14) }, (_, i) => `q 4 ${i % 2 ? 8 : -8} 14 0`).join(' ')}`;
  }).join(' '),
});
//a highlighter stroke
const highlight = (x: number, y: number, w: number, h: number): Item => ({ fill: 'gold', d: round(x, y, w, h, 6), o: 0.45 });
//a hand-drawn loop around a box
const loop = (x: number, y: number, w: number, h: number, seed: number): Item => ({
  line: 'red',
  w: 5,
  d: `M ${x + w * 0.1} ${y - 4} Q ${x + w + 30} ${y - 20 + rand(seed) * 20} ${x + w + 10} ${y + h / 2} Q ${x + w} ${y + h + 26} ${x + w / 2} ${y + h + 10} Q ${x - 30} ${y + h + 4} ${x - 16} ${y + h / 2} Q ${x - 10} ${y - 16} ${x + w * 0.3} ${y - 10}`,
});
const tick = (x: number, y: number, s = 1) => line([x - 16 * s, y], [x - 4 * s, y + 14 * s], [x + 20 * s, y - 16 * s]);
//head and shoulders, the shoulders' bottom edge at y
function shoulders(x: number, y: number, h: number) {
  return `M ${x - h * 0.3} ${y} Q ${x - h * 0.3} ${y - h * 0.45} ${x} ${y - h * 0.45} Q ${x + h * 0.3} ${y - h * 0.45} ${x + h * 0.3} ${y} Z ${circle(x, y - h * 0.72, h * 0.22)}`;
}
const clockFace = (x: number, y: number, r: number): Item[] => [
  ...pen(circle(x, y, r), 'ink', 5),
  { line: 'ink', d: Array.from({ length: 12 }, (_, i) => line([x + r * 0.84 * Math.sin(i * 0.5236), y - r * 0.84 * Math.cos(i * 0.5236)], [x + r * 0.72 * Math.sin(i * 0.5236), y - r * 0.72 * Math.cos(i * 0.5236)])).join(' '), w: 3 },
  { line: 'ink', d: `${line([x, y], [x, y - r * 0.6])} ${line([x, y], [x + r * 0.4, y + r * 0.1])}`, w: 5 },
];

// ---------------------------------------------------------------------------
// the pages
// ---------------------------------------------------------------------------

//the diary page: the last seven days, three bands down it, daytime, evenings and weekend, the tops at BANDS
const BANDS = [140, 280, 420];
const BAND_NAMES = ['DAYTIME', 'EVENINGS', 'WEEKEND'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const ART: Record<Page, Record<string, Item[]>> = {
  title: {
    clock: clockFace(800, 470, 90),
    scribble: [{ line: 'ink', w: 3, d: `M 590 600 ${'q 4 -8 14 0 q 4 8 14 0 '.repeat(15)}` }],
  },

  door: {
    door: [...pen(rect(560, 70, 480, 560), 'ink', 5, true), ...pen(rect(600, 110, 400, 200), 'ink', 3), ...pen(circle(980, 380, 16), 'ink', 3)],
    sign: [...pen(rect(630, 140, 340, 140), 'ink', 3), { ...words('ink', 'TIME STUDY', 800, 196, 36), ls: 4 }, words('ink', 'Participants, please knock', 800, 244, 22)],
  },

  office: {
    window: [...pen(rect(160, 90, 360, 260), 'ink', 4), { line: 'ink', d: `${line([340, 90], [340, 350])} ${line([160, 220], [520, 220])}`, w: 3 }, { hatch: 'blue', d: rect(164, 94, 352, 252), o: 0.5 }],
    desk: [...pen(rect(260, 430, 1080, 20), 'ink', 4, true), { line: 'ink', d: `${line([300, 450], [300, 600])} ${line([1300, 450], [1300, 600])}`, w: 6 }, ...pen(rect(560, 400, 200, 30), 'ink', 3), scribble(580, 412, 160, 1, 'blue', 9)],
    osei: [...pen(shoulders(1060, 430, 300), 'ink', 5, true), ...pen(`${circle(1028, 216, 14)} ${circle(1092, 216, 14)} M 1042 216 h 36`, 'ink', 3)],
    mugs: [860, 940].flatMap((x): Item[] => [...pen(rect(x - 24, 376, 48, 54), 'ink', 4), { line: 'ink', d: `M ${x + 24} ${388} q 22 0 22 16 q 0 16 -22 16`, w: 4 }, { line: 'ink', d: `M ${x - 6} 360 q -10 -16 0 -30 M ${x + 8} 362 q -10 -16 0 -30`, w: 3, o: 0.5, cls: 'ts-steam' }]),
    clock: clockFace(1400, 220, 70),
  },

  diary: {
    sheet: [...pen(round(360, 80, 880, 520, 10), 'ink', 4), words('ink', 'LAST 7 DAYS', 800, 124, 30)],
    bands: BANDS.flatMap((y, i): Item[] => [{ line: 'ink', d: line([380, y], [1220, y]), w: 2 }, { ...words('ink', BAND_NAMES[i], 400, y + 34, 20, 'start'), ls: 3 }]),
    hl0: [highlight(394, BANDS[0] + 12, 156, 30)],
    hl1: [highlight(394, BANDS[1] + 12, 190, 30)],
    hl2: [highlight(394, BANDS[2] + 12, 150, 30)],
    write0: [scribble(600, BANDS[0] + 30, 580, 3, 'red', 1)],
    write1: [scribble(600, BANDS[1] + 30, 580, 3, 'red', 11)],
    write2: [scribble(600, BANDS[2] + 30, 580, 3, 'red', 21)],
    pen: [...pen(`M 1300 300 l 140 -140 l 20 20 l -140 140 Z M 1300 300 l -10 30 l 30 -10`, 'red', 4, true)],
    few: [loop(860, BANDS[2] + 62, 200, 30, 4)],
    some: [loop(620, BANDS[1] + 62, 260, 34, 5), loop(900, BANDS[2] + 28, 240, 34, 6)],
    lots: [loop(600, BANDS[0] + 20, 560, 90, 7), loop(600, BANDS[1] + 20, 560, 90, 8), loop(600, BANDS[2] + 20, 560, 90, 9)],
  },

  later: {
    drawer: [...pen(rect(400, 260, 800, 300), 'ink', 5, true), ...pen(rect(440, 230, 720, 60), 'ink', 4), ...pen(round(740, 250, 120, 22, 10), 'ink', 3)],
    notes: [[520, 170, -8], [700, 140, 6], [880, 160, -4], [1040, 130, 10]].flatMap(([x, y, r]): Item[] => [
      { fill: 'gold', d: rect(x - 70, y - 60, 140, 120), o: 0.6, t: `rotate(${r} ${x} ${y})` },
      { line: 'ink', d: rect(x - 70, y - 60, 140, 120), w: 2, t: `rotate(${r} ${x} ${y})` },
      { ...words('ink', 'LATER', x, y + 10, 30), t: `rotate(${r} ${x} ${y})` },
    ]),
    tick: [{ line: 'red', d: tick(700, 140, 3), w: 9 }],
  },

  list: {
    sheet: [...pen(round(460, 70, 680, 540, 10), 'ink', 4), words('ink', 'THIS WEEK', 800, 120, 30)],
    items: Array.from({ length: 7 }, (_, i): Item[] => [...pen(rect(510, 150 + i * 62, 34, 34), 'ink', 3), scribble(570, 172 + i * 62, 480, 1, 'ink', 30 + i), ...(i % 3 !== 2 ? [{ line: 'red', d: tick(527, 165 + i * 62), w: 5 } as Item] : [])]).flat(),
  },

  effort: {
    boxes: ['MORE', 'NEEDED', 'ENOUGH'].flatMap((name, i): Item[] => [...pen(rect(300 + i * 360, 200, 280, 280), 'ink', 4), { ...words('ink', name, 440 + i * 360, 540, 32), ls: 4 }, ...pen(rect(330 + i * 360, 480 - (3 - i) * 80, 220, (3 - i) * 80 - 30), 'ink', 3, true)]),
  },

  week: {
    days: DAYS.flatMap((d, i): Item[] => [...pen(rect(220 + i * 170, 220, 150, 220), 'ink', 4), { ...words('ink', d, 295 + i * 170, 200, 26), ls: 3 }]),
    few: [{ line: 'red', d: `${line([400, 260], [500, 400])} ${line([500, 260], [400, 400])}`, w: 6 }],
    many: [0, 1, 2, 3, 5, 6].map((i): Item => ({ line: 'red', d: `${line([240 + i * 170, 260], [350 + i * 170, 400])} ${line([350 + i * 170, 260], [240 + i * 170, 400])}`, w: 6 })),
  },

  pockets: {
    keys: [...pen(`${circle(420, 300, 50)} ${circle(420, 300, 24)} M 466 290 h 170 v 20 h -170 Z ${rect(600, 310, 14, 30)} ${rect(624, 310, 14, 22)}`, 'ink', 4, true)],
    charger: [...pen(round(760, 230, 120, 140, 14), 'ink', 4, true), { line: 'ink', d: 'M 820 370 q 0 80 60 90 q 80 10 80 80', w: 5 }, ...pen(`${rect(796, 200, 12, 30)} ${rect(832, 200, 12, 30)}`, 'ink', 3)],
    book: [...pen(rect(1060, 200, 200, 260), 'ink', 4, true), ...pen(rect(1060, 200, 30, 260), 'ink', 3), words('ink', 'BORROWED', 1175, 500, 22)],
    marks: [500, 860, 1160].map((x, i): Item => ({ ...words('red', '?', x, 170, 90), cls: i % 2 ? 'ts-bob2' : 'ts-bob' })),
  },

  folder: {
    stack: [...Array.from({ length: 6 }, (_, i) => pen(rect(520 - i * 4, 140 + i * 10, 560, 400), 'ink', 2)).flat(), ...pen(`M 480 220 h 200 l 30 -40 h 400 v 400 h -630 Z`, 'brown', 5, true)],
    clip: [...pen(round(760, 200, 80, 120, 14), 'ink', 4), { line: 'red', d: Array.from({ length: 3 }, (_, i) => line([620, 330 + i * 40], [980, 330 + i * 40])).join(' '), w: 3 }],
    card: [...pen(rect(900, 300, 420, 240), 'ink', 4), { ...words('ink', 'Thank you for your time.', 1110, 400, 28), t: 'rotate(-4 1110 420)' }, { ...words('ink', "We know it's precious.", 1110, 450, 26), t: 'rotate(-4 1110 420)' }],
  },
};

// ---------------------------------------------------------------------------
// a page, and its parts
// ---------------------------------------------------------------------------

//every item is drawn top to bottom, as if with a pen
function Part({ items, start }: { items: Item[]; start: number }) {
  return (
    <g>
      {items.map((item, i) => {
        const style = { animationDelay: `${start + i * GAP}s` };
        let mark;
        if ('text' in item) {
          mark = (
            <text x={item.x} y={item.y} textAnchor={item.anchor ?? 'middle'} fill={C[item.c]} letterSpacing={item.ls} style={{ ...styles.type, fontSize: item.size }}>
              {item.text}
            </text>
          );
        } else if ('line' in item) {
          mark = <path d={item.d} fill="none" stroke={C[item.line]} strokeWidth={item.w ?? 4} strokeOpacity={item.o ?? 0.95} strokeLinecap="round" strokeLinejoin="round" />;
        } else if ('hatch' in item) {
          mark = <path d={item.d} fill={`url(#ts-h-${item.hatch})`} fillOpacity={item.o ?? 1} />;
        } else {
          mark = <path d={item.d} fill={C[item.fill]} fillOpacity={item.o ?? 1} />;
        }
        return (
          <g key={i} className={item.cls} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <g className="ts-draw" style={style} transform={item.t}>
              {mark}
            </g>
          </g>
        );
      })}
    </g>
  );
}

interface Shown {
  cue: Cue;
  visit: number; //how many page turns so far, so coming back to a page draws it afresh
  starts: Record<string, number>; //when each part began drawing, in seconds after it appeared
}

//new parts are drawn one after another; on a fresh page they wait for the old one to lift off
function startTimes(parts: string[], page: Page, from: number) {
  const starts: Record<string, number> = {};
  let t = from;
  for (const part of parts) {
    starts[part] = t;
    t += ART[page][part].length * GAP + 0.1;
  }
  return starts;
}

function turn(shown: Shown, cue: Cue): { now: Shown; prev?: Shown } {
  if (cue.page === shown.cue.page) {
    const added = cue.parts.filter((p) => !shown.cue.parts.includes(p));
    return { now: { ...shown, cue, starts: { ...shown.starts, ...startTimes(added, cue.page, 0.1) } } };
  }
  return { now: { cue, visit: shown.visit + 1, starts: startTimes(cue.parts, cue.page, 0.5) }, prev: shown };
}

function PageView({ shown, leaving }: { shown: Shown; leaving?: boolean }) {
  return (
    <g className={leaving ? 'ts-lift' : undefined}>
      {shown.cue.parts.map((part) => (
        <Part key={part} items={ART[shown.cue.page][part]} start={shown.starts[part] ?? 0} />
      ))}
    </g>
  );
}

//the graph paper every page is drawn on, with a red margin
const GRID = `${Array.from({ length: Math.ceil(W / 40) + 1 }, (_, i) => line([i * 40, 0], [i * 40, H])).join(' ')} ${Array.from({ length: Math.ceil(H / 40) + 1 }, (_, i) => line([0, i * 40], [W, i * 40])).join(' ')}`;

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  room: new URL('./sounds/room.m4a', import.meta.url).href,
  tick: new URL('./sounds/tick.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

//a quiet office, and the clock on its wall
const MIX: Record<Page, Partial<Record<Bed, number>>> = {
  title: { room: 0.4, tick: 0.4 },
  door: { room: 0.6 },
  office: { room: 0.6, tick: 0.5 },
  diary: { room: 0.6, tick: 0.3 },
  later: { room: 0.6, tick: 0.3 },
  list: { room: 0.6, tick: 0.3 },
  effort: { room: 0.6, tick: 0.3 },
  week: { room: 0.6, tick: 0.3 },
  pockets: { room: 0.6, tick: 0.4 },
  folder: { room: 0.5 },
};

const CHIMES: OneShot = { src: new URL('./sounds/chimes.m4a', import.meta.url).href, volume: 0.4, delay: 0.6 };
const ONE_SHOTS: Record<string, OneShot> = { office: CHIMES };

const MASTER_VOLUME = 0.8;
const CROSSFADE = 1.5; //seconds

// ---------------------------------------------------------------------------

function Notebook({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const first = cues[animation] ? animation : FIRST_CUE;
  const [active, setActive] = useState(first);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [view, setView] = useState<{ now: Shown; prev?: Shown }>(() => ({
    now: { cue: cues[first], visit: 0, starts: startTimes(cues[first].parts, cues[first].page, 0.5) },
  }));
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      setActive(animation);
      setView((v) => {
        const next = turn(v.now, cues[animation]);
        return { now: next.now, prev: next.prev ?? v.prev };
      });
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Time Study has no cue for the animation "${animation}"`);
  }, [animation]);

  const sound = useRef<Soundscape<Bed> | null>(null);
  useEffect(() => {
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;
    return () => {
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    sound.current?.mix(MIX[cues[active].page]);
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const { now, prev } = view;
  const { card } = now.cue;
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <svg style={styles.layer} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          {INKS.map((ink) => (
            <pattern key={ink} id={`ts-h-${ink}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
              <line x1="0" y1="0" x2="0" y2="7" stroke={C[ink]} strokeWidth="1.4" />
            </pattern>
          ))}
        </defs>
        <rect width={W} height={H} fill={C.paper} />
        <path d={GRID} fill="none" stroke={C.blue} strokeWidth={1} strokeOpacity={0.45} />
        <path d={line([120, 0], [120, H])} stroke={C.red} strokeWidth={2} strokeOpacity={0.6} />
        {prev && <PageView key={`${prev.cue.page}-${prev.visit}`} shown={prev} leaving />}
        <PageView key={`${now.cue.page}-${now.visit}`} shown={now} />
      </svg>

      <div style={{ ...styles.card, opacity: card ? 1 : 0 }}>
        {card && (
          <>
            <div style={styles.kicker}>{card[0]}</div>
            <div style={styles.name}>{card[1]}</div>
          </>
        )}
      </div>
    </div>
  );
}

const keyframes = `
.ts-draw {
  animation: ts-draw 0.6s ease-out both;
}
@keyframes ts-draw {
  from { clip-path: inset(0 100% 0 0); opacity: 0; }
  20% { opacity: 1; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
.ts-lift {
  animation: ts-lift 0.5s ease-in forwards;
}
@keyframes ts-lift {
  to { opacity: 0; transform: translateY(-30px); }
}
.ts-steam {
  animation: ts-steam 2.4s ease-in-out infinite;
}
@keyframes ts-steam {
  50% { transform: translateY(-8px); opacity: 0.4; }
}
.ts-bob {
  animation: ts-bob 2s ease-in-out infinite;
}
.ts-bob2 {
  animation: ts-bob 2s ease-in-out -1s infinite;
}
@keyframes ts-bob {
  50% { transform: translateY(-10px) rotate(6deg); }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: C.paper,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  type: {
    fontFamily: "'Comic Neue', 'Bradley Hand', 'Segoe Print', cursive",
    fontWeight: 700,
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    fontFamily: "'Bradley Hand', 'Segoe Print', cursive",
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 22,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: C.red,
    borderBottom: `2px solid ${C.red}`,
    padding: '0 10px 6px',
  },
  name: {
    fontSize: 110,
    lineHeight: 1.15,
    color: C.ink,
  },
};

export default Notebook;
