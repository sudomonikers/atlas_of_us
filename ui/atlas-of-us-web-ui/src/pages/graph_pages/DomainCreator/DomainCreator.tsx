import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { NavBar } from "../../../common-components/navbar/nav";
import { useGlobal } from "../../../GlobalProvider";
import { HttpService, type CreateDomainRequest, type UpdateDomainRequest } from "../../../services/http-service";
import { CreatorCanvas } from "./CreatorCanvas/CreatorCanvas";
import { NodeSearchPanel } from "./NodeSearchPanel/NodeSearchPanel";
import { NodeCreationModal } from "./NodeCreationModal/NodeCreationModal";
import { LevelConfigPanel } from "./LevelConfigPanel/LevelConfigPanel";
import { RequirementEditor } from "./RequirementEditor/RequirementEditor";
import {
  type EditableDomain,
  type EditableNode,
  type EditableDomainLevel,
  type NodeType,
  createEmptyDomain,
  searchResultToEditableNode,
  createNewNode,
  domainDataToEditableDomain,
} from "./domain-creator-interfaces";
import type { SearchNodeResult } from "../../../services/http-service";
import "./DomainCreator.css";

export function DomainCreator() {
  const navigate = useNavigate();
  const { domainName } = useParams<{ domainName?: string }>();
  const httpService = new HttpService();
  const { loggedIn } = useGlobal();

  // Determine if we're in edit mode
  const isEditMode = Boolean(domainName);

  // Main domain state
  const [domain, setDomain] = useState<EditableDomain>(createEmptyDomain);
  const [originalDomainName, setOriginalDomainName] = useState<string>('');
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);

  // Track removed nodes for edit mode (to delete user progress)
  const [removedNodeElementIds, setRemovedNodeElementIds] = useState<string[]>([]);

  // UI state
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<EditableNode | null>(null);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isLevelConfigOpen, setIsLevelConfigOpen] = useState(false);
  const [isDomainAvailable, setIsDomainAvailable] = useState(true);
  const [nodeTypeToAdd, setNodeTypeToAdd] = useState<NodeType>('knowledge');
  const [isSaving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Current level helper
  const currentLevel = domain.levels[selectedLevelIndex];

  // Fetch existing domain in edit mode
  useEffect(() => {
    if (!domainName || !loggedIn) return;

    const loadDomain = async () => {
      setIsLoadingDomain(true);
      const data = await httpService.fetchDomain(domainName);

      if (data) {
        const editableDomain = domainDataToEditableDomain(data);
        setDomain(editableDomain);
        setOriginalDomainName(data.name);
      } else {
        setSaveError(`Domain "${domainName}" not found`);
      }

      setIsLoadingDomain(false);
    };

    loadDomain();
  }, [domainName, loggedIn]);

  // Update domain name
  const handleDomainNameChange = useCallback(async (name: string) => {
    setDomain(prev => ({ ...prev, name }));

    // In edit mode, skip validation if name is unchanged
    if (isEditMode && capitalizeFirstLetter(name) === originalDomainName) {
      setIsDomainAvailable(true);
      return;
    }

    const validation = await httpService.validateDomainName(capitalizeFirstLetter(name));
    if (!validation?.available) {
      setIsDomainAvailable(false);
    } else {
      setIsDomainAvailable(true);
    }
  }, [isEditMode, originalDomainName]);

  // Update domain description
  const handleDomainDescriptionChange = useCallback((description: string) => {
    setDomain(prev => ({ ...prev, description }));
  }, []);

  // Update level
  const handleLevelUpdate = useCallback((levelIndex: number, updates: Partial<EditableDomainLevel>) => {
    setDomain(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) =>
        i === levelIndex ? { ...level, ...updates } : level
      ),
    }));
  }, []);

  // Add node from search
  const handleAddNodeFromSearch = useCallback((result: SearchNodeResult) => {
    const nodeType = getNodeTypeFromLabels(result.labels);
    const node = searchResultToEditableNode(result, nodeType);

    setDomain(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => {
        if (i !== selectedLevelIndex) return level;

        const key = getNodeArrayKey(nodeType);
        return {
          ...level,
          [key]: [...level[key], node],
        };
      }),
    }));

    setIsSearchPanelOpen(false);
  }, [selectedLevelIndex]);

  // Add new node from modal - creates node in database immediately
  const handleAddNewNode = useCallback(async (
    name: string,
    description: string,
    type: NodeType,
    typeSpecificProps: {
      howToLearn?: string;
      howToDevelop?: string;
      measurementCriteria?: string;
      howToAchieve?: string;
    }
  ) => {
    // Build properties for API call (snake_case for backend)
    const properties: Record<string, unknown> = {
      name,
      description,
    };

    // Add type-specific properties
    if (type === 'knowledge' && typeSpecificProps.howToLearn) {
      properties.how_to_learn = typeSpecificProps.howToLearn;
    } else if (type === 'skill' && typeSpecificProps.howToDevelop) {
      properties.how_to_develop = typeSpecificProps.howToDevelop;
    } else if (type === 'trait' && typeSpecificProps.measurementCriteria) {
      properties.measurement_criteria = typeSpecificProps.measurementCriteria;
    } else if (type === 'milestone' && typeSpecificProps.howToAchieve) {
      properties.how_to_achieve = typeSpecificProps.howToAchieve;
    }

    // Map NodeType to Neo4j label
    const labelMap: Record<NodeType, string> = {
      knowledge: 'Knowledge',
      skill: 'Skill',
      trait: 'Trait',
      milestone: 'Milestone',
    };

    // Create node in database
    const result = await httpService.createNode([labelMap[type]], properties);

    if (!result.success || !result.node) {
      setSaveError(result.error || 'Failed to create node');
      return;
    }

    // Create EditableNode with elementId from API response
    const node = createNewNode(type, name, description, result.node.elementId);
    // Add type-specific props to node
    node.howToLearn = typeSpecificProps.howToLearn;
    node.howToDevelop = typeSpecificProps.howToDevelop;
    node.measurementCriteria = typeSpecificProps.measurementCriteria;
    node.howToAchieve = typeSpecificProps.howToAchieve;

    setDomain(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => {
        if (i !== selectedLevelIndex) return level;

        const key = getNodeArrayKey(type);
        return {
          ...level,
          [key]: [...level[key], node],
        };
      }),
    }));

    setIsNodeModalOpen(false);
  }, [selectedLevelIndex]);

  // Remove node from level
  const handleRemoveNode = useCallback((nodeId: string, type: NodeType) => {
    setDomain(prev => {
      const key = getNodeArrayKey(type);
      const nodeToRemove = prev.levels[selectedLevelIndex][key].find(n => n.id === nodeId);

      // Track removed nodes with elementId for edit mode (to delete user progress)
      if (nodeToRemove?.elementId) {
        setRemovedNodeElementIds(ids => [...ids, nodeToRemove.elementId!]);
      }

      return {
        ...prev,
        levels: prev.levels.map((level, i) => {
          if (i !== selectedLevelIndex) return level;

          return {
            ...level,
            [key]: level[key].filter(n => n.id !== nodeId),
          };
        }),
      };
    });

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedLevelIndex, selectedNode]);

  // Update node requirement
  const handleUpdateNodeRequirement = useCallback((
    nodeId: string,
    type: NodeType,
    requirement: Partial<EditableNode>
  ) => {
    setDomain(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => {
        if (i !== selectedLevelIndex) return level;

        const key = getNodeArrayKey(type);
        return {
          ...level,
          [key]: level[key].map(n =>
            n.id === nodeId ? { ...n, ...requirement } : n
          ),
        };
      }),
    }));

    // Update selected node if it's the one being edited
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, ...requirement } : null);
    }
  }, [selectedLevelIndex, selectedNode]);

  // Open add node panel
  const handleOpenAddNode = useCallback((type: NodeType) => {
    setNodeTypeToAdd(type);
    setIsSearchPanelOpen(true);
  }, []);

  // Select node
  const handleSelectNode = useCallback((node: EditableNode | null) => {
    setSelectedNode(node);
  }, []);

  // Validate domain
  const validateDomain = useCallback((): string[] => {
    const errors: string[] = [];

    if (!domain.name.trim()) {
      errors.push("Domain name is required");
    }

    if (!domain.description.trim()) {
      errors.push("Domain description is required");
    }

    domain.levels.forEach((level, i) => {
      const totalNodes = level.knowledge.length + level.skills.length +
        level.traits.length + level.milestones.length;

      if (totalNodes === 0) {
        errors.push(`Level ${i + 1} (${level.name}) needs at least one requirement`);
      }
    });

    return errors;
  }, [domain]);

  // Convert domain to API request format for create
  const domainToCreateRequest = useCallback((): CreateDomainRequest => {
    return {
      domain: {
        name: capitalizeFirstLetter(domain.name.trim()),
        description: domain.description.trim(),
      },
      levels: domain.levels.map(level => ({
        level: level.level,
        name: level.name,
        description: level.description || undefined,
        points_required: level.pointsRequired,
        requirements: {
          knowledge: level.knowledge.map(n => ({
            nodeElementId: n.elementId,
            bloom_level: n.bloomLevel || 'Remember',
          })),
          skills: level.skills.map(n => ({
            nodeElementId: n.elementId,
            dreyfus_level: n.dreyfusLevel || 'Novice',
          })),
          traits: level.traits.map(n => ({
            nodeElementId: n.elementId,
            min_score: n.minScore || 50,
          })),
          milestones: level.milestones.map(n => ({
            nodeElementId: n.elementId,
          })),
        },
      })),
    };
  }, [domain]);

  // Convert domain to API request format for update
  const domainToUpdateRequest = useCallback((): UpdateDomainRequest => {
    return {
      domainElementId: domain.elementId!,
      domain: {
        name: capitalizeFirstLetter(domain.name.trim()),
        description: domain.description.trim(),
      },
      levels: domain.levels.map(level => ({
        level: level.level,
        name: level.name,
        description: level.description || undefined,
        points_required: level.pointsRequired,
        requirements: {
          knowledge: level.knowledge.map(n => ({
            nodeElementId: n.elementId,
            bloom_level: n.bloomLevel || 'Remember',
          })),
          skills: level.skills.map(n => ({
            nodeElementId: n.elementId,
            dreyfus_level: n.dreyfusLevel || 'Novice',
          })),
          traits: level.traits.map(n => ({
            nodeElementId: n.elementId,
            min_score: n.minScore || 50,
          })),
          milestones: level.milestones.map(n => ({
            nodeElementId: n.elementId,
          })),
        },
      })),
      removedNodeElementIds,
    };
  }, [domain, removedNodeElementIds]);

  // Save domain
  const handleSave = useCallback(async () => {
    const errors = validateDomain();
    if (errors.length > 0) {
      setSaveError(errors.join(". "));
      return;
    }

    setSaving(true);
    setSaveError(null);

    if (isEditMode && domain.elementId) {
      // Edit mode: update existing domain
      const request = domainToUpdateRequest();
      const result = await httpService.updateDomain(request);

      if (result.success && result.domain) {
        navigate(`/Domain/${encodeURIComponent(result.domain.name)}`);
      } else {
        setSaveError(result.error || "Failed to update domain");
      }
    } else {
      // Create mode: validate name and create new domain
      const validation = await httpService.validateDomainName(capitalizeFirstLetter(domain.name));
      if (!validation) {
        setSaveError("Failed to validate domain name");
        setSaving(false);
        return;
      }

      if (!validation.available) {
        setSaveError("A domain with this name already exists");
        setSaving(false);
        return;
      }

      const request = domainToCreateRequest();
      const result = await httpService.createDomain(request);

      if (result.success && result.domain) {
        navigate(`/Domain/${encodeURIComponent(result.domain.name)}`);
      } else {
        setSaveError(result.error || "Failed to create domain");
      }
    }

    setSaving(false);
  }, [domain.name, domain.elementId, isEditMode, validateDomain, domainToCreateRequest, domainToUpdateRequest, navigate]);

  // Count total nodes
  const totalNodeCount = useMemo(() => {
    return domain.levels.reduce((total, level) => {
      return total + level.knowledge.length + level.skills.length +
        level.traits.length + level.milestones.length;
    }, 0);
  }, [domain.levels]);

  // Redirect if not logged in
  if (!loggedIn) {
    return (
      <>
        <NavBar />
        <div className="in-nav-container">
          <div className="domain-creator-login-required">
            <h2>Login Required</h2>
            <p>You must be logged in to {isEditMode ? 'edit' : 'create'} a domain.</p>
            <button onClick={() => navigate("/Login")} className="btn-cosmic">
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  // Loading state for edit mode
  if (isLoadingDomain) {
    return (
      <>
        <NavBar />
        <div className="in-nav-container">
          <div className="domain-creator-loading">
            <div className="loading-spinner"></div>
            <p>Loading domain...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        <div className="domain-creator">
          {/* Header */}
          <div className="domain-creator-header">
            <button className="back-btn" onClick={() => navigate("/Domain")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="domain-creator-title">
              <input
                type="text"
                className="domain-name-input"
                placeholder="Enter domain name..."
                value={domain.name}
                onChange={(e) => handleDomainNameChange(e.target.value)}
              />
              {!isDomainAvailable && (
                <div className="domain-name-error">
                  Domain is already taken!
                </div>
              )}
            </div>
            <button
              className="save-btn btn-cosmic"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : isEditMode ? "Update Domain" : "Save Domain"}
            </button>
          </div>

          {/* Description */}
          <div className="domain-description-row">
            <textarea
              className="domain-description-input"
              placeholder="Enter domain description..."
              value={domain.description}
              onChange={(e) => handleDomainDescriptionChange(e.target.value)}
              rows={2}
            />
          </div>

          {/* Error message */}
          {saveError && (
            <div className="domain-creator-error">
              {saveError}
            </div>
          )}

          {/* Level tabs */}
          <div className="level-tabs">
            {domain.levels.map((level, index) => (
              <button
                key={level.id}
                className={`level-tab ${index === selectedLevelIndex ? 'active' : ''}`}
                onClick={() => setSelectedLevelIndex(index)}
              >
                <span className="level-number">{level.level}</span>
                <span className="level-name">{level.name}</span>
              </button>
            ))}
            <button
              className="level-config-btn"
              onClick={() => setIsLevelConfigOpen(true)}
              title="Configure level"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          {/* Main content area */}
          <div className="domain-creator-content">
            {/* Canvas area */}
            <div className="creator-canvas-area">
              <CreatorCanvas
                level={currentLevel}
                selectedNode={selectedNode}
                onSelectNode={handleSelectNode}
                onOpenAddNode={handleOpenAddNode}
                onRemoveNode={handleRemoveNode}
              />
            </div>

            {/* Stats bar */}
            <div className="creator-stats-bar">
              <span>Level {currentLevel.level}: {currentLevel.name}</span>
              <span>|</span>
              <span>{currentLevel.pointsRequired} pts required</span>
              <span>|</span>
              <span>
                {currentLevel.knowledge.length} knowledge,{" "}
                {currentLevel.skills.length} skills,{" "}
                {currentLevel.traits.length} traits,{" "}
                {currentLevel.milestones.length} milestones
              </span>
              <span>|</span>
              <span>Total: {totalNodeCount} nodes across all levels</span>
            </div>
          </div>

          {/* Node search panel */}
          {isSearchPanelOpen && (
            <NodeSearchPanel
              onClose={() => setIsSearchPanelOpen(false)}
              onSelectNode={handleAddNodeFromSearch}
              onCreateNew={() => {
                setIsSearchPanelOpen(false);
                setIsNodeModalOpen(true);
              }}
              filterType={nodeTypeToAdd}
            />
          )}

          {/* Node creation modal */}
          {isNodeModalOpen && (
            <NodeCreationModal
              onClose={() => setIsNodeModalOpen(false)}
              onSave={handleAddNewNode}
              initialType={nodeTypeToAdd}
            />
          )}

          {/* Level config panel */}
          {isLevelConfigOpen && (
            <LevelConfigPanel
              level={currentLevel}
              onClose={() => setIsLevelConfigOpen(false)}
              onUpdate={(updates) => handleLevelUpdate(selectedLevelIndex, updates)}
            />
          )}

          {/* Requirement editor */}
          {selectedNode && (
            <RequirementEditor
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={(requirement) => handleUpdateNodeRequirement(
                selectedNode.id,
                selectedNode.type,
                requirement
              )}
              onRemove={() => handleRemoveNode(selectedNode.id, selectedNode.type)}
            />
          )}
        </div>
      </div>
    </>
  );
}

// Helper to get node type from Neo4j labels
function getNodeTypeFromLabels(labels: string[]): NodeType {
  if (labels.includes('Knowledge')) return 'knowledge';
  if (labels.includes('Skill')) return 'skill';
  if (labels.includes('Trait')) return 'trait';
  if (labels.includes('Milestone')) return 'milestone';
  return 'knowledge';
}

// Helper to get the array key for a node type
function getNodeArrayKey(type: NodeType): 'knowledge' | 'skills' | 'traits' | 'milestones' {
  switch (type) {
    case 'knowledge': return 'knowledge';
    case 'skill': return 'skills';
    case 'trait': return 'traits';
    case 'milestone': return 'milestones';
  }
}

//helper to cap first letter and lowercase rest
function capitalizeFirstLetter(string: string) {
  if (string.length === 0) {
    return "";
  }
  // Get the first character and convert it to uppercase
  const firstLetter = string.charAt(0).toUpperCase();
  // Get the rest of the string starting from the second character
  const restOfString = string.slice(1).toLowerCase();
  // Combine them
  return (firstLetter + restOfString).trim();
}
