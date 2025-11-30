import React from 'react';
import './Notification.css';

const NotificationContainer = ({ notifications }) => {
    return (
        <div className="notification-container">
            {notifications.map((note) => (
                <div key={note.id} className={`notification ${note.fading ? 'fading-out' : ''} ${note.risk ? `risk-${note.risk}` : ''}`}>
                    <div className="notification-content">
                        {note.text}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;
