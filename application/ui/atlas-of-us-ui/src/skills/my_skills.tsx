import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { LEVEL_NAMES, abilityLevel, clearGoal, feelingsLabel, getAchievements, getFeelings, getGoals, getNextSteps, getPersonalityFits, getPractice, getSuggestions, getTimeline, doesNotHave, hoursAWeek, monthYear, practiceLabel, setAchievement, type AchievedSkill, type Fit, type Feeling, type Fits, type Goal, type NextStep, type Practice, type Requirements, type SuggestedBy, type Suggestion, type TimelineSkill } from './api';
import { FeelingsForm } from './feelings_form';
import { GoalForm } from './goal_form';
import { PracticeForm } from './practice_form';
import Timeline from './timeline';
import { BLOOM_NAMES } from '../topics/api';
import { navigate } from '../router';
import { AffectedByNote } from './affected_by_note';
import { getAffectedBy, type AffectedBy } from '../physical/api';
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

//the My Skills view: the user's goals, then the skills they've placed themselves on, grouped by level from Expert down,
//each opening its skill page and showing what it takes to reach its next level. Then where their practice time goes,
//when they reached each level, the skills they probably have but haven't added, the skills that suit their
//personality, and the ones they got good at against its pull
export default function MySkills() {
  const [skills, setSkills] = useState<AchievedSkill[]>();
  const [steps, setSteps] = useState<Map<string, NextStep>>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>();
  const [fits, setFits] = useState<Fits>();
  const [timeline, setTimeline] = useState<TimelineSkill[]>();
  const [goals, setGoals] = useState<Goal[]>();
  const [practice, setPractice] = useState<Practice[]>();
  const [feelings, setFeelings] = useState<Map<string, Feeling[]>>();
  const [affectedBy, setAffectedBy] = useState<Map<string, AffectedBy>>(); //the user's conditions and impairments, by the ability they can affect
  const [open, setOpen] = useState<Set<string>>(new Set()); //the rows whose requirements are showing, by key
  const [setting, setSetting] = useState<string>(); //the skill a goal is being set for
  const [practising, setPractising] = useState<string>(); //the skill whose practice is being set
  const [feeling, setFeeling] = useState<string>(); //the skill whose feelings are being set
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
    getPersonalityFits().then((loaded) => live && setFits(loaded), () => {});
    getTimeline().then((loaded) => live && setTimeline(loaded), () => {});
    getGoals().then((loaded) => live && setGoals(loaded), () => {});
    getPractice().then((loaded) => live && setPractice(loaded), () => {});
    getFeelings().then((loaded) => live && setFeelings(new Map(loaded.map((s) => [s.skill_id, s.feelings]))), () => {});
    getAffectedBy().then((loaded) => live && setAffectedBy(new Map(loaded.map((b) => [b.name, b]))), () => {});
    return () => {
      live = false;
    };
  }, [loads]);

  const reload = () => {
    setSetting(undefined);
    setPractising(undefined);
    setFeeling(undefined);
    setLoads((n) => n + 1);
  };
  const toggle = (key: string) =>
    setOpen((o) => {
      const next = new Set(o);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const hasGoal = new Set(goals?.map(({ skill }) => skill.id));
  //sets a goal for a skill, under its row
  const goalForm = (id: string, current: number | null) =>
    setting === id && <GoalForm skillId={id} current={current} goal={null} onSaved={reload} onCancel={() => setSetting(undefined)} />;
  const goalButton = (id: string) => (
    <button className="comic-lift" style={styles.toggle} aria-expanded={setting === id} onClick={() => setSetting(setting === id ? undefined : id)}>
      Set a goal
    </button>
  );

  const hours = new Map(practice?.map((p) => [p.skill.id, p.hours_per_week]));

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>My Skills</h2>
      <p style={styles.text}>The skills you have, grouped by the level you have them at.</p>
      {error && <AtlasError message={error} />}
      {!error && !skills && <Thinking label="Gathering what you can do" />}
      {skills && !skills.length && <p style={styles.text}>Nothing here yet. Open a skill in the Skills Explorer and add yourself to it.</p>}
      {!!goals?.length && <Goals goals={goals} open={open} affectedBy={affectedBy} onToggle={toggle} onChanged={reload} />}
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
                            <button className="comic-lift" style={styles.toggle} aria-expanded={expanded} onClick={() => toggle(skill.id)}>
                              Next: {LEVEL_NAMES[step.rank - 1]}
                              {metOf(step)}
                              <Chevron open={expanded} />
                            </button>
                          )}
                          {rank < LEVEL_NAMES.length && skill.status === 'ready' && !hasGoal.has(skill.id) && goalButton(skill.id)}
                          {practice && (
                            <button className="comic-lift" style={styles.toggle} aria-expanded={practising === skill.id} onClick={() => setPractising(practising === skill.id ? undefined : skill.id)}>
                              {practiceLabel(hours.get(skill.id) ?? null)}
                            </button>
                          )}
                          {feelings && (
                            <button className="comic-lift" style={styles.toggle} aria-expanded={feeling === skill.id} onClick={() => setFeeling(feeling === skill.id ? undefined : skill.id)}>
                              {feelingsLabel(feelings.get(skill.id) ?? [])}
                            </button>
                          )}
                        </div>
                        {goalForm(skill.id, rank)}
                        {practising === skill.id && (
                          <PracticeForm skillId={skill.id} hours={hours.get(skill.id) ?? null} onSaved={reload} onCancel={() => setPractising(undefined)} />
                        )}
                        {feeling === skill.id && (
                          <FeelingsForm skillId={skill.id} feelings={feelings?.get(skill.id) ?? []} onSaved={reload} onCancel={() => setFeeling(undefined)} />
                        )}
                        {step && expanded && <LevelRequirements heading={`Getting to ${LEVEL_NAMES[step.rank - 1]}`} text={step.next_level} requirements={step} affectedBy={affectedBy} />}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )
          );
        })}
      {!!practice?.length && <TimeSpent practice={practice} />}
      {!!timeline?.length && <Timeline skills={timeline} />}
      {!!suggestions?.length && (
        <Suggestions
          suggestions={suggestions}
          goalButton={(id) => !hasGoal.has(id) && goalButton(id)}
          goalForm={(id) => goalForm(id, null)}
          onAdded={reload}
          onDismissed={(id) => setSuggestions((all) => all?.filter((s) => s.skill.id !== id))}
        />
      )}
      {fits && !fits.measured && (
        <section style={styles.group} aria-label="Natural fits">
          <h3 style={styles.groupHeading}>Natural fits</h3>
          <p style={styles.text}>
            Once we know your personality, this shows the skills that suit it.{' '}
            <button className="comic-lift" style={styles.link} onClick={() => navigate('/personality')}>
              Play the personality scenes
            </button>
          </p>
        </section>
      )}
      {!!fits?.natural.length && (
        <FitList label="Natural fits" intro="Skills you haven't added whose personality matches yours most closely." fits={fits.natural} />
      )}
      {!!fits?.against.length && (
        <FitList label="Against the grain" intro="Skills you got good at even though they pull against your personality." fits={fits.against} />
      )}
    </section>
  );
}

//the skills the user probably has: ones their skills' levels need, and ones their skills are a kind of. Each can be
//added at the level their skills need, opened to read its levels first, or dismissed for good
function Suggestions({ suggestions, goalButton, goalForm, onAdded, onDismissed }: {
  suggestions: Suggestion[];
  goalButton: (id: string) => ReactNode; //sets a goal for a suggested skill
  goalForm: (id: string) => ReactNode; //the form for it, when it's open
  onAdded: () => void;
  onDismissed: (id: string) => void;
}) {
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
              {skill.status === 'ready' && goalButton(skill.id)}
            </div>
            {goalForm(skill.id)}
          </li>
        ))}
      </ul>
    </section>
  );
}

//skills with how well the user's personality suits them, each opening its skill page, with the traits that say the most
//about that, the user's score on each beside where the skill pulls
function FitList({ label, intro, fits }: { label: string; intro: string; fits: Fit[] }) {
  return (
    <section style={styles.group} aria-label={label}>
      <h3 style={styles.groupHeading}>{label}</h3>
      <p style={styles.text}>{intro} Each bar is your score, and the red line is where the skill pulls.</p>
      <ul style={styles.list}>
        {fits.map(({ skill, fit, traits }) => (
          <li key={skill.id} style={styles.row}>
            <div style={styles.rowHead}>
              <button className="comic-lift" style={styles.name} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                {skill.name}
              </button>
              <span style={styles.detail}>Fits you {Math.round(fit * 100)}%</span>
            </div>
            <ul style={styles.checks}>
              {traits.map(({ name, level, yours }) => (
                <li key={name} style={styles.checkHead}>
                  <span style={styles.traitName}>
                    {level >= 0.5 ? 'High' : 'Low'} {name}
                  </span>
                  <Score yours={yours} level={level} name={name} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

//where the user's practice time goes, each skill's hours as a share of the most practiced one's, then the skills that
//look rusty, with no practice at Proficient or above, or stuck, with lots of practice and no new level in a long time
function TimeSpent({ practice }: { practice: Practice[] }) {
  const practised = practice.filter(({ hours_per_week }) => !!hours_per_week);
  const most = Math.max(...practised.map(({ hours_per_week }) => hours_per_week!));
  const total = practised.reduce((sum, { hours_per_week }) => sum + hours_per_week!, 0);
  const unsaid = practice.filter(({ hours_per_week }) => hours_per_week === null).length;
  const rusty = practice.filter(({ flag }) => flag === 'rusty');
  const plateaus = practice.filter(({ flag }) => flag === 'plateau');
  const open = (id: string) => navigate(`/skills/${encodeURIComponent(id)}`);
  return (
    <section style={styles.group} aria-label="Where your time goes">
      <h3 style={styles.groupHeading}>Where your time goes</h3>
      {practised.length ? (
        <p style={styles.text}>
          {hoursAWeek(total)} across {practised.length} skill{practised.length === 1 ? '' : 's'}.
        </p>
      ) : (
        <p style={styles.text}>Say how much you practice each of your skills above, and this shows where your time goes.</p>
      )}
      {!!practised.length && (
        <ul style={styles.bars}>
          {practised.map(({ skill, hours_per_week }) => (
            <li key={skill.id} style={styles.barRow}>
              <button className="comic-lift" style={{ ...styles.link, ...styles.barName }} onClick={() => open(skill.id)}>
                {skill.name}
              </button>
              <span style={styles.bar} role="meter" aria-label={`${skill.name} practice`} aria-valuemin={0} aria-valuemax={most} aria-valuenow={hours_per_week!}>
                <span style={{ ...styles.barFill, width: `${(hours_per_week! / most) * 100}%` }} />
              </span>
              <span style={styles.where}>{hours_per_week} h</span>
            </li>
          ))}
        </ul>
      )}
      {!!rusty.length && (
        <div>
          <h4 style={styles.minorHeading}>Getting rusty</h4>
          <ul style={styles.checks}>
            {rusty.map(({ skill, rank }) => (
              <li key={skill.id} style={styles.check}>
                <button className="comic-lift" style={styles.link} onClick={() => open(skill.id)}>
                  {skill.name}
                </button>
                <span>You're at {LEVEL_NAMES[rank - 1]} and don't practice it right now. A little regular use keeps a skill like this from fading.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!plateaus.length && (
        <div>
          <h4 style={styles.minorHeading}>On a plateau</h4>
          <ul style={styles.checks}>
            {plateaus.map(({ skill, rank, hours_per_week, at_level_since }) => (
              <li key={skill.id} style={styles.check}>
                <button className="comic-lift" style={styles.link} onClick={() => open(skill.id)}>
                  {skill.name}
                </button>
                <span>
                  {hoursAWeek(hours_per_week!)}, and at {LEVEL_NAMES[rank - 1]} since {monthYear(at_level_since)}. Practicing what {LEVEL_NAMES[rank]} takes, rather than more of the same, can move it on.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!unsaid && unsaid < practice.length && (
        <p style={styles.where}>
          {unsaid} of your skills {unsaid === 1 ? "doesn't" : "don't"} say how much you practice {unsaid === 1 ? 'it' : 'them'} yet.
        </p>
      )}
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

//how many of the skills and knowledge a level takes the user already has, for a toggle's line, e.g. ", 3 of 5 met"
function metOf({ skills, topics }: Requirements) {
  const checks = [...skills, ...topics];
  const met = checks.filter(({ rank, yours }) => yours !== null && yours >= rank).length;
  return checks.length ? `, ${met} of ${checks.length} met` : '';
}

//the user's goals, each with where they are, and once open what the level takes. Reached goals stay until cleared
function Goals({ goals, open, affectedBy, onToggle, onChanged }: { goals: Goal[]; open: Set<string>; affectedBy?: Map<string, AffectedBy>; onToggle: (key: string) => void; onChanged: () => void }) {
  const [changing, setChanging] = useState<string>();
  const [error, setError] = useState<string>();
  const today = new Date().toLocaleDateString('en-CA'); //YYYY-MM-DD, in the user's own time zone
  const clear = (id: string) =>
    clearGoal(id).then(onChanged, (e) => setError(e instanceof Error ? e.message : String(e)));
  return (
    <section style={styles.group} aria-label="Goals">
      <h3 style={styles.groupHeading}>Goals</h3>
      {error && <AtlasError message={error} />}
      <ul style={styles.list}>
        {goals.map((goal) => {
          const { skill, rank, by, current, reached_on, description } = goal;
          const key = `goal:${skill.id}`;
          const expanded = open.has(key);
          const level = LEVEL_NAMES[rank - 1];
          return (
            <li key={skill.id} style={reached_on ? { ...styles.row, ...styles.reached } : styles.row}>
              <div style={styles.rowHead}>
                <button className="comic-lift" style={styles.name} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                  {skill.name}
                </button>
                <span style={styles.detail}>
                  {reached_on
                    ? `Reached ${level} in ${monthYear(reached_on)}.`
                    : `${level}${by ? ` by ${monthYear(by)}` : ''}${by && by < today ? ', and that date has passed' : ''}. ${current ? `You're at ${LEVEL_NAMES[current - 1]}.` : 'Not on it yet.'}`}
                </span>
              </div>
              <div style={styles.actions}>
                {!reached_on && (
                  <button className="comic-lift" style={styles.toggle} aria-expanded={expanded} onClick={() => onToggle(key)}>
                    What {level} takes{metOf(goal)}
                    <Chevron open={expanded} />
                  </button>
                )}
                <button className="comic-lift" style={styles.toggle} aria-expanded={changing === skill.id} onClick={() => setChanging(changing === skill.id ? undefined : skill.id)}>
                  {reached_on ? 'Set a new goal' : 'Change goal'}
                </button>
                {reached_on && (
                  <button className="comic-lift" style={styles.toggle} onClick={() => clear(skill.id)}>
                    Clear
                  </button>
                )}
              </div>
              {changing === skill.id && (
                <GoalForm
                  skillId={skill.id}
                  current={current}
                  goal={reached_on ? null : { rank, by }}
                  onSaved={() => {
                    setChanging(undefined);
                    onChanged();
                  }}
                  onCancel={() => setChanging(undefined)}
                />
              )}
              {!reached_on && expanded && <LevelRequirements heading={`Getting to ${level}`} text={description} requirements={goal} affectedBy={affectedBy} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

//what reaching a level of a skill takes: the skills and knowledge, each marked met or not yet, and the personality and
//abilities, shown beside the user's own, with their conditions and impairments that can affect the abilities
function LevelRequirements({ heading, text, requirements, affectedBy }: { heading: string; text: string | null; requirements: Requirements; affectedBy?: Map<string, AffectedBy> }) {
  const { skills, topics, traits, abilities } = requirements;
  return (
    <div style={styles.next}>
      <h4 style={styles.subheading}>{heading}</h4>
      {text && <p style={styles.text}>{text}</p>}
      {!skills.length && !topics.length && !traits.length && !abilities.length && <p style={styles.text}>This level doesn't name any other skills, knowledge, personality or abilities.</p>}
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
      {!!abilities.length && (
        <div>
          <h5 style={styles.minorHeading}>Abilities it takes</h5>
          <ul style={styles.checks}>
            {abilities.map(({ name, level, reason, yours }) => (
              <li key={name} style={styles.check}>
                <div style={styles.checkHead}>
                  <strong>{name}, {abilityLevel(level)}</strong>
                  {yours === null ? <span style={styles.where}>Not measured yet</span> : <Score yours={yours} level={level} name={name} />}
                </div>
                <span>{reason}</span>
                <AffectedByNote affectedBy={affectedBy?.get(name)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

//a skill or topic a level takes, marked met or not yet, opening its page
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
  reached: {
    background: paleCinnamon,
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
  bars: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  barRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 12px',
    fontSize: 15,
  },
  barName: {
    flex: '0 1 220px',
    overflowWrap: 'anywhere',
  },
  bar: {
    position: 'relative',
    flex: '1 1 160px',
    height: 16,
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    inset: 0,
    right: 'auto',
    background: blue,
  },
  traitName: {
    minWidth: 190,
    fontSize: 15,
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
