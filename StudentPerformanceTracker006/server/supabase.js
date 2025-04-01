/**
 * Supabase client configuration
 * 
 * This file sets up the Supabase client for use throughout the application.
 * It's used for storage operations and potentially other Supabase services.
 */

const { createClient } = require('@supabase/supabase-js');

// Read Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://vydljgeqtdjzjtbwimwe.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNTEyNzUsImV4cCI6MjA1ODYyNzI3NX0.gUunHBcVeuWzpwm6222dI_2K2zK3CCiy-UewEhp848k';

// Create and export the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;