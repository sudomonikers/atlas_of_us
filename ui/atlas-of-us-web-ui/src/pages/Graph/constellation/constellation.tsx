import "./constellation.css";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

import type {
  Neo4jApiResponse,
  NodeCoordinate,
  Neo4jNodeWithMappedPositions,
  Neo4jRelationship,
  Neo4jNode,
} from "../graph-interfaces.interface";
import { Sphere } from "./sphere/sphere";

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
      nodeData: Neo4jNode;
      relevantRelationships: Neo4jRelationship[];
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

    // Create a map of relationships keyed by startElementId
    const relationshipMap = new Map<string, Neo4jRelationship[]>();
    graphData.relationships.forEach((relationship) => {
      const startElementId = relationship.startElementId;
      if (!relationshipMap.has(startElementId)) {
        relationshipMap.set(startElementId, []);
      }
      relationshipMap.get(startElementId)!.push(relationship);
    });

    // Create parent node
    sphereData.push({
      position: sceneLocation,
      isParentNode: true,
      isDataNode: true,
      nodeData: graphData.nodeRoot,
      relevantRelationships: relationshipMap.get(graphData.nodeRoot.elementId) as Neo4jRelationship[]
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
        isParentNode: false
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
        sphereInfo.relevantRelationships = relationshipMap.get(affiliateNode.elementId) as Neo4jRelationship[];

        affiliateDataPosition++;
      }

      sphereData.push(sphereInfo);
    }

    return { selectedIndices, sphereData };
  }, [imagePoints, graphData]);

  return (
    <group position={sceneLocation}>
      {sphereData.map((sphere, index) => (
        <Sphere
          key={index}
          position={sphere.position}
          isDataNode={sphere.isDataNode}
          isParentNode={sphere.isParentNode}
          nodeData={sphere.nodeData}
          relevantRelationships={sphere.relevantRelationships}
        />
      ))}
    </group>
  );
};
