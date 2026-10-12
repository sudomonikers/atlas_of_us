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

export const navigate = (to: string) => {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAVIGATE));
};
