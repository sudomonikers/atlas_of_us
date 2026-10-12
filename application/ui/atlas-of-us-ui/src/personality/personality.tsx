import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { isPrompt, type Script, type Step } from './script';
import { landfall } from './landfall/script';
import Landfall from './landfall/landfall';

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

function Personality() {
  return <ScriptPlayer script={landfall} renderScene={(animation) => <Landfall animation={animation} />} />;
}

interface ScriptPlayerProps {
  script: Script;
  renderScene: (animation: string) => ReactNode; //the scenario's background, driven by the current step's animation
}

function ScriptPlayer({ script, renderScene }: ScriptPlayerProps) {
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
    if (!next) return;
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
      <style>{keyframes}</style>
      {renderScene(step.animation)}

      <div style={styles.box}>
        {step.speaker && <div style={styles.speaker}>{step.speaker}</div>}

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
              <button style={{ ...styles.continue, ...(answered ? {} : styles.continueDisabled) }} disabled={!answered} onClick={forward}>
                Continue ▶
              </button>
            </div>
          </div>
        )}

        {!isPrompt(step) && typed && nextPosition() && <span style={styles.more}>▼</span>}
        <span style={styles.nav}>← back · → next</span>
      </div>
    </div>
  );
}

const keyframes = `
@keyframes personality-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
`;

const ink = '#1d1d1f';
const paper = '#fbf8ef';

const styles: Record<string, CSSProperties> = {
  stage: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    background: '#000',
  },
  box: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    transform: 'translateX(-50%)',
    width: 'min(860px, calc(100% - 32px))',
    boxSizing: 'border-box',
    minHeight: 120,
    padding: '20px 28px 30px',
    background: paper,
    color: ink,
    border: `4px solid ${ink}`,
    borderRadius: 10,
    boxShadow: `inset 0 0 0 3px ${paper}, inset 0 0 0 5px #7d7a70, 0 8px 24px rgba(0, 0, 0, 0.4)`,
    textAlign: 'left',
    fontFamily: '"Courier New", ui-monospace, monospace',
    fontSize: 20,
    lineHeight: 1.5,
    zIndex: 10,
  },
  speaker: {
    position: 'absolute',
    top: -20,
    left: 20,
    padding: '2px 14px',
    background: ink,
    color: paper,
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  text: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  unwritten: {
    visibility: 'hidden',
  },
  more: {
    position: 'absolute',
    right: 20,
    bottom: 8,
    fontSize: 16,
    animation: 'personality-blink 1s steps(1) infinite',
  },
  nav: {
    position: 'absolute',
    left: 28,
    bottom: 8,
    fontSize: 12,
    opacity: 0.45,
  },
  prompt: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  choice: {
    font: 'inherit',
    fontSize: 17,
    textAlign: 'left',
    padding: '6px 12px',
    background: 'transparent',
    color: ink,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    cursor: 'pointer',
  },
  choiceSelected: {
    background: ink,
    color: paper,
  },
  answer: {
    font: 'inherit',
    fontSize: 17,
    padding: '8px 10px',
    background: '#fff',
    color: ink,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    resize: 'vertical',
  },
  promptFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 12,
    opacity: 0.55,
  },
  continue: {
    font: 'inherit',
    fontSize: 16,
    fontWeight: 700,
    padding: '6px 16px',
    background: ink,
    color: paper,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  continueDisabled: {
    opacity: 0.35,
    cursor: 'default',
  },
};

export default Personality;
