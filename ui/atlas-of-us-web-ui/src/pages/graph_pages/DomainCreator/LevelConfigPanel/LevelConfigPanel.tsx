import { useState } from 'react';
import type { EditableDomainLevel } from '../domain-creator-interfaces';
import './LevelConfigPanel.css';

interface LevelConfigPanelProps {
  level: EditableDomainLevel;
  onClose: () => void;
  onUpdate: (updates: Partial<EditableDomainLevel>) => void;
}

export function LevelConfigPanel({
  level,
  onClose,
  onUpdate,
}: LevelConfigPanelProps) {
  const [name, setName] = useState(level.name);
  const [description, setDescription] = useState(level.description);
  const [pointsRequired, setPointsRequired] = useState(level.pointsRequired);

  const handleSave = () => {
    onUpdate({
      name: name.trim() || `Level ${level.level}`,
      description: description.trim(),
      pointsRequired,
    });
    onClose();
  };

  return (
    <div className="level-config-overlay" onClick={onClose}>
      <div className="level-config-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="config-header">
          <h3>Configure Level {level.level}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="config-form">
          {/* Level Name */}
          <div className="form-group">
            <label htmlFor="level-name">Level Name</label>
            <input
              id="level-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Novice, Apprentice, Master..."
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="level-description">Description</label>
            <textarea
              id="level-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this level represents..."
              rows={3}
            />
          </div>

          {/* Points Required */}
          <div className="form-group">
            <label htmlFor="level-points">Points Required</label>
            <div className="points-input-wrapper">
              <input
                id="level-points"
                type="number"
                min={0}
                step={10}
                value={pointsRequired}
                onChange={(e) => setPointsRequired(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="points-label">points</span>
            </div>
            <p className="form-hint">
              Points determine the cumulative effort needed to reach this level
            </p>
          </div>

          {/* Stats */}
          <div className="level-stats">
            <h4>Requirements Summary</h4>
            <div className="stats-grid">
              <div className="stat-item knowledge">
                <span className="stat-value">{level.knowledge.length}</span>
                <span className="stat-label">Knowledge</span>
              </div>
              <div className="stat-item skill">
                <span className="stat-value">{level.skills.length}</span>
                <span className="stat-label">Skills</span>
              </div>
              <div className="stat-item trait">
                <span className="stat-value">{level.traits.length}</span>
                <span className="stat-label">Traits</span>
              </div>
              <div className="stat-item milestone">
                <span className="stat-value">{level.milestones.length}</span>
                <span className="stat-label">Milestones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="config-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
