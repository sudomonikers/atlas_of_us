import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step1({ onNext }: StepProps) {
    const introText = "Welcome to the Atlas Of Us. What is the Atlas Of Us you ask? It is many wonderful things, but it is primarily a place to better yourself. It is a place to discover who you are as a human being, and a place to discover all you could be... But to do that, first we need to objectify you! Yay!";
    
    return <Dialogue text={introText} onNext={onNext} />;
}