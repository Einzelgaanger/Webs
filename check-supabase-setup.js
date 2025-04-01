/**
 * Supabase Setup Verification Script
 * 
 * This script checks if the required Supabase storage buckets exist
 * and creates them if they don't. It also verifies authentication settings.
 */

// Use CJS-compatible supabase client, avoiding ESM issues
const { createClient } = require('@supabase/supabase-js');

// Configure Supabase client directly in this file
const supabaseUrl = process.env.SUPABASE_URL || 'https://vydljgeqtdjzjtbwimwe.supabase.co';

// Use service role key for admin operations like creating buckets
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzA1MTI3NSwiZXhwIjoyMDU4NjI3Mjc1fQ.ukEatnwsGTRDP7eMOudIEC5imrH6P48-tmIkeoE2IoY';

// Use anon key for regular operations (we'll keep this in the storage helper)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZGxqZ2VxdGRqemp0YndpbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMzk0NjQsImV4cCI6MjA0MzkxNTQ2NH0.w4DjoIIW_QGFi2NMKpvs8TjVKWDtgp2gzEr8fgcmmtM';

// For admin operations, use service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseSetup() {
  console.log('======================================');
  console.log('Supabase Setup Verification');
  console.log('======================================');

  try {
    // Check Supabase connection
    console.log('📡 Checking Supabase connection...');
    
    // Simple Supabase API call to test connection
    const { data: connectionTest, error: connectionError } = await supabase.auth.getSession();
    
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Check for required storage buckets
    console.log('\n📦 Checking storage buckets...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    const existingBuckets = buckets.map(bucket => bucket.name);
    console.log(`Found buckets: ${existingBuckets.length ? existingBuckets.join(', ') : 'none'}`);
    
    // Check if required buckets exist, create them if they don't
    const requiredBuckets = ['profiles', 'files'];
    const missingBuckets = [];
    
    for (const bucketName of requiredBuckets) {
      if (!existingBuckets.includes(bucketName)) {
        console.log(`Creating missing bucket: ${bucketName}`);
        missingBuckets.push(bucketName);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true // Make bucket publicly accessible for easier file access
        });
        
        if (createError) {
          console.error(`Failed to create ${bucketName} bucket: ${createError.message}`);
        } else {
          console.log(`✅ Created ${bucketName} bucket successfully`);
        }
      } else {
        console.log(`✅ Bucket '${bucketName}' exists`);
      }
    }
    
    // Update bucket permissions to ensure they are public
    console.log('\n🔒 Checking bucket permissions...');
    
    for (const bucketName of requiredBuckets) {
      if (existingBuckets.includes(bucketName) || missingBuckets.includes(bucketName)) {
        // Update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });
        
        if (updateError) {
          console.error(`Failed to update ${bucketName} bucket permissions: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${bucketName} bucket to be publicly accessible`);
        }
      }
    }
    
    console.log('\n======================================');
    console.log('Supabase setup verification complete!');
    console.log('======================================');
    
    console.log('\nSuggested Next Steps:');
    console.log('1. Deploy your application to Render');
    console.log('2. Set up environment variables in Render:');
    console.log('   - DATABASE_URL: Your PostgreSQL connection string');
    console.log('   - SUPABASE_URL: ' + (process.env.SUPABASE_URL || 'Your Supabase URL'));
    console.log('   - SUPABASE_KEY: Your Supabase API key (anon public)');
    console.log('   - SESSION_SECRET: A strong random string for session security');
    console.log('   - NODE_ENV: production');
    
  } catch (error) {
    console.error('\n❌ Error during Supabase setup verification:');
    console.error(error);
    process.exit(1);
  }
}

// Run the verification
checkSupabaseSetup();