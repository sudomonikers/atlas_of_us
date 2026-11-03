import { useEffect, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LAYER_COLOURS, type LayerId } from './anatomy_layers';

//colours as hex, for the materials; they match the palette in App.css
const LIT = 0xad2831;
const NOTED = 0xd9777d;
//how far a click can drag before it's a turn of the body instead
const CLICK_SLOP = 5;

interface AnatomyViewerProps {
  layers: Set<LayerId>; //the layers showing
  lit: Set<string>; //the meshes lit up, by element id
  noted: Set<string>; //the meshes with something the user has noted
  onPick: (element: string) => void;
  onLoading: (loading: boolean) => void;
}

const litMaterial = new THREE.MeshToonMaterial({ color: LIT, emissive: LIT, emissiveIntensity: 0.35 });
const notedMaterial = new THREE.MeshToonMaterial({ color: NOTED });

//one layer's meshes and the materials they switch between
interface Loaded {
  meshes: THREE.Mesh[];
  base: THREE.Material;
  dim: THREE.Material;
}

//the materials for what's lit and noted: lit meshes glow, noted ones blush, and when anything's lit the rest fade
function paint(layers: Map<LayerId, Loaded>, lit: Set<string>, noted: Set<string>) {
  for (const layer of layers.values()) {
    for (const mesh of layer.meshes) {
      mesh.material = lit.has(mesh.name) ? litMaterial : lit.size ? layer.dim : noted.has(mesh.name) ? notedMaterial : layer.base;
      mesh.renderOrder = lit.has(mesh.name) ? 1 : 0;
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

//the 3D body: each layer is loaded the first time it's shown, drawn with cel shading in its colour, and turned with the
//mouse or a finger. A lit mesh glows red and everything else fades back so it stands out
export function AnatomyViewer({ layers, lit, noted, onPick, onLoading }: AnatomyViewerProps) {
  const holder = useRef<HTMLDivElement>(null);
  const scene = useRef<THREE.Scene>(null);
  const loaded = useRef(new Map<LayerId, Loaded>());
  const loading = useRef(new Set<LayerId>());
  const render = useRef<() => void>(() => {});
  const frame = useRef<(box: THREE.Box3) => void>(() => {});
  const framed = useRef(false);
  //the latest props, for the handlers made once when the scene is set up
  const latest = useRef({ lit, noted, onPick, onLoading });
  useEffect(() => {
    latest.current = { lit, noted, onPick, onLoading };
  });

  //the renderer, camera, lights and controls, made once
  useEffect(() => {
    const element = holder.current;
    const layers = loaded.current;
    const pending = loading.current;
    if (!element) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    //the canvas fills its holder; setSize below changes only its drawing size, so it stays sharp on dense screens
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    element.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    scene.current = world;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
    camera.position.set(0, 0.9, 4.2);
    world.add(new THREE.HemisphereLight(0xfffce8, 0x393d3f, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(1, 2, 3);
    camera.add(sun);
    world.add(camera);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.85, 0.1); //the middle of the body, which stands 1.7 m tall facing +z
    controls.enableDamping = true;
    controls.minDistance = 0.3;
    controls.maxDistance = 6;

    //points the camera at the middle of what's loaded, far enough back that all of it fits
    frame.current = (box: THREE.Box3) => {
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fit = Math.max(size.y, size.x / camera.aspect) / 2 / Math.tan(fov / 2);
      controls.target.copy(centre);
      camera.position.set(centre.x, centre.y, centre.z + fit * 1.15);
      draw();
    };

    let animation = 0;
    const draw = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(() => {
        if (controls.update()) draw();
        renderer.render(world, camera);
      });
    };
    render.current = draw;
    controls.addEventListener('change', draw);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = element;
      renderer.setSize(w, h, false);
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
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.dispose();
      element.removeChild(renderer.domElement);
      layers.clear();
      pending.clear();
      framed.current = false;
    };
  }, []);

  //loads each layer the first time it's shown, and shows and hides the loaded ones
  useEffect(() => {
    const world = scene.current;
    if (!world) return;
    show(loaded.current, layers);
    const missing = [...layers].filter((id) => !loaded.current.has(id) && !loading.current.has(id));
    if (!missing.length) return render.current();
    onLoading(true);
    const loader = new GLTFLoader();
    for (const id of missing) {
      loading.current.add(id);
      loader.load(`/anatomy/${id}.glb`, (gltf) => {
        loading.current.delete(id);
        const tones = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
        tones.needsUpdate = true;
        const colour = new THREE.Color(LAYER_COLOURS[id]);
        const base = new THREE.MeshToonMaterial({ color: colour, gradientMap: tones, transparent: id === 'skin', opacity: id === 'skin' ? 0.3 : 1, depthWrite: id !== 'skin' });
        const dim = new THREE.MeshToonMaterial({ color: colour, gradientMap: tones, transparent: true, opacity: 0.12, depthWrite: false });
        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.computeVertexNormals();
            o.material = base;
            meshes.push(o);
          }
        });
        gltf.scene.visible = layers.has(id);
        world.add(gltf.scene);
        if (!framed.current) {
          framed.current = true;
          frame.current(new THREE.Box3().setFromObject(gltf.scene));
        }
        loaded.current.set(id, { meshes, base, dim });
        paint(loaded.current, latest.current.lit, latest.current.noted);
        render.current();
        if (!loading.current.size) latest.current.onLoading(false);
      }, undefined, () => {
        loading.current.delete(id);
        if (!loading.current.size) latest.current.onLoading(false);
      });
    }
  }, [layers, onLoading]);

  useEffect(() => {
    paint(loaded.current, lit, noted);
    render.current();
  }, [lit, noted]);

  return <div ref={holder} style={styles.holder} role="img" aria-label="A 3D model of the human body. Drag to turn it, scroll or pinch to zoom, and click a part to learn about it." />;
}

const styles: Record<string, CSSProperties> = {
  holder: {
    width: '100%',
    height: 'min(70vh, 620px)',
    minHeight: 360,
    touchAction: 'none',
    cursor: 'grab',
  },
};
