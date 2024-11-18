import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import axios from 'axios';
import createGraph, { Graph } from 'ngraph.graph';
import createLayout, { Vector } from 'ngraph.forcelayout';

import { 
  Star, 
  StarRelationship, 
  StarNetworkProvider 
} from './three-components/Star';
import { 
  NodeAndDescendants,
} from './shared/interfaces/NetworkResponse.interface';
import { Neo4JObject } from './shared/interfaces/Neo4J.interface';


export default function App() {
  const [graphData, setGraphData] = useState<Graph | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<number, Vector>>(new Map());

  useEffect(() => {
    const graph = createGraph();
    
    axios
      .get<NodeAndDescendants[]>(
        'http://localhost:8001/api/v1/kg/match-node/Individual Possibilities/3',
      )
      .then((response) => {
        const data = response.data[0];
        
        // Add root node
        graph.addNode(data.Values[0].ElementId, data.Values[0]);
        
        // Add other nodes
        data.Values[2].forEach((node) => {
          graph.addNode(node.ElementId, node);
        });
        
        // Create relationships
        data.Values[1].forEach((relationship) => {
          graph.addLink(
            relationship.StartElementId, 
            relationship.EndElementId, 
            relationship
          );
        });
        
        // Create and run layout
        const layout = createLayout(graph, {
          dimensions: 3,
          springLength: 50, // Increase to spread nodes more
          springCoefficient: 0.0005, // Lower to reduce clustering
          gravity: -0.1, // Slight negative gravity to push nodes apart
          theta: 1,
          dragCoefficient: 0.02,
        });
        
        // Run more iterations for better layout
        for (let i = 0; i < 100; ++i) {
          layout.step();
        }

        // Store node positions
        const positions = new Map<number, Vector>();
        graph.forEachNode((node) => {
          const pos = layout.getNodePosition(node.id);
          positions.set(node.id as number, { x: pos.x, y: pos.y, z: pos.z as number });
        });
        
        setNodePositions(positions);
        setGraphData(graph);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const renderNodes = () => {
    if (!graphData) return null;
    
    const nodes: JSX.Element[] = [];
    
    graphData.forEachNode((node) => {
      const position = nodePositions.get(node.id as number);
      if (position) {
        console.log(graphData.getNode(node.id));
        const neo4jobj = graphData.getNode(node.id)?.data;
        nodes.push(
          <Star 
            key={node.id}
            node={neo4jobj}
            name={neo4jobj?.Props.name}
            position={[position.x, position.y, position.z as number]}
            onClick={() => console.log('Clicked node:', node.data)}
          />
        );
      }
    });
    
    return nodes;
  };

  const renderLinks = () => {
    if (!graphData) return null;
    
    const links: JSX.Element[] = [];
    
    graphData.forEachLink((link) => {
      const fromPos = nodePositions.get(link.fromId as number);
      const toPos = nodePositions.get(link.toId as number);
      
      if (fromPos && toPos) {
        links.push(
          <StarRelationship
            key={`${link.fromId}-${link.toId}`}
            fromId={+link.fromId}
            toId={+link.toId}
            points={[
              fromPos.x, fromPos.y, fromPos.z as number,
              toPos.x, toPos.y, toPos.z as number
            ]}
          />
        );
      }
    });
    
    return links;
  };

  return (
    <Canvas style={{ height: '100vh', width: '100vw' }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <OrbitControls />
      
      <StarNetworkProvider>
      {graphData ? (
          <>
            {renderNodes()}
            {renderLinks()}
          </>
        ) : null}
      </StarNetworkProvider>
    </Canvas>
  );
}