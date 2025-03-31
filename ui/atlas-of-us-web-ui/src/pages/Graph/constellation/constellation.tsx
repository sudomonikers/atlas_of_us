import "./constellation.css";
import React, { useRef, createRef, useState, useEffect } from "react";
import * as THREE from "three";
import { HttpService } from "../../../services/http-service";
import { GraphUtils } from "../graph-utils";
import type {
  Neo4jRelationship,
} from "../graph-interfaces.interface";
import { Sphere, SphereProps } from "./sphere/sphere";
import { RelationshipLine } from "./relationship-line/relationship-liine";
import { useGlobal } from "../../../GlobalProvider";
import { useThree } from "@react-three/fiber";

const http = new HttpService();
const graphUtils = new GraphUtils(http);

export const Constellation = () => {
  const threeContext = useThree();
  // Reload data when searchText changes
  const { searchText } = useGlobal();
  useEffect(() => {
    loadGraphData(searchText);
  }, [searchText]);
  
  const [constellationState, setConstellationState] = useState({
    sphereData: [] as SphereProps[],
    relationshipMap: new Map<string, Neo4jRelationship[]>(),
    sceneLocation: new THREE.Vector3(0, 0, 0)
  });
  
  // Reference map for nodes - gets reset when data changes
  const nodeRefsMap = useRef(new Map<string, React.RefObject<THREE.Mesh>>());
  const [activeMeshes, setActiveMeshes] = useState(new Set<string>());

  // Core function to load graph data and completely rebuild visualization
  const loadGraphData = async (searchTerm: string, nodeId?: string, newLocation?: THREE.Vector3) => {
    try {
      // Default search term if empty
      if (!searchTerm.length && !nodeId) {
        searchTerm = "Programming";
      }
      
      const graphData = nodeId 
        ? await graphUtils.loadNodeById(nodeId, 2)
        : await graphUtils.loadMostRelatedNodeBySearch(searchTerm, 2);
      console.log(graphData);
      
      const image = await http.getS3Object(
        "atlas-of-us-general-bucket",
        graphData.nodeRoot.image
      );
      
      const location = newLocation || constellationState.sceneLocation;
      const imagePoints = await graphUtils.processImage(image, 50, location, 0.06);
      
      // Clear existing refs and create new ones
      nodeRefsMap.current.clear();
      
      // Reset active meshes on complete reload
      setActiveMeshes(new Set());
      
      // Rebuild spheres and relationships from scratch on every data load
      const selectedIndices = new Set<number>();
      const sphereData: SphereProps[] = [];
      
      // Determine how many particles will have data (for the affiliates)
      const dataPointCount = Math.min(
        graphData.affiliates?.length || 0,
        Math.floor(imagePoints.length * 0.1) - 1 // Reserve one spot for parent node
      );

      // Randomly select indices for data nodes, possibly change this later
      while (selectedIndices.size < dataPointCount) {
        const randomIndex =
          Math.floor(Math.random() * (imagePoints.length - 1)) + 1;
        selectedIndices.add(randomIndex);
      }

      // Create a map of relationships
      const relationshipMap = new Map<string, Neo4jRelationship[]>();
      graphData.relationships?.forEach((relationship) => {
        const startElementId = relationship.startElementId;
        if (!relationshipMap.has(startElementId)) {
          relationshipMap.set(startElementId, []);
        }
        relationshipMap.get(startElementId)!.push(relationship);
      });

      // Create parent node
      sphereData.push({
        position: location,
        isParentNode: true,
        isDataNode: true,
        nodeData: graphData.nodeRoot,
      });

      // Create refs for the root node
      nodeRefsMap.current.set(
        graphData.nodeRoot.elementId,
        createRef<THREE.Mesh>()
      );

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

          sphereInfo.isDataNode = true;
          sphereInfo.nodeData = affiliateNode;

          // Create a ref for this data node
          nodeRefsMap.current.set(
            affiliateNode.elementId,
            createRef<THREE.Mesh>()
          );

          affiliateDataPosition++;
        }

        sphereData.push(sphereInfo);
      }
      
      setConstellationState({
        sphereData,
        relationshipMap,
        sceneLocation: location
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

  return (
    <group>
      {constellationState.sphereData.map((sphere, index) => (
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
        const relationships = constellationState.relationshipMap.get(activeMeshId) || [];

        return relationships.map((relationship) => {
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