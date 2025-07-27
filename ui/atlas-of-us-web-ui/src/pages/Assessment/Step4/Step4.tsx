import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";

export function Step4({ onStepComplete }: StepProps) {
    const dialogueText = "Here at the AOU we've spent an absurd amount of time just thinking about how to define a person. Here we define each 'person' (you) by summing together all the parts that make them up. Internally hese are things like their knowledge, beliefs, and ideas. Their personality, habits, jobs, hobbies, likes/dislike, goals/aspirations, and vices. But also health related things (diseases, disabilities, specific things about them they are proud of), different physical traits, and skills/abilities. But humans also make a mark on the world, and each person are ALSO the sum of their relationships with other people, different organizations, experience, and things they own.";
    
    return <Dialogue text={dialogueText} onNext={onStepComplete} />;
}