#!/bin/bash

# Kill any existing node processes
pkill -f "node" || true

# Wait a moment for processes to terminate
sleep 1

# Display start message
echo "----------------------------------------"
echo "Starting Student Performance Tracker..."
echo "----------------------------------------"

# Make sure uploads directory exists
mkdir -p uploads
mkdir -p uploads/profiles
mkdir -p uploads/files

# Start the app using npm
echo "Starting server with npm dev..."
cd StudentPerformanceTracker006
npm run dev