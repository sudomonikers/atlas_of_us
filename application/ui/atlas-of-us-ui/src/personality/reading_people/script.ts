import type { Script } from '../personality';

// Reading People
// Four unrelated moments where someone else's behavior is ambiguous, and the player says what they think is going on.
// Nothing is ever explained: the answers show how the player reads other people, and how much of it they take personally.
// Free text only, no branching, so your_reading is always the last question.

const MEI = 'Mei';
const SORA = 'Sora';
const REN = 'Ren';
const KURODA = 'Ms. Kuroda';
const OLD_MAN = 'The old man';
const AOI = 'Aoi';

export const readingPeople: Script = {
  id: 'reading_people',
  title: 'Reading People',
  facets: ['Anxiety', 'Self-Consciousness', 'Emotionality', 'Trust', 'Modesty', 'Sympathy', 'Playfulness'],
  start: 'lanterns',
  sections: {
    // -------------------------------------------------------------------------
    // One: friends laugh as the player walks up
    // -------------------------------------------------------------------------
    lanterns: {
      steps: [
        { text: 'Reading People', animation: 'title_card' },
        { text: 'One. Lanterns', animation: 'chapter_lanterns' },
        { text: 'It\'s the last night of the summer festival. Paper lanterns sway over the stalls, and the air smells of grilled corn and burnt sugar.', animation: 'festival_wide' },
        { text: 'You\'re running late. You spot Mei, Kenji and Sora by the takoyaki stand, leaning in close over something on Kenji\'s phone.', animation: 'friends_huddle' },
        { text: 'As you walk up, all three of them burst out laughing.', animation: 'friends_laugh' },
        { text: 'Mei looks up, sees you, and claps a hand over her mouth. Kenji tilts the phone away.', animation: 'mei_covers' },
        { speaker: MEI, text: 'You made it! Come here, come here.', animation: 'mei_waves' },
        { text: 'Nobody says what was so funny. Sora hands you a stick of takoyaki like nothing happened.', animation: 'sora_offers' },
        {
          id: 'festival_laugh',
          prompt: 'What do you think they were laughing at? How did it feel to walk into that?',
          animation: 'friends_hold',
          facets: ['Self-Consciousness', 'Anxiety', 'Trust'],
        },
        { speaker: SORA, text: "Okay, new game. Everyone shows the most embarrassing photo on their phone. You first.", animation: 'sora_offers' },
        {
          id: 'your_turn',
          prompt: "They're all looking at you, grinning. What do you show them, or what do you say?",
          animation: 'friends_hold',
          facets: ['Playfulness', 'Self-Consciousness', 'Trust'],
        },
        { text: 'Later, the festival thins out. Floating lanterns drift down the river toward the sea.', animation: 'walk_home' },
      ],
      next: 'rooftop',
    },

    // -------------------------------------------------------------------------
    // Two: a colleague takes the credit
    // -------------------------------------------------------------------------
    rooftop: {
      steps: [
        { text: 'Two. The Rooftop', animation: 'chapter_rooftop' },
        { text: 'Noon. Your team eats lunch on the office roof, under a sky so blue it looks painted.', animation: 'rooftop_wide' },
        { text: 'Last week the launch nearly fell apart. You and Ren stayed two nights in a row and rewrote half of it together.', animation: 'rooftop_memory' },
        { speaker: KURODA, text: 'I have to say, the launch went beautifully. The client called it the smoothest one they\'ve seen.', animation: 'kuroda_praises' },
        { speaker: REN, text: 'Honestly? I basically rebuilt the whole thing over the weekend. Barely slept.', animation: 'ren_brags' },
        { text: 'He laughs and stretches. He doesn\'t look your way.', animation: 'ren_stretches' },
        { text: 'Ms. Kuroda nods, impressed, then turns to you.', animation: 'kuroda_turns' },
        { speaker: KURODA, text: 'You were on that too, weren\'t you?', animation: 'kuroda_asks' },
        {
          id: 'ren_credit',
          prompt: 'Ms. Kuroda is waiting. What do you say, and why?',
          animation: 'kuroda_asks',
          facets: ['Modesty', 'Self-Consciousness', 'Trust'],
        },
        { text: 'After lunch, everyone heads back down to their desks. Ren hangs back by the stairs, scrolling his phone.', animation: 'ren_hold' },
        {
          id: 'ren_after',
          prompt: "It's just the two of you on the roof now. Do you say anything to Ren about how he told it? If so, what?",
          animation: 'ren_hold',
          facets: ['Assertiveness', 'Anger', 'Cooperation'],
        },
      ],
      next: 'last_train',
    },

    // -------------------------------------------------------------------------
    // Three: an old man talks to an empty seat
    // -------------------------------------------------------------------------
    last_train: {
      steps: [
        { text: 'Three. The Last Train', animation: 'chapter_train' },
        { text: 'The last train home is nearly empty. Small towns slide past the window, a few lit windows each.', animation: 'train_wide' },
        { text: 'Across the aisle sits an old man in a pressed grey suit. He holds a bouquet of white flowers in his lap, very carefully, as if it might spill.', animation: 'old_man_flowers' },
        { text: 'He\'s talking quietly to the empty seat beside him.', animation: 'old_man_talks' },
        { speaker: OLD_MAN, text: '...no, you were right about the plum tree. It came back after all.', animation: 'old_man_talks' },
        { text: 'He chuckles, and pats the seat once, the way you\'d pat someone\'s hand.', animation: 'old_man_pats' },
        { text: 'At the next stop he stands, straightens his jacket, and looks back at the empty seat.', animation: 'old_man_stands' },
        { speaker: OLD_MAN, text: 'Come on, then. We\'re home.', animation: 'old_man_home' },
        { text: 'The doors close. You watch him walk slowly down the platform, the flowers held out in front of him.', animation: 'platform_leaves' },
        {
          id: 'old_man_feeling',
          prompt: 'How did watching him leave you feeling? Take a moment with it before you answer.',
          animation: 'train_after',
          facets: ['Emotionality', 'Sympathy'],
        },
      ],
      next: 'borrowed_book',
    },

    // -------------------------------------------------------------------------
    // Four: a note left in a returned book
    // -------------------------------------------------------------------------
    borrowed_book: {
      steps: [
        { text: 'Four. The Borrowed Book', animation: 'chapter_book' },
        { text: 'A rainy Sunday. Months ago you lent your friend Aoi a novel you love. This morning it was back in your mailbox, wrapped in a bag against the rain.', animation: 'window_rain' },
        { text: 'You curl up by the window to read it again. Halfway through, a folded page slips out.', animation: 'note_falls' },
        { text: 'It\'s Aoi\'s handwriting, addressed to no one. The first line shows above the fold: "I don\'t think I\'ve been okay for a while."', animation: 'note_close' },
        { text: 'Your phone buzzes on the windowsill. It\'s Aoi.', animation: 'phone_buzz' },
        { speaker: AOI, text: 'Got it back to you finally!! Sorry it took forever. It helped more than you know :)', animation: 'aoi_text' },
        {
          id: 'aoi_next',
          prompt: 'The note is still folded in your hand. Do you read the rest, give it back, bring it up, or let it be? Why?',
          animation: 'window_think',
          facets: ['Sympathy', 'Trust', 'Anxiety'],
        },
        {
          id: 'your_reading',
          prompt: 'Away from these four moments now. Think of the last time you thought someone was annoyed with you, or laughing at you. What did you do with it, and how long did it stay with you?',
          animation: 'window_think',
          facets: ['Anxiety', 'Self-Consciousness'],
        },
        { text: 'The rain keeps on. Four small moments, and in each one you only ever saw the outside.', animation: 'closing' },
      ],
    },
  },
};
