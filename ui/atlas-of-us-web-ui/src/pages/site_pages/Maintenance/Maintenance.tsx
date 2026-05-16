import { Canvas } from "@react-three/fiber";
import { TrackballControls } from "@react-three/drei";
import { ForceGraph } from "../../graph_pages/Graph/ForceGraph/ForceGraph";
import type {
  Neo4jApiResponse,
  Neo4jNode,
  Neo4jRelationship,
} from "../../graph_pages/Graph/graph-interfaces.interface";
import fallbackData from "./fallback_data.json";
import "./maintenance.css";

const FALLBACK_GRAPH_DATA: Neo4jApiResponse = {
  nodeRoot: fallbackData[0].Values[0] as unknown as Neo4jNode,
  relationships: fallbackData[0].Values[1] as unknown as Neo4jRelationship[],
  affiliates: fallbackData[0].Values[2] as unknown as Neo4jNode[],
};

export function Maintenance() {
  return (
    <div className="maintenance-page">
      <div className="maintenance-canvas">
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 5000, position: [0, 0, 180] }}
        >
          <TrackballControls makeDefault />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <ForceGraph initialNodeId={null} initialData={FALLBACK_GRAPH_DATA} />
        </Canvas>
      </div>
      <div className="maintenance-overlay">
        <div className="maintenance-card">
          <h1 className="maintenance-headline">The Atlas Is Resting</h1>
          <p className="maintenance-message">
            We're temporarily down for maintenance. Check back soon for new features
            and a new way to explore what it means to be human.
          </p>
        </div>
      </div>
    </div>
  );
}
