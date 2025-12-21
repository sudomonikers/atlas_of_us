export interface Neo4jNode {
  ElementId: string,
  Id: string,
  Labels: string[],
  Props: {
    [key: string]: any
  },
  // Added for GENERALIZES_TO tracking - what general node this skill/knowledge links to
  GeneralizesToElementId?: string | null,
}

export interface Neo4jRelationship {
  ElementId: string,
  StartElementId: string,
  EndElementId: string,
  Type: string,
  Props: {
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
