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
