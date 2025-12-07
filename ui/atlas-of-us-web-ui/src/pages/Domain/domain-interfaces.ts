// Interface for domain data returned from /api/secure/graph/domain endpoint

export interface DomainRequirement {
  node: {
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  relationship: {
    [key: string]: unknown;
  };
}

export interface DomainLevel {
  level: {
    level: number;
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  knowledge: DomainRequirement[];
  skills: DomainRequirement[];
  traits: DomainRequirement[];
  milestones: DomainRequirement[];
}

export interface DomainData {
  domain: {
    name: string;
    description?: string;
    [key: string]: unknown;
  };
  levels: DomainLevel[];
}
