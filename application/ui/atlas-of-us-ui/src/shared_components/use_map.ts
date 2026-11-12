import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MapItem } from './bloom';

//a node of a module's map: a skill, a topic, with the ids of the broader nodes it sits under
interface MapNode {
  id: string;
  name: string;
  status: string;
  broader: string[];
}

//each map's fetch, kept for the rest of the visit
const fetched = new Map<() => Promise<MapNode[]>, Promise<MapNode[]>>();

//starts fetching a map before a board needs it, so it's there when one opens
export function preloadMap(load: () => Promise<MapNode[]>) {
  if (fetched.has(load)) return;
  const loading = load();
  loading.catch(() => fetched.delete(load));
  fetched.set(load, loading);
}

//every node of a module's map, for its board. `add` puts a node on the map that was just asked for, without fetching
//it again
export function useMap<T extends MapNode>(load: () => Promise<T[]>) {
  const [nodes, setNodes] = useState<T[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!fetched.has(load)) fetched.set(load, load());
    (fetched.get(load) as Promise<T[]>).then(setNodes).catch((e) => {
      fetched.delete(load);
      setError(e instanceof Error ? e.message : String(e));
    });
  }, [load]);

  const add = useCallback(
    (node: T) => {
      const fresh = (list: T[]) => (list.some((n) => n.id === node.id) ? list : [...list, node]);
      const kept = fetched.get(load) as Promise<T[]> | undefined;
      if (kept) fetched.set(load, kept.then(fresh));
      setNodes((list) => list && fresh(list));
    },
    [load],
  );

  const byId = useMemo(() => new Map((nodes ?? []).map((n) => [n.id, n])), [nodes]);
  const items = useMemo<MapItem[]>(() => (nodes ?? []).map((n) => ({ id: n.id, name: n.name, broader: n.broader, filled: n.status === 'ready' })), [nodes]);
  return { nodes, items, byId, error, add };
}
