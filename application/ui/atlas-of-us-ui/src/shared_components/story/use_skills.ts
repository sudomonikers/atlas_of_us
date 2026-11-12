import { useEffect, useState } from 'react';
import { requestFill, type Skill } from '../../skills/api';
import { useSession } from '../../auth/api';
import { findSkill, readSkill } from './atlas';

//how often a skill being written is checked on
const FILL_POLL_MS = 4000;

//skills by name, once every one of them has its levels written. Asking for one to be written takes an account, so for
//anyone logged out it waits on one being written already
export function useSkills(names: string[]) {
  const signedIn = useSession().status === 'authenticated';
  const [skills, setSkills] = useState<Skill[]>();
  const [waiting, setWaiting] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    let timer = 0;
    const load = async () => {
      try {
        const read = await Promise.all(names.map(async (name) => readSkill((await findSkill(name)).id)));
        if (!live) return;
        const unready = read.filter((s) => s.status !== 'ready');
        if (signedIn) for (const s of unready) if (s.status === 'stub' || s.status === 'failed') await requestFill(s.id);
        if (unready.length) {
          setWaiting(`Writing the levels of ${unready.map((s) => s.name).join(' and ')}`);
          timer = window.setTimeout(load, FILL_POLL_MS);
        } else setSkills(read);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [names, signedIn]);
  return { skills, waiting, error };
}

//the level shown: the step's, until the user picks another on the ladder
export function useRank(given: number) {
  const [rank, setRank] = useState(given);
  const [lastGiven, setLastGiven] = useState(given);
  if (given !== lastGiven) {
    setLastGiven(given);
    setRank(given);
  }
  return [rank, setRank] as const;
}
