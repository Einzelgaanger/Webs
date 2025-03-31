// This is a patched version of the server startup file to work around the path-to-regexp error
const { spawn } = require('child_process');
const path = require('path');

// Monkeypatch path-to-regexp before it's loaded by express/router
// This addresses the "Missing parameter name" error
try {
  // Find path-to-regexp in node_modules
  const pathToRegexpPath = path.resolve(__dirname, 'node_modules/path-to-regexp');
  console.log(`Looking for path-to-regexp at: ${pathToRegexpPath}`);
  
  // Override the problematic method with our patched version
  const pathToRegexp = require(pathToRegexpPath);
  const originalPathToRegexp = pathToRegexp.pathToRegexp;
  
  // Patch to handle problematic patterns like URLs with colons but no parameter names
  pathToRegexp.pathToRegexp = function(path, keys, options) {
    if (typeof path === 'string' && path.includes('://')) {
      // Simple fix: escape the colon in URLs
      path = path.replace(/:\//g, '\\:\\/');
      console.log('Patched URL path:', path);
    }
    return originalPathToRegexp(path, keys, options);
  };
  
  console.log('Successfully patched path-to-regexp');
} catch (err) {
  console.error('Failed to patch path-to-regexp:', err);
}

// Start the server with tsx
console.log('Starting server...');
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});