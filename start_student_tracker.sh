#!/bin/bash
# Script to start the Student Performance Tracker
# This script is compatible with Replit's workflow system

# Ensure environment variables are set
export SUPABASE_URL="https://vydljgeqtdjzjtbwimwe.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNTEyNzUsImV4cCI6MjA1ODYyNzI3NX0.gUunHBcVeuWzpwm6222dI_2K2zK3CCiy-UewEhp848k"
export SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzA1MTI3NSwiZXhwIjoyMDU4NjI3Mjc1fQ.ukEatnwsGTRDP7eMOudIEC5imrH6P48-tmIkeoE2IoY"

# Check for Supabase setup
echo "Checking Supabase setup..."
node check-supabase-setup.js

# Start the application
echo "Starting Student Performance Tracker..."
node app.cjs