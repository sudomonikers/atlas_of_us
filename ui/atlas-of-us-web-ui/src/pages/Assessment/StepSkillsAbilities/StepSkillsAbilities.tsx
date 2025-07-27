import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function StepSkillsAbilities({ onStepComplete }: StepProps) {
    const dialogueText = "Let's figure out what skills and abilities you have.";
    
    return (
        <>
            <Dialogue text={dialogueText} onNext={onStepComplete} />
        </>
    );
}