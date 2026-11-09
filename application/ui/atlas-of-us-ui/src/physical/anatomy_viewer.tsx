import { useEffect, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LAYER_COLOURS, type LayerId } from './anatomy_layers';
import { HEX } from '../shared_components/palette';

//what's lit up, and what the user has noted, which blushes
const LIT = HEX.brownRed;
const NOTED = 0xd9777d;
//how far a click can drag before it's a turn of the body instead
const CLICK_SLOP = 5;
//how long the camera takes to fly to what's in focus, in milliseconds
const FLY_MS = 700;
//the closest the camera frames anything from, so a small part doesn't fill the screen
const NEAREST = 0.55;

interface AnatomyViewerProps {
  layers: Set<LayerId>; //the layers showing
  lit: Set<string>; //the meshes lit up, by element id
  noted: Set<string>; //the meshes with something the user has noted
  tints: Map<string, number>; //meshes drawn in a colour of their own, such as where the user stands on what they rest on
  focus: Set<string>; //the meshes the camera frames, or the whole body when there are none
  spin: boolean; //turn slowly by itself
  pulse: boolean; //the lit meshes breathe, to draw the eye
  onPick: (element: string) => void;
  onLoading: (loading: boolean) => void;
}

//two tones of cel shading, shared by every material, for a flat comic fill
const tones = new THREE.DataTexture(new Uint8Array([170, 255]), 2, 1, THREE.RedFormat);
tones.needsUpdate = true;
const litMaterial = new THREE.MeshToonMaterial({ color: LIT, emissive: LIT, emissiveIntensity: 0.2, gradientMap: tones });
const toons = new Map<number, THREE.Material>();
const toon = (colour: number) => {
  let material = toons.get(colour);
  if (!material) toons.set(colour, (material = new THREE.MeshToonMaterial({ color: colour, gradientMap: tones })));
  return material;
};
//the figure's shape, for its fill and outline
const shellMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
//each mesh drawn in a colour of its own for the ink pass: its number in red and green, and what it's drawn as in blue,
//so lines fall between parts and between what's drawn differently, and never across a part's own faces
const ids = new Map<string, THREE.Material>();
const idOf = (n: number, group: number) => {
  const key = `${n}:${group}`;
  let material = ids.get(key);
  if (!material) ids.set(key, (material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB((n % 256) / 255, Math.floor(n / 256) / 255, group / 255, THREE.LinearSRGBColorSpace) })));
  return material;
};
//what a mesh is drawn as, which its ink depends on: parts drawn in the same way get fine lines between them, and
//strong ones against anything else
const GROUP = { ghost: 0, base: 1, noted: 2, tint: 3, lit: 4 } as const;

//how a mesh is drawn: lit ones in red over everything, tinted ones in their colour, and when anything's lit the rest
//fade to pencil lines; otherwise noted ones blush and the rest take their layer's colour
interface Look {
  group: number;
  fill?: THREE.Material;
}

//one layer's meshes, each with its number for the ink pass
interface Loaded {
  meshes: THREE.Mesh[];
  colour: number;
}

function paint(layers: Map<LayerId, Loaded>, lit: Set<string>, noted: Set<string>, tints: Map<string, number>) {
  for (const layer of layers.values()) {
    for (const mesh of layer.meshes) {
      const colour = tints.get(mesh.name);
      const look: Look = lit.has(mesh.name)
        ? { group: GROUP.lit, fill: litMaterial }
        : colour !== undefined
          ? { group: GROUP.tint, fill: toon(colour) }
          : lit.size
            ? { group: GROUP.ghost }
            : noted.has(mesh.name)
              ? { group: GROUP.noted, fill: toon(NOTED) }
              : { group: GROUP.base, fill: toon(layer.colour) };
      mesh.userData.look = look;
    }
  }
}

//shows the loaded layers that are on, and hides the rest
function show(layers: Map<LayerId, Loaded>, on: Set<LayerId>) {
  for (const [id, layer] of layers) {
    const group = layer.meshes[0]?.parent;
    if (group) group.visible = on.has(id);
  }
}

//puts the passes together: the figure on the paper, the pencil lines of what's faded, the fill pushed a little off
//register from its ink like a printed comic, the ink, and the figure's outline over it all
const inkShader = {
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tShell, tColour, tSolid, tGhost;
    uniform vec2 px;
    uniform float scale;
    varying vec2 vUv;
    const vec3 INK = vec3(0.224, 0.239, 0.247);
    const vec3 FIGURE = vec3(0.89, 0.925, 0.937);
    bool differs(vec4 a, vec4 b) { return any(greaterThan(abs(a - b), vec4(0.5 / 255.0))); }
    //lines between parts: strong against nothing or what's drawn differently, fine between parts drawn alike
    float lines(sampler2D t, vec2 uv, float w) {
      vec4 c = texture2D(t, uv);
      float e = 0.0;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854;
        vec4 n = texture2D(t, uv + vec2(cos(a), sin(a)) * w * px);
        if (abs(n.a - c.a) > 0.5) e = 1.0;
        else if (c.a > 0.5 && differs(n, c)) e = max(e, abs(n.b - c.b) > 0.5 / 255.0 ? 1.0 : 0.4);
      }
      return e;
    }
    //the figure's outline, drawn just outside its shape so thin fingers keep their fill
    float outline(vec2 uv, float w) {
      float c = texture2D(tShell, uv).a;
      float e = 0.0;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 0.5236;
        vec2 d = vec2(cos(a), sin(a)) * px;
        e = max(e, texture2D(tShell, uv + d * w).a - c);
        e = max(e, texture2D(tShell, uv + d * w * 0.5).a - c);
      }
      return e;
    }
    void main() {
      vec4 shell = texture2D(tShell, vUv);
      vec4 fill = texture2D(tColour, vUv + vec2(2.0, -2.0) * scale * px);
      float solid = texture2D(tSolid, vUv).a;
      vec3 colour = FIGURE;
      float alpha = shell.a;
      if (fill.a > 0.5) {
        colour = pow(fill.rgb, vec3(1.0 / 2.2));
        alpha = 1.0;
      }
      float ink = max(lines(tSolid, vUv, 1.2 * scale), lines(tGhost, vUv, 1.0 * scale) * 0.3 * (1.0 - solid));
      ink = max(ink, outline(vUv, 3.5 * scale));
      colour = mix(colour, INK, ink);
      alpha = max(alpha, ink);
      gl_FragColor = vec4(colour * alpha, alpha);
    }`,
};

//where the camera flies from and to
interface Flight {
  from: { target: THREE.Vector3; position: THREE.Vector3 };
  to: { target: THREE.Vector3; position: THREE.Vector3 };
  start: number;
}

//the 3D body, drawn as a comic x-ray: the skin is a flat figure with a thick ink outline, and the layers showing are
//drawn inside it in flat colour with ink between their parts. Each layer is loaded the first time it's shown, and the
//body is turned with the mouse or a finger. A lit mesh is drawn in red and everything else fades to pencil lines so it
//stands out, and the camera flies to whatever's in focus
export function AnatomyViewer({ layers, lit, noted, tints, focus, spin, pulse, onPick, onLoading }: AnatomyViewerProps) {
  const holder = useRef<HTMLDivElement>(null);
  const scene = useRef<THREE.Scene>(null);
  const controls = useRef<OrbitControls>(null);
  const loaded = useRef(new Map<LayerId, Loaded>());
  const loading = useRef(new Set<LayerId>());
  const render = useRef<() => void>(() => {});
  const aim = useRef<(elements: Set<string>) => void>(() => {});
  const framed = useRef(false); //whether the camera has flown in to the body yet
  const numbered = useRef(0); //how many meshes have been numbered for the ink pass
  //the latest props, for the handlers made once when the scene is set up
  const latest = useRef({ layers, lit, noted, tints, focus, pulse, onPick, onLoading });
  useEffect(() => {
    latest.current = { layers, lit, noted, tints, focus, pulse, onPick, onLoading };
  });

  //the renderer, camera, lights and controls, made once
  useEffect(() => {
    const element = holder.current;
    const layers = loaded.current;
    const pending = loading.current;
    if (!element) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = false;
    //the canvas fills its holder; setSize below changes only its drawing size, so it stays sharp on dense screens
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    element.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    scene.current = world;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
    camera.position.set(0, 0.9, 4.2);
    world.add(new THREE.HemisphereLight(HEX.ivory, HEX.gunmetal, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(1, 2, 3);
    camera.add(sun);
    world.add(camera);
    const orbit = new OrbitControls(camera, renderer.domElement);
    controls.current = orbit;
    orbit.target.set(0, 0.85, 0.1); //the middle of the body, which stands 1.7 m tall facing +z
    orbit.enableDamping = true;
    orbit.minDistance = 0.3;
    orbit.maxDistance = 6;
    orbit.autoRotateSpeed = 1.2;

    let flight: Flight | null = null;
    //flies the camera to frame the meshes, from the side it's looking from now, or to the whole body when none of them
    //are showing
    aim.current = (elements: Set<string>) => {
      const box = new THREE.Box3();
      for (const layer of loaded.current.values()) {
        for (const mesh of layer.meshes) if (elements.has(mesh.name) && mesh.parent?.visible) box.expandByObject(mesh);
      }
      //nothing in focus frames the whole of what's showing
      if (box.isEmpty()) for (const layer of loaded.current.values()) if (layer.meshes[0]?.parent?.visible) box.expandByObject(layer.meshes[0].parent);
      if (box.isEmpty()) return;
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fit = Math.max(NEAREST, (Math.max(size.y, size.x / camera.aspect, size.z) / 2 / Math.tan(fov / 2)) * 1.3);
      const side = camera.position.clone().sub(orbit.target).normalize();
      flight = {
        from: { target: orbit.target.clone(), position: camera.position.clone() },
        to: { target: centre, position: centre.clone().addScaledVector(side, fit) },
        start: performance.now(),
      };
      draw();
    };

    let animation = 0;
    const draw = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame((now) => {
        let again = false;
        if (flight) {
          const t = Math.min(1, (now - flight.start) / FLY_MS);
          const eased = 1 - (1 - t) ** 3;
          orbit.target.lerpVectors(flight.from.target, flight.to.target, eased);
          camera.position.lerpVectors(flight.from.position, flight.to.position, eased);
          if (t < 1) again = true;
          else flight = null;
        }
        const breathing = latest.current.pulse && latest.current.lit.size > 0;
        litMaterial.emissiveIntensity = breathing ? 0.2 + 0.3 * Math.sin(now / 280) : 0.2;
        if (orbit.update() || again || breathing) draw();
        frame();
      });
    };

    //the passes the ink shader puts together, each drawn at the canvas's own size
    const targets = { shell: new THREE.WebGLRenderTarget(), colour: new THREE.WebGLRenderTarget(), solid: new THREE.WebGLRenderTarget(), ghost: new THREE.WebGLRenderTarget() };
    const ink = new THREE.ShaderMaterial({
      ...inkShader,
      uniforms: {
        tShell: { value: targets.shell.texture },
        tColour: { value: targets.colour.texture },
        tSolid: { value: targets.solid.texture },
        tGhost: { value: targets.ghost.texture },
        px: { value: new THREE.Vector2() },
        scale: { value: renderer.getPixelRatio() },
      },
      blending: THREE.NoBlending,
    });
    const page = new THREE.Scene();
    page.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ink));
    const flat = new THREE.Camera();

    //draws the meshes that pick a material, those lit last and over the rest
    const pass = (target: THREE.WebGLRenderTarget, pick: (mesh: THREE.Mesh, look: Look) => THREE.Material | undefined) => {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      for (const lit of [false, true]) {
        for (const layer of layers.values()) {
          for (const mesh of layer.meshes) {
            const look: Look = mesh.userData.look;
            const material = look && (look.group === GROUP.lit) === lit ? pick(mesh, look) : undefined;
            mesh.visible = !!material;
            if (material) mesh.material = material;
          }
        }
        renderer.render(world, camera);
        renderer.clearDepth();
      }
    };
    const frame = () => {
      //the figure is the skin's shape, whether or not the skin is showing
      const skin = layers.get('skin')?.meshes;
      const skinShown = skin?.[0]?.parent?.visible ?? false;
      renderer.setRenderTarget(targets.shell);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      if (skin) {
        for (const layer of layers.values()) for (const mesh of layer.meshes) mesh.visible = false;
        for (const mesh of skin) {
          mesh.visible = true;
          mesh.material = shellMaterial;
        }
        if (skin[0]?.parent) skin[0].parent.visible = true;
        renderer.render(world, camera);
        if (skin[0]?.parent) skin[0].parent.visible = skinShown;
      }
      pass(targets.colour, (_, look) => look.fill);
      pass(targets.solid, (mesh, look) => look.fill && idOf(mesh.userData.n, look.group));
      pass(targets.ghost, (mesh, look) => (look.group === GROUP.ghost ? idOf(mesh.userData.n, 0) : undefined));
      for (const layer of layers.values()) for (const mesh of layer.meshes) mesh.visible = true;
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(page, flat);
    };
    render.current = draw;
    orbit.addEventListener('change', draw);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = element;
      renderer.setSize(w, h, false);
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      for (const target of Object.values(targets)) target.setSize(size.x, size.y);
      ink.uniforms.px.value.set(1 / size.x, 1 / size.y);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    //a click, as opposed to a drag, picks the nearest visible mesh under it
    let down: { x: number; y: number } | null = null;
    const ray = new THREE.Raycaster();
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP) return;
      const box = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - box.left) / box.width) * 2 - 1, -((e.clientY - box.top) / box.height) * 2 + 1), camera);
      const visible = [...loaded.current.values()].flatMap((l) => l.meshes).filter((m) => m.visible && m.parent?.visible);
      const hit = ray.intersectObjects(visible, false)[0];
      if (hit) latest.current.onPick(hit.object.name);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animation);
      orbit.dispose();
      for (const target of Object.values(targets)) target.dispose();
      ink.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.dispose();
      element.removeChild(renderer.domElement);
      layers.clear();
      pending.clear();
      framed.current = false;
      numbered.current = 0;
    };
  }, []);

  //loads each layer the first time it's shown, and the skin straight away for the figure, and shows and hides the
  //loaded ones
  useEffect(() => {
    const world = scene.current;
    if (!world) return;
    show(loaded.current, layers);
    const missing = [...new Set<LayerId>(['skin', ...layers])].filter((id) => !loaded.current.has(id) && !loading.current.has(id));
    if (!missing.length) return render.current();
    onLoading(true);
    const loader = new GLTFLoader();
    for (const id of missing) {
      loading.current.add(id);
      loader.load(`/anatomy/${id}.glb`, (gltf) => {
        loading.current.delete(id);
        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.computeVertexNormals();
            o.userData.n = ++numbered.current;
            meshes.push(o);
          }
        });
        const { layers: on, focus } = latest.current;
        gltf.scene.visible = on.has(id);
        world.add(gltf.scene);
        loaded.current.set(id, { meshes, colour: LAYER_COLOURS[id] });
        paint(loaded.current, latest.current.lit, latest.current.noted, latest.current.tints);
        //the camera flies in once there's a body to see, and again when what it frames has just grown: the whole body
        //by a layer, or what's in focus by its meshes arriving
        const first = on.has(id) && !framed.current;
        if (on.has(id)) framed.current = true;
        if (on.has(id) && (first || !focus.size || meshes.some((m) => focus.has(m.name)))) aim.current(focus);
        else render.current();
        if (!loading.current.size) latest.current.onLoading(false);
      }, undefined, () => {
        loading.current.delete(id);
        if (!loading.current.size) latest.current.onLoading(false);
      });
    }
  }, [layers, onLoading]);

  useEffect(() => {
    paint(loaded.current, lit, noted, tints);
    render.current();
  }, [lit, noted, tints]);

  //the camera only moves when what's in focus changes, not when the same meshes come again after the data reloads
  const aimed = useRef<Set<string>>(null);
  useEffect(() => {
    const last = aimed.current;
    if (last && last.size === focus.size && [...focus].every((e) => last.has(e))) return;
    aimed.current = focus;
    aim.current(focus);
  }, [focus]);

  useEffect(() => {
    if (controls.current) controls.current.autoRotate = spin;
    render.current();
  }, [spin]);

  useEffect(() => render.current(), [pulse]);

  return <div ref={holder} style={styles.holder} role="img" aria-label="A 3D model of the human body. Drag to turn it, scroll or pinch to zoom, and click a part to learn about it." />;
}

const styles: Record<string, CSSProperties> = {
  holder: {
    width: '100%',
    height: '100%',
    touchAction: 'none',
    cursor: 'grab',
  },
};
