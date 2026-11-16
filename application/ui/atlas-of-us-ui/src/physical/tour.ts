import { handOf, inYourHands, type Ability, type Conditions, type Impairments, type Me, type Measurement, type Measurements } from './api';
import type { LayerId } from './anatomy_layers';
import { type MotionName } from './motion';
import { plain, STRONG, WEAK } from './plain';

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
  | { kind: 'characteristic'; id: string }
  | { kind: 'measurement'; id: string }
  | { kind: 'rating'; id: string }
  | { kind: 'results'; category?: Ability['category'] }
  | { kind: 'noting'; show: 'impairments' | 'conditions' }
  | { kind: 'explore' };

//a scene shows someone doing what it's about, the 3D body where what it's about sits in it, or where the user stands on
//each ability in a category
export interface Scene {
  id: string; //kept in the url, so a reload comes back to it
  title?: string; //what it's about, such as a test's name, shown over what Atlas says
  text: string; //what Atlas says
  stage: { motion: MotionName } | { shot: Shot } | { sheet: Ability['category'] };
  panel?: Panel;
}

//what the scenes and the progress through them are worked out from
export interface Known {
  abilities: Ability[];
  measurements: Measurements;
  me: Me;
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

//what a measurement looks like being done, by its name
const MEASURED: Record<string, MotionName> = {
  Height: 'height',
  Weight: 'weight',
  'Body Fat': 'bodyFat',
  'Resting Heart Rate': 'pulse',
  'Waist Circumference': 'waist',
  'Arm Span': 'armSpan',
  'Upper Arm Length': 'upperArm',
  'Upper Leg Length': 'upperLeg',
  'Hand Span': 'handSpan',
  'Systolic Blood Pressure': 'bloodPressure',
  'Diastolic Blood Pressure': 'bloodPressure',
  'VO2 Max': 'run',
  'Sit and Reach': 'sitReach',
  'Vertical Jump': 'jump',
  'Visual Acuity': 'eyeChart',
  'Push-Ups': 'pushUp',
  'One-Leg Stand, Eyes Closed': 'oneLeg',
  'Plank Hold': 'plank',
  'Squat One-Rep Max': 'squat',
  'Coin Transfer': 'coinTransfer',
  'Coin Turning': 'coinTurning',
  'Plate Tapping': 'plateTapping',
  'Steady Hand': 'steady',
  'Hexagon Jump': 'hexagon',
  'Bend, Twist and Touch': 'bendTwist',
  'Digit Span': 'digitSpan',
  'Trail Making': 'trailMaking',
  'Matrix Puzzles': 'matrices',
  'Number Series': 'numberSeries',
  'Shape Rotation': 'rotation',
  'Paper Folding': 'paperFolding',
  'Perspective Taking': 'perspective',
  Syllogisms: 'syllogisms',
  'Symbol Matching': 'symbols',
  'Distracting Arrows': 'flanker',
  'Card Sorting': 'cardSorting',
  'Broken Words': 'brokenWords',
  'Hidden Shapes': 'hiddenShapes',
  'Track and Count': 'trackCount',
  'Design Fluency': 'designs',
  'Brick Uses': 'brickUses',
  'Spot the Problem': 'problems',
};
const measuredBy = (name: string): MotionName => MEASURED[name] ?? 'screen';

//what an ability looks like being used, for rating it, by its name
const USED: Record<string, MotionName> = {
  'Static Strength': 'lift',
  'Dynamic Strength': 'pushUp',
  'Explosive Strength': 'jump',
  'Trunk Strength': 'plank',
  Stamina: 'run',
  'Extent Flexibility': 'sitReach',
  'Dynamic Flexibility': 'bendTwist',
  'Gross Body Coordination': 'hexagon',
  'Gross Body Equilibrium': 'oneLeg',
};
const usedBy = (name: string, category: string): MotionName => USED[name] ?? (category === 'Physical' ? 'hello' : 'screen');

const WHOLE: LayerId[] = ['skeleton', 'organs'];
//what's under the skin, for what someone lives with
const INSIDE: LayerId[] = ['skeleton', 'organs', 'nervous'];

//how many of the abilities the user has measured or rated, as the results' progress
const found = (abilities: Ability[], measurements: Measurements) =>
  `${abilities.filter((a) => a.value !== null || triedFor(a, measurements)).length} of ${abilities.length} abilities done`;

//names run together as people say them: "a, b and c"
const listed = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

function measuring(m: Measurement, shows: Ability[], hand: string | null): Scene {
  const abilities = shows.length ? ` It tells us about your ${listed(shows.map((a) => a.name.toLowerCase()))}.` : '';
  return {
    id: m.id,
    title: m.name,
    text: `${inYourHands(m.description, hand)}${abilities}`,
    stage: { motion: measuredBy(m.name) },
    panel: { kind: 'measurement', id: m.id },
  };
}

//measurements that show an ability but aren't asked for, since few people can take them at home. An ability shown only
//by these is rated instead
const UNASKED = ['Grip Strength'];

//the measurements of an ability that are asked for
export const askedFor = (a: Ability) => a.measurements.filter((m) => !UNASKED.includes(m.name));

//what an ability looks like being used, from its test, for showing it off. None for the ones tested on a screen
export function motionFor(a: Ability): MotionName | null {
  const test = askedFor(a)[0];
  const motion = test ? measuredBy(test.name) : usedBy(a.name, a.category);
  return motion === 'screen' || motion === 'hello' ? null : motion;
}

//whether the user has a reading of a measurement that's asked for an ability, so they've done it even when there's
//nothing to compare it with yet
export const triedFor = (a: Ability, measurements: Measurements) =>
  askedFor(a).some((s) => measurements.measurements.find((m) => m.id === s.id)?.readings.length);

//the scene that asks about an ability: its first measurement, or rating it when nothing measures it
export const sceneFor = (a: Ability) => askedFor(a)[0]?.id ?? a.id;

//Atlas summing up where the user stands on a category of abilities, in plain words: what they stand out at, what's
//typical, what's lower, what's waiting on other people to compare it with, and how many are still to do
function summary(abilities: Ability[], measurements: Measurements) {
  const placed = abilities.filter((a) => a.value !== null).sort((a, b) => b.value! - a.value!);
  const waiting = abilities.filter((a) => a.value === null && triedFor(a, measurements));
  if (!placed.length && !waiting.length) return "You haven't measured or rated any of these yet. Go back and try a few, and I'll sum up how you did.";
  const named = (list: Ability[]) => listed(list.map((a) => plain(a.name)));
  const strong = placed.filter((a) => a.value! >= STRONG);
  const typical = placed.filter((a) => a.value! < STRONG && a.value! >= WEAK);
  const low = placed.filter((a) => a.value! < WEAK);
  const left = abilities.length - placed.length - waiting.length;
  return [
    strong.length && `You stand out at ${named(strong)}, where you're ahead of most people your age, and I've picked out a few skills that play to that.`,
    typical.length && `You're about typical at ${named(typical)}.`,
    low.length && `You're behind most people at ${named(low)}, which is something you can work on.`,
    waiting.length &&
      `I can't compare your ${named(waiting)} with anyone yet, since not enough people your age have done ${waiting.length === 1 ? 'that test' : 'those tests'}, so I'll show you where you stand once they have.`,
    left && `There ${left === 1 ? 'is 1 more' : `are ${left} more`} you haven't done yet, listed with the rest.`,
  ]
    .filter(Boolean)
    .join(' ');
}

//the steps of a chapter on a category of abilities: a test for each measurement asked for one of them, and a rating
//for each ability nothing measures
function steps(abilities: Ability[], measurements: Measurements, category: Ability['category']) {
  const group = abilities.filter((a) => a.category === category);
  const tested = [...new Set(group.flatMap((a) => askedFor(a).map((m) => m.id)))].flatMap((m) => measurements.measurements.find((x) => x.id === m) ?? []);
  const untested = group.filter((a) => !askedFor(a).length);
  return { group, tested, untested };
}

//a chapter on the abilities in a category: what they are, a scene for each measurement that shows one, a scene to rate
//themselves on each one no measurement shows, and Atlas summing up how they did
function abilities(id: string, title: string, category: Ability['category'], motion: MotionName, intro: string[], blurb: string): Chapter {
  return {
    id,
    title,
    blurb,
    scenes: ({ abilities, measurements, me }) => {
      const { group, tested, untested } = steps(abilities, measurements, category);
      return [
        ...intro.map((text, i): Scene => ({ id: `intro-${i + 1}`, text, stage: { motion } })),
        ...tested.map((m) => measuring(m, group.filter((a) => askedFor(a).some((s) => s.id === m.id)), handOf(me))),
        ...untested.map(
          (a): Scene => ({
            id: a.id,
            title: a.name,
            text: `${a.description} We don't have a test for this one yet, so pick the hardest of these you could do.`,
            stage: { motion: usedBy(a.name, a.category) },
            panel: { kind: 'rating', id: a.id },
          }),
        ),
        {
          id: 'results',
          text: summary(group, measurements),
          stage: { sheet: category },
        },
      ];
    },
    progress: ({ abilities, measurements }) => {
      const { tested, untested } = steps(abilities, measurements, category);
      const done = tested.filter((m) => m.readings.length).length + untested.filter((a) => a.value !== null).length;
      return `${done} of ${tested.length + untested.length} done`;
    },
  };
}

//the measurements of the body itself rather than an ability, in the order they're asked about, by name
const BASICS = [
  'Height',
  'Weight',
  'Body Fat',
  'Waist Circumference',
  'Arm Span',
  'Upper Arm Length',
  'Upper Leg Length',
  'Hand Span',
  'Resting Heart Rate',
  'Systolic Blood Pressure',
  'Diastolic Blood Pressure',
];
const basics = (measurements: Measurements) => BASICS.flatMap((name) => measurements.measurements.find((m) => m.name === name) ?? []);

//the chapters, which the user can take in any order: the basics, what their body can do, the results drawn on the
//body, what they live with, and the body to explore
export const CHAPTERS: Chapter[] = [
  {
    id: 'basics',
    title: 'Physical Characteristics',
    blurb: 'Your size and shape, which hand you use, your heart rate and your blood pressure.',
    scenes: ({ measurements, me }) => [
      {
        id: 'intro',
        text: "Let's start with the easy ones: how tall you are and what you weigh, the shape and reach of your body, which hand you use, and your heart rate and blood pressure. You probably know some of these already, and the rest only need a scale, a tape measure or a minute with your pulse. If you don't know one, like your blood type, just skip it. You can always add it later if you want to.",
        stage: { motion: 'height' },
      },
      ...me.characteristics.map(
        (c): Scene => ({ id: c.id, title: c.name, text: c.question, stage: { motion: 'hello' }, panel: { kind: 'characteristic', id: c.id } }),
      ),
      ...basics(measurements).map((m) => measuring(m, [], handOf(me))),
    ],
    progress: ({ measurements }) => {
      const all = basics(measurements);
      return `${all.filter((m) => m.readings.length).length} of ${all.length} measured`;
    },
  },
  abilities(
    'body',
    'Strength and fitness',
    'Physical',
    'squat',
    [
      'This chapter is about what your body can do: how strong you are, how long you can keep going, how flexible you are and how well you keep your balance.',
      "Most of these you can test at home with a stopwatch and a bit of floor space, and I'll show you how each one is done. Skip anything you'd rather not try, and come back to it whenever you like.",
    ],
    'Strength, stamina, flexibility and balance.',
  ),
  abilities(
    'coordination',
    'Coordination and speed',
    'Psychomotor',
    'screen',
    [
      'Coordination and speed are about how well your hands, eyes and body work together, like how fast you react, how steady your hands are and how nimble your fingers are.',
      'Most of these are short games you can play right here, and each one takes a minute or two.',
    ],
    'Short games for your reactions, steady hands and nimble fingers.',
  ),
  abilities(
    'senses',
    'Senses',
    'Sensory',
    'eyeChart',
    [
      'This chapter is about your eyes and ears: how well you see up close, far away, in the dark and in color, and how well you hear.',
      'You can test several of these on your screen right now, and the rest you can fill in from an eye or hearing test you have had.',
    ],
    'Your eyesight and hearing.',
  ),
  abilities(
    'mind',
    'Mind',
    'Cognitive',
    'screen',
    [
      'This chapter is about how you think: reasoning, remembering, spotting patterns, picturing shapes and coming up with ideas.',
      "The tests are puzzles and quick games, and you can take as many or as few of them as you like.",
    ],
    'Puzzles and games for reasoning, memory, patterns and ideas.',
  ),
  {
    id: 'results',
    title: 'Your results',
    blurb: 'Everything you have measured, tested and rated, drawn on your body.',
    scenes: () => [
      {
        id: 'results',
        text: 'Here is everything you have measured, tested and rated, drawn on your body. Red parts are behind your stronger abilities and blue parts are behind the ones that are lower. Pick an ability to see which parts of you it uses.',
        stage: { shot: { layers: ['skeleton', 'muscles', 'nervous', 'organs'] } },
        panel: { kind: 'results' },
      },
    ],
    progress: ({ abilities, measurements }) => found(abilities, measurements),
  },
  {
    id: 'living-with',
    title: 'Conditions and disabilities',
    blurb: 'Anything you live with, like asthma, a bad knee or needing glasses.',
    scenes: () => [
      {
        id: 'intro',
        text: "Lots of people live with something, like needing glasses, a bad knee, asthma or ADHD. When a skill needs something that one of these can affect, I'll mention it so you can plan around it.",
        stage: { shot: { layers: INSIDE } },
      },
      {
        id: 'impairments',
        text: "First, is there any part of your body or mind that doesn't work as well as it could? Add it here along with how much it holds you back.",
        stage: { shot: { layers: INSIDE } },
        panel: { kind: 'noting', show: 'impairments' },
      },
      {
        id: 'conditions',
        text: 'Next, add any conditions you have been diagnosed with or know you have, and how much each one affects you.',
        stage: { shot: { layers: INSIDE } },
        panel: { kind: 'noting', show: 'conditions' },
      },
    ],
    progress: ({ impairments, conditions }) => {
      const noted = impairments.impairments.length + conditions.mine.length;
      return noted ? `${noted} added` : 'Nothing added';
    },
  },
  {
    id: 'explore',
    title: 'Explore',
    blurb: 'Turn the body around, click any part, and learn what it does.',
    scenes: () => [
      {
        id: 'explore',
        text: 'Turn the body around and click any part to find out what it does and what depends on it.',
        stage: { shot: { layers: WHOLE } },
        panel: { kind: 'explore' },
      },
    ],
  },
];
