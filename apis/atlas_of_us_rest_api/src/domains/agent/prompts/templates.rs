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

CRITICAL RULES:
1. ATOMIC: Each concept must be a SINGLE concept. Never combine with "and".
   BAD: "Variables and Data Types" → GOOD: "Variables", "Data Types"
   BAD: "Opening Principles and Strategies" → GOOD: "Opening Principles", "Opening Strategies"

2. DOMAIN-SPECIFIC NAMING: Prefix concepts with the domain name "{domain_name}".
   Example: "{domain_name} Opening Principles", "{domain_name} Tactics"
   NOT: "Opening Principles", "Tactics"

   Only omit prefix for universal concepts identical across all domains:
   - "Boolean Algebra", "Newton's Laws" (exact same content everywhere)

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

Decision guide:
1. "use_existing" - The existing node represents essentially the same knowledge
2. "create_new" - This is a distinct concept, no good match exists
3. "create_and_generalize" - Create a domain-specific node that links to a broader concept:
   - Use when your knowledge is domain-specific but relates to a general concept
   - Example: "{domain_name} Opening Principles" → GENERALIZES_TO → "Opening Principles"
   - The domain-specific version has DIFFERENT actual content than the general version
   - If the general concept exists in the list above, use "existing_node_name"
   - If the general concept doesn't exist, suggest it in "suggested_target"

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new" | "create_and_generalize",
    "existing_node_name": "Name from list above (for use_existing, or if generalizing to a listed node)",
    "suggested_target": "Name of a new general concept to generalize to (only if not in list above, null otherwise)",
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

    /// Generate properties for a generic knowledge node (not domain-specific)
    /// Used when creating a generalization target that doesn't exist
    pub fn generic_knowledge_properties(concept: &str) -> String {
        format!(
            r#"Generate properties for a GENERIC knowledge concept "{concept}".

This is a general-purpose knowledge node that is NOT domain-specific. It should be applicable across multiple domains.

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear, concise description of what this general knowledge encompasses",
    "how_to_learn": "General guidance on how to acquire this knowledge",
    "remember_level": "What to memorize/recall at Remember level (Bloom's)",
    "understand_level": "What to comprehend at Understand level",
    "apply_level": "How to apply this knowledge practically",
    "analyze_level": "How to break down and examine this knowledge",
    "evaluate_level": "How to judge and assess using this knowledge",
    "create_level": "How to synthesize and create with this knowledge"
}}"#,
            concept = concept
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

CRITICAL RULES:
1. ATOMIC: Each skill must be a SINGLE ability. Never combine with "and".
   BAD: "Debugging and Testing" → GOOD: "Debugging", "Testing"
   BAD: "Planning and Execution" → GOOD: "Planning", "Execution"

2. DOMAIN-SPECIFIC NAMING: Prefix skills with the domain name "{domain_name}".
   Example: "{domain_name} Tactical Calculation", "{domain_name} Position Evaluation"
   NOT: "Tactical Calculation", "Position Evaluation"

   Only omit prefix for universal skills that work identically across domains:
   - "Problem Solving", "Time Management", "Decision Making" (same practice everywhere)

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

Decision guide:
1. "use_existing" - The existing node represents essentially the same skill
2. "create_new" - This is a distinct skill, no good match exists
3. "create_and_generalize" - Create a domain-specific skill that links to a broader skill:
   - Use when your skill is domain-specific but relates to a general ability
   - Example: "{domain_name} Tactical Calculation" → GENERALIZES_TO → "Tactical Calculation"
   - The domain-specific version has DIFFERENT practice methods than the general version
   - If the general skill exists in the list above, use "existing_node_name"
   - If the general skill doesn't exist, suggest it in "suggested_target"

Output ONLY a JSON object:
{{
    "decision": "use_existing" | "create_new" | "create_and_generalize",
    "existing_node_name": "Name from list above (for use_existing, or if generalizing to a listed node)",
    "suggested_target": "Name of a new general skill to generalize to (only if not in list above, null otherwise)",
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

    /// Generate properties for a generic skill node (not domain-specific)
    /// Used when creating a generalization target that doesn't exist
    pub fn generic_skill_properties(concept: &str) -> String {
        format!(
            r#"Generate properties for a GENERIC skill "{concept}".

This is a general-purpose skill that is NOT domain-specific. It should be applicable across multiple domains.

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear description of this general skill and what it enables",
    "how_to_develop": "General guidance on developing this skill",
    "novice_level": "What novice performance looks like (Dreyfus model)",
    "advanced_beginner_level": "What advanced beginner performance looks like",
    "competent_level": "What competent performance looks like",
    "proficient_level": "What proficient performance looks like",
    "expert_level": "What expert performance looks like"
}}"#,
            concept = concept
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
- Personality traits (risk tolerance, persistence, competitive drive)
- Temperament traits (patience, emotional stability)

CRITICAL RULES:
1. ATOMIC: Each trait must be a SINGLE characteristic. Never combine with "and".
   BAD: "Patience and Perseverance" → GOOD: "Patience", "Perseverance"
   BAD: "Logical and Analytical Thinking" → GOOD: "Logical Thinking", "Analytical Thinking"

2. GENERIC NAMING: Traits should NOT have domain prefixes.
   Traits are fundamental cognitive/personality characteristics that manifest across ALL domains.

   CORRECT: "Pattern Recognition", "Logical Thinking", "Focus", "Mental Endurance", "Risk Tolerance"
   WRONG: "{domain_name} Pattern Recognition", "{domain_name} Focus"

   If you're tempted to add a domain prefix, it's probably a SKILL, not a trait.

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

Measurement bands to describe in measurement_criteria:
- 0-25 (Low): Significant challenges or minimal natural ability
- 26-50 (Moderate): Average or developing capability
- 51-75 (High): Strong natural ability or well-developed capacity
- 76-100 (Exceptional): Outstanding or rare capability

Output ONLY a JSON object with these fields:
{{
    "name": "{concept}",
    "description": "Clear description of this inherent trait",
    "measurement_criteria": "How this trait is assessed, with descriptions for Low (0-25), Moderate (26-50), High (51-75), and Exceptional (76-100) ranges"
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

CRITICAL RULES:
1. ATOMIC: Each milestone must be a SINGLE achievement. Never combine with "and".
   BAD: "Win Tournament and Reach 2000 ELO" → GOOD: "Win Tournament", "Reach 2000 ELO"
   BAD: "Complete Project and Deploy" → GOOD: "Complete Project", "Deploy to Production"

2. DOMAIN-SPECIFIC: Milestones are achievements within this domain.
   Use clear, measurable descriptions specific to "{domain_name}".

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
   - For Knowledge: bloom_level = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"
   - For Skills: dreyfus_level = "Novice" | "Advanced Beginner" | "Competent" | "Proficient" | "Expert"
   - For Traits: min_score = integer 0-100 (e.g., 40, 60, 75)
   - For Milestones: no proficiency needed, just level assignment

Level distribution guidelines:
- Level 1 (Novice): Basic knowledge at Remember, skills at Novice, no trait requirements
- Level 2 (Developing): Knowledge at Understand, skills at Advanced Beginner, traits ~40
- Level 3 (Competent): Knowledge at Apply, skills at Competent, traits ~50-60
- Level 4 (Advanced): Knowledge at Analyze, skills at Proficient, traits ~70-75
- Level 5 (Master): Knowledge at Evaluate/Create, skills at Expert, traits ~85+

Output a JSON object:
{{
    "level_assignments": [
        {{
            "component": "Component Name",
            "component_type": "Knowledge" | "Skill" | "Trait" | "Milestone",
            "level": 1-5,
            "proficiency": "bloom/dreyfus level string or min_score integer"
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
