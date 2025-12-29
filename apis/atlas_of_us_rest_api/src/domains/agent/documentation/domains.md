# Domains

Any domain can consist of these types of nodes, which are measured in these manners:

- **Knowledge** - leveled via Bloom's Taxonomy (Remember → Understand → Apply → Analyze → Evaluate → Create)
- **Skill** - leveled via Dreyfus Model (Novice → Advanced Beginner → Competent → Proficient → Expert)
- **Trait** - continuous spectrum of 1-100
- **Milestone** - binary accomplishments, either achieved or not

Each domain has multiple levels. To achieve each level, you must meet specific requirements across skills, traits, knowledge, and milestones.

## Cross-Domain Connections

Domain-specific knowledge and skills should link to general counterparts using the `GENERALIZES_TO` relationship. This enables users to:

- Discover how skills/knowledge from one domain might apply to others
- Find new domains that leverage their existing expertise
- Understand the transferable value of their domain-specific abilities

See `knowledge.md` and `skills.md` for detailed documentation on implementing cross-domain connections.

## Example: Chess Domain

### Level 1: Novice Player

**Requirements:**

- **Knowledge:** 3 nodes at Remember level (piece movements, basic rules, board setup)
- **Skills:** 1 node at Novice level (making legal moves)
- **Traits:** None required
- **Milestones:** Complete first full game
- **Total Points:** 50+

### Level 2: Developing Player

**Requirements:**

- **Knowledge:** 5 nodes, 2 at Understand level (opening principles, basic tactics, piece values)
- **Skills:** 2 nodes, 1 at Advanced Beginner level (recognizing simple patterns, basic time management)
- **Traits:** Pattern Recognition ≥ 40
- **Milestones:** Win 10 games OR reach 1000 ELO
- **Total Points:** 150+

### Level 3: Competent Player

**Requirements:**

- **Knowledge:** 8 nodes, 4 at Apply level (common openings, tactical motifs, endgame basics, positional concepts)
- **Skills:** 4 nodes, 2 at Competent level (board evaluation, strategic planning, tactical calculation)
- **Traits:** Pattern Recognition ≥ 60, Strategic Thinking ≥ 50
- **Milestones:** Tournament participation OR 1500+ ELO OR beat a rated opponent
- **Total Points:** 300+

### Level 4: Advanced Player

**Requirements:**

- **Knowledge:** 12 nodes, 6 at Analyze level (opening theory, complex tactics, middlegame strategy, endgame technique)
- **Skills:** 6 nodes, 3 at Proficient level (position evaluation, long-term planning, opponent psychology)
- **Traits:** Pattern Recognition ≥ 75, Strategic Thinking ≥ 70, Mental Endurance ≥ 60
- **Milestones:** 2000+ ELO OR tournament win OR defeat a master-level player
- **Total Points:** 600+

### Level 5: Master

**Requirements:**

- **Knowledge:** 15 nodes, 8 at Evaluate/Create level (deep opening preparation, advanced endgames, strategic innovation)
- **Skills:** 8 nodes, 4 at Expert level (intuitive position assessment, advanced calculation, game preparation)
- **Traits:** Pattern Recognition ≥ 85, Strategic Thinking ≥ 85, Mental Endurance ≥ 75
- **Milestones:** 2200+ ELO AND tournament success AND published analysis/contribution to chess theory
- **Total Points:** 1000+

The Atlas of Us is at its essence a graph database (neo4j). So an example Chess domain would look like this:

```jsx
// Create the Chess Domain
CREATE (chess:Domain {name: 'Chess'})

// Create Domain Levels with requirement counts as properties
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Novice Player',
  total_points_required: 50,
  knowledge_count: 3,
  knowledge_at_level_count: 0,
  knowledge_min_bloom_level: 'Remember',
  skill_count: 1,
  skill_at_level_count: 0,
  skill_min_dreyfus_level: 'Novice',
  trait_requirements: 0,
  milestone_requirements: 1
})

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Developing Player',
  total_points_required: 150,
  knowledge_count: 5,
  knowledge_at_level_count: 2,
  knowledge_min_bloom_level: 'Understand',
  skill_count: 2,
  skill_at_level_count: 1,
  skill_min_dreyfus_level: 'Advanced Beginner',
  trait_requirements: 1,
  milestone_any_of: true
})

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Competent Player',
  total_points_required: 300,
  knowledge_count: 8,
  knowledge_at_level_count: 4,
  knowledge_min_bloom_level: 'Apply',
  skill_count: 4,
  skill_at_level_count: 2,
  skill_min_dreyfus_level: 'Competent',
  trait_requirements: 2,
  milestone_any_of: true
})

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Advanced Player',
  total_points_required: 600,
  knowledge_count: 12,
  knowledge_at_level_count: 6,
  knowledge_min_bloom_level: 'Analyze',
  skill_count: 6,
  skill_at_level_count: 3,
  skill_min_dreyfus_level: 'Proficient',
  trait_requirements: 3,
  milestone_any_of: true
})

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Master',
  total_points_required: 1000,
  knowledge_count: 15,
  knowledge_at_level_count: 8,
  knowledge_min_bloom_level: 'Evaluate',
  skill_count: 8,
  skill_at_level_count: 4,
  skill_min_dreyfus_level: 'Expert',
  trait_requirements: 3,
  milestone_all_required: true
})

// Connect Domain to Levels
CREATE (chess)-[:HAS_DOMAIN_LEVEL]->(level1)
CREATE (chess)-[:HAS_DOMAIN_LEVEL]->(level2)
CREATE (chess)-[:HAS_DOMAIN_LEVEL]->(level3)
CREATE (chess)-[:HAS_DOMAIN_LEVEL]->(level4)
CREATE (chess)-[:HAS_DOMAIN_LEVEL]->(level5)

// MERGE all shared nodes (no level properties on the nodes themselves)
MERGE (k_piece_movements:Knowledge {name: 'Piece Movements'})
MERGE (k_basic_rules:Knowledge {name: 'Basic Rules'})
MERGE (k_board_setup:Knowledge {name: 'Board Setup'})
MERGE (k_opening_principles:Knowledge {name: 'Opening Principles'})
MERGE (k_basic_tactics:Knowledge {name: 'Basic Tactics'})
MERGE (k_piece_values:Knowledge {name: 'Piece Values'})
MERGE (k_center_control:Knowledge {name: 'Center Control'})
MERGE (k_check_checkmate:Knowledge {name: 'Check and Checkmate'})
MERGE (k_common_openings:Knowledge {name: 'Common Openings'})
MERGE (k_tactical_motifs:Knowledge {name: 'Tactical Motifs'})
MERGE (k_endgame_basics:Knowledge {name: 'Endgame Basics'})
MERGE (k_positional_concepts:Knowledge {name: 'Positional Concepts'})
MERGE (k_pawn_structure:Knowledge {name: 'Pawn Structure'})
MERGE (k_king_safety:Knowledge {name: 'King Safety'})
MERGE (k_piece_coordination:Knowledge {name: 'Piece Coordination'})
MERGE (k_material_imbalances:Knowledge {name: 'Material Imbalances'})
MERGE (k_opening_theory:Knowledge {name: 'Opening Theory'})
MERGE (k_complex_tactics:Knowledge {name: 'Complex Tactics'})
MERGE (k_middlegame_strategy:Knowledge {name: 'Middlegame Strategy'})
MERGE (k_endgame_technique:Knowledge {name: 'Endgame Technique'})
MERGE (k_pawn_endgames:Knowledge {name: 'Pawn Endgames'})
MERGE (k_rook_endgames:Knowledge {name: 'Rook Endgames'})
MERGE (k_strategic_sacrifices:Knowledge {name: 'Strategic Sacrifices'})
MERGE (k_prophylactic_thinking:Knowledge {name: 'Prophylactic Thinking'})
MERGE (k_game_analysis:Knowledge {name: 'Game Analysis Methods'})
MERGE (k_tournament_strategy:Knowledge {name: 'Tournament Strategy'})
MERGE (k_time_trouble:Knowledge {name: 'Time Trouble Management'})
MERGE (k_psychological_warfare:Knowledge {name: 'Psychological Warfare'})
MERGE (k_deep_opening_prep:Knowledge {name: 'Deep Opening Preparation'})
MERGE (k_advanced_endgames:Knowledge {name: 'Advanced Endgames'})
MERGE (k_strategic_innovation:Knowledge {name: 'Strategic Innovation'})
MERGE (k_minor_piece_endgames:Knowledge {name: 'Minor Piece Endgames'})
MERGE (k_complex_sacrifices:Knowledge {name: 'Complex Sacrifices'})
MERGE (k_theoretical_novelties:Knowledge {name: 'Theoretical Novelties'})
MERGE (k_computer_analysis:Knowledge {name: 'Computer Analysis Integration'})
MERGE (k_historical_games:Knowledge {name: 'Historical Games Study'})
MERGE (k_training_methods:Knowledge {name: 'Training Methodologies'})
MERGE (k_repertoire_design:Knowledge {name: 'Opening Repertoire Design'})
MERGE (k_tournament_prep:Knowledge {name: 'Tournament Preparation'})
MERGE (k_opponent_analysis:Knowledge {name: 'Opponent Analysis'})
MERGE (k_performance_psych:Knowledge {name: 'Performance Psychology'})
MERGE (k_chess_publishing:Knowledge {name: 'Chess Publishing'})
MERGE (k_teaching_methods:Knowledge {name: 'Teaching Methods'})

MERGE (s_legal_moves:Skill {name: 'Making Legal Moves'})
MERGE (s_simple_patterns:Skill {name: 'Recognizing Simple Patterns'})
MERGE (s_time_management:Skill {name: 'Basic Time Management'})
MERGE (s_board_evaluation:Skill {name: 'Board Evaluation'})
MERGE (s_strategic_planning:Skill {name: 'Strategic Planning'})
MERGE (s_tactical_calculation:Skill {name: 'Tactical Calculation'})
MERGE (s_opening_prep:Skill {name: 'Opening Preparation'})
MERGE (s_position_evaluation:Skill {name: 'Position Evaluation'})
MERGE (s_long_term_planning:Skill {name: 'Long-term Planning'})
MERGE (s_opponent_psychology:Skill {name: 'Opponent Psychology'})
MERGE (s_deep_calculation:Skill {name: 'Deep Calculation'})
MERGE (s_game_preparation:Skill {name: 'Game Preparation'})
MERGE (s_clock_management:Skill {name: 'Clock Management'})
MERGE (s_intuitive_assessment:Skill {name: 'Intuitive Position Assessment'})
MERGE (s_advanced_calculation:Skill {name: 'Advanced Calculation'})
MERGE (s_creative_problem_solving:Skill {name: 'Creative Problem Solving'})
MERGE (s_match_strategy:Skill {name: 'Match Strategy'})
MERGE (s_pressure_management:Skill {name: 'Pressure Management'})
MERGE (s_teaching_mentoring:Skill {name: 'Teaching and Mentoring'})
MERGE (s_analysis_commentary:Skill {name: 'Analysis and Commentary'})

MERGE (t_pattern_recognition:Trait {name: 'Pattern Recognition'})
MERGE (t_strategic_thinking:Trait {name: 'Strategic Thinking'})
MERGE (t_mental_endurance:Trait {name: 'Mental Endurance'})

MERGE (m_first_game:Milestone {name: 'Complete First Full Game'})
MERGE (m_win_10:Milestone {name: 'Win 10 Games'})
MERGE (m_1000_elo:Milestone {name: 'Reach 1000 ELO'})
MERGE (m_tournament_participation:Milestone {name: 'Tournament Participation'})
MERGE (m_1500_elo:Milestone {name: '1500+ ELO'})
MERGE (m_beat_rated:Milestone {name: 'Beat Rated Opponent'})
MERGE (m_2000_elo:Milestone {name: '2000+ ELO'})
MERGE (m_tournament_win:Milestone {name: 'Tournament Win'})
MERGE (m_defeat_master:Milestone {name: 'Defeat Master-level Player'})
MERGE (m_2200_elo:Milestone {name: '2200+ ELO'})
MERGE (m_tournament_success:Milestone {name: 'Tournament Success'})
MERGE (m_published_analysis:Milestone {name: 'Published Analysis or Contribution to Chess Theory'})

// Level 1 Requirements - the bloom_level is on the relationship
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k_piece_movements)
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k_basic_rules)
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k_board_setup)
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s_legal_moves)
CREATE (level1)-[:REQUIRES_MILESTONE]->(m_first_game)

// Level 2 Requirements
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_opening_principles)
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_basic_tactics)
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_piece_values)
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k_center_control)
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k_check_checkmate)
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s_simple_patterns)
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s_time_management)
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t_pattern_recognition)
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m_win_10)
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m_1000_elo)

// Level 3 Requirements
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_common_openings)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_tactical_motifs)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_endgame_basics)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_positional_concepts)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_pawn_structure)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_king_safety)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_piece_coordination)
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k_material_imbalances)
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s_board_evaluation)
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s_strategic_planning)
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s_tactical_calculation)
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s_opening_prep)
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 60}]->(t_pattern_recognition)
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t_strategic_thinking)
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m_tournament_participation)
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m_1500_elo)
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m_beat_rated)

// Level 4 Requirements
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_opening_theory)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_complex_tactics)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_middlegame_strategy)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_endgame_technique)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_pawn_endgames)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_rook_endgames)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_strategic_sacrifices)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_prophylactic_thinking)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_game_analysis)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_tournament_strategy)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_time_trouble)
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_psychological_warfare)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_position_evaluation)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_long_term_planning)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_opponent_psychology)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s_deep_calculation)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s_game_preparation)
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s_clock_management)
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 75}]->(t_pattern_recognition)
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 70}]->(t_strategic_thinking)
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t_mental_endurance)
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m_2000_elo)
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m_tournament_win)
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m_defeat_master)

// Level 5 Requirements
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_deep_opening_prep)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_advanced_endgames)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k_strategic_innovation)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_minor_piece_endgames)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_complex_sacrifices)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k_theoretical_novelties)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_computer_analysis)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k_historical_games)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k_training_methods)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k_repertoire_design)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_tournament_prep)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_opponent_analysis)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k_performance_psych)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_chess_publishing)
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k_teaching_methods)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s_intuitive_assessment)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s_advanced_calculation)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s_game_preparation)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s_creative_problem_solving)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_match_strategy)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_pressure_management)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_teaching_mentoring)
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s_analysis_commentary)
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t_pattern_recognition)
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t_strategic_thinking)
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t_mental_endurance)
CREATE (level5)-[:REQUIRES_MILESTONE]->(m_2200_elo)
CREATE (level5)-[:REQUIRES_MILESTONE]->(m_tournament_success)
CREATE (level5)-[:REQUIRES_MILESTONE]->(m_published_analysis)

RETURN chess, level1, level2, level3, level4, level5
```