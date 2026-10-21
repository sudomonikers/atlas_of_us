import type { Script } from '../personality';

// The Cabin: a winter weekend with old friends, a counter full of snacks, and a friend who doesn't arrive
// Every winter, the same friends rent the same cabin in the mountains. The snacks are there all weekend with nobody
// pushing them, Jun wants to break the tradition, and Cal, driving up on his own, is three hours late on an icy road
// with his phone off. A real clock runs while you wait for him: how long you sit with each prompt is how long you sat
// with the worry. Running out jumps straight to too_long, where Cal turns up before you've finished. Later, by the fire,
// Maya asks whether any religion has it right.
// Written to the IPIP-NEO items in ../scene_grouping.md: rarely overindulging (N5.6), controlling cravings (N5.8),
// preferring what you know (O4.5), disliking change (O4.6), conventional ways (O4.10), one true religion (O6.4),
// worrying (N1.1), fearing the worst (N1.2), feeling emotions intensely (O3.1), rarely noticing them (O3.8),
// understanding people who get emotional (O3.10), being afraid of many things (N1.3) and going on binges (N5.4).

const JUN = 'Jun';
const ROSA = 'Rosa';
const MAYA = 'Maya';
const CAL = 'Cal';

export const theCabin: Script = {
  id: 'the_cabin',
  title: 'The Cabin',
  facets: ['Anxiety', 'Immoderation', 'Emotionality', 'Adventurousness', 'Liberalism'],
  start: 'opening',
  clock: { seconds: 180, from: 'the_wait', until: 'rosa', late: 'too_long' },
  sections: {
    // -------------------------------------------------------------------------
    // the snacks
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Cabin', animation: 'title_card' },
        { text: "Every winter, you and a few old friends rent the same cabin in the mountains for a long weekend. It's been seven years now: the same cabin, the same card game, and chili on the first night.", animation: 'cabin' },
        { text: "This year it's you, Rosa, Jun and Maya. Cal is driving up on his own after work. He texted at three to say he was leaving, and he should be here by six.", animation: 'cabin_friends' },
        { text: "Everyone has brought snacks, and the kitchen counter has disappeared under them: three kinds of chips, a giant bag of candy, cookies, and a cheese board Jun is very proud of.", animation: 'snacks' },
        { text: "Nobody is counting, and nobody is offering. It's all just there, all weekend, within arm's reach.", animation: 'snacks' },
        {
          id: 'the_snacks',
          prompt: 'How does the snack counter go for you, over a whole weekend like this? Pick the closest, and tell me why.',
          animation: 'snacks',
          facets: ['Immoderation'],
          choices: [
            { label: "I graze all weekend. That's half the point of the trip.", next: 'snack_graze' },
            { label: 'A handful here and there, when I actually want some.', next: 'snack_some' },
            { label: 'I barely touch it. I eat at meals, and that\'s it.', next: 'snack_none' },
            { label: "I tell myself I'm done, then end up back at the candy bag.", next: 'snack_back' },
            { label: 'Something else.', next: 'next_year', other: true },
          ],
        },
      ],
    },

    snack_graze: {
      steps: [{ text: "By Saturday night, the candy bag is a third of the size it was, and you know exactly who's responsible.", animation: 'snacks_gone' }],
      next: 'next_year',
    },

    snack_some: {
      steps: [{ text: 'You have a few chips during the card game, and a cookie with your coffee. The rest you leave alone.', animation: 'snacks_some' }],
      next: 'next_year',
    },

    snack_none: {
      steps: [{ text: 'You eat at meals, and walk past the counter the rest of the time. Jun asks if you\'re feeling okay.', animation: 'snacks' }],
      next: 'next_year',
    },

    snack_back: {
      steps: [{ text: '"That\'s my last one," you say, three separate times. The candy bag notices.', animation: 'snacks_gone' }],
      next: 'next_year',
    },

    // -------------------------------------------------------------------------
    // next year
    // -------------------------------------------------------------------------
    next_year: {
      steps: [
        { text: "On Friday night, the four of you eat the chili without Cal. Halfway through, Jun puts his spoon down.", animation: 'dinner' },
        { speaker: JUN, text: "Hear me out. Seven years, same cabin, same chili, same game. What if next year we did something completely different? A city none of us has been to. Different food every night. No chili.", animation: 'jun_idea' },
        { text: 'Rosa looks horrified. Maya looks interested. Then everyone turns to you.', animation: 'looks' },
        {
          id: 'next_year',
          prompt: "What do you think of Jun's idea? Pick the closest, and say it how you'd say it at the table.",
          animation: 'looks',
          facets: ['Adventurousness'],
          choices: [
            { label: "I love it. Let's pick the city tonight.", next: 'ny_yes' },
            { label: 'Keep the cabin, but try one new thing each year.', next: 'ny_some' },
            { label: "No. The cabin is the point. That's what makes it ours.", next: 'ny_no' },
            { label: 'Say it sounds fun, and hope everyone forgets by morning.', next: 'ny_nod' },
            { label: 'Something else.', next: 'nine_oclock', other: true },
          ],
        },
      ],
    },

    ny_yes: {
      steps: [{ text: '"Lisbon?" says Maya. By the end of dinner, there\'s a list of four cities on a napkin, and Rosa has added "WITH A CABIN NEARBY" at the bottom.', animation: 'napkin' }],
      next: 'nine_oclock',
    },

    ny_some: {
      steps: [{ text: '"One new thing a year," Jun says. "Fine. I\'m picking the first one." Rosa relaxes a little.', animation: 'dinner' }],
      next: 'nine_oclock',
    },

    ny_no: {
      steps: [{ text: '"Same cabin," you say. "Same chili." Rosa clinks her bowl against yours. Jun sighs, and takes seconds anyway.', animation: 'clink' }],
      next: 'nine_oclock',
    },

    ny_nod: {
      steps: [{ text: '"Sounds fun," you say, and pass the cornbread. Something tells you it won\'t come up again.', animation: 'dinner' }],
      next: 'nine_oclock',
    },

    // -------------------------------------------------------------------------
    // three hours late, and the clock starts
    // -------------------------------------------------------------------------
    nine_oclock: {
      steps: [
        { text: "By nine, the chili is cold, and Cal still isn't here. It's been snowing hard since dinner, and the road up the mountain is all switchbacks and black ice.", animation: 'window' },
        { text: 'You call him again. It goes straight to voicemail, just like the last five times.', animation: 'voicemail' },
        { text: 'From here on, the clock is real.', animation: 'voicemail' },
      ],
      next: 'the_wait',
    },

    the_wait: {
      steps: [
        {
          id: 'the_wait',
          prompt: "Cal is three hours late, his phone is off, and the road is icy. What goes through your head? Pick the closest, and tell me what you're picturing.",
          animation: 'voicemail',
          facets: ['Anxiety'],
          choices: [
            { label: 'I keep picturing his car off the road, in the snow.', next: 'wait_crash' },
            { label: 'Do something: call the store at the bottom of the mountain, then the highway patrol.', next: 'wait_call' },
            { label: "His phone's died, and he's driving slowly. He'll turn up.", next: 'wait_fine' },
            { label: "I'm annoyed. Typical Cal, and now everyone's on edge.", next: 'wait_cross' },
            { label: 'Something else.', next: 'feeling', other: true },
          ],
        },
      ],
    },

    wait_crash: {
      steps: [{ text: 'You keep seeing headlights going over the edge of a switchback. You try to play cards, but you can\'t follow the game.', animation: 'crash' }],
      next: 'feeling',
    },

    wait_call: {
      steps: [{ text: 'The store at the bottom of the mountain says the road is still open, as far as they know. The highway patrol puts you on hold.', animation: 'hold' }],
      next: 'feeling',
    },

    wait_fine: {
      steps: [{ text: '"He\'s fine," you tell everyone. "His phone died, that\'s all. Deal me in."', animation: 'calm' }],
      next: 'feeling',
    },

    wait_cross: {
      steps: [{ text: "You text him: Where ARE you? The message doesn't even deliver.", animation: 'text' }],
      next: 'feeling',
    },

    feeling: {
      steps: [
        {
          id: 'the_feeling',
          prompt: "While you wait, what's going on inside you? Pick the closest, and tell me where in your body you feel it.",
          animation: 'inside',
          facets: ['Emotionality', 'Anxiety'],
          choices: [
            { label: "It's huge. My chest is tight and my hands won't keep still.", next: 'rosa' },
            { label: 'I feel it, but I push it down. Someone has to stay calm.', next: 'rosa' },
            { label: 'Not much, honestly. I just get on with the dishes.', next: 'rosa' },
            { label: "I couldn't say. I don't really notice until later.", next: 'rosa' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // the clock stops here when the player gets through in time
    // -------------------------------------------------------------------------
    rosa: {
      steps: [
        { text: "Rosa has gone quiet by the window. Then her shoulders start to shake, and she's crying.", animation: 'rosa_cry' },
        { speaker: ROSA, text: "Sorry. Sorry. It's just that my brother skidded off a road like this, years ago. He was okay, in the end. But I remember that phone call.", animation: 'rosa_cry' },
        {
          id: 'the_tears',
          prompt: 'Rosa is crying by the window. What do you do, and what do you make of it? Pick the closest.',
          animation: 'rosa_cry',
          facets: ['Emotionality'],
          choices: [
            { label: 'Hold her, and end up crying too.', next: 'tears_cry' },
            { label: 'Sit with her, and hold her hand until it passes.', next: 'tears_hand' },
            { label: "Feel awkward. I wish she wouldn't, it isn't helping.", next: 'tears_awkward' },
            { label: 'Make some hot chocolate, and get on with sorting things out.', next: 'tears_cocoa' },
            { label: 'Something else.', next: 'arrival', other: true },
          ],
        },
      ],
    },

    tears_cry: {
      steps: [{ text: "You hold her, and before you know it you're crying too, the two of you together by the window.", animation: 'cry' }],
      next: 'arrival',
    },

    tears_hand: {
      steps: [{ text: 'You sit her down at the table and hold her hand. After a while, she wipes her eyes and says she\'s being silly.', animation: 'hand' }],
      next: 'arrival',
    },

    tears_awkward: {
      steps: [{ text: "You hover by the table, not sure where to look. Maya goes over and puts an arm around her.", animation: 'awkward' }],
      next: 'arrival',
    },

    tears_cocoa: {
      steps: [{ text: 'You put some milk on to heat, and find the marshmallows. Rosa wipes her eyes, and comes over to help.', animation: 'cocoa' }],
      next: 'arrival',
    },

    arrival: {
      steps: [
        { text: 'Then headlights sweep across the window, and tires crunch on the snow outside.', animation: 'headlights' },
        { speaker: CAL, text: "Sorry! Sorry. They closed the road for an hour to clear a crash, and my phone died. I've been stuck behind a snowplow since seven.", animation: 'cal_in' },
        { text: 'Rosa hugs him so hard that he drops his bag.', animation: 'hug' },
      ],
      next: 'by_the_fire',
    },

    // -------------------------------------------------------------------------
    // the clock ran out: Cal turns up before you've finished
    // -------------------------------------------------------------------------
    too_long: {
      steps: [
        { text: "It's ten o'clock, and there's still nothing. Then headlights sweep across the window, and tires crunch on the snow outside.", animation: 'headlights' },
        { speaker: CAL, text: "Sorry! Sorry. They closed the road for an hour to clear a crash, and my phone died. I've been stuck behind a snowplow since seven.", animation: 'cal_in' },
        { text: 'Rosa bursts into tears, and won\'t let go of him. "My brother skidded off a road like this, years ago. I remember that phone call."', animation: 'rosa_relief' },
        {
          id: 'the_tears',
          prompt: "Rosa is sobbing on Cal's shoulder. What do you do, and what do you make of it? Pick the closest.",
          animation: 'rosa_relief',
          facets: ['Emotionality'],
          choices: [
            { label: 'Hold her, and end up crying too.', next: 'by_the_fire' },
            { label: 'Hold her hand until it passes.', next: 'by_the_fire' },
            { label: "Feel awkward. I wish she wouldn't, he's fine.", next: 'by_the_fire' },
            { label: 'Make some hot chocolate, and heat up some chili for Cal.', next: 'by_the_fire' },
            { label: 'Something else.', next: 'by_the_fire', other: true },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // by the fire
    // -------------------------------------------------------------------------
    by_the_fire: {
      steps: [
        { text: 'Later, after Cal has eaten two bowls of cold chili, everyone ends up on the rug by the fire. The snow has stopped, and the talk drifts the way it does at one in the morning.', animation: 'fire' },
        { speaker: MAYA, text: 'Okay, big question. Do you think any religion actually has it right? Like, one of them is true, and the rest are wrong?', animation: 'fire_question' },
        { text: "Nobody jumps in. It isn't an argument. Everyone just wants to know what everyone else thinks.", animation: 'fire_question' },
        {
          id: 'the_faith',
          prompt: 'What do you really think? Pick the closest, and tell me why.',
          animation: 'fire_question',
          facets: ['Liberalism'],
          choices: [
            { label: "Yes. There's one true faith, and I believe in it.", next: 'faith_one' },
            { label: "There's some truth in all of them.", next: 'faith_many' },
            { label: "I don't think any of them have it right.", next: 'faith_none' },
            { label: "Everyone has to find their own way. There's no one answer.", next: 'faith_own' },
            { label: 'Something else.', next: 'night', other: true },
          ],
        },
      ],
    },

    faith_one: {
      steps: [{ text: '"Which one?" Maya asks, and you tell her. She asks good questions, and listens to the answers. The fire pops.', animation: 'fire_talk' }],
      next: 'night',
    },

    faith_many: {
      steps: [{ text: '"Some truth in all of them," Jun says, and pokes the fire. "I like that."', animation: 'fire_talk' }],
      next: 'night',
    },

    faith_none: {
      steps: [{ text: '"Same," says Cal, through a mouthful of chili. Rosa isn\'t so sure, and says so, and it turns into an hour.', animation: 'fire_talk' }],
      next: 'night',
    },

    faith_own: {
      steps: [{ text: '"Everyone finds their own way," you say. Maya thinks about it for a long time, and then nods.', animation: 'fire_talk' }],
      next: 'night',
    },

    // -------------------------------------------------------------------------
    // that night
    // -------------------------------------------------------------------------
    night: {
      steps: [
        { text: "Much later, in the bunk room, you can't sleep. Through the wall, you can hear Cal snoring. He's safe.", animation: 'bunks' },
        {
          id: 'the_night',
          prompt: 'Lying awake in the dark, what else do you find yourself afraid of? Big or small, tell me what comes up, and how often those fears keep you awake.',
          animation: 'fears',
          facets: ['Anxiety'],
        },
      ],
      next: 'later',
    },

    later: {
      steps: [
        { text: 'On Sunday morning there are pancakes, the snow is glittering in the sun, and Cal is teaching everyone a new card game. Even Rosa is playing.', animation: 'morning' },
        {
          id: 'looking_back',
          prompt: "Looking back on the weekend, which part stays with you most: the snacks, Jun's idea, the wait for Cal, or the talk by the fire? Why that one, and would you do anything differently?",
          animation: 'morning',
          facets: ['Anxiety', 'Immoderation', 'Emotionality', 'Adventurousness', 'Liberalism'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and your real life.', animation: 'questions' },
        {
          id: 'last_binge',
          prompt: 'In the last 30 days, how many times did you go on a binge: eating, drinking, shopping or watching far more than you meant to, all in one go? Give me a number, and tell me about the last one.',
          animation: 'questions',
          facets: ['Immoderation'],
        },
        {
          id: 'last_worry',
          prompt: 'And in the last 30 days, on how many days did you worry about something that never ended up happening? What was it, and how strongly did you feel it?',
          animation: 'questions',
          facets: ['Anxiety', 'Emotionality'],
        },
        {
          id: 'last_change',
          prompt: 'Last one. When did you last give up a habit or a tradition, or try something completely new, because someone suggested it? How did it go?',
          animation: 'questions',
          facets: ['Adventurousness', 'Liberalism'],
        },
        { text: 'In March, a postcard arrives from Jun. It\'s a photo of a city none of you have been to, and on the back it says: "Just saying. -J"', animation: 'goodbye' },
      ],
    },
  },
};
