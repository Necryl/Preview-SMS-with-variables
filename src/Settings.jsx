import React, { useRef, useEffect, useState } from 'react';
import './Settings.css';
import { DEFAULT_SETTINGS } from './config';

function Settings({ isOpen, onClose, settings, onApply }) {
    const modalRef = useRef(null);
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            // Focus the modal when opened
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 0);
        }
    }, [isOpen, settings]);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const placeholder = localSettings.variablePlaceholder || "";
    const isAmbiguous = placeholder.length > 1 && placeholder[0] === placeholder[placeholder.length - 1];
    const isValid = placeholder.length > 0;

    const handleUpdate = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = (key) => {
        setLocalSettings(prev => ({ ...prev, [key]: DEFAULT_SETTINGS[key] }));
    };

    return (
        <div className="settings-overlay">
            <div className="settings-modal" ref={modalRef} tabIndex={-1}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="settings-content">
                    <div className="settings-grid">
                        <div className="settings-column">
                            <h3>General</h3>
                            <div className="setting-item">
                                <label htmlFor="var-placeholder">Variable Placeholder</label>
                                <div className={`setting-control ${isAmbiguous ? 'warning' : ''} ${!isValid ? 'error' : ''}`}>
                                    <input
                                        id="var-placeholder"
                                        type="text"
                                        value={localSettings.variablePlaceholder}
                                        onChange={(e) => handleUpdate('variablePlaceholder', e.target.value)}
                                    />
                                    <button
                                        className="reset-btn"
                                        onClick={() => handleReset('variablePlaceholder')}
                                        title="Reset to default"
                                    >
                                        Reset
                                    </button>
                                </div>
                                {isAmbiguous && (
                                    <p className="warning-msg">
                                        It is recommended to use placeholders with different starting and ending characters.
                                    </p>
                                )}
                                {!isValid && (
                                    <p className="error-msg">
                                        Variable placeholder cannot be empty.
                                    </p>
                                )}
                                <p className="setting-desc">The pattern used to identify variables in your template. Default: {DEFAULT_SETTINGS.variablePlaceholder}</p>
                            </div>

                            <div className="setting-item">
                                <label htmlFor="template-limit">Template Character Limit</label>
                                <div className="setting-control">
                                    <input
                                        id="template-limit"
                                        type="number"
                                        min="0"
                                        value={localSettings.templateCharLimit || ""}
                                        onChange={(e) => handleUpdate('templateCharLimit', e.target.value)}
                                        placeholder="No limit"
                                    />
                                    <button
                                        className="reset-btn"
                                        onClick={() => handleReset('templateCharLimit')}
                                        title="Reset to default"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <p className="setting-desc">Highlight character count if template exceeds this length. Leave empty for no limit. Default: {DEFAULT_SETTINGS.templateCharLimit || "None"}</p>
                            </div>

                            <div className="setting-item">
                                <label htmlFor="variable-limit">Variable Character Limit</label>
                                <div className="setting-control">
                                    <input
                                        id="variable-limit"
                                        type="number"
                                        min="0"
                                        value={localSettings.variableCharLimit || ""}
                                        onChange={(e) => handleUpdate('variableCharLimit', e.target.value)}
                                        placeholder="No limit"
                                    />
                                    <button
                                        className="reset-btn"
                                        onClick={() => handleReset('variableCharLimit')}
                                        title="Reset to default"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <p className="setting-desc">Highlight character count if a variable exceeds this length. Leave empty for no limit. Default: {DEFAULT_SETTINGS.variableCharLimit || "None"}</p>
                            </div>

                            <h3>JSON View</h3>
                            <div className="setting-item checkbox-item">
                                <div className="checkbox-control">
                                    <input
                                        id="show-template-id"
                                        type="checkbox"
                                        checked={localSettings.showTemplateIdInJson ?? DEFAULT_SETTINGS.showTemplateIdInJson}
                                        onChange={(e) => handleUpdate('showTemplateIdInJson', e.target.checked)}
                                    />
                                    <label htmlFor="show-template-id">Show Template ID</label>
                                </div>
                                <p className="setting-desc">Include the Template ID field in the JSON view.</p>
                            </div>

                            <div className="setting-item checkbox-item">
                                <div className="checkbox-control">
                                    <input
                                        id="show-notes"
                                        type="checkbox"
                                        checked={localSettings.showNotesInJson ?? DEFAULT_SETTINGS.showNotesInJson}
                                        onChange={(e) => handleUpdate('showNotesInJson', e.target.checked)}
                                    />
                                    <label htmlFor="show-notes">Show Notes</label>
                                </div>
                                <p className="setting-desc">Include the Notes field in the JSON view.</p>
                            </div>

                            <div className="setting-item checkbox-item">
                                <div className="checkbox-control">
                                    <input
                                        id="show-metadata"
                                        type="checkbox"
                                        checked={localSettings.showMetadataInJson ?? DEFAULT_SETTINGS.showMetadataInJson}
                                        onChange={(e) => handleUpdate('showMetadataInJson', e.target.checked)}
                                    />
                                    <label htmlFor="show-metadata">Show Metadata (Lengths & Limits)</label>
                                </div>
                                <p className="setting-desc">Include character counts and limit settings in the JSON view. These are read-only.</p>
                            </div>
                        </div>

                        <div className="settings-column">
                            <h3>Keyboard Shortcuts</h3>
                            <ul className="shortcuts-list">
                                <li><strong>Ctrl+Z / Ctrl+Y</strong>: Undo / Redo</li>
                                <li><strong>Escape</strong>: Toggle Settings / Close Dialogs</li>
                                <li><strong>Alt+A / Alt+W</strong>: New Tab / Close Tab</li>
                                <li><strong>Alt+Shift+← / →</strong>: Previous / Next Tab</li>
                                <li><strong>Alt+N</strong>: New Instance</li>
                                <li><strong>Alt+Shift+D</strong>: Duplicate Instance</li>
                                <li><strong>Alt+X</strong>: Delete Instance</li>
                                <li><strong>Alt+↑ / ↓</strong>: Select Prev / Next Instance</li>
                                <li><strong>Alt+End</strong>: Select Last Instance</li>
                                <li><strong>Alt+C</strong>: Insert Variable</li>
                                <li><strong>Alt+Home</strong>: Focus Template</li>
                                <li><strong>Alt+Enter</strong>: Focus Title</li>
                                <li><strong>Alt+G / Alt+B</strong>: Copy Template / Result</li>
                                <li><strong>Alt+Q</strong>: Toggle Result View</li>
                                <li><strong>Alt+J</strong>: Toggle JSON View</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="settings-footer">
                    <button className="reset-all-btn" onClick={() => {
                        setLocalSettings(DEFAULT_SETTINGS);
                    }}>Reset All</button>
                    <button className="apply-btn" onClick={() => onApply(localSettings)} disabled={!isValid}>Apply</button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
