import { useState, type CSSProperties } from 'react';
import { askForTopic, type AskOutcome, type TopicSummary } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { navigate } from '../router';
import { Dots } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const cinnamon = 'var(--cinnamon-wood)';
const gunmetal = 'var(--gunmetal-black)';
const paleCinnamon = 'var(--pale-cinnamon)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//what the search box suggests typing
export const PLACEHOLDER = 'Physics, stoicism, wine tasting...';

//where a request that isn't a topic belongs, and what to say about it
const ELSEWHERE: Record<Extract<AskOutcome, { outcome: 'not_a_topic' }>['kind'], { says: (name: string) => string; to?: [string, string] }> = {
  skill: { says: (name) => `"${name}" is something you do, more than something you know about. That lives in Skills.`, to: ['Go to Skills', '/skills'] },
  personality: { says: (name) => `"${name}" is how you are, more than something you know about. That lives in Personality.`, to: ['Go to Personality', '/personality'] },
  physical_attribute: { says: (name) => `"${name}" is about your body, more than something you know about. That part of the Atlas is coming soon.` },
  other: { says: (name) => `I can't place "${name}" anywhere in the Atlas.` },
};

//asks the api to add what was typed. The api normalizes it, checks it's a topic, and either finds the topic it means or
//creates a new one, which then opens
export function AskForTopic({ query, nothingFound, onOpen }: { query: string; nothingFound: boolean; onOpen: (topic: TopicSummary) => void }) {
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
