// Domain: Badminton
// Generated: 2025-11-16
// Description: A racquet sport played using racquets to hit a shuttlecock across a net

// ============================================================
// DOMAIN: Badminton
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Badminton',
  description: 'The sport of hitting a shuttlecock across a net using racquets, involving singles and doubles play with emphasis on footwork, racquet technique, court positioning, and strategic shot selection',
  level_count: 5,
  created_date: date(),
  scope_included: ['basic grip and footwork', 'shot technique (clears, drops, smashes, net play)', 'court positioning and movement', 'singles and doubles strategy', 'serve technique and placement', 'defensive and attacking play', 'match tactics and game management', 'physical conditioning for badminton'],
  scope_excluded: ['general fitness training (separate domain)', 'broader racquet sports like tennis (separate domain)', 'recreational games without serious training', 'biomechanics research and sport science (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Badminton Novice',
  description: 'Learning basic grip, stance, and fundamental strokes including basic clears and drops with inconsistent technique'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Badminton Developing',
  description: 'Developing consistent stroke technique, improving court positioning, learning basic game strategy and beginning to play friendly matches'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Badminton Competent',
  description: 'Playing solidly in singles and doubles with varied shot selection, good court sense, and reliable defensive and offensive capabilities'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Badminton Advanced',
  description: 'Executing advanced tactics, reading opponent patterns, mentoring developing players, and competing at competitive levels'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Badminton Master',
  description: 'Operating at the highest levels of competitive play, demonstrating exceptional racquet control and strategy, advancing the sport through coaching or elite competition'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Badminton'})
MATCH (level1:Domain_Level {name: 'Badminton Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Badminton'})
MATCH (level2:Domain_Level {name: 'Badminton Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Badminton'})
MATCH (level3:Domain_Level {name: 'Badminton Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Badminton'})
MATCH (level4:Domain_Level {name: 'Badminton Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Badminton'})
MATCH (level5:Domain_Level {name: 'Badminton Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge (Novice level)

MERGE (k_grip:Knowledge {name: 'Badminton Grip Fundamentals'})
ON CREATE SET k_grip.description = 'The correct way to hold a badminton racquet, including forehand grip, backhand grip, and neutral grip positions. Proper grip is essential for control, power, and injury prevention.',
              k_grip.how_to_learn = 'Practice with a badminton coach or instructional videos. Hold the racquet daily for 10-15 minutes until grip becomes natural. Play casual games while focusing on maintaining proper grip. Expected time: 1-2 weeks of consistent practice.',
              k_grip.remember_level = 'Recall the names and basic positioning of forehand grip, backhand grip, and neutral grip',
              k_grip.understand_level = 'Explain why proper grip matters for control and power. Describe the differences between forehand and backhand grips',
              k_grip.apply_level = 'Maintain proper grip throughout a casual game without conscious adjustment',
              k_grip.analyze_level = 'Identify grip errors in your own technique through video review or coach feedback. Break down grip adjustments needed for different shot types',
              k_grip.evaluate_level = 'Judge whether grip changes are necessary for specific shot requirements. Compare pros and cons of different grip variations',
              k_grip.create_level = 'Develop personalized grip adjustments that work for your hand size and playing style. Teach grip fundamentals to beginners';

MERGE (k_stance:Knowledge {name: 'Badminton Stance and Footwork'})
ON CREATE SET k_stance.description = 'Proper standing position and foot movement patterns for badminton. Includes ready stance, split step, court positioning, and movement efficiency to the net and baseline.',
              k_stance.how_to_learn = 'Drill footwork patterns: ready position, forward movement, backward movement, side-to-side movement. Practice shadow badminton (moving without hitting). Play games emphasizing footwork over shot quality. Expected time: 2-3 weeks for basic competency.',
              k_stance.remember_level = 'Recall the basic ready stance position and fundamental footwork directions: forward, backward, left, right',
              k_stance.understand_level = 'Explain why proper stance improves balance and movement. Describe the advantages of the split step in court positioning',
              k_stance.apply_level = 'Move to the shuttle efficiently while maintaining balanced ready position throughout a friendly game',
              k_stance.analyze_level = 'Identify inefficient movement patterns in your footwork. Analyze how stance affects shot execution and recovery to ready position',
              k_stance.evaluate_level = 'Judge when to use different footwork patterns. Compare efficiency of straight-line movement versus angled movement',
              k_stance.create_level = 'Design footwork drills specific to your court positioning needs. Create training routines to improve movement speed and balance';

MERGE (k_serve:Knowledge {name: 'Badminton Serve Technique'})
ON CREATE SET k_serve.description = 'The fundamental serving techniques in badminton, including underhand serve, backhand serve, and basic serve placement. The serve initiates each rally and sets the tone for play.',
              k_serve.how_to_learn = 'Practice serving 100+ times per day focusing on consistency. Learn from instructional videos or coach feedback. Practice serves in casual play to understand court positioning. Expected time: 3-4 weeks for reliable service.',
              k_serve.remember_level = 'Recall the basic underhand serve motion and legal serve rules (racquet head below wrist, hit below waist)',
              k_serve.understand_level = 'Explain the difference between underhand and backhand serves. Describe how serve angle affects opponent positioning',
              k_serve.apply_level = 'Execute consistent underhand serves that land in the service box during casual play',
              k_serve.analyze_level = 'Analyze how different serve placements affect opponent movement. Break down serve technique to identify mechanical errors',
              k_serve.evaluate_level = 'Judge the effectiveness of serve placement in different match situations. Compare accuracy versus variety in serve strategy',
              k_serve.create_level = 'Develop a personalized serve routine with multiple placements. Create serve practice drills for specific match situations';

MERGE (k_clear:Knowledge {name: 'Badminton Clears'})
ON CREATE SET k_clear.description = 'The fundamental clearing stroke that hits the shuttlecock deep to the opponent\'s baseline. Clears are essential defensive shots that keep opponents at distance and establish court control.',
              k_clear.how_to_learn = 'Practice clears from mid-court, baseline, and all court positions. Drill forehand and backhand clears separately. Practice clearing shuttles hit to you during rallies. Expected time: 3-4 weeks for basic proficiency.',
              k_clear.remember_level = 'Recall the basic clear motion: strike the shuttle above head height with upward swing motion',
              k_clear.understand_level = 'Explain the difference between attacking clears and defensive clears. Describe how footwork connects to clear execution',
              k_clear.apply_level = 'Hit consistent clears from most court positions during casual matches',
              k_clear.analyze_level = 'Analyze why clears fail (net, too short, side-to-side placement). Break down the clear motion to identify technique issues',
              k_clear.evaluate_level = 'Judge when to use attacking versus defensive clears in different game situations',
              k_clear.create_level = 'Develop clear placement strategies for specific opponents. Create drill progressions to improve clear accuracy';

MERGE (k_drop:Knowledge {name: 'Badminton Drop Shots'})
ON CREATE SET k_drop.description = 'The drop shot that gently hits the shuttlecock just over the net in the opponent\'s forecourt. Drops create court space and set up winning shots by forcing opponents forward.',
              k_drop.how_to_learn = 'Practice drop shots from various court positions. Start close to the net and work backward. Play rallies emphasizing drop placement. Expected time: 3-4 weeks for basic consistency.',
              k_drop.remember_level = 'Recall the basic drop shot motion: short swing with controlled racquet head speed',
              k_drop.understand_level = 'Explain how drops differ from clears. Describe the tactical purpose of forcing opponents to the net',
              k_drop.apply_level = 'Hit drops that land in the front third of the opponent\'s court during casual play',
              k_drop.analyze_level = 'Analyze drop placement effectiveness. Break down drop technique to identify control issues',
              k_drop.evaluate_level = 'Judge when drops are the best tactical choice versus other shot options',
              k_drop.create_level = 'Develop drop placement variations (crosscourt, straight, tight to net). Create tactical drop sequences';

MERGE (k_rules:Knowledge {name: 'Badminton Rules and Scoring'})
ON CREATE SET k_rules.description = 'The basic rules of badminton including scoring system, court boundaries, serving rules, fault rules, and match formats. Understanding rules prevents errors and enables fair play.',
              k_rules.how_to_learn = 'Read official badminton rules from badminton federation. Watch matches and identify rule applications. Play matches with rule enforcement. Expected time: 1-2 hours of study plus game experience.',
              k_rules.remember_level = 'Recall basic scoring (rally scoring, winning points), legal serve position, court boundaries, and common faults',
              k_rules.understand_level = 'Explain the logic behind rules (why certain actions are faults, how scoring promotes good play)',
              k_rules.apply_level = 'Play matches without rule violations. Know when to accept or dispute calls',
              k_rules.analyze_level = 'Analyze complex rule situations and determine correct rulings',
              k_rules.evaluate_level = 'Assess whether specific rule variations benefit different player types',
              k_rules.create_level = 'Design rule variations for specific training scenarios. Create teaching materials about rules';

// Core Knowledge (Developing/Competent levels)

MERGE (k_net_play:Knowledge {name: 'Badminton Net Play'})
ON CREATE SET k_net_play.description = 'Techniques for hitting the shuttlecock near the net, including net shots, net kills, and tight net control. Net play is crucial for winning rallies through tight, controlled shots.',
              k_net_play.how_to_learn = 'Practice net shots from 1-2 feet from the net. Learn net lifts, net drops, and net kills. Play drills focusing on net exchanges. Practice tight shuttle control. Expected time: 4-5 weeks.',
              k_net_play.remember_level = 'Recall net shot types: net lift, net drop, net kill and basic positioning near the net',
              k_net_play.understand_level = 'Explain the tactical purpose of each net shot type. Describe how tight net control creates winning opportunities',
              k_net_play.apply_level = 'Execute basic net shots during matches with reasonable consistency and control',
              k_net_play.analyze_level = 'Analyze net rally sequences to identify winning and losing patterns. Break down net technique to improve control',
              k_net_play.evaluate_level = 'Judge when to attack at the net versus retreat to baseline in tight exchanges',
              k_net_play.create_level = 'Develop advanced net sequences combining multiple shot types. Create net drill variations';

MERGE (k_smash:Knowledge {name: 'Badminton Smash and Attacking Shots'})
ON CREATE SET k_smash.description = 'Offensive shots designed to finish rallies, including the smash, attacking clear, and attacking drop. Smashes are high-velocity shots hit downward that force opponents into defensive positions or end rallies.',
              k_smash.how_to_learn = 'Practice smashes from mid-court with high shuttles. Start with underhand feeds from a partner. Progress to game situations with high returns. Expected time: 4-6 weeks for basic proficiency.',
              k_smash.remember_level = 'Recall smash technique: high backswing, rapid forward swing, striking shuttle at or above head height with downward angle',
              k_smash.understand_level = 'Explain why smashes are effective finishing shots. Describe positioning needed for maximum smash power',
              k_smash.apply_level = 'Execute smashes with decent power from mid-court during matches, though consistency varies',
              k_smash.analyze_level = 'Analyze smash errors (net, out, weak returns). Break down smash mechanics to identify power and control issues',
              k_smash.evaluate_level = 'Judge when to attempt smashes versus safer shots. Compare risk and reward of aggressive versus conservative smashing',
              k_smash.create_level = 'Develop smash targeting strategies. Create drill progressions for smash power and accuracy';

MERGE (k_strategy_singles:Knowledge {name: 'Badminton Singles Strategy'})
ON CREATE SET k_strategy_singles.description = 'Strategic concepts specific to singles play, including court positioning, movement economy, shot selection, and patterns that work in one-on-one competition.',
              k_strategy_singles.how_to_learn = 'Analyze singles matches of skilled players. Practice singles-specific drills (movement, shot selection patterns). Play singles matches focusing on strategy over raw power. Expected time: 6-8 weeks.',
              k_strategy_singles.remember_level = 'Recall basic singles strategy: move opponent around court, create angles, use length variation (short and deep shots)',
              k_strategy_singles.understand_level = 'Explain how court positioning changes in singles versus doubles. Describe movement patterns that conserve energy',
              k_strategy_singles.apply_level = 'Apply basic singles strategies in matches (moving opponent, mixing shot length)',
              k_strategy_singles.analyze_level = 'Analyze singles rallies to identify winning strategies and opponent weaknesses. Break down point sequences to understand pattern flow',
              k_strategy_singles.evaluate_level = 'Judge when to commit to attacking versus defensive strategies based on match situation',
              k_strategy_singles.create_level = 'Develop personalized singles game plan. Create tactical adjustments for specific opponents';

MERGE (k_strategy_doubles:Knowledge {name: 'Badminton Doubles Strategy'})
ON CREATE SET k_strategy_doubles.description = 'Strategic concepts specific to doubles play, including partner positioning, court coverage, communication, and coordinated attacking patterns that leverage two players.',
              k_strategy_doubles.how_to_learn = 'Play doubles matches regularly with consistent partners. Study doubles strategies specific to partner skill levels. Practice positioning drills. Expected time: 6-8 weeks.',
              k_strategy_doubles.remember_level = 'Recall basic doubles formations: side-by-side, front-back positioning, and partner coverage areas',
              k_strategy_doubles.understand_level = 'Explain why different formations work in different situations. Describe how partner communication improves teamwork',
              k_strategy_doubles.apply_level = 'Apply basic doubles positioning during matches with generally good court coverage',
              k_strategy_doubles.analyze_level = 'Analyze doubles rallies to identify gaps in court coverage. Break down opponent positioning to exploit weaknesses',
              k_strategy_doubles.evaluate_level = 'Judge when to shift formations based on opponent strength and match situation',
              k_strategy_doubles.create_level = 'Develop advanced doubles tactics. Create partnership strategies with specific partners';

MERGE (k_court_awareness:Knowledge {name: 'Badminton Court Awareness'})
ON CREATE SET k_court_awareness.description = 'Understanding court dimensions, boundaries, positioning zones, and spatial relationships. Court awareness enables efficient movement and shot placement.',
              k_court_awareness.how_to_learn = 'Practice on a badminton court regularly. Study court dimensions and line positions. Practice shot placement to specific zones. Expected time: 2-3 weeks.',
              k_court_awareness.remember_level = 'Recall court dimensions (width, length), service boxes, boundary lines, and basic positioning zones',
              k_court_awareness.understand_level = 'Explain how court zones relate to offensive and defensive positioning. Describe how boundaries affect shot selection',
              k_court_awareness.apply_level = 'Make accurate boundary judgments during play. Position yourself efficiently within court zones',
              k_court_awareness.analyze_level = 'Analyze opponent positioning relative to court space. Break down movement inefficiencies due to poor court awareness',
              k_court_awareness.evaluate_level = 'Judge optimal positioning for different rally situations',
              k_court_awareness.create_level = 'Develop positioning drills targeting specific court zones. Create training systems for spatial awareness';

MERGE (k_shot_selection:Knowledge {name: 'Badminton Shot Selection'})
ON CREATE SET k_shot_selection.description = 'Strategic decision-making about which shot to play based on shuttle position, opponent location, rally context, and match situation. Good shot selection separates intermediate from advanced players.',
              k_shot_selection.how_to_learn = 'Play matches with emphasis on shot selection over power. Study annotated matches analyzing shot choices. Play matches with a coach providing feedback. Expected time: 8-10 weeks.',
              k_shot_selection.remember_level = 'Recall available shot options: clears, drops, drives, net shots, smashes and basic situations where each is used',
              k_shot_selection.understand_level = 'Explain why certain shots are better choices in different situations. Describe how opponent position affects shot selection',
              k_shot_selection.apply_level = 'Select appropriate shots in most rally situations, though occasional poor choices occur',
              k_shot_selection.analyze_level = 'Analyze rally sequences to evaluate shot selection quality. Identify better shot alternatives for missed opportunities',
              k_shot_selection.evaluate_level = 'Judge shot selection effectiveness in real-time and adjust strategy accordingly',
              k_shot_selection.create_level = 'Develop personalized shot selection patterns. Create decision trees for specific rally situations';

// Advanced Knowledge (Advanced level)

MERGE (k_movement_patterns:Knowledge {name: 'Badminton Movement Efficiency Patterns'})
ON CREATE SET k_movement_patterns.description = 'Advanced movement patterns that minimize unnecessary motion while maximizing court coverage and recovery speed. Includes specific footwork patterns for different court areas and shot types.',
              k_movement_patterns.how_to_learn = 'Work with a coach on movement efficiency. Video analysis of your movement versus elite players. Specialized footwork drills targeting efficiency. Expected time: 10-12 weeks.',
              k_movement_patterns.remember_level = 'Recall specific footwork patterns: lunge patterns, crossover steps, shuffle movements for lateral motion',
              k_movement_patterns.understand_level = 'Explain how specific movement patterns suit different positions and shot types. Describe biomechanical advantages of efficient movement',
              k_movement_patterns.apply_level = 'Execute efficient movement patterns consistently during competitive matches',
              k_movement_patterns.analyze_level = 'Video analysis of your movement to identify efficiency gaps. Compare your patterns to elite players',
              k_movement_patterns.evaluate_level = 'Judge which movement patterns work best for your body type and playing style. Assess efficiency improvements over time',
              k_movement_patterns.create_level = 'Design personalized movement efficiency programs. Create advanced footwork drill progressions';

MERGE (k_advanced_tactics:Knowledge {name: 'Badminton Advanced Match Tactics'})
ON CREATE SET k_advanced_tactics.description = 'High-level strategic concepts including game plans adapted to specific opponents, tactical patterns, momentum management, and pressure application during competitive matches.',
              k_advanced_tactics.how_to_learn = 'Analyze competitive matches of skilled players. Play against varied opponents. Work with a coach on tactical analysis. Expected time: 12-16 weeks.',
              k_advanced_tactics.remember_level = 'Recall tactical concepts: predictable patterns, variation, pressure tactics, momentum shifts',
              k_advanced_tactics.understand_level = 'Explain how different tactical approaches work against different opponent types. Describe momentum patterns in matches',
              k_advanced_tactics.apply_level = 'Apply multiple tactical approaches during competitive matches with reasonable success',
              k_advanced_tactics.analyze_level = 'Analyze competitive matches to identify tactical patterns and strategy evolution. Break down winning and losing tactics',
              k_advanced_tactics.evaluate_level = 'Judge tactical effectiveness in real-time and adjust game plan during matches',
              k_advanced_tactics.create_level = 'Develop advanced game plans for specific opponents. Create tactical training systems';

MERGE (k_pressure_management:Knowledge {name: 'Badminton Pressure and Mental Game'})
ON CREATE SET k_pressure_management.description = 'Mental and psychological aspects of competitive badminton including focus, confidence, pressure handling, emotional control, and maintaining concentration during critical moments.',
              k_pressure_management.how_to_learn = 'Play competitive matches regularly. Work with a sports psychologist or mental coach. Practice meditation and visualization. Expected time: 10-12 weeks.',
              k_pressure_management.remember_level = 'Recall mental game concepts: focus, confidence, emotional regulation, preshot routine',
              k_pressure_management.understand_level = 'Explain how mental factors affect match performance. Describe techniques for managing pressure',
              k_pressure_management.apply_level = 'Handle pressure reasonably well in competitive matches, though some fluctuation in focus occurs',
              k_pressure_management.analyze_level = 'Analyze your mental performance patterns in matches. Identify triggers for loss of focus',
              k_pressure_management.evaluate_level = 'Judge your mental readiness for competitive situations and identify areas for improvement',
              k_pressure_management.create_level = 'Develop personalized mental training programs. Create preshot routines and pressure-handling strategies';

MERGE (k_opponent_analysis:Knowledge {name: 'Badminton Opponent Analysis'})
ON CREATE SET k_opponent_analysis.description = 'Methods for analyzing opponent strengths, weaknesses, patterns, and tendencies. Understanding opponents enables targeted tactical adjustments and game planning.',
              k_opponent_analysis.how_to_learn = 'Watch matches of opponents before playing. Take notes on patterns during matches. Work with a coach on analysis skills. Expected time: 8-10 weeks.',
              k_opponent_analysis.remember_level = 'Recall observation techniques: identifying stroke preferences, movement patterns, weakness areas',
              k_opponent_analysis.understand_level = 'Explain how different weaknesses can be exploited tactically. Describe pattern recognition in opponent play',
              k_opponent_analysis.apply_level = 'Identify basic opponent patterns during matches and make tactical adjustments',
              k_opponent_analysis.analyze_level = 'Detailed analysis of opponent strengths, weaknesses, and patterns. Identify specific tactical exploitations',
              k_opponent_analysis.evaluate_level = 'Judge tactical adjustments and assess their effectiveness during matches',
              k_opponent_analysis.create_level = 'Develop detailed game plans against specific opponents. Create analysis frameworks for pattern identification';

// Specialized Knowledge (Master level)

MERGE (k_elite_technique:Knowledge {name: 'Badminton Elite Technical Excellence'})
ON CREATE SET k_elite_technique.description = 'Mastery of advanced technical variations, subtle technique refinements, and exceptional control at the highest levels. Includes unconventional shots and extreme adaptability.',
              k_elite_technique.how_to_learn = 'Work with elite-level coaches. Video analysis of your technique versus world-class players. Continuous refinement and experimentation. Expected time: 20+ weeks.',
              k_elite_technique.remember_level = 'Recall advanced technique variations and when each variation provides advantages',
              k_elite_technique.understand_level = 'Explain the biomechanics of elite-level technique. Describe how subtle variations affect shot outcomes',
              k_elite_technique.apply_level = 'Execute elite-level technical variations consistently and effectively',
              k_elite_technique.analyze_level = 'Analyze your technique against world-class standards. Identify micro-adjustments for improvement',
              k_elite_technique.evaluate_level = 'Continuously assess and refine your technical approach. Judge which variations work best in specific contexts',
              k_elite_technique.create_level = 'Develop unique technical approaches suited to your strengths. Create advanced technique progressions';

MERGE (k_competitive_excellence:Knowledge {name: 'Badminton Competitive Excellence'})
ON CREATE SET k_competitive_excellence.description = 'The highest level of competitive badminton knowledge including match management, psychological resilience, tactical innovation, and peak performance under pressure at elite levels.',
              k_competitive_excellence.how_to_learn = 'Compete regularly at high levels. Work with elite coaches and sports psychologists. Study matches of world champions. Expected time: 20+ weeks.',
              k_competitive_excellence.remember_level = 'Recall elite-level competitive concepts and match management principles',
              k_competitive_excellence.understand_level = 'Explain the psychological and tactical complexities of elite competition',
              k_competitive_excellence.apply_level = 'Perform at elite competitive levels with high consistency',
              k_competitive_excellence.analyze_level = 'Analyze your competitive performances at the highest level and identify improvement opportunities',
              k_competitive_excellence.evaluate_level = 'Continuously assess competitive readiness and make strategic adjustments for world-class performance',
              k_competitive_excellence.create_level = 'Innovate new competitive strategies and tactics at the elite level. Mentor other elite players';

MERGE (k_coaching_pedagogy:Knowledge {name: 'Badminton Coaching and Teaching'})
ON CREATE SET k_coaching_pedagogy.description = 'Knowledge of how to teach badminton effectively, including coaching methods, player development systems, communication techniques, and training program design for different skill levels.',
              k_coaching_pedagogy.how_to_learn = 'Complete badminton coaching certifications. Mentor players at various levels. Study coaching methodologies. Expected time: 12-16 weeks.',
              k_coaching_pedagogy.remember_level = 'Recall coaching principles: progressive overload, skill sequencing, feedback techniques, motivation strategies',
              k_coaching_pedagogy.understand_level = 'Explain how different coaching approaches work for different learning styles. Describe effective player development systems',
              k_coaching_pedagogy.apply_level = 'Coach players using appropriate methods for their skill level with reasonable effectiveness',
              k_coaching_pedagogy.analyze_level = 'Analyze player progress and identify coaching adjustments needed. Evaluate coaching method effectiveness',
              k_coaching_pedagogy.evaluate_level = 'Judge coaching effectiveness and make systematic improvements',
              k_coaching_pedagogy.create_level = 'Develop comprehensive training systems. Create coaching materials and player development programs';

MERGE (k_sport_science:Knowledge {name: 'Badminton Sport Science and Biomechanics'})
ON CREATE SET k_sport_science.description = 'Understanding of badminton from a scientific perspective including biomechanics of strokes, sports physiology, injury prevention, training science, and performance optimization.',
              k_sport_science.how_to_learn = 'Study sports biomechanics and physiology. Work with strength and conditioning coaches. Video analysis of technique. Research badminton-specific studies. Expected time: 16-20 weeks.',
              k_sport_science.remember_level = 'Recall biomechanical principles relevant to badminton strokes and movement',
              k_sport_science.understand_level = 'Explain how biomechanics affect shot effectiveness and injury prevention. Describe physiological demands of badminton',
              k_sport_science.apply_level = 'Apply biomechanical principles to improve technique and training efficiency',
              k_sport_science.analyze_level = 'Analyze movement biomechanics through video and other tools. Evaluate training methods from a scientific perspective',
              k_sport_science.evaluate_level = 'Judge training effectiveness using scientific principles and adapt programs accordingly',
              k_sport_science.create_level = 'Design training programs based on sport science principles. Contribute to badminton sports science knowledge';

MERGE (k_innovation:Knowledge {name: 'Badminton Innovation and Game Evolution'})
ON CREATE SET k_innovation.description = 'Forward-thinking knowledge about evolving badminton techniques, tactical innovations, equipment advancements, and the future direction of the sport.',
              k_innovation.how_to_learn = 'Study evolution of badminton techniques over time. Experiment with new approaches. Attend advanced coaching seminars. Expected time: 20+ weeks.',
              k_innovation.remember_level = 'Recall how badminton techniques and tactics have evolved historically',
              k_innovation.understand_level = 'Explain why certain innovations have been adopted and others rejected. Describe factors driving sport evolution',
              k_innovation.apply_level = 'Experiment with emerging techniques and tactical approaches',
              k_innovation.analyze_level = 'Analyze new techniques and tactics to assess potential impact on the sport',
              k_innovation.evaluate_level = 'Judge the value of innovations and predict adoption likelihood',
              k_innovation.create_level = 'Develop innovative techniques or tactics. Contribute to badminton sport evolution';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Skills (Novice level)

MERGE (s_grip_control:Skill {name: 'Badminton Grip Control'})
ON CREATE SET s_grip_control.description = 'The ability to maintain proper racquet grip throughout play, adjusting grip pressure appropriately and transitioning between forehand and backhand grips smoothly. Grip control is fundamental to shot execution, power generation, and injury prevention.',
              s_grip_control.how_to_develop = 'Practice holding the racquet daily with focus on maintaining proper grip during movement. Shadow badminton drills emphasizing grip consistency. Play casual games while maintaining awareness of grip. Record and review your grip during play. Expected progression: 2-4 weeks for basic competency.',
              s_grip_control.novice_level = 'Maintains grip only when actively thinking about it. Grip loosens or shifts during movement. Inconsistent between forehand and backhand. Progress by practicing grip maintenance during relaxed practice.',
              s_grip_control.advanced_beginner_level = 'Maintains consistent grip throughout casual play with occasional adjustments needed. Beginning to recognize grip inconsistencies during rallies. Can transition between grips with noticeable pauses.',
              s_grip_control.competent_level = 'Maintains proper grip consistently throughout matches. Transitions between forehand and backhand grips smoothly and naturally. Unconsciously adjusts grip pressure as needed.',
              s_grip_control.proficient_level = 'Grip control is automatic and requires no conscious attention. Maintains optimal grip pressure in all situations, adjusting intuitively for different shot types.',
              s_grip_control.expert_level = 'Mastery of grip control across all shots and situations. Grip pressure and position adapt fluidly to maximize power, control, and versatility. Can identify and correct grip issues in others.';

MERGE (s_basic_footwork:Skill {name: 'Badminton Basic Footwork'})
ON CREATE SET s_basic_footwork.description = 'The ability to move efficiently around the court to reach the shuttle, including ready position, split step, and basic directional movements (forward, backward, lateral). Good footwork enables quick court coverage and prepares for shot execution.',
              s_basic_footwork.how_to_develop = 'Practice footwork drills: ready position, split step from different positions, directional movements (forward-backward, side-to-side). Shadow badminton focusing on movement without hitting. Drill specific movement patterns 10-15 minutes daily. Expected progression: 3-4 weeks for basic competency.',
              s_basic_footwork.novice_level = 'Movement is cautious and deliberate. Takes multiple small steps to reach the shuttle. Ready position is inconsistent. To progress: Practice ready position and split step until they feel natural.',
              s_basic_footwork.advanced_beginner_level = 'Reaches most shuttles with reasonable efficiency. Beginning to use split step before opponent hits. Movement patterns becoming more natural, though some inefficiencies remain.',
              s_basic_footwork.competent_level = 'Moves efficiently to most court positions with good balance. Uses split step consistently to anticipate movement. Recovery to ready position is smooth and timely.',
              s_basic_footwork.proficient_level = 'Footwork is fluid and automatic, requiring minimal thought. Movement is maximally efficient with no wasted motion. Anticipates well and recovers to ideal court position consistently.',
              s_basic_footwork.expert_level = 'Movement is elegant and economical at the highest level. Positions self optimally for all shot types and court situations. Movement itself becomes a factor opponents must account for.';

MERGE (s_forehand_stroke:Skill {name: 'Badminton Forehand Stroke'})
ON CREATE SET s_forehand_stroke.description = 'The ability to execute a forehand stroke with proper technique, including grip, stance, backswing, forward swing, and follow-through. Forehand strokes form the basis for clears, drives, drops, and smashes.',
              s_forehand_stroke.how_to_develop = 'Practice basic forehand strokes with coach feedback or instructional videos. Drill forehand motion from all court positions (baseline, midcourt, net). Start with slow-motion practice, then increase speed gradually. Hit 50-100 forehand shots daily. Expected progression: 3-4 weeks for basic proficiency.',
              s_forehand_stroke.novice_level = 'Stroke motion is awkward and inconsistent. Lacks proper backswing. Ball contact is often late or off-center. To progress: Focus on consistent backswing and front-to-back motion without worrying about power.',
              s_forehand_stroke.advanced_beginner_level = 'Basic forehand motion is established with generally correct technique. Contact is more consistent. Power generation is beginning but still limited. Technique breaks down under pressure.',
              s_forehand_stroke.competent_level = 'Solid forehand technique with proper backswing, contact, and follow-through. Can hit forehand shots with reasonable power and control from most positions. Technique remains consistent under light pressure.',
              s_forehand_stroke.proficient_level = 'Forehand stroke is fluid and efficient with excellent technique. Natural power generation with minimal wasted motion. Stroke remains consistent even during intense rallies.',
              s_forehand_stroke.expert_level = 'Forehand technique is at elite level with perfect form. Power, control, and placement are all optimized. Can hit forehand shots with exceptional precision and versatility on every part of the court.';

MERGE (s_backhand_stroke:Skill {name: 'Badminton Backhand Stroke'})
ON CREATE SET s_backhand_stroke.description = 'The ability to execute a backhand stroke with proper technique, including grip, stance, backswing, forward swing, and follow-through. Backhand strokes are essential for volleys, drops, and defensive shots.',
              s_backhand_stroke.how_to_develop = 'Practice backhand motion separately from forehand. Start with basic drills close to net. Progress to backcourt backhand shots. Practice backhand grip transitions. Drill 30-50 backhand shots daily. Expected progression: 4-5 weeks for basic proficiency.',
              s_backhand_stroke.novice_level = 'Backhand motion is weak and inconsistent. Often reverts to forehand even for backhand shots. Poor weight transfer and limited backswing. To progress: Practice basic backhand motion until it feels more natural than converting to forehand.',
              s_backhand_stroke.advanced_beginner_level = 'Basic backhand technique is established. Can execute backhand shots though with less power than forehand. Technique sometimes breaks down under pressure.',
              s_backhand_stroke.competent_level = 'Reliable backhand technique with proper motion and contact. Backhand shots are consistent with reasonable power. Can hit defensive and attacking backhand shots with adequate effectiveness.',
              s_backhand_stroke.proficient_level = 'Backhand stroke is nearly as strong as forehand. Fluid technique with good power generation. Comfortable hitting backhand shots in all situations.',
              s_backhand_stroke.expert_level = 'Elite backhand technique equally strong as forehand. Exceptional control and power on backhand shots. Can execute any backhand shot variation with precision.';

MERGE (s_serve_basic:Skill {name: 'Badminton Basic Serve'})
ON CREATE SET s_serve_basic.description = 'The ability to execute a legal underhand serve with consistency, aiming for the service box and maintaining proper technique. The serve initiates every rally and sets the tone for play.',
              s_serve_basic.how_to_develop = 'Practice serves 50-100 times daily focusing on consistency over power. Study serve technique videos. Practice different placements (short, deep, wide). Play casual games emphasizing serve placement. Expected progression: 2-3 weeks for basic consistency.',
              s_serve_basic.novice_level = 'Serves often go into the net or beyond the service box. Technique is inconsistent and power is minimal. To progress: Focus on getting 80%+ of serves in the service box before working on placement.',
              s_serve_basic.advanced_beginner_level = 'Gets 70-80% of serves in the service box. Beginning to vary placement. Serve technique is becoming more consistent.',
              s_serve_basic.competent_level = 'Achieves 85%+ serve success rate with consistent technique. Can place serves with reasonable accuracy to different areas of the service box.',
              s_serve_basic.proficient_level = 'High serve success rate (95%+) with excellent consistency. Serves are accurate and can control court effectively with serve placement strategy.',
              s_serve_basic.expert_level = 'Serves are executed with near-perfect consistency at the highest level. Serve placement is precise and strategic, maximizing tactical advantage on every point.';

// Intermediate Skills (Developing/Competent levels)

MERGE (s_clear_execution:Skill {name: 'Badminton Clear Execution'})
ON CREATE SET s_clear_execution.description = 'The ability to hit consistent clears (shots to the baseline) from all court positions with proper depth control. Clears are fundamental defensive shots that maintain court control and push opponents backward.',
              s_clear_execution.how_to_develop = 'Practice clears from baseline (forehand and backhand), midcourt, and net. Start with easy feeds from a partner and progress to competitive situations. Drill clears focusing on depth and consistency. Play drills emphasizing clear placement. Expected progression: 4-6 weeks.',
              s_clear_execution.novice_level = 'Clears frequently go into the net or fall short of the baseline. Technique is inconsistent. To progress: Focus on hitting clears that consistently reach the opponent\'s baseline.',
              s_clear_execution.advanced_beginner_level = 'Gets 60-70% of clears to the baseline. Technique is more consistent though still has failures under pressure.',
              s_clear_execution.competent_level = 'Executes reliable clears from most court positions with 80%+ success rate. Can place clears with reasonable accuracy to different baseline areas.',
              s_clear_execution.proficient_level = 'Clear execution is smooth and reliable with excellent depth and placement consistency. Can hit attacking or defensive clears as situations require.',
              s_clear_execution.expert_level = 'Elite-level clear execution with near-perfect consistency. Depth control is precise, allowing optimal court positioning. Uses clears strategically as a weapon.';

MERGE (s_drop_execution:Skill {name: 'Badminton Drop Shot Execution'})
ON CREATE SET s_drop_execution.description = 'The ability to hit controlled drop shots that land near the net in the opponent\'s forecourt. Drops are attacking shots that force opponents forward and create opportunities for follow-up winners.',
              s_drop_execution.how_to_develop = 'Practice drop shots from various court positions (baseline, midcourt, net). Start with easy feeds emphasizing soft touch. Drill placement to different areas of the opponent\'s forecourt. Play in matches with focus on drop execution. Expected progression: 4-6 weeks.',
              s_drop_execution.novice_level = 'Drops often go into the net or land too deep. Touch and control are inconsistent. To progress: Practice soft touch shots, focusing on barely clearing the net.',
              s_drop_execution.advanced_beginner_level = 'Gets 60% of drops past the net and in the forecourt. Consistency is improving though pressure affects technique.',
              s_drop_execution.competent_level = 'Executes consistent drops with good placement in the forecourt. Drops land where intended 75%+ of the time. Can use drops tactically in matches.',
              s_drop_execution.proficient_level = 'Drop execution is reliable and precise with excellent net clearance and placement control. Can hit drops from any court position consistently.',
              s_drop_execution.expert_level = 'Elite drop execution with perfect touch and placement. Drops are tight to the net and land exactly where intended. Opponents struggle to attack tight drops.';

MERGE (s_net_shot_control:Skill {name: 'Badminton Net Shot Control'})
ON CREATE SET s_net_shot_control.description = 'The ability to hit controlled shots near the net including net lifts, net drops, and gentle net shots that keep the shuttle close to the net. Net control is crucial for winning tight exchanges.',
              s_net_shot_control.how_to_develop = 'Practice net shots from close to the net with a partner feeding shuttles. Drill net exchanges focusing on keeping the shuttle tight and low. Play net-focused drills where shuttles are fed to the net. Expected progression: 5-6 weeks.',
              s_net_shot_control.novice_level = 'Net shots often go into the net or too high over the net. Touch and control are very inconsistent. To progress: Practice extremely gentle net shots focusing on barely clearing the net.',
              s_net_shot_control.advanced_beginner_level = 'Getting some net shots over with reasonable placement. Consistency is still low. Can execute basic net lifts and drops.',
              s_net_shot_control.competent_level = 'Executes reliable net shots with good touch and placement. Can keep shuttles tight at the net during exchanges with reasonable consistency.',
              s_net_shot_control.proficient_level = 'Excellent net shot control with precise touch. Can execute tight net exchanges where the shuttle stays very low and close to the net.',
              s_net_shot_control.expert_level = 'Mastery of net shot control at the highest level. Can hit any net shot variation with perfect touch, keeping shuttles impossibly tight. Uses net control to win rallies.';

MERGE (s_drive_execution:Skill {name: 'Badminton Drive Execution'})
ON CREATE SET s_drive_execution.description = 'The ability to hit flat, fast drives at net height that force opponents into difficult positions. Drives are attacking shots that require quick reflex and placement precision.',
              s_drive_execution.how_to_develop = 'Practice drive technique focusing on horizontal swing at net height. Start with feeds from a partner and progress to competitive situations. Drill drives emphasizing speed and accuracy. Play rallies with drive practice focus. Expected progression: 5-7 weeks.',
              s_drive_execution.novice_level = 'Drives frequently go into the net or too high. Difficulty generating consistent speed. To progress: Focus on hitting flat drives consistently, even if not fast.',
              s_drive_execution.advanced_beginner_level = 'Getting 50-60% of drives in with reasonable speed. Placement is beginning to develop.',
              s_drive_execution.competent_level = 'Executes reliable drives with good speed and placement. Drives are effective at forcing opponent reactions.',
              s_drive_execution.proficient_level = 'Drive execution is smooth with excellent speed and placement. Can hit driving shots consistently in rallies.',
              s_drive_execution.expert_level = 'Elite drive execution with exceptional speed and placement precision. Uses drives as a primary attacking weapon.';

MERGE (s_smash_execution:Skill {name: 'Badminton Smash Execution'})
ON CREATE SET s_smash_execution.description = 'The ability to hit powerful smash shots on high shuttles to end rallies with winners. Smashes are the primary finishing shot when opponents hit high returns.',
              s_smash_execution.how_to_develop = 'Practice smash technique with easy feeds from a partner starting close to the net. Progress to hitting smashes from midcourt and baseline. Drill smashes emphasizing power and accuracy. Play matches focusing on smash placement. Expected progression: 6-8 weeks.',
              s_smash_execution.novice_level = 'Smashes frequently go into the net or out of bounds. Power generation is weak and inconsistent. To progress: Focus on hitting clean smashes without worrying about power.',
              s_smash_execution.advanced_beginner_level = 'Getting 50% of smashes in with improving power. Consistency is developing.',
              s_smash_execution.competent_level = 'Executes reliable smashes with decent power that are difficult to defend. Smashes are effective finishing shots from favorable positions.',
              s_smash_execution.proficient_level = 'Smash execution is reliable with excellent power and placement. Most smashes result in point wins.',
              s_smash_execution.expert_level = 'Elite smash execution with exceptional power and precision. Nearly all smashes are winners or force weak defensive responses.';

MERGE (s_court_positioning:Skill {name: 'Badminton Court Positioning'})
ON CREATE SET s_court_positioning.description = 'The ability to position oneself optimally on the court to cover most of the court effectively and prepare for likely next shots. Positioning reflects court awareness and anticipation.',
              s_court_positioning.how_to_develop = 'Study positioning principles for different rally situations. Analyze match video focusing on positioning patterns. Play matches with conscious focus on positioning decisions. Practice movement drills with emphasis on optimal positioning. Expected progression: 6-8 weeks.',
              s_court_positioning.novice_level = 'Positioning is often poor, leaving large court gaps undefended. Slow to adjust position based on shot type. To progress: Focus on general midcourt positioning and recovery after shots.',
              s_court_positioning.advanced_beginner_level = 'Positioning is generally reasonable but sometimes leaves openings undefended. Beginning to anticipate positioning adjustments.',
              s_court_positioning.competent_level = 'Positioning is consistently good with proper court coverage for most situations. Adjusts position appropriately after hitting shots.',
              s_court_positioning.proficient_level = 'Positioning is excellent with optimal court coverage for anticipated situations. Movements to optimal position are efficient.',
              s_court_positioning.expert_level = 'Elite positioning awareness with optimal court coverage in all situations. Positioning itself becomes a defensive and offensive advantage.';

MERGE (s_shot_timing:Skill {name: 'Badminton Shot Timing'})
ON CREATE SET s_shot_timing.description = 'The ability to strike the shuttle at the optimal point in its trajectory for maximum power and control. Proper timing enables consistent shot execution and power generation.',
              s_shot_timing.how_to_develop = 'Practice hitting shuttles from various trajectories focusing on contact point. Drill against different serve styles and return patterns. Play matches with focus on consistent timing. Video analyze contact points. Expected progression: 6-8 weeks.',
              s_shot_timing.novice_level = 'Contact points are inconsistent, often too early or late. Timing errors affect shot quality significantly. To progress: Focus on consistent contact point before worrying about power.',
              s_shot_timing.advanced_beginner_level = 'Contact point is more consistent though still has timing errors. Power generation is becoming more reliable.',
              s_shot_timing.competent_level = 'Timing is generally consistent with contact points that enable good power generation. Timing remains solid even during faster rallies.',
              s_shot_timing.proficient_level = 'Timing is reliable and consistent across all shot types. Contact points are optimal for the intended shot.',
              s_shot_timing.expert_level = 'Elite timing with perfect contact points in all situations. Timing adjusts automatically to different shuttle speeds and trajectories.';

// Advanced Skills (Advanced level)

MERGE (s_attacking_patterns:Skill {name: 'Badminton Attacking Patterns'})
ON CREATE SET s_attacking_patterns.description = 'The ability to execute coordinated attacking sequences that set up and finish points. Attacking patterns combine multiple shots strategically to force opponents into losing positions.',
              s_attacking_patterns.how_to_develop = 'Study attacking patterns in professional matches. Drill specific patterns with a partner (clear-smash, drop-lift-smash, etc.). Practice executing patterns in drills before using in matches. Work with a coach on pattern development. Expected progression: 10-12 weeks.',
              s_attacking_patterns.novice_level = 'Attacking sequences are basic and predictable. To progress: Learn standard attacking patterns (attack when opponent hits high, combine drop and smash).',
              s_attacking_patterns.advanced_beginner_level = 'Can execute basic attacking patterns with moderate success. Patterns are somewhat predictable.',
              s_attacking_patterns.competent_level = 'Executes coordinated attacking sequences effectively. Multiple patterns are available and used appropriately.',
              s_attacking_patterns.proficient_level = 'Attacking patterns flow naturally and are hard to defend. Can adjust patterns based on opponent responses.',
              s_attacking_patterns.expert_level = 'Mastery of complex attacking patterns executed with precision. Patterns adapt fluidly to opponent positioning and responses.';

MERGE (s_defensive_techniques:Skill {name: 'Badminton Defensive Techniques'})
ON CREATE SET s_defensive_techniques.description = 'The ability to defend against aggressive shots while recovering position and setting up counterattacks. Defensive skill includes block shots, lift technique, and recovery positioning.',
              s_defensive_techniques.how_to_develop = 'Practice defensive shots against attacking feeds. Drill defensive scenarios with a coach providing attacking shots. Play matches against stronger opponents to develop defensive skills. Video analyze professional defensive patterns. Expected progression: 8-10 weeks.',
              s_defensive_techniques.novice_level = 'Defensive shots are weak and easy to attack. Recovery positioning is poor. To progress: Focus on getting the shuttle back over the net and regaining court position.',
              s_defensive_techniques.advanced_beginner_level = 'Can execute basic defensive shots with moderate effectiveness. Recovery is improving.',
              s_defensive_techniques.competent_level = 'Executes reliable defensive shots that keep rallies alive. Can recover to reasonable court position after defensive shots.',
              s_defensive_techniques.proficient_level = 'Defensive shots are reliable and force opponents to extend their attacks. Recovery and repositioning are quick.',
              s_defensive_techniques.expert_level = 'Elite defensive skill with strong defensive shots that neutralize attacks. Uses defense to set up counterattacks and wins.';

MERGE (s_singles_court_control:Skill {name: 'Badminton Singles Court Control'})
ON CREATE SET s_singles_court_control.description = 'The ability to control the singles court by moving the opponent and gaining advantageous court positions. Singles control requires efficient movement and tactical shot selection.',
              s_singles_court_control.how_to_develop = 'Play singles matches focusing on moving opponents side-to-side. Analyze singles strategies from professional matches. Practice movement-specific drills. Play against varied opponents. Work with a coach on singles tactics. Expected progression: 10-12 weeks.',
              s_singles_court_control.novice_level = 'Struggles to move opponent effectively. Often gets pulled out of position. To progress: Focus on hitting shots to different court areas.',
              s_singles_court_control.advanced_beginner_level = 'Beginning to move opponent effectively. Sometimes gains court advantage.',
              s_singles_court_control.competent_level = 'Moves opponent consistently and gains good court positions. Controls rallies with multiple shot types.',
              s_singles_court_control.proficient_level = 'Excellent court control with consistent opponent movement and positioning advantage.',
              s_singles_court_control.expert_level = 'Mastery of singles court control. Moves opponents with precision and dominates court positioning.';

MERGE (s_doubles_positioning:Skill {name: 'Badminton Doubles Positioning'})
ON CREATE SET s_doubles_positioning.description = 'The ability to position oneself optimally with a partner to cover the doubles court and transition between formations. Doubles positioning requires coordination and court awareness.',
              s_doubles_positioning.how_to_develop = 'Play doubles matches focusing on positioning principles. Study doubles formations with coaches. Practice positioning drills with a partner. Analyze professional doubles matches. Expected progression: 8-10 weeks.',
              s_doubles_positioning.novice_level = 'Positioning leaves gaps in court coverage. Little awareness of partner positioning. To progress: Learn basic formations and focus on court coverage.',
              s_doubles_positioning.advanced_beginner_level = 'Basic positioning is established with improving court coverage.',
              s_doubles_positioning.competent_level = 'Maintains good court coverage with appropriate formations. Transitions between formations with reasonable smoothness.',
              s_doubles_positioning.proficient_level = 'Excellent positioning with minimal court gaps. Smooth formation transitions.',
              s_doubles_positioning.expert_level = 'Elite doubles positioning with perfect court coverage and seamless formation transitions.';

MERGE (s_opponent_adaptation:Skill {name: 'Badminton Opponent Adaptation'})
ON CREATE SET s_opponent_adaptation.description = 'The ability to recognize opponent patterns and tendencies and adjust tactical approach to exploit weaknesses. Adaptation separates good players from great ones.',
              s_opponent_adaptation.how_to_develop = 'Play against many different opponents. Watch video of opponents before matches. Keep notes on opponent patterns. Play practice matches with adjustment focus. Work with a coach on adaptation strategies. Expected progression: 12-14 weeks.',
              s_opponent_adaptation.novice_level = 'Plays same style regardless of opponent. Struggles to recognize patterns. To progress: Actively watch for opponent tendencies and adjust slightly.',
              s_opponent_adaptation.advanced_beginner_level = 'Recognizes some opponent patterns. Makes basic tactical adjustments.',
              s_opponent_adaptation.competent_level = 'Adapts tactics appropriately to different opponents. Recognizes and adjusts to playing style changes mid-match.',
              s_opponent_adaptation.proficient_level = 'Excellent adaptation with quick recognition of opponent patterns and effective tactical adjustments.',
              s_opponent_adaptation.expert_level = 'Masters rapid adaptation, instantly recognizing patterns and making precise tactical adjustments that exploit opponent weaknesses.';

// Expert Skills (Master level)

MERGE (s_pressure_performance:Skill {name: 'Badminton Pressure Performance'})
ON CREATE SET s_pressure_performance.description = 'The ability to maintain high performance and execute effectively under match pressure, especially in critical moments. Pressure management determines success in competitive situations.',
              s_pressure_performance.how_to_develop = 'Compete regularly in tournaments. Practice mental skills including visualization and focus techniques. Play high-stakes practice matches. Work with a sports psychologist on pressure management. Expected progression: 12-16 weeks.',
              s_pressure_performance.novice_level = 'Performance deteriorates significantly under pressure. Mental errors are frequent. To progress: Build experience in pressurized situations.',
              s_pressure_performance.advanced_beginner_level = 'Shows some ability to handle pressure but consistency varies.',
              s_pressure_performance.competent_level = 'Maintains reasonable performance under moderate pressure. Some mental errors in critical moments.',
              s_pressure_performance.proficient_level = 'Performs well under pressure with strong mental resilience. Critical points are executed effectively.',
              s_pressure_performance.expert_level = 'Elite pressure performance with exceptional mental strength. Excels in critical moments and high-stakes situations.';

MERGE (s_tactical_mastery:Skill {name: 'Badminton Tactical Mastery'})
ON CREATE SET s_tactical_mastery.description = 'The ability to execute complex tactical strategies including game plans, momentum control, and psychological tactics. Tactical mastery enables dominance of competitive play.',
              s_tactical_mastery.how_to_develop = 'Study and analyze competitive matches of elite players. Develop game plans against specific opponents. Compete in regular tournaments. Work with elite coaches on tactics. Expected progression: 14-18 weeks.',
              s_tactical_mastery.novice_level = 'Limited tactical awareness. Plays reactively without strategy. To progress: Develop basic game plans.',
              s_tactical_mastery.advanced_beginner_level = 'Attempts basic tactical approaches with inconsistent execution.',
              s_tactical_mastery.competent_level = 'Executes basic game plans effectively. Makes reasonable tactical decisions.',
              s_tactical_mastery.proficient_level = 'Complex tactical strategies are executed smoothly and effectively.',
              s_tactical_mastery.expert_level = 'Mastery of advanced badminton tactics executed flawlessly. Tactical approaches adapt to situations and opponents dynamically.';

MERGE (s_elite_consistency:Skill {name: 'Badminton Elite Consistency'})
ON CREATE SET s_elite_consistency.description = 'The ability to execute all shots and strategies with near-perfect consistency match after match. Elite consistency is the foundation of world-class competitive performance.',
              s_elite_consistency.how_to_develop = 'Maintain high-volume practice with focus on consistency. Compete regularly in competitive tournaments. Work with elite coaches on execution refinement. Expected progression: 16-20+ weeks.',
              s_elite_consistency.novice_level = 'Performance is inconsistent with wide variation in shot quality. To progress: Build consistency through repetition.',
              s_elite_consistency.advanced_beginner_level = 'Consistency is improving with better match-to-match performance.',
              s_elite_consistency.competent_level = 'Solid consistency with generally reliable performance.',
              s_elite_consistency.proficient_level = 'High consistency with reliable shot execution and strategy implementation.',
              s_elite_consistency.expert_level = 'Exceptional consistency across all situations with near-perfect execution. Performance remains elite even in difficult matches.';

MERGE (s_innovation_creativity:Skill {name: 'Badminton Innovation and Creativity'})
ON CREATE SET s_innovation_creativity.description = 'The ability to develop new techniques, shots, and tactical approaches that go beyond conventional play. Innovation drives sport evolution and provides competitive advantage.',
              s_innovation_creativity.how_to_develop = 'Experiment with unconventional shots and approaches. Study how elite players innovate. Take risks in practice matches. Analyze limitations of current approaches. Expected progression: 16-20+ weeks.',
              s_innovation_creativity.novice_level = 'Plays strictly conventional shots. Limited experimentation. To progress: Experiment with shot variations.',
              s_innovation_creativity.advanced_beginner_level = 'Attempts some unconventional shots with limited success.',
              s_innovation_creativity.competent_level = 'Occasionally uses innovative shots or approaches with moderate success.',
              s_innovation_creativity.proficient_level = 'Regularly develops and employs innovative techniques effectively.',
              s_innovation_creativity.expert_level = 'Mastery of innovation developing unique shots and approaches. Contributes to sport evolution with novel technical and tactical advances.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

MERGE (t_hand_eye_coordination:Trait {name: 'Hand-Eye Coordination'})
ON CREATE SET t_hand_eye_coordination.description = 'The ability to synchronize hand movements with visual tracking of the shuttlecock, enabling precise racquet contact and shot control. Hand-eye coordination is fundamental to consistent shot execution in badminton.',
              t_hand_eye_coordination.measurement_criteria = 'Assessed through timing accuracy, shot consistency, and contact point precision. Low (0-25): Frequent mistimed shots and off-center racquet contact. Moderate (26-50): Generally adequate contact with occasional timing errors. High (51-75): Consistent timing with precise contact points on most shots. Exceptional (76-100): Perfect timing and contact point accuracy across all shot types and speeds.';

MERGE (t_agility:Trait {name: 'Agility'})
ON CREATE SET t_agility.description = 'The ability to change direction quickly and move fluidly around the court with balance and control. Agility enables rapid responses to opponent shots and efficient court coverage.',
              t_agility.measurement_criteria = 'Assessed through movement speed, directional changes, and recovery balance. Low (0-25): Slow directional changes, difficulty moving quickly. Moderate (26-50): Reasonable movement speed with some balance issues during rapid changes. High (51-75): Quick directional changes with good balance maintained. Exceptional (76-100): Exceptional agility with lightning-quick directional changes and perfect balance.';

MERGE (t_reaction_time:Trait {name: 'Reaction Time'})
ON CREATE SET t_reaction_time.description = 'The speed at which a player can process visual information and initiate movement response. Quick reaction time enables effective defense and allows players to take shuttles early in their trajectory.',
              t_reaction_time.measurement_criteria = 'Assessed through responsiveness to unexpected shots and time to initiate movement. Low (0-25): Noticeably slow responses, often late to reach shuttles. Moderate (26-50): Average reaction speed, reaches most shuttles with adequate time. High (51-75): Quick reaction time, frequently takes shuttles early in trajectory. Exceptional (76-100): Exceptional reaction speed, consistently anticipates and reaches shuttles at optimal times.';

MERGE (t_strategic_thinking:Trait {name: 'Strategic Thinking'})
ON CREATE SET t_strategic_thinking.description = 'The cognitive ability to analyze court situations, predict opponent responses, and plan sequences of shots. Strategic thinking enables effective tactical decision-making and game planning.',
              t_strategic_thinking.measurement_criteria = 'Assessed through tactical awareness, decision quality, and pattern recognition in matches. Low (0-25): Limited tactical awareness, plays reactively without planning. Moderate (26-50): Basic strategic awareness with occasional tactical insights. High (51-75): Good strategic understanding with solid tactical decisions. Exceptional (76-100): Exceptional strategic insight with intuitive understanding of game flow and precise tactical execution.';

MERGE (t_competitive_drive:Trait {name: 'Competitive Drive'})
ON CREATE SET t_competitive_drive.description = 'The intrinsic motivation and mental intensity to compete at high levels, maintain focus during matches, and push through challenging situations. Competitive drive determines resilience and willingness to engage in demanding competition.',
              t_competitive_drive.measurement_criteria = 'Assessed through effort intensity, persistence, and motivation in competitive situations. Low (0-25): Limited competitive motivation, minimal intensity in matches. Moderate (26-50): Reasonable competitive motivation with consistent effort. High (51-75): Strong competitive drive with high intensity during matches. Exceptional (76-100): Exceptional competitive intensity with relentless determination and maximum effort in all competitive situations.';

MERGE (t_body_control:Trait {name: 'Body Control'})
ON CREATE SET t_body_control.description = 'The ability to maintain balance, coordinate body movements, and generate power efficiently through proper body mechanics. Body control enables stability during shots and quick recovery movements.',
              t_body_control.measurement_criteria = 'Assessed through balance during movement, stability during shot execution, and power generation efficiency. Low (0-25): Poor balance and stability, frequently loses positioning. Moderate (26-50): Adequate balance with occasional instability during rapid movements. High (51-75): Good body control with consistent stability and efficient mechanics. Exceptional (76-100): Excellent body control with perfect balance in all situations and optimal biomechanical efficiency.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones (1-2 milestones)

MERGE (m_first_rally:Milestone {name: 'Complete First Badminton Rally'})
ON CREATE SET m_first_rally.description = 'Successfully complete a rally of at least 3 consecutive shot exchanges without the shuttlecock going into the net or out of bounds. This foundational milestone marks the beginning of understanding basic shot-making.',
              m_first_rally.how_to_achieve = 'Start with a partner in a friendly, low-pressure environment. Practice basic underhand clears and hits from mid-court where it\'s easier to maintain rallies. Focus on consistency over power. Have your partner feed easy shuttles. Most beginners achieve this within their first 2-3 practice sessions. Celebrate when you successfully hit 3+ exchanges in a row.';

MERGE (m_first_court_game:Milestone {name: 'Play First Complete Badminton Game'})
ON CREATE SET m_first_court_game.description = 'Complete an entire friendly badminton game (casual, no score emphasis) where you participate in singles or doubles play without stopping. This milestone demonstrates basic understanding of rules and sustained play.',
              m_first_court_game.how_to_achieve = 'Find a beginner-friendly player or group and organize a casual friendly game. Don\'t worry about winning - focus on completing the game and learning how rallies flow. Expect to spend 15-30 minutes playing. Understand basic scoring enough to keep game moving. Most beginners reach this within their first week of playing.';

// Developing Level Milestones (2-3 milestones)

MERGE (m_serve_consistency:Milestone {name: 'Achieve 80% Serve Accuracy'})
ON CREATE SET m_serve_consistency.description = 'Consistently get 80% of your serves into the legal service box during practice or casual matches. Serve accuracy is critical for starting rallies and controlling the game tempo.',
              m_serve_consistency.how_to_achieve = 'Practice serves for 15-20 minutes daily. Hit 50-100 serves per session focusing on consistency. Place court lines or cones to mark the service boxes for visual reference. Start close to the net if needed and gradually move back. Track your successful serves to count percentage. This typically takes 2-4 weeks of consistent daily practice to achieve.';

MERGE (m_first_win:Milestone {name: 'Win First Friendly Match'})
ON CREATE SET m_first_win.description = 'Win a complete badminton match (scoring to 21 or full game) against another player in a casual, friendly environment. This milestone demonstrates basic competitive competency.',
              m_first_win.how_to_achieve = 'Play matches against opponents at or slightly below your skill level. Focus on consistency and forcing errors rather than hitting winners. Play multiple matches to increase chances of winning. Stay relaxed and enjoy the game. Don\'t put pressure on yourself - approaching it casually helps. Expected timeframe: 4-8 weeks of regular play.';

MERGE (m_court_familiarity:Milestone {name: 'Complete 5 Full Practice Sessions'})
ON CREATE SET m_court_familiarity.description = 'Complete 5 consecutive full practice sessions at a badminton facility or court. This demonstrates commitment and growing familiarity with the sport and your local playing environment.',
              m_court_familiarity.how_to_achieve = 'Schedule regular practice sessions (1-2 hours each) at a badminton court or facility. Attend 5 sessions, whether solo drills, group lessons, or casual play. Use these sessions to build consistency and comfort on the court. Expected timeframe: 2-4 weeks depending on practice frequency.';

// Competent Level Milestones (2-4 milestones)

MERGE (m_rally_length:Milestone {name: 'Play 10+ Shot Rally'})
ON CREATE SET m_rally_length.description = 'Successfully maintain a rally of 10 or more consecutive shots during match play without the shuttlecock going out or into the net. This shows developing stroke consistency and court awareness.',
              m_rally_length.how_to_achieve = 'During regular matches or practice, focus on keeping the shuttle in play by hitting reliable clears and drops. Avoid overly aggressive shots when trying to extend rallies. Play against consistent opponents who also try to extend rallies. This typically happens naturally after 4-6 weeks of regular play as stroke consistency improves.';

MERGE (m_court_positions:Milestone {name: 'Master Positioning in All Court Zones'})
ON CREATE SET m_court_positions.description = 'Consistently position yourself appropriately when playing from net, mid-court, and baseline areas. Understand different positioning strategies for each zone and execute them during matches.',
              m_court_positions.how_to_achieve = 'Study court positioning principles through video tutorials or coaching. During matches, consciously think about your positioning after each shot. Practice drills that emphasize movement between zones. Watch professional matches and note player positioning patterns. Record yourself playing and review positioning choices. Expected timeframe: 6-10 weeks.';

MERGE (m_shot_variety:Milestone {name: 'Consistently Execute Four Different Shot Types'})
ON CREATE SET m_shot_variety.description = 'Successfully execute clears, drops, serves, and net shots with consistency during match play. Shot variety enables varied tactics and prevents predictable play.',
              m_shot_variety.how_to_achieve = 'Practice each shot type in isolation (clears for 10 minutes, drops for 10 minutes, etc.). Then practice drills that require mixing shot types. During matches, deliberately attempt different shots. Keep a mental tally of which shots you succeeded with. Expected timeframe: 6-10 weeks of deliberate practice.';

MERGE (m_match_record:Milestone {name: 'Win 5 Casual Matches'})
ON CREATE SET m_match_record.description = 'Accumulate 5 wins in casual badminton matches against various opponents. This demonstrates consistent performance and competitive competency.',
              m_match_record.how_to_achieve = 'Play regular friendly matches with different opponents at your skill level or slightly below. Focus on consistency rather than spectacular shots. As you win matches, keep track of your wins. Winning 5 casual matches typically takes 4-8 weeks with 2-3 matches per week.';

// Advanced Level Milestones (2-4 milestones)

MERGE (m_tournament_participation:Milestone {name: 'Participate in Badminton Tournament'})
ON CREATE SET m_tournament_participation.description = 'Compete in an organized badminton tournament (local club tournament or small competition). This demonstrates willingness to compete at a higher level.',
              m_tournament_participation.how_to_achieve = 'Research local badminton tournaments or club competitions in your area. Register for a tournament appropriate to your skill level (beginners division if available). Show up prepared with proper equipment. Play your best in all matches, knowing the tournament format. Many areas have local tournaments monthly. Expected timeframe: 8-12 weeks to reach competitive readiness.';

MERGE (m_singles_doubles_proficiency:Milestone {name: 'Demonstrate Proficiency in Both Singles and Doubles'})
ON CREATE SET m_singles_doubles_proficiency.description = 'Show solid competitive performance in both singles and doubles formats. Understand different strategies and positioning requirements for each format.',
              m_singles_doubles_proficiency.how_to_achieve = 'Regularly play both singles and doubles matches. Study format-specific strategies through videos or coaching. In singles matches, practice moving opponents and court positioning. In doubles, focus on partner coordination and formation positioning. Play 4-5 matches in each format to develop proficiency. Expected timeframe: 10-14 weeks.';

MERGE (m_competitive_rating:Milestone {name: 'Achieve Competitive Player Rating'})
ON CREATE SET m_competitive_rating.description = 'Achieve an official or organization-recognized badminton rating or ranking, demonstrating competitive participation and documented performance level.',
              m_competitive_rating.how_to_achieve = 'Participate in tournaments or league play where ratings are tracked (badminton associations, clubs with rating systems, online platforms). Play multiple rated matches. Build up points or ratings through consistent tournament or league participation. Most badminton organizations have rating systems based on match results. Expected timeframe: 12-16 weeks of tournament participation.';

MERGE (m_opponent_adjustment:Milestone {name: 'Successfully Adjust Tactics Against Different Opponent Styles'})
ON CREATE SET m_opponent_adjustment.description = 'Demonstrate ability to recognize and adjust tactics against at least 3 different opponent playing styles. Shows tactical understanding and flexibility.',
              m_opponent_adjustment.how_to_achieve = 'Identify different opponent styles: aggressive, defensive, baseline-focused, net-focused, etc. In separate matches against each style, consciously adjust your play. Against aggressive players, be patient and counter-attack. Against defensive players, take initiative early. Record what adjustments worked. This develops naturally over 8-12 weeks of playing varied opponents.';

// Master Level Milestones (2-5 milestones)

MERGE (m_tournament_win:Milestone {name: 'Win Tournament or Significant Competition'})
ON CREATE SET m_tournament_win.description = 'Win an organized badminton tournament, division, or major competition bracket. This demonstrates elite-level competitive performance.',
              m_tournament_win.how_to_achieve = 'Build tournament experience through regular participation. Develop strong consistency and mental resilience. Train rigorously before tournaments. Study opponents\' play when possible. Focus on executing your game plan rather than playing reactively. Expect to participate in 10+ tournaments before winning one. Expected timeframe: 16-24 weeks or more depending on competition level.';

MERGE (m_elite_rating:Milestone {name: 'Achieve Elite Badminton Rating'})
ON CREATE SET m_elite_rating.description = 'Achieve a high-level official badminton rating (top percentile in your region or federation). This demonstrates sustained elite-level competitive performance.',
              m_elite_rating.how_to_achieve = 'Play regularly in tournaments and league matches. Win consistently against quality opponents. Focus on continuous improvement even at advanced levels. Work with elite coaches. Participate in regional or national level competitions. Achieve consistent results at high percentile of official rankings. Expected timeframe: 20+ weeks of competitive play at tournament level.';

MERGE (m_coach_recognition:Milestone {name: 'Earn Recognition as Accomplished Player'})
ON CREATE SET m_coach_recognition.description = 'Receive formal recognition from coaches, tournament directors, or sports organizations as an accomplished, skilled badminton player. This demonstrates mastery and respect in the badminton community.',
              m_coach_recognition.how_to_achieve = 'Build reputation through tournament wins and consistent high-level performance. Mentor or help teach younger players. Demonstrate leadership in badminton community. Participate at elite competition levels. The recognition may come as invitations to play in select events, mentions in tournament announcements, or formal awards. Expected timeframe: 20+ weeks of elite-level activity.';

MERGE (m_mentor_player:Milestone {name: 'Successfully Mentor a Developing Badminton Player'})
ON CREATE SET m_mentor_player.description = 'Guide a developing player from beginner to competent level, demonstrating teaching ability and deep understanding of badminton fundamentals.',
              m_mentor_player.how_to_achieve = 'Find a beginner or intermediate player interested in learning. Meet regularly for structured sessions (1-2 times per week). Teach fundamentals: grip, footwork, basic shots. Provide feedback on their technique. Help them with tactical concepts. Guide them through their first matches. Successfully completing this when the mentee reaches competent level (able to win casual matches) represents success. Expected timeframe: 12-16 weeks of mentoring.';

MERGE (m_competitive_consistency:Milestone {name: 'Maintain Top Competition Rankings for Full Season'})
ON CREATE SET m_competitive_consistency.description = 'Maintain a top-level ranking or rating throughout a full competitive badminton season. This demonstrates exceptional consistency and sustained elite performance over extended period.',
              m_competitive_consistency.how_to_achieve = 'Compete in frequent tournaments throughout a full season. Maintain high win percentage consistently. Avoid major performance dips. Work with coaches to maintain peak performance throughout season. Compete at 8+ tournaments throughout a season, maintaining top ranking. Expected timeframe: 6 months of consistent tournament participation at elite level.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// Level 1 (Novice) Requirements
// ============================================================

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (k:Knowledge {name: 'Badminton Grip Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (k:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (k:Knowledge {name: 'Badminton Serve Technique'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (k:Knowledge {name: 'Badminton Clears'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (k:Knowledge {name: 'Badminton Rules and Scoring'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (s:Skill {name: 'Badminton Grip Control'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (s:Skill {name: 'Badminton Basic Footwork'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (s:Skill {name: 'Badminton Forehand Stroke'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (s:Skill {name: 'Badminton Basic Serve'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (t:Trait {name: 'Body Control'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Badminton Novice'})
MATCH (m:Milestone {name: 'Complete First Badminton Rally'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 2 (Developing) Requirements
// ============================================================

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Grip Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Serve Technique'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Clears'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Drop Shots'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Rules and Scoring'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (k:Knowledge {name: 'Badminton Court Awareness'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Grip Control'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Basic Footwork'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Forehand Stroke'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Backhand Stroke'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Basic Serve'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Clear Execution'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (s:Skill {name: 'Badminton Shot Timing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (t:Trait {name: 'Body Control'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (t:Trait {name: 'Agility'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (m:Milestone {name: 'Achieve 80% Serve Accuracy'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Badminton Developing'})
MATCH (m:Milestone {name: 'Play First Complete Badminton Game'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 3 (Competent) Requirements
// ============================================================

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Grip Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Serve Technique'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Clears'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Drop Shots'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Net Play'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Smash and Attacking Shots'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Singles Strategy'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Doubles Strategy'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Court Awareness'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (k:Knowledge {name: 'Badminton Shot Selection'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Grip Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Basic Footwork'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Forehand Stroke'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Backhand Stroke'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Basic Serve'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Clear Execution'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Net Shot Control'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Court Positioning'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (s:Skill {name: 'Badminton Shot Timing'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (t:Trait {name: 'Body Control'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (t:Trait {name: 'Agility'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (m:Milestone {name: 'Play 10+ Shot Rally'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (m:Milestone {name: 'Consistently Execute Four Different Shot Types'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Badminton Competent'})
MATCH (m:Milestone {name: 'Win 5 Casual Matches'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 4 (Advanced) Requirements
// ============================================================

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Grip Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Serve Technique'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Clears'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Drop Shots'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Net Play'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Smash and Attacking Shots'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Singles Strategy'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Doubles Strategy'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Court Awareness'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Shot Selection'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Movement Efficiency Patterns'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Advanced Match Tactics'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (k:Knowledge {name: 'Badminton Opponent Analysis'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Grip Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Basic Footwork'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Forehand Stroke'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Backhand Stroke'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Basic Serve'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Clear Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Net Shot Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Drive Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Smash Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Court Positioning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Shot Timing'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Attacking Patterns'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Defensive Techniques'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Singles Court Control'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Doubles Positioning'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (s:Skill {name: 'Badminton Opponent Adaptation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (t:Trait {name: 'Body Control'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (t:Trait {name: 'Agility'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (t:Trait {name: 'Strategic Thinking'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (m:Milestone {name: 'Participate in Badminton Tournament'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Badminton Advanced'})
MATCH (m:Milestone {name: 'Demonstrate Proficiency in Both Singles and Doubles'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Level 5 (Master) Requirements
// ============================================================

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Grip Fundamentals'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Serve Technique'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Clears'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Drop Shots'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Net Play'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Smash and Attacking Shots'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Singles Strategy'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Doubles Strategy'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Court Awareness'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Shot Selection'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Movement Efficiency Patterns'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Advanced Match Tactics'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Pressure and Mental Game'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Opponent Analysis'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Elite Technical Excellence'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Competitive Excellence'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (k:Knowledge {name: 'Badminton Coaching and Teaching'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Grip Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Basic Footwork'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Forehand Stroke'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Backhand Stroke'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Basic Serve'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Clear Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Net Shot Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Drive Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Smash Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Court Positioning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Shot Timing'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Attacking Patterns'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Defensive Techniques'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Singles Court Control'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Doubles Positioning'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Opponent Adaptation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Pressure Performance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Tactical Mastery'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Elite Consistency'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (s:Skill {name: 'Badminton Innovation and Creativity'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Hand-Eye Coordination'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Body Control'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Agility'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Reaction Time'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Strategic Thinking'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (t:Trait {name: 'Competitive Drive'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (m:Milestone {name: 'Win Tournament or Significant Competition'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Badminton Master'})
MATCH (m:Milestone {name: 'Achieve Elite Badminton Rating'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Component Prerequisites - Knowledge
// ============================================================

// Drop Shots require understanding of clears
MATCH (k1:Knowledge {name: 'Badminton Drop Shots'})
MATCH (k2:Knowledge {name: 'Badminton Clears'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Net Play requires understanding clears and drops
MATCH (k1:Knowledge {name: 'Badminton Net Play'})
MATCH (k2:Knowledge {name: 'Badminton Clears'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Badminton Net Play'})
MATCH (k2:Knowledge {name: 'Badminton Drop Shots'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Smash shots require understanding of clears
MATCH (k1:Knowledge {name: 'Badminton Smash and Attacking Shots'})
MATCH (k2:Knowledge {name: 'Badminton Clears'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Singles strategy requires understanding of court awareness
MATCH (k1:Knowledge {name: 'Badminton Singles Strategy'})
MATCH (k2:Knowledge {name: 'Badminton Court Awareness'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

// Doubles strategy requires understanding of court awareness
MATCH (k1:Knowledge {name: 'Badminton Doubles Strategy'})
MATCH (k2:Knowledge {name: 'Badminton Court Awareness'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

// Shot selection requires understanding of multiple basic shots
MATCH (k1:Knowledge {name: 'Badminton Shot Selection'})
MATCH (k2:Knowledge {name: 'Badminton Clears'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Badminton Shot Selection'})
MATCH (k2:Knowledge {name: 'Badminton Drop Shots'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k2);

// Movement patterns require understanding of footwork
MATCH (k1:Knowledge {name: 'Badminton Movement Efficiency Patterns'})
MATCH (k2:Knowledge {name: 'Badminton Stance and Footwork'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Advanced tactics require understanding of basic strategy
MATCH (k1:Knowledge {name: 'Badminton Advanced Match Tactics'})
MATCH (k2:Knowledge {name: 'Badminton Singles Strategy'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Opponent analysis requires understanding of shot selection and strategy
MATCH (k1:Knowledge {name: 'Badminton Opponent Analysis'})
MATCH (k2:Knowledge {name: 'Badminton Shot Selection'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// ============================================================
// Component Prerequisites - Skills
// ============================================================

// Forehand stroke requires grip control
MATCH (s1:Skill {name: 'Badminton Forehand Stroke'})
MATCH (s2:Skill {name: 'Badminton Grip Control'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Backhand stroke requires grip control
MATCH (s1:Skill {name: 'Badminton Backhand Stroke'})
MATCH (s2:Skill {name: 'Badminton Grip Control'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Clear execution requires forehand stroke and footwork
MATCH (s1:Skill {name: 'Badminton Clear Execution'})
MATCH (s2:Skill {name: 'Badminton Forehand Stroke'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Clear Execution'})
MATCH (s2:Skill {name: 'Badminton Basic Footwork'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Drop shot execution requires control over clear execution
MATCH (s1:Skill {name: 'Badminton Drop Shot Execution'})
MATCH (s2:Skill {name: 'Badminton Clear Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Net shot control requires drop execution
MATCH (s1:Skill {name: 'Badminton Net Shot Control'})
MATCH (s2:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Drive execution requires net shot control
MATCH (s1:Skill {name: 'Badminton Drive Execution'})
MATCH (s2:Skill {name: 'Badminton Net Shot Control'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Smash execution requires clear execution and shot timing
MATCH (s1:Skill {name: 'Badminton Smash Execution'})
MATCH (s2:Skill {name: 'Badminton Clear Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Smash Execution'})
MATCH (s2:Skill {name: 'Badminton Shot Timing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Court positioning requires footwork
MATCH (s1:Skill {name: 'Badminton Court Positioning'})
MATCH (s2:Skill {name: 'Badminton Basic Footwork'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Shot timing requires forehand and backhand strokes
MATCH (s1:Skill {name: 'Badminton Shot Timing'})
MATCH (s2:Skill {name: 'Badminton Forehand Stroke'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Shot Timing'})
MATCH (s2:Skill {name: 'Badminton Backhand Stroke'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Attacking patterns requires clear and smash execution
MATCH (s1:Skill {name: 'Badminton Attacking Patterns'})
MATCH (s2:Skill {name: 'Badminton Clear Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Attacking Patterns'})
MATCH (s2:Skill {name: 'Badminton Smash Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Defensive techniques requires clear and drop execution
MATCH (s1:Skill {name: 'Badminton Defensive Techniques'})
MATCH (s2:Skill {name: 'Badminton Clear Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Defensive Techniques'})
MATCH (s2:Skill {name: 'Badminton Drop Shot Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Singles court control requires court positioning
MATCH (s1:Skill {name: 'Badminton Singles Court Control'})
MATCH (s2:Skill {name: 'Badminton Court Positioning'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Doubles positioning requires court positioning
MATCH (s1:Skill {name: 'Badminton Doubles Positioning'})
MATCH (s2:Skill {name: 'Badminton Court Positioning'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Opponent adaptation requires shot timing and court positioning
MATCH (s1:Skill {name: 'Badminton Opponent Adaptation'})
MATCH (s2:Skill {name: 'Badminton Shot Timing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Opponent Adaptation'})
MATCH (s2:Skill {name: 'Badminton Court Positioning'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Pressure performance requires attacking and defensive patterns
MATCH (s1:Skill {name: 'Badminton Pressure Performance'})
MATCH (s2:Skill {name: 'Badminton Attacking Patterns'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Pressure Performance'})
MATCH (s2:Skill {name: 'Badminton Defensive Techniques'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Tactical mastery requires opponent adaptation and attacking patterns
MATCH (s1:Skill {name: 'Badminton Tactical Mastery'})
MATCH (s2:Skill {name: 'Badminton Opponent Adaptation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Tactical Mastery'})
MATCH (s2:Skill {name: 'Badminton Attacking Patterns'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Elite consistency requires all basic execution skills
MATCH (s1:Skill {name: 'Badminton Elite Consistency'})
MATCH (s2:Skill {name: 'Badminton Clear Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Badminton Elite Consistency'})
MATCH (s2:Skill {name: 'Badminton Smash Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Innovation and creativity requires tactical mastery
MATCH (s1:Skill {name: 'Badminton Innovation and Creativity'})
MATCH (s2:Skill {name: 'Badminton Tactical Mastery'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// ============================================================
// Component Prerequisites - Milestones
// ============================================================

// Play first complete game requires completing first rally
MATCH (m1:Milestone {name: 'Play First Complete Badminton Game'})
MATCH (m2:Milestone {name: 'Complete First Badminton Rally'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Serve accuracy requires first game
MATCH (m1:Milestone {name: 'Achieve 80% Serve Accuracy'})
MATCH (m2:Milestone {name: 'Play First Complete Badminton Game'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// First win requires achieving 80% serve accuracy
MATCH (m1:Milestone {name: 'Win First Friendly Match'})
MATCH (m2:Milestone {name: 'Achieve 80% Serve Accuracy'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Court familiarity requires first game
MATCH (m1:Milestone {name: 'Complete 5 Full Practice Sessions'})
MATCH (m2:Milestone {name: 'Play First Complete Badminton Game'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// 10+ shot rally requires first win
MATCH (m1:Milestone {name: 'Play 10+ Shot Rally'})
MATCH (m2:Milestone {name: 'Win First Friendly Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Mastering positions requires court familiarity
MATCH (m1:Milestone {name: 'Master Positioning in All Court Zones'})
MATCH (m2:Milestone {name: 'Complete 5 Full Practice Sessions'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Shot variety requires 10+ shot rally
MATCH (m1:Milestone {name: 'Consistently Execute Four Different Shot Types'})
MATCH (m2:Milestone {name: 'Play 10+ Shot Rally'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Win 5 matches requires first win
MATCH (m1:Milestone {name: 'Win 5 Casual Matches'})
MATCH (m2:Milestone {name: 'Win First Friendly Match'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Tournament participation requires shot variety and 5 wins
MATCH (m1:Milestone {name: 'Participate in Badminton Tournament'})
MATCH (m2:Milestone {name: 'Consistently Execute Four Different Shot Types'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Participate in Badminton Tournament'})
MATCH (m2:Milestone {name: 'Win 5 Casual Matches'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Singles/doubles proficiency requires tournament participation
MATCH (m1:Milestone {name: 'Demonstrate Proficiency in Both Singles and Doubles'})
MATCH (m2:Milestone {name: 'Participate in Badminton Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Competitive rating requires tournament participation
MATCH (m1:Milestone {name: 'Achieve Competitive Player Rating'})
MATCH (m2:Milestone {name: 'Participate in Badminton Tournament'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Opponent adjustment requires proficiency in both formats
MATCH (m1:Milestone {name: 'Successfully Adjust Tactics Against Different Opponent Styles'})
MATCH (m2:Milestone {name: 'Demonstrate Proficiency in Both Singles and Doubles'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Tournament win requires competitive rating and adjustment skills
MATCH (m1:Milestone {name: 'Win Tournament or Significant Competition'})
MATCH (m2:Milestone {name: 'Achieve Competitive Player Rating'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Win Tournament or Significant Competition'})
MATCH (m2:Milestone {name: 'Successfully Adjust Tactics Against Different Opponent Styles'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Elite rating requires tournament win
MATCH (m1:Milestone {name: 'Achieve Elite Badminton Rating'})
MATCH (m2:Milestone {name: 'Win Tournament or Significant Competition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Coach recognition requires elite rating
MATCH (m1:Milestone {name: 'Earn Recognition as Accomplished Player'})
MATCH (m2:Milestone {name: 'Achieve Elite Badminton Rating'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Mentor player requires tournament win
MATCH (m1:Milestone {name: 'Successfully Mentor a Developing Badminton Player'})
MATCH (m2:Milestone {name: 'Win Tournament or Significant Competition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Competitive consistency requires elite rating maintained
MATCH (m1:Milestone {name: 'Maintain Top Competition Rankings for Full Season'})
MATCH (m2:Milestone {name: 'Achieve Elite Badminton Rating'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);
