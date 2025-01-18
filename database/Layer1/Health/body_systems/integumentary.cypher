// Main System Node
MERGE (integumentary {name: 'Integumentary System'})
SET integumentary:System,
    integumentary.description = 'Organ system comprising skin, hair, nails, and associated glands that forms protective barrier and regulates body temperature'

// Main Components
MERGE (skin {name: 'Skin'})
SET skin:Organ,
    skin.description = 'Largest organ of the body, providing protection, sensation, and temperature regulation'

MERGE (hair {name: 'Hair'})
SET hair:Structure,
    hair.description = 'Keratinized protein filaments growing from follicles in skin'

MERGE (nails {name: 'Nails'})
SET nails:Structure,
    nails.description = 'Protective plates of hardened keratin at fingertips and toes'

// Skin Layers
MERGE (epidermis {name: 'Epidermis'})
SET epidermis:Structure,
    epidermis.description = 'Outermost layer of skin providing barrier protection'

MERGE (dermis {name: 'Dermis'})
SET dermis:Structure,
    dermis.description = 'Middle layer containing blood vessels, nerves, and various skin structures'

MERGE (hypodermis {name: 'Hypodermis'})
SET hypodermis:Structure,
    hypodermis.description = 'Deepest layer composed mainly of adipose tissue'

// Epidermal Layers
MERGE (stratumCorneum {name: 'Stratum Corneum'})
SET stratumCorneum:Tissue,
    stratumCorneum.description = 'Outermost layer of dead, keratinized cells'

MERGE (stratumLucidum {name: 'Stratum Lucidum'})
SET stratumLucidum:Tissue,
    stratumLucidum.description = 'Clear layer present in thick skin of palms and soles'

MERGE (stratumGranulosum {name: 'Stratum Granulosum'})
SET stratumGranulosum:Tissue,
    stratumGranulosum.description = 'Layer containing keratin-producing granules'

MERGE (stratumSpinosum {name: 'Stratum Spinosum'})
SET stratumSpinosum:Tissue,
    stratumSpinosum.description = 'Layer of spiny cells providing skin strength'

MERGE (stratumBasale {name: 'Stratum Basale'})
SET stratumBasale:Tissue,
    stratumBasale.description = 'Bottom layer where new skin cells are produced'

// Dermal Components
MERGE (papillaryDermis {name: 'Papillary Dermis'})
SET papillaryDermis:Tissue,
    papillaryDermis.description = 'Upper dermal layer with papillae projecting into epidermis'

MERGE (reticularDermis {name: 'Reticular Dermis'})
SET reticularDermis:Tissue,
    reticularDermis.description = 'Lower dermal layer containing dense irregular connective tissue'

// Specialized Structures
MERGE (hairFollicle {name: 'Hair Follicle'})
SET hairFollicle:Structure,
    hairFollicle.description = 'Structure in skin from which hair grows'

MERGE (sebaceousGland {name: 'Sebaceous Gland'})
SET sebaceousGland:Structure,
    sebaceousGland.description = 'Oil-producing gland usually connected to hair follicles'

MERGE (sweatGland {name: 'Sweat Gland'})
SET sweatGland:Structure,
    sweatGland.description = 'Gland producing sweat for temperature regulation'

MERGE (nailMatrix {name: 'Nail Matrix'})
SET nailMatrix:Structure,
    nailMatrix.description = 'Tissue that produces nail cells'

MERGE (nailPlate {name: 'Nail Plate'})
SET nailPlate:Structure,
    nailPlate.description = 'Visible part of nail made of keratin'

// Cellular Components
MERGE (keratinocytes {name: 'Keratinocytes'})
SET keratinocytes:Component,
    keratinocytes.description = 'Main cells of epidermis producing keratin'

MERGE (melanocytes {name: 'Melanocytes'})
SET melanocytes:Component,
    melanocytes.description = 'Cells producing melanin pigment'

MERGE (langerhans {name: 'Langerhans Cells'})
SET langerhans:Component,
    langerhans.description = 'Immune cells in epidermis'

MERGE (merkel {name: 'Merkel Cells'})
SET merkel:Component,
    merkel.description = 'Touch receptor cells in epidermis'

// Connect structures hierarchically
MERGE (integumentary)-[:CONTAINS]->(skin)
MERGE (integumentary)-[:CONTAINS]->(hair)
MERGE (integumentary)-[:CONTAINS]->(nails)

MERGE (skin)-[:CONTAINS]->(epidermis)
MERGE (skin)-[:CONTAINS]->(dermis)
MERGE (skin)-[:CONTAINS]->(hypodermis)

// Connect epidermal layers
MERGE (epidermis)-[:CONTAINS]->(stratumCorneum)
MERGE (epidermis)-[:CONTAINS]->(stratumLucidum)
MERGE (epidermis)-[:CONTAINS]->(stratumGranulosum)
MERGE (epidermis)-[:CONTAINS]->(stratumSpinosum)
MERGE (epidermis)-[:CONTAINS]->(stratumBasale)

// Connect dermal layers
MERGE (dermis)-[:CONTAINS]->(papillaryDermis)
MERGE (dermis)-[:CONTAINS]->(reticularDermis)

// Connect specialized structures
MERGE (dermis)-[:CONTAINS]->(hairFollicle)
MERGE (dermis)-[:CONTAINS]->(sebaceousGland)
MERGE (dermis)-[:CONTAINS]->(sweatGland)

MERGE (nails)-[:CONTAINS]->(nailMatrix)
MERGE (nails)-[:CONTAINS]->(nailPlate)

// Connect cellular components
MERGE (epidermis)-[:CONTAINS]->(keratinocytes)
MERGE (epidermis)-[:CONTAINS]->(melanocytes)
MERGE (epidermis)-[:CONTAINS]->(langerhans)
MERGE (epidermis)-[:CONTAINS]->(merkel)

// Sample Conditions
MERGE (psoriasis {name: 'Psoriasis'})
SET psoriasis:Condition:Health,
    psoriasis.description = 'Chronic condition causing rapid skin cell buildup'

MERGE (melanoma {name: 'Melanoma'})
SET melanoma:Condition:Health,
    melanoma.description = 'Serious form of skin cancer developing from melanocytes'

MERGE (eczema {name: 'Eczema'})
SET eczema:Condition:Health,
    eczema.description = 'Inflammatory condition causing itchy, inflamed skin'

// Connect conditions
MERGE (skin)-[:CAN_HAVE]->(psoriasis)
MERGE (epidermis)-[:CAN_HAVE]->(melanoma)
MERGE (skin)-[:CAN_HAVE]->(eczema)

// Measurements
MERGE (skinThickness {name: 'Skin Thickness'})
SET skinThickness:Measurement,
    skinThickness.description = 'Thickness of skin layers',
    skinThickness.units = 'mm'

MERGE (melaninLevel {name: 'Melanin Level'})
SET melaninLevel:Measurement,
    melaninLevel.description = 'Amount of melanin pigment in skin',
    melaninLevel.units = 'arbitrary units'

MERGE (hydrationLevel {name: 'Hydration Level'})
SET hydrationLevel:Measurement,
    hydrationLevel.description = 'Water content of skin',
    hydrationLevel.units = 'percentage'

// Connect measurements
MERGE (skin)-[:HAS_MEASUREMENT]->(skinThickness)
MERGE (skin)-[:HAS_MEASUREMENT]->(melaninLevel)
MERGE (skin)-[:HAS_MEASUREMENT]->(hydrationLevel)