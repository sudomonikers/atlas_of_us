import type { Script } from '../personality';

// The Rule That Doesn't Fit: The Last Ferry
// The player works the ramp on the last ferry off an island before a storm. The boat is at its licensed limit,
// and a stranger with no ticket and a hospital message asks to be let on. Her story is never confirmed either way.
// the_count is only asked of players who let her on, so the last two prompts are the ones every path shares.

const NESSA = 'Nessa';
const CAPTAIN = 'Captain Rourke';
const DOYLE = 'Mr. Doyle';

export const ruleThatDoesntFit: Script = {
  id: 'rule_that_doesnt_fit',
  title: "The Rule That Doesn't Fit",
  facets: ['Friendliness', 'Liberalism', 'Morality', 'Altruism', 'Sympathy', 'Dutifulness'],
  start: 'arrival',
  sections: {
    // -------------------------------------------------------------------------
    // the count
    // -------------------------------------------------------------------------
    arrival: {
      steps: [
        { text: "The Rule That Doesn't Fit", animation: 'title_card' },
        { text: 'Calder Island, half past nine on a Sunday night in November. The last ferry to the mainland leaves at 9:40.', animation: 'dock_wide' },
        { text: 'After it goes, a storm closes the crossing. Nothing will sail for three days.', animation: 'dock_wide' },
        { text: 'You work the ramp. Your job is the count: one click for every passenger who walks aboard.', animation: 'dock_count' },
        { text: 'The counter reads 120. The Maid of Calder is licensed for 120 people, one for every seat in the life rafts.', animation: 'clicker_120' },
        { speaker: CAPTAIN, text: "That's us full, then. Ramp up at twenty to, not a minute after.", animation: 'radio' },
        { text: 'Last summer a deckhand let two extra on. An inspector was waiting on the far side. The company was fined, and the deckhand was let go. You got his job.', animation: 'dock_wide' },
      ],
      next: 'stranger',
    },

    stranger: {
      steps: [
        { text: "You're reaching for the ramp control when someone comes running down the slip, soaked through.", animation: 'dock_woman' },
        { speaker: NESSA, text: 'Wait! Please, wait. I need to get across tonight.', animation: 'woman_close' },
        { speaker: NESSA, text: "I'm Nessa. The ticket office was shut when I got here. I'll pay whatever it costs.", animation: 'woman_close' },
        {
          id: 'first_response',
          prompt: "She's out of breath and shivering. What do you say first?",
          animation: 'woman_close',
          facets: ['Friendliness', 'Sympathy', 'Dutifulness'],
          choices: [
            { label: "I'm sorry, we're full. There's nothing I can do.", next: 'first_full' },
            { label: "Get under the lamp, out of the rain. What's happened?", next: 'first_listen' },
            { label: "No ticket, no boarding. You'll have to ask at the office.", next: 'first_office' },
          ],
        },
      ],
    },

    first_full: {
      steps: [{ speaker: NESSA, text: "No, you don't understand. Please, just look.", animation: 'woman_close' }],
      next: 'story',
    },

    first_listen: {
      steps: [{ text: 'She steps in under the light. Her hands are shaking too much to unlock her phone at first.', animation: 'ramp_talk' }],
      next: 'story',
    },

    first_office: {
      steps: [{ speaker: NESSA, text: "The office is shut! There's nobody there. There's nobody here at all but you.", animation: 'woman_close' }],
      next: 'story',
    },

    // -------------------------------------------------------------------------
    // her story
    // -------------------------------------------------------------------------
    story: {
      steps: [
        { speaker: NESSA, text: "It's my dad. He's in Mainland General. They rang this afternoon, and then they sent this.", animation: 'phone' },
        { text: 'The message is from a number with no name. "Your father\'s condition has changed. Please come as soon as you can."', animation: 'phone' },
        { speaker: NESSA, text: "I was working on the far side of the island. I came as fast as I could. If I don't get on this boat, it's three days.", animation: 'woman_close' },
        { speaker: NESSA, text: "He might not have three days.", animation: 'woman_close' },
        { text: "You've never seen her before. Calder is small, but not that small. The message could be from anyone. It could also be exactly what she says it is.", animation: 'ramp_talk' },
        {
          id: 'believe',
          prompt: 'Do you believe her? What makes you think so, or not?',
          animation: 'ramp_talk',
          facets: ['Sympathy', 'Morality'],
        },
      ],
      next: 'captain',
    },

    captain: {
      steps: [
        { text: 'You key the radio and tell the captain.', animation: 'radio' },
        { speaker: CAPTAIN, text: "I'm sorry for her. I am. But it's 120, and there's no hundred-and-twenty-first seat in the rafts.", animation: 'radio' },
        { speaker: CAPTAIN, text: "If there's an inspector on the far side and we're over, I lose my licence and you lose your job. That's not me being hard. That's the rule.", animation: 'radio' },
        { speaker: CAPTAIN, text: "You're on the ramp. You make the count. Ramp up in three minutes.", animation: 'radio' },
        { text: "The radio goes quiet. He's left it with you.", animation: 'ramp_talk' },
        {
          id: 'the_rule',
          prompt: "It's 9:37. What do you do?",
          animation: 'ramp_talk',
          facets: ['Morality', 'Dutifulness', 'Liberalism', 'Altruism'],
          choices: [
            { label: 'Let her on. Her father matters more than the rule.', next: 'board' },
            { label: 'Ask the passengers if anyone will give up their place.', next: 'ask_aboard' },
            { label: 'Keep the rule, but do whatever else I can for her.', next: 'refuse_help' },
            { label: "Keep the rule. It isn't mine to break.", next: 'refuse' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // she goes
    // -------------------------------------------------------------------------
    board: {
      steps: [
        { text: 'You wave her up the ramp and press the counter. 121.', animation: 'clicker_121' },
        { text: 'The ramp comes up behind her with a clang.', animation: 'ramp_up_aboard' },
        { speaker: CAPTAIN, text: "Ramp's up. Final count?", animation: 'radio' },
        {
          id: 'the_count',
          prompt: 'The captain is waiting. What do you tell him?',
          animation: 'radio',
          facets: ['Morality', 'Dutifulness'],
          choices: [
            { label: 'The truth. 121, and I let her on.', next: 'count_truth' },
            { label: '120.', next: 'count_lie' },
          ],
        },
      ],
    },

    count_truth: {
      steps: [
        { text: 'The radio is quiet for a long moment.', animation: 'radio' },
        { speaker: CAPTAIN, text: "Right. There's a spare jacket in the wheelhouse locker. Get it on her. We'll talk about this on the far side.", animation: 'radio' },
      ],
      next: 'crossing',
    },

    count_lie: {
      steps: [
        { speaker: CAPTAIN, text: 'Good. Taking her out.', animation: 'radio' },
        { text: 'In your pocket, the counter still says 121.', animation: 'clicker_121' },
      ],
      next: 'crossing',
    },

    ask_aboard: {
      steps: [
        { text: 'You run up the ramp onto the car deck and shout over the rain on the roof: will anyone wait for Thursday\'s boat?', animation: 'deck' },
        { text: 'Faces in car windows. Someone looks at their watch. Nobody moves.', animation: 'deck' },
        { speaker: DOYLE, text: "Ah, go on. I'm only going over for the market. The cabbages will keep.", animation: 'deck_doyle' },
        { text: 'Mr. Doyle, who has lived on Calder for eighty years, climbs down from his van and hands you his ticket.', animation: 'deck_doyle' },
        { text: 'He steps off. She steps on. The counter still reads 120.', animation: 'clicker_120' },
        { text: 'The ramp comes up behind her with a clang.', animation: 'ramp_up_aboard' },
      ],
      next: 'crossing',
    },

    crossing: {
      steps: [
        { text: 'The Maid of Calder pushes out into the swell. Spray hits the lounge windows.', animation: 'crossing' },
        { text: 'Nessa sits by herself with her phone in both hands, waiting for it to light up.', animation: 'crossing' },
        { text: "At the mainland slip she's first off. She runs for the taxi rank without looking back.", animation: 'mainland' },
        { text: 'You never find out what happened at the hospital.', animation: 'mainland' },
      ],
      next: 'reflect',
    },

    // -------------------------------------------------------------------------
    // she stays
    // -------------------------------------------------------------------------
    refuse_help: {
      steps: [
        { text: 'You take off your oilskin and put it around her shoulders.', animation: 'coat' },
        { text: 'You ring Mainland General for her. A tired voice says they can\'t give out information over the phone.', animation: 'phone_call' },
        { text: 'You write down the coastguard\'s number, and the name of a fisherman who might take her across if the wind drops.', animation: 'coat' },
        { speaker: NESSA, text: "Thank you. I know it's not your fault.", animation: 'coat' },
      ],
      next: 'left_behind',
    },

    refuse: {
      steps: [
        { text: "You tell her you're sorry.", animation: 'ramp_talk' },
        { speaker: NESSA, text: 'Sorry.', animation: 'woman_close' },
        { text: "She says it flatly, like she's heard it from everyone today.", animation: 'woman_close' },
      ],
      next: 'left_behind',
    },

    left_behind: {
      steps: [
        { text: 'The ramp comes up. The horn sounds.', animation: 'ramp_up_alone' },
        { text: 'From the stern you watch the slip get smaller: the lamp, the rain, and her under it, not moving.', animation: 'stern_view' },
        { text: 'Three days later the storm blows itself out, and the first boat crosses on a flat grey sea.', animation: 'morning' },
        { text: "You look for her at the ramp. She isn't there. You never find out what happened to her father.", animation: 'morning' },
      ],
      next: 'reflect',
    },

    // -------------------------------------------------------------------------
    // looking back, on every path
    // -------------------------------------------------------------------------
    reflect: {
      steps: [
        { text: 'Weeks later, you still think about that night on the ramp.', animation: 'morning' },
        {
          id: 'the_rule_itself',
          prompt: 'The rule says 120, no exceptions. Is it a good rule? Would you change it?',
          animation: 'morning',
          facets: ['Liberalism', 'Dutifulness', 'Morality'],
        },
        {
          id: 'if_she_lied',
          prompt: "Suppose you found out her story wasn't true. Would that change how you feel about what you did?",
          animation: 'morning',
          facets: ['Sympathy', 'Altruism', 'Morality'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [{ text: 'At 9:40 the next Sunday, the Maid of Calder sounds her horn and pulls away from the slip, right on time.', animation: 'dock_calm' }],
    },
  },
};
