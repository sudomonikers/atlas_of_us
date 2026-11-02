import { defineConfig } from '@playwright/test';
import { personas } from './testing/personas/index.ts';

// The regression tests for the Atlas modules, played by the test personas in testing/personas/ against the local api on
// port 3000 (see documentation/architecture/ADRs/personality_testing_harness.md). Each module is a project:
//   npm run test:personality            every persona plays every scene and is scored (about $7 of Bedrock calls)
//   npm run test:personality -- -g ruth only these personas, by file name
//   npm run test:personality:check      checks every persona's answers and targets, without playing
export default defineConfig({
  testDir: './testing',
  outputDir: './testing/test-results', //traces, screenshots and the last run's state
  fullyParallel: true,
  workers: Object.keys(personas).length, //every persona plays at once, like that many players
  retries: 0, //a run costs real money, and a flaky failure is worth seeing
  reporter: [['list', { printSteps: true }], ['./testing/personality/reporter.ts']],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'personality', testMatch: 'personality/personality.test.ts', timeout: 30 * 60_000 },
    { name: 'personality-check', testMatch: 'personality/check.test.ts' },
  ],
});
