# Demo Payment Service

Mock payment processing system with OTP verification using microservices architecture.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   FastAPI   │────▶│   MongoDB   │
│  Frontend   │     │   Backend   │     │  Database   │
│   :3000     │     │    :8000    │     │   :27017    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Quick Start

```bash
# Clone and navigate to project
cd "Payment Gateway"

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payment/initiate` | POST | Submit card details, receive OTP |
| `/payment/verify-otp` | POST | Verify OTP, get payment status |

## Testing the Flow

1. Open http://localhost:3000
2. Enter test card: `4111111111111111`, expiry: `12/25`, CVV: `123`
3. Note the OTP displayed (demo only)
4. Enter the OTP to complete payment

## Project Structure

```
Payment Gateway/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── components/   # React components
│   │   └── index.css     # Styling
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Notes

⚠️ **This is a demo system only** - No real payment processing occurs. The OTP is returned in the API response for testing convenience.
