import { useEffect, useState, type CSSProperties } from 'react';
import { BLOOM_NAMES, getEngagements, type EngagedTopic } from './api';
import { navigate } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { LevelSteps } from '../shared_components/level_steps';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleCinnamon = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the My Knowledge view: the topics the user has placed themselves on, deepest first, each opening its topic page
export default function MyKnowledge() {
  const [topics, setTopics] = useState<EngagedTopic[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    getEngagements().then(
      (loaded) => live && setTopics(loaded),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>My Knowledge</h2>
      <p style={styles.text}>The topics you know, and how deeply you know them.</p>
      {error && <AtlasError message={error} />}
      {!error && !topics && <Thinking label="Gathering what you know" />}
      {topics && !topics.length && <p style={styles.text}>Nothing here yet. Open a topic in the Topics Explorer and add yourself to it.</p>}
      {!!topics?.length && (
        <ul style={styles.list}>
          {topics.map(({ topic, rank, evidence }) => (
            <li key={topic.id}>
              <button className="comic-lift" style={styles.row} onClick={() => navigate(`/topics/${encodeURIComponent(topic.id)}`)}>
                <span style={styles.name}>{topic.name}</span>
                <span style={styles.level}>
                  <LevelSteps rank={rank} total={BLOOM_NAMES.length} />
                  {BLOOM_NAMES[rank - 1]}
                </span>
                <span style={styles.detail}>
                  {evidence.length ? `${evidence.length} piece${evidence.length === 1 ? '' : 's'} of evidence` : 'No evidence yet'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
    gap: 12,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleCinnamon,
    '--tilt': '0.3deg',
  } as CSSProperties,
  heading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  list: {
    margin: '6px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 18px',
    padding: '10px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  name: {
    flex: '1 1 220px',
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    overflowWrap: 'anywhere',
  },
  level: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 190,
    fontSize: 17,
    color: brownRed,
  },
  detail: {
    fontSize: 15,
    color: blue,
  },
};
