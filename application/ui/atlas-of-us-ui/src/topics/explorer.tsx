import { useCallback, useState, type CSSProperties } from 'react';
import { TopicGraph } from './graph';
import { IdeaPage } from './idea_page';
import { TopicSearch } from './search';
import { emptyBoard, expandNode, place, type Placed, type TopicBoard } from './topic_board';
import { TopicPage } from './topic_page';
import type { SearchState } from './use_topic_search';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

type Mode = 'search' | 'graph';

const MODES: { id: Mode; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'graph', label: 'Graph' },
];

//what's open: a topic at /topics/<id>, or an Idea at /topics/ideas/<id>
export interface Opened {
  kind: 'topic' | 'idea';
  id: string;
}

const idOf = (placed: Placed) => (placed.kind === 'topic' ? placed.topic.id : placed.idea.id);
const nameOf = (placed: Placed) => (placed.kind === 'topic' ? placed.topic.name : placed.idea.name);
const pathOf = (placed: Placed) =>
  placed.kind === 'topic' ? `/topics/${encodeURIComponent(placed.topic.id)}` : `/topics/ideas/${encodeURIComponent(placed.idea.id)}`;
const openSkill = (id: string) => navigate(`/skills/${encodeURIComponent(id)}`);

//the Topics Explorer view. Search for a topic and hop from it to its Ideas and every topic linked to it, or lay topics
//and Ideas out on the graph and expand them. What's open is in the url, and the trail hopped through sits above it
export default function Explorer({ opened }: { opened?: Opened }) {
  const [mode, setMode] = useState<Mode>('search');
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const [board, setBoard] = useState<TopicBoard>(emptyBoard);
  const [trail, setTrail] = useState<Placed[]>([]);

  //the trail up to what's open, so going back cuts it there
  const at = trail.findIndex((p) => idOf(p) === opened?.id);
  const shown = at >= 0 ? trail.slice(0, at + 1) : trail;

  //leaving the graph clears its board, so the next visit starts fresh
  const leaveGraph = () => setBoard(emptyBoard());
  const open = (placed: Placed, from: Mode | 'page') => {
    if (from === 'graph') leaveGraph();
    setTrail(from === 'page' ? [...shown, placed] : [placed]);
    navigate(pathOf(placed));
  };
  //puts a topic or an Idea on an empty graph, expanded, and goes to it
  const showInGraph = (placed: Placed) => {
    const fresh = place(emptyBoard(), placed);
    setBoard(fresh);
    expandNode(fresh, idOf(placed), setBoard).catch(() => {}); //it's on the board either way, and can be expanded from there
    setMode('graph');
    navigate('/topics');
  };
  //a page opened straight from its url starts a trail of its own
  const loaded = useCallback((placed: Placed) => setTrail((t) => (t.some((p) => idOf(p) === idOf(placed)) ? t : [placed])), []);

  if (!opened) {
    return (
      <>
        <div style={styles.modes} role="group" aria-label="How to explore">
          {MODES.map((m) => (
            <button
              key={m.id}
              className="comic-lift"
              style={{ ...styles.mode, ...(mode === m.id ? styles.modeActive : {}) }}
              aria-pressed={mode === m.id}
              onClick={() => {
                if (mode === 'graph' && m.id !== 'graph') leaveGraph();
                setMode(m.id);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === 'search' && <TopicSearch search={search} onSearch={setSearch} onOpen={(topic) => open({ kind: 'topic', topic }, 'search')} />}
        {mode === 'graph' && <TopicGraph board={board} onBoard={setBoard} onOpen={(placed) => open(placed, 'graph')} onOpenSkill={openSkill} />}
      </>
    );
  }

  return (
    <>
      <nav style={styles.trail} aria-label="Topics and Ideas you've opened">
        <button className="comic-lift" style={styles.crumb} onClick={() => navigate('/topics')}>
          {MODES.find((m) => m.id === mode)!.label}
        </button>
        {shown.map((placed) => (
          <span key={idOf(placed)} style={styles.step}>
            <span style={styles.arrow} aria-hidden>
              →
            </span>
            {idOf(placed) === opened.id ? (
              <span style={{ ...styles.crumb, ...styles.current }} aria-current="page">
                {nameOf(placed)}
              </span>
            ) : (
              <button className="comic-lift" style={styles.crumb} onClick={() => navigate(pathOf(placed))}>
                {nameOf(placed)}
              </button>
            )}
          </span>
        ))}
      </nav>
      {opened.kind === 'topic' ? (
        <TopicPage key={opened.id} id={opened.id} onLoaded={loaded} onOpen={(placed) => open(placed, 'page')} onOpenSkill={openSkill} onShowInGraph={showInGraph} />
      ) : (
        <IdeaPage key={opened.id} id={opened.id} onLoaded={loaded} onOpen={(placed) => open(placed, 'page')} onShowInGraph={showInGraph} />
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  modes: {
    maxWidth: 1100,
    margin: '0 auto 20px',
    display: 'flex',
    gap: 8,
  },
  mode: {
    padding: '2px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  modeActive: {
    background: gunmetal,
    color: ivory,
  },
  trail: {
    maxWidth: 1100,
    margin: '0 auto 20px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    fontSize: 20,
    color: brownRed,
  },
  crumb: {
    padding: '2px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  current: {
    background: brownRed,
    color: ivory,
    cursor: 'default',
  },
};
