import { useMemo, useState, type CSSProperties } from 'react';
import type { BodyPart } from './api';
import { Disclosure } from '../shared_components/disclosure';
import { SearchField } from '../shared_components/search_field';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the most search results shown at once
const MAX_RESULTS = 40;

type Kind = 'functions' | 'structures';

const KINDS: { kind: Kind; label: string; placeholder: string }[] = [
  { kind: 'functions', label: 'Body functions', placeholder: 'Memory, hearing, balance...' },
  { kind: 'structures', label: 'Body structures', placeholder: 'Knee, spinal cord, eye...' },
];

interface PartPickerProps {
  functions: BodyPart[];
  structures: BodyPart[];
  onPick: (part: BodyPart) => void;
}

//finds a body function or structure, by searching for it or browsing its groups
export function PartPicker({ functions, structures, onPick }: PartPickerProps) {
  const [kind, setKind] = useState<Kind>('functions');
  const [query, setQuery] = useState('');
  const parts = kind === 'functions' ? functions : structures;
  const children = useMemo(() => {
    const by = new Map<string, BodyPart[]>();
    for (const p of parts) if (p.parent) by.set(p.parent, [...(by.get(p.parent) ?? []), p]);
    return by;
  }, [parts]);
  const groups = [...new Set(parts.map((p) => p.group))];

  //every word of the search has to be in its name, description or what it includes
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = words.length
    ? parts.filter((p) => {
        const text = [p.name, p.description ?? '', ...p.includes].join(' ').toLowerCase();
        return words.every((w) => text.includes(w));
      })
    : [];

  const node = (p: BodyPart, depth: number) => (
    <li key={p.id} style={{ ...styles.node, paddingLeft: depth * 16 }}>
      <button className="comic-lift" style={styles.pick} onClick={() => onPick(p)}>
        {p.name}
      </button>
      {children.has(p.id) && (
        <Disclosure label={`${children.get(p.id)!.length} more specific`} style={styles.more}>
          <ul style={styles.list}>{children.get(p.id)!.map((child) => node(child, depth + 1))}</ul>
        </Disclosure>
      )}
    </li>
  );

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
            {results.slice(0, MAX_RESULTS).map((p) => (
              <li key={p.id} style={styles.node}>
                <button className="comic-lift" style={styles.pick} onClick={() => onPick(p)}>
                  {p.name}
                </button>
                <span style={styles.where}>{p.group}</span>
              </li>
            ))}
          </ul>
          {results.length > MAX_RESULTS && <p style={styles.text}>And {results.length - MAX_RESULTS} more. Add a word to narrow it down.</p>}
        </>
      ) : (
        groups.map((group) => (
          <div key={group} style={styles.group}>
            <Disclosure label={group} style={styles.groupToggle}>
              <ul style={styles.list}>{parts.filter((p) => p.group === group && !p.parent).map((p) => node(p, 0))}</ul>
            </Disclosure>
          </div>
        ))
      )}
    </div>
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
    fontSize: 13,
    paddingLeft: 4,
  },
};
