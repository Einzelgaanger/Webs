#!/bin/bash

# Make this script executable
chmod +x "$0"

# Set variables
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${APP_DIR}/server.log"
SERVER_LOG="${APP_DIR}/server_output.log"
SERVER_PID_FILE="${APP_DIR}/.server.pid"

# Log function
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Kill any existing server instances
kill_server() {
  log "Checking for existing server processes..."
  if [ -f "$SERVER_PID_FILE" ]; then
    OLD_PID=$(cat "$SERVER_PID_FILE")
    if ps -p "$OLD_PID" > /dev/null; then
      log "Killing existing server process (PID: $OLD_PID)"
      kill "$OLD_PID" 2>/dev/null || true
      sleep 1
      # Force kill if still running
      if ps -p "$OLD_PID" > /dev/null; then
        log "Force killing server process"
        kill -9 "$OLD_PID" 2>/dev/null || true
      fi
    else
      log "No active server found with PID $OLD_PID"
    fi
    rm -f "$SERVER_PID_FILE"
  else
    log "No PID file found, checking for Node.js processes..."
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
  fi
}

# Export environment variables
export_env_vars() {
  log "Setting up environment variables..."
  # Already set by Replit
  export PORT=3000
  export HOST="0.0.0.0"
  
  log "Environment variables set"
}

# Start the server
start_server() {
  cd "$APP_DIR" || exit 1
  
  log "Starting Student Performance Tracker"
  log "Using Node.js $(node --version)"
  log "Server will be available at http://0.0.0.0:3000"
  
  # Start the server in the background
  node "$APP_DIR/app.cjs" > "$SERVER_LOG" 2>&1 &
  
  # Save the PID
  SERVER_PID=$!
  echo $SERVER_PID > "$SERVER_PID_FILE"
  
  log "Server started with PID: $SERVER_PID"
  log "Logs available at $SERVER_LOG"
  
  # Check if the server started successfully
  sleep 2
  if ps -p "$SERVER_PID" > /dev/null; then
    log "Server is running successfully"
    echo "Server started successfully. Access at http://0.0.0.0:3000"
  else
    log "Server failed to start. Check logs at $SERVER_LOG"
    echo "Server failed to start. Check logs at $SERVER_LOG"
    exit 1
  fi
}

# Main execution
main() {
  log "-------------------------------------------"
  log "Starting Student Performance Tracker Script"
  log "-------------------------------------------"
  
  # Kill any existing server processes
  kill_server
  
  # Export environment variables
  export_env_vars
  
  # Start the server
  start_server
}

# Run the main function
main