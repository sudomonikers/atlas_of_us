import { useEffect, useRef, useState, type CSSProperties } from 'react';

//STYLE_GUIDE.md palette, defined as variables in App.css
export const blue = 'var(--air-force-blue)';
export const brownRed = 'var(--brown-red)';
export const cinnamon = 'var(--cinnamon-wood)';
export const gunmetal = 'var(--gunmetal-black)';
export const ivory = 'var(--ivory-white)';
export const comic = 'var(--font-comic)';

//the ms since a time from performance.now(), called from handlers, effects and timers
export const since = (t: number) => performance.now() - t;
//the time now, for since(), called from handlers and effects
export const now = () => performance.now();

//a random number generator that gives the same numbers for the same seed, so everyone gets the same test
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

//a random number from 0 to 1, called from handlers and timers
export const chance = () => Math.random();

//a whole number from `from` to `to`, inclusive
export const between = (random: () => number, from: number, to: number) => from + Math.floor(random() * (to - from + 1));

//one of a list
export const pick = <T,>(random: () => number, xs: readonly T[]): T => xs[Math.floor(random() * xs.length)];

//a list in a random order
export function shuffled<T>(random: () => number, xs: readonly T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

//the seconds left of a timed test while it runs, calling onOver once when they run out
export function useCountdown(seconds: number, running: boolean, onOver: () => void) {
  const [left, setLeft] = useState(seconds);
  const over = useRef(onOver);
  useEffect(() => {
    over.current = onOver;
  });
  useEffect(() => {
    if (!running) return;
    const start = now();
    const tick = window.setInterval(() => {
      const remaining = Math.max(0, seconds - since(start) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        over.current();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [seconds, running]);
  return left;
}

//seconds as m:ss
export const clock = (seconds: number) => {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

//the styles every test shares
export const testStyles: Record<string, CSSProperties> = {
  frame: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 16px',
    background: '#fff',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 12,
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  text: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.45,
  },
  arena: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    padding: 12,
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    font: 'inherit',
    color: gunmetal,
    cursor: 'pointer',
    touchAction: 'manipulation',
    userSelect: 'none',
  },
  prompt: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  input: {
    width: 180,
    padding: '6px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    font: 'inherit',
    fontSize: 22,
    letterSpacing: 3,
  },
  choice: {
    padding: '18px 10px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    font: 'inherit',
    fontSize: 17,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  status: {
    margin: 0,
    minHeight: 20,
    fontSize: 14,
  },
  primary: {
    alignSelf: 'flex-start',
    padding: '4px 14px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  secondary: {
    alignSelf: 'flex-start',
    padding: '4px 14px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
};
