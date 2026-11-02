// The personality tests (see documentation/architecture/ADRs/personality_testing_harness.md). Every persona with a
// `personality` has target scores and scripted answers, and plays as its own test, all at once. Each one logs in through
// the ui's login form, plays every scene in the real ui the way a player would (opening its card, clicking through the
// text, picking choices, typing answers), waits for scoring as the dashboard does, then reads back its scores. Its
// answers are cleared first, so every run starts from nothing, like a new player.
// A test passes when its persona plays through. The scores are attached to it, and ./reporter.ts compares them with
// the targets and the previous run.
import { test, type Page } from '@playwright/test';
import { call, login, sleep } from '../harness.ts';
import { personas } from '../personas/index.ts';
import type { Answer } from '../personas/persona.ts';
import { SCENES, walk } from './scenes.ts';

const STEP_MS = 60_000; //longest any one step of a scene should take, saving included
const SCORING_MS = 10 * 60_000; //longest a rescore should take before the next scene's card unlocks

//the player's text box: what's been written out so far, then the hidden rest of the text holding its space
const TEXT = 'p:has(> span[style*="visibility: hidden"])';
//polled on an interval: the page's requestAnimationFrame stops while its clock is paused
const showing = (page: Page, text: string) =>
  page.waitForFunction(([sel, text]) => document.querySelector(sel)?.textContent === text, [TEXT, text], { polling: 50, timeout: STEP_MS });
//until the player has moved off the step showing text, or closed
const movedOn = (page: Page, text: string) =>
  page.waitForFunction(([sel, text]) => document.querySelector(sel)?.textContent !== text, [TEXT, text], { polling: 50, timeout: STEP_MS });
//whether the step showing text has been written out in full
const written = (page: Page, text: string) =>
  page.evaluate(([sel, text]) => {
    const p = document.querySelector(sel);
    return p?.textContent === text && p.lastElementChild?.textContent === '';
  }, [TEXT, text]);

//plays one scene in the ui, from its card on the dashboard to the end. The card stays locked while the last scene's
//answers are scored, so opening it waits for that. Says whether its last answer started a rescore.
//The page's clock is paused while a scene's clock runs, so each timed answer is given with exactly the seconds left
//the persona has for it
async function playScene(page: Page, name: string, mine: Record<string, Answer>, first: boolean) {
  const script = SCENES[name];
  await page.getByRole('button').filter({ has: page.getByText(script.title, { exact: true }) }).click({ timeout: SCORING_MS });
  //a new browser shows how to get the most out of a scene before the first one
  if (first) {
    await page.getByRole('checkbox', { name: "Don't show this again" }).click();
    await page.getByRole('button', { name: "Let's go ▶" }).click();
  }

  let scored = false;
  let paused = false;
  let spent = 0; //ms the paused clock has been moved on since the scene's clock started
  const resume = async () => {
    if (paused) await page.clock.resume();
    paused = false;
  };
  for (const s of walk(name, script, mine)) {
    try {
      await showing(page, s.text);
      if (s.starts) {
        await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
        paused = true;
        spent = 0;
      }
      if (!s.key) {
        //the first press writes the rest of the text out if it's still being written, the next moves on
        await page.keyboard.press('ArrowRight');
        if (await written(page, s.text)) await page.keyboard.press('ArrowRight');
        await movedOn(page, s.text);
      } else {
        //writes the prompt out so its answer box shows. Once written, the press waits for an answer, so it does nothing
        await page.keyboard.press('ArrowRight');
        if (s.choice) await page.getByRole('button', { name: s.choice, exact: true }).click();
        await page.locator('textarea').fill(s.answer!);
        if (paused && s.left !== undefined) {
          //the clock jumps to its late section the moment it reaches 0, so left: 0 answers with 0.4s to go, which the ui rounds to 0
          const ms = Math.min(script.clock!.seconds - s.left, script.clock!.seconds - 0.4) * 1000 - spent;
          if (ms > 0) {
            await page.clock.fastForward(ms);
            spent += ms;
          }
        }
        const [saved] = await Promise.all([
          page.waitForResponse((r) => r.url().endsWith('/api/personality/answers') && r.request().method() === 'PUT', { timeout: STEP_MS }),
          page.getByRole('button', { name: 'Continue ▶' }).click(),
        ]);
        if (!saved.ok()) throw new Error(`saving the answer: ${saved.status()} ${await saved.text()}`);
        scored = (await saved.json()).scored;
        await movedOn(page, s.text);
        if (s.ranOut && paused) {
          await page.clock.fastForward(script.clock!.seconds * 1000 - spent + 1000);
          await resume();
        }
      }
      if (s.stops) await resume();
    } catch (e) {
      const alert = await page.getByRole('alert').first().textContent({ timeout: 1000 }).catch(() => undefined);
      throw new Error(`${name}: at ${s.key ?? `"${s.text.slice(0, 50)}"`}: ${alert ? `the ui says "${alert}"` : (e as Error).message.split('\n')[0]}`, { cause: e });
    }
  }
  await resume();
  await page.locator(TEXT).waitFor({ state: 'detached', timeout: STEP_MS });
  return scored;
}

const scoringDone = async (token: string) => {
  do await sleep(3000);
  while ((await call<{ running: boolean }>('GET', '/personality/scoring', undefined, token)).running);
};

for (const [file, persona] of Object.entries(personas)) {
  const mine = persona.personality;
  if (!mine) continue;

  test(file, async ({ page }, testInfo) => {
    const token = await login(persona); //makes sure the account exists. The browser logs in through the form
    //start from nothing, so the run scores at the same points a new player's would. The ui has no button for this
    await call('DELETE', '/personality/answers', undefined, token);
    await page.clock.install();

    await test.step('log in', async () => {
      await page.goto('/login');
      await page.locator('input[type="tel"]').fill(persona.account.phone);
      await page.locator('input[type="password"]').fill(persona.account.password);
      await page.getByRole('button', { name: 'Log in ▶' }).click();
      await page.waitForURL('**/personality');
    });

    let scored = false;
    for (const [i, scene] of Object.keys(SCENES).entries()) {
      if (!mine.answers[scene]) throw new Error(`${persona.name}: no answers for ${scene}`);
      scored = await test.step(scene, () => playScene(page, scene, mine.answers[scene], i === 0));
    }

    //scoring only runs every few scenes, so unless the last one just scored, score once more from everything. The ui
    //has no button for this either
    await test.step('score', async () => {
      if (!scored) await call('POST', '/personality/rescore', undefined, token);
      await scoringDone(token);
    });
    const profile = await call<{ personality: { traits: { name: string; value?: number; confidence?: number }[] } }>('GET', `/profiles/${persona.account.username}`, undefined, token);
    const scores = Object.fromEntries(profile.personality.traits.map((t) => [t.name, { value: t.value, confidence: t.confidence }]));
    await testInfo.attach('scores', { body: JSON.stringify(scores), contentType: 'application/json' });
  });
}
