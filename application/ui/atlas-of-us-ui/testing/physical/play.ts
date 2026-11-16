// What playing the physical chapters' tests takes: moving the page's clock, waiting on the page while the clock is
// paused, and answering in the page itself where the timing has to be exact.
import type { Page } from '@playwright/test';

export const STEP_MS = 60_000; //longest any one step should take, saving included
export const COUNT_IN = 3000; //the count of three before a test starts, in ms

//pauses the page's clock, so time only moves as the persona moves it. It pauses a moment ahead of the page's time,
//further ahead each time the page's time has passed it before the pause lands, as it does on a busy machine
export async function pause(page: Page) {
  for (const ahead of [20, 100, 500]) {
    try {
      return await page.clock.pauseAt((await page.evaluate(() => Date.now())) + ahead);
    } catch (e) {
      if (!/to the past/.test((e as Error).message)) throw e;
    }
  }
  throw new Error("the page's clock kept running past every moment to pause it at");
}
export const resume = (page: Page) => page.clock.resume();
//moves the paused clock on, firing whatever comes due
export const wait = (page: Page, ms: number) => page.clock.runFor(Math.round(ms));

//lets the page finish rendering what the last step changed. Polls on an interval rather than requestAnimationFrame,
//which stops while the clock is paused
export const settled = (page: Page) =>
  page.evaluate(() => new Promise<void>((done) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => done();
    channel.port2.postMessage(0);
  }));

export const GAME_MS = 5 * 60_000; //longest a whole test takes to play, the reaction tests that run in real time included

//waits until the page shows some text, the whole of an element's text for a string. A step of a test shows within a
//minute, and the end of one that plays in real time within the time the whole test takes
export const shows = (page: Page, text: string | RegExp, timeout = STEP_MS) => page.getByText(text, { exact: true }).first().waitFor({ timeout });

//a button by its exact name
export const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' });

//waits for a test's status line to show something other than what it did
export async function moved(before: string, read: () => Promise<string>) {
  const end = Date.now() + STEP_MS;
  while (Date.now() < end) {
    if ((await read()) !== before) return;
    await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error(`the test stayed on "${before}"`);
}

//the reaction tests a responder can answer, with how the persona answers each try
export type Responding =
  | { kind: 'reaction'; ms: number } //presses ms after the target is painted
  | { kind: 'choice'; ms: number } //presses the right key ms after the letter is painted
  | { kind: 'arrows'; ms: number; slower: number } //presses the right way ms after the arrows show, slower ms more when the outer ones disagree
  | { kind: 'timing'; seconds: number[]; practice: number[]; off: number } //stops each dot off ms from the line, early and late in turn
  | { kind: 'side'; respond: number }; //presses the side of the first `respond` flashes, a moment after each shows

//answers a reaction test on its own in the page, as each try comes up, so the time is exact rather than held up by the
//round trip to the page. Its key presses are timed by the page's clock, from when the test itself starts timing the
//try. Returns a function that stops it
export async function responder(page: Page, how: Responding) {
  await page.evaluate((how) => {
    const press = (key: string, code: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
    const later = (ms: number, key: string, code: string) => setTimeout(() => press(key, code), ms);
    //after the second frame, as a test timed from when its target was painted starts timing then
    const painted = (go: () => void) => requestAnimationFrame(() => requestAnimationFrame(go));
    const status = () => [...document.querySelectorAll('p[aria-live="polite"]')].map((p) => p.textContent ?? '').find((t) => /^(Practice )?\d+ of \d+/.test(t)) ?? '';

    let last: string | null = null; //what was showing at the last change, so each try is answered once
    let count = 0;
    const tries: Record<Responding['kind'], () => void> = {
      reaction: () => {
        const box = document.querySelector('button[aria-label="The reaction box"]');
        const shown = !!box && [...box.querySelectorAll('span')].some((s) => !s.textContent);
        const now = shown ? 'shown' : null;
        if (now && now !== last && how.kind === 'reaction') painted(() => later(how.ms, ' ', 'Space'));
        last = now;
      },
      choice: () => {
        const letter = document.querySelector('[aria-label="The letter box"] span') as HTMLElement | null;
        const now = letter && /^[PF]$/.test(letter.textContent ?? '') ? 'shown' : null;
        if (now && now !== last && how.kind === 'choice') {
          const target = letter!.textContent === 'P' && letter!.style.color.includes('air-force-blue');
          painted(() => (target ? later(how.ms, 'f', 'KeyF') : later(how.ms, 'j', 'KeyJ')));
        }
        last = now;
      },
      arrows: () => {
        const row = [...document.querySelectorAll('span')].map((s) => s.textContent ?? '').find((t) => /^[<>]( [<>]){4}$/.test(t)) ?? null;
        if (row && last === null && how.kind === 'arrows') {
          const arrows = row.split(' ');
          const left = arrows[2] === '<';
          const same = arrows.every((a) => a === arrows[2]);
          later(how.ms + (same ? 0 : how.slower), left ? 'ArrowLeft' : 'ArrowRight', left ? 'KeyF' : 'KeyJ');
        }
        last = row;
      },
      //a try starts its dot 800 ms after the status moves on to it, and it reaches the line its seconds after that
      timing: () => {
        const now = status();
        const at = /^(Practice )?(\d+) of/.exec(now);
        if (at && now.split(' · ')[0] !== last?.split(' · ')[0] && how.kind === 'timing') {
          const seconds = (at[1] ? how.practice : how.seconds)[Number(at[2]) - 1];
          later(800 + seconds * 1000 + (count++ % 2 ? how.off : -how.off), ' ', 'Space');
        }
        last = now;
      },
      side: () => {
        const flash = document.querySelector('span[style*="calc(50%"]');
        const box = flash?.getBoundingClientRect();
        const now = box ? `${box.left}` : null;
        if (box && now !== last && how.kind === 'side' && count++ < how.respond) {
          const left = box.left + box.width / 2 < window.innerWidth / 2;
          later(300, left ? 'ArrowLeft' : 'ArrowRight', left ? 'ArrowLeft' : 'ArrowRight');
        }
        last = now;
      },
    };
    const observer = new MutationObserver(() => tries[how.kind]());
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    (window as unknown as { stopResponder: () => void }).stopResponder = () => observer.disconnect();
  }, how);
  return () => page.evaluate(() => (window as unknown as { stopResponder: () => void }).stopResponder());
}
