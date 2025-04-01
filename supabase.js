/**
 * Supabase client configuration
 * 
 * This file sets up the Supabase client for use throughout the application.
 * It's used for storage operations and potentially other Supabase services.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('Warning: Supabase environment variables (SUPABASE_URL and/or SUPABASE_KEY) are not set.');
  console.warn('File uploads and profile images may not work correctly.');
  console.warn('Please set these variables in your .env file or environment.');
}

// Create Supabase client with available environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
// Use service key for server-side operations if available, otherwise fall back to anon key
const supabaseKey = process.env.SERVICE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;