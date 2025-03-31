#!/bin/bash

# Start the server with the wrapper script
echo "Starting Student Performance Tracker server..."
cd StudentPerformanceTracker006
node start-wrapper.cjs &
SERVER_PID=$!

# Function to handle shutdown
cleanup() {
  echo "Shutting down server..."
  kill $SERVER_PID
  exit 0
}

# Set up trap for graceful shutdown
trap cleanup SIGINT SIGTERM

# Keep script running
echo "Server started on http://localhost:3000"
echo "Press Ctrl+C to stop"
wait