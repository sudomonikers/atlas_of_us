// Domain: Calisthenics
// Generated: 2025-11-16
// Description: Bodyweight strength training and movement practice focused on using one's own body weight for resistance to develop strength, flexibility, and control

// ============================================================
// DOMAIN: Calisthenics
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Calisthenics',
  description: 'Bodyweight strength training and movement practice focused on using one\'s own body weight for resistance to develop strength, flexibility, and control. Encompasses fundamental movement patterns, progressive strength techniques, dynamic flexibility, and mindful body awareness.',
  level_count: 5,
  created_date: date(),
  scope_included: ['basic bodyweight exercises (push-ups, pull-ups, squats, dips)', 'progressive strength training techniques (progression variations, tempo manipulation, isometric holds)', 'dynamic flexibility and mobility work', 'body control and coordination practices', 'advanced movement skills (handstands, planches, muscle-ups)', 'injury prevention and movement fundamentals', 'calisthenics programming and periodization', 'mental resilience and discipline in training'],
  scope_excluded: ['weightlifting with external equipment (separate domain - barbells, dumbbells)', 'gymnastics rings and apparatus (separate domain - sport gymnastics focus)', 'martial arts training (separate domain - combat applications)', 'cardio and aerobic conditioning as primary focus (separate domain)', 'sports performance training (separate domain - sport-specific)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Calisthenics Novice',
  description: 'Learning fundamental bodyweight movement patterns with proper form. Can perform basic exercises (assisted push-ups, wall push-ups, modified squats) with inconsistent technique. Building initial body awareness and establishing consistent practice habits.'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Calisthenics Developing',
  description: 'Demonstrating reliable form on standard bodyweight exercises (push-ups, pull-ups, squats). Understanding basic progression strategies and can apply variations to increase difficulty. Developing functional strength and beginning to explore advanced movement foundations.'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Calisthenics Competent',
  description: 'Executing advanced bodyweight exercises with consistent control (muscle-ups, L-sits, deeper pistol squats). Designing simple training programs and understanding progression timelines. Demonstrating strength, flexibility, and body control appropriate for most life activities.'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Calisthenics Advanced',
  description: 'Mastering highly difficult techniques (handstand holds, planche variations, one-arm pull-ups). Creating periodized training programs with strategic progression. Mentoring others and optimizing training for personal goals and injury prevention.'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Calisthenics Master',
  description: 'Operating at exceptional levels of strength, control, and movement quality (consistent handstand skills, advanced planche progressions, complex movement combinations). Contributing innovations to calisthenics methodology and inspiring others through embodied mastery.'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Calisthenics'})
MATCH (level1:Domain_Level {name: 'Calisthenics Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Calisthenics'})
MATCH (level2:Domain_Level {name: 'Calisthenics Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Calisthenics'})
MATCH (level3:Domain_Level {name: 'Calisthenics Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Calisthenics'})
MATCH (level4:Domain_Level {name: 'Calisthenics Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Calisthenics'})
MATCH (level5:Domain_Level {name: 'Calisthenics Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge - Basic body mechanics and terminology
MERGE (k_basic_bodyweight:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
ON CREATE SET k_basic_bodyweight.description = 'Fundamental understanding of how bodyweight exercises work, including basic leverage, body positioning, and simple anatomical awareness. Covers the core principles needed to safely perform standard calisthenics movements.',
              k_basic_bodyweight.how_to_learn = 'Start with instructional videos focusing on form fundamentals. Practice basic movements (push-ups, squats, planks) while watching yourself in a mirror to build body awareness. Read beginner calisthenics guides. Expected time: 2-3 weeks of consistent practice.',
              k_basic_bodyweight.remember_level = 'Recall basic anatomical terms (chest, back, legs, arms) and the names of fundamental movements (push-up, squat, plank, pull-up)',
              k_basic_bodyweight.understand_level = 'Explain how basic bodyweight exercises engage different muscle groups. Describe the difference between assisted and unassisted variations.',
              k_basic_bodyweight.apply_level = 'Perform basic exercises with correct fundamental form. Select appropriate exercise variations for your current fitness level.',
              k_basic_bodyweight.analyze_level = 'Break down movements to identify which muscles are being engaged and why certain form cues matter for each exercise.',
              k_basic_bodyweight.evaluate_level = 'Assess your own form using video analysis or mirror feedback. Identify form corrections needed in your current training.',
              k_basic_bodyweight.create_level = 'Design a simple workout routine using basic movements at progressions appropriate to your level.';

MERGE (k_proper_form:Knowledge {name: 'Calisthenics Proper Form and Technique'})
ON CREATE SET k_proper_form.description = 'Detailed technical knowledge of correct form for fundamental calisthenics exercises including push-ups, pull-ups, squats, dips, and planks. Covers body alignment, range of motion, breathing patterns, and common form errors.',
              k_proper_form.how_to_learn = 'Study detailed video tutorials from respected calisthenics coaches. Record yourself performing exercises and compare to tutorial videos. Work with a training partner who can observe and correct your form. Expected time: 4-6 weeks to establish proper patterns.',
              k_proper_form.remember_level = 'Recall the key form checkpoints for each basic exercise (e.g., shoulder alignment in push-ups, grip width in pull-ups, knee tracking in squats)',
              k_proper_form.understand_level = 'Explain why proper form matters for safety and effectiveness. Describe the anatomical reasons behind specific form cues.',
              k_proper_form.apply_level = 'Execute fundamental exercises with proper form consistently. Adjust your form based on feedback from video or partner observation.',
              k_proper_form.analyze_level = 'Identify form errors in your own training and in others\' movements. Explain what specific form correction would improve an exercise.',
              k_proper_form.evaluate_level = 'Assess whether exercise form is safe and effective given individual anatomy variations. Judge the quality of form in complex movement patterns.',
              k_proper_form.create_level = 'Develop personalized form cues and progressions that account for your specific biomechanics and limitations.';

MERGE (k_progression_strategies:Knowledge {name: 'Basic Progression Strategies'})
ON CREATE SET k_progression_strategies.description = 'Understanding how to systematically make exercises harder over time through variations, volume increases, tempo changes, and reduced assistance. Covers beginner to intermediate progression concepts.',
              k_progression_strategies.how_to_learn = 'Study progression ladders for basic movements (e.g., push-up progressions from wall to full). Track your own progress as you move through progressions. Read introductory calisthenics programming resources. Expected time: 3-4 weeks to understand core concepts.',
              k_progression_strategies.remember_level = 'Recall the progression sequence for basic exercises (e.g., wall push-ups, incline push-ups, full push-ups, explosive push-ups)',
              k_progression_strategies.understand_level = 'Explain why progressions work and how to know when you\'re ready to advance to the next variation. Describe different progression methods (rep increases, tempo changes, leverage changes).',
              k_progression_strategies.apply_level = 'Select appropriate progressions for your current level. Implement systematic progression in your own training with proper timing.',
              k_progression_strategies.analyze_level = 'Analyze why certain progressions are sequenced in a particular order. Identify which progression method is most appropriate for different goals.',
              k_progression_strategies.evaluate_level = 'Assess whether a progression sequence is well-designed and effective for your goals. Judge the difficulty of progressions relative to your fitness level.',
              k_progression_strategies.create_level = 'Design custom progression sequences for exercises, accounting for your weaknesses and training goals.';

MERGE (k_bodyweight_terminology:Knowledge {name: 'Calisthenics Terminology and Vocabulary'})
ON CREATE SET k_bodyweight_terminology.description = 'Comprehensive vocabulary of calisthenics-specific terms including exercise names, progression terminology, anatomical terms, and training concepts. Enables clear communication about movements and training.',
              k_bodyweight_terminology.how_to_learn = 'Study glossaries in calisthenics books and online resources. Watch instructional videos and take notes on terminology used. Participate in calisthenics communities and discussions. Expected time: Ongoing, 1-2 weeks for core terminology.',
              k_bodyweight_terminology.remember_level = 'Recall names of fundamental exercises (push-ups, pull-ups, squats, dips, planks) and basic progression terms (assisted, progressions, reps, sets)',
              k_bodyweight_terminology.understand_level = 'Explain what different calisthenics terms mean and how they relate to training concepts. Understand the difference between similar terms.',
              k_bodyweight_terminology.apply_level = 'Use correct terminology when discussing your training and following workout programs. Communicate clearly about exercises with others.',
              k_bodyweight_terminology.analyze_level = 'Distinguish between different types of exercises and training methods using precise terminology. Connect terminology to underlying training principles.',
              k_bodyweight_terminology.evaluate_level = 'Judge the accuracy of terminology used in training resources and communities. Assess whether terminology choices are appropriate for the audience.',
              k_bodyweight_terminology.create_level = 'Develop clear explanations of exercises and concepts using proper terminology. Create training resources that precisely define and use calisthenics terms.';

// Core Knowledge - Intermediate concepts and systems
MERGE (k_muscle_groups:Knowledge {name: 'Muscle Groups and Anatomy'})
ON CREATE SET k_muscle_groups.description = 'Understanding the major muscle groups engaged in calisthenics movements, their functions, and how different exercises target specific muscles. Includes anatomy relevant to program design and movement selection.',
              k_muscle_groups.how_to_learn = 'Study anatomy resources focusing on skeletal muscles and movement. Practice exercises while mentally noting which muscles feel engaged. Take anatomy courses or read anatomy textbooks. Expected time: 4-6 weeks to develop functional anatomy knowledge.',
              k_muscle_groups.remember_level = 'Recall major muscle groups (chest, back, shoulders, arms, core, legs) and which exercises primarily engage each group',
              k_muscle_groups.understand_level = 'Explain how different muscles work together to create movement. Describe which muscles are primary movers versus stabilizers in common exercises.',
              k_muscle_groups.apply_level = 'Select exercises strategically to target specific muscle groups. Design workouts with balanced muscle group engagement.',
              k_muscle_groups.analyze_level = 'Analyze movement patterns to identify which muscles are being engaged and how muscles interact during complex movements.',
              k_muscle_groups.evaluate_level = 'Assess whether your training program is adequately targeting all major muscle groups. Evaluate exercise selection for muscular balance.',
              k_muscle_groups.create_level = 'Design specialized training programs targeting specific muscle groups or addressing imbalances.';

MERGE (k_leverage_principles:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
ON CREATE SET k_leverage_principles.description = 'Understanding how leverage affects exercise difficulty in calisthenics. Covers how body position changes affect resistance, moment arms, and exercise difficulty. Essential for understanding progressions.',
              k_leverage_principles.how_to_learn = 'Study physics resources on levers and mechanical advantage. Practice different exercise variations and observe how small position changes affect difficulty. Read calisthenics resources explaining progression mechanics. Expected time: 4-5 weeks.',
              k_leverage_principles.remember_level = 'Recall how changing body positioning affects exercise difficulty (e.g., knee bend in push-ups reduces difficulty, fully extended increases it)',
              k_leverage_principles.understand_level = 'Explain why certain position changes make exercises harder or easier. Describe the concept of mechanical advantage as it applies to bodyweight exercises.',
              k_leverage_principles.apply_level = 'Use leverage understanding to select exercise variations that match your current strength level. Modify exercises using leverage changes.',
              k_leverage_principles.analyze_level = 'Analyze how different body positions change leverage and resistance in any movement. Break down the mechanical advantage of different progressions.',
              k_leverage_principles.evaluate_level = 'Assess whether leverage-based progressions are appropriate for your goals. Judge the difficulty differences between variations.',
              k_leverage_principles.create_level = 'Design novel exercise variations using leverage principles to create specific difficulty levels.';

MERGE (k_breathing_technique:Knowledge {name: 'Breathing Technique During Exercise'})
ON CREATE SET k_breathing_technique.description = 'Understanding proper breathing patterns during calisthenics exercises, including timing, intensity, and how breathing affects performance and safety. Covers basics through advanced breathing strategies.',
              k_breathing_technique.how_to_learn = 'Practice coordinating breathing with specific movements. Watch instructional videos on breathing patterns. Experiment with different breathing approaches and note performance differences. Expected time: 3-4 weeks to establish good habits.',
              k_breathing_technique.remember_level = 'Recall basic breathing patterns (exhale during exertion, inhale during easier phases) and the risks of breath holding',
              k_breathing_technique.understand_level = 'Explain why proper breathing matters for safety and performance. Describe how breathing affects core stability and power output.',
              k_breathing_technique.apply_level = 'Execute movements with coordinated breathing patterns. Adjust breathing based on exercise difficulty and intensity.',
              k_breathing_technique.analyze_level = 'Identify breathing errors in your own training or in others\' movements. Analyze how breathing pattern changes affect performance.',
              k_breathing_technique.evaluate_level = 'Assess whether breathing patterns are appropriate for specific exercises and goals. Judge the safety implications of different breathing approaches.',
              k_breathing_technique.create_level = 'Develop personalized breathing strategies for complex or high-intensity movements.';

MERGE (k_recovery_concepts:Knowledge {name: 'Rest and Recovery Principles'})
ON CREATE SET k_recovery_concepts.description = 'Understanding how recovery works, including rest days, sleep, nutrition timing, and the relationship between training stress and adaptation. Covers how to optimize recovery for steady progress.',
              k_recovery_concepts.how_to_learn = 'Read sports science resources on training adaptation and recovery. Experiment with different recovery protocols in your own training. Track your progress and recovery quality. Expected time: 4-5 weeks to develop understanding.',
              k_recovery_concepts.remember_level = 'Recall that muscles grow during rest, not during training. Remember basic recovery needs (sleep, rest days, nutrition)',
              k_recovery_concepts.understand_level = 'Explain the physiology of muscle adaptation and why recovery is necessary for progress. Describe how overtraining can impede progress.',
              k_recovery_concepts.apply_level = 'Structure your training with adequate rest days. Implement basic recovery practices (sleep, nutrition, hydration) consistently.',
              k_recovery_concepts.analyze_level = 'Analyze your training stress and recovery resources to assess balance. Break down the factors affecting your individual recovery needs.',
              k_recovery_concepts.evaluate_level = 'Assess whether your current recovery practices are sufficient for your training volume. Judge the quality of your recovery strategy.',
              k_recovery_concepts.create_level = 'Design personalized recovery protocols accounting for your training style, schedule, and individual needs.';

MERGE (k_pain_vs_soreness:Knowledge {name: 'Distinguishing Pain and Soreness'})
ON CREATE SET k_pain_vs_soreness.description = 'Understanding the difference between safe muscle soreness (DOMS) and potentially harmful pain. Covers red flags for injury, when to modify training, and self-assessment skills.',
              k_pain_vs_soreness.how_to_learn = 'Read injury prevention resources from calisthenics coaches. Pay careful attention to feedback from your own body during training. Discuss experiences with experienced practitioners. Expected time: 3-4 weeks.',
              k_pain_vs_soreness.remember_level = 'Recall the characteristics of muscle soreness versus joint or injury-related pain. Remember warning signs that should stop a set.',
              k_pain_vs_soreness.understand_level = 'Explain why muscle soreness occurs and why it\'s different from injury pain. Describe how to self-assess whether pain is concerning.',
              k_pain_vs_soreness.apply_level = 'Modify your training based on pain feedback. Stop exercises when experiencing potentially harmful pain.',
              k_pain_vs_soreness.analyze_level = 'Analyze your training for patterns related to pain or excessive soreness. Identify specific movements or intensities that cause problems.',
              k_pain_vs_soreness.evaluate_level = 'Assess whether your current pain levels are normal or concerning. Judge whether you should modify exercises or seek professional help.',
              k_pain_vs_soreness.create_level = 'Develop a personal pain-tracking system to monitor trends and identify problem areas in your training.';

// Advanced Knowledge - Complex systems and analysis
MERGE (k_periodization:Knowledge {name: 'Periodized Training Planning'})
ON CREATE SET k_periodization.description = 'Understanding systematic training planning across weeks and months, including macrocycles, mesocycles, and microcycles. Covers how to structure training phases for continuous progress while managing fatigue.',
              k_periodization.how_to_learn = 'Study sports science resources on periodization theory. Analyze periodized training programs and understand their structure. Implement periodization in your own training and observe results. Expected time: 6-8 weeks.',
              k_periodization.remember_level = 'Recall different periodization phases and their general purposes (preparation, strength building, peak performance, recovery)',
              k_periodization.understand_level = 'Explain why periodization prevents plateaus and manages fatigue. Describe how macrocycles, mesocycles, and microcycles work together.',
              k_periodization.apply_level = 'Apply periodization principles to structure your own training across multiple months. Plan progression strategically within periodized phases.',
              k_periodization.analyze_level = 'Analyze training programs to identify periodization structure and rationale. Break down how different phases support overall training goals.',
              k_periodization.evaluate_level = 'Assess whether a periodized plan is appropriate for your goals and schedule. Judge the effectiveness of periodization strategies.',
              k_periodization.create_level = 'Design personalized periodized training plans for specific goals and timelines.';

MERGE (k_volume_intensity_balance:Knowledge {name: 'Volume and Intensity Balance'})
ON CREATE SET k_volume_intensity_balance.description = 'Understanding the relationship between training volume (total reps/sets) and intensity (difficulty of individual sets), and how to balance them for optimal results. Covers periodized intensity management.',
              k_volume_intensity_balance.how_to_learn = 'Study training theory resources on volume and intensity relationships. Track your own training volume and intensity while monitoring progress and fatigue. Experiment with different balances. Expected time: 6-8 weeks.',
              k_volume_intensity_balance.remember_level = 'Recall the trade-off between high volume and high intensity. Remember that high volume requires lower intensity to be sustainable.',
              k_volume_intensity_balance.understand_level = 'Explain how volume and intensity interact to drive adaptation. Describe appropriate volume and intensity levels for different training phases.',
              k_volume_intensity_balance.apply_level = 'Structure your training with appropriate volume and intensity for your current phase. Adjust based on fatigue and recovery quality.',
              k_volume_intensity_balance.analyze_level = 'Analyze your training to identify volume and intensity levels. Break down how phase-specific goals should influence volume/intensity choices.',
              k_volume_intensity_balance.evaluate_level = 'Assess whether your current volume and intensity balance is optimal for your goals. Judge whether you\'re under- or over-training.',
              k_volume_intensity_balance.create_level = 'Design training phases with strategically balanced volume and intensity for specific objectives.';

MERGE (k_movement_quality:Knowledge {name: 'Movement Quality and Efficiency'})
ON CREATE SET k_movement_quality.description = 'Advanced understanding of quality movement including minimal energy waste, optimal sequencing of muscle activation, and efficiency in complex movements. Covers refinement of technique beyond basics.',
              k_movement_quality.how_to_learn = 'Study movement analysis resources and video your training. Compare your movements to skilled practitioners\' movements. Work with experienced coaches or training partners. Expected time: 8-12 weeks.',
              k_movement_quality.remember_level = 'Recall the principles of efficient movement (eliminate unnecessary motion, smooth transitions, optimal sequencing)',
              k_movement_quality.understand_level = 'Explain why movement efficiency matters for performance and injury prevention. Describe how muscle activation sequencing affects power output.',
              k_movement_quality.apply_level = 'Execute movements with increased efficiency. Identify and eliminate wasted motion in your exercises.',
              k_movement_quality.analyze_level = 'Analyze your own movement videos to identify efficiency issues. Break down complex movements to understand optimal sequencing.',
              k_movement_quality.evaluate_level = 'Assess the quality and efficiency of your movements relative to advanced practitioners. Judge whether form refinements would improve your training.',
              k_movement_quality.create_level = 'Develop advanced form cues and practice protocols to achieve exceptional movement quality.';

// Specialized Knowledge - Master level concepts
MERGE (k_advanced_leverage:Knowledge {name: 'Advanced Leverage Manipulation and Variation Design'})
ON CREATE SET k_advanced_leverage.description = 'Expert-level understanding of how to create infinite exercise variations through sophisticated leverage manipulation. Covers designing progressions for advanced skills like handstands and planches.',
              k_advanced_leverage.how_to_learn = 'Study advanced calisthenics resources and work with experienced coaches. Analyze progressions for complex skills. Experiment with creating and testing novel progressions. Expected time: 12+ weeks of study and practice.',
              k_advanced_leverage.remember_level = 'Recall the principles underlying advanced progressions and how they apply to different movement patterns',
              k_advanced_leverage.understand_level = 'Explain how sophisticated leverage changes create appropriate difficulty progressions for highly advanced skills. Describe how to design progressions for movements with no standard progression sequence.',
              k_advanced_leverage.apply_level = 'Create appropriate progression sequences for advanced skills. Design custom exercises matching specific strength or skill gaps.',
              k_advanced_leverage.analyze_level = 'Analyze why specific progressions are sequenced in sophisticated ways. Break down the leverage principles underlying advanced variations.',
              k_advanced_leverage.evaluate_level = 'Assess whether leverage-based progression designs are optimal for specific goals. Judge the appropriateness of variations for different practitioners.',
              k_advanced_leverage.create_level = 'Design novel progression systems for advanced skills and create training methodologies for teaching them to others.';

MERGE (k_biomechanical_analysis:Knowledge {name: 'Biomechanical Analysis of Movement'})
ON CREATE SET k_biomechanical_analysis.description = 'Deep understanding of biomechanics as applied to calisthenics, including force analysis, joint angles, stability considerations, and injury prevention through mechanical analysis.',
              k_biomechanical_analysis.how_to_learn = 'Study biomechanics textbooks with focus on human movement. Take formal biomechanics courses if available. Analyze movements using slow-motion video and biomechanical principles. Expected time: 12-16 weeks.',
              k_biomechanical_analysis.remember_level = 'Recall key biomechanical concepts (moment arms, force couples, stability requirements) and how they apply to calisthenics',
              k_biomechanical_analysis.understand_level = 'Explain the biomechanical basis for exercise difficulty and safety concerns. Describe how individual anatomy influences optimal movement patterns.',
              k_biomechanical_analysis.apply_level = 'Use biomechanical analysis to assess and correct movement patterns. Modify exercises based on individual anatomical considerations.',
              k_biomechanical_analysis.analyze_level = 'Perform detailed biomechanical analysis of complex movements. Identify biomechanical limitations and how to address them.',
              k_biomechanical_analysis.evaluate_level = 'Assess safety and efficiency of movements from a biomechanical perspective. Judge whether modifications are biomechanically justified.',
              k_biomechanical_analysis.create_level = 'Design exercise programs with sophisticated biomechanical understanding, addressing individual anatomical variations and injury history.';

MERGE (k_coaching_methodology:Knowledge {name: 'Calisthenics Coaching and Teaching Methodology'})
ON CREATE SET k_coaching_methodology.description = 'Understanding how to teach calisthenics to others effectively, including communicating movement concepts, designing individualized progressions, motivating learners, and adapting teaching to different learning styles.',
              k_coaching_methodology.how_to_learn = 'Study coaching education resources and practice teaching others. Take coaching certification courses if available. Get feedback from people you teach. Expected time: 12-16 weeks of teaching and refinement.',
              k_coaching_methodology.remember_level = 'Recall fundamental coaching principles and common communication approaches for movement instruction',
              k_coaching_methodology.understand_level = 'Explain how different people learn movement skills differently. Describe common misconceptions and how to address them.',
              k_coaching_methodology.apply_level = 'Teach calisthenics to others with clear progressions and corrections. Adapt your teaching approach to individual learners.',
              k_coaching_methodology.analyze_level = 'Analyze your coaching effectiveness and identify areas for improvement. Break down complex concepts into teachable components.',
              k_coaching_methodology.evaluate_level = 'Assess whether your teaching approaches are working for your students. Judge the quality of progressions you design for others.',
              k_coaching_methodology.create_level = 'Develop sophisticated coaching methodologies and teaching systems. Create original teaching resources and training programs.';

MERGE (k_individual_programming:Knowledge {name: 'Individualized Programming and Assessment'})
ON CREATE SET k_individual_programming.description = 'Expert ability to assess individual needs, limitations, and goals, then design highly customized training programs. Covers assessment protocols, identifying bottlenecks, and adapting training responsively.',
              k_individual_programming.how_to_learn = 'Study assessment protocols used by advanced coaches. Work with diverse training partners and design programs for them. Get feedback on your program design. Expected time: 12+ weeks.',
              k_individual_programming.remember_level = 'Recall key assessment parameters and how to identify limiting factors in individual training',
              k_individual_programming.understand_level = 'Explain how individual differences affect training program design. Describe how to identify which limiters are most important to address.',
              k_individual_programming.apply_level = 'Assess individuals and design customized programs addressing their specific needs and limitations.',
              k_individual_programming.analyze_level = 'Analyze individual training responses and identify what\'s working and what isn\'t. Break down complex problems to identify root causes.',
              k_individual_programming.evaluate_level = 'Assess the quality of individualized programs. Judge whether program design is optimal given individual circumstances.',
              k_individual_programming.create_level = 'Create sophisticated, highly individualized training programs that account for multiple interacting factors and constraints.';

MERGE (k_innovation_methodology:Knowledge {name: 'Calisthenics Innovation and Method Development'})
ON CREATE SET k_innovation_methodology.description = 'Understanding how to develop new training methods, test their effectiveness, and contribute innovations to the broader calisthenics field. Covers systematic experimentation and knowledge creation.',
              k_innovation_methodology.how_to_learn = 'Study how calisthenics methods have evolved and been improved. Experiment systematically with training approaches. Document results and share findings. Expected time: 16+ weeks of ongoing experimentation.',
              k_innovation_methodology.remember_level = 'Recall the history of calisthenics method development and major innovations',
              k_innovation_methodology.understand_level = 'Explain how methods are tested and validated. Describe the process of systematic experimentation and knowledge development.',
              k_innovation_methodology.apply_level = 'Experiment systematically with training approaches. Implement evidence-based improvements from your own practice.',
              k_innovation_methodology.analyze_level = 'Analyze training methods to identify opportunities for improvement. Break down what makes certain methods effective.',
              k_innovation_methodology.evaluate_level = 'Assess the effectiveness of new methods through systematic observation and analysis. Judge whether proposed innovations are improvements.',
              k_innovation_methodology.create_level = 'Develop novel training methods and methodologies. Create systematic frameworks for testing and refining calisthenics approaches.';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Push-Up Progression Skill
MERGE (s_push_up_form:Skill {name: 'Push-Up Form Mastery'})
ON CREATE SET s_push_up_form.description = 'The ability to perform push-ups with proper form across progressive variations, from wall push-ups to full standard push-ups and advanced variations. Essential foundation for upper body pressing strength.',
              s_push_up_form.how_to_develop = 'Start with wall or incline push-ups and focus on form before progression. Record yourself and compare to tutorial videos. Practice 3-4 times per week with progressions matched to your strength level. Expected time: 4-8 weeks to achieve solid push-up form, 3-6 months for advanced variations.',
              s_push_up_form.novice_level = 'Can perform wall or incline push-ups with shaky form. Elbows flare excessively. Body alignment is inconsistent. To progress: Practice basic form cues on easier variations until movement is smooth.',
              s_push_up_form.advanced_beginner_level = 'Performing knee push-ups or assisted full push-ups with mostly correct form. Beginning to maintain body alignment throughout. To progress: Work toward full push-ups with consistent form.',
              s_push_up_form.competent_level = 'Executing full push-ups with consistent proper form (straight body line, controlled tempo, full range of motion). Can perform 10-20 quality push-ups. To progress: Explore tempo changes and advanced variations.',
              s_push_up_form.proficient_level = 'Full push-ups are smooth and effortless. Can easily transition between variations. Naturally maintains optimal form without conscious effort. To progress: Master advanced variations like archer, diamond, or explosive push-ups.',
              s_push_up_form.expert_level = 'Exceptional control across all push-up variations with perfect form in any variation. Can perform advanced progressions with ease and teaches proper form to others effectively.';

// Pull-Up Foundation Skill
MERGE (s_pull_up_strength:Skill {name: 'Pull-Up Development'})
ON CREATE SET s_pull_up_strength.description = 'Building pulling strength from hanging progressions through assisted pull-ups to unassisted pull-ups and advanced variations. Fundamental upper body pulling strength skill.',
              s_pull_up_strength.how_to_develop = 'Start with dead hangs and scapular pulls. Progress to assisted pull-ups with resistance bands or machines. Work on negative pull-ups for 2-3 weeks, then attempt positive pull-ups. Expected time: 2-4 months to achieve first pull-up from zero baseline, 6-12 weeks if you have some pulling strength.',
              s_pull_up_strength.novice_level = 'Cannot perform pull-ups. Can barely hang from a bar with assistance. To progress: Work on dead hang duration and scapular pulls to build hanging strength.',
              s_pull_up_strength.advanced_beginner_level = 'Can perform dead hangs for 15+ seconds and scapular pulls. Negative pull-ups are possible with control. To progress: Practice assisted pull-ups and negatives to build pulling strength.',
              s_pull_up_strength.competent_level = 'Can perform 5-10 unassisted pull-ups with good form. Consistent pulling strength. To progress: Work on increasing volume or exploring advanced pull-up variations.',
              s_pull_up_strength.proficient_level = 'Performing 15+ quality pull-ups easily. Confident across variations. Movement is smooth and controlled. To progress: Master advanced progressions like weighted pull-ups or muscle-ups.',
              s_pull_up_strength.expert_level = 'Exceptional pulling strength with 20+ pull-ups performed effortlessly. Masters all pull-up variations and advanced progressions. Teaches proper pull-up technique to others.';

// Squat Technique Skill
MERGE (s_squat_technique:Skill {name: 'Squat Mechanics and Control'})
ON CREATE SET s_squat_technique.description = 'Developing proper squat form from bodyweight squats through deep pistol squat progressions. Includes upright posture, range of motion, and knee tracking.',
              s_squat_technique.how_to_develop = 'Start with supported squats (holding a bar or pole) and focus on form. Practice partial squats before attempting full range of motion. Work on mobility if limited by tight hips or ankles. Expected time: 3-6 weeks for basic form, 3-4 months for deep squats with proper mechanics.',
              s_squat_technique.novice_level = 'Performing assisted squats or partial range squats. Form is inconsistent. Knees may cave inward. To progress: Practice bodyweight squats holding support, focusing on knee tracking and upright posture.',
              s_squat_technique.advanced_beginner_level = 'Can perform full-range bodyweight squats with some form inconsistency. Getting comfortable with deep ranges. To progress: Work on perfect form at full depth without assistance.',
              s_squat_technique.competent_level = 'Performing deep bodyweight squats with consistent form. Proper knee tracking and upright torso. Can perform 15+ reps smoothly. To progress: Work on more challenging variations like pistol squat progressions.',
              s_squat_technique.proficient_level = 'Bodyweight squats are natural and effortless. Can perform single-leg squat progressions (pistol squats) with control. Movement is fluid and coordinated. To progress: Master pistol squats and explore other single-leg variations.',
              s_squat_technique.expert_level = 'Perfect bodyweight squat form and mastery of pistol squats with exceptional control. Teaching others proper squat mechanics and addressing individual form variations.';

// Dip Strength Skill
MERGE (s_dip_strength:Skill {name: 'Dip Progression and Strength'})
ON CREATE SET s_dip_strength.description = 'Building dipping strength from assisted variations through parallette dips to advanced dip progressions. Critical for tricep and chest development.',
              s_dip_strength.how_to_develop = 'Start with bench dips or assisted dips using resistance bands. Progress to negative dips where you lower yourself under control. Work on increasing range of motion as strength improves. Expected time: 6-10 weeks to achieve first dip from zero, 3-4 months to develop solid dip strength.',
              s_dip_strength.novice_level = 'Cannot perform unassisted dips. Bench dips or assisted dips are possible with effort. To progress: Build dip strength through negative dips and assisted variations.',
              s_dip_strength.advanced_beginner_level = 'Performing negative dips with control. Assisted dips with moderate difficulty. To progress: Work toward first full dip through consistent practice of negatives.',
              s_dip_strength.competent_level = 'Can perform 5-15 solid dips with good form and control. Consistent dip strength established. To progress: Work on increasing volume or advanced dip variations.',
              s_dip_strength.proficient_level = 'Performing 20+ dips easily with perfect form. Dips feel natural and controlled. To progress: Explore weighted dips or advanced progressions like archer dips.',
              s_dip_strength.expert_level = 'Exceptional dip strength and control across all dip variations. Can perform advanced progressions effortlessly and teach proper dip mechanics to others.';

// Core Strength Skill
MERGE (s_core_strength:Skill {name: 'Core Strength and Stability'})
ON CREATE SET s_core_strength.description = 'Building core stability and strength for safe movement, proper posture, and force transfer during complex exercises. Includes planks, hollow holds, and dynamic core work.',
              s_core_strength.how_to_develop = 'Start with plank holds and progress to longer durations. Add hollow body holds for dynamic core control. Include anti-rotation and anti-extension exercises. Expected time: 4-6 weeks for basic core strength, ongoing for advanced core skills.',
              s_core_strength.novice_level = 'Can hold plank position for 20-30 seconds with sagging hips. Basic body awareness needed. To progress: Work on longer plank holds and learning to activate core properly.',
              s_core_strength.advanced_beginner_level = 'Holding planks for 60+ seconds with mostly correct form. Understanding how to engage core. To progress: Add dynamic core movements and increase challenge.',
              s_core_strength.competent_level = 'Performing 2+ minute planks with perfect form. Can maintain core tension during complex movements. Solid foundation for most exercises. To progress: Work on dynamic core skills and advanced variations.',
              s_core_strength.proficient_level = 'Exceptional core strength with effortless long-duration holds. Maintains perfect core tension intuitively. To progress: Master advanced core skills like L-sits or front lever progressions.',
              s_core_strength.expert_level = 'Expert core control across all variations and progressions. Core tension is perfect and automatic. Mastery of advanced skills like L-sits and front levers. Teaching proper core engagement to others.';

// Handstand Foundation Skill
MERGE (s_handstand_foundation:Skill {name: 'Handstand Balance and Control'})
ON CREATE SET s_handstand_foundation.description = 'Developing handstand skills from wall work through free-standing holds. Includes balance, body alignment, and shoulder stability.',
              s_handstand_foundation.how_to_develop = 'Start with wall handstands, working on proper alignment and building comfort upside down. Progress to freestanding balance with walls nearby. Work on shoulder stability and wrist conditioning. Expected time: 8-12 weeks for wall holds, 3-6 months for brief freestanding holds.',
              s_handstand_foundation.novice_level = 'Can hold wall handstand for short duration with wobbly form. Building comfort being inverted. To progress: Extend wall handstand holds and work on better alignment.',
              s_handstand_foundation.advanced_beginner_level = 'Holding wall handstands for 1+ minute with mostly correct form. Beginning to feel where body is in space. To progress: Practice freestanding balance with walls nearby.',
              s_handstand_foundation.competent_level = 'Can hold freestanding handstand for 10+ seconds with decent balance. Able to recover from small balance shifts. To progress: Extend hold duration and refine balance point.',
              s_handstand_foundation.proficient_level = 'Maintaining freestanding handstands for 30+ seconds with excellent balance and alignment. Balance feels natural and automatic. To progress: Work on handstand walking and dynamic handstand skills.',
              s_handstand_foundation.expert_level = 'Expert handstand skills with exceptional balance and control. Can hold handstand indefinitely with perfect form. Mastery of advanced skills like handstand walking and press handstands.';

// Flexibility and Mobility Skill
MERGE (s_flexibility_mobility:Skill {name: 'Calisthenics Flexibility and Mobility'})
ON CREATE SET s_flexibility_mobility.description = 'Developing and maintaining flexibility and mobility for optimal movement quality, injury prevention, and accessing full range of motion in exercises.',
              s_flexibility_mobility.how_to_develop = 'Include dedicated flexibility work 3-4 times per week. Combine dynamic stretching before workouts with static stretching after. Target areas limiting your training. Expected time: 4-8 weeks for noticeable improvements, ongoing for maintenance and progression.',
              s_flexibility_mobility.novice_level = 'Limited range of motion in key areas. Tight hips or shoulders limit exercise variation. To progress: Implement consistent stretching routine targeting main tightness areas.',
              s_flexibility_mobility.advanced_beginner_level = 'Improving flexibility in targeted areas. Some exercises becoming more accessible. To progress: Continue systematic flexibility work and explore new ranges.',
              s_flexibility_mobility.competent_level = 'Good flexibility across major joints. Can access full range of motion in standard exercises. Maintaining flexibility with regular work. To progress: Develop exceptional flexibility in specific areas for advanced skills.',
              s_flexibility_mobility.proficient_level = 'Excellent flexibility and mobility across all major joints. Moving through full ranges effortlessly. Flexibility work is integrated naturally. To progress: Work on achieving extreme ranges for specialized skills.',
              s_flexibility_mobility.expert_level = 'Exceptional flexibility and mobility compared to general population. Comfortable in extreme ranges of motion. Teaching others proper stretching and mobility work.';

// Body Control and Coordination Skill
MERGE (s_body_control:Skill {name: 'Body Awareness and Coordination'})
ON CREATE SET s_body_control.description = 'Developing proprioceptive awareness and coordination for complex movement execution. Includes knowing where body parts are in space and moving fluidly between positions.',
              s_body_control.how_to_develop = 'Practice skills like handstands, L-sits, and complex movement combinations. Work with mirror feedback to build awareness. Do balance-based drills and coordination-focused exercises. Expected time: 6-10 weeks for noticeable improvement, ongoing for mastery.',
              s_body_control.novice_level = 'Limited body awareness. Movements are jerky and uncoordinated. Difficulty with balance-based skills. To progress: Practice basic balance work and build awareness through video feedback.',
              s_body_control.advanced_beginner_level = 'Developing better body awareness. Balance is improving. Movements are becoming more coordinated. To progress: Practice more complex movement patterns and balance skills.',
              s_body_control.competent_level = 'Good body awareness and coordination across most movements. Can handle moderately complex skills. Moving with reasonable fluidity. To progress: Work on mastering complex movement combinations.',
              s_body_control.proficient_level = 'Excellent body awareness and coordination. Complex movements are smooth and controlled. Adjusts body position intuitively during movement. To progress: Develop exceptional coordination in specialized skills.',
              s_body_control.expert_level = 'Expert-level body awareness and coordination. Moving with exceptional control and precision. Mastery of highly complex movement combinations. Teaching coordination and body awareness to others.';

// Muscle-Up Development Skill
MERGE (s_muscle_up:Skill {name: 'Muscle-Up Progression'})
ON CREATE SET s_muscle_up.description = 'Building the strength and technique for muscle-ups, transitioning from pulling to dipping positions. Advanced full-body strength and coordination skill.',
              s_muscle_up.how_to_develop = 'Develop strong pull-ups and dips first. Practice transition movements like explosives pull-ups and dips. Work on bar-specific progressions and transition drills. Expected time: 2-4 months from solid pull-up and dip strength to first muscle-up.',
              s_muscle_up.novice_level = 'Cannot perform muscle-ups. Building foundation strength through pull-ups and dips. To progress: Achieve 15+ pull-ups and 10+ dips before focusing on muscle-up progression.',
              s_muscle_up.advanced_beginner_level = 'Have strong pull-ups and dips. Beginning to practice transition movements and muscle-up specific drills. To progress: Work on explosive pull-ups and practicing transition mechanics.',
              s_muscle_up.competent_level = 'Can perform 1-3 muscle-ups with occasional assistance or difficulty. Movement is somewhat jerky. To progress: Work on increasing number of muscle-ups and smoothing transition.',
              s_muscle_up.proficient_level = 'Performing 5+ muscle-ups easily with smooth transitions. Muscle-up movement is natural and controlled. To progress: Work on weighted muscle-ups or advanced variations.',
              s_muscle_up.expert_level = 'Expert muscle-up execution with exceptional control and numerous reps. Mastery of advanced variations and teaching muscle-up progression to others.';

// Progressive Overload and Periodization Skill
MERGE (s_progression_execution:Skill {name: 'Progressive Overload and Training Phases'})
ON CREATE SET s_progression_execution.description = 'Implementing structured progressions and training phases to systematically increase demands, manage fatigue, and avoid plateaus in calisthenics training.',
              s_progression_execution.how_to_develop = 'Study periodization concepts. Track your own training and consciously implement progression strategies. Experiment with different progression methods and observe results. Expected time: 8-12 weeks to develop practical skill.',
              s_progression_execution.novice_level = 'Haphazardly adding reps or variations without systematic structure. Not tracking progression clearly. To progress: Start tracking training systematically and plan progressions.',
              s_progression_execution.advanced_beginner_level = 'Beginning to track progress and plan simple progressions. Inconsistent with implementation. To progress: Implement more structured periodization with phases.',
              s_progression_execution.competent_level = 'Executing systematic progressions and basic periodization. Successfully increasing difficulty over weeks and months. Making steady progress. To progress: Develop more sophisticated periodization strategies.',
              s_progression_execution.proficient_level = 'Implementing sophisticated periodization with clear phases and progression strategies. Naturally manages training stress and recovery. Avoiding plateaus effectively. To progress: Master individualized periodization design.',
              s_progression_execution.expert_level = 'Expert periodization and progression design tailored to individual needs. Creating sophisticated training strategies that optimize progress and manage fatigue effectively.';

// Isometric Strength Hold Skill
MERGE (s_isometric_holds:Skill {name: 'Isometric Strength Holds'})
ON CREATE SET s_isometric_holds.description = 'Developing static holding strength in positions like L-sits, front levers, and planches. Building strength through non-moving, sustained contractions.',
              s_isometric_holds.how_to_develop = 'Start with easier isometric progressions (parallel bar L-sits for example). Build hold duration gradually. Practice variations that allow progression toward harder variations. Expected time: 4-6 weeks for basic holds, 3-6 months for advanced holds.',
              s_isometric_holds.novice_level = 'Cannot hold isometric positions for more than a few seconds. Strength is insufficient. To progress: Build strength through easier progressions and consistent practice.',
              s_isometric_holds.advanced_beginner_level = 'Can hold easier progressions (parallel bar L-sit, wall plank) for 15-30 seconds. To progress: Work on longer holds and more challenging progressions.',
              s_isometric_holds.competent_level = 'Holding intermediate positions (L-sits) for 20-30 seconds with control. Making progress toward advanced holds. To progress: Progress to harder variations and longer holds.',
              s_isometric_holds.proficient_level = 'Maintaining challenging isometric positions (front lever progressions) for extended durations. Perfect body alignment throughout. To progress: Master expert-level holds like full front lever.',
              s_isometric_holds.expert_level = 'Expert ability to maintain extremely challenging isometric positions (full front levers, planches) with perfect form and exceptional duration.';

// Dynamic Movement and Explosiveness Skill
MERGE (s_dynamic_power:Skill {name: 'Dynamic Movements and Power Expression'})
ON CREATE SET s_dynamic_power.description = 'Developing power and explosiveness in dynamic movements like clapping push-ups, jump squats, and explosive pull-ups. Building fast-twitch muscle fiber recruitment.',
              s_dynamic_power.how_to_develop = 'Start with powerful but controlled movements. Progress to faster movements and greater heights. Include plyometric-style progressions. Expected time: 6-8 weeks to develop basic explosive ability.',
              s_dynamic_power.novice_level = 'Movements are slow and deliberate. Difficulty generating power or explosiveness. To progress: Work on moving faster and more powerfully in basic exercises.',
              s_dynamic_power.advanced_beginner_level = 'Beginning to express power in movements. Some explosive variations possible with effort. To progress: Work on smoother power expression and harder variations.',
              s_dynamic_power.competent_level = 'Can perform explosive variations of standard exercises (explosive push-ups, jump squats) with reasonable power. To progress: Master more advanced explosive progressions.',
              s_dynamic_power.proficient_level = 'Expressing considerable power across explosive movements. Dynamic variations are smooth and powerful. To progress: Work on mastering extreme explosive progressions.',
              s_dynamic_power.expert_level = 'Expert power expression with exceptional explosive ability. Mastery of highly advanced dynamic skills like flying training techniques and power movements.';

// Training Recovery and Adaptation Skill
MERGE (s_recovery_management:Skill {name: 'Training Recovery and Adaptation Management'})
ON CREATE SET s_recovery_management.description = 'Optimizing recovery practices including sleep, nutrition, active recovery, and deload management to support training progress and prevent injury.',
              s_recovery_management.how_to_develop = 'Implement consistent sleep and nutrition practices. Track recovery quality and adjust based on performance. Learn about deload phases and recovery protocols. Expected time: 4-6 weeks to establish good practices.',
              s_recovery_management.novice_level = 'Inconsistent recovery practices. Sleep and nutrition vary. Not actively managing recovery. To progress: Establish consistent sleep, nutrition, and hydration routines.',
              s_recovery_management.advanced_beginner_level = 'Beginning to prioritize recovery with consistent practices. Noticing impact on training performance. To progress: Refine practices and add more sophisticated recovery strategies.',
              s_recovery_management.competent_level = 'Implementing solid recovery practices (consistent sleep, good nutrition, rest days). Supporting training progress effectively. To progress: Develop more sophisticated recovery optimization.',
              s_recovery_management.proficient_level = 'Exceptional recovery practices optimized for your individual needs. Managing fatigue and recovery intuitively. Supporting advanced training volume. To progress: Master individualized recovery protocols.',
              s_recovery_management.expert_level = 'Expert recovery management with sophisticated protocols tailored to training needs. Managing recovery for optimal progress and helping others optimize their recovery.';

// Injury Prevention and Self-Assessment Skill
MERGE (s_injury_prevention:Skill {name: 'Injury Prevention and Self-Assessment'})
ON CREATE SET s_injury_prevention.description = 'Understanding injury risk factors, practicing proper warm-ups, recognizing pain versus soreness, and modifying training to prevent injury.',
              s_injury_prevention.how_to_develop = 'Study injury prevention principles. Practice thorough warm-ups consistently. Pay careful attention to body signals during training. Document any pain or issues. Expected time: 6-8 weeks to develop good practices.',
              s_injury_prevention.novice_level = 'Minimal injury prevention practices. Incomplete warm-ups. Poor at self-assessing pain versus soreness. To progress: Implement systematic warm-ups and learn injury warning signs.',
              s_injury_prevention.advanced_beginner_level = 'Performing better warm-ups and beginning to notice pain patterns. Some understanding of injury prevention. To progress: Deepen understanding of warning signs and prevention strategies.',
              s_injury_prevention.competent_level = 'Practicing good warm-ups and careful self-assessment. Quickly identifying and modifying activities when pain appears. Preventing most common injuries. To progress: Develop more sophisticated injury prevention strategies.',
              s_injury_prevention.proficient_level = 'Excellent injury prevention practices with intuitive assessment and modification. Rarely experiencing preventable injuries. Proactively addressing minor issues. To progress: Master complex injury prevention for advanced training.',
              s_injury_prevention.expert_level = 'Expert injury prevention and self-assessment. Anticipating injury risk and preventing issues before they develop. Helping others prevent injuries and manage pain effectively.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Physical strength - foundational trait for all bodyweight exercises
MERGE (t_strength:Trait {name: 'Physical Strength'})
ON CREATE SET t_strength.description = 'Natural capacity for generating force through muscle contraction. Determines baseline ability to perform strength-based movements and resist gravity during calisthenics.',
              t_strength.measurement_criteria = 'Assessed through relative strength in fundamental movements and progression speed. Low (0-25): Struggles with assisted variations of basic exercises. Moderate (26-50): Can perform basic exercises but with significant effort. High (51-75): Performs standard exercises with reasonable ease and makes steady progression. Exceptional (76-100): Naturally strong, quickly progresses through variations, and masters advanced strength skills.';

// Flexibility - critical for movement quality and range
MERGE (t_flexibility:Trait {name: 'Flexibility'})
ON CREATE SET t_flexibility.description = 'Natural range of motion and connective tissue elasticity across major joints (hips, shoulders, ankles, spine). Enables full range of motion in exercises and reduces injury risk.',
              t_flexibility.measurement_criteria = 'Assessed through passive and active range of motion testing in key areas. Low (0-25): Severely limited range of motion, cannot access full movement ranges. Moderate (26-50): Average range of motion with some tight areas. High (51-75): Good range across major joints, comfortable with full-range movements. Exceptional (76-100): Exceptional flexibility, can achieve extreme ranges and contortionist-level mobility.';

// Body coordination - ability to coordinate multiple body segments
MERGE (t_coordination:Trait {name: 'Coordination'})
ON CREATE SET t_coordination.description = 'Natural ability to coordinate movement across multiple joints and limbs simultaneously. Enables smooth, controlled movements and learning complex movement patterns.',
              t_coordination.measurement_criteria = 'Assessed through balance tests, movement smoothness, and speed of learning new movement patterns. Low (0-25): Movements are jerky and uncoordinated, difficulty balancing. Moderate (26-50): Can perform basic coordinated movements with practice. High (51-75): Good coordination, learns new movement patterns relatively quickly. Exceptional (76-100): Exceptional coordination, masters complex movements intuitively and maintains perfect balance in challenging positions.';

// Perseverance - mental trait for consistent training
MERGE (t_perseverance:Trait {name: 'Perseverance'})
ON CREATE SET t_perseverance.description = 'Natural tendency to persist through difficulty, maintain effort over long periods, and push through discomfort. Enables consistent training despite fatigue, soreness, and plateaus.',
              t_perseverance.measurement_criteria = 'Assessed through consistency of training, ability to maintain effort when progress slows, and response to setbacks. Low (0-25): Quits quickly when training becomes difficult or progress stalls. Moderate (26-50): Can persist with encouragement but struggles with long-term consistency. High (51-75): Maintains consistent training through difficulties and plateaus. Exceptional (76-100): Naturally driven to persist, maintains effort indefinitely, treats setbacks as motivation.';

// Pain tolerance - ability to distinguish soreness from injury and push through fatigue
MERGE (t_pain_tolerance:Trait {name: 'Pain Tolerance'})
ON CREATE SET t_pain_tolerance.description = 'Natural threshold for discomfort and capacity to distinguish between harmful pain and safe training stress. Enables pushing intensity appropriately without injury avoidance.',
              t_pain_tolerance.measurement_criteria = 'Assessed through willingness to train with muscle soreness, response to intense sets, and injury history. Low (0-25): Stops at minimal discomfort, avoids challenging sets. Moderate (26-50): Can push through muscle soreness but may be overly cautious. High (51-75): Comfortable training with soreness, appropriately judges when to push versus hold back. Exceptional (76-100): High pain tolerance, confidently distinguishes training stress from injury risk, pushes appropriate intensity.';

// Proprioception - body awareness and spatial sense
MERGE (t_proprioception:Trait {name: 'Proprioception'})
ON CREATE SET t_proprioception.description = 'Natural body awareness and sense of where limbs are in space, independent of visual feedback. Critical for balance skills like handstands and controlling movement in complex positions.',
              t_proprioception.measurement_criteria = 'Assessed through balance tests (particularly with eyes closed), ability to learn movement patterns, and balance skill development. Low (0-25): Significant loss of balance with eyes closed, struggles with balance-based skills. Moderate (26-50): Adequate sense of body position, balance possible with visual feedback. High (51-75): Good proprioceptive awareness, can balance with brief eyes-closed periods. Exceptional (76-100): Exceptional proprioception, maintains perfect balance with eyes closed, develops advanced balance skills with ease.';

// Mental resilience - ability to manage frustration and maintain motivation
MERGE (t_mental_resilience:Trait {name: 'Mental Resilience'})
ON CREATE SET t_mental_resilience.description = 'Emotional capacity to manage frustration, maintain confidence after setbacks, and stay motivated through plateaus. Enables psychological persistence despite difficulty.',
              t_mental_resilience.measurement_criteria = 'Assessed through emotional response to failure, ability to recover from setbacks, and motivation maintenance over time. Low (0-25): Becomes discouraged easily, struggles to maintain motivation after failures. Moderate (26-50): Can recover from setbacks with support but doubts surface easily. High (51-75): Handles setbacks well, maintains confidence and motivation through difficulties. Exceptional (76-100): Exceptionally resilient, views failures positively, maintains motivation indefinitely, and naturally rebounds from setbacks.';

// Focus/Concentration - ability to concentrate on training and form
MERGE (t_focus:Trait {name: 'Focus'})
ON CREATE SET t_focus.description = 'Natural capacity for sustained attention and concentration on movement patterns, form cues, and training focus. Enables learning proper form quickly and maintaining technique consistency.',
              t_focus.measurement_criteria = 'Assessed through ability to maintain concentration during workouts, form consistency, and speed of pattern learning. Low (0-25): Easily distracted, form deteriorates when concentrating on multiple cues. Moderate (26-50): Can maintain focus for moderate periods but attention may drift. High (51-75): Good sustained focus during training sessions, can manage multiple form cues. Exceptional (76-100): Exceptional focus, maintains perfect concentration and form consistency even during difficult sets.';

// Body awareness sensitivity - sensitivity to feedback and form quality
MERGE (t_body_awareness_sensitivity:Trait {name: 'Body Awareness Sensitivity'})
ON CREATE SET t_body_awareness_sensitivity.description = 'Natural sensitivity to bodily sensations and ability to detect subtle differences in movement quality, form, and muscle engagement. Enables rapid form improvement through feedback.',
              t_body_awareness_sensitivity.measurement_criteria = 'Assessed through speed of form improvement, ability to identify form errors in own movement, and sensitivity to movement quality changes. Low (0-25): Insensitive to form differences, slow to improve form through feedback. Moderate (26-50): Can feel some differences in movement quality after practice. High (51-75): Good sensitivity to body sensations and movement quality, improves form reasonably quickly. Exceptional (76-100): Exceptionally sensitive to subtle movement differences, rapidly improves form, identifies and corrects errors intuitively.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones - Entry-level achievements
MERGE (m_first_pushup:Milestone {name: 'Complete First Full Push-Up'})
ON CREATE SET m_first_pushup.description = 'Successfully perform and complete a single full push-up with proper form from a plank position. This foundational milestone marks the beginning of upper body pressing strength development and demonstrates ability to move your own body weight against gravity.',
              m_first_pushup.how_to_achieve = 'Start with wall push-ups or incline push-ups on a high surface. Focus on form before repetitions. Practice 3-4 times per week. Gradually lower the incline over weeks. When ready, attempt a full push-up from your toes with straight body alignment. Most people achieve this in 2-6 weeks of consistent practice.';

MERGE (m_dead_hang:Milestone {name: 'Achieve 30-Second Dead Hang'})
ON CREATE SET m_dead_hang.description = 'Hang from a pull-up bar for a continuous 30 seconds with straight arms and controlled breathing. This milestone builds foundational pulling strength and grip endurance necessary for pull-ups.',
              m_dead_hang.how_to_achieve = 'Find a pull-up bar at a comfortable height. Grab with both hands and let your body hang freely with straight arms. Focus on relaxing while maintaining grip. Practice 2-3 times per week. Most people can achieve this within 1-3 weeks if they practice regularly.';

MERGE (m_bodyweight_squat:Milestone {name: 'Complete 15 Quality Bodyweight Squats'})
ON CREATE SET m_bodyweight_squat.description = 'Perform 15 consecutive bodyweight squats with proper form including full range of motion, controlled tempo, and upright posture. This demonstrates basic lower body mobility and strength.',
              m_bodyweight_squat.how_to_achieve = 'Practice bodyweight squats focusing on full depth and upright posture. Start with 5-10 squats and add 1-2 reps per session. Rest 48 hours between practice sessions. Video yourself to check form. Most people achieve this in 2-4 weeks.';

MERGE (m_plank_hold:Milestone {name: 'Hold Plank Position for 1 Minute'})
ON CREATE SET m_plank_hold.description = 'Maintain a proper plank position (straight body line, engaged core) for 60 continuous seconds. This milestone demonstrates foundational core strength and body control.',
              m_plank_hold.how_to_achieve = 'Start with 15-20 second plank holds. Add 5-10 seconds per session as strength improves. Maintain proper form with neutral spine and engaged core. Practice 3-4 times per week. Most people achieve this in 2-4 weeks of consistent practice.';

// Developing Level Milestones - Progressive achievements
MERGE (m_first_pullup:Milestone {name: 'Complete First Full Pull-Up'})
ON CREATE SET m_first_pullup.description = 'Perform one unassisted pull-up from a dead hang to full chin over bar. This significant milestone represents a major breakthrough in pulling strength and marks entry into intermediate bodyweight training.',
              m_first_pullup.how_to_achieve = 'Build foundation through dead hangs (30+ seconds), scapular pulls, and negative pull-ups. Use resistance bands to assist if needed. Focus on explosive pulling power. Practice 2-3 times per week with 2-3 days rest between attempts. Most people achieve this in 2-6 months from zero baseline.';

MERGE (m_ten_pushups:Milestone {name: 'Complete 10 Consecutive Push-Ups'})
ON CREATE SET m_ten_pushups.description = 'Perform 10 consecutive full push-ups with perfect form and controlled tempo, demonstrating developed upper body pressing strength.',
              m_ten_pushups.how_to_achieve = 'Start from your current max and add 1-2 reps every 1-2 weeks. Include multiple sets per session (e.g., 3-4 sets of 5-7 reps). Maintain strict form throughout. Practice 3-4 times per week. Most people progress from 5 to 10 reps in 3-4 weeks.';

MERGE (m_first_dip:Milestone {name: 'Complete First Full Dip'})
ON CREATE SET m_first_dip.description = 'Perform one complete unassisted dip on parallel bars with proper depth and control. This milestone demonstrates significant tricep and chest strength development.',
              m_first_dip.how_to_achieve = 'Use resistance bands to assist initially or practice negative dips where you lower yourself under control. Gradually reduce band assistance over weeks. Practice 2-3 times per week with rest days between. Most people achieve their first dip in 4-10 weeks from assisted variations.';

MERGE (m_five_pullups:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
ON CREATE SET m_five_pullups.description = 'Perform 5 unassisted pull-ups in a row with proper form, demonstrating solid pulling strength development and training consistency.',
              m_five_pullups.how_to_achieve = 'After achieving your first pull-up, practice 2-3 times per week with 2-3 days rest between sessions. Do multiple sets with shorter reps if needed. Gradually increase reps. Most people achieve 5 pull-ups in 3-6 weeks after their first pull-up.';

MERGE (m_pistol_squat_assisted:Milestone {name: 'Complete First Assisted Pistol Squat'})
ON CREATE SET m_pistol_squat_assisted.description = 'Perform a single-leg squat (pistol squat) while holding support, descending to deep range with one leg extended. This milestone marks progression to unilateral lower body strength.',
              m_pistol_squat_assisted.how_to_achieve = 'Practice assisted pistol squats holding a resistance band or bar. Work on full range of motion with support. Practice 2-3 times per week. Focus on getting comfortable at the bottom position. Most people achieve this in 4-8 weeks of practice.';

// Competent Level Milestones - Significant achievements
MERGE (m_planche_lean:Milestone {name: 'Hold 10-Second Planche Lean'})
ON CREATE SET m_planche_lean.description = 'Hold a planche lean position (forward-leaning handstand-like position with horizontal body) for 10 continuous seconds. This milestone demonstrates exceptional core and shoulder strength.',
              m_planche_lean.how_to_achieve = 'Start with wall-supported planche leans and progress to floor planche leans. Build progressively from 2-3 seconds toward 10 seconds. Practice 2-3 times per week with rest days between sessions. This typically requires 8-16 weeks of dedicated practice from introductory level.';

MERGE (m_twenty_pullups:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
ON CREATE SET m_twenty_pullups.description = 'Perform 20 unassisted pull-ups in a single set with consistent form and control, demonstrating advanced pulling strength and muscular endurance.',
              m_twenty_pullups.how_to_achieve = 'Progress from 10 pull-ups by doing multiple weekly sessions. Use pyramid sets or ladder training. Add volume gradually. Practice 3-4 times per week with 1-2 rest days between heavy sessions. Most people progress from 10 to 20 in 6-10 weeks with consistent training.';

MERGE (m_muscle_up:Milestone {name: 'Complete First Muscle-Up'})
ON CREATE SET m_muscle_up.description = 'Perform a complete muscle-up on a bar, transitioning smoothly from a pull-up position to a dip position and pressing above the bar. This major milestone represents mastery of pulling and pressing combined.',
              m_muscle_up.how_to_achieve = 'Develop strong foundation with 15+ pull-ups and 15+ dips. Practice explosive pull-ups to build power. Work on transition movements and bar-specific drills. Practice 2-3 times per week. Most people achieve their first muscle-up in 2-4 months of dedicated practice.';

MERGE (m_pistol_squat:Milestone {name: 'Complete Single-Leg Pistol Squat'})
ON CREATE SET m_pistol_squat.description = 'Perform a full single-leg squat (pistol squat) without assistance, descending to full depth with proper form and rising back up. This demonstrates exceptional unilateral leg strength and mobility.',
              m_pistol_squat.how_to_achieve = 'Progress from assisted pistol squats by gradually reducing support. Practice 2-3 times per week. Focus on going deeper with minimal assistance each session. Work on mobility if limited by tight hips. Most people achieve this in 3-6 months of consistent progression.';

MERGE (m_handstand_hold_10s:Milestone {name: 'Hold Free-Standing Handstand for 10 Seconds'})
ON CREATE SET m_handstand_hold_10s.description = 'Hold a free-standing handstand (not against a wall) for 10 consecutive seconds with proper alignment. This milestone demonstrates significant shoulder stability and balance skill.',
              m_handstand_hold_10s.how_to_achieve = 'Build foundation with wall handstands and wall-assisted practice. Progress to hand balancing with walls nearby for safety. Practice 3-4 times per week. Most people achieve brief free-standing holds after 8-16 weeks of consistent handstand work.';

MERGE (m_lsit_hold:Milestone {name: 'Hold L-Sit for 15 Seconds'})
ON CREATE SET m_lsit_hold.description = 'Hold an L-sit position (sitting position with legs extended horizontally, supported by hands) for 15 continuous seconds on parallel bars or floor. This demonstrates advanced core and shoulder stability.',
              m_lsit_hold.how_to_achieve = 'Start with assisted L-sits on parallettes or in dips position. Progress by reducing assistance and building hold time. Add 2-3 seconds per week as strength improves. Practice 2-3 times per week. Most people achieve 15 seconds in 6-12 weeks of progression.';

// Advanced Level Milestones - Major accomplishments
MERGE (m_thirty_dips:Milestone {name: 'Complete 30 Consecutive Dips'})
ON CREATE SET m_thirty_dips.description = 'Perform 30 unassisted parallel bar dips with full range of motion and perfect form, demonstrating exceptional tricep, chest, and shoulder strength.',
              m_thirty_dips.how_to_achieve = 'Build from current dip max by adding volume gradually. Use pyramid sets and high-frequency practice. Include 3-5 sets of dips 3-4 times per week. Most people progress from 15 to 30 dips in 8-12 weeks with consistent training.';

MERGE (m_handstand_walk:Milestone {name: 'Walk 20+ Meters in Handstand'})
ON CREATE SET m_handstand_walk.description = 'Walk forward for more than 20 meters while maintaining a free-standing handstand with proper alignment and balance control. This advanced milestone demonstrates expert-level balance and shoulder stability.',
              m_handstand_walk.how_to_achieve = 'Develop 30+ second free-standing handstand holds first. Practice short walks along a wall or open space with spotting. Build distance gradually starting with 2-3 meters. Practice 2-3 times per week. Most people achieve 20+ meter walks after 3-6 months of handstand walking practice.';

MERGE (m_front_lever_progressions:Milestone {name: 'Hold 15-Second Front Lever Progression'})
ON CREATE SET m_front_lever_progressions.description = 'Hold an intermediate front lever progression (advanced horizontal bodyweight position) for 15 continuous seconds. This demonstrates exceptional core, back, and shoulder strength.',
              m_front_lever_progressions.how_to_achieve = 'Start with tuck front lever progressions and work toward straddle progressions. Build hold time gradually. Practice 2-3 times per week with 2-3 days rest between. Most people achieve 15-second holds in 4-8 months of dedicated progression work.';

MERGE (m_five_muscle_ups:Milestone {name: 'Complete 5 Consecutive Muscle-Ups'})
ON CREATE SET m_five_muscle_ups.description = 'Perform 5 muscle-ups in a row with smooth transitions and consistent form, demonstrating advanced combined pulling and pressing strength.',
              m_five_muscle_ups.how_to_achieve = 'After achieving your first muscle-up, practice 2-3 times per week. Do single reps with rest, then progress to 2, 3, 4, and finally 5 in succession. Work on explosive power and smooth transitions. Most people achieve 5 muscle-ups in 2-3 months after their first.';

MERGE (m_onearm_pullup_progression:Milestone {name: 'One-Arm Pull-Up Progression (Archer Hold)'})
ON CREATE SET m_onearm_pullup_progression.description = 'Perform an archer pull-up (asymmetrical pull with one arm more engaged) that approaches one-arm pull-up territory, demonstrating exceptional unilateral pulling strength.',
              m_onearm_pullup_progression.how_to_achieve = 'Develop 30+ pull-ups first. Practice archer pull-ups gradually shifting more weight to one arm. Include unilateral pulling drills. Practice 2-3 times per week. Most people achieve archer pull-ups after 2-4 months of dedicated unilateral training.';

// Master Level Milestones - Exceptional achievements
MERGE (m_full_planche:Milestone {name: 'Hold 5-Second Full Planche'})
ON CREATE SET m_full_planche.description = 'Hold a complete planche position (horizontal body position with only hands supporting, fully extended arms) for 5 continuous seconds. One of the most difficult bodyweight skills, this exceptional milestone represents mastery-level strength.',
              m_full_planche.how_to_achieve = 'Progress through advanced planche variations over 12+ months of training. Build progressively from 1-2 seconds to 5 seconds. Practice 2-3 times per week with adequate recovery. Requires exceptional upper body and core strength. Most people require 12-24 months to achieve this from intermediate level.';

MERGE (m_handstand_press:Milestone {name: 'Perform Handstand Press to Vertical'})
ON CREATE SET m_handstand_press.description = 'Press from a hollow body position into a vertical free-standing handstand or press from a pike position into a handstand (pike press to vertical). This demonstrates exceptional shoulder strength and handstand control.',
              m_handstand_press.how_to_achieve = 'Develop strong pike holds and presses first. Work on pike push-ups and elevated push-ups progressively. Build toward vertical pressing. Practice 2-3 times per week with rest days between. Most people achieve this in 3-6 months of dedicated vertical pressing practice after a solid foundation.';

MERGE (m_fifty_pullups:Milestone {name: 'Complete 50 Consecutive Pull-Ups'})
ON CREATE SET m_fifty_pullups.description = 'Perform 50 pull-ups in a single set with consistent form and control, demonstrating exceptional pulling strength and muscular endurance at world-class level.',
              m_fifty_pullups.how_to_achieve = 'Build from 30+ pull-ups through high-frequency training. Use training protocols like grease-the-groove. Include 3-5 training sessions per week with varying rep ranges. Most people require 3-6 months to progress from 30 to 50 pull-ups.';

MERGE (m_full_front_lever:Milestone {name: 'Hold Full Front Lever for 10 Seconds'})
ON CREATE SET m_full_front_lever.description = 'Hold a complete front lever position (horizontal body, fully extended arms, held by lat strength alone) for 10 continuous seconds. One of the most difficult bodyweight isometric holds, representing exceptional back and lat strength.',
              m_full_front_lever.how_to_achieve = 'Progress through all intermediate front lever variations over 12+ months. Build hold time progressively. Practice 2-3 times per week with adequate recovery. Requires exceptional lat and grip strength. Most people require 12-24 months to achieve 10-second holds from intermediate level.';

MERGE (m_back_lever:Milestone {name: 'Hold Back Lever for 5 Seconds'})
ON CREATE SET m_back_lever.description = 'Hold a back lever position (body horizontal, arms straight, supported by grip on apparatus) for 5 continuous seconds. This rare skill demonstrates exceptional back strength and flexibility combined.',
              m_back_lever.how_to_achieve = 'Practice tuck back levers and progress to advanced variations over 6-12 months of consistent training. Build flexibility first (especially shoulder flexibility). Practice 2-3 times per week. Most people require 6-12 months from novice level to achieve a 5-second back lever.';

MERGE (m_onearm_pullups:Milestone {name: 'Complete 3 One-Arm Pull-Ups'})
ON CREATE SET m_onearm_pullups.description = 'Perform 3 consecutive one-arm pull-ups with proper form and control. One of the most impressive bodyweight achievements, representing elite-level unilateral pulling strength.',
              m_onearm_pullups.how_to_achieve = 'Build from 50+ pull-ups and extensive archer pull-up training (10+). Practice explosive one-arm movements. Include weighted pull-up training. Train 2-3 times per week focusing on unilateral strength. Most people require 6-12 months of dedicated unilateral training to achieve multiple one-arm pull-ups.';

MERGE (m_human_flag:Milestone {name: 'Hold Human Flag for 10 Seconds'})
ON CREATE SET m_human_flag.description = 'Hold a human flag position (body perpendicular to a vertical pole, horizontal to ground, supported only by hands gripping the pole) for 10 continuous seconds. An exceptionally difficult skill combining strength and control.',
              m_human_flag.how_to_achieve = 'Build from L-sits and horizontal pulling strength. Work through human flag progressions for 6-12 months. Develop exceptional shoulder, core, and lat strength. Practice 2-3 times per week with adequate rest days. Most people require 12-18 months to achieve a 10-second flag from intermediate level.';

MERGE (m_advanced_acrobatics:Milestone {name: 'Master Complex Movement Combinations'})
ON CREATE SET m_advanced_acrobatics.description = 'Perform flowing combinations of advanced moves (handstand to muscle-up transitions, complex movement sequences, or compound progressions) demonstrating mastery of multiple advanced skills and the ability to blend them seamlessly.',
              m_advanced_acrobatics.how_to_achieve = 'Master individual advanced skills (handstand, muscle-up, L-sit, etc.) separately first. Practice flowing transitions between skills. Work with coaches or training partners experienced in combinations. Practice 3-4 times per week. Most people require 18+ months of dedicated advanced training to develop this mastery.';

MERGE (m_calisthenics_competition:Milestone {name: 'Compete in Organized Calisthenics Competition'})
ON CREATE SET m_calisthenics_competition.description = 'Participate in and compete in an organized calisthenics, street workout, or bodyweight strength competition. This social milestone marks engagement with the broader calisthenics community and testing abilities against other practitioners.',
              m_calisthenics_competition.how_to_achieve = 'Develop solid skills across multiple areas (pull-ups, dips, strength moves). Find local or online calisthenics competitions (many cities have street workout communities). Train specifically for competition format. Enter a competition at your level. Most competitive calisthenics athletes compete multiple times per year.';

MERGE (m_teach_others:Milestone {name: 'Successfully Teach Others Basic Calisthenics'})
ON CREATE SET m_teach_others.description = 'Develop the ability to teach fundamental calisthenics exercises to others, demonstrating clear progression planning and ability to correct form in beginning practitioners.',
              m_teach_others.how_to_achieve = 'Develop strong foundational knowledge and skills. Practice explaining concepts clearly. Work with 1-2 willing beginners, creating simple progression plans. Get feedback on your teaching. Most people develop this ability after 6-12 months of consistent training and study.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// LEVEL ASSIGNMENTS: Domain Level Requirements
// ============================================================

// Level 1: Calisthenics Novice - Foundation Level
// Knowledge Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (k:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (k:Knowledge {name: 'Calisthenics Proper Form and Technique'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (k:Knowledge {name: 'Calisthenics Terminology and Vocabulary'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (k:Knowledge {name: 'Breathing Technique During Exercise'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (k:Knowledge {name: 'Distinguishing Pain and Soreness'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Push-Up Form Mastery'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Pull-Up Development'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Squat Mechanics and Control'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Core Strength and Stability'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Calisthenics Flexibility and Mobility'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (s:Skill {name: 'Injury Prevention and Self-Assessment'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Trait Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (t:Trait {name: 'Flexibility'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (t:Trait {name: 'Perseverance'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

// Milestone Requirements - any_of
MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (m:Milestone {name: 'Complete First Full Push-Up'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (m:Milestone {name: 'Achieve 30-Second Dead Hang'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (m:Milestone {name: 'Complete 15 Quality Bodyweight Squats'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Calisthenics Novice'})
MATCH (m:Milestone {name: 'Hold Plank Position for 1 Minute'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 2: Calisthenics Developing
// ============================================================

// Knowledge Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Calisthenics Proper Form and Technique'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Basic Progression Strategies'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Muscle Groups and Anatomy'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Rest and Recovery Principles'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (k:Knowledge {name: 'Breathing Technique During Exercise'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

// Skill Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Push-Up Form Mastery'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Pull-Up Development'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Squat Mechanics and Control'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Dip Progression and Strength'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Core Strength and Stability'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Calisthenics Flexibility and Mobility'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Body Awareness and Coordination'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (s:Skill {name: 'Progressive Overload and Training Phases'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Trait Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (t:Trait {name: 'Flexibility'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (t:Trait {name: 'Perseverance'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (t:Trait {name: 'Coordination'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

// Milestones - any_of
MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (m:Milestone {name: 'Complete First Full Pull-Up'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (m:Milestone {name: 'Complete 10 Consecutive Push-Ups'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (m:Milestone {name: 'Complete First Full Dip'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (m:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Calisthenics Developing'})
MATCH (m:Milestone {name: 'Complete First Assisted Pistol Squat'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 3: Calisthenics Competent
// ============================================================

// Knowledge Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Calisthenics Proper Form and Technique'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Basic Progression Strategies'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Muscle Groups and Anatomy'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Rest and Recovery Principles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Periodized Training Planning'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (k:Knowledge {name: 'Movement Quality and Efficiency'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Push-Up Form Mastery'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Pull-Up Development'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Squat Mechanics and Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Dip Progression and Strength'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Core Strength and Stability'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Handstand Balance and Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Calisthenics Flexibility and Mobility'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Body Awareness and Coordination'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Progressive Overload and Training Phases'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Isometric Strength Holds'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (s:Skill {name: 'Training Recovery and Adaptation Management'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

// Trait Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Flexibility'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Coordination'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Perseverance'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Proprioception'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

// Milestones - any_of
MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Hold 10-Second Planche Lean'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Complete First Muscle-Up'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Complete Single-Leg Pistol Squat'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Hold Free-Standing Handstand for 10 Seconds'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Calisthenics Competent'})
MATCH (m:Milestone {name: 'Hold L-Sit for 15 Seconds'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 4: Calisthenics Advanced
// ============================================================

// Knowledge Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Muscle Groups and Anatomy'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Periodized Training Planning'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Volume and Intensity Balance'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Movement Quality and Efficiency'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Advanced Leverage Manipulation and Variation Design'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (k:Knowledge {name: 'Rest and Recovery Principles'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

// Skill Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Push-Up Form Mastery'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Pull-Up Development'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Squat Mechanics and Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Dip Progression and Strength'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Handstand Balance and Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Muscle-Up Progression'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Progressive Overload and Training Phases'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Isometric Strength Holds'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Dynamic Movements and Power Expression'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (s:Skill {name: 'Training Recovery and Adaptation Management'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Trait Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Flexibility'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Coordination'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Proprioception'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Perseverance'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (t:Trait {name: 'Mental Resilience'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

// Milestones - any_of
MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (m:Milestone {name: 'Complete 30 Consecutive Dips'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (m:Milestone {name: 'Walk 20+ Meters in Handstand'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (m:Milestone {name: 'Hold 15-Second Front Lever Progression'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (m:Milestone {name: 'Complete 5 Consecutive Muscle-Ups'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Calisthenics Advanced'})
MATCH (m:Milestone {name: 'One-Arm Pull-Up Progression (Archer Hold)'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 5: Calisthenics Master
// ============================================================

// Knowledge Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (k:Knowledge {name: 'Advanced Leverage Manipulation and Variation Design'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (k:Knowledge {name: 'Biomechanical Analysis of Movement'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (k:Knowledge {name: 'Calisthenics Coaching and Teaching Methodology'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (k:Knowledge {name: 'Individualized Programming and Assessment'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (k:Knowledge {name: 'Calisthenics Innovation and Method Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Push-Up Form Mastery'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Pull-Up Development'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Handstand Balance and Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Isometric Strength Holds'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Dynamic Movements and Power Expression'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Progressive Overload and Training Phases'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (s:Skill {name: 'Body Awareness and Coordination'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

// Trait Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Flexibility'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Coordination'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Proprioception'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Mental Resilience'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (t:Trait {name: 'Body Awareness Sensitivity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

// Milestones - all_required
MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (m:Milestone {name: 'Hold 5-Second Full Planche'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (m:Milestone {name: 'Hold Full Front Lever for 10 Seconds'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (m:Milestone {name: 'Complete 50 Consecutive Pull-Ups'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (m:Milestone {name: 'Complete 3 One-Arm Pull-Ups'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Calisthenics Master'})
MATCH (m:Milestone {name: 'Master Complex Movement Combinations'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// COMPONENT PREREQUISITES: Knowledge Prerequisites
// ============================================================

MATCH (k1:Knowledge {name: 'Basic Progression Strategies'})
MATCH (k2:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Muscle Groups and Anatomy'})
MATCH (k2:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
MATCH (k2:Knowledge {name: 'Basic Bodyweight Exercise Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Periodized Training Planning'})
MATCH (k2:Knowledge {name: 'Rest and Recovery Principles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Volume and Intensity Balance'})
MATCH (k2:Knowledge {name: 'Periodized Training Planning'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Movement Quality and Efficiency'})
MATCH (k2:Knowledge {name: 'Calisthenics Proper Form and Technique'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Leverage Manipulation and Variation Design'})
MATCH (k2:Knowledge {name: 'Leverage Principles in Bodyweight Training'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Biomechanical Analysis of Movement'})
MATCH (k2:Knowledge {name: 'Muscle Groups and Anatomy'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Calisthenics Coaching and Teaching Methodology'})
MATCH (k2:Knowledge {name: 'Calisthenics Proper Form and Technique'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Individualized Programming and Assessment'})
MATCH (k2:Knowledge {name: 'Periodized Training Planning'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// ============================================================
// COMPONENT PREREQUISITES: Skill Prerequisites
// ============================================================

MATCH (s1:Skill {name: 'Dip Progression and Strength'})
MATCH (s2:Skill {name: 'Push-Up Form Mastery'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Muscle-Up Progression'})
MATCH (s2:Skill {name: 'Pull-Up Development'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muscle-Up Progression'})
MATCH (s2:Skill {name: 'Dip Progression and Strength'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Isometric Strength Holds'})
MATCH (s2:Skill {name: 'Core Strength and Stability'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Handstand Balance and Control'})
MATCH (s2:Skill {name: 'Body Awareness and Coordination'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Handstand Balance and Control'})
MATCH (s2:Skill {name: 'Calisthenics Flexibility and Mobility'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Dynamic Movements and Power Expression'})
MATCH (s2:Skill {name: 'Push-Up Form Mastery'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Progressive Overload and Training Phases'})
MATCH (k:Knowledge {name: 'Basic Progression Strategies'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Injury Prevention and Self-Assessment'})
MATCH (k:Knowledge {name: 'Distinguishing Pain and Soreness'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Training Recovery and Adaptation Management'})
MATCH (k:Knowledge {name: 'Rest and Recovery Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

// ============================================================
// COMPONENT PREREQUISITES: Milestone Prerequisites
// ============================================================

MATCH (m1:Milestone {name: 'Complete 10 Consecutive Push-Ups'})
MATCH (m2:Milestone {name: 'Complete First Full Push-Up'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Full Pull-Up'})
MATCH (m2:Milestone {name: 'Achieve 30-Second Dead Hang'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
MATCH (m2:Milestone {name: 'Complete First Full Pull-Up'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
MATCH (m2:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 50 Consecutive Pull-Ups'})
MATCH (m2:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Full Dip'})
MATCH (m2:Milestone {name: 'Complete First Full Push-Up'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 30 Consecutive Dips'})
MATCH (m2:Milestone {name: 'Complete First Full Dip'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Muscle-Up'})
MATCH (m2:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Muscle-Up'})
MATCH (m2:Milestone {name: 'Complete First Full Dip'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 5 Consecutive Muscle-Ups'})
MATCH (m2:Milestone {name: 'Complete First Muscle-Up'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Assisted Pistol Squat'})
MATCH (m2:Milestone {name: 'Complete 15 Quality Bodyweight Squats'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete Single-Leg Pistol Squat'})
MATCH (m2:Milestone {name: 'Complete First Assisted Pistol Squat'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold Free-Standing Handstand for 10 Seconds'})
MATCH (m2:Milestone {name: 'Hold Plank Position for 1 Minute'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Walk 20+ Meters in Handstand'})
MATCH (m2:Milestone {name: 'Hold Free-Standing Handstand for 10 Seconds'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold L-Sit for 15 Seconds'})
MATCH (m2:Milestone {name: 'Hold Plank Position for 1 Minute'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold 10-Second Planche Lean'})
MATCH (m2:Milestone {name: 'Hold L-Sit for 15 Seconds'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold 5-Second Full Planche'})
MATCH (m2:Milestone {name: 'Hold 10-Second Planche Lean'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold 15-Second Front Lever Progression'})
MATCH (m2:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold Full Front Lever for 10 Seconds'})
MATCH (m2:Milestone {name: 'Hold 15-Second Front Lever Progression'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold Back Lever for 5 Seconds'})
MATCH (m2:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'One-Arm Pull-Up Progression (Archer Hold)'})
MATCH (m2:Milestone {name: 'Complete 20 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete 3 One-Arm Pull-Ups'})
MATCH (m2:Milestone {name: 'One-Arm Pull-Up Progression (Archer Hold)'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hold Human Flag for 10 Seconds'})
MATCH (m2:Milestone {name: 'Hold L-Sit for 15 Seconds'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Complex Movement Combinations'})
MATCH (m2:Milestone {name: 'Complete First Muscle-Up'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Complex Movement Combinations'})
MATCH (m2:Milestone {name: 'Hold Free-Standing Handstand for 10 Seconds'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Teach Others Basic Calisthenics'})
MATCH (m2:Milestone {name: 'Complete 10 Consecutive Push-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Teach Others Basic Calisthenics'})
MATCH (m2:Milestone {name: 'Complete 5 Consecutive Pull-Ups'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);
