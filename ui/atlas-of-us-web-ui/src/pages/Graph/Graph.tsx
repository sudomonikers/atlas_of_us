import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { HttpService } from "../../services/http-service";
import { GraphUtils } from "./graph-utils";

import type {
  Neo4jApiResponse,
  ThreeContext,
} from "./graph-interfaces.interface";

import galaxyBackground from "../../assets/galaxy.jpeg";
import { NavBar } from "../../common-components/navbar/nav";

const http = new HttpService();
const graphUtils = new GraphUtils(http);

// Particle System Component
function ParticleSystem() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const boundarySize = 1500;
  const particleCount = 350;

  // Velocities and other particle-related states
  const velocities = useRef<THREE.Vector3[]>([]);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(particleCount * 3);
    const localVelocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Random positions within boundary
      dummy.position.set(
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2
      );

      // Random velocities
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      velocity.multiplyScalar(0.3 + Math.random() * 0.3);
      localVelocities.push(velocity);

      dummy.rotation.x = Math.random() * Math.PI * 2;
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.z = Math.random() * Math.PI * 2;
      dummy.scale.setScalar(Math.random() * 2 + 1);

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Color logic
      const color = new THREE.Color();
      const hue = Math.random() * 0.16 + 0.04;
      const saturation = Math.random() * 0.3 + 0.7;
      const lightness = Math.random() * 0.4 + 0.6;
      color.setHSL(hue, saturation, lightness);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    if (instancedMeshRef.current) {
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      (instancedMeshRef.current.geometry as THREE.SphereGeometry).setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3)
      );
    }

    velocities.current = localVelocities;
  }, []);

  useFrame(() => {
    if (!instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < velocities.current.length; i++) {
      instancedMeshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Move based on velocity
      dummy.position.add(velocities.current[i]);

      // Wrap around
      if (dummy.position.x > boundarySize) dummy.position.x = -boundarySize;
      if (dummy.position.x < -boundarySize) dummy.position.x = boundarySize;
      if (dummy.position.y > boundarySize) dummy.position.y = -boundarySize;
      if (dummy.position.y < -boundarySize) dummy.position.y = boundarySize;
      if (dummy.position.z > boundarySize) dummy.position.z = -boundarySize;
      if (dummy.position.z < -boundarySize) dummy.position.z = boundarySize;

      // Update rotation
      dummy.rotation.x += 0.002;
      dummy.rotation.y += 0.002;

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, particleCount]}
    >
      <sphereGeometry args={[2, 8, 8]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

//Background
function Background() {
  const { scene, gl } = useThree();
  const texture = useLoader(THREE.TextureLoader, galaxyBackground);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.background = envMap;
    scene.environment = envMap;

    pmremGenerator.dispose();
    texture.dispose();

    return () => {
      scene.background = null;
      scene.environment = null;
    };
  }, [texture, scene, gl]);

  return null;
}

// Main Graph Component
export const Graph: React.FC = () => {
  const [graphData, setGraphData] = useState<Neo4jApiResponse>(
    {} as Neo4jApiResponse
  );
  const mousePosition = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());

  const CLICK_THRESHOLD_MS = 300;
  const POSITION_THRESHOLD = 5;
  const mouseDownRef = useRef<{
    time: number | null;
    position: { x: number; y: number };
  }>({
    time: null,
    position: { x: 0, y: 0 },
  });

  async function loadL1GraphData(searchTerm: string = "Programming") {
    const fetchedGraphData = await graphUtils.loadMostRelatedNodeBySearch(
      searchTerm
    );
    setGraphData(fetchedGraphData);

    const image = await http.getS3Object(
      "atlas-of-us-general-bucket",
      fetchedGraphData.nodeRoot.image
    );
    const points = await graphUtils.processImage(image, 2000, 50);

    // Note: This would need to be adapted to work with React Three Fiber's paradigm
    // You might need to create a separate component or use a ref to manage this
  }

  function handleMouseMove(event: MouseEvent) {
    const canvas = event.currentTarget as HTMLCanvasElement;
    mousePosition.current.x = (event.offsetX / canvas.width) * 2 - 1;
    mousePosition.current.y = -(event.offsetY / canvas.height) * 2 + 1;
  }

  function handleMouseDown(event: MouseEvent) {
    mouseDownRef.current = {
      time: Date.now(),
      position: { x: event.clientX, y: event.clientY },
    };
  }

  function handleMouseUp(event: MouseEvent) {
    if (!mouseDownRef.current.time) return;

    const clickDuration = Date.now() - mouseDownRef.current.time;
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - mouseDownRef.current.position.x, 2) +
        Math.pow(event.clientY - mouseDownRef.current.position.y, 2)
    );

    // Only handle as a click if it was short and didn't move much
    if (
      clickDuration < CLICK_THRESHOLD_MS &&
      moveDistance < POSITION_THRESHOLD
    ) {
      handleClick(event);
    }

    mouseDownRef.current.time = null;
  }

  function handleClick(event: MouseEvent) {
    // Implement click logic
    // This would interact with your graph data and perform actions
    console.log("Click event", event);
  }

  return (
    <div>
      <NavBar />
      <div
        className="in-nav-container"
        style={{ width: "100%", height: "100%" }}
      >
        <Canvas
          camera={{
            fov: 75,
            near: 0.1,
            far: 10000,
            position: [0, 0, 500],
          }}
          onMouseMove={handleMouseMove as any}
          onMouseDown={handleMouseDown as any}
          onMouseUp={handleMouseUp as any}
        >
          <Background />

          {/* Particle System */}
          <ParticleSystem />

          {/* Orbit Controls */}
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.025}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>
    </div>
  );
};
