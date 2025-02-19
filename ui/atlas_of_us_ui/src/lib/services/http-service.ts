import { API_BASE } from "../../environment";
import type {
  Neo4jNode,
  Neo4jRelationship,
} from "../pages/Graph/graph-interfaces.interface";

//service class for fetching data and mapping it for ui consumption
export class HttpService {
  constructor() {}

  private async fetchNodes(
    endpoint: string
  ): Promise<{
    nodes: Neo4jNode[];
    relationships: Neo4jRelationship[];
  }> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const [body] = await response.json();
      console.log(body)
      const mappedBody = {
        nodes: body.Values[0] as Neo4jNode[],
        relationships: body.Values[1] as Neo4jRelationship[],
      };
      console.log(mappedBody)
      return mappedBody;
    } catch (err) {
      console.error(err);
      return {
        nodes: [],
        relationships: [],
      };
    }
  }

  async getHealthNodes() {
    return this.fetchNodes("/api/secure/health/all-health");
  }

  async getPersonalityNodes() {
    return this.fetchNodes("/api/secure/personality/all-personality");
  }

  async getIntrinsicNodes() {
    return this.fetchNodes("/api/secure/intrinsic/all-intrinsic");
  }

  async getKnowledgeNodes() {
    return this.fetchNodes("/api/secure/knowledge-bases/all-knowledge-bases");
  }

  async getPursuitNodes() {
    return this.fetchNodes("/api/secure/pursuits/all-pursuits");
  }

  async getSkillNodes() {
    return this.fetchNodes("/api/secure/skill/all-skill");
  }
}