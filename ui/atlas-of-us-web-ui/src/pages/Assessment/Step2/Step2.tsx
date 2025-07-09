import { Dialogue } from "../shared/Dialogue";

interface Step2Props {
    onNext: () => void;
}

export function Step2({ onNext }: Step2Props) {
    const dialogueText = "First, we must understand who you are in this moment. Tell me, what knowledge do you possess? What skills have you mastered?";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}