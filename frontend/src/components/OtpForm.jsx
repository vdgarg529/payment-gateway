/**
 * OtpForm Component
 * OTP input form with individual digit inputs
 */

import React, { useState, useRef, useEffect } from 'react';

function OtpForm({ otp, onSubmit, onBack, loading, error }) {
    // OTP digits state (6 individual inputs)
    const [digits, setDigits] = useState(['', '', '', '', '', '']);

    // Refs for input navigation
    const inputRefs = useRef([]);

    /**
     * Focus first input on mount
     */
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    /**
     * Handle digit input change
     */
    const handleChange = (index, value) => {
        // Only allow single digit
        if (value.length > 1) {
            value = value.slice(-1);
        }

        // Only allow numbers
        if (value && !/^\d$/.test(value)) {
            return;
        }

        // Update digit
        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    /**
     * Handle backspace navigation
     */
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    /**
     * Handle paste for full OTP
     */
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newDigits = [...digits];
        pasted.split('').forEach((char, i) => {
            if (i < 6) newDigits[i] = char;
        });
        setDigits(newDigits);

        // Focus last filled or next empty
        const lastIndex = Math.min(pasted.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    /**
     * Handle form submission
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        const fullOtp = digits.join('');
        if (fullOtp.length === 6) {
            onSubmit(fullOtp);
        }
    };

    const isComplete = digits.every(d => d !== '');

    return (
        <form onSubmit={handleSubmit}>
            {/* OTP Display (for demo purposes) */}
            <div className="otp-display">
                <p className="label">Your OTP Code (Demo Only)</p>
                <p className="code">{otp}</p>
            </div>

            {/* OTP Input Fields */}
            <div className="otp-input-container" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        type="text"
                        className="otp-input-single"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        ref={(el) => inputRefs.current[index] = el}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                    />
                ))}
            </div>

            {/* Error Display */}
            {error && <p className="error-text">{error}</p>}

            {/* Submit Button */}
            <button
                type="submit"
                className="btn-primary"
                disabled={loading || !isComplete}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Verifying...
                    </>
                ) : (
                    'Verify OTP →'
                )}
            </button>

            {/* Back Button */}
            <button
                type="button"
                className="btn-secondary"
                onClick={onBack}
                disabled={loading}
            >
                ← Back to Card Details
            </button>
        </form>
    );
}

export default OtpForm;
