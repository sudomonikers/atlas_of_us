import { request } from '../auth/api';

export type NormSex = 'male' | 'female';
//a test a person takes themselves: at home, following its steps, one the app runs, or one only the camera can watch
export type Test =
  | 'home'
  | 'camera'
  | 'simple_reaction'
  | 'choice_reaction'
  | 'digit_span'
  | 'trail_making'
  | 'eye_chart'
  | 'hearing'
  | 'voices'
  | 'digits_noise'
  | 'sound_shift'
  | 'matrices'
  | 'series'
  | 'rotation'
  | 'paper_folding'
  | 'perspective'
  | 'syllogisms'
  | 'symbols'
  | 'flanker'
  | 'cards'
  | 'broken_words'
  | 'hidden_shapes'
  | 'tapping'
  | 'tracking'
  | 'timing'
  | 'steering'
  | 'track_count'
  | 'near_chart'
  | 'colors'
  | 'side_vision'
  | 'designs'
  | 'problems'
  | 'uses';
export type Better = 'higher' | 'lower' | 'neither';

//how measurements are grouped on the page, in order
export const GROUPS = [
  { id: 'Body', label: 'Body size' },
  { id: 'Vitals', label: 'Vitals' },
  { id: 'Fitness', label: 'Strength and fitness' },
  { id: 'Senses', label: 'Senses' },
  { id: 'Reflexes', label: 'Reflexes and coordination' },
  { id: 'Attention', label: 'Attention, perception and memory' },
  { id: 'Reasoning', label: 'Reasoning and ideas' },
];

//the group of people a reading is compared with
export interface ComparedWith {
  sex: NormSex | 'all';
  age_from: number;
  age_to: number | null; //null on the oldest band
}

//one reading of a measurement, with where it sits among people of the same sex and age when it was taken
export interface Reading {
  id: string;
  value: number;
  measured_on: string; //YYYY-MM-DD
  percentile: number | null; //the share of people, 0 to 100, with a lower value. null when there's no norm for their age
  compared_with: ComparedWith | null;
}

//a measurement, with the user's readings of it, newest first
export interface Measurement {
  id: string;
  name: string;
  unit: string;
  better: Better;
  group: string;
  description: string;
  min: number; //the lowest and highest readings the api takes
  max: number;
  abilities: string[]; //the abilities it shows
  parts: string[]; //the ids of the body parts it's a reading of
  test: Test | null; //how a person takes it themselves, at home or in the app
  timer: number | null; //for a home test of how many in a set time, the seconds to count down
  protocol: string[]; //the steps of a home test
  source: string | null; //where its norms come from
  atlas_norms: boolean; //whether it's compared with Atlas users rather than published norms
  confidence: number; //how much a reading says about the abilities it shows, 0 to 1
  ages: { from: number; to: number | null } | null; //the ages it has norms for
  readings: Reading[];
}

export interface Measurements {
  measurements: Measurement[];
}

//every measurement, with the logged in user's readings
export const getMeasurements = () => request<Measurements>('GET', '/physical/measurements');

//a reading just recorded, with where the user now stands on every ability, since it may show one
export interface Recorded {
  reading: Reading;
  abilities: Ability[];
}

//records a reading, returning it with its percentile and the user's abilities
export const addReading = (id: string, value: number, measuredOn: string) =>
  request<Recorded>('POST', `/physical/measurements/${encodeURIComponent(id)}/readings`, { value, measured_on: measuredOn });

//has the api score typed answers, for a test such as Brick Uses, and record the score as a reading. Returns the
//reading, the answers that counted and the user's abilities
export const scoreAnswers = (id: string, answers: string[], measuredOn: string) =>
  request<Recorded & { counted: string[] }>('POST', `/physical/measurements/${encodeURIComponent(id)}/answers`, { answers, measured_on: measuredOn });

//removes a reading, returning the user's abilities
export const deleteReading = (id: string) => request<Ability[]>('DELETE', `/physical/readings/${encodeURIComponent(id)}`);

//a fact about the user's body that's one of a few choices, such as which hand they use, with their answer
export interface Characteristic {
  id: string;
  name: string;
  question: string; //what Atlas asks
  choices: string[];
  value: string | null; //one of the choices, or null when they haven't said
}

//the user's own physical attributes that are set rather than recorded as readings
export interface Me {
  characteristics: Characteristic[]; //in the order they're asked
}

export const getMe = () => request<Me>('GET', '/physical/me');

//the characteristics to change, by id, each to one of its choices or to null to take the answer back. The rest stay
//as they are
export interface MeChange {
  characteristics: Record<string, string | null>;
}

//changes the user's characteristics. Returns them, and the user's abilities when their sex changed, since who they're
//compared with moves every percentile
export const setMe = (change: MeChange) => request<{ me: Me; abilities: Ability[] | null }>('PUT', '/physical/me', change);

//the hand the user uses most, left or right, when they've said it's one of them
export const handOf = (me: Me) => {
  const said = me.characteristics.find((c) => c.name === 'Handedness')?.value;
  return said === 'Left' || said === 'Right' ? said.toLowerCase() : null;
};

//words about a stronger and weaker hand or arm, with the user's own hands named when they're known
export const inYourHands = (text: string, hand: string | null) => {
  if (!hand) return text;
  const other = hand === 'left' ? 'right' : 'left';
  return text.replace(/\b(your|the) stronger (hand|arm)\b/g, (_, w, part) => `${w} ${hand} ${part}`).replace(/\b(your|the) weaker (hand|arm)\b/g, (_, w, part) => `${w} ${other} ${part}`);
};

//who a reading was compared with, such as "women aged 30 to 39"
export function comparedWith(c: ComparedWith) {
  const who = { male: 'men', female: 'women', all: 'people' }[c.sex];
  return c.age_to === null ? `${who} aged ${c.age_from} and over` : `${who} aged ${c.age_from} to ${c.age_to}`;
}

//how many people a share is, said as so many in 100 rather than a percentage so it doesn't read like the reading itself,
//which can be a percentage
const inHundred = (share: number) => (share < 1 ? 'hardly any' : share > 99 ? 'nearly all' : `about ${Math.round(share)} in 100`);

//where a reading sits among who it's compared with, in a sentence. Where one way is better it says how many people it
//beats, and where neither is, such as height or body fat, how far from typical it is
export function standing(percentile: number, better: Better, c: ComparedWith) {
  const who = comparedWith(c);
  if (better !== 'neither') return `Better than ${inHundred(better === 'lower' ? 100 - percentile : percentile)} ${who}.`;
  const band = percentile < 20 ? 'Well below typical' : percentile < 40 ? 'Below typical' : percentile <= 60 ? 'About typical' : percentile <= 80 ? 'Above typical' : 'Well above typical';
  return `${band} for ${who}, where ${inHundred(percentile)} measure lower than you.`;
}

//where a reading sits, in a few words, for a list of earlier readings
export function standingBriefly(percentile: number, better: Better) {
  return `better than ${inHundred(better === 'lower' ? 100 - percentile : percentile)}`;
}

//a value with its unit, such as "48.1 kg" or "20/25"
export function withUnit(value: number, unit: string) {
  const v = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (unit === '20/x') return `20/${v}`;
  if (unit === '%') return `${v}%`;
  //one of a counted thing, such as 1 mistake or 1 touch
  const one = value === 1 && /^[a-z-]{3,}s$/.test(unit) ? unit.replace(/(ch|sh|x)es$/, '$1').replace(/s$/, '') : unit;
  return `${v} ${one}`;
}

//where the soles of the feet sit on the ruler of the sit and reach box its norms were measured on, so a reach that stops
//short of the toes is still above 0. People are asked how far past or short of their toes they reached, and the
//reading is kept on the box's scale
export const TOES = 26;
export const fromToes = (name: string) => name === 'Sit and Reach';

//a reading as the user would say it: with its unit, or for sit and reach, how far past or short of their toes
export function shownReading(value: number, m: { name: string; unit: string }) {
  if (!fromToes(m.name)) return withUnit(value, m.unit);
  const past = Math.round((value - TOES) * 10) / 10;
  return past === 0 ? 'Right at your toes' : `${withUnit(Math.abs(past), 'cm')} ${past > 0 ? 'past' : 'short of'} your toes`;
}

//today, as YYYY-MM-DD in the user's own time zone
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

//what a person's place on an ability comes from: a measurement, with where their reading sits (0 to 100, higher
//better), or an impairment in what it rests on, noted beside it
export interface Basis {
  kind: 'measurement' | 'impairment';
  name: string;
  standing: number | null;
  extent: Extent | null;
}

//a measurement that shows an ability, and whether the user has a reading of it that counts
export interface Shows {
  id: string;
  name: string;
  test: Test | null;
  counted: boolean;
}

//an ability from O*NET, with where the user stands on it, if anything says
//a tip on working on an ability: what to do, or how to work on it around an impairment in what it rests on
export interface Tip {
  kind: 'practice' | 'impairment';
  text: string;
}

export interface Ability {
  id: string;
  name: string;
  category: 'Cognitive' | 'Psychomotor' | 'Physical' | 'Sensory';
  group: string;
  description: string;
  practice: 'a lot' | 'some' | 'little' | null; //how much practice changes it
  tips: Tip[];
  value: number | null; //0 to 1, with 0.5 typical
  confidence: number | null;
  basis: Basis[];
  measurements: Shows[];
  parts: string[]; //the ids of the body parts it rests on
}

//whether an ability has had a test taken that can't place it yet, because there aren't enough people like the user to
//compare the reading with
export const waitingToCompare = (a: Ability, measurements: Measurements) =>
  a.value === null && a.measurements.some((s) => measurements.measurements.find((m) => m.id === s.id)?.readings.length);

//how abilities are grouped on the page, in order
export const CATEGORIES: { id: Ability['category']; label: string }[] = [
  { id: 'Physical', label: 'Body' },
  { id: 'Psychomotor', label: 'Coordination and speed' },
  { id: 'Sensory', label: 'Senses' },
  { id: 'Cognitive', label: 'Mind' },
];

//every ability, with where the user stands on each, worked out again from what they've recorded
export const getAbilities = () => request<Ability[]>('GET', '/physical/abilities');

//one of the user's conditions or impairments, as it can affect an ability
export interface ConditionOn {
  id: string;
  name: string;
  severity: string | null;
}
export interface ImpairmentOn {
  id: string; //the function or part it's in
  name: string;
  extent: Extent;
}

//an ability, with the user's conditions and impairments in the body functions and parts it rests on
export interface AffectedBy {
  id: string;
  name: string;
  conditions: ConditionOn[];
  impairments: ImpairmentOn[];
}

//the abilities the user's conditions and impairments can affect
export const getAffectedBy = () => request<AffectedBy[]>('GET', '/physical/abilities/affected-by');

//a body function
export interface BodyFunction {
  id: string;
  code: string; //the ICF code, such as b2100
  name: string;
  group: string; //the group it's under, such as "Mental functions"
  subgroup: string | null; //the group under that, where there is one
  parent: string | null; //the id of the one it's part of
  description: string | null;
  includes: string[];
  excludes: string[];
  abilities: string[]; //the abilities it underlies
  parts: string[]; //the ids of the body parts that carry it out, a function within it, or one it's within
  personality: { name: string; opposite: boolean }[]; //the Big Five domains and traits it corresponds to
}

export type Extent = 'mild' | 'moderate' | 'severe' | 'complete';
export type Change =
  | 'total_absence'
  | 'partial_absence'
  | 'additional_part'
  | 'aberrant_dimensions'
  | 'discontinuity'
  | 'deviating_position'
  | 'qualitative_change';

//one of the user's impairments, in a body function or a body part
export interface Impairment {
  id: string; //the function or part it's in
  extent: Extent;
  change: Change | null; //how a part has changed
}

export interface Impairments {
  functions: BodyFunction[];
  impairments: Impairment[];
}

//how much a function or part is impaired
export const EXTENTS: { value: Extent; label: string; detail: string }[] = [
  { value: 'mild', label: 'Mild', detail: 'slight, low: 5 to 24%' },
  { value: 'moderate', label: 'Moderate', detail: 'medium, fair: 25 to 49%' },
  { value: 'severe', label: 'Severe', detail: 'high, extreme: 50 to 95%' },
  { value: 'complete', label: 'Complete', detail: 'total: 96 to 100%' },
];

//how a part has changed
export const CHANGES: { value: Change; label: string }[] = [
  { value: 'total_absence', label: 'Total absence' },
  { value: 'partial_absence', label: 'Partial absence' },
  { value: 'additional_part', label: 'Additional part' },
  { value: 'aberrant_dimensions', label: 'Aberrant dimensions' },
  { value: 'discontinuity', label: 'Discontinuity' },
  { value: 'deviating_position', label: 'Deviating position' },
  { value: 'qualitative_change', label: 'Qualitative changes in structure, including accumulation of fluid' },
];

//every body function, with the logged in user's impairments. The parts come from getAnatomy
export const getImpairments = () => request<Impairments>('GET', '/physical/impairments');

//notes or changes an impairment. change only applies to parts. Returns the user's abilities, which note it
export const setImpairment = (id: string, extent: Extent, change: Change | null) =>
  request<Ability[]>('PUT', `/physical/impairments/${encodeURIComponent(id)}`, { extent, change });

//removes an impairment, returning the user's abilities
export const clearImpairment = (id: string) => request<Ability[]>('DELETE', `/physical/impairments/${encodeURIComponent(id)}`);

//a condition: a disease from Mondo or a feature from HPO, with the body functions and parts it affects
export interface Condition {
  id: string;
  source_id: string; //the ontology's id, such as MONDO:0004979
  source: 'Mondo' | 'HPO';
  name: string; //as the ontology has it, which for Mondo is lower case
  description: string | null;
  synonyms: string[];
  everyday: string[]; //the everyday names and abbreviations people search for it by
  plain_name: string | null; //the everyday name it shows by on the checklist, for the common ones
  checklist: string | null; //the checklist group it's offered in, such as Seeing
  checklist_order: number | null; //its place among all the checklist's conditions
  pending: boolean; //whether it was just added and what it affects is still being worked out
  broader: string[]; //the ids of the conditions it's a kind of
  functions: Affected[];
  parts: PartRef[];
}

//a condition as people know it: its everyday name, or its own
export const conditionName = (c: Condition) => c.plain_name ?? capitalized(c.name);

//a body function a condition affects
export interface Affected {
  code: string;
  name: string;
}

export type Severity = 'mild' | 'moderate' | 'severe';

//one of the logged in user's conditions
export interface MyCondition {
  id: string; //the condition
  severity: Severity | null;
  diagnosed: boolean;
  managed: boolean;
}

export interface Conditions {
  conditions: Condition[];
  mine: MyCondition[];
}

//a term from the ontology search, with the id of the condition it is when we have it
export interface Candidate {
  source_id: string;
  source: 'Mondo' | 'HPO';
  name: string;
  description: string | null;
  id: string | null;
}

export const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

//every condition, with the logged in user's
export const getConditions = () => request<Conditions>('GET', '/physical/conditions');

//what a search finds, best first: our conditions, Mondo and HPO terms not in the Atlas yet when ours are few, and the body
//functions and parts an impairment can be in, each by id
export interface Found {
  conditions: string[];
  outside: Candidate[];
  outside_failed: boolean; //whether Mondo and HPO couldn't be searched
  functions: string[];
  parts: string[];
}

//searches for conditions and impairments, or only the body parts
export const search = (q: string, only?: 'parts') => request<Found>('GET', `/physical/search?q=${encodeURIComponent(q)}${only ? `&only=${only}` : ''}`);

//adds a Mondo or HPO term as a condition, or gives back the one we have
export const addCondition = (sourceId: string) => request<Condition>('POST', '/physical/conditions', { source_id: sourceId });

//notes that the user has a condition, or changes what they've said about it
export const setMyCondition = (id: string, severity: Severity | null, diagnosed: boolean, managed: boolean) =>
  request<void>('PUT', `/physical/conditions/${encodeURIComponent(id)}/mine`, { severity, diagnosed, managed });

export const clearMyCondition = (id: string) => request<void>('DELETE', `/physical/conditions/${encodeURIComponent(id)}/mine`);

//a part of the body, from FMA, as the 3D body and the search need it
export interface PartSummary {
  id: string;
  fma_id: string;
  name: string;
  synonyms: string[];
  wholes: string[]; //the ids of the parts it belongs to
  kinds: string[]; //the ids of the kinds of part it is
  drawn: boolean; //whether the 3D body has a model of it
}

//another part, as a link
export interface PartRef {
  id: string;
  name: string;
}

//every part of the body
export const getAnatomy = () => request<PartSummary[]>('GET', '/physical/anatomy');

//a name to show, with a capital first letter, for the ontologies that have them in lower case
export const capitalized = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

//the four areas abilities fall in, by the key the summary writes about each under
export type Area = Ability['category'];

//the written summary of everything the user has added, by Atlas
export interface PhysicalSummary {
  headline: string;
  overview: string; //two paragraphs, a blank line between them
  areas: { key: Area; text: string }[];
  strengths: string[];
  work_on: string[]; //the trainable gaps most worth working on
  working_around: string[]; //planning around their conditions and impairments, empty when they have none
}

//the user's summary, and where it's at
export interface SummaryState {
  summary: PhysicalSummary | null;
  written_at: string | null;
  stale: boolean; //whether anything it was written from has changed since
  writing: boolean;
  failed: boolean; //whether the last one asked for couldn't be written
  enough: boolean; //whether there's enough to write about yet
}

export const getSummary = () => request<SummaryState>('GET', '/physical/summary');

//asks for the summary to be written, from everything the user has added so far
export const askForSummary = () => request<SummaryState>('POST', '/physical/summary');
