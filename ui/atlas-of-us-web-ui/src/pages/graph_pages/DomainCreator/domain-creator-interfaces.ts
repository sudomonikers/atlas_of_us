// Types for the Domain Creator UI

export type NodeType = 'knowledge' | 'skill' | 'trait' | 'milestone';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type DreyfusLevel = 'Novice' | 'Advanced Beginner' | 'Competent' | 'Proficient' | 'Expert';

// Node that can be added to a domain (either existing or new)
export interface EditableNode {
  id: string;                    // Temporary client ID (uuid)
  elementId?: string;            // Neo4j ID if existing node
  isNew: boolean;                // True if created in this session
  type: NodeType;
  name: string;
  description: string;
  typeSpecificProps: {
    how_to_learn?: string;       // Knowledge
    how_to_develop?: string;     // Skill
    measurement_criteria?: string; // Trait
    how_to_achieve?: string;     // Milestone
  };
  requirement: {
    bloomLevel?: BloomLevel;
    dreyfusLevel?: DreyfusLevel;
    minScore?: number;
  };
}

// A level in the domain being created
export interface EditableDomainLevel {
  id: string;                    // Temporary client ID
  level: number;                 // 1-5
  name: string;
  description: string;
  pointsRequired: number;
  knowledge: EditableNode[];
  skills: EditableNode[];
  traits: EditableNode[];
  milestones: EditableNode[];
}

// The domain being created
export interface EditableDomain {
  name: string;
  description: string;
  levels: EditableDomainLevel[];
}

// Search result node from API
export interface SearchResultNode {
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

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  levelIndex?: number;
}

// Default level names
export const DEFAULT_LEVEL_NAMES = [
  'Novice',
  'Apprentice',
  'Journeyman',
  'Expert',
  'Master',
];

// Default points per level
export const DEFAULT_LEVEL_POINTS = [50, 150, 300, 600, 1000];

// Bloom's Taxonomy levels
export const BLOOM_LEVELS: BloomLevel[] = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
];

// Dreyfus Model levels
export const DREYFUS_LEVELS: DreyfusLevel[] = [
  'Novice',
  'Advanced Beginner',
  'Competent',
  'Proficient',
  'Expert',
];

// Helper to create a new empty level
export function createEmptyLevel(levelNumber: number): EditableDomainLevel {
  return {
    id: crypto.randomUUID(),
    level: levelNumber,
    name: DEFAULT_LEVEL_NAMES[levelNumber - 1] || `Level ${levelNumber}`,
    description: '',
    pointsRequired: DEFAULT_LEVEL_POINTS[levelNumber - 1] || levelNumber * 100,
    knowledge: [],
    skills: [],
    traits: [],
    milestones: [],
  };
}

// Helper to create a new domain with empty levels
export function createEmptyDomain(): EditableDomain {
  return {
    name: '',
    description: '',
    levels: [1, 2, 3, 4, 5].map(createEmptyLevel),
  };
}

// Helper to convert SearchResultNode to EditableNode
export function searchResultToEditableNode(
  result: SearchResultNode,
  type: NodeType
): EditableNode {
  return {
    id: crypto.randomUUID(),
    elementId: result.elementId,
    isNew: false,
    type,
    name: result.props.name,
    description: result.props.description || '',
    typeSpecificProps: {
      how_to_learn: result.props.how_to_learn,
      how_to_develop: result.props.how_to_develop,
      measurement_criteria: result.props.measurement_criteria,
      how_to_achieve: result.props.how_to_achieve,
    },
    requirement: getDefaultRequirement(type),
  };
}

// Helper to get default requirement based on type
export function getDefaultRequirement(type: NodeType): EditableNode['requirement'] {
  switch (type) {
    case 'knowledge':
      return { bloomLevel: 'Remember' };
    case 'skill':
      return { dreyfusLevel: 'Novice' };
    case 'trait':
      return { minScore: 50 };
    case 'milestone':
      return {};
  }
}

// Helper to create a new node
export function createNewNode(type: NodeType, name: string, description: string): EditableNode {
  return {
    id: crypto.randomUUID(),
    isNew: true,
    type,
    name,
    description,
    typeSpecificProps: {},
    requirement: getDefaultRequirement(type),
  };
}
