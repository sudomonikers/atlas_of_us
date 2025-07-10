import { StepProps } from "../Assessment";
import { Dialogue } from "../shared/Dialogue";
import { useState } from "react";

export function Step2({ onNext }: StepProps) {
    const [userResponse, setUserResponse] = useState("");
    const [showInput, setShowInput] = useState(false);
    const dialogueText = "Humans are a combination of so many things. We are complex creatures with a lot going on. If you were to describe yourself how would you do it? Pretend you are trying to create an exact clone of YOU, and to do so you need to tell the company doing so everything about you. No seriously. Go ahead and do it now. I pinky promise we won't actually clone you... Probably. ";
    
    const handleDialogueComplete = () => {
        setShowInput(true);
    };

    const handleSubmit = () => {
        onNext(userResponse);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && event.ctrlKey) {
            handleSubmit();
        }
    };

    if (showInput) {
        return (
            <div className="link-dialogue">
                <div className="input-section">
                    <textarea
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your response here..."
                        className="response-input"
                        rows={6}
                        autoFocus
                    />
                    <div className="input-controls">
                        <button onClick={handleSubmit} className="submit-button">
                            Submit
                        </button>
                        <div className="input-hint">
                            Press Ctrl+Enter to submit
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return <Dialogue text={dialogueText} onNext={handleDialogueComplete} />;
}