// Declaration merging to add session properties to Express.Request
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      name: string;
      admissionNumber: string;
      role: string;
      profileImageUrl: string | null;
    };
    isAuthenticated?: boolean;
    resetToken?: string;
    resetTokenExpiry?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
      file?: any;
      files?: any;
      body: any;
      params: any;
      query: any;
    }
  }
}