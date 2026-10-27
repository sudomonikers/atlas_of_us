import { useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { IDEA_TYPES, type IdeaGroupName, type PagedGroup, type TopicStatus } from './api';
import { PLACEHOLDER } from './search';
import { emptyBoard, expandNode, moreOf, place, readThen, type BoardIdea, type BoardSkill, type BoardTopic, type Placed, type TopicBoard } from './topic_board';
import { useTopicSearch, type SearchState } from './use_topic_search';
import { AtlasError } from '../shared_components/atlas-error';
import type { BoardNode } from '../shared_components/board_layout';
import { GraphBoard, type LinkKind } from '../shared_components/graph_board';
import { Mascot } from '../shared_components/mascot';
import { SearchField } from '../shared_components/search_field';
import { Dots, Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//how many search results show under the board's search box
const RESULTS = 6;

//how topics, Ideas and the skills that need them link, as the board draws them. "Part of" points to the broader topic,
//"Includes" from a topic to its Idea, "Needs first" to the Idea needed, and "Needs knowledge" from a skill to the topic
const KINDS: LinkKind[] = [
  { id: 'part_of', label: 'Part of', line: 'solid', arrow: true, colour: gunmetal, length: 90 },
  { id: 'includes', label: 'Includes', line: 'dotted', arrow: false, colour: gunmetal, length: 80 },
  { id: 'needs_first', label: 'Needs first', line: 'dashed', arrow: true, colour: cinnamon, length: 110 },
  { id: 'analogous', label: 'Analogous', line: 'dotted', arrow: false, colour: blue, length: 150 },
  { id: 'similar', label: 'Similar', line: 'dotted', arrow: false, colour: paleBlue, length: 150 },
  { id: 'needs_knowledge', label: 'Needs knowledge', line: 'solid', arrow: true, colour: brownRed, length: 130 },
];

//the ways a topic and an Idea link, as the inspector counts them
const TOPIC_COUNTS: [PagedGroup | 'similar', string][] = [
  ['broader', 'Part of'],
  ['narrower', 'Subtopics'],
  ['ideas', 'Ideas'],
  ['needed_by', 'Skills that need it'],
  ['similar', 'Similar'],
];
const IDEA_COUNTS: [IdeaGroupName, string][] = [
  ['topics', 'In topics'],
  ['requires', 'Needs first'],
  ['required_by', 'Leads to'],
  ['analogous', 'Analogous to'],
];

const STATUS: Record<TopicStatus, string> = {
  ready: 'Written up',
  filling: 'Being written up',
  stub: 'Not written up yet',
  failed: 'Not written up yet',
};

interface TopicGraphProps {
  board: TopicBoard;
  onBoard: Dispatch<SetStateAction<TopicBoard>>;
  onOpen: (placed: Placed) => void;
  onOpenSkill: (id: string) => void;
}

//the topics graph as a board to explore: search to put a topic on it, expand a topic or an Idea to bring in everything
//it links to, and select one to read about it. Reading a topic never fills it; only opening it does
export function TopicGraph({ board, onBoard, onOpen, onOpenSkill }: TopicGraphProps) {
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const searchError = useTopicSearch(search, setSearch);
  const [busy, setBusy] = useState<string>(); //the node being expanded, or `<id>:<group>` while more of a group is read
  const [error, setError] = useState<string>();

  const nodes = useMemo<BoardNode[]>(
    () => [
      ...Object.values(board.topics).map(({ topic, from, expanded }): BoardNode => ({
        id: topic.id,
        label: topic.name,
        look: topic.status === 'ready' ? 'filled' : 'hollow',
        opened: expanded,
        from,
      })),
      ...Object.values(board.ideas).map(({ idea, from, expanded }): BoardNode => ({
        id: idea.id,
        label: idea.name,
        look: 'pale',
        shape: 'diamond',
        opened: expanded,
        from,
      })),
      ...Object.values(board.skills).map(({ skill, from }): BoardNode => ({ id: skill.id, label: skill.name, look: 'warm', from })),
    ],
    [board.topics, board.ideas, board.skills],
  );

  const failed = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const select = (id?: string) => {
    setError(undefined);
    onBoard((b) => ({ ...b, selected: id }));
    if (id) readThen(board, id, onBoard).catch(failed);
  };

  const grow = (id: string) => {
    if (board.skills[id]) return select(id); //skills open in Skills, and aren't expanded here
    setError(undefined);
    setBusy(id);
    onBoard((b) => ({ ...b, selected: id }));
    expandNode(board, id, onBoard).catch(failed).finally(() => setBusy(undefined));
  };

  const more = (id: string, group: PagedGroup | IdeaGroupName) => {
    setError(undefined);
    setBusy(`${id}:${group}`);
    moreOf(board, id, group, onBoard).catch(failed).finally(() => setBusy(undefined));
  };

  const pick = (placed: Placed) => {
    setSearch({ query: '' });
    onBoard((b) => place(b, placed));
    grow(placed.kind === 'topic' ? placed.topic.id : placed.idea.id);
  };

  const hide = (id: string) =>
    onBoard((b) => {
      const topics = { ...b.topics };
      const ideas = { ...b.ideas };
      const skills = { ...b.skills };
      delete topics[id];
      delete ideas[id];
      delete skills[id];
      const links = b.links.filter((l) => l.from !== id && l.to !== id);
      return { ...b, topics, ideas, skills, links, selected: b.selected === id ? undefined : b.selected };
    });

  const describe = (node: BoardNode) => {
    const idea = board.ideas[node.id];
    if (idea) return `${node.label}, an Idea, a ${IDEA_TYPES[idea.idea.type].label.toLowerCase()}`;
    if (board.skills[node.id]) return `${node.label}, a skill that needs this knowledge`;
    return `${node.label}, ${STATUS[board.topics[node.id]?.topic.status ?? 'stub'].toLowerCase()}`;
  };

  const results = search.query.trim() ? search.results?.slice(0, RESULTS) : undefined;
  const selected = board.selected;
  const chosenTopic = selected ? board.topics[selected] : undefined;
  const chosenIdea = selected ? board.ideas[selected] : undefined;
  const chosenSkill = selected ? board.skills[selected] : undefined;

  return (
    <div style={styles.wrap}>
      <div style={styles.boardColumn}>
        <GraphBoard
          label="The topics and Ideas you've put on the board, and how they link"
          nodes={nodes}
          links={board.links}
          kinds={KINDS}
          layout={board.layout}
          selected={board.selected}
          focus={board.focus}
          describe={describe}
          onSelect={select}
          onExpand={grow}
          onClear={() => onBoard(emptyBoard())}
          empty={
            <div style={styles.empty}>
              <Mascot size={96} />
              <p style={styles.bubble} className="comic-bubble comic-pop">
                Search for a topic to put it on the board, then double-click it to see what it's made of and what it connects to.
              </p>
            </div>
          }
        >
          <SearchField id="topic-graph-search" query={search.query} onQuery={(query) => setSearch({ query })} placeholder={PLACEHOLDER} compact />
          {results && (
            <ul style={styles.results}>
              {results.length === 0 && <li style={styles.none}>Nothing in the Atlas matches that yet.</li>}
              {results.map((topic) => (
                <li key={topic.id}>
                  <button className="comic-lift" style={styles.result} onClick={() => pick({ kind: 'topic', topic })}>
                    <span style={styles.resultName}>{topic.name}</span>
                    {topic.broader.length > 0 && <span style={styles.kindOf}>Part of {topic.broader.map((b) => b.name).join(', ')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search.query.trim() && !search.results && !searchError && (
            <div style={styles.working}>
              <Thinking label="Looking" />
            </div>
          )}
          {searchError && <AtlasError message={searchError} />}
          {busy && (
            <div style={styles.working}>
              <Thinking label="Bringing them onto the board" />
            </div>
          )}
        </GraphBoard>
      </div>

      <aside style={styles.inspector} className="comic-panel" aria-live="polite">
        {chosenTopic ? (
          <TopicInspector on={chosenTopic} busy={busy} onExpand={grow} onMore={more} onOpen={onOpen} onHide={hide} />
        ) : chosenIdea ? (
          <IdeaInspector on={chosenIdea} busy={busy} onExpand={grow} onMore={more} onOpen={onOpen} onHide={hide} />
        ) : chosenSkill ? (
          <SkillInspector on={chosenSkill} onOpen={onOpenSkill} onHide={hide} />
        ) : (
          <>
            <h3 style={styles.heading}>How the board works</h3>
            <ul style={styles.tips}>
              <li>Click a topic or an Idea to read about it here.</li>
              <li>Double-click a topic to bring in its Ideas, the topics around it, and the skills that need it.</li>
              <li>Double-click an Idea, the pale diamonds, to bring in what it needs first, what builds on it, and the other topics it's in.</li>
              <li>Skills that need a topic are the pale red ones, and open in Skills.</li>
              <li>Drag anything to move it, and it stays where you put it.</li>
              <li>Drag the background to look around, and scroll or pinch to zoom.</li>
              <li>The buttons along the bottom turn each kind of link on and off.</li>
            </ul>
          </>
        )}
        {error && <AtlasError message={error} />}
      </aside>
    </div>
  );
}

//how many are linked one way, with a button to bring the next page onto the board once it's expanded
function Count({ id, group, label, items, total, expanded, busy, onMore }: {
  id: string;
  group: PagedGroup | IdeaGroupName | 'similar';
  label: string;
  items: number;
  total: number;
  expanded: boolean;
  busy?: string;
  onMore: (id: string, group: PagedGroup | IdeaGroupName) => void;
}) {
  const adding = busy === `${id}:${group}`;
  return (
    <div style={styles.count}>
      <dt>{label}</dt>
      <dd style={styles.countNumber}>
        {expanded && total > items && group !== 'similar' && (
          <button className="comic-lift" style={styles.more} disabled={adding} onClick={() => onMore(id, group as PagedGroup | IdeaGroupName)}>
            {adding ? <>Adding<Dots /></> : 'Add more'}
          </button>
        )}
        {total}
      </dd>
    </div>
  );
}

function Actions({ id, expanded, busy, onExpand, open, onHide }: {
  id: string;
  expanded: boolean;
  busy?: string;
  onExpand: (id: string) => void;
  open: [string, () => void];
  onHide: (id: string) => void;
}) {
  const expanding = busy === id;
  return (
    <div style={styles.actions}>
      <button className="comic-lift" style={styles.primary} disabled={expanded || expanding} onClick={() => onExpand(id)}>
        {expanding ? <>Expanding<Dots /></> : expanded ? 'Expanded' : 'Expand'}
      </button>
      <button className="comic-lift" style={styles.button} onClick={open[1]}>
        {open[0]}
      </button>
      <button className="comic-lift" style={styles.button} onClick={() => onHide(id)}>
        Hide
      </button>
    </div>
  );
}

//the selected topic: what it is, how many it links to each way, and what can be done with it
function TopicInspector({ on, busy, onExpand, onMore, onOpen, onHide }: {
  on: BoardTopic;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string, group: PagedGroup | IdeaGroupName) => void;
  onOpen: (placed: Placed) => void;
  onHide: (id: string) => void;
}) {
  const { topic, neighbors } = on;
  return (
    <>
      <h3 style={styles.name}>{topic.name}</h3>
      <span className="comic-chip" style={styles.status}>
        {STATUS[topic.status]}
      </span>
      {neighbors ? neighbors.topic.description && <p style={styles.description}>{neighbors.topic.description}</p> : <Thinking label="Reading it" style={styles.description} />}
      {neighbors && (
        <dl style={styles.counts}>
          {TOPIC_COUNTS.map(([group, label]) => (
            <Count key={group} id={topic.id} group={group} label={label} items={neighbors[group].items.length} total={neighbors[group].total} expanded={on.expanded} busy={busy} onMore={onMore} />
          ))}
        </dl>
      )}
      <Actions id={topic.id} expanded={on.expanded} busy={busy} onExpand={onExpand} open={['Open topic', () => onOpen({ kind: 'topic', topic })]} onHide={onHide} />
    </>
  );
}

//the selected Idea: its type, what it says, how it links each way, and what can be done with it
function IdeaInspector({ on, busy, onExpand, onMore, onOpen, onHide }: {
  on: BoardIdea;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string, group: PagedGroup | IdeaGroupName) => void;
  onOpen: (placed: Placed) => void;
  onHide: (id: string) => void;
}) {
  const { idea, read } = on;
  return (
    <>
      <h3 style={styles.name}>{idea.name}</h3>
      <span className="comic-chip" style={styles.status}>
        Idea, a {IDEA_TYPES[idea.type].label.toLowerCase()}
      </span>
      {read ? read.idea.description && <p style={styles.description}>{read.idea.description}</p> : <Thinking label="Reading it" style={styles.description} />}
      {read && (
        <dl style={styles.counts}>
          {IDEA_COUNTS.map(([group, label]) => (
            <Count key={group} id={idea.id} group={group} label={label} items={read[group].items.length} total={read[group].total} expanded={on.expanded} busy={busy} onMore={onMore} />
          ))}
        </dl>
      )}
      <Actions id={idea.id} expanded={on.expanded} busy={busy} onExpand={onExpand} open={['Open Idea', () => onOpen({ kind: 'idea', idea })]} onHide={onHide} />
    </>
  );
}

//a skill that needs a topic on the board, which opens in Skills
function SkillInspector({ on, onOpen, onHide }: { on: BoardSkill; onOpen: (id: string) => void; onHide: (id: string) => void }) {
  return (
    <>
      <h3 style={styles.name}>{on.skill.name}</h3>
      <span className="comic-chip" style={styles.status}>
        A skill that needs this knowledge
      </span>
      <div style={styles.actions}>
        <button className="comic-lift" style={styles.primary} onClick={() => onOpen(on.skill.id)}>
          Open in Skills
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => onHide(on.skill.id)}>
          Hide
        </button>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  //what's being fetched, under the board's search box
  working: {
    marginTop: 8,
    padding: '4px 10px',
    alignSelf: 'flex-start',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  //the board, with the inspector beside it, or under it once there's no room
  wrap: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 20,
  },
  boardColumn: {
    flex: '999 1 560px',
    minWidth: 0,
  },
  inspector: {
    flex: '1 0 260px',
    padding: '18px 20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
  } as CSSProperties,
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  tips: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 16,
    lineHeight: 1.4,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
    overflowWrap: 'anywhere',
  },
  status: {
    fontSize: 13,
  },
  description: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  counts: {
    margin: 0,
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '2px 12px',
    fontSize: 15,
  },
  count: {
    display: 'contents',
  },
  countNumber: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    fontFamily: comic,
    fontSize: 18,
  },
  more: {
    padding: '0 8px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    font: 'inherit',
    fontSize: 13,
  },
  actions: {
    marginTop: 4,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  primary: {
    padding: '3px 14px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  button: {
    padding: '3px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  results: {
    margin: '8px 0 0',
    padding: 6,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  none: {
    padding: '4px 8px',
    fontSize: 15,
  },
  result: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '4px 8px',
    background: 'transparent',
    color: gunmetal,
    border: 'none',
    borderRadius: corners,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  resultName: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
    color: brownRed,
  },
  kindOf: {
    fontSize: 13,
    color: blue,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    maxWidth: 480,
  },
  bubble: {
    margin: 0,
    '--tilt': '-1deg',
  } as CSSProperties,
};
