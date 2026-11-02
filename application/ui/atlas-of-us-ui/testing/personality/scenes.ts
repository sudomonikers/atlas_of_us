// The scenes the personality tests play, and how a persona's answers walk through one.
import type { Script, Section } from '../../src/personality/personality.tsx';
import type { Answer } from '../personas/persona.ts';
import { theStoryGame } from '../../src/personality/the_story_game/script.ts';
import { theNightClass } from '../../src/personality/the_night_class/script.ts';
import { theBigParty } from '../../src/personality/the_big_party/script.ts';
import { theTimeStudy } from '../../src/personality/the_time_study/script.ts';
import { theNightMarket } from '../../src/personality/the_night_market/script.ts';
import { theBadDay } from '../../src/personality/the_bad_day/script.ts';
import { theDare } from '../../src/personality/the_dare/script.ts';
import { theShoplifter } from '../../src/personality/the_shoplifter/script.ts';
import { theCommittee } from '../../src/personality/the_committee/script.ts';
import { theHouseguest } from '../../src/personality/the_houseguest/script.ts';
import { thePromotion } from '../../src/personality/the_promotion/script.ts';
import { theFestival } from '../../src/personality/the_festival/script.ts';
import { theFreeWeekend } from '../../src/personality/the_free_weekend/script.ts';
import { theStranger } from '../../src/personality/the_stranger/script.ts';
import { theEmergency } from '../../src/personality/the_emergency/script.ts';
import { theFeud } from '../../src/personality/the_feud/script.ts';
import { theCabin } from '../../src/personality/the_cabin/script.ts';
import { thePortrait } from '../../src/personality/the_portrait/script.ts';

//every scene, in play order, keyed by its id
export const SCENES: Record<string, Script> = {
  the_story_game: theStoryGame,
  the_night_class: theNightClass,
  the_big_party: theBigParty,
  the_time_study: theTimeStudy,
  the_night_market: theNightMarket,
  the_bad_day: theBadDay,
  the_dare: theDare,
  the_shoplifter: theShoplifter,
  the_committee: theCommittee,
  the_houseguest: theHouseguest,
  the_promotion: thePromotion,
  the_festival: theFestival,
  the_free_weekend: theFreeWeekend,
  the_stranger: theStranger,
  the_emergency: theEmergency,
  the_feud: theFeud,
  the_cabin: theCabin,
  the_portrait: thePortrait,
};

//one step on a persona's path through a scene
export interface Walked {
  text: string; //what the player shows for the step
  key?: string; //the prompt's id, on a prompt
  choice?: string; //the label of the choice the persona picks
  answer?: string; //the persona's typed answer, or its reasoning for a choice
  left?: number; //the clock's seconds remaining when the answer is given
  ranOut?: boolean; //runs the clock out straight after the answer
  starts?: boolean; //moving on from this step starts the clock
  stops?: boolean; //moving on from this step stops the clock
}

type Position = { section: string; index: number };

//walks one scene the way the ui's ScriptPlayer does, yielding every step on the persona's path. Throws where the
//persona's answers can't be played: a prompt on its path with no answer, or a clock run out where none is running
export function* walk(name: string, script: Script, mine: Record<string, Answer>): Generator<Walked> {
  let pos: Position | undefined = { section: script.start, index: 0 };
  let started = false;
  let stopped = false;
  while (pos) {
    const sec: Section = script.sections[pos.section];
    const step = sec.steps[pos.index];
    const out: Walked = { text: 'prompt' in step ? step.prompt : step.text };
    let next: Position | undefined;
    if ('prompt' in step) {
      const a = mine[step.id];
      if (a === undefined) throw new Error(`${name}: no answer for ${step.id}`);
      const picked = typeof a === 'string' ? undefined : a;
      Object.assign(out, { key: step.id, choice: step.choices?.[picked?.choice ?? -1]?.label, answer: picked ? picked.text : a, left: picked?.left, ranOut: picked?.ran_out });
      if (step.choices) {
        if (!picked || !step.choices[picked.choice]) throw new Error(`${name}: ${step.id} needs one of its ${step.choices.length} choices`);
        next = { section: step.choices[picked.choice].next, index: 0 };
      }
    }
    if (!next && pos.index + 1 < sec.steps.length) next = { ...pos, index: pos.index + 1 };
    else if (!next) next = sec.next ? { section: sec.next, index: 0 } : undefined;
    if (script.clock && next) {
      out.starts = !started && next.section === script.clock.from;
      out.stops = started && !stopped && next.section === script.clock.until;
      if (out.ranOut && !(started && !stopped && !out.stops)) throw new Error(`${name}: ${out.key} runs the clock out, but the clock isn't running after it`);
      started ||= out.starts;
      stopped ||= out.stops || !!out.ranOut;
    }
    yield out;
    pos = out.ranOut ? { section: script.clock!.late, index: 0 } : next;
  }
}
