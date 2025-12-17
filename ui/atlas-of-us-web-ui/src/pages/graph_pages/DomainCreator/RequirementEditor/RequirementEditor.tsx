import { useState } from 'react';
import type { EditableNode, BloomLevel, DreyfusLevel } from '../domain-creator-interfaces';
import { BLOOM_LEVELS, DREYFUS_LEVELS } from '../domain-creator-interfaces';
import './RequirementEditor.css';

interface RequirementEditorProps {
  node: EditableNode;
  onClose: () => void;
  onUpdate: (requirement: Partial<EditableNode>) => void;
  onRemove: () => void;
}

export function RequirementEditor({
  node,
  onClose,
  onUpdate,
  onRemove,
}: RequirementEditorProps) {
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>(
    node.bloomLevel || 'Remember'
  );
  const [dreyfusLevel, setDreyfusLevel] = useState<DreyfusLevel>(
    node.dreyfusLevel || 'Novice'
  );
  const [minScore, setMinScore] = useState<number>(
    node.minScore || 50
  );

  const handleSave = () => {
    const requirement: Partial<EditableNode> = {};

    if (node.type === 'knowledge') {
      requirement.bloomLevel = bloomLevel;
    } else if (node.type === 'skill') {
      requirement.dreyfusLevel = dreyfusLevel;
    } else if (node.type === 'trait') {
      requirement.minScore = minScore;
    }

    onUpdate(requirement);
    onClose();
  };

  const getTypeColor = (): string => {
    const colors = {
      knowledge: '#64dfdf',
      skill: '#80ffdb',
      trait: '#c77dff',
      milestone: '#e0aaff',
    };
    return colors[node.type];
  };

  const getTypeLabel = (): string => {
    const labels = {
      knowledge: 'Knowledge',
      skill: 'Skill',
      trait: 'Trait',
      milestone: 'Milestone',
    };
    return labels[node.type];
  };

  // Check if node is new (no elementId means it was just created)
  const isNew = !node.elementId;

  return (
    <div className="requirement-editor-overlay" onClick={onClose}>
      <div
        className="requirement-editor"
        onClick={(e) => e.stopPropagation()}
        style={{ '--type-color': getTypeColor() } as React.CSSProperties}
      >
        {/* Header */}
        <div className="editor-header">
          <div className="header-info">
            <span className="node-type-badge">{getTypeLabel()}</span>
            <h3>{node.name}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Node info */}
        {node.description && (
          <div className="node-description">
            <p>{node.description}</p>
          </div>
        )}

        {/* New badge */}
        {isNew && (
          <div className="new-node-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
            New node - will be created when domain is saved
          </div>
        )}

        {/* Requirement editor */}
        <div className="editor-content">
          {node.type === 'knowledge' && (
            <div className="requirement-section">
              <label>Required Bloom's Taxonomy Level</label>
              <p className="requirement-hint">
                Select the minimum comprehension level required for this knowledge
              </p>
              <div className="level-selector">
                {BLOOM_LEVELS.map((level, index) => (
                  <button
                    key={level}
                    className={`level-option ${bloomLevel === level ? 'active' : ''}`}
                    onClick={() => setBloomLevel(level)}
                  >
                    <span className="level-number">{index + 1}</span>
                    <span className="level-name">{level}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {node.type === 'skill' && (
            <div className="requirement-section">
              <label>Required Dreyfus Model Level</label>
              <p className="requirement-hint">
                Select the minimum proficiency level required for this skill
              </p>
              <div className="level-selector">
                {DREYFUS_LEVELS.map((level, index) => (
                  <button
                    key={level}
                    className={`level-option ${dreyfusLevel === level ? 'active' : ''}`}
                    onClick={() => setDreyfusLevel(level)}
                  >
                    <span className="level-number">{index + 1}</span>
                    <span className="level-name">{level}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {node.type === 'trait' && (
            <div className="requirement-section">
              <label>Minimum Score Required</label>
              <p className="requirement-hint">
                Set the minimum trait score (0-100) needed to meet this requirement
              </p>
              <div className="score-selector">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="score-slider"
                />
                <div className="score-display">
                  <span className="score-value">{minScore}</span>
                  <span className="score-max">/ 100</span>
                </div>
              </div>
              <div className="score-labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
                <span>Exceptional</span>
              </div>
            </div>
          )}

          {node.type === 'milestone' && (
            <div className="requirement-section milestone-info">
              <div className="milestone-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p>
                Milestones are binary achievements - users either complete them or they don't.
                No additional configuration is needed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <button className="remove-btn" onClick={onRemove}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Remove from level
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
