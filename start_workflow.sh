#!/bin/bash

# This script starts the Student Performance Tracker
# as a workflow in a controlled way with proper setup verification

# Set up variables
PORT=3000
APP_PATH="app.cjs"

# Define color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    Student Performance Tracker ${NC}"
echo -e "${BLUE}    Developed by 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤 ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env file...${NC}"
  export $(cat .env | xargs)
  echo -e "${GREEN}Environment variables loaded.${NC}"
else
  echo -e "${YELLOW}WARNING: No .env file found. Using system environment variables.${NC}"
fi

# Check database connection
echo -e "${BLUE}Checking database connection...${NC}"
if [[ -z "${DATABASE_URL}" ]]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable is not set.${NC}"
  echo -e "${RED}The application requires a PostgreSQL database to function correctly.${NC}"
  exit 1
fi

echo -e "${GREEN}Database URL is configured.${NC}"

# Check Supabase configuration
echo -e "${BLUE}Checking Supabase configuration...${NC}"
if [[ -z "${SUPABASE_URL}" || -z "${SUPABASE_KEY}" ]]; then
  echo -e "${YELLOW}WARNING: Supabase environment variables (SUPABASE_URL and/or SUPABASE_KEY) are not set.${NC}"
  echo -e "${YELLOW}File uploads and profile images may not work correctly.${NC}"
else
  echo -e "${GREEN}Supabase configuration found.${NC}"
fi

# Run Supabase check
echo -e "${BLUE}Verifying Supabase setup...${NC}"
node check-supabase-setup.js
SUPABASE_CHECK=$?

if [ $SUPABASE_CHECK -eq 0 ]; then
  echo -e "${GREEN}Supabase is properly configured.${NC}"
else
  echo -e "${YELLOW}WARNING: Supabase verification failed. File uploads may not work.${NC}"
  echo -e "${YELLOW}The application will continue to run, but with limited functionality.${NC}"
fi

echo -e "${BLUE}Starting the server...${NC}"
echo -e "${GREEN}Server will be available at http://localhost:${PORT}${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the app.cjs server
node $APP_PATH