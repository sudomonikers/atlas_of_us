import { Dialogue } from "../shared/Dialogue";

interface Step1Props {
    onNext: () => void;
}

export function Step1({ onNext }: Step1Props) {
    const introText = "Welcome, seeker. I am Link, your guide through the depths of self-discovery. Together, we shall explore the constellation of your being...";
    
    return <Dialogue text={introText} onNext={onNext} />;
}