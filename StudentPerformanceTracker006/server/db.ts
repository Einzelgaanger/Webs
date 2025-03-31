import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Simple and reliable database connection setup
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// For better logging and debugging
console.log(`Connecting to database in environment: ${process.env.NODE_ENV || 'development'}`);

// Create postgres client with enhanced configuration for reliability
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 30,
  // More robust SSL configuration that works in all environments
  ssl: {
    rejectUnauthorized: false // Required for Replit deployment
  },
  onnotice: notice => {
    console.log(`DB NOTICE: ${notice.message}`);
  },
  debug: (connection, query, params, types) => {
    if (query.includes('SELECT 1')) return; // Don't log heartbeat queries
    console.log(`DB QUERY: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
  }
});

// Test the connection
client.unsafe("SELECT 1")
  .then(() => console.log("✅ Database connection successful"))
  .catch(err => console.error("❌ Database connection failed:", err.message));

// Export the drizzle instance
export const db = drizzle(client, { schema });
