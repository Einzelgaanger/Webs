import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, unique, primaryKey, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  admissionNumber: text("admission_number").notNull().unique(),
  password: text("password").notNull(),
  profileImageUrl: text("profile_image_url"),
  rank: integer("rank"),
  role: text("role").default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: index("users_name_idx").on(table.name),
    admissionNumberIdx: index("users_admissionNumber_idx").on(table.admissionNumber),
  };
});

// Units Table
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  unitCode: text("unit_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Mathematics, Statistics, Data Science, Humanities, etc.
}, (table) => {
  return {
    unitCodeIdx: index("units_unitCode_idx").on(table.unitCode),
    nameIdx: index("units_name_idx").on(table.name),
    categoryIdx: index("units_category_idx").on(table.category),
  };
});

// Notes Table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  searchVector: text("search_vector"),
}, (table) => {
  return {
    titleIdx: index("notes_title_idx").on(table.title),
    unitCodeIdx: index("notes_unitCode_idx").on(table.unitCode),
    userIdIdx: index("notes_userId_idx").on(table.userId),
    createdAtIdx: index("notes_createdAt_idx").on(table.createdAt),
  };
});

// Assignments Table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deadline: timestamp("deadline").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  searchVector: text("search_vector"),
}, (table) => {
  return {
    titleIdx: index("assignments_title_idx").on(table.title),
    unitCodeIdx: index("assignments_unitCode_idx").on(table.unitCode),
    userIdIdx: index("assignments_userId_idx").on(table.userId),
    deadlineIdx: index("assignments_deadline_idx").on(table.deadline),
    createdAtIdx: index("assignments_createdAt_idx").on(table.createdAt),
  };
});

// Past Papers Table
export const pastPapers = pgTable("past_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: text("year").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  searchVector: text("search_vector"),
}, (table) => {
  return {
    titleIdx: index("pastPapers_title_idx").on(table.title),
    yearIdx: index("pastPapers_year_idx").on(table.year),
    unitCodeIdx: index("pastPapers_unitCode_idx").on(table.unitCode),
    userIdIdx: index("pastPapers_userId_idx").on(table.userId),
    createdAtIdx: index("pastPapers_createdAt_idx").on(table.createdAt),
  };
});

// Completed Assignments Table
export const completedAssignments = pgTable("completed_assignments", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => {
  return {
    assignmentUserUnique: unique("completed_assignments_assignment_user_unique").on(table.assignmentId, table.userId),
    assignmentIdIdx: index("completedAssignments_assignmentId_idx").on(table.assignmentId),
    userIdIdx: index("completedAssignments_userId_idx").on(table.userId),
    completedAtIdx: index("completedAssignments_completedAt_idx").on(table.completedAt),
  };
});

// User Note Views Table
export const userNoteViews = pgTable("user_note_views", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => {
  return {
    noteUserUnique: unique("user_note_views_note_user_unique").on(table.noteId, table.userId),
    noteIdIdx: index("userNoteViews_noteId_idx").on(table.noteId),
    userIdIdx: index("userNoteViews_userId_idx").on(table.userId),
    viewedAtIdx: index("userNoteViews_viewedAt_idx").on(table.viewedAt),
  };
});

// User Past Paper Views Table
export const userPaperViews = pgTable("user_paper_views", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull().references(() => pastPapers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => {
  return {
    paperUserUnique: unique("user_paper_views_paper_user_unique").on(table.paperId, table.userId),
    paperIdIdx: index("userPaperViews_paperId_idx").on(table.paperId),
    userIdIdx: index("userPaperViews_userId_idx").on(table.userId),
    viewedAtIdx: index("userPaperViews_viewedAt_idx").on(table.viewedAt),
  };
});

// Activity Log Table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'login', 'assignment', 'note', 'pastpaper', 'profile_update'
  resourceId: integer("resource_id"), // ID of the related resource (assignment, note, etc.)
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("activityLogs_userId_idx").on(table.userId),
    typeIdx: index("activityLogs_type_idx").on(table.type),
    timestampIdx: index("activityLogs_timestamp_idx").on(table.timestamp),
  };
});

// Search Queries Log Table
export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("searchQueries_userId_idx").on(table.userId),
    queryIdx: index("searchQueries_query_idx").on(table.query),
    timestampIdx: index("searchQueries_timestamp_idx").on(table.timestamp),
  };
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: text("read").default("false").notNull(),
  type: text("type").notNull(), // 'assignment', 'note', 'pastpaper', 'system'
  resourceId: integer("resource_id"), // ID of the related resource
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    readIdx: index("notifications_read_idx").on(table.read),
    typeIdx: index("notifications_type_idx").on(table.type),
    createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
  };
});

// File Storage Table
export const fileStorage = pgTable("file_storage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(), // 'profile', 'assignment', 'note', 'pastpaper'
  resourceId: integer("resource_id"), // ID of the related resource
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("fileStorage_userId_idx").on(table.userId),
    typeIdx: index("fileStorage_type_idx").on(table.type),
    uploadedAtIdx: index("fileStorage_uploadedAt_idx").on(table.uploadedAt),
  };
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  admissionNumber: true,
  password: true,
  role: true,
});

export const loginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  password: z.string().min(1, "Password is required"),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  secretKey: z.string().min(1, "Secret key is required"),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(['all', 'notes', 'assignments', 'pastpapers']).optional(),
  unitCode: z.string().optional(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  description: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  title: true,
  description: true,
  deadline: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertPastPaperSchema = createInsertSchema(pastPapers).pick({
  title: true,
  description: true,
  year: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertCompletedAssignmentSchema = createInsertSchema(completedAssignments).pick({
  assignmentId: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(fileStorage).pick({
  filename: true,
  originalFilename: true,
  path: true,
  mimeType: true,
  size: true,
  type: true,
}).extend({
  resourceId: z.number().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>;
export type SearchParams = z.infer<typeof searchSchema>;

export type Unit = typeof units.$inferSelect;

export type Note = typeof notes.$inferSelect & {
  uploadedBy: string;
  uploaderImageUrl?: string;
  viewed: boolean;
};
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Assignment = typeof assignments.$inferSelect & {
  uploadedBy: string;
  completed: boolean;
  completedAt?: Date;
};
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type PastPaper = typeof pastPapers.$inferSelect & {
  uploadedBy: string;
  uploaderImageUrl?: string;
  viewed: boolean;
};
export type InsertPastPaper = z.infer<typeof insertPastPaperSchema>;

export type FileStorage = typeof fileStorage.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type InsertCompletedAssignment = z.infer<typeof insertCompletedAssignmentSchema>;

export type Activity = {
  id: number;
  type: 'assignment' | 'note' | 'pastpaper' | 'rank';
  title: string;
  unitCode: string;
  timestamp: Date;
};

export type Ranking = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  position: number;
  completedAssignments: number;
  averageCompletionTime: string;
  recentCompletions: Array<{
    assignmentId: number;
    completedAt: Date;
    title: string;
    completionTime: string;
  }>;
  overallRank: number;
};

export type SearchResult = {
  id: number;
  type: 'note' | 'assignment' | 'pastpaper';
  title: string;
  description: string;
  unitCode: string;
  createdAt: Date;
  fileUrl?: string;
  uploadedBy: string;
};
