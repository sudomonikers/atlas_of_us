import { useEffect, useRef, useState } from 'react';
import { searchSkills, type SkillSummary } from './api';

//how long typing has to pause before it searches
const DEBOUNCE_MS = 250;

//a search box's query, and its results once they've come back
export interface SearchState {
  query: string;
  results?: SkillSummary[]; //for the query, once it has come back
}

//searches for skills as the user types. The caller keeps the state, so it can outlive the search box, and this
//fills in the results once typing pauses. Returns the error from the last search, if it failed
export function useSkillSearch({ query, results }: SearchState, onSearch: (search: SearchState) => void) {
  const [error, setError] = useState<string>();
  const latest = useRef(query); //the query a response has to match to be shown

  useEffect(() => {
    latest.current = query;
    if (!query.trim() || results) return;
    const timer = window.setTimeout(
      () =>
        searchSkills(query).then(
          (found) => {
            if (latest.current !== query) return;
            onSearch({ query, results: found });
            setError(undefined);
          },
          (e) => latest.current === query && setError(e instanceof Error ? e.message : String(e)),
        ),
      DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query, results, onSearch]);

  return error;
}
