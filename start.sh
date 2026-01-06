#!/bin/bash

echo "================================================"
echo "Events Platform - Manual Testing Guide"
echo "================================================"
echo ""
echo "⚠️  Prerequisites:"
echo "   - MongoDB must be running"
echo "   - .env file configured with MONGODB_URI"
echo ""
echo "📝 To set up MongoDB:"
echo ""
echo "Option 1: Local MongoDB"
echo "   sudo apt-get install mongodb"
echo "   sudo systemctl start mongodb"
echo ""
echo "Option 2: MongoDB Atlas (Cloud - Recommended)"
echo "   1. Go to https://www.mongodb.com/cloud/atlas"
echo "   2. Create a free cluster"
echo "   3. Get connection string"
echo "   4. Update .env file:"
echo "      MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/events"
echo ""
echo "Option 3: Docker"
echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo ""
echo "================================================"
echo "🚀 Starting the Application"
echo "================================================"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please update MONGODB_URI before running."
    echo ""
fi

# Check if MONGODB_URI is set
if grep -q "localhost:27017" .env; then
    echo "⚠️  Warning: Using default MongoDB URI (localhost:27017)"
    echo "   Make sure MongoDB is running locally."
    echo ""
fi

echo "Starting server..."
npm start
