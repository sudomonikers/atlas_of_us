// Domain: Mixology
// Generated: 2025-12-20
// Description: The art and science of crafting cocktails and mixed drinks, encompassing spirits knowledge, flavor theory, technique mastery, and creative expression

// ============================================================
// DOMAIN: Mixology
// Generated: 2025-12-20
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Mixology',
  description: 'The art and science of crafting cocktails and mixed drinks, encompassing spirits knowledge, flavor theory, technique mastery, and creative expression through the blending of ingredients, understanding of flavor profiles, and professional bartending craft',
  level_count: 5,
  created_date: date(),
  scope_included: ['spirits classification and production', 'flavor theory and taste profiles', 'cocktail mixing techniques', 'measurement and proportions', 'bar equipment and tools', 'cocktail history and classics', 'ingredient knowledge and sourcing', 'garnishing and presentation', 'creative recipe development', 'sensory evaluation and palate development', 'batch cocktails and scaling', 'molecular mixology and modern techniques'],
  scope_excluded: ['wine expertise (separate domain)', 'beer and brewing (separate domain)', 'general hospitality and customer service (separate domain)', 'bar management and business operations (separate domain)', 'food pairing (separate domain)', 'nutrition science', 'alcohol chemistry at molecular level (chemistry domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Mixology Novice',
  description: 'Learning basic cocktail fundamentals, classic recipes, and essential techniques like shaking and stirring with proper form'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Mixology Developing',
  description: 'Building proficiency with diverse spirits, understanding flavor balance, preparing cocktails consistently, and beginning to modify classic recipes'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Mixology Competent',
  description: 'Working independently with comprehensive spirits knowledge, creating balanced original cocktails, executing advanced techniques, and developing a distinctive style'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Mixology Advanced',
  description: 'Mastering contemporary and experimental techniques, mentoring other bartenders, creating signature cocktails, and contributing to the local mixology community'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Mixology Master',
  description: 'Operating at the highest levels of craft, innovating new techniques and flavor combinations, recognized as an expert, and advancing the art and science of mixology'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Mixology'})
MATCH (level1:Domain_Level {name: 'Mixology Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Mixology'})
MATCH (level2:Domain_Level {name: 'Mixology Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Mixology'})
MATCH (level3:Domain_Level {name: 'Mixology Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Mixology'})
MATCH (level4:Domain_Level {name: 'Mixology Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Mixology'})
MATCH (level5:Domain_Level {name: 'Mixology Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// FOUNDATIONAL KNOWLEDGE - Novice Level

MERGE (k_spirits:Knowledge {name: 'Mixology Spirits Classification'})
ON CREATE SET k_spirits.description = 'The systematic organization and categorization of distilled spirits and liqueurs used in cocktails, including spirits families (vodka, gin, rum, whiskey, tequila, brandy), ABV ranges, and production methods',
              k_spirits.how_to_learn = 'Study spirits guides and tasting resources. Visit liquor stores and read bottle labels systematically. Attend basic spirits education courses or tastings. Practice identifying spirit types by visual appearance and aroma. Expected time: 2-3 weeks of regular study.',
              k_spirits.remember_level = 'Recall the major spirit categories (vodka, gin, rum, whiskey, tequila, brandy, liqueurs) and their typical ABV percentages',
              k_spirits.understand_level = 'Explain the differences between spirit families and understand why certain spirits are used in specific cocktails',
              k_spirits.apply_level = 'Select appropriate spirits for classic cocktails and suggest spirit substitutions based on flavor profiles',
              k_spirits.analyze_level = 'Compare spirits within families and analyze how production methods affect flavor characteristics',
              k_spirits.evaluate_level = 'Judge spirit quality and assess whether a spirit is appropriate for a particular cocktail style',
              k_spirits.create_level = 'Develop new cocktails by selecting spirits that complement specific flavor objectives';

MERGE (k_classic_cocktails:Knowledge {name: 'Mixology Classic Cocktail Recipes'})
ON CREATE SET k_classic_cocktails.description = 'The essential, traditional cocktail recipes that form the foundation of bartending, including drinks like the Margarita, Daiquiri, Martini, Manhattan, and Old Fashioned with their standard proportions and preparation methods',
              k_classic_cocktails.how_to_learn = 'Memorize 10-15 classic cocktail recipes using reference materials or flashcards. Practice making each drink multiple times to develop muscle memory. Study the history of each cocktail. Read resources like "The Joy of Mixology" or comparable guides. Expected time: 3-4 weeks.',
              k_classic_cocktails.remember_level = 'Recall the basic ingredients and proportions of 10+ classic cocktails',
              k_classic_cocktails.understand_level = 'Explain what makes each classic cocktail distinctive and why the proportions matter',
              k_classic_cocktails.apply_level = 'Prepare classic cocktails with proper proportions and presentation on demand',
              k_classic_cocktails.analyze_level = 'Examine why classic recipes have endured and compare variations of classic drinks across different bars',
              k_classic_cocktails.evaluate_level = 'Judge the quality of executed classic cocktails and identify when a classic has been executed properly versus poorly',
              k_classic_cocktails.create_level = 'Create thoughtful variations of classic cocktails while respecting the original formula';

MERGE (k_shaking:Knowledge {name: 'Mixology Shaking Technique'})
ON CREATE SET k_shaking.description = 'The fundamental bartending technique for mixing ingredients using a cocktail shaker, including proper grip, movement patterns, rhythm, and when to use the shake method versus stirring',
              k_shaking.how_to_learn = 'Practice shaking motions with an empty shaker daily. Watch instructional videos demonstrating proper technique. Practice with water to develop consistency before using alcohol. Train under an experienced bartender. Expected time: 1-2 weeks of daily practice.',
              k_shaking.remember_level = 'Recall the basic components of proper shaking technique (grip, movement, timing)',
              k_shaking.understand_level = 'Explain why certain cocktails require shaking and what occurs during the shaking process (mixing, chilling, dilution)',
              k_shaking.apply_level = 'Shake cocktails with proper form, consistency, and appropriate duration for different drink types',
              k_shaking.analyze_level = 'Analyze which shaking styles work best for different ingredient combinations and textures',
              k_shaking.evaluate_level = 'Judge the quality of a shake based on the sound, feel, and resulting drink temperature and dilution',
              k_shaking.create_level = 'Develop signature shaking styles or techniques that become part of your bartending identity';

MERGE (k_stirring:Knowledge {name: 'Mixology Stirring Technique'})
ON CREATE SET k_stirring.description = 'The bartending technique for mixing ingredients using a bar spoon in a mixing glass, including proper grip, stirring motion, dilution control, and when stirring is preferred over shaking for certain cocktails',
              k_stirring.how_to_learn = 'Practice stirring motions with a bar spoon in a mixing glass daily. Study technique videos emphasizing proper stirring form. Practice with water and ice to develop smooth, controlled movements. Train under experienced bartenders. Expected time: 1-2 weeks.',
              k_stirring.remember_level = 'Recall the basic stirring motion and proper grip on the bar spoon',
              k_stirring.understand_level = 'Explain why spirit-forward cocktails are stirred rather than shaken and the effects of stirring on the final drink',
              k_stirring.apply_level = 'Stir cocktails smoothly with consistent technique and appropriate timing to achieve proper dilution',
              k_stirring.analyze_level = 'Analyze the differences between short stirring, medium stirring, and extended stirring in terms of dilution and temperature',
              k_stirring.evaluate_level = 'Judge whether a cocktail has been properly stirred based on temperature, dilution, and taste',
              k_stirring.create_level = 'Experiment with stirring variations to achieve specific dilution and texture objectives';

MERGE (k_measurements:Knowledge {name: 'Mixology Cocktail Proportions'})
ON CREATE SET k_measurements.description = 'The standard measurements and ratios used in cocktail recipes, including ounces, milliliters, parts-based systems, and how proportions affect flavor balance and drink characteristics',
              k_measurements.how_to_learn = 'Memorize common cocktail proportions (e.g., sours are 2:1:1, daiquiris are 2:1:.5). Use measuring tools (jiggers, pourers) repeatedly to develop a feel for quantities. Study recipe books with precise measurements. Practice measuring with both metric and imperial systems. Expected time: 2 weeks.',
              k_measurements.remember_level = 'Recall standard measurements for classic cocktails and common proportion ratios',
              k_measurements.understand_level = 'Explain how changing proportions affects flavor balance and how measurement systems convert between each other',
              k_measurements.apply_level = 'Accurately measure cocktail ingredients using jiggers and other tools to achieve consistent results',
              k_measurements.analyze_level = 'Analyze how different proportions affect the flavor profile and drinking experience of a cocktail',
              k_measurements.evaluate_level = 'Judge whether proportions in a recipe are balanced and appropriate for the ingredient combination',
              k_measurements.create_level = 'Develop new cocktail recipes with thoughtfully balanced proportions';

MERGE (k_bar_equipment:Knowledge {name: 'Mixology Bar Equipment'})
ON CREATE SET k_bar_equipment.description = 'The essential tools used in bartending including cocktail shaker, bar spoon, jigger, strainer, muddler, julep strainer, and how to select and use each tool properly',
              k_bar_equipment.how_to_learn = 'Handle and practice with each bar tool regularly. Learn the specific purpose and proper technique for each tool. Read bartender resources about tool selection and maintenance. Watch instructional videos on tool use. Expected time: 2-3 weeks.',
              k_bar_equipment.remember_level = 'Recall the names and basic functions of essential bar tools',
              k_bar_equipment.understand_level = 'Explain what each tool does and why certain tools are chosen for specific tasks',
              k_bar_equipment.apply_level = 'Use each bar tool correctly and maintain them properly',
              k_bar_equipment.analyze_level = 'Compare different styles and brands of tools and analyze which are best suited for different bartending environments',
              k_bar_equipment.evaluate_level = 'Judge the quality and appropriateness of bar tools and assess whether your toolkit is complete',
              k_bar_equipment.create_level = 'Design or customize bar tool setups for specific bartending styles or specialties';

// CORE KNOWLEDGE - Developing/Competent Levels

MERGE (k_flavor_theory:Knowledge {name: 'Mixology Flavor Theory'})
ON CREATE SET k_flavor_theory.description = 'The principles governing how flavors interact in cocktails, including taste profiles (sweet, sour, bitter, strong), flavor balance, complementary and contrasting flavors, and how to achieve harmonic flavor combinations',
              k_flavor_theory.how_to_learn = 'Study flavor wheels and taste mapping resources. Conduct guided tastings comparing complementary and contrasting flavors. Read books on flavor science and cocktail theory. Experiment with creating flavor combinations and document your observations. Expected time: 4-6 weeks.',
              k_flavor_theory.remember_level = 'Recall basic taste profiles and common flavor combinations used in cocktails',
              k_flavor_theory.understand_level = 'Explain how different flavor categories complement or contrast with each other and why certain combinations work',
              k_flavor_theory.apply_level = 'Apply flavor theory to select ingredients that create balanced and harmonious cocktails',
              k_flavor_theory.analyze_level = 'Analyze the flavor components in complex cocktails and identify what makes the combination work',
              k_flavor_theory.evaluate_level = 'Judge whether a flavor combination is balanced and whether the cocktail achieves its intended flavor profile',
              k_flavor_theory.create_level = 'Create new cocktail recipes based on deliberately chosen flavor combinations';

MERGE (k_spirit_production:Knowledge {name: 'Mixology Spirit Production Methods'})
ON CREATE SET k_spirit_production.description = 'The manufacturing processes for different spirits including fermentation, distillation, aging, barrel selection, and how production methods influence spirit character, flavor profile, and suitability for different cocktails',
              k_spirit_production.how_to_learn = 'Read detailed spirit production guides and distillery resources. Visit distilleries or watch distillery tour videos. Study how aging and barrel types affect final spirit characteristics. Practice tasting spirits from different producers to identify production-influenced flavors. Expected time: 4-6 weeks.',
              k_spirit_production.remember_level = 'Recall how different spirit types are produced and basic differences between production methods',
              k_spirit_production.understand_level = 'Explain how production processes affect spirit flavor and why certain production choices matter',
              k_spirit_production.apply_level = 'Select spirits based on production method when seeking specific flavor characteristics',
              k_spirit_production.analyze_level = 'Analyze how different production methods create different flavor profiles within the same spirit category',
              k_spirit_production.evaluate_level = 'Judge spirit quality and character based on understanding production methods',
              k_spirit_production.create_level = 'Design cocktails specifically to showcase or balance characteristics created by specific production methods';

MERGE (k_garnishing:Knowledge {name: 'Mixology Garnishing and Presentation'})
ON CREATE SET k_garnishing.description = 'The art of selecting and preparing garnishes for cocktails including citrus peels, herbs, spices, and specialized garnishes, and how garnishes affect aroma, flavor, and visual presentation',
              k_garnishing.how_to_learn = 'Practice preparing traditional garnishes (citrus peels, twists, wheels, herbs). Study garnish techniques through videos and guides. Learn about garnish flavor contributions and aroma release. Experiment with garnish pairings with different cocktails. Expected time: 2-3 weeks.',
              k_garnishing.remember_level = 'Recall traditional garnishes for classic cocktails and basic garnish preparation methods',
              k_garnishing.understand_level = 'Explain how garnishes contribute to flavor and aroma and why specific garnishes pair with certain cocktails',
              k_garnishing.apply_level = 'Prepare and apply appropriate garnishes to cocktails with proper technique and presentation',
              k_garnishing.analyze_level = 'Analyze how different garnishes affect the drinking experience and aromatics of a cocktail',
              k_garnishing.evaluate_level = 'Judge whether a garnish choice is appropriate for a cocktail and enhances the overall drink',
              k_garnishing.create_level = 'Develop innovative garnishes and presentation styles that complement new cocktail creations';

MERGE (k_dilution:Knowledge {name: 'Mixology Dilution Control'})
ON CREATE SET k_dilution.description = 'Understanding how water or ice melt affects cocktail flavor, texture, and temperature, and how to control dilution through technique choices, ice type, and mixing method to achieve optimal drink balance',
              k_dilution.how_to_learn = 'Practice shaking and stirring while paying attention to dilution timing. Taste cocktails with varying dilution levels to understand how water affects flavor. Study the science of ice melt and temperature. Experiment with different ice types. Expected time: 3-4 weeks.',
              k_dilution.remember_level = 'Recall that dilution is a necessary component of cocktails and recognize basic dilution principles',
              k_dilution.understand_level = 'Explain why dilution is important and how different techniques control dilution differently',
              k_dilution.apply_level = 'Control dilution during shaking and stirring to achieve proper balance in different cocktail styles',
              k_dilution.analyze_level = 'Analyze how dilution affects flavor perception and alcohol burn in different cocktails',
              k_dilution.evaluate_level = 'Judge whether a cocktail has been properly diluted by taste and by appearance',
              k_dilution.create_level = 'Develop techniques to achieve specific dilution targets for particular cocktail formulations';

MERGE (k_ice_types:Knowledge {name: 'Mixology Ice Selection and Properties'})
ON CREATE SET k_ice_types.description = 'Different types of ice used in cocktails including cubed ice, crushed ice, large format ice, and how ice shape, clarity, and purity affect cooling rate, dilution, and final drink quality',
              k_ice_types.how_to_learn = 'Taste cocktails made with different ice types side-by-side. Study how different ice types perform in shaking versus stirring. Learn about ice purity and clarity differences. Experiment with ice-making techniques or source different ice types. Expected time: 2-3 weeks.',
              k_ice_types.remember_level = 'Recall different ice types and their basic applications in cocktails',
              k_ice_types.understand_level = 'Explain how different ice types affect cooling, dilution, and the drinking experience',
              k_ice_types.apply_level = 'Select and use appropriate ice types for different cocktails and techniques',
              k_ice_types.analyze_level = 'Analyze how ice selection affects the overall quality and consistency of cocktails',
              k_ice_types.evaluate_level = 'Judge ice quality and appropriateness for specific cocktail applications',
              k_ice_types.create_level = 'Design ice strategies for new cocktails based on desired cooling and dilution characteristics';

MERGE (k_cocktail_families:Knowledge {name: 'Mixology Cocktail Family Structures'})
ON CREATE SET k_cocktail_families.description = 'The categorical organization of cocktails into families based on similar ingredients, techniques, or flavor profiles such as sours, daiquiris, margaritas, martinis, and how understanding family structures helps in creating variations',
              k_cocktail_families.how_to_learn = 'Study cocktail recipe books and guides that organize drinks by family. Taste multiple cocktails within families to understand the common characteristics. Learn the base recipes and proportions for major family types. Expected time: 3-4 weeks.',
              k_cocktail_families.remember_level = 'Recall the major cocktail families and their typical base recipes',
              k_cocktail_families.understand_level = 'Explain what defines each cocktail family and why variations fit within a family structure',
              k_cocktail_families.apply_level = 'Create variations within established cocktail families using the family structure as a framework',
              k_cocktail_families.analyze_level = 'Analyze how different spirits and ingredients fit within family structures and how to adapt recipes',
              k_cocktail_families.evaluate_level = 'Judge whether a new cocktail belongs within a family and whether it represents a good family variation',
              k_cocktail_families.create_level = 'Develop new cocktail families based on novel base formulas or ingredients';

MERGE (k_ingredient_selection:Knowledge {name: 'Mixology Ingredient Selection'})
ON CREATE SET k_ingredient_selection.description = 'The process of choosing quality ingredients for cocktails including spirits, liqueurs, juices, syrups, bitters, and understanding ingredient quality, sourcing, and freshness considerations',
              k_ingredient_selection.how_to_learn = 'Taste and compare ingredient quality from different sources. Build relationships with quality spirit and ingredient suppliers. Learn what to look for in quality ingredients (freshness dates, production methods, authenticity). Attend tastings focused on specific ingredients. Expected time: 5-6 weeks ongoing.',
              k_ingredient_selection.remember_level = 'Recall quality standards and characteristics of important cocktail ingredients',
              k_ingredient_selection.understand_level = 'Explain how ingredient quality affects final cocktail flavor and why ingredient selection matters',
              k_ingredient_selection.apply_level = 'Select quality ingredients for cocktails based on flavor profile and style objectives',
              k_ingredient_selection.analyze_level = 'Compare ingredient options and analyze how different quality levels affect cocktail results',
              k_ingredient_selection.evaluate_level = 'Judge ingredient quality and appropriateness for specific cocktail applications',
              k_ingredient_selection.create_level = 'Source specialty ingredients and incorporate them into original cocktail recipes';

// ADVANCED KNOWLEDGE - Advanced/Master Levels

MERGE (k_palate_development:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
ON CREATE SET k_palate_development.description = 'The systematic development of refined taste perception and sensory analysis skills, including identifying subtle flavor notes, off-flavors, and evaluating spirits and cocktails with professional standards',
              k_palate_development.how_to_learn = 'Conduct regular guided tastings with intentional focus on specific flavor notes. Use flavor wheels and tasting notes to develop vocabulary. Practice blind tastings to develop recognition skills. Study professional tasting methodologies. Taste widely across spirit categories. Expected time: 3-6 months ongoing practice.',
              k_palate_development.remember_level = 'Recall common flavor descriptors and categories used in spirits evaluation',
              k_palate_development.understand_level = 'Explain how palate training works and why sensory development is important for mixology craft',
              k_palate_development.apply_level = 'Conduct structured tastings and provide detailed sensory analysis of spirits and cocktails',
              k_palate_development.analyze_level = 'Analyze complex flavor profiles and identify how individual ingredients contribute to overall taste',
              k_palate_development.evaluate_level = 'Evaluate spirits and cocktails against professional standards and justify quality assessments',
              k_palate_development.create_level = 'Develop tasting frameworks and teach palate development to other bartenders';

MERGE (k_cocktail_history:Knowledge {name: 'Mixology Cocktail History and Evolution'})
ON CREATE SET k_cocktail_history.description = 'The historical development of cocktails including the origins of classic drinks, the evolution of bartending techniques, the influence of cultural and economic factors, and how cocktail culture has transformed over time',
              k_cocktail_history.how_to_learn = 'Read comprehensive cocktail history books like "And a Bottle of Rum" or "The Savoy Cocktail Book." Research the origins of specific classic cocktails. Study historical bartending manuals and techniques. Explore how cultural events influenced cocktail development. Expected time: 4-8 weeks.',
              k_cocktail_history.remember_level = 'Recall the historical origins and key milestones in cocktail and bartending history',
              k_cocktail_history.understand_level = 'Explain the historical context for classic cocktails and how societal changes influenced cocktail culture',
              k_cocktail_history.apply_level = 'Use historical knowledge to inform modern cocktail creation and understand why classic recipes work',
              k_cocktail_history.analyze_level = 'Analyze how historical cocktail development reflected cultural and economic conditions',
              k_cocktail_history.evaluate_level = 'Assess cocktails in their historical context and judge modern interpretations against classic versions',
              k_cocktail_history.create_level = 'Create cocktails inspired by historical periods or techniques and document the historical context';

MERGE (k_advanced_techniques:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
ON CREATE SET k_advanced_techniques.description = 'Sophisticated bartending techniques beyond basic shaking and stirring including layering, floating, dry shaking, reverse dry shaking, fat-washing, infusions, and molecular mixology methods',
              k_advanced_techniques.how_to_learn = 'Research advanced technique guides and modern mixology resources. Practice each technique repeatedly until execution is smooth. Watch demonstrations from advanced bartenders. Experiment with variations of techniques. Expected time: 4-6 weeks of focused practice.',
              k_advanced_techniques.remember_level = 'Recall the names and basic descriptions of advanced mixology techniques',
              k_advanced_techniques.understand_level = 'Explain when and why each advanced technique is appropriate and what effects it creates',
              k_advanced_techniques.apply_level = 'Execute advanced techniques with proper form to create intended effects in cocktails',
              k_advanced_techniques.analyze_level = 'Analyze which advanced techniques work best for different ingredient combinations and flavor objectives',
              k_advanced_techniques.evaluate_level = 'Judge whether an advanced technique has been executed properly and whether it enhances the cocktail',
              k_advanced_techniques.create_level = 'Invent new advanced techniques or adapt existing techniques for specific cocktail objectives';

MERGE (k_recipe_development:Knowledge {name: 'Mixology Recipe Development and Innovation'})
ON CREATE SET k_recipe_development.description = 'The systematic process of creating original cocktail recipes including conceptualization, experimentation, testing, refinement, and documenting recipes with consideration for balance, execution, and presentation',
              k_recipe_development.how_to_learn = 'Study published cocktail recipes and reverse-engineer why they work. Experiment with creating variations and new recipes using flavor theory frameworks. Seek feedback from other bartenders on your creations. Document your experimentation process and results. Expected time: Ongoing skill development over months.',
              k_recipe_development.remember_level = 'Recall frameworks and methods for approaching recipe development',
              k_recipe_development.understand_level = 'Explain the considerations and principles that guide successful recipe development',
              k_recipe_development.apply_level = 'Develop new original cocktail recipes using structured approaches and flavor theory',
              k_recipe_development.analyze_level = 'Analyze what makes successful recipes work and identify why some experimental recipes fail',
              k_recipe_development.evaluate_level = 'Assess your own recipes against quality standards and judge recipes from other bartenders',
              k_recipe_development.create_level = 'Create signature cocktails and unique recipes that reflect your bartending style and philosophy';

MERGE (k_batch_cocktails:Knowledge {name: 'Mixology Batch Cocktails and Scaling'})
ON CREATE SET k_batch_cocktails.description = 'The techniques for preparing larger quantities of pre-made cocktails for events or high-volume service, including scaling recipes, preparing batches ahead, and maintaining quality across multiple servings',
              k_batch_cocktails.how_to_learn = 'Research batch cocktail recipes and preparation methods. Practice scaling cocktail recipes to larger quantities. Experiment with batch preparation and storage. Study how batch preparation affects flavor stability over time. Expected time: 2-3 weeks.',
              k_batch_cocktails.remember_level = 'Recall the basic principles of batch cocktail preparation and scaling',
              k_batch_cocktails.understand_level = 'Explain how to scale recipes and what challenges arise in batch preparation',
              k_batch_cocktails.apply_level = 'Prepare batch cocktails that maintain quality and consistency across multiple servings',
              k_batch_cocktails.analyze_level = 'Analyze which cocktails work well as batches and how storage affects different cocktail types',
              k_batch_cocktails.evaluate_level = 'Judge batch cocktail quality and assess whether consistency is maintained over time',
              k_batch_cocktails.create_level = 'Develop batch cocktail formulations optimized for large-volume events';

MERGE (k_molecular_mixology:Knowledge {name: 'Mixology Molecular and Modernist Techniques'})
ON CREATE SET k_molecular_mixology.description = 'Contemporary experimental bartending techniques using scientific approaches including spherification, foams, gels, sublimation, and other modernist methods to create novel textures and presentations',
              k_molecular_mixology.how_to_learn = 'Research modern mixology resources and experimental bartending guides. Study molecular gastronomy principles applied to cocktails. Practice individual techniques with proper equipment and ingredients. Experiment with creating novel presentations. Expected time: 6-8 weeks.',
              k_molecular_mixology.remember_level = 'Recall modernist techniques and the basic science behind them',
              k_molecular_mixology.understand_level = 'Explain how molecular and modernist techniques create new sensory experiences',
              k_molecular_mixology.apply_level = 'Execute modernist techniques to create unique cocktail presentations and textures',
              k_molecular_mixology.analyze_level = 'Analyze which modernist techniques enhance the cocktail experience and which are purely novelty',
              k_molecular_mixology.evaluate_level = 'Judge whether modernist techniques improve the cocktail or distract from core flavors',
              k_molecular_mixology.create_level = 'Develop original modernist cocktail presentations and techniques';

// GENERALIZATIONS TO BROADER CONCEPTS

MERGE (k_flavor_balance:Knowledge {name: 'Flavor Balance'})
ON CREATE SET k_flavor_balance.description = 'The general principle of achieving harmonic taste equilibrium in mixed beverages through proportional relationships between different flavor components',
              k_flavor_balance.how_to_learn = 'Study flavor theory across multiple domains. Practice achieving balance in different types of recipes. Conduct comparative tastings of well-balanced versus unbalanced examples. Expected time: 4-6 weeks.',
              k_flavor_balance.remember_level = 'Recall the basic principle that flavors can be balanced against each other',
              k_flavor_balance.understand_level = 'Explain how different flavor categories interact and what balance means in flavor composition',
              k_flavor_balance.apply_level = 'Apply flavor balance principles to create harmonious flavor combinations',
              k_flavor_balance.analyze_level = 'Analyze flavor components in complex recipes and assess their balance',
              k_flavor_balance.evaluate_level = 'Evaluate whether flavor combinations are properly balanced',
              k_flavor_balance.create_level = 'Create balanced flavor combinations across different recipe types';

MERGE (k_mixing_technique:Knowledge {name: 'Mixing Technique'})
ON CREATE SET k_mixing_technique.description = 'The general art of combining ingredients through mechanical motion to achieve proper integration, temperature control, and texture in liquid preparations',
              k_mixing_technique.how_to_learn = 'Study mixing principles across different beverage and culinary contexts. Practice various mixing techniques. Observe how different mixing methods affect final results. Expected time: 3-4 weeks.',
              k_mixing_technique.remember_level = 'Recall that different mixing methods exist and serve different purposes',
              k_mixing_technique.understand_level = 'Explain how different mixing methods affect temperature, texture, and ingredient integration',
              k_mixing_technique.apply_level = 'Select and execute appropriate mixing techniques for different applications',
              k_mixing_technique.analyze_level = 'Analyze which mixing methods work best for different ingredient combinations',
              k_mixing_technique.evaluate_level = 'Judge whether a mixture has been properly executed',
              k_mixing_technique.create_level = 'Develop novel mixing approaches for specific objectives';

// LINK DOMAIN-SPECIFIC TO GENERAL KNOWLEDGE

MATCH (k_flavor_theory:Knowledge {name: 'Mixology Flavor Theory'})
MATCH (k_flavor_balance:Knowledge {name: 'Flavor Balance'})
CREATE (k_flavor_theory)-[:GENERALIZES_TO]->(k_flavor_balance);

MATCH (k_shaking:Knowledge {name: 'Mixology Shaking Technique'})
MATCH (k_mixing_technique:Knowledge {name: 'Mixing Technique'})
CREATE (k_shaking)-[:GENERALIZES_TO]->(k_mixing_technique);

MATCH (k_stirring:Knowledge {name: 'Mixology Stirring Technique'})
MATCH (k_mixing_technique:Knowledge {name: 'Mixing Technique'})
CREATE (k_stirring)-[:GENERALIZES_TO]->(k_mixing_technique);

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// BASIC SKILLS - Novice Level
// Entry-level abilities focused on fundamental techniques and procedures

MERGE (s_shaking:Skill {name: 'Mixology Shaking Technique'})
ON CREATE SET s_shaking.description = 'The fundamental ability to shake cocktails using proper form, timing, and technique to achieve proper mixing, chilling, and dilution. Essential foundation for cocktail preparation.',
              s_shaking.how_to_develop = 'Practice empty shaker movements daily for 2-3 weeks to develop muscle memory. Train with water to build consistency before using alcohol. Watch instructional videos from professional bartenders. Practice with a more experienced bartender who can provide feedback on form. Shake hundreds of test cocktails to refine technique.',
              s_shaking.novice_level = 'Can perform basic shaking motion but technique is inconsistent. Holds shaker awkwardly and shakes with uncertain rhythm. Produces cocktails with variable temperature and dilution. To progress: Focus exclusively on form and consistency. Shake dozens of drinks concentrating only on proper grip and smooth motion.',
              s_shaking.advanced_beginner_level = 'Shaking motion is becoming consistent with improved form. Rhythm is developing. Consistently produces properly chilled cocktails with acceptable dilution. Beginning to recognize when a shake is complete. To progress: Work on speed and developing a signature style. Practice with more complex ingredient combinations.',
              s_shaking.competent_level = 'Shaking is executed smoothly with consistent form and timing. Reliably produces well-chilled, properly diluted cocktails. Can judge when a shake is complete by sound and feel. Technique is efficient and repeatable. To progress: Develop nuanced timing adjustments for different drink styles and ingredient combinations.',
              s_shaking.proficient_level = 'Shaking is fluid and automatic. Adjusts technique intuitively based on ingredients without conscious thought. Produces consistently perfect results. Can adapt shaking style to different cocktail families. Technique has become part of professional identity. To progress: Refine micro-adjustments and develop signature style that sets you apart.',
              s_shaking.expert_level = 'Shaking is intuitive, efficient, and produces flawless results every time. Adjusts technique unconsciously based on ingredient density and type. Can teach and mentor others on proper technique. Signature shaking style is recognized and respected. Executes shaking with grace and precision in any context.';

MERGE (s_stirring:Skill {name: 'Mixology Stirring Technique'})
ON CREATE SET s_stirring.description = 'The ability to stir cocktails using a bar spoon in a mixing glass with proper form, dilution control, and timing. Essential for spirit-forward cocktails.',
              s_stirring.how_to_develop = 'Practice daily stirring motions with a bar spoon in mixing glass for 2-3 weeks. Develop smooth, controlled movements. Watch technique videos emphasizing proper form. Train with water and ice to develop feel for dilution. Practice with experienced bartenders. Stir hundreds of test cocktails to refine consistency.',
              s_stirring.novice_level = 'Stirring motions are awkward and inconsistent. Struggles to maintain smooth circular motion. Difficulty judging proper stirring duration. Results in over-diluted or under-diluted cocktails. To progress: Practice basic stirring motion daily. Focus on smooth, controlled movements. Learn to count stirring seconds.',
              s_stirring.advanced_beginner_level = 'Stirring motion is becoming smooth with improved technique. Can maintain consistent circular motion for appropriate duration. Beginning to recognize proper dilution by appearance and feel. Results are increasingly consistent. To progress: Work on developing sensitivity to dilution and timing for different drink styles.',
              s_stirring.competent_level = 'Stirring is smooth and controlled with consistent technique. Reliably achieves proper dilution and temperature. Can judge by appearance when cocktail is properly stirred. Executes efficiently without wasted motion. To progress: Develop nuanced adjustments for different spirit types and cocktail styles.',
              s_stirring.proficient_level = 'Stirring is fluid and automatic. Adjusts dilution timing intuitively based on ingredient type. Produces consistently cold, properly diluted results. Can vary stirring intensity subtly for different drinks. To progress: Develop signature stirring style and teach technique to others.',
              s_stirring.expert_level = 'Stirring is intuitive and produces flawless results. Adjusts technique automatically based on spirit composition and temperature. Can execute with grace and efficiency. Signature stirring style is recognized. Can teach and mentor other bartenders on proper technique.';

MERGE (s_basic_measurements:Skill {name: 'Mixology Accurate Measuring'})
ON CREATE SET s_basic_measurements.description = 'The ability to accurately measure and portion cocktail ingredients using jiggers and other measuring tools to ensure consistency and balance in drink recipes.',
              s_basic_measurements.how_to_develop = 'Use a jigger repeatedly with different liquids to develop intuition for quantities. Practice measuring both metric and imperial measurements. Measure thousands of cocktail pours until muscle memory develops. Use marking techniques on jiggers if available. Compare your pours against scale measurements to verify accuracy.',
              s_basic_measurements.novice_level = 'Measurement is inconsistent and often inaccurate. Frequently overpours or underpours ingredients. Struggling to use jiggers effectively. Produces cocktails with inconsistent proportions. To progress: Use jiggers for every pour without exception. Measure against a scale occasionally to verify accuracy. Count pours to build familiarity.',
              s_basic_measurements.advanced_beginner_level = 'Measurements are becoming more consistent with improved jigger technique. Rarely makes significant measurement errors. Understanding develops for how over/under-pouring affects flavor. To progress: Practice freepouring while still verifying accuracy with a jigger. Build confidence in your measurement consistency.',
              s_basic_measurements.competent_level = 'Consistently accurate measurements with reliable technique. Can measure quickly without compromising accuracy. Understands how precise measurements affect recipe balance. To progress: Develop freepouring skills while maintaining accuracy. Work with scales and precise measurements for special recipes.',
              s_basic_measurements.proficient_level = 'Measurements are reliably accurate with smooth, efficient technique. Can freepour with high accuracy from developed muscle memory. Quickly adapts to different jigger sizes and measurement systems. To progress: Help others develop measuring skills. Create custom recipes with precise measurement specifications.',
              s_basic_measurements.expert_level = 'Measuring is intuitive and produces flawless accuracy through deep muscle memory. Can freepour precisely in rapid service. Adjusts quantities intuitively based on modifications to drink specifications. Can teach and mentor others on accurate measurement technique. Accuracy is unconscious and consistent across varied contexts.';

MERGE (s_garnish_prep:Skill {name: 'Mixology Basic Garnish Preparation'})
ON CREATE SET s_garnish_prep.description = 'The ability to prepare and apply simple garnishes including citrus peels, twists, wheels, and herbs with proper technique and presentation.',
              s_garnish_prep.how_to_develop = 'Practice cutting citrus peels, twists, and wheels daily for 2-3 weeks. Study proper citrus preparation techniques. Learn to express oils from citrus peels. Practice herb preparation and placement. Watch garnish preparation videos. Prepare hundreds of garnishes to develop consistency. Get feedback from more experienced bartenders on presentation quality.',
              s_garnish_prep.novice_level = 'Garnish preparation is rough and inconsistent. Citrus cuts are uneven. Struggles with citrus peel expression technique. Garnish placement is awkward. To progress: Practice daily with focus on consistency. Perfect basic citrus cuts. Learn proper peel expression technique.',
              s_garnish_prep.advanced_beginner_level = 'Garnish preparation is improving with better consistency. Citrus cuts are more uniform. Beginning to execute proper peel expression. Garnish placement is neater. To progress: Refine cutting technique for visual uniformity. Practice with fresh herbs. Work on creative presentation.',
              s_garnish_prep.competent_level = 'Garnishes are prepared consistently with neat appearance. Citrus cuts are uniform and well-executed. Peel expression is reliable. Garnish placement enhances drink presentation. To progress: Develop signature garnish styles. Learn more complex garnish preparations. Create innovative garnish pairings.',
              s_garnish_prep.proficient_level = 'Garnish preparation is smooth and efficient. Produces beautifully presented garnishes with practiced ease. Peel expression is reliable and flawless. Garnish selection enhances both aroma and visual appeal. To progress: Develop specialty garnish techniques. Mentor others on garnish preparation.',
              s_garnish_prep.expert_level = 'Garnish preparation is intuitive and produces flawless presentation. Citrus work is artistic and precise. Peel expression releases aromatics perfectly. Garnish selection elevates the overall cocktail experience. Creates signature garnish presentations that become recognizable as your style.';

MERGE (s_classic_recipes:Skill {name: 'Mixology Classic Recipe Execution'})
ON CREATE SET s_classic_recipes.description = 'The ability to accurately prepare classic cocktails with proper proportions, techniques, and presentation from memory and execute them consistently.',
              s_classic_recipes.how_to_develop = 'Memorize recipes for 15-20 classic cocktails using flashcards and repeated preparation. Practice making each classic drink multiple times until execution becomes automatic. Study classic cocktail references and learn why recipes are formulated as they are. Make each drink daily until you can prepare it without consulting notes. Get feedback from more experienced bartenders on execution quality.',
              s_classic_recipes.novice_level = 'Can make classic cocktails but requires frequent reference to recipes. Execution is slow and deliberate. Often makes mistakes in proportions or technique. Drinks are often below quality standards. To progress: Memorize 5-10 classic recipes completely. Practice each daily. Master proper proportions and execution for each.',
              s_classic_recipes.advanced_beginner_level = 'Can execute 10-15 classics without consulting recipes. Execution is becoming faster and more confident. Proportions are mostly correct. Beginning to understand why classic recipes work. To progress: Expand repertoire to 20-25 classics. Refine execution to consistently proper quality. Study variations of classics.',
              s_classic_recipes.competent_level = 'Can execute 20+ classics with confidence and proper proportions. Execution is efficient and reliable. Produces consistently high-quality classic cocktails. Understands the structure and principles of classic recipes. To progress: Deepen knowledge of classic variations. Develop ability to explain classics to customers. Begin experimenting with thoughtful modifications.',
              s_classic_recipes.proficient_level = 'Executes all major classics flawlessly from deep memory. Execution is quick and smooth. Produces perfectly balanced classic cocktails consistently. Can explain the history and rationale for each classic. Adjusts execution subtly for ingredient variations. To progress: Master obscure classics. Develop signature interpretations of classics.',
              s_classic_recipes.expert_level = 'Classic cocktail execution is intuitive and produces flawless results every time. Can execute 50+ classics without hesitation. Understands the deep principles that make classics work. Can teach others about classics and explain their place in cocktail history. Creates respectful modern interpretations of classics.';

// INTERMEDIATE SKILLS - Developing/Competent Levels
// More complex techniques and abilities requiring strategic execution

MERGE (s_flavor_balancing:Skill {name: 'Mixology Flavor Balancing'})
ON CREATE SET s_flavor_balancing.description = 'The ability to evaluate and adjust flavors in cocktails to achieve harmonic balance between sweet, sour, bitter, and strong elements, and create cohesive flavor profiles.',
              s_flavor_balancing.how_to_develop = 'Study flavor wheels and taste theory extensively. Conduct guided tastings of balanced versus unbalanced cocktails. Practice identifying unbalanced elements in your own cocktails and adjusting them. Experiment with ingredient substitutions to understand flavor interactions. Request feedback from experienced bartenders on your flavor assessments. Taste continuously to develop palate sensitivity.',
              s_flavor_balancing.novice_level = 'Struggles to identify when flavors are imbalanced. Often creates drinks that are too sweet or too sour. Difficulty adjusting recipes. Limited understanding of how ingredients interact. To progress: Study basic flavor theory. Taste many well-balanced cocktails side-by-side with imbalanced examples. Practice identifying imbalances.',
              s_flavor_balancing.advanced_beginner_level = 'Beginning to recognize when major flavor elements are imbalanced. Can identify if a drink is too sweet or too sour. Recognizes common balance problems like citrus-forward or spirit-dominated drinks. To progress: Develop sensitivity to subtle imbalances. Learn how to adjust recipes systematically. Study balanced classic cocktails.',
              s_flavor_balancing.competent_level = 'Can identify and adjust most flavor imbalances deliberately. Consistently creates balanced cocktails. Understands the interaction of key flavor elements. Can modify recipes to achieve better balance. To progress: Develop sensitivity to more subtle imbalances. Learn to balance more complex flavor combinations.',
              s_flavor_balancing.proficient_level = 'Quickly identifies imbalances and adjusts intuitively. Creates naturally balanced cocktails without conscious deliberation. Sees flavor balance holistically. Adapts ingredient selections to achieve balance. To progress: Mentor others on flavor development. Explore advanced flavor balancing techniques.',
              s_flavor_balancing.expert_level = 'Evaluates and creates perfectly balanced flavor profiles instinctively. Perceives subtle flavor interactions others miss. Can balance complex flavor combinations fluidly. Creates signature balanced profiles that define your style. Can teach others to develop flavor sensitivity.';

MERGE (s_spirit_knowledge:Skill {name: 'Mixology Spirit Knowledge and Selection'})
ON CREATE SET s_spirit_knowledge.description = 'The ability to understand spirit characteristics, categorize spirits by type, and select appropriate spirits for specific cocktails and flavor objectives.',
              s_spirit_knowledge.how_to_develop = 'Study comprehensive spirits guides and tasting resources. Conduct regular comparative tastings within spirit categories. Visit distilleries and learn production methods. Taste spirits at different prices to understand quality variations. Develop detailed tasting notes on spirits you encounter. Build relationships with spirits representatives and retailers. Taste continuously across all spirit categories.',
              s_spirit_knowledge.novice_level = 'Limited knowledge of spirit types and characteristics. Can identify major spirit categories but struggles with variations within categories. Difficulty selecting spirits for specific applications. To progress: Study spirit families systematically. Taste multiple examples within each category. Learn production method basics.',
              s_spirit_knowledge.advanced_beginner_level = 'Understands major spirit families and their basic characteristics. Can identify how production affects flavor. Recognizes quality differences between price points. Beginning to select appropriate spirits for cocktails. To progress: Deepen knowledge within individual categories. Learn about lesser-known spirits. Conduct comparative tastings.',
              s_spirit_knowledge.competent_level = 'Has solid knowledge of spirit families and characteristics. Can select spirits appropriate for specific flavor profiles. Understands quality indicators and price-to-quality ratios. Can make substitution recommendations. To progress: Develop deep expertise in specific spirit categories. Learn about emerging spirits and producers.',
              s_spirit_knowledge.proficient_level = 'Deep knowledge of spirit characteristics, production methods, and flavor profiles. Quickly identifies spirits and their qualities. Makes intuitive spirit selections for desired flavor outcomes. Understands regional variations and production nuances. To progress: Master obscure spirit categories. Develop specialized knowledge in specific spirits.',
              s_spirit_knowledge.expert_level = 'Comprehensive mastery of all spirit types, production methods, and flavor profiles. Instantly assesses spirit quality and characteristics. Makes intuitive selections that elevate cocktails. Understands the deep story and context of spirits. Can teach and mentor others on spirit selection and appreciation.';

MERGE (s_technique_selection:Skill {name: 'Mixology Technique Selection and Adaptation'})
ON CREATE SET s_technique_selection.description = 'The ability to select appropriate mixing techniques (shaking, stirring, etc.) for different cocktails and adapt techniques based on specific ingredients and desired outcomes.',
              s_technique_selection.how_to_develop = 'Study classic cocktail references to understand technique selection patterns. Experiment with making the same cocktail with different techniques to compare results. Practice both shaking and stirring variations of cocktails. Study the rationale for technique choices in professional bartending resources. Request feedback from experienced bartenders on your technique selections. Develop intuition through hundreds of cocktail preparations.',
              s_technique_selection.novice_level = 'Often unsure which technique to use for a cocktail. Makes wrong technique choices. Doesn\'t understand why certain cocktails use specific techniques. To progress: Study basic rules for technique selection. Master the difference between shaken and stirred cocktails. Learn the rationale for technique choices.',
              s_technique_selection.advanced_beginner_level = 'Correctly selects techniques for classic cocktails. Beginning to understand why certain techniques are appropriate. Can follow standard patterns but struggles with variations. To progress: Develop deeper understanding of technique effects. Practice technique selection for non-standard drinks. Experiment with technique modifications.',
              s_technique_selection.competent_level = 'Correctly selects techniques for most cocktails based on ingredients and desired outcomes. Understands how techniques affect the final drink. Can modify techniques for special circumstances. To progress: Develop sensitivity to subtle technique effects. Learn advanced technique selection strategies.',
              s_technique_selection.proficient_level = 'Intuitively selects optimal techniques for any cocktail. Understands how technique choices affect flavor, texture, and presentation. Makes conscious adjustments based on specific ingredients. To progress: Mentor others on technique selection. Develop signature technique adaptations.',
              s_technique_selection.expert_level = 'Makes perfect technique selections instinctively based on ingredients, desired outcomes, and execution context. Can explain the reasoning behind technique choices clearly. Creates novel technique adaptations that enhance cocktails. Technique selection becomes invisible to customer but contributes meaningfully to quality.';

MERGE (s_ice_understanding:Skill {name: 'Mixology Ice Selection and Management'})
ON CREATE SET s_ice_understanding.description = 'The ability to select appropriate ice types for different cocktails and manage ice quality to ensure optimal cooling and dilution characteristics.',
              s_ice_understanding.how_to_develop = 'Taste cocktails side-by-side made with different ice types. Study how ice affects cooling rates and dilution. Experiment with sourcing different ice types or making custom ice. Learn about ice purity and clarity differences. Understand how ice temperature affects cocktails. Conduct comparative tests of ice performance. Build relationships with quality ice suppliers.',
              s_ice_understanding.novice_level = 'Uses whatever ice is available without consideration. Doesn\'t understand how ice type affects cocktails. Results in inconsistent drink quality due to ice variation. To progress: Learn basic ice types and applications. Taste differences between ice types. Begin selecting ice intentionally.',
              s_ice_understanding.advanced_beginner_level = 'Recognizes different ice types and their applications. Beginning to select ice based on cocktail type. Understands how ice size affects cooling and dilution. To progress: Develop deeper understanding of ice effects. Experiment with specialty ice types. Learn about ice purity importance.',
              s_ice_understanding.competent_level = 'Consistently selects appropriate ice for different cocktails. Understands how ice affects dilution and cooling rates. Can source quality ice. Makes adjustments for ice temperature variations. To progress: Develop advanced ice management techniques. Source specialty ice types. Experiment with custom ice formats.',
              s_ice_understanding.proficient_level = 'Makes intuitive ice selections that optimize each cocktail. Manages ice quality systematically. Understands subtle effects of ice on different drinks. Sources quality ice and maintains optimal ice conditions. To progress: Master advanced ice techniques. Mentor others on ice importance.',
              s_ice_understanding.expert_level = 'Makes perfect ice selections that become invisible to the customer but meaningfully affect quality. Manages ice temperature, size, and type fluidly. Understands deep effects of ice on all drink aspects. Can teach others about ice importance and selection strategies.';

MERGE (s_cocktail_understanding:Skill {name: 'Mixology Cocktail Family Understanding'})
ON CREATE SET s_cocktail_understanding.description = 'The ability to understand how cocktails are organized into families (sours, daiquiris, margaritas, martinis) and use family structures to create variations and new cocktails.',
              s_cocktail_understanding.how_to_develop = 'Study cocktail recipe books organized by family. Taste multiple cocktails within each family to understand shared characteristics. Learn base recipes for each major family type. Identify the proportions and structures that define each family. Create variations within families using family structure as guidance. Reverse-engineer cocktails to understand their family classification.',
              s_cocktail_understanding.novice_level = 'Limited understanding of cocktail family structures. Can name a few families but doesn\'t understand the principles. To progress: Study major cocktail families systematically. Taste multiple cocktails within each family. Learn family base recipes.',
              s_cocktail_understanding.advanced_beginner_level = 'Recognizes major cocktail families and understands their basic structures. Can identify what defines each family. Beginning to understand family proportions and characteristics. To progress: Deepen knowledge of each family type. Learn about lesser-known families. Practice creating family variations.',
              s_cocktail_understanding.competent_level = 'Solid understanding of major cocktail families and their characteristics. Can create variations within families using family structure. Understands the proportions and techniques that define each family. To progress: Develop expertise in less common families. Learn about family evolution over time.',
              s_cocktail_understanding.proficient_level = 'Deep understanding of all major and many obscure cocktail families. Quickly identifies cocktail family structures. Creates smooth variations that respect family characteristics. To progress: Master the deepest family structures and variations. Mentor others on family understanding.',
              s_cocktail_understanding.expert_level = 'Comprehensive mastery of cocktail family structures and principles. Can instantly identify family classifications and understand the underlying principles. Creates brilliant variations that advance family traditions. Can teach others about cocktail family structures and creation strategies.';

MERGE (s_tasting_evaluation:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
ON CREATE SET s_tasting_evaluation.description = 'The ability to taste cocktails systematically and provide detailed sensory analysis of flavor components, balance, and quality characteristics.',
              s_tasting_evaluation.how_to_develop = 'Conduct regular guided tastings with intentional focus on specific flavor components. Develop tasting vocabulary using flavor wheels and references. Practice blind tastings to develop recognition without prejudice. Study professional tasting methodologies. Taste widely across cocktail styles. Keep detailed tasting notes. Get feedback from more experienced tasters on your evaluations.',
              s_tasting_evaluation.novice_level = 'Tastes cocktails casually without systematic evaluation. Limited vocabulary for describing flavors. Difficulty identifying specific flavor components. To progress: Study basic tasting methodology. Taste side-by-side examples systematically. Develop flavor vocabulary.',
              s_tasting_evaluation.advanced_beginner_level = 'Beginning to taste systematically. Can identify major flavor components. Developing tasting vocabulary. Starting to provide coherent tasting notes. To progress: Expand vocabulary for flavor description. Practice blind tastings. Conduct comparative tastings.',
              s_tasting_evaluation.competent_level = 'Tastes systematically and provides detailed flavor analysis. Can identify most flavor components accurately. Uses appropriate terminology for evaluation. Provides constructive feedback on cocktails. To progress: Refine tasting sensitivity. Develop deeper vocabulary for subtle flavors.',
              s_tasting_evaluation.proficient_level = 'Tastes with sophistication and provides insightful analysis. Quickly identifies complex flavor interactions. Distinguishes subtle flavor nuances. Recognizes how ingredients contribute to overall profile. To progress: Mentor others on tasting methodology. Develop expertise in evaluating advanced cocktails.',
              s_tasting_evaluation.expert_level = 'Evaluates cocktails with deep sensory sophistication. Identifies subtle flavor nuances and interactions others miss. Provides articulate, detailed analysis. Can teach and mentor others on sensory evaluation. Evaluations become authoritative and highly respected.';

// ADVANCED SKILLS - Advanced/Master Levels
// Mastery-level techniques and higher-order abilities

MERGE (s_recipe_creation:Skill {name: 'Mixology Original Recipe Creation'})
ON CREATE SET s_recipe_creation.description = 'The ability to conceptualize and create balanced, executed original cocktail recipes that reflect personal style and creative vision while maintaining technical quality.',
              s_recipe_creation.how_to_develop = 'Study successful cocktail recipes and reverse-engineer why they work. Experiment with creating original recipes using flavor theory frameworks. Seek detailed feedback from other experienced bartenders on your creations. Document your experimentation process and results. Study failed recipes to understand what doesn\'t work. Create dozens of original recipes before hitting on your signature style.',
              s_recipe_creation.novice_level = 'Attempts original recipes but results are often unbalanced or poorly executed. Doesn\'t understand design principles. Recipes lack coherence or clarity. To progress: Study successful original recipes. Practice creating recipes using flavor theory. Get feedback on your creations.',
              s_recipe_creation.advanced_beginner_level = 'Creating recipes with improving balance and execution. Beginning to understand design principles. Some recipes are successful while others fail. To progress: Study what makes successful recipes work. Experiment systematically with flavor combinations. Develop a personal creative approach.',
              s_recipe_creation.competent_level = 'Can create balanced, well-executed original recipes. Recipes reflect intentional design choices. Most recipes work as intended. Developing personal creative voice. To progress: Refine your creative approach. Create more sophisticated recipes. Develop signature style.',
              s_recipe_creation.proficient_level = 'Creates compelling original recipes with ease. Recipes are thoughtfully designed and flawlessly executed. Personal style is evident and distinctive. Can create recipes in multiple styles. To progress: Develop mastery of advanced recipe creation. Mentor others on recipe development.',
              s_recipe_creation.expert_level = 'Creates brilliant original cocktails that become recognized as signatures. Recipes are innovative yet balanced. Personal style is distinctive and respected. Can create in any style or context. Creates recipes that influence others and advance the craft.';

MERGE (s_advanced_techniques:Skill {name: 'Mixology Advanced Mixing Techniques'})
ON CREATE SET s_advanced_techniques.description = 'The ability to execute sophisticated mixing techniques including layering, floating, dry shaking, fat-washing, infusions, and molecular methods to create novel effects and presentations.',
              s_advanced_techniques.how_to_develop = 'Research advanced technique guides and modern mixology resources. Practice each technique repeatedly until execution becomes flawless. Watch demonstrations from advanced bartenders and study their execution carefully. Experiment with technique variations and applications. Practice integrating advanced techniques into full cocktail service. Build the specialized equipment needed for various techniques.',
              s_advanced_techniques.novice_level = 'Aware of advanced techniques but lacks execution ability. Attempts are clumsy and often fail. Equipment handling is uncertain. To progress: Study each technique systematically. Practice basic execution repeatedly. Acquire proper equipment.',
              s_advanced_techniques.advanced_beginner_level = 'Can execute some advanced techniques with variable success. Technique execution is improving but inconsistent. Beginning to understand technique applications. To progress: Focus on mastering 2-3 techniques thoroughly. Practice difficult techniques repeatedly. Study successful applications.',
              s_advanced_techniques.competent_level = 'Can execute multiple advanced techniques with reasonable success. Understands appropriate applications for each technique. Execution is mostly reliable. To progress: Develop mastery of 5+ advanced techniques. Refine execution to perfection. Develop signature technique combinations.',
              s_advanced_techniques.proficient_level = 'Executes advanced techniques flawlessly and creatively. Selects techniques strategically to enhance cocktails. Technique execution is quick and elegant. Creates novel applications for established techniques. To progress: Master additional advanced techniques. Mentor others on technique execution.',
              s_advanced_techniques.expert_level = 'Advanced technique execution is flawless and artful. Creates novel techniques and applications. Techniques become invisible to customer while meaningfully enhancing the cocktail. Can teach and mentor others on advanced technique mastery. Techniques define your professional identity.';

MERGE (s_palate_mastery:Skill {name: 'Mixology Refined Palate Development'})
ON CREATE SET s_palate_mastery.description = 'The mastery of refined taste perception and sensory analysis, enabling the identification of subtle flavor nuances, off-flavors, and evaluation of spirits and cocktails against professional standards.',
              s_palate_mastery.how_to_develop = 'Conduct hundreds of guided tastings over months and years. Taste continuously across all spirit categories. Develop extensive tasting vocabulary. Practice blind tastings regularly. Study professional tasting standards. Get feedback from palate experts. Document tasting experiences in detail. Build memory of subtle flavor profiles across contexts.',
              s_palate_mastery.novice_level = 'Palate development is beginning. Can taste basic flavor components. Vocabulary is limited. To progress: Taste continuously and systematically. Build tasting vocabulary. Conduct regular comparative tastings.',
              s_palate_mastery.advanced_beginner_level = 'Developing sensory sensitivity. Can identify most common flavor components. Vocabulary is expanding. To progress: Taste widely and deeply. Refine sensitivity to subtle flavors. Build on tasting experience.',
              s_palate_mastery.competent_level = 'Has developed refined sensory perception. Can identify most flavor components including subtle ones. Has developed strong tasting vocabulary. Makes sound evaluations. To progress: Continue building tasting experience. Develop deeper expertise in specific flavor categories.',
              s_palate_mastery.proficient_level = 'Palate is refined and sensitive. Identifies subtle flavor nuances and off-flavors others miss. Uses sophisticated tasting vocabulary. Makes authoritative evaluations. To progress: Continue deep tasting work. Mentor others on palate development.',
              s_palate_mastery.expert_level = 'Has achieved mastery of refined palate development. Sensory perception is acute and sophisticated. Can identify the most subtle flavor nuances and interactions. Tasting evaluations are authoritative and highly respected. Can teach and mentor other bartenders on palate mastery. Your evaluations become industry standard.';

MERGE (s_bar_management:Skill {name: 'Mixology Service Management and Flow'})
ON CREATE SET s_bar_management.description = 'The ability to manage cocktail service efficiently during busy periods, prioritizing orders, maintaining quality across multiple drinks, and providing excellent customer experience under pressure.',
              s_bar_management.how_to_develop = 'Work high-volume service shifts and learn through experience. Study bar management and service flow best practices. Observe experienced bartenders managing busy service. Practice organizing your workspace for efficiency. Develop systems for managing multiple orders simultaneously. Get feedback from managers on your service management. Practice maintaining quality while managing volume.',
              s_bar_management.novice_level = 'Struggles during busy service. Often forgets orders. Quality drops significantly when busy. Slower than necessary. To progress: Develop organizational systems. Practice managing 2-3 simultaneous orders. Focus on efficiency while maintaining quality.',
              s_bar_management.advanced_beginner_level = 'Beginning to manage moderate service volume. Can handle 3-5 orders simultaneously with some struggle. Quality varies with volume. To progress: Develop faster techniques and better organization. Practice high-volume service. Improve efficiency.',
              s_bar_management.competent_level = 'Manages service volume confidently. Handles 5-10 orders efficiently. Maintains quality even when busy. Organizes workflow logically. To progress: Develop faster techniques. Practice even higher volumes. Mentor others on service efficiency.',
              s_bar_management.proficient_level = 'Manages high-volume service fluidly. Handles 10+ simultaneous orders effortlessly. Maintains consistent quality during rush. Workflow is efficient and elegant. Can adapt to varying service demands. To progress: Mentor others on service management. Develop advanced service techniques.',
              s_bar_management.expert_level = 'Manages complex, high-volume service with apparent ease. Quality never suffers regardless of volume or pressure. Workflow is optimized and elegant. Can maintain composed, excellent customer interactions even under extreme pressure. Becomes known for ability to deliver quality during rush service.';

MERGE (s_customer_interaction:Skill {name: 'Mixology Customer Engagement and Education'})
ON CREATE SET s_customer_interaction.description = 'The ability to engage customers in cocktail conversations, explain drink choices, educate on flavors and ingredients, and create memorable experiences through knowledgeable, personable service.',
              s_customer_interaction.how_to_develop = 'Practice listening to customers and learning about their preferences. Develop clear explanations of cocktail characteristics and ingredients. Study spirit history and cocktail stories to share. Practice making flavor recommendations. Get feedback on your customer interactions. Build comfort with talking about cocktails and your craft. Create positive interactions with every customer.',
              s_customer_interaction.novice_level = 'Minimal customer interaction. Struggles to explain cocktails. Conversations are uncomfortable. To progress: Practice basic customer listening. Develop simple explanations. Learn cocktail basics to share.',
              s_customer_interaction.advanced_beginner_level = 'Beginning to engage customers. Can explain basic cocktail concepts. Starting to feel comfortable with customer conversations. To progress: Develop deeper flavor knowledge to share. Practice creating engaging conversations. Build confidence in customer interactions.',
              s_customer_interaction.competent_level = 'Engages customers comfortably. Can explain cocktails clearly and make recommendations. Provides educational information about spirits and flavors. Creates positive interactions. To progress: Develop deeper knowledge to share. Refine your ability to read customer preferences.',
              s_customer_interaction.proficient_level = 'Engages customers with enthusiasm and knowledge. Makes personalized recommendations based on preferences. Educates customers about cocktail craft and ingredients. Creates memorable interactions. Customers feel understood and educated. To progress: Mentor others on customer engagement. Develop advanced interaction skills.',
              s_customer_interaction.expert_level = 'Customer interactions are engaging, educational, and memorable. Can read customers accurately and make perfect recommendations. Explains cocktail craft with authority and passion. Creates emotional connections to drinks through stories and knowledge. Customers remember their experience and seek you out specifically.';

MERGE (s_mentoring:Skill {name: 'Mixology Mentoring and Teaching'})
ON CREATE SET s_mentoring.description = 'The ability to teach and mentor other bartenders on techniques, theory, and craft, accelerating their development and advancing the broader mixology community.',
              s_mentoring.how_to_develop = 'Work with other bartenders as they develop skills. Learn teaching and communication skills. Study how to break down complex techniques into learnable steps. Practice providing constructive feedback. Develop patience with bartenders at all levels. Create structured training approaches. Build a track record of successfully developing other bartenders.',
              s_mentoring.novice_level = 'Limited teaching ability. Struggles to explain techniques clearly. Patience is limited. To progress: Practice teaching one skill thoroughly. Develop clearer explanations. Build patience with learners.',
              s_mentoring.advanced_beginner_level = 'Beginning to teach others. Can explain basic concepts adequately. More patient with learners. Developing mentoring approach. To progress: Mentor multiple bartenders. Refine your teaching approach. Develop deeper teaching methodologies.',
              s_mentoring.competent_level = 'Teaches other bartenders effectively. Breaks down complex techniques into learnable steps. Provides constructive feedback. Accelerates bartender development. To progress: Mentor more advanced bartenders. Develop your teaching philosophy. Build systematic training approaches.',
              s_mentoring.proficient_level = 'Mentors other bartenders with skill and dedication. Your mentees develop rapidly and profitably. Teaching approach is systematic and proven. You\'ve developed multiple skilled bartenders. To progress: Mentor advanced bartenders. Develop broader training programs.',
              s_mentoring.expert_level = 'Mentoring is highly effective and deeply appreciated. Your mentees become skilled bartenders who credit you for their development. Teaching approach is refined and proven. You\'ve built a reputation as an exceptional mentor. Can develop bartenders across all skill levels rapidly and effectively.';

// EXPERT/MASTER SKILLS

MERGE (s_innovation:Skill {name: 'Mixology Innovation and Advancement'})
ON CREATE SET s_innovation.description = 'The mastery-level ability to innovate new techniques, flavor combinations, and approaches that advance the craft of mixology and influence the broader bartending community.',
              s_innovation.how_to_develop = 'Experiment constantly with ingredients, techniques, and flavor combinations. Stay current with modern mixology trends and innovations. Study cocktail evolution and history to understand advancement patterns. Create dozens of experimental cocktails. Document and refine your innovations. Seek feedback from other advanced bartenders. Contribute your innovations to the broader mixology community.',
              s_innovation.novice_level = 'Beginning experimentation. Most innovations don\'t work. To progress: Experiment more systematically. Study successful innovations. Build on small successes.',
              s_innovation.advanced_beginner_level = 'Experimenting more successfully. Some innovations are interesting but not game-changing. Developing innovative thinking. To progress: Push creative boundaries. Learn from failed experiments. Refine your innovative approach.',
              s_innovation.competent_level = 'Can create interesting innovations and novel approaches. Some innovations have real merit. Beginning to influence local bartending culture. To progress: Develop more distinctive innovations. Build reputation for innovation. Create innovations that influence others.',
              s_innovation.proficient_level = 'Creates meaningful innovations regularly. Your innovations are adopted by other bartenders. You\'re recognized as an innovative voice in your community. To progress: Create innovations of broader significance. Contribute to the larger bartending community.',
              s_innovation.expert_level = 'Your innovations meaningfully advance the craft of mixology. You\'re recognized as an innovator and influencer. Your techniques and approaches are adopted widely. You shape the direction of modern mixology. Your contributions are significant and lasting.';

MERGE (s_craft_mastery:Skill {name: 'Mixology Craft Mastery'})
ON CREATE SET s_craft_mastery.description = 'The highest level of integrated mastery across all aspects of mixology craft, combining technical skill, creative vision, depth of knowledge, and the ability to operate at the highest levels with grace and authority.',
              s_craft_mastery.how_to_develop = 'Spend years developing all aspects of mixology craft to mastery level. Integrate technical, creative, and knowledge skills into unified practice. Build deep industry experience and relationships. Develop distinctive personal style. Continuously push your own boundaries and refine your craft. Become recognized as a master craftsperson.',
              s_craft_mastery.novice_level = 'Beginning craft development. Much to learn across all areas. To progress: Focus on comprehensive skill development across all craft areas.',
              s_craft_mastery.advanced_beginner_level = 'Developing broader craft skills. Becoming more capable across areas. To progress: Continue developing technical and creative skills. Build broader knowledge.',
              s_craft_mastery.competent_level = 'Competent across most craft areas. Can execute cocktails at good quality. Developing broader capabilities. To progress: Develop deeper mastery in each area. Integrate skills into unified practice.',
              s_craft_mastery.proficient_level = 'Proficient across all major craft areas. Can execute complex cocktails beautifully. Developing integrated practice and personal style. Recognized as a skilled bartender. To progress: Pursue mastery in each area. Develop deeper personal craft philosophy.',
              s_craft_mastery.expert_level = 'Mixology craft mastery is complete and evident. You operate at the highest levels with grace, authority, and creativity. Technical skill, knowledge depth, creative vision, and personal style are seamlessly integrated. You\'re recognized as a true master craftsperson. Your cocktails are works of art that delight and educate. Your influence on the craft is significant and lasting.';

// GENERALIZATIONS TO BROADER SKILL CONCEPTS

MERGE (s_precision_technique:Skill {name: 'Precision Technique Execution'})
ON CREATE SET s_precision_technique.description = 'The general ability to execute technical procedures with high accuracy, consistency, and refinement across different domains and contexts',
              s_precision_technique.how_to_develop = 'Practice technical execution repeatedly until movements become automatic and consistent. Study proper form and technique carefully. Get feedback on execution quality. Build muscle memory through repetition. Develop sensitivity to subtle execution differences. Practice in various contexts to build adaptability.',
              s_precision_technique.novice_level = 'Technique execution is rough and inconsistent. To progress: Practice basic execution repeatedly.',
              s_precision_technique.advanced_beginner_level = 'Technique is improving with better consistency. To progress: Refine execution for greater precision.',
              s_precision_technique.competent_level = 'Technique is executed with good consistency and accuracy. To progress: Develop greater refinement and speed.',
              s_precision_technique.proficient_level = 'Technique is fluid, consistent, and reliable. To progress: Develop signature style variations.',
              s_precision_technique.expert_level = 'Technique execution is intuitive, flawless, and elegant across all contexts.';

MERGE (s_flavor_mastery:Skill {name: 'Flavor Mastery'})
ON CREATE SET s_flavor_mastery.description = 'The general mastery of understanding, evaluating, and creating balanced flavor combinations across different culinary and beverage contexts',
              s_flavor_mastery.how_to_develop = 'Study flavor theory extensively. Conduct regular tastings and flavor evaluations. Experiment with creating balanced flavor combinations. Build sophisticated palate sensitivity. Develop extensive flavor vocabulary. Apply flavor principles across different recipe types.',
              s_flavor_mastery.novice_level = 'Limited flavor understanding. To progress: Study basic flavor theory.',
              s_flavor_mastery.advanced_beginner_level = 'Beginning flavor understanding. To progress: Develop palate sensitivity.',
              s_flavor_mastery.competent_level = 'Can create generally balanced flavors. To progress: Develop more sophisticated flavor work.',
              s_flavor_mastery.proficient_level = 'Creates well-balanced flavor profiles consistently. To progress: Pursue mastery of flavor complexity.',
              s_flavor_mastery.expert_level = 'Flavor mastery is evident. Creates perfectly balanced and complex flavor profiles intuitively.';

// GENERALIZATIONS LINKING DOMAIN-SPECIFIC TO GENERAL SKILLS

MATCH (s_shaking:Skill {name: 'Mixology Shaking Technique'})
MATCH (s_precision_technique:Skill {name: 'Precision Technique Execution'})
CREATE (s_shaking)-[:GENERALIZES_TO]->(s_precision_technique);

MATCH (s_stirring:Skill {name: 'Mixology Stirring Technique'})
MATCH (s_precision_technique:Skill {name: 'Precision Technique Execution'})
CREATE (s_stirring)-[:GENERALIZES_TO]->(s_precision_technique);

MATCH (s_basic_measurements:Skill {name: 'Mixology Accurate Measuring'})
MATCH (s_precision_technique:Skill {name: 'Precision Technique Execution'})
CREATE (s_basic_measurements)-[:GENERALIZES_TO]->(s_precision_technique);

MATCH (s_flavor_balancing:Skill {name: 'Mixology Flavor Balancing'})
MATCH (s_flavor_mastery:Skill {name: 'Flavor Mastery'})
CREATE (s_flavor_balancing)-[:GENERALIZES_TO]->(s_flavor_mastery);

MATCH (s_tasting_evaluation:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
MATCH (s_flavor_mastery:Skill {name: 'Flavor Mastery'})
CREATE (s_tasting_evaluation)-[:GENERALIZES_TO]->(s_flavor_mastery);

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// SENSORY/COGNITIVE TRAITS

MERGE (t_palate_sensitivity:Trait {name: 'Palate Sensitivity'})
ON CREATE SET t_palate_sensitivity.description = 'The natural ability to perceive and distinguish subtle flavor nuances, tastes, and sensory details in beverages and foods. A foundational trait for developing refined taste perception and performing professional sensory evaluation of spirits and cocktails.',
              t_palate_sensitivity.measurement_criteria = 'Assessed through ability to identify subtle flavor components, distinguish between similar flavors, and perceive off-flavors or imbalances. Low (0-25): Struggles to identify individual flavors in mixed drinks, perceives only obvious tastes. Moderate (26-50): Can identify major flavor components and basic flavor profiles. High (51-75): Readily identifies subtle flavor nuances, perceives complex interactions, recognizes most off-flavors. Exceptional (76-100): Extraordinarily sensitive to minute flavor differences, can identify subtle notes others miss, natural talent for sensory evaluation.';

MERGE (t_pattern_recognition:Trait {name: 'Pattern Recognition'})
ON CREATE SET t_pattern_recognition.description = 'The inherent ability to identify, recognize, and internalize patterns in information and experiences. Critical for understanding flavor combinations, cocktail family structures, technique applications, and ingredient interactions in mixology.',
              t_pattern_recognition.measurement_criteria = 'Assessed through ability to recognize patterns in flavor combinations, identify which spirits pair together, understand cocktail family structures, and predict how ingredient changes affect results. Low (0-25): Struggles to see connections between similar cocktails or ingredients. Moderate (26-50): Recognizes obvious patterns like classic cocktail families and common flavor pairings. High (51-75): Quickly identifies pattern structures in cocktails, anticipates technique effects, understands subtle relationships. Exceptional (76-100): Intuitively perceives complex pattern relationships, understands underlying principles rapidly, makes intuitive connections others don\'t see.';

// PHYSICAL TRAITS

MERGE (t_fine_motor_control:Trait {name: 'Fine Motor Control'})
ON CREATE SET t_fine_motor_control.description = 'The natural precision and coordination in small, controlled hand and finger movements. Essential for executing consistent shaking, stirring, pouring, and garnish preparation techniques with fluidity and accuracy.',
              t_fine_motor_control.measurement_criteria = 'Assessed through consistency of precise hand movements, ability to execute repeatable techniques, and overall coordination in bartending. Low (0-25): Hand movements are jerky or imprecise, struggles with basic technique consistency, difficulty coordinating two hands simultaneously. Moderate (26-50): Hand movements are adequately controlled, can execute techniques with acceptable consistency but with some awkwardness. High (51-75): Hand movements are smooth and precisely controlled, executes techniques consistently and fluidly. Exceptional (76-100): Hand movements are exceptionally fluid and precise, executes even complex techniques with effortless grace, technical execution appears natural and elegant.';

MERGE (t_hand_strength:Trait {name: 'Hand and Wrist Strength'})
ON CREATE SET t_hand_strength.description = 'The natural muscular strength in hands, wrists, and forearms enabling sustained gripping, shaking, and repetitive bar tool usage without fatigue or strain, especially during high-volume service.',
              t_hand_strength.measurement_criteria = 'Assessed through ability to maintain consistent shaker grip throughout service, sustain repeated shaking motions without fatigue or technique degradation, and endure high-volume bar shifts. Low (0-25): Hands fatigue quickly, grip weakens during service, struggles with sustained shaking. Moderate (26-50): Hands have adequate strength for normal service, but may fatigue during extended periods. High (51-75): Hands remain strong throughout full shifts, maintains consistent grip and technique regardless of volume. Exceptional (76-100): Exceptional hand endurance, never experiences hand fatigue even in extreme service conditions, maintains perfect technique through entire shifts.';

// PERSONALITY TRAITS

MERGE (t_creativity:Trait {name: 'Creativity'})
ON CREATE SET t_creativity.description = 'The natural inclination and ability to generate novel ideas, make unexpected connections, and create original solutions. Fundamental to developing signature cocktails and advancing the art of mixology through innovation.',
              t_creativity.measurement_criteria = 'Assessed through ability to ideate original cocktail concepts, make unexpected flavor combinations, and develop distinctive personal bartending style. Low (0-25): Strictly follows existing recipes, resistant to trying new ideas, lacks original thinking. Moderate (26-50): Can follow examples and create simple variations, beginning to experiment with own ideas. High (51-75): Regularly generates original cocktail ideas, comfortable experimenting with novel flavor combinations, developing distinctive style. Exceptional (76-100): Continuously generates innovative cocktail concepts, naturally makes creative connections, develops signature style readily, influences others with original ideas.';

MERGE (t_attention_to_detail:Trait {name: 'Attention to Detail'})
ON CREATE SET t_attention_to_detail.description = 'The natural predisposition to notice, remember, and care about small details and accuracy. Critical for maintaining consistent proportions, executing proper technique, and achieving high-quality cocktails repeatedly.',
              t_attention_to_detail.measurement_criteria = 'Assessed through consistency of measurements, accuracy of technique execution, quality of presentation, and ability to maintain standards across repeated tasks. Low (0-25): Frequently overlooks details, measurements are imprecise, technique varies, presentation is inconsistent. Moderate (26-50): Generally aware of details but sometimes overlooks things, mostly consistent with occasional lapses. High (51-75): Naturally attentive to details, maintains consistency across tasks, quality standards are high and reliable. Exceptional (76-100): Exceptional attention to detail, notices and remembers minute details others miss, maintains perfect consistency across all tasks, quality is flawless.';

// EMOTIONAL/STRESS MANAGEMENT TRAITS

MERGE (t_resilience:Trait {name: 'Emotional Resilience'})
ON CREATE SET t_resilience.description = 'The natural ability to remain composed, bounce back from mistakes or difficult situations, and maintain performance under stress and pressure. Essential during high-volume service or when managing difficult customer interactions.',
              t_resilience.measurement_criteria = 'Assessed through ability to maintain composure during errors, recover quickly from mistakes, sustain performance during high pressure, and manage emotional reactions appropriately. Low (0-25): Becomes flustered easily, loses composure under pressure, struggles to recover from mistakes, performance degrades significantly under stress. Moderate (26-50): Can handle some pressure but becomes visibly stressed, recovers slowly from mistakes, occasional performance dips under stress. High (51-75): Remains mostly composed under pressure, recovers quickly from mistakes, maintains performance during busy service. Exceptional (76-100): Exceptionally composed under any pressure, instantly learns from errors without emotional disruption, performs at peak levels regardless of stress, others seek you out for calm leadership.';

MERGE (t_intrinsic_motivation:Trait {name: 'Intrinsic Motivation'})
ON CREATE SET t_intrinsic_motivation.description = 'The natural internal drive to pursue mastery, explore craft, and continually improve independent of external rewards. Fundamental to sustaining long-term skill development and reaching high levels of mixology mastery.',
              t_intrinsic_motivation.measurement_criteria = 'Assessed through self-directed learning, voluntary skill development outside required training, enthusiasm for practice and experimentation, and pursuit of continuous improvement. Low (0-25): Requires external motivation to improve, minimal self-directed learning, improves only when necessary. Moderate (26-50): Some self-directed improvement, occasional voluntary skill development, motivated by a mix of internal and external factors. High (51-75): Strong internal drive to improve, regularly engages in self-directed learning, pursues mastery actively. Exceptional (76-100): Exceptional intrinsic motivation, continuously seeks mastery opportunities, practices and experiments independently without prompting, driven by deep passion for craft.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// NOVICE LEVEL MILESTONES
// Entry-level achievements focused on foundational accomplishments

MERGE (m_first_cocktail:Milestone {name: 'Prepare First Classic Cocktail'})
ON CREATE SET m_first_cocktail.description = 'Successfully prepare and serve your first classic cocktail with proper proportions, technique, and presentation. This milestone marks entry into the practical craft of mixology and demonstrates basic competence with tools and recipes.',
              m_first_cocktail.how_to_achieve = 'Choose a simple classic cocktail like a Daiquiri or Margarita. Learn the recipe and proportions thoroughly. Practice preparation multiple times before serving to a customer. Focus on accuracy, proper technique, and presentation. Complete the drink without consulting notes and receive confirmation that it meets quality standards.';

MERGE (m_belay_cert:Milestone {name: 'Master Basic Shaking Technique'})
ON CREATE SET m_belay_cert.description = 'Develop consistent, proper shaking technique with correct grip, movement, and rhythm. This milestone demonstrates fundamental technical competence in one of the two primary mixing methods.',
              m_belay_cert.how_to_achieve = 'Practice empty shaker movements daily for 2-3 weeks focusing on proper form. Train with water to build consistency before using alcohol. Watch instructional videos and seek feedback from experienced bartenders. Practice shaking dozens of test cocktails paying exclusive attention to form and consistency. Demonstrate smooth, controlled shaking with proper rhythm and timing for a trained evaluator.';

MERGE (m_spirit_families:Milestone {name: 'Memorize Five Major Spirit Families'})
ON CREATE SET m_spirit_families.description = 'Learn to identify and recall the defining characteristics of five major spirit families (vodka, gin, rum, whiskey, tequila). Demonstrates foundational spirits knowledge.',
              m_spirit_families.how_to_achieve = 'Study spirits classification guides and resources. Taste examples from each spirit family to understand their characteristics. Memorize the typical ABV, origin, production methods, and flavor profiles for each family. Take a quiz or verbally explain each family to a knowledgeable bartender. Be able to recall and articulate the key differences between families.';

MERGE (m_ten_classics:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
ON CREATE SET m_ten_classics.description = 'Memorize and execute ten classic cocktail recipes with proper proportions, techniques, and presentation without consulting references. Demonstrates solid foundational knowledge of classic cocktail craft.',
              m_ten_classics.how_to_achieve = 'Select ten classic cocktails (e.g., Margarita, Daiquiri, Martini, Manhattan, Old Fashioned, Sidecar, Gimlet, Paloma, Sazerac, Mojito). Study recipes and proportions thoroughly. Practice making each drink multiple times until execution becomes automatic. Have a knowledgeable evaluator confirm you can prepare all ten without consulting notes and to proper quality standards.';

MERGE (m_bar_tools:Milestone {name: 'Demonstrate Competence with Essential Bar Tools'})
ON CREATE SET m_bar_tools.description = 'Develop proper handling and use of five essential bar tools: cocktail shaker, bar spoon, jigger, strainer, and muddler. Demonstrates foundational tool competence.',
              m_bar_tools.how_to_achieve = 'Train with each tool repeatedly focusing on proper technique and grip. Learn the specific purpose and appropriate application of each tool. Practice using tools in actual cocktail preparation for dozens of drinks. Demonstrate proper use of all five tools to a bartender mentor or trainer. Show clean handling and appropriate care of tools.';

// DEVELOPING LEVEL MILESTONES
// Achievements demonstrating growing proficiency and broader knowledge

MERGE (m_flavor_detection:Milestone {name: 'Successfully Conduct Blind Tasting'})
ON CREATE SET m_flavor_detection.description = 'Conduct a blind tasting of three different spirits and accurately identify their types and key flavor characteristics. Demonstrates developing palate sensitivity and sensory evaluation skills.',
              m_flavor_detection.how_to_achieve = 'Study spirit characteristics and flavor profiles for different categories. Conduct regular comparative tastings with labeled and blind examples. Develop tasting vocabulary. Prepare three samples from different spirit families or within the same family. Taste blind and provide written or verbal analysis identifying the spirits and describing their flavor profiles. Have your assessment verified by an expert taster.';

MERGE (m_flavor_balance:Milestone {name: 'Create Balanced Original Cocktail'})
ON CREATE SET m_flavor_balance.description = 'Design and execute an original cocktail recipe with balanced flavors across sweet, sour, bitter, and strong elements. Demonstrates understanding of flavor theory and creative capability.',
              m_flavor_balance.how_to_achieve = 'Study flavor theory and taste mapping. Analyze multiple balanced classic cocktails to understand proportions. Conceptualize an original cocktail with specific flavor objectives. Develop a recipe using flavor theory principles. Prepare the cocktail and evaluate for balance. Have experienced bartenders taste and confirm the flavors are harmonious and well-balanced. Document your recipe.';

MERGE (m_spirits_depth:Milestone {name: 'Achieve Deep Knowledge of One Spirit Category'})
ON CREATE SET m_spirits_depth.description = 'Develop comprehensive knowledge of a single spirit category including production methods, regional variations, quality indicators, and flavor characteristics across different producers. Demonstrates advanced spirits expertise.',
              m_spirits_depth.how_to_achieve = 'Select one spirit category (e.g., Scotch, Tequila, Bourbon, Rum, Gin). Read comprehensive guides on that category. Conduct extensive comparative tastings of multiple brands and styles within the category. Visit or research distilleries producing that spirit. Learn about production methods, aging, barrel types, and regional differences. Document detailed tasting notes on at least ten different products. Demonstrate comprehensive knowledge by explaining production, variations, and flavor profiles to a knowledgeable bartender.';

MERGE (m_cocktail_families:Milestone {name: 'Master Three Cocktail Families'})
ON CREATE SET m_cocktail_families.description = 'Develop expert understanding of three major cocktail families including base recipes, proportions, variations, and the principles that define the family. Demonstrates deep structural understanding of cocktail design.',
              m_cocktail_families.how_to_achieve = 'Select three families (e.g., Sours, Daiquiris, Martinis, or Margaritas). Study multiple cocktails within each family to understand common structures. Learn the base recipe and proportions for each family. Taste multiple family members to understand how variations work. Create one original variation within each family demonstrating understanding of family principles. Document each family structure and be able to explain the defining characteristics to another bartender.';

MERGE (m_advanced_technique:Milestone {name: 'Execute One Advanced Mixing Technique'})
ON CREATE SET m_advanced_technique.description = 'Master execution of one advanced mixology technique such as layering, dry shaking, fat-washing, or floating. Demonstrates expanding technical capability beyond basic methods.',
              m_advanced_technique.how_to_achieve = 'Select one advanced technique (e.g., layering, reverse dry shaking, fat-washing, infusion, or floating). Research and study the technique thoroughly. Practice the technique repeatedly until execution is smooth and reliable. Acquire necessary specialized equipment. Execute the technique in multiple cocktails to demonstrate consistent mastery. Demonstrate proper execution to a mentor or trainer.';

MERGE (m_batch_cocktails:Milestone {name: 'Prepare Batch Cocktails for an Event'})
ON CREATE SET m_batch_cocktails.description = 'Successfully prepare batch cocktails for a large gathering (20+ people) maintaining consistency, quality, and proper serving throughout the event. Demonstrates scaling and service management capability.',
              m_batch_cocktails.how_to_achieve = 'Design a cocktail recipe suitable for batch preparation. Scale the recipe appropriately for the guest count. Prepare the batch ahead of service maintaining proper dilution and balance. Serve from the batch throughout the event maintaining consistency and quality. Gather feedback from event attendees or manager confirming cocktails met quality expectations and consistency was maintained.';

// COMPETENT LEVEL MILESTONES
// Significant achievements demonstrating intermediate mastery and leadership

MERGE (m_signature_cocktail:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
ON CREATE SET m_signature_cocktail.description = 'Create an original cocktail that becomes associated with you as a bartender and is specifically requested by customers. Demonstrates successful creative expression and professional recognition.',
              m_signature_cocktail.how_to_achieve = 'Conceptualize an original cocktail that reflects your personal style and bartending philosophy. Develop the recipe using flavor theory and technical knowledge. Refine the recipe through multiple iterations and feedback. Serve the cocktail consistently at your establishment. Market the drink through customer education and personal enthusiasm. Track customer requests for the drink by name specifically requesting you prepare it. Achieve consistent customer recognition and requests.';

MERGE (m_mentor_progression:Milestone {name: 'Successfully Mentor a Bartender to Advanced Skill'})
ON CREATE SET m_mentor_progression.description = 'Guide another bartender\'s development from novice to intermediate/advanced skill level across multiple competency areas. Demonstrates teaching ability and professional leadership.',
              m_mentor_progression.how_to_achieve = 'Identify a less experienced bartender to mentor. Commit to regular training sessions covering technique, flavor theory, spirits knowledge, and customer service. Provide constructive feedback and guidance. Monitor their progress across multiple skill areas. Help them achieve mastery in at least three skill domains (e.g., shaking technique, flavor balancing, spirits knowledge). Confirm their advancement through observable skill improvement and customer feedback.';

MERGE (m_professional_training:Milestone {name: 'Complete Professional Mixology Certification'})
ON CREATE SET m_professional_training.description = 'Complete a recognized professional cocktail training program or certification course such as through a spirit brand, bartender association, or established school. Demonstrates commitment to professional development.',
              m_professional_training.how_to_achieve = 'Research and select a legitimate professional mixology certification program (e.g., Brand Ambassador program, Professional Bartender Association certification, mixology school course). Enroll and complete the program requirements which may include classroom study, practical training, and examinations. Pass all required assessments. Receive official certification or completion documentation. Examples include Diageo Bar Academy, UKBG certification, or major spirits brand ambassador programs.';

MERGE (m_spirit_mastery:Milestone {name: 'Achieve Master-Level Knowledge of Two Spirit Categories'})
ON CREATE SET m_spirit_mastery.description = 'Develop comprehensive, expert-level knowledge of two different spirit categories demonstrating mastery of production, regional variations, quality assessment, and flavor profiling. Demonstrates exceptional spirits expertise.',
              m_spirit_mastery.how_to_achieve = 'Select two spirit categories to master. For each, conduct extensive study including production methods, regional variations, aging processes, and quality indicators. Conduct hundreds of comparative tastings of different brands and styles. Build detailed tasting library documenting characteristics of 20+ products in each category. Visit distilleries or conduct detailed research on production. Be able to speak authoritatively about each category and make sophisticated recommendations. Have your knowledge recognized by other bartenders or spirits professionals.';

MERGE (m_recipe_innovation:Milestone {name: 'Create Cocktail That Influences Local Bartending Community'})
ON CREATE SET m_recipe_innovation.description = 'Develop an original cocktail recipe that is adopted and served by other bartenders in your community, demonstrating influence and innovation. Shows creative contribution to broader mixology culture.',
              m_recipe_innovation.how_to_achieve = 'Create an original cocktail with distinctive flavor profile and strong technical execution. Serve it consistently and educate customers and other bartenders about the drink. Share the recipe with other bartenders in your network. Track adoption as other bartenders begin serving your creation. Monitor feedback and recognition of the drink within your bartending community. Achieve acknowledgment that the drink originated with you and is being served by multiple other bartenders.';

MERGE (m_high_volume_mastery:Milestone {name: 'Maintain Quality During Extreme Service Volume'})
ON CREATE SET m_high_volume_mastery.description = 'Execute flawlessly during a high-volume service shift (50+ cocktails in 2-3 hours) maintaining consistent quality, proper technique, and customer service. Demonstrates service management mastery.',
              m_high_volume_mastery.how_to_achieve = 'Work or volunteer at an event requiring high-volume cocktail service (e.g., busy night at upscale bar, large event with open bar, festival). Execute 50 or more cocktails in a short time window. Maintain consistency of measurements, technique, and presentation throughout the shift. Receive feedback from customers, manager, or organizer confirming quality was maintained despite high volume. Note any compliments about handling the volume professionally.';

// ADVANCED LEVEL MILESTONES
// Major accomplishments reflecting high mastery and professional recognition

MERGE (m_bartender_competition:Milestone {name: 'Compete in Bartending Competition'})
ON CREATE SET m_bartender_competition.description = 'Participate in a sanctioned bartending competition (local, regional, or national level) demonstrating your craft against peers in a formal competitive context.',
              m_bartender_competition.how_to_achieve = 'Identify a legitimate bartending competition (e.g., local bar association competition, regional spirit brand competition, Bartender Guild event, or national championships). Research competition requirements and judging criteria. Prepare competition cocktails and presentation. Register and participate in the competition. Execute your cocktails and presentation before judges. Complete the competition regardless of placement. This milestone is achieved through participation, not necessarily winning.';

MERGE (m_speak_engagement:Milestone {name: 'Speak or Present at Bartending Event'})
ON CREATE SET m_speak_engagement.description = 'Deliver a presentation or speaking engagement at a bartending conference, training event, or community gathering sharing your expertise and knowledge. Demonstrates professional authority and teaching capability.',
              m_speak_engagement.how_to_achieve = 'Identify a bartending event, conference, or gathering that invites speakers (e.g., Bartender Guild meeting, spirits education event, bar industry conference, local bartending workshop). Propose a presentation on your area of expertise (e.g., flavor theory, specific spirit category, advanced techniques, mentoring approaches). Be selected to present. Deliver your presentation to a professional audience. Receive confirmation of completion from event organizers.';

MERGE (m_media_feature:Milestone {name: 'Be Featured in Media for Bartending Work'})
ON CREATE SET m_media_feature.description = 'Be featured in print, digital, or broadcast media for your bartending work, cocktail creation, or craft expertise. Demonstrates professional recognition and influence.',
              m_media_feature.how_to_achieve = 'Develop a notable reputation for your cocktails or expertise. Be interviewed or featured by media outlets covering bartending or hospitality (e.g., local food/beverage magazine, online spirits publication, newspaper interview, podcast, social media features). Provide information about your cocktails, techniques, or bartending philosophy. Be published or broadcast. Save documentation of the media feature as evidence.';

MERGE (m_bar_opening:Milestone {name: 'Play Leadership Role in Opening New Bar'})
ON CREATE SET m_bar_opening.description = 'Take a significant leadership role in conceptualizing, developing, and opening a new bar including menu development, staff training, and initial service execution.',
              m_bar_opening.how_to_achieve = 'Join or lead a bar opening project. Contribute substantially to one or more of: cocktail menu development, training program design, bar operation systems, staff hiring/training, or launch execution. Help develop the bar\'s cocktail philosophy and signature drinks. Lead training for opening staff. Execute service during opening shifts. Document your role and contributions. Receive confirmation from bar ownership that the opening was successful and attribute success partly to your contributions.';

MERGE (m_international_spirit_tour:Milestone {name: 'Visit and Study Distilleries Internationally'})
ON CREATE SET m_international_spirit_tour.description = 'Travel to another country to visit and study distilleries, meet producers, and deepen understanding of spirit production and culture. Demonstrates commitment to mastering spirits knowledge.',
              m_international_spirit_tour.how_to_achieve = 'Plan and execute travel to a spirits-producing region outside your home country (e.g., Scotland for whisky, Mexico for tequila, the Caribbean for rum, Europe for brandy/gin). Visit 2+ distilleries. Take tours and conduct tastings. Meet with distillery staff or producers. Document distillery methods, products, and learnings. Return with deepened knowledge of production, regional variations, and spirit character. Share what you learned with other bartenders.';

// MASTER LEVEL MILESTONES
// Exceptional achievements reflecting mastery and lasting influence on the craft

MERGE (m_published_cocktails:Milestone {name: 'Publish Original Cocktails in Professional Venue'})
ON CREATE SET m_published_cocktails.description = 'Have original cocktail recipes published in a bartending book, professional spirits publication, or recognized online mixology platform. Demonstrates lasting creative contribution to the field.',
              m_published_cocktails.how_to_achieve = 'Develop a collection of original cocktail recipes that you believe deserve publication. Research publishing opportunities for bartenders (e.g., bartending books, spirits magazines, online mixology publications, spirits brand websites). Submit your recipes for publication consideration or be approached by publishers. Achieve publication of at least 3-5 original cocktail recipes with your name and story. Obtain published copies or digital evidence of publication.';

MERGE (m_mentorship_network:Milestone {name: 'Develop Network of Mentees Achieving Advanced Skill'})
ON CREATE SET m_mentorship_network.description = 'Successfully mentor multiple bartenders (5+) to advanced skill levels, establishing yourself as a respected teacher and contributor to developing the next generation of bartenders.',
              m_mentorship_network.how_to_achieve = 'Commit to mentoring multiple bartenders over an extended period (months to years). Provide structured guidance and training to each mentee across multiple competency areas. Track progress of mentees as they advance to intermediate and advanced skill levels. Monitor their achievements including promotions, recognition, or skill acquisitions. Establish reputation as someone who develops talented bartenders. Have mentees acknowledge your contribution to their development. Achieve recognition from at least 5 bartenders as a significant mentor.';

MERGE (m_craft_innovation:Milestone {name: 'Innovate Technique or Approach Adopted by Broader Industry'})
ON CREATE SET m_craft_innovation.description = 'Develop an original technique, flavor approach, or cocktail methodology that is adopted and practiced by bartenders beyond your immediate community, contributing meaningfully to the evolution of mixology.',
              m_craft_innovation.how_to_achieve = 'Experiment extensively with new techniques, flavor combinations, or service approaches. Develop something genuinely novel that advances bartending craft. Document and refine your innovation. Share it with the broader bartending community through publications, presentations, social media, or other channels. Monitor adoption as other bartenders learn and implement your innovation. Achieve recognition that the approach originated with you. Examples include new molecular techniques, flavor theory applications, or service methodologies that gain broader adoption.';

MERGE (m_mastery_recognition:Milestone {name: 'Receive Recognition as Master Craftsperson'})
ON CREATE SET m_mastery_recognition.description = 'Receive official or professional recognition of mastery status from bartending organizations, industry peers, or respected institutions. Represents pinnacle of professional acknowledgment.',
              m_mastery_recognition.how_to_achieve = 'Build a renowned reputation for exceptional skill, innovation, and influence in mixology over many years of practice. Be nominated for or receive formal recognition including: Master Bartender designation from professional associations, lifetime achievement award, induction into bartending hall of fame, recognition as most influential bartender by peers, or similar formal honors. The recognition should come from external sources (not self-designated) and reflect broad acknowledgment of your mastery and contributions to the field.';

MERGE (m_lasting_legacy:Milestone {name: 'Establish Lasting Influence on Mixology Culture'})
ON CREATE SET m_lasting_legacy.description = 'Establish a lasting legacy of influence on mixology including multiple achievements in innovation, mentorship, and community contribution that endure beyond your active practice.',
              m_lasting_legacy.how_to_achieve = 'Over an extended career, accumulate lasting influence through multiple contributions: develop influential cocktails that remain popular years after creation, mentor multiple generations of bartenders who credit your influence on their careers, contribute techniques or approaches adopted industry-wide, participate in advancing bartending education and standards, or build a body of published work on mixology craft. Have your influence acknowledged by newer bartenders who learned from you or your published work. Establish a professional legacy where your contributions are recognized as meaningful and lasting beyond your direct involvement.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// LEVEL 1 (MIXOLOGY NOVICE) REQUIREMENTS
// ============================================================

// Knowledge Requirements for Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Classic Cocktail Recipes'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Shaking Technique'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Stirring Technique'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Cocktail Proportions'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (k:Knowledge {name: 'Mixology Bar Equipment'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

// Skill Requirements for Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (s:Skill {name: 'Mixology Shaking Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (s:Skill {name: 'Mixology Stirring Technique'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (s:Skill {name: 'Mixology Accurate Measuring'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (s:Skill {name: 'Mixology Classic Recipe Execution'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

// Trait Requirements for Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (t:Trait {name: 'Fine Motor Control'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

// Milestone Requirements for Level 1
MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (m:Milestone {name: 'Prepare First Classic Cocktail'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (m:Milestone {name: 'Master Basic Shaking Technique'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Mixology Novice'})
MATCH (m:Milestone {name: 'Memorize Five Major Spirit Families'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 2 (MIXOLOGY DEVELOPING) REQUIREMENTS
// ============================================================

// Knowledge Requirements for Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Classic Cocktail Recipes'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Shaking Technique'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Stirring Technique'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Dilution Control'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Ice Selection and Properties'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (k:Knowledge {name: 'Mixology Garnishing and Presentation'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements for Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Shaking Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Stirring Technique'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Spirit Knowledge and Selection'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Flavor Balancing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Basic Garnish Preparation'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (s:Skill {name: 'Mixology Classic Recipe Execution'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Trait Requirements for Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (t:Trait {name: 'Fine Motor Control'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (t:Trait {name: 'Palate Sensitivity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

// Milestone Requirements for Level 2
MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (m:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (m:Milestone {name: 'Demonstrate Competence with Essential Bar Tools'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Mixology Developing'})
MATCH (m:Milestone {name: 'Successfully Conduct Blind Tasting'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 3 (MIXOLOGY COMPETENT) REQUIREMENTS
// ============================================================

// Knowledge Requirements for Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Classic Cocktail Recipes'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Spirit Production Methods'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Cocktail Family Structures'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Ingredient Selection'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (k:Knowledge {name: 'Mixology Recipe Development and Innovation'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements for Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Shaking Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Stirring Technique'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Spirit Knowledge and Selection'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Flavor Balancing'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Technique Selection and Adaptation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Original Recipe Creation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (s:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

// Trait Requirements for Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (t:Trait {name: 'Fine Motor Control'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (t:Trait {name: 'Attention to Detail'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (t:Trait {name: 'Palate Sensitivity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

// Milestone Requirements for Level 3
MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (m:Milestone {name: 'Create Balanced Original Cocktail'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (m:Milestone {name: 'Achieve Deep Knowledge of One Spirit Category'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Mixology Competent'})
MATCH (m:Milestone {name: 'Master Three Cocktail Families'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// LEVEL 4 (MIXOLOGY ADVANCED) REQUIREMENTS
// ============================================================

// Knowledge Requirements for Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Spirit Production Methods'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Recipe Development and Innovation'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (k:Knowledge {name: 'Mixology Cocktail History and Evolution'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

// Skill Requirements for Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Shaking Technique'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Spirit Knowledge and Selection'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Original Recipe Creation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Advanced Techniques'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Customer Engagement and Education'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (s:Skill {name: 'Mixology Mentoring and Teaching'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

// Trait Requirements for Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (t:Trait {name: 'Palate Sensitivity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (t:Trait {name: 'Intrinsic Motivation'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

// Milestone Requirements for Level 4
MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (m:Milestone {name: 'Execute One Advanced Mixing Technique'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (m:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (m:Milestone {name: 'Prepare Batch Cocktails for an Event'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (m:Milestone {name: 'Compete in Bartending Competition'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Mixology Advanced'})
MATCH (m:Milestone {name: 'Complete Professional Mixology Certification'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// LEVEL 5 (MIXOLOGY MASTER) REQUIREMENTS
// ============================================================

// Knowledge Requirements for Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Evaluate'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Recipe Development and Innovation'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Create'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (k:Knowledge {name: 'Mixology Molecular and Modernist Techniques'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

// Skill Requirements for Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (s:Skill {name: 'Mixology Spirit Knowledge and Selection'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (s:Skill {name: 'Mixology Original Recipe Creation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (s:Skill {name: 'Mixology Advanced Techniques'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (s:Skill {name: 'Mixology Innovation and Advancement'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (s:Skill {name: 'Mixology Mentoring and Teaching'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

// Trait Requirements for Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (t:Trait {name: 'Palate Sensitivity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (t:Trait {name: 'Intrinsic Motivation'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

// Milestone Requirements for Level 5
MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (m:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (m:Milestone {name: 'Successfully Mentor a Bartender to Advanced Skill'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (m:Milestone {name: 'Publish Original Cocktails in Professional Venue'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (m:Milestone {name: 'Innovate Technique or Approach Adopted by Broader Industry'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Mixology Master'})
MATCH (m:Milestone {name: 'Receive Recognition as Master Craftsperson'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: true}]->(m);

// ============================================================
// COMPONENT PREREQUISITES
// ============================================================

// Knowledge Prerequisites

// Flavor Theory requires foundational knowledge
MATCH (k1:Knowledge {name: 'Mixology Flavor Theory'})
MATCH (k2:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Ingredient Selection requires Flavor Theory
MATCH (k1:Knowledge {name: 'Mixology Ingredient Selection'})
MATCH (k2:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Recipe Development requires multiple foundations
MATCH (k1:Knowledge {name: 'Mixology Recipe Development and Innovation'})
MATCH (k2:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Mixology Recipe Development and Innovation'})
MATCH (k2:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced Mixing Techniques requires foundational techniques
MATCH (k1:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
MATCH (k2:Knowledge {name: 'Mixology Shaking Technique'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
MATCH (k2:Knowledge {name: 'Mixology Stirring Technique'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Palate Development requires understanding spirits and flavor
MATCH (k1:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
MATCH (k2:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
MATCH (k2:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Molecular Mixology requires advanced foundations
MATCH (k1:Knowledge {name: 'Mixology Molecular and Modernist Techniques'})
MATCH (k2:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Skill Prerequisites

// Classic Recipe Execution requires technique knowledge
MATCH (s1:Skill {name: 'Mixology Classic Recipe Execution'})
MATCH (k:Knowledge {name: 'Mixology Classic Cocktail Recipes'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Mixology Classic Recipe Execution'})
MATCH (k:Knowledge {name: 'Mixology Shaking Technique'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

// Flavor Balancing requires understanding flavor theory
MATCH (s1:Skill {name: 'Mixology Flavor Balancing'})
MATCH (k:Knowledge {name: 'Mixology Flavor Theory'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Mixology Flavor Balancing'})
MATCH (s2:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Spirit Knowledge requires spirits classification knowledge
MATCH (s1:Skill {name: 'Mixology Spirit Knowledge and Selection'})
MATCH (k:Knowledge {name: 'Mixology Spirits Classification'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

// Technique Selection requires foundational techniques
MATCH (s1:Skill {name: 'Mixology Technique Selection and Adaptation'})
MATCH (s2:Skill {name: 'Mixology Shaking Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Mixology Technique Selection and Adaptation'})
MATCH (s2:Skill {name: 'Mixology Stirring Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Original Recipe Creation requires understanding flavor theory and techniques
MATCH (s1:Skill {name: 'Mixology Original Recipe Creation'})
MATCH (k:Knowledge {name: 'Mixology Recipe Development and Innovation'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Mixology Original Recipe Creation'})
MATCH (s2:Skill {name: 'Mixology Flavor Balancing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

// Advanced Techniques requires knowledge and foundational skill
MATCH (s1:Skill {name: 'Mixology Advanced Techniques'})
MATCH (k:Knowledge {name: 'Mixology Advanced Mixing Techniques'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Mixology Advanced Techniques'})
MATCH (s2:Skill {name: 'Mixology Shaking Technique'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Refined Palate Development requires palate training
MATCH (s1:Skill {name: 'Mixology Refined Palate Development'})
MATCH (k:Knowledge {name: 'Mixology Palate Development and Sensory Training'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Mixology Refined Palate Development'})
MATCH (s2:Skill {name: 'Mixology Tasting and Sensory Evaluation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Service Management requires classic recipe execution and customer skills
MATCH (s1:Skill {name: 'Mixology Service Management and Flow'})
MATCH (s2:Skill {name: 'Mixology Classic Recipe Execution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Mentoring requires advanced skills
MATCH (s1:Skill {name: 'Mixology Mentoring and Teaching'})
MATCH (s2:Skill {name: 'Mixology Original Recipe Creation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Mixology Mentoring and Teaching'})
MATCH (s2:Skill {name: 'Mixology Advanced Techniques'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Milestone Prerequisites

// Execute Ten Classic Cocktails requires ability to prepare first cocktail
MATCH (m1:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
MATCH (m2:Milestone {name: 'Prepare First Classic Cocktail'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Master Three Cocktail Families requires basic tasting
MATCH (m1:Milestone {name: 'Master Three Cocktail Families'})
MATCH (m2:Milestone {name: 'Successfully Conduct Blind Tasting'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Create Balanced Original Cocktail requires executing classics first
MATCH (m1:Milestone {name: 'Create Balanced Original Cocktail'})
MATCH (m2:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Achieve Deep Knowledge requires executing classics
MATCH (m1:Milestone {name: 'Achieve Deep Knowledge of One Spirit Category'})
MATCH (m2:Milestone {name: 'Memorize Five Major Spirit Families'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Develop Signature Cocktail requires creating a balanced original
MATCH (m1:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
MATCH (m2:Milestone {name: 'Create Balanced Original Cocktail'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Execute Advanced Technique requires mastering basic shaking
MATCH (m1:Milestone {name: 'Execute One Advanced Mixing Technique'})
MATCH (m2:Milestone {name: 'Master Basic Shaking Technique'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Prepare Batch Cocktails requires executing classics consistently
MATCH (m1:Milestone {name: 'Prepare Batch Cocktails for an Event'})
MATCH (m2:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Successfully Mentor requires developing signature cocktail
MATCH (m1:Milestone {name: 'Successfully Mentor a Bartender to Advanced Skill'})
MATCH (m2:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Create Cocktail That Influences Community requires signature cocktail
MATCH (m1:Milestone {name: 'Create Cocktail That Influences Local Bartending Community'})
MATCH (m2:Milestone {name: 'Develop Signature Cocktail Recognized by Customers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Maintain Quality During High Volume requires consistent classic execution
MATCH (m1:Milestone {name: 'Maintain Quality During Extreme Service Volume'})
MATCH (m2:Milestone {name: 'Execute Ten Classic Cocktails from Memory'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Develop Network of Mentees requires successfully mentoring first bartender
MATCH (m1:Milestone {name: 'Develop Network of Mentees Achieving Advanced Skill'})
MATCH (m2:Milestone {name: 'Successfully Mentor a Bartender to Advanced Skill'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Establish Lasting Influence requires published cocktails and mentor network
MATCH (m1:Milestone {name: 'Establish Lasting Influence on Mixology Culture'})
MATCH (m2:Milestone {name: 'Publish Original Cocktails in Professional Venue'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Lasting Influence on Mixology Culture'})
MATCH (m2:Milestone {name: 'Develop Network of Mentees Achieving Advanced Skill'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

