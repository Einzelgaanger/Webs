/**
 * Student Performance Tracker Launcher
 * This script provides a centralized way to start the application
 * with proper error handling and database verification
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const dirs = [
  'StudentPerformanceTracker006/uploads',
  'StudentPerformanceTracker006/uploads/profiles',
  'StudentPerformanceTracker006/uploads/files',
  'StudentPerformanceTracker006/uploads/notes',
  'StudentPerformanceTracker006/uploads/assignments'
];

// Create necessary directories
console.log('Setting up application directories...');
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Define start command based on what's available
const startApp = () => {
  console.log('Starting Student Performance Tracker...');
  
  // Try to start with our enhanced server
  try {
    const serverProcess = spawn('cd', ['StudentPerformanceTracker006', '&&', 'node', 'start-server.cjs'], {
      stdio: 'inherit',
      shell: true
    });
    
    serverProcess.on('error', (err) => {
      console.error('❌ Server error:', err.message);
      console.log('Trying fallback server...');
      startFallbackServer();
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`Server exited with code ${code}, starting fallback...`);
        startFallbackServer();
      }
    });
  } catch (err) {
    console.error('Failed to start main server:', err);
    startFallbackServer();
  }
};

// Fallback to the app.cjs server if main fails
const startFallbackServer = () => {
  console.log('Starting fallback server...');
  
  try {
    const fallbackProcess = spawn('cd', ['StudentPerformanceTracker006', '&&', 'node', 'app.cjs'], {
      stdio: 'inherit',
      shell: true
    });
    
    fallbackProcess.on('error', (err) => {
      console.error('❌ Fallback server error:', err.message);
    });
  } catch (err) {
    console.error('Failed to start fallback server:', err);
  }
};

// Start the application
startApp();