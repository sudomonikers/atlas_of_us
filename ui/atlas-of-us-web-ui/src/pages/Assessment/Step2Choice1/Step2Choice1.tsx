import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue";

export function Step2Choice1({ onNext }: StepProps) {
    const dialogueText = "Wow. Aren't you lazy and boring. Nothing huh. Or... Maybe you are just efficient and know all of this will be filled out in a more standardized way later? So maybe you just think it is stupid to even bother filling things out now. And you are humble enough to know whatever you fill out free form won't be as good as the methodical way of filling things out later. OR maybe you are in fact just stupid. Who can say? There are so many different REASONS people do the things they do. And the intentions behind an action or something you say may not affect the end result, but they do matter a lot in evaluating you and who you are. That is a big part of where all the other 'personality tests' and 'astrology' and all the other little quizzes people take to try and figure out who they are go wrong. They are undifferentiating in people's intentions when evaluating responses. Which makes them pretty trash imo.";
    
    return <Dialogue text={dialogueText} onNext={onNext} />;
}