import type { Script } from '../personality';

// The Emergency: a pot of oil, a kitchen full of smoke, and three real minutes
// You're hosting dinner, and the pot of oil for the fries catches fire. A real clock starts with the flames: how long you take to
// answer the first prompt is how long you stood there, and every prompt after it costs real seconds while the alarm
// screams. Running out jumps straight to too_late, so the prompts in between can go unanswered.
// Written to the IPIP-NEO items in ../scene_grouping.md: panicking easily (N6.1), remaining calm under pressure (N6.6),
// waiting for others to lead the way (E3.6), becoming overwhelmed by events (N6.2), feeling unable to deal with things
// (N6.3), handling tasks smoothly (C1.3) and loving to help others (A3.3).

const IVY = 'Ivy, from upstairs';

export const theEmergency: Script = {
  id: 'the_emergency',
  title: 'The Emergency',
  facets: ['Vulnerability', 'Assertiveness', 'Altruism', 'Self-Efficacy'],
  start: 'opening',
  clock: { seconds: 180, from: 'the_fire', until: 'all_clear', late: 'too_late' },
  sections: {
    // -------------------------------------------------------------------------
    // before the clock starts
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Emergency', animation: 'title_card' },
        { text: "It's Saturday night. You've got six people around your table, and for once you've cooked a real dinner: a leg of lamb, and homemade fries.", animation: 'dinner' },
        { text: "Your sister has brought Femi, her new boyfriend. Tess, your oldest friend, is telling the story about the canoe trip again, and everyone's laughing.", animation: 'guests' },
        { text: 'You slip into the kitchen to make the fries. The pot of oil has been heating up on the stove for a while now.', animation: 'pan' },
        { text: 'You turn to the freezer to grab the fries. When you turn back around, the pot is on fire, and the flames are licking the cabinet above it.', animation: 'fire' },
        { text: 'From here on, the clock is real.', animation: 'fire' },
      ],
      next: 'the_fire',
    },

    // -------------------------------------------------------------------------
    // the first seconds
    // -------------------------------------------------------------------------
    the_fire: {
      steps: [
        {
          id: 'the_fire',
          prompt: 'What do you do, right now? Pick one, and tell me what goes through your head.',
          animation: 'fire',
          facets: ['Vulnerability', 'Assertiveness'],
          choices: [
            { label: "Act straight away. Grab whatever's nearest, and deal with it.", next: 'fire_act' },
            { label: 'Shout for help. Someone else will know what to do.', next: 'fire_shout' },
            { label: "Take a breath, and think about what you're meant to do with a fire like this.", next: 'fire_think' },
            { label: 'Freeze. For a second, my mind goes completely blank.', next: 'fire_freeze' },
            { label: 'Something else.', next: 'chaos', other: true },
          ],
        },
      ],
    },

    fire_act: {
      steps: [{ text: 'You lunge for the stove, turn off the burner, grab the baking sheet off the counter and slam it down over the pot. The flames go out, like someone pulled a plug.', animation: 'lid' }],
      next: 'chaos',
    },

    fire_think: {
      steps: [{ text: 'Not water. Burner off, then cover it. You turn the knob, slide the baking sheet over the pot, and the flames go out, like someone pulled a plug.', animation: 'lid' }],
      next: 'chaos',
    },

    fire_shout: {
      steps: [{ text: '"Burner off! Cover it!" Femi is there in two seconds, and does it himself. The flames go out. Then he looks at you.', animation: 'femi' }],
      next: 'chaos',
    },

    fire_freeze: {
      steps: [{ text: 'Two seconds go by. Three. Then Femi pushes past you, turns off the burner and slams a baking sheet down over the pot. The flames go out.', animation: 'femi' }],
      next: 'chaos',
    },

    // -------------------------------------------------------------------------
    // three more things go wrong at once
    // -------------------------------------------------------------------------
    chaos: {
      steps: [
        { text: "The fire is out, but black smoke is still pouring off the pot, and you can't see the far wall.", animation: 'smoke' },
        { text: "Then three things happen at once. The smoke alarm starts screaming. Someone is pounding on the front door. And in the oven, the lamb is starting to burn.", animation: 'three' },
        {
          id: 'the_chaos',
          prompt: "What do you do? Pick the closest, and tell me how you're feeling, right this second.",
          animation: 'three',
          facets: ['Vulnerability', 'Self-Efficacy'],
          choices: [
            { label: 'One thing at a time: window, oven, then the door. The alarm can wait.', next: 'chaos_steady' },
            { label: "Give everyone a job: Tess the windows, Femi the door. I'll do the oven.", next: 'chaos_jobs' },
            { label: "All of it at once. I'm running between them and getting nowhere.", next: 'chaos_scramble' },
            { label: "I can't. I stand in the hall with my hands over my ears.", next: 'chaos_stuck' },
            { label: 'Something else.', next: 'panic', other: true },
          ],
        },
      ],
    },

    chaos_steady: {
      steps: [{ text: 'Window, oven, door. It\'s Mr. Okafor from downstairs, in his slippers: "Is everyone okay?" One by one, everything calms down, except the alarm.', animation: 'steady' }],
      next: 'panic',
    },

    chaos_jobs: {
      steps: [{ text: 'Tess throws the windows open, and Femi gets the door. You pull the lamb out of the oven, and it\'s only a little black on top.', animation: 'jobs' }],
      next: 'panic',
    },

    chaos_scramble: {
      steps: [{ text: 'You open a window, start for the door, run back for the oven, and burn your hand on the roasting pan. The alarm keeps going.', animation: 'scramble' }],
      next: 'panic',
    },

    chaos_stuck: {
      steps: [{ text: 'Tess finds you in the hall, and steers you over to the couch. Femi and your sister handle the rest.', animation: 'stuck' }],
      next: 'panic',
    },

    // -------------------------------------------------------------------------
    // a guest is panicking
    // -------------------------------------------------------------------------
    panic: {
      steps: [
        { text: "Then you see Ivy, from the apartment upstairs. She came down when she heard the alarm, and she's sitting on the stairs outside your door, shaking.", animation: 'nell' },
        { speaker: IVY, text: "Sorry. I'm sorry. We had a fire when I was little. I can't catch my breath.", animation: 'nell_panic' },
        {
          id: 'the_panic',
          prompt: "What do you do? Pick the closest, and tell me what you'd say to her.",
          animation: 'nell_panic',
          facets: ['Altruism'],
          choices: [
            { label: 'Sit with her on the stairs, and breathe with her until it passes.', next: 'panic_sit' },
            { label: 'Bring her some water and a coat, and check on her in a bit.', next: 'panic_water' },
            { label: 'Ask Tess to look after her. The kitchen still needs me.', next: 'panic_jo' },
            { label: "Tell her it's all over, and there's nothing to worry about.", next: 'panic_tell' },
            { label: 'Something else.', next: 'all_clear', other: true },
          ],
        },
      ],
    },

    panic_sit: {
      steps: [{ text: 'You sit together on the cold step. Breathe in for four, out for four. After a while, her shoulders start to relax.', animation: 'sit' }],
      next: 'all_clear',
    },

    panic_water: {
      steps: [{ text: 'You bring her a glass of water and your big coat. When you come back to check on her ten minutes later, she\'s stopped shaking.', animation: 'water' }],
      next: 'all_clear',
    },

    panic_jo: {
      steps: [{ text: 'Tess sits down next to her on the stairs. You go back to the kitchen and open another window.', animation: 'jo_nell' }],
      next: 'all_clear',
    },

    panic_tell: {
      steps: [{ text: '"It\'s out, honestly, it\'s fine," you tell her. She nods, but keeps shaking.', animation: 'tell' }],
      next: 'all_clear',
    },

    // -------------------------------------------------------------------------
    // over, either way
    // -------------------------------------------------------------------------
    all_clear: {
      steps: [
        { text: 'The alarm finally stops. The smoke drifts out the windows into the night, and the kitchen is just a kitchen again, with a blackened pot in it.', animation: 'clear' },
        {
          id: 'how_it_went',
          prompt: "It's over. How do you think you did? Pick one, and tell me how your body feels now.",
          animation: 'clear',
          facets: ['Vulnerability', 'Self-Efficacy'],
          choices: [
            { label: 'Pretty well. I kept my head.', next: 'later' },
            { label: 'I got through it, but I was all over the place.', next: 'later' },
            { label: 'Not well. Other people did the work.', next: 'later' },
          ],
        },
      ],
    },

    too_late: {
      steps: [
        { text: 'Three minutes have gone by. The smoke has filled the apartment, and the alarm in the hallway has joined in. Mr. Okafor from downstairs has called 911.', animation: 'late' },
        { text: "Everyone is standing out on the sidewalk in their socks when the fire truck pulls up. A firefighter goes in, and comes back out holding your blackened pot.", animation: 'engine' },
        {
          id: 'how_it_went',
          prompt: "Nobody's hurt, but it got away from you. How do you think you did? Pick one, and tell me how your body feels now.",
          animation: 'engine',
          facets: ['Vulnerability', 'Self-Efficacy'],
          choices: [
            { label: 'I did what I could. It was a lot, all at once.', next: 'later' },
            { label: "Badly. I didn't know what to do.", next: 'later' },
            { label: "Fine. That's what the fire department is for.", next: 'later' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // takeout
    // -------------------------------------------------------------------------
    later: {
      steps: [
        { text: 'An hour later, the windows are still wide open, and everyone is eating takeout burgers and fries with their coats on.', animation: 'chips' },
        {
          id: 'looking_back',
          prompt: 'Looking back at those few minutes, what did you do well, and what would you do differently? And who was really in charge in that kitchen: you, or someone else?',
          animation: 'chips',
          facets: ['Vulnerability', 'Assertiveness', 'Altruism', 'Self-Efficacy'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and the real emergencies in your life.', animation: 'homework' },
        {
          id: 'last_crisis',
          prompt: 'Think of the last time something went suddenly wrong in front of you: a fall, a flood, a car, a crisis at work. What did you do in the first minute? Did you take charge, or wait for someone else to?',
          animation: 'homework',
          facets: ['Vulnerability', 'Assertiveness'],
        },
        {
          id: 'last_pile',
          prompt: 'In the last 30 days, on how many days did it feel like more was happening than you could cope with? What was going on, and how did you get through it?',
          animation: 'homework',
          facets: ['Vulnerability', 'Self-Efficacy'],
        },
        {
          id: 'last_help',
          prompt: 'And the last time you went out of your way to help someone who was struggling: who was it, and what did you do? Were you glad to do it, or was it a chore?',
          animation: 'homework',
          facets: ['Altruism'],
        },
        { text: 'On Monday, a package arrives with a fire blanket in it, and a note: "For next time. -Ivy"', animation: 'goodbye' },
      ],
    },
  },
};
