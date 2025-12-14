// Canvas 2D rendering functions for the skill tree

import type { Camera, CanvasNode, Connection, NodeType } from './skill-tree-types';
import { COLORS, FONTS, NODE_RADIUS } from './skill-tree-constants';
import { renderBackground, generateBackgroundState } from './skill-tree-background';

// Cache background state to avoid regenerating every frame
let cachedBackgroundState: ReturnType<typeof generateBackgroundState> | null = null;
let cachedDomainName: string | null = null;
let cachedBackgroundSize = { width: 0, height: 0 };

// Coordinate transformation utilities
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: (worldX - camera.x) * camera.zoom + canvasWidth / 2,
    y: (worldY - camera.y) * camera.zoom + canvasHeight / 2,
  };
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: (screenX - canvasWidth / 2) / camera.zoom + camera.x,
    y: (screenY - canvasHeight / 2) / camera.zoom + camera.y,
  };
}

// Check if a point is visible on screen
function isVisible(
  screenPos: { x: number; y: number },
  radius: number,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const margin = radius + 50;
  return (
    screenPos.x > -margin &&
    screenPos.x < canvasWidth + margin &&
    screenPos.y > -margin &&
    screenPos.y < canvasHeight + margin
  );
}

// Color utilities
function getNodeColor(type: NodeType): string {
  return COLORS[type] || COLORS.knowledge;
}

function getGlowColor(type: NodeType): string {
  const glowKey = `${type}Glow` as keyof typeof COLORS;
  return COLORS[glowKey] || COLORS.knowledgeGlow;
}

// Main render function
export function render(
  ctx: CanvasRenderingContext2D,
  nodes: CanvasNode[],
  connections: Connection[],
  camera: Camera,
  hoveredNode: CanvasNode | null,
  selectedNode: CanvasNode | null,
  domainName: string = 'Default',
  time: number = 0,
  completedNodeIds: Set<string> = new Set()
) {
  // Use CSS dimensions (context is already scaled by DPR)
  const dpr = window.devicePixelRatio || 1;
  const width = ctx.canvas.width / dpr;
  const height = ctx.canvas.height / dpr;

  // Generate or reuse cached background state
  if (
    cachedDomainName !== domainName ||
    cachedBackgroundSize.width !== width ||
    cachedBackgroundSize.height !== height
  ) {
    cachedBackgroundState = generateBackgroundState(domainName, width, height);
    cachedDomainName = domainName;
    cachedBackgroundSize = { width, height };
  }

  // Draw procedural background
  if (cachedBackgroundState) {
    renderBackground(ctx, cachedBackgroundState, time);
  } else {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw connections
  connections.forEach(conn => {
    drawConnection(ctx, conn.from, conn.to, camera, width, height, conn.isMainPath);
  });

  // Draw nodes (back to front: regular, hovered, selected)
  const regularNodes = nodes.filter(n => n !== hoveredNode && n !== selectedNode);
  const specialNodes = [hoveredNode, selectedNode].filter(Boolean) as CanvasNode[];

  regularNodes.forEach(node => {
    const isCompleted = node.elementId ? completedNodeIds.has(node.elementId) : false;
    drawNode(ctx, node, camera, width, height, false, false, isCompleted);
  });

  specialNodes.forEach(node => {
    const isHovered = node === hoveredNode;
    const isSelected = node === selectedNode;
    const isCompleted = node.elementId ? completedNodeIds.has(node.elementId) : false;
    drawNode(ctx, node, camera, width, height, isHovered, isSelected, isCompleted);
  });
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  from: CanvasNode,
  to: CanvasNode,
  camera: Camera,
  width: number,
  height: number,
  isMainPath: boolean
) {
  const fromScreen = worldToScreen(from.x, from.y, camera, width, height);
  const toScreen = worldToScreen(to.x, to.y, camera, width, height);

  // Bezier control points for smooth curves
  const midX = (fromScreen.x + toScreen.x) / 2;
  const controlPoint1 = { x: midX, y: fromScreen.y };
  const controlPoint2 = { x: midX, y: toScreen.y };

  ctx.beginPath();
  ctx.moveTo(fromScreen.x, fromScreen.y);
  ctx.bezierCurveTo(
    controlPoint1.x,
    controlPoint1.y,
    controlPoint2.x,
    controlPoint2.y,
    toScreen.x,
    toScreen.y
  );

  if (isMainPath) {
    ctx.strokeStyle = COLORS.connectionMain;
    ctx.lineWidth = 3 * camera.zoom;
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = COLORS.connectionBranch;
    ctx.lineWidth = 1.5 * camera.zoom;
    ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  camera: Camera,
  width: number,
  height: number,
  isHovered: boolean,
  isSelected: boolean,
  isCompleted: boolean = false
) {
  const screenPos = worldToScreen(node.x, node.y, camera, width, height);
  const scaledRadius = node.radius * camera.zoom;

  // Skip if off-screen
  if (!isVisible(screenPos, scaledRadius, width, height)) return;

  const color = getNodeColor(node.type);
  const glowColor = getGlowColor(node.type);

  // Completed nodes get enhanced glow
  const baseIntensity = isCompleted ? 1.8 : isSelected ? 1.5 : isHovered ? 1.2 : 0.8;
  drawGlow(ctx, screenPos, scaledRadius, glowColor, baseIntensity);

  // Draw shape based on type
  switch (node.type) {
    case 'knowledge':
      drawHexagon(ctx, screenPos, scaledRadius, color, isSelected, isHovered, isCompleted);
      break;
    case 'skill':
      drawCircle(ctx, screenPos, scaledRadius, color, isSelected, isHovered, isCompleted);
      break;
    case 'trait':
      drawDiamond(ctx, screenPos, scaledRadius, color, isSelected, isHovered, isCompleted);
      break;
    case 'milestone':
      drawOctagon(ctx, screenPos, scaledRadius, color, isSelected, isHovered, isCompleted);
      break;
    case 'level':
      drawRoundedRect(ctx, screenPos, scaledRadius, color, isSelected, isHovered);
      break;
    default:
      drawCircle(ctx, screenPos, scaledRadius, color, isSelected, isHovered, isCompleted);
  }

  // Draw label when zoomed in enough
  if (camera.zoom > 0.5) {
    drawNodeLabel(ctx, screenPos, node, scaledRadius, camera.zoom);
  }
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  intensity: number = 1
) {
  // Multiple layered glows for ethereal effect
  const layers = [
    { size: 3.5, opacity: 0.1 * intensity },
    { size: 2.5, opacity: 0.2 * intensity },
    { size: 1.8, opacity: 0.3 * intensity },
    { size: 1.3, opacity: 0.4 * intensity },
  ];

  layers.forEach(layer => {
    const gradient = ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, radius * layer.size
    );
    gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${layer.opacity})`));
    gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${layer.opacity * 0.5})`));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * layer.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  isCompleted: boolean = false
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Completed: solid color fill; Incomplete: dark fill
  ctx.fillStyle = isCompleted ? color : 'rgba(13, 13, 21, 0.8)';
  ctx.globalAlpha = isCompleted ? 0.6 : 1;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Glowing stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = isCompleted ? 3 : isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isCompleted ? 20 : isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner details - small rune-like marks
  drawInnerRune(ctx, center, radius * 0.5, isCompleted ? '#ffffff' : color);
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  isCompleted: boolean = false
) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

  ctx.fillStyle = isCompleted ? color : 'rgba(13, 13, 21, 0.8)';
  ctx.globalAlpha = isCompleted ? 0.6 : 1;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = isCompleted ? 3 : isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isCompleted ? 20 : isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner ring
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = isCompleted ? '#ffffff' : color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  isCompleted: boolean = false
) {
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - radius);
  ctx.lineTo(center.x + radius, center.y);
  ctx.lineTo(center.x, center.y + radius);
  ctx.lineTo(center.x - radius, center.y);
  ctx.closePath();

  ctx.fillStyle = isCompleted ? color : 'rgba(13, 13, 21, 0.8)';
  ctx.globalAlpha = isCompleted ? 0.6 : 1;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = isCompleted ? 3 : isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isCompleted ? 20 : isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Inner diamond
  const innerR = radius * 0.4;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - innerR);
  ctx.lineTo(center.x + innerR, center.y);
  ctx.lineTo(center.x, center.y + innerR);
  ctx.lineTo(center.x - innerR, center.y);
  ctx.closePath();
  ctx.strokeStyle = isCompleted ? '#ffffff' : color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawOctagon(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  isCompleted: boolean = false
) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 8;
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = isCompleted ? color : 'rgba(13, 13, 21, 0.8)';
  ctx.globalAlpha = isCompleted ? 0.6 : 1;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = isCompleted ? 3 : isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isCompleted ? 20 : isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Star in center
  drawStar(ctx, center, radius * 0.4, isCompleted ? '#ffffff' : color);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean
) {
  const width = radius * 2.2;
  const height = radius * 1.4;
  const cornerRadius = radius * 0.25;

  const x = center.x - width / 2;
  const y = center.y - height / 2;

  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();

  ctx.fillStyle = 'rgba(13, 13, 21, 0.8)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// Helper to draw inner rune marks
function drawInnerRune(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  size: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;

  // Simple cross pattern
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - size);
  ctx.lineTo(center.x, center.y + size);
  ctx.moveTo(center.x - size, center.y);
  ctx.lineTo(center.x + size, center.y);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// Helper to draw a star
function drawStar(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + radius * Math.cos(angle),
      center.y + radius * Math.sin(angle)
    );
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  screenPos: { x: number; y: number },
  node: CanvasNode,
  scaledRadius: number,
  zoom: number
) {
  const labelY = screenPos.y + scaledRadius + 12 * zoom;
  const maxWidth = 120 * zoom;

  ctx.font = node.type === 'level' ? FONTS.header : FONTS.label;
  ctx.fillStyle = COLORS.labelText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Truncate long names
  let displayName = node.name;
  const metrics = ctx.measureText(displayName);
  if (metrics.width > maxWidth) {
    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }

  ctx.fillText(displayName, screenPos.x, labelY);

  // For non-level nodes, show requirement badge
  if (node.type !== 'level' && zoom > 0.7) {
    const badgeY = labelY + 14 * zoom;
    ctx.font = FONTS.levelName;
    ctx.fillStyle = COLORS.labelTextDim;

    let badgeText = '';
    if (node.requirement?.bloomLevel) {
      badgeText = node.requirement.bloomLevel;
    } else if (node.requirement?.dreyfusLevel) {
      badgeText = node.requirement.dreyfusLevel;
    } else if (node.requirement?.minScore !== undefined) {
      badgeText = `${node.requirement.minScore}+`;
    }

    if (badgeText) {
      ctx.fillText(badgeText, screenPos.x, badgeY);
    }
  }
}

// Hit testing for click/hover detection
export function findNodeAtPosition(
  worldPos: { x: number; y: number },
  nodes: CanvasNode[]
): CanvasNode | null {
  // Check in reverse order (topmost/most recently drawn first)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = worldPos.x - node.x;
    const dy = worldPos.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use slightly larger hit area for better UX
    if (distance <= node.radius * 1.2) {
      return node;
    }
  }
  return null;
}
