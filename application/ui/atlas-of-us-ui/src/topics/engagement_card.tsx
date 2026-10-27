import { useState, type CSSProperties } from 'react';
import { BLOOM_NAMES, removeEngagement, topicEvidence, type Engagement, type Topic } from './api';
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

interface EngagementCardProps {
  topic: Topic;
  rank: number; //the Bloom level they're at
  engagement: Engagement;
  onChange: (engagement: Engagement) => void;
  onWalk: () => void; //walks them through the levels again
}

//the Bloom level the user has placed themselves at in a topic, with their evidence and ways to change it
export function EngagementCard({ topic, rank, engagement, onChange, onWalk }: EngagementCardProps) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string>();

  const remove = () => {
    if (!window.confirm(`Take yourself off ${topic.name}? Your evidence for it goes too.`)) return;
    setRemoving(true);
    setError(undefined);
    removeEngagement(topic.id)
      .then(() => onChange({ rank: null, evidence: [] }))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setRemoving(false));
  };

  return (
    <section style={styles.card} className="comic-panel">
      <div style={styles.head}>
        <h3 style={styles.title}>You're at {BLOOM_NAMES[rank - 1]}</h3>
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
      <EvidenceList evidence={engagement.evidence} onRemoved={(gone) => onChange({ ...engagement, evidence: engagement.evidence.filter((e) => e.id !== gone) })} />
      {adding && (
        <EvidenceForm api={topicEvidence(topic.id)} given={engagement.evidence.length} onAdded={(added) => onChange({ ...engagement, evidence: [...engagement.evidence, added] })} />
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
