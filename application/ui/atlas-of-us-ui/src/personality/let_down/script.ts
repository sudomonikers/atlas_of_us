import type { Script } from '../personality';

// Let Down: The Paper Lantern
// The player's oldest friend has cancelled on them three times this month. They finally get her to dinner, and she
// turns up low and quiet. How the player responds branches; every path meets for the player's own story, the advice,
// the walk home, and the week of silence after.

const JUNO = 'Juno';

export const letDown: Script = {
  id: 'let_down',
  title: 'Let Down',
  facets: ['Anger', 'Depression', 'Friendliness', 'Emotionality', 'Trust', 'Sympathy', 'Altruism'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // dinner
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'Let Down', animation: 'title_card' },
        { text: 'Juno has been your best friend since you were eleven years old.', animation: 'street' },
        { text: "Lately she's been hard to pin down. She has cancelled three plans this month, each time with a one-line message.", animation: 'phone_cancels' },
        { text: "So you booked a table at the Paper Lantern, the noodle bar you've both loved for years, and told her you weren't taking no for an answer.", animation: 'street' },
        { text: 'She is twenty minutes late. Then there she is, hood up, hands in her pockets.', animation: 'street_juno' },
        { speaker: JUNO, text: 'Hey. Sorry. Long week.', animation: 'street_juno' },
        { text: "The noodles come. Juno pushes hers round the bowl and doesn't eat any.", animation: 'table_quiet' },
        { text: "You ask how she's been. Fine, she says. You ask about work. Fine. You ask about her sister. Yeah, fine.", animation: 'table_quiet' },
        {
          id: 'first_notice',
          prompt: "Something's off, and you can see it. What do you notice about her tonight, and what do you do about it?",
          animation: 'table_quiet',
          facets: ['Emotionality', 'Sympathy', 'Friendliness'],
        },
      ],
      next: 'opening_up',
    },

    opening_up: {
      steps: [
        { speaker: JUNO, text: "Sorry. I'm rubbish company.", animation: 'table_talk' },
        { speaker: JUNO, text: "I don't even know what's wrong. Nothing's happened. Everything just feels grey. And heavy.", animation: 'table_talk' },
        { speaker: JUNO, text: "I get home from work and lie on the floor. I don't answer anyone. I nearly cancelled tonight, too.", animation: 'table_talk' },
        {
          id: 'how_you_respond',
          prompt: "Juno's looking at her bowl, not at you. What do you do?",
          animation: 'table_talk',
          facets: ['Sympathy', 'Altruism', 'Friendliness'],
          choices: [
            { label: 'Ask her more, and mostly just listen.', next: 'listen' },
            { label: 'Tell her about a time I felt the same.', next: 'own_story' },
            { label: 'Try to make her laugh, and lift the mood.', next: 'cheer' },
            { label: 'Help her work out what to do about it.', next: 'fix' },
          ],
        },
      ],
    },

    listen: {
      steps: [
        { text: 'She talks for a long time: about lying awake, about feeling like a burden, about not knowing why.', animation: 'table_talk' },
        { speaker: JUNO, text: "Thanks. Nobody's actually asked. Have you ever felt like this?", animation: 'table_talk' },
      ],
      next: 'felt_this',
    },

    own_story: {
      steps: [
        { text: 'You tell her she isn\'t the only one, and that you have been somewhere like this yourself.', animation: 'table_talk' },
        { speaker: JUNO, text: 'Really? You never said. What happened?', animation: 'table_laugh' },
      ],
      next: 'felt_this',
    },

    cheer: {
      steps: [
        { text: 'You remind her of the night the waiter here tipped a whole tray of dumplings into your lap. She laughs, once, and then her eyes fill up.', animation: 'table_laugh' },
        { speaker: JUNO, text: "Sorry. I don't know why I'm crying. Have you ever felt like this?", animation: 'table_quiet' },
      ],
      next: 'felt_this',
    },

    fix: {
      steps: [
        { text: 'You start listing things: a doctor, a run every morning, a weekend away somewhere.', animation: 'table_talk' },
        { speaker: JUNO, text: 'Yeah. Maybe. I know.', animation: 'table_quiet' },
        { text: "She's nodding, but she's somewhere else.", animation: 'table_quiet' },
        { speaker: JUNO, text: 'Have you ever actually felt like this, though?', animation: 'table_quiet' },
      ],
      next: 'felt_this',
    },

    // -------------------------------------------------------------------------
    // your own story, and the advice
    // -------------------------------------------------------------------------
    felt_this: {
      steps: [
        { text: 'The candle gutters behind the screen, and an old memory of your own steps out of the dark.', animation: 'memory' },
        {
          id: 'ever_felt_this',
          prompt: "Have you ever felt the way Juno does? Tell her about it: when it was, what it was like, and what got you through. If you never have, tell her what you imagine it's like.",
          animation: 'memory',
          facets: ['Depression', 'Emotionality'],
        },
      ],
      next: 'advice',
    },

    advice: {
      steps: [
        { text: "Juno's quiet for a while. She takes your hand across the table.", animation: 'table_hand' },
        { speaker: JUNO, text: 'What would you do, if you were me?', animation: 'table_hand' },
        {
          id: 'the_advice',
          prompt: "She's really asking. What advice do you give her, if any? Or what do you say instead?",
          animation: 'table_hand',
          facets: ['Altruism', 'Sympathy'],
        },
      ],
      next: 'walk_home',
    },

    // -------------------------------------------------------------------------
    // the walk home, and after
    // -------------------------------------------------------------------------
    walk_home: {
      steps: [
        { text: 'You walk her home along the river. The lanterns on the bridge are lit.', animation: 'bridge' },
        { speaker: JUNO, text: "I'm sorry I kept cancelling. I know I've been a terrible friend lately.", animation: 'bridge' },
        {
          id: 'the_cancellations',
          prompt: 'Be honest. How did you feel each time she cancelled on you? And how do you feel about it now?',
          animation: 'bridge',
          facets: ['Anger', 'Trust', 'Sympathy'],
        },
        { speaker: JUNO, text: 'Thanks for tonight. Really.', animation: 'bridge_apart' },
      ],
      next: 'silence',
    },

    silence: {
      steps: [
        { text: 'A week goes by.', animation: 'phone_sent' },
        { text: "You message her on Monday. A joke on Wednesday. On Friday, just: thinking of you.", animation: 'phone_sent' },
        { text: "She doesn't reply. Every message says Read.", animation: 'phone_sent' },
        {
          id: 'the_silence',
          prompt: "Juno has gone quiet again. What do you do now? And how does it feel, sitting on your side of the silence?",
          animation: 'phone_sent',
          facets: ['Trust', 'Altruism', 'Friendliness'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'On Sunday night, your phone buzzes.', animation: 'phone_reply' },
        { speaker: JUNO, text: 'sorry. rough week. I booked a doctor. thank you for not giving up on me x', animation: 'phone_reply' },
        { text: 'Behind the screen, the candle burns down.', animation: 'candle_out' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
