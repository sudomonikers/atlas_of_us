import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import galaxyBackground from "../../assets/galaxy.jpeg";
import { NavBar } from "../../common-components/navbar/nav";
import { Constellation } from "./constellation/constellation";
import { ParticleSystem } from "./particles/particles";


//Background
function Background(): null {
  const { scene, gl } = useThree();
  const texture = useLoader(THREE.TextureLoader, galaxyBackground);
  const pmremGenerator = new THREE.PMREMGenerator(gl);
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;

  scene.background = envMap;
  scene.environment = envMap;

  pmremGenerator.dispose();
  texture.dispose();

  return null;
}

export const Graph = () => {

  return (
    <div>
      <NavBar />
      <div className="in-nav-container">
        <Canvas
          camera={{
            fov: 75,
            near: 0.1,
            far: 10000,
            position: [0, 0, 500],
          }}
        >
          {/* Orbit Controls */}
          <OrbitControls
            makeDefault
            autoRotate
            autoRotateSpeed={0.025}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            enableDamping={true}
            dampingFactor={0.05}
          />

          <Background />

          {/* Particle System */}
          <ParticleSystem />

          {/* Constellation */}
          <Constellation />
        </Canvas>
      </div>
    </div>
  );
};
