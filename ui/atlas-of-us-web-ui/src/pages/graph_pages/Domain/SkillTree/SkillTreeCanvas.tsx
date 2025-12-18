import { useCallback, useEffect, useRef, useState } from 'react';
import type { DomainData } from '../domain-interfaces';
import type { CanvasNode, LayoutResult } from './skill-tree-types';
import { calculateLayout, calculateInitialCamera } from './skill-tree-layout';
import { render, findNodeAtPosition, screenToWorld } from './skill-tree-renderer';
import { CAMERA } from './skill-tree-constants';
import type { UserProgressMap } from './skill-tree-utils';
import './SkillTreeCanvas.css';

interface SkillTreeCanvasProps {
  domainData: DomainData;
  onNodeSelect: (node: CanvasNode | null) => void;
  selectedNode: CanvasNode | null;
  userProgressMap?: UserProgressMap;
}

export function SkillTreeCanvas({ domainData, onNodeSelect, selectedNode, userProgressMap = new Map() }: SkillTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<LayoutResult | null>(null);
  const rafRef = useRef<number>(0);
  const cameraRef = useRef({ x: 0, y: 0, zoom: CAMERA.INITIAL_ZOOM });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  // State for cursor style updates (dragging changes on mouse down/up only)
  const [hoveredNode, setHoveredNode] = useState<CanvasNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate layout when domain data changes
  useEffect(() => {
    if (domainData) {
      const layout = calculateLayout(domainData);
      layoutRef.current = layout;

      // Set initial camera position
      if (canvasRef.current) {
        cameraRef.current = calculateInitialCamera(
          layout.bounds,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }
  }, [domainData]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const layout = layoutRef.current;

    if (!canvas || !ctx || !layout) return;

    let animating = true;

    const animate = (timestamp: number) => {
      if (!animating) return;

      render(
        ctx,
        layout.nodes,
        layout.connections,
        cameraRef.current,
        hoveredNode,
        selectedNode,
        domainData.name,
        timestamp,
        userProgressMap
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      animating = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [hoveredNode, selectedNode, domainData.name, userProgressMap]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;

      cameraRef.current = {
        ...cameraRef.current,
        x: cameraRef.current.x - dx / cameraRef.current.zoom,
        y: cameraRef.current.y - dy / cameraRef.current.zoom,
      };
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      const worldPos = screenToWorld(x, y, cameraRef.current, rect.width, rect.height);
      const newHoveredNode = findNodeAtPosition(worldPos, layout.nodes);
      setHoveredNode(prev => prev?.id === newHoveredNode?.id ? prev : newHoveredNode);
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;

    // Check if this was a click (minimal movement) vs a drag
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    const wasClick = dx < 5 && dy < 5;

    if (wasClick && canvas && layout) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = screenToWorld(x, y, cameraRef.current, rect.width, rect.height);
      const clickedNode = findNodeAtPosition(worldPos, layout.nodes);
      onNodeSelect(clickedNode);
    }

    isDraggingRef.current = false;
    setIsDragging(false);
  }, [onNodeSelect]);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setHoveredNode(null);
  }, []);

  // Use native wheel event to properly prevent default browser zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const camera = cameraRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(CAMERA.MIN_ZOOM, Math.min(CAMERA.MAX_ZOOM, camera.zoom * zoomFactor));
      const mouseWorldBefore = screenToWorld(mouseX, mouseY, camera, rect.width, rect.height);
      const newCamera = { ...camera, zoom: newZoom };
      const mouseWorldAfter = screenToWorld(mouseX, mouseY, newCamera, rect.width, rect.height);

      cameraRef.current = {
        ...newCamera,
        x: newCamera.x + (mouseWorldBefore.x - mouseWorldAfter.x),
        y: newCamera.y + (mouseWorldBefore.y - mouseWorldAfter.y),
      };
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div ref={containerRef} className="skill-tree-container">
      <canvas
        ref={canvasRef}
        className="skill-tree-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab',
        }}
      />
      <div className="skill-tree-legend">
        <div className="legend-item">
          <span className="legend-shape hexagon knowledge"></span>
          <span>Knowledge</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape circle skill"></span>
          <span>Skill</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape diamond trait"></span>
          <span>Trait</span>
        </div>
        <div className="legend-item">
          <span className="legend-shape octagon milestone"></span>
          <span>Milestone</span>
        </div>
      </div>
      <div className="skill-tree-controls">
        <span className="control-hint">Scroll to zoom | Drag to pan</span>
      </div>
    </div>
  );
}
