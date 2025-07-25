import R3fForceGraph from 'r3f-forcegraph';
import SpriteText from 'three-spritetext';

import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import { Neo4jApiResponse, Neo4jNode, Neo4jRelationship } from '../graph-interfaces.interface';


export interface GraphData {
  nodes: Neo4jNodeExtendedForUI[],
  links: Neo4jRelationshipExtendedForUI[]
}

export interface Neo4jNodeExtendedForUI extends Neo4jNode {
  collapsed?: boolean;
  childLinks?: any[];
}

export interface Neo4jRelationshipExtendedForUI extends Neo4jRelationship {
  collapsed?: boolean;
  childLinks?: any[];
}

//THIS GUY WILL BE UPDATED WHEN WE START USING NEO4J GRAPH DATA
export function ForceGraph({ neo4jResponse }: { neo4jResponse: Neo4jApiResponse }) {
  const fgRef = useRef(null);
  useFrame(() => (fgRef.current.tickFrame()));

  const graphData = {
    nodes: [...neo4jResponse.affiliates, neo4jResponse.nodeRoot],
    links: neo4jResponse.relationships
  } as GraphData;

  console.log(graphData)

  const rootId = neo4jResponse.nodeRoot.ElementId;

  const nodesById = useMemo(() => {
    const nodesById = Object.fromEntries(graphData.nodes.map(node => [node.ElementId, node]));

    // link parent/children
    graphData.nodes.forEach(node => {
      node.collapsed = node.ElementId !== rootId;
      node.childLinks = [];
    });
    graphData.links.forEach(link => nodesById[link.StartElementId].childLinks.push(link));

    return nodesById;
  }, [graphData]);

  const getPrunedTree = useCallback(() => {
    const visibleNodes = [];
    const visibleLinks = [];
    const visited = new Set();
    
    (function traverseTree(node = nodesById[rootId]) {
      if (visited.has(node.ElementId)) return;
      visited.add(node.ElementId);
      
      visibleNodes.push(node);
      if (node.collapsed) return;
      visibleLinks.push(...node.childLinks);
      node.childLinks
        .map(link => ((typeof link.target) === 'object') ? link.target : nodesById[link.EndElementId]) // get child node
        .forEach(traverseTree);
    })();

    return { nodes: visibleNodes, links: visibleLinks };
  }, [nodesById]);

  const [prunedTree, setPrunedTree] = useState(getPrunedTree());

  const handleNodeClick = useCallback((node: Neo4jNodeExtendedForUI) => {
    node.collapsed = !node.collapsed; // toggle collapse state
    setPrunedTree(getPrunedTree())
  }, []);

  return <R3fForceGraph
    ref={fgRef}
    graphData={prunedTree}
    nodeId={"ElementId"}
    linkSource={"StartElementId"}
    linkTarget={"EndElementId"}
    linkDirectionalParticles={1}
    linkDirectionalParticleWidth={0.2}
    onNodeClick={handleNodeClick}
    nodeThreeObject={node => {
          const sprite = new SpriteText(node.Props.name);
          sprite.color = !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'yellow';
          sprite.textHeight = 8;
          return sprite;
        }}
  />;
}

export function genRandomTree(N = 300, reverse = false) {
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
    links: [...Array(N).keys()]
      .filter(id => id)
      .map(id => ({
        [reverse ? 'target' : 'source']: id,
        [reverse ? 'source' : 'target']: Math.round(Math.random() * (id - 1))
      }))
  };
}
