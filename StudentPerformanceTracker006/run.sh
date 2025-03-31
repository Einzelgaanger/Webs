#!/bin/bash
# Script to run the Student Performance Tracker application

echo "Starting Student Performance Tracker..."
echo "Setting up environment variables..."

# Set NODE_ENV to development
export NODE_ENV=development

# Ensure uploads directory exists
mkdir -p uploads/profiles uploads/assignments uploads/notes

# Check if database connection is working
echo "Testing database connection..."
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('✅ Database time:', res.rows[0].now);
    client.end();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
  echo "❌ Database connection failed. Exiting..."
  exit 1
fi

echo "✅ Database connection established"

# Run the app with the safe app.cjs server first
echo "Starting fallback server..."
node app.cjs > server.log 2>&1 &
FALLBACK_PID=$!

echo "Waiting for fallback server to start..."
sleep 2

# Check if fallback server is running
if ps -p $FALLBACK_PID > /dev/null; then
  echo "✅ Fallback server started successfully on port 3000"
  echo "📝 Logs are being written to server.log"
  echo "⚠️ If the main server fails, you can access the fallback at http://localhost:3000"
else
  echo "❌ Fallback server failed to start"
fi

# Try to start the main TypeScript server
echo "Starting main application server..."
node start-server.js > app.log 2>&1 &
MAIN_PID=$!

echo "Waiting for main server to start..."
sleep 5

# Check if main server is running
if ps -p $MAIN_PID > /dev/null; then
  echo "✅ Main server started successfully"
  echo "📝 Logs are being written to app.log"
  echo "✅ App is running on http://localhost:3000"
  echo "📱 You can now access the Student Performance Tracker"
else
  echo "❌ Main server failed to start. Using fallback server."
fi

echo "✅ Student Performance Tracker is ready!"
echo "Press Ctrl+C to stop the servers"

# Keep script running
wait