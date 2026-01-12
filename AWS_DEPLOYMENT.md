# AWS EC2 Deployment Guide - Payment Gateway

Complete step-by-step guide for deploying the Demo Payment Service on AWS EC2.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Security Group Configuration](#1-aws-security-group-configuration)
3. [Connect to EC2 Instance](#2-connect-to-ec2-instance)
4. [Install Docker & Docker Compose](#3-install-docker--docker-compose)
5. [Deploy the Application](#4-deploy-the-application)
6. [Verify Deployment](#5-verify-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Production Considerations](#production-considerations)

---

## Prerequisites

Before starting, ensure you have:
- [ ] An AWS EC2 instance running (Amazon Linux 2023 or Ubuntu 22.04 recommended)
- [ ] SSH access to the instance (key pair configured)
- [ ] The instance's **Public IPv4 address** or **Public DNS**
- [ ] Git installed on the instance

---

## 1. AWS Security Group Configuration

> ⚠️ **IMPORTANT**: This is the most common reason for "works locally but not globally" issues!

### Open Required Ports

Go to **AWS Console → EC2 → Instances → Select Your Instance → Security → Security Groups**

Click on the Security Group and **Edit Inbound Rules**. Add these rules:

| Type        | Protocol | Port Range | Source      | Description        |
|-------------|----------|------------|-------------|--------------------|
| SSH         | TCP      | 22         | Your IP     | SSH access         |
| Custom TCP  | TCP      | 3000       | 0.0.0.0/0   | Frontend (React)   |
| Custom TCP  | TCP      | 8000       | 0.0.0.0/0   | Backend API (optional) |

> 💡 **TIP**: Port 8000 is optional if you're only accessing the API through the nginx proxy (port 3000).

### Verify Rules

After adding, your inbound rules should look like:
```
Type          Port    Source
─────────────────────────────
SSH           22      <Your IP>/32
Custom TCP    3000    0.0.0.0/0
Custom TCP    8000    0.0.0.0/0
```

---

## 2. Connect to EC2 Instance

### Using SSH (Linux/Mac/Windows Terminal)

```bash
# Make sure your key file has correct permissions
chmod 400 your-key.pem

# Connect to EC2
ssh -i "your-key.pem" ec2-user@<EC2_PUBLIC_IP>
# or for Ubuntu
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

### Using AWS Session Manager (Alternative)
If you have SSM configured, you can connect via AWS Console without SSH keys.

---

## 3. Install Docker & Docker Compose

### For Amazon Linux 2023

```bash
# Update system packages
sudo dnf update -y

# Install Docker
sudo dnf install docker -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (avoid using sudo for docker commands)
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Apply group changes (log out and back in, or run)
newgrp docker

# Verify installation
docker --version
docker compose version
```

### For Ubuntu 22.04

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 4. Deploy the Application

### Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repo URL)
git clone <YOUR_REPOSITORY_URL> payment-gateway
cd payment-gateway
```

### Or Transfer Files Manually

If not using Git, upload files using SCP:

```bash
# From your local machine
scp -i "your-key.pem" -r "payment-gateway" ec2-user@<EC2_PUBLIC_IP>:~/payment-gateway
```

### Build and Start Containers

```bash
# Navigate to project directory
cd ~/payment-gateway

# Build and start all services
docker compose up --build -d

# Check container status
docker compose ps
```

Expected output:
```
NAME                IMAGE                    STATUS
payment-frontend    payment-gateway-frontend   Up
payment-backend     payment-gateway-backend    Up
payment-mongodb     mongo:7.0                  Up (healthy)
```

---

## 5. Verify Deployment

### Test from EC2 (Internal)

```bash
# Test backend health
curl http://localhost:8000/
# Expected: {"status":"healthy","service":"Demo Payment Service"}

# Test frontend
curl -I http://localhost:3000/
# Expected: HTTP/1.1 200 OK

# Test API via nginx proxy
curl http://localhost:3000/api/
# Expected: {"status":"healthy","service":"Demo Payment Service"}
```

### Test from Browser (External)

Open in your browser:
- **Frontend**: `http://<EC2_PUBLIC_IP>:3000`
- **Backend API Docs**: `http://<EC2_PUBLIC_IP>:8000/docs`
- **API via Proxy**: `http://<EC2_PUBLIC_IP>:3000/api/`

### Complete Payment Test Flow

1. Open `http://<EC2_PUBLIC_IP>:3000`
2. Enter test card details:
   - Card Number: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - Name: `Test User`
3. Click "Pay Now"
4. Note the OTP displayed
5. Enter the OTP and click "Verify"
6. Confirm "Payment Successful" message

---

## Troubleshooting

### Container Issues

```bash
# View container logs
docker compose logs -f

# View specific container logs
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mongodb

# Restart containers
docker compose restart

# Rebuild and restart
docker compose down
docker compose up --build -d
```

### "Connection Refused" Errors

1. **Check Security Group** - Most common issue!
   ```
   AWS Console → EC2 → Security Groups → Verify ports 3000, 8000 are open
   ```

2. **Check containers are running**
   ```bash
   docker compose ps
   ```

3. **Check if port is listening**
   ```bash
   sudo ss -tlnp | grep -E '3000|8000'
   ```

### CORS Errors in Browser Console

The backend is configured to allow all origins. If you see CORS errors:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Verify you're accessing via the public IP, not localhost

### MongoDB Connection Errors

```bash
# Check MongoDB container health
docker compose logs mongodb

# Verify MongoDB is healthy
docker compose ps | grep mongodb
# Should show "healthy" status
```

### Firewall Issues (EC2 Instance Level)

Some AMIs have a local firewall. Check and allow ports:

```bash
# For firewalld (Amazon Linux)
sudo systemctl status firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# For ufw (Ubuntu)
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

---

## Production Considerations

### Use a Domain Name

Instead of accessing via IP, configure a domain:

1. Get a domain from Route 53 or another registrar
2. Create an A record pointing to your EC2 public IP
3. Access via `http://yourdomain.com:3000`

### Enable HTTPS with SSL/TLS

For production, always use HTTPS:

1. Get an SSL certificate (Let's Encrypt is free)
2. Update nginx.conf to listen on port 443
3. Update Security Group to allow port 443

Example nginx SSL configuration:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

### Use an Elastic IP

To keep the same IP after instance restarts:
1. Allocate an Elastic IP in AWS Console
2. Associate it with your EC2 instance

### Set Up Monitoring

```bash
# View real-time logs
docker compose logs -f

# Monitor container resources
docker stats
```

### Backup MongoDB Data

```bash
# Create backup
docker exec payment-mongodb mongodump --out /data/backup

# Copy backup to host
docker cp payment-mongodb:/data/backup ./mongodb-backup
```

---

## Quick Reference Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild and start
docker compose up --build -d

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart a specific service
docker compose restart frontend

# Remove all data and start fresh
docker compose down -v
docker compose up --build -d
```

---

## Architecture Diagram

```
Internet
    │
    ▼
┌───────────────────── AWS EC2 Instance ─────────────────────┐
│                                                             │
│   ┌─────────────────┐    /api/*    ┌─────────────────┐    │
│   │    Frontend     │─────────────→│    Backend      │    │
│   │  (Nginx + React)│              │   (FastAPI)     │    │
│   │    Port 3000    │              │   Port 8000     │    │
│   └─────────────────┘              └────────┬────────┘    │
│                                              │             │
│                                              ▼             │
│                                    ┌─────────────────┐    │
│                                    │    MongoDB      │    │
│                                    │   Port 27017    │    │
│                                    └─────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Support

If you encounter issues not covered in this guide:
1. Check container logs: `docker compose logs -f`
2. Verify AWS Security Group settings
3. Ensure EC2 instance has public IP enabled
4. Check if using the correct Public IP (not Private IP)
