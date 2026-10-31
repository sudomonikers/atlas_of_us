import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';

//one node of a hierarchy for the map: what it's called, the ids of the nodes it sits under, and whether it's filled in
export interface MapItem {
  id: string;
  name: string;
  broader: string[];
  filled: boolean;
}

//a node's place on the map
export interface Seed {
  id: string;
  name: string;
  filled: boolean;
  broader: string[];
  field: number; //index into the fields
  root: boolean; //the field's own broadest node, in the middle of its flower
  x: number;
  y: number;
}

//one flower: a broadest node and everything under it
export interface Field extends SimulationNodeDatum {
  id: string; //the broadest node's id, or '' for "Everything else"
  name: string;
  size: number;
  r: number;
  x: number;
  y: number;
}

//the seeds' spiral constant, in board units. Neighbouring seeds end up about 1.8 times this apart, room for a node
export const SPACING = 50;
const SMALLEST_FIELD = 3; //a broadest node with fewer under it goes in "Everything else"

//every item as a seed in a field's flower. Each item belongs to the broadest node above it, its field, found by
//following its first broader node. A field's items sit on the seed positions of a sunflower, the field in the middle
//and each branch of it in its own wedge. The flowers are packed together with the biggest near the middle
export function bloom(items: MapItem[]): { seeds: Seed[]; fields: Field[] } {
  const byId = new Map(items.map((item) => [item.id, item]));
  //each item's field, how far below it it sits, and the branch of the field it's in (the item just under the field)
  const placed = new Map<string, { root: string; depth: number; branch: string }>();
  const climb = (id: string) => {
    const path: string[] = [];
    let cur = id;
    let above: { root: string; depth: number; branch: string } | undefined;
    for (;;) {
      above = placed.get(cur);
      if (above) break;
      path.push(cur);
      //the first broader node that's on the map and not already climbed through, so a loop can't trap it
      const up = byId.get(cur)!.broader.find((b) => byId.has(b) && !path.includes(b));
      if (!up) break;
      cur = up;
    }
    for (let i = path.length - 1; i >= 0; i--) {
      const parent = i === path.length - 1 ? above : placed.get(path[i + 1]);
      placed.set(path[i], parent ? { root: parent.root, depth: parent.depth + 1, branch: parent.depth === 0 ? path[i] : parent.branch } : { root: path[i], depth: 0, branch: path[i] });
    }
    return placed.get(id)!;
  };

  const members = new Map<string, MapItem[]>();
  for (const item of items) {
    const { root } = climb(item.id);
    const list = members.get(root);
    if (list) list.push(item);
    else members.set(root, [item]);
  }
  const groups: { id: string; name: string; items: MapItem[] }[] = [];
  const rest: MapItem[] = [];
  for (const [root, list] of members) {
    if (list.length >= SMALLEST_FIELD) groups.push({ id: root, name: byId.get(root)!.name, items: list });
    else rest.push(...list);
  }
  groups.sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  if (rest.length) groups.push({ id: '', name: 'Everything else', items: rest });

  //the flowers, packed. They start on a spiral, biggest first, and push apart until none overlap
  const fields: Field[] = groups.map((g, i) => {
    const r = SPACING * Math.sqrt(g.items.length) + SPACING;
    const angle = i * 2.4;
    const out = 40 * Math.sqrt(i) * SPACING;
    return { id: g.id, name: g.name, size: g.items.length, r, x: Math.cos(angle) * out, y: Math.sin(angle) * out };
  });
  forceSimulation(fields)
    .force('collide', forceCollide<Field>((f) => f.r + SPACING * 3).iterations(3))
    .force('x', forceX(0).strength(0.04))
    .force('y', forceY(0).strength(0.04))
    .stop()
    .tick(300);

  const seeds: Seed[] = [];
  groups.forEach((g, f) => {
    const field = fields[f];
    //the sunflower's seed positions, from the middle out. The golden angle spaces them evenly however many there are
    const spots = g.items.map((_, i) => ({ angle: (i * 2.39996) % (Math.PI * 2), out: SPACING * Math.sqrt(i + 0.5) }));
    const place = (item: MapItem, spot: { angle: number; out: number }) =>
      seeds.push({
        id: item.id,
        name: item.name,
        filled: item.filled,
        broader: item.broader,
        field: f,
        root: !!g.id && item.id === g.id,
        x: field.x + Math.cos(spot.angle) * spot.out,
        y: field.y + Math.sin(spot.angle) * spot.out,
      });
    const byName = (a: MapItem, b: MapItem) => a.name.localeCompare(b.name);
    if (!g.id) {
      [...g.items].sort(byName).forEach((item, i) => place(item, spots[i]));
      return;
    }
    //the field's own node in the middle, then each branch gets a wedge of the flower the size of its share, with the
    //branch's node nearest the middle and what's under it further out, so a node is never far from what it sits under
    place(byId.get(g.id)!, spots[0]);
    const branches = new Map<string, MapItem[]>();
    for (const item of g.items) {
      if (item.id === g.id) continue;
      const { branch } = placed.get(item.id)!;
      const list = branches.get(branch);
      if (list) list.push(item);
      else branches.set(branch, [item]);
    }
    const around = spots.slice(1).sort((a, b) => a.angle - b.angle);
    let next = 0;
    for (const branch of [...branches.keys()].sort((a, b) => byId.get(a)!.name.localeCompare(byId.get(b)!.name))) {
      const list = branches.get(branch)!.sort((a, b) => placed.get(a.id)!.depth - placed.get(b.id)!.depth || byName(a, b));
      const wedge = around.slice(next, next + list.length).sort((a, b) => a.out - b.out);
      next += list.length;
      list.forEach((item, i) => place(item, wedge[i]));
    }
  });
  return { seeds, fields };
}
