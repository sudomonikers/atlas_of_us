// Canvas 2D rendering for the domain creator

import type { EditableDomainLevel, EditableNode, NodeType } from '../domain-creator-interfaces';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// Colors matching the skill tree viewer
const COLORS = {
  background: '#0d0d15',
  knowledge: '#64dfdf',
  skill: '#80ffdb',
  trait: '#c77dff',
  milestone: '#e0aaff',
  knowledgeGlow: 'rgba(100, 223, 223, 0.6)',
  skillGlow: 'rgba(128, 255, 219, 0.6)',
  traitGlow: 'rgba(199, 125, 255, 0.6)',
  milestoneGlow: 'rgba(224, 170, 255, 0.6)',
  selectedGlow: 'rgba(255, 255, 255, 0.8)',
  hoverGlow: 'rgba(200, 255, 255, 0.5)',
  labelText: 'rgba(255, 255, 255, 0.95)',
  labelTextDim: 'rgba(200, 230, 255, 0.7)',
  emptySlot: 'rgba(100, 100, 120, 0.3)',
  gridLine: 'rgba(100, 200, 255, 0.03)',
};

const NODE_RADIUS = {
  knowledge: 28,
  skill: 28,
  trait: 25,
  milestone: 30,
};

const LAYOUT = {
  SECTION_WIDTH: 280,
  SECTION_GAP: 40,
  NODE_SPACING_Y: 90,
  MAX_NODES_PER_ROW: 3,
  NODE_SPACING_X: 90,
  SECTION_HEADER_HEIGHT: 40,
};

// Coordinate transformations
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

// Calculate node positions within a section
function calculateNodePositions(
  nodes: EditableNode[],
  sectionCenterX: number,
  startY: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  nodes.forEach((node, index) => {
    const row = Math.floor(index / LAYOUT.MAX_NODES_PER_ROW);
    const col = index % LAYOUT.MAX_NODES_PER_ROW;
    const itemsInRow = Math.min(
      LAYOUT.MAX_NODES_PER_ROW,
      nodes.length - row * LAYOUT.MAX_NODES_PER_ROW
    );
    const rowWidth = (itemsInRow - 1) * LAYOUT.NODE_SPACING_X;
    const rowStartX = sectionCenterX - rowWidth / 2;

    positions.set(node.id, {
      x: rowStartX + col * LAYOUT.NODE_SPACING_X,
      y: startY + row * LAYOUT.NODE_SPACING_Y,
    });
  });

  return positions;
}

// Main render function
export function renderCreatorCanvas(
  ctx: CanvasRenderingContext2D,
  level: EditableDomainLevel,
  camera: Camera,
  hoveredNode: EditableNode | null,
  selectedNode: EditableNode | null,
  canvasWidth: number,
  canvasHeight: number
) {
  // Clear and fill background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw subtle grid
  drawGrid(ctx, camera, canvasWidth, canvasHeight);

  // Define sections
  const sections: { type: NodeType; nodes: EditableNode[]; label: string }[] = [
    { type: 'knowledge', nodes: level.knowledge, label: 'Knowledge' },
    { type: 'skill', nodes: level.skills, label: 'Skills' },
    { type: 'trait', nodes: level.traits, label: 'Traits' },
    { type: 'milestone', nodes: level.milestones, label: 'Milestones' },
  ];

  // Calculate total width
  const totalWidth = sections.length * LAYOUT.SECTION_WIDTH + (sections.length - 1) * LAYOUT.SECTION_GAP;
  let currentX = -totalWidth / 2 + LAYOUT.SECTION_WIDTH / 2;

  // Draw each section
  sections.forEach((section) => {
    const sectionCenterX = currentX;
    const headerY = -200;

    // Draw section header
    drawSectionHeader(ctx, section.label, section.type, sectionCenterX, headerY, camera, canvasWidth, canvasHeight);

    // Calculate node positions
    const startY = headerY + LAYOUT.SECTION_HEADER_HEIGHT + 40;
    const positions = calculateNodePositions(section.nodes, sectionCenterX, startY);

    // Draw empty slots if no nodes
    if (section.nodes.length === 0) {
      drawEmptySlot(ctx, sectionCenterX, startY, section.type, camera, canvasWidth, canvasHeight);
    }

    // Draw nodes
    section.nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;

      drawNode(ctx, node, pos.x, pos.y, camera, canvasWidth, canvasHeight, isHovered, isSelected);
    });

    currentX += LAYOUT.SECTION_WIDTH + LAYOUT.SECTION_GAP;
  });

  // Draw level info at top
  drawLevelInfo(ctx, level, camera, canvasWidth, canvasHeight);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
) {
  const gridSize = 50;
  const screenGridSize = gridSize * camera.zoom;

  if (screenGridSize < 15) return; // Don't draw if too zoomed out

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;

  // Calculate visible world bounds
  const topLeft = screenToWorld(0, 0, camera, canvasWidth, canvasHeight);
  const bottomRight = screenToWorld(canvasWidth, canvasHeight, camera, canvasWidth, canvasHeight);

  const startX = Math.floor(topLeft.x / gridSize) * gridSize;
  const startY = Math.floor(topLeft.y / gridSize) * gridSize;

  ctx.beginPath();
  for (let x = startX; x <= bottomRight.x; x += gridSize) {
    const screenPos = worldToScreen(x, 0, camera, canvasWidth, canvasHeight);
    ctx.moveTo(screenPos.x, 0);
    ctx.lineTo(screenPos.x, canvasHeight);
  }
  for (let y = startY; y <= bottomRight.y; y += gridSize) {
    const screenPos = worldToScreen(0, y, camera, canvasWidth, canvasHeight);
    ctx.moveTo(0, screenPos.y);
    ctx.lineTo(canvasWidth, screenPos.y);
  }
  ctx.stroke();
}

function drawSectionHeader(
  ctx: CanvasRenderingContext2D,
  label: string,
  type: NodeType,
  worldX: number,
  worldY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
) {
  const screenPos = worldToScreen(worldX, worldY, camera, canvasWidth, canvasHeight);
  const color = COLORS[type];

  // Background pill
  const pillWidth = 120 * camera.zoom;
  const pillHeight = 30 * camera.zoom;

  ctx.fillStyle = 'rgba(20, 20, 35, 0.8)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  const radius = pillHeight / 2;
  ctx.roundRect(
    screenPos.x - pillWidth / 2,
    screenPos.y - pillHeight / 2,
    pillWidth,
    pillHeight,
    radius
  );
  ctx.fill();
  ctx.stroke();

  // Label text
  ctx.fillStyle = color;
  ctx.font = `bold ${14 * camera.zoom}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, screenPos.x, screenPos.y);
}

function drawEmptySlot(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  worldY: number,
  type: NodeType,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
) {
  const screenPos = worldToScreen(worldX, worldY, camera, canvasWidth, canvasHeight);
  const radius = NODE_RADIUS[type] * camera.zoom;

  ctx.strokeStyle = COLORS.emptySlot;
  ctx.lineWidth = 2;
  ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);

  ctx.beginPath();
  ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // Plus sign
  ctx.strokeStyle = COLORS.emptySlot;
  ctx.lineWidth = 2;
  const plusSize = 10 * camera.zoom;
  ctx.beginPath();
  ctx.moveTo(screenPos.x - plusSize, screenPos.y);
  ctx.lineTo(screenPos.x + plusSize, screenPos.y);
  ctx.moveTo(screenPos.x, screenPos.y - plusSize);
  ctx.lineTo(screenPos.x, screenPos.y + plusSize);
  ctx.stroke();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: EditableNode,
  worldX: number,
  worldY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  isHovered: boolean,
  isSelected: boolean
) {
  const screenPos = worldToScreen(worldX, worldY, camera, canvasWidth, canvasHeight);
  const radius = NODE_RADIUS[node.type] * camera.zoom;

  const color = COLORS[node.type];
  const glowColor = COLORS[`${node.type}Glow` as keyof typeof COLORS] as string;

  // Draw glow
  const intensity = isSelected ? 1.5 : isHovered ? 1.2 : 0.8;
  drawGlow(ctx, screenPos, radius, glowColor, intensity);

  // Draw shape based on type
  switch (node.type) {
    case 'knowledge':
      drawHexagon(ctx, screenPos, radius, color, isSelected, isHovered);
      break;
    case 'skill':
      drawCircle(ctx, screenPos, radius, color, isSelected, isHovered);
      break;
    case 'trait':
      drawDiamond(ctx, screenPos, radius, color, isSelected, isHovered);
      break;
    case 'milestone':
      drawOctagon(ctx, screenPos, radius, color, isSelected, isHovered);
      break;
  }

  // Draw label
  if (camera.zoom > 0.5) {
    drawNodeLabel(ctx, screenPos, node, radius, camera.zoom);
  }

  // Draw "new" badge if node is new (no elementId means it was just created)
  if (!node.elementId && camera.zoom > 0.6) {
    drawNewBadge(ctx, screenPos, radius);
  }
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  intensity: number
) {
  const layers = [
    { size: 3.0, opacity: 0.1 * intensity },
    { size: 2.2, opacity: 0.2 * intensity },
    { size: 1.5, opacity: 0.3 * intensity },
  ];

  layers.forEach((layer) => {
    const gradient = ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, radius * layer.size
    );
    gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${layer.opacity})`));
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
  isHovered: boolean
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

  ctx.fillStyle = 'rgba(13, 13, 21, 0.8)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean
) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

  ctx.fillStyle = 'rgba(13, 13, 21, 0.8)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean
) {
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - radius);
  ctx.lineTo(center.x + radius, center.y);
  ctx.lineTo(center.x, center.y + radius);
  ctx.lineTo(center.x - radius, center.y);
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

function drawOctagon(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  color: string,
  isSelected: boolean,
  isHovered: boolean
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

  ctx.fillStyle = 'rgba(13, 13, 21, 0.8)';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 15 : isHovered ? 12 : 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  screenPos: { x: number; y: number },
  node: EditableNode,
  scaledRadius: number,
  zoom: number
) {
  const labelY = screenPos.y + scaledRadius + 12 * zoom;
  const maxWidth = 100 * zoom;

  ctx.font = `${12 * zoom}px Inter, sans-serif`;
  ctx.fillStyle = COLORS.labelText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let displayName = node.name;
  const metrics = ctx.measureText(displayName);
  if (metrics.width > maxWidth) {
    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 0) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }

  ctx.fillText(displayName, screenPos.x, labelY);

  // Show requirement badge
  if (zoom > 0.7) {
    const badgeY = labelY + 14 * zoom;
    ctx.font = `${10 * zoom}px Inter, sans-serif`;
    ctx.fillStyle = COLORS.labelTextDim;

    let badgeText = '';
    if (node.bloomLevel) {
      badgeText = node.bloomLevel;
    } else if (node.dreyfusLevel) {
      badgeText = node.dreyfusLevel;
    } else if (node.minScore !== undefined) {
      badgeText = `${node.minScore}+`;
    }

    if (badgeText) {
      ctx.fillText(badgeText, screenPos.x, badgeY);
    }
  }
}

function drawNewBadge(
  ctx: CanvasRenderingContext2D,
  screenPos: { x: number; y: number },
  radius: number
) {
  const badgeX = screenPos.x + radius * 0.6;
  const badgeY = screenPos.y - radius * 0.6;
  const badgeRadius = 8;

  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.font = 'bold 8px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', badgeX, badgeY);
}

function drawLevelInfo(
  ctx: CanvasRenderingContext2D,
  level: EditableDomainLevel,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
) {
  const screenPos = worldToScreen(0, -300, camera, canvasWidth, canvasHeight);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = `bold ${20 * camera.zoom}px "Mochiy Pop One", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Level ${level.level}: ${level.name}`, screenPos.x, screenPos.y);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = `${12 * camera.zoom}px Inter, sans-serif`;
  ctx.fillText(`${level.pointsRequired} points required`, screenPos.x, screenPos.y + 25 * camera.zoom);
}

// Hit testing
export function findNodeAtPosition(
  worldPos: { x: number; y: number },
  allNodes: EditableNode[],
  level: EditableDomainLevel
): EditableNode | null {
  const sections: { type: NodeType; nodes: EditableNode[] }[] = [
    { type: 'knowledge', nodes: level.knowledge },
    { type: 'skill', nodes: level.skills },
    { type: 'trait', nodes: level.traits },
    { type: 'milestone', nodes: level.milestones },
  ];

  const totalWidth = sections.length * LAYOUT.SECTION_WIDTH + (sections.length - 1) * LAYOUT.SECTION_GAP;
  let currentX = -totalWidth / 2 + LAYOUT.SECTION_WIDTH / 2;

  for (const section of sections) {
    const sectionCenterX = currentX;
    const headerY = -200;
    const startY = headerY + LAYOUT.SECTION_HEADER_HEIGHT + 40;
    const positions = calculateNodePositions(section.nodes, sectionCenterX, startY);

    for (const node of section.nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const dx = worldPos.x - pos.x;
      const dy = worldPos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = NODE_RADIUS[node.type];

      if (distance <= radius * 1.2) {
        return node;
      }
    }

    currentX += LAYOUT.SECTION_WIDTH + LAYOUT.SECTION_GAP;
  }

  return null;
}
