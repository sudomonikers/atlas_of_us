export interface Neo4JObject {
  ElementId: string;
  Id: number;
  Labels: string[];
  Props: {
    name: string;
  };
}

export interface Neo4JRelationship {
  ElementId: string;
  EndElementId: string;
  EndId: number;
  Id: number;
  Props: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  StartElementId: string;
  StartId: number;
  Type: string;
}
