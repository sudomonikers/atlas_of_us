import type { Script } from '../personality';

// The Empty Weekend: The Pop-Up Town
// The player's phone goes into the harbour the moment they arrive in a seaside town for a weekend with no plans.
// The town is a pop-up book. Saturday morning and Saturday night branch; every path meets in the bookshop and on Sunday.

const PENHALLOW = 'Mrs. Penhallow';
const AGNES = 'Agnes';
const PAINTER = 'Mr. Bligh';

export const emptyWeekend: Script = {
  id: 'empty_weekend',
  title: 'The Empty Weekend',
  facets: [
    'Depression',
    'Gregariousness',
    'Activity Level',
    'Artistic Interests',
    'Intellect',
    'Self-Discipline',
    'Introspection',
    'Playfulness',
    'Sensory Sensitivity',
  ],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // friday
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Empty Weekend', animation: 'title_card' },
        { text: 'Friday evening. The last train of the week wheezes into Gullhaven, a little town at the very end of the line.', animation: 'arrival' },
        { text: "You've got a room above the bakery until Monday morning. No work, no plans, nobody expecting anything.", animation: 'harbour' },
        { text: 'On the harbour wall you stop to check your messages, and a gull lands on your arm to see what you are reading.', animation: 'gull' },
        { text: 'Your phone slips out of your hand, bounces once off the wall, and drops into the harbour.', animation: 'phone_drop' },
        { text: 'It does not come back up.', animation: 'phone_gone' },
        { speaker: PENHALLOW, text: 'Phone in the harbour? Ha! Happens every summer, love. Nothing to be done about it till Monday.', animation: 'room' },
        { speaker: PENHALLOW, text: "Bread's at seven. The rest of the town's all yours.", animation: 'room' },
        {
          id: 'phone_gone',
          prompt: "Nobody can reach you, and you can't reach anybody, until Monday. Lying on the bed that first night, how does that sit with you?",
          animation: 'room_night',
          facets: ['Gregariousness', 'Introspection'],
        },
      ],
      next: 'saturday',
    },

    // -------------------------------------------------------------------------
    // saturday morning
    // -------------------------------------------------------------------------
    saturday: {
      steps: [
        { text: 'Saturday. You wake up to gulls, and the smell of bread coming up through the floorboards.', animation: 'room_morning' },
        { text: 'On the back of the door, Mrs. Penhallow has pinned up a map of the town, drawn by hand.', animation: 'map' },
        { text: 'There is a regatta in the harbour. A cliff path up to the lighthouse. A painting class in the church hall. And your bed, which is very comfortable.', animation: 'map' },
        {
          id: 'the_morning',
          prompt: 'A whole Saturday morning and nothing you have to do. Where do you go?',
          animation: 'map',
          facets: ['Activity Level', 'Gregariousness', 'Artistic Interests'],
          choices: [
            { label: 'Down to the regatta, where everyone is.', next: 'regatta' },
            { label: 'Up the cliff path on my own.', next: 'cliff' },
            { label: 'The painting class in the church hall.', next: 'painting' },
            { label: 'Nowhere. Back under the covers.', next: 'lie_in' },
          ],
        },
      ],
    },

    regatta: {
      steps: [
        { text: 'The whole town is on the quay, cheering a race of boats that are mostly bathtubs.', animation: 'regatta' },
        { text: 'Somebody hands you an ice cream and a flag, and asks which bathtub you are backing.', animation: 'regatta' },
      ],
      next: 'afternoon',
    },

    cliff: {
      steps: [
        { text: 'The path climbs past gorse and sheep, all the way up to the lighthouse at the top of the cliff.', animation: 'cliff' },
        { text: "Up there it's just you, the wind, and a very long way down to the sea.", animation: 'cliff' },
      ],
      next: 'afternoon',
    },

    painting: {
      steps: [
        { text: 'The class is six people and a bowl of lemons. The teacher has paint in his beard.', animation: 'painting' },
        { speaker: PAINTER, text: "Don't paint the lemons. Paint how the lemons make you feel.", animation: 'painting_teacher' },
      ],
      next: 'afternoon',
    },

    lie_in: {
      steps: [
        { text: 'You sleep until eleven, then lie there and watch the light move across the ceiling.', animation: 'lie_in' },
        { text: 'Downstairs, the bakery sells out of everything.', animation: 'lie_in' },
      ],
      next: 'afternoon',
    },

    // -------------------------------------------------------------------------
    // the bookshop
    // -------------------------------------------------------------------------
    afternoon: {
      steps: [
        { text: 'After lunch, the rain comes in off the sea, all at once.', animation: 'rain' },
        { text: 'You duck into the first door you find: a crooked little bookshop called the Ebb and Flow.', animation: 'bookshop' },
        { speaker: AGNES, text: "In you come, dripping. Mind the cat. Kettle's on.", animation: 'agnes' },
        { text: "Books up to the ceiling, a sagging armchair, and the rain drumming on the window. It's in for the afternoon.", animation: 'reading' },
        {
          id: 'the_shelf',
          prompt: "You've got all afternoon, a chair, and every shelf in the shop. What do you take down, and why that one?",
          animation: 'reading',
          facets: ['Intellect', 'Artistic Interests', 'Introspection'],
        },
        { speaker: AGNES, text: "It's quiz night at the Anchor, you know. The whole town goes, and my team's one short.", animation: 'agnes' },
        { speaker: AGNES, text: 'We are the Quizzly Bears. We have never once won.', animation: 'agnes' },
        {
          id: 'the_invite',
          prompt: 'Agnes is saving you a seat at the Anchor. What do you do with your Saturday night?',
          animation: 'agnes',
          facets: ['Gregariousness', 'Playfulness', 'Activity Level'],
          choices: [
            { label: 'Go, and play to win.', next: 'quiz_win' },
            { label: 'Go, but mostly for the company.', next: 'quiz_company' },
            { label: 'Stay in with a book and a cup of tea.', next: 'night_in' },
            { label: 'Walk the beach on my own in the dark.', next: 'night_beach' },
          ],
        },
      ],
    },

    quiz_win: {
      steps: [
        { text: 'You know the capital of Mongolia, and the Quizzly Bears come third. Agnes cries into her cardigan.', animation: 'quiz_win' },
      ],
      next: 'sunday',
    },

    quiz_company: {
      steps: [
        { text: 'Nobody at the table knows the capital of Mongolia, and nobody minds. The Quizzly Bears come last, loudly.', animation: 'quiz_company' },
      ],
      next: 'sunday',
    },

    night_in: {
      steps: [
        { text: 'The rain stops. You read with the window open, and hear the pub singing, faintly, across the harbour.', animation: 'night_in' },
      ],
      next: 'sunday',
    },

    night_beach: {
      steps: [
        { text: 'The tide is out and the sand is silver. Far off, you can hear the pub singing.', animation: 'night_beach' },
      ],
      next: 'sunday',
    },

    // -------------------------------------------------------------------------
    // sunday
    // -------------------------------------------------------------------------
    sunday: {
      steps: [
        { text: 'Sunday morning, and church bells all over town.', animation: 'sunday' },
        { text: "In the bedside drawer there's a notebook. Somebody before you wrote THINGS TO DO THIS WEEKEND, and crossed off every one.", animation: 'notebook' },
        { text: 'Swim in the sea. Eat a whole crab. Learn one song on the harmonica. Be nice to the gull.', animation: 'notebook' },
        {
          id: 'the_list',
          prompt: 'One day left. Do you write a list of your own? What goes on it, and how much of it do you actually do?',
          animation: 'my_list',
          facets: ['Self-Discipline', 'Activity Level', 'Playfulness'],
        },
        { text: 'In the afternoon the funfair opens on the pier: organ music, flashing bulbs, doughnuts sizzling, and half the town shrieking on the big wheel.', animation: 'pier' },
        { text: "It's loud, and bright, and sticky, and everyone is very close.", animation: 'pier' },
        {
          id: 'the_pier',
          prompt: 'Standing in the middle of all of it, what do you notice first? How long before you have had enough, or could you stay all night?',
          animation: 'pier',
          facets: ['Sensory Sensitivity', 'Gregariousness'],
        },
      ],
      next: 'sunday_night',
    },

    sunday_night: {
      steps: [
        { text: 'Sunday night. Your bag is packed, and the first train leaves at seven.', animation: 'packed' },
        { text: "Downstairs, Mrs. Penhallow's clock strikes ten.", animation: 'clock' },
        { text: 'Somewhere at the bottom of the harbour, your phone is filling up with messages.', animation: 'packed' },
        {
          id: 'how_you_feel',
          prompt: "It's Sunday night and the weekend is nearly gone. How do you feel right now: rested, restless, a bit low, something else? Where do you think that comes from?",
          animation: 'packed',
          facets: ['Depression', 'Introspection'],
        },
        {
          id: 'your_weekend',
          prompt: 'Away from Gullhaven now. Think of your last free weekend at home. What did you actually do with it, roughly hour by hour, and how did it feel by Sunday night?',
          animation: 'packed',
          facets: ['Activity Level', 'Gregariousness'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'Monday morning. The train pulls out, and the whole of Gullhaven folds itself flat behind you.', animation: 'monday' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
