# Topics Graph
Topic nodes encompass the sub-graph which is essentially a knowledge graph of everything a Person can know, understand, believe, value or any other verb. This sub-graph was originally called Knowledge Graph, but was changed to Topic Graph because some information or knowledge is not provable or is false, and we want to include things that are not strictly true, but somewhat ambiguous or even false. Many people believe false things or "know" them to be true. Our job is not to verify the veracity of different pieces of information, but rather to understand people and what makes them up. To that end we have Topics, not Knowledge. 

The Topic graph is split into all-encompassing Topic nodes and individual Idea nodes. Topics include many differnt Idea nodes and point to them. An Idea is a SINGLE piece of information. Most of the value that graph brings to Topics is in the linking of different Ideas together. Showing what you need to understand before you can understand an individual Idea. Furthermore, Ideas can be apart of many many different Topic domains. For example, the Idea that you should "Treat others as you wish to be treated" is something shared across a whole host of different philosophies and religions (both of which would be types of Topics) like Christianity, Islam, Kant's categorical imperative etc. Or something more scientific like the Idea of Entropy which is "The tendency of systems to move from ordered, low-probability states toward disordered, high-probability states" is something that has been rediscovered across thermodynamics, telephone signals, cosmology etc but should actually be DIFFERENT nodes. Thermodynamics Entropy is different from Telephone Signal Entropy even though they have almost the exact same language. It will be up to the Person/AI Model running the insert to decide if we should reuse an existing Idea/Topic or create a new analagous one.

Ideas are supposed to be unique and independent, for this reason Idea nodes also get a vectorisation which is a combo of their name and description properties. When we add new Ideas to the database we first do a similarity check across all the other Ideas to see if what we are attempting to insert already exists (even as apart of another Topic) and link to that instead if it does. If not, we of course insert a fresh Idea. Topics too get vectorised for the same reason.

Ideas are also broken down into 4 different types:
| type | What logical type it is | The tell (how to assign it) | Default stance surfaced | Examples |
| --- | --- | --- | --- | --- |
| concept | A graspable, sub-propositional thing. Not true or false — you can't believe or disbelieve it, only grasp it well or poorly. | "Is this a thing you understand, rather than a statement you could affirm or deny?" | Understanding (Bloom's) | Entropy, recursion, supply-and-demand, the concept of justice, a sonnet's form |
| claim | A truth-apt proposition — the type of thing that is either true or false, whether or not it's provable. | "Could you meaningfully put 'It is true that…' in front of it?" | Understanding + Belief (signed conviction) | "The earth is flat," "God exists," "energy is conserved," "astrology predicts personality" |
| norm | An imperative / ought — action-guiding content. Not true/false in the ordinary sense; you endorse it or you don't. | "Does it tell you what to do, not what is?" | Understanding + Endorsement | "Treat others as you'd want to be treated," "keep your promises," "don't waste food" |
| value | A standing evaluative commitment — a good you hold, which grounds norms but isn't itself an instruction. | "Is it a thing held dear, that you'd hold with more or less intensity?" | Holding (intensity) + thin Understanding | Loyalty, autonomy, honesty-as-a-good, novelty, tradition |


So now we can see the shape of Topics and their underlying Ideas in cypher. The following is what an imagined "Chess Opening Theory" Topic might look like, broken down into Ideas and also sub-topics:
```cypher
CREATE (cot:Topic {name:"Chess Opening Theory", description:"The study of the initial phase of a chess game: established move sequences and the principles behind them.", vector: [1, 2, 3]});

CREATE (open:Topic {name:"Open Games (1.e4 e5)", description:"Openings arising after 1.e4 e5, emphasizing rapid development and open lines.", vector: [1, 2, 3]});
CREATE (semi:Topic {name:"Semi-Open Games (1.e4, non-...e5)", description:"Black answers 1.e4 with something other than ...e5 (Sicilian, French, Caro-Kann).", vector: [1, 2, 3]});
CREATE (closed:Topic {name:"Queen's Pawn Games (1.d4)", description:"Openings arising after 1.d4, typically slower and more strategic.", vector: [1, 2, 3]});

CREATE (open)-[:SUBTOPIC_OF]->(cot);
CREATE (semi)-[:SUBTOPIC_OF]->(cot);
CREATE (closed)-[:SUBTOPIC_OF]->(cot);

CREATE (rules:Idea  {name:"Rules of chess", type:"concept", description:"How the pieces move, check, checkmate, castling.", vector: [1, 2, 3]});
CREATE (dev:Idea    {name:"Piece development", type:"concept", description:"Bringing pieces from starting squares to active posts.", vector: [1, 2, 3]});
CREATE (center:Idea {name:"Center control", type:"concept", description:"Command of the central squares (d4,e4,d5,e5).", vector: [1, 2, 3]});
CREATE (ksafe:Idea  {name:"King safety", type:"concept", description:"Protecting the king, usually via castling.", vector: [1, 2, 3]});
CREATE (tempo:Idea  {name:"Tempo", type:"concept", description:"A unit of time; a move's worth of initiative.", vector: [1, 2, 3]});
CREATE (pawns:Idea  {name:"Pawn structure", type:"concept", description:"The configuration of pawns that shapes middlegame plans.", vector: [1, 2, 3]});

CREATE (dev)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (center)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (ksafe)-[:REQUIRES_KNOWLEDGE]->(rules);
CREATE (tempo)-[:REQUIRES_KNOWLEDGE]->(dev);
CREATE (pawns)-[:REQUIRES_KNOWLEDGE]->(rules);

CREATE (ruy:Idea {name:"Ruy Lopez", type:"concept", description:"1.e4 e5 2.Nf3 Nc6 3.Bb5; pressures Black's center via the c6-knight.", vector: [1, 2, 3]});
CREATE (sic:Idea {name:"Sicilian Defense", type:"concept", description:"1.e4 c5; Black fights for the center asymmetrically.", vector: [1, 2, 3]});
CREATE (naj:Idea {name:"Najdorf Variation", type:"concept", description:"Sicilian with 5...a6; flexible, sharp, deeply analyzed.", vector: [1, 2, 3]});

CREATE (ruy)-[:REQUIRES_KNOWLEDGE]->(dev);
CREATE (ruy)-[:REQUIRES_KNOWLEDGE]->(center);
CREATE (sic)-[:REQUIRES_KNOWLEDGE]->(center);
CREATE (sic)-[:REQUIRES_KNOWLEDGE]->(pawns);
CREATE (naj)-[:SPECIALIZES]->(sic); // is-a-kind-of; pedagogical REQUIRES_KNOWLEDGE is implied

// Membership: openings belong to their family subtopics
CREATE (open)-[:INCLUDES]->(ruy);
CREATE (semi)-[:INCLUDES]->(sic);
CREATE (semi)-[:INCLUDES]->(naj);

// Norms — the classic opening principles
CREATE (castle:Idea {name:"Castle early", type:"norm", description:"Get the king to safety before launching operations.", vector: [1, 2, 3]});
CREATE (noqueen:Idea {name:"Don't develop the queen too early", type:"norm", description:"An early queen becomes a target, losing tempo.", vector: [1, 2, 3]});
CREATE (castle)-[:REQUIRES_KNOWLEDGE]->(ksafe);
CREATE (noqueen)-[:REQUIRES_KNOWLEDGE]->(tempo);

// Claims — one uncontested, one genuinely disputed
CREATE (kguns:Idea {name:"The King's Gambit is unsound at master level", type:"claim", description:"Thesis that 1.e4 e5 2.f4 is objectively dubious against best play.", vector: [1, 2, 3]});
CREATE (sicbest:Idea {name:"The Sicilian gives Black the best practical winning chances vs 1.e4", type:"claim", description:"Interpretive thesis about practical results, not a proven fact.", vector: [1, 2, 3]});
CREATE (kgsound:Idea {name:"The King's Gambit is fully playable", type:"claim", description:"Romantic counter-thesis: the gambit's initiative compensates.", vector: [1, 2, 3]});
CREATE (kguns)-[:CONTRADICTS]-(kgsound);

FOREACH (n IN [castle, noqueen, kguns, sicbest, kgsound] | CREATE (cot)-[:INCLUDES]->(n));
```

You will notice there are a ton of different relationships going on here. Within the Topics sub-graph itself, the following relationships are used:
| Relationship | From → To | Directed? | Cyclic OK? | Meaning |
| --- | --- | --- | --- | --- |
| REQUIRES_KNOWLEDGE | Idea → Idea | yes | no — sacred DAG | Pedagogical prerequisite. The only edge the learning-path query reads. |
| PRECEDES | Idea → Idea | yes | no (clean DAG) | Temporal order (events, historical facts). Kept separate from REQUIRES_KNOWLEDGE. |
| SPECIALIZES | Idea → Idea | yes | no | Narrower form of a broader Idea (Rawls's justice → Justice). |
| CONTRADICTS | Idea — Idea | symmetric | n/a | Mutually exclusive Ideas. How you hold falsehoods without the graph taking sides. |
| ANALOGOUS_TO | Idea — Idea | symmetric | yes | Same structure, different domain (thermodynamic ↔ information entropy). Not a merge. |
| SUPPORTS | Idea → Idea | yes | yes | Evidential/logical lean toward another Idea. |
| INCLUDES | Topic → Idea | yes | n/a | Collection membership (many-to-many; an Idea can be in many Topics). |
| SUBTOPIC_OF | Topic → Topic | yes | no | Topic nesting (Thermodynamics → Physics). |

And of course there are many different relationships that a Person node can have with Topics/Ideas. They are described as follows:
| Relationship | To | Key properties | Meaning |
| --- | --- | --- | --- |
| UNDERSTANDS | Idea | bloom (Remember→Create) | Epistemic grasp. Available for any type. |
| ENGAGES_TOPIC | Topic | bloom | Collection-level mastery (the top Bloom rungs — Analyze/Evaluate/Create — that are irreducibly about a set of Ideas). |
| BELIEVES | Idea (claim) | conviction (−1…+1, signed), warrant, centrality, reason, since | Doxastic stance. Orthogonal to understanding. 0 conviction = considered-but-undecided (≠ no edge). |
| ENDORSES | Idea (norm) | intensity, reason | Commitment to an ought. |
| HOLDS | Idea (value) | intensity, since | Holding a value dear. |
| CURIOUS_ABOUT | Idea / Topic | intensity | Aesthetic/affective stance → doubles as a learning goal. |
| INTIMIDATED_BY | Idea / Topic | intensity | Affective stance (reused from Skills). |
| BORED_BY | Idea / Topic | intensity | Affective stance (reused from Skills). |

So to continue with Andre and Lulu, they may have the following relationships with the Chess Opening Theory Topic:
```cypher
// Deep grasp of concepts and a specific sharp line
(andrew)-[:UNDERSTANDS {bloom:"Evaluate"}]->(center)
(andrew)-[:UNDERSTANDS {bloom:"Evaluate"}]->(sic)
(andrew)-[:UNDERSTANDS {bloom:"Analyze"}]->(naj)
(andrew)-[:ENGAGES_TOPIC {bloom:"Evaluate"}]->(cot)

// Mainstream believer on the King's Gambit; strong Sicilian partisan
(andrew)-[:BELIEVES {conviction:+0.8, warrant:"engine+practice", centrality:0.4}]->(kguns)
(andrew)-[:BELIEVES {conviction:-0.8}]->(kgsound)
(andrew)-[:BELIEVES {conviction:+0.7, warrant:"practical-results", centrality:0.6}]->(sicbest)

// Endorses principles but as a strong player, holds them loosely
(andrew)-[:ENDORSES {intensity:0.6, reason:"Sound default, but I break them with prep"}]->(castle);

// Solid on fundamentals, mid-climb; Najdorf is beyond her fringe
(lulu)-[:UNDERSTANDS {bloom:"Apply"}]->(center)
(lulu)-[:UNDERSTANDS {bloom:"Understand"}]->(sic)
// no edge to (naj) yet → Najdorf sits just past her learning frontier
(lulu)-[:ENGAGES_TOPIC {bloom:"Understand"}]->(cot)

// The interesting divergence: she disagrees with Andrew about the King's Gambit
(lulu)-[:BELIEVES {conviction:+0.6, warrant:"romantic/experience", centrality:0.5}]->(kgsound)
(lulu)-[:BELIEVES {conviction:-0.4}]->(kguns)
// hasn't formed a view on the Sicilian claim — deliberately no edge (≠ undecided)

// Endorses principles firmly (improving players lean on them harder)
(lulu)-[:ENDORSES {intensity:0.9, reason:"They keep me out of trouble"}]->(castle)
(lulu)-[:ENDORSES {intensity:0.8}]->(noqueen)

// A learning goal, expressed as an affective stance at the concept level
(lulu)-[:CURIOUS_ABOUT {intensity:0.8}]->(naj)
```
