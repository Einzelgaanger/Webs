#!/bin/bash

# Stop any running node processes
pkill -f node || true

# Make sure the application directories exist
mkdir -p StudentPerformanceTracker006/uploads/profiles
mkdir -p StudentPerformanceTracker006/uploads/notes
mkdir -p StudentPerformanceTracker006/uploads/assignments

# Navigate to application directory and start the server
cd StudentPerformanceTracker006
node app.cjs &

# Wait a bit for the server to start
sleep 2

# Check if the server is running
if pgrep -f "node app.cjs" > /dev/null
then
  echo "Server is running."
  echo "You can access it at: http://localhost:3000"
else
  echo "Failed to start the server."
fi