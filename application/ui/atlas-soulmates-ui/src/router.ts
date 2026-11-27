import { useSyncExternalStore } from 'react';

//a tiny history-api router: usePath re-renders on navigation, navigate changes the url without a reload
const NAVIGATE = 'atlas:navigate';

const subscribe = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  window.addEventListener(NAVIGATE, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(NAVIGATE, listener);
  };
};

export const usePath = () => useSyncExternalStore(subscribe, () => window.location.pathname);

//the url's query string, e.g. "?tab=topics", re-rendering when it changes
export const useSearch = () => useSyncExternalStore(subscribe, () => window.location.search);

export const navigate = (to: string) => {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAVIGATE));
};

//changes the url in place, without adding to the history: for state like an open tab, that the back button shouldn't step through
export const replace = (to: string) => {
  window.history.replaceState(null, '', to);
  window.dispatchEvent(new Event(NAVIGATE));
};
