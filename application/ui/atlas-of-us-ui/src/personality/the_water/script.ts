import type { Script } from '../personality';

// The Water: Monsoon in Chennai
// The player lives on the first floor of a small building in Velachery. On the fourth night of the rains the street
// floods, and the family from the ground floor comes up the stairs. The night, a run for drinking water that branches,
// an old teacher who won't leave his house, and a fishing boat from the coast; then the mud, and the books drying.

const SELVI = 'Selvi';
const PAATI = 'Kamala Paati';
const FAISAL = 'Faisal';
const RAJAN = 'Rajan sir';
const MUTHU = 'Muthu';

export const theWater: Script = {
  id: 'the_water',
  title: 'The Water',
  facets: ['Vulnerability', 'Anxiety', 'Altruism', 'Cooperation', 'Self-Efficacy', 'Activity Level', 'Optimism', 'Patience', 'Sensory Sensitivity'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the first night
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Water', animation: 'title_card' },
        { text: "It's been raining in Chennai for four days straight.", animation: 'street_rain' },
        { text: 'You live on the first floor of a little two-storey building on Third Cross Street, in Velachery. Selvi, her son Arun and her mother-in-law live on the ground floor below you.', animation: 'street_rain' },
        { text: "At midnight the power goes. By one o'clock, the water's come over the compound wall.", animation: 'street_flood' },
        { text: "There's no wave. The street just quietly turns into a river.", animation: 'street_flood' },
        { text: 'Then someone knocks on your door.', animation: 'landing_knock' },
        { speaker: SELVI, text: "Sorry, sorry. It's inside the house. It's up to Paati's knees.", animation: 'landing_knock' },
        { text: "Arun has his school bag. Kamala Paati is holding a photo of her late husband against her chest. Selvi, for some reason, has the pressure cooker. They're all soaked.", animation: 'landing_knock' },
        {
          id: 'the_knock',
          prompt: "The water's still rising, and the three of them are dripping on your landing. What do you do, and what's going through your head?",
          animation: 'landing_knock',
          facets: ['Anxiety', 'Vulnerability', 'Altruism'],
        },
      ],
      next: 'night',
    },

    night: {
      steps: [
        { text: 'Your flat is one room, a kitchen and a balcony. Tonight there are five of you in it. Faisal from across the landing has come over with a torch and a packet of biscuits.', animation: 'flat_night' },
        { speaker: FAISAL, text: "My phone's on nine percent. There's been no signal since midnight anyway.", animation: 'flat_night' },
        { text: "The gas stove still works. There's a sack of rice, some dal, half a bunch of bananas, and two cans of drinking water.", animation: 'flat_night' },
        { speaker: PAATI, text: 'In 2015 it was four days. Four days!', animation: 'flat_night' },
        {
          id: 'the_night',
          prompt: "Five people, one gas stove, two cans of water, one torch, and no idea how long this will last. How do you get everyone through the night?",
          animation: 'flat_night',
          facets: ['Self-Efficacy', 'Cooperation', 'Activity Level'],
        },
        { text: "Some time after three, Arun falls asleep with his head in his grandmother's lap. The rain hammers on the roof, Faisal snores, the room smells of wet clothes, and somewhere a dog barks and barks.", animation: 'flat_sleep' },
        {
          id: 'the_noise',
          prompt: "Five of you in one room, and the noise doesn't stop. Can you sleep through it? What gets to you most?",
          animation: 'flat_sleep',
          facets: ['Sensory Sensitivity', 'Anxiety'],
        },
      ],
      next: 'morning',
    },

    // -------------------------------------------------------------------------
    // the morning, and the water run
    // -------------------------------------------------------------------------
    morning: {
      steps: [
        { text: "Morning comes in grey. The rain has eased to a drizzle, but the water hasn't gone anywhere. It's up to the ground-floor windows.", animation: 'flood_morning' },
        { text: 'An autorickshaw is in it up to its roof. A plastic chair floats past, slowly turning.', animation: 'flood_morning' },
        { speaker: FAISAL, text: "We're down to one can of water. Kumar's shop on the main road is on higher ground. He might be open.", animation: 'flood_faisal' },
        { speaker: FAISAL, text: "It's chest-deep from here to there, maybe. Someone's got to go.", animation: 'flood_faisal' },
        {
          id: 'who_goes',
          prompt: 'Somebody needs to wade out for drinking water. What do you do?',
          animation: 'flood_faisal',
          facets: ['Activity Level', 'Self-Efficacy', 'Anxiety'],
          choices: [
            { label: 'Go myself.', next: 'go_alone' },
            { label: 'Go with Faisal.', next: 'go_together' },
            { label: 'Stay put and wait for help.', next: 'wait' },
          ],
        },
      ],
    },

    go_alone: {
      steps: [
        { text: "You tie your phone up in a plastic bag and climb down into the water. It's warmer than you expected, and the colour of tea.", animation: 'wade_alone' },
        { text: 'You feel for every step with your foot first. Somewhere under here, the drains are open.', animation: 'wade_alone' },
        { text: "Kumar's shutter is halfway up. He's handing out cans of water to anyone who wades up to him, and he won't take any money.", animation: 'shop' },
        { text: 'On the way back, you hear somebody calling from the house opposite yours.', animation: 'window_rajan' },
      ],
      next: 'rajan',
    },

    go_together: {
      steps: [
        { text: 'You and Faisal climb down into the water together, with a length of washing line tied between you.', animation: 'wade_together' },
        { text: "Halfway there, Faisal steps into a dip and goes under up to his chin. You've got the rope. He comes up spluttering, and laughing.", animation: 'wade_together' },
        { text: "Kumar's shutter is halfway up. He's handing out cans of water to anyone who wades up to him, and he won't take any money.", animation: 'shop' },
        { text: 'On the way back, you hear somebody calling from the house opposite yours.', animation: 'window_rajan' },
      ],
      next: 'rajan',
    },

    wait: {
      steps: [
        { text: "You stay put. Somebody must be coming. At the end of the street a boat goes past, full, and doesn't turn in.", animation: 'flood_morning' },
        { text: 'By noon the last can is empty. Faisal goes on his own, and comes back an hour later with two cans on his shoulders.', animation: 'flood_faisal' },
        { speaker: FAISAL, text: "Someone's calling from Rajan sir's house. I think he's still in there.", animation: 'window_rajan' },
      ],
      next: 'rajan',
    },

    // -------------------------------------------------------------------------
    // Rajan sir, and the boat
    // -------------------------------------------------------------------------
    rajan: {
      steps: [
        { text: 'Rajan sir lives on his own in the single-storey house opposite. He taught maths at the corporation school for thirty-five years. Half the street learned long division from him.', animation: 'window_rajan' },
        { text: "The water's at his window sill. He's standing on his dining table, piling books onto the top shelf.", animation: 'window_rajan' },
        { speaker: RAJAN, text: "I'm fine, I'm fine. Go home.", animation: 'window_rajan' },
        { speaker: RAJAN, text: "Forty-one years I've been in this house. My wife's things are here. I'm not leaving it all to the water.", animation: 'window_rajan' },
        { speaker: SELVI, text: "He won't listen to anybody. He never has.", animation: 'window_rajan' },
        {
          id: 'rajan',
          prompt: "The water's still coming up, and Rajan sir won't leave. What do you do?",
          animation: 'window_rajan',
          facets: ['Altruism', 'Cooperation', 'Anxiety'],
        },
      ],
      next: 'boat',
    },

    boat: {
      steps: [
        { text: 'In the afternoon, a fishing boat comes rowing down Third Cross Street. Two men in lungis with towels tied round their heads.', animation: 'flood_boat' },
        { text: 'They fish out of Kasimedu, on the coast. This morning they put their boat on the back of a lorry and drove across the city to help.', animation: 'flood_boat' },
        { speaker: MUTHU, text: "Room for four this trip. There's a camp at the school. We'll try and come back, but maybe not before dark.", animation: 'flood_boat' },
        { speaker: PAATI, text: "I'm not getting in that thing without you. I don't know these men.", animation: 'flood_boat' },
        { speaker: FAISAL, text: "Don't look at me. I never learned to swim.", animation: 'flood_boat' },
        {
          id: 'the_boat',
          prompt: "Four places for six of you, and the light's going. Paati won't go without you, and the boat might not come back tonight. Who goes, and do you?",
          animation: 'flood_boat',
          facets: ['Altruism', 'Vulnerability', 'Cooperation'],
        },
        { text: 'The boat pulls away, low in the water, and turns the corner.', animation: 'flood_boat_leaving' },
      ],
      next: 'after',
    },

    // -------------------------------------------------------------------------
    // after the water
    // -------------------------------------------------------------------------
    after: {
      steps: [
        { text: 'Wherever you sleep that night, the days after are all the same: no power, no signal, and the water barely moving.', animation: 'flood_morning' },
        {
          id: 'three_days',
          prompt: 'Three days with nothing to do but wait for the water to go down. How do you spend them, and how do you take the waiting?',
          animation: 'flood_morning',
          facets: ['Patience', 'Activity Level'],
        },
        { text: 'On the third day, the water goes down as quietly as it came up.', animation: 'after_mud' },
        { text: 'It leaves a brown line at shoulder height on every wall in the street. Mattresses, fridges and schoolbooks are piled up outside the gates, drying in the sun.', animation: 'after_mud' },
        { text: "Selvi's flat is ruined. She stands in the doorway holding Arun's swollen maths book. She doesn't cry. She starts sweeping.", animation: 'after_mud' },
        {
          id: 'the_mud',
          prompt: "Selvi has lost nearly everything in her flat. Honestly, how do you think the next few months go, for her and for the street?",
          animation: 'after_mud',
          facets: ['Optimism', 'Sympathy'],
        },
        { text: "That evening, Selvi brings a steel tiffin carrier of sambar rice up to your terrace. It's still warm.", animation: 'terrace_tiffin' },
        { text: 'Across the terrace, Rajan sir is laying out his books one at a time to dry, and Arun is turning the pages for him.', animation: 'terrace_books' },
        {
          id: 'your_storm',
          prompt: 'Away from Chennai now. Think of a time when something went badly wrong around you: a real emergency, or a sudden mess. What did you actually do in the first hour, and how did you feel afterwards?',
          animation: 'terrace_books',
          facets: ['Self-Efficacy', 'Vulnerability', 'Activity Level'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { speaker: RAJAN, text: "They'll never lie flat again. Never mind. I've read them all.", animation: 'terrace_books' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
