import { useRef, useEffect, useCallback, useState } from 'react';
import type { EditableDomainLevel, EditableNode, NodeType } from '../domain-creator-interfaces';
import { renderCreatorCanvas, findNodeAtPosition, screenToWorld } from './creator-canvas-renderer';
import '../../graph-pages.css';
import './CreatorCanvas.css';

interface CreatorCanvasProps {
  level: EditableDomainLevel;
  selectedNode: EditableNode | null;
  onSelectNode: (node: EditableNode | null) => void;
  onOpenAddNode: (type: NodeType) => void;
  onRemoveNode: (nodeId: string, type: NodeType) => void;
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function CreatorCanvas({
  level,
  selectedNode,
  onSelectNode,
  onOpenAddNode,
  onRemoveNode,
}: CreatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(null);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<EditableNode | null>(null);

  // Collect all nodes from the level
  const allNodes = [
    ...level.knowledge,
    ...level.skills,
    ...level.traits,
    ...level.milestones,
  ];

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      // Set canvas size
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Render canvas
      renderCreatorCanvas(
        ctx,
        level,
        camera,
        hoveredNode,
        selectedNode,
        rect.width,
        rect.height
      );

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, camera, hoveredNode, selectedNode]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force re-render on resize
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      setCamera(prev => ({
        ...prev,
        x: prev.x - dx / prev.zoom,
        y: prev.y - dy / prev.zoom,
      }));

      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      // Check for hover
      const worldPos = screenToWorld(mouseX, mouseY, camera, rect.width, rect.height);
      const node = findNodeAtPosition(worldPos, allNodes, level);
      setHoveredNode(node);
    }
  }, [isDragging, lastMousePos, camera, allNodes, level]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoveredNode(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPos = screenToWorld(mouseX, mouseY, camera, rect.width, rect.height);
    const node = findNodeAtPosition(worldPos, allNodes, level);

    if (node) {
      onSelectNode(node);
    } else {
      onSelectNode(null);
    }
  }, [camera, allNodes, level, onSelectNode]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(2, camera.zoom * zoomFactor));

    // Zoom towards mouse position
    const worldBefore = screenToWorld(mouseX, mouseY, camera, rect.width, rect.height);
    const newCamera = { ...camera, zoom: newZoom };
    const worldAfter = screenToWorld(mouseX, mouseY, newCamera, rect.width, rect.height);

    setCamera({
      x: camera.x + (worldBefore.x - worldAfter.x),
      y: camera.y + (worldBefore.y - worldAfter.y),
      zoom: newZoom,
    });
  }, [camera]);

  return (
    <div className="creator-canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="creator-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Add node buttons */}
      <div className="add-node-buttons">
        <button
          className="add-node-btn knowledge"
          onClick={() => onOpenAddNode('knowledge')}
          title="Add Knowledge"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Knowledge
        </button>
        <button
          className="add-node-btn skill"
          onClick={() => onOpenAddNode('skill')}
          title="Add Skill"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Skill
        </button>
        <button
          className="add-node-btn trait"
          onClick={() => onOpenAddNode('trait')}
          title="Add Trait"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Trait
        </button>
        <button
          className="add-node-btn milestone"
          onClick={() => onOpenAddNode('milestone')}
          title="Add Milestone"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Milestone
        </button>
      </div>

      {/* Legend */}
      <div className="creator-legend">
        <div className="legend-item">
          <span className="legend-shape hexagon"></span>
          <span>Knowledge</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape circle"></span>
          <span>Skill</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape diamond"></span>
          <span>Trait</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape octagon"></span>
          <span>Milestone</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(2, prev.zoom * 1.2) }))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span className="zoom-level">{Math.round(camera.zoom * 100)}%</span>
        <button onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(0.25, prev.zoom / 1.2) }))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
