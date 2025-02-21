import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Neo4jNode {
  Id: number;
  ElementId: string;
  Labels: string[];
  Props: {
    [key: string]: any;
  };
}

export interface Neo4jRelationship {
    Id: number;
    ElementId: string;
    StartElementId: string;
    StartId: number;
    EndElementId: string;
    EndId: number;
    Type: string;
    Props: {
        [key: string]: any;
    }
}

export interface Neo4jApiResponse {
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
}

export interface GraphData {
  [key: string]: Neo4jApiResponse
}

export interface NodeCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface Neo4jNodeWithMappedPositions extends Neo4jNode {
  coordinates: NodeCoordinate
}

export interface ThreeContext {
  container: HTMLDivElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  resizeObserver: ResizeObserver;
  loader: THREE.TextureLoader;
}
