import { useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, setAchievement, skillEvidence, type Achievement, type Skill } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { DatePicker } from '../shared_components/date-picker';
import { EvidenceForm, EvidenceList } from '../shared_components/evidence';
import { Stepper } from '../shared_components/stepper';
import { Dots } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface AchievementWalkthroughProps {
  skill: Skill;
  achievement: Achievement;
  onChange: (achievement: Achievement) => void;
  onClose: () => void;
}

//where the walkthrough is: climbing the levels, saying when they reached the one they picked, or giving evidence for it
type Stage = 'levels' | 'date' | 'evidence';

//places the user on a skill: they climb its Dreyfus levels from Novice, saying at each one whether it's them exactly or
//they're past it, and step back when they've gone too far. Then they say when they got there, if they know, and can
//give evidence for the level they're at
export function AchievementWalkthrough({ skill, achievement, onChange, onClose }: AchievementWalkthroughProps) {
  const [rank, setRank] = useState(1); //the level being read
  const [stage, setStage] = useState<Stage>('levels');
  const [date, setDate] = useState(achievement.achieved_on ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = (achievedOn: string | null) => {
    setSaving(true);
    setError(undefined);
    setAchievement(skill.id, rank, achievedOn)
      .then(() => {
        onChange({ ...achievement, rank, achieved_on: achievedOn });
        setStage('evidence');
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setSaving(false));
  };
  const level = skill.levels.find((l) => l.rank === rank);

  return (
    <div style={styles.backdrop} onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div style={styles.box} className="comic-panel comic-pop" role="dialog" aria-label={`Where are you with ${skill.name}?`} onClick={(e) => e.stopPropagation()}>
        <p style={styles.kicker}>{skill.name}</p>
        {stage === 'levels' && (
          <Stepper
            steps={LEVEL_NAMES}
            current={rank - 1}
            onBack={() => setRank(rank - 1)}
            actions={
              <>
                <button key={rank} autoFocus className="comic-lift" style={styles.primary} onClick={() => setStage('date')}>
                  That's me exactly
                </button>
                {rank < LEVEL_NAMES.length && (
                  <button className="comic-lift" style={styles.secondary} onClick={() => setRank(rank + 1)}>
                    I'm past this
                  </button>
                )}
              </>
            }
          >
            <div style={styles.head}>
              <h2 style={styles.title}>
                {rank}. {LEVEL_NAMES[rank - 1]}
              </h2>
              {achievement.rank === rank && <span className="comic-chip">Where you said you were</span>}
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
            <p style={styles.question}>Is this you?</p>
          </Stepper>
        )}
        {stage === 'date' && (
          <>
            <h2 style={styles.title} id="reached-on">When did you reach {LEVEL_NAMES[rank - 1]}?</h2>
            <p style={styles.text}>Roughly is fine. You can skip it if you're not sure.</p>
            <DatePicker value={date} onChange={setDate} labelId="reached-on" />
            {saving && <p style={styles.question}>Saving<Dots /></p>}
            <div style={styles.footer}>
              <button className="comic-lift" style={styles.back} disabled={saving} onClick={() => setStage('levels')}>
                Back
              </button>
              <button className="comic-lift" style={styles.secondary} disabled={saving} onClick={() => save(null)}>
                Skip
              </button>
              <button className="comic-lift" style={{ ...styles.primary, ...(date ? {} : styles.disabled) }} disabled={saving || !date} onClick={() => save(date)}>
                Save
              </button>
            </div>
          </>
        )}
        {stage === 'evidence' && (
          <>
            <h2 style={styles.title}>You're at {LEVEL_NAMES[rank - 1]}</h2>
            <p style={styles.text}>
              Want to back it up? Add a note or a file that shows it. It's optional, and you can add more from the skill's page any time.
            </p>
            {!!level?.example_evidence?.length && (
              <div>
                <h3 style={styles.subheading}>What would prove it</h3>
                <ul style={styles.list}>
                  {level.example_evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <EvidenceList evidence={achievement.evidence} onRemoved={(id) => onChange({ ...achievement, evidence: achievement.evidence.filter((e) => e.id !== id) })} />
            <EvidenceForm api={skillEvidence(skill.id)} given={achievement.evidence.length} onAdded={(added) => onChange({ ...achievement, evidence: [...achievement.evidence, added] })} />
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
  head: {
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
  disabled: {
    opacity: 0.5,
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
