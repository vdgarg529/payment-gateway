/**
 * Demo Payment Service - Main Application
 * Handles payment flow with OTP verification
 */

import React, { useState } from 'react';
import CardForm from './components/CardForm';
import OtpForm from './components/OtpForm';
import StatusMessage from './components/StatusMessage';

// API base URL - uses environment variable or defaults to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Application states
const STATES = {
    CARD_INPUT: 'card_input',
    OTP_INPUT: 'otp_input',
    SUCCESS: 'success',
    FAILED: 'failed'
};

function App() {
    // Current step in the payment flow
    const [currentState, setCurrentState] = useState(STATES.CARD_INPUT);

    // Session data from payment initiation
    const [sessionData, setSessionData] = useState(null);

    // Loading state for API calls
    const [loading, setLoading] = useState(false);

    // Error message display
    const [error, setError] = useState('');

    /**
     * Handle payment initiation
     * Sends card details to backend, receives OTP and session ID
     */
    const handlePaymentInitiate = async (cardDetails) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/payment/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardDetails),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store session data and move to OTP input
                setSessionData({
                    sessionId: data.session_id,
                    otp: data.otp, // Displayed for demo purposes
                    message: data.message
                });
                setCurrentState(STATES.OTP_INPUT);
            } else {
                // Handle validation errors
                setError(data.detail || 'Failed to initiate payment');
            }
        } catch (err) {
            setError('Network error. Please check if the server is running.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle OTP verification
     * Sends OTP to backend for validation
     */
    const handleOtpVerify = async (otp) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/payment/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionData.sessionId,
                    otp: otp
                }),
            });

            const data = await response.json();

            if (data.status === 'payment_success') {
                setCurrentState(STATES.SUCCESS);
            } else {
                setCurrentState(STATES.FAILED);
                setError(data.message);
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset flow to start a new payment
     */
    const handleReset = () => {
        setCurrentState(STATES.CARD_INPUT);
        setSessionData(null);
        setError('');
    };

    /**
     * Go back to card input from OTP step
     */
    const handleBack = () => {
        setCurrentState(STATES.CARD_INPUT);
        setError('');
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="header">
                <h1>💳 Payment Gateway</h1>
                <p>Demo payment service with OTP verification</p>
            </header>

            {/* Main Card */}
            <div className="card">
                {/* Card Input Step */}
                {currentState === STATES.CARD_INPUT && (
                    <CardForm
                        onSubmit={handlePaymentInitiate}
                        loading={loading}
                        error={error}
                    />
                )}

                {/* OTP Input Step */}
                {currentState === STATES.OTP_INPUT && (
                    <OtpForm
                        otp={sessionData?.otp}
                        onSubmit={handleOtpVerify}
                        onBack={handleBack}
                        loading={loading}
                        error={error}
                    />
                )}

                {/* Success State */}
                {currentState === STATES.SUCCESS && (
                    <StatusMessage
                        type="success"
                        title="Payment Successful!"
                        message="Your transaction has been completed successfully."
                        onReset={handleReset}
                    />
                )}

                {/* Failed State */}
                {currentState === STATES.FAILED && (
                    <StatusMessage
                        type="error"
                        title="Payment Failed"
                        message={error || "Transaction could not be completed."}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
