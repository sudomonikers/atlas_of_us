import { Dialogue } from "../shared/Dialogue";

interface Step3Props {
    onNext: () => void;
}

export function Step3({ onNext }: Step3Props) {
    const dialogueText = "Now, let us explore your essence. What drives you? What are your passions, your fears, your deepest desires?";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}