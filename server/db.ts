import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from './schema';

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file');
  console.error('Example: postgres://username:password@localhost:5432/database_name');
  process.exit(1);
}

// Enhanced database connection setup with better error handling
const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for some hosted PostgreSQL services
  } : false, // Disable SSL for local development
  idle_timeout: 20,
  connect_timeout: 30,
  max: 10,
  transform: {
    undefined: null,
  },
  // Add connection retry logic
  retry: {
    retries: 3,
    backoff: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  },
});

// Create Drizzle ORM instance
export const db = drizzle(sql, { schema });

// Function to test database connection
export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Connection details:', {
      url: connectionString ? 'DATABASE_URL is set' : 'DATABASE_URL is not set',
      ssl: process.env.NODE_ENV === 'production',
      maxConnections: 10,
    });
    return false;
  }
}

// Function to run migrations
export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migrations failed:', error);
    throw error;
  }
}

// Export the raw SQL client for direct queries if needed
export { sql };
