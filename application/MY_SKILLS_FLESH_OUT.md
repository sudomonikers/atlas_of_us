# Fleshing out My Skills

Ideas for making the My Skills tab more useful, to work through one at a time.

## The starting list

- See all of my skills, with a count at each level, compared to global averages.
- See the unique skills that set me apart, the ones only a small share of people have.
- A recommendations tab:
  - What I can do with the skills I have.
  - Which skills would be good to acquire to level myself up.
  - What knowledge I need to level up.
  - Which personality traits to work on.

### Notes on the starting list

- **Global averages.** While there are few users, averages are noisy. Hide a comparison until enough people have the
  skill, and word it as "among Atlas users". Within a skill, "you're in the top 15% of people who cook" probably means
  more than comparing level counts.
- **Unique skills.** A skill can be rare because it's niche (falconry) or because it's hard to get good at (Expert
  surgery). Rarity at your level is the more accurate signal. Rare combinations are often more distinctive than rare
  single skills: plenty of people program and plenty play chess, but few do both at Proficient.
- **What I can do with my skills.** The graph has nothing to point this at yet, such as roles, jobs or projects. ESCO,
  which already seeds Topics, also maps occupations to skills, so it could become an Occupation node. Works and Events
  could later supply projects and activities.
- **Skills to level up.** Rank skills whose lower levels mostly need things you already have (cheap to reach), and
  skills that many of your other skills require (worth more).
- **Knowledge.** Compare the REQUIRES_KNOWLEDGE links on the next level of each of your skills against your
  ENGAGES_TOPIC levels, giving a list of topics with the depth needed.
- **Personality traits.** Traits are fairly stable, so word these as "habits that help at the next level" rather than
  traits to fix. Skip traits where the confidence is low.

## More ideas

### From the graph as it is today

1. **(Done) The next step for each skill.** Show the NEXT_LEVEL description beside each skill, with a short checklist of what
   the next level requires, marking the skills and knowledge you already meet, with your trait scores beside the traits.
2. **Criteria changed.** When an ACHIEVED's `levelVersion` is older than the level's current version, flag the skill
   and invite the person to re-read the level and confirm or adjust.
3. **(Done) Skills you probably have.** Requirements carry up, so an Expert cook almost certainly has Competent Knife Skills.
   Suggest skills the person hasn't claimed yet.
4. **Gaps in claims.** When someone claims Expert in a skill but is missing, or lower in, a skill it strongly requires,
   prompt them gently. Either the claim or the gap may be wrong.
5. **Level against feeling.** Cross ACHIEVED with LIKES, BORED_BY and INTIMIDATED_BY:
   - Good at it but bored by it: a burnout or delegation candidate.
   - Liked but still Novice: an easy growth pick.
   - Intimidating but one step from the next level: an encouraging nudge.
6. **(Done) Practice.** Use PRACTICES `hoursPerWeek` to show where time goes. Flag high-level skills with no practice (getting
   rusty), and skills with lots of practice but no level change for a long time (a plateau).
7. **How well backed up each claim is.** Show which levels have evidence and endorsements and which are claims alone,
   with a prompt to add evidence to the ones that matter most.
8. **Skill families.** Group skills by SPECIALIZATION_OF to show breadth against depth ("T-shaped: deep in Cooking,
   broad across Crafts"), and suggest neighbouring specializations of skills you're strong in.
9. **(Done) Natural fits.** Compare your traits with REQUIRES_TRAIT to find skills that suit you, ranked by how well your
   trait levels match. Also show skills you got good at despite your traits, as an "against the grain" highlight.
10. **(Done) Timeline.** Use `since` and `updatedAt` to show progress over time, such as when you went from Competent to
    Proficient.

### Needing small additions

11. **(Done) Goals.** Pick a skill and a target level and track progress towards it. Needs a relationship such as
    WANTS_TO_REACH, like CURIOUS_ABOUT on topics.
12. **Learning path.** For a target, list the ordered chain of requirements: skill levels first, then topics, following
    REQUIRES_KNOWLEDGE down through Ideas.
13. **Mentors and peers.** Find people a level or two above you in a skill who have public profiles, and people who
    want to learn something you're an Expert at.
14. **Complementary people.** Find users whose strengths cover your gaps, for collaborating or forming teams.
15. **Skills summary export.** A shareable, resume-like snapshot: top skills, rare skills, and evidence-backed claims
    marked as such.

## Suggested order

1. The next step for each skill (1). It turns the list into something to act on.
2. Skills you probably have (3). It makes the profile better and adds to the graph.
3. Level against feeling (5). It's cheap and personal.

All three work with today's graph and need no user base. The global comparisons and unique skills come later, once
there are enough users for the numbers to mean something.
