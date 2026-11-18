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
| Hosting | `application/infrastructure/business_hosting.tf` | The business site's bucket, CloudFront and DNS |

## Where occupations come from
The occupations and their ratings are O\*NET's, seeded once and seeded again on a new O\*NET release. Which topic,
skill or personality trait each of O\*NET's knowledge areas, skills and work styles is in the Atlas is chosen by hand,
in `onet_import/links.tsv`. A topic or skill named there is asked for through the API first, like any other, so it
exists once.

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
The module publishes no events and reacts to none. Closeness is worked out when it's read.
