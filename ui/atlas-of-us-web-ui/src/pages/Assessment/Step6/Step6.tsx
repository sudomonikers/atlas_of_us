import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step6({ onStepComplete, onFunctionCall }: StepProps) {
    const dialogueText = "Let's start with your skills and abilities. This is usally everyone's favorite. What are you good at?";
    
    const handleDialogueNext = () => {
        if (onFunctionCall) {
            onFunctionCall('transitionToSky');
        }
        onStepComplete({});
    };
    
    return <Dialogue text={dialogueText} onNext={handleDialogueNext} />;
}