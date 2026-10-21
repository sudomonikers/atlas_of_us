import type { Script } from '../personality';

// The Big Party: a ballroom under a mirror ball
// A friend's 40th in the old ballroom above a bowling alley: two hundred people, a loud band, and the player knows about
// four of them. A real three-minute clock runs from walking in until the band starts, and once they start it's too
// loud to talk, so hanging back costs the chance to meet anyone. Running out jumps straight to band_early, skipping
// whatever was left. Then a friend low in a corner and a stranger on his own, and the band calling people up on stage.
// Written to the IPIP-NEO items in ../scene_grouping.md: finding it hard to approach others (N4.3), feeling comfortable
// around people (E1.3), loving large parties (E2.1), talking to lots of different people at parties (E2.2), making
// friends easily (E1.1), cheering people up (E1.5), anticipating others' needs (A3.2), fearing drawing attention to
// yourself (N4.4) and acting wild and crazy (E5.6).

const MEI = 'Mei';
const SINGER = 'The singer';

export const theBigParty: Script = {
  id: 'the_big_party',
  title: 'The Big Party',
  facets: ['Self-Consciousness', 'Friendliness', 'Gregariousness', 'Excitement-Seeking', 'Altruism'],
  start: 'opening',
  clock: { seconds: 180, from: 'walking_in', until: 'band_on', late: 'band_early' },
  sections: {
    // -------------------------------------------------------------------------
    // the invitation, before the clock starts
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Big Party', animation: 'title_card' },
        { text: "Your friend Dani is turning forty. She's rented the old ballroom above the bowling alley, booked a live band, and invited, by her own count, two hundred people.", animation: 'invite' },
        { text: "You'll know about four of them: Dani, her partner Theo, and a couple of people she used to work with.", animation: 'invite' },
        { text: 'It\'s Saturday night. You can hear the party from the street already, with music coming through the windows and a lot of people all talking at once.', animation: 'street' },
        { text: "A sign at the bottom of the stairs says BAND ON AT 8:30. It's 8:27 now, and once the band starts, nobody is going to hear a word anyone says.", animation: 'stairs' },
        { text: "That gives you three minutes to meet people. Up you go.", animation: 'stairs' },
      ],
      next: 'walking_in',
    },

    // -------------------------------------------------------------------------
    // the clock is running
    // -------------------------------------------------------------------------
    walking_in: {
      steps: [
        { text: "The ballroom is packed. Dani is all the way on the far side, surrounded by a crowd three people deep. Theo is behind the bar, helping out with drinks. You don't recognize anyone else.", animation: 'room' },
        {
          id: 'walk_in',
          prompt: 'What do you do first? Pick one, and tell me why.',
          animation: 'room',
          facets: ['Self-Consciousness', 'Friendliness', 'Gregariousness'],
          choices: [
            { label: 'Walk up to someone and start talking.', next: 'dive_in' },
            { label: 'Squeeze through to Dani.', next: 'to_dani' },
            { label: 'Get a drink, and find a spot by the wall.', next: 'by_the_wall' },
            { label: 'Go back outside for a minute.', next: 'outside' },
            { label: 'Something else.', next: 'the_room', other: true },
          ],
        },
      ],
    },

    dive_in: {
      steps: [{ text: 'You turn to the nearest group and say hello. They shuffle around to make room for you.', animation: 'room_group' }],
      next: 'the_room',
    },

    to_dani: {
      steps: [{ text: 'Dani shrieks your name and hugs you, but then one of her aunts pulls her away. You\'re left standing in the middle of her friends.', animation: 'room_dani' }],
      next: 'the_room',
    },

    by_the_wall: {
      steps: [{ text: 'Theo pours you something fizzy. You find a spot along the wall near the bar and watch the room for a while.', animation: 'room_wall' }],
      next: 'the_room',
    },

    outside: {
      steps: [{ text: "You stand out on the steps for a bit. It's cooler out here, and quiet. After a minute, you head back up.", animation: 'outside' }],
      next: 'the_room',
    },

    the_room: {
      steps: [
        { text: "At one table, a group of Dani's old high school friends are arguing loudly about the best movie of 1999.", animation: 'room_film' },
        { text: "Over at the bar, a man is trying to get Theo's attention, without much luck.", animation: 'room_bar' },
        { text: 'Everyone else seems to be deep in conversation already.', animation: 'room_all' },
        {
          id: 'work_the_room',
          prompt: "The band's on any minute. Who do you talk to before then? Pick one, and tell me how you'd start.",
          animation: 'room_all',
          facets: ['Gregariousness', 'Friendliness', 'Self-Consciousness'],
          choices: [
            { label: 'Join the movie argument.', next: 'film' },
            { label: 'The man at the bar.', next: 'bar_man' },
            { label: 'As many people as I can, a minute or two each.', next: 'mingle' },
            { label: "Nobody. If someone comes over, fine.", next: 'wait_it_out' },
            { label: 'Something else.', next: 'band_on', other: true },
          ],
        },
      ],
    },

    film: {
      steps: [{ text: 'Within a minute, they\'ve asked you to settle it once and for all. Somebody is very upset about The Matrix.', animation: 'room_film' }],
      next: 'band_on',
    },

    bar_man: {
      steps: [{ text: 'His name is Ade. He was Dani\'s roommate back when she had a mohawk, and he still has the photos on his phone to prove it.', animation: 'room_bar' }],
      next: 'band_on',
    },

    mingle: {
      steps: [{ text: 'You do a lap of the room, swapping names, asking everyone how they know Dani, and making the same joke about the bowling alley downstairs. Some of the conversations go further than others.', animation: 'room_all' }],
      next: 'band_on',
    },

    wait_it_out: {
      steps: [{ text: 'You stay where you are. A woman comes over and asks if anyone\'s using the chair next to you, then carries it away.', animation: 'room_wall' }],
      next: 'band_on',
    },

    // the clock stops here when the player gets through in time
    band_on: {
      steps: [{ text: 'Right at 8:30, the drummer counts in, and the room gets twice as loud.', animation: 'band_on' }],
      next: 'the_corner',
    },

    // and jumps here, from wherever they were, when it runs out
    band_early: {
      steps: [{ text: 'The drummer counts in right in the middle of your sentence, and the room gets twice as loud. Whatever you were about to do, nobody can hear you now.', animation: 'band_on' }],
      next: 'the_corner',
    },

    // -------------------------------------------------------------------------
    // the corner
    // -------------------------------------------------------------------------
    the_corner: {
      steps: [
        { text: 'The band is loud, and a lot better than anyone expected. Half the room is already dancing.', animation: 'dance' },
        { text: "In a corner, Mei, one of the few people here you know, is sitting on her own. She hasn't touched her drink, and she's been staring at the same spot on the floor for a while.", animation: 'corner_priya' },
        { text: 'By the fire exit, an older man in a good suit is standing by himself, holding an empty plate and looking for somewhere to put it.', animation: 'corner_man' },
        {
          id: 'the_corner',
          prompt: 'What do you do? Pick one, and tell me why.',
          animation: 'corner_man',
          facets: ['Altruism', 'Friendliness'],
          choices: [
            { label: 'Go and sit with Mei.', next: 'priya' },
            { label: 'Go over to the man by the fire exit.', next: 'leonard' },
            { label: 'Leave them to it, and go and dance.', next: 'dancing' },
            { label: 'Something else.', next: 'the_stage', other: true },
          ],
        },
      ],
    },

    priya: {
      steps: [
        { text: "You sit down next to her. She gives you a smile that doesn't quite work.", animation: 'priya' },
        { speaker: MEI, text: "Sorry, I'm terrible company tonight. I got laid off on Tuesday. I didn't want to miss Dani's party, but I'm not really... here.", animation: 'priya' },
        {
          id: 'cheer_up',
          prompt: 'What do you say to her? Tell me what you would actually say.',
          animation: 'priya',
          facets: ['Friendliness', 'Altruism'],
        },
      ],
      next: 'the_stage',
    },

    leonard: {
      steps: [
        { text: 'You take the plate from him and introduce yourself. His name is Leonard. He was Dani\'s math teacher thirty years ago, and she still sends him a card every Christmas.', animation: 'leonard' },
        { text: "He doesn't know a single other person here, and he admits he was just working up the nerve to leave.", animation: 'leonard' },
      ],
      next: 'the_stage',
    },

    dancing: {
      steps: [{ text: 'You find an open spot on the dance floor and join in.', animation: 'dancing' }],
      next: 'the_stage',
    },

    // -------------------------------------------------------------------------
    // the stage
    // -------------------------------------------------------------------------
    the_stage: {
      steps: [
        { text: 'Then the singer taps the mic to get everyone\'s attention.', animation: 'stage' },
        { speaker: SINGER, text: "It's Dani's fortieth, and she's asked for one thing tonight. She wants five volunteers up here with us for the next song, for backing vocals and dance moves. No talent required!", animation: 'stage' },
        { text: 'A spotlight starts sweeping across the crowd, and Dani is pointing straight at you.', animation: 'spotlight' },
        {
          id: 'the_stage',
          prompt: "The light's coming your way. What do you do? Pick one, and tell me why.",
          animation: 'spotlight',
          facets: ['Self-Consciousness', 'Excitement-Seeking'],
          choices: [
            { label: "I'm up there before she's finished pointing.", next: 'volunteer' },
            { label: 'I go up, if she makes me.', next: 'dragged_up' },
            { label: 'I cheer from the floor.', next: 'cheer_on' },
            { label: 'I find somewhere else to be until it\'s over.', next: 'hide' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    volunteer: {
      steps: [{ text: "You're the first one up there. The singer hands you a tambourine.", animation: 'on_stage' }],
      next: 'up_there',
    },

    dragged_up: {
      steps: [{ text: 'Dani drags you up onto the stage by the wrist. The singer hands you a tambourine.', animation: 'on_stage' }],
      next: 'up_there',
    },

    up_there: {
      steps: [
        { text: 'The band kicks into the chorus. There are two hundred faces looking up at you, and the spotlight is right in your eyes.', animation: 'in_the_light' },
        {
          id: 'up_there',
          prompt: "Thirty seconds of chorus, and they're all yours. What do you do with them?",
          animation: 'in_the_light',
          facets: ['Excitement-Seeking', 'Self-Consciousness'],
        },
      ],
      next: 'the_end',
    },

    cheer_on: {
      steps: [{ text: "Five of Dani's friends go up instead. You cheer loudest of all for the one who attempts the splits.", animation: 'others_up' }],
      next: 'the_end',
    },

    hide: {
      steps: [{ text: 'You spend the whole song waiting in line for the restroom. Through the wall, you can hear two hundred people cheering.', animation: 'queue' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // lights up
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'At midnight, the band plays one last song, and then the big overhead lights come on, much to everyone\'s disappointment.', animation: 'lights_up' },
        {
          id: 'new_faces',
          prompt: "Over a whole night like this, roughly how many people do you think you'd end up having a proper conversation with? Is it likely you'd have met someone you'd love to see again, and would you actually do anything about it?",
          animation: 'lights_up',
          facets: ['Gregariousness', 'Friendliness'],
        },
        {
          id: 'how_was_it',
          prompt: 'And the night itself, out of ten? Would you have stayed later if you could, or were you ready to go an hour ago?',
          animation: 'lights_up',
          facets: ['Gregariousness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Before you go, I have a couple of questions about you. Your actual life, that is, not the party.', animation: 'keepsakes' },
        {
          id: 'big_dos',
          prompt: "In the last twelve months, how many parties or big get-togethers have you been to where you didn't know most of the people there? How many did you say no to? And how did you feel walking into the last one?",
          animation: 'keepsakes',
          facets: ['Gregariousness', 'Self-Consciousness'],
        },
        {
          id: 'new_friend',
          prompt: "When did you last make a new friend: someone you now see or message on your own, not just through someone else? How did it start? If it's been years, that's an answer too.",
          animation: 'keepsakes',
          facets: ['Friendliness'],
        },
        { text: 'Happy birthday, Dani!', animation: 'goodbye' },
      ],
    },
  },
};
