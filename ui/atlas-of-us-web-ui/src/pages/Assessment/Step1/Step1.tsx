import { useState, useEffect } from "react";

interface Step1Props {
    onNext: () => void;
}

export function Step1({ onNext }: Step1Props) {
    const [currentText, setCurrentText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEnterPrompt, setShowEnterPrompt] = useState(false);
    
    const introText = "Welcome, seeker. I am Link, your guide through the depths of self-discovery. Together, we shall explore the constellation of your being...";
    
    useEffect(() => {
        setIsTyping(true);
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < introText.length) {
                setCurrentText(introText.substring(0, index + 1));
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