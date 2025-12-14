import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step2Choice2({ onStepComplete }: StepProps) {
    const dialogueText = "Wow. You actually filled that out. Are you dumb I just told you we had a methodical way of figuring this out to have you complete later. Why waste your time and energy? You must be a very inefficient person. Unless... Maybe you just wanted to go through the exercise yourself as a valuable thought experiment. That would be commendable for being independent-thinking and thoughtful. Or maybe its for any number of different reasons, all of which say something different about you even though the action is the same. The intentions behind an action or something you say may not affect the end result, but they do matter a lot in evaluating you and who you are. That is a big part of where all the other 'personality tests' and 'astrology' and all the other little quizzes people take to try and figure out who they are go wrong. They are undifferentiating in people's intentions when evaluating responses. Which makes them pretty trash imo. (Also don't worry we will save your response and auto fill things in the future where they are applicable. so you did not waste your time)";
    
    return <Dialogue text={dialogueText} onNext={onStepComplete} />;
}