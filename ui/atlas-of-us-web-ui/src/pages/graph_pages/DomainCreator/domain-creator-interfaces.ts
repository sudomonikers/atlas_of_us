// Types for the Domain Creator UI
// Aligned with unified DomainData format from Domain viewer

import type { DomainData, DomainNode, DomainLevel } from '../Domain/domain-interfaces';

export type NodeType = 'knowledge' | 'skill' | 'trait' | 'milestone';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type DreyfusLevel = 'Novice' | 'Advanced Beginner' | 'Competent' | 'Proficient' | 'Expert';

// Node that can be added to a domain (either existing or new)
// If elementId is present, node exists in database; otherwise it's pending creation
export interface EditableNode {
  id: string;                    // Temporary client ID (uuid) for tracking during editing
  elementId?: string;            // Neo4j ID - present if node exists in database
  type: NodeType;
  name: string;
  description: string;
  // Type-specific props (aligned with unified format)
  howToLearn?: string;           // Knowledge
  howToDevelop?: string;         // Skill
  measurementCriteria?: string;  // Trait
  howToAchieve?: string;         // Milestone
  // Requirement (aligned with unified format)
  bloomLevel?: BloomLevel;
  dreyfusLevel?: DreyfusLevel;
  minScore?: number;
}

// A level in the domain being created/edited
export interface EditableDomainLevel {
  id: string;                    // Temporary client ID
  elementId?: string;            // Neo4j ID - present if level exists in database
  level: number;                 // 1-5
  name: string;
  description: string;
  pointsRequired: number;
  knowledge: EditableNode[];
  skills: EditableNode[];
  traits: EditableNode[];
  milestones: EditableNode[];
}

// The domain being created/edited
export interface EditableDomain {
  elementId?: string;            // Neo4j ID - present if domain exists in database
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
    type,
    name: result.props.name,
    description: result.props.description || '',
    howToLearn: result.props.how_to_learn,
    howToDevelop: result.props.how_to_develop,
    measurementCriteria: result.props.measurement_criteria,
    howToAchieve: result.props.how_to_achieve,
    ...getDefaultRequirement(type),
  };
}

// Helper to get default requirement based on type
export function getDefaultRequirement(type: NodeType): Partial<EditableNode> {
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

// Helper to create a new node (elementId will be set after API creation)
export function createNewNode(
  type: NodeType,
  name: string,
  description: string,
  elementId?: string
): EditableNode {
  return {
    id: crypto.randomUUID(),
    elementId,
    type,
    name,
    description,
    ...getDefaultRequirement(type),
  };
}

// Convert DomainNode (from API) to EditableNode
function domainNodeToEditableNode(node: DomainNode): EditableNode {
  return {
    id: crypto.randomUUID(),
    elementId: node.elementId,
    type: node.type,
    name: node.name,
    description: node.description || '',
    howToLearn: node.howToLearn,
    howToDevelop: node.howToDevelop,
    measurementCriteria: node.measurementCriteria,
    howToAchieve: node.howToAchieve,
    bloomLevel: node.bloomLevel as BloomLevel | undefined,
    dreyfusLevel: node.dreyfusLevel as DreyfusLevel | undefined,
    minScore: node.minScore,
  };
}

// Convert DomainLevel (from API) to EditableDomainLevel
function domainLevelToEditableLevel(level: DomainLevel): EditableDomainLevel {
  return {
    id: crypto.randomUUID(),
    elementId: level.elementId,
    level: level.level,
    name: level.name,
    description: level.description || '',
    pointsRequired: level.pointsRequired,
    knowledge: level.knowledge.map(domainNodeToEditableNode),
    skills: level.skills.map(domainNodeToEditableNode),
    traits: level.traits.map(domainNodeToEditableNode),
    milestones: level.milestones.map(domainNodeToEditableNode),
  };
}

// Convert DomainData (from API) to EditableDomain for edit mode
export function domainDataToEditableDomain(data: DomainData): EditableDomain {
  return {
    elementId: data.elementId,
    name: data.name,
    description: data.description || '',
    levels: data.levels.map(domainLevelToEditableLevel),
  };
}
