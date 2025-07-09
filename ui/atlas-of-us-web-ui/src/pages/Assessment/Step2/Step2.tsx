import { useState, useEffect } from "react";

interface Step2Props {
    onNext: () => void;
}

export function Step2({ onNext }: Step2Props) {
    const [currentText, setCurrentText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEnterPrompt, setShowEnterPrompt] = useState(false);
    
    const dialogueText = "First, we must understand who you are in this moment. Tell me, what knowledge do you possess? What skills have you mastered?";
    
    useEffect(() => {
        setIsTyping(true);
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < dialogueText.length) {
                setCurrentText(dialogueText.substring(0, index + 1));
                index++;
            } else {
                setIsTyping(false);
                setShowEnterPrompt(true);
                clearInterval(typeInterval);
            }
        }, 50);
        
        return () => clearInterval(typeInterval);
    }, []);
    
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !isTyping) {
                onNext();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isTyping, onNext]);
    
    return (
        <div className="link-dialogue">
            <div className="link-text">
                {currentText}
                {isTyping && <span className="cursor">|</span>}
            </div>
            {showEnterPrompt && (
                <div className="enter-prompt">
                    Press <span className="enter-key">Enter</span> to continue
                </div>
            )}
        </div>
    );
}