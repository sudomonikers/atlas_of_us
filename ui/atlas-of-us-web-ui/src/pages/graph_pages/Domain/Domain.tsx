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
import { BLOOM_LEVELS, DREYFUS_LEVELS } from "./SkillTree/skill-tree-constants";
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

  // Build a map of user's progress for each node (elementId -> relationship)
  const userProgressMap = useMemo(() => {
    const map = new Map<string, Neo4jRelationship>();
    if (!loggedIn || !profileData?.relationships) return map;

    const completionTypes = ['HAS_KNOWLEDGE', 'HAS_SKILL', 'HAS_TRAIT', 'ACHIEVED'];
    profileData.relationships
      .filter((r: Neo4jRelationship) => completionTypes.includes(r.Type))
      .forEach((r: Neo4jRelationship) => map.set(r.EndElementId, r));

    return map;
  }, [loggedIn, profileData?.relationships]);

  // Check if a node's requirement is met
  const isNodeRequirementMet = useCallback((node: CanvasNode | null): boolean => {
    if (!node?.elementId) return false;
    const rel = userProgressMap.get(node.elementId);
    if (!rel) return false;

    if (node.type === 'knowledge') {
      if (!node.requirement?.bloomLevel) return true;
      const userLevel = rel.Props?.bloom_level as string | undefined;
      if (!userLevel) return false;
      return BLOOM_LEVELS.indexOf(userLevel as typeof BLOOM_LEVELS[number]) >=
             BLOOM_LEVELS.indexOf(node.requirement.bloomLevel as typeof BLOOM_LEVELS[number]);
    }

    if (node.type === 'skill') {
      if (!node.requirement?.dreyfusLevel) return true;
      const userLevel = rel.Props?.dreyfus_level as string | undefined;
      if (!userLevel) return false;
      return DREYFUS_LEVELS.indexOf(userLevel as typeof DREYFUS_LEVELS[number]) >=
             DREYFUS_LEVELS.indexOf(node.requirement.dreyfusLevel as typeof DREYFUS_LEVELS[number]);
    }

    if (node.type === 'trait') {
      const minScore = node.requirement?.minScore;
      if (minScore === undefined) return true;
      const userScore = rel.Props?.score as number | undefined;
      if (userScore === undefined) return false;
      return userScore >= minScore;
    }

    return true; // milestones just need the relationship
  }, [userProgressMap]);

  // Refresh profile data
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
  const handleMarkComplete = useCallback(async (node: CanvasNode, levelOrScore: string | number) => {
    if (!loggedIn || !profileData?.nodeRoot?.ElementId || !node.elementId) return;

    const httpService = new HttpService();
    const properties: Record<string, string | number> = {};

    if (node.type === 'knowledge') properties.bloom_level = levelOrScore as string;
    else if (node.type === 'skill') properties.dreyfus_level = levelOrScore as string;
    else if (node.type === 'trait') properties.score = levelOrScore as number;
    else if (node.type === 'milestone') properties.date = new Date().toISOString().split('T')[0];

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

  // Handle removing progress
  const handleRemoveProgress = useCallback(async (relationshipElementId: string) => {
    if (!loggedIn) return;
    const httpService = new HttpService();
    const result = await httpService.deleteUserProgress(relationshipElementId);
    if (result.success) {
      await refreshProfileData();
    }
  }, [loggedIn, refreshProfileData]);

  // Fetch domain data
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
                <button type="submit" className="domain-search-btn" disabled={!searchTerm.trim()}>
                  Explore
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Get the relationship for the selected node
  const selectedRelationship = selectedNode?.elementId ? userProgressMap.get(selectedNode.elementId) : undefined;

  return (
    <>
      <NavBar />
      <div className="in-nav-container">
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
            <span className="domain-title">{domainData?.name || domainName}</span>
            {domainData?.description && (
              <svg className="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>
          {loggedIn && domainData && (
            <button
              className="domain-edit-btn"
              onClick={() => navigate(`/DomainCreator/${encodeURIComponent(domainData.name)}`)}
              title="Edit domain"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {showDescription && domainData?.description && (
            <div className="domain-description-dropdown">
              <p>{domainData.description}</p>
            </div>
          )}
        </div>

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
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
              userProgressMap={new Map(Array.from(userProgressMap).map(([k, v]) => [k, v.Props]))}
            />
          )}
        </div>

        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          isCompleted={isNodeRequirementMet(selectedNode)}
          relationshipElementId={selectedRelationship?.ElementId}
          userScore={selectedRelationship?.Props?.score as number | undefined}
          userBloomLevel={selectedRelationship?.Props?.bloom_level as string | undefined}
          userDreyfusLevel={selectedRelationship?.Props?.dreyfus_level as string | undefined}
          userDate={selectedRelationship?.Props?.date as string | undefined}
          onMarkComplete={handleMarkComplete}
          onRemoveProgress={handleRemoveProgress}
          isLoggedIn={loggedIn}
        />
      </div>
    </>
  );
}
