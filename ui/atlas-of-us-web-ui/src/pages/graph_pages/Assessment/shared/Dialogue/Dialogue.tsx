import { useState, useEffect, useRef } from "react";
import './dialogue.css';
import { useGlobal } from "../../../../../GlobalProvider";

interface DialogueProps {
    text: string;
    onNext: () => void;
}

export function Dialogue({ text, onNext }: DialogueProps) {
    const [dialogueActive, setDialogueActive] = useState(true);
    const [currentText, setCurrentText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEnterPrompt, setShowEnterPrompt] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const { graphToggled } = useGlobal();
    const initialGraphToggled = useRef(graphToggled);

    useEffect(() => {
        if (graphToggled > initialGraphToggled.current) {
            setDialogueActive(false)
        }
    }, [graphToggled])

    useEffect(() => {
        setIsTyping(true);
        setShowEnterPrompt(false);
        let index = 0;
        intervalRef.current = setInterval(() => {
            if (index < text.length) {
                setCurrentText(text.substring(0, index + 1));
                index++;
            } else {
                setIsTyping(false);
                setShowEnterPrompt(true);
                clearInterval(intervalRef.current!);
            }
        }, 15);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [text]);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                if (isTyping) {
                    // Finish typing immediately
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    setCurrentText(text);
                    setIsTyping(false);
                    setShowEnterPrompt(true);
                } else {
                    // Continue to next message
                    onNext();
                }
            }
        };

        if (dialogueActive) {
            window.addEventListener('keydown', handleKeyPress);
        }
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isTyping, onNext, text, dialogueActive]);

    return (
        <div className={`link-dialogue ${!dialogueActive ? 'collapsed' : ''}`}>
            {!dialogueActive && (
                <div className="dialogue-toggle-arrow" onClick={() => setDialogueActive(true)}>
                    ▲
                </div>
            )}
            <div className="link-text" ref={textRef}>
                {currentText}
                {isTyping && <span className="cursor">|</span>}
            </div>
            {showEnterPrompt && (
                <div className="enter-prompt">
                    Press <button className="enter-key" onClick={onNext}>Enter</button> to continue
                </div>
            )}
        </div>
    );
}