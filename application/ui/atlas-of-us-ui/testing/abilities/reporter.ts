// Reports an Abilities run: where each persona stands on each ability, attached by its test in abilities.test.ts, against
// its targets and the previous run. An ability with nothing to compare its readings with yet, such as one shown only by
// a test compared with too few Atlas users, has no place, and is listed apart from the error. Prints the report and
// saves the run to results/.
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { lastRun, saveRun } from '../harness.ts';
import { personas } from '../personas/index.ts';

type Placed = Record<string, { value: number | null; confidence: number | null }>;
type Outcome = { abilities: Placed; misses: string[] } | { error: string };
type Run = Record<string, Outcome>;

const RESULTS = `${import.meta.dirname}/results`;

const failed = (o: Outcome | undefined): o is { error: string } => typeof (o as { error?: string } | undefined)?.error === 'string';
const f = (n?: number | null) => (n === undefined || n === null ? '  -  ' : n.toFixed(2));
const signed = (n?: number) => (n === undefined ? '  -  ' : (n >= 0 ? '+' : '') + n.toFixed(2));
//the traits with a target that have a place, and the mean gap between their place and their target
function error(abilities: Placed, targets: Record<string, number>) {
  const placed = Object.keys(targets).filter((a) => abilities[a]?.value != null);
  return placed.length ? placed.reduce((sum, a) => sum + Math.abs(abilities[a].value! - targets[a]), 0) / placed.length : undefined;
}

function report(now: Run, previous?: Run) {
  const files = Object.keys(now);
  const lines = [];
  for (const file of files) {
    const p = personas[file];
    const o = now[file];
    if (failed(o)) {
      lines.push(`\n## ${p.name}: FAILED: ${o.error}`);
      continue;
    }
    const { targets } = p.abilities!;
    const prev = previous?.[file];
    const was = prev && !failed(prev) ? prev.abilities : undefined;
    const e = error(o.abilities, targets);
    lines.push(`\n## ${p.name} (${file}): error ${f(e)}${was ? `, was ${f(error(was, targets))}` : ''}`);
    if (o.misses.length) lines.push('', ...o.misses.map((m) => `- Played wrong: ${m}`));
    const placed = Object.keys(targets).filter((a) => o.abilities[a]?.value != null);
    const unplaced = Object.keys(targets).filter((a) => o.abilities[a]?.value == null);
    lines.push('', '| Ability | Target | Now | Off by | Conf | Previous | Change |', '|---|---|---|---|---|---|---|');
    placed.sort((a, b) => Math.abs(o.abilities[b].value! - targets[b]) - Math.abs(o.abilities[a].value! - targets[a]));
    for (const a of placed) {
      const v = o.abilities[a].value!;
      const before = was?.[a]?.value ?? undefined;
      lines.push(`| ${a} | ${f(targets[a])} | ${f(v)} | ${signed(v - targets[a])} | ${f(o.abilities[a].confidence)} | ${f(before)} | ${before !== undefined ? signed(v - before) : '  -  '} |`);
    }
    if (unplaced.length) lines.push('', `Nothing to compare with yet: ${unplaced.join(', ')}`);
  }
  const summary = ['| Persona | Error now | Previous | Change | Placed | Played wrong |', '|---|---|---|---|---|---|'];
  for (const file of files) {
    const { name, abilities: mine } = personas[file];
    const o = now[file];
    const prev = previous?.[file];
    const a = failed(o) ? undefined : error(o.abilities, mine!.targets);
    const b = prev && !failed(prev) ? error(prev.abilities, mine!.targets) : undefined;
    const placed = failed(o) ? '  -  ' : `${Object.keys(mine!.targets).filter((t) => o.abilities[t]?.value != null).length} of ${Object.keys(mine!.targets).length}`;
    summary.push(`| ${name} | ${failed(o) ? 'FAILED' : f(a)} | ${f(b)} | ${a !== undefined && b !== undefined ? signed(a - b) : '  -  '} | ${placed} | ${failed(o) ? '  -  ' : o.misses.length} |`);
  }
  const errors = files.flatMap((file) => {
    const o = now[file];
    const e = failed(o) ? undefined : error(o.abilities, personas[file].abilities!.targets);
    return e === undefined ? [] : [e];
  });
  const mean = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : undefined;
  return `# Abilities run ${new Date().toISOString()}\n\nAverage error ${f(mean)} (the mean gap between where an ability is placed and its target)\n\n${summary.join('\n')}\n${lines.join('\n')}\n`;
}

export default class AbilitiesReporter implements Reporter {
  private now: Run = {};

  onTestEnd(test: TestCase, result: TestResult) {
    if (test.parent.project()?.name !== 'abilities') return;
    const abilities = result.attachments.find((a) => a.name === 'abilities')?.body;
    //a test that played through but saved a reading other than the one it played to still has its abilities
    const misses = result.errors.map((e) => e.message?.split('\n')[0] ?? '').filter((m) => / was saved as /.test(m));
    this.now[test.title] = abilities && (result.status === 'passed' || misses.length === result.errors.length)
      ? { abilities: JSON.parse(abilities.toString()), misses }
      : { error: result.error?.message?.split('\n')[0] ?? result.status };
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
