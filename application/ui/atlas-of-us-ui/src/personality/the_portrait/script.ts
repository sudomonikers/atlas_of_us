import type { Script } from '../personality';

// The Portrait: the closing scene. A painter, Nell, does your portrait in her studio, and talks while she works. Faces
// are the easy part, she says: she's after the person, so nothing she asks is about how you look. She never shows you
// the canvas: it goes face in against the wall to dry. It's an interview, so every question is about the player's real
// life, and every "how often" has a fixed window. The heavy answers to how you've been and how you treat yourself get
// a kind word, and no answer gets praised.
// Written to the IPIP-NEO items in ../scene_grouping.md: feeling blue (N3.1), being down in the dumps (N3.3),
// radiating joy (E6.1), loving life (E6.5), disliking yourself (N3.2), feeling comfortable with yourself (N3.9), being
// always busy (E4.1), always on the go (E4.2), thinking highly of yourself (A5.6), a high opinion of yourself (A5.7),
// doing things you later regret (N5.3) and enjoying examining yourself and your life (O3.4).

const NELL = 'Nell';

export const thePortrait: Script = {
  id: 'the_portrait',
  title: 'The Portrait',
  facets: ['Depression', 'Immoderation', 'Activity Level', 'Cheerfulness', 'Emotionality', 'Modesty'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // how you've been
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Portrait', animation: 'title_card' },
        { text: 'The studio is at the top of five flights of stairs. Rain patters on the skylight, the air smells of turpentine, and canvases are stacked against the walls with their faces turned in.', animation: 'studio' },
        { text: 'Nell has been painting portraits for forty years. She sits you on a stool by the window, and picks up a stick of charcoal.', animation: 'stool' },
        { speaker: NELL, text: "Faces are the easy part. Anyone can copy a nose. What I'm after is the person behind it, and for that, I need you to talk.", animation: 'sketch' },
        { speaker: NELL, text: "So tell me true things. Nobody will hear them but me, and the canvas can't repeat them. Let's start with how you've been: not today, the whole last month.", animation: 'sketch' },
        {
          id: 'how_youve_been',
          speaker: NELL,
          prompt: 'In the last 30 days, on how many days did you feel blue, or down in the dumps? Pick the closest, and tell me what those days were like.',
          animation: 'sketch',
          facets: ['Depression'],
          choices: [
            { label: 'Hardly any: 3 days or fewer.', next: 'mood_light' },
            { label: 'A few: 4 to 10 days.', next: 'mood_some' },
            { label: 'A lot: 11 to 20 days.', next: 'mood_heavy' },
            { label: 'Most of them: more than 20.', next: 'mood_heavy' },
          ],
        },
      ],
    },

    mood_light: {
      steps: [{ speaker: NELL, text: 'Mostly clear skies, then.', animation: 'sketch' }],
      next: 'good_mood',
    },

    mood_some: {
      steps: [{ speaker: NELL, text: 'A few gray days, then. Most people have some.', animation: 'sketch' }],
      next: 'good_mood',
    },

    mood_heavy: {
      steps: [
        { text: 'Nell stops drawing for a moment and looks at you.', animation: 'pause' },
        { speaker: NELL, text: "That's a lot to carry. Thank you for telling me.", animation: 'pause' },
      ],
      next: 'good_mood',
    },

    // -------------------------------------------------------------------------
    // the light
    // -------------------------------------------------------------------------
    good_mood: {
      steps: [
        { speaker: NELL, text: 'Now the other side. The charcoal gets the shadows, but the paint is for the light.', animation: 'palette' },
        {
          id: 'good_mood',
          speaker: NELL,
          prompt: "In the last 7 days, on how many days were you in the kind of good mood that shows: laughing, humming, joking with whoever's around? Pick the closest, and tell me about one of them.",
          animation: 'palette',
          facets: ['Cheerfulness'],
          choices: [
            { label: 'Most of them: 5 or more.', next: 'mornings' },
            { label: 'A few: 2 to 4.', next: 'mornings' },
            { label: 'One, maybe.', next: 'mornings' },
            { label: 'None this week.', next: 'mornings' },
          ],
        },
      ],
    },

    mornings: {
      steps: [
        {
          id: 'mornings',
          speaker: NELL,
          prompt: 'And when you wake up on an ordinary day, how do you feel about the day ahead? Pick the closest, and tell me why.',
          animation: 'palette',
          facets: ['Cheerfulness'],
          choices: [
            { label: "Glad. I like getting up to it.", next: 'mornings_light' },
            { label: "Fine. It's a day.", next: 'mornings_light' },
            { label: "I'd rather stay under the covers.", next: 'mornings_heavy' },
            { label: 'I dread it, most mornings.', next: 'mornings_heavy' },
          ],
        },
      ],
    },

    mornings_light: {
      steps: [{ speaker: NELL, text: "Mine starts with the kettle, and goes downhill or up from there.", animation: 'palette' }],
      next: 'own_company',
    },

    mornings_heavy: {
      steps: [{ speaker: NELL, text: "Some mornings are heavier than the duvet. Thank you for being straight with me.", animation: 'palette' }],
      next: 'own_company',
    },

    // -------------------------------------------------------------------------
    // the voice in your head
    // -------------------------------------------------------------------------
    own_company: {
      steps: [
        { text: 'Nell swaps the charcoal for a brush, and starts laying in the color.', animation: 'paint' },
        { speaker: NELL, text: "Here's the one most people find hardest. Everyone has a voice in their head that comments on what they do.", animation: 'paint' },
        {
          id: 'own_company',
          speaker: NELL,
          prompt: "Think about how yours has talked to you this last week. If a friend talked to you that way, would you keep them? Pick the closest, and tell me what it says.",
          animation: 'paint',
          facets: ['Depression'],
          choices: [
            { label: "Yes. It's on my side.", next: 'voice_kind' },
            { label: 'Mostly. It nags, but it means well.', next: 'voice_kind' },
            { label: "I'd see less of them. It's hard on me.", next: 'voice_hard' },
            { label: "No. I wouldn't put up with it from anyone else.", next: 'voice_hard' },
          ],
        },
      ],
    },

    voice_kind: {
      steps: [{ speaker: NELL, text: "Mine calls me an idiot about twice a day. Fondly, I think.", animation: 'paint' }],
      next: 'free_day',
    },

    voice_hard: {
      steps: [
        { text: 'Nell puts her brush down.', animation: 'pause' },
        { speaker: NELL, text: "That's a hard thing to live with. Thank you for telling me. For the next hour, then, I'll do the talking to you.", animation: 'pause' },
      ],
      next: 'free_day',
    },

    // -------------------------------------------------------------------------
    // your pace
    // -------------------------------------------------------------------------
    free_day: {
      steps: [
        { speaker: NELL, text: "You've got a busy sort of face. Or a restful one. I can't tell yet.", animation: 'clock' },
        {
          id: 'free_day',
          speaker: NELL,
          prompt: 'Think of the last day, or half a day, you had with nothing booked. What did you do with it? Pick the closest, and walk me through it.',
          animation: 'clock',
          facets: ['Activity Level'],
          choices: [
            { label: "Filled it. Errands, plans, people. I can't sit still.", next: 'pace_busy' },
            { label: 'Got a few things done, then took it easy.', next: 'pace_busy' },
            { label: 'Took it slow, mostly.', next: 'pace_slow' },
            { label: 'Barely moved, and enjoyed every minute.', next: 'pace_slow' },
          ],
        },
      ],
    },

    pace_busy: {
      steps: [{ speaker: NELL, text: "Then two hours on a stool will be the hardest thing you do this week. Nearly there.", animation: 'clock' }],
      next: 'the_break',
    },

    pace_slow: {
      steps: [{ speaker: NELL, text: "Then you're good at this part. Most people can't manage ten minutes.", animation: 'clock' }],
      next: 'the_break',
    },

    // -------------------------------------------------------------------------
    // what you think of yourself
    // -------------------------------------------------------------------------
    the_break: {
      steps: [
        { text: 'An hour in, Nell lets you get up and stretch. Her other sitters hang around the walls: a bearded man with a scar, a woman in pearls, Nell herself at thirty, a grinning child, and a dog.', animation: 'gallery' },
        { speaker: NELL, text: 'Every one of them paid me to tell the world they mattered. The dog was the only one who never needed telling.', animation: 'gallery' },
        {
          id: 'opinion',
          speaker: NELL,
          prompt: "Be honest with me: how high is your opinion of yourself, next to the people around you? Pick the closest, and tell me why.",
          animation: 'gallery',
          facets: ['Modesty'],
          choices: [
            { label: 'Higher than most. I know what I am worth.', next: 'praise' },
            { label: "A bit above most, if I'm honest.", next: 'praise' },
            { label: 'About the same as anyone.', next: 'praise' },
            { label: 'Lower than most.', next: 'praise' },
          ],
        },
      ],
    },

    praise: {
      steps: [
        {
          id: 'praise',
          speaker: NELL,
          prompt: 'The last time someone praised you, for anything at all, what went through your head? Pick the closest, and tell me what it was for.',
          animation: 'gallery',
          facets: ['Modesty'],
          choices: [
            { label: "They were right. I'd done well.", next: 'face_in' },
            { label: 'Nice to hear, and fair enough.', next: 'face_in' },
            { label: "They were being kind. It wasn't that good.", next: 'face_in' },
            { label: 'They had me all wrong.', next: 'face_in' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // face in
    // -------------------------------------------------------------------------
    face_in: {
      steps: [
        { text: 'Another hour, and Nell steps back and wipes her hands on a rag. Then she lifts the canvas off the easel, and stands it against the wall with the others, face in.', animation: 'face_in' },
        { speaker: NELL, text: "Nobody sees it until it's dry. Not even the sitter. Especially not the sitter.", animation: 'face_in' },
      ],
      next: 'take_back',
    },

    // -------------------------------------------------------------------------
    // something you'd take back
    // -------------------------------------------------------------------------
    take_back: {
      steps: [
        { text: 'Nell makes two mugs of tea, and the two of you sit on the bench, looking at the back of a canvas you have yet to see.', animation: 'tea' },
        { speaker: NELL, text: 'I ask everyone this one over tea. If you could paint over one thing from this last month, what would it be?', animation: 'tea' },
        {
          id: 'spur_of_the_moment',
          speaker: NELL,
          prompt: "In the last 30 days, how many times did you do something on the spur of the moment that you wished you hadn't: something said, bought, sent, eaten? Pick the closest, and tell me about one.",
          animation: 'tea',
          facets: ['Immoderation'],
          choices: [
            { label: 'None that I can think of.', next: 'looking_in' },
            { label: 'Once or twice.', next: 'looking_in' },
            { label: 'A handful: 3 to 6.', next: 'looking_in' },
            { label: "More than I'd like to count.", next: 'looking_in' },
          ],
        },
      ],
    },

    looking_in: {
      steps: [
        {
          id: 'looking_in',
          speaker: NELL,
          prompt: "Two hours with nothing to do but think about your life. In your real life, how much do you enjoy that: turning over who you are and how it's going? Pick the closest, and tell me when you last did it.",
          animation: 'window',
          facets: ['Emotionality'],
          choices: [
            { label: 'I love it. I could pick over my life all day.', next: 'goodbye' },
            { label: "I like it, now and then. It's useful.", next: 'goodbye' },
            { label: "I get restless. I'd rather be doing than thinking.", next: 'goodbye' },
            { label: 'Not much. I steer clear of that kind of thinking.', next: 'goodbye' },
          ],
        },
      ],
    },

    goodbye: {
      steps: [
        { text: 'Nell says the paint needs a few weeks to dry. A month later, a flat package arrives at your door, wrapped in brown paper.', animation: 'parcel' },
        { text: 'On the back of the canvas, in pencil: "Thank you for sitting. You were better company than most. N."', animation: 'goodbye' },
      ],
    },
  },
};
