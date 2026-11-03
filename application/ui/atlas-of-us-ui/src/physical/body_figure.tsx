import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import type { RegionId } from './body_regions';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

type Side = 'front' | 'back';

//the shapes of each region on each side, drawn on a 200 by 440 figure. Ones drawn later sit on top, so the face is last
const SHAPES: { region: RegionId; sides: Side[]; shapes: ReactNode }[] = [
  {
    region: 'arms',
    sides: ['front', 'back'],
    shapes: (
      <>
        <path d="M44,116 L62,119 L52,250 L33,247 Z" />
        <path d="M156,116 L138,119 L148,250 L167,247 Z" />
      </>
    ),
  },
  {
    region: 'hands',
    sides: ['front', 'back'],
    shapes: (
      <>
        <ellipse cx="41" cy="265" rx="11" ry="16" />
        <ellipse cx="159" cy="265" rx="11" ry="16" />
      </>
    ),
  },
  {
    region: 'legs',
    sides: ['front', 'back'],
    shapes: (
      <>
        <path d="M72,272 L99,272 L96,405 L77,405 Z" />
        <path d="M101,272 L128,272 L123,405 L104,405 Z" />
      </>
    ),
  },
  {
    region: 'feet',
    sides: ['front', 'back'],
    shapes: (
      <>
        <ellipse cx="85" cy="418" rx="14" ry="8" />
        <ellipse cx="115" cy="418" rx="14" ry="8" />
      </>
    ),
  },
  { region: 'chest', sides: ['front'], shapes: <path d="M70,104 Q100,94 130,104 L128,175 L72,175 Z" /> },
  { region: 'abdomen', sides: ['front'], shapes: <path d="M72,175 L128,175 L128,236 L72,236 Z" /> },
  { region: 'back', sides: ['back'], shapes: <path d="M70,104 Q100,94 130,104 L128,236 L72,236 Z" /> },
  { region: 'pelvis', sides: ['front', 'back'], shapes: <path d="M72,236 L128,236 L130,274 L100,282 L70,274 Z" /> },
  {
    region: 'shoulders',
    sides: ['front', 'back'],
    shapes: (
      <>
        <ellipse cx="60" cy="110" rx="17" ry="11" />
        <ellipse cx="140" cy="110" rx="17" ry="11" />
      </>
    ),
  },
  { region: 'neck', sides: ['front', 'back'], shapes: <rect x="88" y="78" width="24" height="22" rx="4" /> },
  { region: 'head', sides: ['front', 'back'], shapes: <ellipse cx="100" cy="44" rx="30" ry="36" /> },
  {
    region: 'ears',
    sides: ['front', 'back'],
    shapes: (
      <>
        <ellipse cx="69" cy="46" rx="5" ry="10" />
        <ellipse cx="131" cy="46" rx="5" ry="10" />
      </>
    ),
  },
  {
    region: 'eyes',
    sides: ['front'],
    shapes: (
      <>
        <ellipse cx="88" cy="38" rx="7" ry="5" />
        <ellipse cx="112" cy="38" rx="7" ry="5" />
      </>
    ),
  },
  { region: 'mouth', sides: ['front'], shapes: <ellipse cx="100" cy="60" rx="10" ry="12" /> },
];

interface BodyFigureProps {
  labels: Record<RegionId, string>;
  noted: Set<RegionId>; //regions with something the user has noted
  selected: RegionId | null;
  onSelect: (region: RegionId) => void;
}

//the body from the front and the back, each region a button
export function BodyFigure({ labels, noted, selected, onSelect }: BodyFigureProps) {
  const figure = (side: Side) => (
    <figure style={styles.figure}>
      <svg viewBox="0 0 200 440" style={styles.svg} role="group" aria-label={`The body from the ${side}`}>
        {SHAPES.filter((s) => s.sides.includes(side)).map((s) => {
          const fill = s.region === selected ? 'var(--air-force-blue)' : noted.has(s.region) ? 'var(--pale-red)' : ivory;
          const key = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(s.region);
            }
          };
          return (
            <g
              key={s.region}
              role="button"
              tabIndex={0}
              aria-label={labels[s.region]}
              aria-pressed={s.region === selected}
              style={styles.region}
              fill={fill}
              stroke={s.region === selected ? brownRed : gunmetal}
              strokeWidth={s.region === selected ? 4 : 2.5}
              strokeLinejoin="round"
              onClick={() => onSelect(s.region)}
              onKeyDown={key}
            >
              <title>{labels[s.region]}</title>
              {s.shapes}
            </g>
          );
        })}
      </svg>
      <figcaption style={styles.caption}>{side === 'front' ? 'Front' : 'Back'}</figcaption>
    </figure>
  );
  return (
    <div style={styles.figures}>
      {figure('front')}
      {figure('back')}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  figures: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  figure: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  svg: {
    width: 'min(42vw, 200px)',
    height: 'auto',
    overflow: 'visible',
  },
  region: {
    cursor: 'pointer',
  },
  caption: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
};
