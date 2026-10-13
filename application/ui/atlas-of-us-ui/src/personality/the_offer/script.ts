import type { Script } from '../personality';

// The Offer: The Long Burn
// The player has spent eight safe, settled years as the systems engineer on an orbital station. A ship bound for a new
// settlement on Mars offers them the last berth, leaving in thirty-six hours. The risk is real and stated plainly,
// and so is what they'd give up. Every path shares the last two prompts.

const OKAFOR = 'Commander Okafor';
const TEO = 'Teo';

export const theOffer: Script = {
  id: 'the_offer',
  title: 'The Offer',
  facets: ['Anxiety', 'Excitement-Seeking', 'Adventurousness', 'Self-Efficacy', 'Achievement-Striving', 'Cautiousness'],
  start: 'arrival',
  sections: {
    // -------------------------------------------------------------------------
    // the offer
    // -------------------------------------------------------------------------
    arrival: {
      steps: [
        { text: 'The Offer', animation: 'title_card' },
        { text: 'Four hundred kilometres above North America, Halden Station turns once every forty seconds. You have lived here for eight years.', animation: 'earth_orbit' },
        { text: "You're the station's systems engineer. You know every pump and every rattle on the ring, and nearly everyone aboard knows your name.", animation: 'station_wide' },
        { text: 'Your shift starts the way it always does: a coffee bulb, the status board, and the Earth sliding past the cupola window.', animation: 'cupola' },
        { text: 'Then a priority message comes in. It\'s from the Meridian, the ship docked at the hub.', animation: 'message' },
      ],
      next: 'the_offer',
    },

    the_offer: {
      steps: [
        { speaker: OKAFOR, text: "I'm Adaeze Okafor, commander of the Meridian. I'll be brief, because we leave in thirty-six hours.", animation: 'hologram' },
        { speaker: OKAFOR, text: 'We are taking the first crew to Ares Landing, the new settlement on Mars. Our systems engineer broke her leg in training yesterday. I want you.', animation: 'hologram' },
        { speaker: OKAFOR, text: "It's five years. The work is hard and the pay is good. I won't pretend it's safe: the last supply run lost a lander on the way down.", animation: 'hologram' },
        {
          id: 'first_reaction',
          prompt: 'She waits for your answer. What do you say?',
          animation: 'hologram',
          facets: ['Excitement-Seeking', 'Cautiousness', 'Self-Efficacy'],
          choices: [
            { label: 'When do I leave?', next: 'react_yes' },
            { label: 'Send me everything: the risks, the contract, all of it.', next: 'react_details' },
            { label: "Why me? I'm not sure I'm the right person.", next: 'react_doubt' },
          ],
        },
      ],
    },

    react_yes: {
      steps: [{ speaker: OKAFOR, text: 'I like that. Come and see the ship before you sign anything.', animation: 'hologram' }],
      next: 'aboard',
    },

    react_details: {
      steps: [{ speaker: OKAFOR, text: "Good. It's all in your inbox. Read it, then come and see the ship.", animation: 'hologram' }],
      next: 'aboard',
    },

    react_doubt: {
      steps: [{ speaker: OKAFOR, text: "Because you've kept an old station alive for eight years without losing anyone. Come and see the ship.", animation: 'hologram' }],
      next: 'aboard',
    },

    // -------------------------------------------------------------------------
    // the ship
    // -------------------------------------------------------------------------
    aboard: {
      steps: [
        { text: 'An hour later you pull yourself through the docking hatch at the hub and into the Meridian.', animation: 'meridian_dock' },
        { text: 'She is new, and smells of plastic and solder. Everything is bigger than Halden, and nothing has a scratch on it yet.', animation: 'meridian_dock' },
        {
          id: 'the_tour',
          prompt: 'Okafor has an hour before the next fuel transfer. What do you want to see?',
          animation: 'meridian_dock',
          speaker: OKAFOR,
          facets: ['Excitement-Seeking', 'Adventurousness', 'Cautiousness'],
          choices: [
            { label: 'Suit up and go out on the hull.', next: 'tour_eva' },
            { label: 'The report on the lost lander.', next: 'tour_records' },
            { label: 'The crew. I want to meet the people I would be living with.', next: 'tour_crew' },
          ],
        },
      ],
    },

    tour_eva: {
      steps: [
        { text: 'You clip onto the truss and pull yourself hand over hand toward the engine. Mars is a small red dot past your boots.', animation: 'meridian_hull' },
        { text: 'Up close the engine bell is the size of a house. In thirty-five hours it will light.', animation: 'meridian_hull' },
      ],
      next: 'teo',
    },

    tour_records: {
      steps: [
        { text: 'The report is ninety pages. A seal failed in a landing leg, and the lander tipped over on touchdown. Nobody was aboard.', animation: 'meridian_records' },
        { text: 'The fix has been signed off by three engineers. Your name is not one of them yet.', animation: 'meridian_records' },
      ],
      next: 'teo',
    },

    tour_crew: {
      steps: [
        { text: "Eleven bunks, ten of them taken: a geologist, two doctors, and a farmer from Nairobi who's never been off Earth.", animation: 'meridian_crew' },
        { text: "They're laughing about something when you come in. Someone hands you a coffee bulb as if you've been there for years.", animation: 'meridian_crew' },
      ],
      next: 'teo',
    },

    // -------------------------------------------------------------------------
    // the friend
    // -------------------------------------------------------------------------
    teo: {
      steps: [
        { text: "Back on Halden, Teo is waiting in the cupola. He's run the station for six years, and you've been friends for all of them.", animation: 'cupola_teo' },
        { speaker: TEO, text: "I heard. Everyone's heard.", animation: 'cupola_teo' },
        { speaker: TEO, text: "I'm stepping down at the end of the year. I was going to put you forward to run Halden. I still want to.", animation: 'cupola_teo' },
        { speaker: TEO, text: "I won't tell you not to go. But I'd like you to stay.", animation: 'cupola_teo' },
        {
          id: 'what_worries',
          prompt: 'What worries you most about going?',
          animation: 'cupola_teo',
          facets: ['Anxiety', 'Cautiousness'],
        },
        { speaker: TEO, text: "And the work itself? Mars isn't Halden. If something breaks out there, there's nobody to call.", animation: 'cupola_teo' },
        {
          id: 'can_you',
          prompt: 'Could you handle it?',
          animation: 'cupola_teo',
          facets: ['Self-Efficacy', 'Anxiety'],
          choices: [
            { label: "I've handled worse. I'd manage.", next: 'night_before' },
            { label: 'With enough training, yes.', next: 'night_before' },
            { label: "Honestly, I don't know if I could.", next: 'night_before' },
          ],
        },
      ],
    },

    night_before: {
      steps: [
        { text: 'The station goes quiet for the night. You float alone in the cupola. Out at the hub, the Meridian\'s lights blink on and off.', animation: 'night_window' },
        { text: 'Okafor needs an answer by the morning shift.', animation: 'night_window' },
        {
          id: 'the_decision',
          prompt: 'What do you tell her?',
          animation: 'night_window',
          facets: ['Adventurousness', 'Achievement-Striving', 'Cautiousness', 'Excitement-Seeking'],
          choices: [
            { label: "I'm going.", next: 'go' },
            { label: "I'm staying on Halden.", next: 'stay' },
            { label: 'Not this time. Hold me a place on the next ship.', next: 'next_ship' },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // the endings
    // -------------------------------------------------------------------------
    go: {
      steps: [
        { text: 'At six the next morning the Meridian lets go of Halden. Through a porthole you watch the ring slide away. Teo is at the cupola window, waving.', animation: 'undock' },
        { text: 'The engine lights. For eleven minutes you are pressed into your couch, heavier than you have been in eight years.', animation: 'burn' },
        { text: 'By the second week, you can hide the Earth behind your thumb.', animation: 'earth_small' },
        { text: 'Seven months later, Mars fills the window.', animation: 'mars_approach' },
        { text: 'Below you, on the night side, the lights of Ares Landing are waiting.', animation: 'ares_landing' },
      ],
      next: 'reflect',
    },

    stay: {
      steps: [
        { text: 'At six the next morning you watch the Meridian let go of the hub. Okafor found another engineer overnight.', animation: 'watch_burn' },
        { text: 'The engine lights: a white star crawling across the black.', animation: 'watch_burn' },
        { text: "By the end of your shift it's just one more point of light. Teo floats in beside you and doesn't say anything.", animation: 'meridian_star' },
        { text: 'In December you take over Halden Station.', animation: 'cupola_after' },
      ],
      next: 'reflect',
    },

    next_ship: {
      steps: [
        { speaker: OKAFOR, text: "Two years, then. I can't promise you the berth, but your name goes at the top of the list.", animation: 'hologram' },
        { text: 'At six the next morning you watch the Meridian let go of the hub. The engine lights: a white star crawling across the black.', animation: 'watch_burn' },
        { text: "By the end of your shift it's just one more point of light. Two years is a long time.", animation: 'meridian_star' },
      ],
      next: 'reflect',
    },

    // -------------------------------------------------------------------------
    // looking back, on every path
    // -------------------------------------------------------------------------
    reflect: {
      steps: [
        { text: 'Long afterwards, you still think about those thirty-six hours.', animation: 'reflect' },
        {
          id: 'what_decided',
          prompt: 'What decided it for you?',
          animation: 'reflect',
          facets: ['Anxiety', 'Achievement-Striving', 'Adventurousness'],
        },
        {
          id: 'gone_wrong',
          prompt: "Imagine it's a year later, and the choice you made has gone badly. What went wrong, and what do you do about it?",
          animation: 'reflect',
          facets: ['Anxiety', 'Self-Efficacy', 'Achievement-Striving'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [{ text: 'Four hundred kilometres above North America, Halden Station turns once every forty seconds.', animation: 'closing' }],
    },
  },
};
