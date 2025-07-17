import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue";

export function Step6({ onNext }: StepProps) {
    const dialogueText = "Let's start with your skills and abilities. This is usally everyone's favorite. What are you good at?";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}