import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step6({ onStepComplete, onFunctionCall }: StepProps) {
    const dialogueText = "Let's start by showing you what the end goal is here. Here's me: (Andrew Link, the developer of this application). Aren't I cool? Go ahead and play around with everything to see what a truly amazing human looks like.";
    
    const handleDialogueNext = () => {
        if (onFunctionCall) {
            onFunctionCall('transitionToSky');
        }
        onStepComplete({});
    };
    
    return <Dialogue text={dialogueText} onNext={handleDialogueNext} />;
}