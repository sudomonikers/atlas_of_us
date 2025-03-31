import "./constellation.css";
import React, { useMemo, useRef, createRef, useState, useEffect } from "react";
import * as THREE from "three";
import { HttpService } from "../../../services/http-service";
import { GraphUtils } from "../graph-utils";
import type {
  Neo4jApiResponse,
  Neo4jRelationship,
  NodeCoordinate
} from "../graph-interfaces.interface";
import { Sphere, SphereProps } from "./sphere/sphere";
import { RelationshipLine } from "./relationship-line/relationship-liine";
import { useGlobal } from "../../../GlobalProvider";

const http = new HttpService();
const graphUtils = new GraphUtils(http);

export const Constellation = () => {
  //reload data if the user searches
  const { searchText } = useGlobal();
  useEffect(() => {
    loadGraphData(searchText);
  }, [searchText]);
  
  const [graphState, setGraphState] = useState({
    data: {} as Neo4jApiResponse,
    imagePoints: [] as NodeCoordinate[],
    sceneLocation: new THREE.Vector3(0, 0, 0)
  });
  
  // Reference map for nodes
  const nodeRefsMap = useRef(new Map<string, React.RefObject<THREE.Mesh>>());
  const [activeMeshes, setActiveMeshes] = useState(new Set<string>());

  // Core function to load graph data and image points
  const loadGraphData = async (searchTerm: string, nodeId?: string, newLocation?: THREE.Vector3) => {
    try {
      // Default search term if empty
      if (!searchTerm.length && !nodeId) {
        searchTerm = "Programming";
      }
      
      // Determine which API call to make based on parameters
      const fetchedGraphData = nodeId 
        ? await graphUtils.loadNodeById(nodeId, 2)
        : await graphUtils.loadMostRelatedNodeBySearch(searchTerm, 2);
      
      console.log(fetchedGraphData);
      
      // Load image and process points
      const image = await http.getS3Object(
        "atlas-of-us-general-bucket",
        fetchedGraphData.nodeRoot.image
      );
      
      const location = newLocation || graphState.sceneLocation;
      const points = await graphUtils.processImage(image, 2000, 50, location);
      
      // Update all related state at once
      setGraphState({
        data: fetchedGraphData,
        imagePoints: points,
        sceneLocation: newLocation || graphState.sceneLocation
      });
    } catch (error) {
      console.error("Error loading graph data:", error);
    }
  };

  // Handler for sphere click 
  const handleSphereClick = (elementId: string, newSceneLocation: THREE.Vector3) => {
    loadGraphData("", elementId, newSceneLocation);
  };

  // Toggle active state for nodes
  const toggleActive = (elementId: string, active: boolean) => {
    setActiveMeshes(prev => {
      const newActiveMeshes = new Set(prev);
      if (active) {
        newActiveMeshes.add(elementId);
      } else {
        newActiveMeshes.delete(elementId);
      }
      return newActiveMeshes;
    });
  };

  // Memoize the sphere data and relationship map
  const { relationshipMap, sphereData } = useMemo(() => {
    // Clear existing refs
    nodeRefsMap.current.clear();
    
    const { data, imagePoints } = graphState;
    if (!data.nodeRoot || !imagePoints.length) {
      return { relationshipMap: new Map(), sphereData: [] };
    }
    
    const selectedIndices = new Set<number>();
    const sphereData: SphereProps[] = [];

    // Determine how many particles will have data (for the affiliates)
    const dataPointCount = Math.min(
      data.affiliates?.length || 0,
      Math.floor(imagePoints.length * 0.1) - 1 // Reserve one spot for parent node
    );

    // Randomly select indices for data nodes, possibly change this later to make it not random
    while (selectedIndices.size < dataPointCount) {
      const randomIndex =
        Math.floor(Math.random() * (imagePoints.length - 1)) + 1;
      selectedIndices.add(randomIndex);
    }

    // Create a map of relationships keyed by startElementId
    const relationshipMap = new Map<string, Neo4jRelationship[]>();
    data.relationships?.forEach((relationship) => {
      const startElementId = relationship.startElementId;
      if (!relationshipMap.has(startElementId)) {
        relationshipMap.set(startElementId, []);
      }
      relationshipMap.get(startElementId)!.push(relationship);
    });

    // Create parent node
    sphereData.push({
      position: new THREE.Vector3(0, 0, 0),
      isParentNode: true,
      isDataNode: true,
      nodeData: data.nodeRoot,
    });

    // Create refs for the root node
    if (!nodeRefsMap.current.has(data.nodeRoot.elementId)) {
      nodeRefsMap.current.set(
        data.nodeRoot.elementId,
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
        data.affiliates &&
        affiliateDataPosition < data.affiliates.length
      ) {
        const affiliateNode = data.affiliates[affiliateDataPosition];

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
  }, [graphState]);

  return (
    <group position={graphState.sceneLocation}>
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
          onNodeClick={toggleActive}
          onSphereReload={handleSphereClick}
        />
      ))}
      {/* Render lines for active meshes */}
      {[...activeMeshes].map((activeMeshId) => {
        const startSphere = nodeRefsMap.current.get(activeMeshId);
        const relationships = relationshipMap.get(activeMeshId) || [];

        return relationships.map((relationship: Neo4jRelationship) => {
          const endSphere = nodeRefsMap.current.get(
            relationship.endElementId
          );

          return (
            <RelationshipLine 
              key={relationship.id}
              startNode={startSphere?.current}
              endNode={endSphere?.current}
              relationshipData={relationship}
            />
          );
        });
      })}
    </group>
  );
};