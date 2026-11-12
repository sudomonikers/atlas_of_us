import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { RequireLogin } from '../auth/require-login';
import { navigate } from '../router';
import { Typed } from '../shared_components/typed';
import { useTypewriter } from '../shared_components/typewriter';
import { blue, brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { twoPlayers, type ChoiceFrame, type Script, type Step } from './script';
import { StageView } from './stage';
import { preload } from './atlas';

// Physical, take two: the story of Andrew and Daniel told across the whole screen, a step at a time, with the
// whiteboard behind it and the real Atlas over it during the interludes. It ends on where the user wants to start, and
// opens that chapter of Physical.

const Whiteboard = lazy(() => import('./whiteboard'));

const paleBlue = 'var(--pale-blue)';
const paleCinnamon = 'var(--pale-cinnamon)';

//how many times a second the whiteboard's animations move, as in the personality scenes
const SCENE_FPS = 24;

interface Position {
  section: string;
  index: number;
}

const isChoice = (step: Step): step is ChoiceFrame => 'choices' in step;

//where the script goes after a step that isn't a choice
const following = (script: Script, { section, index }: Position): Position | undefined => {
  if (index + 1 < script.sections[section].steps.length) return { section, index: index + 1 };
  const next = script.sections[section].next;
  return next ? { section: next, index: 0 } : undefined;
};

function Physical2() {
  return (
    <RequireLogin reason="Make an account, and I'll show you how your body shapes what you could be great at.">
      <Player script={twoPlayers} />
    </RequireLogin>
  );
}

function Player({ script }: { script: Script }) {
  //the interludes read the real Atlas, so start reading all of it while the story is still being told
  useEffect(() => preload(script), [script]);
  //every position visited, so back can walk back through branches
  const [history, setHistory] = useState<Position[]>([{ section: script.start, index: 0 }]);
  const position = history[history.length - 1];
  const section = script.sections[position.section];
  const step = section.steps[position.index];
  const text = isChoice(step) ? step.prompt : step.text;
  const { shown, typed, setShown } = useTypewriter(text);
  //the whiteboard holds the last drawing while the stage is up
  const animation = 'animation' in step ? step.animation : undefined;
  const stage = !isChoice(step) ? step.stage : undefined;

  const go = (next: Position) => {
    setHistory((h) => [...h, next]);
    setShown(0);
  };

  const forward = () => {
    if (!typed) return setShown(text.length);
    if (isChoice(step)) return;
    const next = following(script, position);
    if (next) go(next);
  };

  const back = () => {
    if (history.length < 2) return;
    setHistory((h) => h.slice(0, -1));
    setShown(Infinity);
  };

  const choose = (i: number) => {
    if (!isChoice(step)) return;
    const { next, chapter } = step.choices[i];
    if (chapter) navigate(`/physical?chapter=${chapter}`);
    else if (next) go({ section: next, index: 0 });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
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

  //every animation on the whiteboard is paused and stepped forward together on one timer
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      for (const animation of root.current?.getAnimations({ subtree: true }) ?? []) {
        if (animation.playState === 'running') animation.pause();
        const at = Number(animation.currentTime ?? 0);
        if (at < Number(animation.effect?.getComputedTiming().endTime ?? 0)) animation.currentTime = at + 1000 / SCENE_FPS;
      }
    }, 1000 / SCENE_FPS);
    return () => clearInterval(timer);
  }, []);

  //the stage sits over the text box, however tall it grows
  const dock = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState(260);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setBoxHeight(entry.target.getBoundingClientRect().height));
    if (dock.current) observer.observe(dock.current);
    return () => observer.disconnect();
  }, []);

  const next = !isChoice(step) && following(script, position);
  return (
    <div style={{ ...styles.screen, '--box-height': `${boxHeight + 44}px` } as CSSProperties}>
      <div ref={root} style={{ ...styles.board, ...(stage ? styles.dimmed : {}) }}>
        <Suspense fallback={null}>
          <Whiteboard animation={animation} />
        </Suspense>
      </div>
      {stage && <StageView stage={stage} />}

      <button style={styles.exit} className="comic-lift" onClick={() => navigate('/physical')}>
        ◀ Back to physical
      </button>
      {section.interlude && (
        <div key={section.interlude} style={styles.interlude} className="comic-pop">
          How the Atlas works: {section.interlude}
        </div>
      )}

      <div style={styles.dock}>
        <div ref={dock} style={styles.box} className="comic-panel comic-pop">
          {'speaker' in step && step.speaker && (
            <div key={step.speaker} style={styles.speaker} className="comic-pop">
              {step.speaker}
            </div>
          )}
          <div key={`${position.section}-${position.index}`} style={styles.scroll}>
            <p style={styles.text}>
              <Typed text={text} shown={shown} />
            </p>
            {isChoice(step) && typed && (
              <div style={styles.choices}>
                {step.choices.map((choice, i) => (
                  <button key={choice.label} className="comic-lift" style={styles.choice} onClick={() => choose(i)}>
                    {choice.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={styles.controls}>
            {history.length > 1 && (
              <button className="comic-lift" style={styles.back} onClick={back}>
                ◀ Back
              </button>
            )}
            <span style={styles.hint}>
              <span className="keyboard-only">← back · → next</span>
            </span>
            {!(isChoice(step) && typed) && (
              <button className="comic-lift" style={styles.continue} onClick={forward}>
                {next || isChoice(step) ? 'Next ▶' : 'Finish ■'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const button: CSSProperties = {
  minHeight: 44,
  padding: '4px 14px',
  background: ivory,
  color: gunmetal,
  border: `3px solid ${gunmetal}`,
  borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: comic,
  fontSize: 20,
  letterSpacing: 1,
};

const styles: Record<string, CSSProperties> = {
  screen: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    background: '#fbfbf6',
  },
  board: {
    position: 'absolute',
    inset: 0,
    transition: 'filter 0.4s, opacity 0.4s',
  },
  //the whiteboard steps back while the real Atlas is up
  dimmed: {
    filter: 'blur(3px)',
    opacity: 0.45,
  },
  exit: {
    ...button,
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    minHeight: 0,
  },
  interlude: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    maxWidth: 'calc(100% - 340px)',
    padding: '4px 16px',
    background: blue,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '8px 14px 6px 12px / 12px 8px 14px 6px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dock: {
    position: 'absolute',
    left: '50%',
    top: 72,
    bottom: 28,
    transform: 'translateX(-50%)',
    width: 'min(860px, calc(100% - 32px))',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    zIndex: 10,
    pointerEvents: 'none',
  },
  box: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 130,
    maxHeight: '100%',
    padding: '24px 30px 16px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    fontFamily: 'var(--font-hand)',
    fontSize: 24,
    lineHeight: 1.4,
    pointerEvents: 'auto',
    '--panel-fill': paleBlue,
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
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  text: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  choices: {
    marginTop: 14,
    padding: '0 5px 6px 0',
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
    boxShadow: `3px 3px 0 ${paleCinnamon}`,
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
  back: button,
  continue: {
    ...button,
    padding: '4px 18px',
    background: brownRed,
    color: ivory,
    fontSize: 22,
    letterSpacing: 1.5,
  },
};

export default Physical2;
