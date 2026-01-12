/**
 * CardForm Component
 * Credit card input form with validation
 */

import React, { useState } from 'react';

function CardForm({ onSubmit, loading, error }) {
    // Form state
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [holderName, setHolderName] = useState('');

    /**
     * Format card number with spaces every 4 digits
     */
    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : '';
    };

    /**
     * Format expiry as MM/YY
     */
    const formatExpiry = (value) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare data for API
        onSubmit({
            card_number: cardNumber.replace(/\s/g, ''),
            expiry: expiry,
            cvv: cvv,
            holder_name: holderName
        });
    };

    /**
     * Get masked card number for visual preview
     */
    const getMaskedNumber = () => {
        const cleaned = cardNumber.replace(/\s/g, '');
        if (cleaned.length > 4) {
            return '•••• •••• •••• ' + cleaned.slice(-4);
        }
        return '•••• •••• •••• ••••';
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Card Visual Preview */}
            <div className="card-icon">
                <div className="card-visual">
                    <div className="card-chip"></div>
                    <div className="card-number-preview">{getMaskedNumber()}</div>
                    <div className="card-details-preview">
                        <span>{holderName || 'YOUR NAME'}</span>
                        <span>{expiry || 'MM/YY'}</span>
                    </div>
                </div>
            </div>

            {/* Card Number Input */}
            <div className="form-group">
                <label className="form-label" htmlFor="cardNumber">Card Number</label>
                <input
                    id="cardNumber"
                    type="text"
                    className="form-input"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                    autoComplete="cc-number"
                />
            </div>

            {/* Cardholder Name */}
            <div className="form-group">
                <label className="form-label" htmlFor="holderName">Cardholder Name</label>
                <input
                    id="holderName"
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                    required
                    autoComplete="cc-name"
                />
            </div>

            {/* Expiry and CVV Row */}
            <div className="input-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="expiry">Expiry Date</label>
                    <input
                        id="expiry"
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        required
                        autoComplete="cc-exp"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="cvv">CVV</label>
                    <input
                        id="cvv"
                        type="password"
                        className="form-input"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        required
                        autoComplete="cc-csc"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && <p className="error-text">{error}</p>}

            {/* Submit Button */}
            <button
                type="submit"
                className="btn-primary"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        Processing...
                    </>
                ) : (
                    'Pay Now →'
                )}
            </button>
        </form>
    );
}

export default CardForm;
