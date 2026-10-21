# The Personality Module
Start by reading the Personality Data Model here: atlas_of_us/documentation/data_model/personality/personality.md
How the module works end to end, from a typed answer to a trait score, is in
atlas_of_us/documentation/architecture/personality.md.

We measure the 30 facets of the Big Five, six per domain, and measuring is hard.

Your personality is the combination of many long-standing traits that shape how you *generally* act, think, and feel. If you’ve ever taken a personality test (which many of us did at school) you might be familiar with the idea that they are utter bullshit and do a terrible job of modeling people. Why? Well here at the Atlas Of Us we would argue that the underlying model isn’t the problem, but rather the way these tests gather information about you is bad.

Normally when taking a personality test you would be presented with a scenario and you are given multiple choices to answer with. Something like the following:

“Strict observance of the established rules is likely to prevent attaining a good outcome”

And then you can pick whether you agree, disagree, strongly agree or strongly disagree or are neutral.

There are several problems with this style of eliciting answers. First of all, the question is incredibly vague and doesn’t allow for much nuance at all. Nor does it attempt to figure out WHY you agree or disagree. If I was taking this test I could think of a hundred situations where it would make sense to break the rules, and another 100 where it would be a bad idea to break them. But if I was a peasant in the Aztec empire and was selected to be sacrificed, then following the rules is likely to result in my death. Which, personally I would call a bad outcome. So the answer to this question is entirely dependent on the context. Given different situations I could pick any one of the 5 different options. 

Another problem is that people generally are not the same all the time. You more than likely have a different personality at work than you do at home with your family than you do when out with your friends.

We aim to solve these problems by doing a few things:
1. Putting the user in actual situations, instead of asking them to rate statements about themselves.
2. Letting them explain their thoughts, feelings and decisions, then using AI to read those explanations and score
   from them.
3. Covering a wide range of situations, from parties and work to a crisis and a quiet weekend, so a trait has several
   chances to show.

## Scenes are built from the IPIP-NEO
We keep the questionnaire's content and throw away its format. The IPIP-NEO is the public-domain questionnaire behind
the 30 facets, with ten statements ("items") per facet, like "I worry about things" or "I love large parties". Each
item describes a behaviour the research has validated as a sign of its facet.

So every scene is written to a set of those items:
- **We test 150 items, 5 per facet,** spread over 18 scenes. Each item is in exactly one scene, and every facet is in at
  least two.
- **A scene turns its items into moments.** Instead of asking "do you love large parties?", The Big Party puts you at
  one, with two hundred people and four you know, and asks what you do next.
- **Both ends have to look reasonable.** A moment that has an obviously right answer only measures what the player
  thinks we want to hear.
- **Some things a story can't show,** like how often your mind wanders. Those items are asked about directly, as an
  interview, with every frequency pinned down ("on how many of the last 30 days") rather than "often".
- **Every scene ends with a real-life question** about the player's own life. These are the strongest evidence we get.

Which items are in which scene, and why the scenes play in the order they do, is in `scene_grouping.md`. All 300 items,
with the IDs those docs use, are in `ipip_neo_items.md`.

## Playing a scene
Each scene has its own art style and vibe, but uses the same underlying gameplay loop. The user is given a text box where dialogues displays and they click through like in a PokeMon game. At certain points they are expected to type in their ideas and explain them. Other than that they do not interact with the scene. It is like playing Road To Empress or reading a Choose Your Own Adventure book.

## What's in this folder
- `personality.tsx`: the scenario list, the script player and the dashboard. Every scene is registered here.
- `my_personality.tsx` and `explore.tsx`: the My Personality and Explore tabs.
- `api.ts`: the calls to the api.
- `soundscape.ts`: looping beds and one-shot sounds, shared by every scene.
- A folder per scene: its `script.ts`, its art and its sounds.
- `scene_grouping.md` and `ipip_neo_items.md`: what each scene tests.
- `CREATE_SCENE.md`: how to add a scene.
- `testing/`: the persona regression harness, its personas and past results. The early round notes and results there
  are from the first version of the module, before scenes were built from IPIP-NEO items.
