// The island the Expedition scenes play out on: where everything is, how the crew can stand and move,
// and the shape of a Cue. Shared by every Expedition scene, which each write their own cues against it.

export type Vec3 = [number, number, number];
export type Spot = [number, number]; //an x, z position on the ground

export const streamX = (z: number) => -32 + Math.sin(z * 0.15) * 3;

//ground height: a sand beach sloping into the sea for z > -10, jungle hills climbing behind it, cut by a stream gully
export const terrainHeight = (x: number, z: number) => {
  const noise = Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15 + Math.sin(x * 0.07 + z * 0.11) * 0.4;
  if (z > -10) return 0.6 - z * 0.08 + noise * 0.3;
  const d = -10 - z;
  const peak = 22 * Math.exp(-((x - 15) ** 2 + (z + 85) ** 2) / 900);
  const gully = 2.2 * Math.exp(-((x - streamX(z)) ** 2) / 30) * Math.min(Math.max((d - 4) / 6, 0), 1);
  return 1.4 + Math.pow(d, 1.1) * 0.25 + noise * (0.3 + d * 0.08) + peak - gully;
};

export const ground = (x: number, z: number, lift = 0): Vec3 => [x, terrainHeight(x, z) + lift, z];

export const WRECK_AT: Spot = [10, 45];
export const SHELTER: Spot = [-9, -7];
export const CASKS: Spot[] = [[-7, -5.2], [-6.3, -4.7]];
export const CLOTH: Spot = [-1.8, -5.8];
export const FIRE: Spot = [1.4, -3.6];
export const RUM: Spot = [2.9, -5.2];
export const PILE: Spot = [18, 0.5];
export const TRAIL: Spot[] = [[-4, -9.5], [-8, -14], [-13, -20], [-19, -27], [-24, -34]];
export const BANK: Spot = [-27.5, -38.5];
export const STONE: Spot = [-28.4, -41.2];
export const PEAK: Spot = [15, -85];

export const WRECK: Vec3 = [WRECK_AT[0], 1.5, WRECK_AT[1]];
export const LIGHT: Vec3 = ground(PEAK[0], PEAK[1], 4);

export type TimeOfDay = 'dawn' | 'morning' | 'day' | 'afternoon' | 'evening' | 'sunset' | 'dusk' | 'night';

export type Who = 'voss' | 'ines' | 'maren' | 'tob';
export const CREW: Who[] = ['voss', 'ines', 'maren', 'tob'];

//joint angles in radians, plus how far the hips drop (sitting, kneeling) and the whole body rises or rolls (lying down)
export interface Joints {
  drop: number;
  lean: number;
  rise: number;
  roll: number;
  headX: number; //positive looks down
  headY: number; //positive turns toward the character's left
  headZ: number;
  armLX: number; //negative swings the arm forward
  armLZ: number; //positive raises the arm out to the side
  elbowL: number; //negative bends the forearm forward
  armRX: number;
  armRZ: number;
  elbowR: number;
  legLX: number; //negative swings the leg forward
  kneeL: number; //positive bends the knee
  legRX: number;
  kneeR: number;
}

export const REST: Joints = {
  drop: 0, lean: 0, rise: 0, roll: 0, headX: 0, headY: 0, headZ: 0,
  armLX: 0, armLZ: 0, elbowL: 0, armRX: 0, armRZ: 0, elbowR: 0, legLX: 0, kneeL: 0, legRX: 0, kneeR: 0,
};
export const JOINT_KEYS = Object.keys(REST) as (keyof Joints)[];

const SIT: Partial<Joints> = {
  drop: 0.8, lean: -0.05, legLX: -1.85, legRX: -1.85, kneeL: 1.0, kneeR: 1.0,
  armLX: -0.55, armRX: -0.55, armLZ: 0.1, armRZ: 0.1, elbowL: -0.5, elbowR: -0.5,
};
const KNEEL: Partial<Joints> = {
  drop: 0.47, lean: 0.25, kneeL: 1.55, kneeR: 1.55, armLX: -0.8, armRX: -0.8, elbowL: -0.6, elbowR: -0.6,
};
const CROUCH: Partial<Joints> = {
  drop: 0.5, lean: 0.45, legLX: -1.3, legRX: -1.3, kneeL: 2.3, kneeR: 2.3,
  armLX: -1.0, armRX: -1.0, elbowL: -0.5, elbowR: -0.5, headX: -0.2,
};

export const poses = {
  stand: { armLZ: 0.07, armRZ: 0.07 },
  foldArms: { armLX: -0.55, armRX: -0.55, armLZ: -0.3, armRZ: -0.3, elbowL: -1.75, elbowR: -1.75 },
  point: { armLZ: 0.07, armRX: -1.5, armRZ: 0.05 },
  pointUp: { armLZ: 0.07, armRX: -2.1, armRZ: 0.05, headX: -0.35 },
  glare: { lean: 0.12, headX: 0.12, armLZ: 0.22, armRZ: 0.22, elbowL: -0.35, elbowR: -0.35 },
  sit: SIT,
  sitCup: { ...SIT, armRX: -0.9, elbowR: -1.3 },
  hugKnees: {
    drop: 0.8, lean: 0.35, legLX: -2.35, legRX: -2.35, kneeL: 2.0, kneeR: 2.0,
    armLX: -1.0, armRX: -1.0, armLZ: -0.1, armRZ: -0.1, elbowL: -1.0, elbowR: -1.0, headX: 0.3,
  },
  kneel: KNEEL,
  crouch: CROUCH,
  haul: {
    lean: -0.25, drop: 0.08, legLX: -0.35, legRX: 0.1, kneeL: 0.45, kneeR: 0.2,
    armLX: -1.25, armRX: -1.25, elbowL: -0.2, elbowR: -0.2,
  },
  carry: { armLX: -0.7, armRX: -0.7, elbowL: -1.3, elbowR: -1.3, armLZ: 0.1, armRZ: 0.1 },
  roll: {
    lean: 0.55, drop: 0.1, legLX: -0.3, legRX: -0.3, kneeL: 0.4, kneeR: 0.4,
    armLX: -0.9, armRX: -0.9, elbowL: -0.1, elbowR: -0.1, headX: -0.4,
  },
  listen: { armLZ: 0.07, armRX: -2.5, armRZ: 0.25, elbowR: -0.5, headZ: 0.15 },
  raiseCup: { armLZ: 0.07, armRX: -2.75, armRZ: 0.12, elbowR: -0.2 },
  offer: { lean: 0.1, armLZ: 0.07, armRX: -1.35, elbowR: -0.15 },
  shrug: { armLX: -0.35, armRX: -0.35, armLZ: 0.4, armRZ: 0.4, elbowL: -1.3, elbowR: -1.3, headZ: 0.18 },
  tap: { lean: 0.15, armLZ: 0.07, armRX: -0.9, elbowR: -0.5 },
  stack: {
    lean: 0.8, drop: 0.12, legLX: -0.6, legRX: -0.6, kneeL: 0.7, kneeR: 0.7,
    armLX: -0.6, armRX: -0.6, elbowL: -0.3, elbowR: -0.3, headX: -0.4,
  },
  torch: { armLZ: 0.07, armRX: -1.9, armRZ: 0.12, elbowR: -0.6 },
  reach: { ...CROUCH, lean: 0.55, armRX: -1.75, elbowR: 0 },
  lie: {
    roll: Math.PI / 2, rise: 0.2, legLX: -0.8, legRX: -0.7, kneeL: 1.3, kneeR: 1.2,
    armLX: -1.1, armRX: -0.9, elbowL: -1.2, elbowR: -1.0, headX: 0.15,
  },
  wring: { armLX: -0.9, armRX: -0.9, armLZ: -0.2, armRZ: -0.2, elbowL: -1.0, elbowR: -1.0, headX: 0.4 },
  hammer: { ...KNEEL, armRX: -1.6, elbowR: -0.5 },
} satisfies Record<string, Partial<Joints>>;

export type Pose = keyof typeof poses;

export const MOBILE_POSES = new Set<Pose>(['stand', 'carry', 'roll', 'torch']); //poses a character keeps while walking
export const BUSY_ARM_POSES = new Set<Pose>(['carry', 'roll', 'torch']); //poses whose arms don't swing while walking

//small motions layered over a pose, given seconds since the cue started
export const gestures = {
  nod: (t: number) => ({ headX: t < 2 ? 0.2 * Math.sin(t * 7) * (1 - t / 2) + 0.05 : 0 }),
  count: (t: number) => ({ elbowR: -0.35 * Math.max(0, Math.sin(t * 5)), headX: 0.25 }),
  hammer: (t: number) => ({ armRX: -0.7 * (0.5 + 0.5 * Math.sin(t * 7)) }),
  work: (t: number) => ({ elbowL: 0.35 * Math.sin(t * 5), elbowR: 0.35 * Math.sin(t * 5 + Math.PI), headX: 0.3 }),
  tap: (t: number) => ({ elbowR: -0.3 * Math.max(0, Math.sin(t * 6)) }),
  haul: (t: number) => ({ lean: 0.12 * Math.sin(t * 2.4), drop: 0.05 * Math.sin(t * 2.4) }),
  shiver: (t: number) => ({ headZ: 0.03 * Math.sin(t * 31), lean: 0.02 * Math.sin(t * 23) }),
  cough: (t: number) => ({ lean: 0.35 * Math.pow(Math.max(0, Math.sin(t * 2.6)), 12) }),
  wring: (t: number) => ({ elbowL: 0.3 * Math.sin(t * 4), elbowR: -0.3 * Math.sin(t * 4) }),
  trace: (t: number) => ({ armRX: 0.12 * Math.sin(t * 1.8), elbowR: 0.12 * Math.cos(t * 1.8) }),
  lookAround: (t: number) => ({ headY: 0.6 * Math.sin(t * 0.9) }),
} satisfies Record<string, (t: number) => Partial<Joints>>;

export type Gesture = keyof typeof gestures;
export type Mood = 'neutral' | 'stern' | 'smile' | 'grin' | 'frown' | 'angry' | 'worried' | 'surprised' | 'asleep';
export type Prop = 'cup' | 'torch' | 'skin' | 'mallet' | 'fruit' | 'plank' | 'crate' | 'cask';

export interface Placement {
  at: Spot; //where they stand; they walk here from wherever they were
  face?: Spot | 'camera'; //what their body turns toward once they arrive, the camera by default
  look?: Vec3 | 'camera'; //what their head turns toward
  enter?: Spot; //where they appear from when they weren't already in the scene
  pose?: Pose;
  gesture?: Gesture;
  mood?: Mood;
  prop?: Prop;
}

export type Cast = Partial<Record<Who, Placement>>;

//copies a cast with some placements changed; null takes a character out of the scene
export const recast = (cast: Cast, changes: Partial<Record<Who, Partial<Placement> | null>>): Cast => {
  const next: Cast = { ...cast };
  for (const who of Object.keys(changes) as Who[]) {
    const change = changes[who];
    if (change === null) delete next[who];
    else if (change) next[who] = { ...(next[who] ?? { at: [0, 0] }), ...change };
  }
  return next;
};

export interface Shot {
  from: Vec3; //where the camera sits
  to: Vec3; //what the camera points at
  speed?: number; //how quickly the camera eases into the shot, higher is faster
}

export interface SetDressing {
  shelter: 'none' | 'frame' | 'built';
  pile: boolean; //the signal pile on the headland
  fire: 'none' | 'laid' | 'lit' | 'low';
  supplies: boolean; //the salvage laid out on the sail cloth
  waterCasks: boolean;
  rum: boolean;
  light: 'off' | 'on' | 'pulse'; //the light on the peak
  shafts: boolean; //sunlight through the canopy
}

export type Overlay = 'none' | 'black' | 'storm' | 'title';
export type HandPose = 'none' | 'cover' | 'push' | 'reach' | 'work' | 'torch';

export interface Cue {
  camera: Shot;
  time: TimeOfDay;
  set: SetDressing;
  cast: Cast;
  overlay?: Overlay;
  fade?: number; //seconds for the overlay to fade in or out
  hand?: HandPose; //the player's own hand, seen first person
}

//a camera placed `distance` from a character toward `from`, at eye height, looking at their head
export const closeUp = (
  target: Spot,
  from: Spot,
  { distance = 2.2, head = 1.65, eye = head, speed = 1.6 }: { distance?: number; head?: number; eye?: number; speed?: number } = {},
): Shot => {
  const dx = from[0] - target[0];
  const dz = from[1] - target[1];
  const length = Math.hypot(dx, dz) || 1;
  const x = target[0] + (dx / length) * distance;
  const z = target[1] + (dz / length) * distance;
  return { from: ground(x, z, eye), to: ground(target[0], target[1], head), speed };
};

export const SET_BARE: SetDressing = {
  shelter: 'none', pile: false, fire: 'none', supplies: false, waterCasks: false, rum: false, light: 'off', shafts: false,
};
export const SET_SALVAGE: SetDressing = { ...SET_BARE, waterCasks: true };
export const SET_FRAME: SetDressing = { ...SET_SALVAGE, shelter: 'frame' };
export const SET_CAMP: SetDressing = { ...SET_SALVAGE, shelter: 'built', pile: true };
export const SET_SUPPER: SetDressing = { ...SET_CAMP, supplies: true, fire: 'laid' };
export const SET_FEAST: SetDressing = { ...SET_SUPPER, rum: true };
export const SET_FIRE: SetDressing = { ...SET_FEAST, fire: 'lit' };
export const SET_LATE: SetDressing = { ...SET_FIRE, fire: 'low' };

export const ORIGIN: Spot = [0, 0];
export const LYING: Vec3 = [0, 0.85, 0];
export const STANDING: Vec3 = [0, 2.3, 0];

export const SEATS: Record<Who | 'player', Spot> = {
  player: [3, -2],
  voss: [1.4, -5.8],
  ines: [-0.7, -3.9],
  maren: [3.4, -4.6],
  tob: [-0.2, -1.9],
};

export interface OneShot {
  src: string;
  volume: number;
  delay?: number; //seconds after the cue starts
}
