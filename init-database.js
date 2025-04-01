#!/usr/bin/env node

/**
 * Database Initialization Script for Student Performance Tracker
 */

const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const fs = require('fs');

// Make sure we have database credentials
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const UNITS = [
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

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function initDatabase() {
  console.log('🔧 DATABASE SETUP: Starting initialization process...');
  
  try {
    // Create a connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Clean up existing tables if needed
    console.log('🧹 Cleaning up existing tables...');
    await pool.query('DROP TABLE IF EXISTS search_queries CASCADE');
    await pool.query('DROP TABLE IF EXISTS activity_logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    await pool.query('DROP TABLE IF EXISTS file_storage CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_paper_views CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_note_views CASCADE');
    await pool.query('DROP TABLE IF EXISTS completed_assignments CASCADE');
    await pool.query('DROP TABLE IF EXISTS past_papers CASCADE');
    await pool.query('DROP TABLE IF EXISTS assignments CASCADE');
    await pool.query('DROP TABLE IF EXISTS notes CASCADE');
    await pool.query('DROP TABLE IF EXISTS units CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS session CASCADE');
    console.log('✅ Tables cleaned up successfully');
    
    // Create tables
    console.log('📊 Creating new tables...');
    
    // Create users table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS users_name_idx ON users (name)');
    await pool.query('CREATE INDEX IF NOT EXISTS users_admissionNumber_idx ON users (admission_number)');
    
    // Create units table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS units (
        id SERIAL PRIMARY KEY,
        unit_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL
      )
    `);
    
    // Create indices on units table
    await pool.query('CREATE INDEX IF NOT EXISTS units_unitCode_idx ON units (unit_code)');
    await pool.query('CREATE INDEX IF NOT EXISTS units_name_idx ON units (name)');
    await pool.query('CREATE INDEX IF NOT EXISTS units_category_idx ON units (category)');
    
    // Create notes table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS notes_title_idx ON notes (title)');
    await pool.query('CREATE INDEX IF NOT EXISTS notes_unitCode_idx ON notes (unit_code)');
    await pool.query('CREATE INDEX IF NOT EXISTS notes_userId_idx ON notes (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS notes_createdAt_idx ON notes (created_at)');
    
    // Create assignments table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS assignments_title_idx ON assignments (title)');
    await pool.query('CREATE INDEX IF NOT EXISTS assignments_unitCode_idx ON assignments (unit_code)');
    await pool.query('CREATE INDEX IF NOT EXISTS assignments_userId_idx ON assignments (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS assignments_deadline_idx ON assignments (deadline)');
    await pool.query('CREATE INDEX IF NOT EXISTS assignments_createdAt_idx ON assignments (created_at)');
    
    // Create past_papers table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS pastPapers_title_idx ON past_papers (title)');
    await pool.query('CREATE INDEX IF NOT EXISTS pastPapers_year_idx ON past_papers (year)');
    await pool.query('CREATE INDEX IF NOT EXISTS pastPapers_unitCode_idx ON past_papers (unit_code)');
    await pool.query('CREATE INDEX IF NOT EXISTS pastPapers_userId_idx ON past_papers (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS pastPapers_createdAt_idx ON past_papers (created_at)');
    
    // Create completed_assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS completed_assignments (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT completed_assignments_assignment_user_unique UNIQUE (assignment_id, user_id)
      )
    `);
    
    // Create indices on completed_assignments table
    await pool.query('CREATE INDEX IF NOT EXISTS completedAssignments_assignmentId_idx ON completed_assignments (assignment_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS completedAssignments_userId_idx ON completed_assignments (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS completedAssignments_completedAt_idx ON completed_assignments (completed_at)');
    
    // Create user_note_views table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_note_views (
        id SERIAL PRIMARY KEY,
        note_id INTEGER NOT NULL REFERENCES notes(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT user_note_views_note_user_unique UNIQUE (note_id, user_id)
      )
    `);
    
    // Create indices on user_note_views table
    await pool.query('CREATE INDEX IF NOT EXISTS userNoteViews_noteId_idx ON user_note_views (note_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS userNoteViews_userId_idx ON user_note_views (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS userNoteViews_viewedAt_idx ON user_note_views (viewed_at)');
    
    // Create user_paper_views table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_paper_views (
        id SERIAL PRIMARY KEY,
        paper_id INTEGER NOT NULL REFERENCES past_papers(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT user_paper_views_paper_user_unique UNIQUE (paper_id, user_id)
      )
    `);
    
    // Create indices on user_paper_views table
    await pool.query('CREATE INDEX IF NOT EXISTS userPaperViews_paperId_idx ON user_paper_views (paper_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS userPaperViews_userId_idx ON user_paper_views (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS userPaperViews_viewedAt_idx ON user_paper_views (viewed_at)');
    
    // Create file_storage table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS fileStorage_userId_idx ON file_storage (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS fileStorage_type_idx ON file_storage (type)');
    await pool.query('CREATE INDEX IF NOT EXISTS fileStorage_uploadedAt_idx ON file_storage (uploaded_at)');
    
    // Create notifications table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS notifications_userId_idx ON notifications (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications (read)');
    await pool.query('CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications (type)');
    await pool.query('CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications (created_at)');
    
    // Create activity_logs table
    await pool.query(`
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
    await pool.query('CREATE INDEX IF NOT EXISTS activityLogs_userId_idx ON activity_logs (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS activityLogs_type_idx ON activity_logs (type)');
    await pool.query('CREATE INDEX IF NOT EXISTS activityLogs_timestamp_idx ON activity_logs (timestamp)');
    
    // Create search_queries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        query TEXT NOT NULL,
        result_count INTEGER NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indices on search_queries table
    await pool.query('CREATE INDEX IF NOT EXISTS searchQueries_userId_idx ON search_queries (user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS searchQueries_query_idx ON search_queries (query)');
    await pool.query('CREATE INDEX IF NOT EXISTS searchQueries_timestamp_idx ON search_queries (timestamp)');
    
    // Create session table for connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    
    // Create index on session table
    await pool.query('CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")');
    
    console.log('✅ Tables created successfully');
    
    // Create a teacher user
    console.log('👨‍🏫 Creating teacher user...');
    const teacherPassword = await hashPassword('sds#website');
    await pool.query(`
      INSERT INTO users (name, admission_number, password, role, rank)
      VALUES ('Maverick', 'TEACHER001', $1, 'teacher', 1)
    `, [teacherPassword]);
    
    // Create student users
    console.log('👩‍🎓 Creating student users...');
    const defaultPassword = await hashPassword('sds#website');
    
    for (let i = 1; i <= 48; i++) {
      const studentId = i.toString().padStart(3, '0');
      const rank = Math.ceil(i / 8); // Assign ranks 1-6 fairly evenly
      await pool.query(`
        INSERT INTO users (name, admission_number, password, role, rank)
        VALUES ($1, $2, $3, 'student', $4)
      `, [`Student ${i}`, `SDS24/${studentId}`, defaultPassword, rank]);
    }
    
    // Create course units
    console.log('📚 Creating course units...');
    for (const unit of UNITS) {
      await pool.query(`
        INSERT INTO units (unit_code, name, description, category)
        VALUES ($1, $2, $3, $4)
      `, [unit.unitCode, unit.name, unit.description, unit.category]);
    }
    
    console.log('✅ DATABASE SETUP: Completed successfully!');
    await pool.end();
    
  } catch (error) {
    console.error('❌ DATABASE SETUP FAILED:', error);
    process.exit(1);
  }
}

// Run the initialization
initDatabase();