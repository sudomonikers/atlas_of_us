import { useEffect, useRef, useState, type CSSProperties } from 'react';

// Snowed In is 16-bit pixel art. Every set is drawn into a 320x180 buffer from a small palette, with ordered (Bayer)
// dithering where a painter would blend, and blown up 5x with no smoothing so every pixel stays a hard square.
// Each set's background is drawn once and kept. People, fire, snow, lights and fireworks are drawn live on the buffer,
// so they stay pixelated too. The camera crops into the buffer, panning between cues on the same set and fading through
// a cut when the set changes. Each cue's focus is framed to fit the part of the screen above the dialogue box, whatever
// the screen's size or shape, and pixels never get too small to read on a phone.

const LW = 320; //the buffer, one fifth of the scene
const LH = 180;
const SET_FADE = 0.8; //seconds to crossfade between sets
const PAN = 1.4; //seconds to pan between cues on one set
const DOCK = 230; //css pixels at the bottom of the screen the dialogue box covers
const MIN_PIXEL = 2.5; //the smallest a buffer pixel may be drawn, in css pixels
type Ctx = CanvasRenderingContext2D;

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'porch' | 'phone' | 'room' | 'deck' | 'hill' | 'tub' | 'bunk' | 'road';
type Focus = [x: number, y: number, zoom: number]; //where the camera looks in the buffer, and how far in

interface Cue {
  set: SetId;
  beat?: string;
  focus: Focus;
  card?: [kicker: string, name: string];
}

const WIDE: Focus = [160, 90, 1];

const cues: Record<string, Cue> = {
  title_card: { set: 'porch', focus: WIDE, card: ['The Party of Strangers', 'Snowed In'] },
  porch_far: { set: 'porch', focus: WIDE },
  porch: { set: 'porch', focus: [150, 108, 1.5] },
  phone: { set: 'phone', focus: WIDE },
  phone_text: { set: 'phone', beat: 'text', focus: WIDE },
  porch_road: { set: 'porch', focus: [272, 156, 3] },
  porch_door: { set: 'porch', beat: 'open', focus: [160, 120, 2.4] },
  porch_bram: { set: 'porch', beat: 'bram', focus: [160, 120, 2.8] },
  room_bram: { set: 'room', beat: 'bram', focus: [40, 118, 2.6] },
  room_corner: { set: 'room', focus: [90, 112, 1.6] },
  room_wide: { set: 'room', focus: WIDE },
  room_heads: { set: 'room', beat: 'heads', focus: [160, 104, 1.1] },
  room_glogg: { set: 'room', focus: [100, 124, 2.4] },
  room_puzzle: { set: 'room', focus: [226, 122, 2.6] },
  room_circle: { set: 'room', focus: [160, 140, 2.2] },
  room_delphine: { set: 'room', beat: 'delphine', focus: [160, 138, 3.2] },
  karaoke_wide: { set: 'room', beat: 'karaoke', focus: [70, 114, 2] },
  karaoke_mic: { set: 'room', beat: 'mic', focus: [56, 120, 3] },
  karaoke_sing: { set: 'room', beat: 'sing', focus: [70, 114, 2] },
  karaoke_duet: { set: 'room', beat: 'duet', focus: [70, 114, 2] },
  karaoke_pass: { set: 'room', beat: 'pass', focus: [70, 114, 2] },
  karaoke_cheer: { set: 'room', beat: 'cheer', focus: [80, 112, 1.8] },
  toast: { set: 'room', beat: 'toast', focus: [104, 122, 2.4] },
  deck_count: { set: 'deck', beat: 'count', focus: WIDE },
  deck_fireworks: { set: 'deck', beat: 'fireworks', focus: WIDE },
  room_sleds: { set: 'room', beat: 'sleds', focus: [40, 118, 2.6] },
  hill_sled: { set: 'hill', focus: WIDE },
  tub: { set: 'tub', focus: WIDE },
  bunk: { set: 'bunk', focus: WIDE },
  road: { set: 'road', focus: WIDE },
  phone_day: { set: 'phone', beat: 'day', focus: WIDE },
  road_far: { set: 'road', beat: 'far', focus: [252, 66, 2.6] },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// palette
// ---------------------------------------------------------------------------

const NIGHT = ['#060a1c', '#0f1636', '#1d2958'];
const DAY = ['#4f86d8', '#7fb0ea', '#bcd8f5'];
const SNOW = '#dfe8f5';
const SNOW_SHADE = '#a9bbdc';
const SNOW_DUSK = '#6f82b0';
const WOOD = '#7a4a2e';
const WOOD_DARK = '#4a2a1a';
const WOOD_DEEP = '#2e1a10';
const WOOD_LIGHT = '#9a6440';
const STONE = '#6e6a72';
const STONE_DARK = '#46424c';
const STONE_LIGHT = '#8c8892';
const WARM = '#ffcf7a';
const WARM_DEEP = '#e89a4a';
const FIRE = ['#fff3b0', '#ffd36b', '#ff8a2a', '#d8402a'];
const PINE = '#0f2626';
const INK = '#0a0c16';
const BOOT = '#241a16';
const EYE = '#1a1218';
const LIGHTS = ['#ff5a5a', '#ffd36b', '#6ad0ff', '#7ae08a', '#ff8ad8'];

// ---------------------------------------------------------------------------
// pixels
// ---------------------------------------------------------------------------

const px = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};

//a fixed per-index random, for things that should land in the same place every time
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

//ordered dithering: a 4x4 threshold map decides which of two colours each pixel takes
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dithered = (x: number, y: number, amount: number) => amount * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5;

//a vertical blend through a list of colours, top to bottom
function gradient(c: Ctx, x0: number, y0: number, w: number, h: number, colors: string[]) {
  for (let y = 0; y < h; y++) {
    const t = (y / Math.max(1, h - 1)) * (colors.length - 1);
    const i = Math.min(colors.length - 2, Math.floor(t));
    for (let x = 0; x < w; x++) px(c, x0 + x, y0 + y, 1, 1, dithered(x0 + x, y0 + y, t - i) ? colors[i + 1] : colors[i]);
  }
}

//an ellipse filled with a colour that thins out toward its edge
function pool(c: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, strength = 1) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d < 1 && dithered(x, y, (1 - d) * strength)) px(c, x, y, 1, 1, color);
    }
}

//a polygon by scanline, so the edges come out as hard steps rather than antialiased
function shape(c: Ctx, points: [number, number][], color: string) {
  const ys = points.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
    const xs: number[] = [];
    points.forEach(([ax, ay], i) => {
      const [bx, by] = points[(i + 1) % points.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
    });
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) px(c, xs[i], y, Math.round(xs[i + 1]) - Math.round(xs[i]), 1, color);
  }
}

function stars(c: Ctx, height: number, count: number, seed: number) {
  for (let i = 0; i < count; i++) px(c, rand(seed + i) * LW, rand(seed + i + 500) * height, 1, 1, rand(seed + i + 900) > 0.8 ? '#ffffff' : '#8e9cc8');
}

//a ridge line from sums of sines, filled down to the bottom of the buffer
function ridge(c: Ctx, base: number, height: number, seed: number, color: string, cap?: string) {
  for (let x = 0; x < LW; x++) {
    const y = Math.round(base - height * (0.5 + 0.3 * Math.sin(x / 23 + seed) + 0.2 * Math.sin(x / 9 + seed * 3)));
    px(c, x, y, 1, LH - y, color);
    if (cap) px(c, x, y, 1, 2 + Math.round(rand(x + seed) * 2), cap);
  }
}

function pine(c: Ctx, x: number, y: number, size: number, color = PINE, snow = SNOW) {
  for (let r = 0; r < size * 3; r++) {
    const half = Math.floor((r % size) / 1.4) + Math.floor(r / size) + 1;
    px(c, x - half, y - size * 3 + r, half * 2 + 1, 1, color);
    if (r % size === 0) px(c, x - half + 1, y - size * 3 + r, half * 2 - 1, 1, snow);
  }
  px(c, x, y, 1, 2, WOOD_DEEP);
}

//falling snow over a region, drifting with the wind
function snowfall(c: Ctx, t: number, count: number, [x0, y0, w, h]: [number, number, number, number], wind = 6) {
  for (let i = 0; i < count; i++) {
    const speed = 8 + rand(i) * 14;
    const x = x0 + ((((rand(i + 50) * w + t * wind + Math.sin(t * 1.3 + i) * 3) % w) + w) % w);
    const y = y0 + ((rand(i + 99) * h + t * speed) % h);
    px(c, x, y, 1, 1, rand(i + 7) > 0.7 ? '#ffffff' : SNOW_SHADE);
  }
}

// a 3x5 pixel font, for the few words and numbers the scenes show
const GLYPHS: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  ':': '000010000010000', '!': '010010010000010', '?': '111001010000010', ' ': '000000000000000',
  A: '010101111101101', E: '111100110100111', H: '101101111101101', N: '101111111101101', P: '110101110100100',
  R: '110101110101101', W: '101101111111101', Y: '101101010010010',
};

function pixelText(c: Ctx, text: string, cx: number, y: number, scale: number, color: string) {
  let x = Math.round(cx - (text.length * 4 * scale - scale) / 2);
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') px(c, x + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, color);
    x += 4 * scale;
  }
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

type Who = 'bram' | 'pip' | 'delphine' | 'skier1' | 'skier2' | 'skier3' | 'guest1' | 'guest2' | 'guest3' | 'guest4' | 'guest5';
type Hair = 'short' | 'bob' | 'long' | 'curls' | 'bun' | 'beard' | 'beanie';
type Pose = 'stand' | 'hold' | 'up' | 'wave' | 'talk' | 'offer' | 'mic' | 'ballad' | 'pour' | 'carry' | 'sit';
type Face = 'front' | 'back' | 'left' | 'right';

interface Look {
  skin: string;
  hair: string;
  style: Hair;
  top: string;
  bottom: string;
  band?: string; //a knitted stripe across the chest
  dress?: boolean;
  big?: boolean;
}

const PEOPLE: Record<Who, Look> = {
  bram: { skin: '#e8b48a', hair: '#b4562a', style: 'beard', top: '#b8322e', bottom: '#33304a', band: '#f2ead8', big: true },
  pip: { skin: '#f1cfae', hair: '#2b2230', style: 'bob', top: '#4f8a72', bottom: '#33303a' },
  delphine: { skin: '#9a6544', hair: '#1d1414', style: 'curls', top: '#c9ccd6', bottom: '#c9ccd6', dress: true },
  skier1: { skin: '#f0c8a0', hair: '#d8402a', style: 'beanie', top: '#3a6ec8', bottom: '#2a2a38' },
  skier2: { skin: '#c68a5c', hair: '#2a1a14', style: 'short', top: '#e0a020', bottom: '#3a3448' },
  skier3: { skin: '#f6d8c0', hair: '#e8d088', style: 'long', top: '#7a3a8a', bottom: '#2a2a38' },
  guest1: { skin: '#8a5a3a', hair: '#141010', style: 'bun', top: '#2f6a5a', bottom: '#2a2430' },
  guest2: { skin: '#f0c8a0', hair: '#6a4028', style: 'short', top: '#5a5a7a', bottom: '#2e2a36', band: '#c8c0d8' },
  guest3: { skin: '#e8b48a', hair: '#3a2418', style: 'long', top: '#c85a7a', bottom: '#33304a' },
  guest4: { skin: '#b07850', hair: '#1a1414', style: 'short', top: '#3a4a6a', bottom: '#22222c' },
  guest5: { skin: '#f6d8c0', hair: '#a87038', style: 'bob', top: '#d8c8a8', bottom: '#4a3a30' },
};

const CUP = '#e8e0d0';
const MIC = '#2a2a32';
const BOTTLE = '#2e6a3a';

//one person, standing on (x, y). Every part is a few flat rectangles
function person(c: Ctx, look: Look, x: number, y: number, pose: Pose, face: Face, t: number, seed: number) {
  const k = look.big ? 1 : 0;
  const jump = (pose === 'up' || pose === 'ballad') && Math.sin(t * 9 + seed) > 0 ? 1 : 0;
  const sit = pose === 'sit';
  const ty = y - 7 - jump - (sit ? 3 : 0); //bottom of the torso
  const hy = ty - 7; //bottom of the head
  const [L, R] = [x - 5 - k, x + 4 + k]; //where the arms hang

  if (!sit) {
    if (look.dress) {
      px(c, x - 4 - k, y - 8 - jump, 8 + 2 * k, 5, look.top);
      px(c, x - 2, y - 3, 1, 2, look.skin);
      px(c, x + 1, y - 3, 1, 2, look.skin);
    } else {
      px(c, x - 3 - k, y - 7, 2 + k, 6, look.bottom);
      px(c, x + 1, y - 7, 2 + k, 6, look.bottom);
    }
    px(c, x - 3 - k, y - 1, 3 + k, 1, BOOT);
    px(c, x + 1, y - 1, 3 + k, 1, BOOT);
  }

  px(c, x - 4 - k, ty - 7, 8 + 2 * k, 7, look.top);
  if (look.band) {
    px(c, x - 4 - k, ty - 5, 8 + 2 * k, 1, look.band);
    for (let i = 0; i < 8 + 2 * k; i += 2) px(c, x - 4 - k + i, ty - 4, 1, 1, look.band);
  }

  //arms
  const down = (ax: number) => {
    px(c, ax, ty - 7, 1, 6, look.top);
    px(c, ax, ty - 1, 1, 1, look.skin);
  };
  const up = (ax: number) => {
    px(c, ax, ty - 13, 1, 6, look.top);
    px(c, ax, ty - 14, 1, 1, look.skin);
  };
  const out = (wave = 0) => {
    px(c, R, ty - 6, 4, 1, look.top);
    px(c, R + 4, ty - 7 + wave, 1, 1, look.skin);
  };
  const toMouth = () => {
    px(c, R, ty - 7, 1, 3, look.top);
    px(c, x + 2 + k, hy, 2, 1, look.skin);
    px(c, x + 2 + k, hy - 2, 1, 2, MIC);
  };
  const swing = Math.sin(t * 3 + seed) > 0;
  if (pose === 'up') {
    up(L);
    up(R);
  } else if (pose === 'wave') {
    down(L);
    px(c, R + (swing ? 1 : 0), ty - 13, 1, 6, look.top);
    px(c, R + (swing ? 1 : 0), ty - 14, 1, 1, look.skin);
  } else if (pose === 'talk') {
    down(L);
    if (Math.sin(t * 1.7 + seed) > -0.2) out(swing ? -1 : 0);
    else down(R);
  } else if (pose === 'offer') {
    down(L);
    out();
    px(c, R + 5, ty - 9, 1, 3, MIC);
  } else if (pose === 'mic') {
    down(L);
    toMouth();
  } else if (pose === 'ballad') {
    up(L);
    toMouth();
  } else if (pose === 'pour') {
    down(L);
    out();
    px(c, R + 3, ty - 11, 2, 4, BOTTLE);
    px(c, R + 4, ty - 12, 1, 1, '#d8c070');
  } else if (pose === 'carry') {
    down(L);
    down(R);
    px(c, x - 7 - k, ty - 6, 14 + 2 * k, 4, '#d8402a');
    px(c, x - 6 - k, ty - 3, 12 + 2 * k, 2, '#3a6ec8');
  } else if (pose === 'sit') {
    px(c, L, ty - 7, 1, 4, look.top);
    px(c, R, ty - 7, 1, 4, look.top);
  } else {
    down(L);
    down(R);
    if (pose === 'hold') px(c, R, ty - 3, 2, 2, CUP);
  }

  //head
  px(c, x - 3, hy - 5, 6, 5, face === 'back' ? look.hair : look.skin);
  const blink = (t * 0.6 + seed * 0.37) % 4 < 0.12;
  if (face === 'front' && !blink) {
    px(c, x - 2, hy - 3, 1, 1, EYE);
    px(c, x + 1, hy - 3, 1, 1, EYE);
    if (pose === 'up' || pose === 'ballad' || pose === 'talk') px(c, x - 1, hy - 1, 2, 1, '#8a3030');
  }
  if (face === 'left' && !blink) px(c, x - 2, hy - 3, 1, 1, EYE);
  if (face === 'right' && !blink) px(c, x + 1, hy - 3, 1, 1, EYE);

  const hair = look.hair;
  if (look.style === 'short') px(c, x - 3, hy - 6, 6, 2, hair);
  if (look.style === 'bob' || look.style === 'long') {
    const len = look.style === 'bob' ? 4 : 7;
    px(c, x - 4, hy - 6, 8, 2, hair);
    px(c, x - 4, hy - 4, 1, len, hair);
    px(c, x + 3, hy - 4, 1, len, hair);
  }
  if (look.style === 'curls') {
    px(c, x - 5, hy - 8, 10, 3, hair);
    px(c, x - 5, hy - 5, 2, 6, hair);
    px(c, x + 3, hy - 5, 2, 6, hair);
  }
  if (look.style === 'bun') {
    px(c, x - 3, hy - 6, 6, 2, hair);
    px(c, x - 1, hy - 8, 3, 2, hair);
  }
  if (look.style === 'beanie') {
    px(c, x - 4, hy - 7, 8, 3, hair);
    px(c, x - 1, hy - 8, 2, 1, '#ffffff');
  }
  if (look.style === 'beard') {
    px(c, x - 3, hy - 6, 6, 1, hair);
    if (face !== 'back') {
      px(c, x - 3, hy - 2, 6, 2, hair);
      px(c, x - 2, hy, 4, 1, hair);
      if (pose === 'up' || pose === 'mic' || pose === 'ballad' || pose === 'talk') px(c, x - 1, hy - 2, 2, 1, '#6a2020');
    }
  }
  if (face === 'left') px(c, x + 2, hy - 4, 1, 3, hair);
  if (face === 'right') px(c, x - 3, hy - 4, 1, 3, hair);
}

interface Placed {
  who: Who;
  x: number;
  y: number;
  pose: Pose;
  face: Face;
}

const crowd = (c: Ctx, cast: Placed[], t: number) =>
  [...cast].sort((a, b) => a.y - b.y).forEach((p, i) => person(c, PEOPLE[p.who], p.x, p.y, p.pose, p.face, t, i * 1.7 + p.x));

//the same people, three times the size, as they're right in front of the camera
function crowdNear(c: Ctx, cast: Placed[], t: number) {
  [...cast].sort((a, b) => a.y - b.y).forEach((p, i) => {
    c.save();
    c.translate(p.x, p.y);
    c.scale(3, 3);
    person(c, PEOPLE[p.who], 0, 0, p.pose, p.face, t, i * 2.3);
    c.restore();
  });
}

// ---------------------------------------------------------------------------
// the porch
// ---------------------------------------------------------------------------

const DOOR = { x: 152, y: 108, w: 16, h: 32 };

function porchSet(c: Ctx) {
  gradient(c, 0, 0, LW, 120, NIGHT);
  stars(c, 80, 50, 1);
  ridge(c, 92, 40, 1.2, '#18224a', '#5a6a9a');
  ridge(c, 120, 30, 4.1, '#121a38');
  //the snowfield
  gradient(c, 0, 128, LW, 52, [SNOW_DUSK, SNOW_SHADE, SNOW]);
  for (let i = 0; i < 9; i++) pine(c, 8 + i * 36 + rand(i) * 12, 132 - rand(i + 3) * 6, 4 + Math.round(rand(i + 4) * 2), '#0c1e22', SNOW_SHADE);
  //the road falling away to the right
  shape(c, [[226, 152], [250, 150], [LW, 166], [LW, 180], [292, 180]], '#3a3e52');
  shape(c, [[240, 151], [250, 150], [LW, 166], [LW, 170]], SNOW_SHADE);
  plough(c);
  //snowed-in cars
  ['#b8322e', '#3a6ec8', '#e0a020'].forEach((color, i) => {
    const x = 18 + i * 34;
    px(c, x - 2, 146, 28, 6, color);
    px(c, x + 2, 151, 4, 3, INK);
    px(c, x + 18, 151, 4, 3, INK);
    pool(c, x + 12, 144, 16, 6, SNOW, 2);
  });
  //the lodge, an A-frame
  px(c, 100, 88, 120, 52, WOOD);
  for (let y = 92; y < 140; y += 4) px(c, 100, y, 120, 1, WOOD_DARK);
  shape(c, [[160, 22], [236, 94], [84, 94]], WOOD_DARK);
  shape(c, [[160, 28], [228, 92], [92, 92]], WOOD);
  for (let y = 34; y < 92; y += 5) {
    const half = ((y - 28) / 64) * 68;
    px(c, 160 - half, y, half * 2, 1, WOOD_DARK);
  }
  //snow on the roof
  shape(c, [[160, 18], [240, 92], [234, 96], [160, 26], [86, 96], [80, 92]], SNOW);
  for (let i = 0; i < 12; i++) px(c, 84 + i * 13, 94 + (i % 3), 2, 3 + (i % 2) * 2, '#cfe0f5');
  //windows
  shape(c, [[160, 44], [178, 70], [142, 70]], WARM);
  [[108, 100], [182, 100]].forEach(([x, y]) => {
    px(c, x - 2, y - 2, 34, 26, WOOD_DEEP);
    px(c, x, y, 30, 22, WARM);
    px(c, x + 14, y, 2, 22, WOOD_DEEP);
    px(c, x, y + 10, 30, 2, WOOD_DEEP);
    px(c, x - 3, y + 22, 36, 2, SNOW);
  });
  //the door, closed, and the porch steps
  px(c, DOOR.x - 2, DOOR.y - 2, DOOR.w + 4, DOOR.h + 2, WOOD_DEEP);
  px(c, DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#5a2a1a');
  px(c, DOOR.x + 12, DOOR.y + 16, 2, 2, WARM);
  pool(c, 160, 116, 6, 6, '#3a7a3a', 3); //a wreath
  pool(c, 160, 116, 3, 3, '#5a2a1a', 3);
  px(c, 140, 140, 40, 3, WOOD_DARK);
  px(c, 136, 143, 48, 3, WOOD);
  px(c, 132, 146, 56, 2, SNOW);
  //footprints from the cars to the door
  for (let i = 0; i < 12; i++) px(c, 100 + i * 3.2 + (i % 2) * 2, 158 - i * 1 + (i % 2), 2, 1, SNOW_DUSK);
}

//the snowplough parked across the road at the bottom of the hill, facing up it, behind a barrier
const BEACON = { x: 278, y: 145 };

function plough(c: Ctx) {
  //the dump body behind the cab, then the cab
  px(c, 282, 150, 22, 11, '#c86a14');
  px(c, 282, 150, 22, 1, '#e8a040');
  for (let x = 286; x < 304; x += 5) px(c, x, 152, 1, 8, '#a85410');
  px(c, 270, 147, 13, 14, '#e08a20');
  px(c, 270, 146, 13, 1, SNOW);
  px(c, 272, 149, 8, 5, '#9cc4e8');
  px(c, 272, 149, 2, 5, '#c8e0f5');
  px(c, 276, 147, 4, 1, '#3a3a44'); //the beacon's base
  px(c, 266, 158, 40, 4, '#3a3a44');
  //the blade, angled out front with hazard stripes
  shape(c, [[256, 153], [267, 155], [267, 166], [254, 166]], '#b8bcc8');
  for (let i = 0; i < 4; i++) px(c, 257 + i * 3, 162, 2, 3, i % 2 ? INK : '#f0c020');
  px(c, 254, 166, 13, 1, SNOW);
  //wheels
  [274, 296].forEach((x) => {
    pool(c, x, 164, 4, 4, INK, 4);
    px(c, x - 1, 163, 2, 2, '#6b6e7a');
  });
  //the barrier
  px(c, 238, 152, 2, 12, '#3a3a44');
  px(c, 252, 154, 2, 12, '#3a3a44');
  for (let x = 236; x < 256; x += 4) px(c, x, 153, 4, 3, (x / 4) % 2 ? '#ffffff' : '#d8402a');
}

function porchLive(c: Ctx, beat: string | undefined, t: number) {
  //people moving past the windows
  [[108, 100], [182, 100]].forEach(([x, y], w) => {
    for (let i = 0; i < 2; i++) {
      const sx = x + 4 + ((t * (4 + i * 3) + w * 13 + i * 11) % 26);
      const bob = Math.sin(t * 5 + i + w) > 0 ? 1 : 0;
      px(c, sx, y + 9 + bob, 5, 13 - bob, '#b26a3a');
      px(c, sx + 1, y + 5 + bob, 3, 3, '#b26a3a');
    }
    px(c, x + 14, y, 2, 22, WOOD_DEEP);
    px(c, x, y + 10, 30, 2, WOOD_DEEP);
  });
  //the plough's beacon turning, throwing orange light one way then the other, and its headlight up the road
  const turn = Math.sin(t * 5);
  px(c, BEACON.x - 1, BEACON.y, 3, 2, turn > 0 ? '#ffb040' : '#a85410');
  pool(c, BEACON.x + turn * 10, BEACON.y + 4, 22, 12, '#ff9a2a', 0.55 * Math.abs(turn));
  for (let i = 1; i < 28; i++) for (let w = -i / 5; w <= i / 5; w++) if (dithered(255 - i, 158 - i * 0.3 + w, 0.7 - i / 40)) px(c, 255 - i, 158 - i * 0.3 + w, 1, 1, '#fff1c0');
  px(c, 268, 156, 2, 2, '#fff1c0');
  //the porch lantern
  pool(c, 176, 112, 10, 10, WARM, 0.5 + 0.1 * Math.sin(t * 7));
  px(c, 175, 110, 3, 4, WARM);
  if (beat === 'open' || beat === 'bram') {
    px(c, DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#ffe2a0');
    px(c, DOOR.x - 6, DOOR.y, 6, DOOR.h, '#5a2a1a'); //the door swung in
    for (let y = 0; y < 34; y++) {
      const half = 10 + y * 0.9;
      for (let x = -half; x < half; x++) if (dithered(160 + x, 146 + y, 0.6 - y / 70)) px(c, 160 + x, 146 + y, 1, 1, '#f0d8a0');
    }
    //the party, far inside
    for (let i = 0; i < 3; i++) {
      const bob = Math.sin(t * 6 + i * 2) > 0 ? 1 : 0;
      px(c, DOOR.x + 2 + i * 5, DOOR.y + 14 + bob, 3, 8, '#a8603a');
      px(c, DOOR.x + 2 + i * 5, DOOR.y + 11 + bob, 3, 2, '#a8603a');
    }
    if (beat === 'bram') person(c, PEOPLE.bram, 160, 141, 'wave', 'front', t, 0);
  }
  snowfall(c, t, 140, [0, 0, LW, LH], 10);
}

// ---------------------------------------------------------------------------
// the phone
// ---------------------------------------------------------------------------

function phoneSet(c: Ctx, day: boolean) {
  if (day) {
    //the car: the windscreen, the road ahead and the dashboard
    gradient(c, 0, 0, LW, 90, DAY);
    ridge(c, 92, 50, 2, '#e8eef8', '#ffffff');
    ridge(c, 104, 24, 5, '#a9bddd');
    gradient(c, 0, 100, LW, 20, [SNOW, SNOW_SHADE]);
    shape(c, [[150, 100], [170, 100], [250, 120], [70, 120]], '#6b6e7a');
    px(c, 0, 0, LW, 8, '#2a2a32');
    shape(c, [[0, 0], [24, 0], [6, 120], [0, 120]], '#2a2a32');
    shape(c, [[LW, 0], [296, 0], [314, 120], [LW, 120]], '#2a2a32');
    gradient(c, 0, 118, LW, 62, ['#3a3a44', '#26262e']);
  } else {
    gradient(c, 0, 0, LW, LH, ['#0a1028', '#18224a', '#3a4a7a']);
    pool(c, 60, 70, 40, 30, '#6a5040', 0.7);
    pool(c, 270, 60, 36, 28, '#6a5040', 0.7);
    //a mitten
    pool(c, 160, 176, 40, 24, '#b8322e', 3);
    for (let x = 124; x < 198; x += 4) px(c, x, 168, 2, 1, '#e8dcc8');
  }
  //the phone
  px(c, 122, 22, 76, 148, '#14141c');
  px(c, 124, 24, 72, 144, '#22222c');
  px(c, 127, 32, 66, 128, day ? '#f4f6fa' : '#e9eef7');
  px(c, 127, 32, 66, 10, '#d2d8e6');
  pixelText(c, day ? '12:20' : '10:41', 160, 34, 1, '#22222c');
  if (!day) px(c, 152, 156, 16, 2, '#9aa6c0');
}

function bubble(c: Ctx, x: number, y: number, w: number, lines: number) {
  const h = lines * 5 + 5;
  px(c, x + 1, y, w - 2, h, '#cfd6e4');
  px(c, x, y + 1, w, h - 2, '#cfd6e4');
  px(c, x - 1, y + h - 2, 2, 2, '#cfd6e4');
  for (let i = 0; i < lines; i++) px(c, x + 3, y + 3 + i * 5, w - 6 - (i === lines - 1 ? 14 : (i * 7) % 10), 2, '#5a6278');
}

function phoneLive(c: Ctx, beat: string | undefined, t: number, since: number) {
  if (beat === 'day') {
    bubble(c, 132, 50, 44, 2);
    //the road sliding past at the edges
    for (let i = 0; i < 6; i++) px(c, (((i * 60 - t * 90) % 360) + 360) % 360 - 20, 112, 10, 1, '#ffffff');
    return;
  }
  snowfall(c, t, 70, [0, 0, LW, LH], 8);
  if (beat === 'text') {
    bubble(c, 132, 48, 56, 3);
    if (since > 0.6) bubble(c, 132, 70, 50, 2);
    if (since > 1.2) bubble(c, 132, 86, 30, 1);
  } else {
    //the notification sliding down, and the buzz
    const drop = Math.min(1, since * 3);
    px(c, 130, 44 - (1 - drop) * 14, 60, 16, '#ffffff');
    px(c, 133, 47 - (1 - drop) * 14, 9, 9, '#4ac06a');
    px(c, 146, 48 - (1 - drop) * 14, 34, 2, '#22222c');
    px(c, 146, 52 - (1 - drop) * 14, 24, 2, '#7a8296');
    if (since < 1.5 && Math.sin(since * 60) > 0) {
      px(c, 116, 60, 2, 10, '#ffffff');
      px(c, 202, 60, 2, 10, '#ffffff');
    }
  }
}

// ---------------------------------------------------------------------------
// the room
// ---------------------------------------------------------------------------

const WINDOW = { x: 118, y: 28, w: 84, h: 64 };
const HEARTH = { x: 256, y: 86, w: 32, h: 26 };
const TV = { x: 34, y: 62, w: 30, h: 22 };
const FLOOR = 112;

function roomSet(c: Ctx) {
  //the wall, planked
  gradient(c, 0, 0, LW, FLOOR, ['#4e2e1c', WOOD, '#8a5634']);
  for (let x = 0; x < LW; x += 12) px(c, x, 14, 1, FLOOR - 14, '#5e381f');
  //the ceiling beam
  px(c, 0, 0, LW, 12, WOOD_DEEP);
  px(c, 0, 12, LW, 3, WOOD_DARK);
  //the floor
  gradient(c, 0, FLOOR, LW, LH - FLOOR, ['#4a2a1a', '#6b4029', '#7a4a2e']);
  for (let y = FLOOR + 3, gap = 3; y < LH; y += gap, gap += 1) px(c, 0, y, LW, 1, '#3e2214');
  px(c, 0, FLOOR - 1, LW, 2, WOOD_DEEP);
  //the rug
  pool(c, 160, 150, 74, 20, '#c9a14a', 4);
  pool(c, 160, 150, 68, 17, '#8a2e2e', 4);
  pool(c, 160, 150, 40, 9, '#a8403a', 2);

  //the big window, onto the night
  px(c, WINDOW.x - 3, WINDOW.y - 3, WINDOW.w + 6, WINDOW.h + 6, WOOD_DEEP);
  gradient(c, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, NIGHT);
  c.save();
  c.beginPath();
  c.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  c.clip();
  stars(c, 60, 30, 40);
  ridge(c, WINDOW.y + 62, 34, 2.4, '#1e2a52', '#b8c8e6');
  for (let i = 0; i < 6; i++) pine(c, WINDOW.x + 6 + i * 15, WINDOW.y + WINDOW.h, 3, '#0a1a1e', SNOW_SHADE);
  c.restore();
  px(c, WINDOW.x + WINDOW.w / 2 - 1, WINDOW.y, 2, WINDOW.h, WOOD_DEEP);
  px(c, WINDOW.x, WINDOW.y + 30, WINDOW.w, 2, WOOD_DEEP);
  px(c, WINDOW.x - 5, WINDOW.y + WINDOW.h + 2, WINDOW.w + 10, 3, WOOD_LIGHT);

  //the fireplace, stone up to the beam
  px(c, 244, 12, 56, FLOOR - 12, STONE);
  for (let row = 0, y = 14; y < FLOOR; row++, y += 7)
    for (let x = 244 + (row % 2) * 6 - 6; x < 300; x += 12) {
      px(c, Math.max(244, x), y, Math.min(11, 300 - Math.max(244, x)), 6, row % 3 ? STONE : STONE_LIGHT);
      px(c, Math.max(244, x), y + 6, Math.min(11, 300 - Math.max(244, x)), 1, STONE_DARK);
    }
  px(c, 238, 74, 68, 5, WOOD_DARK);
  px(c, 238, 74, 68, 1, WOOD_LIGHT);
  px(c, HEARTH.x - 2, HEARTH.y - 2, HEARTH.w + 4, HEARTH.h + 2, STONE_DARK);
  px(c, HEARTH.x, HEARTH.y, HEARTH.w, HEARTH.h, '#140c0a');
  px(c, HEARTH.x + 4, FLOOR - 4, 24, 3, WOOD_DEEP);
  px(c, 250, FLOOR, 44, 4, STONE_DARK);
  //stockings on the mantel
  ['#b8322e', '#3a7a3a', '#f2ead8'].forEach((color, i) => {
    const x = 250 + i * 16;
    px(c, x, 79, 4, 7, color);
    px(c, x + 2, 84, 4, 3, color);
    px(c, x, 79, 4, 1, '#ffffff');
  });

  //the front door and the coat rack
  px(c, 0, 50, 20, FLOOR - 50, WOOD_DEEP);
  px(c, 2, 52, 16, FLOOR - 52, '#5a2a1a');
  px(c, 14, 82, 2, 2, WARM);
  px(c, 24, 46, 2, FLOOR - 46, WOOD_DEEP);
  ['#3a6ec8', '#b8322e', '#e0a020', '#4f8a72'].forEach((color, i) => px(c, 20 + (i % 2) * 6, 50 + i * 4, 5, 14, color));

  //the karaoke machine
  px(c, 30, 84, 38, FLOOR - 84, '#3a2a2a');
  px(c, 32, 88, 14, 18, '#1a1414');
  px(c, 52, 88, 14, 18, '#1a1414');
  pool(c, 39, 97, 4, 4, '#4a3a3a', 3);
  pool(c, 59, 97, 4, 4, '#4a3a3a', 3);
  px(c, TV.x - 2, TV.y - 2, TV.w + 4, TV.h + 4, '#14141a');

  //the glögg table
  px(c, 76, 114, 46, 4, WOOD_DARK);
  px(c, 78, 118, 2, 12, WOOD_DEEP);
  px(c, 118, 118, 2, 12, WOOD_DEEP);
  pool(c, 96, 111, 9, 4, '#b8662e', 4);
  px(c, 88, 110, 17, 4, '#b8662e');
  px(c, 89, 109, 15, 1, '#5a1a2a');
  [80, 84, 108, 113].forEach((x) => px(c, x, 111, 3, 3, CUP));
}

//the jigsaw table by the fire, drawn over Pip's legs
function jigsaw(c: Ctx) {
  px(c, 200, 130, 46, 6, WOOD_DARK);
  px(c, 200, 129, 46, 1, WOOD_LIGHT);
  for (let i = 0; i < 40; i++) px(c, 204 + (i % 10) * 4, 130 + Math.floor(i / 10), 3, 1, i % 3 ? '#6aa0d0' : i % 7 ? '#e8e0d0' : '#c84040');
  px(c, 202, 136, 2, 10, WOOD_DEEP);
  px(c, 242, 136, 2, 10, WOOD_DEEP);
}

//who is where in the room, and what they're doing, on each beat
function roomCast(beat: string | undefined): Placed[] {
  const karaoke = ['karaoke', 'mic', 'sing', 'duet', 'pass', 'cheer'].includes(beat ?? '');
  const cheer = beat === 'cheer' || beat === 'sing';
  const glass: Pose = cheer ? 'up' : 'hold';
  const heads = beat === 'heads';
  const idle: Omit<Placed, 'who'> = { x: 124, y: 136, pose: 'hold', face: heads ? 'front' : 'left' };
  const bram: Record<string, Omit<Placed, 'who'>> = {
    bram: { x: 32, y: 134, pose: 'wave', face: 'front' },
    sleds: { x: 32, y: 134, pose: 'carry', face: 'front' },
    karaoke: { x: 56, y: 134, pose: 'talk', face: 'front' },
    mic: { x: 56, y: 134, pose: 'offer', face: 'front' },
    sing: { x: 42, y: 134, pose: 'up', face: 'front' },
    duet: { x: 56, y: 134, pose: 'mic', face: 'front' },
    pass: { x: 56, y: 134, pose: 'ballad', face: 'front' },
    cheer: { x: 56, y: 134, pose: 'up', face: 'front' },
    toast: { x: 112, y: 136, pose: 'pour', face: 'front' },
  };
  return [
    { who: 'bram', ...(bram[beat ?? ''] ?? idle) },
    { who: 'skier1', x: 84, y: 140, pose: glass, face: heads ? 'front' : karaoke ? 'left' : 'right' },
    { who: 'skier2', x: 104, y: 141, pose: glass, face: heads ? 'front' : 'left' },
    { who: 'skier3', x: 94, y: 148, pose: cheer ? 'up' : 'stand', face: heads ? 'front' : karaoke ? 'left' : 'back' },
    { who: 'delphine', x: 160, y: 152, pose: heads || karaoke ? 'stand' : 'talk', face: heads || beat === 'delphine' ? 'front' : karaoke ? 'left' : 'right' },
    { who: 'guest1', x: 142, y: 158, pose: cheer ? 'up' : 'hold', face: heads ? 'front' : karaoke ? 'left' : 'right' },
    { who: 'guest2', x: 180, y: 160, pose: cheer ? 'up' : 'hold', face: heads ? 'front' : 'left' },
    { who: 'guest3', x: 138, y: 124, pose: 'hold', face: heads ? 'front' : 'right' },
    { who: 'guest4', x: 184, y: 125, pose: 'hold', face: heads ? 'front' : 'left' },
    { who: 'guest5', x: 268, y: 132, pose: 'stand', face: heads ? 'front' : 'right' },
  ];
}

function roomLive(c: Ctx, beat: string | undefined, t: number) {
  //snow past the window
  c.save();
  c.beginPath();
  c.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
  c.clip();
  snowfall(c, t, 40, [WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h], 4);
  c.restore();
  px(c, WINDOW.x + WINDOW.w / 2 - 1, WINDOW.y, 2, WINDOW.h, WOOD_DEEP);
  px(c, WINDOW.x, WINDOW.y + 30, WINDOW.w, 2, WOOD_DEEP);

  //the fire: columns of flame, each its own height, flickering
  for (let x = 0; x < HEARTH.w - 4; x++) {
    const h = 6 + 10 * Math.abs(Math.sin(x * 0.7 + t * 5) * Math.sin(x * 0.3 - t * 3.3)) + 4 * Math.sin(x / 4);
    for (let y = 0; y < h; y++) {
      const level = y / h;
      px(c, HEARTH.x + 2 + x, FLOOR - 4 - y, 1, 1, FIRE[Math.min(3, Math.floor(level * 4 + (dithered(x, y, 0.5) ? 0.4 : 0)))]);
    }
  }
  for (let i = 0; i < 6; i++) {
    const age = (t * 0.6 + rand(i)) % 1;
    px(c, HEARTH.x + 6 + rand(i + 9) * 20 + Math.sin(t * 3 + i) * 2, HEARTH.y + 14 - age * 30, 1, 1, age < 0.6 ? FIRE[1] : FIRE[3]);
  }
  pool(c, 272, 124, 50, 14, '#c8703a', 0.28 + 0.06 * Math.sin(t * 9));

  //the string lights along the beam
  for (let x = 2; x < LW; x += 8) {
    const y = 16 + 5 * Math.sin((Math.PI * (x % 64)) / 64);
    px(c, x, y - 1, 1, 1, '#1a1a14');
    const lit = Math.sin(t * 2 + x * 0.7) > -0.6;
    px(c, x, y, 2, 2, lit ? LIGHTS[(x / 8) % LIGHTS.length] : '#3a3030');
  }

  //the karaoke screen
  const karaoke = ['karaoke', 'mic', 'sing', 'duet', 'pass', 'cheer'].includes(beat ?? '');
  if (karaoke) {
    for (let y = 0; y < TV.h; y++) px(c, TV.x, TV.y + y, TV.w, 1, ['#3a1a6a', '#5a2a8a', '#2a3a8a'][Math.floor((y + t * 6) / 4) % 3]);
    const sweep = (t * 0.4) % 1;
    px(c, TV.x + 3, TV.y + 12, TV.w - 6, 2, '#ffffff');
    px(c, TV.x + 3, TV.y + 12, (TV.w - 6) * sweep, 2, '#ffd36b');
    px(c, TV.x + 6, TV.y + 16, TV.w - 12, 2, '#c8c0e8');
  } else {
    px(c, TV.x, TV.y, TV.w, TV.h, '#1a2240');
    px(c, TV.x + 4 + ((t * 6) % (TV.w - 10)), TV.y + 8, 6, 3, '#3a4a7a');
  }

  //steam off the glögg
  for (let i = 0; i < 4; i++) {
    const age = (t * 0.5 + i / 4) % 1;
    px(c, 94 + i * 2 + Math.sin(t * 2 + i) * 2, 108 - age * 12, 1, 1, age < 0.5 ? '#d8d0e0' : '#a89cb0');
  }

  crowd(c, roomCast(beat), t);
  person(c, PEOPLE.pip, 222, 138, 'sit', 'front', t, 3);
  jigsaw(c);
}

// ---------------------------------------------------------------------------
// the deck at midnight
// ---------------------------------------------------------------------------

function deckSet(c: Ctx) {
  gradient(c, 0, 0, LW, 130, ['#03050f', '#0a1030', '#1a2450']);
  stars(c, 100, 90, 70);
  ridge(c, 100, 44, 0.7, '#1a2448', '#8a9ac8');
  ridge(c, 124, 20, 3.3, '#0e1530');
  //the village, far below
  for (let i = 0; i < 40; i++) {
    const x = 96 + rand(i + 300) * 130;
    px(c, x, 122 + rand(i + 330) * 12 + Math.abs(x - 160) * 0.05, 1, 1, rand(i + 360) > 0.5 ? WARM : WARM_DEEP);
  }
  for (let i = 0; i < 5; i++) pine(c, 8 + i * 14, 150, 6 + (i % 2) * 2, '#060c18', '#8a9ac8');
  for (let i = 0; i < 5; i++) pine(c, 258 + i * 14, 150, 6 + ((i + 1) % 2) * 2, '#060c18', '#8a9ac8');
  //the railing, snow along the top
  px(c, 0, 138, LW, 4, WOOD_DARK);
  px(c, 0, 136, LW, 2, SNOW);
  for (let x = 4; x < LW; x += 22) px(c, x, 140, 3, 20, WOOD_DARK);
  px(c, 0, 158, LW, 22, WOOD_DEEP);
  for (let y = 162; y < LH; y += 5) px(c, 0, y, LW, 1, WOOD_DARK);
}

const DECK_CAST = (cheer: boolean): Placed[] => [
  { who: 'skier1', x: 30, y: 198, pose: cheer ? 'up' : 'hold', face: 'back' },
  { who: 'delphine', x: 86, y: 198, pose: cheer ? 'up' : 'hold', face: 'back' },
  { who: 'bram', x: 150, y: 198, pose: cheer ? 'up' : 'hold', face: 'back' },
  { who: 'pip', x: 214, y: 198, pose: 'hold', face: 'back' },
  { who: 'guest3', x: 284, y: 198, pose: cheer ? 'up' : 'hold', face: 'back' },
];

const BURSTS = ['#ff5a5a', '#ffd36b', '#6ad0ff', '#7ae08a', '#ff8ad8', '#ffffff'];

function fireworks(c: Ctx, t: number) {
  const every = 0.55;
  const now = Math.floor(t / every);
  for (let b = now - 5; b <= now; b++) {
    const age = t - b * every;
    if (age < 0 || age > 2.6) continue;
    const [cx, cy] = [50 + rand(b) * 220, 20 + rand(b + 7) * 50];
    const color = BURSTS[Math.floor(rand(b + 3) * BURSTS.length)];
    if (age < 0.5) {
      px(c, cx, cy + 60 * (1 - age / 0.5), 1, 2, '#ffe8b0');
      continue;
    }
    const a = age - 0.5;
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + b;
      const r = 26 * (1 - Math.exp(-a * 2.2));
      if (a > 1.4 && i % 2) continue;
      px(c, cx + Math.cos(angle) * r, cy + Math.sin(angle) * r + a * a * 5, 1, 1, a > 1.6 ? '#7a6a8a' : color);
    }
    if (a < 0.15) pool(c, cx, cy, 14, 14, color, 0.6);
  }
}

function deckLive(c: Ctx, beat: string | undefined, t: number, since: number) {
  if (beat === 'fireworks') fireworks(c, t);
  if (beat === 'count') {
    const n = 10 - Math.floor(since / 0.85);
    if (n > 0) pixelText(c, String(n), 160, 30, 6, '#ffffff');
    else pixelText(c, 'HAPPY NEW YEAR!', 160, 40, 2, WARM);
  }
  crowdNear(c, DECK_CAST(beat === 'fireworks' && Math.sin(t * 0.8) > -0.5), t);
}

// ---------------------------------------------------------------------------
// the sledding hill, the hot tub and the bunk
// ---------------------------------------------------------------------------

//the hill runs down from the lodge at the top left to the trees at the bottom right
const slope = (x: number) => 46 + x * 0.36 + 6 * Math.sin(x / 40);

function hillSet(c: Ctx) {
  gradient(c, 0, 0, LW, 120, NIGHT);
  stars(c, 90, 60, 120);
  pool(c, 270, 30, 10, 10, '#f2ead8', 4); //the moon
  ridge(c, 70, 30, 5.5, '#141e40', '#6a7aa8');
  for (let x = 0; x < LW; x++) {
    const top = Math.round(slope(x));
    for (let y = top; y < LH; y++) px(c, x, y, 1, 1, dithered(x, y, (y - top) / 50) ? SNOW_SHADE : SNOW);
  }
  //the lodge at the top
  shape(c, [[30, 22], [52, 44], [8, 44]], WOOD_DARK);
  shape(c, [[30, 18], [54, 42], [50, 44], [30, 24], [10, 44], [6, 42]], SNOW);
  px(c, 14, 44, 32, 12, WOOD);
  px(c, 18, 47, 6, 5, WARM);
  px(c, 36, 47, 6, 5, WARM);
  for (let i = 0; i < 14; i++) {
    const x = 60 + rand(i + 700) * 250;
    pine(c, x, Math.round(slope(x)) + 4 + rand(i + 710) * 30, 3 + Math.round(rand(i + 720) * 3));
  }
  for (let x = 220; x < LW; x += 9) pine(c, x, LH - 2, 7, '#0a1a1a');
}

//sledders coming down the hill, each lit by a headlamp
function sledders(c: Ctx, t: number, count: number, region: (u: number, i: number) => [number, number], speed = 0.14) {
  for (let i = 0; i < count; i++) {
    const u = (t * speed + i / count) % 1;
    const [x, y] = region(u, i);
    const [nx, ny] = region(Math.min(1, u + 0.02), i);
    const dir = Math.atan2(ny - y, nx - x);
    for (let s = 1; s < 6; s++) if (dithered(x + s, y, 1 - s / 6)) px(c, x + Math.cos(dir) * s * 2, y + Math.sin(dir) * s * 2, 1, 1, '#fff1a8');
    px(c, x - 2, y, 5, 2, i % 2 ? '#d8402a' : '#3a6ec8');
    px(c, x - 1, y - 3, 2, 3, '#2a2a38');
    px(c, x - 1, y - 4, 2, 1, '#fff1a8');
    for (let s = 1; s < 4; s++) px(c, x - Math.cos(dir) * s * 3 + Math.sin(t * 20 + s), y - Math.sin(dir) * s * 3, 1, 1, '#ffffff');
  }
}

function hillLive(c: Ctx, t: number) {
  sledders(c, t, 4, (u, i) => {
    const x = 50 + u * 260 + Math.sin(u * 12 + i * 2) * 10;
    return [x, slope(x) + 6 + i * 6];
  });
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 4;
    px(c, x, slope(x) + 2, 1, 3, '#2a2a38');
    px(c, x, slope(x) + 1, 1, 1, '#fff1a8');
  }
}

function tubSet(c: Ctx) {
  gradient(c, 0, 0, LW, 110, NIGHT);
  stars(c, 80, 60, 200);
  ridge(c, 74, 30, 1.9, '#1a2448', '#8a9ac8');
  for (let x = 0; x < LW; x++) {
    const top = Math.round(80 + x * 0.12);
    for (let y = top; y < 120; y++) px(c, x, y, 1, 1, dithered(x, y, (y - top) / 30) ? SNOW_DUSK : SNOW_SHADE);
  }
  //the deck
  px(c, 0, 118, LW, 62, WOOD_DEEP);
  for (let y = 122; y < LH; y += 6) px(c, 0, y, LW, 1, WOOD_DARK);
  //the tub, a wooden barrel
  px(c, 80, 106, 160, 60, WOOD);
  for (let x = 84; x < 240; x += 8) px(c, x, 108, 1, 58, WOOD_DARK);
  px(c, 80, 116, 160, 3, '#3a3a44');
  px(c, 80, 150, 160, 3, '#3a3a44');
  px(c, 78, 102, 164, 4, WOOD_LIGHT);
  gradient(c, 82, 96, 156, 8, ['#5fa3c8', '#3d7fa8']);
  pool(c, 160, 98, 60, 3, '#8ac8e8', 2);
  //a drift of snow on the near rail
  px(c, 0, 172, LW, 8, SNOW_SHADE);
}

const TUB_HEADS: [Who, number][] = [['bram', 104], ['skier1', 128], ['pip', 152], ['delphine', 186], ['skier3', 214]];

function tubLive(c: Ctx, t: number) {
  //sledders on the far hill
  sledders(c, t, 3, (u, i) => [30 + u * 200 + i * 20, 82 + u * 30 + Math.sin(u * 20 + i) * 3], 0.08);
  //heads and shoulders above the water
  TUB_HEADS.forEach(([who, x], i) => {
    const bob = Math.sin(t * 1.4 + i) > 0.6 ? 1 : 0;
    c.save();
    c.beginPath();
    c.rect(0, 0, LW, 101);
    c.clip();
    person(c, PEOPLE[who], x, 112 + bob, 'stand', 'front', t, i * 3);
    c.restore();
  });
  gradient(c, 82, 99, 156, 3, ['#5fa3c8', '#3d7fa8']);
  //steam
  for (let i = 0; i < 40; i++) {
    const age = (t * 0.25 + rand(i + 40)) % 1;
    const x = 86 + rand(i) * 150 + Math.sin(t + i) * 4 + age * 10;
    const y = 98 - age * 50;
    if (dithered(Math.round(x), Math.round(y), 1 - age)) px(c, x, y, 2, 1, '#b8c4dc');
  }
  snowfall(c, t, 60, [0, 0, LW, LH], 4);
}

const BUNK_WINDOW = { x: 196, y: 44, w: 64, h: 52 };

function bunkSet(c: Ctx) {
  px(c, 0, 0, LW, LH, '#1c1626');
  shape(c, [[0, 0], [150, 0], [0, 70]], '#120e1a'); //the slope of the roof
  for (let x = 0; x < LW; x += 14) px(c, x, 0, 1, LH, '#221a2e');
  //the little window
  px(c, BUNK_WINDOW.x - 3, BUNK_WINDOW.y - 3, BUNK_WINDOW.w + 6, BUNK_WINDOW.h + 6, WOOD_DEEP);
  gradient(c, BUNK_WINDOW.x, BUNK_WINDOW.y, BUNK_WINDOW.w, BUNK_WINDOW.h, NIGHT);
  for (let x = 0; x < BUNK_WINDOW.w; x++) {
    const top = BUNK_WINDOW.y + 20 + x * 0.4;
    px(c, BUNK_WINDOW.x + x, top, 1, BUNK_WINDOW.y + BUNK_WINDOW.h - top, SNOW_SHADE);
  }
  pool(c, BUNK_WINDOW.x + 50, BUNK_WINDOW.y + 10, 4, 4, '#f2ead8', 4);
  px(c, BUNK_WINDOW.x + BUNK_WINDOW.w / 2 - 1, BUNK_WINDOW.y, 2, BUNK_WINDOW.h, WOOD_DEEP);
  px(c, BUNK_WINDOW.x - 4, BUNK_WINDOW.y + BUNK_WINDOW.h + 3, BUNK_WINDOW.w + 8, 2, WOOD_DARK);
  //moonlight across the floor
  shape(c, [[190, 180], [250, 180], [270, 140], [222, 140]], '#2c2a44');
  //the bunk, blanket and pillow
  px(c, 16, 110, 4, 60, WOOD_DARK);
  px(c, 170, 110, 4, 60, WOOD_DARK);
  px(c, 16, 140, 158, 6, WOOD_DARK);
  px(c, 20, 122, 150, 18, '#8a2e2e');
  for (let x = 24; x < 170; x += 10) px(c, x, 122, 3, 18, '#6a2020');
  for (let y = 126; y < 140; y += 6) px(c, 20, y, 150, 1, '#a84040');
  px(c, 26, 114, 30, 10, '#d8d0c8');
  px(c, 16, 104, 158, 4, WOOD_DARK);
}

function bunkLive(c: Ctx, t: number) {
  const { x, y, w, h } = BUNK_WINDOW;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  sledders(c, t, 3, (u, i) => [x + 4 + u * 56, y + 24 + u * 22 + Math.sin(u * 14 + i * 2) * 2 + i * 2], 0.1);
  snowfall(c, t, 16, [x, y, w, h], 3);
  c.restore();
  px(c, x + w / 2 - 1, y, 2, h, WOOD_DEEP);
}

// ---------------------------------------------------------------------------
// the road home
// ---------------------------------------------------------------------------

const ROAD = 140;

function roadSet(c: Ctx) {
  gradient(c, 0, 0, LW, 110, DAY);
  ridge(c, 96, 60, 0.4, '#e8eef8', '#ffffff');
  //shadows down the far peaks
  for (let x = 0; x < LW; x += 2) if (Math.sin(x / 7) > 0.6) px(c, x, 80 + Math.sin(x / 23) * 10, 1, 30, '#c8d4ea');
  //the lodge, small, high on the mountain
  shape(c, [[252, 54], [260, 62], [244, 62]], WOOD_DARK);
  shape(c, [[252, 52], [261, 61], [252, 56], [243, 61]], '#ffffff');
  px(c, 246, 62, 12, 5, WOOD);
  px(c, 255, 50, 2, 6, STONE_DARK);
  ridge(c, 118, 18, 3, '#a9bddd', SNOW);
}

function roadLive(c: Ctx, t: number) {
  //smoke from the lodge chimney
  for (let i = 0; i < 10; i++) {
    const age = (t * 0.3 + i / 10) % 1;
    px(c, 256 + age * 8 + Math.sin(t + i) * 1.5, 49 - age * 18, 1 + (age > 0.5 ? 1 : 0), 1, age < 0.6 ? '#e8eef8' : '#c8d4ea');
  }
  //pines on the near hills, sliding past
  for (let i = 0; i < 12; i++) {
    const x = ((((i * 37 - t * 30) % 444) + 444) % 444) - 40;
    pine(c, x, ROAD - 6, 4 + (i % 3), '#1e4a3a', SNOW);
  }
  px(c, 0, ROAD - 6, LW, 8, SNOW);
  px(c, 0, ROAD + 2, LW, 18, '#6b6e7a');
  for (let i = 0; i < 8; i++) px(c, ((((i * 48 - t * 120) % 384) + 384) % 384) - 32, ROAD + 10, 16, 1, '#f2ead8');
  px(c, 0, ROAD + 20, LW, 20, SNOW);
  for (let i = 0; i < 16; i++) pine(c, ((((i * 23 - t * 200) % 368) + 368) % 368) - 24, LH + 4, 5 + (i % 2) * 3, '#163a2e', SNOW);
  //the car
  const bob = Math.sin(t * 14) > 0.7 ? 1 : 0;
  px(c, 140, ROAD - 2 + bob, 38, 10, '#b8322e');
  px(c, 148, ROAD - 9 + bob, 22, 8, '#b8322e');
  px(c, 150, ROAD - 7 + bob, 8, 5, '#9cc4e8');
  px(c, 160, ROAD - 7 + bob, 8, 5, '#9cc4e8');
  px(c, 176, ROAD + bob, 2, 2, WARM);
  pool(c, 146, ROAD + 8, 3, 3, INK, 4);
  pool(c, 172, ROAD + 8, 3, 3, INK, 4);
  for (let i = 0; i < 4; i++) {
    const age = (t * 1.5 + i / 4) % 1;
    px(c, 138 - age * 16, ROAD + 4 - age * 4, 2, 1, age < 0.5 ? '#e8eef8' : '#c8d4ea');
  }
}

// ---------------------------------------------------------------------------
// drawing
// ---------------------------------------------------------------------------

const backgrounds = new Map<string, HTMLCanvasElement>();

function background(set: SetId, beat?: string) {
  const key = set === 'phone' && beat === 'day' ? 'phone_day' : set;
  let el = backgrounds.get(key);
  if (!el) {
    el = document.createElement('canvas');
    el.width = LW;
    el.height = LH;
    const c = el.getContext('2d')!;
    if (set === 'porch') porchSet(c);
    if (set === 'phone') phoneSet(c, beat === 'day');
    if (set === 'room') roomSet(c);
    if (set === 'deck') deckSet(c);
    if (set === 'hill') hillSet(c);
    if (set === 'tub') tubSet(c);
    if (set === 'bunk') bunkSet(c);
    if (set === 'road') roadSet(c);
    backgrounds.set(key, el);
  }
  return el;
}

//draws one cue into a buffer at the buffer's own resolution
function paint(c: Ctx, { set, beat }: Cue, t: number, since: number) {
  c.drawImage(background(set, beat), 0, 0);
  if (set === 'porch') porchLive(c, beat, t);
  if (set === 'phone') phoneLive(c, beat, t, since);
  if (set === 'room') roomLive(c, beat, t);
  if (set === 'deck') deckLive(c, beat, t, since);
  if (set === 'hill') hillLive(c, t);
  if (set === 'tub') tubLive(c, t);
  if (set === 'bunk') bunkLive(c, t);
  if (set === 'road') roadLive(c, t);
}

//crops the buffer around the focus and blows it up to fill a screen sw by sh css pixels. The focus view (the buffer
//divided by zoom) is fitted into the part of the screen above the dialogue box and centred there, but the buffer always
//covers the whole screen, and on a small screen the camera moves in rather than let the pixels shrink past MIN_PIXEL.
//On a narrow screen the dialogue box spans the width, so the buffer may end above it, with its last row stretched beneath
function blit(c: Ctx, buffer: HTMLCanvasElement, [fx, fy, zoom]: Focus, sw: number, sh: number) {
  const dock = Math.min(DOCK, sh * 0.4);
  const open = sh - dock;
  const fit = Math.min(sw / (LW / zoom), open / (LH / zoom));
  const scale = Math.max(fit, MIN_PIXEL, sw / LW, sh / LH);
  const [vw, vh] = [sw / scale, sh / scale];
  const under = sw < 900 ? dock / scale : 0;
  const sx = Math.min(Math.max(fx - vw / 2, 0), LW - vw);
  const sy = Math.min(Math.max(fy - open / 2 / scale, 0), LH - vh + under);
  const rows = Math.min(vh, LH - sy);
  c.drawImage(buffer, sx, sy, vw, rows, 0, 0, sw, rows * scale);
  if (rows < vh) c.drawImage(buffer, sx, LH - 1, vw, 1, 0, rows * scale, sw, sh - rows * scale);
}

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const smooth = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};
const lerpFocus = (a: Focus, b: Focus, k: number): Focus => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  fire: new URL('./sounds/fire.m4a', import.meta.url).href,
  party: new URL('./sounds/party.m4a', import.meta.url).href,
  wind: new URL('./sounds/wind.m4a', import.meta.url).href,
  car: new URL('./sounds/car.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'road' || beat === 'day') return { car: 0.55 };
  if (set === 'room') return { party: 0.5, fire: 0.45, wind: 0.04 };
  if (set === 'deck') return { party: 0.3, wind: 0.22 };
  if (set === 'hill') return { wind: 0.35, party: 0.05 };
  if (set === 'tub') return { wind: 0.2, party: 0.18 };
  if (set === 'bunk') return { wind: 0.3, party: 0.06 };
  if (beat === 'open' || beat === 'bram') return { wind: 0.3, party: 0.35, fire: 0.1 };
  return { wind: 0.4, party: 0.1 };
}

interface OneShot {
  src: string;
  volume: number;
  delay?: number;
}

const MESSAGE = new URL('./sounds/message.m4a', import.meta.url).href;
const DOOR_CREAK = new URL('./sounds/door.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  porch: { src: new URL('./sounds/step.m4a', import.meta.url).href, volume: 0.7, delay: 0.3 },
  phone: { src: MESSAGE, volume: 0.5, delay: 0.3 },
  phone_day: { src: MESSAGE, volume: 0.5, delay: 0.3 },
  porch_door: { src: DOOR_CREAK, volume: 0.6 },
  porch_bram: { src: DOOR_CREAK, volume: 0.6 },
  room_sleds: { src: DOOR_CREAK, volume: 0.5 },
  karaoke_cheer: { src: new URL('./sounds/applause.m4a', import.meta.url).href, volume: 0.6 },
  toast: { src: new URL('./sounds/pour.m4a', import.meta.url).href, volume: 0.6, delay: 0.4 },
  deck_fireworks: { src: new URL('./sounds/fireworks.m4a', import.meta.url).href, volume: 0.7 },
  hill_sled: { src: new URL('./sounds/sled.m4a', import.meta.url).href, volume: 0.7, delay: 0.3 },
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
    mix(cue: Cue) {
      const levels = mixFor(cue);
      for (const { bed, gain } of beds) gain.gain.setTargetAtTime((levels[bed] ?? 0) * MASTER_VOLUME, context.currentTime, CROSSFADE / 3);
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
      context.close();
    },
  };
}

// ---------------------------------------------------------------------------

function SnowedIn({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Snowed In has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  //from is where the camera was when the cue changed, so a pan starts from wherever it had got to
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active], from: cues[active].focus });
  const camera = useRef<Focus>(cues[active].focus);
  const sound = useRef<ReturnType<typeof createSoundscape> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const buffers = [0, 1].map(() => {
      const b = document.createElement('canvas');
      b.width = LW;
      b.height = LH;
      return b;
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
      const { cue, at, prev, from } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.imageSmoothingEnabled = false;
      c.globalAlpha = 1;
      const cut = prev.set !== cue.set;
      if (cut && since < SET_FADE) {
        const b = buffers[1].getContext('2d')!;
        paint(b, prev, t, since);
        blit(c, buffers[1], from, sw, sh);
        c.globalAlpha = ease(since / SET_FADE);
      }
      camera.current = cut ? cue.focus : lerpFocus(from, cue.focus, smooth(since / PAN));
      paint(buffers[0].getContext('2d')!, cue, t, since);
      blit(c, buffers[0], camera.current, sw, sh);
      c.globalAlpha = 1;
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    shown.current = { cue: cues[active], at: performance.now(), prev: shown.current.cue, from: camera.current };
    sound.current?.mix(cues[active]);
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
    background: NIGHT[0],
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
    imageRendering: 'pixelated',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    background: 'radial-gradient(ellipse at center, rgba(6,10,28,0.7) 0%, rgba(6,10,28,0) 70%)',
    color: SNOW,
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 'bold',
    textShadow: `4px 4px 0 ${INK}`,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  name: {
    fontSize: 64,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
};

export default SnowedIn;
