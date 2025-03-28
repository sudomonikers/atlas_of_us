import React, { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree, Vector3 } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

interface SphereProps {
  position: Vector3;
  isDataNode?: boolean;
  isParentNode?: boolean;
  nodeData?: any;
}

const Sphere: React.FC<SphereProps> = ({
  position,
  isDataNode = false,
  isParentNode = false,
  nodeData,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const clickHandler = () => {
    setIsActive(!isActive);
    centerCameraOnMesh(meshRef as any)
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={isActive || isHovered ? 1.5 : 1}
      userData={{
        isParentNode,
        isDataNode,
        nodeData,
      }}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={clickHandler}
    >
      <sphereGeometry
        args={[
          isParentNode ? 4 : isDataNode ? 3 : 2,
          isParentNode ? 16 : isDataNode ? 12 : 8,
          isParentNode ? 16 : isDataNode ? 12 : 8,
        ]}
      />
      <meshBasicMaterial
        color={isParentNode ? "green" : isDataNode ? "red" : "white"}
      />
      {(isHovered || isActive) && nodeData && (
        <Html position={[isParentNode ? 4 : 3, 0, 0]}>
          <div className="info-box">
            <div className="info-box-header">{nodeData.name}</div>
            <div className="info-box-property">
              <span>Labels:</span> {nodeData.labels.join(", ")}
            </div>
            <div className="info-box-content">
              <div className="info-box-property">
                <span>Description:</span> {nodeData.description}
              </div>
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
};

export default Sphere;

function centerCameraOnMesh(object: THREE.Mesh) {
  const threeState = useThree() ;
  const controls = threeState.controls as OrbitControls;
  const camera = threeState.camera as THREE.PerspectiveCamera;
    
  // Get the bounding box of the object
  const bbox = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  // Calculate the size of the bounding box
  const size = new THREE.Vector3();
  bbox.getSize(size);

  // Create a new position for the camera
  const targetPosition = new THREE.Vector3(
    center.x,
    center.y,
    center.z + 150
  );

  // Smoothly move the camera to the new position
  const duration = 1000; // Duration in milliseconds
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone(); // Capture the starting target
  const startTime = Date.now();

  function updateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use an easing function for smooth animation
    const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);

    camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
    controls.target.lerpVectors(startTarget, center, easeProgress); // Animate the target

    camera.lookAt(center);
    controls.update();

    if (progress < 1) {
      requestAnimationFrame(updateCamera);
    }
  }

  updateCamera();
}
