import { useGlobal } from "../../../GlobalProvider";
import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";
import { TutorialCard } from "../shared/TutorialCard/TutorialCard";
import { useState } from "react";

export function StepSkillsAbilities({ onStepComplete }: StepProps) {
    const [showTutorial, setShowTutorial] = useState(false);
    const { setSearchText } = useGlobal();

    const dialogueText = "Let's figure out what skills and abilities you have.";

    const tutorialText = "This is your search bar. You'll notice it is always available anywhere on the site. You can use it to ask questions about either where you are and what to do there, or if you are on a graph page (notice the twinkling stars, aren't they pretty?) you can use it to query the Atlas Of Us's database for all the possibilities of life. Go ahead and type in 'Skills' and see what pops up. Since I know it can be confusing, do not include the quotation marks (although you could if you want, we handle all kinds of ridiculous user queries)."

    const handleDialogueNext = () => {
        setShowTutorial(true);
    };

    const handleTutorialNext = () => {
        setShowTutorial(false);
        
        // Focus the input and type "Skills"
        setTimeout(() => {
            const input = document.getElementById('globalInput') as HTMLInputElement;
            if (input) {
                input.focus();
                input.value = 'Skills';
                
                // Trigger the onChange event to update the search context
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                setSearchText('Skills');
            }
        }, 100);
    };

    const handleTutorialClose = () => {
        setShowTutorial(false);
    };

    return (
        <>
            <Dialogue text={dialogueText} onNext={showTutorial ? onStepComplete : handleDialogueNext} />
            {showTutorial && (
                <TutorialCard
                    text={tutorialText}
                    targetElement="#globalInput"
                    position="bottom"
                    onNext={handleTutorialNext}
                    onClose={handleTutorialClose}
                    showCloseButton={true}
                    showNextButton={true}
                />
            )}
        </>
    );
}