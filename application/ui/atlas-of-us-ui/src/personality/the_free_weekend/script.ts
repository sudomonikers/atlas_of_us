import type { Script } from '../personality';

// The Free Weekend: a promise, a better offer, and a Sunday with nothing in it
// Weeks ago you promised to help a friend move apartments on Saturday. On Friday night a much better invitation arrives. Then
// there's Sunday, and a slow hour on Sunday afternoon.
// Written to the IPIP-NEO items in ../scene_grouping.md: keeping promises (C3.2), breaking them (C3.7), telling the truth
// (C3.4), preferring to be alone (E2.6), doing a lot in your spare time (E4.3), taking it easy (E4.6), carrying out plans
// (C5.5), the beauty of nature (O2.5), challenging reading (O5.2), daydreaming (O1.3) and getting lost in thought (O1.4).

const BECCA = 'Becca';
const LEO = 'Leo';

export const theFreeWeekend: Script = {
  id: 'the_free_weekend',
  title: 'The Free Weekend',
  facets: ['Gregariousness', 'Activity Level', 'Imagination', 'Artistic Interests', 'Intellect', 'Dutifulness', 'Self-Discipline'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // saturday: the promise and the invitation
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Free Weekend', animation: 'title_card' },
        { text: "It's six thirty on a Friday in June. The week is finally over, and for once there's nothing on your calendar.", animation: 'friday' },
        { text: "Well, almost nothing. Weeks ago, you promised your friend Becca that you'd help her move apartments on Saturday. It's three floors up, with no elevator.", animation: 'calendar' },
        { speaker: BECCA, text: "Still OK for tomorrow? The truck is booked for 9. Honestly couldn't do it without you 🙏", animation: 'text_hannah' },
        { speaker: LEO, text: "Last-minute thing! My uncle is letting me borrow his boat for the day tomorrow. The lake, a cooler full of drinks, sun all day. There's one seat left, and I want it to be you.", animation: 'text_leo' },
        { text: "It's going to be the first sunny Saturday in months. Becca's brother might be free to help her move. Then again, he might not.", animation: 'text_leo' },
        {
          id: 'the_promise',
          prompt: 'What do you do about tomorrow? Pick one, then write the text you send Becca, word for word.',
          animation: 'text_leo',
          facets: ['Dutifulness'],
          choices: [
            { label: 'Help Becca, like I said I would. Tell Leo another time.', next: 'keep' },
            { label: 'Help Becca in the morning, then try to make the boat after lunch.', next: 'half' },
            { label: 'Ask Becca if she could manage without me.', next: 'ask' },
            { label: 'Go on the boat. Becca will be fine.', next: 'bail' },
            { label: 'Something else.', next: 'sunday', other: true },
          ],
        },
      ],
    },

    keep: {
      steps: [{ text: "You show up at nine o'clock for three floors of stairs and one very heavy couch. Around noon, Leo sends you a photo of the lake, flat and blue. On the way home, Becca buys you a burger to say thanks.", animation: 'keep' }],
      next: 'sunday',
    },

    half: {
      steps: [{ text: '"Go, honestly," says Becca at two, without looking up from the boxes. You make it to the lake by four, just in time to watch the boat come back in.', animation: 'half' }],
      next: 'sunday',
    },

    ask: {
      steps: [{ text: 'She replies right away: "Of course! My brother can probably come." Then, a minute later: "Have fun!"', animation: 'ask' }],
      next: 'sunday',
    },

    bail: {
      steps: [{ text: 'Out on the lake, Leo hands you a cold drink. Your phone buzzes in your pocket, but you leave it there.', animation: 'bail' }],
      next: 'sunday',
    },

    // -------------------------------------------------------------------------
    // sunday: alone or with people, busy or still
    // -------------------------------------------------------------------------
    sunday: {
      steps: [
        { text: 'Then it\'s Sunday, with nothing planned at all. The whole day is yours.', animation: 'sunday' },
        { text: 'On the fridge is the to-do list you wrote last weekend: go to the gym, clean out the spare room, call Grandma, and start that book.', animation: 'the_list' },
        { text: "Your phone lights up. The group chat is planning to get lunch at a bar downtown, if anyone's around.", animation: 'group_chat' },
        {
          id: 'the_sunday',
          prompt: 'How do you spend the day? Pick the closest, and tell me what happens to the list.',
          animation: 'group_chat',
          facets: ['Gregariousness', 'Activity Level', 'Self-Discipline'],
          choices: [
            { label: 'Get through the list, then fit in as much as I can.', next: 'sun_busy' },
            { label: "Lunch with the group. Then see who's up for more after.", next: 'sun_people' },
            { label: 'A day to myself. My own thing, nobody else.', next: 'sun_alone' },
            { label: 'Nothing at all. Couch, pajamas, see where it goes.', next: 'sun_still' },
            { label: 'Something else.', next: 'afternoon', other: true },
          ],
        },
      ],
    },

    sun_busy: {
      steps: [{ text: 'You\'re at the gym by nine, the spare room is done by twelve, and you call Grandma at one. She talks for an hour. You check her off the list anyway.', animation: 'sun_busy' }],
      next: 'afternoon',
    },

    sun_people: {
      steps: [{ text: "Lunch turns into a walk, and the walk turns into hanging out in someone's backyard. The list stays on the fridge.", animation: 'sun_people' }],
      next: 'afternoon',
    },

    sun_alone: {
      steps: [{ text: 'You put your phone on silent. The group chat carries on without you.', animation: 'sun_alone' }],
      next: 'afternoon',
    },

    sun_still: {
      steps: [{ text: "By eleven, you've moved from the bed to the couch. That counts as a change of scenery.", animation: 'sun_still' }],
      next: 'afternoon',
    },

    // -------------------------------------------------------------------------
    // a slow afternoon
    // -------------------------------------------------------------------------
    afternoon: {
      steps: [
        { text: 'Around four, everything goes quiet. The light turns long and golden across the park at the end of your street.', animation: 'afternoon' },
        { text: "You've got an hour with nothing in it, and nobody needs you for anything.", animation: 'afternoon_hour' },
        {
          id: 'the_hour',
          prompt: 'Where does the hour go? Pick the closest, and tell me what you noticed, read or thought about.',
          animation: 'afternoon_hour',
          facets: ['Artistic Interests', 'Intellect', 'Imagination'],
          choices: [
            { label: 'A slow walk by the river, just to look at things.', next: 'hour_walk' },
            { label: "That difficult book I've been meaning to get into.", next: 'hour_book' },
            { label: 'Lie in the grass and let my mind wander.', next: 'hour_drift' },
            { label: "My phone. It'll be dark before I look up.", next: 'hour_phone' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    hour_walk: {
      steps: [{ text: 'The river is high and slow. A heron is standing in the shallows, so still that you nearly miss it.', animation: 'hour_walk' }],
      next: 'the_end',
    },

    hour_book: {
      steps: [{ text: "It's harder to get into than you remembered. You read the first page twice, and then suddenly you're forty pages in.", animation: 'hour_book' }],
      next: 'the_end',
    },

    hour_drift: {
      steps: [{ text: 'A cloud drifts over shaped like a ship. Then it looks like a whale. Then it looks like nothing at all.', animation: 'hour_drift' }],
      next: 'the_end',
    },

    hour_phone: {
      steps: [{ text: "When you finally look up, the streetlights are on, and you can't remember a single thing you saw.", animation: 'hour_phone' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // monday
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'It\'s Monday, eight o\'clock. You\'re halfway out the door when your mom calls. "Did you have a good weekend, honey?"', animation: 'monday' },
        {
          id: 'looking_back',
          prompt: 'What do you tell her? Was it a good weekend? And if you had it again, what would you do differently?',
          animation: 'monday',
          facets: ['Dutifulness', 'Gregariousness', 'Activity Level', 'Self-Discipline'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and your real weekends.', animation: 'homework' },
        {
          id: 'last_weekend',
          prompt: 'Think about your last free weekend. What did you actually do, and who with? Roughly how many hours were you around other people, and did you get done what you meant to?',
          animation: 'homework',
          facets: ['Gregariousness', 'Activity Level', 'Self-Discipline'],
        },
        {
          id: 'last_promise',
          prompt: "When did you last back out of something you'd said you'd do, even something small? What did you tell them, and was it the whole truth?",
          animation: 'homework',
          facets: ['Dutifulness'],
        },
        {
          id: 'last_wander',
          prompt: 'And in the last month, how many times did you stop just to look at something beautiful outdoors, read something that really made you think, or lose an hour in your own head? Tell me about the last one.',
          animation: 'homework',
          facets: ['Artistic Interests', 'Intellect', 'Imagination'],
        },
        { text: "Next weekend, your calendar is empty again. For now.", animation: 'goodbye' },
      ],
    },
  },
};
