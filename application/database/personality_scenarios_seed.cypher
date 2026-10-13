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

// Reading People (free text only, so no choice base scores)
MATCH (s:PersonalityScenario {name: 'reading_people'})
UNWIND [
  {order: 0, key: 'festival_laugh',   prompt: 'What do you think they were laughing at? How did it feel to walk into that?'},
  {order: 1, key: 'festival_after',   prompt: 'Walking home, is it still on your mind? Would you ask them about it?'},
  {order: 2, key: 'ren_brag',         prompt: 'Why do you think Ren told it that way?'},
  {order: 3, key: 'ren_credit',       prompt: 'Ms. Kuroda is waiting. What do you say, and why?'},
  {order: 4, key: 'old_man',          prompt: 'What do you think is going on with him?'},
  {order: 5, key: 'old_man_feeling',  prompt: 'How did watching him leave you feeling? Take a moment with it before you answer.'},
  {order: 6, key: 'aoi_note',         prompt: 'What do you think is going on with Aoi?'},
  {order: 7, key: 'aoi_next',         prompt: 'The note is still folded in your hand. Do you read the rest, give it back, bring it up, or let it be? Why?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// The Archive. Questions 0 to 4 are on a real clock and can go unanswered if it runs out.
// the_night is asked at dawn either way, with different choices depending on whether the player finished in time
MATCH (s:PersonalityScenario {name: 'the_archive'})
UNWIND [
  {order: 0, key: 'plan',         prompt: 'Where do you start?'},
  {order: 1, key: 'the_letter',   prompt: "The sky hasn't changed yet, but it will. What do you do with the letter?"},
  {order: 2, key: 'the_sketches', prompt: 'Her sketchbook is full of stars she made up. How long do you give it?'},
  {order: 3, key: 'the_orrery',   prompt: 'Why would she set it to a date so far away?'},
  {order: 4, key: 'last_crate',   prompt: 'What do you do with the last crate?'},
  {order: 5, key: 'the_night',    prompt: 'Dawn came. How do you feel about the way you spent the night?'},
  {order: 6, key: 'who_she_was',  prompt: 'From everything you saw tonight, who do you think Ottilie was?'},
  {order: 7, key: 'take_one',     prompt: 'You can take one thing home from the observatory. What do you take, and why?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;


// The Rule That Doesn't Fit. the_count is only asked of players who let Nessa on, so it can go unanswered
MATCH (s:PersonalityScenario {name: 'rule_that_doesnt_fit'})
UNWIND [
  {order: 0, key: 'first_response',  prompt: "She's out of breath and shivering. What do you say first?"},
  {order: 1, key: 'believe',         prompt: 'Do you believe her? What makes you think so, or not?'},
  {order: 2, key: 'the_rule',        prompt: "It's 9:37. What do you do?"},
  {order: 3, key: 'the_count',       prompt: 'The captain is waiting. What do you tell him?'},
  {order: 4, key: 'the_rule_itself', prompt: 'The rule says 120, no exceptions. Is it a good rule? Would you change it?'},
  {order: 5, key: 'if_she_lied',     prompt: "Suppose you found out her story wasn't true. Would that change how you feel about what you did?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// The Offer. Every path shares what_decided and gone_wrong
MATCH (s:PersonalityScenario {name: 'the_offer'})
UNWIND [
  {order: 0, key: 'first_reaction', prompt: 'She waits for your answer. What do you say?'},
  {order: 1, key: 'the_tour',       prompt: 'Okafor has an hour before the next fuel transfer. What do you want to see?'},
  {order: 2, key: 'what_worries',   prompt: 'What worries you most about going?'},
  {order: 3, key: 'can_you',        prompt: 'Could you handle it?'},
  {order: 4, key: 'the_decision',   prompt: 'What do you tell her?'},
  {order: 5, key: 'what_decided',   prompt: 'What decided it for you?'},
  {order: 6, key: 'gone_wrong',     prompt: "Imagine it's a year later, and the choice you made has gone badly. What went wrong, and what do you do about it?"}
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


// The Archive
UNWIND [
  {question: 'plan', label: 'Make a plan first. Label the crates, then sort everything by date.',
   shifts: [{trait: 'Orderliness', delta: 0.7}, {trait: 'Self-Discipline', delta: 0.3}, {trait: 'Achievement-Striving', delta: 0.2}]},
  {question: 'plan', label: "Logbooks and plates first. That's what the university wants.",
   shifts: [{trait: 'Achievement-Striving', delta: 0.5}, {trait: 'Self-Discipline', delta: 0.4}, {trait: 'Decisiveness', delta: 0.3}]},
  {question: 'plan', label: 'Just dive in and sort things as they come to hand.',
   shifts: [{trait: 'Orderliness', delta: -0.5}, {trait: 'Adaptability', delta: 0.3}, {trait: 'Activity Level', delta: 0.2}]},

  {question: 'the_letter', label: 'Read it now.',
   shifts: [{trait: 'Imagination', delta: 0.4}, {trait: 'Emotionality', delta: 0.3}, {trait: 'Self-Discipline', delta: -0.4}]},
  {question: 'the_letter', label: 'Put it in my pocket for later.',
   shifts: [{trait: 'Self-Discipline', delta: 0.4}, {trait: 'Imagination', delta: 0.2}, {trait: 'Patience', delta: 0.3}]},
  {question: 'the_letter', label: 'File it with her papers and keep going.',
   shifts: [{trait: 'Self-Discipline', delta: 0.5}, {trait: 'Orderliness', delta: 0.3}, {trait: 'Imagination', delta: -0.3}]},

  {question: 'the_sketches', label: 'Look through it properly.',
   shifts: [{trait: 'Artistic Interests', delta: 0.7}, {trait: 'Imagination', delta: 0.3}, {trait: 'Self-Discipline', delta: -0.4}]},
  {question: 'the_sketches', label: 'Flip through a few pages, then pack it.',
   shifts: [{trait: 'Artistic Interests', delta: 0.3}, {trait: 'Self-Discipline', delta: 0.2}]},
  {question: 'the_sketches', label: "Close it and crate it. There isn't time.",
   shifts: [{trait: 'Self-Discipline', delta: 0.5}, {trait: 'Achievement-Striving', delta: 0.3}, {trait: 'Artistic Interests', delta: -0.4}]},

  {question: 'the_orrery', label: 'Try to work it out.',
   shifts: [{trait: 'Intellect', delta: 0.7}, {trait: 'Imagination', delta: 0.2}, {trait: 'Achievement-Striving', delta: -0.2}]},
  {question: 'the_orrery', label: 'Write the date on a label and move on.',
   shifts: [{trait: 'Orderliness', delta: 0.4}, {trait: 'Achievement-Striving', delta: 0.3}, {trait: 'Intellect', delta: 0.1}]},
  {question: 'the_orrery', label: "Leave it. It's just an ornament.",
   shifts: [{trait: 'Intellect', delta: -0.5}, {trait: 'Imagination', delta: -0.3}]},

  {question: 'last_crate', label: 'Label every plate properly, however long it takes.',
   shifts: [{trait: 'Orderliness', delta: 0.6}, {trait: 'Perfectionism', delta: 0.6}, {trait: 'Achievement-Striving', delta: 0.4}, {trait: 'Self-Discipline', delta: 0.3}]},
  {question: 'last_crate', label: 'Label the crate "Glass plates, unsorted" and call it done.',
   shifts: [{trait: 'Achievement-Striving', delta: 0.3}, {trait: 'Orderliness', delta: -0.2}, {trait: 'Adaptability', delta: 0.3}]},
  {question: 'last_crate', label: "Leave it. I've done enough.",
   shifts: [{trait: 'Achievement-Striving', delta: -0.5}, {trait: 'Self-Discipline', delta: -0.4}]},

  {question: 'the_night', label: 'Satisfied. I set out to get it done, and I did.',
   shifts: [{trait: 'Achievement-Striving', delta: 0.6}, {trait: 'Self-Discipline', delta: 0.5}, {trait: 'Self-Efficacy', delta: 0.3}]},
  {question: 'the_night', label: "I finished, but I wish I'd slowed down and looked closer.",
   shifts: [{trait: 'Self-Discipline', delta: 0.3}, {trait: 'Imagination', delta: 0.3}, {trait: 'Artistic Interests', delta: 0.3}]},
  {question: 'the_night', label: 'Frustrated. I should have stuck to the job.',
   shifts: [{trait: 'Achievement-Striving', delta: 0.4}, {trait: 'Self-Discipline', delta: -0.4}, {trait: 'Introspection', delta: 0.2}]},
  {question: 'the_night', label: 'No regrets. What I found was worth more than finishing.',
   shifts: [{trait: 'Imagination', delta: 0.5}, {trait: 'Artistic Interests', delta: 0.4}, {trait: 'Achievement-Striving', delta: -0.4}, {trait: 'Self-Discipline', delta: -0.3}]}
] AS choice
MATCH (:PersonalityScenario {name: 'the_archive'})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: choice.question})
MERGE (q)-[:HAS_CHOICE]->(c:PersonalityScenarioChoice {label: choice.label})
WITH c, choice
OPTIONAL MATCH (c)-[old:SHIFTS]->()
DELETE old
WITH DISTINCT c, choice
UNWIND choice.shifts AS shift
MATCH (t:PersonalityTrait {name: shift.trait})
CREATE (c)-[:SHIFTS {delta: shift.delta}]->(t);


// The Rule That Doesn't Fit
UNWIND [
  {question: 'first_response', label: "I'm sorry, we're full. There's nothing I can do.",
   shifts: [{trait: 'Dutifulness', delta: 0.4}, {trait: 'Sympathy', delta: 0.1}, {trait: 'Friendliness', delta: -0.1}]},
  {question: 'first_response', label: "Get under the lamp, out of the rain. What's happened?",
   shifts: [{trait: 'Friendliness', delta: 0.6}, {trait: 'Sympathy', delta: 0.5}, {trait: 'Altruism', delta: 0.2}]},
  {question: 'first_response', label: "No ticket, no boarding. You'll have to ask at the office.",
   shifts: [{trait: 'Dutifulness', delta: 0.5}, {trait: 'Friendliness', delta: -0.4}, {trait: 'Sympathy', delta: -0.3}]},

  {question: 'the_rule', label: 'Let her on. Her father matters more than the rule.',
   shifts: [{trait: 'Liberalism', delta: 0.6}, {trait: 'Altruism', delta: 0.5}, {trait: 'Sympathy', delta: 0.5}, {trait: 'Dutifulness', delta: -0.6}, {trait: 'Boldness', delta: 0.3}]},
  {question: 'the_rule', label: 'Ask the passengers if anyone will give up their place.',
   shifts: [{trait: 'Altruism', delta: 0.4}, {trait: 'Dutifulness', delta: 0.3}, {trait: 'Adaptability', delta: 0.5}, {trait: 'Sympathy', delta: 0.3}]},
  {question: 'the_rule', label: 'Keep the rule, but do whatever else I can for her.',
   shifts: [{trait: 'Dutifulness', delta: 0.5}, {trait: 'Altruism', delta: 0.5}, {trait: 'Sympathy', delta: 0.3}, {trait: 'Liberalism', delta: -0.2}]},
  {question: 'the_rule', label: "Keep the rule. It isn't mine to break.",
   shifts: [{trait: 'Dutifulness', delta: 0.7}, {trait: 'Liberalism', delta: -0.5}, {trait: 'Altruism', delta: -0.3}, {trait: 'Sympathy', delta: -0.2}]},

  {question: 'the_count', label: 'The truth. 121, and I let her on.',
   shifts: [{trait: 'Morality', delta: 0.7}, {trait: 'Dutifulness', delta: 0.3}, {trait: 'Boldness', delta: 0.3}]},
  {question: 'the_count', label: '120.',
   shifts: [{trait: 'Morality', delta: -0.6}, {trait: 'Dutifulness', delta: -0.4}, {trait: 'Liberalism', delta: 0.2}]}
] AS choice
MATCH (:PersonalityScenario {name: 'rule_that_doesnt_fit'})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: choice.question})
MERGE (q)-[:HAS_CHOICE]->(c:PersonalityScenarioChoice {label: choice.label})
WITH c, choice
OPTIONAL MATCH (c)-[old:SHIFTS]->()
DELETE old
WITH DISTINCT c, choice
UNWIND choice.shifts AS shift
MATCH (t:PersonalityTrait {name: shift.trait})
CREATE (c)-[:SHIFTS {delta: shift.delta}]->(t);


// The Offer
UNWIND [
  {question: 'first_reaction', label: 'When do I leave?',
   shifts: [{trait: 'Excitement-Seeking', delta: 0.6}, {trait: 'Adventurousness', delta: 0.5}, {trait: 'Cautiousness', delta: -0.5}, {trait: 'Decisiveness', delta: 0.4}]},
  {question: 'first_reaction', label: 'Send me everything: the risks, the contract, all of it.',
   shifts: [{trait: 'Cautiousness', delta: 0.6}, {trait: 'Excitement-Seeking', delta: -0.1}]},
  {question: 'first_reaction', label: "Why me? I'm not sure I'm the right person.",
   shifts: [{trait: 'Self-Efficacy', delta: -0.5}, {trait: 'Anxiety', delta: 0.3}, {trait: 'Modesty', delta: 0.3}]},

  {question: 'the_tour', label: 'Suit up and go out on the hull.',
   shifts: [{trait: 'Excitement-Seeking', delta: 0.6}, {trait: 'Adventurousness', delta: 0.4}]},
  {question: 'the_tour', label: 'The report on the lost lander.',
   shifts: [{trait: 'Cautiousness', delta: 0.6}, {trait: 'Anxiety', delta: 0.2}]},
  {question: 'the_tour', label: 'The crew. I want to meet the people I would be living with.',
   shifts: [{trait: 'Gregariousness', delta: 0.4}, {trait: 'Friendliness', delta: 0.4}]},

  {question: 'can_you', label: "I've handled worse. I'd manage.",
   shifts: [{trait: 'Self-Efficacy', delta: 0.7}, {trait: 'Anxiety', delta: -0.3}]},
  {question: 'can_you', label: 'With enough training, yes.',
   shifts: [{trait: 'Self-Efficacy', delta: 0.3}, {trait: 'Cautiousness', delta: 0.3}, {trait: 'Achievement-Striving', delta: 0.2}]},
  {question: 'can_you', label: "Honestly, I don't know if I could.",
   shifts: [{trait: 'Self-Efficacy', delta: -0.6}, {trait: 'Anxiety', delta: 0.5}]},

  {question: 'the_decision', label: "I'm going.",
   shifts: [{trait: 'Adventurousness', delta: 0.7}, {trait: 'Excitement-Seeking', delta: 0.5}, {trait: 'Cautiousness', delta: -0.4}, {trait: 'Boldness', delta: 0.5}]},
  {question: 'the_decision', label: "I'm staying on Halden.",
   shifts: [{trait: 'Adventurousness', delta: -0.5}, {trait: 'Cautiousness', delta: 0.5}, {trait: 'Achievement-Striving', delta: 0.2}]},
  {question: 'the_decision', label: 'Not this time. Hold me a place on the next ship.',
   shifts: [{trait: 'Cautiousness', delta: 0.4}, {trait: 'Adventurousness', delta: 0.2}, {trait: 'Anxiety', delta: 0.2}, {trait: 'Decisiveness', delta: -0.3}]}
] AS choice
MATCH (:PersonalityScenario {name: 'the_offer'})-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: choice.question})
MERGE (q)-[:HAS_CHOICE]->(c:PersonalityScenarioChoice {label: choice.label})
WITH c, choice
OPTIONAL MATCH (c)-[old:SHIFTS]->()
DELETE old
WITH DISTINCT c, choice
UNWIND choice.shifts AS shift
MATCH (t:PersonalityTrait {name: shift.trait})
CREATE (c)-[:SHIFTS {delta: shift.delta}]->(t);
