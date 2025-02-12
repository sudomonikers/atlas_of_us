// Main System Node
MATCH (immune {name: 'Immune System'})

// Major Organs and Structures
MERGE (thymus {name: 'Thymus'})
SET thymus:L1:Health:Organ,
    thymus.description = 'Primary lymphoid organ where T cells mature and develop, located in the upper chest'

MERGE (boneMarrow {name: 'Bone Marrow'})
SET boneMarrow:L1:Health:Organ,
    boneMarrow.description = 'Soft tissue inside bones where all blood cells and immune cells originate'

MERGE (spleen {name: 'Spleen'})
SET spleen:L1:Health:Organ,
    spleen.description = 'Large lymphoid organ that filters blood and stores immune cells, located in the upper left abdomen'

MERGE (lymphNodes {name: 'Lymph Nodes'})
SET lymphNodes:L1:Health:Structure,
    lymphNodes.description = 'Small, bean-shaped structures throughout the body that filter lymph fluid and house immune cells'

MERGE (lymphaticVessels {name: 'Lymphatic Vessels'})
SET lymphaticVessels:L1:Health:Structure,
    lymphaticVessels.description = 'Network of vessels that transport lymph fluid and immune cells throughout the body'

// Connect major structures to system
MERGE (thymus)-[:MAKES_UP]->(immune)
MERGE (boneMarrow)-[:MAKES_UP]->(immune)
MERGE (spleen)-[:MAKES_UP]->(immune)
MERGE (lymphNodes)-[:MAKES_UP]->(immune)
MERGE (lymphaticVessels)-[:MAKES_UP]->(immune)

// Immune Cells
MERGE (tCells {name: 'T Cells'})
SET tCells:L1:Health:Component,
    tCells.description = 'White blood cells that recognize and destroy infected cells and regulate immune responses'

MERGE (bCells {name: 'B Cells'})
SET bCells:L1:Health:Component,
    bCells.description = 'White blood cells that produce antibodies against specific pathogens'

MERGE (neutrophils {name: 'Neutrophils'})
SET neutrophils:L1:Health:Component,
    neutrophils.description = 'Most abundant white blood cells that quickly respond to infections and tissue damage'

MERGE (macrophages {name: 'Macrophages'})
SET macrophages:L1:Health:Component,
    macrophages.description = 'Large cells that engulf and digest pathogens and dead cells'

MERGE (dendriticCells {name: 'Dendritic Cells'})
SET dendriticCells:L1:Health:Component,
    dendriticCells.description = 'Cells that capture and present antigens to T cells, initiating immune responses'

MERGE (nkCells {name: 'Natural Killer Cells'})
SET nkCells:L1:Health:Component,
    nkCells.description = 'Specialized cells that detect and kill virus-infected cells and cancer cells'

// Connect immune cells to system
MERGE (tCells)-[:MAKES_UP]->(immune)
MERGE (bCells)-[:MAKES_UP]->(immune)
MERGE (neutrophils)-[:MAKES_UP]->(immune)
MERGE (macrophages)-[:MAKES_UP]->(immune)
MERGE (dendriticCells)-[:MAKES_UP]->(immune)
MERGE (nkCells)-[:MAKES_UP]->(immune)

// Immune Molecules
MERGE (antibodies {name: 'Antibodies'})
SET antibodies:L1:Health:Component,
    antibodies.description = 'Y-shaped proteins produced by B cells that specifically bind to and neutralize pathogens'

MERGE (cytokines {name: 'Cytokines'})
SET cytokines:L1:Health:Component,
    cytokines.description = 'Signaling proteins that coordinate immune responses and inflammation'

MERGE (complement {name: 'Complement System'})
SET complement:L1:Health:Component,
    complement.description = 'Group of proteins that enhance antibody responses and attract immune cells'

// Connect immune molecules to system
MERGE (antibodies)-[:MAKES_UP]->(immune)
MERGE (cytokines)-[:MAKES_UP]->(immune)
MERGE (complement)-[:MAKES_UP]->(immune)

// Tissues
MERGE (malt {name: 'Mucosa-Associated Lymphoid Tissue'})
SET malt:L1:Health:Tissue,
    malt.description = 'Lymphoid tissue found in mucous membranes throughout the body'

MERGE (tonsils {name: 'Tonsils'})
SET tonsils:L1:Health:Tissue,
    tonsils.description = 'Collections of lymphoid tissue in the throat that trap pathogens entering through mouth or nose'

// Connect tissues to system
MERGE (malt)-[:MAKES_UP]->(immune)
MERGE (tonsils)-[:MAKES_UP]->(immune)