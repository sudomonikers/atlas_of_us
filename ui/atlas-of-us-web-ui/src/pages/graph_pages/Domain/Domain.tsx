import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { NavBar } from "../../../common-components/navbar/nav";
import { getHttpService } from "../../../services/http-service";
import { useGlobal } from "../../../GlobalProvider";
import type { DomainData, GeneralizationMap, GeneralizationSource } from "./domain-interfaces";
import type { Neo4jRelationship, Neo4jNode } from "../Graph/graph-interfaces.interface";
import { NodeTreeCanvas } from "./NodeTree/NodeTreeCanvas";
import { NodeDetailPanel } from "./NodeDetailPanel/NodeDetailPanel";
import type { CanvasNode } from "./NodeTree/node-tree-types";
import { isNodeRequirementMet, type UserProgressMap } from "./NodeTree/node-tree-utils";
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

  // Build maps for user progress (Props for canvas, ElementIds for deletion)
  const { userProgressMap, relationshipIdMap } = useMemo(() => {
    const propsMap: UserProgressMap = new Map();
    const idMap = new Map<string, string>();
    if (!loggedIn || !profileData?.relationships) return { userProgressMap: propsMap, relationshipIdMap: idMap };

    const completionTypes = ['HAS_KNOWLEDGE', 'HAS_SKILL', 'HAS_TRAIT', 'ACHIEVED'];
    profileData.relationships
      .filter((r: Neo4jRelationship) => completionTypes.includes(r.Type))
      .forEach((r: Neo4jRelationship) => {
        propsMap.set(r.EndElementId, r.Props || {});
        idMap.set(r.EndElementId, r.ElementId);
      });

    return { userProgressMap: propsMap, relationshipIdMap: idMap };
  }, [loggedIn, profileData?.relationships]);

  // Build generalizationMap by matching user's skills/knowledge with domain's via GENERALIZES_TO
  const generalizationMap = useMemo(() => {
    const map: GeneralizationMap = new Map();
    if (!loggedIn || !profileData?.affiliates || !domainData) return map;

    // 1. Build a map of user's generalizations: generalNodeElementId -> user's skill/knowledge info
    const userGeneralizations = new Map<string, { nodeName: string; nodeElementId: string }>();

    profileData.affiliates.forEach((node: Neo4jNode) => {
      if (node.GeneralizesToElementId) {
        userGeneralizations.set(node.GeneralizesToElementId, {
          nodeName: node.Props?.name || 'Unknown',
          nodeElementId: node.ElementId
        });
      }
    });

    // 2. For each skill/knowledge in the domain, check if user has matching generalization
    domainData.levels?.forEach(level => {
      [...(level.skills || []), ...(level.knowledge || [])].forEach(item => {
        if (item.generalizesTo) {
          const userMatch = userGeneralizations.get(item.generalizesTo.elementId);
          // Only include if user has a DIFFERENT skill/knowledge that shares the same general node
          if (userMatch && userMatch.nodeElementId !== item.elementId) {
            const sources = map.get(item.elementId) || [];
            // Avoid duplicates
            if (!sources.some(s => s.nodeElementId === item.generalizesTo.elementId)) {
              sources.push({
                nodeElementId: item.generalizesTo.elementId,
                nodeName: item.generalizesTo.name
              });
              map.set(item.elementId, sources);
            }
          }
        }
      });
    });

    return map;
  }, [loggedIn, profileData?.affiliates, domainData]);

  // Refresh profile data
  const refreshProfileData = useCallback(async () => {
    if (!loggedIn || !profileData?.nodeRoot?.Props?.username) return;
    const httpService = getHttpService();
    const data = await httpService.fetchNodes(
      `secure/profile/user-profile/${profileData.nodeRoot.Props.username}`
    );
    if (data?.nodeRoot) {
      setProfileData(data);
    }
  }, [loggedIn, profileData?.nodeRoot?.Props?.username, setProfileData]);

  // Handle marking a node as complete
  const handleMarkComplete = useCallback(async (node: CanvasNode, levelOrScore: string | number, proofUrl?: string) => {
    if (!loggedIn || !profileData?.nodeRoot?.ElementId || !node.elementId) return;

    const httpService = getHttpService();
    const properties: Record<string, string | number> = {};

    if (node.type === 'knowledge') properties.bloom_level = levelOrScore as string;
    else if (node.type === 'skill') properties.dreyfus_level = levelOrScore as string;
    else if (node.type === 'trait') properties.score = levelOrScore as number;
    else if (node.type === 'milestone') properties.date = new Date().toISOString().split('T')[0];

    // Add proof URL if provided
    if (proofUrl) {
      (properties as Record<string, string | number>).proof_url = proofUrl;
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

  // Handle removing progress
  const handleRemoveProgress = useCallback(async (relationshipElementId: string) => {
    if (!loggedIn) return;
    const httpService = getHttpService();
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

      const httpService = getHttpService();
      const data = await httpService.fetchDomain(domainName);

      if (data) {
        setDomainData(data);
        setIsLoading(false);
      } else {
        // Domain not found - redirect to DomainGenerator
        navigate(`/DomainGenerator/${encodeURIComponent(domainName)}`);
      }
    };

    fetchDomain();
  }, [domainName, navigate]);

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
                Search for a domain to explore its node tree and progression paths
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

  // Get the progress data for the selected node
  const selectedProgress = selectedNode?.elementId ? userProgressMap.get(selectedNode.elementId) : undefined;
  const selectedRelationshipId = selectedNode?.elementId ? relationshipIdMap.get(selectedNode.elementId) : undefined;
  const selectedGeneralizationSources = selectedNode?.elementId ? generalizationMap.get(selectedNode.elementId) : undefined;

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
              <p>Loading node tree...</p>
            </div>
          )}

          {error && (
            <div className="domain-error">
              <p>{error}</p>
              <button onClick={() => navigate("/Domain")}>Try another domain</button>
            </div>
          )}

          {domainData && !isLoading && (
            <NodeTreeCanvas
              domainData={domainData}
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
              userProgressMap={userProgressMap}
              generalizationMap={generalizationMap}
            />
          )}
        </div>

        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          isCompleted={selectedNode ? isNodeRequirementMet(selectedNode, userProgressMap) : false}
          relationshipElementId={selectedRelationshipId}
          userScore={selectedProgress?.score as number | undefined}
          userBloomLevel={selectedProgress?.bloom_level as string | undefined}
          userDreyfusLevel={selectedProgress?.dreyfus_level as string | undefined}
          userDate={selectedProgress?.date as string | undefined}
          userProofUrl={selectedProgress?.proof_url as string | undefined}
          onMarkComplete={handleMarkComplete}
          onRemoveProgress={handleRemoveProgress}
          isLoggedIn={loggedIn}
          generalizationSources={selectedGeneralizationSources}
        />
      </div>
    </>
  );
}
