#!/bin/bash

# JSPulse Docker Startup Script
# This script helps you start JSPulse with Docker

set -e

echo "🚀 JSPulse Docker Startup Script"
echo "================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📋 Copying docker.env.example to .env..."
    cp docker.env.example .env
    echo "✅ .env file created from template"
    echo ""
    echo "🔧 Please edit .env file with your Firebase configuration:"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_CLIENT_EMAIL" 
    echo "   - FIREBASE_PRIVATE_KEY"
    echo "   - ADMIN_ALLOW_EMAILS"
    echo "   - VITE_FIREBASE_* (for frontend)"
    echo ""
    echo "Press Enter when you're ready to continue..."
    read
fi

# Check if Firebase variables are set
if grep -q "your-project-id" .env; then
    echo "⚠️  Firebase configuration not set in .env file!"
    echo "Please configure Firebase variables before starting."
    exit 1
fi

# Choose mode
echo "Choose startup mode:"
echo "1) Production (optimized, no hot reload)"
echo "2) Development (with hot reload)"
echo "3) Build only (no start)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🏭 Starting in Production mode..."
        docker-compose --profile prod up -d
        echo ""
        echo "✅ JSPulse is running!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend: http://localhost:3001"
        echo "👨‍💼 Admin Panel: http://localhost:3000/admin"
        echo ""
        echo "📊 View logs: docker-compose --profile prod logs -f"
        echo "🛑 Stop: docker-compose --profile prod down"
        ;;
    2)
        echo "🛠️  Starting in Development mode..."
        docker-compose --profile dev up -d
        echo ""
        echo "✅ JSPulse is running in development mode!"
        echo "🌐 Frontend: http://localhost:3000 (with HMR)"
        echo "🔧 Backend: http://localhost:3001 (with hot reload)"
        echo "👨‍💼 Admin Panel: http://localhost:3000/admin"
        echo ""
        echo "📊 View logs: docker-compose --profile dev logs -f"
        echo "🛑 Stop: docker-compose --profile dev down"
        ;;
    3)
        echo "🔨 Building Docker images..."
        docker-compose --profile prod build
        echo "✅ Build completed!"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac
