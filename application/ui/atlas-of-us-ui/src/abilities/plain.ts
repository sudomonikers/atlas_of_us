// What O*NET's abilities are called in everyday words, for summing up where someone stands. O*NET's names come from job
// analysis ("Gross Body Equilibrium"), and these say the same thing the way people do ("balance"). Each fits after
// "you stand out at", so they read as things you can be good at.

const PLAIN: Record<string, string> = {
  'Static Strength': 'strength',
  'Explosive Strength': 'explosive power',
  'Dynamic Strength': 'muscular endurance',
  'Trunk Strength': 'core strength',
  Stamina: 'stamina',
  'Extent Flexibility': 'flexibility',
  'Dynamic Flexibility': 'bending and twisting',
  'Gross Body Coordination': 'whole-body coordination',
  'Gross Body Equilibrium': 'balance',

  'Arm-Hand Steadiness': 'steady hands',
  'Manual Dexterity': 'hand dexterity',
  'Finger Dexterity': 'finger dexterity',
  'Control Precision': 'precise control',
  'Multilimb Coordination': 'using your limbs together',
  'Response Orientation': 'choosing quickly',
  'Rate Control': 'timing',
  'Reaction Time': 'reaction time',
  'Wrist-Finger Speed': 'finger speed',
  'Speed of Limb Movement': 'arm speed',

  'Near Vision': 'close-up vision',
  'Far Vision': 'distance vision',
  'Visual Color Discrimination': 'color vision',
  'Night Vision': 'night vision',
  'Peripheral Vision': 'side vision',
  'Depth Perception': 'depth perception',
  'Glare Sensitivity': 'seeing in glare',
  'Hearing Sensitivity': 'hearing',
  'Auditory Attention': 'picking out sounds',
  'Sound Localization': 'telling where sounds come from',
  'Speech Recognition': 'understanding speech',
  'Speech Clarity': 'speaking clearly',

  'Fluency of Ideas': 'coming up with ideas',
  Originality: 'original thinking',
  'Problem Sensitivity': 'spotting problems',
  'Deductive Reasoning': 'logical reasoning',
  'Inductive Reasoning': 'spotting patterns',
  'Information Ordering': 'putting things in order',
  'Category Flexibility': 'sorting things different ways',
  Memorization: 'memory',
  'Speed of Closure': 'making sense of things quickly',
  'Flexibility of Closure': 'spotting hidden shapes',
  'Perceptual Speed': 'noticing details quickly',
  'Spatial Orientation': 'sense of direction',
  Visualization: 'picturing things in your head',
  'Selective Attention': 'focus',
  'Time Sharing': 'doing two things at once',
};

//an ability in everyday words, as it reads in a sentence
export const plain = (name: string) => PLAIN[name] ?? name.toLowerCase();

//an ability in everyday words, as a label
export const plainLabel = (name: string) => {
  const p = plain(name);
  return p.charAt(0).toUpperCase() + p.slice(1);
};

//where someone stands on an ability, 0 to 1, for it to be one of their strengths, and below which it's one to work on.
//The api picks skills that play to their strengths by the same lines
export const STRONG = 0.65;
export const WEAK = 0.35;
