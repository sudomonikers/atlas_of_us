// =============================================================================
// Atlas of Us — Personality scenarios seed
//
// The personality scenarios, each written to a set of IPIP-NEO items (see
// ui/src/personality/scene_grouping.md):
//   (:PersonalityScenario {name, title, order})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key, prompt, order, real_life})
//
// name matches the scenario id in ui/src/personality/personality.tsx, and key matches
// the prompt id in that scenario's script.
//
// Idempotent: safe to re-run. MERGE on name / key, everything else overwritten from
// this file on every run, except id, which is set once when the node is first created.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT personalityscenario_name_unique IF NOT EXISTS
FOR (n:PersonalityScenario) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT personalityscenario_id_unique IF NOT EXISTS
FOR (n:PersonalityScenario) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT personalityscenarioquestion_id_unique IF NOT EXISTS
FOR (n:PersonalityScenarioQuestion) REQUIRE n.id IS UNIQUE;

// answers and scoring jobs are made by atlas-api, not this file, but their ids go to the UI and the jobs queue
CREATE CONSTRAINT answered_id_unique IF NOT EXISTS
FOR ()-[a:ANSWERED]-() REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT jobrunning_id_unique IF NOT EXISTS
FOR (n:JobRunning) REQUIRE n.id IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. Scenarios
// -----------------------------------------------------------------------------

UNWIND [
  {name: 'the_story_game',   title: 'The Story Game',     order: 0},
  {name: 'the_night_class',  title: 'The Night Class',    order: 1},
  {name: 'the_big_party',    title: 'The Big Party',      order: 2},
  {name: 'the_time_study',   title: 'The Time Study',     order: 3},
  {name: 'the_night_market', title: 'The Night Market',   order: 4},
  {name: 'the_bad_day',      title: 'The Bad Day',        order: 5},
  {name: 'the_dare',         title: 'The Dare',           order: 6},
  {name: 'the_shoplifter',   title: 'The Shoplifter',     order: 7},
  {name: 'the_committee',    title: 'The Committee',      order: 8},
  {name: 'the_houseguest',   title: 'The Houseguest',     order: 9},
  {name: 'the_promotion',    title: 'The Promotion',      order: 10},
  {name: 'the_festival',     title: 'The Festival',       order: 11},
  {name: 'the_free_weekend', title: 'The Free Weekend',   order: 12},
  {name: 'the_stranger',     title: 'The Stranger',       order: 13},
  {name: 'the_emergency',    title: 'The Emergency',      order: 14},
  {name: 'the_feud',         title: 'The Feud',           order: 15},
  {name: 'the_cabin',        title: 'The Cabin',          order: 16},
  {name: 'the_portrait',     title: 'The Portrait',       order: 17}
] AS scenario
MERGE (s:PersonalityScenario {name: scenario.name})
ON CREATE SET s.id = randomUUID()
SET s.title = scenario.title, s.order = scenario.order;


// -----------------------------------------------------------------------------
// 2. Questions
// -----------------------------------------------------------------------------

// Added scene by scene as each script is written. order decides which question is last, and real_life marks the
// questions about the player's own life rather than the story. Each block also deletes the scene's questions that
// aren't in it anymore, and any answers to them, so a reworked scene doesn't keep its old questions around

// The Story Game. poem_thoughts is only asked after listening to the poem
MATCH (s:PersonalityScenario {name: 'the_story_game'})
UNWIND [
  {order: 0, key: 'invent_a_place', prompt: 'Where have they landed? Describe it for me: what the traveler sees, hears and smells as they step off the boat, and who, or what, lives there.'},
  {order: 1, key: 'the_goat', prompt: 'What does the ferryman say? And what does the traveler say back?'},
  {order: 2, key: 'how_strange', prompt: 'How strange should this place get? Pick one, then tell me the strangest thing about it.'},
  {order: 3, key: 'the_riddle', prompt: 'What does the traveler do? If you try the riddle, give your answer and how you got there.'},
  {order: 4, key: 'the_poem', prompt: "She's about to recite a poem in the traveler's honor. What do you do?"},
  {order: 5, key: 'poem_thoughts', prompt: "What did you make of it? Be honest. She's very old, but she can take it."},
  {order: 6, key: 'how_it_ends', prompt: 'What happens to the traveler? Do they stay, sail home, or something else entirely? Tell me how the story ends.'},
  {order: 7, real_life: true, key: 'wandering_mind', prompt: "In the last week, how many times did your mind wander off somewhere that doesn't exist: a daydream, a what-if, a world of your own? Where did it go the last time?"},
  {order: 8, real_life: true, key: 'just_for_fun', prompt: "And in the last month, not counting the riddle just now, which of these did you do just because you wanted to: work at a puzzle or a hard problem, read or write a poem, make someone laugh on purpose? Tell me about the last time for each one. If it was none of them, that's an answer too."}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Festival. the_mural branches: what_you_see is only asked after stopping to take it in
MATCH (s:PersonalityScenario {name: 'the_festival'})
UNWIND [
  {order: 0, key: 'who_with', prompt: 'What do you do? Pick one, and tell me why.'},
  {order: 1, key: 'first_stop', prompt: 'Where do you go first? Tell me why there.'},
  {order: 2, key: 'the_mural', prompt: 'Most people walk past the mural with their heads down. What do you do?'},
  {order: 3, key: 'what_you_see', prompt: "People are walking straight past all of this. What do you make of it? Tell me which part, if any, you'd stop for, and whether any of it gets to you."},
  {order: 4, key: 'save_the_mural', prompt: 'Do you sign the petition to keep the mural? Tell me why, either way.'},
  {order: 5, key: 'last_stop', prompt: 'Where do you end the day? Tell me why.'},
  {order: 6, key: 'how_it_felt', prompt: 'So, how was it? Give the day a score out of ten, and tell me the best part and the worst.'},
  {order: 7, real_life: true, key: 'going_alone', prompt: "When there's something on you'd like to go to, but nobody can come with you, do you go anyway? When did you last go somewhere like that on your own, and how was it?"},
  {order: 8, real_life: true, key: 'been_anywhere', prompt: "And in the last six months, how many times have you been to a gallery, museum, show or gig? How many times have you gone somewhere you'd never been before? Tell me about the last one of each. If it was none, that's an answer too."}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Big Party. walk_in and work_the_room are on a clock, so either can be skipped when it runs out. the_corner
// branches: cheer_up is only asked after sitting with Mei. the_stage branches: up_there is only asked on stage
MATCH (s:PersonalityScenario {name: 'the_big_party'})
UNWIND [
  {order: 0, key: 'walk_in', prompt: 'What do you do first? Pick one, and tell me why.'},
  {order: 1, key: 'work_the_room', prompt: "The band's on any minute. Who do you talk to before then? Pick one, and tell me how you'd start."},
  {order: 2, key: 'the_corner', prompt: 'What do you do? Pick one, and tell me why.'},
  {order: 3, key: 'cheer_up', prompt: 'What do you say to her? Tell me what you would actually say.'},
  {order: 4, key: 'the_stage', prompt: "The light's coming your way. What do you do? Pick one, and tell me why."},
  {order: 5, key: 'up_there', prompt: "Thirty seconds of chorus, and they're all yours. What do you do with them?"},
  {order: 6, key: 'new_faces', prompt: "Over a whole night like this, roughly how many people do you think you'd end up having a proper conversation with? Is it likely you'd have met someone you'd love to see again, and would you actually do anything about it?"},
  {order: 7, key: 'how_was_it', prompt: 'And the night itself, out of ten? Would you have stayed later if you could, or were you ready to go an hour ago?'},
  {order: 8, real_life: true, key: 'big_dos', prompt: "In the last twelve months, how many parties or big get-togethers have you been to where you didn't know most of the people there? How many did you say no to? And how did you feel walking into the last one?"},
  {order: 9, real_life: true, key: 'new_friend', prompt: "When did you last make a new friend: someone you now see or message on your own, not just through someone else? How did it start? If it's been years, that's an answer too."}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Dare. No branches add or skip questions: every path asks all eight
MATCH (s:PersonalityScenario {name: 'the_dare'})
UNWIND [
  {order: 0, key: 'packing', prompt: "It's the night before. How ready are you? Pick one, and tell me what's in the bag."},
  {order: 1, key: 'lost', prompt: 'What do you do? And how are you feeling, standing there? Tell me honestly.'},
  {order: 2, key: 'the_days', prompt: "You've got ten days. What goes on your side of the napkin? Pick one, and tell me how you'd spend the days."},
  {order: 3, key: 'the_bridge', prompt: 'Do you jump? Pick one, and tell me what goes through your head.'},
  {order: 4, key: 'the_ride', prompt: 'What do you tell Kit? Pick one, and tell me why.'},
  {order: 5, key: 'the_trip', prompt: "Looking back on the two weeks: what was the best part, and was there anything you'd never do again? Would you go away with Kit again?"},
  {order: 6, real_life: true, key: 'last_rush', prompt: "In the last twelve months, what's the most physically risky thing you've done just for the thrill of it: a ride, a sport, a jump, a dare, driving too fast? When was it, and did you think it through first? If nothing comes to mind, that's an answer too."},
  {order: 7, real_life: true, key: 'last_trip', prompt: "Think about the last time you went away, even for a night. How far ahead did you pack, and did you plan what you'd do? What went wrong, if anything, and how did you take it?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Committee. No branches add or skip questions: every path asks all nine
MATCH (s:PersonalityScenario {name: 'the_committee'})
UNWIND [
  {order: 0, key: 'the_meeting', prompt: 'What do you do? Pick one, and tell me what you say to the room, if anything.'},
  {order: 1, key: 'the_group', prompt: 'How do you feel about being part of all this: the chat, the bar, fourteen new people in your life? Pick one, and tell me honestly.'},
  {order: 2, key: 'the_programmes', prompt: 'What do you do? Pick one, and tell me why.'},
  {order: 3, key: 'ten_things', prompt: "Ten things need doing, and you've got three hours. What do you do? Pick one, then walk me through the next hour."},
  {order: 4, key: 'the_banner', prompt: 'What do you do about it? Pick one, and tell me why.'},
  {order: 5, key: 'the_cakes', prompt: 'What do you do? Pick one, and tell me why.'},
  {order: 6, key: 'the_day', prompt: "It's over. How did it go, for you? What are you proudest of? Would you do it again next year, and would you want to run it?"},
  {order: 7, real_life: true, key: 'last_lead', prompt: "Think of the groups you're part of: work, friends, family, a club or a team. The last time one of them needed someone to take charge, did you? What happened? And how much do you enjoy being part of a group like that?"},
  {order: 8, real_life: true, key: 'last_busy', prompt: 'Think back to your busiest day in the last month. How many things were you juggling, and how did you get through them? Did anyone need your help along the way, and what did you do?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Night Class. No branches add or skip questions: every path asks all eight
MATCH (s:PersonalityScenario {name: 'the_night_class'})
UNWIND [
  {order: 0, key: 'the_ship', prompt: 'Which is the real one? Pick one, and tell me why.'},
  {order: 1, key: 'the_self', prompt: 'What do you think? Say as much or as little as you like.'},
  {order: 2, key: 'the_clive', prompt: 'What do you do? Pick one, and tell me what you say, if anything.'},
  {order: 3, key: 'the_pair', prompt: 'What do you do? Pick one, and tell me honestly what you make of Bea.'},
  {order: 4, key: 'right_answer', prompt: 'Is there a right answer? Pick one, and tell me why.'},
  {order: 5, key: 'the_class', prompt: "How was that, for you? Did anything from tonight stay with you? If it weren't required, would you go back next Wednesday?"},
  {order: 6, real_life: true, key: 'last_talk', prompt: "In the last month, how many times did you end up in a real conversation about a big question: what's right, what's real, what any of it means? Who was it with, and did you enjoy it, or try to change the subject?"},
  {order: 7, real_life: true, key: 'last_room', prompt: 'The last time someone at work, with friends or in a group chat said something you thought was wrong, did you say so? And the last time someone struggled to understand something you got right away, what went through your head?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Night Market. No branches add or skip questions: every path asks all nine
MATCH (s:PersonalityScenario {name: 'the_night_market'})
UNWIND [
  {order: 0, key: 'the_stall', prompt: "What is it? Describe it for me: the thing you've never been able to walk past. Then pick what you do, and tell me why."},
  {order: 1, key: 'the_game', prompt: "He's only just started on the rules. What do you do? Pick one, and tell me why. And what could go wrong?"},
  {order: 2, key: 'the_fountain', prompt: 'Honestly, what goes through your head when you see him? Pick what you do, and tell me how you feel.'},
  {order: 3, key: 'the_line', prompt: "He has no way to check, and you'll never see any of these people again. Nobody would ever know. What do you do? Pick one, and tell me why."},
  {order: 4, key: 'line_if', prompt: "Thinking back to the line: would anything have changed your answer? Say the next coach wasn't for three days, or someone was waiting for you at home. Is there any situation where you would lie your way onto that coach, or any where you wouldn't?"},
  {order: 5, key: 'way_home', prompt: 'How do you feel about your night at the market? Would you do anything differently?'},
  {order: 6, real_life: true, key: 'last_gave_in', prompt: "Think of the last time you gave in to something you'd meant to resist: a snack, a show, a purchase, one more of anything. What was it, how hard did you try, and how did you feel about it afterward?"},
  {order: 7, real_life: true, key: 'last_decision', prompt: 'Think of the last real decision you made, big or small. How long did you take over it, and how did it turn out? And the last time you rushed into something, what happened?'},
  {order: 8, real_life: true, key: 'last_worse_off', prompt: 'The last time you saw someone worse off than you, what went through your head? And when did you last bend a rule because nobody would know?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Bad Day. the_lights, the_printer and the_gary are on a clock, so the last two can be skipped when it runs out.
// No other branches add or skip questions
MATCH (s:PersonalityScenario {name: 'the_bad_day'})
UNWIND [
  {order: 0, key: 'the_lights', prompt: 'What do you do? Pick one, and tell me what goes through your head.'},
  {order: 1, key: 'the_printer', prompt: 'What do you do? Pick one, and tell me how you feel right now.'},
  {order: 2, key: 'the_gary', prompt: 'What do you do? Pick one, and tell me exactly what you say.'},
  {order: 3, key: 'the_call', prompt: "What do you say to Leanne? Pick one, and tell me the actual words, as you'd say them."},
  {order: 4, key: 'the_waitress', prompt: 'What do you do? Pick one. And what do you make of Jo?'},
  {order: 5, key: 'the_day', prompt: "Looking back, out of ten, how wound up did you get today? Which part got to you most, and is there anything you'd take back?"},
  {order: 6, real_life: true, key: 'last_snap', prompt: "Think of the last time you lost your temper: raised your voice, slammed something, or said something you didn't mean. When was it, who was it at, and how long did it take you to calm down?"},
  {order: 7, real_life: true, key: 'last_niggle', prompt: "In the last seven days, how many times did something small get under your skin: a line, a noise, someone's driving? And the last time someone serving you got it wrong, what did you do?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Time Study. An interview, with no branches that add or skip questions: every path asks all nine
MATCH (s:PersonalityScenario {name: 'the_time_study'})
UNWIND [
  {order: 0, real_life: true, key: 'diary_days', prompt: "Over the last seven days, what took up most of your daytimes: work, school, looking after someone, something else? Rough is fine."},
  {order: 1, real_life: true, key: 'diary_evenings', prompt: "And your evenings, once the day was done? What did most of them go on, and roughly what time did you usually get to sleep?"},
  {order: 2, real_life: true, key: 'diary_weekend', prompt: "And the weekend: what did you actually do with it, and was it what you meant to do?"},
  {order: 3, real_life: true, key: 'wasted', prompt: "Looking at the whole week, how much of it would you call wasted: time that went on things you didn't really choose, and didn't really enjoy? Pick the closest, and circle the parts."},
  {order: 4, real_life: true, key: 'putting_off', prompt: "Think of the last thing you had to do but didn't want to: a call, a form, a chore, anything. How long was it between knowing about it and actually starting? Pick the closest, and tell me what it was."},
  {order: 5, real_life: true, key: 'last_week', prompt: "Think of everything you meant to get done in the last 7 days. Roughly what share of it did you actually finish? Pick the closest, and tell me about one thing that didn't get done."},
  {order: 6, real_life: true, key: 'how_much', prompt: "The last real piece of work you did, for a job, for school, around the house, anything: did you do more than was needed, exactly what was needed, or just enough to get by? Pick the closest, and tell me what it was."},
  {order: 7, real_life: true, key: 'stressed', prompt: "In the last 7 days, on how many days did you feel stressed out? Pick the closest, and tell me what set it off."},
  {order: 8, real_life: true, key: 'without_looking', prompt: "Without looking, where are your keys right now? Your phone charger? And the last thing you borrowed from someone: where is that?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Stranger
MATCH (s:PersonalityScenario {name: 'the_stranger'})
UNWIND [
  {order: 0, key: 'the_story', prompt: 'What do you do? Pick one. And do you believe him? Tell me why.'},
  {order: 1, key: 'the_rough', prompt: 'How do you feel, standing there? Pick the closest, and tell me what you say to him.'},
  {order: 2, key: 'the_doubt', prompt: 'What do you make of what Leah said? Pick one, and tell me why.'},
  {order: 3, key: 'the_again', prompt: "He hasn't seen you yet. What do you do? Pick one, and tell me why."},
  {order: 4, key: 'looking_back', prompt: 'Do you think he was telling you the truth, that first night? Does it matter? And how do you feel about what you did?'},
  {order: 5, real_life: true, key: 'last_asked', prompt: 'Think of the last time a stranger asked you for something: money, directions, a lighter, help. What did they want, what did you do, and what did you make of them?'},
  {order: 6, real_life: true, key: 'last_passed', prompt: "When did you last walk past someone sleeping on the street? What went through your head, and what did you do? And when did you last check in on someone you know who's having a hard time?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Feud
MATCH (s:PersonalityScenario {name: 'the_feud'})
UNWIND [
  {order: 0, key: 'the_fence', prompt: "He's standing very close, waiting. What do you do? Pick one, tell me what you say, and how it feels standing there."},
  {order: 1, key: 'the_why', prompt: 'Why do you think Graham moved the fence? Pick the closest, and tell me why.'},
  {order: 2, key: 'the_war', prompt: 'What do you do now? Pick one, and tell me why. And be honest: is any part of you enjoying this?'},
  {order: 3, key: 'the_favour', prompt: "He's holding out his spare key. What do you do? Pick one, and tell me why."},
  {order: 4, key: 'looking_back', prompt: 'Looking back over the year: who was in the right? Was any of it worth it? And if this happened to you for real, what would you do differently?'},
  {order: 5, real_life: true, key: 'last_pushed', prompt: "Think of the last time someone pushed you, face to face: a neighbor, a coworker, a stranger, family. What happened, what did you say, and how did you feel, during it and after? If you can't think of one, tell me what you usually do."},
  {order: 6, real_life: true, key: 'last_wronged', prompt: 'And the last time someone did you wrong: did you get even, have it out, or let it go? In the last month, how many times did you wonder what someone was really after when they did something nice for you?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Free Weekend
MATCH (s:PersonalityScenario {name: 'the_free_weekend'})
UNWIND [
  {order: 0, key: 'the_promise', prompt: 'What do you do about tomorrow? Pick one, then write the text you send Becca, word for word.'},
  {order: 1, key: 'the_sunday', prompt: 'How do you spend the day? Pick the closest, and tell me what happens to the list.'},
  {order: 2, key: 'the_hour', prompt: 'Where does the hour go? Pick the closest, and tell me what you noticed, read or thought about.'},
  {order: 3, key: 'looking_back', prompt: 'What do you tell her? Was it a good weekend? And if you had it again, what would you do differently?'},
  {order: 4, real_life: true, key: 'last_weekend', prompt: 'Think about your last free weekend. What did you actually do, and who with? Roughly how many hours were you around other people, and did you get done what you meant to?'},
  {order: 5, real_life: true, key: 'last_promise', prompt: "When did you last back out of something you'd said you'd do, even something small? What did you tell them, and was it the whole truth?"},
  {order: 6, real_life: true, key: 'last_wander', prompt: 'And in the last month, how many times did you stop just to look at something beautiful outdoors, read something that really made you think, or lose an hour in your own head? Tell me about the last one.'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Houseguest
MATCH (s:PersonalityScenario {name: 'the_houseguest'})
UNWIND [
  {order: 0, key: 'the_mess', prompt: 'What do you do about the mess? Pick one, and be honest: what does your own room look like right now?'},
  {order: 1, key: 'the_evenings', prompt: 'What do you do, most evenings that week? Pick the closest, and tell me why.'},
  {order: 2, key: 'the_night', prompt: 'What do you do? Pick the closest. Tell me what you said, and what it was like for you while they were talking.'},
  {order: 3, key: 'looking_back', prompt: 'Holding the note, how do you feel about the week? Would you have Rory back? And if you had the week again, what would you do differently?'},
  {order: 4, real_life: true, key: 'last_space', prompt: 'Look around your room right now, or picture it. Where are your things: put away, or wherever you dropped them? When did you last have a really good clean, and did you enjoy it?'},
  {order: 5, real_life: true, key: 'last_company', prompt: 'Think of the last time someone wanted more of your company than you wanted to give. Who was it, and what did you do? And last week, how many evenings did you spend with someone, by choice?'},
  {order: 6, real_life: true, key: 'last_trouble', prompt: 'And the last time someone told you about something hard they were going through: what did you feel while they talked, and what did you do afterward? Did it stay with you?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Shoplifter
MATCH (s:PersonalityScenario {name: 'the_shoplifter'})
UNWIND [
  {order: 0, key: 'the_moment', prompt: 'What do you do? Pick one, and tell me why. Do you believe him?'},
  {order: 1, key: 'the_policy', prompt: 'What do you say to Frank? Pick the closest, and tell me what you think should really happen to kids like him.'},
  {order: 2, key: 'the_taunt', prompt: 'What do you do? Pick the closest. Tell me how you felt, and what you think they deserve.'},
  {order: 3, key: 'looking_back', prompt: 'Looking back on that week, are you happy with what you did? If it happened tomorrow, would you do anything differently? And what do you think happens to him now?'},
  {order: 4, real_life: true, key: 'last_rule', prompt: 'When did you last break a rule, at work, on the road or anywhere else? What was it, and why? And when did you last stick to a rule you thought was wrong?'},
  {order: 5, real_life: true, key: 'last_story', prompt: "When someone gives you a hard-luck story, a stranger, a customer or someone at work, what's your first thought: that they're telling the truth, or that they're after something? Tell me about the last time."},
  {order: 6, real_life: true, key: 'last_wrong', prompt: 'Think of the last time someone really wronged you. Did you want them to pay for it, and did you do anything? And when you hear about a crime on the news, what do you think should happen to whoever did it?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Emergency
MATCH (s:PersonalityScenario {name: 'the_emergency'})
UNWIND [
  {order: 0, key: 'the_fire', prompt: 'What do you do, right now? Pick one, and tell me what goes through your head.'},
  {order: 1, key: 'the_chaos', prompt: "What do you do? Pick the closest, and tell me how you're feeling, right this second."},
  {order: 2, key: 'the_panic', prompt: "What do you do? Pick the closest, and tell me what you'd say to her."},
  {order: 3, key: 'how_it_went', prompt: 'How do you think you did? Pick one, and tell me how your body feels now.'},
  {order: 4, key: 'looking_back', prompt: 'Looking back at those few minutes, what did you do well, and what would you do differently? And who was really in charge in that kitchen: you, or someone else?'},
  {order: 5, real_life: true, key: 'last_crisis', prompt: 'Think of the last time something went suddenly wrong in front of you: a fall, a flood, a car, a crisis at work. What did you do in the first minute? Did you take charge, or wait for someone else to?'},
  {order: 6, real_life: true, key: 'last_pile', prompt: 'In the last 30 days, on how many days did it feel like more was happening than you could cope with? What was going on, and how did you get through it?'},
  {order: 7, real_life: true, key: 'last_help', prompt: 'And the last time you went out of your way to help someone who was struggling: who was it, and what did you do? Were you glad to do it, or was it a chore?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Promotion
MATCH (s:PersonalityScenario {name: 'the_promotion'})
UNWIND [
  {order: 0, key: 'the_credit', prompt: 'What do you say to Joan? Pick the closest, and tell me why.'},
  {order: 1, key: 'the_file', prompt: 'What do you do? Pick the closest, and tell me what goes through your head.'},
  {order: 2, key: 'the_prep', prompt: 'How do you spend the weekend? Pick the closest, and tell me why.'},
  {order: 3, key: 'the_pitch', prompt: "What do you tell them? Pick the closest, then tell me what you'd actually say."},
  {order: 4, key: 'the_news', prompt: 'What goes through your head, and what do you do? Pick the closest, and be honest.'},
  {order: 5, key: 'the_mirror', prompt: "How do you feel about yourself, right now? Pick the closest, and tell me what you'd text her back."},
  {order: 6, key: 'looking_back', prompt: 'Looking back on those two weeks, are you happy with how you went after it? What would you do differently? And how long did losing it stay with you?'},
  {order: 7, real_life: true, key: 'last_edge', prompt: "When did you last have the chance to get ahead at someone else's expense: take credit that wasn't yours, bend the truth, or let a rival trip up? What did you do?"},
  {order: 8, real_life: true, key: 'last_praise', prompt: "When someone asks what you're good at, at work, a party or a family get-together, what do you tell them? And when did you last do far more than anyone asked of you?"},
  {order: 9, real_life: true, key: 'last_setback', prompt: 'Think of your last real setback: a job, a relationship, a plan that fell through. How long did it take you to get over it? And these days, how do you feel about yourself, on the whole?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;

// The Cabin. the_wait and the_feeling are on a clock, so the_feeling can be skipped when it runs out. the_tears is
// asked either way, while waiting or when Cal turns up
MATCH (s:PersonalityScenario {name: 'the_cabin'})
UNWIND [
  {order: 0, key: 'the_snacks', prompt: "How does the snack counter go for you, over a whole weekend like this? Pick the closest, and tell me why."},
  {order: 1, key: 'next_year', prompt: "What do you think of Jun's idea? Pick the closest, and say it how you'd say it at the table."},
  {order: 2, key: 'the_wait', prompt: "Cal is three hours late, his phone is off, and the road is icy. What goes through your head? Pick the closest, and tell me what you're picturing."},
  {order: 3, key: 'the_feeling', prompt: "While you wait, what's going on inside you? Pick the closest, and tell me where in your body you feel it."},
  {order: 4, key: 'the_tears', prompt: "Rosa is crying. What do you do, and what do you make of it? Pick the closest."},
  {order: 5, key: 'the_faith', prompt: "What do you really think? Pick the closest, and tell me why."},
  {order: 6, key: 'the_night', prompt: "Lying awake in the dark, what else do you find yourself afraid of? Big or small, tell me what comes up, and how often those fears keep you awake."},
  {order: 7, key: 'looking_back', prompt: "Looking back on the weekend, which part stays with you most: the snacks, Jun's idea, the wait for Cal, or the talk by the fire? Why that one, and would you do anything differently?"},
  {order: 8, real_life: true, key: 'last_binge', prompt: "In the last 30 days, how many times did you go on a binge: eating, drinking, shopping or watching far more than you meant to, all in one go? Give me a number, and tell me about the last one."},
  {order: 9, real_life: true, key: 'last_worry', prompt: "And in the last 30 days, on how many days did you worry about something that never ended up happening? What was it, and how strongly did you feel it?"},
  {order: 10, real_life: true, key: 'last_change', prompt: "Last one. When did you last give up a habit or a tradition, or try something completely new, because someone suggested it? How did it go?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// The Portrait. An interview, so every question is about the player's own life. All of them are asked on every path
MATCH (s:PersonalityScenario {name: 'the_portrait'})
UNWIND [
  {order: 0, real_life: true, key: 'how_youve_been', prompt: 'In the last 30 days, on how many days did you feel blue, or down in the dumps? Pick the closest, and tell me what those days were like.'},
  {order: 1, real_life: true, key: 'good_mood', prompt: "In the last 7 days, on how many days were you in the kind of good mood that shows: laughing, humming, joking with whoever's around? Pick the closest, and tell me about one of them."},
  {order: 2, real_life: true, key: 'mornings', prompt: 'And when you wake up on an ordinary day, how do you feel about the day ahead? Pick the closest, and tell me why.'},
  {order: 3, real_life: true, key: 'own_company', prompt: 'Think about how yours has talked to you this last week. If a friend talked to you that way, would you keep them? Pick the closest, and tell me what it says.'},
  {order: 4, real_life: true, key: 'free_day', prompt: 'Think of the last day, or half a day, you had with nothing booked. What did you do with it? Pick the closest, and walk me through it.'},
  {order: 5, real_life: true, key: 'opinion', prompt: 'Be honest with me: how high is your opinion of yourself, next to the people around you? Pick the closest, and tell me why.'},
  {order: 6, real_life: true, key: 'praise', prompt: 'The last time someone praised you, for anything at all, what went through your head? Pick the closest, and tell me what it was for.'},
  {order: 7, real_life: true, key: 'spur_of_the_moment', prompt: "In the last 30 days, how many times did you do something on the spur of the moment that you wished you hadn't: something said, bought, sent, eaten? Pick the closest, and tell me about one."},
  {order: 8, real_life: true, key: 'looking_in', prompt: "Two hours with nothing to do but think about your life. In your real life, how much do you enjoy that: turning over who you are and how it's going? Pick the closest, and tell me when you last did it."}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
ON CREATE SET q.id = randomUUID()
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false)
WITH s, collect(q.key) AS keys
MATCH (s)-[:HAS_QUESTION]->(old:PersonalityScenarioQuestion) WHERE NOT old.key IN keys
DETACH DELETE old;


// -----------------------------------------------------------------------------
// 3. Check
// -----------------------------------------------------------------------------

// Traits only show once personality_explore_seed.cypher has linked them to their
// domain. This should return 30; if not, run that seed
MATCH (:PersonalityDomain)-[:HAS_FACET]->(t:PersonalityTrait)
RETURN count(t) AS facets;
