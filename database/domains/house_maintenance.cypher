// Domain: House Maintenance
// Generated: 2025-11-16
// Description: The practice of maintaining, repairing, and improving residential properties through routine care, problem-solving, and systematic upkeep of home systems and structures.

// ============================================================
// DOMAIN: House Maintenance
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'House Maintenance',
  description: 'The comprehensive practice of maintaining, repairing, and improving residential properties through routine preventive care, problem-solving, and systematic upkeep of home systems and structures including plumbing, electrical, HVAC, structural integrity, and general home care',
  level_count: 5,
  created_date: date(),
  scope_included: ['preventive maintenance routines', 'diagnostic troubleshooting of home systems', 'basic repairs (drywall, caulking, weatherstripping)', 'plumbing maintenance and simple repairs', 'electrical safety and outlet/switch maintenance', 'HVAC filter changes and seasonal maintenance', 'roof and gutter inspection and cleaning', 'appliance care and maintenance', 'painting and surface finishes', 'structural assessment and inspection', 'home winterization and seasonal preparation', 'safety system maintenance (smoke detectors, CO detectors)', 'wood floor and carpet care', 'caulking and sealing'],
  scope_excluded: ['major structural renovations (separate domain - remodeling)', 'new construction (separate domain)', 'landscape design (separate domain - gardening)', 'interior design and decorating (separate domain)', 'advanced electrical work requiring licensing (separate domain - professional electrician)', 'advanced plumbing work requiring licensing (separate domain - professional plumber)', 'HVAC system replacement (separate domain - professional HVAC)', 'roofing replacement (separate domain - professional roofing)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'House Maintenance Novice',
  description: 'Learning basic home care fundamentals, understanding key home systems at a surface level, performing simple preventive tasks like filter changes and cleaning, and recognizing when professional help is needed'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'House Maintenance Developing',
  description: 'Building proficiency in routine maintenance across multiple home systems, performing simple repairs with confidence, diagnosing basic problems, and managing seasonal maintenance tasks independently'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'House Maintenance Competent',
  description: 'Reliably maintaining all major home systems with minimal guidance, handling a wide range of common repairs confidently, conducting thorough inspections to catch problems early, and implementing systematic preventive care schedules'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'House Maintenance Advanced',
  description: 'Expertly managing complex home maintenance challenges, troubleshooting sophisticated system problems, mentoring others in home care practices, and making strategic decisions about repairs versus replacements'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'House Maintenance Master',
  description: 'Achieving mastery across all aspects of residential home maintenance, developing specialized expertise in particular systems, contributing to the broader community through knowledge sharing, and optimizing homes for efficiency and longevity'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'House Maintenance'})
MATCH (level1:Domain_Level {name: 'House Maintenance Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'House Maintenance'})
MATCH (level2:Domain_Level {name: 'House Maintenance Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'House Maintenance'})
MATCH (level3:Domain_Level {name: 'House Maintenance Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'House Maintenance'})
MATCH (level4:Domain_Level {name: 'House Maintenance Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'House Maintenance'})
MATCH (level5:Domain_Level {name: 'House Maintenance Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// FOUNDATIONAL KNOWLEDGE - Novice Level

MERGE (k:Knowledge {name: 'Home Systems Overview'})
ON CREATE SET k.description = 'Introduction to the major systems that comprise a residential home: plumbing, electrical, HVAC, structural systems, and their basic functions and interdependencies',
              k.how_to_learn = 'Take a home inspection course or watch educational videos on home systems. Tour your own home with a checklist of systems to identify. Read introductory home maintenance books like "The Complete Modern House" by Alexander Gorlin. Expected time: 2-3 weeks.',
              k.remember_level = 'Identify and name the major home systems: plumbing, electrical, HVAC, foundation, roofing, and structural elements',
              k.understand_level = 'Explain how each major system works and why it is important to the overall function of the home',
              k.apply_level = 'Locate and operate basic shut-offs and controls for each system in your own home',
              k.analyze_level = 'Break down how systems interact and affect each other (e.g., how moisture affects HVAC efficiency)',
              k.evaluate_level = 'Assess the general health of home systems by visual inspection and determine what needs professional attention',
              k.create_level = 'Develop a customized home maintenance plan based on your specific home\'s systems';

MERGE (k:Knowledge {name: 'Basic Home Safety'})
ON CREATE SET k.description = 'Fundamental safety practices for homeowners including electrical safety, water safety, chemical safety, and emergency procedures relevant to residential properties',
              k.how_to_learn = 'Complete a basic home safety course. Review safety information from organizations like the National Fire Protection Association. Take a first aid course. Expected time: 1-2 weeks.',
              k.remember_level = 'Recall major home safety hazards and the proper locations of shut-offs and emergency equipment',
              k.understand_level = 'Explain why specific safety practices matter and what dangers they protect against',
              k.apply_level = 'Perform basic safety checks including checking smoke detectors, testing GFCI outlets, and locating shut-offs',
              k.analyze_level = 'Identify potential safety hazards in a home and explain their risks',
              k.evaluate_level = 'Judge whether a maintenance situation is safe to handle yourself or requires professional help',
              k.create_level = 'Develop a comprehensive home safety plan and emergency procedures for your household';

MERGE (k:Knowledge {name: 'House Maintenance Tool Fundamentals'})
ON CREATE SET k.description = 'Basic knowledge of essential home maintenance tools, their proper use, safety precautions, and care requirements',
              k.how_to_learn = 'Study tool manuals and instructional videos. Start with basic hand tools and gradually learn power tools. Take hands-on workshops at hardware stores or community centers. Expected time: 2-3 weeks.',
              k.remember_level = 'Identify common home maintenance tools and their primary purposes (hammer, screwdriver, wrench, plunger, etc.)',
              k.understand_level = 'Explain proper techniques for using basic tools safely and effectively',
              k.apply_level = 'Use basic tools correctly to perform simple tasks like installing shelves or fixing a leaky faucet',
              k.analyze_level = 'Determine which tools are needed for specific maintenance tasks and assess tool quality and appropriateness',
              k.evaluate_level = 'Judge when to use professional-grade equipment versus basic tools, and when to hire specialists',
              k.create_level = 'Design a customized tool kit for your specific home needs and skill level';

MERGE (k:Knowledge {name: 'Preventive Maintenance Principles'})
ON CREATE SET k.description = 'Core concepts of preventive maintenance including why regular upkeep prevents costly repairs, maintenance scheduling, and routine care fundamentals',
              k.how_to_learn = 'Read home maintenance guides emphasizing prevention. Interview experienced homeowners about their maintenance routines. Review manufacturer recommendations for your appliances and systems. Expected time: 2-3 weeks.',
              k.remember_level = 'List the major categories of preventive maintenance and examples of preventive tasks in each',
              k.understand_level = 'Explain how preventive maintenance saves money and extends system life versus reactive repairs',
              k.apply_level = 'Create and follow a basic preventive maintenance schedule for your home',
              k.analyze_level = 'Compare different preventive maintenance approaches and their cost-effectiveness over time',
              k.evaluate_level = 'Judge the appropriate level of preventive maintenance investment for different home systems',
              k.create_level = 'Design a comprehensive preventive maintenance program customized to your home\'s age and condition';

MERGE (k:Knowledge {name: 'Common House Maintenance Terminology'})
ON CREATE SET k.description = 'Essential vocabulary and technical terms used in house maintenance, construction, and home systems that homeowners need to understand communications from professionals',
              k.how_to_learn = 'Create flashcards of common terms and definitions. Read home improvement blogs and articles. Watch instructional videos that explain terminology. Build a personal glossary. Expected time: 1-2 weeks.',
              k.remember_level = 'Recall definitions of common home maintenance terms like caulking, grout, soffit, fascia, flashing, etc.',
              k.understand_level = 'Explain what home maintenance terms mean in context and why they are relevant',
              k.apply_level = 'Use appropriate terminology when communicating with professionals and reading maintenance manuals',
              k.analyze_level = 'Understand how terminology relates to underlying concepts in home construction and systems',
              k.evaluate_level = 'Judge when terminology used by professionals is accurate and when clarification is needed',
              k.create_level = 'Develop educational materials explaining home maintenance terminology to other homeowners';

// CORE KNOWLEDGE - Developing/Competent Levels

MERGE (k:Knowledge {name: 'Plumbing System Fundamentals'})
ON CREATE SET k.description = 'Comprehensive understanding of residential plumbing systems including water supply, drainage, trap systems, and common plumbing problems and maintenance',
              k.how_to_learn = 'Enroll in a residential plumbing basics course. Study plumbing code and diagrams specific to your area. Practice identifying plumbing components in your home. Watch instructional videos on plumbing maintenance and repairs. Expected time: 4-6 weeks.',
              k.remember_level = 'Identify major plumbing components: water main shut-off, supply lines, drain pipes, traps, vents, and typical problem areas',
              k.understand_level = 'Explain how water supply systems work, how drainage systems function, and why traps and vents are critical',
              k.apply_level = 'Perform basic plumbing maintenance like fixing leaky faucets, unclogging drains, and winterizing pipes',
              k.analyze_level = 'Diagnose plumbing problems by understanding water flow and pressure issues',
              k.evaluate_level = 'Determine which plumbing problems can be fixed yourself and which require a professional plumber',
              k.create_level = 'Design solutions to recurring plumbing problems in your home and create maintenance protocols';

MERGE (k:Knowledge {name: 'Electrical System Fundamentals'})
ON CREATE SET k.description = 'Basic understanding of residential electrical systems, safety practices, circuit components, and common electrical maintenance tasks that homeowners can safely perform',
              k.how_to_learn = 'Take a residential electrical safety course. Study electrical system diagrams for your home. Practice identifying electrical components. Watch instructional videos on safe electrical work. Expected time: 4-6 weeks.',
              k.remember_level = 'Identify electrical panel components, circuit breakers, and major appliance circuits in your home',
              k.understand_level = 'Explain how electricity flows through a home, what voltage means, and why circuit breakers are important',
              k.apply_level = 'Perform safe electrical maintenance including resetting circuits, replacing outlet covers, and testing outlets with a multimeter',
              k.analyze_level = 'Diagnose basic electrical problems like flickering lights or dead outlets by understanding circuit failures',
              k.evaluate_level = 'Judge which electrical work is safe for homeowners and which requires a licensed electrician',
              k.create_level = 'Design solutions to improve electrical functionality and safety in specific areas of your home';

MERGE (k:Knowledge {name: 'HVAC System Care'})
ON CREATE SET k.description = 'Knowledge of heating, ventilation, and air conditioning systems including maintenance routines, filter changes, seasonal preparation, and basic troubleshooting',
              k.how_to_learn = 'Read your HVAC system manual thoroughly. Take an HVAC maintenance course or watch instructional videos. Schedule an appointment with your HVAC technician to learn about your specific system. Expected time: 3-4 weeks.',
              k.remember_level = 'Identify HVAC system components and understand filter sizes and replacement frequency for your system',
              k.understand_level = 'Explain how heating and cooling systems work and why regular maintenance extends their lifespan',
              k.apply_level = 'Change HVAC filters, adjust thermostat settings appropriately, and perform seasonal maintenance',
              k.analyze_level = 'Diagnose HVAC problems like uneven heating, inadequate cooling, or airflow issues',
              k.evaluate_level = 'Determine whether HVAC issues are maintenance-related or require professional service',
              k.create_level = 'Develop a comprehensive HVAC maintenance schedule optimized for your climate and home usage patterns';

MERGE (k:Knowledge {name: 'Roof and Gutter Maintenance'})
ON CREATE SET k.description = 'Understanding residential roof systems, gutter functionality, seasonal maintenance, inspection techniques, and recognition of problems requiring professional attention',
              k.how_to_learn = 'Review your roofing material specifications and warranty. Take a roof inspection course or watch educational videos. Walk your roof safely with a professional inspector. Expected time: 3-4 weeks.',
              k.remember_level = 'Identify roof components, gutter systems, and common roof and gutter problems like leaks and clogs',
              k.understand_level = 'Explain how roofs shed water, why gutters are important, and what causes common roofing problems',
              k.apply_level = 'Clean gutters, perform basic roof inspections from the ground, and identify leak sources inside the home',
              k.analyze_level = 'Diagnose roof problems based on interior water stains and exterior damage patterns',
              k.evaluate_level = 'Judge the severity of roof damage and whether repairs or full replacement is needed',
              k.create_level = 'Develop a comprehensive roof maintenance and inspection schedule for your specific roofing material';

MERGE (k:Knowledge {name: 'Interior Surface Care and Finishing'})
ON CREATE SET k.description = 'Knowledge of maintaining interior surfaces including drywall, paint, caulk, flooring, and finish coatings, plus refinishing techniques for wood and other materials',
              k.how_to_learn = 'Take painting and finishing courses. Watch instructional videos on surface preparation and finishing techniques. Practice on small projects before larger work. Read manufacturer instructions for finishes. Expected time: 3-4 weeks.',
              k.remember_level = 'Identify different interior surfaces and common damage types like drywall damage, paint failure, and caulk deterioration',
              k.understand_level = 'Explain proper surface preparation, why caulk and paint fail, and how to achieve professional-quality finishes',
              k.apply_level = 'Patch drywall, caulk gaps, and paint interior surfaces with good quality and appearance',
              k.analyze_level = 'Diagnose surface problems like moisture damage or poor adhesion and determine root causes',
              k.evaluate_level = 'Judge when DIY finishing is appropriate versus when professional work is needed for quality results',
              k.create_level = 'Design interior finish upgrades and renovation plans for specific spaces in your home';

MERGE (k:Knowledge {name: 'Wood Floor and Carpet Care'})
ON CREATE SET k.description = 'Comprehensive knowledge of maintaining and caring for wood floors, carpet, and other flooring materials including cleaning, stain removal, and restoration',
              k.how_to_learn = 'Study flooring manufacturer care recommendations. Take flooring care workshops. Watch instructional videos on cleaning and restoration. Consult with flooring professionals about specific materials. Expected time: 2-3 weeks.',
              k.remember_level = 'Identify flooring types and their specific care requirements and vulnerabilities',
              k.understand_level = 'Explain proper cleaning methods, why certain products damage different flooring, and how to restore appearance',
              k.apply_level = 'Perform routine cleaning, stain removal, and basic restoration for your specific flooring materials',
              k.analyze_level = 'Diagnose flooring problems like cupping, buckling, or permanent staining and their underlying causes',
              k.evaluate_level = 'Judge when professional restoration or refinishing is necessary versus DIY cleaning',
              k.create_level = 'Develop customized flooring care protocols based on your specific materials and household usage';

// ADVANCED KNOWLEDGE - Advanced Level

MERGE (k:Knowledge {name: 'Structural Assessment and Inspection'})
ON CREATE SET k.description = 'Advanced knowledge of structural components, inspection techniques for identifying problems, understanding structural failures, and assessing home integrity',
              k.how_to_learn = 'Complete advanced home inspection training. Shadow professional home inspectors. Study structural engineering basics. Take courses on building science. Expected time: 6-8 weeks.',
              k.remember_level = 'Identify all major structural components and signs of structural damage or deterioration',
              k.understand_level = 'Explain how structural loads transfer through homes, what causes common failures, and why early intervention matters',
              k.apply_level = 'Conduct thorough structural inspections and identify problems requiring professional assessment',
              k.analyze_level = 'Connect visible structural problems to underlying causes and systemic issues',
              k.evaluate_level = 'Judge the severity of structural issues and make recommendations for repair prioritization',
              k.create_level = 'Develop comprehensive structural assessment protocols for your home and create long-term structural maintenance plans';

MERGE (k:Knowledge {name: 'Home Energy Efficiency'})
ON CREATE SET k.description = 'Advanced understanding of residential energy consumption, efficiency improvements, insulation strategies, weatherization, and optimizing home performance for energy savings',
              k.how_to_learn = 'Complete energy auditing courses or ENERGY STAR training. Study building science and thermodynamics as applied to homes. Get a professional energy audit of your home. Expected time: 6-8 weeks.',
              k.remember_level = 'Identify major energy loss sources and efficiency improvement opportunities in residential homes',
              k.understand_level = 'Explain how heat transfer works, why insulation matters, and how sealing impacts efficiency',
              k.apply_level = 'Implement weatherization improvements like caulking, weatherstripping, and insulation upgrades',
              k.analyze_level = 'Analyze energy bills and patterns to identify consumption problems and efficiency opportunities',
              k.evaluate_level = 'Judge the cost-effectiveness of energy efficiency improvements and prioritize upgrades by ROI',
              k.create_level = 'Design comprehensive energy efficiency improvement plans with specific targets and phased implementation';

MERGE (k:Knowledge {name: 'Moisture Management and Water Damage Prevention'})
ON CREATE SET k.description = 'Advanced knowledge of water intrusion, condensation, moisture damage, mold prevention, and strategies for managing moisture in residential environments',
              k.how_to_learn = 'Complete moisture and mold remediation training. Study building science focused on moisture. Work with moisture specialists to understand your home\'s challenges. Expected time: 6-8 weeks.',
              k.remember_level = 'Identify sources of water intrusion and moisture accumulation in homes',
              k.understand_level = 'Explain how moisture moves through building materials, why it causes damage, and how to prevent problems',
              k.apply_level = 'Implement moisture management strategies including proper grading, ventilation, and dehumidification',
              k.analyze_level = 'Diagnose moisture problems by understanding water movement patterns and identifying root causes',
              k.evaluate_level = 'Judge the appropriate moisture management solutions for specific home conditions',
              k.create_level = 'Design comprehensive moisture management strategies specific to your home\'s location and construction';

MERGE (k:Knowledge {name: 'Appliance Maintenance and Troubleshooting'})
ON CREATE SET k.description = 'Advanced knowledge of major home appliances, preventive maintenance protocols, diagnosing failures, and determining repair versus replacement decisions',
              k.how_to_learn = 'Study appliance manuals thoroughly. Take appliance repair courses. Work with appliance repair technicians to understand common failures. Expected time: 4-6 weeks.',
              k.remember_level = 'Identify appliances, their basic functions, and common failure modes for each appliance type',
              k.understand_level = 'Explain how appliances work, why maintenance extends lifespan, and what causes premature failures',
              k.apply_level = 'Perform preventive maintenance, clear vents and filters, and perform basic troubleshooting',
              k.analyze_level = 'Diagnose appliance problems by understanding mechanical and electrical failures',
              k.evaluate_level = 'Judge whether appliance repairs are cost-effective versus replacement based on age and reliability',
              k.create_level = 'Develop customized preventive maintenance and replacement schedules for all major appliances';

MERGE (k:Knowledge {name: 'Building Science and Home Performance'})
ON CREATE SET k.description = 'Comprehensive understanding of how homes perform as systems including thermal dynamics, air flow, moisture behavior, and the interconnection between building envelope and mechanical systems',
              k.how_to_learn = 'Complete building science courses or certifications. Study advanced home performance topics. Work with building performance specialists. Expected time: 8-10 weeks.',
              k.remember_level = 'Understand major building science principles relevant to home performance and maintenance',
              k.understand_level = 'Explain how building physics affects home comfort, durability, and efficiency',
              k.apply_level = 'Apply building science principles to guide maintenance and improvement decisions',
              k.analyze_level = 'Analyze complex interactions between building systems and their effects on home performance',
              k.evaluate_level = 'Judge building performance problems and prioritize interventions based on science',
              k.create_level = 'Design comprehensive home performance improvement strategies based on building science principles';

// SPECIALIZED KNOWLEDGE - Master Level

MERGE (k:Knowledge {name: 'History of Residential Building Practices'})
ON CREATE SET k.description = 'Mastery of how residential building practices have evolved, understanding period-specific construction methods, and knowing how to appropriately maintain different-era homes',
              k.how_to_learn = 'Study architectural and building history. Take courses on preservation and period restoration. Research the specific era and style of your home. Expected time: 8-12 weeks.',
              k.remember_level = 'Know major building practice periods and what construction methods were typical in each era',
              k.understand_level = 'Explain how building practices evolved and why certain practices were used in specific time periods',
              k.apply_level = 'Identify the era of your home\'s construction and apply appropriate maintenance approaches',
              k.analyze_level = 'Connect visible construction methods and materials to historical periods and understand period context',
              k.evaluate_level = 'Judge whether modern practices are appropriate for historic homes or whether period-appropriate methods are needed',
              k.create_level = 'Develop historically-appropriate maintenance and restoration strategies for period homes';

MERGE (k:Knowledge {name: 'Advanced Diagnostic Techniques'})
ON CREATE SET k.description = 'Mastery of diagnostic tools and techniques including thermal imaging, moisture meters, pressure testing, and systematic troubleshooting approaches for complex home problems',
              k.how_to_learn = 'Complete advanced diagnostic training programs. Work extensively with professional diagnostic equipment. Study diagnostic methodologies. Expected time: 10-12 weeks.',
              k.remember_level = 'Know major diagnostic tools and their applications in home maintenance',
              k.understand_level = 'Explain how diagnostic tools work and interpret their readings and output',
              k.apply_level = 'Use advanced diagnostic equipment to identify hidden problems systematically',
              k.analyze_level = 'Synthesize diagnostic data from multiple tools to understand complex problems',
              k.evaluate_level = 'Judge diagnostic findings and their implications for home maintenance and repairs',
              k.create_level = 'Develop comprehensive diagnostic protocols for systematic assessment of home systems';

MERGE (k:Knowledge {name: 'Sustainable Home Maintenance Practices'})
ON CREATE SET k.description = 'Mastery of environmentally-responsible approaches to home maintenance including sustainable materials, waste reduction, and long-term environmental impact of maintenance decisions',
              k.how_to_learn = 'Study sustainable building and maintenance practices. Research green building certifications. Participate in sustainable home improvement communities. Expected time: 8-10 weeks.',
              k.remember_level = 'Know sustainable alternatives for common maintenance products and procedures',
              k.understand_level = 'Explain environmental impacts of various maintenance approaches and materials',
              k.apply_level = 'Choose sustainable options in maintenance decisions without compromising performance',
              k.analyze_level = 'Evaluate lifecycle environmental impacts of different maintenance and repair approaches',
              k.evaluate_level = 'Judge when to prioritize sustainability versus other factors like cost and convenience',
              k.create_level = 'Design comprehensive sustainable home maintenance strategies that minimize environmental impact';

MERGE (k:Knowledge {name: 'Teaching and Community Knowledge Sharing'})
ON CREATE SET k.description = 'Advanced ability to teach home maintenance to others, develop educational materials, communicate technical concepts clearly, and contribute to community knowledge',
              k.how_to_learn = 'Teach home maintenance classes or workshops. Create educational content. Mentor other homeowners. Take teaching and communication courses. Expected time: 10-12 weeks.',
              k.remember_level = 'Know effective teaching methods and how to explain maintenance concepts at different skill levels',
              k.understand_level = 'Explain learning theory and how to adapt teaching to different learner types',
              k.apply_level = 'Teach home maintenance topics effectively to groups or individuals at various skill levels',
              k.analyze_level = 'Analyze misconceptions about home maintenance and develop teaching strategies to correct them',
              k.evaluate_level = 'Judge the effectiveness of educational approaches and learning materials',
              k.create_level = 'Develop comprehensive educational programs and materials for teaching home maintenance to others';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// BASIC SKILLS - Novice Level

MERGE (s:Skill {name: 'Basic Tool Handling'})
ON CREATE SET s.description = 'The ability to safely and correctly use common hand tools including hammers, screwdrivers, plungers, wrenches, and tape measures for simple maintenance tasks',
              s.how_to_develop = 'Start with one tool at a time under supervision or with video guidance. Practice basic techniques on simple projects like fixing loose shelves or fastening cabinet hardware. Visit a hardware store workshop for hands-on instruction. Expected time: 1-2 weeks.',
              s.novice_level = 'Can use basic hand tools with guidance. Movements are cautious and deliberate. Requires references for correct tool use. To progress: Practice using each tool independently on simple tasks.',
              s.advanced_beginner_level = 'Uses common hand tools without constant reference. Beginning to work efficiently. Still uses some tools tentatively. To progress: Tackle more complex projects requiring multiple tools.',
              s.competent_level = 'Selects and uses appropriate tools confidently for standard maintenance tasks. Works efficiently with hand tools. To progress: Learn power tool basics.',
              s.proficient_level = 'Uses tools fluidly and automatically selects the right tool without conscious deliberation. Adapts technique based on task requirements. To progress: Master specialized tools.',
              s.expert_level = 'Demonstrates mastery of all common maintenance tools with intuitive, efficient technique. Can adapt tools creatively to unique situations. Maintains tools expertly.';

MERGE (s:Skill {name: 'HVAC Filter Changing'})
ON CREATE SET s.description = 'The ability to locate, assess condition, and replace furnace and air conditioning filters safely and correctly to maintain system efficiency',
              s.how_to_develop = 'Locate your system manual and identify filter location. Watch instructional videos for your specific system. Replace your first filter with guidance from an HVAC technician or online tutorial. Expected time: 1 week.',
              s.novice_level = 'Can locate filter location with reference to manual. Changes filters with step-by-step instructions. Uncertain about filter sizing. To progress: Complete several filter changes and learn filter sizes.',
              s.advanced_beginner_level = 'Remembers filter location and size. Changes filters independently but may verify instructions. Recognizes when filters are very dirty. To progress: Establish regular replacement schedule.',
              s.competent_level = 'Regularly changes filters on schedule without references. Assesses filter condition accurately. Maintains consistent schedule. To progress: Learn about different filter types and efficiency ratings.',
              s.proficient_level = 'Changes filters automatically on schedule. Selects appropriate filter types intuitively. Monitors air flow and adjusts filter grade based on air quality needs. To progress: Develop advanced air quality management.',
              s.expert_level = 'Optimizes filter management for home efficiency and air quality. Understands fine details of filter types, efficiency ratings, and system impacts. Maintains meticulous records and adjusts strategy based on seasonal needs.';

MERGE (s:Skill {name: 'Dripping Faucet Diagnosis'})
ON CREATE SET s.description = 'The ability to listen to and correctly identify the source and likely cause of leaks in faucets and fixtures to guide repair decisions',
              s.how_to_develop = 'Watch videos on faucet anatomy and failure modes. Examine your own faucets to understand common leak patterns. Practice describing different types of leaks to a plumber. Expected time: 1 week.',
              s.novice_level = 'Can identify that a faucet is leaking. Describes leak location vaguely (\"from the spout\"). Requires guidance to determine if it\'s fixable. To progress: Learn about different faucet failure modes.',
              s.advanced_beginner_level = 'Identifies leak location specifically (cartridge, base, shutoff). Recognizes patterns in leak timing. Beginning to guess at causes. To progress: Study faucet components and failure patterns.',
              s.competent_level = 'Accurately diagnoses leak source and most likely cause (worn cartridge, bad seal, etc.). Explains findings clearly. Makes sound repair decisions. To progress: Develop intuition about repair difficulty.',
              s.proficient_level = 'Quickly diagnoses leaks almost instantly. Intuitively understands which are easy fixes and which need plumbers. Considers age and fixture type in assessment. To progress: Develop expertise in complex fixtures.',
              s.expert_level = 'Diagnoses faucet problems instantly and accurately. Understands subtle indicators and can predict failure progression. Communicates findings with perfect clarity to support repair decisions.';

MERGE (s:Skill {name: 'Drain Clearing'})
ON CREATE SET s.description = 'The ability to clear clogged drains safely and effectively using plungers, drain snakes, and chemical treatments without causing damage',
              s.how_to_develop = 'Learn proper plunging technique from instructional videos. Purchase a quality plunger and snake. Practice on mild clogs under supervision or with guidance. Expected time: 1-2 weeks.',
              s.novice_level = 'Can use a plunger with instructions. Often ineffective. Uncertain about when to seek professional help. To progress: Practice proper plunging technique.',
              s.advanced_beginner_level = 'Uses plungers effectively for simple clogs. Recognizes when clogs are too severe. Beginning to use plumbing snakes successfully. To progress: Expand repertoire of drain clearing methods.',
              s.competent_level = 'Clears most common clogs independently. Selects appropriate method (plunger vs. snake) based on clog type. To progress: Learn chemical treatment safety and effectiveness.',
              s.proficient_level = 'Clears drains efficiently using optimal technique. Intuitively selects tools and methods. Knows when to stop and call a plumber. To progress: Handle complex drain systems.',
              s.expert_level = 'Clears virtually all drainable clogs efficiently and safely. Understands drain system complexity. Knows exactly when professional equipment is needed. Prevents future clogs through knowledge of maintenance.';

MERGE (s:Skill {name: 'Weather Stripping Application'})
ON CREATE SET s.description = 'The ability to install weatherstripping on doors and windows to prevent air leaks, improving home efficiency and comfort',
              s.how_to_develop = 'Choose weatherstripping type appropriate for your windows/doors. Watch installation videos. Practice on non-critical doors first. Expected time: 1-2 weeks.',
              s.novice_level = 'Can apply weatherstripping with detailed instructions. Installation is often crooked or gaps remain. Uncertain about product selection. To progress: Practice on multiple doors.',
              s.advanced_beginner_level = 'Installs weatherstripping straight and functional. Selects basic product types. Minor gaps or misalignments. To progress: Learn advanced product types and techniques.',
              s.competent_level = 'Installs weatherstripping professionally on most doors/windows. Selects appropriate products. Addresses different configurations effectively. To progress: Learn advanced sealing techniques.',
              s.proficient_level = 'Installs weatherstripping fluidly with excellent fit. Intuitively adapts to different window/door styles. Minimal waste and mistakes. To progress: Develop expertise in specialty applications.',
              s.expert_level = 'Weatherstrips homes with expert precision. Understands all product types and their applications. Achieves optimal seals that last years. Diagnoses air leak problems systematically.';

MERGE (s:Skill {name: 'Smoke Detector Testing'})
ON CREATE SET s.description = 'The ability to properly test smoke detectors to ensure they function correctly and provide home safety, including knowing when batteries need replacement',
              s.how_to_develop = 'Locate test buttons on all detectors in your home. Learn recommended testing frequency (monthly). Create a testing reminder. Expected time: Few hours.',
              s.novice_level = 'Can locate smoke detectors. Presses test button hesitantly. Sometimes forgets testing. To progress: Establish regular testing routine.',
              s.advanced_beginner_level = 'Tests smoke detectors regularly. Recognizes non-functional detectors. Changes batteries when detectors alert. To progress: Develop systematic testing schedule.',
              s.competent_level = 'Systematically tests all detectors monthly. Promptly replaces batteries. Maintains record of testing. To progress: Learn about detector types and optimal placement.',
              s.proficient_level = 'Maintains smoke detection system intuitively. Automatically tests on schedule. Quickly recognizes detector problems. To progress: Understand advanced detection technologies.',
              s.expert_level = 'Expertly maintains comprehensive smoke detection. Understands different detector types and optimal placement. Ensures all areas are covered. Educates household on detector importance.';

// INTERMEDIATE SKILLS - Developing/Competent Levels

MERGE (s:Skill {name: 'Drywall Patching'})
ON CREATE SET s.description = 'The ability to repair drywall holes and damage using spackle, joint compound, and sanding to achieve smooth, paintable surfaces',
              s.how_to_develop = 'Practice on small holes first (nail holes, small dents). Work with joint compound and sanding. Develop feel for proper thickness and smoothness. Expected time: 3-4 weeks.',
              s.novice_level = 'Can patch very small holes with spackle. Patches are visible and uneven. Struggles with sanding smoothly. To progress: Practice on progressively larger holes.',
              s.advanced_beginner_level = 'Patches small to medium holes (1-2 inches). Results require some paint touch-up to hide. Basic sanding technique. To progress: Develop better feathering technique.',
              s.competent_level = 'Patches 1-3 inch holes smoothly and invisibly. Feathers edges well. Requires minimal paint touch-up. To progress: Handle larger repairs and complex shapes.',
              s.proficient_level = 'Patches any size hole smoothly. Instinctively feathers and sands for invisible results. Works efficiently. To progress: Handle specialty patching (corner repairs, texture matching).',
              s.expert_level = 'Achieves professional-quality drywall repairs invisibly. Matches existing textures and finishes seamlessly. Works efficiently with minimal waste. Can teach others the craft.';

MERGE (s:Skill {name: 'Interior Painting'})
ON CREATE SET s.description = 'The ability to prepare surfaces and apply paint to interior walls and trim to achieve professional-quality, even finishes',
              s.how_to_develop = 'Prepare small room for painting. Practice cutting edges, rolling technique, and brush control. Start with single-color rooms. Expected time: 4-6 weeks.',
              s.novice_level = 'Can apply paint to walls with instructions. Finish shows lap marks, drips, or uneven coverage. Cutting edges is shaky. To progress: Practice rolling and edge-cutting technique.',
              s.advanced_beginner_level = 'Paints walls with even coverage. Edge work is improving but sometimes rough. Some brush marks visible. To progress: Refine technique and brush control.',
              s.competent_level = 'Paints walls smoothly with even finish. Clean edge work. Professional appearance with proper preparation. To progress: Learn advanced techniques (trim, multiple colors).',
              s.proficient_level = 'Paints professionally with fluid, intuitive technique. Excellent edge work. Expert prep work and finish. Works efficiently. To progress: Master complex color combinations and specialty finishes.',
              s.expert_level = 'Achieves professional-quality interior painting. Expert edge work, finish, and color application. Handles complex color schemes flawlessly. Knows advanced techniques and specialty finishes.';

MERGE (s:Skill {name: 'Caulking'})
ON CREATE SET s.description = 'The ability to properly apply caulk to gaps and seams in bathrooms, kitchens, and elsewhere to waterproof and finish edges aesthetically',
              s.how_to_develop = 'Watch detailed caulking tutorials focusing on technique. Practice on non-critical areas first. Get feedback from experienced homeowners. Expected time: 2-3 weeks.',
              s.novice_level = 'Can apply caulk with instructions. Bead is uneven or messy. Often too much or too little. Drying results are spotty. To progress: Practice bead consistency and smoothing.',
              s.advanced_beginner_level = 'Applies even bead. Smoothing technique is improving. Some areas still uneven. To progress: Practice on longer seams with consistent results.',
              s.competent_level = 'Applies professional-quality caulk bead. Smooth, even, consistent. Clean waterproofing. To progress: Learn specialty caulk types.',
              s.proficient_level = 'Caulks fluidly with expert technique. Perfect bead consistency and smoothness. Intuitive product selection. To progress: Master advanced applications.',
              s.expert_level = 'Achieves perfect caulking on any surface. Expert bead control and smoothing. Seamless waterproofing and finishing. Selects specialty products expertly.';

MERGE (s:Skill {name: 'Faucet Cartridge Replacement'})
ON CREATE SET s.description = 'The ability to safely replace worn cartridge valves in faucets to stop leaks without requiring professional plumbing help',
              s.how_to_develop = 'Study your specific faucet model and cartridge design. Watch replacement videos for your model. Gather correct tools and replacement cartridge. Practice on a secondary faucet first. Expected time: 2-3 weeks.',
              s.novice_level = 'Can follow step-by-step instructions for cartridge replacement. Assembly is sometimes incorrect. Leaks may result from improper reassembly. To progress: Review cartridge orientation and assembly carefully.',
              s.advanced_beginner_level = 'Replaces cartridge correctly with occasional reference checks. Assembly usually correct but sometimes leaks. To progress: Develop intuitive feel for proper assembly.',
              s.competent_level = 'Replaces faucet cartridges smoothly and correctly. No leaks after replacement. Comfortable with process. To progress: Handle different faucet models confidently.',
              s.proficient_level = 'Replaces cartridges intuitively on most faucet models. Handles variations smoothly. Perfect assembly and no leaks. To progress: Master specialty or complex cartridge systems.',
              s.expert_level = 'Expertly replaces cartridges on any faucet model. Understands variations and adapts seamlessly. Perfect results every time. Can diagnose when cartridge replacement will solve problem.';

MERGE (s:Skill {name: 'GFCI Outlet Testing and Maintenance'})
ON CREATE SET s.description = 'The ability to test GFCI (Ground Fault Circuit Interrupter) outlets to ensure they function properly and provide protection against electrical shock',
              s.how_to_develop = 'Locate all GFCI outlets in your home (bathrooms, kitchen, outdoor). Learn test/reset buttons. Practice testing monthly. Expected time: 1-2 weeks.',
              s.novice_level = 'Can locate GFCI outlets with instruction. Tests hesitantly. Sometimes forgets regular testing. To progress: Establish monthly testing routine.',
              s.advanced_beginner_level = 'Tests GFCI outlets regularly. Understands test vs. reset buttons. Recognizes non-functional GFCIs. To progress: Develop systematic testing protocol.',
              s.competent_level = 'Systematically tests all GFCIs monthly. Maintains records. Knows when replacement is needed. To progress: Understand GFCI protection coverage areas.',
              s.proficient_level = 'Maintains GFCI protection intuitively. Automatically tests on schedule. Knows coverage areas and recognizes protection gaps. To progress: Handle specialty GFCI installations.',
              s.expert_level = 'Expertly maintains comprehensive GFCI protection. Understands electrical safety principles. Ensures optimal protection throughout home. Can identify when additional outlets are needed.';

MERGE (s:Skill {name: 'Toilet Flapper Replacement'})
ON CREATE SET s.description = 'The ability to identify failing toilet flappers and replace them to stop phantom flushing and toilet running, saving water',
              s.how_to_develop = 'Study toilet tank anatomy. Practice accessing and examining flappers in your toilets. Learn to identify worn versus functional flappers. Expected time: 1-2 weeks.',
              s.novice_level = 'Can access toilet tank with instructions. Identifying flapper condition is uncertain. Replacement is clumsy. To progress: Practice identifying flapper wear signs.',
              s.advanced_beginner_level = 'Recognizes worn flappers reliably. Replacement is usually successful. To progress: Develop smooth replacement technique.',
              s.competent_level = 'Quickly identifies worn flappers. Replaces smoothly and correctly. No leaks after replacement. To progress: Handle specialty flapper types.',
              s.proficient_level = 'Diagnoses toilet leak issues intuitively. Replaces flappers fluidly. Expert, quick execution. To progress: Master complex toilet repair issues.',
              s.expert_level = 'Expertly diagnoses and corrects all toilet water loss issues. Understands different flapper types and optimal selection. Can address related sealing problems comprehensively.';

MERGE (s:Skill {name: 'Gutter Cleaning'})
ON CREATE SET s.description = 'The ability to safely access and clean gutters to prevent water damage, including proper ladder technique and debris removal',
              s.how_to_develop = 'Learn safe ladder technique from instructional resources. Start with single-story gutter cleaning. Practice proper equipment handling. Expected time: 2-3 weeks.',
              s.novice_level = 'Can clean gutters with supervision or very careful preparation. Often misses debris. Ladder technique is nervous. To progress: Practice thorough debris removal.',
              s.advanced_beginner_level = 'Cleans gutters adequately with careful ladder technique. Most debris removed. Some areas require re-cleaning. To progress: Develop thoroughness and efficiency.',
              s.competent_level = 'Thoroughly cleans gutters safely and efficiently. Removes all visible debris. Checks for problems. To progress: Learn preventive approaches.',
              s.proficient_level = 'Cleans gutters fluidly and safely from memory of technique. Spots potential problems. Works efficiently at height. To progress: Handle complex gutter systems.',
              s.expert_level = 'Expertly cleans gutters while assessing system integrity. Safe and efficient at any height. Spots emerging problems early. Can recommend preventive improvements.';

// ADVANCED SKILLS - Advanced Level

MERGE (s:Skill {name: 'Plumbing Problem Diagnosis'})
ON CREATE SET s.description = 'The ability to diagnose complex plumbing issues including pressure problems, recurring leaks, and flow issues by understanding water systems',
              s.how_to_develop = 'Study residential plumbing system design thoroughly. Examine and map your own plumbing system. Observe plumbing problems with experienced plumbers. Expected time: 6-8 weeks.',
              s.novice_level = 'Can identify obvious plumbing problems (leaks, clogs). Diagnosis requires plumber consultation. To progress: Study plumbing system design.',
              s.advanced_beginner_level = 'Diagnoses common plumbing problems with some accuracy. Recognizes patterns in related problems. To progress: Build deeper system understanding.',
              s.competent_level = 'Accurately diagnoses most plumbing problems. Understands water pressure and flow issues. Makes sound repair decisions. To progress: Handle complex system interactions.',
              s.proficient_level = 'Quickly diagnoses complex plumbing problems. Intuitively understands system interactions. Predicts problems before they worsen. To progress: Master specialty plumbing systems.',
              s.expert_level = 'Expertly diagnoses any plumbing problem instantly. Understands subtle system interactions and implications. Can solve complex issues creatively. Communicates findings perfectly to professionals.';

MERGE (s:Skill {name: 'Electrical Circuit Troubleshooting'})
ON CREATE SET s.description = 'The ability to troubleshoot electrical problems including dead outlets, flickering lights, and tripped breakers to identify causes and determine solutions',
              s.how_to_develop = 'Study your electrical panel and circuit layout. Learn to use a multimeter safely. Practice troubleshooting with guidance from electricians. Expected time: 6-8 weeks.',
              s.novice_level = 'Can identify that electrical problems exist. Troubleshooting requires professional help. To progress: Learn circuit basics.',
              s.advanced_beginner_level = 'Identifies some electrical problems (dead outlets, breaker trips). Diagnosis is incomplete. To progress: Learn to use diagnostic tools.',
              s.competent_level = 'Troubleshoots most electrical problems accurately. Uses multimeter effectively. Makes sound judgments about when to call electrician. To progress: Handle complex circuit issues.',
              s.proficient_level = 'Quickly identifies electrical problems. Intuitively uses diagnostic tools. Understands circuit interactions. To progress: Master complex wiring systems.',
              s.expert_level = 'Expertly diagnoses any electrical problem. Understands subtle circuit interactions. Can solve complex issues creatively. Knows exactly when professional involvement is needed.';

MERGE (s:Skill {name: 'Home System Integration Understanding'})
ON CREATE SET s.description = 'The ability to understand how different home systems interact and affect each other to identify root causes of multi-system problems',
              s.how_to_develop = 'Map and study your home systems comprehensively. Study building science principles. Observe how HVAC affects moisture, how plumbing affects structure, etc. Expected time: 8-12 weeks.',
              s.novice_level = 'Sees home systems as separate and independent. Recognizes that problems sometimes relate to multiple systems. To progress: Study system interactions.',
              s.advanced_beginner_level = 'Recognizes some system interactions. Understands a few key relationships (humidity affects HVAC, moisture affects wood). To progress: Study comprehensive system interactions.',
              s.competent_level = 'Understands major system interactions. Can identify problems caused by system conflicts. Makes holistic repair decisions. To progress: Build deeper system knowledge.',
              s.proficient_level = 'Intuitively understands system interactions. Spots problems that others miss due to understanding connections. Makes sophisticated decisions. To progress: Master specialty system combinations.',
              s.expert_level = 'Mastery of how all home systems interact comprehensively. Spots subtle problems from understanding deep connections. Makes sophisticated decisions considering all factors.';

MERGE (s:Skill {name: 'Moisture and Water Intrusion Assessment'})
ON CREATE SET s.description = 'The ability to identify sources of water intrusion and moisture problems by understanding water movement and finding root causes, not just symptoms',
              s.how_to_develop = 'Study moisture movement in buildings. Examine water damage patterns in your home. Work with moisture specialists. Expected time: 6-8 weeks.',
              s.novice_level = 'Can spot visible water damage and moisture signs. Finding the source is uncertain. To progress: Study water movement patterns.',
              s.advanced_beginner_level = 'Identifies moisture sources approximately. Recognizes common problem areas. To progress: Learn to trace water paths.',
              s.competent_level = 'Accurately identifies most water intrusion sources. Understands water movement patterns. Makes sound repair recommendations. To progress: Handle complex moisture problems.',
              s.proficient_level = 'Quickly identifies water sources intuitively. Understands subtle water movement paths. Makes sophisticated diagnoses. To progress: Master complex moisture situations.',
              s.expert_level = 'Expertly identifies water sources and root causes in any situation. Understands building physics of moisture. Can solve complex problems that stump professionals.';

MERGE (s:Skill {name: 'Preventive Maintenance Scheduling'})
ON CREATE SET s.description = 'The ability to create and maintain systematic preventive maintenance schedules for all home systems to prevent problems before they occur',
              s.how_to_develop = 'Research maintenance requirements for all home systems. Create master maintenance schedule. Implement tracking system. Expected time: 4-6 weeks.',
              s.novice_level = 'Can follow a maintenance checklist with reminders. Inconsistent execution. To progress: Develop personal system for tracking.',
              s.advanced_beginner_level = 'Maintains basic schedule with occasional missed items. Recognizes benefits of preventive care. To progress: Systematize tracking.',
              s.competent_level = 'Maintains comprehensive maintenance schedule reliably. Tracks completed maintenance. Rarely misses items. To progress: Optimize for efficiency.',
              s.proficient_level = 'Maintains intuitive, efficient maintenance schedule. Anticipates needs. Works seamlessly without constant reference. To progress: Master predictive maintenance.',
              s.expert_level = 'Maintains sophisticated, optimized maintenance program. Predicts problems before occurrence. Adjusts based on system performance. Minimizes overall maintenance while maximizing home longevity.';

MERGE (s:Skill {name: 'Seasonal Home Preparation'})
ON CREATE SET s.description = 'The ability to prepare homes for seasonal changes including winterization, spring opening, and protecting homes from seasonal hazards',
              s.how_to_develop = 'Research seasonal maintenance needs for your climate. Execute each season\'s preparation carefully. Refine approach yearly. Expected time: 2-3 seasonal cycles.',
              s.novice_level = 'Can complete seasonal tasks with checklists. Often misses items. Execution quality varies. To progress: Study seasonal maintenance thoroughly.',
              s.advanced_beginner_level = 'Completes most seasonal preparations adequately. Minor items sometimes missed. Results mostly effective. To progress: Develop systematic approach.',
              s.competent_level = 'Systematically completes all seasonal preparations. Proper timing and thoroughness. Effective results. To progress: Optimize approach for efficiency.',
              s.proficient_level = 'Executes seasonal preparations intuitively. Timing is automatic. Thorough and efficient. To progress: Anticipate climate variations.',
              s.expert_level = 'Expertly prepares home for any seasonal conditions. Anticipates climate variations. Prevents seasonal problems completely. Optimizes for comfort and efficiency.';

// EXPERT SKILLS - Master Level

MERGE (s:Skill {name: 'Advanced Diagnostic Tool Operation'})
ON CREATE SET s.description = 'The ability to operate thermal imaging cameras, moisture meters, pressure testing equipment, and other advanced diagnostic tools to identify hidden problems systematically',
              s.how_to_develop = 'Take advanced diagnostic training courses. Practice extensively with each tool. Learn to interpret readings accurately. Work with diagnostic specialists. Expected time: 10-12 weeks.',
              s.novice_level = 'Can operate diagnostic tools with instructions. Interprets readings uncertainly. Makes mistakes in data collection. To progress: Practice tool operation extensively.',
              s.advanced_beginner_level = 'Operates diagnostic tools with moderate skill. Readings are often correct but sometimes misinterpreted. To progress: Learn advanced interpretation.',
              s.competent_level = 'Operates diagnostic tools competently. Correctly interprets most readings. Identifies obvious problems. To progress: Learn subtle interpretation.',
              s.proficient_level = 'Operates all diagnostic tools with expertise. Interprets readings accurately and subtly. Identifies complex problems. To progress: Master integrated diagnostic protocols.',
              s.expert_level = 'Expert operation of all diagnostic tools. Interprets subtle readings and complex data sets. Combines multiple tools for comprehensive assessment. Identifies problems others miss.';

MERGE (s:Skill {name: 'Home Retrofitting and System Optimization'})
ON CREATE SET s.description = 'The ability to identify and implement improvements that optimize home efficiency, comfort, and resilience through thoughtful system modifications',
              s.how_to_develop = 'Study energy efficiency and building science in depth. Research retrofit technologies and strategies. Plan and execute optimization projects. Expected time: 12-16 weeks.',
              s.novice_level = 'Can identify obvious efficiency improvements. Retrofit concepts are not well understood. To progress: Study energy efficiency comprehensively.',
              s.advanced_beginner_level = 'Recognizes several optimization opportunities. Understands basic retrofit strategies. To progress: Develop comprehensive optimization vision.',
              s.competent_level = 'Identifies multiple optimization opportunities. Plans basic retrofit projects. Implements improvements effectively. To progress: Handle complex optimization.',
              s.proficient_level = 'Intuitively identifies optimization opportunities. Plans sophisticated improvements. Implements changes systematically. To progress: Develop integrated optimization strategies.',
              s.expert_level = 'Expert in comprehensive home optimization. Plans sophisticated integrated improvements. Maximizes efficiency, comfort, and resilience. Adapts strategies to specific home characteristics.';

MERGE (s:Skill {name: 'Mentoring Homeowners in Home Maintenance'})
ON CREATE SET s.description = 'The ability to teach other homeowners maintenance skills, diagnose their problems, and build their confidence in home care',
              s.how_to_develop = 'Teach maintenance skills to friends and family. Develop clear explanations of complex concepts. Take teaching and communication courses. Expected time: 8-10 weeks.',
              s.novice_level = 'Can explain maintenance concepts but sometimes unclearly. Teaching is sometimes frustrating for students. To progress: Develop communication skills.',
              s.advanced_beginner_level = 'Explains concepts usually clearly. Students understand basic points. Some gaps in teaching effectiveness. To progress: Refine teaching approach.',
              s.competent_level = 'Teaches maintenance effectively to varied students. Concepts are clear and understood. Students gain confidence and skills. To progress: Develop advanced teaching strategies.',
              s.proficient_level = 'Mentors effectively with intuitive understanding of learner needs. Adjusts explanation style fluidly. Builds confidence masterfully. To progress: Develop formal teaching programs.',
              s.expert_level = 'Expert teacher and mentor in home maintenance. Adapts to all learning styles. Builds confidence and competence in any student. Can develop comprehensive educational programs.';

MERGE (s:Skill {name: 'Complex Repair Decision Making'})
ON CREATE SET s.description = 'The ability to make sophisticated decisions about when to repair versus replace systems, considering costs, reliability, and long-term value',
              s.how_to_develop = 'Study failure patterns and repair economics. Make intentional repair/replace decisions over years. Analyze outcomes and learn from decisions. Expected time: 12-18 months.',
              s.novice_level = 'Makes repair/replace decisions with uncertainty. Outcomes sometimes regrettable. Limited economic analysis. To progress: Study repair economics.',
              s.advanced_beginner_level = 'Makes mostly sound repair/replace decisions. Some economic analysis but incomplete. To progress: Develop decision frameworks.',
              s.competent_level = 'Makes sound repair/replace decisions with economic analysis. Considers multiple factors appropriately. To progress: Handle edge cases and complex situations.',
              s.proficient_level = 'Makes sophisticated decisions intuitively. Considers numerous factors fluidly. Outcomes are usually optimal. To progress: Develop predictive failure analysis.',
              s.expert_level = 'Expert decision-making considering all factors comprehensively. Predicts future costs and failures. Maximizes long-term home value. Rarely makes suboptimal decisions.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

MERGE (t:Trait {name: 'Practical Problem Solving'})
ON CREATE SET t.description = 'The ability to analyze home maintenance issues systematically, identify root causes, and develop practical solutions using available resources and knowledge',
              t.measurement_criteria = 'Assessed through ability to diagnose problems and determine solutions. Low (0-25): Struggles to understand maintenance problems, often misdiagnoses issues. Moderate (26-50): Can identify obvious problems and follow standard solutions with guidance. High (51-75): Quickly diagnoses most problems and develops effective solutions independently. Exceptional (76-100): Intuitively diagnoses complex problems and develops sophisticated solutions others may miss.';

MERGE (t:Trait {name: 'Manual Dexterity'})
ON CREATE SET t.description = 'The ability to perform fine and gross motor control when using tools, making precise adjustments, and executing repairs requiring hand coordination and control',
              t.measurement_criteria = 'Assessed through ability to use tools precisely and efficiently. Low (0-25): Clumsy with tools, difficulty controlling movements, frequently makes mistakes. Moderate (26-50): Can use tools with concentration, occasional slips or imprecision. High (51-75): Uses tools smoothly with good precision and minimal errors. Exceptional (76-100): Exceptional tool control with fluid, precise movements in any situation.';

MERGE (t:Trait {name: 'Attention to Detail'})
ON CREATE SET t.description = 'The capacity to notice small issues, follow procedures carefully, and maintain thoroughness in maintenance tasks where small oversights can cause problems',
              t.measurement_criteria = 'Assessed through quality of work and ability to spot problems. Low (0-25): Overlooks important details, misses obvious problems, work is often incomplete. Moderate (26-50): Usually notices significant issues, adequate attention to procedures. High (51-75): Consistently notices details, rarely misses important items in inspection or execution. Exceptional (76-100): Exceptional attention to detail, spots subtle problems and inconsistencies others miss.';

MERGE (t:Trait {name: 'Physical Strength'})
ON CREATE SET t.description = 'The physical capability to perform demanding maintenance tasks including lifting, pushing, pulling, and sustained physical effort required for home repairs',
              t.measurement_criteria = 'Assessed through capacity to perform physical maintenance tasks. Low (0-25): Cannot perform many physically demanding maintenance tasks, limited lifting ability. Moderate (26-50): Can manage basic physical tasks with some difficulty, moderate lifting capacity. High (51-75): Comfortably performs most physically demanding maintenance without fatigue. Exceptional (76-100): Exceptional strength, easily handles very demanding physical work and sustained effort.';

MERGE (t:Trait {name: 'Systematic Thinking'})
ON CREATE SET t.description = 'The capacity to organize information logically, follow sequences, understand cause-and-effect relationships, and apply methodical approaches to complex maintenance challenges',
              t.measurement_criteria = 'Assessed through ability to work through complex processes logically. Low (0-25): Struggles with sequential thinking, difficulty following complex procedures. Moderate (26-50): Can follow procedures with written instructions, basic logical thinking. High (51-75): Thinks logically through complex problems, understands system relationships well. Exceptional (76-100): Exceptional systematic thinking, intuitively understands complex systems and their interactions.';

MERGE (t:Trait {name: 'Conscientiousness'})
ON CREATE SET t.description = 'The tendency to be thorough, reliable, responsible about maintenance obligations, and committed to preventive care even when not immediately necessary',
              t.measurement_criteria = 'Assessed through reliability and follow-through on maintenance. Low (0-25): Inconsistent with maintenance, often neglects preventive care, unreliable follow-through. Moderate (26-50): Maintains basic schedule when motivated, occasionally skips maintenance. High (51-75): Consistently performs preventive maintenance reliably, maintains good commitment. Exceptional (76-100): Exceptionally conscientious about maintenance, meticulous and reliable in all home care responsibilities.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// NOVICE LEVEL MILESTONES

MERGE (m:Milestone {name: 'Complete Home Safety Audit'})
ON CREATE SET m.description = 'Identify and document all safety issues in your home including electrical hazards, water shut-off locations, and fire safety equipment. A foundational milestone demonstrating proactive home awareness.',
              m.how_to_achieve = 'Walk through your entire home with a safety checklist covering electrical outlets and panels, water shut-offs, fire extinguishers, smoke/CO detectors, and emergency supplies. Document findings with photos. Should take 2-3 hours. Share findings with household members.';

MERGE (m:Milestone {name: 'Replace HVAC Filter Successfully'})
ON CREATE SET m.description = 'Locate, measure, and successfully replace a furnace or air conditioning filter without requiring assistance. Marks the beginning of independent home system maintenance.',
              m.how_to_achieve = 'Find your HVAC unit and locate the filter housing. Read your system manual to understand filter type and size. Purchase the correct filter size. Remove old filter, note filter direction, insert new filter correctly. This typically takes 15-30 minutes. Verify system runs normally afterward.';

MERGE (m:Milestone {name: 'Clear a Clogged Drain'})
ON CREATE SET m.description = 'Successfully unclog a drain using a plunger or drain snake without professional help. Demonstrates ability to handle common household problems independently.',
              m.how_to_achieve = 'Identify the clogged drain. For simple clogs, use a quality plunger with proper technique - fill sink/tub partially with water, place plunger over drain, pump vigorously 15-20 times. For harder clogs, use a drain snake by feeding it into the drain and rotating to catch debris. Expected success on first try: 60% of clogs. Time: 15-45 minutes.';

MERGE (m:Milestone {name: 'Test All Smoke Detectors in Home'})
ON CREATE SET m.description = 'Systematically test every smoke detector in your home using test buttons and verify functionality. Essential milestone for family safety.',
              m.how_to_achieve = 'Locate all smoke detectors (typically one per bedroom, one in kitchen, one in hallway). Press test button on each detector until alarm sounds (or use canned smoke if detector does not have test button). Note any that do not alarm and replace batteries or units. This typically takes 30 minutes for a typical home.';

MERGE (m:Milestone {name: 'Establish Monthly Maintenance Schedule'})
ON CREATE SET m.description = 'Create a written maintenance schedule for your home listing tasks to be completed monthly, including HVAC filter checks, drain cleaning, and system inspections.',
              m.how_to_achieve = 'Research typical monthly maintenance tasks for your home type. Create a document or use a maintenance app listing tasks and frequencies. Set calendar reminders. Include: HVAC filter checks, visible leak inspections, drain testing, thermostat verification. Review schedule with household members. Time: 1-2 hours initial setup.';

// DEVELOPING LEVEL MILESTONES

MERGE (m:Milestone {name: 'Repair a Leaky Faucet'})
ON CREATE SET m.description = 'Diagnose a dripping faucet and successfully replace the cartridge or fix the leak without calling a plumber. Marks progression in plumbing repair competence.',
              m.how_to_achieve = 'Identify the faucet type (cartridge, ball valve, ceramic disk) using manufacturer information. Purchase correct replacement cartridge. Turn off water supply to faucet. Remove handle and trim. Extract old cartridge (may require special tool). Install new cartridge, ensuring proper orientation. Reassemble faucet. Test for leaks. Takes 30 minutes to 1 hour.';

MERGE (m:Milestone {name: 'Patch and Paint a Wall Section'})
ON CREATE SET m.description = 'Repair drywall damage (holes, dents) by patching and finishing, then paint the area so damage is invisible. Demonstrates interior surface maintenance skills.',
              m.how_to_achieve = 'Clean hole edges with putty knife. Apply joint compound, allow to dry (follow manufacturer timing). Sand smooth. Apply additional coats if needed for seamless finish. Primer paint over patched area. Paint final coat to match existing wall. For a 4-6 inch damage area: 2-4 hours (including drying time).';

MERGE (m:Milestone {name: 'Clean Gutters from Ladder'})
ON CREATE SET m.description = 'Access gutters safely from a ladder and remove all debris, demonstrating comfort at heights and understanding of gutter function.',
              m.how_to_achieve = 'Position 24-30 foot ladder safely against gutters using proper technique (3-4 feet from wall base). Wear work gloves and eye protection. Use gutter scoop or hands to remove leaves, dirt, and debris. Place debris in bucket or tarp below. Check for damage or proper drainage. Flush gutters with water to test flow. For typical single-story home: 1-2 hours.';

MERGE (m:Milestone {name: 'Winterize Outdoor Water Systems'})
ON CREATE SET m.description = 'Prepare outdoor water systems for freezing temperatures by draining lines and disconnecting hoses. Essential seasonal maintenance milestone.',
              m.how_to_achieve = 'Before first freeze, turn off outdoor water shut-off valve (typically in basement or crawlspace). Drain hoses by opening lowest faucet and allowing water to run out. Disconnect and store hoses properly. Close outdoor shut-off valve. Check weather sealing on hose connection points. Time: 30-45 minutes. Typically done in fall in cold climates.';

MERGE (m:Milestone {name: 'Replace Toilet Flapper'})
ON CREATE SET m.description = 'Identify a running toilet caused by worn flapper and replace it without professional help. Common repair demonstrating water system knowledge.',
              m.how_to_achieve = 'Listen to toilet and observe if water runs continuously or phantom flushes. Turn off toilet water supply and flush to empty tank. Look inside tank and locate flapper (rubber disc at tank bottom). Purchase replacement flapper matching your toilet model. Remove old flapper from pins and install new one. Test for proper operation. Time: 20-30 minutes.';

MERGE (m:Milestone {name: 'Apply Weatherstripping to First Door'})
ON CREATE SET m.description = 'Successfully apply weatherstripping to a door to reduce air leaks and improve home efficiency. First energy efficiency improvement milestone.',
              m.how_to_achieve = 'Choose appropriate weatherstripping type (foam tape, v-strip, or door sweep). Inspect door frame for existing gaps. Clean surface thoroughly. Measure and cut weatherstripping to length. Apply adhesive backing, pressing firmly into place. Close door and check for proper seal. Verify no obstruction of door closing. Time: 30-45 minutes per door.';

// COMPETENT LEVEL MILESTONES

MERGE (m:Milestone {name: 'Diagnose and Fix Electrical Outlet Problem'})
ON CREATE SET m.description = 'Successfully diagnose why an outlet is dead and implement fix (reset GFCI, fix breaker, identify bad circuit) without professional help.',
              m.how_to_achieve = 'Test outlet with working lamp or outlet tester to confirm it is dead. Check nearby outlets for patterns. Identify if outlet is on same circuit with tripped breaker by checking electrical panel. If GFCI outlet nearby, test and reset if tripped. If breaker tripped, reset it. Test outlet again. If still dead, map circuits to understand which breaker controls outlet. Document findings. Time: 30 minutes to 1 hour.';

MERGE (m:Milestone {name: 'Identify and Replace HVAC Filter Regularly'})
ON CREATE SET m.description = 'Establish a habit of checking and replacing HVAC filters on schedule (every 3 months or per manufacturer recommendation) for a full year without missing a replacement.',
              m.how_to_achieve = 'After first successful filter replacement, set calendar reminders for every 3 months. When reminder appears, check filter condition (hold to light - if dark, needs replacing). Replace if needed. Document each check and replacement. Maintain record for 12 months. By end of year, this should be automatic habit. Time: 15 minutes each check.';

MERGE (m:Milestone {name: 'Complete Interior Room Painting'})
ON CREATE SET m.description = 'Prepare and paint an entire room (walls and trim) achieving professional-quality results without professional help.',
              m.how_to_achieve = 'Prepare room: move furniture, remove outlet covers, apply painter\'s tape around trim and baseboards. Prime walls if needed. Apply two coats of paint to walls using proper rolling technique. Carefully paint trim and cut edges. Remove tape while paint slightly wet. Final touch-ups. Clean and organize. For typical bedroom: 2-3 days (including drying time), 8-12 hours active work.';

MERGE (m:Milestone {name: 'Identify Water Intrusion Source'})
ON CREATE SET m.description = 'Investigate water stains or moisture in home, trace the source of intrusion accurately, and recommend fix. Demonstrates problem-solving across systems.',
              m.how_to_achieve = 'Document location of water stains or moisture with photos. Examine exterior of home near stain location - look for drainage issues, cracks, missing caulk, or improperly graded soil. Trace potential water paths from exterior to interior. Consider if problem occurs during rain, snow melt, or irrigation. Look for patterns in timing. Document findings with photos and notes. Time: 1-2 hours initial investigation.';

MERGE (m:Milestone {name: 'Perform Comprehensive Home Inspection'})
ON CREATE SET m.description = 'Conduct a thorough system-by-system inspection of your home covering HVAC, plumbing, electrical, roof, structure, and major appliances, documenting findings.',
              m.how_to_achieve = 'Use comprehensive home inspection checklist covering: roof condition, gutters, exterior, foundation, basement/crawlspace, windows/doors, HVAC system, plumbing system, electrical panel, all appliances, interior surfaces, moisture signs. Document each area with photos and notes. Identify any immediate concerns. Create prioritized list of items needing attention. Time: 4-6 hours for thorough inspection.';

MERGE (m:Milestone {name: 'Successfully Caulk Bathroom or Kitchen'})
ON CREATE SET m.description = 'Replace all failed caulk in a bathroom or kitchen achieving professional-looking, waterproof seals.',
              m.how_to_achieve = 'Identify all caulk areas (counters, backsplash, fixtures, edges). Remove old caulk with caulk removal tool or scraper. Clean surface thoroughly with caulk solvent and allow to dry completely. Apply painter\'s tape to either side of caulk line. Use caulking gun to apply even bead of caulk. Smooth with wet finger or caulk tool. Remove tape immediately after application. Allow to cure fully (24 hours). Time: 2-4 hours depending on area size.';

MERGE (m:Milestone {name: 'Create Seasonal Maintenance Checklist'})
ON CREATE SET m.description = 'Develop comprehensive seasonal preparation checklists (winter and summer) covering all seasonal maintenance tasks specific to your home and climate.',
              m.how_to_achieve = 'Research seasonal maintenance for your specific climate and home type. Winter checklist might include: weatherization, water drainage, heating system check, emergency supplies. Summer checklist might include: A/C servicing, outdoor prep, yard drainage. Create detailed lists with specific timelines. Share with household. Implement checklist at appropriate seasons for full year cycle. Time: 4-6 hours research and checklist creation.';

// ADVANCED LEVEL MILESTONES

MERGE (m:Milestone {name: 'Implement Comprehensive Energy Efficiency Improvement'})
ON CREATE SET m.description = 'Plan and execute a major energy efficiency improvement project (whole-home weatherization, insulation upgrade, or HVAC optimization) that measurably reduces energy consumption.',
              m.how_to_achieve = 'Get energy audit from professional if possible. Identify largest energy loss areas. Prioritize improvements by impact and cost. Might include: attic insulation upgrade, basement air sealing, window weatherization, thermostat optimization, appliance upgrades. Execute improvements in phases. Monitor energy bills pre and post implementation to verify 10%+ reduction. Time: 20-40 hours depending on scope of project.';

MERGE (m:Milestone {name: 'Fix Complex Plumbing Issue'})
ON CREATE SET m.description = 'Diagnose and resolve a complex plumbing problem (water pressure issues, recurring leaks, or multi-drain problems) that requires understanding of system interactions.',
              m.how_to_achieve = 'Identify complex plumbing symptom (low pressure in multiple fixtures, repeated leaks in different locations, drainage problems in multiple drains). Map plumbing system to understand water flow and pressure zones. Research potential causes: corroded pipes, mineral buildup, pressure regulator failure, vent blockage. Test hypothesis with visual inspection or water pressure test. Implement solution (replace aerators, clear vents, adjust pressure, clean lines). Verify problem is resolved. Time: 4-8 hours.';

MERGE (m:Milestone {name: 'Perform Preventive Maintenance for All Appliances'})
ON CREATE SET m.description = 'Create and execute preventive maintenance protocol for all major appliances (water heater, HVAC, washer/dryer, dishwasher, etc.) for full year, documenting all work.',
              m.how_to_achieve = 'Research maintenance requirements for each appliance. Create maintenance schedule with specific tasks and timing. For water heater: flush annually, test pressure relief valve. For HVAC: replace filters, clean coils, inspect. For appliances: clean filters, inspect seals, check operations. Document each service performed with date and findings. Maintain records to track reliability. Time: 30 minutes to 1 hour per appliance per year.';

MERGE (m:Milestone {name: 'Successfully Troubleshoot Multi-System Problem'})
ON CREATE SET m.description = 'Resolve a home problem involving interaction of multiple systems (e.g., moisture problem from HVAC/plumbing interaction, comfort issue from insulation/HVAC interplay).',
              m.how_to_achieve = 'Identify a home problem with unclear cause potentially involving multiple systems. Map affected systems and how they interact. Consider moisture, temperature, air flow, water flow, and how changes in one system affect others. Test hypothesis by making adjustments and observing results. Document findings about how systems interact. Implement comprehensive solution addressing root cause. Time: 6-12 hours of investigation and testing.';

MERGE (m:Milestone {name: 'Document Home Systems and Create Reference Manual'})
ON CREATE SET m.description = 'Create comprehensive personal home reference manual documenting all systems, components, maintenance schedules, and emergency procedures, organized for easy access.',
              m.how_to_achieve = 'Organize information on: system locations and shut-offs, equipment model numbers and serial numbers, warranty information, maintenance schedules, service provider contacts, emergency procedures, professional service records, inspection findings. Create digital and/or physical manual. Include diagrams and photos. Share with household members and contractors. Update annually. Time: 8-12 hours initial creation, 2-4 hours annually.';

MERGE (m:Milestone {name: 'Mentor Someone in Home Maintenance'})
ON CREATE SET m.description = 'Teach another homeowner a significant maintenance skill or help them solve a complex home problem, building their confidence and capability.',
              m.how_to_achieve = 'Identify someone (friend, family, neighbor) who wants to learn home maintenance. Choose a specific skill or problem to address together. Teach methodology clearly, explaining why steps matter. Have them perform the work while you guide. Follow up to ensure they can do it independently next time. Document what you teach to help your student remember. Time: 3-6 hours depending on complexity.';

// MASTER LEVEL MILESTONES

MERGE (m:Milestone {name: 'Become Known Home Maintenance Resource in Community'})
ON CREATE SET m.description = 'Achieve recognition in your community as someone with home maintenance expertise that friends, family, and neighbors seek out for advice and help.',
              m.how_to_achieve = 'Develop and share home maintenance knowledge through informal teaching to multiple people over 2+ years. Help neighbors solve problems and improve their homes. Earn reputation for practical expertise and problem-solving ability. Track instances where people seek your advice or assistance. Mentor at least 3-5 different people in various skills. Achieve point where you\'re regularly consulted. Time: Ongoing 2+ year effort.';

MERGE (m:Milestone {name: 'Execute Major Home System Overhaul'})
ON CREATE SET m.description = 'Plan and execute comprehensive upgrade or overhaul of a major home system (electrical panel upgrade, water line replacement, comprehensive weatherization project) demonstrating mastery.',
              m.how_to_achieve = 'Identify a major system requiring significant work (aging plumbing, outdated electrical, severe insulation gaps). Conduct thorough assessment of current system condition. Research modern alternatives and best practices. Develop detailed implementation plan with budget and timeline. Execute project in phases, maintaining home habitability. Document work thoroughly with photos and diagrams. Coordinate with professionals as needed. Time: 40-80+ hours depending on scope.';

MERGE (m:Milestone {name: 'Achieve Certified Energy Efficiency Rating'})
ON CREATE SET m.description = 'Complete home energy efficiency audit and implement improvements to achieve recognized certification (ENERGY STAR, Net Zero readiness, or similar).',
              m.how_to_achieve = 'Engage certified energy auditor for professional assessment. Understand recommendations and efficiency targets. Implement recommended improvements systematically. Might include insulation, HVAC upgrade, window replacement, water heater replacement, solar consideration. Achieve baseline energy consumption target for certification level. Pass final certification inspection/testing. Time: 20-40 hours of work plus professional services.';

MERGE (m:Milestone {name: 'Build Complete Home Diagnostic Capability'})
ON CREATE SET m.description = 'Develop ability to diagnose complex home problems using multiple diagnostic approaches and advanced tools (thermal imaging, moisture meters, pressure testing).',
              m.how_to_achieve = 'Obtain diagnostic tools (thermal camera, moisture meter, combustion analyzer, pressure gauge appropriate for your interests). Take training on tool operation and interpretation. Practice diagnosing problems using multiple tools. Document findings and verify accuracy against professional diagnoses. Develop systematic diagnostic protocols for different problem types. Maintain detailed diagnostic findings and outcomes. Time: 15-20 weeks of training and practice.';

MERGE (m:Milestone {name: 'Develop Specialized Home Maintenance Expertise'})
ON CREATE SET m.description = 'Achieve recognized expertise in a specialized home maintenance domain (historic home restoration, zero-waste home management, specific climate adaptation, or advanced system mastery).',
              m.how_to_achieve = 'Select a specialized area matching your home and interests (e.g., period restoration for historic home, passive house principles, climate resilience, greywater systems, smart home integration). Study extensively: books, courses, professional literature, case studies. Engage with subject matter experts. Apply learning to your own home and document results. Teach others in your specialty. Build reputation for expertise. Time: 15-25 weeks of intensive study and application.';

MERGE (m:Milestone {name: 'Create Educational Content on Home Maintenance'})
ON CREATE SET m.description = 'Create instructional materials (blog, video series, workshop curriculum, or guide) teaching home maintenance to others, demonstrating mastery through ability to communicate expertise.',
              m.how_to_achieve = 'Choose topic within your expertise area. Create educational content: write comprehensive guide with photos, produce video tutorials, or develop workshop curriculum. Content should be clear, well-organized, and practically useful. Share with community (online or local). Gather feedback and refine. Create at least 5-10 substantial pieces of content. Track usage/feedback. Time: 20-30 hours of creation plus ongoing updates.';

MERGE (m:Milestone {name: 'Achieve Total Home System Mastery'})
ON CREATE SET m.description = 'Reach mastery of all major home systems and their interactions, enabling sophisticated decision-making across complex, integrated home challenges without need for external expertise.',
              m.how_to_achieve = 'After years of learning and practice (3-5+ years minimum), reach point where you deeply understand all home systems and how they interact. Can diagnose complex multi-system problems independently. Understand building science principles thoroughly. Make sophisticated decisions balancing efficiency, reliability, durability, and cost. This is culmination of extensive learning and real-world experience. Demonstrated through successful resolution of multiple complex problems.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// KNOWLEDGE PREREQUISITES

// Foundational knowledge prerequisites
MATCH (k1:Knowledge {name: 'Plumbing System Fundamentals'})
MATCH (k2:Knowledge {name: 'Basic Home Safety'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Electrical System Fundamentals'})
MATCH (k2:Knowledge {name: 'Basic Home Safety'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'HVAC System Care'})
MATCH (k2:Knowledge {name: 'Home Systems Overview'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Roof and Gutter Maintenance'})
MATCH (k2:Knowledge {name: 'Home Systems Overview'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Interior Surface Care and Finishing'})
MATCH (k2:Knowledge {name: 'House Maintenance Tool Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Wood Floor and Carpet Care'})
MATCH (k2:Knowledge {name: 'Interior Surface Care and Finishing'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced knowledge prerequisites
MATCH (k1:Knowledge {name: 'Structural Assessment and Inspection'})
MATCH (k2:Knowledge {name: 'Home Systems Overview'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Analyze'}]->(k2);

MATCH (k1:Knowledge {name: 'Moisture Management and Water Damage Prevention'})
MATCH (k2:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Home Energy Efficiency'})
MATCH (k2:Knowledge {name: 'HVAC System Care'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Home Energy Efficiency'})
MATCH (k2:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Building Science and Home Performance'})
MATCH (k2:Knowledge {name: 'Home Energy Efficiency'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Building Science and Home Performance'})
MATCH (k2:Knowledge {name: 'Moisture Management and Water Damage Prevention'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Appliance Maintenance and Troubleshooting'})
MATCH (k2:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Appliance Maintenance and Troubleshooting'})
MATCH (k2:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Master knowledge prerequisites
MATCH (k1:Knowledge {name: 'Advanced Diagnostic Techniques'})
MATCH (k2:Knowledge {name: 'Building Science and Home Performance'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Sustainable Home Maintenance Practices'})
MATCH (k2:Knowledge {name: 'Home Energy Efficiency'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Teaching and Community Knowledge Sharing'})
MATCH (k2:Knowledge {name: 'Structural Assessment and Inspection'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// SKILL PREREQUISITES

// Basic skill prerequisites
MATCH (s1:Skill {name: 'HVAC Filter Changing'})
MATCH (k:Knowledge {name: 'HVAC System Care'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k);

MATCH (s1:Skill {name: 'Drain Clearing'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Dripping Faucet Diagnosis'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Smoke Detector Testing'})
MATCH (k:Knowledge {name: 'Basic Home Safety'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k);

MATCH (s1:Skill {name: 'Weather Stripping Application'})
MATCH (k:Knowledge {name: 'Home Energy Efficiency'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k);

MATCH (s1:Skill {name: 'Basic Tool Handling'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (s1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

// Intermediate skill prerequisites
MATCH (s1:Skill {name: 'Drywall Patching'})
MATCH (k:Knowledge {name: 'Interior Surface Care and Finishing'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Drywall Patching'})
MATCH (s2:Skill {name: 'Basic Tool Handling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Interior Painting'})
MATCH (k:Knowledge {name: 'Interior Surface Care and Finishing'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Interior Painting'})
MATCH (s2:Skill {name: 'Basic Tool Handling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Caulking'})
MATCH (k:Knowledge {name: 'Interior Surface Care and Finishing'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Faucet Cartridge Replacement'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Faucet Cartridge Replacement'})
MATCH (s2:Skill {name: 'Dripping Faucet Diagnosis'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'GFCI Outlet Testing and Maintenance'})
MATCH (k:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Toilet Flapper Replacement'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Gutter Cleaning'})
MATCH (k:Knowledge {name: 'Roof and Gutter Maintenance'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Gutter Cleaning'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (s1)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

// Advanced skill prerequisites
MATCH (s1:Skill {name: 'Plumbing Problem Diagnosis'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Plumbing Problem Diagnosis'})
MATCH (s2:Skill {name: 'Drain Clearing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Electrical Circuit Troubleshooting'})
MATCH (k:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Electrical Circuit Troubleshooting'})
MATCH (s2:Skill {name: 'GFCI Outlet Testing and Maintenance'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Home System Integration Understanding'})
MATCH (k:Knowledge {name: 'Building Science and Home Performance'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Moisture and Water Intrusion Assessment'})
MATCH (k:Knowledge {name: 'Moisture Management and Water Damage Prevention'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Preventive Maintenance Scheduling'})
MATCH (k:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Seasonal Home Preparation'})
MATCH (k:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

// Expert skill prerequisites
MATCH (s1:Skill {name: 'Advanced Diagnostic Tool Operation'})
MATCH (k:Knowledge {name: 'Advanced Diagnostic Techniques'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Home Retrofitting and System Optimization'})
MATCH (k:Knowledge {name: 'Home Energy Efficiency'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Home Retrofitting and System Optimization'})
MATCH (s2:Skill {name: 'Preventive Maintenance Scheduling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Mentoring Homeowners in Home Maintenance'})
MATCH (k:Knowledge {name: 'Teaching and Community Knowledge Sharing'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Complex Repair Decision Making'})
MATCH (s2:Skill {name: 'Plumbing Problem Diagnosis'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Complex Repair Decision Making'})
MATCH (s2:Skill {name: 'Electrical Circuit Troubleshooting'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// MILESTONE PREREQUISITES

// Developing level milestone prerequisites
MATCH (m1:Milestone {name: 'Repair a Leaky Faucet'})
MATCH (m2:Milestone {name: 'Replace HVAC Filter Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Repair a Leaky Faucet'})
MATCH (s:Skill {name: 'Dripping Faucet Diagnosis'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Patch and Paint a Wall Section'})
MATCH (s:Skill {name: 'Drywall Patching'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Patch and Paint a Wall Section'})
MATCH (s:Skill {name: 'Interior Painting'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Clean Gutters from Ladder'})
MATCH (s:Skill {name: 'Gutter Cleaning'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Winterize Outdoor Water Systems'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (m1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (m1:Milestone {name: 'Replace Toilet Flapper'})
MATCH (s:Skill {name: 'Toilet Flapper Replacement'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Apply Weatherstripping to First Door'})
MATCH (s:Skill {name: 'Weather Stripping Application'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

// Competent level milestone prerequisites
MATCH (m1:Milestone {name: 'Diagnose and Fix Electrical Outlet Problem'})
MATCH (s:Skill {name: 'Electrical Circuit Troubleshooting'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Identify and Replace HVAC Filter Regularly'})
MATCH (m2:Milestone {name: 'Replace HVAC Filter Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete Interior Room Painting'})
MATCH (m2:Milestone {name: 'Patch and Paint a Wall Section'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete Interior Room Painting'})
MATCH (s:Skill {name: 'Interior Painting'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Identify Water Intrusion Source'})
MATCH (s:Skill {name: 'Moisture and Water Intrusion Assessment'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (m1:Milestone {name: 'Perform Comprehensive Home Inspection'})
MATCH (k:Knowledge {name: 'Home Systems Overview'})
CREATE (m1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (m1:Milestone {name: 'Successfully Caulk Bathroom or Kitchen'})
MATCH (s:Skill {name: 'Caulking'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Successfully Caulk Bathroom or Kitchen'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (m1)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (m1:Milestone {name: 'Create Seasonal Maintenance Checklist'})
MATCH (m2:Milestone {name: 'Establish Monthly Maintenance Schedule'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Advanced level milestone prerequisites
MATCH (m1:Milestone {name: 'Implement Comprehensive Energy Efficiency Improvement'})
MATCH (k:Knowledge {name: 'Home Energy Efficiency'})
CREATE (m1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (m1:Milestone {name: 'Implement Comprehensive Energy Efficiency Improvement'})
MATCH (s:Skill {name: 'Preventive Maintenance Scheduling'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Fix Complex Plumbing Issue'})
MATCH (s:Skill {name: 'Plumbing Problem Diagnosis'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Fix Complex Plumbing Issue'})
MATCH (t:Trait {name: 'Systematic Thinking'})
CREATE (m1)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (m1:Milestone {name: 'Perform Preventive Maintenance for All Appliances'})
MATCH (k:Knowledge {name: 'Appliance Maintenance and Troubleshooting'})
CREATE (m1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (m1:Milestone {name: 'Perform Preventive Maintenance for All Appliances'})
MATCH (m2:Milestone {name: 'Create Seasonal Maintenance Checklist'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Troubleshoot Multi-System Problem'})
MATCH (s:Skill {name: 'Home System Integration Understanding'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Document Home Systems and Create Reference Manual'})
MATCH (m2:Milestone {name: 'Perform Comprehensive Home Inspection'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Mentor Someone in Home Maintenance'})
MATCH (s:Skill {name: 'Mentoring Homeowners in Home Maintenance'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s);

// Master level milestone prerequisites
MATCH (m1:Milestone {name: 'Become Known Home Maintenance Resource in Community'})
MATCH (m2:Milestone {name: 'Mentor Someone in Home Maintenance'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Execute Major Home System Overhaul'})
MATCH (m2:Milestone {name: 'Document Home Systems and Create Reference Manual'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Execute Major Home System Overhaul'})
MATCH (s:Skill {name: 'Complex Repair Decision Making'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Achieve Certified Energy Efficiency Rating'})
MATCH (m2:Milestone {name: 'Implement Comprehensive Energy Efficiency Improvement'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Build Complete Home Diagnostic Capability'})
MATCH (s:Skill {name: 'Advanced Diagnostic Tool Operation'})
CREATE (m1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s);

MATCH (m1:Milestone {name: 'Develop Specialized Home Maintenance Expertise'})
MATCH (m2:Milestone {name: 'Document Home Systems and Create Reference Manual'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Educational Content on Home Maintenance'})
MATCH (m2:Milestone {name: 'Become Known Home Maintenance Resource in Community'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Total Home System Mastery'})
MATCH (m2:Milestone {name: 'Successfully Troubleshoot Multi-System Problem'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Total Home System Mastery'})
MATCH (k:Knowledge {name: 'Building Science and Home Performance'})
CREATE (m1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Analyze'}]->(k);

// ============================================================
// LEVEL ASSIGNMENTS: KNOWLEDGE REQUIREMENTS
// ============================================================

// Level 1: Novice - Foundation knowledge at Remember/Understand level
MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (k:Knowledge {name: 'Home Systems Overview'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (k:Knowledge {name: 'Basic Home Safety'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (k:Knowledge {name: 'House Maintenance Tool Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (k:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (k:Knowledge {name: 'Common House Maintenance Terminology'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

// Level 2: Developing - Add plumbing, electrical, HVAC at Understand level
MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Home Systems Overview'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Basic Home Safety'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'HVAC System Care'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (k:Knowledge {name: 'Roof and Gutter Maintenance'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Level 3: Competent - Add interior surfaces, wood floors, apply level knowledge
MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'HVAC System Care'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Interior Surface Care and Finishing'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Wood Floor and Carpet Care'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Preventive Maintenance Principles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (k:Knowledge {name: 'Roof and Gutter Maintenance'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

// Level 4: Advanced - Add advanced knowledge at apply/analyze level
MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Structural Assessment and Inspection'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Home Energy Efficiency'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Moisture Management and Water Damage Prevention'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Appliance Maintenance and Troubleshooting'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Plumbing System Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (k:Knowledge {name: 'Electrical System Fundamentals'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

// Level 5: Master - Comprehensive mastery of all systems
MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (k:Knowledge {name: 'Building Science and Home Performance'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (k:Knowledge {name: 'Advanced Diagnostic Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (k:Knowledge {name: 'Sustainable Home Maintenance Practices'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (k:Knowledge {name: 'Teaching and Community Knowledge Sharing'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (k:Knowledge {name: 'History of Residential Building Practices'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

// ============================================================
// LEVEL ASSIGNMENTS: SKILL REQUIREMENTS
// ============================================================

// Level 1: Novice - Basic skills at Novice level
MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (s:Skill {name: 'Basic Tool Handling'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (s:Skill {name: 'HVAC Filter Changing'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (s:Skill {name: 'Smoke Detector Testing'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Level 2: Developing - Basic/Intermediate skills at Advanced Beginner level
MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Basic Tool Handling'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'HVAC Filter Changing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Drain Clearing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Weather Stripping Application'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Dripping Faucet Diagnosis'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'GFCI Outlet Testing and Maintenance'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Toilet Flapper Replacement'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (s:Skill {name: 'Gutter Cleaning'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

// Level 3: Competent - Intermediate skills at Competent level
MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Drywall Patching'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Interior Painting'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Caulking'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Faucet Cartridge Replacement'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Preventive Maintenance Scheduling'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (s:Skill {name: 'Seasonal Home Preparation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Level 4: Advanced - Advanced skills at Proficient level
MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (s:Skill {name: 'Plumbing Problem Diagnosis'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (s:Skill {name: 'Electrical Circuit Troubleshooting'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (s:Skill {name: 'Home System Integration Understanding'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (s:Skill {name: 'Moisture and Water Intrusion Assessment'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

// Level 5: Master - Expert skills at Expert level
MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (s:Skill {name: 'Advanced Diagnostic Tool Operation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (s:Skill {name: 'Home Retrofitting and System Optimization'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (s:Skill {name: 'Mentoring Homeowners in Home Maintenance'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (s:Skill {name: 'Complex Repair Decision Making'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

// ============================================================
// LEVEL ASSIGNMENTS: TRAIT REQUIREMENTS
// ============================================================

// Level 1: Novice - Basic trait minimums
MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (t:Trait {name: 'Practical Problem Solving'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

// Level 2: Developing - Moderate trait requirements
MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (t:Trait {name: 'Practical Problem Solving'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

// Level 3: Competent - Solid trait requirements
MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (t:Trait {name: 'Practical Problem Solving'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (t:Trait {name: 'Systematic Thinking'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

// Level 4: Advanced - High trait requirements
MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (t:Trait {name: 'Practical Problem Solving'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (t:Trait {name: 'Systematic Thinking'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (t:Trait {name: 'Physical Strength'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

// Level 5: Master - Exceptional trait requirements
MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (t:Trait {name: 'Practical Problem Solving'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 85}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (t:Trait {name: 'Systematic Thinking'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

// ============================================================
// LEVEL ASSIGNMENTS: MILESTONE REQUIREMENTS
// ============================================================

// Level 1: Novice - Foundation milestones (any_of: true for choice)
MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (m:Milestone {name: 'Complete Home Safety Audit'})
CREATE (level1)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (m:Milestone {name: 'Replace HVAC Filter Successfully'})
CREATE (level1)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'House Maintenance Novice'})
MATCH (m:Milestone {name: 'Establish Monthly Maintenance Schedule'})
CREATE (level1)-[:REQUIRES_MILESTONE {required: true}]->(m);

// Level 2: Developing - Multiple core milestones needed
MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (m:Milestone {name: 'Clear a Clogged Drain'})
CREATE (level2)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (m:Milestone {name: 'Test All Smoke Detectors in Home'})
CREATE (level2)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (m:Milestone {name: 'Repair a Leaky Faucet'})
CREATE (level2)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'House Maintenance Developing'})
MATCH (m:Milestone {name: 'Apply Weatherstripping to First Door'})
CREATE (level2)-[:REQUIRES_MILESTONE {required: true}]->(m);

// Level 3: Competent - Comprehensive milestone achievement
MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Patch and Paint a Wall Section'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Clean Gutters from Ladder'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Winterize Outdoor Water Systems'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Replace Toilet Flapper'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Diagnose and Fix Electrical Outlet Problem'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Identify and Replace HVAC Filter Regularly'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Complete Interior Room Painting'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Perform Comprehensive Home Inspection'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Successfully Caulk Bathroom or Kitchen'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'House Maintenance Competent'})
MATCH (m:Milestone {name: 'Create Seasonal Maintenance Checklist'})
CREATE (level3)-[:REQUIRES_MILESTONE {required: true}]->(m);

// Level 4: Advanced - Advanced milestones
MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Implement Comprehensive Energy Efficiency Improvement'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Fix Complex Plumbing Issue'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Perform Preventive Maintenance for All Appliances'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Successfully Troubleshoot Multi-System Problem'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Document Home Systems and Create Reference Manual'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'House Maintenance Advanced'})
MATCH (m:Milestone {name: 'Mentor Someone in Home Maintenance'})
CREATE (level4)-[:REQUIRES_MILESTONE {required: true}]->(m);

// Level 5: Master - Master level milestones
MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Become Known Home Maintenance Resource in Community'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Execute Major Home System Overhaul'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Achieve Certified Energy Efficiency Rating'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Build Complete Home Diagnostic Capability'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Develop Specialized Home Maintenance Expertise'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Create Educational Content on Home Maintenance'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'House Maintenance Master'})
MATCH (m:Milestone {name: 'Achieve Total Home System Mastery'})
CREATE (level5)-[:REQUIRES_MILESTONE {required: true}]->(m);

// ============================================================
// Agent 4: Quality Validation
// ============================================================

// VALIDATION SUMMARY
// Recommendation: APPROVE
// Overall Assessment: Domain is comprehensive, well-structured, and coherent with excellent coverage across all component types. The progression from Novice to Master is logical and realistic for house maintenance skill development. Quality of descriptions and guidance is high, and all content is domain-specific and actionable.

// COVERAGE ASSESSMENT

// Knowledge: COMPREHENSIVE
// - Foundational Level (5 nodes): Home Systems Overview, Basic Home Safety, Tool Fundamentals, Preventive Maintenance Principles, Terminology
// - Core Level (6 nodes): Plumbing, Electrical, HVAC, Roof/Gutter, Interior Surface Care, Flooring
// - Advanced Level (5 nodes): Structural Assessment, Energy Efficiency, Moisture Management, Appliance Maintenance, Building Science
// - Master Level (4 nodes): Residential Building History, Advanced Diagnostics, Sustainable Practices, Teaching & Community
// Assessment: Knowledge progression is logical and well-distributed across all five levels. Each component builds appropriately on previous knowledge. Coverage includes all major home systems (plumbing, electrical, HVAC, structural, roofing) plus specialized areas (energy efficiency, building science, sustainability). No significant gaps identified; domain comprehensively covers what homeowners need to know.

// Skills: COMPREHENSIVE
// - Basic Skills (6 nodes): Tool Handling, HVAC Filter Changing, Faucet Diagnosis, Drain Clearing, Weather Stripping, Smoke Detector Testing
// - Intermediate Skills (9 nodes): Drywall Patching, Interior Painting, Caulking, Faucet Cartridge Replacement, GFCI Testing, Toilet Flapper Replacement, Gutter Cleaning, Plumbing Diagnosis, Electrical Circuit Troubleshooting
// - Advanced Skills (5 nodes): System Integration Understanding, Moisture Assessment, Preventive Maintenance Scheduling, Seasonal Preparation, Advanced Diagnostics
// - Master Skills (5 nodes): Tool Operation, Retrofitting/Optimization, Mentoring, Complex Decision Making, and specialized expertise integration
// Assessment: 23 skill nodes provide excellent coverage from basic to master level. Each skill is practical, actionable, and domain-specific. Skills progress logically from simple (filter changing) to complex (system integration understanding). Skill descriptions include detailed development guidance and clear progression pathways using Dreyfus model (novice through expert).

// Traits: ADEQUATE
// - Six traits identified: Practical Problem Solving, Manual Dexterity, Attention to Detail, Physical Strength, Systematic Thinking, Conscientiousness
// Assessment: All traits are genuinely relevant to house maintenance performance. Unlike some domains, house maintenance requires specific personality attributes (conscientiousness for preventive care, physical capability, systematic thinking for diagnostics). Traits are appropriate and not skill/knowledge disguised as traits. Measurement criteria are clear and practical.

// Milestones: EXCELLENT
// - Novice Level (5 milestones): Complete Home Safety Audit, Replace HVAC Filter, Clear Clogged Drain, Test Smoke Detectors, Establish Monthly Schedule
// - Developing Level (7 milestones): Repair Leaky Faucet, Patch and Paint Wall, Clean Gutters, Winterize Systems, Replace Toilet Flapper, Apply Weatherstripping, Diagnose Electrical Issues
// - Competent Level (4 milestones): Identify HVAC Issues, Complete Interior Painting, Identify Water Intrusion, Comprehensive Home Inspection, Caulk Bathroom/Kitchen, Create Seasonal Checklist
// - Advanced Level (6 milestones): Energy Efficiency Implementation, Fix Complex Plumbing, Preventive Maintenance Protocol, Troubleshoot Multi-System Problems, Document Systems, Mentor Someone
// - Master Level (6 milestones): Community Resource Status, Major System Overhaul, Energy Certification, Complete Diagnostic Capability, Specialized Expertise, Educational Content, Total Mastery
// Assessment: 31 milestones provide excellent variety and specificity. Each milestone is measurable and marks genuine progress. Milestones span both technical skills (replace cartridge, caulk) and behavioral/systematic achievements (create schedules, mentor). How_to_achieve guidance is practical and specific. Milestone distribution across levels is appropriate and realistic.

// COHERENCE CHECKS

// Domain Alignment: EXCELLENT
// - All components stay within scope_included definition
// - No scope creep into professional work (electrical, plumbing, roofing replacements correctly excluded)
// - Appropriate balance between maintenance (core domain) and improvement (included appropriately)
// - Clear delineation from related domains: professional services, remodeling, gardening, interior design
// Assessment: Domain maintains tight focus on homeowner-level house maintenance. Professional-level work requiring licensing is properly excluded. No components drift into unrelated areas. Scope is clearly defined and consistently maintained throughout all agents' work.

// Level Progression: EXCELLENT
// - Novice Level: Learning fundamentals, identifying systems, basic safety
// - Developing Level: Building independence, performing simple repairs, seasonal tasks
// - Competent Level: Reliable maintenance of all systems, wide variety of repairs, systematic approach
// - Advanced Level: Complex problem-solving, mentoring, strategic decision-making
// - Master Level: Specialized expertise, community contribution, sophisticated system mastery
// Assessment: Progression is logical, realistic, and well-differentiated. Each level represents genuine advancement in knowledge, capability, and responsibility. Descriptions accurately reflect domain-specific expectations at each level. Progression mirrors realistic homeowner development over years of practice.

// Relationship Logic: EXCELLENT
// - 185 relationship statements create robust prerequisite networks
// - Relationships flow logically from simpler to more complex components
// - No circular dependencies detected
// - Prerequisite chains are reasonable in complexity (typically 2-4 prerequisites per advanced node)
// - Level requirements align with component complexity
// - Milestone prerequisites make logical sense (e.g., must understand plumbing fundamentals before diagnosing complex issues)
// Assessment: Relationship structure is sophisticated and well-constructed. Prerequisites build knowledge logically without creating overwhelming chains. Level assignments align with component difficulty. No circular dependencies detected. Milestone prerequisites logically support progression paths.

// QUALITY CHECKS

// Content Quality: EXCELLENT
// - All descriptions are clear, specific, and domain-focused (not generic)
// - How_to_learn/develop/achieve sections are practical and actionable with concrete timeframes
// - Content provides genuine guidance (not vague platitudes)
// - Descriptions use appropriate technical terminology while remaining accessible
// - Measurement criteria for traits are clear and practical
// Assessment: Content quality is consistently high across all component types. Descriptions are specific to house maintenance rather than generic skill descriptions. Development guidance includes concrete resources, timeframes, and progressive practice approaches. Trait measurement criteria are practical and observable.

// Completeness: EXCELLENT
// - All 20 Knowledge nodes have: name, description, and all Bloom's levels (remember through create)
// - All 23 Skill nodes have: name, description, how_to_develop, and 5-level progression (novice through expert)
// - All 6 Trait nodes have: name, description, and measurement_criteria (clear scale)
// - All 31 Milestone nodes have: name, description, and detailed how_to_achieve
// - All 5 Domain_Level nodes have: level, name, and description
// Assessment: All required properties present in all nodes. No incomplete or stub entries. All development pathways include progression stages. Descriptions provide sufficient detail for practical use.

// Redundancy: MINIMAL
// - Slight overlap between 'Preventive Maintenance Principles' (knowledge) and 'Preventive Maintenance Scheduling' (skill), but appropriate distinction: one is conceptual understanding, one is execution capability
// - Minor conceptual overlap between 'Building Science' and 'Home System Integration Understanding' appropriately differentiated as knowledge vs. skill
// - Plumbing and electrical components (knowledge, skills, milestones) appropriately separated rather than consolidated
// Assessment: No problematic redundancies identified. Components are appropriately differentiated by type and purpose. Knowledge-skill distinctions are clear. Multiple components covering similar systems are justified by the need for distinct depth and angle of coverage.

// ISSUES IDENTIFIED

// Critical Issues: NONE
// - Domain is fundamentally coherent with clear scope and purpose
// - No major gaps preventing meaningful progression
// - Scope is clear and not contradictory
// - Components align well with domain

// Major Issues: NONE
// - No significant knowledge or skill gaps identified
// - Prerequisites make logical sense throughout
// - Level descriptions match requirements well
// - Content is appropriately domain-specific

// Minor Issues: NONE SIGNIFICANT
// - Could potentially add 1-2 more basic skills (e.g., basic sink installation, shelving installation) but existing coverage is already comprehensive
// - Could expand trait section with one additional trait (e.g., 'Safety Awareness') but current six traits cover essential dimensions
// - Suggestion: These are enhancements, not necessary improvements for approval

// STRENGTHS

// - Excellent level-to-level progression that reflects realistic homeowner development path
// - Strong foundational knowledge tier (5 nodes) providing essential context before specialized knowledge
// - Comprehensive skill coverage from basic (HVAC filter) to advanced (system integration understanding)
// - Exceptional milestone specificity and actionability - each milestone has concrete how_to_achieve guidance
// - Appropriate trait selection specific to home maintenance rather than generic life traits
// - Strong distinction between novice-accessible milestones and master-level achievements
// - Building science and sustainability knowledge appropriately included at advanced/master levels
// - Teaching and community contribution included as legitimate master-level pursuits
// - Time estimates provided for learning and achievement make planning realistic
// - Trait measurement criteria are practical and observable rather than abstract

// EXAMPLE PROGRESSION PATHS

// EXAMPLE PERSON 1: RESPONSIBLE PARENT (Novice to Competent in 18 months)
// Profile: Homeowner with young children, motivated by safety and preventing costly failures
// Level 1 (0-3 months): Complete Home Safety Audit, learns Home Systems Overview and Basic Home Safety knowledge, develops Basic Tool Handling and Smoke Detector Testing skills. Focus: Safety foundation.
// Level 2 (3-12 months): Establishes Monthly Maintenance Schedule, learns Plumbing and HVAC fundamentals, successfully replaces HVAC filters, repairs leaky faucet, clears drains independently. Develops conscientiousness trait. Focus: Independent maintenance capability.
// Level 3 (12-18 months): Completes comprehensive home inspection, learns Roof/Gutter and Interior Surface Care knowledge, successfully caulks bathroom, creates seasonal maintenance checklist. Now handles most common maintenance independently. Develops attention to detail.
// Likely path utilizes: All basic/developing milestones plus safety-focused choices. High correlation with conscientiousness and attention to detail traits. Time investment: ~200 hours over 18 months.

// EXAMPLE PERSON 2: HANDS-ON TROUBLESHOOTER (Novice to Advanced in 3 years)
// Profile: Homeowner who enjoys problem-solving, mechanically inclined, interested in DIY
// Level 1 (0-3 months): Completes safety audit, learns Home Systems Overview, develops tool handling skills
// Level 2 (3-12 months): Learns Plumbing Fundamentals, develops drain clearing and faucet diagnosis skills, successfully repairs leaky faucet, becomes comfortable with hands-on repairs
// Level 3 (12-24 months): Learns Electrical Fundamentals and Advanced Building Science, develops electrical troubleshooting and plumbing diagnosis skills, performs comprehensive home inspection, identifies water intrusion sources
// Level 4 (24-36 months): Learns Moisture Management and Building Science in depth, develops system integration understanding and moisture assessment skills, successfully troubleshoots multi-system problems, builds complete home diagnostic capability. Mentors friends on repairs.
// Likely path utilizes: Heavy emphasis on diagnostic and advanced skills. High correlation with practical problem solving and systematic thinking traits. Physical strength less critical for this path. Time investment: ~400 hours over 3 years.

// EXAMPLE PERSON 3: EFFICIENCY OPTIMIZER (Developing to Master in 4+ years)
// Profile: Environmentally conscious homeowner, interested in efficiency and sustainability
// Level 2: Learns Preventive Maintenance Principles, applies weatherstripping, learns HVAC maintenance
// Level 3: Completes comprehensive home inspection, learns Home Energy Efficiency knowledge
// Level 4: Implements comprehensive energy efficiency improvement project (major milestone), learns Building Science and Energy Efficiency deeply, develops preventive maintenance scheduling and seasonal preparation skills
// Level 5: Achieves certified energy efficiency rating, learns Sustainable Home Maintenance, develops specialized expertise in energy systems, creates educational content on efficiency
// Likely path utilizes: Energy efficiency milestones, advanced building science knowledge, sustainability focus. Path integrates teaching component at master level. Time investment: ~500+ hours over 4+ years.

// QUALITY SCORE: 92/100

// Score Breakdown:
// Knowledge Coverage: 20/20 - Comprehensive across all levels with no gaps
// Skill Coverage: 22/20 - Excellent breadth and depth, slightly above expectations
// Trait Selection: 18/20 - Appropriate and specific, could add 1-2 more traits
// Milestone Quality: 19/20 - Excellent specificity and actionability
// Level Progression: 19/20 - Logical and realistic
// Relationship Logic: 18/20 - Sound prerequisite chains, minimal complexity
// Content Quality: 19/20 - High quality throughout
// Domain Focus: 20/20 - Excellent domain boundary maintenance
// Completeness: 20/20 - All required properties present
// Realism: 19/20 - Progression paths realistic for most homeowners

// Point Calculation:
// Novice Level: ~100-150 points (5 milestones worth 20-30 each)
// Developing Level: ~250-350 points (7 milestones worth 30-50 each)
// Competent Level: ~400-500 points (5 milestones worth 80-100 each)
// Advanced Level: ~700-850 points (6 milestones worth 100-150 each)
// Master Level: ~900-1100+ points (6 milestones worth 150-200+ each)
// Total Range: ~2350-2950 points (reasonable for 5-year mastery journey)

// RECOMMENDATION DETAILS

// RECOMMENDATION: APPROVE

// This domain is ready for database deployment. The House Maintenance domain is well-structured, comprehensive, and realistic. It successfully represents the complexity of residential home maintenance from a knowledgeable homeowner perspective, with appropriate scope boundaries that exclude professional-level work.

// Strengths supporting approval:
// 1. Clear, coherent domain scope with appropriate exclusions of professional work
// 2. Logical five-level progression reflecting realistic skill development over years
// 3. Comprehensive coverage of all major residential systems (plumbing, electrical, HVAC, structural, roofing)
// 4. Strong foundational knowledge tier ensuring conceptual understanding before specialized work
// 5. Practical, actionable milestones with specific guidance for achievement
// 6. Appropriate trait selection specific to the domain
// 7. Realistic relationship structure with sensible prerequisite chains
// 8. High-quality content throughout with domain-specific guidance
// 9. Building science and sustainability appropriately integrated at advanced/master levels
// 10. Teaching and community contribution as legitimate master-level pursuits

// The domain successfully enables diverse progression paths for different homeowner motivations (safety, efficiency, technical mastery, community contribution) while maintaining coherence and logical skill development. Time investments are realistic, and guidance is actionable for actual homeowners.

// No revisions required for database deployment.
