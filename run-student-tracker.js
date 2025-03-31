// Wrapper script for running the Student Performance Tracker app
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const express = require('express');

// Create a simple express app to serve a redirect page
const app = express();
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student Performance Tracker</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background-color: #f4f6f8; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
        h1 { color: #3b82f6; }
        .message { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; }
        .spinner { display: inline-block; width: 50px; height: 50px; border: 5px solid rgba(59, 130, 246, 0.2); border-radius: 50%; border-top-color: #3b82f6; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Student Performance Tracker</h1>
        <div class="message">
          <p>The application is starting...</p>
          <div class="spinner"></div>
          <p>Please wait while we set up the server.</p>
          <p>If the application doesn't start automatically, please check with the administrator.</p>
        </div>
        <p>Created by 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤</p>
      </div>
      <script>
        // Auto-refresh the page after 10 seconds to check if the app is running
        setTimeout(() => {
          window.location.href = "http://localhost:5000/";
        }, 10000);
      </script>
    </body>
    </html>
  `);
});

// Start temporary server on port 3000
const server = createServer(app);
server.listen(3000, '0.0.0.0', () => {
  console.log('Startup page running at http://localhost:3000');
});

// Start the main application
console.log('Starting Student Performance Tracker application...');
const appDir = path.join(__dirname, 'StudentPerformanceTracker006');
const command = 'cd ' + appDir + ' && NODE_DEBUG=module npx tsx server/index.ts';

// Execute the command
const child = exec(command, {
  env: { ...process.env, DEBUG_URL: '' }
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
  
  // Check if we have path-to-regexp errors
  if (data.toString().includes('path-to-regexp') || data.toString().includes('Missing parameter name')) {
    console.log('Detected path-to-regexp error, attempting to apply patches...');
    
    // We could add additional recovery steps here
  }
});

child.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
  server.close();
});