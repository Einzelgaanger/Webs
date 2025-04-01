#!/bin/bash

# Make this script executable
chmod +x "$0"

# Set variables
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${APP_DIR}/app.log"

# Log function
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Main execution
log "-------------------------------------------"
log "Starting Student Performance Tracker Launcher"
log "-------------------------------------------"

# Check if we're in Replit environment
if [ -n "$REPL_ID" ]; then
  log "Running in Replit environment"
  
  # Kill any existing server processes
  log "Checking for existing server processes..."
  NODEJS_PIDS=$(pgrep -f "node.*app.cjs" || true)
  if [ -n "$NODEJS_PIDS" ]; then
    log "Found Node.js processes: $NODEJS_PIDS"
    for pid in $NODEJS_PIDS; do
      log "Killing process $pid"
      kill "$pid" 2>/dev/null || true
    done
  else
    log "No existing Node.js server processes found"
  fi
  
  # Start the server
  log "Starting Student Performance Tracker"
  NODEJS_VERSION=$(node --version)
  log "Using Node.js ${NODEJS_VERSION}"
  
  # Use absolute path for app.cjs
  cd "$APP_DIR/StudentPerformanceTracker006"
  log "Starting server in ${PWD}"
  
  if [ -f "app.cjs" ]; then
    log "Using app.cjs for fallback server"
    node app.cjs > ../server_output.log 2>&1 &
    SERVER_PID=$!
    log "Server started with PID: $SERVER_PID"
    
    # Wait for server to start
    sleep 3
    if ps -p "$SERVER_PID" > /dev/null; then
      log "Server is running successfully"
      echo "Student Performance Tracker started on port 3000"
      echo "Access the application at: http://localhost:3000/"
    else
      log "Server failed to start. Check logs at server_output.log"
      echo "Server failed to start. Check logs."
    fi
  else
    log "ERROR: app.cjs not found in ${PWD}"
    echo "Error: Server files not found."
  fi
else
  log "Not running in Replit environment, opening launcher.html"
  # Not in Replit, just open the launcher HTML
  if command -v xdg-open &> /dev/null; then
    xdg-open "$APP_DIR/launcher.html"
  elif command -v open &> /dev/null; then
    open "$APP_DIR/launcher.html"
  else
    echo "Please open launcher.html in your web browser."
  fi
fi