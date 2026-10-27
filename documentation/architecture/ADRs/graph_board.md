# ADR: One shared graph board for exploring any sub-graph

**Status:** Accepted, 26 Oct 2026
**Where it lives:** `application/ui/atlas-of-us-ui/src/shared_components/graph_board.tsx` (`GraphBoard`) and
`board_layout.ts` (`BoardLayout`) beside it. Its first user is the Skills Explorer's Graph view, in
`src/skills/graph.tsx` and `src/skills/skill_board.ts`, and its second the Topics Explorer's, in `src/topics/graph.tsx`
and `src/topics/topic_board.ts`.

## Context
The Atlas is a graph, and most of its sub-graphs are worth seeing as one: what a skill is a kind of and what it needs,
how topics relate, which physical attributes a skill depends on, which skills a job asks for. The Skills Explorer is the
first place that needs a graph view, and Topics, Physical Attributes and Jobs will each need one too.

The sub-graphs are too big to draw whole. Skills alone has about 5,700 nodes today and will pass 14,000. People explore
them the way Neo4j Bloom works: start from one node they searched for, expand it to bring in its neighbours, keep
expanding what interests them, and arrange the result by hand. A board like that needs:

- a layout that spreads nodes out by itself and lets the user drag any node where they want it
- panning and zooming with a mouse, a trackpad and touch, including pinch
- several kinds of link, drawn differently, with a way to turn each kind on and off
- selection and expansion that the module showing the board defines
- the Atlas's hand-drawn comic style: wobbly outlines, hard shadows, the palette in `STYLE_GUIDE.md`
- a board that keeps its state when the user leaves to read a node's page and comes back

## Decision
Every graph view in the UI is built on one component, `GraphBoard`. It knows how to draw and move a graph, and knows
nothing about what the graph is. The module that uses it owns the data and decides what selecting and expanding mean.

### What the board takes
| Prop | What it is |
|---|---|
| `nodes` | `{id, label, look, shape?, opened?, from?}`. `look` is `filled`, `hollow` (a dashed outline), `pale` (a pale blue fill) or `warm` (a pale red fill), `shape` is `blob` or `diamond` for a different kind of thing, `opened` marks a node that has been expanded, and `from` is the node it was brought on from, which it starts beside |
| `links` | `{from, to, kind, weight?}`. The arrow points at `to`, and `weight` (0 to 1) thickens the line |
| `kinds` | Each kind of link: its label for the legend, `solid`, `dashed` or `dotted`, whether it has an arrow, its colour, and how long it likes to be. The legend turns each kind off, and with it every node whose links are all of kinds that are off, other than the selected node |
| `layout` | A `BoardLayout`, which holds every node's position and the view. The owner keeps it, so the board comes back as it was left |
| `selected`, `focus` | The selected node, and a node to glide to. A new `focus` object glides to it again |
| `onSelect`, `onExpand`, `onClear` | Called on a tap, a double tap (or Shift+Enter) and the Clear button |
| `describe` | A node's name for screen readers, such as its label and status |
| `empty`, `children` | What shows while the board is empty, and what sits over its top left corner, such as a search box |

### What the board does
- **Layout:** `d3-force` does the maths: nodes push each other apart, links pull their ends together at the length
  their kind likes, and a gentle pull keeps everything near the middle. A dragged node is pinned where it's dropped.
  New nodes start beside the node they came from, or in the middle of the view.
- **Moving around:** dragging the background pans, the wheel and a pinch zoom around the pointer, and Fit glides to
  show every node.
- **Drawing:** SVG, in the comic style. Nodes are hand-drawn blobs with a hard shadow, links are slightly bowed lines
  with arrowheads, and the selected node's links stay bright while the rest fade.
- **Legend:** one button per kind of link, which turns that kind on and off.
- **Keyboard and screen readers:** each node is a focusable button named by `describe`. Enter selects it and
  Shift+Enter expands it.

### What the module does
The Skills Explorer shows the split:

- It keeps the board's state (`SkillBoard` in `skill_board.ts`), with the `BoardLayout` inside it, and clears it when
  the Graph view is left, so each visit starts from an empty board.
- It maps skills to `nodes` (filled when the skill's levels are written, hollow for a stub), the personality traits
  they take to pale diamonds, and the topics they need to warm blobs. Its five kinds of link go to `kinds`: "A kind
  of", "Needs", "Similar", "Takes" and "Knows".
- Expanding calls `GET /api/skills/{id}/neighbors`, which returns a page of twelve of each kind of link with the total,
  and every trait the skill takes and topic it needs, and the module adds them to `nodes` and `links`. Expanding a trait
  calls `GET /api/personality/traits/{id}/skills` for the skills that take it, and expanding a topic calls
  `GET /api/topics/{id}/neighbors` for the skills that need it. Its inspector beside the board brings in the
  next page of a kind.
- Its search box goes over the board through `children`.

The Topics Explorer does the same with its own data: topics as blobs, Ideas as pale diamonds, and the skills that
need a topic as warm blobs, with six kinds of link of its own (see "Exploring the graph" in `../topics.md`).

### Performance
- Each node and each link is a memoized component. Panning and zooming change only the transform on the group holding
  them, so they redraw no nodes. While the layout settles, the nodes that moved are drawn again.
- Pointer and wheel moves are batched to one redraw per frame.
- Below 60% zoom, only the selected node and its neighbours keep their labels.
- The module limits how many nodes one expansion can add. The skills API pages every kind of link twelve at a time.

## Evidence
We rendered the board with sample data in the development build, in headless Chrome on a Mac:

- With 10 nodes it settles in about three seconds, and tapping, double tapping, dragging, panning, wheel zoom, the
  legend, the keyboard and Fit all work. At 375 pixels wide the legend and tools fit along the bottom.
- With 600 nodes, panning a settled board averaged 14 ms a frame (worst 50 ms), and the layout settling averaged
  25 ms a frame (worst 67 ms).
- `d3-force` and the three small d3 packages it uses come to about 6 kB gzipped.

Two-finger pinch hasn't been tested on a real device yet.

## Consequences
- **Every graph view looks and moves the same,** and a fix or a new feature in the board reaches all of them.
- **A new graph view is mostly data work.** A module writes how to turn its nodes and links into `nodes`, `links` and
  `kinds`, what expanding fetches, and its inspector.
- **The board's state belongs to its owner.** That's what lets it survive navigation, and it means each module keeps a
  `BoardLayout` and its own nodes and links.
- **`BoardLayout` lives in its own file.** The UI's lint config (`react-refresh/only-export-components`) wants files that
  export components to export only components, and `BoardLayout` is a class.
- **SVG has a ceiling.** Boards of a few hundred nodes are smooth. Boards of several thousand would need the drawing
  moved to a canvas, which is a change inside `GraphBoard` alone, since nothing outside it touches the drawing.
- **The module has to limit expansion.** The board draws whatever it's given, so a module whose nodes can have
  thousands of neighbours pages them, as the skills API does.

## Alternatives considered
- **A graph library** such as Cytoscape.js, sigma.js, vis-network or react-force-graph. Each brings layout, pan and
  zoom, and its own look. Drawing nodes and links in the comic style would mean custom renderers on each, and the
  bundle is larger than `d3-force` alone. With `d3-force` for the maths, the drawing is plain SVG in the same style as
  the rest of the app.
- **A three.js scene.** The app used three.js for the personality scenes and has since dropped it. A 3D board is harder
  to read and to use on a phone, and three.js is about 900 kB.
- **A map of every skill, placed by its embedding.** Similar skills cluster into regions, with zooming from regions to
  single skills. It shows the whole shape of the graph, and it needs a layout job, a way to place new skills, and a
  renderer for tens of thousands of nodes. Its distances show similarity alone, so it reads as connections that may not
  exist. The board shows only real links, starting from what the user searched for.
- **A graph component per module.** Simpler for the first module, and every later one would build its own layout,
  gestures, legend and accessibility, each a little different.
