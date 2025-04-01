/**
 * Supabase Storage Bucket Creation Script
 * 
 * This script creates the required storage buckets in Supabase:
 * 1. 'profiles' - for storing profile images
 * 2. 'files' - for storing assignment, notes, and other files
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createSupabaseBuckets() {
  console.log('');
  console.log('Supabase Bucket Creation');
  console.log('=======================');
  
  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and/or SERVICE_KEY environment variables are not set.');
    console.error('Please set these variables in your .env file or environment.');
    console.error('Note: Creating buckets requires the SERVICE_KEY, not the anon SUPABASE_KEY.');
    process.exit(1);
  }
  
  // Create Supabase client with service role key (required for creating buckets)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_KEY
  );
  
  try {
    // List existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error: Could not list storage buckets.');
      console.error(listError);
      process.exit(1);
    }
    
    const existingBucketNames = existingBuckets.map(bucket => bucket.name);
    console.log(`Found ${existingBuckets.length} existing storage buckets: ${existingBucketNames.join(', ') || 'none'}`);
    
    // Define required buckets with their configuration
    const requiredBuckets = [
      {
        name: 'profiles',
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit for profile images
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
      },
      {
        name: 'files',
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit for general files
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                          'text/plain']
      }
    ];
    
    // Create missing buckets
    for (const bucketConfig of requiredBuckets) {
      if (!existingBucketNames.includes(bucketConfig.name)) {
        console.log(`Creating bucket: ${bucketConfig.name}...`);
        
        const { data, error } = await supabase.storage.createBucket(
          bucketConfig.name, 
          { 
            public: bucketConfig.public,
            fileSizeLimit: bucketConfig.fileSizeLimit,
            allowedMimeTypes: bucketConfig.allowedMimeTypes
          }
        );
        
        if (error) {
          console.error(`Error creating bucket ${bucketConfig.name}:`, error);
        } else {
          console.log(`✓ Bucket ${bucketConfig.name} created successfully`);
        }
      } else {
        console.log(`✓ Bucket ${bucketConfig.name} already exists`);
      }
    }
    
    // Verify all buckets now exist
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const finalBucketNames = finalBuckets.map(bucket => bucket.name);
    
    const missingBuckets = requiredBuckets
      .map(bucket => bucket.name)
      .filter(bucketName => !finalBucketNames.includes(bucketName));
    
    if (missingBuckets.length > 0) {
      console.error(`Error: Failed to create the following buckets: ${missingBuckets.join(', ')}`);
      process.exit(1);
    }
    
    console.log('');
    console.log('✓ All required storage buckets have been created successfully!');
    console.log('');
    
  } catch (error) {
    console.error('Unexpected error during bucket creation:');
    console.error(error);
    process.exit(1);
  }
}

// Run the creation script
createSupabaseBuckets()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in createSupabaseBuckets:', error);
    process.exit(1);
  });