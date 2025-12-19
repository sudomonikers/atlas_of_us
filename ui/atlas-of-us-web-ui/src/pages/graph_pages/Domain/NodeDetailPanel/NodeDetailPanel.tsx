import { JSX, useState, useEffect } from 'react';
import type { CanvasNode } from '../SkillTree/skill-tree-types';
import { BLOOM_LEVELS } from '../../../../common/enums/blooms-6-levels.enum';
import { DREYFUS_LEVELS } from '../../../../common/enums/dreyfus-skill-aquisition.enum';
import './NodeDetailPanel.css';

interface NodeDetailPanelProps {
  node: CanvasNode | null;
  onClose: () => void;
  isCompleted: boolean;
  relationshipElementId?: string;
  userScore?: number;
  userBloomLevel?: string;
  userDreyfusLevel?: string;
  userDate?: string;
  onMarkComplete: (node: CanvasNode, levelOrScore: string | number) => Promise<void>;
  onRemoveProgress: (relationshipElementId: string) => Promise<void>;
  isLoggedIn: boolean;
}

export function NodeDetailPanel({
  node,
  onClose,
  isCompleted,
  relationshipElementId,
  userScore,
  userBloomLevel,
  userDreyfusLevel,
  userDate,
  onMarkComplete,
  onRemoveProgress,
  isLoggedIn
}: NodeDetailPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState<string | null>(null);
  const [score, setScore] = useState<number>(50);

  // Reset form state when node changes
  useEffect(() => {
    setLevel(userBloomLevel ?? userDreyfusLevel ?? null);
    setScore(userScore ?? 50);
  }, [node?.elementId, userBloomLevel, userDreyfusLevel, userScore]);

  const hasProgress = !!relationshipElementId;

  if (!node) return null;

  const handleSave = async () => {
    if (!node || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let value: string | number;
      if (node.type === 'knowledge') {
        value = level || node.requirement?.bloomLevel || 'Remember';
      } else if (node.type === 'skill') {
        value = level || node.requirement?.dreyfusLevel || 'Novice';
      } else if (node.type === 'trait') {
        value = score;
      } else {
        value = new Date().toISOString().split('T')[0];
      }
      await onMarkComplete(node, value);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!relationshipElementId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRemoveProgress(relationshipElementId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDisplay = () => userBloomLevel || userDreyfusLevel || userScore || userDate || null;

  const canSave = () => {
    if (isSubmitting) return false;
    if (node.type === 'knowledge' || node.type === 'skill') return !!level;
    return true;
  };

  return (
    <div className={`node-detail-panel ${node ? 'open' : ''}`}>
      <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className={`panel-header ${node.type}`}>
        <NodeIcon type={node.type} />
        <div className="panel-header-text">
          <span className="panel-type-badge">{node.type.charAt(0).toUpperCase() + node.type.slice(1)}</span>
          <h2 className="panel-title">{node.name}</h2>
        </div>
      </div>

      <div className="panel-content">
        {node.description && <p className="panel-description">{node.description}</p>}

        {node.type === 'knowledge' && node.requirement?.bloomLevel && (
          <RequirementLadder levels={BLOOM_LEVELS} required={node.requirement.bloomLevel} title="Bloom's Taxonomy" />
        )}

        {node.type === 'skill' && node.requirement?.dreyfusLevel && (
          <RequirementLadder levels={DREYFUS_LEVELS} required={node.requirement.dreyfusLevel} title="Dreyfus Model" />
        )}

        {node.type === 'trait' && node.requirement?.minScore !== undefined && (
          <TraitRequirement minScore={node.requirement.minScore} />
        )}

        {node.type === 'milestone' && <MilestoneInfo />}
        {node.type === 'level' && <LevelInfo />}

        {isLoggedIn && node.type !== 'level' && (
          <div className="completion-section">
            <h3 className="requirement-title">Your Progress</h3>

            {isCompleted ? (
              <div className="completion-status">
                <div className="completed-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Requirement Met</span>
                </div>
                <p className="completion-level">
                  {node.type === 'trait' ? `Your Score: ${getUserDisplay()}` 
                  : node.type === 'milestone' ? `Date Completed: ${getUserDisplay()}`
                  : `Your Level: ${getUserDisplay()}`}
                </p>
                <button className="remove-progress-btn" onClick={handleRemove} disabled={isSubmitting}>
                  {isSubmitting ? 'Removing...' : 'Remove Progress'}
                </button>
              </div>
            ) : (
              <div className="mark-complete-section">
                {hasProgress && (
                  <div className="partial-progress-notice">
                    <span className="partial-badge">In Progress</span>
                    <p>
                      Current: {getUserDisplay()}
                      {node.type === 'knowledge' && ` (need ${node.requirement?.bloomLevel})`}
                      {node.type === 'skill' && ` (need ${node.requirement?.dreyfusLevel})`}
                      {node.type === 'trait' && ` (need ${node.requirement?.minScore}+)`}
                    </p>
                  </div>
                )}

                {node.type === 'knowledge' && (
                  <LevelSelector
                    levels={BLOOM_LEVELS}
                    selected={level}
                    onSelect={setLevel}
                    label={hasProgress ? 'Update your Bloom level:' : 'Select your Bloom level:'}
                  />
                )}

                {node.type === 'skill' && (
                  <LevelSelector
                    levels={DREYFUS_LEVELS}
                    selected={level}
                    onSelect={setLevel}
                    label={hasProgress ? 'Update your Dreyfus level:' : 'Select your Dreyfus level:'}
                  />
                )}

                {node.type === 'trait' && (
                  <div className="score-selector">
                    <label>{hasProgress ? 'Update your score (0-100):' : 'Rate your level (0-100):'}</label>
                    <div className="score-input-container">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value))}
                        className="score-slider"
                      />
                      <span className="score-display">{score}</span>
                    </div>
                  </div>
                )}

                {node.type === 'milestone' && (
                  <p className="milestone-prompt">Mark this milestone as achieved to track your progress.</p>
                )}

                <button className="mark-complete-btn" onClick={handleSave} disabled={!canSave()}>
                  {isSubmitting ? 'Saving...' : hasProgress ? 'Update Progress' : 'Save Progress'}
                </button>

                {hasProgress && (
                  <button className="remove-progress-btn" onClick={handleRemove} disabled={isSubmitting}>
                    {isSubmitting ? 'Removing...' : 'Remove Progress'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!isLoggedIn && node.type !== 'level' && (
          <div className="login-prompt">
            <p>Log in to track your progress on this {node.type}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    knowledge: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    skill: <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none" /></>,
    trait: <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />,
    milestone: <path d="M12 2L8 8H2l5 6-2 8 7-4 7 4-2-8 5-6h-6l-4-6z" />,
    level: <><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" /></>,
  };
  return <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">{icons[type]}</svg>;
}

function RequirementLadder({ levels, required, title }: { levels: readonly string[]; required: string; title: string }) {
  const requiredIndex = levels.indexOf(required);
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">{title} Requirement</h3>
      <div className="bloom-ladder">
        {levels.map((level, i) => (
          <div key={level} className={`bloom-step ${i <= requiredIndex ? 'required' : ''} ${i === requiredIndex ? 'current' : ''}`}>
            <span className="step-number">{i + 1}</span>
            <span className="step-label">{level}</span>
          </div>
        ))}
      </div>
      <p className="requirement-note">You need to reach the <strong>{required}</strong> level.</p>
    </div>
  );
}

function LevelSelector({ levels, selected, onSelect, label }: { levels: readonly string[]; selected: string | null; onSelect: (l: string) => void; label: string }) {
  return (
    <div className="level-selector">
      <label>{label}</label>
      <div className="level-options">
        {levels.map((level) => (
          <button key={level} className={`level-option ${selected === level ? 'selected' : ''}`} onClick={() => onSelect(level)}>
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}

function TraitRequirement({ minScore }: { minScore: number }) {
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Trait Requirement</h3>
      <div className="score-bar-container">
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${minScore}%` }} />
          <div className="score-bar-marker" style={{ left: `${minScore}%` }} />
        </div>
        <div className="score-labels">
          <span>0</span>
          <span className="score-value">{minScore}</span>
          <span>100</span>
        </div>
      </div>
      <p className="requirement-note">Minimum score of <strong>{minScore}</strong> required.</p>
    </div>
  );
}

function MilestoneInfo() {
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Achievement</h3>
      <div className="milestone-badge">
        <svg viewBox="0 0 24 24" fill="currentColor" className="milestone-icon">
          <path d="M12 2L8 8H2l5 6-2 8 7-4 7 4-2-8 5-6h-6l-4-6z" />
        </svg>
        <span>Binary Achievement</span>
      </div>
      <p className="requirement-note">This milestone is either achieved or not achieved.</p>
    </div>
  );
}

function LevelInfo() {
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Domain Level</h3>
      <p className="requirement-note">Complete the knowledge, skills, traits, and milestones connected to this level to advance.</p>
    </div>
  );
}
