import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { NavBar } from "../../common-components/navbar/nav";
import { HttpService } from "../../services/http-service";
import type { DomainData } from "./domain-interfaces";
import { SkillTreeCanvas } from "./SkillTree/SkillTreeCanvas";
import { NodeDetailPanel } from "./NodeDetailPanel/NodeDetailPanel";
import type { CanvasNode } from "./SkillTree/skill-tree-types";
import "./Domain.css";

export function Domain() {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [showDescription, setShowDescription] = useState(false);

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
            />
          )}
        </div>

        {/* Side panel */}
        <NodeDetailPanel node={selectedNode} onClose={handlePanelClose} />
      </div>
    </>
  );
}
