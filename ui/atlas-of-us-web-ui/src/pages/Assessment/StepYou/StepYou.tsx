import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function StepYou({ onNext }: StepProps) {
    const dialogueText = "And this is you right now. Kind of a basic bitch tbh. Not much going on. But that's OK! We're gonna fix that soon.";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}