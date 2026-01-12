/**
 * StatusMessage Component
 * Displays success or failure status with animated icons
 */

import React from 'react';

function StatusMessage({ type, title, message, onReset }) {
    const isSuccess = type === 'success';

    return (
        <div className="status-message">
            {/* Animated Icon */}
            <div className={`status-icon ${type}`}>
                {isSuccess ? '✓' : '✕'}
            </div>

            {/* Title */}
            <h2 className={`status-title ${type}`}>
                {title}
            </h2>

            {/* Message */}
            <p className="status-description">
                {message}
            </p>

            {/* Reset Button */}
            <button
                className="btn-primary"
                onClick={onReset}
            >
                {isSuccess ? 'Make Another Payment' : 'Try Again'}
            </button>
        </div>
    );
}

export default StatusMessage;
