import type { Script } from '../personality';

// The Time Study: a researcher who studies how people spend their days asks about yours
// Habits can't be shown in one made-up moment, so this is an interview: every question is about the player's real life,
// and every "how often" has a fixed window. It opens with a light activity: filling in a diary page for yesterday,
// morning, afternoon and evening, then marking which parts were wasted.
// Written to the IPIP-NEO items in ../scene_grouping.md: wasting my time (C5.7), starting tasks right away (C5.3),
// having difficulty starting tasks (C5.9), completing tasks successfully (C1.1), working hard (C4.2), doing just
// enough work to get by (C4.9), getting stressed out easily (N1.4) and forgetting to put things back in their proper
// place (C2.6).

const OSEI = 'Dr. Osei';

export const theTimeStudy: Script = {
  id: 'the_time_study',
  title: 'The Time Study',
  facets: ['Anxiety', 'Self-Efficacy', 'Orderliness', 'Achievement-Striving', 'Self-Discipline'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the diary
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Time Study', animation: 'title_card' },
        { text: 'The psychology building smells of floor polish and burnt coffee. A sign on the third door down says: TIME STUDY. PARTICIPANTS, PLEASE KNOCK.', animation: 'door' },
        { text: 'Dr. Osei opens it with a mug in each hand. She has spent twenty years studying how people spend their days, and she still sounds delighted by it.', animation: 'office' },
        { speaker: OSEI, text: "Thank you for coming in. There are no right answers here, and nothing gets graded. I want to know how your days really go, not how they're supposed to go.", animation: 'office' },
        { speaker: OSEI, text: "We'll start with a little homework. Here's a diary page for yesterday. Fill it in as roughly as you like.", animation: 'diary' },
        {
          id: 'diary_morning',
          prompt: 'Yesterday morning, from when you woke up until about lunchtime: what did you actually do? Rough is fine.',
          animation: 'diary_morning',
          facets: ['Self-Discipline'],
        },
        {
          id: 'diary_afternoon',
          prompt: 'And the afternoon, from lunch until about dinner?',
          animation: 'diary_afternoon',
          facets: ['Self-Discipline'],
        },
        {
          id: 'diary_evening',
          prompt: 'And the evening, until you went to sleep? Roughly what time was that?',
          animation: 'diary_evening',
          facets: ['Self-Discipline'],
        },
        { speaker: OSEI, text: 'Lovely. Now take this red pen, and be honest with it.', animation: 'red_pen' },
        {
          id: 'wasted',
          speaker: OSEI,
          prompt: "Looking at the whole day, how much of it would you call wasted: time that went on things you didn't really choose, and didn't really enjoy? Pick the closest, and circle the parts.",
          animation: 'red_pen',
          facets: ['Self-Discipline'],
          choices: [
            { label: 'Hardly any of it.', next: 'wasted_little' },
            { label: 'An hour or so.', next: 'wasted_some' },
            { label: 'A few hours.', next: 'wasted_lot' },
            { label: 'Most of it, honestly.', next: 'wasted_lot' },
          ],
        },
      ],
    },

    wasted_little: {
      steps: [{ speaker: OSEI, text: "Hardly a red mark on it. You're rarer than you'd think.", animation: 'circled_few' }],
      next: 'putting_off',
    },

    wasted_some: {
      steps: [{ speaker: OSEI, text: "An hour or so. That's about the average, if it helps. Most of it goes in ten-minute pieces.", animation: 'circled_some' }],
      next: 'putting_off',
    },

    wasted_lot: {
      steps: [{ speaker: OSEI, text: "Thank you for being honest. Most people circle a lot more than they expected to.", animation: 'circled_lots' }],
      next: 'putting_off',
    },

    // -------------------------------------------------------------------------
    // starting, and finishing
    // -------------------------------------------------------------------------
    putting_off: {
      steps: [
        { speaker: OSEI, text: "Now, the things we put off. Everyone has a few. I have a drawer full of them.", animation: 'later' },
        {
          id: 'putting_off',
          speaker: OSEI,
          prompt: "Think of the last thing you had to do but didn't want to: a call, a form, a chore, anything. How long was it between knowing about it and actually starting? Pick the closest, and tell me what it was.",
          animation: 'later',
          facets: ['Self-Discipline'],
          choices: [
            { label: 'The same day. I like to get it over with.', next: 'off_soon' },
            { label: 'A few days, but I got there.', next: 'off_soon' },
            { label: 'Right up until the last minute.', next: 'off_late' },
            { label: "It's still waiting.", next: 'off_late' },
          ],
        },
      ],
    },

    off_soon: {
      steps: [{ speaker: OSEI, text: "Good. The dread is usually worse than the job.", animation: 'later_done' }],
      next: 'last_week',
    },

    off_late: {
      steps: [{ speaker: OSEI, text: "Ah. Mine's a dentist appointment. Eight months now.", animation: 'later' }],
      next: 'last_week',
    },

    last_week: {
      steps: [
        { speaker: OSEI, text: 'And the other end of things: finishing.', animation: 'list' },
        {
          id: 'last_week',
          speaker: OSEI,
          prompt: 'Think of everything you meant to get done in the last 7 days. Roughly what share of it did you actually finish? Pick the closest, and tell me about one thing that didn\'t get done.',
          animation: 'list',
          facets: ['Self-Efficacy'],
          choices: [
            { label: 'All of it, or nearly all.', next: 'how_much' },
            { label: 'Most of it.', next: 'how_much' },
            { label: 'About half.', next: 'how_much' },
            { label: 'Less than half.', next: 'how_much' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // how much is enough
    // -------------------------------------------------------------------------
    how_much: {
      steps: [
        { text: 'Dr. Osei turns to a fresh page in her notebook, and draws three boxes on it.', animation: 'effort' },
        {
          id: 'how_much',
          speaker: OSEI,
          prompt: 'The last real piece of work you did, for a job, for school, around the house, anything: did you do more than was needed, exactly what was needed, or just enough to get by? Pick the closest, and tell me what it was.',
          animation: 'effort',
          facets: ['Achievement-Striving'],
          choices: [
            { label: "More than was needed. I can't help it.", next: 'stressed' },
            { label: 'What was needed, done properly.', next: 'stressed' },
            { label: 'Just enough to get it off my plate.', next: 'stressed' },
            { label: "Less than I should have, if I'm honest.", next: 'stressed' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // stress
    // -------------------------------------------------------------------------
    stressed: {
      steps: [
        { speaker: OSEI, text: "Time and stress go together, in my experience. When one runs short, the other piles up.", animation: 'week' },
        {
          id: 'stressed',
          speaker: OSEI,
          prompt: 'In the last 7 days, on how many days did you feel stressed out? Pick the closest, and tell me what set it off.',
          animation: 'week',
          facets: ['Anxiety'],
          choices: [
            { label: 'None, or just one.', next: 'stress_light' },
            { label: 'Two or three.', next: 'stress_light' },
            { label: 'Four to six.', next: 'stress_heavy' },
            { label: 'Every single day.', next: 'stress_heavy' },
          ],
        },
      ],
    },

    stress_light: {
      steps: [{ speaker: OSEI, text: "That's a fairly calm week. Hold on to whatever you're doing.", animation: 'week_light' }],
      next: 'without_looking',
    },

    stress_heavy: {
      steps: [
        { speaker: OSEI, text: "That's a lot of days. Thank you for telling me.", animation: 'week_heavy' },
      ],
      next: 'without_looking',
    },

    // -------------------------------------------------------------------------
    // without looking
    // -------------------------------------------------------------------------
    without_looking: {
      steps: [
        { speaker: OSEI, text: "Last one, and it's my favorite. Don't look around.", animation: 'pockets' },
        {
          id: 'without_looking',
          speaker: OSEI,
          prompt: "Without looking, where are your keys right now? Your phone charger? And the last thing you borrowed from someone: where is that?",
          animation: 'pockets',
          facets: ['Orderliness'],
        },
        { speaker: OSEI, text: "You'd be amazed how many people pat their pockets at this point.", animation: 'pockets' },
        { text: 'Dr. Osei clips your diary page into a thick folder, along with hundreds of others, and walks you back to the stairs.', animation: 'folder' },
        { text: 'At the top of the stairs, she hands you a card: "Thank you for your time. We know it\'s precious."', animation: 'goodbye' },
      ],
    },
  },
};
