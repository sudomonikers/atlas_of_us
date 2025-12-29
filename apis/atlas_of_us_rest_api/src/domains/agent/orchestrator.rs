use neo4rs::Graph;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::mpsc;

use super::llm::{create_provider, LlmProvider, ProviderType};
use super::models::{
    AgentContext, AgentType, DomainGenerationResult, DomainStatistics, SseEvent,
};
use super::steps::{
    DomainArchitectStep, KnowledgeGeneratorStep, MilestoneGeneratorStep,
    LevelDistributorStep, PrerequisiteMapperStep, SkillGeneratorStep, TraitGeneratorStep, AgentStep,
};
use crate::common::similarity::{find_similar_nodes, FindSimilarNodesRequest};

/// Threshold for blocking domain generation if similar domain exists
const DOMAIN_SIMILARITY_THRESHOLD: f64 = 0.85;

/// Agent orchestrator manages the sequential execution of all agent steps
pub struct AgentOrchestrator {
    llm_provider: Arc<dyn LlmProvider>,
    graph: Graph,
    event_tx: mpsc::Sender<SseEvent>,
}

impl AgentOrchestrator {
    /// Create a new AgentOrchestrator
    pub fn new(
        provider_type: ProviderType,
        graph: Graph,
        event_tx: mpsc::Sender<SseEvent>,
    ) -> Result<Self, String> {
        let llm_provider = create_provider(provider_type)
            .map_err(|e| format!("Failed to create LLM provider: {:?}", e))?;

        Ok(Self {
            llm_provider,
            graph,
            event_tx,
        })
    }

    /// Check if a similar domain already exists in the database
    async fn check_domain_exists(&self, domain_name: &str) -> Result<Option<String>, String> {
        let similar = find_similar_nodes(&self.graph, FindSimilarNodesRequest {
            text: Some(domain_name.to_string()),
            label: Some("Domain".to_string()),
            limit: Some(1),
            ..Default::default()
        })
        .await
        .map_err(|e| format!("Similarity search failed: {}", e))?;

        if !similar.is_empty() && similar[0].score >= DOMAIN_SIMILARITY_THRESHOLD {
            return Ok(Some(similar[0].name.clone()));
        }

        Ok(None)
    }

    /// Execute the full domain generation workflow
    pub async fn generate_domain(
        &self,
        domain_name: String,
        description: Option<String>,
    ) -> Result<DomainGenerationResult, String> {
        let start_time = Instant::now();
        let mut context = AgentContext::new(domain_name.clone(), description);
        let mut stats = DomainStatistics::default();

        // Check if similar domain already exists
        if let Some(existing_domain) = self.check_domain_exists(&domain_name).await? {
            self.send_event(SseEvent::DomainExists {
                requested_name: domain_name.clone(),
                existing_domain: existing_domain.clone(),
            }).await;

            return Err(format!(
                "A similar domain '{}' already exists. Please choose a different name.",
                existing_domain
            ));
        }

        // Send started event
        self.send_event(SseEvent::Started {
            domain_name: domain_name.clone(),
            total_agents: 7,
        }).await;

        // Execute each agent step
        let agents: Vec<Box<dyn AgentStep + Send + Sync>> = vec![
            Box::new(DomainArchitectStep::new(
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(KnowledgeGeneratorStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(SkillGeneratorStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(TraitGeneratorStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(MilestoneGeneratorStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(LevelDistributorStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
            Box::new(PrerequisiteMapperStep::new(
                self.llm_provider.clone(),
                self.graph.clone(),
                self.event_tx.clone(),
            )),
        ];

        for (idx, agent) in agents.iter().enumerate() {
            let agent_type = agent.agent_type();

            // Send agent started event
            self.send_event(SseEvent::AgentStarted {
                agent: agent_type,
                agent_number: (idx + 1) as u8,
                agent_name: agent_type.display_name().to_string(),
            }).await;

            tracing::info!("Starting agent: {:?}", agent_type);

            match agent.execute(&mut context).await {
                Ok(()) => {
                    // Update statistics
                    self.update_stats(&mut stats, agent_type, &context);

                    // Count created vs reused
                    let (created, reused) = self.count_agent_nodes(agent_type, &context);

                    // Send completion event
                    self.send_event(SseEvent::AgentCompleted {
                        agent: agent_type,
                        nodes_created: created,
                        nodes_reused: reused,
                    }).await;

                    tracing::info!("Agent {:?} completed: {} created, {} reused",
                        agent_type, created, reused);
                }
                Err(e) => {
                    tracing::error!("Agent {:?} failed: {}", agent_type, e);

                    self.send_event(SseEvent::AgentFailed {
                        agent: agent_type,
                        error: e.clone(),
                    }).await;

                    self.send_event(SseEvent::Failed {
                        error: e.clone(),
                        last_agent: Some(agent_type),
                        nodes_created_before_failure: Some(context.domain_graph.clone()),
                    }).await;

                    return Err(e);
                }
            }
        }

        stats.generation_time_ms = start_time.elapsed().as_millis() as u64;
        stats.nodes_reused = context.domain_graph.count_reused();

        // Send completion event
        self.send_event(SseEvent::Completed {
            domain_name: domain_name.clone(),
            statistics: stats.clone(),
        }).await;

        let domain_element_id = context.domain_element_id.clone()
            .unwrap_or_default();

        Ok(DomainGenerationResult {
            domain_name,
            domain_element_id,
            domain_graph: context.domain_graph,
            statistics: stats,
        })
    }

    /// Count nodes created by a specific agent
    fn count_agent_nodes(&self, agent: AgentType, context: &AgentContext) -> (usize, usize) {
        let (nodes, _label) = match agent {
            AgentType::DomainArchitect => {
                let mut count = context.domain_graph.domain_levels.len();
                if context.domain_graph.domain.is_some() {
                    count += 1;
                }
                return (count, 0); // Domain nodes are never reused
            }
            AgentType::KnowledgeGenerator => (&context.domain_graph.knowledge, "Knowledge"),
            AgentType::SkillGenerator => (&context.domain_graph.skills, "Skill"),
            AgentType::TraitGenerator => (&context.domain_graph.traits, "Trait"),
            AgentType::MilestoneGenerator => (&context.domain_graph.milestones, "Milestone"),
            AgentType::LevelDistributor => {
                return (0, 0); // Relationships don't count as nodes
            }
            AgentType::PrerequisiteMapper => {
                return (0, 0); // Relationships don't count as nodes
            }
        };

        let created = nodes.iter().filter(|n| !n.was_reused).count();
        let reused = nodes.iter().filter(|n| n.was_reused).count();
        (created, reused)
    }

    /// Update statistics after agent execution
    fn update_stats(&self, stats: &mut DomainStatistics, agent: AgentType, context: &AgentContext) {
        match agent {
            AgentType::DomainArchitect => {
                stats.domain_levels_created = context.domain_graph.domain_levels.len();
            }
            AgentType::KnowledgeGenerator => {
                stats.knowledge_created = context.domain_graph.knowledge
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::SkillGenerator => {
                stats.skills_created = context.domain_graph.skills
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::TraitGenerator => {
                stats.traits_created = context.domain_graph.traits
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::MilestoneGenerator => {
                stats.milestones_created = context.domain_graph.milestones
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::LevelDistributor => {
                // Level relationships count could be tracked here if needed
            }
            AgentType::PrerequisiteMapper => {
                // Prerequisite relationships count could be tracked here if needed
            }
        }
    }

    /// Send an SSE event through the channel
    async fn send_event(&self, event: SseEvent) {
        if let Err(e) = self.event_tx.send(event).await {
            tracing::warn!("Failed to send SSE event: {}", e);
        }
    }
}
