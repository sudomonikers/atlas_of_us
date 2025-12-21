// Types for the node tree canvas visualization

export type NodeType = 'knowledge' | 'skill' | 'trait' | 'milestone' | 'level';

export interface CanvasNode {
  id: string;
  name: string;
  description?: string;
  type: NodeType;
  levelIndex: number; // 0-4 for levels 1-5
  x: number;
  y: number;
  radius: number;
  requirement?: {
    bloomLevel?: string;
    dreyfusLevel?: string;
    minScore?: number;
  };
  // Neo4j element ID for user progress tracking
  elementId?: string;
  // Original data for detail panel
  originalData?: Record<string, unknown>;
  // Generalization - for nodes where user has related skill/knowledge from another domain
  hasGeneralizedCoverage?: boolean;
  generalizationSources?: { nodeName: string; sourceDomain?: string }[];
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  hoveredNode: CanvasNode | null;
}

export interface Connection {
  from: CanvasNode;
  to: CanvasNode;
  isMainPath: boolean;
}

export interface LayoutResult {
  nodes: CanvasNode[];
  connections: Connection[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}
