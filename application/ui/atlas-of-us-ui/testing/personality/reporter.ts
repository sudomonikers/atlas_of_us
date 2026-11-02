// Reports a personality run: each persona's scores, attached by its test in personality.test.ts, against its targets
// and the previous run. Prints the report and saves the run to results/.
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { lastRun, saveRun } from '../harness.ts';
import { personas } from '../personas/index.ts';

type Scores = Record<string, { value?: number; confidence?: number }>;
type Outcome = Scores | { error: string };
type Run = Record<string, Outcome>;

const RESULTS = `${import.meta.dirname}/results`;
const UNMEASURED = 0.5; //a trait with no evidence, as the ui would place it

const failed = (o: Outcome | undefined): o is { error: string } => typeof o?.error === 'string';
const mae = (scores: Scores, targets: Record<string, number>) => {
  const traits = Object.keys(targets);
  return traits.reduce((sum, t) => sum + Math.abs((scores[t]?.value ?? UNMEASURED) - targets[t]), 0) / traits.length;
};
const f = (n?: number) => (n === undefined ? '  -  ' : n.toFixed(2));
const signed = (n?: number) => (n === undefined ? '  -  ' : (n >= 0 ? '+' : '') + n.toFixed(2));

function report(now: Run, previous?: Run) {
  const files = Object.keys(now);
  const lines = [];
  for (const file of files) {
    const p = personas[file];
    const scores = now[file];
    if (failed(scores)) {
      lines.push(`\n## ${p.name}: FAILED: ${scores.error}`);
      continue;
    }
    const { targets } = p.personality!;
    const prev = previous?.[file];
    const usablePrev = prev && !failed(prev) ? prev : undefined;
    lines.push(`\n## ${p.name} (${file}): error ${f(mae(scores, targets))}${usablePrev ? `, was ${f(mae(usablePrev, targets))}` : ''}`);
    lines.push('| Trait | Target | Now | Off by | Conf | Previous | Change |', '|---|---|---|---|---|---|---|');
    const traits = Object.keys(targets).sort((a, b) => Math.abs((scores[b]?.value ?? UNMEASURED) - targets[b]) - Math.abs((scores[a]?.value ?? UNMEASURED) - targets[a]));
    for (const t of traits) {
      const v = scores[t]?.value;
      const was = usablePrev?.[t]?.value;
      lines.push(`| ${t} | ${f(targets[t])} | ${v === undefined ? 'none' : f(v)} | ${signed((v ?? UNMEASURED) - targets[t])} | ${f(scores[t]?.confidence)} | ${f(was)} | ${v !== undefined && was !== undefined ? signed(v - was) : '  -  '} |`);
    }
  }
  const summary = ['| Persona | Error now | Previous | Change |', '|---|---|---|---|'];
  for (const file of files) {
    const { name, personality } = personas[file];
    const s = now[file];
    const prev = previous?.[file];
    const a = failed(s) ? undefined : mae(s, personality!.targets);
    const b = prev && !failed(prev) ? mae(prev, personality!.targets) : undefined;
    summary.push(`| ${name} | ${failed(s) ? 'FAILED' : f(a)} | ${f(b)} | ${a !== undefined && b !== undefined ? signed(a - b) : '  -  '} |`);
  }
  const ok = files.filter((file) => !failed(now[file]));
  const mean = ok.length ? ok.reduce((sum, file) => sum + mae(now[file] as Scores, personas[file].personality!.targets), 0) / ok.length : undefined;
  return `# Regression run ${new Date().toISOString()}\n\nAverage error ${f(mean)} (the mean gap between score and target)\n\n${summary.join('\n')}\n${lines.join('\n')}\n`;
}

export default class PersonalityReporter implements Reporter {
  private now: Run = {};

  onTestEnd(test: TestCase, result: TestResult) {
    if (test.parent.project()?.name !== 'personality') return;
    const scores = result.attachments.find((a) => a.name === 'scores')?.body;
    this.now[test.title] = scores && result.status === 'passed' ? JSON.parse(scores.toString()) : { error: result.error?.message?.split('\n')[0] ?? result.status };
  }

  onEnd() {
    if (!Object.keys(this.now).length) return;
    const previous = lastRun<Run>(RESULTS);
    //personas left out or failed keep their last good result, so the next run still has something to compare against
    const saved = { ...previous, ...Object.fromEntries(Object.entries(this.now).filter(([, r]) => !failed(r))) };
    const text = report(this.now, previous);
    console.log(`\n${text}\nSaved to ${saveRun(RESULTS, saved, text)}`);
  }

  printsToStdio() {
    return false;
  }
}
