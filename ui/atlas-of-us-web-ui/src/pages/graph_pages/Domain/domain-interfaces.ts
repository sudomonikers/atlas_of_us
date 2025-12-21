// Unified domain data format - used by both viewer and creator

export type NodeType = 'knowledge' | 'skill' | 'trait' | 'milestone';

// Generalization reference - links to a general skill/knowledge node
export interface GeneralizesToRef {
  elementId: string;
  name: string;
}

// For tracking which domain nodes have generalized coverage from user's other skills/knowledge
export interface GeneralizationSource {
  nodeElementId: string;
  nodeName: string;
}

export type GeneralizationMap = Map<string, GeneralizationSource[]>;

export interface DomainNode {
  elementId: string;
  type: NodeType;
  name: string;
  description?: string;
  // Type-specific props
  howToLearn?: string;        // knowledge
  howToDevelop?: string;      // skill
  measurementCriteria?: string; // trait
  howToAchieve?: string;      // milestone
  // Requirement (from relationship)
  bloomLevel?: string;        // knowledge requirement
  dreyfusLevel?: string;      // skill requirement
  minScore?: number;          // trait requirement
  // Generalization - what general skill/knowledge this maps to
  generalizesTo?: GeneralizesToRef | null;
}

export interface DomainLevel {
  elementId: string;
  level: number;
  name: string;
  description?: string;
  pointsRequired: number;
  knowledge: DomainNode[];
  skills: DomainNode[];
  traits: DomainNode[];
  milestones: DomainNode[];
}

export interface DomainData {
  elementId: string;
  name: string;
  description?: string;
  levels: DomainLevel[];
}
