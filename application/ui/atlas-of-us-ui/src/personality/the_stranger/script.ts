import type { Script } from '../personality';

// The Stranger: bus fare home
// A wet Wednesday in November, outside the station. A man stops you by the ATM: his wallet was stolen, and he
// needs $4.80 for the bus to his sister's. Then he tells you he's been sleeping rough. Your roommate says he's been
// telling that story for months, and the next week he's still there, on the same step.
// Written to the IPIP-NEO items in ../scene_grouping.md: trusting others (A1.1), trusting what people say (A1.3),
// distrusting people (A1.7), sympathizing with the homeless (A6.1), trying not to think about the needy (A6.8) and being
// concerned about others (A3.4).

const HIM = 'The man';
const DENNIS = 'Dennis';
const LEAH = 'Leah, your roommate';

export const theStranger: Script = {
  id: 'the_stranger',
  title: 'The Stranger',
  facets: ['Trust', 'Altruism', 'Sympathy'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // his story
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Stranger', animation: 'title_card' },
        { text: "It's a Wednesday in November. You come out of the train station just after seven, and it's started to rain.", animation: 'station' },
        { text: "You're walking past the ATM when a man steps out from beside it. He's in his fifties, maybe, wearing a nice coat that's soaked through.", animation: 'man' },
        { speaker: HIM, text: "Sorry, sorry to stop you. Someone stole my wallet on the train. My cards, everything. I just need $4.80 for the bus to my sister's place.", animation: 'ask' },
        { speaker: HIM, text: "I'm not asking for anything else. I'll pay you back, honest. Give me your number and I'll send it to you tomorrow.", animation: 'ask' },
        { text: 'He turns out his coat pockets to show you. There\'s a bus schedule, a lighter, and nothing else.', animation: 'pockets' },
        {
          id: 'the_story',
          prompt: 'What do you do? Pick one. And do you believe him? Tell me why.',
          animation: 'pockets',
          facets: ['Trust'],
          choices: [
            { label: "Give him the $4.80. People don't make that up.", next: 'story_give' },
            { label: 'Walk him to the bus stop, and buy the ticket myself.', next: 'story_ticket' },
            { label: 'Ask him a few questions first.', next: 'story_questions' },
            { label: "Say sorry, I don't have cash, and keep walking.", next: 'story_walk' },
            { label: 'Something else.', next: 'story_other', other: true },
          ],
        },
      ],
    },

    story_other: {
      steps: [{ text: "He listens to you, nodding slowly. Then he goes quiet, and doesn't move from the spot.", animation: 'man' }],
      next: 'sleeping_rough',
    },

    story_give: {
      steps: [{ text: 'He takes the money carefully, as if it might break. "God bless you," he says. But then he doesn\'t move.', animation: 'give' }],
      next: 'sleeping_rough',
    },

    story_ticket: {
      steps: [{ text: 'At the bus stop, you tap your card on the machine and hand him the ticket. He holds it for a long time without saying anything.', animation: 'ticket' }],
      next: 'sleeping_rough',
    },

    story_questions: {
      steps: [{ text: 'You ask where his sister lives, and which bus he needs. He has an answer for everything: Riverside, the 59 bus, from stop K. Then he goes quiet.', animation: 'questions' }],
      next: 'sleeping_rough',
    },

    story_walk: {
      steps: [{ text: 'You\'re three steps past him when he says it, not loudly: "I\'m not lying to you."', animation: 'walk' }],
      next: 'sleeping_rough',
    },

    // -------------------------------------------------------------------------
    // sleeping rough
    // -------------------------------------------------------------------------
    sleeping_rough: {
      steps: [
        { speaker: DENNIS, text: "I'm Dennis. The truth is, I've been sleeping outside since August, in the doorway of the old bank. That's where someone took my wallet last night, while I was asleep.", animation: 'rough' },
        { speaker: DENNIS, text: "My sister says I can stay with her, if I can just get there. That's all it is.", animation: 'rough_sister' },
        { text: 'People walk around the two of you with their hoods up. Someone sighs loudly as they pass.', animation: 'rough_crowd' },
        {
          id: 'the_rough',
          prompt: 'How do you feel, standing there? Pick the closest, and tell me what you say to him.',
          animation: 'rough_crowd',
          facets: ['Sympathy', 'Trust'],
          choices: [
            { label: 'Awful for him. I want to know how he ended up here.', next: 'rough_ask' },
            { label: "Uncomfortable. I'd rather not think about it, and get home.", next: 'rough_leave' },
            { label: 'Get him something hot from the station café, and stay while he eats it.', next: 'rough_food' },
            { label: 'Suspicious. His story keeps changing.', next: 'rough_doubt' },
            { label: 'Something else.', next: 'at_home', other: true },
          ],
        },
      ],
    },

    rough_ask: {
      steps: [{ text: 'He tells you all about it. First he lost his job, then the apartment that went with it, and then it was a lot of nights on friends\' couches. It takes ten minutes. He thanks you for asking.', animation: 'rough_ask' }],
      next: 'at_home',
    },

    rough_leave: {
      steps: [{ text: '"Fair enough," he says. "Have a good night." Before you reach the corner, you hear him stop someone else.', animation: 'rough_leave' }],
      next: 'at_home',
    },

    rough_food: {
      steps: [{ text: 'You buy him a hot sandwich and a coffee. He eats half the sandwich, and wraps the rest in a napkin for later.', animation: 'rough_food' }],
      next: 'at_home',
    },

    rough_doubt: {
      steps: [{ text: '"Believe what you want," he says. He isn\'t angry about it. "It\'s still raining on me either way."', animation: 'rough_doubt' }],
      next: 'at_home',
    },

    // -------------------------------------------------------------------------
    // Leah
    // -------------------------------------------------------------------------
    at_home: {
      steps: [
        { text: 'Back at home, you tell your roommate Leah all about him while the kettle boils.', animation: 'home' },
        { speaker: LEAH, text: "Gray beard, blue coat, by the ATM? He's been doing the wallet thing for months. He asked me back in September.", animation: 'home_leah' },
        { text: "The rain is getting heavier against the window. The forecast says it'll drop to thirty-five degrees tonight.", animation: 'home_rain' },
        {
          id: 'the_doubt',
          prompt: 'What do you make of what Leah said? Pick one, and tell me why.',
          animation: 'home_rain',
          facets: ['Trust', 'Sympathy'],
          choices: [
            { label: 'Doesn\'t change much. Maybe he had his wallet stolen in September too.', next: 'doubt_maybe' },
            { label: 'So it was a line. Lesson learned.', next: 'doubt_line' },
            { label: "Line or not, he's still sleeping in a doorway tonight.", next: 'doubt_doorway' },
            { label: "There's nothing I can do about it. I put the TV on.", next: 'doubt_telly' },
            { label: 'Something else.', next: 'the_again', other: true },
          ],
        },
      ],
    },

    doubt_maybe: {
      steps: [{ text: 'Leah shrugs. "Maybe," she says, and pours the tea.', animation: 'doubt_maybe' }],
      next: 'the_again',
    },

    doubt_line: {
      steps: [{ text: '"It happens to everyone once," says Leah, and pours the tea.', animation: 'doubt_line' }],
      next: 'the_again',
    },

    doubt_doorway: {
      steps: [{ text: 'Leah doesn\'t say anything for a while. Then she says, "Yeah. I know."', animation: 'doubt_doorway' }],
      next: 'the_again',
    },

    doubt_telly: {
      steps: [{ text: "There's a game show on. Leah knows all the answers.", animation: 'doubt_telly' }],
      next: 'the_again',
    },

    // -------------------------------------------------------------------------
    // the same place, days later
    // -------------------------------------------------------------------------
    the_again: {
      steps: [
        { text: "The next Tuesday, you come out of the station at seven again. It's dry tonight, but much colder.", animation: 'again' },
        { text: "He's there by the ATM, wearing the same coat, and he's stopping someone else. You can't hear what he's saying, but you know the words.", animation: 'again_man' },
        { text: "He's coughing, a deep, wet cough. When the other person walks away, he sits down on the step and stays there.", animation: 'again_cough' },
        {
          id: 'the_again',
          prompt: "He hasn't seen you yet. What do you do? Pick one, and tell me why.",
          animation: 'again_cough',
          facets: ['Altruism', 'Trust'],
          choices: [
            { label: 'Go over and ask how he is. And about that cough.', next: 'again_ask' },
            { label: 'Look up the nearest night shelter, then go and tell him.', next: 'again_shelter' },
            { label: "Ask him why he didn't go to his sister's.", next: 'again_sister' },
            { label: "Take the other exit. I've done what I can.", next: 'again_avoid' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    again_ask: {
      steps: [{ text: '"I\'ve been better," says Dennis. He remembers you, and looks surprised that you remember him.', animation: 'again_ask' }],
      next: 'the_end',
    },

    again_shelter: {
      steps: [{ text: 'There\'s one on Mill Road, ten minutes away, with beds opening up at eight. He says he knows the place, and that he might go.', animation: 'again_shelter' }],
      next: 'the_end',
    },

    again_sister: {
      steps: [{ text: '"She changed her mind," he says, and looks at his shoes. "Or I did. It\'s complicated."', animation: 'again_sister' }],
      next: 'the_end',
    },

    again_avoid: {
      steps: [{ text: 'You go out the back way, past the taxi stand. It adds five minutes to your walk home.', animation: 'again_avoid' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // the empty step
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'A few weeks later, the step by the ATM is empty. Nobody you ask knows where he went.', animation: 'empty' },
        {
          id: 'looking_back',
          prompt: 'Do you think he was telling you the truth, that first night? Does it matter? And how do you feel about what you did?',
          animation: 'empty',
          facets: ['Trust', 'Sympathy', 'Altruism'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a couple of questions about you, and the streets you actually walk down.', animation: 'homework' },
        {
          id: 'last_asked',
          prompt: 'Think of the last time a stranger asked you for something: money, directions, a lighter, help. What did they want, what did you do, and what did you make of them?',
          animation: 'homework',
          facets: ['Trust', 'Altruism'],
        },
        {
          id: 'last_passed',
          prompt: "When did you last walk past someone sleeping on the street? What went through your head, and what did you do? And when did you last check in on someone you know who's having a hard time?",
          animation: 'homework',
          facets: ['Sympathy', 'Altruism'],
        },
        { text: 'On the step by the ATM, someone has left a folded blanket.', animation: 'goodbye' },
      ],
    },
  },
};
