import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Enhanced database connection setup with better error handling
console.log(`📊 DATABASE: Connecting in environment: ${process.env.NODE_ENV || 'development'}`);

// Always prioritize environment variables for secure deployment
const DATABASE_URL = process.env.DATABASE_URL;

// Log configuration being used (without exposing sensitive data)
if (DATABASE_URL) {
  console.log('📊 DATABASE: Using provided DATABASE_URL environment variable');
} else {
  console.log('📊 DATABASE: Environment variable DATABASE_URL not found, using fallback configuration');
  console.log('📊 DATABASE: Attempting to connect to: postgres://localhost:5432/class_project');
}

// Enhanced connection options with better stability settings
const connectionOptions = {
  max: 5, // Reduced max connections for better stability
  idle_timeout: 20, // Shorter idle timeout
  connect_timeout: 15, // Faster connect timeout
  max_lifetime: 60 * 30, // 30 minutes max connection lifetime
  // SSL configuration with more flexible handling
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false,
  connection: {
    application_name: 'student-performance-tracker'
  },
  // Improved error and notice handling
  onnotice: notice => {
    if (notice.severity === 'WARNING' || notice.severity === 'ERROR') {
      console.warn(`📊 DATABASE NOTICE [${notice.severity}]: ${notice.message}`);
    }
  },
  // More selective logging
  debug: (connection, query, params, types) => {
    // Only log important queries to reduce noise
    if (query.includes('SELECT 1') || query.includes('pg_catalog')) return;
    const truncatedQuery = query.substring(0, 150);
    console.log(`📊 DATABASE QUERY: ${truncatedQuery}${query.length > 150 ? '...' : ''}`);
  }
};

// Create postgres client with better error handling
let client;
try {
  // Use environment variable with fallback
  client = postgres(DATABASE_URL || 'postgres://postgres:postgress@localhost:5432/class_project', connectionOptions);
  console.log('📊 DATABASE: Postgres client initialized successfully');
} catch (error) {
  console.error('❌ DATABASE CRITICAL ERROR: Failed to initialize Postgres client:', error);
  throw new Error('Database configuration error: Could not initialize client');
}

// Test connection with more detailed diagnostics
async function testConnection() {
  console.log('📊 DATABASE: Testing connection...');
  try {
    const startTime = Date.now();
    await client.unsafe("SELECT 1");
    const duration = Date.now() - startTime;
    console.log(`✅ DATABASE CONNECTION SUCCESSFUL (${duration}ms)`);
    return true;
  } catch (err) {
    console.error('❌ DATABASE CONNECTION FAILED:', err.message);
    console.error('📊 DATABASE: Connection details (sanitized):');
    console.error(`📊 DATABASE: Using environment variable: ${Boolean(DATABASE_URL)}`);
    console.error(`📊 DATABASE: SSL enabled: ${Boolean(connectionOptions.ssl)}`);
    // Log any available environment variables related to database (without values)
    const dbEnvVars = Object.keys(process.env).filter(key => 
      key.includes('DB') || key.includes('POSTGRES') || key.includes('PG')
    );
    console.error('📊 DATABASE: Available database-related environment variables:', dbEnvVars.join(', '));
    return false;
  }
}

// Execute test and log results
testConnection()
  .then(success => {
    if (!success) {
      console.error('❌ DATABASE: Connection test failed, but continuing execution');
    }
  })
  .catch(err => {
    console.error('❌ DATABASE: Unexpected error during connection test:', err);
  });

// Export the drizzle instance with enhanced schema handling
export const db = drizzle(client, { schema });
