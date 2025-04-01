#!/bin/bash

# Student Performance Tracker Launcher
# Author: 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤

# Set terminal colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}=============================================${RESET}"
echo -e "${BLUE}     Student Performance Tracker Launcher    ${RESET}"
echo -e "${BLUE}            Author: 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤             ${RESET}"
echo -e "${BLUE}=============================================${RESET}"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${RESET}"
    exit 1
fi

# Display node version
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js version: ${NODE_VERSION}${RESET}"

# Check if database is available
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}WARNING: DATABASE_URL environment variable is not set.${RESET}"
    echo -e "${YELLOW}Database functionality may not work correctly.${RESET}"
else
    echo -e "${GREEN}Database configuration found.${RESET}"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to start the server
start_server() {
    echo -e "${GREEN}Starting Student Performance Tracker...${RESET}"
    echo -e "${YELLOW}Server will be available at http://localhost:3000${RESET}"
    
    # First try TypeScript version
    echo -e "${BLUE}Attempting to start the TypeScript version...${RESET}"
    if cd StudentPerformanceTracker006 && npm run dev; then
        echo -e "${GREEN}Server started successfully!${RESET}"
    else
        echo -e "${YELLOW}TypeScript version failed to start.${RESET}"
        echo -e "${YELLOW}Falling back to CommonJS version...${RESET}"
        
        # Try fallback CommonJS version
        if cd StudentPerformanceTracker006 && node app.cjs; then
            echo -e "${GREEN}Fallback server started successfully!${RESET}"
        else
            echo -e "${RED}Failed to start both versions of the server.${RESET}"
            echo -e "${RED}Please check the logs for more information.${RESET}"
            exit 1
        fi
    fi
}

# Start the server
start_server