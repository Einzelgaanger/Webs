/**
 * Supabase Storage Helper Functions
 * 
 * This file provides utilities for uploading files to Supabase Storage.
 * It replaces the local file storage previously used in the application.
 */

const path = require('path');
const fs = require('fs');
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
    // Create a unique file path
    const fileName = `${Date.now()}_${path.basename(file.originalname || file.path || 'file')}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload file to Supabase Storage - using buffer from memory storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (err) {
    console.error('File upload error:', err);
    throw new Error('Failed to upload file to storage');
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