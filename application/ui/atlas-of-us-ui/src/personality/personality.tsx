import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { fetchTraits, getProgress, getQuestions, MAX_ANSWER_LENGTH, saveAnswer, type AnswerClock, type Trait, type SavedAnswer, type ScenarioQuestion } from './api';
import { landfall } from './landfall/script';
import { theThief } from './the_thief/script';
import { readingPeople } from './reading_people/script';
import { theArchive } from './the_archive/script';
import { ruleThatDoesntFit } from './rule_that_doesnt_fit/script';
import { theOffer } from './the_offer/script';
import { partyOfStrangers } from './party_of_strangers/script';
import Explore from './explore';
import MyPersonality from './my_personality';
import { ProgressMeter } from '../shared_components/progress-meter';
import { useSession } from '../auth/api';
import { Nav } from '../shared_components/nav';
import { RequireLogin } from '../auth/require-login';
import { Mascot } from '../shared_components/mascot';

//scenes are split into their own chunks so their three.js code, sounds and textures only load when one is opened
const Landfall = lazy(() => import('./landfall/landfall'));
const Thief = lazy(() => import('./the_thief/thief'));
const ReadingPeople = lazy(() => import('./reading_people/reading_people'));
const TheArchive = lazy(() => import('./the_archive/the_archive'));
const LastFerry = lazy(() => import('./rule_that_doesnt_fit/last_ferry'));
const TheOffer = lazy(() => import('./the_offer/the_offer'));
const SnowedIn = lazy(() => import('./party_of_strangers/snowed_in'));

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
 * scripts: the shape every scenario's script.ts follows
 * ------------------------------------------------------------------------------------------- */

export type PersonalityTrait =
  // openness
  | 'Imagination'
  | 'Artistic Interests'
  | 'Emotionality'
  | 'Adventurousness'
  | 'Intellect'
  | 'Liberalism'
  // conscientiousness
  | 'Self-Efficacy'
  | 'Orderliness'
  | 'Dutifulness'
  | 'Achievement-Striving'
  | 'Self-Discipline'
  | 'Cautiousness'
  // extraversion
  | 'Friendliness'
  | 'Gregariousness'
  | 'Assertiveness'
  | 'Activity Level'
  | 'Excitement-Seeking'
  | 'Cheerfulness'
  // agreeableness
  | 'Trust'
  | 'Morality'
  | 'Altruism'
  | 'Cooperation'
  | 'Modesty'
  | 'Sympathy'
  // neuroticism
  | 'Anxiety'
  | 'Anger'
  | 'Depression'
  | 'Self-Consciousness'
  | 'Immoderation'
  | 'Vulnerability'
  // additional
  | 'Patience'
  | 'Resilience'
  | 'Optimism'
  | 'Perfectionism'
  | 'Competitiveness'
  | 'Stubbornness'
  | 'Independence'
  | 'Boldness'
  | 'Playfulness'
  | 'Introspection'
  | 'Sensory Sensitivity'
  | 'Decisiveness'
  | 'Adaptability'
  | 'Fairness';

export interface Frame {
  text: string; //the text displayed on screen for the user
  animation: string; //the consuming component will have a function with 'animation's value
  speaker?: string; //who is talking; omitted for narration
}

export interface Choice {
  label: string; //the option shown to the user
  next: string; //id of the Section to continue with if this choice is picked
}

export interface PromptFrame {
  id: string; //unique within the script, used to key the user's answer when sent to the backend
  prompt: string; //the question shown to the user above the text box
  animation: string;
  speaker?: string;
  facets: PersonalityTrait[]; //traits the backend should look for in the answer
  choices?: Choice[]; //if present the user picks one, then explains why in the text box
}

export type Step = Frame | PromptFrame;

export interface Section {
  steps: Step[];
  next?: string; //id of the Section that follows; omitted on the final Section, ignored when the last step is a PromptFrame with choices
  recall?: Recall; //when set, the Section that follows depends on how the user answered an earlier scenario
}

//picks the next Section from the user's saved answer to another scenario's question, falling back to the Section's next
export interface Recall {
  scenario: string; //the earlier scenario's id, e.g. 'landfall'
  question: string; //the prompt id in that scenario's script
  choices: Record<string, string>; //choice label to the id of the Section to continue with
}

//a real countdown over part of the script. Prompts between from and until can be skipped when it runs out
export interface Clock {
  seconds: number;
  from: string; //id of the Section that starts it
  until: string; //id of the Section that stops it
  late: string; //id of the Section jumped to the moment it runs out
}

export interface Script {
  id: string;
  title: string;
  facets: PersonalityTrait[]; //every trait this scenario is designed to measure
  start: string; //id of the first Section
  sections: Record<string, Section>;
  clock?: Clock;
}

const isPrompt = (step: Step): step is PromptFrame => 'prompt' in step;

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
    facets: partyOfStrangers.facets,
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
  party_of_strangers: { script: partyOfStrangers, renderScene: (animation) => <SnowedIn animation={animation} /> },
};

/* ---------------------------------------------------------------------------------------------
 * dashboard
 * ------------------------------------------------------------------------------------------- */

type View = 'scenarios' | 'traits' | 'explore';

const VIEWS: { id: View; label: string }[] = [
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'traits', label: 'My Personality' },
  { id: 'explore', label: 'Explore' },
];

function Personality() {
  const session = useSession();
  const loggedIn = session.status === 'authenticated';
  const personId = session.status === 'authenticated' ? session.person.id : undefined;
  const username = session.status === 'authenticated' ? session.person.username : undefined;
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

  const [traits, setTraits] = useState<Trait[]>(); //undefined until loaded
  const [traitsError, setTraitsError] = useState<string>();

  //fetched each time the view opens, so it picks up anything measured since
  useEffect(() => {
    if (view !== 'traits' || !personId || !username) return;
    fetchTraits(personId, username).then(
      (loaded) => {
        setTraits(loaded);
        setTraitsError(undefined);
      },
      (e) => setTraitsError(e instanceof Error ? e.message : String(e)),
    );
  }, [view, personId, username]);

  //saves an answer as the player moves past a prompt. The last answer of a scenario also rescores the user's traits,
  //so it only resolves once that's done
  const answer = (scenario: string) => async (step: PromptFrame, given: Answer, clock?: AnswerClock) => {
    const question = questions[scenario]?.find((q) => q.key === step.id);
    if (!question) throw new Error("This question isn't set up on the server yet, so your answer can't be saved.");
    const choice = step.choices && given.choice !== undefined ? step.choices[given.choice].label : undefined;
    await saveAnswer(question.id, choice ?? given.text, choice ? given.text : undefined, clock);
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

  const bubble =
    view === 'explore'
      ? "Here's how personality works, trait by trait. It's honest on purpose, so every end of every scale has its downsides."
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
        <Nav />
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

        {view === 'traits' && traits && <MyPersonality traits={traits} />}

        {view === 'explore' && <Explore />}

        {view === 'scenarios' && <OurApproach />}

        {view === 'scenarios' && ready && (
          <>
            <div style={dash.meter}>
              <ProgressMeter done={completed} total={SCENARIOS.length} label="complete" />
            </div>
            <ul style={dash.grid}>
              {SCENARIOS.map((scenario, i) => (
                <ScenarioCard
                  key={scenario.id}
                  index={i}
                  scenario={scenario}
                  progress={progress[scenario.id]}
                  playable={scenario.id in PLAYABLE}
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
  renderScene: (animation: string, clock?: number) => ReactNode; //the scenario's background, driven by the current step's animation and how much of the clock is left, 1 to 0
  earlier: SavedAnswer[]; //the user's answers from when the scenario was opened, for Sections that recall them
  onAnswer: (step: PromptFrame, answer: Answer, clock?: AnswerClock) => Promise<void>; //saves an answer, with where the clock stood if it has started; the player waits for it before moving on
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
  const [stopped, setStopped] = useState<{ at: number; ranOut: boolean }>(); //when the clock stopped, and whether it was by running out
  const [now, setNow] = useState(0);
  const running = clock && deadline !== undefined && !stopped;
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
      setStopped({ at: deadline, ranOut: true });
      setHistory((h) => [...h, { section: clock.late, index: 0 }]);
      setShown(0);
    }, 250);
    return () => clearInterval(timer);
  }, [running, deadline, clock]);

  //where the clock stands for the scorer, once it has started. After it stops, that's where it stopped
  const clockNow = (): AnswerClock | undefined => {
    if (!clock || deadline === undefined) return undefined;
    const at = stopped?.at ?? Date.now();
    return { seconds: clock.seconds, left: Math.round(Math.max(0, deadline - at) / 1000), ran_out: !!stopped?.ranOut };
  };

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
        await onAnswer(step, answer, clockNow());
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
    if (clock && next.section === clock.until && !stopped) setStopped({ at: Date.now(), ranOut: false });
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
      <Suspense fallback={null}>{renderScene(step.animation, left === undefined ? undefined : left / clock!.seconds)}</Suspense>

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
                maxLength={MAX_ANSWER_LENGTH}
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
                <span style={styles.hint}>
                  Ctrl+Enter to continue · Esc to leave the text box
                  {/* a count once they're getting close to the limit */}
                  {(answer?.text.length ?? 0) > MAX_ANSWER_LENGTH * 0.8 && ` · ${answer!.text.length}/${MAX_ANSWER_LENGTH}`}
                </span>
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
  //top centre, clear of the exit button on the left and the app's Feedback and Log out buttons on the right
  clock: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
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
};

export default Personality;
