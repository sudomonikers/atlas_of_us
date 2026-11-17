// The physical tests. Every persona with a `physical` has its body, its readings and its conditions and impairments, and plays as
// its own test, all at once. Each one logs in through the ui's login form, skips the story that opens Physical Traits,
// and plays every chapter in the real ui the way a player would: picking its characteristics, typing in its
// measurements, playing every test the app runs to its own score, and
// adding its impairments and conditions. Everything it entered before is cleared first, so every run starts from
// nothing, like a new player.
// A test passes when its persona plays through and every test it played saved the reading it played to. Where it
// stands on each ability is attached to it, and ./reporter.ts compares them with the targets and the previous run.
import { test } from '@playwright/test';
import { call, login } from '../harness.ts';
import { personas } from '../personas/index.ts';
import { chapterTitle, playChapter, type Catalog, type Recorded } from './chapters.ts';
import { STEP_MS } from './play.ts';

interface Ability {
  id: string;
  name: string;
  value: number | null;
  confidence: number | null;
}
interface Measurement {
  id: string;
  name: string;
  test: string | null;
}
interface Characteristic {
  id: string;
  name: string;
  choices: string[];
}

//takes back everything the persona entered in Physical Traits, and has the story open it again. The ui has no button
//for either
async function reset(token: string) {
  await call('DELETE', '/physical/me', undefined, token);
  await call('PATCH', '/auth/config', { physical_intro_seen: false }, token);
}

async function catalog(token: string): Promise<Catalog> {
  const [{ measurements }, { characteristics }, { conditions }] = await Promise.all([
    call<{ measurements: Measurement[] }>('GET', '/physical/measurements', undefined, token),
    call<{ characteristics: Characteristic[] }>('GET', '/physical/me', undefined, token),
    call<{ conditions: Catalog['conditions'] }>('GET', '/physical/conditions', undefined, token),
  ]);
  return { measurements, characteristics, conditions };
}

for (const [file, persona] of Object.entries(personas)) {
  const mine = persona.physical;
  if (!mine) continue;

  test(file, async ({ page }, testInfo) => {
    const token = await login(persona); //makes sure the account exists. The browser logs in through the form
    await reset(token);
    const known = await catalog(token);
    await page.clock.install();

    await test.step('log in', async () => {
      await page.goto('/login?next=/physical');
      await page.locator('input[type="tel"]').fill(persona.account.phone);
      await page.locator('input[type="password"]').fill(persona.account.password);
      await page.getByRole('button', { name: 'Log in ▶' }).click();
      await page.waitForURL('**/physical');
    });

    await test.step('skip the story', async () => {
      await page.getByRole('button', { name: 'Skip to the chapters ▶' }).click({ timeout: STEP_MS });
      await page.getByRole('button', { name: /Chapter 1/ }).click({ timeout: STEP_MS });
    });

    //each chapter ends on the next one, and the last back on the chapters
    const recorded: Recorded = {};
    let more = true;
    while (more) {
      const title = (await chapterTitle(page)) ?? 'a chapter';
      more = await test.step(title, () => playChapter(page, mine, known, recorded));
    }

    const abilities = await call<Ability[]>('GET', '/physical/abilities', undefined, token);
    const placed = Object.fromEntries(abilities.map((a) => [a.name, { value: a.value, confidence: a.confidence }]));
    await testInfo.attach('abilities', { body: JSON.stringify(placed), contentType: 'application/json' });
    await testInfo.attach('readings', { body: JSON.stringify(recorded), contentType: 'application/json' });
  });
}
