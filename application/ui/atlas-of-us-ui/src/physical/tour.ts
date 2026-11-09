import type { Ability, Conditions, Impairments, Measurement, Measurements } from './api';
import type { LayerId } from './anatomy_layers';

//what the 3D body shows on a scene: the layers, and the parts lit up and flown to, by FMA id or by id, or every part
//the abilities in a category rest on
export interface Shot {
  layers: LayerId[];
  parts?: string[];
  ids?: string[];
  category?: Ability['category'];
  spin?: boolean;
}

//the one thing the user can do on a scene, under what Atlas says
export type Panel =
  | { kind: 'compare' }
  | { kind: 'measurement'; id: string }
  | { kind: 'rating'; id: string }
  | { kind: 'results'; category?: Ability['category'] }
  | { kind: 'noting'; show: 'impairments' | 'conditions' }
  | { kind: 'explore' };

export interface Scene {
  id: string; //kept in the url, so a reload comes back to it
  text: string; //what Atlas says
  shot: Shot;
  panel?: Panel;
}

//what the scenes and the progress through them are worked out from
export interface Known {
  abilities: Ability[];
  measurements: Measurements;
  impairments: Impairments;
  conditions: Conditions;
}

export interface Chapter {
  id: string;
  title: string;
  blurb: string; //what it's about, on the chapters page
  scenes: (known: Known) => Scene[];
  progress?: (known: Known) => string; //how far through it the user is, such as "3 of 9 measured"
}

const WHOLE: LayerId[] = ['skeleton', 'organs'];
//what's under the skin, for what someone lives with
const INSIDE: LayerId[] = ['skeleton', 'organs', 'nervous'];

//how many of the abilities have a place, as a chapter's progress
const placed = (abilities: Ability[]) => `A place on ${abilities.filter((a) => a.value !== null).length} of ${abilities.length}`;

//names run together as people say them: "a, b and c"
const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

//a scene for one measurement: Atlas says what it is and what it shows, and the body lights up what it reads and the
//parts of the abilities it shows rest on
function measuring(m: Measurement, shows: Ability[], layers: LayerId[]): Scene {
  const abilities = shows.length ? ` It shows your ${listed(shows.map((a) => a.name.toLowerCase()))}.` : '';
  return {
    id: m.id,
    text: `${m.name}. ${m.description}${abilities}`,
    shot: { layers, ids: [...m.parts, ...shows.flatMap((a) => a.parts)] },
    panel: { kind: 'measurement', id: m.id },
  };
}

//a chapter on the abilities in a category: a few scenes on what they are and why they're worth finding out, a scene for
//each measurement that shows one, a scene to rate themselves on each one no measurement shows, and where that leaves them
function abilities(id: string, title: string, category: Ability['category'], layers: LayerId[], intro: string[], blurb: string): Chapter {
  return {
    id,
    title,
    blurb,
    scenes: ({ abilities, measurements }) => {
      const group = abilities.filter((a) => a.category === category);
      const tested = [...new Set(group.flatMap((a) => a.measurements.map((m) => m.id)))].flatMap((m) => measurements.measurements.find((x) => x.id === m) ?? []);
      const untested = group.filter((a) => !a.measurements.length);
      return [
        ...intro.map((text, i): Scene => ({ id: `intro-${i + 1}`, text, shot: { layers, category } })),
        ...tested.map((m) => measuring(m, group.filter((a) => a.measurements.some((s) => s.id === m.id)), layers)),
        ...untested.map(
          (a): Scene => ({
            id: a.id,
            text: `${a.name}: ${a.description.charAt(0).toLowerCase()}${a.description.slice(1)} There's no test for it yet, so tell me the hardest of these you could do.`,
            shot: { layers, ids: a.parts },
            panel: { kind: 'rating', id: a.id },
          }),
        ),
        {
          id: 'where-you-stand',
          text: `Here's where that leaves you. Redder parts hold up abilities where you're ahead of most people, bluer ones where you're behind. Pick one to see where it lives.`,
          shot: { layers },
          panel: { kind: 'results', category },
        },
      ];
    },
    progress: ({ abilities }) => placed(abilities.filter((a) => a.category === category)),
  };
}

//the body size and vitals measurements, which are about the body rather than an ability, in the order they're asked
//about, by name; any others come after
const BASICS = ['Body', 'Vitals'];
const BASICS_ORDER = ['Height', 'Weight', 'Body Mass Index', 'Body Fat', 'Waist Circumference', 'Hip Circumference', 'Upper Arm Length', 'Upper Leg Length', 'Resting Heart Rate', 'Systolic Blood Pressure', 'Diastolic Blood Pressure'];
const basics = (measurements: Measurements) => {
  const rank = (m: Measurement) => (BASICS_ORDER.includes(m.name) ? BASICS_ORDER.indexOf(m.name) : BASICS_ORDER.length);
  return measurements.measurements.filter((m) => BASICS.includes(m.group)).sort((a, b) => rank(a) - rank(b));
};

//the walk through the user's body, in chapters they can take in any order: how its systems make them who they are,
//their size and vitals, where they stand on what it lets them do, all of that drawn on the body, what they live with,
//and the body to explore
export const CHAPTERS: Chapter[] = [
  {
    id: 'your-body',
    title: 'Your body',
    blurb: 'Meet your body, system by system, and how each part of it shapes who you are.',
    scenes: () => [
      {
        id: 'welcome',
        text: "This is you, or near enough. Your body is more than what carries you around: it shapes what comes easily to you, what takes work, which paths suit you, and even how you come across. Let's take a walk around it.",
        shot: { layers: ['skin', 'skeleton', 'organs'], spin: true },
      },
      {
        id: 'nervous',
        text: 'Start at the top. Your brain and nerves are where thinking, remembering and feeling happen. How quickly you react, how much you can hold in mind, how calm or jumpy you feel: a lot of who you are runs through here.',
        shot: { layers: ['skeleton', 'nervous'], parts: ['FMA7157'] },
      },
      {
        id: 'senses',
        text: 'Your eyes and ears are how the world gets in. Sharp eyes catch small details, good hearing picks up what others miss, and both shape the work and play that suit you.',
        shot: { layers: WHOLE, parts: ['FMA54448', 'FMA52780'] },
      },
      {
        id: 'movement',
        text: 'Bones, joints and muscles are how you act on the world. Strength, balance, flexibility and steady hands decide which sports, crafts and jobs feel natural and which take practice.',
        shot: { layers: ['skeleton', 'muscles'], parts: ['FMA7482', 'FMA5022'] },
      },
      {
        id: 'heart',
        text: 'Your heart and lungs keep everything fuelled. They set your stamina: how long you can keep going, how quickly you bounce back, and how much energy you bring to a long day.',
        shot: { layers: ['skeleton', 'vessels', 'organs'], parts: ['FMA7161', 'FMA7158'] },
      },
      {
        id: 'fuel',
        text: 'Your gut turns food into energy, and your glands send out hormones that steer growth, sleep, hunger and mood. When they are off, everything else can feel harder.',
        shot: { layers: WHOLE, parts: ['FMA7152', 'FMA9668'] },
      },
      {
        id: 'protection',
        text: 'Your skin and immune system keep you whole. They guard you against the outside world, heal what gets hurt, and decide how often you are laid up.',
        shot: { layers: ['skin', 'skeleton', 'organs'], parts: ['FMA7163', 'FMA7196', 'FMA9607', 'FMA5034'] },
      },
      {
        id: 'onward',
        text: "All of that adds up to what you have to work with. In the next chapters we'll find out where you stand, one thing at a time, and every skill you look at will show you how you measure up to what it takes. Every bit you add makes that picture sharper.",
        shot: { layers: WHOLE },
      },
    ],
  },
  {
    id: 'size-and-vitals',
    title: 'Size and vitals',
    blurb: 'Your size, your heart and your blood pressure, set against people your age.',
    scenes: ({ measurements }) => [
      {
        id: 'intro',
        text: "Let's start with the simple things: your size and your vitals. Most take a tape measure, a scale or a minute with your pulse, and you might already know some of them.",
        shot: { layers: WHOLE },
      },
      {
        id: 'why',
        text: "They're quick, but they tell a real story: about your health, your stamina, and the build you bring to sports and physical work. I'll show you where each one sits among people your age, and only you will ever see them.",
        shot: { layers: ['skeleton', 'vessels', 'organs'], parts: ['FMA7161'] },
      },
      {
        id: 'compare',
        text: 'Bodies differ a lot between men and women, so first: who should I compare you with?',
        shot: { layers: WHOLE },
        panel: { kind: 'compare' },
      },
      ...basics(measurements).map((m) => measuring(m, [], ['skin', 'skeleton', 'organs', 'vessels'])),
    ],
    progress: ({ measurements }) => {
      const all = basics(measurements);
      return `${all.filter((m) => m.readings.length).length} of ${all.length} measured`;
    },
  },
  abilities(
    'body',
    'Body',
    'Physical',
    ['skeleton', 'muscles'],
    [
      'Abilities are the raw materials you bring to everything you learn. Two people can practise the same thing for the same hours and get very different results, and a lot of that comes down to what they started with.',
      'Your body gives you strength, stamina, flexibility and balance: what your muscles, joints and lungs can do, and the parts of your brain that keep you steady on your feet.',
      "Here's why it's worth a few minutes. Every skill in the Atlas says which abilities it takes, so once I know where you stand, you'll see which skills play to your strengths, and I can be straight with you about the ones that will take more work.",
      "Some of these you can measure at home with a stopwatch and a bit of floor space, and the rest you rate yourself. Skip anything you'd rather not, and come back whenever you like.",
    ],
    'Strength, stamina, flexibility and balance: what your body can do.',
  ),
  abilities(
    'coordination',
    'Coordination and speed',
    'Psychomotor',
    ['skeleton', 'nervous'],
    [
      'Coordination and speed are about how well your brain and body work together: quick reactions, steady hands, nimble fingers, and keeping several limbs in time.',
      "They're what separate a surgeon from a juggler, a drummer from a gamer. Some people are born quick and others build it, but almost everyone has one or two of these that stand out.",
      "Most of them have a quick game you can play right here, a minute or two each. Your scores are set against other people's, so you'll see exactly where your hands and reflexes shine.",
    ],
    'Quick games for your reactions, steady hands and nimble fingers.',
  ),
  abilities(
    'senses',
    'Senses',
    'Sensory',
    ['skeleton', 'organs', 'nervous'],
    [
      'Your senses are abilities too: seeing near and far, in the dark, in colour, out of the corner of your eye, and picking out a voice in a noisy room.',
      "They decide more than you'd think. A pilot needs sharp distance vision, a designer needs a fine eye for colour, and a sound engineer needs ears that catch what everyone else misses.",
      "Several of these you can test on your screen right now. Once they're in, skills will show you where your senses give you an edge, and where a workaround might help.",
    ],
    'Test your eyes and ears: near and far, in the dark and in a crowd.',
  ),
  abilities(
    'mind',
    'Mind',
    'Cognitive',
    ['skeleton', 'nervous'],
    [
      'Last come the abilities of the mind: reasoning, remembering, spotting patterns, picturing shapes in space and coming up with ideas.',
      "They all live in your brain, but in different parts of it, and nobody is strong at all of them. Someone who dreads numbers might picture shapes better than anyone they know.",
      'The tests here are puzzles and quick games, and plenty of people find them fun. Every one you take sharpens the picture of how you think, and which kinds of learning will come most naturally to you.',
    ],
    'Puzzles and games for reasoning, memory, patterns and ideas.',
  ),
  {
    id: 'results',
    title: 'Your results',
    blurb: 'Every ability you have found out about, drawn on your body in colour.',
    scenes: () => [
      {
        id: 'intro',
        text: "This is where it all comes together. Everything you've measured, tested and rated, mapped onto your own body, so you can see at a glance what you have to work with.",
        shot: { layers: ['skeleton', 'muscles', 'nervous', 'organs'], spin: true },
      },
      {
        id: 'results',
        text: "Here's everything you've found out, drawn on you. Redder parts hold up abilities where you're ahead of most people, bluer ones where you're behind. Pick an ability to see where it lives.",
        shot: { layers: ['skeleton', 'muscles', 'nervous', 'organs'] },
        panel: { kind: 'results' },
      },
    ],
    progress: ({ abilities }) => placed(abilities),
  },
  {
    id: 'living-with',
    title: 'What you live with',
    blurb: 'What you live with, where it sits in your body, and what it can reach.',
    scenes: () => [
      {
        id: 'intro',
        text: "Lots of people live with something: glasses, a bad knee, asthma, ADHD. It's part of you, and there's nothing to hide here.",
        shot: { layers: INSIDE },
      },
      {
        id: 'why',
        text: "Telling me lets me be honest with you. When a skill takes an ability that something you live with can affect, I'll say so, so you can plan for it rather than be caught out. Plenty of people do brilliantly at things their body makes harder, and it helps to know going in.",
        shot: { layers: INSIDE },
      },
      {
        id: 'private',
        text: "Only you can see what you note here, and you can change or remove it any time. As you add each one, I'll show you where it sits in your body and what it can reach.",
        shot: { layers: INSIDE },
      },
      {
        id: 'impairments',
        text: "First, impairments. If part of your body or mind doesn't work as well as it might, from needing glasses to a bad knee, note it and how much it holds you back.",
        shot: { layers: INSIDE },
        panel: { kind: 'noting', show: 'impairments' },
      },
      {
        id: 'conditions',
        text: 'Now conditions: anything you have been diagnosed with or know you have, from asthma to being double-jointed, and how much it affects you.',
        shot: { layers: INSIDE },
        panel: { kind: 'noting', show: 'conditions' },
      },
    ],
    progress: ({ impairments, conditions }) => {
      const noted = impairments.impairments.length + conditions.mine.length;
      return noted ? `${noted} noted` : 'Nothing noted';
    },
  },
  {
    id: 'explore',
    title: 'Explore',
    blurb: 'Turn your body, click any part, and learn what it does and what relies on it.',
    scenes: () => [
      {
        id: 'explore',
        text: 'Your body is yours to explore: turn it, click any part, and I will tell you all about it.',
        shot: { layers: WHOLE },
        panel: { kind: 'explore' },
      },
    ],
  },
];
