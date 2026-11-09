import { useState, type CSSProperties } from 'react';
import { addCondition, capitalised, lookupConditions, type Candidate, type Condition } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { SearchField } from '../shared_components/search_field';
import { matchesAll, searchWords } from '../shared_components/search';
import { Thinking } from '../shared_components/thinking';
import { brownRed, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//the most search results shown at once
const MAX_RESULTS = 30;

interface ConditionPickerProps {
  conditions: Condition[];
  onPick: (condition: Condition) => void;
  onAdded: (condition: Condition) => void; //a condition that wasn't in the list before
}

//finds a condition by its name or another name for it, and looks further in Mondo and HPO for one that isn't listed
export function ConditionPicker({ conditions, onPick, onAdded }: ConditionPickerProps) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>();
  const [looking, setLooking] = useState(false);
  const [adding, setAdding] = useState<string>(); //the source id being added
  const [error, setError] = useState<string>();

  //every word of the search has to be in its name or one of its other names
  const words = searchWords(query);
  const results = words.length ? conditions.filter((c) => matchesAll(words, [c.name, ...c.synonyms])) : [];

  const search = (q: string) => {
    setQuery(q);
    setCandidates(undefined);
    setError(undefined);
  };
  const lookUp = () => {
    setLooking(true);
    setError(undefined);
    lookupConditions(query).then(
      (found) => {
        setLooking(false);
        setCandidates(found);
      },
      (e) => {
        setLooking(false);
        setError(failure(e));
      },
    );
  };
  const pickCandidate = (c: Candidate) => {
    const known = c.id ? conditions.find((k) => k.id === c.id) : undefined;
    if (known) return onPick(known);
    setAdding(c.source_id);
    setError(undefined);
    addCondition(c.source_id).then(
      (condition) => {
        setAdding(undefined);
        onAdded(condition);
      },
      (e) => {
        setAdding(undefined);
        setError(failure(e));
      },
    );
  };

  return (
    <div style={styles.picker}>
      <SearchField id="condition-search" query={query} onQuery={search} placeholder="Asthma, migraine, double-jointed..." />
      {words.length > 0 && (
        <>
          {!results.length && <p style={styles.text}>Nothing in our list matches that.</p>}
          <ul style={styles.list}>
            {results.slice(0, MAX_RESULTS).map((c) => (
              <li key={c.id} style={styles.item}>
                <button className="comic-lift" style={styles.pick} onClick={() => onPick(c)}>
                  {capitalised(c.name)}
                </button>
              </li>
            ))}
          </ul>
          {results.length > MAX_RESULTS && <p style={styles.text}>And {results.length - MAX_RESULTS} more. Add a word to narrow it down.</p>}

          <div style={styles.further}>
            {!candidates && !looking && (
              <>
                <p style={styles.text}>Not the one? Mondo and HPO, the lists ours come from, have thousands more.</p>
                <button className="comic-lift" style={styles.secondary} onClick={lookUp}>
                  Look further
                </button>
              </>
            )}
            {looking && <Thinking label="Looking through Mondo and HPO" />}
            {candidates && !candidates.length && <p style={styles.text}>Mondo and HPO have nothing by that name either. Try another way of putting it.</p>}
            {candidates && !!candidates.length && (
              <ul style={styles.list}>
                {candidates.map((c) => (
                  <li key={c.source_id} style={styles.item}>
                    <button className="comic-lift" style={styles.pick} disabled={!!adding} onClick={() => pickCandidate(c)}>
                      {adding === c.source_id ? 'Adding...' : capitalised(c.name)}
                    </button>
                    {c.description && <span style={styles.where}>{c.description}</span>}
                  </li>
                ))}
              </ul>
            )}
            {error && <AtlasError message={error} />}
          </div>
        </>
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
  text: {
    margin: 0,
    fontSize: 14,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  item: {
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
    maxWidth: 720,
  },
  further: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 10,
    borderTop: `1px dashed ${gunmetal}`,
  },
  secondary: {
    padding: '4px 14px',
    background: ivory,
    color: brownRed,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
};
