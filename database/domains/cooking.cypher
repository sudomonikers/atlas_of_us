// Domain: Cooking
// Generated: 2025-12-20
// Description: The art and science of preparing food through various techniques, combining ingredients, and applying heat or other methods to create nourishing and flavorful dishes

// ============================================================
// DOMAIN: Cooking
// Generated: 2025-12-20
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Cooking',
  description: 'The art and science of preparing food through various techniques, combining ingredients, and applying heat or other methods to create nourishing and flavorful dishes',
  level_count: 5,
  created_date: date(),
  scope_included: ['fundamental cooking techniques (boiling, sautéing, roasting, grilling, frying, steaming)', 'food preparation and knife skills', 'flavor development and seasoning', 'cooking methods across global cuisines', 'food safety and sanitation', 'recipe creation and adaptation', 'ingredient selection and substitution', 'kitchen equipment and tools', 'timing and coordination of multiple dishes', 'presentation and plating', 'understanding heat control and cooking chemistry'],
  scope_excluded: ['professional restaurant management (separate domain)', 'food photography and styling (separate domain)', 'general nutrition science (separate domain - though cooking intersects with it)', 'food preservation techniques like canning or fermentation (separate domain)', 'baking and pastry work (separate domain - requires specialized techniques)', 'bartending and mixology (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Cooking Novice',
  description: 'Learning basic cooking techniques, following recipes precisely, understanding fundamental food safety, and confidently preparing simple meals with clear instructions'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Cooking Developing',
  description: 'Building proficiency with multiple cooking methods, confidently preparing everyday meals, understanding flavor profiles, and beginning to adapt recipes with guidance'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Cooking Competent',
  description: 'Cooking a wide variety of dishes reliably, managing multiple components simultaneously, understanding ingredient interactions, and creating satisfying meals without heavy reliance on recipes'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Cooking Advanced',
  description: 'Creating dishes with sophisticated flavors and techniques, understanding cooking science deeply, mentoring others in the kitchen, and confidently experimenting across cuisines'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Cooking Master',
  description: 'Demonstrating expert-level culinary skill, creating original recipes and dishes, pushing culinary boundaries, and recognized as an authority in cooking techniques and cuisine'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Cooking'})
MATCH (level1:Domain_Level {name: 'Cooking Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Cooking'})
MATCH (level2:Domain_Level {name: 'Cooking Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Cooking'})
MATCH (level3:Domain_Level {name: 'Cooking Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Cooking'})
MATCH (level4:Domain_Level {name: 'Cooking Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Cooking'})
MATCH (level5:Domain_Level {name: 'Cooking Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// FOUNDATIONAL KNOWLEDGE - Novice Level

MERGE (k:Knowledge {name: 'Cooking Knife Safety'})
ON CREATE SET k.description = 'Essential safety practices when using knives in the kitchen, including proper grip, cutting techniques, and accident prevention',
              k.how_to_learn = 'Watch instructional videos demonstrating proper knife handling. Practice under supervision with a chef or experienced cook. Review kitchen safety guidelines. Expected time: 1-2 weeks of practice.',
              k.remember_level = 'Recall basic knife safety rules: keep fingers tucked, use proper grip, maintain sharp knives, cut away from body',
              k.understand_level = 'Explain why each safety rule matters and understand the risks of improper technique',
              k.apply_level = 'Apply safety practices consistently when using knives in all cooking situations',
              k.analyze_level = 'Identify unsafe knife practices in yourself or others and correct them',
              k.evaluate_level = 'Judge the safety of different knife techniques and recommend improvements',
              k.create_level = 'Develop training materials or lessons teaching knife safety to beginners';

MERGE (k:Knowledge {name: 'Basic Cooking Methods'})
ON CREATE SET k.description = 'Introduction to fundamental cooking techniques: boiling, sautéing, baking, grilling, and steaming',
              k.how_to_learn = 'Practice each basic cooking method with simple ingredients. Follow step-by-step recipes for each technique. Watch cooking videos demonstrating each method. Expected time: 3-4 weeks of practice.',
              k.remember_level = 'Recall the names and basic temperatures for boiling, sautéing, baking, grilling, and steaming',
              k.understand_level = 'Explain when to use each cooking method and what happens to food during each process',
              k.apply_level = 'Successfully prepare simple dishes using each basic cooking method',
              k.analyze_level = 'Determine which cooking method works best for different ingredients and dishes',
              k.evaluate_level = 'Judge the effectiveness of a chosen cooking method based on desired outcomes',
              k.create_level = 'Invent new applications of basic cooking methods for different ingredients';

MERGE (k:Knowledge {name: 'Food Safety and Sanitation'})
ON CREATE SET k.description = 'Critical practices for preventing foodborne illness: proper food storage, temperature control, cross-contamination prevention, and cleanliness standards',
              k.how_to_learn = 'Take a food safety certification course or read approved guidelines. Study proper storage temperatures and times. Learn cross-contamination prevention. Expected time: 1-2 weeks.',
              k.remember_level = 'Recall safe internal temperatures for various proteins, proper storage times, and basic sanitation practices',
              k.understand_level = 'Explain why food safety practices matter and how bacteria and pathogens spread',
              k.apply_level = 'Apply proper food safety protocols consistently in all food preparation',
              k.analyze_level = 'Identify potential food safety risks in kitchen setups or procedures',
              k.evaluate_level = 'Judge whether food is safe to eat based on appearance, smell, and handling history',
              k.create_level = 'Design food safety procedures for different kitchen environments';

MERGE (k:Knowledge {name: 'Basic Ingredient Preparation'})
ON CREATE SET k.description = 'Fundamental food preparation techniques: washing, peeling, chopping, dicing, and mincing of common ingredients',
              k.how_to_learn = 'Watch preparation technique videos. Practice with common vegetables and proteins. Work alongside experienced cooks. Expected time: 2-3 weeks of regular practice.',
              k.remember_level = 'Recall proper techniques for peeling, chopping, dicing, and mincing basic vegetables',
              k.understand_level = 'Explain the purpose of different cutting sizes and preparation methods',
              k.apply_level = 'Successfully prepare ingredients to specified sizes and standards',
              k.analyze_level = 'Evaluate how different cutting sizes affect cooking time and texture',
              k.evaluate_level = 'Judge the appropriate preparation method for specific ingredients',
              k.create_level = 'Develop efficient preparation techniques for specialized ingredients';

MERGE (k:Knowledge {name: 'Basic Seasoning'})
ON CREATE SET k.description = 'Fundamentals of salt, pepper, and simple herbs; understanding how seasoning enhances food flavor',
              k.how_to_learn = 'Taste foods with varying seasoning levels. Practice seasoning simple dishes. Study common herbs and spices. Expected time: 2-3 weeks.',
              k.remember_level = 'Recall common herbs and basic seasoning amounts for simple dishes',
              k.understand_level = 'Explain how salt, pepper, and herbs enhance or change the flavor of food',
              k.apply_level = 'Season simple dishes appropriately to enhance their natural flavors',
              k.analyze_level = 'Taste dishes and identify what seasonings are present or missing',
              k.evaluate_level = 'Judge whether a dish is properly seasoned and how to adjust it',
              k.create_level = 'Develop custom seasoning blends for different types of dishes';

MERGE (k:Knowledge {name: 'Recipe Reading and Following'})
ON CREATE SET k.description = 'Understanding recipe structure, ingredients lists, measurements, cooking times, and following step-by-step instructions',
              k.how_to_learn = 'Study recipe formats. Practice following recipes precisely. Discuss recipe terminology with experienced cooks. Expected time: 1 week.',
              k.remember_level = 'Recall common recipe abbreviations and measurement units',
              k.understand_level = 'Explain recipe structure and understand why order of operations matters',
              k.apply_level = 'Follow recipes accurately to produce consistent results',
              k.analyze_level = 'Compare different recipes for the same dish to identify variations',
              k.evaluate_level = 'Judge recipe quality and clarity for others to follow',
              k.create_level = 'Write clear, well-structured recipes for others to follow';

MERGE (k:Knowledge {name: 'Equipment and Cookware'})
ON CREATE SET k.description = 'Basic kitchen equipment: pots, pans, knives, measuring tools, and their proper uses and care',
              k.how_to_learn = 'Study equipment uses and features. Practice using different cookware. Learn cleaning and maintenance. Expected time: 2 weeks.',
              k.remember_level = 'Recall names and basic uses of common kitchen equipment',
              k.understand_level = 'Explain why different tools are used for different tasks',
              k.apply_level = 'Select and properly use appropriate equipment for different cooking tasks',
              k.analyze_level = 'Determine what equipment is needed for specific recipes',
              k.evaluate_level = 'Judge the quality and appropriateness of different tools',
              k.create_level = 'Develop innovative uses for common kitchen equipment';

// CORE KNOWLEDGE - Developing/Competent Levels

MERGE (k:Knowledge {name: 'Heat Control and Temperature'})
ON CREATE SET k.description = 'Understanding different heat levels, temperature management, and how heat affects cooking speed and food outcomes',
              k.how_to_learn = 'Use thermometers to understand actual temperatures. Cook with different heat settings. Study how temperature affects different ingredients. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall temperature ranges for low, medium, and high heat cooking',
              k.understand_level = 'Explain how temperature affects cooking speed, browning, and texture',
              k.apply_level = 'Adjust heat appropriately throughout cooking to achieve desired results',
              k.analyze_level = 'Determine ideal cooking temperatures for different dishes and ingredients',
              k.evaluate_level = 'Judge whether food is properly cooked based on temperature and appearance',
              k.create_level = 'Design temperature profiles for new dishes';

MERGE (k:Knowledge {name: 'Flavor Pairing and Profiles'})
ON CREATE SET k.description = 'Understanding which flavors complement each other, how to build flavor profiles, and creating balanced taste experiences',
              k.how_to_learn = 'Taste many food combinations. Study flavor profiles of different cuisines. Experiment with ingredient pairings. Expected time: 4-6 weeks of exploration.',
              k.remember_level = 'Recall classic flavor combinations and complementary ingredient pairings',
              k.understand_level = 'Explain why certain flavors work well together and how they interact',
              k.apply_level = 'Create dishes with well-balanced, complementary flavor profiles',
              k.analyze_level = 'Taste a dish and identify individual flavors and how they work together',
              k.evaluate_level = 'Judge whether a flavor combination is successful and suggest improvements',
              k.create_level = 'Create original flavor combinations and new dishes';

MERGE (k:Knowledge {name: 'Ingredient Substitution'})
ON CREATE SET k.description = 'Understanding how to replace ingredients due to availability, allergies, or preferences while maintaining dish integrity',
              k.how_to_learn = 'Study ingredient properties and functions. Experiment with substitutions in familiar recipes. Read substitution guides. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall common ingredient substitutions and acceptable replacements',
              k.understand_level = 'Explain how different ingredients function in recipes and what makes good substitutes',
              k.apply_level = 'Successfully substitute ingredients while maintaining acceptable results',
              k.analyze_level = 'Determine what ingredient properties are essential versus flexible',
              k.evaluate_level = 'Judge whether a substitution will work for a specific recipe',
              k.create_level = 'Develop creative substitutions for specialized recipes';

MERGE (k:Knowledge {name: 'Sauce Making'})
ON CREATE SET k.description = 'Techniques for creating sauces: emulsions, reductions, slurries, and understanding sauce components and consistency',
              k.how_to_learn = 'Practice making basic sauces (hollandaise, béchamel, vinaigrettes). Study sauce structure and chemistry. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall recipes for basic classical sauces',
              k.understand_level = 'Explain how sauces are structured and what makes them stable or unstable',
              k.apply_level = 'Successfully prepare and finish sauces at proper consistency',
              k.analyze_level = 'Troubleshoot broken or improperly thickened sauces',
              k.evaluate_level = 'Judge sauce quality and consistency for specific dishes',
              k.create_level = 'Develop original sauces that complement different dishes';

MERGE (k:Knowledge {name: 'Timing and Meal Coordination'})
ON CREATE SET k.description = 'Planning and executing multiple components simultaneously to have everything ready at the right time',
              k.how_to_learn = 'Prepare multi-component meals. Plan preparation timelines. Cook under time pressure. Expected time: 4-6 weeks of practice.',
              k.remember_level = 'Recall typical cooking times for common components',
              k.understand_level = 'Explain how to plan a meal timeline so components finish together',
              k.apply_level = 'Successfully coordinate multiple dishes so everything is ready at once',
              k.analyze_level = 'Identify bottlenecks and inefficiencies in meal preparation',
              k.evaluate_level = 'Judge whether a meal plan will work for a given time frame',
              k.create_level = 'Design efficient meal preparation timelines for complex menus';

MERGE (k:Knowledge {name: 'Cooking Chemistry'})
ON CREATE SET k.description = 'Understanding chemical reactions during cooking: maillard reaction, caramelization, emulsification, and protein denaturation',
              k.how_to_learn = 'Study cooking science resources. Experiment with controlled variations. Read books on food science. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall basic chemical reactions that occur during cooking',
              k.understand_level = 'Explain how chemistry affects cooking outcomes and texture development',
              k.apply_level = 'Apply chemistry knowledge to troubleshoot cooking problems',
              k.analyze_level = 'Predict how chemistry will affect a recipe before cooking',
              k.evaluate_level = 'Judge whether chemistry principles have been properly applied',
              k.create_level = 'Design recipes or techniques based on specific chemical reactions';

MERGE (k:Knowledge {name: 'Vegetable Preparation Techniques'})
ON CREATE SET k.description = 'Specialized techniques for preparing different vegetables: blanching, shocking, roasting, caramelizing, and preserving texture',
              k.how_to_learn = 'Practice each vegetable technique. Study how different vegetables respond to heat. Cook vegetables daily. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall appropriate preparation techniques for common vegetables',
              k.understand_level = 'Explain how different techniques affect vegetable texture and flavor',
              k.apply_level = 'Prepare vegetables using appropriate techniques to achieve desired results',
              k.analyze_level = 'Determine the best technique for specific vegetables and dishes',
              k.evaluate_level = 'Judge the quality of prepared vegetables',
              k.create_level = 'Develop innovative vegetable preparation methods';

MERGE (k:Knowledge {name: 'Protein Cooking'})
ON CREATE SET k.description = 'Techniques for cooking different proteins: meats, fish, poultry, and legumes; achieving proper doneness and safety',
              k.how_to_learn = 'Cook various proteins regularly. Study proper internal temperatures. Practice different cooking methods. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall safe internal temperatures for different proteins',
              k.understand_level = 'Explain how different cooking methods affect protein texture and safety',
              k.apply_level = 'Cook proteins to proper doneness consistently',
              k.analyze_level = 'Determine ideal cooking methods for specific proteins',
              k.evaluate_level = 'Judge protein doneness by sight, touch, and temperature',
              k.create_level = 'Develop cooking techniques for specialty proteins';

MERGE (k:Knowledge {name: 'Knife Skills'})
ON CREATE SET k.description = 'Advanced cutting techniques: julienne, brunoise, chiffonade, and specialized cuts; speed and precision development',
              k.how_to_learn = 'Practice fundamental cuts daily. Watch skilled knife work demonstrations. Work with professional guidance. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall the dimensions and techniques for various specialized cuts',
              k.understand_level = 'Explain why specific cuts are chosen for different ingredients and dishes',
              k.apply_level = 'Execute specialized cuts with consistent size and quality',
              k.analyze_level = 'Determine which cuts are appropriate for different cooking purposes',
              k.evaluate_level = 'Judge the quality and consistency of cuts',
              k.create_level = 'Develop efficient cutting techniques for specialized ingredients';

// ADVANCED KNOWLEDGE - Advanced Level

MERGE (k:Knowledge {name: 'Culinary Techniques Across Cuisines'})
ON CREATE SET k.description = 'Understanding distinct cooking techniques and methods from different world cuisines: French, Asian, Mediterranean, and others',
              k.how_to_learn = 'Study cuisine-specific techniques. Cook dishes from different cultures. Take specialized cooking classes. Read regional cookbooks. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall specific techniques associated with different cuisines',
              k.understand_level = 'Explain the historical and cultural context of different cooking techniques',
              k.apply_level = 'Apply authentic techniques when cooking dishes from different cuisines',
              k.analyze_level = 'Compare cooking techniques across cuisines and identify similarities',
              k.evaluate_level = 'Judge whether techniques are authentically applied',
              k.create_level = 'Develop fusion techniques that authentically blend different cuisines';

MERGE (k:Knowledge {name: 'Recipe Development'})
ON CREATE SET k.description = 'Creating original recipes: testing, adjusting proportions, and developing consistent, reproducible dishes',
              k.how_to_learn = 'Develop multiple original recipes. Test and refine them through repetition. Study how professional recipes are constructed. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall recipe development principles and testing methods',
              k.understand_level = 'Explain how ingredient ratios affect outcomes and why testing is necessary',
              k.apply_level = 'Develop working recipes that produce consistent results',
              k.analyze_level = 'Analyze existing recipes to understand their structure and success factors',
              k.evaluate_level = 'Judge whether a recipe is well-developed and reproducible',
              k.create_level = 'Create complex recipes with specific flavor profiles and techniques';

MERGE (k:Knowledge {name: 'Advanced Sauce Techniques'})
ON CREATE SET k.description = 'Complex sauce making: mother sauces, classical reductions, emulsions, foams, and advanced thickening methods',
              k.how_to_learn = 'Study classical French sauces. Practice complex emulsions. Work with modernist techniques. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall the five mother sauces and their derivatives',
              k.understand_level = 'Explain the chemical basis for different sauce structures and techniques',
              k.apply_level = 'Successfully prepare complex sauces and troubleshoot problems',
              k.analyze_level = 'Analyze sauce failures and determine underlying causes',
              k.evaluate_level = 'Judge the quality and innovation of sauce creations',
              k.create_level = 'Develop original sauce techniques and flavor combinations';

MERGE (k:Knowledge {name: 'Food Presentation and Plating'})
ON CREATE SET k.description = 'Techniques for plating and presenting food: color balance, height, spacing, and creating visually appealing dishes',
              k.how_to_learn = 'Study plating in fine dining establishments. Practice plating techniques. Take specialized plating classes. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall basic plating principles and color theory',
              k.understand_level = 'Explain how presentation affects food perception and dining experience',
              k.apply_level = 'Plate dishes with attention to visual balance and appeal',
              k.analyze_level = 'Evaluate plating choices and their impact on the overall dish',
              k.evaluate_level = 'Judge the quality of food presentation',
              k.create_level = 'Develop original plating concepts for different dishes';

MERGE (k:Knowledge {name: 'Menu Planning'})
ON CREATE SET k.description = 'Designing balanced menus: considering nutrition, flavor variety, cooking methods, ingredient seasonality, and guest preferences',
              k.how_to_learn = 'Study professional menus. Plan multi-course menus and execute them. Balance different flavor profiles. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall menu planning principles and course sequencing',
              k.understand_level = 'Explain how to balance nutrition, flavor, and cooking methods across a menu',
              k.apply_level = 'Create well-balanced menus for various occasions',
              k.analyze_level = 'Evaluate menu balance across multiple dimensions',
              k.evaluate_level = 'Judge whether a menu works well for specific occasions',
              k.create_level = 'Design innovative menus with unique themes and concepts';

MERGE (k:Knowledge {name: 'Advanced Seasoning and Flavor Balancing'})
ON CREATE SET k.description = 'Creating complex flavor profiles through layered seasoning, acid balance, richness management, and umami development',
              k.how_to_learn = 'Taste extensively to develop palate. Study flavor chemistry and composition. Experiment with layered seasoning. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall elements of flavor balance: salt, acid, fat, spice, and umami',
              k.understand_level = 'Explain how different flavor elements interact and balance each other',
              k.apply_level = 'Build complex, well-balanced flavors in dishes',
              k.analyze_level = 'Taste dishes and identify flavor components and imbalances',
              k.evaluate_level = 'Judge flavor balance and suggest improvements',
              k.create_level = 'Create sophisticated flavor combinations and profiles';

MERGE (k:Knowledge {name: 'Cooking for Dietary Restrictions'})
ON CREATE SET k.description = 'Understanding and cooking for various dietary needs: allergies, intolerances, vegetarian, vegan, gluten-free, and other restrictions',
              k.how_to_learn = 'Learn about different dietary restrictions and their requirements. Develop recipes for restricted diets. Work with people with these restrictions. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall common dietary restrictions and their requirements',
              k.understand_level = 'Explain the nutritional and medical basis for different dietary restrictions',
              k.apply_level = 'Prepare delicious dishes for various dietary restrictions',
              k.analyze_level = 'Evaluate whether recipes meet specific dietary requirements',
              k.evaluate_level = 'Judge the nutritional adequacy of restricted diet options',
              k.create_level = 'Develop creative recipes for multiple dietary restrictions';

// SPECIALIZED KNOWLEDGE - Master Level

MERGE (k:Knowledge {name: 'Culinary Innovation and Modernism'})
ON CREATE SET k.description = 'Contemporary cooking methods: molecular gastronomy, modernist techniques, and pushing traditional culinary boundaries',
              k.how_to_learn = 'Read modernist cooking books and scientific articles. Experiment with new techniques. Take advanced classes. Expected time: 12-16 weeks.',
              k.remember_level = 'Recall modernist techniques and their applications',
              k.understand_level = 'Explain the scientific principles behind modernist cooking methods',
              k.apply_level = 'Incorporate modernist techniques into original dishes',
              k.analyze_level = 'Evaluate how modernist techniques enhance or detract from dishes',
              k.evaluate_level = 'Judge the appropriateness and success of modernist approaches',
              k.create_level = 'Develop innovative dishes using advanced techniques';

MERGE (k:Knowledge {name: 'Culinary History and Evolution'})
ON CREATE SET k.description = 'Historical development of cooking and cuisines, cultural influences, ingredient discoveries, and how culinary traditions evolved',
              k.how_to_learn = 'Read culinary history books. Study regional food history. Trace ingredient origins and evolution. Expected time: 10-16 weeks.',
              k.remember_level = 'Recall major historical periods and culinary developments',
              k.understand_level = 'Explain how historical events and cultural exchanges shaped cuisines',
              k.apply_level = 'Apply historical knowledge to understand and recreate traditional dishes',
              k.analyze_level = 'Trace the evolution of dishes and techniques over time',
              k.evaluate_level = 'Judge the authenticity and historical accuracy of dishes',
              k.create_level = 'Create original dishes informed by culinary history';

MERGE (k:Knowledge {name: 'Professional Kitchen Management'})
ON CREATE SET k.description = 'Managing kitchen operations: food costs, staff coordination, inventory management, kitchen organization, and workflow efficiency',
              k.how_to_learn = 'Work in professional kitchens in various roles. Study food service management. Take kitchen management courses. Expected time: 12-20 weeks.',
              k.remember_level = 'Recall food cost percentages, inventory practices, and kitchen organization principles',
              k.understand_level = 'Explain how kitchen operations support consistent food quality',
              k.apply_level = 'Manage kitchen operations efficiently',
              k.analyze_level = 'Identify inefficiencies and develop operational improvements',
              k.evaluate_level = 'Judge the effectiveness of kitchen management systems',
              k.create_level = 'Design optimized kitchen management systems';

MERGE (k:Knowledge {name: 'Teaching and Culinary Mentoring'})
ON CREATE SET k.description = 'Methods for teaching cooking: explaining techniques clearly, designing learning progressions, and developing other cooks\' skills',
              k.how_to_learn = 'Mentor others in cooking. Take teaching or coaching courses. Study instructional design. Expected time: 10-16 weeks.',
              k.remember_level = 'Recall effective teaching methods and learning progression principles',
              k.understand_level = 'Explain how different people learn cooking skills and what motivates development',
              k.apply_level = 'Effectively teach others cooking techniques and culinary knowledge',
              k.analyze_level = 'Identify learning needs and appropriate teaching methods',
              k.evaluate_level = 'Judge the effectiveness of culinary instruction',
              k.create_level = 'Design comprehensive culinary training programs';

MERGE (k:Knowledge {name: 'Ingredient Sourcing and Selection'})
ON CREATE SET k.description = 'Deep knowledge of ingredient quality, seasonality, sourcing practices, supplier relationships, and ingredient evaluation expertise',
              k.how_to_learn = 'Visit farmers markets and suppliers regularly. Build supplier relationships. Study ingredient quality indicators. Expected time: 12-20 weeks.',
              k.remember_level = 'Recall seasonal availability of ingredients and quality indicators',
              k.understand_level = 'Explain what makes quality ingredients and how to evaluate them',
              k.apply_level = 'Select premium ingredients and develop supplier relationships',
              k.analyze_level = 'Evaluate ingredient quality and determine suitability for different uses',
              k.evaluate_level = 'Judge ingredient quality and make sourcing decisions',
              k.create_level = 'Develop unique sourcing strategies and ingredient programs';

MERGE (k:Knowledge {name: 'Advanced Nutrition and Food Science'})
ON CREATE SET k.description = 'Deep understanding of nutrition science, nutrient retention in cooking, and how cooking methods affect nutritional value',
              k.how_to_learn = 'Study nutrition science. Research nutrient loss in cooking. Work with nutritionists. Expected time: 10-16 weeks.',
              k.remember_level = 'Recall how cooking affects nutrient availability and retention',
              k.understand_level = 'Explain the nutritional impacts of different cooking methods',
              k.apply_level = 'Prepare nutritionally optimized meals',
              k.analyze_level = 'Evaluate the nutritional impact of cooking techniques',
              k.evaluate_level = 'Judge the nutritional adequacy of menus and dishes',
              k.create_level = 'Design innovative nutritionally-optimized cooking approaches';

// CROSS-DOMAIN GENERALIZATIONS

// General knowledge nodes that cooking shares with other domains
MERGE (k_general:Knowledge {name: 'Safety and Sanitation'})
ON CREATE SET k_general.description = 'General principles of maintaining safe and sanitary conditions in specialized environments where health risks exist',
              k_general.how_to_learn = 'Study safety standards and regulations. Learn risk identification and prevention. Practice safety procedures.',
              k_general.remember_level = 'Recall key safety protocols and regulations',
              k_general.understand_level = 'Explain why safety procedures matter and how to prevent accidents',
              k_general.apply_level = 'Apply safety practices consistently in specialized environments',
              k_general.analyze_level = 'Identify safety risks and develop prevention strategies',
              k_general.evaluate_level = 'Judge the safety of procedures and recommend improvements',
              k_general.create_level = 'Design comprehensive safety programs';

MATCH (k_specific:Knowledge {name: 'Food Safety and Sanitation'})
MATCH (k_general:Knowledge {name: 'Safety and Sanitation'})
CREATE (k_specific)-[:GENERALIZES_TO]->(k_general);

MERGE (k_general:Knowledge {name: 'Heat Management'})
ON CREATE SET k_general.description = 'General principles of controlling heat and temperature to achieve desired material or process outcomes',
              k_general.how_to_learn = 'Study thermal dynamics. Practice temperature control in various contexts. Monitor and measure temperatures.',
              k_general.remember_level = 'Recall standard temperature ranges and their effects',
              k_general.understand_level = 'Explain how heat affects different materials or processes',
              k_general.apply_level = 'Manage heat appropriately to achieve desired results',
              k_general.analyze_level = 'Determine optimal temperature ranges for different goals',
              k_general.evaluate_level = 'Judge temperature management effectiveness',
              k_general.create_level = 'Develop innovative heat management approaches';

MATCH (k_specific:Knowledge {name: 'Heat Control and Temperature'})
MATCH (k_general:Knowledge {name: 'Heat Management'})
CREATE (k_specific)-[:GENERALIZES_TO]->(k_general);

MERGE (k_general:Knowledge {name: 'Time Management'})
ON CREATE SET k_general.description = 'General principles of planning and executing multiple tasks or components simultaneously to meet deadlines',
              k_general.how_to_learn = 'Study project planning methods. Practice coordinating multiple activities. Develop scheduling skills.',
              k_general.remember_level = 'Recall time management principles and scheduling techniques',
              k_general.understand_level = 'Explain how to identify critical path and bottlenecks in complex tasks',
              k_general.apply_level = 'Successfully coordinate multiple components to meet deadlines',
              k_general.analyze_level = 'Identify inefficiencies and optimize task sequences',
              k_general.evaluate_level = 'Judge the effectiveness of time management approaches',
              k_general.create_level = 'Design efficient coordination systems';

MATCH (k_specific:Knowledge {name: 'Timing and Meal Coordination'})
MATCH (k_general:Knowledge {name: 'Time Management'})
CREATE (k_specific)-[:GENERALIZES_TO]->(k_general);

MERGE (k_general:Knowledge {name: 'Chemistry Fundamentals'})
ON CREATE SET k_general.description = 'General principles of chemical reactions and how they affect material properties and outcomes',
              k_general.how_to_learn = 'Study chemistry textbooks. Observe chemical reactions. Learn reaction mechanisms.',
              k_general.remember_level = 'Recall common chemical reactions and their products',
              k_general.understand_level = 'Explain how chemical reactions change material properties',
              k_general.apply_level = 'Apply chemistry knowledge to predict and control material outcomes',
              k_general.analyze_level = 'Determine what chemistry drives specific outcomes',
              k_general.evaluate_level = 'Judge whether chemistry is properly applied',
              k_general.create_level = 'Design processes based on chemistry principles';

MATCH (k_specific:Knowledge {name: 'Cooking Chemistry'})
MATCH (k_general:Knowledge {name: 'Chemistry Fundamentals'})
CREATE (k_specific)-[:GENERALIZES_TO]->(k_general);

MERGE (k_general:Knowledge {name: 'Instruction and Teaching'})
ON CREATE SET k_general.description = 'General principles of teaching others complex skills: explaining techniques, designing learning progressions, and assessing competency',
              k_general.how_to_learn = 'Study instructional design and pedagogy. Mentor and teach others. Take teaching courses.',
              k_general.remember_level = 'Recall instructional design principles',
              k_general.understand_level = 'Explain how people learn and what motivates skill development',
              k_general.apply_level = 'Effectively teach others complex skills',
              k_general.analyze_level = 'Identify learning needs and design appropriate instruction',
              k_general.evaluate_level = 'Judge teaching effectiveness and learning outcomes',
              k_general.create_level = 'Design comprehensive training programs';

MATCH (k_specific:Knowledge {name: 'Teaching and Culinary Mentoring'})
MATCH (k_general:Knowledge {name: 'Instruction and Teaching'})
CREATE (k_specific)-[:GENERALIZES_TO]->(k_general);

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// FOUNDATIONAL SKILLS - Novice Level

MERGE (s:Skill {name: 'Knife Handling'})
ON CREATE SET s.description = 'The ability to safely hold and control a knife, including proper grip, stance, and cutting fundamentals to prevent injury and ensure efficient food preparation',
              s.how_to_develop = 'Take a hands-on knife skills class at a cooking school or culinary gym. Practice basic grip and cutting motions with supervision. Start with soft ingredients (tomatoes, bread) before harder items. Practice daily for 15-20 minutes. Expected time: 2-4 weeks of regular practice.',
              s.novice_level = 'Follows rigid knife grip rules with conscious effort. Feels awkward and uncertain. Cuts are uneven and slow. Requires full focus on technique. Progress by: Practicing basic grip and cutting strokes daily until movements feel more natural.',
              s.advanced_beginner_level = 'Maintains proper grip for extended periods. Beginning to recognize patterns in cutting motions. Can make consistent cuts on familiar ingredients. Some unconscious hand positioning. Progress by: Practicing more diverse ingredients and increasing cutting speed.',
              s.competent_level = 'Executes proper knife grip and cutting techniques automatically on most ingredients. Cuts are consistent and reasonably quick. Can adapt grip for different knife types and cutting tasks. Progress by: Developing greater speed and precision with specialized cuts.',
              s.proficient_level = 'Knife handling is fluid and second nature. Adapts grip intuitively to different ingredients and tasks. Maintains precision even when working quickly. Recognizes and corrects poor technique in others. Progress by: Working toward expert-level speed and teaching others.',
              s.expert_level = 'Knife handling is intuitive and seamless. Works with remarkable speed and precision. Adapts instantly to any ingredient or situation. Can teach and coach others in proper technique. Maintains safety automatically even under pressure.';

MERGE (s:Skill {name: 'Heat Recognition'})
ON CREATE SET s.description = 'The ability to recognize and understand different heat levels, identifying when a stovetop or oven is at the right temperature for cooking tasks without constant thermometer use',
              s.how_to_develop = 'Observe and feel heat levels at different stovetop settings. Use a thermometer initially to correlate physical sensation with actual temperatures. Cook with different heat settings repeatedly. Expected time: 3-4 weeks of consistent cooking.',
              s.novice_level = 'Relies heavily on recipes for temperature guidance and thermometers. Uncertain about heat levels. Often cooks at wrong temperatures. Requires constant checking and adjustment. Progress by: Learning to observe visual cues like steam, sizzling patterns, and oil shimmering.',
              s.advanced_beginner_level = 'Beginning to recognize visual and auditory cues for different heat levels. Can identify basic distinctions (low vs high heat). Still relies on thermometer for precise temperatures. Makes occasional errors. Progress by: Practicing with more ingredients and developing intuition for temperature ranges.',
              s.competent_level = 'Confidently judges stovetop and oven temperatures by feel and observation. Rarely needs a thermometer for common cooking tasks. Can adjust heat appropriately during cooking. Works well with familiar appliances. Progress by: Building intuition across different kitchen equipment and conditions.',
              s.proficient_level = 'Accurately judges temperatures across different cooktops and ovens. Makes tiny adjustments to maintain precise heat. Understands how heat transfer varies by cookware. Can coach others on heat management. Progress by: Refining sensitivity to subtle temperature variations.',
              s.expert_level = 'Judges heat levels instantly and accurately across any appliance or situation. Maintains optimal temperatures for specific cooking techniques intuitively. Teaches heat management with clarity and precision. Never over or undercooks due to temperature misjudgment.';

MERGE (s:Skill {name: 'Recipe Following'})
ON CREATE SET s.description = 'The ability to read, interpret, and follow written recipes accurately, understanding ingredient measurements, cooking times, and sequential steps to produce consistent results',
              s.how_to_develop = 'Select 5-10 well-written recipes from reputable sources. Follow them exactly as written multiple times. Discuss recipe instructions with experienced cooks. Keep notes on your process. Expected time: 2-3 weeks.',
              s.novice_level = 'Reads recipes carefully but sometimes misinterprets abbreviations or measurements. Follows steps sequentially but may miss timing details. Produces varying results from the same recipe. Requires recipes for almost every meal. Progress by: Building familiarity with common ingredients and repeating favorite recipes.',
              s.advanced_beginner_level = 'Understands recipe structure and follows most recipes accurately. Recognizes common abbreviations and measurements. Can adjust for minor variations. Beginning to understand why steps matter. Progress by: Trying more complex recipes and comparing multiple recipes for the same dish.',
              s.competent_level = 'Follows recipes reliably and produces consistent results. Understands how to scale recipes and adapt measurements. Can catch mistakes in recipe instructions. Occasionally improvises minor changes. Progress by: Attempting recipes with unfamiliar ingredients or techniques.',
              s.proficient_level = 'Reads recipes quickly and intuitively grasps the overall approach. Understands the logic behind steps and timing. Can fluently adapt recipes for different dietary needs or ingredient availability. Rarely fails to execute a recipe. Progress by: Moving toward recipe development and original creation.',
              s.expert_level = 'Reads recipes and immediately understands their structure, technique, and potential outcomes. Can predict how recipes will perform before cooking. Understands recipe development and scientific basis for techniques. Rarely references recipes for familiar dishes.';

MERGE (s:Skill {name: 'Food Safety Practices'})
ON CREATE SET s.description = 'The ability to apply food safety principles consistently: proper storage, temperature control, cross-contamination prevention, and cleanliness to prevent foodborne illness',
              s.how_to_develop = 'Take a food safety certification course (ServSafe or equivalent). Review official food safety guidelines. Work alongside experienced cooks who model safety practices. Expect: 1-2 weeks of focused learning plus ongoing application.',
              s.novice_level = 'Follows food safety rules by conscious effort and memory. Needs reminders about storage times and temperatures. Can forget steps when busy or distracted. Requires checklists to ensure safety. Progress by: Building safety habits through repetition until procedures become automatic.',
              s.advanced_beginner_level = 'Remembers most food safety practices. Applies them more automatically. Occasionally forgets temperatures or storage times under pressure. Beginning to understand the reasoning behind safety rules. Progress by: Deepening knowledge of why each safety practice matters.',
              s.competent_level = 'Follows food safety practices consistently as automatic habits. Remembers safe temperatures, storage times, and cross-contamination prevention. Can identify food safety risks. Works safely even when rushed. Progress by: Teaching food safety to others and refining judgment about borderline cases.',
              s.proficient_level = 'Food safety is second nature and integrated into all cooking routines. Catches safety issues proactively. Understands scientific basis for safety practices. Can teach others clearly. Recognizes when to be conservative vs flexible with guidelines. Progress by: Developing mastery and teaching expertise.',
              s.expert_level = 'Food safety practices are intuitive and comprehensive across all situations. Can identify subtle risks others miss. Understands context for when rules are flexible vs mandatory. Teaches food safety with authority and clarity. Never creates food safety risks.';

MERGE (s:Skill {name: 'Ingredient Prep Organization'})
ON CREATE SET s.description = 'The ability to prepare and organize ingredients before cooking (mise en place), including cutting, measuring, and arranging items in logical order for efficient execution',
              s.how_to_develop = 'Practice setting up mise en place for simple 3-5 ingredient recipes. Time yourself. Watch cooking shows that emphasize mise en place. Cook dishes that require multiple components. Expected time: 2-3 weeks.',
              s.novice_level = 'Prepares ingredients haphazardly while cooking. Forgets to prepare some ingredients. Often mid-recipe realizes something still needs cutting. Feels rushed and disorganized. Progress by: Setting up complete mise en place before starting to cook.',
              s.advanced_beginner_level = 'Prepares most ingredients before cooking starts. May forget some or prepare them partially. Somewhat disorganized setup. Can execute simple recipes without major delays. Progress by: Practicing mise en place for more complex recipes.',
              s.competent_level = 'Prepares all ingredients completely before cooking. Arranges them logically by recipe order. Measures everything accurately. Setup is organized and efficient for familiar recipes. Progress by: Refining speed and handling more complex ingredient lists.',
              s.proficient_level = 'Sets up efficient mise en place quickly for most recipes. Anticipates what will be needed. Adjusts arrangement based on cooking flow. Can prep ingredients while doing light prep work. Progress by: Developing expert-level speed and efficiency.',
              s.expert_level = 'Mise en place is set up with remarkable speed and organization. Anticipates needs before recognizing them consciously. Arrangement enables seamless cooking flow. Can prep ingredients while maintaining conversation or teaching. Organization becomes invisible excellence.';

MERGE (s:Skill {name: 'Basic Sautéing'})
ON CREATE SET s.description = 'The ability to cook foods in a hot pan with oil or fat, developing color and flavor through direct heat while controlling temperature and timing to achieve proper doneness',
              s.how_to_develop = 'Practice sautéing simple vegetables (onions, peppers, mushrooms) and proteins (chicken, shrimp) in a home kitchen. Use proper technique with medium-high heat. Practice daily with different ingredients. Expected time: 3-4 weeks.',
              s.novice_level = 'Follows sautéing steps mechanically. Frequently burns food or undercooks it. Struggles to get proper browning (fond) development. Often overcrowds the pan. Food texture is inconsistent. Progress by: Learning to observe browning cues and managing heat better.',
              s.advanced_beginner_level = 'Can sauté simple vegetables and tender proteins with decent results. Beginning to achieve some browning. Recognizes when food is overcrowded. Occasional burning or undercooking. Progress by: Practicing temperature control and timing with diverse ingredients.',
              s.competent_level = 'Consistently sautés vegetables and most proteins well. Achieves good browning while maintaining proper doneness. Can judge when food is ready. Handles moderate heat and timing well. Progress by: Developing intuition for when to flip, stir, or remove from heat.',
              s.proficient_level = 'Sautéing is fluid and second nature. Achieves perfect browning and doneness intuitively. Understands how different ingredients behave at different temperatures. Makes fine adjustments automatically. Can sauté while managing other dishes. Progress by: Mastering advanced sautéing for delicate ingredients.',
              s.expert_level = 'Sautéing is intuitive and nearly perfect. Achieves ideal browning, texture, and flavor development consistently. Handles any ingredient and temperature combination with ease. Can teach sautéing technique with precision. Never produces burned or undercooked sautéed food.';

MERGE (s:Skill {name: 'Basic Seasoning'})
ON CREATE SET s.description = 'The ability to season food with salt, pepper, and common herbs to enhance natural flavors, developing an intuitive sense of appropriate seasoning levels and combinations',
              s.how_to_develop = 'Cook simple dishes and taste frequently, adjusting seasoning as you go. Study basic herb flavors and combinations. Practice tasting dishes and identifying what\'s needed. Cook 3-4 times weekly for 3-4 weeks.',
              s.novice_level = 'Adds salt and pepper mechanically following recipes. Unsure how much is appropriate. Food tastes flat or over-salted. Unable to identify what seasoning is missing. Progress by: Tasting more, adjusting gradually, and learning basic herb flavors.',
              s.advanced_beginner_level = 'Can add basic salt and pepper adequately for simple dishes. Beginning to taste and adjust seasoning. Can identify some missing flavors. Sometimes over-salts when adding near end of cooking. Progress by: Developing better tasting habits and learning more herbs.',
              s.competent_level = 'Seasons food appropriately and consistently well. Tastes regularly during cooking and adjusts seasoning correctly. Understands basic herb flavor profiles and applications. Rarely produces bland or over-salted food. Progress by: Learning more complex herb combinations and building palate sensitivity.',
              s.proficient_level = 'Seasoning is confident and intuitive. Adjusts seasoning with precision. Understands how to layer flavors. Recognizes subtle differences in seasoning levels. Can teach proper seasoning to others. Progress by: Developing deeper palate sensitivity and mastery.',
              s.expert_level = 'Seasoning is intuitive and sophisticated. Achieves perfect balance with minimal tasting. Can identify precisely what flavors are missing. Understands how seasoning interacts with other cooking elements. Creates beautifully seasoned dishes consistently.';

// INTERMEDIATE SKILLS - Developing/Competent Levels

MERGE (s:Skill {name: 'Vegetable Preparation'})
ON CREATE SET s.description = 'The ability to prepare vegetables for cooking through appropriate cutting, blanching, roasting, or other techniques while preserving texture, flavor, and nutritional value',
              s.how_to_develop = 'Cook seasonal vegetables using different preparation methods. Study how different vegetables respond to heat and technique. Practice various cutting styles. Cook 4-5 vegetable-forward meals weekly. Expected time: 4-6 weeks.',
              s.novice_level = 'Cuts vegetables haphazardly with inconsistent sizes. Often over or undercooks vegetables. Loses texture and flavor. Uncertain which technique suits each vegetable. Progress by: Learning how different vegetables respond to different methods.',
              s.advanced_beginner_level = 'Prepares vegetables with reasonable consistency and technique. Beginning to understand cooking time variations. Some vegetables turn out well, others poorly. Can follow recipes for vegetable cooking. Progress by: Practicing diverse vegetables and techniques.',
              s.competent_level = 'Prepares vegetables with skill and knowledge. Chooses appropriate cooking methods and achieves good results. Balances cooking to preserve both flavor and texture. Can adapt technique for desired texture (tender vs firm). Progress by: Building intuition for vegetable timing and flavor development.',
              s.proficient_level = 'Vegetable preparation is confident and adaptive. Intuitively chooses the best technique for each vegetable and situation. Achieves ideal texture and flavor development. Understands how to highlight vegetable characteristics. Progress by: Mastering advanced techniques and developing signature preparations.',
              s.expert_level = 'Vegetable preparation is sophisticated and intuitive. Creates dishes that highlight vegetable qualities beautifully. Understands vegetable chemistry deeply. Can teach vegetable techniques with authority. Produces remarkably flavorful, well-textured vegetable dishes consistently.';

MERGE (s:Skill {name: 'Protein Cooking'})
ON CREATE SET s.description = 'The ability to cook various proteins (meat, fish, poultry, legumes) to proper doneness while developing flavor and maintaining texture, understanding doneness indicators for different proteins',
              s.how_to_develop = 'Cook different proteins weekly: beef, chicken, fish, pork, lamb, and legumes. Learn proper internal temperatures. Use temperature guides and finger tests. Practice different cooking methods. Expected time: 6-8 weeks.',
              s.novice_level = 'Often over or undercooks proteins. Uses thermometer but misinterprets readings. Struggles with tender vs tough textures. Food can be dry or unsafe. Needs constant recipe reference for cooking times. Progress by: Learning proper doneness indicators through practice and feedback.',
              s.advanced_beginner_level = 'Cooks proteins to acceptable doneness most of the time. Uses thermometers correctly but still depends on them. Beginning to recognize doneness by touch and appearance. Progress by: Practicing finger test and visual cues.',
              s.competent_level = 'Cooks proteins reliably to proper doneness. Uses thermometer as backup rather than primary tool. Understands variations between protein types and how to judge each. Produces good texture most consistently. Progress by: Building intuition for subtle doneness judgments.',
              s.proficient_level = 'Protein cooking is confident and reliable. Judges doneness by touch and appearance with high accuracy. Understands how resting affects final texture. Adapts technique intuitively for different proteins. Progress by: Refining technique for delicate proteins and developing signature preparations.',
              s.expert_level = 'Protein cooking is intuitive and nearly perfect. Achieves ideal doneness, flavor, and texture consistently across all protein types. Judges doneness instantly and accurately. Can teach protein cookery with expertise. Rarely produces improperly cooked proteins.';

MERGE (s:Skill {name: 'Flavor Building'})
ON CREATE SET s.description = 'The ability to develop complex, well-balanced flavors by layering ingredients, balancing salt/acid/fat, understanding how components interact, and creating depth in dishes',
              s.how_to_develop = 'Cook dishes with multiple flavor components. Study classic flavor combinations. Taste extensively and take notes on what works. Read about flavor chemistry and composition. Expected time: 6-8 weeks of active practice.',
              s.novice_level = 'Food tastes one-dimensional or flat. Relies on single flavor source (salt, spice, or herb). Unable to recognize when flavors work together or clash. Progress by: Studying basic flavor combinations and tasting more deliberately.',
              s.advanced_beginner_level = 'Can create basic flavor combinations that work. Beginning to understand how ingredients interact. Recognizes obvious flavor balancing issues. Still limited in flavor range. Progress by: Experimenting with more flavor combinations and ingredients.',
              s.competent_level = 'Creates well-balanced flavors with multiple components. Understands how salt, acid, fat, and spice interact. Can build flavors systematically. Rarely produces unbalanced-tasting food. Progress by: Learning more subtle flavor interactions and regional cuisines.',
              s.proficient_level = 'Flavor development is intuitive and sophisticated. Layers flavors fluidly to create depth and balance. Understands how to adjust flavors mid-cooking. Recognizes subtle flavor gaps and fixes them. Progress by: Mastering expert-level palate refinement and innovation.',
              s.expert_level = 'Flavor building is intuitive and masterful. Creates complex, well-balanced flavors consistently. Understands how all elements contribute to flavor perception. Can articulate flavor profiles and why they work. Dishes have remarkable flavor depth and coherence.';

MERGE (s:Skill {name: 'Timing and Coordination'})
ON CREATE SET s.description = 'The ability to plan and execute multiple cooking components simultaneously so that everything finishes at approximately the same time, creating well-coordinated meals',
              s.how_to_develop = 'Cook multi-component meals (3+ components) weekly. Plan timelines in advance. Cook under time pressure. Study menu planning and timing strategies. Expected time: 4-6 weeks.',
              s.novice_level = 'Struggles to coordinate multiple components. Often something is cold or overcooked while others finish. Disorganized approach to timing. Feels rushed and stressed. Progress by: Planning timelines in advance before cooking.',
              s.advanced_beginner_level = 'Can coordinate 2-3 components with some success. Beginning to plan backwards from finish time. Often something is slightly off-timing but edible. Progress by: Practicing more complex multi-component meals.',
              s.competent_level = 'Coordinates multiple components so most things finish together. Plans backwards from desired finish time effectively. Makes good adjustments during cooking. Most components are at ideal temperature when served. Progress by: Refining timing for more complex menus.',
              s.proficient_level = 'Timing is confident and mostly seamless. Manages complex multi-component meals where most items finish simultaneously. Understands which steps can overlap. Makes intuitive adjustments automatically. Progress by: Achieving expert-level precision and complexity.',
              s.expert_level = 'Timing and coordination is nearly perfect. Executes complex multi-component meals with everything finishing ideally. Makes adjustments so naturally they appear effortless. Can manage timing while teaching or managing others. Rarely has timing problems.';

MERGE (s:Skill {name: 'Sauce Making'})
ON CREATE SET s.description = 'The ability to create sauces with proper consistency and flavor, using techniques like reductions, emulsions, and slurries, and troubleshooting sauce problems',
              s.how_to_develop = 'Practice making basic sauces (pan sauces, béchamel, vinaigrettes). Study sauce structure and chemical basis. Make sauces 2-3 times weekly for 4-6 weeks. Expected time: 4-6 weeks.',
              s.novice_level = 'Sauces are often too thin, too thick, or broken. Struggles with consistency management. Follows recipes rigidly. Limited sauce repertoire. Often over-salts sauces. Progress by: Understanding sauce structure and practicing basic techniques.',
              s.advanced_beginner_level = 'Can make basic sauces with occasional success. Beginning to understand thickening methods. Recognizes broken emulsions and attempts fixes. Makes 2-3 sauces reliably. Progress by: Practicing diverse sauce types and problem-solving.',
              s.competent_level = 'Makes sauces reliably with good consistency and flavor. Understands different thickening methods and when to use them. Can troubleshoot broken sauces successfully. Makes at least 5-8 sauces well. Progress by: Building expertise in more complex sauce techniques.',
              s.proficient_level = 'Sauce making is confident and skilled. Creates sauces with ideal consistency and balanced flavor. Troubleshoots problems quickly and effectively. Understands sauce chemistry deeply. Can adapt sauces for different applications. Progress by: Developing signature sauces and advanced techniques.',
              s.expert_level = 'Sauce making is intuitive and masterful. Creates sauces with perfect consistency and flavor instantly. Troubleshoots any sauce problem. Understands chemical basis for all techniques. Can create original sauces and teach technique with expertise.';

MERGE (s:Skill {name: 'Taste and Adjustment'})
ON CREATE SET s.description = 'The ability to taste food critically, identify what\'s missing or wrong, and make appropriate adjustments to flavor, seasoning, or other elements during cooking',
              s.how_to_develop = 'Taste frequently while cooking. Keep notes on adjustments. Taste side-by-side samples of slightly different seasons levels. Cook daily and practice critical tasting. Expected time: 4-6 weeks.',
              s.novice_level = 'Tastes rarely or infrequently. Unable to identify what\'s missing. Afraid to adjust seasoning. Food often finishes under or over-seasoned. Progress by: Building confidence in tasting and making small adjustments.',
              s.advanced_beginner_level = 'Tastes occasionally and makes some adjustments. Can identify obvious problems like too much salt or missing seasoning. Adjustments are often too conservative. Progress by: Tasting more frequently and making bolder adjustments.',
              s.competent_level = 'Tastes regularly during cooking and makes appropriate adjustments. Can identify what flavors are missing. Adjustments bring food into better balance. Final seasoning is usually good. Progress by: Refining palate sensitivity for subtle differences.',
              s.proficient_level = 'Tasting and adjustment is confident and intuitive. Identifies subtle flavor gaps and corrects them precisely. Makes multiple small adjustments that come together well. Adjusts with confidence. Progress by: Mastering expert-level palate and teaching others.',
              s.expert_level = 'Tasting is sophisticated and reveals subtle flavor profiles. Adjustments are made with precision and confidence. Can teach tasting technique and flavor analysis to others. Never serves improperly seasoned or flavored food.';

// ADVANCED SKILLS - Advanced Level

MERGE (s:Skill {name: 'Advanced Knife Techniques'})
ON CREATE SET s.description = 'The ability to execute specialized knife cuts precisely and efficiently: julienne, brunoise, chiffonade, and other professional cuts with speed and consistency',
              s.how_to_develop = 'Take advanced knife skills classes. Practice specialized cuts daily with a timer. Work with professional guidance to develop speed. Cook 5+ times weekly using these cuts. Expected time: 8-12 weeks.',
              s.novice_level = 'Attempts specialized cuts but struggles with consistency and precision. Cuts are slow and uneven. Requires great focus. Can\'t maintain consistency across multiple pieces. Progress by: Practicing basic specialized cuts daily for precision.',
              s.advanced_beginner_level = 'Can execute specialized cuts with reasonable consistency. Still somewhat slow. Beginning to understand how cut size affects cooking time. Cuts improve with focus. Progress by: Practicing speed and consistency.',
              s.competent_level = 'Executes specialized cuts with good precision and consistency. Work is reasonably quick though not fast. Can apply correct cuts for different dishes. Cuts are uniform enough for professional use. Progress by: Building speed while maintaining precision.',
              s.proficient_level = 'Specialized cuts are executed with remarkable speed and precision. Work is flowing and almost effortless. Understands how subtle cut variations affect cooking. Can teach techniques to others. Progress by: Developing expert-level mastery and speed.',
              s.expert_level = 'Specialized knife work is intuitive and remarkably fast with flawless precision. Cuts are technically perfect and visually stunning. Can work at professional kitchen speed. Teaching knife techniques with expertise and clarity. Knife work becomes almost invisible in its excellence.';

MERGE (s:Skill {name: 'Multi-Course Execution'})
ON CREATE SET s.description = 'The ability to plan and execute complete multi-course meals, coordinating timing, plating, and presentation for each course while managing kitchen complexity',
              s.how_to_develop = 'Plan and execute 3-4 course meals weekly. Study restaurant kitchen timing and flow. Practice managing complexity and pressure. Expected time: 8-12 weeks.',
              s.novice_level = 'Struggles with multi-course coordination. Courses are disjointed or timing is poor. Gets stressed and disorganized. Can\'t manage kitchen complexity. Progress by: Practicing simpler 2-3 course meals and building organizational skills.',
              s.advanced_beginner_level = 'Can execute 3-course meals with moderate success. Timing is sometimes off. Gets somewhat stressed but manages. Beginning to understand course flow. Progress by: Practicing more complex multi-course meals.',
              s.competent_level = 'Executes multi-course meals well with good timing and coordination. Can manage cooking pressure. Courses flow together reasonably smoothly. Can handle 4-5 course meals. Progress by: Refining execution and managing more complexity.',
              s.proficient_level = 'Multi-course execution is confident and well-coordinated. Complex meals flow smoothly with excellent timing. Can manage 5-6+ courses. Understands restaurant-style flow. Can adapt on the fly. Progress by: Mastering expert-level execution.',
              s.expert_level = 'Multi-course execution is seamless and masterful. Manages complex multi-course meals with apparent ease. Timing is nearly perfect across all courses. Can execute while managing kitchen staff or complex situations. Seems effortless even when execution is complex.';

MERGE (s:Skill {name: 'Improvisation and Adaptation'})
ON CREATE SET s.description = 'The ability to cook creatively when ingredients are missing or unavailable, adapting recipes on the fly while maintaining dish integrity and flavor balance',
              s.how_to_develop = 'Cook frequently without strict recipes. Practice substituting ingredients. Cook with available ingredients rather than shopping for recipes. Study ingredient functionality. Expected time: 6-8 weeks.',
              s.novice_level = 'Cannot cook without recipes. Panics when ingredients are missing. Substitutions often result in poor dishes. Limited understanding of ingredient functions. Progress by: Learning ingredient properties and basic substitutions.',
              s.advanced_beginner_level = 'Can make simple substitutions in familiar recipes. Adapts hesitantly and sometimes unsuccessfully. Improvisation causes stress. Limited range of adaptation. Progress by: Experimenting more boldly with available ingredients.',
              s.competent_level = 'Adapts recipes confidently with reasonable success. Can substitute missing ingredients with acceptable results. Understands ingredient functionality well enough to improvise. Progress by: Building more intuition and confidence.',
              s.proficient_level = 'Improvisation is confident and usually successful. Can cook with whatever ingredients are available and create good dishes. Understands ingredient properties deeply enough for creative adaptation. Progress by: Mastering expert-level improvisation.',
              s.expert_level = 'Improvisation is intuitive and nearly always successful. Works creatively with available ingredients to create excellent dishes. Understands why substitutions work at a deep level. Can improvise on demand and teach adaptation techniques.';

MERGE (s:Skill {name: 'Flavor Chemistry Understanding'})
ON CREATE SET s.description = 'The ability to understand and apply cooking chemistry and food science to predict outcomes, solve problems, and create superior results using techniques like the Maillard reaction and emulsification',
              s.how_to_develop = 'Study food science books and articles. Experiment with controlled variations to understand chemistry. Take chemistry or food science courses. Cook deliberately with chemistry focus. Expected time: 12-16 weeks.',
              s.novice_level = 'Limited understanding of cooking chemistry. Cooks primarily through trial and error. Cannot predict or explain outcomes. Progress by: Reading about basic cooking chemistry and experimenting with observation.',
              s.advanced_beginner_level = 'Beginning to understand basic chemistry concepts. Can identify when Maillard reaction or caramelization occurs. Still mostly recipes and intuition. Progress by: Reading more deeply and experimenting deliberately.',
              s.competent_level = 'Understands core cooking chemistry concepts. Can explain many cooking outcomes using chemistry. Uses chemistry knowledge to troubleshoot problems. Applies principles to improve cooking. Progress by: Deepening chemistry knowledge and applications.',
              s.proficient_level = 'Chemistry knowledge is well-developed and applied intuitively. Can predict and explain most cooking outcomes. Uses chemistry to solve problems and innovate. Progress by: Mastering expert-level application and innovation.',
              s.expert_level = 'Chemistry understanding is sophisticated and intuitive. Explains complex cooking phenomena using science. Uses chemistry principles to create and innovate. Can teach food science and its applications with expertise. Uses chemistry knowledge almost unconsciously in cooking.';

MERGE (s:Skill {name: 'Cuisine-Specific Mastery'})
ON CREATE SET s.description = 'The ability to cook with authentic techniques and flavor profiles from a specific cuisine, understanding traditions, ingredients, and methods that define that culinary tradition',
              s.how_to_develop = 'Choose a cuisine to focus on. Study its history and traditions. Cook dishes from that cuisine 3-4+ times weekly. Work with people from that culinary tradition if possible. Expected time: 12-20 weeks.',
              s.novice_level = 'Understands cuisine at surface level only. Cooks dishes with some awkwardness. Flavor profiles don\'t quite match authentic versions. Progress by: Studying cuisine traditions and practicing core dishes.',
              s.advanced_beginner_level = 'Developing understanding of cuisine traditions and techniques. Can cook some dishes reasonably well. Beginning to understand flavor profiles. Progress by: Practicing more diverse dishes from the cuisine.',
              s.competent_level = 'Cooks cuisine dishes well with reasonable authenticity. Understands techniques and flavor profiles. Can execute many core dishes properly. Some dishes are exceptional, others good. Progress by: Deepening technique knowledge and refining dishes.',
              s.proficient_level = 'Cuisine mastery is evident and well-developed. Cooks many dishes with authentic technique and flavor. Understands traditions and variations. Can teach the cuisine to others. Progress by: Mastering expert-level authenticity and innovation.',
              s.expert_level = 'Cuisine mastery is sophisticated and authentic. Dishes represent cuisine excellently and consistently. Understands deep traditions and variations. Can innovate within tradition. Teaches the cuisine with authority. Dishes are indistinguishable from authentic versions from that culinary tradition.';

MERGE (s:Skill {name: 'Plating and Presentation'})
ON CREATE SET s.description = 'The ability to present food beautifully on a plate using principles of color balance, height, spacing, and visual appeal that enhances the dining experience',
              s.how_to_develop = 'Study fine dining plating. Practice plating regularly with different dishes. Study color theory and composition. Take or watch professional plating courses. Expected time: 6-8 weeks.',
              s.novice_level = 'Plating is haphazard and unattractive. No consideration of color, height, or balance. Food appears appetizing due to quality but presentation is plain. Progress by: Learning basic plating principles and composition.',
              s.advanced_beginner_level = 'Beginning to consider presentation. Attempts color balance and height variation. Plating is somewhat improved but still basic. Shows effort but lacks refinement. Progress by: Studying plating principles and practicing frequently.',
              s.competent_level = 'Plates food with attention to visual balance and appeal. Uses color theory reasonably well. Creates height and interest. Presentation enhances the food. Progress by: Refining technique and building personal plating style.',
              s.proficient_level = 'Plating is confident and attractive. Uses color, height, and composition skillfully. Presentation elevates perception of food. Can adapt plating to different dish types and cuisines. Progress by: Mastering expert-level artistry.',
              s.expert_level = 'Plating is artistic and refined. Creates visually stunning presentations that enhance the dish experience. Understands color psychology and composition deeply. Plates consistently beautiful food. Plating becomes part of the culinary art form.';

// EXPERT SKILLS - Master Level

MERGE (s:Skill {name: 'Recipe Development'})
ON CREATE SET s.description = 'The ability to create original recipes that are well-developed, testable, reproducible, and communicate clearly to others, producing consistently excellent results',
              s.how_to_develop = 'Create 5-10 original recipes. Test each multiple times. Refine based on testing. Write recipes for others to follow. Get feedback on clarity and results. Expected time: 16-24 weeks.',
              s.novice_level = 'Creates dishes that taste good but recipes are unclear or unreproducible. Cannot articulate proportions or techniques clearly. Lacks testing methodology. Progress by: Developing multiple recipes and testing them thoroughly.',
              s.advanced_beginner_level = 'Creates recipes that others can follow with some success. Proportions are approximate rather than precise. Some recipes work consistently, others don\'t. Progress by: Testing recipes multiple times and refining details.',
              s.competent_level = 'Develops recipes that are reproducible and tasty. Can articulate techniques and proportions clearly. Most recipes work well for others. Shows understanding of recipe structure. Progress by: Refining recipes through extensive testing and feedback.',
              s.proficient_level = 'Recipe development is sophisticated and reliable. Creates recipes that are reproducible, well-tested, and tasty. Clear writing and technique descriptions. Can modify recipes for different contexts. Progress by: Mastering expert-level innovation and clarity.',
              s.expert_level = 'Recipe development is masterful and innovative. Creates original, well-tested recipes that cook beautifully for anyone. Writing is exceptionally clear. Understands recipe structure and communication deeply. Recipes can be published and followed by others consistently.';

MERGE (s:Skill {name: 'Culinary Innovation'})
ON CREATE SET s.description = 'The ability to create original dishes and techniques, combining traditional knowledge with creativity to push culinary boundaries and develop unique culinary expressions',
              s.how_to_develop = 'Create many original dishes. Experiment with ingredient combinations, techniques, and presentations. Study culinary innovation and modernism. Take risks and document what works. Expected time: 20-30 weeks.',
              s.novice_level = 'Creates dishes that are interesting but not original. Borrows heavily from existing dishes. Limited innovation or creativity. Progress by: Studying existing dishes and imagining original variations.',
              s.advanced_beginner_level = 'Creates some original dishes with moderate success. Shows creative thinking but lacks refinement. Some innovations work well, others don\'t. Progress by: Experimenting more boldly and refining successful innovations.',
              s.competent_level = 'Creates original dishes with reasonable success. Shows creative thinking applied to culinary principles. Some dishes are genuinely innovative and delicious. Progress by: Building on successful innovations.',
              s.proficient_level = 'Culinary innovation is creative and increasingly sophisticated. Creates original dishes that are delicious and innovative. Understands how to balance innovation with tradition. Progress by: Mastering expert-level innovation.',
              s.expert_level = 'Culinary innovation is masterful and distinctive. Creates original dishes and techniques that represent genuine innovation. Has recognizable culinary voice and approach. Dishes are both delicious and conceptually interesting. Can influence and inspire others through culinary innovation.';

MERGE (s:Skill {name: 'Culinary Leadership'})
ON CREATE SET s.description = 'The ability to lead and manage kitchen operations, mentor other cooks, make strategic culinary decisions, and set culinary direction for a kitchen or restaurant',
              s.how_to_develop = 'Lead kitchen teams. Mentor other cooks deliberately. Make culinary decisions. Manage kitchen operations. Study kitchen leadership. Expected time: 20+ weeks.',
              s.novice_level = 'Struggles with leadership and mentoring. Cannot give clear direction or feedback. Limited ability to lead a kitchen or influence cooks. Progress by: Taking on small leadership roles and developing skills.',
              s.advanced_beginner_level = 'Beginning to lead and mentor with moderate success. Can give some feedback and direction. Struggles with consistency and authority. Progress by: Taking on larger leadership responsibilities.',
              s.competent_level = 'Leads kitchen operations competently. Mentors other cooks with reasonable effectiveness. Makes sound culinary decisions. Kitchen runs reasonably well under their direction. Progress by: Refining leadership and building stronger teams.',
              s.proficient_level = 'Culinary leadership is confident and effective. Leads kitchens smoothly and makes strong culinary decisions. Mentors cooks effectively and develops talent. Kitchen culture is positive and productive. Progress by: Mastering expert-level leadership.',
              s.expert_level = 'Culinary leadership is masterful and inspiring. Leads highly functional kitchens with clear culinary vision. Develops talented cooks and inspires excellence. Makes strategic culinary decisions that are respected. Kitchen culture reflects their leadership and standards.';

MERGE (s:Skill {name: 'Ingredient Sourcing and Selection'})
ON CREATE SET s.description = 'The ability to identify, evaluate, and source high-quality ingredients, understand seasonality and supply chains, and develop relationships with suppliers to ensure ingredient excellence',
              s.how_to_develop = 'Visit farmers markets and suppliers regularly. Build supplier relationships. Study ingredient quality indicators. Learn about seasonality and sourcing. Expected time: 20+ weeks.',
              s.novice_level = 'Limited ingredient knowledge. Accepts available ingredients without evaluation. Cannot identify quality differences. Progress by: Learning to evaluate ingredient quality and exploring different sources.',
              s.advanced_beginner_level = 'Beginning to evaluate ingredient quality. Recognizes some quality differences. Explores limited sources. Still mostly shops conventionally. Progress by: Developing more sources and sourcing knowledge.',
              s.competent_level = 'Evaluates ingredients well and sources from multiple suppliers. Understands seasonality reasonably well. Selects good-quality ingredients consistently. Progress by: Deepening sourcing knowledge and relationships.',
              s.proficient_level = 'Sourcing knowledge is substantial. Works with multiple quality suppliers. Understands seasonality deeply. Makes strategic sourcing decisions. Progress by: Mastering expert-level sourcing.',
              s.expert_level = 'Ingredient sourcing is masterful and strategic. Has deep knowledge of ingredient quality, seasonality, and supply chains. Maintains strong supplier relationships. Sources ingredients that elevate cooking significantly. Can influence food quality through sourcing excellence.';

MERGE (s:Skill {name: 'Culinary Teaching'})
ON CREATE SET s.description = 'The ability to teach cooking effectively: explaining techniques clearly, designing learning progressions, assessing student competency, and developing other cooks\' skills and knowledge',
              s.how_to_develop = 'Teach cooking to others formally or informally. Design lesson plans or curricula. Study teaching and learning methods. Mentor multiple people. Expected time: 20+ weeks.',
              s.novice_level = 'Teaching is unclear or unhelpful. Struggles to explain techniques. Cannot assess student learning. Limited teaching ability. Progress by: Seeking teaching training and mentoring others.',
              s.advanced_beginner_level = 'Beginning to teach effectively with some success. Can explain basic techniques reasonably well. Limited ability to assess or design progressions. Progress by: Teaching more and studying teaching methods.',
              s.competent_level = 'Teaches cooking with reasonable effectiveness. Explains techniques clearly. Can assess basic competency. Designs simple learning progressions. Progress by: Refining teaching and developing more sophisticated approaches.',
              s.proficient_level = 'Teaching is effective and well-structured. Explains techniques clearly and thoroughly. Assesses competency well. Designs good learning progressions. Students learn effectively. Progress by: Mastering expert-level teaching.',
              s.expert_level = 'Culinary teaching is masterful and inspiring. Explains complex techniques with exceptional clarity. Designs excellent learning progressions that develop competency. Assesses and develops student talents. Students credit them with major skill development. Teaching approach influences other teachers.';

// CROSS-DOMAIN SKILL GENERALIZATIONS

// Create general skill nodes for skills that generalize across domains
MERGE (s_general:Skill {name: 'Precision Cutting'})
ON CREATE SET s_general.description = 'The general ability to cut or divide materials into consistent, precisely-sized pieces with speed and accuracy across different contexts and materials',
              s_general.how_to_develop = 'Practice cutting in your domain with a focus on precision and consistency. Use measurement tools initially. Build speed gradually. Expected time: 8-12 weeks.',
              s_general.novice_level = 'Cuts are inconsistent and slow. Requires conscious focus and measurement tools. Progress by: Practicing daily with feedback on consistency.',
              s_general.advanced_beginner_level = 'Cuts are more consistent. Speed is improving. Occasionally needs measurement. Progress by: Practicing speed while maintaining consistency.',
              s_general.competent_level = 'Cuts are consistently precise. Reasonable speed. Works without measurement tools. Progress by: Building speed and handling diverse materials.',
              s_general.proficient_level = 'Cutting is fast and precise. Adapts to different materials intuitively. Maintains quality under pressure. Progress by: Mastering expert-level speed and precision.',
              s_general.expert_level = 'Cutting is intuitive, fast, and flawlessly precise. Maintains quality regardless of material or situation. Can teach cutting technique with expertise.';

MATCH (s_specific:Skill {name: 'Knife Handling'})
MATCH (s_general:Skill {name: 'Precision Cutting'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MATCH (s_specific:Skill {name: 'Advanced Knife Techniques'})
MATCH (s_general:Skill {name: 'Precision Cutting'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MERGE (s_general:Skill {name: 'Temperature Control'})
ON CREATE SET s_general.description = 'The general ability to manage and maintain precise temperatures and heat levels to achieve desired material or process outcomes across different contexts',
              s_general.how_to_develop = 'Learn thermal management principles. Use thermometers and measurement tools. Practice with different heat sources. Build intuitive temperature sense. Expected time: 8-12 weeks.',
              s_general.novice_level = 'Temperature management is uncertain and imprecise. Depends heavily on measurement tools. Frequent errors. Progress by: Building familiarity with temperature ranges and indicators.',
              s_general.advanced_beginner_level = 'Beginning to judge temperatures intuitively. Less dependent on tools. Some errors remain. Progress by: Practicing in varied conditions.',
              s_general.competent_level = 'Temperature management is confident and usually accurate. Works with minimal tools. Adapts well to familiar situations. Progress by: Handling more diverse situations.',
              s_general.proficient_level = 'Temperature management is intuitive and reliable. Makes fine adjustments automatically. Works across different equipment. Progress by: Mastering subtle variations.',
              s_general.expert_level = 'Temperature control is intuitive and nearly perfect. Maintains precise temperatures across any situation. Can teach temperature management with expertise.';

MATCH (s_specific:Skill {name: 'Heat Recognition'})
MATCH (s_general:Skill {name: 'Temperature Control'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MERGE (s_general:Skill {name: 'Sequential Task Execution'})
ON CREATE SET s_general.description = 'The general ability to follow a sequence of steps in precise order, understanding why sequence matters and managing complex multi-step processes reliably',
              s_general.how_to_develop = 'Practice complex multi-step processes. Study optimal sequences. Work under supervision to verify correct sequences. Build discipline in following procedures. Expected time: 4-6 weeks.',
              s_general.novice_level = 'Follows sequences but often makes errors or skips steps. Doesn\'t understand why sequence matters. Progress by: Studying why sequence is important.',
              s_general.advanced_beginner_level = 'Follows most sequences correctly. Beginning to understand consequences of wrong sequence. Occasional errors. Progress by: Practicing more complex sequences.',
              s_general.competent_level = 'Follows sequences reliably and accurately. Understands why sequence matters. Rarely makes errors. Progress by: Handling more complex sequences.',
              s_general.proficient_level = 'Sequential execution is automatic and reliable. Understands sequence logic deeply. Can explain why sequences work. Progress by: Teaching and mastering difficult sequences.',
              s_general.expert_level = 'Sequential execution is intuitive and flawless. Executes complex sequences perfectly. Can modify sequences intelligently. Teaches sequence management with expertise.';

MATCH (s_specific:Skill {name: 'Recipe Following'})
MATCH (s_general:Skill {name: 'Sequential Task Execution'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MATCH (s_specific:Skill {name: 'Ingredient Prep Organization'})
MATCH (s_general:Skill {name: 'Sequential Task Execution'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MERGE (s_general:Skill {name: 'Sensory Evaluation'})
ON CREATE SET s_general.description = 'The general ability to use sensory perception (taste, smell, touch, sight) to evaluate quality, identify problems, and make adjustments in real-time',
              s_general.how_to_develop = 'Develop sensory awareness through deliberate practice. Taste, smell, observe, and feel frequently. Take notes on observations. Compare different quality levels. Expected time: 8-12 weeks.',
              s_general.novice_level = 'Limited sensory awareness. Misses obvious quality issues. Relies on measurement tools. Progress by: Practicing sensory observation deliberately.',
              s_general.advanced_beginner_level = 'Beginning to notice quality differences. Can identify some problems sensorily. Still somewhat limited sensitivity. Progress by: Practicing more advanced sensory discrimination.',
              s_general.competent_level = 'Evaluates quality well through sensory perception. Identifies problems reliably. Makes sound adjustments. Progress by: Refining sensory sensitivity.',
              s_general.proficient_level = 'Sensory evaluation is sophisticated and reliable. Detects subtle quality variations. Makes intuitive adjustments. Progress by: Mastering expert-level sensitivity.',
              s_general.expert_level = 'Sensory evaluation is extraordinarily refined. Detects very subtle quality variations and problems. Adjustments are made with precision and confidence. Teaches sensory evaluation with expertise.';

MATCH (s_specific:Skill {name: 'Taste and Adjustment'})
MATCH (s_general:Skill {name: 'Sensory Evaluation'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MERGE (s_general:Skill {name: 'Complex Process Management'})
ON CREATE SET s_general.description = 'The general ability to plan, coordinate, and execute complex multi-component processes where timing and coordination are critical to success',
              s_general.how_to_develop = 'Manage complex multi-component projects. Plan and coordinate timing. Develop scheduling and management skills. Practice under pressure. Expected time: 12-16 weeks.',
              s_general.novice_level = 'Struggles to manage complex processes. Disorganized and stressed. Components don\'t coordinate well. Progress by: Building planning and organization skills.',
              s_general.advanced_beginner_level = 'Beginning to manage complex processes with moderate success. Sometimes stressed. Some coordination issues remain. Progress by: Practicing more complex processes.',
              s_general.competent_level = 'Manages complex processes well with good coordination. Can handle moderate complexity. Plans effectively. Progress by: Handling increasingly complex processes.',
              s_general.proficient_level = 'Complex process management is confident and effective. Handles high complexity smoothly. Anticipates and solves problems. Progress by: Mastering expert-level complexity.',
              s_general.expert_level = 'Complex process management is masterful. Handles extremely complex processes with apparent ease. Timing and coordination are nearly perfect. Can teach process management with expertise.';

MATCH (s_specific:Skill {name: 'Timing and Coordination'})
MATCH (s_general:Skill {name: 'Complex Process Management'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

MATCH (s_specific:Skill {name: 'Multi-Course Execution'})
MATCH (s_general:Skill {name: 'Complex Process Management'})
CREATE (s_specific)-[:GENERALIZES_TO]->(s_general);

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Cooking relies on relatively few core traits compared to many domains. Most cooking capability
// comes from skills (technique) and knowledge (understanding). The traits below represent
// fundamental characteristics that impact cooking success but cannot be quickly taught.

MERGE (t:Trait {name: 'Sensory Sensitivity'})
ON CREATE SET t.description = 'Natural ability to perceive subtle sensations through taste, smell, sight, and touch; detecting flavor nuances, temperature differences, texture variations, and visual presentation quality',
              t.measurement_criteria = 'Assessed through ability to discriminate between subtle flavor differences, identify individual tastes in complex dishes, and judge quality visually. Low (0-25): Cannot detect subtle differences, tastes broadly (salt/sweet/bitter only). Moderate (26-50): Detects obvious differences, some subtlety awareness. High (51-75): Perceives many subtle differences, good palate discrimination. Exceptional (76-100): Extraordinarily refined perception, detects very subtle variations most people miss.';

MERGE (t:Trait {name: 'Manual Dexterity'})
ON CREATE SET t.description = 'Natural coordination and fine motor control in hands and fingers; essential for knife work, plating, and precise cooking techniques that require controlled hand movements',
              t.measurement_criteria = 'Assessed through hand-eye coordination, precision in fine motor tasks, and ability to control small movements. Low (0-25): Clumsy hand movements, difficulty with precise tasks, frequent accidents. Moderate (26-50): Adequate coordination, some precision possible with focus. High (51-75): Good coordination and control, comfortable with precise tasks. Exceptional (76-100): Exceptional coordination and precision, naturally graceful hand movements.';

MERGE (t:Trait {name: 'Adaptability'})
ON CREATE SET t.description = 'Natural tendency to adjust approach based on changing circumstances, equipment variations, ingredient differences, or unexpected challenges without becoming frustrated or rigid',
              t.measurement_criteria = 'Assessed through flexibility when recipes change, handling missing ingredients, adapting to different equipment, and adjusting to unexpected problems. Low (0-25): Becomes frustrated with changes, rigid in approach, struggles to adapt. Moderate (26-50): Can adapt with effort and planning. High (51-75): Adapts readily to most changes. Exceptional (76-100): Naturally fluid adaptation, changes feel like creative opportunities.';

MERGE (t:Trait {name: 'Focus and Concentration'})
ON CREATE SET t.description = 'Ability to maintain attention on details and tasks over extended periods; essential for managing multiple components simultaneously, maintaining proper technique, and ensuring food safety',
              t.measurement_criteria = 'Assessed through ability to maintain attention during long cooking sessions, remember multiple steps, and catch mistakes. Low (0-25): Easily distracted, forgets details, loses track of tasks. Moderate (26-50): Can focus with effort, maintains attention for moderate periods. High (51-75): Maintains good focus over longer periods, attentive to details. Exceptional (76-100): Extraordinarily focused, maintains intense attention even during complex, long cooking sessions.';

MERGE (t:Trait {name: 'Willingness to Experiment'})
ON CREATE SET t.description = 'Natural inclination to try new approaches, flavors, and techniques without excessive fear of failure; essential for developing innovation and discovering what works beyond recipes',
              t.measurement_criteria = 'Assessed through willingness to try new ingredients, attempt unfamiliar techniques, and create original dishes. Low (0-25): Strictly follows recipes, avoids experimentation, fears failure. Moderate (26-50): Will experiment with guidance, some natural curiosity. High (51-75): Comfortable trying new things, seeks learning opportunities. Exceptional (76-100): Naturally adventurous, sees failures as learning, constantly innovating.';

MERGE (t:Trait {name: 'Physical Stamina'})
ON CREATE SET t.description = 'Natural endurance and energy levels for standing, cooking, and working in a kitchen environment for extended periods without significant fatigue or discomfort',
              t.measurement_criteria = 'Assessed through ability to work on feet for hours, maintain energy through long cooking sessions, and handle physically demanding cooking. Low (0-25): Tires quickly, difficulty standing or working long hours. Moderate (26-50): Can work for moderate periods, some fatigue. High (51-75): Good energy for extended cooking sessions. Exceptional (76-100): Exceptional stamina, can work intensely for very long periods without fatigue.';

// ============================================================
// End of Agent 2c: Trait Nodes
// ============================================================

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// NOVICE LEVEL MILESTONES (1-2 milestones)

MERGE (m:Milestone {name: 'Complete First Meal from Recipe'})
ON CREATE SET m.description = 'Successfully cook a complete meal (2-3 components) by following a recipe from start to finish. This foundational milestone marks entry into cooking and demonstrates basic ability to read recipes, manage timing, and execute fundamentals safely.',
              m.how_to_achieve = 'Choose a simple recipe with 2-3 components suitable for beginners (e.g., pasta with sauce and steamed vegetables). Gather all ingredients and equipment. Read the entire recipe before starting. Follow each step carefully. Manage timing so components are ready together. Expected time: Your first 1-2 weeks of cooking.';

MERGE (m:Milestone {name: 'Pass Food Safety Certification'})
ON CREATE SET m.description = 'Complete a formal food safety course and pass the certification exam (such as ServSafe). This demonstrates foundational knowledge of food handling, storage, and contamination prevention necessary for safe cooking.',
              m.how_to_achieve = 'Enroll in a certified food safety course (online or in-person). Study the course materials thoroughly, focusing on safe temperatures, storage times, and cross-contamination prevention. Take and pass the certification exam. Most courses can be completed in 1-2 weeks.';

// DEVELOPING LEVEL MILESTONES (2-3 milestones)

MERGE (m:Milestone {name: 'Cook Ten Different Dishes Competently'})
ON CREATE SET m.description = 'Successfully prepare ten different recipes well enough that they taste good and are properly executed. This demonstrates growing proficiency with multiple cooking methods and ingredient types.',
              m.how_to_achieve = 'Over 4-8 weeks, cook a variety of dishes using different cooking methods: sautéed proteins, roasted vegetables, pasta dishes, soups, and simple sauces. Keep a list of dishes and note what worked well. Each dish should be well-seasoned and properly cooked.';

MERGE (m:Milestone {name: 'Prepare a Multi-Course Meal for Guests'})
ON CREATE SET m.description = 'Plan and successfully execute a multi-course meal (appetizer, main, side, dessert) for 4+ guests with appropriate timing so components finish together and taste good.',
              m.how_to_achieve = 'Plan a 3-4 course menu weeks in advance. Choose recipes you\'ve made before or similar dishes. Make a detailed timeline working backwards from serving time. Shop for ingredients. Execute the meal, managing timing carefully. Expected time: 8-12 weeks of developing skills before this feels manageable.';

MERGE (m:Milestone {name: 'Master One Complete Cuisine'})
ON CREATE SET m.description = 'Develop competence cooking 8+ dishes from a specific cuisine with authentic technique and flavors. This demonstrates understanding of a cuisine\'s traditions, ingredients, and methods.',
              m.how_to_achieve = 'Choose a cuisine (Italian, Thai, Mexican, etc.). Research its history and key techniques. Cook 2-3 dishes per week from that cuisine over 6-8 weeks. Learn about key ingredients and flavor profiles. Aim to cook 10-15 different dishes from that cuisine with confidence.';

// COMPETENT LEVEL MILESTONES (2-4 milestones)

MERGE (m:Milestone {name: 'Cook Without Recipes in Familiar Territory'})
ON CREATE SET m.description = 'Prepare a complete meal without written recipes, relying on memory and knowledge of techniques, ingredient combinations, and timing. Demonstrates confident understanding of cooking fundamentals.',
              m.how_to_achieve = 'Choose a cuisine or meal type you\'ve cooked many times. Plan a 3-component meal in your head. Cook it without consulting written recipes. The food should taste good and components should be properly cooked and timed. Expected time: Several months of regular cooking to reach this comfort level.';

MERGE (m:Milestone {name: 'Develop Three Original Recipes'})
ON CREATE SET m.description = 'Create and test three original recipes that are well-developed, reproducible, and delicious. Demonstrates ability to understand ingredient interactions and create balanced dishes.',
              m.how_to_achieve = 'Over 8-12 weeks, develop three original dishes based on your favorite flavors or ingredients. Test each recipe multiple times, refining proportions and techniques. Write clear recipes that someone else could follow. Taste critically and adjust until satisfied. Can be variations on classics adapted significantly.';

MERGE (m:Milestone {name: 'Successfully Adapt and Cook 15+ Recipes'})
ON CREATE SET m.description = 'Confidently prepare 15 or more recipes that you\'ve adapted for dietary restrictions, available ingredients, or personal preferences while maintaining dish integrity.',
              m.how_to_achieve = 'Over 12-16 weeks of regular cooking, adapt and successfully cook 15+ recipes: substitute ingredients, omit allergens, adjust techniques. Keep notes on what substitutions worked well. Examples: vegetarian versions of meat dishes, gluten-free baking, vegan alternatives. All should taste good and be properly executed.';

MERGE (m:Milestone {name: 'Execute 30-Minute Multi-Component Meals'})
ON CREATE SET m.description = 'Plan and cook a complete 3-4 component meal in 30 minutes or less with proper technique, seasoning, and timing. Demonstrates efficient skills and solid fundamentals.',
              m.how_to_achieve = 'Select simple recipes you know well. Practice cooking them efficiently, timing components to finish together. Run a timer and aim for 30-minute total execution including cleanup of major items. Start with 45 minutes, gradually reduce time. Expected time: 8-12 weeks of practice.';

// ADVANCED LEVEL MILESTONES (2-4 milestones)

MERGE (m:Milestone {name: 'Teach Cooking to Two or More People'})
ON CREATE SET m.description = 'Successfully teach cooking skills to multiple people, demonstrating ability to explain techniques clearly and help others develop their culinary skills.',
              m.how_to_achieve = 'Teach cooking to 2+ people over a period of weeks or months. Can be formal (classes) or informal (friends/family). Focus on explaining techniques clearly, answering questions, and helping them improve. Evaluate their progress and adjust your teaching approach.';

MERGE (m:Milestone {name: 'Create a Complete Tasting Menu'})
ON CREATE SET m.description = 'Design and execute a full tasting menu (5-8 courses) with coordinated themes, progression, and sophisticated flavors. Demonstrates advanced planning and technical skill.',
              m.how_to_achieve = 'Over 2-4 weeks, plan a 5-8 course tasting menu with coherent theme. Consider flavor progression, portion sizes, technique variety, and visual appeal. Source special ingredients if desired. Execute for 4-6 guests with excellent timing and presentation. Each course should demonstrate technical skill and flavor sophistication.';

MERGE (m:Milestone {name: 'Develop Cuisine-Specific Signature Dishes'})
ON CREATE SET m.description = 'Create 3-5 original signature dishes that represent mastery of a specific cuisine, combining authenticity with personal creativity and innovation.',
              m.how_to_achieve = 'Choose a cuisine you\'ve mastered. Create 3-5 original dishes that are rooted in that cuisine\'s traditions but include your unique approach. Test and refine each extensively. Document the development process. Dishes should represent both technical mastery and creative voice.';

MERGE (m:Milestone {name: 'Maintain Consistent Quality Across 50+ Dishes'})
ON CREATE SET m.description = 'Develop and consistently prepare a repertoire of 50+ dishes to a high standard of technique, flavor, and presentation. Demonstrates comprehensive culinary competence.',
              m.how_to_achieve = 'Over 6-12 months, build and maintain a working repertoire of 50+ dishes you cook regularly. Track your cooking and maintain quality standards across all dishes. Dishes should be properly cooked, well-seasoned, and attractively presented. Use tasting notes to maintain consistency.';

// MASTER LEVEL MILESTONES (2-5 milestones)

MERGE (m:Milestone {name: 'Create Culinary Work Recognized by Peers'})
ON CREATE SET m.description = 'Have your cooking, recipes, or culinary ideas recognized and praised by experienced cooks or culinary professionals. Demonstrates achievement of excellence level.',
              m.how_to_achieve = 'Create dishes, recipes, or culinary approaches that receive positive recognition from experienced cooks or professionals. Can be through: published recipes, demonstrations, participation in culinary events, or peer evaluation. Build reputation for culinary excellence over time.';

MERGE (m:Milestone {name: 'Lead a Professional Kitchen Successfully'})
ON CREATE SET m.description = 'Manage a professional kitchen or restaurant kitchen, setting culinary standards, mentoring staff, and producing consistently excellent food. Demonstrates master-level professional capability.',
              m.how_to_achieve = 'Take on leadership role in a professional kitchen environment. Set culinary standards and direction. Train and develop kitchen staff. Maintain food quality standards consistently. Over time, build a reputation for the kitchen\'s excellence and your leadership. Timeframe varies but involves at least 12-24 months of active leadership.';

MERGE (m:Milestone {name: 'Publish Original Recipes or Culinary Work'})
ON CREATE SET m.description = 'Have original recipes or culinary writing published in a cookbook, food magazine, blog with substantial following, or similar publication. Demonstrates mastery and recognition.',
              m.how_to_achieve = 'Develop a collection of 10-20 original, well-tested recipes. Write accompanying descriptions and techniques. Submit to publishers, food magazines, or establish your own platform (blog, social media). Build an audience and secure publication. Can also self-publish. Expected timeline: 12-24 months of development and submission.';

MERGE (m:Milestone {name: 'Win a Cooking Competition'})
ON CREATE SET m.description = 'Compete in and win a recognized cooking competition, demonstrating mastery of technique, flavor creation, and performance under pressure.',
              m.how_to_achieve = 'Research local, regional, or national cooking competitions. Enter competitions at appropriate skill level. Study competition formats and rules. Compete in 2-5 competitions before winning. Victory can be in amateur or professional categories. Consider competitions like: culinary competitions, food festivals, cooking shows.';

MERGE (m:Milestone {name: 'Develop Unique Culinary Voice and Philosophy'})
ON CREATE SET m.description = 'Develop a recognizable, distinctive culinary philosophy or style that represents mastery combined with innovation. Your cooking is identifiable as uniquely yours.',
              m.how_to_achieve = 'Over years of cooking experience, develop personal culinary principles that guide your cooking. This reflects your values, techniques, and creative approach. Document your philosophy. Your dishes and approach should be recognizable and distinctive. Build a body of work that expresses this philosophy consistently.';

MERGE (m:Milestone {name: 'Mentor Future Culinary Professionals'})
ON CREATE SET m.description = 'Serve as a mentor to multiple people who go on to develop careers or serious pursuits in cooking, demonstrating your teaching ability and mastery level.',
              m.how_to_achieve = 'Mentor 2-4 people over years of relationship. Help them develop serious cooking skills and knowledge. Mentor at a depth where they develop career-level capability. Track their development and contributions. Recognition comes from their achievements and their recognition of your mentorship impact.';

// ============================================================
// End of Agent 2d: Milestone Nodes
// ============================================================

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// LEVEL 1 (NOVICE) - REQUIREMENTS
// ============================================================

// Level 1: Knowledge Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Cooking Knife Safety'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Basic Cooking Methods'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Food Safety and Sanitation'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Basic Ingredient Preparation'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Basic Seasoning'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Recipe Reading and Following'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (k:Knowledge {name: 'Equipment and Cookware'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

// Level 1: Skill Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Knife Handling'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Heat Recognition'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Recipe Following'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Food Safety Practices'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Ingredient Prep Organization'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Basic Sautéing'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (s:Skill {name: 'Basic Seasoning'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Level 1: Trait Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (t:Trait {name: 'Focus and Concentration'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

// Level 1: Milestone Requirements
MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (m:Milestone {name: 'Complete First Meal from Recipe'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Cooking Novice'})
MATCH (m:Milestone {name: 'Pass Food Safety Certification'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 2 (DEVELOPING) - REQUIREMENTS
// ============================================================

// Level 2: Knowledge Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Cooking Knife Safety'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Basic Cooking Methods'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Food Safety and Sanitation'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Basic Ingredient Preparation'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Basic Seasoning'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Heat Control and Temperature'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Ingredient Substitution'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Vegetable Preparation Techniques'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (k:Knowledge {name: 'Protein Cooking'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Level 2: Skill Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Knife Handling'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Heat Recognition'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Recipe Following'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Food Safety Practices'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Ingredient Prep Organization'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Basic Sautéing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Basic Seasoning'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Vegetable Preparation'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Protein Cooking'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (s:Skill {name: 'Taste and Adjustment'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

// Level 2: Trait Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (t:Trait {name: 'Focus and Concentration'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (t:Trait {name: 'Sensory Sensitivity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

// Level 2: Milestone Requirements
MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (m:Milestone {name: 'Cook Ten Different Dishes Competently'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (m:Milestone {name: 'Master One Complete Cuisine'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Cooking Developing'})
MATCH (m:Milestone {name: 'Prepare a Multi-Course Meal for Guests'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// LEVEL 3 (COMPETENT) - REQUIREMENTS
// ============================================================

// Level 3: Knowledge Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Basic Cooking Methods'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Food Safety and Sanitation'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Heat Control and Temperature'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Ingredient Substitution'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Sauce Making'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Timing and Meal Coordination'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Cooking Chemistry'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Vegetable Preparation Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Protein Cooking'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (k:Knowledge {name: 'Knife Skills'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Level 3: Skill Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Knife Handling'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Heat Recognition'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Recipe Following'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Food Safety Practices'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Vegetable Preparation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Protein Cooking'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Flavor Building'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Timing and Coordination'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Sauce Making'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (s:Skill {name: 'Taste and Adjustment'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Level 3: Trait Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (t:Trait {name: 'Focus and Concentration'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (t:Trait {name: 'Sensory Sensitivity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (t:Trait {name: 'Adaptability'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

// Level 3: Milestone Requirements
MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (m:Milestone {name: 'Cook Without Recipes in Familiar Territory'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (m:Milestone {name: 'Develop Three Original Recipes'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (m:Milestone {name: 'Successfully Adapt and Cook 15+ Recipes'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Cooking Competent'})
MATCH (m:Milestone {name: 'Execute 30-Minute Multi-Component Meals'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// LEVEL 4 (ADVANCED) - REQUIREMENTS
// ============================================================

// Level 4: Knowledge Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Heat Control and Temperature'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Cooking Chemistry'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Knife Skills'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Culinary Techniques Across Cuisines'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Recipe Development'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Advanced Sauce Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Food Presentation and Plating'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Menu Planning'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (k:Knowledge {name: 'Advanced Seasoning and Flavor Balancing'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Level 4: Skill Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Vegetable Preparation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Protein Cooking'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Flavor Building'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Timing and Coordination'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Sauce Making'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Advanced Knife Techniques'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Multi-Course Execution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Improvisation and Adaptation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Flavor Chemistry Understanding'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Cuisine-Specific Mastery'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (s:Skill {name: 'Plating and Presentation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Level 4: Trait Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (t:Trait {name: 'Focus and Concentration'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (t:Trait {name: 'Sensory Sensitivity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (t:Trait {name: 'Adaptability'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (t:Trait {name: 'Willingness to Experiment'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

// Level 4: Milestone Requirements
MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (m:Milestone {name: 'Teach Cooking to Two or More People'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (m:Milestone {name: 'Create a Complete Tasting Menu'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (m:Milestone {name: 'Develop Cuisine-Specific Signature Dishes'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Cooking Advanced'})
MATCH (m:Milestone {name: 'Maintain Consistent Quality Across 50+ Dishes'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// LEVEL 5 (MASTER) - REQUIREMENTS
// ============================================================

// Level 5: Knowledge Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Cooking Chemistry'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Knife Skills'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Culinary Techniques Across Cuisines'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Recipe Development'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Advanced Sauce Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Food Presentation and Plating'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Menu Planning'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Advanced Seasoning and Flavor Balancing'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Culinary Innovation and Modernism'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Culinary History and Evolution'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Teaching and Culinary Mentoring'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (k:Knowledge {name: 'Ingredient Sourcing and Selection'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Level 5: Skill Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Advanced Knife Techniques'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Multi-Course Execution'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Improvisation and Adaptation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Flavor Chemistry Understanding'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Cuisine-Specific Mastery'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Plating and Presentation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Recipe Development'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Culinary Innovation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Culinary Leadership'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Ingredient Sourcing and Selection'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (s:Skill {name: 'Culinary Teaching'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Level 5: Trait Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Focus and Concentration'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Manual Dexterity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Sensory Sensitivity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Adaptability'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Willingness to Experiment'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (t:Trait {name: 'Physical Stamina'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

// Level 5: Milestone Requirements
MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Create Culinary Work Recognized by Peers'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Lead a Professional Kitchen Successfully'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Publish Original Recipes or Culinary Work'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Win a Cooking Competition'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Develop Unique Culinary Voice and Philosophy'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Cooking Master'})
MATCH (m:Milestone {name: 'Mentor Future Culinary Professionals'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// COMPONENT PREREQUISITES
// ============================================================

// ============================================================
// Knowledge Prerequisites
// ============================================================

// Sauce Making depends on understanding Basic Cooking Methods
MATCH (k1:Knowledge {name: 'Sauce Making'})
MATCH (k2:Knowledge {name: 'Basic Cooking Methods'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Sauce Making depends on Heat Control and Temperature
MATCH (k1:Knowledge {name: 'Sauce Making'})
MATCH (k2:Knowledge {name: 'Heat Control and Temperature'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced Sauce Techniques depends on Sauce Making
MATCH (k1:Knowledge {name: 'Advanced Sauce Techniques'})
MATCH (k2:Knowledge {name: 'Sauce Making'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Cooking Chemistry depends on Basic Cooking Methods
MATCH (k1:Knowledge {name: 'Cooking Chemistry'})
MATCH (k2:Knowledge {name: 'Basic Cooking Methods'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Heat Control depends on Basic Cooking Methods
MATCH (k1:Knowledge {name: 'Heat Control and Temperature'})
MATCH (k2:Knowledge {name: 'Basic Cooking Methods'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Flavor Pairing depends on Basic Seasoning
MATCH (k1:Knowledge {name: 'Flavor Pairing and Profiles'})
MATCH (k2:Knowledge {name: 'Basic Seasoning'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced Seasoning depends on Flavor Pairing and Basic Seasoning
MATCH (k1:Knowledge {name: 'Advanced Seasoning and Flavor Balancing'})
MATCH (k2:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Menu Planning depends on Timing and Meal Coordination
MATCH (k1:Knowledge {name: 'Menu Planning'})
MATCH (k2:Knowledge {name: 'Timing and Meal Coordination'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Recipe Development depends on Cooking Chemistry
MATCH (k1:Knowledge {name: 'Recipe Development'})
MATCH (k2:Knowledge {name: 'Cooking Chemistry'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Recipe Development depends on Flavor Pairing
MATCH (k1:Knowledge {name: 'Recipe Development'})
MATCH (k2:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Culinary Techniques depends on Protein and Vegetable Preparation
MATCH (k1:Knowledge {name: 'Culinary Techniques Across Cuisines'})
MATCH (k2:Knowledge {name: 'Protein Cooking'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Knife Skills depends on Basic Ingredient Preparation
MATCH (k1:Knowledge {name: 'Knife Skills'})
MATCH (k2:Knowledge {name: 'Basic Ingredient Preparation'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Food Presentation depends on Flavor Pairing and Heat Control
MATCH (k1:Knowledge {name: 'Food Presentation and Plating'})
MATCH (k2:Knowledge {name: 'Flavor Pairing and Profiles'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Cooking for Dietary Restrictions depends on Food Safety and Ingredient Substitution
MATCH (k1:Knowledge {name: 'Cooking for Dietary Restrictions'})
MATCH (k2:Knowledge {name: 'Ingredient Substitution'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Ingredient Sourcing depends on understanding ingredients broadly
MATCH (k1:Knowledge {name: 'Ingredient Sourcing and Selection'})
MATCH (k2:Knowledge {name: 'Ingredient Substitution'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// ============================================================
// Skill Prerequisites
// ============================================================

// Heat Recognition depends on Knife Handling (foundational safety)
MATCH (s1:Skill {name: 'Heat Recognition'})
MATCH (s2:Skill {name: 'Knife Handling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Sautéing depends on Heat Recognition
MATCH (s1:Skill {name: 'Basic Sautéing'})
MATCH (s2:Skill {name: 'Heat Recognition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Sautéing depends on Ingredient Prep Organization
MATCH (s1:Skill {name: 'Basic Sautéing'})
MATCH (s2:Skill {name: 'Ingredient Prep Organization'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Basic Seasoning depends on Taste and Adjustment
MATCH (s1:Skill {name: 'Basic Seasoning'})
MATCH (s2:Skill {name: 'Taste and Adjustment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Taste and Adjustment depends on Sensory Sensitivity
MATCH (s1:Skill {name: 'Taste and Adjustment'})
MATCH (t1:Trait {name: 'Sensory Sensitivity'})
CREATE (s1)-[:REQUIRES_TRAIT {min_score: 25}]->(t1);

// Vegetable Preparation depends on Knife Handling
MATCH (s1:Skill {name: 'Vegetable Preparation'})
MATCH (s2:Skill {name: 'Knife Handling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Vegetable Preparation depends on Heat Recognition
MATCH (s1:Skill {name: 'Vegetable Preparation'})
MATCH (s2:Skill {name: 'Heat Recognition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Protein Cooking depends on Heat Recognition
MATCH (s1:Skill {name: 'Protein Cooking'})
MATCH (s2:Skill {name: 'Heat Recognition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Protein Cooking depends on Food Safety Practices
MATCH (s1:Skill {name: 'Protein Cooking'})
MATCH (s2:Skill {name: 'Food Safety Practices'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Flavor Building depends on Basic Seasoning
MATCH (s1:Skill {name: 'Flavor Building'})
MATCH (s2:Skill {name: 'Basic Seasoning'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Flavor Building depends on Taste and Adjustment
MATCH (s1:Skill {name: 'Flavor Building'})
MATCH (s2:Skill {name: 'Taste and Adjustment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Timing and Coordination depends on Recipe Following
MATCH (s1:Skill {name: 'Timing and Coordination'})
MATCH (s2:Skill {name: 'Recipe Following'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Sauce Making depends on Basic Sautéing
MATCH (s1:Skill {name: 'Sauce Making'})
MATCH (s2:Skill {name: 'Basic Sautéing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Sauce Making depends on Heat Recognition
MATCH (s1:Skill {name: 'Sauce Making'})
MATCH (s2:Skill {name: 'Heat Recognition'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Sauce Making depends on Taste and Adjustment
MATCH (s1:Skill {name: 'Sauce Making'})
MATCH (s2:Skill {name: 'Taste and Adjustment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Advanced Knife Techniques depends on Knife Handling
MATCH (s1:Skill {name: 'Advanced Knife Techniques'})
MATCH (s2:Skill {name: 'Knife Handling'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Multi-Course Execution depends on Timing and Coordination
MATCH (s1:Skill {name: 'Multi-Course Execution'})
MATCH (s2:Skill {name: 'Timing and Coordination'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Improvisation and Adaptation depends on Flavor Building
MATCH (s1:Skill {name: 'Improvisation and Adaptation'})
MATCH (s2:Skill {name: 'Flavor Building'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Flavor Chemistry Understanding depends on Flavor Building
MATCH (s1:Skill {name: 'Flavor Chemistry Understanding'})
MATCH (s2:Skill {name: 'Flavor Building'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Plating and Presentation depends on Visual/Sensory skills
MATCH (s1:Skill {name: 'Plating and Presentation'})
MATCH (t1:Trait {name: 'Sensory Sensitivity'})
CREATE (s1)-[:REQUIRES_TRAIT {min_score: 40}]->(t1);

// Recipe Development depends on Flavor Building
MATCH (s1:Skill {name: 'Recipe Development'})
MATCH (s2:Skill {name: 'Flavor Building'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Culinary Innovation depends on Recipe Development
MATCH (s1:Skill {name: 'Culinary Innovation'})
MATCH (s2:Skill {name: 'Recipe Development'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Culinary Teaching depends on understanding cooking deeply (Flavor Building)
MATCH (s1:Skill {name: 'Culinary Teaching'})
MATCH (s2:Skill {name: 'Flavor Building'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Ingredient Sourcing depends on overall ingredient knowledge
MATCH (s1:Skill {name: 'Ingredient Sourcing and Selection'})
MATCH (s2:Skill {name: 'Taste and Adjustment'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// ============================================================
// Milestone Prerequisites
// ============================================================

// Cook Ten Different Dishes requires Complete First Meal
MATCH (m1:Milestone {name: 'Cook Ten Different Dishes Competently'})
MATCH (m2:Milestone {name: 'Complete First Meal from Recipe'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Prepare Multi-Course Meal requires Cook Ten Different Dishes
MATCH (m1:Milestone {name: 'Prepare a Multi-Course Meal for Guests'})
MATCH (m2:Milestone {name: 'Cook Ten Different Dishes Competently'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Master One Cuisine requires Cook Ten Different Dishes
MATCH (m1:Milestone {name: 'Master One Complete Cuisine'})
MATCH (m2:Milestone {name: 'Cook Ten Different Dishes Competently'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Cook Without Recipes requires Prepare Multi-Course Meal
MATCH (m1:Milestone {name: 'Cook Without Recipes in Familiar Territory'})
MATCH (m2:Milestone {name: 'Prepare a Multi-Course Meal for Guests'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Develop Three Original Recipes requires Cook Without Recipes
MATCH (m1:Milestone {name: 'Develop Three Original Recipes'})
MATCH (m2:Milestone {name: 'Cook Without Recipes in Familiar Territory'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Execute 30-Minute Meals requires Prepare Multi-Course Meal
MATCH (m1:Milestone {name: 'Execute 30-Minute Multi-Component Meals'})
MATCH (m2:Milestone {name: 'Prepare a Multi-Course Meal for Guests'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Create Tasting Menu requires Master One Cuisine
MATCH (m1:Milestone {name: 'Create a Complete Tasting Menu'})
MATCH (m2:Milestone {name: 'Master One Complete Cuisine'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Develop Signature Dishes requires Master One Cuisine
MATCH (m1:Milestone {name: 'Develop Cuisine-Specific Signature Dishes'})
MATCH (m2:Milestone {name: 'Master One Complete Cuisine'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Maintain 50+ Dishes requires Develop Three Original Recipes
MATCH (m1:Milestone {name: 'Maintain Consistent Quality Across 50+ Dishes'})
MATCH (m2:Milestone {name: 'Develop Three Original Recipes'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Lead Professional Kitchen requires Teach Cooking to Two or More People
MATCH (m1:Milestone {name: 'Lead a Professional Kitchen Successfully'})
MATCH (m2:Milestone {name: 'Teach Cooking to Two or More People'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Publish Recipes requires Develop Three Original Recipes
MATCH (m1:Milestone {name: 'Publish Original Recipes or Culinary Work'})
MATCH (m2:Milestone {name: 'Develop Three Original Recipes'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Win Competition requires Create Tasting Menu
MATCH (m1:Milestone {name: 'Win a Cooking Competition'})
MATCH (m2:Milestone {name: 'Create a Complete Tasting Menu'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Develop Unique Voice requires Maintain 50+ Dishes
MATCH (m1:Milestone {name: 'Develop Unique Culinary Voice and Philosophy'})
MATCH (m2:Milestone {name: 'Maintain Consistent Quality Across 50+ Dishes'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Mentor Future Professionals requires Lead Professional Kitchen
MATCH (m1:Milestone {name: 'Mentor Future Culinary Professionals'})
MATCH (m2:Milestone {name: 'Lead a Professional Kitchen Successfully'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// ============================================================
// End Agent 3: Relationships
// ============================================================
