import { request } from '../auth/api';

export type NormSex = 'male' | 'female';
//a test a person takes themselves: at home, following its steps, or one the app runs
export type Test =
  | 'home'
  | 'simple_reaction'
  | 'choice_reaction'
  | 'digit_span'
  | 'trail_making'
  | 'eye_chart'
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
  | 'colours'
  | 'side_vision'
  | 'animals'
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
  test: Test | null; //how a person takes it themselves, at home or in the app
  timer: number | null; //for a home test of how many in a set time, the seconds to count down
  protocol: string[]; //the steps of a home test
  source: string | null; //where its norms come from
  ages: { from: number; to: number | null } | null; //the ages it has norms for
  readings: Reading[];
}

export interface Measurements {
  norm_sex: NormSex | null; //null compares them with everyone
  measurements: Measurement[];
}

//every measurement, with the logged in user's readings
export const getMeasurements = () => request<Measurements>('GET', '/physical/measurements');

//records a reading, returning it with its percentile
export const addReading = (id: string, value: number, measuredOn: string) =>
  request<Reading>('POST', `/physical/measurements/${encodeURIComponent(id)}/readings`, { value, measured_on: measuredOn });

//has the api score typed answers, for a test such as Animal Naming, and record the score as a reading. Returns the
//reading and the answers that counted
export const scoreAnswers = (id: string, answers: string[], measuredOn: string) =>
  request<{ reading: Reading; counted: string[] }>('POST', `/physical/measurements/${encodeURIComponent(id)}/answers`, { answers, measured_on: measuredOn });

export const deleteReading = (id: string) => request<void>('DELETE', `/physical/readings/${encodeURIComponent(id)}`);

//the user's own physical attributes, the ones that are set rather than recorded as readings
export interface Me {
  norm_sex: NormSex | null; //the sex whose norms they're compared with. null compares them with everyone
}

//sets the user's own physical attributes. Every field is sent, and replaces what they had
export const setMe = (me: Me) => request<void>('PUT', '/physical/me', me);

//who a reading was compared with, such as "women aged 30 to 39"
export function comparedWith(c: ComparedWith) {
  const who = { male: 'men', female: 'women', all: 'people' }[c.sex];
  return c.age_to === null ? `${who} aged ${c.age_from} and over` : `${who} aged ${c.age_from} to ${c.age_to}`;
}

//where a reading sits, in words, ending before who it's compared with. Where lower is better, such as resting heart
//rate, it says how many people it's better than
export function standing(percentile: number, better: Better) {
  const share = better === 'lower' ? 100 - percentile : percentile;
  const pct = share < 1 ? 'under 1%' : share > 99 ? 'over 99%' : `${Math.round(share)}%`;
  return better === 'lower' ? `Better than ${pct} of` : `Higher than ${pct} of`;
}

//a value with its unit, such as "48.1 kg" or "20/25"
export function withUnit(value: number, unit: string) {
  const v = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (unit === '20/x') return `20/${v}`;
  return unit === '%' ? `${v}%` : `${v} ${unit}`;
}

//today, as YYYY-MM-DD in the user's own time zone
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

//what a person's place on an ability comes from: a measurement, with where their reading sits (0 to 100, higher
//better), their rating of themselves, or an impairment holding it back
export interface Basis {
  kind: 'measurement' | 'rating' | 'impairment';
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
export interface Ability {
  id: string;
  name: string;
  category: 'Cognitive' | 'Psychomotor' | 'Physical' | 'Sensory';
  group: string;
  description: string;
  examples: string[]; //from what takes a little of it to what takes a lot
  value: number | null; //0 to 1, with 0.5 typical
  confidence: number | null;
  basis: Basis[];
  rating: number | null; //the hardest example they say they can do, 1 to 3, or 0 for none
  measurements: Shows[];
}

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

//rates the user on an ability by the hardest of its examples they can do, 1 to 3, or 0 for none of them
export const rateAbility = (id: string, anchor: number) => request<void>('PUT', `/physical/abilities/${encodeURIComponent(id)}/rating`, { anchor });

export const unrateAbility = (id: string) => request<void>('DELETE', `/physical/abilities/${encodeURIComponent(id)}/rating`);

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

//notes or changes an impairment. change only applies to parts
export const setImpairment = (id: string, extent: Extent, change: Change | null) =>
  request<void>('PUT', `/physical/impairments/${encodeURIComponent(id)}`, { extent, change });

export const clearImpairment = (id: string) => request<void>('DELETE', `/physical/impairments/${encodeURIComponent(id)}`);

//a condition: a disease from Mondo or a feature from HPO, with the body functions and parts it affects
export interface Condition {
  id: string;
  source_id: string; //the ontology's id, such as MONDO:0004979
  source: 'Mondo' | 'HPO';
  name: string; //as the ontology has it, which for Mondo is lower case
  description: string | null;
  synonyms: string[];
  broader: string[]; //the ids of the conditions it's a kind of
  functions: Affected[];
  parts: PartRef[];
}

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

//a condition's name to show, with a capital first letter
export const conditionName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

//every condition, with the logged in user's
export const getConditions = () => request<Conditions>('GET', '/physical/conditions');

//the Mondo and HPO terms closest to what was typed, for adding one we don't have
export const lookupConditions = (q: string) => request<Candidate[]>('GET', `/physical/conditions/lookup?q=${encodeURIComponent(q)}`);

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
  drawn: boolean; //whether the 3D body has a model of it
}

//another part, as a link
export interface PartRef {
  id: string;
  name: string;
}

//a function a part carries out, with the abilities it underlies. through names the part that carries it out when it's
//one the part belongs to or is made of
export interface Served {
  id: string;
  name: string;
  description: string | null;
  abilities: string[];
  through: string | null;
}

//a condition that affects a part, a part it belongs to or is made of, or a function it carries out, which through names
export interface Affecting {
  id: string;
  name: string;
  description: string | null;
  through: string | null;
}

//a measurement of a part, of a part it belongs to or is made of, or of a function it carries out
export interface Measuring {
  id: string;
  name: string;
  through: string | null;
}

//one of the user's impairments in a part, a part it belongs to or is made of, or a function it carries out
export interface Impaired {
  id: string; //the function or part it's in
  name: string;
  extent: Extent;
  through: string | null;
}

//a skill with a level that takes an ability a part's functions underlie, and whether the user is on it or has a goal in it
export interface Relying {
  id: string;
  name: string;
  abilities: string[]; //the part's abilities it takes
  yours: boolean;
}

//a topic to learn more about a part in, from the part, a part it belongs to or a part it's made of, which through names
export interface Covering {
  id: string;
  name: string;
  status: string;
  through: string | null;
}

//a part of the body and everything to learn about it
export interface Part {
  id: string;
  fma_id: string;
  name: string;
  definition: string | null;
  synonyms: string[];
  elements: string[]; //the meshes of the 3D body it's drawn with
  wholes: PartRef[]; //the parts it belongs to
  parts: PartRef[]; //the parts it's made of
  kinds: PartRef[]; //the kinds of part it is
  subtypes: PartRef[]; //the more specific kinds of it
  functions: Served[];
  conditions: Affecting[];
  measurements: Measuring[];
  impairments: Impaired[];
  skills: Relying[]; //the user's own first, then the ones that rely on it most
  skills_total: number;
  topics: Covering[]; //its own first, then the ones from the parts it belongs to and is made of
}

//every part of the body
export const getAnatomy = () => request<PartSummary[]>('GET', '/physical/anatomy');

export const getPart = (id: string) => request<Part>('GET', `/physical/anatomy/${encodeURIComponent(id)}`);

//a body part's name to show, with a capital first letter
export const partName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
