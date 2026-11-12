import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { abilityLevel, getSkillMap, LEVEL_NAMES, requestFill, type Skill, type SkillRef } from '../skills/api';
import { emptyBoard, expandSkill, place, withNeighbors, type SkillBoard } from '../skills/skill_board';
import { Ladder } from '../skills/skill_page';
import { GraphBoard, MapWaiting, type LinkKind } from '../shared_components/graph_board';
import type { BoardNode } from '../shared_components/board_layout';
import { useMap } from '../shared_components/use_map';
import { AtlasError } from '../shared_components/atlas-error';
import { Thinking } from '../shared_components/thinking';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import type { LinkType, Person, Stage } from './script';
import { findSkill, readNeighbors, readSkill } from './atlas';
import { abilityFit, carriedUp } from '../skills/ability_fit';
import { FitGraph } from '../shared_components/fit_graph';

// The real Atlas, shown over the whiteboard during an interlude: skills on the skill graph, or a skill's levels with
// the abilities each takes, set against one of the story's people.

const green = '#2f9a5a';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';

//how the board draws the ways skills link, as the Skills page does
const KINDS: LinkKind[] = [
  { id: 'kind_of', label: 'Kinds of skills', line: 'solid', arrow: true, colour: gunmetal, length: 90 },
  { id: 'needs', label: 'Skills needed', line: 'dashed', arrow: true, colour: 'var(--cinnamon-wood)', length: 130 },
  { id: 'similar', label: 'Similar skills', line: 'dotted', arrow: false, colour: blue, length: 150 },
  { id: 'takes', label: 'Traits needed', line: 'solid', arrow: true, colour: brownRed, length: 120 },
  { id: 'able', label: 'Abilities needed', line: 'solid', arrow: true, colour: 'var(--cinnamon-wood)', length: 120 },
  { id: 'knows', label: 'Knowledge needed', line: 'solid', arrow: true, colour: blue, length: 120 },
];

//names run together as people say them: "a, b and c"
const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export function StageView({ stage }: { stage: Stage }) {
  return (
    <div style={styles.stage}>
      {stage.kind === 'graph' ? (
        <StageGraph key={stage.skills.join('|')} skills={stage.skills} expand={!!stage.expand} show={stage.show} />
      ) : stage.kind === 'fit' ? (
        <StageFit key={stage.skills.join('|')} person={stage.person} skills={stage.skills} rank={stage.rank} focus={stage.focus} />
      ) : (
        <StageSkill key={stage.skill} name={stage.skill} rank={stage.rank} person={stage.person} picked={stage.abilities} />
      )}
    </div>
  );
}

//skills on the skill graph, selected, with everything they link to brought on once expand is set, or with no skills,
//the whole map. Only the kinds of link in show are drawn, with what they reach, so a step can light up one kind at a time
function StageGraph({ skills, expand, show }: { skills: string[]; expand: boolean; show?: LinkType[] }) {
  const map = useMap(getSkillMap);
  const [board, setBoard] = useState<SkillBoard>(emptyBoard);
  const [refs, setRefs] = useState<SkillRef[]>();
  const [error, setError] = useState<string>();
  const expanded = useRef(false);
  //a skill only brings on what it takes once its levels are written, so expanding waits for every one of them
  const written = useSkills(expand ? skills : NONE);

  useEffect(() => {
    let live = true;
    Promise.all(skills.map(findSkill)).then((list) => {
      if (!live) return;
      setRefs(list);
      if (list.length) setBoard((b) => ({ ...list.reduce(place, b), selected: list[0].id, focus: { id: list[0].id } }));
    }, (e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [skills]);

  useEffect(() => {
    if (!expand || !refs || !written.skills || expanded.current) return;
    expanded.current = true;
    //once what they link to is on, glide back to the first, which the close-up is laid out around
    Promise.all(
      refs.map(async (ref) => {
        const read = await readNeighbors(ref.id);
        setBoard((b) => withNeighbors(b, read));
        const on = withNeighbors({ ...emptyBoard(), skills: { [ref.id]: { skill: ref, expanded: false } } }, read);
        await expandSkill(on, ref.id, setBoard);
      }),
    )
      .then(() => setBoard((b) => ({ ...b, selected: refs[0].id, focus: { id: refs[0].id } })))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [expand, refs, written.skills]);

  const items = useMemo(() => map.items.map((item) => ({ ...item, filled: false })), [map.items]);
  const visitors = useMemo<BoardNode[]>(
    () => [
      ...Object.values(board.skills).filter(({ skill }) => !map.byId.has(skill.id)).map(({ skill, from }): BoardNode => ({ id: skill.id, label: skill.name, look: 'hollow', from })),
      ...Object.values(board.traits).map(({ trait, from }): BoardNode => ({ id: trait.id, label: trait.name, look: 'pale', shape: 'diamond', from })),
      ...Object.values(board.abilities).map(({ ability, from }): BoardNode => ({ id: ability.id, label: ability.name, look: 'warm', shape: 'hexagon', from })),
      ...Object.values(board.topics).map(({ topic, from }): BoardNode => ({ id: topic.id, label: topic.name, look: 'warm', from })),
    ],
    [board.skills, board.traits, board.abilities, board.topics, map.byId],
  );
  const opened = useMemo(() => new Set(Object.values(board.skills).filter((s) => s.expanded).map((s) => s.skill.id)), [board.skills]);
  const links = useMemo(() => (show ? board.links.filter((l) => show.includes(l.kind as LinkType)) : board.links), [board.links, show]);

  if (error || written.error) return <AtlasError message={(error ?? written.error)!} />;
  if (!map.nodes) return <MapWaiting error={map.error} />;
  //with no links yet the board would draw the whole map, so a step that expands waits for what it brings on
  if (expand && !links.length) return <Thinking label={written.waiting ?? 'Bringing them onto the board'} style={styles.waiting} />;
  return (
    <GraphBoard
      label={`${listed(skills)} on the skill graph`}
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
      onSelect={(id) => setBoard((b) => ({ ...b, selected: id }))}
      height="100%"
      title={refs && <h2 style={styles.graphTitle}>{refs.length ? listed(refs.map((r) => r.name)) : 'Every skill in the Atlas'}</h2>}
    />
  );
}


const NONE: string[] = [];

//how often a skill being written is checked on
const FILL_POLL_MS = 4000;

//skills by name, once every one of them has its levels written, asking for any that haven't been
function useSkills(names: string[]) {
  const [skills, setSkills] = useState<Skill[]>();
  const [waiting, setWaiting] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    let timer = 0;
    const load = async () => {
      try {
        const read = await Promise.all(names.map(async (name) => readSkill((await findSkill(name)).id)));
        if (!live) return;
        const unready = read.filter((s) => s.status !== 'ready');
        for (const s of unready) if (s.status === 'stub' || s.status === 'failed') await requestFill(s.id);
        if (unready.length) {
          setWaiting(`Writing the levels of ${unready.map((s) => s.name).join(' and ')}`);
          timer = window.setTimeout(load, FILL_POLL_MS);
        } else setSkills(read);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [names]);
  return { skills, waiting, error };
}

//the level shown: the step's, until the user picks another on the ladder
function useRank(given: number) {
  const [rank, setRank] = useState(given);
  const [lastGiven, setLastGiven] = useState(given);
  if (given !== lastGiven) {
    setLastGiven(given);
    setRank(given);
  }
  return [rank, setRank] as const;
}

//a skill's levels open at one, with each ability it takes beside where person stands on it, and the ones picked out
//brought to the front
function StageSkill({ name, rank: given, person, picked }: { name: string; rank: number; person?: Person; picked?: string[] }) {
  const [names] = useState(() => [name]);
  const { skills, waiting, error } = useSkills(names);
  const skill = skills?.[0];
  const [rank, setRank] = useRank(given);

  //the first ability picked out scrolls into view
  const list = useRef<HTMLUListElement>(null);
  const first = picked?.[0];
  useEffect(() => {
    list.current?.querySelector('[data-picked="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [first, rank, skill]);

  if (error) return <AtlasError message={error} />;
  if (!skill) return <Thinking label={waiting ?? `Opening ${name}`} />;

  const abilities = carriedUp(skill, rank);
  const level = skill.levels.find((l) => l.rank === rank);
  return (
    <section style={styles.panel} className="comic-panel">
      {/* the panel's border and fill are drawn behind it, so the scrolling happens on a layer inside */}
      <div style={styles.scroll}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{skill.name}</h2>
            {person && <span style={styles.who}>as {person.name} sees it</span>}
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        {level?.description && <p style={styles.description}>{level.description}</p>}
        <h3 style={styles.subheading}>What {LEVEL_NAMES[rank - 1]} takes</h3>
        {!abilities.length && <p style={styles.description}>No abilities are written for this level yet.</p>}
        <ul ref={list} style={styles.abilities}>
          {abilities.map((a) => {
            const theirs = person?.abilities[a.name];
            const isPicked = !picked || picked.includes(a.name);
            const affects = person?.conditions?.filter((c) => c.affects.includes(a.name)) ?? [];
            return (
              <li key={a.name} data-picked={!!picked && isPicked} style={{ ...styles.ability, ...(isPicked ? {} : styles.faded), ...(picked && isPicked ? styles.picked : {}) }}>
                <div style={styles.abilityHead}>
                  <strong>{a.name}</strong>
                  <span style={styles.needs}>needs {abilityLevel(a.level)}</span>
                </div>
                <Meter need={a.level} theirs={theirs} />
                {person && theirs === undefined && picked && isPicked && <span style={styles.unknown}>{person.name} hasn't found this one out yet</span>}
                {affects.length > 0 && <span style={styles.note}>This can be affected by {person!.name}'s {affects.map((c) => c.name).join(' and ')}.</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

//a person's strengths and gaps against a few skills at once, at a level they can change on the ladder. Skills not in
//focus step back
function StageFit({ person, skills: names, rank: given, focus }: { person: Person; skills: string[]; rank: number; focus?: string[] }) {
  const { skills, waiting, error } = useSkills(names);
  const [rank, setRank] = useRank(given);
  if (error) return <AtlasError message={error} />;
  if (!skills) return <Thinking label={waiting ?? `Opening ${names.join(', ')}`} />;

  const affectedBy: Record<string, string[]> = {};
  for (const condition of person.conditions ?? []) for (const ability of condition.affects) (affectedBy[ability] ??= []).push(condition.name);
  const { items, targets, links } = abilityFit(skills, rank, person.abilities, affectedBy);
  return (
    <section style={{ ...styles.panel, height: '100%' }} className="comic-panel">
      {/* the drawing shrinks to fit, rather than scrolling */}
      <div style={styles.fitColumn}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{person.name}'s strengths and gaps</h2>
            <span style={styles.who}>against what {LEVEL_NAMES[rank - 1]} takes</span>
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        <FitGraph
          who={person.name}
          items={items}
          targets={targets}
          links={links}
          focus={focus && skills.filter((s) => focus.includes(s.name)).map((s) => s.id)}
          labels={{ affected: `Can be affected by ${person.conditions?.map((c) => c.name).join(' and ')}` }}
          label={`${person.name}'s strengths and gaps against ${listed(names)}`}
        />
      </div>
    </section>
  );
}

//a bar from 0 to 1: where someone stands, filled in, and a tick for what the level takes, with any gap in red
function Meter({ need, theirs }: { need: number; theirs?: number }) {
  const short = theirs !== undefined && theirs < need;
  return (
    <div style={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={theirs ?? need}>
      {theirs !== undefined && <span style={{ ...styles.fill, width: `${theirs * 100}%`, background: short ? blue : green }} />}
      {short && <span style={{ ...styles.gap, left: `${theirs * 100}%`, width: `${(need - theirs) * 100}%` }} />}
      <span style={{ ...styles.tick, left: `${need * 100}%`, background: short ? brownRed : gunmetal }} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  //from under the exit button down to just over the text box
  stage: {
    position: 'absolute',
    left: '50%',
    top: 72,
    bottom: 'var(--box-height, 260px)',
    transform: 'translateX(-50%)',
    width: 'min(1000px, calc(100% - 32px))',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 5,
  },
  waiting: {
    alignSelf: 'center',
    fontSize: 22,
  },
  graphTitle: {
    margin: 0,
    padding: '4px 14px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 26,
    letterSpacing: 1,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '18px 8px 18px 24px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    '--panel-fill': paleRed,
    '--tilt': '0.3deg',
  } as CSSProperties,
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 16px 6px 0', //room for the picked abilities' shadows inside the scrolling layer
  },
  head: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 38,
    letterSpacing: 1,
    lineHeight: 1,
  },
  who: {
    fontSize: 18,
    color: brownRed,
  },
  description: {
    margin: '10px 0 0',
    fontSize: 18,
    lineHeight: 1.3,
  },
  subheading: {
    margin: '14px 0 8px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
  },
  abilities: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: 10,
  },
  ability: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '8px 12px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    transition: 'opacity 0.3s',
  },
  faded: {
    opacity: 0.35,
  },
  picked: {
    boxShadow: `4px 4px 0 ${brownRed}`,
    background: paleBlue,
  },
  abilityHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '0 8px',
    fontSize: 18,
  },
  needs: {
    fontSize: 15,
    opacity: 0.75,
  },
  meter: {
    position: 'relative',
    height: 16,
    background: '#eef0f2',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.8,
  },
  gap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    background: `repeating-linear-gradient(-45deg, ${brownRed} 0 4px, transparent 4px 8px)`,
    opacity: 0.6,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
  },
  fitColumn: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingRight: 16,
  },
  unknown: {
    fontSize: 14,
    opacity: 0.7,
  },
  note: {
    alignSelf: 'flex-start',
    padding: '2px 10px',
    background: 'var(--pale-cinnamon)',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.4,
  },
};
