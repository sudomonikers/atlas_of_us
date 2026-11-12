// Two Players: the story that opens the physical module. Andrew and Daniel both want to know whether they could be great
// at Basketball. Andrew looks the part, tall and strong, but his stamina and coordination fall short, so Atlas shows him
// exactly what to work on. Daniel is quick and steady-handed, but a car accident left him using a wheelchair, so Atlas
// is honest that Basketball is out of reach, and then shows him the skills his hands and eyes are made for: Piano and
// Archery. The point for the player: neither of them could tell from the mirror, and Atlas could, once it knew them.
// Between the story's parts, interludes step out of it to show how the Atlas works, on the real skills: the Basketball
// skill on the skill graph, its levels and the abilities each one takes, and Andrew and Daniel set against them.
// It ends by asking where the player wants to start finding out about themselves.
// Abilities and conditions named here are the Atlas's own (physical_abilities_seed.cypher, physical_conditions_seed.cypher).

//a made-up person, as the skill page would know them: where they stand on each ability, 0 to 1 as on the skill page,
//and the conditions they've noted, with the abilities each can affect
export interface Person {
  name: string;
  abilities: Record<string, number>;
  conditions?: { name: string; affects: string[] }[];
}

//the ways the skill graph links a skill: to the physical abilities and personality traits it takes, the knowledge it
//needs, the skills it needs, the skills it's a kind of, and the skills like it
export type LinkType = 'able' | 'takes' | 'knows' | 'needs' | 'kind_of' | 'similar';
const SKILLS_TOO: LinkType[] = ['able', 'takes', 'knows', 'needs', 'kind_of', 'similar'];

//the real Atlas, shown in place of the drawn scene during an interlude
export type Stage =
  | { kind: 'graph'; skills: string[]; expand?: boolean; show?: LinkType[] } //the skills, by name, on the skill graph, with what they link to brought in when expand is set, and only the kinds of link in show when it's given
  | { kind: 'fit'; person: Person; skills: string[]; rank: number; focus?: string[] } //person's strengths and gaps against each skill at rank, drawn from them through their abilities to the skills, with the skills in focus picked out
  | { kind: 'skill'; skill: string; rank: number; person?: Person; abilities?: string[] }; //a skill's levels open at rank (1 Novice to 5 Expert), with the abilities it takes, set against person when given, and abilities picked out

export interface Frame {
  text: string; //the text displayed on screen for the user
  animation?: string; //the consuming component will have a function with 'animation's value
  stage?: Stage; //shown in place of the animation
  speaker?: string; //who is talking; omitted for narration
}

export interface Choice {
  label: string; //the option shown to the user
  next?: string; //id of the Section to continue with if this choice is picked
  chapter?: string; //id of the test chapter to open if this choice is picked, which ends the story
}

export interface ChoiceFrame {
  id: string; //unique within the script
  prompt: string; //the question shown to the user above the choices
  animation: string;
  choices: Choice[];
}

export type Step = Frame | ChoiceFrame;

export interface Section {
  steps: Step[];
  interlude?: string; //the title of an interlude, set on a section that steps out of the story to show how the Atlas works
  next?: string; //id of the Section that follows; omitted on the final Section, ignored when the last step is a ChoiceFrame
}

export interface Script {
  id: string;
  title: string;
  start: string; //id of the first Section
  sections: Record<string, Section>;
}

const ANDREW = 'Andrew';
const DANIEL = 'Daniel';
const MARCUS = 'Marcus'; //Daniel's younger brother

const BASKETBALL = 'Basketball';
const EXPERT = 5;
const COMPETENT = 3;
const PROFICIENT = 4;

//Andrew as the tests find him: big and strong, but short on stamina and coordination
const andrew: Person = {
  name: ANDREW,
  abilities: {
    Stamina: 0.24,
    'Explosive Strength': 0.82,
    'Dynamic Strength': 0.86,
    'Gross Body Coordination': 0.38,
    'Multilimb Coordination': 0.33,
    'Reaction Time': 0.52,
    'Depth Perception': 0.55,
  },
};

//Andrew three months into his training
const andrewLater: Person = {
  ...andrew,
  abilities: { ...andrew.abilities, Stamina: 0.56, 'Gross Body Coordination': 0.5, 'Multilimb Coordination': 0.47 },
};

//Daniel as the tests find him: quick, steady hands and sharp eyes, with paraplegia from his accident
const daniel: Person = {
  name: DANIEL,
  abilities: {
    'Finger Dexterity': 0.94,
    'Arm-Hand Steadiness': 0.91,
    'Wrist-Finger Speed': 0.93,
    'Multilimb Coordination': 0.92,
    'Control Precision': 0.9,
    'Memorization': 0.9,
    'Far Vision': 0.88,
    'Hearing Sensitivity': 0.86,
    'Reaction Time': 0.86,
    'Selective Attention': 0.85,
    'Depth Perception': 0.84,
    'Manual Dexterity': 0.83,
    'Static Strength': 0.8,
  },
  conditions: [{ name: 'paraplegia', affects: ['Stamina', 'Explosive Strength', 'Gross Body Coordination', 'Gross Body Equilibrium', 'Speed of Limb Movement'] }],
};

export const twoPlayers: Script = {
  id: 'two_players',
  title: 'Two Players',
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the question everyone asks
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'Two Players', animation: 'title_card' },
        { text: 'Everybody has wondered it about something. Could I be good at that? Not just okay. Really good.', animation: 'wondering' },
        { text: 'Most people never find out. They guess, from what they look like, from what they were told as a kid, or from one bad afternoon that put them off for life.', animation: 'wondering' },
        { text: 'This is the story of two people who asked the same question about the same thing, and got two very different answers.', animation: 'two_silhouettes' },
      ],
      next: 'andrew',
    },

    // -------------------------------------------------------------------------
    // meet them
    // -------------------------------------------------------------------------
    andrew: {
      steps: [
        { text: 'This is Andrew. He is six foot four, with broad shoulders and arms that fill out a T-shirt. He works in an office, but nobody would guess it.', animation: 'andrew_intro' },
        { text: 'Strangers ask him what sport he plays. Waiters, taxi drivers, a guy in an elevator once. He always laughs and says "none, really."', animation: 'andrew_asked' },
        { speaker: ANDREW, text: "But it does make you think. If everyone looks at me and sees a basketball player, maybe I've been missing something.", animation: 'andrew_thinking' },
      ],
      next: 'daniel',
    },

    daniel: {
      steps: [
        { text: 'This is Daniel. Growing up, he was the kid who could catch anything. Keys tossed across a room, a glass knocked off a table, every ball his brother Marcus threw at him.', animation: 'daniel_catch' },
        { text: 'The two of them spent every summer evening shooting hoops in the driveway. Daniel always said he would play for real one day.', animation: 'driveway' },
        { text: 'Five years ago, a car accident injured his spine. He uses a wheelchair now, and he will for the rest of his life.', animation: 'daniel_chair' },
        { speaker: DANIEL, text: 'After the accident, I stopped asking what I could be good at. It felt like the answer was going to be nothing.', animation: 'daniel_window' },
        { text: 'But when Marcus put the old hoop back up over the garage last spring, Daniel caught himself wondering again.', animation: 'driveway_hoop' },
      ],
      next: 'guess',
    },

    // -------------------------------------------------------------------------
    // the player's guess
    // -------------------------------------------------------------------------
    guess: {
      steps: [
        { text: 'Both of them want to know the same thing: could I be a great basketball player?', animation: 'both_hoop' },
        {
          id: 'guess',
          prompt: 'Going on what you know so far, who has the better shot?',
          animation: 'both_hoop',
          choices: [
            { label: 'Andrew. He has the build for it.', next: 'guess_andrew' },
            { label: 'Daniel. Those quick hands count for a lot.', next: 'guess_daniel' },
            { label: "I can't tell from this.", next: 'guess_unsure' },
          ],
        },
      ],
    },

    guess_andrew: {
      steps: [{ text: "That's what most people say, and what most people say to Andrew. Let's see if they're right.", animation: 'andrew_intro' }],
      next: 'a_skill',
    },

    guess_daniel: {
      steps: [{ text: "Quick hands do count for a lot. But they're not the whole story, for either of them. Let's see.", animation: 'daniel_catch' }],
      next: 'a_skill',
    },

    guess_unsure: {
      steps: [{ text: "Neither can anyone else, honestly. A body tells you surprisingly little from the outside. Let's look closer.", animation: 'two_silhouettes' }],
      next: 'a_skill',
    },

    // -------------------------------------------------------------------------
    // interlude: what a skill is, in the Atlas
    // -------------------------------------------------------------------------
    a_skill: {
      interlude: 'What a skill takes',
      steps: [
        { text: "Let's step out of the story for a moment. This is the Atlas's skill graph. Every dot is a skill people can learn, thousands of them, from baking to welding, grouped into families of skills like them.", stage: { kind: 'graph', skills: [] } },
        { text: "Here's Basketball up close, showing only what it takes from the body. Every hexagon is a physical ability, from Stamina to Depth Perception.", stage: { kind: 'graph', skills: [BASKETBALL], expand: true, show: ['able'] } },
        { text: 'It also shows the personality Basketball takes, from self-discipline to working well with a team.', stage: { kind: 'graph', skills: [BASKETBALL], expand: true, show: ['able', 'takes'] } },
        { text: 'The knowledge it needs, from the rules of the game to its strategy and tactics.', stage: { kind: 'graph', skills: [BASKETBALL], expand: true, show: ['able', 'takes', 'knows'] } },
        { text: "And the skills it's built from: dribbling, passing and shooting. Put together, that's everything Basketball takes.", stage: { kind: 'graph', skills: [BASKETBALL], expand: true, show: SKILLS_TOO } },
        { text: 'Open a skill, and it is laid out in five levels, from Novice to Expert. Each level says what someone at it can actually do.', stage: { kind: 'skill', skill: BASKETBALL, rank: 1 } },
        { text: 'And each level says what it takes: which abilities, and how much of each. A Novice needs a typical amount of most things. Nobody is turned away at the door.', stage: { kind: 'skill', skill: BASKETBALL, rank: 1 } },
        { text: 'Climb to Expert, and the bar goes up. Stamina to keep running for forty minutes. Explosive Strength to jump for a rebound. Gross Body Coordination to move your whole body as one, and Multilimb Coordination to dribble while you run.', stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, abilities: ['Stamina', 'Explosive Strength', 'Gross Body Coordination', 'Multilimb Coordination'] } },
        { text: 'Reaction Time, for a pass you never saw coming. Depth Perception, to judge a shot from twenty feet. Every ability comes with how much it matters, and why.', stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, abilities: ['Reaction Time', 'Depth Perception'] } },
        { text: "So the real question isn't whether you look like a basketball player. It's how you measure up on each of these. And that you can find out.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT } },
      ],
      next: 'andrew_tests',
    },

    // -------------------------------------------------------------------------
    // Andrew finds out
    // -------------------------------------------------------------------------
    andrew_tests: {
      steps: [
        { text: 'Back to Andrew. He starts with the easy part: a tape measure, a scale and a few strength tests. Six foot four, and his strength scores 86 out of 100. So far, so athlete.', animation: 'andrew_measure' },
        { text: 'Then the step test: three minutes stepping up and down a single step, then count your pulse. Andrew is red in the face after one.', animation: 'andrew_step' },
        { speaker: ANDREW, text: 'Is it supposed to be this hard?', animation: 'andrew_step' },
        { text: 'His stamina scores 24 out of 100. Then the coordination games, played right on his screen: keep two hands doing two different things at once. He fumbles, and scores 33.', animation: 'andrew_games' },
      ],
      next: 'a_match',
    },

    // -------------------------------------------------------------------------
    // interlude: how you match a skill
    // -------------------------------------------------------------------------
    a_match: {
      interlude: 'How you measure up',
      steps: [
        { text: "Here's what Andrew sees when he opens Basketball now. Every ability it takes, with where he stands on it set right beside it.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: andrew } },
        { text: 'Explosive Strength and Dynamic Strength: well clear of the bar. The build everyone kept pointing at is real.', stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: andrew, abilities: ['Explosive Strength', 'Dynamic Strength'] } },
        { text: 'Stamina, Gross Body Coordination and Multilimb Coordination: short, and by a long way. Those are the gaps between him and the top level.', stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: andrew, abilities: ['Stamina', 'Gross Body Coordination', 'Multilimb Coordination'] } },
        { text: "But look one level at a time. At Competent, the bar sits lower, and Andrew is already most of the way there. A good pickup player is well within reach today.", stage: { kind: 'skill', skill: BASKETBALL, rank: COMPETENT, person: andrew } },
        { text: "This works for every skill in the Atlas, not just Basketball. Once your abilities are in, every skill you open shows you exactly this: where you're ahead, and where you're short.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: andrew } },
      ],
      next: 'andrew_plan',
    },

    // -------------------------------------------------------------------------
    // Andrew's plan
    // -------------------------------------------------------------------------
    andrew_plan: {
      steps: [
        { speaker: ANDREW, text: 'So all those people asking what sport I play were wrong.', animation: 'andrew_match' },
        { text: "Not wrong, exactly. Just half right. And here's the part a mirror could never tell him: his gaps are the kind you can close.", animation: 'andrew_match' },
        { text: "Height can't be trained, and he already has it. Stamina is one of the most trainable abilities there is. Coordination comes with drills, a little every day.", animation: 'andrew_plan' },
        { text: 'So Andrew makes a plan, aimed right at what is holding him back: three runs a week, and twenty minutes of footwork and dribbling every night at the park down the street.', animation: 'andrew_training' },
        { text: 'Three months later, he takes the step test again, and the coordination games. He finishes the step test this time.', animation: 'andrew_retest' },
        { text: 'His stamina has climbed from 24 to 56, and his coordination from the 30s to nearly 50. The gaps on Basketball are narrower, and he can watch them shrink.', stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: andrewLater, abilities: ['Stamina', 'Gross Body Coordination', 'Multilimb Coordination'] } },
        { speaker: ANDREW, text: "I'm not there yet. But for the first time, I know exactly what 'there' looks like, and how far I have to go.", animation: 'andrew_court' },
      ],
      next: 'daniel_tests',
    },

    // -------------------------------------------------------------------------
    // Daniel finds out
    // -------------------------------------------------------------------------
    daniel_tests: {
      steps: [
        { text: 'Daniel starts somewhere different. First, he notes what he lives with: paraplegia, from his accident, and how much it affects him.', animation: 'daniel_note' },
        { text: 'Then he plays the coordination games, right on his screen. Steady hands. Nimble fingers. Reactions.', animation: 'daniel_games' },
        { text: "His results come back, and they're not ordinary. Finger Dexterity: 94 out of 100. Arm-Hand Steadiness: 91. Wrist-Finger Speed: 93. Reaction Time: 86.", animation: 'daniel_results' },
        { text: 'The kid who caught every ball never went anywhere. None of that runs through his legs.', animation: 'daniel_catch' },
        { text: "Then he opens Basketball, and Atlas is straight with him. Basketball as most people play it leans on running, jumping and legs, and paraplegia reaches all of those. He will very likely never play it at a high level.", animation: 'daniel_basketball_reach' },
        { speaker: DANIEL, text: 'Yeah. I knew that one. I think I just needed someone to say it plainly.', animation: 'daniel_window' },
      ],
      next: 'living_with',
    },

    // -------------------------------------------------------------------------
    // interlude: what you live with
    // -------------------------------------------------------------------------
    living_with: {
      interlude: 'What you live with',
      steps: [
        { text: "Here's Basketball as Daniel sees it. Next to Stamina, Explosive Strength and Gross Body Coordination there's a note: his paraplegia can affect each of them.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: daniel, abilities: ['Stamina', 'Explosive Strength', 'Gross Body Coordination'] } },
        { text: "The Atlas knows which abilities a condition can reach, so you only note it once. From then on, every skill you open flags it wherever it matters, so nothing catches you out.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: daniel } },
        { text: "It works for the everyday things too: glasses, a bad knee, asthma, ADHD. Lots of people do brilliantly at things their body makes harder. It helps to know going in.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: daniel } },
        { text: "And it does something else. Notice what the note doesn't touch: Reaction Time and Depth Perception, and Daniel already scores more than Basketball takes on both.", stage: { kind: 'skill', skill: BASKETBALL, rank: EXPERT, person: daniel, abilities: ['Reaction Time', 'Depth Perception'] } },
      ],
      next: 'other_way',
    },

    // -------------------------------------------------------------------------
    // interlude: looking the other way
    // -------------------------------------------------------------------------
    other_way: {
      interlude: 'What you are made for',
      steps: [
        { text: "So far we've gone from a skill to a person: here's Basketball, how do I measure up? The Atlas works the other way too. Start from the person, and ask which skills fit them.", stage: { kind: 'fit', person: daniel, skills: [BASKETBALL, 'Piano', 'Archery'], rank: PROFICIENT } },
        { text: "For Daniel, that means skills that lean hard on what he's strongest at, and ask little of what his paraplegia reaches.", stage: { kind: 'fit', person: daniel, skills: [BASKETBALL, 'Piano', 'Archery'], rank: PROFICIENT, focus: ['Piano', 'Archery'] } },
        { text: 'Piano. Ten fingers working fast and independently, steady hands, and a long memory for patterns. At Expert, it asks for exactly what Daniel has.', stage: { kind: 'skill', skill: 'Piano', rank: EXPERT, person: daniel, abilities: ['Finger Dexterity', 'Wrist-Finger Speed', 'Memorization'] } },
        { text: 'Archery. An arm held dead still at full draw, a sharp eye for distance, and a calm release. Archers in wheelchairs compete all the way up to the Paralympics.', stage: { kind: 'skill', skill: 'Archery', rank: EXPERT, person: daniel, abilities: ['Arm-Hand Steadiness', 'Far Vision', 'Control Precision'] } },
        { text: 'Here are Piano and Archery on the skill graph, showing only what they take from the body. Every hexagon is a physical ability, and some of them, like Arm-Hand Steadiness, both skills share.', stage: { kind: 'graph', skills: ['Piano', 'Archery'], expand: true, show: ['able'] } },
        { text: 'The Atlas also shows the personality each one takes, from self-discipline to staying calm under pressure.', stage: { kind: 'graph', skills: ['Piano', 'Archery'], expand: true, show: ['able', 'takes'] } },
        { text: 'The knowledge each one needs, like harmony and music history for Piano.', stage: { kind: 'graph', skills: ['Piano', 'Archery'], expand: true, show: ['able', 'takes', 'knows'] } },
        { text: 'And the other skills each one builds on, like reading music. Put together, that is everything it takes.', stage: { kind: 'graph', skills: ['Piano', 'Archery'], expand: true, show: SKILLS_TOO } },
        { text: 'And behind those two, others that lean on the same quick fingers and steady hands, from guitar to clock repair, that he had never once thought to look at.', stage: { kind: 'graph', skills: ['Piano', 'Archery', 'Guitar Playing', 'Clock Repair'], expand: true, show: ['able'] } },
      ],
      next: 'daniel_after',
    },

    // -------------------------------------------------------------------------
    // Daniel, six months on
    // -------------------------------------------------------------------------
    daniel_after: {
      steps: [
        { speaker: DANIEL, text: "Hang on. I'm good at this? I'm actually good at this?", animation: 'daniel_lit' },
        { text: "Six months later, Daniel plays a piece for Marcus on a secondhand keyboard. It's slow, and he misses a note near the end. Neither of them cares.", animation: 'daniel_piano' },
        { speaker: MARCUS, text: 'Since when can you do that?', animation: 'daniel_piano' },
        { speaker: DANIEL, text: "Since always, apparently. I just didn't know.", animation: 'daniel_piano' },
        { text: 'On Saturdays he is at the archery range, and he is already the one the newcomers ask for tips.', animation: 'daniel_range' },
        { text: 'The hoop is still up over the garage. Some evenings they still shoot at it, just for fun.', animation: 'driveway_hoop' },
      ],
      next: 'the_point',
    },

    // -------------------------------------------------------------------------
    // what the player takes from it
    // -------------------------------------------------------------------------
    the_point: {
      steps: [
        { text: 'Andrew looked like an athlete. Daniel looked like someone who had been ruled out. Neither of them could have known the truth from the mirror.', animation: 'two_silhouettes' },
        { text: 'Andrew found out his gaps could be closed, and exactly where to put his work. Daniel found out he had gifts he had stopped looking for, and the skills that were waiting for them.', animation: 'two_lit' },
        { text: "Neither of them needed anything special to find out. Just a few minutes of tests, and an Atlas that knows what every skill takes.", animation: 'two_lit' },
      ],
      next: 'your_turn',
    },

    your_turn: {
      steps: [
        { text: "Now it's your turn. Most of what Andrew and Daniel did takes a few minutes: a tape measure, a stopwatch, some quick games right here on your screen.", animation: 'your_turn' },
        { text: "Every bit you add sharpens the picture. The more the Atlas knows, the better it can point you at the things you'd be great at.", animation: 'your_turn' },
        {
          id: 'start',
          prompt: 'Where do you want to start?',
          animation: 'your_turn',
          choices: [
            { label: 'Size and vitals: a tape measure, a scale and your pulse.', chapter: 'size-and-vitals' },
            { label: 'Body: strength, stamina, flexibility and balance.', chapter: 'body' },
            { label: 'Coordination: the games Daniel aced.', chapter: 'coordination' },
            { label: 'Senses: your eyes and ears.', chapter: 'senses' },
            { label: 'Mind: puzzles for reasoning, memory and ideas.', chapter: 'mind' },
            { label: 'What I live with: anything that holds me back.', chapter: 'living-with' },
          ],
        },
      ],
    },
  },
};
