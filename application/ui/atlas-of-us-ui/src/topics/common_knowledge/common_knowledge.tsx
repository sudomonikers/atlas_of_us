import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties } from 'react';
import { navigate, replace, useSearch } from '../../router';
import { AtlasError } from '../../shared_components/atlas-error';
import { LevelSteps } from '../../shared_components/level_steps';
import { ProgressMeter } from '../../shared_components/progress-meter';
import { Thinking } from '../../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../../shared_components/palette';
import { BLOOM_NAMES, COMMON_KNOWLEDGE, getCollection, type CollectionTopic } from '../api';

const Board = lazy(() => import('./board'));

const paleCinnamon = 'var(--pale-cinnamon)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the Common Knowledge view: the topics most people know something about, how far through them they are, and what
//they showed. Going through them opens the whiteboard full screen, and the url says it's open, so a reload comes back
//to it
export default function CommonKnowledge() {
  const playing = new URLSearchParams(useSearch()).has('play');
  const [topics, setTopics] = useState<CollectionTopic[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    getCollection(COMMON_KNOWLEDGE).then(
      (loaded) => live && setTopics(loaded.topics),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  const update = useCallback(
    (id: string, change: Partial<CollectionTopic>) => setTopics((ts) => ts?.map((t) => (t.id === id ? { ...t, ...change } : t))),
    [],
  );

  if (playing && topics) {
    return (
      <Suspense fallback={null}>
        <Board topics={topics} onTopic={update} onExit={() => replace('/topics?view=common')} />
      </Suspense>
    );
  }

  const done = topics?.filter((t) => t.done).length ?? 0;
  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>Common Knowledge</h2>
      <p style={styles.text}>
        Most of us know something about these, from school or from life. For each one, answer a question about putting
        it to use. Miss it, or say you don't know, and I'll ask a simpler one. I'll add it to what you know, at the level
        you showed.
      </p>
      {error && <AtlasError message={error} />}
      {!error && !topics && <Thinking label="Gathering what most people know" />}
      {topics && !topics.length && <p style={styles.text}>The topics aren't here yet. Come back soon.</p>}
      {!!topics?.length && (
        <>
          <ProgressMeter done={done} total={topics.length} label="done" />
          {done < topics.length && (
            <div style={styles.actions}>
              <button className="comic-lift" style={styles.primary} onClick={() => navigate('/topics?view=common&play')}>
                {done ? 'Keep going ▶' : 'Start ▶'}
              </button>
            </div>
          )}
          {done > 0 && <Summary topics={topics} />}
        </>
      )}
    </section>
  );
}

//what they've shown so far, topic by topic
function Summary({ topics }: { topics: CollectionTopic[] }) {
  const finished = topics.filter((t) => t.done);
  const known = finished.filter((t) => t.rank).length;
  return (
    <>
      <p style={styles.text}>
        You know {known} of the {finished.length} topics you've been through.
      </p>
      <ul style={styles.list}>
        {finished.map((t) => (
          <li key={t.id}>
            <button className="comic-lift" style={styles.row} onClick={() => navigate(`/topics/${encodeURIComponent(t.id)}`)}>
              <span style={styles.rowName}>{t.name}</span>
              <span style={styles.rowLevel}>
                {t.rank ? (
                  <>
                    <LevelSteps rank={t.rank} total={BLOOM_NAMES.length} />
                    {BLOOM_NAMES[t.rank - 1]}
                  </>
                ) : (
                  'Not yet'
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px clamp(16px, 4vw, 30px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
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
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  primary: {
    padding: '6px 22px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 18px',
    padding: '8px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  rowName: {
    flex: '1 1 200px',
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  rowLevel: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 170,
    fontSize: 16,
    color: brownRed,
  },
};
