// The tests the app runs, each played the way a player would, to the reading the persona has for it. Each one starts
// once its "Take the test" has been pressed and ends when the test hands its score to the card. Most play with the
// page's clock paused and moved on step by step, so the timed parts take no time; the reaction tests run on the clock
// and answer in the page (see ./play.ts).
import type { Page } from '@playwright/test';
import type { Abilities } from '../personas/persona.ts';
import { button, COUNT_IN, GAME_MS, moved, pause, responder, resume, settled, shows, STEP_MS, wait } from './play.ts';
import { MATRIX_ITEMS, MATRIX_PRACTICE } from '../../src/abilities/matrix_puzzles/items.ts';
import { SERIES_ITEMS, SERIES_PRACTICE } from '../../src/abilities/number_series/items.ts';
import { ROTATION_ITEMS, ROTATION_PRACTICE } from '../../src/abilities/shape_rotation/items.ts';
import { FOLDING_ITEMS, FOLDING_PRACTICE } from '../../src/abilities/paper_folding/items.ts';
import { SYLLOGISM_ITEMS, SYLLOGISM_PRACTICE } from '../../src/abilities/syllogisms/items.ts';
import { BROKEN_WORDS, WORDS_PRACTICE } from '../../src/abilities/broken_words/items.ts';
import { HIDDEN_ITEMS, HIDDEN_PRACTICE } from '../../src/abilities/hidden_shapes/items.ts';
import { PERSPECTIVE_ITEMS, PERSPECTIVE_PRACTICE } from '../../src/abilities/perspective_taking/items.ts';
import { SYMBOL_KEY, SYMBOL_PRACTICE, SYMBOL_RUN } from '../../src/abilities/symbol_matching/items.ts';
import { CARDS, CARDS_PRACTICE, KEY_CARDS, RUN_TO_CHANGE, SORT_RULES, type Card } from '../../src/abilities/card_sorting/items.ts';
import { TIMING_PRACTICE, TIMINGS } from '../../src/abilities/timing/items.ts';
import { LEAD, TRACKING_PATH } from '../../src/abilities/tracking/items.ts';
import { BEEPS, TRACK_COUNT_PATH } from '../../src/abilities/track_and_count/items.ts';
import { COLOR_PRACTICE, COLOR_TRIES } from '../../src/abilities/odd_color_out/items.ts';
import {
  VOICE_DIGITS, VOICE_DOWN, VOICE_FIRST_STEP, VOICE_HIGHEST, VOICE_ITEMS, VOICE_LOWEST, VOICE_PRACTICE, VOICE_ROUNDS, VOICE_START, VOICE_UP,
} from '../../src/abilities/competing_voices/items.ts';
import { NOISE_HIGHEST, NOISE_ITEMS, NOISE_LOWEST, NOISE_PRACTICE, NOISE_ROUNDS, NOISE_START, NOISE_STEP } from '../../src/abilities/digits_in_noise/items.ts';
import {
  SHIFT_EASIER, SHIFT_HARDER, SHIFT_LARGEST, SHIFT_PRACTICE_WAYS, SHIFT_SMALLEST, SHIFT_START, SHIFT_TRIES, SHIFT_WAYS,
} from '../../src/abilities/sound_shift/items.ts';
import { SIDE_PRACTICE } from '../../src/abilities/side_vision/items.ts';
import { ITEMS as PROBLEMS, PRACTICE as PROBLEMS_PRACTICE, W, H, type Scene } from '../../src/abilities/spot_the_problem/scenes.tsx';
import { TIMED } from '../../src/abilities/timed.ts';

//plays one test to a reading, for a persona
type Game = (page: Page, reading: number, persona: Abilities) => Promise<void>;

//how far a test's reading can land from the persona's and still be what it played to: most land on it exactly, and
//those timed in the page or scored on a staircase land near it
export const TOLERANCE: Record<string, number> = {
  'Reaction Time': 10,
  'Choice Reaction Time': 10,
  'Distracting Arrows': 10,
  Timing: 10,
  'Perspective Taking': 2,
  Tracking: 2,
  'Track and Count': 4,
  'Hearing Threshold': 1,
  'Odd Color Out': 0.35, //as a share of the reading, as it settles around it rather than on it
  'Competing Voices': 1,
  'Digits in Noise': 1,
  'Sound Shift': 0.3, //as a share of the reading, like Odd Color Out
};
//the tests whose tolerance is a share of the reading
export const SHARE = ['Odd Color Out', 'Sound Shift'];

//a point in a box on the page, from shares of its width and height
async function within(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} isn't showing`);
  return (x: number, y: number) => [box.x + x * box.width, box.y + y * box.height] as const;
}

// --- Tests of questions with a time limit: some to practice, then the ones that count -----------------------------

//a question, by what answers it: the place of the right choice of so many, or the number or word to type
type Asked = { answer: number; choices?: number; word?: string };

async function give(page: Page, it: Asked, right: boolean) {
  if (it.choices) return button(page, `Choice ${(right ? it.answer : (it.answer + 1) % it.choices) + 1}`).click();
  const box = page.getByRole('textbox', { name: 'Your answer' });
  await box.fill(it.word ? (right ? it.word : 'zzzz') : String(right ? it.answer : it.answer + 1));
  await box.press('Enter');
}

//practices every question right, then gets the first `right` of the ones that count right and the rest wrong, so the
//ones it misses are the hardest
const questions = (practice: Asked[], items: Asked[]): Game => async (page, right) => {
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const [i, it] of practice.entries()) {
    await shows(page, new RegExp(`^Practice ${i + 1} of ${practice.length}`));
    await give(page, it, true);
    await button(page, 'Next').click();
  }
  await button(page, new RegExp(`^Start: ${items.length} in `)).click();
  await wait(page, COUNT_IN);
  for (const [i, it] of items.entries()) {
    await shows(page, new RegExp(`^${i + 1} of ${items.length} ·`));
    await give(page, it, i < right);
  }
  await resume(page);
};

const chosen = (xs: { answer: number; choices: unknown[] }[]): Asked[] => xs.map((x) => ({ answer: x.answer, choices: x.choices.length }));
const syllogisms = (xs: { follows: boolean }[]): Asked[] => xs.map((x) => ({ answer: x.follows ? 0 : 1, choices: 2 }));

// --- Attention -----------------------------------------------------------------------------------------------------

//remembers every list as long as the span and none longer. A list's digits show one a second from 600 ms after it
//starts, and the box to answer in after the last
const digitSpan: Game = async (page, span) => {
  const shown = () => page.evaluate(() => document.querySelector('div[aria-live="off"] > span')?.textContent ?? '');
  await pause(page);
  await button(page, 'Start').click();
  await wait(page, COUNT_IN);
  let length = 5;
  let misses = 0;
  for (let list = 0; list < 10; list++) {
    let digits = '';
    await wait(page, 950);
    for (let i = 0; i < length; i++) {
      if (i) await wait(page, 1000);
      await settled(page);
      const d = await shown();
      if (!/^\d$/.test(d)) throw new Error(`digit ${i + 1} of ${length} didn't show`);
      digits += d;
    }
    await wait(page, 650);
    const right = length <= span;
    const box = page.locator('#digit-span-answer');
    await box.fill(right ? digits : digits.slice(0, -1));
    await box.press('Enter');
    if (right) {
      length = Math.min(length + 1, 14);
      misses = 0;
    } else if (++misses >= 2) {
      length = Math.max(length - 1, 2);
      misses = 0;
    }
  }
  await resume(page);
};

//taps the trail in order, the practice at once and the one that counts spread over the seconds
const trailMaking: Game = async (page, seconds) => {
  const label = (i: number) => (i % 2 ? String.fromCharCode(65 + (i - 1) / 2) : String(i / 2 + 1));
  const tap = (count: number, i: number) => page.locator(`[aria-label="Trail of ${count} circles"]`).getByRole('button', { name: label(i), exact: true }).click();
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (let i = 0; i < 8; i++) await tap(8, i);
  await button(page, 'Start the real one').click();
  await wait(page, COUNT_IN);
  await tap(25, 0);
  for (let i = 1; i < 25; i++) {
    await wait(page, (seconds * 1000 * i) / 24 - (seconds * 1000 * (i - 1)) / 24);
    await tap(25, i);
  }
  await resume(page);
};

//matches the practice, then `right` symbols, then lets the time run out
const symbolMatching: Game = async (page, right) => {
  const symbol = () => page.evaluate(() => document.querySelector('[aria-label="The key"] + div svg path')?.getAttribute('d') ?? '');
  const match = async (digit: number) => {
    const before = await symbol();
    await page.keyboard.press(String(digit));
    await moved(before, symbol);
  };
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const s of SYMBOL_PRACTICE.slice(0, -1)) await match(SYMBOL_KEY[s]);
  await page.keyboard.press(String(SYMBOL_KEY[SYMBOL_PRACTICE[SYMBOL_PRACTICE.length - 1]]));
  await button(page, /^Start: /).click();
  await wait(page, COUNT_IN);
  for (const s of SYMBOL_RUN.slice(0, right)) await match(SYMBOL_KEY[s]);
  await wait(page, TIMED.symbols.seconds * 1000 + 500);
  await resume(page);
};

//sorts by the rule as it stands, and onto a card by another rule for each mistake it makes, spread through the run
const cardSorting: Game = async (page, mistakes) => {
  const onto = (card: Card, rule: (typeof SORT_RULES)[number]) => KEY_CARDS.findIndex((k) => k[rule] === card[rule]);
  const sort = async (index: number) => {
    await button(page, `Sort onto card ${index + 1}`).click();
    await wait(page, 700);
  };
  //every few cards, starting once the first right sort has shown the rule
  const every = Math.max(2, Math.floor((CARDS.length - 2) / Math.max(1, mistakes)));
  const wrongAt = new Set(Array.from({ length: mistakes }, (_, i) => 2 + i * every));
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const card of CARDS_PRACTICE) await sort(onto(card, 'color'));
  await button(page, `Start: ${CARDS.length} cards`).click();
  await wait(page, COUNT_IN);
  let rule = 0;
  let run = 0;
  for (const [i, card] of CARDS.entries()) {
    await shows(page, `Card ${i + 1} of ${CARDS.length}`);
    const now = SORT_RULES[rule % SORT_RULES.length];
    if (wrongAt.has(i)) {
      await sort(onto(card, SORT_RULES[(rule + 1) % SORT_RULES.length]));
      run = 0;
      continue;
    }
    await sort(onto(card, now));
    if (++run >= RUN_TO_CHANGE) {
      rule += 1;
      run = 0;
    }
  }
  await resume(page);
};

//answers every row right, slower by the reading when the outer arrows point the other way
const distractingArrows: Game = async (page, slower) => {
  const stop = await responder(page, { kind: 'arrows', ms: 420, slower });
  await button(page, 'Start the practice').click();
  await shows(page, 'Practice done.', GAME_MS);
  await button(page, `Start: ${TIMED.flanker.count} rows`).click();
  await shows(page, 'Done', GAME_MS);
  await stop();
};

// --- Reflexes and coordination ---------------------------------------------------------------------------------------

const reactionTime: Game = async (page, ms) => {
  const stop = await responder(page, { kind: 'reaction', ms });
  await page.locator('button[aria-label="The reaction box"]').click();
  await shows(page, 'Done', GAME_MS);
  await stop();
};

const choiceReaction: Game = async (page, ms) => {
  const stop = await responder(page, { kind: 'choice', ms });
  await button(page, 'Start').click();
  await shows(page, 'Done', GAME_MS);
  await stop();
};

//three tries of tapping, the best of them the reading
const tapping: Game = async (page, taps) => {
  const box = page.locator('button[aria-label="The tapping box"]');
  const count = () => page.evaluate(() => document.querySelector('button[aria-label="The tapping box"] > span')?.textContent ?? '');
  await pause(page);
  for (const [i, n] of [taps - 3, taps, taps - 1].entries()) {
    if (i) await button(page, `Ready for try ${i + 1}`).click();
    for (let t = 1; t <= Math.max(1, n); t++) {
      await box.click();
      if ((await count()) !== String(t)) await moved(String(t - 1), count);
    }
    await wait(page, TIMED.tapping.seconds * 1000 + 100);
  }
  await resume(page);
};

//keeps the pointer on a drifting dot for a share of the time that counts, then off it. The dot moves a frame at a time
//as the paused clock is moved on, so the pointer is put where it will be halfway through each step
async function pursue(page: Page, path: (seconds: number) => [number, number], seconds: number, share: number) {
  const STEP = 32;
  const box = await within(page, '[aria-label="The tracking box"]');
  const on = (t: number) => t < LEAD + (seconds * share) / 100;
  await page.mouse.move(...box(...path(0)));
  await shows(page, 'Get settled...');
  await settled(page);
  for (let ms = 0; ms <= (LEAD + seconds) * 1000 + 100; ms += STEP) {
    const [x, y] = path((ms + STEP / 2) / 1000);
    const [px, py] = on(ms / 1000) ? [x, y] : [x > 0.5 ? 0.02 : 0.98, y > 0.5 ? 0.02 : 0.98];
    await page.mouse.move(...box(px, py));
    await wait(page, STEP);
  }
}

const tracking: Game = async (page, share) => {
  await pause(page);
  await button(page, 'Start').click();
  await wait(page, COUNT_IN);
  await pursue(page, TRACKING_PATH, TIMED.tracking.seconds, share);
  await resume(page);
};

//stays on the dot for the reading's share of the time, and counts the high beeps as far off as that
const trackAndCount: Game = async (page, points) => {
  const highs = BEEPS.filter((b) => b.high).length;
  await pause(page);
  await button(page, 'Start').click();
  await wait(page, COUNT_IN);
  await pursue(page, TRACK_COUNT_PATH, TIMED.trackCount.seconds, points);
  const box = page.locator('#track-count');
  await box.fill(String(highs - Math.round(((100 - points) * highs) / 100)));
  await box.press('Enter');
  await resume(page);
};

//stops every dot early or late by the reading
const timing: Game = async (page, off) => {
  const stop = await responder(page, { kind: 'timing', seconds: TIMINGS.map((t) => t.seconds), practice: TIMING_PRACTICE.map((t) => t.seconds), off });
  await button(page, 'Start the practice').click();
  await shows(page, 'Practice done.', GAME_MS);
  await button(page, `Start: ${TIMINGS.length} tries`).click();
  await shows(page, 'Done', GAME_MS);
  await stop();
};

//steers to targets until it has reached the reading's number of them, then lets go and lets the time run out
const steering: Game = async (page, targets) => {
  const STEP = 50;
  const held = new Set<string>();
  const hold = async (keys: string[]) => {
    for (const k of [...held]) if (!keys.includes(k)) await page.keyboard.up(k);
    for (const k of keys) if (!held.has(k)) await page.keyboard.down(k);
    held.clear();
    keys.forEach((k) => held.add(k));
  };
  const read = () =>
    page.evaluate(() => {
      const spans = [...document.querySelectorAll('[aria-label="The steering box"] > span')] as HTMLElement[];
      const at = (s?: HTMLElement) => (s ? [parseFloat(s.style.left) / 100, parseFloat(s.style.top) / 100] : null);
      const reached = Number(/^(\d+) reached/.exec([...document.querySelectorAll('p[aria-live="polite"]')].map((p) => p.textContent).find((t) => /reached/.test(t ?? '')) ?? '')?.[1] ?? 0);
      return { target: at(spans.find((s) => s.style.borderStyle === 'dashed' || s.style.border.includes('dashed'))), dot: at(spans.find((s) => !(s.style.border ?? '').includes('dashed'))), reached };
    });
  await pause(page);
  await button(page, 'Start').click();
  await wait(page, COUNT_IN);
  for (let ms = 0; ms <= TIMED.steering.seconds * 1000 + 200; ms += STEP) {
    await settled(page);
    const { target, dot, reached } = await read();
    const keys: string[] = [];
    if (target && dot && reached < targets) {
      const [dx, dy] = [target[0] - dot[0], target[1] - dot[1]];
      if (Math.abs(dx) > 0.015) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (Math.abs(dy) > 0.015) keys.push(dy > 0 ? 's' : 'w');
    }
    await hold(keys);
    await wait(page, STEP);
  }
  await hold([]);
  await resume(page);
};

// --- Reasoning -------------------------------------------------------------------------------------------------------

//points to every practice one exactly, and to each that counts off by the reading, one side then the other
const perspectiveTaking: Game = async (page, off) => {
  const point = async (degrees: number) => {
    const box = await page.getByRole('img', { name: 'Point on the circle' }).boundingBox();
    if (!box) throw new Error("the circle isn't showing");
    const r = (44 / 120) * box.width * 0.8;
    const a = (degrees * Math.PI) / 180;
    await page.mouse.click(box.x + box.width / 2 + r * Math.sin(a), box.y + box.height / 2 - r * Math.cos(a));
  };
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const p of PERSPECTIVE_PRACTICE) {
    await point(p.angle);
    await button(page, 'Check it').click();
    await button(page, 'Next').click();
  }
  await button(page, new RegExp(`^Start: ${PERSPECTIVE_ITEMS.length} in `)).click();
  await wait(page, COUNT_IN);
  for (const [i, p] of PERSPECTIVE_ITEMS.entries()) {
    await shows(page, new RegExp(`^${i + 1} of ${PERSPECTIVE_ITEMS.length} ·`));
    await point(p.angle + (i % 2 ? off : -off));
    await button(page, 'Next').click();
  }
  await resume(page);
};

//every design of five dots joined by four lines, each as lines in an order that keeps it one shape as it's drawn
function designs(): [number, number][][] {
  const out: [number, number][][] = [];
  //every tree on the five dots, from its Prüfer sequence
  for (let code = 0; code < 125; code++) {
    const seq = [Math.floor(code / 25), Math.floor(code / 5) % 5, code % 5];
    const degree = [1, 1, 1, 1, 1];
    seq.forEach((d) => degree[d]++);
    const edges: [number, number][] = [];
    for (const d of seq) {
      const leaf = degree.findIndex((n) => n === 1);
      edges.push([leaf, d]);
      degree[leaf]--;
      degree[d]--;
    }
    const [a, b] = degree.flatMap((n, i) => (n === 1 ? [i] : []));
    edges.push([a, b]);
    //drawn outward from the first line, each line touching what's already drawn
    const ordered = [edges[edges.length - 1]];
    const rest = edges.slice(0, -1);
    while (rest.length) {
      const i = rest.findIndex(([x, y]) => ordered.some(([p, q]) => [p, q].includes(x) || [p, q].includes(y)));
      ordered.push(...rest.splice(i, 1));
    }
    out.push(ordered);
  }
  return out;
}

//makes the practice designs, then the reading's number of different ones, then lets the time run out
const designFluency: Game = async (page, count) => {
  const dots = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return [(50 + 38 * Math.cos(a)) / 100, (54 + 38 * Math.sin(a)) / 100] as const;
  });
  const all = designs();
  const draw = async (design: [number, number][]) => {
    const box = await within(page, 'svg[aria-label="Five dots to join with four lines"]');
    for (const [a, b] of design) {
      await page.mouse.click(...box(...dots[a]));
      await page.mouse.click(...box(...dots[b]));
    }
  };
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const d of all.slice(0, 2)) await draw(d);
  await button(page, /^Start: /).click();
  await wait(page, COUNT_IN);
  for (const d of all.slice(0, count)) await draw(d);
  await wait(page, TIMED.designs.seconds * 1000 + 500);
  await resume(page);
};

//types the persona's uses, lets the time run out, and waits for the api to score them
const brickUses: Game = async (page, _reading, persona) => {
  await pause(page);
  await button(page, /^Start: /).click();
  await wait(page, COUNT_IN);
  const box = page.getByRole('textbox', { name: 'Your answer' });
  for (const use of persona.brick_uses ?? []) {
    await box.fill(use);
    await box.press('Enter');
  }
  await wait(page, TIMED.uses.seconds * 1000 + 500);
  await resume(page);
  await button(page, 'Done').click({ timeout: 2 * STEP_MS });
};

//gets the practice right, then the first `right` pictures that count, and the rest wrong
const spotTheProblem: Game = async (page, right) => {
  const answer = async ([scene, wrong]: [Scene, boolean], correct: boolean) => {
    const box = await page.getByRole('img', { name: `${scene.name}. Tap anything wrong with it` }).boundingBox();
    if (!box) throw new Error(`${scene.name} isn't showing`);
    //the picture keeps its shape, centered in its box
    const scale = Math.min(box.width / W, box.height / H);
    const at = (x: number, y: number) => [box.x + (box.width - W * scale) / 2 + x * scale, box.y + (box.height - H * scale) / 2 + y * scale] as const;
    if (wrong === correct) {
      const [x, y, w, h] = wrong ? scene.where[0] : [0, 0, 16, 16];
      await page.mouse.click(...at(x + w / 2, y + h / 2));
      await button(page, "That's the problem").click();
    } else await button(page, "Nothing's wrong").click();
  };
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (const p of PROBLEMS_PRACTICE) {
    await answer(p, true);
    await button(page, 'Next').click();
  }
  await button(page, new RegExp(`^Start: ${PROBLEMS.length} in `)).click();
  await wait(page, COUNT_IN);
  for (const [i, p] of PROBLEMS.entries()) {
    await shows(page, new RegExp(`^${i + 1} of ${PROBLEMS.length} ·`));
    await answer(p, i < right);
  }
  await resume(page);
};

// --- Senses ----------------------------------------------------------------------------------------------------------

//reads every line down to the reading's and gets the next one wrong. The screen is sized to the card as it is
const eyeChart =
  (far: boolean): Game =>
  async (page, line) => {
    const TURNS: Record<string, string> = { '0': 'Right', '90': 'Down', '180': 'Left', '270': 'Up' };
    const read = () =>
      page.evaluate(() => ({
        status: [...document.querySelectorAll('p[aria-live="polite"]')].map((p) => p.textContent ?? '').find((t) => t.startsWith('Line 20/')) ?? '',
        turn: /rotate\((\d+)deg\)/.exec((document.querySelector('[aria-label="The letter"] svg') as SVGElement | null)?.style.transform ?? '')?.[1] ?? '',
      }));
    await pause(page);
    await button(page, 'It matches').click();
    await button(page, far ? 'Answer by tapping' : 'Start the chart').click();
    await wait(page, COUNT_IN);
    for (;;) {
      const { status, turn } = await read();
      if (!status) break;
      const at = Number(/^Line 20\/(\d+)/.exec(status)![1]);
      const way = TURNS[turn];
      await button(page, at >= line ? way : Object.values(TURNS).find((w) => w !== way)!).click();
      await moved(status, async () => (await read()).status);
    }
    await resume(page);
  };

//presses as each tone fades below the reading, in the right ear, and a few dB HL later in the left, so the right is the
//better ear and its average the reading. A tone starts after a quiet moment the paused clock is moved past, and fades
//on the audio clock, which keeps running. So the press lands on time on a busy machine, it's timed in the page on the
//audio clock itself, from when the tone was set to start, which the page notes as the test starts each tone
const hearing: Game = async (page, threshold) => {
  const START = 50, FADE = 4, NOTICE = 0.4, FLOOR = -10;
  type Noted = { tone?: { context: BaseAudioContext; at: number }; pressed: number; restore: () => void };
  await page.evaluate(() => {
    const noted = { pressed: 0 } as Noted;
    const start = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (when = 0) {
      //the test's tones start a moment ahead, where the silent sound timing the press starts at once
      if (this instanceof OscillatorNode && when > 0) noted.tone = { context: this.context, at: when };
      return start.call(this, when);
    };
    noted.restore = () => void (AudioScheduledSourceNode.prototype.start = start);
    (window as unknown as { hearing: Noted }).hearing = noted;
  });
  //presses the space bar once the tone has played for so many seconds, by a silent sound ending then
  const pressAfter = (seconds: number) =>
    page.evaluate((seconds) => {
      const noted = (window as unknown as { hearing: Noted }).hearing;
      const { context, at } = noted.tone!;
      const silent = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0;
      silent.connect(gain).connect(context.destination);
      silent.onended = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true }));
        noted.pressed += 1;
      };
      silent.start();
      silent.stop(at + seconds);
    }, seconds);
  const pressed = (n: number) => page.waitForFunction((n) => (window as unknown as { hearing: Noted }).hearing.pressed >= n, n, { polling: 50, timeout: STEP_MS });
  await pause(page);
  await button(page, 'My headphones are on').click();
  await button(page, "The volume's set").click();
  await button(page, 'Start the tones').click();
  let presses = 0;
  for (let tone = 0; tone < 8; tone++) {
    const at = tone < 4 ? threshold : Math.min(threshold + 4, 45);
    await wait(page, 2700);
    if (at > 47) {
      //not heard at all, which plays it again louder, and not heard again
      await page.keyboard.press(' ');
      await wait(page, 2700);
      await page.keyboard.press(' ');
    } else if (at <= FLOOR + 2) await wait(page, ((START - FLOOR) / FADE) * 1000 + 400);
    else {
      await pressAfter((START - at) / FADE + NOTICE);
      await pressed(++presses);
    }
  }
  await page.evaluate(() => (window as unknown as { hearing: Noted }).hearing.restore());
  await resume(page);
};

//spots the odd tile in every practice try, then in the tries that count spots it while it's at least the reading's
//difference from the rest, read from the tiles' hues, and misses it below that, so the differences settle around the
//reading
const oddColorOut: Game = async (page, threshold) => {
  const tiles = () => page.evaluate(() => [...document.querySelectorAll('[aria-label="Tiles"] button')].map((b) => (b as HTMLElement).style.background));
  const hue = (c: string) => Number(/oklch\([^ ]+ [^ ]+ ([^)]+)\)/.exec(c)![1]);
  const odd = (colors: string[]) => colors.findIndex((c) => colors.filter((x) => x === c).length === 1);
  await pause(page);
  await button(page, 'Start the practice').click();
  await wait(page, COUNT_IN);
  for (let i = 0; i < COLOR_PRACTICE.length; i++) {
    await shows(page, `Practice ${i + 1} of ${COLOR_PRACTICE.length}`);
    await button(page, `Tile ${odd(await tiles()) + 1}`).click();
    await wait(page, 1200); //past the answer shown after each practice try
  }
  await button(page, `Start: ${COLOR_TRIES} tries`).click();
  await wait(page, COUNT_IN);
  for (let i = 0; i < COLOR_TRIES; i++) {
    await shows(page, `${i + 1} of ${COLOR_TRIES}`);
    const colors = await tiles();
    const at = odd(colors);
    const apart = Math.abs(hue(colors[at]) - hue(colors[(at + 1) % colors.length]));
    const seen = Math.min(apart, 360 - apart) >= threshold;
    await button(page, `Tile ${(seen ? at : (at + 1) % colors.length) + 1}`).click();
  }
  await resume(page);
};

//types the man's digits in every practice round, then in the rounds that count types them while the other voices are
//no louder than the reading and gets the first digit wrong once they're louder, following the level as the test moves
//it, so the level settles within half a dB of the reading
const competingVoices: Game = async (page, threshold) => {
  const keys = page.getByRole('group', { name: 'Digits' });
  const type = async (digits: number[]) => {
    for (const d of digits) await keys.getByRole('button', { name: String(d), exact: true }).click();
  };
  const wrong = (digits: number[]) => [VOICE_DIGITS[(VOICE_DIGITS.indexOf(digits[0]) + 1) % VOICE_DIGITS.length], ...digits.slice(1)];
  await pause(page);
  await button(page, 'Start the practice').click();
  for (let i = 0; i < VOICE_PRACTICE.length; i++) {
    await shows(page, `Practice ${i + 1} of ${VOICE_PRACTICE.length}`);
    await type(VOICE_PRACTICE[i].follow);
    await wait(page, 1800);
  }
  await button(page, `Start: ${VOICE_ROUNDS} rounds`).click();
  let level = VOICE_START;
  let missed = false;
  for (let i = 0; i < VOICE_ROUNDS; i++) {
    await shows(page, `${i + 1} of ${VOICE_ROUNDS}`);
    const right = level <= threshold;
    const said = VOICE_ITEMS[i].follow;
    await type(right ? said : wrong(said));
    missed ||= !right;
    const step = !missed ? VOICE_FIRST_STEP : right ? VOICE_UP : VOICE_DOWN;
    level = Math.min(VOICE_HIGHEST, Math.max(VOICE_LOWEST, level + (right ? step : -step)));
    await wait(page, 400);
  }
  await resume(page);
};

//types his digits in every practice round, then in the rounds that count types them while his voice is at least the
//reading against the noise and gets the first digit wrong below it, so the level settles on the reading
const digitsInNoise: Game = async (page, threshold) => {
  const keys = page.getByRole('group', { name: 'Digits' });
  const type = async (digits: number[]) => {
    for (const d of digits) await keys.getByRole('button', { name: String(d), exact: true }).click();
  };
  const wrong = (digits: number[]) => [VOICE_DIGITS[(VOICE_DIGITS.indexOf(digits[0]) + 1) % VOICE_DIGITS.length], ...digits.slice(1)];
  await pause(page);
  await button(page, 'Start the practice').click();
  for (let i = 0; i < NOISE_PRACTICE.length; i++) {
    await shows(page, `Practice ${i + 1} of ${NOISE_PRACTICE.length}`);
    await type(NOISE_PRACTICE[i]);
    await wait(page, 1800);
  }
  await button(page, `Start: ${NOISE_ROUNDS} rounds`).click();
  let level = NOISE_START;
  for (let i = 0; i < NOISE_ROUNDS; i++) {
    await shows(page, `${i + 1} of ${NOISE_ROUNDS}`);
    const right = level >= threshold;
    await type(right ? NOISE_ITEMS[i] : wrong(NOISE_ITEMS[i]));
    level = Math.min(NOISE_HIGHEST, Math.max(NOISE_LOWEST, level + (right ? -NOISE_STEP : NOISE_STEP)));
    await wait(page, 400);
  }
  await resume(page);
};

//says the way every practice sound moved, then in the tries that count says it while the shift is at least the
//reading and the other way below it, following the shift as the test moves it, so it settles around the reading
const soundShift: Game = async (page, threshold) => {
  const ways = page.getByRole('group', { name: 'Which way' });
  const say = (way: string) => ways.getByRole('button', { name: new RegExp(way === 'left' ? 'Left' : 'Right') }).click();
  await pause(page);
  await button(page, "They're the right way around").click();
  for (let i = 0; i < SHIFT_PRACTICE_WAYS.length; i++) {
    await shows(page, `Practice ${i + 1} of ${SHIFT_PRACTICE_WAYS.length}`);
    await say(SHIFT_PRACTICE_WAYS[i]);
    await wait(page, 1800);
  }
  await button(page, `Start: ${SHIFT_TRIES} tries`).click();
  let shift = SHIFT_START;
  let missed = false;
  let run = 0;
  for (let i = 0; i < SHIFT_TRIES; i++) {
    await shows(page, `${i + 1} of ${SHIFT_TRIES}`);
    const right = shift >= threshold;
    await say(right ? SHIFT_WAYS[i] : SHIFT_WAYS[i] === 'left' ? 'right' : 'left');
    let factor = 1;
    if (!right) {
      missed = true;
      run = 0;
      factor = SHIFT_EASIER;
    } else if (!missed || ++run >= 2) {
      run = 0;
      factor = SHIFT_HARDER;
    }
    shift = Math.min(SHIFT_LARGEST, Math.max(SHIFT_SMALLEST, shift * factor));
    await wait(page, 400);
  }
  await resume(page);
};

//presses the side of every practice flash, then of the reading's number of flashes that count, and lets the rest pass
const sideVision: Game = async (page, seen) => {
  await button(page, 'It matches').click();
  const stop = await responder(page, { kind: 'side', respond: SIDE_PRACTICE.filter((f) => f !== null).length + seen });
  await button(page, 'Start the practice').click();
  await shows(page, 'Practice done.', GAME_MS);
  await button(page, /^Start: \d+ flashes/).click();
  await shows(page, 'Done', GAME_MS);
  await stop();
};

//each test the app runs, by the measurement's name
export const GAMES: Record<string, Game> = {
  'Matrix Puzzles': questions(chosen(MATRIX_PRACTICE), chosen(MATRIX_ITEMS)),
  'Number Series': questions(SERIES_PRACTICE, SERIES_ITEMS),
  'Shape Rotation': questions(chosen(ROTATION_PRACTICE), chosen(ROTATION_ITEMS)),
  'Paper Folding': questions(chosen(FOLDING_PRACTICE), chosen(FOLDING_ITEMS)),
  Syllogisms: questions(syllogisms(SYLLOGISM_PRACTICE), syllogisms(SYLLOGISM_ITEMS)),
  'Broken Words': questions(
    WORDS_PRACTICE.map((w) => ({ answer: 0, word: w.word })),
    BROKEN_WORDS.map((w) => ({ answer: 0, word: w.word })),
  ),
  'Hidden Shapes': questions(chosen(HIDDEN_PRACTICE), chosen(HIDDEN_ITEMS)),
  'Perspective Taking': perspectiveTaking,
  'Design Fluency': designFluency,
  'Brick Uses': brickUses,
  'Spot the Problem': spotTheProblem,
  'Digit Span': digitSpan,
  'Trail Making': trailMaking,
  'Symbol Matching': symbolMatching,
  'Distracting Arrows': distractingArrows,
  'Card Sorting': cardSorting,
  'Reaction Time': reactionTime,
  'Choice Reaction Time': choiceReaction,
  Tapping: tapping,
  Tracking: tracking,
  Timing: timing,
  'Two-Hand Steering': steering,
  'Track and Count': trackAndCount,
  'Visual Acuity': eyeChart(true),
  'Reading Chart': eyeChart(false),
  'Hearing Threshold': hearing,
  'Odd Color Out': oddColorOut,
  'Competing Voices': competingVoices,
  'Digits in Noise': digitsInNoise,
  'Sound Shift': soundShift,
  'Side Vision': sideVision,
};
