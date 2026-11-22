# How Collections Work

Most people know something about the same things: fractions, photosynthesis, budgeting, how a lease works. A
collection is a curated list of such topics that a person goes through one at a time, in Topics, to find how much of
each they do know. For each topic they answer a question that puts it to use, and simpler ones when they miss or don't
know. The first they get right is the level of the topic they're placed at, the same as placing themselves on it.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/topics/collections/` | The Collections view, each collection's progress, and the board that asks the questions full screen in the collection's scene. My Knowledge links to it |
| Collections API | `application/apis/atlas-api/src/domains/topics/collections.rs` | Every collection with how far through it the person is, and a collection's topics in order with whether they know each, at `/api/collections` |
| Questions API | `application/apis/atlas-api/src/domains/topics/quiz.rs` | Any topic's next question, and answering it, at `/api/topics` |
| Lists | `application/database/topics_import/lists/` | A collection's topic names, which the topics import asks the API for |
| Seeds | `application/database/collections/` | Each collection, its topics in order, and the questions about each |

## Collections
A collection groups topics without being one, so it has no levels, nobody is placed on it, and search and the topic
resolver never see it. It contains each of its topics with its place in the list, and a topic can be in more than one.
Any topic can be tested with questions, so a collection is only a list of topics that have them (see "Testing what
someone knows" in `../data_model/topics/topics.md`). The UI asks for a collection by its id.

| Collection | Id | Scene | What's in it |
|---|---|---|---|
| Common Knowledge | `common-knowledge` | A classroom | About two hundred topics most adults were taught at school or have met in everyday life, from counting to climate change |
| Life Knowledge | `life-knowledge` | A kitchen | About eighty topics adult life takes that school mostly skipped: money, paperwork, work, health, the home, getting around and the people in your life |
| Digital Knowledge | `digital-knowledge` | A study | About sixty topics getting by safely and well online and on our devices takes: security, privacy, how it all works, files, feeds and AI, money online and getting along |

Each list is ours. It leaves out what only one country teaches or requires, such as its own history, laws or tax
rates, and asks about principles that hold in most places. Related topics sit next to each other, and the most familiar
come first.

A list starts as names. The topics import asks the API for each one the way any topic is asked for, so the gates and
the topic resolver make each one the topic we already have, or a new stub. The seed names each topic by the id it
resolved to.

## The questions
Each topic in a collection has three multiple-choice questions, one for each of its Remember, Understand and Apply
levels. Apply is as far as they go, since the levels above take more than everyday knowledge. A right answer at a level
stands for every level below it, so each question shows its level: anyone at it gets it right, and nobody only at the
level below can.

| Level | What its question asks | Its wrong choices |
|---|---|---|
| Apply | Decide what to do in a new, everyday situation, or carry out one of the topic's methods to get a result. Predicting or explaining what happens is Understand | What the usual mistakes in using it give |
| Understand | Explain why or how, interpret, recognize a new example, or tell two ideas apart | The misconceptions people really hold |
| Remember | Recall or recognize a fact, term or rule, from memory alone | Facts and terms a hazy memory mixes up |

Each question tests the topic's own content, its facts, ideas and methods, never how it's taught or learned, and has
exactly one right answer. No question, or the explanation shown after it, gives away the answer to one asked after
it. They're written by hand, kept in the collection's seed, and the same for everyone. A topic's questions are set once,
the first time a seed writes them, and a topic in two collections has one set of questions. Every topic has its six
levels from when it's created, so a stub can be asked about and placed on like any other.

## Going through one
1. **Each topic, in order,** opens on its highest question, written up on a whiteboard hung in the collection's scene,
   with the choices in a box below it, the way a personality scene is laid out. They can skip a topic and come back
   to it.
2. **Each question they get wrong,** or say they don't know, takes them to the next question below it, down to
   Remember. After each one they see the right answer and why.
3. **The first question they get right** places them on the topic at its level, unless they're at a higher level
   already. Missing the lowest question places them nowhere.

What they answer is kept as they go, so they can leave at any point and pick up at the question they were on. A
topic they've finished stays finished. Collections are free.

## Scenes
Each collection's board hangs in a scene drawn for it, in the Atlas's flat, inked style: a classroom wall for Common
Knowledge, a kitchen for Life Knowledge, with the fridge, the corkboard of bills and the keys around the board, and a
study for Digital Knowledge, with the router on the bookcase and a crossed-out password stuck to the monitor. A
scene keeps what matters at its sides and along its top and bottom, so on a narrow screen the board covers the middle
and the scene still shows around it. A collection without a scene of its own uses the classroom.
