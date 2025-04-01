/**
 * Supabase Storage Helper Functions
 * 
 * This file provides utilities for uploading files to Supabase Storage.
 * It replaces the local file storage previously used in the application.
 */

const supabase = require('./supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Upload a file to Supabase Storage
 * 
 * @param {Object} file - The file object from multer
 * @param {string} bucket - The Supabase storage bucket name ('profiles' or 'files')
 * @param {string} folder - Optional subfolder within the bucket
 * @returns {Promise<string>} - URL of the uploaded file
 */
async function uploadFileToSupabase(file, bucket, folder = '') {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file or file buffer provided');
    }

    // Generate a unique filename to avoid collisions
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Create the full file path including any folder
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    throw error;
  }
}

/**
 * Upload a profile image to Supabase Storage
 * 
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - URL of the uploaded profile image
 */
async function uploadProfileImage(file) {
  return uploadFileToSupabase(file, 'profiles');
}

/**
 * Upload a document file to Supabase Storage
 * 
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - URL of the uploaded file
 */
async function uploadFile(file) {
  return uploadFileToSupabase(file, 'files');
}

module.exports = {
  uploadFileToSupabase,
  uploadProfileImage,
  uploadFile
};