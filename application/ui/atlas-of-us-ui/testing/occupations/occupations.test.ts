// The Occupations module's regression tests, on the business site (application/ui/atlas-business-ui). Every persona
// with `occupations` logs in through the site's form, sees the occupations closest to them, then searches for each job
// it's interested in and opens it: every part of what the work takes shows, with how close they are, and the
// physical demands the page flags for them are exactly the ones its persona file expects. Last it logs out and opens a
// job again, which flags nothing for no one. The flags come from the impairments and conditions the abilities module
// entered for the persona, so it plays first (npm run test:abilities).
import { expect, test, type Page } from '@playwright/test';
import { personas } from '../personas/index.ts';
import type { Job, Persona } from '../personas/persona.ts';

//the business site, served by the playwright config's second web server, or BUSINESS_SITE, such as a second copy of
//it in front of a second api
const SITE = process.env.BUSINESS_SITE ?? 'http://localhost:5175';

//the sections every occupation page has
const SECTIONS = ['Knowledge', 'Skills', 'Abilities', 'What the work is like', 'Personality'];

async function logIn(page: Page, { account }: Persona) {
  await page.goto(SITE);
  await page.getByLabel('Phone').fill(account.phone);
  await page.getByLabel('Password').fill(account.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
}

//searches for the job by its title, from the occupations home, and opens it
async function open(page: Page, job: Job) {
  await page.goto(SITE);
  await page.getByLabel('Search occupations').fill(job.title);
  await page.locator('.results').getByRole('link', { name: job.title, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: job.title, exact: true })).toBeVisible();
}

//how the page names something noted in a sentence
const inSentence = (noted: string) => noted.charAt(0).toLowerCase() + noted.slice(1);

//the flags on the open job's page: each flagged demand once, naming each thing it strains that the persona noted
async function expectFlags(page: Page, job: Job) {
  const note = page.getByRole('note');
  const flagged = Object.entries(job.flags);
  if (!flagged.length) {
    await expect(note, `${job.title} flags nothing`).toHaveCount(0);
    return;
  }
  await expect(note).toContainText('Worth knowing for you');
  await expect(note.getByRole('listitem')).toHaveCount(flagged.length);
  for (const [demand, noted] of flagged) {
    const item = note.getByRole('listitem').filter({ hasText: `${demand},` });
    await expect(item, `${job.title}: ${demand}`).toHaveCount(1);
    for (const n of noted ?? []) await expect(item, `${job.title}: ${demand} names ${n}`).toContainText(inSentence(n));
  }
}

for (const [key, persona] of Object.entries(personas)) {
  const occupations = persona.occupations;
  if (!occupations) continue;

  test(key, async ({ page }) => {
    await test.step('log in, and see the closest occupations', async () => {
      await logIn(page, persona);
      await expect(page.getByRole('heading', { name: 'Closest to you' })).toBeVisible();
      await expect(page.locator('.closest-row').first()).toBeVisible();
    });

    for (const job of occupations.jobs) {
      await test.step(job.title, async () => {
        await open(page, job);
        for (const name of SECTIONS) await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
        await expect(page.getByText("You're this close")).toBeVisible();
        await expectFlags(page, job);
      });
    }

    await test.step('log out, and nothing is flagged', async () => {
      await page.getByRole('button', { name: 'Log out' }).click();
      await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
      const job = occupations.jobs.find((j) => Object.keys(j.flags).length) ?? occupations.jobs[0];
      await open(page, job);
      await expect(page.getByRole('heading', { level: 2, name: 'What the work is like', exact: true })).toBeVisible();
      await expect(page.getByRole('note')).toHaveCount(0);
      await expect(page.getByText("You're this close")).toHaveCount(0);
    });
  });
}
