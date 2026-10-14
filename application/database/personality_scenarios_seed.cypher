// =============================================================================
// Atlas of Us — Personality scenarios seed
//
// One PersonalityScenario node per scenario, and one PersonalityScenarioQuestion
// node per prompt the user answers in it:
//   (:PersonalityScenario {name, title})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key, prompt, order})
//
// name matches the scenario id the UI uses, and key matches the prompt id in that
// scenario's script (e.g. ui/src/personality/landfall/script.ts). Users' answers are
// (:Person)-[:ANSWERED {answer, reasoning, context, answeredDate, scoring}]->(:PersonalityScenarioQuestion),
// written by the api.
//
// Every answer, multiple choice or free text, is scored by the api's llm job from the
// answer and the user's reasoning. There are no fixed scores per choice.
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
  {name: 'rule_that_doesnt_fit', title: "The Rule That Doesn't Fit"},
  {name: 'proven_wrong',         title: 'Proven Wrong'}
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

// Reading People
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

// The Party of Strangers. Every path shares drive_home
MATCH (s:PersonalityScenario {name: 'party_of_strangers'})
UNWIND [
  {order: 0, key: 'on_the_porch', prompt: "Juno isn't coming, and the door is open. What do you do?"},
  {order: 1, key: 'walking_in',   prompt: "What's going through your mind right now?"},
  {order: 2, key: 'who_to_talk',  prompt: 'Where do you go?'},
  {order: 3, key: 'delphine',     prompt: 'Everyone near you is waiting to hear your answer. What do you say?'},
  {order: 4, key: 'karaoke',      prompt: "He's holding out the microphone. What do you do?"},
  {order: 5, key: 'the_toast',    prompt: 'He tips the bottle toward your glass. What do you do?'},
  {order: 6, key: 'after_party',  prompt: '"You coming?"'},
  {order: 7, key: 'drive_home',   prompt: 'On the drive down, do you feel more drained or more awake than when you arrived? Would you go back next year, even without Juno?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// The Stolen Idea. Every path shares face_to_face, credit and hard_feelings
MATCH (s:PersonalityScenario {name: 'stolen_idea'})
UNWIND [
  {order: 0, key: 'in_the_wings',  prompt: "Standing in the wings while they cheer, what's going through you?"},
  {order: 1, key: 'the_bow',       prompt: 'The light is on you. What do you do?'},
  {order: 2, key: 'tell_fitch',    prompt: 'Mr. Fitch is right there, lighting a cigar. What do you do?'},
  {order: 3, key: 'face_to_face',  prompt: "He's waiting, still grinning. What do you say to him?"},
  {order: 4, key: 'the_favor',     prompt: "He's standing in your doorway with his hat in his hands. What do you tell him?"},
  {order: 5, key: 'credit',        prompt: 'Be honest: how much does it matter to you that people know the Mirror Walk was yours? Is it the money, the applause, or something else?'},
  {order: 6, key: 'hard_feelings', prompt: 'No hard feelings, he says. Are there? What would it take for you to let this go, or have you already?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// The Empty Weekend. Saturday morning and Saturday night branch; every path shares the rest
MATCH (s:PersonalityScenario {name: 'empty_weekend'})
UNWIND [
  {order: 0, key: 'phone_gone',   prompt: "Nobody can reach you, and you can't reach anybody, until Monday. Lying on the bed that first night, how does that sit with you?"},
  {order: 1, key: 'the_morning',  prompt: 'A whole Saturday morning and nothing you have to do. Where do you go?'},
  {order: 2, key: 'the_shelf',    prompt: "You've got all afternoon, a chair, and every shelf in the shop. What do you take down, and why that one?"},
  {order: 3, key: 'the_invite',   prompt: 'Agnes is saving you a seat at the Anchor. What do you do with your Saturday night?'},
  {order: 4, key: 'the_list',     prompt: 'One day left. Do you write a list of your own? What goes on it, and how much of it do you actually do?'},
  {order: 5, key: 'the_pier',     prompt: 'Standing in the middle of all of it, what do you notice first? How long before you have had enough, or could you stay all night?'},
  {order: 6, key: 'how_you_feel', prompt: "It's Sunday night and the weekend is nearly gone. How do you feel right now: rested, restless, a bit low, something else? Where do you think that comes from?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// Let Down
MATCH (s:PersonalityScenario {name: 'let_down'})
UNWIND [
  {order: 0, key: 'first_notice',      prompt: "Something's off, and you can see it. What do you notice about her tonight, and what do you do about it?"},
  {order: 1, key: 'how_you_respond',   prompt: "Juno's looking at her bowl, not at you. What do you do?"},
  {order: 2, key: 'ever_felt_this',    prompt: "Have you ever felt the way Juno does? Tell her about it: when it was, what it was like, and what got you through. If you never have, tell her what you imagine it's like."},
  {order: 3, key: 'the_advice',        prompt: "She's really asking. What advice do you give her, if any? Or what do you say instead?"},
  {order: 4, key: 'the_cancellations', prompt: 'Be honest. How did you feel each time she cancelled on you? And how do you feel about it now?'},
  {order: 5, key: 'the_silence',       prompt: 'Juno has gone quiet again. What do you do now? And how does it feel, sitting on your side of the silence?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// Proven Wrong. what_now branches; every path shares the rest
MATCH (s:PersonalityScenario {name: 'proven_wrong'})
UNWIND [
  {order: 0, key: 'the_letter',       prompt: 'You read it twice. What goes through your head, and what do you make of the result?'},
  {order: 1, key: 'what_now',         prompt: 'What do you do with the letter?'},
  {order: 2, key: 'pru_pushes',       prompt: 'Pru has half a point, or thinks she does. What do you say to her?'},
  {order: 3, key: 'the_motion',       prompt: 'Fifty faces turn round to look at you. What do you stand up and say?'},
  {order: 4, key: 'walt',             prompt: "Walt's waiting, and he isn't going to make it easy. What do you say to him?"},
  {order: 5, key: 'how_you_got_sure', prompt: 'Looking back, how did you get so sure? What did you see that convinced you, and what do you think you skipped past?'},
  {order: 6, key: 'changed_mind',     prompt: 'Away from the allotment now. Think of something in your own life you were certain about and turned out to be wrong. How long did it take you to change your mind, and what finally did it?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order;

// -----------------------------------------------------------------------------
// 3. Cleanup
// -----------------------------------------------------------------------------

// Choices used to carry base scores. Scoring is now the llm's read alone, so remove any left over
MATCH (c:PersonalityScenarioChoice)
DETACH DELETE c;
