import { Suspense, lazy, useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { LAYERS, getMeshIndex, type LayerId, type MeshIndex } from './anatomy_layers';
import {
  getAbilities,
  getAffectedBy,
  getAnatomy,
  getConditions,
  getImpairments,
  getMeasurements,
  type Ability,
  type AffectedBy,
  type Conditions,
  type Impairment,
  type Impairments,
  type Measurements,
  type PartSummary,
  type Reading,
} from './api';
import BodyMap from './body_map';
import { HUMAN_BODY, indexBody, meshesOf, notedParts, partIds, type Body, type Light } from './body_parts';
import Compare from './compare';
import { MeasurementCard } from './measurement_card';
import Noting from './noting';
import Rating from './rating';
import Results from './results';
import { CHAPTERS, type Chapter, type Known, type Scene } from './tour';
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

//everything the chapters show and change
interface Loaded extends Known {
  anatomy: PartSummary[];
  affectedBy: AffectedBy[];
  body: Body;
}

//Physical Traits opens on the story of Andrew and Daniel the first time, for anyone, and on the chapters once they've
//seen it. ?intro plays it again
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
  if (params.has('intro') || (!params.has('chapter') && !seen))
    return (
      <Suspense fallback={null}>
        <Intro />
      </Suspense>
    );
  return <Traits />;
}

//the chapters: a walk through the user's body beside a 3D model of it, taken one at a time. Each chapter is a run of
//scenes, and each scene is one thing: Atlas saying something with the parts it's about lit up, one measurement to take,
//one ability to rate, or one list to fill in
function Traits() {
  const params = new URLSearchParams(useSearch());
  const chapter = CHAPTERS.find((c) => c.id === params.get('chapter'));

  const [anatomy, setAnatomy] = useState<PartSummary[]>();
  const [meshes, setMeshes] = useState<MeshIndex>();
  const [abilities, setAbilities] = useState<Ability[]>();
  const [measurements, setMeasurements] = useState<Measurements>();
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
    getImpairments().then(setImpairments, failed);
    getConditions().then(setConditions, failed);
    getAffectedBy().then(setAffectedBy, failed);
  }, []);

  const body = useMemo(() => (anatomy && meshes ? indexBody(anatomy, meshes) : undefined), [anatomy, meshes]);
  const loaded = useMemo<Loaded | undefined>(
    () => (anatomy && body && abilities && measurements && impairments && conditions && affectedBy ? { anatomy, body, abilities, measurements, impairments, conditions, affectedBy } : undefined),
    [anatomy, body, abilities, measurements, impairments, conditions, affectedBy],
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
          {error ? <AtlasError message={error} /> : !loaded ? <Thinking label="Looking you over" /> : <Chapters loaded={loaded} />}
          <Footer />
        </div>
      )}
    </RequireLogin>
  );
}

//the chapters to pick from, each with how far through it the user is
function Chapters({ loaded }: { loaded: Loaded }) {
  return (
    <>
      <header style={styles.header}>
        <h1 style={styles.title} className="comic-title">
          Physical Traits
        </h1>
        <div style={styles.guide}>
          <Mascot />
          <div style={styles.menuBubble} className="comic-bubble comic-pop">
            Your body is where everything you do starts. Walk through it with me and we'll find out what you have to work
            with, so every skill can show you how you measure up. Pick a chapter and we'll take it one thing at a time.
            If you're new, start with the first.
          </div>
        </div>
        <button className="comic-lift" style={styles.replay} onClick={() => navigate('/physical?intro')}>
          Replay the intro ▶
        </button>
      </header>
      <ol style={styles.cards}>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button className="comic-lift" style={{ ...styles.card, '--tilt': `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` } as CSSProperties} onClick={() => navigate(`/physical?chapter=${c.id}`)}>
              <span style={styles.number}>Chapter {i + 1}</span>
              <span style={styles.cardTitle}>{c.title}</span>
              <span style={styles.blurb}>{c.blurb}</span>
              {c.progress && <span style={styles.progress}>{c.progress(loaded)}</span>}
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

//what a scene's panel can change, passed up so everything showing it stays the same
export interface Changes {
  measurements: (data: Measurements, abilities: Ability[]) => void;
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

//one chapter, a scene at a time, across the whole screen: the 3D body takes the stage with Atlas talking in a box along
//the bottom, and what the user can do on a scene sits beside the body, or in Atlas's box on narrow screens. A test the
//app runs takes the stage from the body while it runs
function Player({ chapter, scene: sceneId, loaded, changes }: PlayerProps) {
  const { body, abilities, impairments, conditions } = loaded;
  const { meshes } = body;
  const scenes = useMemo(() => chapter.scenes(loaded), [chapter, loaded]);
  const at = Math.max(0, scenes.findIndex((s) => s.id === sceneId));
  const scene = scenes[at];
  const following = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
  const wide = useWide();
  const { shown, typed, setShown } = useTypewriter(scene.text);
  const [layers, setLayers] = useState<Set<LayerId>>(() => new Set(scene.shot.layers));
  const [light, setLight] = useState<Light>({});
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string>(); //the part open in the explorer
  const [testStage, setTestStage] = useState<HTMLDivElement | null>(null);
  const [testing, setTesting] = useState(false);

  //what the scene lights up: its parts, or every part its category's abilities rest on, never the whole body, which would light up everything
  const shot = useMemo(() => {
    const { category, parts, ids } = scene.shot;
    const lit = category ? abilities.filter((a) => a.category === category).flatMap((a) => a.parts) : [...partIds(body, parts ?? []), ...(ids ?? [])];
    return meshesOf(body, lit.filter((id) => id !== body.byFma.get(HUMAN_BODY)?.id));
  }, [body, abilities, scene]);
  const lit = light.lit ?? shot;

  //the meshes of everything the user has noted, which blush once they're being asked about it or exploring
  const noted = useMemo(() => {
    if (scene.panel?.kind !== 'noting' && scene.panel?.kind !== 'explore') return new Set<string>();
    return meshesOf(body, [...notedParts(impairments, conditions).values()].flat());
  }, [body, impairments, conditions, scene]);

  //the layer most of what's lit is on, when it isn't showing, so what's lit is never hidden
  const showing = useMemo(() => {
    if (!lit.size) return layers;
    const counts = new Map<LayerId, number>();
    for (const e of lit) if (meshes[e]) counts.set(meshes[e][1], (counts.get(meshes[e][1]) ?? 0) + 1);
    const most = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    return !most || layers.has(most) ? layers : new Set([...layers, most]);
  }, [layers, lit, meshes]);

  const tints = useMemo(() => light.tints ?? new Map<string, number>(), [light.tints]);
  const onLight = useCallback((l: Light) => setLight(l), []);

  const go = (index: number, read = false) => {
    if (index < 0 || index >= scenes.length) return;
    replace(`/physical?chapter=${chapter.id}&scene=${scenes[index].id}`);
    setLayers(new Set(scenes[index].shot.layers));
    setLight({});
    setShown(read ? Infinity : 0);
  };
  //the first press finishes writing out what Atlas says, the next moves on
  const forward = () => (typed ? go(at + 1) : setShown(Infinity));
  const back = () => go(at - 1, true);

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

  const pickMesh = (element: string) => {
    if (scene.panel?.kind !== 'explore') return;
    const part = body.byFma.get(meshes[element]?.[0] ?? '');
    if (part) setPicked(part.id);
  };
  const toggleLayer = (id: LayerId) =>
    setLayers((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const last = at === scenes.length - 1;

  const panel = scene.panel && typed && (
    <ScenePanel scene={scene} loaded={loaded} changes={changes} picked={picked} onPick={setPicked} onLight={onLight} testStage={testStage} onTesting={setTesting} />
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
          <div style={styles.dots} role="progressbar" aria-valuemin={1} aria-valuemax={scenes.length} aria-valuenow={at + 1} aria-label={`Scene ${at + 1} of ${scenes.length}`}>
            {scenes.map((s, i) => (
              <span key={s.id} style={{ ...styles.dot, ...(i <= at ? styles.dotDone : {}) }} />
            ))}
          </div>
        )}
      </header>

      <div style={styles.middle}>
        <div style={styles.viewer}>
          <Suspense fallback={<Thinking label="Building the body" />}>
            <AnatomyViewer layers={showing} lit={lit} noted={noted} tints={tints} focus={lit} spin={!!scene.shot.spin} pulse={!!light.pulse} onPick={pickMesh} onLoading={setLoading} />
          </Suspense>
          <div style={styles.layers} role="group" aria-label="Layers">
            {LAYERS.map((l) => (
              <button key={l.id} className="comic-lift" style={showing.has(l.id) ? { ...styles.layer, ...styles.layerOn } : styles.layer} aria-pressed={showing.has(l.id)} onClick={() => toggleLayer(l.id)}>
                {l.label}
              </button>
            ))}
            {loading && <span style={styles.small}>Loading...</span>}
          </div>
        </div>

        {wide && panel && (
          <aside style={styles.side}>
            <div style={card}>{panel}</div>
          </aside>
        )}

        {/* where a running test goes, over the body */}
        <div style={testing ? styles.testing : styles.hidden}>
          <div ref={setTestStage} style={styles.test} />
        </div>
      </div>

      {/* the outer div places the box so the panel inside is free to animate its own transform */}
      <div style={styles.dock}>
        <div style={styles.box} className="comic-panel comic-pop">
          <div style={styles.speaker}>Atlas</div>
          <div key={scene.id} style={styles.scroll}>
            <div style={styles.says}>
              {wide && <Mascot size={64} />}
              <p style={styles.text} aria-live="polite">
                <Typed text={scene.text} shown={shown} />
              </p>
            </div>
            {!wide && panel && <div style={testing ? styles.hidden : { ...card, ...styles.inline }}>{panel}</div>}
          </div>

          {!testing && (
            <div style={styles.controls}>
              {at > 0 && (
                <button className="comic-lift" style={styles.back} onClick={back}>
                  ◀ Back
                </button>
              )}
              <span style={styles.hint}>
                <span className="keyboard-only">← back · → next</span>
              </span>
              {!last ? (
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
  picked: string | undefined;
  onPick: (id: string) => void;
  onLight: (light: Light) => void;
  testStage: HTMLElement | null;
  onTesting: (testing: boolean) => void;
}

//the one thing the user can do on a scene
function ScenePanel({ scene, loaded, changes, picked, onPick, onLight, testStage, onTesting }: ScenePanelProps) {
  const { anatomy, body, abilities, measurements, impairments, conditions, affectedBy } = loaded;
  const panel = scene.panel!;
  if (panel.kind === 'compare') return <Compare data={measurements} onChange={changes.measurements} />;
  if (panel.kind === 'measurement') {
    const m = measurements.measurements.find((x) => x.id === panel.id);
    return m ? <MeasurementCard key={m.id} measurement={m} stage={testStage} onTesting={onTesting} onChanged={(readings, abilities) => changes.readings(m.id, readings, abilities)} /> : null;
  }
  if (panel.kind === 'rating') {
    const a = abilities.find((x) => x.id === panel.id);
    return a ? <Rating key={a.id} ability={a} onChanged={changes.rated} /> : null;
  }
  if (panel.kind === 'results') return <Results key={panel.category ?? 'all'} abilities={abilities} only={panel.category} body={body} onLight={onLight} />;
  if (panel.kind === 'noting')
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
  return (
    <BodyMap
      anatomy={anatomy}
      body={body}
      impairments={impairments}
      conditions={conditions}
      measurements={new Map(measurements.measurements.map((m) => [m.id, m]))}
      abilities={abilities}
      picked={picked}
      onPick={onPick}
      onImpaired={changes.impaired}
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
  replay: {
    padding: '4px 16px',
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
  dot: {
    width: 12,
    height: 12,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    background: '#fff',
  },
  dotDone: {
    background: brownRed,
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
  layers: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'none',
  },
  layer: {
    padding: '2px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  layerOn: {
    background: brownRed,
    color: ivory,
  },
  small: {
    margin: 0,
    fontSize: 13,
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
  //a running test, over the body and what's beside it
  testing: {
    position: 'absolute',
    inset: 0,
    zIndex: 15,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'safe center',
    padding: '12px 16px',
    background: `radial-gradient(rgba(106, 142, 174, 0.22) 1.6px, transparent 1.8px) 0 0 / 14px 14px, ${ivory}`,
  },
  test: {
    width: 'min(760px, 100%)',
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
    width: 'min(860px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 120,
    padding: '22px 26px 14px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)', //the colour wash that spills out from behind the box
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
  //the box's colour wash and speaker tag spill outside it, so the scrolling happens on a layer inside
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
