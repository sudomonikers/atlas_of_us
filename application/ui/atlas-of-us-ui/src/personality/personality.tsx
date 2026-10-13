import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { isPrompt, type PersonalityTrait, type PromptFrame, type Script, type Step } from './script';
import { getJob, getPersonEvidence, getPersonTraits, getProgress, getQuestions, getTraits, saveAnswer, type SavedAnswer, type ScenarioQuestion } from './api';
import { landfall } from './landfall/script';
import Landfall from './landfall/landfall';
import { theThief } from './the_thief/script';
import Thief from './the_thief/thief';
import { readingPeople } from './reading_people/script';
import ReadingPeople from './reading_people/reading_people';
import { theArchive } from './the_archive/script';
import TheArchive from './the_archive/the_archive';
import { ruleThatDoesntFit } from './rule_that_doesnt_fit/script';
import LastFerry from './rule_that_doesnt_fit/last_ferry';
import { theOffer } from './the_offer/script';
import TheOffer from './the_offer/the_offer';
import { useSession } from '../auth/api';
import { RequireLogin } from '../auth/require-login';

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
 * progress
 * ------------------------------------------------------------------------------------------- */

type ScenarioStatus = 'not_started' | 'in_progress' | 'complete';

interface ScenarioProgress {
  status: ScenarioStatus;
  startedAt?: string; //ISO timestamp
  completedAt?: string; //ISO timestamp
}

//the user's answers, plus the question lists needed to tell in progress from complete
async function fetchProgress() {
  const answers = await getProgress();
  const names = [...new Set([...Object.keys(PLAYABLE), ...answers.map((a) => a.scenario)])];
  const lists = await Promise.all(names.map(getQuestions));
  return { answers, questions: Object.fromEntries(names.map((name, i) => [name, lists[i]])) };
}

//some questions answered is in progress, the last one is complete. Questions on a clock can be skipped
function toProgress(answers: SavedAnswer[], questions: Record<string, ScenarioQuestion[]>) {
  const progress: Record<string, ScenarioProgress> = {};
  for (const name of new Set(answers.map((a) => a.scenario))) {
    const mine = answers.filter((a) => a.scenario === name);
    const dates = mine.map((a) => a.answered_date).sort();
    const last = questions[name]?.[questions[name].length - 1];
    const complete = !!last && mine.some((a) => a.question_key === last.key);
    progress[name] = {
      status: complete ? 'complete' : 'in_progress',
      startedAt: dates[0],
      completedAt: complete ? dates[dates.length - 1] : undefined,
    };
  }
  return progress;
}

/* ---------------------------------------------------------------------------------------------
 * traits
 * ------------------------------------------------------------------------------------------- */

interface Trait {
  id: string;
  name: string;
  domain: string; //a DOMAINS key
  description?: string;
  value?: number; //0 to 1, missing until we've learned enough to measure it
  confidence?: number; //0 to 1, how much evidence the value is based on
  contributions: Contribution[]; //the answers that moved the value, biggest first
}

interface Contribution {
  scenario: string;
  question: string;
  answer: string;
  reasoning?: string;
  delta: number; //-1 (towards low) to 1 (towards high)
  evidence?: string; //the llm's reason, missing for the picked choice's base score
}

//the Big Five domains, then everything else. A facet's domain is the prefix of its description, e.g. "openness facet: ..."
const DOMAINS = [
  { key: 'openness', title: 'Openness', blurb: 'How you take in ideas, art, feelings and new experiences.' },
  { key: 'conscientiousness', title: 'Conscientiousness', blurb: 'How you organize yourself and follow through.' },
  { key: 'extraversion', title: 'Extraversion', blurb: 'Where you get your energy, and how much of it you show.' },
  { key: 'agreeableness', title: 'Agreeableness', blurb: 'How you treat other people and handle conflict.' },
  { key: 'neuroticism', title: 'Neuroticism', blurb: 'How strongly you react to stress and bad feelings.' },
  { key: 'other', title: 'Beyond the Big Five', blurb: 'Parts of being human the Big Five leave out.' },
];

//every trait, with the user's value where one has been measured and the answers behind it
async function fetchTraits(personId: string): Promise<Trait[]> {
  const [all, mine, evidence] = await Promise.all([getTraits(), getPersonTraits(personId), getPersonEvidence(personId)]);
  const scores = new Map(mine.map((t) => [t.id, t]));
  const contributions = evidence.flatMap(({ shifts, reasoning, ...answer }) =>
    shifts.map((s) => ({ ...answer, reasoning: reasoning ?? undefined, trait: s.trait, delta: s.delta, evidence: s.evidence })),
  );
  return all.map((t) => {
    const facet = /^(\w+) facet: (.*)$/s.exec(t.description ?? '');
    const domain = facet && DOMAINS.some((d) => d.key === facet[1]) ? facet[1] : 'other';
    const description = facet ? facet[2] : t.description ?? undefined;
    return {
      id: t.id,
      name: t.name,
      domain,
      description: description && description[0].toUpperCase() + description.slice(1),
      value: scores.get(t.id)?.value,
      confidence: scores.get(t.id)?.confidence,
      contributions: contributions.filter((c) => c.trait === t.name).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    };
  });
}

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
    facets: theThief.facets,
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
    facets: readingPeople.facets,
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
    facets: theOffer.facets,
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
    facets: theArchive.facets,
  },
  {
    id: 'rule_that_doesnt_fit',
    title: "The Rule That Doesn't Fit",
    kind: 'Realistic hypothetical',
    blurb: 'You enforce a rule, and a stranger with a sympathetic and possibly true story asks you to break it.',
    facets: ruleThatDoesntFit.facets,
  },
];

interface Playable {
  script: Script;
  renderScene: (animation: string, clock?: number) => ReactNode;
}

//scenarios that have been built so far, keyed by ScenarioInfo id
const PLAYABLE: Record<string, Playable> = {
  landfall: { script: landfall, renderScene: (animation) => <Landfall animation={animation} /> },
  the_thief: { script: theThief, renderScene: (animation) => <Thief animation={animation} /> },
  reading_people: { script: readingPeople, renderScene: (animation) => <ReadingPeople animation={animation} /> },
  the_archive: { script: theArchive, renderScene: (animation, clock) => <TheArchive animation={animation} clock={clock} /> },
  rule_that_doesnt_fit: { script: ruleThatDoesntFit, renderScene: (animation) => <LastFerry animation={animation} /> },
  the_offer: { script: theOffer, renderScene: (animation) => <TheOffer animation={animation} /> },
};

/* ---------------------------------------------------------------------------------------------
 * dashboard
 * ------------------------------------------------------------------------------------------- */

type View = 'scenarios' | 'traits';

const VIEWS: { id: View; label: string }[] = [
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'traits', label: 'My Personality' },
];

function Personality() {
  const session = useSession();
  const loggedIn = session.status === 'authenticated';
  const personId = session.status === 'authenticated' ? session.person.id : undefined;
  const [view, setView] = useState<View>('scenarios');
  const [playing, setPlaying] = useState<string>(); //id of the scenario currently open
  const [answers, setAnswers] = useState<SavedAnswer[]>(); //undefined until loaded
  const [questions, setQuestions] = useState<Record<string, ScenarioQuestion[]>>({}); //keyed by scenario name
  const [loadError, setLoadError] = useState<string>();

  const load = useCallback(
    () =>
      fetchProgress().then(
        (loaded) => {
          setAnswers(loaded.answers);
          setQuestions(loaded.questions);
          setLoadError(undefined);
        },
        (e) => setLoadError(e instanceof Error ? e.message : String(e)),
      ),
    [],
  );

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  //finishing a scenario rescores the user's traits in the background. No new scenarios until it's done
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    if (loggedIn) getJob().then((job) => setScoring(job.running), () => {});
  }, [loggedIn]);

  useEffect(() => {
    if (!scoring) return;
    const timer = setInterval(() => getJob().then((job) => setScoring(job.running), () => {}), 3000);
    return () => clearInterval(timer);
  }, [scoring]);

  const [traits, setTraits] = useState<Trait[]>(); //undefined until loaded
  const [traitsError, setTraitsError] = useState<string>();

  //fetched each time the view opens or scoring finishes, so it picks up anything measured since
  useEffect(() => {
    if (view !== 'traits' || !personId) return;
    fetchTraits(personId).then(
      (loaded) => {
        setTraits(loaded);
        setTraitsError(undefined);
      },
      (e) => setTraitsError(e instanceof Error ? e.message : String(e)),
    );
  }, [view, personId, scoring]);

  //saves an answer as the player moves past a prompt
  const answer = (scenario: string) => async (step: PromptFrame, given: Answer) => {
    const question = questions[scenario]?.find((q) => q.key === step.id);
    if (!question) throw new Error("This question isn't set up on the server yet, so your answer can't be saved.");
    const choice = step.choices && given.choice !== undefined ? step.choices[given.choice].label : undefined;
    const saved = await saveAnswer(question.id, choice ?? given.text, choice ? given.text : undefined);
    if (saved.job_started) setScoring(true);
  };

  const open = playing ? PLAYABLE[playing] : undefined;
  if (playing && open) {
    const exit = () => {
      setPlaying(undefined);
      load(); //pick up what was answered
    };
    return (
      <ScriptPlayer
        script={open.script}
        renderScene={open.renderScene}
        earlier={answers ?? []}
        onAnswer={answer(playing)}
        onExit={exit}
        onFinish={exit}
      />
    );
  }

  //nothing is shown as started while logged out, when the page sits behind the login card
  const progress = loggedIn && answers ? toProgress(answers, questions) : {};
  const ready = !loggedIn || answers !== undefined;

  const completed = SCENARIOS.filter((s) => progress[s.id]?.status === 'complete').length;
  const firstName = session.status === 'authenticated' ? session.person.first_name : undefined;

  const bubble = scoring
    ? "Give us a moment, We are reading through your answers to work out your personality..."
    : view === 'scenarios'
      ? loadError
        ? `Hmm, we couldn't load your progress. ${loadError}`
        : ready
          ? greeting(firstName, completed)
          : 'Fetching your map...'
      : traitsError
        ? `Hmm, we couldn't load your traits. ${traitsError}`
        : traits
          ? traitsGreeting(firstName, traits)
          : 'Flipping through our notes on you...';

  return (
    <RequireLogin reason="You need an account to play the personality scenarios and keep track of your progress.">
      <div style={dash.page} className="comic-page">
        <header style={dash.header}>
          <h1 style={dash.title} className="comic-title">
            Personality
          </h1>
          <div style={dash.guide}>
            <Mascot />
            <div style={dash.bubble} className="comic-bubble comic-pop">
              {bubble}
            </div>
          </div>
        </header>

        <div style={dash.views}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className="comic-lift"
              style={{ ...dash.viewButton, ...(view === v.id ? dash.viewButtonActive : {}) }}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'traits' && traits && <TraitDashboard traits={traits} />}

        {view === 'scenarios' && <OurApproach />}

        {view === 'scenarios' && ready && (
          <>
            <ProgressMeter done={completed} total={SCENARIOS.length} label="complete" />
            <ul style={dash.grid}>
              {SCENARIOS.map((scenario, i) => (
                <ScenarioCard
                  key={scenario.id}
                  index={i}
                  scenario={scenario}
                  progress={progress[scenario.id]}
                  playable={scenario.id in PLAYABLE}
                  locked={scoring}
                  onPlay={() => setPlaying(scenario.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </RequireLogin>
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

//name is missing while logged out, when the page sits behind the login card
const greeting = (name: string | undefined, completed: number) => {
  if (completed === 0) return `Hey ${name ?? 'there'}! Ready for your first adventure?`;
  if (completed === SCENARIOS.length) return `Wow${name ? `, ${name}` : ''}! You've explored every single scenario!`;
  return `Hey ${name ?? 'there'}! You've explored ${completed} of ${SCENARIOS.length} scenarios. Where to next?`;
};

const traitsGreeting = (name: string | undefined, traits: Trait[]) => {
  const measured = traits.filter((t) => t.value !== undefined).length;
  if (measured === 0) return `We don't know enough about you yet${name ? `, ${name}` : ''}. Play a scenario and your traits will start filling in!`;
  if (measured === traits.length) return `Here's the whole picture${name ? `, ${name}` : ''}. Every trait has been measured!`;
  return `Here's what we've learned so far${name ? `, ${name}` : ''}. Keep playing scenarios to fill in the rest.`;
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

function ProgressMeter({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div style={dash.meter} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div style={dash.meterTrack} className="comic-meter">
        <div className="comic-meter-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span style={dash.meterLabel}>
        {done} / {total} {label}
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
  locked: boolean; //playable, but not until scoring finishes
  onPlay: () => void;
}

function ScenarioCard({ index, scenario, progress, playable, locked, onPlay }: ScenarioCardProps) {
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
        style={{ ...dash.card, ...(playable && !locked ? {} : dash.cardLocked), '--panel-fill': look.fill } as CSSProperties}
        disabled={!playable || locked}
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
          {playable && <span style={dash.go}>{locked ? 'Scoring...' : status === 'complete' ? 'Play again ▶' : 'Play ▶'}</span>}
        </span>
      </button>
    </li>
  );
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

//the "My Personality" view: where the user sits on every trait, grouped by domain
function TraitDashboard({ traits }: { traits: Trait[] }) {
  const measured = traits.filter((t) => t.value !== undefined).length;
  const domains = DOMAINS.map((d) => ({ ...d, traits: traits.filter((t) => t.domain === d.key) })).filter((d) => d.traits.length);

  return (
    <>
      <ProgressMeter done={measured} total={traits.length} label="measured" />
      <p style={dash.traitsIntro}>
        Each bar shows where you sit between low and high on a trait. Low isn't bad and high isn't good, they're just
        different. The bars fill in as you play scenarios and we read your answers.
      </p>
      {domains.map((domain) => (
        <section key={domain.key} style={dash.domain}>
          <header style={dash.domainHead}>
            <h2 style={dash.domainTitle}>{domain.title}</h2>
            <span style={dash.domainBlurb}>{domain.blurb}</span>
            <span className="comic-chip" style={dash.domainCount}>
              {domain.traits.filter((t) => t.value !== undefined).length} / {domain.traits.length} measured
            </span>
          </header>
          <ul style={dash.traitList}>
            {domain.traits.map((t) => (
              <TraitRow key={t.id} trait={t} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function TraitRow({ trait }: { trait: Trait }) {
  const [open, setOpen] = useState(false);
  const percent = trait.value === undefined ? undefined : Math.round(Math.min(Math.max(trait.value, 0), 1) * 100);
  const explained = trait.contributions.length > 0;

  return (
    <li style={dash.traitItem}>
      {/* name and description on the left, the scale on the right. They stack on narrow screens.
          Clicking it opens the answers behind the score */}
      <button
        style={{ ...dash.trait, ...(explained ? dash.traitButton : {}) }}
        disabled={!explained}
        aria-expanded={explained ? open : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={dash.traitLabel}>
          <div style={dash.traitHead}>
            <span style={dash.traitName}>{trait.name}</span>
            {percent !== undefined && <span style={dash.traitValue}>{percent}</span>}
            {percent !== undefined && (trait.confidence ?? 0) < 0.5 && (
              <span className="comic-chip" title="Based on only a little of what you've told us so far">
                Early read
              </span>
            )}
          </div>
          {trait.description && <p style={dash.traitDescription}>{trait.description}</p>}
        </div>
        {percent === undefined ? (
          <div style={{ ...dash.traitScale, ...dash.gathering }}>Still gathering information on this one...</div>
        ) : (
          //read only: looks like a slider, but there's nothing to drag
          <div style={dash.traitScale} role="meter" aria-label={trait.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div style={dash.bar}>
              <div style={dash.barTrack}>
                <div className="comic-meter-fill" style={{ ...dash.barFill, width: `${percent}%` }} />
              </div>
              <span className="comic-pop" style={{ ...dash.barThumb, left: `${percent}%` }} />
            </div>
            <div style={dash.barEnds} aria-hidden>
              <span>Low</span>
              {explained && <span>{open ? 'Hide why ▲' : 'Why? ▼'}</span>}
              <span>High</span>
            </div>
          </div>
        )}
      </button>
      {open && (
        <ol style={dash.contributions}>
          {trait.contributions.map((c, i) => (
            <ContributionCard key={i} contribution={c} />
          ))}
        </ol>
      )}
    </li>
  );
}

//how hard an answer pushed, in words
const strength = (delta: number) => (Math.abs(delta) >= 0.6 ? 'strongly' : Math.abs(delta) >= 0.3 ? '' : 'slightly');

function ContributionCard({ contribution: c }: { contribution: Contribution }) {
  const up = c.delta >= 0;
  return (
    <li style={dash.contribution}>
      <div style={dash.contributionHead}>
        <span className="comic-chip">{c.scenario}</span>
        <span style={{ ...dash.push, color: up ? blue : brownRed }}>
          {up ? '▲' : '▼'} {strength(c.delta)} {up ? 'raised' : 'lowered'}
        </span>
      </div>
      <p style={dash.contributionQuestion}>{c.question}</p>
      <p style={dash.contributionAnswer}>
        <strong>You said:</strong> {c.answer}
      </p>
      {c.reasoning && (
        <p style={dash.contributionAnswer}>
          <strong>Because:</strong> {c.reasoning}
        </p>
      )}
      <p style={dash.contributionWhy}>{c.evidence ?? 'From the choice you picked.'}</p>
    </li>
  );
}

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
  renderScene: (animation: string, clock?: number) => ReactNode; //the scenario's background, driven by the current step's animation and how much of the clock is left, 1 to 0
  earlier: SavedAnswer[]; //the user's answers from when the scenario was opened, for Sections that recall them
  onAnswer: (step: PromptFrame, answer: Answer) => Promise<void>; //saves an answer; the player waits for it before moving on
  onExit: () => void; //leave the scenario part way through
  onFinish: () => void; //called when the user moves past the final step
}

function ScriptPlayer({ script, renderScene, earlier, onAnswer, onExit, onFinish }: ScriptPlayerProps) {
  //every position the user has visited, so the left arrow can walk back through branches
  const [history, setHistory] = useState<Position[]>([{ section: script.start, index: 0 }]);
  const [shown, setShown] = useState(0); //how many characters of the current text have been written out
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const { clock } = script;
  const [deadline, setDeadline] = useState<number>(); //when the clock runs out, once it's started
  const [over, setOver] = useState(false); //the clock stopped, finished or not
  const [now, setNow] = useState(0);
  const running = clock && deadline !== undefined && !over;
  const left = running ? Math.max(0, deadline - now) / 1000 : undefined;

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

  //running out jumps straight to the clock's late Section, whatever the user is in the middle of
  useEffect(() => {
    if (!running || !clock || deadline === undefined) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t < deadline) return;
      setOver(true);
      setHistory((h) => [...h, { section: clock.late, index: 0 }]);
      setShown(0);
    }, 250);
    return () => clearInterval(timer);
  }, [running, deadline, clock]);

  const nextPosition = (): Position | undefined => {
    if (isPrompt(step) && step.choices && answer?.choice !== undefined) {
      return { section: step.choices[answer.choice].next, index: 0 };
    }
    if (position.index + 1 < section.steps.length) return { ...position, index: position.index + 1 };
    const { recall } = section;
    const recalled = recall && earlier.find((a) => a.scenario === recall.scenario && a.question_key === recall.question);
    const next = (recalled && recall.choices[recalled.answer]) || section.next;
    if (next) return { section: next, index: 0 };
    return undefined;
  };

  const forward = async () => {
    //first press finishes writing the text out, the next one moves on
    if (!typed) {
      setShown(text.length);
      return;
    }
    if (!answered || saving) return;
    if (isPrompt(step) && answer) {
      setSaving(true);
      setSaveError(undefined);
      try {
        await onAnswer(step, answer);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : String(e));
        return;
      } finally {
        setSaving(false);
      }
    }
    const next = nextPosition();
    if (!next) {
      onFinish();
      return;
    }
    if (clock && next.section === clock.from && deadline === undefined) {
      const t = Date.now();
      setDeadline(t + clock.seconds * 1000);
      setNow(t);
    }
    if (clock && next.section === clock.until) setOver(true);
    //unless the clock ran out while the answer was saving
    setHistory((h) => (h[h.length - 1] === position ? [...h, next] : h));
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
      {renderScene(step.animation, left === undefined ? undefined : left / clock!.seconds)}

      {left !== undefined && (
        <div style={{ ...styles.clock, ...(left < 60 ? styles.clockLow : {}) }}>
          {Math.floor(left / 60)}:{String(Math.floor(left % 60)).padStart(2, '0')}
        </div>
      )}

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
              {saveError && (
                <p role="alert" style={styles.saveError}>
                  {saveError}
                </p>
              )}
              <div style={styles.promptFooter}>
                <span style={styles.hint}>Ctrl+Enter to continue · Esc to leave the text box</span>
                <button
                  className="comic-lift"
                  style={{ ...styles.continue, ...(answered && !saving ? {} : styles.continueDisabled) }}
                  disabled={!answered || saving}
                  onClick={forward}
                >
                  {saving ? 'Saving...' : 'Continue ▶'}
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
  saveError: {
    padding: '6px 12px',
    background: paleRed,
    border: `3px solid ${brownRed}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    color: brownRed,
    fontSize: 18,
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
  clock: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    padding: '4px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '8px 14px 6px 12px / 12px 8px 14px 6px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 2,
    fontVariantNumeric: 'tabular-nums',
  },
  clockLow: {
    color: '#c0392b',
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
  views: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  viewButton: {
    padding: '4px 20px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1.5,
  },
  viewButtonActive: {
    background: brownRed,
    color: ivory,
  },
  traitsIntro: {
    maxWidth: 1100,
    margin: '-12px auto 32px',
    fontSize: 19,
    lineHeight: 1.3,
  },
  domain: {
    maxWidth: 1100,
    margin: '0 auto 40px',
  },
  domainHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 16px',
    paddingBottom: 6,
    borderBottom: `4px solid ${gunmetal}`,
  },
  domainTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 38,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  domainBlurb: {
    fontSize: 19,
    fontStyle: 'italic',
    color: cinnamon,
  },
  domainCount: {
    marginLeft: 'auto',
  },
  traitList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  traitItem: {
    borderBottom: `2px dashed rgba(57, 61, 63, 0.35)`,
  },
  //a button, reset so it looks like the rest of the row
  trait: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 32px',
    width: '100%',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
  },
  traitButton: {
    cursor: 'pointer',
  },
  contributions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
    margin: '0 0 18px',
    padding: 0,
    listStyle: 'none',
  },
  contribution: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 14px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  contributionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  push: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  contributionQuestion: {
    fontSize: 16,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  contributionAnswer: {
    fontSize: 16,
    lineHeight: 1.25,
  },
  contributionWhy: {
    padding: '6px 10px',
    background: paleBlue,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 1.25,
  },
  traitLabel: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  traitScale: {
    flex: '2 1 360px',
  },
  traitHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  traitName: {
    fontFamily: comic,
    fontSize: 23,
    letterSpacing: 0.5,
  },
  traitValue: {
    fontFamily: comic,
    fontSize: 23,
    color: blue,
  },
  traitDescription: {
    fontSize: 17,
    lineHeight: 1.2,
    opacity: 0.8,
  },
  //margins leave room for the thumb's overhang at 0 and 100
  bar: {
    position: 'relative',
    margin: '6px 13px 0',
  },
  barTrack: {
    height: 22,
    padding: 3,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    overflow: 'hidden',
  },
  barFill: {
    background: `repeating-linear-gradient(-45deg, ${blue} 0 10px, #7d9dba 10px 20px)`,
    borderRadius: 6,
  },
  //centred with margins, since comic-pop animates the transform
  barThumb: {
    position: 'absolute',
    top: '50%',
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    background: brownRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    boxShadow: `2px 2px 0 ${gunmetal}`,
    boxSizing: 'border-box',
    animationDelay: '600ms',
  },
  barEnds: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '2px 4px 0',
    fontSize: 14,
    opacity: 0.6,
  },
  gathering: {
    marginTop: 4,
    padding: '6px 12px',
    border: `3px dashed ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    background: 'repeating-linear-gradient(-45deg, transparent 0 8px, rgba(57, 61, 63, 0.07) 8px 16px)',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.75,
  },
};

export default Personality;
