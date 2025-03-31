/**
 * Student Performance Tracker Startup Script
 * This script provides a workaround for the path-to-regexp issue
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');

// Create a simple app that serves the app.js file when the path-to-regexp fails
const app = express();
const PORT = process.env.PORT || 3000;

// Make sure theme.json exists
const themeFilePath = path.join(process.cwd(), 'theme.json');
console.log(`Checking for theme file at: ${themeFilePath}`);
if (!fs.existsSync(themeFilePath)) {
  console.log('Creating theme.json file...');
  fs.writeFileSync(themeFilePath, JSON.stringify({
    primary: "#3b82f6",
    variant: "vibrant",
    appearance: "system",
    radius: 0.5
  }, null, 2));
}

// Attempt to start the main application
console.log('Attempting to start the full application...');

try {
  // Try to start the server using a child process
  const serverProcess = exec('cd server && npx tsx index.ts', { env: { ...process.env, NODE_ENV: 'development' }}, (error, stdout, stderr) => {
    if (error) {
      console.error(`Main application failed to start: ${error.message}`);
      console.log(stderr);
      
      // If the main application fails, start the fallback app
      console.log('Starting fallback application...');
      
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
              .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
              .feature { padding: 15px; border-radius: 5px; background-color: #f8fafc; border: 1px solid #e2e8f0; }
              .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                text-decoration: none;
                margin-top: 20px;
                font-weight: bold;
                transition: background-color 0.3s;
              }
              .button:hover { background-color: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Student Performance Tracker</h1>
              <div class="message">
                <p>Welcome to the Student Performance Tracker!</p>
                <p>We're currently working to fix some technical issues with the application. The server is experiencing difficulty with one of its dependencies.</p>
                <p>We apologize for the inconvenience and are working to resolve this as quickly as possible.</p>
              </div>
              
              <h2>Key Features Being Implemented</h2>
              <div class="features">
                <div class="feature">
                  <h3>Search Functionality</h3>
                  <p>Find assignments, notes, and past papers quickly</p>
                </div>
                <div class="feature">
                  <h3>Animated Onboarding</h3>
                  <p>Smooth introduction for new users</p>
                </div>
                <div class="feature">
                  <h3>Improved UI</h3>
                  <p>Better icons and more intuitive design</p>
                </div>
                <div class="feature">
                  <h3>Assignment Marking</h3>
                  <p>Enhanced functionality for completing assignments</p>
                </div>
              </div>
              
              <p style="margin-top: 30px;">Created by 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤</p>
              
              <a href="/troubleshooting" class="button">View Troubleshooting Guide</a>
            </div>
          </body>
          </html>
        `);
      });
      
      app.get('/troubleshooting', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Troubleshooting - Student Performance Tracker</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background-color: #f4f6f8; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: left; }
              h1 { color: #3b82f6; text-align: center; }
              .message { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; }
              pre { background-color: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
              .solution { margin-top: 20px; padding: 15px; border-radius: 5px; background-color: #f0fdf4; border-left: 4px solid #22c55e; }
              .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                text-decoration: none;
                margin-top: 20px;
                font-weight: bold;
                transition: background-color 0.3s;
              }
              .button:hover { background-color: #2563eb; }
              .center { text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Troubleshooting Guide</h1>
              
              <div class="message">
                <p>The application is currently experiencing an issue with the <code>path-to-regexp</code> dependency used by Express.js.</p>
              </div>
              
              <h2>Error Details</h2>
              <pre>
      TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError
          at name (/node_modules/path-to-regexp/src/index.ts:153:13)
              </pre>
              
              <h2>Cause</h2>
              <p>The error is caused by a URL containing colons (":") that the router is trying to parse as route parameters. The path-to-regexp module expects parameter names after colons, but URLs like "https://example.com" cause errors because they don't follow this pattern.</p>
              
              <div class="solution">
                <h2>Solution</h2>
                <p>We're currently working on a patch that will:</p>
                <ol>
                  <li>Fix the path-to-regexp module to properly handle URLs with colons</li>
                  <li>Update our routing configuration to escape special characters</li>
                  <li>Implement a workaround for the current server startup issue</li>
                </ol>
              </div>
              
              <h2>Alternative Login Method</h2>
              <p>While we work on fixing this issue, you can use these credentials to log in:</p>
              <pre>
      Name: John Doe
      Admission Number: ST001
      Password: sds#website
              </pre>
              
              <div class="center">
                <a href="/" class="button">Back to Home</a>
              </div>
            </div>
          </body>
          </html>
        `);
      });
      
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Fallback server running at http://0.0.0.0:${PORT}`);
      });
    } else {
      console.log('Main application started successfully!');
      console.log(stdout);
    }
  });
  
  // Listen for server signals
  serverProcess.stdout.on('data', (data) => {
    console.log(`SERVER: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`SERVER ERROR: ${data}`);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    serverProcess.kill();
    process.exit(0);
  });
  
} catch (error) {
  console.error('Failed to start the application:', error);
  
  // Start the fallback app if there's an error
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fallback server running at http://0.0.0.0:${PORT}`);
  });
}