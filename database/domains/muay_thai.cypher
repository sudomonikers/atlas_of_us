// Domain: Muay Thai
// Generated: 2025-11-15
// Description: The art of 8 limbs - traditional Thai martial art utilizing fists, elbows, knees, and shins

// ============================================================
// DOMAIN: Muay Thai
// Generated: 2025-11-15
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Muay Thai',
  description: 'The art of 8 limbs - a traditional Thai martial art that utilizes fists, elbows, knees, and shins as weapons. Muay Thai combines striking techniques, footwork, clinching, and defensive strategies with deep cultural and spiritual roots in Thai tradition.',
  level_count: 5,
  created_date: date(),
  scope_included: ['striking techniques with fists', 'elbow strikes and defenses', 'knee strikes and clinching', 'shin kicks and leg techniques', 'stance and footwork', 'clinching and grappling', 'defensive techniques and countering', 'ring movement and distance management', 'conditioning and endurance', 'ringcraft and strategy', 'cultural aspects and respect traditions', 'pad work and heavy bag training'],
  scope_excluded: ['general boxing (separate domain)', 'wrestling (separate domain - focus on grappling)', 'kickboxing (related but distinct - different rules and emphasis)', 'general hand-to-hand combat (broader domain)', 'strength and conditioning training (separate domain)', 'meditation and yoga (separate domains - though culturally connected)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  domain: 'Muay Thai',
  level: 1,
  name: 'Novice',
  description: 'Learning fundamental stances, basic strikes with fists and shins, simple combinations, and safety protocols. Can perform basic techniques under supervision with limited control and power.'
});

CREATE (level2:Domain_Level {
  domain: 'Muay Thai',
  level: 2,
  name: 'Developing',
  description: 'Expanding to include elbow and knee strikes, improving footwork and distance management, developing basic clinching skills, and executing multi-strike combinations. Can train independently but lacks ring experience.'
});

CREATE (level3:Domain_Level {
  domain: 'Muay Thai',
  level: 3,
  name: 'Competent',
  description: 'Solid technical foundation across all 8 limbs, effective use of clinch and defensive techniques, good conditioning and ring awareness. Can spar at moderate intensity and handle sparring partners with similar skill levels.'
});

CREATE (level4:Domain_Level {
  domain: 'Muay Thai',
  level: 4,
  name: 'Advanced',
  description: 'High-level technical proficiency, strategic fight awareness, effective use of advanced combinations and feints, strong clinch control. Can compete in amateur matches, mentor developing fighters, and adapt strategy against various opponents.'
});

CREATE (level5:Domain_Level {
  domain: 'Muay Thai',
  level: 5,
  name: 'Master',
  description: 'Expert-level mastery of all aspects of Muay Thai, fluidity across all techniques, deep understanding of strategy and ring psychology. Competes at professional levels or demonstrates exceptional teaching ability, contributing to the advancement and preservation of the art.'
});

// Connect Domain to Levels
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// FOUNDATIONAL KNOWLEDGE (Novice Level)

MERGE (k_stance:Knowledge {name: 'Muay Thai Stance Fundamentals'})
SET k_stance.description = 'The foundation of all Muay Thai movement - proper body positioning, weight distribution, balance, and alignment. A correct stance enables efficient striking, movement, and defense while preventing injury.',
    k_stance.how_to_learn = 'Work with a qualified instructor for 2-4 weeks focusing on stance drills. Practice stance switches daily for 10-15 minutes. Watch professional fighters and compare your stance alignment. Use mirrors or video recording to self-correct. Time investment: 1-2 months of regular practice.',
    k_stance.remember_level = 'Recall the fundamental stance position: feet shoulder-width apart, front foot forward at 45 degrees, rear foot squared, knees slightly bent, weight on balls of feet, hands guarding face, chin tucked',
    k_stance.understand_level = 'Explain why each element of proper stance is important - how weight distribution affects balance, why bent knees maintain agility, how hand position provides defense',
    k_stance.apply_level = 'Assume a proper fighting stance in any training scenario. Maintain stance while moving forward, backward, and laterally. Keep stance stable while throwing strikes.',
    k_stance.analyze_level = 'Analyze your own stance positioning versus professional fighters. Identify stance errors in beginners and understand how those errors lead to poor technique or injury risk.',
    k_stance.evaluate_level = 'Evaluate whether a particular stance variation is appropriate for a fighter\'s body type and fighting style. Judge the effectiveness of stance choices in match footage.',
    k_stance.create_level = 'Develop a personal stance variation that optimizes for your physical attributes. Create stance drills for beginners that progressively build stability and muscle memory.';

MERGE (k_guard:Knowledge {name: 'Hand Guard and Head Movement'})
SET k_guard.description = 'Defensive positioning of hands and head to protect against strikes. Proper guard prevents injury, maintains balance, and sets up counters. Head movement creates evasion and distance.',
    k_guard.how_to_learn = 'Begin with heavy bag work focusing on guard positioning for 2 weeks. Practice shadow boxing with conscious hand placement. Work with pads where instructors call combinations you must defend against. Expected time: 1-2 months for solid fundamentals.',
    k_guard.remember_level = 'Recall basic guard positions: hands up protecting the face, elbows in protecting the body, chin tucked, ready to slip and weave',
    k_guard.understand_level = 'Explain why guard positioning prevents specific strikes and injuries. Describe how different guard styles (high guard, low guard) address different threats.',
    k_guard.apply_level = 'Maintain proper guard while throwing strikes. Keep guard tight during combinations. React instinctively to incoming strikes by raising guard.',
    k_guard.analyze_level = 'Analyze guard weaknesses in your style - where do you get caught? Compare guard styles of fighters with different strategies.',
    k_guard.evaluate_level = 'Determine appropriate guard height and positioning for specific opponents or situations. Judge effectiveness of guard positioning in match footage.',
    k_guard.create_level = 'Develop personal guard variations suited to your body geometry and fighting style. Create defensive drills addressing your specific weaknesses.';

MERGE (k_punches:Knowledge {name: 'Basic Punch Techniques'})
SET k_punches.description = 'Fundamental striking techniques using the fists: jab, cross, hook, and uppercut. These are the foundation of Muay Thai hand striking.',
    k_punches.how_to_learn = 'Heavy bag training 2-3 times per week for 4-6 weeks. Work with pads held by an instructor. Shadow boxing daily. Video analysis of punch mechanics. Expected time: 1-2 months for basic competence.',
    k_punches.remember_level = 'Recall the basic punches: jab (quick rear hand), cross (power punch from rear shoulder), hook (circular arm movement), uppercut (rising punch from below)',
    k_punches.understand_level = 'Explain proper mechanics for each punch - hip rotation, shoulder engagement, weight transfer, hand path. Describe appropriate situations for each punch type.',
    k_punches.apply_level = 'Execute jabs accurately at targets. Throw crosses with hip rotation. Perform hooks and uppercuts with proper form. Combine punches into 2-3 punch combinations.',
    k_punches.analyze_level = 'Analyze your punch mechanics on video. Identify which punches feel powerful and which feel weak. Understand relationship between stance and punch power.',
    k_punches.evaluate_level = 'Judge when each punch is most effective against different opponents. Evaluate efficiency of punch selection in match footage.',
    k_punches.create_level = 'Develop signature punch variations suited to your speed and power profile. Design punch combinations that flow naturally from your fighting style.';

MERGE (k_kicks:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
SET k_kicks.description = 'Basic kicking techniques using the shin - the fundamental striking tool in Muay Thai. Shin kicks target legs, body, and head using the hard edge of the tibia bone.',
    k_kicks.how_to_learn = 'Heavy bag and pad work 3-4 times per week for 6-8 weeks. Develop leg flexibility through stretching. Practice kick mechanics on heavybag focusing on shin contact. Expected time: 2-3 months for basic competence.',
    k_kicks.remember_level = 'Recall basic kicks: low kick (targeting outer thigh), body kick (targeting ribs and body), head kick (targeting temple or head)',
    k_kicks.understand_level = 'Explain proper shin kick mechanics - timing, hip rotation, balance, weight transfer. Describe why shin conditioning is necessary.',
    k_kicks.apply_level = 'Execute low kicks with proper form. Deliver body kicks maintaining balance. Throw head kicks when opponent is in range.',
    k_kicks.analyze_level = 'Analyze kick power and accuracy in your training. Identify range control issues in your kicking. Compare kicking styles of different fighters.',
    k_kicks.evaluate_level = 'Judge appropriate kick selection based on opponent distance and positioning. Evaluate vulnerability created by kicking at various ranges.',
    k_kicks.create_level = 'Develop personal kick variations with preferred angles. Design offensive sequences emphasizing your kicking strengths.';

MERGE (k_basics_combo:Knowledge {name: 'Basic Combination Theory'})
SET k_basics_combo.description = 'Understanding how to chain strikes together in logical sequences. Combinations flow from stance, use timing and weight transfer, and set up subsequent techniques.',
    k_basics_combo.how_to_learn = 'Pad work with instructor 2-3 times weekly. Shadow boxing drilling specific combinations. Heavy bag work applying combinations. Expected time: 1 month of focused training.',
    k_basics_combo.remember_level = 'Recall basic two and three-strike combinations: jab-cross, jab-cross-hook, kick-punch combinations',
    k_basics_combo.understand_level = 'Explain why combinations are more effective than single strikes. Describe how weight transfer flows between strikes in a combination.',
    k_basics_combo.apply_level = 'Execute 2-3 strike combinations fluently. Apply combinations on pads and heavybag. Throw combinations in light sparring.',
    k_basics_combo.analyze_level = 'Analyze combination flow on video. Identify gaps in footwork or balance between strikes. Compare how different fighters chain techniques.',
    k_basics_combo.evaluate_level = 'Determine effective combinations against different opponent styles. Judge whether a combination setup will work in real situations.',
    k_basics_combo.create_level = 'Develop personal combination sequences. Create progressively complex combinations building from simple structures.';

MERGE (k_safety:Knowledge {name: 'Muay Thai Safety and Injury Prevention'})
SET k_safety.description = 'Understanding proper protective equipment, injury prevention strategies, and safe training practices. Critical for long-term participation without permanent damage.',
    k_safety.how_to_learn = 'Formal instruction from gym coaches. Read safety guidelines from established Muay Thai organizations. Experience under supervision with feedback on form. Expected time: Ongoing throughout training.',
    k_safety.remember_level = 'Recall essential protective equipment: hand wraps, boxing gloves, mouthguard, groin protection, shin guards. Remember key injury prevention principles.',
    k_safety.understand_level = 'Explain why each protective device is necessary. Describe common injuries and their causes. Understand proper hand wrapping and tape techniques.',
    k_safety.apply_level = 'Correctly wrap hands and tape wrists. Use proper protective gear every training session. Perform warm-up and cool-down routines.',
    k_safety.analyze_level = 'Identify poor technique that could lead to injuries. Recognize signs of overtraining. Analyze injury risk in different drill types.',
    k_safety.evaluate_level = 'Determine appropriate intensity levels for training goals. Judge whether equipment setup is adequate for the training being done.',
    k_safety.create_level = 'Design personalized warm-up and injury prevention routines. Create injury prevention strategies for specific vulnerabilities.';

// CORE KNOWLEDGE (Developing/Competent Levels)

MERGE (k_clinch:Knowledge {name: 'Clinching Techniques and Control'})
SET k_clinch.description = 'Close-range grappling where fighters control each other with arms around neck, shoulders, or hips. Clinching allows knee strikes and creates dominant position.',
    k_clinch.how_to_learn = 'Clinch work with partner 2-3 times weekly for 8-12 weeks. Start with cooperative drills then increase resistance. Practice clinching combinations. Expected time: 2-3 months for solid skills.',
    k_clinch.remember_level = 'Recall clinch positions: neck clinch (both hands behind neck), collar tie (one hand behind neck), plum clinch (both hands interlaced behind neck), underhook clinch',
    k_clinch.understand_level = 'Explain how each clinch position creates advantages. Describe how to control balance in clinch. Understand how to transition between clinch positions.',
    k_clinch.apply_level = 'Enter clinch safely from distance. Control opponent balance in clinch. Throw knee strikes from clinch. Exit clinch when needed.',
    k_clinch.analyze_level = 'Analyze clinch positioning and balance management. Identify which clinch position dominates specific opponent types. Understand when to use clinch strategically.',
    k_clinch.evaluate_level = 'Judge strength of your clinch position. Evaluate opponent\'s clinch breaks and develop counters. Determine clinch strategy versus different fighters.',
    k_clinch.create_level = 'Develop personal clinch variations. Create complex clinch transition sequences. Design clinch-based fight tactics.';

MERGE (k_knee:Knowledge {name: 'Knee Strike Techniques'})
SET k_knee.description = 'Powerful striking techniques using the knee. Knee strikes are devastating in close range, particularly in clinch. Part of the "8 limbs" of Muay Thai.',
    k_knee.how_to_learn = 'Clinch work on pads with partner 2-3 times weekly. Heavy bag knee drills. Partner drills emphasizing range and timing. Expected time: 2-3 months for proficiency.',
    k_knee.remember_level = 'Recall basic knee strikes: straight knee (drive from hip), curved knee (angled strike), spinning knee (rotating entry)',
    k_knee.understand_level = 'Explain proper mechanics for knee strikes. Describe appropriate range for knee techniques. Understand difference between forward knee and curved knee.',
    k_knee.apply_level = 'Throw accurate knee strikes from clinch. Execute knee drives maintaining proper distance. Throw knee strikes in combinations.',
    k_knee.analyze_level = 'Analyze knee strike timing and range. Identify setup techniques that enable knee strikes. Compare knee strike effectiveness across opponent types.',
    k_knee.evaluate_level = 'Judge when to use knee versus other techniques. Evaluate knee strike setup visibility and opponent counters.',
    k_knee.create_level = 'Develop signature knee strike combinations. Create clinch sequences emphasizing knee strikes.';

MERGE (k_elbow:Knowledge {name: 'Elbow Strike Techniques'})
SET k_elbow.description = 'Strikes delivered with the elbow - a sharp, hard striking surface. Elbows are effective at close-to-medium range and are particularly devastating for cuts.',
    k_elbow.how_to_learn = 'Pad work with partner 2-3 times weekly. Heavy bag elbow drills. Light sparring focusing on elbow placement. Expected time: 2-3 months for solid mechanics.',
    k_elbow.remember_level = 'Recall basic elbow strikes: horizontal elbow (sideways swing), vertical elbow (downward strike), spinning elbow (rotating entry), diagonal elbow (angled strike)',
    k_elbow.understand_level = 'Explain when each elbow strike is most appropriate. Describe range and timing requirements. Understand vulnerability created by elbow strikes.',
    k_elbow.apply_level = 'Execute elbows accurately on pads. Throw elbows in combinations. Incorporate elbows into clinch work.',
    k_elbow.analyze_level = 'Analyze elbow strike setup and entry. Identify range where elbows are effective. Understand gap in opponent defense when elbows are thrown.',
    k_elbow.evaluate_level = 'Judge when to use elbows versus fists. Evaluate risk-reward of elbow techniques against specific opponents.',
    k_elbow.create_level = 'Develop personal elbow strike variations. Create elbow-based fighting strategies.';

MERGE (k_footwork:Knowledge {name: 'Advanced Footwork and Ring Movement'})
SET k_footwork.description = 'Efficient movement patterns in the ring - creating angles, controlling distance, cutting off opponents. Footwork enables both offensive and defensive success.',
    k_footwork.how_to_learn = 'Shadow boxing 3-4 times weekly focusing on footwork. Pad work emphasizing angles and positioning. Sparring with focus on movement rather than striking. Expected time: 3-4 months.',
    k_footwork.remember_level = 'Recall basic footwork patterns: step forward, step back, lateral shuffle, pivot, angled entry',
    k_footwork.understand_level = 'Explain how footwork creates striking opportunities. Describe defensive footwork for evasion and distance management. Understand concepts of angles and positioning.',
    k_footwork.apply_level = 'Execute smooth forward and backward movement. Create attacking angles using footwork. Defend using lateral movement and positioning.',
    k_footwork.analyze_level = 'Analyze footwork efficiency - unnecessary steps, weight on wrong foot, poor balance. Compare footwork of fighters with different styles.',
    k_footwork.evaluate_level = 'Judge appropriate positioning against different fighters. Determine best angles for your strengths versus opponent weaknesses.',
    k_footwork.create_level = 'Develop personal movement patterns suited to your style. Create footwork drills addressing your specific movement deficiencies.';

MERGE (k_distance:Knowledge {name: 'Distance Management and Range Control'})
SET k_distance.description = 'Understanding different fighting ranges (long, medium, close) and controlling which range the fight occurs at. Distance management is fundamental to strategy.',
    k_distance.how_to_learn = 'Sparring practice 2-3 times weekly with focus on range. Pad work varying distance. Study fighters who excel at range control. Expected time: 3-4 months with emphasis.',
    k_distance.remember_level = 'Recall different fighting ranges: long range (kicks), medium range (punches), close range (clinch, elbows, knees)',
    k_distance.understand_level = 'Explain how each range enables different techniques. Describe how to control range through footwork and positioning. Understand range advantage and disadvantage.',
    k_distance.apply_level = 'Maintain your preferred fighting distance during sparring. Prevent opponents from establishing optimal range. Transition smoothly between ranges.',
    k_distance.analyze_level = 'Analyze range control patterns in fights. Identify where opponents escape your range. Understand timing of range transitions.',
    k_distance.evaluate_level = 'Judge which range is most advantageous for you versus specific opponents. Determine whether to maintain or change distance during fights.',
    k_distance.create_level = 'Develop personal range control strategies. Create distance management tactics for your fighting style.';

MERGE (k_combinations:Knowledge {name: 'Advanced Combination Sequencing'})
SET k_combinations.description = 'Complex strike combinations flowing from multiple limbs, integrating clinch work, varying tempo, and creating offensive pressure. Moving beyond simple 2-3 strike chains.',
    k_combinations.how_to_learn = 'Pad work 3-4 times weekly focusing on combination flow. Heavy bag work drilling complex sequences. Light sparring applying combinations. Expected time: 3-4 months.',
    k_combinations.remember_level = 'Recall 4+ strike combinations integrating different limbs. Remember common combination patterns used by professionals.',
    k_combinations.understand_level = 'Explain why certain combinations flow together smoothly. Describe how stance and weight transfer enable combinations. Understand tempo variation in combinations.',
    k_combinations.apply_level = 'Execute complex combinations fluently on pads and heavy bag. Apply combinations in light sparring.',
    k_combinations.analyze_level = 'Analyze combination flow on video. Identify balance and weight transfer efficiency. Compare combination styles of different fighters.',
    k_combinations.evaluate_level = 'Judge whether a combination will work against a particular opponent defense. Determine which combinations are most effective for your style.',
    k_combinations.create_level = 'Develop personal combination sequences. Create flowing combinations from various starting positions.';

MERGE (k_defense:Knowledge {name: 'Defensive Techniques and Countering'})
SET k_defense.description = 'Protecting yourself from strikes: blocking, parrying, slipping, weaving, and rolling. Effective defense enables safe offense and creates counter opportunities.',
    k_defense.how_to_learn = 'Pad work with partner calling strikes you must defend. Light sparring focusing on defense. Video analysis of defensive mechanics. Expected time: 3-4 months with emphasis.',
    k_defense.remember_level = 'Recall defensive techniques: high block, low block, parry, slip, weave, roll, check kick defense',
    k_defense.understand_level = 'Explain when each defensive technique is appropriate. Describe how to transition defense into offense. Understand defensive positioning principles.',
    k_defense.apply_level = 'Execute various defensive techniques smoothly. React instinctively with appropriate defense. Transition from defense to counter-attack.',
    k_defense.analyze_level = 'Analyze your defensive weaknesses. Identify which defenses work well against specific attacks. Compare defensive styles of fighters.',
    k_defense.evaluate_level = 'Judge appropriate defensive strategy against different opponents. Determine when offense should yield to defense.',
    k_defense.create_level = 'Develop personal defensive style. Create defensive drills addressing your specific vulnerabilities.';

MERGE (k_conditioning:Knowledge {name: 'Muay Thai Training Conditioning and Fitness'})
SET k_conditioning.description = 'Physical conditioning specific to Muay Thai - developing the endurance, power, and explosive strength needed for multiple rounds of intense fighting.',
    k_conditioning.how_to_learn = 'Structured conditioning training 4-5 times weekly. Heavy bag work with interval training. Roadwork and running. Core and functional strength work. Expected time: Ongoing, 3-6 months for solid base.',
    k_conditioning.remember_level = 'Recall key Muay Thai conditioning exercises: heavy bag work, pad work, running, burpees, core exercises. Remember importance of recovery and rest days.',
    k_conditioning.understand_level = 'Explain aerobic versus anaerobic conditioning needs. Describe energy systems required for 5-round fights. Understand how fatigue affects technique.',
    k_conditioning.apply_level = 'Execute structured conditioning routines. Maintain intensity during training sessions. Recover appropriately between training days.',
    k_conditioning.analyze_level = 'Analyze your conditioning level during training. Identify when technique breakdown occurs due to fatigue. Understand personal conditioning gaps.',
    k_conditioning.evaluate_level = 'Judge appropriate training intensity for your current fitness level. Determine conditioning priorities for your goals.',
    k_conditioning.create_level = 'Develop personalized conditioning programs. Design training cycles that progressively build fitness.';

// ADVANCED KNOWLEDGE (Advanced Level)

MERGE (k_strategy:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
SET k_strategy.description = 'Strategic thinking about fights - studying opponents, adapting game plans, creating advantages through positioning and pacing, understanding fight psychology and mental tactics.',
    k_strategy.how_to_learn = 'Study professional fight footage 4-5 times weekly. Practice sparring with varied opponents. Work with coaches analyzing styles. Expected time: 6-12 months with serious study.',
    k_strategy.remember_level = 'Recall strategic principles: capitalize on strength, limit opponent strength, control pace, manage energy, adapt to resistance',
    k_strategy.understand_level = 'Explain how different body types enable different strategies. Describe how to identify opponent patterns and tendencies. Understand strategic trade-offs.',
    k_strategy.apply_level = 'Develop game plans for sparring partners. Adjust strategy when initial approach fails. Execute strategic decisions in sparring.',
    k_strategy.analyze_level = 'Analyze strategic approaches in professional fights. Break down how top fighters implement strategy. Understand strategic patterns and counters.',
    k_strategy.evaluate_level = 'Judge effectiveness of strategies against specific opponent types. Evaluate your own strategic decision-making in fights.',
    k_strategy.create_level = 'Develop advanced strategic approaches suited to your fighting style and physical attributes. Create innovative strategic sequences.';

MERGE (k_advanced_combos:Knowledge {name: 'Complex Multi-Phase Combinations with Feints'})
SET k_advanced_combos.description = 'Sophisticated combination structures using feints, direction changes, and multiple phases. These combinations set traps and exploit defensive reactions.',
    k_advanced_combos.how_to_learn = 'Advanced pad work 3-4 times weekly. Study professional combination sequences. Apply combinations in advanced sparring. Expected time: 6-12 months.',
    k_advanced_combos.remember_level = 'Recall complex multi-phase combinations with feints and directional changes. Remember how feints manipulate opponent defense.',
    k_advanced_combos.understand_level = 'Explain how feints create defensive reactions you can exploit. Describe multi-phase combination structure. Understand timing of combination phases.',
    k_advanced_combos.apply_level = 'Execute complex combinations with feints in sparring. Apply feints that manipulate opponent movement. Execute multi-phase combinations.',
    k_advanced_combos.analyze_level = 'Analyze combination effectiveness of professionals. Identify which feints work against different fighters. Break down multi-phase structure.',
    k_advanced_combos.evaluate_level = 'Judge which combination variations work best for you. Evaluate feint effectiveness in your sparring.',
    k_advanced_combos.create_level = 'Design sophisticated combination sequences. Create feint-based combinations exploiting specific opponent patterns.';

MERGE (k_pressure:Knowledge {name: 'Pressure Fighting and Ring Control'})
SET k_pressure.description = 'Dominant ring control through aggressive movement, positioning, and constant activity. Pressure fighters push opponents back, dictate range, and control fight pace.',
    k_pressure.how_to_learn = 'Study pressure fighting styles in professional footage. Practice aggressive footwork. Sparring with emphasis on forward pressure. Expected time: 6-12 months.',
    k_pressure.remember_level = 'Recall pressure fighting principles: stay within range, constant forward movement, dictate distance and pace, maintain activity',
    k_pressure.understand_level = 'Explain how pressure breaks down opponent composure. Describe how to maintain safe aggression. Understand endurance demands of pressure fighting.',
    k_pressure.apply_level = 'Apply aggressive forward pressure in sparring. Maintain range control through pressing. Dictate pace through constant activity.',
    k_pressure.analyze_level = 'Analyze how pressure fighters dominate opponents. Understand opponent reactions to sustained pressure. Identify pressure limits.',
    k_pressure.evaluate_level = 'Judge whether pressure fighting suits your style and attributes. Evaluate endurance requirements of pressure approach.',
    k_pressure.create_level = 'Develop personal pressure fighting approach. Create pressure strategies exploiting your strengths.';

MERGE (k_counter:Knowledge {name: 'Advanced Countering and Defensive Offense'})
SET k_counter.description = 'Strategic defensive techniques that transition into offense - countering opponent attacks with strikes. Creates offensive opportunities while maintaining defensive integrity.',
    k_counter.how_to_learn = 'Pad work with partner throwing at you 3-4 times weekly. Defensive sparring sessions. Study counter techniques of professionals. Expected time: 6-12 months.',
    k_counter.remember_level = 'Recall counter sequences - defending against different attacks and responding with appropriate counters',
    k_counter.understand_level = 'Explain timing and distance of effective counters. Describe how to read opponent attacks and commit to counters early. Understand risk-reward of countering.',
    k_counter.apply_level = 'Read incoming attacks and counter effectively. Execute counters with proper timing. Chain counters together in sparring.',
    k_counter.analyze_level = 'Analyze counter effectiveness in professional fights. Identify counter opportunities in sparring footage. Compare counter styles of different fighters.',
    k_counter.evaluate_level = 'Judge whether to counter or defend based on situation. Evaluate counter effectiveness against specific opponent styles.',
    k_counter.create_level = 'Develop personal counter arsenal. Create counter combinations suited to your defense style.';

MERGE (k_clinch_advanced:Knowledge {name: 'Advanced Clinch Dominance and Sweeps'})
SET k_clinch_advanced.description = 'Expert-level clinch control with advanced position transitions and techniques. Includes clinch sweeps and advanced entries for dominant positioning.',
    k_clinch_advanced.how_to_learn = 'Advanced clinch work 2-3 times weekly with strong partners. Study clinch techniques of professional fighters. Supervised practice with feedback. Expected time: 12+ months.',
    k_clinch_advanced.remember_level = 'Recall advanced clinch positions and transitions. Remember clinch sweep techniques and entries.',
    k_clinch_advanced.understand_level = 'Explain how advanced clinch positions create specific advantages. Describe timing and setup for clinch sweeps. Understand advanced position transitions.',
    k_clinch_advanced.apply_level = 'Execute advanced clinch techniques against strong resistance. Perform clinch sweeps and transitions smoothly. Maintain control in advanced clinch positions.',
    k_clinch_advanced.analyze_level = 'Analyze clinch dominance patterns in professional fights. Identify advanced position vulnerabilities. Compare clinch styles of different fighters.',
    k_clinch_advanced.evaluate_level = 'Judge appropriate advanced clinch positions for specific situations. Evaluate clinch technique effectiveness versus resistant opponents.',
    k_clinch_advanced.create_level = 'Develop advanced clinch sequences and transitions. Create complex clinch strategies.';

MERGE (k_angles:Knowledge {name: 'Advanced Angles and Position Creation'})
SET k_angles.description = 'Strategic use of footwork and movement to create angles where you have advantages and opponent has limitations. Creates opportunities that don\'t exist when fighting square.',
    k_angles.how_to_learn = 'Advanced footwork drills 3-4 times weekly. Sparring with focus on angle creation. Video analysis of angle techniques. Expected time: 6-12 months.',
    k_angles.remember_level = 'Recall angle creation techniques and principles. Remember how angles create striking advantages.',
    k_angles.understand_level = 'Explain how angles limit opponent options. Describe geometric positioning advantages. Understand how to create angles through footwork.',
    k_angles.apply_level = 'Execute smooth angle creation during sparring. Maintain angles while striking. Escape when opponent establishes angles on you.',
    k_angles.analyze_level = 'Analyze how top fighters use angles. Identify your angle creation limitations. Understand opponent angle strategies.',
    k_angles.evaluate_level = 'Judge whether current position has good angles. Determine whether to move or attack in various positions.',
    k_angles.create_level = 'Develop personal angle creation strategies. Create footwork sequences that establish advantageous angles.';

// SPECIALIZED KNOWLEDGE (Master Level)

MERGE (k_master_philosophy:Knowledge {name: 'Muay Thai Philosophy and Cultural Understanding'})
SET k_master_philosophy.description = 'Deep understanding of Muay Thai\'s cultural roots, spiritual significance, and philosophical principles. Understanding respect traditions (wai kru), the role of Muay Thai in Thai culture, and the way of the warrior.',
    k_master_philosophy.how_to_learn = 'Study Thai culture and history. Learn from experienced Thai trainers and masters. Read extensively about Muay Thai history and philosophy. Travel to Thailand if possible. Expected time: Years of ongoing study.',
    k_master_philosophy.remember_level = 'Recall historical origins of Muay Thai. Remember cultural traditions and respect protocols. Know significant figures and historical developments.',
    k_master_philosophy.understand_level = 'Explain the spiritual and cultural significance of Muay Thai. Describe the philosophy of respect and discipline central to the art. Understand relationship between tradition and modern practice.',
    k_master_philosophy.apply_level = 'Perform respect ceremonies with cultural understanding. Train with mindfulness of Muay Thai\'s spiritual aspects. Conduct yourself with discipline and respect.',
    k_master_philosophy.analyze_level = 'Analyze how cultural understanding influences training effectiveness. Break down relationship between philosophy and technique. Understand different philosophical approaches.',
    k_master_philosophy.evaluate_level = 'Judge how well practitioners embody Muay Thai\'s philosophy. Evaluate balance between traditional respect and modern effectiveness.',
    k_master_philosophy.create_level = 'Articulate personal philosophy integrating Muay Thai principles. Teach cultural aspects to students. Contribute to preservation of authentic traditions.';

MERGE (k_master_pedagogy:Knowledge {name: 'Advanced Teaching and Knowledge Transmission'})
SET k_master_pedagogy.description = 'Expert-level teaching ability - explaining complex techniques clearly, developing personalized progressions, identifying student learning patterns, and adapting instruction to different learning styles.',
    k_master_pedagogy.how_to_learn = 'Extensive teaching experience with feedback. Study pedagogy and learning science. Observe master trainers teaching. Expected time: Years of hands-on teaching.',
    k_master_pedagogy.remember_level = 'Recall different learning styles and how to identify them. Remember progression sequences for different student levels.',
    k_master_pedagogy.understand_level = 'Explain how to break down complex techniques into learnable components. Describe how to identify and correct movement errors. Understand psychological aspects of learning.',
    k_master_pedagogy.apply_level = 'Teach complex techniques clearly to students of various levels. Design personalized training progressions. Provide effective feedback that improves performance.',
    k_master_pedagogy.analyze_level = 'Analyze student movement patterns to identify specific issues. Break down your own teaching effectiveness. Understand what works for different student types.',
    k_master_pedagogy.evaluate_level = 'Judge effectiveness of different teaching approaches. Evaluate whether student is ready for progression. Determine best learning sequence for individual.',
    k_master_pedagogy.create_level = 'Develop innovative teaching methodologies. Create comprehensive curriculum for different skill levels. Design student progressions optimized for individual development.';

MERGE (k_cutting_edge:Knowledge {name: 'Cutting-Edge Developments and Innovation in Muay Thai'})
SET k_cutting_edge.description = 'Understanding modern evolutions of Muay Thai techniques, training methods, and strategy. International variations, innovations from top-level competition, and emerging trends.',
    k_cutting_edge.how_to_learn = 'Follow professional Muay Thai competition closely. Study training methods of elite fighters. Experiment with innovative approaches in training. Expected time: Ongoing learning.',
    k_cutting_edge.remember_level = 'Recall recent innovations and developments in technique. Remember modern training methodologies and approaches.',
    k_cutting_edge.understand_level = 'Explain how modern techniques differ from traditional approaches. Describe innovations in training methods. Understand advantages and disadvantages of modern variations.',
    k_cutting_edge.apply_level = 'Implement modern techniques and training methods. Experiment with innovative approaches in your training.',
    k_cutting_edge.analyze_level = 'Analyze effectiveness of modern innovations. Identify which innovations work well for specific purposes. Understand limitations of different approaches.',
    k_cutting_edge.evaluate_level = 'Judge whether innovations represent genuine improvements or trends. Evaluate whether innovations are appropriate for your goals and style.',
    k_cutting_edge.create_level = 'Develop personal innovations in technique and training. Contribute to evolution of Muay Thai practice. Create original technical approaches.';

MERGE (k_ring_psychology:Knowledge {name: 'Ring Psychology and Mental Mastery'})
SET k_ring_psychology.description = 'Advanced understanding of psychology in Muay Thai - managing fear and pressure, maintaining composure, psychological warfare, confidence, and mental conditioning for peak performance.',
    k_ring_psychology.how_to_learn = 'Sports psychology study. Competition experience. Mental conditioning practice. Work with coaches on mental aspects. Expected time: Years of experience and study.',
    k_ring_psychology.remember_level = 'Recall mental techniques for managing pressure. Remember confidence-building approaches. Know psychological principles affecting performance.',
    k_ring_psychology.understand_level = 'Explain how mental state affects performance. Describe psychological principles of confidence and composure. Understand opponent psychology.',
    k_ring_psychology.apply_level = 'Manage nervousness and pressure effectively. Maintain confidence and composure in difficult moments. Apply psychological tactics in competition.',
    k_ring_psychology.analyze_level = 'Analyze how mental state influences technique and decision-making. Identify psychological patterns in opponents. Understand personal mental strengths and weaknesses.',
    k_ring_psychology.evaluate_level = 'Judge appropriate mental strategies for competition. Evaluate psychological readiness for specific opponents.',
    k_ring_psychology.create_level = 'Develop personal mental training system. Create psychological strategies for specific challenges.';

MERGE (k_research_methods:Knowledge {name: 'Movement Analysis and Research Methods'})
SET k_research_methods.description = 'Scientific analysis of movement - using video analysis, biomechanics principles, and systematic observation to understand and improve technique. Research-oriented mindset toward training and improvement.',
    k_research_methods.how_to_learn = 'Video analysis practice. Study biomechanics resources. Systematic experimentation with techniques. Learn research methodologies. Expected time: Years of practice.',
    k_research_methods.remember_level = 'Recall biomechanical principles and research methods. Remember analytical frameworks for movement.',
    k_research_methods.understand_level = 'Explain biomechanical principles and their application to techniques. Describe analytical frameworks for studying movement. Understand research methodologies.',
    k_research_methods.apply_level = 'Conduct detailed movement analysis on video. Systematically test techniques and approaches. Use data to guide training decisions.',
    k_research_methods.analyze_level = 'Break down complex movements to understand component parts. Analyze biomechanics of various techniques. Conduct systematic comparisons.',
    k_research_methods.evaluate_level = 'Judge movement quality based on biomechanical principles. Evaluate effectiveness of technique variations. Assess research quality and conclusions.',
    k_research_methods.create_level = 'Design systematic testing approaches. Create biomechanically-based improvements to techniques. Develop personal research methodologies.';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// BASIC SKILLS (Novice Level)

MERGE (s_stance:Skill {name: 'Proper Fighting Stance'})
SET s_stance.description = 'The foundational ability to adopt and maintain a proper Muay Thai fighting stance. Correct stance enables efficient striking, balance, and defense while preventing injury.',
    s_stance.how_to_develop = 'Work with qualified instructor for 2-4 weeks on stance drills. Practice stance switches daily for 10-15 minutes. Video record your stance and compare to professionals. Use mirrors during training. Expected time: 4-6 weeks for solid foundational stance.',
    s_stance.novice_level = 'Can assume basic fighting stance with guidance. Feet approximately shoulder-width apart, weight on balls of feet. Stance is somewhat rigid and requires conscious thought to maintain. To progress: Practice stance holds while moving and shadow boxing.',
    s_stance.advanced_beginner_level = 'Maintains proper stance during stationary drills and light movement. Stance positioning is consistent but still somewhat mechanical. Weight distribution is mostly correct but sometimes shifts poorly. To progress: Maintain stance while throwing combinations and during light sparring.',
    s_stance.competent_level = 'Assumes proper stance automatically in most situations. Stance is balanced and enables smooth movement and striking. Can adjust stance slightly for different techniques. Weight distribution supports efficient striking. To progress: Maintain stance under pressure during intense sparring.',
    s_stance.proficient_level = 'Stance is natural and invisible - fighter maintains optimal stance without conscious thought even during complex movements. Stance adjusts fluidly for different techniques and opponents. Weight is perfectly positioned for power generation and mobility.',
    s_stance.expert_level = 'Stance mastery - naturally assumes optimal stance positioning for any situation. Micro-adjusts stance for maximum efficiency with different opponents and techniques. Stance becomes a platform for all other skills with complete stability and power generation.';

MERGE (s_footwork:Skill {name: 'Basic Footwork'})
SET s_footwork.description = 'The ability to move efficiently in the ring - stepping forward, backward, and laterally while maintaining balance and stance.',
    s_footwork.how_to_develop = 'Shadow boxing with focus on footwork 3-4 times weekly. Ladder drills and cone drills. Pad work emphasizing movement. Heavy bag work incorporating footwork. Expected time: 4-6 weeks for basic competence.',
    s_footwork.novice_level = 'Can move forward and backward with conscious effort. Steps are sometimes large or uncontrolled. Struggles to maintain stance during movement. Weight distribution is inconsistent. To progress: Practice directional footwork patterns with consistent step size.',
    s_footwork.advanced_beginner_level = 'Moves in basic patterns with minimal balance loss. Steps are more controlled but still somewhat mechanical. Can move while throwing light strikes but struggles with complex movements. To progress: Add lateral movement and more complex footwork patterns.',
    s_footwork.competent_level = 'Moves smoothly in all directions while maintaining stance and balance. Step patterns are efficient and controlled. Can throw strikes while moving with decent coordination. Footwork supports defensive evasion. To progress: Develop advanced movement patterns and angle creation.',
    s_footwork.proficient_level = 'Movement is fluid and efficient even during complex striking sequences. Footwork is automatic and enables smooth transitions between techniques. Can move quickly and unpredictably. Footwork creates optimal angles for offense and defense.',
    s_footwork.expert_level = 'Movement is seamless and efficient, adapted to any opponent or tactical situation. Footwork creates and exploits angles with minimal wasted motion. Movement is efficient enough to maintain technique quality even in later rounds of intense competition.';

MERGE (s_guard:Skill {name: 'Defensive Guard Positioning'})
SET s_guard.description = 'The ability to position hands and arms to protect the head and body from incoming strikes while remaining able to attack.',
    s_guard.how_to_develop = 'Heavy bag work focusing on guard 2-3 times weekly. Shadow boxing with conscious hand placement. Pad work with instructor calling combinations to defend. Expected time: 3-4 weeks for basic competence.',
    s_guard.novice_level = 'Hands positioned approximately to protect face but positioning is inconsistent. Guard drops frequently. Elbows are sometimes flared rather than tight to body. Requires conscious effort to maintain. To progress: Practice consistent hand positioning during all training.',
    s_guard.advanced_beginner_level = 'Maintains reasonable guard positioning most of the time. Hands stay higher and more consistent. Elbows mostly tucked but sometimes drop under pressure. Guard is mostly automatic but requires occasional conscious correction. To progress: Maintain tight guard under more pressure and while moving.',
    s_guard.competent_level = 'Maintains solid defensive guard positioning consistently. Hands protect the face, elbows protect the body, chin tucked. Guard is mostly automatic but consciously adjustable when needed. Can defend most incoming strikes effectively.',
    s_guard.proficient_level = 'Guard positioning is automatic and responsive. Guard adjusts fluidly to different incoming threats. Tight guard that minimizes gaps while allowing offensive opportunities. Guard stays tight even under sustained pressure.',
    s_guard.expert_level = 'Defensive guard is instinctively positioned for maximum protection with minimal interference to offense. Guard adjusts naturally and invisibly to any incoming threat. Maintains perfect balance between defense and offensive readiness.';

MERGE (s_jab:Skill {name: 'Basic Jab'})
SET s_jab.description = 'The ability to execute a quick, straight punch using the front hand. The jab is fundamental to combinations and distance control.',
    s_jab.how_to_develop = 'Heavy bag work and pad work 2-3 times weekly focusing on jab mechanics. Shadow boxing with emphasis on jab speed and accuracy. Practice jab-based combinations. Expected time: 2-3 weeks for basic competence.',
    s_jab.novice_level = 'Can throw a straight punch from the front hand with basic accuracy. Punch is slow and lacks power. Hand path is sometimes curved rather than straight. Weight transfer is inconsistent. To progress: Focus on straight hand path and increasing punch speed.',
    s_jab.advanced_beginner_level = 'Jab is reasonably quick with improving accuracy. Hand path is mostly straight. Some weight transfer from stance. Can throw multiple jabs in sequence with decreasing accuracy. To progress: Improve consistency of multiple jab combinations.',
    s_jab.competent_level = 'Executes crisp, quick jabs with good accuracy. Hand path is straight and direct. Weight transfer supports the punch. Can chain multiple jabs together maintaining accuracy and speed. Jab distance sense is developing.',
    s_jab.proficient_level = 'Jab is fast, accurate, and used fluidly in combinations. Jab sets distance and creates openings automatically. Distance judgment is excellent. Jab speed and placement are intuitive.',
    s_jab.expert_level = 'Jab mastery - executed with perfect form, speed, and timing as an automatic tool for all offensive situations. Jab sets range, creates openings, and controls distance at expert level. Jab integrates seamlessly into all combinations.';

MERGE (s_cross:Skill {name: 'Basic Cross Punch'})
SET s_cross.description = 'The ability to execute a powerful straight punch using the rear hand with full hip and shoulder rotation. Power punch foundation.',
    s_cross.how_to_develop = 'Heavy bag work 2-3 times weekly on cross mechanics. Pad work with emphasis on hip rotation. Shadow boxing drilling cross technique. Expected time: 3-4 weeks for basic competence.',
    s_cross.novice_level = 'Can throw a punch from the rear hand with limited power. Hip rotation is minimal or absent. Shoulder engagement is weak. Footwork may interfere with punch. To progress: Focus on hip and shoulder rotation generating power.',
    s_cross.advanced_beginner_level = 'Cross has improved power from developing hip and shoulder rotation. Mechanics are becoming more coordinated. Can throw consistent crosses with moderate force. Some power loss when combining with other strikes. To progress: Develop power while maintaining technique in combinations.',
    s_cross.competent_level = 'Executes powerful crosses with full hip and shoulder rotation. Hand path is direct and explosive. Can throw crosses fluidly in combinations maintaining balance. Cross power is significant.',
    s_cross.proficient_level = 'Cross is delivered with explosive power and perfect form. Weight transfer is efficient and complete. Cross integrates naturally into all combination patterns. Distance and timing are intuitive.',
    s_cross.expert_level = 'Cross mastery - powerful, explosive, and perfectly timed with complete body engagement. Cross is used as a primary offensive tool with expert power generation. Seamlessly combines with other techniques without loss of coordination.';

MERGE (s_low_kick:Skill {name: 'Basic Low Kick'})
SET s_low_kick.description = 'The ability to execute a shin kick targeting the opponent\'s leg. The low kick is a fundamental Muay Thai technique and key element of the art.',
    s_low_kick.how_to_develop = 'Heavy bag work and pad work 3-4 times weekly on kick mechanics. Develop leg flexibility through stretching. Practice kick mechanics focusing on shin contact. Expected time: 4-6 weeks for basic competence.',
    s_low_kick.novice_level = 'Can throw kicks targeting the leg with guidance. Balance is often lost during kick. Shin contact is inconsistent, sometimes using instep. Power is minimal. Weight transfer is poor. To progress: Focus on maintaining balance and shin contact.',
    s_low_kick.advanced_beginner_level = 'Throws low kicks with improving consistency. Shin contact is mostly accurate. Balance is maintained most of the time. Power is developing but still limited. Can throw multiple low kicks in sequence with decreasing power. To progress: Develop greater balance and power.',
    s_low_kick.competent_level = 'Executes low kicks with good balance and shin contact. Power is moderate and effective. Can throw low kicks in combinations maintaining stance. Distance control for kicks is developing.',
    s_low_kick.proficient_level = 'Low kick is delivered with power, accuracy, and natural fluidity. Balance is perfect even when kicking from compromised positions. Kick integrates smoothly into combinations. Distance and timing are intuitive.',
    s_low_kick.expert_level = 'Low kick mastery - executed with power, perfect form, and expert timing. Shin conditioning is excellent allowing powerful strikes with minimal recovery needed. Low kicks are used as primary offensive tool with devastating effect.';

MERGE (s_heavy_bag:Skill {name: 'Heavy Bag Training'})
SET s_heavy_bag.description = 'The ability to effectively train on a heavy bag - using proper technique, maintaining intensity, and developing endurance through bag work.',
    s_heavy_bag.how_to_develop = 'Heavy bag training 3-4 times weekly. Start with 2-3 minute rounds building to 5-minute rounds. Focus on technique rather than raw power. Expected time: 3-4 weeks for basic competence.',
    s_heavy_bag.novice_level = 'Can throw combinations at the heavy bag with basic coordination. Tires quickly (exhausted after 1-2 minutes). Technique breaks down under fatigue. Hand placement is sometimes poor. To progress: Build endurance and maintain technique longer.',
    s_heavy_bag.advanced_beginner_level = 'Can maintain training effort for 3-4 minute rounds. Technique holds up reasonably during bag work. Intensity is developing. Some power but mostly arm-driven. To progress: Improve technique efficiency and power generation.',
    s_heavy_bag.competent_level = 'Can execute 5-minute rounds with good technique and consistent intensity. Combinations flow well on the bag. Power is body-generated and efficient. Endurance is developing.',
    s_heavy_bag.proficient_level = 'Heavy bag work is technically sound and maintains high intensity throughout rounds. Combinations are fluid and powerful. Bag work efficiently develops all techniques and attributes.',
    s_heavy_bag.expert_level = 'Heavy bag training is expertly executed - technical perfection, consistent intensity, and maximum training benefit from each session. Uses heavy bag effectively to develop all aspects of fighting.';

MERGE (s_safety_awareness:Skill {name: 'Safety Awareness and Protection'})
SET s_safety_awareness.description = 'The ability to prioritize safety - using protective equipment correctly, recognizing dangerous situations, and training responsibly to avoid injury.',
    s_safety_awareness.how_to_develop = 'Instruction from gym coaches on proper equipment use. Experience training under supervision. Learning from injury prevention resources. Expected time: Ongoing throughout training.',
    s_safety_awareness.novice_level = 'Follows safety rules when reminded. Sometimes forgets to wear all protective gear. Hand wrapping is inconsistent. Lacks understanding of why safety practices are important. To progress: Develop understanding of injury risks and prevention.',
    s_safety_awareness.advanced_beginner_level = 'Consistently uses protective equipment though sometimes inconsistently. Hand wrapping is usually adequate. Recognizes obvious danger but may miss subtle injury risks. To progress: Deepen understanding of injury mechanisms and prevention.',
    s_safety_awareness.competent_level = 'Consistently maintains proper protective equipment and wrapping. Recognizes injury risks in training. Makes safety-conscious decisions about training intensity. Follows injury prevention protocols.',
    s_safety_awareness.proficient_level = 'Safety awareness is automatic and proactive. Identifies potential injury risks before they become problems. Maintains perfect equipment protocols. Advises others on safety practices.',
    s_safety_awareness.expert_level = 'Expert safety awareness - recognizes all injury risks, understands mechanisms, and implements comprehensive prevention. Safety is seamlessly integrated into all training decisions.';

// INTERMEDIATE SKILLS (Developing/Competent Levels)

MERGE (s_body_kick:Skill {name: 'Body Kick Technique'})
SET s_body_kick.description = 'The ability to execute shin kicks targeting the opponent\'s ribs and body. Powerful and important Muay Thai technique.',
    s_body_kick.how_to_develop = 'Pad work and heavy bag training 3-4 times weekly targeting body height. Develop flexibility for high kicks. Practice body kick mechanics and distance. Expected time: 6-8 weeks.',
    s_body_kick.novice_level = 'Can throw kicks targeting the body with basic accuracy. Technique is less controlled than low kicks. Balance is often compromised. Power is limited. To progress: Develop balance and power in body kicks.',
    s_body_kick.advanced_beginner_level = 'Body kicks are becoming more consistent and controlled. Balance is improving. Power is developing but still requires improvement. Can execute body kicks in combinations with limited fluidity. To progress: Improve power and combination integration.',
    s_body_kick.competent_level = 'Executes body kicks with good technique and moderate power. Balance is maintained throughout kick. Can apply body kicks in combinations and sparring situations.',
    s_body_kick.proficient_level = 'Body kick is delivered with power, perfect balance, and technical excellence. Integration into combinations is seamless. Body kick distance and timing sense is intuitive.',
    s_body_kick.expert_level = 'Body kick mastery - powerful, accurate, and perfectly timed. Body kicks are delivered with expert force using full body mechanics. Seamlessly integrated into all offensive sequences.';

MERGE (s_hook_punch:Skill {name: 'Hook Punch Technique'})
SET s_hook_punch.description = 'The ability to execute a circular punch using either hand. Hook punches are powerful and effective at mid-range.',
    s_hook_punch.how_to_develop = 'Pad work and heavy bag training 2-3 times weekly. Practice hook mechanics from both stance and clinch. Develop power through rotation and weight transfer. Expected time: 5-6 weeks.',
    s_hook_punch.novice_level = 'Can throw hook punches with basic structure. Hand path and mechanics are often inefficient. Power is limited. Range judgment is poor. To progress: Develop proper mechanics and distance sense.',
    s_hook_punch.advanced_beginner_level = 'Hook mechanics are improving. Hand path is more circular and efficient. Power is developing. Can throw hooks in combinations with moderate flow. To progress: Improve power and combination integration.',
    s_hook_punch.competent_level = 'Executes hooks with good mechanics and reasonable power. Hand path is efficient and circular. Can apply hooks in combinations and from various positions.',
    s_hook_punch.proficient_level = 'Hook punch is delivered with power and perfect mechanics. Range judgment is excellent. Hooks integrate naturally into combinations with excellent timing.',
    s_hook_punch.expert_level = 'Hook punch mastery - executed with explosive power and perfect form. Hooks are used as primary weapons in combinations with expert timing and placement.';

MERGE (s_clinch_entry:Skill {name: 'Clinch Entry and Control'})
SET s_clinch_entry.description = 'The ability to enter clinch range from distance safely and establish dominant clinch positions.',
    s_clinch_entry.how_to_develop = 'Clinch work with training partner 2-3 times weekly. Start with cooperative drills then add resistance. Practice different clinch entries. Expected time: 4-6 weeks.',
    s_clinch_entry.novice_level = 'Can attempt clinch entries with guidance. Entries are often clumsy and inefficient. Control is tentative and easily broken. Requires assistance from partner. To progress: Develop smooth clinch entry mechanics.',
    s_clinch_entry.advanced_beginner_level = 'Clinch entries are becoming more coordinated. Can enter clinch with moderate success. Control is developing but often loses position under light resistance. To progress: Improve entry technique and position control.',
    s_clinch_entry.competent_level = 'Enters clinch smoothly and establishes reasonable control. Can maintain basic clinch positions. Transition between clinch entries is developing.',
    s_clinch_entry.proficient_level = 'Clinch entries are smooth and efficient. Establishes strong control immediately after entering clinch. Transitions between clinch positions are natural and seamless.',
    s_clinch_entry.expert_level = 'Clinch entry mastery - enters clinch smoothly and instantly establishes dominant control. Transitions between clinch positions are seamless and dominant.';

MERGE (s_knee_strike:Skill {name: 'Knee Strike from Clinch'})
SET s_knee_strike.description = 'The ability to execute powerful knee strikes from the clinch position. Essential close-range weapon.',
    s_knee_strike.how_to_develop = 'Clinch work on pads 2-3 times weekly. Practice knee mechanics in clinch. Develop power through hip drive. Expected time: 6-8 weeks.',
    s_knee_strike.novice_level = 'Can throw knee strikes from clinch with basic form. Power is minimal and mechanics are inefficient. Loses clinch position easily when kneeing. To progress: Develop proper mechanics and clinch control.',
    s_knee_strike.advanced_beginner_level = 'Knee strikes are improving in technique. Power is developing. Can throw multiple knee strikes while maintaining some clinch control. To progress: Improve power and clinch stability.',
    s_knee_strike.competent_level = 'Executes knee strikes with good power and technique. Maintains clinch control while delivering knees. Can chain knee strikes in sequence.',
    s_knee_strike.proficient_level = 'Knee strikes are powerful and well-timed from clinch. Clinch control is perfect during strikes. Knee strikes flow naturally within clinch sequences.',
    s_knee_strike.expert_level = 'Knee strike mastery - devastating power and perfect form from clinch. Delivers multiple knee strikes maintaining superior clinch control. Knee strikes are primary offensive weapon from clinch.';

MERGE (s_elbow_strike:Skill {name: 'Basic Elbow Strike'})
SET s_elbow_strike.description = 'The ability to execute elbow strikes at close-to-medium range. Effective striking tool with multiple variations.',
    s_elbow_strike.how_to_develop = 'Pad work 2-3 times weekly on elbow mechanics. Heavy bag elbow drills. Light sparring practicing elbow placement. Expected time: 5-6 weeks.',
    s_elbow_strike.novice_level = 'Can throw elbow strikes with basic form. Power and placement are inconsistent. Creates vulnerability when attempting elbows. To progress: Develop proper mechanics and position sense.',
    s_elbow_strike.advanced_beginner_level = 'Elbow strikes are becoming more coordinated. Mechanics are improving. Power is developing. Can throw elbows with moderate placement. To progress: Improve power and range judgment.',
    s_elbow_strike.competent_level = 'Executes elbows with decent technique and power. Placement is generally accurate. Can apply elbows in combinations.',
    s_elbow_strike.proficient_level = 'Elbow strikes are powerful and well-placed. Uses elbows effectively in combinations. Range and timing are intuitive.',
    s_elbow_strike.expert_level = 'Elbow strike mastery - delivered with devastating power and perfect precision. Elbows are used as primary striking tool with expert placement and timing.';

MERGE (s_pad_work:Skill {name: 'Pad Work Training'})
SET s_pad_work.description = 'The ability to effectively train with pads held by a partner - executing called combinations with speed, power, and proper technique.',
    s_pad_work.how_to_develop = 'Regular pad sessions 2-3 times weekly with experienced pad holder. Start with simple combinations and progress to complexity. Expected time: Ongoing development.',
    s_pad_work.novice_level = 'Can throw combinations called by pad holder but struggles with accuracy and power. Often misses pads. Fatigues quickly during pad work. To progress: Develop accuracy and endurance.',
    s_pad_work.advanced_beginner_level = 'Hits pads with increasing consistency. Can execute called combinations with reasonable accuracy. Endurance is improving. Speed is developing. To progress: Improve power and combination flow.',
    s_pad_work.competent_level = 'Executes pad work combinations with good accuracy and power. Can respond quickly to called combinations. Maintains proper technique throughout rounds.',
    s_pad_work.proficient_level = 'Pad work is technically excellent with consistent accuracy, power, and speed. Combinations flow naturally and fluidly from called instructions.',
    s_pad_work.expert_level = 'Pad work mastery - perfect accuracy, explosive power, and intuitive combination execution. Reads pads instinctively and executes combinations with expert precision.';

MERGE (s_light_sparring:Skill {name: 'Light Sparring'})
SET s_light_sparring.description = 'The ability to participate safely in controlled sparring at light intensity - applying techniques against a moving opponent while maintaining control.',
    s_light_sparring.how_to_develop = 'Supervised light sparring 1-2 times weekly. Start with cooperative partners and minimal contact. Gradually increase intensity and resistance. Expected time: 6-8 weeks.',
    s_light_sparring.novice_level = 'Participates in light sparring with difficulty. Often too aggressive or too passive. Struggles to apply techniques against moving target. Fatigues quickly. To progress: Develop better distance control and sparring awareness.',
    s_light_sparring.advanced_beginner_level = 'Can execute light sparring rounds maintaining light contact. Applies some techniques against resistance. Distance sense is improving. Awareness of opponent positioning is developing. To progress: Improve technique application and combination flow.',
    s_light_sparring.competent_level = 'Executes light sparring rounds effectively with appropriate control. Applies techniques against resistance with reasonable success. Maintains awareness of opponent.',
    s_light_sparring.proficient_level = 'Light sparring is smooth and controlled. Techniques apply naturally against resistance. Footwork and distance management are good during sparring.',
    s_light_sparring.expert_level = 'Light sparring mastery - seamless technique application with perfect control. Reads opponent effectively and applies appropriate techniques instinctively.';

MERGE (s_combinations:Skill {name: 'Flowing Combinations'})
SET s_combinations.description = 'The ability to execute complex multi-strike combinations flowing smoothly from one technique to the next.',
    s_combinations.how_to_develop = 'Pad work and heavy bag training 3-4 times weekly drilling complex combinations. Shadow boxing practicing combination sequences. Expected time: 8-10 weeks.',
    s_combinations.novice_level = 'Can execute basic 2-3 strike combinations with some flow. Longer combinations break down. Weight transfer between strikes is often inefficient. To progress: Practice longer combination chains.',
    s_combinations.advanced_beginner_level = 'Can execute 4-5 strike combinations with developing flow. Weight transfer between strikes is improving. Combinations are becoming more natural. To progress: Develop longer and more complex sequences.',
    s_combinations.competent_level = 'Executes complex combinations fluently with good flow and power throughout. Weight transfer is efficient between strikes. Can adapt combinations to different situations.',
    s_combinations.proficient_level = 'Combinations flow naturally and powerfully with excellent weight transfer. Adapts combinations intuitively to different scenarios and opponent responses.',
    s_combinations.expert_level = 'Combination mastery - executes complex flowing sequences with perfect technique, power, and adaptation. Combinations are delivered with expert fluidity and devastation.';

MERGE (s_defense_reactive:Skill {name: 'Reactive Defense'})
SET s_defense_reactive.description = 'The ability to react to incoming strikes with appropriate defensive techniques - blocking, parrying, slipping, and rolling.',
    s_defense_reactive.how_to_develop = 'Pad work with partner calling strikes 2-3 times weekly. Light sparring focusing on defense. Video analysis of defensive reactions. Expected time: 6-8 weeks.',
    s_defense_reactive.novice_level = 'Can perform defensive techniques but reactions are slow and often late. Defensive technique choice is often incorrect. Requires conscious thought. To progress: Develop faster reaction time and better technique selection.',
    s_defense_reactive.advanced_beginner_level = 'Reaction time is improving. Can execute appropriate defensive techniques though occasionally incorrect. Defense is becoming more instinctive. To progress: Develop faster and more automatic defensive reactions.',
    s_defense_reactive.competent_level = 'Reacts to most incoming strikes with appropriate and timely defensive techniques. Defense is reasonably automatic though conscious thought is sometimes needed.',
    s_defense_reactive.proficient_level = 'Defensive reactions are fast and accurate. Intuitively selects appropriate techniques for different incoming strikes. Defense is automatic and reliable.',
    s_defense_reactive.expert_level = 'Defensive reaction mastery - instantaneous and perfect defensive responses to any incoming threat. Defense is invisible and intuitive, maintaining perfect composure under attack.';

// ADVANCED SKILLS (Advanced/Proficient Levels)

MERGE (s_head_kick:Skill {name: 'Head Kick Technique'})
SET s_head_kick.description = 'The ability to execute shin kicks targeting the opponent\'s head. High-risk, high-reward technique requiring excellent timing and distance sense.',
    s_head_kick.how_to_develop = 'Pad work and heavy bag work 2-3 times weekly on head kick mechanics. Develop superior flexibility. Practice distance and timing extensively. Light sparring with head kick focus. Expected time: 12+ weeks.',
    s_head_kick.novice_level = 'Can attempt head kicks but technique is very inefficient and creates significant vulnerability. Balance is often lost. Timing and distance are poor. To progress: Develop better mechanics and distance sense.',
    s_head_kick.advanced_beginner_level = 'Head kicks are improving in consistency though still inefficient. Creates less vulnerability but still significant risk. Timing is beginning to develop. To progress: Improve mechanics and timing sense.',
    s_head_kick.competent_level = 'Executes head kicks with reasonable technique and acceptable risk-reward. Balance and mechanics are solid. Timing and distance sense are good.',
    s_head_kick.proficient_level = 'Head kicks are powerful and well-timed with excellent balance and form. Integrates head kicks into combinations with low vulnerability.',
    s_head_kick.expert_level = 'Head kick mastery - executed with devastating power, perfect form, and expert timing. Minimal vulnerability despite the technique\'s inherent risk. Head kicks are used as effective offensive weapon.';

MERGE (s_clinch_advanced:Skill {name: 'Advanced Clinch Techniques'})
SET s_clinch_advanced.description = 'The ability to execute advanced clinch techniques including position transitions, sweeps, and dominant control sequences.',
    s_clinch_advanced.how_to_develop = 'Advanced clinch work 2-3 times weekly with strong partners. Study professional clinch techniques. Practice transitions and sweeps extensively. Expected time: 12+ weeks.',
    s_clinch_advanced.novice_level = 'Attempts advanced clinch techniques but lacks proper understanding of mechanics and timing. Techniques often fail against resistance. To progress: Study advanced clinch structure and mechanics.',
    s_clinch_advanced.advanced_beginner_level = 'Advanced techniques are improving but still inconsistent. Mechanics are becoming clearer. Some techniques work occasionally under right conditions. To progress: Develop more reliable technique execution.',
    s_clinch_advanced.competent_level = 'Executes advanced clinch techniques with reasonable consistency. Sweeps and transitions work against moderate resistance. Understanding of clinch positioning is solid.',
    s_clinch_advanced.proficient_level = 'Advanced clinch techniques are smooth and reliable. Sweeps and transitions work seamlessly against strong resistance. Clinch dominance is exceptional.',
    s_clinch_advanced.expert_level = 'Advanced clinch mastery - executes sophisticated techniques with perfect timing and flawless execution. Commands absolute clinch dominance in all positions. Sweeps and transitions are devastating and nearly unstoppable.';

MERGE (s_moderate_sparring:Skill {name: 'Moderate Intensity Sparring'})
SET s_moderate_sparring.description = 'The ability to participate in sparring at moderate intensity - applying combinations and defenses against skilled resistance at realistic speed.',
    s_moderate_sparring.how_to_develop = 'Regular moderate sparring 2-3 times weekly with varied opponents. Build from light sparring progressively. Study different fighting styles. Expected time: 12+ weeks.',
    s_moderate_sparring.novice_level = 'Struggles with moderate intensity sparring. Technique breaks down under increased pressure. Pacing and timing are poor. Fatigues significantly during rounds. To progress: Build endurance and composure under pressure.',
    s_moderate_sparring.advanced_beginner_level = 'Can participate in moderate sparring though still struggling at times. Technique holds up better under pressure. Begins developing timing and distance. To progress: Develop better pacing and strategic thinking.',
    s_moderate_sparring.competent_level = 'Executes moderate sparring with solid technique and reasonable strategy. Applies combinations effectively. Defenses work against moderate pressure. Pacing is developing.',
    s_moderate_sparring.proficient_level = 'Moderate sparring is technically sound and strategically competent. Combinations and defenses work smoothly against skilled resistance. Pacing and timing are good.',
    s_moderate_sparring.expert_level = 'Moderate sparring mastery - seamless execution against skilled opponents. Perfect pacing, strategic adaptation, and technical excellence. Dominates sparring situations.';

MERGE (s_footwork_advanced:Skill {name: 'Advanced Footwork and Angle Creation'})
SET s_footwork_advanced.description = 'The ability to use advanced footwork to create angles - positioning where you have advantage and opponent has limitations.',
    s_footwork_advanced.how_to_develop = 'Advanced footwork drills 3-4 times weekly. Sparring with focus on angle creation. Study angle techniques of elite fighters. Expected time: 12+ weeks.',
    s_footwork_advanced.novice_level = 'Understands concept of angles but struggles to create them consistently. Footwork for angle creation is clumsy and inefficient. To progress: Develop smoother footwork patterns.',
    s_footwork_advanced.advanced_beginner_level = 'Can create angles with improving consistency though positioning is sometimes suboptimal. Footwork is becoming more efficient. Understands how angles create advantages. To progress: Improve angle consistency and effectiveness.',
    s_footwork_advanced.competent_level = 'Creates good angles regularly with efficient footwork. Understands how angles create striking advantages. Can maintain angles during exchanges.',
    s_footwork_advanced.proficient_level = 'Angle creation is smooth and natural. Consistently positions with advantage through excellent footwork. Uses angles intuitively for offense and defense.',
    s_footwork_advanced.expert_level = 'Footwork mastery - creates superior angles constantly with invisible, efficient movement. Angles are used with expert precision to maximize advantage against any opponent.';

MERGE (s_pressure_fighting:Skill {name: 'Pressure Fighting and Dominance'})
SET s_pressure_fighting.description = 'The ability to apply consistent forward pressure - controlling range, dictating pace, and creating dominant positions through aggressive movement.',
    s_pressure_fighting.how_to_develop = 'Aggressive sparring 2-3 times weekly with focus on pressure. Study pressure fighters. Practice sustained forward movement. Build exceptional conditioning. Expected time: 12+ weeks.',
    s_pressure_fighting.novice_level = 'Attempts to apply pressure but often loses control or gets countered. Pressure is inconsistent and sometimes reckless. Conditioning for sustained pressure is lacking. To progress: Develop safer pressure techniques and better conditioning.',
    s_pressure_fighting.advanced_beginner_level = 'Applies pressure with improving control and consistency. Beginning to understand safe pressure. Can maintain pressure for moderate periods. To progress: Develop longer sustained pressure and better timing.',
    s_pressure_fighting.competent_level = 'Applies effective forward pressure with good control and timing. Can dictate pace through pressure. Opponent positioning becomes difficult under sustained pressure.',
    s_pressure_fighting.proficient_level = 'Pressure fighting is smooth and dominant. Consistently controls range and pace through pressure. Opponent is forced to react to aggression.',
    s_pressure_fighting.expert_level = 'Pressure fighting mastery - applies relentless, controlled pressure that systematically breaks down opponents. Pace and positioning are completely controlled through expert pressure application.';

MERGE (s_counter_striking:Skill {name: 'Counter Striking'})
SET s_counter_striking.description = 'The ability to read and counter incoming strikes - responding with effective offensive techniques while maintaining defensive integrity.',
    s_counter_striking.how_to_develop = 'Pad work with partner throwing strikes 2-3 times weekly. Sparring with focus on countering. Study counter techniques of professionals. Expected time: 12+ weeks.',
    s_counter_striking.novice_level = 'Can attempt counters but timing is often off and counters are often ineffective. Struggles to read incoming attacks. To progress: Develop better attack reading and timing sense.',
    s_counter_striking.advanced_beginner_level = 'Reads incoming attacks with improving accuracy and times counters better. Counters work occasionally. Still sometimes too slow to counter. To progress: Develop faster counter timing and more reliable execution.',
    s_counter_striking.competent_level = 'Executes counters effectively with good timing. Reads incoming attacks reliably. Counter strikes are delivered with power.',
    s_counter_striking.proficient_level = 'Counter striking is smooth and intuitive. Reads opponents and counters instinctively. Counter strikes are powerful and well-timed.',
    s_counter_striking.expert_level = 'Counter striking mastery - reads incoming attacks instantly and responds with devastating counters. Countering is invisible and creates significant offensive advantage.';

MERGE (s_ring_sense:Skill {name: 'Ring Sense and Positioning'})
SET s_ring_sense.description = 'The ability to maintain awareness of ring position and boundaries - knowing where you are in the ring, managing the space, and using corners strategically.',
    s_ring_sense.how_to_develop = 'Regular sparring with focus on positioning awareness. Study positioning of professional fighters. Practice boundary management. Expected time: 12+ weeks.',
    s_ring_sense.novice_level = 'Often loses track of position in ring. Gets cornered frequently. Doesn\'t understand how to use space strategically. To progress: Develop better spatial awareness.',
    s_ring_sense.advanced_beginner_level = 'Maintains reasonable ring awareness though occasionally gets cornered. Beginning to understand space management. To progress: Improve positioning consistency and strategic space use.',
    s_ring_sense.competent_level = 'Maintains good ring awareness and positioning. Rarely gets cornered inadvertently. Uses ring space reasonably well.',
    s_ring_sense.proficient_level = 'Maintains excellent ring awareness at all times. Uses space strategically to create advantages and avoid disadvantage.',
    s_ring_sense.expert_level = 'Ring sense mastery - complete spatial awareness and expert strategic use of ring space. Positioning is always optimal, corners are used to advantage, and space is controlled expertly.';

MERGE (s_conditioning_advanced:Skill {name: 'Advanced Conditioning and Endurance'})
SET s_conditioning_advanced.description = 'The ability to maintain high-intensity performance throughout multiple rounds - excellent aerobic and anaerobic conditioning specific to Muay Thai demands.',
    s_conditioning_advanced.how_to_develop = 'Intensive conditioning 4-5 times weekly. Multiple 5-minute round training. Progressive endurance building. Expected time: Ongoing, 16+ weeks for significant advancement.',
    s_conditioning_advanced.novice_level = 'Can complete multiple rounds but technique degrades significantly in later rounds. Breathing becomes difficult. Fatigue substantially affects performance. To progress: Build aerobic base through consistent conditioning.',
    s_conditioning_advanced.advanced_beginner_level = 'Endurance is improving. Can complete multiple rounds maintaining some technique. Fatigue is less dramatic. To progress: Build greater round-to-round consistency.',
    s_conditioning_advanced.competent_level = 'Maintains good technique throughout multiple rounds. Breathing and pacing are solid. Can compete in extended matches.',
    s_conditioning_advanced.proficient_level = 'Excellent conditioning allows perfect technique throughout all rounds. Doesn\'t fade even in late rounds. Can accelerate in final rounds if needed.',
    s_conditioning_advanced.expert_level = 'Conditioning mastery - exceptional aerobic and anaerobic capacity allows peak performance throughout entire fights. Maintains explosive power in final rounds. Fatigue never significantly affects technique.';

// EXPERT SKILLS (Master Level)

MERGE (s_game_plan:Skill {name: 'Fight Game Planning and Strategy'})
SET s_game_plan.description = 'The ability to develop and execute comprehensive fight strategies - analyzing opponents, creating game plans, and adapting strategy during fights based on what\'s working.',
    s_game_plan.how_to_develop = 'Study professional fights with strategic focus 4-5 times weekly. Work with experienced coaches on strategy. Extensive competition experience. Expected time: 24+ weeks with serious study.',
    s_game_plan.novice_level = 'Has basic understanding of strategy concept but struggles to develop and execute plans. Game plans are vague and easily abandoned. To progress: Study strategic principles more deeply.',
    s_game_plan.advanced_beginner_level = 'Can develop basic game plans for known opponents. Plans are sometimes overly rigid. Adapts to some degree when plans fail. To progress: Develop more flexible and sophisticated strategies.',
    s_game_plan.competent_level = 'Develops solid game plans based on opponent analysis. Can execute plans and adapt when needed. Strategic thinking is developing well.',
    s_game_plan.proficient_level = 'Develops sophisticated game plans with excellent adaptability. Analyzes opponents deeply and creates specific strategic advantages. Adapts seamlessly during fights.',
    s_game_plan.expert_level = 'Game planning mastery - creates sophisticated multi-level strategies customized to every opponent. Reads opponents during fights and adapts strategy instantly. Strategy is invisible yet devastatingly effective.';

MERGE (s_feinting:Skill {name: 'Feinting and Deception'})
SET s_feinting.description = 'The ability to use feints effectively - creating false threats that manipulate opponent defensive reactions and open real offensive opportunities.',
    s_feinting.how_to_develop = 'Advanced pad work 3-4 times weekly on feint mechanics. Study feint techniques of elite fighters. Extensive sparring applying feints. Expected time: 20+ weeks.',
    s_feinting.novice_level = 'Understands feint concept but execution is obvious and ineffective. Opponents read feints easily. To progress: Study more subtle feinting techniques.',
    s_feinting.advanced_beginner_level = 'Feints are becoming more subtle. Occasionally deceives opponent but opponents still read many feints. To progress: Develop better feint timing and more sophisticated combinations.',
    s_feinting.competent_level = 'Feints deceive opponents with reasonable consistency. Uses feints to set up real attacks effectively. Feint combinations are developing.',
    s_feinting.proficient_level = 'Feints are subtle and effective. Consistently manipulates opponent defensive reactions. Feints create clear offensive opportunities.',
    s_feinting.expert_level = 'Feinting mastery - feints are nearly invisible yet devastatingly effective. Manipulates opponents with expert precision, creating seemingly endless offensive opportunities.';

MERGE (s_mental_mastery:Skill {name: 'Mental Mastery and Composure'})
SET s_mental_mastery.description = 'The ability to maintain peak mental performance under extreme pressure - managing fear, maintaining focus and composure, psychological resilience under adversity.',
    s_mental_mastery.how_to_develop = 'Sports psychology study and practice. Extensive competition experience. Mental training techniques. Work with sports psychologists. Expected time: 24+ weeks.',
    s_mental_mastery.novice_level = 'Struggles with nervousness and fear in competition. Composure is easily lost under pressure. Mental performance is inconsistent. To progress: Develop mental training practices.',
    s_mental_mastery.advanced_beginner_level = 'Shows improving mental composure under pressure. Can maintain focus despite nervousness. Some mental resilience is developing. To progress: Build stronger mental foundations.',
    s_mental_mastery.competent_level = 'Maintains reasonable composure under pressure. Can focus effectively despite stress. Shows developing mental resilience.',
    s_mental_mastery.proficient_level = 'Mental composure is excellent even under severe pressure. Maintains perfect focus in competition. Shows strong mental resilience when behind.',
    s_mental_mastery.expert_level = 'Mental mastery - complete control over mental state in any situation. Thrives under pressure, perfect focus, absolute composure, and exceptional mental resilience. Psychology becomes an offensive weapon.';

MERGE (s_timing_mastery:Skill {name: 'Expert Timing and Rhythm'})
SET s_timing_mastery.description = 'The ability to understand and manipulate rhythm and timing - striking when opponent expects nothing, disrupting opponent rhythm, and flowing seamlessly with changing pace.',
    s_timing_mastery.how_to_develop = 'Extensive sparring with varied opponents. Study rhythm manipulation of top fighters. Practice tempo variation drills. Expected time: 24+ weeks.',
    s_timing_mastery.novice_level = 'Struggles to time strikes effectively. Creates predictable patterns. Rhythm sense is poor. To progress: Develop better rhythm awareness.',
    s_timing_mastery.advanced_beginner_level = 'Timing is improving with better recognition of patterns. Rhythm sense is developing. Creates less predictable patterns. To progress: Develop more sophisticated rhythm manipulation.',
    s_timing_mastery.competent_level = 'Demonstrates good timing sense and can vary rhythm reasonably well. Understands opponent rhythm patterns.',
    s_timing_mastery.proficient_level = 'Excellent timing sense allows perfect strike placement. Can manipulate rhythm to advantage and read opponent rhythm intuitively.',
    s_timing_mastery.expert_level = 'Timing mastery - expert manipulation of rhythm at multiple levels. Strikes land with impossible timing, opponent rhythm is disrupted constantly, and flow is completely controlled.';

MERGE (s_style_adaptation:Skill {name: 'Style Adaptation and Opponent Neutralization'})
SET s_style_adaptation.description = 'The ability to recognize opponent fighting styles and quickly adapt personal approach - neutralizing opponent strengths and exploiting weaknesses.',
    s_style_adaptation.how_to_develop = 'Extensive competition against diverse opponents. Coach analysis of different styles. Systematic study of style variations. Expected time: 24+ weeks.',
    s_style_adaptation.novice_level = 'Struggles to adapt style to different opponents. Uses same approach regardless of opponent style. To progress: Study more fighter styles and develop adaptability.',
    s_style_adaptation.advanced_beginner_level = 'Recognizes some opponent styles and attempts adaptation though often inefficiently. To progress: Develop more sophisticated adaptation strategies.',
    s_style_adaptation.competent_level = 'Recognizes opponent styles and adapts approach with reasonable effectiveness. Can neutralize some opponent advantages.',
    s_style_adaptation.proficient_level = 'Quickly recognizes opponent styles and adapts seamlessly. Neutralizes opponent strengths effectively and exploits weaknesses.',
    s_style_adaptation.expert_level = 'Style adaptation mastery - instantly recognizes any opponent style and adapts approach perfectly. Effectively neutralizes all opponent advantages and exploits all weaknesses.';

MERGE (s_offensive_mastery:Skill {name: 'Offensive Mastery and Dominance'})
SET s_offensive_mastery.description = 'Complete mastery of offensive techniques - executing all striking techniques with perfect form, power, timing, and seamless combination. Total offensive confidence and effectiveness.',
    s_offensive_mastery.how_to_develop = 'Years of intensive technical training and competition. Perfect execution of all techniques through deliberate practice. Expected time: 36+ weeks.',
    s_offensive_mastery.novice_level = 'Offensive techniques are inconsistent in quality. Some are well-executed while others are weak or poorly-timed. To progress: Focus on consistent technical excellence.',
    s_offensive_mastery.advanced_beginner_level = 'Offensive quality is improving with more consistent execution. Techniques work more regularly though not always at high level. To progress: Build more complete offensive arsenal.',
    s_offensive_mastery.competent_level = 'Executes offensive techniques with solid quality and consistency. Offensive approach is effective against most opponents.',
    s_offensive_mastery.proficient_level = 'Offensive techniques are executed with excellent consistency and power. Offensive arsenal is nearly complete and highly effective.',
    s_offensive_mastery.expert_level = 'Offensive mastery - all striking techniques executed with flawless form, devastating power, and perfect integration. Offensive pressure is relentless and nearly unstoppable. Complete offensive dominance.';

MERGE (s_defensive_mastery:Skill {name: 'Defensive Mastery and Evasion'})
SET s_defensive_mastery.description = 'Complete mastery of defensive techniques - executing all defensive techniques perfectly, anticipating strikes before they\'re launched, maintaining composure under onslaught.',
    s_defensive_mastery.how_to_develop = 'Years of defensive training emphasis. Extensive sparring with strong offensive opponents. Expected time: 36+ weeks.',
    s_defensive_mastery.novice_level = 'Defensive execution is inconsistent. Becomes flustered under pressure. Gaps appear in defense. To progress: Build more complete defensive awareness.',
    s_defensive_mastery.advanced_beginner_level = 'Defensive consistency is improving though still shows gaps. Handles some pressure better but sometimes overwhelmed. To progress: Develop more complete defensive mastery.',
    s_defensive_mastery.competent_level = 'Executes defensive techniques with good consistency. Can handle offensive pressure for reasonable periods.',
    s_defensive_mastery.proficient_level = 'Defensive execution is excellent with few gaps. Maintains composure under sustained pressure. Defensive techniques are smooth and efficient.',
    s_defensive_mastery.expert_level = 'Defensive mastery - flawless execution of all defensive techniques. Anticipates strikes invisibly and evades before strikes begin. Remains composed and counter-opportunistic under any onslaught.';

MERGE (s_fight_experience:Skill {name: 'Fight Experience and Intuition'})
SET s_fight_experience.description = 'Deep experiential knowledge from extensive competitive fighting - intuitive problem-solving under pressure, reading opponents in real-time, and flowing adaptively through unpredictable situations.',
    s_fight_experience.how_to_develop = 'Extensive competition at progressively higher levels. Coaching from experienced fighters. Systematic reflection on fight experiences. Expected time: Ongoing, years of competition.',
    s_fight_experience.novice_level = 'Limited competition experience shows in unsure decision-making and hesitation. Situations are often surprising and disorienting. To progress: Gain more competition experience.',
    s_fight_experience.advanced_beginner_level = 'Shows improving comfort in competition though still encountering novel situations. Decision-making is becoming more intuitive. To progress: Continue competitive participation.',
    s_fight_experience.competent_level = 'Has reasonable experience with most common fight situations. Can handle surprises better than before. Intuition is developing.',
    s_fight_experience.proficient_level = 'Extensive experience creates comfort in nearly all situations. Intuitive responses are usually accurate. Adapts smoothly to most scenarios.',
    s_fight_experience.expert_level = 'Fight experience mastery - thousands of rounds at high level create perfect intuition. Anticipates situations before they develop and responds with flawless instinct in any scenario.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Physical Traits (core to striking-based martial art)

MERGE (t_explosiveness:Trait {name: 'Explosiveness and Power Generation'})
SET t_explosiveness.description = 'Natural capacity to generate rapid, powerful movement from the hips and legs. Fundamental to delivering powerful strikes with all 8 limbs (fists, elbows, knees, shins). Greater explosiveness enables more devastating strikes with less technical perfection required.',
    t_explosiveness.measurement_criteria = 'Assessed through vertical jump height, punch/kick force measurements, and acceleration capability. Low (0-25): Slow-moving strikes requiring significant technical efficiency to generate power. Moderate (26-50): Moderate power generation with good technique. High (51-75): Naturally explosive movements creating power even with average technique. Exceptional (76-100): Extraordinary explosiveness generating devastating power even in suboptimal positions.';

MERGE (t_endurance:Trait {name: 'Cardiovascular Endurance'})
SET t_endurance.description = 'Capacity for sustained aerobic and anaerobic effort across multiple rounds of intense fighting. Muay Thai demands 5-12 rounds of high-intensity effort. Superior endurance enables maintaining technique, speed, and power in later rounds when opponents fatigue.',
    t_endurance.measurement_criteria = 'Assessed through time-to-exhaustion testing, round-to-round performance consistency, and sustained intensity capability. Low (0-25): Significant fatigue after 2-3 minutes; rapid technique degradation. Moderate (26-50): Can complete 3-minute rounds with some fatigue. High (51-75): Maintains good performance across multiple 5-minute rounds. Exceptional (76-100): Minimal fatigue even in extreme conditioning scenarios; peak performance throughout fights.';

MERGE (t_coordination:Trait {name: 'Body Coordination and Movement Efficiency'})
SET t_coordination.description = 'Natural ability to synchronize movement across multiple body parts simultaneously. Enables smooth transitions between techniques, efficient weight transfer in combinations, and fluid footwork. Better coordination accelerates skill development and creates more dangerous fighters with equivalent training time.',
    t_coordination.measurement_criteria = 'Assessed through observation of movement quality, combination fluidity, and coordination complex tasks. Low (0-25): Movement appears disjointed; struggle to coordinate multiple limbs. Moderate (26-50): Reasonable coordination with some awkwardness in complex combinations. High (51-75): Smooth, well-coordinated movement in most situations. Exceptional (76-100): Exceptional movement fluidity and coordination; appears graceful even in chaotic situations.';

// Cognitive & Emotional Traits

MERGE (t_reaction_time:Trait {name: 'Reaction Time and Speed'})
SET t_reaction_time.description = 'Natural quickness in responding to stimuli - seeing incoming attacks and reacting defensively or offensively. Directly impacts both offensive setup speed and defensive reaction speed. Superior reaction time enables counter-striking and evasion techniques that slower fighters cannot execute.',
    t_reaction_time.measurement_criteria = 'Assessed through reaction time tests and fight footage analysis of response speed. Low (0-25): Slow reactions; consistently late to defend or counter. Moderate (26-50): Average reaction time; manages basic defense and counters. High (51-75): Quick reactions enabling timely defense and counter-strikes. Exceptional (76-100): Nearly instantaneous reactions; appears to predict opponent movement and responds before attacks fully develop.';

MERGE (t_resilience:Trait {name: 'Mental Resilience and Composure'})
SET t_resilience.description = 'Psychological capacity to remain composed and focused under extreme pressure, pain, and adversity. Fighters must continue executing technique while exhausted, injured, or behind on points. Superior resilience enables fighters to recover from early losses in fights and maintain strategic thinking when fatigued.',
    t_resilience.measurement_criteria = 'Assessed through behavior under pressure, recovery from setbacks, and maintenance of decision-making quality under stress. Low (0-25): Becomes flustered or overwhelmed easily; loses composure under pressure. Moderate (26-50): Can maintain reasonable composure though confidence shaken by setbacks. High (51-75): Maintains composure through most difficulties and recovers from setbacks. Exceptional (76-100): Complete psychological stability; unaffected by pain, fatigue, or setbacks; always maintains perfect composure.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// NOVICE LEVEL MILESTONES - Entry-Level Achievements

MERGE (m_first_class:Milestone {name: 'Complete First Muay Thai Class'})
SET m_first_class.description = 'Successfully complete an introductory Muay Thai class at a training facility. This foundational milestone marks entry into the sport and demonstrates commitment to learning the art.',
    m_first_class.how_to_achieve = 'Find a local Muay Thai gym or training facility. Sign up for a beginner class. Attend the full class focusing on learning basic concepts and following instructions from the instructor. Most gyms offer trial classes. Expect 60-90 minutes of instruction. Achievement is simply showing up and participating.';

MERGE (m_proper_wraps:Milestone {name: 'Learn to Wrap Hands and Wrists Properly'})
SET m_proper_wraps.description = 'Master the essential skill of hand wrapping - protecting wrists and hands with cloth wraps before glove use. A fundamental safety requirement for all Muay Thai training.',
    m_proper_wraps.how_to_achieve = 'Watch instructional videos on hand wrapping or learn in-person from a coach. Practice wrapping your own hands 5-10 times until the technique becomes comfortable. Ensure the wrap provides support to wrists and knuckles. Have an experienced fighter or coach confirm your wrapping technique is correct. Usually achieved within the first week of training.';

MERGE (m_first_heavy_bag:Milestone {name: 'Complete First Heavy Bag Session'})
SET m_first_heavy_bag.description = 'Successfully train on a heavy bag for a full session - learning bag distance, timing, and basic striking technique on moving resistance.',
    m_first_heavy_bag.how_to_achieve = 'After learning basic stance and guard, work on a heavy bag under instructor supervision. Start with 2-3 minute rounds throwing basic combinations. Focus on making contact cleanly and maintaining stance. Build up to completing a full training session (typically 20-30 minutes of total bag work). Achievement is simply maintaining good effort and technique throughout the session.';

MERGE (m_basic_sparring_first:Milestone {name: 'Participate in First Light Sparring Session'})
SET m_basic_sparring_first.description = 'Complete your first light sparring session with controlled contact against a live opponent. Marks transition from technical drills to applied fighting against resistance.',
    m_basic_sparring_first.how_to_achieve = 'After 2-4 weeks of heavy bag and pad work, participate in a supervised light sparring session with an experienced partner at minimal contact. Focus on technique application rather than power. Wear full protective gear including headgear. Have an instructor supervise to ensure safety. The milestone is achieved by completing the sparring round without significant incidents.';

MERGE (m_strength_foundation:Milestone {name: 'Build Basic Conditioning Foundation'})
SET m_strength_foundation.description = 'Develop foundational physical fitness - being able to complete training sessions without excessive fatigue. Demonstrates basic conditioning appropriate for a novice fighter.',
    m_strength_foundation.how_to_achieve = 'Train consistently 3-4 times per week for 4-6 weeks. Focus on completing full training sessions (45-60 minutes) without becoming completely exhausted. Supplement training with running or additional cardio 1-2 times weekly. Track your ability to complete rounds and notice decreased fatigue over time. Achievement is when you can complete a full training session maintaining reasonable technique in later rounds.';

// DEVELOPING LEVEL MILESTONES - Building Competence

MERGE (m_three_months:Milestone {name: 'Three Months of Consistent Training'})
SET m_three_months.description = 'Accumulate three months of consistent Muay Thai training - demonstrating commitment and building a solid foundational skill base.',
    m_three_months.how_to_achieve = 'Train consistently at 3-4 sessions per week for three consecutive months. Track your attendance to ensure consistency. During this time, focus on technical improvement rather than competition. Most fighters with three months of consistent training can execute basic techniques with reasonable competence.';

MERGE (m_clinch_control:Milestone {name: 'Master Basic Clinch Control'})
SET m_clinch_control.description = 'Develop proficiency in controlling clinch positions with a partner - establishing dominant positioning and executing basic clinch techniques.',
    m_clinch_control.how_to_achieve = 'Perform dedicated clinch work 2-3 times per week for 6-8 weeks. Learn basic clinch positions: neck clinch, collar tie, plum clinch, underhook. Practice controlling balance in each position. Execute basic knee strikes from clinch. Have an experienced clinch trainer verify your technique and control. Achievement is being able to enter clinch, establish position, and maintain control against light resistance.';

MERGE (m_ground_condition:Milestone {name: 'Achieve Good Conditioning for Ground Work'})
SET m_ground_condition.description = 'Build conditioning sufficient to perform heavy bag and clinch work at intensity for extended periods without major fatigue.',
    m_ground_condition.how_to_achieve = 'Train intensively 4 times per week including heavy bag work, clinch drills, and conditioning exercises. Build ability to execute 5-minute rounds at good intensity. Run 2-3 times weekly for 30-45 minutes. After 3-4 months of dedicated conditioning work, you should feel substantially stronger and able to maintain high intensity throughout training.';

MERGE (m_combinations_flow:Milestone {name: 'Execute Flowing Combinations Smoothly'})
SET m_combinations_flow.description = 'Develop the ability to chain multiple strikes together in flowing sequences - moving beyond single techniques to integrated combinations.',
    m_combinations_flow.how_to_achieve = 'Practice pad work 3-4 times weekly drilling combinations. Shadow box combination sequences daily. Heavy bag work applying combinations. After 2-3 months of focused combination work, you should be able to execute 4-6 strike combinations flowing smoothly on pads and heavy bag. Have a coach evaluate your combination flow.';

MERGE (m_moderate_intensity:Milestone {name: 'Spar at Moderate Intensity Successfully'})
SET m_moderate_intensity.description = 'Participate in sparring at moderate contact levels - applying combinations and defenses against skilled resistance at realistic speed.',
    m_moderate_intensity.how_to_achieve = 'Achieve solid light sparring ability first (2-3 months of training). Then gradually increase sparring intensity over 4-6 weeks with progressive partners. Work with coaches to learn safe moderate intensity. Complete 3-minute rounds at moderate intensity without major incidents. Achievement is the ability to maintain technique and stay composed during moderate sparring.';

MERGE (m_first_tournament:Milestone {name: 'Compete in First Amateur Tournament'})
SET m_first_tournament.description = 'Compete in an organized amateur Muay Thai tournament or event - fighting against an opponent in an official match setting.',
    m_first_tournament.how_to_achieve = 'Train for 4-6 months building solid technical foundation and competition readiness. Work with a coach to prepare fight-specific strategies. Register for a local amateur tournament. Get a medical clearance if required. Prepare physically and mentally for competition. Achievement is stepping into the ring for your first official amateur match - winning or losing doesn\'t matter for the milestone.';

MERGE (m_eight_limbs_proficiency:Milestone {name: 'Achieve Proficiency with All Eight Limbs'})
SET m_eight_limbs_proficiency.description = 'Develop working proficiency with all major striking limbs - fists, elbows, knees, and shins - demonstrating competent technique with each.',
    m_eight_limbs_proficiency.how_to_achieve = 'Over 3-4 months of training, systematically develop strikes with all eight limbs. Focus on fist strikes (jabs, crosses, hooks) for 3-4 weeks. Then develop elbow techniques for 3-4 weeks. Learn knee strikes in clinch for 3-4 weeks. Finally develop various shin kicks for 4-6 weeks. Have a coach verify that you can execute techniques with all eight limbs at reasonable competence.';

// COMPETENT LEVEL MILESTONES - Solid Intermediate Achievement

MERGE (m_six_months:Milestone {name: 'Complete Six Months of Consistent Training'})
SET m_six_months.description = 'Accumulate six months of consistent, focused Muay Thai training at 4+ sessions per week. Demonstrates serious commitment and substantial skill development.',
    m_six_months.how_to_achieve = 'Train consistently at 4+ sessions per week for six consecutive months. Maintain training even during difficult periods. Track attendance and training quality. After six months of consistent training with good intensity, you should have solid fundamental technique and reasonable fighting ability.';

MERGE (m_range_control_mastery:Milestone {name: 'Master Range Control and Distance Management'})
SET m_range_control_mastery.description = 'Develop excellent ability to control fighting ranges - managing distance to apply your techniques while avoiding opponent\'s strengths.',
    m_range_control_mastery.how_to_achieve = 'Perform extensive sparring 2-3 times weekly for 8-12 weeks with focus on range control. Study range control in professional fights. Work with coaches on distance management. Have a coach confirm that you control range effectively in sparring - maintaining your preferred distance and preventing opponents from establishing optimal range against you.';

MERGE (m_counter_striking_dev:Milestone {name: 'Develop Effective Counter-Striking'})
SET m_counter_striking_dev.description = 'Master the ability to read incoming strikes and respond with effective counters - defensive offense that turns opponent attacks into your opportunities.',
    m_counter_striking_dev.how_to_achieve = 'Perform pad work with partner throwing strikes 2-3 times weekly for 10-12 weeks. Practice defensive sparring focusing on counters. Study counter techniques of professionals. Develop ability to read attacks and respond quickly. Achievement is executing counters successfully during sparring - responding to 60%+ of incoming attacks with effective counters.';

MERGE (m_amateur_wins:Milestone {name: 'Win Three Amateur Matches'})
SET m_amateur_wins.description = 'Achieve victory in three organized amateur Muay Thai matches - demonstrating competitive capability against varied opponents.',
    m_amateur_wins.how_to_achieve = 'Compete in amateur matches over 6-12 months. Each match is an opportunity to test yourself against different opponents. Study opponents before fights when possible. Improve based on feedback from losses. Achievement is securing three victories in official amateur competition.';

MERGE (m_advanced_footwork:Milestone {name: 'Master Advanced Footwork and Angle Creation'})
SET m_advanced_footwork.description = 'Develop sophisticated footwork enabling consistent angle creation - positioning yourself for advantage while limiting opponent options.',
    m_advanced_footwork.how_to_achieve = 'Perform advanced footwork drills 3-4 times weekly for 12+ weeks. Spar with focus on angle creation. Study angle techniques of elite fighters. Work with coaches to develop personal angle strategies. Achievement is consistently creating good angles during sparring that give you clear offensive or defensive advantages.';

MERGE (m_pressure_fighter:Milestone {name: 'Develop Pressure Fighting Ability'})
SET m_pressure_fighter.description = 'Master aggressive forward pressure - controlling range, dictating pace, and maintaining dominance through constant activity and positioning.',
    m_pressure_fighter.how_to_achieve = 'Spar 2-3 times weekly for 12+ weeks with specific focus on pressure development. Study pressure fighters. Practice sustained forward movement and positioning. Build exceptional conditioning to maintain pressure. Achievement is the ability to apply consistent, controlled forward pressure that limits opponent space and dictates fight pace.';

MERGE (m_one_year_training:Milestone {name: 'Complete One Year of Intense Training'})
SET m_one_year_training.description = 'Accumulate one year of consistent, intensive Muay Thai training at high frequency and intensity. Demonstrates substantial skill development and serious dedication.',
    m_one_year_training.how_to_achieve = 'Train at 5+ sessions per week for one full year with high intensity and focus. Include both technical work and sparring. Compete in several amateur matches during this year. After one year of intense training, fighters develop significant technical proficiency and fighting intuition.';

MERGE (m_defensive_mastery_basic:Milestone {name: 'Master Fundamental Defensive Techniques'})
SET m_defensive_mastery_basic.description = 'Develop excellent defensive ability - executing a comprehensive defensive repertoire including blocks, parries, slips, and rolls with good timing.',
    m_defensive_mastery_basic.how_to_achieve = 'Focus on defensive training 2-3 times weekly for 12+ weeks. Perform pad work with instructors calling combinations you must defend. Practice defensive sparring. Video analysis of your defensive technique. Achievement is reacting to incoming strikes defensively 85%+ of the time with appropriate and timely defensive techniques.';

// ADVANCED LEVEL MILESTONES - High-Level Competitive Achievement

MERGE (m_amateur_title:Milestone {name: 'Win Amateur Tournament or Regional Title'})
SET m_amateur_title.description = 'Achieve competitive recognition by winning an amateur tournament, regional championship, or significant amateur title.',
    m_amateur_title.how_to_achieve = 'Compete in amateur matches at regional or national level for 12-24 months. Build record of consistent victories (6-12 wins). Enter amateur tournament or regional championship. Defeat all opponents to win the title. This typically requires 18-30 months of amateur competition with good success rate.';

MERGE (m_training_partner_guide:Milestone {name: 'Successfully Train and Guide Developing Fighters'})
SET m_training_partner_guide.description = 'Demonstrate teaching ability by effectively training developing fighters - providing feedback, corrections, and helping them improve technique.',
    m_training_partner_guide.how_to_achieve = 'After 18+ months of training, begin working regularly with developing fighters during sparring and pad work. Provide technical feedback and corrections. Help them understand their mistakes and improve. Have them report noticeable improvement under your guidance. Achievement is successfully improving at least 2-3 developing fighters through your coaching and feedback.';

MERGE (m_advanced_strategies:Milestone {name: 'Develop Advanced Strategic Game Plans'})
SET m_advanced_strategies.description = 'Master sophisticated fight strategy - analyzing opponents, creating detailed game plans, and executing strategy adaptively during fights.',
    m_advanced_strategies.how_to_achieve = 'Study professional fights intensively 4-5 times weekly for 6-12 months. Work with experienced coaches on strategy analysis. Practice developing game plans for different opponent styles. Execute game plans in sparring and competition. Achievement is coaches confirming you develop sophisticated, adaptable strategies and execute them effectively.';

MERGE (m_pro_decision_fight:Milestone {name: 'Compete in First Professional Match'})
SET m_pro_decision_fight.description = 'Step into professional competition - fighting in an organized professional Muay Thai match with professional rules and officiating.',
    m_pro_decision_fight.how_to_achieve = 'Achieve strong amateur record (8-12 wins minimum). Meet professional commission requirements which vary by location. Typically requires medical clearance and licensing. Prepare physically and mentally for professional level. Compete in your first professional match. Achievement is stepping into the professional ring regardless of result.';

MERGE (m_18_months_serious:Milestone {name: 'Complete 18 Months of Serious Competitive Training'})
SET m_18_months_serious.description = 'Accumulate 18 months of serious, competition-focused Muay Thai training with regular sparring and competitive participation.',
    m_18_months_serious.how_to_achieve = 'Train at 5+ sessions per week for 18 consecutive months. Include regular competitive sparring and amateur competition. Maintain high intensity and focus on continuous improvement. Document progress through training logs and competition results.';

MERGE (m_style_specialization:Milestone {name: 'Develop Signature Fighting Style'})
SET m_style_specialization.description = 'Develop a personalized, distinctive fighting style - leveraging natural attributes and preferences into a coherent, effective approach.',
    m_style_specialization.how_to_achieve = 'After 18-24 months of training and competition, identify your natural strengths (pressure fighter, counter striker, clinch specialist, etc.). Systematically develop a style around these strengths. Train with coaches to refine and polish your style. Execute your style consistently in competition. Achievement is having coaches and competitors recognize your distinctive, effective style.';

MERGE (m_knockout_victory:Milestone {name: 'Achieve Knockout Victory in Match'})
SET m_knockout_victory.description = 'Defeat an opponent by knockout or TKO - demonstrating striking power and effective application in competitive match.',
    m_knockout_victory.how_to_achieve = 'Develop substantial striking power through training and explosive strikes. Compete regularly in amateur or professional matches. Develop offensive strategies that create openings for powerful strikes. Execute decisive strikes in matches until achieving a knockout victory. This typically requires 12-24 months of competition.';

MERGE (m_significant_opponent:Milestone {name: 'Defeat Significantly Stronger Opponent'})
SET m_significant_opponent.description = 'Achieve victory against an opponent with substantially higher ranking, experience level, or skilled background - demonstrating exceptional technical or strategic superiority.',
    m_significant_opponent.how_to_achieve = 'Develop strong technical and strategic abilities through 18+ months of training. Build confidence through progressive competition. Accept challenges against higher-ranked opponents. Analyze opponent carefully and develop specific strategies to overcome their advantages. Achievement is winning a match against an opponent significantly above your previous skill level.';

// MASTER LEVEL MILESTONES - Elite Professional Achievement

MERGE (m_pro_title:Milestone {name: 'Win Professional Championship Title'})
SET m_pro_title.description = 'Achieve elite professional recognition by winning a professional Muay Thai championship or major professional title.',
    m_pro_title.how_to_achieve = 'Compete at professional level for 24-36+ months. Build professional record of 12-20+ wins with solid win percentage (70%+). Enter professional championship competition. Defeat regional or national champion. This requires exceptional skill, strategy, conditioning, and mental toughness at elite level.';

MERGE (m_international_recognition:Milestone {name: 'Achieve International Professional Recognition'})
SET m_international_recognition.description = 'Gain recognition as a top-tier international professional fighter - ranked among elite practitioners in your weight class.',
    m_international_recognition.how_to_achieve = 'Build elite professional record (15-25+ wins) over 24-48 months. Compete against elite competition. Win against other ranked fighters. Achieve ranking in major international rankings or major titles. This represents competing and winning at the highest levels of professional Muay Thai.';

MERGE (m_master_teacher:Milestone {name: 'Establish Yourself as Master Teacher'})
SET m_master_teacher.description = 'Develop a reputation as an exceptional teacher - successfully developing multiple fighters to competitive levels and transmitting knowledge effectively.',
    m_master_teacher.how_to_achieve = 'After 24-36 months of competitive fighting, establish yourself as a regular instructor. Train a team of fighters systematically over 12-24 months. Have multiple fighters you trained achieve amateur wins. Develop reputation as knowledgeable, effective teacher. Achievement is when the gym or local community recognizes you as a master teacher creating strong fighters.';

MERGE (m_legacy_contribution:Milestone {name: 'Make Significant Contribution to Muay Thai Community'})
SET m_legacy_contribution.description = 'Contribute meaningfully to the broader Muay Thai community - through teaching, competition, innovation, or cultural preservation.',
    m_legacy_contribution.how_to_achieve = 'Over 3+ years of serious involvement in Muay Thai, identify a significant contribution. This could be: opening a successful gym, training multiple fighters to high level, publishing instructional content, pioneering new training methods, promoting Muay Thai in a new region, or preserving cultural traditions. Achievement requires substantial recognition from the Muay Thai community.';

MERGE (m_pro_level_longevity:Milestone {name: 'Maintain Professional Career for Multiple Years'})
SET m_pro_level_longevity.description = 'Sustain a successful professional fighting career for 3+ years at elite level - demonstrating sustained excellence and career management.',
    m_pro_level_longevity.how_to_achieve = 'Compete professionally for 36+ months with consistent success. Manage training, recovery, and competition carefully over this extended period. Maintain competitive level despite accumulated training volume and injury recovery. Achievement is sustaining professional competition for multiple years with respectable win percentage.';

MERGE (m_perfect_rounds:Milestone {name: 'Achieve Perfect Scoring Rounds in Competition'})
SET m_perfect_rounds.description = 'Execute a fight round with such dominant and effective striking that judges award the round unanimously with maximum points.',
    m_perfect_rounds.how_to_achieve = 'Develop exceptional offensive mastery. Execute complete dominance in at least one full fight round. Achieve 10-9 or 10-8 scoring from all judges in that round due to clear superiority. This requires both technical excellence and strategic dominance. Achievement is judges awarding a round with all judges in complete agreement on your dominance.';

MERGE (m_style_innovation:Milestone {name: 'Innovate and Evolve Muay Thai Technique'})
SET m_style_innovation.description = 'Develop or popularize novel techniques, combinations, or strategic approaches that are adopted by other fighters.',
    m_style_innovation.how_to_achieve = 'After 24-36+ months of elite competition, identify gaps in current technique or strategy. Systematically develop innovations addressing these gaps. Implement innovations in your own fighting with success. Document and share innovations with students and community. Achievement is when other fighters begin imitating your innovations and the broader community adopts them.';

MERGE (m_psychological_dominance:Milestone {name: 'Establish Psychological Dominance Over Opponents'})
SET m_psychological_dominance.description = 'Develop such mastery and presence that opponents enter the ring already disadvantaged psychologically - questioning their ability to compete effectively.',
    m_psychological_dominance.how_to_achieve = 'Over years of elite competition, build an overwhelming reputation. Defeat multiple high-level opponents decisively. Execute your style with such excellence that opponents recognize the skill gap. Over 3-5 years of elite competition, achieve status where your mere presence creates psychological pressure on opponents. Achievement is competitors openly discussing the psychological challenge of facing you.';

MERGE (m_mastery_all_ranges:Milestone {name: 'Master All Fighting Ranges and Transitions'})
SET m_mastery_all_ranges.description = 'Achieve complete mastery of all fighting ranges - long range kicking, medium range punching, and close range clinch work - with seamless transitions between them.',
    m_mastery_all_ranges.how_to_achieve = 'Over 24-36+ months of training and competition, systematically master each range. Develop excellent long-range kicking game. Master medium-range punching combinations. Develop crushing clinch and close-range game. Seamlessly transition between ranges. Achievement is consistently demonstrating mastery and comfort fighting in all ranges against elite opponents.';


// ============================================================
// Agent 3: Relationships and Level Assignments
// ============================================================

// BELONGS_TO_DOMAIN relationships for all components

MATCH (d:Domain {name: 'Muay Thai'})
UNWIND [
  'Muay Thai Stance Fundamentals',
  'Hand Guard and Head Movement',
  'Basic Punch Techniques',
  'Shin Kick and Low Kick Fundamentals',
  'Basic Combination Theory',
  'Muay Thai Safety and Injury Prevention',
  'Clinching Techniques and Control',
  'Knee Strike Techniques',
  'Elbow Strike Techniques',
  'Advanced Footwork and Ring Movement',
  'Distance Management and Range Control',
  'Advanced Combination Sequencing',
  'Defensive Techniques and Countering',
  'Muay Thai Training Conditioning and Fitness',
  'Fight Strategy and Opponent Analysis',
  'Complex Multi-Phase Combinations with Feints',
  'Pressure Fighting and Ring Control',
  'Advanced Countering and Defensive Offense',
  'Advanced Clinch Dominance and Sweeps',
  'Advanced Angles and Position Creation',
  'Muay Thai Philosophy and Cultural Understanding',
  'Advanced Teaching and Knowledge Transmission',
  'Cutting-Edge Developments and Innovation in Muay Thai',
  'Ring Psychology and Mental Mastery',
  'Movement Analysis and Research Methods'
] AS kname
MATCH (k:Knowledge {name: kname})
CREATE (d)-[:INCLUDES_KNOWLEDGE]->(k);

MATCH (d:Domain {name: 'Muay Thai'})
UNWIND [
  'Proper Fighting Stance',
  'Basic Footwork',
  'Defensive Guard Positioning',
  'Basic Jab',
  'Basic Cross Punch',
  'Basic Low Kick',
  'Heavy Bag Training',
  'Safety Awareness and Protection',
  'Body Kick Technique',
  'Hook Punch Technique',
  'Clinch Entry and Control',
  'Knee Strike from Clinch',
  'Basic Elbow Strike',
  'Pad Work Training',
  'Light Sparring',
  'Flowing Combinations',
  'Reactive Defense',
  'Head Kick Technique',
  'Advanced Clinch Techniques',
  'Moderate Intensity Sparring',
  'Advanced Footwork and Angle Creation',
  'Pressure Fighting and Dominance',
  'Counter Striking',
  'Ring Sense and Positioning',
  'Advanced Conditioning and Endurance',
  'Fight Game Planning and Strategy',
  'Feinting and Deception',
  'Mental Mastery and Composure',
  'Expert Timing and Rhythm',
  'Style Adaptation and Opponent Neutralization',
  'Defensive Mastery and Evasion',
  'Offensive Mastery and Dominance',
  'Fight Experience and Intuition'
] AS sname
MATCH (s:Skill {name: sname})
CREATE (d)-[:INCLUDES_SKILL]->(s);

MATCH (d:Domain {name: 'Muay Thai'})
UNWIND [
  'Explosiveness and Power Generation',
  'Cardiovascular Endurance',
  'Reaction Time and Speed',
  'Body Coordination and Movement Efficiency',
  'Mental Resilience and Composure'
] AS tname
MATCH (t:Trait {name: tname})
CREATE (d)-[:INCLUDES_TRAIT]->(t);

MATCH (d:Domain {name: 'Muay Thai'})
UNWIND [
  'Complete First Muay Thai Class',
  'Learn to Wrap Hands and Wrists Properly',
  'Complete First Heavy Bag Session',
  'Three Months of Consistent Training',
  'Participate in First Light Sparring Session',
  'Master Fundamental Defensive Techniques',
  'Master Basic Clinch Control',
  'Complete Six Months of Consistent Training',
  'Build Basic Conditioning Foundation',
  'Achieve Proficiency with All Eight Limbs',
  'Execute Flowing Combinations Smoothly',
  'Develop Effective Counter-Striking',
  'Spar at Moderate Intensity Successfully',
  'Complete One Year of Intense Training',
  'Achieve Good Conditioning for Ground Work',
  'Master Range Control and Distance Management',
  'Develop Pressure Fighting Ability',
  'Compete in First Amateur Tournament',
  'Defeat Significantly Stronger Opponent',
  'Win Three Amateur Matches',
  'Develop Signature Fighting Style',
  'Master Advanced Footwork and Angle Creation',
  'Develop Advanced Strategic Game Plans',
  'Master All Fighting Ranges and Transitions',
  'Achieve Perfect Scoring Rounds in Competition',
  'Complete 18 Months of Serious Competitive Training',
  'Win Amateur Tournament or Regional Title',
  'Compete in First Professional Match',
  'Achieve Knockout Victory in Match',
  'Establish Psychological Dominance Over Opponents',
  'Maintain Professional Career for Multiple Years',
  'Win Professional Championship Title',
  'Achieve International Professional Recognition',
  'Establish Yourself as Master Teacher',
  'Successfully Train and Guide Developing Fighters',
  'Innovate and Evolve Muay Thai Technique',
  'Make Significant Contribution to Muay Thai Community'
] AS mname
MATCH (m:Milestone {name: mname})
CREATE (d)-[:INCLUDES_MILESTONE]->(m);

// ============================================================
// KNOWLEDGE PREREQUISITES
// ============================================================

// Basic concepts are foundational
MATCH (k1:Knowledge {name: 'Hand Guard and Head Movement'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

MATCH (k1:Knowledge {name: 'Basic Punch Techniques'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

MATCH (k1:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Safety and Injury Prevention'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

// Intermediate knowledge builds on basics
MATCH (k1:Knowledge {name: 'Basic Combination Theory'})
MATCH (k2:Knowledge {name: 'Basic Punch Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Basic Combination Theory'})
MATCH (k2:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Clinching Techniques and Control'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Clinching Techniques and Control'})
MATCH (k2:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Knee Strike Techniques'})
MATCH (k2:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Elbow Strike Techniques'})
MATCH (k2:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Distance Management and Range Control'})
MATCH (k2:Knowledge {name: 'Basic Punch Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Distance Management and Range Control'})
MATCH (k2:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Defensive Techniques and Countering'})
MATCH (k2:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Defensive Techniques and Countering'})
MATCH (k2:Knowledge {name: 'Basic Punch Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced knowledge requires intermediate foundation
MATCH (k1:Knowledge {name: 'Advanced Combination Sequencing'})
MATCH (k2:Knowledge {name: 'Basic Combination Theory'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Combination Sequencing'})
MATCH (k2:Knowledge {name: 'Distance Management and Range Control'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Footwork and Ring Movement'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
MATCH (k2:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
MATCH (k2:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Pressure Fighting and Ring Control'})
MATCH (k2:Knowledge {name: 'Advanced Footwork and Ring Movement'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Clinch Dominance and Sweeps'})
MATCH (k2:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Clinch Dominance and Sweeps'})
MATCH (k2:Knowledge {name: 'Knee Strike Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Countering and Defensive Offense'})
MATCH (k2:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Countering and Defensive Offense'})
MATCH (k2:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Angles and Position Creation'})
MATCH (k2:Knowledge {name: 'Advanced Footwork and Ring Movement'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Expert knowledge requires mastery of advanced concepts
MATCH (k1:Knowledge {name: 'Complex Multi-Phase Combinations with Feints'})
MATCH (k2:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Ring Psychology and Mental Mastery'})
MATCH (k2:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Philosophy and Cultural Understanding'})
MATCH (k2:Knowledge {name: 'Muay Thai Safety and Injury Prevention'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Teaching and Knowledge Transmission'})
MATCH (k2:Knowledge {name: 'Muay Thai Philosophy and Cultural Understanding'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Cutting-Edge Developments and Innovation in Muay Thai'})
MATCH (k2:Knowledge {name: 'Complex Multi-Phase Combinations with Feints'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Analyze'}]->(k2);

// ============================================================
// SKILL PREREQUISITES
// ============================================================

// Basic skills have few or no prerequisites
MATCH (s:Skill {name: 'Proper Fighting Stance'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Defensive Guard Positioning'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Basic Footwork'})
MATCH (s2:Skill {name: 'Proper Fighting Stance'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Basic Jab'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Basic Jab'})
MATCH (s2:Skill {name: 'Proper Fighting Stance'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s:Skill {name: 'Basic Cross Punch'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Basic Cross Punch'})
MATCH (s2:Skill {name: 'Basic Jab'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Basic Low Kick'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Basic Low Kick'})
MATCH (s2:Skill {name: 'Proper Fighting Stance'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Safety Awareness and Protection'})
MATCH (k:Knowledge {name: 'Muay Thai Safety and Injury Prevention'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k);

MATCH (s:Skill {name: 'Heavy Bag Training'})
MATCH (s2:Skill {name: 'Basic Jab'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s:Skill {name: 'Heavy Bag Training'})
MATCH (s3:Skill {name: 'Basic Low Kick'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s3);

// Intermediate skills build on basics
MATCH (s:Skill {name: 'Body Kick Technique'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Body Kick Technique'})
MATCH (s2:Skill {name: 'Basic Low Kick'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s:Skill {name: 'Hook Punch Technique'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Hook Punch Technique'})
MATCH (s2:Skill {name: 'Basic Cross Punch'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Clinch Entry and Control'})
MATCH (k:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Clinch Entry and Control'})
MATCH (s2:Skill {name: 'Proper Fighting Stance'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Knee Strike from Clinch'})
MATCH (k:Knowledge {name: 'Knee Strike Techniques'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Knee Strike from Clinch'})
MATCH (s2:Skill {name: 'Clinch Entry and Control'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Basic Elbow Strike'})
MATCH (k:Knowledge {name: 'Elbow Strike Techniques'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Basic Elbow Strike'})
MATCH (s2:Skill {name: 'Clinch Entry and Control'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s:Skill {name: 'Pad Work Training'})
MATCH (s2:Skill {name: 'Heavy Bag Training'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Pad Work Training'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (s:Skill {name: 'Reactive Defense'})
MATCH (k:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Reactive Defense'})
MATCH (s2:Skill {name: 'Defensive Guard Positioning'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Light Sparring'})
MATCH (s2:Skill {name: 'Pad Work Training'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s:Skill {name: 'Light Sparring'})
MATCH (s3:Skill {name: 'Reactive Defense'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s3);

MATCH (s:Skill {name: 'Flowing Combinations'})
MATCH (k:Knowledge {name: 'Basic Combination Theory'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Flowing Combinations'})
MATCH (s2:Skill {name: 'Pad Work Training'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Advanced skills require strong intermediate foundation
MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (s2:Skill {name: 'Body Kick Technique'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (s:Skill {name: 'Advanced Clinch Techniques'})
MATCH (k:Knowledge {name: 'Advanced Clinch Dominance and Sweeps'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Advanced Clinch Techniques'})
MATCH (s2:Skill {name: 'Clinch Entry and Control'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
MATCH (k:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
MATCH (s2:Skill {name: 'Light Sparring'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (s:Skill {name: 'Advanced Footwork and Angle Creation'})
MATCH (k:Knowledge {name: 'Advanced Footwork and Ring Movement'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Advanced Footwork and Angle Creation'})
MATCH (s2:Skill {name: 'Basic Footwork'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Counter Striking'})
MATCH (k:Knowledge {name: 'Advanced Countering and Defensive Offense'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Counter Striking'})
MATCH (s2:Skill {name: 'Reactive Defense'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Counter Striking'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (s:Skill {name: 'Pressure Fighting and Dominance'})
MATCH (k:Knowledge {name: 'Pressure Fighting and Ring Control'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Pressure Fighting and Dominance'})
MATCH (s2:Skill {name: 'Advanced Footwork and Angle Creation'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s:Skill {name: 'Pressure Fighting and Dominance'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (s:Skill {name: 'Ring Sense and Positioning'})
MATCH (k:Knowledge {name: 'Distance Management and Range Control'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Ring Sense and Positioning'})
MATCH (s2:Skill {name: 'Advanced Footwork and Angle Creation'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s:Skill {name: 'Advanced Conditioning and Endurance'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

// Expert skills require mastery of multiple advanced skills
MATCH (s:Skill {name: 'Fight Game Planning and Strategy'})
MATCH (k:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Fight Game Planning and Strategy'})
MATCH (s2:Skill {name: 'Moderate Intensity Sparring'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Feinting and Deception'})
MATCH (k:Knowledge {name: 'Complex Multi-Phase Combinations with Feints'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Feinting and Deception'})
MATCH (s2:Skill {name: 'Flowing Combinations'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Mental Mastery and Composure'})
MATCH (k:Knowledge {name: 'Ring Psychology and Mental Mastery'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Mental Mastery and Composure'})
MATCH (t:Trait {name: 'Mental Resilience and Composure'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (s:Skill {name: 'Expert Timing and Rhythm'})
MATCH (s2:Skill {name: 'Counter Striking'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Expert Timing and Rhythm'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (s:Skill {name: 'Style Adaptation and Opponent Neutralization'})
MATCH (k:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Style Adaptation and Opponent Neutralization'})
MATCH (s2:Skill {name: 'Moderate Intensity Sparring'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Defensive Mastery and Evasion'})
MATCH (k:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Defensive Mastery and Evasion'})
MATCH (s2:Skill {name: 'Reactive Defense'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Offensive Mastery and Dominance'})
MATCH (k:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s:Skill {name: 'Offensive Mastery and Dominance'})
MATCH (s2:Skill {name: 'Flowing Combinations'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s:Skill {name: 'Fight Experience and Intuition'})
MATCH (s2:Skill {name: 'Moderate Intensity Sparring'})
CREATE (s)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// ============================================================
// TRAIT PREREQUISITES
// Traits have no prerequisites - they are inherent characteristics
// ============================================================

// ============================================================
// DEVELOPS_TRAIT RELATIONSHIPS
// ============================================================

MATCH (s:Skill {name: 'Proper Fighting Stance'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 10}]->(t);

MATCH (s:Skill {name: 'Basic Footwork'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 12}]->(t);

MATCH (s:Skill {name: 'Basic Jab'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 8}]->(t);

MATCH (s:Skill {name: 'Basic Cross Punch'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 12}]->(t);

MATCH (s:Skill {name: 'Basic Low Kick'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

MATCH (s:Skill {name: 'Heavy Bag Training'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

MATCH (s:Skill {name: 'Body Kick Technique'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 18}]->(t);

MATCH (s:Skill {name: 'Body Kick Technique'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 10}]->(t);

MATCH (s:Skill {name: 'Pad Work Training'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 12}]->(t);

MATCH (s:Skill {name: 'Pad Work Training'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 8}]->(t);

MATCH (s:Skill {name: 'Light Sparring'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 12}]->(t);

MATCH (s:Skill {name: 'Light Sparring'})
MATCH (t:Trait {name: 'Mental Resilience and Composure'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 10}]->(t);

MATCH (s:Skill {name: 'Flowing Combinations'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

MATCH (s:Skill {name: 'Reactive Defense'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 20}]->(t);

MATCH (s:Skill {name: 'Head Kick Technique'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 18}]->(t);

MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 20}]->(t);

MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
MATCH (t:Trait {name: 'Mental Resilience and Composure'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

MATCH (s:Skill {name: 'Advanced Footwork and Angle Creation'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 18}]->(t);

MATCH (s:Skill {name: 'Counter Striking'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 18}]->(t);

MATCH (s:Skill {name: 'Pressure Fighting and Dominance'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 25}]->(t);

MATCH (s:Skill {name: 'Advanced Conditioning and Endurance'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 30}]->(t);

MATCH (s:Skill {name: 'Mental Mastery and Composure'})
MATCH (t:Trait {name: 'Mental Resilience and Composure'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 25}]->(t);

MATCH (s:Skill {name: 'Expert Timing and Rhythm'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (s)-[:DEVELOPS_TRAIT {potential_points: 15}]->(t);

// ============================================================
// LEVEL 1 (NOVICE) REQUIREMENTS
// ============================================================

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Safety and Injury Prevention'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Proper Fighting Stance'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Defensive Guard Positioning'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Basic Footwork'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Basic Jab'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Basic Cross Punch'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Basic Low Kick'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (s:Skill {name: 'Safety Awareness and Protection'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Novice'})
MATCH (m:Milestone {name: 'Complete First Muay Thai Class'})
CREATE (level1)-[:REQUIRES_MILESTONE]->(m);

// ============================================================
// LEVEL 2 (DEVELOPING) REQUIREMENTS
// ============================================================

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Knee Strike Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Elbow Strike Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (k:Knowledge {name: 'Basic Combination Theory'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Proper Fighting Stance'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Defensive Guard Positioning'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Basic Footwork'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Basic Jab'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Basic Cross Punch'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Basic Low Kick'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Heavy Bag Training'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Body Kick Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Clinch Entry and Control'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Pad Work Training'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (s:Skill {name: 'Reactive Defense'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (m:Milestone {name: 'Three Months of Consistent Training'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Developing'})
MATCH (m:Milestone {name: 'Participate in First Light Sparring Session'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 3 (COMPETENT) REQUIREMENTS
// ============================================================

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Knee Strike Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Elbow Strike Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Basic Combination Theory'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (k:Knowledge {name: 'Distance Management and Range Control'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Proper Fighting Stance'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Defensive Guard Positioning'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Basic Footwork'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Basic Jab'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Basic Cross Punch'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Basic Low Kick'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Body Kick Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Hook Punch Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Clinch Entry and Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Knee Strike from Clinch'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Basic Elbow Strike'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Pad Work Training'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Reactive Defense'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Light Sparring'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (s:Skill {name: 'Flowing Combinations'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (m:Milestone {name: 'Complete Six Months of Consistent Training'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Competent'})
MATCH (m:Milestone {name: 'Achieve Proficiency with All Eight Limbs'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 4 (ADVANCED) REQUIREMENTS
// ============================================================

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Clinching Techniques and Control'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Knee Strike Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Elbow Strike Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Distance Management and Range Control'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (k:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Proper Fighting Stance'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Defensive Guard Positioning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Basic Footwork'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Basic Jab'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Basic Cross Punch'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Basic Low Kick'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Body Kick Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Head Kick Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Hook Punch Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Clinch Entry and Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Advanced Clinch Techniques'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Knee Strike from Clinch'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Basic Elbow Strike'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Pad Work Training'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Reactive Defense'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Light Sparring'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Flowing Combinations'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Advanced Footwork and Angle Creation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Counter Striking'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (s:Skill {name: 'Ring Sense and Positioning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (m:Milestone {name: 'Complete One Year of Intense Training'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Advanced'})
MATCH (m:Milestone {name: 'Compete in First Amateur Tournament'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 5 (MASTER) REQUIREMENTS
// ============================================================

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Muay Thai Stance Fundamentals'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Hand Guard and Head Movement'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Basic Punch Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Shin Kick and Low Kick Fundamentals'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Advanced Combination Sequencing'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Defensive Techniques and Countering'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Advanced Footwork and Ring Movement'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Fight Strategy and Opponent Analysis'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Advanced Clinch Dominance and Sweeps'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Complex Multi-Phase Combinations with Feints'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Ring Psychology and Mental Mastery'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Muay Thai Philosophy and Cultural Understanding'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (k:Knowledge {name: 'Advanced Teaching and Knowledge Transmission'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Proper Fighting Stance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Defensive Guard Positioning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Basic Footwork'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Basic Jab'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Basic Cross Punch'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Basic Low Kick'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Body Kick Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Head Kick Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Hook Punch Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Clinch Entry and Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Advanced Clinch Techniques'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Moderate Intensity Sparring'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Advanced Footwork and Angle Creation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Pressure Fighting and Dominance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Counter Striking'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Ring Sense and Positioning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Advanced Conditioning and Endurance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Fight Game Planning and Strategy'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Feinting and Deception'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Mental Mastery and Composure'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Expert Timing and Rhythm'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Style Adaptation and Opponent Neutralization'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Defensive Mastery and Evasion'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Offensive Mastery and Dominance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (s:Skill {name: 'Fight Experience and Intuition'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Explosiveness and Power Generation'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Body Coordination and Movement Efficiency'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Cardiovascular Endurance'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Reaction Time and Speed'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (t:Trait {name: 'Mental Resilience and Composure'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Complete 18 Months of Serious Competitive Training'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Master All Fighting Ranges and Transitions'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Win Amateur Tournament or Regional Title'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Master'})
MATCH (m:Milestone {name: 'Compete in First Professional Match'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// MILESTONE PREREQUISITES
// ============================================================

MATCH (m1:Milestone {name: 'Learn to Wrap Hands and Wrists Properly'})
MATCH (m2:Milestone {name: 'Complete First Muay Thai Class'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Heavy Bag Session'})
MATCH (m2:Milestone {name: 'Learn to Wrap Hands and Wrists Properly'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Participate in First Light Sparring Session'})
MATCH (m2:Milestone {name: 'Three Months of Consistent Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Fundamental Defensive Techniques'})
MATCH (m2:Milestone {name: 'Participate in First Light Sparring Session'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Basic Clinch Control'})
MATCH (m2:Milestone {name: 'Three Months of Consistent Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Execute Flowing Combinations Smoothly'})
MATCH (m2:Milestone {name: 'Complete Six Months of Consistent Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Effective Counter-Striking'})
MATCH (m2:Milestone {name: 'Participate in First Light Sparring Session'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Proficiency with All Eight Limbs'})
MATCH (m2:Milestone {name: 'Complete Six Months of Consistent Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Spar at Moderate Intensity Successfully'})
MATCH (m2:Milestone {name: 'Participate in First Light Sparring Session'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Range Control and Distance Management'})
MATCH (m2:Milestone {name: 'Spar at Moderate Intensity Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Pressure Fighting Ability'})
MATCH (m2:Milestone {name: 'Spar at Moderate Intensity Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Signature Fighting Style'})
MATCH (m2:Milestone {name: 'Complete One Year of Intense Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Advanced Footwork and Angle Creation'})
MATCH (m2:Milestone {name: 'Develop Signature Fighting Style'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Advanced Strategic Game Plans'})
MATCH (m2:Milestone {name: 'Compete in First Amateur Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master All Fighting Ranges and Transitions'})
MATCH (m2:Milestone {name: 'Master Advanced Footwork and Angle Creation'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master All Fighting Ranges and Transitions'})
MATCH (m2:Milestone {name: 'Develop Advanced Strategic Game Plans'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Perfect Scoring Rounds in Competition'})
MATCH (m2:Milestone {name: 'Win Three Amateur Matches'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Win Three Amateur Matches'})
MATCH (m2:Milestone {name: 'Compete in First Amateur Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Defeat Significantly Stronger Opponent'})
MATCH (m2:Milestone {name: 'Compete in First Amateur Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Compete in First Amateur Tournament'})
MATCH (m2:Milestone {name: 'Complete One Year of Intense Training'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Compete in First Professional Match'})
MATCH (m2:Milestone {name: 'Win Three Amateur Matches'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Compete in First Professional Match'})
MATCH (m2:Milestone {name: 'Master All Fighting Ranges and Transitions'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Knockout Victory in Match'})
MATCH (m2:Milestone {name: 'Compete in First Professional Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Psychological Dominance Over Opponents'})
MATCH (m2:Milestone {name: 'Compete in First Professional Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Win Amateur Tournament or Regional Title'})
MATCH (m2:Milestone {name: 'Win Three Amateur Matches'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Win Professional Championship Title'})
MATCH (m2:Milestone {name: 'Maintain Professional Career for Multiple Years'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Maintain Professional Career for Multiple Years'})
MATCH (m2:Milestone {name: 'Compete in First Professional Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve International Professional Recognition'})
MATCH (m2:Milestone {name: 'Win Professional Championship Title'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Yourself as Master Teacher'})
MATCH (m2:Milestone {name: 'Achieve International Professional Recognition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Train and Guide Developing Fighters'})
MATCH (m2:Milestone {name: 'Compete in First Amateur Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Innovate and Evolve Muay Thai Technique'})
MATCH (m2:Milestone {name: 'Master All Fighting Ranges and Transitions'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Make Significant Contribution to Muay Thai Community'})
MATCH (m2:Milestone {name: 'Establish Yourself as Master Teacher'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// ============================================================
// Validation: All relationships created
// ============================================================

// ============================================================
// Agent 4: Quality Validation
// ============================================================

// VALIDATION SUMMARY
// Recommendation: APPROVE
// Overall Assessment: Muay Thai domain is comprehensive, well-structured, and ready for production. The domain demonstrates excellent coverage across all component types with logical progression from novice to master levels. All relationships are properly defined with no circular dependencies. Content quality is high with domain-specific, actionable guidance for all components.

// COVERAGE ASSESSMENT
// Knowledge: Comprehensive coverage from foundational concepts (stance, guard, basic strikes) through intermediate (clinching, combinations, defensive techniques) to advanced (strategy, pressure fighting) and master-level (philosophy, teaching, innovation). 25 knowledge nodes provide complete coverage of the "8 limbs" framework and strategic aspects. No obvious gaps that would prevent progression.
// Skills: Excellent coverage with 33 skill nodes spanning all major domains - striking (jabs, crosses, kicks), clinching, footwork, sparring, conditioning, and strategic execution. Skills clearly map to knowledge prerequisites and demonstrate logical progression. Skills develop from single-technique focus to complex integration and strategic application.
// Traits: 5 core traits appropriately selected for a striking-based martial art: Explosiveness, Cardiovascular Endurance, Body Coordination, Reaction Time, and Mental Resilience. These traits are genuinely fundamental to Muay Thai performance and appropriately influence multiple skills throughout progression.
// Milestones: 37 meaningful milestones span the full progression from "Complete First Muay Thai Class" and "Learn to Wrap Hands" through intermediate achievements (first sparring, consistent training) to advanced accomplishments (competing, professional success) and master-level contributions (teaching, innovation). Milestones are specific, measurable, and appropriately distributed across all levels.

// COHERENCE CHECKS
// Domain Alignment: All components are directly aligned with Muay Thai's scope. Knowledge covers the 8 limbs (fists, elbows, knees, shins) plus clinching, footwork, and strategy. Skills translate knowledge into practical ability. Traits are specific to striking martial arts. Scope_included items are comprehensively addressed. Scope_excluded items (boxing, wrestling, yoga, conditioning as separate domains) are properly excluded.
// Level Progression: Progression from Novice → Developing → Competent → Advanced → Master is logical and realistic. Novice focuses on safety and basic stance/guard. Developing adds intermediate techniques (kicks, clinching, combinations). Competent achieves solid multi-technique execution. Advanced builds strategy and optimization. Master encompasses teaching, innovation, and international recognition. Level descriptions accurately reflect domain requirements and appropriately differentiate.
// Relationship Logic: Prerequisites make logical sense throughout. Early skills require foundational knowledge and stance/footwork. Advanced skills require multiple intermediate skills plus appropriate trait levels. Milestone chains progress realistically - competitive milestones require prior training and sparring experience. Trait requirements are appropriate (e.g., head kick requires high coordination/explosiveness). No circular dependencies detected.

// QUALITY CHECKS
// Content Quality: Descriptions are consistently clear, specific, and domain-appropriate. How_to_learn/develop/achieve guidance is practical and actionable with time estimates provided. Content is distinctly Muay Thai-specific with references to clinching, 8 limbs framework, pad work, and Thai cultural elements. Measurement criteria for traits are concrete and observable.
// Completeness: All Knowledge nodes include: name, description, how_to_learn, and Bloom's taxonomy levels (remember through create). All Skill nodes include: name, description, how_to_develop, and Dreyfus progression levels. All Trait nodes include: name, description, measurement_criteria. All Milestone nodes include: name, description, how_to_achieve. All Domain_Level nodes include: domain, level, name, description. Every component fully populated.
// Redundancy: No significant redundancy detected. While multiple nodes address striking (jabs, crosses, kicks, elbows, knees), each targets distinct techniques with appropriate separation. Clinching is clearly distinguished from striking techniques. Knowledge and skill nodes have appropriate separation of conceptual understanding from practical execution. No components appear to be duplicates or highly overlapping.

// ISSUES IDENTIFIED
// Critical: None - domain structure is sound with no fundamental coherence problems, realistic progression, or architectural issues.
// Major: None - all component coverage is appropriate, prerequisites are logical, and content quality is high.
// Minor: 
//  - Milestone "Make Significant Contribution to Muay Thai Community" could be more specific about what constitutes this contribution
//  - Could potentially benefit from a milestone specifically about injury recovery/comeback, though this may be outside domain scope

// STRENGTHS
// - Exceptional domain structure with clear mapping to Muay Thai's "8 limbs" philosophy
// - Realistic progression milestones from first class through professional competition to master-level contribution
// - Strong integration of physical traits with skill development through explicit DEVELOPS_TRAIT relationships
// - Comprehensive coverage of both technical (striking, clinching) and strategic (reading opponents, game planning) aspects
// - Excellent inclusion of cultural and philosophical dimensions (wai kru, respect traditions, philosophy)
// - Well-balanced Dreyfus progression levels for skills with realistic advancement expectations
// - Clear time estimates for learning progression that respect the martial art's learning curve
// - Strong mental/psychological components appropriate to competitive martial arts (mental mastery, composure, ring psychology)

// RECOMMENDATION DETAILS
// APPROVE - This domain is comprehensive, coherent, and production-ready.
//
// The Muay Thai domain demonstrates excellent understanding of the martial art's structure and progression. Components are appropriately scoped and balanced. The progression from novice (first class) to master (international professional recognition) is realistic and achievable. Relationships between knowledge, skills, traits, and milestones are logical and well-founded.
//
// Key strengths:
// - Complete coverage of the "8 limbs" framework (fists, elbows, knees, shins) plus essential supporting techniques
// - Realistic skill progression respecting martial arts learning curves (3-4 months for novice competence, years for advanced mastery)
// - Integration of physical, technical, and psychological dimensions
// - Appropriate trait influence on skill development
// - Cultural and philosophical dimensions appropriate to the art form
//
// This domain is ready for immediate deployment to the Neo4j database. Quality Score: 92/100

// EXAMPLE PROGRESSION PATHS
//
// Path 1: "Dedicated Hobbyist" - 2 Year Journey
// Week 1: Completes first class, learns safety protocols
// Weeks 2-3: Masters hand wrapping, basic stance, safety equipment
// Months 1-3: Develops proper stance and guard through daily drills, begins heavy bag work
// Months 4-8: Masters fundamental kicks and punches, progresses to pad work
// Months 9-16: Adds clinching skills, participates in light sparring with peers
// Outcome: Competent-level ability to train independently, spar safely, maintain technique over multiple rounds. Strong foundation for continued growth if desired.
//
// Path 2: "Ambitious Amateur Competitor" - 3.5 Year Journey
// Months 1-6: Accelerated progression through novice level with 6 days/week training
// Months 7-12: Masters developing-level techniques, begins pad work with competitive-level partners
// Months 13-18: Achieves competent level, participates in competitive sparring
// Year 2: Competes in first amateur tournament, wins series of amateur matches
// Years 2.5-3.5: Develops signature fighting style, wins amateur regional title
// Outcome: Amateur competitor with fight record, ready for professional transition if desired.
//
// Path 3: "Professional Fighter" - 7-10 Year Trajectory  
// Years 1-2: Foundation - achieves competent-level mastery of all fundamentals
// Years 2-4: Intermediate - develops advanced combinations, strategy, competitive experience
// Years 4-6: Advanced - competes professionally, develops unique fighting style, gains international recognition
// Years 6-10: Master level - maintains professional success or transitions to elite coaching/teaching
// Outcome: Professional athlete with potential championship recognition and lasting impact on the martial art.

// ============================================================
// Validation Complete - Domain Ready for Deployment
// Quality Score: 92/100
// Recommendation: APPROVE
// ============================================================
