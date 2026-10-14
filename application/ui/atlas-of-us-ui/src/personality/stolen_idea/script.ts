import type { Script } from '../personality';

// The Stolen Idea: The Vanishing Act
// The player is a small-time magician on a 1931 vaudeville bill. The headliner, the Great Marvello, closes the show
// with the trick the player showed him in confidence, and a week later turns up at their door needing help with it.
// Every path shares face_to_face and the last two prompts.

const MARVELLO = 'The Great Marvello';
const FITCH = 'Mr. Fitch';
const DOT = 'Dot';

export const stolenIdea: Script = {
  id: 'stolen_idea',
  title: 'The Stolen Idea',
  facets: ['Anger', 'Self-Consciousness', 'Assertiveness', 'Cooperation', 'Modesty', 'Competitiveness', 'Fairness', 'Stubbornness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the notebook
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Stolen Idea', animation: 'title_card' },
        { text: 'The Bijou Palace, 1931. Eleven acts, twice nightly, and the house is packed to the rafters.', animation: 'house' },
        { text: "You're the act before the interval: card tricks, and a rabbit named Pip. It's a living.", animation: 'your_act' },
        { text: "For months you've been working on something bigger, in a notebook you keep in your coat.", animation: 'notebook' },
        { text: 'The Mirror Walk. A magician steps into a mirror on one side of the stage and climbs out of a painting on the other.', animation: 'notebook' },
        { text: "Three weeks ago you showed it to the Great Marvello over coffee. He's top of the bill. You wanted his advice.", animation: 'green_room' },
        { speaker: MARVELLO, text: "Cute, kid. Real cute. Won't work, though. Mirrors are murder.", animation: 'green_room' },
        { text: "Tonight you're in the wings, watching the closing act.", animation: 'wings' },
      ],
      next: 'the_act',
    },

    the_act: {
      steps: [
        { speaker: MARVELLO, text: 'Ladies and gentlemen! For the first time on any stage... the Mirror Walk!', animation: 'marvello_act' },
        { text: 'He steps into the mirror. The glass ripples like water, and he is gone.', animation: 'mirror' },
        { text: 'A beat of silence. Then he climbs out of the painting on the far side of the stage, already bowing.', animation: 'painting' },
        { text: "It's your trick, every step of it, down to the gilt frame you doodled in the margin.", animation: 'painting' },
        { text: 'The house goes wild.', animation: 'ovation' },
        {
          id: 'in_the_wings',
          prompt: "Standing in the wings while they cheer, what's going through you?",
          animation: 'wings_ovation',
          facets: ['Anger', 'Self-Consciousness'],
        },
      ],
      next: 'spotlight',
    },

    // -------------------------------------------------------------------------
    // the spotlight
    // -------------------------------------------------------------------------
    spotlight: {
      steps: [
        { speaker: MARVELLO, text: 'And a big hand for my crew, folks, who keep the whole thing running!', animation: 'ovation' },
        { text: 'The spotlight swings across the stage and lands on you. Two thousand faces turn your way.', animation: 'spotlight' },
        {
          id: 'the_bow',
          prompt: 'The light is on you. What do you do?',
          animation: 'spotlight',
          facets: ['Assertiveness', 'Self-Consciousness', 'Anger'],
          choices: [
            { label: 'Step out and take a bow beside him.', next: 'bow_beside' },
            { label: 'Step back into the dark.', next: 'bow_dark' },
            { label: 'Freeze where I stand.', next: 'froze' },
            { label: 'Walk to the footlights and tell them the trick is mine.', next: 'bow_tell' },
          ],
        },
      ],
    },

    bow_beside: {
      steps: [{ text: 'You walk out. Marvello throws an arm round your shoulders and squeezes, hard, grinning at the crowd.', animation: 'bow_beside' }],
      next: 'backstage',
    },

    bow_dark: {
      steps: [{ text: 'You step back behind the curtain. The spotlight hangs on the empty wings, then swings back to him.', animation: 'wings_dark' }],
      next: 'backstage',
    },

    bow_tell: {
      steps: [
        { text: 'You walk down to the footlights. "That trick," you say, "was mine."', animation: 'bow_tell' },
        { text: "A few people laugh, sure it's part of the act. Marvello laughs loudest.", animation: 'bow_tell' },
        { speaker: MARVELLO, text: "Isn't the kid a riot? Hit it, boys!", animation: 'bow_tell_band' },
        { text: 'The band strikes up and drowns you out.', animation: 'bow_tell_band' },
      ],
      next: 'backstage',
    },

    froze: {
      steps: [{ text: "You don't move. The light hangs on you a moment longer, then swings back to him.", animation: 'wings_dark' }],
      next: 'backstage',
    },

    // -------------------------------------------------------------------------
    // backstage
    // -------------------------------------------------------------------------
    backstage: {
      steps: [
        { text: 'Backstage is chaos: dancers, a seal with a ball on its nose, someone looking for a lost tuba.', animation: 'backstage' },
        { speaker: FITCH, text: 'Marvello, you old dog! That Mirror Walk! You\'re headlining the summer tour. Forty cities, top of every bill!', animation: 'fitch' },
        { text: 'Mr. Fitch books every act on the circuit. A word from him and you\'d never open before the interval again.', animation: 'fitch' },
        { speaker: DOT, text: "That's yours. I've seen the notebook. Say something.", animation: 'dot' },
        {
          id: 'tell_fitch',
          prompt: 'Mr. Fitch is right there, lighting a cigar. What do you do?',
          animation: 'fitch',
          facets: ['Modesty', 'Fairness', 'Competitiveness', 'Assertiveness'],
          choices: [
            { label: "Tell Fitch it's mine, and that the headline spot should be too.", next: 'fitch_claim' },
            { label: "Tell Fitch it's mine, but don't ask for anything.", next: 'fitch_credit' },
            { label: 'Say nothing to Fitch. This is between me and Marvello.', next: 'fitch_quiet' },
          ],
        },
      ],
    },

    fitch_claim: {
      steps: [
        { speaker: FITCH, text: 'Yours, eh? Ha! Then show me something new by Friday, kid, and we\'ll talk.', animation: 'fitch_laugh' },
        { text: 'He pinches your cheek and is gone in a cloud of cigar smoke.', animation: 'fitch_laugh' },
      ],
      next: 'after_show',
    },

    fitch_credit: {
      steps: [
        { speaker: FITCH, text: "That so? Well, ideas are cheap, kid. Making 'em work, that's the trick.", animation: 'fitch_laugh' },
        { text: 'He pats your head like a dog that did something clever, and turns back to Marvello.', animation: 'fitch_laugh' },
      ],
      next: 'after_show',
    },

    fitch_quiet: {
      steps: [{ text: 'Fitch marches off with his arm through Marvello\'s, the two of them laughing at something.', animation: 'backstage' }],
      next: 'after_show',
    },

    after_show: {
      steps: [
        { text: 'Later, in the corridor, Marvello catches you with a grin.', animation: 'corridor' },
        { speaker: MARVELLO, text: 'There you are, pal! Wasn\'t that something? You should have seen their faces!', animation: 'corridor' },
        { speaker: MARVELLO, text: "Look, ideas are in the air. You had a doodle. I made it a trick. That's showbiz.", animation: 'corridor_shrug' },
        {
          id: 'face_to_face',
          prompt: "He's waiting, still grinning. What do you say to him?",
          animation: 'corridor_shrug',
          facets: ['Anger', 'Assertiveness', 'Fairness', 'Stubbornness'],
        },
        { text: 'He claps you on the back and strolls off, whistling.', animation: 'corridor_empty' },
      ],
      next: 'the_knock',
    },

    // -------------------------------------------------------------------------
    // a week later
    // -------------------------------------------------------------------------
    the_knock: {
      steps: [
        { text: 'A week later. The tour opens tomorrow night.', animation: 'dressing_room' },
        { text: 'Someone knocks at your dressing room door.', animation: 'knock' },
        { speaker: MARVELLO, text: "Kid. I'm in a jam. My assistant walked out this morning.", animation: 'doorway' },
        { speaker: MARVELLO, text: 'The Mirror Walk takes two. Somebody has to work the glass from under the stage, and nobody knows it like you do.', animation: 'doorway' },
        { speaker: MARVELLO, text: "Come on the tour. Work the trapdoor. I'll pay you double what you make here.", animation: 'doorway' },
        {
          id: 'the_favor',
          prompt: "He's standing in your doorway with his hat in his hands. What do you tell him?",
          animation: 'doorway',
          facets: ['Cooperation', 'Fairness', 'Stubbornness', 'Competitiveness'],
          choices: [
            { label: "Fine. I'll help. The trick deserves to be done right.", next: 'favor_yes' },
            { label: 'Only if my name goes on the bill beside his.', next: 'favor_terms' },
            { label: 'No. Find somebody else.', next: 'favor_no' },
            { label: "No. I'm taking the Mirror Walk on the road myself.", next: 'favor_rival' },
          ],
        },
      ],
    },

    favor_yes: {
      steps: [
        { text: 'Marvello pumps your hand so hard your hat flies off.', animation: 'doorway_thanks' },
        { speaker: MARVELLO, text: "You're a pal. A real pal!", animation: 'doorway_thanks' },
        { text: 'Forty cities. Every night you pull the lever under the stage, and every night he takes the bow.', animation: 'poster_marvello' },
      ],
      next: 'postcard',
    },

    favor_terms: {
      steps: [
        { speaker: MARVELLO, text: 'Beside me? On the bill?', animation: 'doorway' },
        { text: 'He chews on it for a long time.', animation: 'doorway' },
        { speaker: MARVELLO, text: '...In smaller letters.', animation: 'doorway' },
        { text: 'You shake on smaller letters. Forty cities, with your name under his in print you have to squint at.', animation: 'poster_both' },
      ],
      next: 'postcard',
    },

    favor_no: {
      steps: [
        { speaker: MARVELLO, text: 'Have it your way, kid.', animation: 'doorway' },
        { text: 'The tour goes on without you. In Pittsburgh the mirror sticks, and Marvello is wedged halfway through it for nine minutes.', animation: 'paper_stuck' },
        { text: 'The papers love it.', animation: 'paper_stuck' },
      ],
      next: 'postcard',
    },

    favor_rival: {
      steps: [
        { text: 'He goes pale under his greasepaint.', animation: 'doorway' },
        { text: 'You build your own mirror in a month. A rival circuit books you, and that summer two Mirror Walks tour the country.', animation: 'paper_war' },
        { text: 'The papers call it the Great Mirror War.', animation: 'paper_war' },
      ],
      next: 'postcard',
    },

    // -------------------------------------------------------------------------
    // looking back, on every path
    // -------------------------------------------------------------------------
    postcard: {
      steps: [
        { text: 'A year later, a postcard arrives from Atlantic City. On the back, in big loopy handwriting:', animation: 'postcard' },
        { text: '"No hard feelings, eh? Your pal, the Great M."', animation: 'postcard' },
        {
          id: 'credit',
          prompt: 'Be honest: how much does it matter to you that people know the Mirror Walk was yours? Is it the money, the applause, or something else?',
          animation: 'postcard',
          facets: ['Modesty', 'Competitiveness', 'Fairness'],
        },
        {
          id: 'hard_feelings',
          prompt: 'No hard feelings, he says. Are there? What would it take for you to let this go, or have you already?',
          animation: 'postcard',
          facets: ['Anger', 'Stubbornness', 'Cooperation'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [{ text: 'Somewhere tonight, a magician steps into a mirror, and the whole house holds its breath.', animation: 'the_end' }],
    },
  },
};
