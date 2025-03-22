import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface Neo4jNode {
  elementId: string,
  labels: string[],
  name: string,
  image: string,
  description: string
}

export interface Neo4jRelationship {
  id: string,
  startElementId: string,
  endElementId: string,
  type: string,
  props: {
    [key: string]: any
  }
}

export interface Neo4jApiResponse {
  nodeRoot: Neo4jNode;
  relationships: Neo4jRelationship[];
  affiliates: Neo4jNode[]
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
  labelRenderer: CSS2DRenderer;
}
