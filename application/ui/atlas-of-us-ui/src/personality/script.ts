export type PersonalityTrait =
  // openness
  | 'Imagination'
  | 'Artistic Interests'
  | 'Emotionality'
  | 'Adventurousness'
  | 'Intellect'
  | 'Liberalism'
  // conscientiousness
  | 'Self-Efficacy'
  | 'Orderliness'
  | 'Dutifulness'
  | 'Achievement-Striving'
  | 'Self-Discipline'
  | 'Cautiousness'
  // extraversion
  | 'Friendliness'
  | 'Gregariousness'
  | 'Assertiveness'
  | 'Activity Level'
  | 'Excitement-Seeking'
  | 'Cheerfulness'
  // agreeableness
  | 'Trust'
  | 'Morality'
  | 'Altruism'
  | 'Cooperation'
  | 'Modesty'
  | 'Sympathy'
  // neuroticism
  | 'Anxiety'
  | 'Anger'
  | 'Depression'
  | 'Self-Consciousness'
  | 'Immoderation'
  | 'Vulnerability'
  // additional
  | 'Patience'
  | 'Resilience'
  | 'Optimism'
  | 'Perfectionism'
  | 'Competitiveness'
  | 'Stubbornness'
  | 'Independence'
  | 'Boldness'
  | 'Playfulness'
  | 'Introspection'
  | 'Sensory Sensitivity'
  | 'Decisiveness'
  | 'Adaptability'
  | 'Fairness';

export interface Frame {
  text: string; //the text displayed on screen for the user
  animation: string; //the consuming component will have a function with 'animation's value
  speaker?: string; //who is talking; omitted for narration
}

export interface Choice {
  label: string; //the option shown to the user
  next: string; //id of the Section to continue with if this choice is picked
}

export interface PromptFrame {
  id: string; //unique within the script, used to key the user's answer when sent to the backend
  prompt: string; //the question shown to the user above the text box
  animation: string;
  speaker?: string;
  facets: PersonalityTrait[]; //traits the backend should look for in the answer
  choices?: Choice[]; //if present the user picks one, then explains why in the text box
}

export type Step = Frame | PromptFrame;

export interface Section {
  steps: Step[];
  next?: string; //id of the Section that follows; omitted on the final Section, ignored when the last step is a PromptFrame with choices
}

export interface Script {
  id: string;
  title: string;
  facets: PersonalityTrait[]; //every trait this scenario is designed to measure
  start: string; //id of the first Section
  sections: Record<string, Section>;
}

export const isPrompt = (step: Step): step is PromptFrame => 'prompt' in step;
