MATCH (p:Person {username: 'sudomoniker'})
WITH p

// Knowledge
MERGE (k1:L1:Knowledge {name: 'How to Program'})
SET 
    k1.description = '',
    k1.aiGenerated = false, 
    k1.author = 'andrew link', 
    k1.embedding = [], 
    k1.image = 'node_images/how_to_program.jpg'
MERGE (p)-[:KNOWS {level: 'Create'}]->(k1)

MERGE (k2:L1:Knowledge {name: 'Nutrition'})
SET 
    k2.description = '',
    k2.aiGenerated = false, 
    k2.author = 'andrew link', 
    k2.embedding = [], 
    k2.image = 'node_images/nutrition.jpg'
MERGE (p)-[:KNOWS {level: 'Analyze'}]->(k2)

MERGE (k3:L1:Knowledge {name: 'Exercise Science'})
SET 
    k3.description = '',
    k3.aiGenerated = false, 
    k3.author = 'andrew link', 
    k3.embedding = [], 
    k3.image = 'node_images/exercise_science.jpg'
MERGE (p)-[:KNOWS {level: 'Analyze'}]->(k3)

MERGE (k4:L1:Knowledge {name: 'Chess'})
SET 
    k4.description = '',
    k4.aiGenerated = false, 
    k4.author = 'andrew link', 
    k4.embedding = [], 
    k4.image = 'node_images/chess.jpg'
MERGE (p)-[:KNOWS {level: 'Apply'}]->(k4)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Analyze', reason: ''}]->(k4)

MERGE (k5:L1:Knowledge {name: 'Philosophy'})
SET 
    k5.description = '',
    k5.aiGenerated = false, 
    k5.author = 'andrew link', 
    k5.embedding = [], 
    k5.image = 'node_images/philosophy.jpg'
MERGE (p)-[:KNOWS {level: 'Understand'}]->(k5)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Create', reason: ''}]->(k5)

MERGE (k6:L1:Knowledge {name: 'General Education'})
SET 
    k6.description = '',
    k6.aiGenerated = false, 
    k6.author = 'andrew link', 
    k6.embedding = [], 
    k6.image = 'node_images/general_education.jpg'
MERGE (p)-[:KNOWS {level: 'Apply'}]->(k6)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Evaluate', reason: ''}]->(k6)

FOREACH (sub IN ['Mathematics','Science','English','Reading','Writing','Spanish','History','Social Studies','Psychology'] |
  MERGE (s:L1:Knowledge {name: sub})
  SET 
      s.description = '',
      s.aiGenerated = false, 
      s.author = 'andrew link', 
      s.embedding = [], 
      s.image = 'node_images/' + toLower(replace(sub, ' ', '_')) + '.jpg'
  MERGE (k6)-[:CONTAINS]->(s)
)

MERGE (k7:L1:Knowledge {name: 'Chinese Grammar'})
SET 
    k7.description = '',
    k7.aiGenerated = false, 
    k7.author = 'andrew link', 
    k7.embedding = [], 
    k7.image = 'node_images/chinese_grammar.jpg'
MERGE (p)-[:KNOWS {level: 'Understand'}]->(k7)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Analyze', reason: ''}]->(k7)

MERGE (k8:L1:Knowledge {name: 'Chinese Words'})
SET 
    k8.description = '',
    k8.aiGenerated = false, 
    k8.author = 'andrew link', 
    k8.embedding = [], 
    k8.image = 'node_images/chinese_words.jpg'
MERGE (p)-[:KNOWS {level: 'Understand'}]->(k8)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Analyze', reason: ''}]->(k8)

MERGE (k9:L1:Knowledge {name: 'Spanish Grammar'})
SET 
    k9.description = '',
    k9.aiGenerated = false, 
    k9.author = 'andrew link', 
    k9.embedding = [], 
    k9.image = 'node_images/spanish_grammar.jpg'
MERGE (p)-[:KNOWS {level: 'Understand'}]->(k9)

MERGE (k10:L1:Knowledge {name: 'Spanish Words'})
SET 
    k10.description = '',
    k10.aiGenerated = false, 
    k10.author = 'andrew link', 
    k10.embedding = [], 
    k10.image = 'node_images/spanish_words.jpg'
MERGE (p)-[:KNOWS {level: 'Understand'}]->(k10)

MERGE (k11:L1:Knowledge {name: 'English Grammar'})
SET 
    k11.description = '',
    k11.aiGenerated = false, 
    k11.author = 'andrew link', 
    k11.embedding = [], 
    k11.image = 'node_images/english_grammar.jpg'
MERGE (p)-[:KNOWS {level: 'Create'}]->(k11)

MERGE (k12:L1:Knowledge {name: 'English Words'})
SET 
    k12.description = '',
    k12.aiGenerated = false, 
    k12.author = 'andrew link', 
    k12.embedding = [], 
    k12.image = 'node_images/english_words.jpg'
MERGE (p)-[:KNOWS {level: 'Create'}]->(k12)

MERGE (k13:L1:Knowledge {name: 'Mixology (cocktails)'})
SET 
    k13.description = '',
    k13.aiGenerated = false, 
    k13.author = 'andrew link', 
    k13.embedding = [], 
    k13.image = 'node_images/mixology_(cocktails).jpg'
MERGE (p)-[:KNOWS {level: 'Create'}]->(k13)

MERGE (k14:L1:Knowledge {name: 'League of Legends Esports'})
SET 
    k14.description = '',
    k14.aiGenerated = false, 
    k14.author = 'andrew link', 
    k14.embedding = [], 
    k14.image = 'node_images/league_of_legends_esports.jpg'
MERGE (p)-[:KNOWS {level: 'Evaluate'}]->(k14)
MERGE (p)-[:WANTS_TO_LEARN {level: 'Create', reason: ''}]->(k14)

// Pursuits
MERGE (pu2:L1:Pursuit {name: 'Chess'})
SET 
    pu2.description = '',
    pu2.aiGenerated = false, 
    pu2.author = 'andrew link', 
    pu2.embedding = [], 
    pu2.image = 'node_images/chess.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu2)

MERGE (pu3:L1:Pursuit {name: 'Muay Thai'})
SET 
    pu3.description = '',
    pu3.aiGenerated = false, 
    pu3.author = 'andrew link', 
    pu3.embedding = [], 
    pu3.image = 'node_images/muay_thai.jpg'
MERGE (p)-[:USED_TO_PURSUE {total_hours: 20}]->(pu3)
MERGE (p)-[:WANTS_TO_PURSUE {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu3)

MERGE (pu4:L1:Pursuit {name: 'Photography'})
SET 
    pu4.description = '',
    pu4.aiGenerated = false, 
    pu4.author = 'andrew link', 
    pu4.embedding = [], 
    pu4.image = 'node_images/photography.jpg'
MERGE (p)-[:USED_TO_PURSUE {total_hours: 20}]->(pu4)

MERGE (pu5:L1:Pursuit {name: 'Cocktail Making'})
SET 
    pu5.description = '',
    pu5.aiGenerated = false, 
    pu5.author = 'andrew link', 
    pu5.embedding = [], 
    pu5.image = 'node_images/cocktail_making.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu5)

MERGE (pu6:L1:Pursuit {name: 'Cooking'})
SET 
    pu6.description = '',
    pu6.aiGenerated = false, 
    pu6.author = 'andrew link', 
    pu6.embedding = [], 
    pu6.image = 'node_images/cooking.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu6)

MERGE (pu7:L1:Pursuit {name: 'Being a good husband'})
SET 
    pu7.description = '',
    pu7.aiGenerated = false, 
    pu7.author = 'andrew link', 
    pu7.embedding = [], 
    pu7.image = 'node_images/being_a_good_husband.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'day', hours_per_frequency_unit: 1}]->(pu7)

MERGE (pu8:L1:Pursuit {name: 'Reading'})
SET 
    pu8.description = '',
    pu8.aiGenerated = false, 
    pu8.author = 'andrew link', 
    pu8.embedding = [], 
    pu8.image = 'node_images/reading.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 5}]->(pu8)

MERGE (pu9:L1:Pursuit {name: 'Video Games'})
SET 
    pu9.description = '',
    pu9.aiGenerated = false, 
    pu9.author = 'andrew link', 
    pu9.embedding = [], 
    pu9.image = 'node_images/video_games.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 3, wants_to_stop: true}]->(pu9)

MERGE (pu10:L1:Pursuit {name: 'Watching Esports'})
SET 
    pu10.description = '',
    pu10.aiGenerated = false, 
    pu10.author = 'andrew link', 
    pu10.embedding = [], 
    pu10.image = 'node_images/watching_esports.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 5, wants_to_stop: true}]->(pu10)

MERGE (pu11:L1:Pursuit {name: 'working out'})
SET 
    pu11.description = '',
    pu11.aiGenerated = false, 
    pu11.author = 'andrew link', 
    pu11.embedding = [], 
    pu11.image = 'node_images/working_out.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 5}]->(pu11)

MERGE (pu12:L1:Pursuit {name: 'Self-Actualization'})
SET 
    pu12.description = '',
    pu12.aiGenerated = false, 
    pu12.author = 'andrew link', 
    pu12.embedding = [], 
    pu12.image = 'node_images/self_actualization.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 5}]->(pu12)

MERGE (pu13:L1:Pursuit {name: 'Taking care of dog'})
SET 
    pu13.description = '',
    pu13.aiGenerated = false, 
    pu13.author = 'andrew link', 
    pu13.embedding = [], 
    pu13.image = 'node_images/taking_care_of_dog.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 5}]->(pu13)

MERGE (pu14:L1:Pursuit {name: 'Cleaning'})
SET 
    pu14.description = '',
    pu14.aiGenerated = false, 
    pu14.author = 'andrew link', 
    pu14.embedding = [], 
    pu14.image = 'node_images/cleaning.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 3}]->(pu14)

MERGE (pu15:L1:Pursuit {name: 'Debate'})
SET 
    pu15.description = '',
    pu15.aiGenerated = false, 
    pu15.author = 'andrew link', 
    pu15.embedding = [], 
    pu15.image = 'node_images/debate.jpg'
MERGE (p)-[:WANTS_TO_PURSUE {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu15)

MERGE (pu16:L1:Pursuit {name: 'Travel'})
SET 
    pu16.description = '',
    pu16.aiGenerated = false, 
    pu16.author = 'andrew link', 
    pu16.embedding = [], 
    pu16.image = 'node_images/travel.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'year', hours_per_frequency_unit: 360}]->(pu16)

MERGE (pu17:L1:Pursuit {name: 'Jump rope'})
SET 
    pu17.description = '',
    pu17.aiGenerated = false, 
    pu17.author = 'andrew link', 
    pu17.embedding = [], 
    pu17.image = 'node_images/jump_rope.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu17)

MERGE (pu18:L1:Pursuit {name: 'Stretching'})
SET 
    pu18.description = '',
    pu18.aiGenerated = false, 
    pu18.author = 'andrew link', 
    pu18.embedding = [], 
    pu18.image = 'node_images/stretching.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu18)

MERGE (pu19:L1:Pursuit {name: 'listening to music'})
SET 
    pu19.description = '',
    pu19.aiGenerated = false, 
    pu19.author = 'andrew link', 
    pu19.embedding = [], 
    pu19.image = 'node_images/listening_to_music.jpg'
MERGE (p)-[:PURSUES {frequency_unit: 'week', hours_per_frequency_unit: 1}]->(pu19)
 
// Skills
// Skills
MERGE (s1:L1:Skill {name: 'Speak Chinese'})
SET 
    s1.description = '',
    s1.aiGenerated = false, 
    s1.author = 'andrew link', 
    s1.embedding = [], 
    s1.image = 'node_images/speak_chinese.jpg'
MERGE (p)-[:HAS_SKILL {level: 'novice'}]->(s1)
MERGE (p)-[:WANTS_SKILL {level: 'proficiency'}]->(s1)

MERGE (s2:L1:Skill {name: 'Understand Chinese'})
SET 
    s2.description = '',
    s2.aiGenerated = false, 
    s2.author = 'andrew link', 
    s2.embedding = [], 
    s2.image = 'node_images/understand_chinese.jpg'
MERGE (p)-[:HAS_SKILL {level: 'novice'}]->(s2)
MERGE (p)-[:WANTS_SKILL {level: 'proficiency'}]->(s2)

MERGE (s3:L1:Skill {name: 'Speak Spanish'})
SET 
    s3.description = '',
    s3.aiGenerated = false, 
    s3.author = 'andrew link', 
    s3.embedding = [], 
    s3.image = 'node_images/speak_spanish.jpg'
MERGE (p)-[:HAS_SKILL {level: 'proficiency'}]->(s3)

MERGE (s4:L1:Skill {name: 'Understand Spanish'})
SET 
    s4.description = '',
    s4.aiGenerated = false, 
    s4.author = 'andrew link', 
    s4.embedding = [], 
    s4.image = 'node_images/understand_spanish.jpg'
MERGE (p)-[:HAS_SKILL {level: 'proficiency'}]->(s4)

MERGE (s5:L1:Skill {name: 'Read Spanish'})
SET 
    s5.description = '',
    s5.aiGenerated = false, 
    s5.author = 'andrew link', 
    s5.embedding = [], 
    s5.image = 'node_images/read_spanish.jpg'
MERGE (p)-[:HAS_SKILL {level: 'proficiency'}]->(s5)

MERGE (s6:L1:Skill {name: 'Write Spanish'})
SET 
    s6.description = '',
    s6.aiGenerated = false, 
    s6.author = 'andrew link', 
    s6.embedding = [], 
    s6.image = 'node_images/write_spanish.jpg'
MERGE (p)-[:HAS_SKILL {level: 'proficiency'}]->(s6)

MERGE (s7:L1:Skill {name: 'Speak English'})
SET 
    s7.description = '',
    s7.aiGenerated = false, 
    s7.author = 'andrew link', 
    s7.embedding = [], 
    s7.image = 'node_images/speak_english.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s7)

MERGE (s8:L1:Skill {name: 'Understand English'})
SET 
    s8.description = '',
    s8.aiGenerated = false, 
    s8.author = 'andrew link', 
    s8.embedding = [], 
    s8.image = 'node_images/understand_english.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s8)

MERGE (s9:L1:Skill {name: 'Read English'})
SET 
    s9.description = '',
    s9.aiGenerated = false, 
    s9.author = 'andrew link', 
    s9.embedding = [], 
    s9.image = 'node_images/read_english.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s9)

MERGE (s10:L1:Skill {name: 'Write English'})
SET 
    s10.description = '',
    s10.aiGenerated = false, 
    s10.author = 'andrew link', 
    s10.embedding = [], 
    s10.image = 'node_images/write_english.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s10)

MERGE (s11:L1:Skill {name: 'problem-solving'})
SET 
    s11.description = '',
    s11.aiGenerated = false, 
    s11.author = 'andrew link', 
    s11.embedding = [], 
    s11.image = 'node_images/problem_solving.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s11)

MERGE (s12:L1:Skill {name: 'analytical thinking'})
SET 
    s12.description = '',
    s12.aiGenerated = false, 
    s12.author = 'andrew link', 
    s12.embedding = [], 
    s12.image = 'node_images/analytical_thinking.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s12)

MERGE (s13:L1:Skill {name: 'mental modeling'})
SET 
    s13.description = '',
    s13.aiGenerated = false, 
    s13.author = 'andrew link', 
    s13.embedding = [], 
    s13.image = 'node_images/mental_modeling.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s13)

MERGE (s14:L1:Skill {name: 'logical reasoning'})
SET 
    s14.description = '',
    s14.aiGenerated = false, 
    s14.author = 'andrew link', 
    s14.embedding = [], 
    s14.image = 'node_images/logical_reasoning.jpg'
MERGE (p)-[:HAS_SKILL {level: 'expertise'}]->(s14)
MERGE (p)-[:WANTS_SKILL {level: 'master'}]->(s14)

//Demographics
MERGE (height:L1:Demographics {name: 'height'})
MERGE (p)-[:HAS_TRAIT {value: '195cm'}]->(height)

MERGE (weight:L1:Demographics {name: 'weight'})
MERGE (p)-[:HAS_TRAIT {value: '95kg'}]->(weight)

MERGE (hair_color:L1:Demographics {name: 'hair color'})
MERGE (p)-[:HAS_TRAIT {value: 'brown'}]->(hair_color)

MERGE (eye_color:L1:Demographics {name: 'eye color'})
MERGE (p)-[:HAS_TRAIT {value: 'blue'}]->(eye_color)

MERGE (skin_color:L1:Demographics {name: 'skin color'})
MERGE (p)-[:HAS_TRAIT {value: 'white'}]->(skin_color)

MERGE (ethnicity:L1:Demographics {name: 'ethnicity'})
MERGE (p)-[:HAS_TRAIT {value: 'white'}]->(ethnicity)

MERGE (sexuality:L1:Demographics {name: 'sexuality'})
MERGE (p)-[:HAS_TRAIT {value: 'straight'}]->(sexuality)

MERGE (sex:L1:Demographics {name: 'sex'})
MERGE (p)-[:HAS_TRAIT {value: 'male'}]->(sex)

MERGE (gender:L1:Demographics {name: 'gender'})
MERGE (p)-[:HAS_TRAIT {value: 'male'}]->(gender)