#!/bin/bash

# Set up environment
export PATH=$PATH:/home/runner/.nix-profile/bin:/nix/var/nix/profiles/default/bin

# Clean up any existing processes
pkill -f "node .*app\.cjs" || true

# Navigate to the project directory
cd StudentPerformanceTracker006

# Start the application with proper error handling
echo "Starting the Student Performance Tracker..."

# Try to find node executable
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  echo "Node.js not found in PATH"
  exit 1
fi

# Run the application
$NODE_PATH app.cjs