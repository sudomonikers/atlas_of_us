import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Black Clay's art style: a toon-shaded clay diorama of a potter's yard in San Bartolo Coyotepec. Pink adobe,
// a cobalt door, papel picado over the yard and purple hills all round. Everything is matte except the finished
// barro negro, which is the only thing in the world that shines.
//
// One world, built in metres. The house is along the back (-z) with the workbench under a ramada to its left, the
// shelves to its right, the pit kiln out in the yard, and the gate at the front (+z). The church is off past the
// back wall. The light moves through the day: each cue says what time it is.

type Vec3 = [number, number, number];
type Time = 'day' | 'dusk' | 'night' | 'dawn';
type Kiln = 'empty' | 'loaded' | 'fire' | 'sealed' | 'open';
type Mat = 'none' | 'shards' | 'swept';

interface Cue {
  at: Vec3; //camera position
  look: Vec3; //what the camera looks at
  time: Time;
  fov?: number;
  shelf?: number; //grey pots drying on the shelves
  kiln?: Kiln; //empty by default
  mat?: Mat; //the fired pieces laid out in the yard
  chabela?: 'bench' | 'yard';
  beto?: boolean;
  crates?: boolean;
  spin?: boolean; //the pot on the saucers is turning
  burnish?: boolean; //the quartz stone is working the jar
  card?: [string, string];
}

// ---------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------

const EARTH = '#c9a47c';
const ADOBE = '#d98e73';
const ADOBE_DARK = '#b8705a';
const LIME = '#efe2c4'; //whitewash
const COBALT = '#2f5fa8';
const TEAL = '#2a9d8f';
const MARIGOLD = '#f2a531';
const THATCH = '#b8955a';
const WOOD = '#7a5236';
const CLAY = '#a19a91';
const STONE = '#8d8275';
const LEAF = '#5e7d3a';
const AGAVE = '#7a9a86';
const CARD = '#f4e6cc';

const BENCH: Vec3 = [-5, 0.82, -4.3]; //top of the workbench
const SAUCERS: Vec3 = [BENCH[0] - 0.45, BENCH[1], BENCH[2]];
const JAR: Vec3 = [BENCH[0] + 0.4, BENCH[1], BENCH[2]]; //the jar being burnished
const KILN: Vec3 = [4, 0, 2];
const MAT: Vec3 = [-0.6, 0.01, 4];
const GATE: Vec3 = [0, 0, 9];
const CHURCH: Vec3 = [-38, 0, -70];
const SPOTS: Record<'bench' | 'yard', [Vec3, number]> = { bench: [[-3.5, 0, -3.3], -0.9], yard: [[-2.6, 0, 5.4], 0.43] };

const COURTYARD = { at: [0, 4.5, 13] as Vec3, look: [0, 0.5, -3] as Vec3 };
const AT_BENCH = { at: [-3.2, 1.7, -1.6] as Vec3, look: [-5, 0.85, -4.4] as Vec3 };
const KILN_VIEW = { at: [7.4, 2.4, 6.4] as Vec3, look: [4, 0.3, 2] as Vec3 };
const ON_MAT = { at: [0.2, 2.7, 7.4] as Vec3, look: [0, 0, 4] as Vec3 };

const cues: Record<string, Cue> = {
  title_card: { at: [26, 16, 34], look: [0, 0, -4], time: 'dawn', shelf: 11, card: ['The Black Clay', 'Coyotepec'] },
  village: { at: [-4, 5, 20], look: CHURCH, time: 'day', shelf: 11 },
  courtyard: { ...COURTYARD, time: 'day', shelf: 11 },
  workbench: { ...AT_BENCH, time: 'day', shelf: 11 },
  chabela: { at: [-1.6, 1.6, -0.8], look: [-3.5, 1.2, -3.3], time: 'day', shelf: 11, chabela: 'bench' },
  phone: { at: [2.5, 1.7, 5.5], look: [-3, 1, -4], time: 'day', shelf: 11, chabela: 'bench' },
  shelves: { at: [3.4, 1.5, -3.8], look: [5, 1, -7.2], time: 'day', shelf: 11 },
  shaping: { at: [-4.75, 1.35, -3.3], look: [SAUCERS[0], 0.95, SAUCERS[2]], time: 'day', shelf: 18, spin: true },
  burnish_night: { ...AT_BENCH, time: 'night', shelf: 24, chabela: 'bench', burnish: true },
  burnish_close: { at: [-4.3, 1.2, -3.7], look: [JAR[0], 1.1, JAR[2]], fov: 38, time: 'night', shelf: 24, burnish: true },
  beto: { at: [-1.2, 1.7, -0.2], look: [GATE[0] + 0.8, 1.4, GATE[2] - 1.6], time: 'day', shelf: 30, beto: true },
  beto_chabela: { at: [3.6, 1.7, 1.2], look: [-0.2, 1.3, 6], time: 'day', shelf: 30, beto: true, chabela: 'yard' },
  kiln_load: { ...KILN_VIEW, time: 'day', kiln: 'loaded' },
  kiln_fire: { at: [8, 2, 7], look: [4, 0.9, 2], time: 'dusk', kiln: 'fire' },
  kiln_sealed: { ...KILN_VIEW, time: 'night', kiln: 'sealed' },
  kiln_wait: { at: [-6, 2.6, 10], look: [3, 2, -1], time: 'night', kiln: 'sealed' },
  kiln_open: { ...KILN_VIEW, time: 'dawn', kiln: 'open' },
  shards: { ...ON_MAT, time: 'day', mat: 'shards' },
  phone_shards: { at: [-3.4, 1.7, 7.6], look: [0.4, 0.3, 3.8], time: 'day', mat: 'shards' },
  crates: { at: [2.8, 2, 8.6], look: [0.2, 0.4, 6.4], time: 'day', mat: 'swept', crates: true },
  dusk: { at: [-1.4, 1.5, 8], look: [-0.8, 0.8, 4.8], time: 'dusk', mat: 'swept', chabela: 'yard' },
  closing: { at: [-8, 8, 24], look: CHURCH, time: 'dusk', mat: 'swept' },
  the_end: { at: [24, 22, 46], look: [0, 0, -6], time: 'night', mat: 'swept', card: ['The Black Clay', 'Fin'] },
};

const FIRST_CUE = 'title_card';

//cuts through black when the camera has too far to glide
const isCut = (a: Cue, b: Cue) => new THREE.Vector3(...a.at).distanceTo(new THREE.Vector3(...b.at)) > 14;

//small deterministic random so the yard looks the same on every visit
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ease = (dt: number, rate: number) => 1 - Math.exp(-Math.min(dt, 0.1) * rate);

// ---------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------

//three hard bands of light, the flat painted-clay look
const GRADIENT = new THREE.DataTexture(new Uint8Array([90, 175, 255]), 3, 1, THREE.RedFormat);
GRADIENT.minFilter = GRADIENT.magFilter = THREE.NearestFilter;
GRADIENT.needsUpdate = true;

const toons = new Map<string, THREE.MeshToonMaterial>();
const toon = (color: string) => {
  if (!toons.has(color)) toons.set(color, new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT, side: THREE.DoubleSide }));
  return toons.get(color)!;
};

const RAW = toon(CLAY);
const LEATHER = new THREE.MeshPhongMaterial({ color: '#7a736c', specular: '#4a4a4a', shininess: 30, side: THREE.DoubleSide });
const BLACK = new THREE.MeshPhongMaterial({ color: '#141417', specular: '#a6a6ba', shininess: 90, side: THREE.DoubleSide });
const BULB = new THREE.MeshBasicMaterial({ color: '#ffd58a' });

function softTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// ---------------------------------------------------------------------------
// light and sky
// ---------------------------------------------------------------------------

const TIMES: Record<Time, { top: string; horizon: string; sun: string; sunPower: number; sunFrom: Vec3; ambient: string; ambientPower: number }> = {
  day: { top: '#6fa8d6', horizon: '#e6d3b3', sun: '#fff1d6', sunPower: 2.4, sunFrom: [8, 14, 6], ambient: '#c3b2d1', ambientPower: 1 },
  dusk: { top: '#4b4f8f', horizon: '#f0956a', sun: '#ff9a5a', sunPower: 1.5, sunFrom: [-14, 4, 6], ambient: '#8a6890', ambientPower: 0.75 },
  night: { top: '#070a1c', horizon: '#1d2547', sun: '#8fa8ff', sunPower: 0.3, sunFrom: [5, 14, -6], ambient: '#3a4470', ambientPower: 0.45 },
  dawn: { top: '#7f8fc2', horizon: '#f2c6ae', sun: '#ffd2b0', sunPower: 1.3, sunFrom: [14, 4, 4], ambient: '#a495b8', ambientPower: 0.8 },
};

const SKY_VERTEX = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = `
uniform vec3 top;
uniform vec3 horizon;
varying vec3 vDir;
void main() {
  gl_FragColor = vec4(mix(horizon, top, pow(clamp(vDir.y, 0.0, 1.0), 0.6)), 1.0);
  #include <colorspace_fragment>
}
`;

//eases the sky, fog, sun and ambient light toward the cue's time of day, and shows the stars at night
function Light({ time }: { time: Time }) {
  const sky = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
    [],
  );
  const stars = useMemo(() => {
    const random = seeded(3);
    const positions: number[] = [];
    for (let i = 0; i < 1500; i++) {
      const p = new THREE.Vector3(random() - 0.5, random() * 0.9 + 0.05, random() - 0.5).normalize().multiplyScalar(800);
      positions.push(p.x, p.y, p.z);
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  }, []);

  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.HemisphereLight>(null);
  const starMaterial = useRef<THREE.PointsMaterial>(null);
  const fog = useRef<THREE.Fog>(null);
  const from = useRef(new THREE.Vector3());
  const started = useRef(false);

  useFrame((_, dt) => {
    //the first frame lands on the cue's time, after that it eases
    const k = started.current ? ease(dt, 1.4) : 1;
    started.current = true;
    const to = TIMES[time];
    sky.uniforms.top.value.lerp(new THREE.Color(to.top), k);
    sky.uniforms.horizon.value.lerp(new THREE.Color(to.horizon), k);
    fog.current!.color.copy(sky.uniforms.horizon.value);
    sun.current!.color.lerp(new THREE.Color(to.sun), k);
    sun.current!.intensity += (to.sunPower - sun.current!.intensity) * k;
    sun.current!.position.copy(from.current.lerp(new THREE.Vector3(...to.sunFrom), k));
    ambient.current!.color.lerp(new THREE.Color(to.ambient), k);
    ambient.current!.intensity += (to.ambientPower - ambient.current!.intensity) * k;
    starMaterial.current!.opacity += ((time === 'night' ? 0.9 : 0) - starMaterial.current!.opacity) * k;
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={['#000', 60, 420]} />
      <mesh material={sky} renderOrder={-10}>
        <sphereGeometry args={[900, 32, 16]} />
      </mesh>
      <points geometry={stars} renderOrder={-9}>
        <pointsMaterial ref={starMaterial} color="#fff6e0" size={1.6} sizeAttenuation={false} transparent opacity={0} fog={false} depthWrite={false} />
      </points>
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <hemisphereLight ref={ambient} groundColor="#7a5a44" />
    </>
  );
}

//glides toward each cue, cuts on a long move, and sways a little as if held by hand
function CameraRig({ cue }: { cue: Cue }) {
  const shown = useRef<Cue | null>(null);
  const look = useRef(new THREE.Vector3());
  const at = useMemo(() => new THREE.Vector3(...cue.at), [cue]);
  const target = useMemo(() => new THREE.Vector3(...cue.look), [cue]);

  useFrame(({ camera, clock }, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!shown.current || (shown.current !== cue && isCut(shown.current, cue))) {
      cam.position.copy(at);
      look.current.copy(target);
      cam.fov = cue.fov ?? 50;
      cam.updateProjectionMatrix();
    }
    shown.current = cue;

    const k = ease(dt, 1.2);
    cam.position.lerp(at, k);
    look.current.lerp(target, k);
    const fov = cue.fov ?? 50;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
    const t = clock.elapsedTime;
    const d = cam.position.distanceTo(look.current) * 0.004;
    cam.lookAt(look.current.x + Math.sin(t * 0.37) * d, look.current.y + Math.sin(t * 0.29) * d, look.current.z);
  });

  return null;
}

// ---------------------------------------------------------------------------
// pots
// ---------------------------------------------------------------------------

type Shape = 'cantaro' | 'olla' | 'vase';
const SHAPES: Shape[] = ['cantaro', 'olla', 'vase'];

//half-profiles, radius against height, turned on a lathe
const PROFILES: Record<Shape, [number, number][]> = {
  cantaro: [[0, 0], [0.08, 0], [0.16, 0.05], [0.2, 0.14], [0.19, 0.24], [0.12, 0.32], [0.05, 0.36], [0.045, 0.42], [0.065, 0.45]],
  olla: [[0, 0], [0.1, 0], [0.2, 0.06], [0.23, 0.14], [0.2, 0.22], [0.16, 0.25], [0.18, 0.27]],
  vase: [[0, 0], [0.06, 0], [0.1, 0.08], [0.11, 0.2], [0.08, 0.32], [0.05, 0.4], [0.075, 0.48]],
};

const potGeometries = new Map<string, THREE.LatheGeometry>();
const potGeometry = (shape: Shape, broken: boolean) => {
  const key = `${shape}${broken}`;
  if (!potGeometries.has(key)) {
    const points = PROFILES[shape].map(([r, y]) => new THREE.Vector2(r, y));
    potGeometries.set(key, new THREE.LatheGeometry(points, 28, 0, broken ? 3.3 : Math.PI * 2));
  }
  return potGeometries.get(key)!;
};

interface PotProps {
  shape: Shape;
  at: Vec3;
  material: THREE.Material;
  size?: number;
  broken?: boolean;
  turn?: Vec3;
}

const Pot = ({ shape, at, material, size = 1, broken = false, turn = [0, 0, 0] }: PotProps) => (
  <mesh geometry={potGeometry(shape, broken)} material={material} position={at} rotation={turn} scale={size} />
);

//the shelves fill up from the bottom as the weeks go on
const SHELF_SPOTS: Vec3[] = [0.08, 0.68, 1.28, 1.88].flatMap((y, row) =>
  Array.from({ length: 8 }, (_, i): Vec3 => [3.3 + i * 0.5 + (row % 2) * 0.12, y + 0.04, -7.15]),
);

function Shelves({ count }: { count: number }) {
  return (
    <group>
      {[0.08, 0.68, 1.28, 1.88].map((y) => (
        <mesh key={y} position={[5.1, y, -7.15]} material={toon(WOOD)}>
          <boxGeometry args={[4.4, 0.06, 0.55]} />
        </mesh>
      ))}
      {[3, 7.2].map((x) => (
        <mesh key={x} position={[x, 1.05, -7.15]} material={toon(WOOD)}>
          <boxGeometry args={[0.08, 2.1, 0.55]} />
        </mesh>
      ))}
      {SHELF_SPOTS.slice(0, count).map((at, i) => (
        <Pot key={i} shape={SHAPES[(i * 7) % 3]} at={at} material={RAW} size={0.9 + ((i * 5) % 3) * 0.1} />
      ))}
    </group>
  );
}

//fifteen whole and shining, seventeen cracked or in pieces, all laid out on a woven mat
function FiredPieces({ mat }: { mat: Mat }) {
  const pieces = useMemo(() => {
    const random = seeded(11);
    const whole = Array.from({ length: 15 }, (_, i): PotProps => ({
      shape: SHAPES[i % 3],
      at: [MAT[0] - 1.1 + (i % 5) * 0.55, MAT[1], MAT[2] - 0.55 + Math.floor(i / 5) * 0.5],
      material: BLACK,
      turn: [0, random() * 6, 0],
    }));
    const broken = Array.from({ length: 17 }, (_, i): PotProps => ({
      shape: SHAPES[(i * 2) % 3],
      at: [MAT[0] + 1.75 + (random() - 0.5) * 1.5, MAT[1] + 0.12, MAT[2] + (random() - 0.5) * 1.6],
      material: BLACK,
      broken: true,
      turn: [Math.PI / 2 + (random() - 0.5) * 0.6, random() * 6, random() * 6],
      size: 0.7 + random() * 0.4,
    }));
    const chips = Array.from({ length: 40 }, (): [Vec3, Vec3] => [
      [MAT[0] + 1.3 + random() * 1.4, 0.03, MAT[2] - 0.5 + random() * 1.2],
      [random() * 3, random() * 3, random() * 3],
    ]);
    return { whole, broken, chips };
  }, []);

  if (mat === 'none') return null;
  return (
    <group>
      <mesh position={[MAT[0] + 0.5, MAT[1], MAT[2]]} rotation={[-Math.PI / 2, 0, 0]} material={toon('#d6b878')}>
        <planeGeometry args={[4.2, 2.2]} />
      </mesh>
      {mat === 'shards' && pieces.whole.map((p, i) => <Pot key={i} {...p} />)}
      {mat === 'shards' && pieces.broken.map((p, i) => <Pot key={i} {...p} />)}
      {pieces.chips.map(([at, turn], i) => (
        <mesh key={i} position={mat === 'swept' ? [MAT[0] + 2 + Math.sin(i) * 0.3, 0.06 + (i % 4) * 0.04, MAT[2] + Math.cos(i * 3) * 0.3] : at} rotation={turn} material={BLACK}>
          <boxGeometry args={[0.1, 0.02, 0.07]} />
        </mesh>
      ))}
    </group>
  );
}

//the jar on the bench, with the ripple near its neck, and the quartz stone working round it
function BurnishJar({ working }: { working: boolean }) {
  const stone = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 2.2;
    stone.current!.visible = working;
    stone.current!.position.set(Math.cos(t) * 0.27, 0.22 + Math.sin(t * 0.37) * 0.06, Math.sin(t) * 0.27);
  });
  return (
    <group position={JAR}>
      <Pot shape="cantaro" at={[0, 0, 0]} material={LEATHER} size={1.3} />
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#8d867e')}>
        <torusGeometry args={[0.172, 0.008, 6, 28]} />
      </mesh>
      <mesh ref={stone} material={toon('#f1efe8')}>
        <icosahedronGeometry args={[0.035, 0]} />
      </mesh>
    </group>
  );
}

//the two saucers that stand in for a wheel, with a pot being shaped on top
function Saucers({ spin }: { spin: boolean }) {
  const top = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin) top.current!.rotation.y += dt * 2.5;
  });
  return (
    <group position={SAUCERS}>
      <mesh position={[0, 0.02, 0]} material={toon('#c06a3e')}>
        <cylinderGeometry args={[0.16, 0.11, 0.04, 24]} />
      </mesh>
      <group ref={top} position={[0, 0.06, 0]}>
        <mesh material={toon('#c06a3e')}>
          <cylinderGeometry args={[0.11, 0.17, 0.04, 24]} />
        </mesh>
        <Pot shape="olla" at={[0, 0.02, 0]} material={toon('#8f877e')} />
        <mesh position={[0.2, 0.18, 0]} material={toon('#8f877e')}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// fire and smoke
// ---------------------------------------------------------------------------

//flames and smoke over the pit, each easing in and out with the kiln's state
function KilnFire({ kiln }: { kiln: Kiln }) {
  const soft = useMemo(() => softTexture(), []);
  const flames = useMemo(() => Array.from({ length: 18 }, () => new THREE.SpriteMaterial({ map: soft, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })), [soft]);
  const smoke = useMemo(() => Array.from({ length: 12 }, () => new THREE.SpriteMaterial({ map: soft, color: '#8e8a86', transparent: true, depthWrite: false })), [soft]);
  const flameSprites = useRef<(THREE.Sprite | null)[]>([]);
  const smokeSprites = useRef<(THREE.Sprite | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  const level = useRef({ fire: 0, smoke: 0, glow: 0 });
  const yellow = useMemo(() => new THREE.Color('#ffd27a'), []);
  const red = useMemo(() => new THREE.Color('#e0401c'), []);

  useFrame(({ clock }, dt) => {
    const k = ease(dt, 1.2);
    const l = level.current;
    l.fire += ((kiln === 'fire' ? 1 : 0) - l.fire) * k;
    l.smoke += ((kiln === 'sealed' || kiln === 'open' ? 1 : kiln === 'fire' ? 0.5 : 0) - l.smoke) * k;
    l.glow += ((kiln === 'sealed' ? 0.35 : 0) - l.glow) * k;
    const t = clock.elapsedTime;
    flames.forEach((m, i) => {
      const phase = (t * 0.8 + i / flames.length) % 1;
      const s = flameSprites.current[i]!;
      s.position.set(Math.sin(i * 2.4) * 0.7 * (1 - phase * 0.6), 0.1 + phase * 1.7, Math.cos(i * 1.7) * 0.7 * (1 - phase * 0.6));
      s.scale.setScalar(0.35 + (1 - phase) * 0.9);
      m.color.copy(yellow).lerp(red, phase);
      m.opacity = l.fire * (1 - phase);
    });
    smoke.forEach((m, i) => {
      const phase = (t * 0.12 + i / smoke.length) % 1;
      const s = smokeSprites.current[i]!;
      s.position.set(Math.sin(i * 1.3) * 0.4 + phase * 1.4, 0.4 + phase * 6, Math.cos(i * 2.1) * 0.4 + phase * 0.6);
      s.scale.setScalar(0.8 + phase * 2.8);
      m.opacity = l.smoke * 0.45 * Math.sin(phase * Math.PI);
    });
    const flicker = 0.8 + Math.sin(t * 13) * 0.12 + Math.sin(t * 29) * 0.08;
    light.current!.intensity = (l.fire * 6 + l.glow * 2) * flicker;
  });

  return (
    <group position={KILN}>
      {flames.map((m, i) => (
        <sprite key={i} ref={(s) => { flameSprites.current[i] = s; }} material={m} />
      ))}
      {smoke.map((m, i) => (
        <sprite key={i} ref={(s) => { smokeSprites.current[i] = s; }} material={m} />
      ))}
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ff8a3a" distance={16} decay={1} />
    </group>
  );
}

function Kiln({ kiln }: { kiln: Kiln }) {
  const stones = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2);
  return (
    <group position={KILN}>
      {stones.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 1.35, 0.1, Math.sin(a) * 1.35]} rotation={[a, a * 2, 0]} material={toon(STONE)}>
          <icosahedronGeometry args={[0.24, 0]} />
        </mesh>
      ))}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} material={toon(kiln === 'fire' ? '#ffb15a' : '#2b1d16')}>
        <circleGeometry args={[1.2, 28]} />
      </mesh>
      {kiln === 'loaded' && [0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Pot key={i} shape={SHAPES[i % 3]} at={i === 6 ? [0, -0.15, 0] : [Math.cos(i) * 0.6, -0.2, Math.sin(i) * 0.6]} material={RAW} size={1.1} />
      ))}
      {kiln === 'sealed' && (
        <mesh scale={[1, 0.3, 1]} material={toon('#8a6a4c')}>
          <sphereGeometry args={[1.35, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
      {kiln === 'open' && [0, 1, 2, 3].map((i) => (
        <Pot key={i} shape={SHAPES[i % 3]} at={[1.8 + i * 0.5, 0, 1.1 - i * 0.15]} material={BLACK} />
      ))}
      {/* the woodpile */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[3.4, 0.1 + Math.floor(i / 5) * 0.17, -1.6 + (i % 5) * 0.18 + (Math.floor(i / 5) % 2) * 0.09]} rotation={[0, 0, Math.PI / 2]} material={toon(i % 3 ? WOOD : '#94683f')}>
          <cylinderGeometry args={[0.08, 0.08, 1.4, 7]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

interface PersonProps {
  at: Vec3;
  face: number;
  skin: string;
  top: string;
  legs: string;
  hair: string;
  skirt?: boolean;
  shawl?: string;
  cap?: string;
}

function Person({ at, face, skin, top, legs, hair, skirt, shawl, cap }: PersonProps) {
  return (
    <group position={at} rotation={[0, face, 0]}>
      {skirt ? (
        <mesh position={[0, 0.45, 0]} material={toon(legs)}>
          <cylinderGeometry args={[0.2, 0.3, 0.9, 16]} />
        </mesh>
      ) : (
        [-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.45, 0]} material={toon(legs)}>
            <capsuleGeometry args={[0.08, 0.7, 4, 8]} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.15, 0]} material={toon(top)}>
        <capsuleGeometry args={[0.19, 0.4, 4, 12]} />
      </mesh>
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.03]} rotation={[0.15, 0, x * 0.4]} material={toon(shawl ?? top)}>
          <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
        </mesh>
      ))}
      {shawl && (
        <mesh position={[0, 1.3, 0]} material={toon(shawl)}>
          <cylinderGeometry args={[0.2, 0.27, 0.3, 16]} />
        </mesh>
      )}
      <mesh position={[0, 1.6, 0]} material={toon(skin)}>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.64, -0.03]} material={toon(hair)}>
        <sphereGeometry args={[0.135, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
      </mesh>
      {cap ? (
        <mesh position={[0, 1.72, 0.08]} rotation={[0.1, 0, 0]} material={toon(cap)}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        </mesh>
      ) : (
        <mesh position={[0, 1.66, -0.15]} material={toon(hair)}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// the yard and the village
// ---------------------------------------------------------------------------

function Wall({ from, to, height = 1.8 }: { from: [number, number]; to: [number, number]; height?: number }) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return (
    <mesh position={[(from[0] + to[0]) / 2, height / 2, (from[1] + to[1]) / 2]} rotation={[0, -Math.atan2(to[1] - from[1], to[0] - from[0]), 0]} material={toon(ADOBE)}>
      <boxGeometry args={[length, height, 0.35]} />
    </mesh>
  );
}

function House() {
  return (
    <group position={[0, 0, -9.6]}>
      <mesh position={[0, 1.7, 0]} material={toon(ADOBE)}>
        <boxGeometry args={[12, 3.4, 4.4]} />
      </mesh>
      <mesh position={[0, 3.5, 0]} material={toon(ADOBE_DARK)}>
        <boxGeometry args={[12.2, 0.2, 4.6]} />
      </mesh>
      <mesh position={[1.5, 0.3, 2.21]} material={toon(LIME)}>
        <boxGeometry args={[12, 0.6, 0.02]} />
      </mesh>
      <mesh position={[1.5, 1.1, 2.22]} material={toon(COBALT)}>
        <boxGeometry args={[1.1, 2.2, 0.06]} />
      </mesh>
      {[-1.6, 4.4].map((x) => (
        <group key={x} position={[x, 1.7, 2.22]}>
          <mesh material={toon(TEAL)}>
            <boxGeometry args={[1.1, 1.1, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.02]} material={toon('#1d2a33')}>
            <boxGeometry args={[0.85, 0.85, 0.06]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ramada() {
  const [x, , z] = BENCH;
  return (
    <group>
      {[[-1.9, -1.4], [1.9, -1.4], [-1.9, 1.6], [1.9, 1.6]].map(([dx, dz]) => (
        <mesh key={`${dx}${dz}`} position={[x + dx, 1.3, z + dz]} material={toon(WOOD)}>
          <cylinderGeometry args={[0.07, 0.08, 2.6, 7]} />
        </mesh>
      ))}
      <mesh position={[x, 2.66, z + 0.1]} rotation={[0.08, 0, 0]} material={toon(THATCH)}>
        <boxGeometry args={[4.4, 0.14, 3.6]} />
      </mesh>
      {/* the bench, a stool and the night lamp */}
      <mesh position={[x, BENCH[1] - 0.04, z]} material={toon(WOOD)}>
        <boxGeometry args={[1.9, 0.08, 0.9]} />
      </mesh>
      {[[-0.85, -0.38], [0.85, -0.38], [-0.85, 0.38], [0.85, 0.38]].map(([dx, dz]) => (
        <mesh key={`${dx}${dz}`} position={[x + dx, 0.39, z + dz]} material={toon(WOOD)}>
          <boxGeometry args={[0.07, 0.78, 0.07]} />
        </mesh>
      ))}
      <mesh position={[x + 0.3, 0.25, z + 0.85]} material={toon('#5c3d29')}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 10]} />
      </mesh>
      <mesh position={[x, 2.6 - 0.25, z]} material={toon('#333')}>
        <cylinderGeometry args={[0.005, 0.005, 0.5, 4]} />
      </mesh>
      <mesh position={[x, 2.05, z]} material={BULB}>
        <sphereGeometry args={[0.05, 12, 8]} />
      </mesh>
    </group>
  );
}

function Lamp({ on }: { on: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    light.current!.intensity += ((on ? 3 : 0) - light.current!.intensity) * ease(dt, 2);
  });
  return <pointLight ref={light} position={[BENCH[0], 2, BENCH[2]]} color="#ffcf8a" intensity={0} distance={7} decay={1} />;
}

function Tree({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0.1]} material={toon(WOOD)}>
        <cylinderGeometry args={[0.14, 0.22, 2.4, 7]} />
      </mesh>
      {[[0, 3, 0, 1.5], [1, 2.6, 0.4, 1], [-0.9, 2.7, -0.3, 1.1], [0.2, 2.5, -1, 0.9]].map(([x, y, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, y, z]} scale={[1, 0.6, 1]} material={toon(LEAF)}>
          <icosahedronGeometry args={[r, 1]} />
        </mesh>
      ))}
    </group>
  );
}

function Agave({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.7) * 0.15, 0.35, Math.sin(i * 0.7) * 0.15]} rotation={[Math.sin(i * 0.7) * 0.7, 0, -Math.cos(i * 0.7) * 0.7]} material={toon(AGAVE)}>
          <coneGeometry args={[0.07, 0.9, 4]} />
        </mesh>
      ))}
    </group>
  );
}

//paper flags strung across the yard, stirring in the breeze
function PapelPicado() {
  const flags = useRef<(THREE.Mesh | null)[]>([]);
  const from = new THREE.Vector3(-5.8, 3.3, -7.4);
  const to = new THREE.Vector3(-7.4, 3.6, 4.6);
  const colors = ['#e84a7f', MARIGOLD, TEAL, '#8a4fc2', '#5fb04a', COBALT];
  const count = 16;
  useFrame(({ clock }) => {
    flags.current.forEach((f, i) => {
      f!.rotation.x = Math.sin(clock.elapsedTime * 1.8 + i * 0.7) * 0.25;
    });
  });
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count;
        const p = from.clone().lerp(to, t);
        p.y -= Math.sin(t * Math.PI) * 0.5;
        return (
          <group key={i} position={p} rotation={[0, Math.atan2(to.x - from.x, to.z - from.z) - Math.PI / 2, 0]}>
            <mesh ref={(m) => { flags.current[i] = m; }} position={[0, -0.2, 0]} material={toon(colors[i % colors.length])}>
              <planeGeometry args={[0.45, 0.4]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Crates() {
  return (
    <group position={[0.6, 0, 7.2]}>
      {[[-0.6, 0, 0], [0.6, 0, 0.1], [0, 0.62, 0.05]].map(([x, y, z]) => (
        <group key={`${x}${y}`} position={[x, y + 0.3, z]}>
          <mesh material={toon('#b48a5a')}>
            <boxGeometry args={[1, 0.6, 0.7]} />
          </mesh>
          <mesh position={[0, 0.31, 0]} material={toon('#e3c46a')}>
            <boxGeometry args={[0.9, 0.04, 0.6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Church() {
  return (
    <group position={CHURCH} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 4.5, 0]} material={toon(LIME)}>
        <boxGeometry args={[9, 9, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.6, 0, 12]}>
          <mesh position={[0, 8, 0]} material={toon(LIME)}>
            <boxGeometry args={[3, 16, 3]} />
          </mesh>
          <mesh position={[0, 13.5, 1.51]} material={toon('#3a2c28')}>
            <boxGeometry args={[1.2, 2, 0.05]} />
          </mesh>
          <mesh position={[0, 16.8, 0]} material={toon(MARIGOLD)}>
            <sphereGeometry args={[1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 9, -6]} material={toon(COBALT)}>
        <sphereGeometry args={[3.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

function Village() {
  const { houses, hills, plants } = useMemo(() => {
    const random = seeded(5);
    const tones = [ADOBE, '#e3b07a', LIME, '#c97b8e', '#d9a066', ADOBE_DARK];
    const houses = Array.from({ length: 26 }, (_, i) => {
      const a = random() * Math.PI * 2;
      const r = 20 + random() * 45;
      return { at: [Math.cos(a) * r, 0, Math.sin(a) * r - 10] as Vec3, size: [4 + random() * 5, 2.6 + random() * 1.6, 4 + random() * 4] as Vec3, turn: random(), color: tones[i % tones.length] };
    }).filter(({ at }) => Math.hypot(at[0] - CHURCH[0], at[2] - CHURCH[2]) > 18);
    const hills = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + random() * 0.2;
      const r = 160 + random() * 120;
      return { at: [Math.cos(a) * r, 0, Math.sin(a) * r] as Vec3, height: 30 + random() * 50, width: 50 + random() * 50 };
    });
    const plants = Array.from({ length: 30 }, () => [(random() - 0.5) * 120, 0, (random() - 0.5) * 120] as Vec3).filter(
      ([x, , z]) => Math.abs(x) > 13 || Math.abs(z + 1) > 12,
    );
    return { houses, hills, plants };
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={toon(EARTH)}>
        <circleGeometry args={[500, 48]} />
      </mesh>
      {houses.map(({ at, size, turn, color }, i) => (
        <mesh key={i} position={[at[0], size[1] / 2, at[2]]} rotation={[0, turn, 0]} material={toon(color)}>
          <boxGeometry args={size} />
        </mesh>
      ))}
      {hills.map(({ at, height, width }, i) => (
        <mesh key={i} position={[at[0], height / 2 - 1, at[2]]} material={toon(i % 2 ? '#8a7aa6' : '#7a6e98')}>
          <coneGeometry args={[width, height, 7]} />
        </mesh>
      ))}
      {plants.map((at, i) => (i % 3 ? <Agave key={i} at={at} /> : <Tree key={i} at={at} />))}
      <Church />
    </group>
  );
}

//everything in the yard casts and catches the low sun
function Yard({ cue }: { cue: Cue }) {
  const group = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    group.current!.traverse((o) => {
      o.castShadow = o.receiveShadow = true;
    });
  });
  return (
    <group ref={group}>
      <House />
      <Wall from={[-11, -7.4]} to={[-11, 9]} />
      <Wall from={[11, -7.4]} to={[11, 9]} />
      <Wall from={[-11, -7.4]} to={[-6, -7.4]} />
      <Wall from={[6, -7.4]} to={[11, -7.4]} />
      <Wall from={[-11, 9]} to={[-1.2, 9]} />
      <Wall from={[1.2, 9]} to={[11, 9]} />
      <Ramada />
      <Shelves count={cue.shelf ?? 0} />
      <Saucers spin={!!cue.spin} />
      <BurnishJar working={!!cue.burnish} />
      <Kiln kiln={cue.kiln ?? 'empty'} />
      <FiredPieces mat={cue.mat ?? 'none'} />
      {cue.crates && <Crates />}
      <Tree at={[-8.2, 0, 5]} />
      <Agave at={[8.8, 0, 7.2]} />
      <Agave at={[-9.6, 0, -5.8]} />
      <PapelPicado />
      {cue.chabela && <Person at={SPOTS[cue.chabela][0]} face={SPOTS[cue.chabela][1]} skin="#9a6a4a" top="#efe6d6" legs="#2c3e6b" hair="#e8e4dc" skirt shawl="#3d4a6b" />}
      {cue.beto && <Person at={[GATE[0] + 0.8, 0, GATE[2] - 1.6]} face={Math.PI - 0.3} skin="#8a5a3c" top="#c8323c" legs="#3b4a5e" hair="#1a1410" cap="#1f3b6e" />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  day: new URL('./sounds/day.m4a', import.meta.url).href,
  night: new URL('./sounds/night.m4a', import.meta.url).href,
  fire: new URL('./sounds/fire.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

function mixFor(cue: Cue): Partial<Record<Bed, number>> {
  const fire = cue.kiln === 'fire' ? 0.6 : cue.kiln === 'sealed' ? 0.12 : 0;
  if (cue.time === 'night') return { night: 0.5, fire };
  if (cue.time === 'day') return { day: 0.45, fire };
  return { day: 0.25, night: 0.25, fire };
}

const BELLS = new URL('./sounds/bells.m4a', import.meta.url).href;
const WOOD_SOUND = new URL('./sounds/wood.m4a', import.meta.url).href;
const EARTH_SOUND = new URL('./sounds/earth.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  village: { src: BELLS, volume: 0.55, delay: 0.5 },
  closing: { src: BELLS, volume: 0.4, delay: 1 },
  kiln_load: { src: WOOD_SOUND, volume: 0.6, delay: 0.4 },
  kiln_fire: { src: WOOD_SOUND, volume: 0.5, delay: 0.6 },
  kiln_sealed: { src: EARTH_SOUND, volume: 0.6, delay: 0.3 },
  kiln_open: { src: EARTH_SOUND, volume: 0.5, delay: 0.3 },
  shards: { src: new URL('./sounds/crack.m4a', import.meta.url).href, volume: 0.5, delay: 0.6 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds

// ---------------------------------------------------------------------------
// the scene
// ---------------------------------------------------------------------------

function Coyotepec({ animation }: { animation: string }) {
  //an animation this scene has no cue for holds whatever cue came before it
  const [active, setActive] = useState(cues[animation] ? animation : FIRST_CUE);
  const [lastAnimation, setLastAnimation] = useState(animation);
  const [cuts, setCuts] = useState(0);
  if (animation !== lastAnimation) {
    setLastAnimation(animation);
    if (cues[animation]) {
      if (isCut(cues[active], cues[animation])) setCuts((n) => n + 1);
      setActive(animation);
    }
  }

  useEffect(() => {
    if (!cues[animation]) console.warn(`The Black Clay has no cue for the animation "${animation}"`);
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
    sound.current?.mix(mixFor(cues[active]));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const cue = cues[active];
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Canvas flat shadows camera={{ fov: 50, near: 0.05, far: 1200, position: cue.at }} dpr={[1, 2]}>
        <CameraRig cue={cue} />
        <Light time={cue.time} />
        <Lamp on={cue.time === 'night' && !cue.kiln} />
        <Village />
        <Yard cue={cue} />
        <KilnFire kiln={cue.kiln ?? 'empty'} />
      </Canvas>
      <div key={cuts} style={styles.dip} />
      <div style={{ ...styles.card, opacity: cue.card ? 1 : 0 }}>
        {cue.card && (
          <>
            <div style={styles.kicker}>{cue.card[0]}</div>
            <div style={styles.name}>{cue.card[1]}</div>
          </>
        )}
      </div>
    </div>
  );
}

const keyframes = `
@keyframes black-clay-dip {
  0%, 20% { opacity: 1; }
  100% { opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: '#1a1410',
  },
  dip: {
    position: 'absolute',
    inset: 0,
    background: '#1a1410',
    pointerEvents: 'none',
    animation: 'black-clay-dip 1.4s ease-out forwards',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: CARD,
    fontFamily: '"Rockwell", "Georgia", serif',
    textShadow: '0 2px 12px rgba(20, 12, 8, 0.6)',
    pointerEvents: 'none',
    transition: 'opacity 1.2s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 8,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  name: {
    fontSize: 64,
    letterSpacing: 4,
    color: MARIGOLD,
  },
};

export default Coyotepec;
