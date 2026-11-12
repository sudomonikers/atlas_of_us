import { useSyncExternalStore } from 'react';

//someone logged out who watches the story that opens Physical Traits has it noted for the visit, so logging in from
//the chapters doesn't play it again, and it's saved on their account once they're in
const KEY = 'atlas.physical-intro-watched';
const listeners = new Set<() => void>();

const read = () => {
  try {
    return sessionStorage.getItem(KEY) === 'yes';
  } catch {
    return false;
  }
};

export const useWatched = () =>
  useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, read);

export const noteWatched = (watched: boolean) => {
  try {
    if (watched) sessionStorage.setItem(KEY, 'yes');
    else sessionStorage.removeItem(KEY);
  } catch {
    //without storage, logging in plays it once more
  }
  listeners.forEach((listener) => listener());
};
