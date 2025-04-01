/**
 * Supabase client configuration
 * 
 * This file sets up the Supabase client for use throughout the application.
 * It's used for storage operations and potentially other Supabase services.
 */

const { createClient } = require('@supabase/supabase-js');

// Configure Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://vydljgeqtdjzjtbwimwe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzk0NjQsImV4cCI6MjA0MzkxNTQ2NH0.w4DjoIIW_QGFi2NMKpvs8TjVKWDtgp2gzEr8fgcmmtM';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;