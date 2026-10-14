// QA runner (see ai_testing.md). Plays scenes through the local api the way the ui's ScriptPlayer does: walks each
// script, builds each prompt's context, saves the answer, and after a scene's last answer waits for scoring to finish.
// Reads the token from line 6 of ai_testing.md.
//   node src/personality/testing/play.mjs src/personality/testing/personality_round_1_answers.mjs [scene...]
// The answers file exports order (scene ids, earlier scenes first since later ones recall them) and answers
// (scene -> prompt id -> a string, or { choice, text } where text is the reasoning; left is the clock's seconds remaining).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = import.meta.dirname; //this testing folder; the scenes are one up
const API = 'http://localhost:3000/api/personality';
const token = readFileSync(`${dir}/ai_testing.md`, 'utf8').split('\n')[5].trim();
const [file, ...only] = process.argv.slice(2);
const { answers, order } = await import(resolve(file));

const call = async (method, path, body) => {
  const r = await fetch(API + path, { method, headers: { 'x-atlas-token': token, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 202 ? null : r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
//scene -> prompt id -> saved answer, for sections that recall earlier answers, like the ui does
const given = {};
for (const a of await call('GET', '/progress')) (given[a.scenario] ??= {})[a.question_key] = a.answer;

for (const name of only.length ? only : order) {
  const script = Object.values(await import(`${dir}/../${name}/script.ts`))[0];
  const questions = Object.fromEntries((await call('GET', `/scenarios/${name}/questions`)).map((q) => [q.key, q]));
  const mine = answers[name];
  given[name] ??= {};
  let pos = { section: script.start, index: 0 };
  let seen = []; //what the player saw since the last prompt
  let scored = false;
  while (pos) {
    const sec = script.sections[pos.section];
    const step = sec.steps[pos.index];
    let next;
    if (step.prompt) {
      const a = mine[step.id];
      if (a === undefined) throw new Error(`${name}: no answer for ${step.id}`);
      const q = questions[step.id];
      if (!q) throw new Error(`${name}: ${step.id} isn't on the server`);
      if (step.choices) seen.push(`Choices offered: ${step.choices.map((c) => c.label).join(' / ')}`);
      const label = step.choices?.[a.choice].label;
      const text = typeof a === 'string' ? a : a.text;
      const clock = script.clock && a.left !== undefined ? { seconds: script.clock.seconds, left: a.left, ran_out: false } : undefined;
      const saved = await call('PUT', '/answers', { question_id: q.id, answer: label ?? text, reasoning: label ? text : undefined, context: seen.join('\n'), clock });
      console.log(`${name}/${step.id}: ${label ?? text.slice(0, 50)}${saved.scored ? '  [scoring]' : ''}`);
      scored ||= saved.scored;
      if (label) given[name][step.id] = label;
      seen = [];
      if (step.choices) next = { section: step.choices[a.choice].next, index: 0 };
    } else {
      seen.push(step.speaker ? `${step.speaker}: ${step.text}` : step.text);
    }
    if (!next && pos.index + 1 < sec.steps.length) next = { ...pos, index: pos.index + 1 };
    else if (!next) {
      const r = sec.recall;
      const target = (r && r.choices[given[r.scenario]?.[r.question]]) || sec.next;
      next = target && { section: target, index: 0 };
    }
    pos = next;
  }
  if (!scored) throw new Error(`${name}: never triggered scoring`);
  const t = Date.now();
  do await sleep(5000); while ((await call('GET', '/scoring')).running);
  console.log(`  ${name} scored in ${Math.round((Date.now() - t) / 1000)}s`);
}
