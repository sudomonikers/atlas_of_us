import R3fForceGraph from 'r3f-forcegraph';

import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";


//THIS GUY WILL BE UPDATED WHEN WE START USING NEO4J GRAPH DATA
export function ForceGraph () {
      const fgRef = useRef(null);
      useFrame(() => (fgRef.current.tickFrame()));

      const graphData = useMemo(() => genRandomTree(600, true), []);

      const rootId = 0;

      const nodesById = useMemo(() => {
        const nodesById = Object.fromEntries(graphData.nodes.map(node => [node.id, node]));

        // link parent/children
        graphData.nodes.forEach(node => {
          node.collapsed = node.id !== rootId;
          node.childLinks = [];
        });
        graphData.links.forEach(link => nodesById[link.source].childLinks.push(link));

        return nodesById;
      }, [graphData]);

      const getPrunedTree = useCallback(() => {
        const visibleNodes = [];
        const visibleLinks = [];
        (function traverseTree(node = nodesById[rootId]) {
          visibleNodes.push(node);
          if (node.collapsed) return;
          visibleLinks.push(...node.childLinks);
          node.childLinks
                  .map(link => ((typeof link.target) === 'object') ? link.target : nodesById[link.target]) // get child node
                  .forEach(traverseTree);
        })();

        return { nodes: visibleNodes, links: visibleLinks };
      }, [nodesById]);

      const [prunedTree, setPrunedTree] = useState(getPrunedTree());

      const handleNodeClick = useCallback(node => {
        node.collapsed = !node.collapsed; // toggle collapse state
        setPrunedTree(getPrunedTree())
      }, []);

      return <R3fForceGraph
        ref={fgRef}
        graphData={prunedTree}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={0.2}
        nodeColor={node => !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'yellow'}
        onNodeClick={handleNodeClick}
      />;
    }

export function genRandomTree(N = 300, reverse = false) {
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i })),
      links: [...Array(N).keys()]
    .filter(id => id)
    .map(id => ({
      [reverse ? 'target' : 'source']: id,
      [reverse ? 'source' : 'target']: Math.round(Math.random() * (id-1))
    }))
  };
}
