import { lazy, Suspense, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { fetchTraits, getProgress, getScoring, MAX_ANSWER_LENGTH, saveAnswer, type AnswerClock, type Trait, type SavedAnswer, type ScenarioQuestion } from './api';
import { theStoryGame } from './the_story_game/script';
import { theFestival } from './the_festival/script';
import { theBigParty } from './the_big_party/script';
import { theDare } from './the_dare/script';
import { theCommittee } from './the_committee/script';
import { theNightClass } from './the_night_class/script';
import { theNightMarket } from './the_night_market/script';
import { theBadDay } from './the_bad_day/script';
import { theTimeStudy } from './the_time_study/script';
import { theStranger } from './the_stranger/script';
import { theFeud } from './the_feud/script';
import { theFreeWeekend } from './the_free_weekend/script';
import { theHouseguest } from './the_houseguest/script';
import { theShoplifter } from './the_shoplifter/script';
import { theEmergency } from './the_emergency/script';
import { thePromotion } from './the_promotion/script';
import { theCabin } from './the_cabin/script';
import { thePortrait } from './the_portrait/script';
import Explore from './explore';
import MyPersonality from './my_personality';
import { ProgressMeter } from '../shared_components/progress-meter';
import { Checkbox } from '../shared_components/checkbox';
import { useSession } from '../auth/api';
import { Nav } from '../shared_components/nav';
import { RequireLogin } from '../auth/require-login';
import { Mascot } from '../shared_components/mascot';
import { AtlasError } from '../shared_components/atlas-error';

//scenes are split into their own chunks so their art, sounds and textures only load when one is opened
const Sketchbook = lazy(() => import('./the_story_game/sketchbook'));
const Poster = lazy(() => import('./the_festival/poster'));
const Ballroom = lazy(() => import('./the_big_party/ballroom'));
const KitCam = lazy(() => import('./the_dare/kitcam'));
const Riso = lazy(() => import('./the_committee/riso'));
const Chalkboard = lazy(() => import('./the_night_class/chalk'));
const Woodcut = lazy(() => import('./the_night_market/woodcut'));
const Funnies = lazy(() => import('./the_bad_day/funnies'));
const Notebook = lazy(() => import('./the_time_study/notebook'));
const Stencil = lazy(() => import('./the_stranger/stencil'));
const Blueprint = lazy(() => import('./the_feud/blueprint'));
const Sampler = lazy(() => import('./the_free_weekend/sampler'));
const Dollhouse = lazy(() => import('./the_houseguest/dollhouse'));
const Cctv = lazy(() => import('./the_shoplifter/cctv'));
const SafetyCard = lazy(() => import('./the_emergency/card'));
const PixelOffice = lazy(() => import('./the_promotion/pixel'));
const PaperCabin = lazy(() => import('./the_cabin/papercut'));
const Oils = lazy(() => import('./the_portrait/oils'));

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
  | 'Vulnerability';

export interface Frame {
  text: string; //the text displayed on screen for the user
  animation: string; //the consuming component will have a function with 'animation's value
  speaker?: string; //who is talking; omitted for narration
}

export interface Choice {
  label: string; //the option shown to the user
  next: string; //id of the Section to continue with if this choice is picked
  other?: boolean; //the user's own answer, written in the text box rather than picked from the list
}

export interface PromptFrame {
  id: string; //unique within the script, used to key the user's answer when sent to the backend
  prompt: string; //the question shown to the user above the text box
  animation: string;
  speaker?: string;
  facets: PersonalityTrait[]; //traits this prompt is designed to draw out, sent with the answer so the scorer knows them
  choices?: Choice[]; //if present the user picks one, then explains why in the text box
}

export type Step = Frame | PromptFrame;

export interface Section {
  steps: Step[];
  next?: string; //id of the Section that follows; omitted on the final Section, ignored when the last step is a PromptFrame with choices
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

export interface ScenarioInfo {
  id: string;
  title: string;
  kind: string; //the situation type
  blurb: string;
  facets: PersonalityTrait[];
}

export interface Playable {
  script: Script;
  renderScene: (animation: string, clock?: number) => ReactNode;
}

//every scenario, in play order. Each is written to a set of IPIP-NEO items: which ones,
//and why the order, are in scene_grouping.md
const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'the_story_game',
    title: 'The Story Game',
    kind: 'Live',
    blurb: 'A narrator invites you to build a world together, one question at a time.',
    facets: theStoryGame.facets,
  },
  {
    id: 'the_night_class',
    title: 'The Night Class',
    kind: 'Story',
    blurb: 'An evening class on big questions, a thought experiment, and a lively room.',
    facets: theNightClass.facets,
  },
  {
    id: 'the_big_party',
    title: 'The Big Party',
    kind: 'Story, timed beats',
    blurb: "A friend's 40th: two hundred people, a loud band, and you know about four of them.",
    facets: theBigParty.facets,
  },
  {
    id: 'the_time_study',
    title: 'The Time Study',
    kind: 'Interview',
    blurb: 'A researcher who studies how people spend their days asks about yours.',
    facets: theTimeStudy.facets,
  },
  {
    id: 'the_night_market',
    title: 'The Night Market',
    kind: 'Story',
    blurb: 'A fable: ten silver coins, a market town at night, and a coach home at dawn.',
    facets: theNightMarket.facets,
  },
  {
    id: 'the_bad_day',
    title: 'The Bad Day',
    kind: 'Story, timed',
    blurb: 'Traffic, a broken printer, a receptionist who keeps talking. A comedy of small disasters.',
    facets: theBadDay.facets,
  },
  {
    id: 'the_dare',
    title: 'The Dare',
    kind: 'Story',
    blurb: 'A trip abroad with a friend who chases adrenaline.',
    facets: theDare.facets,
  },
  {
    id: 'the_shoplifter',
    title: 'The Shoplifter',
    kind: 'Story',
    blurb: 'Your shop says always call the police. Then you catch a teenager stealing.',
    facets: theShoplifter.facets,
  },
  {
    id: 'the_committee',
    title: 'The Committee',
    kind: 'Story',
    blurb: 'A neighborhood committee is putting on a street festival, and nobody is in charge.',
    facets: theCommittee.facets,
  },
  {
    id: 'the_houseguest',
    title: 'The Houseguest',
    kind: 'Story',
    blurb: "A friend of a friend stays with you for a week. They're messy, closed off, and going through something.",
    facets: theHouseguest.facets,
  },
  {
    id: 'the_promotion',
    title: 'The Promotion',
    kind: 'Story',
    blurb: "You and a peer are up for the same promotion, and there are easy ways to tip it.",
    facets: thePromotion.facets,
  },
  {
    id: 'the_festival',
    title: 'The Festival',
    kind: 'Live',
    blurb: 'A free afternoon at a city arts festival, and a map of everything on.',
    facets: theFestival.facets,
  },
  {
    id: 'the_free_weekend',
    title: 'The Free Weekend',
    kind: 'Story',
    blurb: "Nothing booked but a promise to help a friend move. Then a much better invitation arrives.",
    facets: theFreeWeekend.facets,
  },
  {
    id: 'the_stranger',
    title: 'The Stranger',
    kind: 'Story',
    blurb: 'A man stops you in the street. His wallet was stolen, and he needs bus fare home.',
    facets: theStranger.facets,
  },
  {
    id: 'the_emergency',
    title: 'The Emergency',
    kind: 'Live, timed',
    blurb: "A grease fire breaks out in the kitchen during a dinner you're hosting.",
    facets: theEmergency.facets,
  },
  {
    id: 'the_feud',
    title: 'The Feud',
    kind: 'Story',
    blurb: 'Your neighbor builds a fence three feet onto your land.',
    facets: theFeud.facets,
  },
  {
    id: 'the_cabin',
    title: 'The Cabin',
    kind: 'Story + Interview, real clock',
    blurb: "A winter weekend with old friends, a tradition someone wants to break, and a friend who still isn't here.",
    facets: theCabin.facets,
  },
  {
    id: 'the_portrait',
    title: 'The Portrait',
    kind: 'Interview',
    blurb: 'A painter does your portrait, and talks while they work.',
    facets: thePortrait.facets,
  },
];

//scenarios that have been built so far, keyed by ScenarioInfo id
const PLAYABLE: Record<string, Playable> = {
  the_story_game: { script: theStoryGame, renderScene: (animation) => <Sketchbook animation={animation} /> },
  the_festival: { script: theFestival, renderScene: (animation) => <Poster animation={animation} /> },
  the_big_party: { script: theBigParty, renderScene: (animation) => <Ballroom animation={animation} /> },
  the_dare: { script: theDare, renderScene: (animation) => <KitCam animation={animation} /> },
  the_committee: { script: theCommittee, renderScene: (animation) => <Riso animation={animation} /> },
  the_night_class: { script: theNightClass, renderScene: (animation) => <Chalkboard animation={animation} /> },
  the_night_market: { script: theNightMarket, renderScene: (animation) => <Woodcut animation={animation} /> },
  the_bad_day: { script: theBadDay, renderScene: (animation, clock) => <Funnies animation={animation} clock={clock} /> },
  the_time_study: { script: theTimeStudy, renderScene: (animation) => <Notebook animation={animation} /> },
  the_stranger: { script: theStranger, renderScene: (animation) => <Stencil animation={animation} /> },
  the_feud: { script: theFeud, renderScene: (animation) => <Blueprint animation={animation} /> },
  the_free_weekend: { script: theFreeWeekend, renderScene: (animation) => <Sampler animation={animation} /> },
  the_houseguest: { script: theHouseguest, renderScene: (animation) => <Dollhouse animation={animation} /> },
  the_shoplifter: { script: theShoplifter, renderScene: (animation) => <Cctv animation={animation} /> },
  the_emergency: { script: theEmergency, renderScene: (animation, clock) => <SafetyCard animation={animation} clock={clock} /> },
  the_promotion: { script: thePromotion, renderScene: (animation) => <PixelOffice animation={animation} /> },
  the_cabin: { script: theCabin, renderScene: (animation, clock) => <PaperCabin animation={animation} clock={clock} /> },
  the_portrait: { script: thePortrait, renderScene: (animation) => <Oils animation={animation} /> },
};

//traits are rescored from everything the user has answered each time they finish this many more scenarios. Matches the api
const SCORE_EVERY = 6;

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
  const [starting, setStarting] = useState<string>(); //id of the scenario whose start note is showing
  const [answers, setAnswers] = useState<SavedAnswer[]>(); //undefined until loaded
  const [questions, setQuestions] = useState<Record<string, ScenarioQuestion[]>>({}); //keyed by scenario name
  const [loadError, setLoadError] = useState<string>();
  //the user's traits are rescored in the background after each scenario, and no new one starts until that's done
  const [recalculating, setRecalculating] = useState(false);
  const [scorings, setScorings] = useState(0); //how many rescores have finished while the page was open

  const load = useCallback(
    () =>
      getProgress().then(
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

  useEffect(() => {
    if (!loggedIn) return;
    getScoring().then(({ running }) => setRecalculating(running), () => {});
  }, [loggedIn]);
  useEffect(() => {
    if (!recalculating) return;
    const timer = window.setInterval(
      () =>
        getScoring().then(({ running }) => {
          if (running) return;
          setRecalculating(false);
          setScorings((n) => n + 1);
        }, () => {}), //a failed check just waits for the next one
      SCORING_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [recalculating]);

  const [traits, setTraits] = useState<Trait[]>(); //undefined until loaded
  const [traitsError, setTraitsError] = useState<string>();

  //fetched each time the view opens, a rescore finishes or a contest is sent, so it picks up anything measured since
  useEffect(() => {
    if (view !== 'traits' || !personId || !username) return;
    fetchTraits(personId, username).then(
      (loaded) => {
        setTraits(loaded);
        setTraitsError(undefined);
      },
      (e) => setTraitsError(e instanceof Error ? e.message : String(e)),
    );
  }, [view, personId, username, scorings]);

  //a contest is reviewed in the background, so the traits are fetched again until every contest has its outcome
  const reviewing = traits?.some((t) => t.contributions.some((c) => c.contests.some((contest) => contest.status === 'pending')));
  useEffect(() => {
    if (!reviewing) return;
    const timer = window.setTimeout(() => setScorings((n) => n + 1), SCORING_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [reviewing, traits]);

  //saves an answer as the player moves past a prompt. The last answer of a scenario also starts a rescore
  const answer = (scenario: string) => async (step: PromptFrame, given: Answer, context: string, clock?: AnswerClock) => {
    const question = questions[scenario]?.find((q) => q.key === step.id);
    if (!question) throw new Error("This question isn't set up on the server yet, so your answer can't be saved.");
    const choice = step.choices && given.choice !== undefined ? step.choices[given.choice].label : undefined;
    const saved = await saveAnswer(question.id, choice ?? given.text, choice ? given.text : undefined, context, step.facets, clock);
    if (saved.scored) setRecalculating(true);
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
      ? "Here's how personality works, trait by trait. Every end of every scale has its downsides, so nobody gets to feel too smug. Or too bad."
      : recalculating
        ? "Hold on, I'm recalculating your results from everything you've told me so far. It takes a few minutes, and your next scenario unlocks as soon as I'm done."
        : view === 'scenarios'
          ? ready
            ? greeting(firstName, completed)
            : 'Digging up your map...'
          : traits
            ? traitsGreeting(firstName, traits)
            : 'Flipping through my notes on you. Some of them are unflattering...';
  //a failed load replaces the greeting
  const failure =
    view === 'scenarios' && loadError
      ? `I couldn't load your progress. ${loadError}`
      : view === 'traits' && traitsError
        ? `I couldn't load your traits. ${traitsError}`
        : undefined;

  return (
    <RequireLogin reason="I don't map strangers. Make an account and let's find out who you really are.">
      <div style={dash.page} className="comic-page">
        <Nav />
        <header style={dash.header}>
          <h1 style={dash.title} className="comic-title">
            Personality
          </h1>
          {failure ? (
            <AtlasError message={failure} size={96} style={dash.guide} />
          ) : (
            <div style={dash.guide}>
              <Mascot />
              <div style={dash.bubble} className="comic-bubble comic-pop">
                {bubble}
              </div>
            </div>
          )}
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

        {view === 'traits' && traits && <MyPersonality traits={traits} onContested={() => setScorings((n) => n + 1)} />}

        {view === 'explore' && <Explore />}

        {view === 'scenarios' && <OurApproach />}

        {/* every scenario opens with how to get the most out of it */}
        {starting && (
          <div style={dash.startBackdrop} onClick={() => setStarting(undefined)} onKeyDown={(e) => e.key === 'Escape' && setStarting(undefined)}>
            <div style={dash.startDialog} role="dialog" aria-modal aria-label="Before you start" onClick={(e) => e.stopPropagation()}>
              <GettingTheMost
                onBack={() => setStarting(undefined)}
                onStart={() => {
                  setPlaying(starting);
                  setStarting(undefined);
                }}
              />
            </div>
          </div>
        )}

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
                  locked={recalculating}
                  onPlay={() => (startNoteHidden() ? setPlaying(scenario.id) : setStarting(scenario.id))}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </RequireLogin>
  );
}

const SCORING_POLL_MS = 5000;

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

const TIPS = [
  {
    title: 'Be honest, not impressive',
    body: "Answer the way you'd actually act, not the way you'd like to come across. Flattering answers are the hardest to read, and you're the one who loses out.",
  },
  {
    title: 'Tell us why',
    body: 'Your reasoning matters more than the option you pick. Two people can make the same choice for completely different reasons.',
  },
  {
    title: 'Be specific',
    body: 'Details beat adjectives. "I froze, then rang my mum" says more than "I\'m bad in a crisis."',
  },
  {
    title: 'Keep playing',
    body: `We read everything you've told us after every ${SCORE_EVERY} scenarios, and each read gets surer. Faded bars on My Personality are early reads.`,
  },
  {
    title: 'Be yourself, jokes included',
    body: 'Short answers and jokes are fine. How you answer says something too.',
  },
];

//whether the user has asked not to see the start note again. Kept in this browser only; if storage is blocked the note
//just keeps showing
const HIDE_START_NOTE = 'atlas.hideStartNote';
const startNoteHidden = () => {
  try {
    return localStorage.getItem(HIDE_START_NOTE) === '1';
  } catch {
    return false;
  }
};

//how to answer to get the most accurate results. Shown before every scenario starts, until the user turns it off
function GettingTheMost({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const [hide, setHide] = useState(false);
  const start = () => {
    if (hide) {
      try {
        localStorage.setItem(HIDE_START_NOTE, '1');
      } catch {
        //storage is blocked, so it will show again next time
      }
    }
    onStart();
  };
  return (
    <section style={{ ...dash.approach, ...dash.tips }} className="comic-panel comic-pop">
      <div style={dash.approachColumn}>
        <h2 style={dash.approachHeading}>Get the most out of it.</h2>
        <ol style={dash.approachList}>
          {TIPS.map((tip, i) => (
            <li key={tip.title} style={dash.approachItem}>
              <span style={dash.approachNumber}>{i + 1}</span>
              <span>
                <strong style={dash.approachItemTitle}>{tip.title}.</strong> {tip.body}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div style={dash.startFooter}>
        <span style={dash.startHide}>
          <Checkbox checked={hide} onChange={setHide} label="Don't show this again" />
        </span>
        <button className="comic-lift" style={dash.startBack} onClick={onBack}>
          Back
        </button>
        <button className="comic-lift" style={dash.startGo} onClick={start} autoFocus>
          Let's go ▶
        </button>
      </div>
    </section>
  );
}

//why we measure personality through scenes, pulled from the README
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
  const left = SCENARIOS.length - completed;
  const toNext = SCORE_EVERY - (completed % SCORE_EVERY);
  if (completed === 0) return `Hey ${name ?? 'there'}. Zero scenarios played. Bold strategy for someone who wants to know who they are. Finish ${SCORE_EVERY} and I'll tell you what I make of you.`;
  if (left === 0) return `Every scenario done${name ? `, ${name}` : ''}. Either you're very self-aware or you really needed a hobby. Either way, I'm proud of you.`;
  const next =
    completed < SCORE_EVERY
      ? `${toNext} more and I'll read everything you've told me and tell you who you are.`
      : `${toNext} more and I'll read it all again and update your results.`;
  return `${completed} of ${SCENARIOS.length} down${name ? `, ${name}` : ''}. Nice work! ${toNext > left ? (left === 1 ? "The last one isn't going to play itself." : `The other ${left} aren't going to play themselves.`) : next}`;
};

const traitsGreeting = (name: string | undefined, traits: Trait[]) => {
  const measured = traits.filter((t) => t.value !== undefined).length;
  if (measured === 0) return `I've got nothing on you yet${name ? `, ${name}` : ''}. I read everything at once, after every ${SCORE_EVERY} scenarios you finish. I can't read minds. Yet. Go give me something to work with!`;
  if (measured === traits.length) return `Every trait measured${name ? `, ${name}` : ''}. I officially know you better than your group chat does. Look at you go.`;
  return `Here's what I've figured out so far${name ? `, ${name}` : ''}. The blank spots are where you've been dodging scenarios. Go fill them in, I'm curious.`;
};

const badges: Record<ScenarioStatus, { label: string; fill: string; ink: string }> = {
  complete: { label: 'Done!', fill: paleBlue, ink: blue },
  in_progress: { label: 'In progress', fill: paleCinnamon, ink: cinnamon },
  not_started: { label: 'New!', fill: '#fffef6', ink: brownRed },
};

const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4]; //slight hand-placed wobble so the grid doesn't look machine-ruled

interface ScenarioCardProps {
  index: number;
  scenario: ScenarioInfo;
  progress?: ScenarioProgress;
  playable: boolean;
  locked: boolean; //waiting on a rescore before another scenario can start
  onPlay: () => void;
}

function ScenarioCard({ index, scenario, progress, playable, locked, onPlay }: ScenarioCardProps) {
  const status = progress?.status ?? 'not_started';
  const look = badges[status];
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
            className={status === 'complete' ? 'comic-stamp comic-slam' : 'comic-stamp'}
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
          {playable && <span style={dash.go}>{locked ? 'Recalculating...' : status === 'complete' ? 'Play again ▶' : 'Play ▶'}</span>}
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
  onAnswer: (step: PromptFrame, answer: Answer, context: string, clock?: AnswerClock) => Promise<void>; //saves an answer, with what the user saw before it and where the clock stood if it has started; the player waits for it before moving on
  onExit: () => void; //leave the scenario part way through
  onFinish: () => void; //called when the user moves past the final step
}

function ScriptPlayer({ script, renderScene, onAnswer, onExit, onFinish }: ScriptPlayerProps) {
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

  //what the user saw since the last question along the path they took, and the choices offered, so the scorer
  //knows what they're answering
  const context = (prompt: PromptFrame) => {
    const lines: string[] = [];
    for (let i = history.length - 2; i >= 0; i--) {
      const seen = script.sections[history[i].section].steps[history[i].index];
      if (isPrompt(seen)) break;
      lines.unshift(seen.speaker ? `${seen.speaker}: ${seen.text}` : seen.text);
    }
    if (prompt.choices) lines.push(`Choices offered: ${prompt.choices.map((c) => c.label).join(' / ')}`);
    return lines.join('\n');
  };

  const nextPosition = (): Position | undefined => {
    if (isPrompt(step) && step.choices && answer?.choice !== undefined) {
      return { section: step.choices[answer.choice].next, index: 0 };
    }
    if (position.index + 1 < section.steps.length) return { ...position, index: position.index + 1 };
    if (section.next) return { section: section.next, index: 0 };
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
        await onAnswer(step, answer, context(step), clockNow());
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
                placeholder={
                  !step.choices
                    ? 'Type your answer and explain your thinking...'
                    : answer?.choice !== undefined && step.choices[answer.choice].other
                      ? 'Tell me your own answer, and why...'
                      : 'Why? Explain your thinking...'
                }
                onChange={(e) => updateAnswer(step.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) forward();
                  if (e.key === 'Escape') e.currentTarget.blur();
                }}
              />
              {saveError && <AtlasError message={saveError} />}
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
  tips: {
    margin: 0,
    maxWidth: 640,
    '--panel-fill': paleBlue,
    '--tilt': '0.3deg',
  } as CSSProperties,
  startBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    display: 'grid',
    padding: 16,
    overflowY: 'auto',
    background: 'rgba(57, 61, 63, 0.55)',
  },
  //auto margins centre it when it fits, and let it scroll from the top when it doesn't
  startDialog: {
    margin: 'auto',
  },
  startFooter: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  startHide: {
    marginRight: 'auto',
  },
  startBack: {
    padding: '4px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  startGo: {
    padding: '4px 18px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
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
