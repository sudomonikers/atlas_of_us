import { JSX, useState, useEffect, useRef } from 'react';
import type { CanvasNode } from '../NodeTree/node-tree-types';
import type { GeneralizationSource } from '../domain-interfaces';
import { BLOOM_LEVELS } from '../../../../common/enums/blooms-6-levels.enum';
import { DREYFUS_LEVELS } from '../../../../common/enums/dreyfus-skill-aquisition.enum';
import { getHttpService } from '../../../../services/http-service';
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
  userProofUrl?: string;
  onMarkComplete: (node: CanvasNode, levelOrScore: string | number, proofUrl?: string) => Promise<void>;
  onRemoveProgress: (relationshipElementId: string) => Promise<void>;
  isLoggedIn: boolean;
  generalizationSources?: GeneralizationSource[];
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
  userProofUrl,
  onMarkComplete,
  onRemoveProgress,
  isLoggedIn,
  generalizationSources
}: NodeDetailPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState<string | null>(null);
  const [score, setScore] = useState<number>(50);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isFetchingProof, setIsFetchingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form state when node changes
  useEffect(() => {
    setLevel(userBloomLevel ?? userDreyfusLevel ?? null);
    setScore(userScore ?? 50);
    setProofFile(null);
    setProofPreview(null);
  }, [node?.elementId, userBloomLevel, userDreyfusLevel, userScore]);

  const hasProgress = !!relationshipElementId;

  if (!node) return null;

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setProofPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const removeProofFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProofFile = async (): Promise<string | undefined> => {
    if (!proofFile || !node) return undefined;

    setIsUploadingProof(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const timestamp = Date.now();
      const sanitizedName = proofFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      // Sanitize element ID to remove colons and other problematic characters for S3
      const sanitizedElementId = node.elementId.replace(/[^a-zA-Z0-9-]/g, '_');
      const key = `proofs/${sanitizedElementId}/${timestamp}_${sanitizedName}`;

      const formData = new FormData();
      formData.append('file', proofFile);

      const response = await fetch(
        `${API_BASE}/secure/helper/s3-upload?bucket=atlas-of-us-general-bucket&key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload proof');
      }

      return key;
    } catch (error) {
      console.error('Error uploading proof:', error);
      return undefined;
    } finally {
      setIsUploadingProof(false);
    }
  };

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

      // Upload proof file if selected
      const proofUrl = await uploadProofFile();

      await onMarkComplete(node, value, proofUrl);
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

  const handleViewAttachment = async () => {
    if (!userProofUrl || isFetchingProof) return;

    setIsFetchingProof(true);
    try {
      const httpService = getHttpService();
      const blob = await httpService.getS3Object('atlas-of-us-general-bucket', userProofUrl);
      const blobUrl = URL.createObjectURL(blob);

      // Extract filename from the S3 key (format: proofs/{nodeId}/{timestamp}_{filename})
      const filename = userProofUrl.split('/').pop() || 'attachment';
      // Remove timestamp prefix if present
      const cleanFilename = filename.replace(/^\d+_/, '');

      // Check if the file type can be displayed in browser
      const viewableTypes = ['image/', 'application/pdf'];
      const canView = viewableTypes.some(type => blob.type.startsWith(type));

      if (canView) {
        window.open(blobUrl, '_blank');
      } else {
        // Trigger download for non-viewable files
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Error fetching attachment:', error);
    } finally {
      setIsFetchingProof(false);
    }
  };

  const canSave = () => {
    if (isSubmitting) return false;
    if (node.type === 'knowledge' || node.type === 'skill') return !!level;
    return true;
  };

  return (
    <div className={`node-detail-panel ${node ? 'open' : ''}`}>
      <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        {/* Node Info Container - Description + Requirements + Transferable Skills */}
        <div className="node-info-container">
          {node.description && <p className="panel-description">{node.description}</p>}

          {/* Requirements Row - Model Requirement and Transferable Skills side by side */}
          {(node.type === 'knowledge' || node.type === 'skill' || node.type === 'trait' || node.type === 'milestone' || node.type === 'level') && (
            <div className={`requirements-row ${generalizationSources && generalizationSources.length > 0 && !isCompleted ? 'has-transferable' : ''}`}>
              {/* Model Requirement */}
              <div className="requirement-column">
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
              </div>

              {/* Transferable Skills */}
              {generalizationSources && generalizationSources.length > 0 && !isCompleted && (
                <div className="transferable-column">
                  <div className="generalization-section">
                    <h3 className="requirement-title">Transferable Skills</h3>
                    <div className="generalization-info">
                      <p className="generalization-description">
                        You have related skills from other domains that may help with this:
                      </p>
                      <ul className="generalization-sources-list">
                        {generalizationSources.map((source, idx) => (
                          <li key={idx} className="generalization-source-item">
                            <span className="source-name">{source.nodeName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Your Progress Container - Separate section */}
        {isLoggedIn && node.type !== 'level' && (
          <div className="progress-container">
            <h3 className="progress-title">Your Progress</h3>

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

                {/* Show existing proof if available */}
                {userProofUrl && (
                  <div className="existing-proof">
                    <h4 className="proof-label">Your Proof:</h4>
                    <button
                      onClick={handleViewAttachment}
                      disabled={isFetchingProof}
                      className="proof-link"
                    >
                      {isFetchingProof ? 'Loading...' : 'View Attachment'}
                    </button>
                  </div>
                )}

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

                {/* Proof Upload Section */}
                <div className="proof-upload-section">
                  <label className="proof-upload-label">Add Proof (optional):</label>
                  <p className="proof-description">Upload an image, document, or certificate as evidence of your progress.</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleProofSelect}
                    className="proof-file-input"
                    id="proof-file-input"
                  />

                  {!proofFile ? (
                    <label htmlFor="proof-file-input" className="proof-upload-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="upload-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Choose File
                    </label>
                  ) : (
                    <div className="proof-preview">
                      {proofPreview && (
                        <img src={proofPreview} alt="Proof preview" className="proof-preview-image" />
                      )}
                      <div className="proof-file-info">
                        <span className="proof-file-name">{proofFile.name}</span>
                        <button type="button" onClick={removeProofFile} className="proof-remove-btn">
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button className="mark-complete-btn" onClick={handleSave} disabled={!canSave() || isUploadingProof}>
                  {isSubmitting || isUploadingProof ? 'Saving...' : hasProgress ? 'Update Progress' : 'Save Progress'}
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
