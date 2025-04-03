import type {
  Neo4jApiResponse,
  Neo4jNode,
  Neo4jRelationship,
} from "../pages/Graph/graph-interfaces.interface";

//service class for fetching data and mapping it for ui consumption
export class HttpService {
  API_BASE = import.meta.env.VITE_API_BASE_URL;
  constructor() {}

  async getS3Object(bucketName: string, key: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      fetch(`${this.API_BASE}/api/secure/helper/s3-object?bucket=${bucketName}&key=${key}`, {
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
        resolve(response.blob());
      })
      .catch(error => {
        console.error("Error fetching S3 object:", error);
        reject(error);
      });
    });
  }

  async fetchNodes(
    endpoint: string
  ): Promise<Neo4jApiResponse> {
    try {
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
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
        nodeRoot: body.Values[0] as Neo4jNode,
        relationships: body.Values[1] as Neo4jRelationship[],
        affiliates: body.Values[2] as Neo4jNode[]
      };
      return mappedBody;
    } catch (err) {
      console.error(err);
      return { 
        nodeRoot: {},
        relationships: [],
        affiliates: []
      } as any;
    }
  }
}