// Main System Node
MERGE (immune {name: 'Immune System'})
SET immune:System, immune.description = 'Complex network of cells, tissues, and organs that defend the body against pathogens and other harmful substances'

// Major Organs and Structures
MERGE (thymus {name: 'Thymus'})
SET thymus:Organ, thymus.description = 'Primary lymphoid organ where T cells mature and develop, located in the upper chest'

MERGE (bone_marrow {name: 'Bone Marrow'})
SET bone_marrow:Organ, bone_marrow.description = 'Soft tissue inside bones where all blood cells and immune cells originate'

MERGE (spleen {name: 'Spleen'})
SET spleen:Organ, spleen.description = 'Large lymphoid organ that filters blood and stores immune cells, located in the upper left abdomen'

MERGE (lymph_nodes {name: 'Lymph Nodes'})
SET lymph_nodes:Structure, lymph_nodes.description = 'Small, bean-shaped structures throughout the body that filter lymph fluid and house immune cells'

MERGE (lymphatic_vessels {name: 'Lymphatic Vessels'})
SET lymphatic_vessels:Structure, lymphatic_vessels.description = 'Network of vessels that transport lymph fluid and immune cells throughout the body'

// Connect major structures to system
MERGE (immune)-[:CONTAINS]->(thymus)
MERGE (immune)-[:CONTAINS]->(bone_marrow)
MERGE (immune)-[:CONTAINS]->(spleen)
MERGE (immune)-[:CONTAINS]->(lymph_nodes)
MERGE (immune)-[:CONTAINS]->(lymphatic_vessels)

// Immune Cells
MERGE (t_cells {name: 'T Cells'})
SET t_cells:Component, t_cells.description = 'White blood cells that recognize and destroy infected cells and regulate immune responses'

MERGE (b_cells {name: 'B Cells'})
SET b_cells:Component, b_cells.description = 'White blood cells that produce antibodies against specific pathogens'

MERGE (neutrophils {name: 'Neutrophils'})
SET neutrophils:Component, neutrophils.description = 'Most abundant white blood cells that quickly respond to infections and tissue damage'

MERGE (macrophages {name: 'Macrophages'})
SET macrophages:Component, macrophages.description = 'Large cells that engulf and digest pathogens and dead cells'

MERGE (dendritic_cells {name: 'Dendritic Cells'})
SET dendritic_cells:Component, dendritic_cells.description = 'Cells that capture and present antigens to T cells, initiating immune responses'

MERGE (nk_cells {name: 'Natural Killer Cells'})
SET nk_cells:Component, nk_cells.description = 'Specialized cells that detect and kill virus-infected cells and cancer cells'

// Connect immune cells to system
MERGE (immune)-[:CONTAINS]->(t_cells)
MERGE (immune)-[:CONTAINS]->(b_cells)
MERGE (immune)-[:CONTAINS]->(neutrophils)
MERGE (immune)-[:CONTAINS]->(macrophages)
MERGE (immune)-[:CONTAINS]->(dendritic_cells)
MERGE (immune)-[:CONTAINS]->(nk_cells)

// Immune Molecules
MERGE (antibodies {name: 'Antibodies'})
SET antibodies:Component, antibodies.description = 'Y-shaped proteins produced by B cells that specifically bind to and neutralize pathogens'

MERGE (cytokines {name: 'Cytokines'})
SET cytokines:Component, cytokines.description = 'Signaling proteins that coordinate immune responses and inflammation'

MERGE (complement {name: 'Complement System'})
SET complement:Component, complement.description = 'Group of proteins that enhance antibody responses and attract immune cells'

// Connect immune molecules to system
MERGE (immune)-[:CONTAINS]->(antibodies)
MERGE (immune)-[:CONTAINS]->(cytokines)
MERGE (immune)-[:CONTAINS]->(complement)

// Tissues
MERGE (malt {name: 'Mucosa-Associated Lymphoid Tissue'})
SET malt:Tissue, malt.description = 'Lymphoid tissue found in mucous membranes throughout the body'

MERGE (tonsils {name: 'Tonsils'})
SET tonsils:Tissue, tonsils.description = 'Collections of lymphoid tissue in the throat that trap pathogens entering through mouth or nose'

// Connect tissues to system
MERGE (immune)-[:CONTAINS]->(malt)
MERGE (immune)-[:CONTAINS]->(tonsils)

// Example Conditions/Variations
MERGE (autoimmune {name: 'Autoimmune Disease'})
SET autoimmune:Condition, autoimmune.description = 'Condition where immune system attacks healthy body tissues',
    autoimmune.types = ['rheumatoid arthritis', 'lupus', 'multiple sclerosis']

MERGE (immunodeficiency {name: 'Immunodeficiency'})
SET immunodeficiency:Condition, immunodeficiency.description = 'Weakened immune system unable to fight infections effectively',
    immunodeficiency.types = ['primary', 'acquired']

MERGE (hypersensitivity {name: 'Hypersensitivity'})
SET hypersensitivity:Condition, hypersensitivity.description = 'Exaggerated immune response to normally harmless substances',
    hypersensitivity.types = ['allergies', 'asthma', 'eczema']

// Connect conditions to system
MERGE (immune)-[:CAN_HAVE]->(autoimmune)
MERGE (immune)-[:CAN_HAVE]->(immunodeficiency)
MERGE (immune)-[:CAN_HAVE]->(hypersensitivity)

// Measurable Properties
MERGE (wbc_count {name: 'White Blood Cell Count'})
SET wbc_count:Measurement, wbc_count.description = 'Number of white blood cells per microliter of blood',
    wbc_count.units = 'cells/μL',
    wbc_count.normalRange = '4,500-11,000'

MERGE (antibody_levels {name: 'Antibody Levels'})
SET antibody_levels:Measurement, antibody_levels.description = 'Concentration of specific antibodies in blood',
    antibody_levels.units = 'titers',
    antibody_levels.normalRange = 'varies by antibody type'

// Connect measurements to system
MERGE (immune)-[:HAS_MEASUREMENT]->(wbc_count)
MERGE (immune)-[:HAS_MEASUREMENT]->(antibody_levels)