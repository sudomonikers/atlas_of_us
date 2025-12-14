import { useState } from 'react';
import type { NodeType, EditableNode } from '../domain-creator-interfaces';
import './NodeCreationModal.css';

interface NodeCreationModalProps {
  onClose: () => void;
  onSave: (
    name: string,
    description: string,
    type: NodeType,
    typeSpecificProps: EditableNode['typeSpecificProps']
  ) => void;
  initialType: NodeType;
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  knowledge: 'Knowledge',
  skill: 'Skill',
  trait: 'Trait',
  milestone: 'Milestone',
};

const TYPE_SPECIFIC_FIELDS: Record<NodeType, { key: keyof EditableNode['typeSpecificProps']; label: string; placeholder: string }> = {
  knowledge: {
    key: 'how_to_learn',
    label: 'How to Learn',
    placeholder: 'Describe how someone can learn this knowledge...',
  },
  skill: {
    key: 'how_to_develop',
    label: 'How to Develop',
    placeholder: 'Describe how someone can develop this skill...',
  },
  trait: {
    key: 'measurement_criteria',
    label: 'Measurement Criteria',
    placeholder: 'Describe how this trait is measured (0-100 scale)...',
  },
  milestone: {
    key: 'how_to_achieve',
    label: 'How to Achieve',
    placeholder: 'Describe how someone can achieve this milestone...',
  },
};

export function NodeCreationModal({
  onClose,
  onSave,
  initialType,
}: NodeCreationModalProps) {
  const [type, setType] = useState<NodeType>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [typeSpecificValue, setTypeSpecificValue] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const typeField = TYPE_SPECIFIC_FIELDS[type];

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Name is required');
    }

    if (!description.trim()) {
      newErrors.push('Description is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const typeSpecificProps: EditableNode['typeSpecificProps'] = {};
    if (typeSpecificValue.trim()) {
      typeSpecificProps[typeField.key] = typeSpecificValue.trim();
    }

    onSave(name.trim(), description.trim(), type, typeSpecificProps);
  };

  const handleTypeChange = (newType: NodeType) => {
    setType(newType);
    setTypeSpecificValue('');
  };

  const getTypeColor = (t: NodeType): string => {
    const colors: Record<NodeType, string> = {
      knowledge: '#64dfdf',
      skill: '#80ffdb',
      trait: '#c77dff',
      milestone: '#e0aaff',
    };
    return colors[t];
  };

  return (
    <div className="node-creation-modal-overlay" onClick={onClose}>
      <div className="node-creation-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Create New {NODE_TYPE_LABELS[type]}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Type selector */}
        <div className="type-selector">
          {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => (
            <button
              key={t}
              className={`type-option ${type === t ? 'active' : ''}`}
              onClick={() => handleTypeChange(t)}
              style={{
                '--type-color': getTypeColor(t),
              } as React.CSSProperties}
            >
              {NODE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="modal-form">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="node-name">Name *</label>
            <input
              id="node-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${NODE_TYPE_LABELS[type].toLowerCase()} name...`}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="node-description">Description *</label>
            <textarea
              id="node-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe this ${NODE_TYPE_LABELS[type].toLowerCase()}...`}
              rows={3}
            />
          </div>

          {/* Type-specific field */}
          <div className="form-group">
            <label htmlFor="node-type-specific">{typeField.label}</label>
            <textarea
              id="node-type-specific"
              value={typeSpecificValue}
              onChange={(e) => setTypeSpecificValue(e.target.value)}
              placeholder={typeField.placeholder}
              rows={3}
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            style={{
              '--type-color': getTypeColor(type),
            } as React.CSSProperties}
          >
            Create {NODE_TYPE_LABELS[type]}
          </button>
        </div>
      </div>
    </div>
  );
}
