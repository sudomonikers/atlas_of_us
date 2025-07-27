import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function StepAndrew({ onStepComplete }: StepProps) {
    const dialogueText = "See this is me, aren't I cool? Go ahead and play around with everything to see what a truly amazing human looks like.";
    
    return <Dialogue text={dialogueText} onNext={onStepComplete} />;
}