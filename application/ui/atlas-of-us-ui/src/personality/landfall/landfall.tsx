import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BANK, BUSY_ARM_POSES, CASKS, CLOTH, CREW, FIRE, JOINT_KEYS, LIGHT, LYING, MOBILE_POSES, ORIGIN, PEAK, PILE, REST, RUM, SEATS,
  SET_BARE, SET_CAMP, SET_FEAST, SET_FIRE, SET_FRAME, SET_LATE, SET_SALVAGE, SET_SUPPER, SHELTER, STANDING, STONE, TRAIL,
  WRECK, WRECK_AT, closeUp, gestures, ground, poses, recast, streamX, terrainHeight,
  type Cast, type Cue, type HandPose, type Joints, type Mood, type OneShot, type Placement, type SetDressing, type Shot,
  type Spot, type TimeOfDay, type Vec3, type Who,
} from './world';
import { createSoundscape, type Soundscape } from '../soundscape';

// Landfall's art style: a low-poly, flat-shaded island that moves from dawn to night over the scenario.
// The player washed up at the origin. The sea and the wreck lie toward +z, the camp sits at the top of the beach,
// and a trail climbs into the jungle toward -z, past a stream and a carved stone, under a peak where the light appears.
//
// Every animation name in the script maps to a Cue: where the camera is, the time of day, which parts of the camp
// exist yet, and where each of the crew is standing and what they are doing. Characters walk between cues on their own.

// ---------------------------------------------------------------------------
// the island
// ---------------------------------------------------------------------------

//small deterministic random so the island looks the same on every visit
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const distanceToSegment = (x: number, z: number, [ax, az]: Spot, [bx, bz]: Spot) => {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.min(Math.max(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0), 1);
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
};

const PATH = [...TRAIL, BANK, STONE];

//keeps trees off the trail, out of the stream and away from the stone
const isClear = (x: number, z: number) => {
  for (let i = 0; i < PATH.length - 1; i++) {
    if (distanceToSegment(x, z, PATH[i], PATH[i + 1]) < 2.4) return false;
  }
  if (z < -15 && Math.abs(x - streamX(z)) < 2.8) return false;
  return Math.hypot(x - STONE[0], z - STONE[1]) > 4.5;
};

// ---------------------------------------------------------------------------
// time of day
// ---------------------------------------------------------------------------

interface Palette {
  horizon: string;
  zenith: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: Vec3; //the sun, or the moon at night
  sunColor: string;
  sunSize: number;
  light: string;
  lightIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ocean: string;
  stars: number; //0 to 1
}

const palettes: Record<TimeOfDay, Palette> = {
  dawn: {
    horizon: '#f4b48c', zenith: '#4f74a8', fog: '#f4b48c', fogNear: 80, fogFar: 450,
    sun: [140, 30, 680], sunColor: '#fff1c9', sunSize: 26, light: '#ffc58a', lightIntensity: 2.2,
    hemiSky: '#ffd9b3', hemiGround: '#5a4a3a', hemiIntensity: 1.1, ocean: '#2f6f86', stars: 0,
  },
  morning: {
    horizon: '#f6d2b0', zenith: '#5d8cc4', fog: '#f1d3b8', fogNear: 90, fogFar: 480,
    sun: [260, 220, 600], sunColor: '#fff6dc', sunSize: 26, light: '#ffe0b8', lightIntensity: 2.5,
    hemiSky: '#ffe8cc', hemiGround: '#6a5a44', hemiIntensity: 1.2, ocean: '#2f7690', stars: 0,
  },
  day: {
    horizon: '#cfe6f2', zenith: '#3f7fcb', fog: '#cfe3ee', fogNear: 100, fogFar: 520,
    sun: [120, 640, 220], sunColor: '#ffffff', sunSize: 24, light: '#fff7ea', lightIntensity: 2.8,
    hemiSky: '#e6f2ff', hemiGround: '#6d6048', hemiIntensity: 1.3, ocean: '#2b7d97', stars: 0,
  },
  afternoon: {
    horizon: '#ead9b4', zenith: '#4b82c2', fog: '#e6d8bb', fogNear: 90, fogFar: 480,
    sun: [-260, 380, 460], sunColor: '#fff3d6', sunSize: 26, light: '#ffe6bd', lightIntensity: 2.5,
    hemiSky: '#fbe9cf', hemiGround: '#6a5a44', hemiIntensity: 1.15, ocean: '#2c7590', stars: 0,
  },
  evening: {
    horizon: '#f2b878', zenith: '#56719f', fog: '#eab88a', fogNear: 80, fogFar: 440,
    sun: [-400, 140, 520], sunColor: '#ffe2a8', sunSize: 28, light: '#ffb877', lightIntensity: 2.0,
    hemiSky: '#ffd2a0', hemiGround: '#5a4636', hemiIntensity: 0.9, ocean: '#2d6680', stars: 0,
  },
  sunset: {
    horizon: '#ee7d52', zenith: '#3b4a7a', fog: '#e08a63', fogNear: 70, fogFar: 400,
    sun: [-420, 18, 540], sunColor: '#ffcf8a', sunSize: 32, light: '#ff9a5c', lightIntensity: 1.5,
    hemiSky: '#f7a77d', hemiGround: '#4a3a36', hemiIntensity: 0.7, ocean: '#2a5571', stars: 0,
  },
  dusk: {
    horizon: '#8a5a7a', zenith: '#1f2a4f', fog: '#6d4f6b', fogNear: 60, fogFar: 340,
    sun: [-420, -80, 540], sunColor: '#ffb27a', sunSize: 30, light: '#c48aa0', lightIntensity: 0.6,
    hemiSky: '#9a7aa0', hemiGround: '#2e2630', hemiIntensity: 0.45, ocean: '#1f3d55', stars: 0.3,
  },
  night: {
    horizon: '#1b2540', zenith: '#060a18', fog: '#141c30', fogNear: 40, fogFar: 260,
    sun: [320, 260, 520], sunColor: '#e4ebf7', sunSize: 14, light: '#9fb3d9', lightIntensity: 0.45,
    hemiSky: '#3a4a70', hemiGround: '#141210', hemiIntensity: 0.3, ocean: '#0f2234', stars: 1,
  },
};

interface Atmos {
  horizon: THREE.Color;
  zenith: THREE.Color;
  fog: THREE.Color;
  sunColor: THREE.Color;
  light: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  ocean: THREE.Color;
  sun: THREE.Vector3;
  fogNear: number;
  fogFar: number;
  sunSize: number;
  lightIntensity: number;
  hemiIntensity: number;
  stars: number;
}

const COLOR_KEYS = ['horizon', 'zenith', 'fog', 'sunColor', 'light', 'hemiSky', 'hemiGround', 'ocean'] as const;
const NUMBER_KEYS = ['fogNear', 'fogFar', 'sunSize', 'lightIntensity', 'hemiIntensity', 'stars'] as const;

const toAtmos = (p: Palette): Atmos => ({
  horizon: new THREE.Color(p.horizon),
  zenith: new THREE.Color(p.zenith),
  fog: new THREE.Color(p.fog),
  sunColor: new THREE.Color(p.sunColor),
  light: new THREE.Color(p.light),
  hemiSky: new THREE.Color(p.hemiSky),
  hemiGround: new THREE.Color(p.hemiGround),
  ocean: new THREE.Color(p.ocean),
  sun: new THREE.Vector3(...p.sun),
  fogNear: p.fogNear,
  fogFar: p.fogFar,
  sunSize: p.sunSize,
  lightIntensity: p.lightIntensity,
  hemiIntensity: p.hemiIntensity,
  stars: p.stars,
});

const ATMOS = Object.fromEntries(
  Object.entries(palettes).map(([time, palette]) => [time, toAtmos(palette)]),
) as Record<TimeOfDay, Atmos>;

// ---------------------------------------------------------------------------
// the crew
// ---------------------------------------------------------------------------

interface Look {
  scale: number;
  build: number; //how broad they are
  skin: string;
  shirt: string;
  coat: string; //torso and sleeves; the same as shirt when there is no coat
  pants: string;
  shoes: string;
  hair: string;
  hairStyle: 'crop' | 'pony' | 'bun' | 'mop';
  beard?: string;
  bandage?: boolean;
  satchel?: string;
  apron?: string;
}

const looks: Record<Who, Look> = {
  //first mate: big, navy coat, black beard, bandaged head
  voss: {
    scale: 0.97, build: 1.25, skin: '#c98d6a', shirt: '#e8e0cc', coat: '#26324a', pants: '#2b2622', shoes: '#1c1714',
    hair: '#2a1f1a', hairStyle: 'crop', beard: '#2a1f1a', bandage: true,
  },
  //cartographer: slim, green coat, ponytail, satchel of ruined charts
  ines: {
    scale: 0.92, build: 0.9, skin: '#b07a55', shirt: '#e6dcc6', coat: '#4f6b45', pants: '#5a4836', shoes: '#3a2a1e',
    hair: '#1d1612', hairStyle: 'pony', satchel: '#7a5a3a',
  },
  //cook: short and sturdy, grey bun, apron
  maren: {
    scale: 0.86, build: 1.2, skin: '#e0b296', shirt: '#7a4a3a', coat: '#7a4a3a', pants: '#5b3a2e', shoes: '#2e2018',
    hair: '#b9b4ab', hairStyle: 'bun', apron: '#efe9da',
  },
  //deckhand: young and slight, no coat, straw-colored mop, barefoot
  tob: {
    scale: 0.82, build: 0.85, skin: '#f0c7a8', shirt: '#9cc3d9', coat: '#9cc3d9', pants: '#8a7a5c', shoes: '#f0c7a8',
    hair: '#d9b25e', hairStyle: 'mop',
  },
};

// ---------------------------------------------------------------------------
// cues
// ---------------------------------------------------------------------------

// ---- waking and gathering on the tideline ----
const VOSS_GATHER: Spot = [-1.6, 4.2];
const VOSS_FORWARD: Spot = [-0.8, 2.6];
const INES_GATHER: Spot = [1.8, 4.6];
const MAREN_GATHER: Spot = [4.2, 3.2];
const TOB_GATHER: Spot = [-3.8, 3.4];

const GATHERED: Cast = {
  voss: { at: VOSS_GATHER, mood: 'stern' },
  ines: { at: INES_GATHER, face: [1.4, 8], pose: 'wring', gesture: 'wring', mood: 'worried' },
  maren: { at: MAREN_GATHER, face: [5, 8], pose: 'haul', gesture: 'haul', prop: 'crate' },
  tob: { at: TOB_GATHER, face: [-2, 12], pose: 'hugKnees', mood: 'worried', look: WRECK },
};
const CLAIMED = recast(GATHERED, {
  voss: { at: VOSS_FORWARD, look: 'camera' },
  ines: { pose: 'stand', gesture: undefined, face: VOSS_FORWARD, mood: 'neutral' },
});
const ARGUING = recast(CLAIMED, {
  voss: { face: INES_GATHER, look: ground(INES_GATHER[0], INES_GATHER[1], 1.55) },
  ines: { pose: 'foldArms', mood: 'stern' },
});
const TURNED: Cast = {
  voss: { at: VOSS_FORWARD, look: 'camera', mood: 'stern' },
  ines: { at: INES_GATHER, look: 'camera', pose: 'foldArms' },
  maren: { at: [3.6, 2.6], look: 'camera' },
  tob: { at: TOB_GATHER, face: [-2, 12], pose: 'hugKnees', look: 'camera', mood: 'worried' },
};
const REACTING = recast(TURNED, {
  ines: { mood: 'stern', look: undefined, face: VOSS_FORWARD },
  maren: { pose: 'shrug' },
  tob: { mood: 'neutral' },
});

// ---- midday, deciding what to do ----
const PLAYER_PLAN: Spot = [2.5, 0.5];
const PLANNING: Cast = {
  voss: { at: [-0.5, -3], mood: 'stern' },
  ines: { at: [1.5, -3.8] },
  maren: { at: [-5.6, -4.2], look: 'camera' },
  tob: { at: [0.2, -1.6], pose: 'sit', look: 'camera', mood: 'worried' },
};

// ---- the camp in the afternoon ----
const CAMP_CREW: Cast = {
  voss: { at: [-6.8, -4.4], pose: 'foldArms', mood: 'smile' },
  maren: { at: [-8, -4], pose: 'sit' },
  tob: { at: [-10.8, -5.4], pose: 'crouch', gesture: 'work', face: SHELTER },
};

// ---- supplies at evening ----
const PLAYER_SUPPER: Spot = [-0.6, -4];
const MAREN_SUPPER: Spot = [-1.8, -7.2];
const TOB_SUPPER: Spot = [-3.4, -5.4];
const SUPPER: Cast = {
  maren: { at: MAREN_SUPPER, pose: 'kneel', face: CLOTH },
  tob: { at: TOB_SUPPER, pose: 'crouch', face: CLOTH, mood: 'worried' },
};
const VOSS_TOAST: Spot = [2.4, -4.4];
const INES_FRUIT: Spot = [-2.2, -4.2];
const FEAST: Cast = recast(SUPPER, {
  voss: { at: VOSS_TOAST, mood: 'grin', look: 'camera' },
  ines: { at: INES_FRUIT, mood: 'smile', look: 'camera' },
});

// ---- around the fire ----
const VOSS_POURING: Spot = [2.6, -3];
const FIRESIDE: Cast = {
  voss: { at: SEATS.voss, face: FIRE, pose: 'sitCup', prop: 'cup', mood: 'grin' },
  ines: { at: SEATS.ines, face: FIRE, pose: 'sitCup', prop: 'cup', mood: 'smile' },
  maren: { at: SEATS.maren, face: FIRE, pose: 'sitCup', prop: 'cup' },
  tob: { at: SEATS.tob, face: FIRE, pose: 'sitCup', prop: 'cup', mood: 'smile' },
};
const POURING = recast(FIRESIDE, {
  voss: { at: VOSS_POURING, face: 'camera', look: 'camera', pose: 'offer', prop: 'cup', mood: 'grin' },
});
const NIGHT: Cast = {
  voss: { at: SEATS.voss, face: FIRE, pose: 'sit' },
  ines: { at: SEATS.ines, face: FIRE, pose: 'sit' },
  maren: { at: SEATS.maren, face: FIRE, pose: 'sit' },
  tob: { at: SEATS.tob, face: FIRE, pose: 'sit' },
};
const WATCHING = recast(NIGHT, {
  voss: { look: LIGHT },
  ines: { look: LIGHT, mood: 'surprised' },
  maren: { look: LIGHT },
  tob: { pose: 'stand', face: PEAK, look: LIGHT, mood: 'worried' },
});
const INES_HEAD: Vec3 = ground(SEATS.ines[0], SEATS.ines[1], 1.55);
const STANDOFF = recast(WATCHING, {
  ines: { pose: 'stand', face: PEAK, mood: 'neutral' },
  voss: { pose: 'stand', face: SEATS.ines, look: INES_HEAD, mood: 'angry' },
  tob: { pose: 'hugKnees', face: FIRE, look: undefined, mood: 'worried', gesture: 'shiver' },
});
const INES_TORCH: Spot = [0.5, -3];
const INES_LEAVING: Spot = [-0.2, -3.4];
const ASLEEP: Cast = {
  voss: { at: [-8, -7.6], face: [-8, 0], pose: 'lie', mood: 'asleep' },
  maren: { at: [-8.2, -6.6], face: [-8.2, 0], pose: 'lie', mood: 'asleep' },
  tob: { at: [-5.6, -5.8], face: [-5.6, 0], pose: 'lie', mood: 'asleep' },
  ines: { at: [-0.2, -4.6], face: [-0.2, 0], pose: 'lie', mood: 'asleep' },
};

const PLAYER_FIRE_EYE = ground(SEATS.player[0], SEATS.player[1], 1.1);
const PLAYER_FIRE_STANDING = ground(SEATS.player[0], SEATS.player[1], 1.7);
const ON_THE_LIGHT: Shot = { from: PLAYER_FIRE_STANDING, to: LIGHT, speed: 1 };

const cues: Record<string, Cue> = {
  // ---- waking on the beach ----
  black_screen_storm_audio: {
    camera: { from: LYING, to: [6, 0.6, 12], speed: 2 }, time: 'dawn', set: SET_BARE, cast: {}, overlay: 'storm', fade: 0.5,
  },
  fade_in_beach_dawn: { camera: { from: LYING, to: [6, 0.6, 12], speed: 2 }, time: 'dawn', set: SET_BARE, cast: {}, fade: 4 },
  camera_rise_from_sand: { camera: { from: STANDING, to: [0, 1.8, 30], speed: 0.9 }, time: 'dawn', set: SET_BARE, cast: {} },
  pan_to_wreck_on_reef: { camera: { from: STANDING, to: [10, 1.5, 45], speed: 1.2 }, time: 'dawn', set: SET_BARE, cast: {} },
  pan_along_debris: { camera: { from: STANDING, to: [-10, 0.3, 6], speed: 1 }, time: 'dawn', set: SET_BARE, cast: {} },
  pan_to_treeline: { camera: { from: STANDING, to: [0, 8, -30], speed: 1 }, time: 'dawn', set: SET_BARE, cast: {} },
  hold_on_beach_wide: {
    camera: { from: [14, 6, 14], to: [-4, 0.5, 0], speed: 0.6 }, time: 'dawn', set: SET_BARE,
    cast: { tob: { at: [-15, 3], face: [-14, 12], pose: 'hugKnees', gesture: 'cough', mood: 'worried' } },
  },

  // ---- who leads ----
  survivors_gather: { camera: { from: ground(0, -1.2, 1.75), to: ground(0.2, 3.8, 1.1) }, time: 'morning', set: SET_BARE, cast: GATHERED },
  focus_voss: {
    camera: closeUp(VOSS_GATHER, ORIGIN, { distance: 2.3, head: 1.72 }), time: 'morning', set: SET_BARE,
    cast: recast(GATHERED, { voss: { look: 'camera' } }),
  },
  focus_ines: { camera: closeUp(INES_GATHER, ORIGIN, { distance: 2.2, head: 1.45, eye: 1.6 }), time: 'morning', set: SET_BARE, cast: GATHERED },
  focus_maren: { camera: closeUp(MAREN_GATHER, [1.5, 0], { distance: 2.6, head: 1.3, eye: 1.6 }), time: 'morning', set: SET_BARE, cast: GATHERED },
  focus_tob: { camera: closeUp(TOB_GATHER, [-2, 0.5], { distance: 2, head: 0.85, eye: 1.2 }), time: 'morning', set: SET_BARE, cast: GATHERED },
  voss_steps_forward: {
    camera: { from: ground(0.4, -0.4, 1.6), to: ground(VOSS_FORWARD[0], VOSS_FORWARD[1], 1.75), speed: 1.6 },
    time: 'morning', set: SET_BARE, cast: CLAIMED,
  },
  ines_folds_arms: { camera: { from: ground(0.2, -0.6, 1.7), to: ground(0.6, 3.4, 1.5) }, time: 'morning', set: SET_BARE, cast: ARGUING },
  voss_glares: {
    camera: closeUp(VOSS_FORWARD, [1.2, 0.2], { distance: 1.9, head: 1.72 }), time: 'morning', set: SET_BARE,
    cast: recast(ARGUING, { voss: { face: 'camera', look: 'camera', pose: 'glare', mood: 'angry' } }),
  },
  camera_turn_to_player: { camera: { from: ground(0, -0.3, 1.7), to: ground(0.4, 3, 1.3), speed: 0.8 }, time: 'morning', set: SET_BARE, cast: TURNED },
  player_speaks: { camera: { from: ground(0, 0, 1.7), to: ground(0.4, 3, 1.35) }, time: 'morning', set: SET_BARE, cast: TURNED },
  voss_nods: {
    camera: closeUp(VOSS_FORWARD, ORIGIN, { distance: 2, head: 1.72 }), time: 'morning', set: SET_BARE,
    cast: recast(TURNED, { voss: { gesture: 'nod', mood: 'smile' } }),
  },
  survivors_react: { camera: { from: ground(0, -0.6, 1.75), to: ground(0.6, 3.2, 1.25) }, time: 'morning', set: SET_BARE, cast: REACTING },
  maren_looks_up: {
    camera: closeUp([3.6, 2.6], ORIGIN, { distance: 2, head: 1.0, eye: 1.4 }), time: 'morning', set: SET_BARE,
    cast: recast(REACTING, { maren: { pose: 'crouch', mood: 'smile', look: 'camera' } }),
  },
  ines_nods: {
    camera: closeUp(INES_GATHER, ORIGIN, { distance: 2.2, head: 1.58 }), time: 'morning', set: SET_BARE,
    cast: recast(TURNED, { ines: { pose: 'stand', gesture: 'nod', mood: 'smile' } }),
  },
  player_looks_away: {
    camera: { from: ground(0, 0, 1.7), to: [14, 1.2, 30], speed: 0.9 }, time: 'morning', set: SET_BARE,
    cast: recast(TURNED, { ines: { mood: 'frown' } }),
  },

  // ---- explore or secure camp ----
  sun_climbs: { camera: { from: ground(4.5, 1.5, 1), to: ground(-1, -3, 2.8), speed: 0.7 }, time: 'day', set: SET_SALVAGE, cast: PLANNING },
  voss_points_beach: {
    camera: { from: ground(-3.2, -1.2, 1.8), to: ground(6, -1, 1.3) }, time: 'day', set: SET_SALVAGE,
    cast: recast(PLANNING, { voss: { pose: 'point', face: PILE, mood: 'stern' } }),
  },
  ines_points_inland: {
    camera: { from: ground(4, -1, 1.7), to: ground(-6, -12, 3) }, time: 'day', set: SET_SALVAGE,
    cast: recast(PLANNING, { ines: { pose: 'point', face: TRAIL[2] } }),
  },
  maren_taps_cask: {
    camera: closeUp([-5.6, -4.2], [-3, -2], { distance: 2.4, head: 1.3 }), time: 'day', set: SET_SALVAGE,
    cast: recast(PLANNING, { maren: { pose: 'tap', gesture: 'tap', face: CASKS[1] } }),
  },
  tob_glances_treeline: {
    camera: { from: ground(1.2, -0.4, 1.3), to: ground(-6, -10, 2.5) }, time: 'day', set: SET_SALVAGE,
    cast: recast(PLANNING, { tob: { look: ground(-8, -14, 3), gesture: 'lookAround' } }),
  },
  camera_turn_to_player_midday: {
    camera: { from: ground(PLAYER_PLAN[0], PLAYER_PLAN[1], 1.7), to: ground(-1, -3.2, 1.3), speed: 0.8 }, time: 'day', set: SET_SALVAGE,
    cast: recast(PLANNING, { voss: { look: 'camera' }, ines: { look: 'camera' } }),
  },
  split_view_beach_forest: { camera: { from: [10, 12, 10], to: ground(-6, -14, 3), speed: 0.7 }, time: 'day', set: SET_SALVAGE, cast: PLANNING },

  // ---- inland with Ines ----
  enter_forest: {
    camera: { from: ground(-2, -7, 1.7), to: ground(-8, -14, 1.6) }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: TRAIL[1], face: TRAIL[2] } },
  },
  forest_canopy_light: {
    camera: { from: ground(-7, -13, 1.6), to: ground(-11, -19, 12), speed: 0.8 }, time: 'day', set: { ...SET_SALVAGE, shafts: true },
    cast: { ines: { at: TRAIL[2], face: TRAIL[3] } },
  },
  forest_walk: {
    camera: { from: ground(-12, -18.5, 1.7), to: ground(-19, -27, 1.4) }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: TRAIL[3], face: TRAIL[4] } },
  },
  ines_stops: {
    camera: { from: ground(-20.8, -29.5, 1.7), to: ground(-24, -34, 1.55) }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: TRAIL[4], pose: 'listen', mood: 'surprised', look: 'camera' } },
  },
  reveal_stream: {
    camera: { from: ground(-25.5, -35.5, 2.4), to: ground(-31.6, -41.5, 0.2), speed: 1.2 }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: BANK, face: [-31.5, -40], mood: 'smile' } },
  },
  reveal_carved_stone: {
    camera: { from: ground(-26.7, -40.1, 1.25), to: ground(STONE[0], STONE[1], 0.75), speed: 1.4 }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: BANK, face: STONE, mood: 'surprised' } },
  },
  ines_kneels_at_stone: {
    camera: { from: ground(-25.8, -38.6, 1.6), to: ground(-28.1, -41, 0.8) }, time: 'day', set: SET_SALVAGE,
    cast: { ines: { at: [-27.6, -40.5], face: STONE, pose: 'kneel', gesture: 'trace', mood: 'surprised' } },
  },
  forest_walk_return: {
    camera: { from: ground(-5.5, -11.5, 1.7), to: ground(-9.5, -15.5, 1.5) }, time: 'afternoon', set: SET_SALVAGE,
    cast: { ines: { at: TRAIL[1], enter: TRAIL[2], face: TRAIL[0], prop: 'skin', mood: 'smile' } },
  },
  camp_lean_to: {
    camera: { from: ground(-2.5, -1.5, 1.75), to: ground(-8.5, -6.5, 1.1) }, time: 'afternoon', set: SET_CAMP, cast: CAMP_CREW,
  },

  // ---- building camp ----
  camp_work_montage: {
    camera: { from: ground(1.5, 0.5, 1.9), to: ground(-6, -4.5, 1.2) }, time: 'day', set: SET_SALVAGE,
    cast: {
      voss: { at: [-5, -2.8], pose: 'point', face: SHELTER, mood: 'stern' },
      maren: { at: [-6.4, -3.8], pose: 'haul', gesture: 'haul', prop: 'crate', face: [-3, 2] },
      tob: { at: [-8.2, -5.2], pose: 'carry', prop: 'plank', face: SHELTER },
    },
  },
  lash_spars: {
    camera: { from: ground(-9.8, -4.6, 1.5), to: ground(-9.2, -6.6, 0.9) }, time: 'day', set: SET_FRAME, hand: 'work',
    cast: {
      maren: { at: [-8.2, -5.2], pose: 'kneel', gesture: 'work', face: SHELTER },
      voss: { at: [-6.2, -3.6], pose: 'foldArms', face: SHELTER, mood: 'stern' },
    },
  },
  build_signal_pile: {
    camera: { from: ground(12.8, -3.4, 1.8), to: ground(17.6, 0.2, 0.9) }, time: 'afternoon', set: SET_CAMP,
    cast: { voss: { at: [16.6, -0.6], pose: 'stack', gesture: 'work', face: PILE } },
  },
  ines_returns: {
    camera: { from: ground(0.5, -1.5, 1.7), to: ground(-3.6, -6.6, 1.45) }, time: 'afternoon', set: SET_CAMP,
    cast: { ...CAMP_CREW, ines: { at: [-3.4, -6.2], enter: TRAIL[1], prop: 'skin', mood: 'smile', look: 'camera' } },
  },

  // ---- splitting up ----
  group_splits: {
    camera: { from: ground(1.6, -0.6, 1.8), to: ground(-6, -11, 2) }, time: 'day', set: SET_SALVAGE,
    cast: {
      ines: { at: TRAIL[1], face: TRAIL[2] },
      tob: { at: [-6.6, -12.2], face: TRAIL[1] },
      voss: { at: [-4.6, -3.4], face: TRAIL[0], mood: 'stern' },
      maren: { at: [-6.2, -4.2], face: TRAIL[0] },
    },
  },
  tob_looks_back: {
    camera: { from: ground(-3.2, -6, 1.7), to: ground(-7.4, -13.2, 1.4) }, time: 'day', set: SET_SALVAGE,
    cast: {
      ines: { at: TRAIL[2], face: TRAIL[3] },
      tob: { at: [-7.4, -13.2], look: 'camera', mood: 'worried' },
      voss: { at: [-4.6, -3.4], face: TRAIL[0], mood: 'stern' },
      maren: { at: [-6.2, -4.2], face: TRAIL[0] },
    },
  },
  shadows_lengthen: {
    camera: { from: ground(4.5, 1.5, 2.2), to: ground(-6, -5.5, 1), speed: 0.6 }, time: 'evening', set: SET_CAMP,
    cast: {
      voss: { at: [-5.6, -3.6], pose: 'sit', face: TRAIL[0], look: ground(-8, -14, 2.5) },
      maren: { at: [-7.2, -4.2], pose: 'sit', face: TRAIL[0] },
    },
  },
  ines_tob_return: {
    camera: { from: ground(-0.6, -1.2, 1.8), to: ground(-5, -7, 1.4) }, time: 'evening', set: SET_CAMP,
    cast: {
      ines: { at: [-4.4, -6.4], enter: TRAIL[1], prop: 'skin', mood: 'smile' },
      tob: { at: [-5.6, -7.2], enter: [-9.5, -15.5], prop: 'skin', mood: 'worried' },
      voss: { at: [-5.2, -3.2], face: [-4.4, -6.4] },
      maren: { at: [-6.8, -3.8], face: [-4.4, -6.4] },
    },
  },
  focus_tob_afternoon: {
    camera: closeUp([-5.6, -7.2], [-0.6, -1.2], { distance: 2.2, head: 1.45 }), time: 'evening', set: SET_CAMP,
    cast: {
      ines: { at: [-4.4, -6.4], prop: 'skin', mood: 'smile' },
      tob: { at: [-5.6, -7.2], prop: 'skin', mood: 'worried', look: ground(-8, -14, 2.2) },
      voss: { at: [-5.2, -3.2], face: [-4.4, -6.4] },
      maren: { at: [-6.8, -3.8], face: [-4.4, -6.4] },
    },
  },

  // ---- the supplies ----
  supplies_laid_out: {
    camera: { from: ground(-0.4, -3.6, 1.15), to: ground(CLOTH[0], CLOTH[1] - 0.1, 0.2) }, time: 'evening', set: SET_SUPPER, cast: SUPPER,
  },
  pan_supplies: {
    camera: { from: ground(-0.9, -5.2, 1.5), to: ground(-2.6, -6.1, 0.1), speed: 0.7 }, time: 'evening', set: SET_SUPPER, cast: SUPPER,
  },
  maren_counts: {
    camera: closeUp(MAREN_SUPPER, PLAYER_SUPPER, { distance: 2, head: 1.15, eye: 1.1 }), time: 'evening', set: SET_SUPPER,
    cast: recast(SUPPER, { maren: { gesture: 'count' } }),
  },
  tob_counts: {
    camera: closeUp(TOB_SUPPER, PLAYER_SUPPER, { distance: 1.8, head: 1.0, eye: 1.1 }), time: 'evening', set: SET_SUPPER,
    cast: recast(SUPPER, { tob: { gesture: 'count' } }),
  },
  maren_turns_to_player: {
    camera: closeUp(MAREN_SUPPER, PLAYER_SUPPER, { distance: 2, head: 1.15, eye: 1.1 }), time: 'evening', set: SET_SUPPER,
    cast: recast(SUPPER, { maren: { look: 'camera', mood: 'smile' } }),
  },
  maren_nods: {
    camera: closeUp(MAREN_SUPPER, PLAYER_SUPPER, { distance: 2, head: 1.15, eye: 1.1 }), time: 'evening', set: SET_SUPPER,
    cast: recast(SUPPER, { maren: { look: 'camera', gesture: 'nod' } }),
  },

  // ---- the rum cask ----
  voss_rolls_cask: {
    camera: { from: ground(PLAYER_SUPPER[0], PLAYER_SUPPER[1], 1.15), to: ground(4, 1, 1.4), speed: 1 }, time: 'sunset', set: SET_SUPPER,
    cast: recast(SUPPER, { voss: { at: VOSS_TOAST, enter: [7.5, 6], face: RUM, pose: 'roll', prop: 'cask', mood: 'grin' } }),
  },
  voss_grins: {
    camera: closeUp(VOSS_TOAST, PLAYER_SUPPER, { distance: 2.2, head: 1.75, eye: 1.15 }), time: 'sunset', set: SET_FEAST,
    cast: recast(SUPPER, { voss: { at: VOSS_TOAST, mood: 'grin', look: 'camera' } }),
  },
  ines_brings_fruit: {
    camera: { from: ground(PLAYER_SUPPER[0], PLAYER_SUPPER[1], 1.15), to: ground(-3, -6.5, 1.3) }, time: 'sunset', set: SET_FEAST,
    cast: recast(FEAST, { ines: { enter: [-5.5, -10.5], prop: 'fruit', look: undefined } }),
  },
  voss_raises_cup: {
    camera: closeUp(VOSS_TOAST, PLAYER_SUPPER, { distance: 2.4, head: 1.9, eye: 1.15 }), time: 'sunset', set: SET_FEAST,
    cast: recast(FEAST, { voss: { pose: 'raiseCup', prop: 'cup' } }),
  },
  maren_frowns: {
    camera: closeUp(MAREN_SUPPER, PLAYER_SUPPER, { distance: 2.2, head: 1.5, eye: 1.15 }), time: 'sunset', set: SET_FEAST,
    cast: recast(FEAST, { voss: { pose: 'raiseCup', prop: 'cup' }, maren: { pose: 'foldArms', mood: 'frown', look: 'camera' } }),
  },
  ines_shrugs: {
    camera: closeUp(INES_FRUIT, PLAYER_SUPPER, { distance: 1.6, head: 1.55, eye: 1.15 }), time: 'sunset', set: SET_FEAST,
    cast: recast(FEAST, { voss: { prop: 'cup' }, maren: { pose: 'foldArms', mood: 'frown' }, ines: { pose: 'shrug' } }),
  },
  fire_cups_passed: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(0.6, -4.6, 0.8), speed: 1 }, time: 'dusk', set: SET_FIRE, cast: FIRESIDE,
  },
  cup_offered_to_player: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(VOSS_POURING[0], VOSS_POURING[1], 1.35) }, time: 'dusk', set: SET_FIRE, cast: POURING,
  },
  fire_warm_glow: { camera: { from: ground(3.2, -1.8, 1.1), to: ground(1.2, -4, 0.7), speed: 0.8 }, time: 'dusk', set: SET_FIRE, cast: FIRESIDE },
  maren_seals_cask: {
    camera: closeUp([2.9, -4.5], SEATS.player, { distance: 1.8, head: 1.1, eye: 1.2 }), time: 'dusk', set: SET_FIRE,
    cast: recast(FIRESIDE, { maren: { at: [2.9, -4.5], face: RUM, pose: 'hammer', gesture: 'hammer', prop: 'mallet', mood: 'neutral' } }),
  },
  player_covers_cup: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(2.7, -2.9, 0.75) }, time: 'dusk', set: SET_FIRE, cast: POURING, hand: 'cover',
  },
  player_refuses_cup: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(VOSS_POURING[0], VOSS_POURING[1], 1.2) }, time: 'dusk', set: SET_FIRE, cast: POURING, hand: 'push',
  },
  voss_shrugs: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(VOSS_POURING[0], VOSS_POURING[1], 1.5) }, time: 'dusk', set: SET_FIRE,
    cast: recast(POURING, { voss: { pose: 'shrug', mood: 'neutral' } }),
  },
  maren_nods_fire: {
    camera: closeUp(SEATS.maren, SEATS.player, { distance: 1.6, head: 0.92, eye: 1.1 }), time: 'dusk', set: SET_FIRE,
    cast: recast(FIRESIDE, { maren: { gesture: 'nod', look: 'camera' } }),
  },

  // ---- the light inland ----
  night_fire_wide: { camera: { from: ground(7.5, 1.5, 3.2), to: ground(1.2, -4, 0.8), speed: 0.8 }, time: 'night', set: SET_FIRE, cast: NIGHT },
  tob_points_inland: {
    camera: { from: ground(0.8, 0.6, 1.6), to: [6, 30, -70] }, time: 'night', set: SET_FIRE,
    cast: recast(NIGHT, { tob: { pose: 'pointUp', face: PEAK, mood: 'surprised' } }),
  },
  reveal_inland_light: { camera: ON_THE_LIGHT, time: 'night', set: { ...SET_FIRE, light: 'on' }, cast: WATCHING },
  inland_light_pulses: { camera: ON_THE_LIGHT, time: 'night', set: { ...SET_FIRE, light: 'pulse' }, cast: WATCHING },
  bell_sound_hold: { camera: ON_THE_LIGHT, time: 'night', set: SET_FIRE, cast: WATCHING },
  inland_slope_dark: { camera: ON_THE_LIGHT, time: 'night', set: SET_FIRE, cast: WATCHING },
  ines_stands: {
    camera: closeUp(SEATS.ines, SEATS.player, { distance: 2.4, head: 1.6, eye: 1.5 }), time: 'night', set: SET_FIRE,
    cast: recast(WATCHING, { ines: { pose: 'stand', face: PEAK, mood: 'neutral' } }),
  },
  voss_stands: {
    camera: closeUp(SEATS.voss, SEATS.player, { distance: 2.4, head: 1.7, eye: 1.5 }), time: 'night', set: SET_FIRE,
    cast: recast(STANDOFF, { tob: { pose: 'stand', face: PEAK, look: LIGHT, gesture: undefined } }),
  },
  tob_shrinks: {
    camera: closeUp(SEATS.tob, SEATS.player, { distance: 1.8, head: 0.85, eye: 1.2 }), time: 'night', set: SET_FIRE, cast: STANDOFF,
  },
  ines_reaches_for_torch: {
    camera: closeUp(INES_TORCH, SEATS.player, { distance: 2, head: 1.1, eye: 1.3 }), time: 'night', set: SET_FIRE,
    cast: recast(STANDOFF, { ines: { at: INES_TORCH, face: FIRE, pose: 'reach', prop: 'torch', look: undefined } }),
  },

  // ---- into the dark ----
  enter_forest_night: {
    camera: { from: ground(-3.4, -8.6, 1.7), to: ground(-8, -14, 1.6) }, time: 'night', set: SET_FIRE, hand: 'torch',
    cast: { ines: { at: TRAIL[1], face: TRAIL[2], pose: 'torch', prop: 'torch' } },
  },
  forest_night_torch: {
    camera: { from: ground(-13.5, -20.5, 1.7), to: ground(-19, -27, 1.6) }, time: 'night', set: SET_FIRE, hand: 'torch',
    cast: { ines: { at: TRAIL[3], face: TRAIL[4], pose: 'torch', prop: 'torch' } },
  },
  ines_stops_night: {
    camera: { from: ground(-21.2, -30.2, 1.7), to: ground(-24, -34, 1.55) }, time: 'night', set: SET_FIRE, hand: 'torch',
    cast: { ines: { at: TRAIL[4], pose: 'torch', prop: 'torch', mood: 'worried', look: 'camera' } },
  },
  return_to_fire: {
    camera: { from: ground(-2.4, -8.2, 1.7), to: ground(1, -4, 0.9) }, time: 'night', set: SET_FIRE, hand: 'torch',
    cast: recast(NIGHT, {
      voss: { look: 'camera', mood: 'angry' },
      maren: { look: 'camera', mood: 'worried' },
      tob: { look: 'camera', mood: 'worried' },
      ines: { enter: TRAIL[0], face: FIRE, pose: 'torch', prop: 'torch', mood: 'worried' },
    }),
  },

  // ---- staying put ----
  player_stops_ines: {
    camera: { from: ground(0.6, -2.6, 1.65), to: ground(-0.3, -3.6, 1.35) }, time: 'night', set: SET_FIRE, hand: 'reach',
    cast: recast(STANDOFF, { ines: { at: INES_LEAVING, face: TRAIL[0], pose: 'torch', prop: 'torch' } }),
  },
  ines_frowns: {
    camera: closeUp(INES_LEAVING, [1.2, -2.2], { distance: 1.6, head: 1.6, eye: 1.65 }), time: 'night', set: SET_FIRE,
    cast: recast(STANDOFF, { ines: { at: INES_LEAVING, look: 'camera', pose: 'torch', prop: 'torch', mood: 'frown' } }),
  },
  ines_sits: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(SEATS.ines[0], SEATS.ines[1], 0.9) }, time: 'night', set: SET_FIRE,
    cast: recast(NIGHT, { ines: { look: LIGHT, mood: 'frown' } }),
  },
  player_speaks_night: {
    camera: { from: PLAYER_FIRE_STANDING, to: ground(0.6, -3.8, 1.1) }, time: 'night', set: SET_FIRE,
    cast: recast(STANDOFF, {
      ines: { at: INES_TORCH, pose: 'torch', prop: 'torch', look: 'camera' },
      voss: { look: 'camera', mood: 'stern' },
      maren: { look: 'camera' },
      tob: { look: 'camera', gesture: undefined },
    }),
  },
  tob_nods: {
    camera: closeUp(SEATS.tob, SEATS.player, { distance: 1.8, head: 0.85, eye: 1.3 }), time: 'night', set: SET_FIRE,
    cast: recast(STANDOFF, {
      ines: { at: INES_TORCH, pose: 'torch', prop: 'torch' },
      tob: { look: 'camera', gesture: 'nod', mood: 'smile' },
    }),
  },

  // ---- night ----
  fire_dying: { camera: { from: PLAYER_FIRE_EYE, to: ground(-5, -6.5, 0.5), speed: 0.7 }, time: 'night', set: SET_LATE, cast: ASLEEP },
  starfield_overhead: {
    camera: { from: ground(3.2, -2.2, 0.45), to: [3.6, 60, -12], speed: 0.6 }, time: 'night', set: SET_LATE, cast: ASLEEP,
  },
  fade_to_dark: {
    camera: { from: ground(3.2, -2.2, 0.45), to: [3.6, 60, -12], speed: 0.6 }, time: 'night', set: SET_LATE, cast: ASLEEP,
    overlay: 'black', fade: 3,
  },
  black_screen_faint_scrape: {
    camera: { from: ground(3.2, -2.2, 0.45), to: [3.6, 60, -12] }, time: 'night', set: SET_LATE, cast: ASLEEP, overlay: 'black', fade: 0.6,
  },
  black_screen: {
    camera: { from: ground(3.2, -2.2, 0.45), to: [3.6, 60, -12] }, time: 'night', set: SET_LATE, cast: ASLEEP, overlay: 'black', fade: 0.6,
  },
  title_card_end: {
    camera: { from: ground(3.2, -2.2, 0.45), to: [3.6, 60, -12] }, time: 'night', set: SET_LATE, cast: ASLEEP, overlay: 'title', fade: 1.5,
  },
};

const FIRST_CUE = 'black_screen_storm_audio';

// ---------------------------------------------------------------------------
// shared pieces
// ---------------------------------------------------------------------------

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const ease = (dt: number, rate: number) => 1 - Math.exp(-Math.min(dt, 0.1) * rate);

const scratchQuaternion = new THREE.Quaternion();
const scratchVector = new THREE.Vector3();
const scratchEuler = new THREE.Euler();

function Box({ size, position, rotation, color }: { size: Vec3; position?: Vec3; rotation?: Vec3; color: string }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Barrel({ radius, height, color = '#6e4a2f' }: { radius: number; height: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.92, height, 10]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {[0.22, 0.78].map((h) => (
        <mesh key={h} position={[0, height * h, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.95, 0.025, 4, 12]} />
          <meshStandardMaterial color="#2e2a26" flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// camera
// ---------------------------------------------------------------------------

const aimAt = (from: Vec3, to: Vec3) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
};

//eases the camera into the current shot, panning by yaw and pitch so turns swing around rather than through the sky
function CameraRig({ shot }: { shot: Shot }) {
  const view = useRef<{ yaw: number; pitch: number } | null>(null);
  const target = useMemo(() => new THREE.Vector3(...shot.from), [shot]);
  const aim = useMemo(() => aimAt(shot.from, shot.to), [shot]);

  useFrame(({ camera, clock }, dt) => {
    if (!view.current) {
      camera.position.copy(target);
      view.current = { ...aim };
    }
    const t = ease(dt, shot.speed ?? 1.4);
    const v = view.current;
    camera.position.lerp(target, t);
    v.yaw += wrapAngle(aim.yaw - v.yaw) * t;
    v.pitch += (aim.pitch - v.pitch) * t;

    const breath = Math.sin(clock.elapsedTime * 0.6) * 0.006;
    camera.lookAt(
      camera.position.x + Math.sin(v.yaw) * Math.cos(v.pitch),
      camera.position.y + Math.sin(v.pitch + breath),
      camera.position.z + Math.cos(v.yaw) * Math.cos(v.pitch),
    );
  });

  return null;
}

// ---------------------------------------------------------------------------
// sky, sea and light
// ---------------------------------------------------------------------------

const SKY_VERTEX = `
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = `
uniform vec3 horizon;
uniform vec3 zenith;
varying vec3 vDirection;
void main() {
  float h = max(vDirection.y, 0.0);
  gl_FragColor = vec4(mix(horizon, zenith, pow(h, 0.6)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

//sky, sun or moon, stars, fog, daylight and the sea, all easing toward the current time of day
function Atmosphere({ time }: { time: TimeOfDay }) {
  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() } },
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );
  const starGeometry = useMemo(() => {
    const random = seeded(99);
    const positions: number[] = [];
    for (let i = 0; i < 1400; i++) {
      const yaw = random() * Math.PI * 2;
      const pitch = Math.asin(0.05 + random() * 0.95);
      positions.push(Math.cos(pitch) * Math.sin(yaw) * 700, Math.sin(pitch) * 700, Math.cos(pitch) * Math.cos(yaw) * 700);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  const fog = useRef<THREE.Fog>(null);
  const sun = useRef<THREE.Mesh>(null);
  const sunMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const daylight = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const stars = useRef<THREE.Points>(null);
  const starMaterial = useRef<THREE.PointsMaterial>(null);
  const oceanMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const current = useRef<Atmos | null>(null);

  useFrame((_, dt) => {
    const goal = ATMOS[time];
    if (!current.current) current.current = toAtmos(palettes[time]);
    const c = current.current;
    const k = ease(dt, 0.9);
    for (const key of COLOR_KEYS) c[key].lerp(goal[key], k);
    for (const key of NUMBER_KEYS) c[key] += (goal[key] - c[key]) * k;
    c.sun.lerp(goal.sun, k);

    skyMaterial.uniforms.horizon.value.copy(c.horizon);
    skyMaterial.uniforms.zenith.value.copy(c.zenith);
    if (fog.current) {
      fog.current.color.copy(c.fog);
      fog.current.near = c.fogNear;
      fog.current.far = c.fogFar;
    }
    if (sun.current && sunMaterial.current) {
      sun.current.position.copy(c.sun);
      sun.current.scale.setScalar(c.sunSize);
      sun.current.visible = c.sun.y > -5;
      sunMaterial.current.color.copy(c.sunColor);
    }
    if (daylight.current) {
      daylight.current.position.copy(c.sun);
      daylight.current.color.copy(c.light);
      daylight.current.intensity = c.lightIntensity;
    }
    if (hemi.current) {
      hemi.current.color.copy(c.hemiSky);
      hemi.current.groundColor.copy(c.hemiGround);
      hemi.current.intensity = c.hemiIntensity;
    }
    if (stars.current && starMaterial.current) {
      stars.current.visible = c.stars > 0.01;
      starMaterial.current.opacity = c.stars;
    }
    oceanMaterial.current?.color.copy(c.ocean);
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={[palettes[time].fog, palettes[time].fogNear, palettes[time].fogFar]} />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={daylight} />
      <ambientLight intensity={0.15} />
      <mesh material={skyMaterial} renderOrder={-1}>
        <sphereGeometry args={[800, 32, 16]} />
      </mesh>
      <points ref={stars} geometry={starGeometry}>
        <pointsMaterial ref={starMaterial} color="#ffffff" size={1.8} sizeAttenuation={false} transparent depthWrite={false} fog={false} />
      </points>
      <mesh ref={sun}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial ref={sunMaterial} fog={false} />
      </mesh>
      <Ocean materialRef={oceanMaterial} />
    </>
  );
}

function Ocean({ materialRef }: { materialRef: RefObject<THREE.MeshStandardMaterial | null> }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 700, 90, 90);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const rest = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const mesh = useRef<THREE.Mesh>(null); //the waves are written through the mesh, since hook values can't be changed

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    const position = mesh.current.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = rest[i * 3];
      const z = rest[i * 3 + 2];
      position.setY(i, Math.sin(x * 0.15 + t * 0.9) * 0.22 + Math.cos(z * 0.2 + t * 0.7) * 0.18);
    }
    position.needsUpdate = true;
    mesh.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[0, 0, 200]}>
      <meshStandardMaterial ref={materialRef} flatShading roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// land
// ---------------------------------------------------------------------------

function Terrain() {
  const geometry = useMemo(() => {
    const random = seeded(7);
    const indexed = new THREE.PlaneGeometry(320, 170, 200, 110);
    indexed.rotateX(-Math.PI / 2);
    indexed.translate(0, 0, -55);
    const position = indexed.attributes.position;
    for (let i = 0; i < position.count; i++) {
      position.setY(i, terrainHeight(position.getX(i), position.getZ(i)));
    }

    //one flat color per triangle for the faceted look
    const g = indexed.toNonIndexed();
    const flat = g.attributes.position;
    const wetSand = new THREE.Color('#c9b186');
    const drySand = new THREE.Color('#ecd9a8');
    const scrub = new THREE.Color('#7a8f4a');
    const moss = new THREE.Color('#56703f');
    const jungle = new THREE.Color('#3f6a38');
    const rock = new THREE.Color('#5c6553');
    const color = new THREE.Color();
    const colors: number[] = [];
    for (let i = 0; i < flat.count; i += 3) {
      const x = (flat.getX(i) + flat.getX(i + 1) + flat.getX(i + 2)) / 3;
      const y = (flat.getY(i) + flat.getY(i + 1) + flat.getY(i + 2)) / 3;
      const z = (flat.getZ(i) + flat.getZ(i + 1) + flat.getZ(i + 2)) / 3;
      if (z > 4) color.copy(wetSand);
      else if (z > -9) color.copy(drySand);
      else if (z < -15 && Math.abs(x - streamX(z)) < 3.5) color.copy(moss);
      else if (y < 3) color.copy(scrub);
      else if (y < 26) color.copy(jungle);
      else color.copy(rock);
      color.offsetHSL(0, 0, (random() - 0.5) * 0.05);
      for (let v = 0; v < 3; v++) colors.push(color.r, color.g, color.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  );
}

const leafColors = ['#2f5a2c', '#3b6b33', '#47783a', '#2a4f30'];

function Jungle() {
  const trees = useMemo(() => {
    const random = seeded(42);
    const placed: { x: number; y: number; z: number; scale: number; tilt: number; color: string }[] = [];
    const plant = (x: number, z: number) => {
      const y = terrainHeight(x, z);
      if (y > 40 || !isClear(x, z)) return;
      placed.push({ x, y, z, scale: 1 + random() * 1.6, tilt: (random() - 0.5) * 0.2, color: leafColors[Math.floor(random() * leafColors.length)] });
    };
    for (let i = 0; i < 260; i++) plant((random() - 0.5) * 260, -11 - random() * 100);
    //thicker growth around the trail so walking it feels like being in the forest
    for (let i = 0; i < 180; i++) plant(-48 + random() * 46, -12 - random() * 40);
    return placed;
  }, []);

  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!trunks.current || !crowns.current) return;
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    trees.forEach((tree, i) => {
      rotation.setFromEuler(scratchEuler.set(tree.tilt, 0, tree.tilt));
      matrix.compose(position.set(tree.x, tree.y + 1.5 * tree.scale, tree.z), rotation, scale.setScalar(tree.scale));
      trunks.current!.setMatrixAt(i, matrix);
      matrix.compose(
        position.set(tree.x - tree.tilt * 3.6 * tree.scale, tree.y + 3.6 * tree.scale, tree.z + tree.tilt * 3.6 * tree.scale),
        rotation,
        scale.set(tree.scale, tree.scale * 0.8, tree.scale),
      );
      crowns.current!.setMatrixAt(i, matrix);
      crowns.current!.setColorAt(i, color.set(tree.color));
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    crowns.current.instanceMatrix.needsUpdate = true;
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;
  }, [trees]);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.18, 0.28, 3, 5]} />
        <meshStandardMaterial color="#5a4330" flatShading />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, trees.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>
    </>
  );
}

//palms leaning out over the top of the beach
function Palms() {
  const palms = useMemo(() => {
    const random = seeded(3);
    return Array.from({ length: 22 }, () => {
      const x = (random() - 0.5) * 120;
      const z = -8 - random() * 3;
      return { x, z, lean: 0.15 + random() * 0.25, turn: random() * Math.PI * 2 };
    }).filter(({ x }) => Math.abs(x - TRAIL[0][0]) > 3 && (x < SHELTER[0] - 3 || x > SHELTER[0] + 3));
  }, []);

  return (
    <group>
      {palms.map((palm, i) => (
        <group key={i} position={ground(palm.x, palm.z)} rotation={[palm.lean, palm.turn, 0]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 5, 5]} />
            <meshStandardMaterial color="#7a5c3e" flatShading />
          </mesh>
          <mesh position={[0, 5.1, 0]} scale={[1.6, 0.35, 1.6]}>
            <icosahedronGeometry args={[1.4, 0]} />
            <meshStandardMaterial color="#4f8a3a" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Stream() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    let row = 0;
    for (let z = -72; z <= -16; z += 1, row++) {
      const x = streamX(z);
      const y = terrainHeight(x, z) + 0.45;
      positions.push(x - 0.9, y, z, x + 0.9, y, z);
      if (row > 0) {
        const a = (row - 1) * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#5d9fb5" roughness={0.2} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

//a standing stone by the stream with a spiral cut into its face
function CarvedStone() {
  const spiral = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const theta = (i / 80) * Math.PI * 4;
      const r = 0.02 + 0.2 * (theta / (Math.PI * 4));
      points.push(new THREE.Vector3(r * Math.cos(theta), 0.8 + r * Math.sin(theta), 0.305));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 160, 0.016, 5);
  }, []);
  const facing = Math.atan2(-26.7 - STONE[0], -40.1 - STONE[1]);

  return (
    <group position={ground(STONE[0], STONE[1], -0.1)} rotation={[0, facing, 0.06]}>
      <Box size={[1, 1.5, 0.6]} position={[0, 0.75, 0]} color="#7b7f78" />
      <Box size={[1.04, 0.12, 0.64]} position={[0, 1.5, 0]} color="#4f6a3a" />
      <Box size={[0.4, 0.3, 0.62]} position={[0.32, 0.15, 0]} color="#4f6a3a" />
      <mesh geometry={spiral}>
        <meshStandardMaterial color="#3d403c" flatShading />
      </mesh>
    </group>
  );
}

function LightShafts() {
  return (
    <group>
      {[[-9, -15], [-11, -18.5], [-14.5, -21], [-16, -24.5], [-12.5, -16.5]].map(([x, z], i) => (
        <mesh key={i} position={ground(x, z, 9)} rotation={[0.25, i, 0.3]}>
          <boxGeometry args={[0.7 + (i % 2) * 0.4, 20, 0.7]} />
          <meshBasicMaterial color="#fff4d0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// the wreck and the camp
// ---------------------------------------------------------------------------

//the Kestrel, on her side on the reef with her mainmast snapped
function Wreck() {
  const wood = '#5b3a24';
  return (
    <group position={[WRECK_AT[0], 0, WRECK_AT[1]]}>
      <group rotation={[0, 0.6, 0.45]}>
        <Box size={[12, 3, 3.6]} position={[0, 0.6, 0]} color={wood} />
        <Box size={[3, 2, 3.2]} position={[5.6, 1.2, 0]} rotation={[0, 0, 0.35]} color={wood} />
        <Box size={[3, 1.2, 2.6]} position={[-3, 2.6, 0]} color="#6e4a2f" />
        <mesh position={[1, 3.6, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 3, 6]} />
          <meshStandardMaterial color="#4a2f1d" flatShading />
        </mesh>
      </group>
      {/* the snapped half of the mainmast, trailing in the water */}
      <mesh position={[-4, 0.2, -3]} rotation={[0.1, 0.9, Math.PI / 2 - 0.15]}>
        <cylinderGeometry args={[0.2, 0.22, 9, 6]} />
        <meshStandardMaterial color="#4a2f1d" flatShading />
      </mesh>
      {[
        [-6, -0.4, 2, 2.2],
        [4, -0.5, -3, 1.8],
        [8, -0.6, 2, 2.6],
        [-2, -0.6, 4, 1.5],
        [-9, -0.7, -2, 2],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 2, 0]}>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#6b6f6a" flatShading />
        </mesh>
      ))}
    </group>
  );
}

//crates, planks and rope strewn along the tideline
function Debris() {
  const pieces = useMemo(() => {
    const random = seeded(11);
    return Array.from({ length: 22 }, () => {
      const x = (random() - 0.5) * 40;
      const z = 2 + random() * 5;
      const crate = random() < 0.4;
      const size: Vec3 = crate ? [0.8, 0.8, 0.8] : [2 + random() * 2, 0.12, 0.3];
      return { position: ground(x, z, size[1] / 2 - 0.05), size, turn: random() * Math.PI, color: crate ? '#8a6640' : '#6e5235' };
    });
  }, []);

  return (
    <group>
      {pieces.map((piece, i) => (
        <Box key={i} size={piece.size} position={piece.position} rotation={[0, piece.turn, 0]} color={piece.color} />
      ))}
      <mesh position={ground(3, 3.5, 0.06)} rotation={[Math.PI / 2, 0, 0.3]}>
        <torusGeometry args={[0.45, 0.08, 4, 10]} />
        <meshStandardMaterial color="#b49a6a" flatShading />
      </mesh>
    </group>
  );
}

//a lean-to of spars and the torn sail, open toward the sea
function Shelter({ state }: { state: 'frame' | 'built' }) {
  const slope = 0.97; //the angle of the roof from the back edge on the ground up to the ridge
  return (
    <group position={ground(SHELTER[0], SHELTER[1])}>
      {[-1.45, 1.45].map((x) => (
        <mesh key={x} position={[x, 0.85, 1]}>
          <cylinderGeometry args={[0.06, 0.07, 1.7, 5]} />
          <meshStandardMaterial color="#6e5235" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 1.65, 1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 3.2, 5]} />
        <meshStandardMaterial color="#6e5235" flatShading />
      </mesh>
      {[-1.4, 0, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.82, -0.2]} rotation={[slope, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.95, 5]} />
          <meshStandardMaterial color="#7a5c3e" flatShading />
        </mesh>
      ))}
      {state === 'built' && (
        <mesh position={[0, 0.88, -0.17]} rotation={[slope, 0, 0]}>
          <planeGeometry args={[3.3, 2.95, 4, 3]} />
          <meshStandardMaterial color="#efe6d2" side={THREE.DoubleSide} flatShading />
        </mesh>
      )}
    </group>
  );
}

function SignalPile() {
  return (
    <group position={ground(PILE[0], PILE[1])}>
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} rotation={[0, (i / 9) * Math.PI * 2, 0]}>
          <mesh position={[0.38, 0.95, 0]} rotation={[0, 0, 0.38]}>
            <cylinderGeometry args={[0.06, 0.08, 2.1, 5]} />
            <meshStandardMaterial color={i % 2 ? '#8c7356' : '#a08a6c'} flatShading />
          </mesh>
        </group>
      ))}
      {[[0.5, 0.2, 0.3], [-0.4, 0.2, 0.5], [0, 0.25, -0.6], [0, 1.85, 0]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[i === 3 ? 0.35 : 0.45, 0]} />
          <meshStandardMaterial color="#3f6a38" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Fire({ level }: { level: SetDressing['fire'] }) {
  const light = useRef<THREE.PointLight>(null);
  const flames = useRef<THREE.Group>(null);
  const strength = useRef(0);

  useFrame(({ clock }, dt) => {
    const goal = level === 'lit' ? 1 : level === 'low' ? 0.35 : 0;
    strength.current += (goal - strength.current) * ease(dt, 1.5);
    const t = clock.elapsedTime;
    const flicker = 0.85 + 0.1 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3 + 1);
    if (light.current) light.current.intensity = 30 * strength.current * flicker;
    if (flames.current) {
      flames.current.visible = strength.current > 0.02;
      flames.current.scale.set(strength.current, strength.current * flicker, strength.current);
    }
  });

  return (
    <group position={ground(FIRE[0], FIRE[1])}>
      <group visible={level !== 'none'}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.12, 0]} rotation={[Math.PI / 2 - 0.25, 0, (i * Math.PI) / 2]}>
            <cylinderGeometry args={[0.07, 0.08, 1.1, 5]} />
            <meshStandardMaterial color="#4a3423" flatShading />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[Math.cos((i / 9) * Math.PI * 2) * 0.75, 0.06, Math.sin((i / 9) * Math.PI * 2) * 0.75]}>
            <dodecahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#6b6f6a" flatShading />
          </mesh>
        ))}
      </group>
      <group ref={flames} position={[0, 0.2, 0]}>
        {[[0, 0.45, 0, 0.32, 0.9], [0.15, 0.32, 0.08, 0.2, 0.6], [-0.12, 0.3, -0.1, 0.22, 0.55]].map(([x, y, z, r, h], i) => (
          <mesh key={i} position={[x, y, z]}>
            <coneGeometry args={[r, h, 5]} />
            <meshBasicMaterial color={i === 0 ? '#ff9a3c' : '#ffd166'} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 1, 0]} color="#ff9a4d" intensity={0} decay={2} />
    </group>
  );
}

//the salvage on the sail cloth: biscuit, salt pork, cheese, tools, medicine and a cracked spyglass
function Supplies() {
  return (
    <group position={ground(CLOTH[0], CLOTH[1], 0.03)}>
      <mesh rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[2.6, 2]} />
        <meshStandardMaterial color="#e9e0cb" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.8, 0.18, -0.4]} scale={[1, 0.7, 0.9]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#b89b6a" flatShading />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.1 + (i % 3) * 0.18, 0.06, -0.55 + Math.floor(i / 3) * 0.18]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
          <meshStandardMaterial color="#9aa0a6" flatShading />
        </mesh>
      ))}
      <mesh position={[0.75, 0.06, -0.45]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 10]} />
        <meshStandardMaterial color="#e3c15b" flatShading />
      </mesh>
      <Box size={[0.5, 0.04, 0.05]} position={[-0.6, 0.03, 0.35]} rotation={[0, 0.4, 0]} color="#6e5235" />
      <Box size={[0.14, 0.05, 0.12]} position={[-0.38, 0.03, 0.25]} rotation={[0, 0.4, 0]} color="#5c5f63" />
      <mesh position={[0.1, 0.05, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.045, 4, 10]} />
        <meshStandardMaterial color="#b49a6a" flatShading />
      </mesh>
      <Box size={[0.16, 0.08, 0.1]} position={[0.5, 0.04, 0.15]} color="#3a2a1e" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} size={[0.03, 0.02, 0.26]} position={[0.85 + i * 0.07, 0.01, 0.2]} color="#a9adb2" />
      ))}
      <Box size={[0.3, 0.16, 0.22]} position={[0.75, 0.08, 0.6]} color="#f2efe8" />
      <Box size={[0.08, 0.02, 0.18]} position={[0.75, 0.165, 0.6]} color="#b0302a" />
      <Box size={[0.18, 0.02, 0.08]} position={[0.75, 0.165, 0.6]} color="#b0302a" />
      <mesh position={[-0.2, 0.05, 0.7]} rotation={[0, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.05, 0.55, 8]} />
        <meshStandardMaterial color="#b08d3c" metalness={0.5} roughness={0.4} flatShading />
      </mesh>
    </group>
  );
}

//the light on the peak: steady, pulsing three times, or gone
function InlandLight({ mode, cueKey }: { mode: SetDressing['light']; cueKey: string }) {
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const state = useRef({ key: '', start: 0, level: 0 });

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const now = clock.elapsedTime;
    if (s.key !== cueKey) {
      s.key = cueKey;
      s.start = now;
    }
    const t = now - s.start;
    let goal = 0;
    if (mode === 'on') goal = 0.85 + 0.15 * Math.sin(now * 3.1) * Math.sin(now * 1.7);
    if (mode === 'pulse') {
      const pulsing = [0.9, 1.7, 2.5].some((p) => Math.abs(t - p) < 0.22);
      goal = pulsing ? 1.4 : t < 0.7 ? 0.85 : t < 2.8 ? 0.15 : 0;
    }
    s.level += (goal - s.level) * ease(dt, 10);
    if (group.current) group.current.visible = s.level > 0.01;
    if (core.current) core.current.opacity = Math.min(s.level, 1);
    if (halo.current) halo.current.opacity = 0.25 * s.level;
  });

  return (
    <group ref={group} position={LIGHT} visible={false}>
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial ref={core} color="#e6f6ff" transparent fog={false} toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[6, 1]} />
        <meshBasicMaterial ref={halo} color="#9fd8ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// characters
// ---------------------------------------------------------------------------

const INK = '#1e1a18';
const LEG = 1; //hip height when standing, before the character's scale
const WALK_SPEED = 1.8;
const TELEPORT = 25; //further than this and a character jumps rather than walks

function Hair({ look }: { look: Look }) {
  const color = look.hair;
  return (
    <>
      {look.hairStyle === 'mop' ? (
        <>
          <Box size={[0.29, 0.09, 0.29]} position={[0, 0.32, 0]} color={color} />
          <Box size={[0.26, 0.05, 0.04]} position={[0, 0.265, 0.12]} color={color} />
          <Box size={[0.03, 0.14, 0.22]} position={[0.135, 0.22, -0.01]} color={color} />
          <Box size={[0.03, 0.14, 0.22]} position={[-0.135, 0.22, -0.01]} color={color} />
        </>
      ) : (
        <Box size={[0.26, look.hairStyle === 'crop' ? 0.04 : 0.06, 0.27]} position={[0, 0.31, 0]} color={color} />
      )}
      <Box size={[0.26, 0.2, 0.05]} position={[0, 0.2, -0.13]} color={color} />
      {look.hairStyle === 'pony' && <Box size={[0.07, 0.24, 0.07]} position={[0, 0.15, -0.19]} rotation={[0.35, 0, 0]} color={color} />}
      {look.hairStyle === 'bun' && (
        <mesh position={[0, 0.28, -0.16]}>
          <icosahedronGeometry args={[0.085, 0]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      )}
      {look.beard && <Box size={[0.25, 0.11, 0.06]} position={[0, 0.07, 0.11]} color={look.beard} />}
      {look.bandage && (
        <>
          <Box size={[0.255, 0.045, 0.265]} position={[0, 0.27, 0]} color="#efeae0" />
          <Box size={[0.05, 0.035, 0.01]} position={[0.05, 0.27, 0.134]} color="#a8322b" />
        </>
      )}
    </>
  );
}

const BROWS: Partial<Record<Mood, number>> = { angry: 0.35, stern: 0.18, frown: 0.1, worried: -0.3 };

function Face({ mood, bearded }: { mood: Mood; bearded: boolean }) {
  const z = 0.126;
  const mouthZ = bearded ? 0.142 : z;
  const eyeHeight = mood === 'surprised' ? 0.055 : mood === 'asleep' ? 0.012 : 0.04;
  const brow = BROWS[mood] ?? 0;
  const browY = mood === 'surprised' ? 0.255 : 0.235;

  let mouth;
  if (mood === 'smile' || mood === 'grin') {
    const r = mood === 'grin' ? 0.055 : 0.04;
    mouth = (
      <mesh position={[0, 0.06 + r, mouthZ]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[r, 0.009, 3, 10, Math.PI]} />
        <meshStandardMaterial color={INK} />
      </mesh>
    );
  } else if (mood === 'frown' || mood === 'angry' || mood === 'worried') {
    mouth = (
      <mesh position={[0, 0.07, mouthZ]}>
        <torusGeometry args={[mood === 'worried' ? 0.028 : 0.035, 0.009, 3, 10, Math.PI]} />
        <meshStandardMaterial color={INK} />
      </mesh>
    );
  } else if (mood === 'surprised') {
    mouth = (
      <mesh position={[0, 0.085, mouthZ]}>
        <torusGeometry args={[0.022, 0.008, 4, 10]} />
        <meshStandardMaterial color={INK} />
      </mesh>
    );
  } else {
    mouth = <Box size={[0.08, 0.014, 0.01]} position={[0, 0.09, mouthZ]} color={INK} />;
  }

  return (
    <>
      <Box size={[0.04, eyeHeight, 0.01]} position={[0.055, 0.18, z]} color={INK} />
      <Box size={[0.04, eyeHeight, 0.01]} position={[-0.055, 0.18, z]} color={INK} />
      <Box size={[0.07, 0.018, 0.01]} position={[0.055, browY, z]} rotation={[0, 0, brow]} color={INK} />
      <Box size={[0.07, 0.018, 0.01]} position={[-0.055, browY, z]} rotation={[0, 0, -brow]} color={INK} />
      {mouth}
    </>
  );
}

function Torch() {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = 0.85 + 0.1 * Math.sin(t * 17) + 0.07 * Math.sin(t * 9.1 + 2);
    if (light.current) light.current.intensity = 8 * flicker;
    flame.current?.scale.set(1, flicker, 1);
  });
  return (
    <group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.7, 5]} />
        <meshStandardMaterial color="#5a4330" flatShading />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.12, 6]} />
        <meshStandardMaterial color="#3a2a1e" flatShading />
      </mesh>
      <mesh ref={flame} position={[0, 0.72, 0]}>
        <coneGeometry args={[0.07, 0.24, 5]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.8, 0]} color="#ffa55a" distance={16} decay={1.5} />
    </group>
  );
}

interface CharacterState {
  visible: boolean;
  x: number;
  z: number;
  yaw: number;
  phase: number; //walk cycle
  rolled: number; //how far a carried cask has rolled
  cueKey: string;
  cueStart: number;
  joints: Joints;
}

const FRUIT: Vec3[] = [[0, 0, 0], [0.12, 0.02, 0.03], [-0.12, 0.01, 0.02], [0.05, 0.11, 0], [-0.06, 0.1, 0.04]];

function Character({ who, placement, cueKey }: { who: Who; placement?: Placement; cueKey: string }) {
  const look = looks[who];
  const w = look.build;
  const root = useRef<THREE.Group>(null);
  const pelvis = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const elbowL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const elbowR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const kneeL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const kneeR = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Group>(null);
  const upright = useRef<THREE.Group>(null);
  const cask = useRef<THREE.Group>(null);
  const state = useRef<CharacterState>({
    visible: false, x: 0, z: 0, yaw: 0, phase: 0, rolled: 0, cueKey: '', cueStart: 0, joints: { ...REST },
  });

  useFrame(({ camera, clock }, rawDt) => {
    const r = root.current;
    if (!r) return;
    const s = state.current;
    if (!placement) {
      s.visible = false;
      r.visible = false;
      return;
    }
    const dt = Math.min(rawDt, 0.1);
    const now = clock.elapsedTime;
    if (s.cueKey !== cueKey) {
      s.cueKey = cueKey;
      s.cueStart = now;
    }

    //arrive: someone new to the scene, or too far away to walk, appears at their entrance or their mark
    const [tx, tz] = placement.at;
    const appearing = !s.visible;
    if (appearing || Math.hypot(tx - s.x, tz - s.z) > TELEPORT) {
      [s.x, s.z] = placement.enter ?? placement.at;
    }
    s.visible = true;
    r.visible = true;

    //walk toward the mark, then turn to face
    const dx = tx - s.x;
    const dz = tz - s.z;
    const distance = Math.hypot(dx, dz);
    const moving = distance > 0.04;
    let yaw: number;
    if (moving) {
      const step = Math.min(distance, WALK_SPEED * dt);
      s.x += (dx / distance) * step;
      s.z += (dz / distance) * step;
      s.phase += step * 4.5;
      s.rolled += step / 0.3;
      yaw = Math.atan2(dx, dz);
    } else {
      const face = placement.face ?? 'camera';
      const [fx, fz] = face === 'camera' ? [camera.position.x, camera.position.z] : face;
      yaw = Math.atan2(fx - s.x, fz - s.z);
    }
    s.yaw = appearing ? yaw : s.yaw + wrapAngle(yaw - s.yaw) * ease(dt, 6);

    //the pose to settle into, with gestures, walking and gaze layered on top
    const chosen = placement.pose ?? 'stand';
    const pose = moving && !MOBILE_POSES.has(chosen) ? 'stand' : chosen;
    const target: Joints = { ...REST, ...poses[pose] };
    if (!moving && placement.gesture) {
      const extra = gestures[placement.gesture](now - s.cueStart) as Partial<Joints>;
      for (const key of Object.keys(extra) as (keyof Joints)[]) target[key] += extra[key] ?? 0;
    }
    if (moving) {
      const swing = Math.sin(s.phase);
      target.legLX += 0.55 * swing;
      target.legRX -= 0.55 * swing;
      target.kneeL += 0.7 * Math.max(0, swing);
      target.kneeR += 0.7 * Math.max(0, -swing);
      target.rise += 0.03 * Math.abs(Math.cos(s.phase));
      if (!BUSY_ARM_POSES.has(pose)) {
        target.armLX -= 0.4 * swing;
        target.armRX += 0.4 * swing;
      }
    }
    const ground = terrainHeight(s.x, s.z);
    if (placement.look && pose !== 'lie') {
      const [lx, ly, lz] = placement.look === 'camera' ? camera.position.toArray() : placement.look;
      const hy = ground + (LEG - target.drop + 0.8) * look.scale;
      target.headY += clamp(wrapAngle(Math.atan2(lx - s.x, lz - s.z) - s.yaw), -1.1, 1.1);
      target.headX += clamp(-Math.atan2(ly - hy, Math.hypot(lx - s.x, lz - s.z)), -0.6, 0.6);
    }

    const j = s.joints;
    const k = appearing ? 1 : ease(dt, moving ? 14 : 7);
    for (const key of JOINT_KEYS) j[key] += (target[key] - j[key]) * k;

    r.position.set(s.x, ground + j.rise * look.scale, s.z);
    r.rotation.set(0, s.yaw, j.roll);
    pelvis.current?.position.setY(LEG - j.drop);
    torso.current?.rotation.set(j.lean, 0, 0);
    torso.current?.scale.setY(1 + 0.012 * Math.sin(now * 1.7));
    head.current?.rotation.set(j.headX, j.headY, j.headZ);
    armL.current?.rotation.set(j.armLX, 0, j.armLZ);
    elbowL.current?.rotation.set(j.elbowL, 0, 0);
    armR.current?.rotation.set(j.armRX, 0, -j.armRZ);
    elbowR.current?.rotation.set(j.elbowR, 0, 0);
    legL.current?.rotation.set(j.legLX, 0, 0);
    kneeL.current?.rotation.set(j.kneeL, 0, 0);
    legR.current?.rotation.set(j.legRX, 0, 0);
    kneeR.current?.rotation.set(j.kneeR, 0, 0);
    cask.current?.rotation.set(s.rolled, 0, 0);

    //cups, torches and water skins stay upright whatever the arm is doing
    if (hand.current && upright.current) {
      hand.current.getWorldQuaternion(scratchQuaternion);
      upright.current.quaternion.copy(scratchQuaternion.invert());
    }
  });

  const mood = placement?.mood ?? 'neutral';
  const prop = placement?.prop;
  const shoulderX = 0.21 * w + 0.055;

  return (
    <group ref={root} scale={look.scale} visible={false}>
      <group ref={pelvis} position={[0, LEG, 0]}>
        <Box size={[0.38 * w, 0.16, 0.23 * w]} color={look.pants} />
        <group ref={torso} position={[0, 0.04, 0]}>
          <Box size={[0.42 * w, 0.64, 0.24 * w]} position={[0, 0.33, 0]} color={look.coat} />
          {look.coat !== look.shirt && <Box size={[0.13 * w, 0.52, 0.01]} position={[0, 0.36, 0.12 * w + 0.006]} color={look.shirt} />}
          {look.apron && <Box size={[0.36 * w, 0.5, 0.02]} position={[0, 0.2, 0.12 * w + 0.012]} color={look.apron} />}
          {look.satchel && (
            <>
              <Box size={[0.05, 0.75, 0.02]} position={[0, 0.34, 0.12 * w + 0.014]} rotation={[0, 0, 0.75]} color={look.satchel} />
              <Box size={[0.1, 0.22, 0.26]} position={[-(0.21 * w + 0.05), 0.02, 0.02]} color={look.satchel} />
            </>
          )}
          <group ref={head} position={[0, 0.66, 0]}>
            <Box size={[0.08, 0.06, 0.08]} position={[0, 0.01, 0]} color={look.skin} />
            <Box size={[0.24, 0.27, 0.25]} position={[0, 0.16, 0]} color={look.skin} />
            <Hair look={look} />
            <Face mood={mood} bearded={!!look.beard} />
          </group>
          <group ref={armL} position={[shoulderX, 0.58, 0]}>
            <Box size={[0.1 * w, 0.3, 0.11 * w]} position={[0, -0.15, 0]} color={look.coat} />
            <group ref={elbowL} position={[0, -0.3, 0]}>
              <Box size={[0.09 * w, 0.27, 0.1 * w]} position={[0, -0.135, 0]} color={look.coat} />
              <Box size={[0.08, 0.09, 0.09]} position={[0, -0.31, 0]} color={look.skin} />
            </group>
          </group>
          <group ref={armR} position={[-shoulderX, 0.58, 0]}>
            <Box size={[0.1 * w, 0.3, 0.11 * w]} position={[0, -0.15, 0]} color={look.coat} />
            <group ref={elbowR} position={[0, -0.3, 0]}>
              <Box size={[0.09 * w, 0.27, 0.1 * w]} position={[0, -0.135, 0]} color={look.coat} />
              <Box size={[0.08, 0.09, 0.09]} position={[0, -0.31, 0]} color={look.skin} />
              <group ref={hand} position={[0, -0.34, 0]}>
                <group ref={upright}>
                  {prop === 'cup' && (
                    <mesh position={[0, 0.04, 0]}>
                      <cylinderGeometry args={[0.045, 0.04, 0.1, 8]} />
                      <meshStandardMaterial color="#9a9fa5" metalness={0.4} flatShading />
                    </mesh>
                  )}
                  {prop === 'torch' && <Torch />}
                  {prop === 'skin' && (
                    <mesh position={[0, -0.14, 0]} scale={[1, 1.3, 0.7]}>
                      <icosahedronGeometry args={[0.12, 0]} />
                      <meshStandardMaterial color="#6b4a2b" flatShading />
                    </mesh>
                  )}
                </group>
                {prop === 'mallet' && (
                  <>
                    <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.02, 0.02, 0.35, 5]} />
                      <meshStandardMaterial color="#6e5235" flatShading />
                    </mesh>
                    <Box size={[0.18, 0.09, 0.09]} position={[0, 0, 0.32]} color="#4a3423" />
                  </>
                )}
              </group>
            </group>
          </group>
        </group>
        <group ref={legL} position={[0.1 * w, -0.03, 0]}>
          <Box size={[0.15 * w, 0.45, 0.16 * w]} position={[0, -0.225, 0]} color={look.pants} />
          <group ref={kneeL} position={[0, -0.45, 0]}>
            <Box size={[0.13 * w, 0.44, 0.14 * w]} position={[0, -0.22, 0]} color={look.pants} />
            <Box size={[0.13, 0.07, 0.25]} position={[0, -0.47, 0.05]} color={look.shoes} />
          </group>
        </group>
        <group ref={legR} position={[-0.1 * w, -0.03, 0]}>
          <Box size={[0.15 * w, 0.45, 0.16 * w]} position={[0, -0.225, 0]} color={look.pants} />
          <group ref={kneeR} position={[0, -0.45, 0]}>
            <Box size={[0.13 * w, 0.44, 0.14 * w]} position={[0, -0.22, 0]} color={look.pants} />
            <Box size={[0.13, 0.07, 0.25]} position={[0, -0.47, 0.05]} color={look.shoes} />
          </group>
        </group>
      </group>

      {/* things carried in front of the body */}
      {prop === 'fruit' && (
        <group position={[0, 1.1, 0.36]}>
          {FRUIT.map((p, i) => (
            <mesh key={i} position={p}>
              <icosahedronGeometry args={[0.08, 0]} />
              <meshStandardMaterial color="#f08a24" flatShading />
            </mesh>
          ))}
        </group>
      )}
      {prop === 'plank' && <Box size={[1.6, 0.06, 0.18]} position={[0, 1.12, 0.4]} color="#8a6a45" />}
      {prop === 'crate' && <Box size={[0.7, 0.6, 0.7]} position={[0, 0.3, 0.85]} color="#8a6640" />}
      {prop === 'cask' && (
        <group position={[0, 0.3, 0.75]}>
          <group ref={cask}>
            <group rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
              <group position={[0, -0.28, 0]}>
                <Barrel radius={0.3} height={0.56} />
              </group>
            </group>
          </group>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// the player's own hand
// ---------------------------------------------------------------------------

//positions and rotations in camera space: x right, y up, -z forward
const handPoses: Record<HandPose, { position: Vec3; rotation: Vec3 }> = {
  none: { position: [0.3, -0.9, -0.5], rotation: [0, 0, 0] },
  cover: { position: [0.02, -0.2, -0.5], rotation: [0, 0, 0] },
  push: { position: [0.1, -0.1, -0.5], rotation: [1.35, 0, -0.15] },
  reach: { position: [0.02, -0.18, -0.7], rotation: [0.15, 0.3, 0] },
  work: { position: [0.1, -0.3, -0.45], rotation: [0.5, 0, 0] },
  torch: { position: [0.26, -0.28, -0.55], rotation: [0.15, 0, -0.1] },
};

function FirstPersonHand({ pose }: { pose: HandPose }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  const state = useRef({ position: new THREE.Vector3(...handPoses.none.position), rotation: new THREE.Quaternion() });

  useFrame(({ camera, clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const s = state.current;
    const goal = handPoses[pose];
    const k = ease(dt, 6);
    const t = clock.elapsedTime;
    scratchVector.set(...goal.position);
    if (pose === 'work') scratchVector.y += 0.03 * Math.sin(t * 6);
    s.position.lerp(scratchVector, k);
    s.rotation.slerp(scratchQuaternion.setFromEuler(scratchEuler.set(...goal.rotation)), k);
    g.position.copy(s.position).applyQuaternion(camera.quaternion).add(camera.position);
    g.quaternion.copy(camera.quaternion).multiply(s.rotation);

    const flicker = 0.85 + 0.1 * Math.sin(t * 15) + 0.07 * Math.sin(t * 8.3 + 1);
    if (light.current) light.current.intensity = pose === 'torch' ? 10 * flicker : 0;
    flame.current?.scale.set(1, flicker, 1);
  });

  return (
    <group ref={group}>
      <Box size={[0.085, 0.03, 0.12]} color="#d9a988" />
      <Box size={[0.1, 0.1, 0.45]} position={[0.01, 0, 0.27]} color="#6b5a48" />
      <group visible={pose === 'cover'}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#9a9fa5" metalness={0.4} flatShading />
        </mesh>
      </group>
      <group visible={pose === 'torch'}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.022, 0.026, 0.6, 5]} />
          <meshStandardMaterial color="#5a4330" flatShading />
        </mesh>
        <mesh ref={flame} position={[0, 0.6, 0]}>
          <coneGeometry args={[0.06, 0.2, 5]} />
          <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 0.65, 0]} color="#ffa55a" distance={18} decay={1.6} intensity={0} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

//looping background beds, crossfaded by how loud each should be for the current cue
const BEDS = {
  storm: new URL('./sounds/storm.m4a', import.meta.url).href,
  surf: new URL('./sounds/surf.m4a', import.meta.url).href,
  jungleDay: new URL('./sounds/jungle_day.m4a', import.meta.url).href,
  jungleNight: new URL('./sounds/jungle_night.m4a', import.meta.url).href,
  stream: new URL('./sounds/stream.m4a', import.meta.url).href,
  campfire: new URL('./sounds/campfire.m4a', import.meta.url).href,
};

type Bed = keyof typeof BEDS;
type Mix = Record<Bed, number>;

//sounds played once when their cue starts
const ONE_SHOTS: Record<string, OneShot> = {
  bell_sound_hold: { src: new URL('./sounds/bell.m4a', import.meta.url).href, volume: 0.6, delay: 0.3 },
  black_screen_faint_scrape: { src: new URL('./sounds/crate_scrape.m4a', import.meta.url).href, volume: 0.5, delay: 0.9 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

//works out the background mix from where the camera is and what is happening in the scene
const mixFor = (cue: Cue): Mix => {
  const mix: Mix = { storm: 0, surf: 0, jungleDay: 0, jungleNight: 0, stream: 0, campfire: 0 };
  if (cue.overlay === 'storm') return { ...mix, storm: 1 };
  if (cue.overlay === 'title') return mix;

  const [x, , z] = cue.camera.from;
  const depth = Math.max(0, -10 - z); //how far into the jungle the camera is
  const night = cue.time === 'night' || cue.time === 'dusk';
  mix.surf = 0.75 * Math.max(0, 1 - depth / 25);
  if (night) mix.jungleNight = (depth > 0 ? 0.8 : 0.45) * (cue.time === 'dusk' ? 0.6 : 1);
  else mix.jungleDay = depth > 0 ? 0.7 : 0.25;

  const streamZ = Math.min(z, -16);
  mix.stream = 0.9 * Math.max(0, 1 - Math.hypot(x - streamX(streamZ), z - streamZ) / 14);
  const fire = cue.set.fire === 'lit' ? 0.7 : cue.set.fire === 'low' ? 0.35 : 0;
  mix.campfire = fire * Math.max(0, 1 - Math.hypot(x - FIRE[0], z - FIRE[1]) / 16);

  //black screens drop everything to a whisper
  if (cue.overlay === 'black') for (const bed of Object.keys(mix) as Bed[]) mix[bed] *= 0.12;
  return mix;
};

function useSoundscape(cue: Cue, cueKey: string, oneShots: Record<string, OneShot>) {
  const soundscape = useRef<Soundscape<Bed> | null>(null);

  useEffect(() => {
    const created = createSoundscape(BEDS, { volume: MASTER_VOLUME, crossfade: CROSSFADE });
    soundscape.current = created;
    return () => {
      created.dispose();
      soundscape.current = null;
    };
  }, []);

  useEffect(() => {
    soundscape.current?.mix(mixFor(cue));
  }, [cue]);

  useEffect(() => {
    const shot = oneShots[cueKey];
    if (shot) soundscape.current?.play(shot);
  }, [cueKey, oneShots]);
}

// ---------------------------------------------------------------------------
// the scene
// ---------------------------------------------------------------------------

interface IslandProps {
  animation: string;
  cues: Record<string, Cue>; //every animation name in the scene's script, mapped to its cue
  firstCue: string;
  oneShots: Record<string, OneShot>; //sounds played once when their cue starts
  title: [kicker: string, name: string]; //shown by the 'title' overlay
  children?: ReactNode; //anything else the scene adds to the island
}

//the island and crew, played through a scene's cues. Every Expedition scene renders one
export function Island({ animation, cues, firstCue, oneShots, title, children }: IslandProps) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : firstCue);
  const [lastAnimation, setLastAnimation] = useState(animation);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) setActive(animation);
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`${title[1]} has no cue for the animation "${animation}"`);
  }, [animation, cues, title]);

  const cue = cues[active];
  const overlay = cue.overlay ?? 'none';
  useSoundscape(cue, active, oneShots);

  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Canvas camera={{ fov: 55, near: 0.1, far: 1200, position: cue.camera.from }} dpr={[1, 2]}>
        <CameraRig shot={cue.camera} />
        <Atmosphere time={cue.time} />
        <Terrain />
        <Jungle />
        <Palms />
        <Stream />
        <CarvedStone />
        {cue.set.shafts && <LightShafts />}
        <Wreck />
        <Debris />
        {cue.set.shelter !== 'none' && <Shelter state={cue.set.shelter} />}
        {cue.set.pile && <SignalPile />}
        {cue.set.waterCasks &&
          CASKS.map(([x, z]) => (
            <group key={x} position={ground(x, z)}>
              <Barrel radius={0.35} height={0.8} />
            </group>
          ))}
        {cue.set.rum && (
          <group position={ground(RUM[0], RUM[1])}>
            <Barrel radius={0.28} height={0.55} color="#7d4e2c" />
          </group>
        )}
        {cue.set.supplies && <Supplies />}
        <Fire level={cue.set.fire} />
        <InlandLight mode={cue.set.light} cueKey={active} />
        {CREW.map((who) => (
          <Character key={who} who={who} placement={cue.cast[who]} cueKey={active} />
        ))}
        <FirstPersonHand pose={cue.hand ?? 'none'} />
        {children}
      </Canvas>

      <div style={{ ...styles.overlay, opacity: overlay === 'none' ? 0 : 1, transition: `opacity ${cue.fade ?? 1}s ease` }}>
        {overlay === 'storm' && <div style={styles.lightning} />}
        {overlay === 'title' && (
          <div style={styles.title}>
            <div style={styles.titleKicker}>{title[0]}</div>
            <div style={styles.titleName}>{title[1]}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes landfall-lightning {
  0%, 60% { opacity: 0; }
  61% { opacity: 0.45; }
  62% { opacity: 0; }
  64% { opacity: 0.8; }
  67% { opacity: 0; }
  100% { opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: '#000',
    pointerEvents: 'none',
  },
  lightning: {
    position: 'absolute',
    inset: 0,
    background: '#dfe8ff',
    animation: 'landfall-lightning 4.5s linear infinite',
  },
  title: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
    color: '#efe6d2',
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  titleKicker: {
    fontSize: 18,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  titleName: {
    fontSize: 64,
    letterSpacing: 2,
  },
};

const TITLE: IslandProps['title'] = ['Expedition I', 'Landfall'];

function Landfall({ animation }: { animation: string }) {
  return <Island animation={animation} cues={cues} firstCue={FIRST_CUE} oneShots={ONE_SHOTS} title={TITLE} />;
}

export default Landfall;
