import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step5({ onNext }: StepProps) {
    const dialogueText = "Ugh so many things... Don't worry though we'll make it a breeze and help you along every step of the way! And at the end we'll even assign you a little spirit animal or whatever to make the astrology people happy. But really the point of this site is to gain a better understanding of yourself and to help you maximize your potential by showing you all the possible you's there could be, and how you can get there. So... Let's get started shall we?";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}