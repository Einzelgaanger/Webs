/**
 * Status API endpoints for the Student Performance Tracker
 * 
 * Provides status information and control endpoints for the launcher
 */
const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { Client } = require('pg');

const router = express.Router();

// Constants
const LOG_FILE = path.join(__dirname, '..', 'server.log');
const VERSION = '1.0.0';
const MAX_LOG_LINES = 200;

// Status endpoint
router.get('/status', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    res.json({
      status: 'OK',
      version: VERSION,
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Start application endpoint
router.post('/start', (req, res) => {
  try {
    // Log server start
    const logMessage = `Starting server at ${new Date().toISOString()}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    
    // Start the application in a new process
    const appProcess = exec('cd .. && bash start_app.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        fs.appendFileSync(LOG_FILE, `Error starting application: ${error}\n`);
        return;
      }
      
      fs.appendFileSync(LOG_FILE, `${stdout}\n`);
      if (stderr) {
        fs.appendFileSync(LOG_FILE, `${stderr}\n`);
      }
    });
    
    res.json({ 
      status: 'OK',
      message: 'Server starting'
    });
  } catch (error) {
    console.error('Start server error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Logs endpoint
router.get('/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ content: 'No logs found.' });
    }
    
    // Read the log file
    let content = fs.readFileSync(LOG_FILE, 'utf8');
    
    // Limit the number of lines
    const lines = content.split('\n');
    if (lines.length > MAX_LOG_LINES) {
      content = lines.slice(lines.length - MAX_LOG_LINES).join('\n');
      content = `... (${lines.length - MAX_LOG_LINES} earlier lines omitted) ...\n${content}`;
    }
    
    res.json({ content });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// System information endpoint
router.get('/system', (req, res) => {
  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      cpus: os.cpus().length,
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      nodejs: {
        version: process.version,
        pid: process.pid,
        uptime: process.uptime()
      }
    };
    
    res.json(systemInfo);
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Database status endpoint
router.get('/database', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    
    res.json({
      status: dbStatus.connected ? 'OK' : 'ERROR',
      ...dbStatus
    });
  } catch (error) {
    console.error('Database status error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Helper function to check database connection
async function checkDatabaseConnection() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    
    // Get user count
    const userResult = await client.query('SELECT COUNT(*) FROM "user"');
    const users = parseInt(userResult.rows[0].count, 10);
    
    // Get unit count
    const unitResult = await client.query('SELECT COUNT(*) FROM "unit"');
    const units = parseInt(unitResult.rows[0].count, 10);
    
    await client.end();
    
    return {
      connected: true,
      users,
      units
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = router;