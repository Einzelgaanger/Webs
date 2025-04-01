/**
 * Enhanced entry point for Student Performance Tracker
 * 
 * This module sets up the Express server with error handling for path-to-regexp issues
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import session, { Session } from 'express-session';
import { json, urlencoded } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { storage } from './storage';
import { setupAuth, fileUpload, profileUpload, hashPassword, comparePasswords } from './auth';
import passport from 'passport';
import { fromZodError } from 'zod-validation-error';
import {
  insertAssignmentSchema,
  insertNoteSchema,
  insertPastPaperSchema,
  passwordUpdateSchema,
  forgotPasswordSchema
} from '../shared/schema';

// Extend Express.Request to include authenticated user properties
declare global {
  namespace Express {
    interface User {
      id: number;
      name: string;
      admissionNumber: string;
      password: string;
      profileImageUrl: string | null;
      rank: number | null;
      role: string | null;
    }
  }
}

type RequestWithAuth = Request & {
  user: Express.User;
  isAuthenticated(): boolean;
};

type AuthHandler = (
  req: RequestWithAuth,
  res: Response,
  next?: NextFunction
) => Promise<void | Response> | void;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

const startApp = () => {
  const app = express();
  
  // Basic middleware
  app.use(json());
  app.use(urlencoded({ extended: true }));
  
  // Set up auth (custom authentication middleware)
  setupAuth(app);
  
  // Create upload directories if they don't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const profilesDir = path.join(uploadsDir, 'profiles');
  const filesDir = path.join(uploadsDir, 'files');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(profilesDir, { recursive: true });
  fs.mkdirSync(filesDir, { recursive: true });
  
  // Serve upload directories
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // ========== AUTH ROUTES ==========
  
  app.post("/api/login", passport.authenticate("local"), ((req: RequestWithAuth, res: Response) => {
    res.status(200).json(req.user);
  }) as RequestHandler);

  app.post("/api/logout", ((req: RequestWithAuth, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  }) as RequestHandler);

  app.get("/api/user", ((req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  }) as RequestHandler);
  
  // Update password
  app.patch("/api/user/password", (async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const result = passwordUpdateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const { currentPassword, newPassword } = result.data;
      const user = await storage.getUser(req.user.id);
      
      // Enhanced password verification with better logging
      let isCurrentPasswordValid = false;
      
      try {
        isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
        
        // Special check for default password with case flexibility
        if (!isCurrentPasswordValid && 
            (currentPassword === 'sds#website' || currentPassword.toLowerCase() === 'sds#website')) {
          console.log('Using flexible matching for default password in password update');
          isCurrentPasswordValid = true;
        }
      } catch (err) {
        console.error('Error verifying current password:', err);
      }
      
      if (!user || !isCurrentPasswordValid) {
        console.log(`Failed password update attempt - current password validation failed for user: ${user?.name}`);
        return res.status(400).send("Current password is incorrect");
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      
      // Update the session user data so they can stay logged in
      req.user.password = hashedPassword;
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler);
  
  // Forgot Password
  app.post("/api/forgot-password", (async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      
      const { name, admissionNumber, secretKey } = result.data;
      
      console.log(`🔐 PASSWORD RESET ATTEMPT - Name: "${name}", Admission: "${admissionNumber}"`);
      
      // Simple fixed secret key for initial demo - should be environment variable in production
      if (secretKey !== 'passpass!') {
        return res.status(400).json({ error: "Invalid secret key" });
      }
      
      // Find the user
      const user = await storage.getUserByCredentials(name, admissionNumber);
      
      if (!user) {
        console.log(`❌ PASSWORD RESET FAILED: User not found - Name: "${name}", Admission: "${admissionNumber}"`);
        return res.status(400).json({ error: "User not found" });
      }
      
      // Reset password to default
      const defaultPassword = 'sds#website';
      const hashedPassword = await hashPassword(defaultPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      console.log(`✅ PASSWORD RESET SUCCESS: Password reset to default for ${user.name}`);
      res.status(200).json({ success: true, message: "Password has been reset to the default value" });
    } catch (err) {
      console.error('Error in forgot password:', err);
      next(err);
    }
  }) as RequestHandler);
  
  // Profile image upload
  app.post("/api/user/profile-image", profileUpload.single('image'), (async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }
      
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await storage.updateUserProfileImage(req.user.id, imageUrl);
      
      // Update the session user data
      req.user.profileImageUrl = imageUrl;
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler);
  
  // ========== DASHBOARD ROUTES ==========
  
  app.get("/api/dashboard/stats", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);

  app.get("/api/dashboard/activities", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const activities = await storage.getUserActivities(req.user.id);
      res.json(activities);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);

  app.get("/api/dashboard/deadlines", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const deadlines = await storage.getUpcomingDeadlines(req.user.id);
      res.json(deadlines);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);
  
  // ========== UNIT ROUTES ==========
  
  app.get("/api/units", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const units = await storage.getAllUnits(req.user.id);
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);

  app.get("/api/units/:unitCode", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const unit = await storage.getUnitByCode(req.params.unitCode);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);
  
  // ========== NOTES ROUTES ==========
  
  app.get("/api/units/:unitCode/notes", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notes = await storage.getNotesByUnit(req.params.unitCode, req.user.id);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);

  app.post("/api/units/:unitCode/notes", fileUpload.single('file'), (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const result = insertNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const fileUrl = req.file ? `/uploads/files/${req.file.filename}` : null;
      
      const note = await storage.createNote({
        ...req.body,
        unitCode: req.params.unitCode,
        fileUrl,
        userId: req.user.id
      });
      
      res.status(201).json(note);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);

  app.post("/api/units/:unitCode/notes/:noteId/view", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const noteId = parseInt(req.params.noteId);
      await storage.markNoteAsViewed(noteId, req.user.id);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);
  
  app.delete("/api/units/:unitCode/notes/:noteId", (async (req: RequestWithAuth, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const noteId = parseInt(req.params.noteId);
      const note = await storage.deleteNote(noteId, req.user.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found or you don't have permission to delete it" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }) as RequestHandler);
  
  // ========== ASSIGNMENT ROUTES ==========
  
  app.get("/api/units/:unitCode/assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const assignments = await storage.getAssignmentsByUnit(req.params.unitCode, req.user.id);
      res.json(assignments);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/units/:unitCode/assignments", fileUpload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Convert the deadline string to a Date object for validation
      let deadlineDate: Date | null = null;
      try {
        if (req.body.deadline) {
          deadlineDate = new Date(req.body.deadline);
          
          // Check if deadline is at least 10 hours from now
          const now = new Date();
          const minDeadline = new Date(now.getTime() + 10 * 60 * 60 * 1000); // 10 hours from now
          
          if (deadlineDate < minDeadline) {
            return res.status(400).json({ 
              error: "Deadline must be at least 10 hours in the future" 
            });
          }
        }
      } catch (error) {
        return res.status(400).json({ 
          error: "Invalid date format for deadline" 
        });
      }

      const result = insertAssignmentSchema.safeParse({
        ...req.body,
        deadline: deadlineDate
      });
      
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const fileUrl = req.file ? `/uploads/files/${req.file.filename}` : null;
      
      const assignment = await storage.createAssignment({
        ...result.data,
        unitCode: req.params.unitCode,
        fileUrl,
        userId: req.user.id
      });
      
      res.status(201).json(assignment);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/units/:unitCode/assignments/:assignmentId/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const result = await storage.completeAssignment(assignmentId, req.user.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  app.delete("/api/units/:unitCode/assignments/:assignmentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const assignment = await storage.deleteAssignment(assignmentId, req.user.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found or you don't have permission to delete it" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  // ========== PAST PAPER ROUTES ==========
  
  app.get("/api/units/:unitCode/pastpapers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pastPapers = await storage.getPastPapersByUnit(req.params.unitCode, req.user.id);
      res.json(pastPapers);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/units/:unitCode/pastpapers", fileUpload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const result = insertPastPaperSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const fileUrl = req.file ? `/uploads/files/${req.file.filename}` : null;
      
      const pastPaper = await storage.createPastPaper({
        ...req.body,
        unitCode: req.params.unitCode,
        fileUrl,
        userId: req.user.id
      });
      
      res.status(201).json(pastPaper);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/units/:unitCode/pastpapers/:paperId/view", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const paperId = parseInt(req.params.paperId);
      await storage.markPastPaperAsViewed(paperId, req.user.id);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  app.delete("/api/units/:unitCode/pastpapers/:paperId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const paperId = parseInt(req.params.paperId);
      const paper = await storage.deletePastPaper(paperId, req.user.id);
      if (!paper) {
        return res.status(404).json({ error: "Past paper not found or you don't have permission to delete it" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  // ========== RANKINGS ROUTES ==========
  
  app.get("/api/units/:unitCode/rankings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const rankings = await storage.getUnitRankings(req.params.unitCode);
      res.json(rankings);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  // ========== SEARCH FUNCTIONALITY ==========
  
  app.get("/api/search/:unitCode", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { unitCode } = req.params;
      const { query, type } = req.query as { query?: string, type?: string };
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const searchResults = {
        notes: [],
        assignments: [],
        pastPapers: []
      };
      
      // Normalize the search query
      const searchQuery = query.toLowerCase().trim();
      
      // Filter function for search
      const matchesSearch = (item: any) => {
        return (
          (item.title && item.title.toLowerCase().includes(searchQuery)) || 
          (item.description && item.description.toLowerCase().includes(searchQuery))
        );
      };
      
      // Search by type or search all types if not specified
      if (!type || type === 'notes') {
        const notes = await storage.getNotesByUnit(unitCode, req.user.id);
        searchResults.notes = notes.filter(matchesSearch);
      }
      
      if (!type || type === 'assignments') {
        const assignments = await storage.getAssignmentsByUnit(unitCode, req.user.id);
        searchResults.assignments = assignments.filter(matchesSearch);
      }
      
      if (!type || type === 'pastPapers') {
        const pastPapers = await storage.getPastPapersByUnit(unitCode, req.user.id);
        searchResults.pastPapers = pastPapers.filter(matchesSearch);
      }
      
      res.json(searchResults);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  // ========== ERROR HANDLING ==========
  
  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  });
  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });
  
  // Start server
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
  
  return server;
}

export { startApp };