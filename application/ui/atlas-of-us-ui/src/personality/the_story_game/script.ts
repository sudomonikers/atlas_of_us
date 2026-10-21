import type { Script } from '../personality';

// The Story Game: an ink sketchbook by a wood stove
// A narrator tells a story and stops for the player to fill it in: where the traveler lands, what the ferryman says
// when his goat eats their map, how strange the place gets, a riddle at the town gate, the town poet, and the ending.
// Written to the IPIP-NEO items in ../scene_grouping.md: a vivid imagination or difficulty imagining things (O1.1,
// O1.10), wild flights of fantasy (O1.2), joking around (E6.10), complex problems (O5.1) and poetry (O2.7). Mostly
// it's watched rather than asked: how much they invent, whether they joke, try the riddle, and read the poem.

const NARRATOR = 'The Narrator';
const POET = 'The Poet';

export const theStoryGame: Script = {
  id: 'the_story_game',
  title: 'The Story Game',
  facets: ['Cheerfulness', 'Imagination', 'Artistic Interests', 'Intellect'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the shore
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Story Game', animation: 'title_card' },
        { speaker: NARRATOR, text: "Oh, good, you made it. Pull up a chair by the stove and get warm. I've got a brand new sketchbook here, and there's nothing in it yet.", animation: 'blank_page' },
        { speaker: NARRATOR, text: 'Here\'s how the game works. I start telling a story, and every so often I stop and you tell me what happens next. Then I pick it up from whatever you said and keep going.', animation: 'blank_page' },
        { speaker: NARRATOR, text: "There are no wrong answers. It's only a story, and nobody is grading it.", animation: 'once_upon' },
        { speaker: NARRATOR, text: 'Once upon a time, there was a traveler who sailed so far that they went off the edge of every map.', animation: 'shore_boat' },
        { speaker: NARRATOR, text: 'After eleven days at sea, their little boat finally scraped up onto a shore that nobody had ever drawn.', animation: 'shore' },
        {
          id: 'invent_a_place',
          speaker: NARRATOR,
          prompt: 'Where have they landed? Describe it for me: what the traveler sees, hears and smells as they step off the boat, and who, or what, lives there.',
          animation: 'shore_unknown',
          facets: ['Imagination'],
        },
      ],
      next: 'the_goat',
    },

    // -------------------------------------------------------------------------
    // the ferryman's goat
    // -------------------------------------------------------------------------
    the_goat: {
      steps: [
        { speaker: NARRATOR, text: "Hold on, let me get all of that down before I forget it.", animation: 'scribbling' },
        { text: 'Down on the beach, an old ferryman is waiting for them, and standing beside him is a goat. The goat is chewing on something.', animation: 'goat' },
        { text: "It's the traveler's map, and it was the only one they had. The goat swallows the last corner of it and lets out a burp.", animation: 'goat_burp' },
        { text: 'The ferryman takes off his hat, looks very embarrassed, and opens his mouth to speak.', animation: 'goat_ferryman' },
        {
          id: 'the_goat',
          speaker: NARRATOR,
          prompt: 'What does the ferryman say? And what does the traveler say back?',
          animation: 'goat_ferryman',
          facets: ['Cheerfulness', 'Imagination'],
        },
      ],
      next: 'how_strange',
    },

    how_strange: {
      steps: [
        { speaker: NARRATOR, text: 'Got it, every word of it.', animation: 'scribbling' },
        { speaker: NARRATOR, text: "Now, every place has a secret or two. And since this is our story, it can bend the rules of the real world as far as we like. Or not at all, if you'd rather.", animation: 'strange' },
        {
          id: 'how_strange',
          speaker: NARRATOR,
          prompt: 'How strange should this place get? Pick one, then tell me the strangest thing about it.',
          animation: 'strange',
          facets: ['Imagination'],
          choices: [
            { label: 'Keep it close to the real world.', next: 'the_gate' },
            { label: 'A little magic, around the edges.', next: 'the_gate' },
            { label: 'Let it get as wild as it wants.', next: 'the_gate' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // the riddle at the gate
    // -------------------------------------------------------------------------
    the_gate: {
      steps: [
        { text: 'A path winds up from the beach to a town with a high stone wall all the way around it. When the traveler gets to the gate, it\'s shut.', animation: 'gate' },
        { text: 'Three lanterns hang over the gate: one red, one gold and one blue. Carved into the stone beside them are the words: The key hangs under one of us. Only one of us speaks true.', animation: 'gate_lanterns' },
        { speaker: 'The red lantern', text: 'The key is not under me.', animation: 'gate_red' },
        { speaker: 'The gold lantern', text: 'The key is under the red one.', animation: 'gate_gold' },
        { speaker: 'The blue lantern', text: 'The key is not under the gold one.', animation: 'gate_blue' },
        { speaker: NARRATOR, text: "You don't have to play along with them, of course. Around the side, there's a low part of the wall that the traveler could probably climb.", animation: 'gate_lanterns' },
        {
          id: 'the_riddle',
          speaker: NARRATOR,
          prompt: 'What does the traveler do? If you try the riddle, give your answer and how you got there.',
          animation: 'gate_lanterns',
          facets: ['Intellect'],
          choices: [
            { label: 'Work out the riddle.', next: 'gate_opens' },
            { label: 'Take a guess.', next: 'gate_opens' },
            { label: 'Climb the wall.', next: 'climb' },
            { label: 'Something else.', next: 'riddle_other', other: true },
          ],
        },
      ],
    },

    gate_opens: {
      steps: [
        { text: 'The traveler reaches up under the lantern they picked.', animation: 'gate_lanterns' },
        { speaker: NARRATOR, text: 'It was the gold one, for the record. If the key were under either of the others, two of the lanterns would be telling the truth, and only one of them is allowed to.', animation: 'gate_open' },
        { speaker: NARRATOR, text: "But I'm a soft touch, so whichever one they picked, the gate creaks open.", animation: 'gate_open' },
      ],
      next: 'the_town',
    },

    riddle_other: {
      steps: [
        { speaker: NARRATOR, text: "Well, that's one I didn't see coming. The lanterns look at each other, confused, and then the gate creaks open anyway.", animation: 'gate_open' },
        { speaker: NARRATOR, text: 'The key was under the gold one, for the record. If it were under either of the others, two of the lanterns would be telling the truth.', animation: 'gate_open' },
      ],
      next: 'the_town',
    },

    climb: {
      steps: [
        { text: "The traveler goes around the side and climbs over the wall. One scraped knee and a little lost dignity later, they're in.", animation: 'gate_climb' },
        { speaker: NARRATOR, text: 'The key was under the gold lantern, by the way. If it were under either of the others, two of the lanterns would be telling the truth.', animation: 'gate_climb' },
      ],
      next: 'the_town',
    },

    // -------------------------------------------------------------------------
    // the town poet
    // -------------------------------------------------------------------------
    the_town: {
      steps: [
        { text: "Inside, the whole town has gathered in the square to meet them. It turns out they've been expecting a traveler for a hundred years.", animation: 'town' },
        { text: 'An old woman steps forward with a scroll and clears her throat. "That\'s the town poet," someone whispers. It looks like this could take a while.', animation: 'town_poet' },
        {
          id: 'the_poem',
          speaker: NARRATOR,
          prompt: "She's about to recite a poem in the traveler's honor. What do you do?",
          animation: 'town_poet',
          facets: ['Artistic Interests'],
          choices: [
            { label: 'Listen to the whole thing.', next: 'poem_read' },
            { label: 'Politely skip it.', next: 'poem_skipped' },
          ],
        },
      ],
    },

    poem_read: {
      steps: [
        { speaker: POET, text: "Out past the last of the lighthouse light,\nwhere the charts give up and the gulls take flight,", animation: 'scroll_1' },
        { speaker: POET, text: "there's a door in the sea that the tide forgets,\nand it opens for nobody's sorrows or debts.", animation: 'scroll_2' },
        { speaker: POET, text: 'It opened for you. Did you feel the latch?\nDid you hear the dark and the morning match?', animation: 'scroll_3' },
        { speaker: POET, text: "So sit, and be welcome, and stay till you're gray.\nOr go, if you must. But the door knows the way.", animation: 'scroll_4' },
        { text: 'The square goes quiet. The poet rolls up her scroll and looks at the traveler, waiting to hear what they thought.', animation: 'town_poet' },
        {
          id: 'poem_thoughts',
          speaker: NARRATOR,
          prompt: "What did you make of it? Be honest. She's very old, but she can take it.",
          animation: 'town_poet',
          facets: ['Artistic Interests'],
        },
      ],
      next: 'ending',
    },

    poem_skipped: {
      steps: [
        { text: 'The traveler smiles, thanks her warmly, and gently steers everyone toward the food.', animation: 'town' },
        { speaker: NARRATOR, text: "The poet rolls her scroll back up. She'll be fine. She's had worse reviews than that.", animation: 'town' },
      ],
      next: 'ending',
    },

    // -------------------------------------------------------------------------
    // the ending, and the real you
    // -------------------------------------------------------------------------
    ending: {
      steps: [
        { speaker: NARRATOR, text: "Now, every story needs an ending, and I'm not going to write this one for you.", animation: 'ending' },
        {
          id: 'how_it_ends',
          speaker: NARRATOR,
          prompt: 'What happens to the traveler? Do they stay, sail home, or something else entirely? Tell me how the story ends.',
          animation: 'ending',
          facets: ['Imagination'],
        },
        { speaker: NARRATOR, text: 'And that, as they say, is the end of the story.', animation: 'the_end' },
      ],
      next: 'real_life',
    },

    real_life: {
      steps: [
        { speaker: NARRATOR, text: "I think I'll keep this one. Before you go, I have a couple of questions about you. The real you, that is, not the traveler.", animation: 'book_closed' },
        {
          id: 'wandering_mind',
          speaker: NARRATOR,
          prompt: "In the last week, how many times did your mind wander off somewhere that doesn't exist: a daydream, a what-if, a world of your own? Where did it go the last time?",
          animation: 'book_closed',
          facets: ['Imagination'],
        },
        {
          id: 'just_for_fun',
          speaker: NARRATOR,
          prompt: "And in the last month, not counting the riddle just now, which of these did you do just because you wanted to: work at a puzzle or a hard problem, read or write a poem, make someone laugh on purpose? Tell me about the last time for each one. If it was none of them, that's an answer too.",
          animation: 'book_closed',
          facets: ['Intellect', 'Artistic Interests', 'Cheerfulness'],
        },
        { speaker: NARRATOR, text: 'Off you go, then. And watch out for goats.', animation: 'goodbye' },
      ],
    },
  },
};
