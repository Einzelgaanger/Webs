/**
 * Database Setup Script for Student Performance Tracker
 * 
 * This script initializes the database with the initial data:
 * - Creates tables based on the schema
 * - Adds 6 academic units
 * - Creates 1 teacher user and 48 student users
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './StudentPerformanceTracker006/shared/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function setupDatabase() {
  console.log('🔧 DATABASE SETUP: Starting initialization process...');
  
  try {
    // Database connection
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('🔌 Connecting to database...');
    const client = postgres(DATABASE_URL, { 
      ssl: { rejectUnauthorized: false },
      max: 1
    });
    const db = drizzle(client);
    
    // Use execute SQL to create tables directly
    console.log('📝 Creating tables based on schema...');
    
    try {
      // Clean up existing tables if needed
      console.log('🧹 Cleaning up existing tables...');
      await db.execute(schema.sql`DROP TABLE IF EXISTS search_queries CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS activity_logs CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS notifications CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS file_storage CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS user_paper_views CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS user_note_views CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS completed_assignments CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS past_papers CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS assignments CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS notes CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS units CASCADE`);
      await db.execute(schema.sql`DROP TABLE IF EXISTS users CASCADE`);
      console.log('✅ Tables cleaned up successfully');
      
      // Create tables
      console.log('📊 Creating new tables...');
      
      // Create users table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          admission_number TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          profile_image_url TEXT,
          rank INTEGER,
          role TEXT DEFAULT 'student',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indices on users table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS users_name_idx ON users (name)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS users_admissionNumber_idx ON users (admission_number)`);
      
      // Create units table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS units (
          id SERIAL PRIMARY KEY,
          unit_code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL
        )
      `);
      
      // Create indices on units table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS units_unitCode_idx ON units (unit_code)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS units_name_idx ON units (name)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS units_category_idx ON units (category)`);
      
      // Create notes table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          search_vector TEXT
        )
      `);
      
      // Create indices on notes table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notes_title_idx ON notes (title)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notes_unitCode_idx ON notes (unit_code)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notes_userId_idx ON notes (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notes_createdAt_idx ON notes (created_at)`);
      
      // Create assignments table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          deadline TIMESTAMP NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          search_vector TEXT
        )
      `);
      
      // Create indices on assignments table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS assignments_title_idx ON assignments (title)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS assignments_unitCode_idx ON assignments (unit_code)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS assignments_userId_idx ON assignments (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS assignments_deadline_idx ON assignments (deadline)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS assignments_createdAt_idx ON assignments (created_at)`);
      
      // Create past_papers table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS past_papers (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          year TEXT NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          search_vector TEXT
        )
      `);
      
      // Create indices on past_papers table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS pastPapers_title_idx ON past_papers (title)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS pastPapers_year_idx ON past_papers (year)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS pastPapers_unitCode_idx ON past_papers (unit_code)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS pastPapers_userId_idx ON past_papers (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS pastPapers_createdAt_idx ON past_papers (created_at)`);
      
      // Create completed_assignments table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS completed_assignments (
          id SERIAL PRIMARY KEY,
          assignment_id INTEGER NOT NULL REFERENCES assignments(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT completed_assignments_assignment_user_unique UNIQUE (assignment_id, user_id)
        )
      `);
      
      // Create indices on completed_assignments table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS completedAssignments_assignmentId_idx ON completed_assignments (assignment_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS completedAssignments_userId_idx ON completed_assignments (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS completedAssignments_completedAt_idx ON completed_assignments (completed_at)`);
      
      // Create user_note_views table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS user_note_views (
          id SERIAL PRIMARY KEY,
          note_id INTEGER NOT NULL REFERENCES notes(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT user_note_views_note_user_unique UNIQUE (note_id, user_id)
        )
      `);
      
      // Create indices on user_note_views table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userNoteViews_noteId_idx ON user_note_views (note_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userNoteViews_userId_idx ON user_note_views (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userNoteViews_viewedAt_idx ON user_note_views (viewed_at)`);
      
      // Create user_paper_views table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS user_paper_views (
          id SERIAL PRIMARY KEY,
          paper_id INTEGER NOT NULL REFERENCES past_papers(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT user_paper_views_paper_user_unique UNIQUE (paper_id, user_id)
        )
      `);
      
      // Create indices on user_paper_views table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userPaperViews_paperId_idx ON user_paper_views (paper_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userPaperViews_userId_idx ON user_paper_views (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS userPaperViews_viewedAt_idx ON user_paper_views (viewed_at)`);
      
      // Create file_storage table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS file_storage (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          type TEXT NOT NULL,
          resource_id INTEGER,
          uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indices on file_storage table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS fileStorage_userId_idx ON file_storage (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS fileStorage_type_idx ON file_storage (type)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS fileStorage_uploadedAt_idx ON file_storage (uploaded_at)`);
      
      // Create notifications table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN NOT NULL DEFAULT FALSE,
          type TEXT NOT NULL,
          resource_id INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indices on notifications table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notifications_userId_idx ON notifications (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications (read)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications (type)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications (created_at)`);
      
      // Create activity_logs table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          type TEXT NOT NULL,
          resource_id INTEGER,
          description TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indices on activity_logs table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS activityLogs_userId_idx ON activity_logs (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS activityLogs_type_idx ON activity_logs (type)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS activityLogs_timestamp_idx ON activity_logs (timestamp)`);
      
      // Create search_queries table
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS search_queries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          query TEXT NOT NULL,
          result_count INTEGER NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indices on search_queries table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS searchQueries_userId_idx ON search_queries (user_id)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS searchQueries_query_idx ON search_queries (query)`);
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS searchQueries_timestamp_idx ON search_queries (timestamp)`);
      
      // Create session table for connect-pg-simple
      await db.execute(schema.sql`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )
      `);
      
      // Create index on session table
      await db.execute(schema.sql`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
      
      console.log('✅ Tables created successfully');
      
      // Create a teacher user
      console.log('👨‍🏫 Creating teacher user...');
      const teacherPassword = await hashPassword('sds#website');
      await db.insert(schema.users).values({
        name: 'Maverick',
        admissionNumber: 'TEACHER001',
        password: teacherPassword,
        role: 'teacher',
        rank: 1
      });
      
      // Create student users
      console.log('👩‍🎓 Creating student users...');
      const defaultPassword = await hashPassword('sds#website');
      
      for (let i = 1; i <= 48; i++) {
        const studentId = i.toString().padStart(3, '0');
        await db.insert(schema.users).values({
          name: `Student ${i}`,
          admissionNumber: `SDS24/${studentId}`,
          password: defaultPassword,
          role: 'student',
          rank: Math.ceil(i / 8) // Assign ranks 1-6 fairly evenly
        });
      }
      
      // Create course units
      console.log('📚 Creating course units...');
      const units = [
        {
          unitCode: 'MAT2101',
          name: 'Calculus',
          description: 'Advanced calculus concepts for science students',
          category: 'Mathematics'
        },
        {
          unitCode: 'MAT2102',
          name: 'Linear Algebra',
          description: 'Matrix operations and linear transformations',
          category: 'Mathematics'
        },
        {
          unitCode: 'STA2101',
          name: 'Probability Theory',
          description: 'Fundamentals of probability and random variables',
          category: 'Statistics'
        },
        {
          unitCode: 'DAT2101',
          name: 'Data Analysis',
          description: 'Methods for analyzing and interpreting datasets',
          category: 'Data Science'
        },
        {
          unitCode: 'DAT2102',
          name: 'Machine Learning',
          description: 'Introduction to machine learning algorithms',
          category: 'Data Science'
        },
        {
          unitCode: 'HED2101',
          name: 'Health Education',
          description: 'Principles of health and wellness education',
          category: 'Humanities'
        }
      ];
      
      for (const unit of units) {
        await db.insert(schema.units).values(unit);
      }
      
      console.log('✅ DATABASE SETUP: Completed successfully!');
    } catch (error) {
      console.error('❌ Error during table setup:', error);
      throw error;
    }
    
    // Close the connection
    await client.end();
    
  } catch (error) {
    console.error('❌ DATABASE SETUP FAILED:', error);
    process.exit(1);
  }
}

setupDatabase();