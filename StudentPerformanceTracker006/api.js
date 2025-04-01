/**
 * Status API endpoints for the Student Performance Tracker
 * 
 * Provides status information and control endpoints for the launcher
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Create Express router for API endpoints
const apiRouter = express.Router();

// Server start time
const SERVER_START_TIME = Date.now();

// Version information
const VERSION = '1.0.0';

// Path to server log file
const SERVER_LOG_PATH = path.join(__dirname, '..', 'server_output.log');

/**
 * Helper function to check database connection
 */
async function checkDatabaseConnection() {
  try {
    // Check if the DATABASE_URL environment variable is set
    if (!process.env.DATABASE_URL) {
      return {
        connected: false,
        error: 'DATABASE_URL environment variable is not set'
      };
    }

    // Try to connect to the database and query the users and units tables
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    // Get counts
    const usersResult = await client.query('SELECT COUNT(*) FROM "User"');
    const unitsResult = await client.query('SELECT COUNT(*) FROM "Unit"');
    
    const userCount = parseInt(usersResult.rows[0].count, 10);
    const unitCount = parseInt(unitsResult.rows[0].count, 10);
    
    client.release();
    
    return {
      connected: true,
      users: userCount,
      units: unitCount
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Helper function to get system information
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    nodejs: {
      version: process.version,
      env: process.env.NODE_ENV || 'development'
    }
  };
}

/**
 * Helper function to read the latest log entries
 */
function getLatestLogs(maxLines = 200) {
  try {
    if (!fs.existsSync(SERVER_LOG_PATH)) {
      return { content: 'No server log file found.' };
    }
    
    // Read the log file
    const logContent = fs.readFileSync(SERVER_LOG_PATH, 'utf8');
    
    // Split into lines and get the last maxLines
    const lines = logContent.split('\n');
    const latestLines = lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
    
    return { content: latestLines };
  } catch (error) {
    console.error('Error reading log file:', error);
    return { content: `Error reading log file: ${error.message}` };
  }
}

/**
 * Status endpoint - provides information about the server status
 */
apiRouter.get('/status', async (req, res) => {
  try {
    // Calculate uptime in seconds
    const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
    
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    res.json({
      status: 'running',
      version: VERSION,
      uptime,
      database: dbStatus
    });
  } catch (error) {
    console.error('Status API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Start server endpoint - starts or restarts the server
 */
apiRouter.post('/start', (req, res) => {
  try {
    // The API being called means the server is already running,
    // so we just return success
    res.json({
      status: 'success',
      message: 'Server is already running'
    });
  } catch (error) {
    console.error('Start server API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Server logs endpoint - returns the latest log entries
 */
apiRouter.get('/logs', (req, res) => {
  try {
    const logData = getLatestLogs(500);
    res.json(logData);
  } catch (error) {
    console.error('Logs API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * System information endpoint - returns information about the system
 */
apiRouter.get('/system', (req, res) => {
  try {
    const systemInfo = getSystemInfo();
    res.json(systemInfo);
  } catch (error) {
    console.error('System info API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Database status endpoint - checks if the database is accessible
 */
apiRouter.get('/database', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    res.json(dbStatus);
  } catch (error) {
    console.error('Database status API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = apiRouter;