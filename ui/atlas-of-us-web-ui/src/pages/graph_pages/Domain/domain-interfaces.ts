// Unified domain data format - used by both viewer and creator

export type NodeType = 'knowledge' | 'skill' | 'trait' | 'milestone';

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
