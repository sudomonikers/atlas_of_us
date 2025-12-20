// Layout algorithm for positioning nodes in the node tree

import type { DomainData, DomainLevel, DomainNode } from '../domain-interfaces';
import type { CanvasNode, Connection, LayoutResult, NodeType } from './node-tree-types';
import { LAYOUT, NODE_RADIUS } from './node-tree-constants';

/**
 * Transform DomainData into positioned CanvasNodes for rendering
 */
export function calculateLayout(domainData: DomainData): LayoutResult {
  const nodes: CanvasNode[] = [];
  const connections: Connection[] = [];
  const levelHeaders: CanvasNode[] = [];

  // Sort levels by level number
  const sortedLevels = [...domainData.levels].sort(
    (a, b) => a.level - b.level
  );

  // Calculate layout for each level
  sortedLevels.forEach((level, levelIndex) => {
    const levelNodes = calculateLevelLayout(level, levelIndex);
    nodes.push(...levelNodes);

    // Find the level header node
    const headerNode = levelNodes.find(n => n.type === 'level');
    if (headerNode) {
      levelHeaders.push(headerNode);
    }
  });

  // Create connections between level headers (main path)
  for (let i = 0; i < levelHeaders.length - 1; i++) {
    connections.push({
      from: levelHeaders[i],
      to: levelHeaders[i + 1],
      isMainPath: true,
    });
  }

  // Calculate bounds
  const bounds = calculateBounds(nodes);

  return { nodes, connections, bounds };
}

function calculateLevelLayout(level: DomainLevel, levelIndex: number): CanvasNode[] {
  const nodes: CanvasNode[] = [];
  const levelCenterX = levelIndex * LAYOUT.LEVEL_SPACING + LAYOUT.PADDING;

  // Gather all requirement nodes with their types
  const sections = ([
    { type: 'knowledge' as NodeType, items: level.knowledge || [] },
    { type: 'skill' as NodeType, items: level.skills || [] },
    { type: 'trait' as NodeType, items: level.traits || [] },
    { type: 'milestone' as NodeType, items: level.milestones || [] },
  ] as { type: NodeType; items: DomainNode[] }[]).filter(s => s.items.length > 0);

  // Calculate total height needed with grid layout
  let totalHeight = LAYOUT.LEVEL_HEADER_OFFSET;
  sections.forEach((section, i) => {
    const rows = Math.ceil(section.items.length / LAYOUT.MAX_NODES_PER_ROW);
    totalHeight += rows * LAYOUT.NODE_SPACING_Y;
    if (i < sections.length - 1) totalHeight += LAYOUT.SECTION_GAP;
  });

  // Start from top, center around y=0
  let currentY = -totalHeight / 2;

  // Create level header node
  const levelHeader: CanvasNode = {
    id: `level-${levelIndex}`,
    name: level.name || `Level ${level.level}`,
    description: level.description,
    type: 'level',
    levelIndex,
    x: levelCenterX,
    y: currentY,
    radius: NODE_RADIUS.level,
    originalData: {
      level: level.level,
      name: level.name,
      description: level.description,
      pointsRequired: level.pointsRequired,
    },
  };
  nodes.push(levelHeader);
  currentY += LAYOUT.LEVEL_HEADER_OFFSET;

  // Position nodes in each section using grid layout
  sections.forEach((section, sectionIndex) => {
    const itemCount = section.items.length;
    const rows = Math.ceil(itemCount / LAYOUT.MAX_NODES_PER_ROW);

    section.items.forEach((item, itemIndex) => {
      const row = Math.floor(itemIndex / LAYOUT.MAX_NODES_PER_ROW);
      const col = itemIndex % LAYOUT.MAX_NODES_PER_ROW;

      // Center partial rows
      const itemsInThisRow = Math.min(LAYOUT.MAX_NODES_PER_ROW, itemCount - row * LAYOUT.MAX_NODES_PER_ROW);
      const rowWidth = (itemsInThisRow - 1) * LAYOUT.NODE_SPACING_X;
      const rowStartX = levelCenterX - rowWidth / 2;

      const x = rowStartX + col * LAYOUT.NODE_SPACING_X;
      const y = currentY + row * LAYOUT.NODE_SPACING_Y;

      const node = createCanvasNode(item, section.type, levelIndex, x, y);
      nodes.push(node);
    });

    currentY += rows * LAYOUT.NODE_SPACING_Y;

    // Add section gap after each section (except last)
    if (sectionIndex < sections.length - 1) {
      currentY += LAYOUT.SECTION_GAP;
    }
  });

  return nodes;
}

function createCanvasNode(
  domainNode: DomainNode,
  type: NodeType,
  levelIndex: number,
  x: number,
  y: number
): CanvasNode {
  return {
    id: `${type}-${levelIndex}-${domainNode.name}`,
    name: domainNode.name,
    description: domainNode.description,
    type,
    levelIndex,
    x,
    y,
    radius: NODE_RADIUS[type],
    requirement: {
      bloomLevel: domainNode.bloomLevel,
      dreyfusLevel: domainNode.dreyfusLevel,
      minScore: domainNode.minScore,
    },
    elementId: domainNode.elementId,
    originalData: domainNode as unknown as Record<string, unknown>,
  };
}

function calculateBounds(nodes: CanvasNode[]): LayoutResult['bounds'] {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    minX = Math.min(minX, node.x - node.radius);
    maxX = Math.max(maxX, node.x + node.radius);
    minY = Math.min(minY, node.y - node.radius);
    maxY = Math.max(maxY, node.y + node.radius);
  });

  return { minX, maxX, minY, maxY };
}

/**
 * Calculate initial camera position to center the tree
 */
export function calculateInitialCamera(bounds: LayoutResult['bounds'], canvasWidth: number, canvasHeight: number) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    x: centerX,
    y: centerY,
    zoom: 0.7,
  };
}
