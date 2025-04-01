/**
 * Supabase Setup Verification Script
 * 
 * This script checks the Supabase configuration by:
 * 1. Verifying that the SUPABASE_URL and SUPABASE_KEY environment variables are set
 * 2. Establishing a connection to the Supabase instance
 * 3. Checking if the required storage buckets exist ('profiles' and 'files')
 * 4. Displaying the configuration status
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseSetup() {
  console.log('');
  console.log('Supabase Setup Verification');
  console.log('==========================');
  
  // Check environment variables
  if (!process.env.SUPABASE_URL) {
    console.error('Error: SUPABASE_URL environment variable is not set.');
    console.error('Please set this variable in your .env file or environment.');
    process.exit(1);
  }
  
  if (!process.env.SUPABASE_KEY) {
    console.warn('Warning: SUPABASE_KEY (anon key) environment variable is not set.');
    console.warn('This key is required for client-side operations.');
  }
  
  if (!process.env.SERVICE_KEY) {
    console.warn('Warning: SERVICE_KEY environment variable is not set.');
    console.warn('This key is required for administrative operations like creating buckets.');
  }
  
  if (process.env.SUPABASE_KEY || process.env.SERVICE_KEY) {
    console.log('✓ Environment variables check passed');
  } else {
    console.error('Error: Neither SUPABASE_KEY nor SERVICE_KEY is set. At least one key is required.');
    process.exit(1);
  }
  
  // Create Supabase client - Use SERVICE_KEY if available, otherwise fall back to SUPABASE_KEY
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_KEY || process.env.SUPABASE_KEY
  );
  
  try {
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase.from('_dummy_query').select('*').limit(1);
    
    if (connectionError) {
      // This specific error is expected and indicates a successful connection
      if (connectionError.message.includes('relation') && connectionError.message.includes('does not exist')) {
        console.log('✓ Supabase connection successful');
      } else {
        console.error('Error: Could not connect to Supabase.');
        console.error(connectionError);
        process.exit(1);
      }
    } else {
      console.log('✓ Supabase connection successful');
    }
    
    // Check storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error: Could not list storage buckets.');
      console.error(bucketsError);
      process.exit(1);
    }
    
    const bucketNames = buckets.map(bucket => bucket.name);
    console.log(`Found ${buckets.length} storage buckets: ${bucketNames.join(', ')}`);
    
    // Check for required buckets
    const requiredBuckets = ['profiles', 'files'];
    const missingBuckets = requiredBuckets.filter(bucket => !bucketNames.includes(bucket));
    
    if (missingBuckets.length > 0) {
      console.error(`Error: The following required buckets are missing: ${missingBuckets.join(', ')}`);
      console.error('Please create these buckets in your Supabase dashboard.');
      console.error('Instructions:');
      console.error('1. Go to your Supabase dashboard at https://app.supabase.com');
      console.error('2. Select your project');
      console.error('3. Navigate to Storage');
      console.error('4. Create the missing buckets with appropriate permissions');
      process.exit(1);
    }
    
    console.log('✓ All required storage buckets exist');
    
    // Final success message
    console.log('');
    console.log('Supabase setup verification complete. All checks passed!');
    console.log('');
    
  } catch (error) {
    console.error('Unexpected error during Supabase setup verification:');
    console.error(error);
    process.exit(1);
  }
}

// Run the check
checkSupabaseSetup()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in checkSupabaseSetup:', error);
    process.exit(1);
  });