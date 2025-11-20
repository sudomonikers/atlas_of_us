// Domain: Gardening
// Generated: 2025-11-16
// Description: The practice of growing and cultivating plants as part of horticulture

// ============================================================
// DOMAIN: Gardening
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Gardening',
  description: 'The practice of growing and cultivating plants as part of horticulture, encompassing soil management, plant selection, propagation, pest control, seasonal planning, and the creation of diverse garden environments for food, aesthetics, or ecological purposes',
  level_count: 5,
  created_date: date(),
  scope_included: ['soil preparation and amendment', 'plant selection and propagation', 'seed starting and transplanting', 'watering and irrigation management', 'pest and disease management', 'fertilization and plant nutrition', 'pruning and plant training', 'seasonal planning and crop rotation', 'composting and organic matter management', 'landscape design for gardens', 'vegetable growing', 'ornamental plant cultivation', 'herb gardening', 'container gardening', 'raised bed gardening'],
  scope_excluded: ['forestry and large-scale timber management (separate domain)', 'agricultural farming at commercial scale (separate domain)', 'turf management and lawn care (separate domain)', 'landscape architecture and construction (separate domain)', 'botanical science and plant taxonomy (separate domain - theoretical focus)', 'general outdoor maintenance (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Gardening Novice',
  description: 'Learning fundamental gardening concepts, starting with basic plant care, understanding soil basics, and growing simple plants in containers or small beds with guidance'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Gardening Developing',
  description: 'Building practical skills in soil preparation, plant propagation, and seasonal planting; successfully growing multiple plant types; beginning to understand pest management and plant nutrition'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Gardening Competent',
  description: 'Managing garden beds independently with consistent success; applying crop rotation and composting practices; troubleshooting common plant problems; designing simple garden layouts'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Gardening Advanced',
  description: 'Creating diverse, productive gardens with strategic plant combinations; mentoring other gardeners; optimizing yields and plant health through advanced techniques; contributing knowledge to gardening communities'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Gardening Master',
  description: 'Operating as a gardening authority with deep knowledge of plants, ecosystems, and cultivation techniques; innovating new growing methods; restoring soil and plant systems; recognized for expertise and contributions to horticultural advancement'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Gardening'})
MATCH (level1:Domain_Level {name: 'Gardening Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Gardening'})
MATCH (level2:Domain_Level {name: 'Gardening Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Gardening'})
MATCH (level3:Domain_Level {name: 'Gardening Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Gardening'})
MATCH (level4:Domain_Level {name: 'Gardening Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Gardening'})
MATCH (level5:Domain_Level {name: 'Gardening Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// FOUNDATIONAL KNOWLEDGE (Novice level)

MERGE (k:Knowledge {name: 'Gardening Soil Basics'})
ON CREATE SET k.description = 'Understanding soil as a living ecosystem containing nutrients, water, organic matter, and microorganisms. Foundation for all successful gardening.',
              k.how_to_learn = 'Start by examining soil from different sources. Get a soil test from your local extension office. Read "The Soil Will Save Us" or similar beginner books. Practice making simple compost to understand decomposition. Expected time: 2-3 weeks of observation and study.',
              k.remember_level = 'Recall soil components (clay, silt, sand, organic matter, water), basic soil nutrients (nitrogen, phosphorus, potassium), and differences between soil types',
              k.understand_level = 'Explain why soil quality matters, how water retention differs between soil types, and why organic matter is important for plant health',
              k.apply_level = 'Perform simple soil tests, amend soil with compost, adjust pH using common amendments, and water appropriately for different soil types',
              k.analyze_level = 'Examine soil composition, identify soil texture, break down what\'s lacking in poor soil, and determine what plants thrive in specific soil conditions',
              k.evaluate_level = 'Assess soil quality for different gardening purposes, judge effectiveness of soil amendments, and decide when soil replacement is necessary',
              k.create_level = 'Design custom soil mixes for containers or raised beds, develop a soil improvement plan for degraded soil, and create a soil testing schedule';

MERGE (k:Knowledge {name: 'Basic Plant Anatomy'})
ON CREATE SET k.description = 'Understanding plant structure and function: roots, stems, leaves, flowers, and how they work together to support growth and reproduction.',
              k.how_to_learn = 'Observe and dissect living plants. Draw plant parts and label them. Read beginner gardening guides focusing on plant structure. Expected time: 1-2 weeks.',
              k.remember_level = 'Identify and name basic plant parts: roots, stem, leaves, flower, fruit, seed',
              k.understand_level = 'Explain the function of each plant part and how they work together to grow and reproduce',
              k.apply_level = 'Use knowledge of plant anatomy when watering, pruning, and selecting plants for specific garden spots',
              k.analyze_level = 'Diagnose plant problems by examining symptoms on different plant parts, identify nutrient issues by leaf appearance',
              k.evaluate_level = 'Judge plant health based on leaf color, growth patterns, and structural integrity',
              k.create_level = 'Design plant care routines based on understanding of how plant parts function';

MERGE (k:Knowledge {name: 'Container Gardening Fundamentals'})
ON CREATE SET k.description = 'Growing plants in pots, containers, and raised beds rather than in-ground. Ideal for beginners and those with limited space.',
              k.how_to_learn = 'Start with 3-5 containers of different sizes. Grow easy plants like herbs or flowers. Learn through observation and small failures. Read "Container Gardening for Dummies" or similar guides. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall drainage requirements, appropriate soil for containers, and container size guidelines for different plants',
              k.understand_level = 'Explain why drainage is critical, how container size affects watering frequency, and what makes a good potting mix',
              k.apply_level = 'Select appropriate containers, choose correct potting soil, plant appropriately, and maintain container gardens with regular watering and feeding',
              k.analyze_level = 'Diagnose container problems (yellowing leaves, stunted growth, root issues), identify when plants need repotting',
              k.evaluate_level = 'Assess whether a container is appropriate for a plant\'s mature size, judge potting mix quality',
              k.create_level = 'Design container arrangements for specific locations and purposes, develop container gardening systems for different plant types';

MERGE (k:Knowledge {name: 'Watering Plants Properly'})
ON CREATE SET k.description = 'Understanding when, how much, and how to water different plants. Critical for plant survival and health.',
              k.how_to_learn = 'Observe soil moisture by touch. Water plants and observe results over weeks. Learn your local climate patterns. Research water needs for plants you grow. Expected time: 3-4 weeks of hands-on practice.',
              k.remember_level = 'Recall that most plants prefer moist but not waterlogged soil, that needs vary by plant type and season',
              k.understand_level = 'Explain how overwatering causes root rot, why mulch conserves water, how temperature and season affect watering needs',
              k.apply_level = 'Check soil moisture appropriately, water plants at correct depth and frequency, use soaker hoses or drip irrigation',
              k.analyze_level = 'Diagnose watering problems (underwatering, overwatering, poor drainage), identify how environmental factors affect water needs',
              k.evaluate_level = 'Judge whether plants are getting appropriate water, assess irrigation system effectiveness',
              k.create_level = 'Design watering schedules for specific gardens, develop irrigation systems, create water conservation strategies';

MERGE (k:Knowledge {name: 'Common Garden Plants'})
ON CREATE SET k.description = 'Identifying and understanding characteristics of widely available garden plants: vegetables, herbs, flowers, and shrubs suitable for beginners.',
              k.how_to_learn = 'Visit a garden center and identify plants. Grow 5-10 different easy plants. Research their basic needs online or in plant guides. Expected time: Ongoing learning, 4-6 weeks for familiarity.',
              k.remember_level = 'Identify 20+ common garden plants by sight and name, recall basic growing requirements for each',
              k.understand_level = 'Explain why certain plants are suitable for beginners, how they grow, when they flower or fruit, their basic requirements',
              k.apply_level = 'Select appropriate plants for your garden conditions, plant them correctly, maintain them through seasons',
              k.analyze_level = 'Determine which plants will succeed in your garden based on light, soil, climate factors',
              k.evaluate_level = 'Judge plant quality at nursery, assess plant health, decide which varieties suit your needs',
              k.create_level = 'Design plant combinations for aesthetics or productivity, develop plant exploration plans for learning new varieties';

MERGE (k:Knowledge {name: 'Seasonal Garden Timing'})
ON CREATE SET k.description = 'Understanding seasonal patterns: when to plant, when plants grow, flower, fruit, or go dormant. Varies by climate and plant type.',
              k.how_to_learn = 'Track your local first and last frost dates. Observe plants through full calendar year. Learn your USDA hardiness zone. Read seasonal gardening guides. Expected time: 12 months minimum, ongoing learning.',
              k.remember_level = 'Know your frost dates, recall when to plant cool-season vs warm-season crops, identify plant dormancy periods',
              k.understand_level = 'Explain how day length affects flowering, why some plants need cold periods, how climate affects growing season length',
              k.apply_level = 'Plant seeds at correct times, start seeds indoors appropriately, plan harvest timing, prepare plants for seasonal transitions',
              k.analyze_level = 'Examine your garden\'s unique microclimates, identify factors that affect your season length, determine plant hardiness for your area',
              k.evaluate_level = 'Judge timing for planting decisions, assess whether plants are ready for transition (indoor to outdoor, growing to dormancy)',
              k.create_level = 'Create a year-round gardening calendar for your specific location and plants, develop season-extending techniques';

// CORE KNOWLEDGE (Developing/Competent levels)

MERGE (k:Knowledge {name: 'Seed Starting and Propagation'})
ON CREATE SET k.description = 'Growing plants from seeds and propagating plants from cuttings. Expands gardening possibilities and saves money on plants.',
              k.how_to_learn = 'Start seeds indoors in spring. Keep a seed starting journal. Research optimal temperature and light for different seeds. Practice propagation from cuttings of houseplants. Expected time: 2-3 months of hands-on practice.',
              k.how_to_learn = 'Start seeds indoors in spring. Keep a seed starting journal. Research optimal temperature and light for different seeds. Practice propagation from cuttings of houseplants. Expected time: 2-3 months of hands-on practice.',
              k.remember_level = 'Recall seed depth planting guidelines, understand cold stratification, dormancy, and germination requirements',
              k.understand_level = 'Explain why seeds need proper moisture and temperature, how light affects germination, when to thin seedlings, basics of propagation from cuttings',
              k.apply_level = 'Start seeds indoors with proper lighting and moisture, transplant seedlings, harden off plants, propagate from cuttings successfully',
              k.analyze_level = 'Diagnose seed starting problems (poor germination, leggy seedlings, damping off), determine ideal conditions for specific seeds',
              k.evaluate_level = 'Judge seed quality and viability, assess whether seedlings are ready for transplanting, evaluate propagation success rates',
              k.create_level = 'Design seed starting systems for large-scale propagation, develop propagation techniques for difficult plants, create seed saving programs';

MERGE (k:Knowledge {name: 'Soil Preparation and Amendment'})
ON CREATE SET k.description = 'Preparing garden beds and improving soil through composting, adding organic matter, adjusting pH, and managing soil structure and drainage.',
              k.how_to_learn = 'Prepare a garden bed from scratch. Build and maintain a compost system. Get soil tests before and after amendment. Work with soil through multiple seasons. Expected time: 2-3 months minimum.',
              k.remember_level = 'Recall what constitutes soil pH, major nutrients, organic matter, and how amendments address these factors',
              k.understand_level = 'Explain how pH affects nutrient availability, why organic matter improves both clay and sandy soils, how compost benefits soil structure and biology',
              k.apply_level = 'Amend soil appropriately using compost or amendments, adjust pH as needed, create successful garden beds, build and maintain compost systems',
              k.analyze_level = 'Use soil test results to guide amendments, diagnose nutrient problems based on plant symptoms, identify soil structure issues',
              k.evaluate_level = 'Assess soil quality and determine what amendments are needed, judge compost maturity, evaluate amendment effectiveness',
              k.create_level = 'Design soil building programs for poor or degraded soil, create custom compost systems, develop long-term soil management plans';

MERGE (k:Knowledge {name: 'Plant Nutrition and Fertilizing'})
ON CREATE SET k.description = 'Understanding plant nutrient needs and providing them through organic or synthetic fertilizers. Essential for productive, healthy gardens.',
              k.how_to_learn = 'Get soil tests to understand baseline nutrients. Research NPK ratios and their effects. Fertilize plants and observe results. Compare organic and synthetic options. Expected time: 2-3 months of experimentation.',
              k.remember_level = 'Recall the major nutrients (N, P, K), secondary nutrients (Ca, Mg, S), and micronutrients. Understand NPK numbers on fertilizer labels.',
              k.understand_level = 'Explain what each nutrient does, why deficiency symptoms occur, how over-fertilizing damages plants, differences between organic and synthetic fertilizers',
              k.apply_level = 'Select and apply appropriate fertilizers for different plants, interpret soil test results, identify and treat nutrient deficiencies',
              k.analyze_level = 'Diagnose nutrient problems from plant symptoms, determine optimal fertilizing rates for specific plants and situations',
              k.evaluate_level = 'Judge fertilizer products by analyzing labels and ingredients, assess whether plants are over or under-fertilized',
              k.create_level = 'Design fertilizing programs using organic methods, develop custom fertilizers for specific plants, create nutrient cycling systems';

MERGE (k:Knowledge {name: 'Common Pests and Diseases in Gardens'})
ON CREATE SET k.description = 'Identifying and understanding common garden pests (insects, animals) and plant diseases (fungal, bacterial, viral). Foundation for pest management.',
              k.how_to_learn = 'Keep a garden journal photographing pest damage. Identify pests using field guides or online resources. Research damage patterns. Join local gardening groups to learn from others. Expected time: Ongoing, 3-4 months for familiarity.',
              k.remember_level = 'Identify 15+ common garden pests and 10+ common diseases by sight or damage pattern',
              k.understand_level = 'Explain damage caused by different pests, how diseases spread, environmental conditions that favor pests or diseases',
              k.apply_level = 'Monitor plants for pests and diseases, identify problems early, implement appropriate control measures',
              k.analyze_level = 'Analyze damage patterns to identify causal agents, determine environmental conditions contributing to problems',
              k.evaluate_level = 'Judge severity of pest or disease problems, decide whether action is necessary, assess control method effectiveness',
              k.create_level = 'Design integrated pest management plans, develop pest prevention strategies, create disease-resistant garden designs';

MERGE (k:Knowledge {name: 'Pruning and Plant Training'})
ON CREATE SET k.description = 'Cutting and shaping plants to improve structure, productivity, health, and appearance. Applies to shrubs, trees, fruits, and vegetables.',
              k.how_to_learn = 'Prune different plant types under various conditions. Observe how plants respond to pruning over weeks and months. Read pruning guides. Join pruning workshops. Expected time: 2-3 months of practice.',
              k.remember_level = 'Recall basic pruning cuts (heading back, thinning), timing for different plant types, proper tool use',
              k.understand_level = 'Explain why and when to prune different plants, how pruning affects growth patterns, benefits of correct pruning timing',
              k.apply_level = 'Prune plants correctly without damaging them, shape young plants for desired form, maintain plant size and health',
              k.analyze_level = 'Examine plant structure and decide what to prune, identify poor branch architecture and plan corrections',
              k.evaluate_level = 'Judge whether pruning has improved plant health or form, assess whether pruning timing was appropriate',
              k.create_level = 'Design espaliered or trained forms for plants, develop pruning systems for specific plant types, create long-term plant shaping plans';

MERGE (k:Knowledge {name: 'Crop Rotation and Succession Planting'})
ON CREATE SET k.description = 'Planning garden beds to rotate plant families and succession plant for continuous harvests. Improves soil health and productivity.',
              k.how_to_learn = 'Map your garden and plan rotations for next 3 seasons. Research plant families and their soil demands. Keep detailed garden records. Read crop planning guides. Expected time: 3-4 months of planning and practice.',
              k.remember_level = 'Recall plant families (nightshades, brassicas, legumes, alliums, cucurbits), understand why rotation matters',
              k.understand_level = 'Explain benefits of crop rotation (pest/disease reduction, nitrogen management, soil improvement), how succession planting extends harvests',
              k.apply_level = 'Create and implement a crop rotation plan, succession plant for continuous harvests, adjust rotations based on soil tests',
              k.analyze_level = 'Examine pest and disease patterns and design rotations to break cycles, assess soil demands of different crops',
              k.evaluate_level = 'Judge whether rotation plan is effective at reducing problems, assess soil improvement results over years',
              k.create_level = 'Design complex multi-season crop rotation plans, develop succession planting calendars for specific crops and regions';

MERGE (k:Knowledge {name: 'Composting Methods'})
ON CREATE SET k.description = 'Creating compost to recycle plant material and generate rich soil amendment. Multiple methods exist from passive piles to active systems.',
              k.how_to_learn = 'Build a simple compost bin and maintain it through seasons. Research different methods (hot composting, cold composting, vermicomposting). Document the decomposition process. Expected time: 3-6 months minimum.',
              k.remember_level = 'Recall the brown-to-green ratio, carbon-to-nitrogen balance, what can and cannot be composted, decomposition timeline',
              k.understand_level = 'Explain how microorganisms decompose material, why temperature matters, how moisture and aeration affect compost quality',
              k.apply_level = 'Maintain a functioning compost system, achieve optimal brown-green balance, create finished compost appropriate for gardens',
              k.analyze_level = 'Diagnose composting problems (slow breakdown, odors, pest problems), determine readiness of finished compost',
              k.evaluate_level = 'Judge compost quality and readiness, assess effectiveness of chosen composting method',
              k.create_level = 'Design custom composting systems for specific situations, develop programs to compost agricultural waste at scale';

// ADVANCED KNOWLEDGE (Advanced level)

MERGE (k:Knowledge {name: 'Integrated Pest Management (IPM)'})
ON CREATE SET k.description = 'Comprehensive approach to managing pests using multiple strategies: prevention, monitoring, cultural controls, biological controls, and chemicals as last resort.',
              k.how_to_learn = 'Study IPM principles from extension services or university resources. Implement IPM strategies in your garden. Document pest populations over a full season. Experiment with different control methods. Expected time: 6-12 months of implementation.',
              k.remember_level = 'Recall IPM principles and the hierarchy of intervention strategies',
              k.understand_level = 'Explain how different control methods work together, why prevention is most important, how pest life cycles can be interrupted',
              k.apply_level = 'Design and implement IPM programs, select appropriate interventions based on pest monitoring data, use beneficial insects effectively',
              k.analyze_level = 'Analyze pest populations to determine intervention thresholds, examine why previous management failed, identify system vulnerabilities',
              k.evaluate_level = 'Judge effectiveness of IPM programs, assess whether interventions are working, decide when to escalate management intensity',
              k.create_level = 'Develop comprehensive IPM programs for specific crops and regions, teach IPM to other gardeners';

MERGE (k:Knowledge {name: 'Garden Ecosystem and Biodiversity'})
ON CREATE SET k.description = 'Understanding the interconnected relationships in a garden ecosystem: plants, pollinators, beneficial insects, soil organisms, and wildlife.',
              k.how_to_learn = 'Observe and document insects and wildlife in your garden. Study pollinator behavior. Research native plants for your region. Join ecological gardening groups. Expected time: Ongoing study, 4-6 months for foundational understanding.',
              k.remember_level = 'Identify major pollinator types, understand what constitutes habitat, recall which plants support biodiversity',
              k.understand_level = 'Explain food webs and predator-prey relationships in gardens, why native plants matter, how gardens can support broader ecosystems',
              k.apply_level = 'Plant for pollinators and beneficial insects, create habitat diversity, reduce pesticide use to protect ecosystem health',
              k.analyze_level = 'Examine your garden ecosystem and identify missing pieces, analyze pest and predator populations to understand balance',
              k.evaluate_level = 'Assess biodiversity in your garden, judge whether ecosystem is healthy, identify what\'s needed to improve balance',
              k.create_level = 'Design gardens as functional ecosystems, develop habitat restoration plans, create wildlife corridors';

MERGE (k:Knowledge {name: 'Advanced Soil Science'})
ON CREATE SET k.description = 'Deep understanding of soil as a complex system: microbial communities, nutrient cycling, soil food webs, and soil health indicators beyond basic testing.',
              k.how_to_learn = 'Take advanced soil science courses or read research. Conduct advanced soil tests (microbial, enzyme activity). Work with soils over multiple years. Network with soil scientists. Expected time: 6-12 months of study.',
              k.remember_level = 'Recall soil formation processes, types of soil organisms and their roles, advanced soil chemistry',
              k.understand_level = 'Explain nutrient cycling in soils, how microorganisms support plant health, connections between soil health and plant health',
              k.apply_level = 'Use advanced soil tests to guide management, implement regenerative soil practices, build soil food webs',
              k.analyze_level = 'Analyze complex soil problems, identify root causes of soil degradation, design solutions for specific soil challenges',
              k.evaluate_level = 'Assess soil health using multiple indicators, judge effectiveness of soil management practices',
              k.create_level = 'Develop innovative soil management practices, create soil restoration programs for severely degraded soils';

MERGE (k:Knowledge {name: 'Specialization in Plant Types'})
ON CREATE SET k.description = 'Deep expertise in growing specific plant categories: vegetables, fruits, herbs, ornamentals, native plants, or specialized groups like dahlias or rhododendrons.',
              k.how_to_learn = 'Choose a plant category and grow 20+ varieties. Read specialized books on the category. Attend workshops or join societies. Experiment with varieties and techniques. Expected time: 6-12 months per specialization.',
              k.remember_level = 'Recall characteristics, varieties, and requirements for 50+ plants in the specialization',
              k.understand_level = 'Explain optimal growing conditions for specialized plants, their pest/disease vulnerabilities, specialized techniques needed',
              k.apply_level = 'Grow specialized plants to high quality, know variety selection, implement specialized techniques successfully',
              k.analyze_level = 'Diagnose problems specific to specialty plants, analyze performance and optimize growing conditions',
              k.evaluate_level = 'Judge plant quality and performance, assess variety appropriateness for specific purposes',
              k.create_level = 'Develop advanced techniques for specialty plants, breed or select improved varieties';

MERGE (k:Knowledge {name: 'Landscape Design Principles'})
ON CREATE SET k.description = 'Understanding design principles for garden aesthetics: color, form, texture, balance, focal points, and creating cohesive garden spaces.',
              k.how_to_learn = 'Study landscape design principles in books or online courses. Observe well-designed gardens. Sketch garden designs. Create a few garden designs and build them. Expected time: 3-6 months of study and practice.',
              k.remember_level = 'Recall basic design principles: balance, focal points, color theory, proportion, unity',
              k.understand_level = 'Explain how design principles create visual impact, how color combinations work, why certain arrangements feel harmonious',
              k.apply_level = 'Apply design principles to create attractive gardens, select plants for visual effect, arrange plant combinations thoughtfully',
              k.analyze_level = 'Analyze existing gardens for design effectiveness, identify design problems and solutions',
              k.evaluate_level = 'Judge garden design quality, assess whether design achieves intended effects',
              k.create_level = 'Design cohesive gardens incorporating color, texture, and form, develop signature design styles';

MERGE (k:Knowledge {name: 'Water Management and Irrigation Systems'})
ON CREATE SET k.description = 'Advanced water management including drip irrigation design, soil water holding capacity, conservation strategies, and adapting to regional water conditions.',
              k.how_to_learn = 'Design and install irrigation systems. Monitor soil moisture scientifically. Research water conservation. Test different watering systems. Expected time: 2-3 months of installation and monitoring.',
              k.remember_level = 'Recall irrigation system components and options, water holding capacity concepts, conservation principles',
              k.understand_level = 'Explain how different soil types hold water differently, how to calculate water needs, how weather affects irrigation timing',
              k.apply_level = 'Design and install drip irrigation, adjust systems for plant needs, implement water conservation strategies',
              k.analyze_level = 'Analyze water use patterns and optimize systems, determine actual water needs for specific plants and conditions',
              k.evaluate_level = 'Judge irrigation system efficiency, assess water conservation effectiveness',
              k.create_level = 'Design complex irrigation systems for large gardens, develop water conservation programs, optimize water use for regions';

// SPECIALIZED KNOWLEDGE (Master level)

MERGE (k:Knowledge {name: 'Horticultural Innovation and Research'})
ON CREATE SET k.description = 'Staying current with horticultural advances, experimenting with new techniques, contributing to gardening knowledge through observation and documentation.',
              k.how_to_learn = 'Read horticultural journals and research papers. Subscribe to advanced gardening publications. Conduct experiments in your garden. Document and share findings. Join research collaborations. Expected time: Ongoing throughout career.',
              k.remember_level = 'Track current research trends and recent advances in horticulture',
              k.understand_level = 'Comprehend research methodologies and how to evaluate horticultural studies',
              k.apply_level = 'Test new techniques and varieties in your garden using experimental rigor',
              k.analyze_level = 'Critically analyze research and horticultural claims, identify promising new approaches',
              k.evaluate_level = 'Judge quality of horticultural research and innovations, assess whether new techniques are practical',
              k.create_level = 'Contribute to horticultural knowledge through detailed documentation, conduct original experiments, develop improved practices';

MERGE (k:Knowledge {name: 'Soil Restoration and Regeneration'})
ON CREATE SET k.description = 'Comprehensive approaches to restoring severely degraded soils: compacted soils, contaminated soils, nutrient-depleted soils, and building soil resilience.',
              k.how_to_learn = 'Work with severely degraded soils over years. Study soil remediation science. Network with soil restoration specialists. Document long-term restoration progress. Expected time: 2+ years of active restoration.',
              k.remember_level = 'Recall soil restoration strategies for different degradation types',
              k.understand_level = 'Explain mechanisms of soil degradation and recovery, timelines for restoration',
              k.apply_level = 'Design and implement restoration programs, manage timeline expectations, monitor progress effectively',
              k.analyze_level = 'Assess severity of soil damage, identify restoration challenges, design targeted interventions',
              k.evaluate_level = 'Judge progress toward soil health goals, adapt strategies based on results',
              k.create_level = 'Design innovative soil restoration approaches, lead large-scale restoration projects';

MERGE (k:Knowledge {name: 'Teaching and Mentoring Gardeners'})
ON CREATE SET k.description = 'Developing ability to teach, mentor, and inspire other gardeners. Understanding adult learning, adapting teaching to different experience levels and contexts.',
              k.how_to_learn = 'Mentor beginner gardeners. Teach workshops or classes. Read teaching methodology materials. Reflect on teaching effectiveness. Mentor multiple people. Expected time: Ongoing throughout career.',
              k.remember_level = 'Recall teaching best practices and adult learning principles',
              k.understand_level = 'Explain how different people learn differently, why certain approaches inspire and educate effectively',
              k.apply_level = 'Teach gardening concepts clearly, inspire others\' learning, mentor gardeners through challenges',
              k.analyze_level = 'Analyze effectiveness of teaching approaches, identify what helps different learners understand',
              k.evaluate_level = 'Judge whether teaching is effective, assess mentee progress and understanding',
              k.create_level = 'Develop curriculum and teaching programs, create resources that teach gardening effectively';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// BASIC SKILLS (Novice level)

MERGE (s:Skill {name: 'Soil Moisture Assessment'})
ON CREATE SET s.description = 'The ability to determine when soil needs water by touch, appearance, and observation. Essential foundation for preventing overwatering and underwatering.',
              s.how_to_develop = 'Practice daily soil checks by hand. Feel soil at different depths. Observe plant responses to watering. Keep watering logs. Expected time: 2-3 weeks of consistent practice.',
              s.novice_level = 'Checks soil surface only. Sometimes underwater or overwater. Relies on watering schedules rather than observation. To progress: Check soil at 2-3 inches depth with your finger.',
              s.advanced_beginner_level = 'Regularly checks soil moisture appropriately. Recognizes moisture differences by feel. Makes some incorrect watering decisions. To progress: Learn how soil type and season affect water needs.',
              s.competent_level = 'Accurately assesses moisture levels daily across multiple plants. Waters appropriately most of the time. Adapts to weather changes. To progress: Develop intuition about plant stress signals.',
              s.proficient_level = 'Rapidly assesses moisture needs for varied plants. Recognizes subtle soil and plant signals. Watering decisions are nearly always correct. To progress: Teach others moisture assessment.',
              s.expert_level = 'Intuitively knows water status of all plants. Anticipates watering needs before stress appears. Can teach complex factors affecting water availability.';

MERGE (s:Skill {name: 'Basic Watering Technique'})
ON CREATE SET s.description = 'Delivering water to plants at the soil level, avoiding foliage, and watering appropriate amounts and depths.',
              s.how_to_develop = 'Water plants by hand with watering can for 2-3 weeks. Practice watering different plant types. Observe soil water penetration. Expected time: 2-3 weeks.',
              s.novice_level = 'Waters plants, but technique varies. Sometimes wets foliage or splashes water on leaves. Depth and amount inconsistent. To progress: Focus on watering soil, not leaves.',
              s.advanced_beginner_level = 'Mostly waters soil correctly. Occasional foliage wetting. Water penetration is usually adequate. To progress: Refine technique for different plant sizes and containers.',
              s.competent_level = 'Consistently waters soil only, avoiding foliage. Appropriate depth and duration. Minimal water waste. To progress: Develop efficient watering systems for larger gardens.',
              s.proficient_level = 'Watering is smooth and efficient. Automatically adjusts for plant, season, and weather. No water waste. To progress: Mentor others in proper technique.',
              s.expert_level = 'Water delivery is perfectly optimized for each plant and situation. Efficiency and plant health are maximized. Teaching others is effortless.';

MERGE (s:Skill {name: 'Plant Identification'})
ON CREATE SET s.description = 'Recognizing plants by sight, distinguishing between different varieties, and knowing their basic characteristics and needs.',
              s.how_to_develop = 'Visit garden centers weekly and identify plants with labels. Grow 10-15 different plants. Use plant identification guides online or in apps. Expected time: 4-6 weeks.',
              s.novice_level = 'Recognizes very common plants. Confused by similar varieties. Difficulty identifying plants without labels. To progress: Spend time with plant guides and labeled plants.',
              s.advanced_beginner_level = 'Identifies 20-30 common plants reliably. Recognizes some varieties. Beginning to notice distinguishing features. To progress: Study distinguishing characteristics of similar plants.',
              s.competent_level = 'Identifies 50+ plants reliably. Recognizes many varieties. Knows basic needs for most plants you encounter. To progress: Learn plant families and less common varieties.',
              s.proficient_level = 'Instantly identifies hundreds of plants and varieties. Understands how to classify plants. Recognizes unusual or rare specimens. To progress: Specialize deeply in specific plant groups.',
              s.expert_level = 'Can identify virtually any plant including obscure species. Deep knowledge of plant characteristics, varieties, and cultivars. Expert-level teaching ability.';

MERGE (s:Skill {name: 'Garden Tool Proficiency'})
ON CREATE SET s.description = 'Proper selection, use, and maintenance of gardening tools including spades, hoes, pruners, cultivators, and rakes.',
              s.how_to_develop = 'Work with each major tool type for 1-2 weeks. Learn proper grip and technique. Maintain tools after use. Expected time: 3-4 weeks.',
              s.novice_level = 'Uses tools awkwardly. Struggles with technique. Tools often misused or poorly maintained. To progress: Learn proper grip and cutting angle for each tool.',
              s.advanced_beginner_level = 'Uses most tools adequately. Some technique issues remain. Tools sometimes neglected. To progress: Practice efficiency and tool maintenance.',
              s.competent_level = 'Proficient with all basic tools. Correct technique for each. Tools well-maintained. To progress: Learn specialized tool use and maintenance.',
              s.proficient_level = 'Seamless tool use. Minimal effort for maximum efficiency. Tools impeccably maintained. Automatically selects optimal tools. To progress: Mentor tool use.',
              s.expert_level = 'Masterful with all tools. Technique is efficient and effective. Tool care is automatic. Can work around tool limitations creatively.';

MERGE (s:Skill {name: 'Seed Planting'})
ON CREATE SET s.description = 'Planting seeds at appropriate depth, spacing, and timing for successful germination. Works for both direct sowing and container planting.',
              s.how_to_develop = 'Plant seeds directly in garden and containers for 1-2 seasons. Track germination rates. Read seed packet instructions carefully. Expected time: 6-8 weeks of active planting.',
              s.novice_level = 'Plants seeds but often wrong depth or spacing. Germination is spotty. Follows instructions rigidly without understanding. To progress: Learn why depth and spacing matter.',
              s.advanced_beginner_level = 'Mostly plants correctly. Some spacing issues. Germination rates acceptable. To progress: Develop intuition about seed size and planting depth.',
              s.competent_level = 'Consistently plants at correct depth and spacing. Good germination rates. Adjusts for different seed sizes. To progress: Learn to optimize for difficult seeds.',
              s.proficient_level = 'Planting is automatic and precise. Germination rates are excellent. Adjusts seamlessly for seed type and season. To progress: Scale up to large-scale seed propagation.',
              s.expert_level = 'Exceptional germination rates even with difficult seeds. Instinctively knows depth, spacing, and timing. Can troubleshoot germination failures expertly.';

MERGE (s:Skill {name: 'Transplanting Seedlings'})
ON CREATE SET s.description = 'Moving seedlings from seed starting containers to larger containers or garden beds without damaging roots or plants.',
              s.how_to_develop = 'Transplant 20-30 seedlings in spring. Learn to handle delicate seedlings. Observe recovery after transplanting. Expected time: 3-4 weeks.',
              s.novice_level = 'Transplants seedlings but often damages roots or plants. Recovery is slow. Technique is rough. To progress: Practice gentle handling and proper depth.',
              s.advanced_beginner_level = 'Usually transplants successfully with minor damage. Most plants recover well. Getting faster with practice. To progress: Learn to recognize hardened seedlings.',
              s.competent_level = 'Transplants smoothly with minimal plant loss. Quick and efficient. Plants establish well. To progress: Develop speed without compromising plant health.',
              s.proficient_level = 'Rapid, smooth transplanting with no visible plant stress. Efficiency is high. Plant recovery is excellent. To progress: Mentor others.',
              s.expert_level = 'Can transplant delicate seedlings at speed without any loss. Plants establish perfectly. Handles even difficult seedlings with ease.';

// INTERMEDIATE SKILLS (Developing/Competent levels)

MERGE (s:Skill {name: 'Composting'})
ON CREATE SET s.description = 'Building and maintaining a compost system that efficiently breaks down plant material into usable soil amendment.',
              s.how_to_develop = 'Build a compost bin and maintain it through a full season. Experiment with brown-green ratios. Track decomposition. Expected time: 3-4 months.',
              s.how_to_develop = 'Build a compost bin and maintain it through a full season. Experiment with brown-green ratios. Track decomposition. Expected time: 3-4 months.',
              s.novice_level = 'Built a compost system but success is inconsistent. Slow breakdown or odor problems. Ratio is off. To progress: Learn brown-green ratio and aeration.',
              s.advanced_beginner_level = 'Maintains functional compost. Decomposition is acceptable though sometimes slow. Beginning to avoid problem materials. To progress: Master temperature and turning.',
              s.competent_level = 'Operates reliable compost system. Produces usable compost within reasonable timeline. Avoids problems effectively. To progress: Optimize conditions for faster breakdown.',
              s.proficient_level = 'Excellent compost production. System runs with minimal intervention. Intuitively adjusts brown-green balance and moisture. To progress: Expand to multiple systems.',
              s.expert_level = 'Produces high-quality compost efficiently. Compost is ready quickly with perfect texture and biology. Can teach others and troubleshoot any problem.';

MERGE (s:Skill {name: 'Soil Amendment'})
ON CREATE SET s.description = 'Assessing soil needs and applying appropriate amendments to improve structure, drainage, nutrient content, or pH.',
              s.how_to_develop = 'Get soil tests and apply amendments based on results. Prepare 2-3 garden beds with amendments. Track results over a season. Expected time: 2-3 months.',
              s.novice_level = 'Applies amendments but selections sometimes inappropriate. Effects are unclear. Follows recommendations without understanding. To progress: Learn what each amendment does.',
              s.advanced_beginner_level = 'Selects amendments reasonably. Results are somewhat positive. Understanding of soil effects improving. To progress: Develop ability to interpret soil tests.',
              s.competent_level = 'Makes sound amendment decisions based on soil testing. Soil improves measurably. Can adjust applications based on plant responses. To progress: Handle complex multi-factor soil issues.',
              s.proficient_level = 'Amendment selections are excellent and well-reasoned. Soil consistently improves. Can achieve specific soil outcomes efficiently. To progress: Mentor others.',
              s.expert_level = 'Expert at reading soil conditions and prescribing amendments. Soil transformation is expertly managed. Can handle the most degraded soils.';

MERGE (s:Skill {name: 'Pruning'})
ON CREATE SET s.description = 'Cutting and shaping plants using proper technique to improve plant health, structure, and productivity without causing damage.',
              s.how_to_develop = 'Prune different plant types under various conditions. Read pruning guides. Observe plant responses over weeks and months. Expected time: 3-4 months.',
              s.novice_level = 'Prunes plants but technique is crude. Often damages plants or makes poor cuts. Timing may be wrong. To progress: Learn proper cutting technique and when to prune.',
              s.advanced_beginner_level = 'Prunes with mostly correct technique. Some incorrect cuts or timing issues. Plants usually recover. To progress: Master timing for different plant types.',
              s.competent_level = 'Skillful pruning with clean cuts and good timing. Plants respond well. Can prune for shape or productivity appropriately. To progress: Handle complex pruning scenarios.',
              s.proficient_level = 'Excellent pruning technique that improves all plants. Perfect timing. Intuitive about what to prune and why. To progress: Develop specialized techniques like espalier.',
              s.expert_level = 'Masterful pruning that transforms plant structure and health. Perfect technique and timing always. Can achieve any desired plant form.';

MERGE (s:Skill {name: 'Pest Identification'})
ON CREATE SET s.description = 'Recognizing common garden pests by appearance, damage patterns, or signs, and understanding their behavior and impacts.',
              s.how_to_develop = 'Monitor garden regularly for pests. Keep a pest journal with photos. Use identification guides. Join local gardening groups. Expected time: 2-3 months.',
              s.novice_level = 'Recognizes only obvious pests. Confused about damage causes. Many pests go unnoticed. To progress: Learn common pests and their damage patterns.',
              s.advanced_beginner_level = 'Identifies 10-15 common pests. Recognizes some damage patterns. Missing some pest problems. To progress: Study damage patterns of difficult-to-identify pests.',
              s.competent_level = 'Identifies 25+ pests reliably. Recognizes most damage patterns. Catches most problems early. To progress: Learn life cycles and biology of pests.',
              s.proficient_level = 'Instantly identifies most pests. Understands pest ecology and biology. Anticipates pest problems before they become severe. To progress: Specialize in complex pest identification.',
              s.expert_level = 'Expert-level pest identification even of unusual species. Deep knowledge of pest biology and ecology. Can identify obscure pests instantly.';

MERGE (s:Skill {name: 'Disease Diagnosis'})
ON CREATE SET s.description = 'Identifying plant diseases by symptoms, understanding causes, and recognizing disease progression and severity.',
              s.how_to_develop = 'Monitor plants for disease symptoms. Keep disease photos. Research disease identification. Compare symptoms to references. Expected time: 2-3 months.',
              s.novice_level = 'Recognizes only obvious diseases. Confuses disease with pests or environmental stress. Many diseases undiagnosed. To progress: Learn common diseases and their symptoms.',
              s.advanced_beginner_level = 'Identifies 8-10 common diseases. Some confusion with similar diseases. Beginning to understand disease patterns. To progress: Study disease symptoms carefully.',
              s.competent_level = 'Identifies 15+ diseases reliably. Recognizes progression and severity. Understands some disease causes. To progress: Learn disease biology and spread mechanisms.',
              s.proficient_level = 'Expert disease diagnosis for most conditions. Understands disease ecology deeply. Recognizes subtle symptoms early. To progress: Master difficult disease identification.',
              s.expert_level = 'Expert-level disease diagnosis even of rare conditions. Deep understanding of disease biology and ecology. Provides excellent management recommendations.';

MERGE (s:Skill {name: 'Pest Management'})
ON CREATE SET s.description = 'Selecting and implementing appropriate control measures for garden pests, from prevention to direct intervention.',
              s.how_to_develop = 'Deal with actual pest problems in your garden through seasons. Try different control methods. Document effectiveness. Expected time: 1-2 seasons.',
              s.novice_level = 'Applies controls but selections often inappropriate or ineffective. May overuse chemicals. Results are inconsistent. To progress: Learn pest biology and control options.',
              s.advanced_beginner_level = 'Selects reasonable controls with variable success. Beginning to avoid overuse. Results improving. To progress: Master timing and application methods.',
              s.competent_level = 'Effective pest management using appropriate controls. Good success rate. Uses chemicals judiciously. To progress: Develop integrated approaches.',
              s.proficient_level = 'Excellent pest control that prevents problems and handles outbreaks efficiently. Uses IPM principles intuitively. Few pest problems escape control.',
              s.expert_level = 'Expert pest management that keeps gardens healthy with minimal intervention. Prevention-focused approach is masterful. Can handle any pest problem.';

MERGE (s:Skill {name: 'Fertilizing'})
ON CREATE SET s.description = 'Selecting and applying appropriate fertilizers to plants based on their needs, growth stage, and soil conditions.',
              s.how_to_develop = 'Fertilize different plant types over 2-3 months. Observe plant responses. Read fertilizer labels. Compare results. Expected time: 2-3 months.',
              s.novice_level = 'Applies fertilizer but often wrong type or amount. Over or under-fertilizes. Selections are random. To progress: Learn what NPK means and read labels.',
              s.advanced_beginner_level = 'Makes reasonable fertilizer choices. Some over or under-feeding. Plant responses are becoming clear. To progress: Develop timing sense for different plant types.',
              s.competent_level = 'Selects appropriate fertilizers for different plants. Feeding timing is generally correct. Plants respond well. To progress: Develop organic approaches and precision.',
              s.proficient_level = 'Excellent fertilizer selection and timing. Avoids over-fertilizing automatically. All plants thrive with minimal fertilizer. To progress: Master advanced nutritional approaches.',
              s.expert_level = 'Expert fertilization that optimizes plant nutrition. Knows subtle nutrient balance effects. Minimal fertilizer is used very efficiently.';

MERGE (s:Skill {name: 'Watering System Design'})
ON CREATE SET s.description = 'Planning and implementing irrigation systems including soaker hoses, drip irrigation, or sprinklers for gardens.',
              s.how_to_develop = 'Install a simple watering system. Design and test its effectiveness. Adjust for different plants and conditions. Expected time: 3-4 weeks.',
              s.novice_level = 'Sets up basic system that works partially. Coverage is uneven or inefficient. Design is simplistic. To progress: Learn about water delivery and plant placement.',
              s.advanced_beginner_level = 'Installs functional system with acceptable coverage. Some inefficiencies. Beginning to understand water flow. To progress: Refine design for better coverage.',
              s.competent_level = 'Designs and installs effective systems with good coverage. Efficient water use. Appropriate for most gardens. To progress: Handle complex garden layouts.',
              s.proficient_level = 'Excellent system design that is efficient and effective. Automatically adjusts for seasons. Beautiful and invisible in landscape.',
              s.expert_level = 'Expert system design that is perfectly optimized for water efficiency and plant health. Complex gardens are handled expertly.';

MERGE (s:Skill {name: 'Crop Rotation Planning'})
ON CREATE SET s.description = 'Planning garden rotations to place plant families strategically across seasons and years to improve soil health and reduce pest/disease problems.',
              s.how_to_develop = 'Map current garden. Research plant families. Plan rotations for next 2-3 seasons. Implement and track results. Expected time: 3-4 months.',
              s.novice_level = 'Attempts rotation but plans are inconsistent or don\'t account for plant families. Benefits are minimal. To progress: Learn plant families and rotation principles.',
              s.advanced_beginner_level = 'Creates basic rotation plan using plant families. Some logic issues. Beginning to see benefits. To progress: Develop more sophisticated 4-year plans.',
              s.competent_level = 'Implements sound rotation plan that reduces pest and disease problems. Accounts for soil demands of different crops. To progress: Handle multiple garden zones.',
              s.proficient_level = 'Excellent rotation planning that optimizes garden productivity and health. Intuitively balances soil demands and pest management. To progress: Mentor others.',
              s.expert_level = 'Expert rotation planning that creates productive, healthy gardens. Complex multi-zone gardens are managed seamlessly.';

// ADVANCED SKILLS (Advanced/Proficient levels)

MERGE (s:Skill {name: 'Integrated Pest Management'})
ON CREATE SET s.description = 'Comprehensive pest management approach combining prevention, monitoring, cultural controls, and biological controls with minimal chemical use.',
              s.how_to_develop = 'Study IPM principles from extension services. Implement IPM strategies over a full season. Document pest populations and management outcomes. Expected time: 6-9 months.',
              s.novice_level = 'Understands IPM concepts but implementation is incomplete. Reverts to chemical controls frequently. Results are moderate. To progress: Commit to full IPM approach.',
              s.advanced_beginner_level = 'Implements basic IPM with some emphasis on prevention. Uses chemicals less often. Results are improving. To progress: Develop monitoring systems and thresholds.',
              s.competent_level = 'Implements effective IPM with good prevention and monitoring. Chemical use is minimal. Pest problems are well-controlled. To progress: Master beneficial insect management.',
              s.proficient_level = 'Excellent IPM implementation that prevents most pest problems. Monitoring is intuitive. Beneficial insect populations thrive. To progress: Mentor others and refine.',
              s.expert_level = 'Expert IPM practitioner. Garden ecosystems are self-regulating. Pest problems are rare and minor. Teaching others is effortless.';

MERGE (s:Skill {name: 'Succession Planting'})
ON CREATE SET s.description = 'Planning sequential plantings of vegetables or flowers to produce continuous harvests or blooms throughout the growing season.',
              s.how_to_develop = 'Plant vegetables in waves over a season. Track maturity dates and planting intervals. Document harvest timelines. Expected time: 1 season of experimentation.',
              s.novice_level = 'Attempts succession planting but timing is off. Harvest gaps occur. Abundance and scarcity alternate. To progress: Learn planting intervals for different crops.',
              s.advanced_beginner_level = 'Achieves some continuity of harvests. Some gaps remain. Understanding maturity dates improving. To progress: Refine timing for specific crops.',
              s.competent_level = 'Produces fairly continuous harvests with minimal gaps. Understands planting intervals well. Garden productivity is excellent. To progress: Handle multiple crop types simultaneously.',
              s.proficient_level = 'Achieves nearly continuous harvest through excellent planning and timing. Gaps are minimal and intentional. To progress: Mentor others.',
              s.expert_level = 'Expert succession planting creates abundant continuous harvests. Planning is seamless. Multiple crop types coordinate perfectly.';

MERGE (s:Skill {name: 'Advanced Soil Diagnosis'})
ON CREATE SET s.description = 'Using soil tests and observation to diagnose complex soil problems including nutrient deficiencies, compaction, poor drainage, or contamination.',
              s.how_to_develop = 'Order advanced soil tests (microbial, enzyme tests). Diagnose actual soil problems. Implement solutions and track results. Expected time: 3-6 months.',
              s.novice_level = 'Interprets basic soil tests. Misses complex problems. Solutions are sometimes ineffective. To progress: Order more detailed tests and research deeper.',
              s.advanced_beginner_level = 'Interprets soil tests reasonably. Identifies some complex issues. Solutions are partially effective. To progress: Learn advanced soil chemistry and biology.',
              s.competent_level = 'Uses soil tests effectively to diagnose most problems. Develops appropriate solutions. Consistently improves soil conditions. To progress: Master biological soil indicators.',
              s.proficient_level = 'Expert soil diagnosis using multiple methods. Identifies subtle problems quickly. Solutions are excellent and well-targeted. To progress: Specialize further.',
              s.expert_level = 'Expert-level soil diagnosis revealing root causes. Complex problems are identified and solved expertly. Soils are restored to health.';

MERGE (s:Skill {name: 'Propagation from Cuttings'})
ON CREATE SET s.description = 'Growing new plants from plant cuttings using hormones, media, and environmental control. Enables plant multiplication and preservation.',
              s.how_to_develop = 'Propagate 20-30 cuttings from different plant types. Experiment with timing, media, and conditions. Track success rates. Expected time: 2-3 months.',
              s.novice_level = 'Attempts propagation with low success rates. Doesn\'t understand key factors. Most cuttings fail. To progress: Learn optimal timing, media, and conditions.',
              s.advanced_beginner_level = 'Achieves modest success with some plant types. Understanding of conditions improving. To progress: Master rooting hormone use and timing.',
              s.competent_level = 'Successfully propagates most common plants. Good success rates. Understands optimal conditions. To progress: Handle difficult-to-propagate species.',
              s.proficient_level = 'Excellent propagation with high success rates. Intuitive about conditions for different plants. Few failures. To progress: Specialize in difficult propagation.',
              s.expert_level = 'Can propagate nearly any plant successfully. Understands biology of rooting deeply. Difficult species are handled expertly.';

MERGE (s:Skill {name: 'Garden Design Application'})
ON CREATE SET s.description = 'Applying design principles to create visually appealing, functional garden layouts combining form, color, texture, and functionality.',
              s.how_to_develop = 'Study design principles. Create 2-3 garden designs. Build at least one designed garden. Evaluate results. Expected time: 3-4 months.',
              s.novice_level = 'Creates gardens but design is haphazard. Plantings lack cohesion. Aesthetics are accidental. To progress: Study and apply basic design principles.',
              s.advanced_beginner_level = 'Applies basic design principles with mixed results. Some gardens look good, others less so. Understanding is growing. To progress: Master color and composition.',
              s.competent_level = 'Creates visually appealing gardens that function well. Design principles are applied soundly. To progress: Develop personal design style and sophistication.',
              s.proficient_level = 'Designs beautiful gardens that are both stunning and functional. Intuitive about combinations and placement. To progress: Mentor others and take on complex projects.',
              s.expert_level = 'Creates gardens that are strikingly beautiful and highly functional. Design sophistication is expert-level. Signature style is recognizable.';

MERGE (s:Skill {name: 'Microclimate Identification'})
ON CREATE SET s.description = 'Recognizing variations in light, temperature, moisture, and wind within a garden and using them to place plants optimally.',
              s.how_to_develop = 'Map light patterns through a season. Note temperature and moisture variations. Track plant performance in different spots. Expected time: 2-3 months.',
              s.novice_level = 'Knows only broad sun/shade categories. Misses subtle microclimates. Plant placement is sometimes wrong. To progress: Track light and temperature more carefully.',
              s.advanced_beginner_level = 'Recognizes several microclimates. Some plants are well-placed, others struggle. Understanding is improving. To progress: Map microclimates systematically.',
              s.competent_level = 'Effectively identifies and uses microclimates for plant placement. Few placement mistakes. To progress: Recognize complex multi-factor microclimates.',
              s.proficient_level = 'Expert microclimate identification that maximizes plant success. Subtle variations are recognized and used. To progress: Mentor others.',
              s.expert_level = 'Can read gardens and landscapes for microclimates instantly. Complex situations are handled expertly. Plants thrive in optimal conditions.';

// EXPERT SKILLS (Master level)

MERGE (s:Skill {name: 'Garden System Optimization'})
ON CREATE SET s.description = 'Analyzing and improving all aspects of a garden system for maximum productivity, efficiency, and sustainability while minimizing labor.',
              s.how_to_develop = 'Operate a garden for multiple seasons. Identify inefficiencies and problems. Implement systematic improvements. Track results over time. Expected time: 1-2 years.',
              s.novice_level = 'Recognizes that gardens could be more efficient but lacks systematic approach. Changes are random. To progress: Identify and prioritize key problems.',
              s.advanced_beginner_level = 'Makes some improvements that increase efficiency modestly. Thinking is becoming more systematic. To progress: Develop comprehensive improvement plans.',
              s.competent_level = 'Systematically improves gardens through identified changes. Productivity and efficiency increase measurably. To progress: Optimize complex multi-factor systems.',
              s.proficient_level = 'Excellent systems that are highly productive and efficient. Optimization is ongoing and intuitive. Labor requirements are minimal.',
              s.expert_level = 'Master-level garden systems that are beautifully optimized. Productivity is exceptional with minimal input. Systems are models of efficiency and sustainability.';

MERGE (s:Skill {name: 'Teaching Gardening'})
ON CREATE SET s.description = 'Effectively teaching gardening to others through workshops, mentoring, writing, or demonstration. Adapting teaching to different experience levels.',
              s.how_to_develop = 'Mentor beginner gardeners. Teach workshops or classes. Create written or visual teaching materials. Expected time: Ongoing throughout career.',
              s.novice_level = 'Shares gardening knowledge but teaching is disorganized. Learners don\'t always understand. Enthusiasm is present but method is lacking. To progress: Study teaching methods.',
              s.advanced_beginner_level = 'Teaches reasonably well with some clarity. Learners understand basic concepts. Room for improvement in engaging diverse learners. To progress: Develop better explanations.',
              s.competent_level = 'Teaches clearly and engages learners. Content is well-organized. Most students learn effectively. To progress: Handle diverse learning styles better.',
              s.proficient_level = 'Excellent teaching that inspires and educates. Adapts to different learners naturally. Students progress well. To progress: Create formal curricula.',
              s.expert_level = 'Master teacher who transforms gardeners\' understanding and abilities. Teaching is engaging, clear, and inspiring. Students become passionate gardeners.';

MERGE (s:Skill {name: 'Horticultural Innovation'})
ON CREATE SET s.description = 'Experimenting with new techniques, varieties, and approaches. Contributing original insights to gardening knowledge through documentation and analysis.',
              s.how_to_develop = 'Regularly try new techniques and varieties. Document experiments carefully. Share findings. Collaborate on gardening projects. Expected time: Ongoing throughout career.',
              s.novice_level = 'Tries new things occasionally but doesn\'t track results systematically. Insights are limited. To progress: Document experiments and analyze outcomes.',
              s.advanced_beginner_level = 'Experiments with new approaches. Some documentation of results. Beginning to generate useful insights. To progress: Develop more rigorous experimental approach.',
              s.competent_level = 'Systematically experiments with new techniques. Results are documented and shared. Contributes modest innovations. To progress: Tackle bigger problems and innovations.',
              s.proficient_level = 'Regular experimentation that generates useful innovations. Documentation is excellent. Contributions to gardening knowledge are recognized. To progress: Pursue ambitious projects.',
              s.expert_level = 'Pioneering innovations that advance horticultural understanding. Experimentation is rigorous and insightful. Contributions significantly benefit gardening community.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

MERGE (t:Trait {name: 'Patience'})
ON CREATE SET t.description = 'The ability to wait calmly and accept slow growth cycles, delayed results, and seasonal timelines without frustration. Essential for gardening where growth takes weeks or months.',
              t.measurement_criteria = 'Assessed through tolerance for delayed gratification and ability to maintain consistent effort over extended periods. Low (0-25): Becomes frustrated quickly when plants grow slowly, abandons projects. Moderate (26-50): Can wait for results but may skip steps if impatient. High (51-75): Naturally patient with growth processes, enjoys observation periods. Exceptional (76-100): Demonstrates remarkable calm about long timelines, thrives with multi-year projects.';

MERGE (t:Trait {name: 'Observation Ability'})
ON CREATE SET t.description = 'The capacity to notice subtle changes, details, and patterns in plant growth, pest presence, and environmental conditions over time.',
              t.measurement_criteria = 'Assessed through ability to detect small changes in plants and environment. Low (0-25): Misses obvious signs of problems, only notices when severe. Moderate (26-50): Notices some changes but may misinterpret them. High (51-75): Regularly spots subtle changes in plant condition and environment. Exceptional (76-100): Intuitively detects minute changes others miss, anticipates problems before visible symptoms.';

MERGE (t:Trait {name: 'Physical Stamina'})
ON CREATE SET t.description = 'The capacity for sustained physical activity including digging, planting, weeding, and garden maintenance without excessive fatigue.',
              t.measurement_criteria = 'Assessed through ability to work in garden for extended periods. Low (0-25): Tires quickly, can work only briefly before fatigue. Moderate (26-50): Can work for moderate periods with rest breaks. High (51-75): Works productively for extended periods with good energy. Exceptional (76-100): Maintains high energy through full days of physical garden work.';

MERGE (t:Trait {name: 'Problem Solving Ability'})
ON CREATE SET t.description = 'The capacity to analyze garden challenges, identify root causes, and develop solutions when plants fail or problems emerge.',
              t.measurement_criteria = 'Assessed through approach to troubleshooting garden problems. Low (0-25): Struggles to diagnose problems, applies random solutions. Moderate (26-50): Can work through problems with guidance or research. High (51-75): Systematically identifies problems and develops solutions. Exceptional (76-100): Quickly diagnoses complex issues and devises effective solutions intuitively.';

MERGE (t:Trait {name: 'Perseverance'})
ON CREATE SET t.description = 'The determination to continue with gardening through failures, setbacks, and learning experiences without giving up.',
              t.measurement_criteria = 'Assessed through response to failed plants and seasons. Low (0-25): Quits after first significant failures, becomes discouraged easily. Moderate (26-50): Recovers from failures but may have confidence issues. High (51-75): Bounces back from setbacks and learns from failures. Exceptional (76-100): Treats failures as learning opportunities, maintains enthusiasm through repeated setbacks.';

MERGE (t:Trait {name: 'Attention to Detail'})
ON CREATE SET t.description = 'The tendency to notice and care about precision in tasks like proper planting depth, spacing, watering amounts, and following protocols.',
              t.measurement_criteria = 'Assessed through consistency and accuracy in executing tasks. Low (0-25): Rushes through tasks, ignores specifications, inconsistent execution. Moderate (26-50): Generally careful but sometimes skips details. High (51-75): Consistently pays attention to details and proper technique. Exceptional (76-100): Meticulous execution of all tasks, catches and corrects own mistakes.';

MERGE (t:Trait {name: 'Physical Coordination'})
ON CREATE SET t.description = 'The ability to move with control and precision when using tools, planting delicate seedlings, and executing fine motor tasks.',
              t.measurement_criteria = 'Assessed through smoothness and accuracy of physical movements. Low (0-25): Clumsy movements, frequent dropped tools or damaged plants. Moderate (26-50): Generally adequate coordination with occasional errors. High (51-75): Smooth, controlled movements with few mistakes. Exceptional (76-100): Exceptional dexterity enables efficient, graceful execution of all physical tasks.';

MERGE (t:Trait {name: 'Curiosity'})
ON CREATE SET t.description = 'The drive to learn about plants, growing methods, and ecosystems, seeking knowledge and exploring new approaches voluntarily.',
              t.measurement_criteria = 'Assessed through initiative in learning and exploration. Low (0-25): Minimal interest in learning, prefers to repeat familiar approaches. Moderate (26-50): Learns when necessary but doesn\'t seek knowledge independently. High (51-75): Actively seeks learning about gardening topics and new plants. Exceptional (76-100): Passionate learner constantly exploring gardening knowledge and experimenting with new approaches.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// NOVICE LEVEL MILESTONES (1-2 achievements)

MERGE (m:Milestone {name: 'Plant First Garden'})
ON CREATE SET m.description = 'Successfully plant your first small garden or container with basic plants. This foundational milestone marks entry into active gardening.',
              m.how_to_achieve = 'Choose an easy location with decent sunlight. Select 3-5 easy plants (herbs, vegetables, or flowers). Prepare soil by adding compost. Plant correctly at appropriate depth. Water regularly for 2-3 weeks. Focus on keeping plants alive rather than perfect technique. Most people achieve this in their first 2-4 weeks of gardening.';

MERGE (m:Milestone {name: 'Harvest First Vegetable'})
ON CREATE SET m.description = 'Successfully grow and harvest your first vegetable from seed or seedling to maturity. Demonstrates basic plant care competency.',
              m.how_to_achieve = 'Start with easy fast-growing vegetables like lettuce, radishes, beans, or zucchini. Plant in spring or early summer for your climate. Water consistently. Monitor for pests and disease but use gentle interventions. Harvest when ripe. Expected timeline: 4-8 weeks depending on vegetable.';

// DEVELOPING LEVEL MILESTONES (2-3 achievements)

MERGE (m:Milestone {name: 'Start Seeds Indoors Successfully'})
ON CREATE SET m.description = 'Start seeds indoors under lights and successfully transplant them to the garden with good survival rates. Demonstrates expanded growing capability.',
              m.how_to_achieve = 'Research seed starting for your climate and chosen plants. Prepare seed starting mix and containers with drainage holes. Plant seeds at correct depth. Provide adequate light and moisture. Harden off seedlings over 7-10 days. Transplant to garden at correct time. Achieve 75%+ survival rate of transplanted seedlings.';

MERGE (m:Milestone {name: 'Build and Maintain Working Compost System'})
ON CREATE SET m.description = 'Successfully build a compost bin and maintain it through a full season, producing usable compost for garden use.',
              m.how_to_achieve = 'Build or acquire a compost bin (3x3x3 feet or similar). Layer brown and green materials in appropriate ratio. Turn or manage pile regularly. Maintain moisture like wrung-out sponge. Expect compost ready in 3-6 months depending on method and effort. Use finished compost in garden to close the loop.';

MERGE (m:Milestone {name: 'Achieve Continuous Garden Harvest'})
ON CREATE SET m.description = 'Plan and execute succession planting to produce continuous harvests over an entire growing season with minimal gaps.',
              m.how_to_achieve = 'Choose 2-3 vegetables with known maturity dates. Calculate planting intervals (e.g., lettuce every 2 weeks). Create a planting calendar. Execute succession plantings on schedule. Track harvest dates. Achieve harvests at least weekly for 8+ consecutive weeks with no more than 1-week gaps.';

MERGE (m:Milestone {name: 'Successfully Propagate Plants from Cuttings'})
ON CREATE SET m.description = 'Grow new plants from cuttings of 3+ different species with reasonable success rates. Demonstrates plant multiplication capability.',
              m.how_to_achieve = 'Choose easy-to-propagate plants (pothos, coleus, herbs, succulents). Take healthy cuttings at proper times. Use rooting hormone if desired. Place in moist media and provide appropriate light and humidity. Maintain conditions for 2-4 weeks. Achieve 50%+ success rate (roots forming on at least half of cuttings).';

// COMPETENT LEVEL MILESTONES (2-4 achievements)

MERGE (m:Milestone {name: 'Manage Pest or Disease Problem Successfully'})
ON CREATE SET m.description = 'Identify a specific pest or disease problem in your garden and implement integrated management achieving significant control.',
              m.how_to_achieve = 'Notice a pest or disease problem early. Correctly identify the specific problem using references or experts. Research management options. Implement cultural controls (removal, improved sanitation) and/or biological or organic controls. Monitor effectiveness over 3-4 weeks. Achieve 70%+ control reducing plant damage significantly.';

MERGE (m:Milestone {name: 'Complete Full Season Garden Cycle'})
ON CREATE SET m.description = 'Plan and manage a garden through a complete growing season from spring preparation through fall harvest and winter cleanup.',
              m.how_to_achieve = 'Start in spring: prepare beds, amend soil, plant early crops. Summer: maintain, water, weed, manage pests. Fall: extend season if possible, harvest before frost, prepare for winter. Complete cleanup: compost debris, amend beds for next year. Document results and lessons learned.';

MERGE (m:Milestone {name: 'Grow Garden Organically Through Season'})
ON CREATE SET m.description = 'Maintain a productive garden for a full season without using synthetic pesticides or fertilizers, using only organic methods.',
              m.how_to_achieve = 'Use compost and organic fertilizers (fish emulsion, bone meal, leaf mold). Control pests through prevention, monitoring, beneficial insects, and organic products (neem, spinosad, row covers). Manage diseases through resistant varieties and cultural practices. Maintain productivity without synthetics. Document pest and disease management strategies used.';

MERGE (m:Milestone {name: 'Establish Multi-Year Crop Rotation Plan'})
ON CREATE SET m.description = 'Design and implement a working crop rotation plan across multiple garden beds spanning 3+ years considering plant families and soil demands.',
              m.how_to_achieve = 'Map your garden beds. Research plant families and their soil demands (legumes add nitrogen, alliums deplete, brassicas have specific pest/disease issues). Create a 3-year rotation plan on paper. Implement the first year. Track plant performance and pest/disease pressures. Adjust plan based on results. Demonstrate understanding of why rotation matters.';

MERGE (m:Milestone {name: 'Achieve Measurable Soil Improvement'})
ON CREATE SET m.description = 'Get soil tested, implement amendments based on results, and achieve measurable improvement in soil quality within one season.',
              m.how_to_achieve = 'Send soil sample to extension office or lab for complete analysis. Review results and recommendations. Apply recommended amendments (compost, lime, sulfur, nutrients). Grow garden through season. Get second soil test after harvest. Document improvement in pH, nutrient levels, or organic matter. Achieve measurable improvement in at least two parameters.';

// ADVANCED LEVEL MILESTONES (2-4 achievements)

MERGE (m:Milestone {name: 'Design and Execute Specialized Garden'})
ON CREATE SET m.description = 'Create and successfully manage a specialized garden focusing on a specific plant type (vegetables, herbs, flowers, native plants, fruits, etc.).',
              m.how_to_achieve = 'Choose a specialization (e.g., heirloom tomatoes, medicinal herbs, native wildflower garden). Research 15+ varieties or species in your specialization. Design garden layout considering their needs. Plant and maintain through season. Achieve healthy growth and productivity. Document successes and challenges. Be able to teach others about your specialty.';

MERGE (m:Milestone {name: 'Mentor New Gardener Successfully'})
ON CREATE SET m.description = 'Mentor a beginning gardener through their first season, helping them establish their own productive garden.',
              m.how_to_achieve = 'Identify a beginner wanting to learn gardening. Meet regularly (monthly minimum). Teach site selection, soil preparation, plant selection, watering, pest management. Be available for problem-solving. Help them through first growing season. Have them produce their first harvest or significant plant growth. Receive positive feedback on your mentoring.';

MERGE (m:Milestone {name: 'Overcome Major Soil Challenge'})
ON CREATE SET m.description = 'Successfully diagnose and remediate a significant soil problem (compaction, poor drainage, nutrient deficiency, contamination) showing measurable improvement.',
              m.how_to_achieve = 'Identify your most challenging soil problem through observation and testing. Research the root cause thoroughly. Design a targeted intervention plan (adding amendments, improving drainage, cover cropping, etc.). Implement plan over 1-2 seasons. Get second soil test or observe plant performance improvement. Document the problem, solution, and results.';

MERGE (m:Milestone {name: 'Optimize Garden System for Efficiency'})
ON CREATE SET m.description = 'Analyze your entire garden system and implement improvements that measurably increase productivity or reduce labor/resource use.',
              m.how_to_achieve = 'Map current garden layout, watering, pest management, and effort requirements. Identify inefficiencies (e.g., poor water delivery, high labor, wasted space). Implement 3+ specific improvements (better irrigation, better plant placement, automated systems, simplified layout, etc.). Track results for full season. Achieve measurable improvement in productivity or reduced labor by 25%+.';

MERGE (m:Milestone {name: 'Create Biodiverse Pollinator Garden'})
ON CREATE SET m.description = 'Design and establish a garden specifically supporting pollinators and beneficial insects with diverse native plants and habitat features.',
              m.how_to_achieve = 'Research native plants and pollinators in your region. Select diverse native plants blooming at different times. Plant for season-long blooms (spring through fall). Provide water source. Reduce or eliminate pesticide use. Minimize tilling to preserve soil invertebrates. Over a season, observe increased pollinator activity and beneficial insect populations. Document species observed.';

// MASTER LEVEL MILESTONES (2-5 achievements)

MERGE (m:Milestone {name: 'Restore Severely Degraded Soil'})
ON CREATE SET m.description = 'Successfully restore and transform severely degraded soil (compacted, eroded, depleted, or contaminated) to productive gardening medium over 2+ years.',
              m.how_to_achieve = 'Assess extent of degradation through testing and observation. Design comprehensive restoration plan. Implement practices over 2+ years: deep soil amendment, cover cropping, reduced tilling, organic matter addition, biological inoculation. Get soil tests at 6-month intervals. Document transformation from degraded to productive soil. Be able to teach others about your restoration work.';

MERGE (m:Milestone {name: 'Achieve Complete Horticultural Mastery Certification'})
ON CREATE SET m.description = 'Obtain formal recognition of horticultural expertise through certification, master gardener program completion, or equivalent recognition.',
              m.how_to_achieve = 'Complete Master Gardener training program in your area (typically 50-100 hours of training). Pass certification exam demonstrating comprehensive knowledge. Fulfill service requirements (volunteer hours). Maintain certification through continuing education. Alternatively: complete horticultural degree, specialize and become recognized expert through publications/presentations.';

MERGE (m:Milestone {name: 'Conduct Documented Horticultural Experiment'})
ON CREATE SET m.description = 'Design and execute a formal experiment testing a horticultural question, documenting methodology and results clearly.',
              m.how_to_achieve = 'Identify an interesting question (e.g., "Does mulch type affect tomato yield?", "Which propagation method works best for X plant?"). Design controlled experiment with treatments and controls. Execute over a full season with careful documentation. Analyze results statistically. Write up findings. Share results with gardening community through presentation, publication, or online post.';

MERGE (m:Milestone {name: 'Develop Innovative Gardening Technique'})
ON CREATE SET m.description = 'Create and successfully implement an original gardening approach, technique, or system that produces superior results or solves a specific problem.',
              m.how_to_achieve = 'Identify a gardening challenge or limitation in your context. Research existing approaches. Design an innovative solution combining techniques in a new way or creating entirely new approach. Test thoroughly in your garden over 1+ seasons. Demonstrate clear benefits (higher productivity, less labor, better sustainability, etc.). Document and share innovation with others.';

MERGE (m:Milestone {name: 'Establish Community Gardening Program'})
ON CREATE SET m.description = 'Create and lead a community gardening program that engages multiple people, teaches gardening, and produces shared benefits.',
              m.how_to_achieve = 'Identify community need or opportunity. Establish a program (community garden beds, school garden, neighborhood growing project, garden club, etc.). Recruit participants. Provide leadership and teaching. Run successfully for at least one full season. Engage 10+ people in active gardening. Document participation and outcomes. Foster ongoing community interest.';

MERGE (m:Milestone {name: 'Make Significant Horticultural Contribution'})
ON CREATE SET m.description = 'Contribute meaningfully to horticultural knowledge, practice, or community through teaching, innovation, research, or advocacy.',
              m.how_to_achieve = 'Identify an area where you can contribute (e.g., publishing gardening articles, developing improved varieties, researching techniques, teaching workshops, environmental restoration, advocacy for sustainable practices). Contribute substantially and professionally. Receive recognition from gardening community or organizations. Make lasting positive impact on how others garden or think about gardening.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ------------------------------------------------------------
// Level 1 (Gardening Novice) Requirements
// ------------------------------------------------------------

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (k:Knowledge {name: 'Gardening Soil Basics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (k:Knowledge {name: 'Basic Plant Anatomy'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (k:Knowledge {name: 'Container Gardening Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (k:Knowledge {name: 'Watering Plants Properly'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (k:Knowledge {name: 'Common Garden Plants'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (s:Skill {name: 'Soil Moisture Assessment'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (s:Skill {name: 'Basic Watering Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (s:Skill {name: 'Plant Identification'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (s:Skill {name: 'Garden Tool Proficiency'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (s:Skill {name: 'Seed Planting'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (t:Trait {name: 'Patience'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (t:Trait {name: 'Observation Ability'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Gardening Novice'})
MATCH (m:Milestone {name: 'Plant First Garden'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ------------------------------------------------------------
// Level 2 (Gardening Developing) Requirements
// ------------------------------------------------------------

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Gardening Soil Basics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Watering Plants Properly'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Seed Starting and Propagation'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Soil Preparation and Amendment'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Plant Nutrition and Fertilizing'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Seasonal Garden Timing'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (k:Knowledge {name: 'Common Pests and Diseases in Gardens'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Soil Moisture Assessment'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Basic Watering Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Plant Identification'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Seed Planting'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Transplanting Seedlings'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Composting'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Fertilizing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (s:Skill {name: 'Pest Identification'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (t:Trait {name: 'Patience'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (t:Trait {name: 'Observation Ability'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (m:Milestone {name: 'Harvest First Vegetable'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Gardening Developing'})
MATCH (m:Milestone {name: 'Start Seeds Indoors Successfully'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ------------------------------------------------------------
// Level 3 (Gardening Competent) Requirements
// ------------------------------------------------------------

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Gardening Soil Basics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Watering Plants Properly'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Soil Preparation and Amendment'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Plant Nutrition and Fertilizing'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Crop Rotation and Succession Planting'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Pruning and Plant Training'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (k:Knowledge {name: 'Common Pests and Diseases in Gardens'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Soil Moisture Assessment'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Composting'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Soil Amendment'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Pruning'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Pest Identification'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Disease Diagnosis'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Pest Management'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (s:Skill {name: 'Crop Rotation Planning'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (t:Trait {name: 'Patience'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (t:Trait {name: 'Observation Ability'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (t:Trait {name: 'Problem Solving Ability'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (m:Milestone {name: 'Complete Full Season Garden Cycle'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Gardening Competent'})
MATCH (m:Milestone {name: 'Achieve Continuous Garden Harvest'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ------------------------------------------------------------
// Level 4 (Gardening Advanced) Requirements
// ------------------------------------------------------------

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Integrated Pest Management (IPM)'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Garden Ecosystem and Biodiversity'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Advanced Soil Science'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Specialization in Plant Types'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Landscape Design Principles'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (k:Knowledge {name: 'Water Management and Irrigation Systems'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Integrated Pest Management'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Succession Planting'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Advanced Soil Diagnosis'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Propagation from Cuttings'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Garden Design Application'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (s:Skill {name: 'Microclimate Identification'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (t:Trait {name: 'Observation Ability'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (t:Trait {name: 'Problem Solving Ability'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (t:Trait {name: 'Curiosity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (m:Milestone {name: 'Design and Execute Specialized Garden'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Gardening Advanced'})
MATCH (m:Milestone {name: 'Mentor New Gardener Successfully'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ------------------------------------------------------------
// Level 5 (Gardening Master) Requirements
// ------------------------------------------------------------

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (k:Knowledge {name: 'Horticultural Innovation and Research'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (k:Knowledge {name: 'Soil Restoration and Regeneration'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (k:Knowledge {name: 'Teaching and Mentoring Gardeners'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (s:Skill {name: 'Garden System Optimization'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (s:Skill {name: 'Teaching Gardening'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (s:Skill {name: 'Horticultural Innovation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (t:Trait {name: 'Curiosity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (t:Trait {name: 'Perseverance'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (m:Milestone {name: 'Restore Severely Degraded Soil'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Gardening Master'})
MATCH (m:Milestone {name: 'Achieve Complete Horticultural Mastery Certification'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// Component Prerequisites: Knowledge Prerequisites
// ============================================================

MATCH (k1:Knowledge {name: 'Seed Starting and Propagation'})
MATCH (k2:Knowledge {name: 'Gardening Soil Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Soil Preparation and Amendment'})
MATCH (k2:Knowledge {name: 'Gardening Soil Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Plant Nutrition and Fertilizing'})
MATCH (k2:Knowledge {name: 'Gardening Soil Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Crop Rotation and Succession Planting'})
MATCH (k2:Knowledge {name: 'Common Garden Plants'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Composting Methods'})
MATCH (k2:Knowledge {name: 'Gardening Soil Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Integrated Pest Management (IPM)'})
MATCH (k2:Knowledge {name: 'Common Pests and Diseases in Gardens'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Soil Science'})
MATCH (k2:Knowledge {name: 'Soil Preparation and Amendment'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Water Management and Irrigation Systems'})
MATCH (k2:Knowledge {name: 'Watering Plants Properly'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Garden Ecosystem and Biodiversity'})
MATCH (k2:Knowledge {name: 'Common Garden Plants'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Soil Restoration and Regeneration'})
MATCH (k2:Knowledge {name: 'Advanced Soil Science'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// ============================================================
// Component Prerequisites: Skill Prerequisites
// ============================================================

MATCH (s1:Skill {name: 'Composting'})
MATCH (s2:Skill {name: 'Soil Moisture Assessment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Soil Amendment'})
MATCH (s2:Skill {name: 'Composting'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Fertilizing'})
MATCH (s2:Skill {name: 'Soil Moisture Assessment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Pruning'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Pest Management'})
MATCH (s2:Skill {name: 'Pest Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Disease Diagnosis'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Watering System Design'})
MATCH (s2:Skill {name: 'Basic Watering Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Crop Rotation Planning'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Integrated Pest Management'})
MATCH (s2:Skill {name: 'Pest Management'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Integrated Pest Management'})
MATCH (s2:Skill {name: 'Disease Diagnosis'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Advanced Soil Diagnosis'})
MATCH (s2:Skill {name: 'Soil Amendment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Propagation from Cuttings'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Garden Design Application'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Microclimate Identification'})
MATCH (s2:Skill {name: 'Soil Moisture Assessment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Garden System Optimization'})
MATCH (s2:Skill {name: 'Watering System Design'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Garden System Optimization'})
MATCH (s2:Skill {name: 'Crop Rotation Planning'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Teaching Gardening'})
MATCH (s2:Skill {name: 'Plant Identification'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Horticultural Innovation'})
MATCH (s2:Skill {name: 'Garden System Optimization'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Skill to Knowledge Prerequisites

MATCH (s:Skill {name: 'Seed Planting'})
MATCH (k:Knowledge {name: 'Seasonal Garden Timing'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Transplanting Seedlings'})
MATCH (k:Knowledge {name: 'Basic Plant Anatomy'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Soil Amendment'})
MATCH (k:Knowledge {name: 'Plant Nutrition and Fertilizing'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Pest Identification'})
MATCH (k:Knowledge {name: 'Common Pests and Diseases in Gardens'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Disease Diagnosis'})
MATCH (k:Knowledge {name: 'Common Pests and Diseases in Gardens'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Watering System Design'})
MATCH (k:Knowledge {name: 'Water Management and Irrigation Systems'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s:Skill {name: 'Garden Design Application'})
MATCH (k:Knowledge {name: 'Landscape Design Principles'})
CREATE (s)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

// ============================================================
// Component Prerequisites: Milestone Prerequisites
// ============================================================

MATCH (m1:Milestone {name: 'Start Seeds Indoors Successfully'})
MATCH (m2:Milestone {name: 'Plant First Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Build and Maintain Working Compost System'})
MATCH (m2:Milestone {name: 'Plant First Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Continuous Garden Harvest'})
MATCH (m2:Milestone {name: 'Harvest First Vegetable'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Propagate Plants from Cuttings'})
MATCH (m2:Milestone {name: 'Plant First Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Manage Pest or Disease Problem Successfully'})
MATCH (m2:Milestone {name: 'Plant First Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete Full Season Garden Cycle'})
MATCH (m2:Milestone {name: 'Harvest First Vegetable'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Grow Garden Organically Through Season'})
MATCH (m2:Milestone {name: 'Complete Full Season Garden Cycle'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Multi-Year Crop Rotation Plan'})
MATCH (m2:Milestone {name: 'Achieve Continuous Garden Harvest'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Measurable Soil Improvement'})
MATCH (m2:Milestone {name: 'Build and Maintain Working Compost System'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Design and Execute Specialized Garden'})
MATCH (m2:Milestone {name: 'Complete Full Season Garden Cycle'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Mentor New Gardener Successfully'})
MATCH (m2:Milestone {name: 'Complete Full Season Garden Cycle'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Overcome Major Soil Challenge'})
MATCH (m2:Milestone {name: 'Achieve Measurable Soil Improvement'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Optimize Garden System for Efficiency'})
MATCH (m2:Milestone {name: 'Design and Execute Specialized Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Biodiverse Pollinator Garden'})
MATCH (m2:Milestone {name: 'Design and Execute Specialized Garden'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Restore Severely Degraded Soil'})
MATCH (m2:Milestone {name: 'Overcome Major Soil Challenge'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Conduct Documented Horticultural Experiment'})
MATCH (m2:Milestone {name: 'Mentor New Gardener Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Innovative Gardening Technique'})
MATCH (m2:Milestone {name: 'Conduct Documented Horticultural Experiment'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Community Gardening Program'})
MATCH (m2:Milestone {name: 'Mentor New Gardener Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Make Significant Horticultural Contribution'})
MATCH (m2:Milestone {name: 'Develop Innovative Gardening Technique'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);
