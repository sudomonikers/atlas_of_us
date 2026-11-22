import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AtlasError } from '../../shared_components/atlas-error';
import { LevelSteps } from '../../shared_components/level_steps';
import { Dots } from '../../shared_components/thinking';
import { Typed } from '../../shared_components/typed';
import { useTypewriter } from '../../shared_components/typewriter';
import { brownRed, comic, gunmetal, ivory } from '../../shared_components/palette';
import { answer, BLOOM_NAMES, nextQuestion, type Answered, type CollectionTopic, type Question } from '../api';
import type { Scene } from './scenes/scenes';

const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';
//marker colors on the whiteboard
const MARKER = { red: '#c0392b', blue: '#1f4e8c', green: '#2e7d4f', black: '#2b2f31' };

//where a topic is: on a question, or looking at how they answered one. `choice` is null when they didn't know it
type Step =
  | { kind: 'question'; topicId: string; question: Question }
  | { kind: 'answered'; topicId: string; question: Question; choice: number | null; result: Answered };

interface BoardProps {
  name: string; //the collection's
  scene: Scene;
  topics: CollectionTopic[];
  onTopic: (id: string, change: Partial<CollectionTopic>) => void; //a topic they finished, with the level they're at
  onExit: () => void;
}

//going through a collection, played full screen like a scene: each question is written up on a whiteboard hung in the
//collection's scene, and they answer it in the box docked below. What they answer is kept as they go, so leaving and coming back picks up at
//the question they were on
export default function Board({ name, scene, topics, onTopic, onExit }: BoardProps) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  //topics they skipped this time, asked about again once they come back
  const [skipped, setSkipped] = useState<string[]>([]);
  const [step, setStep] = useState<Step>();

  const topic = topics.find((t) => !t.done && !skipped.includes(t.id));
  const topicId = topic?.id;
  const done = topics.filter((t) => t.done).length;

  //each topic opens on the question to ask next
  useEffect(() => {
    if (!topicId) return;
    let live = true;
    nextQuestion(topicId).then(
      ({ question }) => {
        if (!live) return;
        if (question) setStep({ kind: 'question', topicId, question });
        //they finished it somewhere else
        else onTopic(topicId, { done: true });
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, [topicId, onTopic]);

  //the open topic's step, once its question has loaded
  const shown = topic && step?.topicId === topic.id ? step : undefined;

  const chose = useCallback(
    async (choice: number | null) => {
      if (!shown || shown.kind !== 'question' || busy) return;
      setBusy(true);
      setError(undefined);
      try {
        const result = await answer(shown.question.id, choice);
        setStep({ ...shown, kind: 'answered', choice, result });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [shown, busy],
  );

  //on from an answer: the question a level below after a miss, or the next topic once this one is done
  const next = useCallback(() => {
    if (!shown || shown.kind !== 'answered') return;
    if (shown.result.next) setStep({ kind: 'question', topicId: shown.topicId, question: shown.result.next });
    else onTopic(shown.topicId, { done: true, rank: shown.result.rank });
  }, [shown, onTopic]);

  const skip = useCallback(() => {
    if (topic && shown?.kind !== 'answered') setSkipped((s) => [...s, topic.id]);
  }, [topic, shown]);

  //1 to 4 or A to D picks a choice, 0 or ? says they don't know, and Enter or the right arrow moves on
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (shown?.kind === 'question') {
        const key = e.key.toLowerCase();
        const index = '1234'.indexOf(key) >= 0 ? '1234'.indexOf(key) : 'abcd'.indexOf(key);
        if (index >= 0 && index < shown.question.choices.length) chose(index);
        else if (key === '0' || key === '?') chose(null);
      } else if (shown?.kind === 'answered' && (e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shown, chose, next]);

  return (
    <div style={{ ...styles.stage, background: scene.wall }}>
      <scene.Backdrop />
      <div style={{ ...styles.top, paddingTop: scene.top }}>
        <button className="comic-lift" style={styles.exit} onClick={onExit}>
          ◀ {name}
        </button>
        <span style={styles.count} className="comic-chip">
          {done} / {topics.length}
        </span>
      </div>

      <div style={styles.wall}>
        <div style={styles.board}>
          {topic ? (
            <Writing key={shown ? `${shown.question.id}-${shown.kind}` : 'loading'} topic={topic} step={shown} />
          ) : (
            <p style={{ ...styles.question, color: MARKER.blue }}>That's all of them. Head back to see what you know.</p>
          )}
          <div style={styles.tray}>
            <span style={{ ...styles.marker, background: MARKER.red }} />
            <span style={{ ...styles.marker, background: MARKER.blue }} />
            <span style={{ ...styles.marker, background: MARKER.green }} />
          </div>
        </div>
      </div>

      <div style={styles.dock}>
        <div style={styles.box} className="comic-panel comic-pop">
          {!topic && (
            <div style={styles.controls}>
              <span style={styles.hint} />
              <button className="comic-lift" style={styles.primary} onClick={onExit}>
                See what you know ▶
              </button>
            </div>
          )}
          {topic && !shown && (
            <p style={styles.waiting}>
              Finding a question
              <Dots />
            </p>
          )}
          {shown && (
            <>
              <div style={styles.answers} role="radiogroup" aria-label={shown.question.prompt}>
                {shown.question.choices.map((choice, i) => {
                  const result = shown.kind === 'answered' ? shown.result : undefined;
                  const right = result && i === result.answer;
                  const wrong = result && shown.kind === 'answered' && i === shown.choice && !result.correct;
                  return (
                    <button
                      key={i}
                      role="radio"
                      aria-checked={shown.kind === 'answered' && shown.choice === i}
                      className={result ? undefined : 'comic-lift'}
                      style={{ ...styles.answer, ...(right ? styles.right : {}), ...(wrong ? styles.wrong : {}) }}
                      disabled={busy || !!result}
                      onClick={() => chose(i)}
                    >
                      <span style={styles.letter}>{String.fromCharCode(65 + i)}</span>
                      {choice}
                    </button>
                  );
                })}
              </div>
              {shown.kind === 'answered' && !shown.result.next && <Outcome result={shown.result} />}
              {error && <AtlasError message={error} />}
              <div style={styles.controls}>
                {shown.kind === 'question' && (
                  <>
                    <button className="comic-lift" style={styles.dashed} disabled={busy} onClick={() => chose(null)}>
                      I don't know
                    </button>
                    <button className="comic-lift" style={styles.dashed} disabled={busy} onClick={skip}>
                      Skip for now
                    </button>
                  </>
                )}
                <span style={styles.hint} className="keyboard-only">
                  {shown.kind === 'question' ? 'A to D to answer · 0 if you don\'t know' : 'Enter to go on'}
                </span>
                {shown.kind === 'answered' && (
                  <button className="comic-lift" style={styles.primary} onClick={next}>
                    {shown.result.next ? 'An easier one ▶' : 'Next topic ▶'}
                  </button>
                )}
              </div>
            </>
          )}
          {topic && !shown && error && <AtlasError message={error} />}
        </div>
      </div>
    </div>
  );
}

//what's written up on the board: the topic, the question in blue marker, and once it's answered, whether they got it
//and why in green. Each is written out as if by hand, one after the other
function Writing({ topic, step }: { topic: CollectionTopic; step?: Step }) {
  const question = step?.question.prompt ?? '';
  const result = step?.kind === 'answered' ? step.result : undefined;
  const verdict = result ? (result.correct ? 'Right! ' : step?.kind === 'answered' && step.choice === null ? 'Here it is: ' : 'Not quite. ') : '';
  const explanation = result ? verdict + result.explanation : '';
  //an answered question is already on the board, so only the explanation is written out
  const asked = useTypewriter(result ? '' : question);
  const explained = useTypewriter(explanation);

  return (
    <div style={styles.writing}>
      <div style={styles.heading}>
        <span style={{ ...styles.topic, color: MARKER.red }}>{topic.name}</span>
        {step && <span style={{ ...styles.level, color: MARKER.black }}>{BLOOM_NAMES[step.question.rank - 1]}</span>}
      </div>
      <svg style={styles.underline} viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden>
        <path d="M2 8 C 60 3, 140 11, 210 5 S 290 6, 298 7" fill="none" stroke={MARKER.red} strokeWidth="3" strokeLinecap="round" />
      </svg>
      {step && (
        <p style={{ ...styles.question, color: MARKER.blue }}>
          {result ? question : <Typed text={question} shown={asked.shown} />}
        </p>
      )}
      {result && (
        <p style={{ ...styles.explanation, color: result.correct ? MARKER.green : MARKER.red }}>
          <Typed text={explanation} shown={explained.shown} />
        </p>
      )}
    </div>
  );
}

//where the topic's questions left them
function Outcome({ result }: { result: Answered }) {
  const rank = result.placed ?? result.rank;
  if (!rank) return <p style={styles.outcome}>We'll leave this one for now. You can always add it from its topic page.</p>;
  return (
    <p style={styles.outcome}>
      <LevelSteps rank={rank} total={BLOOM_NAMES.length} />
      {result.placed ? `You're at ${BLOOM_NAMES[rank - 1]}. I've added it to what you know.` : `You're at ${BLOOM_NAMES[rank - 1]} already, so that stays.`}
    </p>
  );
}

const button: CSSProperties = {
  minHeight: 44,
  padding: '4px 18px',
  border: `3px solid ${gunmetal}`,
  borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: comic,
  fontSize: 20,
  letterSpacing: 1,
  cursor: 'pointer',
};

const styles: Record<string, CSSProperties> = {
  //the whole screen: the board on the wall above, and the box docked below it, so nothing scrolls
  stage: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  top: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    //the top padding is the scene's, below what runs along the top of it
    padding: '0 16px',
  },
  exit: {
    ...button,
    minHeight: 0,
    background: ivory,
    color: gunmetal,
  },
  count: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  wall: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    padding: '10px clamp(12px, 3vw, 40px) 10px',
  },
  //a whiteboard in an aluminum frame, with a marker tray along the bottom
  board: {
    position: 'relative',
    flex: 1,
    maxWidth: 880,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #ffffff 0%, #f6f8f9 55%, #eef1f3 100%)',
    border: '12px solid #b8bec4',
    borderRadius: 10,
    boxShadow: 'inset 0 0 0 2px #9aa1a8, 0 6px 0 #8d949b, 0 10px 18px rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  writing: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: 'clamp(16px, 3vw, 36px) clamp(18px, 4vw, 48px) 44px',
    fontFamily: 'var(--font-hand)',
  },
  heading: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '4px 16px',
  },
  topic: {
    fontSize: 'clamp(24px, 3.2vw, 34px)',
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  level: {
    fontSize: 'clamp(16px, 1.8vw, 20px)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.7,
  },
  underline: {
    display: 'block',
    width: 'min(320px, 70%)',
    height: 12,
    margin: '2px 0 14px',
  },
  question: {
    margin: 0,
    fontFamily: 'var(--font-hand)',
    fontSize: 'clamp(22px, 3vw, 34px)',
    lineHeight: 1.35,
  },
  explanation: {
    margin: '18px 0 0',
    fontSize: 'clamp(19px, 2.4vw, 26px)',
    lineHeight: 1.35,
  },
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingRight: 28,
    background: '#c3c9ce',
    borderTop: '2px solid #9aa1a8',
  },
  marker: {
    width: 46,
    height: 9,
    borderRadius: 4,
    border: `2px solid ${gunmetal}`,
  },
  dock: {
    position: 'relative',
    padding: '6px 16px 16px',
  },
  box: {
    width: 'min(880px, 100%)',
    margin: '0 auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 20px 14px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    fontFamily: 'var(--font-hand)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  //two columns where there's room, so the four choices take two rows
  answers: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: 8,
  },
  answer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px',
    background: '#fff',
    color: gunmetal,
    //in parts, so the right and wrong colors can change only the color
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: gunmetal,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${paleBlue}`,
    font: 'inherit',
    fontSize: 18,
    lineHeight: 1.3,
    textAlign: 'left',
    cursor: 'pointer',
  },
  right: {
    background: '#d4efd8',
    borderColor: MARKER.green,
  },
  wrong: {
    background: paleRed,
    borderColor: MARKER.red,
  },
  letter: {
    fontFamily: comic,
    fontSize: 20,
    color: brownRed,
    minWidth: 16,
  },
  outcome: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: 0,
    fontSize: 18,
    color: brownRed,
  },
  waiting: {
    margin: 0,
    fontSize: 18,
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  dashed: {
    padding: '4px 14px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  hint: {
    flex: 1,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'right',
  },
  primary: {
    ...button,
    background: brownRed,
    color: ivory,
  },
};
