import { API_BASE } from "../../environment";
import type {
  Neo4jNode,
  Neo4jRelationship,
} from "../pages/Graph/graph-interfaces.interface";

//service class for fetching data and mapping it for ui consumption
export class HttpService {
  constructor() {}

  async getS3Object(bucketName: string, key: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE}/api/secure/helper/s3-object?bucket=${bucketName}&key=${key}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
        }
        return response.blob();
      })
      .then(blob => {
        const imageUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          URL.revokeObjectURL(imageUrl); // Clean up memory after the image is loaded
          resolve(img); // Resolve the promise with the loaded image
        };
        img.onerror = (error) => {
          reject(error);
        };
      })
      .catch(error => {
        console.error("Error fetching S3 object:", error);
        reject(error);
      });
    });
  }

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
      const mappedBody = {
        nodes: body.Values[0] as Neo4jNode[],
        relationships: body.Values[1] as Neo4jRelationship[],
      };
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