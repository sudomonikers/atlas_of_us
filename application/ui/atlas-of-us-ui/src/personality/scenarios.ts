import type { PersonalityTrait } from './personality';
import { theBadDay } from './the_bad_day/script';
import { theBigParty } from './the_big_party/script';
import { theCabin } from './the_cabin/script';
import { theCommittee } from './the_committee/script';
import { theDare } from './the_dare/script';
import { theEmergency } from './the_emergency/script';
import { theFestival } from './the_festival/script';
import { theFeud } from './the_feud/script';
import { theFreeWeekend } from './the_free_weekend/script';
import { theHouseguest } from './the_houseguest/script';
import { theNightClass } from './the_night_class/script';
import { theNightMarket } from './the_night_market/script';
import { thePortrait } from './the_portrait/script';
import { thePromotion } from './the_promotion/script';
import { theShoplifter } from './the_shoplifter/script';
import { theStoryGame } from './the_story_game/script';
import { theStranger } from './the_stranger/script';
import { theTimeStudy } from './the_time_study/script';

// Every scenario, as the dashboard lists them and the story that opens Personality shows them.

export type Kind = 'story' | 'interview' | 'live';

export interface ScenarioInfo {
  id: string;
  title: string;
  kinds: Kind[]; //the situation type. Whether it's timed comes from its script's clock
  blurb: string;
  facets: PersonalityTrait[];
}

//a still of each scene's opening, keyed by scenario id
export const THUMBS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./*/thumb.jpg', { eager: true, import: 'default' })).map(([path, url]) => [path.split('/')[1], url]),
);

//every scenario, in play order. Each is written to a set of IPIP-NEO items: which ones,
//and why the order, are in scene_grouping.md
export const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'the_story_game',
    title: 'The Story Game',
    kinds: ['live'],
    blurb: 'A narrator invites you to build a world together, one question at a time.',
    facets: theStoryGame.facets,
  },
  {
    id: 'the_night_class',
    title: 'The Night Class',
    kinds: ['story'],
    blurb: 'An evening class on big questions, a thought experiment, and a lively room.',
    facets: theNightClass.facets,
  },
  {
    id: 'the_big_party',
    title: 'The Big Party',
    kinds: ['story'],
    blurb: "A friend's 40th: two hundred people, a loud band, and you know about four of them.",
    facets: theBigParty.facets,
  },
  {
    id: 'the_time_study',
    title: 'The Time Study',
    kinds: ['interview'],
    blurb: 'A researcher who studies how people spend their days asks about yours.',
    facets: theTimeStudy.facets,
  },
  {
    id: 'the_night_market',
    title: 'The Night Market',
    kinds: ['story'],
    blurb: 'A fable: ten silver coins, a market town at night, and a coach home at dawn.',
    facets: theNightMarket.facets,
  },
  {
    id: 'the_bad_day',
    title: 'The Bad Day',
    kinds: ['story'],
    blurb: 'Traffic, a broken printer, a receptionist who keeps talking. A comedy of small disasters.',
    facets: theBadDay.facets,
  },
  {
    id: 'the_dare',
    title: 'The Dare',
    kinds: ['story'],
    blurb: 'A trip abroad with a friend who chases adrenaline.',
    facets: theDare.facets,
  },
  {
    id: 'the_shoplifter',
    title: 'The Shoplifter',
    kinds: ['story'],
    blurb: 'Your shop says always call the police. Then you catch a teenager stealing.',
    facets: theShoplifter.facets,
  },
  {
    id: 'the_committee',
    title: 'The Committee',
    kinds: ['story'],
    blurb: 'A neighborhood committee is putting on a street festival, and nobody is in charge.',
    facets: theCommittee.facets,
  },
  {
    id: 'the_houseguest',
    title: 'The Houseguest',
    kinds: ['story'],
    blurb: 'A friend of a friend stays for a week: messy, closed off, and going through something.',
    facets: theHouseguest.facets,
  },
  {
    id: 'the_promotion',
    title: 'The Promotion',
    kinds: ['story'],
    blurb: "You and a peer are up for the same promotion, and there are easy ways to tip it.",
    facets: thePromotion.facets,
  },
  {
    id: 'the_festival',
    title: 'The Festival',
    kinds: ['live'],
    blurb: 'A free afternoon at a city arts festival, and a map of everything on.',
    facets: theFestival.facets,
  },
  {
    id: 'the_free_weekend',
    title: 'The Free Weekend',
    kinds: ['story'],
    blurb: "Nothing booked but a promise to help a friend move. Then a much better invitation arrives.",
    facets: theFreeWeekend.facets,
  },
  {
    id: 'the_stranger',
    title: 'The Stranger',
    kinds: ['story'],
    blurb: 'A man stops you in the street. His wallet was stolen, and he needs bus fare home.',
    facets: theStranger.facets,
  },
  {
    id: 'the_emergency',
    title: 'The Emergency',
    kinds: ['live'],
    blurb: "A grease fire breaks out in the kitchen during a dinner you're hosting.",
    facets: theEmergency.facets,
  },
  {
    id: 'the_feud',
    title: 'The Feud',
    kinds: ['story'],
    blurb: 'Your neighbor builds a fence three feet onto your land.',
    facets: theFeud.facets,
  },
  {
    id: 'the_cabin',
    title: 'The Cabin',
    kinds: ['story', 'interview'],
    blurb: "A winter weekend with old friends, a tradition under threat, and a friend who isn't here.",
    facets: theCabin.facets,
  },
  {
    id: 'the_portrait',
    title: 'The Portrait',
    kinds: ['interview'],
    blurb: 'A painter does your portrait, and talks while they work.',
    facets: thePortrait.facets,
  },
];
