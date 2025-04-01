import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  profilePicture: text('profile_picture'),
  isActive: boolean('is_active').default(true)
});

// Units table
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Notes table
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  unitId: integer('unit_id').references(() => units.id),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isPublic: boolean('is_public').default(false)
});

// Assignments table
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date').notNull(),
  unitId: integer('unit_id').references(() => units.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  maxScore: integer('max_score').notNull()
});

// Past Papers table
export const pastPapers = pgTable('past_papers', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  unitId: integer('unit_id').references(() => units.id),
  filePath: text('file_path').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Completed Assignments table
export const completedAssignments = pgTable('completed_assignments', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').references(() => assignments.id),
  userId: integer('user_id').references(() => users.id),
  score: integer('score'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  feedback: text('feedback'),
  filePath: text('file_path')
});

// User Note Views table
export const userNoteViews = pgTable('user_note_views', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  noteId: integer('note_id').references(() => notes.id),
  viewedAt: timestamp('viewed_at').defaultNow()
});

// User Paper Views table
export const userPaperViews = pgTable('user_paper_views', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  paperId: integer('paper_id').references(() => pastPapers.id),
  viewedAt: timestamp('viewed_at').defaultNow()
}); 