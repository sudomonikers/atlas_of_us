import { useEffect, useRef, useState, type CSSProperties } from 'react';

// Reading People is painted on a 2D canvas rather than built in three.js: soft skies and ink outlines,
// with comic panel close ups that slide in over the scene for faces and the small things people hold.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const INK = '#2b2433';
const SET_FADE = 0.9; //seconds to crossfade between sets
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

type Who = 'mei' | 'kenji' | 'sora' | 'ren' | 'kuroda' | 'coworker' | 'oldMan' | 'aoi';
type Hair = 'bob' | 'spiky' | 'ponytail' | 'messy' | 'bun' | 'grey' | 'long' | 'short';
type Mood = 'calm' | 'smile' | 'laugh' | 'cover' | 'grin' | 'soft';
type Arms = 'down' | 'up' | 'wave' | 'out' | 'hold' | 'pat' | 'mouth' | 'behind';
type Held = 'phone' | 'flowers' | 'skewer';

interface Look {
  hair: Hair;
  hairColor: string;
  skin: string;
  top: string;
  bottom: string;
  eyes: string;
}

const PEOPLE: Record<Who, Look> = {
  mei: { hair: 'bob', hairColor: '#3b2a4a', skin: '#f6dcc8', top: '#ee9fb0', bottom: '#d9849a', eyes: '#6a4a8c' },
  kenji: { hair: 'spiky', hairColor: '#2a2230', skin: '#eccdb3', top: '#5a7fb5', bottom: '#3c4a66', eyes: '#3d3550' },
  sora: { hair: 'ponytail', hairColor: '#8a5236', skin: '#f3d6bf', top: '#f2c46d', bottom: '#e0a94e', eyes: '#7a4a2c' },
  ren: { hair: 'messy', hairColor: '#4a3328', skin: '#efd2b8', top: '#f7f4ee', bottom: '#4a5468', eyes: '#5a3a28' },
  kuroda: { hair: 'bun', hairColor: '#1f1b24', skin: '#ecd0b6', top: '#3d4a5e', bottom: '#3d4a5e', eyes: '#2f2a3a' },
  coworker: { hair: 'short', hairColor: '#5b4636', skin: '#e9c7a8', top: '#9cc5a1', bottom: '#56606e', eyes: '#3a2f2a' },
  oldMan: { hair: 'grey', hairColor: '#d7d7de', skin: '#e8c9ad', top: '#8a8c94', bottom: '#6d6f78', eyes: '#4a4048' },
  aoi: { hair: 'long', hairColor: '#2f3550', skin: '#f5dbc6', top: '#a9c7b4', bottom: '#8fb09c', eyes: '#3d5a7a' },
};

interface Pose {
  sit?: boolean;
  arms?: Arms;
  mood?: Mood;
  lean?: number; //radians, tipping from the feet
  bob?: number;
  back?: boolean; //facing away
  held?: Held;
}

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'paper' | 'festival' | 'river' | 'rooftop' | 'train' | 'platform' | 'window';
type Thing = 'phone' | 'texts' | 'flowers' | 'note' | 'laptops';
type Panel = { who: Who; mood: Mood } | { thing: Thing };

interface Cue {
  set: SetId;
  beat?: string; //what the people in the set are doing
  panels?: Panel[]; //comic close ups, the first top right and the second top left
  card?: [kicker: string, name: string]; //a title card over the scene
}

const cues: Record<string, Cue> = {
  title_card: { set: 'paper', card: ['Four small moments', 'Reading People'] },

  chapter_lanterns: { set: 'festival', card: ['One', 'Lanterns'] },
  festival_wide: { set: 'festival' },
  friends_huddle: { set: 'festival', beat: 'huddle', panels: [{ thing: 'phone' }] },
  friends_laugh: { set: 'festival', beat: 'laugh', panels: [{ who: 'kenji', mood: 'laugh' }, { who: 'sora', mood: 'laugh' }] },
  mei_covers: { set: 'festival', beat: 'cover', panels: [{ who: 'mei', mood: 'cover' }] },
  mei_waves: { set: 'festival', beat: 'wave', panels: [{ who: 'mei', mood: 'smile' }] },
  sora_offers: { set: 'festival', beat: 'offer', panels: [{ who: 'sora', mood: 'smile' }] },
  friends_hold: { set: 'festival', beat: 'offer' },
  walk_home: { set: 'river' },

  chapter_rooftop: { set: 'rooftop', card: ['Two', 'The Rooftop'] },
  rooftop_wide: { set: 'rooftop' },
  rooftop_memory: { set: 'rooftop', panels: [{ thing: 'laptops' }] },
  kuroda_praises: { set: 'rooftop', beat: 'praise', panels: [{ who: 'kuroda', mood: 'smile' }] },
  ren_brags: { set: 'rooftop', beat: 'brag', panels: [{ who: 'ren', mood: 'grin' }] },
  ren_stretches: { set: 'rooftop', beat: 'stretch' },
  ren_hold: { set: 'rooftop', beat: 'stretch', panels: [{ who: 'ren', mood: 'grin' }] },
  kuroda_turns: { set: 'rooftop', beat: 'turn', panels: [{ who: 'kuroda', mood: 'calm' }] },
  kuroda_asks: { set: 'rooftop', beat: 'turn', panels: [{ who: 'kuroda', mood: 'calm' }, { who: 'ren', mood: 'calm' }] },

  chapter_train: { set: 'train', card: ['Three', 'The Last Train'] },
  train_wide: { set: 'train' },
  old_man_flowers: { set: 'train', panels: [{ thing: 'flowers' }] },
  old_man_talks: { set: 'train', beat: 'talk', panels: [{ who: 'oldMan', mood: 'soft' }] },
  old_man_pats: { set: 'train', beat: 'pat', panels: [{ who: 'oldMan', mood: 'smile' }] },
  old_man_hold: { set: 'train', beat: 'pat' },
  old_man_stands: { set: 'train', beat: 'stand' },
  old_man_home: { set: 'train', beat: 'stand', panels: [{ who: 'oldMan', mood: 'soft' }] },
  platform_leaves: { set: 'platform' },
  train_after: { set: 'train', beat: 'gone' },

  chapter_book: { set: 'window', card: ['Four', 'The Borrowed Book'] },
  window_rain: { set: 'window' },
  note_falls: { set: 'window', beat: 'note' },
  note_close: { set: 'window', beat: 'note', panels: [{ thing: 'note' }] },
  phone_buzz: { set: 'window', beat: 'phone' },
  aoi_text: { set: 'window', beat: 'phone', panels: [{ thing: 'texts' }, { who: 'aoi', mood: 'smile' }] },
  note_hold: { set: 'window', beat: 'phone', panels: [{ thing: 'note' }] },
  window_think: { set: 'window', beat: 'note' },
  closing: { set: 'window' },
};

const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// drawing helpers
// ---------------------------------------------------------------------------

const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//traces a shape, then fills it and inks its outline
const path = (c: Ctx, trace: () => void, color?: string, line = 3) => {
  c.beginPath();
  trace();
  if (color) {
    c.fillStyle = color;
    c.fill();
  }
  if (line) {
    c.strokeStyle = INK;
    c.lineWidth = line;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }
};

const oval = (c: Ctx, x: number, y: number, rx: number, ry: number, color?: string, line = 3) =>
  path(c, () => c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2), color, line);

const band = (c: Ctx, y0: number, y1: number, stops: string[]) => {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach((stop, i) => g.addColorStop(i / (stops.length - 1), stop));
  c.fillStyle = g;
  c.fillRect(0, y0, W, y1 - y0);
};

const glow = (c: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
};

const stroke = (c: Ctx, points: Pt[], color: string, width: number) => {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
};

const wrap = (c: Ctx, text: string, x: number, y: number, width: number, lineHeight: number) => {
  let line = '';
  for (const word of text.split(' ')) {
    if (line && c.measureText(`${line} ${word}`).width > width) {
      c.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = line ? `${line} ${word}` : word;
  }
  c.fillText(line, x, y);
};

// ---------------------------------------------------------------------------
// hair, heads and faces
// ---------------------------------------------------------------------------

//everything is drawn around the center of the head, radius r
function hairBack(c: Ctx, { hair, hairColor }: Look, r: number, line: number) {
  if (hair === 'long') path(c, () => c.roundRect(-r * 1.12, -r * 0.6, r * 2.24, r * 2.7, r * 0.9), hairColor, line);
  if (hair === 'bob') path(c, () => c.roundRect(-r * 1.14, -r * 0.7, r * 2.28, r * 1.75, r * 0.8), hairColor, line);
  if (hair === 'ponytail') path(c, () => c.ellipse(r * 1.0, -r * 0.2, r * 0.38, r * 0.8, 0.5, 0, Math.PI * 2), hairColor, line);
  if (hair === 'bun') path(c, () => c.arc(0, -r * 1.05, r * 0.42, 0, Math.PI * 2), hairColor, line);
}

function hairFront(c: Ctx, { hair, hairColor }: Look, r: number, line: number) {
  path(
    c,
    () => {
      if (hair === 'grey') {
        c.arc(0, 0, r * 1.04, Math.PI * 1.08, Math.PI * 1.92);
        c.quadraticCurveTo(0, -r * 0.5, Math.cos(Math.PI * 1.08) * r * 1.04, Math.sin(Math.PI * 1.08) * r * 1.04);
        return;
      }
      if (hair === 'spiky' || hair === 'messy') {
        const points = hair === 'spiky' ? 10 : 8;
        for (let i = 0; i <= points; i++) {
          const a = Math.PI + (Math.PI * i) / points;
          const out = r * (i % 2 ? (hair === 'spiky' ? 1.32 : 1.18) : 1.05);
          c.lineTo(Math.cos(a) * out, Math.sin(a) * out);
        }
      } else c.arc(0, 0, r * 1.06, Math.PI, Math.PI * 2);
      //bangs zigzag back across the forehead
      const tufts = hair === 'bun' ? 3 : hair === 'short' ? 4 : 5;
      for (let i = 1; i <= tufts * 2; i++) {
        const x = r * 1.06 - (r * 2.12 * i) / (tufts * 2);
        c.lineTo(x, i % 2 ? -r * 0.02 : -r * 0.42);
      }
      c.closePath();
    },
    hairColor,
    line,
  );
}

//an anime head shape: round on top, coming to a soft chin
const headShape = (c: Ctx, r: number, skin: string, line: number) =>
  path(
    c,
    () => {
      c.arc(0, 0, r, Math.PI, 0);
      c.quadraticCurveTo(r * 0.95, r * 0.85, 0, r * 1.16);
      c.quadraticCurveTo(-r * 0.95, r * 0.85, -r, 0);
    },
    skin,
    line,
  );

const eyesShut = (mood?: Mood) => mood === 'laugh' || mood === 'grin' || mood === 'smile';

//a head small enough that the face is just dots and arcs
function smallHead(c: Ctx, look: Look, r: number, mood?: Mood, back?: boolean) {
  if (back) {
    hairBack(c, look, r, 2.5);
    headShape(c, r, look.skin, 2.5);
    oval(c, 0, -r * 0.05, r * 1.06, r * 1.08, look.hairColor, 2.5);
    return;
  }
  hairBack(c, look, r, 2.5);
  headShape(c, r, look.skin, 2.5);
  for (const side of [-1, 1]) {
    const x = side * r * 0.4;
    const y = r * 0.28;
    if (eyesShut(mood)) path(c, () => c.arc(x, y + r * 0.08, r * 0.15, Math.PI * 1.15, Math.PI * 1.85), undefined, 2);
    else oval(c, x, y, r * 0.09, r * 0.14, INK, 0);
    oval(c, side * r * 0.58, r * 0.55, r * 0.14, r * 0.07, 'rgba(240,120,130,0.35)', 0);
  }
  if (mood === 'laugh' || mood === 'grin') oval(c, 0, r * 0.72, r * 0.12, r * 0.1, '#a8424f', 1.5);
  hairFront(c, look, r, 2.5);
}

function bigEye(c: Ctx, x: number, y: number, r: number, color: string, wide: number) {
  const rx = r * 0.16 * wide;
  const ry = r * 0.22 * wide;
  oval(c, x, y, rx, ry, color, 0);
  oval(c, x, y + ry * 0.2, rx * 0.55, ry * 0.55, INK, 0);
  oval(c, x - rx * 0.35, y - ry * 0.4, rx * 0.35, rx * 0.35, '#fff', 0);
  oval(c, x + rx * 0.3, y + ry * 0.45, rx * 0.15, rx * 0.15, '#fff', 0);
  path(c, () => c.ellipse(x, y, rx * 1.15, ry * 1.05, 0, Math.PI * 1.1, Math.PI * 1.9), undefined, 4.5);
}

//a close up face for the comic panels, with shoulders
function face(c: Ctx, who: Who, mood: Mood, r: number) {
  const look = PEOPLE[who];
  path(c, () => c.roundRect(-r * 1.6, r * 1.05, r * 3.2, r * 1.6, r * 0.7), look.top);
  path(c, () => c.roundRect(-r * 0.28, r * 0.7, r * 0.56, r * 0.5, 4), look.skin);
  hairBack(c, look, r, 3);
  headShape(c, r, look.skin, 3);

  for (const side of [-1, 1]) {
    const x = side * r * 0.4;
    const y = r * 0.28;
    if (eyesShut(mood)) path(c, () => c.arc(x, y + r * 0.08, r * 0.16, Math.PI * 1.15, Math.PI * 1.85), undefined, 4);
    else if (mood === 'soft') {
      c.save();
      c.beginPath();
      c.rect(x - r * 0.3, y - r * 0.02, r * 0.6, r * 0.4);
      c.clip();
      bigEye(c, x, y, r, look.eyes, 1);
      c.restore();
      path(c, () => {
        c.moveTo(x - r * 0.2, y);
        c.quadraticCurveTo(x, y - r * 0.08, x + r * 0.2, y);
      }, undefined, 4);
    } else bigEye(c, x, y, r, look.eyes, mood === 'cover' ? 1.18 : 1);
    //brows lift in the middle when soft
    const lift = mood === 'soft' ? r * 0.05 : 0;
    path(c, () => {
      c.moveTo(x - side * r * 0.16, y - r * 0.3 - lift);
      c.quadraticCurveTo(x, y - r * 0.38, x + side * r * 0.16, y - r * 0.31);
    }, undefined, 3);
    oval(c, side * r * 0.6, r * 0.6, r * 0.16, r * 0.08, 'rgba(240,120,130,0.4)', 0);
    if (who === 'oldMan') {
      oval(c, x, y, r * 0.24, r * 0.2, 'rgba(255,255,255,0.15)', 2);
      stroke(c, [[x + side * r * 0.27, y + r * 0.05], [x + side * r * 0.36, y + r * 0.12]], INK, 1.5);
    }
  }

  const my = r * 0.72;
  if (mood === 'calm') stroke(c, [[-r * 0.08, my], [r * 0.08, my]], INK, 3);
  if (mood === 'smile' || mood === 'soft') path(c, () => c.arc(0, my - r * 0.1, r * 0.12, Math.PI * 0.2, Math.PI * 0.8), undefined, 3);
  if (mood === 'laugh' || mood === 'grin') {
    const width = mood === 'grin' ? 0.27 : 0.2;
    path(c, () => {
      c.moveTo(-r * width, my - r * 0.05);
      c.quadraticCurveTo(0, my + r * 0.36, r * width, my - r * 0.05);
      c.closePath();
    }, mood === 'grin' ? '#fff' : '#a8424f', 2.5);
    if (mood === 'grin') oval(c, 0, my + r * 0.1, r * width * 0.6, r * 0.06, '#a8424f', 0);
    else oval(c, 0, my + r * 0.12, r * 0.09, r * 0.05, '#e98a8a', 0);
  }
  if (mood === 'cover') {
    path(c, () => c.roundRect(-r * 0.34, r * 0.5, r * 0.68, r * 0.44, r * 0.2), look.skin);
    for (const x of [-0.12, 0, 0.12]) stroke(c, [[x * r, r * 0.52], [x * r, r * 0.68]], INK, 2);
  }
  if (who === 'oldMan') stroke(c, [[-r * 0.16, r * 0.25], [r * 0.16, r * 0.25]], INK, 2);
  hairFront(c, look, r, 3);
}

// ---------------------------------------------------------------------------
// bodies and the things they hold
// ---------------------------------------------------------------------------

function bouquet(c: Ctx, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const [bx, by] of [[-22, -38], [22, -36], [0, -50], [-10, -26], [12, -24]] as Pt[]) stroke(c, [[0, 10], [bx, by]], '#5d8a55', 3);
  for (const [bx, by] of [[-22, -38], [22, -36], [0, -50], [-10, -26], [12, -24], [-28, -20], [28, -18]] as Pt[]) {
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      oval(c, bx + Math.cos(a) * 6, by + Math.sin(a) * 6, 6, 6, '#fbfbf7', 1.5);
    }
    oval(c, bx, by, 3.5, 3.5, '#f3d36b', 1);
  }
  path(c, () => {
    c.moveTo(-32, -12);
    c.lineTo(32, -12);
    c.lineTo(0, 60);
    c.closePath();
  }, '#e8d9bd', 2.5);
  c.restore();
}

function held(c: Ctx, thing: Held, [x, y]: Pt, t: number) {
  if (thing === 'flowers') bouquet(c, x, y - 8, 0.55);
  if (thing === 'phone') {
    glow(c, x, y - 6, 26, '200,230,255', 0.5);
    path(c, () => c.roundRect(x - 7, y - 16, 14, 22, 3), '#2b2433', 2);
  }
  if (thing === 'skewer') {
    stroke(c, [[x, y], [x + 18, y - 34]], '#d9b98a', 2.5);
    for (let i = 0; i < 3; i++) oval(c, x + 8 + i * 4, y - 14 - i * 8 + Math.sin(t * 2) * 0.5, 5, 5, '#b8743f', 1.5);
  }
}

//a full figure standing (or sitting) with its feet at x, y. Unscaled it is about 210 tall
function figure(c: Ctx, who: Who, x: number, y: number, s: number, pose: Pose, t: number) {
  const look = PEOPLE[who];
  const { arms = 'down' } = pose;
  const hip = pose.sit ? -70 : -88;
  const neck = hip - 72;
  const head = neck - 26;
  c.save();
  c.translate(x, y - (pose.bob ?? 0));
  c.scale(s, s);
  c.rotate(pose.lean ?? 0);

  if (pose.sit) {
    path(c, () => c.roundRect(-24, hip - 6, 48, 22, 8), look.bottom);
    path(c, () => {
      c.roundRect(-20, hip + 10, 16, -hip - 10, 6);
      c.roundRect(4, hip + 10, 16, -hip - 10, 6);
    }, look.bottom);
  } else
    path(c, () => {
      c.roundRect(-19, hip, 16, -hip, 6);
      c.roundRect(3, hip, 16, -hip, 6);
    }, look.bottom);
  oval(c, -11, -2, 11, 6, '#3a3340', 2);
  oval(c, 11, -2, 11, 6, '#3a3340', 2);

  path(c, () => {
    c.moveTo(-22, hip + 6);
    c.lineTo(-27, neck + 6);
    c.quadraticCurveTo(0, neck - 6, 27, neck + 6);
    c.lineTo(22, hip + 6);
    c.closePath();
  }, look.top);

  const wave = Math.sin(t * 8) * 8;
  const down = (side: number): Pt[] => [[side * 32, hip - 30], [side * 33, hip]];
  const reach: Record<Arms, [Pt[], Pt[]]> = {
    down: [down(-1), down(1)],
    up: [[[-40, neck - 40], [-30, head - 44]], [[40, neck - 40], [30, head - 44]]],
    wave: [down(-1), [[48, neck - 10], [52 + wave, neck - 58]]],
    out: [down(-1), [[40, hip - 20], [70, hip - 26]]],
    hold: [[[-30, hip - 22], [-8, hip - 12]], [[30, hip - 22], [8, hip - 12]]],
    pat: [[[-30, hip - 22], [-8, hip - 12]], [[42, hip - 14], [76, hip + 4]]],
    mouth: [down(-1), [[32, hip - 8], [6, head + 16]]],
    behind: [down(-1), [[48, neck - 34], [18, head - 12]]],
  };
  const [left, right] = reach[arms];
  for (const [side, points] of [[-1, left], [1, right]] as [number, Pt[]][]) {
    const arm: Pt[] = [[side * 24, neck + 10], ...points];
    stroke(c, arm, INK, 15);
    stroke(c, arm, look.top, 9);
    const [hx, hy] = points[points.length - 1];
    oval(c, hx, hy, 6.5, 6.5, look.skin, 2);
  }
  if (pose.held) held(c, pose.held, (arms === 'hold' || arms === 'pat' ? left : right)[1], t);

  c.translate(0, head);
  smallHead(c, look, 25, pose.mood, pose.back);
  c.restore();
}

//a background person, one flat color
function silhouette(c: Ctx, x: number, y: number, s: number, color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x - 22 * s, y - 150 * s, 44 * s, 150 * s, 18 * s);
  c.arc(x, y - 178 * s, 24 * s, 0, Math.PI * 2);
  c.fill();
}

// ---------------------------------------------------------------------------
// sets
// ---------------------------------------------------------------------------

function lantern(c: Ctx, x: number, y: number, r: number, color: string, sway: number) {
  c.save();
  c.translate(x, y);
  c.rotate(sway);
  glow(c, 0, r * 1.3, r * 3.4, '255,170,100', 0.3);
  stroke(c, [[0, 0], [0, r * 0.4]], INK, 1.5);
  oval(c, 0, r * 1.3, r * 0.85, r, color, 2);
  for (const k of [-0.4, 0.4]) path(c, () => c.ellipse(0, r * 1.3, r * 0.85 * Math.abs(k), r, 0, 0, Math.PI * 2), undefined, 1);
  path(c, () => c.rect(-r * 0.4, r * 0.28, r * 0.8, r * 0.14), INK, 0);
  path(c, () => c.rect(-r * 0.4, r * 2.2, r * 0.8, r * 0.14), INK, 0);
  c.restore();
}

function festival(c: Ctx, t: number, beat?: string) {
  band(c, 0, 620, ['#262650', '#5b4a85', '#c97a8f', '#f6b48a']);
  for (let i = 0; i < 50; i++) oval(c, rand(i) * W, rand(i + 50) * 260, 1.6, 1.6, `rgba(255,246,224,${0.35 + 0.35 * Math.sin(t * 1.4 + i)})`, 0);
  path(c, () => {
    c.moveTo(0, 560);
    c.bezierCurveTo(300, 470, 520, 520, 800, 500);
    c.bezierCurveTo(1100, 480, 1300, 540, W, 500);
    c.lineTo(W, 620);
    c.lineTo(0, 620);
  }, '#5a4775', 0);
  band(c, 600, H, ['#7a5566', '#3a2b3d']);

  //stalls with striped awnings, glowing from inside
  for (const [i, x, roof] of [[0, 60, '#d9534f'], [1, 450, '#3f7cac'], [2, 860, '#d9534f'], [3, 1260, '#e2a33a']] as [number, number, string][]) {
    path(c, () => c.rect(x, 470, 300, 150), '#ffd59a', 3);
    glow(c, x + 150, 540, 200, '255,200,120', 0.45);
    for (let s = 0; s < 6; s++) path(c, () => c.rect(x - 15 + s * 55, 430, 55, 50), s % 2 ? '#fdf3e4' : roof, 2);
    for (let s = 0; s < 6; s++) path(c, () => c.arc(x + 12.5 + s * 55, 480, 27.5, 0, Math.PI), s % 2 ? '#fdf3e4' : roof, 2);
    path(c, () => c.rect(x, 585, 300, 45), '#8a5a3c', 3);
    for (let k = 0; k < 3; k++) silhouette(c, x + 70 + k * 80, 585, 0.32, `rgba(120,70,60,${0.5 + rand(i * 3 + k) * 0.3})`);
  }

  //strings of lanterns sagging between poles
  for (const [row, y0, y1, sag] of [[0, 110, 150, 70], [1, 230, 200, 60]]) {
    stroke(c, Array.from({ length: 33 }, (_, i): Pt => [(i / 32) * W, y0 + (y1 - y0) * (i / 32) + sag * 4 * (i / 32) * (1 - i / 32)]), INK, 1.5);
    for (let i = 1; i < 12; i++) {
      const u = i / 12;
      const color = (i + row) % 3 ? '#f2774f' : '#f6c35b';
      lantern(c, u * W, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u), 20 - row * 4, color, Math.sin(t * 1.2 + i + row) * 0.06);
    }
  }

  for (let i = 0; i < 9; i++) silhouette(c, 40 + i * 95 + Math.sin(t * 0.3 + i) * 10, 700 + rand(i) * 30, 0.75 + rand(i + 4) * 0.2, 'rgba(58,40,70,0.55)');

  //fireflies drifting up
  for (let i = 0; i < 24; i++) {
    const y = H - ((t * (12 + rand(i) * 18) + rand(i + 7) * H) % H);
    glow(c, rand(i + 3) * W + Math.sin(t + i) * 20, y, 10, '255,230,150', 0.6);
  }

  const laughing = beat === 'laugh' || beat === 'cover';
  const bob = (i: number) => (laughing ? Math.abs(Math.sin(t * 9 + i)) * 5 : Math.sin(t * 1.5 + i) * 1.5);
  const mood: Mood = laughing ? 'laugh' : beat === 'huddle' || !beat ? 'calm' : 'smile';
  const huddle = beat === 'huddle' ? 0.1 : 0;
  figure(c, 'mei', 980, 790, 1.45, { lean: huddle, bob: bob(0), mood, arms: beat === 'cover' ? 'mouth' : beat === 'wave' ? 'wave' : 'down' }, t);
  figure(c, 'kenji', 1110, 790, 1.5, { bob: bob(1), mood, arms: 'hold', held: 'phone' }, t);
  figure(c, 'sora', 1240, 790, 1.45, { lean: -huddle, bob: bob(2), mood, arms: beat === 'offer' ? 'out' : 'down', held: beat === 'offer' ? 'skewer' : undefined }, t);
}

function river(c: Ctx, t: number) {
  band(c, 0, 520, ['#0f1433', '#26305e', '#4b4a7c']);
  glow(c, 1200, 170, 220, '255,245,220', 0.25);
  oval(c, 1200, 170, 60, 60, '#fbf3dc', 0);
  for (let i = 0; i < 70; i++) oval(c, rand(i) * W, rand(i + 70) * 400, 1.4, 1.4, `rgba(255,250,230,${0.3 + 0.3 * Math.sin(t + i)})`, 0);

  //the far bank, a few windows still lit
  for (let i = 0; i < 26; i++) {
    const x = i * 64;
    const h = 40 + rand(i) * 90;
    path(c, () => c.rect(x, 520 - h, 60, h), '#1e2448', 0);
    if (rand(i + 9) > 0.45) path(c, () => c.rect(x + 18, 520 - h + 18, 10, 12), '#f7cf7a', 0);
  }
  band(c, 520, H, ['#1c2550', '#0d1230']);
  for (let i = 0; i < 18; i++) stroke(c, [[1170 + Math.sin(t * 2 + i) * 20, 540 + i * 18], [1230 + Math.sin(t * 2 + i) * 20, 540 + i * 18]], 'rgba(250,240,210,0.35)', 3);

  //paper lanterns floating out to sea
  for (let i = 0; i < 14; i++) {
    const x = ((rand(i) * (W + 200) + t * (10 + rand(i + 3) * 8)) % (W + 200)) - 100;
    const y = 560 + rand(i + 5) * 300;
    const s = 0.6 + (y - 560) / 300;
    const bobbing = Math.sin(t * 1.5 + i) * 2;
    glow(c, x, y + 30 * s, 60 * s, '255,170,90', 0.35);
    path(c, () => c.rect(x - 14 * s, y - 20 * s + bobbing, 28 * s, 24 * s), '#ffcf8a', 2);
    path(c, () => {
      c.moveTo(x - 18 * s, y - 20 * s + bobbing);
      c.lineTo(x, y - 32 * s + bobbing);
      c.lineTo(x + 18 * s, y - 20 * s + bobbing);
      c.closePath();
    }, '#c75a3c', 2);
  }
  band(c, 820, H, ['rgba(20,26,40,0)', 'rgba(20,26,40,0.9)']);
}

function cloud(c: Ctx, x: number, y: number, s: number) {
  const puffs: [number, number, number][] = [[0, 0, 50], [55, -20, 60], [115, 0, 48], [60, 18, 52], [-40, 15, 36], [160, 18, 34]];
  const trace = (dy: number, k: number) => {
    c.beginPath();
    for (const [px, py, r] of puffs) {
      c.moveTo(x + (px + r * k) * s, y + (py + dy) * s);
      c.arc(x + px * s, y + (py + dy) * s, r * k * s, 0, Math.PI * 2);
    }
  };
  trace(0, 1);
  c.strokeStyle = 'rgba(43,36,51,0.3)';
  c.lineWidth = 5;
  c.stroke();
  c.fillStyle = '#e1eef8';
  c.fill();
  trace(-8, 0.88);
  c.fillStyle = '#ffffff';
  c.fill();
}

function rooftop(c: Ctx, t: number, beat?: string) {
  band(c, 0, 560, ['#4fa2e2', '#97cff4', '#e3f4fb']);
  for (let i = 0; i < 5; i++) cloud(c, ((rand(i) * W + t * (5 + i)) % (W + 400)) - 250, 80 + rand(i + 2) * 200, 0.7 + rand(i + 4) * 0.6);
  for (let i = 0; i < 3; i++) {
    const x = ((t * 45 + i * 520) % (W + 200)) - 100;
    const y = 140 + i * 40 + Math.sin(t + i) * 15;
    const flap = Math.sin(t * 8 + i) * 6;
    stroke(c, [[x - 12, y - flap], [x, y], [x + 12, y - flap]], INK, 2.5);
  }

  //the city below the roof edge
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 24; i++) {
      const x = i * 70 - row * 30;
      const h = (row ? 50 : 90) + rand(i + row * 30) * (row ? 70 : 130);
      path(c, () => c.rect(x, 560 - h, 64, h), row ? '#8fb0c9' : '#b9d0e2', 0);
      for (let wy = 560 - h + 14; wy < 550; wy += 20) for (const wx of [12, 36]) path(c, () => c.rect(x + wx, wy, 12, 8), row ? '#a9c5da' : '#d2e2ee', 0);
    }
  band(c, 560, H, ['#ddd7cf', '#bdb5ab']);
  for (let x = 0; x < W; x += 160) stroke(c, [[x, 560], [x - 120, H]], 'rgba(43,36,51,0.12)', 2);
  stroke(c, [[0, 470], [W, 470]], '#7d8a99', 7);
  stroke(c, [[0, 515], [W, 515]], '#7d8a99', 4);
  for (let x = 20; x < W; x += 90) stroke(c, [[x, 470], [x, 560]], '#7d8a99', 4);
  path(c, () => c.roundRect(120, 560, 170, 110, 8), '#c9c3ba');
  for (let y = 580; y < 650; y += 16) stroke(c, [[140, y], [270, y]], 'rgba(43,36,51,0.3)', 2);

  //the bench, Ren and a coworker eating, Ms. Kuroda standing
  path(c, () => c.roundRect(520, 620, 560, 20, 6), '#c79a6b');
  for (const x of [550, 1030]) path(c, () => c.rect(x, 640, 16, 90), '#8a6748');
  figure(c, 'coworker', 640, 720, 1.4, { sit: true, mood: beat === 'praise' ? 'smile' : 'calm', arms: 'hold' }, t);
  path(c, () => c.roundRect(730, 600, 60, 22, 4), '#d9534f', 2);
  const ren: Pose =
    beat === 'brag' ? { arms: 'behind', mood: 'grin' } : beat === 'stretch' ? { arms: 'up', mood: 'grin' } : { arms: 'hold', mood: 'calm' };
  figure(c, 'ren', 880, 720, 1.4, { sit: true, ...ren }, t);
  path(c, () => c.roundRect(960, 600, 60, 22, 4), '#3f7cac', 2);
  figure(c, 'kuroda', 1220, 750, 1.45, { arms: beat === 'praise' ? 'out' : 'down', mood: beat === 'praise' ? 'smile' : 'calm', lean: beat === 'turn' ? -0.04 : 0 }, t);
}

function train(c: Ctx, t: number, beat?: string) {
  c.fillStyle = '#efe4d2';
  c.fillRect(0, 0, W, H);
  for (let x = 40; x < W; x += 280) path(c, () => c.roundRect(x, 60, 220, 60, 6), ['#f4c9c0', '#c9dcd0', '#f1dfa8'][Math.floor(x / 280) % 3], 2);

  //night towns going by outside, clipped to the windows
  const windows = [0, 1, 2, 3].map((i) => 30 + i * 400);
  c.save();
  c.beginPath();
  for (const x of windows) c.roundRect(x, 150, 340, 290, 18);
  c.clip();
  band(c, 150, 440, ['#141a33', '#2c3560']);
  path(c, () => {
    c.moveTo(0, 380);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, 370 - Math.abs(Math.sin((x + t * 20) / 140)) * 50);
    c.lineTo(W, 440);
    c.lineTo(0, 440);
  }, '#1b2142', 0);
  for (let i = 0; i < 40; i++) {
    const x = W - ((rand(i) * W + t * 90) % W);
    glow(c, x, 340 + rand(i + 4) * 60, 10, '255,210,130', 0.9);
  }
  for (let i = 0; i < 4; i++) {
    const x = W + 100 - ((i * 500 + t * 900) % (W + 400));
    path(c, () => c.rect(x, 150, 18, 290), '#0b0f22', 0);
  }
  c.restore();
  for (const x of windows) path(c, () => c.roundRect(x, 150, 340, 290, 18), undefined, 5);

  //straps swaying from the rail
  stroke(c, [[0, 40], [W, 40]], '#a8a39a', 6);
  for (let x = 100; x < W; x += 160) {
    const sway = Math.sin(t * 1.3 + x) * 4;
    stroke(c, [[x, 40], [x + sway, 110]], '#7d7a73', 4);
    oval(c, x + sway, 122, 12, 12, undefined, 4);
  }

  path(c, () => c.roundRect(0, 450, W, 115, 24), '#5f8f8c');
  path(c, () => c.roundRect(0, 560, W, 50, 16), '#6fa29e');
  path(c, () => c.rect(0, 610, W, 80), '#4a5e60');
  band(c, 690, H, ['#b5a895', '#9a8d7a']);

  if (beat === 'gone') {
    //one white petal left on the seat
    oval(c, 1020, 576, 7, 4, '#fbfbf7', 1.5);
    return;
  }
  if (beat === 'stand') figure(c, 'oldMan', 1360, 770, 1.55, { arms: 'hold', held: 'flowers', mood: 'smile' }, t);
  else
    figure(c, 'oldMan', 1000, 690, 1.5, { sit: true, arms: beat === 'pat' ? 'pat' : 'hold', held: 'flowers', mood: beat === 'pat' ? 'smile' : 'calm', lean: beat === 'talk' ? 0.05 : 0 }, t);
}

function platform(c: Ctx, t: number, since: number) {
  const pull = Math.min(since, 12) ** 2 * 18; //the train pulls away, faster and faster
  c.save();
  c.beginPath();
  c.roundRect(260, 110, 1080, 520, 30);
  c.clip();
  band(c, 110, 470, ['#141a35', '#323b6a']);
  for (let i = 0; i < 30; i++) oval(c, rand(i) * W, 120 + rand(i + 30) * 200, 1.4, 1.4, '#fff6dc', 0);
  path(c, () => c.rect(0, 110, W, 60), '#2a2f45', 0);
  band(c, 470, 640, ['#9a9ca6', '#7a7c86']);
  stroke(c, [[0, 636], [W, 636]], '#e8c84a', 8);
  path(c, () => c.rect(0, 640, W, 60), '#1d1f2a', 0);
  for (let i = -2; i < 12; i++) {
    const x = (((i * 300 - pull) % 3000) + 3000) % 3000 - 300;
    stroke(c, [[x, 170], [x, 200]], '#4a4f66', 4);
    glow(c, x, 214, 140, '255,225,160', 0.35);
    oval(c, x, 210, 16, 10, '#fff2c8', 2);
    stroke(c, [[x + 120, 170], [x + 120, 470]], '#3a3f55', 10);
  }
  figure(c, 'oldMan', 760 + Math.min(since, 12) * 16 - pull, 600, 0.9, { back: true, arms: 'hold', bob: Math.abs(Math.sin(t * 3)) * 2 }, t);
  for (let x = 0; x < W; x += 180) stroke(c, [[x + 260, 110], [x + 160, 630]], 'rgba(255,255,255,0.05)', 40);
  c.restore();

  c.beginPath();
  c.rect(0, 0, W, H);
  c.roundRect(260, 110, 1080, 520, 30);
  c.fillStyle = '#e6dccb';
  c.fill('evenodd');
  path(c, () => c.roundRect(260, 110, 1080, 520, 30), undefined, 6);
  path(c, () => c.roundRect(240, 90, 1120, 560, 40), undefined, 3);
  band(c, 700, H, ['#b5a895', '#9a8d7a']);
}

function windowSet(c: Ctx, t: number, since: number, beat?: string) {
  c.fillStyle = '#dfe3ea';
  c.fillRect(0, 0, W, H);

  c.save();
  c.beginPath();
  c.roundRect(240, 60, 1120, 500, 12);
  c.clip();
  band(c, 60, 560, ['#8a9db2', '#b8c6d4', '#cfd8e0']);
  for (let i = 0; i < 16; i++) {
    const x = 220 + i * 76;
    const h = 60 + rand(i + 2) * 110;
    path(c, () => {
      c.moveTo(x, 560);
      c.lineTo(x, 560 - h);
      c.lineTo(x + 36, 530 - h);
      c.lineTo(x + 72, 560 - h);
      c.lineTo(x + 72, 560);
    }, `rgba(110,128,150,${0.35 + rand(i) * 0.25})`, 0);
  }
  for (let i = 0; i < 160; i++) {
    const x = 240 + rand(i) * 1140;
    const y = 40 + ((rand(i + 1) * 540 + t * 700 * (0.8 + rand(i + 2) * 0.4)) % 540);
    stroke(c, [[x, y], [x - 5, y + 26]], 'rgba(255,255,255,0.35)', 1.5);
  }
  for (let i = 0; i < 60; i++) {
    const slide = rand(i + 8) > 0.8 ? (t * 12 * rand(i)) % 500 : 0;
    oval(c, 240 + rand(i + 3) * 1120, 60 + ((rand(i + 4) * 500 + slide) % 500), 2 + rand(i + 5) * 4, 2.5 + rand(i + 5) * 5, 'rgba(255,255,255,0.3)', 0);
  }
  c.restore();
  path(c, () => c.roundRect(240, 60, 1120, 500, 12), undefined, 18);
  c.strokeStyle = '#b08d6b';
  c.lineWidth = 12;
  c.stroke();
  stroke(c, [[800, 60], [800, 560]], '#b08d6b', 12);
  stroke(c, [[240, 310], [1360, 310]], '#b08d6b', 10);

  band(c, 595, H, ['#cdd2db', '#b8bec9']);
  path(c, () => c.roundRect(200, 555, 1200, 40, 8), '#c49a72');

  //a plant, the open book, a mug still steaming
  path(c, () => {
    c.moveTo(310, 500);
    c.lineTo(370, 500);
    c.lineTo(360, 556);
    c.lineTo(320, 556);
    c.closePath();
  }, '#d07a55');
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.4 + Math.sin(t * 0.8 + i) * 0.03;
    path(c, () => c.ellipse(340 + Math.cos(a) * 40, 500 + Math.sin(a) * 40, 30, 11, a, 0, Math.PI * 2), '#6f9c6a', 2);
  }
  path(c, () => {
    c.moveTo(640, 552);
    c.lineTo(660, 520);
    c.lineTo(770, 526);
    c.lineTo(770, 556);
    c.closePath();
  }, '#fbf8f0', 2.5);
  path(c, () => {
    c.moveTo(770, 556);
    c.lineTo(770, 526);
    c.lineTo(880, 520);
    c.lineTo(900, 552);
    c.closePath();
  }, '#f4efe2', 2.5);
  for (let k = 0; k < 4; k++) {
    stroke(c, [[672 + k * 4, 530 + k * 6], [760, 534 + k * 6]], 'rgba(43,36,51,0.25)', 1.5);
    stroke(c, [[780, 534 + k * 6], [870 - k * 4, 530 + k * 6]], 'rgba(43,36,51,0.25)', 1.5);
  }
  path(c, () => c.roundRect(1160, 506, 50, 50, 8), '#f2f0ea');
  path(c, () => c.arc(1214, 530, 13, -Math.PI / 2, Math.PI / 2), undefined, 4);
  for (let k = 0; k < 3; k++)
    stroke(c, Array.from({ length: 10 }, (_, j): Pt => [1172 + k * 13 + Math.sin(t * 2 + j * 0.6 + k) * 5, 498 - j * 9]), 'rgba(255,255,255,0.6)', 2);

  if (beat === 'note' || beat === 'phone') {
    c.save();
    c.translate(950, 545);
    c.rotate(-0.12);
    path(c, () => c.rect(-26, -10, 52, 18), '#fbf6ea', 2);
    stroke(c, [[-26, -1], [26, -1]], 'rgba(43,36,51,0.3)', 1.5);
    c.restore();
  }
  if (beat === 'phone') {
    const buzz = since < 1.6 ? Math.sin(t * 70) * 2 : 0;
    glow(c, 1070 + buzz, 548, 60, '200,230,255', 0.6);
    path(c, () => c.roundRect(1040 + buzz, 542, 60, 12, 4), '#2b2433', 2);
  }
}

function paper(c: Ctx, t: number) {
  c.fillStyle = '#f6efe2';
  c.fillRect(0, 0, W, H);
  glow(c, 800, 380, 420, '244,190,160', 0.45);
  oval(c, 800, 380, 170, 170, 'rgba(244,201,168,0.55)', 0);
  path(c, () => {
    c.moveTo(0, 700);
    c.bezierCurveTo(400, 600, 700, 690, 1000, 640);
    c.bezierCurveTo(1250, 600, 1450, 660, W, 630);
    c.lineTo(W, H);
    c.lineTo(0, H);
  }, '#e5d9c4', 0);
  for (let i = 0; i < 45; i++) {
    const x = ((rand(i) * W + t * (18 + rand(i + 9) * 25)) % (W + 100)) - 50;
    const y = ((rand(i + 3) * H + t * (22 + rand(i + 5) * 18)) % (H + 100)) - 50;
    c.save();
    c.translate(x, y);
    c.rotate(t * (0.6 + rand(i + 2)) + i);
    oval(c, 0, 0, 7, 4, 'rgba(240,170,185,0.8)', 0);
    c.restore();
  }
}

function drawSet(c: Ctx, cue: Cue, t: number, since: number) {
  if (cue.set === 'paper') paper(c, t);
  if (cue.set === 'festival') festival(c, t, cue.beat);
  if (cue.set === 'river') river(c, t);
  if (cue.set === 'rooftop') rooftop(c, t, cue.beat);
  if (cue.set === 'train') train(c, t, cue.beat);
  if (cue.set === 'platform') platform(c, t, since);
  if (cue.set === 'window') windowSet(c, t, since, cue.beat);
}

// ---------------------------------------------------------------------------
// comic panels, drawn in a 400x300 space
// ---------------------------------------------------------------------------

const PANEL_COLORS: Record<Mood | Thing, string> = {
  calm: '#dde7f2',
  smile: '#fde7d6',
  laugh: '#ffe3a8',
  cover: '#ffd1d6',
  grin: '#ffe0b0',
  soft: '#e6def0',
  phone: '#ffe9c7',
  texts: '#dfe9e4',
  flowers: '#e9eef0',
  note: '#f3ead8',
  laptops: '#2a2f4a',
};

function thing(c: Ctx, which: Thing) {
  if (which === 'phone') {
    for (let i = 0; i < 6; i++) glow(c, rand(i) * 400, rand(i + 3) * 300, 60, '255,160,90', 0.35);
    c.save();
    c.translate(210, 160);
    c.rotate(-0.25);
    path(c, () => c.roundRect(-60, -110, 120, 220, 18), INK);
    const g = c.createLinearGradient(-50, -100, 50, 100);
    g.addColorStop(0, '#9ad0ff');
    g.addColorStop(1, '#ffd6f0');
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(-50, -96, 100, 190, 10);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.moveTo(-50, 20);
    c.lineTo(50, -60);
    c.lineTo(50, -10);
    c.lineTo(-50, 70);
    c.fill();
    oval(c, -66, 40, 24, 30, PEOPLE.kenji.skin);
    oval(c, 66, 30, 22, 30, PEOPLE.kenji.skin);
    c.restore();
  }
  if (which === 'texts') {
    path(c, () => c.roundRect(110, 14, 180, 320, 24), INK);
    path(c, () => c.roundRect(120, 28, 160, 300, 14), '#f7f7f4', 0);
    c.fillStyle = '#e6ece8';
    c.fillRect(120, 40, 160, 34);
    c.fillStyle = INK;
    c.font = 'bold 15px system-ui, sans-serif';
    c.fillText('Aoi', 186, 62);
    path(c, () => c.roundRect(130, 88, 136, 76, 12), '#e4e6ea', 0);
    path(c, () => c.roundRect(130, 174, 136, 58, 12), '#e4e6ea', 0);
    c.fillStyle = INK;
    c.font = '13px system-ui, sans-serif';
    wrap(c, 'Got it back to you finally!! Sorry it took forever.', 140, 108, 118, 17);
    wrap(c, 'It helped more than you know :)', 140, 194, 118, 17);
  }
  if (which === 'flowers') {
    bouquet(c, 200, 140, 2.2);
    oval(c, 140, 230, 30, 22, PEOPLE.oldMan.skin);
    oval(c, 262, 226, 30, 22, PEOPLE.oldMan.skin);
    stroke(c, [[0, 300], [140, 250]], PEOPLE.oldMan.top, 40);
    stroke(c, [[400, 300], [262, 246]], PEOPLE.oldMan.top, 40);
  }
  if (which === 'note') {
    c.save();
    c.translate(200, 150);
    c.rotate(-0.06);
    path(c, () => c.rect(-160, -110, 320, 120), '#fbf6ea', 2.5);
    path(c, () => c.rect(-160, 10, 320, 110), '#efe6d2', 2.5);
    for (let y = -84; y < 0; y += 26) stroke(c, [[-150, y + 8], [150, y + 8]], 'rgba(90,120,180,0.25)', 1.5);
    c.fillStyle = '#2f3a6b';
    c.font = 'italic 21px Georgia, serif';
    c.fillText("I don't think I've been okay", -140, -66);
    c.fillText('for a while.', -140, -40);
    stroke(c, Array.from({ length: 24 }, (_, i): Pt => [-140 + i * 11, -12 + Math.sin(i * 1.7) * 4]), 'rgba(47,58,107,0.6)', 2);
    for (let y = 36; y < 110; y += 24) stroke(c, Array.from({ length: 24 }, (_, i): Pt => [-140 + i * 11, y + Math.sin(i * 1.3 + y) * 3]), 'rgba(47,58,107,0.15)', 2);
    c.restore();
  }
  if (which === 'laptops') {
    oval(c, 330, 60, 22, 22, '#fbf3dc', 0);
    oval(c, 80, 60, 30, 30, '#f4f1ea', 2.5);
    stroke(c, [[80, 60], [80, 40]], INK, 2.5);
    stroke(c, [[80, 60], [95, 64]], INK, 2.5);
    path(c, () => c.rect(0, 230, 400, 70), '#5b4a5e', 2);
    for (const x of [80, 230]) {
      glow(c, x + 45, 180, 120, '180,220,255', 0.35);
      path(c, () => c.roundRect(x, 130, 90, 70, 6), '#cfe6ff');
      path(c, () => {
        c.moveTo(x - 10, 230);
        c.lineTo(x + 100, 230);
        c.lineTo(x + 90, 200);
        c.lineTo(x, 200);
        c.closePath();
      }, '#a7adbd');
    }
    for (const x of [190, 345]) path(c, () => c.roundRect(x, 196, 24, 34, 5), '#f2f0ea');
  }
}

function drawPanel(c: Ctx, panel: Panel, w: number, h: number, dots: CanvasPattern) {
  const tint = 'who' in panel ? panel.mood : panel.thing;
  c.save();
  c.beginPath();
  c.rect(0, 0, w, h);
  c.clip();
  c.scale(w / 400, h / 300);
  c.fillStyle = PANEL_COLORS[tint];
  c.fillRect(0, 0, 400, 300);
  c.save();
  c.globalAlpha *= 0.18;
  c.fillStyle = dots;
  c.fillRect(0, 0, 400, 300);
  c.restore();
  if (tint === 'laugh' || tint === 'cover' || tint === 'grin')
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + rand(i) * 0.1;
      stroke(c, [[200 + Math.cos(a) * 150, 150 + Math.sin(a) * 120], [200 + Math.cos(a) * 400, 150 + Math.sin(a) * 400]], 'rgba(43,36,51,0.2)', 2);
    }
  if ('who' in panel) {
    c.translate(200, 155);
    face(c, panel.who, panel.mood, 88);
  } else thing(c, panel.thing);
  c.restore();
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  festival: new URL('./sounds/festival.m4a', import.meta.url).href,
  wind: new URL('./sounds/rooftop_wind.m4a', import.meta.url).href,
  train: new URL('./sounds/train.m4a', import.meta.url).href,
  rain: new URL('./sounds/rain.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

const MIX: Record<SetId, Partial<Record<Bed, number>>> = {
  paper: {},
  festival: { festival: 0.7 },
  river: { festival: 0.15, wind: 0.2 },
  rooftop: { wind: 0.6 },
  train: { train: 0.7 },
  platform: { train: 0.45 },
  window: { rain: 0.8 },
};

interface OneShot {
  src: string;
  volume: number;
  delay?: number;
}

const ONE_SHOTS: Record<string, OneShot> = {
  note_falls: { src: new URL('./sounds/page_turn.m4a', import.meta.url).href, volume: 0.7, delay: 0.4 },
  platform_leaves: { src: new URL('./sounds/train_door.m4a', import.meta.url).href, volume: 0.6 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

//browsers only allow audio after the user has interacted with the page, so playback starts on the first key or click
function createSoundscape() {
  const context = new AudioContext();
  const beds = (Object.entries(BEDS) as [Bed, string][]).map(([bed, src]) => {
    const element = new Audio(src);
    element.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(element).connect(gain).connect(context.destination);
    return { bed, element, gain };
  });

  let unlocked = false;
  const stopListening = () => {
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('pointerdown', unlock);
  };
  function unlock() {
    context
      .resume()
      .then(() => Promise.all(beds.map(({ element }) => element.play())))
      .then(() => {
        unlocked = true;
        stopListening();
      })
      .catch(() => {}); //still locked; the next key or click tries again
  }
  window.addEventListener('keydown', unlock);
  window.addEventListener('pointerdown', unlock);
  unlock();

  const timers = new Set<number>();
  return {
    mix(set: SetId) {
      for (const { bed, gain } of beds) gain.gain.setTargetAtTime((MIX[set][bed] ?? 0) * MASTER_VOLUME, context.currentTime, CROSSFADE / 3);
    },
    play({ src, volume, delay = 0 }: OneShot) {
      if (!unlocked) return;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        const element = new Audio(src);
        element.volume = volume * MASTER_VOLUME;
        element.play().catch(() => {});
      }, delay * 1000);
      timers.add(timer);
    },
    dispose() {
      stopListening();
      timers.forEach((timer) => window.clearTimeout(timer));
      beds.forEach(({ element }) => element.pause());
      void context.close();
    },
  };
}

// ---------------------------------------------------------------------------
// the scene
// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function texture(size: number, paint: (c: Ctx) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d')!;
  paint(c);
  return c.createPattern(canvas, 'repeat')!;
}

function ReadingPeople({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Reading People has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active], prevAt: 0 });
  const sound = useRef<ReturnType<typeof createSoundscape> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const dots = texture(10, (t) => {
      t.fillStyle = INK;
      t.beginPath();
      t.arc(5, 5, 1.6, 0, Math.PI * 2);
      t.fill();
    });
    const grain = texture(180, (t) => {
      for (let i = 0; i < 2600; i++) {
        t.fillStyle = `rgba(60,40,30,${Math.random() * 0.5})`;
        t.fillRect(Math.random() * 180, Math.random() * 180, 1.4, 1.4);
      }
    });
    const soundscape = createSoundscape();
    sound.current = soundscape;

    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      if (el.width !== Math.round(sw * dpr) || el.height !== Math.round(sh * dpr)) {
        el.width = Math.round(sw * dpr);
        el.height = Math.round(sh * dpr);
      }
      const { cue, at, prev, prevAt } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      if (prev.set !== cue.set && since < SET_FADE) {
        drawSet(c, prev, t, (now - prevAt) / 1000);
        c.globalAlpha = ease(since / SET_FADE);
      }
      drawSet(c, cue, t, since);
      c.globalAlpha = 1;

      //panels slide in from their side, unless the last cue already showed the same one there
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pw = Math.min(460, sw * (sw < 700 ? 0.46 : 0.34));
      const ph = pw * 0.75;
      cue.panels?.forEach((panel, i) => {
        const same = JSON.stringify(prev.panels?.[i]) === JSON.stringify(panel);
        const p = same ? 1 : ease((since - 0.15 - i * 0.2) / 0.5);
        const side = i ? -1 : 1;
        const x = i ? sw * 0.05 : sw * 0.95 - pw;
        const y = sh * (i ? 0.14 : 0.07);
        c.save();
        c.globalAlpha = p;
        c.translate(x + pw / 2 + side * (1 - p) * 70, y + ph / 2);
        c.rotate(side * 0.02);
        c.translate(-pw / 2, -ph / 2);
        c.fillStyle = INK;
        c.fillRect(9, 9, pw + 6, ph + 6);
        c.fillStyle = '#fffdf8';
        c.fillRect(-6, -6, pw + 12, ph + 12);
        drawPanel(c, panel, pw, ph, dots);
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.strokeRect(-6, -6, pw + 12, ph + 12);
        c.strokeRect(0, 0, pw, ph);
        c.restore();
      });

      //paper grain and a soft vignette over everything
      c.globalAlpha = 0.1;
      c.fillStyle = grain;
      c.fillRect(0, 0, sw, sh);
      c.globalAlpha = 1;
      const v = c.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.4, sw / 2, sh / 2, Math.max(sw, sh) * 0.75);
      v.addColorStop(0, 'rgba(40,30,50,0)');
      v.addColorStop(1, 'rgba(40,30,50,0.35)');
      c.fillStyle = v;
      c.fillRect(0, 0, sw, sh);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const current = shown.current;
    shown.current = { cue: cues[active], at: now, prev: current.cue, prevAt: current.at };
    sound.current?.mix(cues[active].set);
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const card = cues[active].card;
  return (
    <div style={styles.scene}>
      <canvas ref={canvas} style={styles.canvas} />
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

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: '#f6efe2',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
    background: 'rgba(246,239,226,0.78)',
    color: INK,
    fontFamily: 'Georgia, "Times New Roman", serif',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  name: {
    fontSize: 64,
    letterSpacing: 2,
  },
};

export default ReadingPeople;
