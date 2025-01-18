// Main System Node
MERGE (muscular {name: 'Muscular System'})
SET muscular:System, muscular.description = 'System responsible for movement, posture maintenance, and heat production through specialized contractile tissues'

// Major Muscle Types
MERGE (skeletal {name: 'Skeletal Muscles'})
SET skeletal:Structure:Health, skeletal.description = 'Voluntary muscles attached to bones that enable movement and maintain posture'

MERGE (smooth {name: 'Smooth Muscles'})
SET smooth:Structure:Health, smooth.description = 'Involuntary muscles found in internal organs and blood vessels'

MERGE (cardiac {name: 'Cardiac Muscles'})
SET cardiac:Structure:Health, cardiac.description = 'Specialized heart muscle tissue with properties of both skeletal and smooth muscle'

// Connect muscle types to system
MERGE (muscular)-[:CONTAINS]->(skeletal)
MERGE (muscular)-[:CONTAINS]->(smooth)
MERGE (muscular)-[:CONTAINS]->(cardiac)

// Skeletal Muscle Components
MERGE (myofibrils {name: 'Myofibrils'})
SET myofibrils:Component:Health, myofibrils.description = 'Cylindrical units within muscle fibers containing contractile proteins'

MERGE (sarcomere {name: 'Sarcomere'})
SET sarcomere:Component:Health, sarcomere.description = 'Basic functional unit of muscle contraction containing actin and myosin filaments'

MERGE (fascia {name: 'Fascia'})
SET fascia:Tissue:Health, fascia.description = 'Connective tissue that surrounds and separates muscles'

MERGE (tendon {name: 'Tendons'})
SET tendon:Tissue:Health, tendon.description = 'Dense connective tissue that attaches muscles to bones'

// Connect components
MERGE (skeletal)-[:CONTAINS]->(myofibrils)
MERGE (myofibrils)-[:CONTAINS]->(sarcomere)
MERGE (skeletal)-[:CONTAINS]->(fascia)
MERGE (skeletal)-[:CONTAINS]->(tendon)

// Major Muscle Groups
MERGE (upperBody {name: 'Upper Body Muscles'})
SET upperBody:Structure:Health, upperBody.description = 'Muscle groups of the arms, shoulders, chest, and upper back'

MERGE (core {name: 'Core Muscles'})
SET core:Structure:Health, core.description = 'Muscles of the abdomen, lower back, and pelvis that stabilize the spine'

MERGE (lowerBody {name: 'Lower Body Muscles'})
SET lowerBody:Structure:Health, lowerBody.description = 'Muscle groups of the legs, hips, and feet'

// Connect muscle groups
MERGE (skeletal)-[:CONTAINS]->(upperBody)
MERGE (skeletal)-[:CONTAINS]->(core)
MERGE (skeletal)-[:CONTAINS]->(lowerBody)

// Specific Muscles (examples)
MERGE (biceps {name: 'Biceps Brachii'})
SET biceps:Muscle:Health, biceps.description = 'Two-headed muscle on front of upper arm responsible for forearm flexion'

MERGE (quadriceps {name: 'Quadriceps Femoris'})
SET quadriceps:Muscle:Health, quadriceps.description = 'Four-headed muscle group on front of thigh responsible for knee extension'

MERGE (abdominals {name: 'Rectus Abdominis'})
SET abdominals:Muscle:Health, abdominals.description = 'Paired muscle running vertically along front of abdomen'

// Connect specific muscles
MERGE (upperBody)-[:CONTAINS]->(biceps)
MERGE (lowerBody)-[:CONTAINS]->(quadriceps)
MERGE (core)-[:CONTAINS]->(abdominals)

// Muscle Properties
MERGE (muscleStrength {name: 'Muscle Strength'})
SET muscleStrength:Measurement:Health, muscleStrength.description = 'Maximum force a muscle can generate',
    muscleStrength.units = 'Newtons'

MERGE (muscleEndurance {name: 'Muscle Endurance'})
SET muscleEndurance:Measurement:Health, muscleEndurance.description = 'Ability of muscle to sustain repeated contractions',
    muscleEndurance.units = 'Time/Repetitions'

MERGE (muscleFlexibility {name: 'Muscle Flexibility'})
SET muscleFlexibility:Measurement:Health, muscleFlexibility.description = 'Range of motion at a joint determined by muscle elasticity',
    muscleFlexibility.units = 'Degrees'

// Connect properties
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleStrength)
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleEndurance)
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleFlexibility)

// Conditions/Variations (three examples as requested)
MERGE (muscleDystrophy {name: 'Muscular Dystrophy'})
SET muscleDystrophy:Condition:Health, muscleDystrophy.description = 'Group of genetic diseases causing progressive muscle weakness',
    muscleDystrophy.affects = 'skeletal muscles primarily',
    muscleDystrophy.types = ['Duchenne', 'Becker', 'Limb-girdle']

MERGE (fibromyalgia {name: 'Fibromyalgia'})
SET fibromyalgia:Condition:Health, fibromyalgia.description = 'Chronic condition causing widespread muscle pain and tenderness',
    fibromyalgia.affects = 'multiple muscle groups'

MERGE (rhabdomyolysis {name: 'Rhabdomyolysis'})
SET rhabdomyolysis:Condition:Health, rhabdomyolysis.description = 'Serious condition where damaged muscle tissue breaks down rapidly',
    rhabdomyolysis.affects = 'any skeletal muscle'

// Connect conditions
MERGE (muscular)-[:CAN_HAVE]->(muscleDystrophy)
MERGE (muscular)-[:CAN_HAVE]->(fibromyalgia)
MERGE (muscular)-[:CAN_HAVE]->(rhabdomyolysis)