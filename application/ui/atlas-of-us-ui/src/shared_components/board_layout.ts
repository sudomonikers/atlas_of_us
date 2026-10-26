import type { SimulationNodeDatum } from 'd3-force';

export interface BoardNode {
  id: string;
  label: string;
  look: 'filled' | 'hollow'; //hollow is drawn with a dashed outline
  opened?: boolean; //marked with a dot, for a node whose links have been brought onto the board
  from?: string; //the node it was brought on from, which it starts next to
}

export interface Point extends SimulationNodeDatum {
  id: string;
}

export interface View {
  x: number;
  y: number;
  k: number; //a point on the board is drawn at (x, y) + k * the point
}

//where everything on a board is and the part of it in view. The board's owner keeps it, so a board that's unmounted
//and mounted again comes back the way it was left
export class BoardLayout {
  private points = new Map<string, Point>();
  private view: View = { x: 0, y: 0, k: 1 };
  private centred = false;

  at(id: string) {
    return this.points.get(id);
  }
  all() {
    return [...this.points.values()];
  }
  current() {
    return this.view;
  }
  look(view: View) {
    this.view = view;
  }
  //puts the middle of the board in the middle of a w by h window, the first time it's shown
  centre(w: number, h: number) {
    if (this.centred) return;
    this.centred = true;
    this.view = { x: w / 2, y: h / 2, k: 1 };
  }
  //adds a point for each new node, next to the node it came from or at `near`, and drops the points of nodes that
  //are gone. Returns whether anything changed
  sync(nodes: BoardNode[], near: { x: number; y: number }) {
    const ids = new Set(nodes.map((n) => n.id));
    let changed = false;
    for (const id of this.points.keys()) {
      if (!ids.has(id)) {
        this.points.delete(id);
        changed = true;
      }
    }
    for (const node of nodes) {
      if (this.points.has(node.id)) continue;
      const from = node.from ? this.points.get(node.from) : undefined;
      const angle = Math.random() * Math.PI * 2;
      const spread = from ? 70 : 10;
      this.points.set(node.id, {
        id: node.id,
        x: (from?.x ?? near.x) + Math.cos(angle) * spread,
        y: (from?.y ?? near.y) + Math.sin(angle) * spread,
      });
      changed = true;
    }
    return changed;
  }
}
