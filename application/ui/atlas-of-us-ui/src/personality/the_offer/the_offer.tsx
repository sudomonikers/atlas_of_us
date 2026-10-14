import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createSoundscape, type OneShot, type Soundscape } from '../soundscape';

// The Offer's art style: a 1970s space-colony painting. Hard-edged toon shading under one strong sun, cream hulls
// with orange stripes and gold foil, a painted Earth below and a black sky full of stars.
//
// Everything lives in one world. Halden Station sits at the origin with its hub along z, and the Earth hangs below it.
// The Meridian docks at the hub's +z end and leaves along AWAY. Mars is far off toward +z. The cupola and the
// Meridian's crew room are built in metres and shrunk to a tenth, so their cues are written in local metres too.

type Vec3 = [number, number, number];
type SetName = 'orbit' | 'cupola' | 'crew' | 'deep';
type ShipState = 'docked' | 'undocking' | 'burn' | 'departing' | 'star' | 'cruise' | 'mars' | 'gone';

interface Cue {
  set: SetName; //moving to a different set cuts through black instead of gliding
  at: Vec3; //camera position
  look: Vec3; //what the camera looks at
  fov?: number;
  ship?: ShipState; //where the Meridian is, docked by default
  night?: boolean; //the station is on the dark side of the Earth
  teo?: boolean;
  holo?: boolean; //Okafor's hologram over the console
  message?: boolean; //the console shows the priority message
  card?: [string, string];
}

// ---------------------------------------------------------------------------
// the world
// ---------------------------------------------------------------------------

const VOID = '#05070d';
const HULL = '#d9d2c3';
const PANEL = '#9aa3a8';
const DARK = '#3a3f45';
const ORANGE = '#e07b39';
const GOLD = '#c9a23a';
const CELLS = '#26365a';
const CABIN = '#ddd3bf';
const LAMP = '#ffd58a';
const CYAN = '#7fe8ff';

const SUN = new THREE.Vector3(-1, 0.55, 0.45).normalize(); //toward the sun
const UP = new THREE.Vector3(0, 1, 0);
const EARTH: Vec3 = [0, -250, 0];
const EARTH_R = 220;
const MARS: Vec3 = [900, 200, 7500];
const MARS_R = 60;
const DOCK: Vec3 = [0, 0, 4.5];
const AWAY = new THREE.Vector3(0, -0.15, 1).normalize(); //the Meridian's way out
const BURN = new THREE.Vector3(...DOCK).addScaledVector(AWAY, 40);
const CRUISE: Vec3 = [40, 40, 3500];
const MARS_SHIP: Vec3 = [MARS[0] - 150, MARS[1] + 60, MARS[2] + 60];
const CUPOLA: Vec3 = [0, -4.2, -3]; //the bottom of the observation module that hangs under the hub
const HAB: Vec3 = [0, 0, DOCK[2] + 4.2]; //middle of the Meridian's hab while docked
const M = 0.1; //interiors are built in metres

//Ares Landing sits just past the terminator on Mars's night side
const ARES = SUN.clone().multiplyScalar(-0.35).addScaledVector(new THREE.Vector3().crossVectors(SUN, UP).normalize(), 0.94).normalize();
const onMars = (out: number, sunward = 0): Vec3 => {
  const p = new THREE.Vector3(...MARS).addScaledVector(ARES, MARS_R * out).addScaledVector(SUN, MARS_R * sunward);
  return [p.x, p.y, p.z];
};

const inCupola = (x: number, y: number, z: number): Vec3 => [CUPOLA[0] + x * M, CUPOLA[1] + y * M, CUPOLA[2] + z * M];
const inHab = (x: number, y: number, z: number): Vec3 => [HAB[0] + x * M, HAB[1] + y * M, HAB[2] + z * M];

//camera near and far planes for each set, so tiny rooms and whole planets both get enough depth precision
const CLIP: Record<SetName, [number, number]> = { orbit: [0.05, 9000], cupola: [0.005, 700], crew: [0.005, 700], deep: [0.5, 15000] };

const CUPOLA_VIEW = { at: inCupola(0, 1.6, 2), look: inCupola(0, -1.8, -2.6) };
const WINDOW_VIEW = { at: inCupola(0, -0.9, 0.4), look: inCupola(0, 15, 90), fov: 60 };

const cues: Record<string, Cue> = {
  title_card: { set: 'orbit', at: [-70, 25, 60], look: [0, -15, 0], card: ['The Offer', 'The Long Burn'] },
  earth_orbit: { set: 'orbit', at: [-60, 18, 48], look: [0, -8, 0] },
  station_wide: { set: 'orbit', at: [-17, 6, 15], look: [0, -1.5, 4] },
  cupola: { set: 'cupola', ...CUPOLA_VIEW },
  message: { set: 'cupola', at: inCupola(0, 1.1, -0.6), look: inCupola(0, 0.4, -2.2), message: true },
  hologram: { set: 'cupola', at: inCupola(0, 1.2, 1), look: inCupola(0, 0.8, -2), holo: true, message: true },
  meridian_dock: { set: 'orbit', at: [6.5, 2.5, 2.5], look: [0, 0, 7] },
  meridian_hull: { set: 'orbit', at: [1.4, 1.3, 9], look: [0.2, 0.1, 20], fov: 60 },
  meridian_records: { set: 'crew', at: inHab(0, 0.4, -1.6), look: inHab(0, 0.5, -4.9) },
  meridian_crew: { set: 'crew', at: inHab(2.6, 1.2, 4), look: inHab(-0.5, -0.3, -1.5), fov: 60 },
  cupola_teo: { set: 'cupola', at: inCupola(-1, 1, 1.6), look: inCupola(0.8, -0.6, -1), teo: true },
  night_window: { set: 'cupola', ...WINDOW_VIEW, night: true },
  undock: { set: 'orbit', at: [-10, 4, 20], look: [0, 0, 9], ship: 'undocking' },
  burn: { set: 'orbit', at: [-16, 0, 36], look: [0, -6, 50], ship: 'burn' },
  earth_small: { set: 'deep', at: [CRUISE[0] + 7, CRUISE[1] + 3, CRUISE[2] + 16], look: EARTH, ship: 'cruise' },
  mars_approach: { set: 'deep', at: [MARS_SHIP[0] - 12, MARS_SHIP[1] + 5, MARS_SHIP[2] + 8], look: MARS, ship: 'mars' },
  ares_landing: { set: 'deep', at: onMars(1.5, 0.35), look: onMars(0.95), ship: 'mars' },
  watch_burn: { set: 'cupola', ...WINDOW_VIEW, ship: 'departing' },
  meridian_star: { set: 'cupola', ...WINDOW_VIEW, ship: 'star' },
  cupola_after: { set: 'cupola', ...CUPOLA_VIEW, ship: 'gone' },
  reflect: { set: 'orbit', at: [-55, 18, 70], look: [0, -12, 0], ship: 'gone' },
  closing: { set: 'orbit', at: [-90, 30, 110], look: [0, -25, 0], ship: 'gone' },
};

const FIRST_CUE = 'title_card';

//cuts through black when the set changes or the camera has too far to glide
const isCut = (a: Cue, b: Cue) => a.set !== b.set || new THREE.Vector3(...a.at).distanceTo(new THREE.Vector3(...b.at)) > 300;

// ---------------------------------------------------------------------------
// paint
// ---------------------------------------------------------------------------

//small deterministic random so the stars and planets look the same on every visit
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hash = (i: number, j: number, k: number) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

//3d value noise, summed over octaves, roughly 0 to 1
function fbm(x: number, y: number, z: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  for (let o = 0; o < octaves; o++) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    const u = x - i, v = y - j, w = z - k;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), sw = w * w * (3 - 2 * w);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const n = lerp(
      lerp(lerp(hash(i, j, k), hash(i + 1, j, k), su), lerp(hash(i, j + 1, k), hash(i + 1, j + 1, k), su), sv),
      lerp(lerp(hash(i, j, k + 1), hash(i + 1, j, k + 1), su), lerp(hash(i, j + 1, k + 1), hash(i + 1, j + 1, k + 1), su), sv),
      sw,
    );
    sum += n * amp;
    amp *= 0.5;
    x *= 2.03; y *= 2.03; z *= 2.03;
  }
  return sum / (1 - amp * 2);
}

const rgb = (hex: string) => new THREE.Color(hex);
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, Math.min(1, Math.max(0, t)));

//paints an equirectangular map by asking for a colour at each point on the unit sphere
function planetTexture(paint: (x: number, y: number, z: number) => THREE.Color) {
  const w = 640, h = 320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d')!;
  const image = c.createImageData(w, h);
  for (let py = 0; py < h; py++) {
    const lat = Math.PI / 2 - ((py + 0.5) / h) * Math.PI;
    for (let px = 0; px < w; px++) {
      const lon = ((px + 0.5) / w) * Math.PI * 2;
      const color = paint(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
      const i = (py * w + px) * 4;
      image.data[i] = color.r * 255;
      image.data[i + 1] = color.g * 255;
      image.data[i + 2] = color.b * 255;
      image.data[i + 3] = 255;
    }
  }
  c.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const RUST_DARK = rgb('#7d3420'), RUST = rgb('#b5502c'), RUST_LIGHT = rgb('#d98a5c'), CAP = rgb('#f0ddd2');

const paintMars = (x: number, y: number, z: number) => {
  const n = fbm(x * 2 + 9, y * 2, z * 2, 5);
  const color = n < 0.45 ? mix(RUST_DARK, RUST, (n - 0.3) * 6) : mix(RUST, RUST_LIGHT, (n - 0.5) * 4);
  return Math.abs(y) > 0.92 ? CAP : color;
};

//a few lines of glowing text on a dark screen
function screenTexture(lines: [string, string][], draw?: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#0c181d';
  c.fillRect(0, 0, 640, 400);
  c.font = '28px "Courier New", monospace';
  lines.forEach(([text, color], i) => {
    c.fillStyle = color;
    c.fillText(text, 32, 56 + i * 42);
  });
  draw?.(c);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const GREENISH = '#7fe0c0';

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// ---------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------

//three hard bands of light, the flat painted look
const GRADIENT = new THREE.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, THREE.RedFormat);
GRADIENT.minFilter = GRADIENT.magFilter = THREE.NearestFilter;
GRADIENT.needsUpdate = true;

const toons = new Map<string, THREE.MeshToonMaterial>();
const toon = (color: string, side: THREE.Side = THREE.FrontSide) => {
  const key = `${color}${side}`;
  if (!toons.has(key)) toons.set(key, new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT, side }));
  return toons.get(key)!;
};

const glows = new Map<string, THREE.MeshBasicMaterial>();
const glow = (color: string) => {
  if (!glows.has(color)) glows.set(color, new THREE.MeshBasicMaterial({ color }));
  return glows.get(color)!;
};

const ATMOSPHERE_VERTEX = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldNormal;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * mv;
}
`;

//drawn on the back faces of a shell just outside the planet: brightest at the planet's edge, fading outward
const ATMOSPHERE_FRAGMENT = `
uniform vec3 color;
uniform vec3 sun;
uniform float edge;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldNormal;
void main() {
  float a = clamp(-dot(vNormal, vView) / edge, 0.0, 1.0);
  float lit = 0.15 + 0.85 * clamp(dot(vWorldNormal, sun) + 0.35, 0.0, 1.0);
  gl_FragColor = vec4(color * a * a * lit, 1.0);
  #include <colorspace_fragment>
}
`;

function atmosphere(color: string, scale: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, sun: { value: SUN }, edge: { value: Math.sqrt(1 - 1 / (scale * scale)) } },
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

const HOLO_VERTEX = `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const HOLO_FRAGMENT = `
uniform float time;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float scan = 0.45 + 0.55 * step(0.45, fract(vWorld.y * 500.0 - time * 1.5));
  float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.0);
  float flicker = 0.85 + 0.15 * sin(time * 31.0) * sin(time * 7.0);
  gl_FragColor = vec4(vec3(0.5, 0.92, 1.0) * (0.25 + rim) * scan * flicker, 1.0);
  #include <colorspace_fragment>
}
`;

const HOLO = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 } },
  vertexShader: HOLO_VERTEX,
  fragmentShader: HOLO_FRAGMENT,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
});

// ---------------------------------------------------------------------------
// camera and sky
// ---------------------------------------------------------------------------

const ease = (dt: number, rate: number) => 1 - Math.exp(-Math.min(dt, 0.1) * rate);

//glides toward each cue, cuts on a set change, and drifts a little as if floating
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
      [cam.near, cam.far] = CLIP[cue.set];
      cam.fov = cue.fov ?? 50;
      cam.updateProjectionMatrix();
    }
    shown.current = cue;

    const k = ease(dt, 1.1);
    cam.position.lerp(at, k);
    look.current.lerp(target, k);
    const fov = cue.fov ?? 50;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
    const t = clock.elapsedTime;
    const d = cam.position.distanceTo(look.current) * 0.006;
    cam.lookAt(look.current.x + Math.sin(t * 0.31) * d, look.current.y + Math.sin(t * 0.23) * d, look.current.z);
  });

  return null;
}

//stars and the sun ride along with the camera so they always sit behind everything else
function Sky({ night }: { night: boolean }) {
  const { stars, band } = useMemo(() => {
    const random = seeded(7);
    const point = (spread: number) => {
      //the band is a tilted great circle, the rest are anywhere on the sphere
      if (spread > 0) {
        const a = random() * Math.PI * 2;
        const off = (random() + random() + random() - 1.5) * spread;
        return new THREE.Vector3(Math.cos(a), off, Math.sin(a)).normalize().applyAxisAngle(new THREE.Vector3(1, 0, 0.3).normalize(), 1.1);
      }
      return new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    };
    const build = (count: number, spread: number) => {
      const positions: number[] = [];
      const colors: number[] = [];
      for (let i = 0; i < count; i++) {
        const p = point(spread);
        positions.push(p.x, p.y, p.z);
        const tint = random();
        const c = tint < 0.15 ? rgb('#ffd9a8') : tint < 0.3 ? rgb('#a8c8ff') : rgb('#ffffff');
        c.multiplyScalar(0.5 + random() * 0.5);
        colors.push(c.r, c.g, c.b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return g;
    };
    return { stars: build(2200, 0), band: build(3000, 0.12) };
  }, []);
  const sunTexture = useMemo(() => glowTexture(), []);

  const group = useRef<THREE.Group>(null);
  const sun = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const level = useRef(night ? 0.1 : 1);

  useFrame(({ camera }, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    level.current += ((night ? 0.1 : 1) - level.current) * ease(dt, 1.5);
    group.current!.position.copy(cam.position);
    group.current!.scale.setScalar(cam.far * 0.9);
    sun.current!.opacity = level.current;
    light.current!.intensity = 2.8 * level.current;
  });

  return (
    <>
      <directionalLight ref={light} position={SUN.clone().multiplyScalar(100)} color="#fff4e2" />
      <ambientLight intensity={0.35} color="#6d7fa8" />
      <group ref={group}>
        <points geometry={stars} renderOrder={-10} frustumCulled={false}>
          <pointsMaterial vertexColors size={2.2} sizeAttenuation={false} depthTest={false} depthWrite={false} />
        </points>
        <points geometry={band} renderOrder={-10} frustumCulled={false}>
          <pointsMaterial vertexColors size={1.2} sizeAttenuation={false} depthTest={false} depthWrite={false} />
        </points>
        <sprite position={SUN} scale={0.12}>
          <spriteMaterial ref={sun} map={sunTexture} color="#fff1d0" blending={THREE.AdditiveBlending} depthWrite={false} transparent />
        </sprite>
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// planets
// ---------------------------------------------------------------------------

//Natural Earth II by Tom Patterson (public domain), an atlas-painted map. the 4k one (1MB) shows first everywhere;
//desktops whose GPU takes 8k textures then swap in the sharp one (5.5MB, ~170MB of video memory) once it arrives
const EARTH_MAP = new URL('./textures/earth_4k.jpg', import.meta.url).href;
const EARTH_MAP_8K = new URL('./textures/earth.jpg', import.meta.url).href;

function loadTexture(src: string, onLoad?: (texture: THREE.Texture) => void) {
  const texture = new THREE.TextureLoader().load(src, onLoad);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function useEarthMap() {
  const gl = useThree((state) => state.gl);
  const [map, setMap] = useState(() => loadTexture(EARTH_MAP));

  useEffect(() => {
    if (gl.capabilities.maxTextureSize < 8192 || !window.matchMedia('(pointer: fine)').matches) return;
    let cancelled = false;
    const sharp = loadTexture(EARTH_MAP_8K, () => {
      if (!cancelled) setMap(sharp);
    });
    return () => {
      cancelled = true;
      sharp.dispose();
    };
  }, [gl]);

  useEffect(() => () => map.dispose(), [map]);
  return map;
}

//where a latitude and longitude land on a three.js sphere wrapped in an equirectangular map
const onGlobe = (lat: number, lon: number) => {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
};

//turns the globe so a place faces up, with north pointing ahead
function facing(lat: number, lon: number, up: THREE.Vector3, ahead: THREE.Vector3) {
  const p = onGlobe(lat, lon);
  const north = onGlobe(lat + 1, lon).sub(p);
  north.addScaledVector(p, -north.dot(p)).normalize();
  const forward = ahead.clone().addScaledVector(up, -ahead.dot(up)).normalize();
  const local = new THREE.Matrix4().makeBasis(p, north, new THREE.Vector3().crossVectors(p, north));
  const world = new THREE.Matrix4().makeBasis(up, forward, new THREE.Vector3().crossVectors(up, forward));
  return new THREE.Quaternion().setFromRotationMatrix(world.multiply(local.transpose()));
}

//the middle of North America sits between the opening camera and the station, north away from the camera
const EARTH_TURN = facing(38, -98, new THREE.Vector3(-30, 260, 25).normalize(), new THREE.Vector3(0.78, 0, -0.62));

function Earth() {
  const map = useEarthMap();
  const air = useMemo(() => atmosphere('#7cbcff', 1.04), []);
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    spin.current!.rotation.y += dt * 0.0008; //slow enough that America stays in view
  });
  return (
    <group position={EARTH}>
      <group quaternion={EARTH_TURN}>
        <group ref={spin}>
          <mesh>
            <sphereGeometry args={[EARTH_R, 128, 96]} />
            <meshToonMaterial map={map} gradientMap={GRADIENT} />
          </mesh>
        </group>
      </group>
      <mesh material={air}>
        <sphereGeometry args={[EARTH_R * 1.04, 96, 64]} />
      </mesh>
    </group>
  );
}

function Mars() {
  const map = useMemo(() => planetTexture(paintMars), []);
  const air = useMemo(() => atmosphere('#f2a27a', 1.025), []);
  const lights = useMemo(() => {
    const random = seeded(31);
    const side = new THREE.Vector3().crossVectors(ARES, UP).normalize();
    const along = new THREE.Vector3().crossVectors(side, ARES).normalize();
    const positions: number[] = [];
    for (let i = 0; i < 90; i++) {
      //a tight town with two roads running out of it
      const road = i % 3;
      const r = road === 0 ? random() * 0.025 : 0.02 + random() * 0.08;
      const a = road === 0 ? random() * Math.PI * 2 : road === 1 ? 0.4 : 2.6;
      const p = ARES.clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(along, Math.sin(a) * r).normalize().multiplyScalar(MARS_R * 1.002);
      positions.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);
  return (
    <group position={MARS}>
      <mesh>
        <sphereGeometry args={[MARS_R, 64, 48]} />
        <meshToonMaterial map={map} gradientMap={GRADIENT} />
      </mesh>
      <mesh material={air}>
        <sphereGeometry args={[MARS_R * 1.025, 64, 48]} />
      </mesh>
      <points geometry={lights}>
        <pointsMaterial color={LAMP} size={2.5} sizeAttenuation={false} />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------------
// small parts
// ---------------------------------------------------------------------------

//a box stretched between two points
function Strut({ from, to, width, color }: { from: Vec3; to: Vec3; width: number; color: string }) {
  const a = new THREE.Vector3(...from);
  const dir = new THREE.Vector3(...to).sub(a);
  const length = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  return (
    <mesh position={a.addScaledVector(dir, length / 2)} quaternion={q} material={toon(color)}>
      <boxGeometry args={[width, length, width]} />
    </mesh>
  );
}

//a cylinder lying along z
function Tube({ r, r2 = r, from, to, color, at = [0, 0] }: { r: number; r2?: number; from: number; to: number; color: string; at?: [number, number] }) {
  return (
    <mesh position={[at[0], at[1], (from + to) / 2]} rotation={[Math.PI / 2, 0, 0]} material={toon(color)}>
      <cylinderGeometry args={[r2, r, to - from, 20]} />
    </mesh>
  );
}

//a light that blinks on and off
function Blink({ at, color, period = 1.6, offset = 0, size = 0.12 }: { at: Vec3; color: string; period?: number; offset?: number; size?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    mesh.current!.visible = (clock.elapsedTime / period + offset) % 1 < 0.25;
  });
  return (
    <mesh ref={mesh} position={at} material={glow(color)}>
      <sphereGeometry args={[size, 8, 6]} />
    </mesh>
  );
}

//a person in a flight suit, in metres, floating with their hips at the origin and facing +z
function Person({ suit, skin = '#9a6a4a', hair = '#1d1714', material }: { suit: string; skin?: string; hair?: string; material?: THREE.Material }) {
  const m = (color: string) => material ?? toon(color);
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={m(suit)}>
        <capsuleGeometry args={[0.2, 0.42, 4, 12]} />
      </mesh>
      <mesh position={[0, 0.86, 0]} material={m(skin)}>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.89, -0.01]} material={m(hair)}>
        <sphereGeometry args={[0.137, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {!material &&
        [-0.045, 0.045].map((x) => (
          <mesh key={x} position={[x, 0.88, 0.122]} material={glow('#1a1410')}>
            <sphereGeometry args={[0.016, 6, 4]} />
          </mesh>
        ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.27, 0.38, 0.04]} rotation={[0.3, 0, s * 0.45]} material={m(suit)}>
            <capsuleGeometry args={[0.06, 0.42, 4, 8]} />
          </mesh>
          <mesh position={[s * 0.1, -0.28, 0.06]} rotation={[0.35 - s * 0.15, 0, s * 0.06]} material={m(suit)}>
            <capsuleGeometry args={[0.085, 0.55, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Halden Station
// ---------------------------------------------------------------------------

function Station() {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    ring.current!.rotation.z += (dt * Math.PI * 2) / 40;
  });

  const windows = Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2);
  return (
    <group>
      <Tube r={1.2} from={-4.5} to={4.5} color={PANEL} />
      <Tube r={1.23} from={-3.6} to={-3.1} color={ORANGE} />
      <Tube r={1.23} from={3.1} to={3.6} color={ORANGE} />
      <Tube r={0.7} from={-5.2} to={-4.5} color={DARK} />

      <group ref={ring}>
        <mesh material={toon(HULL)}>
          <torusGeometry args={[7, 0.9, 14, 64]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 3.65, Math.sin(a) * 3.65, 0]} rotation={[0, 0, a - Math.PI / 2]} material={toon(PANEL)}>
              <cylinderGeometry args={[0.25, 0.25, 4.9, 10]} />
            </mesh>
          );
        })}
        {windows.map((a) => (
          <mesh key={a} position={[Math.cos(a) * 7.86, Math.sin(a) * 7.86, 0]} rotation={[0, 0, a]} material={glow(LAMP)}>
            <boxGeometry args={[0.06, 0.32, 0.5]} />
          </mesh>
        ))}
      </group>

      {/* solar wings on a truss across the back of the hub */}
      <mesh position={[0, 0, -4]} material={toon(PANEL)}>
        <boxGeometry args={[34, 0.25, 0.25]} />
      </mesh>
      {[-13, -7, 7, 13].map((x) => (
        <group key={x} position={[x, 0, -4]} rotation={[0.5, 0, 0]}>
          <mesh material={toon(CELLS)}>
            <boxGeometry args={[5.4, 0.06, 3]} />
          </mesh>
          <mesh position={[0, 0.04, 0]} material={toon(GOLD)}>
            <boxGeometry args={[5.4, 0.04, 0.12]} />
          </mesh>
        </group>
      ))}
      <Blink at={[-17, 0, -4]} color="#ff4a3a" />
      <Blink at={[17, 0, -4]} color="#4aff7a" offset={0.5} />
      <Blink at={[0, 1.3, 0]} color="#ffffff" period={2.2} size={0.08} />

      {/* the observation module, with the cupola at its foot */}
      <mesh position={[0, (CUPOLA[1] - 1.1) / 2, CUPOLA[2]]} material={toon(PANEL)}>
        <cylinderGeometry args={[0.45, 0.45, -1.1 - CUPOLA[1], 16, 1, true]} />
      </mesh>
      <mesh position={[0, CUPOLA[1] + 0.6, CUPOLA[2]]} material={toon(ORANGE)}>
        <cylinderGeometry args={[0.47, 0.47, 0.25, 16, 1, true]} />
      </mesh>
    </group>
  );
}

const SCREEN_STATUS: [string, string][] = [
  ['HALDEN STATION  /  SYSTEMS', GREENISH],
  ['RING SPIN      1.50 RPM   OK', GREENISH],
  ['CABIN O2       21.0 %     OK', GREENISH],
  ['COOLANT LOOP B 4.1 BAR    OK', GREENISH],
  ['DAY 2,931 ON STATION', '#4f8f7c'],
];

const SCREEN_MESSAGE: [string, string][] = [
  ['PRIORITY MESSAGE', ORANGE],
  ['FROM  MSV MERIDIAN', GREENISH],
  ['      CMDR A. OKAFOR', GREENISH],
  ['RE    ARES LANDING CREW', GREENISH],
  ['[ OPEN ]', ORANGE],
];

//the room at the bottom of the observation module: a warm vestibule over a ring of windows
function Cupola({ cue }: { cue: Cue }) {
  const status = useMemo(() => screenTexture(SCREEN_STATUS), []);
  const message = useMemo(() => screenTexture(SCREEN_MESSAGE), []);
  useFrame(({ clock }) => {
    HOLO.uniforms.time.value = clock.elapsedTime;
  });

  const hex = (r: number, y: number) =>
    Array.from({ length: 6 }, (_, i): Vec3 => {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
  const top = hex(3, 0);
  const bottom = hex(2, -2.2);

  return (
    <group position={CUPOLA} scale={M}>
      <mesh position={[0, 1.3, 0]} material={toon(CABIN, THREE.BackSide)}>
        <cylinderGeometry args={[3, 3, 2.6, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon(PANEL)}>
        <circleGeometry args={[3, 24]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.95, 2.2, Math.sin(a) * 2.95]} rotation={[0, -a, 0]} material={glow(i % 3 ? LAMP : GREENISH)}>
            <boxGeometry args={[0.02, 0.06, 0.3]} />
          </mesh>
        );
      })}

      {top.map((p, i) => (
        <group key={i}>
          <Strut from={p} to={top[(i + 1) % 6]} width={0.14} color={HULL} />
          <Strut from={p} to={bottom[i]} width={0.14} color={HULL} />
          <Strut from={bottom[i]} to={bottom[(i + 1) % 6]} width={0.14} color={HULL} />
        </group>
      ))}

      <mesh position={[0, 0.2, -2.3]} material={toon(PANEL)}>
        <boxGeometry args={[1.6, 0.5, 0.6]} />
      </mesh>
      <mesh position={[0, 0.46, -2.12]} rotation={[-0.9, 0, 0]}>
        <planeGeometry args={[1.3, 0.8]} />
        <meshBasicMaterial map={cue.message ? message : status} />
      </mesh>
      <mesh position={[0, 0.47, -2.45]} material={glow(cue.holo ? CYAN : DARK)}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
      </mesh>
      {cue.holo && (
        <group position={[0, 0.95, -2.45]} scale={0.5}>
          <Person suit={CYAN} material={HOLO} />
        </group>
      )}
      {cue.teo && (
        <group position={[0.9, -0.5, -0.7]} rotation={[0.15, -0.69, 0.1]}>
          <Person suit="#2c3e5c" skin="#c99a76" hair="#4a3426" />
        </group>
      )}
      <pointLight position={[0, 2, 0.5]} color="#ffbe7a" intensity={1.6} distance={8} decay={0} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// the Meridian
// ---------------------------------------------------------------------------

function nameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 80;
  const c = canvas.getContext('2d')!;
  c.font = 'bold 64px "Helvetica Neue", Arial, sans-serif';
  c.fillStyle = '#2b2f35';
  c.textBaseline = 'middle';
  c.fillText('M E R I D I A N', 8, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const REPORT: [string, string][] = [
  ['INCIDENT REPORT  AL-7', ORANGE],
  ['ARES LANDER 2  /  TOUCHDOWN', GREENISH],
  ['LEG 3 SEAL FAILURE. VEHICLE', GREENISH],
  ['TIPPED. NO CREW ABOARD.', GREENISH],
  ['', GREENISH],
  ['SIGNED  OYELARAN  KASS  PARK', '#4f8f7c'],
  ['        ______________', '#4f8f7c'],
];

//the crew room inside the hab, built in metres around the hab's middle
function CrewRoom() {
  const report = useMemo(
    () =>
      screenTexture(REPORT, (c) => {
        //the lander, lying on its side
        c.strokeStyle = ORANGE;
        c.lineWidth = 3;
        c.save();
        c.translate(520, 250);
        c.rotate(0.9);
        c.strokeRect(-30, -40, 60, 60);
        c.beginPath();
        c.moveTo(-30, 20); c.lineTo(-55, 60);
        c.moveTo(30, 20); c.lineTo(55, 60);
        c.stroke();
        c.restore();
      }),
    [],
  );
  const bunks = [-2.4, -0.8, 0.8, 2.4].flatMap((z, i) => [
    { z, a: Math.PI * 0.8, color: [ORANGE, '#3d6fa8', '#5d8a4a', GOLD][i] },
    { z, a: Math.PI * 1.2, color: ['#7a4a8a', ORANGE, '#3d6fa8', '#a8483d'][i] },
  ]);
  return (
    <group position={[0, 0, 4.2]} scale={M}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={toon(CABIN, THREE.BackSide)}>
        <cylinderGeometry args={[5, 5, 10, 24]} />
      </mesh>
      {bunks.map(({ z, a, color }) => (
        <group key={`${z}${a}`} position={[Math.cos(a) * 4.5, Math.sin(a) * 4.5, z]} rotation={[0, 0, a]}>
          <mesh material={toon(PANEL)}>
            <boxGeometry args={[0.5, 1.2, 1.4]} />
          </mesh>
          <mesh position={[-0.2, 0, 0]} material={toon(color)}>
            <capsuleGeometry args={[0.35, 0.6, 4, 10]} />
          </mesh>
        </group>
      ))}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x * 2, 4.8, 0]} material={glow(LAMP)}>
          <boxGeometry args={[0.3, 0.1, 9]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -4.9]}>
        <planeGeometry args={[3, 1.9]} />
        <meshBasicMaterial map={report} />
      </mesh>
      <group position={[-1.2, -0.4, 0.4]} rotation={[0.2, 0.9, -0.3]}>
        <Person suit={ORANGE} skin="#6b4630" />
      </group>
      <group position={[1.1, 0.6, -0.6]} rotation={[-0.3, -0.6, 0.4]}>
        <Person suit="#3d6fa8" skin="#e0b494" hair="#b07a3a" />
      </group>
      <group position={[0.1, -1.4, -1.8]} rotation={[0.5, 0.3, 1.2]}>
        <Person suit="#5d8a4a" skin="#5a3a28" />
      </group>
      <group position={[-0.2, 1.6, -2.4]} rotation={[0.1, 0.2, -2.6]}>
        <Person suit={PANEL} skin="#c48d6a" hair="#2a2a2a" />
      </group>
      <pointLight position={[0, 2, 0]} color="#ffcf98" intensity={1.4} distance={14} decay={0} />
    </group>
  );
}

const scratch = new THREE.Vector3();

//where the ship is for each state, t seconds into the cue. It flies nose first, engine (local +z) trailing
function placeShip(g: THREE.Object3D, state: ShipState, t: number) {
  const travel = (dir: THREE.Vector3) => g.lookAt(scratch.copy(g.position).sub(dir));
  if (state === 'docked' || state === 'undocking') {
    g.position.set(...DOCK);
    if (state === 'undocking') g.position.z += t * 0.35;
    g.rotation.set(0, 0, 0);
  } else if (state === 'burn') {
    g.position.copy(BURN).addScaledVector(AWAY, 0.1 * t * t);
    travel(AWAY);
  } else if (state === 'departing') {
    g.position.set(...DOCK).addScaledVector(AWAY, 14 + 0.12 * t * t);
    travel(AWAY);
  } else if (state === 'star') {
    g.position.set(...DOCK).addScaledVector(AWAY, 420 + t * 2);
    travel(AWAY);
  } else if (state === 'cruise' || state === 'mars') {
    g.position.set(...(state === 'cruise' ? CRUISE : MARS_SHIP));
    travel(new THREE.Vector3(...MARS).sub(g.position).normalize());
  }
}

function Meridian({ state, cueKey }: { state: ShipState; cueKey: string }) {
  const ship = useRef<THREE.Group>(null);
  const plume = useRef<THREE.Group>(null);
  const started = useRef({ key: '', at: 0 });
  const name = useMemo(() => nameTexture(), []);
  const flare = useMemo(() => glowTexture(), []);
  const burning = state === 'burn' || state === 'departing' || state === 'star';

  useFrame(({ clock }) => {
    if (started.current.key !== cueKey) started.current = { key: cueKey, at: clock.elapsedTime };
    ship.current!.visible = state !== 'gone';
    placeShip(ship.current!, state, clock.elapsedTime - started.current.at);
    const f = 1 + Math.sin(clock.elapsedTime * 40) * 0.04 + Math.sin(clock.elapsedTime * 17) * 0.05;
    plume.current!.scale.set(f, f, 1 + (f - 1) * 3);
  });

  const windows = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);
  return (
    <group ref={ship}>
      <Tube r={0.6} from={0} to={0.6} color={PANEL} />
      <Tube r={0.6} r2={1.5} from={0.6} to={1.2} color={HULL} />
      <Tube r={1.5} from={1.2} to={7.2} color={HULL} />
      <Tube r={1.52} from={1.8} to={2.15} color={ORANGE} />
      <Tube r={1.52} from={6.4} to={6.75} color={ORANGE} />
      <Tube r={1.5} r2={0.6} from={7.2} to={7.8} color={HULL} />
      {windows.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 1.5, Math.sin(a) * 1.5, 2.6]} rotation={[0, 0, a]} material={glow(LAMP)}>
          <boxGeometry args={[0.04, 0.22, 0.45]} />
        </mesh>
      ))}
      <mesh position={[-1.515, 0, 4.6]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.2, 0.5]} />
        <meshBasicMaterial map={name} transparent />
      </mesh>
      <mesh position={[2.3, 0, 5]} material={toon(PANEL)}>
        <boxGeometry args={[1.6, 0.08, 0.08]} />
      </mesh>
      <mesh position={[3.1, 0, 5]} rotation={[0, 0, -Math.PI / 2]} material={toon(HULL, THREE.DoubleSide)}>
        <cylinderGeometry args={[0.9, 0.15, 0.3, 20, 1, true]} />
      </mesh>

      {/* the truss, with radiator fins either side */}
      {[[-0.55, -0.55], [-0.55, 0.55], [0.55, -0.55], [0.55, 0.55]].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, 11.8]} material={toon(PANEL)}>
          <boxGeometry args={[0.12, 0.12, 8]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => 8.3 + i).flatMap((z) =>
        [-0.55, 0.55].flatMap((s) => [
          <mesh key={`x${z}${s}`} position={[0, s, z]} material={toon(PANEL)}>
            <boxGeometry args={[1.22, 0.07, 0.07]} />
          </mesh>,
          <mesh key={`y${z}${s}`} position={[s, 0, z]} material={toon(PANEL)}>
            <boxGeometry args={[0.07, 1.22, 0.07]} />
          </mesh>,
        ]),
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.75, 0, 11.8]} material={toon(HULL)}>
          <boxGeometry args={[2.2, 0.04, 6]} />
        </mesh>
      ))}
      <Blink at={[-2.9, 0, 11.8]} color="#ff4a3a" />
      <Blink at={[2.9, 0, 11.8]} color="#4aff7a" offset={0.5} />

      {/* fuel, engine and bell */}
      <Tube r={0.5} from={15.8} to={18.2} color={DARK} />
      {[[0.95, 0], [-0.95, 0], [0, 0.95], [0, -0.95]].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, 17]} material={toon(GOLD)}>
          <sphereGeometry args={[0.95, 20, 14]} />
        </mesh>
      ))}
      <Tube r={0.9} from={18.2} to={19.4} color={PANEL} />
      <mesh position={[0, 0, 20.6]} rotation={[-Math.PI / 2, 0, 0]} material={toon(DARK, THREE.DoubleSide)}>
        <coneGeometry args={[1.5, 2.4, 24, 1, true]} />
      </mesh>

      <group ref={plume} position={[0, 0, 21.8]} visible={burning}>
        <mesh position={[0, 0, 4.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.3, 9, 20, 1, true]} />
          <meshBasicMaterial color="#8fc7ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.7, 5, 16, 1, true]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <sprite scale={0.06}>
          <spriteMaterial map={flare} color="#d8ecff" sizeAttenuation={false} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
        </sprite>
        <pointLight color="#bfe0ff" intensity={burning ? 6 : 0} distance={25} decay={0} />
      </group>

      {/* the crew room is inside the hab */}
      <CrewRoom />
    </group>
  );
}

// ---------------------------------------------------------------------------
// sound
// ---------------------------------------------------------------------------

const BEDS = {
  hum: new URL('./sounds/hum.m4a', import.meta.url).href,
  space: new URL('./sounds/space.m4a', import.meta.url).href,
  ship: new URL('./sounds/ship.m4a', import.meta.url).href,
  lonely: new URL('./sounds/lonely.m4a', import.meta.url).href,
};
type Bed = keyof typeof BEDS;

const LONELY = new Set(['night_window', 'watch_burn', 'meridian_star', 'earth_small', 'reflect', 'closing']);

function mixFor(key: string, { set }: Cue): Partial<Record<Bed, number>> {
  if (LONELY.has(key)) return { lonely: 0.5, hum: set === 'cupola' ? 0.15 : 0 };
  if (set === 'cupola') return { hum: 0.4, space: 0.12 };
  if (set === 'crew') return { ship: 0.45, hum: 0.15 };
  return { space: 0.55 };
}

const HATCH = new URL('./sounds/hatch.m4a', import.meta.url).href;
const BURN_SOUND = new URL('./sounds/burn.m4a', import.meta.url).href;
const ONE_SHOTS: Record<string, OneShot> = {
  message: { src: new URL('./sounds/message.m4a', import.meta.url).href, volume: 0.6, delay: 0.4 },
  hologram: { src: new URL('./sounds/holo.m4a', import.meta.url).href, volume: 0.45 },
  meridian_dock: { src: HATCH, volume: 0.5, delay: 0.3 },
  undock: { src: HATCH, volume: 0.6 },
  burn: { src: BURN_SOUND, volume: 0.8, delay: 0.3 },
  watch_burn: { src: BURN_SOUND, volume: 0.3, delay: 0.5 },
};

const MASTER_VOLUME = 0.8;
const CROSSFADE = 2.5; //seconds


// ---------------------------------------------------------------------------
// the scene
// ---------------------------------------------------------------------------

function TheOffer({ animation }: { animation: string }) {
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
    if (!cues[animation]) console.warn(`The Offer has no cue for the animation "${animation}"`);
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
    sound.current?.mix(mixFor(active, cues[active]));
    const shot = ONE_SHOTS[active];
    if (shot) sound.current?.play(shot);
  }, [active]);

  const cue = cues[active];
  return (
    <div style={styles.scene}>
      <style>{keyframes}</style>
      <Canvas flat camera={{ fov: 50, near: CLIP[cue.set][0], far: CLIP[cue.set][1], position: cue.at }} dpr={[1, 2]}>
        <color attach="background" args={[VOID]} />
        <CameraRig cue={cue} />
        <Sky night={!!cue.night} />
        <Earth />
        <Mars />
        <Station />
        <Cupola cue={cue} />
        <Meridian state={cue.ship ?? 'docked'} cueKey={active} />
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
@keyframes the-offer-dip {
  0%, 20% { opacity: 1; }
  100% { opacity: 0; }
}
`;

const styles: Record<string, CSSProperties> = {
  scene: {
    position: 'absolute',
    inset: 0,
    background: VOID,
  },
  dip: {
    position: 'absolute',
    inset: 0,
    background: VOID,
    pointerEvents: 'none',
    animation: 'the-offer-dip 1.4s ease-out forwards',
  },
  card: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 260,
    color: HULL,
    fontFamily: '"Futura", "Century Gothic", "Avenir Next", sans-serif',
    pointerEvents: 'none',
    transition: 'opacity 1.2s ease',
  },
  kicker: {
    fontSize: 18,
    letterSpacing: 8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  name: {
    fontSize: 64,
    letterSpacing: 6,
    textTransform: 'uppercase',
    color: ORANGE,
  },
};

export default TheOffer;
