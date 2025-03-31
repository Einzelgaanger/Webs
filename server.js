const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to start the Student Tracker
app.get('/api/start-tracker', (req, res) => {
  try {
    const trackerProcess = spawn('bash', ['./start_app.sh'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Unref the child process so it runs independently
    trackerProcess.unref();
    
    res.json({ success: true, message: 'Student Tracker started successfully' });
  } catch (error) {
    console.error('Error starting tracker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'launcher.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});