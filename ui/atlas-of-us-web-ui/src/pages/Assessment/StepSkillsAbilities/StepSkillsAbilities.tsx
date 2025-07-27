import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue/Dialogue";
import { TutorialCard } from "../shared/TutorialCard/TutorialCard";
import { useState } from "react";

export function StepSkillsAbilities({ onStepComplete }: StepProps) {
    const [showTutorial, setShowTutorial] = useState(false);

    const dialogueText = "Let's figure out what skills and abilities you have.";

    const tutorialText = "This is your search bar. You'll notice it is always available anywhere on the site. You can use it to ask questions about either where you are and what to do there, or if you are on a graph page (notice the twinkling stars, aren't they pretty?) you can use it to query the Atlas Of Us's database for all the possibilities of life. Go ahead and type in 'Skills' and see what pops up. Since I know it can be confusing, do not include the quotation marks (although you could if you want, we handle all kinds of ridiculous user queries)."

    const handleDialogueNext = () => {
        setShowTutorial(true);
    };

    const animateLetters = () => {
        const letters = ['S', 'k', 'i', 'l', 'l', 's'];
        const input = document.getElementById('globalInput') as HTMLInputElement;
        if (!input) return;

        const inputRect = input.getBoundingClientRect();
        const container = document.body;

        letters.forEach((letter, index) => {
            const letterEl = document.createElement('div');
            letterEl.textContent = letter;
            letterEl.style.cssText = `
                position: fixed;
                font-weight: bold;
                color: var(--nebula-blue, #9bb5ff);
                z-index: 9999;
                pointer-events: none;
                text-shadow: 0 0 20px currentColor;
                opacity: 0;
                transform: scale(4) rotate(${Math.random() * 360}deg);
                left: ${Math.random() * window.innerWidth}px;
                bottom: ${Math.random() * window.innerHeight}px;
            `;

            container.appendChild(letterEl);

            setTimeout(() => {
                letterEl.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                letterEl.style.opacity = '1';
                letterEl.style.transform = `scale(1.0) rotate(0deg)`;
                letterEl.style.fontSize = '1rem';
                letterEl.style.left = `${inputRect.left + (index * 15) + 16}px`;
                letterEl.style.bottom = `${window.innerHeight - inputRect.bottom}px`;
            }, index * 200);

            setTimeout(() => {
                letterEl.style.opacity = '0';
                setTimeout(() => letterEl.remove(), 300);
            }, 1500 + (index * 200));
        });
    };

    const handleTutorialNext = () => {
        setShowTutorial(false);
        const input = document.getElementById('globalInput') as HTMLInputElement;
        input.focus();
        animateLetters();
    };

    const handleTutorialClose = () => {
        setShowTutorial(false);
    };

    return (
        <>
            <Dialogue 
                text={dialogueText} 
                onNext={showTutorial ? onStepComplete : handleDialogueNext} 
            />
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