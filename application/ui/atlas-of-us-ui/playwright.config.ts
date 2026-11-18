import { defineConfig } from '@playwright/test';
import { personas } from './testing/personas/index.ts';

// The regression tests for the Atlas modules, played by the test personas in testing/personas/ against the local api on
// port 3000 (see documentation/architecture/ADRs/personality_testing_harness.md). Each module is a project:
//   npm run test:personality            every persona plays every scene and is scored (about $7 of Bedrock calls)
//   npm run test:personality -- -g ruth only these personas, by file name
//   npm run test:personality:check      checks every persona's answers and targets, without playing
//   npm run test:abilities               every persona plays every Abilities chapter and test
//   npm run test:abilities -- -g ruth    only these personas, by file name
//   npm run test:abilities:check         checks every persona's Abilities answers and targets, without playing
//   npm run test:occupations             every persona opens the jobs it's interested in on the business site, after
//                                        test:abilities has entered its impairments and conditions
export default defineConfig({
  testDir: './testing',
  outputDir: './testing/test-results', //traces, screenshots and the last run's state
  fullyParallel: true,
  workers: Object.keys(personas).length, //every persona plays at once, like that many players
  retries: 0, //a run costs real money, and a flaky failure is worth seeing
  reporter: [['list', { printSteps: true }], ['./testing/personality/reporter.ts'], ['./testing/abilities/reporter.ts']],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 900 },
  },
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
    //the business site, for the occupations module, against the same api
    {
      command: 'npm --prefix ../atlas-business-ui run dev -- --port 5175 --strictPort',
      url: 'http://localhost:5175',
      reuseExistingServer: true,
    },
  ],
  projects: [
    { name: 'personality', testMatch: 'personality/personality.test.ts', timeout: 30 * 60_000 },
    { name: 'personality-check', testMatch: 'personality/check.test.ts' },
    {
      name: 'abilities',
      testMatch: 'abilities/abilities.test.ts',
      timeout: 60 * 60_000,
      //the full browser rather than the headless shell, whose audio clock stands still, on a screen as sharp as a
      //laptop's, which draws the reading chart's small lines
      use: { channel: 'chromium', deviceScaleFactor: 2, actionTimeout: 60_000 },
    },
    { name: 'abilities-check', testMatch: 'abilities/check.test.ts' },
    { name: 'occupations', testMatch: 'occupations/occupations.test.ts', timeout: 5 * 60_000 },
  ],
});
