/**
 * Enhanced server starter with database and path-to-regexp fixes
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Student Performance Tracker...');
console.log('Setting up environment variables...');

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

console.log('Testing database connection...');
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verify database connection before starting server
(async () => {
  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    const res = await client.query('SELECT NOW()');
    console.log(`✅ Database time: ${res.rows[0].now}`);
    
    // Check if we have users in the database
    const usersRes = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersRes.rows[0].count);
    
    if (userCount < 10) {
      console.log(`⚠️ WARNING: Only ${userCount} users found in database. Running reset-data.ts to populate database...`);
      
      try {
        const { execSync } = require('child_process');
        execSync('cd StudentPerformanceTracker006 && npx tsx server/reset-data.ts', {
          stdio: 'inherit'
        });
        console.log('✅ Database reset and populated successfully');
      } catch (resetErr) {
        console.error('❌ ERROR resetting database:', resetErr.message);
      }
    } else {
      console.log(`✅ Database has ${userCount} users`);
    }
    
    await client.end();
    console.log('✅ Database connection established');
    
    // Create key directories if they don't exist
    const dirs = [
      'StudentPerformanceTracker006/uploads',
      'StudentPerformanceTracker006/uploads/profiles',
      'StudentPerformanceTracker006/uploads/files',
      'StudentPerformanceTracker006/uploads/notes',
      'StudentPerformanceTracker006/uploads/assignments'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
    
    // Start the TypeScript server with our custom fix
    console.log('Starting main application server...');
    const serverProcess = spawn('cd', ['StudentPerformanceTracker006', '&&', 'node', 'start-server.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Also start the fallback server as a safety measure
    console.log('Starting fallback server...');
    const fallbackProcess = spawn('cd', ['StudentPerformanceTracker006', '&&', 'node', 'app.cjs'], {
      stdio: 'inherit',
      shell: true
    });
    
    console.log('Waiting for fallback server to start...');
    
    serverProcess.on('error', (err) => {
      console.error('❌ Main server error:', err.message);
    });
    
    fallbackProcess.on('error', (err) => {
      console.error('❌ Fallback server error:', err.message);
    });
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.log('Starting fallback server due to database issues...');
    
    const fallbackProcess = spawn('cd', ['StudentPerformanceTracker006', '&&', 'node', 'app.cjs'], {
      stdio: 'inherit',
      shell: true
    });
    
    fallbackProcess.on('error', (err) => {
      console.error('❌ Fallback server error:', err.message);
    });
  }
})();