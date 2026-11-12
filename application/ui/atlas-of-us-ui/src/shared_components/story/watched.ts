import { useSyncExternalStore } from 'react';

//someone logged out who watches the story that opens a module has it noted for the visit, so logging in afterwards
//doesn't play it again, and it's saved on their account once they're in. One per story, by name
export function watchedFlag(story: string) {
  const key = `atlas.${story}-intro-watched`;
  const listeners = new Set<() => void>();

  const read = () => {
    try {
      return sessionStorage.getItem(key) === 'yes';
    } catch {
      return false;
    }
  };

  const useWatched = () =>
    useSyncExternalStore((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }, read);

  const noteWatched = (watched: boolean) => {
    try {
      if (watched) sessionStorage.setItem(key, 'yes');
      else sessionStorage.removeItem(key);
    } catch {
      //without storage, logging in plays it once more
    }
    listeners.forEach((listener) => listener());
  };

  return { useWatched, noteWatched };
}
