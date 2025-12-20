// Procedural pixel art background generator for node tree
// Creates a layered scene with sky, clouds, moon, mountains, and trees

import { COLORS } from './node-tree-constants';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinklePhase: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
}

interface Mountain {
  peaks: { x: number; y: number }[];
  color: string;
  layer: number; // 0 = farthest back, higher = closer
}

interface Tree {
  x: number;
  y: number;
  height: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  angle: number;
  brightness: number;
}

interface Moon {
  x: number;
  y: number;
  radius: number;
  glowColor: string;
}

interface BackgroundState {
  stars: Star[];
  clouds: Cloud[];
  mountains: Mountain[];
  trees: Tree[];
  shootingStars: ShootingStar[];
  moon: Moon;
  skyColors: {
    top: string;
    mid: string;
    bottom: string;
    accent: string;
  };
  seed: number;
}

// Seeded random number generator
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Hash string to number for seeding
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate domain-specific color palette
function generateSkyColors(random: () => number): BackgroundState['skyColors'] {
  // Base hue seeded by domain - creates variety
  const baseHue = Math.floor(random() * 60) + 190; // Blues to teals (190-250)
  const saturation = 50 + random() * 30;

  return {
    top: `hsl(${baseHue + 20}, ${saturation}%, 8%)`,
    mid: `hsl(${baseHue}, ${saturation + 10}%, 18%)`,
    bottom: `hsl(${baseHue - 10}, ${saturation}%, 25%)`,
    accent: `hsl(${(baseHue + 140) % 360}, 70%, 60%)`, // Complementary accent (oranges/golds)
  };
}

// Generate star field
function generateStars(random: () => number, width: number, height: number): Star[] {
  const stars: Star[] = [];
  const starCount = Math.floor((width * height) / 600);

  for (let i = 0; i < starCount; i++) {
    const brightness = random();
    const size = brightness > 0.97 ? 3 : brightness > 0.85 ? 2 : 1;

    // Star colors - mostly white/yellow, some gold
    let color = '#ffffff';
    const colorRoll = random();
    if (colorRoll > 0.95) {
      color = '#ffd700'; // Gold
    } else if (colorRoll > 0.85) {
      color = '#ffffcc'; // Warm white
    } else if (colorRoll > 0.7) {
      color = '#ccffff'; // Cool white
    }

    stars.push({
      x: Math.floor(random() * width),
      y: Math.floor(random() * height * 0.7), // Stars only in upper 70%
      size,
      brightness: 0.4 + brightness * 0.6,
      twinklePhase: random() * Math.PI * 2,
      color,
    });
  }

  return stars;
}

// Generate moon
function generateMoon(random: () => number, width: number, height: number, skyColors: BackgroundState['skyColors']): Moon {
  return {
    x: width * (0.1 + random() * 0.3), // Left-ish side
    y: height * (0.1 + random() * 0.25), // Upper portion
    radius: 20 + random() * 30,
    glowColor: skyColors.bottom,
  };
}

// Generate clouds with pixel art style
function generateClouds(random: () => number, width: number, height: number, skyColors: BackgroundState['skyColors']): Cloud[] {
  const clouds: Cloud[] = [];
  const cloudCount = 4 + Math.floor(random() * 5);

  for (let i = 0; i < cloudCount; i++) {
    const y = height * (0.15 + random() * 0.45);
    const brightness = random();

    clouds.push({
      x: random() * width,
      y,
      width: 80 + random() * 200,
      height: 20 + random() * 40,
      color: brightness > 0.5 ? '#4a8faf' : '#2d5a73',
      glowColor: skyColors.accent,
    });
  }

  return clouds;
}

// Generate a smooth mountain range using layered curves
function generateMountainCurve(
  random: () => number,
  width: number,
  baseY: number,
  peakHeight: number,
  numPeaks: number
): number[] {
  // Generate height map for the mountain range
  const points: number[] = [];
  const segmentWidth = width / (numPeaks * 20);

  // Create major peaks
  const peaks: { x: number; height: number }[] = [];
  for (let i = 0; i < numPeaks; i++) {
    peaks.push({
      x: (width / numPeaks) * (i + 0.3 + random() * 0.4),
      height: peakHeight * (0.6 + random() * 0.4),
    });
  }

  // Generate smooth height values using influence from peaks
  for (let x = 0; x <= width; x += segmentWidth) {
    let height = 0;

    // Each peak contributes to the height based on distance
    for (const peak of peaks) {
      const dist = Math.abs(x - peak.x);
      const peakWidth = width / numPeaks * 0.8;
      const influence = Math.max(0, 1 - (dist / peakWidth) ** 1.5);
      height = Math.max(height, peak.height * influence);
    }

    // Add some noise for natural variation
    height += (random() - 0.5) * peakHeight * 0.1;

    points.push(baseY - Math.max(0, height));
  }

  return points;
}

// Generate layered mountains
function generateMountains(random: () => number, width: number, height: number): Mountain[] {
  const mountains: Mountain[] = [];

  // Far background mountains (layer 0) - misty, subtle
  const farBgHeights = generateMountainCurve(random, width, height * 0.75, height * 0.2, 5);
  mountains.push({
    peaks: farBgHeights.map((y, i) => ({ x: (i / (farBgHeights.length - 1)) * width, y })),
    color: '#1e4a5a',
    layer: 0,
  });

  // Background mountains (layer 1) - taller, more defined
  const bgHeights = generateMountainCurve(random, width, height * 0.8, height * 0.25, 4);
  mountains.push({
    peaks: bgHeights.map((y, i) => ({ x: (i / (bgHeights.length - 1)) * width, y })),
    color: '#153545',
    layer: 1,
  });

  // Midground mountains (layer 2) - prominent silhouettes
  const midHeights = generateMountainCurve(random, width, height * 0.85, height * 0.2, 3);
  mountains.push({
    peaks: midHeights.map((y, i) => ({ x: (i / (midHeights.length - 1)) * width, y })),
    color: '#0f2530',
    layer: 2,
  });

  // Foreground cliffs (layer 3) - frame the scene
  // Left cliff with smooth curve
  const leftCliff: { x: number; y: number }[] = [];
  const leftWidth = width * 0.15;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = t * leftWidth;
    // Smooth curve that rises then falls
    const curveHeight = Math.sin(t * Math.PI) * height * 0.3;
    const y = height - curveHeight * (1 - t * 0.5);
    leftCliff.push({ x, y: Math.min(y, height) });
  }
  mountains.push({
    peaks: leftCliff,
    color: '#0a1a22',
    layer: 3,
  });

  // Right cliff with smooth curve
  const rightCliff: { x: number; y: number }[] = [];
  const rightStart = width * 0.85;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = rightStart + t * (width * 0.15);
    // Smooth curve
    const curveHeight = Math.sin((1 - t) * Math.PI) * height * 0.35;
    const y = height - curveHeight * (0.5 + t * 0.5);
    rightCliff.push({ x, y: Math.min(y, height) });
  }
  mountains.push({
    peaks: rightCliff,
    color: '#0a1a22',
    layer: 3,
  });

  return mountains;
}

// Generate trees on cliffs
function generateTrees(random: () => number, width: number, height: number): Tree[] {
  const trees: Tree[] = [];

  // Trees on left cliff
  for (let i = 0; i < 3; i++) {
    trees.push({
      x: width * (0.02 + random() * 0.06),
      y: height * (0.75 + random() * 0.05),
      height: 15 + random() * 25,
      color: '#1a4a2a',
    });
  }

  // Trees on right cliff
  for (let i = 0; i < 3; i++) {
    trees.push({
      x: width * (0.92 + random() * 0.06),
      y: height * (0.72 + random() * 0.06),
      height: 15 + random() * 25,
      color: '#1a4a2a',
    });
  }

  return trees;
}

// Generate shooting stars
function generateShootingStars(random: () => number, width: number, height: number): ShootingStar[] {
  const shootingStars: ShootingStar[] = [];
  const count = 2 + Math.floor(random() * 3);

  for (let i = 0; i < count; i++) {
    shootingStars.push({
      x: width * (0.2 + random() * 0.6),
      y: height * (0.1 + random() * 0.3),
      length: 30 + random() * 80,
      angle: Math.PI * (0.5 + random() * 0.5), // Diagonal down
      brightness: 0.5 + random() * 0.5,
    });
  }

  return shootingStars;
}

/**
 * Generate background state based on domain name
 */
export function generateBackgroundState(
  domainName: string,
  width: number,
  height: number
): BackgroundState {
  const seed = hashString(domainName);
  const random = seededRandom(seed);
  const skyColors = generateSkyColors(random);

  return {
    stars: generateStars(random, width, height),
    moon: generateMoon(random, width, height, skyColors),
    clouds: generateClouds(random, width, height, skyColors),
    mountains: generateMountains(random, width, height),
    trees: generateTrees(random, width, height),
    shootingStars: generateShootingStars(random, width, height),
    skyColors,
    seed,
  };
}

// ============= Drawing Functions =============

function drawPixelStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  brightness: number
): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = brightness;

  const px = Math.floor(x);
  const py = Math.floor(y);

  if (size === 1) {
    ctx.fillRect(px, py, 2, 2);
  } else if (size === 2) {
    ctx.fillRect(px, py, 3, 3);
    ctx.globalAlpha = brightness * 0.5;
    ctx.fillRect(px - 1, py + 1, 1, 1);
    ctx.fillRect(px + 3, py + 1, 1, 1);
    ctx.fillRect(px + 1, py - 1, 1, 1);
    ctx.fillRect(px + 1, py + 3, 1, 1);
  } else {
    // Large star with glow
    ctx.fillRect(px, py, 4, 4);
    ctx.globalAlpha = brightness * 0.6;
    ctx.fillRect(px - 1, py + 1, 1, 2);
    ctx.fillRect(px + 4, py + 1, 1, 2);
    ctx.fillRect(px + 1, py - 1, 2, 1);
    ctx.fillRect(px + 1, py + 4, 2, 1);
    ctx.globalAlpha = brightness * 0.3;
    ctx.fillRect(px - 2, py + 1, 1, 2);
    ctx.fillRect(px + 5, py + 1, 1, 2);
  }

  ctx.globalAlpha = 1;
}

function drawMoon(ctx: CanvasRenderingContext2D, moon: Moon): void {
  const { x, y, radius, glowColor } = moon;
  const px = Math.floor(x);
  const py = Math.floor(y);
  const r = Math.floor(radius);

  // Outer glow layers
  for (let layer = 4; layer >= 1; layer--) {
    const glowR = r + layer * 15;
    ctx.globalAlpha = 0.05 * (5 - layer);
    ctx.fillStyle = glowColor;

    // Pixelated circle for glow
    for (let dy = -glowR; dy <= glowR; dy += 4) {
      for (let dx = -glowR; dx <= glowR; dx += 4) {
        if (dx * dx + dy * dy <= glowR * glowR) {
          ctx.fillRect(px + dx, py + dy, 4, 4);
        }
      }
    }
  }

  // Moon body - pixelated circle
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#c8d8e8';

  for (let dy = -r; dy <= r; dy += 2) {
    for (let dx = -r; dx <= r; dx += 2) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(px + dx, py + dy, 2, 2);
      }
    }
  }

  // Moon highlights/craters
  ctx.fillStyle = '#e8f0f8';
  ctx.globalAlpha = 0.5;
  for (let dy = -r * 0.6; dy <= r * 0.4; dy += 2) {
    for (let dx = -r * 0.5; dx <= r * 0.3; dx += 2) {
      if (dx * dx + dy * dy <= (r * 0.7) * (r * 0.7)) {
        ctx.fillRect(px + dx - r * 0.1, py + dy - r * 0.1, 2, 2);
      }
    }
  }

  ctx.globalAlpha = 1;
}

function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud, random: () => number): void {
  const { x, y, width, height, color, glowColor } = cloud;
  const pixelSize = 4;

  // Cloud edge glow
  ctx.fillStyle = glowColor;
  ctx.globalAlpha = 0.15;

  for (let py = 0; py < height + 8; py += pixelSize) {
    for (let px = 0; px < width + 8; px += pixelSize) {
      const nx = (px - width / 2) / (width / 2);
      const ny = (py - height / 2) / (height / 2);
      const dist = Math.sqrt(nx * nx * 0.5 + ny * ny);

      if (dist < 1.2 && random() > dist * 0.5) {
        ctx.fillRect(Math.floor(x + px - 4), Math.floor(y + py - 4), pixelSize, pixelSize);
      }
    }
  }

  // Cloud body with dithered edges
  ctx.fillStyle = color;

  for (let py = 0; py < height; py += pixelSize) {
    for (let px = 0; px < width; px += pixelSize) {
      const nx = (px - width / 2) / (width / 2);
      const ny = (py - height / 2) / (height / 2);
      const dist = Math.sqrt(nx * nx * 0.5 + ny * ny);

      if (dist < 1) {
        const edgeFade = 1 - dist;
        ctx.globalAlpha = Math.min(1, edgeFade * 2) * 0.8;

        if (random() > dist * 0.3) {
          ctx.fillRect(Math.floor(x + px), Math.floor(y + py), pixelSize, pixelSize);
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}

function drawMountain(ctx: CanvasRenderingContext2D, mountain: Mountain, canvasHeight: number): void {
  const { peaks, color, layer } = mountain;
  if (peaks.length < 2) return;

  // Pixel size varies by layer - farther = smaller pixels for detail
  const pixelSize = layer <= 1 ? 2 : 3;

  ctx.fillStyle = color;

  // Draw as filled polygon with pixel-stepped edges
  ctx.beginPath();
  ctx.moveTo(Math.floor(peaks[0].x), canvasHeight);

  // Create stepped/pixelated mountain silhouette
  for (let i = 0; i < peaks.length; i++) {
    const curr = peaks[i];
    const currX = Math.floor(curr.x / pixelSize) * pixelSize;
    const currY = Math.floor(curr.y / pixelSize) * pixelSize;

    if (i === 0) {
      ctx.lineTo(currX, currY);
    } else {
      const prev = peaks[i - 1];
      const prevX = Math.floor(prev.x / pixelSize) * pixelSize;
      const prevY = Math.floor(prev.y / pixelSize) * pixelSize;

      // Create stepped line between points
      const steps = Math.max(1, Math.floor(Math.abs(currX - prevX) / pixelSize));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const stepX = Math.floor((prevX + (currX - prevX) * t) / pixelSize) * pixelSize;
        const stepY = Math.floor((prevY + (currY - prevY) * t) / pixelSize) * pixelSize;
        ctx.lineTo(stepX, stepY);
      }
    }
  }

  ctx.lineTo(Math.floor(peaks[peaks.length - 1].x), canvasHeight);
  ctx.closePath();
  ctx.fill();

  // Add subtle highlight on mountain tops for depth (only on mid layers)
  if (layer === 1 || layer === 2) {
    ctx.strokeStyle = `rgba(100, 180, 220, ${layer === 1 ? 0.1 : 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < peaks.length; i++) {
      const curr = peaks[i];
      const currX = Math.floor(curr.x / pixelSize) * pixelSize;
      const currY = Math.floor(curr.y / pixelSize) * pixelSize;

      if (i === 0) {
        ctx.moveTo(currX, currY);
      } else {
        ctx.lineTo(currX, currY);
      }
    }

    ctx.stroke();
  }
}

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree): void {
  const { x, y, height: h, color } = tree;
  const px = Math.floor(x);
  const py = Math.floor(y);
  const pixelSize = 3;

  // Simple triangular tree shape
  ctx.fillStyle = color;

  // Tree trunk
  ctx.fillRect(px, py, pixelSize, pixelSize * 2);

  // Foliage - triangular
  const layers = Math.ceil(h / 8);
  for (let layer = 0; layer < layers; layer++) {
    const layerY = py - (layer + 1) * 8;
    const layerWidth = (layers - layer) * 2 + 1;
    const startX = px - Math.floor(layerWidth / 2) * pixelSize + pixelSize / 2;

    for (let i = 0; i < layerWidth; i++) {
      ctx.fillRect(startX + i * pixelSize, layerY, pixelSize, 10);
    }
  }
}

function drawShootingStar(ctx: CanvasRenderingContext2D, star: ShootingStar): void {
  const { x, y, length, angle, brightness } = star;
  const segments = Math.ceil(length / 4);

  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const px = Math.floor(x - Math.cos(angle) * (length * t));
    const py = Math.floor(y + Math.sin(angle) * (length * t));
    const alpha = brightness * (1 - t * 0.9);

    if (i === 0) {
      // Bright head
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = brightness;
      ctx.fillRect(px, py, 4, 4);

      // Glow around head
      ctx.fillStyle = '#ffd700';
      ctx.globalAlpha = brightness * 0.6;
      ctx.fillRect(px - 2, py + 1, 2, 2);
      ctx.fillRect(px + 4, py + 1, 2, 2);
      ctx.fillRect(px + 1, py - 2, 2, 2);
      ctx.fillRect(px + 1, py + 4, 2, 2);
    } else {
      // Trail
      ctx.fillStyle = '#ffd700';
      ctx.globalAlpha = alpha;
      const size = Math.max(2, 4 - Math.floor(i / 3));
      ctx.fillRect(px, py, size, size);
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Render the complete background to canvas
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  state: BackgroundState,
  time: number = 0
): void {
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, state.skyColors.top);
  gradient.addColorStop(0.4, state.skyColors.mid);
  gradient.addColorStop(0.8, state.skyColors.bottom);
  gradient.addColorStop(1, COLORS.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Stars with twinkling
  for (const star of state.stars) {
    const twinkle = 0.7 + 0.3 * Math.sin(time * 0.002 + star.twinklePhase);
    drawPixelStar(ctx, star.x, star.y, star.size, star.color, star.brightness * twinkle);
  }

  // Shooting stars
  for (const shootingStar of state.shootingStars) {
    drawShootingStar(ctx, shootingStar);
  }

  // Moon
  drawMoon(ctx, state.moon);

  // Clouds (behind mountains)
  for (const cloud of state.clouds) {
    const cloudRandom = seededRandom(state.seed + cloud.x + cloud.y);
    drawCloud(ctx, cloud, cloudRandom);
  }

  // Mountains (layered, back to front)
  const sortedMountains = [...state.mountains].sort((a, b) => a.layer - b.layer);
  for (const mountain of sortedMountains) {
    drawMountain(ctx, mountain, height);
  }

  // Trees
  for (const tree of state.trees) {
    drawTree(ctx, tree);
  }
}
