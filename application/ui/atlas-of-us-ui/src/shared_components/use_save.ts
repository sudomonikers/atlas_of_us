import { useCallback, useState } from 'react';

//what went wrong, as a message to show
export const failure = (e: unknown) => (e instanceof Error ? e.message : String(e));

//a save in progress and what went wrong with the last one. run does the work, clearing the error first, and hands its
//result on once it's done, or keeps the error when it fails
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const run = useCallback(<T,>(work: Promise<T>, done: (result: T) => void = () => {}) => {
    setSaving(true);
    setError(undefined);
    work.then(
      (result) => {
        setSaving(false);
        done(result);
      },
      (e) => {
        setSaving(false);
        setError(failure(e));
      },
    );
  }, []);
  return { saving, error, setError, run };
}
