import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";
import { useEffect } from "react";

export function StepSkillsAbilities({ onNext, onFunctionCall }: StepProps) {
    const dialogueText = "";
    
    useEffect(() => {
        if (onFunctionCall) {
            onFunctionCall('loadSkillsNodes');
        }
    }, []);
    
    return (
        <>
            <Dialogue text={dialogueText} onNext={onNext} />
        </>
    );
}