import type { SimulationNodeDatum } from 'd3-force';

export interface BoardNode {
  id: string;
  label: string;
  look: 'filled' | 'hollow' | 'pale' | 'warm'; //hollow is drawn with a dashed outline, pale is filled in a pale blue, and warm in a pale red
  shape?: 'blob' | 'diamond'; //a blob unless it's a different kind of thing from most of the board
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
  private shown = false;
  private focused?: object;

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
  //true the first time the board is shown, when it fits the whole map in view
  firstShow() {
    const first = !this.shown;
    this.shown = true;
    return first;
  }
  //true the first time it's given a focus, so a focus is glided to once even if the board is unmounted in between
  newFocus(focus: object) {
    const fresh = this.focused !== focus;
    this.focused = focus;
    return fresh;
  }
  //adds a point for each new node, next to where the node it came from is or at `near`, and drops the points of nodes
  //that are gone
  sync(nodes: BoardNode[], where: (id: string) => { x: number; y: number } | undefined, near: { x: number; y: number }) {
    const ids = new Set(nodes.map((n) => n.id));
    for (const id of this.points.keys()) {
      if (!ids.has(id)) this.points.delete(id);
    }
    for (const node of nodes) {
      if (this.points.has(node.id)) continue;
      const from = node.from ? where(node.from) : undefined;
      const angle = Math.random() * Math.PI * 2;
      const spread = from ? 70 : 10;
      this.points.set(node.id, {
        id: node.id,
        x: (from?.x ?? near.x) + Math.cos(angle) * spread,
        y: (from?.y ?? near.y) + Math.sin(angle) * spread,
      });
    }
  }
}
