import { chance } from './test_kit';

//how many tries of a reaction test are practice
export const PRACTICE = 5;

//a wait of a random length, in ms
export const pause = (from: number, to: number) => from + chance() * (to - from);

//the time a target was painted, for timing a reaction from when it could first be seen
export function painted(set: (t: number) => void) {
  requestAnimationFrame(() => requestAnimationFrame(() => set(performance.now())));
}

export type Phase = 'ready' | 'waiting' | 'shown' | 'done';
