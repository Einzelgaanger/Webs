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

# Start the app using the JavaScript server for better stability
echo "Starting server on port 3000..."
cd StudentPerformanceTracker006
node app.js