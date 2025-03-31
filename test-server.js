const express = require('express');
const fs = require('fs');
const path = require('path');

// Create a test server
const app = express();

// Custom middleware to bypass path-to-regexp for specific routes
const bypassPathToRegexp = (req, res, next) => {
  const knownRoutes = ['/', '/api/status', '/troubleshooting'];
  
  if (knownRoutes.includes(req.url)) {
    // For known routes, skip route matching and directly handle
    if (req.url === '/') {
      return res.send('Hello from the test server! Path-to-regexp bypass working.');
    } else if (req.url === '/api/status') {
      return res.json({ status: 'ok', message: 'API is working' });
    } else if (req.url === '/troubleshooting') {
      return res.send(`
        <h1>Troubleshooting Guide</h1>
        <p>Current error: The path-to-regexp module is failing to parse URLs with colons.</p>
        <pre>
Error: Missing parameter name at 1: https://git.new/pathToRegexpError
        </pre>
      `);
    }
  }
  
  // If not a known route, proceed to normal Express routing
  next();
};

// Apply our custom middleware
app.use(bypassPathToRegexp);

// Regular routes (will use path-to-regexp, might fail)
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

app.get('/test/:id', (req, res) => {
  res.send(`Test ID: ${req.params.id}`);
});

// Special route that would fail with path-to-regexp
app.get('/url-test', (req, res) => {
  try {
    res.send(`
      <h1>URL Test</h1>
      <p>Testing URL parsing with colons:</p>
      <ul>
        <li>https://example.com</li>
        <li>http://localhost:3000</li>
        <li>git://github.com/user/repo</li>
      </ul>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Mock login API
app.post('/api/login', express.json(), (req, res) => {
  const { admissionNumber, name, password } = req.body;
  
  if (admissionNumber === 'ST001' && name === 'John Doe' && password === 'sds#website') {
    res.json({
      success: true,
      user: {
        id: 1,
        name: 'John Doe',
        admissionNumber: 'ST001',
        role: 'student'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});