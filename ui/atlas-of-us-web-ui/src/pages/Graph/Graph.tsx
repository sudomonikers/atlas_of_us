import { useState, useEffect } from "react";
import { useGlobal } from "../../GlobalProvider";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { HttpService } from "../../services/http-service";
import { GraphUtils } from "./graph-utils";

import type {
  Neo4jApiResponse,
  NodeCoordinate,
} from "./graph-interfaces.interface";

import galaxyBackground from "../../assets/galaxy.jpeg";
import { NavBar } from "../../common-components/navbar/nav";
import { Constellation } from "./constellation/constellation";
import { ParticleSystem } from "./particles/particles";

const http = new HttpService();
const graphUtils = new GraphUtils(http);


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
export const Graph = () => {
  const { searchText } = useGlobal();

  const [graphData, setGraphData] = useState<Neo4jApiResponse>(
    {} as Neo4jApiResponse
  );
  const [imagePoints, setImagePoints] = useState<NodeCoordinate[]>([]);

  useEffect(() => {
    // You can add a check to prevent unnecessary calls if needed
    loadL1GraphData(searchText);
  }, [searchText]);

  async function loadL1GraphData(searchTerm: string = "Programming") {
    if (!searchTerm.length) {
      searchTerm = "Programming"
    }
    const fetchedGraphData = await graphUtils.loadMostRelatedNodeBySearch(
      "Programming",
      2
    );
    console.log(fetchedGraphData)
    setGraphData(fetchedGraphData);

    const image = await http.getS3Object(
      "atlas-of-us-general-bucket",
      fetchedGraphData.nodeRoot.image
    );
    const points = await graphUtils.processImage(image, 2000, 50);
    setImagePoints(points);
  }

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
          {graphData.nodeRoot && imagePoints.length > 0 && (
            <Constellation imagePoints={imagePoints} graphData={graphData} />
          )}
        </Canvas>
      </div>
    </div>
  );
};
