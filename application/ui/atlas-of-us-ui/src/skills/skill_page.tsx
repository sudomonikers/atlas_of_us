import { useEffect, useState, type CSSProperties } from 'react';
import { getRelated, getSkill, requestFill, type Level, type Related, type Skill, type SkillRef } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Mascot } from '../shared_components/mascot';

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

const LEVEL_NAMES = ['Novice', 'Advanced Beginner', 'Competent', 'Proficient', 'Expert'];

interface SkillPageProps {
  id: string;
  onLoaded: (skill: SkillRef) => void;
  onOpen: (skill: SkillRef) => void;
}

//one skill: its five levels, and every skill linked to it to hop to next. A stub is filled the first time it's opened,
//and the page waits on it. Keyed by the skill's id, so each skill starts fresh
export function SkillPage({ id, onLoaded, onOpen }: SkillPageProps) {
  const [skill, setSkill] = useState<Skill>();
  const [related, setRelated] = useState<Related>();
  const [error, setError] = useState<string>();
  const [rank, setRank] = useState(1); //the level being read

  useEffect(() => {
    let live = true;
    getSkill(id).then(
      async (loaded) => {
        if (!live) return;
        onLoaded({ id: loaded.id, name: loaded.name });
        //opening a stub is what fills it
        if (loaded.status === 'stub') {
          const { status } = await requestFill(id);
          loaded = { ...loaded, status };
        }
        if (live) setSkill(loaded);
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    ).catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    getRelated(id).then((r) => live && setRelated(r), () => {}); //the levels are still worth showing without it
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
          getRelated(id).then(setRelated, () => {});
        }, () => {}), //a failed check just waits for the next one
      FILL_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [id, status]);

  const retry = () =>
    requestFill(id).then(
      ({ status }) => setSkill((s) => s && { ...s, status }),
      (e) => setError(e instanceof Error ? e.message : String(e)),
    );

  if (error) return <AtlasError message={error} style={styles.column} />;
  if (!skill) return <p style={{ ...styles.column, ...styles.loading }}>Finding that skill...</p>;

  return (
    <article style={styles.column}>
      <header style={styles.header} className="comic-panel comic-pop">
        <h2 style={styles.name}>{skill.name}</h2>
        {skill.description && <p style={styles.description}>{skill.description}</p>}
        {skill.aliases.length > 0 && <p style={styles.aliases}>Also known as {skill.aliases.join(', ')}</p>}
      </header>

      {skill.status === 'ready' && <Levels levels={skill.levels} rank={rank} onRank={setRank} />}
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

      <Connections skill={skill} related={related} onOpen={onOpen} />
    </article>
  );
}

//the level picker, as a ladder, and what the picked level says
function Levels({ levels, rank, onRank }: { levels: Level[]; rank: number; onRank: (rank: number) => void }) {
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

//every skill linked to this one, grouped by how. Each opens that skill
function Connections({ skill, related, onOpen }: { skill: Skill; related?: Related; onOpen: (skill: SkillRef) => void }) {
  const groups: { title: string; note: string; skills: SkillRef[]; fill: string }[] = [
    { title: 'A kind of', note: `${skill.name} is a more specific form of these`, skills: skill.broader, fill: paleBlue },
    { title: 'Kinds of it', note: `More specific forms of ${skill.name}`, skills: skill.narrower, fill: paleBlue },
    { title: 'Needs', note: `Getting good at ${skill.name} takes these`, skills: related?.needs ?? [], fill: paleCinnamon },
    { title: 'Leads to', note: `${skill.name} helps you get good at these`, skills: related?.leads_to ?? [], fill: paleCinnamon },
    { title: 'Similar', note: `Close to ${skill.name} in what they're about`, skills: related?.similar ?? [], fill: paleRed },
  ].filter((group) => group.skills.length > 0);
  if (groups.length === 0) return null;

  return (
    <section style={styles.connections}>
      <h3 style={styles.connectionsHeading}>Where to next</h3>
      <div style={styles.groups}>
        {groups.map((group) => (
          <div key={group.title} style={{ ...styles.group, '--panel-fill': group.fill } as CSSProperties} className="comic-panel">
            <h4 style={styles.groupTitle}>{group.title}</h4>
            <p style={styles.groupNote}>{group.note}</p>
            <ul style={styles.chips}>
              {group.skills.map((linked) => (
                <li key={linked.id}>
                  <button className="comic-lift" style={styles.link} onClick={() => onOpen({ id: linked.id, name: linked.name })}>
                    {linked.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  column: {
    maxWidth: 1100,
    margin: '0 auto 40px',
  },
  loading: {
    fontSize: 20,
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
