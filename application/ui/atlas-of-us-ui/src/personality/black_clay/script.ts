import type { Script } from '../personality';

// The Black Clay: a big order in San Bartolo Coyotepec
// The player is a potter in Oaxaca, making barro negro the way their grandmother taught them. A shop in Mexico City
// orders forty pieces in three weeks. The long burnishing nights, a cousin with a faster way, a firing that cracks half
// the work, and a phone call that branches; then a recall about the player's own setbacks.

const CHABELA = 'Abuela Chabela';
const BETO = 'Beto';
const MARIANA = 'Mariana';

export const blackClay: Script = {
  id: 'black_clay',
  title: 'The Black Clay',
  facets: ['Perfectionism', 'Patience', 'Resilience', 'Optimism', 'Independence', 'Decisiveness', 'Adaptability'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the order
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Black Clay', animation: 'title_card' },
        { text: 'San Bartolo Coyotepec, half an hour south of Oaxaca City. The church bells ring for seven.', animation: 'village' },
        { text: 'Your family has made barro negro here for four generations. The clay comes out of the hill grey. It goes into the fire grey. It comes out black.', animation: 'courtyard' },
        { text: "The shine isn't a glaze. It's hours of rubbing each pot with a smooth quartz stone, while the clay is still leather-hard.", animation: 'workbench' },
        { text: 'Your grandmother, Chabela, taught you. Her hands are too stiff to burnish now, but she still checks every piece.', animation: 'chabela' },
        { text: 'This morning your phone rings. It\'s Mariana, who runs a design shop in Roma Norte, in Mexico City.', animation: 'phone' },
        { speaker: MARIANA, text: "We open the new shop in three weeks. I want a whole wall of your work. Forty pieces. I'll pay well, and I'll put your name on the wall.", animation: 'phone' },
        { text: 'There are eleven pieces drying on your shelves. Forty in three weeks would mean working most nights, and firing only once.', animation: 'shelves' },
        {
          id: 'the_order',
          prompt: 'Mariana is waiting on the line. What do you tell her?',
          animation: 'phone',
          facets: ['Decisiveness', 'Optimism', 'Perfectionism'],
          choices: [
            { label: 'Yes, all forty.', next: 'order_yes' },
            { label: 'I can do twenty, done properly.', next: 'order_twenty' },
            { label: 'Let me think about it tonight.', next: 'order_think' },
          ],
        },
      ],
    },

    order_yes: {
      steps: [{ speaker: MARIANA, text: "Perfect. Send me photos as you go. I'm already planning the wall.", animation: 'phone' }],
      next: 'work',
    },

    order_twenty: {
      steps: [
        { speaker: MARIANA, text: "Twenty won't fill the wall. Do what you can, and try for forty. I'll take whatever you send.", animation: 'phone' },
      ],
      next: 'work',
    },

    order_think: {
      steps: [
        { text: "That night you count the shelves twice, and work it out on the back of a feed bag. In the morning you call her back and say you'll try.", animation: 'shelves' },
        { speaker: MARIANA, text: "Wonderful. Forty, if you can. I'll take whatever you send.", animation: 'phone' },
      ],
      next: 'work',
    },

    // -------------------------------------------------------------------------
    // the work
    // -------------------------------------------------------------------------
    work: {
      steps: [
        { text: 'You dig clay from the hill, soak it, sieve it, and knead it smooth.', animation: 'workbench' },
        { text: 'You shape each piece on two saucers, one turned upside down on the other, spinning it with one hand. No wheel. That is how it has always been done here.', animation: 'shaping' },
        { text: "Day nine. It's two in the morning, and you're burnishing under the lamp.", animation: 'burnish_night' },
        { text: "The jar in your lap has taken four hours. Turning it to the light, you see a faint ripple near the neck, where the stone skipped. You'd have to sand it back and start that part again.", animation: 'burnish_close' },
        { speaker: CHABELA, text: 'Nobody in Mexico City is going to see that, mi vida. Go to bed.', animation: 'burnish_night' },
        {
          id: 'the_ripple',
          prompt: "It's two in the morning, and it's a flaw almost nobody else would notice. What do you do with the jar?",
          animation: 'burnish_close',
          facets: ['Perfectionism', 'Patience'],
        },
      ],
      next: 'beto',
    },

    beto: {
      steps: [
        { text: 'Day fourteen. Your cousin Beto comes in through the gate. He sells pots to the tourist buses by the highway.', animation: 'beto' },
        { speaker: BETO, text: "Oye, you're never going to make forty like this. Look at you. You haven't slept in a week.", animation: 'beto' },
        { speaker: BETO, text: 'I have moulds, and a gas kiln. I can turn out twenty pots for you in four days, and they come out black and shiny. Spray polish. Nobody in the city knows the difference.', animation: 'beto' },
        { speaker: CHABELA, text: 'I know the difference.', animation: 'beto_chabela' },
        {
          id: 'beto',
          prompt: 'Beto wants to help, his way. What do you say to him?',
          animation: 'beto',
          facets: ['Independence', 'Adaptability', 'Perfectionism'],
        },
      ],
      next: 'firing',
    },

    // -------------------------------------------------------------------------
    // the firing
    // -------------------------------------------------------------------------
    firing: {
      steps: [
        { text: 'Day seventeen. Thirty-two pieces go down into the pit kiln in the yard, packed among broken shards.', animation: 'kiln_load' },
        { text: "At dusk you light it. For eight hours you feed it wood, slowly, so the heat doesn't climb too fast.", animation: 'kiln_fire' },
        { text: 'At the end you seal the top with earth, so no air gets in. Starved of air, the smoke turns the clay black.', animation: 'kiln_sealed' },
        { text: "Now it has to cool. You can't open it before morning, and you can't do anything to help it.", animation: 'kiln_wait' },
        {
          id: 'the_wait',
          prompt: "Three weeks of work is in the ground, and there's nothing left to do but wait until morning. How do you spend the night?",
          animation: 'kiln_wait',
          facets: ['Patience', 'Optimism'],
        },
      ],
      next: 'opening_kiln',
    },

    opening_kiln: {
      steps: [
        { text: 'At first light you dig the earth away. Warm air comes up, smelling of smoke.', animation: 'kiln_open' },
        { text: 'You lift the pieces out one by one and lay them on the mat.', animation: 'kiln_open' },
        { text: 'Fifteen are whole, and black, and they shine.', animation: 'shards' },
        { text: 'Seventeen are cracked or in pieces. The wood was damp, or the clay was still too wet, or both.', animation: 'shards' },
        { text: 'The shop opens in four days.', animation: 'shards' },
        {
          id: 'the_shards',
          prompt: 'Seventeen pieces broken, four days to go. What goes through your head, and what do you do this morning?',
          animation: 'shards',
          facets: ['Resilience', 'Optimism', 'Adaptability'],
        },
      ],
      next: 'the_call',
    },

    the_call: {
      steps: [
        { text: "At noon, Mariana calls to ask how it's going.", animation: 'phone_shards' },
        {
          id: 'the_call',
          prompt: 'Fifteen pieces, and she wants forty. What do you do?',
          animation: 'phone_shards',
          facets: ['Decisiveness', 'Adaptability', 'Independence'],
          choices: [
            { label: 'Tell her the truth, and send the fifteen.', next: 'call_truth' },
            { label: 'Ask her for two more weeks.', next: 'call_time' },
            { label: "Take Beto's offer to make up the numbers.", next: 'call_beto' },
          ],
        },
      ],
    },

    call_truth: {
      steps: [
        { speaker: MARIANA, text: 'Fifteen. Okay. That is not a wall.', animation: 'phone_shards' },
        { speaker: MARIANA, text: "Then it's a shelf. A very good shelf. Send them, and send me the broken ones too. I want to show people what this costs.", animation: 'phone_shards' },
      ],
      next: 'after',
    },

    call_time: {
      steps: [
        { speaker: MARIANA, text: "Two weeks. The opening can't move, but the wall can wait. Send what you have now, and fill it when you're ready.", animation: 'phone_shards' },
      ],
      next: 'after',
    },

    call_beto: {
      steps: [
        { text: "Beto's moulded pots arrive two days later, wrapped in newspaper. They're black, and very shiny.", animation: 'beto' },
        { speaker: CHABELA, text: "They're his pots. Don't put your name on them.", animation: 'beto_chabela' },
      ],
      next: 'after',
    },

    // -------------------------------------------------------------------------
    // after
    // -------------------------------------------------------------------------
    after: {
      steps: [
        { text: 'You pack the pieces in straw, in wooden crates, and the truck takes them up the highway to the city.', animation: 'crates' },
        { text: 'That evening, Chabela sits with you in the yard. She sweeps the broken pieces into a pile with her foot.', animation: 'dusk' },
        { speaker: CHABELA, text: 'My first big firing, I lost all of it. Every piece. I was nineteen.', animation: 'dusk' },
        { speaker: CHABELA, text: 'I cried for a day. Then I went up the hill and dug more clay.', animation: 'dusk' },
        {
          id: 'your_firing',
          prompt: 'Away from Oaxaca now. Think of something you worked hard on that went wrong right at the end. What did you do the next day, and how long did it take you to get going again?',
          animation: 'dusk',
          facets: ['Resilience', 'Patience', 'Optimism'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'The church bells ring for seven. Up on the hill, the clay is waiting.', animation: 'closing' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
