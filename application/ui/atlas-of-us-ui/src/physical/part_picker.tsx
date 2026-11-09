import { useMemo, useState, type CSSProperties } from 'react';
import { capitalised, type BodyFunction, type PartSummary } from './api';
import { Disclosure } from '../shared_components/disclosure';
import { SearchField } from '../shared_components/search_field';
import { matchesAll, searchWords } from '../shared_components/search';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//the most search results shown at once
const MAX_RESULTS = 40;

type Kind = 'functions' | 'parts';

const KINDS: { kind: Kind; label: string; placeholder: string }[] = [
  { kind: 'functions', label: 'Body functions', placeholder: 'Memory, hearing, balance...' },
  { kind: 'parts', label: 'Body parts', placeholder: 'Knee, spinal cord, retina...' },
];

//what was picked: a function, or a part
export type Picked = { kind: 'function'; item: BodyFunction } | { kind: 'part'; item: PartSummary };

interface PartPickerProps {
  functions: BodyFunction[];
  parts: PartSummary[];
  onPick: (picked: Picked) => void;
}

//finds a body function or part, by searching for it or browsing down from the broadest ones
export function PartPicker({ functions, parts, onPick }: PartPickerProps) {
  const [kind, setKind] = useState<Kind>('functions');
  const [query, setQuery] = useState('');
  const functionChildren = useMemo(() => {
    const by = new Map<string, BodyFunction[]>();
    for (const f of functions) if (f.parent) by.set(f.parent, [...(by.get(f.parent) ?? []), f]);
    return by;
  }, [functions]);
  const partChildren = useMemo(() => {
    const by = new Map<string, PartSummary[]>();
    for (const p of parts) for (const w of p.wholes) by.set(w, [...(by.get(w) ?? []), p]);
    return by;
  }, [parts]);
  const groups = [...new Set(functions.map((f) => f.group))];
  const roots = parts.filter((p) => !p.wholes.length && partChildren.has(p.id));

  //every word of the search has to be in its name, or in what it includes or another name for it
  const words = searchWords(query);
  const matches = (texts: string[]) => matchesAll(words, texts);
  const results: Picked[] = !words.length
    ? []
    : kind === 'functions'
      ? functions.filter((f) => matches([f.name, f.description ?? '', ...f.includes])).map((item) => ({ kind: 'function', item }))
      : parts.filter((p) => matches([p.name, ...p.synonyms])).map((item) => ({ kind: 'part', item }));

  return (
    <div style={styles.picker}>
      <div style={styles.kinds} role="group" aria-label="Kind">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            className="comic-lift"
            style={kind === k.kind ? { ...styles.kind, ...styles.picked } : styles.kind}
            aria-pressed={kind === k.kind}
            onClick={() => setKind(k.kind)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <SearchField id="part-search" query={query} onQuery={setQuery} placeholder={KINDS.find((k) => k.kind === kind)!.placeholder} />
      {words.length > 0 ? (
        <>
          {!results.length && <p style={styles.text}>Nothing matches that. Try another word, or clear it to browse.</p>}
          <ul style={styles.list}>
            {results.slice(0, MAX_RESULTS).map((r) => (
              <li key={r.item.id} style={styles.node}>
                <button className="comic-lift" style={styles.pick} onClick={() => onPick(r)}>
                  {r.kind === 'part' ? capitalised(r.item.name) : r.item.name}
                </button>
                {r.kind === 'function' && <span style={styles.where}>{r.item.group}</span>}
              </li>
            ))}
          </ul>
          {results.length > MAX_RESULTS && <p style={styles.text}>And {results.length - MAX_RESULTS} more. Add a word to narrow it down.</p>}
        </>
      ) : kind === 'functions' ? (
        groups.map((group) => (
          <div key={group} style={styles.group}>
            <Disclosure label={group} style={styles.groupToggle}>
              <ul style={styles.list}>
                {functions.filter((f) => f.group === group && !f.parent).map((f) => (
                  <Branch key={f.id} id={f.id} label={f.name} depth={0} childrenOf={(id) => (functionChildren.get(id) ?? []).map((c) => ({ id: c.id, label: c.name }))} onPick={(id) => onPick({ kind: 'function', item: functions.find((x) => x.id === id)! })} />
                ))}
              </ul>
            </Disclosure>
          </div>
        ))
      ) : (
        <ul style={styles.list}>
          {roots.map((p) => (
            <Branch key={p.id} id={p.id} label={capitalised(p.name)} depth={0} childrenOf={(id) => (partChildren.get(id) ?? []).map((c) => ({ id: c.id, label: capitalised(c.name) }))} onPick={(id) => onPick({ kind: 'part', item: parts.find((x) => x.id === id)! })} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface BranchProps {
  id: string;
  label: string;
  depth: number;
  childrenOf: (id: string) => { id: string; label: string }[];
  onPick: (id: string) => void;
}

//one entry of the browsing tree, whose narrower entries are only drawn once it's opened
function Branch({ id, label, depth, childrenOf, onPick }: BranchProps) {
  const [open, setOpen] = useState(false);
  const children = childrenOf(id);
  return (
    <li style={{ ...styles.node, paddingLeft: depth * 16 }}>
      <button className="comic-lift" style={styles.pick} onClick={() => onPick(id)}>
        {label}
      </button>
      {!!children.length && (
        <button style={styles.more} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {children.length} more specific {open ? '▲' : '▼'}
        </button>
      )}
      {open && (
        <ul style={styles.list}>
          {children.map((c) => (
            <Branch key={c.id} id={c.id} label={c.label} depth={depth + 1} childrenOf={childrenOf} onPick={onPick} />
          ))}
        </ul>
      )}
    </li>
  );
}

const styles: Record<string, CSSProperties> = {
  picker: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  kinds: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  kind: {
    padding: '4px 14px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  picked: {
    background: brownRed,
    color: ivory,
  },
  text: {
    margin: 0,
    fontSize: 14,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingBottom: 6,
    borderBottom: `1px dashed ${gunmetal}`,
  },
  groupToggle: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    color: brownRed,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  node: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  pick: {
    padding: '2px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    font: 'inherit',
    fontSize: 15,
    textAlign: 'left',
    cursor: 'pointer',
  },
  where: {
    fontSize: 12,
    paddingLeft: 4,
  },
  more: {
    padding: '0 4px',
    background: 'none',
    border: 'none',
    color: 'var(--cinnamon-wood)',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  },
};
