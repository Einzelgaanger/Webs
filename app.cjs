/**
 * Simple Express Server for Student Performance Tracker
 * This version doesn't rely on TypeScript or Supabase, ensuring it
 * can be deployed to Render.com with minimal dependencies
 */

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const pg = require('pg');
const { Pool } = pg;
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure PostgreSQL connection
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err.message);
    } else {
      console.log('Database connected successfully at:', res.rows[0].now);
    }
  });
} catch (error) {
  console.error('Error setting up database connection:', error.message);
}

// Configure session middleware
app.use(session({
  store: pool ? new pgSession({
    pool,
    tableName: 'sessions' // Use the existing sessions table
  }) : undefined, // Fall back to memory store if pool is undefined
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate timestamp for cache busting static assets
const timestamp = Date.now();

// Status endpoint - provides basic information about the server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: !!pool,
      url: process.env.DATABASE_URL ? '******' : 'not configured'
    },
    supabase: {
      configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
    }
  });
});

// API routes for testing the connection
app.get('/api/test-connection', (req, res) => {
  res.json({ message: 'API connection successful!' });
});

// API route to test database connection
app.get('/api/test-database', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }
    
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      message: 'Database connection successful!',
      current_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Basic authentication test route
app.post('/api/login', (req, res) => {
  const { admissionNumber, password } = req.body;
  
  // Simple login logic, to be replaced with real auth in production
  if (admissionNumber && password === 'sds#website') {
    req.session.user = { admissionNumber };
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Login failed' });
  }
});

// Check if the user is logged in
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Server-side render of the deployment status page
app.get('/deployment-status', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Performance Tracker - Deployment Status</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        color: #333;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      h1 {
        color: #6200ee;
        text-align: center;
        border-bottom: 2px solid #6200ee;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .status-card {
        background-color: #f9f9f9;
        border-left: 4px solid #6200ee;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 4px;
      }
      .success {
        border-left-color: #4CAF50;
      }
      .warning {
        border-left-color: #FF9800;
      }
      .error {
        border-left-color: #F44336;
      }
      .status-name {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .status-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
      }
      .success .status-indicator {
        background-color: #4CAF50;
      }
      .warning .status-indicator {
        background-color: #FF9800;
      }
      .error .status-indicator {
        background-color: #F44336;
      }
      button {
        background-color: #6200ee;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-right: 10px;
      }
      button:hover {
        background-color: #5000ca;
      }
      .actions {
        margin-top: 20px;
        text-align: center;
      }
      pre {
        background-color: #f1f1f1;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 14px;
      }
      @media (max-width: 600px) {
        .container {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Student Performance Tracker</h1>
      <h2>Deployment Status</h2>
      
      <div class="status-card">
        <div class="status-name">Server Status</div>
        <div class="status-value">
          <span class="status-indicator"></span>
          <span id="server-status">Checking...</span>
        </div>
      </div>
      
      <div class="status-card">
        <div class="status-name">Database Connection</div>
        <div class="status-value">
          <span class="status-indicator"></span>
          <span id="db-status">Checking...</span>
        </div>
      </div>
      
      <div class="status-card">
        <div class="status-name">Supabase Configuration</div>
        <div class="status-value">
          <span class="status-indicator"></span>
          <span id="supabase-status">Checking...</span>
        </div>
      </div>
      
      <div class="status-card">
        <div class="status-name">Environment</div>
        <div class="status-value" id="environment">Loading...</div>
      </div>
      
      <div id="json-result" style="margin-top: 20px;">
        <h3>API Response</h3>
        <pre id="status-json">Loading...</pre>
      </div>
      
      <div class="actions">
        <button id="check-status">Refresh Status</button>
        <button id="test-db">Test Database</button>
        <button id="back-to-app">Back to Application</button>
      </div>
    </div>
    
    <script>
      // Function to update UI with status information
      function updateStatus(data) {
        const serverStatus = document.getElementById('server-status');
        const dbStatus = document.getElementById('db-status');
        const supabaseStatus = document.getElementById('supabase-status');
        const environment = document.getElementById('environment');
        const statusJson = document.getElementById('status-json');
        
        // Update server status
        serverStatus.textContent = 'Online';
        serverStatus.parentElement.parentElement.classList.add('success');
        
        // Update database status
        if (data.database.connected) {
          dbStatus.textContent = 'Connected';
          dbStatus.parentElement.parentElement.classList.add('success');
        } else {
          dbStatus.textContent = 'Not Connected';
          dbStatus.parentElement.parentElement.classList.add('error');
        }
        
        // Update Supabase status
        if (data.supabase.configured) {
          supabaseStatus.textContent = 'Configured';
          supabaseStatus.parentElement.parentElement.classList.add('success');
        } else {
          supabaseStatus.textContent = 'Not Configured';
          supabaseStatus.parentElement.parentElement.classList.add('warning');
        }
        
        // Update environment
        environment.textContent = data.environment.charAt(0).toUpperCase() + data.environment.slice(1);
        
        // Update JSON display
        statusJson.textContent = JSON.stringify(data, null, 2);
      }
      
      // Function to check status
      async function checkStatus() {
        try {
          const response = await fetch('/api/status');
          const data = await response.json();
          updateStatus(data);
        } catch (error) {
          console.error('Error fetching status:', error);
          document.getElementById('status-json').textContent = 'Error fetching status: ' + error.message;
        }
      }
      
      // Function to test database
      async function testDatabase() {
        try {
          const response = await fetch('/api/test-database');
          const data = await response.json();
          document.getElementById('status-json').textContent = JSON.stringify(data, null, 2);
          
          if (response.ok) {
            const dbStatus = document.getElementById('db-status');
            dbStatus.textContent = 'Connected';
            dbStatus.parentElement.parentElement.classList.remove('error', 'warning');
            dbStatus.parentElement.parentElement.classList.add('success');
          }
        } catch (error) {
          console.error('Error testing database:', error);
          document.getElementById('status-json').textContent = 'Error testing database: ' + error.message;
        }
      }
      
      // Add event listeners
      document.getElementById('check-status').addEventListener('click', checkStatus);
      document.getElementById('test-db').addEventListener('click', testDatabase);
      document.getElementById('back-to-app').addEventListener('click', () => {
        window.location.href = '/';
      });
      
      // Check status on page load
      checkStatus();
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Serve static files from the build directory (if it exists)
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  
  // Serve the React app for any unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
} else {
  // If no build directory exists, show a simple landing page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Performance Tracker</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 30px;
            background-color: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #6200ee;
          }
          p {
            color: #555;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #6200ee;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #5000ca;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Student Performance Tracker</h1>
          <p>The server is running successfully! This is a simplified version of the application server used for deployment testing.</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Server Time: ${new Date().toLocaleString()}</p>
          <p>
            <a class="button" href="/deployment-status">Check Deployment Status</a>
          </p>
        </div>
      </body>
      </html>
    `);
  });
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
===================================================
Student Performance Tracker Server
===================================================
Server is running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
Supabase: ${process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? 'Configured' : 'Not configured'}
===================================================
`);
});