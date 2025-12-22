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

// ========== Created Node Tracking ==========

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

/// Registry tracking all nodes created during domain generation
#[derive(Debug, Clone, Default, Serialize)]
pub struct CreatedNodeRegistry {
    pub domain: Option<CreatedNode>,
    pub domain_levels: Vec<CreatedNode>,
    pub knowledge: Vec<CreatedNode>,
    pub skills: Vec<CreatedNode>,
    pub traits: Vec<CreatedNode>,
    pub milestones: Vec<CreatedNode>,
}

impl CreatedNodeRegistry {
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
}

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

    pub fn create_and_generalize(name: &str, generalizes_to_id: &str, generalizes_to_name: &str) -> Self {
        Self {
            name: name.to_string(),
            action: ConceptAction::CreateAndGeneralize {
                generalizes_to_id: generalizes_to_id.to_string(),
                generalizes_to_name: generalizes_to_name.to_string(),
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
    /// Create new domain-specific node and link GENERALIZES_TO existing
    CreateAndGeneralize {
        generalizes_to_id: String,
        generalizes_to_name: String,
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
    RelationshipMapper,
}

impl AgentType {
    pub fn display_name(&self) -> &'static str {
        match self {
            AgentType::DomainArchitect => "Domain Architect",
            AgentType::KnowledgeGenerator => "Knowledge Generator",
            AgentType::SkillGenerator => "Skill Generator",
            AgentType::TraitGenerator => "Trait Generator",
            AgentType::MilestoneGenerator => "Milestone Generator",
            AgentType::RelationshipMapper => "Relationship Mapper",
        }
    }

    pub fn instruction_file(&self) -> &'static str {
        match self {
            AgentType::DomainArchitect => "1_domain_architect.md",
            AgentType::KnowledgeGenerator => "2a_knowledge_generator.md",
            AgentType::SkillGenerator => "2b_skill_generator.md",
            AgentType::TraitGenerator => "2c_trait_generator.md",
            AgentType::MilestoneGenerator => "2d_milestone_generator.md",
            AgentType::RelationshipMapper => "3_relationship_mapper.md",
        }
    }

    pub fn order(&self) -> u8 {
        match self {
            AgentType::DomainArchitect => 1,
            AgentType::KnowledgeGenerator => 2,
            AgentType::SkillGenerator => 3,
            AgentType::TraitGenerator => 4,
            AgentType::MilestoneGenerator => 5,
            AgentType::RelationshipMapper => 6,
        }
    }

    /// Returns all agents in execution order
    pub fn all_agents() -> [AgentType; 6] {
        [
            AgentType::DomainArchitect,
            AgentType::KnowledgeGenerator,
            AgentType::SkillGenerator,
            AgentType::TraitGenerator,
            AgentType::MilestoneGenerator,
            AgentType::RelationshipMapper,
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
    pub created_nodes: CreatedNodeRegistry,
}

impl AgentContext {
    pub fn new(domain_name: String, description: Option<String>) -> Self {
        Self {
            domain_name,
            description,
            domain_element_id: None,
            created_nodes: CreatedNodeRegistry::default(),
        }
    }

    pub fn set_domain(&mut self, domain: CreatedNode) {
        self.domain_element_id = Some(domain.element_id.clone());
        self.created_nodes.domain = Some(domain);
    }

    pub fn add_domain_level(&mut self, node: CreatedNode) {
        self.created_nodes.domain_levels.push(node);
    }

    pub fn add_knowledge(&mut self, node: CreatedNode) {
        self.created_nodes.knowledge.push(node);
    }

    pub fn add_skill(&mut self, node: CreatedNode) {
        self.created_nodes.skills.push(node);
    }

    pub fn add_trait(&mut self, node: CreatedNode) {
        self.created_nodes.traits.push(node);
    }

    pub fn add_milestone(&mut self, node: CreatedNode) {
        self.created_nodes.milestones.push(node);
    }
}

/// Result returned after domain generation completes
#[derive(Debug, Clone, Serialize)]
pub struct DomainGenerationResult {
    #[serde(rename = "domainName")]
    pub domain_name: String,
    #[serde(rename = "domainElementId")]
    pub domain_element_id: String,
    #[serde(rename = "createdNodes")]
    pub created_nodes: CreatedNodeRegistry,
    pub statistics: DomainStatistics,
}
