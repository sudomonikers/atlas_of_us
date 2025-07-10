import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue";

export function Step2Choice2({ onNext }: StepProps) {
    const dialogueText = "Of course, there is more we can offer you here. The more we get to know you (and everyone else who might use this application), the better recommendations we can give you. We could match you with the perfect job, no resume needed (Who needs a resume when we can see everything that you are?), or hell, even match you with a partner.";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}