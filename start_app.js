// Simple Node.js script to start the Student Performance Tracker

const { exec } = require('child_process');
const path = require('path');

console.log('Starting Student Performance Tracker...');

// Change directory to the StudentPerformanceTracker006 folder
process.chdir(path.join(__dirname, 'StudentPerformanceTracker006'));

// Run the fallback server
const server = exec('node app.cjs', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

console.log('Server starting on port 3000...');
console.log('Press Ctrl+C to stop the server');

// Keep the script running
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill();
  process.exit(0);
});