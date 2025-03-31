// Simple script to test the server connection
const http = require('http');

// Create a server on a different port (3456) to check connectivity
const server = http.createServer((req, res) => {
  // Set CORS headers first, before writeHead
  const headers = {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  res.writeHead(200, headers);
  
  // Simple HTML response
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connection Test</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        .success { color: green; font-weight: bold; }
        .info { color: blue; }
      </style>
    </head>
    <body>
      <h1>Student Performance Tracker</h1>
      <h2>Connection Test Successful! ✅</h2>
      <p class="success">The test server is running correctly on port 3456.</p>
      <p class="info">This is a separate test server to verify network connectivity.</p>
      <p>If you can see this page, but still have issues with the main app, there may be a problem with the application logic or database connection.</p>
      <hr>
      <h3>Try accessing the main app at:</h3>
      <p><a href="http://localhost:3000">http://localhost:3000</a></p>
    </body>
    </html>
  `);
});

// Listen on port 3456
server.listen(3456, '0.0.0.0', () => {
  console.log('Test server is running on http://0.0.0.0:3456');
  console.log('Access this test server to verify network connectivity');
  console.log('Press Ctrl+C to stop the server');
});