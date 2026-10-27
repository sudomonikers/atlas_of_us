import { useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, monthYear, removeAchievement, skillEvidence, type Achievement, type Skill } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { EvidenceForm, EvidenceList } from '../shared_components/evidence';
import { Dots } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface AchievementCardProps {
  skill: Skill;
  rank: number; //the Dreyfus level they're at
  achievement: Achievement;
  onChange: (achievement: Achievement) => void;
  onWalk: () => void; //walks them through the levels again
}

//the Dreyfus level the user has placed themselves at in a skill, when they got there, with their evidence and ways to
//change it
export function AchievementCard({ skill, rank, achievement, onChange, onWalk }: AchievementCardProps) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string>();

  const remove = () => {
    if (!window.confirm(`Take yourself off ${skill.name}? Your evidence for it goes too.`)) return;
    setRemoving(true);
    setError(undefined);
    removeAchievement(skill.id)
      .then(() => onChange({ rank: null, achieved_on: null, evidence: [] }))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setRemoving(false));
  };

  return (
    <section style={styles.card} className="comic-panel">
      <div style={styles.head}>
        <div>
          <h3 style={styles.title}>You're at {LEVEL_NAMES[rank - 1]}</h3>
          {achievement.achieved_on && <p style={styles.since}>Since {monthYear(achievement.achieved_on)}</p>}
        </div>
        <div style={styles.buttons}>
          {!adding && (
            <button className="comic-lift" style={styles.primary} onClick={() => setAdding(true)}>
              Add evidence
            </button>
          )}
          <button className="comic-lift" style={styles.secondary} onClick={onWalk}>
            Walk through again
          </button>
          <button className="comic-lift" style={styles.remove} disabled={removing} onClick={remove}>
            {removing ? <>Removing<Dots /></> : 'Remove'}
          </button>
        </div>
      </div>
      <EvidenceList evidence={achievement.evidence} onRemoved={(gone) => onChange({ ...achievement, evidence: achievement.evidence.filter((e) => e.id !== gone) })} />
      {adding && (
        <EvidenceForm api={skillEvidence(skill.id)} given={achievement.evidence.length} onAdded={(added) => onChange({ ...achievement, evidence: [...achievement.evidence, added] })} />
      )}
      {error && <AtlasError message={error} size={36} />}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    marginBottom: 28,
    padding: '18px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
    '--tilt': '-0.2deg',
  } as CSSProperties,
  head: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px 16px',
  },
  title: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
    color: brownRed,
  },
  since: {
    margin: '2px 0 0',
    fontSize: 15,
    color: 'var(--air-force-blue)',
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  primary: {
    padding: '4px 16px',
    background: cinnamon,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  secondary: {
    padding: '2px 14px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
  },
  remove: {
    padding: '1px 12px',
    background: 'transparent',
    color: gunmetal,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 15,
  },
};
