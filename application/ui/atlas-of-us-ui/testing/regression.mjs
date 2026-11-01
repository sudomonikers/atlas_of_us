// Regression tests for the Atlas modules, played through the local api by the test personas in personas/ (see
// documentation/architecture/ADRs/personality_testing_harness.md). Each module is a folder here with a regression.mjs,
// picked by a flag of the folder's name. A persona takes part in a module when it has that module's key, e.g.
// `personality: { targets, answers }`. Run from the UI folder:
//   node testing/regression.mjs --personality              every persona with a personality, through the personality module
//   node testing/regression.mjs --personality ruth jules   only these (persona file names)
//   node testing/regression.mjs --personality --check      the module's own options, here checking without playing
// Several module flags run each module in turn.
import { existsSync, readdirSync } from 'node:fs';

const dir = import.meta.dirname; //this testing folder

const modules = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${dir}/${d.name}/regression.mjs`))
  .map((d) => d.name);
const files = readdirSync(`${dir}/personas`).filter((f) => f.endsWith('.mjs')).map((f) => f.slice(0, -4));

const args = process.argv.slice(2);
const picked = modules.filter((m) => args.includes(`--${m}`));
const options = args.filter((a) => a.startsWith('--') && !picked.includes(a.slice(2)));
const only = args.filter((a) => !a.startsWith('--'));
const unknown = only.filter((f) => !files.includes(f));

if (!picked.length || unknown.length) {
  if (unknown.length) console.log(`No persona called ${unknown.join(', ')}. The personas are ${files.join(', ')}.\n`);
  console.log(`Usage: node testing/regression.mjs --<module>... [persona...] [module options]`);
  for (const m of modules) {
    const { about, options } = (await import(`${dir}/${m}/regression.mjs`)).default;
    console.log(`  --${m}  ${about}${options ? `\n  ${' '.repeat(m.length + 2)}  ${options}` : ''}`);
  }
  process.exit(1);
}

const all = await Promise.all(files.filter((f) => !only.length || only.includes(f)).map(async (file) => ({ file, ...(await import(`${dir}/personas/${file}.mjs`)).default })));

let ok = true;
for (const m of picked) {
  const module = (await import(`${dir}/${m}/regression.mjs`)).default;
  const personas = all.filter((p) => p[m]);
  console.log(`\n# ${m}: ${personas.length} persona${personas.length === 1 ? '' : 's'}`);
  if (!personas.length) continue;
  ok = (await module.run({ personas, options, results: `${dir}/${m}/results` })) && ok;
}
process.exit(ok ? 0 : 1);
