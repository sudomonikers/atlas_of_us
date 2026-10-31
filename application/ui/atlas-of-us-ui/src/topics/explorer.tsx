import { useCallback, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { getIdea } from './api';
import { TopicGraph } from './graph';
import { IdeaPage } from './idea_page';
import { place, type Placed, type TopicBoard } from './topic_board';
import { TopicPage } from './topic_page';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

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

interface ExplorerProps {
  opened?: Opened; //the open topic or Idea, from the url
  board: TopicBoard;
  onBoard: Dispatch<SetStateAction<TopicBoard>>;
}

//the Topics Explorer view. The board of every topic, to search, zoom around, select and expand; and a topic's or an
//Idea's page once one is opened. What's open is in the url, and the trail hopped through sits above it
export default function Explorer({ opened, board, onBoard }: ExplorerProps) {
  const [trail, setTrail] = useState<Placed[]>([]);

  //the trail up to what's open, so going back cuts it there
  const at = trail.findIndex((p) => idOf(p) === opened?.id);
  const shown = at >= 0 ? trail.slice(0, at + 1) : trail;

  const open = (placed: Placed, from: 'board' | 'page') => {
    setTrail(from === 'page' ? [...shown, placed] : [placed]);
    navigate(pathOf(placed));
  };
  //selects a topic or an Idea on the board and goes back to it. An Idea floats beside the first topic it's in
  const showInGraph = (placed: Placed) => {
    navigate('/topics');
    if (placed.kind === 'topic') return onBoard((b) => place(b, placed));
    getIdea(placed.idea.id)
      .then((read) => onBoard((b) => place(b, placed, read.topics.items[0]?.id)))
      .catch(() => onBoard((b) => place(b, placed)));
  };
  //a page opened straight from its url starts a trail of its own
  const loaded = useCallback((placed: Placed) => setTrail((t) => (t.some((p) => idOf(p) === idOf(placed)) ? t : [placed])), []);

  if (!opened) return <TopicGraph board={board} onBoard={onBoard} onOpen={(placed) => open(placed, 'board')} onOpenSkill={openSkill} />;

  return (
    <>
      <nav style={styles.trail} aria-label="Topics and Ideas you've opened">
        <button className="comic-lift" style={styles.crumb} onClick={() => navigate('/topics')}>
          The map
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
