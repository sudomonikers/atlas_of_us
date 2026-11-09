import type { Ability, Conditions, Impairments, PartSummary } from './api';
import type { MeshIndex } from './anatomy_layers';
import { HEX } from '../shared_components/palette';

//FMA's whole body, whose parts are the systems and regions
export const HUMAN_BODY = 'FMA20394';

//the anatomy, indexed for finding the meshes of the 3D body any part is drawn with
export interface Body {
  byId: Map<string, PartSummary>;
  byFma: Map<string, PartSummary>;
  meshes: MeshIndex;
  under: Map<string, string[]>; //by part id, the meshes of it and every part within it or kind of it
}

//every part above a part, through the wholes it belongs to and the kinds it is
export function above(id: string, byId: Map<string, PartSummary>): Set<string> {
  const found = new Set<string>();
  const todo = [...(byId.get(id)?.wholes ?? []), ...(byId.get(id)?.kinds ?? [])];
  while (todo.length) {
    const next = todo.pop()!;
    if (found.has(next)) continue;
    found.add(next);
    todo.push(...(byId.get(next)?.wholes ?? []), ...(byId.get(next)?.kinds ?? []));
  }
  return found;
}

export function indexBody(anatomy: PartSummary[], meshes: MeshIndex): Body {
  const byId = new Map(anatomy.map((p) => [p.id, p]));
  const byFma = new Map(anatomy.map((p) => [p.fma_id, p]));
  const under = new Map<string, string[]>();
  const lineage = new Map<string, Set<string>>();
  for (const [element, [fma]] of Object.entries(meshes)) {
    const part = byFma.get(fma);
    if (!part) continue;
    let line = lineage.get(part.id);
    if (!line) lineage.set(part.id, (line = new Set([part.id, ...above(part.id, byId)])));
    for (const id of line) {
      const list = under.get(id);
      if (list) list.push(element);
      else under.set(id, [element]);
    }
  }
  return { byId, byFma, meshes, under };
}

//the meshes the parts are drawn with, or those of the parts within them or kinds of them. A part too small to have any,
//such as the cochlea, shows as the nearest part it belongs to that has some
export function meshesOf(body: Body, ids: Iterable<string>): Set<string> {
  const found = new Set<string>();
  for (const id of ids) {
    let todo = [id];
    const seen = new Set<string>();
    while (todo.length) {
      const drawn = todo.filter((t) => body.under.has(t));
      if (drawn.length) {
        for (const t of drawn) for (const element of body.under.get(t)!) found.add(element);
        break;
      }
      todo.forEach((t) => seen.add(t));
      todo = todo.flatMap((t) => body.byId.get(t)?.wholes ?? []).filter((w) => !seen.has(w));
    }
  }
  return found;
}

//the ids of the parts with these FMA ids
export const partIds = (body: Body, fmaIds: string[]) => fmaIds.flatMap((f) => body.byFma.get(f)?.id ?? []);

//the ids of the parts each of the user's impairments and conditions is in, by the impairment's function or part, or the
//condition's id. A function's are the parts that carry it out
export function notedParts(impairments: Impairments, conditions: Conditions) {
  const functions = new Map(impairments.functions.map((f) => [f.id, f]));
  const byCode = new Map(impairments.functions.map((f) => [f.code, f]));
  const of = new Map<string, string[]>();
  for (const i of impairments.impairments) of.set(i.id, functions.get(i.id)?.parts ?? [i.id]);
  for (const m of conditions.mine) {
    const c = conditions.conditions.find((x) => x.id === m.id);
    if (c) of.set(c.id, [...c.parts.map((p) => p.id), ...c.functions.flatMap((f) => byCode.get(f.code)?.parts ?? [])]);
  }
  return of;
}

//what a step's panel shows on the body over what the step itself does: meshes lit up and flown to, meshes in colours of
//their own, and whether the lit ones pulse
export interface Light {
  lit?: Set<string>;
  tints?: Map<string, number>;
  pulse?: boolean;
}

//the colours where someone stands is drawn in on the body: well behind most people, typical, and well ahead, as hex
export const STANDING = { low: HEX.blue, typical: HEX.ivory, high: HEX.brownRed };

//a colour part way from one to another
function mix(from: number, to: number, t: number) {
  const channel = (shift: number) => Math.round(((from >> shift) & 255) + (((to >> shift) & 255) - ((from >> shift) & 255)) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

//the colour of a place on an ability, 0 to 1 with 0.5 typical
export const standingColour = (value: number) => (value < 0.5 ? mix(STANDING.low, STANDING.typical, value / 0.5) : mix(STANDING.typical, STANDING.high, (value - 0.5) / 0.5));

export const hex = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`;

//every mesh the abilities with a place rest on, in the colour of the user's places on them, averaged where several rest
//on the same mesh
export function heat(abilities: Ability[], body: Body): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>();
  for (const a of abilities) {
    if (a.value === null) continue;
    for (const element of meshesOf(body, a.parts)) {
      const sum = sums.get(element) ?? { total: 0, count: 0 };
      sums.set(element, { total: sum.total + a.value, count: sum.count + 1 });
    }
  }
  return new Map([...sums].map(([element, { total, count }]) => [element, standingColour(total / count)]));
}
