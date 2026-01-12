"""
Demo Payment Service - FastAPI Backend
Handles payment initiation and OTP verification
"""

import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Demo Payment Service",
    description="Mock payment processing with OTP verification",
    version="1.0.0"
)

# CORS configuration for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
client = MongoClient(MONGO_URI)
db = client["payment_db"]
otp_collection = db["otp_sessions"]

# OTP expiration time in minutes
OTP_EXPIRY_MINUTES = 2


# ============= Pydantic Models =============

class CardDetails(BaseModel):
    """Request model for payment initiation"""
    card_number: str
    expiry: str  # Format: MM/YY
    cvv: str
    holder_name: str

    @validator("card_number")
    def validate_card_number(cls, v):
        # Remove spaces and validate length (13-19 digits for most cards)
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.isdigit():
            raise ValueError("Card number must contain only digits")
        if not (13 <= len(cleaned) <= 19):
            raise ValueError("Card number must be 13-19 digits")
        return cleaned

    @validator("expiry")
    def validate_expiry(cls, v):
        # Validate MM/YY format
        if "/" not in v:
            raise ValueError("Expiry must be in MM/YY format")
        parts = v.split("/")
        if len(parts) != 2:
            raise ValueError("Expiry must be in MM/YY format")
        month, year = parts
        if not (month.isdigit() and year.isdigit()):
            raise ValueError("Expiry must contain only digits")
        if not (1 <= int(month) <= 12):
            raise ValueError("Month must be between 01 and 12")
        return v

    @validator("cvv")
    def validate_cvv(cls, v):
        # CVV should be 3-4 digits
        if not v.isdigit():
            raise ValueError("CVV must contain only digits")
        if not (3 <= len(v) <= 4):
            raise ValueError("CVV must be 3-4 digits")
        return v


class OtpVerification(BaseModel):
    """Request model for OTP verification"""
    session_id: str
    otp: str


class InitiateResponse(BaseModel):
    """Response model for payment initiation"""
    success: bool
    message: str
    session_id: str
    otp: str  # Returned for demo purposes only


class VerifyResponse(BaseModel):
    """Response model for OTP verification"""
    success: bool
    status: str  # payment_success or payment_failed
    message: str


# ============= Helper Functions =============

def generate_session_id() -> str:
    """Generate a unique session ID"""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=16))


def generate_otp() -> str:
    """Generate a random 6-digit OTP"""
    return "".join(random.choices(string.digits, k=6))


# ============= API Endpoints =============

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Demo Payment Service"}


@app.post("/payment/initiate", response_model=InitiateResponse)
async def initiate_payment(card: CardDetails):
    """
    Initiate a payment request.
    
    - Validates card details
    - Generates OTP and session ID
    - Stores OTP in MongoDB with expiration
    - Returns OTP in response (for demo purposes)
    """
    try:
        # Generate session ID and OTP
        session_id = generate_session_id()
        otp = generate_otp()
        
        # Calculate expiration time
        expiry_time = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Store OTP session in MongoDB
        otp_doc = {
            "session_id": session_id,
            "otp": otp,
            "card_last_four": card.card_number[-4:],
            "holder_name": card.holder_name,
            "created_at": datetime.utcnow(),
            "expires_at": expiry_time,
            "verified": False
        }
        otp_collection.insert_one(otp_doc)
        
        return InitiateResponse(
            success=True,
            message=f"OTP generated. Valid for {OTP_EXPIRY_MINUTES} minutes.",
            session_id=session_id,
            otp=otp  # Returned for demo - in production, send via SMS/email
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/payment/verify-otp", response_model=VerifyResponse)
async def verify_otp(data: OtpVerification):
    """
    Verify the OTP for a payment session.
    
    - Checks if session exists and OTP matches
    - Validates OTP hasn't expired
    - Invalidates OTP after verification attempt
    - Returns payment_success or payment_failed
    """
    try:
        # Find the OTP session
        session = otp_collection.find_one({
            "session_id": data.session_id,
            "verified": False
        })
        
        if not session:
            return VerifyResponse(
                success=False,
                status="payment_failed",
                message="Invalid or expired session"
            )
        
        # Check if OTP has expired
        if datetime.utcnow() > session["expires_at"]:
            # Mark as expired
            otp_collection.update_one(
                {"session_id": data.session_id},
                {"$set": {"verified": True, "expired": True}}
            )
            return VerifyResponse(
                success=False,
                status="payment_failed",
                message="OTP has expired. Please initiate a new payment."
            )
        
        # Verify OTP
        if session["otp"] == data.otp:
            # Mark as verified (invalidate OTP)
            otp_collection.update_one(
                {"session_id": data.session_id},
                {"$set": {"verified": True, "verified_at": datetime.utcnow()}}
            )
            return VerifyResponse(
                success=True,
                status="payment_success",
                message="Payment verified successfully!"
            )
        else:
            # Wrong OTP - still invalidate to prevent brute force
            otp_collection.update_one(
                {"session_id": data.session_id},
                {"$set": {"verified": True, "failed": True}}
            )
            return VerifyResponse(
                success=False,
                status="payment_failed",
                message="Invalid OTP. Payment failed."
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
