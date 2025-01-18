// Main System Node
MERGE (skeletal {name: 'Skeletal System'})
SET skeletal:System, skeletal.description = 'Framework of bones and connective tissues that provides structural support, protection for organs, and enables movement'

// Major Bone Categories
MERGE (axialSkeleton {name: 'Axial Skeleton'})
SET axialSkeleton:Structure:Health, axialSkeleton.description = 'Central core of skeleton including skull, vertebral column, and rib cage'

MERGE (appendicularSkeleton {name: 'Appendicular Skeleton'})
SET appendicularSkeleton:Structure:Health, appendicularSkeleton.description = 'Bones of upper and lower limbs, shoulder girdle, and pelvic girdle'

// Connect major categories to system
MERGE (skeletal)-[:CONTAINS]->(axialSkeleton)
MERGE (skeletal)-[:CONTAINS]->(appendicularSkeleton)

// Axial Skeleton Components
MERGE (skull {name: 'Skull'})
SET skull:Structure:Health, skull.description = 'Bony framework of the head consisting of cranial and facial bones'

MERGE (vertebralColumn {name: 'Vertebral Column'})
SET vertebralColumn:Structure:Health, vertebralColumn.description = 'Series of vertebrae forming the spinal column, protecting the spinal cord'

MERGE (ribCage {name: 'Rib Cage'})
SET ribCage:Structure:Health, ribCage.description = 'Protective cage formed by ribs, sternum, and thoracic vertebrae'

// Connect axial components
MERGE (axialSkeleton)-[:CONTAINS]->(skull)
MERGE (axialSkeleton)-[:CONTAINS]->(vertebralColumn)
MERGE (axialSkeleton)-[:CONTAINS]->(ribCage)

// Appendicular Skeleton Components
MERGE (upperLimbs {name: 'Upper Limbs'})
SET upperLimbs:Structure:Health, upperLimbs.description = 'Arms, including humerus, radius, ulna, and hand bones'

MERGE (lowerLimbs {name: 'Lower Limbs'})
SET lowerLimbs:Structure:Health, lowerLimbs.description = 'Legs, including femur, tibia, fibula, and foot bones'

MERGE (shoulderGirdle {name: 'Shoulder Girdle'})
SET shoulderGirdle:Structure:Health, shoulderGirdle.description = 'Connects upper limbs to axial skeleton, includes clavicle and scapula'

MERGE (pelvicGirdle {name: 'Pelvic Girdle'})
SET pelvicGirdle:Structure:Health, pelvicGirdle.description = 'Connects lower limbs to axial skeleton, formed by hip bones'

// Connect appendicular components
MERGE (appendicularSkeleton)-[:CONTAINS]->(upperLimbs)
MERGE (appendicularSkeleton)-[:CONTAINS]->(lowerLimbs)
MERGE (appendicularSkeleton)-[:CONTAINS]->(shoulderGirdle)
MERGE (appendicularSkeleton)-[:CONTAINS]->(pelvicGirdle)

// Bone Tissue Components
MERGE (compactBone {name: 'Compact Bone'})
SET compactBone:Tissue:Health, compactBone.description = 'Dense, solid bone tissue forming outer layer of bones'

MERGE (spongyBone {name: 'Spongy Bone'})
SET spongyBone:Tissue:Health, spongyBone.description = 'Lightweight, honeycomb-structured bone tissue containing red marrow'

MERGE (periosteum {name: 'Periosteum'})
SET periosteum:Tissue:Health, periosteum.description = 'Tough membrane covering outer bone surface, containing nerves and blood vessels'

MERGE (boneMarrow {name: 'Bone Marrow'})
SET boneMarrow:Tissue:Health, boneMarrow.description = 'Soft tissue inside bones, responsible for blood cell production'

// Connect tissues to system
MERGE (skeletal)-[:CONTAINS]->(compactBone)
MERGE (skeletal)-[:CONTAINS]->(spongyBone)
MERGE (skeletal)-[:CONTAINS]->(periosteum)
MERGE (skeletal)-[:CONTAINS]->(boneMarrow)

// Joint Components
MERGE (synovialJoint {name: 'Synovial Joints'})
SET synovialJoint:Structure:Health, synovialJoint.description = 'Freely movable joints containing synovial fluid'

MERGE (cartilage {name: 'Articular Cartilage'})
SET cartilage:Tissue:Health, cartilage.description = 'Smooth tissue covering joint surfaces, reduces friction'

MERGE (ligaments {name: 'Ligaments'})
SET ligaments:Tissue:Health, ligaments.description = 'Tough bands of connective tissue connecting bones at joints'

// Connect joint components
MERGE (skeletal)-[:CONTAINS]->(synovialJoint)
MERGE (synovialJoint)-[:CONTAINS]->(cartilage)
MERGE (synovialJoint)-[:CONTAINS]->(ligaments)

// Example Conditions/Variations
MERGE (osteoporosis {name: 'Osteoporosis'})
SET osteoporosis:Condition:Health, osteoporosis.description = 'Progressive bone disease characterized by decreased bone density',
    osteoporosis.affects = 'system-wide',
    osteoporosis.measurements = ['bone density']

MERGE (scoliosis {name: 'Scoliosis'})
SET scoliosis:Condition:Health, scoliosis.description = 'Abnormal lateral curvature of the spine',
    scoliosis.affects = 'vertebral column',
    scoliosis.measurements = ['Cobb angle']

MERGE (osteoarthritis {name: 'Osteoarthritis'})
SET osteoarthritis:Condition:Health, osteoarthritis.description = 'Degenerative joint disease causing cartilage breakdown',
    osteoarthritis.affects = 'synovial joints',
    osteoarthritis.types = ['primary', 'secondary']

// Connect conditions to appropriate structures
MERGE (skeletal)-[:CAN_HAVE]->(osteoporosis)
MERGE (vertebralColumn)-[:CAN_HAVE]->(scoliosis)
MERGE (synovialJoint)-[:CAN_HAVE]->(osteoarthritis)

// Measurements
MERGE (boneDensity {name: 'Bone Density'})
SET boneDensity:Measurement, boneDensity.description = 'Measure of bone mineral content',
    boneDensity.units = 'g/cm²',
    boneDensity.normalRange = 'T-score between +1 and -1'

MERGE (jointRange {name: 'Joint Range of Motion'})
SET jointRange:Measurement, jointRange.description = 'Maximum movement range of a joint',
    jointRange.units = 'degrees',
    jointRange.normalRange = 'varies by joint'

// Connect measurements
MERGE (skeletal)-[:HAS_MEASUREMENT]->(boneDensity)
MERGE (synovialJoint)-[:HAS_MEASUREMENT]->(jointRange)