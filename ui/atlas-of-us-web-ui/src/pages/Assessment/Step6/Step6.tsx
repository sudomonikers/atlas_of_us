import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";
import { useEffect } from "react";

export function Step6({ onNext, onFunctionCall }: StepProps) {
    const dialogueText = "Let's start with your skills and abilities. This is usally everyone's favorite. What are you good at?";
    
    useEffect(() => {
        if (onFunctionCall) {
            onFunctionCall('transitionToSky');
        }
    }, []);
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}