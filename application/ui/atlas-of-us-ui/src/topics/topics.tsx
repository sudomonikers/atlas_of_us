import { useState, type CSSProperties } from 'react';
import { navigate, replace, usePath, useSearch } from '../router';
import Explorer, { type Opened } from './explorer';
import { emptyBoard, type TopicBoard } from './topic_board';
import MyKnowledge from './my_knowledge';
import Collections from './collections/collections';
import { Nav } from '../shared_components/nav';
import { RequireLogin } from '../auth/require-login';
import { Mascot } from '../shared_components/mascot';
import { ViewTabs } from '../shared_components/view_tabs';

//the page's views: the collections of topics to go through, the user's own knowledge, and a guide to topics and Ideas
//around the board of every topic
type View = 'collections' | 'mine' | 'explore';

const VIEWS: { id: View; label: string; to: string; bubble: string }[] = [
  { id: 'collections', label: 'Collections', to: '/topics', bubble: "Most of us know a lot of the same things, from school and from life. Let's see what you know." },
  { id: 'mine', label: 'My Knowledge', to: '/topics?view=mine', bubble: "What you know now, how deeply, and what you'd like to know." },
  {
    id: 'explore',
    label: 'Explore',
    to: '/topics?view=explore',
    bubble: 'Everything a person can know about, from barley to black holes. Search for a topic, follow the Ideas it is made of, and see how knowing something has depths.',
  },
];

//what's open from the url: a topic at /topics/<id>, or an Idea at /topics/ideas/<id>
function openedFrom(path: string): Opened | undefined {
  if (path.startsWith('/topics/ideas/')) {
    const id = decodeURIComponent(path.slice('/topics/ideas/'.length));
    return id ? { kind: 'idea', id } : undefined;
  }
  if (!path.startsWith('/topics/')) return undefined;
  const id = decodeURIComponent(path.slice('/topics/'.length));
  return id ? { kind: 'topic', id } : undefined;
}

function Topics() {
  const path = usePath();
  const params = new URLSearchParams(useSearch());
  //an open topic or Idea lives in the url, and always shows in Explore
  const opened = openedFrom(path);
  //?view opens one of the page's views, and Collections is the one without it
  const chosen: View = VIEWS.find((v) => v.id === params.get('view'))?.id ?? 'collections';
  //the explorer's board, kept here so it's still there after a look at another view
  const [board, setBoard] = useState<TopicBoard>(emptyBoard);
  const view = opened ? 'explore' : chosen;
  const current = VIEWS.find((v) => v.id === view)!;
  //leaving an open topic or Idea is a step the back button can undo; switching between the views replaces the url in place
  const choose = (next: View) => {
    const to = VIEWS.find((v) => v.id === next)!.to;
    if (opened) navigate(to);
    else replace(to);
  };

  return (
    <RequireLogin reason="I can't tell what you know until I know who you are. Make an account and let's find out.">
      <div style={dash.page} className="comic-page">
        <Nav />
        <header style={dash.header}>
          <h1 style={dash.title} className="comic-title">
            Topics
          </h1>
          <div style={dash.guide}>
            <Mascot />
            <div key={view} style={dash.bubble} className="comic-bubble comic-pop">
              {current.bubble}
            </div>
          </div>
        </header>

        <ViewTabs views={VIEWS} current={view} onChoose={choose} />

        {view === 'collections' && <Collections />}
        {view === 'mine' && <MyKnowledge />}
        {view === 'explore' && <Explorer opened={opened} board={board} onBoard={setBoard} />}
      </div>
    </RequireLogin>
  );
}

const dash: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 24px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  //title on the left with the guide beside it; the guide drops underneath on narrow screens
  header: {
    maxWidth: 1100,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(48px, 8vw, 84px)',
  },
  guide: {
    flex: '1 1 360px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
};

export default Topics;
