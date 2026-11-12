// What a story that opens a module is made of: sections of steps, each a line of narration or dialogue over a drawing,
// or the real Atlas during an interlude, or a choice. Each story says what its stages are, and what a choice that ends
// it opens. The player is player.tsx.

export interface Frame<S> {
  text: string; //the text displayed on screen for the user
  animation?: string; //the drawing behind it, by name
  stage?: S; //the real Atlas, shown over the drawing
  speaker?: string; //who is talking; omitted for narration
}

//an option shown to the user. One with a next goes on to that section; one without ends the story
export interface Choice {
  label: string;
  next?: string; //id of the Section to continue with if this choice is picked
}

export interface ChoiceFrame<C extends Choice> {
  id: string; //unique within the script
  prompt: string; //the question shown to the user above the choices
  animation: string;
  choices: C[];
}

export type Step<S, C extends Choice> = Frame<S> | ChoiceFrame<C>;

export interface Section<S, C extends Choice> {
  steps: Step<S, C>[];
  interlude?: string; //the title of an interlude, set on a section that steps out of the story to show how the Atlas works
  next?: string; //id of the Section that follows; omitted on the final Section, ignored when the last step is a ChoiceFrame
}

export interface Script<S, C extends Choice> {
  id: string;
  title: string;
  start: string; //id of the first Section
  sections: Record<string, Section<S, C>>;
}

export interface Position {
  section: string;
  index: number;
}

export const isChoice = <S, C extends Choice>(step: Step<S, C>): step is ChoiceFrame<C> => 'choices' in step;

//where the script goes after a step that isn't a choice
export const following = <S, C extends Choice>(script: Script<S, C>, { section, index }: Position): Position | undefined => {
  if (index + 1 < script.sections[section].steps.length) return { section, index: index + 1 };
  const next = script.sections[section].next;
  return next ? { section: next, index: 0 } : undefined;
};
