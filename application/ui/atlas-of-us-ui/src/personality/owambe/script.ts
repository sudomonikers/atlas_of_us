import type { Script } from '../personality';

// The Owambe: a wedding in Lagos
// The player's cousin Tolu is getting married, and the whole family is in the same coral lace. Designing an outfit,
// taking sides when the bride and her mother fight over the entrance, the MC's microphone, the dance floor, a power
// cut that branches, and a note for the couple's tenth anniversary; then a recall about the player's own traditions.
// The light one of the set: built for the traits the crisis scenes rarely reach.

const TOLU = 'Tolu';
const BISI = 'Aunty Bisi';
const IYA = 'Mama Tunde';
const MC = 'MC Gbenga';
const FEMI = 'Uncle Femi';

export const owambe: Script = {
  id: 'owambe',
  title: 'The Owambe',
  facets: ['Artistic Interests', 'Imagination', 'Liberalism', 'Intellect', 'Playfulness', 'Cheerfulness', 'Optimism', 'Gregariousness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the morning, and the lace
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Owambe', animation: 'title_card' },
        { text: 'Saturday morning in Lagos. Your cousin Tolu is getting married today, and the whole family has been getting ready for months.', animation: 'lagos_morning' },
        { text: "In your family everyone wears the aso-ebi: the same fabric, chosen by the bride's mother. This year Aunty Bisi chose coral lace with gold thread.", animation: 'fabric' },
        { text: "You've had yours for three weeks. It's still folded in its bag.", animation: 'fabric' },
        { speaker: BISI, text: "Tell me you have taken that lace to Mama Tunde. Tell me. She can sew anything by four o'clock if you go now.", animation: 'fabric' },
        { text: 'Mama Tunde has a shop the size of a cupboard, three sewing machines, and a radio playing highlife.', animation: 'tailor' },
        { speaker: IYA, text: "Put it there. Now tell me what you want. Anything at all, as long as you like it. Don't bring me a picture from your phone.", animation: 'tailor' },
        {
          id: 'the_aso_ebi',
          prompt: "The lace is on the table and her tape measure is round her neck. What do you ask her to make, and how should it look?",
          animation: 'tailor',
          facets: ['Artistic Interests', 'Imagination'],
        },
      ],
      next: 'arrival',
    },

    // -------------------------------------------------------------------------
    // the hall, and the entrance
    // -------------------------------------------------------------------------
    arrival: {
      steps: [
        { text: 'By four, the hall in Ikeja is full: four hundred guests, round tables in white and gold, a juju band on the stage, and a sea of coral lace.', animation: 'hall_wide' },
        { text: 'Waiters bring trays of small chops, puff-puff and jollof rice faster than anyone can eat them.', animation: 'hall_food' },
        { text: 'MC Gbenga has had the microphone since three, and he has not stopped talking.', animation: 'mc' },
        { text: "Behind the hall doors, Tolu grabs your arm. She's in the first of her three outfits, and she is not happy.", animation: 'backstage' },
        { speaker: TOLU, text: 'Mummy says we have to dance in to the juju band. Like every wedding in this family since 1970.', animation: 'backstage' },
        { speaker: TOLU, text: 'Emeka and I made our own song list. We practised a whole routine for two months. Tell her!', animation: 'backstage' },
        { speaker: BISI, text: 'A routine. From the internet. With your grandmother in the front row.', animation: 'backstage' },
        {
          id: 'the_entrance',
          prompt: 'They both turn to you. What do you say?',
          animation: 'backstage',
          facets: ['Liberalism', 'Cooperation'],
          choices: [
            { label: "It's their wedding. Let them do it their way.", next: 'entrance_new' },
            { label: 'Some things should be done the family way.', next: 'entrance_old' },
            { label: 'Start with the band, then switch to their song.', next: 'entrance_both' },
          ],
        },
      ],
    },

    entrance_new: {
      steps: [
        { text: 'Aunty Bisi throws up her hands. The doors open, the DJ drops the beat, and Tolu and Emeka come in doing their routine, every step of it.', animation: 'entrance' },
        { text: "The young cousins scream. Grandma, in the front row, watches without a word. Then she laughs, and waves her fan over her head.", animation: 'entrance' },
      ],
      next: 'mic',
    },

    entrance_old: {
      steps: [
        { text: 'The band strikes up the song every bride in the family has danced to. Tolu and Emeka dance in slowly, the old way.', animation: 'entrance' },
        { text: 'Tolu catches your eye and mouths "traitor". By the second verse, she is smiling anyway.', animation: 'entrance' },
      ],
      next: 'mic',
    },

    entrance_both: {
      steps: [
        { text: 'The band plays them in. Halfway down the aisle, the DJ cuts in with their song, and Tolu and Emeka break into the routine.', animation: 'entrance' },
        { text: "Aunty Bisi looks at you as if she can't decide whether to be cross. Grandma is already dancing.", animation: 'entrance' },
      ],
      next: 'mic',
    },

    // -------------------------------------------------------------------------
    // the microphone, and the dance floor
    // -------------------------------------------------------------------------
    mic: {
      steps: [
        { text: 'Then MC Gbenga spots you in the crowd.', animation: 'mc' },
        { speaker: MC, text: "Ladies and gentlemen! The bride's favourite cousin! Come, come! Tell us something about our bride that we don't know!", animation: 'mc' },
        { text: 'He presses the microphone into your hand. Four hundred faces turn round.', animation: 'mic_you' },
        {
          id: 'the_mic',
          prompt: 'The microphone is in your hand and the hall is waiting. What do you say?',
          animation: 'mic_you',
          facets: ['Playfulness', 'Gregariousness', 'Self-Consciousness'],
        },
        { speaker: MC, text: 'Ehen! Give it up, everybody!', animation: 'mc' },
        { text: 'Then the band goes up a gear, and the dance floor fills.', animation: 'dance_floor' },
        { text: "Aunties dance with their handbags. Uncles dance holding their caps on. Everyone is spraying money: crisp naira notes pressed to the couple's foreheads and raining down onto the floor.", animation: 'spraying' },
        { text: 'From the middle of it all, Grandma waves a fan of notes at you.', animation: 'grandma' },
        {
          id: 'the_dance',
          prompt: 'Grandma wants you on the floor. What do you do?',
          animation: 'grandma',
          facets: ['Cheerfulness', 'Gregariousness', 'Excitement-Seeking'],
          choices: [
            { label: 'Get up and dance until the band stops.', next: 'dance_all' },
            { label: 'One song for Grandma, then back to my seat.', next: 'dance_one' },
            { label: 'Wave back and stay at the table.', next: 'dance_sit' },
          ],
        },
      ],
    },

    dance_all: {
      steps: [{ text: 'You dance through four songs and an encore. Somebody sprays a note onto your forehead, and it sticks there.', animation: 'spraying' }],
      next: 'blackout',
    },

    dance_one: {
      steps: [{ text: 'You dance one song with Grandma. She is better at it than you, and she makes sure everybody sees.', animation: 'grandma' }],
      next: 'blackout',
    },

    dance_sit: {
      steps: [{ text: 'You wave back. Grandma shakes her head at you, and dances with one of the waiters instead.', animation: 'grandma' }],
      next: 'blackout',
    },

    // -------------------------------------------------------------------------
    // the power cut
    // -------------------------------------------------------------------------
    blackout: {
      steps: [
        { text: 'At half past eight, in the middle of a song, everything stops.', animation: 'blackout' },
        { text: 'The lights, the band, the ceiling fans. Pitch dark. Four hundred people groan at once.', animation: 'blackout' },
        { speaker: 'A voice in the dark', text: 'NEPA has taken light!', animation: 'blackout' },
        { text: 'Out the back, Uncle Femi yanks the generator cord. It coughs, and dies. It coughs again, and dies.', animation: 'generator' },
        { text: "The cake hasn't been cut, and the couple haven't had their last dance.", animation: 'blackout' },
        {
          id: 'the_blackout',
          prompt: "Four hundred guests in the dark, and the generator won't start. How do you think the rest of the night goes?",
          animation: 'blackout',
          facets: ['Optimism', 'Adaptability'],
        },
        {
          id: 'in_the_dark',
          prompt: 'What do you do?',
          animation: 'blackout',
          facets: ['Intellect', 'Playfulness', 'Orderliness'],
          choices: [
            { label: 'Go and help Uncle Femi work out what is wrong with the generator.', next: 'dark_generator' },
            { label: 'Get everyone singing by the light of their phones.', next: 'dark_singing' },
            { label: 'Find candles, and keep the food going round.', next: 'dark_candles' },
          ],
        },
      ],
    },

    dark_generator: {
      steps: [
        { speaker: FEMI, text: 'It has fuel. It turns over. It just will not catch. I have been doing this thirty years!', animation: 'generator' },
        { text: 'You crouch beside it with your phone torch. The choke lever is pushed all the way in. You pull it out, and Uncle Femi yanks the cord once more.', animation: 'generator' },
        { text: 'It roars.', animation: 'lights_back' },
      ],
      next: 'cake',
    },

    dark_singing: {
      steps: [
        { text: 'You hold up your phone torch and start the first song that comes into your head. One table joins in, then another.', animation: 'phones' },
        { text: 'By the chorus, four hundred little lights are swaying in the dark. Out the back, the generator finally roars.', animation: 'lights_back' },
      ],
      next: 'cake',
    },

    dark_candles: {
      steps: [
        { text: 'You find a box of candles in the kitchen and go from table to table. The waiters follow you with jollof by candlelight.', animation: 'candles' },
        { text: 'Out the back, the generator finally roars.', animation: 'lights_back' },
      ],
      next: 'cake',
    },

    // -------------------------------------------------------------------------
    // the cake, and the note
    // -------------------------------------------------------------------------
    cake: {
      steps: [
        { text: 'The lights snap back on. The band picks up exactly where it stopped, in the middle of the song, as if nothing happened.', animation: 'lights_back' },
        { text: 'Tolu and Emeka cut the cake: five tiers, with the skyline of Lagos in sugar on top.', animation: 'cake' },
        { text: "Late in the night, Tolu hands you the guestbook. Instead of signatures, they've asked every guest for a note to open on their tenth anniversary.", animation: 'guestbook' },
        {
          id: 'the_note',
          prompt: 'Write your note to Tolu and Emeka, to open ten years from now.',
          animation: 'guestbook',
          facets: ['Optimism', 'Imagination', 'Friendliness'],
        },
        { text: 'The band plays on until the hall manager has switched the lights off on them twice.', animation: 'late_night' },
        {
          id: 'your_tradition',
          prompt: 'Away from Lagos now. Think of a tradition in your own family or culture. Do you keep it, change it, or let it go, and why?',
          animation: 'late_night',
          facets: ['Liberalism'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'On the drive home, through the empty streets, you find a naira note still tucked in your collar.', animation: 'late_night' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
