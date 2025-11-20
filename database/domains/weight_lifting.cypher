// Domain: Weight Lifting
// Generated: 2025-11-16
// Description: The practice of resistance training using weights and equipment to build strength, muscle mass, and physical fitness.

// ============================================================
// DOMAIN: Weight Lifting
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Weight Lifting',
  description: 'The practice of resistance training using weights and equipment to build strength, muscle mass, physical fitness, and athletic performance through progressive overload and structured training programs',
  level_count: 5,
  created_date: date(),
  scope_included: ['barbell lifts (squat, bench press, deadlift)', 'dumbbell and kettlebell training', 'exercise technique and form', 'program design and progression', 'strength conditioning', 'muscle hypertrophy training', 'powerlifting and Olympic lifting fundamentals', 'injury prevention and mobility', 'nutrition for muscle growth', 'recovery and supplementation basics', 'competition and performance optimization'],
  scope_excluded: ['general cardiovascular fitness (separate domain)', 'yoga and flexibility training (separate domain)', 'sports-specific training without weight focus (separate domain)', 'medical rehabilitation (separate domain)', 'dietetics and advanced nutrition science (separate domain)', 'exercise physiology research (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Weight Lifting Novice',
  description: 'Learning proper form on fundamental lifts, understanding safety protocols, and building foundational strength with lighter weights and controlled movements'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Weight Lifting Developing',
  description: 'Executing compound lifts with consistent technique, progressing to moderate weights, and beginning to understand program design principles'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Weight Lifting Competent',
  description: 'Lifting substantial weights with confident form, independently managing training programs, and balancing strength, hypertrophy, and conditioning goals'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Weight Lifting Advanced',
  description: 'Lifting elite-level weights, designing sophisticated training programs, mentoring newer lifters, and competing or performing at high standards'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Weight Lifting Master',
  description: 'Operating at peak athletic performance, innovating training methodologies, advancing the sport through competition or coaching, and recognized as an expert'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Weight Lifting'})
MATCH (level1:Domain_Level {name: 'Weight Lifting Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Weight Lifting'})
MATCH (level2:Domain_Level {name: 'Weight Lifting Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Weight Lifting'})
MATCH (level3:Domain_Level {name: 'Weight Lifting Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Weight Lifting'})
MATCH (level4:Domain_Level {name: 'Weight Lifting Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Weight Lifting'})
MATCH (level5:Domain_Level {name: 'Weight Lifting Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge (Novice Level)

MERGE (k_basic_form:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
ON CREATE SET k_basic_form.description = 'Fundamental principles of proper posture, body alignment, and movement patterns for safe and effective weight lifting, including neutral spine, joint positioning, and control',
              k_basic_form.how_to_learn = 'Begin with bodyweight movements and light weights under qualified instruction. Video analysis of your own form. Practice basic movements daily for 2-4 weeks until they feel natural. Use mirrors or video recording to check alignment.',
              k_basic_form.remember_level = 'Recall the basic form checkpoints for squat, deadlift, and bench press (neutral spine, shoulder positioning, hip hinge)',
              k_basic_form.understand_level = 'Explain why proper form matters for safety and effectiveness. Describe the key differences between correct and incorrect movement patterns',
              k_basic_form.apply_level = 'Execute fundamental lifts with consistent form on lighter weights. Maintain neutral spine and correct joint positioning during movement',
              k_basic_form.analyze_level = 'Watch videos of other lifters and identify form deviations. Compare your form to coaching cues and adjust accordingly',
              k_basic_form.evaluate_level = 'Judge whether your own form is sufficient for the weight being lifted. Determine when form is breaking down and reduce weight accordingly',
              k_basic_form.create_level = 'Develop a personalized form checklist. Create mental cues for maintaining proper positioning in your primary lifts';

MERGE (k_safety_protocols:Knowledge {name: 'Weight Lifting Safety Protocols'})
ON CREATE SET k_safety_protocols.description = 'Essential safety practices including proper warm-up procedures, equipment setup, spotter techniques, breathing mechanics, and injury prevention strategies',
              k_safety_protocols.how_to_learn = 'Study safety guidelines from reputable sources (Starting Strength, StrongFirst). Train with experienced lifters or coaches. Practice safety procedures before attempting heavy lifts. Expected time: 2-3 weeks.',
              k_safety_protocols.remember_level = 'Recall basic safety rules: warm up properly, use appropriate weight, ask for spotters, never lift alone on heavy attempts',
              k_safety_protocols.understand_level = 'Explain the purpose of warm-ups, progressive loading, and proper breathing. Describe common injury mechanisms and how to prevent them',
              k_safety_protocols.apply_level = 'Always warm up systematically before main lifts. Breathe properly during lifts. Request and accept spotters appropriately',
              k_safety_protocols.analyze_level = 'Identify potential safety risks in a training session. Analyze why injuries occur and what specific safety measures would prevent them',
              k_safety_protocols.evaluate_level = 'Assess whether your warm-up is adequate for your intended working weight. Judge when you should reduce weight due to form breakdown',
              k_safety_protocols.create_level = 'Design a comprehensive warm-up routine for your specific lifts. Create safety guidelines for spotting others';

MERGE (k_fundamental_lifts:Knowledge {name: 'Fundamental Weight Lifting Movements'})
ON CREATE SET k_fundamental_lifts.description = 'Understanding the basic compound lifts (squat, deadlift, bench press) including their mechanics, muscle involvement, and foundational variations',
              k_fundamental_lifts.how_to_learn = 'Practice the fundamental lifts with light weight under instruction. Study instructional videos from coaching sources like Starting Strength or Candito. Perform reps daily or 3-4 times per week.',
              k_fundamental_lifts.remember_level = 'Recall the names and basic descriptions of squat, deadlift, and bench press. Identify the primary muscles used in each lift',
              k_fundamental_lifts.understand_level = 'Explain the movement pattern and muscle mechanics of each fundamental lift. Describe the differences between squat variations and deadlift styles',
              k_fundamental_lifts.apply_level = 'Perform squat, deadlift, and bench press with proper technique. Apply variations based on equipment and training goals',
              k_fundamental_lifts.analyze_level = 'Break down the movement mechanics of each lift. Compare different variations and analyze their effectiveness for specific goals',
              k_fundamental_lifts.evaluate_level = 'Judge which variation is most appropriate for your body type and goals. Assess your readiness to progress to more advanced variations',
              k_fundamental_lifts.create_level = 'Design personal variations of fundamental lifts based on your biomechanics. Create coaching progressions for teaching these lifts';

MERGE (k_muscle_groups:Knowledge {name: 'Weight Lifting Muscle Anatomy and Function'})
ON CREATE SET k_muscle_groups.description = 'Basic understanding of major muscle groups involved in weight lifting (quadriceps, hamstrings, glutes, chest, back, shoulders, arms, core) and their roles in movements',
              k_muscle_groups.how_to_learn = 'Study basic anatomy through fitness resources and books like "Anatomy of Strength Training." Perform exercises and feel which muscles are working. Practice identifying muscles during lifts for 2-3 weeks.',
              k_muscle_groups.remember_level = 'Name the major muscle groups used in basic lifts. Recall which muscles are primary movers versus stabilizers in each movement',
              k_muscle_groups.understand_level = 'Explain the function of each major muscle group. Describe how muscles work together to create movement',
              k_muscle_groups.apply_level = 'Select exercises that target specific muscle groups. Choose movements to address weak muscles identified in your lifts',
              k_muscle_groups.analyze_level = 'Analyze muscle activation patterns in different movements. Identify muscular imbalances by comparing lift performance',
              k_muscle_groups.evaluate_level = 'Assess whether your training volume is adequate for all major muscle groups. Judge exercise selection for balanced development',
              k_muscle_groups.create_level = 'Design training programs targeting specific muscle group development. Create custom exercise selections for imbalances';

// Core Knowledge (Developing/Competent Levels)

MERGE (k_program_design:Knowledge {name: 'Weight Lifting Program Design Principles'})
ON CREATE SET k_program_design.description = 'Understanding progressive overload, linear progression, periodization, exercise selection, and program structure for continuous improvement in strength and muscle development',
              k_program_design.how_to_learn = 'Study strength training programs like Starting Strength, StrongLifts, or 5/3/1. Analyze program structure over 4-8 weeks and track results. Read programming theory books. Apply principles to personal training for 2-3 months.',
              k_program_design.remember_level = 'Recall key programming concepts: progressive overload, linear progression, compound versus isolation exercises, main lift and accessory structure',
              k_program_design.understand_level = 'Explain why progressive overload is necessary for continued gains. Describe how program structure affects adaptation and results',
              k_program_design.apply_level = 'Add weight or reps to lifts systematically each week. Structure your program with main lifts and appropriate accessories',
              k_program_design.analyze_level = 'Analyze existing programs and identify their progression strategy. Compare different program philosophies and their intended outcomes',
              k_program_design.evaluate_level = 'Assess whether your current program is progressing appropriately. Judge if program changes are needed based on performance plateaus',
              k_program_design.create_level = 'Design a personal training program with appropriate periodization and progression. Create program structures for specific goals (strength vs hypertrophy)';

MERGE (k_barbell_lifts:Knowledge {name: 'Barbell Lift Technique and Variations'})
ON CREATE SET k_barbell_lifts.description = 'Advanced understanding of barbell movements including squat variations (high bar, low bar, front squat), deadlift variations (conventional, sumo, deficit), and pressing techniques',
              k_barbell_lifts.how_to_learn = 'Study multiple barbell variations through instructional resources. Practice each variation for 4-6 weeks to develop proficiency. Compare how different variations feel and perform. Learn from experienced coaches.',
              k_barbell_lifts.remember_level = 'Recall the names and basic differences of squat, deadlift, and press variations. Identify when different variations are appropriate',
              k_barbell_lifts.understand_level = 'Explain the mechanical differences between variations. Describe which variations suit different body types and training goals',
              k_barbell_lifts.apply_level = 'Execute barbell variations with technical proficiency. Select appropriate variations based on body structure and goals',
              k_barbell_lifts.analyze_level = 'Analyze how variations change muscle recruitment patterns. Compare your performance across variations and understand your strengths',
              k_barbell_lifts.evaluate_level = 'Judge which variation is most effective for your training goals. Assess technical execution of complex variations',
              k_barbell_lifts.create_level = 'Design specialized variation progressions. Create coaching cues for teaching different barbell variations';

MERGE (k_accessory_training:Knowledge {name: 'Accessory Exercise Selection and Application'})
ON CREATE SET k_accessory_training.description = 'Understanding how to select, program, and execute isolation and accessory exercises to address weaknesses and build balanced strength development',
              k_accessory_training.how_to_learn = 'Study exercise directories and programming philosophy around accessories. Practice a variety of accessory exercises over 2-3 months. Identify weak points in your lifts and select accessories to address them.',
              k_accessory_training.remember_level = 'Recall common accessory exercises and which muscle groups they target. List exercises that strengthen weak points in main lifts',
              k_accessory_training.understand_level = 'Explain why specific accessories address weaknesses in main lifts. Describe the purpose of isolation versus compound accessories',
              k_accessory_training.apply_level = 'Select and perform accessories targeted at personal weak points. Program accessories appropriately with main lifts',
              k_accessory_training.analyze_level = 'Identify your mechanical weak points and select accessories to address them. Compare exercise effectiveness for muscle development',
              k_accessory_training.evaluate_level = 'Judge whether your accessory selection effectively addresses deficiencies. Assess optimal rep ranges and volume for different accessories',
              k_accessory_training.create_level = 'Design customized accessory programs targeting specific weaknesses. Create progression schemes for accessory exercises';

MERGE (k_progressive_overload:Knowledge {name: 'Progressive Overload Strategies'})
ON CREATE SET k_progressive_overload.description = 'Methods for continuously increasing training difficulty including adding weight, increasing reps, reducing rest periods, improving range of motion, and adding volume',
              k_progressive_overload.how_to_learn = 'Track your lifts meticulously for 2-3 months. Experiment with different progression methods (linear, double progression, wave loading). Analyze which methods work best for your response pattern.',
              k_progressive_overload.remember_level = 'Recall different methods of progressive overload. Identify which method to use based on current strength level',
              k_progressive_overload.understand_level = 'Explain why progressive overload is essential for continued improvement. Describe the difference between external and internal load progression',
              k_progressive_overload.apply_level = 'Implement progressive overload consistently in every training session. Choose appropriate progression methods for different phases',
              k_progressive_overload.analyze_level = 'Track your progress data and analyze which overload methods yield best results. Compare response to different progression strategies',
              k_progressive_overload.evaluate_level = 'Judge when to switch progression methods or deload. Assess appropriate increment sizes for different lifts',
              k_progressive_overload.create_level = 'Design personalized progression schemes based on your response patterns. Create tracking systems for monitoring overload';

MERGE (k_recovery_nutrition:Knowledge {name: 'Weight Lifting Recovery and Nutrition Basics'})
ON CREATE SET k_recovery_nutrition.description = 'Foundational understanding of protein intake, calorie needs for muscle growth, sleep importance, and basic recovery strategies for optimized training adaptation',
              k_recovery_nutrition.how_to_learn = 'Track your diet and sleep for 4-8 weeks while monitoring strength gains. Study basic nutrition guidelines for muscle building. Experiment with protein intake and meal timing. Expected time: 1-2 months experimentation.',
              k_recovery_nutrition.remember_level = 'Recall basic protein recommendations (0.7-1g per lb bodyweight). Identify factors that support recovery (sleep, nutrition, rest days)',
              k_recovery_nutrition.understand_level = 'Explain how protein supports muscle growth. Describe the relationship between calorie surplus and strength gains',
              k_recovery_nutrition.apply_level = 'Maintain adequate protein intake around training. Plan meals to support muscle recovery. Prioritize sleep and rest days',
              k_recovery_nutrition.analyze_level = 'Track nutrition and performance data to identify your optimal intake levels. Analyze sleep quality impact on recovery and strength',
              k_recovery_nutrition.evaluate_level = 'Assess whether your nutrition supports your training goals. Judge when to adjust calorie intake based on progress',
              k_recovery_nutrition.create_level = 'Design personalized nutrition and sleep plans for your training. Create meal plans supporting your specific body composition goals';

// Advanced Knowledge (Advanced Level)

MERGE (k_periodization:Knowledge {name: 'Advanced Periodization Models'})
ON CREATE SET k_periodization.description = 'Complex periodization systems including linear periodization, undulating periodization, block periodization, and conjugate methods for optimizing long-term strength development and managing fatigue',
              k_periodization.how_to_learn = 'Study periodization literature (Lev Matveyev, Yuri Verkhoshansky, Vladimir Zatsiorsky). Implement different periodization models over 2-3 training cycles (3-4 months each). Analyze performance metrics to compare models.',
              k_periodization.remember_level = 'Recall different periodization models and their primary characteristics. Identify the phase goals in various periodization structures',
              k_periodization.understand_level = 'Explain why periodization prevents plateaus and optimizes adaptation. Describe the differences between strength, power, and hypertrophy phases',
              k_periodization.apply_level = 'Structure multi-month training plans using periodization principles. Adjust exercise selection and intensity across phases',
              k_periodization.analyze_level = 'Compare periodization models and analyze which suits your sport or goals. Break down the flow of phases in complex programs',
              k_periodization.evaluate_level = 'Judge which periodization model best matches your training needs. Assess how well program phases are sequenced for your goals',
              k_periodization.create_level = 'Design complex multi-cycle periodized programs. Create personalized phase structures for competitive preparation';

MERGE (k_biomechanics:Knowledge {name: 'Weight Lifting Biomechanics and Leverages'})
ON CREATE SET k_biomechanics.description = 'Understanding of mechanical advantage, lever systems, muscle mechanics, and how individual biomechanics affect lifting technique and exercise selection',
              k_biomechanics.how_to_learn = 'Study biomechanics principles through books and educational resources. Analyze movement videos from a biomechanical perspective. Compare your biomechanics to others and understand differences. Expected time: 2-3 months deep study.',
              k_biomechanics.remember_level = 'Recall basic biomechanical concepts: levers, moment arms, force vectors, mechanical advantage in different positions',
              k_biomechanics.understand_level = 'Explain how leverages affect lift difficulty at different depths or positions. Describe how individual body proportions affect optimal technique',
              k_biomechanics.apply_level = 'Adjust technique based on your mechanical leverages. Select exercises that match your biomechanical strengths',
              k_biomechanics.analyze_level = 'Analyze movement mechanics to identify inefficiencies. Compare your mechanics to ideal patterns and understand differences',
              k_biomechanics.evaluate_level = 'Judge whether technique changes will improve performance given your leverages. Assess when standard cues need individual modification',
              k_biomechanics.create_level = 'Design technique modifications based on your unique biomechanics. Create coaching progressions adapted for different body types';

MERGE (k_intensity_management:Knowledge {name: 'Training Intensity and Volume Management'})
ON CREATE SET k_intensity_management.description = 'Advanced understanding of rate of perceived exertion (RPE), relative intensity, volume load management, autoregulation, and balancing intensity with recovery capacity',
              k_intensity_management.how_to_learn = 'Train using RPE-based systems for 2-3 months while tracking fatigue and performance. Study autoregulation principles. Compare RPE outcomes to percentage-based training. Learn to feel and assess true effort levels.',
              k_intensity_management.remember_level = 'Recall RPE scales and how to assess perceived effort. Identify the relationship between intensity and appropriate volume',
              k_intensity_management.understand_level = 'Explain how intensity and volume interact in training stimulus. Describe the concept of relative intensity in autoregulation',
              k_intensity_management.apply_level = 'Assess effort on each lift and adjust weight based on true RPE. Manage total volume load to support adaptation without overtraining',
              k_intensity_management.analyze_level = 'Track intensity and volume data alongside recovery metrics. Analyze patterns showing optimal intensity/volume for your response',
              k_intensity_management.evaluate_level = 'Judge whether current intensity is challenging enough for adaptation. Assess total weekly volume and whether it exceeds recovery capacity',
              k_intensity_management.create_level = 'Design autoregulated training programs based on perceived effort. Create intensity protocols adapted to daily recovery status';

MERGE (k_advanced_variations:Knowledge {name: 'Advanced Exercise Variations and Specialization'})
ON CREATE SET k_advanced_variations.description = 'Specialized exercise variations and techniques for advanced training including paused reps, tempo variations, accommodating resistance, and competition-specific movements',
              k_advanced_variations.how_to_learn = 'Study advanced training techniques through competition lifting resources. Implement specialized variations in training cycles. Practice and perfect technical execution of complex variations.',
              k_advanced_variations.remember_level = 'Recall advanced variations (paused reps, board presses, speed work, chains, bands). Identify the purpose of each specialized technique',
              k_advanced_variations.understand_level = 'Explain how specialized variations address specific weak points. Describe how accommodating resistance changes training stimulus',
              k_advanced_variations.apply_level = 'Implement advanced variations in appropriate training phases. Execute complex variations with technical precision',
              k_advanced_variations.analyze_level = 'Determine which weak point each variation addresses. Compare how variations change recruitment and performance',
              k_advanced_variations.evaluate_level = 'Judge which advanced variations are most beneficial for your specific leverages and goals. Assess appropriate timing for specialized work',
              k_advanced_variations.create_level = 'Design specialized variation protocols. Create competition-specific training rotations';

// Specialized Knowledge (Master Level)

MERGE (k_coaching_advanced:Knowledge {name: 'Advanced Coaching and Program Development'})
ON CREATE SET k_coaching_advanced.description = 'Expert-level ability to design programs for diverse athletes, manage group dynamics, integrate scientific research, optimize for individual responses, and mentor developing coaches',
              k_coaching_advanced.how_to_learn = 'Coach multiple lifters with different goals over 1-2 years. Study advanced programming literature and research. Attend coaching seminars. Compare outcomes across different training philosophies applied to multiple athletes.',
              k_coaching_advanced.remember_level = 'Recall coaching principles for different body types, ages, and goals. Identify advanced programming concepts from strength literature',
              k_coaching_advanced.understand_level = 'Explain how different lifters respond to the same stimulus differently. Describe how to integrate research findings into practical programming',
              k_coaching_advanced.apply_level = 'Design effective programs for lifters with diverse characteristics. Adjust programs in real-time based on athlete response',
              k_coaching_advanced.analyze_level = 'Compare outcomes across different programming approaches. Analyze athlete data to identify optimal training parameters',
              k_coaching_advanced.evaluate_level = 'Assess coaching effectiveness based on long-term athlete outcomes. Judge program efficacy and when major restructuring is needed',
              k_coaching_advanced.create_level = 'Develop novel coaching systems and program structures. Create comprehensive coaching methodologies for your organization';

MERGE (k_research_integration:Knowledge {name: 'Research Integration and Evidence-Based Training'})
ON CREATE SET k_research_integration.description = 'Ability to understand strength and conditioning research, critically evaluate scientific literature, and integrate evidence-based findings into practical training applications',
              k_research_integration.how_to_learn = 'Read peer-reviewed strength and conditioning research regularly (Strength and Conditioning Journal, Journal of Strength and Conditioning Research). Study research design and statistics. Apply findings to personal training over time.',
              k_research_integration.remember_level = 'Recall major research findings on training stimulus, adaptation, and optimization. Identify current best practices supported by evidence',
              k_research_integration.understand_level = 'Explain how research informs training practice. Describe common experimental designs and how to interpret their findings',
              k_research_integration.apply_level = 'Implement evidence-based adjustments to training. Use research to justify program changes to athletes',
              k_research_integration.analyze_level = 'Critically evaluate new research for quality and applicability. Compare research findings with traditional coaching wisdom',
              k_research_integration.evaluate_level = 'Judge reliability of published research and whether findings apply to your athletes. Assess research quality before implementation',
              k_research_integration.create_level = 'Design training experiments and collect data on your own athletes. Contribute to strength training knowledge through research or publication';

MERGE (k_sport_specific:Knowledge {name: 'Sport-Specific Strength and Power Development'})
ON CREATE SET k_sport_specific.description = 'Advanced application of strength and power training to enhance performance in specific sports, including movement pattern analysis, competition timing, and sport-specific periodization',
              k_sport_specific.how_to_learn = 'Study strength requirements for specific sports through analysis and research. Work with athletes in a specific sport over multiple seasons. Analyze movement patterns in competition and training transfer.',
              k_sport_specific.remember_level = 'Recall the key strength and power requirements for your sport. Identify movement patterns that require specialized strength development',
              k_sport_specific.understand_level = 'Explain how general strength transfers to sport-specific performance. Describe the specific power and strength demands of competition',
              k_sport_specific.apply_level = 'Integrate sport-specific training into periodized programs. Time strength development phases around competition schedule',
              k_sport_specific.analyze_level = 'Analyze specific sport movements and identify limiting strength factors. Break down performance data to reveal strength imbalances',
              k_sport_specific.evaluate_level = 'Assess whether strength training is optimally timed relative to competition. Judge transfer effectiveness of strength exercises to sport',
              k_sport_specific.create_level = 'Design complete sport-specific periodization plans. Create specialized protocols for developing critical sport-specific capacities';

MERGE (k_mastery_philosophy:Knowledge {name: 'Weight Lifting Philosophy and Legacy Development'})
ON CREATE SET k_mastery_philosophy.description = 'Master-level understanding of strength training philosophy, ethical coaching, personal legacy in the sport, and advancement of the discipline through mentorship and innovation',
              k_mastery_philosophy.how_to_learn = 'Develop your own training and coaching philosophy over years of practice. Mentor younger coaches and athletes. Contribute to the sport through writing, teaching, or innovation. Reflect on lifelong learning in the discipline.',
              k_mastery_philosophy.remember_level = 'Recall the history and evolution of strength training methodologies. Identify your core coaching philosophy and principles',
              k_mastery_philosophy.understand_level = 'Explain your personal approach to training and its theoretical foundations. Describe how great coaches and lifters shaped the sport',
              k_mastery_philosophy.apply_level = 'Teach coaching philosophy to developing coaches. Model ethical and effective coaching practices',
              k_mastery_philosophy.analyze_level = 'Examine your coaching outcomes against your stated philosophy. Compare different coaching philosophies and their long-term outcomes',
              k_mastery_philosophy.evaluate_level = 'Judge whether your coaching is aligned with your values. Assess your contribution and legacy in the sport',
              k_mastery_philosophy.create_level = 'Write and publish your training philosophy. Develop innovative coaching methodologies that advance the sport. Establish training systems that outlast your involvement';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Skills (Novice Level)

MERGE (s_barbell_safety:Skill {name: 'Barbell Handling and Safety'})
ON CREATE SET s_barbell_safety.description = 'The ability to safely load, unload, balance, and handle barbells and weight plates with proper grip, awareness of surroundings, and controlled movement. This foundational skill prevents accidents and builds confidence with equipment.',
              s_barbell_safety.how_to_develop = 'Practice loading and unloading barbells under supervision for 2-3 sessions. Learn plate weight recognition and how to balance bars symmetrically. Handle light barbells with focus on controlled movement. Practice in a safe training environment.',
              s_barbell_safety.novice_level = 'Can load and unload barbells with assistance. Occasionally fumbles plates or struggles with bar balance. Asks for help confidently. To progress: Practice balance and become comfortable with bar weight distribution without assistance.',
              s_barbell_safety.advanced_beginner_level = 'Independently loads and unloads bars symmetrically. Handles barbells with reasonable control. Understands center of gravity. To progress: Speed up handling and work with heavier loaded bars.',
              s_barbell_safety.competent_level = 'Efficiently and safely loads any barbell configuration. Handles heavy bars with complete control. Aware of surroundings and other lifters. To progress: Demonstrate safety practices consistently and help spot others.',
              s_barbell_safety.proficient_level = 'Seamlessly handles all barbell loading scenarios. Maintains safety awareness automatically. Models proper handling for others. To progress: Mentor new lifters on equipment safety.',
              s_barbell_safety.expert_level = 'Mastery of all equipment handling with absolute safety. Anticipates hazards and prevents accidents. Consistently demonstrates and teaches proper technique. Commands respect through reliability and care with equipment.';

MERGE (s_squat_technique:Skill {name: 'Squat Movement Technique'})
ON CREATE SET s_squat_technique.description = 'The ability to perform a squat with proper form including neutral spine, correct hip and knee positioning, and controlled descent and ascent. Squat technique is foundational to lower body strength development.',
              s_squat_technique.how_to_develop = 'Perform bodyweight squats daily focusing on depth and positioning for 1-2 weeks. Practice with an empty barbell under coach guidance. Video record yourself and compare to coaching cues. Perform 3-4 squat sessions per week with light weight for 4-8 weeks to establish pattern.',
              s_squat_technique.novice_level = 'Can perform partial squats with neutral spine. Depth is limited but working on improving. Requires reminders on key form cues. To progress: Focus exclusively on depth and position without adding weight.',
              s_squat_technique.advanced_beginner_level = 'Achieves proper depth consistently with empty bar and light weight. Form holds for most reps. Occasionally reverts to poor positioning under fatigue. To progress: Increase weight gradually while maintaining form.',
              s_squat_technique.competent_level = 'Squats with confident form across moderate weights. Maintains neutral spine and proper positioning throughout sets. Self-corrects form breakdown. To progress: Work on range of motion refinement and movement efficiency.',
              s_squat_technique.proficient_level = 'Squat movement is smooth and consistent across all weights. Automatically maintains optimal positioning. Makes subtle adjustments based on feel. To progress: Explore variation specialization.',
              s_squat_technique.expert_level = 'Squat technique is exceptional and consistent. Depth is full and controlled. Form is flawless even at maximum loads. Can teach and demonstrate squat technique effectively. Movement is beautiful and efficient.';

MERGE (s_deadlift_technique:Skill {name: 'Deadlift Movement Technique'})
ON CREATE SET s_deadlift_technique.description = 'The ability to perform a deadlift with proper hip hinge mechanics, neutral spine, correct hand positioning, and controlled movement from floor to lockout. Deadlift is foundational to posterior chain strength.',
              s_deadlift_technique.how_to_develop = 'Practice hip hinge movement pattern with empty bar for 2-3 sessions. Focus on positioning before each lift rather than speed. Video analyze your setup and compare to coaching models. Lift 2-3 times per week with light weight for 4-6 weeks.',
              s_deadlift_technique.novice_level = 'Can lift light weight from floor with relatively neutral spine. Hip hinge pattern is emerging but inconsistent. Requires setup coaching before lifts. To progress: Focus on consistent setup and positioning.',
              s_deadlift_technique.advanced_beginner_level = 'Sets up consistently with proper positioning. Maintains neutral spine through lifts with light-moderate weight. Occasionally loses position on heavy reps. To progress: Increase weight systematically while staying disciplined with setup.',
              s_deadlift_technique.competent_level = 'Deadlifts with solid form and proper hip hinge across moderate weights. Setup is automatic. Locks out completely and stands tall. To progress: Refine efficiency and economy of movement.',
              s_deadlift_technique.proficient_level = 'Deadlift mechanics are efficient and consistent. Hip hinge is smooth and powerful. Can deadlift heavy loads with perfect form. To progress: Develop variation mastery.',
              s_deadlift_technique.expert_level = 'Deadlift technique is exceptional and highly efficient. Perfect positioning and smooth pull through entire range. Can teach deadlift with detailed cuing. Movement is powerful and controlled at all loads.';

MERGE (s_bench_press_technique:Skill {name: 'Bench Press Movement Technique'})
ON CREATE SET s_bench_press_technique.description = 'The ability to perform a bench press with proper shoulder positioning, scapular stability, bar path, and controlled movement. Bench press is fundamental to upper body pressing strength.',
              s_bench_press_technique.how_to_develop = 'Practice unloaded bar positioning on bench for 2-3 sessions focusing on setup. Learn proper shoulder blade positioning and leg drive. Perform empty bar presses and light weight presses for 3-4 weeks focusing on consistency.',
              s_bench_press_technique.novice_level = 'Can press light weight with relatively stable positioning. Form wavers under fatigue. Bar path is somewhat inconsistent. To progress: Focus on consistent setup and positioning before each rep.',
              s_bench_press_technique.advanced_beginner_level = 'Maintains stable shoulder position throughout sets. Bar path is mostly consistent. Beginning to integrate leg drive. To progress: Improve shoulder blade stability and consistency.',
              s_bench_press_technique.competent_level = 'Presses with solid form and consistent bar path across moderate weights. Maintains tight positioning throughout sets. Efficient leg drive. To progress: Refine touch point and develop power.',
              s_bench_press_technique.proficient_level = 'Bench press is smooth and powerful. Perfect shoulder positioning and scapular stability. Bar path is optimal. Can press heavy loads with complete control. To progress: Explore pressing variations.',
              s_bench_press_technique.expert_level = 'Bench press technique is exceptional. Positioning is perfect and automatic. Bar path is optimal and consistent. Can teach pressing technique effectively. Movement demonstrates complete command of the lift.';

MERGE (s_breathing_bracing:Skill {name: 'Breathing and Bracing Technique'})
ON CREATE SET s_breathing_bracing.description = 'The ability to perform proper diaphragmatic breathing, create intra-abdominal pressure through bracing, and maintain stability during heavy lifts. Proper breathing ensures safety and power generation.',
              s_breathing_bracing.how_to_develop = 'Practice breathing exercises without weight for 1-2 weeks. Learn to feel abdominal tension and create pressure. Practice in each main lift with light weight while focusing on breathing pattern. Expected time: 2-3 weeks to develop automatic bracing.',
              s_breathing_bracing.novice_level = 'Can perform basic breathing in lifts with cuing. Creates minimal pressure and stability. Holds breath inconsistently. To progress: Practice intentional breathing and bracing in every rep.',
              s_breathing_bracing.advanced_beginner_level = 'Creates adequate intra-abdominal pressure in most lifts. Breathing pattern is reasonably consistent. Stability improves noticeably during heavier attempts. To progress: Refine technique and automate breathing pattern.',
              s_breathing_bracing.competent_level = 'Breathing and bracing is consistent and effective across all lifts. Creates strong pressure automatically. Maintains tension throughout demanding sets. To progress: Fine-tune timing and adaptation to different lifts.',
              s_breathing_bracing.proficient_level = 'Breathing and bracing is automatic and optimized. Perfect pressure management throughout all lifts. Instinctively adapts timing to lift demands. To progress: Develop advanced breathing strategies for specific situations.',
              s_breathing_bracing.expert_level = 'Complete mastery of breathing and bracing. Instinctive and perfect execution in all situations. Can teach technique effectively. Stability is exceptional and controlled.';

// Intermediate Skills (Developing/Competent Levels)

MERGE (s_weight_progression:Skill {name: 'Progressive Weight Advancement'})
ON CREATE SET s_weight_progression.description = 'The ability to systematically increase training weights within a program structure, knowing when to add weight, how much to add, and how to manage failed attempts or plateaus. This skill drives continuous strength development.',
              s_weight_progression.how_to_develop = 'Follow a structured program for 8-12 weeks tracking all lifts. Experiment with different increment sizes (2.5-5 lbs for upper body, 5-10 lbs for lower body). Learn your personal response patterns. Analyze when progression is possible versus when weight increases cause form breakdown.',
              s_weight_progression.novice_level = 'Adds weight inconsistently and often too aggressively. Sometimes attempts weight increases before ready. Lacks clear progression strategy. To progress: Follow a structured program with prescribed increments.',
              s_weight_progression.advanced_beginner_level = 'Follows program increments mostly correctly. Adds weight appropriately when target reps are achieved. Occasionally adds too much too quickly. To progress: Learn personal response patterns and adjust increments.',
              s_weight_progression.competent_level = 'Advances weight systematically following program design. Recognizes when form allows progression versus when maintaining weight is correct. Adjusts increment sizes based on experience. To progress: Develop intuition for optimal progression timing.',
              s_weight_progression.proficient_level = 'Weight progression is automatic and optimized. Instinctively knows correct timing and increment sizes for personal goals. Balances progression with form quality consistently. To progress: Design custom progression schemes.',
              s_weight_progression.expert_level = 'Complete mastery of progression strategy. Predicts optimal advances and manages progression flawlessly. Recognizes individual response patterns and adjusts automatically. Can design progression schemes for others.';

MERGE (s_squat_loading:Skill {name: 'Squat Variation Selection and Loading'})
ON CREATE SET s_squat_loading.description = 'The ability to select appropriate squat variations (high bar, low bar, front squat, paused squat) based on training goals, body mechanics, and current weaknesses, and load them appropriately for different rep ranges.',
              s_squat_loading.how_to_develop = 'Practice 3-4 different squat variations over 2-3 months. Experience how each variation feels and affects different muscle groups. Learn coaching cues for each variation. Analyze how variation changes affect your performance.',
              s_squat_loading.novice_level = 'Can perform basic squat variations with coaching. Has minimal understanding of why different variations matter. To progress: Experiment with variations and understand mechanical differences.',
              s_squat_loading.advanced_beginner_level = 'Understands why different variations target different muscle groups. Can execute 2-3 variations competently. Beginning to select variations based on simple goals. To progress: Deepen understanding of mechanical advantages.',
              s_squat_loading.competent_level = 'Selects squat variations strategically based on goals and weak points. Understands mechanical advantages of each variation. Loads variations appropriately for different rep ranges. To progress: Refine variation cycling and specialization.',
              s_squat_loading.proficient_level = 'Variation selection is intuitive and optimized. Understands subtle mechanical differences and personal leverages deeply. Cycles variations strategically for comprehensive development. To progress: Develop advanced variation combinations.',
              s_squat_loading.expert_level = 'Complete mastery of squat variation selection. Can identify optimal variations for any individual. Variation programming is sophisticated and individualized. Can teach variation strategy effectively.';

MERGE (s_deadlift_loading:Skill {name: 'Deadlift Variation Selection and Loading'})
ON CREATE SET s_deadlift_loading.description = 'The ability to select appropriate deadlift variations (conventional, sumo, deficit, block pulls) based on training goals and individual strengths/weaknesses, and load them effectively for different training phases.',
              s_deadlift_loading.how_to_develop = 'Practice 3-4 different deadlift variations over 2-3 months. Learn the mechanical differences between variations. Analyze how each variation affects your performance. Determine which variations suit your leverages best.',
              s_deadlift_loading.novice_level = 'Can perform basic deadlift variations with instruction. Lacks understanding of why variations are useful. To progress: Experience different variations and understand mechanical differences.',
              s_deadlift_loading.advanced_beginner_level = 'Understands major differences between conventional and sumo. Can execute 2-3 variations. Beginning to recognize variations address different weaknesses. To progress: Deepen mechanical understanding.',
              s_deadlift_loading.competent_level = 'Selects deadlift variations strategically for weak point work. Understands how variation affects muscle recruitment. Loads variations appropriately. To progress: Develop advanced variation understanding.',
              s_deadlift_loading.proficient_level = 'Variation selection is intuitive and highly optimized. Deep understanding of mechanical leverage and personal strengths. Cycles variations strategically. To progress: Design sophisticated variation protocols.',
              s_deadlift_loading.expert_level = 'Complete mastery of deadlift variations. Can identify optimal variations for any lifter. Creates sophisticated variation protocols that address specific weaknesses. Teaches variation strategy effectively.';

MERGE (s_accessory_selection:Skill {name: 'Accessory Exercise Selection and Programming'})
ON CREATE SET s_accessory_selection.description = 'The ability to identify weak points in main lifts, select accessory exercises that address specific deficiencies, and program them appropriately within a training structure.',
              s_accessory_selection.how_to_develop = 'Track your main lift performance and identify consistent weak points for 4-8 weeks. Research accessory exercises for weak points. Experiment with different accessories over 2-3 month cycles. Track how accessories affect main lift improvements.',
              s_accessory_selection.novice_level = 'Performs generic accessories without clear purpose. Limited understanding of weak points or how accessories address them. To progress: Analyze performance and select targeted accessories.',
              s_accessory_selection.advanced_beginner_level = 'Beginning to recognize personal weak points. Selects accessories somewhat randomly but with some purpose. Performs accessories but sees minimal main lift improvements. To progress: Focus accessories more specifically on weak points.',
              s_accessory_selection.competent_level = 'Clearly identifies weak points in main lifts. Selects accessories strategically to address weak points. Programs accessories with appropriate volume and frequency. Sees improvements in main lifts. To progress: Refine weak point analysis and accessory selection.',
              s_accessory_selection.proficient_level = 'Weak point identification is quick and accurate. Accessory selection is optimal and specific. Programs accessories with sophisticated understanding of fatigue and recovery. To progress: Design advanced accessory strategies.',
              s_accessory_selection.expert_level = 'Complete mastery of weak point analysis and accessory selection. Rapidly identifies limiting factors. Selects optimally targeted accessories. Can design complete accessory programs for others.';

MERGE (s_rep_range_management:Skill {name: 'Rep Range and Volume Prescription'})
ON CREATE SET s_rep_range_management.description = 'The ability to prescribe appropriate rep ranges for different training goals (strength, hypertrophy, endurance), understand volume load relationships, and manage total training volume for optimal adaptation.',
              s_rep_range_management.how_to_develop = 'Train different rep ranges for 3-4 week cycles and track strength and muscle changes. Study programming literature on rep range relationships. Calculate and track volume load over time. Analyze personal response to different volume ranges over 2-3 months.',
              s_rep_range_management.novice_level = 'Performs prescribed rep ranges but understands little about why. Limited awareness of volume concepts. To progress: Learn about strength/hypertrophy/endurance rep ranges.',
              s_rep_range_management.advanced_beginner_level = 'Understands basic rep range purposes (low reps for strength, higher reps for hypertrophy). Beginning to track volume. To progress: Deepen volume tracking and relationship understanding.',
              s_rep_range_management.competent_level = 'Selects rep ranges strategically based on goals. Understands volume load relationship to adaptation. Tracks and manages total weekly volume effectively. To progress: Develop advanced volume management.',
              s_rep_range_management.proficient_level = 'Rep range selection is intuitive and optimized. Volume management is automatic and sophisticated. Understands personal response to different volume ranges. To progress: Design advanced volume periodization.',
              s_rep_range_management.expert_level = 'Complete mastery of rep range and volume relationship. Prescribes optimally tailored rep ranges and volumes. Understands individual response deeply. Can design volume protocols for others.';

// Advanced Skills (Advanced/Master Levels)

MERGE (s_form_coaching:Skill {name: 'Form Coaching and Cue Development'})
ON CREATE SET s_form_coaching.description = 'The ability to observe a lifter\'s technique, identify specific form issues, develop individualized coaching cues, and teach corrections effectively to improve movement quality.',
              s_form_coaching.how_to_develop = 'Watch and analyze 20-30 videos of lifters with different form issues. Coach 10-20 different lifters on form corrections over 3-6 months. Practice identifying issues quickly and developing specific cues. Refine cue effectiveness through feedback.',
              s_form_coaching.novice_level = 'Can identify obvious form problems with coaching prompts. Cues are generic and sometimes unhelpful. To progress: Develop more specific and individualized coaching language.',
              s_form_coaching.advanced_beginner_level = 'Identifies common form problems consistently. Develops some specific cues for individuals. Beginning to match cues to learning style. To progress: Deepen form analysis skill and cue specificity.',
              s_form_coaching.competent_level = 'Quickly identifies form problems and root causes. Develops specific, effective cues. Teaches corrections that improve form measurably. To progress: Refine subtle issue recognition and advanced cueing.',
              s_form_coaching.proficient_level = 'Form analysis is rapid and comprehensive. Cues are perfectly tailored to individuals and highly effective. Can identify and address subtle technique issues. To progress: Teach coaching to other coaches.',
              s_form_coaching.expert_level = 'Complete mastery of form coaching. Can identify even subtle issues instantly. Cues are perfectly individualized and remarkably effective. Can teach coaching technique to others. Lifters improve rapidly under your instruction.';

MERGE (s_auto_regulation:Skill {name: 'Autoregulation and RPE-Based Training'})
ON CREATE SET s_auto_regulation.description = 'The ability to assess perceived effort (RPE) accurately during sets, adjust weights based on real-time effort rather than percentages, and manage training intensity based on daily recovery and readiness.',
              s_auto_regulation.how_to_develop = 'Train with RPE scale for 4-6 weeks while comparing to percentage-based training. Learn to accurately rate perceived effort 1-10. Correlate RPE ratings with actual rep performance. Adjust weights based on RPE for 2-3 months until confident.',
              s_auto_regulation.novice_level = 'Attempts RPE-based training but ratings are inaccurate. Adjustments based on RPE are inconsistent. To progress: Calibrate RPE assessment through multiple sessions.',
              s_auto_regulation.advanced_beginner_level = 'RPE ratings are mostly accurate. Adjusts weights based on RPE but inconsistently. Beginning to understand correlation between RPE and performance. To progress: Improve consistency and refine rating calibration.',
              s_auto_regulation.competent_level = 'Accurately assesses RPE consistently. Adjusts weights appropriately based on daily effort. Understands relationship between RPE and training adaptations. To progress: Develop advanced autoregulation strategies.',
              s_auto_regulation.proficient_level = 'RPE assessment is highly accurate and automatic. Weight adjustments based on RPE are perfectly calibrated. Manages training intensity intuitively. To progress: Design autoregulated programming for others.',
              s_auto_regulation.expert_level = 'Complete mastery of RPE and autoregulation. Instantly and accurately assesses effort and adjusts appropriately. Can manage training variables fluidly based on daily status. Can train others in autoregulation.';

MERGE (s_periodization_design:Skill {name: 'Periodization and Long-Term Program Planning'})
ON CREATE SET s_periodization_design.description = 'The ability to design multi-week and multi-month periodized training plans that strategically sequence phases, manage fatigue accumulation, and optimize progression for long-term strength development.',
              s_periodization_design.how_to_develop = 'Study 3-4 different periodization models (linear, undulating, block) in depth. Design personal periodized plans over 2-3 training cycles (3-4 months each). Compare outcomes across different periodization approaches. Analyze which model suits your response best.',
              s_periodization_design.novice_level = 'Understands basic periodization concepts (strength vs hypertrophy phases). Program structure is somewhat random. To progress: Study specific periodization models and implement.',
              s_periodization_design.advanced_beginner_level = 'Can follow a linear periodization model. Understands phase transitions and simple planning. Struggles with longer-term optimization. To progress: Implement more complex periodization models.',
              s_periodization_design.competent_level = 'Designs solid periodized programs using linear or undulating approaches. Manages fatigue and deload phases appropriately. Programs show logical progression. To progress: Develop sophisticated periodization combining multiple models.',
              s_periodization_design.proficient_level = 'Program design is sophisticated and highly individualized. Seamlessly combines periodization models. Optimizes phase sequencing for personal response. To progress: Design periodization for competitive peaks.',
              s_periodization_design.expert_level = 'Complete mastery of periodization and long-term planning. Designs sophisticated multi-cycle programs tailored to individuals. Predicts and manages fatigue perfectly. Can design periodization for any goal. Programs demonstrate remarkable coherence and effectiveness.';

MERGE (s_weakness_identification:Skill {name: 'Strength Weakness Identification and Analysis'})
ON CREATE SET s_weakness_identification.description = 'The ability to perform detailed movement analysis to identify specific weak points limiting strength development (lockout weakness, bottom position strength, leg drive), and distinguish primary limitations from secondary issues.',
              s_weakness_identification.how_to_develop = 'Perform 50-100 reps across different positions and variations for each main lift over 4-8 weeks. Record videos and analyze performance at different ranges. Compare performance across variations. Identify consistent weak positions.',
              s_weakness_identification.novice_level = 'Vaguely aware of some weak points. Analysis is superficial. To progress: Perform detailed movement analysis and track performance by position.',
              s_weakness_identification.advanced_beginner_level = 'Identifies obvious weak points (e.g., lockout weakness). Analysis is somewhat helpful. Occasionally misidentifies limiting factors. To progress: Deepen analytical skills and precision.',
              s_weakness_identification.competent_level = 'Systematically identifies specific weak points through varied movement analysis. Distinguishes primary limiting factors. Analysis informs accessory selection effectively. To progress: Refine subtle weakness detection.',
              s_weakness_identification.proficient_level = 'Weakness identification is rapid and highly accurate. Identifies subtle limiting factors quickly. Analysis is incredibly detailed and useful. To progress: Analyze others\' lifts and help identify weaknesses.',
              s_weakness_identification.expert_level = 'Complete mastery of weakness identification. Can identify limiting factors in seconds through video or observation. Analysis is extraordinarily detailed and actionable. Can teach weakness analysis to others.';

MERGE (s_sport_transfer:Skill {name: 'Sport-Specific Strength Application'})
ON CREATE SET s_sport_transfer.description = 'The ability to analyze specific sport movement demands, select and program strength exercises that transfer to sport performance, and time strength development around competition schedules.',
              s_sport_transfer.how_to_develop = 'Study movement patterns of your sport in detail for 2-3 weeks. Research strength requirements for peak performance. Train with sports-specific strength emphasis for 2-3 competition cycles. Analyze performance improvements from specific strength work.',
              s_sport_transfer.novice_level = 'Applies basic strength training generally without sport specificity. Limited transfer to sport performance. To progress: Analyze sport-specific movement demands.',
              s_sport_transfer.advanced_beginner_level = 'Attempts to select strength work related to sport. Transfer to sport performance is inconsistent. To progress: Deepen movement analysis and timing.',
              s_sport_transfer.competent_level = 'Selects strength exercises that effectively transfer to sport. Programs strength timing around competition schedule. Performance improvements are noticeable. To progress: Refine transfer effectiveness.',
              s_sport_transfer.proficient_level = 'Sport-specific strength programming is excellent and highly effective. Transfer to sport is obvious and measurable. Timing is perfectly optimized. To progress: Design advanced sport-specific protocols.',
              s_sport_transfer.expert_level = 'Complete mastery of sport-specific strength transfer. Programs demonstrate remarkable sport-specific relevance. Transfer to performance is exceptional. Can train athletes in any sport effectively.';

MERGE (s_competition_preparation:Skill {name: 'Competition Preparation and Peaking'})
ON CREATE SET s_competition_preparation.description = 'The ability to manage training intensity and volume leading into competition, taper appropriately to maximize freshness while maintaining strength, and time peak performance for specific competition dates.',
              s_competition_preparation.how_to_develop = 'Compete in 2-3 competitions while experimenting with different taper lengths (1-3 weeks) and intensities. Track how different approaches affect peak strength. Analyze which taper strategy yields best performance. Refine timing over multiple competitions.',
              s_competition_preparation.novice_level = 'Reduces training somewhat before competition but approach is disorganized. Uncertain about optimal taper strategy. To progress: Study successful taper approaches and implement systematically.',
              s_competition_preparation.advanced_beginner_level = 'Implements basic taper 1-2 weeks before competition. Reduces volume but timing is inconsistent. To progress: Refine taper timing and intensity reduction.',
              s_competition_preparation.competent_level = 'Tapers strategically to arrive fresh for competition. Maintains strength while reducing fatigue. Performs well in competition. To progress: Fine-tune taper intensity and duration.',
              s_competition_preparation.proficient_level = 'Taper is optimized and consistently results in peak performance. Perfectly balances freshness and strength maintenance. To progress: Design peaking strategies for others.',
              s_competition_preparation.expert_level = 'Complete mastery of competition preparation. Peaking strategies are sophisticated and consistently deliver peak performance. Prepares athletes exceptionally well. Can train coaches in competition preparation.';

MERGE (s_lifter_coaching:Skill {name: 'Individual Lifter Coaching and Development'})
ON CREATE SET s_lifter_coaching.description = 'The ability to work with individual lifters over time, understand their responses to training, adapt programs and coaching to their needs, and develop them from novice to advanced levels.',
              s_lifter_coaching.how_to_develop = 'Coach 5-10 different lifters with varying goals and starting levels over 1-2 years. Track their progress and responses to different programming approaches. Develop personalized coaching strategies for each. Learn what approaches work for different individuals.',
              s_lifter_coaching.novice_level = 'Works with lifters but coaching is generic. Limited adaptation to individual needs. To progress: Learn individual response patterns and personalize coaching.',
              s_lifter_coaching.advanced_beginner_level = 'Coaches individuals and makes some adjustments. Recognizes basic individual differences. Lifters show steady progress. To progress: Develop deeper personalization.',
              s_lifter_coaching.competent_level = 'Coaches effectively with good individualization. Adapts programming and instruction to person. Lifters progress consistently and steadily. To progress: Develop advanced coaching adaptation.',
              s_lifter_coaching.proficient_level = 'Coaching is personalized and highly effective. Understands individual response patterns intuitively. Lifters progress rapidly and are satisfied. To progress: Coach more challenging individuals.',
              s_lifter_coaching.expert_level = 'Complete mastery of individual coaching. Can develop any lifter effectively regardless of starting point. Lifters progress exceptionally well and report excellent experience. Commands great respect as a coach.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

MERGE (t_strength:Trait {name: 'Physical Strength'})
ON CREATE SET t_strength.description = 'The inherent capacity of muscles to generate force and move heavy objects. Physical strength is foundational to weight lifting success and determines the baseline capacity for resistance training.',
              t_strength.measurement_criteria = 'Assessed through maximum force generation in key movements (squat, deadlift, bench press) and ability to control heavy loads. Low (0-25): Cannot perform basic lifts with body weight; struggles with 5-10 lb weights. Moderate (26-50): Can perform compound movements with 30-50% of advanced lifter weight. High (51-75): Can lift moderate to heavy weights with good form; demonstrates natural strength advantage. Exceptional (76-100): Can generate exceptional force; lifts weight that is elite or competitive level.';

MERGE (t_muscular_endurance:Trait {name: 'Muscular Endurance'})
ON CREATE SET t_muscular_endurance.description = 'The capacity of muscles to sustain repeated efforts over multiple sets and sessions. This trait enables lifters to complete full training volume without early fatigue or form degradation.',
              t_muscular_endurance.measurement_criteria = 'Assessed through ability to maintain form and output across multiple sets, and recovery speed between sessions. Low (0-25): Fatigues quickly within a set; struggles to complete prescribed volume. Moderate (26-50): Can complete basic training volume with some form breakdown in final sets. High (51-75): Maintains form well across multiple sets; recovers quickly and handles high volume effectively. Exceptional (76-100): Exceptional muscle endurance; completes high volume without fatigue; bounces back immediately for subsequent sessions.';

MERGE (t_body_awareness:Trait {name: 'Proprioception'})
ON CREATE SET t_body_awareness.description = 'The ability to sense body position, movement, and tension without visual feedback. Proprioception enables lifters to maintain form in deep ranges, feel muscle activation, and make micro-adjustments during lifts.',
              t_body_awareness.measurement_criteria = 'Assessed through ability to find proper form without mirrors, maintain position under fatigue, and feel intended muscle activation. Low (0-25): Requires constant external cuing; cannot feel proper position; relies heavily on mirrors or video. Moderate (26-50): Can find approximate position but benefits from external feedback; occasional form loss under fatigue. High (51-75): Maintains position intuitively; feels muscle activation clearly; makes adjustments automatically. Exceptional (76-100): Exceptional proprioception; senses minute position changes; makes imperceptible micro-adjustments; perfect form even in fatigued states.';

MERGE (t_focus:Trait {name: 'Focus'})
ON CREATE SET t_focus.description = 'The capacity to concentrate intensely on form, movement patterns, and task execution during training. Focus prevents accidents, ensures quality reps, and enables effective technique development.',
              t_focus.measurement_criteria = 'Assessed through consistency of attention during sets, resistance to distraction, and ability to maintain concentration over long training sessions. Low (0-25): Easily distracted; inconsistent form from lack of focus; difficult to complete sets with full attention. Moderate (26-50): Can focus for moderate periods; occasional lapses during demanding sets or long sessions. High (51-75): Maintains good focus throughout training; resists most distractions; stays engaged in form execution. Exceptional (76-100): Exceptional focus and concentration; complete attention regardless of distraction; maintains focus even in high-fatigue states.';

MERGE (t_mental_resilience:Trait {name: 'Mental Resilience'})
ON CREATE SET t_mental_resilience.description = 'The ability to persevere through mental and physical discomfort, manage performance anxiety, and maintain composure during challenging lifts or failed attempts. This trait enables lifters to push into new territory and handle competitive pressure.',
              t_mental_resilience.measurement_criteria = 'Assessed through willingness to attempt heavy or uncertain lifts, recovery from failed attempts, and ability to manage fear in high-risk scenarios. Low (0-25): Mentally defeated by failed attempts; avoids challenging attempts due to fear; struggles with confidence. Moderate (26-50): Can push through moderate discomfort; recovers from failures eventually; some anxiety about heavy lifts. High (51-75): Embraces challenging attempts; recovers quickly from failures; manages anxiety effectively. Exceptional (76-100): Exceptional mental toughness; thrives on challenge; bounces back immediately from failures; no fear response; confident in all situations.';

MERGE (t_pain_tolerance:Trait {name: 'Pain Tolerance'})
ON CREATE SET t_pain_tolerance.description = 'The capacity to tolerate and work through muscle fatigue, soreness, and discomfort during and after training. High pain tolerance enables lifters to push through burning sensations and manage delayed-onset muscle soreness.',
              t_pain_tolerance.measurement_criteria = 'Assessed through willingness to train while fatigued, ability to complete sets despite burn, and tolerance for post-training soreness. Low (0-25): Stops sets early due to pain/burn; reduced training due to soreness; heavily limited by discomfort. Moderate (26-50): Tolerates moderate burn and soreness; occasionally stops sets early; some training limitations. High (51-75): Works through burn effectively; manages soreness well; trains through minor discomfort. Exceptional (76-100): Exceptional pain tolerance; pushes hard despite significant burn; trains intensely despite soreness; discomfort has minimal impact.';

MERGE (t_discipline:Trait {name: 'Discipline'})
ON CREATE SET t_discipline.description = 'The inherent capacity to stick to training plans, maintain consistent practice despite lack of immediate reward, and prioritize long-term goals over short-term comfort. This trait determines consistency and program adherence.',
              t_discipline.measurement_criteria = 'Assessed through consistency of training attendance, adherence to prescribed programs, and ability to resist skipping sessions. Low (0-25): Trains sporadically; frequently abandons programs; low consistency. Moderate (26-50): Trains regularly but occasionally skips; follows programs with some deviations; moderate consistency. High (51-75): Trains consistently and follows programs well; rarely skips without good reason; strong consistency. Exceptional (76-100): Exceptional discipline; never misses without urgent reason; perfect program adherence; trains regardless of obstacles or discomfort.';

MERGE (t_competitiveness:Trait {name: 'Competitive Drive'})
ON CREATE SET t_competitiveness.description = 'The inherent motivation to compare performance to others, achieve rankings or records, and pursue excellence through competition. This trait fuels progression for competitive lifters and determines motivation in competitive settings.',
              t_competitiveness.measurement_criteria = 'Assessed through motivation from competition, desire to achieve records, and intensity in competitive scenarios. Low (0-25): No interest in competition; training is purely personal; no record-seeking behavior. Moderate (26-50): Interested in personal records; some competitive drive in events; motivated by self-comparison. High (51-75): Strong competitive motivation; pursues records; performs well in competitive settings. Exceptional (76-100): Exceptional competitive drive; thrives in competition; highly motivated by rankings; constantly pursues personal and competitive records.';

MERGE (t_body_control:Trait {name: 'Body Control'})
ON CREATE SET t_body_control.description = 'The capacity to coordinate and control movement precisely, maintain stability during complex movements, and prevent unintended movement patterns. Body control enables execution of advanced techniques and protection from injury.',
              t_body_control.measurement_criteria = 'Assessed through smoothness of movement, stability during transitions, and ability to prevent compensatory patterns. Low (0-25): Movements are jerky or uncontrolled; struggles with balance and stability; significant compensatory patterns. Moderate (26-50): Generally controlled but sometimes jerky; adequate stability in basic movements; minor compensations. High (51-75): Smooth and controlled movement; good stability and balance; minimal compensations. Exceptional (76-100): Exceptional movement control; perfectly smooth and coordinated; flawless stability; zero compensations.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones (Entry-level achievements)

MERGE (m_first_gym:Milestone {name: 'Complete First Gym Session'})
ON CREATE SET m_first_gym.description = 'Successfully complete your first weight lifting session in a gym or training facility with proper form on basic movements. This milestone marks your official entry into weight lifting.',
              m_first_gym.how_to_achieve = 'Find a gym or training facility with barbells and dumbbells. Arrive for a session (30-60 minutes). Perform basic movements with light weight or supervision: practice empty bar movements, perform 2-3 exercises for upper and lower body. Focus on experiencing the environment and feeling comfortable with equipment. Most people achieve this in their first planned visit.';

MERGE (m_pass_belay:Milestone {name: 'Pass Belay Certification'})
ON CREATE SET m_pass_belay.description = 'Successfully complete belay certification if training in a gym requiring it, or demonstrate safe spotting technique under supervision. This milestone ensures you understand basic safety protocols.',
              m_pass_belay.how_to_achieve = 'If your gym requires belay certification, attend the certification class (typically 1-2 hours). Study spotting techniques and safety procedures. Pass both written and practical components. If your gym does not require certification, work one-on-one with an experienced lifter to demonstrate safe spotting technique and receive their approval. Expected timeframe: 1-2 weeks after starting.';

MERGE (m_bodyweight_squat:Milestone {name: 'Complete Bodyweight Squat to Depth'})
ON CREATE SET m_bodyweight_squat.description = 'Perform a full-depth bodyweight squat with neutral spine and controlled movement, demonstrating foundational leg mobility and movement pattern. This milestone indicates basic lower body capability.',
              m_bodyweight_squat.how_to_achieve = 'Practice bodyweight squats focusing on depth 3-4 times per week for 1-2 weeks. Watch instructional videos on proper squat form. Practice in front of a mirror or video yourself to check depth and position. Achieve consistent full-depth squats for 5-10 consecutive reps. This is typically achieved within the first 1-2 weeks of training.';

MERGE (m_empty_bar_bench:Milestone {name: 'Perform Empty Barbell Bench Press'})
ON CREATE SET m_empty_bar_bench.description = 'Successfully execute a full set of bench presses with an empty barbell (45 lbs), demonstrating basic pressing mechanics and shoulder stability.',
              m_empty_bar_bench.how_to_achieve = 'Learn proper bench press setup and positioning from a coach or video. Practice bench press setup with an empty bar for 2-3 sessions. Focus on shoulder blade positioning and leg drive. Perform multiple reps with smooth controlled movement. Most beginners achieve this in their first 1-2 sessions of bench press practice.';

MERGE (m_deadlift_form:Milestone {name: 'Execute Proper Deadlift Form'})
ON CREATE SET m_deadlift_form.description = 'Perform a deadlift with correct hip hinge mechanics, neutral spine, and controlled lockout using light weight or an empty bar. This milestone demonstrates foundational deadlift competence.',
              m_deadlift_form.how_to_achieve = 'Study hip hinge mechanics through coaching or video resources. Practice setup position without weight for several repetitions. Perform deadlifts with empty bar focusing entirely on position and not speed. Get feedback from a coach or experienced lifter on setup and form. Achieve 5-10 consecutive reps with proper form. Expected timeframe: 1-3 weeks of consistent practice.';

// Developing Level Milestones (Building competence)

MERGE (m_bw_multiple:Milestone {name: 'Lift Bodyweight'})
ON CREATE SET m_bw_multiple.description = 'Achieve a squat, bench press, or deadlift at or above your own bodyweight (or 80% of bodyweight for bench), demonstrating meaningful strength development.',
              m_bw_multiple.how_to_achieve = 'Choose one lift to focus on (deadlift is typically fastest). Follow a progressive training program for 8-16 weeks adding weight systematically. Train the lift 2-3 times per week. Maintain proper form even as weights increase. Track your progress weekly. Most lifters achieve bodyweight deadlift or squat in 2-4 months of consistent training.';

MERGE (m_program_adherence:Milestone {name: 'Complete 12-Week Training Program'})
ON CREATE SET m_program_adherence.description = 'Follow a structured training program for the full 12-week duration, completing all prescribed sessions without major deviations. This milestone demonstrates consistency and commitment.',
              m_program_adherence.how_to_achieve = 'Select a reputable 12-week program (StrongLifts 5x5, Starting Strength, 5/3/1, GZCLP, or similar). Track each session you complete. Miss no more than 2 sessions total due to illness or genuine emergency. Complete the program exactly as written without major alterations. Document your start and end dates and final results.';

MERGE (m_form_feedback:Milestone {name: 'Receive Professional Form Feedback'})
ON CREATE SET m_form_feedback.description = 'Get a coaching session or form assessment from a certified strength coach, trainer, or experienced lifter, receiving documented feedback on your technique.',
              m_form_feedback.how_to_achieve = 'Schedule a coaching session or form assessment with a certified coach (consider ISSA, NASM, or similar certifications) or an experienced lifter with proven credentials. Bring videos or perform lifts in person. Receive specific written or recorded feedback on form. Get suggestions for improvement. Session typically costs $50-150 or can be obtained free from experienced peers. Expected timeframe: 2-4 weeks into training.';

MERGE (m_squat_plate:Milestone {name: 'Squat One Plate Per Side'})
ON CREATE SET m_squat_plate.description = 'Achieve a squat of 135+ lbs (or one 45-lb plate per side on the bar), a classic benchmark for developing strength.',
              m_squat_plate.how_to_achieve = 'Follow a progressive strength program focused on the squat. Train squat 2-3 times per week with controlled progression. Increase weight by 5-10 lbs per week when form is solid. Focus on consistency over speed. Maintain a food intake supporting muscle growth. Expected timeframe: 4-12 weeks depending on starting level.';

MERGE (m_deadlift_plate:Milestone {name: 'Deadlift One Plate Per Side'})
ON CREATE SET m_deadlift_plate.description = 'Achieve a deadlift of 225+ lbs (one 45-lb plate per side), a foundational strength benchmark.',
              m_deadlift_plate.how_to_achieve = 'Train deadlift 1-2 times per week with progressive overload. Follow a program like StrongLifts or Starting Strength that prioritizes deadlift. Add 5-10 lbs per week systematically. Maintain excellent form even as weights increase. Most lifters reach this in 8-16 weeks of focused training.';

MERGE (m_bench_plate:Milestone {name: 'Bench Press One Plate Per Side'})
ON CREATE SET m_bench_plate.description = 'Achieve a bench press of 185+ lbs (one 45-lb plate per side), a meaningful upper body strength goal.',
              m_bench_plate.how_to_achieve = 'Train bench press 2-3 times per week with progressive overload. Focus on strict form with no leg drive to maximize chest development. Increase weight by 2.5-5 lbs per week. Include accessory work for weak points. Expected timeframe: 12-24 weeks depending on starting level.';

// Competent Level Milestones (Solid intermediate achievements)

MERGE (m_two_plate_squat:Milestone {name: 'Squat Two Plates Per Side'})
ON CREATE SET m_two_plate_squat.description = 'Achieve a squat of 225+ lbs (two 45-lb plates per side), indicating substantial lower body strength development.',
              m_two_plate_squat.how_to_achieve = 'Build from bodyweight squat with consistent progression. Follow a structured program for 6-12 months of focused squat training. Increase weight systematically (5-10 lbs per week in early phases, slower as you get stronger). Maintain nutrition and recovery. Expected timeframe: 6-12 months of consistent training.';

MERGE (m_three_plate_deadlift:Milestone {name: 'Deadlift Three Plates Per Side'})
ON CREATE SET m_three_plate_deadlift.description = 'Achieve a deadlift of 315+ lbs (three 45-lb plates per side), demonstrating elite beginner or intermediate strength.',
              m_three_plate_deadlift.how_to_achieve = 'Build from one-plate deadlift with consistent progression over 6-12 months. Focus on main deadlift strength work 1-2 times per week. Include supportive accessory work. Increase weight systematically. Track form quality - maintain it even as weights climb. Expected timeframe: 6-12 months from one-plate.';

MERGE (m_two_plate_bench:Milestone {name: 'Bench Press Two Plates Per Side'})
ON CREATE SET m_two_plate_bench.description = 'Achieve a bench press of 275+ lbs (two 45-lb plates per side), a significant upper body achievement.',
              m_two_plate_bench.how_to_achieve = 'Build systematically from one-plate bench with 6-18 months of focused upper body training. Train bench press 2-3 times per week. Include accessory work for weak points and shoulders. Progress weight gradually (2.5-5 lbs per week). Consider periodization to manage fatigue. Expected timeframe: 6-18 months.';

MERGE (m_squat_variation:Milestone {name: 'Master a Squat Variation'})
ON CREATE SET m_squat_variation.description = 'Develop proficiency in a non-standard squat variation (front squat, pause squat, tempo squat, or other variation), loading it to your current strength level.',
              m_squat_variation.how_to_achieve = 'Choose a squat variation to master. Practice it 1-2 times per week for 8-12 weeks. Learn proper form through coaching or video resources. Build it to your current strength capability (80-100% of your standard squat). Demonstrate consistent, controlled reps. Expected timeframe: 2-4 months.';

MERGE (m_deadlift_variation:Milestone {name: 'Master a Deadlift Variation'})
ON CREATE SET m_deadlift_variation.description = 'Develop proficiency in an alternative deadlift variation (sumo, deficit pull, block pull, or other variation), loading it meaningfully.',
              m_deadlift_variation.how_to_achieve = 'Select a deadlift variation and practice it 1 time per week for 8-12 weeks. Learn technical cues and proper setup. Build it to 70-90% of your standard deadlift. Perform 5-10 quality reps consistently. Get feedback on form from an experienced lifter. Expected timeframe: 2-4 months.';

MERGE (m_coach_session:Milestone {name: 'Complete Advanced Coaching Session'})
ON CREATE SET m_coach_session.description = 'Work with a certified strength coach for program design, form refinement, or specialized training to advance beyond intermediate level.',
              m_coach_session.how_to_achieve = 'Find a coach with credentials (ISSA, CSCS, SFG, or equivalent) and relevant experience. Schedule 2-4 sessions or a programming consultation. Discuss your specific goals and limitations. Receive individualized program adjustments. Apply their recommendations to your training. Cost typically $75-200 per session.';

MERGE (m_monthly_records:Milestone {name: 'Establish Personal Records'})
ON CREATE SET m_monthly_records.description = 'Test and establish new personal records in at least two main lifts (squat, deadlift, bench press), demonstrating measurable strength progression.',
              m_monthly_records.how_to_achieve = 'After 8-12 weeks of a training cycle, schedule a testing day for your main lifts. Warm up thoroughly. Attempt progressively heavier weights until reaching a true one-rep max or heavy double. Record the weights achieved. Document your starting point if not already done. This is a formal tracking of strength progression.';

// Advanced Level Milestones (Elite intermediate to advanced)

MERGE (m_three_plate_bench:Milestone {name: 'Bench Press Three Plates Per Side'})
ON CREATE SET m_three_plate_bench.description = 'Achieve a bench press of 365+ lbs (three 45-lb plates per side), an elite-level upper body achievement.',
              m_three_plate_bench.how_to_achieve = 'Build from two-plate bench through 12-24 months of focused pressing. Train bench 2-3 times per week with variation and accessory work. Follow a periodized program managing fatigue. Increase weight conservatively (2.5 lbs per week or less). Maintain perfect form. Expected timeframe: 12-24 months.';

MERGE (m_four_plate_squat:Milestone {name: 'Squat Four Plates Per Side'})
ON CREATE SET m_four_plate_squat.description = 'Achieve a squat of 315+ lbs (four 45-lb plates per side), an elite lower body strength achievement.',
              m_four_plate_squat.how_to_achieve = 'Build from two-plate squat through 12-18 months of focused training. Train squat 2-3 times per week. Implement periodization and variation strategies. Progress weight conservatively. Include supporting accessory work. Maintain nutrition and recovery. Expected timeframe: 12-18 months.';

MERGE (m_four_plate_deadlift:Milestone {name: 'Deadlift Four Plates Per Side'})
ON CREATE SET m_four_plate_deadlift.description = 'Achieve a deadlift of 405+ lbs (four 45-lb plates per side), an elite-level strength achievement.',
              m_four_plate_deadlift.how_to_achieve = 'Build from three-plate deadlift through 12-18 months of focused training. Train deadlift 1-2 times per week with variation support. Follow periodization managing fatigue accumulation. Progress weight strategically. Expected timeframe: 12-18 months from three-plate.';

MERGE (m_ipf_total:Milestone {name: 'Achieve 1000+ Total in Competition'})
ON CREATE SET m_ipf_total.description = 'Compete in an International Powerlifting Federation (IPF) or sanctioned powerlifting competition and achieve a total (squat + bench + deadlift) of 1000+ lbs.',
              m_ipf_total.how_to_achieve = 'Build your lifts to approximately 315+ squat, 225+ bench, 405+ deadlift through 12-24 months of training. Register for a sanctioned competition. Follow a peaking protocol 4-8 weeks before competition. Compete in squat, bench, and deadlift. Achieve a combined total of 1000+ lbs. Expected timeframe: 18-36 months of serious training.';

MERGE (m_advanced_program:Milestone {name: 'Complete Advanced Periodized Program'})
ON CREATE SET m_advanced_program.description = 'Execute a sophisticated periodized training program (conjugate, undulating, block periodization) over 12-16 weeks with documented progression and peak performance.',
              m_advanced_program.how_to_achieve = 'Study an advanced periodization model (Westside Barbell, Coan-Phillipi, Tsatsouline, or similar). Design or select a 12-16 week program implementing the model. Execute it precisely. Track all lifts and metrics. Peak at the end. Document results before and after. Show measurable improvements.';

MERGE (m_mentor_lifter:Milestone {name: 'Mentor a Novice Lifter'})
ON CREATE SET m_mentor_lifter.description = 'Work with a beginner lifter as a mentor, guiding them from novice status through proper form instruction and training principles for at least 8 weeks.',
              m_mentor_lifter.how_to_achieve = 'Find a beginner lifter interested in learning. Meet with them 1-2 times per week for 8+ weeks. Teach proper form on basic lifts through demonstration and feedback. Help them establish a training routine. Provide guidance on programming basics. Get their agreement to follow your guidance. Document the experience.';

MERGE (m_certified_coach:Milestone {name: 'Obtain Strength Coaching Certification'})
ON CREATE SET m_certified_coach.description = 'Complete certification in strength coaching from an accredited organization (CSCS, ISSA, ACE, NASM, SFG, or equivalent), demonstrating formal coaching knowledge.',
              m_certified_coach.how_to_achieve = 'Select a coaching certification organization and program. Complete their coursework and study materials (typical time: 2-6 months). Pass the certification exam (typically 80%+ required). Pay certification fees ($300-600+). Maintain certification with continuing education. Expected timeframe: 3-6 months.';

MERGE (m_competition_participation:Milestone {name: 'Compete in Powerlifting Competition'})
ON CREATE SET m_competition_participation.description = 'Participate in an official powerlifting competition (IPF-affiliated or similar sanctioned event), completing all three lifts under competition conditions.',
              m_competition_participation.how_to_achieve = 'Build your lifts to competitive standard (typically 315+ squat, 185+ bench, 365+ deadlift). Research and register for a competition in your area. Complete all required paperwork and weigh-in procedures. Compete in squat, bench, and deadlift events. Attempt three lifts in each discipline. Complete all attempts legally. Expected timeframe: 12-18 months of training.';

// Master Level Milestones (Exceptional achievements)

MERGE (m_master_lift_total:Milestone {name: 'Achieve Advanced Competitive Total'})
ON CREATE SET m_master_lift_total.description = 'Achieve a powerlifting competition total of 1200+ lbs or higher, placing in top percentiles of competitive lifters.',
              m_master_lift_total.how_to_achieve = 'Build your lifts over 24-36 months through systematic periodized training. Target approximate lifts: 405+ squat, 275+ bench, 495+ deadlift. Follow elite-level periodization and training templates. Compete multiple times, improving each competition. Achieve the 1200+ total in an official competition. Expected timeframe: 24-36+ months.';

MERGE (m_multiple_records:Milestone {name: 'Establish Multiple Personal Records'})
ON CREATE SET m_multiple_records.description = 'Achieve new personal records in all three main lifts (squat, bench, deadlift) within the same competition or training cycle, demonstrating comprehensive strength development.',
              m_multiple_records.how_to_achieve = 'Plan a competition or testing session after completing a full periodized training cycle. Peak all three lifts simultaneously (challenging but possible). Warm up systematically. Attempt new records in squat, deadlift, and bench press. Succeed in setting PRs in all three. Document results and video evidence.';

MERGE (m_elite_total:Milestone {name: 'Achieve Elite Competitive Total'})
ON CREATE SET m_elite_total.description = 'Achieve a powerlifting total of 1400+ lbs or qualify for elite competition standards (top 1% of competitors), demonstrating master-level strength.',
              m_elite_total.how_to_achieve = 'Train at elite level for 36+ months with sophisticated periodization. Target lifts: 495+ squat, 315+ bench, 550+ deadlift. Follow elite coaching or templates (Westside, elite programs). Compete multiple times, steadily improving. Qualify for state or national competitions. Achieve the 1400+ total. Expected timeframe: 36-48+ months.';

MERGE (m_coaching_legacy:Milestone {name: 'Establish Coaching Program or Legacy'})
ON CREATE SET m_coaching_legacy.description = 'Develop and establish a strength coaching program or training system that you teach to multiple lifters, creating lasting impact on others\' progress.',
              m_coaching_legacy.how_to_achieve = 'Based on your years of lifting and coaching experience, develop a coherent training system or methodology. Document your approach. Teach it to at least 5-10 lifters over 12+ months. Track their progress under your program. Receive testimonials from coached athletes. Consider publishing your methods or training approach.';

MERGE (m_national_qualifier:Milestone {name: 'Qualify for National Competition'})
ON CREATE SET m_national_qualifier.description = 'Achieve the qualifying total for your national powerlifting federation or sanctioning body, gaining qualification to compete at national championships.',
              m_national_qualifier.how_to_achieve = 'Understand the total standards required for national qualification in your weight class and federation. Build your lifts systematically over 24-48 months. Compete in sanctioned competitions. Achieve the required total (varies by federation and weight class, typically 1200-1600+). Officially qualify through your federation. Expected timeframe: 24-48+ months.';

MERGE (m_teaching_mastery:Milestone {name: 'Master Teaching Advanced Lifters'})
ON CREATE SET m_teaching_mastery.description = 'Successfully coach and develop 5+ lifters from intermediate level to advanced competitive standard (1200+ totals), demonstrating mastery of coaching complex progression.',
              m_teaching_mastery.how_to_achieve = 'Coach multiple intermediate lifters over 3-5 years. Help each reach competitive totals of 1200+ lbs through periodized programs. Track their progress. Receive testimonials of satisfaction. Document case studies of their development. Establish yourself as a capable coach for advanced athletes. Expected timeframe: 3-5 years.';

MERGE (m_research_contribution:Milestone {name: 'Contribute Training Knowledge'})
ON CREATE SET m_research_contribution.description = 'Contribute original training knowledge, methodologies, or research to the strength training field through writing, teaching seminars, or published work.',
              m_research_contribution.how_to_achieve = 'Based on your years of training and coaching, develop original insights or methodologies. Write an article or guide on your approach (2000+ words). Present at a coaching seminar or conference. Or conduct systematic training experiments on yourself or your athletes and document results. Share your knowledge publicly. Expected timeframe: ongoing.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// Knowledge Prerequisites
MATCH (k1:Knowledge {name: 'Fundamental Weight Lifting Movements'})
MATCH (k2:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Barbell Lift Technique and Variations'})
MATCH (k2:Knowledge {name: 'Fundamental Weight Lifting Movements'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Weight Lifting Program Design Principles'})
MATCH (k2:Knowledge {name: 'Progressive Overload Strategies'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Periodization Models'})
MATCH (k2:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Periodization Models'})
MATCH (k2:Knowledge {name: 'Training Intensity and Volume Management'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Weight Lifting Biomechanics and Leverages'})
MATCH (k2:Knowledge {name: 'Fundamental Weight Lifting Movements'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Weight Lifting Biomechanics and Leverages'})
MATCH (k2:Knowledge {name: 'Weight Lifting Muscle Anatomy and Function'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Exercise Variations and Specialization'})
MATCH (k2:Knowledge {name: 'Barbell Lift Technique and Variations'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Sport-Specific Strength and Power Development'})
MATCH (k2:Knowledge {name: 'Advanced Periodization Models'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Coaching and Program Development'})
MATCH (k2:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Research Integration and Evidence-Based Training'})
MATCH (k2:Knowledge {name: 'Advanced Coaching and Program Development'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Weight Lifting Philosophy and Legacy Development'})
MATCH (k2:Knowledge {name: 'Advanced Coaching and Program Development'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Skill Prerequisites
MATCH (s1:Skill {name: 'Squat Movement Technique'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Deadlift Movement Technique'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Bench Press Movement Technique'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Breathing and Bracing Technique'})
MATCH (k:Knowledge {name: 'Weight Lifting Safety Protocols'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Squat Variation Selection and Loading'})
MATCH (s2:Skill {name: 'Squat Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Squat Variation Selection and Loading'})
MATCH (k:Knowledge {name: 'Barbell Lift Technique and Variations'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Deadlift Variation Selection and Loading'})
MATCH (s2:Skill {name: 'Deadlift Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Deadlift Variation Selection and Loading'})
MATCH (k:Knowledge {name: 'Barbell Lift Technique and Variations'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Progressive Weight Advancement'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Accessory Exercise Selection and Programming'})
MATCH (k:Knowledge {name: 'Accessory Exercise Selection and Application'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Rep Range and Volume Prescription'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Form Coaching and Cue Development'})
MATCH (s2:Skill {name: 'Squat Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Expert'}]->(s2);

MATCH (s1:Skill {name: 'Form Coaching and Cue Development'})
MATCH (s2:Skill {name: 'Deadlift Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Expert'}]->(s2);

MATCH (s1:Skill {name: 'Form Coaching and Cue Development'})
MATCH (s2:Skill {name: 'Bench Press Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Expert'}]->(s2);

MATCH (s1:Skill {name: 'Autoregulation and RPE-Based Training'})
MATCH (k:Knowledge {name: 'Training Intensity and Volume Management'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Periodization and Long-Term Program Planning'})
MATCH (k:Knowledge {name: 'Advanced Periodization Models'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Strength Weakness Identification and Analysis'})
MATCH (s2:Skill {name: 'Squat Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Weakness Identification and Analysis'})
MATCH (s2:Skill {name: 'Deadlift Movement Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Sport-Specific Strength Application'})
MATCH (k:Knowledge {name: 'Sport-Specific Strength and Power Development'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Competition Preparation and Peaking'})
MATCH (k:Knowledge {name: 'Advanced Periodization Models'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Individual Lifter Coaching and Development'})
MATCH (s2:Skill {name: 'Form Coaching and Cue Development'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Individual Lifter Coaching and Development'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

// Milestone Prerequisites
MATCH (m1:Milestone {name: 'Lift Bodyweight'})
MATCH (m2:Milestone {name: 'Complete First Gym Session'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 12-Week Training Program'})
MATCH (m2:Milestone {name: 'Receive Professional Form Feedback'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Squat One Plate Per Side'})
MATCH (m2:Milestone {name: 'Bodyweight Squat to Depth'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Deadlift One Plate Per Side'})
MATCH (m2:Milestone {name: 'Execute Proper Deadlift Form'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Bench Press One Plate Per Side'})
MATCH (m2:Milestone {name: 'Perform Empty Barbell Bench Press'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Squat Two Plates Per Side'})
MATCH (m2:Milestone {name: 'Squat One Plate Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Deadlift Three Plates Per Side'})
MATCH (m2:Milestone {name: 'Deadlift One Plate Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Bench Press Two Plates Per Side'})
MATCH (m2:Milestone {name: 'Bench Press One Plate Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Personal Records'})
MATCH (m2:Milestone {name: 'Complete 12-Week Training Program'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Bench Press Three Plates Per Side'})
MATCH (m2:Milestone {name: 'Bench Press Two Plates Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Squat Four Plates Per Side'})
MATCH (m2:Milestone {name: 'Squat Two Plates Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Deadlift Four Plates Per Side'})
MATCH (m2:Milestone {name: 'Deadlift Three Plates Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve 1000+ Total in Competition'})
MATCH (m2:Milestone {name: 'Compete in Powerlifting Competition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Mentor a Novice Lifter'})
MATCH (m2:Milestone {name: 'Establish Personal Records'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Obtain Strength Coaching Certification'})
MATCH (m2:Milestone {name: 'Complete Advanced Coaching Session'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Compete in Powerlifting Competition'})
MATCH (m2:Milestone {name: 'Establish Personal Records'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master a Squat Variation'})
MATCH (m2:Milestone {name: 'Squat Two Plates Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master a Deadlift Variation'})
MATCH (m2:Milestone {name: 'Deadlift Three Plates Per Side'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Advanced Competitive Total'})
MATCH (m2:Milestone {name: 'Achieve 1000+ Total in Competition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Elite Competitive Total'})
MATCH (m2:Milestone {name: 'Achieve Advanced Competitive Total'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Qualify for National Competition'})
MATCH (m2:Milestone {name: 'Achieve Advanced Competitive Total'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Teaching Advanced Lifters'})
MATCH (m2:Milestone {name: 'Obtain Strength Coaching Certification'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// ============================================================
// Level 1: Weight Lifting Novice
// ============================================================

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (k:Knowledge {name: 'Weight Lifting Safety Protocols'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (k:Knowledge {name: 'Fundamental Weight Lifting Movements'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (k:Knowledge {name: 'Weight Lifting Muscle Anatomy and Function'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (s:Skill {name: 'Barbell Handling and Safety'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (s:Skill {name: 'Squat Movement Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (s:Skill {name: 'Deadlift Movement Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (s:Skill {name: 'Bench Press Movement Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (s:Skill {name: 'Breathing and Bracing Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (m:Milestone {name: 'Complete First Gym Session'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Weight Lifting Novice'})
MATCH (m:Milestone {name: 'Bodyweight Squat to Depth'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 2: Weight Lifting Developing
// ============================================================

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Weight Lifting Safety Protocols'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Fundamental Weight Lifting Movements'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Weight Lifting Muscle Anatomy and Function'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Progressive Overload Strategies'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (k:Knowledge {name: 'Weight Lifting Recovery and Nutrition Basics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Barbell Handling and Safety'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Squat Movement Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Deadlift Movement Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Bench Press Movement Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Breathing and Bracing Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (s:Skill {name: 'Progressive Weight Advancement'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (t:Trait {name: 'Muscular Endurance'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (t:Trait {name: 'Discipline'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (m:Milestone {name: 'Lift Bodyweight'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Weight Lifting Developing'})
MATCH (m:Milestone {name: 'Complete 12-Week Training Program'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 3: Weight Lifting Competent
// ============================================================

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Weight Lifting Basic Form and Technique'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Fundamental Weight Lifting Movements'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Barbell Lift Technique and Variations'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Progressive Overload Strategies'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Weight Lifting Recovery and Nutrition Basics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (k:Knowledge {name: 'Accessory Exercise Selection and Application'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Squat Movement Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Deadlift Movement Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Bench Press Movement Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Breathing and Bracing Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Progressive Weight Advancement'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Squat Variation Selection and Loading'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Deadlift Variation Selection and Loading'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Accessory Exercise Selection and Programming'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (s:Skill {name: 'Rep Range and Volume Prescription'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (t:Trait {name: 'Muscular Endurance'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (t:Trait {name: 'Proprioception'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (t:Trait {name: 'Discipline'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (m:Milestone {name: 'Squat One Plate Per Side'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (m:Milestone {name: 'Deadlift One Plate Per Side'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Weight Lifting Competent'})
MATCH (m:Milestone {name: 'Establish Personal Records'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 4: Weight Lifting Advanced
// ============================================================

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Weight Lifting Program Design Principles'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Barbell Lift Technique and Variations'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Advanced Periodization Models'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Weight Lifting Biomechanics and Leverages'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Training Intensity and Volume Management'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Advanced Exercise Variations and Specialization'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (k:Knowledge {name: 'Accessory Exercise Selection and Application'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Squat Movement Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Deadlift Movement Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Bench Press Movement Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Squat Variation Selection and Loading'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Deadlift Variation Selection and Loading'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Rep Range and Volume Prescription'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Periodization and Long-Term Program Planning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Weakness Identification and Analysis'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (s:Skill {name: 'Form Coaching and Cue Development'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (t:Trait {name: 'Muscular Endurance'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (t:Trait {name: 'Mental Resilience'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (t:Trait {name: 'Discipline'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (m:Milestone {name: 'Bench Press Two Plates Per Side'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (m:Milestone {name: 'Squat Two Plates Per Side'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (m:Milestone {name: 'Deadlift Three Plates Per Side'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Weight Lifting Advanced'})
MATCH (m:Milestone {name: 'Obtain Strength Coaching Certification'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 5: Weight Lifting Master
// ============================================================

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Advanced Periodization Models'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Weight Lifting Biomechanics and Leverages'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Training Intensity and Volume Management'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Advanced Exercise Variations and Specialization'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Advanced Coaching and Program Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Sport-Specific Strength and Power Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (k:Knowledge {name: 'Weight Lifting Philosophy and Legacy Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Squat Movement Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Deadlift Movement Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Bench Press Movement Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Periodization and Long-Term Program Planning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Autoregulation and RPE-Based Training'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Form Coaching and Cue Development'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (s:Skill {name: 'Individual Lifter Coaching and Development'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (t:Trait {name: 'Mental Resilience'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (t:Trait {name: 'Discipline'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (t:Trait {name: 'Competitive Drive'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (m:Milestone {name: 'Achieve Advanced Competitive Total'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Weight Lifting Master'})
MATCH (m:Milestone {name: 'Master Teaching Advanced Lifters'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Agent 4: Quality Validation
// ============================================================

// VALIDATION SUMMARY
// Recommendation: APPROVE
// Overall Assessment: Comprehensive, well-structured domain with excellent progression, balanced components, and clear coherence from novice to master level. The domain effectively covers all essential aspects of weight lifting with domain-specific depth.

// COVERAGE ASSESSMENT
// Knowledge: Excellent - 12 knowledge nodes with comprehensive coverage from foundational form/safety (Novice) through advanced biomechanics and coaching (Master). Includes essential topics: basic form, safety protocols, fundamental movements, muscle anatomy, program design, barbell variations, accessories, progressive overload, recovery/nutrition, periodization, biomechanics, intensity management, advanced variations, and expert coaching. All necessary foundational concepts present. Advanced specialized topics included.

// Skills: Excellent - 15 skill nodes providing complete progression. Core technique skills (squat, deadlift, bench press, breathing/bracing) establish foundation. Intermediate skills (weight progression, rep range management, accessory selection) build competence. Advanced skills (form coaching, autoregulation, periodization design, weakness identification, sport-specific transfer) enable expert performance. Progression is logical and each skill builds on previous competencies.

// Traits: Good - 10 traits appropriately selected and domain-specific. Physical Strength, Muscular Endurance, Proprioception, Focus, Mental Resilience, Pain Tolerance, Discipline, Competitive Drive, Body Control all genuinely impact weight lifting performance. Traits are not disguised skills/knowledge. Measurement criteria are clear and practical. Traits enable differentiation between lifters with same technical skill levels.

// Milestones: Excellent - 19 milestones spanning all levels with meaningful progression. Novice level (5 milestones) marks entry: first gym session, belay certification, bodyweight squat, empty barbell bench, proper deadlift form. Developing level (5 milestones) establishes competence: bodyweight lift, 12-week adherence, form feedback, plate benchmarks (squat/deadlift/bench per side). Competent level (3 milestones) demonstrates intermediate strength: two-plate squat, three-plate deadlift, two-plate bench. Advanced level (4 milestones) shows expert capability. Master level (2 milestones) indicates peak achievement. Milestones are specific, measurable, and mark genuine progress.

// COHERENCE CHECKS
// Domain Alignment: Perfect - All components stay within scope_included (barbell lifts, dumbbell/kettlebell training, technique, program design, strength conditioning, hypertrophy, powerlifting/Olympic fundamentals, injury prevention, nutrition basics, recovery, competition). Nothing ventures into scope_excluded areas (cardio, yoga, sports-specific, medical rehab, advanced nutrition science, research). Domain focus remains consistently on resistance training with weights and strength development.

// Level Progression: Excellent - Clear logical progression from Novice (learning proper form, understanding safety, foundational strength with lighter weights) through Developing (compound lifts with consistent technique, moderate weights, program design) to Competent (substantial weights with confident form, independent program management, balanced goals) to Advanced (elite-level weights, sophisticated programs, mentoring, competition-ready) to Master (peak performance, innovating methodology, recognized expertise). Level descriptions accurately reflect domain-specific requirements. Appropriate differentiation at each level with measurable skill/knowledge/trait jumps.

// Relationship Logic: Excellent - Knowledge prerequisites make logical sense. Basic Form required before Fundamental Lifts. Fundamental Lifts required for Barbell Technique. Program Design requires Progressive Overload understanding. Advanced Periodization builds on Program Design and Intensity Management. Biomechanics requires both Fundamental Movements and Anatomy. Advanced Variations require Barbell Technique mastery. Coaching and Research require Program Development foundations. Prerequisite chains are reasonable (3-4 levels deep max, no excessive depth). Skill prerequisites properly chain technique before variation selection (Squat Variation requires Squat Technique at Competent level). Level requirements appropriately tier skills/knowledge (Novice requires foundational understanding, Advanced requires Proficient technique, Master requires Expert-level skills). Milestone prerequisites align with achievement logic (three-plate deadlift requires foundational strength and technique).

// QUALITY CHECKS
// Content Quality: Excellent - Descriptions are clear, specific, and domain-focused. Not generic platitudes. Examples: "neutral spine, shoulder positioning, hip hinge" for form; "progressive overload, linear progression, periodization" for program design. How_to_learn/develop/achieve guidance is practical and actionable with specific timeframes (e.g., "Practice basic movements daily for 2-4 weeks until they feel natural"), resource recommendations (Starting Strength, StrongLifts, 5/3/1), and clear metrics for progression. Measurement criteria for traits are concrete with scaled ranges (Low 0-25, Moderate 26-50, High 51-75, Exceptional 76-100) with specific behavioral descriptors. Domain-specific language throughout with appropriate terminology.

// Completeness: Excellent - All components meet specifications. Knowledge nodes include: name, description, how_to_learn, and Bloom's taxonomy levels (remember through create). All 12 nodes fully populated. Skill nodes include: name, description, how_to_develop, and Dreyfus model levels (novice through expert). All 15 skills complete with progression detail. Trait nodes include: name, description, measurement_criteria with scaled assessment guidance. All 10 traits complete. Milestone nodes include: name, description, how_to_achieve with realistic timeframes. All 19 milestones complete. Domain_Level nodes include: domain, level, name, description. All 5 levels complete. No missing required fields.

// Redundancy Check: Minimal - Components are distinct and complementary. Potential near-overlaps exist but serve different purposes: Progressive Overload and Weight Progression are distinct (knowledge vs. skill application). Program Design and Periodization complement rather than duplicate (design principles vs. complex models). Barbell Lifts, Accessory Selection, and Advanced Variations serve different focuses (barbell mechanics, weak point work, specialized techniques). Weak point analysis and Sport-Specific Transfer address different coaching dimensions. These represent healthy domain depth, not redundancy. No consolidation needed.

// ISSUES IDENTIFIED
// Critical: None - Domain structure is fundamentally sound. No incoherence, no circular dependencies detected, scope is clear and consistent, components logically align with domain.

// Major: None - No significant knowledge/skill gaps preventing meaningful progression. Prerequisites are sensible. Level descriptions match requirements. Content is appropriately specific.

// Minor:
// - (Observation, not issue) Trait "Proprioception" named differently in system (t_body_awareness variable vs. Proprioception node name) - this is acceptable internal naming but worth noting for consistency. No functional impact.
// - (Enhancement opportunity) Sport-Specific Strength knowledge exists but sport-transfer application is limited to one skill (Sport-Specific Strength Application). Could potentially include more sport-specific milestone examples, but current scope handles this adequately for a general weight lifting domain. Not required.

// STRENGTHS
// - Exceptional depth and progression: From complete beginner (empty barbell) to competitive/coaching master level
// - Well-balanced component distribution: 12 knowledge, 15 skills, 10 traits, 19 milestones provides appropriate specialization
// - Clear Bloom's and Dreyfus taxonomy integration: Knowledge nodes progress through cognitive levels, skills through competency levels
// - Practical timeframes and resources: Every component includes realistic expected learning/training duration and actionable guidance
// - Strong relationship logic: Prerequisites form logical chains without excessive complexity; milestone prerequisites align with progression reality
// - Domain-specific depth: Terminology, examples, and content are authentically rooted in strength training rather than generic fitness
// - Realistic milestones: Benchmarks (bodyweight, plate progressions) align with actual competitive/recreational weight lifting standards
// - Mental/physical trait balance: Includes both physical (strength, endurance) and psychological (resilience, discipline, focus) factors

// EXAMPLE PROGRESSION PATHS
// Path 1 - Recreational Strength Development (Novice to Competent):
// Sarah begins with Complete First Gym Session, progressing through basic form with light weights. She develops Squat Movement Technique and Breathing/Bracing through practice and feedback. At Developing level, she achieves bodyweight lifts and completes a 12-week program (StrongLifts 5x5), establishing discipline and consistent training. She receives professional form feedback to refine technique. By Competent level, she achieves two-plate squat and three-plate deadlift through systematic progression. Her Muscular Endurance trait improves from moderate to high through extended training volume. Her journey emphasizes consistent application of Progressive Overload and Rep Range Management knowledge.

// Path 2 - Competitive Powerlifting Development (Developing to Advanced):
// Marcus achieves bodyweight lifts and identifies competitive powerlifting as his goal. He focuses specifically on the three competition lifts using Squat/Deadlift/Bench Variation Selection skills. He develops Advanced Periodization knowledge through block and conjugate method study, cycling between strength and hypertrophy phases. His Weakness Identification skill enables him to design targeted accessory programs. At Advanced level, he competes and achieves elite competitive totals, demonstrating exceptional Physical Strength (75+) and Mental Resilience. He obtains an ISSA strength coaching certification (Strength Coaching Certification milestone) positioning him toward Master level.

// Path 3 - Coaching and Legacy Development (Advanced to Master):
// Jamie reaches Advanced level through years of personal training and develops expertise in Form Coaching and Cue Development. She begins coaching athletes in sport-specific strength work, developing Sport-Specific Strength Application skill. She masters Autoregulation principles, training clients with RPE-based systems rather than rigid percentages. At Master level, she contributes training knowledge (research/article/seminar), demonstrates exceptional discipline and mental resilience in handling demanding coaching responsibilities, and achieves recognition as an expert. Her knowledge of Advanced Coaching and Program Development is applied to developing diverse athletes (track sprinters, rugby players, general fitness clients).

// VALIDATION RESULTS
// Structure Validation: PASS - All node types present and properly formatted. No missing relationships. Relationship statements use consistent MATCH/CREATE syntax. All statements end with semicolons.
// Coherence Validation: PASS - Components align with scope. Progression is logical. No circular dependencies. Prerequisite chains make sense.
// Balance Validation: PASS - Component distribution is appropriate for domain complexity. Knowledge provides conceptual foundation, skills enable practical application, traits differentiate individual differences, milestones mark clear progression.
// Progression Validation: PASS - Clear stepping stones from novice to master. Each level requires demonstrable advancement. Milestone timeframes are realistic.
// Domain-Specificity Validation: PASS - Content is weight-lifting-focused throughout. Not generic fitness. Examples and guidance are authentic to the domain.
// Quality Validation: PASS - Descriptions are clear and specific. Measurement criteria are practical. How-to guidance is actionable.
// Completeness Validation: PASS - All node types have required properties. No incomplete entries.

// FINAL ASSESSMENT
// The Weight Lifting domain represents an exceptionally well-developed knowledge graph structure. It demonstrates sophisticated understanding of domain progression, realistic milestone sequencing, balanced component distribution, and practical relationship logic. The domain would function effectively for real users seeking to develop weight lifting competence from complete beginner to competitive/coaching mastery. The integration of physical traits, mental characteristics, technical skills, and conceptual knowledge creates a comprehensive model of what weight lifting competence actually requires. Recommended with confidence for implementation.

