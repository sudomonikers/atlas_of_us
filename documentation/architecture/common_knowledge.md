# How the Common Knowledge Walkthrough Works

Most people know something about the same things: fractions, photosynthesis, the Second World War, supply and demand.
The common knowledge walkthrough, in Topics, takes a person through a curated list of those topics, one at a time, and
finds how much of each they do know. For each topic they answer a question that puts it to use, and simpler ones
when they miss or don't know. The first they get right is the level of the topic
they're placed at, the same as placing themselves on it.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/topics/common_knowledge/` | The Common Knowledge view, and the whiteboard that asks the questions full screen. My Knowledge links to it |
| Collections API | `application/apis/atlas-api/src/domains/topics/collections.rs` | Every collection, and a collection's topics in order with whether they know each, at `/api/collections` |
| Questions API | `application/apis/atlas-api/src/domains/topics/quiz.rs` | Any topic's next question, and answering it, at `/api/topics` |
| Seed | `application/database/common_knowledge_seed.cypher` | The Common Knowledge collection, its topics in order, and the questions about each |

## The list
The list is ours: about two hundred topics most adults were taught at school or have met in everyday life, from
counting to climate change. It leaves out what only one country teaches, such as its own history. Related topics sit
next to each other, and the most familiar come first.

The list is a collection, Common Knowledge, which contains each topic on it with its place in the list. A collection
groups topics without being one, so it has no levels, nobody is placed on it, and search and the topic resolver never
see it. Any topic can be tested with questions, so a list like this is only a collection of topics that have them
(see "Testing what someone knows" in `../data_model/topics/topics.md`). The UI asks for a collection by its id, and
Common Knowledge's is `common-knowledge`.

## The questions
Each topic on the list has three multiple-choice questions, one for each of its Remember, Understand and Apply levels.
Apply is as far as they go, since the levels above take more than common knowledge. A right answer at a level stands
for every level below it, so each question shows its level: anyone at it gets it right, and nobody only at the level
below can.

| Level | What its question asks | Its wrong choices |
|---|---|---|
| Apply | Decide what to do in a new, everyday situation, or carry out one of the topic's methods to get a result. Predicting or explaining what happens is Understand | What the usual mistakes in using it give |
| Understand | Explain why or how, interpret, recognize a new example, or tell two ideas apart | The misconceptions people really hold |
| Remember | Recall or recognize a fact, term or rule, from memory alone | Facts and terms a hazy memory mixes up |

Each question tests the topic's own content, its facts, ideas and methods, never how it's taught or learned, and has
exactly one right answer. No question, or the explanation shown after it, gives away the answer to one asked after
it. They're written by hand, kept beside the list, and the same for everyone. A topic's questions are set once, the first time the seed runs. Every topic has its
six levels from when it's created, so a stub can be asked about and placed on like any other.

## Going through it
1. **Each topic, in order,** opens on its Apply question, written up on a whiteboard, with the choices in a box
   below it, the way a personality scene is laid out. They can skip a topic and come back to it.
2. **Each question they get wrong,** or say they don't know, takes them to the question a level below, down to
   Remember. After each one they see the right answer and why.
3. **The first question they get right** places them on the topic at its level, unless they're at a higher level
   already. Missing the Remember question places them nowhere.

What they answer is kept as they go, so they can leave at any point and pick up at the question they were on. A
topic they've finished stays finished. The walkthrough is free.
