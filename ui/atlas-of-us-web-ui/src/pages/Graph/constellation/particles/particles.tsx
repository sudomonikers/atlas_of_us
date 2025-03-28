import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  Color,
  InstancedMesh,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";

export function ParticleSystem() {
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const boundarySize = 1500;
  const particleCount = 350;

  // Velocities and other particle-related states
  const velocities = useRef<Vector3[]>([]);

  useEffect(() => {
    if (!instancedMeshRef.current) return;

    const dummy = new Object3D();
    const colors = new Float32Array(particleCount * 3);
    const localVelocities: Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Random positions within boundary
      dummy.position.set(
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2
      );

      // Random velocities
      const velocity = new Vector3(
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
      const color = new Color();
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
      (instancedMeshRef.current.geometry as SphereGeometry).setAttribute(
        "color",
        new BufferAttribute(colors, 3)
      );
    }

    velocities.current = localVelocities;
  }, []);

  useFrame(() => {
    if (!instancedMeshRef.current) return;

    const dummy = new Object3D();

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
