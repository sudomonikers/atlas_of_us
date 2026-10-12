import { Island } from '../landfall/landfall';
import {
  CLOTH, FIRE, SEATS, SET_FEAST, SET_FIRE, SET_LATE, SHELTER, TRAIL, closeUp, ground, recast,
  type Cast, type Cue, type OneShot, type Shot, type Spot, type Vec3,
} from '../landfall/world';

// The Thief plays on Landfall's island the next day. The camp is built and the stores are out on the sail cloth.
// New here is a pile of rocks at the west end of the beach, where Tob hid what he took.

const ROCKS: Spot = [-16, 0.5];

function Rocks() {
  return (
    <group position={ground(ROCKS[0], ROCKS[1])}>
      {[[0, 0.4, 0, 1.1], [1.3, 0.2, 0.3, 0.7], [-1.1, 0.25, 0.6, 0.8], [0.3, 0.6, -0.9, 0.9]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 2, 0]}>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#6b6f6a" flatShading />
        </mesh>
      ))}
      {/* the stash, a bundle of sailcloth wedged between the stones */}
      <mesh position={[0.75, 0.15, 0.95]} scale={[1.3, 0.6, 1]}>
        <icosahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#efe6d2" flatShading />
      </mesh>
    </group>
  );
}

// ---- morning at camp ----
const PLAYER_CAMP: Spot = [2.2, 0.4];
const CAMP_EYE = ground(PLAYER_CAMP[0], PLAYER_CAMP[1], 1.7);
const VOSS_CAMP: Spot = [0, -2.4];
const INES_CAMP: Spot = [3.4, -2.6];
const MAREN_CLOTH: Spot = [-1.4, -4.5];
const TOB_APART: Spot = [-5.2, -2.2];

const DAWN: Cast = {
  maren: { at: MAREN_CLOTH, face: CLOTH, pose: 'kneel', mood: 'frown' },
  voss: { at: [-8, -7.6], face: [-8, 0], pose: 'lie', mood: 'asleep' },
  tob: { at: [-5.6, -5.8], face: [-5.6, 0], pose: 'lie', mood: 'asleep' },
  ines: { at: [-0.2, -4.6], face: [-0.2, 0], pose: 'lie', mood: 'asleep' },
};
const WAKING = recast(DAWN, {
  voss: { pose: 'sit', face: CLOTH, mood: 'surprised' },
  tob: { pose: 'hugKnees', face: CLOTH, mood: 'worried' },
  ines: { pose: 'sit', face: CLOTH, mood: 'surprised' },
  maren: { mood: 'angry' },
});
const LINED_UP: Cast = {
  voss: { at: VOSS_CAMP, pose: 'foldArms', mood: 'stern' },
  ines: { at: INES_CAMP, pose: 'foldArms', mood: 'frown' },
  maren: { at: MAREN_CLOTH, face: CLOTH, pose: 'kneel' },
  tob: { at: TOB_APART, face: [-5, 6], pose: 'hugKnees', mood: 'worried' },
};
const FACING_PLAYER = recast(LINED_UP, {
  voss: { look: 'camera' },
  ines: { look: 'camera' },
  maren: { look: 'camera' },
  tob: { look: 'camera' },
});
const IN_A_CIRCLE: Cast = {
  voss: { at: SEATS.voss, face: FIRE, pose: 'sit', mood: 'stern' },
  ines: { at: SEATS.ines, face: FIRE, pose: 'sit', mood: 'frown' },
  maren: { at: SEATS.maren, face: FIRE, pose: 'sit' },
  tob: { at: SEATS.tob, face: FIRE, pose: 'hugKnees', mood: 'worried' },
};

// ---- the rocks ----
const PLAYER_ROCKS: Spot = [-12, 2.6];
const ROCKS_EYE = ground(PLAYER_ROCKS[0], PLAYER_ROCKS[1], 1.7);
const TOB_ROCKS: Spot = [-15, 1.9];
const VOSS_ROCKS: Spot = [-14.3, -0.9];
const INES_ROCKS: Spot = [-12.6, -1.3];
const MAREN_ROCKS: Spot = [-16.2, -0.6];
const MAREN_HEAD: Vec3 = ground(MAREN_ROCKS[0], MAREN_ROCKS[1], 1.35);
const ALL_ROCKS: Shot = { from: ROCKS_EYE, to: ground(-14.4, -0.2, 1.2) };

const AT_ROCKS: Cast = {
  tob: { at: TOB_ROCKS, face: ROCKS, pose: 'kneel', mood: 'worried' },
  voss: { at: VOSS_ROCKS, face: TOB_ROCKS, pose: 'foldArms', mood: 'angry' },
  ines: { at: INES_ROCKS, face: TOB_ROCKS, mood: 'frown' },
  maren: { at: MAREN_ROCKS, face: TOB_ROCKS, mood: 'worried' },
};
const ROCKS_FACING_PLAYER = recast(AT_ROCKS, {
  voss: { face: 'camera', look: 'camera' },
  ines: { face: 'camera', look: 'camera' },
  maren: { face: 'camera', look: 'camera' },
  tob: { look: 'camera' },
});

// ---- supper ----
const PLAYER_FIRE_EYE = ground(SEATS.player[0], SEATS.player[1], 1.1);
const TOB_EDGE: Spot = [-2.6, -0.8];
const SUPPER: Cast = {
  voss: { at: SEATS.voss, face: FIRE, pose: 'sit', mood: 'stern' },
  ines: { at: SEATS.ines, face: FIRE, pose: 'sit' },
  maren: { at: SEATS.maren, face: FIRE, pose: 'sit' },
  tob: { at: TOB_EDGE, face: FIRE, pose: 'hugKnees', mood: 'worried' },
};
const LATE: Cast = { ...DAWN, maren: { at: MAREN_CLOTH, face: CLOTH, pose: 'kneel', gesture: 'count' } };

const cues: Record<string, Cue> = {
  // ---- the missing food ----
  title_card_start: {
    camera: { from: ground(6, 2, 3), to: ground(-3, -5, 0.8) }, time: 'dawn', set: SET_FEAST, cast: DAWN, overlay: 'title', fade: 1.5,
  },
  dawn_camp_wide: { camera: { from: ground(6, 2, 3), to: ground(-3, -5, 0.8), speed: 0.6 }, time: 'dawn', set: SET_FEAST, cast: DAWN, fade: 2 },
  maren_at_supplies: {
    camera: closeUp(MAREN_CLOTH, PLAYER_CAMP, { distance: 2, head: 1.15, eye: 1.3 }), time: 'dawn', set: SET_FEAST,
    cast: recast(WAKING, { maren: { look: 'camera' } }),
  },
  supplies_gaps: { camera: { from: ground(-0.6, -3.8, 1.4), to: ground(CLOTH[0], CLOTH[1], 0.1) }, time: 'dawn', set: SET_FEAST, cast: WAKING },
  maren_counts_dawn: {
    camera: closeUp(MAREN_CLOTH, PLAYER_CAMP, { distance: 2, head: 1.15, eye: 1.3 }), time: 'dawn', set: SET_FEAST,
    cast: recast(WAKING, { maren: { gesture: 'count' } }),
  },
  remember_scrape: {
    camera: { from: ground(-0.6, -3.8, 1.4), to: ground(CLOTH[0], CLOTH[1], 0.1) }, time: 'dawn', set: SET_FEAST, cast: WAKING,
    overlay: 'black', fade: 0.6,
  },

  // ---- who's in charge ----
  voss_paces: {
    camera: { from: CAMP_EYE, to: ground(1, -2.2, 1.5) }, time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { voss: { at: [1, -2.2], pose: 'glare', mood: 'angry', gesture: 'lookAround' } }),
  },
  crew_lined_up: { camera: { from: CAMP_EYE, to: ground(0.6, -2.8, 1.2) }, time: 'morning', set: SET_FEAST, cast: LINED_UP },
  voss_turns_to_player: {
    camera: closeUp(VOSS_CAMP, PLAYER_CAMP, { distance: 2.2, head: 1.72 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { voss: { pose: 'stand', look: 'camera' } }),
  },
  voss_glares_dawn: {
    camera: closeUp(VOSS_CAMP, PLAYER_CAMP, { distance: 2, head: 1.72 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { voss: { pose: 'glare', mood: 'angry', look: 'camera' } }),
  },
  ines_looks_to_player: {
    camera: closeUp(INES_CAMP, PLAYER_CAMP, { distance: 2.1, head: 1.55 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { ines: { pose: 'stand', mood: 'neutral', look: 'camera' } }),
  },
  circle_on_sand: { camera: { from: PLAYER_FIRE_EYE, to: ground(0.6, -3.6, 0.7), speed: 0.8 }, time: 'morning', set: SET_FEAST, cast: IN_A_CIRCLE },

  // ---- suspicion ----
  voss_points_ines: {
    camera: { from: CAMP_EYE, to: ground(1.7, -2.5, 1.5) }, time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, {
      voss: { pose: 'point', face: INES_CAMP, look: ground(INES_CAMP[0], INES_CAMP[1], 1.55), mood: 'angry' },
      ines: { pose: 'stand', face: VOSS_CAMP, mood: 'surprised' },
    }),
  },
  ines_points_voss: {
    camera: closeUp(INES_CAMP, PLAYER_CAMP, { distance: 2.2, head: 1.55 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { ines: { pose: 'point', face: VOSS_CAMP, mood: 'angry' }, voss: { face: INES_CAMP, mood: 'angry' } }),
  },
  maren_folds_cloth: {
    camera: closeUp(MAREN_CLOTH, PLAYER_CAMP, { distance: 2, head: 1.15, eye: 1.3 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { maren: { gesture: 'work', mood: 'worried' } }),
  },
  tob_apart: {
    camera: closeUp(TOB_APART, PLAYER_CAMP, { distance: 2.2, head: 0.85, eye: 1.3 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { tob: { gesture: 'shiver' } }),
  },
  voss_points_player: {
    camera: closeUp(VOSS_CAMP, PLAYER_CAMP, { distance: 2.2, head: 1.72 }), time: 'morning', set: SET_FEAST,
    cast: recast(LINED_UP, { voss: { pose: 'point', face: 'camera', look: 'camera', mood: 'angry' } }),
  },
  faces_turn_to_player: { camera: { from: CAMP_EYE, to: ground(0.6, -2.8, 1.2), speed: 0.8 }, time: 'morning', set: SET_FEAST, cast: FACING_PLAYER },
  player_speaks_dawn: { camera: { from: CAMP_EYE, to: ground(0.6, -2.8, 1.35) }, time: 'morning', set: SET_FEAST, cast: FACING_PLAYER },

  // ---- the search ----
  search_bedrolls: {
    camera: { from: ground(-4, -2.5, 1.8), to: ground(-8.5, -6.5, 0.6) }, time: 'morning', set: SET_FEAST,
    cast: {
      voss: { at: [-7.6, -5.8], face: SHELTER, pose: 'crouch', gesture: 'work', mood: 'stern' },
      ines: { at: [-5.6, -4], face: [-7.6, -5.8], pose: 'foldArms', mood: 'frown' },
      maren: { at: [-6.8, -3.6], face: [-7.6, -5.8], mood: 'worried' },
      tob: { at: [-4.6, -5.2], face: [-7.6, -5.8], pose: 'hugKnees', mood: 'worried' },
    },
  },
  crumbs_in_blanket: {
    camera: { from: ground(-5.8, -4.2, 1.5), to: ground(-7.6, -5.8, 0.6) }, time: 'morning', set: SET_FEAST,
    cast: {
      voss: { at: [-7.6, -5.8], face: [-4.6, -5.2], pose: 'kneel', mood: 'angry', look: ground(-4.6, -5.2, 1) },
      ines: { at: [-5.6, -4], face: [-4.6, -5.2], mood: 'surprised' },
      maren: { at: [-6.8, -3.6], face: [-4.6, -5.2], mood: 'worried' },
      tob: { at: [-4.6, -5.2], face: [-7.6, -5.8], pose: 'hugKnees', mood: 'worried' },
    },
  },
  tob_walks_to_rocks: {
    camera: { from: ground(-6, -1.5, 1.8), to: ground(ROCKS[0], ROCKS[1], 1), speed: 0.8 }, time: 'day', set: SET_FEAST,
    cast: {
      tob: { at: TOB_ROCKS, face: ROCKS, pose: 'kneel', mood: 'worried' },
      voss: { at: [-11, -0.8], face: ROCKS, mood: 'stern' },
      ines: { at: [-10, 0.4], face: ROCKS },
      maren: { at: [-10.4, -1.8], face: ROCKS, mood: 'worried' },
    },
  },
  camp_chores: {
    camera: { from: ground(2, 0, 1.9), to: ground(-6, -4.5, 1.2) }, time: 'day', set: SET_FEAST,
    cast: {
      voss: { at: [-5, -2.8], face: SHELTER, pose: 'carry', prop: 'plank', mood: 'stern' },
      maren: { at: [-7.4, -4.2], face: SHELTER, pose: 'kneel', gesture: 'work' },
      ines: { at: [-3, -6], face: [0, 0], pose: 'haul', gesture: 'haul', prop: 'crate', mood: 'frown' },
    },
  },
  tob_at_rocks: {
    camera: { from: ground(-12.5, 2.2, 1.6), to: ground(-15.4, 1.2, 0.5) }, time: 'day', set: SET_FEAST,
    cast: { tob: { at: TOB_ROCKS, face: ROCKS, pose: 'crouch', mood: 'surprised', look: 'camera' } },
  },
  tob_comes_to_player: {
    camera: { from: ground(-4.4, -3, 1.65), to: ground(-5.6, -4.4, 1.2) }, time: 'day', set: SET_FEAST,
    cast: { tob: { at: [-5.6, -4.4], enter: TOB_APART, mood: 'worried', gesture: 'shiver' } },
  },

  // ---- Tob, and Maren ----
  stash_revealed: {
    camera: { from: ground(-13.4, 2.6, 1.5), to: ground(-15.2, 1.4, 0.2) }, time: 'day', set: SET_FEAST, cast: AT_ROCKS,
  },
  tob_confesses: {
    camera: closeUp(TOB_ROCKS, PLAYER_ROCKS, { distance: 1.9, head: 1.05, eye: 1.3 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { tob: { look: 'camera' } }),
  },
  maren_admits: {
    camera: closeUp(MAREN_ROCKS, PLAYER_ROCKS, { distance: 2.4, head: 1.35, eye: 1.6 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { maren: { face: 'camera', look: 'camera' } }),
  },
  voss_rounds_on_maren: {
    camera: { from: ROCKS_EYE, to: ground(-15.2, -0.8, 1.5) }, time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, {
      voss: { face: MAREN_ROCKS, look: MAREN_HEAD, pose: 'point', mood: 'angry' },
      maren: { face: VOSS_ROCKS, mood: 'frown' },
    }),
  },
  tob_close_up: {
    camera: closeUp(TOB_ROCKS, PLAYER_ROCKS, { distance: 1.6, head: 1.05, eye: 1.2 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { tob: { gesture: 'shiver', look: 'camera' } }),
  },
  voss_at_rocks: {
    camera: closeUp(VOSS_ROCKS, PLAYER_ROCKS, { distance: 2.2, head: 1.72 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { voss: { face: 'camera', look: 'camera', mood: 'stern' } }),
  },
  voss_nods_rocks: {
    camera: closeUp(VOSS_ROCKS, PLAYER_ROCKS, { distance: 2.2, head: 1.72 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { voss: { face: 'camera', look: 'camera', gesture: 'nod', mood: 'stern' } }),
  },
  ines_at_rocks: {
    camera: closeUp(INES_ROCKS, PLAYER_ROCKS, { distance: 2, head: 1.55 }), time: 'day', set: SET_FEAST,
    cast: recast(AT_ROCKS, { ines: { face: VOSS_ROCKS, pose: 'point', mood: 'angry' } }),
  },
  faces_at_rocks: { camera: ALL_ROCKS, time: 'day', set: SET_FEAST, cast: ROCKS_FACING_PLAYER },
  player_speaks_rocks: { camera: { ...ALL_ROCKS, to: ground(-14.4, -0.2, 1.35) }, time: 'day', set: SET_FEAST, cast: ROCKS_FACING_PLAYER },
  tob_walks_away: {
    camera: { from: ROCKS_EYE, to: ground(-26, 3.5, 1), speed: 0.6 }, time: 'afternoon', set: SET_FEAST,
    cast: recast(AT_ROCKS, { tob: { at: [-26, 3.5], face: [-40, 4], pose: 'stand', mood: 'worried' } }),
  },
  maren_close_up: {
    camera: closeUp(MAREN_ROCKS, PLAYER_ROCKS, { distance: 2, head: 1.35, eye: 1.6 }), time: 'afternoon', set: SET_FEAST,
    cast: recast(AT_ROCKS, { maren: { face: 'camera', look: 'camera', mood: 'neutral' } }),
  },
  maren_hurt: {
    camera: closeUp(MAREN_ROCKS, PLAYER_ROCKS, { distance: 2, head: 1.35, eye: 1.6 }), time: 'afternoon', set: SET_FEAST,
    cast: recast(AT_ROCKS, { maren: { face: 'camera', pose: 'foldArms', mood: 'frown' } }),
  },
  maren_by_casks: {
    camera: { from: ground(-4.2, -3.6, 1.1), to: ground(-5.6, -5.4, 0.9) }, time: 'evening', set: SET_FEAST,
    cast: { maren: { at: [-5.6, -5.4], face: [-3, -2], pose: 'sit', look: 'camera', mood: 'worried' } },
  },

  // ---- supper and rules ----
  supper_handed_out: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(2.4, -3, 1.3) }, time: 'dusk', set: SET_FIRE,
    cast: recast(SUPPER, { maren: { at: [2.4, -3], face: 'camera', look: 'camera', pose: 'offer' } }),
  },
  tob_by_fire: { camera: { from: PLAYER_FIRE_EYE, to: ground(TOB_EDGE[0], TOB_EDGE[1], 0.8) }, time: 'dusk', set: SET_FIRE, cast: SUPPER },
  player_portion: { camera: { from: PLAYER_FIRE_EYE, to: ground(-0.6, -2, 0.7), speed: 0.8 }, time: 'dusk', set: SET_FIRE, cast: SUPPER },
  player_offers_tob: {
    camera: { from: ground(-1.4, -0.4, 1.3), to: ground(TOB_EDGE[0], TOB_EDGE[1], 0.8) }, time: 'dusk', set: SET_FIRE, hand: 'reach',
    cast: recast(SUPPER, { tob: { look: 'camera', mood: 'surprised' } }),
  },
  fire_glow: { camera: { from: ground(3.2, -1.8, 1.1), to: ground(1.2, -4, 0.7), speed: 0.8 }, time: 'dusk', set: SET_FIRE, cast: SUPPER },
  player_offers_maren: {
    camera: { from: PLAYER_FIRE_EYE, to: ground(SEATS.maren[0], SEATS.maren[1], 0.9) }, time: 'dusk', set: SET_FIRE, hand: 'reach',
    cast: recast(SUPPER, { maren: { look: 'camera', gesture: 'nod' } }),
  },
  voss_by_fire: {
    camera: closeUp(SEATS.voss, SEATS.player, { distance: 2.4, head: 1.0, eye: 1.1 }), time: 'night', set: SET_FIRE,
    cast: recast(SUPPER, { voss: { look: 'camera' } }),
  },
  ines_by_fire: {
    camera: closeUp(SEATS.ines, SEATS.player, { distance: 2, head: 1.0, eye: 1.1 }), time: 'night', set: SET_FIRE,
    cast: recast(SUPPER, { ines: { look: 'camera', mood: 'stern' } }),
  },
  fire_circle: { camera: { from: ground(7.5, 1.5, 3.2), to: ground(1.2, -4, 0.8), speed: 0.8 }, time: 'night', set: SET_FIRE, cast: SUPPER },

  // ---- the count ----
  maren_counts_night: {
    camera: { from: ground(-0.4, -3.6, 1.15), to: ground(CLOTH[0], CLOTH[1], 0.2) }, time: 'night', set: SET_LATE, cast: LATE,
  },
  maren_looks_up_night: {
    camera: closeUp(MAREN_CLOTH, [0, -2], { distance: 2, head: 1.15, eye: 1.1 }), time: 'night', set: SET_LATE,
    cast: recast(LATE, { maren: { gesture: undefined, look: 'camera', mood: 'worried' } }),
  },
  treeline_night: {
    camera: { from: ground(-0.4, -3.6, 1.4), to: ground(TRAIL[1][0], TRAIL[1][1], 2.5), speed: 0.6 }, time: 'night', set: SET_LATE,
    cast: recast(LATE, { maren: { gesture: undefined, look: ground(TRAIL[1][0], TRAIL[1][1], 2), mood: 'surprised' } }),
  },
  title_card_end: {
    camera: { from: ground(-0.4, -3.6, 1.4), to: ground(TRAIL[1][0], TRAIL[1][1], 2.5) }, time: 'night', set: SET_LATE, cast: LATE,
    overlay: 'title', fade: 1.5,
  },
};

const ONE_SHOTS: Record<string, OneShot> = {
  remember_scrape: { src: new URL('../landfall/sounds/crate_scrape.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 },
};

const TITLE: [string, string] = ['Expedition II', 'The Thief'];

function Thief({ animation }: { animation: string }) {
  return (
    <Island animation={animation} cues={cues} firstCue="title_card_start" oneShots={ONE_SHOTS} title={TITLE}>
      <Rocks />
    </Island>
  );
}

export default Thief;
