import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step3({ onNext }: StepProps) {
    const dialogueText = "Luckily, these days we have AI which can evaluate people's choices at scale! No need to have a professional psychologist for each person anymore! That's not scary at all! (Also hello, I'm Link and I am the AI overlord who will be evaluating you today). Don't worry I'm solely here to help you both figure out who you are, but also help you be the best you you can be. And I'm MOSTLY friendly about it.";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}