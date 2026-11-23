import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties } from 'react';
import { navigate, replace, useSearch } from '../../router';
import { AtlasError } from '../../shared_components/atlas-error';
import { LevelSteps } from '../../shared_components/level_steps';
import { ProgressMeter } from '../../shared_components/progress-meter';
import { Thinking } from '../../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../../shared_components/palette';
import { BLOOM_NAMES, getCollection, getCollections, type Collection, type CollectionSummary, type CollectionTopic } from '../api';
import { sceneFor } from './scenes/scenes';

//each collection's picture, a still of its board in its scene, by its id
const THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./thumbs/*.jpg', { eager: true, import: 'default' })).map(([path, url]) => [path.split('/')[2].replace('.jpg', ''), url]),
);

const Board = lazy(() => import('./board'));

const paleCinnamon = 'var(--pale-cinnamon)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';
const VIEW = '/topics';
const collectionUrl = (id: string) => `${VIEW}?c=${encodeURIComponent(id)}`;

//the Collections view: every collection of topics there is to go through, and one of them once it's opened, with how far
//through it they are and what they showed. Going through it opens its board full screen. The url says which collection
//is open and whether its board is, so a reload comes back to it
export default function Collections() {
  const params = new URLSearchParams(useSearch());
  const id = params.get('c');
  return id ? <OneCollection key={id} id={id} playing={params.has('play')} /> : <AllCollections />;
}

//every collection, each with how far through it they are
function AllCollections() {
  const [collections, setCollections] = useState<CollectionSummary[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    getCollections().then(
      (loaded) => live && setCollections(loaded),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>Collections</h2>
      <p style={styles.text}>
        Groups of topics most of us know something about. Go through one and answer a question about putting each topic
        to use. Miss it, or say you don't know, and I'll ask a simpler one. I'll add each to what you know, at the level
        you showed.
      </p>
      {error && <AtlasError message={error} />}
      {!error && !collections && <Thinking label="Gathering the collections" />}
      {collections && !collections.length && <p style={styles.text}>There aren't any collections yet. Come back soon.</p>}
      {!!collections?.length && (
        <ul style={styles.cards}>
          {collections.map((c, i) => (
            <li key={c.id}>
              <button
                className="comic-lift"
                style={{ ...styles.card, '--tilt': `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` } as CSSProperties}
                onClick={() => navigate(collectionUrl(c.id))}
              >
                {THUMBS[c.id] && <img src={THUMBS[c.id]} alt="" style={styles.thumb} loading="lazy" />}
                <span style={styles.cardName}>{c.name}</span>
                {c.description && <span style={styles.cardText}>{c.description}</span>}
                <span style={styles.cardProgress}>
                  <ProgressMeter done={c.done} total={c.size} label="done" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

//one collection: how far through it they are, the way onto its board, and what they've shown so far
function OneCollection({ id, playing }: { id: string; playing: boolean }) {
  const [collection, setCollection] = useState<Collection>();
  const [error, setError] = useState<string>();

  //loaded again on going onto the board and on leaving it, since an answered topic only counts as done on the board
  //once they move on from it
  useEffect(() => {
    let live = true;
    getCollection(id).then(
      (loaded) => live && setCollection(loaded),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, [id, playing]);

  const update = useCallback(
    (topicId: string, change: Partial<CollectionTopic>) =>
      setCollection((c) => c && { ...c, topics: c.topics.map((t) => (t.id === topicId ? { ...t, ...change } : t)) }),
    [],
  );

  if (playing && collection) {
    return (
      <Suspense fallback={null}>
        <Board
          name={collection.name}
          scene={sceneFor(collection.id)}
          topics={collection.topics}
          onTopic={update}
          onExit={() => replace(collectionUrl(id))}
        />
      </Suspense>
    );
  }

  const topics = collection?.topics;
  const done = topics?.filter((t) => t.done).length ?? 0;
  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <button className="comic-lift" style={styles.back} onClick={() => replace(VIEW)}>
        ◀ All collections
      </button>
      <h2 style={styles.heading}>{collection?.name ?? 'Collection'}</h2>
      {collection?.description && <p style={styles.text}>{collection.description}</p>}
      {error && <AtlasError message={error} />}
      {!error && !collection && <Thinking label="Gathering the topics" />}
      {topics && !topics.length && <p style={styles.text}>The topics aren't here yet. Come back soon.</p>}
      {!!topics?.length && (
        <>
          <ProgressMeter done={done} total={topics.length} label="done" />
          {done < topics.length && (
            <div style={styles.actions}>
              <button className="comic-lift" style={styles.primary} onClick={() => navigate(`${collectionUrl(id)}&play`)}>
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
  back: {
    alignSelf: 'flex-start',
    padding: '2px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    cursor: 'pointer',
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
  //the collections side by side, each a card with its picture
  cards: {
    margin: '6px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 22,
  },
  card: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '16px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  thumb: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    background: '#fbfbf6',
  },
  //along the bottom of the card, so the cards in a row line up whatever their descriptions
  cardProgress: {
    marginTop: 'auto',
  },
  cardName: {
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1,
    color: brownRed,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 1.45,
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
