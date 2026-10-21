import type { Script } from '../personality';

// The Shoplifter: a corner store, one rule, and a boy with a bottle of Tylenol
// You're on the register at a corner store with a strict "always call the police" rule, and you catch a teenager stealing.
// On Monday the owner wants your view on the rule. On Thursday the boy comes back with his friends to give you grief.
// Written to the IPIP-NEO items in ../scene_grouping.md: believing others have good intentions (A1.2), sticking to the
// rules (A2.2), breaking rules (C3.6), believing laws should be strictly enforced (O6.7), being tough on crime (O6.9),
// helping criminals rather than punishing them (O6.3) and believing in an eye for an eye (A6.7).

const FRANK = 'Frank';
const BOY = 'The boy';

export const theShoplifter: Script = {
  id: 'the_shoplifter',
  title: 'The Shoplifter',
  facets: ['Liberalism', 'Trust', 'Morality', 'Sympathy', 'Dutifulness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the moment
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Shoplifter', animation: 'title_card' },
        { text: "It's a Saturday afternoon in November. You're working the register at Frank's corner store, on your own for the first time.", animation: 'shop' },
        { text: 'Frank has one rule, and it\'s on a sign taped up next to the register. On your first day, he made you read it out loud.', animation: 'sign' },
        { text: 'The bell over the door rings. A boy comes in, fourteen at most, still in his school uniform. He drifts toward the back of the store.', animation: 'teen_in' },
        { text: 'On the little security screen under the counter, you watch him slip a sandwich into his jacket. Then he grabs something from the shelf next to the band-aids.', animation: 'pocket' },
        { text: 'You get to the door before he does. His face goes red, and he puts it all on the counter: a sandwich, and a bottle of children\'s Tylenol.', animation: 'caught' },
        { speaker: BOY, text: "It's for my little sister. She's sick, and my mom is working late. Please. Please don't call anyone.", animation: 'plea' },
        {
          id: 'the_moment',
          prompt: 'What do you do? Pick one, and tell me why. Do you believe him?',
          animation: 'plea',
          facets: ['Trust', 'Morality', 'Dutifulness'],
          choices: [
            { label: "Call the police, like the sign says. Whatever his story, rules are rules.", next: 'call' },
            { label: 'Call Frank, and let him decide. It\'s his store.', next: 'ring_dennis' },
            { label: 'Keep the things, and let him go with a warning.', next: 'warn' },
            { label: 'Let him take the Tylenol. I\'ll pay for it myself.', next: 'pay' },
            { label: 'Something else.', next: 'monday', other: true },
          ],
        },
      ],
    },

    call: {
      steps: [{ text: 'Two officers show up within the hour. The boy sits on a crate by the door while you wait, and doesn\'t look at you once.', animation: 'call' }],
      next: 'monday',
    },

    ring_dennis: {
      steps: [{ text: 'Frank picks up on the sixth ring. "What does the sign say?" he asks, and hangs up.', animation: 'ring_dennis' }],
      next: 'monday',
    },

    warn: {
      steps: [{ text: 'He mumbles that he\'s sorry, and he\'s gone before the door stops swinging.', animation: 'warn' }],
      next: 'monday',
    },

    pay: {
      steps: [{ text: 'You ring up the Tylenol and put your own money in the register. He stares at you for a second, then he\'s gone.', animation: 'pay' }],
      next: 'monday',
    },

    // -------------------------------------------------------------------------
    // the policy, and whether to follow it
    // -------------------------------------------------------------------------
    monday: {
      steps: [
        { text: 'On Monday, Frank watches the security footage from Saturday, twice. Then he puts the coffee on.', animation: 'tape' },
        { speaker: FRANK, text: "You can't be soft with them. Let one of them go and word gets around, and the whole school will be in here. You call the police, the first time, every time, and come down on them hard. It's the only thing they learn from.", animation: 'dennis_talks' },
        { text: 'On the radio, a youth counselor is saying the opposite: that kids who steal need help, not a criminal record. Frank turns it up so he can argue with it.', animation: 'radio' },
        {
          id: 'the_policy',
          prompt: 'What do you say to Frank? Pick the closest, and tell me what you think should really happen to kids like him.',
          animation: 'radio',
          facets: ['Liberalism'],
          choices: [
            { label: "He's right. Come down on them hard, the first time.", next: 'pol_hard' },
            { label: 'Call the police, yes, but they should go easy on kids.', next: 'pol_rule' },
            { label: 'It depends. Some need a fright, some need help.', next: 'pol_depends' },
            { label: 'Kids like him need help, not a criminal record.', next: 'pol_help' },
            { label: 'Something else.', next: 'thursday', other: true },
          ],
        },
      ],
    },

    pol_hard: {
      steps: [{ text: '"Glad someone gets it," says Frank, and sticks the sign back up with fresh tape.', animation: 'pol_hard' }],
      next: 'thursday',
    },

    pol_rule: {
      steps: [{ text: '"Going easy is their job," says Frank, tapping the sign. "Calling them is ours."', animation: 'pol_rule' }],
      next: 'thursday',
    },

    pol_depends: {
      steps: [{ text: '"And who decides which is which?" says Frank. "You? Me?" He doesn\'t wait for an answer.', animation: 'pol_depends' }],
      next: 'thursday',
    },

    pol_help: {
      steps: [{ text: 'Frank snorts into his coffee. "Help," he repeats. But then he goes quiet, and stands looking out the window for a while.', animation: 'pol_help' }],
      next: 'thursday',
    },

    // -------------------------------------------------------------------------
    // the boy's friends come back to taunt you
    // -------------------------------------------------------------------------
    thursday: {
      steps: [
        { text: 'On Thursday, just after school lets out, three boys are standing outside the window, and one of them is him.', animation: 'lads' },
        { text: 'They bang on the glass and hold their phones up to film you. Then one of them kicks over the newspaper rack, and they all crack up laughing.', animation: 'taunt' },
        { text: "One of them has dropped his bus pass by the door. And you've got all three of their faces on the security camera.", animation: 'bus_pass' },
        {
          id: 'the_taunt',
          prompt: 'What do you do? Pick the closest. Tell me how you felt, and what you think they deserve.',
          animation: 'bus_pass',
          facets: ['Sympathy'],
          choices: [
            { label: "Ignore them, and pick up the newspapers. They'll get bored.", next: 'taunt_ignore' },
            { label: 'Go out and talk to him, on his own if I can.', next: 'taunt_talk' },
            { label: 'Report it: the school, the police, whoever will listen.', next: 'taunt_report' },
            { label: 'Post the clip online. Their parents should see what they get up to.', next: 'taunt_back' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    taunt_ignore: {
      steps: [{ text: 'It takes ten minutes. Then they wander off toward the pizza place, still laughing.', animation: 'taunt_ignore' }],
      next: 'the_end',
    },

    taunt_talk: {
      steps: [{ text: 'His friends wander off, but he doesn\'t. "She\'s better now," he says, staring at the sidewalk. "My sister."', animation: 'taunt_talk' }],
      next: 'the_end',
    },

    taunt_report: {
      steps: [{ text: 'The vice principal calls you back on Friday. "We\'ll take care of it," she says. You\'re not sure what that means.', animation: 'taunt_report' }],
      next: 'the_end',
    },

    taunt_back: {
      steps: [{ text: 'By the evening, the clip has two thousand views, and someone has posted his name in the comments.', animation: 'taunt_back' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // saturday again
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: 'It\'s Saturday again. The sign is still up by the register. A girl about his age comes in, and heads for the candy aisle.', animation: 'again' },
        {
          id: 'looking_back',
          prompt: 'Looking back on that week, are you happy with what you did? If it happened tomorrow, would you do anything differently? And what do you think happens to him now?',
          animation: 'again',
          facets: ['Liberalism', 'Trust', 'Morality', 'Sympathy', 'Dutifulness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and the rules in your real life.', animation: 'homework' },
        {
          id: 'last_rule',
          prompt: 'When did you last break a rule, at work, on the road or anywhere else? What was it, and why? And when did you last stick to a rule you thought was wrong?',
          animation: 'homework',
          facets: ['Morality', 'Dutifulness'],
        },
        {
          id: 'last_story',
          prompt: "When someone gives you a hard-luck story, a stranger, a customer or someone at work, what's your first thought: that they're telling the truth, or that they're after something? Tell me about the last time.",
          animation: 'homework',
          facets: ['Trust'],
        },
        {
          id: 'last_wrong',
          prompt: 'Think of the last time someone really wronged you. Did you want them to pay for it, and did you do anything? And when you hear about a crime on the news, what do you think should happen to whoever did it?',
          animation: 'homework',
          facets: ['Sympathy', 'Liberalism'],
        },
        { text: 'The girl brings a chocolate bar up to the register, and pays for it in pennies, counting them out one at a time.', animation: 'goodbye' },
      ],
    },
  },
};
