// =============================================================================
// Atlas of Us — Personality scenarios seed
//
// One PersonalityScenario node per scenario, and one PersonalityScenarioQuestion
// node per prompt the user answers in it:
//   (:PersonalityScenario {name, title})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key, prompt, order})
//
// name matches the scenario id the UI uses, and key matches the prompt id in that
// scenario's script (e.g. ui/src/personality/landfall/script.ts). Users' answers are
// (:Person)-[:ANSWERED {answer, reasoning, answeredDate, scoring}]->(:PersonalityScenarioQuestion),
// written by the api.
//
// Multiple choice questions also have base scores for each choice, which the api's
// scoring job uses alongside the llm's read of the reasoning. delta is -1 to 1:
//   (:PersonalityScenarioQuestion)-[:HAS_CHOICE]->(:PersonalityScenarioChoice {label})-[:SHIFTS {delta}]->(:PersonalityTrait)
// label matches the choice label in the scenario's script, which is what the api stores as the answer.
// Free text questions have no choices, and are scored by the llm alone.
//
// Idempotent: safe to re-run. MERGE on name / key, everything else overwritten
// from this file on every run.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT personalityscenario_name_unique IF NOT EXISTS
FOR (n:PersonalityScenario) REQUIRE n.name IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Scenarios
// -----------------------------------------------------------------------------

UNWIND [
  {name: 'stolen_idea',          title: 'The Stolen Idea'},
  {name: 'let_down',             title: 'Let Down'},
  {name: 'landfall',             title: 'Expedition I: Landfall'},
  {name: 'the_thief',            title: 'Expedition II: The Thief'},
  {name: 'party_of_strangers',   title: 'The Party of Strangers'},
  {name: 'empty_weekend',        title: 'The Empty Weekend'},
  {name: 'public_mistake',       title: 'The Public Mistake'},
  {name: 'reading_people',       title: 'Reading People'},
  {name: 'holiday_table',        title: 'The Holiday Table'},
  {name: 'the_offer',            title: 'The Offer'},
  {name: 'track_record',         title: 'Track Record'},
  {name: 'the_archive',          title: 'The Archive'},
  {name: 'rule_that_doesnt_fit', title: "The Rule That Doesn't Fit"}
] AS scenario
MERGE (s:PersonalityScenario {name: scenario.name})
SET s.title = scenario.title;


// -----------------------------------------------------------------------------
// 2. Questions
// -----------------------------------------------------------------------------

// Expedition I: Landfall
MATCH (s:PersonalityScenario {name: 'landfall'})
UNWIND [
  {order: 0, key: 'first_action',      prompt: 'You have just washed up on an unknown shore. What is the very first thing you do, and what is going through your head?'},
  {order: 1, key: 'who_leads',         prompt: 'The group is waiting to hear where you stand. What do you say?'},
  {order: 2, key: 'explore_or_camp',   prompt: "There's light for one good push today. What should the group do with it?"},
  {order: 3, key: 'organize_supplies', prompt: 'How would you organize and ration what the group has? Be as specific or as loose as you like, and tell us why.'},
  {order: 4, key: 'rum_and_fruit',     prompt: 'A cup and a piece of fruit are held out to you. What do you do?'},
  {order: 5, key: 'the_light',         prompt: 'What do you think that was? Let your mind go wherever it goes.'},
  {order: 6, key: 'go_to_light',       prompt: 'Ines is already reaching for a torch. What do you do?'},
  {order: 7, key: 'night_reflection',  prompt: 'How are you feeling as you lie there? And what do you want to do tomorrow?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// Expedition II: The Thief
MATCH (s:PersonalityScenario {name: 'the_thief'})
UNWIND [
  {order: 0, key: 'first_suspicion', prompt: 'Everyone is watching everyone else. What do you make of all this? Who do you think took the food, if anyone, and why?'},
  {order: 1, key: 'search_bags',     prompt: "Voss wants to search everyone's things. What do you say?"},
  {order: 2, key: 'why_tob',         prompt: 'Tob is shaking. Why do you think he really did it? And how do you feel about him right now?'},
  {order: 3, key: 'tob_punishment',  prompt: 'What should happen to Tob?'},
  {order: 4, key: 'maren_knew',      prompt: 'Maren knew, and said nothing. How do you deal with that?'},
  {order: 5, key: 'share_portion',   prompt: 'Your own portion is in your hands. What do you do with it?'},
  {order: 6, key: 'camp_rules',      prompt: 'What rules, if any, should the camp live by from now on? And who gets to decide them?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;


// -----------------------------------------------------------------------------
// 3. Choice base scores
// -----------------------------------------------------------------------------

// Expedition I: Landfall
UNWIND [
  {question: 'who_leads', label: 'Back Voss. Someone needs to be in charge, and he has the experience.',
   shifts: [{trait: 'Cooperation', delta: 0.4}, {trait: 'Trust', delta: 0.3}, {trait: 'Assertiveness', delta: -0.3}]},
  {question: 'who_leads', label: 'Put yourself forward to lead.',
   shifts: [{trait: 'Assertiveness', delta: 0.7}, {trait: 'Self-Efficacy', delta: 0.4}, {trait: 'Boldness', delta: 0.4}]},
  {question: 'who_leads', label: 'Propose that the group decides things together.',
   shifts: [{trait: 'Cooperation', delta: 0.6}, {trait: 'Fairness', delta: 0.5}, {trait: 'Assertiveness', delta: 0.2}]},
  {question: 'who_leads', label: 'Stay out of it. Let them sort it out.',
   shifts: [{trait: 'Assertiveness', delta: -0.6}, {trait: 'Independence', delta: 0.3}, {trait: 'Gregariousness', delta: -0.2}]},

  {question: 'explore_or_camp', label: 'Head inland to look for water and learn the island.',
   shifts: [{trait: 'Adventurousness', delta: 0.6}, {trait: 'Excitement-Seeking', delta: 0.3}, {trait: 'Cautiousness', delta: -0.3}]},
  {question: 'explore_or_camp', label: 'Stay on the beach, build shelter, and get a signal fire going.',
   shifts: [{trait: 'Cautiousness', delta: 0.5}, {trait: 'Orderliness', delta: 0.3}, {trait: 'Adventurousness', delta: -0.4}]},
  {question: 'explore_or_camp', label: 'Split up: some explore, some build.',
   shifts: [{trait: 'Adaptability', delta: 0.4}, {trait: 'Cooperation', delta: 0.3}, {trait: 'Decisiveness', delta: 0.2}]},

  {question: 'rum_and_fruit', label: "Take it, and keep going as long as it's offered. You've earned it.",
   shifts: [{trait: 'Immoderation', delta: 0.7}, {trait: 'Self-Discipline', delta: -0.4}, {trait: 'Cautiousness', delta: -0.3}]},
  {question: 'rum_and_fruit', label: 'Have a little, then stop.',
   shifts: [{trait: 'Self-Discipline', delta: 0.3}, {trait: 'Immoderation', delta: -0.2}, {trait: 'Friendliness', delta: 0.2}]},
  {question: 'rum_and_fruit', label: 'Refuse, and argue that it should be saved.',
   shifts: [{trait: 'Immoderation', delta: -0.6}, {trait: 'Cautiousness', delta: 0.6}, {trait: 'Self-Discipline', delta: 0.5}, {trait: 'Assertiveness', delta: 0.3}]},

  {question: 'go_to_light', label: 'Grab a torch and go with her now.',
   shifts: [{trait: 'Adventurousness', delta: 0.6}, {trait: 'Excitement-Seeking', delta: 0.5}, {trait: 'Boldness', delta: 0.5}, {trait: 'Cautiousness', delta: -0.5}]},
  {question: 'go_to_light', label: 'Convince her to wait for morning.',
   shifts: [{trait: 'Cautiousness', delta: 0.5}, {trait: 'Patience', delta: 0.4}, {trait: 'Assertiveness', delta: 0.2}]},
  {question: 'go_to_light', label: 'Argue that no one should go up there at all.',
   shifts: [{trait: 'Cautiousness', delta: 0.7}, {trait: 'Anxiety', delta: 0.3}, {trait: 'Adventurousness', delta: -0.5}]}
] AS choice
MATCH (:PersonalityScenario {name: 'landfall'})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: choice.question})
MERGE (q)-[:HAS_CHOICE]->(c:PersonalityScenarioChoice {label: choice.label})
WITH c, choice
OPTIONAL MATCH (c)-[old:SHIFTS]->()
DELETE old
WITH DISTINCT c, choice
UNWIND choice.shifts AS shift
MATCH (t:PersonalityTrait {name: shift.trait})
CREATE (c)-[:SHIFTS {delta: shift.delta}]->(t);


// Expedition II: The Thief
UNWIND [
  {question: 'search_bags', label: 'Agree. Search everyone, me included.',
   shifts: [{trait: 'Trust', delta: -0.4}, {trait: 'Fairness', delta: 0.4}, {trait: 'Cooperation', delta: 0.3}, {trait: 'Liberalism', delta: -0.3}]},
  {question: 'search_bags', label: "Refuse. We don't treat each other like criminals.",
   shifts: [{trait: 'Trust', delta: 0.6}, {trait: 'Liberalism', delta: 0.3}, {trait: 'Assertiveness', delta: 0.3}]},
  {question: 'search_bags', label: 'Ask whoever did it to own up in private, with no punishment.',
   shifts: [{trait: 'Trust', delta: 0.4}, {trait: 'Sympathy', delta: 0.4}, {trait: 'Cooperation', delta: 0.3}, {trait: 'Liberalism', delta: 0.2}]},

  {question: 'tob_punishment', label: 'Cut his rations until what he ate is paid back.',
   shifts: [{trait: 'Fairness', delta: 0.5}, {trait: 'Dutifulness', delta: 0.3}, {trait: 'Sympathy', delta: -0.3}, {trait: 'Liberalism', delta: -0.3}]},
  {question: 'tob_punishment', label: 'Let it go. He was scared, and he gave back what was left.',
   shifts: [{trait: 'Sympathy', delta: 0.6}, {trait: 'Altruism', delta: 0.3}, {trait: 'Liberalism', delta: 0.3}, {trait: 'Fairness', delta: -0.2}]},
  {question: 'tob_punishment', label: 'Have him make up for it with the night watches and the hardest work.',
   shifts: [{trait: 'Fairness', delta: 0.4}, {trait: 'Cooperation', delta: 0.4}, {trait: 'Sympathy', delta: 0.3}]},
  {question: 'tob_punishment', label: 'Send him to sleep away from camp, far from the stores.',
   shifts: [{trait: 'Sympathy', delta: -0.6}, {trait: 'Trust', delta: -0.4}, {trait: 'Liberalism', delta: -0.3}, {trait: 'Cautiousness', delta: 0.3}]},

  {question: 'maren_knew', label: 'She should have told us. She answers for it too.',
   shifts: [{trait: 'Morality', delta: 0.4}, {trait: 'Fairness', delta: 0.3}, {trait: 'Sympathy', delta: -0.3}, {trait: 'Trust', delta: -0.2}]},
  {question: 'maren_knew', label: 'She did what she thought was kind. Leave her be.',
   shifts: [{trait: 'Sympathy', delta: 0.4}, {trait: 'Trust', delta: 0.4}, {trait: 'Cooperation', delta: 0.3}]},
  {question: 'maren_knew', label: 'Take it up with her privately, not in front of everyone.',
   shifts: [{trait: 'Cooperation', delta: 0.4}, {trait: 'Sympathy', delta: 0.3}, {trait: 'Morality', delta: 0.2}]},

  {question: 'share_portion', label: 'Give part of it to Tob.',
   shifts: [{trait: 'Altruism', delta: 0.7}, {trait: 'Sympathy', delta: 0.5}]},
  {question: 'share_portion', label: 'Eat it. Everyone is hungry.',
   shifts: [{trait: 'Altruism', delta: -0.4}, {trait: 'Sympathy', delta: -0.2}]},
  {question: 'share_portion', label: 'Put part of it back in the stores for later.',
   shifts: [{trait: 'Altruism', delta: 0.4}, {trait: 'Cautiousness', delta: 0.4}, {trait: 'Self-Discipline', delta: 0.4}, {trait: 'Cooperation', delta: 0.2}]}
] AS choice
MATCH (:PersonalityScenario {name: 'the_thief'})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: choice.question})
MERGE (q)-[:HAS_CHOICE]->(c:PersonalityScenarioChoice {label: choice.label})
WITH c, choice
OPTIONAL MATCH (c)-[old:SHIFTS]->()
DELETE old
WITH DISTINCT c, choice
UNWIND choice.shifts AS shift
MATCH (t:PersonalityTrait {name: shift.trait})
CREATE (c)-[:SHIFTS {delta: shift.delta}]->(t);
