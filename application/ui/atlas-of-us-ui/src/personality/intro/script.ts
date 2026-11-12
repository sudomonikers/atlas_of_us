import type { Choice as StoryChoice, Script as StoryScript } from '../../shared_components/story/script';
import type { LinkType } from '../../shared_components/story/atlas';
import type { Report } from '../api';

// Same Answer: the story that opens the personality module. Sam and Priya work side by side at a bakery, and both want
// to know whether they could run a place of their own. Years ago an online quiz called Sam a born leader and Priya a
// supporter, and both of them believed it. Sam looks the part: loud, quick, full of ideas. But the Atlas finds he's short
// on the steady, careful side a business runs on, and shows him exactly where. Priya looks like someone who'd never
// want to be in charge. But the Atlas finds she has nearly everything running a business takes, and is short only on
// speaking up and taking a leap, which she can practise. The point for the player: a quiz that asks you to rate statements can't tell two
// people apart when they tick the same box, and a story that asks them why can.
// Between the story's parts, interludes step out of it to show how the Atlas works: a real scene being played, the
// traits it reads, the evidence behind a trait and contesting it, the report, and the Small Business Management skill
// with the traits each level takes, set against Sam and Priya.
// It ends by asking where the player wants to start.
// Traits named here are the IPIP-NEO's 30 facets as the Atlas has them (poles.ts). Scenes, choices and prompts quoted
// here are the real ones from their scripts.

//one answer behind a trait, as "Why?" shows it. answer is what they picked, or what they wrote when there was nothing
//to pick, and why is what they wrote about their pick. level is where it puts them, 0 to 1, and weight how strongly
//it shows it
export interface Evidence {
  scene: string;
  question: string;
  answer: string;
  why?: string;
  shows: string;
  level: number;
  weight: number;
  contest?: { kind: 'explain' | 'wrong'; message: string; reply: string; accepted: boolean };
}

//a made-up person, as My Personality would know them: where they stand on each trait, 0 to 1, the answers behind
//some of them, the conditions they've noted in Physical Traits with the traits each can affect (through the ICF
//functions the seeds link them to), and their report
export interface Person {
  name: string;
  traits: Record<string, number>;
  early?: boolean; //every trait is an early read, from only a scene or two
  evidence?: Record<string, Evidence[]>;
  conditions?: { name: string; affects: string[] }[];
  report?: Report;
}

//the real Atlas, shown in place of the drawing during an interlude
export type Stage =
  | { kind: 'scenes'; picked?: string[] } //every scene as the dashboard lists them, with the ones picked out by id
  | { kind: 'scene'; scene: string; animation: string; prompt: string; choices: string[]; choice?: number; answer?: string } //a moment from a real scene, drawn as the scene draws it: its prompt, with a choice made and a why typed when given
  | { kind: 'traits'; person: Person; picked?: string[]; compare?: boolean } //My Personality for person, with traits picked out, and everyone's average when compare is set
  | { kind: 'why'; person: Person; trait: string } //"Why?" open on one of person's traits, with the answers behind it
  | { kind: 'report'; person: Person; part?: 'headline' | 'domains' | 'lists' } //person's written report, scrolled to part
  | { kind: 'explore' } //Explore, on what the Big Five is
  | { kind: 'graph'; skills: string[]; expand?: boolean; show?: LinkType[] } //the skills on the skill graph, as in the physical intro
  | { kind: 'skill'; skill: string; rank: number; person?: Person; traits?: string[] } //a skill's levels open at rank (1 Novice to 5 Expert), with the traits it takes, set against person when given, and traits picked out
  | { kind: 'fit'; person: Person; skills: string[]; rank: number; focus?: string[] }; //person's strengths and gaps against each skill at rank, through their traits, with the skills in focus picked out

//a choice that ends the story opens a scene, or one of the dashboard's views
export interface Choice extends StoryChoice {
  scene?: string;
  view?: 'scenarios' | 'explore';
}

export type Script = StoryScript<Stage, Choice>;

const SAM = 'Sam';
const PRIYA = 'Priya';
const ROSA = 'Rosa'; //who owns the bakery

const BUSINESS = 'Small Business Management';
const SELLING = 'Selling Products';
const ACCOUNTS = 'Accounting Records';
const EXPERT = 5;
const PROFICIENT = 4;
const BEGINNER = 2;

const SHOPLIFTER = 'the_shoplifter';
const SHOPLIFTER_PROMPT = 'What do you do? Pick one, and tell me why. Do you believe him?';
const SHOPLIFTER_CHOICES = [
  'Call the police, like the sign says. Whatever his story, rules are rules.',
  "Call Frank, and let him decide. It's his store.",
  'Keep the things, and let him go with a warning.',
  "Let him take the Tylenol. I'll pay for it myself.",
  'Something else.',
];
const WARN = 2; //the choice both of them make
const shoplifter = { kind: 'scene', scene: SHOPLIFTER, animation: 'plea', prompt: SHOPLIFTER_PROMPT, choices: SHOPLIFTER_CHOICES } as const;

//what each of them wrote about the same choice in The Shoplifter
const SAM_WHY = "Honestly calling the cops on a kid over a box of Tylenol is insane. The sign's there to cover Frank. I'd tell him to scram and not come back, and I wouldn't even mention it to Frank.";
const PRIYA_WHY = "I believe him, mostly. He looked scared, not sneaky. I'd keep the things, give him the number for the free clinic on Hale Street, and tell Frank exactly what happened on Monday. If Frank wants to call the police after that, it's his store.";

//Sam's answers behind Immoderation, with the contest he lost
const samImmoderation: Evidence[] = [
  {
    scene: 'The Night Market',
    question: "What is it? Describe it for me: the thing you've never been able to walk past. Then pick what you do, and tell me why.",
    answer: "Buy it. I'll worry about the rest of the night later.",
    why: "A brass compass that doesn't point north, it points at whatever you want most. All ten coins, who cares about the coach.",
    shows: 'Spends every coin on the first thing he wants, with the whole night and the fare home still ahead of him.',
    level: 0.85,
    weight: 0.4,
    contest: {
      kind: 'wrong',
      message: "It's a fairy tale. I'd never do that with real money.",
      reply: "Fair point that it's a story. But at the end of the same scene you told me you spent your whole bonus the weekend it landed, so it holds outside the story too. This one stays as it is.",
      accepted: false,
    },
  },
  {
    scene: 'The Night Market',
    question: "Think of the last time you gave in to something you'd meant to resist: a snack, a show, a purchase, one more of anything. What was it, how hard did you try, and how did you feel about it afterward?",
    answer: "Bonus came in on a Friday, and by Sunday I'd bought a new amp and taken everyone out. Didn't really try. Zero regrets. Some regrets.",
    shows: 'Spent a windfall within days, on impulse, without trying to hold back, and half regrets it.',
    level: 0.8,
    weight: 0.7,
  },
];

//Sam as the scenes find him: bold, sociable and full of ideas, short on order, discipline and caution
const sam: Person = {
  name: SAM,
  traits: {
    Imagination: 0.84,
    'Artistic Interests': 0.6,
    Emotionality: 0.55,
    Adventurousness: 0.82,
    Intellect: 0.58,
    Liberalism: 0.76,
    'Self-Efficacy': 0.8,
    Orderliness: 0.22,
    Dutifulness: 0.36,
    'Achievement-Striving': 0.62,
    'Self-Discipline': 0.28,
    Cautiousness: 0.2,
    Friendliness: 0.78,
    Gregariousness: 0.86,
    Assertiveness: 0.88,
    'Activity Level': 0.74,
    'Excitement-Seeking': 0.9,
    Cheerfulness: 0.8,
    Trust: 0.66,
    Morality: 0.48,
    Altruism: 0.62,
    Cooperation: 0.52,
    Modesty: 0.3,
    Sympathy: 0.55,
    Anxiety: 0.3,
    Anger: 0.44,
    Depression: 0.24,
    'Self-Consciousness': 0.18,
    Immoderation: 0.74,
    Vulnerability: 0.35,
  },
  evidence: {
    Immoderation: samImmoderation,
    Dutifulness: [
      {
        scene: 'The Shoplifter',
        question: SHOPLIFTER_PROMPT,
        answer: SHOPLIFTER_CHOICES[WARN],
        why: SAM_WHY,
        shows: "Sets the store's rule aside because he judges it to be wrong, and means to keep it from the owner.",
        level: 0.2,
        weight: 0.6,
      },
    ],
  },
};

//Sam after his first six scenes: a first read, with every trait still early, and some not yet seen at all
const samEarly: Person = {
  name: SAM,
  early: true,
  traits: Object.fromEntries(
    ['Imagination', 'Intellect', 'Liberalism', 'Assertiveness', 'Gregariousness', 'Excitement-Seeking', 'Cheerfulness', 'Friendliness', 'Self-Efficacy', 'Orderliness', 'Self-Discipline', 'Immoderation', 'Cautiousness', 'Anger', 'Modesty', 'Altruism'].map(
      (trait) => [trait, sam.traits[trait] + (trait.length % 3) * 0.04 - 0.04],
    ),
  ),
};

//Priya's report, which describes patterns only, never her answers
const priyaReport: Report = {
  headline: 'The steady hand everyone leans on, and rarely thinks to thank',
  overview:
    "Priya is at her best when something needs to be done properly and nobody else has noticed. She plans ahead, finishes what she starts, and holds herself to a high standard without needing anyone to check on her.\n\nShe keeps a low profile. She'd rather earn trust by being reliable than win people over by talking, and it means she's often underestimated, sometimes by herself.",
  domains: [
    { key: 'openness', text: "Practical more than dreamy. She's curious about how things work and moved by things done well, but she likes a tried method over a leap into the unknown." },
    { key: 'conscientiousness', text: 'Her strongest suit by a distance. Organised, persistent and ambitious, with a strong sense of what she owes the people who rely on her.' },
    { key: 'extraversion', text: "Quiet and self-contained. She's warm one to one, but crowds and the spotlight drain her, and she rarely pushes herself forward." },
    { key: 'agreeableness', text: 'Kind and fair. She notices when someone is struggling and acts on it, and she is straight with people even when it costs her.' },
    { key: 'neuroticism', text: 'Calm under pressure. When something goes wrong she gets on with fixing it, and she bounces back quickly, though she can feel self-conscious when all eyes are on her.' },
  ],
  strengths: ['Stays calm and practical when things go wrong', 'People trust her with what matters, and she follows through', 'Plans ahead and keeps things running without being asked'],
  watch_outs: ['Holds back when a moment needs someone to speak up', "Can take on everyone's load and say nothing about it", "Underrates herself, and may pass up what she'd be good at"],
};

//Priya as the scenes find her: steady, careful and kind, calm under pressure, and quiet
const priya: Person = {
  name: PRIYA,
  traits: {
    Imagination: 0.55,
    'Artistic Interests': 0.62,
    Emotionality: 0.64,
    Adventurousness: 0.32,
    Intellect: 0.76,
    Liberalism: 0.4,
    'Self-Efficacy': 0.78,
    Orderliness: 0.88,
    Dutifulness: 0.82,
    'Achievement-Striving': 0.84,
    'Self-Discipline': 0.86,
    Cautiousness: 0.8,
    Friendliness: 0.52,
    Gregariousness: 0.22,
    Assertiveness: 0.3,
    'Activity Level': 0.66,
    'Excitement-Seeking': 0.2,
    Cheerfulness: 0.56,
    Trust: 0.6,
    Morality: 0.84,
    Altruism: 0.8,
    Cooperation: 0.74,
    Modesty: 0.7,
    Sympathy: 0.82,
    Anxiety: 0.28,
    Anger: 0.2,
    Depression: 0.3,
    'Self-Consciousness': 0.56,
    Immoderation: 0.24,
    Vulnerability: 0.2,
  },
  evidence: {
    Dutifulness: [
      {
        scene: 'The Shoplifter',
        question: SHOPLIFTER_PROMPT,
        answer: SHOPLIFTER_CHOICES[WARN],
        why: PRIYA_WHY,
        shows: "Bends the store's rule out of sympathy for the boy, but tells the owner everything and leaves the final call to him.",
        level: 0.7,
        weight: 0.5,
      },
    ],
  },
  conditions: [{ name: 'social phobia', affects: ['Assertiveness', 'Self-Efficacy', 'Self-Consciousness'] }],
  report: priyaReport,
};

export const sameAnswer: Script = {
  id: 'same_answer',
  title: 'Same Answer',
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the quiz everyone has taken
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'Same Answer', animation: 'title_card' },
        { text: "You've probably taken one of these. Fifty statements, five little circles each, and at the end a label: a Commander, a Mediator, a Golden Retriever.", animation: 'quiz_sheet' },
        {
          id: 'party',
          prompt: '"I love large parties." How much do you agree?',
          animation: 'quiz_party',
          choices: [
            { label: 'Strongly agree.', next: 'party_answered' },
            { label: 'Agree.', next: 'party_answered' },
            { label: 'Neither.', next: 'party_answered' },
            { label: 'Disagree.', next: 'party_answered' },
            { label: 'Strongly disagree.', next: 'party_answered' },
          ],
        },
      ],
    },

    party_answered: {
      steps: [
        { text: "Now, which party were you picturing? A wedding where you know everyone? An office party where you know your boss? A stranger's house at one in the morning?", animation: 'quiz_parties' },
        { text: "Whatever you picked, the quiz got one circle. It didn't hear which party, or why. And that's exactly the part that tells people apart.", animation: 'quiz_circle' },
        { text: 'This is the story of two people who gave the same answers, and turned out to be nothing alike.', animation: 'two_silhouettes' },
      ],
      next: 'sam',
    },

    // -------------------------------------------------------------------------
    // meet them
    // -------------------------------------------------------------------------
    sam: {
      steps: [
        { text: "This is Sam. He works the counter at Rosa's Bakery, and regulars come in just to talk to him. He knows every dog in the neighbourhood by name.", animation: 'sam_counter' },
        { text: 'He has an idea a week. Sourdough pizza on Fridays. A bread subscription. A stall at the night market. Customers love every one of them.', animation: 'sam_ideas' },
        { text: 'Years ago an online quiz told him he was a born leader. Everybody he has ever met agrees.', animation: 'sam_quiz' },
        { speaker: SAM, text: 'People keep telling me I should open my own place. And I keep thinking, yeah. Why not me?', animation: 'sam_thinking' },
      ],
      next: 'priya',
    },

    priya: {
      steps: [
        { text: "This is Priya. She's in at five every morning, before anyone else. The ovens are hot, the orders are checked, and the till balances to the cent.", animation: 'priya_morning' },
        { text: 'When the walk-in fridge died on a Saturday last summer, she moved four hundred dollars of butter to the café next door before anyone else had noticed. Rosa found out on Monday.', animation: 'priya_fridge' },
        { text: 'The same kind of quiz called her a supporter: someone who helps other people lead. She took that to mean she was not one of them.', animation: 'priya_quiz' },
        { speaker: PRIYA, text: "I'd love my own bakery one day. But I'm not a people person, and I hate selling. I'm not who you picture running a place.", animation: 'priya_window' },
      ],
      next: 'rosa',
    },

    rosa: {
      steps: [
        { text: 'Then Rosa tells them both she is retiring next year. She wants to sell the bakery, and she would rather sell it to one of them than to a stranger.', animation: 'rosa_news' },
        { text: 'Both of them want to know the same thing: could I really run a business?', animation: 'both_bakery' },
        {
          id: 'guess',
          prompt: 'Going on what you know so far, who should buy the bakery?',
          animation: 'both_bakery',
          choices: [
            { label: 'Sam. He has the confidence and the ideas.', next: 'guess_sam' },
            { label: 'Priya. Someone has to keep the place running.', next: 'guess_priya' },
            { label: "I can't tell from this.", next: 'guess_unsure' },
          ],
        },
      ],
    },

    guess_sam: {
      steps: [{ text: "That's what the quizzes would say, and what Sam's friends say. Let's see if they're right.", animation: 'sam_counter' }],
      next: 'a_scene',
    },

    guess_priya: {
      steps: [{ text: "Someone does have to. But a business takes more than keeping it running, and Priya knows it. Let's see.", animation: 'priya_morning' }],
      next: 'a_scene',
    },

    guess_unsure: {
      steps: [{ text: "Neither can anyone, from the outside. How someone comes across tells you surprisingly little about how they work. Let's look closer.", animation: 'two_silhouettes' }],
      next: 'a_scene',
    },

    // -------------------------------------------------------------------------
    // interlude: how a scene works
    // -------------------------------------------------------------------------
    a_scene: {
      interlude: 'Situations, not statements',
      steps: [
        { text: "Let's step out of the story for a moment. The Atlas doesn't hand you statements to rate. It puts you in eighteen situations, from a friend's fortieth to a grease fire in your kitchen.", stage: { kind: 'scenes' } },
        { text: 'Each one is a short story you click through, with its own art and its own sounds. Every so often, it stops and asks you what you would do.', stage: { kind: 'scenes', picked: [SHOPLIFTER] } },
        { text: "Here's one. You're working the register at Frank's corner store, alone for the first time. Frank's one rule is taped up by the till: always call the police. And you've just caught a boy in a school uniform with a sandwich and a bottle of children's Tylenol.", stage: shoplifter },
        { text: 'You pick what you would do, and then you say why, in your own words. The why is the part that counts.', stage: { ...shoplifter, choice: WARN } },
        { text: "Every option has a good reason behind it. There's no right answer to find, so the only thing to do is say what you'd really do.", stage: { ...shoplifter, choice: WARN } },
        { text: 'And every scene ends by asking about your own life: when you last broke a rule, and why. A real story from your life says more than any made-up one.', stage: { kind: 'scenes', picked: [SHOPLIFTER] } },
      ],
      next: 'same_choice',
    },

    // -------------------------------------------------------------------------
    // the same choice
    // -------------------------------------------------------------------------
    same_choice: {
      steps: [
        { text: 'Back at the bakery, Sam and Priya both start playing on their breaks. Both of them reach The Shoplifter in the same week.', animation: 'both_phones' },
        { text: 'And both of them make the same choice: keep the things, and let him go with a warning.', animation: 'both_same_choice' },
        { text: 'A quiz would stop there. Same answer, same score. But then they each say why.', animation: 'both_same_choice' },
        { text: "Sam: the sign is only there to cover Frank, calling the police on a kid over Tylenol is insane, and he wouldn't even mention it.", stage: { ...shoplifter, choice: WARN, answer: SAM_WHY } },
        { text: "Priya: the boy looked scared, not sneaky. She'd give him the number of a free clinic, and tell Frank exactly what happened on Monday.", stage: { ...shoplifter, choice: WARN, answer: PRIYA_WHY } },
        { text: 'One of them bent the rule because he thought the rule was wrong. The other bent it because she felt for the boy, and then owned up to it. The same choice, for opposite reasons.', animation: 'both_split' },
      ],
      next: 'what_it_reads',
    },

    // -------------------------------------------------------------------------
    // interlude: what the Atlas reads
    // -------------------------------------------------------------------------
    what_it_reads: {
      interlude: 'What your answers become',
      steps: [
        { text: 'The Atlas reads every answer for thirty traits: the facets of the Big Five, the model of personality psychologists have tested more than any other.', stage: { kind: 'explore' } },
        { text: "Every six scenes, it reads everything you've written so far together, and you get a first look. Here's Sam's, after six.", stage: { kind: 'traits', person: samEarly } },
        { text: 'An early read comes from only a scene or two, and some traits have not come up yet. As he plays on, every scene adds evidence, and the picture fills in and firms up.', stage: { kind: 'traits', person: samEarly } },
        { text: "After all eighteen, every trait has been seen in several different situations. Here's Sam.", stage: { kind: 'traits', person: sam } },
        { text: 'High Assertiveness, Gregariousness and Excitement-Seeking. He takes charge, loves a crowd, and chases the new thing.', stage: { kind: 'traits', person: sam, picked: ['Assertiveness', 'Gregariousness', 'Excitement-Seeking'] } },
        { text: 'And Priya. High Orderliness, Self-Discipline and Achievement-Striving, and low Anxiety. Organised, persistent, ambitious, and calm when things go wrong.', stage: { kind: 'traits', person: priya, picked: ['Orderliness', 'Self-Discipline', 'Achievement-Striving', 'Anxiety'] } },
        { text: "You can set your bars against everyone the Atlas has measured. And neither end of a bar is the good one. A low score just means you're nearer the other end.", stage: { kind: 'traits', person: priya, compare: true } },
      ],
      next: 'why',
    },

    // -------------------------------------------------------------------------
    // interlude: why, and arguing back
    // -------------------------------------------------------------------------
    why: {
      interlude: 'Ask it why',
      steps: [
        { text: 'You never have to take a score on faith. Open any trait and ask why, and you see every answer behind it, and what in it the Atlas read.', stage: { kind: 'why', person: priya, trait: 'Dutifulness' } },
        { text: "Here's Priya's Dutifulness, with her Shoplifter answer behind it. She bent the rule, but told Frank everything, and it raised her score.", stage: { kind: 'why', person: priya, trait: 'Dutifulness' } },
        { text: 'And the very same choice in Sam\'s. He meant to keep it from Frank, and it lowered his.', stage: { kind: 'why', person: sam, trait: 'Dutifulness' } },
        { text: "Now Sam's Immoderation. Behind it is his Night Market answer: he spent all ten coins at the very first stall.", stage: { kind: 'why', person: { ...sam, evidence: { Immoderation: samImmoderation.map((e) => ({ ...e, contest: undefined })) } }, trait: 'Immoderation' } },
        { speaker: SAM, text: "Hang on, that's a fairy tale. I'd never do that with real money.", animation: 'sam_phone_protest' },
        { text: 'So he contests it. Anyone can, on any piece of evidence: explain what you meant, or say it read you wrong. Atlas reads the answers again with your note beside them, and replies.', stage: { kind: 'why', person: sam, trait: 'Immoderation' } },
        { text: "This time, Atlas holds its ground. At the end of that same scene, asked about his real life, he'd said he blew his whole bonus in a weekend.", stage: { kind: 'why', person: sam, trait: 'Immoderation' } },
        { speaker: SAM, text: '...Okay. Fair.', animation: 'sam_phone_sheepish' },
        { text: 'When a note does change what an answer shows, the evidence changes with it, and the trait is worked out again. Either way, you get a reason.', stage: { kind: 'why', person: sam, trait: 'Immoderation' } },
      ],
      next: 'body',
    },

    // -------------------------------------------------------------------------
    // interlude: the body meets personality
    // -------------------------------------------------------------------------
    body: {
      interlude: 'What you live with',
      steps: [
        { text: "One more thing shows on Priya's traits. In Physical Traits, she noted her social phobia. So beside Assertiveness, Self-Efficacy and Self-Consciousness there's a note: it can affect how these show up.", stage: { kind: 'traits', person: priya, picked: ['Assertiveness', 'Self-Efficacy', 'Self-Consciousness'] } },
        { text: "It doesn't change her scores. Those come from what she said and did. It just helps her read them, and it's only ever shown to her.", stage: { kind: 'traits', person: priya, picked: ['Assertiveness', 'Self-Efficacy', 'Self-Consciousness'] } },
      ],
      next: 'the_report',
    },

    // -------------------------------------------------------------------------
    // interlude: the report
    // -------------------------------------------------------------------------
    the_report: {
      interlude: 'Your report',
      steps: [
        { text: 'Finish all eighteen scenes, and Atlas writes you a report: a portrait of you in words, drawn from everything you said.', stage: { kind: 'report', person: priya, part: 'headline' } },
        { text: 'A paragraph on each part of your personality, and how the traits in it play off each other.', stage: { kind: 'report', person: priya, part: 'domains' } },
        { text: "And your strengths, and what to watch for. Priya's says it plainly: she stays calm when things go wrong, people trust her with what matters, and she holds back when a moment needs someone to speak up.", stage: { kind: 'report', person: priya, part: 'lists' } },
        { text: 'It never quotes your answers or retells your stories. It only describes the patterns, so you can show it to people, on a profile you choose to make public.', stage: { kind: 'report', person: priya, part: 'lists' } },
      ],
      next: 'priya_reads',
    },

    priya_reads: {
      steps: [
        { speaker: PRIYA, text: "'Calm when things go wrong.' I always thought I was just too boring to panic.", animation: 'priya_reading' },
        { text: 'She reads it twice on the bus home. Then she thinks of the butter, and laughs out loud.', animation: 'priya_bus' },
      ],
      next: 'a_business',
    },

    // -------------------------------------------------------------------------
    // interlude: what a skill takes
    // -------------------------------------------------------------------------
    a_business: {
      interlude: 'What a skill takes',
      steps: [
        { text: "So, could either of them run the bakery? This is the Atlas's skill graph. Every dot is a skill people can learn, thousands of them, from baking to welding.", stage: { kind: 'graph', skills: [] } },
        { text: "Here's Small Business Management, showing only the personality it takes. Every trait it leans on is linked to it.", stage: { kind: 'graph', skills: [BUSINESS], expand: true, show: ['takes'] } },
        { text: 'Open it, and it is laid out in five levels, from Novice to Expert, each with what someone at it can actually do, and the personality it takes to get there.', stage: { kind: 'skill', skill: BUSINESS, rank: EXPERT } },
        { text: "Here's Sam against it, at Proficient: running a place well. Where it leans on confidence and taking charge, he's over the bar: pitching, selling and believing in it are no trouble at all.", stage: { kind: 'skill', skill: BUSINESS, rank: PROFICIENT, person: sam, traits: ['Assertiveness', 'Self-Efficacy'] } },
        { text: 'Where it leans on order, discipline and caution, he falls short, by a long way. The books, the stock, the boring Tuesday decisions that keep a place alive.', stage: { kind: 'skill', skill: BUSINESS, rank: PROFICIENT, person: sam, traits: ['Orderliness', 'Self-Discipline', 'Cautiousness'] } },
        { text: "And here's Priya. Order, discipline, ambition and a sense of duty: all over the bar, and most by a lot.", stage: { kind: 'skill', skill: BUSINESS, rank: PROFICIENT, person: priya, traits: ['Orderliness', 'Self-Discipline', 'Achievement-Striving', 'Dutifulness'] } },
        { text: "Her gaps are Assertiveness and Adventurousness: walking into a supplier's office to ask for a better price, and taking the leap at all. The very things she assumed ruled her out are the only things short.", stage: { kind: 'skill', skill: BUSINESS, rank: PROFICIENT, person: priya, traits: ['Assertiveness', 'Adventurousness'] } },
        { text: 'Every skill in the Atlas works this way. Once your traits are in, every skill you open shows where your personality helps, and where you will have to work around it.', stage: { kind: 'skill', skill: BUSINESS, rank: PROFICIENT, person: priya } },
      ],
      next: 'deciding',
    },

    // -------------------------------------------------------------------------
    // what they do with it
    // -------------------------------------------------------------------------
    deciding: {
      steps: [
        { speaker: SAM, text: 'So the guy everyone called a born leader is the one who would sink the place.', animation: 'sam_counter_quiet' },
        { text: "Not sink it. Personality changes slowly, but it isn't the whole story. It tells you where something will come easily, and where you'll be fighting yourself.", animation: 'sam_counter_quiet' },
        { text: "Sam's gaps are the kind you plan around: systems, habits, and someone beside you who loves what you hate.", animation: 'sam_plan' },
        { text: "And Priya's gaps are the kind you can practise. She doesn't need to become loud. She needs to be able to ask for what the bakery needs, and mean it. As for the leap, buying the bakery would be it.", animation: 'priya_plan' },
      ],
      next: 'other_way',
    },

    // -------------------------------------------------------------------------
    // interlude: looking the other way
    // -------------------------------------------------------------------------
    other_way: {
      interlude: 'What you are made for',
      steps: [
        { text: "So far we've gone from a skill to a person. The Atlas works the other way too: start from the person, and ask which skills fit them.", stage: { kind: 'fit', person: sam, skills: [BUSINESS, SELLING, ACCOUNTS], rank: BEGINNER } },
        { text: "For Sam, it starts with Selling Products. At the first levels he clears every bar it sets: warmth, confidence, and asking for the sale. Accounting Records, it's honest, is not his.", stage: { kind: 'fit', person: sam, skills: [BUSINESS, SELLING, ACCOUNTS], rank: BEGINNER, focus: [SELLING] } },
        { text: "Higher up, even selling asks for the discipline he's short on. So he knows where the work is before he's in over his head.", stage: { kind: 'fit', person: sam, skills: [SELLING], rank: PROFICIENT } },
        { text: "For Priya, it's the opposite. Accounting Records and Inventory Management, where every line is green but the ones her social phobia can reach.", stage: { kind: 'fit', person: priya, skills: [BUSINESS, ACCOUNTS, 'Inventory Management'], rank: PROFICIENT, focus: [ACCOUNTS, 'Inventory Management'] } },
        { text: 'Where Sam falls short, at the books, Priya is strong almost across the board. Where Priya falls short, at selling, Sam is strongest. Put the two side by side, and something becomes obvious that no quiz would ever have shown them.', stage: { kind: 'fit', person: priya, skills: [SELLING, ACCOUNTS], rank: PROFICIENT } },
      ],
      next: 'after',
    },

    // -------------------------------------------------------------------------
    // a year on
    // -------------------------------------------------------------------------
    after: {
      steps: [
        { text: 'They buy the bakery together.', animation: 'both_keys' },
        { text: 'Priya runs it: the books, the stock, the ovens at five. Sam runs the front: the regulars, the Friday pizza, the stall at the night market, which turns out to be a very good idea.', animation: 'both_bakery_open' },
        { text: "Once a month, Priya calls the flour supplier herself. The first time, she wrote out what she'd say on an index card. Now she doesn't need the card.", animation: 'priya_phone' },
        { speaker: ROSA, text: 'I should have known it would take both of you.', animation: 'rosa_visit' },
        { speaker: SAM, text: 'In my defence, a quiz told me I could do it all myself.', animation: 'rosa_visit' },
      ],
      next: 'the_point',
    },

    // -------------------------------------------------------------------------
    // what the player takes from it
    // -------------------------------------------------------------------------
    the_point: {
      steps: [
        { text: 'Sam and Priya ticked the same boxes and made the same choices. Everyone, Sam and Priya included, had them filed under the wrong labels.', animation: 'two_silhouettes' },
        { text: 'What told them apart was the why. Once something actually listened to it, each of them found out what they had to offer, and what they needed beside them.', animation: 'two_lit' },
        { text: 'Neither of them did anything special. They played a few stories on their breaks, and said what they really thought.', animation: 'two_lit' },
      ],
      next: 'your_turn',
    },

    your_turn: {
      steps: [
        { text: "Now it's your turn. Your first look comes after six scenes. After all eighteen, your report, every skill set against your personality, and a profile you can share if you want to.", animation: 'your_turn' },
        { text: 'Be honest, not impressive. Say why. Be specific. And jokes are fine: how you answer says something too.', animation: 'your_turn' },
        {
          id: 'start',
          prompt: 'Where do you want to start?',
          animation: 'your_turn',
          choices: [
            { label: 'The Story Game: build a world with a narrator. The best place to begin.', scene: 'the_story_game' },
            { label: 'Show me all eighteen scenes.', view: 'scenarios' },
            { label: 'Teach me about the Big Five first.', view: 'explore' },
          ],
        },
      ],
    },
  },
};
