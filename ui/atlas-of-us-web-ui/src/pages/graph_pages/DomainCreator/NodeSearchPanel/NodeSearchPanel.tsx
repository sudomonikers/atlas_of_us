import { useState, useEffect, useCallback, useRef } from 'react';
import { HttpService, type SearchNodeResult } from '../../../../services/http-service';
import type { NodeType } from '../domain-creator-interfaces';
import './NodeSearchPanel.css';

interface NodeSearchPanelProps {
  onClose: () => void;
  onSelectNode: (node: SearchNodeResult) => void;
  onCreateNew: () => void;
  filterType: NodeType;
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  knowledge: 'Knowledge',
  skill: 'Skill',
  trait: 'Trait',
  milestone: 'Milestone',
};

export function NodeSearchPanel({
  onClose,
  onSelectNode,
  onCreateNew,
  filterType,
}: NodeSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchNodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<NodeType>(filterType);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search with debounce
  const searchNodes = useCallback(async (searchQuery: string, type: NodeType) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    const httpService = new HttpService();
    const label = NODE_TYPE_LABELS[type];
    const response = await httpService.searchNodes(searchQuery, [label], 20);

    if (response) {
      setResults(response.nodes);
    } else {
      setResults([]);
    }

    setIsLoading(false);
  }, []);

  // Handle query change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchNodes(query, activeType);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeType, searchNodes]);

  // Handle type change
  const handleTypeChange = (type: NodeType) => {
    setActiveType(type);
    setResults([]);
  };

  // Get type color
  const getTypeColor = (type: NodeType): string => {
    const colors: Record<NodeType, string> = {
      knowledge: '#64dfdf',
      skill: '#80ffdb',
      trait: '#c77dff',
      milestone: '#FFD700',
    };
    return colors[type];
  };

  return (
    <div className="node-search-panel-overlay" onClick={onClose}>
      <div className="node-search-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="search-panel-header">
          <h3>Add {NODE_TYPE_LABELS[activeType]}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Type tabs */}
        <div className="type-tabs">
          {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((type) => (
            <button
              key={type}
              className={`type-tab ${activeType === type ? 'active' : ''}`}
              onClick={() => handleTypeChange(type)}
              style={{
                '--type-color': getTypeColor(type),
              } as React.CSSProperties}
            >
              {NODE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="search-input-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={`Search existing ${NODE_TYPE_LABELS[activeType].toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results */}
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.elementId}
                className="search-result-item"
                onClick={() => onSelectNode(result)}
                style={{
                  '--type-color': getTypeColor(activeType),
                } as React.CSSProperties}
              >
                <div className="result-name">{result.props.name}</div>
                {result.props.description && (
                  <div className="result-description">
                    {result.props.description.slice(0, 100)}
                    {result.props.description.length > 100 ? '...' : ''}
                  </div>
                )}
              </button>
            ))
          ) : query.trim() ? (
            <div className="search-no-results">
              <p>No existing {NODE_TYPE_LABELS[activeType].toLowerCase()} found for "{query}"</p>
            </div>
          ) : (
            <div className="search-empty">
              <p>Start typing to search existing nodes</p>
            </div>
          )}
        </div>

        {/* Create new button */}
        <div className="search-panel-footer">
          <button className="create-new-btn" onClick={onCreateNew}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create New {NODE_TYPE_LABELS[activeType]}
          </button>
        </div>
      </div>
    </div>
  );
}
