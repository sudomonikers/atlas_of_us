import { Suspense, lazy, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { getMeshIndex, toggled, useShowing, type LayerId, type MeshIndex } from './anatomy_layers';
import {
  getAbilities,
  getAffectedBy,
  getAnatomy,
  getConditions,
  getImpairments,
  getMe,
  handOf,
  getMeasurements,
  type Ability,
  type AffectedBy,
  type Conditions,
  type Impairment,
  type Impairments,
  type Me,
  type Measurements,
  type PartSummary,
  type Reading,
} from './api';
import { HUMAN_BODY, indexBody, meshesOf, notedParts, partIds, type Body, type Light } from './body_parts';
import { CharacteristicChoice } from './characteristic_choice';
import BodyMap from './body_map';
import BodyStage, { LayerButtons } from './body_stage';
import { MeasurementCard } from './measurement_card';
import Noting from './noting';
import Rating from './rating';
import Results from './results';
import { MotionPanel } from './motion';
import Sheet from './sheet';
import { CHAPTERS, type Chapter, type Known, type Scene, type Shot } from './tour';
import { setConfig, useConfig, useSession } from '../auth/api';
import { RequireLogin } from '../auth/require-login';
import { noteWatched, useWatched } from './intro/watched';
import { navigate, replace, useSearch } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { Footer } from '../shared_components/footer';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';
import { Thinking } from '../shared_components/thinking';
import { Typed } from '../shared_components/typed';
import { useTypewriter } from '../shared_components/typewriter';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//the story that opens Physical Traits, loaded only when it plays
const Intro = lazy(() => import('./intro/intro'));

//the 3D body, loaded with three.js only when a chapter opens
const AnatomyViewer = lazy(() => import('./anatomy_viewer').then((m) => ({ default: m.AnatomyViewer })));

//wide enough for what the user can do on a scene to sit beside the body, rather than in Atlas's box
const WIDE = '(min-width: 900px)';
const subscribeWide = (listener: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches);

//the most Atlas says at once, in characters: a scene's words are split, between sentences, into parts no longer than
//this where they can be, so the box stays a few lines high
const PART = 200;
const parted = (text: string) =>
  text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).reduce<string[]>((parts, sentence) => {
    const last = parts[parts.length - 1];
    if (last !== undefined && last.length + sentence.length + 1 <= PART) parts[parts.length - 1] = `${last} ${sentence}`;
    else parts.push(sentence);
    return parts;
  }, []);

//everything the chapters show and change
interface Loaded extends Known {
  anatomy: PartSummary[];
  affectedBy: AffectedBy[];
  body: Body;
}

//Physical Traits opens on the story of Andrew and Daniel the first time, for anyone, and on the chapters once they've
//seen it. ?intro plays it again, ?chapter opens a chapter and ?view one of the page's views
function Physical() {
  const params = new URLSearchParams(useSearch());
  const session = useSession();
  const config = useConfig();
  const watched = useWatched();
  const seen = watched || !!config?.physical_intro_seen;

  //watched while logged out, then logged in: it's saved on their account
  const unsaved = !!config && !config.physical_intro_seen && watched;
  useEffect(() => {
    if (unsaved) setConfig({ physical_intro_seen: true }).then(() => noteWatched(false), () => {});
  }, [unsaved]);

  if (session.status === 'checking') return null;
  if (params.has('intro') || (!params.has('chapter') && !params.has('view') && !seen))
    return (
      <Suspense fallback={null}>
        <Intro />
      </Suspense>
    );
  return <Traits />;
}

//what the 3D body shows on a scene, on the scenes that show it
const shotOf = (scene: Scene): Shot | undefined => ('shot' in scene.stage ? scene.stage.shot : undefined);

//the chapters, taken one at a time. Each chapter is a run of scenes, and each scene is one thing: Atlas saying
//something, one measurement to take, one ability to rate, or one list to fill in, beside a comic of someone doing it or
//the 3D body with the parts it's about lit up
function Traits() {
  const params = new URLSearchParams(useSearch());
  const chapter = CHAPTERS.find((c) => c.id === params.get('chapter'));
  const view: View = VIEWS.find((v) => v.id === params.get('view'))?.id ?? 'chapters';

  const [anatomy, setAnatomy] = useState<PartSummary[]>();
  const [meshes, setMeshes] = useState<MeshIndex>();
  const [abilities, setAbilities] = useState<Ability[]>();
  const [measurements, setMeasurements] = useState<Measurements>();
  const [me, setMe] = useState<Me>();
  const [impairments, setImpairments] = useState<Impairments>();
  const [conditions, setConditions] = useState<Conditions>();
  const [affectedBy, setAffectedBy] = useState<AffectedBy[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const failed = (e: unknown) => setError(failure(e));
    getAnatomy().then(setAnatomy, failed);
    getMeshIndex().then(setMeshes, failed);
    getAbilities().then(setAbilities, failed);
    getMeasurements().then(setMeasurements, failed);
    getMe().then(setMe, failed);
    getImpairments().then(setImpairments, failed);
    getConditions().then(setConditions, failed);
    getAffectedBy().then(setAffectedBy, failed);
  }, []);

  const body = useMemo(() => (anatomy && meshes ? indexBody(anatomy, meshes) : undefined), [anatomy, meshes]);
  const loaded = useMemo<Loaded | undefined>(
    () => (anatomy && body && abilities && measurements && me && impairments && conditions && affectedBy ? { anatomy, body, abilities, measurements, me, impairments, conditions, affectedBy } : undefined),
    [anatomy, body, abilities, measurements, me, impairments, conditions, affectedBy],
  );

  //a save that moves where the user stands on their abilities gives them back, worked out again, with what it saved.
  //Conditions don't move them, only what can affect them
  const failed = (e: unknown) => setError(failure(e));
  const changeImpairments = (change: (list: Impairment[]) => Impairment[], abilities: Ability[]) => {
    setImpairments((data) => data && { ...data, impairments: change(data.impairments) });
    setAbilities(abilities);
    getAffectedBy().then(setAffectedBy, failed);
  };
  const changes: Changes = {
    measurements: (data, abilities) => {
      setMeasurements(data);
      setAbilities(abilities);
    },
    me: setMe,
    readings: (id, readings, abilities) => {
      setMeasurements((data) => data && { ...data, measurements: data.measurements.map((m) => (m.id === id ? { ...m, readings } : m)) });
      setAbilities(abilities);
    },
    rated: setAbilities,
    impaired: (saved, abilities) => changeImpairments((list) => [...list.filter((i) => i.id !== saved.id), saved], abilities),
    unimpaired: (id, abilities) => changeImpairments((list) => list.filter((i) => i.id !== id), abilities),
    conditions: (data) => {
      setConditions(data);
      getAffectedBy().then(setAffectedBy, failed);
    },
  };

  return (
    <RequireLogin reason="I can't show you around your body until I know who you are. Make an account and let's take a look.">
      {chapter && loaded && !error ? (
        <Player key={chapter.id} chapter={chapter} scene={params.get('scene')} loaded={loaded} changes={changes} />
      ) : (
        <div style={styles.page} className="comic-page">
          <Nav />
          <Header view={view} />
          {error ? (
            <AtlasError message={error} />
          ) : !loaded ? (
            <Thinking label="Looking you over" />
          ) : view === 'explore' ? (
            <Explore loaded={loaded} changes={changes} />
          ) : view === 'results' ? (
            <BodyStage body={loaded.body} layers={['skeleton', 'muscles', 'nervous', 'organs']} panel={(onLight) => <Results abilities={loaded.abilities} body={loaded.body} onLight={onLight} />} />
          ) : (
            <Chapters loaded={loaded} />
          )}
          <Footer />
        </div>
      )}
    </RequireLogin>
  );
}

//each chapter's picture, a still of its opening scene, by its id
const THUMBS = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./chapters/*.jpg', { eager: true, import: 'default' })).map(([path, url]) => [path.split('/')[2].replace('.jpg', ''), url]),
);

//a scene's name, for its dot: a test's or ability's name, or what the scene is
const NAMED: Record<string, string> = {
  intro: 'Introduction',
  results: 'How you did',
  impairments: 'What holds you back',
  conditions: 'Your conditions',
};
const nameOf = (s: Scene) => s.title ?? NAMED[s.id] ?? (s.id.startsWith('intro') ? 'Introduction' : s.id);

//the page's views: the chapters, the user's results drawn on their body, and the body to explore
type View = 'chapters' | 'results' | 'explore';
const VIEWS: { id: View; label: string; to: string; says: string }[] = [
  {
    id: 'chapters',
    label: 'Chapters',
    to: '/physical',
    says: "Here we'll find out what your body can do, from your height and weight to your strength, stamina and senses. Pick any chapter to start, and skip anything you'd rather not answer.",
  },
  {
    id: 'results',
    label: 'Your results',
    to: '/physical?view=results',
    says: 'Here is everything you have measured, tested and rated, drawn on your body. Red parts are behind your stronger abilities and blue parts are behind the ones that are lower. Pick an ability to see which parts of you it uses.',
  },
  {
    id: 'explore',
    label: 'Explore',
    to: '/physical?view=explore',
    says: 'Turn the body around and click any part to find out what it does and what depends on it.',
  },
];

//the title, Atlas saying what the view is for, and the views to switch between
function Header({ view }: { view: View }) {
  return (
    <>
      <header style={styles.header}>
        <h1 style={styles.title} className="comic-title">
          Physical Traits
        </h1>
        <div style={styles.guide}>
          <Mascot />
          <div key={view} style={styles.menuBubble} className="comic-bubble comic-pop">
            {VIEWS.find((v) => v.id === view)!.says}
          </div>
        </div>
      </header>
      <div style={styles.views}>
        <button className="comic-lift" style={{ ...styles.viewButton, ...styles.replay }} onClick={() => navigate('/physical?intro')}>
          Replay the intro ▶
        </button>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className="comic-lift"
            style={{ ...styles.viewButton, ...(view === v.id ? styles.viewButtonActive : {}) }}
            aria-pressed={view === v.id}
            onClick={() => replace(v.to)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </>
  );
}

//the body to explore: click any part on it, or find it beside it, to light it up and read all about it. Everything the
//user has noted blushes
function Explore({ loaded, changes }: { loaded: Loaded; changes: Changes }) {
  const { anatomy, body, abilities, measurements, impairments, conditions } = loaded;
  const [picked, setPicked] = useState<string>();
  const noted = useMemo(() => meshesOf(body, [...notedParts(impairments, conditions).values()].flat()), [body, impairments, conditions]);
  const byId = useMemo(() => new Map(measurements.measurements.map((m) => [m.id, m])), [measurements]);
  const pickMesh = (element: string) => {
    const part = body.byFma.get(body.meshes[element]?.[0] ?? '');
    if (part) setPicked(part.id);
  };
  return (
    <BodyStage
      body={body}
      layers={['skeleton', 'organs']}
      noted={noted}
      onPick={pickMesh}
      panel={(onLight) => (
        <BodyMap
          anatomy={anatomy}
          body={body}
          impairments={impairments}
          conditions={conditions}
          measurements={byId}
          abilities={abilities}
          picked={picked}
          onPick={setPicked}
          onImpaired={changes.impaired}
          onLight={onLight}
        />
      )}
    />
  );
}

//the chapters to pick from, each with its picture and how far through it the user is
function Chapters({ loaded }: { loaded: Loaded }) {
  return (
    <ol style={styles.cards}>
      {CHAPTERS.map((c, i) => (
        <li key={c.id}>
          <button className="comic-lift" style={{ ...styles.card, '--tilt': `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` } as CSSProperties} onClick={() => navigate(`/physical?chapter=${c.id}`)}>
            <span style={styles.number}>Chapter {i + 1}</span>
            {THUMBS[c.id] && <img src={THUMBS[c.id]} alt="" style={styles.thumb} loading="lazy" />}
            <span style={styles.cardTitle}>{c.title}</span>
            <span style={styles.blurb}>{c.blurb}</span>
            {c.progress && <span style={styles.progress}>{c.progress(loaded)}</span>}
          </button>
        </li>
      ))}
    </ol>
  );
}

//what a scene's panel can change, passed up so everything showing it stays the same
export interface Changes {
  measurements: (data: Measurements, abilities: Ability[]) => void;
  me: (me: Me) => void; //their own physical attributes
  readings: (id: string, readings: Reading[], abilities: Ability[]) => void; //a measurement's readings
  rated: (abilities: Ability[]) => void;
  impaired: (saved: Impairment, abilities: Ability[]) => void; //an impairment noted or changed
  unimpaired: (id: string, abilities: Ability[]) => void;
  conditions: (data: Conditions) => void;
}

interface PlayerProps {
  chapter: Chapter;
  scene: string | null; //the id of the scene to show, from the url
  loaded: Loaded;
  changes: Changes;
}

//one chapter, a scene at a time, across the whole screen: a comic of someone doing what the scene is about, or the 3D
//body, takes the stage with Atlas talking in a box along the bottom, and what the user can do on a scene sits beside it,
//or in Atlas's box on narrow screens. A test the app runs takes the stage while it runs
function Player({ chapter, scene: sceneId, loaded, changes }: PlayerProps) {
  const { body, abilities, measurements, impairments, conditions } = loaded;
  const { meshes } = body;
  const scenes = useMemo(() => chapter.scenes(loaded), [chapter, loaded]);
  const at = Math.max(0, scenes.findIndex((s) => s.id === sceneId));
  const scene = scenes[at];
  const following = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
  const wide = useWide();
  const parts = useMemo(() => parted(scene.text), [scene.text]);
  const [part, setPart] = useState(0); //which part of what Atlas says is showing
  const says = parts[Math.min(part, parts.length - 1)];
  const { shown, typed, setShown } = useTypewriter(says);
  const [layers, setLayers] = useState<Set<LayerId>>(() => new Set(shotOf(scene)?.layers));
  const [light, setLight] = useState<Light>({});
  const [loading, setLoading] = useState(false);
  const [testStage, setTestStage] = useState<HTMLDivElement | null>(null);
  const [testing, setTesting] = useState(false);
  const [peek, setPeek] = useState<number | null>(null); //the scene dot being pointed at, whose name shows under it

  //what the scene lights up: its parts, or every part its category's abilities rest on, never the whole body, which would light up everything
  const shot = useMemo(() => {
    const s = shotOf(scene);
    if (!s) return new Set<string>();
    const { category, parts, ids } = s;
    const lit = category ? abilities.filter((a) => a.category === category).flatMap((a) => a.parts) : [...partIds(body, parts ?? []), ...(ids ?? [])];
    return meshesOf(body, lit.filter((id) => id !== body.byFma.get(HUMAN_BODY)?.id));
  }, [body, abilities, scene]);
  const lit = light.lit ?? shot;

  //the meshes of everything the user has noted, which blush once they're being asked about it
  const noted = useMemo(() => {
    if (scene.panel?.kind !== 'noting') return new Set<string>();
    return meshesOf(body, [...notedParts(impairments, conditions).values()].flat());
  }, [body, impairments, conditions, scene]);

  const showing = useShowing(layers, lit, meshes);

  const tints = useMemo(() => light.tints ?? new Map<string, number>(), [light.tints]);
  const onLight = useCallback((l: Light) => setLight(l), []);

  //to a scene, at its first part, or written out at its last when going back to it
  const go = (index: number, read = false) => {
    if (index < 0 || index >= scenes.length) return;
    replace(`/physical?chapter=${chapter.id}&scene=${scenes[index].id}`);
    setLayers(new Set(shotOf(scenes[index])?.layers));
    setLight({});
    setPart(read ? parted(scenes[index].text).length - 1 : 0);
    setShown(read ? Infinity : 0);
  };
  //the first press finishes writing out what Atlas says, the next moves on
  const last = at === scenes.length - 1;
  //on to the next scene, or the next chapter after the last
  const next = () => (!last ? go(at + 1) : navigate(following ? `/physical?chapter=${following.id}` : '/physical'));
  const forward = () => {
    if (!typed) return setShown(Infinity);
    if (part < parts.length - 1) {
      setPart(part + 1);
      return setShown(0);
    }
    go(at + 1);
  };
  const back = () => {
    if (part === 0) return go(at - 1, true);
    setPart(part - 1);
    setShown(Infinity);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      //a running test has its own keys
      if (testing || e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') forward();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const toggleLayer = (id: LayerId) => setLayers((current) => toggled(current, id));

  const panel = scene.panel && (typed || part > 0) && (
    <ScenePanel scene={scene} loaded={loaded} changes={changes} onLight={onLight} testStage={testStage} onTesting={setTesting} onSkip={next} />
  );
  //a measurement brings its own card; everything else sits on a plain one
  const card = scene.panel?.kind === 'measurement' ? undefined : styles.panel;

  return (
    <div style={styles.stage} className="comic-page">
      <header style={styles.top}>
        <button className="comic-lift" style={styles.exit} onClick={() => navigate('/physical')}>
          ◀ Chapters
        </button>
        <h1 style={styles.chapterTitle} className="comic-title">
          {chapter.title}
        </h1>
        {scenes.length > 1 && (
          <nav style={styles.dots} aria-label={`Scene ${at + 1} of ${scenes.length}`}>
            {scenes.map((s, i) => (
              <span key={s.id} style={styles.dotSlot}>
                <button
                  type="button"
                  style={{ ...styles.dot, ...(i <= at ? styles.dotDone : {}), ...(i === at ? styles.dotHere : {}) }}
                  aria-label={nameOf(s)}
                  aria-current={i === at ? 'step' : undefined}
                  disabled={testing}
                  onClick={() => i !== at && go(i)}
                  onMouseEnter={() => setPeek(i)}
                  onMouseLeave={() => setPeek(null)}
                  onFocus={() => setPeek(i)}
                  onBlur={() => setPeek(null)}
                />
                {peek === i && !testing && (
                  <span style={{ ...styles.peek, ...(i > scenes.length / 2 ? { right: -6 } : { left: -6 }) }} role="tooltip">
                    {nameOf(s)}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
      </header>

      <div style={styles.middle}>
        {'motion' in scene.stage ? (
          <div style={styles.motion}>
            <MotionPanel key={scene.stage.motion} name={scene.stage.motion} />
          </div>
        ) : 'sheet' in scene.stage ? (
          <div style={styles.sheet}>
            <div key={scene.id} style={{ ...styles.panel, ...styles.sheetCard }} className="comic-settle">
              <Sheet
                key={scene.stage.sheet}
                abilities={abilities.filter((a) => 'sheet' in scene.stage && a.category === scene.stage.sheet)}
                measurements={measurements.measurements}
                onGo={(id) => go(scenes.findIndex((s) => s.id === id), true)}
              />
            </div>
          </div>
        ) : (
          <div style={styles.viewer}>
            <Suspense fallback={<Thinking label="Building the body" />}>
              <AnatomyViewer layers={showing} lit={lit} noted={noted} tints={tints} focus={lit} spin={!!shotOf(scene)?.spin} pulse={!!light.pulse} onLoading={setLoading} />
            </Suspense>
            <LayerButtons showing={showing} loading={loading} onToggle={toggleLayer} />
          </div>
        )}

        {/* the side is always there on wide screens, so the stage keeps its size from scene to scene, except beside a
            breakdown of abilities, which takes the whole stage */}
        {wide && !('sheet' in scene.stage) && (
          <aside style={styles.side}>
            {panel && (
              <div key={scene.id} style={card} className="comic-settle">
                {panel}
              </div>
            )}
          </aside>
        )}

        {/* where a running test goes, over the body */}
        <div style={testing ? styles.testing : styles.hidden}>
          <div ref={setTestStage} style={styles.test} />
        </div>
      </div>

      {/* Atlas, out of the way while a test runs, which says what to do itself. The outer div places the box so the panel inside is free to animate its own transform */}
      <div style={testing ? styles.hidden : styles.dock}>
        <div style={styles.box} className="comic-panel comic-pop">
          <div style={styles.speaker}>Atlas</div>
          <div key={scene.id} style={styles.scroll}>
            <div style={styles.says}>
              {wide && <Mascot size={64} />}
              <div style={styles.words}>
                {scene.title && <h2 style={styles.about}>{scene.title}</h2>}
                <p style={styles.text} aria-live="polite">
                  <Typed text={says} shown={shown} />
                </p>
              </div>
            </div>
            {!wide && panel && <div style={testing ? styles.hidden : { ...card, ...styles.inline }}>{panel}</div>}
          </div>

          {!testing && (
            <div style={styles.controls}>
              {(at > 0 || part > 0) && (
                <button className="comic-lift" style={styles.back} onClick={back}>
                  ◀ Back
                </button>
              )}
              <span style={styles.hint}>
                <span className="keyboard-only">← back · → next</span>
              </span>
              {!last || part < parts.length - 1 ? (
                <button className="comic-lift" style={styles.next} onClick={forward}>
                  Next ▶
                </button>
              ) : following ? (
                <button className="comic-lift" style={styles.next} onClick={() => navigate(`/physical?chapter=${following.id}`)}>
                  Next chapter: {following.title} ▶
                </button>
              ) : (
                <button className="comic-lift" style={styles.next} onClick={() => navigate('/physical')}>
                  Back to the chapters ■
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScenePanelProps {
  scene: Scene;
  loaded: Loaded;
  changes: Changes;
  onLight: (light: Light) => void;
  testStage: HTMLElement | null;
  onTesting: (testing: boolean) => void;
  onSkip: () => void;
}

//the one thing the user can do on a scene
function ScenePanel({ scene, loaded, changes, onLight, testStage, onTesting, onSkip }: ScenePanelProps) {
  const { anatomy, body, abilities, measurements, me, impairments, conditions, affectedBy } = loaded;
  const panel = scene.panel!;
  if (panel.kind === 'characteristic') {
    const c = me.characteristics.find((x) => x.id === panel.id);
    return c ? <CharacteristicChoice key={c.id} characteristic={c} onMe={changes.me} onMeasurements={changes.measurements} /> : null;
  }
  if (panel.kind === 'measurement') {
    const m = measurements.measurements.find((x) => x.id === panel.id);
    return m ? <MeasurementCard key={m.id} measurement={m} hand={handOf(me)} stage={testStage} onTesting={onTesting} onSkip={onSkip} onChanged={(readings, abilities) => changes.readings(m.id, readings, abilities)} /> : null;
  }
  if (panel.kind === 'rating') {
    const a = abilities.find((x) => x.id === panel.id);
    return a ? <Rating key={a.id} ability={a} onChanged={changes.rated} /> : null;
  }
  return (
    <Noting
      key={panel.show}
      show={panel.show}
      impairments={impairments}
      conditions={conditions}
      anatomy={anatomy}
      abilities={abilities}
      affectedBy={affectedBy}
      body={body}
      onImpaired={changes.impaired}
      onUnimpaired={changes.unimpaired}
      onConditions={changes.conditions}
      onLight={onLight}
    />
  );
}

const styles: Record<string, CSSProperties> = {
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
    gap: 16,
  },
  views: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  //at the far end of the row of views
  replay: {
    order: 1,
    marginLeft: 'auto',
    fontSize: 20,
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
  menuBubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
  cards: {
    maxWidth: 1100,
    margin: '0 auto 36px',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 22,
  },
  card: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    padding: '16px 18px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `4px 5px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    transform: 'rotate(var(--tilt))',
  },
  number: {
    fontSize: 14,
    color: 'var(--air-force-blue)',
  },
  thumb: {
    width: '100%',
    aspectRatio: '16 / 10',
    objectFit: 'cover',
    marginTop: 4,
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    background: '#fbfbf6',
  },
  cardTitle: {
    fontFamily: comic,
    fontSize: 30,
    letterSpacing: 1,
    color: brownRed,
  },
  blurb: {
    fontSize: 16,
    lineHeight: 1.4,
  },
  progress: {
    marginTop: 'auto',
    padding: '2px 10px',
    background: 'var(--pale-cinnamon)',
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    fontSize: 14,
  },
  //the whole screen: a bar along the top, the body filling the middle, and Atlas's box along the bottom
  stage: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    textAlign: 'left',
    background: `radial-gradient(rgba(106, 142, 174, 0.22) 1.6px, transparent 1.8px) 0 0 / 14px 14px, ${ivory}`,
  },
  top: {
    flex: 'none',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 20px',
    padding: '16px 16px 0',
    zIndex: 20,
  },
  exit: {
    padding: '4px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  chapterTitle: {
    fontSize: 'clamp(28px, 4vw, 44px)',
  },
  dots: {
    marginLeft: 'auto',
    maxWidth: 360,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  dotSlot: {
    position: 'relative',
    display: 'flex',
  },
  dot: {
    width: 12,
    height: 12,
    padding: 0,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    background: '#fff',
    cursor: 'pointer',
  },
  dotDone: {
    background: brownRed,
  },
  dotHere: {
    transform: 'scale(1.35)',
  },
  //a scene's name, under its dot
  peek: {
    position: 'absolute',
    top: 20,
    zIndex: 5,
    padding: '3px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    boxShadow: `2px 3px 0 ${gunmetal}`,
    fontSize: 14,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  //the body, with what the user can do beside it on wide screens
  middle: {
    flex: '1 1 0',
    minHeight: 0,
    position: 'relative',
    display: 'flex',
    gap: 16,
    padding: '0 16px',
  },
  viewer: {
    flex: '1 1 0',
    minWidth: 0,
    position: 'relative',
  },
  //where the user stands on a category of abilities, across the whole stage, scrolling when it's long
  sheet: {
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px 8px 12px 0', //room for the card's shadow inside the scrolling layer
  },
  sheetCard: {
    gap: 22,
    maxWidth: 1400,
    margin: '0 auto',
  },
  //a comic of someone doing what the scene is about, as big as the stage allows
  motion: {
    flex: '1 1 0',
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
  },
  side: {
    flex: '0 0 clamp(340px, 32vw, 460px)',
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px 8px 12px 0', //room for the card's shadow inside the scrolling side
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '20px 22px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    border: `3px solid ${gunmetal}`,
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  //a running test, over the body and what's beside it, laid out as they are. Its height is there for a test to size itself to, so a box to
  //play in fits on the screen with its instructions and controls
  testing: {
    position: 'absolute',
    inset: 0,
    zIndex: 15,
    containerType: 'size',
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'safe center',
    padding: '12px 16px',
    background: `radial-gradient(rgba(106, 142, 174, 0.22) 1.6px, transparent 1.8px) 0 0 / 14px 14px, ${ivory}`,
  },
  test: {
    width: '100%',
  },
  hidden: {
    display: 'none',
  },
  dock: {
    flex: 'none',
    maxHeight: '55%',
    display: 'flex',
    justifyContent: 'center',
    padding: '28px 16px 20px',
    zIndex: 10,
  },
  box: {
    width: 'min(1160px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 120,
    padding: '22px 26px 14px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)', //the color wash that spills out from behind the box
    '--tilt': '-0.4deg',
  } as CSSProperties,
  speaker: {
    position: 'absolute',
    top: -22,
    left: 22,
    padding: '2px 16px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    transform: 'rotate(-3deg)',
  },
  //the box's color wash and speaker tag spill outside it, so the scrolling happens on a layer inside
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 5px 6px 0', //room for the panel's shadow inside the scrolling layer
  },
  says: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  words: {
    minWidth: 0,
  },
  //the name of what the scene is about, over what Atlas says
  about: {
    margin: '0 0 4px',
    fontFamily: comic,
    fontSize: 'clamp(17px, 1.8vw, 20px)',
    fontWeight: 400,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 'clamp(18px, 2vw, 21px)',
    lineHeight: 1.4,
  },
  inline: {
    marginTop: 14,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    flex: 1,
    fontSize: 15,
    opacity: 0.6,
  },
  back: {
    padding: '4px 16px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  next: {
    padding: '4px 18px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    boxShadow: `2px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
};

export default Physical;
