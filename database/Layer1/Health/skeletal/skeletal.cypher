// Main System Node
MERGE (skeletal {name: 'Skeletal System'})
SET skeletal:L1:Health:System, skeletal.description = 'Framework of bones and connective tissues that provides structural support, protection for organs, and enables movement'

// Major Bone Categories
MERGE (axialSkeleton {name: 'Axial Skeleton'})
SET axialSkeleton:L1:Health:Structure, axialSkeleton.description = 'Central core of skeleton including skull, vertebral column, and rib cage'

MERGE (appendicularSkeleton {name: 'Appendicular Skeleton'})
SET appendicularSkeleton:L1:Health:Structure, appendicularSkeleton.description = 'Bones of upper and lower limbs, shoulder girdle, and pelvic girdle'

// Connect major categories to system
MERGE (axialSkeleton)-[:MAKES_UP]->(skeletal)
MERGE (appendicularSkeleton)-[:MAKES_UP]->(skeletal)

// Axial Skeleton Components
MERGE (skull {name: 'Skull'})
SET skull:L1:Health:Structure, skull.description = 'Bony framework of the head consisting of cranial and facial bones'

MERGE (vertebralColumn {name: 'Vertebral Column'})
SET vertebralColumn:L1:Health:Structure, vertebralColumn.description = 'Series of vertebrae forming the spinal column, protecting the spinal cord'

MERGE (ribCage {name: 'Rib Cage'})
SET ribCage:L1:Health:Structure, ribCage.description = 'Protective cage formed by ribs, sternum, and thoracic vertebrae'

// Connect axial components
MERGE (skull)-[:MAKES_UP]->(axialSkeleton)
MERGE (vertebralColumn)-[:MAKES_UP]->(axialSkeleton)
MERGE (ribCage)-[:MAKES_UP]->(axialSkeleton)

// Appendicular Skeleton Components
MERGE (upperLimbs {name: 'Upper Limbs'})
SET upperLimbs:L1:Health:Structure, upperLimbs.description = 'Arms, including humerus, radius, ulna, and hand bones'

MERGE (lowerLimbs {name: 'Lower Limbs'})
SET lowerLimbs:L1:Health:Structure, lowerLimbs.description = 'Legs, including femur, tibia, fibula, and foot bones'

MERGE (shoulderGirdle {name: 'Shoulder Girdle'})
SET shoulderGirdle:L1:Health:Structure, shoulderGirdle.description = 'Connects upper limbs to axial skeleton, includes clavicle and scapula'

MERGE (pelvicGirdle {name: 'Pelvic Girdle'})
SET pelvicGirdle:L1:Health:Structure, pelvicGirdle.description = 'Connects lower limbs to axial skeleton, formed by hip bones'

// Connect appendicular components
MERGE (upperLimbs)-[:MAKES_UP]->(appendicularSkeleton)
MERGE (lowerLimbs)-[:MAKES_UP]->(appendicularSkeleton)
MERGE (shoulderGirdle)-[:MAKES_UP]->(appendicularSkeleton)
MERGE (pelvicGirdle)-[:MAKES_UP]->(appendicularSkeleton)

// Bone Tissue Components
MERGE (compactBone {name: 'Compact Bone'})
SET compactBone:L1:Health:Tissue, compactBone.description = 'Dense, solid bone tissue forming outer layer of bones'

MERGE (spongyBone {name: 'Spongy Bone'})
SET spongyBone:L1:Health:Tissue, spongyBone.description = 'Lightweight, honeycomb-structured bone tissue containing red marrow'

MERGE (periosteum {name: 'Periosteum'})
SET periosteum:L1:Health:Tissue, periosteum.description = 'Tough membrane covering outer bone surface, containing nerves and blood vessels'

MERGE (boneMarrow {name: 'Bone Marrow'})
SET boneMarrow:L1:Health:Tissue, boneMarrow.description = 'Soft tissue inside bones, responsible for blood cell production'

// Connect tissues to system
MERGE (compactBone)-[:MAKES_UP]->(skeletal)
MERGE (spongyBone)-[:MAKES_UP]->(skeletal)
MERGE (periosteum)-[:MAKES_UP]->(skeletal)
MERGE (boneMarrow)-[:MAKES_UP]->(skeletal)

// Joint Components
MERGE (synovialJoint {name: 'Synovial Joints'})
SET synovialJoint:L1:Health:Structure, synovialJoint.description = 'Freely movable joints containing synovial fluid'

MERGE (cartilage {name: 'Articular Cartilage'})
SET cartilage:L1:Health:Tissue, cartilage.description = 'Smooth tissue covering joint surfaces, reduces friction'

MERGE (ligaments {name: 'Ligaments'})
SET ligaments:L1:Health:Tissue, ligaments.description = 'Tough bands of connective tissue connecting bones at joints'

// Connect joint components
MERGE (synovialJoint)-[:MAKES_UP]->(skeletal)
MERGE (cartilage)-[:MAKES_UP]->(synovialJoint)
MERGE (ligaments)-[:MAKES_UP]->(synovialJoint)