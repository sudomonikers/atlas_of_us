import { request } from '../auth/api';

export type NormSex = 'male' | 'female';
export type Better = 'higher' | 'lower' | 'neither';

//how measurements are grouped on the page, in order
export const GROUPS = [
  { id: 'Body', label: 'Body size' },
  { id: 'Vitals', label: 'Vitals' },
  { id: 'Fitness', label: 'Strength and fitness' },
  { id: 'Senses', label: 'Senses' },
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

//a body function or structure
export interface BodyPart {
  id: string;
  name: string;
  group: string; //the group it's under, such as "Mental functions"
  subgroup: string | null; //the group under that, where there is one
  parent: string | null; //the id of the one it's part of
  description: string | null;
  includes: string[];
  excludes: string[];
  abilities: string[]; //the abilities it underlies
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

//one of the user's impairments
export interface Impairment {
  id: string; //the function or structure it's in
  extent: Extent;
  change: Change | null; //how a structure has changed
}

export interface Impairments {
  functions: BodyPart[];
  structures: BodyPart[];
  impairments: Impairment[];
}

//how much a function or structure is impaired
export const EXTENTS: { value: Extent; label: string; detail: string }[] = [
  { value: 'mild', label: 'Mild', detail: 'slight, low: 5 to 24%' },
  { value: 'moderate', label: 'Moderate', detail: 'medium, fair: 25 to 49%' },
  { value: 'severe', label: 'Severe', detail: 'high, extreme: 50 to 95%' },
  { value: 'complete', label: 'Complete', detail: 'total: 96 to 100%' },
];

//how a structure has changed
export const CHANGES: { value: Change; label: string }[] = [
  { value: 'total_absence', label: 'Total absence' },
  { value: 'partial_absence', label: 'Partial absence' },
  { value: 'additional_part', label: 'Additional part' },
  { value: 'aberrant_dimensions', label: 'Aberrant dimensions' },
  { value: 'discontinuity', label: 'Discontinuity' },
  { value: 'deviating_position', label: 'Deviating position' },
  { value: 'qualitative_change', label: 'Qualitative changes in structure, including accumulation of fluid' },
];

//every body function and structure, with the logged in user's impairments
export const getImpairments = () => request<Impairments>('GET', '/physical/impairments');

//notes or changes an impairment. change only applies to structures
export const setImpairment = (id: string, extent: Extent, change: Change | null) =>
  request<void>('PUT', `/physical/impairments/${encodeURIComponent(id)}`, { extent, change });

export const clearImpairment = (id: string) => request<void>('DELETE', `/physical/impairments/${encodeURIComponent(id)}`);

//a condition: a disease from Mondo or a feature from HPO, with the body functions and structures it affects
export interface Condition {
  id: string;
  source_id: string; //the ontology's id, such as MONDO:0004979
  source: 'Mondo' | 'HPO';
  name: string; //as the ontology has it, which for Mondo is lower case
  description: string | null;
  synonyms: string[];
  broader: string[]; //the ids of the conditions it's a kind of
  functions: string[];
  structures: string[];
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
