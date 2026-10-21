import type { Script } from '../personality';

// The Night Class: ten weeks of big questions in Room 14
// You have to take an evening class at the college: it's required, not chosen. The tutor puts the Ship of Theseus on
// the blackboard, then turns it on you. Clive, who has an answer for everything, gets your point backwards in front of
// the room. After the break you're paired with Bea, who hasn't followed a word, and the class argues about whether it's
// ever right to lie.
// Written to the IPIP-NEO items in ../scene_grouping.md: avoiding philosophical discussions (O5.7), having difficulty
// understanding abstract ideas (O5.8), not being interested in theoretical discussions (O5.9), believing that there is
// no absolute right or wrong (O6.2), holding back my opinions (E3.10) and believing that I am better than others (A5.5).

const MARGARET = 'Margaret, the tutor';
const CLIVE = 'Clive';
const BEA = 'Bea';

export const theNightClass: Script = {
  id: 'the_night_class',
  title: 'The Night Class',
  facets: ['Assertiveness', 'Intellect', 'Liberalism', 'Modesty'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the ship
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Night Class', animation: 'title_card' },
        { text: "January. You have to take an evening class at the college called 'Big Questions'. You didn't pick it: it's required, ten weeks in a row on Wednesdays.", animation: 'notice' },
        { text: "Your first class is in Room 14 at 7pm. It's the old part of the college, and it still has a blackboard. Rain taps form a melody on the windows while a dozen strangers circle the tables.", animation: 'room' },
        { speaker: MARGARET, text: "The tutor sweeps into the room. 'Evening, all. No right answers in here. Well. We'll see.'", animation: 'margaret' },
        { speaker: MARGARET, text: "We'll start with an old argument the Greeks started over two thousand years ago. It's called the Ship of Theseus.", animation: 'margaret' },
        { text: 'She draws a ship on the board.', animation: 'ship' },
        { speaker: MARGARET, text: 'Theseus was a hero of Athens, and after he died, the Athenians kept his ship in the harbor as a monument. People came from all over to see it.', animation: 'ship' },
        { speaker: MARGARET, text: "But it's made of wood, and wood rots. So whenever a plank went soft, they took it out and put a new one in, exactly the same shape. One plank at a time, over a hundred years.", animation: 'ship' },
        { speaker: MARGARET, text: "Until one day, there wasn't a single original plank left. Every bit of it is new. Which prompts a question: Is it still Theseus's ship?", animation: 'ship' },
        { text: 'Most of the room nods. It never stopped being the ship. It was in the same harbor the whole time, and nobody ever noticed the day it changed.', animation: 'ship' },
        { speaker: MARGARET, text: "Sure, that part is easy enough. Now, the twist. All those years, a shipwright down the road has been collecting the rotten old planks as they came out.", animation: 'ship_two' },
        { speaker: MARGARET, text: "He fixes them up, and puts them back together, plank for plank, exactly as they were. Now he's got a ship made entirely of the wood Theseus actually sailed on.", animation: 'ship_two' },
        { speaker: MARGARET, text: "So there are two ships in the harbor. One has been there all along, but none of it is the wood Theseus sailed on. The other is built from that original wood, but it's spent a hundred years in pieces in a shed. They can't both be the real one. Can they?", animation: 'ship_two' },
        {
          id: 'the_ship',
          prompt: 'Which is the real one? Pick one, and tell me why.',
          animation: 'ship_two',
          facets: ['Intellect'],
          choices: [
            { label: 'The one that kept sailing. It changed slowly, but it never stopped being the ship.', next: 'ship_new' },
            { label: "The one made of the old planks. It's the original wood.", next: 'ship_old' },
            { label: "Both, or neither. It depends what you mean by 'the same'.", next: 'ship_both' },
            { label: "Does it matter? It's a boat.", next: 'ship_shrug' },
            { label: 'Something else.', next: 'the_self', other: true },
          ],
        },
      ],
    },

    ship_new: {
      steps: [{ text: 'Margaret puts a check mark under the new ship. Five people agree with you, and four think you\'re mad.', animation: 'vote_new' }],
      next: 'the_self',
    },

    ship_old: {
      steps: [{ text: 'Margaret puts a check mark under the old planks. Four people agree with you, and five think you\'re mad.', animation: 'vote_old' }],
      next: 'the_self',
    },

    ship_both: {
      steps: [{ text: 'Margaret draws a big question mark between the two ships. "Now we\'re getting somewhere," she says.', animation: 'vote_both' }],
      next: 'the_self',
    },

    ship_shrug: {
      steps: [{ text: 'A few people laugh. Margaret starts a new column for you: DOES IT MATTER? "We\'ll come back to that," she says.', animation: 'vote_shrug' }],
      next: 'the_self',
    },

    // -------------------------------------------------------------------------
    // you
    // -------------------------------------------------------------------------
    the_self: {
      steps: [
        { speaker: MARGARET, text: "Now let's make it about you. Most of the cells in your body have been replaced since you were seven. So have your memories, your opinions, your face... everything!", animation: 'self' },
        { speaker: MARGARET, text: "Are you the same person as the seven-year-old in your old school photo? And if you are, what is it that's stayed the same?", animation: 'self_same' },
        {
          id: 'the_self',
          prompt: 'What do you think? Say as much or as little as you like.',
          animation: 'self_same',
          facets: ['Intellect'],
        },
      ],
      next: 'the_clive',
    },

    // -------------------------------------------------------------------------
    // Clive
    // -------------------------------------------------------------------------
    the_clive: {
      steps: [
        { text: "Back to the classroom. Clive has had his hand up since the ship. He's retired from something, and he's talked more tonight than the rest of the room put together.", animation: 'clive' },
        { speaker: CLIVE, text: 'With respect to our friend here, what they said earlier was this...', animation: 'clive_talk' },
        { text: "Then he sums up your answer to the ship, and gets it wrong, nearly backwards. He spends two minutes taking apart a point you never made. Half the room is nodding.", animation: 'clive_wrong' },
        {
          id: 'the_clive',
          prompt: 'What do you do? Pick one, and tell me what you say, if anything.',
          animation: 'clive_wrong',
          facets: ['Assertiveness'],
          choices: [
            { label: "Stop him, and say that's not what I said.", next: 'clive_stop' },
            { label: 'Wait till he finishes, then put it right, politely.', next: 'clive_after' },
            { label: 'Let it go, and maybe have a word with Margaret at the break.', next: 'clive_break' },
            { label: "Say nothing. It's not worth the fuss.", next: 'clive_quiet' },
            { label: 'Something else.', next: 'the_pair', other: true },
          ],
        },
      ],
    },

    clive_stop: {
      steps: [{ text: 'Clive stops, mid-sentence, for the first time tonight. Somebody at the back snickers: "Good."', animation: 'clive_stopped' }],
      next: 'the_pair',
    },

    clive_after: {
      steps: [{ text: 'You put it right. Clive says "Well, that\'s what I said," which it wasn\'t, and Margaret writes your version on the board.', animation: 'clive_stopped' }],
      next: 'the_pair',
    },

    clive_break: {
      steps: [{ text: 'Clive moves on to the next point. At the break Margaret says, "I thought he had you wrong, actually."', animation: 'clive_on' }],
      next: 'the_pair',
    },

    clive_quiet: {
      steps: [{ text: 'Clive moves on to the next point. Nobody else seems to notice.', animation: 'clive_on' }],
      next: 'the_pair',
    },

    // -------------------------------------------------------------------------
    // Bea
    // -------------------------------------------------------------------------
    the_pair: {
      steps: [
        { text: 'Then it is break time. You grab some tea from a pot on the table, and Clive eats all of the cookies.', animation: 'break' },
        { text: "After the break, Margaret puts everyone in pairs. You're with Bea, who hasn't said a word all night.", animation: 'pair' },
        { speaker: BEA, text: "Can I be honest? I haven't followed any of it. I thought the ship was a real ship. Everyone else seems to get it straight away.", animation: 'pair_lost' },
        {
          id: 'the_pair',
          prompt: 'What do you do? Pick one, and tell me honestly what you make of Bea.',
          animation: 'pair_lost',
          facets: ['Modesty'],
          choices: [
            { label: 'Go back over it with her, slowly, for as long as it takes.', next: 'pair_explain' },
            { label: 'Give her the short version, and get on with the exercise.', next: 'pair_short' },
            { label: "Tell her I'm not sure I've got it either, and work it out together.", next: 'pair_together' },
            { label: "Do the exercise myself. It's quicker, and she can listen.", next: 'pair_alone' },
            { label: 'Something else.', next: 'the_door', other: true },
          ],
        },
      ],
    },

    pair_explain: {
      steps: [{ text: 'You draw the ship again, plank by plank, on the back of the handout. Halfway through, Bea says "Oh!", and laughs.', animation: 'pair_drawn' }],
      next: 'the_door',
    },

    pair_short: {
      steps: [{ text: 'Thirty seconds on the ship, then on to the exercise. Bea nods along.', animation: 'pair_drawn' }],
      next: 'the_door',
    },

    pair_together: {
      steps: [{ text: 'You draw the ship on the back of the handout, and between you, you work it out.', animation: 'pair_drawn' }],
      next: 'the_door',
    },

    pair_alone: {
      steps: [{ text: 'You fill in the sheet. Bea watches, and says "That makes sense," now and then.', animation: 'pair_sheet' }],
      next: 'the_door',
    },

    // -------------------------------------------------------------------------
    // the door
    // -------------------------------------------------------------------------
    the_door: {
      steps: [
        { speaker: MARGARET, text: "Okay, everyone back together. Last one tonight. Picture this: Your friend runs into your house, white as a sheet. Someone's after them, and they're scared for their life. You hide them upstairs.", animation: 'door' },
        { speaker: MARGARET, text: "A minute later, there's a knock. It's a man with a knife, and he asks you, quite calmly: is your friend in there?", animation: 'door' },
        { speaker: MARGARET, text: "What do you do? Do you tell the man the truth? Or lie?", animation: 'door' },
        { text: '"Obviously you lie," says someone at the back. "You say they ran off down the road." Most of the room agrees.', animation: 'door' },
        { speaker: MARGARET, text: "Most people do. But the philosopher Immanuel Kant disagreed. He thought you mustn't lie. Not even if your friend's life might be in danger.", animation: 'door_kant' },
        { speaker: MARGARET, text: "His reasoning goes like this. Lying is wrong in itself, not because of what happens after. You are not responsible for the evil the murderer chooses to do, but you are responsible for breaking the universal moral law of truthfulness. So you can't make exceptions, even good ones.", animation: 'door_kant' },
        { speaker: MARGARET, text: "And you can't know what happens next. Say you tell him your friend ran off down the road. But without you knowing, your friend left out the back door and down the road. So if you lie to the man and tell him your friend continued on down the road you would unwittingly be sending him straight to your friend. If you tell the truth then whatever he does is on him, not you. You can refuse to answer, or shut the door in his face. But you mustn't lie.", animation: 'door_kant' },
        { text: "The room splits down the middle. Clive says it's simple: Kant was right, a rule's a rule. Three people say that's mad. Margaret draws a line across the board, from ALWAYS WRONG to IT DEPENDS.", animation: 'line' },
        { speaker: MARGARET, text: "So that's the real question, under the knife. Are some things just wrong, always and everywhere, whatever happens? Or does whether something is right or wrong depend on the situation?", animation: 'line' },
        {
          id: 'right_answer',
          prompt: 'Is there a right answer? Pick one, and tell me why.',
          animation: 'line',
          facets: ['Liberalism'],
          choices: [
            { label: 'Yes. Some things are wrong, always, whatever anyone says.', next: 'line_always' },
            { label: 'A few things are always wrong. Most things depend.', next: 'line_few' },
            { label: 'It depends: on the situation, the people, the culture.', next: 'line_depends' },
            { label: 'No. Right and wrong are just what people agree on.', next: 'line_agree' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    line_always: {
      steps: [{ text: 'Margaret puts your X at the ALWAYS WRONG end of the line, right next to Clive.', animation: 'cross_always' }],
      next: 'the_end',
    },

    line_few: {
      steps: [{ text: 'Margaret puts your X a little way along from ALWAYS WRONG.', animation: 'cross_few' }],
      next: 'the_end',
    },

    line_depends: {
      steps: [{ text: 'Margaret puts your X down toward IT DEPENDS.', animation: 'cross_depends' }],
      next: 'the_end',
    },

    line_agree: {
      steps: [{ text: 'Margaret puts your X right off the end of the line, past IT DEPENDS. Clive makes a noise.', animation: 'cross_agree' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // the end of the class
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'Then Bea puts her hand up, for the first time all night.', animation: 'bea' },
        { speaker: BEA, text: "What if you've got him wrong? You only think he's the murderer. Maybe he's come to warn them.", animation: 'bea' },
        { text: 'The room goes quiet. Margaret writes it on the board, and draws a star next to it.', animation: 'bea_star' },
        { text: "Nine o'clock. It's still raining. You walk out to the parking lot with the others, and the argument carries on under the umbrellas.", animation: 'car_park' },
        {
          id: 'the_class',
          prompt: 'How was that, for you? Did anything from tonight stay with you? If it weren\'t required, would you go back next Wednesday?',
          animation: 'car_park',
          facets: ['Intellect', 'Assertiveness', 'Modesty'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Before next week, a couple of questions about you. Your actual life, not Room 14.', animation: 'homework' },
        {
          id: 'last_talk',
          prompt: 'In the last month, how many times did you end up in a real conversation about a big question: what\'s right, what\'s real, what any of it means? Did you enjoy it, or try to change the subject?',
          animation: 'homework',
          facets: ['Intellect', 'Liberalism'],
        },
        {
          id: 'last_room',
          prompt: 'The last time someone at work, with friends or in a group chat said something you thought was wrong, did you say so? And the last time someone struggled to understand something you got right away, what went through your head?',
          animation: 'homework',
          facets: ['Assertiveness', 'Modesty'],
        },
        { text: 'See you next Wednesday. Room 14, seven sharp. Bring cookies.', animation: 'goodbye' },
      ],
    },
  },
};
