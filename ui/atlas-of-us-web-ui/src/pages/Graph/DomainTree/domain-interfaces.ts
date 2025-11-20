// Domain-related TypeScript interfaces

export interface DomainLevel {
  level: number;
  name: string;
  total_points_required: number;
  knowledge_count?: number;
  knowledge_at_level_count?: number;
  knowledge_min_bloom_level?: string;
  skill_count?: number;
  skill_at_level_count?: number;
  skill_min_dreyfus_level?: string;
  trait_requirements?: number;
  milestone_requirements?: number;
  milestone_any_of?: boolean;
  milestone_all_required?: boolean;
}

export interface KnowledgeNode {
  name: string;
  description?: string;
  how_to_learn?: string;
  remember_level?: string;
  understand_level?: string;
  apply_level?: string;
  analyze_level?: string;
  evaluate_level?: string;
  create_level?: string;
}

export interface KnowledgeRequirement {
  node: KnowledgeNode;
  relationship: {
    bloom_level: string;
  };
}

export interface SkillNode {
  name: string;
  description?: string;
  how_to_develop?: string;
  novice_level?: string;
  advanced_beginner_level?: string;
  competent_level?: string;
  proficient_level?: string;
  expert_level?: string;
}

export interface SkillRequirement {
  node: SkillNode;
  relationship: {
    dreyfus_level: string;
  };
}

export interface TraitNode {
  name: string;
  description?: string;
  measurement_criteria?: string;
}

export interface TraitRequirement {
  node: TraitNode;
  relationship: {
    min_score: number;
  };
}

export interface MilestoneNode {
  name: string;
  description?: string;
  how_to_achieve?: string;
}

export interface MilestoneRequirement {
  node: MilestoneNode;
  relationship: {
    any_of?: boolean;
  };
}

export interface LevelData {
  level: DomainLevel;
  knowledge: KnowledgeRequirement[];
  skills: SkillRequirement[];
  traits: TraitRequirement[];
  milestones: MilestoneRequirement[];
}

export interface Domain {
  name: string;
}

export interface DomainData {
  domain: Domain;
  levels: LevelData[];
}
