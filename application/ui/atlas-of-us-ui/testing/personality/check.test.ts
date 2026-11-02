// Checks every persona's personality without playing anything: every prompt on its path has an answer, every answer is
// used, any clock it runs out is running, and it has a target for every trait the api scores. Run after any change to a
// scene's prompts.
import { expect, test } from '@playwright/test';
import { call } from '../harness.ts';
import { personas } from '../personas/index.ts';
import type { Persona } from '../personas/persona.ts';
import { SCENES, walk } from './scenes.ts';

function problems({ personality }: Persona, traits: string[]) {
  const found: string[] = [];
  if (!personality) return found;
  for (const [scene, script] of Object.entries(SCENES)) {
    const used = new Set<string>();
    try {
      for (const { key } of walk(scene, script, personality.answers[scene] ?? {})) if (key) used.add(key);
    } catch (e) {
      found.push((e as Error).message);
    }
    const unused = Object.keys(personality.answers[scene] ?? {}).filter((k) => !used.has(k));
    if (unused.length) found.push(`${scene}: unused answers ${unused.join(', ')}`);
  }
  const unknown = Object.keys(personality.answers).filter((s) => !(s in SCENES));
  if (unknown.length) found.push(`answers for scenes that don't exist: ${unknown.join(', ')}`);
  const missing = traits.filter((t) => !(t in personality.targets));
  const extra = Object.keys(personality.targets).filter((t) => !traits.includes(t));
  if (missing.length) found.push(`no target for ${missing.join(', ')}`);
  if (extra.length) found.push(`targets for traits that don't exist: ${extra.join(', ')}`);
  return found;
}

let traits: string[];
test.beforeAll(async () => {
  traits = (await call<{ name: string }[]>('GET', '/personality/traits')).map((t) => t.name);
});

for (const [file, persona] of Object.entries(personas)) {
  if (!persona.personality) continue;
  test(file, () => {
    expect(problems(persona, traits)).toEqual([]);
  });
}
