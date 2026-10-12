import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { isPrompt, type PersonalityTrait, type Script, type Step } from './script';
import { landfall } from './landfall/script';
import Landfall from './landfall/landfall';

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

/* ---------------------------------------------------------------------------------------------
 * profile
 * ------------------------------------------------------------------------------------------- */

type ScenarioStatus = 'not_started' | 'in_progress' | 'complete';

interface ScenarioProgress {
  scenarioId: string; //matches a ScenarioInfo id
  status: ScenarioStatus;
  startedAt?: string; //ISO timestamp
  completedAt?: string; //ISO timestamp
}

interface Profile {
  id: string;
  displayName: string;
  joinedAt: string;
  personality: {
    scenarios: ScenarioProgress[]; //only scenarios the user has touched; anything missing is not started
  };
}

//what GET /api/profile will return once the backend exists
const MOCK_PROFILE_RESPONSE: Profile = {
  id: '6c1f3a9e-2b7d-4e58-9a0c-41d7e2f8b315',
  displayName: 'Alex',
  joinedAt: '2026-08-30T17:12:00Z',
  personality: {
    scenarios: [
      {
        scenarioId: 'let_down',
        status: 'complete',
        startedAt: '2026-09-02T19:40:00Z',
        completedAt: '2026-09-02T20:05:00Z',
      },
      {
        scenarioId: 'reading_people',
        status: 'complete',
        startedAt: '2026-09-09T12:15:00Z',
        completedAt: '2026-09-09T12:48:00Z',
      },
      {
        scenarioId: 'track_record',
        status: 'complete',
        startedAt: '2026-09-21T08:30:00Z',
        completedAt: '2026-09-21T08:52:00Z',
      },
      {
        scenarioId: 'the_offer',
        status: 'in_progress',
        startedAt: '2026-10-04T21:10:00Z',
      },
    ],
  },
};

const MOCK_LATENCY_MS = 500;

//stands in for the http call until the backend exists
const fetchProfile = (): Promise<Profile> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(MOCK_PROFILE_RESPONSE)), MOCK_LATENCY_MS));

/* ---------------------------------------------------------------------------------------------
 * scenarios
 * ------------------------------------------------------------------------------------------- */

interface ScenarioInfo {
  id: string;
  title: string;
  kind: string; //the situation type
  blurb: string;
  facets: PersonalityTrait[];
}

//every scenario in the personality track, in the order listed in the README
const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'stolen_idea',
    title: 'The Stolen Idea',
    kind: 'Realistic hypothetical',
    blurb: 'A colleague presents your idea as their own, then asks you for a favor the next week.',
    facets: ['Anger', 'Self-Consciousness', 'Assertiveness', 'Cooperation', 'Modesty'],
  },
  {
    id: 'let_down',
    title: 'Let Down',
    kind: 'Recall',
    blurb: 'The last time a friend cancelled on you: what you did, how you felt, and how long it stayed with you.',
    facets: ['Anger', 'Depression', 'Friendliness', 'Emotionality', 'Trust', 'Sympathy'],
  },
  {
    id: 'landfall',
    title: 'Expedition I: Landfall',
    kind: 'Fictional role',
    blurb: "You're shipwrecked with a small group and must decide who leads, what to do first, and how to handle supplies.",
    facets: landfall.facets,
  },
  {
    id: 'the_thief',
    title: 'Expedition II: The Thief',
    kind: 'Game with stakes',
    blurb: 'Rations go missing, and you have to decide what to do about the person who took them.',
    facets: ['Liberalism', 'Trust', 'Morality', 'Altruism', 'Cooperation', 'Sympathy'],
  },
  {
    id: 'party_of_strangers',
    title: 'The Party of Strangers',
    kind: 'Realistic hypothetical',
    blurb: 'The only person you know cancels as you arrive, and the night carries on without them.',
    facets: ['Self-Consciousness', 'Immoderation', 'Friendliness', 'Gregariousness', 'Excitement-Seeking', 'Cheerfulness'],
  },
  {
    id: 'empty_weekend',
    title: 'The Empty Weekend',
    kind: 'Reflective',
    blurb: '48 hours with no obligations and a broken phone. How do you spend it, and how do you feel by Sunday night?',
    facets: ['Depression', 'Gregariousness', 'Activity Level', 'Artistic Interests', 'Intellect', 'Self-Discipline'],
  },
  {
    id: 'public_mistake',
    title: 'The Public Mistake',
    kind: 'Realistic hypothetical',
    blurb: 'You accidentally send an embarrassing error to your whole company. What happens in the first five minutes?',
    facets: ['Anxiety', 'Self-Consciousness', 'Vulnerability', 'Morality', 'Self-Efficacy', 'Dutifulness'],
  },
  {
    id: 'reading_people',
    title: 'Reading People',
    kind: 'Observer judgment',
    blurb: "Four short vignettes about other people's behavior, and what you think is really going on.",
    facets: ['Anxiety', 'Self-Consciousness', 'Emotionality', 'Trust', 'Modesty', 'Sympathy'],
  },
  {
    id: 'holiday_table',
    title: 'The Holiday Table',
    kind: 'Realistic hypothetical',
    blurb: 'A pointed remark, an old family argument, and then you are asked to host next year.',
    facets: ['Anger', 'Vulnerability', 'Assertiveness', 'Liberalism', 'Cooperation', 'Dutifulness'],
  },
  {
    id: 'the_offer',
    title: 'The Offer',
    kind: 'Reflective',
    blurb: 'An exciting but risky role in a new city, or the stable job you are good at.',
    facets: ['Anxiety', 'Excitement-Seeking', 'Adventurousness', 'Self-Efficacy', 'Achievement-Striving', 'Cautiousness'],
  },
  {
    id: 'track_record',
    title: 'Track Record',
    kind: 'Recall',
    blurb: 'A few short prompts about your actual recent past, the good moments and the overwhelming ones.',
    facets: ['Depression', 'Vulnerability', 'Cheerfulness', 'Orderliness', 'Dutifulness', 'Self-Discipline'],
  },
  {
    id: 'the_archive',
    title: 'The Archive',
    kind: 'Game with stakes',
    blurb: 'A timed task to sort a mysterious archive, with letters, artwork, and puzzles to explore along the way.',
    facets: ['Imagination', 'Artistic Interests', 'Intellect', 'Orderliness', 'Achievement-Striving', 'Self-Discipline'],
  },
  {
    id: 'rule_that_doesnt_fit',
    title: "The Rule That Doesn't Fit",
    kind: 'Realistic hypothetical',
    blurb: 'You enforce a rule, and a stranger with a sympathetic and possibly true story asks you to break it.',
    facets: ['Friendliness', 'Liberalism', 'Morality', 'Altruism', 'Sympathy', 'Dutifulness'],
  },
];

interface Playable {
  script: Script;
  renderScene: (animation: string) => ReactNode;
}

//scenarios that have been built so far, keyed by ScenarioInfo id
const PLAYABLE: Record<string, Playable> = {
  landfall: { script: landfall, renderScene: (animation) => <Landfall animation={animation} /> },
};

/* ---------------------------------------------------------------------------------------------
 * dashboard
 * ------------------------------------------------------------------------------------------- */

function Personality() {
  const [profile, setProfile] = useState<Profile>();
  const [playing, setPlaying] = useState<string>(); //id of the scenario currently open

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  //no backend yet, so finishing a scenario only marks it complete locally and the answers are dropped
  const complete = (scenarioId: string) => {
    const now = new Date().toISOString();
    setProfile((p) => {
      if (!p) return p;
      const others = p.personality.scenarios.filter((s) => s.scenarioId !== scenarioId);
      const previous = p.personality.scenarios.find((s) => s.scenarioId === scenarioId);
      const done: ScenarioProgress = { scenarioId, status: 'complete', startedAt: previous?.startedAt ?? now, completedAt: now };
      return { ...p, personality: { ...p.personality, scenarios: [...others, done] } };
    });
    setPlaying(undefined);
  };

  const open = playing ? PLAYABLE[playing] : undefined;
  if (playing && open) {
    return (
      <ScriptPlayer
        script={open.script}
        renderScene={open.renderScene}
        onExit={() => setPlaying(undefined)}
        onFinish={() => complete(playing)}
      />
    );
  }

  const progress = new Map(profile?.personality.scenarios.map((s) => [s.scenarioId, s]));
  const completed = SCENARIOS.filter((s) => progress.get(s.id)?.status === 'complete').length;

  return (
    <div style={dash.page} className="comic-page">
      <header style={dash.header}>
        <h1 style={dash.title} className="comic-title">
          Personality
        </h1>
        <div style={dash.guide}>
          <Mascot />
          <div style={dash.bubble} className="comic-bubble comic-pop">
            {profile ? greeting(profile.displayName, completed) : 'Fetching your map...'}
          </div>
        </div>
      </header>

      <OurApproach />

      {profile && (
        <>
          <ProgressMeter done={completed} total={SCENARIOS.length} />
          <ul style={dash.grid}>
            {SCENARIOS.map((scenario, i) => (
              <ScenarioCard
                key={scenario.id}
                index={i}
                scenario={scenario}
                progress={progress.get(scenario.id)}
                playable={scenario.id in PLAYABLE}
                onPlay={() => setPlaying(scenario.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const LIKERT = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

const APPROACH = [
  {
    title: 'Put you in actual situations',
    body: "Each scenario plays out like a game. React to what is happening.",
  },
  {
    title: 'Let you explain yourself',
    body: 'You tell us your thoughts, feelings, and decisions in your own words. We read them and adjust your scores based on your reasoning.',
  },
  {
    title: 'Test you everywhere',
    body: 'Family, friends, work, alone, past and future, even fantasy lands, to see how you change across different contexts.',
  },
];

//why the personality track exists, pulled from the README
function OurApproach() {
  return (
    <section style={dash.approach} className="comic-panel comic-pop">
      <div style={dash.approachColumn}>
        <h2 style={dash.approachHeading}>Personality tests are utter bullshit.</h2>
        <p style={dash.approachText}>
          If you've ever taken one, you're probably familiar with the idea. They do a terrible job of modeling people. The
          underlying model isn't the problem. The way they gather information about you is.
        </p>

        <figure style={dash.likert}>
          <blockquote style={dash.likertQuestion}>
            "Strict observance of the established rules is likely to prevent attaining a good outcome."
          </blockquote>
          <div style={dash.likertOptions}>
            {LIKERT.map((option) => (
              <span key={option} className="comic-chip">
                {option}
              </span>
            ))}
            {/* scribbled out, like a kid defacing a worksheet */}
            <svg style={dash.scribble} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
              <path
                d="M2 14 C14 2 22 18 34 8 C46 0 54 18 66 9 C76 2 86 16 98 5"
                fill="none"
                style={{ stroke: brownRed }}
                strokeWidth="2.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </figure>

        <p style={dash.approachText}>
          Questions like this are vague, leave no room for nuance, and never ask <em>why</em>. The answer depends entirely
          on where you apply it. If you're an Aztec peasant picked for sacrifice, following the rules gets you killed,
          which we'd call a bad outcome. If the IRS is auditing you and you've done nothing wrong, following them to the
          letter is probably smart. And you aren't the same person at work as you are at home or out with friends. Modern
          tests do a terrible job of capturing any of that.
        </p>
      </div>

      <div style={dash.approachColumn}>
        <h2 style={dash.approachHeading}>So here's what we do instead.</h2>
        <ol style={dash.approachList}>
          {APPROACH.map((item, i) => (
            <li key={item.title} style={dash.approachItem}>
              <span style={dash.approachNumber}>{i + 1}</span>
              <span>
                <strong style={dash.approachItemTitle}>{item.title}.</strong> {item.body}
              </span>
            </li>
          ))}
        </ol>
        <p style={dash.approachClosing}>
          Step into each scenario, make your choices, and tell us why. There are no right answers, only yours.
        </p>
      </div>
    </section>
  );
}

const greeting = (name: string, completed: number) => {
  if (completed === 0) return `Hey ${name}! Ready for your first adventure?`;
  if (completed === SCENARIOS.length) return `Wow, ${name}! You've explored every single scenario!`;
  return `Hey ${name}! You've explored ${completed} of ${SCENARIOS.length} scenarios. Where to next?`;
};

const MASCOT_BODY = 'M14 66 C10 36 30 22 50 24 C72 26 88 42 82 70 C78 92 22 96 14 66 Z';

//the speech-bubble guide who greets the user
function Mascot() {
  return (
    <svg className="comic-bob" width="96" height="104" viewBox="0 0 96 104" aria-hidden>
      {/* colours go through style rather than fill/stroke attributes so the css variables resolve */}
      <g style={{ stroke: gunmetal }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* body, with its colour bleeding past the outline */}
        <path d={MASCOT_BODY} style={{ fill: blue, stroke: 'none' }} transform="translate(3 3)" opacity="0.75" />
        <path d={MASCOT_BODY} style={{ fill: paleBlue }} />
        {/* explorer hat */}
        <path d="M18 34 C26 30 70 28 80 36" fill="none" />
        <path d="M28 33 C28 14 66 12 68 32 Z" style={{ fill: cinnamon }} />
        <path d="M30 26 C42 22 56 22 66 25" fill="none" style={{ stroke: brownRed }} strokeWidth="5" />
        {/* face */}
        <g className="comic-blink" style={{ fill: gunmetal, stroke: 'none' }}>
          <ellipse cx="38" cy="56" rx="4" ry="6" />
          <ellipse cx="60" cy="56" rx="4" ry="6" />
        </g>
        <g style={{ fill: brownRed, stroke: 'none' }} opacity="0.35">
          <ellipse cx="29" cy="68" rx="6" ry="3.5" />
          <ellipse cx="70" cy="68" rx="6" ry="3.5" />
        </g>
        <path d="M42 70 C46 76 54 76 57 70" fill="none" strokeWidth="3.5" />
      </g>
    </svg>
  );
}

function ProgressMeter({ done, total }: { done: number; total: number }) {
  return (
    <div style={dash.meter} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div style={dash.meterTrack} className="comic-meter">
        <div className="comic-meter-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span style={dash.meterLabel}>
        {done} / {total} complete
      </span>
    </div>
  );
}

type Badge = ScenarioStatus | 'soon';

const badges: Record<Badge, { label: string; fill: string; ink: string }> = {
  complete: { label: 'Done!', fill: paleBlue, ink: blue },
  in_progress: { label: 'In progress', fill: paleCinnamon, ink: cinnamon },
  not_started: { label: 'New!', fill: '#fffef6', ink: brownRed },
  soon: { label: 'Coming soon', fill: '#efebd8', ink: gunmetal },
};

const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4]; //slight hand-placed wobble so the grid doesn't look machine-ruled

interface ScenarioCardProps {
  index: number;
  scenario: ScenarioInfo;
  progress?: ScenarioProgress;
  playable: boolean;
  onPlay: () => void;
}

function ScenarioCard({ index, scenario, progress, playable, onPlay }: ScenarioCardProps) {
  const status = progress?.status ?? 'not_started';
  const badge: Badge = status === 'not_started' && !playable ? 'soon' : status;
  const look = badges[badge];
  const when = progress?.completedAt ?? progress?.startedAt;

  return (
    <li
      className="comic-pop"
      style={{ ...dash.cardSlot, '--tilt': `${TILTS[index % TILTS.length]}deg`, animationDelay: `${index * 55}ms` } as CSSProperties}
    >
      <button
        className="comic-panel comic-lift"
        style={{ ...dash.card, ...(playable ? {} : dash.cardLocked), '--panel-fill': look.fill } as CSSProperties}
        disabled={!playable}
        onClick={onPlay}
      >
        <span style={dash.cardTop}>
          <span style={{ ...dash.number, background: look.ink }}>{index + 1}</span>
          <span
            className={badge === 'complete' ? 'comic-stamp comic-slam' : 'comic-stamp'}
            style={{ color: look.ink, animationDelay: '700ms' }}
          >
            {look.label}
          </span>
        </span>

        <span style={dash.cardTitle}>{scenario.title}</span>
        <span style={dash.kind}>{scenario.kind}</span>
        <span style={dash.blurb}>{scenario.blurb}</span>

        <span style={dash.facets}>
          {scenario.facets.map((facet) => (
            <span key={facet} className="comic-chip">
              {facet}
            </span>
          ))}
        </span>

        <span style={dash.cardFooter}>
          {when && <span>{`${status === 'complete' ? 'Finished' : 'Started'} ${formatDate(when)}`}</span>}
          {playable && <span style={dash.go}>{status === 'complete' ? 'Play again ▶' : 'Play ▶'}</span>}
        </span>
      </button>
    </li>
  );
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* ---------------------------------------------------------------------------------------------
 * player
 * ------------------------------------------------------------------------------------------- */

interface Position {
  section: string; //id of the Section being played
  index: number; //index of the Step within that Section
}

interface Answer {
  choice?: number; //index into the prompt's choices, if it has any
  text: string; //the user's free text explanation
}

const TYPE_SPEED_MS = 28; //delay between each character as the text writes out

const stepText = (step: Step) => (isPrompt(step) ? step.prompt : step.text);

interface ScriptPlayerProps {
  script: Script;
  renderScene: (animation: string) => ReactNode; //the scenario's background, driven by the current step's animation
  onExit: () => void; //leave the scenario part way through
  onFinish: (answers: Record<string, Answer>) => void; //called when the user moves past the final step
}

function ScriptPlayer({ script, renderScene, onExit, onFinish }: ScriptPlayerProps) {
  //every position the user has visited, so the left arrow can walk back through branches
  const [history, setHistory] = useState<Position[]>([{ section: script.start, index: 0 }]);
  const [shown, setShown] = useState(0); //how many characters of the current text have been written out
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const position = history[history.length - 1];
  const section = script.sections[position.section];
  const step = section.steps[position.index];
  const text = stepText(step);
  const typed = shown >= text.length;
  const answer = isPrompt(step) ? answers[step.id] : undefined;
  const answered = !isPrompt(step) || (!!answer?.text.trim() && (!step.choices || answer.choice !== undefined));

  useEffect(() => {
    if (typed) return;
    const timer = setTimeout(() => setShown((s) => s + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [shown, typed]);

  const nextPosition = (): Position | undefined => {
    if (isPrompt(step) && step.choices && answer?.choice !== undefined) {
      return { section: step.choices[answer.choice].next, index: 0 };
    }
    if (position.index + 1 < section.steps.length) return { ...position, index: position.index + 1 };
    if (section.next) return { section: section.next, index: 0 };
    return undefined;
  };

  const forward = () => {
    //first press finishes writing the text out, the next one moves on
    if (!typed) {
      setShown(text.length);
      return;
    }
    if (!answered) return;
    const next = nextPosition();
    if (!next) {
      onFinish(answers);
      return;
    }
    setHistory((h) => [...h, next]);
    setShown(0);
  };

  const back = () => {
    if (history.length < 2) return;
    setHistory((h) => h.slice(0, -1));
    setShown(Infinity); //text the user has already read shows in full
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      //arrow keys move the cursor while typing an answer
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        forward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const updateAnswer = (id: string, change: Partial<Answer>) =>
    setAnswers((a) => ({ ...a, [id]: { ...(a[id] ?? { text: '' }), ...change } }));

  return (
    <div style={styles.stage}>
      {renderScene(step.animation)}

      <button style={styles.exit} className="comic-lift" onClick={onExit}>
        ◀ Back to scenarios
      </button>

      {/* the outer div positions the box so the panel inside is free to animate its own transform */}
      <div style={styles.dock}>
        <div style={styles.box} className="comic-panel comic-pop">
          {step.speaker && (
            //keyed so the tag pops in again whenever someone new starts talking
            <div key={step.speaker} style={styles.speaker} className="comic-pop">
              {step.speaker}
            </div>
          )}

          <p style={styles.text}>
            {text.slice(0, shown)}
            {/* the unwritten remainder holds its space so words don't jump between lines as they appear */}
            <span style={styles.unwritten}>{text.slice(shown)}</span>
          </p>

          {isPrompt(step) && typed && (
            <div style={styles.prompt}>
              {step.choices && (
                <div style={styles.choices}>
                  {step.choices.map((choice, i) => (
                    <button
                      key={choice.label}
                      className="comic-lift"
                      style={{ ...styles.choice, ...(answer?.choice === i ? styles.choiceSelected : {}) }}
                      onClick={() => updateAnswer(step.id, { choice: i })}
                    >
                      {answer?.choice === i ? '▶ ' : ''}
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                style={styles.answer}
                rows={3}
                value={answer?.text ?? ''}
                placeholder={step.choices ? 'Why? Explain your thinking...' : 'Type your answer and explain your thinking...'}
                onChange={(e) => updateAnswer(step.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) forward();
                  if (e.key === 'Escape') e.currentTarget.blur();
                }}
              />
              <div style={styles.promptFooter}>
                <span style={styles.hint}>Ctrl+Enter to continue · Esc to leave the text box</span>
                <button
                  className="comic-lift"
                  style={{ ...styles.continue, ...(answered ? {} : styles.continueDisabled) }}
                  disabled={!answered}
                  onClick={forward}
                >
                  Continue ▶
                </button>
              </div>
            </div>
          )}

          {!isPrompt(step) && typed && <span style={styles.more} className="comic-flash">{nextPosition() ? '▼' : '■'}</span>}
          <span style={styles.nav}>← back · → next</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  stage: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    background: '#000',
  },
  dock: {
    position: 'absolute',
    left: '50%',
    bottom: 28,
    transform: 'translateX(-50%)',
    width: 'min(860px, calc(100% - 32px))',
    zIndex: 10,
  },
  box: {
    minHeight: 130,
    padding: '24px 30px 32px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    fontFamily: 'var(--font-hand)',
    fontSize: 24,
    lineHeight: 1.4,
    '--panel-fill': paleBlue, //the colour wash that spills out from behind the box
    '--tilt': '-0.4deg',
  } as CSSProperties,
  speaker: {
    position: 'absolute',
    top: -24,
    left: 22,
    padding: '2px 16px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    '--tilt': '-3deg',
  } as CSSProperties,
  text: {
    whiteSpace: 'pre-wrap',
  },
  unwritten: {
    visibility: 'hidden',
  },
  more: {
    position: 'absolute',
    right: 24,
    bottom: 8,
    fontSize: 18,
    color: brownRed,
  },
  nav: {
    position: 'absolute',
    left: 30,
    bottom: 8,
    fontSize: 15,
    opacity: 0.5,
  },
  prompt: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  choice: {
    fontSize: 20,
    textAlign: 'left',
    padding: '6px 14px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '16px 10px 14px 8px / 10px 14px 8px 16px',
    boxShadow: `3px 3px 0 ${paleBlue}`,
  },
  choiceSelected: {
    background: blue,
    color: ivory,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  answer: {
    fontSize: 20,
    padding: '8px 12px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    outlineColor: brownRed,
    resize: 'vertical',
  },
  promptFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 15,
    opacity: 0.6,
  },
  continue: {
    padding: '4px 18px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1.5,
  },
  continueDisabled: {
    opacity: 0.4,
    boxShadow: 'none',
  },
  exit: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    padding: '4px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
};

/* ---------------------------------------------------------------------------------------------
 * dashboard styles
 * ------------------------------------------------------------------------------------------- */

//layout only; the comic look itself comes from the shared classes in App.css
const dash: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 24px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  //title on the left with the guide beside it; the guide drops underneath on narrow screens
  header: {
    maxWidth: 1100,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(48px, 8vw, 84px)',
  },
  guide: {
    flex: '1 1 360px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
  approach: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '20px 40px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleRed,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  approachColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  approachHeading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  approachClosing: {
    paddingTop: 14,
    borderTop: `3px dashed ${gunmetal}`,
    fontSize: 21,
    lineHeight: 1.3,
    color: blue,
  },
  approachText: {
    fontSize: 19,
    lineHeight: 1.3,
  },
  likert: {
    margin: 0,
    padding: '12px 16px',
    background: ivory,
    border: `3px dashed ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    transform: 'rotate(0.6deg)',
  },
  likertQuestion: {
    margin: '0 0 10px',
    fontSize: 19,
    fontStyle: 'italic',
  },
  likertOptions: {
    position: 'relative',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  scribble: {
    position: 'absolute',
    inset: '-6px -4px',
    width: 'calc(100% + 8px)',
    height: 'calc(100% + 12px)',
    pointerEvents: 'none',
  },
  approachList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  approachItem: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    fontSize: 19,
    lineHeight: 1.3,
  },
  approachNumber: {
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    background: blue,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    fontFamily: comic,
    fontSize: 20,
  },
  approachItemTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  meter: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  meterTrack: {
    flex: 1,
  },
  meterLabel: {
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1,
    whiteSpace: 'nowrap',
  },
  grid: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 30,
  },
  cardSlot: {
    display: 'flex',
  },
  card: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '18px 20px 16px',
    background: 'transparent',
    border: 'none',
    font: 'inherit',
    textAlign: 'left',
  },
  cardLocked: {
    opacity: 0.7,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  number: {
    display: 'grid',
    placeItems: 'center',
    width: 38,
    height: 38,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    color: ivory,
    fontFamily: comic,
    fontSize: 22,
  },
  cardTitle: {
    marginTop: 6,
    fontFamily: comic,
    fontSize: 30,
    letterSpacing: 1,
    lineHeight: 1.05,
  },
  kind: {
    fontSize: 16,
    fontStyle: 'italic',
    color: cinnamon,
  },
  blurb: {
    fontSize: 19,
    lineHeight: 1.25,
  },
  facets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
    opacity: 0.85,
  },
  go: {
    marginLeft: 'auto',
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
  },
};

export default Personality;
