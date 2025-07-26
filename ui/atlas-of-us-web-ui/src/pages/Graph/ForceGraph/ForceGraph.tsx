import R3fForceGraph from 'r3f-forcegraph';
import SpriteText from 'three-spritetext';

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Neo4jApiResponse, Neo4jNode, Neo4jRelationship } from '../graph-interfaces.interface';
import { HttpService } from '../../../services/http-service';
import { GraphUtils } from '../graph-utils';


export interface GraphData {
  nodes: Neo4jNode[],
  links: Neo4jRelationship[]
}

export function ForceGraph({ initialNodeId }: { initialNodeId: string }) {
  const http = new HttpService();
  const graphUtils = new GraphUtils(http);
  const [neo4jResponse, setNeo4jResponse] = useState({} as Neo4jApiResponse);
  
  useEffect(() => {
      graphUtils.loadNodeById(initialNodeId, 2).then((data) => {
          setNeo4jResponse(data);
      });
  }, []);

  const fgRef = useRef(null);
  useFrame(() => (fgRef.current.tickFrame()));
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [activeNodes, setActiveNodes] = useState(new Set());
  const [activeLinks, setActiveLinks] = useState(new Set());

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

