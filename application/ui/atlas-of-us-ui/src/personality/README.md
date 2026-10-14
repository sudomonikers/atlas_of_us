# The Personality Track
Start by reading the Personality Data Model here: atlas_of_us/documentation/data_model/personality/personality.md
Also read the Seed script for Personality here: atlas_of_us/application/database/personality_seed.cypher

There are about 44 personality traits we are looking to measure here, and measuring is hard.

Your personality is the combination of many long-standing traits that shape how you *generally* act, think, and feel. If you’ve ever taken a personality test (which many of us did at school) you might be familiar with the idea that they are utter bullshit and do a terrible job of modeling people. Why? Well here at the Atlas Of Us we would argue that the underlying model isn’t the problem, but rather the way these tests gather information about you is bad.

Normally when taking a personality test you would be presented with a scenario and you are given multiple choices to answer with. Something like the following:

“Strict observance of the established rules is likely to prevent attaining a good outcome”

And then you can pick whether you agree, disagree, strongly agree or strongly disagree or are neutral.

There are several problems with this style of eliciting answers. First of all, the question is incredibly vague and doesn’t allow for much nuance at all. Nor does it attempt to figure out WHY you agree or disagree. If I was taking this test I could think of a hundred situations where it would make sense to break the rules, and another 100 where it would be a bad idea to break them. But if I was a peasant in the Aztec empire and was selected to be sacrificed, then following the rules is likely to result in my death. Which, personally I would call a bad outcome. So the answer to this question is entirely dependent on the context. Given different situations I could pick any one of the 5 different options. 

Another problem is that people generally are not the same all the time. You more than likely have a different personality at work than you do at home with your family than you do when out with your friends.

We aim to solve all of these problems as much as we can by doing a couple of things:
1. Eliciting information through gamifying the survey and putting the users in actual situations
2. Allowing the users to explain their thoughts, feelings, and decisions. Then use AI to read and understand them, and adjust their scores based on those explanations.
3. Simulating a large variety of situations across family, friends, work, alone, past and future, as well as fantasy lands to see how they change across different contexts.

To do this, we have several game-style scenarios. Each scenario is its own component, and has its own script. The scenarios are Three.js scenes that place the user directly in whatever the scenario is for visual effect, but it is mostly a text based game where a situation is laid out usually through dialogue or set exposition, and then the user is prompted to give their feelings, thoughts, and decisions as applicable. They can also explain their reason for giving the answers they do. These answers are sent to the backend where an AI model will be used to understand their answers and reasoning, and can adjust their scores as needed.

Each scene has its own art style and vibe, but uses the same underlying gameplay loop. The user is given a text box where dialogues displays and they click through like in a PokeMon game. At certain points they are expected to type in their ideas and explain them. Other than that they do not interact with the scent. It is like playing Road To Empress or reading a Choose Your Own Adventure book.

The following scenarios are what we are starting with:

| # | Scenario | Situation type | Facets measured |
|---|---|---|---|
| 1 | **The Stolen Idea.** A colleague presents your idea as their own in a meeting, then asks you for a favor the next week. | Realistic hypothetical | Anger (N), Self-Consciousness (N), Assertiveness (E), Cooperation (A), Modesty (A), Competitiveness, Fairness, Stubbornness |
| 2 | **Let Down.** Recall the last time a friend cancelled on you or let you down: what you did, how you felt, and how long it stayed with you. | Recall | Anger (N), Depression (N), Friendliness (E), Emotionality (O), Trust (A), Sympathy (A) |
| 3 | **Expedition I: Landfall.** You're shipwrecked with a small group and must decide who leads, whether to explore or secure camp, and how to handle limited supplies. | Fictional role + game with stakes | Immoderation (N), Assertiveness (E), Activity Level (E), Imagination (O), Adventurousness (O), Orderliness (C), Cautiousness (C) |
| 4 | **Expedition II: The Thief.** Rations go missing, and you have to decide what to do about the person who took them, while points and survival odds ride on your choices. | Game with stakes | Liberalism (O), Trust (A), Morality (A), Altruism (A), Cooperation (A), Sympathy (A) |
| 5 | **The Party of Strangers.** The only person you know cancels as you arrive, and the night moves through small talk, a loud opinionated guest, and an invitation to an after-party. | Realistic hypothetical, with timed beats | Self-Consciousness (N), Immoderation (N), Friendliness (E), Gregariousness (E), Excitement-Seeking (E), Cheerfulness (E) |
| 6 | **The Empty Weekend.** You have 48 hours with no obligations and a broken phone, and you describe how you'd spend it and how you'd feel by Sunday night. | Reflective | Depression (N), Gregariousness (E), Activity Level (E), Artistic Interests (O), Intellect (O), Self-Discipline (C), Introspection, Playfulness, Sensory Sensitivity |
| 7 | **The Public Mistake.** You accidentally send an embarrassing error to your whole company and have to decide what to do in the first five minutes, the rest of the day, and that night. | Realistic hypothetical, with a timed first reaction | Anxiety (N), Self-Consciousness (N), Vulnerability (N), Morality (A), Self-Efficacy (C), Dutifulness (C) |
| 8 | **Reading People.** Four short vignettes about other people's behavior, such as an unanswered message, someone tripping on stage, or a colleague's bragging, and you explain what you think is going on. | Observer judgment | Anxiety (N), Self-Consciousness (N), Emotionality (O), Trust (A), Modesty (A), Sympathy (A) |
| 9 | **The Holiday Table.** A relative makes a pointed remark about your life choices, an old family argument resurfaces, and then you're asked to host next year. | Realistic hypothetical | Anger (N), Vulnerability (N), Assertiveness (E), Liberalism (O), Cooperation (A), Dutifulness (C) |
| 10 | **The Offer.** You're offered an exciting but risky role in a new city in place of a stable job you're good at, and you talk through how you'd decide. | Reflective | Anxiety (N), Excitement-Seeking (E), Adventurousness (O), Self-Efficacy (C), Achievement-Striving (C), Cautiousness (C) |
| 11 | **Track Record.** A few short prompts about your actual recent past, such as the last commitment you didn't want to keep, the last time you felt overwhelmed, and the best moment of last week. | Recall | Depression (N), Vulnerability (N), Cheerfulness (E), Orderliness (C), Dutifulness (C), Self-Discipline (C) |
| 12 | **The Archive.** You have a timed task to sort a mysterious archive, with optional letters, artwork, and puzzles you can explore along the way. | Game with stakes (revealed behavior) | Imagination (O), Artistic Interests (O), Intellect (O), Orderliness (C), Achievement-Striving (C), Self-Discipline (C) |
| 13 | **The Rule That Doesn't Fit.** You're the person responsible for enforcing a rule, and a stranger with a sympathetic and possibly true story asks you to break it. | Realistic hypothetical, with time pressure | Friendliness (E), Liberalism (O), Morality (A), Altruism (A), Sympathy (A), Dutifulness (C) |

