import type { Script } from '../personality';

// The Festival: a riso-printed festival poster
// A free afternoon at the city's arts festival, with a map of everything that's on. Who the player goes with, where
// they go first, a mural in an underpass that most people walk past and that's about to be painted over, where they
// end the day, and how much fun it was.
// Written to the IPIP-NEO items in ../scene_grouping.md: only feeling comfortable with friends (N4.5), art museums
// (O2.8), variety over routine (O4.1), new places (O4.2), avoiding crowds (E2.9), beauty others don't notice (O2.3),
// the importance of art (O2.1) and having a lot of fun (E6.2). Mostly it's watched rather than asked: who they go
// with, which pins they pick off the map, and whether they stop for the mural.

export const theFestival: Script = {
  id: 'the_festival',
  title: 'The Festival',
  facets: ['Self-Consciousness', 'Gregariousness', 'Cheerfulness', 'Artistic Interests', 'Adventurousness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // who you go with
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Festival', animation: 'title_card' },
        { text: "It's Saturday. Once a year, the city's arts festival takes over the streets downtown, and for once you've got the whole afternoon free.", animation: 'city' },
        { text: "Your phone buzzes. A couple of your friends are going too, but not until this evening. They want to know if you'll wait and come with them.", animation: 'phone' },
        { text: "There's also a free walking tour of the festival that leaves from the fountain at one o'clock. Anyone can join, you just have to show up.", animation: 'phone_tour' },
        {
          id: 'who_with',
          prompt: 'What do you do? Pick one, and tell me why.',
          animation: 'phone_tour',
          facets: ['Self-Consciousness', 'Gregariousness'],
          choices: [
            { label: 'Wait, and go down with my friends later.', next: 'with_friends' },
            { label: 'Go on my own, now.', next: 'alone' },
            { label: 'The walking tour, with a group of strangers.', next: 'tour' },
            { label: 'Something else.', next: 'the_map', other: true },
          ],
        },
      ],
    },

    with_friends: {
      steps: [{ text: "You hang around at home until five, then head down to meet your friends by the fountain. One of them has already bought churros, and another one is, as usual, running late.", animation: 'fountain_friends' }],
      next: 'the_map',
    },

    alone: {
      steps: [{ text: 'You head in on your own. You can go at your own pace, and there\'s nobody to wait for.', animation: 'fountain_alone' }],
      next: 'the_map',
    },

    tour: {
      steps: [
        { text: 'The guide holds up an umbrella with a paper fish tied to the top so everyone can find her. Eleven strangers follow the fish through the crowd, and so do you.', animation: 'fountain_tour' },
        { text: 'After the first stop, she tells everyone they\'re free to explore on their own for the rest of the afternoon.', animation: 'fountain_tour' },
      ],
      next: 'the_map',
    },

    // -------------------------------------------------------------------------
    // the map
    // -------------------------------------------------------------------------
    the_map: {
      steps: [
        { text: "Next to the fountain there's a festival information tent. A volunteer hands you a fold-out map with all the main events marked on it.", animation: 'map' },
        { text: 'The City Gallery has a new exhibition. There are three floors of paintings, and one mysterious room that nobody will tell you anything about.', animation: 'map_gallery' },
        { text: "The Old Quarter is a maze of back streets you've never walked down. The artists there open up their studios, and there are stalls set up all along the steps.", animation: 'map_quarter' },
        { text: 'The Main Square has the big stage and the food trucks, and it looks like most of the city is already there.', animation: 'map_square' },
        { text: "It's not part of the festival, but your usual café is just around the corner, if you'd rather sit somewhere familiar and watch it all go by.", animation: 'map_cafe' },
        {
          id: 'first_stop',
          prompt: 'Where do you go first? Tell me why there.',
          animation: 'map_all',
          facets: ['Artistic Interests', 'Adventurousness', 'Gregariousness'],
          choices: [
            { label: 'The gallery.', next: 'gallery' },
            { label: 'The Old Quarter.', next: 'quarter' },
            { label: 'The Main Square.', next: 'square' },
            { label: 'My usual café.', next: 'cafe' },
            { label: 'Something else.', next: 'the_mural', other: true },
          ],
        },
      ],
    },

    gallery: {
      steps: [
        { text: "Inside, it's cool and quiet. There's a room full of huge paintings, another full of tiny ones, and a film of the sea playing on a loop that nobody seems able to explain.", animation: 'gallery' },
        { text: 'You lose a whole hour in there without even noticing.', animation: 'gallery' },
      ],
      next: 'the_mural',
    },

    quarter: {
      steps: [
        { text: 'The Old Quarter is all narrow steps and clotheslines strung between the windows. A potter has her door propped open so you can watch her work, and a man is selling pickles out of an old baby carriage.', animation: 'quarter' },
        { text: 'You turn left, then right, then left again, and soon you have no idea where you are.', animation: 'quarter' },
      ],
      next: 'the_mural',
    },

    square: {
      steps: [
        { text: "The Main Square is packed shoulder to shoulder. A brass band is playing, the air smells like frying onions, and kids are sitting up on their parents' shoulders to see.", animation: 'square' },
        { text: 'Before you know it, the crowd has carried you all the way from one end of the square to the other.', animation: 'square' },
      ],
      next: 'the_mural',
    },

    cafe: {
      steps: [
        { text: 'Your usual table is free, and the barista has your order started before you even sit down.', animation: 'cafe' },
        { text: 'Through the window, you watch the festival go by: stilt walkers, a samba band, and a man dressed as a lighthouse.', animation: 'cafe' },
      ],
      next: 'the_mural',
    },

    // -------------------------------------------------------------------------
    // the mural
    // -------------------------------------------------------------------------
    the_mural: {
      steps: [
        { text: 'Later, you cut through an underpass to get across town. One whole wall of it is covered in a mural.', animation: 'underpass' },
        { text: "It shows a woman scattering seed for the birds. As they fly away, the birds slowly turn into the rooftops of the city.", animation: 'mural' },
        {
          id: 'the_mural',
          prompt: 'Most people walk past the mural with their heads down. What do you do?',
          animation: 'mural',
          facets: ['Artistic Interests'],
          choices: [
            { label: 'Stop and take it in.', next: 'mural_close' },
            { label: 'Snap a photo on the way past.', next: 'mural_notice' },
            { label: 'Keep walking.', next: 'mural_notice' },
          ],
        },
      ],
    },

    mural_close: {
      steps: [
        { text: "You stop to look, and the longer you look, the more you find. One of the birds is carrying a tiny key. A single window in the painted rooftops is lit up. And down by the ground, no bigger than a mouse, there's a little painted door.", animation: 'mural_close' },
        {
          id: 'what_you_see',
          prompt: "People are walking straight past all of this. What do you make of it? Tell me which part, if any, you'd stop for, and whether any of it gets to you.",
          animation: 'mural_close',
          facets: ['Artistic Interests'],
        },
      ],
      next: 'mural_notice',
    },

    mural_notice: {
      steps: [
        { text: 'At the far end, there\'s a notice from the city taped to the wall. The mural is going to be painted over on Monday to make room for a billboard.', animation: 'notice' },
        { text: "A volunteer with a clipboard is asking people to sign a petition to save it.", animation: 'volunteer' },
        {
          id: 'save_the_mural',
          prompt: 'Do you sign the petition to keep the mural? Tell me why, either way.',
          animation: 'volunteer',
          facets: ['Artistic Interests'],
          choices: [
            { label: 'Sign it.', next: 'signed' },
            { label: "Don't sign.", next: 'evening' },
            { label: 'Sign it, and send it to everyone I know.', next: 'signed_shared' },
          ],
        },
      ],
    },

    signed: {
      steps: [{ text: 'You sign it. The volunteer thanks you, and your name joins a long list of others.', animation: 'signed' }],
      next: 'evening',
    },

    signed_shared: {
      steps: [{ text: 'You sign it, take a photo of the mural, and send the petition to every group chat you\'re in.', animation: 'signed' }],
      next: 'evening',
    },

    // -------------------------------------------------------------------------
    // the evening
    // -------------------------------------------------------------------------
    evening: {
      steps: [
        { text: "The sun is starting to go down. There's just enough time for one more thing before the festival ends.", animation: 'dusk' },
        { text: 'The gallery is staying open late tonight, with a string quartet playing. The Main Square has the closing concert, with fireworks afterward.', animation: 'dusk_map' },
        { text: "Up in the Old Quarter, someone has hung paper lanterns all the way down a lane you haven't explored yet. Or there's always home, and the couch.", animation: 'dusk_map' },
        {
          id: 'last_stop',
          prompt: 'Where do you end the day? Tell me why.',
          animation: 'dusk_map',
          facets: ['Adventurousness', 'Gregariousness', 'Artistic Interests'],
          choices: [
            { label: 'The gallery, late.', next: 'late_gallery' },
            { label: 'The concert in the square.', next: 'concert' },
            { label: 'The lantern lane, wherever it goes.', next: 'lanterns' },
            { label: 'Home.', next: 'home' },
            { label: 'Something else.', next: 'the_day', other: true },
          ],
        },
      ],
    },

    late_gallery: {
      steps: [{ text: 'The quartet plays in the big room, right under the biggest painting in the gallery. Someone standing near you closes their eyes to listen.', animation: 'gallery_late' }],
      next: 'the_day',
    },

    concert: {
      steps: [
        { text: "The square is even more packed now. The band counts in, and ten thousand people sing along to a chorus they've all known since high school.", animation: 'concert' },
        { text: 'Then the fireworks start.', animation: 'fireworks' },
      ],
      next: 'the_day',
    },

    lanterns: {
      steps: [{ text: "The lane winds up to a courtyard you never knew was there. There are lanterns hanging in the trees, a fiddler playing, and someone handing out cups of mint tea.", animation: 'lanterns' }],
      next: 'the_day',
    },

    home: {
      steps: [{ text: 'You put the kettle on and kick off your shoes. Through the window, you see the first firework go up over the square.', animation: 'home' }],
      next: 'the_day',
    },

    the_day: {
      steps: [
        { text: 'The streets start to empty out, and someone is sweeping up the confetti.', animation: 'night' },
        {
          id: 'how_it_felt',
          prompt: 'So, how was it? Give the day a score out of ten, and tell me the best part and the worst.',
          animation: 'night',
          facets: ['Cheerfulness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Before you go, I have a couple of questions about you. Your actual life, that is, not the festival.', animation: 'keepsakes' },
        {
          id: 'going_alone',
          prompt: "When there's something on you'd like to go to, but nobody can come with you, do you go anyway? When did you last go somewhere like that on your own, and how was it?",
          animation: 'keepsakes',
          facets: ['Self-Consciousness', 'Gregariousness'],
        },
        {
          id: 'been_anywhere',
          prompt: "And in the last six months, how many times have you been to a gallery, museum, show or gig? How many times have you gone somewhere you'd never been before? Tell me about the last one of each. If it was none, that's an answer too.",
          animation: 'keepsakes',
          facets: ['Artistic Interests', 'Adventurousness'],
        },
        { text: 'See you at the same time next year, then.', animation: 'goodbye' },
      ],
    },
  },
};
