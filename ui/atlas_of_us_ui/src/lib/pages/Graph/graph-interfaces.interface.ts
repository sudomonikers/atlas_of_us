import * as THREE from "three";

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

export interface NodeCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface Neo4jNodeWithMappedPositions extends Neo4jNode {
  coordinates: NodeCoordinate
}

interface NodeMesh extends THREE.Mesh {
  graphData: Neo4jNodeWithMappedPositions;
}

interface RelationshipLine extends THREE.Line {
  graphData: Neo4jRelationship;
}