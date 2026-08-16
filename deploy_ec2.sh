#!/bin/bash
# TrafficVision AI - AWS EC2 Automated Deployment Script
# This script automates installing Docker, configuring public IP redirection, and starting containers.

set -e

echo "========================================================="
echo "🚦 TrafficVision AI - AWS EC2 Deployer"
echo "========================================================="

# 1. Update system libraries
echo "Updating package repository index..."
sudo apt-get update -y

# 2. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker engine..."
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    # Add current user to docker group to avoid requiring 'sudo' for docker commands
    sudo usermod -aG docker $USER
else
    echo "Docker engine already installed."
fi

# 3. Install Docker Compose if missing
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose utility..."
    sudo apt-get install -y docker-compose
else
    echo "Docker Compose utility already installed."
fi

# 4. Prepare Environment
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Query AWS Metadata service to auto-detect EC2 Public IP address
    # Fallback to general public ip service if metadata lookup is disabled/tokenized
    echo "Detecting EC2 Public IPv4..."
    PUBLIC_IP=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s ifconfig.me || echo "localhost")
    echo "Detected Public IP: $PUBLIC_IP"
    
    # Replace default localhost API URL with the public IP address in the built frontend
    sed -i "s|VITE_API_URL=http://localhost:8000|VITE_API_URL=http://$PUBLIC_IP:8000|g" .env
    
    echo "---------------------------------------------------------"
    echo "⚠️  CRITICAL REQUIREMENT:"
    echo "Please configure your TomTom / Resend keys inside '.env'!"
    echo "Open settings by running: nano .env"
    echo "---------------------------------------------------------"
else
    echo ".env file already exists, skipping template copy."
fi

# 5. Build and run containers
echo "Building and starting containerized services..."
sudo docker-compose build
sudo docker-compose up -d

echo "========================================================="
echo "🎉 TrafficVision AI has been successfully launched!"
echo "========================================================="
echo "You can access your deployment at:"
echo "👉 Frontend Web App: http://$(curl -s ifconfig.me || echo '<your-ec2-ip>')"
echo "👉 Backend API Docs: http://$(curl -s ifconfig.me || echo '<your-ec2-ip>'):8000/docs"
echo "========================================================="
