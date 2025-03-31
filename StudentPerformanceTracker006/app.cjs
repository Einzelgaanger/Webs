/**
 * Simple Express server for Student Performance Tracker
 * This version doesn't rely on path-to-regexp which is causing issues
 * CommonJS version
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static HTML for the fallback
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
        <a href="/database-status" class="button">Database Status</a>
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

app.get('/database-status', async (req, res) => {
  try {
    // Display database status information
    const pg = require('pg');
    const client = new pg.Client(process.env.DATABASE_URL);
    
    await client.connect();
    
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const unitsResult = await client.query('SELECT COUNT(*) FROM units');
    const notesResult = await client.query('SELECT COUNT(*) FROM notes');
    const assignmentsResult = await client.query('SELECT COUNT(*) FROM assignments');
    
    await client.end();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Status - Student Performance Tracker</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background-color: #f4f6f8; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: left; }
          h1 { color: #3b82f6; text-align: center; }
          .info { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; }
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
          .status-ok { color: #22c55e; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Database Status</h1>
          
          <div class="info">
            <p>Database connection successful! The following tables are available:</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Table</th>
                <th>Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Users</td>
                <td>${usersResult.rows[0].count}</td>
                <td class="status-ok">CONNECTED</td>
              </tr>
              <tr>
                <td>Units</td>
                <td>${unitsResult.rows[0].count}</td>
                <td class="status-ok">CONNECTED</td>
              </tr>
              <tr>
                <td>Notes</td>
                <td>${notesResult.rows[0].count}</td>
                <td class="status-ok">CONNECTED</td>
              </tr>
              <tr>
                <td>Assignments</td>
                <td>${assignmentsResult.rows[0].count}</td>
                <td class="status-ok">CONNECTED</td>
              </tr>
            </tbody>
          </table>
          
          <div class="center">
            <a href="/" class="button">Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Database Error - Student Performance Tracker</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; background-color: #f4f6f8; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); text-align: left; }
          h1 { color: #ef4444; text-align: center; }
          .error { margin: 20px 0; padding: 15px; border-radius: 5px; background-color: #fee2e2; border-left: 4px solid #ef4444; }
          pre { background-color: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; }
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
          <h1>Database Connection Error</h1>
          
          <div class="error">
            <p>Unable to connect to the database. Please try again later.</p>
          </div>
          
          <h2>Error Details</h2>
          <pre>${error.message}</pre>
          
          <div class="center">
            <a href="/" class="button">Back to Home</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});