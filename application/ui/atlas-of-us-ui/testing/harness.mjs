// What every module's regression test shares: calling the local api as a persona, and saving each run to the module's
// results/ folder so the next run has something to compare against.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const API = 'http://localhost:3000/api';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function call(method, path, body, token) {
  const headers = { 'content-type': 'application/json', ...(token && { 'x-atlas-token': token }) };
  //a minute is far longer than any call should take, so a hung api fails the persona instead of the whole run
  const r = await fetch(API + path, { method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(60000) }).catch((e) => {
    throw new Error(`${method} ${path}: ${e.name === 'TimeoutError' ? 'no response after 60s' : e.message}`);
  });
  if (!r.ok) throw Object.assign(new Error(`${method} ${path}: ${r.status} ${await r.text()}`), { status: r.status });
  return r.status === 202 || r.status === 204 ? null : r.json();
}

//logs in, or creates the account if it doesn't exist yet
export async function login({ account }) {
  try {
    return (await call('POST', '/auth/login', { phone: account.phone, password: account.password })).token;
  } catch (e) {
    if (e.status !== 401 && e.status !== 404) throw e;
    return (await call('POST', '/auth/create-user', account)).token;
  }
}

//the saved JSON of a module's last run, if it has one
export function lastRun(results) {
  mkdirSync(results, { recursive: true });
  const runs = readdirSync(results).filter((f) => f.endsWith('.json')).sort();
  return runs.length ? JSON.parse(readFileSync(`${results}/${runs[runs.length - 1]}`, 'utf8')) : undefined;
}

//saves a run as JSON, for the next run to compare against, and as its markdown report. Returns the report's path
export function saveRun(results, json, report) {
  mkdirSync(results, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(`${results}/${stamp}.json`, JSON.stringify(json, null, 1));
  writeFileSync(`${results}/${stamp}.md`, report);
  return `${results}/${stamp}.md`;
}
