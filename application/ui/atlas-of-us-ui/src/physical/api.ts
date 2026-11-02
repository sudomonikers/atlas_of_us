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
