import { seeded, shuffled } from '../test_kit';

export interface Syllogism {
  premises: string[];
  conclusion: string;
  follows: boolean;
}

//made-up things, one and many, all taking "a"
const WORDS: [string, string][] = [
  ['blicket', 'blickets'], ['dax', 'daxes'], ['wug', 'wugs'], ['fep', 'feps'], ['tove', 'toves'], ['glork', 'glorks'],
  ['zib', 'zibs'], ['marn', 'marns'], ['plink', 'plinks'], ['quob', 'quobs'], ['sneeb', 'sneebs'], ['vorp', 'vorps'],
  ['trell', 'trells'], ['gnarf', 'gnarfs'], ['yint', 'yints'], ['lume', 'lumes'],
];

//forms of argument, with {A} to {D} for many and {a} to {d} for one, and whether the conclusion follows. Tib is a
//made-up name for one thing
const FORMS: [string[], string, boolean][] = [
  [['All {A} are {B}.', 'All {B} are {C}.'], 'All {A} are {C}.', true],
  [['All {A} are {B}.', 'All {C} are {B}.'], 'All {A} are {C}.', false],
  [['No {A} are {B}.', 'All {C} are {A}.'], 'No {C} are {B}.', true],
  [['All {A} are {B}.', 'Some {B} are {C}.'], 'Some {A} are {C}.', false],
  [['All {A} are {B}.', 'Some {C} are {A}.'], 'Some {C} are {B}.', true],
  [['Some {A} are {B}.', 'Some {B} are {C}.'], 'Some {A} are {C}.', false],
  [['If something is a {a}, it is a {b}.', 'Tib is a {a}.'], 'Tib is a {b}.', true],
  [['If something is a {a}, it is a {b}.', 'Tib is a {b}.'], 'Tib is a {a}.', false],
  [['No {A} are {B}.', 'Some {C} are {A}.'], 'Some {C} are not {B}.', true],
  [['No {A} are {B}.', 'No {B} are {C}.'], 'No {A} are {C}.', false],
  [['If something is a {a}, it is a {b}.', 'Tib is not a {b}.'], 'Tib is not a {a}.', true],
  [['If something is a {a}, it is a {b}.', 'Tib is not a {a}.'], 'Tib is not a {b}.', false],
  [['All {A} are {B}.', 'No {C} are {B}.'], 'No {C} are {A}.', true],
  [['All {A} are {B}.', 'No {C} are {A}.'], 'No {C} are {B}.', false],
  [['Tib is a {a} or a {b}.', 'Tib is not a {a}.'], 'Tib is a {b}.', true],
  [['All {A} are {B}.'], 'All {B} are {A}.', false],
  [['Some {A} are not {B}.', 'All {C} are {B}.'], 'Some {A} are not {C}.', true],
  [['Some {A} are not {B}.', 'Some {B} are {C}.'], 'Some {A} are not {C}.', false],
  [['All {A} are {B}.', 'All {B} are {C}.', 'No {C} are {D}.'], 'No {A} are {D}.', true],
  [['All {A} are {B}.', 'All {B} are {C}.', 'Some {C} are {D}.'], 'Some {A} are {D}.', false],
];

const PRACTICE_FORMS: [string[], string, boolean][] = [
  [['All {A} are {B}.', 'Tib is a {a}.'], 'Tib is a {b}.', true],
  [['All {A} are {B}.', 'Tib is a {b}.'], 'Tib is a {a}.', false],
];

function syllogisms(seed: number, forms: [string[], string, boolean][]): Syllogism[] {
  const random = seeded(seed);
  return shuffled(random, forms).map(([premises, conclusion, follows]) => {
    const words = shuffled(random, WORDS);
    const fill = (s: string) => s.replace(/\{([ABCDabcd])\}/g, (_, t: string) => {
      const [one, many] = words['abcd'.indexOf(t.toLowerCase())];
      return t === t.toUpperCase() ? many : one;
    });
    return { premises: premises.map(fill), conclusion: fill(conclusion), follows };
  });
}

export const SYLLOGISM_PRACTICE = syllogisms(11, PRACTICE_FORMS);
export const SYLLOGISM_ITEMS = syllogisms(2026, FORMS);
