import type { CSSProperties } from 'react';
import { brownRed, comic, gunmetal, ivory } from './palette';

// How someone fits a few things at once, drawn as one picture: them on the left, the things about them that matter down
// the middle, and what they're being fitted to on the right, with a line from each thing about them to each target that
// takes it. Green where they're ahead of what it takes, red dashed where they're short, and red dotted where something
// they live with can reach it. It knows nothing about what the items and targets are: abilities and skills, traits and
// jobs. The owner works out the standings and the order the items go in.

const green = '#2f9a5a';

//where someone stands on an item a target takes
export type Standing = 'ahead' | 'short' | 'affected';

//a thing about them: its value from 0 to 1, shown out of 100, or what can affect it, shown in its place
export interface FitItem {
  name: string;
  value?: number;
  affectedBy?: string;
}

export interface FitTarget {
  id: string;
  name: string;
}

//a target that takes an item, how they stand on it, and how much it matters to the target, 0 to 1
export interface FitLink {
  item: string; //the item's name
  target: string; //the target's id
  standing: Standing;
  strength: number;
}

interface FitGraphProps {
  who: string; //their name, in the circle on the left
  items: FitItem[]; //in the order they go down the middle
  targets: FitTarget[];
  links: FitLink[];
  focus?: string[]; //the ids of the targets picked out; the rest step back
  labels?: Partial<Record<Standing, string>>; //the legend's words for each kind of line
  label: string; //what the picture shows, for screen readers
}

const LOOK: Record<Standing, { colour: string; dash?: string; label: string }> = {
  ahead: { colour: green, label: 'Ahead of what it takes' },
  short: { colour: brownRed, dash: '12 8', label: 'Short of what it takes' },
  affected: { colour: brownRed, dash: '2 8', label: 'Can be affected by what you live with' },
};

//the drawing's own space, which scales to fit its box
const W = 1000;
const ROW = 38;
const BOX = { x: 290, w: 290, h: 32 };
const TARGET_X = 860;
const TARGET_R = 62;

export function FitGraph({ who, items, targets, links, focus, labels, label }: FitGraphProps) {
  const height = Math.max(items.length * ROW, targets.length * 170) + 20;
  const rowY = (i: number) => (height - items.length * ROW) / 2 + i * ROW + ROW / 2;
  const targetY = (i: number) => (height / targets.length) * (i + 0.5);
  const index = new Map(items.map((item, i) => [item.name, i]));
  const inFocus = (id: string) => !focus || focus.includes(id);
  const words = (standing: Standing) => labels?.[standing] ?? LOOK[standing].label;

  return (
    <div style={styles.column}>
      <svg viewBox={`0 0 ${W} ${height}`} style={styles.svg} role="img" aria-label={label}>
        {items.map((item, i) => (
          <path key={item.name} d={`M 150 ${height / 2} C 220 ${height / 2}, 220 ${rowY(i)}, ${BOX.x} ${rowY(i)}`} fill="none" stroke={gunmetal} strokeWidth={2} opacity={0.3} />
        ))}
        {links.map((link) => {
          const at = index.get(link.item);
          const target = targets.findIndex((t) => t.id === link.target);
          if (at === undefined || target < 0) return null;
          const [y0, y1] = [rowY(at), targetY(target)];
          const look = LOOK[link.standing];
          return (
            <path
              key={`${link.target}:${link.item}`}
              d={`M ${BOX.x + BOX.w} ${y0} C ${BOX.x + BOX.w + 120} ${y0}, ${TARGET_X - 160} ${y1}, ${TARGET_X - TARGET_R - 4} ${y1}`}
              fill="none"
              stroke={look.colour}
              strokeWidth={2 + link.strength * 5}
              strokeDasharray={look.dash}
              strokeLinecap="round"
              opacity={inFocus(link.target) ? 0.85 : 0.12}
              style={styles.fade}
            >
              <title>{`${targets[target].name} takes ${link.item}: ${words(link.standing).toLowerCase()}`}</title>
            </path>
          );
        })}

        <circle cx={100} cy={height / 2} r={50} fill="var(--cinnamon-wood)" stroke={gunmetal} strokeWidth={4} />
        <text x={100} y={height / 2 + 9} textAnchor="middle" style={styles.who}>
          {who}
        </text>

        {items.map((item, i) => (
          <g key={item.name} transform={`translate(${BOX.x} ${rowY(i) - BOX.h / 2})`}>
            <rect width={BOX.w} height={BOX.h} rx={10} fill={item.affectedBy ? 'var(--pale-cinnamon)' : '#fff'} stroke={gunmetal} strokeWidth={3} strokeDasharray={item.affectedBy ? '6 5' : undefined} />
            <text x={12} y={22} style={styles.item}>
              {item.name}
            </text>
            <text x={BOX.w - 12} y={22} textAnchor="end" style={{ ...styles.value, fill: item.affectedBy ? brownRed : gunmetal }}>
              {item.affectedBy ?? (item.value === undefined ? '' : Math.round(item.value * 100))}
            </text>
          </g>
        ))}

        {targets.map((target, i) => {
          const its = links.filter((l) => l.target === target.id);
          const ahead = its.filter((l) => l.standing === 'ahead').length;
          const gaps = its.length - ahead;
          const y = targetY(i);
          return (
            <g key={target.id} opacity={inFocus(target.id) ? 1 : 0.3} style={styles.fade}>
              <circle cx={TARGET_X} cy={y} r={TARGET_R} fill={ivory} stroke={gunmetal} strokeWidth={4} />
              <text x={TARGET_X} y={y + 7} textAnchor="middle" style={styles.target}>
                {target.name}
              </text>
              <text x={TARGET_X} y={y + TARGET_R + 24} textAnchor="middle" style={{ ...styles.value, fill: gaps ? brownRed : green }}>
                {`${ahead} strength${ahead === 1 ? '' : 's'}, ${gaps} gap${gaps === 1 ? '' : 's'}`}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={styles.legend}>
        {(Object.keys(LOOK) as Standing[]).filter((standing) => links.some((l) => l.standing === standing)).map((standing) => (
          <span key={standing} style={styles.legendItem}>
            <svg width={44} height={12} aria-hidden>
              <path d="M 4 6 H 40" stroke={LOOK[standing].colour} strokeWidth={5} strokeDasharray={LOOK[standing].dash} strokeLinecap="round" />
            </svg>
            {words(standing)}
          </span>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  //fills the box it's given, the drawing shrinking to fit above the legend
  column: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  svg: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    marginTop: 8,
  },
  fade: {
    transition: 'opacity 0.4s',
  },
  who: {
    fontFamily: comic,
    fontSize: 26,
    letterSpacing: 1,
    fill: ivory,
  },
  item: {
    fontFamily: 'var(--font-hand)',
    fontSize: 19,
    fill: gunmetal,
  },
  value: {
    fontFamily: 'var(--font-hand)',
    fontSize: 17,
  },
  target: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    fill: gunmetal,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 18px',
    marginTop: 6,
    fontSize: 16,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};
