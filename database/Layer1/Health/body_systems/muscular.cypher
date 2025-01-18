// Main System Node
MERGE (muscular {name: 'Muscular System'})
SET muscular:System, muscular.description = 'System responsible for movement, posture maintenance, and heat production through specialized contractile tissues'

// Major Muscle Types
MERGE (skeletal {name: 'Skeletal Muscles'})
SET skeletal:Structure, skeletal.description = 'Voluntary muscles attached to bones that enable movement and maintain posture'

MERGE (smooth {name: 'Smooth Muscles'})
SET smooth:Structure, smooth.description = 'Involuntary muscles found in internal organs and blood vessels'

MERGE (cardiac {name: 'Cardiac Muscles'})
SET cardiac:Structure, cardiac.description = 'Specialized heart muscle tissue with properties of both skeletal and smooth muscle'

// Connect muscle types to system
MERGE (muscular)-[:CONTAINS]->(skeletal)
MERGE (muscular)-[:CONTAINS]->(smooth)
MERGE (muscular)-[:CONTAINS]->(cardiac)

// Skeletal Muscle Components
MERGE (myofibrils {name: 'Myofibrils'})
SET myofibrils:Component, myofibrils.description = 'Cylindrical units within muscle fibers containing contractile proteins'

MERGE (sarcomere {name: 'Sarcomere'})
SET sarcomere:Component, sarcomere.description = 'Basic functional unit of muscle contraction containing actin and myosin filaments'

MERGE (fascia {name: 'Fascia'})
SET fascia:Tissue, fascia.description = 'Connective tissue that surrounds and separates muscles'

MERGE (tendon {name: 'Tendons'})
SET tendon:Tissue, tendon.description = 'Dense connective tissue that attaches muscles to bones'

// Connect components
MERGE (skeletal)-[:CONTAINS]->(myofibrils)
MERGE (myofibrils)-[:CONTAINS]->(sarcomere)
MERGE (skeletal)-[:CONTAINS]->(fascia)
MERGE (skeletal)-[:CONTAINS]->(tendon)

// Major Muscle Groups
MERGE (upperBody {name: 'Upper Body Muscles'})
SET upperBody:Structure, upperBody.description = 'Muscle groups of the arms, shoulders, chest, and upper back'

MERGE (core {name: 'Core Muscles'})
SET core:Structure, core.description = 'Muscles of the abdomen, lower back, and pelvis that stabilize the spine'

MERGE (lowerBody {name: 'Lower Body Muscles'})
SET lowerBody:Structure, lowerBody.description = 'Muscle groups of the legs, hips, and feet'

// Connect muscle groups
MERGE (skeletal)-[:CONTAINS]->(upperBody)
MERGE (skeletal)-[:CONTAINS]->(core)
MERGE (skeletal)-[:CONTAINS]->(lowerBody)

// Specific Muscles (examples)
MERGE (biceps {name: 'Biceps Brachii'})
SET biceps:Muscle, biceps.description = 'Two-headed muscle on front of upper arm responsible for forearm flexion'

MERGE (quadriceps {name: 'Quadriceps Femoris'})
SET quadriceps:Muscle, quadriceps.description = 'Four-headed muscle group on front of thigh responsible for knee extension'

MERGE (abdominals {name: 'Rectus Abdominis'})
SET abdominals:Muscle, abdominals.description = 'Paired muscle running vertically along front of abdomen'

// Connect specific muscles
MERGE (upperBody)-[:CONTAINS]->(biceps)
MERGE (lowerBody)-[:CONTAINS]->(quadriceps)
MERGE (core)-[:CONTAINS]->(abdominals)

// Muscle Properties
MERGE (muscleStrength {name: 'Muscle Strength'})
SET muscleStrength:Measurement, muscleStrength.description = 'Maximum force a muscle can generate',
    muscleStrength.units = 'Newtons'

MERGE (muscleEndurance {name: 'Muscle Endurance'})
SET muscleEndurance:Measurement, muscleEndurance.description = 'Ability of muscle to sustain repeated contractions',
    muscleEndurance.units = 'Time/Repetitions'

MERGE (muscleFlexibility {name: 'Muscle Flexibility'})
SET muscleFlexibility:Measurement, muscleFlexibility.description = 'Range of motion at a joint determined by muscle elasticity',
    muscleFlexibility.units = 'Degrees'

// Connect properties
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleStrength)
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleEndurance)
MERGE (muscular)-[:HAS_MEASUREMENT]->(muscleFlexibility)

// Conditions/Variations (three examples as requested)
MERGE (muscleDystrophy {name: 'Muscular Dystrophy'})
SET muscleDystrophy:Condition, muscleDystrophy.description = 'Group of genetic diseases causing progressive muscle weakness',
    muscleDystrophy.affects = 'skeletal muscles primarily',
    muscleDystrophy.types = ['Duchenne', 'Becker', 'Limb-girdle']

MERGE (fibromyalgia {name: 'Fibromyalgia'})
SET fibromyalgia:Condition, fibromyalgia.description = 'Chronic condition causing widespread muscle pain and tenderness',
    fibromyalgia.affects = 'multiple muscle groups'

MERGE (rhabdomyolysis {name: 'Rhabdomyolysis'})
SET rhabdomyolysis:Condition, rhabdomyolysis.description = 'Serious condition where damaged muscle tissue breaks down rapidly',
    rhabdomyolysis.affects = 'any skeletal muscle'

// Connect conditions
MERGE (muscular)-[:CAN_HAVE]->(muscleDystrophy)
MERGE (muscular)-[:CAN_HAVE]->(fibromyalgia)
MERGE (muscular)-[:CAN_HAVE]->(rhabdomyolysis)