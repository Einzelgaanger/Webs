#!/bin/bash

# This script prepares and starts the Student Performance Tracker application
echo "🔄 Setting up Student Performance Tracker workflow..."

# Copy the custom workflow configuration
cp .replit_custom_workflow.toml .replit
echo "✅ Custom workflow configuration applied"

# Set execution permission for the run script
chmod +x StudentPerformanceTracker006/run.sh
echo "✅ Run script permissions set"

# Show startup information
echo "
🚀 Student Performance Tracker is ready to run!

To start the application:
1. Click on the 'Run' button at the top of the screen
2. The application will start on port 3000
3. Wait for the startup logs to complete

✅ Authentication troubleshooting has been applied:
   - Database connection handling improved
   - User credential matching enhanced with more flexible search

📝 Default login credentials:
   - Name: Samsam Abdul Nassir
   - Admission Number: SDS001
   - Default password: sds#website

🔄 If you encounter any issues, check the logs in:
   - app.log (main server logs)
   - server.log (fallback server logs)
"

# Done
echo "✅ Setup complete"