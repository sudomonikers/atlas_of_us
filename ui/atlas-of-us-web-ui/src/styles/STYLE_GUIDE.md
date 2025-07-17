# Atlas of Us - Style Guide

## Brand Identity

**Vision**: Amazed users experiencing the beauty of space - ethereal, beautiful, and cosmic
**Theme**: Dark space aesthetic with gentle, floating animations
**Personality**: Ethereal, spacious, futuristic, awe-inspiring

## Color System

### Primary Palette
```css
/* Cosmic Purples */
--violet-deep: #667eea;
--violet-bright: #764ba2;
--violet-accent: #6c5ce7;

/* Space Blues */
--nebula-blue: #9bb5ff;
--cosmic-blue: #3300ff;

/* Stellar Accents */
--star-green: #00ff99;
--pulsar-pink: #ff00cc;
```

### Neutral Palette
```css
/* Backgrounds */
--void-dark: #242424;
--space-black: #000000;
--cosmos-light: #ffffff;

/* Text Colors */
--star-text: rgba(255, 255, 255, 0.87);
--moon-text: rgba(255, 255, 255, 0.6);
--shadow-text: #333333;
--dim-text: #666666;

/* UI Elements */
--glass-border: rgba(155, 181, 255, 0.3);
--card-backdrop: rgba(0, 0, 0, 0.8);
```

### Gradient Combinations
```css
/* Primary Gradient */
--gradient-cosmic: linear-gradient(135deg, var(--violet-deep), var(--violet-bright));

/* Button Gradients */
--gradient-stellar: linear-gradient(45deg, var(--star-green), var(--pulsar-pink));
--gradient-nebula: linear-gradient(45deg, var(--nebula-blue), var(--cosmic-blue));
```

## Typography

### Font Stack
```css
/* Primary Font - Headings & Display */
--font-primary: 'Mochiy Pop One', cursive;

/* Secondary Font - Body & Readable Text */
--font-secondary: 'Inter', 'Helvetica Neue', sans-serif;

/* Monospace - Technical Elements */
--font-mono: 'Courier New', monospace;

/* Special Fonts */
--font-quotes: 'Inter', italic;
--font-captions: 'Inter', sans-serif;
```

### Type Scale
```css
/* Heading Sizes */
--text-h1: 3.5rem;    /* Hero text */
--text-h2: 2.5rem;    /* Section headings */
--text-h3: 1.8rem;    /* Subsection headings */
--text-h4: 1.4rem;    /* Component headings */

/* Body Sizes */
--text-body: 1rem;
--text-body-large: 1.1rem;
--text-small: 0.9rem;
--text-caption: 0.8rem;

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.7;
```

## Spacing System

### Spacious Cosmic Scale
```css
/* Base spacing unit */
--space-unit: 1rem;

/* Spacing Scale */
--space-xs: 0.5rem;   /* 8px */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 2rem;     /* 32px */
--space-xl: 3rem;     /* 48px */
--space-2xl: 4rem;    /* 64px */
--space-3xl: 6rem;    /* 96px */
```

### Layout Containers
```css
/* Responsive container widths */
--container-sm: 90vw;
--container-md: 85vw;
--container-lg: 80vw;
--container-max: 1400px;
```

## Animation System

### Timing & Easing
```css
/* Durations */
--duration-instant: 0.1s;
--duration-fast: 0.2s;
--duration-normal: 0.3s;
--duration-slow: 0.5s;
--duration-gentle: 0.8s;

/* Easing Functions */
--ease-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-float: cubic-bezier(0.4, 0, 0.2, 1);
--ease-cosmic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Animation Patterns
```css
/* Gentle Floating */
@keyframes gentle-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Cosmic Glow */
@keyframes cosmic-glow {
  0%, 100% { box-shadow: 0 0 20px var(--violet-accent); }
  50% { box-shadow: 0 0 30px var(--violet-accent), 0 0 40px var(--violet-deep); }
}

/* Stellar Shimmer */
@keyframes stellar-shimmer {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}
```

## Glass-Morphism System

### Glass Effects
```css
/* Moderate glass-morphism */
--glass-backdrop: rgba(0, 0, 0, 0.4);
--glass-border: 1px solid rgba(255, 255, 255, 0.1);
--glass-blur: blur(10px);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

/* Glass component base */
.glass-panel {
  background: var(--glass-backdrop);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
  border-radius: 12px;
}
```

## Component System

### Buttons
```css
/* Primary cosmic button */
.btn-cosmic {
  background: var(--gradient-cosmic);
  color: var(--star-text);
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: 8px;
  font-family: var(--font-secondary);
  font-weight: 500;
  transition: all var(--duration-normal) var(--ease-gentle);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-cosmic:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  animation: cosmic-glow var(--duration-gentle) ease-in-out;
}

/* Glass button */
.btn-glass {
  background: var(--glass-backdrop);
  color: var(--star-text);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  padding: var(--space-sm) var(--space-lg);
  border-radius: 8px;
  font-family: var(--font-secondary);
  transition: all var(--duration-normal) var(--ease-gentle);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
```

### Cards
```css
/* Cosmic glass card */
.card-cosmic {
  background: var(--glass-backdrop);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  border-radius: 16px;
  padding: var(--space-lg);
  box-shadow: var(--glass-shadow);
  transition: all var(--duration-normal) var(--ease-gentle);
}

.card-cosmic:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}
```

### Interactive Elements
```css
/* Particle effects around interactive elements */
.interactive-particle {
  position: relative;
  overflow: hidden;
}

.interactive-particle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, 
    rgba(255, 255, 255, 0.1) 0%, 
    transparent 70%);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-gentle);
}

.interactive-particle:hover::before {
  opacity: 1;
  animation: stellar-shimmer var(--duration-gentle) ease-in-out infinite;
}
```

## Loading States

### Cosmic Loading Animations
```css
/* Orbiting dots loader */
.loader-orbit {
  position: relative;
  width: 40px;
  height: 40px;
}

.loader-orbit::before,
.loader-orbit::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--violet-accent);
  animation: orbit 1.5s linear infinite;
}

.loader-orbit::after {
  animation-delay: -0.75s;
}

@keyframes orbit {
  0% { transform: rotate(0deg) translateX(16px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(16px) rotate(-360deg); }
}

/* Pulsing constellation */
.loader-constellation {
  display: flex;
  gap: 4px;
}

.loader-constellation span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--star-green);
  animation: stellar-pulse 1.2s ease-in-out infinite;
}

.loader-constellation span:nth-child(2) { animation-delay: 0.2s; }
.loader-constellation span:nth-child(3) { animation-delay: 0.4s; }

@keyframes stellar-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile first approach */
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

### Grid System
```css
/* Flexible grid using CSS Grid */
.grid-cosmic {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Responsive containers */
.container-cosmic {
  width: min(var(--container-lg), var(--container-max));
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

## Accessibility Notes

- Focus states use cosmic glow effects
- Maintain readable text contrast in space theme
- Provide reduced motion alternatives for animations
- Use semantic HTML structure
- Include ARIA labels where appropriate

## Usage Guidelines

1. **Spacing**: Use the spacious scale consistently - prefer larger gaps
2. **Animation**: Keep general UI animations gentle and floating
3. **Glass Effects**: Apply moderately - not every element needs glass
4. **Typography**: Use primary font for headings, secondary for body text
5. **Colors**: Stick to the cosmic palette, use descriptive names
6. **Interactions**: Add subtle particle effects to interactive elements

## Implementation Priority

1. **Phase 1**: Implement color system and typography scale
2. **Phase 2**: Create glass-morphism components (buttons, cards)
3. **Phase 3**: Add gentle animations and particle effects
4. **Phase 4**: Implement loading states and enhanced interactions
5. **Phase 5**: Full responsive system and accessibility improvements