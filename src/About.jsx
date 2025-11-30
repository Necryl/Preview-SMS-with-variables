import React, { useRef, useEffect } from 'react';
import './About.css';

function About({ isOpen, onClose }) {
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Focus the modal when opened
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 0);
        }
    }, [isOpen]);

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

    return (
        <div className="about-overlay">
            <div className="about-modal" ref={modalRef} tabIndex={-1}>
                <div className="about-header">
                    <h2>About</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="about-content">
                    <p>
                        <strong>Preview SMS with Variables</strong> is a specialized tool for crafting and testing SMS templates with dynamic content. It bridges the gap between static text and personalized messages.
                    </p>

                    <h3>Key Features</h3>
                    <ul>
                        <li><strong>Real-Time Preview:</strong> See exactly how your message looks as you fill in variables.</li>
                        <li><strong>Multi-Tab Interface:</strong> Work on multiple campaigns simultaneously with pinned tabs.</li>
                        <li><strong>Data Safety:</strong> All work is auto-saved locally in your browser.</li>
                        <li><strong>LLM Integration:</strong> Export your work to JSON for use with AI tools.</li>
                        <li><strong>Smart Migration:</strong> Change variable placeholders without losing data.</li>
                    </ul>

                    <h3>Shortcuts</h3>
                    <p>
                        Designed for speed, use <code>Alt + N</code> to add instances, <code>Alt + Shift + D</code> to duplicate, and <code>Alt + Shift + Arrows</code> to navigate tabs.
                    </p>
                </div>
                <div className="about-footer">
                    <p>Created by <a href="https://github.com/Necryl" target="_blank" rel="noopener noreferrer">Necryl</a></p>
                </div>
            </div>
        </div>
    );
}

export default About;
