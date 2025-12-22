/// Prompt templates for multi-pass agent execution
/// Each agent has multiple passes with specific focused prompts

use crate::common::similarity::SimilarNodeResult;

pub struct PromptTemplates;

impl PromptTemplates {
    // ========== Domain Architect Prompts ==========

    /// Generate domain structure including levels and scope
    pub fn domain_structure(domain_name: &str, description: &str) -> String {
        format!(
            r#"You are designing the structure for the domain "{domain_name}".
{desc_section}

Generate a JSON object with the following structure:
{{
    "domain": {{
        "name": "{domain_name}",
        "description": "A comprehensive description of the domain"
    }},
    "levels": [
        {{
            "level": 1,
            "name": "{domain_name} Novice",
            "description": "Description of novice level"
        }},
        {{
            "level": 2,
            "name": "{domain_name} Developing",
            "description": "Description of developing level"
        }},
        {{
            "level": 3,
            "name": "{domain_name} Competent",
            "description": "Description of competent level"
        }},
        {{
            "level": 4,
            "name": "{domain_name} Advanced",
            "description": "Description of advanced level"
        }},
        {{
            "level": 5,
            "name": "{domain_name} Master",
            "description": "Description of master level"
        }}
    ]
}}

Output ONLY valid JSON, no explanation or markdown."#,
            domain_name = domain_name,
            desc_section = if description.is_empty() {
                String::new()
            } else {
                format!("Description provided: {}", description)
            }
        )
    }

    // ========== Knowledge Generator Prompts ==========

    /// Pass 1: Generate list of knowledge concepts
    pub fn knowledge_concepts(domain_name: &str, description: &str) -> String {
        format!(
            r#"For the domain "{domain_name}", identify the essential knowledge concepts someone would need to master.
{desc_section}

Consider knowledge at all levels from novice to master. Focus on:
- Foundational theoretical knowledge
- Technical/specialized knowledge
- Contextual/cultural knowledge
- Safety and best practices knowledge

Output ONLY a JSON array of concept names (10-20 items), no explanation:
["Concept 1", "Concept 2", "Concept 3", ...]"#,
            domain_name = domain_name,
            desc_section = if description.is_empty() {
                String::new()
            } else {
                format!("\nDomain description: {}", description)
            }
        )
    }

    /// Pass 3: Verify if a similar node should be used
    pub fn verify_similar_knowledge(concept: &str, domain_name: &str, similar_nodes: &[SimilarNodeResult]) -> String {
        let similar_list: Vec<String> = similar_nodes.iter()
            .map(|n| format!("- {} (similarity: {:.2}): {}",
                n.name,
                n.score,
                n.description.as_deref().unwrap_or("No description")))
            .collect();

        format!(
            r#"I'm creating knowledge nodes for the domain "{domain_name}".

For the concept "{concept}", I found these similar existing nodes:
{similar_list}

Should I:
1. "use_existing" - Use one of the existing nodes (if it's essentially the same concept)
2. "create_new" - Create a brand new node (if concept is distinct enough)
3. "create_and_generalize" - Create a new domain-specific node that GENERALIZES_TO the existing one (if the concept is a specialized version)

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new" | "create_and_generalize",
    "existing_node_name": "Name of existing node to use or generalize to (null if create_new)",
    "reason": "Brief explanation"
}}"#,
            domain_name = domain_name,
            concept = concept,
            similar_list = similar_list.join("\n")
        )
    }

    /// Pass 4: Generate full knowledge node properties
    pub fn knowledge_properties(domain_name: &str, concept: &str, generalizes_to: Option<&str>) -> String {
        let generalization_note = if let Some(general) = generalizes_to {
            format!("\nNote: This is a domain-specific version that generalizes to '{}'.", general)
        } else {
            String::new()
        };

        format!(
            r#"Generate full properties for the knowledge concept "{concept}" in the domain "{domain_name}".{generalization_note}

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear, concise description of what this knowledge encompasses",
    "how_to_learn": "Practical guidance on how to acquire this knowledge",
    "remember_level": "What to memorize/recall at Remember level (Bloom's)",
    "understand_level": "What to comprehend at Understand level",
    "apply_level": "How to apply this knowledge practically",
    "analyze_level": "How to break down and examine this knowledge",
    "evaluate_level": "How to judge and assess using this knowledge",
    "create_level": "How to synthesize and create with this knowledge"
}}"#,
            domain_name = domain_name,
            concept = concept,
            generalization_note = generalization_note
        )
    }

    // ========== Skill Generator Prompts ==========

    /// Pass 1: Generate list of skill concepts
    pub fn skill_concepts(domain_name: &str, description: &str, existing_knowledge: &[String]) -> String {
        let knowledge_context = if existing_knowledge.is_empty() {
            String::new()
        } else {
            format!("\nExisting knowledge in this domain: {}", existing_knowledge.join(", "))
        };

        format!(
            r#"For the domain "{domain_name}", identify the essential skills someone would need to develop.
{desc_section}{knowledge_context}

Consider skills at all levels from novice to expert. Focus on:
- Physical/technical skills
- Cognitive/analytical skills
- Social/communication skills
- Decision-making skills

Output ONLY a JSON array of skill names (8-15 items), no explanation:
["Skill 1", "Skill 2", "Skill 3", ...]"#,
            domain_name = domain_name,
            desc_section = if description.is_empty() {
                String::new()
            } else {
                format!("\nDomain description: {}", description)
            },
            knowledge_context = knowledge_context
        )
    }

    /// Pass 3: Verify if a similar skill should be used
    pub fn verify_similar_skill(concept: &str, domain_name: &str, similar_nodes: &[SimilarNodeResult]) -> String {
        let similar_list: Vec<String> = similar_nodes.iter()
            .map(|n| format!("- {} (similarity: {:.2}): {}",
                n.name,
                n.score,
                n.description.as_deref().unwrap_or("No description")))
            .collect();

        format!(
            r#"I'm creating skill nodes for the domain "{domain_name}".

For the skill "{concept}", I found these similar existing nodes:
{similar_list}

Should I:
1. "use_existing" - Use one of the existing nodes
2. "create_new" - Create a brand new node
3. "create_and_generalize" - Create a new domain-specific node that GENERALIZES_TO the existing one

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new" | "create_and_generalize",
    "existing_node_name": "Name of existing node (null if create_new)",
    "reason": "Brief explanation"
}}"#,
            domain_name = domain_name,
            concept = concept,
            similar_list = similar_list.join("\n")
        )
    }

    /// Pass 4: Generate full skill node properties
    pub fn skill_properties(domain_name: &str, concept: &str, generalizes_to: Option<&str>) -> String {
        let generalization_note = if let Some(general) = generalizes_to {
            format!("\nNote: This is a domain-specific version that generalizes to '{}'.", general)
        } else {
            String::new()
        };

        format!(
            r#"Generate full properties for the skill "{concept}" in the domain "{domain_name}".{generalization_note}

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear description of this skill and what it enables",
    "how_to_develop": "Practical guidance on developing this skill",
    "novice_level": "What novice performance looks like (Dreyfus model)",
    "advanced_beginner_level": "What advanced beginner performance looks like",
    "competent_level": "What competent performance looks like",
    "proficient_level": "What proficient performance looks like",
    "expert_level": "What expert performance looks like"
}}"#,
            domain_name = domain_name,
            concept = concept,
            generalization_note = generalization_note
        )
    }

    // ========== Trait Generator Prompts ==========

    /// Pass 1: Generate list of relevant traits
    pub fn trait_concepts(domain_name: &str, description: &str) -> String {
        format!(
            r#"For the domain "{domain_name}", identify inherent traits that contribute to success.
{desc_section}

Traits are inherent characteristics (not teachable skills or learnable knowledge):
- Physical traits (strength, endurance, flexibility)
- Cognitive traits (spatial reasoning, pattern recognition)
- Personality traits (risk tolerance, persistence)
- Temperament traits (patience, emotional stability)

Only include traits that are genuinely relevant to this domain.

Output ONLY a JSON array of trait names (3-8 items), no explanation:
["Trait 1", "Trait 2", "Trait 3", ...]"#,
            domain_name = domain_name,
            desc_section = if description.is_empty() {
                String::new()
            } else {
                format!("\nDomain description: {}", description)
            }
        )
    }

    /// Pass 3: Verify if a similar trait should be used
    pub fn verify_similar_trait(concept: &str, domain_name: &str, similar_nodes: &[SimilarNodeResult]) -> String {
        let similar_list: Vec<String> = similar_nodes.iter()
            .map(|n| format!("- {} (similarity: {:.2}): {}",
                n.name,
                n.score,
                n.description.as_deref().unwrap_or("No description")))
            .collect();

        format!(
            r#"I'm identifying relevant traits for the domain "{domain_name}".

For the trait "{concept}", I found these similar existing trait nodes:
{similar_list}

Traits should be generic (shared across domains), not domain-specific.

Should I:
1. "use_existing" - Use one of the existing trait nodes
2. "create_new" - Create a new generic trait (only if truly distinct)

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new",
    "existing_node_name": "Name of existing node (null if create_new)",
    "reason": "Brief explanation"
}}"#,
            domain_name = domain_name,
            concept = concept,
            similar_list = similar_list.join("\n")
        )
    }

    /// Pass 4: Generate full trait node properties
    pub fn trait_properties(concept: &str) -> String {
        format!(
            r#"Generate full properties for the trait "{concept}".

Note: Traits are generic (not domain-specific) and measured on a 0-100 scale.

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear description of this inherent trait",
    "measurement_criteria": "How this trait is measured on a 0-100 scale (e.g., '0 = no capability, 100 = exceptional capability')"
}}"#,
            concept = concept
        )
    }

    // ========== Milestone Generator Prompts ==========

    /// Pass 1: Generate list of milestone concepts
    pub fn milestone_concepts(domain_name: &str, description: &str, context: &str) -> String {
        format!(
            r#"For the domain "{domain_name}", identify concrete milestones/achievements across all mastery levels.
{desc_section}

{context}

Milestones should be:
- Binary (achieved or not achieved)
- Concrete and measurable
- Distributed across all 5 levels (novice to master)
- Types: performance, achievement, participation, creation, recognition

Output ONLY a JSON array of milestone names (12-20 items), no explanation:
["Milestone 1", "Milestone 2", "Milestone 3", ...]"#,
            domain_name = domain_name,
            desc_section = if description.is_empty() {
                String::new()
            } else {
                format!("\nDomain description: {}", description)
            },
            context = context
        )
    }

    /// Pass 3: Verify if a similar milestone should be used
    pub fn verify_similar_milestone(concept: &str, domain_name: &str, similar_nodes: &[SimilarNodeResult]) -> String {
        let similar_list: Vec<String> = similar_nodes.iter()
            .map(|n| format!("- {} (similarity: {:.2}): {}",
                n.name,
                n.score,
                n.description.as_deref().unwrap_or("No description")))
            .collect();

        format!(
            r#"I'm creating milestone nodes for the domain "{domain_name}".

For the milestone "{concept}", I found these similar existing nodes:
{similar_list}

Should I:
1. "use_existing" - Use one of the existing nodes
2. "create_new" - Create a brand new node
3. "create_and_generalize" - Create a new domain-specific milestone that GENERALIZES_TO the existing one

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new" | "create_and_generalize",
    "existing_node_name": "Name of existing node (null if create_new)",
    "reason": "Brief explanation"
}}"#,
            domain_name = domain_name,
            concept = concept,
            similar_list = similar_list.join("\n")
        )
    }

    /// Pass 4: Generate full milestone node properties
    pub fn milestone_properties(domain_name: &str, concept: &str, generalizes_to: Option<&str>) -> String {
        let generalization_note = if let Some(general) = generalizes_to {
            format!("\nNote: This is a domain-specific version that generalizes to '{}'.", general)
        } else {
            String::new()
        };

        format!(
            r#"Generate full properties for the milestone "{concept}" in the domain "{domain_name}".{generalization_note}

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear description of this achievement",
    "how_to_achieve": "Practical guidance on how to achieve this milestone"
}}"#,
            domain_name = domain_name,
            concept = concept,
            generalization_note = generalization_note
        )
    }

    // ========== Relationship Mapper Prompts ==========

    /// Pass 1: Analyze component prerequisites
    pub fn prerequisite_analysis(domain_name: &str, context: &str) -> String {
        format!(
            r#"Analyze the prerequisite relationships for the domain "{domain_name}".

{context}

For each Knowledge, Skill, and Milestone, identify what prerequisites it requires:
- Knowledge can require other Knowledge
- Skills can require Knowledge, other Skills, or Traits
- Milestones can require Knowledge, Skills, Traits, or other Milestones

Output a JSON object mapping component names to their prerequisites:
{{
    "prerequisites": [
        {{
            "component": "Component Name",
            "component_type": "Knowledge" | "Skill" | "Milestone",
            "requires": [
                {{"name": "Prerequisite Name", "type": "Knowledge" | "Skill" | "Trait" | "Milestone"}}
            ]
        }}
    ]
}}"#,
            domain_name = domain_name,
            context = context
        )
    }

    /// Pass 2: Assign components to domain levels
    pub fn level_assignment(domain_name: &str, context: &str) -> String {
        format!(
            r#"Assign components to domain levels for "{domain_name}".

{context}

For each component, determine:
1. Which level (1-5) it should be required at
2. The proficiency level required:
   - For Knowledge: bloom_level (remember, understand, apply, analyze, evaluate, create)
   - For Skills: dreyfus_level (novice, advanced_beginner, competent, proficient, expert)
   - For Traits: min_score (0-100)
   - For Milestones: just assignment (no proficiency)

Output a JSON object:
{{
    "level_assignments": [
        {{
            "component": "Component Name",
            "component_type": "Knowledge" | "Skill" | "Trait" | "Milestone",
            "level": 1-5,
            "proficiency": "bloom/dreyfus level or min_score"
        }}
    ]
}}"#,
            domain_name = domain_name,
            context = context
        )
    }
}

/// System prompts for different contexts
pub struct SystemPrompts;

impl SystemPrompts {
    pub fn domain_architect() -> &'static str {
        "You are an expert domain architect. Your role is to design comprehensive domain structures for learning and skill development. You output only valid JSON."
    }

    pub fn knowledge_expert() -> &'static str {
        "You are an expert in knowledge organization and Bloom's Taxonomy. Your role is to identify and structure knowledge components. You output only valid JSON."
    }

    pub fn skill_expert() -> &'static str {
        "You are an expert in skill development and the Dreyfus model of skill acquisition. Your role is to identify and structure skill components. You output only valid JSON."
    }

    pub fn trait_analyst() -> &'static str {
        "You are an expert in human traits and aptitudes. Your role is to identify inherent traits relevant to domain success. You output only valid JSON."
    }

    pub fn milestone_designer() -> &'static str {
        "You are an expert in achievement and milestone design. Your role is to create meaningful, measurable achievements. You output only valid JSON."
    }

    pub fn relationship_architect() -> &'static str {
        "You are an expert in curriculum design and prerequisite mapping. Your role is to create logical learning pathways. You output only valid JSON."
    }
}
