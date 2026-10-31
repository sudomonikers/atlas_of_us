import { useEffect, useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, getNeighborPage, getAchievement, getNeighbors, getSkill, requestFill, type Achievement, type GroupName, type Level, type Neighbors, type PagedGroup, type Skill, type SkillRef, type SkillRequirement, type TopicRequirement, type TraitRequirement } from './api';
import { AchievementCard } from './achievement_card';
import { AchievementWalkthrough } from './achievement_walkthrough';
import { AtlasError } from '../shared_components/atlas-error';
import { Mascot } from '../shared_components/mascot';
import { navigate } from '../router';
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

//how often a skill being filled is checked on
const FILL_POLL_MS = 4000;

//a topic's levels, Bloom's taxonomy, by rank
const BLOOM_NAMES = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

interface SkillPageProps {
  id: string;
  onLoaded: (skill: SkillRef) => void;
  onOpen: (skill: SkillRef) => void;
  onShowInGraph: (skill: SkillRef) => void;
}

//one skill: its five levels, and every skill linked to it to hop to next. A stub is filled the first time it's opened,
//and the page waits on it. Keyed by the skill's id, so each skill starts fresh
export function SkillPage({ id, onLoaded, onOpen, onShowInGraph }: SkillPageProps) {
  const [skill, setSkill] = useState<Skill>();
  const [neighbors, setNeighbors] = useState<Neighbors>();
  const [error, setError] = useState<string>();
  const [rank, setRank] = useState(1); //the level being read
  const [achievement, setAchievement] = useState<Achievement>(); //where the user is with it, once it's ready
  const [walking, setWalking] = useState(false); //walking through its levels to place themselves on it

  useEffect(() => {
    let live = true;
    getSkill(id).then(
      async (loaded) => {
        if (!live) return;
        onLoaded({ id: loaded.id, name: loaded.name, status: loaded.status });
        //opening a stub is what fills it
        if (loaded.status === 'stub') {
          const { status } = await requestFill(id);
          loaded = { ...loaded, status };
        }
        if (live) setSkill(loaded);
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    ).catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    getNeighbors(id).then((n) => live && setNeighbors(n), () => {}); //the levels are still worth showing without them
    return () => {
      live = false;
    };
  }, [id, onLoaded]);

  //checks on a filling skill until it's ready or has failed, then fetches what's around it again
  const status = skill?.status;
  useEffect(() => {
    if (status !== 'filling') return;
    const timer = window.setInterval(
      () =>
        getSkill(id).then((loaded) => {
          if (loaded.status === 'filling') return;
          setSkill(loaded);
          getNeighbors(id).then(setNeighbors, () => {});
        }, () => {}), //a failed check just waits for the next one
      FILL_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [id, status]);

  //where the user is with it, once it has levels to be at
  useEffect(() => {
    if (status !== 'ready') return;
    let live = true;
    getAchievement(id).then((a) => live && setAchievement(a), () => {}); //the skill is still worth reading without it
    return () => {
      live = false;
    };
  }, [id, status]);

  const retry = () =>
    requestFill(id).then(
      ({ status }) => setSkill((s) => s && { ...s, status }),
      (e) => setError(e instanceof Error ? e.message : String(e)),
    );

  if (error) return <AtlasError message={error} style={styles.column} />;
  if (!skill) return <Thinking label="Finding that skill" mascot style={styles.column} />;

  return (
    <article style={styles.column}>
      <header style={styles.header} className="comic-panel comic-pop">
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{skill.name}</h2>
          <div style={styles.headerButtons}>
            {achievement?.rank === null && (
              <button className="comic-lift" style={styles.button} onClick={() => setWalking(true)}>
                Add yourself
              </button>
            )}
            <button className="comic-lift" style={styles.graphButton} onClick={() => onShowInGraph({ id: skill.id, name: skill.name, status: skill.status })}>
              See it on the map
            </button>
          </div>
        </div>
        {skill.description && <p style={styles.description}>{skill.description}</p>}
        {skill.aliases.length > 0 && <p style={styles.aliases}>Also known as {skill.aliases.join(', ')}</p>}
      </header>

      {skill.status === 'ready' && (
        <>
          {achievement && achievement.rank !== null && (
            <AchievementCard skill={skill} rank={achievement.rank} achievement={achievement} onChange={setAchievement} onWalk={() => setWalking(true)} />
          )}
          {achievement && walking && (
            <AchievementWalkthrough skill={skill} achievement={achievement} onChange={setAchievement} onClose={() => setWalking(false)} />
          )}
          <Levels levels={skill.levels} rank={rank} mine={achievement?.rank ?? null} onRank={setRank} onOpen={onOpen} />
        </>
      )}
      {(skill.status === 'filling' || skill.status === 'stub') && (
        <div style={styles.waiting}>
          <Mascot />
          <p style={styles.bubble} className="comic-bubble comic-pop">
            Nobody has opened {skill.name} before, so I'm writing up its five levels now. Give me a minute.
          </p>
        </div>
      )}
      {skill.status === 'failed' && (
        <div style={styles.waiting}>
          <Mascot />
          <div style={styles.bubble} className="comic-bubble comic-pop">
            <p style={styles.bubbleText}>I got tangled up writing the levels for {skill.name}.</p>
            <button className="comic-lift" style={styles.button} onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {neighbors && <Connections name={skill.name} neighbors={neighbors} onNeighbors={setNeighbors} onOpen={onOpen} />}
    </article>
  );
}

//the level picker, as a ladder, and what the picked level says
function Levels({ levels, rank, mine, onRank, onOpen }: {
  levels: Level[];
  rank: number;
  mine: number | null; //the level the user is at, marked on its rung
  onRank: (rank: number) => void;
  onOpen: (skill: SkillRef) => void;
}) {
  const level = levels.find((l) => l.rank === rank);
  const next = LEVEL_NAMES[rank]; //missing on Expert
  return (
    <section style={styles.levels}>
      <div style={styles.ladder} role="tablist" aria-label="Levels">
        {LEVEL_NAMES.map((name, i) => (
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
            {mine === i + 1 && <span className="comic-chip" style={styles.you}>You</span>}
          </button>
        ))}
      </div>

      {level && (
        <div key={rank} role="tabpanel" style={styles.level} className="comic-panel comic-pop">
          <div style={styles.levelHead}>
            <h3 style={styles.levelName}>{LEVEL_NAMES[rank - 1]}</h3>
            {level.trust === 'provisional' && (
              <span className="comic-chip" title="Written by AI and waiting on people who have the skill to check it">
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
          <Prerequisites levels={levels} rank={rank} onOpen={onOpen} />
          <Knowledge levels={levels} rank={rank} />
          <Traits levels={levels} rank={rank} />
          {level.next_level && next && (
            <div style={styles.next}>
              <h4 style={styles.subheading}>Getting to {next}</h4>
              <p style={styles.text}>{level.next_level}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

//the requirements the picked level has: each one from the highest level at or below it, since a requirement carries up
//until a higher level changes it, strongest first
function carriedUp<T extends { strength: number }>(levels: Level[], rank: number, written: (level: Level) => T[], key: (requirement: T) => string) {
  const carried = new Map<string, { requirement: T; from: number }>();
  for (const level of [...levels].sort((a, b) => a.rank - b.rank)) {
    if (level.rank > rank) break;
    for (const requirement of written(level)) carried.set(key(requirement), { requirement, from: level.rank });
  }
  return [...carried.values()].sort((a, b) => b.requirement.strength - a.requirement.strength);
}

//how much a requirement matters, as a drawn bar, and the level it carries up from
function Strength({ strength, from, rank, label }: { strength: number; from: number; rank: number; label: string }) {
  return (
    <>
      <span style={styles.strength} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={1} aria-valuenow={strength}>
        <span style={{ ...styles.strengthFill, width: `${Math.round(strength * 100)}%` }} />
      </span>
      {from < rank && <span style={styles.from}>from {LEVEL_NAMES[from - 1]}</span>}
    </>
  );
}

//the other skills the picked level needs, and the level of each. Each opens that skill
function Prerequisites({ levels, rank, onOpen }: { levels: Level[]; rank: number; onOpen: (skill: SkillRef) => void }) {
  const skills = carriedUp<SkillRequirement>(levels, rank, (level) => level.skills, (requirement) => requirement.id);
  if (!skills.length) return null;
  return (
    <div>
      <h4 style={styles.subheading}>Skills it takes</h4>
      <ul style={styles.traits}>
        {skills.map(({ requirement, from }) => (
          <li key={requirement.id} style={styles.trait}>
            <div style={styles.traitHead}>
              <button className="comic-lift" style={styles.link} onClick={() => onOpen(requirement)}>
                {requirement.name} at {LEVEL_NAMES[requirement.rank - 1]}
              </button>
              <Strength strength={requirement.strength} from={from} rank={rank} label="How essential it is" />
              {requirement.status !== 'ready' && <span style={styles.from}>not filled in yet</span>}
            </div>
            <span>{requirement.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

//the topics the picked level needs knowledge of, and the level of each. Each opens that topic
function Knowledge({ levels, rank }: { levels: Level[]; rank: number }) {
  const topics = carriedUp<TopicRequirement>(levels, rank, (level) => level.topics, (requirement) => requirement.id);
  if (!topics.length) return null;
  return (
    <div>
      <h4 style={styles.subheading}>Knowledge it takes</h4>
      <ul style={styles.traits}>
        {topics.map(({ requirement, from }) => (
          <li key={requirement.id} style={styles.trait}>
            <div style={styles.traitHead}>
              <button className="comic-lift" style={styles.link} onClick={() => navigate(`/topics/${encodeURIComponent(requirement.id)}`)}>
                {requirement.name} at {BLOOM_NAMES[requirement.rank - 1]}
              </button>
              <Strength strength={requirement.strength} from={from} rank={rank} label="How essential it is" />
              {requirement.status !== 'ready' && <span style={styles.from}>not filled in yet</span>}
            </div>
            <span>{requirement.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

//the personality the picked level takes
function Traits({ levels, rank }: { levels: Level[]; rank: number }) {
  const traits = carriedUp<TraitRequirement>(levels, rank, (level) => level.traits, (requirement) => requirement.name);
  if (!traits.length) return null;
  return (
    <div>
      <h4 style={styles.subheading}>Personality it takes</h4>
      <ul style={styles.traits}>
        {traits.map(({ requirement, from }) => (
          <li key={requirement.name} style={styles.trait}>
            <div style={styles.traitHead}>
              <strong>{requirement.level >= 0.5 ? 'High' : 'Low'} {requirement.name}</strong>
              <Strength strength={requirement.strength} from={from} rank={rank} label="How much it matters" />
            </div>
            <span>{requirement.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

//the skills linked to this one, grouped by how, a page at a time. Each opens that skill
function Connections({ name, neighbors, onNeighbors, onOpen }: {
  name: string;
  neighbors: Neighbors;
  onNeighbors: (update: (n?: Neighbors) => Neighbors | undefined) => void;
  onOpen: (skill: SkillRef) => void;
}) {
  const [reading, setReading] = useState<PagedGroup>(); //the group whose next page is being read
  const groups: { group: GroupName; title: string; note: string; fill: string }[] = [
    { group: 'broader', title: 'A kind of', note: `${name} is a more specific form of these`, fill: paleBlue },
    { group: 'narrower', title: 'Kinds of it', note: `More specific forms of ${name}`, fill: paleBlue },
    { group: 'needs', title: 'Needs', note: `Getting good at ${name} takes these`, fill: paleCinnamon },
    { group: 'leads_to', title: 'Leads to', note: `${name} helps you get good at these`, fill: paleCinnamon },
    { group: 'similar', title: 'Similar', note: `Close to ${name} in what they're about`, fill: paleRed },
  ];
  const shown = groups.filter(({ group }) => neighbors[group].total > 0);
  if (shown.length === 0) return null;

  const more = (group: PagedGroup) => {
    setReading(group);
    getNeighborPage(neighbors.skill.id, group, neighbors[group].skills.length)
      .then(
        (page) => onNeighbors((n) => n && { ...n, [group]: { skills: [...n[group].skills, ...page.skills], total: page.total } }),
        () => {}, //the button stays, to try again
      )
      .finally(() => setReading(undefined));
  };

  return (
    <section style={styles.connections}>
      <h3 style={styles.connectionsHeading}>Where to next</h3>
      <div style={styles.groups}>
        {shown.map(({ group, title, note, fill }) => {
          const { skills, total } = neighbors[group];
          return (
            <div key={group} style={{ ...styles.group, '--panel-fill': fill } as CSSProperties} className="comic-panel">
              <h4 style={styles.groupTitle}>{title}</h4>
              <p style={styles.groupNote}>{note}</p>
              <ul style={styles.chips}>
                {skills.map((linked) => (
                  <li key={linked.id}>
                    <button className="comic-lift" style={styles.link} onClick={() => onOpen(linked)}>
                      {linked.name}
                    </button>
                  </li>
                ))}
              </ul>
              {group !== 'similar' && skills.length < total && (
                <button className="comic-lift" style={styles.moreLinks} disabled={reading === group} onClick={() => more(group)}>
                  {reading === group ? <>Reading<Dots /></> : `Show more (${total - skills.length} left)`}
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
  headerButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  you: {
    background: ivory,
    color: gunmetal,
    fontSize: 13,
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
};
