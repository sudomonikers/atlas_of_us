import type {
  Neo4jApiResponse,
  Neo4jNode,
  Neo4jRelationship,
} from "../pages/graph_pages/Graph/graph-interfaces.interface";
import type { DomainData } from "../pages/graph_pages/Domain/domain-interfaces";

// Singleton instance
let httpServiceInstance: HttpService | null = null;

// Get or create the singleton HttpService instance
export function getHttpService(): HttpService {
  if (!httpServiceInstance) {
    httpServiceInstance = new HttpService();
  }
  return httpServiceInstance;
}

// Service class for fetching data and mapping it for UI consumption
export class HttpService {
  API_BASE = import.meta.env.VITE_API_BASE_URL;
  constructor() {}

  async getS3Object(bucketName: string, key: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      fetch(`${this.API_BASE}/secure/helper/s3-object?bucket=${bucketName}&key=${key}`, {
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
      const response = await fetch(`${this.API_BASE}/${endpoint}`, {
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
      } as Neo4jApiResponse;
    }
  }

  async fetchDomain(domainName: string): Promise<DomainData | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/secure/graph/domain?name=${encodeURIComponent(domainName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as DomainData;
    } catch (err) {
      console.error("Error fetching domain:", err);
      return null;
    }
  }

  async createUserProgress(
    userElementId: string,
    targetNodeElementId: string,
    nodeType: 'knowledge' | 'skill' | 'trait' | 'milestone',
    properties: { bloom_level?: string; dreyfus_level?: string; score?: number; date?: string; proof_url?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const relationshipType: Record<string, string> = {
      knowledge: 'HAS_KNOWLEDGE',
      skill: 'HAS_SKILL',
      trait: 'HAS_TRAIT',
      milestone: 'ACHIEVED'
    };

    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/create-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({
          sourceId: userElementId,
          targetId: targetNodeElementId,
          type: relationshipType[nodeType],
          properties
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create progress' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error creating user progress:', err);
      return { success: false, error: 'Network error' };
    }
  }

  async deleteUserProgress(relationshipElementId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/delete-relationship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({ relationshipElementId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to delete progress' };
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting user progress:', err);
      return { success: false, error: 'Network error' };
    }
  }

  // Domain Creator endpoints
  async createNode(
    labels: string[],
    properties: Record<string, unknown>
  ): Promise<CreateNodeResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/create-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({ labels, properties }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || errorData.details || 'Failed to create node' };
      }

      const data = await response.json();
      // Response is an array of nodes with PascalCase keys (ElementId, Labels, Props)
      const nodeData = data[0];
      return {
        success: true,
        node: {
          elementId: nodeData.ElementId,
          labels: nodeData.Labels,
          props: nodeData.Props,
        },
      };
    } catch (err) {
      console.error('Error creating node:', err);
      return { success: false, error: 'Network error' };
    }
  }

  async searchNodes(
    query: string,
    labels?: string[],
    limit?: number
  ): Promise<{ nodes: SearchNodeResult[] } | null> {
    try {
      const params = new URLSearchParams({ query });
      if (labels && labels.length > 0) {
        params.set('labels', labels.join(','));
      }
      if (limit) {
        params.set('limit', limit.toString());
      }

      const response = await fetch(
        `${this.API_BASE}/secure/graph/search-nodes?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error searching nodes:', err);
      return null;
    }
  }

  async validateDomainName(name: string): Promise<{ available: boolean; existingDomainElementId?: string } | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/secure/graph/validate-domain-name?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error validating domain name:', err);
      return null;
    }
  }

  async createDomain(request: CreateDomainRequest): Promise<CreateDomainResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/create-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create domain' };
      }

      const data = await response.json();
      return { success: true, domain: data.domain, createdNodes: data.createdNodes };
    } catch (err) {
      console.error('Error creating domain:', err);
      return { success: false, error: 'Network error' };
    }
  }

  async updateDomain(request: UpdateDomainRequest): Promise<UpdateDomainResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/update-domain`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to update domain' };
      }

      const data = await response.json();
      return {
        success: true,
        domain: data.domain,
        createdNodes: data.createdNodes,
        affectedUserProgressCount: data.affectedUserProgressCount,
      };
    } catch (err) {
      console.error('Error updating domain:', err);
      return { success: false, error: 'Network error' };
    }
  }

  // Domain Generator endpoints
  async findSimilarDomains(
    domainName: string,
    limit: number = 5
  ): Promise<SimilarDomainResult[] | null> {
    try {
      const response = await fetch(`${this.API_BASE}/secure/graph/similar-nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({
          text: domainName,
          label: 'Domain',
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error finding similar domains:', err);
      return null;
    }
  }

  generateDomain(
    domainName: string,
    description: string,
    onEvent: (event: DomainGenerationEvent) => void,
    onError: (error: string) => void,
    onComplete: () => void
  ): () => void {
    const controller = new AbortController();

    fetch(`${this.API_BASE}/secure/agent/generate-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
      },
      body: JSON.stringify({ domainName, description }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonStr = line.slice(5).trim();
              if (jsonStr && jsonStr !== 'ping') {
                try {
                  const event = JSON.parse(jsonStr) as DomainGenerationEvent;
                  onEvent(event);

                  if (event.type === 'completed' || event.type === 'failed') {
                    onComplete();
                    return;
                  }
                } catch (e) {
                  console.error('Failed to parse SSE event:', e);
                }
              }
            }
          }
        }

        onComplete();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message);
        }
      });

    return () => controller.abort();
  }
}

// Types for domain creator API
export interface SearchNodeResult {
  elementId: string;
  labels: string[];
  props: {
    name: string;
    description?: string;
    how_to_learn?: string;
    how_to_develop?: string;
    measurement_criteria?: string;
    how_to_achieve?: string;
    [key: string]: unknown;
  };
}

export interface NewNodeData {
  name: string;
  description: string;
  how_to_learn?: string;
  how_to_develop?: string;
  measurement_criteria?: string;
  how_to_achieve?: string;
}

export interface KnowledgeRequirement {
  nodeElementId?: string;
  newNode?: NewNodeData;
  bloom_level: string;
}

export interface SkillRequirement {
  nodeElementId?: string;
  newNode?: NewNodeData;
  dreyfus_level: string;
}

export interface TraitRequirement {
  nodeElementId?: string;
  newNode?: NewNodeData;
  min_score: number;
}

export interface MilestoneRequirement {
  nodeElementId?: string;
  newNode?: NewNodeData;
}

export interface LevelRequirements {
  knowledge: KnowledgeRequirement[];
  skills: SkillRequirement[];
  traits: TraitRequirement[];
  milestones: MilestoneRequirement[];
}

export interface DomainLevelRequest {
  level: number;
  name: string;
  description?: string;
  points_required: number;
  requirements: LevelRequirements;
}

export interface CreateDomainRequest {
  domain: {
    name: string;
    description: string;
  };
  levels: DomainLevelRequest[];
}

export interface CreateDomainResponse {
  success: boolean;
  domain?: {
    elementId: string;
    name: string;
  };
  createdNodes?: Array<{
    elementId: string;
    name: string;
    labels: string[];
  }>;
  error?: string;
}

export interface CreateNodeResponse {
  success: boolean;
  node?: {
    elementId: string;
    labels: string[];
    props: Record<string, unknown>;
  };
  error?: string;
}

export interface UpdateDomainRequest {
  domainElementId: string;
  domain: {
    name: string;
    description: string;
  };
  levels: DomainLevelRequest[];
  removedNodeElementIds: string[];
}

export interface UpdateDomainResponse {
  success: boolean;
  domain?: {
    elementId: string;
    name: string;
  };
  createdNodes?: Array<{
    elementId: string;
    name: string;
    labels: string[];
  }>;
  affectedUserProgressCount?: number;
  error?: string;
}

// Domain Generator types
export interface SimilarDomainResult {
  name: string;
  description: string | null;
  id: string;
  score: number;
}

export type DomainGenerationEventType =
  | 'started'
  | 'agent_started'
  | 'step_progress'
  | 'similarity_check'
  | 'verification_result'
  | 'node_created'
  | 'agent_completed'
  | 'agent_failed'
  | 'completed'
  | 'failed';

export interface DomainGenerationEvent {
  type: DomainGenerationEventType;
  domainName?: string;
  totalAgents?: number;
  agent?: string;
  agentNumber?: number;
  agentName?: string;
  message?: string;
  concept?: string;
  similarFound?: number;
  topScore?: number;
  decision?: string;
  generalizesTo?: string;
  nodeName?: string;
  label?: string;
  wasReused?: boolean;
  nodesCreated?: number;
  nodesReused?: number;
  error?: string;
  lastAgent?: string;
  statistics?: {
    domainLevelsCreated: number;
    knowledgeCreated: number;
    skillsCreated: number;
    traitsCreated: number;
    milestonesCreated: number;
    relationshipsCreated: number;
    nodesReused: number;
    generationTimeMs: number;
  };
}