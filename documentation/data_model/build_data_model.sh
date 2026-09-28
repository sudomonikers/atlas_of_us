#!/usr/bin/env bash
# Rebuilds data_model.md (next to this script) from the sub-graph files in this folder.
#
# Sub-graph files (<name>/<name>.md) are written with `#` as their top heading;
# every heading in them is demoted two levels (# -> ###) so they nest correctly in the full doc.
# The connecting text between sub-graphs lives inline below.
#
# To add a new sub-graph, create its file and add a `subgraph` line below where it should appear.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$SRC_DIR/data_model.md"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

included=()
first=1

separator() {
  [[ $first -eq 1 ]] || echo >> "$tmp"
  first=0
}

# Append literal text from stdin.
text() {
  separator
  cat >> "$tmp"
}

# Append a sub-graph file, demoting its headings by two levels (ignoring ``` code fences).
subgraph() {
  local file="$SRC_DIR/$1"
  if [[ ! -f "$file" ]]; then
    echo "Missing sub-graph file: $file" >&2
    exit 1
  fi
  separator
  awk '
    /^```/ { in_fence = !in_fence }
    !in_fence && /^#+ / { print "##" $0; next }
    { print }
  ' "$file" >> "$tmp"
  included+=("$1")
}

text <<'EOF'
# Data Specification For The Atlas Of Us
This is the big one. Most of the app is inside the data. The core idea is that this is a graph database with a huge monstrous-level graph database containing many sub graphs. All that a human can be in contained within this data, as well as all that many many different people are. Because all the data is so interwoven, this is a monolithic database. The rest of this document is broken up into explanations of the various sub graphs and their individual business rules. After each sub graph explanation will be a section on how the various subgraphs interact.
EOF

text <<'EOF'
## Individual Possibilities Graphs
The following sections are the core graphs related to all a human can be individually. In each of the graphs we will follow several People to see how they interact with the graph. Here is each person's node, which we will reference for the rest of this document:
```cypher
CREATE (andrew:Person {name: "Andrew Link", username: "sudomoniker"});
CREATE (lulu:Person {name: "Lulu Li", username: "lzy7717"});
```
EOF

subgraph personality/personality.md
subgraph topics/topics.md
subgraph skills/skills.md
subgraph physical_attributes/physical_attributes.md

text <<'EOF'
# Beyond The Individual
The following sub-graphs are how people interact together and with their environment. It is less related to their individuality and more how they fit into society and their environment. These are planned, but not yet documented
EOF

subgraph social/social.md
subgraph things/things.md
subgraph events/events.md
subgraph places/places.md
subgraph works/works.md

text <<'EOF'
## How The Graphs Interact
EOF

# Warn about sub-graph files that exist but weren't included above.
while IFS= read -r f; do
  rel="${f#"$SRC_DIR"/}"
  listed=0
  for section in "${included[@]}"; do
    [[ "$section" == "$rel" ]] && listed=1 && break
  done
  [[ $listed -eq 1 ]] || echo "Warning: $rel was not included in the build" >&2
done < <(find "$SRC_DIR" -mindepth 2 -name '*.md' -type f | sort)

mv "$tmp" "$OUT"
trap - EXIT
echo "Wrote $OUT"
