use serde::{Deserialize, Serialize};
use validator::Validate;

// ========== Request/Response Models ==========

#[derive(Debug, Deserialize, Validate)]
pub struct GenerateDomainRequest {
    #[validate(length(min = 1, max = 100, message = "Domain name must be 1-100 characters"))]
    #[serde(rename = "domainName")]
    pub domain_name: String,

    #[validate(length(max = 500, message = "Description must be at most 500 characters"))]
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DomainStatistics {
    #[serde(rename = "domainLevelsCreated")]
    pub domain_levels_created: usize,
    #[serde(rename = "knowledgeCreated")]
    pub knowledge_created: usize,
    #[serde(rename = "skillsCreated")]
    pub skills_created: usize,
    #[serde(rename = "traitsCreated")]
    pub traits_created: usize,
    #[serde(rename = "milestonesCreated")]
    pub milestones_created: usize,
    #[serde(rename = "relationshipsCreated")]
    pub relationships_created: usize,
    #[serde(rename = "nodesReused")]
    pub nodes_reused: usize,
    #[serde(rename = "generationTimeMs")]
    pub generation_time_ms: u64,
}

impl Default for DomainStatistics {
    fn default() -> Self {
        Self {
            domain_levels_created: 0,
            knowledge_created: 0,
            skills_created: 0,
            traits_created: 0,
            milestones_created: 0,
            relationships_created: 0,
            nodes_reused: 0,
            generation_time_ms: 0,
        }
    }
}

// ========== Domain Graph Registry ==========

/// A node that was created or reused in the database
#[derive(Debug, Clone, Serialize)]
pub struct CreatedNode {
    pub name: String,
    pub element_id: String,
    pub label: String,
    pub was_reused: bool,
}

impl CreatedNode {
    pub fn new(name: String, element_id: String, label: String) -> Self {
        Self {
            name,
            element_id,
            label,
            was_reused: false,
        }
    }

    pub fn reused(name: String, element_id: String, label: String) -> Self {
        Self {
            name,
            element_id,
            label,
            was_reused: true,
        }
    }
}

/// A relationship between a domain level and a component node
#[derive(Debug, Clone, Serialize)]
pub struct LevelRequirement {
    /// Element ID of the domain level
    pub level_id: String,
    /// Element ID of the component node
    pub component_id: String,
    /// Name of the component for display
    pub component_name: String,
    /// Type of component (Knowledge, Skill, Trait, Milestone)
    pub component_type: String,
    /// Proficiency level required (bloom_level, dreyfus_level, or min_score)
    pub proficiency: Option<String>,
}

/// A generalization relationship from a domain-specific node to a general node
#[derive(Debug, Clone, Serialize)]
pub struct GeneralizationLink {
    /// Element ID of the domain-specific node
    pub specific_id: String,
    /// Name of the domain-specific node
    pub specific_name: String,
    /// Element ID of the general node
    pub general_id: String,
    /// Name of the general node
    pub general_name: String,
    /// Type of node (Knowledge, Skill, Milestone)
    pub node_type: String,
}

/// A prerequisite relationship between component nodes
#[derive(Debug, Clone, Serialize)]
pub struct PrerequisiteLink {
    /// Element ID of the source node (the one that has the requirement)
    pub source_id: String,
    /// Name of the source node
    pub source_name: String,
    /// Element ID of the target node (the prerequisite)
    pub target_id: String,
    /// Name of the target node
    pub target_name: String,
    /// Relationship type (REQUIRES_KNOWLEDGE, REQUIRES_SKILL, etc.)
    pub relationship_type: String,
}

/// Registry tracking all nodes and relationships created during domain generation
#[derive(Debug, Clone, Default, Serialize)]
pub struct DomainGraphRegistry {
    // Nodes
    pub domain: Option<CreatedNode>,
    pub domain_levels: Vec<CreatedNode>,
    pub knowledge: Vec<CreatedNode>,
    pub skills: Vec<CreatedNode>,
    pub traits: Vec<CreatedNode>,
    pub milestones: Vec<CreatedNode>,

    // Relationships
    #[serde(rename = "levelRequirements")]
    pub level_requirements: Vec<LevelRequirement>,
    #[serde(rename = "generalizations")]
    pub generalizations: Vec<GeneralizationLink>,
    #[serde(rename = "prerequisites")]
    pub prerequisites: Vec<PrerequisiteLink>,
}

impl DomainGraphRegistry {
    /// Get a summary of created nodes for passing to LLM context
    pub fn summary_for_llm(&self) -> String {
        format!(
            "Created nodes:\n- Domain Levels: {:?}\n- Knowledge: {:?}\n- Skills: {:?}\n- Traits: {:?}\n- Milestones: {:?}",
            self.domain_levels.iter().map(|n| &n.name).collect::<Vec<_>>(),
            self.knowledge.iter().map(|n| &n.name).collect::<Vec<_>>(),
            self.skills.iter().map(|n| &n.name).collect::<Vec<_>>(),
            self.traits.iter().map(|n| &n.name).collect::<Vec<_>>(),
            self.milestones.iter().map(|n| &n.name).collect::<Vec<_>>(),
        )
    }

    /// Find a node by name across all types
    pub fn find_by_name(&self, name: &str) -> Option<&CreatedNode> {
        self.knowledge.iter()
            .chain(self.skills.iter())
            .chain(self.traits.iter())
            .chain(self.milestones.iter())
            .chain(self.domain_levels.iter())
            .find(|n| n.name == name)
    }

    /// Find a node by element ID across all types
    pub fn find_by_id(&self, element_id: &str) -> Option<&CreatedNode> {
        self.all_nodes().into_iter()
            .find(|n| n.element_id == element_id)
    }

    /// Get all nodes as a flat list
    pub fn all_nodes(&self) -> Vec<&CreatedNode> {
        let mut nodes = Vec::new();
        if let Some(ref domain) = self.domain {
            nodes.push(domain);
        }
        nodes.extend(self.domain_levels.iter());
        nodes.extend(self.knowledge.iter());
        nodes.extend(self.skills.iter());
        nodes.extend(self.traits.iter());
        nodes.extend(self.milestones.iter());
        nodes
    }

    /// Count total nodes created (not reused)
    pub fn count_created(&self) -> usize {
        self.all_nodes().iter().filter(|n| !n.was_reused).count()
    }

    /// Count nodes reused
    pub fn count_reused(&self) -> usize {
        self.all_nodes().iter().filter(|n| n.was_reused).count()
    }

    /// Add a level requirement relationship
    pub fn add_level_requirement(&mut self, req: LevelRequirement) {
        self.level_requirements.push(req);
    }

    /// Add a generalization relationship
    pub fn add_generalization(&mut self, link: GeneralizationLink) {
        self.generalizations.push(link);
    }

    /// Add a prerequisite relationship
    pub fn add_prerequisite(&mut self, link: PrerequisiteLink) {
        self.prerequisites.push(link);
    }

    /// Get all generalizations for a specific node
    pub fn get_generalizations_for(&self, specific_id: &str) -> Vec<&GeneralizationLink> {
        self.generalizations.iter()
            .filter(|g| g.specific_id == specific_id)
            .collect()
    }

    /// Get all level requirements for a specific level
    pub fn get_requirements_for_level(&self, level_id: &str) -> Vec<&LevelRequirement> {
        self.level_requirements.iter()
            .filter(|r| r.level_id == level_id)
            .collect()
    }

    /// Get all prerequisites for a specific node
    pub fn get_prerequisites_for(&self, source_id: &str) -> Vec<&PrerequisiteLink> {
        self.prerequisites.iter()
            .filter(|p| p.source_id == source_id)
            .collect()
    }

    /// Deduplicate node vectors by element_id
    /// Removes duplicate entries that may occur when a node is added as both
    /// a generalization target and a main concept
    pub fn deduplicate(&mut self) {
        use std::collections::HashSet;

        let mut seen = HashSet::new();
        self.knowledge.retain(|n| seen.insert(n.element_id.clone()));

        seen.clear();
        self.skills.retain(|n| seen.insert(n.element_id.clone()));

        seen.clear();
        self.traits.retain(|n| seen.insert(n.element_id.clone()));

        seen.clear();
        self.milestones.retain(|n| seen.insert(n.element_id.clone()));

        seen.clear();
        self.domain_levels.retain(|n| seen.insert(n.element_id.clone()));
    }
}

/// Type alias for backward compatibility
pub type CreatedNodeRegistry = DomainGraphRegistry;

// ========== Similarity Search Types ==========

/// Decision after LLM verification of similar nodes
#[derive(Debug, Clone)]
pub struct VerifiedConcept {
    pub name: String,
    pub action: ConceptAction,
}

impl VerifiedConcept {
    pub fn create_new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            action: ConceptAction::CreateNew,
        }
    }

    pub fn use_existing(name: &str, element_id: &str) -> Self {
        Self {
            name: name.to_string(),
            action: ConceptAction::UseExisting {
                element_id: element_id.to_string(),
            },
        }
    }

    pub fn create_and_generalize(name: &str, generalizes_to_id: &str, generalizes_to_name: &str, needs_creation: bool) -> Self {
        Self {
            name: name.to_string(),
            action: ConceptAction::CreateAndGeneralize {
                generalizes_to_id: generalizes_to_id.to_string(),
                generalizes_to_name: generalizes_to_name.to_string(),
                needs_creation,
            },
        }
    }
}

#[derive(Debug, Clone)]
pub enum ConceptAction {
    /// Create a brand new node
    CreateNew,
    /// Use an existing node directly (very high similarity)
    UseExisting { element_id: String },
    /// Create new domain-specific node and link GENERALIZES_TO existing or new target
    CreateAndGeneralize {
        generalizes_to_id: String,
        generalizes_to_name: String,
        /// True if the target node needs to be created (doesn't exist yet)
        needs_creation: bool,
    },
}

// ========== Agent Definitions ==========

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    DomainArchitect,
    KnowledgeGenerator,
    SkillGenerator,
    TraitGenerator,
    MilestoneGenerator,
    LevelDistributor,
    PrerequisiteMapper,
}

impl AgentType {
    pub fn display_name(&self) -> &'static str {
        match self {
            AgentType::DomainArchitect => "Domain Architect",
            AgentType::KnowledgeGenerator => "Knowledge Generator",
            AgentType::SkillGenerator => "Skill Generator",
            AgentType::TraitGenerator => "Trait Generator",
            AgentType::MilestoneGenerator => "Milestone Generator",
            AgentType::LevelDistributor => "Level Distributor",
            AgentType::PrerequisiteMapper => "Prerequisite Mapper",
        }
    }

    pub fn instruction_file(&self) -> &'static str {
        match self {
            AgentType::DomainArchitect => "1_domain_architect.md",
            AgentType::KnowledgeGenerator => "2a_knowledge_generator.md",
            AgentType::SkillGenerator => "2b_skill_generator.md",
            AgentType::TraitGenerator => "2c_trait_generator.md",
            AgentType::MilestoneGenerator => "2d_milestone_generator.md",
            AgentType::LevelDistributor => "3a_level_distributor.md",
            AgentType::PrerequisiteMapper => "3b_prerequisite_mapper.md",
        }
    }

    pub fn order(&self) -> u8 {
        match self {
            AgentType::DomainArchitect => 1,
            AgentType::KnowledgeGenerator => 2,
            AgentType::SkillGenerator => 3,
            AgentType::TraitGenerator => 4,
            AgentType::MilestoneGenerator => 5,
            AgentType::LevelDistributor => 6,
            AgentType::PrerequisiteMapper => 7,
        }
    }

    /// Returns all agents in execution order
    pub fn all_agents() -> [AgentType; 7] {
        [
            AgentType::DomainArchitect,
            AgentType::KnowledgeGenerator,
            AgentType::SkillGenerator,
            AgentType::TraitGenerator,
            AgentType::MilestoneGenerator,
            AgentType::LevelDistributor,
            AgentType::PrerequisiteMapper,
        ]
    }
}

// ========== SSE Event Types ==========

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SseEvent {
    /// Workflow started
    Started {
        #[serde(rename = "domainName")]
        domain_name: String,
        #[serde(rename = "totalAgents")]
        total_agents: u8,
    },

    /// Domain already exists - generation blocked
    DomainExists {
        #[serde(rename = "requestedName")]
        requested_name: String,
        #[serde(rename = "existingDomain")]
        existing_domain: String,
    },

    /// Agent execution started
    AgentStarted {
        agent: AgentType,
        #[serde(rename = "agentNumber")]
        agent_number: u8,
        #[serde(rename = "agentName")]
        agent_name: String,
    },

    /// Progress update during agent execution
    StepProgress {
        agent: AgentType,
        message: String,
    },

    /// A similarity check was performed
    SimilarityCheck {
        agent: AgentType,
        concept: String,
        #[serde(rename = "similarFound")]
        similar_found: usize,
        #[serde(rename = "topScore")]
        top_score: Option<f64>,
    },

    /// Verification result after LLM check
    VerificationResult {
        agent: AgentType,
        concept: String,
        decision: String, // "create_new", "use_existing", "create_and_generalize"
        #[serde(rename = "generalizesTo")]
        generalizes_to: Option<String>,
    },

    /// A node was created
    NodeCreated {
        agent: AgentType,
        #[serde(rename = "nodeName")]
        node_name: String,
        label: String,
        #[serde(rename = "wasReused")]
        was_reused: bool,
    },

    /// Agent execution completed
    AgentCompleted {
        agent: AgentType,
        #[serde(rename = "nodesCreated")]
        nodes_created: usize,
        #[serde(rename = "nodesReused")]
        nodes_reused: usize,
    },

    /// Agent execution failed
    AgentFailed { agent: AgentType, error: String },

    /// Workflow completed successfully
    Completed {
        #[serde(rename = "domainName")]
        domain_name: String,
        statistics: DomainStatistics,
    },

    /// Workflow failed
    Failed {
        error: String,
        #[serde(rename = "lastAgent")]
        last_agent: Option<AgentType>,
        #[serde(rename = "nodesCreatedBeforeFailure")]
        nodes_created_before_failure: Option<CreatedNodeRegistry>,
    },
}

// ========== Internal State ==========

/// Context maintained throughout domain generation
#[derive(Debug, Clone)]
pub struct AgentContext {
    pub domain_name: String,
    pub description: Option<String>,
    pub domain_element_id: Option<String>,
    pub domain_graph: DomainGraphRegistry,
}

impl AgentContext {
    pub fn new(domain_name: String, description: Option<String>) -> Self {
        Self {
            domain_name,
            description,
            domain_element_id: None,
            domain_graph: DomainGraphRegistry::default(),
        }
    }

    pub fn set_domain(&mut self, domain: CreatedNode) {
        self.domain_element_id = Some(domain.element_id.clone());
        self.domain_graph.domain = Some(domain);
    }

    pub fn add_domain_level(&mut self, node: CreatedNode) {
        self.domain_graph.domain_levels.push(node);
    }

    pub fn add_knowledge(&mut self, node: CreatedNode) {
        self.domain_graph.knowledge.push(node);
    }

    pub fn add_skill(&mut self, node: CreatedNode) {
        self.domain_graph.skills.push(node);
    }

    pub fn add_trait(&mut self, node: CreatedNode) {
        self.domain_graph.traits.push(node);
    }

    pub fn add_milestone(&mut self, node: CreatedNode) {
        self.domain_graph.milestones.push(node);
    }

    pub fn add_level_requirement(&mut self, req: LevelRequirement) {
        self.domain_graph.add_level_requirement(req);
    }

    pub fn add_generalization(&mut self, link: GeneralizationLink) {
        self.domain_graph.add_generalization(link);
    }

    pub fn add_prerequisite(&mut self, link: PrerequisiteLink) {
        self.domain_graph.add_prerequisite(link);
    }
}

/// Result returned after domain generation completes
#[derive(Debug, Clone, Serialize)]
pub struct DomainGenerationResult {
    #[serde(rename = "domainName")]
    pub domain_name: String,
    #[serde(rename = "domainElementId")]
    pub domain_element_id: String,
    #[serde(rename = "domainGraph")]
    pub domain_graph: DomainGraphRegistry,
    pub statistics: DomainStatistics,
}
