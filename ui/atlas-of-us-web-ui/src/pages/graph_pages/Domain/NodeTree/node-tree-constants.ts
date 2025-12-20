// Visual constants for the node tree canvas

export const LAYOUT = {
  LEVEL_SPACING: 500,      // Horizontal space between level centers
  NODE_SPACING_X: 130,     // Horizontal space between nodes in grid
  NODE_SPACING_Y: 105,     // Vertical space between nodes
  SECTION_GAP: 70,         // Gap between node type sections
  PADDING: 150,            // Canvas edge padding
  LEVEL_HEADER_OFFSET: 110,// Space below level header
  MAX_NODES_PER_ROW: 3,    // Max nodes per row in a section
};

export const NODE_RADIUS = {
  level: 45,
  knowledge: 28,
  skill: 28,
  trait: 25,
  milestone: 30,
};

export const COLORS = {
  // Background - dark mystical
  background: '#0d0d15',
  backgroundAlt: '#121220',
  gridLine: 'rgba(100, 200, 255, 0.03)',

  // Node colors - ethereal glowing palette
  knowledge: '#64dfdf',     // cyan/teal
  skill: '#80ffdb',         // bright mint
  trait: '#c77dff',         // soft purple
  milestone: '#FFD700',     // yellow
  level: '#48bfe3',         // sky blue

  // Node glow colors - intense halos
  knowledgeGlow: 'rgba(100, 223, 223, 0.6)',
  skillGlow: 'rgba(128, 255, 219, 0.6)',
  traitGlow: 'rgba(199, 125, 255, 0.6)',
  milestoneGlow: 'rgba(255, 215, 0, 0.6)',
  levelGlow: 'rgba(72, 191, 227, 0.6)',

  // Connection lines - subtle energy
  connectionMain: 'rgba(100, 223, 223, 0.4)',
  connectionBranch: 'rgba(100, 223, 223, 0.15)',

  // States
  selectedGlow: 'rgba(255, 255, 255, 0.8)',
  hoverGlow: 'rgba(200, 255, 255, 0.5)',

  // Text
  labelText: 'rgba(255, 255, 255, 0.95)',
  labelTextDim: 'rgba(200, 230, 255, 0.7)',
};

export const CAMERA = {
  INITIAL_ZOOM: 0.7,
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2.0,
  ZOOM_SPEED: 0.1,
};

export const ANIMATION = {
  GLOW_PULSE_DURATION: 2000,
};

export const FONTS = {
  label: '12px Inter, sans-serif',
  labelLarge: '14px Inter, sans-serif',
  header: '16px "Mochiy Pop One", cursive',
  levelName: '11px Inter, sans-serif',
};
