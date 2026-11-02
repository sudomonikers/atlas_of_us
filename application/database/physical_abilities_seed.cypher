// =============================================================================
// Atlas of Us — Physical Attributes sub-graph seed: abilities
// Spec: documentation/data_model/physical_attributes/physical_attributes.md
//
// One static Ability node per ability, from the abilities of the O*NET content
// model (the Fleishman taxonomy): 15 cognitive, 10 psychomotor, 9 physical and
// 12 sensory. The cognitive ones carry a second label, Cognitive. O*NET's verbal
// abilities (oral and written comprehension and expression) and quantitative
// abilities (mathematical reasoning, number facility) are skills in the Atlas,
// so they're left out here. A Person links to an
// ability with HAS_ABILITY {value, confidence}, a percentile from 0 to 1 with
// 0.5 typical, as for personality traits.
//
// `examples` are O*NET's level anchors, from low to high: things that take a
// little of the ability up to a lot of it.
//
// Source: O*NET 30.0 Database, Content Model Reference and Level Scale Anchors,
// by the U.S. Department of Labor, Employment and Training Administration,
// under CC BY 4.0 (https://www.onetcenter.org/database.html). Credit O*NET
// wherever this data is shown.
//
// Idempotent: safe to re-run. MERGE on name, everything else overwritten from
// this file on every run. id is set once, when the ability is first created, so
// it never changes on a re-run.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT ability_name_unique IF NOT EXISTS
FOR (n:Ability) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT ability_id_unique IF NOT EXISTS
FOR (n:Ability) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Abilities
// -----------------------------------------------------------------------------

UNWIND [

  // ---- cognitive ----
  { name: "Fluency of Ideas", onetId: "1.A.1.b.1", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to come up with a number of ideas about a topic (the number of ideas is important, not their quality, correctness, or creativity).",
    examples: ["Name four different uses for a screwdriver", "Think of as many ideas as possible for the name of a new company", "Identify as many strategies as possible for a company acquisition and merger"] },
  { name: "Originality", onetId: "1.A.1.b.2", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to come up with unusual or clever ideas about a given topic or situation, or to develop creative ways to solve a problem.",
    examples: ["Use a credit card to open a locked door", "Redesign job tasks to be interesting for employees", "Invent a new type of man-made fiber"] },
  { name: "Problem Sensitivity", onetId: "1.A.1.b.3", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to tell when something is wrong or is likely to go wrong. It does not involve solving the problem, only recognizing that there is a problem.",
    examples: ["Recognize that an unplugged lamp won't work", "Notice from a subtle difference in a client's mood that something is bothering them", "Recognize an illness at an early stage of a disease when there are only a few symptoms"] },
  { name: "Deductive Reasoning", onetId: "1.A.1.b.4", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to apply general rules to specific problems to produce answers that make sense.",
    examples: ["Know that a stalled car can coast downhill", "Decide what factors to consider in selecting stocks", "Design an aircraft wing using principles of aerodynamics"] },
  { name: "Inductive Reasoning", onetId: "1.A.1.b.5", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to combine pieces of information to form general rules or conclusions (includes finding a relationship among seemingly unrelated events).",
    examples: ["Decide what to wear based on the weather report", "Determine the prime suspect based on crime scene evidence", "Diagnose a disease using results of many different lab tests"] },
  { name: "Information Ordering", onetId: "1.A.1.b.6", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to arrange things or actions in a certain order or pattern according to a specific rule or set of rules (e.g., patterns of numbers, letters, words, pictures, mathematical operations).",
    examples: ["Put things in numerical order", "Follow the correct steps to make change", "Assemble a wind turbine"] },
  { name: "Category Flexibility", onetId: "1.A.1.b.7", category: "Cognitive", group: "Idea Generation and Reasoning Abilities",
    description: "The ability to generate or use different sets of rules for combining or grouping things in different ways.",
    examples: ["Sort paintbrushes based on length", "Classify flowers according to size, color, and smell", "Classify man-made fibers in terms of their characteristics, like strength or cost"] },
  { name: "Memorization", onetId: "1.A.1.d.1", category: "Cognitive", group: "Memory",
    description: "The ability to remember information such as words, numbers, pictures, and procedures.",
    examples: ["Remember the number on your bus to be sure you get back on the right one", "Recite the first names of the five people you just met", "Recite a 300-word speech after studying it for 15 minutes"] },
  { name: "Speed of Closure", onetId: "1.A.1.e.1", category: "Cognitive", group: "Perceptual Abilities",
    description: "The ability to quickly make sense of, combine, and organize information into meaningful patterns.",
    examples: ["Recognize a song after hearing only the first few notes", "Make sense of messy handwriting", "Interpret patterns on weather radar to decide if the weather is changing"] },
  { name: "Flexibility of Closure", onetId: "1.A.1.e.2", category: "Cognitive", group: "Perceptual Abilities",
    description: "The ability to identify or detect a known pattern (a figure, object, word, or sound) that is hidden in other distracting material.",
    examples: ["Detect that your phone is ringing while at a concert", "Look for a golf ball in tall grass", "Identify camouflaged animals from a moving vehicle while on a safari"] },
  { name: "Perceptual Speed", onetId: "1.A.1.e.3", category: "Cognitive", group: "Perceptual Abilities",
    description: "The ability to quickly and accurately compare similarities and differences among sets of letters, numbers, objects, pictures, or patterns. The things to be compared may be presented at the same time or one after the other. This ability also includes comparing a presented object with a remembered object.",
    examples: ["Sort mail according to ZIP codes with no time pressure", "Read five pressure indicators in 10 seconds to make sure each is within safe limits", "Inspect electrical parts for defects as they pass on a fast-moving assembly line"] },
  { name: "Spatial Orientation", onetId: "1.A.1.f.1", category: "Cognitive", group: "Spatial Abilities",
    description: "The ability to know your location in relation to the environment or to know where other objects are in relation to you.",
    examples: ["Use the floor plan to locate a store in a mall", "Find your way through a dark room without hitting anything", "Navigate an ocean voyage using a compass and landmarks"] },
  { name: "Visualization", onetId: "1.A.1.f.2", category: "Cognitive", group: "Spatial Abilities",
    description: "The ability to imagine how something will look after it is moved around or when its parts are moved or rearranged.",
    examples: ["Imagine how to place paper in a printer so that the letterhead comes out on top", "Follow a diagram to assemble a metal storage cabinet", "Anticipate future moves in a chess game"] },
  { name: "Selective Attention", onetId: "1.A.1.g.1", category: "Cognitive", group: "Attentiveness",
    description: "The ability to concentrate on a task over a period of time without being distracted.",
    examples: ["Answer a business call with coworkers talking nearby", "Watch security monitors for intruders throughout the night shift", "Study a technical manual while listening to loud construction sounds"] },
  { name: "Time Sharing", onetId: "1.A.1.g.2", category: "Cognitive", group: "Attentiveness",
    description: "The ability to shift back and forth between two or more activities or sources of information (such as speech, sounds, touch, or other sources).",
    examples: ["Listen to music while entering numbers into a spreadsheet", "Watch street signs while driving at 30 miles an hour", "Monitor radar and radio transmissions to keep track of heavy aircraft traffic"] },

  // ---- psychomotor ----
  { name: "Arm-Hand Steadiness", onetId: "1.A.2.a.1", category: "Psychomotor", group: "Fine Manipulative Abilities",
    description: "The ability to keep your hand and arm steady while moving your arm or while holding your arm and hand in one position.",
    examples: ["Light a candle", "Thread a needle", "Cut facets in a diamond"] },
  { name: "Manual Dexterity", onetId: "1.A.2.a.2", category: "Psychomotor", group: "Fine Manipulative Abilities",
    description: "The ability to quickly move your hand, your hand together with your arm, or your two hands to grasp, manipulate, or assemble objects.",
    examples: ["Screw a light bulb into a light socket", "Pack oranges in crates as quickly as possible", "Perform open heart surgery with surgical instruments"] },
  { name: "Finger Dexterity", onetId: "1.A.2.a.3", category: "Psychomotor", group: "Fine Manipulative Abilities",
    description: "The ability to make precisely coordinated movements of the fingers of one or both hands to grasp, manipulate, or assemble very small objects.",
    examples: ["Put coins in a parking meter", "Attach small dials to audio equipment on an assembly line", "Put together the inner workings of a small wrist watch"] },
  { name: "Control Precision", onetId: "1.A.2.b.1", category: "Psychomotor", group: "Control Movement Abilities",
    description: "The ability to quickly and repeatedly adjust the controls of a machine or a vehicle to exact positions.",
    examples: ["Adjust a room light with a dimmer switch", "Adjust farm tractor controls", "Drill a tooth"] },
  { name: "Multilimb Coordination", onetId: "1.A.2.b.2", category: "Psychomotor", group: "Control Movement Abilities",
    description: "The ability to coordinate two or more limbs (for example, two arms, two legs, or one leg and one arm) while sitting, standing, or lying down. It does not involve performing the activities while the whole body is in motion.",
    examples: ["Row a boat", "Operate a forklift truck in a warehouse", "Play the drum set in a jazz band"] },
  { name: "Response Orientation", onetId: "1.A.2.b.3", category: "Psychomotor", group: "Control Movement Abilities",
    description: "The ability to choose quickly between two or more movements in response to two or more different signals (lights, sounds, pictures). It includes the speed with which the correct response is started with the hand, foot, or other body part.",
    examples: ["When a doorbell and phone ring at the same time, quickly select which to answer first", "Use either the brake or gas pedal when your vehicle is skidding", "In an out-of-control commercial aircraft, react quickly to restore control"] },
  { name: "Rate Control", onetId: "1.A.2.b.4", category: "Psychomotor", group: "Control Movement Abilities",
    description: "The ability to time your movements or the movement of a piece of equipment in anticipation of changes in the speed and/or direction of a moving object or scene.",
    examples: ["Ride a bicycle alongside a jogger", "Keep up with a car that changes speed", "Shoot a duck in flight"] },
  { name: "Reaction Time", onetId: "1.A.2.c.1", category: "Psychomotor", group: "Reaction Time and Speed Abilities",
    description: "The ability to quickly respond (with the hand, finger, or foot) to a signal (sound, light, picture) when it appears.",
    examples: ["Start to slow down the car when a traffic light turns yellow", "Press a button to stop operation when a warning light goes off", "Hit the brake when a pedestrian steps in front of your car"] },
  { name: "Wrist-Finger Speed", onetId: "1.A.2.c.2", category: "Psychomotor", group: "Reaction Time and Speed Abilities",
    description: "The ability to make fast, simple, repeated movements of the fingers, hands, and wrists.",
    examples: ["Use a screwdriver to twist in a screw", "Carve roast beef in a cafeteria", "Type 90 words per minute"] },
  { name: "Speed of Limb Movement", onetId: "1.A.2.c.3", category: "Psychomotor", group: "Reaction Time and Speed Abilities",
    description: "The ability to quickly move the arms and legs.",
    examples: ["Saw through a thin piece of wood", "Swat a fly with a fly swatter", "Throw punches in a boxing match"] },

  // ---- physical ----
  { name: "Static Strength", onetId: "1.A.3.a.1", category: "Physical", group: "Physical Strength Abilities",
    description: "The ability to exert maximum muscle force to lift, push, pull, or carry objects.",
    examples: ["Push an empty shopping cart", "Pull a 40-pound sack of fertilizer across the lawn", "Lift 75-pound bags of cement onto a truck"] },
  { name: "Explosive Strength", onetId: "1.A.3.a.2", category: "Physical", group: "Physical Strength Abilities",
    description: "The ability to use short bursts of muscle force to propel oneself (as in jumping or sprinting), or to throw an object.",
    examples: ["Hit a nail with a hammer", "Jump onto a 3-foot high platform", "Throw a shot-put in a track meet"] },
  { name: "Dynamic Strength", onetId: "1.A.3.a.3", category: "Physical", group: "Physical Strength Abilities",
    description: "The ability to exert muscle force repeatedly or continuously over time. This involves muscular endurance and resistance to muscle fatigue.",
    examples: ["Use pruning shears to trim a bush", "Climb a 48-foot long ladder", "Perform a gymnastics routine using the rings"] },
  { name: "Trunk Strength", onetId: "1.A.3.a.4", category: "Physical", group: "Physical Strength Abilities",
    description: "The ability to use your abdominal and lower back muscles to support part of the body repeatedly or continuously over time without \"giving out\" or fatiguing.",
    examples: ["Sit up in an office chair", "Shovel snow for half an hour", "Do 100 sit-ups"] },
  { name: "Stamina", onetId: "1.A.3.b.1", category: "Physical", group: "Endurance",
    description: "The ability to exert yourself physically over long periods of time without getting winded or out of breath.",
    examples: ["Walk 1/4 mile", "Climb 6 flights of stairs", "Run 10 miles"] },
  { name: "Extent Flexibility", onetId: "1.A.3.c.1", category: "Physical", group: "Flexibility, Balance, and Coordination",
    description: "The ability to bend, stretch, twist, or reach with your body, arms, and/or legs.",
    examples: ["Reach to adjust the radio in a car", "Reach for a box on a high warehouse shelf", "Work under the dashboard of a car"] },
  { name: "Dynamic Flexibility", onetId: "1.A.3.c.2", category: "Physical", group: "Flexibility, Balance, and Coordination",
    description: "The ability to quickly and repeatedly bend, stretch, twist, or reach out with your body, arms, and/or legs.",
    examples: ["Hand pick a bushel of apples from a tree", "Perform a dance routine as part of a cheerleading squad", "Maneuver a kayak through swift rapids"] },
  { name: "Gross Body Coordination", onetId: "1.A.3.c.3", category: "Physical", group: "Flexibility, Balance, and Coordination",
    description: "The ability to coordinate the movement of your arms, legs, and torso together when the whole body is in motion.",
    examples: ["Get in and out of a truck", "Swim the length of a pool", "Perform a ballet dance"] },
  { name: "Gross Body Equilibrium", onetId: "1.A.3.c.4", category: "Physical", group: "Flexibility, Balance, and Coordination",
    description: "The ability to keep or regain your body balance or stay upright when in an unstable position.",
    examples: ["Stand on a ladder", "Walk on ice across a pond", "Walk on narrow beams in high-rise construction"] },

  // ---- sensory ----
  { name: "Near Vision", onetId: "1.A.4.a.1", category: "Sensory", group: "Visual Abilities",
    description: "The ability to see details at close range (within a few feet of the observer).",
    examples: ["Read indicators on the dashboard of a car", "Read the fine print of a legal document", "Detect minor defects in a diamond"] },
  { name: "Far Vision", onetId: "1.A.4.a.2", category: "Sensory", group: "Visual Abilities",
    description: "The ability to see details at a distance.",
    examples: ["Read a roadside billboard", "Read the slides on a presentation from across a room", "Detect differences in ships on the horizon"] },
  { name: "Visual Color Discrimination", onetId: "1.A.4.a.3", category: "Sensory", group: "Visual Abilities",
    description: "The ability to match or detect differences between colors, including shades of color and brightness.",
    examples: ["Separate laundry into colors and whites", "Trace electrical circuits marked by various colored wires", "Paint a color portrait of a person"] },
  { name: "Night Vision", onetId: "1.A.4.a.4", category: "Sensory", group: "Visual Abilities",
    description: "The ability to see under low-light conditions.",
    examples: ["Read street signs at dusk (just after sunset)", "Read a book in a dimly lit setting", "Find your way through the woods on a moonless night"] },
  { name: "Peripheral Vision", onetId: "1.A.4.a.5", category: "Sensory", group: "Visual Abilities",
    description: "The ability to see objects or movement of objects to one's side when the eyes are looking ahead.",
    examples: ["Keep in step while marching in a band", "Be aware of the location of your teammates while dribbling a basketball", "Distinguish a teammate from a competitor passing by in a car race"] },
  { name: "Depth Perception", onetId: "1.A.4.a.6", category: "Sensory", group: "Visual Abilities",
    description: "The ability to judge which of several objects is closer or farther away from you, or to judge the distance between you and an object.",
    examples: ["Merge a car into traffic on a city street", "Operate a crane to move materials from a truck bed to the ground", "Throw a long pass to a closely guarded teammate"] },
  { name: "Glare Sensitivity", onetId: "1.A.4.a.7", category: "Sensory", group: "Visual Abilities",
    description: "The ability to see objects in the presence of a glare or bright lighting.",
    examples: ["Drive on a familiar road on a cloudy day", "See boats on the horizon when sailing", "Snow ski in bright sunlight"] },
  { name: "Hearing Sensitivity", onetId: "1.A.4.b.1", category: "Sensory", group: "Auditory and Speech Abilities",
    description: "The ability to detect or tell the differences between sounds that vary in pitch and loudness.",
    examples: ["Notice a doorbell ringing", "Diagnose what's wrong with a car engine from its sound", "Tune an orchestra"] },
  { name: "Auditory Attention", onetId: "1.A.4.b.2", category: "Sensory", group: "Auditory and Speech Abilities",
    description: "The ability to focus on a single source of sound in the presence of other distracting sounds.",
    examples: ["Listen to a lecture while people nearby are talking", "Listen for your flight announcement at a busy airport", "Listen to instructions from a coworker in a noisy saw mill"] },
  { name: "Sound Localization", onetId: "1.A.4.b.3", category: "Sensory", group: "Auditory and Speech Abilities",
    description: "The ability to tell the direction from which a sound originated.",
    examples: ["Listen to a sound system to determine which speaker is working", "Find a ringing phone in an unfamiliar apartment", "Determining the direction of an emergency vehicle from the sound of the siren"] },
  { name: "Speech Recognition", onetId: "1.A.4.b.4", category: "Sensory", group: "Auditory and Speech Abilities",
    description: "The ability to identify and understand the speech of another person.",
    examples: ["Recognize the voice of a coworker", "Identify a former customer's voice over the phone", "Understand a speech presented by someone with an unfamiliar accent"] },
  { name: "Speech Clarity", onetId: "1.A.4.b.5", category: "Sensory", group: "Auditory and Speech Abilities",
    description: "The ability to speak clearly so others can understand you.",
    examples: ["Call numbers in a bingo game", "Make stadium-wide announcements during a sporting event", "Give a lecture to a large audience"] }

] AS a
MERGE (n:Ability {name: a.name})
ON CREATE SET n.id = randomUUID()
SET n.onetId = a.onetId,
    n.category = a.category,
    n.group = a.group,
    n.description = a.description,
    n.examples = a.examples;


// -----------------------------------------------------------------------------
// 2. Cognitive label
// -----------------------------------------------------------------------------

MATCH (n:Ability)
WHERE n.category = "Cognitive"
SET n:Cognitive;
