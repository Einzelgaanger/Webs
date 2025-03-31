#!/bin/bash

# Stop any existing servers
pkill -f "node server.js" || true
pkill -f "node app.cjs" || true

# Start the launcher server
node server.js