import { useMemo, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import type { GroupName, PagedGroup, SkillRef, SkillStatus } from './api';
import { SearchField } from './search';
import { emptyBoard, expandSkill, moreOf, place, readThen, type BoardSkill, type SkillBoard } from './skill_board';
import { useSkillSearch, type SearchState } from './use_skill_search';
import { AtlasError } from '../shared_components/atlas-error';
import type { BoardNode } from '../shared_components/board_layout';
import { GraphBoard, type LinkKind } from '../shared_components/graph_board';
import { Mascot } from '../shared_components/mascot';

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

//the three ways skills link, as the board draws them. "A kind of" points to the broader skill, and "Needs" to the
//skill that's needed
const KINDS: LinkKind[] = [
  { id: 'kind_of', label: 'A kind of', line: 'solid', arrow: true, colour: gunmetal, length: 90 },
  { id: 'needs', label: 'Needs', line: 'dashed', arrow: true, colour: cinnamon, length: 130 },
  { id: 'similar', label: 'Similar', line: 'dotted', arrow: false, colour: blue, length: 150 },
];

//the ways a skill links, as the inspector counts them
const GROUP_LABELS: [GroupName, string][] = [
  ['broader', 'A kind of'],
  ['narrower', 'Kinds of it'],
  ['needs', 'Needs'],
  ['leads_to', 'Leads to'],
  ['similar', 'Similar'],
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
  onOpen: (skill: SkillRef) => void;
}

//the skills graph as a board to explore, in the style of Neo4j Bloom: search to put a skill on it, expand a skill to
//bring in everything it links to, and select one to read about it. Reading a skill never fills it; only opening it does
export function SkillGraph({ board, onBoard, onOpen }: SkillGraphProps) {
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const searchError = useSkillSearch(search, setSearch);
  const [busy, setBusy] = useState<string>(); //the skill being expanded, or `<id>:<group>` while more of a group is read
  const [error, setError] = useState<string>();

  const nodes = useMemo<BoardNode[]>(
    () =>
      Object.values(board.skills).map(({ skill, from, expanded }) => ({
        id: skill.id,
        label: skill.name,
        look: skill.status === 'ready' ? 'filled' : 'hollow',
        opened: expanded,
        from,
      })),
    [board.skills],
  );

  const failed = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const select = (id?: string) => {
    setError(undefined);
    onBoard((b) => ({ ...b, selected: id }));
    if (id) readThen(board, id, onBoard).catch(failed);
  };

  const grow = (id: string) => {
    setError(undefined);
    setBusy(id);
    onBoard((b) => ({ ...b, selected: id }));
    expandSkill(board, id, onBoard).catch(failed).finally(() => setBusy(undefined));
  };

  const more = (id: string, group: PagedGroup) => {
    setError(undefined);
    setBusy(`${id}:${group}`);
    moreOf(board, id, group, onBoard).catch(failed).finally(() => setBusy(undefined));
  };

  const pick = (skill: SkillRef) => {
    setSearch({ query: '' });
    onBoard((b) => place(b, skill));
    grow(skill.id);
  };

  const hide = (id: string) =>
    onBoard((b) => {
      const skills = { ...b.skills };
      delete skills[id];
      const links = b.links.filter((l) => l.from !== id && l.to !== id);
      return { ...b, skills, links, selected: b.selected === id ? undefined : b.selected };
    });

  const results = search.query.trim() ? search.results?.slice(0, RESULTS) : undefined;
  const chosen = board.selected ? board.skills[board.selected] : undefined;

  return (
    <div style={styles.wrap}>
      <div style={styles.boardColumn}>
        <GraphBoard
          label="The skills you've put on the board, and how they link"
          nodes={nodes}
          links={board.links}
          kinds={KINDS}
          layout={board.layout}
          selected={board.selected}
          focus={board.focus}
          describe={(node) => `${node.label}, ${STATUS[board.skills[node.id]?.skill.status ?? 'stub'].toLowerCase()}`}
          onSelect={select}
          onExpand={grow}
          onClear={() => onBoard(emptyBoard())}
          empty={
            <div style={styles.empty}>
              <Mascot size={72} />
              <p style={styles.bubble} className="comic-bubble comic-pop">
                Search for a skill to put it on the board, then double-click it to see what it connects to.
              </p>
            </div>
          }
        >
          <SearchField id="graph-search" query={search.query} onQuery={(query) => setSearch({ query })} compact />
          {results && (
            <ul style={styles.results}>
              {results.length === 0 && <li style={styles.none}>Nothing in the Atlas matches that yet.</li>}
              {results.map((skill) => (
                <li key={skill.id}>
                  <button className="comic-lift" style={styles.result} onClick={() => pick(skill)}>
                    <span style={styles.resultName}>{skill.name}</span>
                    {skill.broader.length > 0 && <span style={styles.kindOf}>A kind of {skill.broader.map((b) => b.name).join(', ')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchError && <AtlasError message={searchError} />}
        </GraphBoard>
      </div>

      <aside style={styles.inspector} className="comic-panel" aria-live="polite">
        {chosen ? (
          <Inspector on={chosen} busy={busy} onExpand={grow} onMore={more} onOpen={onOpen} onHide={hide} />
        ) : (
          <>
            <h3 style={styles.heading}>How the board works</h3>
            <ul style={styles.tips}>
              <li>Click a skill to read about it here.</li>
              <li>Double-click one to bring in every skill it links to.</li>
              <li>Drag a skill to move it, and it stays where you put it.</li>
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

//the selected skill: what it is, how many skills it links to each way, and what can be done with it. Once it's
//expanded, a way with more skills than are on the board can bring the next page of them on
function Inspector({ on, busy, onExpand, onMore, onOpen, onHide }: {
  on: BoardSkill;
  busy?: string;
  onExpand: (id: string) => void;
  onMore: (id: string, group: PagedGroup) => void;
  onOpen: (skill: SkillRef) => void;
  onHide: (id: string) => void;
}) {
  const { skill, neighbors } = on;
  const expanding = busy === skill.id;
  return (
    <>
      <h3 style={styles.name}>{skill.name}</h3>
      <span className="comic-chip" style={styles.status}>
        {STATUS[skill.status]}
      </span>
      {neighbors ? neighbors.skill.description && <p style={styles.description}>{neighbors.skill.description}</p> : <p style={styles.description}>Reading it...</p>}
      {neighbors && (
        <dl style={styles.counts}>
          {GROUP_LABELS.map(([group, label]) => {
            const { skills, total } = neighbors[group];
            const left = total - skills.length;
            return (
              <div key={group} style={styles.count}>
                <dt>{label}</dt>
                <dd style={styles.countNumber}>
                  {on.expanded && left > 0 && group !== 'similar' && (
                    <button className="comic-lift" style={styles.more} disabled={busy === `${skill.id}:${group}`} onClick={() => onMore(skill.id, group)}>
                      {busy === `${skill.id}:${group}` ? 'Adding...' : 'Add more'}
                    </button>
                  )}
                  {total}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      <div style={styles.actions}>
        <button className="comic-lift" style={styles.primary} disabled={on.expanded || expanding} onClick={() => onExpand(skill.id)}>
          {expanding ? 'Expanding...' : on.expanded ? 'Expanded' : 'Expand'}
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => onOpen(skill)}>
          Open skill
        </button>
        <button className="comic-lift" style={styles.button} onClick={() => onHide(skill.id)}>
          Hide
        </button>
      </div>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
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
    maxWidth: 440,
  },
  bubble: {
    margin: 0,
    '--tilt': '-1deg',
  } as CSSProperties,
};
