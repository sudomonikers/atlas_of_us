# ADR: One shared graph board for exploring any sub-graph

**Status:** Accepted, 31 Oct 2026
**Where it lives:** `application/ui/atlas-of-us-ui/src/shared_components/graph_board.tsx` (`GraphBoard`), with
`bloom.ts` (the map's layout) and `board_layout.ts` (`BoardLayout`, the view and the floating nodes) beside it. Its
users are the Skills Explorer (`src/skills/graph.tsx`, with its state in `skill_board.ts`) and the Topics Explorer
(`src/topics/graph.tsx`, with `topic_board.ts`), and the smaller board at the top of Topics Explained.

## Context
The Atlas is a graph, and most of its sub-graphs are worth exploring as one: what a skill is a kind of and what it
needs, how topics relate, which physical attributes a skill depends on, which skills a job asks for. People need two
things from it:

- **The whole shape.** Every node at once, to see how big the sub-graph is, how it's divided, and where they are in it.
  Skills alone has about 5,700 nodes today and will pass 14,000.
- **The links up close.** Start from one node, expand it to bring in its neighbours the way Neo4j Bloom works, and keep
  expanding what interests them.

Both have to work with a mouse, a trackpad and touch, in the Atlas's hand-drawn comic style, and keep their state when
the user leaves to read a node's page and comes back.

## Decision
Every module explores its nodes on one component, `GraphBoard`, which shows the whole map and the links up close on
the same board, by zoom. It knows how to lay out, draw and move a hierarchy, and knows nothing about what the
hierarchy is. The module that uses it owns the data and decides what selecting and expanding mean.

### Every node has one place
`bloom()` places every node of the module's map (`GET /{module}/map`: each node's id, name, status and the ids of
its broader nodes).

- **Fields.** Each node belongs to the broadest node above it, its field, found by following its first broader node.
  A field with at least three nodes is a flower, and smaller ones share an "Everything else" flower.
- **Flowers.** A field's nodes sit on the seed positions of a sunflower: the field's own node in the middle, and each
  branch of it in its own wedge, with the branch's node nearest the middle and what's under it further out. A node is
  never far from what it sits under.
- **Packing.** `d3-force` packs the flowers, biggest near the middle.

Positions are fixed. The map looks the same every visit, and zooming never loses your place.

### Levels of detail
The board is one canvas, so thousands of nodes stay smooth.

- **Zoomed out**, every node is a dot in its field's colour, paler when it isn't filled in, with each field's name
  over its flower. Clicking a name zooms to the flower.
- **Zoomed in**, the dots in view crossfade into hand-drawn nodes with a hard shadow, filled in the field's colour when
  ready and dashed for a stub, with their names and the lines to what they sit under.
- **At any zoom**, the selected node is drawn as a node with its name and the links to what it sits under.
- **The close-up.** Once anything is expanded, the map gives way to just the nodes the expanded links touch and the
  selected node, laid out by `d3-force` around the first node expanded, which stays put. Each new node settles before
  it's shown, and the board fits the close-up whenever more joins it. When the links are cleared the map comes back,
  viewed from where it was left.

### What the board takes
| Prop | What it is |
|---|---|
| `items` | The map: every node, with `{id, name, broader, filled}` |
| `visitors` | Nodes that aren't on the map, `{id, label, look, shape?, from?}`, such as traits on the skills board or Ideas on the topics board. They float beside `from` and can be dragged |
| `links`, `kinds` | The links expanding brought on, and each kind's label, line, arrow, colour and how long it likes to be. The legend turns each kind on and off |
| `hierarchy` | The kind the map's own broader links are drawn as |
| `layout` | A `BoardLayout`: the view and where the visitors are. The owner keeps it, so the board comes back as it was left |
| `selected`, `focus`, `opened` | The selected node, a node to glide to (once for each new focus, even one passed before the board has a size), and the expanded nodes, marked with a dot |
| `onSelect`, `onExpand`, `onClear` | Called on a tap, a double tap (or Shift+Enter) and the Clear button, which reads "Back to the map" in a close-up |
| `onBack` | Goes back a step, from the Back button or Ctrl+Z (Cmd+Z), when the owner has a step to go back to |
| `describe` | A node's name for screen readers |
| `preview` | A smaller board with no legend or Clear, whose taps the owner turns into somewhere to go |
| `children` | What sits over the top left corner, such as a search box |

### What the board does
- **Moving around:** dragging the background pans, the wheel and a pinch zoom around the pointer, and Fit glides to
  show every flower. The first time a board is shown it fits the map, and the flowers bloom open from their middles.
- **Visitors:** a small `d3-force` simulation pushes the visitors apart and pulls them toward the nodes they link to,
  which stay pinned where the map has them. In a close-up every node floats in the same simulation. A dragged node is
  pinned where it's dropped.
- **Finding what's under the pointer:** the map's nodes are bucketed in a grid, so a tap or a hover only looks nearby.
- **Keyboard and screen readers:** the canvas has a label with the counts. Behind it are buttons for each field and
  for the selected node, the visitors and the nodes nearest the middle of the view once they show as nodes. Enter
  selects one, Shift+Enter expands it, and focusing one brings it into view.

### What the module does
The Skills Explorer shows the split:

- **The map.** `useMap` (`use_map.ts`) fetches the map once a visit. A skill created by "ask for it" is added to it, so it shows
  without a refetch.
- **The board's state.** `SkillBoard` in `skill_board.ts`, with the `BoardLayout` inside it, is kept by the Skills
  page, so the board survives opening a skill's page and visiting My Skills. It holds a record for each skill,
  trait and topic that has been selected or brought on, with what's been read about it and whether it's expanded.
  Records that aren't on the map are the board's visitors.
- **Selecting and expanding.**
  - Selecting reads the node (`GET /api/skills/{id}/neighbors`, `GET /api/personality/traits/{id}/skills` or
    `GET /api/topics/{id}/neighbors`), whether it was selected on the board or from a skill's page.
  - Expanding adds what was read as links, and the inspector beside the board brings on the next page of a kind.
  - `hide` takes back what a node brought on.
  - **Going back.** Each expand, hide and clear keeps the board as it was in `back`, so the board holds the chain of
    earlier boards. Back restores the last one. The boards share what didn't change, so the chain costs little.
- **Search.** The search box goes over the board through `children`. Picking a result selects it, and the board
  glides to it.

The Topics Explorer does the same with its own data: Ideas are pale diamonds and the skills that need a topic are
warm blobs, both visitors, with six kinds of link of its own (see "Exploring" in `../topics.md`).

## Evidence
We rendered the boards with sample data in the development build, in headless Chrome:

- A skills map of about 2,700 nodes in 36 fields, and a topics map of about 1,100, drawn zoomed out, zoomed in, mid
  crossfade and at 390 pixels wide, with no sideways scroll.
- Selecting from the smaller board opens the Explorer zoomed to the node, with the inspector read.
- Expanding a skill draws its "Needs" and "Similar" links to other flowers, and its traits and topic float beside it.

Frame times haven't been measured, and two-finger pinch hasn't been tested on a real device yet.

## Consequences
- **One place for every node.** Exploring from a search, a page or the map lands on the same spot, and the shape of
  the sub-graph is always one zoom away.
- **Map nodes can't be rearranged on the map.** In a close-up anything can be moved, and it goes back to its place on
  the map afterwards.
- **The map is fetched whole.** It grows with the sub-graph. It's compressed, and fetched once a visit.
- **A new explorer is mostly data work.** A module gives its map, its visitors, links and kinds, what selecting and
  expanding fetch, and its inspector.
- **The board's state belongs to its owner,** which is what lets it survive navigation.
- **`BoardLayout` and `bloom` live in their own files.** The UI's lint config (`react-refresh/only-export-components`)
  wants files that export components to export only components.

## Alternatives considered
- **A separate map and graph.** A map of every node, and a board that starts empty and grows by expanding. They look
  and behave differently, and moving between them loses your place.
- **A force layout when zoomed in.** Zooming into a flower would hand its nodes to the force layout so they can be
  rearranged, then settle them back. It's closer to Neo4j Bloom, but nodes move under the user as they zoom.
- **A map placed by embedding.** Similar nodes cluster into regions. It needs a layout job and a way to place new
  nodes, and its distances show similarity alone, so it reads as connections that may not exist. The flowers show the
  hierarchy, which is real.
- **A graph library** such as Cytoscape.js, sigma.js or react-force-graph. Drawing in the comic style would mean custom
  renderers on each, and the bundle is larger than `d3-force` alone.
