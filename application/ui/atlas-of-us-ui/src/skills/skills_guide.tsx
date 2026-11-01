import { useState, type CSSProperties, type ReactNode } from 'react';
import { LEVEL_NAMES } from './api';
import { LevelSteps } from '../shared_components/level_steps';
import { Stepper } from '../shared_components/stepper';
import findingClip from '../assets/skills_guide/finding.mp4';
import takesClip from '../assets/skills_guide/takes.mp4';
import addingClip from '../assets/skills_guide/adding.mp4';

//STYLE_GUIDE.md palette, defined as variables in App.css
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//what each level looks like, Novice to Expert
const LEVELS = [
  'Following the rules step by step, without yet knowing when to bend them.',
  'Starting to spot what matters in a situation from having seen it before, but still leaning on the rules.',
  'Making a plan, choosing what to focus on and owning how it turns out.',
  "Seeing the whole situation at a glance and knowing what's off, though still thinking through what to do about it.",
  'Just knowing what to do, and doing it without having to think it through.',
];

//each step's body is drawn when it shows, once the styles below exist
//a step's clip is a recording of a test user doing what it describes
const STEPS: { name: string; clip?: { src: string; label: string }; body: () => ReactNode }[] = [
  {
    name: 'What a skill is',
    body: () => (
      <>
        <p style={{ margin: 0 }}>
          The Atlas of Us is a map of you, and your skills are a big part of it. A skill is anything you can learn to do
          better, from juggling to brain surgery.
        </p>
        <p style={{ margin: 0 }}>
          Every skill exists once in the Atlas, and they're linked together so you can see how they relate. You can also
          see what personality traits help those skills, and what knowledge or topics they are reliant on you knowing. 
          So once you've selected a skill, you can see where it sits among everything else and what you could learn next.
        </p>
      </>
    ),
  },
  {
    name: 'The five levels',
    body: () => (
      <>
        <p style={{ margin: 0 }}>Nobody starts out an expert. Every skill has the same five levels, and each skill describes what they look like for it. We use the Dreyfus model of skill acquisition to show the full range of a skill - from novice to expert.</p>
        <ol style={styles.levels}>
          {LEVEL_NAMES.map((name, i) => (
            <li key={name} style={styles.level}>
              <span style={styles.levelSteps}>
                <LevelSteps rank={i + 1} total={LEVEL_NAMES.length} />
              </span>
              <span>
                <strong style={styles.levelName}>{name}.</strong> {LEVELS[i]}
              </span>
            </li>
          ))}
        </ol>
      </>
    ),
  },
  {
    name: 'Finding a skill',
    clip: { src: findingClip, label: 'Dragging the board, zooming in on its fields, fitting it again, then searching for Rust Programming' },
    body: () => (
      <>
        <p style={{ margin: 0 }}>
          The Skills Explorer is a map of every skill in the Atlas. Each dot is a skill, and they are grouped by related skills.
        </p>
        <ul style={styles.list}>
          <li>Drag the background to look around, and scroll or pinch to zoom in until the dots have names.</li>
          <li>Click a field's name to zoom to it, and Fit to see everything again.</li>
          <li>Or search for a skill by name. If it isn't there yet, ask for it and we will add it in a few minutes.</li>
        </ul>
      </>
    ),
  },
  {
    name: 'What a skill takes',
    clip: { src: takesClip, label: 'Double-clicking Rust Programming to see what it links to, then picking Competent, Expert and Novice' },
    body: () => (
      <>
        <p style={{ margin: 0 }}>Click a skill to see its name in the board's corner and all five of its levels below the board.</p>
        <ul style={styles.list}>
          <li>Double-click it, or press Expand, to see just it and everything it links to: the skills, traits and topics it needs.</li>
          <li>Pick a level on the board to see only what that level requires.</li>
          <li>Double-click anything there to bring in what it links to. Back undoes a step, and Back to the atlas leaves the close-up.</li>
        </ul>
      </>
    ),
  },
  {
    name: 'Adding yourself',
    clip: { src: addingClip, label: 'Pressing Add yourself on Rust Programming, reading up the levels to Competent, and skipping the date' },
    body: () => (
      <>
        <p style={{ margin: 0 }}>
          When you have a certain skill, press Add yourself under the board. You read each level from Novice up and say which one is you, when you got there if you know, and add evidence for it if you can.
        </p>
        <p style={{ margin: 0 }}>Every skill you've added shows in My Skills, with the level you're at and quite a. bit more information.</p>
      </>
    ),
  },
];

//plays on a loop, or waits to be played for someone who'd rather things didn't move
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

//a walk through the Skills module: what skills are in the Atlas, their five levels, and how to use the Skills Explorer
export function SkillsGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const { clip } = STEPS[step];

  return (
    <div style={styles.backdrop} onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div style={styles.box} className="comic-panel comic-pop" role="dialog" aria-modal="true" aria-label="How skills work" onClick={(e) => e.stopPropagation()}>
        <Stepper
          steps={STEPS.map((s) => s.name)}
          current={step}
          onBack={() => setStep(step - 1)}
          actions={
            <>
              {!last && (
                <button className="comic-lift" style={styles.secondary} onClick={onClose}>
                  Close
                </button>
              )}
              <button key={step} autoFocus className="comic-lift" style={styles.primary} onClick={() => (last ? onClose() : setStep(step + 1))}>
                {last ? 'Done' : 'Next'}
              </button>
            </>
          }
        >
          <h2 style={styles.title}>{STEPS[step].name}</h2>
          {clip && <video key={clip.src} style={styles.clip} src={clip.src} aria-label={clip.label} autoPlay={!still} controls={still} loop muted playsInline />}
          <div style={styles.text}>{STEPS[step].body()}</div>
        </Stepper>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    background: 'rgba(57, 61, 63, 0.55)',
  },
  box: {
    width: 'min(640px, 100%)',
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    padding: '22px 28px 26px',
    boxSizing: 'border-box',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    '--panel-fill': 'var(--pale-cinnamon)',
  } as CSSProperties,
  title: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    color: brownRed,
  },
  clip: {
    display: 'block',
    width: '100%',
    height: 'auto',
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    background: ivory,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontSize: 17,
    lineHeight: 1.5,
  },
  list: {
    margin: 0,
    paddingLeft: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  levels: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  level: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  levelSteps: {
    flex: 'none',
    paddingTop: 4,
  },
  levelName: {
    color: brownRed,
  },
  secondary: {
    padding: '4px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  primary: {
    padding: '4px 18px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
};
