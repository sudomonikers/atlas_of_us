import { memo, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum } from 'd3-force';
import type { BoardLayout, BoardNode, Point, View } from './board_layout';

//STYLE_GUIDE.md palette, defined as variables in App.css
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//a node's radius, and how far it can be zoomed out and in
const R = 18;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;
//how far a press can wander and still be a tap, and how close two taps make a double tap
const TAP_SLOP = 5;
const DOUBLE_TAP_MS = 350;
//labels longer than this are cut short, with the whole name on hover, and zoomed out further than LABEL_ZOOM only the
//selected node and the ones linked to it are labelled
const LABEL_MAX = 24;
const LABEL_ZOOM = 0.6;

//a hand-drawn blob of radius R, centred on 0,0
const BLOB = 'M0 -18 C11 -18.5 18.5 -10 18 0 C17.5 11 10 18.5 0 18 C-11 17.5 -18.5 10 -18 0 C-17.5 -10.5 -10 -18 0 -18 Z';
//a hand-drawn diamond of about the same size
const DIAMOND = 'M0 -21 C6 -14.5 14 -6.5 21 0 C14.5 6 6.5 14 0 21 C-6 14.5 -14 6.5 -21 0 C-14.5 -6 -6.5 -14 0 -21 Z';
const SHAPES = { blob: BLOB, diamond: DIAMOND };
const FILLS = { filled: cinnamon, hollow: ivory, pale: paleBlue, warm: paleRed };

export interface BoardLink {
  from: string;
  to: string; //where the arrow points, on a kind with arrows
  kind: string;
  weight?: number; //0 to 1, drawn as a thicker line
}

//a kind of link, and how it's drawn
export interface LinkKind {
  id: string;
  label: string;
  line: 'solid' | 'dashed' | 'dotted';
  arrow: boolean;
  colour: string;
  length: number; //how long the line likes to be
}

interface Spring extends SimulationLinkDatum<Point> {
  length: number;
}

interface GraphBoardProps {
  label: string; //what the board shows, for screen readers
  nodes: BoardNode[];
  links: BoardLink[];
  kinds: LinkKind[];
  layout: BoardLayout;
  selected?: string;
  focus?: { id: string }; //glides to that node each time a new one is passed
  describe?: (node: BoardNode) => string; //a node's name for screen readers, which is its label without it
  onSelect: (id?: string) => void;
  onExpand: (id: string) => void;
  onClear?: () => void;
  empty?: ReactNode; //shown in the middle while the board has nothing on it
  children?: ReactNode; //sits over the board's top left corner, such as a search box
}

//a board of nodes and the links between them that the user moves around, in the style of Neo4j Bloom. Nodes push
//apart and links pull them together until they settle. Drag the background to pan, scroll or pinch to zoom, drag a node
//to pin it where it's dropped, tap one to select it and double tap to expand it. The owner decides what's on the board
//and what expanding does
export function GraphBoard({ label, nodes, links, kinds, layout, selected, focus, describe, onSelect, onExpand, onClear, empty, children }: GraphBoardProps) {
  const svg = useRef<SVGSVGElement>(null);
  const sim = useRef<Simulation<Point, Spring>>(null);
  const shape = useRef(''); //the nodes and links the simulation was last given
  const glide = useRef(0); //the animation frame of a glide in progress
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ node?: string; start: { x: number; y: number }; moved: boolean }>(null);
  const lastTap = useRef<{ id: string; at: number }>(null);
  const frame = useRef(0); //a redraw waiting for the next frame
  const [, redraw] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hidden, setHidden] = useState<string[]>([]); //kinds of link toggled off in the legend
  const markers = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  //draws the board again at the next frame, however many times it's asked to before then
  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      redraw((n) => n + 1);
    });
  }, []);

  //the simulation lives as long as the board, and every tick draws it again
  useEffect(() => {
    const s = forceSimulation<Point, Spring>([])
      .force('charge', forceManyBody<Point>().strength(-340).distanceMax(600))
      .force('collide', forceCollide<Point>(R * 2.2))
      .force('x', forceX<Point>(0).strength(0.025))
      .force('y', forceY<Point>(0).strength(0.025))
      .on('tick', () => redraw((n) => n + 1));
    sim.current = s;
    return () => {
      s.stop();
      sim.current = null;
      shape.current = '';
    };
  }, []);

  //gives the simulation the nodes and links whenever they change, and stirs it so they find their places
  useEffect(() => {
    const s = sim.current;
    if (!s || size.w === 0) return;
    const key = nodes.map((n) => n.id).join() + '|' + links.map((l) => `${l.kind}:${l.from}:${l.to}`).join();
    if (key === shape.current) return;
    shape.current = key;
    const view = layout.current();
    layout.sync(nodes, { x: (size.w / 2 - view.x) / view.k, y: (size.h / 2 - view.y) / view.k });
    const length = new Map(kinds.map((k) => [k.id, k.length]));
    const springs: Spring[] = links
      .filter((l) => layout.at(l.from) && layout.at(l.to))
      .map((l) => ({ source: l.from, target: l.to, length: length.get(l.kind) ?? 100 }));
    s.nodes(layout.all());
    s.force('link', forceLink<Point, Spring>(springs).id((p) => p.id).distance((l) => l.length).strength(0.35));
    s.alpha(Math.max(s.alpha(), 0.6)).restart();
  }, [nodes, links, kinds, layout, size.w, size.h]);

  //centres the board the first time it's shown, and keeps track of its size
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      layout.centre(width, height);
      setSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout]);

  //moves the view smoothly to `to`
  const glideTo = (to: View) => {
    cancelAnimationFrame(glide.current);
    const from = layout.current();
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 320);
      const e = 1 - (1 - t) ** 3;
      layout.look({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, k: from.k + (to.k - from.k) * e });
      redraw((n) => n + 1);
      if (t < 1) glide.current = requestAnimationFrame(step);
    };
    glide.current = requestAnimationFrame(step);
  };

  const zoomAt = (px: number, py: number, factor: number) => {
    zoom(layout, px, py, factor);
    schedule();
  };

  //the wheel zooms the board rather than scrolling the page, which needs a listener that isn't passive
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(glide.current);
      const box = el.getBoundingClientRect();
      zoom(layout, e.clientX - box.left, e.clientY - box.top, Math.exp(-e.deltaY * 0.0015));
      schedule();
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [layout, schedule]);

  //glides to the focused node, each time a new focus is passed
  useEffect(() => {
    if (!focus || size.w === 0) return;
    const point = layout.at(focus.id);
    if (!point) return;
    const k = Math.max(layout.current().k, 0.9);
    glideTo({ x: size.w / 2 - (point.x ?? 0) * k, y: size.h / 2 - (point.y ?? 0) * k, k });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new focus moves the view, not a resize
  }, [focus, layout]);

  useEffect(
    () => () => {
      cancelAnimationFrame(glide.current);
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  //zooms to fit everything on the board
  const fit = () => {
    const points = layout.all();
    if (points.length === 0 || size.w === 0) return;
    const xs = points.map((p) => p.x ?? 0);
    const ys = points.map((p) => p.y ?? 0);
    const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = 90;
    const k = Math.min(1.4, Math.max(MIN_ZOOM, Math.min((size.w - pad * 2) / (right - left || 1), (size.h - pad * 2) / (bottom - top || 1))));
    glideTo({ x: size.w / 2 - ((left + right) / 2) * k, y: size.h / 2 - ((top + bottom) / 2) * k, k });
  };

  const local = (e: PointerEvent) => {
    const box = svg.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(glide.current);
    svg.current?.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const node = (e.target as Element).closest('[data-node]')?.getAttribute('data-node') ?? undefined;
    //a second finger turns whatever the first was doing into a pinch, which is never a tap
    gesture.current = pointers.current.size === 1 ? { node, start: p, moved: false } : { start: p, moved: true };
  };

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const before = pointers.current.get(e.pointerId);
    const g = gesture.current;
    if (!before || !g) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.entries()].slice(0, 2).map(([id, at]) => ({ now: at, then: id === e.pointerId ? before : at }));
      const apart = (u: { x: number; y: number }, v: { x: number; y: number }) => Math.hypot(u.x - v.x, u.y - v.y) || 1;
      const mid = { x: (a.now.x + b.now.x) / 2, y: (a.now.y + b.now.y) / 2 };
      const midThen = { x: (a.then.x + b.then.x) / 2, y: (a.then.y + b.then.y) / 2 };
      const view = layout.current();
      layout.look({ ...view, x: view.x + mid.x - midThen.x, y: view.y + mid.y - midThen.y });
      zoomAt(mid.x, mid.y, apart(a.now, b.now) / apart(a.then, b.then));
      return;
    }

    if (!g.moved && Math.hypot(p.x - g.start.x, p.y - g.start.y) < TAP_SLOP) return;
    g.moved = true;
    const view = layout.current();
    const point = g.node ? layout.at(g.node) : undefined;
    if (point) {
      point.fx = (p.x - view.x) / view.k;
      point.fy = (p.y - view.y) / view.k;
      sim.current?.alphaTarget(0.3).restart();
    } else {
      layout.look({ ...view, x: view.x + p.x - before.x, y: view.y + p.y - before.y });
    }
    schedule();
  };

  const up = (e: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    if (pointers.current.size > 0 || !g) return;
    gesture.current = null;
    sim.current?.alphaTarget(0);
    if (g.moved || e.type === 'pointercancel') return;
    if (!g.node) return onSelect(undefined);
    const now = performance.now();
    if (lastTap.current?.id === g.node && now - lastTap.current.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      onExpand(g.node);
    } else {
      lastTap.current = { id: g.node, at: now };
      onSelect(g.node);
    }
  };

  //Enter selects the focused node, and Shift+Enter expands it
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const node = (e.target as Element).closest('[data-node]')?.getAttribute('data-node');
    if (!node || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (e.shiftKey) onExpand(node);
    else onSelect(node);
  };

  const view = layout.current();
  const shown = links.filter((l) => !hidden.includes(l.kind));
  //a node goes with the kinds of link turned off when every link it has is one of them. It keeps its place in the
  //layout, so it comes back where it was. A node with no links at all, and the selected node, always show
  const linked = new Set(links.flatMap((l) => [l.from, l.to]));
  const showing = new Set(shown.flatMap((l) => [l.from, l.to]));
  const visible = nodes.filter((n) => n.id === selected || !linked.has(n.id) || showing.has(n.id));
  const kindOf = new Map(kinds.map((k) => [k.id, k]));
  //zoomed out, only the selected node and the ones linked to it keep their labels
  const labelled = new Set<string>();
  if (view.k < LABEL_ZOOM && selected) {
    labelled.add(selected);
    for (const l of shown) if (l.from === selected || l.to === selected) labelled.add(l.from === selected ? l.to : l.from);
  }

  return (
    <div style={styles.board} className="comic-panel">
      <svg
        ref={svg}
        style={styles.svg}
        role="group"
        aria-label={label}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        <defs>
          {kinds
            .filter((k) => k.arrow)
            .map((k) => (
              <marker key={k.id} id={`${markers}-${k.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M1 1.5 L8.5 5 L1 8.5" fill="none" style={{ stroke: k.colour }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            ))}
        </defs>
        {size.w > 0 && (
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {shown.map((link) => {
              const kind = kindOf.get(link.kind);
              const a = layout.at(link.from);
              const b = layout.at(link.to);
              if (!kind || !a || !b) return null;
              return (
                <Line
                  key={`${link.kind}:${link.from}:${link.to}`}
                  d={bowed(a, b, kind.arrow)}
                  kind={kind}
                  width={2.5 + (link.weight ?? 0) * 3}
                  dim={!!selected && link.from !== selected && link.to !== selected}
                  marker={kind.arrow ? `url(#${markers}-${kind.id})` : undefined}
                />
              );
            })}
            {visible.map((node) => {
              const point = layout.at(node.id);
              if (!point) return null;
              return (
                <Node
                  key={node.id}
                  node={node}
                  x={point.x ?? 0}
                  y={point.y ?? 0}
                  selected={node.id === selected}
                  labelled={view.k >= LABEL_ZOOM || labelled.has(node.id)}
                  name={describe ? describe(node) : node.label}
                />
              );
            })}
          </g>
        )}
      </svg>

      {children && <div style={styles.corner}>{children}</div>}

      {/* the legend, which turns each kind of link on and off, and the tools after it, wrapping as one row */}
      <div style={styles.bottom}>
        <div style={styles.legend} role="group" aria-label="Kinds of link">
          {kinds.map((k) => {
            const on = !hidden.includes(k.id);
            return (
              <button
                key={k.id}
                className="comic-lift"
                style={{ ...styles.key, ...(on ? {} : styles.keyOff) }}
                aria-pressed={on}
                onClick={() => setHidden((h) => (on ? [...h, k.id] : h.filter((id) => id !== k.id)))}
              >
                <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden>
                  <path d={k.arrow ? 'M2 6 L18 6' : 'M2 6 L22 6'} fill="none" style={{ stroke: k.colour }} strokeWidth="2.5" strokeDasharray={DASHES[k.line]} strokeLinecap="round" />
                  {k.arrow && <path d="M15 2 L21 6 L15 10" fill="none" style={{ stroke: k.colour }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                {k.label}
              </button>
            );
          })}
        </div>
        <div style={styles.tools}>
          <button className="comic-lift" style={styles.tool} onClick={fit} disabled={nodes.length === 0}>
            Fit
          </button>
          {onClear && (
            <button className="comic-lift" style={styles.tool} onClick={onClear} disabled={nodes.length === 0}>
              Clear
            </button>
          )}
        </div>
      </div>

      {nodes.length === 0 && empty && <div style={styles.empty}>{empty}</div>}
    </div>
  );
}

//a link between two nodes. Only a link whose ends moved is drawn again
const Line = memo(function Line({ d, kind, width, dim, marker }: { d: string; kind: LinkKind; width: number; dim: boolean; marker?: string }) {
  return (
    <path
      d={d}
      fill="none"
      style={{ stroke: kind.colour }}
      strokeWidth={width}
      strokeDasharray={DASHES[kind.line]}
      strokeLinecap="round"
      opacity={dim ? 0.25 : 1}
      markerEnd={marker}
    />
  );
});

//a node and its label. Panning and zooming move the whole board, so they never draw a node again; only a node that
//moved or changed is
const Node = memo(function Node({ node, x, y, selected, labelled, name }: { node: BoardNode; x: number; y: number; selected: boolean; labelled: boolean; name: string }) {
  const label = node.label.length > LABEL_MAX ? `${node.label.slice(0, LABEL_MAX - 2).trimEnd()}...` : node.label;
  const shape = SHAPES[node.shape ?? 'blob'];
  return (
    <g data-node={node.id} transform={`translate(${x} ${y})`} style={styles.node} tabIndex={0} role="button" aria-label={name} aria-pressed={selected}>
      <title>{node.label}</title>
      <path d={shape} transform="translate(3 3)" style={{ fill: gunmetal }} />
      <path
        d={shape}
        style={{ fill: FILLS[node.look], stroke: selected ? brownRed : gunmetal }}
        strokeWidth={selected ? 5 : 3}
        strokeDasharray={node.look === 'hollow' && !selected ? '5 4' : undefined}
      />
      {node.opened && <circle r="4.5" style={{ fill: selected ? brownRed : gunmetal }} />}
      {labelled && (
        <text y={R + 20} textAnchor="middle" style={selected ? { ...styles.label, ...styles.labelSelected } : styles.label}>
          {label}
        </text>
      )}
    </g>
  );
});

const DASHES: Record<LinkKind['line'], string | undefined> = {
  solid: undefined,
  dashed: '10 7',
  dotted: '1 7',
};

//zooms by `factor` around a point in the window, keeping that point where it is
function zoom(layout: BoardLayout, px: number, py: number, factor: number) {
  const view = layout.current();
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
  layout.look({ x: px - (px - view.x) * (k / view.k), y: py - (py - view.y) * (k / view.k), k });
}

//a slightly bowed line from a to b, stopping short of both blobs, and far enough short of b to leave room for an arrow
function bowed(a: Point, b: Point, arrow: boolean) {
  const [ax, ay, bx, by] = [a.x ?? 0, a.y ?? 0, b.x ?? 0, b.y ?? 0];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  const cx = (ax + bx) / 2 - ((by - ay) / length) * length * 0.08;
  const cy = (ay + by) / 2 + ((bx - ax) / length) * length * 0.08;
  const toward = (x: number, y: number, by: number) => {
    const d = Math.hypot(cx - x, cy - y) || 1;
    return [x + ((cx - x) / d) * by, y + ((cy - y) / d) * by];
  };
  const [sx, sy] = toward(ax, ay, R + 2);
  const [ex, ey] = toward(bx, by, R + (arrow ? 6 : 2));
  return `M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`;
}

const styles: Record<string, CSSProperties> = {
  board: {
    height: 'clamp(420px, 70vh, 660px)',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    overflow: 'hidden',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  svg: {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'grab',
  },
  node: {
    cursor: 'pointer',
    outline: 'none',
  },
  label: {
    fontFamily: comic,
    fontSize: 15,
    letterSpacing: 0.5,
    fill: gunmetal,
    stroke: '#fff',
    strokeWidth: 4,
    strokeLinejoin: 'round',
    paintOrder: 'stroke',
    pointerEvents: 'none',
  },
  labelSelected: {
    fill: brownRed,
    fontSize: 17,
  },
  corner: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 'min(380px, calc(100% - 24px))',
  },
  bottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 8,
    pointerEvents: 'none',
  },
  tools: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 8,
    pointerEvents: 'auto',
  },
  tool: {
    padding: '2px 14px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 17,
    letterSpacing: 1,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  key: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '1px 8px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    font: 'inherit',
    fontSize: 14,
    pointerEvents: 'auto',
  },
  keyOff: {
    opacity: 0.45,
    textDecoration: 'line-through',
  },
  empty: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    pointerEvents: 'none',
  },
};
