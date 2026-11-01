import { useEffect, useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, getAchievements, getNextSteps, getSuggestions, doesNotHave, monthYear, setAchievement, type AchievedSkill, type NextStep, type SuggestedBy, type Suggestion } from './api';
import { BLOOM_NAMES } from '../topics/api';
import { navigate } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { LevelSteps } from '../shared_components/level_steps';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleCinnamon = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the My Skills view: the skills the user has placed themselves on, grouped by level from Expert down, each opening its
//skill page and showing what it takes to reach its next level, then the skills they probably have but haven't added
export default function MySkills() {
  const [skills, setSkills] = useState<AchievedSkill[]>();
  const [steps, setSteps] = useState<Map<string, NextStep>>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [loads, setLoads] = useState(0); //counts up to load it all again, after the user adds a suggested skill

  useEffect(() => {
    let live = true;
    getAchievements().then(
      (loaded) => live && setSkills(loaded),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    //the list is still worth reading without them
    getNextSteps().then((loaded) => live && setSteps(new Map(loaded.map((step) => [step.skill_id, step]))), () => {});
    getSuggestions().then((loaded) => live && setSuggestions(loaded), () => {});
    return () => {
      live = false;
    };
  }, [loads]);

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>My Skills</h2>
      <p style={styles.text}>The skills you have, grouped by the level you have them at.</p>
      {error && <AtlasError message={error} />}
      {!error && !skills && <Thinking label="Gathering what you can do" />}
      {skills && !skills.length && <p style={styles.text}>Nothing here yet. Open a skill in the Skills Explorer and add yourself to it.</p>}
      {LEVEL_NAMES.map((name, i) => ({ name, rank: i + 1 }))
        .reverse()
        .map(({ name, rank }) => {
          const at = skills?.filter((s) => s.rank === rank) ?? [];
          return (
            !!at.length && (
              <section key={rank} style={styles.group} aria-label={name}>
                <h3 style={styles.groupHeading}>
                  <LevelSteps rank={rank} total={LEVEL_NAMES.length} />
                  {name}
                  <span style={styles.count}>{at.length}</span>
                </h3>
                <ul style={styles.list}>
                  {at.map(({ skill, achieved_on, evidence }) => {
                    const step = steps?.get(skill.id);
                    const expanded = open.has(skill.id);
                    const toggle = () =>
                      setOpen((o) => {
                        const next = new Set(o);
                        if (!next.delete(skill.id)) next.add(skill.id);
                        return next;
                      });
                    return (
                      <li key={skill.id} style={styles.row}>
                        <div style={styles.rowHead}>
                          <button className="comic-lift" style={styles.name} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                            {skill.name}
                          </button>
                          <span style={styles.detail}>
                            {achieved_on && `Since ${monthYear(achieved_on)}. `}
                            {evidence.length ? `${evidence.length} piece${evidence.length === 1 ? '' : 's'} of evidence` : 'No evidence yet'}
                          </span>
                          {rank === LEVEL_NAMES.length && <span style={styles.top}>Top level</span>}
                          {step && (
                            <button className="comic-lift" style={styles.toggle} aria-expanded={expanded} onClick={toggle}>
                              {summary(step)}
                              <Chevron open={expanded} />
                            </button>
                          )}
                        </div>
                        {step && expanded && <NextLevel step={step} />}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )
          );
        })}
      {!!suggestions?.length && (
        <Suggestions
          suggestions={suggestions}
          onAdded={() => setLoads((n) => n + 1)}
          onDismissed={(id) => setSuggestions((all) => all?.filter((s) => s.skill.id !== id))}
        />
      )}
    </section>
  );
}

//the skills the user probably has: ones their skills' levels need, and ones their skills are a kind of. Each can be
//added at the level their skills need, opened to read its levels first, or dismissed for good
function Suggestions({ suggestions, onAdded, onDismissed }: { suggestions: Suggestion[]; onAdded: () => void; onDismissed: (id: string) => void }) {
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const act = (id: string, action: () => Promise<void>, then: () => void) => {
    setBusy(id);
    setError(undefined);
    action().then(
      () => {
        setBusy(undefined);
        then();
      },
      (e) => {
        setBusy(undefined);
        setError(e instanceof Error ? e.message : String(e));
      },
    );
  };
  return (
    <section style={styles.group} aria-label="Skills you probably have">
      <h3 style={styles.groupHeading}>Skills you probably have</h3>
      <p style={styles.text}>Your skills need these, or are a kind of them. Add the ones you have, and say which you don't.</p>
      {error && <AtlasError message={error} />}
      <ul style={styles.list}>
        {suggestions.map(({ skill, rank, needed_by, kind_of }) => (
          <li key={skill.id} style={styles.row}>
            <div style={styles.rowHead}>
              <button className="comic-lift" style={styles.name} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                {skill.name}
              </button>
              <span style={styles.detail}>{why(needed_by, kind_of)}</span>
            </div>
            <div style={styles.actions}>
              {rank !== null && skill.status === 'ready' && (
                <button className="comic-lift" style={styles.add} disabled={!!busy} onClick={() => act(skill.id, () => setAchievement(skill.id, rank, null), onAdded)}>
                  Add me at {LEVEL_NAMES[rank - 1]}
                </button>
              )}
              <button className="comic-lift" style={styles.toggle} disabled={!!busy} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                Read the levels
              </button>
              <button className="comic-lift" style={styles.toggle} disabled={!!busy} onClick={() => act(skill.id, () => doesNotHave(skill.id), () => onDismissed(skill.id))}>
                Not me
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

//why a skill is suggested: which of the user's skills need it, at the level they're at, and which are a kind of it
function why(neededBy: SuggestedBy[], kindOf: SuggestedBy[]) {
  const reasons = [];
  if (neededBy.length) reasons.push(`Needed for your ${and(neededBy.map(({ name, rank }) => (rank ? `${name} at ${LEVEL_NAMES[rank - 1]}` : name)))}.`);
  if (kindOf.length) reasons.push(`Your ${and(kindOf.map(({ name }) => name))} ${kindOf.length === 1 ? 'is a kind' : 'are kinds'} of it.`);
  return reasons.join(' ');
}

//a list in words: "a", "a and b", "a, b and c"
function and(items: string[]) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

//the toggle's one line: the next level, and how many of the skills and knowledge it takes the user already has
function summary({ rank, skills, topics }: NextStep) {
  const checks = [...skills, ...topics];
  const met = checks.filter(({ rank, yours }) => yours !== null && yours >= rank).length;
  return `Next: ${LEVEL_NAMES[rank - 1]}${checks.length ? `, ${met} of ${checks.length} met` : ''}`;
}

//what reaching the next level of a skill takes: the skills and knowledge, each marked met or not yet, and the
//personality, shown beside the user's own score
function NextLevel({ step }: { step: NextStep }) {
  const { rank, next_level, skills, topics, traits } = step;
  return (
    <div style={styles.next}>
      <h4 style={styles.subheading}>Getting to {LEVEL_NAMES[rank - 1]}</h4>
      {next_level && <p style={styles.text}>{next_level}</p>}
      {!skills.length && !topics.length && !traits.length && <p style={styles.text}>This level doesn't name any other skills, knowledge or personality.</p>}
      {!!skills.length && (
        <div>
          <h5 style={styles.minorHeading}>Skills it takes</h5>
          <ul style={styles.checks}>
            {skills.map(({ id, name, rank, reason, yours }) => (
              <Check
                key={id}
                met={yours !== null && yours >= rank}
                label={`${name} at ${LEVEL_NAMES[rank - 1]}`}
                where={yours === null ? 'Not on it yet' : `You're at ${LEVEL_NAMES[yours - 1]}`}
                reason={reason}
                onOpen={() => navigate(`/skills/${encodeURIComponent(id)}`)}
              />
            ))}
          </ul>
        </div>
      )}
      {!!topics.length && (
        <div>
          <h5 style={styles.minorHeading}>Knowledge it takes</h5>
          <ul style={styles.checks}>
            {topics.map(({ id, name, rank, reason, yours }) => (
              <Check
                key={id}
                met={yours !== null && yours >= rank}
                label={`${name} at ${BLOOM_NAMES[rank - 1]}`}
                where={yours === null ? 'Not on it yet' : `You're at ${BLOOM_NAMES[yours - 1]}`}
                reason={reason}
                onOpen={() => navigate(`/topics/${encodeURIComponent(id)}`)}
              />
            ))}
          </ul>
        </div>
      )}
      {!!traits.length && (
        <div>
          <h5 style={styles.minorHeading}>Personality it takes</h5>
          <ul style={styles.checks}>
            {traits.map(({ name, level, reason, yours }) => (
              <li key={name} style={styles.check}>
                <div style={styles.checkHead}>
                  <strong>{level >= 0.5 ? 'High' : 'Low'} {name}</strong>
                  {yours === null ? <span style={styles.where}>Not measured yet</span> : <Score yours={yours} level={level} name={name} />}
                </div>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

//a skill or topic the next level takes, marked met or not yet, opening its page
function Check({ met, label, where, reason, onOpen }: { met: boolean; label: string; where: string; reason: string; onOpen: () => void }) {
  return (
    <li style={styles.check}>
      <div style={styles.checkHead}>
        <Mark met={met} />
        <button className="comic-lift" style={styles.link} onClick={onOpen}>
          {label}
        </button>
        <span style={styles.where}>{where}</span>
      </div>
      <span>{reason}</span>
    </li>
  );
}

//a drawn tick when it's met, an empty ring when it isn't yet
function Mark({ met }: { met: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" role="img" aria-label={met ? 'Met' : 'Not yet'} style={styles.mark}>
      <circle cx="11" cy="11" r="9" fill={met ? paleCinnamon : ivory} stroke={gunmetal} strokeWidth="2.5" />
      {met && <path d="M6.5 11.5 L9.8 14.6 L15.6 7.6" fill="none" stroke={gunmetal} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

//the user's score on a trait as a bar, with a notch where the level pulls
function Score({ yours, level, name }: { yours: number; level: number; name: string }) {
  return (
    <span style={styles.score} role="meter" aria-label={`Your ${name}`} aria-valuemin={0} aria-valuemax={1} aria-valuenow={yours}>
      <span style={{ ...styles.scoreFill, width: `${Math.round(yours * 100)}%` }} />
      <span style={{ ...styles.notch, left: `${Math.round(level * 100)}%` }} />
    </span>
  );
}

//points down when the next step is closed and up when it's open
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined }}>
      <path d="M2.5 5 L7 9.5 L11.5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleCinnamon,
    '--tilt': '0.3deg',
  } as CSSProperties,
  heading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  groupHeading: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  count: {
    minWidth: 28,
    padding: '0 8px',
    boxSizing: 'border-box',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    fontFamily: 'inherit',
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '10px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  rowHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 18px',
  },
  name: {
    flex: '1 1 220px',
    padding: 0,
    background: 'none',
    border: 'none',
    color: gunmetal,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    textAlign: 'left',
    overflowWrap: 'anywhere',
    cursor: 'pointer',
  },
  detail: {
    fontSize: 15,
    color: blue,
  },
  top: {
    fontSize: 15,
    color: brownRed,
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  add: {
    padding: '4px 14px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  next: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingTop: 12,
    borderTop: `2px dashed ${gunmetal}`,
  },
  subheading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 20,
    letterSpacing: 1,
    color: brownRed,
  },
  minorHeading: {
    margin: '0 0 8px',
    fontSize: 15,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: blue,
  },
  checks: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  check: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 15,
    lineHeight: 1.45,
  },
  checkHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 10px',
  },
  mark: {
    flexShrink: 0,
  },
  link: {
    padding: 0,
    background: 'none',
    border: 'none',
    color: gunmetal,
    font: 'inherit',
    fontWeight: 700,
    textAlign: 'left',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: 'pointer',
  },
  where: {
    color: blue,
  },
  score: {
    position: 'relative',
    width: 120,
    height: 12,
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    overflow: 'visible',
  },
  scoreFill: {
    position: 'absolute',
    inset: 0,
    right: 'auto',
    background: blue,
    borderRadius: 999,
  },
  notch: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    width: 3,
    marginLeft: -1.5,
    background: brownRed,
    borderRadius: 2,
  },
};
