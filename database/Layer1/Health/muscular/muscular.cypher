// Main System Node
MATCH (muscular {name: 'Muscular System'})

// Major Muscle Types
MERGE (skeletal {name: 'Skeletal Muscles'})
SET skeletal:L1:Health:Structure,
    skeletal.description = 'Voluntary muscles attached to bones that enable movement and maintain posture'

MERGE (smooth {name: 'Smooth Muscles'})
SET smooth:L1:Health:Structure,
    smooth.description = 'Involuntary muscles found in internal organs and blood vessels'

MERGE (cardiac {name: 'Cardiac Muscles'})
SET cardiac:L1:Health:Structure,
    cardiac.description = 'Specialized heart muscle tissue with properties of both skeletal and smooth muscle'

// Connect muscle types to system
MERGE (skeletal)-[:MAKES_UP]->(muscular)
MERGE (smooth)-[:MAKES_UP]->(muscular)
MERGE (cardiac)-[:MAKES_UP]->(muscular)

// Skeletal Muscle Components
MERGE (myofibrils {name: 'Myofibrils'})
SET myofibrils:L1:Health:Component,
    myofibrils.description = 'Cylindrical units within muscle fibers containing contractile proteins'

MERGE (sarcomere {name: 'Sarcomere'})
SET sarcomere:L1:Health:Component,
    sarcomere.description = 'Basic functional unit of muscle contraction containing actin and myosin filaments'

MERGE (fascia {name: 'Fascia'})
SET fascia:L1:Health:Tissue,
    fascia.description = 'Connective tissue that surrounds and separates muscles'

MERGE (tendon {name: 'Tendons'})
SET tendon:L1:Health:Tissue,
    tendon.description = 'Dense connective tissue that attaches muscles to bones'

// Connect components
MERGE (myofibrils)-[:MAKES_UP]->(skeletal)
MERGE (sarcomere)-[:MAKES_UP]->(myofibrils)
MERGE (fascia)-[:MAKES_UP]->(skeletal)
MERGE (tendon)-[:MAKES_UP]->(skeletal)

// Major Muscle Groups
MERGE (upperBody {name: 'Upper Body Muscles'})
SET upperBody:L1:Health:Structure,
    upperBody.description = 'Muscle groups of the arms, shoulders, chest, and upper back'

MERGE (core {name: 'Core Muscles'})
SET core:L1:Health:Structure,
    core.description = 'Muscles of the abdomen, lower back, and pelvis that stabilize the spine'

MERGE (lowerBody {name: 'Lower Body Muscles'})
SET lowerBody:L1:Health:Structure,
    lowerBody.description = 'Muscle groups of the legs, hips, and feet'

// Connect muscle groups
MERGE (upperBody)-[:MAKES_UP]->(skeletal)
MERGE (core)-[:MAKES_UP]->(skeletal)
MERGE (lowerBody)-[:MAKES_UP]->(skeletal)

// Specific Muscles
MERGE (biceps {name: 'Biceps Brachii'})
SET biceps:L1:Health:Muscle,
    biceps.description = 'Two-headed muscle on front of upper arm responsible for forearm flexion'

MERGE (quadriceps {name: 'Quadriceps Femoris'})
SET quadriceps:L1:Health:Muscle,
    quadriceps.description = 'Four-headed muscle group on front of thigh responsible for knee extension'

MERGE (abdominals {name: 'Rectus Abdominis'})
SET abdominals:L1:Health:Muscle,
    abdominals.description = 'Paired muscle running vertically along front of abdomen'

// Connect specific muscles
MERGE (biceps)-[:MAKES_UP]->(upperBody)
MERGE (quadriceps)-[:MAKES_UP]->(lowerBody)
MERGE (abdominals)-[:MAKES_UP]->(core)