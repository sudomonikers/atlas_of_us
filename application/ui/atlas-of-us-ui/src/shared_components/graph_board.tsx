import { forceCollide, forceLink, forceManyBody, forceSimulation, type Simulation, type SimulationLinkDatum } from 'd3-force';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { bloom, SPACING, type Field, type MapItem, type Seed } from './bloom';
import type { BoardLayout, BoardNode, Point, View } from './board_layout';
import { AtlasError } from './atlas-error';
import { Thinking } from './thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the flowers' colours, by their variable in App.css, biggest flower first
const FIELD_COLOURS = ['--cinnamon-wood', '--air-force-blue', '--brown-red', '--gunmetal-black'];
const FILLS: Record<BoardNode['look'], string> = { filled: '--cinnamon-wood', hollow: '--ivory-white', pale: '--pale-blue', warm: '--pale-red' };

//a node's radius in board units, and how far in the board zooms
const R = 18;
const MAX_ZOOM = 2.5;
//zoomed out past NEAR_FROM the map is dots; zoomed in past NEAR_TO it's nodes; in between one fades into the other
const NEAR_FROM = 0.28;
const NEAR_TO = 0.55;
//zoomed in past LABEL_ZOOM every node in view is named; further out the selected node and what's linked to it, and
//zoomed out to dots only the selected node
const LABEL_ZOOM = 0.95;
const LABEL_MAX = 24;
//how far a press can wander and still be a tap, and how close two taps make a double tap
const TAP_SLOP = 5;
const DOUBLE_TAP_MS = 350;
const BLOOM_MS = 1100;
//how many of the nodes in view get a focusable button, for keyboards and screen readers
const REACHABLE = 60;

//a hand-drawn blob of radius R, centred on 0,0, and a hand-drawn diamond of about the same size
const BLOB = 'M0 -18 C11 -18.5 18.5 -10 18 0 C17.5 11 10 18.5 0 18 C-11 17.5 -18.5 10 -18 0 C-17.5 -10.5 -10 -18 0 -18 Z';
const DIAMOND = 'M0 -21 C6 -14.5 14 -6.5 21 0 C14.5 6 6.5 14 0 21 C-6 14.5 -14 6.5 -21 0 C-14.5 -6 -6.5 -14 0 -21 Z';

const DASHES: Record<LinkKind['line'], number[]> = { solid: [], dashed: [10, 7], dotted: [1, 7] };

//the same empty lists every render, so a board given none doesn't redraw for nothing
const NO_VISITORS: BoardNode[] = [];
const NO_LINKS: BoardLink[] = [];

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
  colour: string; //a palette variable, such as 'var(--gunmetal-black)'
  length: number; //how long a link to a floating node likes to be
}

interface Spring extends SimulationLinkDatum<Point> {
  length: number;
}

interface GraphBoardProps {
  label: string; //what the board shows, for screen readers
  noun: string; //what the map's nodes are, plural, for the count
  items: MapItem[]; //every node on the map
  visitors?: BoardNode[]; //nodes that aren't on the map, floating near what brought them
  links?: BoardLink[]; //links brought on by expanding nodes
  kinds: LinkKind[];
  hierarchy: string; //the kind the map's own broader links are drawn as
  layout: BoardLayout;
  selected?: string;
  focus?: { id: string }; //glides to that node each time a new one is passed
  opened?: Set<string>; //nodes whose links have been brought on, marked with a dot
  describe?: (id: string) => string; //a node's name for screen readers
  onSelect: (id?: string) => void;
  onExpand?: (id: string) => void;
  onClear?: () => void;
  preview?: boolean; //a smaller board with no legend or tools, whose taps the owner turns into somewhere to go
  children?: ReactNode; //sits over the board's top left corner, such as a search box
}

//one board for a whole module's nodes. Zoomed out it's a map of every node at once, a flower for each broadest node
//of everything under it. Zoomed in, the dots in view become nodes with names and the links to what they sit under.
//Tap a node to select it and double tap to expand it; what expanding brings that isn't on the map floats beside it and
//can be dragged. Drag the background to pan, and scroll or pinch to zoom. The owner decides what selecting and
//expanding do
export function GraphBoard(props: GraphBoardProps) {
  const { label, noun, items, visitors = NO_VISITORS, links = NO_LINKS, kinds, hierarchy, layout, selected, focus, opened, describe, onSelect, onExpand, onClear, preview, children } = props;
  const { seeds, fields } = useMemo(() => bloom(items), [items]);
  const seedOf = useMemo(() => new Map(seeds.map((s) => [s.id, s])), [seeds]);
  const byField = useMemo(() => fields.map((_, f) => seeds.filter((s) => s.field === f)), [fields, seeds]);
  //the seeds by grid cell, so finding what's under the pointer only looks nearby
  const grid = useMemo(() => {
    const cells = new Map<string, Seed[]>();
    for (const s of seeds) {
      const key = `${Math.floor(s.x / (SPACING * 2))}:${Math.floor(s.y / (SPACING * 2))}`;
      const cell = cells.get(key);
      if (cell) cell.push(s);
      else cells.set(key, [s]);
    }
    return cells;
  }, [seeds]);

  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0 });
  const fitK = useRef(0.05);
  const grown = useRef(1); //how far the flowers have bloomed open, 0 to 1
  const hovered = useRef<string | undefined>(undefined);
  const labels = useRef<{ field: Field; x: number; y: number; w: number; h: number }[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ node?: string; start: { x: number; y: number }; moved: boolean } | null>(null);
  const lastTap = useRef<{ id: string; at: number } | null>(null);
  const sim = useRef<Simulation<Point, Spring> | null>(null);
  const pending = useRef(0);
  const glide = useRef(0);
  const settle = useRef(0);
  const [hidden, setHidden] = useState<string[]>([]); //kinds of link toggled off in the legend
  const [reachable, setReachable] = useState<string[]>([]); //the nodes in view that get a focusable button

  //where a node is on the board: its seed, opening out from its flower's middle as the map blooms, or its floating point
  const where = useCallback(
    (id: string): { x: number; y: number } | undefined => {
      const s = seedOf.get(id);
      if (s) {
        const f = fields[s.field];
        const g = 1 - (1 - grown.current) ** 3;
        return { x: f.x + (s.x - f.x) * g, y: f.y + (s.y - f.y) * g };
      }
      const p = layout.at(id);
      return p ? { x: p.x ?? 0, y: p.y ?? 0 } : undefined;
    },
    [seedOf, fields, layout],
  );

  const shown = useMemo(() => links.filter((l) => !hidden.includes(l.kind)), [links, hidden]);
  //a floating node goes with the kinds of link turned off when every link it has is one of them
  const floating = useMemo(() => {
    const linked = new Set(links.flatMap((l) => [l.from, l.to]));
    const showing = new Set(shown.flatMap((l) => [l.from, l.to]));
    return visitors.filter((v) => v.id === selected || !linked.has(v.id) || showing.has(v.id));
  }, [visitors, links, shown, selected]);

  const draw = useCallback(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const css = getComputedStyle(el);
    const cache = new Map<string, string>();
    const colour = (v: string) => {
      let c = cache.get(v);
      if (c === undefined) {
        c = css.getPropertyValue(v.startsWith('var(') ? v.slice(4, -1) : v).trim();
        cache.set(v, c);
      }
      return c;
    };
    const font = colour('--font-comic');
    const ink = colour('--gunmetal-black');
    const red = colour('--brown-red');
    const { w, h } = size.current;
    const { x: vx, y: vy, k } = layout.current();
    const dpr = window.devicePixelRatio || 1;
    const near = Math.min(1, Math.max(0, (k - NEAR_FROM) / (NEAR_TO - NEAR_FROM)));
    const screen = (p: { x: number; y: number }) => ({ x: vx + p.x * k, y: vy + p.y * k });
    const inView = (p: { x: number; y: number }, pad: number) => p.x > -pad && p.x < w + pad && p.y > -pad && p.y < h + pad;
    const kindOf = new Map(kinds.map((kd) => [kd.id, kd]));
    const fieldColour = (s: Seed) => colour(fields[s.field].id ? FIELD_COLOURS[s.field % FIELD_COLOURS.length] : '--gunmetal-black');

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    //far: every seed as a dot, a field at a time so each colour is filled once. Ones not filled in yet are paler
    if (near < 1) {
      const r = Math.max(1.3, R * k * 0.6);
      fields.forEach((field, f) => {
        ctx.fillStyle = colour(field.id ? FIELD_COLOURS[f % FIELD_COLOURS.length] : '--gunmetal-black');
        for (const filled of [false, true]) {
          ctx.globalAlpha = (1 - near) * (filled ? 1 : 0.38);
          ctx.beginPath();
          for (const s of byField[f]) {
            if (s.filled !== filled) continue;
            const p = screen(where(s.id)!);
            if (!inView(p, r)) continue;
            const rr = s.root ? r * 2.2 : r;
            ctx.moveTo(p.x + rr, p.y);
            ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }

    //the seeds in view near enough to draw as nodes
    const pad = R * k * 3 + 160;
    const close = near > 0 ? seeds.filter((s) => inView(screen(where(s.id)!), pad)) : [];
    const nodeR = Math.max(R * k, 0);

    //a slightly bowed line between two points on screen, stopping short of both ends, with an arrowhead if it has one
    const line = (a: { x: number; y: number }, b: { x: number; y: number }, kind: LinkKind, width: number, alpha: number, ra: number, rb: number) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (length < ra + rb + 4) return;
      const cx = (a.x + b.x) / 2 - (b.y - a.y) * 0.08;
      const cy = (a.y + b.y) / 2 + (b.x - a.x) * 0.08;
      const toward = (p: { x: number; y: number }, by: number) => {
        const d = Math.hypot(cx - p.x, cy - p.y) || 1;
        return { x: p.x + ((cx - p.x) / d) * by, y: p.y + ((cy - p.y) / d) * by };
      };
      const s = toward(a, ra + 2);
      const e = toward(b, rb + (kind.arrow ? 4 : 2));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = colour(kind.colour);
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.setLineDash(DASHES[kind.line].map((d) => d * Math.min(1, Math.max(0.4, k))));
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(cx, cy, e.x, e.y);
      ctx.stroke();
      if (kind.arrow) {
        const angle = Math.atan2(e.y - cy, e.x - cx);
        const head = Math.max(5, width * 2.4);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(e.x - Math.cos(angle - 0.5) * head, e.y - Math.sin(angle - 0.5) * head);
        ctx.lineTo(e.x, e.y);
        ctx.lineTo(e.x - Math.cos(angle + 0.5) * head, e.y - Math.sin(angle + 0.5) * head);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    //how big a node is drawn: the selected one and floating ones stay big enough to see however far out
    const radius = (id: string) => (id === selected ? Math.max(nodeR, 11) : seedOf.has(id) ? nodeR : Math.max(nodeR, 8));

    //near: each seed in view links to what it sits under
    const tree = kindOf.get(hierarchy);
    if (tree && !hidden.includes(hierarchy)) {
      const drawTree = (s: Seed, alpha: number) => {
        const a = screen(where(s.id)!);
        for (const b of s.broader) {
          const up = seedOf.get(b);
          if (up) line(a, screen(where(up.id)!), tree, Math.max(1, 2 * k), alpha, radius(s.id), radius(up.id));
        }
      };
      if (near > 0) for (const s of close) if (s.id !== selected) drawTree(s, near * (selected ? 0.35 : 0.8));
      const chosen = selected ? seedOf.get(selected) : undefined;
      if (chosen) {
        drawTree(chosen, 1);
        //and what sits under the selected node
        for (const s of near > 0 ? close : seeds) if (s.broader.includes(chosen.id)) line(screen(where(s.id)!), screen(where(chosen.id)!), tree, Math.max(1, 2 * k), 0.9, radius(s.id), radius(chosen.id));
      }
    }

    //the links expanding brought on, at any zoom
    for (const l of shown) {
      const kind = kindOf.get(l.kind);
      const a = where(l.from);
      const b = where(l.to);
      if (!kind || !a || !b) continue;
      const dim = !!selected && l.from !== selected && l.to !== selected;
      line(screen(a), screen(b), kind, Math.max(1.2, (2.5 + (l.weight ?? 0) * 3) * k), dim ? 0.25 : 1, radius(l.from), radius(l.to));
    }

    //a node: a hand-drawn shape with a hard shadow, the dot that marks an expanded node, and its fill
    const shapes = { blob: new Path2D(BLOB), diamond: new Path2D(DIAMOND) };
    const node = (id: string, p: { x: number; y: number }, r: number, fill: string, look: BoardNode['look'], shape: 'blob' | 'diamond', alpha: number) => {
      const scale = r / R;
      const isSelected = id === selected;
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(p.x + 3 * Math.min(1, scale), p.y + 3 * Math.min(1, scale));
      ctx.scale(scale, scale);
      ctx.fillStyle = ink;
      ctx.fill(shapes[shape]);
      ctx.restore();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(scale, scale);
      ctx.fillStyle = fill;
      ctx.fill(shapes[shape]);
      ctx.strokeStyle = isSelected ? red : ink;
      ctx.lineWidth = (isSelected ? 4.5 : 2.5) / Math.max(scale, 0.4);
      ctx.setLineDash(look === 'hollow' && !isSelected ? [5 / scale, 4 / scale] : []);
      ctx.stroke(shapes[shape]);
      ctx.setLineDash([]);
      if (opened?.has(id)) {
        ctx.fillStyle = isSelected ? red : ink;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };
    const seedNode = (s: Seed, alpha: number) => node(s.id, screen(where(s.id)!), radius(s.id), s.filled ? fieldColour(s) : colour('--ivory-white'), s.filled ? 'filled' : 'hollow', 'blob', alpha);
    if (near > 0) for (const s of close) if (s.id !== selected) seedNode(s, near);
    for (const v of floating) {
      const p = where(v.id);
      if (p && v.id !== selected) node(v.id, screen(p), radius(v.id), colour(FILLS[v.look]), v.look, v.shape ?? 'blob', 1);
    }
    const chosenSeed = selected ? seedOf.get(selected) : undefined;
    const chosenVisitor = selected ? floating.find((v) => v.id === selected) : undefined;
    if (chosenSeed) seedNode(chosenSeed, 1);
    if (chosenVisitor) node(chosenVisitor.id, screen(where(chosenVisitor.id)!), radius(chosenVisitor.id), colour(FILLS[chosenVisitor.look]), chosenVisitor.look, chosenVisitor.shape ?? 'blob', 1);

    //labels, the same size at any zoom, with a white halo so they read over lines
    const text = (s: string, x: number, y: number, px: number, align: CanvasTextAlign, fill = ink) => {
      ctx.font = `${px}px ${font}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(s, x, y);
      ctx.fillStyle = fill;
      ctx.fillText(s, x, y);
      return ctx.measureText(s).width;
    };
    const cut = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 2).trimEnd()}...` : s);
    const nameOf = (id: string) => seedOf.get(id)?.name ?? visitors.find((v) => v.id === id)?.label ?? '';
    const named = new Set<string>();
    //zoomed out, only the selected node is named; once nodes show, so are the ones linked to it
    if (selected) {
      named.add(selected);
      if (near >= 0.5) for (const l of shown) if (l.from === selected || l.to === selected) named.add(l.from === selected ? l.to : l.from);
    }
    if (k >= LABEL_ZOOM) {
      for (const s of close) named.add(s.id);
      for (const v of floating) named.add(v.id);
    }
    const max = Math.max(10, Math.min(LABEL_MAX, Math.floor((SPACING * 1.8 * k) / 6.5)));
    for (const id of named) {
      const p = where(id);
      if (!p || id === hovered.current) continue;
      const sp = screen(p);
      if (!inView(sp, 100)) continue;
      const chosen = id === selected;
      ctx.globalAlpha = chosen || !seedOf.has(id) ? 1 : Math.max(near, 0.85);
      text(cut(nameOf(id), chosen ? 40 : max), sp.x, sp.y + radius(id) + 13, chosen ? 17 : 14, 'center', chosen ? red : ink);
    }
    ctx.globalAlpha = 1;

    //far: the fields' names in the middle of their flowers, while the flower is big enough on screen
    labels.current = [];
    if (near < 1) {
      ctx.globalAlpha = 1 - near;
      for (const field of fields) {
        const sr = field.r * k;
        if (sr < 26) continue;
        const px = Math.min(26, Math.max(15, sr / 5));
        const sp = screen(field);
        if (!inView(sp, sr)) continue;
        const ty = sp.y - Math.max(1.3, R * k * 0.6) * 2.2 - px * 0.7;
        const width = text(field.name, sp.x, ty, px, 'center');
        if (field.id) labels.current.push({ field, x: sp.x - width / 2, y: ty - px / 2, w: width, h: px });
      }
      ctx.globalAlpha = 1;
    }

    //the hovered node's full name, beside it
    if (hovered.current) {
      const p = where(hovered.current);
      if (p) {
        const sp = screen(p);
        text(nameOf(hovered.current), sp.x + Math.max(radius(hovered.current), 4) + 8, sp.y, 17, 'left');
      }
    }
  }, [layout, kinds, fields, byField, seeds, seedOf, where, selected, hierarchy, hidden, shown, floating, opened, visitors]);

  //which nodes get a focusable button: the selected one, the floating ones, and the ones nearest the middle of the view
  //when zoomed in enough to see them as nodes. Worked out once the view stops moving
  const findReachable = useCallback(() => {
    const { w, h } = size.current;
    const { x, y, k } = layout.current();
    const ids: string[] = [];
    if (selected) ids.push(selected);
    for (const v of floating) if (!ids.includes(v.id)) ids.push(v.id);
    if (k >= NEAR_TO) {
      const middle = { x: (w / 2 - x) / k, y: (h / 2 - y) / k };
      const close = seeds
        .filter((s) => {
          const sx = x + s.x * k;
          const sy = y + s.y * k;
          return sx > 0 && sx < w && sy > 0 && sy < h;
        })
        .sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y));
      for (const s of close.slice(0, REACHABLE)) if (!ids.includes(s.id)) ids.push(s.id);
    }
    setReachable((before) => (before.join() === ids.join() ? before : ids));
  }, [layout, seeds, floating, selected]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(pending.current);
    pending.current = requestAnimationFrame(draw);
    clearTimeout(settle.current);
    settle.current = window.setTimeout(findReachable, 250);
  }, [draw, findReachable]);

  //moves the view smoothly to `to`
  const glideTo = useCallback(
    (to: View) => {
      cancelAnimationFrame(glide.current);
      const from = layout.current();
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / 380);
        const e = 1 - (1 - t) ** 3;
        layout.look({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, k: from.k + (to.k - from.k) * e });
        draw();
        if (t < 1) glide.current = requestAnimationFrame(step);
        else schedule();
      };
      glide.current = requestAnimationFrame(step);
    },
    [layout, draw, schedule],
  );

  //the view that shows every flower, with a little room around it
  const fitted = useCallback((): View | undefined => {
    const { w, h } = size.current;
    if (!w || !fields.length) return undefined;
    const points = [...fields.flatMap((f) => [{ x: f.x - f.r, y: f.y - f.r }, { x: f.x + f.r, y: f.y + f.r }]), ...layout.all().map((p) => ({ x: p.x ?? 0, y: p.y ?? 0 }))];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const [left, right, top, bottom] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.min(w / (right - left || 1), h / (bottom - top || 1)) * 0.88;
    fitK.current = k;
    return { x: w / 2 - ((left + right) / 2) * k, y: h / 2 - ((top + bottom) / 2) * k, k };
  }, [fields, layout]);

  //glides to the focused node, once for each new focus. One passed before the board has a size waits for it
  const toFocus = () => {
    const p = focus && where(focus.id);
    const { w, h } = size.current;
    if (!focus || !p || !w || !layout.newFocus(focus)) return;
    const k = Math.max(layout.current().k, preview ? NEAR_TO : 1.1);
    glideTo({ x: w / 2 - p.x * k, y: h / 2 - p.y * k, k });
  };
  const latestFocus = useRef(toFocus);
  useEffect(() => {
    latestFocus.current = toFocus;
    toFocus();
  });

  //the canvas matches its frame, in device pixels so it's sharp. The first time the board is shown it fits the whole
  //map, and the flowers bloom open from their middles
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let bloomFrame = 0;
    const observer = new ResizeObserver(() => {
      const box = el.getBoundingClientRect();
      const first = size.current.w === 0;
      size.current = { w: box.width, h: box.height };
      const dpr = window.devicePixelRatio || 1;
      //setting a canvas's size wipes it, so it's only set when it changes, and drawn again straight away
      const [cw, ch] = [Math.round(box.width * dpr), Math.round(box.height * dpr)];
      if (canvas.current!.width !== cw || canvas.current!.height !== ch) {
        canvas.current!.width = cw;
        canvas.current!.height = ch;
        draw();
      }
      const fit = fitted(); //also keeps how far out the board can zoom up to date
      if (first && layout.firstShow() && fit) {
        layout.look(fit);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          grown.current = 0;
          const started = performance.now();
          const step = (now: number) => {
            grown.current = Math.min(1, (now - started) / BLOOM_MS);
            draw();
            if (grown.current < 1) bloomFrame = requestAnimationFrame(step);
          };
          bloomFrame = requestAnimationFrame(step);
        }
      }
      schedule();
      if (first) latestFocus.current();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(bloomFrame);
      grown.current = 1;
    };
  }, [fitted, layout, draw, schedule]);

  useEffect(() => {
    schedule();
  }, [schedule]);

  //the floating nodes push apart and are pulled toward the nodes they link to, which stay where the map has them
  useEffect(() => {
    const view = layout.current();
    const { w, h } = size.current;
    layout.sync(visitors, (id) => where(id), { x: (w / 2 - view.x) / view.k, y: (h / 2 - view.y) / view.k });
    const length = new Map(kinds.map((kd) => [kd.id, kd.length]));
    const floatingIds = new Set(visitors.map((v) => v.id));
    const touching = links.filter((l) => floatingIds.has(l.from) || floatingIds.has(l.to));
    const anchors = new Map<string, Point>();
    for (const l of touching) {
      for (const id of [l.from, l.to]) {
        if (floatingIds.has(id) || anchors.has(id)) continue;
        const p = where(id);
        if (p) anchors.set(id, { id, x: p.x, y: p.y, fx: p.x, fy: p.y });
      }
    }
    const nodes = [...layout.all(), ...anchors.values()];
    const known = new Set(nodes.map((n) => n.id));
    const springs: Spring[] = touching.filter((l) => known.has(l.from) && known.has(l.to)).map((l) => ({ source: l.from, target: l.to, length: length.get(l.kind) ?? 100 }));
    const s = forceSimulation<Point, Spring>(nodes)
      .force('charge', forceManyBody<Point>().strength(-340).distanceMax(500))
      .force('collide', forceCollide<Point>(R * 2.2))
      .force('link', forceLink<Point, Spring>(springs).id((p) => p.id).distance((l) => l.length).strength(0.35))
      .alpha(0.6)
      .on('tick', schedule);
    sim.current = s;
    return () => {
      s.stop();
      sim.current = null;
    };
  }, [visitors, links, kinds, layout, where, schedule]);


  useEffect(
    () => () => {
      cancelAnimationFrame(pending.current);
      cancelAnimationFrame(glide.current);
      clearTimeout(settle.current);
    },
    [],
  );

  const zoomAt = useCallback(
    (px: number, py: number, factor: number) => {
      const v = layout.current();
      const k = Math.min(MAX_ZOOM, Math.max(fitK.current * 0.6, v.k * factor));
      layout.look({ x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k), k });
      schedule();
    },
    [layout, schedule],
  );

  //the wheel zooms the board rather than scrolling the page, which needs a listener that isn't passive
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(glide.current);
      const box = el.getBoundingClientRect();
      zoomAt(e.clientX - box.left, e.clientY - box.top, Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomAt]);

  //what's under a point on the canvas: a floating node, a node on the map close enough to it, or a field's name
  const hit = (sx: number, sy: number): { node?: string; field?: Field } => {
    const { x, y, k } = layout.current();
    const wx = (sx - x) / k;
    const wy = (sy - y) / k;
    const reach = Math.max(R, 9 / k);
    for (const v of floating) {
      const p = where(v.id);
      if (p && Math.hypot(p.x - wx, p.y - wy) < Math.max(reach, 8 / k)) return { node: v.id };
    }
    const label = labels.current.find((l) => sx >= l.x - 4 && sx <= l.x + l.w + 4 && sy >= l.y - 4 && sy <= l.y + l.h + 4);
    if (label) return { field: label.field };
    const cx = Math.floor(wx / (SPACING * 2));
    const cy = Math.floor(wy / (SPACING * 2));
    let best: string | undefined;
    let bestD = reach;
    for (let i = cx - 1; i <= cx + 1; i++) {
      for (let j = cy - 1; j <= cy + 1; j++) {
        for (const s of grid.get(`${i}:${j}`) ?? []) {
          const d = Math.hypot(s.x - wx, s.y - wy);
          if (d < bestD) [best, bestD] = [s.id, d];
        }
      }
    }
    return { node: best };
  };

  //the cursor goes straight onto the canvas, so hovering never renders the board again
  const setCursor = (cursor: string) => {
    if (canvas.current && canvas.current.style.cursor !== cursor) canvas.current.style.cursor = cursor;
  };

  const local = (e: PointerEvent) => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(glide.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    //a second finger turns whatever the first was doing into a pinch, which is never a tap
    gesture.current = pointers.current.size === 1 ? { node: hit(p.x, p.y).node, start: p, moved: false } : { start: p, moved: true };
    setCursor('grabbing');
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = local(e);
    const before = pointers.current.get(e.pointerId);
    const g = gesture.current;
    if (!before || !g) {
      //just hovering
      const { node, field } = hit(p.x, p.y);
      if (hovered.current !== node) {
        hovered.current = node;
        schedule();
      }
      setCursor(node || field ? 'pointer' : 'grab');
      return;
    }
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
    //a floating node is dragged and pinned where it's dropped; anything else drags the whole board
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

  const up = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    setCursor('grab');
    const g = gesture.current;
    if (pointers.current.size > 0 || !g) return;
    gesture.current = null;
    sim.current?.alphaTarget(0);
    if (g.moved || e.type === 'pointercancel') return;
    if (!g.node) {
      const { field } = hit(g.start.x, g.start.y);
      if (field && preview) return onSelect(field.id);
      if (field) return zoomToField(field);
      return onSelect(undefined);
    }
    const now = e.timeStamp;
    if (onExpand && lastTap.current?.id === g.node && now - lastTap.current.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      onExpand(g.node);
    } else {
      lastTap.current = { id: g.node, at: now };
      onSelect(g.node);
    }
  };

  //zooms in until a field's flower fills the view, close enough to see its nodes
  const zoomToField = (field: Field) => {
    const { w, h } = size.current;
    const k = Math.min(MAX_ZOOM, Math.max(NEAR_TO, Math.min(w, h) / (field.r * 2.2)));
    glideTo({ x: w / 2 - field.x * k, y: h / 2 - field.y * k, k });
  };

  const fit = () => {
    const view = fitted();
    if (view) glideTo(view);
  };

  //Enter selects the focused node and Shift+Enter expands it. Focusing one moves the board to it
  const key = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.shiftKey && onExpand) onExpand(id);
    else onSelect(id);
  };
  const reveal = (id: string) => {
    const p = where(id);
    const { w, h } = size.current;
    if (!p || !w) return;
    const { x, y, k } = layout.current();
    const sx = x + p.x * k;
    const sy = y + p.y * k;
    if (sx > 40 && sx < w - 40 && sy > 40 && sy < h - 40) return;
    glideTo({ x: w / 2 - p.x * k, y: h / 2 - p.y * k, k });
  };
  const nameOf = (id: string) => (describe ? describe(id) : (seedOf.get(id)?.name ?? visitors.find((v) => v.id === id)?.label ?? id));
  const fieldCount = fields.filter((f) => f.id).length;

  return (
    <div style={preview ? { ...styles.board, ...styles.preview } : styles.board} ref={frame}>
      <canvas
        ref={canvas}
        style={styles.canvas}
        role="img"
        aria-label={`${label}: ${items.length} ${noun} in ${fieldCount} fields`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={() => {
          if (pointers.current.size || !hovered.current) return;
          hovered.current = undefined;
          schedule();
        }}
      />

      {/* the fields and the nodes in view as buttons, for keyboards and screen readers */}
      <div style={styles.hidden}>
        <ul aria-label="Fields">
          {fields
            .filter((f) => f.id)
            .map((f) => (
              <li key={f.id}>
                <button onClick={() => (preview ? onSelect(f.id) : zoomToField(f))}>
                  {f.name}, {f.size} {noun}
                </button>
              </li>
            ))}
        </ul>
        <ul aria-label="In view">
          {reachable.map((id) => (
            <li key={id}>
              <button aria-pressed={id === selected} onFocus={() => reveal(id)} onKeyDown={key(id)} onClick={() => onSelect(id)}>
                {nameOf(id)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {children && <div style={styles.corner}>{children}</div>}
      {preview && (
        <p style={styles.count}>
          {items.length.toLocaleString()} {noun} in {fieldCount} fields
        </p>
      )}

      {/* the legend, which turns each kind of link on and off, and the tools after it, wrapping as one row */}
      <div style={styles.bottom}>
        {preview ? (
          <p style={styles.hint}>Zoom in to read names, and click anything to explore from there.</p>
        ) : (
          <div style={styles.legend} role="group" aria-label="Kinds of link">
            {kinds.map((kd) => {
              const on = !hidden.includes(kd.id);
              return (
                <button
                  key={kd.id}
                  className="comic-lift"
                  style={{ ...styles.key, ...(on ? {} : styles.keyOff) }}
                  aria-pressed={on}
                  onClick={() => setHidden((h) => (on ? [...h, kd.id] : h.filter((id) => id !== kd.id)))}
                >
                  <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden>
                    <path d={kd.arrow ? 'M2 6 L18 6' : 'M2 6 L22 6'} fill="none" style={{ stroke: kd.colour }} strokeWidth="2.5" strokeDasharray={DASHES[kd.line].join(' ') || undefined} strokeLinecap="round" />
                    {kd.arrow && <path d="M15 2 L21 6 L15 10" fill="none" style={{ stroke: kd.colour }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  {kd.label}
                </button>
              );
            })}
          </div>
        )}
        <div style={styles.tools}>
          <button className="comic-lift" style={styles.tool} onClick={fit}>
            Fit
          </button>
          {onClear && !preview && (
            <button className="comic-lift" style={styles.tool} onClick={onClear} disabled={!links.length && !visitors.length && !selected}>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

//holds a board's place while its map loads, so the page doesn't jump
export function MapWaiting({ error, preview }: { error?: string; preview?: boolean }) {
  return (
    <div style={{ ...styles.waiting, ...(preview ? styles.preview : { height: styles.board.height }) }}>
      {error ? <AtlasError message={error} /> : <Thinking label="Drawing the map" />}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  board: {
    position: 'relative',
    height: 'clamp(420px, 70vh, 660px)',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `4px 5px 0 ${gunmetal}`,
    overflow: 'hidden',
  },
  preview: {
    maxWidth: 1100,
    height: 'clamp(380px, 62vh, 600px)',
    margin: '0 auto 28px',
  },
  canvas: {
    display: 'block',
    cursor: 'grab',
    width: '100%',
    height: '100%',
    touchAction: 'none',
    userSelect: 'none',
  },
  //above the board, so search results drop down over it
  corner: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    width: 'min(380px, calc(100% - 24px))',
  },
  count: {
    position: 'absolute',
    top: 12,
    left: 16,
    margin: 0,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    pointerEvents: 'none',
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
  hint: {
    margin: 0,
    fontSize: 14,
    opacity: 0.75,
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
  waiting: {
    display: 'grid',
    placeItems: 'center',
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
};
