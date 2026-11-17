import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CATEGORIES } from '../abilities/api';
import { DOMAINS } from '../personality/api';
import { LEVEL_NAMES } from '../skills/api';
import { BLOOM_NAMES } from '../topics/api';
import { AtlasError } from '../shared_components/atlas-error';
import { BoardLayout, type BoardNode } from '../shared_components/board_layout';
import { GraphBoard, type BoardLink, type LinkKind } from '../shared_components/graph_board';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { Thinking } from '../shared_components/thinking';
import { WrittenReport } from '../shared_components/written_report';
import { WriteUpPanel } from '../shared_components/write_up_panel';
import { askForOverallSummary, getGraph, getOverallSummary, type GraphLink, type GraphNode, type OverallSummary, type Part, type PersonGraph, type Profile } from './api';

// The Overall view of a profile: Atlas's summary of the whole person, a card for each part of them that opens its
// tab, and the graph of everything they're linked to, whose nodes open the tab they're in.

const PARTS: { id: Part; label: string }[] = [
  { id: 'personality', label: 'Personality' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'topics', label: 'Topics' },
  { id: 'skills', label: 'Skills' },
];

//the overall summary, its paragraphs in the order the tabs go in
export function OverallText({ summary }: { summary: OverallSummary }) {
  const sections = PARTS.flatMap((p) => summary.parts.filter((s) => s.key === p.id).map((s) => ({ key: s.key, label: p.label, text: s.text })));
  const lists = [
    { title: 'Strengths', items: summary.strengths },
    { title: 'Worth growing', items: summary.work_on },
    { title: 'Worth a try', items: summary.try_next },
  ];
  return <WrittenReport headline={summary.headline} overview={summary.overview} sections={sections} lists={lists} />;
}

export function OverallSection({ profile, mine, onOpen }: { profile: Profile; mine: boolean; onOpen: (part: Part) => void }) {
  return (
    <section style={styles.section} role="tabpanel">
      {mine ? (
        <WriteUpPanel
          get={getOverallSummary}
          ask={askForOverallSummary}
          render={(summary) => <OverallText summary={summary} />}
          words={{
            label: 'Your overall summary',
            finding: 'Finding your overall summary',
            writing: 'Putting the whole picture together',
            rewriting: 'Rewriting it with everything new',
            enough: "I've seen enough of you to write up how it all fits together.",
            notEnough: "Map yourself on at least two parts of the Atlas, like your personality and a skill, and I'll write up how it all fits together.",
            changed: "You've added to your map since I wrote this.",
          }}
        />
      ) : (
        profile.overall && (
          <div style={styles.panel} className="comic-panel">
            <OverallText summary={profile.overall} />
          </div>
        )
      )}
      <PartCards profile={profile} onOpen={onOpen} />
      <MapOfThem profile={profile} onOpen={onOpen} />
    </section>
  );
}

//one card for each part of them, with the gist of what's there, that opens its tab
function PartCards({ profile, onOpen }: { profile: Profile; onOpen: (part: Part) => void }) {
  const { personality, abilities, topics, skills } = profile;
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const highest = <T,>(items: T[], score: (t: T) => number) => [...items].sort((a, b) => score(b) - score(a));
  const cards: { id: Part; count: string; gist: string }[] = [
    {
      id: 'personality',
      count: count(personality.traits.length, 'trait measured', 'traits measured'),
      gist:
        personality.report?.headline ??
        (personality.traits.length
          ? `Stands out on ${highest(personality.traits, (t) => Math.abs(t.value - 0.5)).slice(0, 3).map((t) => t.name).join(', ')}.`
          : 'Nothing measured yet.'),
    },
    {
      id: 'abilities',
      count: count(abilities.placed.length, 'ability scored', 'abilities scored'),
      gist:
        abilities.summary?.headline ??
        (abilities.placed.length ? `Strongest at ${highest(abilities.placed, (a) => a.value).slice(0, 3).map((a) => a.name).join(', ')}.` : 'No tests taken yet.'),
    },
    {
      id: 'topics',
      count: count(topics.length, 'topic', 'topics'),
      gist: topics.length ? topics.slice(0, 3).map((t) => `${t.topic.name} (${BLOOM_NAMES[t.rank - 1]})`).join(', ') : 'No topics placed yet.',
    },
    {
      id: 'skills',
      count: count(skills.length, 'skill', 'skills'),
      gist: skills.length ? skills.slice(0, 3).map((s) => `${s.skill.name} (${LEVEL_NAMES[s.rank - 1]})`).join(', ') : 'No skills placed yet.',
    },
  ];
  return (
    <div style={styles.cards}>
      {cards.map((c) => (
        <button key={c.id} className="comic-lift" style={styles.card} onClick={() => onOpen(c.id)}>
          <span style={styles.cardTitle}>{PARTS.find((p) => p.id === c.id)!.label}</span>
          <span style={styles.cardCount}>{c.count}</span>
          <span style={styles.cardGist}>{c.gist}</span>
          <span style={styles.cardGo}>Open ▶</span>
        </button>
      ))}
    </div>
  );
}

//how the board draws each way things link
const KINDS: LinkKind[] = [
  { id: 'personality', label: 'Personality traits', line: 'solid', arrow: false, color: brownRed, length: 90 },
  { id: 'abilities', label: 'Abilities', line: 'solid', arrow: false, color: 'var(--cinnamon-wood)', length: 90 },
  { id: 'knowledge', label: 'Knowledge', line: 'solid', arrow: false, color: blue, length: 90 },
  { id: 'skills', label: 'Skills', line: 'solid', arrow: false, color: gunmetal, length: 90 },
  { id: 'conditions', label: 'Conditions and impairments', line: 'dashed', arrow: false, color: gunmetal, length: 90 },
  { id: 'takes_trait', label: 'Skill takes trait', line: 'solid', arrow: true, color: brownRed, length: 160, loose: true },
  { id: 'takes_ability', label: 'Skill takes ability', line: 'solid', arrow: true, color: 'var(--cinnamon-wood)', length: 160, loose: true },
  { id: 'takes_topic', label: 'Skill takes knowledge', line: 'solid', arrow: true, color: blue, length: 160, loose: true },
  { id: 'takes_skill', label: 'Skill takes skill', line: 'dashed', arrow: true, color: 'var(--cinnamon-wood)', length: 140, loose: true },
  { id: 'affects', label: 'Can affect', line: 'dotted', arrow: true, color: brownRed, length: 160, loose: true },
];

//the branch of the tree a thing is on, which the line to it is drawn as
const BRANCH: Record<Shown['kind'], string> = {
  person: 'personality',
  domain: 'personality',
  trait: 'personality',
  area: 'abilities',
  ability: 'abilities',
  condition: 'conditions',
  impairment: 'conditions',
  topic: 'knowledge',
  skill: 'skills',
  group: 'skills',
};
const GROUP_BRANCH: Record<string, string> = { 'group:conditions': 'conditions', 'group:topics': 'knowledge', 'group:skills': 'skills' };

//the hubs things that hang straight off the person are gathered under, so the board is a tree of clusters
const GROUPS: { id: string; label: string; of: GraphNode['kind'][]; part: Part }[] = [
  { id: 'group:conditions', label: 'Conditions and impairments', of: ['condition', 'impairment'], part: 'abilities' },
  { id: 'group:topics', label: 'Topics', of: ['topic'], part: 'topics' },
  { id: 'group:skills', label: 'Skills', of: ['skill'], part: 'skills' },
];

//a thing on the board: one the api sent, or one of the hubs
type Shown = Omit<GraphNode, 'kind'> & { kind: GraphNode['kind'] | 'group'; part?: Part };

//how each kind of thing looks on the board, what it's called, and the tab it opens
const LOOKS: Record<Shown['kind'], { look: BoardNode['look']; shape?: BoardNode['shape']; noun: string; part?: Part }> = {
  person: { look: 'filled', shape: 'hexagon', noun: 'you' },
  domain: { look: 'filled', shape: 'diamond', noun: 'personality domain', part: 'personality' },
  trait: { look: 'warm', noun: 'personality trait', part: 'personality' },
  area: { look: 'filled', shape: 'diamond', noun: 'area of abilities', part: 'abilities' },
  ability: { look: 'pale', noun: 'ability', part: 'abilities' },
  condition: { look: 'hollow', noun: 'condition', part: 'abilities' },
  impairment: { look: 'hollow', noun: 'impairment', part: 'abilities' },
  topic: { look: 'pale', shape: 'hexagon', noun: 'topic', part: 'topics' },
  skill: { look: 'warm', shape: 'hexagon', noun: 'skill', part: 'skills' },
  group: { look: 'filled', shape: 'diamond', noun: 'group' },
};

//a node's name as the rest of the site has it: domains and ability areas by their titles
function named(node: Shown) {
  if (node.kind === 'domain') return DOMAINS.find((d) => `domain:${d.key}` === node.id)?.title ?? node.label;
  if (node.kind === 'area') return CATEGORIES.find((c) => `area:${c.id}` === node.id)?.label ?? node.label;
  return node.label.charAt(0).toUpperCase() + node.label.slice(1);
}

//where they stand on a node, in a few words
function standing(node: Shown) {
  if (node.value !== null) return `${Math.round(node.value * 100)} out of 100`;
  if (node.rank !== null) return node.kind === 'topic' ? BLOOM_NAMES[node.rank - 1] : LEVEL_NAMES[node.rank - 1];
  return undefined;
}

const NO_ITEMS: never[] = [];

//the graph of everything they're linked to, with them in the middle. Picking a node names it and offers its tab
function MapOfThem({ profile, onOpen }: { profile: Profile; onOpen: (part: Part) => void }) {
  const [graph, setGraph] = useState<PersonGraph>();
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [layout] = useState(() => new BoardLayout());

  useEffect(() => {
    getGraph(profile.username).then(setGraph, (e: Error) => setError(e.message));
  }, [profile.username]);

  //the api's nodes and links, with what hangs straight off the person gathered under a hub for each kind
  const tree = useMemo(() => {
    if (!graph) return { shown: [] as Shown[], links: [] as GraphLink[] };
    const person = graph.nodes.find((n) => n.kind === 'person');
    const groupOf = (kind: Shown['kind']) => GROUPS.find((g) => g.of.includes(kind as GraphNode['kind']));
    const kindOf = new Map(graph.nodes.map((n) => [n.id, n.kind]));
    const used = GROUPS.filter((g) => graph.nodes.some((n) => g.of.includes(n.kind)));
    const shown: Shown[] = [
      ...graph.nodes,
      ...used.map((g) => ({ id: g.id, label: g.label, kind: 'group' as const, value: null, rank: null, part: g.part })),
    ];
    const links = graph.links.flatMap((l) => {
      const group = l.kind === 'has' && l.from === person?.id ? groupOf(kindOf.get(l.to)!) : undefined;
      return group ? [{ ...l, from: group.id }] : [l];
    });
    for (const g of used) links.unshift({ from: person!.id, to: g.id, kind: 'has', weight: null });
    return { shown, links };
  }, [graph]);
  const byId = useMemo(() => new Map(tree.shown.map((n) => [n.id, n])), [tree]);
  const person = tree.shown.find((n) => n.kind === 'person');
  //each node starts beside what it's under, a trait beside its domain and the domain beside them, so the board
  //settles into clusters
  const nodes = useMemo<BoardNode[]>(() => {
    const parent = new Map(tree.links.filter((l) => l.kind === 'has').map((l) => [l.to, l.from]));
    return tree.shown.map((n) => ({ id: n.id, label: named(n), look: LOOKS[n.kind].look, shape: LOOKS[n.kind].shape, from: parent.get(n.id) }));
  }, [tree]);
  //the tree, and what can affect an ability, are always drawn. What a skill takes is drawn only for the node picked,
  //since every skill's at once is a tangle
  const links = useMemo<BoardLink[]>(
    () =>
      tree.links
        .filter((l) => l.kind === 'has' || l.kind === 'affects' || l.from === selected || l.to === selected)
        .map((l) => ({
          from: l.from,
          to: l.to,
          kind: l.kind === 'has' ? (GROUP_BRANCH[l.to] ?? BRANCH[byId.get(l.to)?.kind ?? 'person']) : l.kind,
          weight: l.weight ?? undefined,
        })),
    [tree, selected, byId],
  );
  const crossLinks = tree.links.some((l) => l.kind.startsWith('takes_'));
  const focus = useMemo(() => (person ? { id: person.id } : undefined), [person]);

  const picked = selected ? byId.get(selected) : undefined;
  const look = picked && LOOKS[picked.kind];
  const part = picked?.part ?? look?.part;

  return (
    <div style={styles.map}>
      <h2 style={styles.heading}>Everything {profile.first_name} connects to</h2>
      {crossLinks && <p style={styles.hint}>Pick a skill to see what it takes, or a trait, ability or topic to see the skills that take it.</p>}
      {error ? (
        <AtlasError message={error} />
      ) : !graph ? (
        <Thinking label="Drawing the map" />
      ) : links.length === 0 ? (
        <p>Nothing on the map yet. It fills in as {profile.first_name} maps their personality, abilities, topics and skills.</p>
      ) : (
        <GraphBoard
          label={`Everything ${profile.first_name} connects to, and how those things link to each other`}
          noun="things"
          items={NO_ITEMS}
          visitors={nodes}
          links={links}
          kinds={KINDS}
          hierarchy="personality"
          layout={layout}
          selected={selected}
          focus={focus}
          height="min(640px, 75vh)"
          describe={(id) => {
            const n = byId.get(id);
            return n ? (n.kind === 'person' ? n.label : `${named(n)}, ${LOOKS[n.kind].noun}`) : id;
          }}
          onSelect={setSelected}
          title={
            picked &&
            look && (
              <div style={styles.picked}>
                <span style={styles.pickedName}>{picked.kind === 'person' ? picked.label : named(picked)}</span>
                <span style={styles.pickedKind}>
                  {picked.kind === 'person' ? `${profile.first_name}, in the middle of it all` : look.noun}
                  {standing(picked) && `, ${standing(picked)}`}
                </span>
                {part && (
                  <button className="comic-lift" style={styles.pickedGo} onClick={() => onOpen(part)}>
                    Open {PARTS.find((p) => p.id === part)!.label} ▶
                  </button>
                )}
              </div>
            )
          }
        />
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    fontSize: 19,
  },
  panel: {
    padding: '22px 28px 8px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
    gap: 16,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    padding: '14px 18px',
    textAlign: 'left',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: 'inherit',
    fontSize: 17,
    lineHeight: 1.35,
    cursor: 'pointer',
  },
  cardTitle: {
    fontFamily: comic,
    fontSize: 28,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  cardCount: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
    color: blue,
  },
  cardGist: {
    flex: 1,
  },
  cardGo: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
  map: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1.5,
    color: brownRed,
  },
  hint: {
    margin: 0,
    fontSize: 17,
  },
  picked: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    textAlign: 'right',
  },
  pickedName: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
    lineHeight: 1.1,
  },
  pickedKind: {
    fontSize: 15,
  },
  pickedGo: {
    padding: '2px 12px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    cursor: 'pointer',
  },
};
