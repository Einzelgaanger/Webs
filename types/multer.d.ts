// Type definitions for multer 1.4.5
// Project: https://github.com/expressjs/multer
// Definition by: Student Performance Tracker Team

import { Request } from 'express';

declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }

    interface FileFilterCallback {
      (error: Error | null, acceptFile: boolean): void;
    }

    interface StorageEngine {
      _handleFile(req: Request, file: Express.Multer.File, callback: (error?: any, info?: Partial<File>) => void): void;
      _removeFile(req: Request, file: Express.Multer.File, callback: (error: Error) => void): void;
    }

    interface DiskStorageOptions {
      destination?: string | ((req: any, file: any, callback: (error: Error | null, destination: string) => void) => void);
      filename?: (req: any, file: any, callback: (error: Error | null, filename: string) => void) => void;
    }

    interface MulterOptions {
      dest?: string;
      storage?: StorageEngine;
      limits?: {
        fieldNameSize?: number;
        fieldSize?: number;
        fields?: number;
        fileSize?: number;
        files?: number;
        parts?: number;
        headerPairs?: number;
      };
      fileFilter?: (req: any, file: any, callback: FileFilterCallback) => void;
      preservePath?: boolean;
    }
  }
}

interface MulterError extends Error {
  code: string;
  field?: string;
  storageErrors?: Error[];
}

interface Multer {
  (options?: Express.Multer.MulterOptions): any;
  diskStorage(options: Express.Multer.DiskStorageOptions): Express.Multer.StorageEngine;
  memoryStorage(): Express.Multer.StorageEngine;
  MulterError: typeof MulterError;
}

declare module 'multer' {
  const multer: Multer;
  export default multer;
  export type File = Express.Multer.File;
  export type FileFilterCallback = Express.Multer.FileFilterCallback;
  export type MulterError = MulterError;
}