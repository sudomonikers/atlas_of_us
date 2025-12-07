import { useCallback, useEffect, useRef, useState } from 'react';
import type { DomainData } from '../domain-interfaces';
import type { CanvasNode, CanvasState, LayoutResult } from './skill-tree-types';
import { calculateLayout, calculateInitialCamera } from './skill-tree-layout';
import { render, findNodeAtPosition, screenToWorld } from './skill-tree-renderer';
import { CAMERA } from './skill-tree-constants';
import './SkillTreeCanvas.css';

interface SkillTreeCanvasProps {
  domainData: DomainData;
  onNodeSelect: (node: CanvasNode | null) => void;
  selectedNode: CanvasNode | null;
}

export function SkillTreeCanvas({ domainData, onNodeSelect, selectedNode }: SkillTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<LayoutResult | null>(null);
  const rafRef = useRef<number>(0);
  const cameraRef = useRef({ x: 0, y: 0, zoom: CAMERA.INITIAL_ZOOM });

  const [canvasState, setCanvasState] = useState<CanvasState>({
    camera: { x: 0, y: 0, zoom: CAMERA.INITIAL_ZOOM },
    hoveredNode: null,
    selectedNode: null,
    isDragging: false,
    lastMousePos: { x: 0, y: 0 },
  });

  // Calculate layout when domain data changes
  useEffect(() => {
    if (domainData) {
      const layout = calculateLayout(domainData);
      layoutRef.current = layout;

      // Set initial camera position
      if (canvasRef.current) {
        const initialCamera = calculateInitialCamera(
          layout.bounds,
          canvasRef.current.width,
          canvasRef.current.height
        );
        cameraRef.current = initialCamera;
        setCanvasState(prev => ({
          ...prev,
          camera: initialCamera,
        }));
      }
    }
  }, [domainData]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const layout = layoutRef.current;

    if (!canvas || !ctx || !layout) return;

    // Cancel any pending frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      render(
        ctx,
        layout.nodes,
        layout.connections,
        canvasState.camera,
        canvasState.hoveredNode,
        selectedNode
      );
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [canvasState, selectedNode]);

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

        // Trigger re-render
        setCanvasState(prev => ({ ...prev }));
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Track drag distance to distinguish clicks from drags
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setCanvasState(prev => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x: e.clientX, y: e.clientY },
    }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCanvasState(prev => {
      if (prev.isDragging) {
        const dx = e.clientX - prev.lastMousePos.x;
        const dy = e.clientY - prev.lastMousePos.y;

        const newCamera = {
          ...prev.camera,
          x: prev.camera.x - dx / prev.camera.zoom,
          y: prev.camera.y - dy / prev.camera.zoom,
        };
        cameraRef.current = newCamera;
        return {
          ...prev,
          camera: newCamera,
          lastMousePos: { x: e.clientX, y: e.clientY },
        };
      } else {
        const worldPos = screenToWorld(x, y, prev.camera, rect.width, rect.height);
        const hoveredNode = findNodeAtPosition(worldPos, layout.nodes);
        return { ...prev, hoveredNode };
      }
    });
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

    setCanvasState(prev => ({ ...prev, isDragging: false }));
  }, [onNodeSelect]);

  const handleMouseLeave = useCallback(() => {
    setCanvasState(prev => ({ ...prev, isDragging: false, hoveredNode: null }));
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

      setCanvasState(prev => {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(CAMERA.MIN_ZOOM, Math.min(CAMERA.MAX_ZOOM, prev.camera.zoom * zoomFactor));
        const mouseWorldBefore = screenToWorld(mouseX, mouseY, prev.camera, rect.width, rect.height);
        const newCamera = { ...prev.camera, zoom: newZoom };
        const mouseWorldAfter = screenToWorld(mouseX, mouseY, newCamera, rect.width, rect.height);

        const finalCamera = {
          ...newCamera,
          x: newCamera.x + (mouseWorldBefore.x - mouseWorldAfter.x),
          y: newCamera.y + (mouseWorldBefore.y - mouseWorldAfter.y),
        };
        cameraRef.current = finalCamera;
        return { ...prev, camera: finalCamera };
      });
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
          cursor: canvasState.isDragging
            ? 'grabbing'
            : canvasState.hoveredNode
            ? 'pointer'
            : 'grab',
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
