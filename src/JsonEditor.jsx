import React, { useState, useEffect, useRef } from 'react';
import './JsonEditor.css';

const JsonEditor = ({ value, onChange, onApply, isApplied }) => {
    const [highlights, setHighlights] = useState([]);
    const textareaRef = useRef(null);
    const backdropRef = useRef(null);

    // Sync scroll
    const handleScroll = () => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    useEffect(() => {
        if (isApplied) {
            analyzeJson(value);
        } else {
            setHighlights([]);
        }
    }, [isApplied, value]); // Re-analyze if value changes while applied? No, usually we clear on edit.

    // Clear highlights on edit
    const handleChange = (e) => {
        setHighlights([]);
        onChange(e);
    };

    const analyzeJson = (jsonString) => {
        const lines = jsonString.split('\n');
        const newHighlights = new Array(lines.length).fill('');

        // Accepted keys
        const acceptedRootKeys = [
            'title', 'template', 'input', 'instances', 'variableValues',
            'templateId', 'notes', 'variableCount'
        ];
        const acceptedInstanceKeys = ['name', 'variables', 'data', 'id', 'value'];
        const ignoredKeys = [
            'currentTemplateLength', 'targetMaxMessageLength',
            'targetMaxVariableLength', 'currentMessageLength', 'length'
        ];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const keyMatch = trimmed.match(/^"([^"]+)":/);

            if (keyMatch) {
                const key = keyMatch[1];

                if (acceptedRootKeys.includes(key) || acceptedInstanceKeys.includes(key)) {
                    newHighlights[index] = 'highlight-accepted';
                } else if (ignoredKeys.includes(key)) {
                    newHighlights[index] = 'highlight-ignored';
                } else {
                    newHighlights[index] = 'highlight-invalid';
                }
            }
        });

        setHighlights(newHighlights);
    };

    return (
        <div className="json-editor-container">
            <div className="json-editor-backdrop" ref={backdropRef}>
                <div className="json-editor-highlights">
                    {value.split('\n').map((line, i) => (
                        <div
                            key={i}
                            className={`json-editor-line ${highlights[i] || ''}`}
                        >
                            &nbsp;
                        </div>
                    ))}
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onScroll={handleScroll}
                spellCheck="false"
                className="json-editor-textarea"
                placeholder="Paste JSON data here..."
            />
        </div>
    );
};

export default JsonEditor;
