/**
 * Simple script to start the Student Performance Tracker
 */
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting Student Performance Tracker...');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'StudentPerformanceTracker006', 'uploads');
const profileDir = path.join(uploadsDir, 'profiles');
const assignmentsDir = path.join(uploadsDir, 'assignments');
const notesDir = path.join(uploadsDir, 'notes');

[uploadsDir, profileDir, assignmentsDir, notesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run the app.cjs server
const appPath = path.join(__dirname, 'StudentPerformanceTracker006', 'app.cjs');

console.log('Starting server from:', appPath);
const serverProcess = spawn('node', [appPath], {
  stdio: 'inherit',
  detached: false
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

console.log('Server should be running on http://0.0.0.0:3000');