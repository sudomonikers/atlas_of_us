import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { NavBar } from "../../../common-components/navbar/nav";
import { HttpService } from "../../../services/http-service";
import { useGlobal } from "../../../GlobalProvider";
import type { DomainData } from "./domain-interfaces";
import type { Neo4jRelationship } from "../Graph/graph-interfaces.interface";
import { SkillTreeCanvas } from "./SkillTree/SkillTreeCanvas";
import { NodeDetailPanel } from "./NodeDetailPanel/NodeDetailPanel";
import type { CanvasNode } from "./SkillTree/skill-tree-types";
import "./Domain.css";

export function Domain() {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { loggedIn, profileData, setProfileData } = useGlobal();
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [showDescription, setShowDescription] = useState(false);

  // Compute completed node IDs from user's profile relationships
  const completedNodeIds = useMemo(() => {
    if (!loggedIn || !profileData?.relationships) return new Set<string>();

    const completionTypes = ['HAS_KNOWLEDGE', 'HAS_SKILL', 'HAS_TRAIT', 'ACHIEVED'];
    return new Set(
      profileData.relationships
        .filter((r: Neo4jRelationship) => completionTypes.includes(r.Type))
        .map((r: Neo4jRelationship) => r.EndElementId)
    );
  }, [loggedIn, profileData?.relationships]);

  // Get user's relationship for a specific node
  const getUserRelationshipForNode = useCallback((nodeElementId?: string): Neo4jRelationship | null => {
    if (!loggedIn || !profileData?.relationships || !nodeElementId) return null;

    const completionTypes = ['HAS_KNOWLEDGE', 'HAS_SKILL', 'HAS_TRAIT', 'ACHIEVED'];
    return profileData.relationships.find(
      (r: Neo4jRelationship) => r.EndElementId === nodeElementId && completionTypes.includes(r.Type)
    ) || null;
  }, [loggedIn, profileData?.relationships]);

  // Refresh profile data to get updated relationships
  const refreshProfileData = useCallback(async () => {
    if (!loggedIn || !profileData?.nodeRoot?.Props?.username) return;

    const httpService = new HttpService();
    const data = await httpService.fetchNodes(
      `secure/profile/user-profile/${profileData.nodeRoot.Props.username}`
    );
    if (data?.nodeRoot) {
      setProfileData(data);
    }
  }, [loggedIn, profileData?.nodeRoot?.Props?.username, setProfileData]);

  // Handle marking a node as complete
  const handleMarkComplete = useCallback(async (
    node: CanvasNode,
    levelOrScore: string | number
  ) => {
    if (!loggedIn || !profileData?.nodeRoot?.ElementId || !node.elementId) return;

    const httpService = new HttpService();
    const properties: Record<string, string | number> = {};

    if (node.type === 'knowledge') {
      properties.bloom_level = levelOrScore as string;
    } else if (node.type === 'skill') {
      properties.dreyfus_level = levelOrScore as string;
    } else if (node.type === 'trait') {
      properties.score = levelOrScore as number;
    } else if (node.type === 'milestone') {
      properties.date = new Date().toISOString().split('T')[0];
    }

    const result = await httpService.createUserProgress(
      profileData.nodeRoot.ElementId,
      node.elementId,
      node.type as 'knowledge' | 'skill' | 'trait' | 'milestone',
      properties
    );

    if (result.success) {
      await refreshProfileData();
    }
  }, [loggedIn, profileData?.nodeRoot?.ElementId, refreshProfileData]);

  // Handle removing progress from a node
  const handleRemoveProgress = useCallback(async (relationshipElementId: string) => {
    if (!loggedIn) return;

    const httpService = new HttpService();
    const result = await httpService.deleteUserProgress(relationshipElementId);

    if (result.success) {
      await refreshProfileData();
    }
  }, [loggedIn, refreshProfileData]);

  useEffect(() => {
    if (!domainName) {
      setIsLoading(false);
      return;
    }

    const fetchDomain = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedNode(null);

      const httpService = new HttpService();
      const data = await httpService.fetchDomain(domainName);

      if (data) {
        setDomainData(data);
      } else {
        setError("Failed to fetch domain data");
      }

      setIsLoading(false);
    };

    fetchDomain();
  }, [domainName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/Domain/${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleNodeSelect = (node: CanvasNode | null) => {
    console.log(node)
    setSelectedNode(node);
  };

  const handlePanelClose = () => {
    setSelectedNode(null);
  };

  // Show search box when no domain is specified
  if (!domainName) {
    return (
      <>
        <NavBar />
        <div className="in-nav-container">
          <div className="domain-search-page">
            <div className="domain-search-content">
              <h1 className="domain-search-title">Explore Domains</h1>
              <p className="domain-search-subtitle">
                Search for a domain to explore its skill tree and progression paths
              </p>
              <form className="domain-search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="domain-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter domain name (e.g., Chess, Programming)"
                  autoFocus
                />
                <button
                  type="submit"
                  className="domain-search-btn"
                  disabled={!searchTerm.trim()}
                >
                  Explore
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
        {/* Floating title overlay */}
        <div className="domain-title-overlay">
          <button className="domain-back-btn" onClick={() => navigate("/Domain")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className={`domain-title-btn ${showDescription ? 'expanded' : ''}`}
            onClick={() => setShowDescription(!showDescription)}
          >
            <span className="domain-title">{domainData?.domain.name || domainName}</span>
            {domainData?.domain.description && (
              <svg className="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>
          {showDescription && domainData?.domain.description && (
            <div className="domain-description-dropdown">
              <p>{domainData.domain.description as string}</p>
            </div>
          )}
        </div>

        {/* Full-screen canvas */}
        <div className="domain-canvas-wrapper">
          {isLoading && (
            <div className="domain-loading">
              <div className="loading-spinner"></div>
              <p>Loading skill tree...</p>
            </div>
          )}

          {error && (
            <div className="domain-error">
              <p>{error}</p>
              <button onClick={() => navigate("/Domain")}>Try another domain</button>
            </div>
          )}

          {domainData && !isLoading && (
            <SkillTreeCanvas
              domainData={domainData}
              onNodeSelect={handleNodeSelect}
              selectedNode={selectedNode}
              completedNodeIds={completedNodeIds}
            />
          )}
        </div>

        {/* Side panel */}
        <NodeDetailPanel
          node={selectedNode}
          onClose={handlePanelClose}
          isCompleted={selectedNode ? completedNodeIds.has(selectedNode.elementId || '') : false}
          userRelationship={getUserRelationshipForNode(selectedNode?.elementId)}
          onMarkComplete={handleMarkComplete}
          onRemoveProgress={handleRemoveProgress}
          isLoggedIn={loggedIn}
        />
      </div>
    </>
  );
}
