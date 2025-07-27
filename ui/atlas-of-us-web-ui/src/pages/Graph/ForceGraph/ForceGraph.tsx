import R3fForceGraph from 'r3f-forcegraph';
import SpriteText from 'three-spritetext';

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Neo4jApiResponse, Neo4jNode, Neo4jRelationship } from '../graph-interfaces.interface';
import { HttpService } from '../../../services/http-service';
import { GraphUtils } from '../graph-utils';


export interface GraphData {
  nodes: Neo4jNode[],
  links: Neo4jRelationship[]
}

export function ForceGraph({ initialNodeId }: { 
  initialNodeId: string;
}) {
  const http = new HttpService();
  const graphUtils = new GraphUtils(http);
  const [neo4jResponse, setNeo4jResponse] = useState({} as Neo4jApiResponse);
  
  useEffect(() => {
      graphUtils.loadNodeById(initialNodeId, 1).then((data) => {
          setNeo4jResponse(data);
      });
  }, []);

  const loadMoreNodesById = async (nodeId: string, depth: number = 1) => {
    const data = await graphUtils.loadNodeById(nodeId, depth);
    
    // Get existing ElementIds to avoid duplicates
    const existingAffiliateIds = new Set(neo4jResponse.affiliates?.map(node => node.ElementId) || []);
    const existingRelationshipIds = new Set(neo4jResponse.relationships?.map(rel => rel.ElementId) || []);
    
    // Filter out duplicates
    const newAffiliates = data.affiliates.filter(node => !existingAffiliateIds.has(node.ElementId));
    const newRelationships = data.relationships.filter(rel => !existingRelationshipIds.has(rel.ElementId));
    
    // Create new state object (don't mutate existing)
    setNeo4jResponse(prev => ({
      ...prev,
      affiliates: [...(prev.affiliates || []), ...newAffiliates],
      relationships: [...(prev.relationships || []), ...newRelationships]
    }));
  }

  const fgRef = useRef(null);
  const { camera, controls } = useThree();
  useFrame(() => (fgRef.current.tickFrame()));
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [activeNodes, setActiveNodes] = useState(new Set<string>());
  const [activeLinks, setActiveLinks] = useState(new Set<string>());

  const {graphData, nodesById} = useMemo(() => {
    if (!neo4jResponse.affiliates || !neo4jResponse.nodeRoot || !neo4jResponse.relationships) {
      return { graphData: { nodes: [], links: [] }, nodesById: new Map() };
    }
    
    const allNodes = [...neo4jResponse.affiliates, neo4jResponse.nodeRoot];
    const relationships = neo4jResponse.relationships;
    
    const nodesById = new Map();
    
    allNodes.forEach(node => {
      nodesById.set(node.ElementId, {
        node: node,
        outgoing: [] as string[], //list of relationships starting at this node
        incoming: [] as string[], //list of relationships ending at this node
        neighbors: new Set() // set of all nodes which have a relationship with this node one way or the other
      });
    });
    
    // Populate relationships
    relationships.forEach(rel => {
      const startNode = nodesById.get(rel.StartElementId);
      const endNode = nodesById.get(rel.EndElementId);
      
      if (startNode) {
        startNode.outgoing.push(rel.ElementId);
        if (endNode) {
          startNode.neighbors.add(rel.EndElementId);
        }
      }
      if (endNode) {
        endNode.incoming.push(rel.ElementId);
        if (startNode) {
          endNode.neighbors.add(rel.StartElementId);
        }
      }
    });
    
    return {
      graphData: {
        nodes: allNodes,
        links: relationships
      }as GraphData,
      nodesById
    };
  }, [neo4jResponse]);

  

  const handleNodeClick = (node: Neo4jNode) => {
    setActiveNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.ElementId)) {
        newSet.delete(node.ElementId);
      } else {
        newSet.add(node.ElementId);
      }
      return newSet;
    });
    
    // Load more nodes related to the clicked node
    loadMoreNodesById(node.ElementId, 1);
    
    // Center camera on the entire graph
    centerCameraOnMesh();
  }

  const handleRelationshipClick = (relationship: Neo4jRelationship) => {
    setActiveLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(relationship.ElementId)) {
        newSet.delete(relationship.ElementId);
      } else {
        newSet.add(relationship.ElementId);
      }
      return newSet;
    })
  }

  const handleNodeHover = (node: Neo4jNode) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node.ElementId);
      const nodeData = nodesById.get(node.ElementId);
      if (nodeData) {
        nodeData.neighbors.forEach((neighborId: string) => {
          highlightNodes.add(neighborId);
        });
      }
      setHighlightNodes(new Set(highlightNodes));
    }
  };

  const handleLinkHover = (link: Neo4jRelationship) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (link) {
      highlightLinks.add(link.ElementId);
      highlightNodes.add(link.StartElementId);
      highlightNodes.add(link.EndElementId);
    }
    setHighlightLinks(new Set(highlightLinks));
    setHighlightNodes(new Set(highlightNodes));
  };

  const centerCameraOnMesh = (nodeIdsToInclude: Set<string> = new Set()) => {
    // Calculate bounding box of the graph or subset of nodes
    let boundingBox;
    if (!nodeIdsToInclude.size) {
      boundingBox = fgRef.current.getGraphBbox()
    } else {
      boundingBox = fgRef.current.getGraphBbox((node: Neo4jNode) => nodeIdsToInclude.has(node.ElementId))
    }
    
    if (!boundingBox) return;
    
    // Calculate center of bounding box
    const center = {
      x: (boundingBox.x[0] + boundingBox.x[1]) / 2,
      y: (boundingBox.y[0] + boundingBox.y[1]) / 2,
      z: (boundingBox.z[0] + boundingBox.z[1]) / 2
    };
    
    // Calculate bounding box dimensions
    const width = boundingBox.x[1] - boundingBox.x[0];
    const height = boundingBox.y[1] - boundingBox.y[0];
    const depth = boundingBox.z[1] - boundingBox.z[0];
    
    // Calculate appropriate distance based on largest dimension
    const maxDimension = Math.max(width, height, depth);
    const distance = maxDimension * 1.25;
    
    // Offset target upward to position graph in top half of screen
    const targetOffset = height * 0.5;
    const adjustedTarget = {
      x: center.x,
      y: center.y - targetOffset,
      z: center.z
    };
    
    // Position camera at an angle above and behind the adjusted target
    const cameraPosition = {
      x: adjustedTarget.x + distance * 0.5,
      y: adjustedTarget.y + distance * 0.3,
      z: adjustedTarget.z + distance
    };
    
    // Move camera and set target
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(adjustedTarget.x, adjustedTarget.y, adjustedTarget.z);
    camera.updateProjectionMatrix();
    
    // Update controls if they exist (TrackballControls)
    if (controls && 'target' in controls) {
      (controls as any).target.set(adjustedTarget.x, adjustedTarget.y, adjustedTarget.z);
      (controls as any).update();
    }
  }

  return <R3fForceGraph
    ref={fgRef}
    graphData={graphData}
    nodeId={"ElementId"}
    linkSource={"StartElementId"}
    linkTarget={"EndElementId"}
    linkWidth={link => highlightLinks.has(link.ElementId) || activeLinks.has(link.ElementId) ? 4 : 1}
    linkDirectionalParticles={link => highlightLinks.has(link.ElementId) || activeLinks.has(link.ElementId) ? 4 : 0}
    linkDirectionalParticleWidth={4}
    onNodeClick={handleNodeClick}
    onNodeHover={handleNodeHover}
    onLinkHover={handleLinkHover}
    onLinkClick={handleRelationshipClick}
    nodeThreeObject={node => {
      const isActive = activeNodes.has(node.ElementId);
      const isHovered =  highlightNodes.has(node.ElementId)
      const sprite = new SpriteText(node.Props.name);
      sprite.color = (
        isActive ? 'rgb(255,0,0,1)' : isHovered ? 'rgba(0,255,255,0.6)' : 'rgba(255,255,255,0.6)'
      )
      sprite.textHeight = isActive ? 8 : isHovered ? 6 : 3;
      return sprite;
    }}
  />;
}

