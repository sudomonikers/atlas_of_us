import { useState, type CSSProperties } from 'react';
import { askForTopic, type AskOutcome, type TopicRef } from './api';
import { useTopicSearch, type SearchState } from './use_topic_search';
import { AtlasError } from '../shared_components/atlas-error';
import { SearchField } from '../shared_components/search_field';
import { navigate } from '../router';
import { Dots, Thinking } from '../shared_components/thinking';

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

//what the search box suggests typing
export const PLACEHOLDER = 'Physics, stoicism, wine tasting...';

interface TopicSearchProps {
  search: SearchState;
  onSearch: (search: SearchState) => void;
  onOpen: (topic: TopicRef) => void;
}

//finds topics by name and meaning as the user types, and asks for one we don't have
export function TopicSearch({ search, onSearch, onOpen }: TopicSearchProps) {
  const { query, results } = search;
  const error = useTopicSearch(search, onSearch);

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <label style={styles.label} htmlFor="topic-search">
        What do you know about?
      </label>
      <SearchField id="topic-search" query={query} onQuery={(q) => onSearch({ query: q })} placeholder={PLACEHOLDER} autoFocus />

      {error && <AtlasError message={error} />}
      {query.trim() && !results && !error && <Thinking label="Looking" />}

      {query.trim() && results && (
        <>
          {results.length > 0 && (
            <ul style={styles.results}>
              {results.map((topic) => (
                <li key={topic.id}>
                  <button className="comic-lift" style={styles.result} onClick={() => onOpen(topic)}>
                    <span style={styles.resultHead}>
                      <span style={styles.resultName}>{topic.name}</span>
                      {topic.status !== 'ready' && <span className="comic-chip">Not written up yet</span>}
                    </span>
                    {topic.description && <span style={styles.resultDescription}>{topic.description}</span>}
                    {topic.broader.length > 0 && (
                      <span style={styles.kindOf}>Part of {topic.broader.map((b) => b.name).join(', ')}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <AskForTopic key={query} query={query.trim()} nothingFound={results.length === 0} onOpen={onOpen} />
        </>
      )}
    </section>
  );
}

//where a request that isn't a topic belongs, and what to say about it
const ELSEWHERE: Record<Extract<AskOutcome, { outcome: 'not_a_topic' }>['kind'], { says: (name: string) => string; to?: [string, string] }> = {
  skill: { says: (name) => `"${name}" is something you do, more than something you know about. That lives in Skills.`, to: ['Go to Skills', '/skills'] },
  personality: { says: (name) => `"${name}" is how you are, more than something you know about. That lives in Personality.`, to: ['Go to Personality', '/personality'] },
  physical_attribute: { says: (name) => `"${name}" is about your body, more than something you know about. That part of the Atlas is coming soon.` },
  other: { says: (name) => `I can't place "${name}" anywhere in the Atlas.` },
};

//asks the api to add what was typed. The api normalizes it, checks it's a topic, and either finds the topic it means or
//creates a new one, which then opens
function AskForTopic({ query, nothingFound, onOpen }: { query: string; nothingFound: boolean; onOpen: (topic: TopicRef) => void }) {
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<Exclude<AskOutcome, { outcome: 'existing' | 'created' }>>();
  const [error, setError] = useState<string>();

  const ask = () => {
    setAsking(true);
    setError(undefined);
    askForTopic(query).then(
      (outcome) => {
        setAsking(false);
        if (outcome.outcome === 'existing' || outcome.outcome === 'created') onOpen(outcome.topic);
        else setAnswer(outcome);
      },
      (e) => {
        setAsking(false);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };

  if (answer?.outcome === 'not_a_topic') {
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
        {asking ? <>Checking<Dots /></> : `Add "${query}" to the Atlas`}
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
