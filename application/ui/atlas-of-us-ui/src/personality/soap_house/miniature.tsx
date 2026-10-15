import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// Miniature paints the soap house like a page from a Persian manuscript: flat perspective with rooms shown in
// cutaway, gold-leaf skies with cloud scrolls, tiled walls and patterned carpets, slim figures in robes outlined in fine
// ink, and a lapis-and-gold border round every page. Every cue is a page painted once and kept. A new set turns in like
// a manuscript page round its spine, and a new beat on the same set cross-fades. Fire, steam, the fountain, pigeons,
// lamps, stars and the glint of the gold move on top.
// Scenes are drawn in a fixed 1600x900 space and scaled to cover the screen.

const W = 1600;
const H = 900;
const TURN = 0.8; //seconds a new page takes to turn in
const BEAT_FADE = 0.5; //seconds to cross-fade a new beat on the same set
const BORDER = 44; //the gilded border round every page
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const INK = '#2a1d14';
const PAPER = '#f1e4c3';
const GOLD = '#c9a227';
const GOLD_LIGHT = '#e8cd6a';
const GOLD_DARK = '#8f6f12';
const LAPIS = '#1f3f8a';
const LAPIS_DARK = '#14285a';
const TURQUOISE = '#2a8f8a';
const MALACHITE = '#2f7a4a';
const VERMILION = '#c23a24';
const ROSE = '#d98a8a';
const OCHRE = '#c78a2e';
const WHITE = '#f7f1e3';
const STONE = '#d9c7a3';
const STONE_DARK = '#b39c74';
const SOAP = '#c2ae6a';
const SOAP_GREEN = '#8c9a4c';
const COPPER = '#a5592b';
const SKIN = '#ecd0ab';
const HAIR = '#1e1611';
const SERIF = 'Georgia, "Times New Roman", serif';

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

type SetId = 'souq' | 'workshop' | 'family' | 'aza' | 'notary' | 'seal' | 'night' | 'roof';

interface Cue {
  set: SetId;
  beat: string;
  card?: [kicker: string, name: string];
}

const cues: Record<string, Cue> = {
  title_card: { set: 'souq', beat: 'title', card: ['An Inheritance in Aleppo', 'The Soap House'] },
  souq: { set: 'souq', beat: 'morning' },
  workshop: { set: 'workshop', beat: 'empty' },
  stacks: { set: 'workshop', beat: 'stacks' },
  haddad: { set: 'workshop', beat: 'haddad' },
  samir: { set: 'workshop', beat: 'samir' },
  family: { set: 'family', beat: 'family' },
  aza: { set: 'aza', beat: 'mourning' },
  aza_praise: { set: 'aza', beat: 'praise' },
  notary: { set: 'notary', beat: 'will' },
  notary_call: { set: 'notary', beat: 'call' },
  seal: { set: 'seal', beat: 'seal' },
  night: { set: 'night', beat: 'night' },
  roof: { set: 'roof', beat: 'dusk' },
  the_end: { set: 'roof', beat: 'end' },
};
const FIRST_CUE = 'title_card';

// ---------------------------------------------------------------------------
// the brush
// ---------------------------------------------------------------------------

//a fixed per-index random, so pages and the live layer come out the same every time
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function canvas2d(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return [el, el.getContext('2d')!];
}

//every shape in a miniature has a fine dark outline
function poly(c: Ctx, points: Pt[], fill: string | CanvasPattern, width = 2) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (width) {
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function oval(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string | CanvasPattern, width = 2) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (width) {
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

//a pointed arch, the shape of every door, niche and window
function arch(c: Ctx, x: number, y: number, w: number, h: number, fill: string | CanvasPattern, width = 2) {
  const spring = y + w * 0.55;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, spring);
  c.quadraticCurveTo(x, y + w * 0.1, x + w / 2, y);
  c.quadraticCurveTo(x + w, y + w * 0.1, x + w, spring);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (width) {
    c.lineWidth = width;
    c.strokeStyle = INK;
    c.stroke();
  }
}

//patterns, so any shape can be filled with tile, carpet or stonework
const tiles = new Map<string, CanvasPattern>();
function pattern(c: Ctx, kind: 'tile' | 'stone' | 'carpet' | 'soap', a: string, b: string) {
  const key = kind + a + b;
  if (!tiles.has(key)) {
    const size = kind === 'stone' ? 60 : kind === 'soap' ? 26 : 40;
    const [el, t] = canvas2d(size, size);
    t.fillStyle = a;
    t.fillRect(0, 0, size, size);
    t.strokeStyle = b;
    t.fillStyle = b;
    t.lineWidth = 1.5;
    if (kind === 'tile') {
      //an eight-pointed star in each tile
      const star: Pt[] = Array.from({ length: 16 }, (_, i) => {
        const r = i % 2 ? 8 : 16;
        const ang = (i / 16) * Math.PI * 2;
        return [20 + Math.cos(ang) * r, 20 + Math.sin(ang) * r];
      });
      t.beginPath();
      star.forEach(([x, y], i) => (i ? t.lineTo(x, y) : t.moveTo(x, y)));
      t.closePath();
      t.fill();
      t.fillStyle = a;
      t.beginPath();
      t.arc(20, 20, 4, 0, Math.PI * 2);
      t.fill();
    } else if (kind === 'stone') {
      //courses of dressed stone
      t.strokeRect(0, 0, 60, 30);
      t.strokeRect(-30, 30, 60, 30);
      t.strokeRect(30, 30, 60, 30);
    } else if (kind === 'carpet') {
      t.beginPath();
      t.moveTo(20, 4);
      t.lineTo(36, 20);
      t.lineTo(20, 36);
      t.lineTo(4, 20);
      t.closePath();
      t.stroke();
      t.beginPath();
      t.arc(20, 20, 4, 0, Math.PI * 2);
      t.fill();
    } else {
      //cut soap bars, each pressed with the seal
      t.strokeRect(1, 1, 24, 24);
      t.beginPath();
      t.arc(13, 13, 5, 0, Math.PI * 2);
      t.stroke();
    }
    tiles.set(key, c.createPattern(el, 'repeat')!);
  }
  return tiles.get(key)!;
}

//gold leaf, with the swirling cloud bands painters borrowed from China
function goldSky(c: Ctx, bottom: number) {
  const g = c.createLinearGradient(0, 0, 0, bottom);
  g.addColorStop(0, GOLD_LIGHT);
  g.addColorStop(1, GOLD);
  c.fillStyle = g;
  c.fillRect(0, 0, W, bottom);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 260 + rand(i) * 60;
    const y = 70 + rand(i + 9) * (bottom * 0.35);
    cloud(c, x, y, 70 + rand(i + 3) * 40);
  }
}

function cloud(c: Ctx, x: number, y: number, w: number) {
  c.beginPath();
  c.moveTo(x - w, y);
  c.bezierCurveTo(x - w * 0.7, y - 30, x - w * 0.3, y + 22, x, y - 4);
  c.bezierCurveTo(x + w * 0.3, y - 30, x + w * 0.7, y + 22, x + w, y);
  c.lineWidth = 9;
  c.strokeStyle = WHITE;
  c.lineCap = 'round';
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = LAPIS;
  c.stroke();
  //the curl at each end
  for (const [cx, dir] of [[x - w, -1], [x + w, 1]] as Pt[]) {
    c.beginPath();
    c.arc(cx + dir * 8, y - 8, 9, 0, Math.PI * 1.6);
    c.stroke();
  }
}

function nightSky(c: Ctx, bottom: number) {
  c.fillStyle = LAPIS_DARK;
  c.fillRect(0, 0, W, bottom);
  for (let i = 0; i < 70; i++) star(c, rand(i) * W, rand(i + 31) * bottom * 0.85, 2 + rand(i + 5) * 3);
  oval(c, 1260, 130, 42, 42, GOLD_LIGHT, 0);
  oval(c, 1278, 120, 38, 38, LAPIS_DARK, 0);
}

function star(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = GOLD_LIGHT;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 ? r * 0.4 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.fill();
}

function dome(c: Ctx, x: number, base: number, r: number, color: string) {
  poly(c, rect(x - r * 0.9, base, r * 1.8, r * 0.5), STONE);
  c.beginPath();
  c.moveTo(x - r, base);
  c.quadraticCurveTo(x - r, base - r * 1.2, x, base - r * 1.6);
  c.quadraticCurveTo(x + r, base - r * 1.2, x + r, base);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = INK;
  c.stroke();
  poly(c, [[x - 3, base - r * 1.6], [x + 3, base - r * 1.6], [x, base - r * 1.95]], GOLD, 1.5);
}

function minaret(c: Ctx, x: number, base: number, h: number) {
  poly(c, rect(x - 14, base - h, 28, h), STONE);
  poly(c, rect(x - 22, base - h * 0.7, 44, 10), STONE_DARK);
  poly(c, rect(x - 10, base - h - 40, 20, 40), STONE);
  dome(c, x, base - h - 40, 12, TURQUOISE);
}

function cypress(c: Ctx, x: number, base: number, h: number) {
  c.beginPath();
  c.moveTo(x, base - h);
  c.quadraticCurveTo(x + h * 0.16, base - h * 0.4, x + 4, base);
  c.lineTo(x - 4, base);
  c.quadraticCurveTo(x - h * 0.16, base - h * 0.4, x, base - h);
  c.fillStyle = '#244f3a';
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = INK;
  c.stroke();
}

//the citadel of Aleppo on its mound, in the distance
function citadel(c: Ctx, x: number, base: number, s: number) {
  poly(c, [[x - 260 * s, base], [x - 150 * s, base - 110 * s], [x + 150 * s, base - 110 * s], [x + 260 * s, base]], '#c9a96a');
  poly(c, rect(x - 150 * s, base - 170 * s, 300 * s, 62 * s), OCHRE);
  for (let k = 0; k < 9; k++) poly(c, rect(x - 150 * s + k * 34 * s, base - 182 * s, 18 * s, 14 * s), OCHRE, 1.5);
  minaret(c, x + 40 * s, base - 170 * s, 90 * s);
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

type Head = 'scarf' | 'cap' | 'kufiya' | 'hair';
type Pose = 'stand' | 'hold' | 'point' | 'stir' | 'sit';

interface Figure {
  x: number;
  y: number; //where their feet are
  s: number;
  robe: string;
  trim: string;
  head: Head;
  headColor: string;
  pose?: Pose;
  flip?: boolean;
}

//a slim figure in a long robe, face turned three-quarters, the way miniaturists drew everyone
function figure(c: Ctx, f: Figure) {
  const { x, y, s, robe, trim, head, headColor, pose = 'stand', flip = false } = f;
  c.save();
  c.translate(x, y);
  c.scale(flip ? -s : s, s);
  if (pose === 'sit') {
    //kneeling on a cushion
    poly(c, [[-34, -70], [34, -70], [44, 0], [-44, 0]], robe);
    poly(c, rect(-50, -6, 100, 10), trim, 1.5);
  } else {
    poly(c, [[-22, -150], [22, -150], [40, 0], [-40, 0]], robe);
    poly(c, rect(-24, -96, 48, 7), trim, 1.5);
    poly(c, [[-40, 0], [40, 0], [36, -10], [-36, -10]], trim, 1.5);
  }
  const top = pose === 'sit' ? -70 : -150;
  //arms
  const hand: Pt = pose === 'point' ? [52, top - 6] : pose === 'stir' ? [36, top + 20] : pose === 'hold' ? [20, top + 50] : [14, top + 70];
  c.beginPath();
  c.moveTo(16, top + 6);
  c.lineTo(...hand);
  c.lineWidth = 11;
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.stroke();
  c.lineWidth = 8;
  c.strokeStyle = robe;
  c.stroke();
  oval(c, hand[0], hand[1], 4.5, 4.5, SKIN, 1.2);
  //head, three-quarters
  const hy = top - 20;
  if (head === 'scarf' || head === 'kufiya') poly(c, [[-18, hy - 16], [18, hy - 16], [24, hy + 26], [-22, hy + 26]], headColor, 1.5);
  oval(c, 3, hy, 13, 16, SKIN, 1.5);
  if (head === 'hair') {
    c.beginPath();
    c.arc(1, hy - 4, 14, Math.PI * 1.05, Math.PI * 1.95);
    c.fillStyle = HAIR;
    c.fill();
  }
  if (head === 'scarf') poly(c, [[-16, hy - 6], [-12, hy - 18], [14, hy - 18], [18, hy - 6], [14, hy - 12], [-12, hy - 12]], headColor, 1.2);
  if (head === 'cap') poly(c, [[-10, hy - 12], [14, hy - 12], [12, hy - 20], [-8, hy - 20]], headColor, 1.2);
  if (head === 'kufiya') {
    poly(c, [[-16, hy - 8], [-14, hy - 20], [18, hy - 20], [20, hy - 8]], headColor, 1.2);
    poly(c, rect(-15, hy - 15, 34, 4), INK, 0);
  }
  //a miniaturist's face: two dots and an arched brow
  c.fillStyle = INK;
  oval(c, 7, hy - 1, 1.6, 1.6, INK, 0);
  oval(c, -1, hy - 1, 1.6, 1.6, INK, 0);
  c.beginPath();
  c.arc(3, hy + 7, 3, 0.2, Math.PI - 0.2);
  c.lineWidth = 1;
  c.strokeStyle = INK;
  c.stroke();
  c.restore();
}

const RANA = { robe: MALACHITE, trim: GOLD, head: 'scarf' as Head, headColor: ROSE };
const KARIM = { robe: LAPIS, trim: WHITE, head: 'hair' as Head, headColor: HAIR };
const SAMIR = { robe: '#8a6b4a', trim: WHITE, head: 'cap' as Head, headColor: WHITE };
const HADDAD = { robe: '#3c3c46', trim: GOLD, head: 'hair' as Head, headColor: HAIR };
const GUESTS = [
  { robe: '#3c3c46', trim: WHITE, head: 'kufiya' as Head, headColor: WHITE },
  { robe: VERMILION, trim: GOLD, head: 'scarf' as Head, headColor: LAPIS },
  { robe: '#5a4a6a', trim: GOLD, head: 'scarf' as Head, headColor: '#2a2a2a' },
  { robe: '#2f3f5a', trim: WHITE, head: 'hair' as Head, headColor: HAIR },
  { robe: OCHRE, trim: WHITE, head: 'kufiya' as Head, headColor: '#e9e4d8' },
];

// ---------------------------------------------------------------------------
// the souq and the soap house
// ---------------------------------------------------------------------------

function souqScene(c: Ctx, beat: string) {
  goldSky(c, 420);
  citadel(c, 1150, 420, 1);
  dome(c, 330, 430, 70, TURQUOISE);
  minaret(c, 520, 440, 210);
  dome(c, 760, 440, 50, LAPIS);
  cypress(c, 140, 470, 200);
  cypress(c, 1460, 470, 180);
  //the vaulted lane of the souq, with a shop in every arch
  poly(c, rect(0, 420, W, 480), pattern(c, 'stone', STONE, STONE_DARK));
  const goods = [SOAP_GREEN, OCHRE, VERMILION, SOAP, '#b5651d', TURQUOISE];
  for (let k = 0; k < 6; k++) {
    const x = 70 + k * 250;
    arch(c, x, 470, 170, 300, '#3a2a1e');
    //goods piled in each shop
    for (let r = 0; r < 4; r++) for (let q = 0; q <= r; q++) poly(c, rect(x + 50 + q * 22 - r * 11, 690 - (3 - r) * 18, 20, 16), goods[k], 1.2);
  }
  poly(c, rect(0, 770, W, 130), pattern(c, 'carpet', '#a4844f', GOLD_DARK));
  if (beat === 'morning') {
    figure(c, { x: 330, y: 860, s: 1.1, ...GUESTS[0], pose: 'hold' });
    figure(c, { x: 1210, y: 860, s: 1.1, ...GUESTS[4], pose: 'point', flip: true });
  }
}

//the soap house in cutaway: the vat on its fire, the soap floor, and the curing towers
function workshopScene(c: Ctx, beat: string) {
  poly(c, rect(0, 0, W, H), pattern(c, 'stone', STONE, STONE_DARK), 0);
  for (const x of [80, 560, 1040]) arch(c, x, 70, 440, 560, '#e6d6b2', 3);
  //the vat and its fire
  poly(c, rect(140, 560, 300, 90), '#4a3a2a');
  oval(c, 290, 520, 170, 60, COPPER, 3);
  poly(c, [[120, 520], [460, 520], [430, 620], [150, 620]], COPPER, 3);
  oval(c, 290, 520, 150, 46, '#6f7a32', 2);
  //the soap floor, poured and cut
  poly(c, [[500, 760], [1060, 760], [1100, 860], [460, 860]], pattern(c, 'soap', SOAP_GREEN, '#5f6a2a'), 2);
  //the hollow towers of curing soap
  for (const [x, h] of [[1150, 560], [1320, 500], [1480, 440]] as Pt[]) {
    poly(c, rect(x - 70, 860 - h, 140, h), pattern(c, 'soap', SOAP, '#8a7a3e'), 2);
    poly(c, rect(x - 18, 860 - h, 36, h), '#3a2a1e', 1.5);
  }
  poly(c, rect(0, 860, W, 40), '#7a6248', 2);
  if (beat === 'haddad') {
    figure(c, { x: 760, y: 840, s: 1.5, ...HADDAD, pose: 'point' });
    figure(c, { x: 960, y: 840, s: 1.4, ...RANA, pose: 'stand', flip: true });
  }
  if (beat === 'samir') figure(c, { x: 330, y: 760, s: 1.5, ...SAMIR, pose: 'stir' });
  if (beat === 'samir') {
    //his long paddle in the vat
    c.beginPath();
    c.moveTo(380, 520);
    c.lineTo(300, 400);
    c.lineWidth = 7;
    c.strokeStyle = '#6b4a2a';
    c.stroke();
  }
}

//the three of them, like a family portrait, with Karim in a window onto grey Hamburg
function familyScene(c: Ctx) {
  goldSky(c, 900);
  poly(c, rect(240, 180, 1120, 640), pattern(c, 'tile', TURQUOISE, WHITE));
  arch(c, 300, 230, 300, 560, '#efe2c4', 3);
  arch(c, 650, 230, 300, 560, '#efe2c4', 3);
  arch(c, 1000, 230, 300, 560, LAPIS_DARK, 3);
  //Hamburg through the third arch: grey sky, brick gables
  poly(c, rect(1030, 380, 240, 400), '#9aa1a8', 0);
  for (let k = 0; k < 4; k++) poly(c, [[1030 + k * 60, 780], [1030 + k * 60, 560], [1060 + k * 60, 510], [1090 + k * 60, 560], [1090 + k * 60, 780]], '#8a4a3a', 1.5);
  //their father, in a small framed portrait between them
  poly(c, rect(735, 290, 130, 160), GOLD, 3);
  poly(c, rect(750, 305, 100, 130), '#5a4a3a', 1.5);
  figure(c, { x: 800, y: 435, s: 0.55, ...GUESTS[0] });
  figure(c, { x: 450, y: 770, s: 1.45, ...RANA, pose: 'hold' });
  figure(c, { x: 1150, y: 770, s: 1.3, ...KARIM, flip: true });
  poly(c, rect(240, 780, 1120, 40), pattern(c, 'carpet', VERMILION, GOLD), 2);
}

// ---------------------------------------------------------------------------
// the mourning, the notary, the seal
// ---------------------------------------------------------------------------

//the courtyard of the family house, with its fountain, its lemon tree, and chairs for the mourners
function azaScene(c: Ctx, beat: string) {
  goldSky(c, 300);
  poly(c, rect(0, 220, W, 400), pattern(c, 'stone', STONE, STONE_DARK));
  for (let k = 0; k < 5; k++) arch(c, 60 + k * 310, 260, 220, 360, k === 2 ? pattern(c, 'tile', LAPIS, WHITE) : '#e6d6b2', 2.5);
  poly(c, rect(0, 620, W, 280), pattern(c, 'tile', '#e9dcc0', TURQUOISE), 2);
  //the octagonal fountain
  const fountain: Pt[] = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [800 + Math.cos(a) * 150, 740 + Math.sin(a) * 50];
  });
  poly(c, fountain, TURQUOISE, 2.5);
  oval(c, 800, 740, 120, 38, '#5fb3c4', 2);
  //the lemon tree
  poly(c, rect(1350, 420, 20, 220), '#6b4a2a', 1.5);
  oval(c, 1360, 380, 110, 90, MALACHITE, 2);
  for (let i = 0; i < 9; i++) oval(c, 1290 + rand(i) * 140, 330 + rand(i + 4) * 100, 9, 9, '#e8cd2a', 1);
  //the mourners, seated along the walls
  GUESTS.concat(GUESTS).forEach((g, i) => {
    const x = 130 + i * 140 + (i > 4 ? 180 : 0);
    if (x > 1250) return;
    figure(c, { x, y: 660, s: 0.75, ...g, pose: 'sit', flip: i % 2 === 1 });
  });
  if (beat === 'praise') {
    figure(c, { x: 520, y: 880, s: 1.5, ...GUESTS[1], pose: 'point' }); //Umm Fadi
    figure(c, { x: 1060, y: 880, s: 1.5, ...RANA, pose: 'hold', flip: true });
    //the coffee pot
    poly(c, [[1018, 760], [1040, 760], [1046, 800], [1012, 800]], GOLD, 1.5);
  }
}

//the notary's office: files to the ceiling, a desk, and Karim on a laptop
function notaryScene(c: Ctx, beat: string) {
  poly(c, rect(0, 0, W, H), '#e8d8b4', 0);
  for (let row = 0; row < 4; row++) {
    poly(c, rect(80, 120 + row * 150, 460, 12), '#6b4a2a', 1.5);
    for (let k = 0; k < 14; k++) poly(c, rect(90 + k * 32, 40 + row * 150, 26, 80), [OCHRE, '#e9e0c8', ROSE, SOAP][(k + row) % 4], 1.2);
  }
  arch(c, 1120, 80, 300, 440, pattern(c, 'tile', LAPIS, WHITE), 3);
  poly(c, rect(0, 720, W, 180), pattern(c, 'carpet', VERMILION, GOLD), 2);
  poly(c, rect(560, 560, 560, 30), '#6b4a2a', 2);
  poly(c, rect(580, 590, 520, 150), '#7f5a36', 2);
  figure(c, { x: 840, y: 580, s: 1.1, ...GUESTS[3], pose: 'hold' }); //the notary behind his desk
  figure(c, { x: 360, y: 860, s: 1.4, ...RANA, pose: 'point' });
  //the laptop, and Karim in it
  const big = beat === 'call';
  const [lx, ly, lw, lh] = big ? [1080, 300, 380, 250] : [960, 470, 150, 95];
  poly(c, rect(lx, ly, lw, lh), '#1e1e24', 2);
  poly(c, rect(lx + 8, ly + 8, lw - 16, lh - 16), '#9aa1a8', 0);
  figure(c, { x: lx + lw / 2, y: ly + lh + (big ? 120 : 40), s: big ? 1.0 : 0.38, ...KARIM });
  poly(c, [[lx - 20, ly + lh], [lx + lw + 20, ly + lh], [lx + lw + 40, ly + lh + 14], [lx - 40, ly + lh + 14]], '#2a2a30', 1.5);
}

//the open drawer, the brass seal, and soap pressed with it
function sealScene(c: Ctx) {
  poly(c, rect(0, 0, W, H), '#7f5a36', 0);
  for (let y = 40; y < H; y += 60) {
    c.beginPath();
    c.moveTo(0, y);
    c.quadraticCurveTo(W / 2, y + 12, W, y);
    c.lineWidth = 1.5;
    c.strokeStyle = '#6b4a2a';
    c.stroke();
  }
  poly(c, rect(260, 360, 760, 380), '#5a3f24', 3);
  poly(c, rect(290, 390, 700, 320), '#3a2818', 2);
  oval(c, 640, 330, 40, 14, GOLD, 2);
  //the seal itself
  oval(c, 640, 600, 120, 40, GOLD_DARK, 3);
  poly(c, rect(610, 470, 60, 130), GOLD, 3);
  oval(c, 640, 470, 50, 22, GOLD_LIGHT, 3);
  //bars of soap with the seal pressed in
  for (let k = 0; k < 5; k++) {
    const x = 1110 + (k % 2) * 180;
    const y = 180 + k * 130;
    poly(c, rect(x, y, 150, 110), SOAP, 2);
    oval(c, x + 75, y + 55, 34, 34, '#a8955a', 1.5);
    oval(c, x + 75, y + 55, 20, 20, SOAP, 1.2);
  }
}

// ---------------------------------------------------------------------------
// the night and the roof
// ---------------------------------------------------------------------------

function nightScene(c: Ctx) {
  nightSky(c, 360);
  poly(c, rect(0, 300, W, 600), pattern(c, 'stone', '#5a5070', '#3a3450'));
  for (let k = 0; k < 4; k++) arch(c, 100 + k * 380, 340, 240, 360, '#2a2440', 2);
  arch(c, 1240, 380, 180, 260, '#f2c46a', 2); //a lit window
  poly(c, rect(0, 700, W, 200), pattern(c, 'tile', '#3a3450', '#5a6aa0'), 2);
  figure(c, { x: 560, y: 820, s: 1.5, ...RANA, pose: 'sit' });
}

function roofScene(c: Ctx, beat: string) {
  //a dusk sky: gold fading to rose
  const g = c.createLinearGradient(0, 0, 0, 520);
  g.addColorStop(0, beat === 'end' ? '#7a5a8a' : GOLD_LIGHT);
  g.addColorStop(1, ROSE);
  c.fillStyle = g;
  c.fillRect(0, 0, W, 520);
  for (let i = 0; i < 4; i++) cloud(c, 220 + i * 380, 90 + rand(i) * 80, 80);
  citadel(c, 800, 520, 1.25);
  for (let k = 0; k < 9; k++) dome(c, 100 + k * 180, 600, 30 + rand(k) * 30, k % 2 ? TURQUOISE : LAPIS);
  minaret(c, 1380, 600, 240);
  poly(c, rect(0, 580, W, 120), '#c9b38a');
  //the tops of the curing towers in the foreground
  for (const x of [220, 620, 1020, 1420]) {
    poly(c, rect(x - 150, 700, 300, 200), pattern(c, 'soap', SOAP, '#8a7a3e'), 2);
    poly(c, rect(x - 40, 700, 80, 200), '#3a2a1e', 1.5);
  }
}

const BACKDROP: Record<SetId, (c: Ctx, beat: string) => void> = {
  souq: souqScene,
  workshop: workshopScene,
  family: familyScene,
  aza: azaScene,
  notary: notaryScene,
  seal: sealScene,
  night: nightScene,
  roof: roofScene,
};

//the gilded border round every page: gold, a band of lapis with gold vines, and fine ruled lines
let frameCanvas: HTMLCanvasElement | undefined;
function frame() {
  if (frameCanvas) return frameCanvas;
  const [el, c] = canvas2d(W, H);
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, H);
  c.clearRect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);
  c.fillStyle = LAPIS;
  c.fillRect(8, 8, W - 16, 24);
  c.fillRect(8, H - 32, W - 16, 24);
  c.fillRect(8, 8, 24, H - 16);
  c.fillRect(W - 32, 8, 24, H - 16);
  //gold vines along the lapis band
  c.strokeStyle = GOLD_LIGHT;
  c.lineWidth = 2;
  const vine = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 40);
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = i / n;
      const x = x0 + (x1 - x0) * p;
      const y = y0 + (y1 - y0) * p;
      const off = Math.sin(i * Math.PI) * 6;
      c[i ? 'lineTo' : 'moveTo'](x + (y1 !== y0 ? off : 0), y + (x1 !== x0 ? off : 0));
    }
    c.stroke();
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n;
      oval(c, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, 3, 3, GOLD_LIGHT, 0);
    }
  };
  vine(20, 20, W - 20, 20);
  vine(20, H - 20, W - 20, H - 20);
  vine(20, 20, 20, H - 20);
  vine(W - 20, 20, W - 20, H - 20);
  c.lineWidth = 3;
  c.strokeStyle = GOLD;
  c.strokeRect(BORDER - 4, BORDER - 4, W - BORDER * 2 + 8, H - BORDER * 2 + 8);
  c.lineWidth = 1.5;
  c.strokeStyle = VERMILION;
  c.strokeRect(BORDER - 9, BORDER - 9, W - BORDER * 2 + 18, H - BORDER * 2 + 18);
  c.strokeStyle = INK;
  c.strokeRect(4, 4, W - 8, H - 8);
  frameCanvas = el;
  return el;
}

//each page is painted once, the first time its cue comes up
const backdrops = new Map<string, HTMLCanvasElement>();
function backdrop(cue: Cue) {
  const key = `${cue.set}:${cue.beat}`;
  if (!backdrops.has(key)) {
    const [el, c] = canvas2d(W, H);
    BACKDROP[cue.set](c, cue.beat);
    backdrops.set(key, el);
  }
  return backdrops.get(key)!;
}

// ---------------------------------------------------------------------------
// the live layer
// ---------------------------------------------------------------------------

function glow(c: Ctx, x: number, y: number, r: number, rgb: string, strength: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${strength})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

//glints sliding across the gold leaf
function glints(c: Ctx, t: number, bottom: number) {
  for (let i = 0; i < 5; i++) {
    const p = (t * 0.06 + rand(i)) % 1;
    glow(c, p * W, 60 + rand(i + 7) * (bottom - 120), 40, '255,250,220', 0.35);
  }
}

function pigeons(c: Ctx, t: number, cx: number, cy: number) {
  for (let i = 0; i < 7; i++) {
    const a = t * 0.5 + (i / 7) * Math.PI * 2;
    const x = cx + Math.cos(a) * (180 + rand(i) * 80);
    const y = cy + Math.sin(a) * 40 + Math.sin(t * 3 + i) * 6;
    const flap = Math.sin(t * 12 + i) * 6;
    c.beginPath();
    c.moveTo(x - 10, y - flap);
    c.quadraticCurveTo(x - 4, y - 4, x, y);
    c.quadraticCurveTo(x + 4, y - 4, x + 10, y - flap);
    c.lineWidth = 2.5;
    c.strokeStyle = '#5a5a66';
    c.stroke();
  }
}

function fire(c: Ctx, t: number, x: number, y: number, w: number) {
  for (let i = 0; i < 9; i++) {
    const fx = x - w / 2 + (i + 0.5) * (w / 9);
    const h = 30 + 20 * Math.abs(Math.sin(t * 7 + i * 1.7));
    c.beginPath();
    c.moveTo(fx - 10, y);
    c.quadraticCurveTo(fx - 4, y - h * 0.6, fx, y - h);
    c.quadraticCurveTo(fx + 4, y - h * 0.6, fx + 10, y);
    c.fillStyle = i % 2 ? VERMILION : '#f0a020';
    c.fill();
  }
  glow(c, x, y - 20, w * 0.7, '240,150,40', 0.35);
}

function steam(c: Ctx, t: number, x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.18 + i / 6) % 1;
    c.globalAlpha = 0.45 * (1 - p);
    oval(c, x + Math.sin(t + i * 2) * 40, y - p * 300, 30 + p * 50, 18 + p * 30, WHITE, 0);
  }
  c.globalAlpha = 1;
}

function fountainJet(c: Ctx, t: number, x: number, y: number) {
  for (let i = 0; i < 24; i++) {
    const p = (t * 0.9 + i / 24) % 1;
    const a = (i / 24) * Math.PI * 2;
    const dx = Math.cos(a) * 70 * p;
    const dy = -Math.sin(Math.PI * p) * 70 + Math.sin(a) * 20 * p;
    oval(c, x + dx, y + dy, 3, 3, '#cdeef5', 0);
  }
}

function drawLive(c: Ctx, { set, beat }: Cue, t: number) {
  if (set === 'souq') {
    glints(c, t, 420);
    pigeons(c, t, 760, 220);
  }
  if (set === 'workshop') {
    fire(c, t, 290, 650, 260);
    steam(c, t, 290, 470);
    if (beat === 'samir') {
      //the paddle working in the vat
      c.beginPath();
      c.moveTo(380 + Math.sin(t * 2) * 20, 520);
      c.lineTo(300, 400 + Math.cos(t * 2) * 8);
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.stroke();
    }
  }
  if (set === 'family') glints(c, t, 900);
  if (set === 'aza') {
    glints(c, t, 300);
    fountainJet(c, t, 800, 720);
    if (beat === 'praise') steam(c, t, 1029, 760);
  }
  if (set === 'notary') {
    glow(c, 840, 100, 260, '255,230,170', 0.18 + 0.03 * Math.sin(t * 2));
    const big = beat === 'call';
    glow(c, big ? 1270 : 1035, big ? 425 : 517, big ? 220 : 80, '190,210,240', 0.18);
  }
  if (set === 'seal') glow(c, 640 + Math.sin(t * 0.7) * 30, 500, 160, '255,240,190', 0.22);
  if (set === 'night') {
    for (let i = 0; i < 70; i++) {
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 2.1));
      star(c, rand(i) * W, rand(i + 31) * 300, 2 + rand(i + 5) * 3);
    }
    c.globalAlpha = 1;
    //the glow of her phone
    glow(c, 590, 690, 90, '200,220,255', 0.3 + 0.1 * Math.sin(t * 3));
    glow(c, 1330, 510, 160, '242,196,106', 0.25);
  }
  if (set === 'roof') {
    pigeons(c, t, 900, 260);
    if (beat === 'end') {
      for (let i = 0; i < 30; i++) {
        c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + i * 1.7));
        glow(c, 60 + rand(i) * 1480, 560 + rand(i + 11) * 40, 12, '255,220,140', 0.8);
      }
      c.globalAlpha = 1;
    }
  }
}

function drawPage(c: Ctx, cue: Cue, t: number) {
  c.drawImage(backdrop(cue), 0, 0);
  drawLive(c, cue, t);
  c.drawImage(frame(), 0, 0);
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  souq: new URL('./sounds/souq.m4a', import.meta.url).href,
  reception: new URL('./sounds/reception.m4a', import.meta.url).href,
  fountain: new URL('./sounds/fountain.m4a', import.meta.url).href,
  fire: new URL('./sounds/fire.m4a', import.meta.url).href,
  town: new URL('./sounds/town.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor({ set, beat }: Cue): Partial<Record<Bed, number>> {
  if (set === 'souq') return { souq: beat === 'title' ? 0.3 : 0.5 };
  if (set === 'workshop') return { fire: 0.45, souq: 0.12 };
  if (set === 'family') return { fountain: 0.15, reception: 0.1 };
  if (set === 'aza') return { reception: 0.45, fountain: 0.25 };
  if (set === 'notary') return { souq: 0.08 };
  if (set === 'seal') return { fire: 0.1 };
  if (set === 'night') return { fountain: 0.3, town: 0.15 };
  return { town: beat === 'end' ? 0.25 : 0.5, souq: beat === 'end' ? 0 : 0.12 };
}

const RING: OneShot = { src: new URL('./sounds/message.m4a', import.meta.url).href, volume: 0.5, delay: 0.3 };
const ONE_SHOTS: Record<string, OneShot> = {
  notary_call: RING,
  night: RING,
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------

const ease = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

function Miniature({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`Miniature has no cue for the animation "${animation}"`);
  }, [animation]);

  const canvas = useRef<HTMLCanvasElement>(null);
  const shown = useRef({ cue: cues[active], at: 0, prev: cues[active] });
  const sound = useRef<Soundscape<Bed> | null>(null);

  useEffect(() => {
    const el = canvas.current!;
    const c = el.getContext('2d')!;
    const soundscape = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    sound.current = soundscape;

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const sw = el.clientWidth;
      const sh = el.clientHeight;
      if (el.width !== Math.round(sw * dpr) || el.height !== Math.round(sh * dpr)) {
        el.width = Math.round(sw * dpr);
        el.height = Math.round(sh * dpr);
      }
      const { cue, at, prev } = shown.current;
      const t = now / 1000;
      const since = (now - at) / 1000;

      const k = Math.max(sw / W, sh / H);
      c.setTransform(dpr * k, 0, 0, dpr * k, (dpr * (sw - W * k)) / 2, (dpr * (sh - H * k)) / 2);
      c.globalAlpha = 1;
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);
      if (prev.set !== cue.set && since < TURN) {
        //the old page folds away to the spine on the left, then the new one opens out from it
        const p = ease(since / TURN);
        const page = p < 0.5 ? prev : cue;
        const open = p < 0.5 ? 1 - p * 2 : p * 2 - 1;
        c.save();
        c.scale(Math.max(0.001, open), 1);
        drawPage(c, page, t);
        c.restore();
        c.fillStyle = `rgba(42,29,20,${0.35 * (1 - open)})`;
        c.fillRect(0, 0, W * open, H);
      } else {
        if (prev !== cue && prev.set === cue.set && since < BEAT_FADE) {
          drawPage(c, prev, t);
          c.globalAlpha = ease(since / BEAT_FADE);
        }
        drawPage(c, cue, t);
        c.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      soundscape.dispose();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const next = cues[active];
    shown.current = { cue: next, at: now, prev: shown.current.cue };
    sound.current?.mix(mixFor(next));
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
    background: PAPER,
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
    gap: 14,
    paddingBottom: 260,
    fontFamily: SERIF,
    color: INK,
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  },
  kicker: {
    fontSize: 24,
    letterSpacing: 5,
    textTransform: 'uppercase',
    padding: '6px 22px',
    color: GOLD_LIGHT,
    background: LAPIS,
    border: `2px solid ${GOLD}`,
  },
  name: {
    fontSize: 84,
    fontStyle: 'italic',
    padding: '4px 48px 10px',
    color: LAPIS_DARK,
    background: PAPER,
    border: `4px double ${GOLD_DARK}`,
    outline: `2px solid ${VERMILION}`,
    outlineOffset: -12,
  },
};

export default Miniature;
