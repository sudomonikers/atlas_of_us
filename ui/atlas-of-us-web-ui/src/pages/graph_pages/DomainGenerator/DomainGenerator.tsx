import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { NavBar } from "../../../common-components/navbar/nav";
import { useGlobal } from "../../../GlobalProvider";
import {
  getHttpService,
  type SimilarDomainResult,
  type DomainGenerationEvent,
} from "../../../services/http-service";
import "./DomainGenerator.css";

type PageState = "loading" | "similar_domains" | "form" | "generating" | "completed" | "error";

const AGENT_NAMES: Record<string, string> = {
  domain_architect: "Domain Architect",
  knowledge_generator: "Knowledge Generator",
  skill_generator: "Skill Generator",
  trait_generator: "Trait Generator",
  milestone_generator: "Milestone Generator",
  relationship_mapper: "Relationship Mapper",
};

export function DomainGenerator() {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { loggedIn } = useGlobal();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [similarDomains, setSimilarDomains] = useState<SimilarDomainResult[]>([]);
  const [description, setDescription] = useState("");
  const [generationEvents, setGenerationEvents] = useState<DomainGenerationEvent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [completedAgents, setCompletedAgents] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<DomainGenerationEvent["statistics"] | null>(null);

  const abortRef = useRef<(() => void) | null>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);

  // Fetch similar domains on mount
  useEffect(() => {
    if (!domainName) {
      navigate("/Domain");
      return;
    }

    fetchSimilarDomains();

    return () => {
      if (abortRef.current) {
        abortRef.current();
      }
    };
  }, [domainName]);

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [generationEvents]);

  const fetchSimilarDomains = async () => {
    setPageState("loading");
    const httpService = getHttpService();
    const results = await httpService.findSimilarDomains(domainName!, 5);

    if (results && results.length > 0) {
      const relevant = results.filter((d) => d.score > 0.5);
      if (relevant.length > 0) {
        setSimilarDomains(relevant);
        setPageState("similar_domains");
        return;
      }
    }

    setPageState("form");
  };

  const handleSelectDomain = (domain: SimilarDomainResult) => {
    navigate(`/Domain/${encodeURIComponent(domain.name)}`);
  };

  const handleProceedToForm = () => {
    setPageState("form");
  };

  const handleStartGeneration = () => {
    if (!description.trim()) {
      setError("Please provide a description for the domain");
      return;
    }

    setPageState("generating");
    setGenerationEvents([]);
    setError(null);
    setCurrentAgent(null);
    setCompletedAgents(0);
    setStatistics(null);

    const httpService = getHttpService();
    abortRef.current = httpService.generateDomain(
      domainName!,
      description,
      (event) => {
        setGenerationEvents((prev) => [...prev, event]);

        if (event.type === "agent_started") {
          setCurrentAgent(event.agent || null);
        }

        if (event.type === "agent_completed") {
          setCompletedAgents((prev) => prev + 1);
        }

        if (event.type === "completed") {
          setStatistics(event.statistics || null);
          setPageState("completed");
        }

        if (event.type === "failed") {
          setError(event.error || "Generation failed");
          setPageState("error");
        }
      },
      (err) => {
        setError(err);
        setPageState("error");
      },
      () => {
        abortRef.current = null;
      }
    );
  };

  const handleCancelGeneration = () => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setPageState("form");
  };

  const handleGoToCreator = () => {
    navigate(`/DomainCreator/${encodeURIComponent(domainName!)}`);
  };

  if (!loggedIn) {
    return (
      <>
        <NavBar />
        <div className="in-nav-container">
          <div className="domain-generator">
            <div className="generator-content">
              <h1>Login Required</h1>
              <p className="generator-subtitle">You must be logged in to generate a domain.</p>
              <button onClick={() => navigate("/Login")} className="btn-cosmic">
                Go to Login
              </button>
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
        <div className="domain-generator">
          {pageState === "loading" && <LoadingState />}

          {pageState === "similar_domains" && (
            <SimilarDomainsState
              domainName={domainName!}
              similarDomains={similarDomains}
              onSelectDomain={handleSelectDomain}
              onProceed={handleProceedToForm}
            />
          )}

          {pageState === "form" && (
            <FormState
              domainName={domainName!}
              description={description}
              onDescriptionChange={setDescription}
              onGenerate={handleStartGeneration}
              onBack={() => navigate("/Domain")}
              error={error}
            />
          )}

          {pageState === "generating" && (
            <GeneratingState
              domainName={domainName!}
              currentAgent={currentAgent}
              completedAgents={completedAgents}
              events={generationEvents}
              eventLogRef={eventLogRef}
              onCancel={handleCancelGeneration}
            />
          )}

          {pageState === "completed" && (
            <CompletedState
              domainName={domainName!}
              statistics={statistics}
              onGoToCreator={handleGoToCreator}
            />
          )}

          {pageState === "error" && (
            <ErrorState
              error={error}
              onRetry={() => setPageState("form")}
              onBack={() => navigate("/Domain")}
            />
          )}
        </div>
      </div>
    </>
  );
}

function LoadingState() {
  return (
    <div className="generator-content">
      <div className="loading-spinner"></div>
      <p className="generator-subtitle">Looking for similar domains...</p>
    </div>
  );
}

function SimilarDomainsState({
  domainName,
  similarDomains,
  onSelectDomain,
  onProceed,
}: {
  domainName: string;
  similarDomains: SimilarDomainResult[];
  onSelectDomain: (domain: SimilarDomainResult) => void;
  onProceed: () => void;
}) {
  return (
    <div className="generator-content">
      <h1>Domain Not Found</h1>
      <p className="generator-subtitle">
        We couldn't find a domain called "<strong>{domainName}</strong>", but we found some similar ones.
        Were you looking for one of these?
      </p>

      <div className="similar-domains-list">
        {similarDomains.map((domain) => (
          <button
            key={domain.id}
            className="similar-domain-item"
            onClick={() => onSelectDomain(domain)}
          >
            <div className="similar-domain-info">
              <span className="similar-domain-name">{domain.name}</span>
              {domain.description && (
                <span className="similar-domain-desc">{domain.description}</span>
              )}
            </div>
            <span className="similar-domain-score">{Math.round(domain.score * 100)}% match</span>
          </button>
        ))}
      </div>

      <div className="similar-domains-actions">
        <button className="btn-glass" onClick={onProceed}>
          None of these - Create "{domainName}"
        </button>
      </div>
    </div>
  );
}

function FormState({
  domainName,
  description,
  onDescriptionChange,
  onGenerate,
  onBack,
  error,
}: {
  domainName: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  error: string | null;
}) {
  return (
    <div className="generator-content">
      <h1>Generate New Domain</h1>
      <p className="generator-subtitle">
        Create an AI-generated domain structure for "<strong>{domainName}</strong>"
      </p>

      <div className="generator-explanation">
        <h3 className="explanation-title">What happens when you generate a domain?</h3>
        <ul className="explanation-list">
          <li>Our AI will analyze your domain and create a structured learning path</li>
          <li>It generates 5 progression levels from beginner to expert</li>
          <li>Each level includes relevant knowledge, skills, traits, and milestones</li>
          <li>The AI reuses existing nodes when possible to connect your domain to others</li>
          <li>After generation, you can review and edit everything in the Domain Creator</li>
        </ul>
        <p className="explanation-note">
          Generation typically takes 1-3 minutes depending on domain complexity.
        </p>
      </div>

      <form className="generator-form" onSubmit={(e) => { e.preventDefault(); onGenerate(); }}>
        <div className="form-group">
          <label className="form-label">Domain Name</label>
          <input
            type="text"
            className="form-input"
            value={domainName}
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe this domain in detail. What does it encompass? What are the key areas? The more detail you provide, the better the generated structure will be."
            rows={4}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-cosmic">
            Generate Domain
          </button>
          <button type="button" className="btn-glass" onClick={onBack}>
            Back to Search
          </button>
        </div>
      </form>
    </div>
  );
}

function GeneratingState({
  domainName,
  currentAgent,
  completedAgents,
  events,
  eventLogRef,
  onCancel,
}: {
  domainName: string;
  currentAgent: string | null;
  completedAgents: number;
  events: DomainGenerationEvent[];
  eventLogRef: React.RefObject<HTMLDivElement | null>;
  onCancel: () => void;
}) {
  const totalAgents = 6;

  return (
    <div className="generator-content generating">
      <h1>Generating "{domainName}"</h1>
      <p className="generator-subtitle">
        {currentAgent
          ? `Currently running: ${AGENT_NAMES[currentAgent] || currentAgent}`
          : "Initializing..."}
      </p>

      <div className="generation-progress">
        <div className="agent-progress-bar">
          {Array.from({ length: totalAgents }).map((_, i) => (
            <div
              key={i}
              className={`agent-step ${
                i < completedAgents
                  ? "completed"
                  : i === completedAgents
                  ? "active"
                  : ""
              }`}
            />
          ))}
        </div>
        <p className="progress-text">
          {completedAgents} of {totalAgents} agents completed
        </p>
      </div>

      <div className="event-log" ref={eventLogRef}>
        {events.map((event, i) => (
          <EventLogItem key={i} event={event} />
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="btn-glass" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EventLogItem({ event }: { event: DomainGenerationEvent }) {
  const getEventClass = () => {
    switch (event.type) {
      case "node_created":
        return event.wasReused ? "reused" : "created";
      case "agent_started":
        return "agent-started";
      case "agent_completed":
        return "agent-completed";
      case "agent_failed":
      case "failed":
        return "error";
      default:
        return "";
    }
  };

  const getMessage = () => {
    switch (event.type) {
      case "started":
        return `Starting generation for "${event.domainName}"`;
      case "agent_started":
        return `${AGENT_NAMES[event.agent || ""] || event.agentName} started`;
      case "agent_completed":
        return `${AGENT_NAMES[event.agent || ""] || event.agent} completed (${event.nodesCreated} created, ${event.nodesReused} reused)`;
      case "agent_failed":
        return `${AGENT_NAMES[event.agent || ""] || event.agent} failed: ${event.error}`;
      case "step_progress":
        return event.message;
      case "node_created":
        return event.wasReused
          ? `Reused: ${event.nodeName} (${event.label})`
          : `Created: ${event.nodeName} (${event.label})`;
      case "similarity_check":
        return `Checking similarity for "${event.concept}" - found ${event.similarFound} similar nodes`;
      case "verification_result":
        return `Verification: "${event.concept}" -> ${event.decision}${event.generalizesTo ? ` (generalizes to ${event.generalizesTo})` : ""}`;
      case "completed":
        return "Generation completed successfully!";
      case "failed":
        return `Generation failed: ${event.error}`;
      default:
        return JSON.stringify(event);
    }
  };

  return <div className={`event-item ${getEventClass()}`}>{getMessage()}</div>;
}

function CompletedState({
  domainName,
  statistics,
  onGoToCreator,
}: {
  domainName: string;
  statistics: DomainGenerationEvent["statistics"] | null;
  onGoToCreator: () => void;
}) {
  return (
    <div className="generator-content completed">
      <div className="completed-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h1>Domain Generated!</h1>
      <p className="generator-subtitle">
        "{domainName}" has been created successfully.
      </p>

      {statistics && (
        <div className="statistics-grid">
          <div className="stat-item">
            <span className="stat-value">{statistics.domainLevelsCreated}</span>
            <span className="stat-label">Levels</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.knowledgeCreated}</span>
            <span className="stat-label">Knowledge</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.skillsCreated}</span>
            <span className="stat-label">Skills</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.traitsCreated}</span>
            <span className="stat-label">Traits</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.milestonesCreated}</span>
            <span className="stat-label">Milestones</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{statistics.nodesReused}</span>
            <span className="stat-label">Reused</span>
          </div>
        </div>
      )}

      <p className="completed-note">
        You can now review and edit the generated domain in the Domain Creator.
      </p>

      <button className="btn-cosmic" onClick={onGoToCreator}>
        Open in Domain Creator
      </button>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
  onBack,
}: {
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="generator-content error">
      <div className="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h1>Generation Failed</h1>
      <p className="generator-subtitle">{error || "An unexpected error occurred"}</p>

      <div className="form-actions">
        <button type="button" className="btn-cosmic" onClick={onRetry}>
          Try Again
        </button>
        <button type="button" className="btn-glass" onClick={onBack}>
          Back to Search
        </button>
      </div>
    </div>
  );
}
