import type {
  Neo4jApiResponse,
  Neo4jNode,
  Neo4jRelationship,
} from "../pages/Graph/graph-interfaces.interface";

//service class for fetching data and mapping it for ui consumption
export class HttpService {
  API_BASE = 'http://localhost:8001';
  //API_BASE = 'https://8tu1qzn57e.execute-api.us-east-2.amazonaws.com/prod'; 
  constructor() {}

  async getS3Object(bucketName: string, key: string): Promise<HTMLImageElement> {
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