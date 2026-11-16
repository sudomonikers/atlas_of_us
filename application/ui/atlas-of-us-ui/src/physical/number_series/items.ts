import { between, seeded } from '../test_kit';

export interface NumberSeries {
  shown: number[];
  answer: number;
}

//each rule makes a series of `length` numbers from random settings, easiest first
const RULES: ((r: () => number) => number[])[] = [
  (r) => { const a = between(r, 2, 9), s = between(r, 1, 20); return Array.from({ length: 7 }, (_, i) => s + a * i); },
  (r) => { const a = between(r, 3, 9), s = between(r, 60, 99); return Array.from({ length: 7 }, (_, i) => s - a * i); },
  (r) => { const s = between(r, 1, 5); return Array.from({ length: 7 }, (_, i) => s * 2 ** i); },
  (r) => { let x = between(r, 1, 10), d = between(r, 1, 3); return Array.from({ length: 7 }, () => { const v = x; x += d++; return v; }); },
  (r) => { const a = between(r, 2, 5), b = between(r, 6, 10); let x = between(r, 1, 10); return Array.from({ length: 7 }, (_, i) => { const v = x; x += i % 2 ? b : a; return v; }); },
  (r) => { const a = between(r, 2, 6), b = between(r, 1, 4); let x = between(r, 1, 9), y = between(r, 40, 60); return Array.from({ length: 8 }, (_, i) => { if (i % 2) { const v = y; y -= b; return v; } const v = x; x += a; return v; }); },
  (r) => { const k = between(r, 1, 4); return Array.from({ length: 6 }, (_, i) => (k + i) ** 2); },
  (r) => { const c = between(r, 1, 4); let x = between(r, 1, 4); return Array.from({ length: 7 }, (_, i) => { const v = x; x = i % 2 ? x + c : x * 2; return v; }); },
  (r) => { const out = [between(r, 1, 4), between(r, 2, 6)]; while (out.length < 7) out.push(out[out.length - 1] + out[out.length - 2]); return out; },
  (r) => { let x = between(r, 3, 12), d = between(r, 1, 3); return Array.from({ length: 7 }, () => { const v = x; x += d; d *= 2; return v; }); },
  (r) => { const a = between(r, 2, 4); let x = between(r, 1, 6); return Array.from({ length: 7 }, (_, i) => { const v = x; x += (i + 1) * a; return v; }); },
  (r) => { const s = between(r, 1, 3); return Array.from({ length: 6 }, (_, i) => s * 3 ** i); },
  (r) => { const a = between(r, 1, 5); let x = between(r, 6, 12); return Array.from({ length: 7 }, (_, i) => { const v = x; x = i % 2 ? x - a : x * 2; return v; }); },
  (r) => { const k = between(r, 1, 3); return Array.from({ length: 6 }, (_, i) => (k + i) ** 3); },
  (r) => { let x = between(r, 1, 3), y = between(r, 1, 9); const c = between(r, 2, 5); return Array.from({ length: 8 }, (_, i) => { if (i % 2) { const v = y; y += c; return v; } const v = x; x *= 2; return v; }); },
  (r) => { let x = between(r, 2, 5); const c = between(r, 1, 3); return Array.from({ length: 6 }, () => { const v = x; x = x * 2 + c; return v; }); },
];

function series(seed: number, rules: number[]): NumberSeries[] {
  const random = seeded(seed);
  return rules.map((i) => {
    const all = RULES[i](random);
    return { shown: all.slice(0, -1), answer: all[all.length - 1] };
  });
}

export const SERIES_PRACTICE = series(11, [0, 2]);
export const SERIES_ITEMS = series(2026, RULES.map((_, i) => i));
