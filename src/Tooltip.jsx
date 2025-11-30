import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

const Tooltip = ({ content, children }) => {
    const [visible, setVisible] = useState(false);
    const triggerRef = useRef(null);

    const handleMouseEnter = () => {
        setVisible(true);
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'block', width: 'fit-content' }}
            >
                {children}
            </div>
            {visible && content && ReactDOM.createPortal(
                <TooltipContent
                    content={content}
                    triggerRect={triggerRef.current?.getBoundingClientRect()}
                />,
                document.body
            )}
        </>
    );
};

const TooltipContent = ({ content, triggerRect }) => {
    const tooltipRef = useRef(null);
    const [style, setStyle] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useLayoutEffect(() => {
        if (tooltipRef.current && triggerRect) {
            const rect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = triggerRect.top - rect.height - 10; // Default: above
            let left = triggerRect.left;

            // Horizontal collision
            if (left + rect.width > viewportWidth - 10) {
                left = viewportWidth - rect.width - 10;
            }
            if (left < 10) {
                left = 10;
            }

            // Vertical collision
            if (top < 10) {
                // Flip to bottom
                top = triggerRect.bottom + 10;
            }

            setStyle({
                top: `${top}px`,
                left: `${left}px`
            });
            setIsVisible(true);
        }
    }, [triggerRect]);

    return (
        <div
            className={`portal-tooltip ${isVisible ? 'visible' : ''}`}
            ref={tooltipRef}
            style={style}
        >
            {content}
        </div>
    );
};

export default Tooltip;
