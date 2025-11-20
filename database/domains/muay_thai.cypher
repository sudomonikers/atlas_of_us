// Domain: Muay Thai
// Generated: 2025-11-15
// Description: The ancient martial art known as "The Art of Eight Limbs" - a combat sport from Thailand that combines striking techniques using fists, elbows, knees, and shins with clinch work, defensive tactics, and a rich cultural tradition including Wai Kru rituals and Muay Thai music.

// ============================================================
// DOMAIN: Muay Thai
// Generated: 2025-11-15
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Muay Thai',
  description: 'The Art of Eight Limbs - a traditional Thai martial art and combat sport that utilizes fists, elbows, knees, and shins combined with clinch work, defensive tactics, conditioning, and cultural rituals to develop complete striking ability and martial excellence',
  level_count: 5,
  created_date: date(),
  scope_included: ['striking techniques (punches, kicks, elbows, knees)', 'clinch work and neck control', 'defensive tactics and blocking', 'footwork and movement patterns', 'conditioning and physical preparation', 'sparring and ring performance', 'Wai Kru ritual and cultural traditions', 'mental discipline and ring intelligence', 'heavy bag and pad work', 'combination development'],
  scope_excluded: ['general martial arts philosophy (separate domain)', 'MMA (separate domain - includes grappling and different striking)', 'kickboxing (separate domain - lacks clinch and cultural elements)', 'boxing (separate domain - different striking mechanics)', 'Thai boxing training facilities management (separate domain)', 'dietary and nutritional practices (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Muay Thai Novice',
  description: 'Learning foundational striking mechanics, basic guard, footwork patterns, and introductory pad work with controlled pace and focus on proper form over power'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Muay Thai Developing',
  description: 'Developing proficiency in all eight limbs, building combinations, improving clinch understanding, increasing ring awareness, and gaining confidence in light sparring situations'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Muay Thai Competent',
  description: 'Demonstrating solid striking ability with clean technique, executing complex combinations fluidly, controlling clinch exchanges, performing in amateur matches, and showing tactical ring awareness'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Muay Thai Advanced',
  description: 'Operating at high skill levels with consistent victories, demonstrating sophisticated defensive tactics, using clinch dominantly, recognizing and exploiting patterns, mentoring younger fighters, and contributing to gym culture'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Muay Thai Master',
  description: 'Achieving expert-level mastery with dominant ring presence, inventing signature techniques, fighting at elite levels (professional or competitive), shaping the development of the sport, and embodying the art\'s philosophical traditions'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Muay Thai'})
MATCH (level1:Domain_Level {name: 'Muay Thai Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Muay Thai'})
MATCH (level2:Domain_Level {name: 'Muay Thai Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Muay Thai'})
MATCH (level3:Domain_Level {name: 'Muay Thai Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Muay Thai'})
MATCH (level4:Domain_Level {name: 'Muay Thai Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Muay Thai'})
MATCH (level5:Domain_Level {name: 'Muay Thai Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge - Novice Level

MERGE (k:Knowledge {name: 'Muay Thai Stance and Guard'})
ON CREATE SET k.description = 'The fundamental fighting position including feet placement, knee bending, hands positioning, chin tuck, and hip rotation that forms the foundation for all Muay Thai techniques',
              k.how_to_learn = 'Practice stance drills for 15-20 minutes daily with a coach. Hold stance while throwing basic punches. Record yourself and compare to instructional videos. Expected time: 2-3 weeks of consistent practice.',
              k.remember_level = 'Recall the basic stance position: feet shoulder-width apart, knees slightly bent, hands up, elbows in',
              k.understand_level = 'Explain why feet placement matters for balance, why knees stay bent for power, and how guard protects the head',
              k.apply_level = 'Maintain proper stance while moving around the bag or with a partner',
              k.analyze_level = 'Identify stance errors in yourself and others, and understand how poor stance limits techniques',
              k.evaluate_level = 'Evaluate different stance widths and adapt stance based on opponent positioning',
              k.create_level = 'Modify stance for specific fighting styles and teach proper stance to beginners';

MERGE (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
ON CREATE SET k.description = 'The fundamental mechanics of throwing effective punches including jab, cross, hook, and uppercut using hip rotation, weight transfer, and proper hand positioning',
              k.how_to_learn = 'Shadow box 100-200 punches daily. Work heavy bag with focus on form. Train under qualified instructor for technique correction. Watch slow-motion demonstrations. Expected time: 3-4 weeks for basic competency.',
              k.remember_level = 'Recall the four main punches: jab, cross, hook, and uppercut and their basic execution',
              k.understand_level = 'Explain the role of hip rotation in generating power and why footwork matters for punch effectiveness',
              k.apply_level = 'Throw clean punches with proper form against a heavy bag or pad holder',
              k.analyze_level = 'Identify power loss due to technique errors and understand how body alignment affects punch trajectory',
              k.evaluate_level = 'Judge punch effectiveness and adjust technique based on feedback',
              k.create_level = 'Develop personalized punch combinations and teach punch mechanics to others';

MERGE (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
ON CREATE SET k.description = 'The fundamental mechanics of throwing effective kicks including front kick, roundhouse kick, side kick, and low kick with proper pivoting, hip rotation, and leg extension',
              k.how_to_learn = 'Practice kicking drills 10-15 minutes daily. Use heavy bag, pads, and air. Stretch hamstrings and hip flexors before and after training. Train under qualified instructor. Expected time: 4-6 weeks for basic proficiency.',
              k.remember_level = 'Recall the four main kick types and their basic execution patterns',
              k.understand_level = 'Explain the role of hip rotation, foot pivoting, and leg positioning in kick power and control',
              k.apply_level = 'Execute clean kicks against a heavy bag with proper form and balance',
              k.analyze_level = 'Identify errors in kick execution including pivot mistakes, chamber errors, or hip misalignment',
              k.evaluate_level = 'Judge kick effectiveness and adjust trajectory based on target and distance',
              k.create_level = 'Develop kick combinations and teach kick mechanics progressively to beginners';

MERGE (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
ON CREATE SET k.description = 'The mechanics of striking with knees and elbows including clinch positioning, hip engagement, distance control, and timing for knee strikes and various elbow techniques',
              k.how_to_learn = 'Practice knee and elbow strikes on heavy bag and pads with a partner. Start with controlled movements against air. Work in clinch with padded partner. Expected time: 3-4 weeks for basic striking.',
              k.remember_level = 'Recall the main knee strikes (straight, diagonal) and elbow techniques (horizontal, upward, downward)',
              k.understand_level = 'Explain why clinch control is essential for knees and elbows, and how distance affects these strikes',
              k.apply_level = 'Throw knees and elbows with control against pads or bag',
              k.analyze_level = 'Identify distance and timing issues that reduce strike effectiveness',
              k.evaluate_level = 'Judge appropriate situations for knee versus elbow strikes based on distance and positioning',
              k.create_level = 'Develop clinch combinations with knees and elbows and teach these techniques safely';

MERGE (k:Knowledge {name: 'Muay Thai Basic Footwork'})
ON CREATE SET k.description = 'Foundational footwork patterns including step patterns, pivoting, lateral movement, and directional adjustments that enable smooth transitions between techniques',
              k.how_to_learn = 'Shadow box with focus on footwork for 15-20 minutes daily. Do footwork drills in designated patterns. Practice with a partner moving around. Expected time: 2-3 weeks for basic patterns.',
              k.remember_level = 'Recall basic step patterns: forward, backward, lateral, and pivoting movements',
              k.understand_level = 'Explain how proper footwork maintains balance and enables quick transitions between strikes',
              k.apply_level = 'Move smoothly around a heavy bag or with a partner maintaining proper stance',
              k.analyze_level = 'Identify footwork errors that cause loss of balance or slow transitions',
              k.evaluate_level = 'Adjust footwork based on ring positioning and opponent movement',
              k.create_level = 'Develop personalized footwork patterns and teach footwork drills to beginners';

MERGE (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
ON CREATE SET k.description = 'Foundational defensive tactics including guard, blocking, slipping, ducking, and absorbing strikes that protect from incoming attacks while maintaining offensive capability',
              k.how_to_learn = 'Practice drills with padded partner throwing basic strikes at controlled pace. Work bag with focus on defensive positioning. Shadow box defensive movements. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall basic defensive techniques: high guard, low guard, blocking with forearms, slipping, and ducking',
              k.understand_level = 'Explain when each defensive technique is appropriate and how to transition from defense to offense',
              k.apply_level = 'Use defensive techniques against a padded partner throwing basic strikes',
              k.analyze_level = 'Identify gaps in your defense and understand why certain defensive positions are vulnerable',
              k.evaluate_level = 'Adjust defensive approach based on opponent\'s striking patterns and distance',
              k.create_level = 'Develop a personal defensive system and teach defensive principles to beginners';

// Core Knowledge - Developing/Competent Levels

MERGE (k:Knowledge {name: 'Muay Thai Combination Theory'})
ON CREATE SET k.description = 'The principles of combining strikes into flowing sequences including rhythm, timing, weight distribution, and transition mechanics that enable rapid multi-strike attacks',
              k.how_to_learn = 'Study 5-10 fundamental combinations. Practice each combination 50-100 times daily on bags and pads. Watch fight footage focusing on combination usage. Work combinations with a partner. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall 5-10 basic combinations of 2-4 strikes each',
              k.understand_level = 'Explain how combinations are built from single strikes and why certain strike orders flow naturally',
              k.apply_level = 'Execute learned combinations fluidly against pads and bags without hesitation',
              k.analyze_level = 'Break down combinations from fighters and understand why certain transitions are effective',
              k.evaluate_level = 'Judge when different combinations are appropriate for specific fight situations',
              k.create_level = 'Design custom combinations based on personal strengths and teach combination development to others';

MERGE (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
ON CREATE SET k.description = 'The basic mechanics of clinch work including grip techniques, posture control, knee delivery angles, and defensive clinch positioning that enables control in close range',
              k.how_to_learn = 'Practice clinch drills with a cooperative partner for 10-15 minutes daily. Start with grip and posture without resistance. Gradually add light resistance. Train with qualified clinch coach. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall the basic clinch grip: hands behind neck or upper back, elbows in, posture upright',
              k.understand_level = 'Explain how grip and posture control the opponent, and why elbow positioning matters for knee delivery',
              k.apply_level = 'Establish clinch control with a cooperating partner and land controlled knees',
              k.analyze_level = 'Identify leverage points that improve clinch control and see defensive options available to opponent',
              k.evaluate_level = 'Adjust clinch position based on opponent\'s weight distribution and defensive attempts',
              k.create_level = 'Develop personal clinch style and teach safe clinch work to training partners';

MERGE (k:Knowledge {name: 'Muay Thai Pad Work Principles'})
ON CREATE SET k.description = 'The principles and techniques of working pads including proper pad positioning, communication, timing, and read-and-react drills that build conditioned striking and footwork',
              k.how_to_learn = 'Do pad work with a qualified pad holder 3-4 times per week for 10-15 minute rounds. Start with basic drills, progress to combinations and rhythm work. Learn to read pad holder cues. Expected time: Ongoing skill development.',
              k.remember_level = 'Recall basic pad holder hand signals and common pad work drill patterns',
              k.understand_level = 'Explain how pad work develops striking accuracy, timing, and footwork better than bag work',
              k.apply_level = 'Execute combinations on pads with proper timing and footwork following pad holder directions',
              k.analyze_level = 'Recognize timing windows for combinations and adapt to pad holder\'s rhythm changes',
              k.evaluate_level = 'Judge your own pad work performance and adjust intensity and focus areas',
              k.create_level = 'Design personalized pad work drills and teach pad work techniques to newer fighters';

MERGE (k:Knowledge {name: 'Muay Thai Distance Management'})
ON CREATE SET k.description = 'The concepts of fighting distance including long range, medium range, and close range (clinch) with appropriate techniques for each distance and transitioning between distances',
              k.how_to_learn = 'Spar or pad work focusing on distance awareness. Film your own training and analyze distance management. Study fight footage noting distance transitions. Expected time: 4-8 weeks with regular training.',
              k.remember_level = 'Recall the three fighting distances: long (kicks only), medium (kicks and punches), close (clinch)',
              k.understand_level = 'Explain which techniques are effective at each distance and why closing/opening distance is tactically important',
              k.apply_level = 'Manage distance effectively during pad work, adapting techniques to current distance',
              k.analyze_level = 'Watch fights and identify distance-based tactical patterns and mistakes',
              k.evaluate_level = 'Judge optimal distance for specific opponents and situations',
              k.create_level = 'Develop personal distance management strategy and teach distance concepts to training partners';

MERGE (k:Knowledge {name: 'Muay Thai Breathing and Conditioning'})
ON CREATE SET k.description = 'The principles of efficient breathing during training and fighting, including breathing patterns for different strikes, recovery breathing, and cardiovascular conditioning for Muay Thai demands',
              k.how_to_learn = 'Practice breathing patterns during shadow boxing and pad work. Do high-intensity conditioning work 2-3 times weekly. Study how professional fighters breathe during rounds. Train in high-temperature environment to build heat tolerance. Expected time: Ongoing with training.',
              k.remember_level = 'Recall basic breathing patterns: exhale on strikes, maintain breathing during combinations',
              k.understand_level = 'Explain how breath timing affects striking power and why oxygen management matters in later rounds',
              k.apply_level = 'Maintain efficient breathing patterns during pad work and sparring',
              k.analyze_level = 'Identify signs of poor conditioning and understand how different training improves conditioning',
              k.evaluate_level = 'Judge personal conditioning level and adjust training intensity appropriately',
              k.create_level = 'Design conditioning programs and teach breathing patterns to training partners';

MERGE (k:Knowledge {name: 'Muay Thai Transition and Chain Theory'})
ON CREATE SET k.description = 'The concepts of flowing from one technique to another, chaining techniques into longer sequences, and reading opponent reactions to set up subsequent strikes',
              k.how_to_learn = 'Study chain combinations in instructional videos and fight footage. Practice flowing between techniques on bags and pads. Spar with partners of varying skill. Expected time: 6-8 weeks of focused practice.',
              k.remember_level = 'Recall common transitions: punch to kick, kick to clinch, combination to clinch entry',
              k.understand_level = 'Explain how momentum and positioning enable smooth transitions and why failed transitions are dangerous',
              k.apply_level = 'Execute smooth transitions during pad work and light sparring',
              k.analyze_level = 'Watch fights and identify when fighters use transitions effectively and when transitions fail',
              k.evaluate_level = 'Judge appropriate transitions based on opponent positioning and reactions',
              k.create_level = 'Develop personal transition system and teach flow concepts to training partners';

// Advanced Knowledge - Advanced Level

MERGE (k:Knowledge {name: 'Muay Thai Advanced Clinch Control'})
ON CREATE SET k.description = 'Advanced clinch techniques including collar tie variations, underhook variations, collar tie to knee combinations, and advanced defensive positioning in the clinch against skilled opponents',
              k.how_to_learn = 'Work advanced clinch drills with qualified instructors 2-3 times weekly. Watch professional clinch exchanges in slow motion. Spar advanced partners focusing on clinch work. Expected time: 8-12 weeks of focused clinch study.',
              k.remember_level = 'Recall collar tie variations, underhook positioning, and advanced clinch entries',
              k.understand_level = 'Explain the mechanical advantages of different clinch positions and how to exploit them',
              k.apply_level = 'Execute advanced clinch techniques in controlled sparring with skilled partners',
              k.analyze_level = 'Identify advanced clinch strategies used by professional fighters in specific fight contexts',
              k.evaluate_level = 'Judge optimal clinch variations for specific opponents and adapt in real time',
              k.create_level = 'Develop signature clinch sequences and teach advanced clinch work to developing fighters';

MERGE (k:Knowledge {name: 'Muay Thai Ring Intelligence'})
ON CREATE SET k.description = 'The mental and tactical aspects of fighting including reading opponent patterns, adapting strategy mid-fight, managing emotions under pressure, pacing rounds, and game planning',
              k.how_to_learn = 'Spar regularly with varied opponents. Study fight footage analyzing fighter decision-making and adaptation. Work with a coach on ring strategy. Get feedback on tactical performance. Expected time: Ongoing throughout fighting career.',
              k.remember_level = 'Recall basic tactical concepts: fight the plan, recognize opponent patterns, manage energy',
              k.understand_level = 'Explain how to adjust strategy when opponent is different than expected',
              k.apply_level = 'Execute a game plan during sparring and make basic tactical adjustments',
              k.analyze_level = 'Watch professional fights and explain the tactical decisions fighters make and why',
              k.evaluate_level = 'Judge mid-fight adjustments and evaluate tactical effectiveness',
              k.create_level = 'Develop personalized game plans and teach ring intelligence concepts to newer fighters';

MERGE (k:Knowledge {name: 'Muay Thai Strike Detection and Prediction'})
ON CREATE SET k.description = 'The ability to recognize incoming strikes before they land by reading subtle body movements, weight shifts, and breathing patterns, enabling faster defensive reactions',
              k.how_to_learn = 'Work drills with padded partner signaling strikes in advance, then hiding signals. Spar with varied opponents noting their tell signals. Film yourself sparring and identify patterns you missed. Expected time: 8-12 weeks with attentive practice.',
              k.remember_level = 'Recall common strike tells: shoulder movement for punches, hip rotation for kicks',
              k.understand_level = 'Explain how reading opponent movement improves defensive reaction time',
              k.apply_level = 'Recognize and react to incoming strikes during sparring',
              k.analyze_level = 'Watch fighters and identify their signature tells for different strikes',
              k.evaluate_level = 'Judge prediction accuracy and adjust defensive positioning preemptively',
              k.create_level = 'Develop personalized prediction systems and teach strike recognition to training partners';

MERGE (k:Knowledge {name: 'Muay Thai Tactical Range Work'})
ON CREATE SET k.description = 'Advanced management of fighting distance including range extension, entry techniques, controlling transitions, and using the ring environment strategically',
              k.how_to_learn = 'Spar focusing on range and entry work 2-3 times weekly. Study professional fighters\' range management in fight footage. Work range drills with a coach. Expected time: 6-10 weeks of focused study.',
              k.remember_level = 'Recall different striking ranges and appropriate techniques for each',
              k.understand_level = 'Explain how to control transitions between ranges and why controlling range dictates fight outcome',
              k.apply_level = 'Effectively manage range during sparring to dictate fight positioning',
              k.analyze_level = 'Watch professional fights and identify range control strategies',
              k.evaluate_level = 'Judge when to extend range, close distance, or retreat based on tactical situation',
              k.create_level = 'Develop personal range mastery system and teach range concepts to training partners';

// Specialized Knowledge - Master Level

MERGE (k:Knowledge {name: 'Muay Thai Combat Philosophy and History'})
ON CREATE SET k.description = 'The historical evolution of Muay Thai, its philosophical underpinnings, cultural significance, and how historical context informs modern fighting approaches',
              k.how_to_learn = 'Read historical texts on Muay Thai origins and evolution. Study legendary fighters and their fighting styles. Engage with Thai martial arts teachers and historians. Travel to Thailand if possible. Expected time: Ongoing study throughout career.',
              k.remember_level = 'Recall basic Muay Thai history, the origin of techniques, and legendary fighters',
              k.understand_level = 'Explain the cultural significance of Muay Thai and how philosophy informs technique',
              k.apply_level = 'Apply philosophical concepts to your personal fighting approach and training philosophy',
              k.analyze_level = 'Analyze how historical techniques evolved into modern applications',
              k.evaluate_level = 'Judge quality of modern training against traditional principles and philosophies',
              k.create_level = 'Develop or teach interpretations of Muay Thai philosophy and create contributions to fighting art\'s evolution';

MERGE (k:Knowledge {name: 'Muay Thai Opponent Analysis and Game Planning'})
ON CREATE SET k.description = 'The systematic analysis of opponent strengths, weaknesses, tendencies, and habits to develop comprehensive fighting strategies and real-time tactical adjustments',
              k.how_to_learn = 'Watch extensive fight footage of potential opponents identifying patterns. Spar with fighters similar to opponents. Get feedback from coaches on tactical planning. Fight and analyze results. Expected time: Ongoing throughout competitive career.',
              k.remember_level = 'Recall how to identify an opponent\'s main striking weapons and defensive weaknesses',
              k.understand_level = 'Explain how to build a game plan that exploits specific opponent weaknesses',
              k.apply_level = 'Execute a prepared game plan and adjust mid-fight based on observed behavior',
              k.analyze_level = 'Deeply analyze opponent fighting patterns, biomechanics, and psychological tendencies',
              k.evaluate_level = 'Judge game plan effectiveness and adapt strategy against unexpected opponent approaches',
              k.create_level = 'Develop personalized game planning systems and teach opponent analysis to aspiring fighters';

MERGE (k:Knowledge {name: 'Muay Thai Advanced Defensive Systems'})
ON CREATE SET k.description = 'Sophisticated defensive approaches including parrying, catching kicks, countering off defense, maintaining space management while defending, and defensive strategies against different opponent types',
              k.how_to_learn = 'Work defensive drills with aggressive partners 2-3 times weekly. Study master fighters\' defensive systems. Spar opponents forcing you to defend actively. Expected time: 10-12 weeks with advanced partners.',
              k.remember_level = 'Recall advanced defensive techniques: parries, catching, countering, retreating footwork',
              k.understand_level = 'Explain why different defensive approaches are optimal for different opponent styles',
              k.apply_level = 'Execute sophisticated defensive techniques against skilled partners in sparring',
              k.analyze_level = 'Watch master fighters and understand their defensive systems and strategic approaches',
              k.evaluate_level = 'Judge optimal defensive approach for specific opponents and situations',
              k.create_level = 'Develop signature defensive style and teach defensive mastery to training partners';

MERGE (k:Knowledge {name: 'Muay Thai Injury Prevention and Recovery'})
ON CREATE SET k.description = 'Advanced understanding of injury prevention, recovery protocols, managing chronic issues, and longevity strategies for sustainable high-level training and competition',
              k.how_to_learn = 'Work with sports therapists and strength coaches on injury prevention. Study injury patterns in Muay Thai. Maintain detailed training and health logs. Research recovery protocols. Expected time: Ongoing throughout training career.',
              k.remember_level = 'Recall common Muay Thai injuries and basic prevention strategies',
              k.understand_level = 'Explain injury mechanisms and why specific prevention strategies reduce injury risk',
              k.apply_level = 'Implement prevention protocols consistently in daily training',
              k.analyze_level = 'Identify personal injury risk factors and understand how to mitigate them',
              k.evaluate_level = 'Judge when to modify training and when to push through discomfort',
              k.create_level = 'Develop personal injury prevention and recovery system and teach longevity strategies to others';

MERGE (k:Knowledge {name: 'Muay Thai Teaching and Coach Development'})
ON CREATE SET k.description = 'The principles of teaching Muay Thai effectively, breaking down complex techniques for different learning styles, managing training groups, and developing other fighters',
              k.how_to_learn = 'Assist experienced coaches. Teach beginners under supervision. Take coaching courses if available. Study educational psychology. Request feedback on teaching effectiveness. Expected time: Ongoing throughout coaching career.',
              k.remember_level = 'Recall fundamental coaching principles and common teaching methods',
              k.understand_level = 'Explain how to adapt teaching for different skill levels and learning styles',
              k.apply_level = 'Teach basic and intermediate techniques effectively to training partners',
              k.analyze_level = 'Watch experienced coaches and understand their teaching approaches',
              k.evaluate_level = 'Judge coaching effectiveness and adapt teaching methods based on student progress',
              k.create_level = 'Develop signature coaching approach and train other coaches in your methods';

MERGE (k:Knowledge {name: 'Muay Thai Wai Kru and Cultural Practice'})
ON CREATE SET k.description = 'The authentic understanding and practice of Wai Kru ritual, music, cultural traditions, and the spiritual aspects of Muay Thai that distinguish it from other striking arts',
              k.how_to_learn = 'Learn Wai Kru from Thai instructors with deep cultural knowledge. Study Muay Thai music and its role. Engage with Thai culture and Buddhism. Practice ritual with intention. Expected time: Ongoing cultural development.',
              k.remember_level = 'Recall the basic Wai Kru ritual, components, and their symbolic meanings',
              k.understand_level = 'Explain the spiritual and cultural significance of Wai Kru and Muay Thai traditions',
              k.apply_level = 'Perform Wai Kru with proper form and cultural respect before training and fighting',
              k.analyze_level = 'Understand the deeper symbolic meanings of different Wai Kru movements',
              k.evaluate_level = 'Judge authenticity of cultural practice and adjust personal approach respectfully',
              k.create_level = 'Teach Wai Kru and cultural traditions to new students with proper context and respect';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Skills - Novice Level Progression

MERGE (s:Skill {name: 'Muay Thai Stance'})
ON CREATE SET s.description = 'The foundational fighting position and body alignment that enables all techniques, including foot placement, knee positioning, hip orientation, hand placement, and spinal alignment required for balanced, powerful striking',
              s.how_to_develop = 'Practice stance drills 15-20 minutes daily with instructor feedback. Hold stance while shadow boxing basic combinations. Film yourself and compare to instructional videos. Stand in stance between every technique. Expected time: 2-3 weeks of daily practice to develop muscle memory.',
              s.novice_level = 'Can adopt basic stance position with feet shoulder-width apart and hands up. Stance collapses during movement or strikes. Requires constant instructor reminders. To progress: Practice stance while stationary, then while moving slowly.',
              s.advanced_beginner_level = 'Maintains reasonable stance during light pad work and shadow boxing. Beginning to understand why stance matters. Occasionally lapses under fatigue. To progress: Increase duration of stance maintenance and practice with increasing movement complexity.',
              s.competent_level = 'Maintains proper stance during pad work, heavy bag, and light sparring. Stance is natural and automatic in most situations. Understands personal stance variations. To progress: Develop stance variations for different fighting styles and opponent types.',
              s.proficient_level = 'Stance is reflexive and unconscious during all training. Seamlessly adjusts stance based on tactical situation. Efficient and powerful from any position. To progress: Refine micro-adjustments and develop signature stance.',
              s.expert_level = 'Stance is perfect and intuitive, requiring no conscious thought. Uses stance variations masterfully to create angles and opportunities. Teaches proper stance to others with clarity and understanding.';

MERGE (s:Skill {name: 'Muay Thai Punch Technique'})
ON CREATE SET s.description = 'The ability to execute fundamental punching strikes including jab, cross, hook, and uppercut with proper form, hip rotation, weight transfer, and power generation from the ground up',
              s.how_to_develop = 'Shadow box 100-200 punches daily focusing on form. Work heavy bag with concentration on technique over power. Train with qualified instructor for form correction. Watch slow-motion punching demonstrations. Expected time: 3-4 weeks for basic competency.',
              s.novice_level = 'Can throw punches that reach target but form is inconsistent. Limited hip rotation and weight transfer. Punches come primarily from arms. To progress: Focus on hip engagement and weight transfer in shadow boxing.',
              s.advanced_beginner_level = 'Executes punches with partial hip rotation and reasonable form. Punches have better reach and power. Beginning to recognize difference between good and poor form. To progress: Increase punch speed and work pad combinations.',
              s.competent_level = 'Throws clean punches with consistent hip rotation and weight transfer. Good power generation from legs. Form is correct on bag and pads. To progress: Develop punching power and speed simultaneously.',
              s.proficient_level = 'Punches are powerful and efficient, generated from proper weight distribution. Automatic form without conscious thought. Smooth transitions into combinations. To progress: Develop signature punching style and master all punch variations.',
              s.expert_level = 'Punching is fluid, powerful, and intuitive. Generates maximum force from any position. Seamlessly chains punches into longer combinations. Can teach and correct punching form in others.';

MERGE (s:Skill {name: 'Muay Thai Kick Technique'})
ON CREATE SET s.description = 'The ability to execute fundamental kicking strikes including front kick, roundhouse kick, side kick, and low kick with proper pivoting, chamber, hip rotation, balance, and distance control',
              s.how_to_develop = 'Practice kick drills 15-20 minutes daily on heavy bag and pads. Perform flexibility drills before and after training, especially hip flexors and hamstrings. Train under qualified instructor for technical correction. Expected time: 4-6 weeks for basic proficiency.',
              s.novice_level = 'Executes kicks with recognizable form but balance is shaky and power is minimal. Chamber is incomplete and hip rotation is limited. Frequently loses balance on kicks. To progress: Focus on balance and hip engagement in stationary kick drills.',
              s.advanced_beginner_level = 'Kicks have improved balance and moderate power. Hip rotation is beginning to develop. Chamber is more complete. Can execute kicks during light pad work. To progress: Increase kick height and speed while maintaining balance.',
              s.competent_level = 'Throws consistent, clean kicks with good power and control. Balance is solid throughout kicking motions. Hip rotation is automatic. Can execute kicks from both stances. To progress: Develop kick variety and speed at distance.',
              s.proficient_level = 'Kicks are powerful and accurate without visible effort. Seamless chamber and explosive extension. No balance loss or stalling. Intuitively adjusts kick height and power. To progress: Develop signature kicking style and master rare kick variations.',
              s.expert_level = 'Kicking is fluid, powerful, and automatic. Generates devastating power from any angle. Can deliver kicks from compromised positions. Can teach and correct kicking technique comprehensively.';

MERGE (s:Skill {name: 'Muay Thai Knee Strike'})
ON CREATE SET s.description = 'The ability to execute effective knee strikes in both clinch and semi-clinch positions with proper hip drive, distance control, and body engagement',
              s.how_to_develop = 'Practice knee strikes on heavy bag and pads with partner 10-15 minutes daily. Work in clinch with padded partner starting with light resistance. Shadow box knee technique. Expected time: 3-4 weeks for basic execution.',
              s.novice_level = 'Executes knee strikes with moderate accuracy but limited power. Hip engagement is inconsistent. Requires clinch partner to maintain good positioning. To progress: Focus on hip drive and distance management in clinch drills.',
              s.advanced_beginner_level = 'Knee strikes are more powerful and consistent. Can establish clinch and deliver controlled knees. Recognizes proper knee delivery angles. To progress: Work knee strikes with increasing resistance and pace.',
              s.competent_level = 'Executes knee strikes with good power and control in various clinch positions. Hip drive is automatic. Can hit multiple targets (body, head, legs). To progress: Develop knee combinations and counter-knee techniques.',
              s.proficient_level = 'Knee strikes are devastating and intuitive. Generates maximum force from clinch. Seamlessly chains knees into combinations. To progress: Refine subtle distance adjustments and develop knee specialization.',
              s.expert_level = 'Knee striking is fluid and automatic. Delivers devastating power from any clinch position. Can finish opponents with knee strikes. Masters all knee variations and teaches them effectively.';

MERGE (s:Skill {name: 'Muay Thai Elbow Strike'})
ON CREATE SET s.description = 'The ability to execute elbow strikes in both clinch and at medium range with proper rotation, angle variation, timing, and control',
              s.how_to_develop = 'Practice elbow strikes on heavy bag and pads with qualified partner 10-15 minutes daily. Work controlled elbows in clinch with padded partner. Study elbow angle variations. Expected time: 3-4 weeks for basic execution.',
              s.novice_level = 'Executes elbows with recognizable form but limited accuracy and power. Struggles with different elbow angles. Requires significant space and clinch control. To progress: Practice elbow angles and rotational mechanics.',
              s.advanced_beginner_level = 'Elbows are more accurate and have moderate power. Can execute horizontal and upward elbows. Beginning to understand when each angle is appropriate. To progress: Increase elbow speed and accuracy.',
              s.competent_level = 'Executes elbows cleanly with good power and control. Can deliver effective elbows at appropriate distances. Performs elbows from multiple positions. To progress: Develop elbow combinations and rare elbow variations.',
              s.proficient_level = 'Elbows are powerful and intuitive. Seamlessly transitions to elbows from clinch or medium range. Multiple angle mastery. To progress: Develop signature elbow techniques and specialized situations.',
              s.expert_level = 'Elbow striking is fluid and automatic. Generates devastating power with perfect timing. Masters all elbow variations and angles. Can cut and damage opponents effectively with elbows.';

MERGE (s:Skill {name: 'Muay Thai Footwork'})
ON CREATE SET s.description = 'The ability to move efficiently and smoothly around opponents while maintaining balance, executing techniques, and controlling distance using proper step patterns, pivots, and directional awareness',
              s.how_to_develop = 'Shadow box with exclusive focus on footwork 15-20 minutes daily. Execute footwork drills in designated patterns. Practice circle movements around heavy bag. Move around a partner without engaging. Expected time: 2-3 weeks for basic patterns.',
              s.novice_level = 'Demonstrates basic forward, backward, and lateral movement. Movement is cautious and deliberate. Frequently loses balance during footwork transitions. To progress: Practice smooth transitions between directions.',
              s.advanced_beginner_level = 'Movement is smoother and more confident. Can maintain stance while moving. Beginning to coordinate footwork with strikes. To progress: Increase movement speed and add simultaneous striking.',
              s.competent_level = 'Moves fluidly with proper balance in all directions. Coordinates footwork with combinations seamlessly. Can adjust positioning during pad work. To progress: Develop specialized footwork for different situations.',
              s.proficient_level = 'Footwork is automatic and unconscious. Moves with efficiency and minimal wasted motion. Footwork facilitates powerful striking from all angles. To progress: Master subtle angling and positioning.',
              s.expert_level = 'Footwork is perfectly coordinated and intuitive. Uses angles and positioning masterfully. Moves with minimal effort and maximum efficiency. Teaches footwork effectively to training partners.';

MERGE (s:Skill {name: 'Muay Thai Blocking and Parrying'})
ON CREATE SET s.description = 'The ability to defend against incoming strikes using arms, forearms, shins, and blocks to absorb, deflect, or parry strikes while maintaining offensive capability',
              s.how_to_develop = 'Work drills with padded partner throwing basic strikes at controlled pace 10-15 minutes daily. Practice blocking on heavy bag. Shadow box defensive movements. Gradually increase striking intensity. Expected time: 3-4 weeks.',
              s.novice_level = 'Can perform basic blocks against slow strikes. Block placement is sometimes ineffective. Loses balance or cannot counter after blocking. To progress: Practice block mechanics and counter-striking.',
              s.advanced_beginner_level = 'Blocks are more effective against moderate-speed strikes. Can perform multiple blocks in sequence. Beginning to transition to offense after blocks. To progress: Increase striking intensity and develop blocking fluidity.',
              s.competent_level = 'Blocks are consistent and effective against various strike types. Transitions to counter-strikes smoothly. Minimizes damage taken. Can block while moving. To progress: Develop advanced block variations and specialized techniques.',
              s.proficient_level = 'Blocks are automatic and efficient with minimal impact absorption. Immediately flows to counters. Can block multiple strikes seamlessly. To progress: Master rare blocking situations and special techniques.',
              s.expert_level = 'Blocking is intuitive and perfect. Blocks strikes with minimal damage or energy expenditure. Uses blocks to set up devastating counters. Masters all blocking variations and teaches them effectively.';

// Intermediate Skills - Developing/Competent Levels

MERGE (s:Skill {name: 'Muay Thai Combination Execution'})
ON CREATE SET s.description = 'The ability to execute flowing sequences of multiple strikes in rapid succession maintaining rhythm, balance, and power throughout the combination',
              s.how_to_develop = 'Study 10-15 fundamental combinations daily. Practice each combination 50-100 repetitions on bag and pads. Watch fight footage analyzing combinations. Work combinations with partner. Expected time: 4-6 weeks.',
              s.novice_level = 'Can execute basic 2-3 strike combinations with hesitation between strikes. Loses rhythm or balance during combinations. Limited punch and kick combinations. To progress: Practice basic combinations until smooth.',
              s.advanced_beginner_level = 'Executes combinations with fewer pauses. Rhythm is developing. Can perform 4-5 strike combinations. Beginning to understand strike flow. To progress: Increase combination speed and expand combination library.',
              s.competent_level = 'Executes combinations fluidly with good rhythm and power. Smooth transitions between strikes. Can perform 6+ strike combinations. Selects appropriate combinations for situations. To progress: Develop personalized combination style.',
              s.proficient_level = 'Combinations are smooth, powerful, and intuitive. Seamless flow and rhythm during extended combinations. Adapts combinations fluidly based on situation. To progress: Develop signature combinations and rare sequences.',
              s.expert_level = 'Combination execution is fluid and powerful. Creates original combinations spontaneously. Adapts seamlessly mid-combination based on opponent response. Can teach combination development to others.';

MERGE (s:Skill {name: 'Muay Thai Clinch Control'})
ON CREATE SET s.description = 'The ability to establish and maintain dominant clinch position with proper grip, posture control, and defensive positioning that enables effective knee strikes and prevents opponent control',
              s.how_to_develop = 'Practice clinch drills with cooperative partner 10-15 minutes daily. Start with grip and posture without resistance. Gradually add light then moderate resistance. Work with qualified clinch coach. Expected time: 4-6 weeks.',
              s.novice_level = 'Can establish basic clinch grip with hands behind neck. Posture is inconsistent and easily disrupted. Limited ability to throw knees from clinch. To progress: Focus on grip strength and posture maintenance.',
              s.advanced_beginner_level = 'Maintains clinch position against light resistance. Can throw controlled knees from clinch. Beginning to control opponent. To progress: Work clinch against increasing resistance.',
              s.competent_level = 'Establishes solid clinch control with consistent posture. Lands clean knees from various clinch angles. Can maintain clinch against moderate resistance. To progress: Develop advanced clinch variations.',
              s.proficient_level = 'Clinch control is dominant and intuitive. Automatically maintains proper posture and control. Lands powerful knees seamlessly. Can break opponent posture and control their movement. To progress: Master rare clinch situations.',
              s.expert_level = 'Clinch control is absolute and instinctive. Controls opponents completely from clinch. Lands devastating knees and transitions. Can teach clinch mastery and advanced techniques.';

MERGE (s:Skill {name: 'Muay Thai Pad Work'})
ON CREATE SET s.description = 'The ability to work effectively with pads including following pad holder cues, adjusting to changing rhythms, maintaining proper distance, and executing combinations with timing and power',
              s.how_to_develop = 'Work pads with qualified pad holder 3-4 times per week for 10-15 minute rounds. Start with basic drills, progress to combinations and rhythm changes. Learn to read pad holder signals. Expected time: Ongoing skill development.',
              s.novice_level = 'Executes combinations on pads with hesitation. Has difficulty reading pad holder cues. Inconsistent timing and footwork. To progress: Practice basic pad work combinations.',
              s.advanced_beginner_level = 'Pads are more fluid with better rhythm. Beginning to read pad holder signals. Can follow direction changes. To progress: Increase pace and complexity of pad work.',
              s.competent_level = 'Executes pad work smoothly with good timing and power. Responds well to pad holder cues and rhythm changes. Maintains proper distance throughout. To progress: Develop specialized pad work patterns.',
              s.proficient_level = 'Pad work is fluid and powerful with automatic rhythm adjustment. Reads subtle pad holder signals and adapts instantly. Can perform extended pad work rounds with high intensity. To progress: Master rare pad work scenarios.',
              s.expert_level = 'Pad work is seamless and powerful. Works perfectly with all pad holders regardless of style. Adapts instantly to any rhythm or direction change. Can teach pad work and read pad holders effectively.';

MERGE (s:Skill {name: 'Muay Thai Distance Management'})
ON CREATE SET s.description = 'The ability to control fighting distance (long, medium, close) and transition smoothly between ranges while maintaining tactical advantage and executing appropriate techniques for each distance',
              s.how_to_develop = 'Focus on distance during pad work and sparring 2-3 times weekly. Film training and analyze distance management. Study professional fights noting distance transitions and tactics. Expected time: 4-8 weeks.',
              s.novice_level = 'Has difficulty judging fighting distance. Frequently closes distance incorrectly or retreats when should advance. Limited range awareness. To progress: Practice distance drills with partner.',
              s.advanced_beginner_level = 'Better distance judgment with fewer mistakes. Recognizes appropriate techniques for current distance. Beginning to manage distance tactically. To progress: Increase distance management complexity.',
              s.competent_level = 'Manages distance effectively during pad work and light sparring. Transitions between ranges smoothly. Executes appropriate techniques for current distance. To progress: Develop distance management for specific opponents.',
              s.proficient_level = 'Distance management is intuitive and automatic. Controls range to own advantage. Seamless transitions between distances. Creates and controls distance in fighting. To progress: Master rare distance situations.',
              s.expert_level = 'Distance management is perfect and instinctive. Dictates range to maximum advantage. Can fight at any distance masterfully. Teaches distance concepts clearly to others.';

MERGE (s:Skill {name: 'Muay Thai Defensive Movement'})
ON CREATE SET s.description = 'The ability to evade and avoid incoming strikes using head movement, body movement, footwork, and repositioning while maintaining balance and counter-striking capability',
              s.how_to_develop = 'Work defensive drills with partner throwing strikes 2-3 times weekly. Practice head movement in shadow boxing. Increase striking intensity gradually. Film yourself sparring to identify defensive patterns. Expected time: 6-8 weeks.',
              s.novice_level = 'Attempts basic head movement but is inconsistent and often ineffective. Frequently gets hit when trying to evade. Limited footwork for evasion. To progress: Practice basic head movement and footwork.',
              s.advanced_beginner_level = 'Head movement is more effective against moderate strikes. Can evade without losing balance. Beginning to counter-strike after evasion. To progress: Increase striking intensity and defensive variations.',
              s.competent_level = 'Evades strikes effectively with good head and body movement. Maintains balance while evading. Transitions to counters smoothly. Can evade combinations. To progress: Develop specialized defensive movement patterns.',
              s.proficient_level = 'Evasion is automatic and efficient with minimal wasted movement. Seamlessly flows into counters. Can evade complex combinations. Intuitively adjusts movement based on opponent style. To progress: Master rare evasion situations.',
              s.expert_level = 'Defensive movement is perfect and intuitive. Avoids strikes with minimum effort. Effortlessly transitions to devastating counters. Masters all evasion techniques and teaches them effectively.';

MERGE (s:Skill {name: 'Muay Thai Light Sparring'})
ON CREATE SET s.description = 'The ability to spar at controlled intensity with training partners focusing on technique, timing, and flow while managing contact and avoiding injury',
              s.how_to_develop = 'Spar light with partners regularly 2-3 times weekly for 3-5 minute rounds. Focus on specific techniques rather than winning. Get feedback from coach and partners. Progress to slightly higher intensity gradually. Expected time: 4-6 weeks.',
              s.novice_level = 'Sparring is hesitant and incomplete. Frequently forgets techniques in live situation. Lacks timing and distance judgment. To progress: Practice with experienced partners and focus on basics.',
              s.advanced_beginner_level = 'Sparring is more relaxed with better technique application. Timing is improving. Can execute learned combinations in sparring. To progress: Increase sparring partners and intensity.',
              s.competent_level = 'Light sparring is smooth with good technique application. Times strikes appropriately. Controls intensity and can adjust to partner level. To progress: Develop sparring against varied opponent types.',
              s.proficient_level = 'Sparring is flowing and natural. Seamlessly applies techniques in live situations. Perfect timing and distance judgment. Can spar multiple rounds without fatigue. To progress: Prepare for competitive sparring.',
              s.expert_level = 'Sparring is fluid and efficient. Can spar any opponent at any intensity. Makes perfect technical and tactical decisions. Can guide partners through sparring and teach through demonstration.';

// Advanced Skills - Advanced/Master Level Progression

MERGE (s:Skill {name: 'Muay Thai Ring Intelligence'})
ON CREATE SET s.description = 'The mental and tactical ability to read opponents, recognize patterns, adapt strategy mid-fight, manage pace, make sound decisions under pressure, and control fight outcome through superior fight IQ',
              s.how_to_develop = 'Spar regularly with varied opponents 2-3 times weekly. Study professional fight footage analyzing tactical decisions. Work with coach on ring strategy. Get feedback on tactical performance. Expected time: Ongoing throughout fighting career.',
              s.novice_level = 'Limited pattern recognition. Executes game plan rigidly without adaptation. Makes inconsistent tactical decisions. To progress: Focus on recognizing opponent patterns.',
              s.advanced_beginner_level = 'Recognizes some opponent patterns and makes basic adjustments. Follows game plan with occasional adaptation. Beginning to understand tactical concepts. To progress: Increase pattern awareness and strategic flexibility.',
              s.competent_level = 'Recognizes opponent patterns and makes deliberate tactical adjustments. Adapts game plan when needed. Makes sound tactical decisions. Can execute strategy against various opponent types. To progress: Develop advanced tactical concepts.',
              s.proficient_level = 'Tactical decisions are intuitive and accurate. Reads opponent patterns instantly and adapts seamlessly. Controls pace and tempo of fights. To progress: Master specialized tactical approaches.',
              s.expert_level = 'Ring intelligence is exceptional and intuitive. Makes perfect tactical decisions instantly. Controls every aspect of fight through superior intelligence. Can teach tactical concepts and train tactical fighters.';

MERGE (s:Skill {name: 'Muay Thai Clinch Mastery'})
ON CREATE SET s.description = 'The advanced ability to dominate clinch exchanges using varied grip techniques, underhooks, collar ties, and sophisticated combinations while defending against skilled clinch opponents',
              s.how_to_develop = 'Work advanced clinch drills with qualified instructors 2-3 times weekly. Watch professional clinch exchanges in slow motion. Spar advanced partners focusing on clinch. Expected time: 8-12 weeks focused study.',
              s.novice_level = 'Struggles against skilled clinch opponents. Has limited grip variations. Cannot consistently establish dominance in clinch. To progress: Study advanced clinch techniques.',
              s.advanced_beginner_level = 'Has more clinch variations available. Can establish control against developing opponents. Recognizes advanced clinch positions. To progress: Work advanced clinch with skilled partners.',
              s.competent_level = 'Uses varied clinch techniques effectively. Controls most opponents in clinch. Executes advanced clinch combinations. Can handle skilled clinch opponents reasonably. To progress: Develop signature clinch system.',
              s.proficient_level = 'Clinch is dominant against most opponents. Seamlessly transitions between grip variations. Controls fight from clinch. To progress: Develop specialized clinch approaches.',
              s.expert_level = 'Clinch mastery is complete and dominant. Crushes skilled opponents in clinch. Masters all grip variations and combinations. Can teach advanced clinch work effectively.';

MERGE (s:Skill {name: 'Muay Thai Advanced Defensive Systems'})
ON CREATE SET s.description = 'The sophisticated ability to defend against skilled opponents using parrying, catching kicks, countering off defense, maintaining positioning, and employing varied defensive strategies for different opponent types',
              s.how_to_develop = 'Work defensive drills with aggressive partners 2-3 times weekly. Study master fighters\' defensive systems. Spar opponents forcing active defense. Expected time: 10-12 weeks.',
              s.novice_level = 'Cannot defend consistently against skilled opponents. Defensive systems are basic and limited. To progress: Study defensive strategies of skilled fighters.',
              s.advanced_beginner_level = 'Has improved defensive options. Can defend against competent opponents. Beginning to understand different defensive approaches. To progress: Work advanced defensive techniques.',
              s.competent_level = 'Uses varied defensive techniques effectively. Can parry and catch some strikes. Defends reasonably against skilled opponents. To progress: Develop personalized defensive system.',
              s.proficient_level = 'Defensive systems are intuitive and effective. Parries and catches strikes automatically. Defends flawlessly against most opponents. To progress: Master rare defensive situations.',
              s.expert_level = 'Defensive systems are perfect and instinctive. Defends expertly against anyone. Makes fighters miss while countering. Can teach advanced defense to others.';

MERGE (s:Skill {name: 'Muay Thai Opponent Analysis'})
ON CREATE SET s.description = 'The ability to thoroughly analyze opponent tendencies, strengths, weaknesses, habits, and fighting patterns to develop comprehensive game plans and make real-time tactical adjustments',
              s.how_to_develop = 'Watch extensive fight footage of potential opponents. Spar with similar fighters. Get feedback from coaches on game plans. Fight and analyze results. Expected time: Ongoing throughout competitive career.',
              s.novice_level = 'Identifies only obvious opponent characteristics. Game plans are basic and rigid. Cannot adapt well to unexpected opponent approaches. To progress: Study more opponent footage.',
              s.advanced_beginner_level = 'Identifies more opponent tendencies. Game plans are more detailed. Makes some tactical adjustments based on observed behavior. To progress: Deepen opponent study.',
              s.competent_level = 'Analyzes opponent strengths and weaknesses systematically. Develops sound game plans. Makes deliberate tactical adjustments based on observations. To progress: Develop comprehensive analysis systems.',
              s.proficient_level = 'Opponent analysis is intuitive and thorough. Creates comprehensive game plans instantly. Adapts perfectly mid-fight based on observations. To progress: Master specialized analysis.',
              s.expert_level = 'Analyzes opponents with exceptional depth. Creates perfect game plans. Adapts flawlessly to any approach. Can teach systematic opponent analysis.';

MERGE (s:Skill {name: 'Muay Thai Competitive Fighting'})
ON CREATE SET s.description = 'The ability to apply all skills effectively in competitive match situations under maximum pressure, executing a game plan while adapting tactically, managing stress, and performing at peak level in high-stakes environments',
              s.how_to_develop = 'Fight regularly in competitions at appropriate level. Compete in amateur matches initially. Progress to higher competition levels. Train extensively for each fight. Get coaching feedback. Expected time: Ongoing throughout fighting career.',
              s.novice_level = 'Struggles in competitive pressure. Forgets training in fight situations. Makes poor decisions under stress. Inconsistent performance. To progress: Build competitive experience gradually.',
              s.advanced_beginner_level = 'Can compete but often ineffective. Shows glimpses of training. Makes some tactical decisions but primarily reactive. To progress: Increase match frequency and competition level.',
              s.competent_level = 'Competes effectively with decent results. Applies training fairly well. Makes sound tactical decisions in matches. Can win against similar-level opponents. To progress: Compete at higher levels.',
              s.proficient_level = 'Competitive performance is strong and confident. Executes game plans despite pressure. Makes intuitive tactical decisions. Beats most opponents at similar level. To progress: Compete at elite levels.',
              s.expert_level = 'Competitive performance is exceptional. Functions flawlessly under maximum pressure. Beats superior athletes through technique and intelligence. Dominates competition.';

MERGE (s:Skill {name: 'Muay Thai Strength and Conditioning'})
ON CREATE SET s.description = 'The ability to develop and maintain the physical conditioning required for high-level Muay Thai including explosive power, cardiovascular endurance, muscular strength, and ability to maintain performance in later rounds',
              s.how_to_develop = 'Perform high-intensity conditioning work 2-3 times weekly. Include strength training 2-3 times weekly. Practice breathing techniques during training. Train in varied conditions. Expected time: Ongoing throughout career.',
              s.novice_level = 'Shows signs of fatigue during hard training. Limited explosive power. Struggles in later rounds. Conditioning is basic. To progress: Increase training volume and intensity.',
              s.advanced_beginner_level = 'Better conditioning with less early fatigue. Shows some explosive power. Can maintain pace for 3-4 rounds. To progress: Build greater endurance and strength.',
              s.competent_level = 'Maintains good conditioning throughout training and competition. Explosive power in strikes. Can perform 5-8 hard rounds. To progress: Build elite-level conditioning.',
              s.proficient_level = 'Conditioning is exceptional with perfect pacing. Maintains explosive power throughout long training. Can perform 10+ rounds at high intensity. To progress: Maintain and refine conditioning.',
              s.expert_level = 'Conditioning is elite with perfect power maintenance. Never shows fatigue or slowing in later rounds. Can push pace at will. Teaches conditioning methods effectively.';

MERGE (s:Skill {name: 'Muay Thai Teaching and Coaching'})
ON CREATE SET s.description = 'The ability to teach Muay Thai effectively to students of varying skill levels, breaking down complex techniques, providing clear feedback, developing fighters, and managing training groups',
              s.how_to_develop = 'Assist experienced coaches. Teach beginners under supervision. Request feedback on teaching effectiveness. Study educational methods. Expected time: Ongoing throughout coaching career.',
              s.novice_level = 'Struggles to teach clearly. Limited ability to break down techniques. Cannot adapt teaching to student level. To progress: Observe experienced coaches and practice teaching.',
              s.advanced_beginner_level = 'Can teach basic techniques with some clarity. Beginning to adjust for different learners. Makes some helpful corrections. To progress: Teach more diverse students.',
              s.competent_level = 'Teaches techniques effectively with clear explanations. Adapts teaching for different skill levels. Provides helpful, actionable feedback. Students progress steadily. To progress: Develop specialized coaching methods.',
              s.proficient_level = 'Teaching is clear and engaging. Students progress rapidly. Excellent at adapting for different learning styles. Can develop fighters of varied backgrounds. To progress: Master advanced coaching.',
              s.expert_level = 'Coaching is exceptional with perfect technique communication. Develops fighters to elite levels. Adapts seamlessly to any student. Can train other coaches effectively.';

MERGE (s:Skill {name: 'Muay Thai Wai Kru Performance'})
ON CREATE SET s.description = 'The authentic and respectful performance of the Wai Kru pre-fight ritual including proper movements, spiritual presence, and cultural authenticity that honors the tradition and traditions of Muay Thai',
              s.how_to_develop = 'Learn Wai Kru from Thai instructors with cultural knowledge. Study meaning and significance. Practice ritual with intentionality. Engage with Thai culture and Buddhism. Expected time: Ongoing cultural development.',
              s.novice_level = 'Performs Wai Kru movements mechanically without understanding. Form is imperfect. Lacks cultural authenticity or spiritual presence. To progress: Learn meaning and practice with intention.',
              s.advanced_beginner_level = 'Form is improving with better understanding. Beginning to feel cultural significance. Performance shows more intention. To progress: Deepen cultural knowledge.',
              s.competent_level = 'Performs Wai Kru with proper form and clear intention. Demonstrates respect and cultural understanding. Performance shows authenticity. To progress: Develop deeper spiritual connection.',
              s.proficient_level = 'Wai Kru performance is smooth and culturally authentic. Clear spiritual presence and intention. Demonstrates deep respect and understanding. To progress: Master all Wai Kru variations.',
              s.expert_level = 'Wai Kru performance is perfect with complete cultural authenticity. Demonstrates profound spiritual connection. Can teach Wai Kru with proper context and respect.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

MERGE (t:Trait {name: 'Explosive Power'})
ON CREATE SET t.description = 'The ability to generate intense force in short bursts enabling powerful kicks, punches, knee strikes, and explosive clinch movements',
              t.measurement_criteria = 'Assessed through power output in striking demonstrations, jumping height, and striking force measurements. Low (0-25): Strikes lack force and penetration. Moderate (26-50): Average force production with inconsistent power. High (51-75): Strong consistent power in most strikes. Exceptional (76-100): Devastating force in every strike, effortlessly generates power.';

MERGE (t:Trait {name: 'Durability'})
ON CREATE SET t.description = 'The physical and mental capacity to withstand repeated strikes, impacts, and sustained pressure without significant deterioration in performance or ability to continue at high intensity',
              t.measurement_criteria = 'Assessed through ability to maintain performance throughout hard training rounds and recover from impacts. Low (0-25): Easily fatigued, struggles with repetitive impact. Moderate (26-50): Can handle moderate training but shows wear in longer sessions. High (51-75): Maintains performance well through hard training. Exceptional (76-100): Absorbs punishment without noticeable fatigue or performance loss.';

MERGE (t:Trait {name: 'Balance'})
ON CREATE SET t.description = 'The ability to maintain stable position and equilibrium during strikes, kicks, evasion, and clinch work even in compromised positions or when off-balance',
              t.measurement_criteria = 'Assessed through stability during kicking, striking, and footwork. Low (0-25): Frequently loses balance or falls during techniques. Moderate (26-50): Maintains balance during basic techniques, occasional losses. High (51-75): Stable throughout most movements and strikes. Exceptional (76-100): Perfect balance even in extreme positions or after being pushed.';

MERGE (t:Trait {name: 'Hand-Eye Coordination'})
ON CREATE SET t.description = 'The ability to accurately target strikes and defensive techniques through visual tracking and precise hand and foot positioning relative to opponent movement',
              t.measurement_criteria = 'Assessed through striking accuracy on pads and bags, and ability to land clean strikes during sparring. Low (0-25): Frequently misses intended targets or strikes ineffectively. Moderate (26-50): Average accuracy with some missed opportunities. High (51-75): Good targeting accuracy, lands most intended strikes. Exceptional (76-100): Perfect accuracy, targets with minimal conscious effort.';

MERGE (t:Trait {name: 'Reaction Time'})
ON CREATE SET t.description = 'The speed at which nervous system processes information and initiates defensive or offensive responses to opponent movements and incoming strikes',
              t.measurement_criteria = 'Assessed through speed of defensive reactions and response to incoming attacks during sparring and drills. Low (0-25): Slow to react, frequently hit before responding. Moderate (26-50): Average reaction speed, sometimes gets hit. High (51-75): Quick reactions, rarely gets hit cleanly. Exceptional (76-100): Extraordinary reaction speed, nearly impossible to hit clean.';

MERGE (t:Trait {name: 'Pattern Recognition'})
ON CREATE SET t.description = 'The ability to identify, recognize, and interpret patterns in opponent behavior, strike combinations, movement habits, and tactical approaches enabling faster reactions and better predictions',
              t.measurement_criteria = 'Assessed through ability to predict opponent strikes and identify repeated patterns during sparring and fight analysis. Low (0-25): Struggles to see patterns, constantly surprised by opponent actions. Moderate (26-50): Recognizes obvious patterns with time and repetition. High (51-75): Quickly identifies patterns in familiar opponents. Exceptional (76-100): Instantly recognizes subtle patterns across unfamiliar opponents.';

MERGE (t:Trait {name: 'Spatial Awareness'})
ON CREATE SET t.description = 'The ability to maintain accurate mental maps of ring position, distance to opponent, environment boundaries, and optimal positioning relative to target',
              t.measurement_criteria = 'Assessed through positioning decisions and distance management during training and competition. Low (0-25): Poor spatial judgment, frequently misjudges distance and position. Moderate (26-50): Average spatial awareness with occasional errors. High (51-75): Good awareness of position and distance. Exceptional (76-100): Perfect spatial awareness, optimally positioned without conscious thought.';

MERGE (t:Trait {name: 'Focus'})
ON CREATE SET t.description = 'The ability to maintain concentrated attention on relevant aspects of training or fighting while filtering out distractions and maintaining mental presence',
              t.measurement_criteria = 'Assessed through ability to concentrate during extended training sessions and maintain attention to technique during fatigue. Low (0-25): Easily distracted, loses focus during training. Moderate (26-50): Can focus for short periods, loses attention in fatigue. High (51-75): Maintains good focus throughout training. Exceptional (76-100): Perfect concentration regardless of conditions or fatigue.';

MERGE (t:Trait {name: 'Mental Toughness'})
ON CREATE SET t.description = 'The psychological resilience to face adversity, pain, fear, and pressure while maintaining composure, continuing effort, and making sound decisions under extreme stress',
              t.measurement_criteria = 'Assessed through ability to push through difficult training, continue fighting when injured or fatigued, and maintain performance when losing. Low (0-25): Quits when facing difficulty or pain. Moderate (26-50): Can push through some difficulty with motivation. High (51-75): Maintains effort through significant challenges. Exceptional (76-100): Extraordinary mental toughness, never quits regardless of circumstances.';

MERGE (t:Trait {name: 'Competitiveness'})
ON CREATE SET t.description = 'The inherent drive to win, exceed others\' performance, achieve victory in competitive situations, and continually improve personal standing relative to peers',
              t.measurement_criteria = 'Assessed through intensity during sparring, goal-setting, and desire to win competitions. Low (0-25): Shows little interest in winning or competition. Moderate (26-50): Normal competitive drive, seeks wins but not obsessive. High (51-75): Strong competitive drive, highly motivated to win. Exceptional (76-100): Extreme competitiveness, relentless pursuit of victory.';

MERGE (t:Trait {name: 'Confidence'})
ON CREATE SET t.description = 'The belief in personal ability, capacity to succeed, and conviction that training and preparation will yield results in challenging situations',
              t.measurement_criteria = 'Assessed through willingness to attempt challenging techniques, face stronger opponents, and maintain performance under pressure. Low (0-25): Doubts abilities, hesitates in challenging situations. Moderate (26-50): Normal confidence, capable when well-prepared. High (51-75): High confidence, believes in ability against varied opponents. Exceptional (76-100): Unshakeable confidence, never doubts ability regardless of circumstances.';

MERGE (t:Trait {name: 'Discipline'})
ON CREATE SET t.description = 'The ability to maintain consistent effort, follow training plans, and make difficult choices that support long-term goals even when immediate gratification offers easier paths',
              t.measurement_criteria = 'Assessed through training consistency, following nutritional and recovery protocols, and commitment to improvement. Low (0-25): Inconsistent training, easily distracted from goals. Moderate (26-50): Generally consistent but occasional lapses. High (51-75): Strong consistency, rarely skips training or protocols. Exceptional (76-100): Perfect discipline, unfailing commitment to training and protocols.';

MERGE (t:Trait {name: 'Fearlessness'})
ON CREATE SET t.description = 'The absence of excessive fear response in dangerous situations enabling willingness to face opponents, attempt high-risk techniques, and engage in clinch battles without hesitation',
              t.measurement_criteria = 'Assessed through willingness to clinch with strong opponents, attempt techniques above skill level, and maintain aggression despite danger. Low (0-25): Significant fear response, hesitates to engage. Moderate (26-50): Normal fear that is manageable with effort. High (51-75): Low fear response, comfortable in dangerous situations. Exceptional (76-100): Essentially fearless, no discernible fear response in any situation.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones (1-2 milestones)

MERGE (m:Milestone {name: 'Complete First Muay Thai Class'})
ON CREATE SET m.description = 'Successfully complete a full introductory Muay Thai class at a qualified gym, learning basic stance, guard position, and foundational stance work with instructional guidance',
              m.how_to_achieve = 'Visit a local Muay Thai gym or martial arts facility offering beginner classes. Attend an introductory session (typically 60-90 minutes). Arrive early, introduce yourself to the instructor, and mention you are a beginner. Wear comfortable workout clothes and bring water. Expected time: Single session. Most beginners complete this in their first visit.';

MERGE (m:Milestone {name: 'Throw 100 Consecutive Punches with Proper Form'})
ON CREATE SET m.description = 'Execute 100 punches in sequence while maintaining proper stance, hip rotation, and weight transfer without significant form breakdown',
              m.how_to_achieve = 'Shadow box 100 punches slowly and controlled against air, focusing on hip engagement and form. Alternatively, throw 100 punches against a heavy bag at moderate pace. Record yourself and compare to instructional videos. Work with an instructor who can count and correct form. Expected time: 2-3 weeks of daily practice.';

// Developing Level Milestones (2-3 milestones)

MERGE (m:Milestone {name: 'Achieve Beginner Pad Work Fluency'})
ON CREATE SET m.description = 'Successfully execute basic pad work combinations smoothly with a pad holder for a full 3-minute round while maintaining proper footwork and timing',
              m.how_to_achieve = 'Work pads with a qualified pad holder 2-3 times per week for 3-4 weeks. Start with basic 2-3 strike combinations. Progress to flowing combinations of 4-6 strikes. Focus on following pad holder rhythm and maintaining proper stance. Expected time: 3-4 weeks with regular training.';

MERGE (m:Milestone {name: 'Perform Controlled Light Sparring Round'})
ON CREATE SET m.description = 'Complete a full 3-minute light sparring round with a training partner while maintaining control, applying learned techniques, and staying safe',
              m.how_to_achieve = 'Work with a patient training partner in a controlled environment. Start with agreed-upon light intensity (typically 40-50% power). Focus on basic techniques and maintaining distance. Get permission from instructor before sparring. Expected time: 4-6 weeks of consistent training before first light spar.';

MERGE (m:Milestone {name: 'Execute Full Kick Technique Cleanly'})
ON CREATE SET m.description = 'Successfully throw 20 consecutive kicks of a single type (roundhouse, side, or front kick) with proper chamber, hip rotation, balance, and extension',
              m.how_to_achieve = 'Practice 15-20 minutes of daily kicking drills on heavy bag and air. Focus on proper chamber and hip engagement. Have instructor verify form. Film yourself kicking and compare to instructional videos. Perform 20 consecutive quality kicks against heavy bag. Expected time: 4-6 weeks.';

MERGE (m:Milestone {name: 'Establish Basic Clinch Control'})
ON CREATE SET m.description = 'Successfully establish clinch grip and posture control with a cooperative training partner and land 5 controlled knee strikes without losing control',
              m.how_to_achieve = 'Work clinch drills with a cooperative partner 2-3 times weekly. Learn proper hand placement behind neck or upper back. Practice posture control without resistance initially. Gradually add light resistance and begin landing controlled knees. Expected time: 3-4 weeks of focused clinch training.';

// Competent Level Milestones (2-4 milestones)

MERGE (m:Milestone {name: 'Complete First Amateur Muay Thai Sparring Match'})
ON CREATE SET m.description = 'Participate in an organized amateur Muay Thai sparring match at appropriate beginner level, completing all rounds and applying trained techniques in competitive context',
              m.how_to_achieve = 'Train consistently for 3-6 months building solid fundamentals. Work regularly with pads and spar with multiple partners. Get clearance from your instructor that you are ready to compete. Register for an amateur match at beginner level through your gym or local association. Expected time: 3-6 months of preparation.';

MERGE (m:Milestone {name: 'Develop 5 Effective Combinations'})
ON CREATE SET m.description = 'Create and master 5 personal combinations of 4-6 strikes each that flow smoothly, utilize all eight limbs, and can be executed fluidly during pad work and sparring',
              m.how_to_achieve = 'Study common combinations in instructional videos and fight footage. Design 5 personal combinations based on your strengths. Practice each combination 50-100 times on bags and pads daily. Receive feedback from instructor on flow and effectiveness. Expected time: 4-6 weeks.';

MERGE (m:Milestone {name: 'Spar Three Different Partners'})
ON CREATE SET m.description = 'Complete light sparring rounds with at least three different training partners, adapting to varied fighting styles and demonstrating technique application against different opponents',
              m.how_to_achieve = 'Identify three training partners of varied skill and style. Spar light with each partner for one or more 3-5 minute rounds. Focus on applying technique rather than winning. Get feedback from each partner on your strengths and areas for improvement. Expected time: 4-8 weeks.';

MERGE (m:Milestone {name: 'Sustain 5 Rounds of Heavy Bag Work'})
ON CREATE SET m.description = 'Successfully complete 5 consecutive rounds of heavy bag training (5 minutes per round) at moderate intensity while maintaining technique and power throughout',
              m.how_to_achieve = 'Build conditioning through regular training. Practice 3-5 minute rounds on heavy bag, focusing on maintaining form and pace. Rest 1-2 minutes between rounds. Work up to 5 consecutive rounds over 4-6 weeks. Expected time: 6-8 weeks of regular training.';

// Advanced Level Milestones (2-4 milestones)

MERGE (m:Milestone {name: 'Win Amateur Muay Thai Match'})
ON CREATE SET m.description = 'Achieve victory in an official amateur Muay Thai competition match, demonstrating superior technique, strategy, and execution against an opponent of similar level',
              m.how_to_achieve = 'Fight in 3-5 amateur matches to gain experience. Study your upcoming opponent\'s fight footage and fighting style. Develop a specific game plan with your coach. Train extensively for the match (6-8 weeks). Execute the game plan and adapt mid-fight based on opponent\'s approach. Expected time: 6-12 months of competitive fighting.';

MERGE (m:Milestone {name: 'Execute Advanced Clinch Exchanges'})
ON CREATE SET m.description = 'Successfully control clinch against a skilled opponent using varied grip techniques and landing multiple effective knee strikes while defending against counter-techniques',
              m.how_to_achieve = 'Work advanced clinch drills with qualified instructors 2-3 times weekly for 8-12 weeks. Study professional clinch exchanges in slow motion. Spar with advanced partners focusing on clinch. Work underhooks and collar tie variations. Practice breaking opponent posture. Expected time: 8-12 weeks.';

MERGE (m:Milestone {name: 'Adapt Technique Mid-Spar Successfully'})
ON CREATE SET m.description = 'During sparring, recognize that current strategy is ineffective and successfully adjust technique, distance, pace, or combinations to create advantage against opponent',
              m.how_to_achieve = 'Spar regularly with varied opponents 2-3 times weekly for 6-8 weeks. Focus on noticing when techniques are working vs. not working. Discuss with coaches how to adjust when strategy fails. Practice making deliberate adjustments during sparring. Expected time: 6-8 weeks of attentive sparring.';

MERGE (m:Milestone {name: 'Develop Signature Technique or Combination'})
ON CREATE SET m.description = 'Create a distinctive striking combination, clinch exchange, or defensive technique that is particularly effective for your fighting style and becomes a reliable signature tool',
              m.how_to_achieve = 'Analyze your strengths and natural movement patterns. Experiment with variations on techniques that feel natural to you. Practice signature technique repeatedly against varied partners. Refine until it becomes reliably effective. Get feedback from coaches on effectiveness. Expected time: 4-8 weeks of focused development.';

// Master Level Milestones (2-5 milestones)

MERGE (m:Milestone {name: 'Achieve 10 Amateur Match Victories'})
ON CREATE SET m.description = 'Accumulate 10 victories in official amateur Muay Thai competitions, establishing yourself as a successful competitive fighter and demonstrating consistent high-level performance',
              m.how_to_achieve = 'Compete regularly in amateur matches over 12-24 months. Maintain high training standards between fights. Study opponents and develop game plans. Win competitive matches through technique, strategy, and execution. Expected time: 12-24 months of regular competition.';

MERGE (m:Milestone {name: 'Successfully Mentor a Developing Fighter'})
ON CREATE SET m.description = 'Guide and instruct a developing fighter through progressive improvement, teaching techniques, providing feedback, and helping them achieve their own training milestones',
              m.how_to_achieve = 'Identify a developing fighter in your gym willing to work with you. Spend 30-60 minutes weekly providing instruction and feedback. Teach specific techniques. Help them design training plans. Give honest feedback on performance. Support them through their progression. Expected time: 3-6 months minimum.';

MERGE (m:Milestone {name: 'Teach a Muay Thai Class Successfully'})
ON CREATE SET m.description = 'Lead a complete Muay Thai instruction class for beginners or intermediate students, teaching techniques clearly, providing appropriate progressions, and managing the group effectively',
              m.how_to_achieve = 'Gain permission from your gym to teach. Plan a complete class including warm-up, technique instruction, drilling, and cool-down. Teach 4-6 students or a larger group. Focus on clarity of instruction and appropriate progressions. Get feedback from students and your coach. Expected time: One class completion.';

MERGE (m:Milestone {name: 'Achieve Professional Muay Thai Status'})
ON CREATE SET m.description = 'Transition from amateur to professional Muay Thai fighter, obtaining professional licensing, competing in professional-level matches, and establishing yourself in the professional ranks',
              m.how_to_achieve = 'Achieve at least 5-10 successful amateur matches. Get recommendation from your gym/coach for professional status. Complete required paperwork for professional licensing in your jurisdiction. Compete in professional matches under professional rules and scoring. Expected time: 12-24+ months of amateur success.';

MERGE (m:Milestone {name: 'Perform Authentic Wai Kru Ritual'})
ON CREATE SET m.description = 'Perform the traditional Wai Kru pre-fight ritual with proper form, authentic movements, cultural respect, and spiritual intention before a competitive match',
              m.how_to_achieve = 'Learn Wai Kru from a Thai instructor with deep cultural knowledge, not just mechanically. Understand the spiritual and cultural significance of each movement. Practice with intention and respect. Perform before your first competitive match with proper form and presence. Expected time: 4-12 weeks of cultural study.';

// ============================================================
// Agent 3: Relationships and Level Assignments
// ============================================================

// ============================================================
// LEVEL 1: Muay Thai Novice - Requirements
// ============================================================

// Knowledge Requirements - Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Footwork'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

// Skill Requirements - Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (s:Skill {name: 'Muay Thai Stance'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (s:Skill {name: 'Muay Thai Footwork'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (s:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Trait Requirements - Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (t:Trait {name: 'Balance'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

// Milestone Requirements - Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (m:Milestone {name: 'Complete First Muay Thai Class'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Muay Thai Novice'})
MATCH (m:Milestone {name: 'Throw 100 Consecutive Punches with Proper Form'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 2: Muay Thai Developing - Requirements
// ============================================================

// Knowledge Requirements - Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Footwork'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Pad Work Principles'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (k:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

// Skill Requirements - Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Stance'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Knee Strike'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Elbow Strike'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Footwork'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Combination Execution'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Clinch Control'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (s:Skill {name: 'Muay Thai Pad Work'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Trait Requirements - Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (t:Trait {name: 'Balance'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (t:Trait {name: 'Durability'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

// Milestone Requirements - Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (m:Milestone {name: 'Achieve Beginner Pad Work Fluency'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (m:Milestone {name: 'Perform Controlled Light Sparring Round'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (m:Milestone {name: 'Execute Full Kick Technique Cleanly'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Muay Thai Developing'})
MATCH (m:Milestone {name: 'Establish Basic Clinch Control'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 3: Muay Thai Competent - Requirements
// ============================================================

// Knowledge Requirements - Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Footwork'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Pad Work Principles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Breathing and Conditioning'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (k:Knowledge {name: 'Muay Thai Transition and Chain Theory'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements - Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Stance'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Knee Strike'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Elbow Strike'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Footwork'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Combination Execution'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Clinch Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Pad Work'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Distance Management'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Defensive Movement'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (s:Skill {name: 'Muay Thai Light Sparring'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Trait Requirements - Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Balance'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Durability'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (t:Trait {name: 'Mental Toughness'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

// Milestone Requirements - Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (m:Milestone {name: 'Complete First Amateur Muay Thai Sparring Match'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (m:Milestone {name: 'Develop 5 Effective Combinations'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (m:Milestone {name: 'Spar Three Different Partners'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Muay Thai Competent'})
MATCH (m:Milestone {name: 'Sustain 5 Rounds of Heavy Bag Work'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 4: Muay Thai Advanced - Requirements
// ============================================================

// Knowledge Requirements - Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Footwork'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Pad Work Principles'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Breathing and Conditioning'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Transition and Chain Theory'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Advanced Clinch Control'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Ring Intelligence'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Strike Detection and Prediction'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (k:Knowledge {name: 'Muay Thai Tactical Range Work'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements - Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Stance'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Knee Strike'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Elbow Strike'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Footwork'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Combination Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Clinch Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Pad Work'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Distance Management'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Defensive Movement'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Light Sparring'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Ring Intelligence'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Clinch Mastery'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Advanced Defensive Systems'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Opponent Analysis'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Competitive Fighting'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (s:Skill {name: 'Muay Thai Strength and Conditioning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Trait Requirements - Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Balance'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Spatial Awareness'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Durability'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Mental Toughness'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Competitiveness'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (t:Trait {name: 'Confidence'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

// Milestone Requirements - Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (m:Milestone {name: 'Win Amateur Muay Thai Match'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (m:Milestone {name: 'Execute Advanced Clinch Exchanges'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (m:Milestone {name: 'Adapt Technique Mid-Spar Successfully'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Muay Thai Advanced'})
MATCH (m:Milestone {name: 'Develop Signature Technique or Combination'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 5: Muay Thai Master - Requirements
// ============================================================

// Knowledge Requirements - Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Footwork'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Pad Work Principles'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Breathing and Conditioning'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Transition and Chain Theory'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Advanced Clinch Control'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Ring Intelligence'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Strike Detection and Prediction'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Tactical Range Work'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Combat Philosophy and History'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Opponent Analysis and Game Planning'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Advanced Defensive Systems'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Injury Prevention and Recovery'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Teaching and Coach Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (k:Knowledge {name: 'Muay Thai Wai Kru and Cultural Practice'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements - Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Stance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Knee Strike'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Elbow Strike'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Footwork'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Combination Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Clinch Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Pad Work'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Distance Management'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Defensive Movement'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Light Sparring'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Ring Intelligence'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Clinch Mastery'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Advanced Defensive Systems'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Opponent Analysis'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Competitive Fighting'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Strength and Conditioning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Teaching and Coaching'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (s:Skill {name: 'Muay Thai Wai Kru Performance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

// Trait Requirements - Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Balance'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Pattern Recognition'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Spatial Awareness'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Durability'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Mental Toughness'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Competitiveness'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Confidence'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Discipline'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Fearlessness'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (t:Trait {name: 'Explosive Power'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

// Milestone Requirements - Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (m:Milestone {name: 'Achieve 10 Amateur Match Victories'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (m:Milestone {name: 'Successfully Mentor a Developing Fighter'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (m:Milestone {name: 'Teach a Muay Thai Class Successfully'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (m:Milestone {name: 'Achieve Professional Muay Thai Status'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Muay Thai Master'})
MATCH (m:Milestone {name: 'Perform Authentic Wai Kru Ritual'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Component Prerequisites
// ============================================================

// Knowledge Prerequisites
MATCH (k1:Knowledge {name: 'Muay Thai Combination Theory'})
MATCH (k2:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Combination Theory'})
MATCH (k2:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
MATCH (k2:Knowledge {name: 'Muay Thai Stance and Guard'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Transition and Chain Theory'})
MATCH (k2:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Advanced Clinch Control'})
MATCH (k2:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Ring Intelligence'})
MATCH (k2:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Strike Detection and Prediction'})
MATCH (k2:Knowledge {name: 'Muay Thai Ring Intelligence'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Tactical Range Work'})
MATCH (k2:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Opponent Analysis and Game Planning'})
MATCH (k2:Knowledge {name: 'Muay Thai Ring Intelligence'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Muay Thai Advanced Defensive Systems'})
MATCH (k2:Knowledge {name: 'Muay Thai Basic Defensive Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Skill Prerequisites
MATCH (s1:Skill {name: 'Muay Thai Combination Execution'})
MATCH (s2:Skill {name: 'Muay Thai Punch Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Combination Execution'})
MATCH (s2:Skill {name: 'Muay Thai Kick Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Clinch Control'})
MATCH (s2:Skill {name: 'Muay Thai Stance'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Clinch Control'})
MATCH (s2:Skill {name: 'Muay Thai Footwork'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Pad Work'})
MATCH (s2:Skill {name: 'Muay Thai Punch Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Pad Work'})
MATCH (s2:Skill {name: 'Muay Thai Kick Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Distance Management'})
MATCH (s2:Skill {name: 'Muay Thai Footwork'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Defensive Movement'})
MATCH (s2:Skill {name: 'Muay Thai Footwork'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Light Sparring'})
MATCH (s2:Skill {name: 'Muay Thai Stance'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Light Sparring'})
MATCH (s2:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Light Sparring'})
MATCH (s2:Skill {name: 'Muay Thai Defensive Movement'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Ring Intelligence'})
MATCH (s2:Skill {name: 'Muay Thai Distance Management'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Clinch Mastery'})
MATCH (s2:Skill {name: 'Muay Thai Clinch Control'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Advanced Defensive Systems'})
MATCH (s2:Skill {name: 'Muay Thai Blocking and Parrying'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Opponent Analysis'})
MATCH (s2:Skill {name: 'Muay Thai Ring Intelligence'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Competitive Fighting'})
MATCH (s2:Skill {name: 'Muay Thai Light Sparring'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Muay Thai Teaching and Coaching'})
MATCH (s2:Skill {name: 'Muay Thai Stance'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Skill requires Knowledge prerequisites
MATCH (s:Skill {name: 'Muay Thai Punch Technique'})
MATCH (k:Knowledge {name: 'Muay Thai Punch Mechanics'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Kick Technique'})
MATCH (k:Knowledge {name: 'Muay Thai Kick Mechanics'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Knee Strike'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Elbow Strike'})
MATCH (k:Knowledge {name: 'Muay Thai Knee and Elbow Strikes'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Combination Execution'})
MATCH (k:Knowledge {name: 'Muay Thai Combination Theory'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Clinch Control'})
MATCH (k:Knowledge {name: 'Muay Thai Clinch Fundamentals'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Distance Management'})
MATCH (k:Knowledge {name: 'Muay Thai Distance Management'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Ring Intelligence'})
MATCH (k:Knowledge {name: 'Muay Thai Ring Intelligence'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Clinch Mastery'})
MATCH (k:Knowledge {name: 'Muay Thai Advanced Clinch Control'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Advanced Defensive Systems'})
MATCH (k:Knowledge {name: 'Muay Thai Advanced Defensive Systems'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Opponent Analysis'})
MATCH (k:Knowledge {name: 'Muay Thai Opponent Analysis and Game Planning'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Teaching and Coaching'})
MATCH (k:Knowledge {name: 'Muay Thai Teaching and Coach Development'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Muay Thai Wai Kru Performance'})
MATCH (k:Knowledge {name: 'Muay Thai Wai Kru and Cultural Practice'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

// Milestone Prerequisites
MATCH (m1:Milestone {name: 'Achieve Beginner Pad Work Fluency'})
MATCH (m2:Milestone {name: 'Complete First Muay Thai Class'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Perform Controlled Light Sparring Round'})
MATCH (m2:Milestone {name: 'Achieve Beginner Pad Work Fluency'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete First Amateur Muay Thai Sparring Match'})
MATCH (m2:Milestone {name: 'Perform Controlled Light Sparring Round'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop 5 Effective Combinations'})
MATCH (m2:Milestone {name: 'Achieve Beginner Pad Work Fluency'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Spar Three Different Partners'})
MATCH (m2:Milestone {name: 'Perform Controlled Light Sparring Round'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Win Amateur Muay Thai Match'})
MATCH (m2:Milestone {name: 'Complete First Amateur Muay Thai Sparring Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Execute Advanced Clinch Exchanges'})
MATCH (m2:Milestone {name: 'Establish Basic Clinch Control'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Adapt Technique Mid-Spar Successfully'})
MATCH (m2:Milestone {name: 'Spar Three Different Partners'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Signature Technique or Combination'})
MATCH (m2:Milestone {name: 'Develop 5 Effective Combinations'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve 10 Amateur Match Victories'})
MATCH (m2:Milestone {name: 'Win Amateur Muay Thai Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Mentor a Developing Fighter'})
MATCH (m2:Milestone {name: 'Complete First Amateur Muay Thai Sparring Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Teach a Muay Thai Class Successfully'})
MATCH (m2:Milestone {name: 'Successfully Mentor a Developing Fighter'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Professional Muay Thai Status'})
MATCH (m2:Milestone {name: 'Achieve 10 Amateur Match Victories'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Perform Authentic Wai Kru Ritual'})
MATCH (m2:Milestone {name: 'Complete First Muay Thai Class'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// ============================================================
// Agent 4: Quality Validation
// ============================================================

// VALIDATION SUMMARY
// Recommendation: APPROVE
// Overall Assessment: Comprehensive, well-structured domain with excellent coverage across all component types. Domain is coherent, logically organized with clear progression, and ready for database implementation. Strong alignment with Muay Thai principles and realistic progression paths.

// COVERAGE ASSESSMENT
// Knowledge: Comprehensive coverage (22 nodes). Excellent foundational progression from basic mechanics to advanced tactical understanding. All core concepts present: striking fundamentals (stance, punches, kicks, knees, elbows), intermediate development (combinations, clinch, pad work, distance, breathing, transitions), advanced concepts (clinch mastery, ring intelligence, strike prediction, tactical range), and specialized master-level knowledge (philosophy, history, opponent analysis, defensive systems, injury prevention, teaching, cultural practice). No significant knowledge gaps identified.

// Skills: Well-balanced coverage (21 nodes). Progresses logically from fundamental execution (stance, punches, kicks, knees, elbows, footwork, blocking) through intermediate compound skills (combinations, clinch control, pad work, distance management, defensive movement, light sparring) to advanced mastery skills (ring intelligence, clinch mastery, advanced defensive systems, opponent analysis, teaching). All skills have detailed Bloom's/Dreyfus level progression. Skills align precisely with knowledge requirements.

// Traits: Appropriate trait selection (13 nodes). Traits are well-chosen and genuinely impact Muay Thai performance: Physical traits (explosive power, durability, balance, hand-eye coordination, reaction time, spatial awareness) directly support striking and clinch work. Mental/psychological traits (pattern recognition, focus, mental toughness, competitiveness, confidence, discipline, fearlessness) directly impact competitive performance and ring intelligence. Traits are true traits (not skills disguised as traits) with clear measurement criteria and relevant 0-100 scales with descriptive anchors.

// Milestones: Strong milestone structure (19 nodes). Meaningful progression markers across all levels: Novice (2): class attendance and punch consistency. Developing (4): pad work fluency, light sparring, kick technique, clinch control. Competent (4): amateur match participation, combination mastery, partner sparring, conditioning. Advanced (4): match victories, advanced clinch, mid-spar adaptation, signature technique. Master (5): multiple victories, mentoring, teaching, professional status, cultural ritual. Milestones are specific, measurable, and mark genuine progress. Excellent variety across competition, skill mastery, and mentoring domains.

// COHERENCE CHECKS
// Domain Alignment: Excellent alignment. All components fit within defined scope. Striking techniques (8 limbs), clinch work, defensive tactics, conditioning, ring intelligence, cultural elements, and mental discipline all included as promised. Scope exclusions appropriately honored (general martial arts philosophy, MMA, kickboxing, boxing, facility management, nutrition covered elsewhere). No scope creep; all components are distinctly Muay Thai.

// Level Progression: Logical and well-differentiated progression. Novice (foundational mechanics with instructor guidance), Developing (proficiency building, early sparring), Competent (solid execution in amateur context), Advanced (consistent victories, mentoring capability), Master (expert mastery, professional level, cultural embodiment). Level requirements escalate appropriately with each level requiring higher Bloom's/Dreyfus levels of mastery. Level descriptions accurately reflect domain-specific progression.

// Relationship Logic: Relationship structure is sound with clear progression chains. Knowledge prerequisites flow logically (foundational mechanics → combinations/clinch → advanced tactical concepts → specialized mastery). Skill prerequisites align with knowledge (skills implement knowledge). Trait requirements are appropriate (balance minimum 25 for novice, increases naturally with sparring and advanced work). Milestone prerequisites create realistic progression paths without circular dependencies. Milestone chains are reasonable in length (2-3 steps typically).

// QUALITY CHECKS
// Content Quality: Excellent content quality throughout. Descriptions are specific and domain-appropriate (not generic). How-to guidance is practical and actionable with clear timeframes. Expected learning times are realistic (2-3 weeks for stance fundamentals, 4-6 weeks for combinations, 8-12 weeks for advanced clinch work). Measurement criteria for traits are concrete with specific observable indicators and numerical anchors. All content reflects genuine Muay Thai principles and progression paths.

// Completeness: All nodes meet required property standards. Knowledge nodes: name, description, how_to_learn, and all Bloom's levels (Remember through Create). Skill nodes: name, description, how_to_develop, and all Dreyfus levels (Novice through Expert). Trait nodes: name, description, measurement_criteria with scale anchors. Milestone nodes: name, description, how_to_achieve with realistic timeframes. Domain_Level nodes: domain, level, name, description. No missing required properties.

// Redundancy: Minimal redundancy identified. No duplicate or highly overlapping components. Knowledge nodes are distinct concepts at appropriate levels (e.g., "Basic Footwork" vs. "Defensive Movement" are separate skills requiring different focuses). Skills show clear differentiation in purpose and execution context. Traits avoid overlap (no confusion between physical and mental characteristics). One potential minor consolidation opportunity: "Muay Thai Opponent Analysis and Game Planning" (knowledge) and similar mirror in skills could be viewed as closely related but serve different purposes (conceptual understanding vs. practical execution skill) so consolidation not warranted.

// ISSUES IDENTIFIED
// Critical: None. Domain is fundamentally sound with no structural flaws.
// Major: None. No significant gaps or incoherence detected.
// Minor: None. Domain is comprehensive and well-executed.

// STRENGTHS
// - Authentic domain representation respecting Muay Thai's "Art of Eight Limbs" structure with complete coverage of striking modalities (fists, elbows, knees, shins)
// - Excellent progression from mechanical execution to strategic/tactical/philosophical mastery
// - Strong integration of cultural elements (Wai Kru ritual, Thai traditions) at appropriate master level
// - Realistic and achievable milestone structure with clear progression paths from beginner to professional
// - Well-defined trait system with physical and mental dimensions relevant to combat sport performance
// - Comprehensive clinch work coverage reflecting Muay Thai's distinctive clinch emphasis
// - Clear connection between knowledge understanding and skill execution at each level
// - Detailed how-to guidance with realistic timeframe expectations
// - Appropriate balance between individual technique mastery, compound skill development, competitive achievement, and mentoring/teaching progression
// - No circular dependencies in milestone prerequisites; clear linear progression with appropriate complexity

// EXAMPLE PROGRESSION PATHS

// Example Person 1: "Dedicated Hobbyist Fighter"
// Starting Point: Complete first Muay Thai class (Novice milestone)
// Level Progression Path:
//   Novice Level (0-3 months): Train 3x/week, master basic stance and punches, throw 100 consecutive punches cleanly, build basic fitness
//   Developing Level (3-6 months): Develop pad work fluency, light sparring, execute clean kicks, establish basic clinch control
//   Competent Level (6-12 months): First amateur sparring match, develop 5 effective combinations, spar multiple partners, sustain 5 rounds heavy bag
//   Advanced Level (12-18 months): Win amateur match, execute advanced clinch exchanges, adapt mid-spar, develop signature technique
// Focus: Strong technical foundation, amateur competition success, multiple match victories. Will not likely reach Master level (requires professional commitment). Example competency: Can spar opponents effectively, wins some amateur matches, has signature combination that works well in competition.

// Example Person 2: "Aspiring Professional Fighter"
// Starting Point: Complete first Muay Thai class (Novice milestone)
// Level Progression Path:
//   Novice Level (0-3 months): Daily training 5-6x/week, master fundamentals, strong fitness development, build mental toughness
//   Developing Level (3-6 months): Intensive pad work, multiple light sparring partners, establish clinch authority, competitive mentality development
//   Competent Level (6-12 months): First amateur match, consistent pad work excellence, multiple combat-style sparring, solid clinch exchanges
//   Advanced Level (12-24 months): Multiple amateur victories, advanced clinch mastery, tactical adaptation in competition, mentoring emerging fighters
//   Master Level (24-36+ months): Professional licensing, 10+ amateur victories, professional-level competition success, teaching classes, authentic Wai Kru performance
// Focus: Competitive excellence, professional achievement, mentoring next generation. Higher trait minimums (especially mental toughness, competitiveness, discipline). Example competency: Professional fighter with established record, signature clinch style, ability to game-plan opponents, teaching responsibility.

// Example Person 3: "Technical Specialist - Clinch Master"
// Starting Point: Complete first Muay Thai class (Novice milestone)
// Strength Focus: Clinch work and knee strikes (natural affinity for close range work)
// Level Progression Path:
//   Novice Level (0-3 months): Basic fundamentals with emphasis on clinch drills, foundational knee striking
//   Developing Level (3-6 months): Intensive clinch-focused pad work, clinch-heavy light sparring, basic clinch control established
//   Competent Level (6-12 months): First amateur matches emphasizing clinch dominance, 5 effective clinch combinations, multiple opponents faced
//   Advanced Level (12-18 months): Multiple amateur victories via clinch dominance, advanced clinch exchanges mastered, signature underhook technique, mentoring clinch development
// Focus: Specialization in clinch game rather than balanced striker. Example competency: Dominant in clinch exchanges, multiple victories from clinch control, effective at landing knee combinations, good teaching ability for clinch fundamentals.

// Example Person 4: "Defensive Stylist"
// Starting Point: Complete first Muay Thai class (Novice milestone)
// Strength Focus: Defensive movement, evasion, counter-striking (naturally high reaction time and pattern recognition)
// Level Progression Path:
//   Novice Level (0-3 months): Focus on defensive footwork, head movement, guard maintenance
//   Developing Level (3-6 months): Advanced defensive movement drills, evasion-focused sparring, counter-striking combinations
//   Competent Level (6-12 months): Amateur matches emphasizing counter-striking, defensive movement mastery, reading opponent patterns
//   Advanced Level (12-18 months): Multiple amateur victories via defensive strategy, advanced defensive systems understood, signature counter combinations, ability to adapt to aggressive opponents
// Focus: Defense-first fighting style rather than aggressive striking. Example competency: Excellent head movement, reads opponent patterns quickly, effective at countering, wins matches by out-thinking opponents rather than out-powering them.

// VALIDATION CONCLUSION
// The Muay Thai domain is comprehensive, coherent, and demonstrates excellent understanding of the sport's progression and components. All five domain levels are well-defined with clear distinguishing characteristics. The 22 knowledge nodes cover essential foundational through expert-level understanding. The 21 skills provide practical execution frameworks with detailed progression benchmarks. The 13 traits appropriately capture both physical and mental characteristics essential for Muay Thai success. The 19 milestones offer meaningful achievement markers across all progression levels.

// Relationship structure is sound with no circular dependencies and appropriate complexity in prerequisite chains. All content is specific to Muay Thai rather than generic martial arts. The domain respects both the technical/sport aspects of Muay Thai and the cultural/philosophical dimensions through inclusion of Wai Kru and traditional knowledge at appropriate levels.

// The domain successfully addresses the complete scope of Muay Thai as stated: striking techniques (all eight limbs), clinch work, defensive tactics, footwork, conditioning, sparring, ring performance, cultural traditions, and mental discipline. Multiple realistic progression paths exist enabling diverse character backgrounds and fighting styles.

// The domain is APPROVED for database implementation without revision.

