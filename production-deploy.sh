#!/bin/bash
# Production Deployment Script for Student Performance Tracker
# This script is executed by Render when deploying the application

set -e  # Exit on any error

echo "Starting production deployment process..."

# 1. Verify environment variables exist
if [[ -z "${NODE_ENV}" || -z "${SESSION_SECRET}" || -z "${DATABASE_URL}" || -z "${SUPABASE_URL}" || -z "${SUPABASE_KEY}" ]]; then
  echo "ERROR: Required environment variables are missing!"
  echo "Please ensure the following are set: NODE_ENV, SESSION_SECRET, DATABASE_URL, SUPABASE_URL, SUPABASE_KEY"
  exit 1
fi

echo "Environment variables verified..."

# 2. Check Supabase configuration
echo "Checking Supabase setup..."
node check-supabase-setup.js
if [ $? -ne 0 ]; then
  echo "WARNING: Supabase setup issues detected. Check bucket configuration."
fi

# 3. Initialize database (will run migrations if needed)
echo "Initializing database..."
if [ ! -d "./node_modules/drizzle-orm" ]; then
  echo "Installing Drizzle ORM for database migrations..."
  npm install drizzle-orm
fi

# 4. Run database setup script
echo "Setting up database tables..."
NODE_ENV=production node -e "
  const { initializeDatabase } = require('./StudentPerformanceTracker006/server/init-db.js');
  initializeDatabase().then(() => {
    console.log('Database initialization complete');
  }).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
"

# 5. Set up required directories
echo "Creating required directories..."
mkdir -p uploads
mkdir -p uploads/profiles
mkdir -p uploads/files
chmod -R 755 uploads

# 6. Start the server
echo "Starting the server..."
node StudentPerformanceTracker006/server/app.js