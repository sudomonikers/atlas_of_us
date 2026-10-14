# QA round 2: "Dev"

## The persona
Dev is 29 and works in sales at a startup. Dev lives with two flatmates, plays five-a-side football twice a week, and is always the one organising the group trip.

**What Dev is like:**
- Loud, warm, funny and restless. Very competitive.
- Takes risks and speaks first.
- Gets bored with detail and leaves things half-finished.
- Bends rules when they get in the way, and will tell a white lie.
- Quick to anger, and quick to get over it.
- Under the confidence, a real worrier. Dev lies awake replaying pitches, gets a tight chest before big moments, and goes anyway.

**Why this persona:**
- **Opposite of Ruth:** round 1's Ruth was an introverted, cautious rule-follower whose answers were long and all pointed the same way, so she was easy to read.
- **Harder in two ways:**
  - Answers are short, lowercase and casual, like real players' ("sleep probably lol"). That tests whether thin evidence still reaches the ends of the scale.
  - Several traits pull against each other: high Anxiety alongside high Boldness, high Friendliness alongside low Cooperation and Modesty, high Achievement-Striving alongside low Self-Discipline and Perfectionism.

**What it checks from round 1's fixes:**
- **Achievement-Striving vs standards:** Dev's ambition should score high even though Dev's standards are low.
- **Introspection and Emotionality:** these should no longer rise just because Dev answers the feeling questions.
- **Decisiveness:** should come from the real-life answers, not from which option Dev picked.
- **Playfulness and Cheerfulness:** should now get evidence from the new joking and midnight moments.

## Intended scores (0 to 1)

| Domain | Trait | Target | Domain | Trait | Target |
|---|---|---|---|---|---|
| Openness | Imagination | 0.75 | Agreeableness | Trust | 0.40 |
| | Artistic Interests | 0.35 | | Morality | 0.45 |
| | Emotionality | 0.40 | | Altruism | 0.65 |
| | Adventurousness | 0.85 | | Cooperation | 0.35 |
| | Intellect | 0.55 | | Modesty | 0.20 |
| | Liberalism | 0.70 | | Sympathy | 0.55 |
| Conscientiousness | Self-Efficacy | 0.75 | Neuroticism | Anxiety | 0.75 |
| | Orderliness | 0.20 | | Anger | 0.65 |
| | Dutifulness | 0.30 | | Depression | 0.30 |
| | Achievement-Striving | 0.85 | | Self-Consciousness | 0.30 |
| | Self-Discipline | 0.30 | | Immoderation | 0.80 |
| | Cautiousness | 0.20 | | Vulnerability | 0.45 |
| Extraversion | Friendliness | 0.80 | Beyond | Adaptability | 0.70 |
| | Gregariousness | 0.85 | | Boldness | 0.85 |
| | Assertiveness | 0.80 | | Competitiveness | 0.90 |
| | Activity Level | 0.80 | | Decisiveness | 0.80 |
| | Excitement-Seeking | 0.85 | | Fairness | 0.50 |
| | Cheerfulness | 0.75 | | Independence | 0.70 |
| | | | | Introspection | 0.30 |
| | | | | Optimism | 0.70 |
| | | | | Patience | 0.15 |
| | | | | Perfectionism | 0.25 |
| | | | | Playfulness | 0.85 |
| | | | | Resilience | 0.70 |
| | | | | Sensory Sensitivity | 0.30 |
| | | | | Stubbornness | 0.70 |

The traits in the middle are Intellect, Fairness and Sympathy.

## Key choices
- **Landfall:** leads, explores, takes the rum, goes to the light now.
- **The Thief:** searches everyone, cuts Tob's rations, blames Maren, eats their own portion.
- **Empty Weekend:** goes to the regatta, plays the quiz to win.
- **Party of Strangers:** finds the host, joins the loud group, goes all in on karaoke, fills the glass, goes sledding.
- **Let Down:** tries to make Juno laugh.
- **The Archive:** dives straight in, reads the letter, looks properly at the sketchbook, works out the orrery, marks the plates "unsorted", finishes just in time.
- **Proven Wrong:** sends off another sample first.
- **The Stolen Idea:** tells the audience the trick is theirs, claims the headline spot, takes the Mirror Walk on the road.
- **The Rule That Doesn't Fit:** lets Nessa on, tells the captain "120".
- **The Offer:** "When do I leave?", goes out on the hull, "I've handled worse", goes.
- **The Water:** goes for water alone.
- **The Black Clay:** says yes to all forty, opens the kiln at first grey, asks Mariana for two more weeks.

## Results (14 Oct 2026)
- **What was scored:** 100 answers across 13 scenes, giving 362 per-answer scores ("shifts").
- **Scoring:** the deployed scorer with the round 1 changes, with `PRIOR` at 3 and real-life answers counted double. Re-scoring the evidence offline reproduces the API's values exactly, which confirms the formula is live.
- **Error:** the average gap between score and target is **0.14**. Every trait has evidence.
- In the table:
  - **W** is the total weight of all answers that scored the trait, before real-life answers are doubled.
  - **mean** is the weighted average of those answers' levels, from −1 to +1.
  - **conf** is the confidence the scorer reports for the trait.

| Trait | Target | Got | Error | Conf | Answers | W | Mean level |
|---|---|---|---|---|---|---|---|
| Introspection | 0.30 | 0.82 | +0.52 | 0.78 | 7 | 4.2 | +0.54 |
| Orderliness | 0.20 | 0.59 | +0.39 | 0.50 | 3 | 2.0 | +0.21 |
| Emotionality | 0.40 | 0.78 | +0.38 | 0.73 | 8 | 3.9 | +0.49 |
| Morality | 0.45 | 0.82 | +0.37 | 0.86 | 16 | 10.4 | +0.48 |
| Artistic Interests | 0.35 | 0.67 | +0.32 | 0.37 | 2 | 1.2 | +0.62 |
| Vulnerability | 0.45 | 0.14 | -0.31 | 0.82 | 13 | 7.7 | -0.57 |
| Patience | 0.15 | 0.44 | +0.29 | 0.35 | 2 | 1.1 | -0.24 |
| Fairness | 0.50 | 0.76 | +0.26 | 0.66 | 6 | 3.9 | +0.50 |
| Intellect | 0.55 | 0.79 | +0.24 | 0.64 | 5 | 2.8 | +0.58 |
| Anxiety | 0.75 | 0.53 | -0.22 | 0.85 | 13 | 8.0 | +0.00 |
| Resilience | 0.70 | 0.89 | +0.19 | 0.87 | 14 | 9.3 | +0.65 |
| Sensory Sensitivity | 0.30 | 0.48 | +0.18 | 0.31 | 2 | 0.9 | -0.10 |
| Sympathy | 0.55 | 0.72 | +0.17 | 0.74 | 10 | 5.5 | +0.36 |
| Dutifulness | 0.30 | 0.14 | -0.16 | 0.80 | 9 | 6.0 | -0.61 |
| Depression | 0.30 | 0.45 | +0.15 | 0.17 | 1 | 0.4 | -0.40 |
| Altruism | 0.65 | 0.80 | +0.15 | 0.78 | 10 | 6.9 | +0.50 |
| Perfectionism | 0.25 | 0.40 | +0.15 | 0.63 | 6 | 3.4 | -0.19 |
| Anger | 0.65 | 0.80 | +0.15 | 0.77 | 10 | 5.6 | +0.52 |
| Self-Efficacy | 0.75 | 0.87 | +0.12 | 0.77 | 8 | 5.3 | +0.67 |
| Adaptability | 0.70 | 0.82 | +0.12 | 0.69 | 7 | 3.8 | +0.58 |
| Optimism | 0.70 | 0.81 | +0.11 | 0.71 | 7 | 4.2 | +0.60 |
| Independence | 0.70 | 0.80 | +0.10 | 0.59 | 4 | 2.9 | +0.71 |
| Assertiveness | 0.80 | 0.90 | +0.10 | 0.88 | 20 | 12.9 | +0.66 |
| Imagination | 0.75 | 0.84 | +0.09 | 0.68 | 5 | 3.3 | +0.67 |
| Activity Level | 0.80 | 0.89 | +0.09 | 0.77 | 6 | 4.0 | +0.71 |
| Decisiveness | 0.80 | 0.88 | +0.08 | 0.77 | 9 | 6.0 | +0.71 |
| Stubbornness | 0.70 | 0.78 | +0.08 | 0.75 | 10 | 5.5 | +0.53 |
| Cooperation | 0.35 | 0.42 | +0.07 | 0.69 | 9 | 4.5 | -0.13 |
| Liberalism | 0.70 | 0.63 | -0.07 | 0.34 | 2 | 1.1 | +0.52 |
| Boldness | 0.85 | 0.92 | +0.07 | 0.88 | 18 | 13.0 | +0.73 |
| Trust | 0.40 | 0.46 | +0.06 | 0.72 | 8 | 4.3 | +0.03 |
| Cheerfulness | 0.75 | 0.81 | +0.06 | 0.66 | 5 | 3.0 | +0.64 |
| Self-Consciousness | 0.30 | 0.35 | +0.05 | 0.60 | 4 | 2.5 | -0.43 |
| Self-Discipline | 0.30 | 0.35 | +0.05 | 0.81 | 13 | 7.1 | -0.18 |
| Gregariousness | 0.85 | 0.89 | +0.04 | 0.80 | 9 | 6.1 | +0.70 |
| Playfulness | 0.85 | 0.81 | -0.04 | 0.66 | 6 | 3.8 | +0.64 |
| Adventurousness | 0.85 | 0.89 | +0.04 | 0.83 | 12 | 7.8 | +0.68 |
| Modesty | 0.20 | 0.23 | +0.03 | 0.70 | 6 | 3.9 | -0.45 |
| Achievement-Striving | 0.85 | 0.88 | +0.03 | 0.84 | 10 | 6.8 | +0.66 |
| Excitement-Seeking | 0.85 | 0.87 | +0.02 | 0.76 | 8 | 5.6 | +0.69 |
| Immoderation | 0.80 | 0.82 | +0.02 | 0.69 | 5 | 3.2 | +0.62 |
| Cautiousness | 0.20 | 0.19 | -0.01 | 0.87 | 19 | 12.1 | -0.43 |
| Friendliness | 0.80 | 0.79 | -0.01 | 0.64 | 5 | 3.0 | +0.63 |
| Competitiveness | 0.90 | 0.91 | +0.01 | 0.81 | 10 | 7.2 | +0.76 |

## Analysis

### What the round 1 changes fixed
- **Playfulness and Cheerfulness are now measured.** They came out at 0.81 and 0.81, from 6 and 5 answers. In round 1 they had no evidence. The joking moment (Delphine), the embarrassing-photo game (`your_turn`) and the midnight prompt (`the_new_year`) all produced evidence.
- **Achievement-Striving is separate from standards.** Dev scored 0.88 on Achievement-Striving while scoring low on Perfectionism (0.40) and Self-Discipline (0.35). This is the split Ruth's round showed the scorer couldn't make.
- **Decisiveness is right** at 0.88 against a target of 0.80.
- **Short, casual answers still reach the ends of the scale.**
  - Examples: Competitiveness 0.91, Boldness 0.92, Cautiousness 0.19, Modesty 0.23, Dutifulness 0.14.
  - `PRIOR` 3 didn't flatten them, because consistent answers still add up.
- **Traits pulling in opposite directions were kept apart for the most part.** Dev is warm but uncooperative (Friendliness 0.79, Cooperation 0.42) and ambitious but undisciplined, and both came out right.
- **Small amounts of evidence now stay closer to the middle.** For example, Depression scored 0.45 from one answer of weight 0.4. In round 1, Stubbornness had jumped to 0.82 from little more.

### Where it missed, and why

1. **Introspection (0.82 against 0.30) and Emotionality (0.78 against 0.40) are still inflated.** This is the biggest problem the scoring system still has.
   - The new rule stopped the scorer crediting "answered a feelings question". It now credits self-awareness inside the answer instead.
   - Examples:
     - "i change my mind fast when i see it" scored Introspection +0.6.
     - "stomach churning" scored Emotionality +0.5.
     - "gutted" scored Emotionality +0.3.
   - Almost all the Introspection evidence comes from the real-life questions. Those questions ask the player to look back at themselves, so any answer looks reflective. Counting real-life answers double then amplifies it.
   - Even Dev's short one-liners name a feeling, so anyone who answers at all looks emotionally aware.
   - Both traits are mostly products of the question format, not of the person.
2. **Anxious-but-bold doesn't come through.** Anxiety came out at 0.53 against 0.75, and Vulnerability at 0.14 against 0.45. Dev's mean level for Anxiety is exactly 0.00.
   - Dev's two real-life admissions ("replaying the call keeps me up", "i get anxious and stressed, lie awake") each scored +0.6 at weight 0.8.
   - Six in-scene answers cancelled them out by reading a confident choice as low Anxiety:
     - "When do I leave?" scored −0.6, with the evidence "no hesitation or worry expressed".
     - Walking into the party scored −0.6.
     - The breezy logbook entry scored −0.5.
   - That's the "no sign of it is evidence" mistake the scoring rule bans. The scorer treats dangerous moments as "clearly calling for" anxiety.
   - Anxiety is something people feel, not something they visibly do. A bold choice says nothing about whether someone worried beforehand.
   - Vulnerability ("panicky under pressure; low is steady in a crisis") came out low, and that is mostly fair. I wrote Dev as steady during emergencies ("felt fine during, shaky after"), so the target of 0.45 was set too high.
3. **Some targets were wrong, not the scorer.** The answers I wrote for Dev show more of these traits than the targets assumed.
   - **Morality (0.82 against 0.45):**
     - Morality is defined as "frank and genuine rather than manipulative", and Dev is relentlessly frank: calling Ren out, "tell him straight", "a bit pissed off".
     - Dev's one lie, telling the captain "120", was scored correctly at −0.8, weight 0.9. One lie against 15 frank answers still nets high.
     - Some of this is the target's fault. Bending rules belongs to Dutifulness, which came out low at 0.14 as intended.
   - **Fairness (0.76 against 0.50):** Dev kept saying "fair's fair" and "everyone gets the same".
   - **Intellect (0.79 against 0.55):** Dev read the letter, solved the orrery, and built a spreadsheet tool nobody asked for.
   - **Resilience (0.89 against 0.70):** "the next morning i was ringing the next one".
   - **The lesson for persona rounds:** a target is only fair if the answers actually show it. Next round, I'll set targets from the answers once they're written, not before.
4. **Some traits fit the answer poorly.**
   - **Orderliness:** 0.59 against 0.20, from 3 answers. A quick plan in a crisis was read as liking structure. Examples:
     - "cook now, entertain the kid, do watches" scored +0.7.
     - "keep it simple. two people check the stores" scored +0.6.
     - It's being practical, not liking order.
   - **Patience:** 0.44 against 0.15, from 2 answers. "i will let it go when my version sells more tickets" was read as patience. It's really a grudge with a condition attached.
   - **Artistic Interests:** 0.67, from 2 answers. Curiosity about the sketchbook and orrery was read as feeling for beauty. It's really Intellect or Imagination.
5. **Some traits still have very little evidence.**
   - Five traits have W of 1.2 or less: Patience, Liberalism, Artistic Interests, Sensory Sensitivity and Depression.
   - For people who aren't in a crisis, only one scene gives each of these a chance:
     - Patience: Black Clay.
     - Liberalism: the rule question.
     - Sensory Sensitivity: the pier.
     - Depression: Let Down and the setback questions.
   - Their scores will move around until more prompts aim at them.

### Recommendations (not done)
- **Cut Introspection, and either cut Emotionality or score it only from the real-life questions.**
  - Two rounds with opposite personas both came out at 0.78–0.93.
  - Every question asks people to reflect, so the format can't measure these traits.
  - Emotionality is a Big Five facet, so I'd keep it but restrict it rather than cut it.
- **Anxiety: score it only from what people say they feel, never from how boldly they choose.**
  - Add to the scoring rules: "Anxiety is felt, not done. A bold or calm choice is not evidence of low Anxiety; only what they say about worrying is."
  - Expect this to fix anxious-but-bold players.
- **Watch Morality.** It's the IPIP definition (frankness), and that's working as designed. If you'd rather it meant honest with the truth, the description needs to change, not the scorer.
- **Orderliness, Patience, Artistic Interests:** add them to the "keep neighbouring traits apart" rule. A quick plan isn't Orderliness, and curiosity isn't Artistic Interests.
- **Thin traits:** the light-hearted scene suggested in round 1 would cover Artistic Interests and Liberalism. Patience and Sensory Sensitivity each need one more prompt somewhere.
- **No change to `PRIOR` or `REAL_LIFE`.** With both personas, consistent evidence reaches the ends and small amounts of evidence stay nearer the middle.
