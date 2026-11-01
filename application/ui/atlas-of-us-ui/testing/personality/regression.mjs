// The personality module (see documentation/architecture/ADRs/personality_testing_harness.md). Every persona with a
// `personality` has target scores and scripted answers. For each one, all at once: log in (creating the account the first
// time), play every scene through the local api the way the ui's ScriptPlayer does, wait for scoring, then read back the
// scores. Each account's answers are cleared first, so every run starts from nothing, like a new player.
// Prints each persona's scores against its targets and the previous run, and saves the run to results/.
import { call, lastRun, login, saveRun, sleep } from '../harness.mjs';

const scenes = `${import.meta.dirname}/../../src/personality`;
const SCENES = ['the_story_game', 'the_night_class', 'the_big_party', 'the_time_study', 'the_night_market', 'the_bad_day', 'the_dare', 'the_shoplifter', 'the_committee', 'the_houseguest', 'the_promotion', 'the_festival', 'the_free_weekend', 'the_stranger', 'the_emergency', 'the_feud', 'the_cabin', 'the_portrait']; //every scene, in play order

//walks one scene the way the ui's ScriptPlayer does, yielding each prompt with the persona's answer and the context the
//ui would send. A { choice, text } answer picks a choice with text as the reasoning, left is the clock's seconds
//remaining, and ran_out: true runs the clock out straight after that answer
function* walk(name, script, mine) {
  let pos = { section: script.start, index: 0 };
  let seen = []; //what the player saw since the last prompt
  let ranOut = false;
  while (pos) {
    const sec = script.sections[pos.section];
    const step = sec.steps[pos.index];
    let next;
    if (step.prompt) {
      const a = mine[step.id];
      if (a === undefined) throw new Error(`${name}: no answer for ${step.id}`);
      if (step.choices) seen.push(`Choices offered: ${step.choices.map((c) => c.label).join(' / ')}`);
      const label = step.choices?.[a.choice].label;
      const text = typeof a === 'string' ? a : a.text;
      const clock = script.clock && (ranOut ? { seconds: script.clock.seconds, left: 0, ran_out: true } : a.left !== undefined ? { seconds: script.clock.seconds, left: a.left, ran_out: false } : undefined);
      yield { key: step.id, answer: label ?? text, reasoning: label ? text : undefined, context: seen.join('\n'), facets: step.facets, clock };
      seen = [];
      if (step.choices) next = { section: step.choices[a.choice].next, index: 0 };
      if (a.ran_out) {
        next = { section: script.clock.late, index: 0 };
        ranOut = true;
      }
    } else {
      seen.push(step.speaker ? `${step.speaker}: ${step.text}` : step.text);
    }
    if (!next && pos.index + 1 < sec.steps.length) next = { ...pos, index: pos.index + 1 };
    else if (!next) next = sec.next && { section: sec.next, index: 0 };
    pos = next;
  }
}

const scripts = Object.fromEntries(await Promise.all(SCENES.map(async (name) => [name, Object.values(await import(`${scenes}/${name}/script.ts`))[0]])));

//plays one scene through the api, then waits for any scoring its last answer started, as the ui does before the next
//scene. Says whether it started one
async function playScene(name, mine, token) {
  const questions = Object.fromEntries((await call('GET', '/personality/progress', undefined, token)).questions[name].map((q) => [q.key, q]));
  let scored = false;
  for (const { key, ...answer } of walk(name, scripts[name], mine)) {
    if (!questions[key]) throw new Error(`${name}: ${key} isn't on the server`);
    scored = (await call('PUT', '/personality/answers', { question_id: questions[key].id, ...answer }, token)).scored;
  }
  await scoringDone(token);
  return scored;
}

const scoringDone = async (token) => {
  do await sleep(3000);
  while ((await call('GET', '/personality/scoring', undefined, token)).running);
};

//checks a persona without the api: every prompt on its path has an answer, every answer is used, and it has a target per trait
function check(persona, traits) {
  const problems = [];
  for (const scene of SCENES) {
    const used = new Set();
    try {
      for (const { key } of walk(scene, scripts[scene], persona.personality.answers[scene] ?? {})) used.add(key);
    } catch (e) {
      problems.push(e.message);
    }
    const unused = Object.keys(persona.personality.answers[scene] ?? {}).filter((k) => !used.has(k));
    if (unused.length) problems.push(`${scene}: unused answers ${unused.join(', ')}`);
  }
  const unknown = Object.keys(persona.personality.answers).filter((s) => !SCENES.includes(s));
  if (unknown.length) problems.push(`answers for scenes that don't exist: ${unknown.join(', ')}`);
  const missing = traits.filter((t) => !(t in persona.personality.targets));
  const extra = Object.keys(persona.personality.targets).filter((t) => !traits.includes(t));
  if (missing.length) problems.push(`no target for ${missing.join(', ')}`);
  if (extra.length) problems.push(`targets for traits that don't exist: ${extra.join(', ')}`);
  return problems;
}

async function run(persona) {
  const token = await login(persona);
  //start from nothing, so the run scores at the same points a new player's would
  await call('DELETE', '/personality/answers', undefined, token);
  let scored = false;
  for (const scene of SCENES) {
    if (!persona.personality.answers[scene]) throw new Error(`${persona.name}: no answers for ${scene}`);
    scored = await playScene(scene, persona.personality.answers[scene], token);
    process.stdout.write(`  ${persona.name}: ${scene}\n`);
  }
  //scoring only runs every few scenes, so unless the last one just scored, score once more from everything
  if (!scored) {
    await call('POST', '/personality/rescore', undefined, token);
    await scoringDone(token);
  }
  const profile = await call('GET', `/profiles/${persona.account.username}`, undefined, token);
  return Object.fromEntries(profile.personality.traits.map((t) => [t.name, { value: t.value, confidence: t.confidence }]));
}

// ---------------------------------------------------------------------------
// the report
// ---------------------------------------------------------------------------

const UNMEASURED = 0.5; //a trait with no evidence, as the ui would place it
const mae = (scores, targets) => {
  const traits = Object.keys(targets);
  return traits.reduce((sum, t) => sum + Math.abs((scores[t]?.value ?? UNMEASURED) - targets[t]), 0) / traits.length;
};
const f = (n) => (n === undefined ? '  -  ' : n.toFixed(2));
const signed = (n) => (n === undefined ? '  -  ' : (n >= 0 ? '+' : '') + n.toFixed(2));

function report(personas, now, previous) {
  const lines = [];
  for (const p of personas) {
    const scores = now[p.file];
    if (scores.error) {
      lines.push(`\n## ${p.name}: FAILED: ${scores.error}`);
      continue;
    }
    const { targets } = p.personality;
    const prev = previous?.[p.file];
    const usablePrev = prev && !prev.error ? prev : undefined;
    lines.push(`\n## ${p.name} (${p.file}): error ${f(mae(scores, targets))}${usablePrev ? `, was ${f(mae(usablePrev, targets))}` : ''}`);
    lines.push('| Trait | Target | Now | Off by | Conf | Previous | Change |', '|---|---|---|---|---|---|---|');
    const traits = Object.keys(targets).sort((a, b) => Math.abs((scores[b]?.value ?? UNMEASURED) - targets[b]) - Math.abs((scores[a]?.value ?? UNMEASURED) - targets[a]));
    for (const t of traits) {
      const v = scores[t]?.value;
      const was = usablePrev?.[t]?.value;
      lines.push(`| ${t} | ${f(targets[t])} | ${v === undefined ? 'none' : f(v)} | ${signed((v ?? UNMEASURED) - targets[t])} | ${f(scores[t]?.confidence)} | ${f(was)} | ${v !== undefined && was !== undefined ? signed(v - was) : '  -  '} |`);
    }
  }
  const summary = ['| Persona | Error now | Previous | Change |', '|---|---|---|---|'];
  for (const p of personas) {
    const s = now[p.file];
    const prev = previous?.[p.file];
    const a = s.error ? undefined : mae(s, p.personality.targets);
    const b = prev && !prev.error ? mae(prev, p.personality.targets) : undefined;
    summary.push(`| ${p.name} | ${s.error ? 'FAILED' : f(a)} | ${f(b)} | ${a !== undefined && b !== undefined ? signed(a - b) : '  -  '} |`);
  }
  const ok = personas.filter((p) => !now[p.file].error);
  const mean = ok.length ? ok.reduce((sum, p) => sum + mae(now[p.file], p.personality.targets), 0) / ok.length : undefined;
  return `# Regression run ${new Date().toISOString()}\n\nAverage error ${f(mean)} (the mean gap between score and target)\n\n${summary.join('\n')}\n${lines.join('\n')}\n`;
}

export default {
  about: 'plays every scene as each persona and scores its personality against its targets',
  options: '--check  checks every persona\'s answers and targets, without playing',
  async run({ personas, options, results }) {
    if (options.includes('--check')) {
      const traits = (await call('GET', '/personality/traits')).map((t) => t.name);
      let ok = true;
      for (const p of personas) {
        const problems = check(p, traits);
        ok &&= !problems.length;
        console.log(`${p.file}: ${problems.length ? '\n  ' + problems.join('\n  ') : 'ok'}`);
      }
      return ok;
    }

    const previous = lastRun(results);
    console.log(`Playing ${personas.length} personas in parallel...`);
    const started = Date.now();
    const scores = await Promise.all(personas.map((p) => run(p).catch((e) => ({ error: e.message }))));
    const now = Object.fromEntries(personas.map((p, i) => [p.file, scores[i]]));
    //personas left out or failed keep their last good result, so the next run still has something to compare against
    const saved = { ...previous, ...Object.fromEntries(Object.entries(now).filter(([, r]) => !r.error)) };

    const text = report(personas, now, previous);
    const path = saveRun(results, saved, text);
    console.log(text);
    console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s. Saved to ${path}`);
    return scores.every((s) => !s.error);
  },
};
