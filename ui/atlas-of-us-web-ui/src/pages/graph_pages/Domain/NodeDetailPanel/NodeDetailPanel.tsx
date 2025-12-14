import { useState } from 'react';
import type { CanvasNode } from '../SkillTree/skill-tree-types';
import type { Neo4jRelationship } from '../../Graph/graph-interfaces.interface';
import { BLOOM_LEVELS, DREYFUS_LEVELS } from '../SkillTree/skill-tree-constants';
import './NodeDetailPanel.css';

interface NodeDetailPanelProps {
  node: CanvasNode | null;
  onClose: () => void;
  isCompleted: boolean;
  userRelationship: Neo4jRelationship | null;
  onMarkComplete: (node: CanvasNode, levelOrScore: string | number) => Promise<void>;
  onRemoveProgress: (relationshipElementId: string) => Promise<void>;
  isLoggedIn: boolean;
}

export function NodeDetailPanel({
  node,
  onClose,
  isCompleted,
  userRelationship,
  onMarkComplete,
  onRemoveProgress,
  isLoggedIn
}: NodeDetailPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [traitScore, setTraitScore] = useState<number>(50);

  if (!node) return null;

  const handleMarkComplete = async () => {
    if (!node || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let levelOrScore: string | number;

      if (node.type === 'knowledge') {
        levelOrScore = selectedLevel || node.requirement?.bloomLevel || 'Remember';
      } else if (node.type === 'skill') {
        levelOrScore = selectedLevel || node.requirement?.dreyfusLevel || 'Novice';
      } else if (node.type === 'trait') {
        levelOrScore = traitScore;
      } else {
        levelOrScore = new Date().toISOString().split('T')[0];
      }

      await onMarkComplete(node, levelOrScore);
      setSelectedLevel(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProgress = async () => {
    if (!userRelationship || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRemoveProgress(userRelationship.ElementId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserLevel = (): string | number | null => {
    if (!userRelationship?.Props) return null;
    return userRelationship.Props.bloom_level ||
           userRelationship.Props.dreyfus_level ||
           userRelationship.Props.score ||
           userRelationship.Props.date ||
           null;
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
          <span className="panel-type-badge">{formatNodeType(node.type)}</span>
          <h2 className="panel-title">{node.name}</h2>
        </div>
      </div>

      <div className="panel-content">
        {node.description && (
          <p className="panel-description">{node.description}</p>
        )}

        {node.type === 'knowledge' && node.requirement?.bloomLevel && (
          <BloomRequirement level={node.requirement.bloomLevel} />
        )}

        {node.type === 'skill' && node.requirement?.dreyfusLevel && (
          <DreyfusRequirement level={node.requirement.dreyfusLevel} />
        )}

        {node.type === 'trait' && node.requirement?.minScore !== undefined && (
          <TraitRequirement minScore={node.requirement.minScore} />
        )}

        {node.type === 'milestone' && (
          <MilestoneInfo />
        )}

        {node.type === 'level' && (
          <LevelInfo node={node} />
        )}

        {/* Completion Section - Only for non-level nodes when logged in */}
        {isLoggedIn && node.type !== 'level' && (
          <div className="completion-section">
            <h3 className="requirement-title">Your Progress</h3>

            {isCompleted ? (
              <div className="completion-status">
                <div className="completed-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Completed</span>
                </div>
                <p className="completion-level">
                  {node.type === 'knowledge' && `Level: ${getUserLevel()}`}
                  {node.type === 'skill' && `Level: ${getUserLevel()}`}
                  {node.type === 'trait' && `Score: ${getUserLevel()}`}
                  {node.type === 'milestone' && `Achieved: ${getUserLevel()}`}
                </p>
                <button
                  className="remove-progress-btn"
                  onClick={handleRemoveProgress}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Removing...' : 'Remove Progress'}
                </button>
              </div>
            ) : (
              <div className="mark-complete-section">
                {node.type === 'knowledge' && (
                  <div className="level-selector">
                    <label>Select your Bloom level:</label>
                    <div className="level-options">
                      {BLOOM_LEVELS.map((level) => (
                        <button
                          key={level}
                          className={`level-option ${selectedLevel === level ? 'selected' : ''}`}
                          onClick={() => setSelectedLevel(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {node.type === 'skill' && (
                  <div className="level-selector">
                    <label>Select your Dreyfus level:</label>
                    <div className="level-options">
                      {DREYFUS_LEVELS.map((level) => (
                        <button
                          key={level}
                          className={`level-option ${selectedLevel === level ? 'selected' : ''}`}
                          onClick={() => setSelectedLevel(level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {node.type === 'trait' && (
                  <div className="score-selector">
                    <label>Rate your level (0-100):</label>
                    <div className="score-input-container">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={traitScore}
                        onChange={(e) => setTraitScore(parseInt(e.target.value))}
                        className="score-slider"
                      />
                      <span className="score-display">{traitScore}</span>
                    </div>
                  </div>
                )}

                {node.type === 'milestone' && (
                  <p className="milestone-prompt">
                    Mark this milestone as achieved to track your progress.
                  </p>
                )}

                <button
                  className="mark-complete-btn"
                  onClick={handleMarkComplete}
                  disabled={isSubmitting || (node.type === 'knowledge' && !selectedLevel) || (node.type === 'skill' && !selectedLevel)}
                >
                  {isSubmitting ? 'Saving...' : node.type === 'milestone' ? 'Mark Achieved' : 'Mark Complete'}
                </button>
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

function NodeIcon({ type }: { type: CanvasNode['type'] }) {
  switch (type) {
    case 'knowledge':
      return (
        <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'skill':
      return (
        <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'trait':
      return (
        <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
      );
    case 'milestone':
      return (
        <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L8 8H2l5 6-2 8 7-4 7 4-2-8 5-6h-6l-4-6z" />
        </svg>
      );
    case 'level':
      return (
        <svg className="node-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

function formatNodeType(type: CanvasNode['type']): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function BloomRequirement({ level }: { level: string }) {
  const currentIndex = BLOOM_LEVELS.indexOf(level as typeof BLOOM_LEVELS[number]);

  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Bloom's Taxonomy Requirement</h3>
      <div className="bloom-ladder">
        {BLOOM_LEVELS.map((bloomLevel, index) => (
          <div
            key={bloomLevel}
            className={`bloom-step ${index <= currentIndex ? 'required' : ''} ${
              index === currentIndex ? 'current' : ''
            }`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{bloomLevel}</span>
          </div>
        ))}
      </div>
      <p className="requirement-note">
        You need to reach the <strong>{level}</strong> level of understanding.
      </p>
    </div>
  );
}

function DreyfusRequirement({ level }: { level: string }) {
  const currentIndex = DREYFUS_LEVELS.indexOf(level as typeof DREYFUS_LEVELS[number]);

  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Dreyfus Model Requirement</h3>
      <div className="dreyfus-ladder">
        {DREYFUS_LEVELS.map((dreyfusLevel, index) => (
          <div
            key={dreyfusLevel}
            className={`dreyfus-step ${index <= currentIndex ? 'required' : ''} ${
              index === currentIndex ? 'current' : ''
            }`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-label">{dreyfusLevel}</span>
          </div>
        ))}
      </div>
      <p className="requirement-note">
        You need to reach the <strong>{level}</strong> level of proficiency.
      </p>
    </div>
  );
}

function TraitRequirement({ minScore }: { minScore: number }) {
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Trait Requirement</h3>
      <div className="score-bar-container">
        <div className="score-bar">
          <div
            className="score-bar-fill"
            style={{ width: `${minScore}%` }}
          />
          <div
            className="score-bar-marker"
            style={{ left: `${minScore}%` }}
          />
        </div>
        <div className="score-labels">
          <span>0</span>
          <span className="score-value">{minScore}</span>
          <span>100</span>
        </div>
      </div>
      <p className="requirement-note">
        Minimum score of <strong>{minScore}</strong> required.
      </p>
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
      <p className="requirement-note">
        This milestone is either achieved or not achieved. Complete the requirements to unlock.
      </p>
    </div>
  );
}

function LevelInfo({ node }: { node: CanvasNode }) {
  return (
    <div className="requirement-section">
      <h3 className="requirement-title">Domain Level</h3>
      <p className="requirement-note">
        This represents a progression level in the domain. Complete the knowledge, skills, traits, and milestones connected to this level to advance.
      </p>
    </div>
  );
}
