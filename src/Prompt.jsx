import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import './Prompt.css';

const PromptContext = createContext(null);

export const usePrompt = () => {
    const context = useContext(PromptContext);
    if (!context) {
        throw new Error('usePrompt must be used within a PromptProvider');
    }
    return context;
};

export const PromptProvider = ({ children }) => {
    const [promptState, setPromptState] = useState({
        isVisible: false,
        message: '',
        buttons: [],
    });

    // We store the resolve function in a ref so we can call it later
    const resolveRef = useRef(null);

    const showPrompt = useCallback((message, buttons = ['OK']) => {
        return new Promise((resolve) => {
            setPromptState({
                isVisible: true,
                message,
                buttons,
            });
            resolveRef.current = resolve;
        });
    }, []);

    const handleClose = useCallback((result) => {
        setPromptState((prev) => ({ ...prev, isVisible: false }));
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose(null); // Dismissed
        }
    };

    return (
        <PromptContext.Provider value={{ showPrompt }}>
            {children}
            {promptState.isVisible && (
                <div className="prompt-overlay" onClick={handleBackdropClick}>
                    <div className="prompt-dialog">
                        <div className="prompt-message">{promptState.message}</div>
                        <div className="prompt-buttons">
                            {promptState.buttons.map((btn, index) => {
                                let label = btn;
                                let value = btn;
                                let className = 'prompt-btn';

                                if (typeof btn === 'object') {
                                    label = btn.label;
                                    value = btn.value;
                                    if (btn.className) className += ` ${btn.className}`;
                                    if (btn.risk) className += ` risk-${btn.risk}`;
                                } else {
                                    // Default styling based on text
                                    if (['yes', 'confirm', 'ok', 'okay'].includes(label.toLowerCase())) {
                                        className += ' confirm';
                                    } else if (['no', 'cancel'].includes(label.toLowerCase())) {
                                        className += ' cancel';
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        className={className}
                                        onClick={() => handleClose(value)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </PromptContext.Provider>
    );
};
