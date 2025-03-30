import "./constellation.css";
import React, {
  useMemo,
  useRef,
  createRef,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";

import type {
  Neo4jApiResponse,
  NodeCoordinate,
  Neo4jNodeWithMappedPositions,
  Neo4jRelationship,
  Neo4jNode,
} from "../graph-interfaces.interface";
import { Sphere, SphereProps } from "./sphere/sphere";
import { RelationshipLine } from "./relationship-line/relationship-liine";

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
  // Create a map to store refs for data nodes
  const nodeRefsMap = useRef(new Map<string, React.RefObject<THREE.Mesh>>());
  const [activeMeshes, setActiveMeshes] = useState(new Set<string>()); // Use a Set to store active mesh IDs
  // Memoize the selected indices and data nodes
  const { relationshipMap, sphereData } = useMemo(() => {
    const selectedIndices = new Set<number>();
    const sphereData: SphereProps[] = [];

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
    console.log(relationshipMap);

    // Create parent node
    sphereData.push({
      position: sceneLocation,
      isParentNode: true,
      isDataNode: true,
      nodeData: graphData.nodeRoot,
    });

    // Create refs for the root node
    if (!nodeRefsMap.current.has(graphData.nodeRoot.elementId)) {
      nodeRefsMap.current.set(
        graphData.nodeRoot.elementId,
        createRef<THREE.Mesh>()
      );
    }

    // Create other spheres
    let affiliateDataPosition = 0;
    for (let i = 1; i < imagePoints.length; i++) {
      const isDataNode = selectedIndices.has(i);
      const sphereInfo: SphereProps = {
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

        // Create a ref for this data node
        if (!nodeRefsMap.current.has(affiliateNode.elementId)) {
          nodeRefsMap.current.set(
            affiliateNode.elementId,
            createRef<THREE.Mesh>()
          );
        }

        affiliateDataPosition++;
      }

      sphereData.push(sphereInfo);
    }

    return { relationshipMap, sphereData };
  }, [imagePoints, graphData]);

  const toggleActive = useCallback((elementId: string, active: boolean) => {
    setActiveMeshes((prevActiveMeshes) => {
      const newActiveMeshes = new Set(prevActiveMeshes);
      if (active) {
        newActiveMeshes.add(elementId); // Add if active is true
      } else {
        newActiveMeshes.delete(elementId); // Remove if active is false
      }
      console.log(newActiveMeshes);
      return newActiveMeshes;
    });
  }, []);

  return (
      <group position={sceneLocation}>
        {sphereData.map((sphere, index) => (
          <Sphere
            key={index}
            position={sphere.position}
            isDataNode={sphere.isDataNode}
            isParentNode={sphere.isParentNode}
            nodeData={sphere.nodeData}
            ref={
              sphere?.nodeData?.elementId
                ? nodeRefsMap.current.get(sphere.nodeData.elementId)
                : undefined
            }
            onNodeClick={(elementId, active) => toggleActive(elementId, active)}
          />
        ))}
        {/* Render lines for active meshes */}
        {[...activeMeshes].map((activeMeshId) => {
          const startSphere = nodeRefsMap.current.get(activeMeshId);

          const relationships = relationshipMap.get(activeMeshId);

          return relationships?.map((relationship) => {
            const endSphere = nodeRefsMap.current.get(
              relationship.endElementId
            );

            return (
              <RelationshipLine 
                startNode={startSphere.current}
                endNode={endSphere.current}
                relationshipData={relationship}
              />
            );
          });
        })}
      </group>
  );
};
