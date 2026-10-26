import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { askForSkill, searchSkills, type AskOutcome, type SkillRef, type SkillSummary } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const paleCinnamon = 'var(--pale-cinnamon)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//how long typing has to pause before it searches
const DEBOUNCE_MS = 250;

//the search box, kept by the explorer so it's still there on the way back from a skill
export interface SearchState {
  query: string;
  results?: SkillSummary[]; //for the query, once it has come back
}

interface SkillSearchProps {
  search: SearchState;
  onSearch: (search: SearchState) => void;
  onOpen: (skill: SkillRef) => void;
}

//finds skills by name and meaning as the user types, and asks for one we don't have
export function SkillSearch({ search, onSearch, onOpen }: SkillSearchProps) {
  const { query, results } = search;
  const [error, setError] = useState<string>();
  const latest = useRef(query); //the query a response has to match to be shown
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    onSearch({ query: '' });
    input.current?.focus();
  };

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

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <label style={styles.label} htmlFor="skill-search">
        What can you do?
      </label>
      <div style={styles.field}>
        <input
          ref={input}
          id="skill-search"
          style={styles.input}
          type="text"
          role="searchbox"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Baking, public speaking, welding..."
          value={query}
          maxLength={200}
          autoFocus
          onChange={(e) => onSearch({ query: e.target.value })}
          onKeyDown={(e) => e.key === 'Escape' && clear()}
        />
        {query && (
          <button className="comic-lift" style={styles.clear} aria-label="Clear the search" onClick={clear}>
            {/* two hand-drawn strokes, slightly uneven */}
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path d="M4 4.5 C8 8 12 12.5 16 15.5" fill="none" stroke={ivory} strokeWidth="3.2" strokeLinecap="round" />
              <path d="M15.5 4 C12 7.5 8.5 11.5 4.5 16" fill="none" stroke={ivory} strokeWidth="3.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {error && <AtlasError message={error} />}

      {query.trim() && results && (
        <>
          {results.length > 0 && (
            <ul style={styles.results}>
              {results.map((skill) => (
                <li key={skill.id}>
                  <button className="comic-lift" style={styles.result} onClick={() => onOpen(skill)}>
                    <span style={styles.resultHead}>
                      <span style={styles.resultName}>{skill.name}</span>
                      {skill.status !== 'ready' && <span className="comic-chip">Levels not written yet</span>}
                    </span>
                    {skill.description && <span style={styles.resultDescription}>{skill.description}</span>}
                    {skill.broader.length > 0 && (
                      <span style={styles.kindOf}>A kind of {skill.broader.map((b) => b.name).join(', ')}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <AskForSkill key={query} query={query.trim()} nothingFound={results.length === 0} onOpen={onOpen} />
        </>
      )}
    </section>
  );
}

//where a request that isn't a skill belongs, and what to say about it
const ELSEWHERE: Record<Extract<AskOutcome, { outcome: 'not_a_skill' }>['kind'], { says: (name: string) => string; to?: [string, string] }> = {
  personality: { says: (name) => `"${name}" is how you are, more than something you do. That lives in Personality.`, to: ['Go to Personality', '/personality'] },
  topic: { says: (name) => `"${name}" is something you know about, more than something you do. Topics are coming to the Atlas soon.` },
  physical_attribute: { says: (name) => `"${name}" is about your body, more than something you do. That part of the Atlas is coming soon.` },
  other: { says: (name) => `I can't place "${name}" anywhere in the Atlas.` },
};

//asks the api to add what was typed. The api normalizes it, checks it's a skill, and either finds the skill it means or
//creates a new one, which then opens
function AskForSkill({ query, nothingFound, onOpen }: { query: string; nothingFound: boolean; onOpen: (skill: SkillRef) => void }) {
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<Exclude<AskOutcome, { outcome: 'existing' | 'created' }>>();
  const [error, setError] = useState<string>();

  const ask = () => {
    setAsking(true);
    setError(undefined);
    askForSkill(query).then(
      (outcome) => {
        setAsking(false);
        if (outcome.outcome === 'existing' || outcome.outcome === 'created') onOpen(outcome.skill);
        else setAnswer(outcome);
      },
      (e) => {
        setAsking(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  if (answer?.outcome === 'not_a_skill') {
    const elsewhere = ELSEWHERE[answer.kind];
    return (
      <div style={styles.answer}>
        <p style={styles.answerText}>{elsewhere.says(answer.name)}</p>
        {elsewhere.to && (
          <button className="comic-lift" style={styles.askButton} onClick={() => navigate(elsewhere.to![1])}>
            {elsewhere.to[0]}
          </button>
        )}
      </div>
    );
  }
  if (answer?.outcome === 'rejected') {
    return (
      <div style={styles.answer}>
        <p style={styles.answerText}>{answer.reason}</p>
      </div>
    );
  }
  return (
    <div style={styles.ask}>
      <p style={styles.askText}>{nothingFound ? "Nothing in the Atlas matches that yet." : "Not what you're looking for?"}</p>
      <button className="comic-lift" style={styles.askButton} disabled={asking} onClick={ask}>
        {asking ? 'Checking...' : `Add "${query}" to the Atlas`}
      </button>
      {error && <AtlasError message={error} />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  label: {
    fontFamily: comic,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  //the input with its clear button sitting inside its right edge
  field: {
    position: 'relative',
  },
  input: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '10px 56px 10px 14px',
    fontFamily: 'inherit',
    fontSize: 22,
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    outlineColor: brownRed,
  },
  clear: {
    position: 'absolute',
    top: '50%',
    right: 10,
    width: 34,
    height: 34,
    marginTop: -17,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    background: brownRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 44% 54% 46%',
    boxShadow: `2px 2px 0 ${gunmetal}`,
    cursor: 'pointer',
  },
  results: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 14,
  },
  result: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    padding: '12px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${paleCinnamon}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  resultHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  resultName: {
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 0.5,
    color: brownRed,
  },
  resultDescription: {
    fontSize: 16,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  kindOf: {
    fontSize: 15,
    color: blue,
  },
  ask: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 14px',
    paddingTop: 14,
    borderTop: `3px dashed ${gunmetal}`,
  },
  askText: {
    margin: 0,
    fontSize: 18,
  },
  askButton: {
    padding: '4px 16px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    overflowWrap: 'anywhere',
  },
  answer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 14px',
    padding: '12px 16px',
    background: paleCinnamon,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
  },
  answerText: {
    margin: 0,
    fontSize: 18,
  },
};
