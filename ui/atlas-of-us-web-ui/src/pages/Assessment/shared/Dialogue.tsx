import { useState, useEffect } from "react";

interface DialogueProps {
    text: string;
    onNext: () => void;
}

export function Dialogue({ text, onNext }: DialogueProps) {
    const [currentText, setCurrentText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEnterPrompt, setShowEnterPrompt] = useState(false);
    
    useEffect(() => {
        setIsTyping(true);
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                setCurrentText(text.substring(0, index + 1));
                index++;
            } else {
                setIsTyping(false);
                setShowEnterPrompt(true);
                clearInterval(typeInterval);
            }
        }, 50);
        
        return () => clearInterval(typeInterval);
    }, [text]);
    
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