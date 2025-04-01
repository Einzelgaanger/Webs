import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

interface MulterFile {
  path: string;
  originalname: string;
  mimetype: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Upload a file to Supabase Storage
 * 
 * @param file - The file object from multer
 * @param bucket - The Supabase storage bucket name ('profiles' or 'files')
 * @param folder - Optional subfolder within the bucket
 * @returns URL of the uploaded file
 */
async function uploadFileToSupabase(file: MulterFile, bucket: string, folder = ''): Promise<string> {
  try {
    // Read the file from the temporary location where multer saved it
    const fileBuffer = fs.readFileSync(file.path);
    
    // Create a unique filename to avoid collisions
    const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
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
 * @param file - The file object from multer
 * @returns URL of the uploaded profile image
 */
async function uploadProfileImage(file: MulterFile): Promise<string> {
  return uploadFileToSupabase(file, 'profiles');
}

/**
 * Upload a document file to Supabase Storage
 * 
 * @param file - The file object from multer
 * @returns URL of the uploaded file
 */
async function uploadFile(file: MulterFile): Promise<string> {
  return uploadFileToSupabase(file, 'files');
}

export {
  uploadProfileImage,
  uploadFile,
  MulterFile
}; 