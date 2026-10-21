import type { Script } from '../personality';

// The Houseguest: a week with someone on your couch
// A friend of a friend needs somewhere to stay for a week. They're messy, a bit closed off, and they want to talk every
// evening. Then, late one night, they tell you what's going on.
// Written to the IPIP-NEO items in ../scene_grouping.md: liking to tidy up (C2.2), leaving a mess in your room (C2.7),
// leaving your belongings around (C2.8), avoiding contact with others (E1.8), keeping others at a distance (E1.10),
// feeling others' emotions (O3.2) and not being interested in other people's problems (A6.5).

const SANA = 'Sana';
const RORY = 'Rory';

export const theHouseguest: Script = {
  id: 'the_houseguest',
  title: 'The Houseguest',
  facets: ['Friendliness', 'Emotionality', 'Sympathy', 'Orderliness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // your space, their mess
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Houseguest', animation: 'title_card' },
        { text: 'It\'s a Sunday evening in March. Your apartment is quiet, and everything is just how you like it.', animation: 'message' },
        { speaker: SANA, text: "Huge favor to ask. My friend Rory needs somewhere to stay for a week. They're going through a rough patch. Could they crash on your couch? They're really sweet, I promise!", animation: 'message' },
        { text: 'On Monday night, the doorbell rings. Rory is standing there with a duffel bag, a garbage bag full of clothes, and a guitar.', animation: 'arrival' },
        { speaker: RORY, text: "Hi. Sorry. Thank you. I won't get in your way, honestly. You won't even know I'm here.", animation: 'rory_hello' },
        { text: "By Wednesday, you definitely know they're here. There are wet towels on the floor, clothes all over the couch, a tower of dirty mugs in the sink, and they've borrowed your phone charger.", animation: 'mess' },
        { text: "Your own bedroom is through the door on the right. It's all yours, and you know exactly what state it's in.", animation: 'your_room' },
        {
          id: 'the_mess',
          prompt: 'What do you do about the mess? Pick one, and be honest: what does your own room look like right now?',
          animation: 'your_room',
          facets: ['Orderliness'],
          choices: [
            { label: "Clean it all up myself. I can't relax with it like that.", next: 'mess_tidy' },
            { label: 'Ask Rory, nicely, to keep their things in one corner.', next: 'mess_ask' },
            { label: "Leave it. Mess doesn't really bother me.", next: 'mess_leave' },
            { label: 'Say nothing, but start a pointed pile of their things by the couch.', next: 'mess_pile' },
            { label: 'Something else.', next: 'evenings', other: true },
          ],
        },
      ],
    },

    mess_tidy: {
      steps: [{ text: 'When Rory gets back, the mugs are washed and the towels are hanging up to dry. They stop in the doorway. "Oh. Sorry."', animation: 'mess_tidy' }],
      next: 'evenings',
    },

    mess_ask: {
      steps: [{ text: '"Oh gosh, yeah, of course," says Rory, and scoops everything into a heap next to the couch. It\'s a start.', animation: 'mess_ask' }],
      next: 'evenings',
    },

    mess_leave: {
      steps: [{ text: "By Thursday, you can't see the coffee table anymore. Neither of you mentions it.", animation: 'mess_leave' }],
      next: 'evenings',
    },

    mess_pile: {
      steps: [{ text: 'The pile keeps growing all evening. Rory steps around it without saying a word.', animation: 'mess_pile' }],
      next: 'evenings',
    },

    // -------------------------------------------------------------------------
    // they want to talk every evening
    // -------------------------------------------------------------------------
    evenings: {
      steps: [
        { text: "Every evening when you get home, Rory is in the kitchen, waiting for you.", animation: 'evening' },
        { speaker: RORY, text: "The kettle's on! Want a cup? I could make us some pasta. We could put a show on, if you want?", animation: 'rory_kettle' },
        { text: "You've had a long day. Your room is right there, and it has a door.", animation: 'your_door' },
        {
          id: 'the_evenings',
          prompt: 'What do you do, most evenings that week? Pick the closest, and tell me why.',
          animation: 'your_door',
          facets: ['Friendliness'],
          choices: [
            { label: 'Say yes. Pasta, the TV, chatting till late.', next: 'eve_yes' },
            { label: 'A cup of tea and a quick chat, then off to my room.', next: 'eve_tea' },
            { label: "Say I'm exhausted, and close my door.", next: 'eve_door' },
            { label: "Stay out late most nights. I need my own space.", next: 'eve_out' },
            { label: 'Something else.', next: 'late', other: true },
          ],
        },
      ],
    },

    eve_yes: {
      steps: [{ text: 'Rory makes a pretty terrible carbonara. The two of you watch three episodes of something, and at one point, they actually laugh out loud.', animation: 'eve_yes' }],
      next: 'late',
    },

    eve_tea: {
      steps: [{ text: 'You spend twenty minutes talking about the weather and work, and then say good night. You can hear the TV through the wall.', animation: 'eve_tea' }],
      next: 'late',
    },

    eve_door: {
      steps: [{ text: 'Through the door, you hear them wash one plate, and then the couch creaks.', animation: 'eve_door' }],
      next: 'late',
    },

    eve_out: {
      steps: [{ text: "You get home after eleven every night. The lamp is on, and Rory is asleep, or pretending to be.", animation: 'eve_out' }],
      next: 'late',
    },

    // -------------------------------------------------------------------------
    // they finally open up
    // -------------------------------------------------------------------------
    late: {
      steps: [
        { text: "It's Friday, nearly midnight. You get up for a glass of water, and find Rory sitting at the kitchen table in the dark.", animation: 'late' },
        { speaker: RORY, text: "Sorry. I'm fine. It's just that it would have been ten years today, me and Dan. He left in January. The apartment was his, so I've been crashing on couches ever since.", animation: 'rory_opens' },
        { text: 'They try to laugh it off, but it goes wrong halfway through, and then they\'re crying.', animation: 'rory_cries' },
        {
          id: 'the_night',
          prompt: 'What do you do? Pick the closest. Tell me what you said, and what it was like for you while they were talking.',
          animation: 'rory_cries',
          facets: ['Emotionality', 'Sympathy'],
          choices: [
            { label: 'Sit down with them, and stay as long as it takes.', next: 'night_stay' },
            { label: 'Make tea, and help them work out what to do next.', next: 'night_fix' },
            { label: 'Say something kind, then give them some space.', next: 'night_kind' },
            { label: "Say goodnight, and leave them be. They probably want to be alone.", next: 'night_bed' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    night_stay: {
      steps: [{ text: 'You sit at the table with them until the sky outside starts to turn gray. Mostly they talk. Sometimes neither of you says anything.', animation: 'night_stay' }],
      next: 'the_end',
    },

    night_fix: {
      steps: [{ text: "By one o'clock, there's a list on the back of an envelope: some apartment listings, a friend in Portland, and the number for a lawyer.", animation: 'night_fix' }],
      next: 'the_end',
    },

    night_kind: {
      steps: [{ text: '"Thanks," they say. "Really." You leave the hall light on for them.', animation: 'night_kind' }],
      next: 'the_end',
    },

    night_bed: {
      steps: [{ text: 'You lie awake for a while, listening. Then you fall asleep.', animation: 'night_bed' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // sunday
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'On Sunday morning, Rory is gone. The blankets are folded, the mugs are washed, and there\'s a note on the table: "Thanks for having me. Sorry about the mess. -R"', animation: 'note' },
        {
          id: 'looking_back',
          prompt: 'Holding the note, how do you feel about the week? Would you have Rory back? And if you had the week again, what would you do differently?',
          animation: 'note',
          facets: ['Friendliness', 'Emotionality', 'Sympathy', 'Orderliness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and your real home.', animation: 'homework' },
        {
          id: 'last_space',
          prompt: 'Look around your room right now, or picture it. Where are your things: put away, or wherever you dropped them? When did you last have a really good clean, and did you enjoy it?',
          animation: 'homework',
          facets: ['Orderliness'],
        },
        {
          id: 'last_company',
          prompt: 'Think of the last time someone wanted more of your company than you wanted to give. Who was it, and what did you do? And last week, how many evenings did you spend with someone, by choice?',
          animation: 'homework',
          facets: ['Friendliness'],
        },
        {
          id: 'last_trouble',
          prompt: 'And the last time someone told you about something hard they were going through: what did you feel while they talked, and what did you do afterward? Did it stay with you?',
          animation: 'homework',
          facets: ['Emotionality', 'Sympathy'],
        },
        { text: 'A month later, a postcard arrives from Portland. It says: "The kettle\'s on, whenever you want to visit."', animation: 'goodbye' },
      ],
    },
  },
};
