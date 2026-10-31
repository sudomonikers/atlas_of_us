import { useEffect, useState, type CSSProperties } from 'react';
import { IDEA_TYPES, getIdea, getIdeaPage, type IdeaGroupName, type IdeaNeighbors, type Linked } from './api';
import type { Placed } from './topic_board';
import { TypeChip } from './topic_page';
import { AtlasError } from '../shared_components/atlas-error';
import { Dots, Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const paleCinnamon = 'var(--pale-cinnamon)';
const paleRed = 'var(--pale-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface IdeaPageProps {
  id: string;
  onLoaded: (placed: Placed) => void;
  onOpen: (placed: Placed) => void;
  onShowInGraph: (placed: Placed) => void;
}

//one Idea: what kind of Idea it is, what it says, the topics it's part of, and the Ideas around it. Keyed by the Idea's
//id, so each Idea starts fresh
export function IdeaPage({ id, onLoaded, onOpen, onShowInGraph }: IdeaPageProps) {
  const [read, setRead] = useState<IdeaNeighbors>();
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState<IdeaGroupName>(); //the group whose next page is being read

  useEffect(() => {
    let live = true;
    getIdea(id).then(
      (loaded) => {
        if (!live) return;
        setRead(loaded);
        onLoaded({ kind: 'idea', idea: { id: loaded.idea.id, name: loaded.idea.name, type: loaded.idea.type } });
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, [id, onLoaded]);

  if (error) return <AtlasError message={error} style={styles.column} />;
  if (!read) return <Thinking label="Finding that Idea" mascot style={styles.column} />;
  const { idea } = read;
  const ref = { id: idea.id, name: idea.name, type: idea.type };

  const groups: { group: IdeaGroupName; title: string; note: string; fill: string }[] = [
    { group: 'topics', title: 'In topics', note: `The topics ${idea.name} is part of`, fill: paleBlue },
    { group: 'requires', title: 'Needs first', note: `Understand these before ${idea.name}`, fill: paleCinnamon },
    { group: 'required_by', title: 'Leads to', note: `Ideas that build on ${idea.name}`, fill: paleCinnamon },
    { group: 'analogous', title: 'Analogous to', note: 'The same shape of Idea, in another field', fill: paleRed },
  ];
  const shown = groups.filter(({ group }) => read[group].total > 0);

  const more = (group: IdeaGroupName) => {
    setReading(group);
    getIdeaPage(id, group, read[group].items.length)
      .then(
        (page) => setRead((r) => r && { ...r, [group]: { items: [...r[group].items, ...page.items], total: page.total } }),
        () => {}, //the button stays, to try again
      )
      .finally(() => setReading(undefined));
  };
  const open = (group: IdeaGroupName, linked: Linked) =>
    group === 'topics'
      ? onOpen({ kind: 'topic', topic: { id: linked.id, name: linked.name, status: linked.status ?? 'stub' } })
      : onOpen({ kind: 'idea', idea: { id: linked.id, name: linked.name, type: linked.type ?? 'concept' } });

  return (
    <article style={styles.column}>
      <header style={styles.header} className="comic-panel comic-pop">
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{idea.name}</h2>
          <button className="comic-lift" style={styles.graphButton} onClick={() => onShowInGraph({ kind: 'idea', idea: ref })}>
            See it on the map
          </button>
        </div>
        <p style={styles.kind}>
          <TypeChip type={idea.type} /> {IDEA_TYPES[idea.type].tell}
        </p>
        {idea.description && <p style={styles.description}>{idea.description}</p>}
      </header>

      {shown.length > 0 && (
        <section style={styles.connections}>
          <h3 style={styles.connectionsHeading}>Where to next</h3>
          <div style={styles.groups}>
            {shown.map(({ group, title, note, fill }) => {
              const { items, total } = read[group];
              return (
                <div key={group} style={{ ...styles.group, '--panel-fill': fill } as CSSProperties} className="comic-panel">
                  <h4 style={styles.groupTitle}>{title}</h4>
                  <p style={styles.groupNote}>{note}</p>
                  <ul style={styles.chips}>
                    {items.map((linked) => (
                      <li key={linked.id}>
                        <button className="comic-lift" style={styles.link} onClick={() => open(group, linked)}>
                          {linked.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {items.length < total && (
                    <button className="comic-lift" style={styles.moreLinks} disabled={reading === group} onClick={() => more(group)}>
                      {reading === group ? <>Reading<Dots /></> : `Show more (${total - items.length} left)`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  column: {
    maxWidth: 1100,
    margin: '0 auto 40px',
  },
  header: {
    marginBottom: 28,
    padding: '22px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  nameRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px 16px',
  },
  graphButton: {
    padding: '2px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 'clamp(30px, 5.5vw, 44px)',
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
    overflowWrap: 'anywhere',
  },
  kind: {
    margin: 0,
    fontSize: 16,
    color: blue,
  },
  description: {
    margin: 0,
    fontSize: 19,
    lineHeight: 1.45,
  },
  connections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  connectionsHeading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 34,
    letterSpacing: 1,
    color: gunmetal,
  },
  groups: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 22,
  },
  group: {
    padding: '16px 20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
  },
  groupTitle: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  groupNote: {
    margin: 0,
    fontSize: 15,
  },
  chips: {
    margin: '6px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  moreLinks: {
    alignSelf: 'flex-start',
    marginTop: 6,
    padding: '1px 12px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 15,
  },
  link: {
    padding: '3px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    font: 'inherit',
    fontSize: 16,
    textAlign: 'left',
    cursor: 'pointer',
  },
};
