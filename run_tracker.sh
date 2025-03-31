#!/bin/bash
# This script starts the Student Performance Tracker application

# Kill any existing node processes
pkill -f "node.*app.cjs" || true

# Start the server
echo "Starting Student Performance Tracker..."
cd StudentPerformanceTracker006 && node app.cjs