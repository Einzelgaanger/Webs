/**
 * File Storage Service
 * 
 * Handles uploading and retrieving files for the Student Performance Tracker
 * This is a direct file system implementation that replaces Supabase storage
 */

import fs from 'fs';
import path from 'path';
import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PROFILES_DIR = path.join(UPLOADS_DIR, 'profiles');
const FILES_DIR = path.join(UPLOADS_DIR, 'files');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR);
}
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR);
}

// Define storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const isProfile = req.originalUrl.includes('/profile') || req.originalUrl.includes('/auth/register');
    cb(null, isProfile ? PROFILES_DIR : FILES_DIR);
  },
  filename: function(req, file, cb) {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

// Define file filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: Express.Multer.FileFilterCallback) => {
  // Accept images, PDFs, documents
  const acceptedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and office documents are allowed.'));
  }
};

// Create upload middleware
export const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Upload a profile image
 * 
 * @param file The uploaded file
 * @returns URL to the uploaded file
 */
export async function uploadProfileImage(file: Express.Multer.File): Promise<string> {
  // File is already saved by multer, just return the URL
  return `/uploads/profiles/${path.basename(file.path)}`;
}

/**
 * Upload a document file (assignments, notes, papers)
 * 
 * @param file The uploaded file
 * @returns URL to the uploaded file
 */
export async function uploadFile(file: Express.Multer.File): Promise<string> {
  // File is already saved by multer, just return the URL
  return `/uploads/files/${path.basename(file.path)}`;
}

/**
 * Serves static files from the uploads directory
 * 
 * @param req Express request object
 * @param res Express response object
 */
export function serveFile(req: Request, res: Response): void {
  const filePath = req.path.replace('/uploads/', '');
  const fullPath = path.join(UPLOADS_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    res.status(404).send('File not found');
    return;
  }
  
  res.sendFile(fullPath);
}

/**
 * Error handler for file uploads
 */
export function handleUploadError(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      return;
    }
    res.status(400).json({ message: `Upload error: ${err.message}` });
    return;
  }
  
  if (err) {
    res.status(400).json({ message: err.message });
    return;
  }
  
  next();
}

/**
 * Deletes a file from the uploads directory
 * 
 * @param fileUrl URL of the file to delete
 * @returns true if successful, false otherwise
 */
export function deleteFile(fileUrl: string): boolean {
  try {
    if (!fileUrl.startsWith('/uploads/')) {
      return false;
    }
    
    const filePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(UPLOADS_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }
    
    fs.unlinkSync(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}