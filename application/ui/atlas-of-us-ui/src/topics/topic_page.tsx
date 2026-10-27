import { useEffect, useState, type CSSProperties } from 'react';
import { BLOOM_NAMES, IDEA_TYPES, getNeighborPage, getNeighbors, getTopic, requestFill, type Idea, type IdeaType, type Level, type Linked, type Neighbors, type PagedGroup, type Topic } from './api';
import type { Placed } from './topic_board';
import { AtlasError } from '../shared_components/atlas-error';
import { Mascot } from '../shared_components/mascot';
import { Dots, Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const paleCinnamon = 'var(--pale-cinnamon)';
const paleRed = 'var(--pale-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//how often a topic being filled is checked on
const FILL_POLL_MS = 4000;

interface TopicPageProps {
  id: string;
  onLoaded: (placed: Placed) => void;
  onOpen: (placed: Placed) => void;
  onOpenSkill: (id: string) => void;
  onShowInGraph: (placed: Placed) => void;
}

//one topic: its six Bloom levels, the Ideas it's made of, and what's linked to it to hop to next. A stub is filled the
//first time it's opened, and the page waits on it. Keyed by the topic's id, so each topic starts fresh
export function TopicPage({ id, onLoaded, onOpen, onOpenSkill, onShowInGraph }: TopicPageProps) {
  const [topic, setTopic] = useState<Topic>();
  const [neighbors, setNeighbors] = useState<Neighbors>();
  const [error, setError] = useState<string>();
  const [rank, setRank] = useState(1); //the level being read

  useEffect(() => {
    let live = true;
    getTopic(id).then(
      async (loaded) => {
        if (!live) return;
        onLoaded({ kind: 'topic', topic: { id: loaded.id, name: loaded.name, status: loaded.status } });
        //opening a stub is what fills it
        if (loaded.status === 'stub') {
          const { status } = await requestFill(id);
          loaded = { ...loaded, status };
        }
        if (live) setTopic(loaded);
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    ).catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    getNeighbors(id).then((n) => live && setNeighbors(n), () => {}); //the levels are still worth showing without them
    return () => {
      live = false;
    };
  }, [id, onLoaded]);

  //checks on a filling topic until it's ready or has failed, then fetches what's around it again
  const status = topic?.status;
  useEffect(() => {
    if (status !== 'filling') return;
    const timer = window.setInterval(
      () =>
        getTopic(id).then((loaded) => {
          if (loaded.status === 'filling') return;
          setTopic(loaded);
          getNeighbors(id).then(setNeighbors, () => {});
        }, () => {}), //a failed check just waits for the next one
      FILL_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [id, status]);

  const retry = () =>
    requestFill(id).then(
      ({ status }) => setTopic((t) => t && { ...t, status }),
      (e) => setError(e instanceof Error ? e.message : String(e)),
    );

  if (error) return <AtlasError message={error} style={styles.column} />;
  if (!topic) return <Thinking label="Finding that topic" mascot style={styles.column} />;
  const ref = { id: topic.id, name: topic.name, status: topic.status };

  return (
    <article style={styles.column}>
      <header style={styles.header} className="comic-panel comic-pop">
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{topic.name}</h2>
          <button className="comic-lift" style={styles.graphButton} onClick={() => onShowInGraph({ kind: 'topic', topic: ref })}>
            See it in the graph
          </button>
        </div>
        {topic.description && <p style={styles.description}>{topic.description}</p>}
        {topic.aliases.length > 0 && <p style={styles.aliases}>Also known as {topic.aliases.join(', ')}</p>}
      </header>

      {topic.status === 'ready' && (
        <>
          <Levels levels={topic.levels} rank={rank} onRank={setRank} />
          <Ideas ideas={topic.ideas} name={topic.name} onOpen={onOpen} />
        </>
      )}
      {(topic.status === 'filling' || topic.status === 'stub') && (
        <div style={styles.waiting}>
          <Mascot />
          <p style={styles.bubble} className="comic-bubble comic-pop">
            Nobody has opened {topic.name} before, so I'm writing up its six levels and the Ideas it's made of now. Give me a minute.
          </p>
        </div>
      )}
      {topic.status === 'failed' && (
        <div style={styles.waiting}>
          <Mascot />
          <div style={styles.bubble} className="comic-bubble comic-pop">
            <p style={styles.bubbleText}>I got tangled up writing up {topic.name}.</p>
            <button className="comic-lift" style={styles.button} onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {neighbors && <Connections name={topic.name} neighbors={neighbors} onNeighbors={setNeighbors} onOpen={onOpen} onOpenSkill={onOpenSkill} />}
    </article>
  );
}

//the level picker, as a ladder, and what the picked level says
function Levels({ levels, rank, onRank }: { levels: Level[]; rank: number; onRank: (rank: number) => void }) {
  const level = levels.find((l) => l.rank === rank);
  return (
    <section style={styles.levels}>
      <div style={styles.ladder} role="tablist" aria-label="Levels">
        {BLOOM_NAMES.map((name, i) => (
          <button
            key={name}
            role="tab"
            aria-selected={rank === i + 1}
            className="comic-lift"
            style={{ ...styles.rung, ...(rank === i + 1 ? styles.rungActive : {}) }}
            onClick={() => onRank(i + 1)}
          >
            <span style={styles.rungNumber}>{i + 1}</span>
            {name}
          </button>
        ))}
      </div>

      {level && (
        <div key={rank} role="tabpanel" style={styles.level} className="comic-panel comic-pop">
          <div style={styles.levelHead}>
            <h3 style={styles.levelName}>{BLOOM_NAMES[rank - 1]}</h3>
            {level.trust === 'provisional' && (
              <span className="comic-chip" title="Written by AI and waiting on people who know the topic to check it">
                Provisional
              </span>
            )}
          </div>
          {level.description && <p style={styles.text}>{level.description}</p>}
          {!!level.observable_signs?.length && (
            <div>
              <h4 style={styles.subheading}>You can see it when they</h4>
              <ul style={styles.list}>
                {level.observable_signs.map((sign) => (
                  <li key={sign}>{sign}</li>
                ))}
              </ul>
            </div>
          )}
          {!!level.example_evidence?.length && (
            <div>
              <h4 style={styles.subheading}>What would prove it</h4>
              <ul style={styles.list}>
                {level.example_evidence.map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

//the topic's Ideas in an order to learn them in: each after every Idea in the topic it needs first, by how long the
//chain of Ideas under it is, and by name otherwise
function learningOrder(ideas: Idea[]): Idea[] {
  const byId = new Map(ideas.map((idea) => [idea.id, idea]));
  const depths = new Map<string, number>();
  const depth = (idea: Idea, seen: Set<string>): number => {
    const known = depths.get(idea.id);
    if (known !== undefined) return known;
    if (seen.has(idea.id)) return 0; //the graph keeps no loops, but a page read mid-fill shouldn't hang on one
    seen.add(idea.id);
    const below = idea.requires.map((r) => byId.get(r.id)).filter((r): r is Idea => !!r);
    const d = below.length ? Math.max(...below.map((r) => depth(r, seen) + 1)) : 0;
    depths.set(idea.id, d);
    return d;
  };
  return [...ideas].sort((a, b) => depth(a, new Set()) - depth(b, new Set()) || a.name.localeCompare(b.name));
}

//a chip naming an Idea's type, in that type's colour
export function TypeChip({ type }: { type: IdeaType }) {
  const { label, tell, colour } = IDEA_TYPES[type];
  return (
    <span className="comic-chip" style={{ ...styles.typeChip, background: colour }} title={tell}>
      {label}
    </span>
  );
}

//the Ideas the topic is made of, in an order to learn them in. Each opens that Idea
function Ideas({ ideas, name, onOpen }: { ideas: Idea[]; name: string; onOpen: (placed: Placed) => void }) {
  if (!ideas.length) return null;
  return (
    <section style={styles.ideasSection}>
      <h3 style={styles.connectionsHeading}>What it's made of</h3>
      <p style={styles.groupNote}>The Ideas someone who knows {name} has grasped, in an order to learn them in.</p>
      <ol style={styles.ideas}>
        {learningOrder(ideas).map((idea) => (
          <li key={idea.id} style={styles.idea}>
            <div style={styles.traitHead}>
              <button className="comic-lift" style={styles.link} onClick={() => onOpen({ kind: 'idea', idea })}>
                {idea.name}
              </button>
              <TypeChip type={idea.type} />
            </div>
            {idea.description && <span>{idea.description}</span>}
            {idea.requires.length > 0 && <span style={styles.from}>Needs {idea.requires.map((r) => r.name).join(', ')} first</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

//what's linked to this topic, grouped by how, a page at a time. Topics open here and skills open in Skills
function Connections({ name, neighbors, onNeighbors, onOpen, onOpenSkill }: {
  name: string;
  neighbors: Neighbors;
  onNeighbors: (update: (n?: Neighbors) => Neighbors | undefined) => void;
  onOpen: (placed: Placed) => void;
  onOpenSkill: (id: string) => void;
}) {
  const [reading, setReading] = useState<PagedGroup>(); //the group whose next page is being read
  const groups: { group: Exclude<keyof Neighbors, 'topic' | 'ideas'>; title: string; note: string; fill: string }[] = [
    { group: 'broader', title: 'Part of', note: `${name} is a part of these`, fill: paleBlue },
    { group: 'narrower', title: 'Subtopics', note: `The parts of ${name}`, fill: paleBlue },
    { group: 'needed_by', title: 'Skills that need it', note: `Getting good at these takes knowing ${name}`, fill: paleCinnamon },
    { group: 'similar', title: 'Similar', note: `Close to ${name} in what they're about`, fill: paleRed },
  ];
  const shown = groups.filter(({ group }) => neighbors[group].total > 0);
  if (shown.length === 0) return null;

  const more = (group: PagedGroup) => {
    setReading(group);
    getNeighborPage(neighbors.topic.id, group, neighbors[group].items.length)
      .then(
        (page) => onNeighbors((n) => n && { ...n, [group]: { items: [...n[group].items, ...page.items], total: page.total } }),
        () => {}, //the button stays, to try again
      )
      .finally(() => setReading(undefined));
  };
  const open = (group: string, linked: Linked) =>
    group === 'needed_by' ? onOpenSkill(linked.id) : onOpen({ kind: 'topic', topic: { id: linked.id, name: linked.name, status: linked.status ?? 'stub' } });

  return (
    <section style={styles.connections}>
      <h3 style={styles.connectionsHeading}>Where to next</h3>
      <div style={styles.groups}>
        {shown.map(({ group, title, note, fill }) => {
          const { items, total } = neighbors[group];
          return (
            <div key={group} style={{ ...styles.group, '--panel-fill': fill } as CSSProperties} className="comic-panel">
              <h4 style={styles.groupTitle}>{title}</h4>
              <p style={styles.groupNote}>{note}</p>
              <ul style={styles.chips}>
                {items.map((linked) => (
                  <li key={linked.id}>
                    <button className="comic-lift" style={styles.link} onClick={() => open(group, linked)}>
                      {group === 'needed_by' && linked.rank ? `${linked.name} at ${BLOOM_NAMES[linked.rank - 1]}` : linked.name}
                    </button>
                  </li>
                ))}
              </ul>
              {group !== 'similar' && items.length < total && (
                <button className="comic-lift" style={styles.moreLinks} disabled={reading === group} onClick={() => more(group)}>
                  {reading === group ? <>Reading<Dots /></> : `Show more (${total - items.length} left)`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
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
    '--panel-fill': paleRed,
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
    fontSize: 'clamp(32px, 6vw, 48px)',
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
    overflowWrap: 'anywhere',
  },
  description: {
    margin: 0,
    fontSize: 19,
    lineHeight: 1.45,
  },
  aliases: {
    margin: 0,
    fontSize: 16,
    color: blue,
  },
  waiting: {
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    margin: 0,
    '--tilt': '-1deg',
  } as CSSProperties,
  bubbleText: {
    margin: '0 0 10px',
  },
  button: {
    padding: '4px 16px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  levels: {
    marginBottom: 36,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  //the five levels as rising steps, wrapping on narrow screens
  ladder: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 8,
  },
  rung: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 19,
    letterSpacing: 1,
  },
  rungActive: {
    background: brownRed,
    color: ivory,
  },
  rungNumber: {
    display: 'grid',
    placeItems: 'center',
    width: 26,
    height: 26,
    background: blue,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    fontSize: 15,
  },
  level: {
    padding: '22px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleCinnamon,
    '--tilt': '0.2deg',
  } as CSSProperties,
  levelHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  levelName: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1,
    color: brownRed,
  },
  subheading: {
    margin: '0 0 6px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 20,
    letterSpacing: 1,
    color: gunmetal,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  list: {
    margin: 0,
    paddingLeft: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 17,
    lineHeight: 1.45,
  },
  traits: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 17,
  },
  trait: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  traitHead: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  strength: {
    width: 80,
    height: 10,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    background: ivory,
    overflow: 'hidden',
  },
  strengthFill: {
    display: 'block',
    height: '100%',
    background: cinnamon,
  },
  from: {
    fontSize: 14,
    fontStyle: 'italic',
    color: blue,
  },
  next: {
    paddingTop: 14,
    borderTop: `3px dashed ${gunmetal}`,
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
  ideasSection: {
    marginBottom: 36,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ideas: {
    margin: 0,
    paddingLeft: 26,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    fontSize: 17,
    lineHeight: 1.45,
  },
  idea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  typeChip: {
    color: ivory,
    fontSize: 13,
  },
};
