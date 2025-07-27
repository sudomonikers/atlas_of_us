import { useState, useEffect, useRef } from "react";
import './tutorialCard.css';

interface TutorialCardProps {
    text: string;
    targetElement?: string; // CSS selector for element to point to
    position?: 'top' | 'bottom' | 'left' | 'right';
    onNext?: () => void;
    onClose?: () => void;
    showCloseButton?: boolean;
    showNextButton?: boolean;
    autoPosition?: boolean; // Automatically position based on target element
}

export function TutorialCard({
    text,
    targetElement,
    position = 'bottom',
    onNext,
    onClose,
    showCloseButton = true,
    showNextButton = true,
    autoPosition = true
}: TutorialCardProps) {
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
    const [actualPosition, setActualPosition] = useState(position);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (targetElement) {
            const target = document.querySelector(targetElement);
            if (target && cardRef.current) {
                const targetRect = target.getBoundingClientRect();
                const viewport = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };

                let newPosition = position;
                let x = 0;
                let y = 0;
                let pointerX = targetRect.left + targetRect.width / 2;
                let pointerY = targetRect.top + targetRect.height / 2;

                if (autoPosition) {
                    // Determine best position based on available space
                    const spaceAbove = targetRect.top;
                    const spaceBelow = viewport.height - targetRect.bottom;
                    const spaceLeft = targetRect.left;
                    const spaceRight = viewport.width - targetRect.right;

                    if (spaceBelow > 200) newPosition = 'bottom';
                    else if (spaceAbove > 200) newPosition = 'top';
                    else if (spaceRight > 300) newPosition = 'right';
                    else if (spaceLeft > 300) newPosition = 'left';
                    else newPosition = 'bottom'; // fallback
                }

                switch (newPosition) {
                    case 'top':
                        x = targetRect.left + targetRect.width / 2 - 200; // Assume 400px card width
                        y = targetRect.top - 250; // Assume 200px card height + margin
                        pointerY = targetRect.top;
                        break;
                    case 'bottom':
                        x = targetRect.left + targetRect.width / 2 - 200;
                        y = targetRect.bottom + 20;
                        pointerY = targetRect.bottom;
                        break;
                    case 'left':
                        x = targetRect.left - 420; // Card width + margin
                        y = targetRect.top + targetRect.height / 2 - 100;
                        pointerX = targetRect.left;
                        break;
                    case 'right':
                        x = targetRect.right + 20;
                        y = targetRect.top + targetRect.height / 2 - 100;
                        pointerX = targetRect.right;
                        break;
                }

                // Keep card within viewport bounds
                x = Math.max(20, Math.min(x, viewport.width - 420));
                y = Math.max(20, Math.min(y, viewport.height - 220));

                setCardPosition({ x, y });
                setActualPosition(newPosition);
            }
        }
    }, [targetElement, position, autoPosition]);

    const handleNext = () => {
        if (onNext) onNext();
    };

    const handleClose = () => {
        if (onClose) onClose();
    };

    return (
        <>
            {/* Tutorial card */}
            <div 
                ref={cardRef}
                className={`tutorial-card tutorial-card--${actualPosition}`}
                style={{
                    position: 'fixed',
                    left: `${cardPosition.x}px`,
                    top: `${cardPosition.y}px`,
                    zIndex: 10000
                }}
            >
                <div className="tutorial-card__content">
                    <div className="tutorial-card__text">
                        {text}
                    </div>
                    
                    <div className="tutorial-card__actions">
                        {showCloseButton && (
                            <button 
                                className="tutorial-card__button tutorial-card__button--secondary"
                                onClick={handleClose}
                            >
                                Skip Tutorial
                            </button>
                        )}
                        {showNextButton && (
                            <button 
                                className="tutorial-card__button tutorial-card__button--primary"
                                onClick={handleNext}
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>

                {/* Arrow pointing to target */}
                {targetElement && <div className="tutorial-card__arrow" />}
            </div>

            {/* Overlay to highlight target element */}
            {targetElement && <div className="tutorial-overlay" />}
        </>
    );
}