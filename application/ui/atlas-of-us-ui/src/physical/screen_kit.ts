// What the animations of the tests played on a screen share: easing, and timing what happens when.

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (p: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, p)))) / 2;
//how far through a stretch of time a moment is, 0 before it and 1 after
export const through = (time: number, from: number, to: number) => Math.min(1, Math.max(0, (time - from) / (to - from)));
//text typed a letter at a time from a moment on
export const typed = (text: string, time: number, from: number, each = 0.12) => text.slice(0, Math.max(0, Math.floor((time - from) / each)));
