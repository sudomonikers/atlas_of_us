import { useState, type CSSProperties } from 'react';
import { BLOOM_NAMES, setLevel, type Engagement, type Topic } from './api';
import { EvidenceForm, EvidenceList } from './evidence';
import { AtlasError } from '../shared_components/atlas-error';
import { Dots } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//where the walkthrough is: reading a level, or giving evidence for the level they're at
type Step = { kind: 'level'; rank: number } | { kind: 'evidence'; rank: number };

interface SelfAssessmentProps {
  topic: Topic;
  engagement: Engagement;
  onChange: (engagement: Engagement) => void;
  onClose: () => void;
}

//places the user on a topic: they climb its levels from Remember, saying at each one whether it's them exactly or
//they're past it, and step back when they've gone too far. Then they can give evidence for the level they're at
export function SelfAssessment({ topic, engagement, onChange, onClose }: SelfAssessmentProps) {
  const [step, setStep] = useState<Step>({ kind: 'level', rank: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = (rank: number) => {
    setSaving(true);
    setError(undefined);
    setLevel(topic.id, rank)
      .then(() => {
        onChange({ ...engagement, rank });
        setStep({ kind: 'evidence', rank });
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSaving(false));
  };
  const past = (rank: number) => setStep({ kind: 'level', rank: rank + 1 });

  return (
    <div style={styles.backdrop} onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div
        style={styles.box}
        className="comic-panel comic-pop"
        role="dialog"
        aria-label={`Where are you with ${topic.name}?`}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={styles.kicker}>{topic.name}</p>
        {step.kind === 'level' && (
          <LevelStep topic={topic} rank={step.rank} current={engagement.rank} saving={saving} onPast={past} onExactly={save} onBack={(rank) => setStep({ kind: 'level', rank: rank - 1 })} />
        )}
        {step.kind === 'evidence' && (
          <>
            <h2 style={styles.title}>You're at {BLOOM_NAMES[step.rank - 1]}</h2>
            <p style={styles.text}>
              Want to back it up? Add a note or a file that shows it. It's optional, and you can add more from the topic's page any time.
            </p>
            {!!topic.levels.find((l) => l.rank === step.rank)?.example_evidence?.length && (
              <div>
                <h3 style={styles.subheading}>What would prove it</h3>
                <ul style={styles.list}>
                  {topic.levels.find((l) => l.rank === step.rank)!.example_evidence!.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <EvidenceList evidence={engagement.evidence} onRemoved={(id) => onChange({ ...engagement, rank: step.rank, evidence: engagement.evidence.filter((e) => e.id !== id) })} />
            <EvidenceForm topicId={topic.id} given={engagement.evidence.length} onAdded={(added) => onChange({ ...engagement, rank: step.rank, evidence: [...engagement.evidence, added] })} />
            <div style={styles.footer}>
              <button autoFocus className="comic-lift" style={styles.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
        {error && <AtlasError message={error} size={36} />}
      </div>
    </div>
  );
}

//one level: what someone at it is like, and whether that's them
function LevelStep({ topic, rank, current, saving, onPast, onExactly, onBack }: {
  topic: Topic;
  rank: number;
  current: number | null;
  saving: boolean;
  onPast: (rank: number) => void;
  onExactly: (rank: number) => void;
  onBack: (rank: number) => void;
}) {
  const level = topic.levels.find((l) => l.rank === rank);
  return (
    <>
      <div style={styles.progress} aria-label={`Level ${rank} of ${BLOOM_NAMES.length}`}>
        {BLOOM_NAMES.map((name, i) => (
          <span key={name} style={{ ...styles.dot, ...(i < rank ? styles.dotDone : {}) }} title={name} />
        ))}
      </div>
      <div style={styles.levelHead}>
        <h2 style={styles.title}>
          {rank}. {BLOOM_NAMES[rank - 1]}
        </h2>
        {current === rank && <span className="comic-chip">Where you said you were</span>}
      </div>
      {level?.description && <p style={styles.text}>{level.description}</p>}
      {!!level?.observable_signs?.length && (
        <div>
          <h3 style={styles.subheading}>You can see it when they</h3>
          <ul style={styles.list}>
            {level.observable_signs.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </div>
      )}
      <p style={styles.question}>{saving ? <>Saving<Dots /></> : 'Is this you?'}</p>
      <div style={styles.footer}>
        {rank > 1 && (
          <button className="comic-lift" style={styles.back} disabled={saving} onClick={() => onBack(rank)}>
            Back
          </button>
        )}
        <button key={rank} autoFocus className="comic-lift" style={styles.primary} disabled={saving} onClick={() => onExactly(rank)}>
          That's me exactly
        </button>
        {rank < BLOOM_NAMES.length && (
          <button className="comic-lift" style={styles.secondary} disabled={saving} onClick={() => onPast(rank)}>
            I'm past this
          </button>
        )}
      </div>
    </>
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
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    '--panel-fill': 'var(--pale-cinnamon)',
  } as CSSProperties,
  kicker: {
    margin: 0,
    fontSize: 16,
    color: blue,
  },
  progress: {
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 22,
    height: 10,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
  },
  dotDone: {
    background: brownRed,
  },
  levelHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    color: brownRed,
  },
  subheading: {
    margin: '0 0 6px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 20,
    letterSpacing: 1,
    color: gunmetal,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  list: {
    margin: 0,
    paddingLeft: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 17,
    lineHeight: 1.45,
  },
  question: {
    margin: '4px 0 0',
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
  },
  back: {
    marginRight: 'auto',
    padding: '4px 14px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 16,
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
