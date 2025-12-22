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
    RelationshipMapperStep, SkillGeneratorStep, TraitGeneratorStep, AgentStep,
};

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

    /// Execute the full domain generation workflow
    pub async fn generate_domain(
        &self,
        domain_name: String,
        description: Option<String>,
    ) -> Result<DomainGenerationResult, String> {
        let start_time = Instant::now();
        let mut context = AgentContext::new(domain_name.clone(), description);
        let mut stats = DomainStatistics::default();

        // Send started event
        self.send_event(SseEvent::Started {
            domain_name: domain_name.clone(),
            total_agents: 6,
        }).await;

        // Execute each agent step
        let agents: Vec<Box<dyn AgentStep + Send + Sync>> = vec![
            Box::new(DomainArchitectStep::new(
                self.llm_provider.clone(),
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
            Box::new(RelationshipMapperStep::new(
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
                        nodes_created_before_failure: Some(context.created_nodes.clone()),
                    }).await;

                    return Err(e);
                }
            }
        }

        stats.generation_time_ms = start_time.elapsed().as_millis() as u64;
        stats.nodes_reused = context.created_nodes.count_reused();

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
            created_nodes: context.created_nodes,
            statistics: stats,
        })
    }

    /// Count nodes created by a specific agent
    fn count_agent_nodes(&self, agent: AgentType, context: &AgentContext) -> (usize, usize) {
        let (nodes, label) = match agent {
            AgentType::DomainArchitect => {
                let mut count = context.created_nodes.domain_levels.len();
                if context.created_nodes.domain.is_some() {
                    count += 1;
                }
                return (count, 0); // Domain nodes are never reused
            }
            AgentType::KnowledgeGenerator => (&context.created_nodes.knowledge, "Knowledge"),
            AgentType::SkillGenerator => (&context.created_nodes.skills, "Skill"),
            AgentType::TraitGenerator => (&context.created_nodes.traits, "Trait"),
            AgentType::MilestoneGenerator => (&context.created_nodes.milestones, "Milestone"),
            AgentType::RelationshipMapper => {
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
                stats.domain_levels_created = context.created_nodes.domain_levels.len();
            }
            AgentType::KnowledgeGenerator => {
                stats.knowledge_created = context.created_nodes.knowledge
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::SkillGenerator => {
                stats.skills_created = context.created_nodes.skills
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::TraitGenerator => {
                stats.traits_created = context.created_nodes.traits
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::MilestoneGenerator => {
                stats.milestones_created = context.created_nodes.milestones
                    .iter().filter(|n| !n.was_reused).count();
            }
            AgentType::RelationshipMapper => {
                // Relationship count is updated during the step
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
