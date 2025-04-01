import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { seed } from "./seed";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import cors from 'cors';
import { db, testConnection, runMigrations } from './db';
import { setupMiddleware } from './middleware';

// Load environment variables
config();

// Ensure necessary directories exist
function ensureDirectoriesExist() {
  // Ensure upload directories exist
  const uploadDirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads/profiles'),
    path.join(process.cwd(), 'uploads/files')
  ];
  
  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Set default environment variables if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'sds-year2-group-b-very-secret-key';
  console.log('WARNING: Using default session secret. Set SESSION_SECRET environment variable in production.');
}

// Create upload directories
ensureDirectoriesExist();

// Print environment information for debugging
console.log(`Starting server in ${process.env.NODE_ENV} mode`);
console.log(`Using database: ${process.env.DATABASE_URL ? 'External database (via DATABASE_URL)' : 'Default database'}`);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Intercept JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Add response data for debugging but limit size
      if (capturedJsonResponse) {
        // Mask password fields for security
        const sanitizedResponse = { ...capturedJsonResponse };
        if (sanitizedResponse.password) sanitizedResponse.password = '******';
        
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Setup middleware
setupMiddleware(app);

// Setup routes
setupRoutes(app);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }

    // Run migrations
    await runMigrations();

    // Start server with error handling
    const port = process.env.PORT || 3000;
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`🚀 Server running on http://127.0.0.1:${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Please try a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
