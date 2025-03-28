import "./constellation.css";
import React, { useMemo } from "react";
import * as THREE from "three";

import type {
  Neo4jApiResponse,
  NodeCoordinate,
  Neo4jNodeWithMappedPositions,
} from "../graph-interfaces.interface";
import Sphere from "./sphere/sphere";

interface ConstellationProps {
  imagePoints: NodeCoordinate[];
  graphData: Neo4jApiResponse;
  sceneLocation?: THREE.Vector3;
}

export const Constellation: React.FC<ConstellationProps> = ({
  imagePoints,
  graphData,
  sceneLocation = new THREE.Vector3(0, 0, 0),
}) => {
  // Memoize the selected indices and data nodes
  const { selectedIndices, sphereData } = useMemo(() => {
    const selectedIndices = new Set<number>();
    const sphereData: Array<{
      position: THREE.Vector3;
      isDataNode: boolean;
      isParentNode: boolean;
      nodeData?: any;
    }> = [];

    // Determine how many particles will have data (for the affiliates)
    const dataPointCount = Math.min(
      graphData.affiliates?.length || 0,
      Math.floor(imagePoints.length * 0.1) - 1 // Reserve one spot for parent node
    );

    // Randomly select indices for data nodes
    while (selectedIndices.size < dataPointCount) {
      const randomIndex =
        Math.floor(Math.random() * (imagePoints.length - 1)) + 1;
      selectedIndices.add(randomIndex);
    }
    console.log(graphData)

    // Create parent node
    sphereData.push({
      position: sceneLocation,
      isParentNode: true,
      isDataNode: true,
      nodeData: graphData.nodeRoot,
    });

    // Create other spheres
    let affiliateDataPosition = 0;
    for (let i = 1; i < imagePoints.length; i++) {
      const isDataNode = selectedIndices.has(i);
      const sphereInfo: any = {
        position: new THREE.Vector3(
          imagePoints[i].x,
          imagePoints[i].y,
          imagePoints[i].z
        ),
        isDataNode: false,
        isParentNode: false,
      };

      // Add data to special nodes
      if (
        isDataNode &&
        graphData.affiliates &&
        affiliateDataPosition < graphData.affiliates.length
      ) {
        const affiliateNode = graphData.affiliates[affiliateDataPosition];

        // Update coordinates for the affiliate node
        (affiliateNode as Neo4jNodeWithMappedPositions).coordinates = {
          x: imagePoints[i].x,
          y: imagePoints[i].y,
          z: imagePoints[i].z,
        };

        sphereInfo.isDataNode = true;
        sphereInfo.nodeData = affiliateNode;

        affiliateDataPosition++;
      }

      sphereData.push(sphereInfo);
    }

    return { selectedIndices, sphereData };
  }, [imagePoints, graphData]);

  console.log(sphereData)

  return (
    <group position={sceneLocation}>
      {sphereData.map((sphere, index) => (
        <Sphere
          key={index}
          position={sphere.position}
          isDataNode={sphere.isDataNode}
          isParentNode={sphere.isParentNode}
          nodeData={sphere.nodeData}
        />
      ))}
    </group>
  );
};
