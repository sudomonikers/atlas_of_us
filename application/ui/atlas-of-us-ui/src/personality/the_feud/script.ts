import type { Script } from '../personality';

// The Feud: three feet of yard
// Your neighbor puts up a new fence while you're away, three feet onto your side, with your plum tree behind it. He won't
// move it, and over the summer it gets worse. Then in November he knocks on your door, needing a favor.
// Written to the IPIP-NEO items in ../scene_grouping.md: standing up for yourself (N4.10), difficult social situations
// (N4.9), not standing confrontation (A4.2), keeping your cool (N2.9), suspecting hidden motives (A1.8), loving a good
// fight (A4.6) and getting back at others (A4.9).

const GRAHAM = 'Graham, next door';
const LORNA = 'Lorna, from across the street';

export const theFeud: Script = {
  id: 'the_feud',
  title: 'The Feud',
  facets: ['Anger', 'Self-Consciousness', 'Trust', 'Cooperation'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the first conversation
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Feud', animation: 'title_card' },
        { text: "It's a Saturday in April. You get home after a week at your mom's place to the sound of hammering.", animation: 'hammering' },
        { text: 'Your neighbor, Graham, has torn down the old fence between your yards and put up a new one. It\'s six feet tall, dark brown, and very solid.', animation: 'new_fence' },
        { text: "But it's a good three feet onto your side of the property line. Your plum tree is on his side of it now.", animation: 'metre' },
        { speaker: GRAHAM, text: "Morning! The old one was rotten. And it was in the wrong place anyway, it always has been. I've looked at the plans.", animation: 'graham_plans' },
        { speaker: GRAHAM, text: "I paid for the whole thing myself, so I'd think carefully before you make this into a big deal. I'm not moving it.", animation: 'graham_push' },
        {
          id: 'the_fence',
          prompt: "He's standing very close, waiting. What do you do? Pick one, tell me what you say, and how it feels standing there.",
          animation: 'graham_push',
          facets: ['Self-Consciousness', 'Cooperation', 'Anger'],
          choices: [
            { label: "Tell him straight: that's my land, and the fence needs to move back.", next: 'fence_straight' },
            { label: "Keep calm. Ask to see his plans, and say I'll check mine.", next: 'fence_calm' },
            { label: "Say it's fine for now. I don't want a fight with the neighbors.", next: 'fence_fine' },
            { label: 'Tell him exactly what I think. He waited until I was away to do this.', next: 'fence_temper' },
            { label: 'Something else.', next: 'the_why', other: true },
          ],
        },
      ],
    },

    fence_straight: {
      steps: [{ text: '"We\'ll see," says Graham. He picks up his hammer and goes back to work, a little louder than before.', animation: 'fence_straight' }],
      next: 'the_why',
    },

    fence_calm: {
      steps: [{ text: '"They\'re up in the attic somewhere," he says. "I\'ll dig them out." He never does.', animation: 'fence_calm' }],
      next: 'the_why',
    },

    fence_fine: {
      steps: [{ text: '"I knew you\'d be reasonable," he says, and gives the fence a pat.', animation: 'fence_fine' }],
      next: 'the_why',
    },

    fence_temper: {
      steps: [{ text: 'Your voice carries. Two yards down, someone stops mowing their lawn. Graham folds his arms. "Are you finished?"', animation: 'fence_temper' }],
      next: 'the_why',
    },

    // -------------------------------------------------------------------------
    // why did he do it?
    // -------------------------------------------------------------------------
    the_why: {
      steps: [
        { text: 'On Monday, you dig out the survey that came with your house. It\'s from 1962, and the boundary line is drawn so thick that, at that scale, it\'s about three feet wide.', animation: 'deeds' },
        { text: 'Lorna, from across the street, stops you by the mailboxes.', animation: 'pat' },
        { speaker: LORNA, text: "He's applied for a building permit, you know. He wants to put a kitchen addition on the back. Mind you, that old fence was leaning your way for years.", animation: 'pat_says' },
        {
          id: 'the_why',
          prompt: 'Why do you think Graham moved the fence? Pick the closest, and tell me why.',
          animation: 'pat_says',
          facets: ['Trust'],
          choices: [
            { label: "He honestly thinks the line's there. Old plans are vague.", next: 'why_honest' },
            { label: "He wants the land for his addition, and hoped I wouldn't notice.", next: 'why_extension' },
            { label: "He's testing me, to see if I'll roll over.", next: 'why_trying' },
            { label: "I don't much care why. I just want it settled.", next: 'why_sorted' },
            { label: 'Something else.', next: 'the_war', other: true },
          ],
        },
      ],
    },

    why_honest: {
      steps: [{ text: 'Maybe. The real property line could be anywhere inside that thick black stripe.', animation: 'why_honest' }],
      next: 'the_war',
    },

    why_extension: {
      steps: [{ text: "You look up his permit application online. The drawings stop just short of the old fence line. Or maybe just past it. It's hard to tell.", animation: 'why_extension' }],
      next: 'the_war',
    },

    why_trying: {
      steps: [{ text: '"Could be," says Lorna. "He\'s the same way about parking. Then again, so is everyone on this street."', animation: 'why_trying' }],
      next: 'the_war',
    },

    why_sorted: {
      steps: [{ text: 'Lorna nods. "Life\'s too short." Then, as she heads inside, she adds: "Still. Three feet is three feet."', animation: 'why_sorted' }],
      next: 'the_war',
    },

    // -------------------------------------------------------------------------
    // it escalates
    // -------------------------------------------------------------------------
    the_war: {
      steps: [
        { text: 'You leave a polite letter in his mailbox, along with a copy of your survey.', animation: 'letter' },
        { text: "Two days later, his reply comes back. It's just one line: \"Talk to my lawyer.\"", animation: 'reply' },
        { text: "By June, he's put up a security camera that points straight down into your yard, and his hedge clippings keep landing on your lawn.", animation: 'camera' },
        {
          id: 'the_war',
          prompt: 'What do you do now? Pick one, and tell me why. And be honest: is any part of you enjoying this?',
          animation: 'camera',
          facets: ['Cooperation', 'Anger'],
          choices: [
            { label: 'Get my own lawyer. If he wants a fight, he can have one.', next: 'war_solicitor' },
            { label: 'Knock on his door and suggest a mediator. Neutral ground.', next: 'war_mediate' },
            { label: 'Give him a taste of his own medicine: his clippings go back, and I get a camera too.', next: 'war_back' },
            { label: "Let him have the three feet. It's not worth a war.", next: 'war_let_go' },
            { label: 'Something else.', next: 'the_favour', other: true },
          ],
        },
      ],
    },

    war_solicitor: {
      steps: [{ text: "Your lawyer's first letter costs you $340. His lawyer writes back within the week, and the letters keep coming all summer.", animation: 'war_solicitor' }],
      next: 'the_favour',
    },

    war_mediate: {
      steps: [{ text: 'He hears you out on the doorstep with his arms folded. "I\'ll think about it," he says. It\'s the most he\'s said to you in a month.', animation: 'war_mediate' }],
      next: 'the_favour',
    },

    war_back: {
      steps: [{ text: 'By August, there are two cameras, and a small pile of clippings that keeps going back and forth over the fence.', animation: 'war_back' }],
      next: 'the_favour',
    },

    war_let_go: {
      steps: [{ text: 'You plant a new plum tree a few feet in from the fence. Over the top of it, you can see the old one, heavy with fruit.', animation: 'war_let_go' }],
      next: 'the_favour',
    },

    // -------------------------------------------------------------------------
    // months later, a favour
    // -------------------------------------------------------------------------
    the_favour: {
      steps: [
        { text: "It's November now. It gets dark by five, and one evening someone knocks at your front door.", animation: 'knock' },
        { text: "It's Graham. He looks like he hasn't slept at all.", animation: 'graham_door' },
        { speaker: GRAHAM, text: "My mom had a fall. I've got to drive up to see her tonight, and I don't know how long I'll be gone. I need someone to feed my cat. There's nobody else on the street I can ask.", animation: 'graham_asks' },
        { text: 'On the telephone pole behind him, the public notice for his addition is still up. Neighbors have until Friday to object.', animation: 'notice' },
        {
          id: 'the_favour',
          prompt: "He's holding out his spare key. What do you do? Pick one, and tell me why.",
          animation: 'notice',
          facets: ['Cooperation'],
          choices: [
            { label: 'Take the key. Of course. The fence can wait.', next: 'favour_yes' },
            { label: 'Say yes, but tell him we settle the fence when he gets back.', next: 'favour_deal' },
            { label: "Say sorry, I can't, and close the door.", next: 'favour_no' },
            { label: 'Say no. Then write an objection to his addition before Friday.', next: 'favour_object' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    favour_yes: {
      steps: [{ text: '"Her name is Mabel," he says, handing you the key. "She likes the treats in the blue tin." His hand is shaking.', animation: 'favour_yes' }],
      next: 'the_end',
    },

    favour_deal: {
      steps: [{ text: 'He nods for a long time. "Yeah. That\'s fair. When I\'m back." He hands you the key.', animation: 'favour_deal' }],
      next: 'the_end',
    },

    favour_no: {
      steps: [{ text: "From your front window, you watch him knock on Lorna's door, and then at the house after that.", animation: 'favour_no' }],
      next: 'the_end',
    },

    favour_object: {
      steps: [{ text: 'Your objection ends up two pages long. It mentions the fence twice, and the camera three times.', animation: 'favour_object' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // a year on
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'April comes around again. The fence is still standing right where Graham put it.', animation: 'spring' },
        {
          id: 'looking_back',
          prompt: 'Looking back over the year: who was in the right? Was any of it worth it? And if this happened to you for real, what would you do differently?',
          animation: 'spring',
          facets: ['Cooperation', 'Anger', 'Trust', 'Self-Consciousness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a couple of questions about you, and the people you actually live next to.', animation: 'homework' },
        {
          id: 'last_pushed',
          prompt: "Think of the last time someone pushed you, face to face: a neighbor, a coworker, a stranger, family. What happened, what did you say, and how did you feel, during it and after? If you can't think of one, tell me what you usually do.",
          animation: 'homework',
          facets: ['Self-Consciousness', 'Anger', 'Cooperation'],
        },
        {
          id: 'last_wronged',
          prompt: 'And the last time someone did you wrong: did you get even, have it out, or let it go? In the last month, how many times did you wonder what someone was really after when they did something nice for you?',
          animation: 'homework',
          facets: ['Cooperation', 'Trust'],
        },
        { text: "That September, a jar of plum jam shows up on your doorstep. There's no note.", animation: 'goodbye' },
      ],
    },
  },
};
