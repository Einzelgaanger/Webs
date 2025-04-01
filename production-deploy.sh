#!/bin/bash

# Student Performance Tracker Production Deployment Script
echo "=================================="
echo "Student Performance Tracker - Production Deployment"
echo "=================================="
echo

# Set variables
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${APP_DIR}/production-deploy.log"

# Log function
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Main execution
log "Starting production deployment setup for Student Performance Tracker"

# 1. Check environment variables
log "Checking required environment variables..."

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL environment variable is not set. This is required for connecting to PostgreSQL."
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Make sure to set DATABASE_URL in your hosting environment."
  echo 
  echo "DATABASE_URL format: postgresql://username:password@hostname:port/database"
  exit 1
fi

# Check for SUPABASE environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  log "WARNING: SUPABASE_URL and/or SUPABASE_KEY environment variables are not set."
  log "The application will use the fallback values in supabase.js, but it's recommended to set these in production."
  echo "WARNING: Supabase environment variables not fully configured."
  echo "For production, it's recommended to set SUPABASE_URL and SUPABASE_KEY."
fi

# Check for SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
  log "WARNING: SESSION_SECRET is not set. A default value will be used, but this is not secure for production."
  echo "WARNING: SESSION_SECRET is not set. For security, set a strong, unique session secret in production."
fi

# 2. Prepare the application for production
log "Preparing application for production..."

# Ensure the app directory exists
if [ ! -d "$APP_DIR/StudentPerformanceTracker006" ]; then
  log "ERROR: StudentPerformanceTracker006 directory not found at $APP_DIR"
  echo "ERROR: StudentPerformanceTracker006 directory not found. Deployment failed."
  exit 1
fi

# Ensure app.cjs exists
if [ ! -f "$APP_DIR/StudentPerformanceTracker006/app.cjs" ]; then
  log "ERROR: app.cjs not found in $APP_DIR/StudentPerformanceTracker006"
  echo "ERROR: Main application file (app.cjs) not found. Deployment failed."
  exit 1
fi

# 3. Create uploads directory if it doesn't exist (for fallback if Supabase fails)
mkdir -p "$APP_DIR/uploads/profiles" "$APP_DIR/uploads/files"
log "Created uploads directories for fallback storage"

# 4. Set executable permissions on scripts
find "$APP_DIR" -name "*.sh" -exec chmod +x {} \;
log "Set executable permissions on shell scripts"

# 5. Create a Procfile for hosting platforms that use it (Heroku, etc.)
echo "web: node StudentPerformanceTracker006/app.cjs" > "$APP_DIR/Procfile"
log "Created Procfile for Heroku/similar platforms"

# 6. Success message
log "SUCCESS: Production deployment setup completed"
echo
echo "=================================="
echo "Production deployment setup completed successfully!"
echo "=================================="
echo
echo "🟢 Your application is now ready for deployment."
echo
echo "For most hosting platforms, you'll need to:"
echo "1. Initialize a Git repository if not already done"
echo "2. Connect your repository to your hosting provider"
echo "3. Set the required environment variables in your hosting dashboard"
echo
echo "Required environment variables:"
echo "- DATABASE_URL (PostgreSQL connection string)"
echo "- SUPABASE_URL (Supabase project URL)"
echo "- SUPABASE_KEY (Supabase API key)"
echo "- SESSION_SECRET (Secret for securing session cookies)"
echo "- NODE_ENV=production"
echo
echo "To start your application in production mode, use:"
echo "$ node StudentPerformanceTracker006/app.cjs"
echo
echo "For Heroku or similar platforms, the included Procfile will"
echo "automatically configure the correct start command."
echo "=================================="