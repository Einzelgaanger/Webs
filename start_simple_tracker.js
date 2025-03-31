/**
 * Simple script to start the Student Performance Tracker
 * This only starts the fallback server (app.cjs) which
 * is a simplified version that doesn't have path-to-regexp issues
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Student Performance Tracker (Fallback Server)...');

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, 'StudentPerformanceTracker006', 'uploads', 'profiles'),
  path.join(__dirname, 'StudentPerformanceTracker006', 'uploads', 'assignments'),
  path.join(__dirname, 'StudentPerformanceTracker006', 'uploads', 'notes')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Change to the application directory
process.chdir(path.join(__dirname, 'StudentPerformanceTracker006'));

// Start the server as a child process
const server = spawn('node', ['app.cjs'], {
  stdio: 'inherit'
});

// Handle server process events
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Set up cleanup for graceful shutdown
const cleanup = () => {
  console.log('Stopping server...');
  server.kill('SIGINT');
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);