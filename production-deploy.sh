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

# 4. Fix path-to-regexp issues
echo "Fixing path-to-regexp issues..."
if [[ -f "fix-path-to-regexp.js" ]]; then
  echo "Running fix-path-to-regexp.js script..."
  node fix-path-to-regexp.js
  if [ $? -ne 0 ]; then
    echo "WARNING: Failed to fix path-to-regexp issues. The application may encounter routing errors."
  else
    echo "Successfully fixed path-to-regexp issues."
  fi
else
  echo "No fix-path-to-regexp.js script found. Skipping path-to-regexp fix."
  
  # Create a simple inline fix if the script doesn't exist
  echo "Attempting inline path-to-regexp fix..."
  
  # Try to find the path-to-regexp file
  PTR_FILE=$(find . -path "*/node_modules/*/path-to-regexp/*/index.js" -type f | head -n 1)
  
  if [[ -n "$PTR_FILE" ]]; then
    echo "Found path-to-regexp file at $PTR_FILE"
    
    # Create a backup
    cp "$PTR_FILE" "${PTR_FILE}.bak"
    
    # Apply simple inline fix - replace the error with escape handling
    sed -i 's/throw new TypeError(`Missing parameter name at ${i}: ${DEBUG_URL}`);/console.warn(`Warning: Missing parameter name at ${i}, treating as escaped character`); tokens.push({ type: "ESCAPED_CHAR", index: i, value: str[i++] }); continue;/g' "$PTR_FILE"
    
    echo "Applied inline fix to path-to-regexp"
  else
    echo "Could not find path-to-regexp file. Skipping inline fix."
  fi
fi

# 5. Run database setup script
echo "Setting up database tables..."
if [[ -f "StudentPerformanceTracker006/init-database.cjs" ]]; then
  echo "Running init-database.cjs script..."
  NODE_ENV=production node StudentPerformanceTracker006/init-database.cjs
elif [[ -f "init-database.js" ]]; then
  echo "Running init-database.js script..."
  NODE_ENV=production node init-database.js
else
  echo "No database initialization script found. Proceeding without database setup."
fi

# 6. Add specific students to the database
echo "Adding specific students to the database..."
if [[ -f "add-students.js" ]]; then
  echo "Running add-students.js script..."
  NODE_ENV=production node add-students.js
else
  echo "No add-students.js script found. Proceeding without adding specific students."
fi

# 7. Create buckets in Supabase if they don't exist
echo "Setting up Supabase storage buckets..."
if [[ -f "create-supabase-buckets.js" ]]; then
  echo "Running create-supabase-buckets.js script..."
  NODE_ENV=production node create-supabase-buckets.js
fi

# 8. Set up required directories for fallback local storage
echo "Creating required directories..."
mkdir -p uploads
mkdir -p uploads/profiles
mkdir -p uploads/files
mkdir -p uploads/assignments
mkdir -p uploads/notes
chmod -R 755 uploads

# 9. Make sure we're binding to 0.0.0.0 for Render.com
export HOST=0.0.0.0

# 10. Start the server
echo "Starting the server..."
if [[ -f "StudentPerformanceTracker006/app.cjs" ]]; then
  echo "Running the deployment-ready server (app.cjs)..."
  node StudentPerformanceTracker006/app.cjs
elif [[ -f "app.cjs" ]]; then
  echo "Running the deployment-ready server (app.cjs) in root..."
  node app.cjs
elif [[ -f "StudentPerformanceTracker006/app.js" ]]; then
  echo "Running the simple Express server..."
  node StudentPerformanceTracker006/app.js
elif [[ -f "server.js" ]]; then
  echo "Running server.js in root..."
  node server.js
else
  echo "Trying the enhanced server..."
  node StudentPerformanceTracker006/server/app.js
fi