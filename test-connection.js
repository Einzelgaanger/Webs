/**
 * Simple script to test connectivity to the Student Performance Tracker
 */
const http = require('http');

// Function to make an HTTP request to the running server
function testConnection() {
  const options = {
    hostname: '0.0.0.0',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  console.log('Testing connection to Student Performance Tracker...');
  
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response received successfully');
      console.log(`Response length: ${data.length} bytes`);
      console.log('Connection test completed successfully');
    });
  });
  
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  
  req.end();
}

// Execute the test
testConnection();