// Checks every persona's abilities without playing anything: each characteristic, measurement, impairment and
// condition it names is one the chapters ask about, each reading is one the ui takes and its test can be played to,
// and it has a target for every ability what it enters places, and none for the rest. Run after any change to what the
// chapters ask.
import { expect, test } from '@playwright/test';
import { call, login } from '../harness.ts';
import { personas } from '../personas/index.ts';
import type { Abilities } from '../personas/persona.ts';
import { GAMES } from './games.ts';

interface Measurement {
  name: string;
  test: string | null;
  min: number;
  max: number;
  abilities: string[];
}
interface Known {
  measurements: Measurement[];
  characteristics: { name: string; choices: string[] }[];
  functions: string[];
  parts: string[];
  conditions: string[];
}

//the measurements of the body itself, which the first chapter asks for, and the one that shows an ability but isn't
//asked for, as in src/abilities/tour.ts
const BASICS = ['Height', 'Weight', 'Body Fat', 'Waist Circumference', 'Arm Span', 'Upper Arm Length', 'Upper Leg Length', 'Hand Span', 'Resting Heart Rate', 'Systolic Blood Pressure', 'Diastolic Blood Pressure'];
const UNASKED = ['Grip Strength'];
const TOES = 26;
//the lines of the eye charts, and what's recorded below the top one. The reading chart's smallest lines are too small
//for the test's screen to draw
const CHARTS: Record<string, number[]> = {
  'Visual Acuity': [200, 100, 70, 50, 40, 30, 25, 20, 15, 10, 400],
  'Reading Chart': [200, 100, 70, 50, 40, 30, 25, 400],
};
//what the other tests can be played to, beyond the range the api takes
const PLAYABLE: Record<string, (n: number) => boolean> = {
  'Hearing Threshold': (n) => n === 70 || (n >= -10 && n <= 45),
  'Competing Voices': (n) => Number.isInteger(n) && n >= -19 && n <= 8,
  'Digits in Noise': (n) => Number.isInteger(n) && Math.abs(n % 2) === 1 && n >= -13 && n <= 9,
  'Sound Shift': (n) => n >= 3 && n <= 500,
  'Digit Span': (n) => Number.isInteger(n) && n >= 1 && n <= 14,
  Tapping: (n) => Number.isInteger(n) && n >= 4,
  'Two-Hand Steering': (n) => Number.isInteger(n) && n <= 45,
  'Design Fluency': (n) => Number.isInteger(n) && n <= 125,
  'Distracting Arrows': (n) => n >= 0 && n <= 1500,
  'Reaction Time': (n) => n >= 110 && n <= 1000,
  'Choice Reaction Time': (n) => n >= 150 && n <= 1250,
  Timing: (n) => n >= 0 && n < 1000,
  'Trail Making': (n) => Math.round(n * 10) === n * 10,
};

function problems(p: Abilities, known: Known) {
  const found: string[] = [];
  const asked = known.measurements.filter((m) => BASICS.includes(m.name) || (m.abilities.length && !UNASKED.includes(m.name)));

  for (const [name, choice] of Object.entries(p.characteristics)) {
    const c = known.characteristics.find((x) => x.name === name);
    if (!c) found.push(`no characteristic ${name}`);
    else if (!c.choices.includes(choice)) found.push(`${name} has no choice ${choice}`);
  }

  for (const [name, reading] of Object.entries(p.readings)) {
    const m = asked.find((x) => x.name === name);
    if (!m) {
      found.push(`${name} isn't asked for`);
      continue;
    }
    const value = name === 'Sit and Reach' ? TOES + reading : reading;
    if (value < m.min || value > m.max) found.push(`${name} ${reading} is outside ${m.min} to ${m.max}`);
    if (m.test === 'camera') found.push(`${name} only the camera can take`);
    if (m.test === 'uses') found.push(`${name} is scored by the api, so it takes brick_uses rather than a reading`);
    else if (m.test && m.test !== 'home' && !GAMES[name]) found.push(`${name} has no way to play it`);
    if (CHARTS[name] && !CHARTS[name].includes(reading)) found.push(`${name} 20/${reading} isn't a line it can score`);
    if (PLAYABLE[name] && !PLAYABLE[name](reading)) found.push(`${name} can't be played to ${reading}`);
    if (m.test && m.test !== 'home' && !['Hearing Threshold', 'Odd Color Out', 'Trail Making'].includes(name) && !Number.isInteger(reading))
      found.push(`${name} ${reading} isn't a whole number`);
  }

  for (const i of p.impairments) if (!(i.part ? known.parts : known.functions).includes(i.in)) found.push(`no ${i.part ? 'body part' : 'body function'} ${i.in}`);
  for (const c of p.conditions) if (!known.conditions.includes(c.name)) found.push(`no condition ${c.name}`);

  //the abilities what it enters places: those its readings show, and Originality from Brick Uses
  const placed = new Set([
    ...Object.keys(p.readings).flatMap((name) => known.measurements.find((m) => m.name === name)?.abilities ?? []),
    ...(p.brick_uses?.length ? ['Originality'] : []),
  ]);
  const missing = [...placed].filter((a) => !(a in p.targets));
  const extra = Object.keys(p.targets).filter((a) => !placed.has(a));
  if (missing.length) found.push(`no target for ${missing.join(', ')}`);
  if (extra.length) found.push(`targets for abilities it doesn't place: ${extra.join(', ')}`);
  for (const [a, t] of Object.entries(p.targets)) if (t < 0 || t > 1) found.push(`${a} target ${t} is outside 0 to 1`);
  return found;
}

//what the api has, read as a persona
async function knownTo(token: string): Promise<Known> {
  const [{ measurements }, { characteristics }, { functions }, anatomy, { conditions }] = await Promise.all([
    call<{ measurements: Measurement[] }>('GET', '/abilities/measurements', undefined, token),
    call<{ characteristics: Known['characteristics'] }>('GET', '/abilities/me', undefined, token),
    call<{ functions: { name: string }[] }>('GET', '/abilities/impairments', undefined, token),
    call<{ name: string }[]>('GET', '/abilities/anatomy', undefined, token),
    call<{ conditions: { name: string }[] }>('GET', '/abilities/conditions', undefined, token),
  ]);
  const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    measurements,
    characteristics,
    functions: functions.map((f) => f.name),
    parts: anatomy.map((p) => capitalized(p.name)),
    conditions: conditions.map((c) => c.name),
  };
}

//read once, as the catalog is the same for everyone. The check runs on one worker (see package.json), so it's read once
//in all
let known: Known;
test.beforeAll(async () => {
  known = await knownTo(await login(Object.values(personas).find((p) => p.abilities)!));
});

for (const [file, persona] of Object.entries(personas)) {
  if (!persona.abilities) continue;
  test(file, () => {
    expect(problems(persona.abilities!, known)).toEqual([]);
  });
}
