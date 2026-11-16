// Plays the physical chapters in the ui, scene by scene, the way a player does: reading what Atlas says, then doing
// what the scene asks with the persona's own answers, or skipping it, and moving on with Next.
import { expect, test, type Page } from '@playwright/test';
import type { Physical } from '../personas/persona.ts';
import { GAMES, TOLERANCE } from './games.ts';
import { button, STEP_MS } from './play.ts';

//what the api has, for telling what a scene asks for by its title
export interface Catalog {
  measurements: { id: string; name: string; test: string | null }[];
  abilities: { id: string; name: string; examples: string[] }[];
  characteristics: { id: string; name: string; choices: string[] }[];
  conditions: { name: string; plain_name: string | null; checklist: string | null }[];
}

//each reading as the api saved it, by its measurement's name
export type Recorded = Record<string, number>;

//where the sit and reach box's ruler puts the toes, as the ui keeps the reading
const TOES = 26;

//Atlas's words: what's been written out so far, then the hidden rest holding its space
const TEXT = 'p:has(> span[style*="visibility: hidden"])';
//the chapter's title, over its scenes
const chapterTitle = (page: Page) => page.locator('header h1').first().textContent({ timeout: STEP_MS });
//where the player is: "Scene 3 of 9", and the name of the scene, from its dot
const position = (page: Page) => page.locator('nav[aria-label^="Scene "]').getAttribute('aria-label', { timeout: STEP_MS });
const sceneName = (page: Page) => page.locator('nav[aria-label^="Scene "] button[aria-current="step"]').getAttribute('aria-label', { timeout: STEP_MS });

const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

//writes out what Atlas is saying, so the scene's panel shows. The key only finishes the writing while it's being
//written, where the last scene has no Next button to press
async function read(page: Page) {
  const written = () => page.evaluate((sel) => document.querySelector(sel)?.lastElementChild?.textContent === '', TEXT);
  if (await written()) return;
  await page.locator('body').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((sel) => document.querySelector(sel)?.lastElementChild?.textContent === '', TEXT, { polling: 50, timeout: STEP_MS });
}

//saves something with a click, and waits for the api to take it
async function saving(page: Page, url: RegExp, method: string, click: () => Promise<void>) {
  const [saved] = await Promise.all([page.waitForResponse((r) => url.test(r.url()) && r.request().method() === method, { timeout: 3 * STEP_MS }), click()]);
  if (!saved.ok()) throw new Error(`saving: ${saved.status()} ${await saved.text()}`);
  return saved;
}

async function characteristic(page: Page, name: string, choice: string) {
  await read(page);
  await saving(page, /\/api\/physical\/me$/, 'PUT', () => page.getByRole('group', { name }).getByRole('button', { name: choice, exact: true }).click());
}

//types a reading in, or plays the test that takes it, and keeps what the api saved
async function measurement(page: Page, m: Catalog['measurements'][number], persona: Physical, recorded: Recorded) {
  await read(page);
  const reading = m.name === 'Brick Uses' ? (persona.brick_uses ? 0 : undefined) : persona.readings[m.name];
  const typed = m.test === null || m.test === 'home';
  if (reading === undefined || m.test === 'camera') return button(page, 'Skip').click();
  const url = m.name === 'Brick Uses' ? /\/answers$/ : /\/readings$/;
  const saved = await saving(page, url, 'POST', async () => {
    if (!typed) {
      await button(page, 'Take the test').click();
      return GAMES[m.name](page, reading, persona);
    }
    const form = page.getByRole('form', { name: `A new ${m.name.toLowerCase()} reading` });
    if (m.name === 'Sit and Reach') {
      await form.getByRole('button', { name: reading < 0 ? 'Short of my toes' : 'Past my toes' }).click();
      await form.getByLabel('How far did your fingertips reach?').fill(String(Math.abs(reading)));
    } else await form.getByLabel('What did you measure?').fill(String(reading));
    await form.getByRole('button', { name: 'Save' }).click();
  });
  const value: number = (await saved.json()).reading.value;
  recorded[m.name] = value;
  if (m.name === 'Brick Uses') return;
  const wanted = m.name === 'Sit and Reach' ? TOES + reading : reading;
  const off = m.name === 'Odd Color Out' ? TOLERANCE[m.name] * wanted : (TOLERANCE[m.name] ?? 0);
  expect.soft(Math.abs(value - wanted), `${m.name} was saved as ${value}, played to ${wanted}`).toBeLessThanOrEqual(off + 1e-9);
}

//picks the hardest example the persona can do, or none of them
async function rating(page: Page, a: Catalog['abilities'][number], anchor: number) {
  await read(page);
  await page.getByRole('radio', { name: anchor ? a.examples[anchor - 1] : 'None of these', exact: true }).check();
  await saving(page, /\/rating$/, 'PUT', () => button(page, 'Save').click());
}

//picks each condition from the checklist when it's on it, or finds it by searching for it, and says how it affects them.
//Then finds where each impairment is by searching for it, and says how much it's impaired
async function livingWith(page: Page, persona: Physical, catalog: Catalog) {
  await read(page);
  const search = page.locator('#living-search');
  for (const c of persona.conditions) {
    const known = catalog.conditions.find((x) => x.name === c.name);
    if (!known) throw new Error(`there's no condition ${c.name}`);
    const label = known.plain_name ?? capitalized(c.name);
    if (known.checklist) {
      await search.fill('');
      await page.getByRole('group', { name: known.checklist, exact: true }).getByRole('button', { name: label, exact: true }).click();
    } else {
      await search.fill(c.name);
      await button(page, label).first().click();
    }
    const form = page.getByRole('group', { name: label, exact: true });
    if (c.severity) await form.getByRole('button', { name: capitalized(c.severity), exact: true }).click();
    for (const [name, on] of [
      ['A doctor or other professional diagnosed it', c.diagnosed],
      ["It's under control, with treatment or otherwise", c.managed],
    ] as const) {
      const box = form.getByRole('checkbox', { name });
      if ((await box.getAttribute('aria-checked')) !== String(on)) await box.click();
    }
    await saving(page, /\/mine$/, 'PUT', () => form.getByRole('button', { name: 'Save', exact: true }).click());
  }
  for (const i of persona.impairments) {
    const name = i.part ? capitalized(i.in) : i.in;
    await search.fill(i.in);
    await button(page, name).first().click();
    const form = page.getByRole('group', { name: `Your ${name}`, exact: true });
    await form.getByRole('button', { name: capitalized(i.extent), exact: true }).click();
    if (i.change) await form.locator('select[id^="change-"]').selectOption({ label: i.change });
    await saving(page, /\/api\/physical\/impairments\//, 'PUT', () => form.getByRole('button', { name: 'Save', exact: true }).click());
  }
  await search.fill('');
}

//does what one scene asks, by its name: the measurement, ability or characteristic it's about, or one of the lists
async function act(page: Page, name: string, persona: Physical, catalog: Catalog, recorded: Recorded) {
  const m = catalog.measurements.find((x) => x.name === name);
  if (m) return measurement(page, m, persona, recorded);
  const c = catalog.characteristics.find((x) => x.name === name);
  if (c) return persona.characteristics[name] && characteristic(page, name, persona.characteristics[name]);
  const a = catalog.abilities.find((x) => x.name === name);
  if (a) return persona.ratings[name] !== undefined && rating(page, a, persona.ratings[name]);
  if (name === 'Your conditions and impairments') return livingWith(page, persona, catalog);
}

//on to the next scene, the next chapter, or back to the chapters after the last. Says which
async function onward(page: Page, from: string): Promise<'scene' | 'chapter' | 'end'> {
  for (let presses = 0; presses < 50; presses++) {
    if ((await position(page)) !== from) return 'scene';
    const nextChapter = page.getByRole('button', { name: /^Next chapter: / });
    if (await nextChapter.isVisible()) {
      await nextChapter.click();
      return 'chapter';
    }
    const end = button(page, 'Back to the chapters ■');
    if (await end.isVisible()) {
      await end.click();
      return 'end';
    }
    await button(page, 'Next ▶').click();
  }
  throw new Error(`stuck on ${from}`);
}

//plays the chapter that's open, every scene in turn. Says whether another chapter follows
export async function playChapter(page: Page, persona: Physical, catalog: Catalog, recorded: Recorded) {
  for (;;) {
    const at = (await position(page))!;
    const name = (await sceneName(page))!;
    const next = await test.step(name, async () => {
      try {
        await act(page, name, persona, catalog, recorded);
      } catch (e) {
        const alert = await page.getByRole('alert').first().textContent({ timeout: 1000 }).catch(() => undefined);
        throw new Error(`${name}: ${alert ? `the ui says "${alert}"` : (e as Error).message.split('\n')[0]}`, { cause: e });
      }
      return onward(page, at);
    });
    if (next !== 'scene') return next === 'chapter';
  }
}

export { chapterTitle };
