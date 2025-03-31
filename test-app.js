/**
 * Simple Express Server to test connectivity
 */

const express = require('express');
const app = express();
const port = 3333;

// Basic routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Server</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        .success { color: green; font-weight: bold; }
        .info { color: blue; }
      </style>
    </head>
    <body>
      <h1>Test Server is Working!</h1>
      <p class="success">✅ Connection successful</p>
      <p>Current Time: ${new Date().toLocaleString()}</p>
      <p class="info">This is a simple test server running on port ${port}</p>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server is running on http://0.0.0.0:${port}`);
});