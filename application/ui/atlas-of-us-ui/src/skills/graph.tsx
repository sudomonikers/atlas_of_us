import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import { getSkillMap, type GroupName, type PagedGroup, type SkillStatus, type SkillSummary } from './api';
import { useMap } from '../shared_components/use_map';
import { AskForSkill, PLACEHOLDER } from './search';
import { Ladder, SkillPage, type LevelNeeds } from './skill_page';
import { emptyBoard, expandSkill, expandTopic, expandTrait, hide as hideNode, moreKnowers, moreOf, moreTakers, place, readThen, readTopicThen, readTraitThen, type BoardSkill, type BoardTopic, type BoardTrait, type SkillBoard } from './skill_board';
import { useSkillSearch, type SearchState } from './use_skill_search';
import { AtlasError } from '../shared_components/atlas-error';
import { SearchField } from '../shared_components/search_field';
import type { BoardNode } from '../shared_components/board_layout';
import { GraphBoard, MapWaiting, type BoardLink, type LinkKind } from '../shared_components/graph_board';
import { navigate } from '../router';
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

//the three ways skills link, and how a skill links to the personality traits it takes and the topics it needs, as the
//board draws them. "Kinds of skills" points to the broader skill, "Skills needed" to the skill that's needed, "Traits
//needed" to the trait, and "Knowledge needed" to the topic
const KINDS: LinkKind[] = [
  { id: 'kind_of', label: 'Kinds of skills', line: 'solid', arrow: true, colour: gunmetal, length: 90 },
  { id: 'needs', label: 'Skills needed', line: 'dashed', arrow: true, colour: cinnamon, length: 130 },
  { id: 'similar', label: 'Similar skills', line: 'dotted', arrow: false, colour: blue, length: 150 },
  { id: 'takes', label: 'Traits needed', line: 'solid', arrow: true, colour: brownRed, length: 120 },
  { id: 'knows', label: 'Knowledge needed', line: 'solid', arrow: true, colour: blue, length: 120 },
];

//the ways a skill links, as the inspector counts them
const GROUP_LABELS: [GroupName, string][] = [
  ['broader', 'Broader skills'],
  ['narrower', 'Narrower skills'],
  ['needs', 'Skills needed'],
  ['leads_to', 'Skills it leads to'],
  ['similar', 'Similar skills'],
];

const STATUS: Record<SkillStatus, string> = {
  ready: 'Levels written',
  filling: 'Levels being written',
  stub: 'Levels not written yet',
  failed: 'Levels not written yet',
};

interface SkillGraphProps {
  board: SkillBoard;
  onBoard: Dispatch<SetStateAction<SkillBoard>>;
}

//every skill on one board to explore, in the style of Neo4j Bloom. Zoomed out it's the map of every skill; search or
//zoom in to find one, select it to read about it here, and expand it to bring in everything it links to. Reading a
//skill never fills it; only opening it does
export function SkillGraph({ board, onBoard }: SkillGraphProps) {
  const map = useMap(getSkillMap);
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const searchError = useSkillSearch(search, setSearch);
  const [busy, setBusy] = useState<string>(); //the skill, trait or topic being expanded, or `<id>:<group>` while more of a group is read
  const [error, setError] = useState<string>();
  const [rank, setRank] = useState(1); //the level picked, kept from one selected skill to the next
  const [level, setLevel] = useState<LevelNeeds>(); //what that level needs, once the skill's page has read its levels

  //every skill is drawn the same, whether its levels are written or not
  const items = useMemo(() => map.items.map((item) => ({ ...item, filled: false })), [map.items]);

  //what floats beside the map: skills that aren't on it, the traits skills take and the topics they need
  const visitors = useMemo<BoardNode[]>(
    () => [
      ...Object.values(board.skills)
        .filter(({ skill }) => !map.byId.has(skill.id))
        .map(({ skill, from }): BoardNode => ({ id: skill.id, label: skill.name, look: 'hollow', from })),
      ...Object.values(board.traits).map(({ trait, from }): BoardNode => ({ id: trait.id, label: trait.name, look: 'pale', shape: 'diamond', from })),
      ...Object.values(board.topics).map(({ topic, from }): BoardNode => ({ id: topic.id, label: topic.name, look: 'warm', from })),
    ],
    [board.skills, board.traits, board.topics, map.byId],
  );
  const opened = useMemo(
    () => new Set([...Object.values(board.skills), ...Object.values(board.traits), ...Object.values(board.topics)].filter((on) => on.expanded).map((on) => ('skill' in on ? on.skill.id : 'trait' in on ? on.trait.id : on.topic.id))),
    [board.skills, board.traits, board.topics],
  );

  //the selected skill's links to the skills, traits and topics it needs are only the ones its picked level needs
  const links = useMemo(() => {
    if (!level || level.id !== board.selected) return board.links;
    const needed = (l: BoardLink) =>
      l.from !== level.id ||
      (l.kind === 'needs' ? level.skills.has(l.to) : l.kind === 'knows' ? level.topics.has(l.to) : l.kind === 'takes' ? level.traits.has(board.traits[l.to]?.trait.name) : true);
    return board.links.filter(needed);
  }, [board.links, board.traits, board.selected, level]);

  //a skill on the map gets a place on the board's records the first time it's selected
  const known = (b: SkillBoard, id: string): SkillBoard => {
    const skill = map.byId.get(id);
    if (b.skills[id] || b.traits[id] || b.topics[id] || !skill) return b;
    return { ...b, skills: { ...b.skills, [id]: { skill: { id, name: skill.name, status: skill.status }, expanded: false } } };
  };

  const failed = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const select = (id?: string) => {
    setError(undefined);
    onBoard((b) => ({ ...(id ? known(b, id) : b), selected: id }));
  };

  const grow = (id: string) => {
    setError(undefined);
    setBusy(id);
    onBoard((b) => ({ ...known(b, id), selected: id, back: opened.has(id) ? b.back : b }));
    (board.traits[id] ? expandTrait : board.topics[id] ? expandTopic : expandSkill)(board, id, onBoard).catch(failed).finally(() => setBusy(undefined));
  };

  const more = (id: string, group: PagedGroup | 'takers' | 'knowers') => {
    setError(undefined);
    setBusy(`${id}:${group}`);
    (group === 'takers' ? moreTakers(board, id, onBoard) : group === 'knowers' ? moreKnowers(board, id, onBoard) : moreOf(board, id, group, onBoard))
      .catch(failed)
      .finally(() => setBusy(undefined));
  };

  //goes to a skill found by search, or just asked for, which joins the map if it's new
  const pick = (skill: SkillSummary) => {
    setSearch({ query: '' });
    setError(undefined);
    map.add({ id: skill.id, name: skill.name, status: skill.status, broader: skill.broader.map((b) => b.id) });
    onBoard((b) => place(b, { id: skill.id, name: skill.name, status: skill.status }));
  };

  //reads the selected skill, trait or topic, however it was selected: here or from a skill's page
  const chosenId = board.selected;
  const unread = !!chosenId && ((board.skills[chosenId] && !board.skills[chosenId].neighbors) || (board.traits[chosenId] && !board.traits[chosenId].read) || (board.topics[chosenId] && !board.topics[chosenId].read));
  useEffect(() => {
    if (!chosenId || !unread) return;
    (board.traits[chosenId] ? readTraitThen : board.topics[chosenId] ? readTopicThen : readThen)(board, chosenId, onBoard).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads once each time something unread is selected, not on every change to the board
  }, [chosenId, unread]);

  const hide = (id: string) => onBoard((b) => ({ ...hideNode(b, id, (other) => map.byId.has(other)), back: b }));

  const ladder = level && level.id === board.selected ? level : undefined; //a ready skill is selected

  const results = search.query.trim() ? search.results?.slice(0, RESULTS) : undefined;
  const chosen = board.selected ? board.skills[board.selected] : undefined;
  const chosenTrait = board.selected ? board.traits[board.selected] : undefined;
  const chosenTopic = board.selected ? board.topics[board.selected] : undefined;

  return (
    <div style={styles.wrap}>
      <div style={styles.boardColumn}>
        {map.nodes ? (
          <GraphBoard
            label="Every skill, and how the ones you've expanded link"
            noun="skills"
            items={items}
            visitors={visitors}
            links={links}
            kinds={KINDS}
            hierarchy="kind_of"
            layout={board.layout}
            selected={board.selected}
            focus={board.focus}
            opened={opened}
            describe={(id) =>
              board.traits[id]
                ? `${board.traits[id].trait.name}, a personality trait`
                : board.topics[id]
                  ? `${board.topics[id].topic.name}, a topic`
                  : `${map.byId.get(id)?.name ?? board.skills[id]?.skill.name}, ${STATUS[map.byId.get(id)?.status ?? board.skills[id]?.skill.status ?? 'stub'].toLowerCase()}`
            }
            onSelect={select}
            onExpand={grow}
            onClear={() => onBoard((b) => ({ ...emptyBoard(), layout: b.layout, back: b }))}
            onBack={board.back && !busy ? () => onBoard((b) => b.back ?? b) : undefined}
            title={
              chosen && (
                <div style={styles.title}>
                  <h2 style={styles.titleName}>{chosen.skill.name}</h2>
                  {chosen.neighbors?.skill.description && <p style={styles.titleText}>{chosen.neighbors.skill.description}</p>}
                  <div style={styles.titleActions}>
                    <SkillActions on={chosen} busy={busy} onExpand={grow} onMore={more} onHide={hide} />
                  </div>
                </div>
              )
            }
          >
          <SearchField id="graph-search" query={search.query} onQuery={(query) => setSearch({ query })} placeholder={PLACEHOLDER} compact />
          {results && (
            <ul style={styles.results}>
              {results.map((skill) => (
                <li key={skill.id}>
                  <button className="comic-lift" style={styles.result} onClick={() => pick(skill)}>
                    <span style={styles.resultName}>{skill.name}</span>
                    {skill.broader.length > 0 && <span style={styles.kindOf}>A kind of {skill.broader.map((b) => b.name).join(', ')}</span>}
                  </button>
                </li>
              ))}
              <li style={styles.asking}>
                <AskForSkill key={search.query} query={search.query.trim()} nothingFound={results.length === 0} onOpen={pick} />
              </li>
            </ul>
          )}
          {search.query.trim() && !search.results && !searchError && (
            <div style={styles.working}>
              <Thinking label="Looking" />
            </div>
          )}
          {searchError && <AtlasError message={searchError} />}
          {ladder && (
            <div style={styles.ladder}>
              <Ladder rank={rank} mine={ladder.mine} onRank={setRank} compact />
            </div>
          )}
          {busy && (
            <div style={styles.working}>
              <Thinking label="Bringing them onto the board" />
            </div>
          )}
          </GraphBoard>
        ) : (
          <MapWaiting error={map.error} />
        )}
      </div>

      {/* the selected skill's page, under the board; a skill it links to is selected on the board */}
      {chosen ? (
        <>
          {error && <AtlasError message={error} />}
          <SkillPage
            key={chosen.skill.id}
            id={chosen.skill.id}
            askToFill
            bare
            rank={rank}
            onLevel={setLevel}
            onOpen={(skill) => onBoard((b) => place(b, skill))}
          />
        </>
      ) : (
      <aside style={styles.inspector} className="comic-panel" aria-live="polite">
        {chosenTrait ? (
          <TraitInspector on={chosenTrait} busy={busy} onExpand={grow} onMore={(id) => more(id, 'takers')} onHide={hide} />
        ) : chosenTopic ? (
          <TopicInspector on={chosenTopic} busy={busy} onExpand={grow} onMore={(id) => more(id, 'knowers')} onHide={hide} />
        ) : (
          <>
            <h3 style={styles.heading}>How the board works</h3>
            <ul style={styles.tips}>
              <li style={styles.tip}>Every dot is a skill. Each flower is a broad skill, with the kinds of it around it.</li>
              <li style={styles.tip}>Drag the background to look around. Scroll or pinch to zoom in, and the dots become skills with their names. Click a field's name to zoom to it, and Fit to see everything again.</li>
              <li style={styles.tip}>Click a skill to read all about it under the board, or search for one.</li>
              <li style={styles.tip}>Double-click one to see just it and everything it links to: skills, the personality traits it takes, and the topics it needs. Drag any of them where you want them.</li>
              <li style={styles.tip}>Double-click anything there to add what it links to. A trait (the pale diamonds) brings the skills that take it, and a topic (the pale red ones) the skills that need it.</li>
              <li style={styles.tip}>Back undoes the last step, or press Ctrl+Z. Hide takes back what one skill brought in, and Back to the atlas leaves the close-up.</li>
              <li style={styles.tip}>Once something's expanded, the buttons along the bottom show and hide each kind of link on the board.</li>
            </ul>
          </>
        )}
        {error && <AtlasError message={error} />}
      </aside>
      )}
    </div>
  );
}

//what can be done with the selected skill, under its name on the board: expand it, take back what it brought
//on, and once it's expanded, bring on the next page of a way it links that has more skills than the board shows
function SkillActions({ on, busy, onExpand, onMore, onHide }: {
  on: BoardSkill;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string, group: PagedGroup) => void;
  onHide: (id: string) => void;
}) {
  const { skill, neighbors } = on;
  const expanding = busy === skill.id;
  const more = on.expanded && neighbors ? GROUP_LABELS.filter((entry): entry is [PagedGroup, string] => entry[0] !== 'similar' && neighbors[entry[0]].total > neighbors[entry[0]].skills.length) : [];
  return (
    <>
      <button className="comic-lift" style={styles.primary} disabled={on.expanded || expanding} onClick={() => onExpand(skill.id)}>
        {expanding ? <>Expanding<Dots /></> : on.expanded ? 'Expanded' : 'Expand'}
      </button>
      {more.map(([group, label]) => (
        <button key={group} className="comic-lift" style={styles.button} disabled={busy === `${skill.id}:${group}`} onClick={() => onMore(skill.id, group)}>
          {busy === `${skill.id}:${group}` ? <>Adding<Dots /></> : `More ${label.toLowerCase()}`}
        </button>
      ))}
      <button className="comic-lift" style={styles.button} onClick={() => onHide(skill.id)}>
        Hide
      </button>
    </>
  );
}

//the selected personality trait: what it is, how many skills take it, and what can be done with it. Once it's expanded,
//it can bring the next page of skills that take it onto the board
function TraitInspector({ on, busy, onExpand, onMore, onHide }: {
  on: BoardTrait;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string) => void;
  onHide: (id: string) => void;
}) {
  const { trait, read } = on;
  const expanding = busy === trait.id;
  const adding = busy === `${trait.id}:takers`;
  const domain = read?.trait.domain;
  return (
    <>
      <h3 style={styles.name}>{trait.name}</h3>
      <span className="comic-chip" style={styles.status}>
        {domain ? `Personality trait, ${domain[0].toUpperCase()}${domain.slice(1)}` : 'Personality trait'}
      </span>
      {read ? read.trait.description && <p style={styles.description}>{read.trait.description}</p> : <Thinking label="Reading it" style={styles.description} />}
      {read && (
        <dl style={styles.counts}>
          <div style={styles.count}>
            <dt>Skills that take it</dt>
            <dd style={styles.countNumber}>
              {on.expanded && read.total > read.skills.length && (
                <button className="comic-lift" style={styles.more} disabled={adding} onClick={() => onMore(trait.id)}>
                  {adding ? <>Adding<Dots /></> : 'Add more'}
                </button>
              )}
              {read.total}
            </dd>
          </div>
        </dl>
      )}
      <div style={styles.actions}>
        <button className="comic-lift" style={styles.primary} disabled={on.expanded || expanding} onClick={() => onExpand(trait.id)}>
          {expanding ? <>Expanding<Dots /></> : on.expanded ? 'Expanded' : 'Expand'}
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => onHide(trait.id)}>
          Hide
        </button>
      </div>
    </>
  );
}

//the selected topic: what it is, how many skills need it, and what can be done with it. Once it's expanded, it can
//bring the next page of skills that need it onto the board, and it opens in Topics
function TopicInspector({ on, busy, onExpand, onMore, onHide }: {
  on: BoardTopic;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string) => void;
  onHide: (id: string) => void;
}) {
  const { topic, read } = on;
  const expanding = busy === topic.id;
  const adding = busy === `${topic.id}:knowers`;
  const needed = read?.needed_by;
  return (
    <>
      <h3 style={styles.name}>{topic.name}</h3>
      <span className="comic-chip" style={styles.status}>
        Topic
      </span>
      {read ? read.topic.description && <p style={styles.description}>{read.topic.description}</p> : <Thinking label="Reading it" style={styles.description} />}
      {needed && (
        <dl style={styles.counts}>
          <div style={styles.count}>
            <dt>Skills that need it</dt>
            <dd style={styles.countNumber}>
              {on.expanded && needed.total > needed.items.length && (
                <button className="comic-lift" style={styles.more} disabled={adding} onClick={() => onMore(topic.id)}>
                  {adding ? <>Adding<Dots /></> : 'Add more'}
                </button>
              )}
              {needed.total}
            </dd>
          </div>
        </dl>
      )}
      <div style={styles.actions}>
        <button className="comic-lift" style={styles.primary} disabled={on.expanded || expanding} onClick={() => onExpand(topic.id)}>
          {expanding ? <>Expanding<Dots /></> : on.expanded ? 'Expanded' : 'Expand'}
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => navigate(`/topics/${encodeURIComponent(topic.id)}`)}>
          Open in Topics
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => onHide(topic.id)}>
          Hide
        </button>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  //asking for a skill that isn't in the results, at the bottom of them
  asking: {
    padding: '4px 4px 2px',
  },
  //the selected skill's name, description and what can be done with it, right over the board's top right corner, with a
  //glow the board's colour so the links under it don't muddle it
  title: {
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    textAlign: 'right',
    textShadow: '0 0 4px #fff, 0 0 8px #fff, 0 0 12px #fff',
  },
  titleText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.4,
  },
  titleActions: {
    marginTop: 4,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    textShadow: 'none',
  },
  titleName: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
    lineHeight: 1.1,
    color: brownRed,
    overflowWrap: 'anywhere',
  },
  //the selected skill's level picker, under the board's search box
  ladder: {
    marginTop: 8,
  },
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
  //the board across the whole width, with the panel under it
  wrap: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  boardColumn: {
    minWidth: 0,
  },
  inspector: {
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
  //in two columns where there's room
  tips: {
    margin: 0,
    paddingLeft: 20,
    columns: '320px 2',
    columnGap: 40,
    fontSize: 16,
    lineHeight: 1.4,
  },
  tip: {
    marginBottom: 6,
    breakInside: 'avoid',
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
