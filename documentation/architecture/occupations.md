# How the Occupations Module Works

The Occupations module shows a person how far they are from each kind of work: what the work takes across the Atlas,
what of it they already have, and which kinds of work they're closest to. It's the first part of the business site,
business.atlas-of-us.com. For the graph itself, read `../data_model/occupations/occupations.md`.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| Business site | `application/ui/atlas-business-ui/` | Searching for occupations, the ones closest to you, and an occupation's page |
| API | `application/apis/atlas-api/src/domains/occupations/` | Search, the closest list, and one occupation with how far the person is from it |
| Seed | `application/database/onet_import/`, `onet_occupations_seed.cypher` | The occupations and what each takes, generated from O\*NET |
| Resolver | `application/apis/atlas-shared/src/occupations/` | Decides whether an occupation someone asks for is one we have |
| Jobs | `application/apis/atlas-jobs/src/events/occupation_created/` | Work out what an added occupation takes, a job per module |
| Hosting | `application/infrastructure/business_hosting.tf` | The business site's bucket, CloudFront and DNS |

## Where occupations come from
Occupations come in two ways.

**O\*NET's,** seeded once and seeded again on a new O\*NET release. Which topic, skill or personality trait each of
O\*NET's knowledge areas, skills and work styles is in the Atlas is chosen by hand, in `onet_import/links.tsv`. A topic
or skill named there is asked for through the API first, like any other, so it exists once.

**Added by people,** for work O\*NET doesn't have:
1. **The gates.** One call to a fast model reads what they typed as "they work as ...", and checks it's work people do
   for a living, rather than a skill or a subject. It titles it the way O\*NET does ("Drone Pilots"), describes it, and
   screens out gibberish, jokes and slurs.
2. **The resolver** decides whether it's an occupation we have, under its own title or another: an exact title or
   alternate title is the same, and otherwise a fast model judges the nearest occupations by embedding. Pipefitter is
   Plumbers, Pipefitters, and Steamfitters. Each title exists once.
3. **A new occupation** is created `filling`, and `OccupationCreated` is published.
4. **Four jobs react,** one per module, each in its own rule. Each reads the five O\*NET occupations nearest it by
   meaning, with what they take, as references, and works out its part on the same scales:
   - **Abilities** rates the abilities it takes on O\*NET's level scale, by their example tasks, and the physical
     demands of the work.
   - **Topics** names the knowledge it takes at Bloom levels, which the topic resolver finds or makes as stubs.
   - **Skills** names the skills it takes at Dreyfus levels, which the skill resolver finds or makes as stubs.

   Topics and Skills are also shown the existing topics or skills nearest the occupation by meaning, and name one
   subject or skill each, by its existing name where there is one. So the occupation links to the topics and skills
   people already have, and a new one is a subject or skill of its own.
   - **Personality** names the traits that matter to the work, with their importance and which end.
5. **When the last part is in,** the occupation is `ready` and `OccupationFilled` is published. A part that fails is
   marked, and the occupation is `failed` once nothing is left to work out.

The business site opens an added occupation straight away, and each part shows as it arrives.

## How far a person is from an occupation
Each thing the work takes gets a score from 0 to 1 for the person, where 1 means they have it:

| The work takes | The person's side | Score |
|---|---|---|
| A topic, to a Bloom level | Their level in the topic | Their level as a share of the one it takes |
| A skill, to a Dreyfus level | Their level in the skill | The same |
| An ability, at a level | Where they stand on it | Where they stand as a share of the level, on one scale from 0 to 1 |
| A trait, with an importance | Their score on it | Their score as a share of where the work pulls: above the middle, further the more it matters, or below it for a trait's low end |

An occupation's closeness is the mean of its scores, weighted by how important each one is to the work. Abilities and
traits that matter less than "important" are left out, as knowledge and skills are in the seed.

What counts is what the person has given:
- **Knowledge** counts once they've placed themselves on a topic. From then, a topic the work takes that they aren't on
  scores 0.
- **Skills** count the same way, once they're on a skill.
- **Abilities and traits** count once measured.

Coverage is the share of the work's weight that counts, so a closeness that rests on little shows it. Someone who has
only played the personality scenarios sees the work their personality suits, and the list sharpens as they add more.

The closest list ranks every occupation for the person in one query, on request. Nothing is stored: a change to a
person's levels or scores shows the next time they look.

## What the work is like for the body
Every occupation page says how often the work has people in each physical demand, such as standing or loud noise, for
anyone. For a logged in person, a demand the work has them in often, from about half the time or monthly, is set
beside what they've noted in what it strains: an impairment in the function or part, or in a part of it or a kind of it,
and a condition that affects one. A note shows only to the person. How close they are comes from their levels and scores
alone, as where a person stands on an ability comes from their readings alone, with impairments noted beside it.

## The business site
The business site is a second web app beside atlas-of-us.com, with its own professional look. It's served the same
way, from its own bucket behind its own CloudFront, which sends `/api/*` to the same API. So it has the same accounts,
and people log in with the same phone and password. Its login is kept for that site. What a person knows and can do
is added on atlas-of-us.com, and the business site links there for it.

## Events
Occupations events have the source `atlas.occupations`. How they move is in `events.md`.

| Event | When | Who cares |
|---|---|---|
| `OccupationCreated` | Someone added an occupation | Abilities, Topics, Skills and Personality, which each work out their part |
| `OccupationFilled` | The last part of an added occupation is worked out, and it's ready | Admin metrics |

Closeness is worked out when it's read, so it needs no events.
