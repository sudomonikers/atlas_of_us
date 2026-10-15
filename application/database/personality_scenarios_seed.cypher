// =============================================================================
// Atlas of Us — Personality scenarios seed
//
// One PersonalityScenario node per scenario, and one PersonalityScenarioQuestion
// node per prompt the user answers in it:
//   (:PersonalityScenario {name, title})-[:HAS_QUESTION]->(:PersonalityScenarioQuestion {key, prompt, order, real_life})
//
// real_life marks questions about the user's own life rather than the story. The scoring job counts them for more.
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
  {name: 'reading_people',       title: 'Reading People'},
  {name: 'the_offer',            title: 'The Offer'},
  {name: 'the_archive',          title: 'The Archive'},
  {name: 'rule_that_doesnt_fit', title: "The Rule That Doesn't Fit"},
  {name: 'proven_wrong',         title: 'Proven Wrong'},
  {name: 'the_water',            title: 'The Water'},
  {name: 'black_clay',           title: 'The Black Clay'},
  {name: 'owambe',               title: 'The Owambe'},
  {name: 'soap_house',           title: 'The Soap House'}
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
  {order: 5, key: 'the_logbook',       prompt: "Write tonight's entry in the log, any way you like: what happened today, and what that light and the bell might be."},
  {order: 6, key: 'go_to_light',       prompt: 'Ines is already reaching for a torch. What do you do?'},
  {order: 7, key: 'night_reflection',  prompt: "Lying there, be honest with yourself: do you think you'll get off this island? And what do you want to do tomorrow?"},
  {order: 8, real_life: true, key: 'your_mind',         prompt: "Away from the island now. When you're on your own with nothing to do, where does your mind go? Tell us about the last time."}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// Expedition II: The Thief
MATCH (s:PersonalityScenario {name: 'the_thief'})
UNWIND [
  {order: 0, key: 'first_suspicion', prompt: 'Everyone is watching everyone else. What do you make of all this? Who do you think took the food, if anyone, and why?'},
  {order: 1, key: 'search_bags',     prompt: "Voss wants to search everyone's things. What do you say?"},
  {order: 2, key: 'why_tob',         prompt: 'Tob is shaking. Why do you think he really did it? And how do you feel about him right now?'},
  {order: 3, key: 'tob_punishment',  prompt: 'What should happen to Tob?'},
  {order: 4, key: 'maren_knew',      prompt: 'Maren knew, and said nothing. How do you deal with that?'},
  {order: 5, key: 'share_portion',   prompt: 'Your own portion is in your hands. What do you do with it?'},
  {order: 6, key: 'camp_rules',      prompt: 'What rules, if any, should the camp live by from now on? And who gets to decide them?'},
  {order: 7, real_life: true, key: 'your_trust',      prompt: 'Away from the island now. Think of someone in your own life who let you down, or took something that was yours. Did you trust them again, and how long did it take?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// Reading People
MATCH (s:PersonalityScenario {name: 'reading_people'})
UNWIND [
  {order: 0, key: 'festival_laugh',   prompt: 'What do you think they were laughing at? How did it feel to walk into that?'},
  {order: 1, key: 'your_turn',        prompt: "They're all looking at you, grinning. What do you show them, or what do you say?"},
  {order: 2, key: 'ren_credit',       prompt: 'Ms. Kuroda is waiting. What do you say, and why?'},
  {order: 3, key: 'ren_after',        prompt: "It's just the two of you on the roof now. Do you say anything to Ren about how he told it? If so, what?"},
  {order: 4, key: 'old_man_feeling',  prompt: 'How did watching him leave you feeling? Take a moment with it before you answer.'},
  {order: 5, key: 'aoi_next',         prompt: 'The note is still folded in your hand. Do you read the rest, give it back, bring it up, or let it be? Why?'},
  {order: 6, real_life: true, key: 'your_reading',     prompt: 'Away from these four moments now. Think of the last time you thought someone was annoyed with you, or laughing at you. What did you do with it, and how long did it stay with you?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

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
  {order: 6, key: 'take_one',      prompt: 'You can take one thing home from the observatory. What do you take, and why?'},
  {order: 7, real_life: true, key: 'your_deadline', prompt: 'Away from the observatory now. Think of a real time a deadline ran into something more interesting. Which one won, and do you regret it?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);


// The Rule That Doesn't Fit. the_count is only asked of players who let Nessa on, so it can go unanswered
MATCH (s:PersonalityScenario {name: 'rule_that_doesnt_fit'})
UNWIND [
  {order: 0, key: 'first_response',  prompt: "She's out of breath and shivering. What do you say first?"},
  {order: 1, key: 'believe',         prompt: 'Do you believe her? What makes you think so, or not?'},
  {order: 2, key: 'the_rule',        prompt: "It's 9:37. What do you do?"},
  {order: 3, key: 'the_count',       prompt: 'The captain is waiting. What do you tell him?'},
  {order: 4, key: 'the_rule_itself', prompt: 'The rule says 120, no exceptions. Is it a good rule? Would you change it?'},
  {order: 5, key: 'if_she_lied',     prompt: "Suppose you found out her story wasn't true. Would that change how you feel about what you did?"},
  {order: 6, real_life: true, key: 'your_rule',       prompt: "Away from the ferry now. Think of a rule at work or school that you broke, or kept even though you didn't want to. What was it, and why did you go the way you did?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Offer. Every path shares what_decided and gone_wrong
MATCH (s:PersonalityScenario {name: 'the_offer'})
UNWIND [
  {order: 0, key: 'first_reaction', prompt: 'She waits for your answer. What do you say?'},
  {order: 1, key: 'the_tour',       prompt: 'Okafor has an hour before the next fuel transfer. What do you want to see?'},
  {order: 2, key: 'what_worries',   prompt: 'What worries you most about going?'},
  {order: 3, key: 'can_you',        prompt: 'Could you handle it?'},
  {order: 4, key: 'the_decision',   prompt: 'What do you tell her?'},
  {order: 5, key: 'what_decided',   prompt: 'What decided it for you?'},
  {order: 6, key: 'gone_wrong',     prompt: "Imagine it's a year later, and the choice you made has gone badly. What went wrong, and what do you do about it?"},
  {order: 7, real_life: true, key: 'your_leap',      prompt: "Away from Halden now. What's the biggest leap you've actually taken in your own life? How long did you go back and forth before you jumped?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Party of Strangers. Every path shares drive_home
MATCH (s:PersonalityScenario {name: 'party_of_strangers'})
UNWIND [
  {order: 0, key: 'on_the_porch', prompt: "Juno isn't coming, and the door is open. What do you do?"},
  {order: 1, key: 'first_hello',  prompt: "He's still looking your way. What do you do?"},
  {order: 2, key: 'who_to_talk',  prompt: 'Where do you go?'},
  {order: 3, key: 'delphine',     prompt: 'Everyone near you is waiting. A real answer, a joke, or an argument: what do you say?'},
  {order: 4, key: 'karaoke',      prompt: "He's holding out the microphone. What do you do?"},
  {order: 5, key: 'the_toast',    prompt: 'He tips the bottle toward your glass. What do you do?'},
  {order: 6, key: 'the_new_year', prompt: "Midnight on a mountain, with twenty people you didn't know this morning. What's that minute like for you?"},
  {order: 7, key: 'after_party',  prompt: '"You coming?"'},
  {order: 8, key: 'drive_home',   prompt: 'On the drive down, do you feel more drained or more awake than when you arrived? Would you go back next year, even without Juno?'},
  {order: 9, real_life: true, key: 'your_friday',  prompt: 'Away from the mountain now. Think of your last free Friday night. What did you choose to do with it, and with how many people?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Stolen Idea. Every path shares face_to_face, credit and hard_feelings
MATCH (s:PersonalityScenario {name: 'stolen_idea'})
UNWIND [
  {order: 0, key: 'in_the_wings',  prompt: "Standing in the wings while they cheer, what's going through you?"},
  {order: 1, key: 'the_bow',       prompt: 'The light is on you. What do you do?'},
  {order: 2, key: 'tell_fitch',    prompt: 'Mr. Fitch is right there, lighting a cigar. What do you do?'},
  {order: 3, key: 'face_to_face',  prompt: "He's waiting, still grinning. What do you say to him?"},
  {order: 4, key: 'the_favor',     prompt: "He's standing in your doorway with his hat in his hands. What do you tell him?"},
  {order: 5, key: 'credit',        prompt: 'Be honest: how much does it matter to you that people know the Mirror Walk was yours? Is it the money, the applause, or something else?'},
  {order: 6, key: 'hard_feelings', prompt: 'No hard feelings, he says. Are there? What would it take for you to let this go, or have you already?'},
  {order: 7, real_life: true, key: 'your_rival',    prompt: 'Away from the stage now. Think of a real time you were up against someone for something you both wanted. How much did beating them matter to you, and how did you feel about them afterwards?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Empty Weekend. Saturday morning and Saturday night branch; every path shares the rest
MATCH (s:PersonalityScenario {name: 'empty_weekend'})
UNWIND [
  {order: 0, key: 'phone_gone',   prompt: "Nobody can reach you, and you can't reach anybody, until Monday. Lying on the bed that first night, how does that sit with you?"},
  {order: 1, key: 'the_morning',  prompt: 'A whole Saturday morning and nothing you have to do. Where do you go?'},
  {order: 2, key: 'the_shelf',    prompt: "You've got all afternoon, a chair, and every shelf in the shop. What do you take down, and why that one?"},
  {order: 3, key: 'the_invite',   prompt: 'Agnes is saving you a seat at the Anchor. What do you do with your Saturday night?'},
  {order: 4, key: 'the_list',     prompt: 'One day left. Do you write a list of your own? What goes on it, and how much of it do you actually do?'},
  {order: 5, key: 'the_pier',     prompt: 'Standing in the middle of all of it, what do you notice first? How long before you have had enough, or could you stay all night?'},
  {order: 6, key: 'how_you_feel', prompt: "It's Sunday night and the weekend is nearly gone. How do you feel right now: rested, restless, a bit low, something else? Where do you think that comes from?"},
  {order: 7, real_life: true, key: 'your_weekend', prompt: 'Away from Gullhaven now. Think of your last free weekend at home. What did you actually do with it, roughly hour by hour, and how did it feel by Sunday night?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// Let Down
MATCH (s:PersonalityScenario {name: 'let_down'})
UNWIND [
  {order: 0, key: 'first_notice',      prompt: "Something's off, and you can see it. What do you notice about her tonight, and what do you do about it?"},
  {order: 1, key: 'how_you_respond',   prompt: "Juno's looking at her bowl, not at you. What do you do?"},
  {order: 2, real_life: true, key: 'ever_felt_this',    prompt: "Have you ever felt the way Juno does? Tell her about it: when it was, what it was like, and what got you through. If you never have, tell her what you imagine it's like."},
  {order: 3, key: 'the_advice',        prompt: "She's really asking. What advice do you give her, if any? Or what do you say instead?"},
  {order: 4, key: 'the_cancellations', prompt: 'Be honest. How did you feel each time she cancelled on you? And how do you feel about it now?'},
  {order: 5, key: 'the_silence',       prompt: 'Juno has gone quiet again. What do you do now? And how does it feel, sitting on your side of the silence?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// Proven Wrong. what_now branches; every path shares the rest
MATCH (s:PersonalityScenario {name: 'proven_wrong'})
UNWIND [
  {order: 0, key: 'the_letter',       prompt: 'You read it twice. What goes through your head, and what do you make of the result?'},
  {order: 1, key: 'what_now',         prompt: 'What do you do with the letter?'},
  {order: 2, key: 'pru_pushes',       prompt: 'Pru has half a point, or thinks she does. What do you say to her?'},
  {order: 3, key: 'the_motion',       prompt: 'Fifty faces turn round to look at you. What do you stand up and say?'},
  {order: 4, key: 'walt',             prompt: "Walt's waiting, and he isn't going to make it easy. What do you say to him?"},
  {order: 5, key: 'how_you_got_sure', prompt: 'Looking back over the last six months, what, if anything, would you have done differently?'},
  {order: 6, real_life: true, key: 'changed_mind',     prompt: 'Away from the allotment now. Think of something in your own life you were certain about and turned out to be wrong. How long did it take you to change your mind, and what finally did it?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Water
MATCH (s:PersonalityScenario {name: 'the_water'})
UNWIND [
  {order: 0, key: 'the_knock',   prompt: "The water's still rising, and the three of them are dripping on your landing. What do you do, and what's going through your head?"},
  {order: 1, key: 'the_night',   prompt: 'Five people, one gas stove, two cans of water, one torch, and no idea how long this will last. How do you get everyone through the night?'},
  {order: 2, key: 'the_noise',   prompt: "Five of you in one room, and the noise doesn't stop. Can you sleep through it? What gets to you most?"},
  {order: 3, key: 'who_goes',    prompt: 'Somebody needs to wade out for drinking water. What do you do?'},
  {order: 4, key: 'rajan',       prompt: "The water's still coming up, and Rajan sir won't leave. What do you do?"},
  {order: 5, key: 'the_boat',    prompt: "Four places for six of you, and the light's going. Paati won't go without you, and the boat might not come back tonight. Who goes, and do you?"},
  {order: 6, key: 'three_days',  prompt: 'Three days with nothing to do but wait for the water to go down. How do you spend them, and how do you take the waiting?'},
  {order: 7, key: 'the_mud',     prompt: "Selvi has lost nearly everything in her flat. Honestly, how do you think the next few months go, for her and for the street?"},
  {order: 8, real_life: true, key: 'your_storm',  prompt: 'Away from Chennai now. Think of a time when something went badly wrong around you: a real emergency, or a sudden mess. What did you actually do in the first hour, and how did you feel afterwards?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// The Black Clay
MATCH (s:PersonalityScenario {name: 'black_clay'})
UNWIND [
  {order: 0, key: 'the_order',   prompt: 'Mariana is waiting on the line. What do you tell her?'},
  {order: 1, key: 'the_ripple',  prompt: "It's two in the morning, and it's a flaw almost nobody else would notice. What do you do with the jar?"},
  {order: 2, key: 'beto',        prompt: 'Beto wants to help, his way. What do you say to him?'},
  {order: 3, key: 'the_wait',    prompt: 'Three weeks of work is in the ground, and the night is long. When do you open the kiln?'},
  {order: 4, key: 'the_shards',  prompt: 'Seventeen pieces broken, four days to go. What goes through your head, and what do you do this morning?'},
  {order: 5, key: 'the_call',    prompt: 'Fifteen pieces, and she wants forty. What do you do?'},
  {order: 6, real_life: true, key: 'your_firing', prompt: 'Away from Oaxaca now. Think of something you worked hard on that went wrong right at the end. What did you do the next day, and how long did it take you to get going again?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

MATCH (s:PersonalityScenario {name: 'owambe'})
UNWIND [
  {order: 0, key: 'the_aso_ebi',    prompt: 'The lace is on the table and her tape measure is round her neck. What do you ask her to make, and how should it look?'},
  {order: 1, key: 'the_entrance',   prompt: 'They both turn to you. What do you say?'},
  {order: 2, key: 'the_mic',        prompt: 'The microphone is in your hand and the hall is waiting. What do you say?'},
  {order: 3, key: 'the_dance',      prompt: 'Grandma wants you on the floor. What do you do?'},
  {order: 4, key: 'the_blackout',   prompt: "Four hundred guests in the dark, and the generator won't start. How do you think the rest of the night goes?"},
  {order: 5, key: 'in_the_dark',    prompt: 'What do you do?'},
  {order: 6, key: 'the_note',       prompt: 'Write your note to Tolu and Emeka, to open ten years from now.'},
  {order: 7, real_life: true, key: 'your_tradition', prompt: 'Away from Lagos now. Think of a tradition in your own family or culture. Do you keep it, change it, or let it go, and why?'}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

MATCH (s:PersonalityScenario {name: 'soap_house'})
UNWIND [
  {order: 0, key: 'the_praise', prompt: 'Everyone near you heard. What do you say?'},
  {order: 1, key: 'the_will',   prompt: 'They both look at you. What do you think is fair here, and what do you say?'},
  {order: 2, key: 'the_sale',   prompt: 'Mr. Haddad is waiting for an answer. What do you do?'},
  {order: 3, key: 'abu_samir',  prompt: 'Do you give Abu Samir anything from your own share? What, if anything, and why?'},
  {order: 4, key: 'the_seal',   prompt: 'There is one seal. Who should have it?'},
  {order: 5, key: 'the_rift',   prompt: 'They each want you on their side. What do you do?'},
  {order: 6, real_life: true, key: 'your_share', prompt: "Away from Aleppo now. Think of a time you had to share something that couldn't be split evenly: money, work, credit, or someone's time and care. How did you split it, and did everyone think it was fair?"}
] AS question
MERGE (s)-[:HAS_QUESTION]->(q:PersonalityScenarioQuestion {key: question.key})
SET q.prompt = question.prompt, q.order = question.order, q.real_life = coalesce(question.real_life, false);

// -----------------------------------------------------------------------------
// 3. Cleanup
// -----------------------------------------------------------------------------

// Choices used to carry base scores. Scoring is now the llm's read alone, so remove any left over
MATCH (c:PersonalityScenarioChoice)
DETACH DELETE c;
