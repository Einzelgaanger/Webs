import type { Express, Request, Response, RequestHandler } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, fileUpload } from "./auth";
import { fromZodError } from "zod-validation-error";
import {
  insertAssignmentSchema,
  insertNoteSchema,
  insertPastPaperSchema,
  searchSchema
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { searchContent, getSearchSuggestions } from "./search";
import { Session } from "express-session";

interface CustomSession extends Session {
  isAuthenticated?: boolean;
  user?: {
    id: number;
    name: string;
    admissionNumber: string;
    password: string;
    profileImageUrl: string | null;
    rank: number | null;
    role: string | null;
    createdAt: Date;
  };
}

interface CustomRequest extends Request {
  session: CustomSession;
  isAuthenticated(): boolean;
  user: {
    id: number;
  };
}

interface FileStorageResponse {
  id: number;
  name: string;
  url: string;
  type: string;
  path?: string;
  originalFilename?: string;
  mimeType?: string;
}

// Patch to prevent path-to-regexp error with URLs containing colons
process.env.DEBUG_URL = null; // Prevents the error by nullifying the debug URL

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function setupRoutes(app: Express) {
  // Set up auth routes and middleware
  setupAuth(app);

  // Serve static files from the client/public directory
  app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
  
  // Serve uploads directory for file access
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/dashboard/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const activities = await storage.getUserActivities(req.user.id);
      res.json(activities);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/dashboard/deadlines", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const deadlines = await storage.getUpcomingDeadlines(req.user.id);
      res.json(deadlines);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Unit routes
  app.get("/api/units", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const units = await storage.getAllUnits(req.user.id);
      res.json(units);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/units/:unitCode", async (req, res) => {
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
  });

  // Notes routes
  app.get("/api/units/:unitCode/notes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notes = await storage.getNotesByUnit(req.params.unitCode, req.user.id);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/units/:unitCode/notes", fileUpload.single('file'), async (req, res) => {
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
  });

  app.post("/api/units/:unitCode/notes/:noteId/view", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const noteId = parseInt(req.params.noteId);
      await storage.markNoteAsViewed(noteId, req.user.id);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  app.delete("/api/units/:unitCode/notes/:noteId", async (req, res) => {
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
  });

  // Assignment routes
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

  // Past paper routes
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

  // Rankings routes
  app.get("/api/units/:unitCode/rankings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const rankings = await storage.getUnitRankings(req.params.unitCode);
      res.json(rankings);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Search routes
  app.get("/api/search", async (req: CustomRequest, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const result = searchSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { query, type, unitCode } = result.data;
      const results = await searchContent(query, req.user.id, unitCode, type);
      res.json({ results });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get("/api/search/suggestions", async (req: CustomRequest, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const suggestions = await getSearchSuggestions(query);
      res.json({ suggestions });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
  
  // File Serving route
  app.get("/api/files/:fileId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ error: "Invalid file ID" });
      }
      
      const file = await storage.getFileById(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Set appropriate content type
      res.setHeader('Content-Type', file.mimeType);
      
      // Set cache headers for better performance
      if (file.type === 'profile') {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      } else {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
      }
      
      // Set content disposition
      res.setHeader('Content-Disposition', `inline; filename="${file.originalFilename}"`);
      
      // Send the file
      res.sendFile(file.path);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Update the file upload handler
  app.post("/api/upload", fileUpload.single('file'), (async (req: CustomRequest, res: Response) => {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file: FileStorageResponse = {
        id: Date.now(), // Temporary ID
        name: req.file.originalname,
        url: `/uploads/files/${req.file.filename}`,
        type: req.file.mimetype,
        path: req.file.path,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype
      };
      
      return res.json(file);
    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }) as RequestHandler);

  return app;
}
