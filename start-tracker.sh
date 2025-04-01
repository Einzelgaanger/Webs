#!/bin/bash
# Student Performance Tracker Launcher
# This script provides a centralized way to start the application
# with proper error handling and database verification

set -e  # Exit on any error

echo "Starting Student Performance Tracker..."

# Check if the database is available
if [[ -z "${DATABASE_URL}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Please set up the PostgreSQL database first."
  exit 1
fi

# Define color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase configuration is available
if [[ -z "${SUPABASE_URL}" || -z "${SUPABASE_KEY}" ]]; then
  echo -e "${YELLOW}WARNING: Supabase environment variables (SUPABASE_URL and/or SUPABASE_KEY) are not set.${NC}"
  echo -e "${YELLOW}File uploads and profile images may not work correctly.${NC}"
else
  # Check Supabase setup
  echo -e "${BLUE}Checking Supabase configuration...${NC}"
  node check-supabase-setup.js || {
    echo -e "${YELLOW}WARNING: Supabase setup verification failed. File uploads may not work correctly.${NC}"
    echo -e "${YELLOW}Continuing with application startup anyway...${NC}"
  }
fi

# Start the server
echo -e "${BLUE}Starting the server...${NC}"
echo -e "${GREEN}Server will be available at http://localhost:3000${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Choose the correct server to start
# First try the deployment-ready app.cjs
if [[ -f "app.cjs" ]]; then
  echo -e "${BLUE}Running deployment-ready server...${NC}"
  node app.cjs
# Then try the simple app.js Express server
elif [[ -f "StudentPerformanceTracker006/app.js" ]]; then
  echo -e "${BLUE}Running Express server...${NC}"
  node StudentPerformanceTracker006/app.js
else
  # Try the enhanced server as fallback
  echo -e "${YELLOW}Simple server not found, trying enhanced server...${NC}"
  if [[ -f "StudentPerformanceTracker006/server/app.js" ]]; then
    echo -e "${BLUE}Running JavaScript enhanced server...${NC}"
    node StudentPerformanceTracker006/server/app.js
  elif [[ -f "StudentPerformanceTracker006/server/app.ts" ]]; then
    echo -e "${YELLOW}WARNING: TypeScript server requires additional setup.${NC}"
    echo -e "${YELLOW}Attempting to run anyway, but may fail due to missing dependencies.${NC}"
    npx tsx StudentPerformanceTracker006/server/app.ts
  else
    echo -e "${RED}ERROR: Server file not found!${NC}"
    echo -e "${RED}Please make sure the application is properly set up.${NC}"
    exit 1
  fi
fi