import { Neo4JObject, Neo4JRelationship } from './Neo4J.interface';

export interface NodeAndDescendants {
  Keys: string[];
  Values: (Neo4JObject | Neo4JRelationship)[][];
}
