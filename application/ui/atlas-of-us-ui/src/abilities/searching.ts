import { useEffect, useState } from 'react';
import { search, type Found } from './api';
import { failure } from '../shared_components/use_save';

//how long typing has to pause before it's searched, in ms
const PAUSE = 300;

//what a search finds once typing pauses, for the search as it was typed: none while it's being searched, and an error
//when it couldn't be
export function useFound(query: string, only?: 'parts') {
  const [found, setFound] = useState<{ query: string; found: Found }>();
  const [error, setError] = useState<{ query: string; message: string }>();
  const q = query.trim();
  useEffect(() => {
    if (!q) return;
    let live = true;
    const timer = setTimeout(() => {
      search(q, only).then(
        (f) => live && setFound({ query: q, found: f }),
        (e) => live && setError({ query: q, message: failure(e) }),
      );
    }, PAUSE);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q, only]);
  return {
    searched: !!q,
    found: q && found?.query === q ? found.found : undefined,
    error: q && error?.query === q ? error.message : undefined,
  };
}
