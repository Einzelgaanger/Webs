/**
 * Supabase Storage Helper Functions
 * 
 * This file provides utilities for uploading files to Supabase Storage.
 * It replaces the local file storage previously used in the application.
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

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
    // Read the file from the temporary location where multer saved it
    const fileBuffer = fs.readFileSync(file.path);
    
    // Create a unique filename to avoid collisions
    const fileName = `${Date.now()}_${path.basename(file.originalname || 'file')}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    // Delete the temporary file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn('Failed to delete temporary file:', err);
    }
    
    return urlData.publicUrl;
  } catch (err) {
    console.error('File upload error:', err);
    throw err;
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
  uploadProfileImage,
  uploadFile
};