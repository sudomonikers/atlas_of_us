// Main System Node
MATCH (integumentary {name: 'Integumentary System'})

// Main Components
MERGE (skin {name: 'Skin'})
SET skin:L1:Health:Organ,
    skin.description = 'Largest organ of the body, providing protection, sensation, and temperature regulation'

MERGE (hair {name: 'Hair'})
SET hair:L1:Health:Structure,
    hair.description = 'Keratinized protein filaments growing from follicles in skin'

MERGE (nails {name: 'Nails'})
SET nails:L1:Health:Structure,
    nails.description = 'Protective plates of hardened keratin at fingertips and toes'

// Connect main components to system
MERGE (skin)-[:MAKES_UP]->(integumentary)
MERGE (hair)-[:MAKES_UP]->(integumentary)
MERGE (nails)-[:MAKES_UP]->(integumentary)

// Skin Layers
MERGE (epidermis {name: 'Epidermis'})
SET epidermis:L1:Health:Structure,
    epidermis.description = 'Outermost layer of skin providing barrier protection'

MERGE (dermis {name: 'Dermis'})
SET dermis:L1:Health:Structure,
    dermis.description = 'Middle layer containing blood vessels, nerves, and various skin structures'

MERGE (hypodermis {name: 'Hypodermis'})
SET hypodermis:L1:Health:Structure,
    hypodermis.description = 'Deepest layer composed mainly of adipose tissue'

// Connect skin layers
MERGE (epidermis)-[:MAKES_UP]->(skin)
MERGE (dermis)-[:MAKES_UP]->(skin)
MERGE (hypodermis)-[:MAKES_UP]->(skin)

// Epidermal Layers
MERGE (stratumCorneum {name: 'Stratum Corneum'})
SET stratumCorneum:L1:Health:Tissue,
    stratumCorneum.description = 'Outermost layer of dead, keratinized cells'

MERGE (stratumLucidum {name: 'Stratum Lucidum'})
SET stratumLucidum:L1:Health:Tissue,
    stratumLucidum.description = 'Clear layer present in thick skin of palms and soles'

MERGE (stratumGranulosum {name: 'Stratum Granulosum'})
SET stratumGranulosum:L1:Health:Tissue,
    stratumGranulosum.description = 'Layer containing keratin-producing granules'

MERGE (stratumSpinosum {name: 'Stratum Spinosum'})
SET stratumSpinosum:L1:Health:Tissue,
    stratumSpinosum.description = 'Layer of spiny cells providing skin strength'

MERGE (stratumBasale {name: 'Stratum Basale'})
SET stratumBasale:L1:Health:Tissue,
    stratumBasale.description = 'Bottom layer where new skin cells are produced'

// Connect epidermal layers
MERGE (stratumCorneum)-[:MAKES_UP]->(epidermis)
MERGE (stratumLucidum)-[:MAKES_UP]->(epidermis)
MERGE (stratumGranulosum)-[:MAKES_UP]->(epidermis)
MERGE (stratumSpinosum)-[:MAKES_UP]->(epidermis)
MERGE (stratumBasale)-[:MAKES_UP]->(epidermis)

// Dermal Components
MERGE (papillaryDermis {name: 'Papillary Dermis'})
SET papillaryDermis:L1:Health:Tissue,
    papillaryDermis.description = 'Upper dermal layer with papillae projecting into epidermis'

MERGE (reticularDermis {name: 'Reticular Dermis'})
SET reticularDermis:L1:Health:Tissue,
    reticularDermis.description = 'Lower dermal layer containing dense irregular connective tissue'

// Connect dermal components
MERGE (papillaryDermis)-[:MAKES_UP]->(dermis)
MERGE (reticularDermis)-[:MAKES_UP]->(dermis)

// Specialized Structures
MERGE (hairFollicle {name: 'Hair Follicle'})
SET hairFollicle:L1:Health:Structure,
    hairFollicle.description = 'Structure in skin from which hair grows'

MERGE (sebaceousGland {name: 'Sebaceous Gland'})
SET sebaceousGland:L1:Health:Structure,
    sebaceousGland.description = 'Oil-producing gland usually connected to hair follicles'

MERGE (sweatGland {name: 'Sweat Gland'})
SET sweatGland:L1:Health:Structure,
    sweatGland.description = 'Gland producing sweat for temperature regulation'

MERGE (nailMatrix {name: 'Nail Matrix'})
SET nailMatrix:L1:Health:Structure,
    nailMatrix.description = 'Tissue that produces nail cells'

MERGE (nailPlate {name: 'Nail Plate'})
SET nailPlate:L1:Health:Structure,
    nailPlate.description = 'Visible part of nail made of keratin'

// Connect specialized structures
MERGE (hairFollicle)-[:MAKES_UP]->(dermis)
MERGE (sebaceousGland)-[:MAKES_UP]->(dermis)
MERGE (sweatGland)-[:MAKES_UP]->(dermis)
MERGE (nailMatrix)-[:MAKES_UP]->(nails)
MERGE (nailPlate)-[:MAKES_UP]->(nails)

// Cellular Components
MERGE (keratinocytes {name: 'Keratinocytes'})
SET keratinocytes:L1:Health:Component,
    keratinocytes.description = 'Main cells of epidermis producing keratin'

MERGE (melanocytes {name: 'Melanocytes'})
SET melanocytes:L1:Health:Component,
    melanocytes.description = 'Cells producing melanin pigment'

MERGE (langerhans {name: 'Langerhans Cells'})
SET langerhans:L1:Health:Component,
    langerhans.description = 'Immune cells in epidermis'

MERGE (merkel {name: 'Merkel Cells'})
SET merkel:L1:Health:Component,
    merkel.description = 'Touch receptor cells in epidermis'

// Connect cellular components
MERGE (keratinocytes)-[:MAKES_UP]->(epidermis)
MERGE (melanocytes)-[:MAKES_UP]->(epidermis)
MERGE (langerhans)-[:MAKES_UP]->(epidermis)
MERGE (merkel)-[:MAKES_UP]->(epidermis)